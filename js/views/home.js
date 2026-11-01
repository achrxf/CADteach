import { html, raw, store } from '../util.js';
import { t, nm } from '../i18n.js';
import { opIcons } from '../icons.js';
import { operations, groups } from '../data/index.js';
import { symptoms } from '../data/reference.js';

const firstSentence = (s) => (s.match(/^.*?[.!?](\s|$)/) || [s])[0].trim();

export function render() {
  const version = store.get('version', '2025');
  const paramCount = new Set(operations.flatMap((o) => o.pages.flatMap((p) => p.params))).size;
  const recent = store.get('recent', []).map((id) => operations.find((o) => o.id === id)).filter(Boolean).slice(0, 4);
  return {
    title: '',
    html: html`
      <section class="hero">
        <div>
          <h1>Know what every Mastercam field does.</h1>
          <p class="lede">The ${version} 2D mill toolpaths, page by page as in the dialog: what each parameter does, when to change it, typical values in aluminium, steel and titanium, and the mistakes that scrap parts.</p>
          <div class="actions">
            <a class="btn" href="#/op/contour">Start with Contour</a>
            <button class="btn ghost" type="button" data-search>${t('search')} <kbd>/</kbd></button>
          </div>
          <p class="muted" style="margin-top:14px;font-size:var(--t-sm)">${operations.length} toolpaths, ${paramCount} parameters explained, ${symptoms.length} shop-floor problems traced back to the parameter that causes them.</p>
        </div>
        <div class="hero-stage" id="hero-stage" aria-label="3D preview of a contour toolpath around a part">
          <div class="stage-legend"><span><i></i>feed</span><span><i class="rapid"></i>rapid</span></div>
          <div class="stage-hint">${matchMedia('(pointer: coarse)').matches ? 'Two fingers to rotate' : 'Drag to rotate'}</div>
        </div>
      </section>

      ${recent.length
        ? html`<h2 class="section-title" style="margin-top:8px">Continue</h2>
          <div class="strip">${recent.map((o) => html`<a href="#/op/${o.id}"><h3>${nm(o)}</h3><p>${o.summary}</p></a>`)}</div>`
        : ''}

      <h2 class="section-title">${t('operations')}</h2>
      <div class="op-groups">
        ${groups.map(
          (g) => html`<section class="op-group">
            <h2>${nm(g)}</h2>
            <p>${g.blurb}</p>
            <div class="op-grid">
              ${operations.filter((o) => o.group === g.id).map(
                (o) => html`<a class="op-tile" href="#/op/${o.id}"><span class="op-icon">${raw(opIcons[o.id] || '')}</span><h3>${nm(o)}</h3><p>${firstSentence(o.summary)}</p></a>`,
              )}
            </div>
          </section>`,
        )}
      </div>

      <h2 class="section-title">On the machine</h2>
      <div class="strip">
        <a href="#/fix"><h3>${t('fix')}</h3><p>Chatter, marks, oversize walls, broken tools — find the parameter behind it.</p></a>
        <a href="#/tools/feeds"><h3>${t('feeds')}</h3><p>RPM, feed and chip thinning for dynamic stepovers.</p></a>
        <a href="#/tools/gcode"><h3>${t('gcode')}</h3><p>Paste a Fanuc or Haas program, read it line by line.</p></a>
        <a href="#/glossary"><h3>${t('glossary')}</h3><p>English and French shop terms side by side.</p></a>
      </div>
    `,
    mount(root) {
      const stage = root.querySelector('#hero-stage');
      let dispose = () => {};
      let cancelled = false;
      import('../viz/preview3d.js')
        .then((m) => m.mountPreview(stage, 'contour'))
        .then((d) => { if (cancelled) d(); else dispose = d; })
        .catch(() => { stage.innerHTML = '<p class="empty">3D preview needs WebGL.</p>'; });
      return () => { cancelled = true; dispose(); };
    },
  };
}
