import { html, raw, store } from '../util.js';
import { t, nm } from '../i18n.js';
import { opIcons } from '../icons.js';
import { operations, groups } from '../data/index.js';
import { symptoms } from '../data/reference.js';
import { droHtml, droTicker } from './machine.js';
import { opProgress, totals, bestScore, ring } from './progress.js';

const firstSentence = (s) => (s.match(/^.*?[.!?](\s|$)/) || [s])[0].trim();

export function render() {
  const version = store.get('version', '2025');
  const paramCount = new Set(operations.flatMap((o) => o.pages.flatMap((p) => p.params))).size;
  const recent = store.get('recent', []).map((id) => operations.find((o) => o.id === id)).filter(Boolean).slice(0, 4);
  const tot = totals();
  const path = ['facing', 'dynamic-mill', 'contour', 'pocket', 'drill'].map((id) => operations.find((o) => o.id === id));
  const pathWhy = { facing: 'Clean up the top', 'dynamic-mill': 'Rough out the bulk', contour: 'Finish the walls', pocket: 'Clear the pockets', drill: 'Drill the holes' };
  return {
    title: '',
    html: html`
      <section class="machine hero">
        <div class="machine-bar">
          <span class="lamp" aria-hidden="true"></span>
          <span>Mastercam ${version}</span><span>2D Mill</span>
          <span class="machine-bar-r">${tot.seen ? `${tot.seen} of ${tot.total} pages explored` : 'Program ready'}</span>
        </div>
        <div class="machine-body">
          <div class="hero-text">
            <h1>Know what every Mastercam field does.</h1>
            <p class="lede">Every 2D mill toolpath, page by page as in the dialog: what each field does, when to change it, values for aluminium, steel and titanium, and the mistakes that scrap parts.</p>
            <div class="actions">
              <a class="btn btn-cycle" href="#/op/contour"><span class="cycle-dot" aria-hidden="true"></span>Start with Contour</a>
              <button class="btn ghost" type="button" data-search>${t('search')} <kbd>/</kbd></button>
            </div>
            <dl class="counters">
              <div><dt>Toolpaths</dt><dd>${operations.length}</dd></div>
              <div><dt>Fields explained</dt><dd>${paramCount}</dd></div>
              <div><dt>Shop problems</dt><dd>${symptoms.length}</dd></div>
            </dl>
          </div>
          <div class="screen">
            <div class="hero-stage" id="hero-stage" aria-label="3D preview of a contour toolpath around a part">
              <div class="stage-legend"><span><i></i>feed</span><span><i class="rapid"></i>rapid</span></div>
              <div class="stage-hint">${matchMedia('(pointer: coarse)').matches ? 'Two fingers to rotate' : 'Drag to rotate'}</div>
            </div>
            ${droHtml('contour')}
          </div>
        </div>
      </section>

      ${recent.length
        ? html`<h2 class="section-title">Continue</h2>
          <div class="strip">${recent.map((o) => html`<a href="#/op/${o.id}" data-group="${o.group}"><h3>${nm(o)}</h3><p>${o.summary}</p></a>`)}</div>`
        : ''}

      <section class="first-part" aria-labelledby="fp-title">
        <div class="fp-head">
          <h2 class="section-title" id="fp-title">New to 2D? Program a first part</h2>
          <p>Five toolpaths in the order you would run them on a plate: face, rough, finish, pocket, drill.</p>
        </div>
        <ol class="fp-route">
          ${path.map((o, i) => {
            const pr = opProgress(o);
            return html`<li data-group="${o.group}" class="${pr.seen ? 'is-started' : ''} ${pr.f === 1 ? 'is-done' : ''}">
              <a href="#/op/${o.id}">
                <span class="fp-node" aria-hidden="true">${raw(opIcons[o.id] || '')}</span>
                <span class="fp-op">Op ${i + 1}</span>
                <strong>${nm(o)}</strong>
                <span class="fp-why">${pathWhy[o.id]}</span>
                <span class="fp-state">${pr.f === 1 ? 'All pages opened' : pr.seen ? `${pr.seen} of ${pr.total} pages` : 'Not started'}</span>
              </a>
            </li>`;
          })}
        </ol>
      </section>

      <h2 class="section-title">${t('operations')}</h2>
      <div class="op-groups">
        ${groups.map(
          (g) => html`<section class="op-group" data-group="${g.id}">
            <h2><span class="group-chip" aria-hidden="true"></span>${nm(g)}</h2>
            <p>${g.blurb}</p>
            <div class="op-grid">
              ${operations.filter((o) => o.group === g.id).map((o) => {
                const pr = opProgress(o);
                const best = bestScore(o.id);
                return html`<a class="op-tile" href="#/op/${o.id}" data-group="${o.group}">
                  <span class="op-icon">${raw(ring(pr.f))}${raw(opIcons[o.id] || '')}</span>
                  <h3>${nm(o)}</h3>
                  <p>${firstSentence(o.summary)}</p>
                  ${pr.seen || best ? html`<span class="tile-meta">${pr.seen ? `${pr.seen}/${pr.total} pages` : ''}${best ? html`<span class="quiz-badge ${best.score === best.of ? 'perfect' : ''}">Quiz ${best.score}/${best.of}</span>` : ''}</span>` : ''}
                </a>`;
              })}
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
        .then((m) => m.mountPreview(stage, 'contour', { onTick: droTicker(root, 'contour') }))
        .then((d) => { if (cancelled) d(); else dispose = d; })
        .catch(() => { stage.innerHTML = '<p class="empty">3D preview needs WebGL.</p>'; });
      return () => { cancelled = true; dispose(); };
    },
  };
}
