import test from 'node:test';
import assert from 'node:assert/strict';
import { Session, DEFAULTS } from '../src/state.js';
test('rascunho, transação única, cancelamento, ramificação e restauração', () => {
  const s = new Session(); s.openPanel('backgrounds'); s.draft.background = 'custom'; s.draft.color = '#123ABC';
  assert.equal(s.settings.background, 'transparent'); s.cancel(); assert.deepEqual(s.settings, DEFAULTS);
  s.openPanel('appearance'); s.draft.appearance = 'gray'; s.draft.scale = 25; s.commit();
  assert.equal(s.history.length, 1); s.undo(); assert.deepEqual(s.settings, DEFAULTS); s.redo(); assert.equal(s.settings.scale, 25);
  s.undo(); s.openPanel('backgrounds'); s.draft.background = 'black'; s.commit(); assert.equal(s.redo(), false);
  s.commit(DEFAULTS); s.undo(); assert.equal(s.settings.background, 'black');
  s.openPanel('backgrounds'); s.commit(); assert.equal(s.history.length, 2);
});
test('origem da navegação e aba preservadas sem poluir histórico', () => {
  const s = new Session(); s.view = 'editor'; s.navigate('compare'); s.tab = 'versions'; s.navigate('export'); s.back();
  assert.equal(s.view,'compare'); assert.equal(s.tab,'versions'); s.navigate('about'); s.back(); assert.equal(s.tab,'versions'); s.back(); assert.equal(s.view,'editor'); assert.equal(s.history.length,0);
});
