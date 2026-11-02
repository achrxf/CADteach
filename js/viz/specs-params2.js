// Visuals added in v1.7 so every parameter has an interactive drawing:
// tool page, coolant, facing, contour, pocket, dynamic and hole-making fields that had none.

export function addParamSpecs2(specs, h) {
  const { W, H, ln, pl, ci, rc, tx, pa, arrowHead, hatch } = h;
  const before = new Set(Object.keys(specs));
  const note = (s) => {
    if (s.length <= 66) return tx(W - 10, H - 10, s, 'v-label', 'end');
    let i = s.lastIndexOf(' ', Math.ceil(s.length / 2) + 6); if (i < 10) i = s.indexOf(' ', s.length / 2);
    return tx(W - 10, H - 24, s.slice(0, i), 'v-label', 'end') + tx(W - 10, H - 10, s.slice(i + 1), 'v-label', 'end');
  };
  const view = (s) => tx(W - 10, 16, s, 'v-label', 'end');
  const r1 = (n) => Math.round(n * 10) / 10;

  // ---------------------------------------------------------------- tool page
  specs['tool-offsets'] = {
    title: 'Tool number and offsets',
    controls: [
      { type: 'range', key: 't', label: 'Tool number', min: 1, max: 30, step: 1, unit: '' },
      { type: 'seg', key: 'h', label: 'Length offset H', options: [['same', 'Same as tool'], ['other', 'Typed by hand']] },
    ],
    init: { t: 5, h: 'same' },
    draw({ t, h }) {
      const H_ = h === 'same' ? t : t === 1 ? 2 : t - 1;
      let s = view('What the post writes, and what the control does with it');
      // spindle + holder + tool
      s += rc(70, 30, 70, 30, 'v-part') + pa('M80,60 L130,60 L120,95 L90,95Z', 'v-stock') + rc(97, 95, 16, 70, 'v-tool');
      s += ln(40, 60, 170, 60, 'c-ref') + tx(44, 54, 'gauge line', 'v-label');
      s += pa('M160,60 V165', 'c-dim') + tx(164, 115, 'H', 'v-label-strong');
      s += rc(30, 180, 200, 12, 'v-hatch-fill') + tx(130, 207, 'Z0 on the part', 'v-label', 'middle');
      const bad = H_ !== t;
      s += tx(230, 70, `T${t} M06`, 'v-label-strong') + tx(230, 92, `G43 H${H_} Z50.`, bad ? 'v-label-bad' : 'v-label-strong') + tx(230, 114, `G41 D${t}`, 'v-label-strong');
      s += tx(230, 140, bad ? `H${H_} is another tool's length:` : 'H and D = pocket number', bad ? 'v-label-bad' : 'v-label') + (bad ? tx(230, 156, 'the Z is wrong by the difference', 'v-label-bad') : '');
      if (bad) s += rc(97, 165, 16, 22, 'v-tool-bad');
      return s + note('Tool number = pocket in the magazine. Keep H and D the same number.');
    },
  };

  specs['speeds-calc'] = {
    title: 'Spindle speed and feed from the tool',
    controls: [
      { type: 'range', key: 'vc', label: 'Cutting speed Vc', min: 20, max: 600, step: 5, unit: ' m/min' },
      { type: 'range', key: 'd', label: 'Tool Ø', min: 2, max: 50, step: 1, unit: ' mm' },
      { type: 'range', key: 'fz', label: 'Feed per tooth', min: 0.01, max: 0.3, step: 0.005, unit: ' mm' },
      { type: 'range', key: 'z', label: 'Flutes', min: 1, max: 8, step: 1, unit: '' },
    ],
    init: { vc: 300, d: 12, fz: 0.06, z: 3 },
    draw({ vc, d, fz, z }) {
      const S = Math.round((vc * 1000) / (Math.PI * d)), F = Math.round(S * z * fz);
      let s = view('Top view of the tool');
      const cx = 110, cy = 120, R = 30 + d * 1.4;
      s += ci(cx, cy, R, 'v-tool');
      for (let i = 0; i < z; i++) { const a = (i / z) * Math.PI * 2; s += ln(cx, cy, cx + R * Math.cos(a), cy + R * Math.sin(a), 'v-ink-thin'); }
      s += pa(`M${cx + R + 8},${cy - 20} A${R + 8},${R + 8} 0 0 1 ${cx + R + 8 * Math.cos(0.5)},${cy + 18}`, 'v-feed') + tx(cx + R + 14, cy + 4, `Vc ${vc}`, 'v-label');
      s += tx(250, 80, `S = Vc × 1000 / (π × Ø)`, 'v-label') + tx(250, 100, `S = ${S.toLocaleString('en')} rpm`, 'v-label-strong');
      s += tx(250, 140, `F = S × flutes × fz`, 'v-label') + tx(250, 160, `F = ${F.toLocaleString('en')} mm/min`, 'v-label-strong');
      return s + note(S > 24000 ? 'Over 24 000 rpm: most spindles cannot, lower Vc and keep fz' : 'Type S and F on the Tool page, or let the tool library fill them');
    },
  };

  specs['plunge-retract'] = {
    title: 'Plunge and retract rates',
    controls: [
      { type: 'range', key: 'p', label: 'Plunge rate', min: 10, max: 100, step: 5, unit: '% of feed' },
      { type: 'seg', key: 'r', label: 'Retract', options: [['rapid', 'Rapid (G0)'], ['feed', 'At retract rate']] },
    ],
    init: { p: 30, r: 'rapid' },
    draw({ p, r }) {
      let s = view('Side view: down into the cut, out again');
      s += rc(40, 150, 340, 60, 'v-hatch-fill');
      s += ln(120, 40, 120, 150, 'v-feed') + arrowHead(120, 150, Math.PI / 2, 'v-feed-fill', 8) + tx(110, 95, `plunge ${p}%`, 'v-label-strong', 'end');
      s += ln(120, 150, 300, 150, 'v-feed') + tx(210, 142, 'cut at 100%', 'v-label', 'middle');
      s += ln(300, 150, 300, 40, r === 'rapid' ? 'v-rapid' : 'v-feed') + arrowHead(300, 40, -Math.PI / 2, r === 'rapid' ? 'v-ink-fill' : 'v-feed-fill', 8);
      s += tx(310, 95, r === 'rapid' ? 'G0 out' : 'feed out', 'v-label');
      const tIn = (110 / ((p / 100) * 1000)) * 60;
      return s + note(`110 mm down at ${p}% of 1000 mm/min = ${r1(tIn)} s. End mills that cannot plunge need a ramp or helix instead.`);
    },
  };

  specs['spindle-dir'] = {
    title: 'Spindle direction',
    controls: [
      { type: 'seg', key: 'd', label: 'Spindle', options: [['cw', 'CW (M03)'], ['ccw', 'CCW (M04)']] },
      { type: 'seg', key: 't', label: 'Tool', options: [['rh', 'Right-hand cut'], ['lh', 'Left-hand cut']] },
    ],
    init: { d: 'cw', t: 'rh' },
    draw({ d, t }) {
      let s = view('Looking down on the tool');
      const cx = 140, cy = 125, R = 60, ok = (d === 'cw') === (t === 'rh');
      s += ci(cx, cy, R, ok ? 'v-tool' : 'v-tool-bad');
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2, k = t === 'rh' ? 1 : -1;
        s += pa(`M${cx},${cy} Q${cx + 40 * Math.cos(a + 0.6 * k)},${cy + 40 * Math.sin(a + 0.6 * k)} ${cx + R * Math.cos(a)},${cy + R * Math.sin(a)}`, 'v-ink-thin');
      }
      const sw = d === 'cw' ? 1 : 0, a0 = -2.3, a1 = 0.6, rr = R + 14;
      const p0 = [cx + rr * Math.cos(a0), cy + rr * Math.sin(a0)], p1 = [cx + rr * Math.cos(a1), cy + rr * Math.sin(a1)];
      s += d === 'cw' ? pa(`M${p0[0]},${p0[1]} A${rr},${rr} 0 0 1 ${p1[0]},${p1[1]}`, 'v-feed') + arrowHead(p1[0], p1[1], a1 + Math.PI / 2, 'v-feed-fill', 8)
        : pa(`M${p1[0]},${p1[1]} A${rr},${rr} 0 0 0 ${p0[0]},${p0[1]}`, 'v-feed') + arrowHead(p0[0], p0[1], a0 - Math.PI / 2, 'v-feed-fill', 8);
      s += tx(250, 100, d === 'cw' ? 'M03 — clockwise' : 'M04 — counter-clockwise', 'v-label-strong');
      s += tx(250, 122, ok ? 'Edges cut' : 'Edges rub backwards:', ok ? 'v-label' : 'v-label-bad') + (ok ? '' : tx(250, 140, 'burnt tool in seconds', 'v-label-bad'));
      void sw;
      return s + note('Almost every end mill and drill is right-hand: CW. M04 is for left-hand taps and tools.');
    },
  };

  specs['coolant'] = {
    title: 'Coolant choice',
    controls: [
      { type: 'seg', key: 'c', label: 'Coolant', options: [['flood', 'Flood'], ['thru', 'Through tool'], ['air', 'Air blast'], ['mist', 'Mist']] },
      { type: 'seg', key: 'm', label: 'Material', options: [['al', 'Aluminium'], ['st', 'Steel'], ['ti', 'Titanium']] },
    ],
    init: { c: 'flood', m: 'al' },
    draw({ c, m }) {
      let s = view('Side view in a deep pocket');
      s += pa('M40,90 H150 V210 H270 V90 H380 V230 H40Z', 'v-hatch-fill') + rc(200, 70, 20, 130, 'v-tool') + rc(186, 40, 48, 30, 'v-part');
      if (c === 'flood') s += pa('M80,40 Q150,60 196,150', 'v-feed') + pa('M340,40 Q270,60 224,150', 'v-feed');
      if (c === 'thru') s += ln(210, 45, 210, 195, 'v-feed') + pa('M210,200 L180,175 M210,200 L240,175', 'v-feed');
      if (c === 'air') s += pa('M80,40 Q150,60 196,150', 'v-rapid');
      if (c === 'mist') s += pa('M80,40 Q150,60 196,150', 'v-ink-thin');
      for (let i = 0; i < 6; i++) s += ci(165 + i * 18, 195 - (c === 'thru' || c === 'air' ? i * 14 : 0) - (i % 2) * 6, 3, 'v-num-a');
      const advice = {
        al: { flood: 'Good: cools and washes chips', thru: 'Best in deep pockets: blows chips up and out', air: 'OK for light cuts, chips welding is the risk', mist: 'Light cuts only' },
        st: { flood: 'Standard for steel', thru: 'Best for deep holes and pockets', air: 'With coated carbide in dry HSM: fine', mist: 'Light finishing' },
        ti: { flood: 'Minimum: titanium needs lots of coolant', thru: 'Best: keeps the edge cool, chips out', air: 'No: heat stays in the edge', mist: 'No: not enough cooling' },
      }[m][c];
      return s + note(advice);
    },
  };

  // ---------------------------------------------------------------- facing
  specs['face-approach'] = {
    title: 'Approach and exit distance',
    controls: [
      { type: 'range', key: 'a', label: 'Approach', min: 0, max: 100, step: 5, unit: '% Ø' },
      { type: 'range', key: 'e', label: 'Exit', min: 0, max: 100, step: 5, unit: '% Ø' },
    ],
    init: { a: 50, e: 50 },
    draw({ a, e }) {
      let s = view('Top view, one pass');
      const D = 80, x0 = 150, x1 = 290, y = 125;
      s += rc(x0, 60, x1 - x0, 130, 'v-stock-light');
      const sx = x0 - D / 2 - (a / 100) * D, ex = x1 + D / 2 + (e / 100) * D;
      s += ln(sx, y, ex, y, 'v-feed') + ci(sx, y, D / 2, 'v-tool-ghost') + ci(ex, y, D / 2, 'v-tool-ghost');
      s += tx(sx, y + D / 2 + 14, 'start', 'v-label', 'middle') + tx(ex, y + D / 2 + 14, 'end', 'v-label', 'middle');
      return s + note(a < 10 ? 'Starts touching the stock: the full edge hits the corner at once' : 'The tool is clear of the stock before it starts and after it ends');
    },
  };

  specs['face-method'] = {
    title: 'Climb or conventional facing',
    controls: [
      { type: 'seg', key: 'm', label: 'Method', options: [['climb', 'Climb'], ['conv', 'Conventional']] },
      { type: 'seg', key: 'r', label: 'Reverse last pass', options: [['on', 'On'], ['off', 'Off']] },
    ],
    init: { m: 'climb', r: 'on' },
    draw({ m, r }) {
      let s = view('Top view, One way, 3 passes');
      s += rc(80, 60, 260, 140, 'v-stock-light');
      const ys = [80, 130, 180];
      ys.forEach((y, i) => {
        const last = i === ys.length - 1;
        const rev = last && r === 'on' && m === 'conv';
        const toRight = (m === 'climb') !== rev;
        const x0 = toRight ? 40 : 380, x1 = toRight ? 380 : 40;
        s += ln(x0, y, x1, y, 'v-feed') + arrowHead(x1, y, toRight ? 0 : Math.PI, 'v-feed-fill', 8);
        const climb = toRight;
        s += tx(390 - 0, y - 6, climb ? 'climb' : 'conventional', climb ? 'v-label' : 'v-label-bad', 'end');
      });
      return s + note(m === 'conv' && r === 'on' ? 'Conventional passes, but the last one turns round to climb for the finish' : m === 'climb' ? 'Every pass climbs (spindle M03)' : 'All conventional: rougher finish on the last pass');
    },
  };

  specs['pass-angle'] = {
    title: 'Roughing angle',
    controls: [{ type: 'range', key: 'a', label: 'Angle', min: 0, max: 180, step: 5, unit: '°' }],
    init: { a: 0 },
    draw({ a }) {
      let s = view('Top view: a 160 × 90 plate');
      const cx = 210, cy = 125, w = 240, hh = 130;
      s += `<clipPath id="pa-clip"><rect x="${cx - w / 2}" y="${cy - hh / 2}" width="${w}" height="${hh}"/></clipPath>`;
      s += rc(cx - w / 2, cy - hh / 2, w, hh, 'v-stock-light');
      const t = (-a * Math.PI) / 180, dx = Math.cos(t), dy = Math.sin(t), step = 22;
      let g = '';
      for (let k = -8; k <= 8; k++) { const ox = -dy * k * step, oy = dx * k * step; g += ln(cx + ox - dx * 300, cy + oy - dy * 300, cx + ox + dx * 300, cy + oy + dy * 300, 'v-feed'); }
      s += `<g clip-path="url(#pa-clip)">${g}</g>`;
      const len = Math.abs(w * Math.cos(t)) + Math.abs(hh * Math.sin(t));
      return s + note(a % 180 === 0 ? 'Along the long side: fewest, longest passes (what Auto angle picks)' : `Passes at ${a}°: more short passes and more turnarounds`) + tx(20, H - 26, `≈ ${Math.round(len / 2)} mm per pass`, 'v-label');
    },
  };

  specs['depth-direction'] = {
    title: 'Depth cut direction',
    controls: [{ type: 'seg', key: 'd', label: 'Direction', options: [['down', 'Stepdown'], ['up', 'Stepup']] }],
    init: { d: 'up' },
    draw({ d }) {
      let s = view('Section: a T-slot cutter under a lip');
      s += pa('M40,60 H170 V150 H250 V60 H380 V100 H300 V200 H120 V100 H40Z', 'v-hatch-fill');
      s += rc(200, 40, 20, 120, 'v-tool') + rc(150, 160, 120, 22, d === 'down' ? 'v-tool' : 'v-tool');
      const levels = [190, 175, 160];
      const order = d === 'down' ? [...levels].reverse() : levels;
      order.forEach((y, i) => (s += ln(130, y, 290, y, 'v-feed') + tx(300, y + 4, String(i + 1), 'v-label-strong')));
      return s + note(d === 'up' ? 'Stepup: first cut at the bottom, the cutter is never buried under uncut lip' : 'Stepdown with an undercut tool: the top level is cut with material still below it');
    },
  };

  specs['subprogram'] = {
    title: 'Depth cuts as a subprogram',
    controls: [
      { type: 'seg', key: 'm', label: 'Subprogram', options: [['off', 'Off'], ['abs', 'Absolute'], ['inc', 'Incremental']] },
      { type: 'range', key: 'n', label: 'Depth cuts', min: 2, max: 12, step: 1, unit: '' },
    ],
    init: { m: 'inc', n: 4 },
    draw({ m, n }) {
      let s = view('What the post writes');
      const lines = m === 'off'
        ? [`(level 1 … ${n}: the whole path again each time)`, 'G1 Z-2. …  80 lines', 'G1 Z-4. …  80 lines', '…', `= ${n * 80} lines`]
        : m === 'abs'
          ? [`M98 P1001 (level 1)`, `M98 P1002 (level 2)`, '…', `${n} subprograms, one per depth`, `= ${n * 80 + n} lines`]
          : [`G91 G1 Z-2.`, `M98 P1001 L${n}`, 'O1001 (one level, incremental)', 'M99', `= ${80 + 6} lines`];
      lines.forEach((l, i) => (s += tx(40, 60 + i * 26, l, i === lines.length - 1 ? 'v-label-strong' : 'v-label-num')));
      const bar = (v) => rc(300, 190 - v, 50, v, 'v-sweep');
      s += bar(Math.min(150, (m === 'inc' ? 86 : n * 80) / 7)) + tx(325, 205, 'program size', 'v-label', 'middle');
      return s + note(m === 'inc' ? 'One level, called L times with an incremental Z step: shortest program' : m === 'abs' ? 'Absolute: one subprogram per level (safer to restart)' : 'No subprogram: every level written out');
    },
  };

  // ---------------------------------------------------------------- contour
  specs['optimize-comp'] = {
    title: 'Optimize cutter comp in control',
    controls: [
      { type: 'seg', key: 'o', label: 'Optimize', options: [['off', 'Off'], ['on', 'On']] },
      { type: 'range', key: 'r', label: 'Corner radius', min: 1, max: 10, step: 0.5, unit: ' mm' },
    ],
    init: { o: 'off', r: 3 },
    draw({ o, r }) {
      let s = view('Top view: Ø12 tool, control comp G41');
      const k = 8, x = 200, y = 80, R = r * k, tr = 6 * k;
      s += pa(`M60,${y} H${x - R} A${R},${R} 0 0 1 ${x},${y + R} V220`, 'v-chain');
      s += pa(`M${x - R},${y} A${R},${R} 0 0 1 ${x},${y + R}`, r < 6 && o === 'off' ? 'v-label-bad-fill' : 'v-feed');
      s += ci(x - tr, y + tr, tr, 'v-tool-ghost');
      const bad = r < 6 && o === 'off';
      s += tx(240, y + 10, bad ? `R${r} arc smaller than tool radius 6:` : r < 6 ? 'arc removed from the code' : 'arc bigger than the tool radius', bad ? 'v-label-bad' : 'v-label');
      if (bad) s += tx(240, y + 28, 'alarm "interference" in G41', 'v-label-bad');
      return s + note('The control cannot offset an inside arc smaller than the tool radius. Optimize drops it.');
    },
  };

  specs['oscillate'] = {
    title: 'Oscillate',
    controls: [
      { type: 'seg', key: 'm', label: 'Motion', options: [['lin', 'Linear'], ['hs', 'High speed']] },
      { type: 'range', key: 'a', label: 'Maximum depth', min: 1, max: 10, step: 0.5, unit: ' mm' },
      { type: 'range', key: 'd', label: 'Distance', min: 10, max: 80, step: 5, unit: ' mm' },
    ],
    init: { m: 'hs', a: 4, d: 30 },
    draw({ m, a, d }) {
      let s = view('Wall unrolled, side view');
      const y0 = 110, k = 8, x0 = 30, x1 = 400, px = d * 2.2;
      s += rc(x0, y0 - 40, x1 - x0, 120, 'v-stock-light') + ln(x0, y0, x1, y0, 'c-ref');
      const pts = [];
      for (let x = x0; x <= x1; x += 3) { const t = ((x - x0) % px) / px; const tri = t < 0.5 ? t * 2 : 2 - t * 2; const v = m === 'lin' ? tri : (1 - Math.cos(t * Math.PI * 2)) / 2; pts.push([x, y0 + v * a * k]); }
      s += pl(pts, 'v-feed') + ln(x0, y0 + a * k, x1, y0 + a * k, 'c-ref');
      s += tx(x0 + 4, y0 + a * k + 14, `${a} mm band of the flute used`, 'v-label');
      return s + note('The tool moves up and down as it goes, so wear spreads along the flute instead of one line');
    },
  };

  specs['gouge-check'] = {
    title: 'Gouge check on leads',
    controls: [
      { type: 'seg', key: 'g', label: 'Gouge check', options: [['on', 'On'], ['off', 'Off']] },
      { type: 'range', key: 'r', label: 'Lead arc radius', min: 5, max: 40, step: 1, unit: ' mm' },
    ],
    init: { g: 'on', r: 25 },
    draw({ g, r }) {
      let s = view('Top view: lead near an inside corner');
      const k = 3, y = 160, cx = 200;
      s += pa(`M40,${y} H300 V60 H380 V220 H40Z`, 'v-hatch-fill');
      const R = r * k, room = 300 - cx - 6;
      const rr = g === 'on' ? Math.min(R, room) : R;
      s += pa(`M${cx + rr},${y - rr} A${rr},${rr} 0 0 1 ${cx},${y}`, 'v-feed') + ln(cx, y, 60, y, 'v-feed');
      const hit = g === 'off' && R > room;
      if (hit) s += ci(300, y - rr * 0.5, 9, 'v-tool-bad') + tx(296, y - rr * 0.5 - 14, 'cuts the wall', 'v-label-bad', 'end');
      return s + note(g === 'on' ? (R > room ? 'The lead is shortened to fit in front of the wall' : 'Lead fits: nothing to change') : hit ? 'Off: the full lead arc runs into the next wall' : 'Off, but the lead fits anyway');
    },
  };

  specs['lead-ramp'] = {
    title: 'Ramp / helix height on the lead',
    controls: [
      { type: 'range', key: 'h', label: 'Height', min: 0, max: 10, step: 0.5, unit: ' mm' },
      { type: 'seg', key: 'f', label: 'Only first depth', options: [['on', 'On'], ['off', 'Off']] },
    ],
    init: { h: 3, f: 'on' },
    draw({ h, f }) {
      let s = view('Side view of the lead at each depth');
      const k = 8, x0 = 60, x1 = 180, levels = [80, 130, 180];
      s += rc(180, 50, 210, 150, 'v-stock-light');
      levels.forEach((y, i) => {
        const use = f === 'off' || i === 0;
        if (use) s += pa(`M${x0},${y - h * k} L${x1},${y}`, 'v-feed') + ln(x1, y, 390, y, 'v-feed');
        else s += ln(x1, y - 50 + 0, x1, y, 'v-feed') + ln(x1, y, 390, y, 'v-feed');
      });
      s += pa(`M${x0 - 12},${levels[0] - h * k} V${levels[0]}`, 'c-dim') + tx(x0 - 16, levels[0] - (h * k) / 2 + 4, `${h}`, 'v-label-strong', 'end');
      return s + note(f === 'on' ? 'Lead only on the first level; lower levels step straight down beside the wall' : 'Every level comes in with its own lead and ramp');
    },
  };

  specs['multi-order'] = {
    title: 'Multi pass order',
    controls: [
      { type: 'seg', key: 'o', label: 'Order', options: [['contour', 'By contour'], ['pass', 'By pass']] },
      { type: 'seg', key: 'f', label: 'Finish after all', options: [['off', 'Off'], ['on', 'On']] },
    ],
    init: { o: 'contour', f: 'off' },
    draw({ o, f }) {
      let s = view('Top view: two shapes, 2 rough + 1 finish pass each');
      const boss = (cx) => rc(cx - 40, 85, 80, 80, 'v-hatch-fill');
      s += boss(120) + boss(300);
      const ring = (cx, d, cls) => rc(cx - 40 - d, 85 - d, 80 + 2 * d, 80 + 2 * d, cls, 6);
      const steps = [];
      const rough = (cx) => [[cx, 30, 'R'], [cx, 18, 'R']], fin = (cx) => [[cx, 6, 'F']];
      if (f === 'on') steps.push(...rough(120), ...rough(300), ...fin(120), ...fin(300));
      else if (o === 'contour') steps.push(...rough(120), ...fin(120), ...rough(300), ...fin(300));
      else steps.push([120, 30, 'R'], [300, 30, 'R'], [120, 18, 'R'], [300, 18, 'R'], [120, 6, 'F'], [300, 6, 'F']);
      steps.forEach(([cx, d, t], i) => { s += ring(cx, d, t === 'F' ? 'v-finish' : 'v-feed'); s += tx(cx - 40 - d - 2, 85 - d - 3, String(i + 1), 'v-label-num', 'end'); });
      return s + note(f === 'on' ? 'Rough everything, then finish: the finish passes see a part that has stopped moving' : o === 'contour' ? 'One boss completely, then the next: less travel' : 'Pass 1 on both, pass 2 on both…');
    },
  };

  specs['tab-small'] = {
    title: 'Tabs only on small shapes',
    controls: [{ type: 'range', key: 'lim', label: 'Tabs on shapes under', min: 10, max: 120, step: 5, unit: ' mm' }],
    init: { lim: 50 },
    draw({ lim }) {
      let s = view('Top view: cut-outs nested in a sheet');
      s += rc(20, 40, 380, 180, 'v-stock-light');
      const shapes = [[40, 60, 120, 130], [190, 60, 40, 40], [190, 130, 60, 70], [270, 60, 110, 50], [280, 130, 30, 30], [330, 140, 50, 60]];
      for (const [x, y, w, hh] of shapes) {
        const size = Math.max(w, hh) / 1.2, tab = size < lim;
        s += rc(x, y, w, hh, 'v-chain');
        if (tab) s += rc(x + w / 2 - 4, y - 3, 8, 6, 'v-num-a') + rc(x + w / 2 - 4, y + hh - 3, 8, 6, 'v-num-a');
        s += tx(x + w / 2, y + hh / 2 + 4, `${Math.round(size)}`, tab ? 'v-label-strong' : 'v-label', 'middle');
      }
      return s + note('Big parts sit on their own weight; only the small ones need tabs to stop them flying');
    },
  };

  specs['tab-cutoff'] = {
    title: 'When the tabs are cut',
    controls: [{ type: 'seg', key: 'c', label: 'Cutoff', options: [['all', 'After all chains'], ['each', 'After each chain'], ['sep', 'Separate operation']] }],
    init: { c: 'sep' },
    draw({ c }) {
      let s = view('Order of work, three parts in a sheet');
      const steps = c === 'all' ? ['Cut part 1 (tabs left)', 'Cut part 2 (tabs left)', 'Cut part 3 (tabs left)', 'Cut all tabs'] : c === 'each' ? ['Cut part 1', 'Cut its tabs: part 1 free', 'Cut part 2 + its tabs', 'Cut part 3 + its tabs'] : ['Op 1: cut all parts (tabs left)', 'M00: stop — tape or screw the parts', 'Op 2: cut the tabs', ''];
      steps.forEach((t, i) => { if (!t) return; s += rc(40, 46 + i * 44, 22, 22, 'v-num-a', 11) + tx(51, 61 + i * 44, String(i + 1), 'v-label-strong', 'middle') + tx(74, 61 + i * 44, t, i === 1 && c === 'sep' ? 'v-label-bad' : 'v-label'); });
      return s + note(c === 'each' ? 'Parts come loose while the tool is still cutting next to them' : c === 'sep' ? 'Best: you secure the parts before the tabs go' : 'All tabs at the end, still no support');
    },
  };

  // ---------------------------------------------------------------- pocket
  specs['add-finish'] = {
    title: 'Additional finish operation',
    controls: [{ type: 'seg', key: 'a', label: 'Create it', options: [['off', 'Off'], ['on', 'On']] }],
    init: { a: 'on' },
    draw({ a }) {
      let s = view('Toolpaths Manager');
      const ops = a === 'on' ? [['1 - Pocket (Standard)', 'roughs, leaves 0.2 on the walls'], ['2 - Contour (2D)', 'made for you: finishes the walls'], ['3 - Drill', '']] : [['1 - Pocket (Standard)', 'roughs and finishes in one'], ['2 - Drill', '']];
      ops.forEach(([n, d], i) => (s += rc(40, 50 + i * 50, 340, 36, i === 1 && a === 'on' ? 'v-sweep' : 'v-stock-light', 4) + tx(54, 72 + i * 50, n, 'v-label-strong') + tx(370, 72 + i * 50, d, 'v-label', 'end')));
      return s + note(a === 'on' ? 'Finish is its own op: a different tool, or run it after the other pockets' : 'One op does both with the same tool');
    },
  };

  specs['spiral-in'] = {
    title: 'Spiral inside to outside',
    controls: [{ type: 'seg', key: 'd', label: 'Spiral', options: [['in', 'Outside → in'], ['out', 'Inside → out']] }],
    init: { d: 'out' },
    draw({ d }) {
      let s = view('Top view, spiral pocket');
      s += rc(80, 50, 260, 150, 'v-hatch-fill') + rc(90, 60, 240, 130, 'v-air-c');
      const rings = [10, 30, 50];
      const order = d === 'out' ? rings.slice().reverse() : rings;
      order.forEach((g, i) => (s += rc(90 + g, 60 + g, 240 - 2 * g, 130 - 2 * g, 'v-feed', 4) + tx(90 + g + 4, 60 + g + 12, String(i + 1), 'v-label-num')));
      s += ci(210, 125, 6, d === 'out' ? 'v-num-a' : 'v-air');
      return s + note(d === 'out' ? 'Starts in the middle (entry or pre-drill) and works out to the wall' : 'Default: walls first, the middle last, often a small island of air');
    },
  };

  specs['helix-dir'] = {
    title: 'Helix direction',
    controls: [{ type: 'seg', key: 'd', label: 'Direction', options: [['cw', 'CW'], ['ccw', 'CCW']] }],
    init: { d: 'ccw' },
    draw({ d }) {
      let s = view('Top view of the helix, spindle M03');
      const cx = 150, cy = 125, R = 60;
      s += ci(cx, cy, R + 22, 'v-air-c') + ci(cx, cy, R, 'c-ref');
      const p0 = [cx + R, cy], p1 = [cx, cy + (d === 'ccw' ? -R : R)];
      s += pa(`M${p0[0]},${p0[1]} A${R},${R} 0 0 ${d === 'cw' ? 1 : 0} ${p1[0]},${p1[1]}`, 'v-feed') + arrowHead(p1[0], p1[1], d === 'cw' ? Math.PI : Math.PI, 'v-feed-fill', 9);
      s += tx(260, 110, d === 'ccw' ? 'CCW in a hole = climb' : 'CW in a hole = conventional', d === 'ccw' ? 'v-label-strong' : 'v-label-bad');
      return s + note('Match the helix to the main cut so the tool does not switch from climb to conventional');
    },
  };

  specs['finish-outer'] = {
    title: 'Finish outer boundary',
    controls: [{ type: 'seg', key: 'o', label: 'Outer boundary', options: [['on', 'On'], ['off', 'Off']] }],
    init: { o: 'on' },
    draw({ o }) {
      let s = view('Top view: pocket with an island');
      s += rc(60, 50, 300, 160, 'v-hatch-fill') + rc(72, 62, 276, 136, 'v-air-c') + rc(170, 100, 80, 60, 'v-hatch-fill');
      s += rc(164, 94, 92, 72, 'v-finish', 4);
      if (o === 'on') s += rc(78, 68, 264, 124, 'v-finish', 4);
      else s += tx(210, 82, 'outer wall left as roughed', 'v-label-bad', 'middle');
      return s + note(o === 'on' ? 'Walls and island both finished' : 'Off: only the island gets a finish pass (e.g. the outer wall is done by another op)');
    },
  };

  // ---------------------------------------------------------------- dynamic
  specs['entry-chain'] = {
    title: 'Entry chain',
    controls: [{ type: 'seg', key: 'e', label: 'Entry', options: [['helix', 'Helix (no entry chain)'], ['pre', 'Entry chain = drilled hole']] }],
    init: { e: 'pre' },
    draw({ e }) {
      let s = view('Top view of a closed pocket');
      s += rc(70, 50, 280, 150, 'v-hatch-fill') + rc(80, 60, 260, 130, 'v-air-c');
      if (e === 'pre') s += ci(130, 125, 14, 'v-num-a') + tx(130, 160, 'Ø16 pre-drilled', 'v-label', 'middle') + ln(130, 30, 130, 125, 'v-rapid') + tx(140, 40, 'plunge in the hole', 'v-label');
      else s += pa('M210,125 m-24,0 a24,24 0 1 0 48,0 a24,24 0 1 0 -48,0', 'v-feed') + tx(210, 165, 'helix in solid material', 'v-label', 'middle');
      return s + note(e === 'pre' ? 'The tool goes straight down in the hole you drilled first: no helix, no chips trapped' : 'No entry chain: Mastercam picks a spot and helixes in');
    },
  };

  specs['rest-adjust'] = {
    title: 'Adjust remaining stock',
    controls: [{ type: 'range', key: 'a', label: 'Adjust by', min: -2, max: 2, step: 0.25, unit: ' mm' }],
    init: { a: 0.5 },
    draw({ a }) {
      let s = view('Top view: corner rest left by a Ø20 tool');
      s += rc(40, 40, 320, 20, 'v-hatch-fill') + rc(340, 40, 20, 180, 'v-hatch-fill');
      const R = 60, grow = a * 12;
      s += pa(`M${340 - R},60 A${R},${R} 0 0 0 340,${60 + R} V60Z`, 'v-stock');
      s += pa(`M${340 - R - grow},60 A${R + grow},${R + grow} 0 0 0 340,${60 + R + grow}`, a >= 0 ? 'v-feed' : 'v-label-bad-fill');
      return s + note(a > 0 ? 'Rest area grown: the next tool starts a little outside it, cleaner blend' : a < 0 ? 'Shrunk: the next tool may leave a step against the old cut' : 'As computed');
    },
  };

  specs['dyn-keep-down'] = {
    title: 'Keep tool down within',
    controls: [{ type: 'range', key: 'k', label: 'Keep down within', min: 0, max: 300, step: 10, unit: '% Ø' }],
    init: { k: 100 },
    draw({ k }) {
      let s = view('Top view: moves between dynamic cuts (Ø10 tool)');
      s += rc(40, 60, 340, 130, 'v-stock-light');
      const moves = [[60, 90, 20], [120, 150, 60], [200, 100, 140], [330, 160, 250]];
      moves.forEach(([x, y, len]) => {
        const stay = len <= k;
        s += ln(x, y, Math.min(390, x + len * 0.25), y, stay ? 'v-feed' : 'v-rapid');
        s += tx(x, y - 6, `${len}%${stay ? ' stays down' : ' lifts'}`, stay ? 'v-label' : 'v-label-bad');
      });
      return s + note('Short moves stay down with a micro lift; longer ones retract and rapid');
    },
  };

  specs['first-pass'] = {
    title: 'Approach distance and first pass',
    controls: [
      { type: 'range', key: 'o', label: 'First pass offset', min: 0, max: 3, step: 0.25, unit: ' mm' },
      { type: 'range', key: 'f', label: 'First pass feed', min: 30, max: 100, step: 5, unit: '%' },
    ],
    init: { o: 1, f: 60 },
    draw({ o, f }) {
      let s = view('Side view: saw-cut bar, uneven edge');
      const pts = [];
      for (let x = 40; x <= 380; x += 10) pts.push([x, 80 + Math.sin(x / 23) * 8 + Math.sin(x / 7) * 3]);
      s += pa(`M40,200 L${pts.map((p) => p.join(',')).join(' L')} L380,200Z`, 'v-stock-light');
      const y = 80 + o * 14;
      s += ln(40, y, 380, y, 'v-feed') + tx(44, y - 6, `first pass ${f}% feed`, 'v-label');
      for (let i = 1; i < 4; i++) s += ln(40, y + i * 28, 380, y + i * 28, 'v-feed');
      return s + note(o ? 'First pass sits below the worst of the saw marks and runs slower' : 'No offset: the first pass sees the uneven edge at full feed');
    },
  };

  specs['feed-override'] = {
    title: 'Feed and speed override',
    controls: [
      { type: 'range', key: 'f', label: 'Feed override', min: 20, max: 150, step: 5, unit: '%' },
      { type: 'range', key: 's', label: 'Speed override', min: 50, max: 150, step: 5, unit: '%' },
    ],
    init: { f: 60, s: 100 },
    draw({ f, s: sp }) {
      let s = view('Main cut 4000 mm/min, 12 000 rpm');
      const F = Math.round(4000 * f / 100), S = Math.round(12000 * sp / 100), fz = F / (S * 3);
      s += rc(60, 70, 300, 24, 'v-stock-light') + rc(60, 70, Math.min(300, (F / 6000) * 300), 24, 'v-sweep') + tx(60, 64, `Feed ${F} mm/min`, 'v-label-strong');
      s += rc(60, 130, 300, 24, 'v-stock-light') + rc(60, 130, Math.min(300, (S / 18000) * 300), 24, 'v-sweep') + tx(60, 124, `Speed ${S} rpm`, 'v-label-strong');
      s += tx(60, 190, `Chip per tooth ≈ ${fz.toFixed(3)} mm (3 flutes)`, fz < 0.03 ? 'v-label-bad' : 'v-label-strong');
      return s + note(fz < 0.03 ? 'Chip too thin: the edge rubs. Drop the speed with the feed.' : 'Lower feed for the heavier engagement, same chip load idea');
    },
  };

  specs['skip-pockets'] = {
    title: 'Skip pockets smaller than',
    controls: [{ type: 'range', key: 'p', label: 'Smaller than', min: 100, max: 400, step: 10, unit: '% Ø' }],
    init: { p: 200 },
    draw({ p }) {
      let s = view('Top view: Ø10 tool, closed areas of several sizes');
      s += rc(30, 40, 360, 160, 'v-hatch-fill');
      const sizes = [120, 180, 250, 320, 450];
      let x = 50;
      sizes.forEach((sz) => {
        const w = sz / 5.2, skip = sz < p;
        s += rc(x, 115 - w / 2, w, w, skip ? 'v-stock' : 'v-air-c', 3);
        s += tx(x + w / 2, 115 + w / 2 + 14, `${sz}%`, skip ? 'v-label-bad' : 'v-label', 'middle');
        if (!skip) s += ci(x + w / 2, 115, Math.min(w / 2 - 3, 10), 'v-tool-ghost');
        x += w + 12;
      });
      return s + note('Skipped areas stay full of material: cut them with a smaller tool or a drill');
    },
  };

  // ---------------------------------------------------------------- holes
  specs['hole-select'] = {
    title: 'Picking holes (Hole Definition)',
    controls: [{ type: 'seg', key: 'm', label: 'Pick with', options: [['click', 'Click'], ['dbl', 'Double-click'], ['ctrl', 'Ctrl+click']] }],
    init: { m: 'dbl' },
    draw({ m }) {
      let s = view('Section through three counterbored holes');
      s += rc(30, 80, 360, 120, 'v-hatch-fill');
      const holes = [90, 210, 330];
      holes.forEach((x, i) => {
        const cb = rc(x - 22, 80, 44, 30, 'v-air'), th = rc(x - 11, 110, 22, 90, 'v-air');
        s += cb + th;
        const picked = m === 'ctrl' ? 'both' : i === 0 ? (m === 'click' ? 'cb' : 'both') : '';
        if (picked === 'cb' || picked === 'both') s += rc(x - 22, 80, 44, 30, 'v-sweep');
        if (picked === 'both') s += rc(x - 11, 110, 22, 90, 'v-sweep');
      });
      s += ln(90, 50, 90, 76, 'v-ink') + arrowHead(90, 78, Math.PI / 2, 'v-ink-fill', 7) + tx(98, 56, m === 'ctrl' ? 'Ctrl+click' : m === 'dbl' ? 'double-click' : 'click', 'v-label-strong');
      return s + note({ click: 'One segment: only the counterbore', dbl: 'The whole hole: counterbore and through hole', ctrl: 'Every hole of that kind on the body' }[m]);
    },
  };

  specs['dwell'] = {
    title: 'Dwell at the bottom',
    controls: [{ type: 'range', key: 'd', label: 'Dwell', min: 0, max: 2, step: 0.1, unit: ' s' }],
    init: { d: 0.5 },
    draw({ d }) {
      let s = view('Z over time, G82 counterbore');
      const x0 = 40, top = 60, bot = 180, k = 60;
      s += ln(x0, 40, x0, 200, 'c-ref') + ln(x0, 200, 400, 200, 'c-ref') + tx(x0 + 4, 214, 'time →', 'v-label');
      const a = x0 + 30, b = a + 100, c = b + d * k, e = c + 20;
      s += pa(`M${x0},${top} H${a}`, 'v-rapid') + pa(`M${a},${top} L${b},${bot} H${c}`, 'v-feed') + pa(`M${c},${bot} L${e},${top}`, 'v-rapid');
      if (d) s += pa(`M${b},${bot + 10} H${c}`, 'c-dim') + tx((b + c) / 2, bot + 24, `P${Math.round(d * 1000)} = ${d} s`, 'v-label-strong', 'middle');
      return s + note(d ? 'A few spindle turns at the bottom clean the flat floor of a counterbore or spot' : 'No dwell: the floor keeps a small spiral mark');
    },
  };

  specs['circle-dia'] = {
    title: 'Circle diameter and override',
    controls: [
      { type: 'seg', key: 'g', label: 'Picked', options: [['pt', 'Point'], ['arc', 'Arc Ø20'], ['ovr', 'Arc + override']] },
      { type: 'range', key: 'd', label: 'Typed diameter', min: 10, max: 40, step: 0.5, unit: ' mm' },
    ],
    init: { g: 'ovr', d: 22 },
    draw({ g, d }) {
      let s = view('Top view');
      const cx = 160, cy = 125, k = 4;
      if (g !== 'pt') s += ci(cx, cy, 10 * k, 'v-chain');
      s += ci(cx, cy, 2.5, 'c-pt');
      const used = g === 'arc' ? 20 : d;
      s += ci(cx, cy, (used / 2) * k, 'v-feed');
      s += tx(270, 110, `Cut size: Ø${used}`, 'v-label-strong') + tx(270, 130, g === 'pt' ? 'from the typed diameter' : g === 'arc' ? 'from the arc (typed value ignored)' : 'typed value wins over the arc', 'v-label');
      return s + note('Override geometry diameter (2020+) lets you cut Ø22 from a Ø20 hole in the model');
    },
  };

  specs['helix-final'] = {
    title: 'Feed rate at final depth',
    controls: [{ type: 'range', key: 'f', label: 'Final depth feed', min: 10, max: 100, step: 5, unit: '%' }],
    init: { f: 30 },
    draw({ f }) {
      let s = view('Side view of a helix bore');
      const cx = 210, top = 50, bot = 190, R = 80, turns = 4;
      s += rc(cx - R - 40, top, 40, bot - top + 20, 'v-hatch-fill') + rc(cx + R, top, 40, bot - top + 20, 'v-hatch-fill');
      const pts = [];
      for (let t = 0; t <= turns; t += 0.02) pts.push([cx + R * Math.cos(t * Math.PI * 2) * 0.95, top + ((bot - top) * t) / turns]);
      s += pl(pts, 'v-feed') + ln(cx - R * 0.95, bot, cx + R * 0.95, bot, 'v-finish');
      s += tx(cx, bot + 18, `flat turn at ${f}% feed`, 'v-label-strong', 'middle');
      return s + note('On the flat turn the whole tool bottom cuts: slow it down so the floor is clean and the tool not overloaded');
    },
  };

  specs['helix-finish'] = {
    title: 'Rough and finish helix',
    controls: [
      { type: 'range', key: 'rp', label: 'Rough pitch', min: 1, max: 6, step: 0.5, unit: ' mm' },
      { type: 'range', key: 'fp', label: 'Finish pitch', min: 0.5, max: 4, step: 0.25, unit: ' mm' },
      { type: 'seg', key: 'up', label: 'Finish', options: [['down', 'Helix down'], ['up', 'Helix up']] },
    ],
    init: { rp: 3, fp: 1, up: 'up' },
    draw({ rp, fp, up }) {
      let s = view('Unrolled wall: each line is one turn');
      const top = 50, bot = 200, k = 6;
      s += rc(30, top, 170, bot - top, 'v-stock-light') + rc(220, top, 170, bot - top, 'v-stock-light');
      for (let y = top; y <= bot; y += rp * k) s += ln(30, y, 200, Math.min(bot, y + rp * k), 'v-feed');
      for (let y = top; y <= bot; y += fp * k) s += ln(220, Math.min(bot, y + fp * k), 390, y, 'v-finish');
      s += tx(115, 40, `rough ${Math.ceil(25 / rp)} turns`, 'v-label', 'middle') + tx(305, 40, `finish ${Math.ceil(25 / fp)} turns ${up === 'up' ? '↑' : '↓'}`, 'v-label', 'middle');
      return s + note(up === 'up' ? 'Finishing upwards: the tool climbs out and chips fall away from the finished wall' : 'Finishing downwards: same direction as the roughing');
    },
  };

  specs['thread-allow'] = {
    title: 'Allowance, start angle and taper',
    controls: [
      { type: 'range', key: 'o', label: 'Allowance (overcut)', min: 0, max: 0.2, step: 0.01, unit: ' mm' },
      { type: 'range', key: 'a', label: 'Start angle', min: 0, max: 359, step: 15, unit: '°' },
      { type: 'range', key: 't', label: 'Taper angle', min: 0, max: 3, step: 0.25, unit: '°' },
    ],
    init: { o: 0.05, a: 90, t: 0 },
    draw({ o, a, t }) {
      let s = view('Top view (left) and section (right)');
      const cx = 110, cy = 125, R = 70, k = 400;
      s += ci(cx, cy, R, 'c-ref') + ci(cx, cy, R + o * k * 0.5, 'v-feed');
      const ar = (-a * Math.PI) / 180;
      s += ci(cx + R * Math.cos(ar), cy + R * Math.sin(ar), 6, 'v-num-a') + tx(cx, cy + 4, `start ${a}°`, 'v-label', 'middle');
      const sx = 300, tt = Math.tan((t * Math.PI) / 180) * 120 * 6;
      s += pa(`M${sx - 50},60 L${sx - 50 + tt},190`, 'v-chain') + pa(`M${sx + 50},60 L${sx + 50 - tt},190`, 'v-chain');
      s += tx(sx, 210, t ? `${t}° per side (NPT 1.79°)` : 'straight thread', 'v-label', 'middle');
      return s + note(o ? `+${o} mm radial: opens the thread if the gauge is tight` : 'No overcut: size exactly from the tool');
    },
  };

  specs['thread-gradual'] = {
    title: 'Gradual lead in',
    controls: [{ type: 'range', key: 'e', label: 'Engagement at start', min: 10, max: 100, step: 5, unit: '%' }],
    init: { e: 50 },
    draw({ e }) {
      let s = view('Thread depth during the first half turn');
      const x0 = 50, x1 = 380, yb = 190, yt = 70;
      s += ln(x0, yb, x1, yb, 'c-ref') + ln(x0, yt, x1, yt, 'c-dim') + tx(x0 - 4, yt + 4, 'full', 'v-label', 'end');
      const ye = yb - (yb - yt) * (e / 100);
      s += pa(`M${x0},${yb} L${x0 + 20},${ye} L${(x0 + x1) / 2},${yt} L${x1},${yt}`, 'v-feed');
      s += tx(x0 + 22, ye - 6, `${e}%`, 'v-label-strong') + tx((x0 + x1) / 4 + 30, yb + 16, '180° to full depth', 'v-label', 'middle');
      return s + note(e > 70 ? 'Hard entry: the full profile bites at once' : 'The thread profile builds up over half a turn: gentler on small thread mills');
    },
  };

  specs['thread-start'] = {
    title: 'Start at center or plunge outside',
    controls: [{ type: 'seg', key: 'm', label: 'Thread', options: [['id', 'ID: start at center'], ['od', 'OD: plunge after first move']] }],
    init: { m: 'od' },
    draw({ m }) {
      let s = view('Top view');
      const cx = 200, cy = 125;
      if (m === 'id') {
        s += rc(60, 40, 300, 180, 'v-hatch-fill') + ci(cx, cy, 70, 'v-air');
        s += ci(cx, cy, 4, 'c-pt') + pa(`M${cx},${cy} A35,35 0 0 1 ${cx + 70 - 10},${cy}`, 'v-feed') + tx(cx, cy + 20, 'down at centre, arc out', 'v-label', 'middle');
      } else {
        s += ci(cx, cy, 60, 'v-hatch-fill');
        s += ln(cx + 130, cy - 80, cx + 90, cy, 'v-rapid') + ci(cx + 90, cy, 8, 'v-num-a') + pa(`M${cx + 90},${cy} A30,30 0 0 0 ${cx + 60 + 8},${cy - 10}`, 'v-feed');
        s += tx(cx, cy + 86, 'moves out first, then down', 'v-label', 'middle');
      }
      return s + note(m === 'id' ? 'ID threads: plunge in the hole centre, lead out to the wall' : 'OD threads on a boss: plunging at the centre would hit the boss');
    },
  };

  for (const k of Object.keys(specs)) if (!before.has(k)) { const d = specs[k].draw; specs[k].draw = (v) => hatch + d(v); }
}
