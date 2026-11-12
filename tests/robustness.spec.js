import {test,expect} from '@playwright/test';
import path from 'node:path';
const b=(p,n)=>p.getByRole('button',{name:n,exact:true});
test('teclado físico HEX sem cerquilha, colagem e aplicação',async({page})=>{
 await page.goto('/');await b(page,'Experimentar com exemplo').click();await page.locator('.stage canvas').waitFor();await b(page,'FERRAMENTAS').click();await b(page,'Fundo').click();await b(page,'Sua cor').click();await page.getByRole('slider',{name:'Matiz da cor'}).fill('120');await expect(page.locator('#hex')).toHaveValue('#00FF00');await b(page,'Cancelar').click();expect(await page.evaluate(async()=>(await import('/src/app.js')).session.settings.color)).toBe('#E8DCC8');
 await page.goto('/');await b(page,'Experimentar com exemplo').click();await page.locator('.stage canvas').waitFor();await b(page,'FERRAMENTAS').click();await b(page,'Fundo').click();await b(page,'Sua cor').click();await page.locator('#hex').click();await page.locator('#hex').press('ControlOrMeta+a');await page.locator('#hex').pressSequentially('A1B2C3');await expect(page.locator('#hex')).toHaveValue('#A1B2C3');await page.locator('#hex').press('Enter');expect(await page.evaluate(async()=>(await import('/src/app.js')).session.settings.color)).toBe('#A1B2C3');
});
test('falha real no acionamento do download, nova tentativa e duplicação bloqueada',async({page})=>{
 await page.goto('/');await b(page,'Experimentar com exemplo').click();await page.locator('.stage canvas').waitFor();await b(page,'EXPORTAR').click();await b(page,'Gerar PNG da prévia').click();await b(page,'Baixar PNG').waitFor();
 await page.evaluate(()=>{window.oldClick=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){throw Error('bloqueio de teste')};});await b(page,'Baixar PNG').click();await expect(page.getByRole('heading',{name:'Download indisponível'})).toBeVisible();await page.evaluate(()=>{HTMLAnchorElement.prototype.click=window.oldClick;});
 await expect(b(page,'Tentar baixar novamente')).toBeVisible();await page.waitForTimeout(850);let downloads=0;page.on('download',()=>downloads++);await b(page,'Tentar baixar novamente').dblclick();await expect(page.getByRole('heading',{name:'Download solicitado'}).first()).toBeVisible();expect(downloads).toBe(1);
});
test('texto a 200% usa etapas e mantém HEX e créditos acessíveis',async({page})=>{
 await page.goto('/');await page.addStyleTag({content:':root{font-size:32px}'});await expect(page.locator('html')).toHaveClass(/large-text/);
 const fits=async()=>expect(await page.evaluate(()=>[document.documentElement.scrollWidth,document.documentElement.scrollHeight])).toEqual([360,640]);
 await fits();await b(page,'Começar').click();await b(page,'Experimentar com exemplo').click();await page.locator('.stage canvas').waitFor();await fits();await b(page,'FERRAMENTAS').click();await b(page,'Fundo').click();await b(page,'Sua cor').click();await page.locator('#hex').fill('#ZZ12');await fits();await expect(b(page,'Cancelar')).toBeInViewport();await expect(b(page,'Aplicar')).toBeInViewport();await b(page,'Cancelar').click();await b(page,'Mais').click();await b(page,'Sobre e créditos').click();await fits();await b(page,'Ver créditos').click();await fits();await expect(page.getByText('Integrantes e contribuições: a preencher.')).toBeVisible();
});
test('SVG embutido excessivo e CSS externo são rejeitados sem rede',async({page})=>{
 await page.goto('/');let network=0;page.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1:5186')&&!r.url().startsWith('blob:'))network++;});
 const png=Buffer.alloc(33);Buffer.from([137,80,78,71,13,10,26,10]).copy(png);png.writeUInt32BE(9000,16);png.writeUInt32BE(9000,20);
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><image href="data:image/png;base64,${png.toString('base64')}" width="10" height="10"/></svg>`;
 await page.locator('#file-picker').setInputFiles({name:'embedded.svg',mimeType:'image/svg+xml',buffer:Buffer.from(svg)});await expect(page.getByRole('heading',{name:'A imagem é grande demais para processar'})).toBeVisible();
 const css='<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><style>@import "https://example.invalid/a.css";</style><rect width="10" height="10"/></svg>';
 await page.locator('#file-picker').setInputFiles({name:'external-css.svg',mimeType:'image/svg+xml',buffer:Buffer.from(css)});await expect(page.getByRole('heading',{name:'Este SVG depende de outros arquivos'})).toBeVisible();expect(network).toBe(0);
});
test('marca horizontal e branca, PNG original e seleção válida após falha',async({page})=>{
 await page.goto('/');await page.locator('#file-picker').setInputFiles(path.resolve('tests/fixtures/horizontal.svg'));await page.locator('.stage canvas').waitFor();await expect(page.locator('.file-info')).toContainText('horizontal.svg');
 await page.locator('#file-picker').setInputFiles(path.resolve('tests/fixtures/marca-branca.png'));await b(page,'Continuar com este PNG').click();await b(page,'FERRAMENTAS').click();await b(page,'Fundo').click();await b(page,'Preto').click();await b(page,'Aplicar').click();
 const pixel=await page.locator('.stage canvas').evaluate(c=>Array.from(c.getContext('2d').getImageData(c.width/2,c.height/2,1,1).data));expect(pixel).toEqual([255,255,255,255]);
});
