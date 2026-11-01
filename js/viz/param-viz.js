// Interactive parameter visuals (SVG). Each visual is a spec:
//   { title, controls: [...], draw(state) -> svg body, caption(state) -> html }
// Controls: { type:'range', key, label, min, max, step, unit } or
//           { type:'seg', key, label, options:[[value,label],...] }
// mountViz(kind, el) renders it and keeps it live.

import { esc, fmt } from '../util.js';

const W = 420;
const H = 250;
const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

// --- SVG helpers ---------------------------------------------------------
const ln = (x1, y1, x2, y2, c = 'v-ink') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="${c}"/>`;
const pl = (pts, c = 'v-feed') => `<polyline points="${pts.map((p) => p.map((n) => +n.toFixed(2)).join(',')).join(' ')}" class="${c}"/>`;
const ci = (x, y, r, c = 'v-tool') => `<circle cx="${+x.toFixed(2)}" cy="${+y.toFixed(2)}" r="${+Math.max(r, 0).toFixed(2)}" class="${c}"/>`;
const rc = (x, y, w, h, c = 'v-part', rx = 0) => `<rect x="${x}" y="${y}" width="${Math.max(w, 0)}" height="${Math.max(h, 0)}" rx="${rx}" class="${c}"/>`;
const tx = (x, y, s, c = 'v-label', anchor = 'start') => `<text x="${x}" y="${y}" class="${c}" text-anchor="${anchor}">${esc(s)}</text>`;
const pa = (d, c = 'v-feed') => `<path d="${d}" class="${c}"/>`;
const arrowHead = (x, y, ang, c = 'v-feed-fill', s = 7) => {
  const a1 = ang + Math.PI * 0.85, a2 = ang - Math.PI * 0.85;
  return `<path d="M${x},${y} L${x + s * Math.cos(a1)},${y + s * Math.sin(a1)} L${x + s * Math.cos(a2)},${y + s * Math.sin(a2)}Z" class="${c}"/>`;
};
const hatch = `<defs><pattern id="hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="7" height="7" class="v-part"/><line x1="0" y1="0" x2="0" y2="7" class="v-hatch"/></pattern></defs>`;

// Common tool diameter used by %-based visuals (shown in the UI).
const TOOL_D = 10;

const specs = {};

// ---------------------------------------------------------------------------
specs['comp-side'] = {
  title: 'Which side of the chain?',
  controls: [
    { type: 'seg', key: 'dir', label: 'Chain direction', options: [['r', 'Left → right'], ['l', 'Right → left']] },
    { type: 'seg', key: 'side', label: 'Compensation', options: [['L', 'Left (G41)'], ['R', 'Right (G42)']] },
  ],
  init: { dir: 'r', side: 'L' },
  draw({ dir, side }) {
    const wallY = 150, R = 34;
    // Tool is on the left of the travel direction for L. Travel → : left = up (air). Travel ← : left = down (part).
    const up = (dir === 'r') === (side === 'L');
    const ty = up ? wallY - R : wallY + R;
    const tx0 = 210;
    const inPart = !up;
    const x1 = dir === 'r' ? 60 : 360, x2 = dir === 'r' ? 360 : 60;
    let s = hatch + rc(0, wallY, W, H - wallY, 'v-hatch-fill');
    s += tx(12, wallY + 22, 'Part', 'v-label-strong') + tx(12, 26, 'Air (material already gone)', 'v-label');
    s += ln(x1, wallY, x2, wallY, 'v-chain');
    s += arrowHead(x2, wallY, dir === 'r' ? 0 : Math.PI, 'v-ink-fill', 9);
    s += tx(x2 + (dir === 'r' ? -8 : 8), wallY - 8, 'chain', 'v-label', dir === 'r' ? 'end' : 'start');
    s += ci(tx0, ty, R, inPart ? 'v-tool-bad' : 'v-tool');
    // spindle CW seen from the top (M03)
    const r2 = R - 9;
    s += pa(`M${tx0 + r2 * Math.cos(-2.4)},${ty + r2 * Math.sin(-2.4)} A${r2},${r2} 0 1 1 ${tx0 + r2 * Math.cos(2.0)},${ty + r2 * Math.sin(2.0)}`, 'v-ink-thin');
    s += arrowHead(tx0 + r2 * Math.cos(2.0), ty + r2 * Math.sin(2.0), 2.0 + Math.PI / 2, 'v-ink-fill', 6);
    // feed arrow
    const fx = dir === 'r' ? 1 : -1;
    s += ln(tx0 - 26 * fx, ty, tx0 + 18 * fx, ty, 'v-feed') + arrowHead(tx0 + 22 * fx, ty, dir === 'r' ? 0 : Math.PI);
    s += tx(tx0, ty + (up ? -R - 8 : R + 16), 'M03 (CW)', 'v-label', 'middle');
    return s;
  },
  caption({ dir, side }) {
    const up = (dir === 'r') === (side === 'L');
    if (!up) return '<b>Tool is inside the part.</b> The cut lands on the wrong side of the chain: the part ends one tool diameter too small. Flip the chain direction or the compensation side.';
    return side === 'L'
      ? '<b>Climb milling.</b> With a clockwise spindle (M03), compensation Left keeps the tool on the left of the chain direction: the tooth enters thick and leaves thin. Best finish and tool life on CNC.'
      : '<b>Conventional milling.</b> Compensation Right with the material on this side. Works, but rubs at the start of each tooth; use only on worn machines or hard skins.';
  },
};

// ---------------------------------------------------------------------------
specs['comp-type'] = {
  title: 'Who offsets the tool?',
  controls: [
    { type: 'seg', key: 'type', label: 'Type', options: [['computer', 'Computer'], ['control', 'Control'], ['wear', 'Wear'], ['rwear', 'Reverse wear'], ['off', 'Off']] },
    { type: 'range', key: 'd', label: 'Value in D', min: -0.1, max: 0.1, step: 0.01, unit: 'mm', show: (s) => s.type === 'wear' || s.type === 'rwear' },
  ],
  init: { type: 'wear', d: 0 },
  draw({ type }) {
    const x = 110, y = 34, w = 200, h = 130, R = 22;
    let s = hatch + rc(x, y, w, h, 'v-hatch-fill', 6);
    s += rc(x, y, w, h, 'v-chain-rect', 6);
    const onChain = type === 'control' || type === 'off';
    const off = onChain ? 0 : R;
    const path = `M${x - off},${y + 6} V${y + h - 6} A${6 + off},${6 + off} 0 0 0 ${x + 6},${y + h + off} H${x + w - 6} A${6 + off},${6 + off} 0 0 0 ${x + w + off},${y + h - 6} V${y + 6} A${6 + off},${6 + off} 0 0 0 ${x + w - 6},${y - off} H${x + 6} A${6 + off},${6 + off} 0 0 0 ${x - off},${y + 6}`;
    s += pa(path, 'v-feed');
    // Where the tool actually is at the machine
    const realOff = type === 'off' ? 0 : R;
    s += ci(x + w + realOff, y + h / 2, R, type === 'off' ? 'v-tool-bad' : 'v-tool');
    s += ci(x + w + realOff, y + h / 2, 2, 'v-ink-fill');
    s += tx(x + w / 2, y + h / 2 + 4, 'Part', 'v-label-strong', 'middle');
    s += tx(14, H - 26, 'Blue = path in the program', 'v-label');
    s += tx(14, H - 10, 'Dashed = chain (part edge)', 'v-label');
    return s;
  },
  caption({ type, d }) {
    const r = TOOL_D / 2;
    const rows = {
      computer: ['Offset by Mastercam', 'No G41/G42', 'D not used', 'Size can only be changed by reposting.'],
      control: ['On the chain', 'G41/G42 posted', `D = full radius (${fmt(r, 3)} for Ø${TOOL_D})`, 'Control does the offset; inside corners must be bigger than the tool radius.'],
      wear: ['Offset by Mastercam', 'G41/G42 posted', `D = wear only (start at 0)`, `Operator tunes size with small D values. D ${d >= 0 ? '+' : ''}${fmt(d, 2)} → each wall moves ${fmt(Math.abs(d), 2)} mm ${d > 0 ? 'into the part (smaller outside / bigger hole)' : d < 0 ? 'away from the part (bigger outside / smaller hole)' : '— nominal size'}.`],
      rwear: ['Offset by Mastercam', 'G42/G41 swapped', 'D = wear only, sign reversed', `For shops whose wear offsets are entered with the opposite sign. D ${fmt(d, 2)} moves the wall the opposite way from Wear.`],
      off: ['Tool center on chain', 'No offset', '—', '<b>Part undersize by the tool radius</b> unless the chain already is the tool-center path.'],
    }[type];
    return `<b>Program path:</b> ${rows[0]}. <b>Code:</b> ${rows[1]}. <b>D register:</b> ${rows[2]}.<br>${rows[3]}`;
  },
};

// ---------------------------------------------------------------------------
specs.stock = {
  title: 'Stock to leave (exaggerated)',
  controls: [
    { type: 'range', key: 'wall', label: 'On walls', min: -0.2, max: 1, step: 0.05, unit: 'mm' },
    { type: 'range', key: 'floor', label: 'On floors', min: -0.2, max: 1, step: 0.05, unit: 'mm' },
  ],
  init: { wall: 0.3, floor: 0.2 },
  draw({ wall, floor }) {
    const k = 40; // scale: 1 mm = 40 px
    const wx = 230, fy = 190, top = 50;
    let s = hatch;
    // finished part: wall on the right (x>wx) and floor below fy
    s += pa(`M${wx},${top} V${fy} H20 V${H} H${W} V${top}Z`, 'v-hatch-fill');
    // stock left
    const sw = wall * k, sf = floor * k;
    if (wall > 0 || floor > 0) s += pa(`M${wx - Math.max(sw, 0)},${top} V${fy - Math.max(sf, 0)} H20 V${fy} H${wx} V${top}Z`, 'v-stock');
    s += pa(`M${wx},${top} V${fy} H20`, 'v-chain');
    const toolR = 50;
    const cx = wx - sw - toolR, by = fy - sf;
    s += rc(cx - toolR, by - 130, toolR * 2, 130, wall < 0 || floor < 0 ? 'v-tool-bad' : 'v-tool', 3);
    s += tx(wx + 8, top + 16, 'Finished wall', 'v-label');
    s += tx(28, fy + 20, 'Finished floor', 'v-label');
    if (wall) s += tx(wx - sw / 2, top - 8, `${fmt(wall, 2)}`, 'v-label-strong', 'middle');
    return s;
  },
  caption({ wall, floor }) {
    if (wall < 0 || floor < 0) return '<b>Negative stock</b> cuts into the finished geometry — used on purpose for clearance fits or to compensate a known error. Shown in red.';
    return `Roughing leaves <b>${fmt(wall, 2)} mm</b> on walls and <b>${fmt(floor, 2)} mm</b> on floors for the finishing tool. Grey band = what the finish op will remove.`;
  },
};

// ---------------------------------------------------------------------------
function depthLevels({ total, max, nf, fs }) {
  const finish = Math.min(nf * fs, total);
  const rough = total - finish;
  const n = rough > 0 ? Math.ceil(rough / max - 1e-9) : 0;
  const step = n ? rough / n : 0;
  const levels = [];
  for (let i = 1; i <= n; i++) levels.push({ z: step * i, kind: 'rough' });
  for (let i = 1; i <= nf; i++) levels.push({ z: rough + fs * i, kind: 'finish' });
  return { levels, n, step, finish };
}
specs['depth-cuts'] = {
  title: 'How depth is split',
  controls: [
    { type: 'range', key: 'total', label: 'Total depth', min: 2, max: 30, step: 0.5, unit: 'mm' },
    { type: 'range', key: 'max', label: 'Max rough step', min: 0.5, max: 10, step: 0.25, unit: 'mm' },
    { type: 'range', key: 'nf', label: '# Finish cuts', min: 0, max: 3, step: 1, unit: '' },
    { type: 'range', key: 'fs', label: 'Finish step', min: 0.1, max: 1, step: 0.05, unit: 'mm' },
  ],
  init: { total: 10, max: 3, nf: 1, fs: 0.4 },
  draw(st) {
    const { levels } = depthLevels(st);
    const top = 40, bottom = 220, k = (bottom - top) / st.total;
    let s = hatch + rc(200, top, 200, bottom - top + 10, 'v-hatch-fill');
    s += ln(20, top, W - 10, top, 'v-ink-thin') + tx(24, top - 6, 'Top of stock', 'v-label');
    s += ln(20, bottom, W - 10, bottom, 'v-ink-thin') + tx(24, bottom + 16, 'Depth', 'v-label');
    levels.forEach((lv, i) => {
      const y = top + lv.z * k;
      s += ln(120, y, 196, y, lv.kind === 'finish' ? 'v-rapid-solid' : 'v-feed');
      s += tx(116, y + 4, fmt(lv.z, 2), 'v-label-num', 'end');
      if (i === levels.length - 1) s += rc(148, y - 70, 44, 70, 'v-tool', 3);
    });
    return s;
  },
  caption(st) {
    const { n, step, finish } = depthLevels(st);
    let c = `<b>${n} rough step${n === 1 ? '' : 's'} of ${fmt(step, 2)} mm</b>`;
    if (st.nf) c += ` + <b>${st.nf} finish step${st.nf > 1 ? 's' : ''} of ${fmt(st.fs, 2)} mm</b> (amber)`;
    c += `. Mastercam splits the roughing depth evenly, so steps are never bigger than ${fmt(st.max, 2)} mm but are often smaller.`;
    if (finish >= st.total) c = '<b>Finish cuts cover the whole depth.</b> Reduce # finish cuts or finish step.';
    return c;
  },
};

// ---------------------------------------------------------------------------
specs.linking = {
  title: 'The five heights',
  controls: [
    { type: 'range', key: 'clr', label: 'Clearance', min: 20, max: 60, step: 1, unit: 'mm' },
    { type: 'range', key: 'ret', label: 'Retract', min: 2, max: 20, step: 1, unit: 'mm' },
    { type: 'range', key: 'feed', label: 'Feed plane', min: 0.5, max: 10, step: 0.5, unit: 'mm' },
    { type: 'seg', key: 'only', label: 'Clearance', options: [['1', 'Only at start/end'], ['0', 'Between every chain']] },
  ],
  init: { clr: 40, ret: 8, feed: 2, only: '1' },
  animated: true,
  geom({ clr, ret, feed, only }) {
    // Z scale: Z=0 top of stock, depth -12. Clamp height 15.
    const depth = -12;
    const k = (218 - 26) / (clr + 12);
    const z2y = (z) => 218 - (z - depth) * k;
    const chains = [110, 270];
    const pts = [];
    const add = (x, z, kind) => pts.push({ x, y: z2y(z), kind });
    add(30, clr, 'rapid');
    chains.forEach((cx, i) => {
      const startZ = i === 0 || only === '0' ? clr : ret;
      add(cx - 30, startZ, 'rapid');
      add(cx - 30, feed, 'rapid');
      add(cx - 30, depth, 'feed');
      add(cx + 30, depth, 'feed');
      add(cx + 30, i === chains.length - 1 || only === '0' ? clr : ret, 'rapid');
    });
    add(W - 30, clr, 'rapid');
    return { pts, z2y, depth };
  },
  draw(st) {
    const { pts, z2y, depth } = this.geom(st);
    let s = hatch;
    s += rc(10, z2y(0), W - 20, 60, 'v-hatch-fill');
    s += pa(`M80,${z2y(0)} H140 V${z2y(depth)} H80Z M240,${z2y(0)} H300 V${z2y(depth)} H240Z`, 'v-air');
    s += rc(170, z2y(15), 40, z2y(0) - z2y(15), 'v-clamp', 2) + tx(190, z2y(15) - 4, 'clamp', 'v-label', 'middle');
    const planes = [
      ['Clearance', st.clr, 'v-plane-c'], ['Retract', st.ret, 'v-plane-r'], ['Feed plane', st.feed, 'v-plane-f'], ['Top of stock', 0, 'v-plane-t'], ['Depth', depth, 'v-plane-d'],
    ];
    planes.forEach(([name, z, c], i) => {
      const y = z2y(z);
      const right = i % 2 === 0;
      s += ln(10, y, W - 10, y, 'v-plane ' + c) + tx(right ? W - 12 : 14, y - 3, `${name} ${z > 0 ? '+' : ''}${fmt(z, 1)}`, 'v-label-plane', right ? 'end' : 'start');
    });
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i];
      s += ln(a.x, a.y, b.x, b.y, b.kind === 'feed' ? 'v-feed' : 'v-rapid');
    }
    s += `<g class="anim-tool">${rc(-7, -34, 14, 34, 'v-tool', 2)}</g>`;
    return s;
  },
  animate(svg, st) {
    const { pts } = this.geom(st);
    const g = svg.querySelector('.anim-tool');
    const segs = [];
    let total = 0;
    for (let i = 1; i < pts.length; i++) {
      const len = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y) * (pts[i].kind === 'feed' ? 3 : 1);
      segs.push({ a: pts[i - 1], b: pts[i], len });
      total += len;
    }
    if (reduceMotion()) { g.setAttribute('transform', `translate(${pts[3].x},${pts[3].y})`); return () => {}; }
    let t0 = null, raf;
    const tick = (ts) => {
      t0 ??= ts;
      let d = (((ts - t0) / 1000) * 120) % (total + 80);
      let p = pts[pts.length - 1];
      for (const sg of segs) {
        if (d <= sg.len) { const f = d / sg.len; p = { x: sg.a.x + (sg.b.x - sg.a.x) * f, y: sg.a.y + (sg.b.y - sg.a.y) * f }; break; }
        d -= sg.len;
      }
      g.setAttribute('transform', `translate(${p.x},${p.y})`);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  },
  caption(st) {
    let c = 'Amber dashed = rapid, blue = feed. The tool rapids down to the <b>Feed plane</b>, feeds to <b>Depth</b>, then goes up to ';
    c += st.only === '1' ? '<b>Retract</b> between the two pockets and to Clearance only at the very end.' : '<b>Clearance</b> between every chain (safer over clamps, slower).';
    if (st.only === '1' && st.ret < 15) c += ' <b>Watch the clamp:</b> Retract is below it, so the move between pockets would hit it.';
    return c;
  },
};

// ---------------------------------------------------------------------------
specs.lead = {
  title: 'Lead in onto a wall (top view)',
  controls: [
    { type: 'seg', key: 'line', label: 'Line', options: [['tan', 'Tangent'], ['perp', 'Perpendicular']] },
    { type: 'range', key: 'len', label: 'Line length', min: 0, max: 150, step: 5, unit: '% Ø' },
    { type: 'range', key: 'rad', label: 'Arc radius', min: 0, max: 100, step: 5, unit: '% Ø' },
    { type: 'range', key: 'sweep', label: 'Arc sweep', min: 0, max: 180, step: 5, unit: '°' },
  ],
  init: { line: 'tan', len: 50, rad: 50, sweep: 90 },
  draw({ line, len, rad, sweep }) {
    const k = 6.5; // px per mm, tool Ø10 → 65 px
    const R = (TOOL_D / 2) * k;
    const wallY = 200;
    const pathY = wallY - R; // tool center path (screen)
    const S = { x: 250, y: pathY };
    const r = (rad / 100) * TOOL_D * k;
    const th = (sweep * Math.PI) / 180;
    // math coords (y up) relative to S; center at (0, r)
    const P = (a) => ({ x: S.x + r * Math.cos(a), y: S.y - (r + r * Math.sin(a)) });
    const a0 = -Math.PI / 2 - th;
    const A = r > 0 && th > 0 ? P(a0) : S;
    let dir; // direction of the line, arriving at A
    if (line === 'tan') dir = r > 0 && th > 0 ? { x: -Math.sin(a0), y: -Math.cos(a0) } : { x: 1, y: 0 };
    else dir = { x: 0, y: 1 }; // perpendicular: coming straight toward the wall
    const L = (len / 100) * TOOL_D * k;
    const L0 = { x: A.x - dir.x * L, y: A.y - dir.y * L };
    let s = hatch + rc(0, wallY, W, H - wallY, 'v-hatch-fill');
    s += ln(0, wallY, W, wallY, 'v-chain') + tx(10, wallY + 18, 'Wall (chain)', 'v-label-strong');
    s += ln(S.x, pathY, W, pathY, 'v-feed-faint');
    if (L > 0) s += ln(L0.x, L0.y, A.x, A.y, 'v-feed');
    if (r > 0 && th > 0) s += pa(`M${A.x},${A.y} A${r},${r} 0 ${sweep > 180 ? 1 : 0} 1 ${S.x},${S.y}`, 'v-feed');
    s += ln(S.x, S.y, S.x + 90, S.y, 'v-feed') + arrowHead(S.x + 92, S.y, 0);
    s += ci(S.x, S.y, R, 'v-tool-ghost') + ci(S.x, S.y, 2.5, 'v-ink-fill');
    s += ci(L0.x, L0.y, 3, 'v-rapid-fill') + tx(L0.x - 6, L0.y - 6, 'start', 'v-label', 'end');
    s += tx(S.x + 4, S.y - 8, 'touches wall', 'v-label');
    return s;
  },
  caption({ line, len, rad, sweep }) {
    const parts = [];
    if (rad > 0 && sweep > 0) parts.push(`Arc R${fmt((rad / 100) * TOOL_D, 1)} mm over ${sweep}° rolls the tool onto the wall with no sudden hit.`);
    else parts.push('<b>No arc:</b> the tool meets the wall abruptly and usually leaves a mark.');
    if (len === 0) parts.push('<b>No line:</b> with Control or Wear comp many controls can’t start G41/G42 and alarm.');
    else if ((len / 100) * TOOL_D < TOOL_D / 2) parts.push('Line is shorter than the tool radius — too short to start G41/G42 on most controls.');
    else parts.push(`${line === 'tan' ? 'Tangent' : 'Perpendicular'} line ${fmt((len / 100) * TOOL_D, 1)} mm gives the control room to switch on cutter comp.`);
    return parts.join(' ') + ` Tool Ø${TOOL_D}.`;
  },
};

// ---------------------------------------------------------------------------
specs['multi-passes'] = {
  title: 'XY passes on a wall',
  controls: [
    { type: 'range', key: 'nr', label: 'Rough passes', min: 0, max: 5, step: 1, unit: '' },
    { type: 'range', key: 'sr', label: 'Rough spacing', min: 0.5, max: 6, step: 0.5, unit: 'mm' },
    { type: 'range', key: 'nfp', label: 'Finish passes', min: 0, max: 3, step: 1, unit: '' },
    { type: 'range', key: 'sf', label: 'Finish spacing', min: 0.05, max: 1, step: 0.05, unit: 'mm' },
  ],
  init: { nr: 2, sr: 3, nfp: 1, sf: 0.3 },
  draw({ nr, sr, nfp, sf }) {
    const k = 12, wallX = 330;
    const R = (TOOL_D / 2) * k;
    const totalStock = nr * sr + nfp * sf;
    let s = hatch + rc(wallX, 0, W - wallX, H, 'v-hatch-fill');
    s += rc(wallX - totalStock * k, 0, totalStock * k, H, 'v-stock');
    s += ln(wallX, 0, wallX, H, 'v-chain');
    // passes from outside in
    const offs = [];
    let o = totalStock;
    for (let i = 0; i < nr; i++) { o -= sr; offs.push({ o, kind: 'rough' }); }
    for (let i = 0; i < nfp; i++) { o -= sf; offs.push({ o, kind: 'finish' }); }
    offs.forEach((p, i) => {
      const x = wallX - p.o * k - R;
      s += ln(x, 20, x, H - 20, p.kind === 'rough' ? 'v-feed' : 'v-rapid-solid');
      s += tx(x, 14, `${i + 1}`, 'v-label-num', 'middle');
    });
    if (offs.length) s += ci(wallX - offs[0].o * k - R, H / 2, R, 'v-tool-ghost');
    s += tx(wallX + 8, H - 12, 'Wall', 'v-label-strong');
    return s;
  },
  caption({ nr, sr, nfp, sf }) {
    const total = nr * sr + nfp * sf;
    let c = `Removes <b>${fmt(total, 2)} mm</b> of wall stock: ${nr} rough pass${nr === 1 ? '' : 'es'} (blue) of ${fmt(sr, 2)} mm, ${nfp} finish pass${nfp === 1 ? '' : 'es'} (amber) of ${fmt(sf, 2)} mm.`;
    if (sr > TOOL_D / 2 && nr) c += ' <b>Rough spacing is more than the tool radius</b> — heavy engagement on every pass.';
    if (sf < 0.05 && nfp) c += ' <b>Finish spacing is so small the tool will rub.</b>';
    return c + ` Tool Ø${TOOL_D}.`;
  },
};

// ---------------------------------------------------------------------------
specs.tabs = {
  title: 'Tabs on a cut-out part',
  controls: [
    { type: 'range', key: 'n', label: 'Number of tabs', min: 0, max: 8, step: 1, unit: '' },
    { type: 'range', key: 'w', label: 'Tab width', min: 2, max: 12, step: 1, unit: 'mm' },
  ],
  init: { n: 4, w: 5 },
  draw({ n, w }) {
    const x = 70, y = 40, pw = 280, ph = 170, k = 2.6, R = 5 * k;
    let s = hatch + rc(0, 0, W, H, 'v-stock-light');
    s += rc(x, y, pw, ph, 'v-hatch-fill', 4);
    // path around offset by R
    const per = 2 * (pw + ph);
    const gaps = [];
    for (let i = 0; i < n; i++) gaps.push(((i + 0.5) / n) * per);
    const pt = (d) => {
      d = ((d % per) + per) % per;
      if (d < pw) return [x + d, y - R];
      if (d < pw + ph) return [x + pw + R, y + d - pw];
      if (d < 2 * pw + ph) return [x + pw - (d - pw - ph), y + ph + R];
      return [x - R, y + ph - (d - 2 * pw - ph)];
    };
    const gw = (w + TOOL_D) * k; // gap in path = tab width + tool diameter
    let segStart = 0;
    const edges = [...gaps.map((g) => [g - gw / 2, g + gw / 2])];
    const draws = [];
    if (!n) draws.push([0, per]);
    else {
      segStart = edges[edges.length - 1][1] - per;
      for (const [a, b] of edges) { draws.push([segStart, a]); segStart = b; }
    }
    for (const [a, b] of draws) {
      const pts = [];
      for (let d = a; d <= b; d += 4) pts.push(pt(d));
      pts.push(pt(b));
      s += pl(pts, 'v-feed');
    }
    for (const g of gaps) {
      const [px, py] = pt(g);
      s += ci(px, py, 4, 'v-rapid-fill');
    }
    s += tx(x + pw / 2, y + ph / 2 + 4, 'Part', 'v-label-strong', 'middle');
    return s;
  },
  caption({ n, w }) {
    if (!n) return '<b>No tabs:</b> the part is free when the last cut breaks through — it can be thrown or crushed by the tool.';
    return `${n} tabs, each <b>${w} mm</b> of material. In the toolpath the gap is tab width + tool Ø (${w + TOOL_D} mm here), because the tab is measured between the tool edges.`;
  },
};

// ---------------------------------------------------------------------------
specs.stepover = {
  title: 'Stepover in a pocket',
  controls: [
    { type: 'range', key: 'so', label: 'Stepover', min: 10, max: 100, step: 5, unit: '% Ø' },
    { type: 'seg', key: 'pat', label: 'Pattern', options: [['zig', 'Zigzag'], ['spiral', 'Spiral']] },
  ],
  init: { so: 50, pat: 'spiral' },
  draw({ so, pat }) {
    const k = 5, D = TOOL_D * k, step = (so / 100) * D;
    const x = 40, y = 30, w = 340, h = 190;
    let s = hatch + rc(x, y, w, h, 'v-stock', 8);
    const inset = D / 2;
    if (pat === 'zig') {
      const pts = [];
      let yy = y + inset, dirR = true;
      while (yy <= y + h - inset + 0.1) {
        pts.push([dirR ? x + inset : x + w - inset, yy], [dirR ? x + w - inset : x + inset, yy]);
        yy += step; dirR = !dirR;
      }
      s += pl(pts, 'v-feed-wide');
      s += pl(pts, 'v-feed');
    } else {
      let o = inset;
      const rects = [];
      while (o < Math.min(w, h) / 2) { rects.push(o); o += step; }
      rects.reverse().forEach((o2, i) => {
        s += rc(x + o2, y + o2, w - 2 * o2, h - 2 * o2, 'v-feed-wide-rect', 2);
        s += rc(x + o2, y + o2, w - 2 * o2, h - 2 * o2, 'v-feed-rect', 2);
      });
    }
    s += ci(x + inset, y + inset, D / 2, 'v-tool-ghost');
    return s;
  },
  caption({ so }) {
    const ae = (so / 100) * TOOL_D;
    const ang = (Math.acos(1 - (2 * ae) / TOOL_D) * 180) / Math.PI;
    let c = `Each pass overlaps the last; light band = what the tool sweeps. Stepover ${so}% (${fmt(ae, 1)} mm on Ø${TOOL_D}) means an engagement angle of <b>${fmt(Math.min(ang, 180), 0)}°</b> on straight passes — `;
    c += 'and much more in corners, where the tool wraps around the material.';
    if (so > 100) c += ' <b>Above 100% ridges are left between passes.</b>';
    return c;
  },
};

// ---------------------------------------------------------------------------
specs.engagement = {
  title: 'Engagement and chip thinning',
  controls: [
    { type: 'range', key: 'ae', label: 'Stepover (ae)', min: 3, max: 60, step: 1, unit: '% Ø' },
    { type: 'range', key: 'fz', label: 'Catalog fz', min: 0.02, max: 0.15, step: 0.005, unit: 'mm' },
  ],
  init: { ae: 10, fz: 0.05 },
  draw({ ae }) {
    const cx = 200, cy = 125, R = 85;
    const aeP = (ae / 100) * 2 * R;
    const wallX = cx + R - aeP; // material to the right of wallX
    let s = hatch + rc(wallX, 0, W - wallX, H, 'v-hatch-fill');
    s += ci(cx, cy, R, 'v-tool');
    // engagement arc: points of the circle with x >= wallX
    const a = Math.acos(Math.max(-1, Math.min(1, (wallX - cx) / R)));
    const p1 = [cx + R * Math.cos(-a), cy + R * Math.sin(-a)], p2 = [cx + R * Math.cos(a), cy + R * Math.sin(a)];
    s += pa(`M${p1[0]},${p1[1]} A${R},${R} 0 ${a > Math.PI / 2 ? 1 : 0} 1 ${p2[0]},${p2[1]}`, 'v-engage');
    s += ln(cx, cy, p1[0], p1[1], 'v-ink-thin') + ln(cx, cy, p2[0], p2[1], 'v-ink-thin');
    s += ln(wallX, 12, cx + R, 12, 'v-ink') + tx((wallX + cx + R) / 2, 8, 'ae', 'v-label', 'middle');
    s += tx(cx, cy + 4, `${fmt((2 * a * 180) / Math.PI, 0)}°`, 'v-label-strong', 'middle');
    s += ln(cx - 30, cy + R + 14, cx + 10, cy + R + 14, 'v-feed') + arrowHead(cx + 14, cy + R + 14, 0);
    s += tx(cx - 34, cy + R + 18, 'feed', 'v-label', 'end');
    return s;
  },
  caption({ ae, fz }) {
    const r = ae / 100;
    const factor = r >= 0.5 ? 1 : 1 / Math.sqrt(1 - Math.pow(1 - 2 * r, 2));
    const adj = fz * factor;
    return `At ${ae}% stepover the real chip is thinner than fz. To keep a <b>${fmt(fz, 3)} mm</b> chip, program <b>fz ${fmt(adj, 3)} mm</b> (×${fmt(factor, 2)}). Without this correction a dynamic path rubs and the tool wears fast.`;
  },
};

// ---------------------------------------------------------------------------
specs['roll-corners'] = {
  title: 'Roll cutter around corners',
  controls: [{ type: 'seg', key: 'mode', label: 'Mode', options: [['none', 'None'], ['sharp', 'Sharp (≤135°)'], ['all', 'All']] }],
  init: { mode: 'sharp' },
  draw({ mode }) {
    const R = 26;
    let s = hatch;
    // Two outside corners: 90° (left) and 150° (right)
    const corner = (cx, cy, angDeg, label) => {
      // edges: incoming from left horizontal, outgoing rotated
      const turn = 180 - angDeg; // direction change
      const t = (turn * Math.PI) / 180;
      const A = [cx - 95, cy], C = [cx, cy];
      const B = [cx + 75 * Math.cos(t), cy + 75 * Math.sin(t)];
      // part is below/right; tool path offset above/left by R
      s += pa(`M${A[0]},${A[1]} L${C[0]},${C[1]} L${B[0]},${B[1]} L${B[0]},${cy + 120} L${A[0]},${cy + 120}Z`, 'v-hatch-fill');
      s += pa(`M${A[0]},${A[1]} L${C[0]},${C[1]} L${B[0]},${B[1]}`, 'v-chain');
      const n1 = [0, -1], n2 = [Math.sin(t), -Math.cos(t)];
      const P1 = [C[0] + n1[0] * R, C[1] + n1[1] * R], P2 = [C[0] + n2[0] * R, C[1] + n2[1] * R];
      const roll = mode === 'all' || (mode === 'sharp' && angDeg <= 135);
      s += ln(A[0], A[1] - R, P1[0], P1[1], 'v-feed');
      if (roll) s += pa(`M${P1[0]},${P1[1]} A${R},${R} 0 0 1 ${P2[0]},${P2[1]}`, 'v-feed');
      else {
        // sharp corner path: extend both offset lines to intersection
        const half = t / 2;
        const d = R / Math.cos(half);
        const X = [C[0] + d * Math.sin(half), C[1] - d * Math.cos(half)];
        s += pl([P1, X, P2], 'v-feed');
      }
      s += ln(P2[0], P2[1], B[0] + n2[0] * R, B[1] + n2[1] * R, 'v-feed');
      s += tx(cx - 45, cy + 40, label, 'v-label-strong', 'middle');
    };
    corner(125, 90, 90, '90° corner');
    corner(305, 90, 150, '150° corner');
    return s;
  },
  caption({ mode }) {
    return {
      none: '<b>None:</b> the path makes sharp corners — the tool goes past the corner and back. Longer path, a dwell mark on the corner. Sometimes needed with Control comp.',
      sharp: '<b>Sharp (default):</b> rolls around corners of 135° or less (the 90° one), keeps the shallow 150° corner as a straight intersection. Part corner stays sharp either way.',
      all: '<b>All:</b> rolls around every outside corner, even shallow ones. Smoothest motion.',
    }[mode];
  },
};

// ---------------------------------------------------------------------------
specs.facing = {
  title: 'Facing passes (top view)',
  controls: [
    { type: 'seg', key: 'style', label: 'Style', options: [['zig', 'Zigzag'], ['one', 'One way']] },
    { type: 'range', key: 'so', label: 'Max stepover', min: 30, max: 100, step: 5, unit: '% Ø' },
    { type: 'range', key: 'across', label: 'Across overlap', min: 0, max: 60, step: 5, unit: '% Ø' },
    { type: 'range', key: 'along', label: 'Along overlap', min: 0, max: 80, step: 5, unit: '% Ø' },
  ],
  init: { style: 'one', so: 70, across: 20, along: 60 },
  draw({ style, so, across, along }) {
    const D = 60; // face mill Ø50 shown at 60px
    const x = 110, y = 70, w = 200, h = 120;
    const ex = (along / 100) * D + D / 2; // tool center past the edge
    const ac = (across / 100) * D;
    let s = hatch + rc(x, y, w, h, 'v-hatch-fill', 2);
    const top = y - ac + D / 2, bot = y + h + ac - D / 2;
    const span = bot - top;
    const n = Math.max(1, Math.ceil(span / ((so / 100) * D) - 1e-9));
    const st = n ? span / n : 0;
    const ys = [];
    for (let i = 0; i <= n; i++) ys.push(top + st * i);
    ys.forEach((yy, i) => {
      s += rc(x - ex, yy - D / 2, w + 2 * ex, D, 'v-sweep', D / 2);
    });
    ys.forEach((yy, i) => {
      const lr = style === 'one' || i % 2 === 0;
      const a = lr ? x - ex : x + w + ex, b = lr ? x + w + ex : x - ex;
      s += ln(a, yy, b, yy, 'v-feed') + arrowHead(b, yy, lr ? 0 : Math.PI);
      if (i < ys.length - 1) {
        if (style === 'one') s += ln(b, yy, a, ys[i + 1], 'v-rapid');
        else s += ln(b, yy, b, ys[i + 1], 'v-feed');
      }
    });
    s += ci(x - ex, ys[0], D / 2, 'v-tool-ghost');
    s += tx(x + w / 2, y + h / 2 + 4, 'Stock', 'v-label-strong', 'middle');
    return s;
  },
  caption({ style, so, across }) {
    let c = style === 'one' ? '<b>One way:</b> every pass climbs in the same direction, then rapids back (amber). Most even surface.' : '<b>Zigzag:</b> faster, but every other pass is conventional — the surface pattern changes pass to pass.';
    if (across < 10) c += ' <b>Low across overlap</b> can leave a ridge at the side edges.';
    if (so > 85) c += ' <b>Stepover near 100%</b> makes inserts cut at the very edge of the cutter.';
    return c;
  },
};

// ---------------------------------------------------------------------------
specs.drill = {
  title: 'Drill cycle — Z over time',
  controls: [
    { type: 'seg', key: 'cyc', label: 'Cycle', options: [['G81', 'G81 drill'], ['G73', 'G73 chip break'], ['G83', 'G83 full peck']] },
    { type: 'range', key: 'depth', label: 'Hole depth', min: 5, max: 40, step: 1, unit: 'mm' },
    { type: 'range', key: 'q', label: 'Peck (Q)', min: 1, max: 15, step: 0.5, unit: 'mm', show: (s) => s.cyc !== 'G81' },
  ],
  init: { cyc: 'G83', depth: 24, q: 6 },
  draw({ cyc, depth, q }) {
    const Rz = 3, clr = 1, back = 0.5;
    const top = 40, k = 160 / (depth + Rz);
    const z2y = (z) => top + (Rz - z) * k;
    const moves = [{ z: Rz, f: false }];
    if (cyc === 'G81') moves.push({ z: -depth, f: true }, { z: Rz, f: false });
    else {
      let cur = 0;
      while (cur < depth - 1e-9) {
        const next = Math.min(cur + q, depth);
        moves.push({ z: -next, f: true });
        cur = next;
        if (cur >= depth) break;
        if (cyc === 'G73') moves.push({ z: -cur + back, f: false });
        else moves.push({ z: Rz, f: false }, { z: -cur + clr, f: false });
      }
      moves.push({ z: Rz, f: false });
    }
    const total = moves.reduce((acc, m, i) => (i ? acc + Math.abs(m.z - moves[i - 1].z) : 0), 0);
    const xk = 340 / Math.max(total, 1);
    let s = '';
    s += rc(40, z2y(0), 370, z2y(-depth) - z2y(0), 'v-stock-light');
    s += ln(40, z2y(Rz), 410, z2y(Rz), 'v-plane v-plane-r') + tx(36, z2y(Rz) + 4, 'R', 'v-label-plane', 'end');
    s += ln(40, z2y(0), 410, z2y(0), 'v-plane v-plane-t') + tx(36, z2y(0) + 4, 'Z0', 'v-label-plane', 'end');
    s += ln(40, z2y(-depth), 410, z2y(-depth), 'v-plane v-plane-d') + tx(36, z2y(-depth) + 4, `Z-${depth}`, 'v-label-plane', 'end');
    let x = 50;
    for (let i = 1; i < moves.length; i++) {
      const a = moves[i - 1], b = moves[i];
      const nx = x + Math.abs(b.z - a.z) * xk;
      s += ln(x, z2y(a.z), nx, z2y(b.z), b.f ? 'v-feed' : 'v-rapid');
      x = nx;
    }
    s += tx(50, 225, 'time →', 'v-label');
    return s;
  },
  caption({ cyc, depth, q }) {
    const pecks = cyc === 'G81' ? 1 : Math.ceil(depth / q);
    return {
      G81: '<b>G81:</b> feeds to depth in one go, rapids out. Spot drills and holes up to about 3× drill Ø.',
      G73: `<b>G73 chip break:</b> ${pecks} pecks of ${fmt(q, 1)} mm with a small back-off to snap the chip, staying in the hole. Fast — good for 3–5× Ø.`,
      G83: `<b>G83 full peck:</b> ${pecks} pecks of ${fmt(q, 1)} mm, rapids out to R after each to clear chips, rapids back to just above the last bottom. Slowest, safest for deep holes.`,
    }[cyc];
  },
};

// ---------------------------------------------------------------------------
specs.helix = {
  title: 'Helix entry — center post check (top view)',
  controls: [
    { type: 'range', key: 'hr', label: 'Helix radius', min: 5, max: 100, step: 5, unit: '% Ø' },
    { type: 'range', key: 'ang', label: 'Ramp angle', min: 0.5, max: 6, step: 0.5, unit: '°' },
  ],
  init: { hr: 40, ang: 2 },
  draw({ hr }) {
    const k = 7, R = (TOOL_D / 2) * k, rh = (hr / 100) * TOOL_D * k;
    const cx = 210, cy = 125;
    let s = hatch + rc(0, 0, W, H, 'v-hatch-fill');
    s += ci(cx, cy, rh + R, 'v-air-c');
    const core = rh - R;
    if (core > 0) s += ci(cx, cy, core, 'v-core');
    s += ci(cx, cy, rh, 'v-feed-c');
    s += ci(cx + rh, cy, R, 'v-tool-ghost') + ci(cx + rh, cy, 2.5, 'v-ink-fill');
    if (core > 0) s += tx(cx, cy + 4, 'post', 'v-label-bad', 'middle');
    return s;
  },
  caption({ hr, ang }) {
    const rh = (hr / 100) * TOOL_D;
    const pitch = Math.PI * 2 * rh * Math.tan((ang * Math.PI) / 180);
    const holeD = 2 * rh + TOOL_D;
    let c = `Helix radius ${fmt(rh, 1)} mm on Ø${TOOL_D} opens a Ø${fmt(holeD, 1)} hole; at ${ang}° that is <b>${fmt(pitch, 2)} mm per turn</b>. `;
    if (rh > TOOL_D / 2) c += `<b>A post of Ø${fmt(2 * (rh - TOOL_D / 2), 1)} stays in the middle</b> — the helix diameter is bigger than the tool. Keep the helix radius at or below 50% of the tool Ø.`;
    else if (rh < 0.15 * TOOL_D) c += '<b>Very small helix:</b> close to a plunge — the low-speed center of the tool does the cutting.';
    else c += 'No center post: the tool sweeps the whole circle.';
    return c;
  },
};

// ---------------------------------------------------------------------------
specs.thread = {
  title: 'Thread milling direction',
  controls: [
    { type: 'seg', key: 'type', label: 'Thread', options: [['int', 'Internal'], ['ext', 'External']] },
    { type: 'seg', key: 'hand', label: 'Hand', options: [['rh', 'Right hand'], ['lh', 'Left hand']] },
    { type: 'seg', key: 'dir', label: 'Direction', options: [['up', 'Bottom → top'], ['down', 'Top → bottom']] },
  ],
  init: { type: 'int', hand: 'rh', dir: 'up' },
  logic({ type, hand, dir }) {
    // RH helix rises when going CCW (G03) seen from +Z.
    const ccw = (hand === 'rh') === (dir === 'up');
    const climb = type === 'int' ? ccw : !ccw; // internal CCW = climb, external CW = climb (M03)
    return { g: ccw ? 'G03' : 'G02', climb };
  },
  draw(st) {
    const { climb } = this.logic(st);
    const cx = 210, top = 40, bot = 210;
    let s = hatch;
    if (st.type === 'int') {
      s += rc(40, top, 110, bot - top, 'v-hatch-fill') + rc(270, top, 110, bot - top, 'v-hatch-fill');
    } else s += rc(150, top, 120, bot - top, 'v-hatch-fill');
    // helix lines
    const n = 7, pitch = (bot - top) / n;
    const slope = st.hand === 'rh' ? 1 : -1;
    for (let i = 0; i <= n; i++) {
      const y = top + i * pitch;
      s += ln(150, y, 270, y + (pitch / 2) * slope, 'v-ink-thin');
    }
    const ax = st.type === 'int' ? cx : 300;
    const y1 = st.dir === 'up' ? bot - 10 : top + 10, y2 = st.dir === 'up' ? top + 10 : bot - 10;
    s += ln(ax, y1, ax, y2, climb ? 'v-feed' : 'v-rapid-solid');
    s += arrowHead(ax, y2, st.dir === 'up' ? -Math.PI / 2 : Math.PI / 2, climb ? 'v-feed-fill' : 'v-rapid-fill', 10);
    s += tx(20, 24, st.type === 'int' ? 'Section through a tapped hole' : 'Section through a threaded boss', 'v-label');
    return s;
  },
  caption(st) {
    const { g, climb } = this.logic(st);
    return `<b>${g}</b> (${g === 'G03' ? 'counter-clockwise' : 'clockwise'}) with M03 → <b>${climb ? 'climb milling' : 'conventional milling'}</b>. ${climb ? 'Preferred: better flank finish and tool life.' : 'Flip the Z direction to climb.'}${st.type === 'int' && st.dir === 'up' ? ' Bottom-up also pushes chips out of the hole.' : ''}`;
  },
};

// ---------------------------------------------------------------------------
specs['tip-comp'] = {
  title: 'Drill tip compensation',
  controls: [
    { type: 'seg', key: 'angle', label: 'Point angle', options: [['118', '118°'], ['135', '135°'], ['140', '140°']] },
    { type: 'range', key: 'd', label: 'Drill Ø', min: 3, max: 20, step: 0.5, unit: 'mm' },
    { type: 'range', key: 'bt', label: 'Breakthrough', min: 0, max: 3, step: 0.25, unit: 'mm' },
  ],
  init: { angle: '135', d: 8.5, bt: 1 },
  draw({ angle, d, bt }) {
    const tip = d / 2 / Math.tan(((+angle / 2) * Math.PI) / 180);
    const plate = 12, k = 9;
    const top = 40, x = 210, r = (d / 2) * k;
    const zBottom = plate + tip + bt;
    let s = hatch + rc(20, top, W - 40, plate * k, 'v-hatch-fill');
    s += rc(x - r, top, 2 * r, plate * k, 'v-air');
    const ty = top + zBottom * k;
    s += pa(`M${x - r},${top - 30} V${ty - tip * k} L${x},${ty} L${x + r},${ty - tip * k} V${top - 30}Z`, 'v-tool');
    s += ln(20, top + plate * k, W - 20, top + plate * k, 'v-plane v-plane-d');
    s += tx(W - 22, top + plate * k - 4, 'bottom of part', 'v-label-plane', 'end');
    s += ln(x + r + 14, top + plate * k, x + r + 14, ty, 'v-ink') + tx(x + r + 20, top + plate * k + (ty - top - plate * k) / 2 + 4, `+${fmt(tip + bt, 2)}`, 'v-label-strong');
    return s;
  },
  caption({ angle, d, bt }) {
    const tip = d / 2 / Math.tan(((+angle / 2) * Math.PI) / 180);
    return `Tip length of a Ø${fmt(d, 1)} drill at ${angle}° = <b>${fmt(tip, 2)} mm</b>. With ${fmt(bt, 2)} mm breakthrough the tool goes <b>${fmt(tip + bt, 2)} mm</b> below the part bottom — check what is underneath.`;
  },
};

// ---------------------------------------------------------------------------
specs.chamfer = {
  title: '2D chamfer with a chamfer mill (section)',
  controls: [
    { type: 'range', key: 'w', label: 'Chamfer width', min: 0.2, max: 3, step: 0.1, unit: 'mm' },
    { type: 'range', key: 'tip', label: 'Tip offset', min: 0, max: 2, step: 0.1, unit: 'mm' },
  ],
  init: { w: 1, tip: 0.5 },
  draw({ w, tip }) {
    // 90° tool (45° chamfer). Part is to the left of x=ex and below y=ey.
    const k = 30, ex = 230, ey = 62;
    const tipY = ey + (w + tip) * k;
    const tipX = ex + tip * k; // the left flank passes through the chamfer face
    const cone = 2.4 * k;
    let s = hatch;
    s += pa(`M10,${ey} H${ex - w * k} L${ex},${ey + w * k} V${H} H10Z`, 'v-hatch-fill');
    s += pa(`M${tipX},${tipY} L${tipX - cone},${tipY - cone} V${tipY - cone - 40} H${tipX + cone} V${tipY - cone} Z`, 'v-tool-ghost');
    s += ln(tipX, tipY, tipX, tipY - cone - 40, 'v-ink-faint');
    s += ln(ex - w * k, ey, ex, ey + w * k, 'v-engage');
    s += ln(ex - w * k, ey - 12, ex, ey - 12, 'v-ink') + tx(ex - (w * k) / 2, ey - 16, `${fmt(w, 1)}`, 'v-label-strong', 'middle');
    if (tip > 0) s += ln(ex + 12, ey + w * k, ex + 12, tipY, 'v-ink') + tx(ex + 18, (ey + w * k + tipY) / 2 + 4, `tip ${fmt(tip, 1)}`, 'v-label');
    s += ci(tipX, tipY, 3, tip > 0 ? 'v-ink-fill' : 'v-rapid-fill');
    s += tx(20, H - 12, 'Part', 'v-label-strong') + tx(ex - (w * k) / 2 - 6, ey + (w * k) / 2 + 22, 'cutting zone', 'v-label', 'end');
    return s;
  },
  caption({ w, tip }) {
    if (tip === 0) return '<b>Tip offset 0:</b> the very tip of the tool cuts the bottom of the chamfer — the weakest, slowest part of the tool. It wears quickly and leaves a poor finish.';
    return `A 90° tool (45° chamfer) cutting a <b>${fmt(w, 1)} mm</b> chamfer with the tip <b>${fmt(tip, 1)} mm</b> past the chamfer: the cut (amber) happens higher on the flank, where the diameter and surface speed are larger. The tip ends ${fmt(w + tip, 1)} mm below the top.`;
  },
};

// ---------------------------------------------------------------------------
specs.ramp = {
  title: 'Ramp along the chain (unrolled side view)',
  controls: [
    { type: 'range', key: 'ang', label: 'Ramp angle', min: 0.5, max: 10, step: 0.5, unit: '°' },
    { type: 'range', key: 'depth', label: 'Total depth', min: 1, max: 20, step: 0.5, unit: 'mm' },
    { type: 'range', key: 'len', label: 'Chain length', min: 20, max: 300, step: 10, unit: 'mm' },
  ],
  init: { ang: 2, depth: 6, len: 120 },
  draw({ ang, depth, len }) {
    const dropPerLap = len * Math.tan((ang * Math.PI) / 180);
    const laps = Math.ceil(depth / dropPerLap - 1e-9);
    const totalLen = laps * len;
    const xk = 360 / Math.max(totalLen, len), zk = 150 / depth;
    let s = rc(30, 50, 370, 150, 'v-stock-light');
    s += ln(30, 50, 400, 50, 'v-plane v-plane-t') + ln(30, 200, 400, 200, 'v-plane v-plane-d');
    for (let i = 1; i < laps; i++) s += ln(30 + i * len * xk, 40, 30 + i * len * xk, 210, 'v-ink-faint');
    const zEnd = Math.min(depth, totalLen * Math.tan((ang * Math.PI) / 180));
    const xEnd = depth / Math.tan((ang * Math.PI) / 180);
    s += ln(30, 50, 30 + xEnd * xk, 50 + zEnd * zk, 'v-feed');
    s += ln(30 + xEnd * xk, 200, 30 + totalLen * xk, 200, 'v-feed');
    s += tx(34, 228, `${laps} lap${laps > 1 ? 's' : ''} around the chain →`, 'v-label');
    return s;
  },
  caption({ ang, depth, len }) {
    const drop = len * Math.tan((ang * Math.PI) / 180);
    const laps = Math.ceil(depth / drop - 1e-9);
    return `At ${ang}° the tool drops <b>${fmt(drop, 2)} mm per lap</b> of a ${len} mm chain, so it needs <b>${laps} lap${laps > 1 ? 's' : ''}</b> to reach ${fmt(depth, 1)} mm, plus one flat lap at depth to clean the ramp.`;
  },
};

// ---------------------------------------------------------------------------
specs['break-through'] = {
  title: 'Break through a plate (section)',
  controls: [
    { type: 'range', key: 'bt', label: 'Break through', min: 0, max: 2, step: 0.1, unit: 'mm' },
    { type: 'range', key: 'cr', label: 'Tool corner R', min: 0, max: 2, step: 0.1, unit: 'mm' },
  ],
  init: { bt: 0.5, cr: 1 },
  draw({ bt, cr }) {
    // Wall of the cut-out is at x0; part on the left. Tool sits to the right, shown partly.
    const k = 40, top = 30, plate = 3;
    const x0 = 170;
    const bottomY = top + plate * k;
    const tipY = bottomY + bt * k;
    const crk = cr * k;
    let s = hatch;
    s += rc(10, top, x0 - 10, plate * k, 'v-hatch-fill');
    // flash: material between the wall line and the tool corner arc, above the plate bottom
    if (cr > bt) {
      const pts = [];
      const cy0 = tipY - crk; // arc center y
      for (let i = 0; i <= 20; i++) {
        const y = cy0 + ((bottomY - cy0) * i) / 20;
        const dx = crk - Math.sqrt(Math.max(0, crk * crk - (y - cy0) * (y - cy0)));
        pts.push([x0 + dx, y]);
      }
      s += pa(`M${x0},${cy0} ${pts.map((p) => `L${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')} L${x0},${bottomY} Z`, 'v-core');
    }
    s += rc(10, bottomY + 2, W - 20, 70, 'v-clamp', 2) + tx(20, bottomY + 60, 'parallel / table — what is under the part?', 'v-label');
    s += ln(10, bottomY, W - 10, bottomY, 'v-plane v-plane-d');
    s += pa(`M${x0},${top - 30} V${tipY - crk} A${crk},${crk} 0 0 0 ${x0 + crk},${tipY} H${W - 10} V${top - 30} Z`, 'v-tool-ghost');
    if (bt > 0) s += ln(W - 40, bottomY, W - 40, tipY, 'v-ink') + tx(W - 46, bottomY + (tipY - bottomY) / 2 + 4, `${fmt(bt, 1)}`, 'v-label-strong', 'end');
    s += tx(18, top + 20, 'Part', 'v-label-strong') + tx(x0 + 14, top + 20, 'Tool', 'v-label-strong');
    return s;
  },
  caption({ bt, cr }) {
    if (cr > bt) return `<b>A flash stays at the bottom</b> (red): the ${fmt(cr, 1)} mm corner radius rounds the bottom of the cut, so break through by at least the corner radius plus a little.`;
    return `Breaks through by ${fmt(bt, 1)} mm, more than the ${fmt(cr, 1)} mm corner radius — the wall is cut full height. Make sure the tool clears the parallels or use a sacrificial plate.`;
  },
};

// ---------------------------------------------------------------------------
export const vizTitles = Object.fromEntries(Object.entries(specs).map(([k, v]) => [k, v.title]));
export const hasViz = (k) => !!specs[k];

export function mountViz(kind, el) {
  const spec = specs[kind];
  if (!spec) { el.innerHTML = ''; return () => {}; }
  const state = { ...spec.init };
  let stop = () => {};
  const controlsHtml = spec.controls
    .map((c) => {
      if (c.type === 'range')
        return `<div class="row" data-key="${c.key}"><label for="v-${kind}-${c.key}">${esc(c.label)}</label><input id="v-${kind}-${c.key}" type="range" min="${c.min}" max="${c.max}" step="${c.step}" value="${state[c.key]}" data-key="${c.key}"><output>${fmtVal(state[c.key], c)}</output></div>`;
      return `<div class="row seg-row" data-key="${c.key}"><span class="lbl">${esc(c.label)}</span><div class="seg" role="group" aria-label="${esc(c.label)}">${c.options
        .map(([v, l]) => `<button type="button" data-key="${c.key}" data-val="${v}" aria-pressed="${state[c.key] === v}">${esc(l)}</button>`)
        .join('')}</div></div>`;
    })
    .join('');
  el.innerHTML = `<figure class="viz" style="margin:0"><div class="viz-head"><h4>${esc(spec.title)}</h4></div><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(spec.title)}"></svg><div class="viz-controls">${controlsHtml}</div><figcaption class="viz-caption" aria-live="polite"></figcaption></figure>`;
  const svg = el.querySelector('svg');
  const cap = el.querySelector('figcaption');
  const update = () => {
    stop();
    svg.innerHTML = spec.draw.call(spec, state);
    cap.innerHTML = spec.caption.call(spec, state);
    for (const c of spec.controls) {
      const row = el.querySelector(`.row[data-key="${c.key}"]`);
      if (c.show) row.hidden = !c.show(state);
      if (c.type === 'range') row.querySelector('output').textContent = fmtVal(state[c.key], c);
      else row.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(state[c.key] === b.dataset.val)));
    }
    if (spec.animate) stop = spec.animate.call(spec, svg, state);
  };
  const ac = new AbortController();
  el.addEventListener('input', (e) => {
    const k = e.target.dataset.key;
    if (k) { state[k] = parseFloat(e.target.value); update(); }
  }, { signal: ac.signal });
  el.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-val]');
    if (b) { state[b.dataset.key] = b.dataset.val; update(); }
  }, { signal: ac.signal });
  update();
  return () => { stop(); ac.abort(); };
}

function fmtVal(v, c) {
  const d = c.step < 0.01 ? 3 : c.step < 0.1 ? 2 : c.step < 1 ? 1 : 0;
  return `${fmt(v, d)}${c.unit ? (c.unit.startsWith('%') || c.unit === '°' ? '' : ' ') + c.unit : ''}`;
}
