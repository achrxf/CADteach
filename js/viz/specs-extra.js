// Visuals added in v1.6 for fields that had none: depth and lead options, tabs, entries,
// thin walls, island facing, peel alignment, hole sorting, start angles, threads and feeds.

export function addExtraSpecs(specs, h) {
  const { W, H, ln, pl, ci, rc, tx, pa, arrowHead, hatch } = h;
  const before = new Set(Object.keys(specs));
  const note = (s) => tx(W - 10, H - 10, s, 'v-label', 'end');
  const view = (s) => tx(W - 10, 16, s, 'v-label', 'end');

  // Keep tool down: between depth levels, retract or stay down
  specs['keep-down'] = {
    title: 'Keep tool down between levels',
    controls: [{ type: 'seg', key: 'k', label: 'Keep tool down', options: [['on', 'On'], ['off', 'Off']] }],
    init: { k: 'on' },
    draw({ k }) {
      let s = view('Side view of a closed contour, 3 depth cuts');
      const x0 = 80, x1 = 340, top = 70, step = 40;
      s += rc(x0, top, x1 - x0, step * 3 + 10, 'v-stock-light');
      for (let i = 1; i <= 3; i++) {
        const y = top + step * i;
        s += ln(x0, y, x1, y, 'v-feed');
        if (i < 3) {
          if (k === 'on') s += ln(x1, y, x1, y + step, 'v-feed') + tx(x1 + 6, y + step / 2 + 4, 'step down', 'v-label');
          else s += pa(`M${x1},${y} V${top - 30} H${x0 - 30}`, 'v-rapid') + pa(`M${x0 - 30},${top - 30} V${y + step} H${x0}`, 'v-rapid');
        }
      }
      return s + note(k === 'on' ? 'Closed chain: the tool goes straight down to the next level' : 'Off: retract, travel back, come down again: more air time');
    },
  };

  // Tapered walls with a flat end mill: stair steps
  specs['tapered-walls'] = {
    title: 'Tapered walls with depth cuts',
    controls: [
      { type: 'range', key: 'a', label: 'Taper angle', min: 0, max: 15, step: 1, unit: '°' },
      { type: 'range', key: 'n', label: 'Depth cuts', min: 2, max: 10, step: 1, unit: '' },
    ],
    init: { a: 10, n: 4 },
    draw({ a, n }) {
      let s = view('Section through a pocket wall (taper exaggerated)');
      const top = 50, bot = 200, x = 150, t = Math.tan((a * 3 * Math.PI) / 180), d = (bot - top) / n;
      // the wall leans into the material (part on the left), pocket on the right
      const wallAt = (y) => x - t * (y - top) * -1;
      s += pa(`M30,${top} H${x} L${wallAt(bot)},${bot} H30Z`, 'v-hatch-fill');
      // a flat end mill must stay off the wall at the bottom of each level, so stock is left above it
      const pts = [];
      for (let i = 1; i <= n; i++) { const y0 = top + d * (i - 1), y = top + d * i; pts.push([wallAt(y), y0], [wallAt(y), y]); }
      s += pl(pts, 'v-feed') + ln(x, top, wallAt(bot), bot, 'c-ref');
      s += tx(x - 8, top - 6, `${a}° draft`, 'v-label-strong', 'end') + tx(wallAt(bot) + 10, bot - 6, 'stock left in the corners', 'v-label');
      return s + note(a ? 'Each level steps out: a staircase. Finish with a tapered tool.' : '0°: a straight wall');
    },
  };

  // Line/arc filtering
  specs['arc-filter'] = {
    title: 'Line/arc filtering',
    controls: [{ type: 'seg', key: 'f', label: 'Filter', options: [['off', 'Off'], ['on', 'On']] }],
    init: { f: 'off' },
    draw({ f }) {
      let s = view('Top view of a curved path');
      const pts = [];
      for (let i = 0; i <= 24; i++) { const t = i / 24; pts.push([50 + 320 * t, 170 - 100 * Math.sin(Math.PI * t)]); }
      if (f === 'off') { s += pl(pts, 'v-feed'); pts.forEach(([x, y]) => (s += ci(x, y, 2.2, 'c-pt'))); return s + note('25 short G1 lines: long code, the control slows between them'); }
      s += pa('M50,170 A200,200 0 0 1 210,70', 'v-feed') + pa('M210,70 A200,200 0 0 1 370,170', 'v-feed') + ci(50, 170, 3, 'c-pt') + ci(210, 70, 3, 'c-pt') + ci(370, 170, 3, 'c-pt');
      return s + note('2 G2 arcs within the tolerance: short code, smooth motion');
    },
  };

  // Tool center feed vs edge feed on arcs (Override Arc Feed, Tool Edge feed rate)
  specs['edge-feed'] = {
    title: 'Edge feed vs centre feed on arcs',
    controls: [
      { type: 'range', key: 'D', label: 'Hole / thread Ø', min: 12, max: 60, step: 1, unit: ' mm' },
      { type: 'range', key: 'd', label: 'Tool Ø', min: 4, max: 30, step: 1, unit: ' mm' },
    ],
    init: { D: 20, d: 12 },
    draw({ D, d }) {
      d = Math.min(d, D - 2);
      let s = view('Top view, internal (ID) arc');
      const cx = 160, cy = 122, k = 74 / (D / 2);
      s += ci(cx, cy, (D / 2) * k, 'v-air-c') + ci(cx, cy, ((D - d) / 2) * k, 'c-ref');
      s += ci(cx + ((D - d) / 2) * k, cy, (d / 2) * k, 'v-tool');
      s += tx(cx, cy - (D / 2) * k - 6, 'edge path (what the drawing feed means)', 'v-label', 'middle');
      s += tx(cx - ((D - d) / 2) * k, cy + (D / 2) * k + 16, 'dashed: centre path', 'v-label', 'middle');
      const r = (D - d) / D;
      s += tx(300, 90, 'F centre = F edge ×', 'v-label') + tx(300, 108, `(${D} − ${d}) / ${D} = ${r.toFixed(2)}`, 'v-label-strong');
      return s + note(r < 0.5 ? 'Small hole, big tool: programmed at centre feed the edge runs ' + (1 / r).toFixed(1) + '× too fast' : 'Edge and centre feed are close: little correction needed');
    },
  };

  // Tab motion side view
  specs['tab-motion'] = {
    title: 'Tab motion',
    controls: [
      { type: 'seg', key: 'h', label: 'Tab height', options: [['full', 'Full'], ['partial', 'Partial']] },
      { type: 'seg', key: 'm', label: 'Moves', options: [['vert', 'Vertical'], ['ramp', 'Ramp']] },
    ],
    init: { h: 'partial', m: 'ramp' },
    draw({ h, m }) {
      let s = view('Side view along the wall, at the tab');
      const x0 = 40, x1 = 380, top = 60, bot = 200, tx0 = 170, tx1 = 250, tabTop = h === 'full' ? top : 165;
      s += rc(x0, top, x1 - x0, bot - top, 'v-stock-light') + rc(tx0, tabTop, tx1 - tx0, bot - tabTop, 'v-hatch-fill');
      const levels = h === 'full' ? [100, 140, 190] : [100, 140, 190];
      levels.forEach((y) => {
        if (y < tabTop) { s += ln(x0, y, x1, y, 'v-feed'); return; }
        const r = m === 'ramp' ? 22 : 0;
        s += pa(`M${x0},${y} H${tx0 - r} L${tx0},${tabTop - 4} H${tx1} L${tx1 + r},${y} H${x1}`, 'v-feed');
      });
      s += tx((tx0 + tx1) / 2, bot - 8, 'tab', 'v-label-strong', 'middle');
      return s + note(h === 'full' ? 'Full: the tab goes up the whole wall (strong, more filing)' : 'Partial: only the last levels step over the tab');
    },
  };

  // If entry attempts fail
  specs['entry-fail'] = {
    title: 'If all entry attempts fail',
    controls: [{ type: 'seg', key: 'f', label: 'Then', options: [['plunge', 'Plunge (default)'], ['skip', 'Skip']] }],
    init: { f: 'plunge' },
    draw({ f }) {
      let s = view('Top view: a pocket too narrow for the helix');
      s += rc(60, 70, 300, 110, 'v-hatch-fill') + rc(80, 90, 260, 70, 'v-air-c') + rc(300, 110, 30, 30, 'v-air', 3);
      s += ci(170, 125, 34, 'v-tool-ghost') + tx(170, 70 - 6, 'helix does not fit', 'v-label', 'middle');
      s += rc(300, 110, 30, 30, 'c-cut');
      if (f === 'plunge') { s += ci(315, 125, 10, 'v-tool-bad') + tx(315, 160, 'straight plunge', 'v-label-bad', 'middle'); return s + note('Plunge: the tool drills in with its centre: broken tool'); }
      s += tx(315, 160, 'skipped (saved as a boundary)', 'v-label', 'middle');
      return s + note('Skip: left for a smaller tool or a pre-drilled hole');
    },
  };

  // Thin wall finishing
  specs['thin-wall'] = {
    title: 'Thin wall finishing',
    controls: [{ type: 'seg', key: 't', label: 'Thin wall', options: [['off', 'Off'], ['on', 'On']] }],
    init: { t: 'on' },
    draw({ t }) {
      let s = view('Section: a 1.5 mm wall between two pockets');
      const wx = 150, ww = 14, top = 50, bot = 210, n = 4, d = (bot - top) / n;
      s += rc(wx, top, ww, bot - top, 'v-hatch-fill') + rc(30, bot, 260, 12, 'v-hatch-fill');
      s += tx(70, top + 14, 'pocket', 'v-label', 'middle') + tx(230, top + 14, 'pocket', 'v-label', 'middle');
      for (let i = 1; i <= n; i++) {
        const y0 = top + d * (i - 1), y = top + d * i;
        s += ln(40, y, wx - 8, y, 'v-feed') + ln(wx + ww + 8, y, 280, y, 'v-feed');
        if (t === 'on') s += ln(wx - 2, y0, wx - 2, y, 'v-finish') + ln(wx + ww + 2, y0, wx + ww + 2, y, 'v-finish');
        s += tx(300, y - d / 2 + 4, t === 'on' ? `level ${i}: rough + finish` : `level ${i}: rough`, 'v-label');
      }
      if (t === 'off') s += ln(wx - 2, top, wx - 2, bot, 'v-finish') + ln(wx + ww + 2, top, wx + ww + 2, bot, 'v-finish') + tx(300, bot - 2, 'then finish full height', 'v-label-bad');
      return s + note(t === 'on' ? 'Each level is finished while the stock below still supports the wall' : 'Finishing the full height at the end: the wall flexes and comes out thin');
    },
  };

  // Use island depths / Island facing
  specs['island-facing'] = {
    title: 'Use island depths / Island facing',
    controls: [{ type: 'seg', key: 'i', label: 'Island depths', options: [['off', 'Off'], ['on', 'On']] }],
    init: { i: 'on' },
    draw({ i }) {
      let s = view('Section: pocket with an island below the stock top');
      const top = 50, it = 110, bot = 200, step = 36;
      s += pa(`M30,${top} H80 V${bot} H170 V${it} H240 V${bot} H340 V${top} H390 V220 H30Z`, 'v-hatch-fill');
      const levels = [];
      for (let y = top + step; y < bot - 10; y += step) levels.push(y);
      levels.push(bot);
      if (i === 'on' && !levels.includes(it)) levels.push(it);
      const firstBelow = Math.min(...levels.filter((y) => y < it));
      if (i === 'off') s += rc(170, firstBelow, 70, it - firstBelow, 'v-stock') + tx(205, top + 2, 'skin left on the island', 'v-label-bad', 'middle');
      else s += tx(205, top + 2, 'island top faced', 'v-label', 'middle');
      levels.forEach((y) => {
        if (y <= it) s += ln(84, y, 336, y, y === it ? 'v-finish' : 'v-feed');
        else s += ln(84, y, 166, y, 'v-feed') + ln(244, y, 336, y, 'v-feed');
      });
      return s + note(i === 'on' ? 'A level is added at the island top, so the top comes out clean' : 'Off: levels only at the regular step; the island top keeps a skin');
    },
  };

  // Peel Mill single chain alignment
  specs['peel-align'] = {
    title: 'Single chain: slot alignment',
    controls: [
      { type: 'seg', key: 'a', label: 'Align', options: [['left', 'Left'], ['center', 'Center'], ['right', 'Right']] },
      { type: 'range', key: 'w', label: 'Slot width', min: 8, max: 40, step: 1, unit: ' mm' },
    ],
    init: { a: 'center', w: 16 },
    draw({ a, w }) {
      let s = view('Top view, chain direction →');
      const y = 125, k = 3, half = (w * k) / 2;
      const off = a === 'center' ? 0 : a === 'left' ? -half : half; // left of the chain = up on screen
      s += rc(50, y + off - half, 320, w * k, 'v-sweep') + ln(50, y + off - half, 370, y + off - half, 'v-feed') + ln(50, y + off + half, 370, y + off + half, 'v-feed');
      s += ln(50, y, 370, y, 'v-chain') + arrowHead(370, y, 0, 'v-ink-fill', 8) + tx(56, y - 6, 'chain', 'v-label');
      return s + note(`Slot ${w} mm ${a === 'center' ? 'centred on the chain' : a === 'left' ? 'on the left of the chain' : 'on the right of the chain'}`);
    },
  };

  // Drill hole sorting
  specs['hole-sort'] = {
    title: 'Hole sort order',
    controls: [{ type: 'seg', key: 's', label: 'Sort', options: [['sel', 'Selected order'], ['zig', '2D zigzag'], ['one', '2D one way']] }],
    init: { s: 'zig' },
    draw({ s: mode }) {
      let s = view('Top view, 4 × 3 holes');
      const xs = [90, 170, 250, 330], ys = [70, 125, 180];
      let order = [];
      if (mode === 'sel') order = [[0, 0], [3, 2], [1, 1], [3, 0], [0, 2], [2, 1], [1, 0], [2, 2], [0, 1], [3, 1], [2, 0], [1, 2]];
      else ys.forEach((_, j) => { const row = xs.map((__, i) => [i, j]); order.push(...(mode === 'zig' && j % 2 ? row.reverse() : row)); });
      const pts = order.map(([i, j]) => [xs[i], ys[j]]);
      for (let k = 1; k < pts.length; k++) s += ln(pts[k - 1][0], pts[k - 1][1], pts[k][0], pts[k][1], 'v-rapid');
      pts.forEach(([x, y], k) => (s += ci(x, y, 11, 'v-num-a') + tx(x, y + 4, String(k + 1), 'v-label-strong', 'middle')));
      let len = 0; for (let k = 1; k < pts.length; k++) len += Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]);
      return s + note(`Rapid travel: ${Math.round(len / 2)} mm (× every tool: spot, drill, tap)`);
    },
  };

  // Start angle on a circle
  specs['start-angle'] = {
    title: 'Start angle on the circle',
    controls: [{ type: 'range', key: 'a', label: 'Start angle', min: 0, max: 359, step: 15, unit: '°' }],
    init: { a: 90 },
    draw({ a }) {
      let s = view('Top view of the hole');
      const cx = 200, cy = 130, R = 80, t = (a * Math.PI) / 180;
      s += ci(cx, cy, R, 'v-air-c') + ln(cx, cy, cx + R + 20, cy, 'c-ref') + tx(cx + R + 24, cy + 4, '0°', 'v-label');
      const px = cx + R * Math.cos(t), py = cy - R * Math.sin(t);
      s += ln(cx, cy, px, py, 'c-dim') + ci(px, py, 7, 'v-tool-bad') + tx(px + (Math.cos(t) >= 0 ? 12 : -12), py - 8, 'entry mark', 'v-label-bad', Math.cos(t) >= 0 ? 'start' : 'end');
      return s + note('Put it where a small witness mark does not matter (90° = top, the default)');
    },
  };

  // Thread profile: pitch, major, minor, allowance
  specs['thread-profile'] = {
    title: 'Thread pitch and diameters',
    controls: [
      { type: 'seg', key: 'id', label: 'Thread', options: [['id', 'ID (internal)'], ['od', 'OD (external)']] },
      { type: 'range', key: 'p', label: 'Pitch', min: 1, max: 3, step: 0.25, unit: ' mm' },
    ],
    init: { id: 'id', p: 1.5 },
    draw({ id, p }) {
      let s = view('Section through the thread flanks');
      const k = 26, depth = 0.6134 * p * k, top = 62, bottom = 205, x0 = 210;
      const pts = [[x0, top]];
      for (let y = top; y + p * k <= bottom; y += p * k) pts.push([x0 - depth, y + (p * k) / 2], [x0, y + p * k]);
      s += pl(pts, 'v-feed');
      s += ln(x0, top - 10, x0, bottom + 4, 'c-ref') + ln(x0 - depth, top - 10, x0 - depth, bottom + 4, 'c-ref');
      s += tx(x0 + 4, top - 16, id === 'id' ? 'major Ø: thread mill cuts to here' : 'major Ø: boss size', 'v-label');
      s += tx(x0 - depth - 4, top - 16, id === 'id' ? 'minor Ø ≈ drill' : 'minor Ø: root', 'v-label', 'end');
      const px = x0 + 40;
      s += ln(px, top, px, top + p * k, 'c-dim') + ln(x0 + 4, top, px + 6, top, 'c-ref') + ln(x0 + 4, top + p * k, px + 6, top + p * k, 'c-ref');
      s += tx(px + 8, top + (p * k) / 2 + 4, `pitch ${p} mm`, 'v-label-strong');
      s += tx(px + 8, top + p * k + 34, `thread depth ≈ ${(0.6134 * p).toFixed(2)} mm`, 'v-label');
      const drill = id === 'id' ? `Tap drill ≈ major − pitch (M10 × ${p}: Ø${+(10 - p).toFixed(2)})` : 'Turn or mill the boss to the major Ø first';
      return s + note(drill);
    },
  };

  // Move between cuts (Facing)
  specs['move-between'] = {
    title: 'Move between cuts',
    controls: [{ type: 'seg', key: 'm', label: 'Move', options: [['lin', 'Linear'], ['loop', 'High speed loops'], ['rap', 'Rapid']] }],
    init: { m: 'loop' },
    draw({ m }) {
      let s = view('Top view, zigzag facing');
      s += rc(90, 60, 240, 130, 'v-stock-light');
      const ys = [80, 125, 170];
      ys.forEach((y, i) => { s += ln(60, y, 360, y, 'v-feed'); });
      for (let i = 0; i < 2; i++) {
        const right = i % 2 === 0, x = right ? 360 : 60, y0 = ys[i], y1 = ys[i + 1];
        if (m === 'lin') s += ln(x, y0, x, y1, 'v-feed');
        else if (m === 'loop') s += pa(`M${x},${y0} A${(y1 - y0) / 2},${(y1 - y0) / 2} 0 0 ${right ? 1 : 0} ${x},${y1}`, 'v-feed');
        else s += pa(`M${x},${y0} V${y1}`, 'v-rapid');
      }
      return s + note({ lin: 'A square turn: the machine brakes at each corner', loop: 'A loop: the face mill keeps its feed', rap: 'Rapid: lifts and repositions (only when the stock is open)' }[m]);
    },
  };

  // Lead options for closed contours
  specs['lead-options'] = {
    title: 'Where and how the tool enters',
    controls: [{ type: 'seg', key: 'o', label: 'Option', options: [['mid', 'Midpoint entry'], ['corner', 'Entry at a corner'], ['plunge', 'Plunge after first move']] }],
    init: { o: 'mid' },
    draw({ o }) {
      let s = view('Top view of a closed outside contour');
      s += rc(110, 70, 200, 120, 'v-hatch-fill') + rc(104, 64, 212, 132, 'c-ref');
      if (o === 'mid') s += pa('M210,24 A40,40 0 0 1 210,64', 'v-feed') + ln(210, 0, 210, 24, 'v-feed') + ci(210, 64, 4, 'c-pt') + tx(218, 40, 'lead in the middle of a side', 'v-label');
      if (o === 'corner') s += pa('M104,24 A40,40 0 0 1 104,64', 'v-feed') + ci(104, 64, 4, 'c-pt') + tx(112, 40, 'entry in the corner: a mark where it shows most', 'v-label-bad');
      if (o === 'plunge') s += pa('M210,0 V24', 'v-rapid') + pa('M150,24 H210', 'v-rapid') + pa('M210,24 A40,40 0 0 1 210,64', 'v-feed') + tx(218, 20, 'move over in XY first, then plunge', 'v-label');
      return s + note({ mid: 'Default for closed contours: no lead in a corner', corner: 'Midpoint off: the lead lands where the chain starts', plunge: 'Plunge after first move: keeps the plunge away from a clamp or the part' }[o]);
    },
  };

  // every new visual gets the hatch pattern for cut material
  for (const k of Object.keys(specs)) if (!before.has(k)) { const d = specs[k].draw; specs[k].draw = (v) => hatch + d(v); }
}
