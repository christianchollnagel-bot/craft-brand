export const ADJUSTMENTS = Object.freeze([
  { id: 'brightness', label: 'Brilho', group: 'light', hint: 'Clareie ou escureça a imagem.' },
  { id: 'contrast', label: 'Contraste', group: 'light', hint: 'Separe ou aproxime os tons claros e escuros.' },
  { id: 'tone', label: 'Tom', group: 'light', hint: 'Ajuste os meios-tons, preservando os extremos.' },
  { id: 'whitePoint', label: 'Ponto branco', group: 'light', hint: 'Defina a intensidade dos tons mais claros.' },
  { id: 'blackPoint', label: 'Ponto preto', group: 'light', hint: 'Dê profundidade ou suavidade aos tons mais escuros.' },
  { id: 'highlights', label: 'Altas luzes', group: 'light', hint: 'Controle as áreas claras da imagem.' },
  { id: 'shadows', label: 'Sombras', group: 'light', hint: 'Revele ou escureça detalhes nas áreas de sombra.' },
  { id: 'saturation', label: 'Saturação', group: 'color', hint: 'De tons discretos a cores intensas.' },
  { id: 'warmth', label: 'Calor', group: 'color', hint: 'Equilibre a imagem entre azul e âmbar.' },
  { id: 'tint', label: 'Tonalidade', group: 'color', hint: 'Equilibre a imagem entre verde e magenta.' }
]);
export const NEUTRAL = Object.freeze(Object.fromEntries(ADJUSTMENTS.map(a => [a.id, 0])));
export const isAdjusted = values => ADJUSTMENTS.some(({ id }) => values?.[id]);
const clamp = v => Math.min(1, Math.max(0, v));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };

// RGB corrections are intentionally independent of alpha: transparent margins stay intact.
export function adjustPixels(data, values) {
  const a = Object.fromEntries(ADJUSTMENTS.map(({ id }) => [id, (values?.[id] || 0) / 100]));
  const contrast = 2 ** a.contrast, gamma = 2 ** -a.tone;
  for (let i = 0; i < data.length; i += 4) {
    if (!data[i + 3]) continue;
    let r = data[i] / 255, g = data[i + 1] / 255, b = data[i + 2] / 255;
    const l = .2126 * r + .7152 * g + .0722 * b;
    const lift = a.brightness * .3 + a.highlights * .4 * smooth(.4, .95, l) + a.shadows * .4 * (1 - smooth(.05, .6, l));
    const tone = v => clamp((clamp(v) ** gamma - .5) * contrast + .5 + lift + a.whitePoint * .3 * v * v - a.blackPoint * .3 * (1 - v) ** 2);
    r = tone(r); g = tone(g); b = tone(b);
    const gray = .2126 * r + .7152 * g + .0722 * b;
    r = gray + (r - gray) * (1 + a.saturation) + a.warmth * .14 + a.tint * .07;
    g = gray + (g - gray) * (1 + a.saturation) - a.tint * .14;
    b = gray + (b - gray) * (1 + a.saturation) - a.warmth * .14 + a.tint * .07;
    data[i] = Math.round(clamp(r) * 255); data[i + 1] = Math.round(clamp(g) * 255); data[i + 2] = Math.round(clamp(b) * 255);
  }
  return data;
}
