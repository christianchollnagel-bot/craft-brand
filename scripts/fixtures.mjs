import { PNG } from 'pngjs';
import { mkdir,writeFile } from 'node:fs/promises';
await mkdir('tests/fixtures',{recursive:true});
const png = async (name,w,h,pixel) => {const p = new PNG({width:w,height:h}); for(let y=0;y<h;y++)for(let x=0;x<w;x++){p.data.set(pixel(x,y),(y*w+x)*4);}await writeFile('tests/fixtures/'+name,PNG.sync.write(p));};
await png('transparente.png',128,64,(x,y)=> x<16||x>111||y<8||y>55 ? [0,0,0,0] : x<64 ? [0,0,0,255] : [255,122,0,x===64?128:255]);
await png('opaco.png',128,64,(x,y)=>x>24&&x<100&&y>16&&y<48?[0,0,0,255]:[255,255,255,255]);
await png('marca-preta.png',100,50,()=>[0,0,0,255]);
await png('marca-branca.png',100,50,()=>[255,255,255,255]);
await png('vazio.png',100,50,()=>[0,0,0,0]);
const svg=(w,h,body)=>`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`;
const fixtures={
 'autocontido.svg':svg(256,128,'<defs><linearGradient id="g"><stop stop-color="#FF7A00"/><stop offset="1" stop-color="#000"/></linearGradient></defs><rect x="16" y="16" width="224" height="96" rx="8" fill="url(#g)"/>'),
 'horizontal.svg':svg(2048,64,'<rect width="2048" height="64" fill="#ff7a00"/>'),
 'vertical.svg':svg(64,1024,'<rect width="64" height="1024" fill="#ff7a00"/>'),
 'externo.svg':svg(256,128,'<image href="https://example.invalid/logo.png" width="256" height="128"/>'),
 'ativo.svg':svg(100,100,'<script>alert(1)</script><rect width="100" height="100"/>'),
 'muito-grande.svg':svg(9000,9000,'<rect width="9000" height="9000"/>'),
 'corrompido.svg':'<svg xmlns="http://www.w3.org/2000/svg"><path',
 'incompativel.pdf':'%PDF-1.7\nFixture sintética, não é documento real.',
 'LEIA-ME.md':'# Fixtures sintéticas\nMaterial gerado exclusivamente para testes. Não são assets da marca oficial.\nTransparente inclui pixels pretos, laranja, alfa parcial e margens transparentes. Vertical 1:16; horizontal 32:1. Casos ativo, externo, vazio, corrompido e dimensões excessivas exercitam validações.\n'
};
for(const [name,data] of Object.entries(fixtures))await writeFile('tests/fixtures/'+name,data);
console.log('Fixtures sintéticas criadas.');
