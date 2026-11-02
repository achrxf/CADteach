// Practice parts: a list, then one page per part with the 3D setup, the drawing,
// downloads, the job brief and a suggested plan.
import { html, raw, store, toast } from '../util.js';
import { nm } from '../i18n.js';
import { opById, groups } from '../data/index.js';
import { parts, partById, machines, levels } from '../data/practice.js';
import { svgPaths, geoBox } from '../practice-geom.js';
import { chips as burst } from './quiz.js';

const fmt = (n) => String(+n.toFixed(2));
const shownFeats = (p) => p.features.filter((f) => !f.hidden);
const groupOf = (opId) => opById[opId]?.group;

// Top-view drawing: geometry clipped to the stock, feature letters, overall size and
// ordinate dimensions (every feature position from the work zero, like a shop print).
let clipN = 0;
export function drawing(part, { small = false } = {}) {
  const outside = part.features.find((f) => f.kind === 'outside');
  const bb = geoBox(part.base), ob = outside ? geoBox(outside.geo) : bb;
  const bw = bb[2] - bb[0], bh = bb[3] - bb[1];
  const pw = +(ob[2] - ob[0]).toFixed(1), ph = +(ob[3] - ob[1]).toFixed(1);
  const u = Math.max(bw, bh) / 120; // drawing unit: keeps text and bubbles the same size on any part
  const m = small ? 6 : 30 * u, ml = small ? 6 : 40 * u;
  const vb = [bb[0] - ml, -bb[3] - ml, bw + ml + m, bh + ml + m];
  const paths = svgPaths(part);
  const id = 'dwclip' + ++clipN;
  // ordinate values: centres of round features and slots, and edges of rectangular ones
  const xs = new Set([0, +ob[0].toFixed(2), +ob[2].toFixed(2)]), ys = new Set([0, +ob[1].toFixed(2), +ob[3].toFixed(2)]);
  for (const f of part.features) {
    const g = f.geo; if (!g || f.kind === 'note') continue;
    const add = (x, y) => { if (x >= bb[0] - 0.01 && x <= bb[2] + 0.01) xs.add(+x.toFixed(2)); if (y >= bb[1] - 0.01 && y <= bb[3] + 0.01) ys.add(+y.toFixed(2)); };
    if (g.circles) g.circles.at.forEach(([x, y]) => add(x, y));
    else if (g.circle || g.obround) add((g.circle || g.obround)[0], (g.circle || g.obround)[1]);
    else if (g.band) g.band.forEach((v) => (g.axis === 'y' ? add(1e9, v) : add(v, 1e9)));
    else if (g.rrect && !g.rrect[5]) { const [cx, cy, w, h] = g.rrect; add(cx - w / 2, cy - h / 2); add(cx + w / 2, cy + h / 2); }
  }
  const fs = 3.6 * u;
  const ordX = [...xs].sort((a, b) => a - b), ordY = [...ys].sort((a, b) => a - b);
  // skip labels that would overlap the previous one
  const spaced = (vals) => { const out = []; let last = -Infinity; for (const v of vals) { if (v - last >= fs * 1.25) { out.push(v); last = v; } } return out; };
  const ordinates = small ? '' : `<g class="dw-ord" style="font-size:${fmt(fs)}px">
      ${spaced(ordX).map((x) => `<path d="M${x} ${-bb[3] - 2 * u}V${-bb[3] - 9 * u}"/><text x="${x}" y="${-bb[3] - 10.5 * u}" transform="rotate(-90 ${x} ${-bb[3] - 10.5 * u})">${fmt(x)}</text>`).join('')}
      ${spaced(ordY).map((y) => `<path d="M${bb[0] - 2 * u} ${-y}H${bb[0] - 9 * u}"/><text x="${bb[0] - 10.5 * u}" y="${-y + fs * 0.35}">${fmt(y)}</text>`).join('')}
    </g>`;
  // bubbles, nudged apart when they would overlap
  const placed = [];
  const R = 4.6 * u;
  const bubble = (f) => {
    const g = f.geo; if (!g || small) return '';
    let x, y;
    if (g.band) {
      const lo = g.axis === 'y' ? bb[1] : bb[0], hi = g.axis === 'y' ? bb[3] : bb[2];
      const mid = (Math.max(g.band[0], lo) + Math.min(g.band[1], hi)) / 2;
      [x, y] = g.axis === 'y' ? [bb[2] - 12 * u, mid] : [mid, bb[1] + 12 * u];
    } else if (g.circles) { const [px, py] = g.circles.at[g.circles.at.length - 1]; [x, y] = [px + 4 * u, py + 4 * u]; }
    else if (g.obround) [x, y] = [g.obround[0], g.obround[1]];
    else if (g.circle) { const k = f.kind === 'island' ? -0.72 : 0.72; [x, y] = [g.circle[0] + (g.circle[2] / 2) * k, g.circle[1] + (g.circle[2] / 2) * 0.72]; }
    else { const b = geoBox(g); const cb = [Math.max(b[0], bb[0]), Math.max(b[1], bb[1]), Math.min(b[2], bb[2]), Math.min(b[3], bb[3])]; [x, y] = f.kind === 'outside' ? [(cb[0] + cb[2]) / 2, cb[3]] : [(cb[0] + cb[2]) / 2, cb[3] - 6 * u]; }
    for (let k = 0; k < 12 && placed.some(([px, py]) => Math.hypot(px - x, py - y) < 2.2 * R); k++) { x += 2.4 * R * Math.cos(k * 1.3); y += 2.4 * R * Math.sin(k * 1.3); }
    x = Math.min(Math.max(x, bb[0] + R), bb[2] - R); y = Math.min(Math.max(y, bb[1] + R), bb[3] - R);
    placed.push([x, y]);
    return `<g class="dw-tag" data-f="${f.id}"><circle cx="${fmt(x)}" cy="${fmt(-y)}" r="${fmt(R)}"/><text x="${fmt(x)}" y="${fmt(-y + R * 0.38)}" style="font-size:${fmt(R * 1.05)}px">${f.id}</text></g>`;
  };
  const dim = small ? '' : `
    <g class="dw-dim" style="font-size:${fmt(fs * 1.15)}px">
      <path d="M${ob[0]} ${-bb[1] + 3 * u}V${-bb[1] + m - 2 * u}M${ob[2]} ${-bb[1] + 3 * u}V${-bb[1] + m - 2 * u}M${ob[0]} ${-bb[1] + m - 7 * u}H${ob[2]}" />
      <text x="${(ob[0] + ob[2]) / 2}" y="${-bb[1] + m - 9 * u}">${pw}</text>
      <path d="M${bb[2] + 3 * u} ${-ob[3]}H${bb[2] + m - 2 * u}M${bb[2] + 3 * u} ${-ob[1]}H${bb[2] + m - 2 * u}M${bb[2] + m - 7 * u} ${-ob[3]}V${-ob[1]}" />
      <text x="${bb[2] + m - 9 * u}" y="${-(ob[1] + ob[3]) / 2}" transform="rotate(-90 ${bb[2] + m - 9 * u} ${-(ob[1] + ob[3]) / 2})">${ph}</text>
      <path class="dw-axis" d="M0 0h${fmt(8 * u)}M0 0v${fmt(-8 * u)}"/>
    </g>`;
  return `<svg class="drawing" viewBox="${vb.map(fmt).join(' ')}" role="img" aria-label="Top view of ${part.name}">
    <defs><clipPath id="${id}"><rect x="${bb[0]}" y="${-bb[3]}" width="${bw}" height="${bh}"/></clipPath></defs>
    <g clip-path="url(#${id})">${paths.map((p) => `<path d="${p.d}" class="${p.layer === 'BLANK' ? 'dw-blank' : 'dw-geo'}"${p.layer === 'BLANK' ? '' : ` data-f="${p.layer.split('_')[0]}"`}/>`).join('')}</g>
    ${dim}${ordinates}
    ${shownFeats(part).filter((f) => f.geo).map(bubble).join('')}
  </svg>`;
}

const chips = (ops) => html`<span class="op-chips">${[...new Set(ops)].map((o) => html`<span class="op-chip" data-group="${groupOf(o)}">${nm(opById[o])}</span>`)}</span>`;

function list() {
  const singles = parts.filter((p) => p.level === 'single');
  const jobs = parts.filter((p) => p.level !== 'single');
  const logs = store.get('cycles', {});
  const card = (p, big) => html`<a class="part-card ${big ? 'big' : ''}" href="#/practice/${p.id}" data-group="${groupOf(p.ops[0])}">
      <span class="part-thumb">${raw(drawing(p, { small: true }))}</span>
      <span class="part-info">
        <strong>${p.name}${!big ? html` <span class="tier tier-${p.tier || 1}">${p.tier === 2 ? 'harder' : 'first'}</span>` : ''}</strong>
        ${big ? chips(p.ops) : html`<span class="muted">${nm(opById[p.ops[0]])}</span>`}
        <span class="part-meta">${p.material.split(',')[0]} · ${p.qty || p.brief.qty} pcs · target ${p.brief.cycle} min${logs[p.id] ? html` · <b class="${logs[p.id] <= p.brief.cycle ? 'ok' : ''}">yours ${logs[p.id]} min</b>` : ''}</span>
      </span>
    </a>`;
  return {
    title: 'Practice parts',
    html: html`
      <h1 class="page-title">Practice parts</h1>
      <p class="lede">Real little jobs to program in your own Mastercam. Download the drawing as a DXF, set up the stock and the vise like in the 3D preview, and try to beat the target cycle time.</p>
      <h2 class="section-title">Complete 2D jobs</h2>
      <p class="muted">Whole parts, from a first plate to expert jobs with thin ribs, stepped islands and clamps in the way. Only the 12 2D toolpaths are needed.</p>
      ${['beginner', 'intermediate', 'advanced', 'expert'].map((lv) => { const js = jobs.filter((p) => p.level === lv); return js.length ? html`<h3 class="part-group"><span class="level level-${lv}">${levels[lv]}</span><span class="muted" style="font:400 var(--t-sm) var(--f-body)">${js.length} part${js.length > 1 ? 's' : ''}</span></h3><div class="part-grid big">${js.map((p) => card(p, true))}</div>` : ''; })}
      <h2 class="section-title">One toolpath at a time</h2>
      <p class="muted">A small part for each toolpath, so you can try its settings on their own.</p>
      ${groups.map((g) => html`<h3 class="part-group" data-group="${g.id}"><span class="group-chip"></span>${nm(g)}</h3>
        <div class="part-grid">${singles.filter((p) => groupOf(p.ops[0]) === g.id).map((p) => card(p, false))}</div>`)}
    `,
  };
}

export function render(r) {
  const id = r.parts[1];
  if (!id) return list();
  const part = partById[id];
  if (!part) return { title: 'Not found', html: html`<p class="empty">No practice part called “${id}”. <a href="#/practice">All practice parts</a></p>` };
  const mach = machines[part.machine];
  const b = part.brief;
  const log = store.get('cycles', {})[part.id];
  const feats = shownFeats(part);
  const jawNote = part.fixture.type === 'vise' ? (() => {
    const deepest = Math.min(...part.features.filter((f) => f.kind === 'outside' || f.kind === 'channel').map((f) => f.z1), 0);
    const jaw = -part.H + part.fixture.grip;
    return deepest < 0 ? `Vise jaws top at Z${fmt(jaw)}; deepest outside cut Z${fmt(deepest)} → ${fmt(deepest - jaw)} mm clearance.` : `Vise jaws top at Z${fmt(jaw)}.`;
  })() : part.fixture.type === 'clamps'
    ? `Clamp tops at Z${fmt(part.stock.z - part.H + 10)}: keep every move 5 mm clear (Avoidance region, or a Clearance plane above them). Through cuts go 0.5 mm into the spoilboard.`
    : 'Through cuts go 0.5–1 mm into the spoilboard.';
  return {
    title: `${part.name} — practice`,
    html: html`
      <div class="crumbs"><a href="#/practice">Practice parts</a> › ${levels[part.level]}</div>
      <section class="machine part-head" data-group="${groupOf(part.ops[0])}">
        <div class="machine-bar"><span class="lamp" aria-hidden="true"></span><span>Job card</span><span class="machine-bar-r">${levels[part.level]}</span></div>
        <div class="machine-body">
          <div>
            <h1>${part.name}</h1>
            <p class="summary">${b.story}</p>
            ${chips(part.ops)}
            <dl class="counters job">
              <div><dt>Quantity</dt><dd>${b.qty}</dd></div>
              <div><dt>Target cycle</dt><dd>${b.cycle} min</dd></div>
              <div><dt>Toolpaths</dt><dd>${new Set(part.ops).size}</dd></div>
            </dl>
            <div class="head-actions" style="margin-top:18px">
              <a class="btn btn-cycle" href="parts/${part.id}.dxf" download><span class="cycle-dot" aria-hidden="true"></span>Download DXF</a>
              <button class="btn ghost" type="button" data-stl>Mesh (STL)</button>
              <a class="btn ghost" href="parts/${part.id}.step" download>3D model (STEP)</a>
              <button class="btn ghost" type="button" data-svg>Drawing (SVG)</button>
              <button class="btn ghost" type="button" data-print>Print job card</button>
            </div>
          </div>
          <div class="screen">
            <div class="part-stage" id="part-stage" aria-label="3D view of the part in its workholding"><div class="stage-hint">${matchMedia('(pointer: coarse)').matches ? 'Two fingers to rotate' : 'Drag to rotate'}</div></div>
            <div class="stage-toggles" role="group" aria-label="Show in the 3D view">
              <label><input type="checkbox" data-show="fixture" checked> Workholding</label>
              <label><input type="checkbox" data-show="stock" checked> Stock</label>
              <button type="button" class="linkish" data-home>Reset view</button>
            </div>
          </div>
        </div>
      </section>

      <div class="part-layout">
        <section>
          <h2 class="section-title">Drawing</h2>
          <figure class="drawing-wrap">${raw(drawing(part))}<figcaption>Top view, mm. Point at a feature or a table row to light up both. Numbers along the top and left edges are X and Y positions from the work zero (X0 Y0 at the centre, Z0 on the finished top). Depths are in the table.</figcaption></figure>
          <div class="table-wrap"><table class="feat-table">
            <thead><tr><th></th><th>Feature</th><th>Size</th><th>Position X, Y</th><th>Depth</th><th>Toolpath</th></tr></thead>
            <tbody>${feats.map((f) => html`<tr data-f="${f.id}" tabindex="0"><td><span class="tag">${f.id === 'face' ? '—' : f.id}</span></td><td>${f.name}</td><td>${f.size || ''}</td><td class="pos">${posText(f, part)}</td><td class="pos">${depthText(f)}</td><td><a href="#/op/${f.op}" data-group="${groupOf(f.op)}" class="op-chip">${nm(opById[f.op])}</a></td></tr>`)}</tbody>
          </table></div>
        </section>
        <aside class="job-facts">
          <h2 class="section-title">The job</h2>
          <dl class="facts">
            <div><dt>Machine</dt><dd><strong>${mach.name}</strong><br><span class="muted">${mach.spec}</span></dd></div>
            <div><dt>Material</dt><dd>${part.material}</dd></div>
            <div><dt>Stock</dt><dd>${part.stock.x} × ${part.stock.y} × ${part.stock.z} mm</dd></div>
            <div><dt>Workholding</dt><dd>${part.fixture.name}<br><span class="muted">${jawNote}</span></dd></div>
            <div><dt>Tolerances</dt><dd><ul>${b.tol.map((t) => html`<li>${t}</li>`)}</ul></dd></div>
            <div><dt>Surface</dt><dd>${b.ra}</dd></div>
          </dl>
          <h3 class="facts-title">Tools in the magazine</h3>
          <ul class="tool-list">${part.tools.map(([t, d]) => html`<li><code>${t}</code> ${d}</li>`)}</ul>
        </aside>
      </div>

      <h2 class="section-title">A way to program it</h2>
      <p class="muted">Try it yourself first. This is one good plan, not the only one.</p>
      <details class="plan-reveal">
        <summary>Show the plan (${part.plan.length} steps)</summary>
        <ol class="plan">${part.plan.map((s) => html`<li data-group="${groupOf(s.op)}"><a class="op-chip" href="#/op/${s.op}/${s.page}">${nm(opById[s.op])} › ${opById[s.op].pages.find((p) => p.id === s.page)?.name || ''}</a><p>${s.do}</p></li>`)}</ol>
      </details>

      <h2 class="section-title">Before you post it</h2>
      <ul class="checks">${part.checks.map((c) => html`<li>${c}</li>`)}</ul>

      <section class="cycle-log">
        <h2 class="section-title">Your cycle time</h2>
        <p class="muted">Enter the cycle time Mastercam or Vericut gives you for the whole program.</p>
        <form data-log class="log-row">
          <label for="cyc">Minutes</label><input id="cyc" class="input" type="number" min="0.1" step="any" inputmode="decimal" value="${log || ''}" placeholder="e.g. ${b.cycle + 1.5}">
          <button class="btn" type="submit">Save</button>
          <output data-verdict>${log ? verdict(log, b.cycle) : ''}</output>
        </form>
      </section>
    `,
    mount(root) {
      const stage = root.querySelector('#part-stage');
      let viewer = null, cancelled = false;
      import('../viz/part3d.js').then((m) => m.mountPart(stage, part)).then((v) => { if (cancelled) v.dispose(); else viewer = v; })
        .catch(() => { stage.innerHTML = '<p class="empty">3D preview needs WebGL.</p>'; });
      // link the feature table and the drawing: hover or tap either one to light up the other
      const light = (fid, scroll) => {
        root.querySelectorAll('[data-f].hl').forEach((e) => e.classList.remove('hl'));
        if (!fid) return;
        root.querySelectorAll(`[data-f="${CSS.escape(fid)}"]`).forEach((e) => e.classList.add('hl'));
        if (scroll) root.querySelector(`tr[data-f="${CSS.escape(fid)}"]`)?.scrollIntoView({ block: 'nearest' });
      };
      const dw = root.querySelector('.drawing-wrap .drawing'), tb = root.querySelector('.feat-table');
      dw?.addEventListener('pointerover', (e) => { const f = e.target.closest('[data-f]'); if (f) light(f.dataset.f); });
      dw?.addEventListener('click', (e) => { const f = e.target.closest('[data-f]'); light(f?.dataset.f, true); });
      tb?.addEventListener('pointerover', (e) => { const r = e.target.closest('tr[data-f]'); if (r) light(r.dataset.f); });
      tb?.addEventListener('focusin', (e) => { const r = e.target.closest('tr[data-f]'); if (r) light(r.dataset.f); });
      tb?.addEventListener('click', (e) => { const r = e.target.closest('tr[data-f]'); if (r && !e.target.closest('a')) light(r.dataset.f); });
      const save = (name, text, type) => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([text], { type }));
        a.download = name; document.body.append(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      };
      const onClick = (e) => {
        if (e.target.closest('[data-stl]')) { if (viewer) save(`${part.id}.stl`, viewer.stl(), 'model/stl'); else toast('The 3D model is still loading'); }
        if (e.target.closest('[data-svg]')) save(`${part.id}-drawing.svg`, drawingFile(part), 'image/svg+xml');
        if (e.target.closest('[data-home]')) viewer?.home();
        if (e.target.closest('[data-print]')) { root.querySelector('.plan-reveal')?.setAttribute('open', ''); window.print(); }
      };
      const onChange = (e) => { const s = e.target.closest('[data-show]'); if (s) viewer?.show(s.dataset.show, s.checked); };
      const form = root.querySelector('[data-log]');
      const onSubmit = (e) => {
        e.preventDefault();
        const v = +form.querySelector('input').value;
        if (!(v > 0)) return;
        const all = store.get('cycles', {}); all[part.id] = Math.round(v * 10) / 10; store.set('cycles', all);
        const out = form.querySelector('[data-verdict]');
        out.innerHTML = verdict(all[part.id], b.cycle);
        if (all[part.id] <= b.cycle && !matchMedia('(prefers-reduced-motion: reduce)').matches) { out.style.position = 'relative'; burst(out); }
      };
      root.addEventListener('click', onClick); root.addEventListener('change', onChange); form.addEventListener('submit', onSubmit);
      return () => { cancelled = true; viewer?.dispose(); root.removeEventListener('click', onClick); root.removeEventListener('change', onChange); };
    },
  };
}

// Where each feature is, from the work zero (centre of the part, Z0 on top).
const xy = ([x, y]) => `${fmt(x)}, ${fmt(y)}`;
function centres(g) {
  if (!g) return [];
  if (g.circles) return g.circles.at;
  if (g.circle) return [g.circle.slice(0, 2)];
  if (g.obround) return [g.obround.slice(0, 2)];
  if (g.rrect) return [g.rrect.slice(0, 2)];
  if (g.poly) { const b = geoBox(g); return [[(b[0] + b[2]) / 2, (b[1] + b[3]) / 2]]; }
  return [];
}
function posText(f, part) {
  const g = f.geo;
  if (!g) return '—';
  if (g.band) return g.axis === 'y' ? `Y ${fmt(g.band[0])} to ${fmt(g.band[1])}` : `X ${fmt(g.band[0])} to ${fmt(g.band[1])}`;
  if (g.poly) return 'see DXF (corner points)';
  const pts = part.features.filter((x) => x.name === f.name && x.op === f.op).flatMap((x) => centres(x.geo));
  const list = pts.slice(0, 4).map(xy).join(' · ');
  return pts.length > 4 ? `${list} … (${pts.length} in all, see DXF)` : list;
}
function depthText(f) {
  if (f.kind === 'face') return 'to Z0';
  if (f.kind === 'note') return '—';
  if (f.kind === 'island') return `top at Z${fmt(f.top ?? 0)}`;
  return f.z0 ? `Z${fmt(f.z0)} → Z${fmt(f.z1)}` : `Z${fmt(f.z1)}`;
}

function verdict(v, target) {
  const d = Math.round((v - target) * 10) / 10;
  return d <= 0 ? `<span class="ok">On target: ${Math.abs(d)} min under. That job would make money. The card on the parts list now shows your time.</span>` : `<span class="over">${d} min over target. Look at tool changes, rapids and stepovers.</span>`;
}

// Stand-alone drawing file with its own colours.
function drawingFile(part) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n` + drawing(part).replace('<svg ', `<svg xmlns="http://www.w3.org/2000/svg" width="800" `)
    .replace('>', `><style>.dw-geo{fill:none;stroke:#1f5fd6;stroke-width:.6}.dw-blank{fill:none;stroke:#b97e06;stroke-width:.4;stroke-dasharray:3 2}.dw-dim path{fill:none;stroke:#455562;stroke-width:.3}.dw-dim text{font:5px sans-serif;fill:#15212c;text-anchor:middle}.dw-tag circle{fill:#fff;stroke:#15212c;stroke-width:.4}.dw-tag text{font:600 5px sans-serif;text-anchor:middle;fill:#15212c}.dw-axis{stroke:#b0391f}.dw-zero{font-size:3.5px!important;text-anchor:start!important}</style>`);
}
