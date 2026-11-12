export const FONTS = Object.freeze([
  { id: 'Manrope', label: 'Manrope · Moderna', family: 'Manrope', weight: 600 },
  { id: 'Lora', label: 'Lora · Editorial', family: 'Lora', weight: 500 },
  { id: 'Space Mono', label: 'Space Mono · Técnica', family: '"Space Mono"', weight: 400 }
]);
export const fontFor = id => FONTS.find(f => f.id === id) || FONTS[0];
export async function loadTextFonts(settings) {
  await Promise.all((settings.layers || []).filter(l => l.type === 'text').map(l => {
    const font = fontFor(l.font); return document.fonts.load(`${font.weight} 32px ${font.family}`);
  }));
}
