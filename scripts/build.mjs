import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
const project = path.resolve('.'), target = path.resolve(project,'dist');
if (target !== path.join(project,'dist')) throw new Error('Destino de build inválido');
await rm(target,{recursive:true,force:true}); await mkdir(target,{recursive:true});
for(const entry of ['index.html','src','public']) await cp(entry,path.join(target,entry),{recursive:true});
await writeFile(path.join(target,'LEIA-ME.txt'),'Craft Brand — distribuição estática\nSirva esta pasta por HTTP/HTTPS. Sem backend ou dependências de produção.\nConsulte README.md na pasta do projeto para abertura local.\nFonte Manrope: public/assets/OFL-Manrope.txt\nFontes Lora e Space Mono: licenças em public/fonts/\n');
console.log('Distribuição estática gerada em '+target);
