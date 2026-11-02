import { html, raw, $, store, toast } from './util.js';
import { t, nm, getLang, setLang } from './i18n.js';
import { ui, opIcons } from './icons.js';
import { operations, groups, versions, products, opById, defaultPageIndex } from './data/index.js';
import { openSearch } from './views/palette.js';
import * as home from './views/home.js';
import * as opView from './views/op.js';
import * as fix from './views/fix.js';
import * as tools from './views/tools.js';
import * as misc from './views/misc.js';
import * as quiz from './views/quiz.js';
import * as practice from './views/practice.js';
import * as cad from './views/cad.js';
import { cadTabs } from './data/cad.js';

export const APP_VERSION = '1.6.0';

// ---------- theme ----------
const applyTheme = (th) => {
  if (th === 'auto') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = th;
  window.dispatchEvent(new Event('cadteach:theme'));
};
let theme = store.get('theme', 'auto');
applyTheme(theme);
const isDark = () => document.documentElement.dataset.theme === 'dark' || (!document.documentElement.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches);

// ---------- routing ----------
function parse() {
  const h = location.hash.replace(/^#\/?/, '');
  const [pathPart, query = ''] = h.split('?');
  const [path, anchor] = pathPart.split('#');
  return { parts: path.split('/').filter(Boolean).map(decodeURIComponent), query: new URLSearchParams(query), anchor: anchor && decodeURIComponent(anchor) };
}

const routes = {
  '': home, learn: home, op: opView, fix, tools, glossary: misc, saved: misc, about: misc, quiz, practice, cad,
};

let cleanup = () => {};
let lastKey = '';

function render() {
  const r = parse();
  const top = r.parts[0] || '';
  const view = routes[top] || misc;
  const key = r.parts.slice(0, 2).join('/') + '?' + r.query;
  const content = $('#content');
  const samePage = key === lastKey && top === 'op' && r.parts[2] === lastPage;
  // Moving between params of the same page: just scroll, don't re-render.
  if (samePage && r.parts[3]) { focusParam(r.parts[3]); return; }
  cleanup();
  document.querySelectorAll('.toast').forEach((t) => t.remove());
  const out = view.render(r);
  content.innerHTML = String(out.html);
  document.title = out.title ? `${out.title} — CADteach` : 'CADteach — Mastercam explained';
  cleanup = out.mount?.(content, r) || (() => {});
  lastKey = key;
  lastPage = r.parts[2];
  renderNav(r);
  if (top === 'op' && r.parts[3]) focusParam(r.parts[3]);
  else if (r.anchor) document.getElementById(r.anchor)?.scrollIntoView();
  else if (top === 'op' && prevOp === r.parts[1]) {
    const head = document.querySelector('.op-head');
    const y = head ? head.getBoundingClientRect().bottom + scrollY + 6 - (innerWidth < 1024 ? 53 : 0) : 0;
    if (scrollY > y) window.scrollTo(0, y);
  } else window.scrollTo(0, 0);
  prevOp = top === 'op' ? r.parts[1] : null;
  if (!out.keepFocus) content.focus({ preventScroll: true });
}
let lastPage = null;
let prevOp = null;

function focusParam(id, again = true) {
  const el = document.getElementById('p-' + id);
  if (!el) return;
  if (again) {
    // Visuals above mount lazily and change the page height: settle on the parameter again.
    let moved = false;
    const stop = () => { moved = true; };
    addEventListener('wheel', stop, { once: true, passive: true });
    addEventListener('touchstart', stop, { once: true, passive: true });
    [450, 1100].forEach((ms) => setTimeout(() => { if (!moved) el.scrollIntoView({ block: 'start' }); }, ms));
  }
  el.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  el.classList.remove('flash');
  void el.offsetWidth;
  el.classList.add('flash');
}

// ---------- shell ----------
function versionSelect(id) {
  const v = store.get('version', '2025');
  return html`<select class="select" id="${id}" aria-label="${t('version')}">
    ${versions.map((x) => html`<option value="${x.id}" ${x.id === v ? raw('selected') : ''} ${x.status !== 'content' ? raw('disabled') : ''}>${x.id}${x.status !== 'content' ? ' (soon)' : ''}</option>`)}
  </select>`;
}

function renderShell() {
  document.body.innerHTML = String(html`
  <a class="visually-hidden" href="#content" id="skip">Skip to content</a>
  <div class="shell">
    <aside class="sidebar" aria-label="Navigation">
      <a class="brand" href="#/">${raw(ui.logo)}<span><span class="brand-name">CADteach</span><span class="brand-sub">Mastercam, explained</span></span></a>
      <div class="version-picker">
        <div><label for="ver-side">${t('version')}</label>${versionSelect('ver-side')}</div>
        <div><label for="prod-side">${t('product')}</label>
          <select class="select" id="prod-side">${products.map((p) => html`<option ${p.status !== 'content' ? raw('disabled') : ''}>${p.name}${p.status !== 'content' ? ' (soon)' : ''}</option>`)}</select>
        </div>
      </div>
      <button class="search-trigger" type="button" data-search>${raw(ui.search)}<span>${t('search')}</span><kbd>/</kbd></button>
      <nav class="nav" id="nav"></nav>
      <div class="sidebar-foot">
        <button class="icon-btn" type="button" data-theme-toggle aria-label="Toggle dark mode"></button>
        <button class="icon-btn text-size" type="button" data-text-size aria-pressed="false" aria-label="Larger text">A+</button>
        <a class="icon-btn" href="#/about" style="margin-left:auto;text-decoration:none">v${APP_VERSION}</a>
      </div>
    </aside>
    <header class="topbar">
      <a class="brand" href="#/">${raw(ui.logo)}<span class="brand-name">CADteach</span></a>
      ${versionSelect('ver-top')}
      <button class="icon-btn text-size" type="button" data-text-size aria-pressed="false" aria-label="Larger text">A+</button>
      <button class="icon-btn" type="button" data-theme-toggle aria-label="Toggle dark mode"></button>
    </header>
    <main class="main"><div class="content" id="content" tabindex="-1"></div></main>
    <nav class="tabbar" aria-label="Main">
      <a href="#/learn" data-tab="learn">${raw(ui.learn)}<span>${t('learn')}</span></a>
      <a href="#/practice" data-tab="practice">${raw(ui.part)}<span>Practice</span></a>
      <button type="button" data-search>${raw(ui.search)}<span>${t('search')}</span></button>
      <a href="#/fix" data-tab="fix">${raw(ui.fix)}<span>${t('fixShort')}</span></a>
      <a href="#/tools" data-tab="tools">${raw(ui.tools)}<span>${t('tools')}</span></a>
    </nav>
  </div>`);
  updateThemeButtons();
  applyTextSize();
}

// Larger text for people who need it: scales every rem-based size.
const applyTextSize = () => {
  const big = store.get('bigText', false);
  document.documentElement.classList.toggle('big-text', big);
  document.querySelectorAll('[data-text-size]').forEach((b) => { b.setAttribute('aria-pressed', String(big)); b.setAttribute('aria-label', big ? 'Normal text size' : 'Larger text'); b.textContent = big ? 'A−' : 'A+'; });
};

function updateThemeButtons() {
  document.querySelectorAll('[data-theme-toggle]').forEach((b) => {
    b.innerHTML = isDark() ? ui.sun : ui.moon;
    b.setAttribute('aria-label', isDark() ? 'Switch to light mode' : 'Switch to dark mode');
  });
}

function renderNav(r) {
  const [top, opId, pageId] = r.parts;
  const cur = (cond) => (cond ? raw('aria-current="page"') : '');
  const nav = $('#nav');
  nav.innerHTML = String(html`
    <div class="nav-section">
      <a href="#/" ${cur(!top || top === 'learn')}>${raw(ui.learn)}${t('learn')}</a>
      <a href="#/fix" ${cur(top === 'fix')}>${raw(ui.fix)}${t('fix')}</a>
      <a href="#/tools/feeds" ${cur(top === 'tools' && opId === 'feeds')}>${raw(ui.calc)}${t('feeds')}</a>
      <a href="#/tools/gcode" ${cur(top === 'tools' && opId === 'gcode')}>${raw(ui.gcode)}${t('gcode')}</a>
      <a href="#/practice" ${cur(top === 'practice')}>${raw(ui.part)}Practice parts</a>
      <a href="#/cad" ${cur(top === 'cad')}>${raw(ui.book)}Design (CAD)</a>
      <a href="#/quiz" ${cur(top === 'quiz')}>${raw(ui.check)}Test yourself</a>
      <a href="#/glossary" ${cur(top === 'glossary')}>${raw(ui.book)}${t('glossary')}</a>
      <a href="#/saved" ${cur(top === 'saved')}>${raw(ui.saved)}${t('saved')}</a>
    </div>
    ${groups.map(
      (g) => html`<div class="nav-section" data-group="${g.id}"><div class="nav-heading">${nm(g)}</div>
        ${operations.filter((o) => o.group === g.id).map((o) => html`
          <a href="#/op/${o.id}" ${cur(top === 'op' && opId === o.id)}><span class="op-icon">${raw(opIcons[o.id] || '')}</span>${nm(o)}</a>
          ${top === 'op' && opId === o.id ? html`<div class="sub">${o.pages.map((p, i) => html`<a href="#/op/${o.id}/${p.id}" ${cur((pageId || o.pages[defaultPageIndex(o)].id) === p.id)}>${nm(p)}</a>`)}</div>` : ''}
        `)}
      </div>`,
    )}
    <div class="nav-section" data-group="dynamic"><div class="nav-heading">Design (CAD)</div>
      <a href="#/cad" ${cur(top === 'cad' && !opId)}><span class="op-icon">${raw(ui.part)}</span>Overview</a>
      ${cadTabs.map((t) => html`<a href="#/cad/${t.id}" ${cur(top === 'cad' && opId === t.id)}><span class="op-icon">${raw(ui.chev)}</span>${t.name}</a>`)}
    </div>`);
  // Only bring the current item into view when it is hidden, and never while the pointer is over the sidebar.
  const curEl = nav.querySelector('[aria-current="page"]:not(.nav-section:first-child a)');
  if (curEl && !nav.closest('.sidebar').matches(':hover')) {
    const sb = nav.closest('.sidebar').getBoundingClientRect(), b = curEl.getBoundingClientRect();
    if (b.top < sb.top || b.bottom > sb.bottom) curEl.scrollIntoView({ block: 'nearest' });
  }
  document.querySelectorAll('.tabbar [data-tab]').forEach((a) => {
    const tab = a.dataset.tab;
    const on = tab === 'learn' ? !top || top === 'learn' || top === 'op' || top === 'glossary' || top === 'quiz' || top === 'cad' : tab === 'tools' ? top === 'tools' || top === 'saved' : top === tab;
    if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
}

// ---------- global events ----------
function bind() {
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-search]')) { e.preventDefault(); openSearch(); }
    if (e.target.closest('[data-text-size]')) { store.set('bigText', !store.get('bigText', false)); applyTextSize(); }
    if (e.target.closest('[data-theme-toggle]')) {
      theme = isDark() ? 'light' : 'dark';
      store.set('theme', theme);
      applyTheme(theme);
      updateThemeButtons();
    }
    if (e.target.closest('[data-lang-toggle]')) {
      setLang(getLang() === 'fr' ? 'en' : 'fr');
      renderShell();
      lastKey = '';
      render();
    }
  });
  document.addEventListener('change', (e) => {
    if (e.target.matches('#ver-side, #ver-top')) {
      store.set('version', e.target.value);
      toast(`${e.target.selectedOptions[0].textContent}`);
    }
  });
  document.addEventListener('keydown', (e) => {
    const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName) || document.activeElement?.isContentEditable;
    if ((e.key === '/' && !typing) || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')) {
      e.preventDefault();
      openSearch();
    }
  });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { if (theme === 'auto') { updateThemeButtons(); window.dispatchEvent(new Event('cadteach:theme')); } });
  window.addEventListener('hashchange', render);
}

renderShell();
bind();
render();

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}

export { opById };
