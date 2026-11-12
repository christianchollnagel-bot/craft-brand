import {test,expect} from '@playwright/test';
import path from 'node:path';
import {PNG} from 'pngjs';
const b=(page,name)=>page.getByRole('button',{name,exact:true});
const state=page=>page.evaluate(async()=>{const s=(await import('/src/app.js')).session;return {settings:{...s.settings},draft:s.draft&&{...s.draft},history:s.history.length};});

test('FILTROS oferece quatro tratamentos, com rascunho, remoção e histórico',async({page})=>{
 await page.goto('/');await b(page,'Experimentar com exemplo').click();await page.locator('.stage canvas').waitFor();
 await expect(page.locator('.bottom-nav button')).toHaveText(['FILTROS','FERRAMENTAS','EXPORTAR']);
 await b(page,'FERRAMENTAS').click();await b(page,'Fundo').click();await b(page,'Branco').click();await b(page,'Aplicar').click();
 await b(page,'FERRAMENTAS').click();await b(page,'Escala').click();await page.locator('#scale').fill('65');await b(page,'Aplicar').click();
 const before=await state(page);await b(page,'FILTROS').click();
 await expect(page.locator('.filters .appearance-options button')).toHaveText(['Aurora','Solar','Botânico','Cobalto']);
 for(const [name,id] of [['Solar','solar'],['Botânico','botanical'],['Cobalto','cobalt'],['Aurora','aurora']]){
  await b(page,name).click();await expect(b(page,name)).toHaveAttribute('aria-pressed','true');const s=await state(page);
  expect(s.draft).toEqual({...before.settings,appearance:id});expect(s.settings).toEqual(before.settings);expect(s.history).toBe(before.history);
 }
 await b(page,'Aplicar').click();await expect(b(page,'FILTROS')).toBeFocused();expect((await state(page)).settings).toEqual({...before.settings,appearance:'aurora'});
 await b(page,'Desfazer').click();expect((await state(page)).settings).toEqual(before.settings);await b(page,'Refazer').click();
 await b(page,'FILTROS').click();await b(page,'Solar').click();await page.keyboard.press('Escape');await expect(b(page,'FILTROS')).toBeFocused();expect((await state(page)).settings.appearance).toBe('aurora');
 await b(page,'FILTROS').click();await b(page,'Remover filtro').click();await b(page,'Cancelar').click();expect((await state(page)).settings.appearance).toBe('aurora');
 await b(page,'FILTROS').click();await b(page,'Remover filtro').click();await b(page,'Aplicar').click();expect((await state(page)).settings).toEqual(before.settings);await b(page,'Desfazer').click();expect((await state(page)).settings.appearance).toBe('aurora');
 await b(page,'FERRAMENTAS').click();await b(page,'Comparar').click();expect(await page.locator('.background-row canvas').evaluateAll(cs=>cs.map(c=>JSON.parse(c.dataset.settings).appearance))).toEqual(['aurora','aurora','aurora']);
});

test('quatro filtros produzem PNGs distintos e preservam todos os pixels alfa',async({page})=>{
 await page.goto('/');await page.locator('#file-picker').setInputFiles(path.resolve('tests/fixtures/transparente.png'));await page.locator('.stage canvas').waitFor();
 const alpha=await page.evaluate(async()=>{
  const {session}=await import('/src/app.js'),{transform}=await import('/src/image.js');
  const data=mode=>{const c=transform(session.file,mode);return c.getContext('2d').getImageData(0,0,c.width,c.height).data;};
  const original=data('original');return ['aurora','solar','botanical','cobalt'].map(mode=>{const d=data(mode);return Array.from(d).every((v,i)=>i%4!==3||v===original[i]);});
 });expect(alpha).toEqual([true,true,true,true]);
 for(const [name,color] of [['Aurora',[48,25,106]],['Solar',[103,30,50]],['Botânico',[12,58,51]],['Cobalto',[14,30,79]]]){
  await b(page,'FILTROS').click();await b(page,name).click();await b(page,'Aplicar').click();await b(page,'EXPORTAR').click();await b(page,'Gerar PNG da prévia').click();await b(page,'Baixar PNG').waitFor();
  const bytes=await page.evaluate(async()=>Array.from(new Uint8Array(await(await import('/src/app.js')).session.export.result.blob.arrayBuffer())));
  const png=PNG.sync.read(Buffer.from(bytes)),i=(530*png.width+314)*4;
  expect(Array.from(png.data.slice(i,i+4)),name).toEqual([...color,255]);expect(png.data[3]).toBe(0);await b(page,'Voltar ao logotipo').click();
 }
});
