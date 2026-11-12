import { test, expect } from '@playwright/test';
import { PNG } from 'pngjs';

test('SVG com viewport pequeno conserva bordas nítidas na exportação ampliada', async ({ page }) => {
  await page.goto('/');
  const source = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><path d="M8 4H16V20H8Z" fill="#087F8C"/></svg>';
  await page.locator('#file-picker').setInputFiles({name:'vetor-pequeno.svg',mimeType:'image/svg+xml',buffer:Buffer.from(source)});
  await page.locator('.stage canvas').waitFor();
  await page.getByRole('button',{name:'EXPORTAR',exact:true}).click();
  await page.getByRole('button',{name:'Gerar PNG da prévia',exact:true}).click();
  await page.getByRole('button',{name:'Baixar PNG',exact:true}).waitFor();
  const bytes = await page.evaluate(async()=>Array.from(new Uint8Array(await(await import('/src/app.js')).session.export.result.blob.arrayBuffer())));
  const png=PNG.sync.read(Buffer.from(bytes));
  const alpha=x=>png.data[(540*png.width+x)*4+3];
  // At scale 80%, the vertical edges are x=396 and x=684 in a 1080-pixel PNG.
  // A 24-pixel intermediate would spread the edge over dozens of output pixels.
  expect(alpha(390)).toBe(0);expect(alpha(403)).toBe(255);
  expect(alpha(677)).toBe(255);expect(alpha(690)).toBe(0);
});
