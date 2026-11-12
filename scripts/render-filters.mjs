import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
await mkdir('docs/filtros',{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const page=await browser.newPage({viewport:{width:360,height:640}}),base='http://127.0.0.1:5186';
await page.goto(base);await page.getByRole('button',{name:'Experimentar com exemplo',exact:true}).click();await page.locator('.stage canvas').waitFor();
await page.getByRole('button',{name:'FILTROS',exact:true}).click();await page.getByRole('button',{name:'Aurora',exact:true}).click();await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:'docs/filtros/painel.png'});
const filters=[['aurora','Aurora'],['solar','Solar'],['botanical','Botânico'],['cobalt','Cobalto']];
for(const [id] of filters){
 const bytes=await page.evaluate(async appearance=>{const {session}=await import('/src/app.js'),{generatePNG}=await import('/src/export.js');const result=await generatePNG(session.file,{...session.settings,appearance},'preview',[]);const bytes=Array.from(new Uint8Array(await result.blob.arrayBuffer()));URL.revokeObjectURL(result.url);return bytes;},id);
 await writeFile(`docs/filtros/${id}.png`,Buffer.from(bytes));
}
await page.setViewportSize({width:1280,height:410});
await page.setContent(`<html><head><style>@font-face{font-family:Manrope;src:url('${base}/public/assets/Manrope-Variable.ttf')}*{box-sizing:border-box}body{margin:0;padding:24px;background:#1b1b1d;font-family:Manrope;color:#f4f3ee}main{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}article{background:#fff;border-radius:8px;overflow:hidden}img{width:100%;display:block}h2{margin:0;padding:12px 16px;font-size:18px;background:#303033;color:#f4f3ee}</style></head><body><main>${filters.map(([id,label])=>`<article><img src="${base}/docs/filtros/${id}.png"><h2>${label}</h2></article>`).join('')}</main></body></html>`);
await page.evaluate(()=>Promise.all([...document.images].map(i=>i.decode())));await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:'docs/filtros/comparacao.png'});await browser.close();
console.log('Quatro PNGs reais, painel e comparação de filtros registrados.');
