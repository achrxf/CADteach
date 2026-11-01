// Search palette: "/" or Ctrl+K anywhere, the search button on mobile.
import { esc } from '../util.js';
import { t } from '../i18n.js';
import { ui } from '../icons.js';
import { search, highlight } from '../search.js';

let open = false;

const suggestions = ['contour', 'chatter', 'stepover', 'G83', 'lead in', 'wear', 'tabs', 'titanium', 'helix'];

export function openSearch(initial = '') {
  if (open) return;
  open = true;
  const prevFocus = document.activeElement;
  const back = document.createElement('div');
  back.className = 'palette-backdrop';
  back.innerHTML = `<div class="palette" role="dialog" aria-modal="true" aria-label="${esc(t('search'))}">
    <div class="palette-input">${ui.search}<input type="search" placeholder="${esc(t('searchPlaceholder'))}" aria-label="${esc(t('search'))}" autocomplete="off" spellcheck="false" role="combobox" aria-expanded="true" aria-controls="pal-res"><button class="icon-btn" type="button" data-close aria-label="Close">Esc</button></div>
    <ul class="palette-results" id="pal-res" role="listbox"></ul>
    <div class="palette-foot"><span><kbd>↑</kbd> <kbd>↓</kbd> move</span><span><kbd>Enter</kbd> open</span><span><kbd>Esc</kbd> close</span></div>
  </div>`;
  document.body.append(back);
  const input = back.querySelector('input');
  const list = back.querySelector('ul');
  let sel = 0;
  let results = [];

  const draw = () => {
    const q = input.value.trim();
    if (!q) {
      list.innerHTML = `<li class="muted" style="padding:10px 10px 4px;font-size:var(--t-sm)">Try: ${suggestions.map((s) => `<a href="#" data-sugg="${esc(s)}" style="margin-right:8px">${esc(s)}</a>`).join('')}</li>`;
      results = [];
      return;
    }
    results = search(q);
    if (!results.length) { list.innerHTML = `<li class="empty">${esc(t('noResults'))}</li>`; return; }
    sel = Math.min(sel, results.length - 1);
    list.innerHTML = results
      .map((r, i) => `<li role="option" aria-selected="${i === sel}" id="pal-${i}"><a href="${esc(r.href)}"><span class="kind">${esc(r.kind)}</span><br><strong>${highlight(r.title, q, esc)}</strong>${r.snip ? `<span class="snip">${esc(r.snip)}</span>` : ''}</a></li>`)
      .join('');
    input.setAttribute('aria-activedescendant', 'pal-' + sel);
  };
  const close = (restore = true) => {
    back.remove();
    open = false;
    document.removeEventListener('keydown', onKey, true);
    if (restore) prevFocus?.focus?.({ preventScroll: true });
    else prevFocus?.blur?.();
  };
  const go = (href) => {
    close(false);
    const h = href.replace(/^#/, '');
    if (location.hash.replace(/^#/, '') === h) window.dispatchEvent(new HashChangeEvent('hashchange'));
    else location.hash = h;
  };
  const onKey = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.key === 'ArrowDown' && results.length) { e.preventDefault(); sel = (sel + 1) % results.length; draw(); list.querySelector('[aria-selected=true]')?.scrollIntoView({ block: 'nearest' }); }
    else if (e.key === 'ArrowUp' && results.length) { e.preventDefault(); sel = (sel - 1 + results.length) % results.length; draw(); list.querySelector('[aria-selected=true]')?.scrollIntoView({ block: 'nearest' }); }
    else if (e.key === 'Enter' && results[sel]) { e.preventDefault(); go(results[sel].href); }
  };
  document.addEventListener('keydown', onKey, true);
  input.addEventListener('input', () => { sel = 0; draw(); });
  back.addEventListener('click', (e) => {
    if (e.target === back || e.target.closest('[data-close]')) close();
    const sg = e.target.closest('[data-sugg]');
    if (sg) { e.preventDefault(); input.value = sg.dataset.sugg; draw(); input.focus(); }
    const a = e.target.closest('a[href^="#/"]');
    if (a) { e.preventDefault(); go(a.getAttribute('href')); }
  });
  input.value = initial;
  draw();
  input.focus();
}
