// CAD visuals added in v1.7 so every ribbon function has an interactive drawing.
// Several functions share one visual and open it on their own option ('cad-modify?t=join').

export function addCadSpecs2(specs, h) {
  const { W, H, ln, pl, ci, rc, tx, pa, arrowHead, hatch } = h;
  const before = new Set(Object.keys(specs));
  const note = (s) => {
    if (s.length <= 66) return tx(W - 10, H - 10, s, 'v-label', 'end');
    let i = s.lastIndexOf(' ', Math.ceil(s.length / 2) + 6); if (i < 10) i = s.indexOf(' ', s.length / 2);
    return tx(W - 10, H - 24, s.slice(0, i), 'v-label', 'end') + tx(W - 10, H - 10, s.slice(i + 1), 'v-label', 'end');
  };
  const view = (s) => tx(W - 10, 16, s, 'v-label', 'end');
  // simple isometric projection for solids
  const C30 = Math.cos(Math.PI / 6), S30 = 0.5;
  const iso = (x, y, z, ox = 210, oy = 150, k = 1) => [ox + (x - y) * C30 * k, oy + (x + y) * S30 * k - z * k];
  const poly = (pts, cls) => pa('M' + pts.map((p) => p.map((n) => +n.toFixed(1)).join(',')).join(' L') + 'Z', cls);
  const box = (x0, y0, z0, dx, dy, dz, o = {}) => {
    const P = (x, y, z) => iso(x, y, z, o.ox, o.oy, o.k);
    const top = [P(x0, y0, z0 + dz), P(x0 + dx, y0, z0 + dz), P(x0 + dx, y0 + dy, z0 + dz), P(x0, y0 + dy, z0 + dz)];
    const right = [P(x0 + dx, y0, z0), P(x0 + dx, y0 + dy, z0), P(x0 + dx, y0 + dy, z0 + dz), P(x0 + dx, y0, z0 + dz)];
    const left = [P(x0, y0 + dy, z0), P(x0 + dx, y0 + dy, z0), P(x0 + dx, y0 + dy, z0 + dz), P(x0, y0 + dy, z0 + dz)];
    return poly(left, o.cls2 || 'v-part') + poly(right, o.cls3 || 'v-stock') + poly(top, o.cls || 'v-stock-light');
  };
  const cylIso = (cx, cy, r, hgt, cls = 'v-stock-light') => {
    // upright cylinder seen in iso: ellipse top and bottom
    const ry = r * 0.5;
    return pa(`M${cx - r},${cy} V${cy + hgt} A${r},${ry} 0 0 0 ${cx + r},${cy + hgt} V${cy}`, 'v-stock') + `<ellipse cx="${cx}" cy="${cy}" rx="${r}" ry="${ry}" class="${cls}"/>`;
  };
  const panel = (x, y, w, rows, title) => {
    let s = rc(x, y, w, 26 + rows.length * 24, 'v-stock-light', 4) + tx(x + 10, y + 17, title, 'v-label-strong');
    rows.forEach((r, i) => { s += tx(x + 10, y + 42 + i * 24, r[0], 'v-label') + (r[1] != null ? rc(x + w - 90, y + 30 + i * 24, 80, 18, 'v-air', 3) + tx(x + w - 14, y + 43 + i * 24, String(r[1]), 'v-label-strong', 'end') : ''); });
    return s;
  };

  // ---------------------------------------------------------------- basics
  specs['cad-zdepth'] = {
    title: 'Z depth: where new geometry is drawn',
    controls: [{ type: 'range', key: 'z', label: 'Z depth', min: -30, max: 0, step: 1, unit: ' mm' }],
    init: { z: -10 },
    draw({ z }) {
      let s = view('Side view of a stepped block, Cplane Top');
      s += pa('M60,80 H220 V140 H360 V200 H60Z', 'v-hatch-fill');
      const y = 80 - z * 4;
      s += ln(40, y, 380, y, 'v-chain') + tx(384, y + 4, `Z${z}`, 'v-label-strong');
      s += tx(44, 74, 'Z0', 'v-label');
      return s + note(z === 0 ? 'Lines land on the top face' : `New lines land ${-z} mm down: on the step at Z-15, you pick ${z === -15 ? 'right' : 'Z-15'}`);
    },
  };

  specs['cad-levels'] = {
    title: 'Levels: switch groups of geometry on and off',
    controls: [
      { type: 'seg', key: 'g', label: 'Level 1 Part', options: [['on', 'On'], ['off', 'Off']] },
      { type: 'seg', key: 'f', label: 'Level 10 Fixture', options: [['on', 'On'], ['off', 'Off']] },
      { type: 'seg', key: 'c', label: 'Level 20 Chains', options: [['on', 'On'], ['off', 'Off']] },
    ],
    init: { g: 'on', f: 'on', c: 'on' },
    draw({ g, f, c }) {
      let s = view('Top view');
      if (f === 'on') s += rc(40, 140, 340, 70, 'v-stock') + rc(60, 70, 30, 70, 'v-stock') + rc(330, 70, 30, 70, 'v-stock') + tx(48, 200, 'vise (level 10)', 'v-label');
      if (g === 'on') s += rc(100, 60, 220, 90, 'v-hatch-fill') + tx(110, 76, 'part (level 1)', 'v-label-strong');
      if (c === 'on') s += rc(140, 80, 140, 50, 'v-chain', 8) + ci(130, 105, 6, 'v-chain');
      return s + note('Put each kind of geometry on its own level so you can hide what you are not working on');
    },
  };

  specs['cad-sw-map'] = {
    title: 'SolidWorks words in Mastercam',
    controls: [{ type: 'seg', key: 't', label: 'In SolidWorks', options: [['sketch', 'Sketch'], ['plane', 'Plane'], ['feat', 'Feature tree'], ['layer', 'Layer'], ['smart', 'Smart Dimension']] }],
    init: { t: 'sketch' },
    draw({ t }) {
      const m = {
        sketch: ['Sketch (constrained)', 'Wireframe on a Cplane', 'No constraints: type the sizes, use Modify and Xform to change them'],
        plane: ['Reference plane', 'Cplane / Tplane', 'Planes Manager; WCS is the machine zero'],
        feat: ['FeatureManager tree', 'Solids Manager', 'History of solid operations; wireframe has none'],
        layer: ['Layers', 'Levels', 'Level numbers + names, show/hide'],
        smart: ['Smart Dimension', 'Drafting › Smart Dimension', 'Annotation only: it does not drive the size'],
      }[t];
      let s = view('What maps to what');
      s += rc(30, 70, 160, 70, 'v-stock-light', 6) + tx(110, 100, 'SolidWorks', 'v-label', 'middle') + tx(110, 122, m[0], 'v-label-strong', 'middle');
      s += ln(196, 105, 222, 105, 'v-feed') + arrowHead(226, 105, 0, 'v-feed-fill', 8);
      s += rc(230, 70, 160, 70, 'v-sweep', 6) + tx(310, 100, 'Mastercam', 'v-label', 'middle') + tx(310, 122, m[1], 'v-label-strong', 'middle');
      return s + note(m[2]);
    },
  };

  specs['cad-autocursor'] = {
    title: 'AutoCursor snaps',
    controls: [{ type: 'seg', key: 't', label: 'Snap', options: [['end', 'Endpoint'], ['mid', 'Midpoint'], ['cen', 'Center'], ['quad', 'Quadrant'], ['int', 'Intersection'], ['near', 'Nearest']] }],
    init: { t: 'end' },
    draw({ t }) {
      let s = view('Hover the geometry: the cursor shows what it will grab');
      s += ln(60, 180, 260, 180, 'v-ink') + ln(260, 180, 260, 70, 'v-ink') + ci(330, 120, 45, 'v-ink') + ln(60, 120, 360, 120, 'v-ink-thin');
      const p = { end: [260, 180], mid: [160, 180], cen: [330, 120], quad: [330, 75], int: [260, 120], near: [210, 180] }[t];
      s += ci(p[0], p[1], 9, 'v-num-a') + ci(p[0], p[1], 2.5, 'c-pt');
      s += pa(`M${p[0] + 14},${p[1] + 14} l0,16 l4,-4 l6,10 l3,-2 l-6,-9 l6,-1Z`, 'v-ink-fill');
      return s + note({ end: 'End of a line or arc', mid: 'Middle of a line', cen: 'Centre of an arc: hover the arc, not the middle', quad: '0/90/180/270° point of a circle', int: 'Where two entities cross', near: 'Any point on the entity (avoid for exact work)' }[t]);
    },
  };

  specs['cad-panel'] = {
    title: 'The function panel buttons',
    controls: [{ type: 'seg', key: 'b', label: 'Button', options: [['ok', 'OK'], ['okc', 'OK and Create New'], ['apply', 'Apply'], ['lock', 'Lock a field']] }],
    init: { b: 'okc' },
    draw({ b }) {
      let s = view('Circle Center Point panel');
      s += panel(30, 40, 180, [['Diameter', b === 'lock' ? '10 🔒' : '10'], ['Radius', '5']], 'Circle Center Point');
      const n = b === 'ok' ? 1 : 3;
      for (let i = 0; i < n; i++) s += ci(270 + i * 50, 120, 20, i === n - 1 && b !== 'ok' ? 'v-chain' : 'v-ink');
      s += tx(260, 180, { ok: 'Creates and closes the panel', okc: 'Keeps the circle, starts the next one', apply: 'Same: keep going with the same settings', lock: 'Locked value is kept for every circle' }[b], 'v-label');
      return s + note('Green tick + plus = OK and Create New: the fastest way to draw several of the same');
    },
  };

  // ---------------------------------------------------------------- wireframe
  specs['cad-points'] = {
    title: 'Point functions',
    controls: [{ type: 'seg', key: 't', label: 'Function', options: [['pos', 'Point Position'], ['seg', 'Point Segment'], ['end', 'Point Endpoints'], ['small', 'Point Small Arcs']] }],
    init: { t: 'small' },
    draw({ t }) {
      let s = view('Top view');
      s += ln(40, 200, 220, 200, 'v-ink') + ci(300, 90, 14, 'v-ink') + ci(360, 90, 14, 'v-ink') + ci(300, 160, 40, 'v-ink');
      const pts = { pos: [[120, 100]], seg: [40, 85, 130, 175, 220].map((x) => [x, 200]), end: [[40, 200], [220, 200]], small: [[300, 90], [360, 90]] }[t];
      pts.forEach(([x, y]) => (s += ci(x, y, 5, 'v-num-a')));
      return s + note({ pos: 'A point where you click or type X Y Z', seg: 'Evenly spaced points along a line (count or distance)', end: 'A point at both ends of each entity', small: 'Points at the centre of arcs under a size: the Ø80 one is skipped. Great for drill positions.' }[t]);
    },
  };

  specs['cad-spline'] = {
    title: 'Spline Manual',
    controls: [{ type: 'range', key: 'n', label: 'Points picked', min: 3, max: 8, step: 1, unit: '' }],
    init: { n: 5 },
    draw({ n }) {
      let s = view('Pick points, Enter to finish');
      const pts = Array.from({ length: n }, (_, i) => [50 + (i * 320) / (n - 1), 130 + Math.sin(i * 1.3) * 60]);
      let d = `M${pts[0]}`;
      for (let i = 1; i < pts.length; i++) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i]; d += ` C${x0 + (x1 - x0) / 2},${y0} ${x0 + (x1 - x0) / 2},${y1} ${x1},${y1}`; }
      s += pa(d, 'v-feed');
      pts.forEach(([x, y]) => (s += ci(x, y, 4, 'v-num-a')));
      return s + note('For CNC, prefer lines and arcs: a spline is posted as many tiny moves unless filtered');
    },
  };

  specs['cad-ellipse'] = {
    title: 'Ellipse, helix and spiral',
    controls: [
      { type: 'seg', key: 't', label: 'Function', options: [['ell', 'Ellipse'], ['hel', 'Helix'], ['spi', 'Spiral']] },
      { type: 'range', key: 'n', label: 'Revolutions / ratio', min: 1, max: 6, step: 0.5, unit: '' },
    ],
    init: { t: 'hel', n: 3 },
    draw({ t, n }) {
      let s = view(t === 'hel' ? 'Side view' : 'Top view');
      const pts = [];
      if (t === 'ell') { const a = 140, b = 140 / Math.max(1, n); for (let i = 0; i <= 72; i++) { const u = (i / 72) * Math.PI * 2; pts.push([210 + a * Math.cos(u), 125 + b * Math.sin(u)]); } }
      if (t === 'hel') for (let i = 0; i <= n * 60; i++) { const u = (i / 60) * Math.PI * 2; pts.push([210 + 80 * Math.cos(u), 210 - (i / (n * 60)) * 170 + 18 * Math.sin(u)]); }
      if (t === 'spi') for (let i = 0; i <= n * 60; i++) { const u = (i / 60) * Math.PI * 2, r = 10 + (i / (n * 60)) * 95; pts.push([210 + r * Math.cos(u), 125 + r * Math.sin(u)]); }
      s += pl(pts, 'v-feed');
      return s + note({ ell: 'Ellipse: two radii (the slider is the ratio). Posted as small lines or arcs.', hel: 'Helix: radius, pitch and revolutions: a 3D curve for thread or helical paths', spi: 'Spiral: a flat curve opening out each turn' }[t]);
    },
  };

  specs['cad-letters'] = {
    title: 'Create Letters',
    controls: [
      { type: 'range', key: 'h', label: 'Letter height', min: 4, max: 20, step: 1, unit: ' mm' },
      { type: 'seg', key: 'a', label: 'Alignment', options: [['line', 'Straight'], ['arc', 'Along an arc']] },
    ],
    init: { h: 10, a: 'arc' },
    draw({ h: hh, a }) {
      let s = view('Top view: engraving text');
      const txt = 'PART-042';
      if (a === 'line') s += `<text x="210" y="${130 + hh * 2}" text-anchor="middle" class="v-letters" style="font-size:${hh * 5}px">${txt}</text>` + ln(60, 130 + hh * 2 + 4, 360, 130 + hh * 2 + 4, 'c-ref');
      else {
        s += pa('M70,190 A140,140 0 0 1 350,190', 'c-ref') + `<path id="lt-arc" d="M70,190 A140,140 0 0 1 350,190" fill="none"/><text class="v-letters" style="font-size:${hh * 4}px"><textPath href="#lt-arc" startOffset="50%" text-anchor="middle">${txt}</textPath></text>`;
      }
      return s + note('Letters are real wireframe: chain them for an engrave or contour toolpath');
    },
  };

  specs['cad-bbox'] = {
    title: 'Bounding Box',
    controls: [
      { type: 'seg', key: 's', label: 'Shape', options: [['rect', 'Rectangular'], ['cyl', 'Cylindrical']] },
      { type: 'range', key: 'e', label: 'Expand by', min: 0, max: 10, step: 0.5, unit: ' mm' },
    ],
    init: { s: 'rect', e: 2 },
    draw({ s: shape, e }) {
      let s = view('Top view: stock from the part');
      s += pa('M140,80 H270 L300,110 V170 H140Z', 'v-hatch-fill') + ci(180, 125, 14, 'v-air');
      const k = 4;
      if (shape === 'rect') s += rc(140 - e * k, 80 - e * k, 160 + 2 * e * k, 90 + 2 * e * k, 'v-chain');
      else s += ci(220, 125, 92 + e * k, 'v-chain');
      s += tx(30, 40, shape === 'rect' ? `${(80 + 2 * e).toFixed(1)} × ${(45 + 2 * e).toFixed(1)} mm` : `Ø${(92 + 2 * e).toFixed(0)} bar`, 'v-label-strong');
      return s + note('Use it for the stock in Machine Group Setup, with a little added for facing');
    },
  };

  specs['cad-silhouette'] = {
    title: 'Silhouette and edge curves',
    controls: [{ type: 'seg', key: 't', label: 'Function', options: [['sil', 'Silhouette Boundary'], ['one', 'Curve One Edge'], ['all', 'Curve All Edges']] }],
    init: { t: 'sil' },
    draw({ t }) {
      let s = view('Iso view of a block with a pocket');
      s += box(0, 0, 0, 120, 80, 30, { ox: 150, oy: 100, k: 1 });
      const P = (x, y, z) => iso(x, y, z, 150, 100, 1);
      const pocket = [P(30, 20, 30), P(90, 20, 30), P(90, 60, 30), P(30, 60, 30)];
      s += poly(pocket, 'v-air');
      if (t === 'sil') s += poly([P(0, 0, 30), P(120, 0, 30), P(120, 0, 0), P(120, 80, 0), P(0, 80, 0), P(0, 80, 30)], 'v-chain');
      if (t === 'one') s += pa(`M${P(30, 20, 30)} L${P(90, 20, 30)}`, 'v-feed');
      if (t === 'all') s += poly(pocket, 'v-chain') + poly([P(0, 0, 30), P(120, 0, 30), P(120, 80, 30), P(0, 80, 30)], 'v-chain');
      return s + note({ sil: 'The outline of the part seen from the plane: for a contour around the outside', one: 'Wireframe on one edge you click', all: 'Wireframe on every edge of the faces you pick' }[t]);
    },
  };

  specs['cad-turn-profile'] = {
    title: 'Turn Profile and shapes',
    controls: [{ type: 'seg', key: 't', label: 'Function', options: [['turn', 'Turn Profile'], ['groove', 'Relief Groove'], ['stair', 'Stair geometry']] }],
    init: { t: 'turn' },
    draw({ t }) {
      let s = view(t === 'turn' ? 'Half profile of a revolved part' : 'Front view');
      if (t === 'turn') s += pa('M60,190 V120 H160 V90 H280 V140 H360 V190', 'v-chain') + ln(40, 190, 380, 190, 'c-ref') + tx(384, 194, 'axis', 'v-label');
      if (t === 'groove') s += pa('M60,100 H200 V130 Q205,140 215,140 H240 Q250,140 250,130 V170 H360', 'v-chain');
      if (t === 'stair') { let d = 'M60,200'; for (let i = 0; i < 6; i++) d += ` H${60 + (i + 1) * 50} V${200 - (i + 1) * 25}`; s += pa(d, 'v-chain'); }
      return s + note({ turn: 'Half profile of a turned or revolved solid: for lathe work or a Revolve', groove: 'Standard relief groove geometry from a table', stair: 'Stair geometry from rise and run (Router/architectural)' }[t]);
    },
  };

  specs['cad-raster'] = {
    title: 'Raster to Vector',
    controls: [{ type: 'range', key: 'tol', label: 'Tolerance', min: 1, max: 10, step: 1, unit: ' px' }],
    init: { tol: 4 },
    draw({ tol }) {
      let s = view('A scanned logo traced to lines and arcs');
      for (let y = 50; y < 200; y += 8) for (let x = 60; x < 200; x += 8) if (Math.hypot(x - 130, y - 125) < 60 && Math.hypot(x - 150, y - 110) > 25) s += rc(x, y, 7, 7, 'v-stock');
      const n = Math.round(48 / tol);
      const pts = []; for (let i = 0; i <= n; i++) { const u = (i / n) * Math.PI * 2; pts.push([300 + 60 * Math.cos(u), 125 + 60 * Math.sin(u)]); }
      s += pl(pts, 'v-chain');
      return s + note(`${n} entities: bigger tolerance = fewer, smoother entities but less exact`);
    },
  };

  specs['cad-slice'] = {
    title: 'Curve Slice by Plane',
    controls: [{ type: 'range', key: 'z', label: 'Plane height', min: 0, max: 60, step: 2, unit: ' mm' }],
    init: { z: 30 },
    draw({ z }) {
      let s = view('Side view of a domed part');
      s += pa('M60,200 V160 Q210,20 360,160 V200Z', 'v-hatch-fill');
      const y = 200 - z * 2.2;
      s += ln(30, y, 390, y, 'c-ref');
      // half-width of the dome at y
      const t = Math.max(0, Math.min(1, (y - 160) / (20 - 160)));
      const yy = Math.max(y, 160 - (160 - 20) * 0.5);
      let hw = y >= 160 ? 150 : 150 * Math.sqrt(Math.max(0, 1 - ((160 - y) / 70) ** 2));
      void t; void yy;
      if (hw > 0) s += ln(210 - hw, y, 210 + hw, y, 'v-feed') + ci(210 - hw, y, 4, 'v-num-a') + ci(210 + hw, y, 4, 'v-num-a');
      return s + note(hw > 0 ? 'The section of the part at that height becomes wireframe: chain it for a 2D toolpath' : 'The plane misses the part');
    },
  };

  specs['cad-modify'] = {
    title: 'Modify functions',
    controls: [{ type: 'seg', key: 't', label: 'Function', options: [['dyn', 'Dynamic Trim'], ['brk', 'Break Two Pieces'], ['div', 'Divide'], ['join', 'Join'], ['len', 'Modify Length'], ['close', 'Close Arc']] }],
    init: { t: 'join' },
    draw({ t }) {
      let s = view('Before (left) and after (right)');
      const L = (x0, y0, x1, y1, c) => ln(x0, y0, x1, y1, c);
      if (t === 'dyn') { s += L(40, 120, 190, 120, 'v-ink') + L(110, 60, 110, 180, 'v-ink') + pa('M150,110 l10,10 M160,110 l-10,10', 'v-label-bad') + L(230, 120, 320, 120, 'v-feed') + L(300, 60, 300, 180, 'v-ink'); }
      if (t === 'brk') { s += L(40, 120, 190, 120, 'v-ink') + ci(110, 120, 4, 'v-num-a') + L(230, 120, 300, 120, 'v-feed') + L(300, 120, 380, 120, 'v-chain'); }
      if (t === 'div') { s += L(40, 120, 190, 120, 'v-ink') + L(90, 70, 90, 170, 'v-ink') + L(140, 70, 140, 170, 'v-ink') + L(230, 120, 280, 120, 'v-ink') + L(330, 120, 380, 120, 'v-ink') + L(280, 70, 280, 170, 'v-ink') + L(330, 70, 330, 170, 'v-ink'); }
      if (t === 'join') { s += L(40, 120, 100, 120, 'v-ink') + L(100, 120, 190, 120, 'v-chain') + L(230, 120, 380, 120, 'v-feed'); }
      if (t === 'len') { s += L(40, 120, 150, 120, 'v-ink') + L(230, 120, 340, 120, 'v-ink') + L(340, 120, 380, 120, 'v-feed') + tx(360, 110, '+20', 'v-label-strong', 'middle'); }
      if (t === 'close') { s += pa('M70,150 A50,50 0 1 1 150,150', 'v-ink') + ci(300, 120, 50, 'v-feed'); }
      s += ln(210, 60, 210, 190, 'c-ref');
      return s + note({ dyn: 'Click the piece to throw away: it trims back to the next crossing', brk: 'One line becomes two at the point you pick', div: 'Removes the piece between two crossings', join: 'Two collinear lines (or arcs on the same circle) become one entity', len: 'Extend or shorten by a length (was the Extend mode of Trim Break Extend before 2020)', close: 'An arc becomes a full circle' }[t]);
    },
  };

  specs['cad-project'] = {
    title: 'Project',
    controls: [{ type: 'seg', key: 't', label: 'Project to', options: [['plane', 'Z depth / plane'], ['surf', 'Surface']] }],
    init: { t: 'plane' },
    draw({ t }) {
      let s = view('Side view');
      s += pa('M60,70 Q150,30 230,80 T360,70', 'v-ink') + tx(64, 60, 'curve in 3D', 'v-label');
      if (t === 'plane') s += ln(40, 190, 380, 190, 'c-ref') + ln(60, 190, 360, 190, 'v-feed');
      else s += pa('M40,200 Q210,120 380,200', 'v-hatch-fill-soft') + pa('M60,193 Q210,128 360,193', 'v-feed');
      for (let x = 80; x <= 340; x += 52) s += ln(x, 70, x, t === 'plane' ? 190 : 200 - 70 * Math.sin(((x - 40) / 340) * Math.PI), 'v-ink-thin');
      return s + note(t === 'plane' ? 'Flattened to one Z: a 3D edge becomes a 2D chain for 2D toolpaths' : 'Wrapped onto a surface');
    },
  };

  specs['cad-combine'] = {
    title: 'Combine Views',
    controls: [{ type: 'seg', key: 'c', label: 'Combine', options: [['off', 'Before'], ['on', 'After']] }],
    init: { c: 'on' },
    draw({ c }) {
      let s = view('Views in the file');
      const rows = c === 'off' ? ['Top', 'Top (copy 1)', 'Top (copy 2)', 'Front'] : ['Top', 'Front'];
      rows.forEach((r, i) => (s += rc(60, 50 + i * 36, 300, 28, 'v-stock-light', 4) + tx(72, 69 + i * 36, r, 'v-label-strong')));
      return s + note('Planes that are the same orientation are merged into one: cleaner plane list after import');
    },
  };

  // ---------------------------------------------------------------- transform
  specs['cad-origin'] = {
    title: 'Move to Origin',
    controls: [{ type: 'seg', key: 'p', label: 'Picked point', options: [['corner', 'Lower-left corner'], ['center', 'Centre of a hole']] }],
    init: { p: 'center' },
    draw({ p }) {
      let s = view('Top view');
      s += ln(60, 200, 380, 200, 'c-ref') + ln(60, 40, 60, 220, 'c-ref') + tx(64, 214, 'X0 Y0', 'v-label');
      s += rc(180, 70, 140, 80, 'v-chain') + ci(250, 110, 12, 'v-chain');
      const pt = p === 'corner' ? [180, 150] : [250, 110];
      s += ci(pt[0], pt[1], 5, 'v-num-a') + pa(`M${pt[0]},${pt[1]} L64,196`, 'v-rapid') + arrowHead(64, 196, Math.atan2(196 - pt[1], 64 - pt[0]), 'v-ink-fill', 8);
      return s + note('Everything moves so the point you pick lands on 0,0,0: the part zero for programming');
    },
  };

  specs['cad-gnomon'] = {
    title: 'Dynamic transform',
    controls: [{ type: 'range', key: 'a', label: 'Drag the ring', min: -180, max: 180, step: 5, unit: '°' }],
    init: { a: 30 },
    draw({ a }) {
      let s = view('Top view: drag the gnomon arrows or ring');
      const cx = 200, cy = 125, t = (a * Math.PI) / 180;
      const pts = [[-80, -40], [80, -40], [80, 40], [-80, 40]].map(([x, y]) => [cx + x * Math.cos(t) - y * Math.sin(t), cy + x * Math.sin(t) + y * Math.cos(t)]);
      s += poly(pts, 'v-chain') + ci(cx, cy, 50, 'c-ref') + ln(cx, cy, cx + 70, cy, 'v-feed') + arrowHead(cx + 72, cy, 0, 'v-feed-fill', 9) + ln(cx, cy, cx, cy - 70, 'v-good-line') + arrowHead(cx, cy - 72, -Math.PI / 2, 'v-ink-fill', 9);
      s += tx(330, 60, `${a}°`, 'v-label-strong');
      return s + note('Move, rotate or copy on screen with the gnomon, or type the exact value in the panel');
    },
  };

  specs['cad-xplane'] = {
    title: 'Translate to Plane / Roll',
    controls: [{ type: 'seg', key: 't', label: 'Function', options: [['plane', 'Translate to Plane'], ['roll', 'Roll']] }],
    init: { t: 'plane' },
    draw({ t }) {
      let s = view(t === 'plane' ? 'Top → Front' : 'Flat ↔ wrapped on a diameter');
      if (t === 'plane') { s += rc(40, 100, 120, 70, 'v-chain') + tx(100, 190, 'on Top', 'v-label', 'middle') + ln(180, 135, 230, 135, 'v-feed') + arrowHead(234, 135, 0, 'v-feed-fill', 8) + box(0, 0, 0, 90, 4, 60, { ox: 300, oy: 150, k: 1 }); }
      else { s += ln(40, 120, 200, 120, 'v-chain') + tx(120, 110, 'flat: π × Ø long', 'v-label', 'middle') + ci(310, 125, 60, 'v-chain'); }
      return s + note(t === 'plane' ? 'Copies geometry from one plane to another, keeping its shape' : 'Wraps flat geometry around a diameter (4th axis) or unrolls it');
    },
  };

  specs['cad-nesting'] = {
    title: 'Geometry Nesting',
    controls: [
      { type: 'range', key: 'g', label: 'Part spacing', min: 2, max: 20, step: 1, unit: ' mm' },
      { type: 'range', key: 'n', label: 'Copies', min: 2, max: 16, step: 1, unit: '' },
    ],
    init: { g: 6, n: 9 },
    draw({ g, n }) {
      let s = view('Sheet 400 × 200, part 70 × 40');
      s += rc(20, 30, 380, 190, 'v-stock-light');
      const k = 0.95, pw = 70 * k, ph = 40 * k, sp = g * k;
      let x = 26, y = 36, placed = 0;
      for (let i = 0; i < n; i++) {
        if (x + pw > 396) { x = 26; y += ph + sp; }
        if (y + ph > 216) break;
        s += pa(`M${x},${y} h${pw} v${ph * 0.6} l${-pw * 0.3},${ph * 0.4} h${-pw * 0.7}Z`, 'v-chain');
        x += pw + sp; placed++;
      }
      return s + note(placed < n ? `Only ${placed} of ${n} fit: smaller spacing or a bigger sheet` : `${placed} parts fit. Spacing must be more than the tool Ø.`);
    },
  };

  specs['cad-distribute'] = {
    title: 'Distribute',
    controls: [{ type: 'range', key: 'gap', label: 'Gap between', min: 0, max: 60, step: 5, unit: ' mm' }],
    init: { gap: 20 },
    draw({ gap }) {
      let s = view('Equal spacing in X');
      let x = 40;
      [50, 30, 70, 40].forEach((w) => { s += rc(x, 100, w, 50, 'v-chain'); x += w + gap; });
      return s + note('Spaces the selected shapes evenly by a gap or between two ends');
    },
  };

  specs['cad-stretch'] = {
    title: 'Stretch',
    controls: [{ type: 'range', key: 'd', label: 'Stretch by', min: -40, max: 80, step: 5, unit: ' mm' }],
    init: { d: 40 },
    draw({ d }) {
      let s = view('Window the right end, then move it');
      const x1 = 260 + d;
      s += rc(230, 60, 120, 140, 'c-ref') + tx(290, 54, 'window', 'v-label', 'middle');
      s += pa(`M60,90 H${x1} V170 H60Z`, 'v-chain') + ci(120, 130, 15, 'v-chain') + ci(x1 - 40, 130, 15, 'v-chain');
      return s + note('Entities fully inside the window move; lines crossing it stretch. The hole on the left stays put.');
    },
  };

  // ---------------------------------------------------------------- solids
  specs['cad-primitive'] = {
    title: 'Solid primitives',
    controls: [{ type: 'seg', key: 't', label: 'Primitive', options: [['block', 'Block'], ['cyl', 'Cylinder'], ['sph', 'Sphere'], ['cone', 'Cone']] }],
    init: { t: 'block' },
    draw({ t }) {
      let s = view('Placed at the base point you click');
      if (t === 'block') s += box(0, 0, 0, 120, 80, 50, { ox: 190, oy: 110 });
      if (t === 'cyl') s += cylIso(210, 80, 70, 100);
      if (t === 'sph') s += ci(210, 125, 75, 'v-stock-light') + `<ellipse cx="210" cy="125" rx="75" ry="22" class="v-ink-thin"/>`;
      if (t === 'cone') s += pa('M140,190 L210,50 L280,190', 'v-stock') + `<ellipse cx="210" cy="190" rx="70" ry="20" class="v-stock-light"/>`;
      return s + note('Quick stock, fixtures and soft-jaw blocks: type the sizes, click the base point');
    },
  };

  specs['cad-revolve'] = {
    title: 'Revolve',
    controls: [{ type: 'range', key: 'a', label: 'Angle', min: 30, max: 360, step: 30, unit: '°' }],
    init: { a: 270 },
    draw({ a }) {
      let s = view('Profile + axis → solid');
      s += pa('M60,200 V120 H100 V90 H140 V200Z', 'v-chain') + ln(60, 40, 60, 220, 'c-ref') + tx(64, 36, 'axis', 'v-label');
      const cx = 290, cy = 125, R = 80, t = (a * Math.PI) / 180;
      const end = [cx + R * Math.cos(-Math.PI / 2 + t), cy + R * 0.5 * Math.sin(-Math.PI / 2 + t)];
      s += a >= 360 ? `<ellipse cx="${cx}" cy="${cy}" rx="${R}" ry="${R / 2}" class="v-stock-light"/>` : pa(`M${cx},${cy} L${cx},${cy - R / 2} A${R},${R / 2} 0 ${a > 180 ? 1 : 0} 1 ${end[0]},${end[1]}Z`, 'v-stock-light');
      s += `<ellipse cx="${cx}" cy="${cy}" rx="${R / 2}" ry="${R / 4}" class="v-air"/>`;
      return s + note(a >= 360 ? 'Full turn: a turned part' : `${a}° of a full turn`);
    },
  };

  specs['cad-boolean'] = {
    title: 'Boolean',
    controls: [{ type: 'seg', key: 't', label: 'Type', options: [['add', 'Add'], ['rem', 'Remove'], ['com', 'Common']] }],
    init: { t: 'rem' },
    draw({ t }) {
      let s = view('Target block + tool cylinder');
      const blk = rc(110, 80, 160, 100, 'v-stock-light'), cylA = ci(270, 130, 50, 'v-stock-light');
      if (t === 'add') s += blk + cylA;
      if (t === 'rem') s += `<clipPath id="bo-c"><rect x="110" y="80" width="160" height="100"/></clipPath>` + blk + `<circle cx="270" cy="130" r="50" class="v-air" clip-path="url(#bo-c)"/>`;
      if (t === 'com') s += `<clipPath id="bo-c2"><rect x="110" y="80" width="160" height="100"/></clipPath><circle cx="270" cy="130" r="50" class="v-stock-light" clip-path="url(#bo-c2)"/>`;
      s += rc(110, 80, 160, 100, 'c-ref') + ci(270, 130, 50, 'c-ref');
      return s + note({ add: 'One body from both', rem: 'Tool body is cut out of the target (keep the tool body with an option)', com: 'Only the volume both share' }[t]);
    },
  };

  specs['cad-hole'] = {
    title: 'Solid Hole',
    controls: [
      { type: 'seg', key: 't', label: 'Type', options: [['simple', 'Simple'], ['cb', 'Counterbore'], ['cs', 'Countersink'], ['tap', 'Tapped']] },
      { type: 'range', key: 'd', label: 'Diameter', min: 4, max: 20, step: 1, unit: ' mm' },
    ],
    init: { t: 'cb', d: 8 },
    draw({ t, d }) {
      let s = view('Section through the hole');
      const cx = 210, top = 50, bot = 172, k = 5, r = (d / 2) * k;
      // left half profile from the outside edge to the hole axis, then mirrored
      let L = [[40, top], [cx - r, top]];
      if (t === 'cb') L = [[40, top], [cx - r * 1.8, top], [cx - r * 1.8, top + 40], [cx - r, top + 40]];
      if (t === 'cs') L = [[40, top], [cx - r * 1.9, top], [cx - r, top + r * 0.9]];
      const left = [...L, [cx - r, bot], [40, bot]];
      const right = left.map(([x, y]) => [2 * cx - x, y]);
      s += poly(left, 'v-hatch-fill') + poly(right, 'v-hatch-fill');
      if (t === 'tap') for (let y = top + 10; y < bot - 10; y += 10) s += ln(cx - r - 4, y, cx - r, y + 5, 'v-ink-thin') + ln(cx + r + 4, y, cx + r, y + 5, 'v-ink-thin');
      s += tx(cx, bot + 18, `${t === 'tap' ? 'M' + d : 'Ø' + d}${t === 'cb' ? ' + counterbore' : t === 'cs' ? ' + 90° countersink' : ''}`, 'v-label-strong', 'middle');
      return s + note('The hole keeps its type: Hole Definition can then pick it as one feature for spot, drill and tap');
    },
  };

  specs['cad-pattern'] = {
    title: 'Solid patterns',
    controls: [
      { type: 'seg', key: 't', label: 'Pattern', options: [['rect', 'Rectangular'], ['circ', 'Circular']] },
      { type: 'range', key: 'n', label: 'Count', min: 2, max: 12, step: 1, unit: '' },
    ],
    init: { t: 'circ', n: 6 },
    draw({ t, n }) {
      let s = view('Top view of a plate');
      s += rc(60, 30, 300, 170, 'v-hatch-fill');
      if (t === 'circ') { s += ci(210, 125, 70, 'c-ref'); for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 - Math.PI / 2; s += ci(210 + 70 * Math.cos(a), 125 + 70 * Math.sin(a), 9, i ? 'v-air' : 'v-num-a'); } }
      else { const cols = Math.min(n, 6), rows = Math.ceil(n / 6); let c = 0; for (let j = 0; j < rows; j++) for (let i = 0; i < cols && c < n; i++, c++) s += ci(100 + i * 44, 80 + j * 50, 9, c ? 'v-air' : 'v-num-a'); }
      return s + note('The first feature (filled) is copied: change it and every copy follows');
    },
  };

  specs['cad-solid-fillet'] = {
    title: 'Solid fillet and chamfer',
    controls: [
      { type: 'seg', key: 't', label: 'Type', options: [['fil', 'Constant fillet'], ['ch', 'One distance chamfer']] },
      { type: 'range', key: 'r', label: 'Size', min: 0, max: 15, step: 1, unit: ' mm' },
    ],
    init: { t: 'fil', r: 6 },
    draw({ t, r }) {
      let s = view('Section through an edge');
      const x = 260, y = 70, k = 6, R = r * k;
      const d = t === 'fil' ? `M40,${y} H${x - R} A${R},${R} 0 0 1 ${x},${y + R} V210 H40Z` : `M40,${y} H${x - R} L${x},${y + R} V210 H40Z`;
      s += pa(d, 'v-hatch-fill');
      if (R) s += pa(`M${x - R},${y} H${x} V${y + R}`, 'c-ref');
      return s + note(t === 'fil' ? `R${r}: needs a ball or bull nose tool, or a corner-rounding cutter` : `${r} × 45°: a chamfer mill along the edge`);
    },
  };

  specs['cad-shell'] = {
    title: 'Shell / Thicken',
    controls: [{ type: 'range', key: 't', label: 'Thickness', min: 1, max: 15, step: 1, unit: ' mm' }],
    init: { t: 4 },
    draw({ t }) {
      let s = view('Section: shell with the top face removed');
      const k = 4, x0 = 80, x1 = 340, y0 = 60, y1 = 200;
      s += pa(`M${x0},${y0} V${y1} H${x1} V${y0} H${x1 - t * k} V${y1 - t * k} H${x0 + t * k} V${y0}Z`, 'v-hatch-fill');
      return s + note(`${t} mm walls and floor: a housing from a block in one step`);
    },
  };

  specs['cad-draft'] = {
    title: 'Draft Faces',
    controls: [{ type: 'range', key: 'a', label: 'Draft angle', min: 0, max: 15, step: 1, unit: '°' }],
    init: { a: 5 },
    draw({ a }) {
      let s = view('Section through a boss');
      const t = Math.tan((a * Math.PI) / 180) * 140;
      s += pa(`M${150 - t},200 L150,60 H270 L${270 + t},200Z`, 'v-hatch-fill') + ln(150, 60, 150, 200, 'c-ref');
      return s + note(`${a}° draft: a straight end mill leaves steps; use a tapered tool or a 3D path`);
    },
  };

  specs['cad-trim-plane'] = {
    title: 'Trim to Plane / Surface',
    controls: [
      { type: 'range', key: 'z', label: 'Plane height', min: 10, max: 140, step: 5, unit: ' mm' },
      { type: 'seg', key: 'k', label: 'Keep', options: [['below', 'Below'], ['above', 'Above']] },
    ],
    init: { z: 80, k: 'below' },
    draw({ z, k }) {
      let s = view('Side view');
      const y = 210 - z;
      s += `<clipPath id="tp-c"><rect x="0" y="${k === 'below' ? y : 0}" width="${W}" height="${k === 'below' ? H - y : y}"/></clipPath>`;
      s += `<g clip-path="url(#tp-c)">${pa('M80,210 V100 Q210,10 340,100 V210Z', 'v-hatch-fill')}</g>` + pa('M80,210 V100 Q210,10 340,100 V210Z', 'c-ref');
      s += ln(40, y, 380, y, 'v-chain');
      return s + note('Cuts the body with a plane and keeps the side you choose');
    },
  };

  specs['cad-layout'] = {
    title: 'Layout (2D drawing from the solid)',
    controls: [{ type: 'seg', key: 'v', label: 'Views', options: [['3', '3 views'], ['4', '3 views + iso']] }],
    init: { v: '4' },
    draw({ v }) {
      let s = view('Sheet with standard views');
      s += rc(20, 30, 380, 200, 'v-stock-light');
      s += rc(50, 60, 120, 60, 'v-chain') + tx(110, 54, 'Top', 'v-label', 'middle');
      s += rc(50, 150, 120, 40, 'v-chain') + tx(110, 206, 'Front', 'v-label', 'middle');
      s += rc(200, 150, 60, 40, 'v-chain') + tx(230, 206, 'Right', 'v-label', 'middle');
      if (v === '4') s += box(0, 0, 0, 60, 30, 20, { ox: 330, oy: 90 });
      return s + note('Flat wireframe views from the solid, ready to dimension in Drafting');
    },
  };

  specs['cad-impression'] = {
    title: 'Impression / Solids from surfaces',
    controls: [{ type: 'seg', key: 't', label: 'Function', options: [['imp', 'Impression'], ['sfs', 'Solid from surfaces']] }],
    init: { t: 'imp' },
    draw({ t }) {
      let s = view('Section');
      if (t === 'imp') s += pa('M60,200 V80 H360 V200Z', 'v-hatch-fill') + pa('M150,80 Q210,170 270,80Z', 'v-air') + tx(210, 70, 'part pressed in', 'v-label', 'middle') + tx(210, 220, 'soft jaw or nest from the part shape', 'v-label', 'middle');
      else s += pa('M80,180 Q210,60 340,180', 'c-ref') + pa('M80,180 H340', 'c-ref') + pa('M80,180 Q210,60 340,180 Z', 'v-stock-light');
      return s + note(t === 'imp' ? 'Cuts the shape of one body into another: soft jaws in seconds' : 'A closed set of surfaces becomes a solid');
    },
  };

  // ---------------------------------------------------------------- model prep
  specs['cad-hole-axis'] = {
    title: 'Hole Axis',
    controls: [{ type: 'seg', key: 'o', label: 'Create', options: [['line', 'Axis lines'], ['pt', 'Points top'], ['both', 'Lines + points']] }],
    init: { o: 'both' },
    draw({ o }) {
      let s = view('Section through holes in a solid');
      s += rc(40, 80, 340, 110, 'v-hatch-fill');
      [100, 210, 320].forEach((x, i) => {
        const d = [16, 24, 12][i];
        s += rc(x - d / 2, 80, d, i === 1 ? 110 : 70, 'v-air');
        if (o !== 'pt') s += ln(x, 60, x, i === 1 ? 200 : 160, 'v-chain');
        if (o !== 'line') s += ci(x, 80, 4, 'v-num-a');
      });
      return s + note('Lines along each hole and points on top: Hole Definition and drill toolpaths can use them');
    },
  };

  specs['cad-mp-move'] = {
    title: 'Model Prep: Move and Split faces',
    controls: [
      { type: 'seg', key: 't', label: 'Function', options: [['move', 'Move'], ['split', 'Split Solid Faces']] },
      { type: 'range', key: 'd', label: 'Move by', min: -20, max: 30, step: 2, unit: ' mm' },
    ],
    init: { t: 'move', d: 10 },
    draw({ t, d }) {
      let s = view('Top view of a body');
      const k = 3;
      s += rc(80, 70, 240, 110, 'v-hatch-fill');
      if (t === 'move') s += rc(150 + d * k, 100, 60, 50, 'v-air') + rc(150, 100, 60, 50, 'c-ref') + tx(180 + d * k, 168, `pocket moved ${d}`, 'v-label', 'middle');
      else s += ln(200, 70, 200, 180, 'v-chain') + tx(205, 64, 'split line', 'v-label');
      return s + note(t === 'move' ? 'Moves a feature of an imported STEP without a history tree' : 'Splits a face so part of it can get a different colour or toolpath');
    },
  };

  specs['cad-remove-fillets'] = {
    title: 'Remove Fillets / Faces',
    controls: [{ type: 'seg', key: 'r', label: 'Fillets', options: [['keep', 'As imported'], ['rem', 'Removed']] }],
    init: { r: 'rem' },
    draw({ r }) {
      let s = view('Top view: pocket with R3 corners');
      s += rc(60, 50, 300, 160, 'v-hatch-fill') + rc(110, 90, 200, 80, 'v-air', r === 'keep' ? 18 : 0);
      return s + note(r === 'rem' ? 'Sharp corners: chain the pocket and let the tool radius make the corner' : 'R3 corners need a Ø6 or smaller tool');
    },
  };

  specs['cad-modify-feature'] = {
    title: 'Find Holes / Modify Feature',
    controls: [{ type: 'range', key: 'd', label: 'Hole Ø', min: 4, max: 20, step: 0.5, unit: ' mm' }],
    init: { d: 10 },
    draw({ d }) {
      let s = view('Top view: holes found on an imported body');
      s += rc(60, 50, 300, 160, 'v-hatch-fill');
      [[120, 100], [300, 100], [120, 170], [300, 170]].forEach(([x, y]) => (s += ci(x, y, d * 2, 'v-air') + ci(x, y, d * 2, 'v-chain')));
      return s + note(`Every matching hole changed to Ø${d} without rebuilding the model`);
    },
  };

  specs['cad-history'] = {
    title: 'Remove / Add History',
    controls: [{ type: 'seg', key: 'h', label: 'History', options: [['no', 'Imported (none)'], ['add', 'After Add History']] }],
    init: { h: 'add' },
    draw({ h: hh }) {
      let s = view('Solids Manager');
      const rows = hh === 'no' ? ['Body 1'] : ['Body 1', 'Extrude (base)', 'Hole Ø8 × 4', 'Hole M6 × 2', 'Fillet R2'];
      rows.forEach((r, i) => (s += tx(i ? 84 : 60, 60 + i * 26, r, i ? 'v-label' : 'v-label-strong')));
      return s + note(hh === 'add' ? 'Add History (was Find Features before 2020) turns faces back into operations you can edit' : 'A STEP body is one dumb lump of faces');
    },
  };

  specs['cad-align'] = {
    title: 'Align to Plane / Face / Z',
    controls: [{ type: 'range', key: 'a', label: 'Imported tilt', min: -40, max: 40, step: 5, unit: '°' }],
    init: { a: 25 },
    draw({ a }) {
      let s = view('Front view');
      s += ln(40, 200, 380, 200, 'c-ref') + tx(44, 214, 'Top plane', 'v-label');
      const t = (a * Math.PI) / 180, cx = 140, cy = 140;
      const pts = [[-60, -30], [60, -30], [60, 30], [-60, 30]].map(([x, y]) => [cx + x * Math.cos(t) - y * Math.sin(t), cy + x * Math.sin(t) + y * Math.cos(t)]);
      s += poly(pts, 'v-hatch-fill') + ln(210, 140, 250, 140, 'v-feed') + arrowHead(254, 140, 0, 'v-feed-fill', 8);
      s += rc(270, 140, 120, 60, 'v-hatch-fill');
      return s + note('Pick the face that should sit on the table: the body is rotated flat onto the plane');
    },
  };

  specs['cad-disassemble'] = {
    title: 'Disassemble / Solid Position',
    controls: [{ type: 'seg', key: 'd', label: 'Bodies', options: [['asm', 'Assembled'], ['dis', 'Laid out']] }],
    init: { d: 'dis' },
    draw({ d }) {
      let s = view('An imported assembly');
      if (d === 'asm') s += box(0, 0, 0, 100, 60, 20, { ox: 200, oy: 140 }) + box(20, 10, 20, 60, 40, 30, { ox: 200, oy: 140 }) + box(35, 20, 50, 30, 20, 20, { ox: 200, oy: 140 });
      else s += box(0, 0, 0, 100, 60, 20, { ox: 90, oy: 130 }) + box(0, 0, 0, 60, 40, 30, { ox: 220, oy: 130 }) + box(0, 0, 0, 30, 20, 20, { ox: 330, oy: 130 });
      return s + note('Each body laid flat on its largest face, side by side, ready to program one at a time');
    },
  };

  specs['cad-face-colors'] = {
    title: 'Face colours',
    controls: [{ type: 'seg', key: 'c', label: 'Colour by', options: [['none', 'Imported'], ['type', 'Feature type']] }],
    init: { c: 'type' },
    draw({ c }) {
      let s = view('Top view');
      s += rc(60, 50, 300, 160, 'v-stock-light') + rc(100, 80, 120, 90, c === 'type' ? 'v-sweep' : 'v-stock-light') + ci(290, 125, 20, c === 'type' ? 'v-num-a' : 'v-stock-light');
      if (c === 'type') s += tx(160, 190, 'pocket floor', 'v-label', 'middle') + tx(290, 165, 'holes', 'v-label', 'middle');
      return s + note('Colour faces by job (floors, holes, tolerance faces) so the setup sheet and the programmer see them');
    },
  };

  // ---------------------------------------------------------------- surfaces & mesh
  specs['cad-surf-ops'] = {
    title: 'Surface tools',
    controls: [{ type: 'seg', key: 't', label: 'Function', options: [['prim', 'Primitives'], ['fromsol', 'From solid'], ['fill', 'Fill holes'], ['trim', 'Trim / Extend'], ['blend', 'Fillet / Blend'], ['norm', 'Normals']] }],
    init: { t: 'fill' },
    draw({ t }) {
      let s = view('Section through a surface');
      const base = 'M40,160 Q210,60 380,160';
      if (t === 'prim') s += cylIso(210, 80, 70, 100, 'v-sweep');
      if (t === 'fromsol') s += pa(base + ' V200 H40Z', 'v-hatch-fill') + pa(base, 'v-feed');
      if (t === 'fill') s += pa('M40,160 Q120,90 170,98', 'v-feed') + pa('M250,98 Q300,90 380,160', 'v-feed') + pa('M170,98 Q210,94 250,98', 'v-finish') + tx(210, 86, 'hole patched', 'v-label', 'middle');
      if (t === 'trim') s += pa(base, 'v-feed') + ln(300, 40, 300, 210, 'v-chain') + pa('M300,112 Q340,130 380,160', 'v-label-bad-line');
      if (t === 'blend') s += pa('M40,120 H200 Q240,120 240,160 V210', 'v-feed') + pa('M200,120 Q240,120 240,160', 'v-finish');
      if (t === 'norm') { s += pa(base, 'v-feed'); for (let x = 70; x < 380; x += 50) { const y = 160 - 100 * Math.sin(((x - 40) / 340) * Math.PI) * 0.75; s += ln(x, y, x, y - 26, 'v-ink') + arrowHead(x, y - 28, -Math.PI / 2, 'v-ink-fill', 6); } }
      return s + note({ prim: 'Block, cylinder, sphere… as surfaces', fromsol: 'Surfaces copied from solid faces (for 3D toolpaths or check surfaces)', fill: 'Closes a hole in a surface so a 3D path does not dive into it', trim: 'Trims a surface to a curve, or extends it past an edge', blend: 'A fillet surface between two surfaces', norm: 'Arrows point to the side the tool is on: all should face out' }[t]);
    },
  };

  specs['cad-mesh'] = {
    title: 'Meshes',
    controls: [
      { type: 'seg', key: 't', label: 'Function', options: [['from', 'Mesh from entities'], ['mod', 'Smooth / Decimate'], ['check', 'Check mesh']] },
      { type: 'range', key: 'n', label: 'Facets', min: 6, max: 40, step: 2, unit: '' },
    ],
    init: { t: 'from', n: 14 },
    draw({ t, n }) {
      let s = view('Section through a dome');
      const pts = []; for (let i = 0; i <= n; i++) { const u = Math.PI - (i / n) * Math.PI; pts.push([210 + 150 * Math.cos(u), 200 - 130 * Math.sin(u)]); }
      s += pa('M60,200 Q210,-60 360,200', 'c-ref') + pl(pts, 'v-feed');
      pts.forEach(([x, y]) => (s += ci(x, y, 2.5, 'c-pt')));
      if (t === 'check') s += ci(pts[Math.floor(n / 3)][0], pts[Math.floor(n / 3)][1], 10, 'v-tool-bad') + tx(pts[Math.floor(n / 3)][0], pts[Math.floor(n / 3)][1] - 16, 'open edge', 'v-label-bad', 'middle');
      return s + note({ from: 'Triangles approximate the shape: more facets = closer, heavier file', mod: 'Smooth rounds out a scan, Decimate cuts the facet count', check: 'Finds holes, open edges and flipped facets before you machine it' }[t]);
    },
  };

  // ---------------------------------------------------------------- drafting
  specs['cad-annotate'] = {
    title: 'Notes, hole table and hatch',
    controls: [{ type: 'seg', key: 't', label: 'Function', options: [['note', 'Note + leader'], ['table', 'Hole Table'], ['hatch', 'Cross Hatch']] }],
    init: { t: 'table' },
    draw({ t }) {
      let s = view('On the drawing');
      s += rc(40, 50, 180, 140, 'v-chain');
      [[80, 90], [180, 90], [80, 150], [180, 150]].forEach(([x, y], i) => (s += ci(x, y, 9, 'v-ink') + (t === 'table' ? tx(x + 12, y - 8, 'A' + (i + 1), 'v-label-num') : '')));
      if (t === 'table') { const rows = [['Tag', 'X', 'Y', 'Size'], ['A1', '-50', '20', 'Ø9'], ['A2', '50', '20', 'Ø9'], ['A3', '-50', '-20', 'Ø9'], ['A4', '50', '-20', 'Ø9']]; rows.forEach((r, i) => r.forEach((c, j) => (s += tx(250 + j * 38, 70 + i * 22, c, i ? 'v-label' : 'v-label-strong')))); }
      if (t === 'note') s += ln(180, 90, 280, 60, 'v-ink') + tx(284, 64, '4× Ø9 THRU', 'v-label-strong');
      if (t === 'hatch') s += `<rect x="40" y="50" width="180" height="140" fill="url(#hatch)"/>` + tx(300, 120, 'section hatch', 'v-label', 'middle');
      return s + note('Annotation only: changing a note never changes the geometry');
    },
  };

  // ---------------------------------------------------------------- home
  specs['cad-attrib'] = {
    title: 'Attributes',
    controls: [
      { type: 'seg', key: 'c', label: 'Colour', options: [['blue', 'Blue'], ['amber', 'Amber'], ['grey', 'Grey']] },
      { type: 'seg', key: 'l', label: 'Line style', options: [['solid', 'Solid'], ['dash', 'Dashed']] },
    ],
    init: { c: 'blue', l: 'solid' },
    draw({ c, l }) {
      let s = view('Set before drawing, or change later');
      const cls = { blue: 'v-feed', amber: 'v-rapid-solid', grey: 'v-ink' }[c];
      s += `<g class="${l === 'dash' ? 'v-dashed' : ''}">${rc(80, 70, 200, 110, cls)}${ci(330, 125, 40, cls)}</g>`;
      return s + note('Colour, line style, level and Z depth for new geometry live in the Attributes group on the Home tab');
    },
  };

  specs['cad-dupes'] = {
    title: 'Delete duplicates / Delete / Undelete',
    controls: [{ type: 'seg', key: 't', label: 'Function', options: [['dup', 'Delete duplicates'], ['del', 'Delete'], ['undel', 'Undelete']] }],
    init: { t: 'dup' },
    draw({ t }) {
      let s = view('Top view');
      const lines = [[60, 100, 200, 100], [60, 100, 200, 100], [60, 160, 200, 160], [240, 100, 360, 160]];
      lines.forEach(([a, b, c, d], i) => {
        const gone = (t === 'dup' && i === 1) || (t === 'del' && i === 3);
        s += ln(a + (i === 1 ? 3 : 0), b + (i === 1 ? 3 : 0), c + (i === 1 ? 3 : 0), d + (i === 1 ? 3 : 0), gone ? 'v-label-bad-line' : 'v-ink');
      });
      return s + note({ dup: 'Two lines on top of each other: chaining stops at them. Delete Duplicates keeps one.', del: 'Delete what you select', undel: 'Brings back the last deleted entities (one at a time or all)' }[t]);
    },
  };

  specs['cad-hide'] = {
    title: 'Hide, unhide and blank',
    controls: [{ type: 'seg', key: 't', label: 'Function', options: [['all', 'Everything shown'], ['hide', 'Hide (show only selected)'], ['blank', 'Blank selected']] }],
    init: { t: 'hide' },
    draw({ t }) {
      let s = view('Top view');
      const ents = [['rc', 60, 60], ['ci', 250, 110], ['rc', 300, 150]];
      ents.forEach(([k, x, y], i) => {
        const sel = i === 1;
        const shown = t === 'all' || (t === 'hide' && sel) || (t === 'blank' && !sel);
        if (!shown) return;
        s += k === 'rc' ? rc(x, y, 90, 60, 'v-chain') : ci(x, y, 40, sel ? 'v-feed' : 'v-chain');
      });
      return s + note('Temporary: hidden entities are still there and still on their level');
    },
  };

  specs['cad-analyze'] = {
    title: 'Analyze',
    controls: [{ type: 'seg', key: 't', label: 'Function', options: [['ent', 'Entity'], ['dist', 'Distance'], ['chain', 'Chain'], ['tp', 'Toolpath'], ['stats', 'Statistics']] }],
    init: { t: 'ent' },
    draw({ t }) {
      let s = view('Click an entity to see what it is');
      s += pa('M40,190 H180 A60,60 0 0 0 240,130 V60', 'v-ink');
      const info = {
        ent: [['Arc', ''], ['Radius', '60.000'], ['Centre', '200, 130'], ['Sweep', '90°']],
        dist: [['Distance', '184.39'], ['ΔX', '200'], ['ΔY', '130']],
        chain: [['Overlaps', '0'], ['Short entities', '1 (0.004)'], ['Direction', 'CW']],
        tp: [['Move', 'G1 Z-5.'], ['Feed', '1200'], ['Op', '3 - Contour']],
        stats: [['Lines', '2'], ['Arcs', '1'], ['Solids', '0']],
      }[t];
      if (t === 'ent') s += pa('M180,190 A60,60 0 0 0 240,130', 'v-feed');
      if (t === 'dist') s += ln(40, 190, 240, 60, 'c-dim');
      if (t === 'chain') s += ci(180, 190, 8, 'v-tool-bad');
      s += panel(282, 36, 132, info, 'Result');
      return s + note({ ent: 'Analyze Entity: change a value in the panel to edit the entity', dist: 'Distance between two points, with ΔX ΔY', chain: 'Finds tiny entities and overlaps that break chaining', tp: 'Click on a toolpath to see that move, feed and its operation', stats: 'Counts what is in the file' }[t]);
    },
  };

  specs['cad-finder'] = {
    title: 'Command Finder',
    controls: [{ type: 'seg', key: 'q', label: 'Typed', options: [['tri', 'trim'], ['bol', 'bolt'], ['ch', 'chamfer']] }],
    init: { q: 'tri' },
    draw({ q }) {
      let s = view('Type a word, run the function');
      const res = { tri: ['Trim to Entities', 'Trim to Point', 'Dynamic Trim', 'Trim to Plane'], bol: ['Bolt Circle'], ch: ['Chamfer Entities', 'One Distance Chamfer', 'Model Chamfer (toolpath)'] }[q];
      s += rc(60, 40, 300, 30, 'v-air', 4) + tx(72, 60, { tri: 'trim', bol: 'bolt', ch: 'chamfer' }[q] + '|', 'v-label-strong');
      res.forEach((r, i) => (s += rc(60, 76 + i * 30, 300, 28, i ? 'v-stock-light' : 'v-sweep', 3) + tx(72, 95 + i * 30, r, 'v-label')));
      return s + note('Top right of the ribbon: faster than hunting through tabs');
    },
  };

  // ---------------------------------------------------------------- view
  specs['cad-views'] = {
    title: 'Graphic views',
    controls: [{ type: 'seg', key: 'v', label: 'View', options: [['top', 'Top'], ['front', 'Front'], ['iso', 'Isometric']] }],
    init: { v: 'iso' },
    draw({ v }) {
      let s = view(`${v[0].toUpperCase() + v.slice(1)} view`);
      if (v === 'top') s += rc(100, 60, 220, 130, 'v-stock-light') + rc(150, 90, 120, 70, 'v-air');
      if (v === 'front') s += pa('M100,190 V100 H150 V140 H270 V100 H320 V190Z', 'v-stock-light');
      if (v === 'iso') s += box(0, 0, 0, 160, 100, 50, { ox: 200, oy: 90 });
      return s + note('Changing the graphic view does not change the Cplane: that is what you draw on');
    },
  };

  specs['cad-section'] = {
    title: 'Section view and display',
    controls: [
      { type: 'range', key: 'c', label: 'Section position', min: 20, max: 140, step: 5, unit: ' mm' },
      { type: 'seg', key: 'd', label: 'Display', options: [['shaded', 'Shaded'], ['trans', 'Translucent']] },
    ],
    init: { c: 80, d: 'shaded' },
    draw({ c, d }) {
      let s = view('Cut through the part to see inside');
      const x = 40 + c * 2;
      s += `<clipPath id="sv-c"><rect x="0" y="0" width="${x}" height="${H}"/></clipPath>`;
      s += `<g clip-path="url(#sv-c)" class="${d === 'trans' ? 'v-trans' : ''}">${rc(60, 60, 300, 140, 'v-stock-light')}${rc(130, 60, 70, 100, 'v-air')}${rc(250, 60, 40, 140, 'v-air')}</g>`;
      s += ln(x, 40, x, 220, 'v-chain') + tx(x + 4, 36, 'section plane', 'v-label');
      return s + note('Section View (2019+) shows pockets and toolpaths inside the part');
    },
  };

  specs['cad-managers'] = {
    title: 'Managers',
    controls: [{ type: 'seg', key: 'm', label: 'Manager', options: [['tp', 'Toolpaths'], ['sol', 'Solids'], ['pl', 'Planes'], ['lv', 'Levels']] }],
    init: { m: 'tp' },
    draw({ m }) {
      let s = view('Panel on the left of the screen');
      const rows = { tp: ['Machine Group-1', '  Toolpath Group-1', '    1 - Face  T1', '    2 - Dynamic Mill  T2', '    3 - Drill  T5'], sol: ['Body 1', '  Extrude', '  Hole', '  Fillet'], pl: ['Top (WCS, C, T)', 'Front', 'Right', 'Op 2 - Bottom'], lv: ['1  Part', '10 Vise', '20 Chains', '100 Stock'] }[m];
      rows.forEach((r, i) => { const ind = r.match(/^ */)[0].length; s += tx(60 + ind * 8, 60 + i * 28, r.trim(), i ? 'v-label' : 'v-label-strong'); });
      return s + note('Toolpaths, Solids, Planes and Levels managers dock in the same place: tabs at the bottom');
    },
  };

  specs['cad-grid'] = {
    title: 'Grid and snap',
    controls: [{ type: 'range', key: 'g', label: 'Grid spacing', min: 5, max: 40, step: 5, unit: ' mm' }],
    init: { g: 10 },
    draw({ g }) {
      let s = view('Snap to grid: clicks land on the grid points');
      const k = 2;
      for (let x = 40; x <= 380; x += g * k) for (let y = 40; y <= 210; y += g * k) s += ci(x, y, 1.5, 'c-pt');
      const snapX = 40 + Math.round(123 / (g * k)) * g * k, snapY = 40 + Math.round(97 / (g * k)) * g * k;
      s += ci(163, 137, 4, 'v-label-bad-fill') + ln(163, 137, snapX, snapY, 'v-ink-thin') + ci(snapX, snapY, 6, 'v-num-a');
      return s + note('Handy for sketches; for real parts type the coordinates instead');
    },
  };

  // ---------------------------------------------------------------- machine
  specs['cad-machine-type'] = {
    title: 'Machine type',
    controls: [{ type: 'seg', key: 'm', label: 'Machine', options: [['mill', 'Mill'], ['lathe', 'Lathe'], ['router', 'Router'], ['wire', 'Wire']] }],
    init: { m: 'mill' },
    draw({ m }) {
      let s = view('Picks the machine definition, post and toolpaths');
      const tabs = { mill: ['2D', '3D', 'Multiaxis', 'Drill'], lathe: ['Rough', 'Finish', 'Groove', 'Thread'], router: ['2D', 'Block drill', 'Saw'], wire: ['Contour', '4 axis', 'No core'] }[m];
      tabs.forEach((t, i) => (s += rc(40 + i * 90, 90, 80, 50, 'v-stock-light', 4) + tx(80 + i * 90, 120, t, 'v-label-strong', 'middle')));
      return s + note('A Machine Group is created: the Toolpaths tab now shows that machine\'s toolpaths');
    },
  };

  specs['cad-stock'] = {
    title: 'Stock setup (Machine Group Setup)',
    controls: [
      { type: 'range', key: 'x', label: 'Extra on X/Y', min: 0, max: 10, step: 0.5, unit: ' mm' },
      { type: 'range', key: 'z', label: 'Extra on top', min: 0, max: 5, step: 0.5, unit: ' mm' },
    ],
    init: { x: 2, z: 1 },
    draw({ x, z }) {
      let s = view('Front view: part 100 × 30, stock around it');
      const k = 2.6, X = 210, top = 90, w = 100 * k, hh = 30 * k;
      s += rc(X - w / 2 - x * k, top - z * k * 3, w + 2 * x * k, hh + z * k * 3, 'v-stock-light') + rc(X - w / 2, top, w, hh, 'v-hatch-fill');
      s += tx(X, top + hh + 24, `Stock ${(100 + 2 * x).toFixed(1)} × ${(30 + z).toFixed(1)}`, 'v-label-strong', 'middle');
      return s + note('Stock shows in Backplot/Verify and drives Facing and dynamic toolpaths (in Machine Group Properties before 2023)');
    },
  };

  specs['cad-sim'] = {
    title: 'Backplot, Verify, Simulate',
    controls: [{ type: 'seg', key: 't', label: 'Tool', options: [['bp', 'Backplot'], ['ver', 'Verify'], ['sim', 'Machine Simulation']] }],
    init: { t: 'ver' },
    draw({ t }) {
      let s = view('What each one shows');
      if (t === 'bp') s += pa('M80,180 H340 V80 H80Z', 'v-feed') + pa('M60,40 V80 H80', 'v-rapid');
      if (t === 'ver') s += rc(60, 60, 300, 140, 'v-stock-light') + rc(100, 90, 220, 80, 'v-air', 10) + ci(320, 170, 12, 'v-tool-bad') + tx(320, 196, 'gouge shown red', 'v-label-bad', 'middle');
      if (t === 'sim') s += rc(60, 160, 300, 40, 'v-stock') + rc(150, 110, 120, 50, 'v-stock-light') + rc(195, 30, 30, 80, 'v-part') + tx(210, 225, 'table, vise, head and travel limits', 'v-label', 'middle');
      return s + note({ bp: 'Tool lines only: fast check of moves and rapids', ver: 'Removes material from the stock: rest, gouges, collisions with holder', sim: 'The whole machine moving: axis limits and fixtures (Vericut goes further)' }[t]);
    },
  };

  specs['cad-post'] = {
    title: 'Post (Generate G1)',
    controls: [{ type: 'seg', key: 'c', label: 'Control', options: [['fanuc', 'Fanuc'], ['haas', 'Haas'], ['hh', 'Heidenhain']] }],
    init: { c: 'fanuc' },
    draw({ c }) {
      let s = view('Same toolpath, different post');
      const code = { fanuc: ['%', 'O0001', 'T2 M06', 'G90 G54 G0 X-50. Y20.', 'S8000 M03', 'G43 H2 Z50.', 'G1 Z-5. F400.'], haas: ['%', 'O00001', 'T2 M06', 'G00 G90 G54 X-50. Y20. S8000 M03', 'G43 H02 Z50. M08', 'G01 Z-5. F400.'], hh: ['0 BEGIN PGM 1 MM', '1 TOOL CALL 2 Z S8000', '2 L X-50 Y+20 R0 FMAX M3', '3 L Z+50 FMAX', '4 L Z-5 F400'] }[c];
      code.forEach((l, i) => (s += tx(40, 50 + i * 24, l, 'v-label-num')));
      return s + note('The post turns the toolpaths into the control\'s code: always use the post made for your machine');
    },
  };

  specs['cad-setup-sheet'] = {
    title: 'Setup sheet',
    controls: [{ type: 'seg', key: 's', label: 'Section', options: [['tools', 'Tool list'], ['ops', 'Operations'], ['setup', 'Setup picture']] }],
    init: { s: 'tools' },
    draw({ s: sec }) {
      let s = view('What the operator gets with the program');
      if (sec === 'tools') [['T1', 'Ø50 face mill', '30 mm'], ['T2', 'Ø10 HEM 3FL', '35 mm'], ['T5', 'Ø6.8 drill', '45 mm']].forEach((r, i) => r.forEach((c, j) => (s += tx(50 + j * 110, 70 + i * 28, c, j ? 'v-label' : 'v-label-strong'))));
      if (sec === 'ops') ['1 Face  T1  2 min', '2 Dynamic Mill  T2  6 min', '3 Drill  T5  1 min'].forEach((r, i) => (s += tx(50, 70 + i * 28, r, 'v-label')));
      if (sec === 'setup') s += rc(80, 140, 260, 50, 'v-stock') + rc(130, 90, 160, 50, 'v-hatch-fill') + ci(130, 140, 5, 'v-num-a') + tx(140, 160, 'X0 Y0 here, Z0 top', 'v-label');
      return s + note('Tools, stick-out, times and the zero point: print it or send it as PDF/HTML');
    },
  };

  for (const k of Object.keys(specs)) if (!before.has(k)) { const d = specs[k].draw; specs[k].draw = (v) => hatch + d(v); }
}
