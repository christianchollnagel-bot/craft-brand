import {PNG} from 'pngjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
const nodes=['8-12','8-47','8-82','8-101','8-164','8-222','8-277','8-332','9-165','9-254','9-344','9-491','9-589','9-687','9-785','9-883','10-485','10-564','10-643','10-702','10-770','10-819','10-873','10-923','11-674','11-709','11-754','11-790','11-814','11-917','11-1020','11-1042','12-815','12-881','12-944','12-1001','12-1061','12-1083','12-1105','12-1127','12-1152','12-1174','12-1196','12-1220'];
await mkdir('docs/comparacoes',{recursive:true});
for(let group=0;group<11;group++){
 const out=new PNG({width:1440,height:1280});out.data.fill(24);for(let a=3;a<out.data.length;a+=4)out.data[a]=255;
 for(let j=0;j<4;j++){
  const n=group*4+j;
  for(const [side,name] of [[0,`docs/referencias/${nodes[n]}.png`],[1,`docs/capturas/${String(n+1).padStart(2,'0')}.png`]]){
   try{const p=PNG.sync.read(await readFile(name));for(let y=0;y<640;y++)for(let x=0;x<360;x++){const sx=Math.floor(x*p.width/360),sy=Math.floor(y*p.height/640),dx=(j%2)*720+side*360+x,dy=Math.floor(j/2)*640+y;p.data.copy(out.data,(dy*1440+dx)*4,(sy*p.width+sx)*4,(sy*p.width+sx)*4+4);}}
   catch{ /* State 02 is the real operating-system picker, not a fabricated screenshot. */ }
  }
 }
 await writeFile(`docs/comparacoes/${String(group+1).padStart(2,'0')}.png`,PNG.sync.write(out));
}
console.log('11 folhas: em cada par, Figma à esquerda e aplicação à direita; estados crescentes.');
