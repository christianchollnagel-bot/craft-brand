import { openSync } from 'fontkit';
import { mkdir, writeFile } from 'node:fs/promises';

const font = openSync('public/assets/Manrope-Variable.ttf');
const colors = { ink: '#153F43', teal: '#087F8C', mint: '#53C4A5' };
function lettering(text, size, weight, spacing, baseline, color) {
  const face = font.getVariation({ wght: weight }), run = face.layout(text), scale = size / face.unitsPerEm;
  const width = run.positions.reduce((sum, p) => sum + p.xAdvance * scale, 0) + (run.glyphs.length - 1) * spacing;
  let x = 600 - width / 2;
  const paths = run.glyphs.map((glyph, i) => {
    const p = run.positions[i];
    const result = `<path transform="translate(${(x + p.xOffset * scale).toFixed(3)} ${(baseline - p.yOffset * scale).toFixed(3)}) scale(${scale.toFixed(6)} ${(-scale).toFixed(6)})" d="${glyph.path.toSVG()}"/>`;
    x += p.xAdvance * scale + spacing; return result;
  }).join('\n');
  return `<g fill="${color}" aria-label="${text}">${paths}</g>`;
}
const capsule = `<defs><mask id="care" maskUnits="userSpaceOnUse" x="-200" y="-200" width="400" height="400"><path fill="white" d="M-200-200H200V200H-200Z"/><path fill="black" d="M-15-43H15V-15H43V15H15V43H-15V15H-43V-15H-15Z"/></mask></defs>
<g transform="translate(600 215) scale(1.08)"><g mask="url(#care)"><g transform="rotate(-35)"><path fill="${colors.teal}" d="M0-72H-68C-107.765-72-140-39.765-140 0S-107.765 72-68 72H0Z"/><path fill="${colors.mint}" d="M0-72H68C107.765-72 140-39.765 140 0S107.765 72 68 72H0Z"/></g></g></g>`;
const molecule = `<g transform="translate(600 215)"><path d="M-86 56L0-86 86 56Z" fill="none" stroke="${colors.teal}" stroke-width="28" stroke-linejoin="round"/><circle cx="0" cy="-86" r="42" fill="${colors.mint}"/><circle cx="-86" cy="56" r="42" fill="${colors.teal}"/><circle cx="86" cy="56" r="42" fill="${colors.mint}"/></g>`;
const letters = lettering('forma', 272, 650, -9, 560, colors.ink) + lettering('PHARMA', 50, 600, 12, 650, colors.teal);
const svg = (symbol, words = letters) => `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="100 0 1000 666.666667" role="img" aria-labelledby="title"><title id="title">Forma Pharma — marca fictícia de demonstração</title>${symbol}${words}</svg>\n`;
await mkdir('docs/exemplo',{recursive:true});
await writeFile('public/assets/forma-pharma.svg', svg(capsule));
await writeFile('docs/exemplo/rota-molecular.svg', svg(molecule));
await writeFile('docs/exemplo/forma-pharma-editavel.svg', svg(capsule, `<g text-anchor="middle" font-family="Manrope"><text x="600" y="560" font-size="272" font-weight="650" letter-spacing="-9" fill="${colors.ink}">forma</text><text x="600" y="650" font-size="50" font-weight="600" letter-spacing="12" fill="${colors.teal}">PHARMA</text></g>`));
console.log('Exemplo SVG e duas rotas criados. Fonte Manrope local; assinatura final em contornos.');
