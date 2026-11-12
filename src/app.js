import { Session, DEFAULTS } from './state.js';
import { importFile, ImageError, drawPreview } from './image.js';
import { generatePNG, APPEARANCES, WIDTHS } from './export.js';
import { ERRORS } from './messages.js';
import { FILE_SIZE_MB } from './limits.js';

export const session = new Session();
const app = document.querySelector('#app'), picker = document.querySelector('#file-picker'), dialog = document.querySelector('#dialog');
const labels = Object.fromEntries(APPEARANCES);
let busy = false, error = null, errorOrigin = null, hex = '#E8DCC8', editingHex = false, toast = '', toastTimer, dialogCancel, dialogReturn, reductionWidth = 256, aboutStep = 0;
let retiredURLs = [], downloadLocked = false, homeStep = 0, exportStep = 0, errorStep = 0;
const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const icon = name => `<img class="icon" src="./public/assets/${name}.svg" alt="" width="24" height="24">`;
const brand = (className = '') => `<img class="brand ${className}" src="./public/assets/craft-brand-negativo.svg" alt="Craft Brand" width="1007" height="340">`;
const button = (text, action, className = '', extra = '') => `<button type="button" data-action="${action}" class="${className}" ${extra}>${text}</button>`;
const iconButton = (name, label, action, extra = '') => button(icon(name), action, 'icon-button', `aria-label="${label}" title="${label}" ${extra}`);
const heading = title => `<header class="topbar">${iconButton('back', 'Voltar', 'back')}<h1>${title}</h1></header>`;
const preview = (settings = session.current, className = '', extra = '') => `<canvas class="preview ${className}" data-settings="${esc(JSON.stringify(settings))}" role="img" aria-label="Prévia do logotipo: ${labels[settings.appearance]}" ${extra}></canvas>`;
const nav = () => `<nav class="bottom-nav" aria-label="Editor">${button('FUNDOS', 'panel:backgrounds', session.panel === 'backgrounds' ? 'active' : '')}${button('FERRAMENTAS', 'panel:tools', session.panel === 'tools' ? 'active' : '')}${button('EXPORTAR', 'export')}</nav>`;
const footer = () => `<footer class="adjust-actions">${button(icon('close') + 'Cancelar', 'cancel')}${button(icon('check') + 'Aplicar', 'apply', 'apply', !validHex() ? 'disabled' : '')}</footer>`;
const tabs = (choices, current, action) => `<div class="tabs" role="tablist">${choices.map(([id, label]) => button(label, `${action}:${id}`, id === current ? 'active' : '', `role="tab" aria-selected="${id === current}" tabindex="${id === current ? 0 : -1}"`)).join('')}</div>`;
const validHex = () => session.panel !== 'backgrounds' || session.current.background !== 'custom' || /^#[\dA-F]{6}$/i.test(hex);
const hueOf = color => {
  const [r, g, b] = color.slice(1).match(/../g).map(v => parseInt(v, 16) / 255), d = Math.max(r, g, b) - Math.min(r, g, b);
  if (!d) return 0;
  return Math.round(((Math.max(r, g, b) === r ? (g - b) / d : Math.max(r, g, b) === g ? (b - r) / d + 2 : (r - g) / d + 4) * 60 + 360) % 360);
};
const hueColor = hue => '#' + [0, 8, 4].map(n => {
  const k = (n + hue / 30) % 12;
  return Math.round(255 * (1 - Math.max(-1, Math.min(k - 3, 9 - k, 1))) / 2).toString(16).padStart(2, '0');
}).join('').toUpperCase();
const errorParts = (details, actions) => `<div class="error-part ${errorStep === 0 ? 'current' : ''}">${details}</div><div class="error-part ${errorStep === 1 ? 'current' : ''}">${actions}</div>${button(errorStep ? 'Ver detalhes' : 'Continuar', 'error-step', 'secondary error-pager')}`;
function notify(text) {
  toast = text; document.querySelector('#announcement').textContent = text;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast = ''; const el = document.querySelector('.toast'); el?.remove(); }, 3200);
}
function render() {
  document.documentElement.classList.toggle('large-text', parseFloat(getComputedStyle(document.documentElement).fontSize) > 20);
  const active = document.activeElement;
  const focus = active?.dataset.action, inputFocus = active?.id === 'hex';
  const selection = inputFocus ? [active.selectionStart, active.selectionEnd] : null;
  app.dataset.view = session.view;
  app.dataset.panel = session.panel || '';
  if (busy) app.innerHTML = heading(session.export.status === 'preparing' ? 'Preparando PNG' : 'Preparando') + `<section class="page loading"><span class="spinner" aria-hidden="true"></span><h2>${session.export.status === 'preparing' ? 'Preparando seu PNG' : 'Preparando seu logotipo'}</h2><p>${session.export.status === 'preparing' ? 'Reunindo os testes selecionados.' : 'Lendo o arquivo e montando a prévia.'}</p></section>`;
  else if (error) app.innerHTML = errorView();
  else if (session.view === 'home') app.innerHTML = `<section class="welcome"><div class="welcome-part ${homeStep === 0 ? 'current' : ''}">${brand()}<h1>Veja sua marca<br>em cada contexto.</h1><p>Teste fundos, versões e tamanhos.<br>Compare e leve a prévia com você.</p></div><div class="welcome-part ${homeStep === 1 ? 'current' : ''}">${button('Abrir logotipo', 'open', 'primary')}${button('Experimentar com exemplo', 'example', 'secondary')}<small>PNG ou SVG • até ${FILE_SIZE_MB} MB</small>${button('Sobre o Craft Brand', 'about', 'quiet')}</div>${button(homeStep ? 'Sobre o aplicativo' : 'Começar', 'home-step', 'secondary home-pager')}</section>`;
  else if (session.view === 'editor') app.innerHTML = editor();
  else if (session.view === 'compare') app.innerHTML = comparison();
  else if (session.view === 'export') app.innerHTML = exportView();
  else if (session.view === 'result') app.innerHTML = resultView();
  else if (session.view === 'about') app.innerHTML = aboutView();
  if (toast && session.view === 'editor' && !busy && !error) app.insertAdjacentHTML('beforeend', `<div class="toast" role="status">${esc(toast)}</div>`);
  adaptText(); observeCanvases();
  if (inputFocus && document.querySelector('#hex')) {
    const field = document.querySelector('#hex'); field.focus({ preventScroll: true }); field.setSelectionRange(...selection);
  } else if (focus) app.querySelector(`[data-action="${CSS.escape(focus)}"]`)?.focus({ preventScroll: true });
}
function adaptText() {
  for (const el of app.querySelectorAll('.about-page,.welcome,.export-page,.error-page')) {
    el.classList.remove('paged');
    if (el.scrollHeight > el.clientHeight + 1) el.classList.add('paged');
  }
}
function editor() {
  const s = session.current;
  const current = session.original ? { ...s, appearance: 'original' } : s;
  return `<header class="topbar editor-header">${button('ABRIR', 'open', 'open-button')}${brand()}<span class="flex-spacer"></span>${iconButton('undo', 'Desfazer', 'undo', session.position ? '' : 'disabled')}${iconButton('redo', 'Refazer', 'redo', session.position < session.history.length ? '' : 'disabled')}${iconButton('more', 'Mais', 'more')}</header>
    <div class="file-info"><span title="${esc(session.file.name)}">${esc(session.file.name)}</span><span>· ${session.original ? 'Original temporário' : labels[s.appearance]}${session.file.example ? ' · Exemplo' : ''}</span></div>
    <section class="stage" aria-label="Área de edição">${preview(current)}${session.original ? button('Voltar à prévia', 'original', 'original-return') : ''}</section>
    ${session.panel ? panel() : ''}${session.panel && session.panel !== 'tools' ? footer() : nav()}`;
}
function panel() {
  const name = { backgrounds: 'Fundos', tools: 'FERRAMENTAS', appearance: 'Aparência', scale: 'Escala' }[session.panel];
  let body = '';
  if (session.panel === 'backgrounds') {
    if (!editingHex) body += `<div class="swatches">${[['transparent', 'Transp.'], ['white', 'Branco'], ['black', 'Preto'], ['custom', 'Sua cor']].map(([id, label]) => button(`<span class="swatch ${id === 'transparent' ? 'checker' : ''} ${id === 'black' ? 'dark' : ''}" style="background-color:${{ white: '#fff', black: '#000', custom: session.current.color }[id] || ''}">${session.current.background === id ? icon('check') : ''}</span><span>${label}</span>`, `background:${id}`, session.current.background === id ? 'selected' : '', `aria-pressed="${session.current.background === id}" aria-label="${id === 'transparent' ? 'Transparente' : label}"`)).join('')}</div>`;
    if (session.current.background === 'custom') body += `${!editingHex ? `<input id="hue" class="hue-range" type="range" min="0" max="359" value="${hueOf(hex)}" aria-label="Matiz da cor">` : ''}<label class="hex-row" for="hex"><span>HEX</span><input id="hex" aria-label="Cor hexadecimal" value="${esc(hex)}" type="text" inputmode="none" spellcheck="false" autocomplete="off" autocapitalize="characters" aria-invalid="${!validHex()}" ${editingHex ? 'aria-describedby="hex-help"' : ''}></label>${editingHex ? `<p id="hex-help" class="hex-help ${validHex() ? '' : 'error'}">${validHex() ? 'Use seis caracteres, de 0–9 e A–F.' : 'Use uma cor como #2457FF.'}</p><div class="hex-keyboard" aria-label="Teclado hexadecimal">${'0123456789ABCDEF'.split('').concat(['Apagar', 'Limpar']).map(k => button(k, `key:${k}`, k.length > 1 ? 'word-key' : '', `aria-label="${k}"`)).join('')}</div>` : ''}`;
    else body += '<small>Escolha o contexto da sua marca.</small>';
  }
  if (session.panel === 'appearance') body = `<div class="appearance-options">${APPEARANCES.map(([id, label]) => button(preview({ ...session.current, appearance: id, background: 'custom', color: '#B8B8B8', scale: 90 }, 'thumb') + `<span>${id === 'gray' ? 'Cinza' : label}</span>`, `appearance:${id}`, session.current.appearance === id ? 'selected' : '', `aria-pressed="${session.current.appearance === id}" aria-label="${label}"`)).join('')}</div>`;
  if (session.panel === 'scale') body = `<div class="scale-value"><label for="scale">Tamanho na prévia</label><output for="scale">${session.current.scale}%</output></div><input id="scale" type="range" min="25" max="100" value="${session.current.scale}" aria-label="Escala da prévia"><div class="range-labels"><small>25%</small><small>100%</small></div>`;
  if (session.panel === 'tools') body = `<div class="tools-grid">${[['background', 'Fundo', 'panel:backgrounds'], ['appearance', 'Aparência', 'panel:appearance'], ['scale', 'Escala', 'panel:scale'], ['compare', 'Comparar', 'compare:backgrounds'], ['reduction', 'Redução', 'compare:reduction'], ['undo', 'Original', 'original']].map(([glyph, label, action]) => button(`${icon(glyph)}<span>${label}</span>`, action)).join('')}</div>`;
  return `<section class="panel ${session.panel} ${editingHex ? 'editing-hex' : ''}" aria-label="${name}"><div class="panel-heading"><h2>${name}</h2>${iconButton('close', 'Fechar painel', 'cancel')}</div>${body}</section>`;
}
function comparison() {
  const s = session.settings;
  let content, note;
  if (session.tab === 'backgrounds') {
    content = `<div class="background-comparison">${[['white', 'Branco', '#FFFFFF'], ['black', 'Preto', '#000000'], ['custom', 'Personalizado', s.color]].map(([background, label, color]) => `<div class="background-row">${preview({ ...s, background })}<div><p>${label}</p><small>${color}</small></div></div>`).join('')}</div>`;
    note = 'Mesma aparência, mesma escala.<br>A leitura visual é sua.';
  } else if (session.tab === 'versions') {
    content = `<div class="version-comparison">${APPEARANCES.map(([appearance, label]) => `<figure>${preview({ ...s, appearance, background: 'custom', color: '#B8B8B8' })}<figcaption>${label}</figcaption></figure>`).join('')}</div>`;
    note = 'Fundo comum: #B8B8B8.<br>Compare forma e legibilidade.';
  } else {
    content = `<div class="reduction-area"><div class="reduction-selector" aria-label="Amostra de redução">${WIDTHS.map(w => button(`${w} px`, `reduction:${w}`, w === reductionWidth ? 'active' : '', `aria-pressed="${w === reductionWidth}"`)).join('')}</div><div class="reduction-samples">${WIDTHS.map(width => `<div class="reduction-row" data-width="${width}">${preview({ ...s, background: 'white', scale: 100 }, 'reduction', `data-real-width="${width}"`)}<small>${width} px</small></div>`).join('')}</div><small class="fit-note" hidden></small></div>`;
    note = 'Larguras reais: 256, 128, 64 e 32 px.<br>Observe a perda de detalhes.';
  }
  return heading({ backgrounds: 'Comparar fundos', versions: 'Comparar versões', reduction: 'Teste de redução' }[session.tab]) + `<section class="page compare-page">${tabs([['backgrounds', 'Fundos'], ['versions', 'Versões'], ['reduction', 'Redução']], session.tab, 'tab')}${content}<p class="comparison-note">${note}</p>${button('Exportar comparação', 'export:board', 'secondary')}</section>`;
}
function exportView() {
  const mode = session.export.mode;
  const introduction = mode === 'preview' ? `<h2>A prévia como você vê</h2><div class="export-preview">${preview(session.settings)}</div><p class="metadata">PNG • lado maior de até 1080 px</p><p>${session.settings.background === 'transparent' ? 'A transparência será preservada.<br>O quadriculado não aparece na imagem.' : 'O fundo e a aparência escolhidos serão preservados.'}</p>` : `<h2>O que vai na prancha?</h2><p>Reúna as comparações em uma imagem.</p>`;
  const choices = mode === 'board' ? `<div class="section-choices">${[['backgrounds', 'Fundos'], ['versions', 'Versões'], ['reduction', 'Redução']].map(([id, label]) => `<label><input type="checkbox" data-section="${id}" ${session.export.sections.includes(id) ? 'checked' : ''}><span>${label}</span></label>`).join('')}</div><p class="section-count ${session.export.sections.length ? '' : 'error'}" role="status">${session.export.sections.length ? session.export.sections.length + (session.export.sections.length === 1 ? ' teste selecionado' : ' testes selecionados') : 'Selecione pelo menos um teste.'}</p>` : '';
  return heading(mode === 'preview' ? 'Exportar prévia' : 'Exportar prancha') + `<section class="page export-page">${tabs([['preview', 'Prévia'], ['board', 'Prancha']], mode, 'export-mode')}<div class="export-part ${exportStep === 0 ? 'current' : ''}">${introduction}</div><div class="export-part ${exportStep === 1 ? 'current' : ''}">${choices}${button(mode === 'preview' ? 'Gerar PNG da prévia' : 'Gerar prancha', 'generate', 'primary', mode === 'board' && !session.export.sections.length ? 'disabled' : '')}</div>${button(exportStep ? 'Ver detalhes' : 'Continuar', 'export-step', 'secondary export-pager')}${button(session.origins.at(-1)?.view === 'compare' ? 'Voltar à comparação' : 'Voltar ao logotipo', 'back', 'quiet export-return')}</section>`;
}
function resultView() {
  const { result: r, status } = session.export;
  const returnLabel = session.origins.at(-1)?.view === 'compare' ? 'Voltar à comparação' : 'Voltar ao logotipo';
  if (status === 'unavailable') return heading('Download indisponível') + `<section class="page error-page">${errorParts('<span class="status-mark">✓</span><h2>Abra a imagem para salvar</h2><p>Se o navegador não iniciou o download, abra o PNG e use a opção de salvar ou compartilhar.</p>', `<a class="button primary" href="${r.url}" target="_blank" rel="noopener">Abrir imagem</a>${button('Tentar baixar novamente', 'download', 'secondary')}${button('Voltar', 'result-back', 'quiet')}`)}</section>`;
  return heading(status === 'requested' ? 'Download solicitado' : 'Imagem pronta') + `<section class="page result-page"><h2>${status === 'requested' ? 'Download solicitado' : 'Pronta para levar'}</h2>${status === 'requested' ? '<p>Confira a área de downloads do navegador.</p>' : ''}<div class="result-image"><img src="${r.url}" alt="PNG gerado do seu logotipo"></div>${status !== 'requested' ? `<p class="metadata">${r.mode === 'board' ? 'Prancha de testes' : 'Prévia atual'} • PNG · ${r.width} × ${r.height} px</p>` : ''}${status === 'requested' ? button(returnLabel, 'export-return', 'primary') : button('Baixar PNG', 'download', 'primary')}${button(r.mode === 'board' ? 'Gerar outra prancha' : 'Gerar outra prévia', 'result-back', 'secondary')}${status === 'requested' ? `<a class="button quiet" href="${r.url}" target="_blank" rel="noopener">Abrir imagem</a>` : button(returnLabel, 'export-return', 'quiet')}${button('Não iniciou o download?', 'download-help', 'text-link')}</section>`;
}
function aboutView() {
  const pages = [
    `${brand()}<h2>Teste. Compare. Decida.</h2><p>Observe seu logotipo em diferentes fundos, versões e tamanhos.</p><div class="steps"><span>CARREGAR</span><span>TESTAR</span><span>EXPORTAR</span></div>`,
    `<p class="project-credit">Inovação Chris 2026/2<br>Atividades 4 e 5</p><small>Integrantes e contribuições: a preencher.</small><small>Mockups com apoio de IA.<br>Interação inspirada no Snapseed.</small><p class="credit-final">A avaliação visual é do designer.</p>`
  ];
  return heading('Sobre e créditos') + `<section class="page about-page"><div class="about-part ${aboutStep === 0 ? 'current' : ''}">${pages[0]}</div><div class="about-part ${aboutStep === 1 ? 'current' : ''}">${pages[1]}</div>${button(aboutStep ? 'Sobre o aplicativo' : 'Ver créditos', 'about-step', 'secondary about-pager')}${button(session.file ? 'Voltar ao logotipo' : 'Voltar ao início', 'back', 'secondary')}</section>`;
}
function errorView() {
  const [title, message, body] = ERRORS[error.code] || ERRORS.corrupt;
  return heading(title) + `<section class="page error-page">${errorParts(`<span class="status-mark error" aria-hidden="true">!</span><h2>${message}</h2><p>${esc(error.detail || body)}</p>`, `${error.code === 'example' ? button('Tentar novamente', 'example', 'primary') + button('Abrir meu logotipo', 'open', 'secondary') : error.code === 'export' ? button('Tentar novamente', 'generate', 'primary') : button('Escolher outro arquivo', 'open', 'primary')}${button(session.file ? 'Voltar ao logotipo' : 'Voltar ao início', 'error-back', 'quiet')}`)}</section>`;
}
const observer = new ResizeObserver(() => drawAll());
function observeCanvases() {
  observer.disconnect();
  for (const el of app.querySelectorAll('.stage,.export-preview,.background-comparison,.version-comparison,.reduction-area,.appearance-options')) observer.observe(el);
  drawAll();
}
function drawAll() {
  if (!session.file || busy) return;
  const reduction = app.querySelector('.reduction-area');
  if (reduction) {
    const total = WIDTHS.reduce((sum, w) => sum + Math.max(22, w * session.file.height / session.file.width) + 8, -8);
    const single = total > reduction.clientHeight;
    reduction.classList.toggle('single', single);
    for (const row of reduction.querySelectorAll('.reduction-row')) row.hidden = single && +row.dataset.width !== reductionWidth;
    const note = reduction.querySelector('.fit-note'); note.hidden = true;
  }
  for (const c of app.querySelectorAll('canvas.preview')) {
    if (c.closest('[hidden]')) continue;
    const s = JSON.parse(c.dataset.settings);
    let width, height;
    if (c.dataset.realWidth) {
      width = +c.dataset.realWidth; height = width * session.file.height / session.file.width;
      if (reduction.classList.contains('single')) {
        const available = Math.max(20, reduction.clientHeight - 88);
        const factor = Math.min(1, available / height, (reduction.clientWidth - 72) / width);
        width *= factor; height *= factor;
        const note = reduction.querySelector('.fit-note'); note.hidden = false;
        note.textContent = factor < 1 ? `Prévia ajustada para caber. PNG: ${c.dataset.realWidth} px de largura.` : 'Amostra em pixels CSS. PNG mantém a largura indicada.';
      }
    } else if (c.closest('.stage')) {
      width = height = Math.max(1, Math.min(c.parentElement.clientWidth - 32, c.parentElement.clientHeight - 24, 440));
    } else if (c.classList.contains('thumb')) width = height = c.parentElement.clientWidth;
    else if (c.closest('.export-preview')) width = height = Math.max(1, Math.min(180, c.parentElement.clientHeight, c.parentElement.clientWidth));
    else if (c.closest('.background-row')) width = height = Math.min(112, c.parentElement.clientHeight);
    else if (c.closest('figure')) width = height = Math.min(c.parentElement.clientWidth - 8, c.parentElement.clientHeight - 22);
    else continue;
    c.style.width = `${width}px`; c.style.height = `${height}px`;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    c.width = Math.max(1, Math.round(width * ratio)); c.height = Math.max(1, Math.round(height * ratio));
    const ctx = c.getContext('2d'); ctx.scale(ratio, ratio);
    try { drawPreview(ctx, session.file, s, 0, 0, width, height, { checker: true }); }
    catch (e) { showError(new ImageError('dimensions')); return; }
  }
}
function showError(e) {
  errorStep = 0;
  errorOrigin ||= { view: session.view, tab: session.tab };
  error = { code: e.code || 'corrupt', detail: e.detail || '' }; busy = false; render(); focusHeading();
}
function clearError() { error = null; if (errorOrigin) Object.assign(session, errorOrigin); errorOrigin = null; }
function focusHeading() { const el = app.querySelector('h1'); if (el) { el.tabIndex = -1; el.focus({ preventScroll: true }); } }
function closeDialog(runCancel = true) {
  const cancel = dialogCancel; dialogCancel = null; dialog.close();
  if (runCancel) cancel?.();
  requestAnimationFrame(() => app.querySelector(`[data-action="${CSS.escape(dialogReturn || 'more')}"]`)?.focus({ preventScroll: true }));
}
function modal(title, description, choices, onCancel) {
  dialog.className = title === 'Mais' ? 'more-dialog' : '';
  dialog.removeAttribute('style');
  if (title === 'Mais') { const r = app.getBoundingClientRect(); dialog.style.left = `${r.right - 254}px`; dialog.style.top = `${r.top + 48}px`; }
  dialogReturn = document.activeElement?.dataset.action;
  dialogCancel = onCancel;
  dialog.innerHTML = `<h2 id="dialog-title">${title}</h2><p id="dialog-description">${description}</p>${choices.map((c, i) => `<button type="button" class="${c[2] || (i ? 'secondary' : 'primary')}" data-dialog="${i}">${c[0]}</button>`).join('')}`;
  dialog.querySelectorAll('button').forEach((b, i) => b.addEventListener('click', () => { closeDialog(false); choices[i][1](); }));
  dialog.showModal();
}
async function load(file, example = false) {
  if (busy) return;
  clearError(); busy = true; session.export.status = 'idle'; render();
  let candidate;
  try { candidate = await importFile(file, example); }
  catch (e) { busy = false; showError(example ? new ImageError('example') : e); return; }
  busy = false;
  const accept = () => {
    retireResult(); session.replace(candidate); editingHex = false; hex = DEFAULTS.color;
    if (example) notify('Exemplo pronto para testar'); render();
    if (candidate.opaque) modal('Este PNG tem fundo opaco', 'O fundo já faz parte da imagem. Alterar o fundo da prévia não remove essa área.', [
      ['Continuar com este PNG', () => {}], ['Escolher outro arquivo', () => picker.click()]
    ]);
  };
  render();
  if (session.file && session.dirty) modal('Trocar o logotipo?', 'Os ajustes desta sessão serão reiniciados.', [['Trocar logotipo', accept], ['Manter atual', () => candidate.dispose()]], () => candidate.dispose());
  else accept();
}
async function example() {
  if (busy) return;
  clearError(); busy = true; session.export.status = 'idle'; render();
  try {
    const response = await fetch('./public/assets/forma.svg');
    if (!response.ok) throw new Error();
    const data = await response.blob(); busy = false;
    await load(new File([data], 'forma.svg', { type: 'image/svg+xml' }), true);
  } catch { busy = false; showError(new ImageError('example')); }
}
function retireResult() {
  if (session.export.result) retiredURLs.push(session.export.result.url);
  session.export.result = null;
  // Results can remain open in another tab. Retire only on page exit, never immediately after download.
}
async function generate() {
  if (busy || !session.file || (session.export.mode === 'board' && !session.export.sections.length)) return;
  clearError(); busy = true; session.export.status = 'preparing'; render();
  try {
    const result = await generatePNG(session.file, session.settings, session.export.mode, session.export.sections);
    retireResult(); session.export.result = result; session.export.status = 'ready';
    session.view = 'result'; busy = false; render(); focusHeading();
  } catch (e) {
    session.export.status = 'error'; busy = false;
    showError(new ImageError('export', e.code === 'dimensions' ? 'A prancha excede o limite de 16 milhões de pixels ou 16.384 px por lado. Exporte menos seções ou use uma marca com proporção menos extrema. Seus ajustes foram preservados.' : ''));
  }
}
function download() {
  if (downloadLocked || !session.export.result || busy) return;
  downloadLocked = true;
  try {
    const a = document.createElement('a');
    if (!('download' in a)) throw new Error();
    a.href = session.export.result.url; a.download = session.export.result.name;
    document.body.append(a); try { a.click(); } finally { a.remove(); }
    session.export.status = 'requested';
  } catch { session.export.status = 'unavailable'; }
  render(); setTimeout(() => { downloadLocked = false; }, 800);
}
function openPanel(name) {
  toast = ''; clearTimeout(toastTimer);
  session.openPanel(name); editingHex = false; hex = session.current.color; render();
  requestAnimationFrame(() => app.querySelector('.panel button')?.focus({ preventScroll: true }));
}
function act(action) {
  if (busy) return;
  const [type, value] = action.split(':');
  if (type === 'open') { picker.value = ''; picker.click(); return; }
  if (type === 'example') { example(); return; }
  if (type === 'panel') { openPanel(value); return; }
  if (type === 'cancel') { session.cancel(); editingHex = false; }
  if (type === 'apply') { if (!validHex()) return; session.commit(); editingHex = false; }
  if (type === 'background') { session.draft.background = value; if (value === 'custom') hex = session.draft.color; }
  if (type === 'appearance') session.draft.appearance = value;
  if (type === 'undo' && session.undo()) notify('Ajuste desfeito');
  if (type === 'redo' && session.redo()) notify('Ajuste refeito');
  if (type === 'original') { const on = !session.original; session.cancel(); session.original = on; }
  if (type === 'key') { editHexKey(value); return; }
  if (type === 'compare') { session.navigate('compare'); session.tab = value; }
  if (type === 'tab') session.tab = value;
  if (type === 'reduction') reductionWidth = +value;
  if (type === 'export') {
    exportStep = 0;
    session.navigate('export'); session.export.mode = value === 'board' ? 'board' : 'preview';
    if (value === 'board') session.export.sections = [session.tab];
    session.export.status = 'idle';
  }
  if (type === 'export-mode') { session.export.mode = value; exportStep = 0; }
  if (type === 'export-step') exportStep = 1 - exportStep;
  if (type === 'generate') { generate(); return; }
  if (type === 'download') { download(); return; }
  if (type === 'download-help') { session.export.status = 'unavailable'; errorStep = 0; }
  if (type === 'error-step') errorStep = 1 - errorStep;
  if (type === 'result-back') { session.view = 'export'; session.export.status = 'idle'; }
  if (type === 'export-return') { session.back(); session.export.status = 'idle'; }
  if (type === 'about') { session.navigate('about'); aboutStep = 0; }
  if (type === 'about-step') aboutStep = 1 - aboutStep;
  if (type === 'home-step') homeStep = 1 - homeStep;
  if (type === 'more') {
    modal('Mais', 'Opções do Craft Brand', [
      ['Restaurar ajustes', () => modal('Restaurar os ajustes?', 'Seu arquivo continuará aberto. Você poderá desfazer esta ação.', [['Restaurar', () => { session.commit(DEFAULTS); notify('Ajustes restaurados'); render(); }], ['Cancelar', () => {}]])],
      ['Sobre e créditos', () => act('about')], ['Fechar menu', () => {}, 'quiet']
    ]); return;
  }
  if (type === 'error-back') clearError();
  if (type === 'back') {
    if (error) clearError();
    else if (session.panel || session.original) { session.cancel(); editingHex = false; }
    else if (session.view === 'result') { session.view = 'export'; session.export.status = 'idle'; }
    else session.back();
  }
  render();
  if (['compare', 'export', 'about', 'back', 'error-back', 'result-back'].includes(type)) focusHeading();
  if (['cancel', 'apply'].includes(type)) app.querySelector('[data-action="panel:backgrounds"]')?.focus({ preventScroll: true });
}
function setHex(value) {
  hex = '#' + value.replace(/^#/, '').toUpperCase().slice(0, 24);
  if (/^#[0-9A-F]{6}$/.test(hex)) session.draft.color = hex;
  render();
}
function editHexKey(key) {
  const field = app.querySelector('#hex');
  let start = Math.max(1, field.selectionStart ?? hex.length), end = Math.max(start, field.selectionEnd ?? start), next;
  if (key === 'Limpar') { next = '#'; start = 1; }
  else if (key === 'Apagar') { next = start !== end ? hex.slice(0, start) + hex.slice(end) : hex.slice(0, Math.max(1, start - 1)) + hex.slice(end); start = Math.max(1, start - (start === end ? 1 : 0)); }
  else { next = hex.slice(0, start) + key + hex.slice(end); start++; }
  setHex(next); const updated = app.querySelector('#hex'); updated.focus({ preventScroll: true }); updated.setSelectionRange(start, start);
}
app.addEventListener('click', event => { if (event.detail > 1) return; const el = event.target.closest('[data-action]'); if (el && !el.disabled) act(el.dataset.action); });
app.addEventListener('pointerdown', event => { if (event.target.closest('[data-action^="key:"]')) event.preventDefault(); });
app.addEventListener('focusin', event => {
  if (event.target.id === 'hex' && !editingHex) { editingHex = true; render(); const field = app.querySelector('#hex'); field.focus(); field.select(); }
});
app.addEventListener('input', event => {
  if (event.target.id === 'hue') {
    hex = session.draft.color = hueColor(+event.target.value);
    app.querySelector('#hex').value = hex;
    app.querySelector('[data-action="background:custom"] .swatch').style.backgroundColor = hex;
    app.querySelector('.stage canvas').dataset.settings = JSON.stringify(session.draft); drawAll();
  }
  if (event.target.id === 'hex') {
    const field = event.target, delta = field.value.startsWith('#') ? 0 : 1;
    const start = (field.selectionStart || 0) + delta, end = (field.selectionEnd || 0) + delta;
    setHex(field.value); app.querySelector('#hex').setSelectionRange(start, end);
  }
  if (event.target.id === 'scale') {
    session.draft.scale = +event.target.value;
    app.querySelector('output').textContent = `${session.draft.scale}%`;
    app.querySelector('.stage canvas').dataset.settings = JSON.stringify(session.draft); drawAll();
  }
});
app.addEventListener('change', event => {
  if (event.target.dataset.section) { const selected = new Set(session.export.sections); event.target.checked ? selected.add(event.target.dataset.section) : selected.delete(event.target.dataset.section); session.export.sections = [...selected]; render(); app.querySelector(`[data-section="${event.target.dataset.section}"]`)?.focus(); }
});
app.addEventListener('keydown', event => {
  if (event.target.matches('[role="tab"]') && ['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) {
    event.preventDefault(); const all = [...event.target.parentElement.children], i = all.indexOf(event.target);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? all.length - 1 : (i + (event.key === 'ArrowRight' ? 1 : -1) + all.length) % all.length;
    const action = all[next].dataset.action; act(action); app.querySelector(`[data-action="${action}"]`)?.focus();
  }
  if (event.key === 'Enter' && event.target.id === 'hex' && validHex()) act('apply');
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !dialog.open && !busy) { event.preventDefault(); act('back'); }
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z' && !event.target.matches('input') && session.view === 'editor' && !dialog.open && !busy) { event.preventDefault(); act(event.shiftKey ? 'redo' : 'undo'); }
});
picker.addEventListener('change', () => { const f = picker.files?.[0]; if (f) load(f); picker.value = ''; });
dialog.addEventListener('cancel', event => { event.preventDefault(); closeDialog(); });
window.addEventListener('resize', () => { adaptText(); drawAll(); });
window.addEventListener('pagehide', event => {
  if (event.persisted) return;
  session.file?.dispose(); if (session.export.result) URL.revokeObjectURL(session.export.result.url);
  retiredURLs.forEach(url => URL.revokeObjectURL(url)); retiredURLs = [];
});
const fontProbe = document.createElement('span'); fontProbe.className = 'font-probe'; fontProbe.setAttribute('aria-hidden', 'true'); document.body.append(fontProbe);
const fontObserver = new ResizeObserver(() => {
  const large = parseFloat(getComputedStyle(document.documentElement).fontSize) > 20;
  if (large !== document.documentElement.classList.contains('large-text')) render();
  else adaptText();
});
fontObserver.observe(fontProbe);
render();
