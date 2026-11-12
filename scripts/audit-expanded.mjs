import { chromium } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
const browser = await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const page = await browser.newPage({viewport:{width:360,height:640}});
const b = name => page.getByRole('button',{name,exact:true}), results = [];
const audit = async name => results.push({name,...await page.evaluate(()=>({
  document:[document.documentElement.scrollWidth,document.documentElement.scrollHeight],
  outside:[...document.querySelectorAll('#app *,dialog[open] *')].filter(e=>{
    if(!e.getClientRects().length)return false;const r=e.getBoundingClientRect();return r.width&&r.height&&(r.right>innerWidth+1||r.bottom>innerHeight+1||r.top<-.5||r.left<-.5);
  }).map(e=>e.tagName+'.'+e.className)
}))});
await page.goto('http://127.0.0.1:5186');await page.addStyleTag({content:':root{font-size:32px}'});await b('Começar').click();await b('Experimentar com exemplo').click();await page.locator('.stage canvas').waitFor();
await b('FUNDOS').click();await audit('fundos');await b('Sua cor').click();await audit('cor');await b('Cancelar').click();
for(const name of ['Aparência','Escala']){await b('FERRAMENTAS').click();await audit('ferramentas');await b(name).click();await audit(name);await b('Cancelar').click();}
await b('FERRAMENTAS').click();await b('Comparar').click();for(const name of ['Fundos','Versões','Redução']){await page.getByRole('tab',{name,exact:true}).click();await audit('comparar '+name);}
await b('Exportar comparação').click();await audit('exportar prancha: detalhes');if(await b('Continuar').isVisible())await b('Continuar').click();await audit('exportar prancha: opções');await page.getByRole('tab',{name:'Prévia',exact:true}).click();await audit('exportar prévia: detalhes');if(await b('Continuar').isVisible())await b('Continuar').click();await audit('exportar prévia: gerar');await b('Gerar PNG da prévia').click();await b('Baixar PNG').waitFor();await audit('resultado');await b('Não iniciou o download?').click();await audit('download indisponível');
if(await b('Continuar').isVisible()){await b('Continuar').click();await audit('download indisponível: ações');}
await writeFile('docs/texto-ampliado.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));await browser.close();
if(results.some(r=>r.outside.length||r.document[0]!==360||r.document[1]!==640))throw Error('Conteúdo fora do viewport com texto ampliado');
