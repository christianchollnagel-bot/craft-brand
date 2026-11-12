import { ADJUSTMENTS, NEUTRAL, isAdjusted } from './adjustments.js';
import { FONTS, loadTextFonts } from './typography.js';
import { importFile, layerBounds } from './image.js';
import { ERRORS } from './messages.js';
import { FILE_SIZE_MB } from './limits.js';

const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const options = (choices, value) => choices.map(([id, label]) => `<option value="${esc(id)}" ${id === value ? 'selected' : ''}>${esc(label)}</option>`).join('');
const btn = (text, action, extra = '') => `<button type="button" data-action="${action}" ${extra}>${text}</button>`;
const tabs = (choices, selected, action) => `<div class="tabs" role="tablist">${choices.map(([id, label]) => btn(label, `${action}:${id}`, `role="tab" aria-selected="${id === selected}" tabindex="${id === selected ? 0 : -1}" class="${id === selected ? 'active' : ''}"`)).join('')}</div>`;
const range = (id, label, value, min, max, suffix = '%') => `<label class="editing-range" for="${id}"><span>${label}</span><output for="${id}">${value > 0 && id === 'adjust-value' ? '+' : ''}${value}${suffix}</output></label><input id="${id}" type="range" min="${min}" max="${max}" step="1" value="${value}" aria-label="${label}">`;
const PROPERTIES = [['x', 'Posição horizontal'], ['y', 'Posição vertical'], ['width', 'Largura'], ['opacity', 'Opacidade']];
export const EDIT_PANELS = ['import', 'write', 'adjust'];

export class Editing {
  constructor(session, { render, redraw }) {
    this.session = session; this.render = render; this.redraw = redraw;
    this.id = null; this.tab = 'content'; this.property = 'x'; this.adjustment = 'brightness'; this.group = 'light'; this.target = 'logo'; this.loading = false; this.error = '';
    this.picker = document.querySelector('#overlay-picker');
    this.picker.addEventListener('change', () => { const f = this.picker.files?.[0]; this.picker.value = ''; if (f) this.import(f); });
  }
  get layers() { return this.session.current.layers || []; }
  get layer() { return this.layers.find(l => l.id === this.id); }
  get targetObject() { return this.target === 'logo' ? this.session.draft : this.layers.find(l => l.id === this.target) || this.session.draft; }
  get isLayerPanel() { return ['import', 'write'].includes(this.session.panel); }
  open(name) {
    this.error = ''; this.tab = 'content'; this.property = 'x';
    if (name === 'adjust') { this.target = 'logo'; this.group = 'light'; this.adjustment = 'brightness'; }
    const type = name === 'write' ? 'text' : 'image';
    this.id = this.layers.find(l => l.type === type)?.id || null;
    if (name === 'write' && !this.id) this.addText();
  }
  add(layer) {
    this.session.draft.layers ||= [];
    if (this.layers.length >= 8) { this.error = 'Você já tem 8 camadas. Remova uma para adicionar outra.'; return false; }
    layer.id = crypto.randomUUID(); this.session.draft.layers.push(layer); this.id = layer.id; return true;
  }
  addText() {
    if (this.add({ type: 'text', text: 'Seu texto', font: 'Manrope', color: '#153F43', size: 6, align: 'center', x: 50, y: 82, width: 80, opacity: 100 })) this.tab = 'content';
    loadTextFonts(this.session.current).then(() => this.redraw());
  }
  async import(file) {
    if (this.loading || this.session.panel !== 'import') return;
    if (this.layers.length >= 8) { this.error = 'Você já tem 8 camadas. Remova uma para adicionar outra.'; this.render(); return; }
    this.loading = true; this.error = ''; this.render();
    const draft = this.session.draft, owner = this.session.file;
    try {
      const asset = await importFile(file, false, { allowJPEG: true });
      if (this.session.draft !== draft || this.session.file !== owner) { asset.dispose(); return; }
      const id = crypto.randomUUID(); owner.overlays.set(id, asset);
      this.add({ type: 'image', asset: id, name: file.name, x: 50, y: 50, width: Math.min(45, 60 * asset.width / asset.height), opacity: 100 });
      this.tab = 'position'; this.property = 'width';
    } catch (error) { if (this.session.draft === draft) this.error = error.detail || ERRORS[error.code]?.[1] || 'Não foi possível importar esta imagem.'; }
    finally { this.loading = false; this.render(); }
  }
  body() {
    if (this.session.panel === 'adjust') return this.adjustBody();
    const isText = this.session.panel === 'write', layer = this.layer;
    const sameType = this.layers.filter(l => l.type === (isText ? 'text' : 'image'));
    let body = `<div class="layer-toolbar"><label class="sr-only" for="layer-select">${isText ? 'Caixa de texto' : 'Imagem sobreposta'}</label><select id="layer-select" ${sameType.length ? '' : 'disabled'}>${sameType.length ? options(sameType.map((l, i) => [l.id, isText ? `${i + 1}. ${l.text.slice(0, 30) || 'Texto vazio'}` : `${i + 1}. ${l.name}`]), this.id) : '<option>Nenhuma imagem</option>'}</select>${btn('+', isText ? 'add-text' : 'pick-overlay', `class="icon-button" aria-label="${isText ? 'Nova caixa de texto' : 'Importar outra imagem'}" ${this.loading || this.layers.length >= 8 ? 'disabled' : ''}`)}${btn('×', 'remove-layer', `class="icon-button" aria-label="Remover ${isText ? 'texto' : 'imagem'}" ${!layer || this.loading ? 'disabled' : ''}`)}</div>`;
    if (this.loading) return body + '<p role="status">Preparando imagem…</p>';
    if (this.error) return body + `<p class="error" role="alert">${esc(this.error)}</p>${btn('Continuar editando', 'dismiss-edit-error', 'class="secondary"')}`;
    if (!layer) return body + (isText ? btn('Criar caixa de texto', 'add-text', 'class="primary"') : `${btn('Escolher imagem', 'pick-overlay', 'class="primary"')}<small>PNG, JPG ou SVG · até ${FILE_SIZE_MB} MB<br>A imagem será colocada sobre o logo.</small>`);
    if (isText) {
      body += tabs([['content', 'Texto'], ['style', 'Estilo'], ['position', 'Posição']], this.tab, 'edit-tab');
      if (this.tab === 'content') body += `<label class="sr-only" for="layer-text">Escreva seu texto</label><textarea id="layer-text" rows="2" maxlength="280" placeholder="Escreva aqui…">${esc(layer.text)}</textarea><small>Até 280 caracteres. Arraste a caixa na prévia.</small>`;
      if (this.tab === 'style') body += `<div class="text-style"><label class="sr-only" for="text-font">Tipografia</label><select id="text-font">${options(FONTS.map(f => [f.id, f.label]), layer.font)}</select><input id="text-color" type="color" value="${layer.color}" aria-label="Cor do texto"></div><div class="text-style"><label for="text-align">Alinhar</label><select id="text-align">${options([['left', 'À esquerda'], ['center', 'Ao centro'], ['right', 'À direita']], layer.align)}</select></div>${range('text-size', 'Tamanho do texto', layer.size, 1, 20)}`;
    }
    if (!isText || this.tab === 'position') body += `<label class="sr-only" for="layer-property">Ajustar camada</label><select id="layer-property">${options(PROPERTIES, this.property)}</select>${range('layer-value', PROPERTIES.find(([id]) => id === this.property)[1], layer[this.property], this.property === 'width' ? 5 : 0, 100)}<small>Arraste na prévia ou use o controle acima.</small>`;
    return body;
  }
  adjustBody() {
    const adjustment = ADJUSTMENTS.find(a => a.id === this.adjustment), target = this.targetObject;
    const targets = [['logo', 'Logotipo'], ...this.layers.filter(l => l.type === 'image').map(l => [l.id, l.name])];
    return `<label class="sr-only" for="adjust-target">Imagem a ajustar</label><select id="adjust-target">${options(targets, this.target)}</select>${tabs([['light', 'Luz'], ['color', 'Cor']], this.group, 'adjust-group')}<label class="sr-only" for="adjust-select">Ajuste</label><select id="adjust-select">${options(ADJUSTMENTS.filter(a => a.group === this.group).map(a => [a.id, a.label]), this.adjustment)}</select>${range('adjust-value', adjustment.label, target.adjustments?.[this.adjustment] || 0, -100, 100, '')}<small class="adjust-hint">${adjustment.hint}</small>`;
  }
  action(type, value) {
    if (!EDIT_PANELS.includes(this.session.panel)) return false;
    if (type === 'pick-overlay') { this.picker.value = ''; this.picker.click(); return true; }
    if (type === 'add-text') { this.addText(); this.render(); requestAnimationFrame(() => document.querySelector('#layer-text')?.focus()); return true; }
    if (type === 'remove-layer') {
      this.session.draft.layers = this.layers.filter(l => l.id !== this.id);
      this.id = this.layers.filter(l => l.type === (this.session.panel === 'write' ? 'text' : 'image')).at(-1)?.id || null;
      this.session.collectAssets();
    } else if (type === 'dismiss-edit-error') this.error = '';
    else if (type === 'edit-tab') this.tab = value;
    else if (type === 'adjust-group') { this.group = value; this.adjustment = ADJUSTMENTS.find(a => a.group === value).id; }
    else if (type === 'reset-adjustments') delete this.targetObject.adjustments;
    else return false;
    this.render(); return true;
  }
  input(field) {
    const layer = this.layer;
    if (field.id === 'adjust-value' && this.session.panel === 'adjust') {
      this.targetObject.adjustments ||= { ...NEUTRAL };
      this.targetObject.adjustments[this.adjustment] = clamp(+field.value, -100, 100);
      if (!isAdjusted(this.targetObject.adjustments)) delete this.targetObject.adjustments;
    } else if (field.id === 'layer-text' && layer) layer.text = field.value.slice(0, 280);
    else if (field.id === 'text-color' && layer) layer.color = field.value;
    else if (field.id === 'text-size' && layer) layer.size = clamp(+field.value, 1, 20);
    else if (field.id === 'layer-value' && layer) layer[this.property] = clamp(+field.value, this.property === 'width' ? 5 : 0, 100);
    else return false;
    const output = document.querySelector(`output[for="${field.id}"]`);
    if (output) output.textContent = field.id === 'adjust-value' ? `${+field.value > 0 ? '+' : ''}${field.value}` : `${field.value}%`;
    this.redraw(); return true;
  }
  change(field) {
    if (field.id === 'layer-select') this.id = field.value;
    else if (field.id === 'layer-property') this.property = field.value;
    else if (field.id === 'adjust-select') this.adjustment = field.value;
    else if (field.id === 'adjust-target') this.target = field.value;
    else if (field.id === 'text-align' && this.layer) this.layer.align = field.value;
    else if (field.id === 'text-font' && this.layer) {
      this.layer.font = field.value;
      loadTextFonts(this.session.current).then(() => this.redraw());
    } else return false;
    this.render(); return true;
  }
  selection(ctx, width, height) {
    if (!this.isLayerPanel || !this.layer) return;
    ctx.save(); const box = layerBounds(ctx, this.layer, this.session.file, width, height);
    ctx.strokeStyle = '#FFD43B'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 3]);
    ctx.strokeRect(width * this.layer.x / 100 - box.width / 2, height * this.layer.y / 100 - box.height / 2, box.width, box.height); ctx.restore();
  }
  bind() {
    const c = document.querySelector('.stage canvas');
    if (!c || !this.isLayerPanel || !this.layer) return;
    c.tabIndex = 0; c.setAttribute('aria-label', 'Camada selecionada. Arraste para mover ou use as setas do teclado.'); c.classList.add('movable');
    let drag;
    c.addEventListener('pointerdown', e => {
      if (!this.layer || e.button !== 0) return;
      e.preventDefault(); c.focus({ preventScroll: true }); c.setPointerCapture(e.pointerId);
      drag = { clientX: e.clientX, clientY: e.clientY, x: this.layer.x, y: this.layer.y };
    });
    c.addEventListener('pointermove', e => {
      if (!drag || !this.layer) return;
      const r = c.getBoundingClientRect();
      this.layer.x = clamp(Math.round(drag.x + (e.clientX - drag.clientX) / r.width * 100), 0, 100);
      this.layer.y = clamp(Math.round(drag.y + (e.clientY - drag.clientY) / r.height * 100), 0, 100);
      this.syncPosition();
    });
    c.addEventListener('pointerup', () => { drag = null; }); c.addEventListener('pointercancel', () => { drag = null; });
    c.addEventListener('keydown', e => {
      const d = { ArrowLeft: ['x', -1], ArrowRight: ['x', 1], ArrowUp: ['y', -1], ArrowDown: ['y', 1] }[e.key];
      if (!d || !this.layer) return; e.preventDefault(); this.layer[d[0]] = clamp(this.layer[d[0]] + d[1] * (e.shiftKey ? 5 : 1), 0, 100); this.syncPosition();
    });
  }
  syncPosition() {
    const field = document.querySelector('#layer-value'); if (field && this.layer) { field.value = this.layer[this.property]; document.querySelector('output[for="layer-value"]').textContent = field.value + '%'; }
    this.redraw();
  }
}
