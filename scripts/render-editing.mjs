import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
const directory = 'docs/ferramentas'; await mkdir(directory, { recursive: true });
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
try {
  const page = await browser.newPage({ viewport: { width: 360, height: 640 } });
  const b = name => page.getByRole('button', { name, exact: true });
  const shot = name => page.screenshot({ path: `${directory}/${name}.png` });
  await page.goto('http://127.0.0.1:5186'); await b('Experimentar com exemplo').click(); await page.locator('.stage canvas').waitFor();
  await b('FERRAMENTAS').click(); await shot('ferramentas'); await b('ESCREVA').click();
  await page.locator('#layer-text').fill('Ciência que cuida.'); await page.getByRole('tab', { name: 'Estilo', exact: true }).click(); await page.locator('#text-font').selectOption('Lora');
  await page.evaluate(async () => { const { session } = await import('/src/app.js'); await (await import('/src/typography.js')).loadTextFonts(session.current); });
  await page.locator('#text-size').fill('5'); await shot('escreva'); await b('Aplicar').click();
  await b('FERRAMENTAS').click(); await b('IMPORTAR').click();
  await page.locator('#overlay-picker').setInputFiles({ name: 'selo-exemplo.svg', mimeType: 'image/svg+xml', buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><circle cx="60" cy="60" r="55" fill="#53C4A5"/><circle cx="60" cy="60" r="47" fill="none" stroke="#153F43" stroke-width="2"/><path d="m37 60 15 15 32-32" stroke="#153F43" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>') });
  await page.locator('#layer-value').waitFor(); await page.locator('#layer-value').fill('18');
  await page.locator('#layer-property').selectOption('y'); await page.locator('#layer-value').fill('22'); await shot('importar'); await b('Aplicar').click();
  await b('FERRAMENTAS').click(); await b('AJUSTAR').click(); await page.getByRole('tab', { name: 'Cor', exact: true }).click(); await page.locator('#adjust-select').selectOption('saturation'); await page.locator('#adjust-value').fill('12'); await shot('ajustar'); await b('Aplicar').click();
  await b('EXPORTAR').click(); await b('Gerar PNG da prévia').click(); await b('Baixar PNG').waitFor();
  const data = await page.evaluate(async () => Array.from(new Uint8Array(await (await import('/src/app.js')).session.export.result.blob.arrayBuffer()))); await writeFile(`${directory}/composicao.png`, Buffer.from(data));
  console.log('Capturas e PNG real salvos em ' + directory);
} finally { await browser.close(); }
