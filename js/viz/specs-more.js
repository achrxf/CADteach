// More parameter visuals (added in v1.1). Registered into the main spec table
// by param-viz.js, using the same SVG helpers and CSS classes.

export function addSpecs(specs, h) {
  const { W, H, ln, pl, ci, rc, tx, pa, arrowHead, hatch, fmt, TOOL_D } = h;
  const rr = (x, y, w, hh, r, c) => rc(x, y, w, hh, c, Math.max(0, Math.min(r, w / 2, hh / 2)));
  const roundedRectPath = (x, y, w, hh, r) => {
    r = Math.max(0, Math.min(r, w / 2, hh / 2));
    return `M${x + r},${y} H${x + w - r} A${r},${r} 0 0 1 ${x + w},${y + r} V${y + hh - r} A${r},${r} 0 0 1 ${x + w - r},${y + hh} H${x + r} A${r},${r} 0 0 1 ${x},${y + hh - r} V${y + r} A${r},${r} 0 0 1 ${x + r},${y}Z`;
  };
  const view = (s) => tx(W - 10, 16, s, 'v-label', 'end');

  // -------------------------------------------------------------------------
  specs['contour-type'] = {
    title: 'Contour types',
    controls: [{ type: 'seg', key: 't', label: 'Type', options: [['2d', '2D'], ['chamfer', '2D chamfer'], ['ramp', 'Ramp'], ['remach', 'Remachining'], ['osc', 'Oscillate']] }],
    init: { t: '2d' },
    draw({ t }) {
      let s = hatch;
      if (t === 'chamfer') {
        const ex = 230, ey = 70, w = 34;
        s += view('Section through the edge');
        s += pa(`M20,${ey} H${ex - w} L${ex},${ey + w} V${H - 10} H20Z`, 'v-hatch-fill');
        const tipX = ex + 20, tipY = ey + w + 20;
        s += pa(`M${tipX},${tipY} L${tipX - 80},${tipY - 80} V${tipY - 120} H${tipX + 80} V${tipY - 80}Z`, 'v-tool-ghost');
        s += ln(ex - w, ey, ex, ey + w, 'v-engage');
        s += tx(ex - w - 6, ey - 8, 'chamfer', 'v-label-strong', 'end');
        return s + tx(30, H - 18, 'Part', 'v-label-strong');
      }
      if (t === 'remach') {
        s += view('Top view of an inside corner');
        s += rc(0, 0, W, 50, 'v-hatch-fill') + rc(330, 0, 90, H, 'v-hatch-fill');
        const R1 = 60, R2 = 18;
        s += ci(330 - R1, 50 + R1, R1, 'v-tool-ghost') + tx(330 - R1, 50 + R1 + 4, 'previous tool', 'v-label', 'middle');
        s += pa(`M330,50 L${330 - R1},50 A${R1},${R1} 0 0 1 330,${50 + R1}Z`, 'v-stock');
        s += pa(`M${330 - R1 - 10},${50 + R2} H${330 - R2} V${50 + R1 + 10}`, 'v-feed');
        s += ci(330 - R2, 50 + R2, R2, 'v-tool');
        return s + tx(334, H - 14, 'Part', 'v-label-strong');
      }
      // Front views of the wall
      s += view('Front view of the wall');
      const x0 = 40, x1 = 380, top = 60, bot = 200;
      s += rc(x0, top, x1 - x0, bot - top, 'v-stock-light');
      s += ln(x0, top, x1, top, 'v-plane v-plane-t') + ln(x0, bot, x1, bot, 'v-plane v-plane-d');
      s += tx(x0 - 4, top + 4, 'top', 'v-label-plane', 'end') + tx(x0 - 4, bot + 4, 'depth', 'v-label-plane', 'end');
      if (t === '2d') {
        [1, 2, 3].forEach((i) => { const y = top + ((bot - top) * i) / 3; s += ln(x0, y, x1, y, 'v-feed'); });
      } else if (t === 'ramp') {
        const laps = 3;
        const pts = [];
        for (let i = 0; i < laps; i++) pts.push([x0, top + ((bot - top) * i) / laps], [x1, top + ((bot - top) * (i + 1)) / laps]);
        for (let i = 0; i < laps; i++) s += ln(pts[i * 2][0], pts[i * 2][1], pts[i * 2 + 1][0], pts[i * 2 + 1][1], 'v-feed');
        s += ln(x0, bot - 1, x1, bot - 1, 'v-finish');
        s += tx(x1, top - 8, 'each diagonal = one lap around the chain', 'v-label', 'end');
      } else if (t === 'osc') {
        const pts = [];
        for (let x = x0; x <= x1; x += 4) pts.push([x, bot - 30 + 30 * Math.abs(((x - x0) / 60) % 2 - 1)]);
        s += pl(pts, 'v-feed');
        s += ln(x0, bot - 30, x1, bot - 30, 'v-ink-faint');
      }
      return s;
    },
    caption({ t }) {
      return {
        '2d': '<b>2D:</b> the tool follows the chain at each depth level. The normal choice for walls and profiles.',
        chamfer: '<b>2D chamfer:</b> a chamfer mill cuts the edge (amber). Bottom offset pushes the tip below the chamfer so the flank does the cutting, not the weak tip.',
        ramp: '<b>Ramp:</b> the tool descends continuously around the chain — no step marks between levels. The green line is the final flat pass that cleans the ramp.',
        remach: '<b>Remachining:</b> only cuts the material a bigger previous tool could not reach (amber corner).',
        osc: '<b>Oscillate:</b> the tool moves up and down while it travels, spreading wear along the flute instead of one spot. Used for long deburr and chamfer cuts.',
      }[t];
    },
  };

  // -------------------------------------------------------------------------
  specs['pocket-type'] = {
    title: 'Pocket types (top view)',
    controls: [{ type: 'seg', key: 't', label: 'Type', options: [['std', 'Standard'], ['face', 'Facing'], ['island', 'Island facing'], ['remach', 'Remachining'], ['open', 'Open']] }],
    init: { t: 'std' },
    draw({ t }) {
      const x = 60, y = 40, w = 300, hh = 170, icx = 250, icy = 125, ir = 26;
      let s = hatch + rc(0, 0, W, H, 'v-hatch-fill');
      const open = t === 'open';
      s += pa(open ? `M${x + w},${y} H${x} V${y + hh} H${x + w}` : roundedRectPath(x, y, w, hh, 10), 'v-air');
      s += rc(open ? x : x, y, open ? W - x : w, hh, 'v-air');
      if (open) s += ln(x + w, y, x + w, y + hh, 'v-chain') + tx(x + w + 6, y + hh / 2, 'open side', 'v-label');
      const island = t !== 'face';
      if (island) s += ci(icx, icy, ir, 'v-hatch-fill') + ci(icx, icy, ir, 'v-chain');
      if (t === 'std' || t === 'island' || t === 'open') {
        s += `<mask id="pk-mask"><rect width="${W}" height="${H}" fill="#fff"/><circle cx="${icx}" cy="${icy}" r="${ir + 36}" fill="#000"/></mask><g mask="url(#pk-mask)">`;
        for (let o = 12; o < 70; o += 16) s += pa(roundedRectPath(x + o, y + o, (open ? w + 60 : w) - 2 * o, hh - 2 * o, 8), 'v-feed');
        s += '</g>';
        for (let o = 12; o < 40; o += 14) s += ci(icx, icy, ir + o, 'v-feed');
      }
      if (t === 'island') { for (let yy = icy - ir + 6; yy < icy + ir; yy += 9) { const dx = Math.sqrt(Math.max(0, ir * ir - (yy - icy) ** 2)); s += ln(icx - dx - 6, yy, icx + dx + 6, yy, 'v-rapid-solid'); } }
      if (t === 'face') { for (let yy = y - 6; yy <= y + hh + 6; yy += 16) s += ln(x - 16, yy, x + w + 16, yy, 'v-feed'); }
      if (t === 'remach') {
        const R = 24;
        [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + hh, 1, -1], [x + w, y + hh, -1, -1]].forEach(([cx, cy, sx, sy]) => {
          s += pa(`M${cx},${cy} h${sx * R} a${R},${R} 0 0 ${sx * sy > 0 ? 0 : 1} ${-sx * R},${sy * R}Z`, 'v-stock');
          s += pa(`M${cx + sx * 6},${cy + sy * 28} V${cy + sy * 6} H${cx + sx * 28}`, 'v-feed');
        });
      }
      return s;
    },
    caption({ t }) {
      return {
        std: '<b>Standard:</b> clears inside the boundary and around islands. The normal choice.',
        face: '<b>Facing:</b> faces the whole area and can run past the boundary (overlap). No walls are kept.',
        island: '<b>Island facing:</b> like Standard, and also faces the tops of the islands (amber) when they are lower than the stock.',
        remach: '<b>Remachining:</b> only the material a previous bigger tool left — mostly the corners (amber).',
        open: '<b>Open:</b> the boundary chain is open; the tool runs out past the open side instead of keeping a wall there.',
      }[t];
    },
  };

  // -------------------------------------------------------------------------
  const methods = [
    ['zigzag', 'Zigzag'], ['cos', 'Constant overlap spiral'], ['ps', 'Parallel spiral'], ['psc', 'Parallel spiral clean corners'],
    ['morph', 'Morph spiral'], ['hs', 'High speed'], ['oneway', 'One way'], ['true', 'True spiral'],
  ];
  specs['cutting-method'] = {
    title: 'Pocket cutting methods (top view)',
    controls: [{ type: 'seg', key: 'm', label: 'Method', options: methods }],
    init: { m: 'hs' },
    draw({ m }) {
      const x = 40, y = 30, w = 340, hh = 190, inset = 14, step = 22;
      let s = hatch + rc(0, 0, W, H, 'v-hatch-fill') + rr(x, y, w, hh, 8, 'v-air');
      const X0 = x + inset, X1 = x + w - inset, Y0 = y + inset, Y1 = y + hh - inset;
      if (m === 'zigzag' || m === 'oneway') {
        let left = true;
        const ys = [];
        for (let yy = Y0; yy <= Y1 + 0.1; yy += step) ys.push(yy);
        ys.forEach((yy, i) => {
          const a = m === 'oneway' || left ? X0 : X1, b = m === 'oneway' || left ? X1 : X0;
          s += ln(a, yy, b, yy, 'v-feed') + arrowHead(b, yy, b > a ? 0 : Math.PI, 'v-feed-fill', 6);
          if (i < ys.length - 1) s += m === 'oneway' ? ln(b, yy, a, ys[i + 1], 'v-rapid') : ln(b, yy, b, ys[i + 1], 'v-feed');
          left = !left;
        });
        s += pa(roundedRectPath(X0, Y0, X1 - X0, Y1 - Y0, 2), 'v-feed');
        return s;
      }
      if (m === 'true') {
        const pts = [];
        const cx = x + w / 2, cy = y + hh / 2, ax = (w / 2 - inset), ay = (hh / 2 - inset);
        const turns = 4;
        for (let a = 0; a <= turns * Math.PI * 2; a += 0.05) {
          const f = a / (turns * Math.PI * 2);
          const c = Math.cos(a), sn = Math.sin(a), n = 6;
          const r = 1 / Math.pow(Math.pow(Math.abs(c), n) + Math.pow(Math.abs(sn), n), 1 / n);
          pts.push([cx + ax * f * r * c, cy + ay * f * r * sn]);
        }
        return s + pl(pts, 'v-feed');
      }
      // offset based
      const offs = [];
      for (let o = 0; o < hh / 2 - inset; o += step) offs.push(o);
      offs.forEach((o, i) => {
        const ox = X0 + o, oy = Y0 + o, ow = X1 - X0 - 2 * o, oh = Y1 - Y0 - 2 * o;
        if (oh <= 2) return;
        let r = 1;
        if (m === 'cos' || m === 'hs') r = 6 + o * 0.6;
        if (m === 'morph') r = (i / offs.length) * (oh / 2) + 2;
        s += pa(roundedRectPath(ox, oy, ow, oh, r), 'v-feed');
        if (m === 'psc' && i === 0) {
          [[ox, oy, 1, 1], [ox + ow, oy, -1, 1], [ox, oy + oh, 1, -1], [ox + ow, oy + oh, -1, -1]].forEach(([cx, cy, sx, sy]) => (s += ci(cx + sx * 7, cy + sy * 7, 6, 'v-feed-c')));
        }
        if (i > 0 && m !== 'hs') s += ln(ox - step, oy + oh / 2, ox, oy + oh / 2, 'v-feed');
        if (i > 0 && m === 'hs') s += pa(`M${ox - step},${oy + oh / 2 + 14} C${ox - step - 10},${oy + oh / 2 - 6} ${ox + 6},${oy + oh / 2 - 10} ${ox},${oy + oh / 2}`, 'v-feed');
      });
      return s;
    },
    caption({ m }) {
      return {
        zigzag: '<b>Zigzag:</b> back and forth, then a cleanup pass around the walls. Fast and short, but every other pass is conventional and the turns are full width.',
        cos: '<b>Constant overlap spiral:</b> offsets that keep the same overlap everywhere, with rounded corners. Steady load.',
        ps: '<b>Parallel spiral:</b> straight offsets of the boundary. Simple, but corners can leave small bits of material.',
        psc: '<b>Parallel spiral, clean corners:</b> parallel spiral plus small extra moves (circles) that remove the material left in the corners.',
        morph: '<b>Morph spiral:</b> the passes change shape gradually from the middle out to the boundary. Smooth on irregular pockets.',
        hs: '<b>High speed (default):</b> offsets with rounded corners and smooth looped links between them — the machine keeps its feed.',
        oneway: '<b>One way:</b> every pass in the same direction with a rapid back (amber). Always climb, good floor, slower.',
        true: '<b>True spiral:</b> one continuous spiral with no step-over moves at all. The smoothest motion.',
      }[m];
    },
  };

  // -------------------------------------------------------------------------
  specs['depth-order'] = {
    title: 'Depth cut order with two pockets',
    controls: [{ type: 'seg', key: 'o', label: 'Order', options: [['contour', 'By contour'], ['depth', 'By depth']] }],
    init: { o: 'contour' },
    draw({ o }) {
      let s = hatch + view('Section') + rc(20, 50, 380, 170, 'v-hatch-fill');
      const pk = [[70, 130], [250, 130]], top = 50, levels = 3, lh = 40;
      pk.forEach(([px, pw]) => (s += rc(px, top, pw - 30, levels * lh, 'v-air')));
      s += tx(205, 100, 'thin web', 'v-label-strong', 'middle');
      for (let p = 0; p < 2; p++) for (let l = 0; l < levels; l++) {
        const n = o === 'contour' ? p * levels + l + 1 : l * 2 + p + 1;
        const cx = pk[p][0] + (pk[p][1] - 30) / 2, cy = top + l * lh + lh / 2;
        s += ci(cx, cy, 12, n <= 3 ? 'v-num-a' : 'v-num-b') + tx(cx, cy + 4, String(n), 'v-label-strong', 'middle');
      }
      return s;
    },
    caption({ o }) {
      return o === 'contour'
        ? '<b>By contour:</b> pocket 1 goes to full depth (1–3), then pocket 2 (4–6). Less travel, but the web is tall and unsupported while pocket 2 is cut.'
        : '<b>By depth:</b> level 1 in both pockets, then level 2, then 3. The web loses height evenly on both sides and stays stiff.';
    },
  };

  // -------------------------------------------------------------------------
  specs['dynamic-loop'] = {
    title: 'Dynamic motion (top view)',
    controls: [
      { type: 'range', key: 'so', label: 'Stepover', min: 5, max: 40, step: 1, unit: '% Ø' },
      { type: 'range', key: 'rad', label: 'Loop radius', min: 0, max: 50, step: 5, unit: '% Ø' },
    ],
    init: { so: 15, rad: 10 },
    draw({ so, rad }) {
      const D = 90, R = D / 2, adv = Math.max(3, (so / 100) * D);
      const wallY = 54;
      const r = Math.max(14, R * 0.5 + (rad / 100) * D * 0.6); // loop radius of the tool center
      const cy = wallY + R + r - 4;
      let s = hatch + rc(0, 0, W, wallY, 'v-hatch-fill') + tx(12, 20, 'Material', 'v-label-strong');
      const N = Math.min(8, Math.ceil(300 / adv));
      const x0 = 70;
      const cut = [], back = [];
      for (let t = 0; t <= N * Math.PI * 2; t += 0.08) {
        const x = x0 + (adv * t) / (Math.PI * 2) + r * Math.cos(t + Math.PI / 2);
        const y = cy - r * Math.sin(t + Math.PI / 2);
        const sn = Math.sin(t + Math.PI / 2);
        (sn > 0 ? cut : back).push([x, y, Math.floor(t / (Math.PI * 2) + (sn > 0 ? 0.25 : 0.75))]);
      }
      const group = (arr) => { const g = {}; arr.forEach(([x, y, i]) => (g[i] ||= []).push([x, y])); return Object.values(g); };
      group(back).forEach((g) => (s += pl(g, 'v-rapid')));
      group(cut).forEach((g) => (s += pl(g, 'v-feed')));
      const tcx = x0 + adv * Math.floor(N / 2);
      s += ci(tcx, cy - r, R, 'v-tool-ghost') + ci(tcx, cy - r, 2.5, 'v-ink-fill');
      s += ln(tcx, cy - r - R - 6, tcx + adv, cy - r - R - 6, 'v-ink');
      s += tx(tcx + adv + 6, cy - r - R - 2, `stepover ${so}%`, 'v-label');
      s += tx(W - 12, H - 10, 'blue = cutting   dashed = return move', 'v-label', 'end');
      return s;
    },
    caption({ so, rad }) {
      let c = `Each loop takes a <b>${so}%</b> bite (blue), then comes back through air (dashed). In Dynamic toolpaths that return move is lifted by Micro lift and runs at the Back feed rate.`;
      if (rad === 0) c += ' <b>Radius 0:</b> sharp turns — the machine slows down at every loop.';
      else c += ' Bigger loops (Minimum toolpath radius in Dynamic) keep the motion round so the machine holds the feed.';
      return c;
    },
  };

  // -------------------------------------------------------------------------
  specs['entry-type'] = {
    title: 'Entry into closed material (side view)',
    controls: [{ type: 'seg', key: 't', label: 'Entry', options: [['off', 'Off (plunge)'], ['ramp', 'Ramp'], ['helix', 'Helix']] }],
    init: { t: 'helix' },
    draw({ t }) {
      const top = 70, bot = 200;
      let s = hatch + rc(20, top, 380, H - top - 10, 'v-hatch-fill') + ln(20, top, 400, top, 'v-plane v-plane-t');
      s += tx(24, top - 6, 'top of stock', 'v-label-plane') + tx(24, bot + 14, 'depth', 'v-label-plane');
      s += ln(20, bot, 400, bot, 'v-plane v-plane-d');
      const cx = 210;
      if (t === 'off') {
        s += rc(cx - 22, top, 44, bot - top, 'v-air');
        s += ln(cx, 30, cx, bot, 'v-rapid-solid') + arrowHead(cx, bot, Math.PI / 2, 'v-rapid-fill', 9);
        s += rc(cx - 22, bot - 80, 44, 80, 'v-tool-bad', 3);
      } else if (t === 'ramp') {
        const x0 = 120, x1 = 300, n = 4;
        s += rc(x0 - 22, top, x1 - x0 + 44, bot - top, 'v-air');
        const pts = [[x0, top - 10]];
        for (let i = 1; i <= n; i++) pts.push([i % 2 ? x1 : x0, top + ((bot - top) * i) / n]);
        s += pl(pts, 'v-feed');
        s += rc((n % 2 ? x1 : x0) - 22, bot - 80, 44, 80, 'v-tool', 3);
      } else {
        const r = 50;
        s += rc(cx - r - 22, top, 2 * r + 44, bot - top, 'v-air');
        const pts = [];
        for (let a = 0; a <= Math.PI * 8; a += 0.1) pts.push([cx + r * Math.cos(a), top - 10 + ((bot - top + 10) * a) / (Math.PI * 8)]);
        s += pl(pts, 'v-feed');
        s += rc(cx + r - 22, bot - 80, 44, 80, 'v-tool', 3);
      }
      return s;
    },
    caption({ t }) {
      return {
        off: '<b>Off — straight plunge:</b> the center of an endmill barely cuts, chips have nowhere to go. Only into a pre-drilled hole or with a drill-point tool.',
        ramp: '<b>Ramp:</b> zigzags down along a line. Use in narrow areas where a helix does not fit.',
        helix: '<b>Helix:</b> spirals down. Chips escape, the load builds gradually. The default and the best choice when there is room.',
      }[t];
    },
  };

  // -------------------------------------------------------------------------
  specs.regions = {
    title: 'Chain Options regions (top view)',
    controls: [{ type: 'seg', key: 's', label: 'Strategy', options: [['inside', 'Stay inside'], ['outside', 'From outside']] }],
    init: { s: 'outside' },
    draw({ s: st }) {
      let s = hatch + rc(30, 30, 360, 190, 'v-stock-light') + tx(36, 46, 'Stock', 'v-label');
      s += rc(80, 70, 230, 120, 'v-region-m', 6) + tx(86, 86, 'Machining region', 'v-label-strong');
      s += ci(200, 140, 24, 'v-region-a') + tx(200, 144, 'Avoid', 'v-label', 'middle');
      s += rc(310, 70, 70, 120, 'v-region-air') + tx(345, 134, 'Air', 'v-label', 'middle');
      s += rc(60, 56, 330, 150, 'v-region-c', 4) + tx(64, 218, 'Containment (dashed)', 'v-label');
      if (st === 'inside') {
        const pts = [];
        for (let a = 0; a <= Math.PI * 6; a += 0.15) pts.push([130 + 14 * Math.cos(a), 140 + 14 * Math.sin(a) * 0.45 - a * 1.2 + 10]);
        s += pl(pts, 'v-feed') + tx(130, 176, 'helix entry', 'v-label', 'middle');
      } else {
        s += ln(8, 130, 76, 130, 'v-feed') + arrowHead(78, 130, 0, 'v-feed-fill', 8);
        s += tx(8, 122, 'enters from the side', 'v-label');
      }
      return s;
    },
    caption({ s }) {
      return s === 'inside'
        ? '<b>Stay inside:</b> the region is treated as a closed pocket — the tool enters with a helix inside it.'
        : '<b>From outside:</b> the tool approaches from outside the stock, like an open feature — no helix. Air regions let it move fast through space that is already open; avoidance keeps it off the island; containment is a fence it never crosses.';
    },
  };

  // -------------------------------------------------------------------------
  specs.rest = {
    title: 'Rest material in a corner (top view)',
    controls: [
      { type: 'range', key: 'big', label: 'Previous tool Ø', min: 10, max: 40, step: 1, unit: 'mm' },
      { type: 'range', key: 'small', label: 'Rest tool Ø', min: 4, max: 20, step: 1, unit: 'mm' },
    ],
    init: { big: 25, small: 8 },
    draw({ big, small }) {
      const k = 5, cx0 = 360, cy0 = 40; // inside corner of walls (top + right)
      const R1 = (big / 2) * k, R2 = (small / 2) * k;
      let s = hatch + rc(0, 0, W, cy0, 'v-hatch-fill') + rc(cx0, 0, W - cx0, H, 'v-hatch-fill');
      s += ci(cx0 - R1, cy0 + R1, R1, 'v-tool-ghost');
      s += pa(`M${cx0},${cy0} L${cx0 - R1},${cy0} A${R1},${R1} 0 0 1 ${cx0},${cy0 + R1}Z`, small < big ? 'v-stock' : 'v-air');
      s += tx(cx0 - R1, cy0 + R1 + 4, `Ø${big}`, 'v-label', 'middle');
      if (small < big) {
        s += pa(`M${cx0 - R1 - 10},${cy0 + R2} H${cx0 - R2} V${cy0 + R1 + 10}`, 'v-feed');
        s += ci(cx0 - R2, cy0 + R2, R2, 'v-tool');
      }
      return s + tx(cx0 + 8, H - 12, 'Wall', 'v-label-strong');
    },
    caption({ big, small }) {
      if (small >= big) return '<b>The rest tool is not smaller</b> than the previous one — it cannot reach anything new.';
      const left = (big - small) / 2 * (Math.SQRT2 - 1);
      return `The Ø${big} tool leaves the amber corner. The Ø${small} rest tool only cuts there, removing about <b>${fmt(left, 1)} mm</b> of extra material on the diagonal instead of re-cutting the whole pocket.`;
    },
  };

  // -------------------------------------------------------------------------
  specs['tip-center'] = {
    title: 'Tip or center to depth (ball tool, side view)',
    controls: [{ type: 'seg', key: 'm', label: 'Tip comp', options: [['tip', 'Tip'], ['center', 'Center']] }],
    init: { m: 'tip' },
    draw({ m }) {
      const depthY = 150, R = 40, cx = 210;
      const cy = m === 'tip' ? depthY - R : depthY;
      let s = hatch + rc(20, cy + R, 380, H - cy - R, 'v-hatch-fill');
      s += ln(20, depthY, 400, depthY, 'v-plane v-plane-d') + tx(396, depthY - 4, 'programmed depth', 'v-label-plane', 'end');
      s += pa(`M${cx - R},30 V${cy} A${R},${R} 0 0 0 ${cx + R},${cy} V30Z`, 'v-tool');
      s += ci(cx, cy, 3, 'v-ink-fill') + tx(cx + 8, cy + 4, 'center', 'v-label');
      s += ci(cx, cy + R, 3, 'v-rapid-fill') + tx(cx + 8, cy + R + 14, 'tip', 'v-label');
      return s;
    },
    caption({ m }) {
      return m === 'tip'
        ? '<b>Tip:</b> the bottom of the tool touches the programmed depth. Right for flat and bull-nose tools and most work.'
        : '<b>Center:</b> the center of the ball sits on the depth, so the tool goes one radius deeper. Only when you programmed the ball center on purpose.';
    },
  };

  // -------------------------------------------------------------------------
  specs['corner-radius'] = {
    title: 'Inside corner rounding (top view)',
    controls: [{ type: 'range', key: 'r', label: 'Rounding radius', min: 0, max: 15, step: 0.5, unit: 'mm' }],
    init: { r: 8 },
    draw({ r }) {
      const k = 9, cx0 = 330, cy0 = 40, Rt = (TOOL_D / 2) * k, Rr = r * k;
      let s = hatch + rc(0, 0, W, cy0, 'v-hatch-fill') + rc(cx0, 0, W - cx0, H, 'v-hatch-fill');
      const eff = Math.max(Rr, Rt);
      if (Rr > Rt) s += pa(`M${cx0},${cy0} L${cx0 - Rr},${cy0} A${Rr},${Rr} 0 0 1 ${cx0},${cy0 + Rr}Z`, 'v-stock');
      // tool center path
      const pr = Math.max(0, eff - Rt);
      s += pa(`M20,${cy0 + Rt} H${cx0 - Rt - pr} ${pr ? `A${pr},${pr} 0 0 1 ${cx0 - Rt},${cy0 + Rt + pr}` : ''} V${H - 10}`, 'v-feed');
      s += ci(cx0 - eff, cy0 + eff, Rt, 'v-tool-ghost');
      return s + tx(cx0 + 8, H - 12, 'Wall', 'v-label-strong');
    },
    caption({ r }) {
      const R = TOOL_D / 2;
      if (r <= R) return `With a Ø${TOOL_D} tool the corner is already R${fmt(R, 1)} from the tool itself, so a rounding radius up to ${fmt(R, 1)} changes nothing. The path (blue) has a sharp turn — the tool wraps the corner and the load jumps.`;
      return `A <b>R${fmt(r, 1)}</b> rounding on a Ø${TOOL_D} tool: the path turns smoothly and the load stays even, but a corner of material (amber) is left for a smaller tool or a finish pass.`;
    },
  };

  // -------------------------------------------------------------------------
  specs['finish-at'] = {
    title: 'Where the wall gets finished (front view)',
    controls: [{ type: 'seg', key: 'm', label: 'Finish at', options: [['final', 'Final depth'], ['all', 'All depths']] }],
    init: { m: 'final' },
    draw({ m }) {
      const x0 = 40, x1 = 380, top = 50, bot = 210;
      let s = rc(x0, top, x1 - x0, bot - top, 'v-stock-light') + view('Finished wall, seen from the front');
      [1, 2, 3].forEach((i) => (s += ln(x0, top + ((bot - top) * i) / 3, x1, top + ((bot - top) * i) / 3, 'v-ink-faint')));
      if (m === 'final') {
        s += rc(x0, top, x1 - x0, bot - top, 'v-sweep');
        s += tx((x0 + x1) / 2, (top + bot) / 2, 'one full-height pass', 'v-label-strong', 'middle');
      } else {
        [1, 2, 3].forEach((i) => { const y = top + ((bot - top) * i) / 3; s += ln(x0, y, x1, y, 'v-finish'); });
        s += tx((x0 + x1) / 2, top + 24, 'a line at every level', 'v-label-strong', 'middle');
      }
      return s;
    },
    caption({ m }) {
      return m === 'final'
        ? '<b>Final depth:</b> the wall is finished once, full height, with the whole flute. One clean surface.'
        : '<b>All depths:</b> the wall is finished at every depth cut. Needed for tall walls and short tools, but each level leaves a fine line (green).';
    },
  };

  // -------------------------------------------------------------------------
  specs['adjust-start'] = {
    title: 'Extending an open contour (top view)',
    controls: [{ type: 'range', key: 'e', label: 'Extend', min: 0, max: 150, step: 5, unit: '% Ø' }],
    init: { e: 75 },
    draw({ e }) {
      const k = 6, R = (TOOL_D / 2) * k, ext = (e / 100) * TOOL_D * k;
      const x0 = 110, x1 = 310, wallY = 130;
      let s = hatch + rc(x0, wallY, x1 - x0, H - wallY, 'v-hatch-fill') + tx(x0 + 8, H - 12, 'Part', 'v-label-strong');
      s += ln(x0, wallY, x1, wallY, 'v-chain');
      s += ln(x0 - ext, wallY - R, x1 + ext, wallY - R, 'v-feed') + arrowHead(x1 + ext, wallY - R, 0);
      s += ci(x0 - ext, wallY - R, R, ext < R ? 'v-tool-bad' : 'v-tool-ghost');
      return s;
    },
    caption({ e }) {
      const mm = (e / 100) * TOOL_D;
      return mm < TOOL_D / 2
        ? `<b>Extension ${fmt(mm, 1)} mm is less than the tool radius:</b> the tool starts already touching the part and leaves a mark at the end of the wall.`
        : `The path is extended <b>${fmt(mm, 1)} mm</b> past both ends, so the tool starts and finishes in air.`;
    },
  };

  // -------------------------------------------------------------------------
  specs.tolerance = {
    title: 'Tolerance on an R10 arc',
    controls: [{ type: 'range', key: 't', label: 'Total tolerance', min: 0.005, max: 0.5, step: 0.005, unit: 'mm' }],
    init: { t: 0.1 },
    draw({ t }) {
      const R = 10, k = 17, cx = 60, cy = 225;
      const n = Math.max(1, Math.ceil((Math.PI / 2) / (2 * Math.acos(1 - t / R))));
      let s = pa(`M${cx + R * k},${cy} A${R * k},${R * k} 0 0 0 ${cx},${cy - R * k}`, 'v-chain');
      const pts = [];
      for (let i = 0; i <= n; i++) { const a = (i / n) * (Math.PI / 2); pts.push([cx + R * k * Math.cos(a), cy - R * k * Math.sin(a)]); }
      s += pl(pts, 'v-feed');
      pts.forEach((p) => (s += ci(p[0], p[1], 2.5, 'v-feed-fill')));
      s += tx(W - 12, 40, `${n} line moves`, 'v-label-strong', 'end');
      return s;
    },
    caption({ t }) {
      const n = Math.max(1, Math.ceil((Math.PI / 2) / (2 * Math.acos(1 - t / 10))));
      return `With <b>${fmt(t, 3)} mm</b> tolerance a 90° arc of R10 becomes <b>${n} straight moves</b> if no arc filter is used. Tighter tolerance = more accurate, but more code and more work for the control. The arc filter turns these back into a single G2/G3.`;
    },
  };

  // -------------------------------------------------------------------------
  specs['fine-bore'] = {
    title: 'Fine bore shift (top view)',
    controls: [{ type: 'seg', key: 'd', label: 'Shift', options: [['away', 'Away from insert'], ['toward', 'Toward insert']] }],
    init: { d: 'away' },
    draw({ d }) {
      const cx = 210, cy = 125, Rb = 90, Rbar = 40;
      let s = hatch + rc(0, 0, W, H, 'v-hatch-fill') + ci(cx, cy, Rb, 'v-air') + ci(cx, cy, Rb, 'v-chain');
      const sh = d === 'away' ? -30 : 30;
      // bar oriented with insert pointing +x touching wall
      s += ci(cx + (Rb - Rbar - 12), cy, Rbar, 'v-tool-ghost');
      s += pa(`M${cx + Rb - 12},${cy - 6} L${cx + Rb},${cy} L${cx + Rb - 12},${cy + 6}Z`, 'v-rapid-fill');
      s += ci(cx + (Rb - Rbar - 12) + sh, cy, Rbar, d === 'away' ? 'v-tool' : 'v-tool-bad');
      s += ln(cx + (Rb - Rbar - 12), cy - Rbar - 10, cx + (Rb - Rbar - 12) + sh, cy - Rbar - 10, 'v-ink') + arrowHead(cx + (Rb - Rbar - 12) + sh, cy - Rbar - 10, sh > 0 ? 0 : Math.PI, 'v-ink-fill');
      s += tx(cx + Rb + 4, cy - 12, 'insert', 'v-label');
      return s;
    },
    caption({ d }) {
      return d === 'away'
        ? 'At the bottom the spindle orients so the insert points one way, the bar <b>shifts away</b> from the wall, then rapids out without touching the bore. No drag line.'
        : '<b>Shift toward the insert:</b> the insert is pushed into the wall and dragged out — a scratched bore and a broken insert. Check the orientation on your machine.';
    },
  };


  // -------------------------------------------------------------------------
  specs['climb-conv'] = {
    title: 'Climb or conventional (top view, spindle M03)',
    controls: [{ type: 'seg', key: 'm', label: 'Direction', options: [['climb', 'Climb'], ['conv', 'Conventional']] }],
    init: { m: 'climb' },
    draw({ m }) {
      const cx = 200, cy = 125, R = 60, climb = m === 'climb';
      const wallY = climb ? cy - R + 18 : cy + R - 18; // material above for climb, below for conventional
      let s = hatch;
      s += climb ? rc(0, 0, W, wallY, 'v-hatch-fill') : rc(0, wallY, W, H - wallY, 'v-hatch-fill');
      s += tx(12, climb ? 20 : H - 10, 'material', 'v-label-strong');
      s += ci(cx, cy, R, 'v-tool');
      // spindle CW arrow
      const r2 = R - 14;
      s += pa(`M${cx + r2 * Math.cos(-2.4)},${cy + r2 * Math.sin(-2.4)} A${r2},${r2} 0 1 1 ${cx + r2 * Math.cos(2.0)},${cy + r2 * Math.sin(2.0)}`, 'v-ink-thin');
      s += arrowHead(cx + r2 * Math.cos(2.0), cy + r2 * Math.sin(2.0), 2.0 + Math.PI / 2, 'v-ink-fill', 6);
      // feed arrow (always to the right)
      s += ln(cx - 30, cy, cx + 24, cy, 'v-feed') + arrowHead(cx + 28, cy, 0);
      s += tx(cx, cy + 16, 'feed', 'v-label', 'middle');
      // chip wedge on the material side
      const y0 = wallY, sgn = climb ? -1 : 1;
      s += pa(climb ? `M${cx + 52},${y0} L${cx - 10},${y0 - 3} Q${cx - 22},${y0 + 6} ${cx - 14},${y0 + 14} Z` : `M${cx - 52},${y0} L${cx + 10},${y0 + 3} Q${cx + 22},${y0 - 6} ${cx + 14},${y0 - 14} Z`, 'v-stock');
      s += tx(W - 12, climb ? 20 : H - 10, climb ? 'chip starts thick, ends thin' : 'chip starts thin, ends thick', 'v-label', 'end');
      return s;
    },
    caption({ m }) {
      return m === 'climb'
        ? '<b>Climb:</b> each tooth enters the material at full chip thickness and leaves thin. Less rubbing, less heat, better wall finish and tool life — the normal choice on CNC machines.'
        : '<b>Conventional:</b> each tooth starts with a zero-thickness chip and rubs before it bites, then leaves thick. More heat and wear; used on worn machines with backlash or on hard scale.';
    },
  };

  // Fixes to existing visuals ------------------------------------------------
  specs['depth-cuts'].draw = function (st) {
    const finish = Math.min(st.nf * st.fs, st.total);
    const rough = st.total - finish;
    const n = rough > 0 ? Math.ceil(rough / st.max - 1e-9) : 0;
    const step = n ? rough / n : 0;
    const levels = [];
    for (let i = 1; i <= n; i++) levels.push({ z: step * i, f: false });
    for (let i = 1; i <= st.nf; i++) levels.push({ z: rough + st.fs * i, f: true });
    const top = 40, bot = 210, k = (bot - top) / st.total, px0 = 120, px1 = 300;
    let s = hatch + view('Section through a pocket');
    s += rc(20, top, px0 - 20, H - top, 'v-hatch-fill') + rc(px1, top, W - px1, H - top, 'v-hatch-fill') + rc(px0, bot, px1 - px0, H - bot, 'v-hatch-fill');
    let lastY = -99;
    levels.forEach((lv, i) => {
      const y = top + lv.z * k;
      s += ln(px0 + 4, y, px1 - 4, y, lv.f ? 'v-finish' : 'v-feed');
      if (y - lastY >= 13 || i === levels.length - 1) { s += tx(px1 + 6, Math.max(y + 4, lastY + 13), fmt(lv.z, 2), 'v-label-num'); lastY = Math.max(y, lastY + 9); }
    });
    const last = levels[levels.length - 1];
    if (last) s += rc(px0 + 8, top + last.z * k - 90, 40, 90, 'v-tool', 3);
    s += tx(24, top - 6, 'Top of stock', 'v-label-plane');
    return s;
  };
  specs.stock.caption = ({ wall, floor }) =>
    wall < 0 || floor < 0
      ? '<b>Negative stock</b> cuts into the finished geometry (red) — used on purpose for clearance fits or to correct a known error.'
      : `Roughing leaves <b>${fmt(wall, 2)} mm</b> on the wall and <b>${fmt(floor, 2)} mm</b> on the floor (amber band, exaggerated). The finishing op removes it.`;
  specs['comp-side'].draw = function ({ dir, side }) {
    const chainY = 130, R = 32;
    const up = (dir === 'r') === (side === 'L');
    const ty = up ? chainY - R : chainY + R;
    const x1 = dir === 'r' ? 50 : 370, x2 = dir === 'r' ? 370 : 50, tx0 = 210;
    let s = hatch + view('Top view');
    s += rc(0, 0, W, chainY, 'v-stock-light') + tx(12, 22, 'Stock to remove', 'v-label-strong');
    s += rc(0, chainY, W, H - chainY, 'v-hatch-fill') + tx(12, H - 12, 'Finished part', 'v-label-strong');
    s += ln(x1, chainY, x2, chainY, 'v-chain') + arrowHead(x2, chainY, dir === 'r' ? 0 : Math.PI, 'v-ink-fill', 9);
    s += tx(x2 + (dir === 'r' ? -6 : 6), chainY + 16, 'chain direction', 'v-label', dir === 'r' ? 'end' : 'start');
    s += ci(tx0, ty, R, up ? 'v-tool' : 'v-tool-bad');
    const r2 = R - 9;
    s += pa(`M${tx0 + r2 * Math.cos(-2.4)},${ty + r2 * Math.sin(-2.4)} A${r2},${r2} 0 1 1 ${tx0 + r2 * Math.cos(2.0)},${ty + r2 * Math.sin(2.0)}`, 'v-ink-thin');
    s += arrowHead(tx0 + r2 * Math.cos(2.0), ty + r2 * Math.sin(2.0), 2.0 + Math.PI / 2, 'v-ink-fill', 6);
    s += tx(tx0, up ? ty - R - 6 : ty + R + 14, 'spindle M03', 'v-label', 'middle');
    return s;
  };
}
