import { canvas, decode, drawPreview, transform } from './image.js';

export const APPEARANCES = [['original', 'Original'], ['gray', 'Tons de cinza'], ['black', 'Preto'], ['white', 'Branco']];
export const WIDTHS = [256, 128, 64, 32];
export function pngBlob(c) {
  return new Promise((resolve, reject) => {
    try { c.toBlob(blob => blob && blob.size ? resolve(blob) : reject(new Error('PNG vazio')), 'image/png'); }
    catch (error) { reject(error); }
  });
}
export function fileName(name, kind) {
  return (name.replace(/\.[^.]+$/, '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70) || 'logotipo') + '-craft-brand-' + (kind === 'preview' ? 'previa' : 'prancha') + '.png';
}
export function boardLayout(file, sections) {
  const blocks = [], proofs = [], column = (1016 - (sections.length - 1) * 24) / sections.length;
  const ordered = ['backgrounds', 'versions', 'reduction'].filter(type => sections.includes(type));
  for (const [i, type] of ordered.entries()) {
    const x = Math.round(32 + i * (column + 24)), y = 158;
    const sample = Math.min(column, type === 'versions' ? 180 : 240);
    let height = 44 + (sample + 44) * (type === 'versions' ? 4 : 3);
    if (type === 'reduction') {
      let top = y + 44;
      for (const width of WIDTHS) { const h = width * file.height / file.width; proofs.push({ x, y: top, width, height: h }); top += h + 44; }
      height = top - y;
    }
    blocks.push({ type, x, y, sample, column, height });
  }
  return { width: 1080, height: Math.ceil(158 + Math.max(...blocks.map(b => b.height)) + 64), blocks, proofs };
}
export async function generatePNG(file, settings, mode, sections) {
  await document.fonts.ready;
  await document.fonts.load('600 16px Manrope');
  let out, layout = null;
  if (mode === 'preview') {
    // The editor composition is square. This is the image stage, never a screenshot of the 9:16 UI.
    out = canvas(1080, 1080);
    drawPreview(out.getContext('2d'), file, settings, 0, 0, 1080, 1080);
  } else {
    if (!sections.length) throw new Error('Selecione pelo menos um teste.');
    layout = boardLayout(file, sections);
    out = canvas(layout.width, layout.height, true);
    const ctx = out.getContext('2d');
    ctx.fillStyle = '#F4F3EE'; ctx.fillRect(0, 0, out.width, out.height);
    const logo = await decode(new URL('../public/assets/craft-brand.svg', import.meta.url).href);
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(32, 24, 230, 78); ctx.drawImage(logo, 32, 24, 230, 230 * 340 / 1007);
    const label = (text, x, y, size = 18, weight = 500, color = '#1B1B1D') => { ctx.font = `${weight} ${size}px Manrope`; ctx.fillStyle = color; ctx.fillText(text, x, y); };
    label('TESTES DO LOGOTIPO', 294, 55, 24, 800);
    const safeName = file.name.length > 60 ? file.name.slice(0, 57) + '…' : file.name;
    label(safeName, 294, 85, 16);
    label('Simulações para avaliação visual pelo designer', 32, 132, 16);
    for (const block of layout.blocks) {
      label({ backgrounds: 'Fundos', versions: 'Versões', reduction: 'Redução' }[block.type], block.x, block.y + 24, 22, 700);
      const top = block.y + 44;
      if (block.type === 'backgrounds') {
        const choices = [['white', 'Branco · #FFFFFF'], ['black', 'Preto · #000000'], ['custom', `Personalizado · ${settings.color}`]];
        choices.forEach(([background, text], i) => {
          const x = block.x, y = top + i * (block.sample + 44);
          drawPreview(ctx, file, { ...settings, background }, x, y, block.sample, block.sample);
          label(text, x, y + block.sample + 24, 16);
        });
      }
      if (block.type === 'versions') APPEARANCES.forEach(([appearance, text], i) => {
        const x = block.x, y = top + i * (block.sample + 44);
        drawPreview(ctx, file, { ...settings, background: 'custom', color: '#B8B8B8', appearance }, x, y, block.sample, block.sample);
        label(text, x, y + block.sample + 24, 16);
      });
      if (block.type === 'reduction') for (const proof of layout.proofs) {
        ctx.fillStyle = '#FFFFFF'; ctx.fillRect(proof.x, proof.y, proof.width, proof.height);
        ctx.drawImage(transform(file, settings.appearance), proof.x, proof.y, proof.width, proof.height);
        label(`${proof.width} px`, proof.x, proof.y + proof.height + 24, 16);
      }
    }
    label('Craft Brand • Avaliação visual pelo designer · Versões: #B8B8B8 · Redução: pixels do PNG', 32, out.height - 24, 16);
  }
  const blob = await pngBlob(out), width = out.width, height = out.height;
  out.width = 1; out.height = 1;
  return { blob, url: URL.createObjectURL(blob), name: fileName(file.name, mode), width, height, layout, mode };
}
