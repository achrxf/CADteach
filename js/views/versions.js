// Versions 2018–2026: an interactive timeline, a feature matrix and an upgrade comparison.
import { html, raw, store, toast } from '../util.js';
import { versionList, changes, BASE_VERSION } from '../data/versions.js';
import { opById } from '../data/index.js';
import { cadTabs } from '../data/cad.js';

const cadWhere = {};
for (const t of cadTabs) for (const g of t.groups) for (const c of g.cmds) cadWhere[c.id] = { tab: t.id, name: c.name };

// Rows of the feature matrix: one line per thing a programmer notices
const matrix = [
  ['Toolpath Hole Definition panel', { v: '2019' }, '#/op/drill/hole-definition'],
  ['Solid Hole (CAD)', { v: '2019' }, '#/cad/solids/hole'],
  ['Override geometry diameter (milled holes)', { v: '2020' }, '#/op/circle-mill/cut/circle-diameter'],
  ['Trim to Entities / Modify Length split', { v: '2020' }, '#/cad/wireframe/trim'],
  ['Skip pockets smaller than (Dynamic Mill)', { v: '2021' }, '#/op/dynamic-mill/entry-motion/skip-pockets'],
  ['Corner Pretreatment page', { v: '2021' }, '#/op/dynamic-mill/corner-pretreatment'],
  ['Point Small Arcs', { v: '2021' }, '#/cad/wireframe/point-position'],
  ['Automatic regions from solids', { v: '2022' }, '#/op/dynamic-mill/chain-options/regions'],
  ['Machine Group Setup panel', { v: '2023' }, '#/cad/machine/job-setup'],
  ['Break Through / Tip Comp on the Linking page', { v: '2024' }, '#/op/contour/linking/break-through'],
  ['Area Mill closed / open contour direction', { v: '2024' }, '#/op/area-mill/cut/direction'],
  ['Maximum engagement', { v: '2024' }, '#/op/dynamic-mill/cut/max-engagement'],
  ['Process Hole toolpath', { v: '2024' }, ''],
  ['Finish passes inside Dynamic / Area Mill', { v: '2025' }, '#/op/dynamic-mill/finish-passes'],
  ['Thread Mill tool edge feed and gradual lead', { v: '2025' }, '#/op/thread-mill/cut/tool-edge-feed'],
  ['Tapered helix entry', { v: '2026' }, '#/op/dynamic-mill/entry-motion/entry-method'],
  ['Planes and Levels managers as trees', { v: '2026' }, '#/cad/basics/levels'],
];

const where = (c) => {
  if (c.cad) return cadWhere[c.cad] ? { label: 'CAD › ' + cadWhere[c.cad].name, href: `#/cad/${cadWhere[c.cad].tab}/${c.cad}` } : { label: 'CAD', href: '' };
  if (!c.op) return { label: 'General', href: '' };
  const ids = c.op === '*' ? ['contour'] : [].concat(c.op);
  const op = opById[ids[0]];
  const page = c.page && op?.pages.find((p) => p.id === c.page);
  const name = c.op === '*' ? 'All toolpaths' : ids.length > 1 ? ids.map((i) => opById[i]?.name || i).join(', ') : op?.name;
  return { label: name + (page ? ' › ' + page.name : ''), href: page ? `#/op/${op.id}/${page.id}${c.param ? '/' + c.param : ''}` : op ? `#/op/${op.id}` : '' };
};
const area = (c) => (c.cad ? 'CAD' : !c.op ? 'General' : [].concat(c.op).every((o) => ['drill', 'circle-mill', 'helix-bore', 'thread-mill'].includes(o)) ? 'Holes' : 'Toolpaths');

const item = (c) => {
  const w = where(c);
  return html`<li class="vc-item vc-${c.type}"><span class="vc-type">${{ added: 'New', changed: 'Changed', removed: 'Removed', info: 'Better' }[c.type]}</span>
    <div><p>${c.text}${c.check ? html` <i class="vnote-check">(to check)</i>` : ''}</p>
    ${c.before ? html`<p class="vc-before">Before: ${c.before}</p>` : ''}
    <p class="vc-where">${w.href ? html`<a href="${w.href}">${w.label}</a>` : w.label}</p></div></li>`;
};

export function render(r) {
  const mine = store.get('version', BASE_VERSION);
  const sel = r.parts[1] && versionList.some((v) => v.id === r.parts[1]) ? r.parts[1] : mine;
  const from = r.query.get('from') || mine;
  const to = r.query.get('to') || BASE_VERSION;
  const lo = Math.min(+from, +to), hi = Math.max(+from, +to);
  const between = changes.filter((c) => +c.v > lo && +c.v <= hi);
  const groups = ['Toolpaths', 'Holes', 'CAD', 'General'];
  const ids = versionList.map((v) => v.id);

  return {
    title: 'Mastercam versions 2018–2026',
    html: html`
      <h1 class="page-title">Mastercam 2018 to 2026</h1>
      <p class="lede">This guide is written for Mastercam 2025. Pick your version at the top and every toolpath and CAD page marks what is missing, different or newer in it. Here is the whole story, one release at a time.</p>

      <section class="vt" aria-label="Version timeline">
        <div class="vt-track" role="tablist" aria-label="Versions">
          ${versionList.map((v) => html`<a role="tab" href="#/versions/${v.id}" class="vt-node ${v.id === sel ? 'on' : ''} ${v.id === mine ? 'mine' : ''}" aria-selected="${v.id === sel}" style="--n:${changes.filter((c) => c.v === v.id).length}">
            <span class="vt-dot" aria-hidden="true"></span><span class="vt-y">${v.id}</span>${v.id === mine ? html`<span class="vt-me">yours</span>` : ''}</a>`)}
        </div>
        <input class="vt-range" type="range" min="0" max="${ids.length - 1}" step="1" value="${ids.indexOf(sel)}" aria-label="Scrub through the versions">
      </section>

      <section class="vt-panel">
        <div class="vt-head">
          <div>
            <h2>Mastercam ${sel}</h2>
            <p class="muted">Released ${versionList.find((v) => v.id === sel).year} · ${versionList.find((v) => v.id === sel).note}</p>
          </div>
          ${sel === mine ? html`<span class="pill ok">Your version</span>` : html`<button class="btn" type="button" data-set-version="${sel}">This is my version</button>`}
        </div>
        ${groups.map((g) => { const list = changes.filter((c) => c.v === sel && area(c) === g); return list.length ? html`<h3 class="vc-group">${g}</h3><ul class="vc-list">${list.map(item)}</ul>` : ''; })}
      </section>

      <section>
        <h2 class="section-title">Which version has what</h2>
        <p class="muted" style="margin-top:0">Filled = there in that version. Tap a row to open it in the guide; the highlighted column is the version picked above.</p>
        <div class="vm-wrap"><table class="vm">
          <thead><tr><th scope="col">Feature</th>${ids.map((v) => html`<th scope="col" class="${v === sel ? 'on' : ''}">${v.slice(2)}</th>`)}</tr></thead>
          <tbody>${matrix.map(([name, { v }, href]) => html`<tr>
            <th scope="row">${href ? html`<a href="${href}">${name}</a>` : name}</th>
            ${ids.map((x) => html`<td class="${x === sel ? 'on' : ''}"><span class="vm-dot ${+x >= +v ? 'has' : ''} ${x === v ? 'first' : ''}" title="${+x >= +v ? (x === v ? 'New in ' + x : 'In ' + x) : 'Not in ' + x}"></span></td>`)}
          </tr>`)}</tbody>
        </table></div>
      </section>

      <section>
        <h2 class="section-title">Moving between versions</h2>
        <form class="vu-form" aria-label="Compare two versions">
          <label>From <select class="select" name="from">${ids.map((v) => html`<option ${v === from ? raw('selected') : ''}>${v}</option>`)}</select></label>
          <span aria-hidden="true">→</span>
          <label>To <select class="select" name="to">${ids.map((v) => html`<option ${v === to ? raw('selected') : ''}>${v}</option>`)}</select></label>
          <span class="muted">${between.length} change${between.length === 1 ? '' : 's'}${+from > +to ? ' (going back: these are the things you lose)' : ''}</span>
        </form>
        ${lo === hi ? html`<p class="muted">Pick two different versions.</p>` : groups.map((g) => { const list = between.filter((c) => area(c) === g); return list.length ? html`<h3 class="vc-group">${g}</h3><ul class="vc-list">${list.map((c) => html`<li class="vc-item vc-${c.type}"><span class="vc-type">${c.v}</span><div><p>${c.text}</p><p class="vc-where">${(() => { const w = where(c); return w.href ? html`<a href="${w.href}">${w.label}</a>` : w.label; })()}</p></div></li>`)}</ul>` : ''; })}
      </section>

      <section class="vt-about">
        <h2 class="section-title">About screenshots and sources</h2>
        <p>The dialog screenshots in this guide were taken in Mastercam 2025. Other versions use the same ribbon layout (since 2017), so most pages look the same; where a field moved or was renamed, the page says so in a note. Screenshots of older versions are not copied here: Mastercam's own images belong to CNC Software, and the interactive drawings explain the settings better anyway. If you have an older version at work, the "Mark as checked" button on each page records what you confirmed yourself.</p>
        <p>Changes come from Mastercam's What's New documents and release articles, summarised in our own words. Items marked "to check" come from a short summary only.</p>
        <ul class="vt-src">
          <li><a href="https://www.mastercam.dk/download/mastercam/news/28022017/WhatsNew-Mastercam%202018.pdf" target="_blank" rel="noopener">What's New in Mastercam 2018</a></li>
          <li><a href="https://www.mastercam.dk/download/mastercam/news/02072018/Mastercam_2019_Highlights.pdf" target="_blank" rel="noopener">Mastercam 2019 Highlights</a></li>
          <li><a href="https://www.mastercam.dk/download/mastercam/news/14052019/WhatsNew-Mastercam-2020.pdf" target="_blank" rel="noopener">What's New in Mastercam 2020</a></li>
          <li><a href="https://www.mastercam.dk/download/mastercam/news/27022020/WhatsNew.pdf" target="_blank" rel="noopener">What's New in Mastercam 2021</a></li>
          <li><a href="https://www.mastercam.com/community/blog/5-new-mastercam-2022-features-you-need-to-know/" target="_blank" rel="noopener">5 new Mastercam 2022 features</a></li>
          <li><a href="https://www.digitalengineering247.com/article/mastercam-2023-now-released/additive-manufacturing" target="_blank" rel="noopener">Mastercam 2023 released</a></li>
          <li><a href="https://my.mastercam.com/whats-new-2024/whats-new-2024_tipcomp_breakthrough" target="_blank" rel="noopener">2024: Consolidating parameter locations</a>, <a href="https://my.mastercam.com/whats-new-2024/whats-new-2024_area_mill/" target="_blank" rel="noopener">Area Mill</a>, <a href="https://my.mastercam.com/whats-new-2024/whats-new-2024_maximum_engagement" target="_blank" rel="noopener">Maximum engagement</a></li>
          <li><a href="https://online.flippingbook.com/view/255868335/1/" target="_blank" rel="noopener">What's New in Mastercam 2025</a></li>
          <li><a href="https://www.mastercam.com/wp-content/uploads/2025/06/Mastercam-2026-Whats-New.pdf" target="_blank" rel="noopener">What's New in Mastercam 2026</a></li>
        </ul>
      </section>`,
    mount(root) {
      const ids2 = ids;
      const onInput = (e) => {
        // light up the node while dragging; load the version when the thumb is let go
        if (e.target.matches('.vt-range')) root.querySelectorAll('.vt-node').forEach((n, i) => n.classList.toggle('hover', i === +e.target.value));
      };
      const onChange = (e) => {
        if (e.target.matches('.vt-range')) { location.hash = '#/versions/' + ids2[+e.target.value]; return; }
        const f = e.target.closest('.vu-form');
        if (f) location.hash = `#/versions/${sel}?from=${f.from.value}&to=${f.to.value}`;
      };
      const onClick = (e) => {
        const b = e.target.closest('[data-set-version]');
        if (!b) return;
        store.set('version', b.dataset.setVersion);
        document.querySelectorAll('#ver-side, #ver-top').forEach((s) => { s.value = b.dataset.setVersion; });
        toast(`Mastercam ${b.dataset.setVersion} set as your version`);
        location.hash = `#/versions/${b.dataset.setVersion}?from=${b.dataset.setVersion}&to=${BASE_VERSION}`;
      };
      root.addEventListener('input', onInput);
      root.addEventListener('change', onChange);
      root.addEventListener('click', onClick);
      return () => { root.removeEventListener('input', onInput); root.removeEventListener('change', onChange); root.removeEventListener('click', onClick); };
    },
  };
}
