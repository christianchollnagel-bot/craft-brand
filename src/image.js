import { LIMITS } from './limits.js';
import { FILTERS } from './filters.js';
export { LIMITS } from './limits.js';
export class ImageError extends Error {
  constructor(code, detail = '') { super(detail || code); this.code = code; this.detail = detail; }
}
export function canvas(width, height, exportMode = false) {
  width = Math.max(1, Math.ceil(width)); height = Math.max(1, Math.ceil(height));
  if (!Number.isFinite(width + height) || width * height > LIMITS.pixels || Math.max(width, height) > (exportMode ? LIMITS.exportSide : LIMITS.side)) throw new ImageError('dimensions');
  const c = document.createElement('canvas'); c.width = width; c.height = height;
  if (!c.getContext('2d')) throw new ImageError('dimensions');
  return c;
}
export async function decode(url) {
  const img = new Image(); img.src = url;
  try { await img.decode(); } catch { throw new ImageError('corrupt'); }
  return img;
}
function checkDimensions(w, h) {
  if (!(w > 0 && h > 0)) throw new ImageError('empty');
  if (w * h > LIMITS.pixels || Math.max(w, h) > LIMITS.side) throw new ImageError('dimensions');
}
function svgSource(source) {
  if (/<!DOCTYPE|<!ENTITY|<\?xml-stylesheet/i.test(source)) throw new ImageError('external');
  const xml = new DOMParser().parseFromString(source, 'image/svg+xml');
  const root = xml.documentElement;
  if (xml.querySelector('parsererror') || root.localName !== 'svg') throw new ImageError('corrupt');
  if (root.namespaceURI !== 'http://www.w3.org/2000/svg') throw new ImageError('corrupt');
  const all = [root, ...root.querySelectorAll('*')];
  if (all.length > 30000) throw new ImageError('dimensions');
  const blocked = new Set(['script', 'foreignobject', 'iframe', 'object', 'embed', 'audio', 'video', 'animate', 'animatetransform', 'animatemotion', 'set', 'discard']);
  const embedded = new Set(); let embeddedPixels = 0;
  const inspectEmbedded = value => {
    if (!/^data:image\/(png|jpeg);base64,/i.test(value) || embedded.has(value)) return;
    embedded.add(value);
    let data; try { data = Uint8Array.from(atob(value.split(',')[1].replace(/\s/g, '')), c => c.charCodeAt(0)); } catch { throw new ImageError('corrupt'); }
    let w, h;
    if (/^data:image\/png/i.test(value)) {
      if (data.length < 24) throw new ImageError('corrupt');
      const view = new DataView(data.buffer); w = view.getUint32(16); h = view.getUint32(20);
    } else {
      for (let i = 2; i < data.length - 9;) {
        if (data[i] !== 255) break;
        const marker = data[i + 1], length = (data[i + 2] << 8) | data[i + 3];
        if ([192,193,194,195,197,198,199,201,202,203,205,206,207].includes(marker)) { h = (data[i + 5] << 8) | data[i + 6]; w = (data[i + 7] << 8) | data[i + 8]; break; }
        if (length < 2) break; i += length + 2;
      }
    }
    if (!w || !h) throw new ImageError('corrupt');
    checkDimensions(w, h); embeddedPixels += w * h;
    if (embeddedPixels > LIMITS.pixels) throw new ImageError('dimensions');
  };
  const allowedRef = value => /^#[\w:.-]+$/.test(value) || /^data:(?:image\/(?:png|jpeg)|font\/(?:woff2?|ttf|otf)|application\/(?:font-woff|x-font-ttf));base64,[\da-z+/=\s]+$/i.test(value);
  const checkCss = css => {
    // Reject escapes and imports before parsing URL references: no alternate spelling can hide a network reference.
    const normalized = css.replace(/\/\*[\s\S]*?\*\//g, '');
    if (/@import|\\|expression\s*\(|-moz-binding|behavior\s*:/i.test(normalized)) throw new ImageError('external');
    for (const m of normalized.matchAll(/url\s*\(\s*(['"]?)(.*?)\1\s*\)/gi)) if (!allowedRef(m[2].trim())) throw new ImageError('external');
  };
  for (const el of all) {
    if (blocked.has(el.localName.toLowerCase()) || el.namespaceURI !== root.namespaceURI) throw new ImageError('corrupt', 'Este SVG contém conteúdo ativo não compatível. Exporte uma versão estática.');
    for (const a of el.attributes) {
      if (/^on/i.test(a.name)) throw new ImageError('corrupt', 'Este SVG contém eventos ativos. Exporte uma versão estática.');
      if (a.localName === 'href' && !allowedRef(a.value.trim())) throw new ImageError('external');
      if (a.localName === 'href') inspectEmbedded(a.value.trim());
      if (a.name === 'xml:base') throw new ImageError('external');
      checkCss(a.value);
    }
    if (el.localName === 'style') checkCss(el.textContent);
    if (el.localName === 'use') {
      const target = el.getAttribute('href') || el.getAttribute('xlink:href') || '';
      const referenced = target.startsWith('#') ? xml.getElementById(target.slice(1)) : null;
      // Cyclic/nested use graphs can exhaust SVG renderers. Ordinary symbol references work.
      if (referenced && (referenced.localName === 'use' || referenced.querySelector('use'))) throw new ImageError('corrupt', 'Referências SVG aninhadas não são suportadas. Expanda os símbolos e tente novamente.');
    }
  }
  const vb = (root.getAttribute('viewBox') || '').trim().split(/[\s,]+/).map(Number);
  const length = value => {
    const m = /^([\d.]+)(px|pt|pc|mm|cm|in)?$/.exec(value || '');
    return m ? Number(m[1]) * ({ px: 1, pt: 96 / 72, pc: 16, mm: 96 / 25.4, cm: 96 / 2.54, in: 96 }[m[2]] || 1) : null;
  };
  let w = length(root.getAttribute('width')), h = length(root.getAttribute('height'));
  if (vb.length === 4 && vb.every(Number.isFinite) && vb[2] > 0 && vb[3] > 0) {
    if (!w && !h) [w, h] = vb.slice(2);
    else if (!w) w = h * vb[2] / vb[3];
    else if (!h) h = w * vb[3] / vb[2];
  }
  if (!w || !h) throw new ImageError('corrupt', 'Defina width/height ou viewBox no SVG.');
  checkDimensions(w, h);
  root.setAttribute('width', String(w)); root.setAttribute('height', String(h));
  return { source: new XMLSerializer().serializeToString(root), width: w, height: h };
}
export async function importFile(file, example = false) {
  if (file.size > LIMITS.bytes) throw new ImageError('size');
  if (!file.size) throw new ImageError('corrupt');
  const bytes = new Uint8Array(await file.arrayBuffer());
  const png = [137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => bytes[i] === v);
  let blob, width, height, type;
  if (png) {
    if (bytes.length < 33 || String.fromCharCode(...bytes.slice(12, 16)) !== 'IHDR') throw new ImageError('corrupt');
    const dv = new DataView(bytes.buffer); width = dv.getUint32(16); height = dv.getUint32(20);
    checkDimensions(width, height); blob = new Blob([bytes], { type: 'image/png' }); type = 'png';
  } else {
    const text = new TextDecoder().decode(bytes).replace(/^\uFEFF/, '').trim();
    if (!/<svg(?:\s|>)/i.test(text)) throw new ImageError(/\.(png|svg)$/i.test(file.name) ? 'corrupt' : 'format');
    const svg = svgSource(text); width = svg.width; height = svg.height;
    blob = new Blob([svg.source], { type: 'image/svg+xml' }); type = 'svg';
  }
  const url = URL.createObjectURL(blob);
  let img;
  try {
    img = await decode(url);
    checkDimensions(img.naturalWidth, img.naturalHeight);
    const inspection = canvas(width, height), inspectionContext = inspection.getContext('2d', { willReadFrequently: true });
    inspectionContext.drawImage(img, 0, 0, inspection.width, inspection.height);
    let inspected = inspectionContext.getImageData(0, 0, inspection.width, inspection.height).data;
    let visible = false, opaque = true;
    for (let i = 3; i < inspected.length; i += 4) { visible ||= inspected[i] > 0; opaque &&= inspected[i] === 255; }
    inspection.width = 1; inspection.height = 1; inspected = null;
    if (!visible) throw new ImageError('empty');
    // SVG is vector: rasterize it at the working resolution, even when its declared viewport is small.
    const factor = type === 'svg' ? LIMITS.workingSide / Math.max(width, height) : Math.min(1, LIMITS.workingSide / Math.max(width, height));
    const base = canvas(width * factor, height * factor);
    const ctx = base.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, base.width, base.height);
    const variants = new Map([['original', base]]);
    return { original: file, url, image: img, width, height, type, example, name: file.name, opaque: type === 'png' && opaque, variants,
      dispose() { URL.revokeObjectURL(url); for (const c of variants.values()) { c.width = 1; c.height = 1; } variants.clear(); img.src = ''; } };
  } catch (err) { URL.revokeObjectURL(url); if (err instanceof ImageError) throw err; throw new ImageError('dimensions'); }
}
export function transform(file, appearance) {
  if (file.variants.has(appearance)) return file.variants.get(appearance);
  const source = file.variants.get('original'), out = canvas(source.width, source.height);
  const ctx = out.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(source, 0, 0);
  const pixels = ctx.getImageData(0, 0, out.width, out.height), d = pixels.data;
  const tones = FILTERS.find(filter => filter.id === appearance)?.colors;
  for (let i = 0; i < d.length; i += 4) {
    const luminance = .2126 * d[i] + .7152 * d[i + 1] + .0722 * d[i + 2];
    if (tones) {
      const position = Math.min(tones.length - 1, luminance / 255 * (tones.length - 1));
      const lo = Math.floor(position), hi = Math.min(lo + 1, tones.length - 1), mix = position - lo;
      for (let c = 0; c < 3; c++) d[i + c] = Math.round(tones[lo][c] + (tones[hi][c] - tones[lo][c]) * mix);
    } else {
      const gray = appearance === 'gray' ? Math.round(luminance) : appearance === 'white' ? 255 : 0;
      d[i] = d[i + 1] = d[i + 2] = gray;
    }
  }
  ctx.putImageData(pixels, 0, 0); file.variants.set(appearance, out); return out;
}
export const backgroundColor = settings => ({ white: '#FFFFFF', black: '#000000', custom: settings.color })[settings.background] || null;
export function drawPreview(ctx, file, settings, x, y, width, height, { checker = false } = {}) {
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, width, height); ctx.clip();
  const color = backgroundColor(settings);
  if (color) { ctx.fillStyle = color; ctx.fillRect(x, y, width, height); }
  else if (checker) {
    ctx.fillStyle = '#ECECEE'; ctx.fillRect(x, y, width, height);
    ctx.fillStyle = '#CECED2';
    for (let yy = 0; yy < height; yy += 8) for (let xx = 0; xx < width; xx += 8) if ((xx / 8 + yy / 8) % 2 === 0) ctx.fillRect(x + xx, y + yy, 8, 8);
  }
  const factor = Math.min(width / file.width, height / file.height) * settings.scale / 100;
  const w = file.width * factor, h = file.height * factor;
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(transform(file, settings.appearance), x + (width - w) / 2, y + (height - h) / 2, w, h);
  ctx.restore();
}
