import { html, raw, store, toast, esc } from '../util.js';
import { t, nm } from '../i18n.js';
import { ui } from '../icons.js';
import { opById, groups, defaultPageIndex } from '../data/index.js';
import { mountViz, hasViz, vizTitles } from '../viz/param-viz.js';

const keyOf = (...p) => p.join('/');

export function render(r) {
  const [, opId, pageId] = r.parts;
  const op = opById[opId];
  if (!op) return { title: 'Not found', html: html`<p class="empty">No operation called “${opId}”. <a href="#/">Back to all operations</a></p>` };
  const page = op.pages.find((p) => p.id === pageId) || op.pages[defaultPageIndex(op)];
  const group = groups.find((g) => g.id === op.group);
  const bookmarks = store.get('bookmarks', {});
  const notes = store.get('notes', {});
  const verified = store.get('verified', {});
  const version = store.get('version', '2025');
  const opKey = keyOf(op.id);
  const pageKey = keyOf(op.id, page.id);

  const recent = store.get('recent', []).filter((id) => id !== op.id);
  store.set('recent', [op.id, ...recent].slice(0, 6));

  const values = (p) => {
    if (p.values)
      return html`<dl class="values">${['al', 'steel', 'ti'].map((m) => html`<div><dt>${t(m)}</dt><dd>${p.values[m]}</dd></div>`)}</dl>`;
    if (p.typical) return html`<dl class="values single"><div><dt>${t('typical')}</dt><dd>${p.typical}</dd></div></dl>`;
    return '';
  };

  const shownViz = new Set();
  const shotImg = (name, alt, cls = 'shot') =>
    html`<button type="button" class="${cls}" data-zoom="img/mc2025/${name}.jpg" aria-label="Enlarge screenshot: ${alt}"><img src="img/mc2025/${name}.jpg" alt="${alt}" loading="lazy"></button>`;

  const param = (p) => {
    const k = keyOf(op.id, page.id, p.id);
    const saved = !!bookmarks[k];
    let side = '';
    if (p.viz && hasViz(p.viz)) {
      if (!shownViz.has(p.viz)) { shownViz.add(p.viz); side = html`<div class="param-viz" data-viz="${p.viz}"></div>`; }
      else side = html`<a class="viz-ref" href="#/op/${op.id}/${page.id}/${firstWithViz(page, p.viz)}">See the visual “${vizTitles[p.viz]}” above</a>`;
    }
    const shot = p.shot ? html`<figure class="param-shot">${shotImg(p.shot, `${p.name} in the Mastercam 2025 dialog`)}<figcaption>In the Mastercam 2025 dialog</figcaption></figure>` : '';
    const nMist = p.mistakes?.length || 0;
    return html`<article class="param ${side && !String(side).includes('viz-ref') ? 'has-viz' : ''}" id="p-${p.id}" data-param="${p.id}">
      <div class="param-text">
        <div class="param-top">
          <div class="titles">
            <h3>${nm(p)} ${p.isNew ? html`<span class="pill new">${t('newIn')} ${p.isNew}</span>` : ''}</h3>
          </div>
          <div class="param-actions">
            <button class="icon-btn" type="button" data-note="${k}" aria-label="${t('note')}" title="${t('addNote')}" aria-expanded="${!!notes[k]}">${raw(ui.note)}</button>
            <button class="icon-btn" type="button" data-bookmark="${k}" aria-pressed="${saved}" aria-label="${saved ? t('bookmarked') : t('bookmark')}" title="${t('bookmark')}">${raw(saved ? ui.savedFill : ui.saved)}</button>
            <button class="icon-btn" type="button" data-copy="#/op/${op.id}/${page.id}/${p.id}" aria-label="${t('copyLink')}" title="${t('copyLink')}">${raw(ui.link)}</button>
          </div>
        </div>
        <p class="what">${p.what}</p>
        ${p.when ? html`<p class="when">${p.when}</p>` : ''}
        ${values(p)}
        ${nMist || p.gcode || p.tip
          ? html`<details class="more">
              <summary>${nMist ? html`<span class="warn-dot" aria-hidden="true"></span>${nMist} common mistake${nMist > 1 ? 's' : ''}` : 'More'}${p.gcode ? ' · G-code' : ''}${p.tip ? ' · Formula' : ''}</summary>
              ${p.tip ? html`<p class="tip">${p.tip}</p>` : ''}
              ${nMist ? html`<ul class="mistakes" aria-label="${t('mistakes')}">${p.mistakes.map((m) => html`<li>${m}</li>`)}</ul>` : ''}
              ${p.gcode ? html`<p class="gcode-note">G-code: <code>${p.gcode}</code></p>` : ''}
            </details>`
          : ''}
        ${shot}
        <div class="note-box" ${notes[k] ? '' : raw('hidden')}>
          <textarea class="input" data-note-text="${k}" placeholder="Your own note — e.g. the value your shop uses on the DMU">${notes[k] || ''}</textarea>
        </div>
      </div>
      ${side}
    </article>`;
  };

  const isVerified = !!verified[pageKey];

  return {
    title: `${op.name} — ${page.name}`,
    keepFocus: !!pageId,
    html: html`
      <div class="crumbs"><a href="#/">Mastercam ${version}</a> › 2D Mill › ${nm(group)}</div>
      <header class="op-head">
        <div>
          <h1>${nm(op)}</h1>
          <p class="summary">${op.summary}</p>
          <div class="head-actions">
            <button class="btn ghost" type="button" data-bookmark="${opKey}" aria-pressed="${!!bookmarks[opKey]}">${raw(bookmarks[opKey] ? ui.savedFill : ui.saved)} ${bookmarks[opKey] ? t('bookmarked') : t('bookmark')}</button>
            <span class="pill" title="Where to find it in Mastercam">${op.path}</span>
          </div>
          <div class="use-avoid" style="margin-top:18px">
            <div class="use"><h3>${t('useFor')}</h3><ul>${op.useFor.map((u) => html`<li>${u}</li>`)}</ul></div>
            <div class="avoid"><h3>${t('avoid')}</h3><ul>${op.avoid.map((u) => html`<li>${u}</li>`)}</ul></div>
          </div>
          <p class="chain-note"><strong>${t('chaining')}:</strong> ${op.chaining}</p>
        </div>
        <div class="op-stage" id="op-stage" aria-label="3D preview of the ${op.name} toolpath">
          <div class="stage-legend"><span><i></i>feed</span><span><i class="rapid"></i>rapid</span></div>
          <div class="stage-hint">Drag to rotate</div>
        </div>
      </header>

      <nav class="page-tabs" aria-label="Parameter pages">
        ${op.pages.map((p) => html`<a href="#/op/${op.id}/${p.id}" ${p.id === page.id ? raw('aria-current="page"') : ''}>${nm(p)}${p.isNew ? ' ●' : ''}</a>`)}
      </nav>

      <div class="page-body">
        <div class="page-intro ${page.shot ? 'with-shot' : ''}">
          <div>
            <h2>${nm(page)} ${page.isNew ? html`<span class="pill new">${t('newIn')} ${page.isNew}</span>` : ''}</h2>
            ${page.intro ? html`<p>${page.intro}</p>` : ''}
            ${op.checked && page.shot ? html`<p class="checked-note">${raw(ui.check)} Field names checked against Mastercam 2025</p>` : ''}
          </div>
          ${page.shot ? html`<figure class="page-shot">${shotImg(page.shot, `${page.name} page in Mastercam 2025`)}<figcaption>This page in Mastercam 2025 · tap to enlarge</figcaption></figure>` : ''}
        </div>
        <div class="params">${page.params.map(param)}</div>
        <div class="verify-bar">
          ${isVerified
            ? html`<span class="pill ok">${raw(ui.check)} ${t('verified')}</span><button class="btn ghost" type="button" data-verify="${pageKey}">Undo</button>`
            : html`<span>Does this page match your Mastercam? Mark it so you know which pages you have checked yourself.</span><button class="btn ghost" type="button" data-verify="${pageKey}">${raw(ui.check)} ${t('markVerified')}</button>`}
        </div>
        ${pagerLinks(op, page)}
      </div>
      <dialog class="lightbox" aria-label="Screenshot"><form method="dialog"><button class="icon-btn lightbox-close" aria-label="Close">Close</button></form><img alt=""></dialog>
    `,
    mount(root) {
      const cleanups = [];
      const vizStops = [];
      const io = new IntersectionObserver((entries) => {
        for (const e of entries) if (e.isIntersecting) { io.unobserve(e.target); vizStops.push(mountViz(e.target.dataset.viz, e.target)); }
      }, { rootMargin: '300px' });
      root.querySelectorAll('.param-viz').forEach((el) => io.observe(el));
      cleanups.push(() => { io.disconnect(); vizStops.forEach((f) => f()); });
      const lightbox = root.querySelector('.lightbox');

      // 3D preview (lazy)
      const stage = root.querySelector('#op-stage');
      let dispose3d = () => {};
      let cancelled = false;
      import('../viz/preview3d.js')
        .then((m) => m.mountPreview(stage, op.preview))
        .then((d) => { if (cancelled) d(); else dispose3d = d; })
        .catch(() => { stage.innerHTML = '<p class="empty">3D preview needs WebGL.</p>'; });
      cleanups.push(() => { cancelled = true; dispose3d(); });

      const onClick = (e) => {
        const z = e.target.closest('[data-zoom]');
        if (z) { lightbox.querySelector('img').src = z.dataset.zoom; lightbox.querySelector('img').alt = z.getAttribute('aria-label'); lightbox.showModal(); }
        if (e.target === lightbox) lightbox.close();
        const b = e.target.closest('[data-bookmark]');
        if (b) {
          const k = b.dataset.bookmark;
          const bm = store.get('bookmarks', {});
          if (bm[k]) { delete bm[k]; toast(t('removedToast')); }
          else {
            const [o, pg, pa] = k.split('/');
            const opx = opById[o];
            const pgx = pg ? opx.pages.find((x) => x.id === pg) : null;
            const pax = pa ? pgx.params.find((x) => x.id === pa) : null;
            bm[k] = { href: `#/op/${k}`, title: pax ? pax.name : opx.name, sub: pax ? `${opx.name} › ${pgx.name}` : 'Operation', ts: Date.now() };
            toast(t('savedToast'));
          }
          store.set('bookmarks', bm);
          const on = !!bm[k];
          root.querySelectorAll(`[data-bookmark="${CSS.escape(k)}"]`).forEach((el) => {
            el.setAttribute('aria-pressed', on);
            el.innerHTML = el.classList.contains('btn') ? `${on ? ui.savedFill : ui.saved} ${esc(on ? t('bookmarked') : t('bookmark'))}` : on ? ui.savedFill : ui.saved;
          });
        }
        const n = e.target.closest('[data-note]');
        if (n) {
          const box = n.closest('.param').querySelector('.note-box');
          box.hidden = !box.hidden;
          n.setAttribute('aria-expanded', String(!box.hidden));
          if (!box.hidden) box.querySelector('textarea').focus();
        }
        const c = e.target.closest('[data-copy]');
        if (c) {
          const url = location.href.split('#')[0] + c.dataset.copy;
          (navigator.clipboard?.writeText(url) || Promise.reject()).then(() => toast(t('linkCopied')), () => prompt('Copy this link', url));
        }
        const vf = e.target.closest('[data-verify]');
        if (vf) {
          const all = store.get('verified', {});
          if (all[vf.dataset.verify]) delete all[vf.dataset.verify]; else all[vf.dataset.verify] = new Date().toISOString().slice(0, 10);
          store.set('verified', all);
          window.dispatchEvent(new HashChangeEvent('hashchange'));
        }
      };
      let noteTimer;
      const onInput = (e) => {
        const k = e.target.dataset.noteText;
        if (!k) return;
        clearTimeout(noteTimer);
        noteTimer = setTimeout(() => {
          const all = store.get('notes', {});
          const v = e.target.value.trim();
          if (v) all[k] = v; else delete all[k];
          store.set('notes', all);
        }, 300);
      };
      root.addEventListener('click', onClick);
      root.addEventListener('input', onInput);
      cleanups.push(() => {
        root.removeEventListener('click', onClick);
        root.removeEventListener('input', onInput);
      });
      // keep the current tab visible in the scrolling tab bar
      root.querySelector('.page-tabs [aria-current]')?.scrollIntoView({ block: 'nearest', inline: 'center' });
      return () => cleanups.forEach((f) => f());
    },
  };
}

function pagerLinks(op, page) {
  const i = op.pages.indexOf(page);
  const prev = op.pages[i - 1], next = op.pages[i + 1];
  return html`<nav style="display:flex;justify-content:space-between;gap:12px;margin-top:24px" aria-label="Pages">
    ${prev ? html`<a class="btn ghost" href="#/op/${op.id}/${prev.id}">‹ ${nm(prev)}</a>` : raw('<span></span>')}
    ${next ? html`<a class="btn ghost" href="#/op/${op.id}/${next.id}">${nm(next)} ›</a>` : ''}
  </nav>`;
}

function firstWithViz(page, kind) {
  return page.params.find((p) => p.viz === kind)?.id || '';
}
