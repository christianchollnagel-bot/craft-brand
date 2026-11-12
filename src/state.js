export const DEFAULTS = Object.freeze({ background: 'transparent', appearance: 'original', scale: 80, color: '#E8DCC8' });
export const equal = (a, b) => Object.keys(DEFAULTS).every(key => a[key] === b[key]);
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
    this.draft = panel === 'tools' ? null : { ...this.settings };
  }
  cancel() { this.draft = null; this.panel = null; this.original = false; }
  commit(next = this.draft) {
    if (next && !equal(next, this.settings)) {
      this.history.splice(this.position);
      this.history.push({ before: { ...this.settings }, after: { ...next } });
      this.position++;
      this.settings = { ...next };
    }
    this.cancel();
  }
  undo() {
    this.cancel();
    if (!this.position) return false;
    this.settings = { ...this.history[--this.position].before };
    return true;
  }
  redo() {
    this.cancel();
    if (this.position === this.history.length) return false;
    this.settings = { ...this.history[this.position++].after };
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
