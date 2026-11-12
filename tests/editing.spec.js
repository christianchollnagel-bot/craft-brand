import { test, expect } from '@playwright/test';
import { PNG } from 'pngjs';
import path from 'node:path';
const b = (page, name) => page.getByRole('button', { name, exact: true });
const state = page => page.evaluate(async () => { const s = (await import('/src/app.js')).session; return { settings: s.settings, draft: s.draft, history: s.history.length, assets: s.file.overlays.size }; });
const start = async page => { await page.goto('/'); await b(page, 'Experimentar com exemplo').click(); await page.locator('.stage canvas').waitFor(); };
const tool = async (page, name) => { await b(page, 'FERRAMENTAS').click(); await b(page, name).click(); };
const overlay = async page => { await page.locator('#overlay-picker').setInputFiles(path.resolve('tests/fixtures/transparente.png')); await page.locator('#layer-value').waitFor(); };
const png = async page => {
  await b(page, 'EXPORTAR').click(); await b(page, 'Gerar PNG da prévia').click(); await b(page, 'Baixar PNG').waitFor();
  return PNG.sync.read(Buffer.from(await page.evaluate(async () => Array.from(new Uint8Array(await (await import('/src/app.js')).session.export.result.blob.arrayBuffer())))));
};

test('IMPORTAR sobrepõe sem trocar o logo; cancelamento, edição, remoção e histórico preservam assets', async ({ page }) => {
  await start(page); const original = await state(page);
  await tool(page, 'IMPORTAR'); const chooser = page.waitForEvent('filechooser'); await b(page, 'Escolher imagem').click(); await (await chooser).setFiles([]);
  await overlay(page); expect((await state(page)).settings).toEqual(original.settings); expect((await state(page)).assets).toBe(1);
  await b(page, 'Cancelar').click(); expect((await state(page)).assets).toBe(0);
  await tool(page, 'IMPORTAR'); await overlay(page); await page.locator('#layer-property').selectOption('x'); await page.locator('#layer-value').fill('65'); await b(page, 'Aplicar').click();
  const imported = await state(page); expect(imported.settings.layers[0].x).toBe(65); await expect(page.locator('.file-info')).toContainText('forma-pharma.svg');
  await b(page, 'Desfazer').click(); expect((await state(page)).settings).toEqual(original.settings); expect((await state(page)).assets).toBe(1); await b(page, 'Refazer').click();
  await tool(page, 'IMPORTAR'); await page.locator('#overlay-picker').setInputFiles({ name: 'invalid.png', mimeType: 'image/png', buffer: Buffer.from('broken') });
  await expect(page.getByRole('alert')).toBeVisible(); expect((await state(page)).settings).toEqual(imported.settings); await b(page, 'Continuar editando').click();
  await b(page, 'Remover imagem').click(); await b(page, 'Cancelar').click(); expect((await state(page)).settings).toEqual(imported.settings);
  await tool(page, 'IMPORTAR'); await b(page, 'Remover imagem').click(); await b(page, 'Aplicar').click(); expect((await state(page)).settings.layers).toBeUndefined();
  await b(page, 'Desfazer').click(); expect((await state(page)).settings).toEqual(imported.settings);
  // Discard the branch holding the image, then verify its decoded resource is released.
  await b(page, 'Desfazer').click(); await b(page, 'FILTROS').click(); await b(page, 'Aurora').click(); await b(page, 'Aplicar').click(); expect((await state(page)).assets).toBe(0);
});

test('ESCREVA usa fontes locais, caixa multilinha, arraste e PNG sem guias de seleção', async ({ page }) => {
  await start(page); await tool(page, 'ESCREVA');
  await page.locator('#layer-text').fill('Ciência e cuidado\nTodo dia'); await page.getByRole('tab', { name: 'Estilo', exact: true }).click();
  const samples = [];
  for (const font of ['Manrope', 'Lora', 'Space Mono']) {
    await page.locator('#text-font').selectOption(font); await page.evaluate(async () => { const s = (await import('/src/app.js')).session; await (await import('/src/typography.js')).loadTextFonts(s.current); });
    samples.push(await page.evaluate(async () => { const { session: s } = await import('/src/app.js'); const { generatePNG } = await import('/src/export.js'); const r = await generatePNG(s.file, s.current, 'preview', []); const bytes = new Uint8Array(await r.blob.arrayBuffer()); URL.revokeObjectURL(r.url); return Array.from(bytes).slice(-2000).join(','); }));
  }
  expect(new Set(samples).size).toBe(3);
  await page.locator('#text-color').fill('#C54D31'); await page.locator('#text-size').fill('7'); await page.locator('#text-align').selectOption('left');
  const before = (await state(page)).draft.layers[0]; const c = page.locator('.stage canvas'), rect = await c.boundingBox();
  await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2); await page.mouse.down(); await page.mouse.move(rect.x + rect.width * .6, rect.y + rect.height * .4); await page.mouse.up();
  const moved = (await state(page)).draft.layers[0]; expect(moved.x).toBeGreaterThan(before.x); expect(moved.y).toBeLessThan(before.y);
  await c.focus(); await page.keyboard.press('Shift+ArrowLeft'); expect((await state(page)).draft.layers[0].x).toBe(moved.x - 5);
  await b(page, 'Aplicar').click(); const saved = await state(page);
  await tool(page, 'ESCREVA'); await page.locator('#layer-text').fill('<img src=x onerror=alert(1)>'); await expect(page.locator('.editing-panel img')).toHaveCount(1); await b(page, 'Cancelar').click(); expect((await state(page)).settings).toEqual(saved.settings);
  const actual = await png(page); expect(actual.width).toBe(1080); expect(actual.data[3]).toBe(0);
  let colored = 0, guide = 0; for (let i = 0; i < actual.data.length; i += 4) { if (actual.data[i] === 197 && actual.data[i + 1] === 77 && actual.data[i + 2] === 49 && actual.data[i + 3]) colored++; if (actual.data[i] === 255 && actual.data[i + 1] === 212 && actual.data[i + 2] === 59 && actual.data[i + 3]) guide++; }
  expect(colored).toBeGreaterThan(100); expect(guide).toBe(0);
});

test('AJUSTAR tem dez controles reais, alfa intacto, alvo por imagem e restauração reversível', async ({ page }) => {
  await page.goto('/');
  await page.locator('#file-picker').setInputFiles({ name: 'tones.svg', mimeType: 'image/svg+xml', buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><path fill="#303030" d="M10 10h50v50H10z"/><path fill="#D0D0D0" d="M80 10h50v50H80z"/><path fill="#BA7546" opacity=".5" d="M10 80h120v50H10z"/></svg>') });
  await page.locator('.stage canvas').waitFor(); await tool(page, 'AJUSTAR');
  for (const [group, ids] of [['Luz', ['brightness', 'contrast', 'tone', 'whitePoint', 'blackPoint', 'highlights', 'shadows']], ['Cor', ['saturation', 'warmth', 'tint']]]) {
    await page.getByRole('tab', { name: group, exact: true }).click();
    for (const id of ids) {
      await page.locator('#adjust-select').selectOption(id); await page.locator('#adjust-value').fill('55');
      const result = await page.evaluate(async () => {
        const { session: s } = await import('/src/app.js'), { transform } = await import('/src/image.js');
        const read = c => c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
        const base = read(transform(s.file, 'original')), changed = read(transform(s.file, 'original', s.current.adjustments));
        let color = false, alpha = true; for (let i = 0; i < base.length; i++) { if (i % 4 === 3) alpha &&= base[i] === changed[i]; else color ||= base[i] !== changed[i]; } return { color, alpha };
      });
      expect(result, id).toEqual({ color: true, alpha: true }); await b(page, 'Zerar ajustes desta imagem').click();
    }
  }
  await page.locator('#adjust-select').selectOption('saturation'); await page.locator('#adjust-value').fill('-100'); await b(page, 'Aplicar').click(); const committed = await state(page);
  await tool(page, 'IMPORTAR'); await overlay(page); await b(page, 'Aplicar').click(); await tool(page, 'AJUSTAR'); await page.locator('#adjust-target').selectOption({ label: 'transparente.png' }); await page.locator('#adjust-value').fill('30'); await b(page, 'Aplicar').click();
  expect((await state(page)).settings.adjustments).toEqual(committed.settings.adjustments); expect((await state(page)).settings.layers[0].adjustments.brightness).toBe(30);
  await b(page, 'Desfazer').click(); expect((await state(page)).settings.layers[0].adjustments).toBeUndefined(); await b(page, 'Refazer').click();
  await tool(page, 'AJUSTAR'); await b(page, 'Zerar ajustes desta imagem').click(); await b(page, 'Cancelar').click(); expect((await state(page)).settings.adjustments).toEqual(committed.settings.adjustments);
  const out = await png(page); expect(out.width).toBe(1080); expect(out.data[3]).toBe(0);
});

test('imagem JPG importada aparece no PNG e na prova de redução da composição inteira', async ({ page }) => {
  await start(page); await tool(page, 'IMPORTAR');
  const bytes = await page.evaluate(() => { const c = document.createElement('canvas'); c.width = c.height = 32; const ctx = c.getContext('2d'); ctx.fillStyle = '#FF0000'; ctx.fillRect(0, 0, 32, 32); return Array.from(Uint8Array.from(atob(c.toDataURL('image/jpeg', 1).split(',')[1]), c => c.charCodeAt(0))); });
  await page.locator('#overlay-picker').setInputFiles({ name: 'red.jpg', mimeType: 'image/jpeg', buffer: Buffer.from(bytes) }); await page.locator('#layer-value').waitFor(); await b(page, 'Aplicar').click();
  const out = await png(page), i = (540 * out.width + 540) * 4; expect(out.data[i]).toBeGreaterThan(250); expect(out.data[i + 1]).toBeLessThan(5); expect(out.data[i + 3]).toBe(255);
  const proofs = await page.evaluate(async () => { const { session: s } = await import('/src/app.js'), { generatePNG } = await import('/src/export.js'); const r = await generatePNG(s.file, s.settings, 'board', ['reduction']); const img = new Image(); img.src = r.url; await img.decode(); const c = document.createElement('canvas'); c.width = r.width; c.height = r.height; const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0); const result = r.layout.proofs.map(p => ({ width: p.width, height: p.height, pixel: Array.from(ctx.getImageData(p.x + p.width / 2, p.y + p.height / 2, 1, 1).data) })); URL.revokeObjectURL(r.url); return result; });
  expect(proofs.map(p => [p.width, p.height])).toEqual([[256, 256], [128, 128], [64, 64], [32, 32]]); for (const p of proofs) { expect(p.pixel[0]).toBeGreaterThan(250); expect(p.pixel[1]).toBeLessThan(5); }
});

for (const [width, height, font] of [[360, 640, 16], [393, 699, 16], [412, 732, 16], [360, 560, 16], [360, 640, 32], [360, 560, 32]]) test(`ferramentas cabem em ${width}×${height}, texto ${font}px`, async ({ page }) => {
  await page.setViewportSize({ width, height }); await start(page); if (font === 32) await page.addStyleTag({ content: ':root{font-size:32px}' });
  const check = async label => {
    const errors = await page.evaluate(() => {
      const errors = [];
      if (document.documentElement.scrollHeight > innerHeight || document.documentElement.scrollWidth > innerWidth) errors.push('document');
      for (const el of document.querySelectorAll('#app *')) {
        if (!el.getClientRects().length || el.classList.contains('sr-only')) continue;
        const r = el.getBoundingClientRect(); if (!r.width || !r.height) continue;
        if (r.left < -.5 || r.top < -.5 || r.right > innerWidth + 1 || r.bottom > innerHeight + 1) errors.push(el.tagName + '.' + el.className);
        if (el.matches('button,input,select,textarea') && !el.disabled) { const top = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2); if (top && !el.contains(top)) errors.push('covered ' + el.id + el.textContent.slice(0, 20)); }
      }
      return errors;
    }); expect(errors, label).toEqual([]);
  };
  await b(page, 'FERRAMENTAS').click(); await check('ferramentas'); await b(page, 'IMPORTAR').click(); await check('importar vazio'); await overlay(page); await check('imagem'); await b(page, 'Aplicar').click();
  await tool(page, 'ESCREVA'); await check('texto'); for (const tab of ['Estilo', 'Posição']) { await page.getByRole('tab', { name: tab, exact: true }).click(); await check(tab); } await b(page, 'Aplicar').click();
  await tool(page, 'AJUSTAR'); await check('luz'); await page.getByRole('tab', { name: 'Cor', exact: true }).click(); await page.locator('#adjust-select').selectOption('tint'); await check('cor');
});
