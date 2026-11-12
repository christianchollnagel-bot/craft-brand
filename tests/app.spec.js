import { test, expect } from '@playwright/test';
import { PNG } from 'pngjs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
const fixture = name => path.resolve('tests/fixtures', name);
const b = (page,name) => page.getByRole('button',{name,exact:true});
const action = (page,id) => page.locator(`[data-action="${id}"]`);
const settings = page => page.evaluate(async()=>({... (await import('/src/app.js')).session.settings}));
async function shot(page,n){await mkdir('docs/capturas',{recursive:true});await page.screenshot({path:`docs/capturas/${String(n).padStart(2,'0')}.png`});}
async function start(page){await page.goto('/');await page.evaluate(()=>document.fonts.ready);await b(page,'Experimentar com exemplo').click();await page.locator('.stage canvas').waitFor();}
async function tool(page,name){await b(page,'FERRAMENTAS').click();await b(page,name).click();}
async function bg(page,name,apply=true){await tool(page,'Fundo');await b(page,name).click();if(apply)await b(page,'Aplicar').click();}
async function fit(page,label){
  const result=await page.evaluate(()=>{
    const failures=[];
    if(document.documentElement.scrollWidth>innerWidth||document.documentElement.scrollHeight>innerHeight)failures.push('document');
    const all=[...document.querySelectorAll('#app *,dialog[open],dialog[open] *')];
    for(const e of all){
      if(e.closest('[hidden]')||!e.getClientRects().length||getComputedStyle(e).visibility==='hidden')continue;
      const r=e.getBoundingClientRect();
      if(!r.width||!r.height)continue;
      if(r.left < -.5||r.top < -.5||r.right>innerWidth+1||r.bottom>innerHeight+1)failures.push(`${e.tagName}.${e.className}: fora do viewport ${JSON.stringify(r.toJSON())}`);
      if(e.matches('section,nav,footer,dialog,.page,.panel')&&(e.scrollHeight>e.clientHeight+1||e.scrollWidth>e.clientWidth+1))failures.push(`${e.tagName}.${e.className}: overflow interno ${e.scrollHeight}/${e.clientHeight}`);
    }
    const controls=[...document.querySelectorAll('button:not(:disabled),input:not([type=file]),a.button')].filter(e=>e.getClientRects().length&&!e.closest('[hidden]'));
    if(!document.querySelector('dialog[open]'))for(const e of controls){const r=e.getBoundingClientRect();const top=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);if(top&&!e.contains(top))failures.push(`controle encoberto: ${e.textContent||e.id}`);}
    return failures;
  });
  expect(result,label).toEqual([]);
}
test('estados 01–36 e 44: fluxo real, transações, cancelamento e retorno', async({page})=>{
  test.setTimeout(90000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');await page.evaluate(()=>document.fonts.ready);await shot(page,1);
  const chooserPromise=page.waitForEvent('filechooser');await b(page,'Abrir logotipo').click();const chooser=await chooserPromise;expect(chooser.isMultiple()).toBe(false);await chooser.setFiles([]);
  let release;await page.route('**/public/assets/forma-pharma.svg',async route=>{await new Promise(r=>release=r);await route.continue();});
  await b(page,'Experimentar com exemplo').click();await expect(page.getByRole('heading',{name:'Preparando seu logotipo'})).toBeVisible();await shot(page,3);release();await page.locator('.stage canvas').waitFor();await page.unroute('**/public/assets/forma-pharma.svg');
  await page.locator('.stage canvas').waitFor();await shot(page,4);
  await tool(page,'Fundo');await b(page,'Cancelar').click();await shot(page,5);
  await bg(page,'Branco');await shot(page,6);await bg(page,'Preto');await shot(page,7);await bg(page,'Sua cor');await shot(page,8);
  await tool(page,'Fundo');await shot(page,9);await b(page,'Sua cor').click();await shot(page,10);
  await page.locator('#hex').fill('#ZZ12');await expect(b(page,'Aplicar')).toBeDisabled();expect(await page.locator('.stage canvas').getAttribute('data-settings')).toContain('#E8DCC8');await fit(page,'HEX inválido');await shot(page,11);
  await b(page,'Limpar').click();for(const k of '2457FF')await action(page,'key:'+k).click();await b(page,'Aplicar').click();expect((await settings(page)).color).toBe('#2457FF');
  await b(page,'Desfazer').click();expect((await settings(page)).color).toBe('#E8DCC8');await shot(page,35);await b(page,'Refazer').click();expect((await settings(page)).color).toBe('#2457FF');await shot(page,36);
  await b(page,'FERRAMENTAS').click();await shot(page,12);await b(page,'Aparência').click();
  for(const [i,name] of ['Original','Tons de cinza','Preto','Branco'].entries()){await b(page,name).click();await shot(page,13+i);}
  await b(page,'Cancelar').click();expect((await settings(page)).appearance).toBe('original');
  await tool(page,'Aparência');await b(page,'Tons de cinza').click();await b(page,'Aplicar').click();
  await tool(page,'Escala');await page.locator('#scale').press('Home');await expect(page.locator('output')).toHaveText('25%');await shot(page,17);await page.locator('#scale').press('End');await shot(page,18);await b(page,'Cancelar').click();expect((await settings(page)).scale).toBe(80);
  await tool(page,'Original');await shot(page,19);expect((await settings(page)).appearance).toBe('gray');await b(page,'Voltar à prévia').click();
  await b(page,'Mais').click();await shot(page,20);await b(page,'Restaurar ajustes').click();await shot(page,34);await b(page,'Restaurar').click();expect((await settings(page)).color).toBe('#E8DCC8');await b(page,'Desfazer').click();expect((await settings(page)).appearance).toBe('gray');
  await b(page,'Mais').click();await b(page,'Sobre e créditos').click();await shot(page,44);await fit(page,'Créditos');await b(page,'Voltar ao logotipo').click();
  await tool(page,'Comparar');await shot(page,21);await page.getByRole('tab',{name:'Versões',exact:true}).click();await shot(page,22);await page.getByRole('tab',{name:'Redução',exact:true}).click();await shot(page,23);await fit(page,'Redução');
  await b(page,'Exportar comparação').click();await shot(page,26);await page.getByLabel('Redução',{exact:true}).uncheck();await shot(page,27);await expect(b(page,'Gerar prancha')).toBeDisabled();await page.getByLabel('Fundos',{exact:true}).check();
  await page.getByRole('tab',{name:'Prévia',exact:true}).click();await shot(page,25);await page.getByRole('tab',{name:'Prancha',exact:true}).click();
  await page.evaluate(()=>{window.realBlob=HTMLCanvasElement.prototype.toBlob;HTMLCanvasElement.prototype.toBlob=function(...args){window.pendingPNG=()=>window.realBlob.apply(this,args);};});
  await b(page,'Gerar prancha').click();await expect(page.getByRole('heading',{name:'Preparando seu PNG'})).toBeVisible();await shot(page,28);await page.waitForFunction(()=>!!window.pendingPNG);await page.evaluate(()=>{HTMLCanvasElement.prototype.toBlob=window.realBlob;window.pendingPNG();});
  await b(page,'Baixar PNG').waitFor();await shot(page,29);await fit(page,'Imagem pronta');const download=page.waitForEvent('download');await b(page,'Baixar PNG').click();const dl=await download;await dl.saveAs('docs/capturas/download-prancha.png');await shot(page,30);expect(PNG.sync.read(await readFile('docs/capturas/download-prancha.png')).width).toBe(1080);
  await b(page,'Não iniciou o download?').click();await shot(page,32);await expect(page.getByRole('link',{name:'Abrir imagem',exact:true})).toHaveAttribute('href',/^blob:/);
  await action(page,'result-back').click();await page.evaluate(()=>{HTMLCanvasElement.prototype.toBlob=cb=>cb(null);});await b(page,'Gerar prancha').click();await expect(page.getByRole('heading',{name:'Não foi possível preparar a imagem'})).toBeVisible();await shot(page,31);await page.evaluate(()=>{HTMLCanvasElement.prototype.toBlob=window.realBlob;});
  await b(page,'Tentar novamente').click();await b(page,'Baixar PNG').waitFor();await b(page,'Gerar outra prancha').click();await b(page,'Voltar à comparação').click();await expect(page.getByRole('tab',{name:'Redução',exact:true})).toHaveAttribute('aria-selected','true');await b(page,'Voltar').click();
  const before=await settings(page);await page.locator('#file-picker').setInputFiles(fixture('transparente.png'));await expect(page.getByRole('dialog')).toBeVisible();await shot(page,33);await b(page,'Manter atual').click();expect(await settings(page)).toEqual(before);await expect(page.locator('.file-info')).toContainText('forma-pharma.svg');
  await page.locator('#file-picker').setInputFiles(fixture('opaco.png'));await b(page,'Trocar logotipo').click();await shot(page,24);await b(page,'Continuar com este PNG').click();expect((await settings(page)).background).toBe('transparent');
  expect(errors).toEqual([]);
});
for(const viewport of [{width:360,height:640},{width:393,height:699},{width:412,height:732},{width:360,height:560}])test(`layout sem scroll ${viewport.width}×${viewport.height}`,async({page})=>{
  await page.setViewportSize(viewport);await page.goto('/');await fit(page,'Início');await b(page,'Sobre o Craft Brand').click();await fit(page,'Créditos');await b(page,'Voltar ao início').click();await b(page,'Experimentar com exemplo').click();await page.locator('.stage canvas').waitFor();await fit(page,'Editor');
  await b(page,'FILTROS').click();await fit(page,'Filtros');await b(page,'Aurora').click();await b(page,'Cancelar').click();
  await tool(page,'Fundo');await fit(page,'Fundos');await b(page,'Sua cor').click();await fit(page,'Cor');await page.locator('#hex').fill('#ZZ12');await fit(page,'Teclado HEX');await b(page,'Cancelar').click();
  await b(page,'FERRAMENTAS').click();await fit(page,'Ferramentas');await b(page,'Aparência').click();await fit(page,'Aparência');await b(page,'Cancelar').click();await tool(page,'Escala');await fit(page,'Escala');await b(page,'Cancelar').click();
  await b(page,'Mais').click();await fit(page,'Mais');await b(page,'Restaurar ajustes').click();await fit(page,'Diálogo');await b(page,'Cancelar').click();
  await tool(page,'Comparar');for(const name of ['Fundos','Versões','Redução']){await page.getByRole('tab',{name,exact:true}).click();await fit(page,name);}
  await b(page,'Exportar comparação').click();await fit(page,'Prancha');await page.getByRole('tab',{name:'Prévia',exact:true}).click();await fit(page,'Prévia');await b(page,'Gerar PNG da prévia').click();await b(page,'Baixar PNG').waitFor();await fit(page,'Resultado');await b(page,'Não iniciou o download?').click();await fit(page,'Download indisponível');
});
test('estados 37–43: validações reais preservam sessão e recuperação',async({page},testInfo)=>{
  await start(page);await bg(page,'Preto');const before=await settings(page);
  for(const [n,file,title] of [[37,'incompativel.pdf','Este formato não é compatível'],[39,'corrompido.svg','Não conseguimos ler o arquivo'],[40,'externo.svg','Este SVG depende de outros arquivos'],[41,'muito-grande.svg','A imagem é grande demais para processar'],[42,'vazio.png','Não encontramos conteúdo visível']]){
    await page.locator('#file-picker').setInputFiles(fixture(file));await expect(page.getByRole('heading',{name:title,exact:true})).toBeVisible();await fit(page,title);await shot(page,n);await b(page,'Voltar ao logotipo').click();expect(await settings(page)).toEqual(before);
  }
  const oversized = testInfo.outputPath('grande.png');await writeFile(oversized,Buffer.alloc(50*1024*1024+1));
  await page.locator('#file-picker').setInputFiles(oversized);await expect(page.getByRole('heading',{name:'O arquivo ultrapassa 50 MB'})).toBeVisible();await fit(page,'Arquivo acima de 50 MB');await shot(page,38);await b(page,'Voltar ao logotipo').click();expect(await settings(page)).toEqual(before);
  let external=0;page.on('request',r=>{if(r.url().includes('example.invalid'))external++;});await page.locator('#file-picker').setInputFiles(fixture('ativo.svg'));await expect(page.getByText('Este SVG contém conteúdo ativo não compatível. Exporte uma versão estática.')).toBeVisible();expect(external).toBe(0);
  await page.goto('/');await page.route('**/public/assets/forma-pharma.svg',route=>route.abort());await b(page,'Experimentar com exemplo').click();await expect(page.getByRole('heading',{name:'O exemplo não carregou'})).toBeVisible();await shot(page,43);await page.locator('#file-picker').setInputFiles(fixture('autocontido.svg'));await page.locator('.stage canvas').waitFor();await expect(page.locator('.file-info')).toContainText('autocontido.svg');
});
test('transformações e exportação preservam pixels pretos, alfa e margens',async({page})=>{
  await page.goto('/');await page.locator('#file-picker').setInputFiles(fixture('transparente.png'));await page.locator('.stage canvas').waitFor();
  const pixels=await page.evaluate(async()=>{
    const {session}=await import('/src/app.js'),{transform}=await import('/src/image.js');
    const result={};for(const mode of ['original','gray','black','white']){const c=transform(session.file,mode),d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;result[mode]=[[0,0],[30,30],[80,30],[64,30]].map(([x,y])=>Array.from(d.slice((y*c.width+x)*4,(y*c.width+x)*4+4)));}return result;
  });
  expect(pixels.gray[1]).toEqual([0,0,0,255]);expect(pixels.gray[2][0]).toBeGreaterThan(0);expect(pixels.gray[2][0]).toBe(pixels.gray[2][1]);for(const mode of ['gray','black','white'])expect(pixels[mode].map(p=>p[3])).toEqual(pixels.original.map(p=>p[3]));
  await b(page,'EXPORTAR').click();await b(page,'Gerar PNG da prévia').click();await b(page,'Baixar PNG').waitFor();const result=await page.evaluate(async()=>{const r=(await import('/src/app.js')).session.export.result;return Array.from(new Uint8Array(await r.blob.arrayBuffer()));});const png=PNG.sync.read(Buffer.from(result));expect([png.width,png.height]).toEqual([1080,1080]);expect(png.data[3]).toBe(0);expect(png.data[(540*1080+540)*4+3]).toBeGreaterThan(0);await writeFile('docs/capturas/previa-transparente.png',Buffer.from(result));
});
test('logo preto sobre preto e PNG opaco não têm remoção ou inversão automática',async({page})=>{
  await page.goto('/');await page.locator('#file-picker').setInputFiles(fixture('marca-preta.png'));await b(page,'Continuar com este PNG').click();await bg(page,'Preto');
  const pixels=await page.locator('.stage canvas').evaluate(c=>{const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;return {nonBlack:Array.from(d).some((v,i)=>i%4!==3&&v!==0),alpha:Array.from(d).every((v,i)=>i%4!==3||v===255)};});expect(pixels).toEqual({nonBlack:false,alpha:true});
});
test('redução exportada tem larguras de pixels exatas; marca vertical usa alternância',async({page})=>{
  await page.goto('/');await page.locator('#file-picker').setInputFiles(fixture('vertical.svg'));await page.locator('.stage canvas').waitFor();await tool(page,'Redução');await expect(page.locator('.reduction-area')).toHaveClass(/single/);await expect(page.locator('.fit-note')).toContainText('ajustada');await fit(page,'Marca vertical');
  await b(page,'32 px').click();await fit(page,'Amostra 32 vertical');await b(page,'Exportar comparação').click();await b(page,'Gerar prancha').click();await b(page,'Baixar PNG').waitFor();
  const result=await page.evaluate(async()=>{const r=(await import('/src/app.js')).session.export.result;return {bytes:Array.from(new Uint8Array(await r.blob.arrayBuffer())),layout:r.layout};});const png=PNG.sync.read(Buffer.from(result.bytes));
  for(const p of result.layout.proofs){const y=Math.round(p.y+p.height/2),x=p.x;let count=0;for(let i=x;i<png.width;i++){const k=(y*png.width+i)*4;if(png.data[k]===255&&png.data[k+1]===122&&png.data[k+2]===0)count++;else break;}expect(count,`largura ${p.width}`).toBe(p.width);}
  expect(result.layout.proofs.map(p=>p.width)).toEqual([256,128,64,32]);await writeFile('docs/capturas/reducao-vertical.png',Buffer.from(result.bytes));await writeFile('docs/medidas-reducao.json',JSON.stringify({width:png.width,height:png.height,proofs:result.layout.proofs},null,2));
});
test('foco, Escape, teclado, sessão após resize e ramificação de histórico',async({page})=>{
  await start(page);await bg(page,'Branco');await bg(page,'Preto');await b(page,'Desfazer').click();await bg(page,'Sua cor');await expect(b(page,'Refazer')).toBeDisabled();
  await b(page,'Mais').click();await page.keyboard.press('Escape');await expect(b(page,'Mais')).toBeFocused();
  await tool(page,'Escala');await page.locator('#scale').press('Home');await page.keyboard.press('Escape');expect((await settings(page)).scale).toBe(80);
  const before=await settings(page);await page.setViewportSize({width:732,height:412});expect(await settings(page)).toEqual(before);await page.setViewportSize({width:360,height:640});
  await tool(page,'Comparar');await page.getByRole('tab',{name:'Fundos',exact:true}).press('ArrowRight');await expect(page.getByRole('tab',{name:'Versões',exact:true})).toHaveAttribute('aria-selected','true');
  expect(await page.evaluate(()=>document.fonts.check('600 14px Manrope'))).toBe(true);
});
