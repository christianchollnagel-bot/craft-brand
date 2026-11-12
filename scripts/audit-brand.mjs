import {chromium} from '@playwright/test';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {PNG} from 'pngjs';
await mkdir('docs/marca',{recursive:true});
const master=await readFile('materiais/logotipo/Craft_Brand/Craft_Brand_Logotipo.svg','utf8');
const positive=await readFile('public/assets/craft-brand.svg','utf8'),negative=await readFile('public/assets/craft-brand-negativo.svg','utf8');
assert.equal(positive,master);assert.equal(negative.replaceAll('#FFFFFF','#000000'),master);
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}),page=await browser.newPage({viewport:{width:360,height:640}});
const evidence={masterSHA256:createHash('sha256').update(master).digest('hex'),masterPreserved:true,negativeChangesOnlyFill:true,applications:[]};
const capture=async name=>{
 await page.evaluate(()=>document.fonts.ready);
 const geometry=await page.locator('img.brand').evaluate(img=>{const r=img.getBoundingClientRect(),s=getComputedStyle(img);return {width:r.width,height:r.height,ratio:r.width/r.height,background:s.backgroundColor,filter:s.filter,objectFit:s.objectFit,src:img.getAttribute('src'),naturalWidth:img.naturalWidth,naturalHeight:img.naturalHeight};});
 assert.ok(Math.abs(geometry.ratio-1007/340)<.002);assert.equal(geometry.background,'rgba(0, 0, 0, 0)');assert.equal(geometry.filter,'none');assert.equal(geometry.naturalWidth,1007);assert.equal(geometry.naturalHeight,340);
 evidence.applications.push({name,...geometry});await page.screenshot({path:`docs/marca/${name}.png`});
};
await page.goto('http://127.0.0.1:5186');await capture('abertura');await page.getByRole('button',{name:'Experimentar com exemplo',exact:true}).click();await page.locator('.stage canvas').waitFor();await capture('editor');await page.getByRole('button',{name:'Mais',exact:true}).click();await page.getByRole('button',{name:'Sobre e créditos',exact:true}).click();await capture('creditos');await page.getByRole('button',{name:'Voltar ao logotipo',exact:true}).click();await page.getByRole('button',{name:'EXPORTAR',exact:true}).click();await page.getByRole('tab',{name:'Prancha',exact:true}).click();await page.getByRole('button',{name:'Gerar prancha',exact:true}).click();await page.getByRole('button',{name:'Baixar PNG',exact:true}).waitFor();
const bytes=await page.evaluate(async()=>Array.from(new Uint8Array(await(await import('/src/app.js')).session.export.result.blob.arrayBuffer())));await writeFile('docs/marca/prancha.png',Buffer.from(bytes));const png=PNG.sync.read(Buffer.from(bytes));let black=0,white=0;for(let y=24;y<102;y++)for(let x=32;x<262;x++){const i=(y*png.width+x)*4;if(png.data[i]<20&&png.data[i+1]<20&&png.data[i+2]<20)black++;if(png.data[i]>250&&png.data[i+1]>250&&png.data[i+2]>250)white++;}assert.ok(black>100&&white>1000);evidence.board={width:png.width,height:png.height,logoBlackPixels:black,plateWhitePixels:white};await writeFile('docs/marca/validacao.json',JSON.stringify(evidence,null,2));await browser.close();console.log(JSON.stringify(evidence,null,2));
