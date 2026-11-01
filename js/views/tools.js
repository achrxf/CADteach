import { html, raw, store, fmt, esc } from '../util.js';
import { t } from '../i18n.js';
import { ui } from '../icons.js';
import { materials, materialGroups, gcodes, words } from '../data/reference.js';

export function render(r) {
  const which = r.parts[1];
  if (which === 'feeds') return feeds();
  if (which === 'gcode') return gcode(r);
  return {
    title: t('tools'),
    html: html`<h1 class="page-title">${t('tools')}</h1>
      <p class="lede">Small calculators for the things you check between programming and the machine.</p>
      <div class="strip" style="margin-top:20px">
        <a href="#/tools/feeds"><h3>${t('feeds')}</h3><p>RPM, feed, chip thinning and metal removal rate. Metric or inch.</p></a>
        <a href="#/tools/gcode"><h3>${t('gcode')}</h3><p>Paste posted code and read what every line does, with warnings for risky blocks.</p></a>
        <a href="#/fix"><h3>${t('fix')}</h3><p>Symptom → cause → parameter.</p></a>
        <a href="#/glossary"><h3>${t('glossary')}</h3><p>EN / FR shop vocabulary.</p></a>
      </div>`,
  };
}

// Chip load grows with tool diameter; the table gives fz for Ø10.
const suggestedFz = (m, dMm) => m.fz * Math.pow(Math.min(Math.max((dMm || 10) / 10, 0.2), 2.5), 0.8);

// ---------------------------------------------------------------------------
function feeds() {
  const s = store.get('feeds', { unit: 'mm', mat: 'al', d: 10, z: 3, vc: 450, fz: 0.06, ae: 10, ap: 20, max: 12000 });
  if (!materials.some((m) => m.id === s.mat)) s.mat = 'al';
  const matOpts = materialGroups.map(
    (g) => html`<optgroup label="${g.name}">${materials.filter((m) => m.iso === g.id).map((m) => html`<option value="${m.id}" ${m.id === s.mat ? raw('selected') : ''}>${m.name}</option>`)}</optgroup>`,
  );
  return {
    title: t('feeds'),
    html: html`
      <h1 class="page-title">${t('feeds')}</h1>
      <p class="lede">Starting values for carbide endmills. Your tool maker’s data always wins — use this to check the math and the chip thinning.</p>
      <div class="tool-grid">
        <form class="panel" id="feeds-form" onsubmit="return false">
          <div class="form-grid">
            <div class="field wide"><label>Units</label>
              <div class="seg" role="group" aria-label="Units"><button type="button" data-unit="mm" aria-pressed="${s.unit === 'mm'}">Metric (mm, m/min)</button><button type="button" data-unit="in" aria-pressed="${s.unit === 'in'}">Inch (in, SFM)</button></div>
            </div>
            <div class="field wide"><label for="f-mat-q">Material <span class="muted">(${materials.length} in the list)</span></label>
              <input class="input" id="f-mat-q" type="search" placeholder="Filter, e.g. 7075, inconel, 17-4, POM" autocomplete="off" style="margin-bottom:6px">
              <select class="select" id="f-mat" name="mat">${matOpts}</select></div>
            <div class="field"><label for="f-d">Tool Ø <span data-u="len"></span></label><input class="input" id="f-d" name="d" type="number" step="any" min="0" inputmode="decimal"></div>
            <div class="field"><label for="f-z">Flutes</label><input class="input" id="f-z" name="z" type="number" step="1" min="1" inputmode="numeric"></div>
            <div class="field"><label for="f-vc">Surface speed <span data-u="vc"></span></label><input class="input" id="f-vc" name="vc" type="number" step="any" min="0" inputmode="decimal"></div>
            <div class="field"><label for="f-fz">Chip load fz <span data-u="len"></span></label><input class="input" id="f-fz" name="fz" type="number" step="any" min="0" inputmode="decimal"></div>
            <div class="field"><label for="f-ae">Stepover ae (% Ø)</label><input class="input" id="f-ae" name="ae" type="number" step="any" min="0" max="100" inputmode="decimal"></div>
            <div class="field"><label for="f-ap">Depth ap <span data-u="len"></span></label><input class="input" id="f-ap" name="ap" type="number" step="any" min="0" inputmode="decimal"></div>
            <div class="field wide"><label for="f-max">Machine max RPM</label><input class="input" id="f-max" name="max" type="number" step="100" min="0" inputmode="numeric"></div>
          </div>
        </form>
        <div>
          <div class="results" id="feeds-out" aria-live="polite"></div>
          <div class="calc-notes" id="feeds-notes"></div>
        </div>
      </div>`,
    mount(root) {
      const form = root.querySelector('#feeds-form');
      const fill = () => {
        for (const k of ['d', 'z', 'vc', 'fz', 'ae', 'ap', 'max']) form.elements[k].value = s[k];
        form.elements.mat.value = s.mat;
        root.querySelectorAll('[data-u=len]').forEach((e) => (e.textContent = s.unit === 'mm' ? '(mm)' : '(in)'));
        root.querySelectorAll('[data-u=vc]').forEach((e) => (e.textContent = s.unit === 'mm' ? '(m/min)' : '(SFM)'));
        root.querySelectorAll('[data-unit]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.unit === s.unit)));
      };
      const calc = () => {
        const metric = s.unit === 'mm';
        const D = +s.d, z = +s.z, vc = +s.vc, fz = +s.fz, aeP = +s.ae / 100, ap = +s.ap, max = +s.max;
        if (!(D > 0 && z > 0 && vc > 0 && fz > 0)) { root.querySelector('#feeds-out').innerHTML = '<div class="result"><div class="k">Enter tool Ø, flutes, speed and chip load.</div></div>'; return; }
        let rpm = metric ? (vc * 1000) / (Math.PI * D) : (vc * 12) / (Math.PI * D);
        const capped = max > 0 && rpm > max;
        if (capped) rpm = max;
        const vcReal = metric ? (Math.PI * D * rpm) / 1000 : (Math.PI * D * rpm) / 12;
        const r = Math.min(Math.max(aeP, 0.0001), 1);
        const factor = r >= 0.5 ? 1 : 1 / Math.sqrt(1 - Math.pow(1 - 2 * r, 2));
        const fzAdj = fz * factor;
        const feed = rpm * z * fzAdj;
        const ae = r * D;
        const mrr = metric ? (ae * ap * feed) / 1000 : ae * ap * feed;
        const engage = (Math.acos(1 - 2 * r) * 180) / Math.PI;
        const lu = metric ? 'mm' : 'in';
        root.querySelector('#feeds-out').innerHTML = [
          ['Spindle', fmt(rpm, 0), 'RPM', true],
          ['Feed', fmt(feed, metric ? 0 : 1), metric ? 'mm/min' : 'IPM', true],
          ['Programmed fz', fmt(fzAdj, metric ? 3 : 4), lu],
          ['Chip thinning', '×' + fmt(factor, 2), ''],
          ['Engagement', fmt(engage, 0), '°'],
          ['Removal rate', fmt(mrr, metric ? 1 : 2), metric ? 'cm³/min' : 'in³/min'],
        ].map(([k, v, u, hl]) => `<div class="result${hl ? ' hl' : ''}"><div class="k">${k}</div><div class="v">${v}<small>${u}</small></div></div>`).join('');
        const mat = materials.find((m) => m.id === s.mat);
        const notes = [];
        if (capped) notes.push(`<b>Spindle limited:</b> the material allows ${fmt(metric ? (vc * 1000) / (Math.PI * D) : (vc * 12) / (Math.PI * D), 0)} RPM, the machine stops at ${fmt(max, 0)}. Real surface speed is ${fmt(vcReal, 0)} ${metric ? 'm/min' : 'SFM'}.`);
        if (factor > 1.01) notes.push(`<b>Chip thinning:</b> at ${fmt(r * 100, 0)}% stepover the real chip is ${fmt(1 / factor, 2)}× fz, so the feed is raised by ×${fmt(factor, 2)} to keep a ${fmt(fz, metric ? 3 : 4)} ${lu} chip. Check the tool maker’s max fz before running it.`);
        if (r >= 0.5) notes.push('Stepover is 50% or more: no chip thinning correction. For deep cuts at this width, depth should be modest — or switch to a dynamic toolpath.');
        if (mat) {
          const fzD = suggestedFz(mat, metric ? D : D * 25.4);
          const vcTxt = metric ? `${mat.vc[0]}–${mat.vc[1]} m/min` : `${Math.round(mat.vc[0] * 3.2808)}–${Math.round(mat.vc[1] * 3.2808)} SFM`;
          const fzTxt = metric ? `${fmt(fzD, 3)} mm` : `${fmt(fzD / 25.4, 4)} in`;
          notes.push(`<b>${esc(mat.name)}:</b> suggested Vc ${vcTxt}, fz about ${fzTxt} for this diameter. ${esc(mat.note)}`);
        }
        root.querySelector('#feeds-notes').innerHTML = notes.map((n) => `<p>${n}</p>`).join('');
        store.set('feeds', s);
      };
      const allOpts = form.elements.mat.innerHTML;
      root.querySelector('#f-mat-q').addEventListener('input', (e) => {
        const q = e.target.value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const sel = form.elements.mat;
        sel.innerHTML = allOpts;
        if (q) {
          sel.querySelectorAll('option').forEach((o) => { if (!o.textContent.toLowerCase().includes(q) && !o.value.includes(q)) o.remove(); });
          sel.querySelectorAll('optgroup').forEach((g) => { if (!g.children.length) g.remove(); });
        }
        if (sel.options.length && ![...sel.options].some((o) => o.value === s.mat)) { sel.value = sel.options[0].value; sel.dispatchEvent(new Event('input', { bubbles: true })); }
        else sel.value = s.mat;
      });
      form.addEventListener('input', (e) => {
        const n = e.target.name;
        if (!n) return;
        s[n] = e.target.value;
        if (n === 'mat') {
          const m = materials.find((x) => x.id === s.mat);
          const mid = (m.vc[0] + m.vc[1]) / 2;
          const fzD = suggestedFz(m, s.unit === 'mm' ? +s.d : +s.d * 25.4);
          if (s.unit === 'mm') { s.vc = Math.round(mid); s.fz = +fzD.toFixed(3); }
          else { s.vc = Math.round(mid * 3.2808); s.fz = +(fzD / 25.4).toFixed(4); }
          fill();
        }
        calc();
      });
      form.addEventListener('click', (e) => {
        const b = e.target.closest('[data-unit]');
        if (!b || b.dataset.unit === s.unit) return;
        const toIn = b.dataset.unit === 'in';
        const L = toIn ? 1 / 25.4 : 25.4;
        s.d = +(s.d * L).toFixed(toIn ? 4 : 2);
        s.fz = +(s.fz * L).toFixed(toIn ? 4 : 3);
        s.ap = +(s.ap * L).toFixed(toIn ? 3 : 1);
        s.vc = Math.round(toIn ? s.vc * 3.2808 : s.vc / 3.2808);
        s.unit = b.dataset.unit;
        fill();
        calc();
      });
      fill();
      calc();
    },
  };
}

// ---------------------------------------------------------------------------
const SAMPLE = `%
O1001 (BRACKET OP10)
(T1 | 10MM FLAT ENDMILL | H1)
G21
G0 G17 G40 G49 G80 G90
T1 M6
G0 G90 G54 X-12. Y-8. A0. S6000 M3
G43 H1 Z50. M8
Z2.
G1 Z-5. F400.
G41 D1 X0. Y-5. F1200.
G3 X5. Y0. R5.
G1 Y40.
X60.
Y0.
X0.
G40 G1 X-8. Y-8.
G0 Z50.
M5
M9
G91 G28 Z0.
T2 M6
G0 G90 G54 X20. Y20. S2500 M3
G43 H2 Z50. M8
G99 G83 Z-24. R2. Q6. F250.
X40.
X60.
G80
M5
G91 G28 Z0.
M30
%`;

function explainLine(raw0, st) {
  let line = raw0.trim();
  const comments = [];
  line = line.replace(/\(([^)]*)\)/g, (_, c) => { comments.push(c); return ' '; });
  const semi = line.indexOf(';');
  if (semi >= 0) { comments.push(line.slice(semi + 1)); line = line.slice(0, semi); }
  if (line.trim() === '%') return { parts: ['Program start/end marker'], warn: [] };
  const toks = [...line.toUpperCase().matchAll(/([A-Z])\s*([-+]?\d*\.?\d+)/g)].map((m) => ({ l: m[1], v: m[2] }));
  const parts = [];
  const warn = [];
  const has = (code) => toks.some((x) => x.l === 'G' && +x.v === code);
  let motion = null;
  for (const tk of toks) {
    const code = tk.l + tk.v.replace(/^0+(?=\d)/, '');
    const code2 = tk.l + (tk.v.includes('.') ? tk.v : String(+tk.v).padStart(2, '0'));
    if (tk.l === 'G' || tk.l === 'M') {
      const d = gcodes[code2] || gcodes[code] || gcodes[tk.l + tk.v];
      parts.push(`<b>${esc(tk.l + tk.v)}</b> ${d ? esc(d) : '<span class="warn">unknown here — check your control manual</span>'}`);
      const n = +tk.v;
      if (tk.l === 'G') {
        if ([0, 1, 2, 3].includes(n)) { motion = n; st.motion = n; }
        if (n === 90) st.abs = true;
        if (n === 91) st.abs = false;
        if (n === 20) st.units = 'in';
        if (n === 21) st.units = 'mm';
        if ([73, 74, 76, 81, 82, 83, 84, 85, 86, 87, 89].includes(n)) { st.cycle = n; motion = 'cycle'; }
        if (n === 80) st.cycle = null;
        if (n === 41 || n === 42) st.comp = n;
        if (n === 40) st.comp = null;
        if (n === 43) st.lengthComp = true;
        if (n === 28 && st.abs && !has(91)) warn.push('G28 in absolute mode moves through the given point in work coordinates first. Use G91 G28 Z0 to go straight up.');
      } else {
        if (n === 3 || n === 4) st.spindle = true;
        if (n === 5) st.spindle = false;
        if (n === 6) { st.lengthComp = false; st.toolChanged = true; }
      }
    } else if (tk.l === 'N') {
      // line number, skip
    } else if (tk.l === 'O') parts.push(`<b>O${esc(tk.v)}</b> program number`);
    else {
      let d = words[tk.l] || 'word';
      if (st.cycle && tk.l === 'R') d = 'R plane — where the rapid stops and the feed starts';
      if (st.cycle && tk.l === 'Z') d = 'hole bottom';
      if (st.cycle && tk.l === 'Q') d = st.cycle === 76 ? 'shift away from the wall' : 'peck depth';
      if (st.cycle && tk.l === 'P') d = 'dwell at the bottom';
      if (!st.cycle && tk.l === 'R' && (st.motion === 2 || st.motion === 3)) d = 'arc radius';
      if (tk.l === 'H') d = 'tool length offset number';
      if (tk.l === 'D') d = 'cutter comp offset number';
      if (tk.l === 'F') d = `feed rate (${st.units === 'in' ? 'in/min' : 'mm/min'})`;
      parts.push(`<b>${esc(tk.l + tk.v)}</b> ${esc(d)}`);
      if (tk.l === 'F') st.feed = true;
      if (tk.l === 'T' && !toks.some((x) => x.l === 'M' && +x.v === 6)) parts[parts.length - 1] += ' (pre-selected for the next M6)';
    }
  }
  const moves = toks.some((x) => 'XYZ'.includes(x.l));
  if (moves && !motion && st.cycle && !has(80)) parts.push('<b>→</b> repeats the active canned cycle at this position');
  if (moves && (st.motion === 1 || st.motion === 2 || st.motion === 3) && !st.cycle) {
    if (!st.spindle) warn.push('Feed move with the spindle stopped.');
    if (!st.feed) warn.push('Feed move before any F word.');
  }
  if ((has(41) || has(42)) && (st.motion === 2 || st.motion === 3)) warn.push('Cutter comp switched on during an arc — most controls need a linear move (G1) to start G41/G42.');
  if (st.toolChanged && moves && toks.some((x) => x.l === 'Z') && !st.lengthComp && !has(43) && !has(28) && !has(53)) warn.push('Z move after a tool change without G43 H — the tool length is not applied.');
  if (has(83) || has(73)) { if (!toks.some((x) => x.l === 'Q')) warn.push('Peck cycle without a Q value.'); }
  return { parts, warn, comments };
}

function gcode(r) {
  const code = r.query.get('code');
  const saved = store.get('gcode', SAMPLE);
  const single = code ? (gcodes[code.toUpperCase()] || null) : null;
  return {
    title: t('gcode'),
    html: html`
      <h1 class="page-title">${t('gcode')}</h1>
      <p class="lede">Paste a program from your post (Fanuc or Haas style). Every block is explained, and risky blocks get a warning.</p>
      ${code ? html`<div class="panel" style="padding:14px 16px;margin-top:16px;max-width:640px"><div class="muted" style="font-size:var(--t-xs)">Code</div><div style="font-family:var(--f-head);font-size:var(--t-2xl);font-weight:600">${code.toUpperCase()}</div><p style="margin:0">${single || 'Not in the list — check your control manual.'}</p></div>` : ''}
      <div class="tool-grid" style="grid-template-columns:minmax(0,1fr)">
        <div>
          <label class="visually-hidden" for="gc-in">G-code</label>
          <textarea class="input" id="gc-in" spellcheck="false">${saved}</textarea>
          <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">
            <button class="btn ghost" type="button" data-sample>Load sample program</button>
            <button class="btn ghost" type="button" data-clear>Clear</button>
          </div>
          <div class="gcode-out" id="gc-out"></div>
        </div>
      </div>`,
    mount(root) {
      const ta = root.querySelector('#gc-in');
      const out = root.querySelector('#gc-out');
      const run = () => {
        store.set('gcode', ta.value);
        const st = { abs: true, units: 'mm', motion: null, cycle: null, spindle: false, feed: false, lengthComp: false, toolChanged: false };
        const lines = ta.value.split(/\r?\n/).filter((l) => l.trim());
        if (!lines.length) { out.innerHTML = `<div class="empty">Paste a program above.</div>`; return; }
        out.innerHTML = lines
          .slice(0, 1500)
          .map((l) => {
            const e = explainLine(l, st);
            const hl = esc(l)
              .replace(/\(([^)]*)\)/g, '<span class="tok-c">($1)</span>')
              .replace(/\b(G\d+\.?\d*)/gi, '<span class="tok-g">$1</span>')
              .replace(/\b(M\d+)/gi, '<span class="tok-m">$1</span>');
            const expl = [...e.parts, ...(e.comments || []).map((c) => `<span class="muted">Comment: ${esc(c.trim())}</span>`)].join('<br>');
            const w = e.warn.map((x) => `<div class="warn">⚠ ${esc(x)}</div>`).join('');
            return `<div class="gline"><code>${hl}</code><div class="exp">${expl || '<span class="muted">—</span>'}${w}</div></div>`;
          })
          .join('');
      };
      let tm;
      ta.addEventListener('input', () => { clearTimeout(tm); tm = setTimeout(run, 200); });
      root.querySelector('[data-sample]').addEventListener('click', () => { ta.value = SAMPLE; run(); });
      root.querySelector('[data-clear]').addEventListener('click', () => { ta.value = ''; run(); ta.focus(); });
      run();
    },
  };
}
