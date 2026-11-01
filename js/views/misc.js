import { html, raw, store, toast } from '../util.js';
import { t, nm } from '../i18n.js';
import { glossary } from '../data/reference.js';
import { operations, versions, whatsNew, roadmap, opById } from '../data/index.js';

export function render(r) {
  const top = r.parts[0];
  if (top === 'glossary') return glossaryView();
  if (top === 'saved') return saved();
  if (top === 'about') return about();
  return { title: 'Not found', html: html`<h1 class="page-title">Page not found</h1><p><a href="#/">Go to all operations</a></p>` };
}

function glossaryView() {
  const sorted = [...glossary].sort((a, b) => a.en.localeCompare(b.en));
  return {
    title: t('glossary'),
    html: html`<h1 class="page-title">${t('glossary')}</h1>
      <p class="lede">The words used on CADteach, in English and French, as they are used in the shop.</p>
      <dl class="gloss">${sorted.map((g) => html`<div class="gloss-row" id="${g.en}"><dt><div>${g.en}<span class="fr">${g.fr}</span></div></dt><dd><div>${g.def}</div></dd></div>`)}</dl>`,
  };
}

function saved() {
  const bm = store.get('bookmarks', {});
  const notes = store.get('notes', {});
  const items = Object.entries(bm).sort((a, b) => b[1].ts - a[1].ts);
  const noteOnly = Object.keys(notes).filter((k) => !bm[k]);
  const label = (k) => {
    const [o, pg, pa] = k.split('/');
    const op = opById[o];
    const page = op?.pages.find((x) => x.id === pg);
    const p = page?.params.find((x) => x.id === pa);
    return { title: p ? nm(p) : op ? nm(op) : k, sub: p ? `${nm(op)} › ${nm(page)}` : '' };
  };
  return {
    title: t('saved'),
    html: html`<h1 class="page-title">${t('saved')}</h1>
      <p class="lede">Parameters you saved and the notes you wrote. They stay on this device; export them to move them to another one.</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px">
        <button class="btn ghost" type="button" data-export>Export (.json)</button>
        <label class="btn ghost" style="cursor:pointer">Import<input type="file" accept="application/json" data-import hidden></label>
      </div>
      ${!items.length && !noteOnly.length ? html`<p class="empty">Nothing saved yet. Use the bookmark button next to any parameter.</p>` : ''}
      <ul class="saved-list">
        ${items.map(([k, v]) => {
          const l = label(k);
          return html`<li><div><a href="${v.href}"><strong>${l.title}</strong></a><div class="muted" style="font-size:var(--t-sm)">${l.sub}</div>${notes[k] ? html`<div class="note">${notes[k]}</div>` : ''}</div><button class="icon-btn" type="button" data-remove="${k}">Remove</button></li>`;
        })}
        ${noteOnly.map((k) => {
          const l = label(k);
          return html`<li><div><a href="#/op/${k}"><strong>${l.title}</strong></a><div class="muted" style="font-size:var(--t-sm)">${l.sub} — note</div><div class="note">${notes[k]}</div></div></li>`;
        })}
      </ul>`,
    mount(root) {
      root.addEventListener('click', (e) => {
        const rm = e.target.closest('[data-remove]');
        if (rm) {
          const all = store.get('bookmarks', {});
          delete all[rm.dataset.remove];
          store.set('bookmarks', all);
          rm.closest('li').remove();
          toast(t('removedToast'));
        }
        if (e.target.closest('[data-export]')) {
          const data = { app: 'CADteach', exported: new Date().toISOString(), bookmarks: store.get('bookmarks', {}), notes: store.get('notes', {}), verified: store.get('verified', {}) };
          const a = document.createElement('a');
          a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
          a.download = `cadteach-saved-${new Date().toISOString().slice(0, 10)}.json`;
          a.click();
          setTimeout(() => URL.revokeObjectURL(a.href), 1000);
        }
      });
      root.querySelector('[data-import]').addEventListener('change', async (e) => {
        const f = e.target.files[0];
        if (!f) return;
        try {
          const d = JSON.parse(await f.text());
          if (d.app !== 'CADteach') throw new Error();
          store.set('bookmarks', { ...store.get('bookmarks', {}), ...d.bookmarks });
          store.set('notes', { ...store.get('notes', {}), ...d.notes });
          store.set('verified', { ...store.get('verified', {}), ...d.verified });
          toast('Imported');
          window.dispatchEvent(new HashChangeEvent('hashchange'));
        } catch {
          toast('That file is not a CADteach export.');
        }
      });
    },
  };
}

function about() {
  const verified = store.get('verified', {});
  const pages = operations.flatMap((o) => o.pages.map((p) => ({ o, p })));
  const done = pages.filter(({ o, p }) => verified[`${o.id}/${p.id}`]).length;
  const wn = whatsNew['2025'];
  return {
    title: t('about'),
    html: html`<h1 class="page-title">${t('about')}</h1>
      <p class="lede">CADteach explains Mastercam parameter by parameter. Version 1 covers the Mastercam 2025 2D mill toolpaths.</p>

      <h2 class="section-title">What’s new in Mastercam 2025 (2D mill)</h2>
      <ul class="timeline">
        ${wn.items.map((i) => html`<li><span class="v">2025</span><span>${i.text} ${i.op ? html`<a href="#/op/${i.op}/${i.page}">Open</a>` : ''}</span></li>`)}
      </ul>
      <p class="muted" style="font-size:var(--t-sm);margin-top:8px">Source: <a href="${wn.source}" target="_blank" rel="noopener">Mastercam 2025 milling enhancements</a>.</p>

      <h2 class="section-title">Checked pages</h2>
      <p>All toolpaths were checked by the author. Separately, <b>you</b> have marked ${done} of ${pages.length} pages as checked on your own machine with the button at the bottom of each page.</p>
      <p class="muted" style="font-size:var(--t-sm);max-width:70ch">All 12 toolpaths were checked field by field against Mastercam 2025 (Mill Default MM template); the dialog screenshots come from that install. Explanations are our own words, not copied from the Mastercam help. Field names and defaults can differ slightly between versions — when a page matches your install, mark it as checked. Typical values are starting points for carbide in a rigid setup; the tool maker’s data always wins.</p>

      <h2 class="section-title">Versions</h2>
      <ul class="timeline">${versions.map((v) => html`<li><span class="v">${v.id}</span><span>${v.name} — ${v.status === 'content' ? 'content available' : 'planned'}</span></li>`)}</ul>

      <h2 class="section-title">Roadmap</h2>
      <ul class="timeline">${roadmap.map((x) => html`<li><span class="v">${x.v}</span><span>${x.text}</span></li>`)}</ul>

      <p class="muted" style="font-size:var(--t-sm);margin-top:28px">Mastercam is a trademark of CNC Software, LLC. CADteach is an independent learning resource and is not affiliated with or endorsed by CNC Software.</p>`,
  };
}
