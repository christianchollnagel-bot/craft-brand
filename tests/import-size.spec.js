import { test, expect } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { PNG } from 'pngjs';

test('PNG real acima de 10 MiB abre e exporta com transparência', async ({ page }, testInfo) => {
  const source = new PNG({ width: 1800, height: 1600 });
  for (let i = 0; i < source.data.length; i += 4) {
    source.data[i] = 255; source.data[i + 1] = 122; source.data[i + 2] = 0; source.data[i + 3] = 128;
  }
  const bytes = PNG.sync.write(source, { deflateLevel: 0, filterType: 0 });
  expect(bytes.length).toBeGreaterThan(10 * 1024 * 1024);
  expect(bytes.length).toBeLessThan(50 * 1024 * 1024);
  const file = testInfo.outputPath('grande-transparente.png');
  await writeFile(file, bytes);
  await page.goto('/');
  await expect(page.getByText('PNG ou SVG • até 50 MB', { exact: true })).toBeVisible();
  await page.locator('#file-picker').setInputFiles(file);
  await expect(page.locator('.file-info')).toContainText('grande-transparente.png');
  expect(await page.evaluate(async () => {
    const { file } = (await import('/src/app.js')).session;
    return { size: file.original.size, width: file.width, height: file.height, opaque: file.opaque };
  })).toEqual({ size: bytes.length, width: 1800, height: 1600, opaque: false });
  await page.getByRole('button', { name: 'EXPORTAR', exact: true }).click();
  await page.getByRole('button', { name: 'Gerar PNG da prévia', exact: true }).click();
  await page.getByRole('button', { name: 'Baixar PNG', exact: true }).waitFor();
  const result = await page.evaluate(async () => Array.from(new Uint8Array(await (await import('/src/app.js')).session.export.result.blob.arrayBuffer())));
  const png = PNG.sync.read(Buffer.from(result));
  expect([png.width, png.height]).toEqual([1080, 1080]);
  expect(png.data[3]).toBe(0);
  expect(png.data[(540 * png.width + 540) * 4 + 3]).toBe(128);
});

test('SVG válido com exatamente 50 MiB é aceito', async ({ page }, testInfo) => {
  // A large XML comment gives an exact byte boundary without increasing rendering complexity.
  const prefix = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><!--');
  const suffix = Buffer.from('--><rect width="16" height="16" fill="#FF7A00"/></svg>');
  const bytes = Buffer.alloc(50 * 1024 * 1024, 32);
  prefix.copy(bytes); suffix.copy(bytes, bytes.length - suffix.length);
  const file = testInfo.outputPath('limite-exato.svg');
  await writeFile(file, bytes);
  await page.goto('/');
  await page.locator('#file-picker').setInputFiles(file);
  await expect(page.locator('.file-info')).toContainText('limite-exato.svg');
  expect(await page.evaluate(async () => {
    const { file } = (await import('/src/app.js')).session;
    const alpha = file.variants.get('original').getContext('2d').getImageData(8, 8, 1, 1).data[3];
    return { size: file.original.size, alpha };
  })).toEqual({ size: 50 * 1024 * 1024, alpha: 255 });
});
