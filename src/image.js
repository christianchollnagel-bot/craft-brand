import { LIMITS } from './limits.js';
import { FILTERS } from './filters.js';
import { adjustPixels, isAdjusted } from './adjustments.js';
import { fontFor } from './typography.js';
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
export async function importFile(file, example = false, { allowJPEG = false } = {}) {
  if (file.size > LIMITS.bytes) throw new ImageError('size');
  if (!file.size) throw new ImageError('corrupt');
  const bytes = new Uint8Array(await file.arrayBuffer());
  const png = [137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => bytes[i] === v);
  let blob, width, height, type;
  if (png) {
    if (bytes.length < 33 || String.fromCharCode(...bytes.slice(12, 16)) !== 'IHDR') throw new ImageError('corrupt');
    const dv = new DataView(bytes.buffer); width = dv.getUint32(16); height = dv.getUint32(20);
    checkDimensions(width, height); blob = new Blob([bytes], { type: 'image/png' }); type = 'png';
  } else if (allowJPEG && bytes[0] === 255 && bytes[1] === 216) {
    for (let i = 2; i < bytes.length - 9;) {
      if (bytes[i] !== 255) break;
      if (bytes[i + 1] === 255) { i++; continue; }
      const marker = bytes[i + 1], length = (bytes[i + 2] << 8) | bytes[i + 3];
      if ([192,193,194,195,197,198,199,201,202,203,205,206,207].includes(marker)) {
        height = (bytes[i + 5] << 8) | bytes[i + 6]; width = (bytes[i + 7] << 8) | bytes[i + 8]; break;
      }
      if (length < 2) break; i += length + 2;
    }
    if (!width || !height) throw new ImageError('corrupt');
    checkDimensions(width, height); blob = new Blob([bytes], { type: 'image/jpeg' }); type = 'jpeg';
  } else {
    const text = new TextDecoder().decode(bytes).replace(/^\uFEFF/, '').trim();
    if (!/<svg(?:\s|>)/i.test(text)) throw new ImageError(/\.(png|svg|jpe?g)$/i.test(file.name) ? 'corrupt' : 'format', allowJPEG ? 'Importe uma imagem em PNG, JPG ou SVG.' : '');
    const svg = svgSource(text); width = svg.width; height = svg.height;
    blob = new Blob([svg.source], { type: 'image/svg+xml' }); type = 'svg';
  }
  const url = URL.createObjectURL(blob);
  let img;
  try {
    img = await decode(url);
    checkDimensions(img.naturalWidth, img.naturalHeight);
    if (type === 'jpeg') { width = img.naturalWidth; height = img.naturalHeight; }
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
    const variants = new Map([['original', base]]), overlays = new Map();
    return { original: file, url, image: img, width, height, type, example, name: file.name, opaque: type === 'png' && opaque, variants, overlays,
      dispose() { URL.revokeObjectURL(url); for (const c of variants.values()) { c.width = 1; c.height = 1; } variants.clear(); for (const asset of overlays.values()) asset.dispose(); overlays.clear(); if (this.adjusted) this.adjusted.canvas.width = this.adjusted.canvas.height = 1; this.adjusted = null; img.src = ''; } };
  } catch (err) { URL.revokeObjectURL(url); if (err instanceof ImageError) throw err; throw new ImageError('dimensions'); }
}
export function transform(file, appearance, adjustments) {
  if (isAdjusted(adjustments)) {
    const key = appearance + JSON.stringify(adjustments);
    if (file.adjusted?.key === key) return file.adjusted.canvas;
    const source = transform(file, appearance), out = file.adjusted?.canvas || canvas(source.width, source.height);
    out.width = source.width; out.height = source.height;
    const ctx = out.getContext('2d', { willReadFrequently: true }); ctx.drawImage(source, 0, 0);
    const pixels = ctx.getImageData(0, 0, out.width, out.height); adjustPixels(pixels.data, adjustments); ctx.putImageData(pixels, 0, 0);
    file.adjusted = { key, canvas: out }; return out;
  }
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
// Layer coordinates use the square preview. Reduction proofs include that entire composition.
export const artworkRatio = (file, settings) => settings.layers?.length ? 1 : file.height / file.width;
export function layerBounds(ctx, layer, file, width, height) {
  const side = Math.min(width, height), w = side * layer.width / 100;
  if (layer.type === 'image') {
    const asset = file.overlays.get(layer.asset);
    return { width: w, height: asset ? w * asset.height / asset.width : 0, lines: [] };
  }
  const font = fontFor(layer.font), size = side * layer.size / 100, lineHeight = size * 1.3;
  ctx.font = `${font.weight} ${size}px ${font.family}`;
  const lines = [];
  for (const paragraph of layer.text.split('\n')) {
    let line = '';
    for (const word of paragraph.split(/(\s+)/)) {
      if (ctx.measureText(line + word).width <= w) { line += word; continue; }
      if (line.trim()) { lines.push(line.trimEnd()); line = ''; }
      for (const char of word.trimStart()) {
        if (line && ctx.measureText(line + char).width > w) { lines.push(line); line = ''; }
        line += char;
      }
    }
    lines.push(line.trimEnd());
  }
  return { width: w, height: Math.max(1, lines.length) * lineHeight, lines, lineHeight, size };
}
export function drawArtwork(ctx, file, settings, x, y, width, height) {
  const factor = Math.min(width / file.width, height / file.height) * settings.scale / 100;
  const w = file.width * factor, h = file.height * factor;
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(transform(file, settings.appearance, settings.adjustments), x + (width - w) / 2, y + (height - h) / 2, w, h);
  for (const layer of settings.layers || []) {
    ctx.save(); ctx.globalAlpha = layer.opacity / 100;
    const box = layerBounds(ctx, layer, file, width, height), left = x + width * layer.x / 100 - box.width / 2, top = y + height * layer.y / 100 - box.height / 2;
    if (layer.type === 'image') {
      const asset = file.overlays.get(layer.asset); if (asset) ctx.drawImage(transform(asset, 'original', layer.adjustments), left, top, box.width, box.height);
    } else {
      ctx.fillStyle = layer.color; ctx.textBaseline = 'middle'; ctx.textAlign = layer.align;
      const tx = layer.align === 'left' ? left : layer.align === 'right' ? left + box.width : left + box.width / 2;
      box.lines.forEach((line, i) => ctx.fillText(line, tx, top + (i + .5) * box.lineHeight));
    }
    ctx.restore();
  }
}
export function drawPreview(ctx, file, settings, x, y, width, height, { checker = false } = {}) {
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, width, height); ctx.clip();
  const color = backgroundColor(settings);
  if (color) { ctx.fillStyle = color; ctx.fillRect(x, y, width, height); }
  else if (checker) {
    ctx.fillStyle = '#ECECEE'; ctx.fillRect(x, y, width, height);
    ctx.fillStyle = '#CECED2';
    for (let yy = 0; yy < height; yy += 8) for (let xx = 0; xx < width; xx += 8) if ((xx / 8 + yy / 8) % 2 === 0) ctx.fillRect(x + xx, y + yy, 8, 8);
  }
  drawArtwork(ctx, file, settings, x, y, width, height);
  ctx.restore();
}
