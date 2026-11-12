export const DEFAULTS = Object.freeze({ background: 'transparent', appearance: 'original', scale: 80, color: '#E8DCC8' });
export const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const copy = value => structuredClone(value);
export class Session {
  constructor() {
    this.file = null;
    this.settings = { ...DEFAULTS };
    this.draft = null;
    this.history = [];
    this.position = 0;
    this.panel = null;
    this.original = false;
    this.view = 'home';
    this.tab = 'backgrounds';
    this.origins = [];
    this.export = { mode: 'preview', sections: ['backgrounds', 'versions', 'reduction'], status: 'idle', result: null };
  }
  get current() { return this.draft || this.settings; }
  get dirty() { return !equal(this.settings, DEFAULTS) || this.history.length > 0; }
  openPanel(panel) {
    this.original = false;
    this.panel = panel;
    this.draft = panel === 'tools' ? null : copy(this.settings);
  }
  cancel() { this.draft = null; this.panel = null; this.original = false; this.collectAssets(); }
  collectAssets() {
    if (!this.file?.overlays) return;
    const states = [this.settings, this.draft, ...this.history.flatMap(h => [h.before, h.after])];
    const used = new Set(states.flatMap(s => (s?.layers || []).map(l => l.asset)));
    for (const [id, asset] of this.file.overlays) if (!used.has(id)) { asset.dispose(); this.file.overlays.delete(id); }
  }
  commit(next = this.draft) {
    if (next) {
      next = copy(next);
      if (!next.layers?.length) delete next.layers;
    }
    if (next && !equal(next, this.settings)) {
      this.history.splice(this.position);
      this.history.push({ before: copy(this.settings), after: copy(next) });
      this.position++;
      this.settings = copy(next);
    }
    this.cancel();
  }
  undo() {
    this.cancel();
    if (!this.position) return false;
    this.settings = copy(this.history[--this.position].before);
    return true;
  }
  redo() {
    this.cancel();
    if (this.position === this.history.length) return false;
    this.settings = copy(this.history[this.position++].after);
    return true;
  }
  replace(file) {
    this.file?.dispose();
    this.file = file;
    this.settings = { ...DEFAULTS };
    this.history = [];
    this.position = 0;
    this.cancel();
    this.view = 'editor';
    this.origins = [];
  }
  navigate(view) {
    this.origins.push({ view: this.view, tab: this.tab });
    this.cancel();
    this.view = view;
  }
  back() {
    this.cancel();
    const origin = this.origins.pop();
    this.view = origin?.view || (this.file ? 'editor' : 'home');
    this.tab = origin?.tab || this.tab;
  }
}
