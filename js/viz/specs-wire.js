// Visuals for the 3D toolpaths of the 2D tab: Model Chamfer and the wireframe toolpaths
// (Swept 2D/3D, Revolved, Lofted, Ruled, Coons). All of them are interactive: sliders or a tap
// on the drawing change the shape, and the numbers are worked out live.

export function addWireSpecs(specs, h) {
  const { W, H, ln, pl, ci, rc, tx, pa, hatch } = h;
  const before = new Set(Object.keys(specs));
  const note = (s) => {
    if (s.length <= 66) return tx(W - 10, H - 10, s, 'v-label', 'end');
    let i = s.lastIndexOf(' ', Math.ceil(s.length / 2) + 6); if (i < 10) i = s.indexOf(' ', s.length / 2);
    return tx(W - 10, H - 24, s.slice(0, i), 'v-label', 'end') + tx(W - 10, H - 10, s.slice(i + 1), 'v-label', 'end');
  };
  const view = (s) => tx(W - 10, 16, s, 'v-label', 'end');
  const f = (n, d = 3) => (+n.toFixed(d)).toString();
  const poly = (pts, c) => (pts.length > 1 ? pl(pts, c) : '');
  const polygon = (pts, c) => `<polygon points="${pts.map((p) => p.map((n) => +n.toFixed(2)).join(',')).join(' ')}" class="${c}"/>`;
  // isometric-ish projection, x to the right-down, y to the right-up, z up
  const iso = (ox, oy, k) => (x, y, z) => [ox + (x + y) * 0.866 * k, oy + (x - y) * 0.5 * k - z * k];

  // ---------------------------------------------------------------- shared wireframe fields
  specs['wf-scallop'] = {
    title: 'Ball stepover and scallop height',
    controls: [
      { type: 'range', key: 's', label: 'Stepover', min: 0.1, max: 5, step: 0.1, unit: ' mm' },
      { type: 'range', key: 'R', label: 'Ball radius', min: 1, max: 10, step: 0.5, unit: ' mm' },
    ],
    init: { s: 1, R: 5 },
    draw({ s, R }) {
      const hgt = s >= 2 * R ? R : R - Math.sqrt(R * R - (s / 2) ** 2);
      let o = view('Section across the passes, true scale');
      const k = Math.min(26, 250 / (4 * s + 2 * R), 55 / R), y0 = 180, x0 = 30;
      o += rc(x0 - 10, y0, 270, 20, 'v-hatch-fill');
      const n = Math.max(2, Math.min(9, Math.floor(250 / (s * k)) + 1));
      for (let i = 0; i < n; i++) {
        const cx = x0 + R * k + i * s * k;
        if (cx > 290) break;
        o += ci(cx, y0 - R * k, R * k, i === 1 ? 'v-tool' : 'v-tool-ghost');
      }
      o += ln(x0 + R * k, y0 - 2 * R * k - 8, x0 + R * k + s * k, y0 - 2 * R * k - 8, 'c-dim') + tx(x0 + R * k + (s * k) / 2, y0 - 2 * R * k - 12, `${s} mm`, 'v-label-strong', 'middle');
      // magnified inset of one cusp
      const ix = 310, iy = 50, iw = 100, ih = 80;
      o += rc(ix, iy, iw, ih, 'v-air');
      const E = hgt > 0 ? (ih * 0.6) / hgt : 1;
      const pts = [];
      for (let i = 0; i <= 40; i++) {
        const u = -s / 2 + (i / 40) * s; // distance from cusp centre, between two balls at ±s/2
        const d = Math.min(Math.abs(u - s / 2), Math.abs(u + s / 2));
        const z = d >= R ? R : R - Math.sqrt(R * R - d * d);
        pts.push([ix + 5 + (i / 40) * (iw - 10), iy + ih - 10 - Math.min(z, hgt) * E]);
      }
      o += pl(pts, 'v-feed') + tx(ix + iw / 2, iy - 6, 'one cusp, height ×' + f(E / 26, 0), 'v-label', 'middle');
      o += tx(ix, iy + ih + 18, `h = ${f(hgt, 4)} mm`, hgt > 0.02 ? 'v-label-bad' : 'v-label-strong');
      o += tx(ix, iy + ih + 34, 'h = R − √(R² − (s/2)²)', 'v-label');
      return o + note(hgt > 0.02 ? 'Over 0.02 mm the passes show on the part: smaller stepover or bigger ball' : 'Under 0.01 mm reads as a ground finish on most parts');
    },
  };

  specs['wf-tolerance'] = {
    title: 'Cut tolerance: chords on a curve',
    controls: [{ type: 'range', key: 't', label: 'Cut tolerance', min: 0.002, max: 0.2, step: 0.002, unit: ' mm' }],
    init: { t: 0.025 },
    draw({ t }) {
      const R = 20, k = 7, cx = 40, cy = 205;
      const th = 2 * Math.acos(1 - t / R), n = Math.max(1, Math.ceil(Math.PI / 2 / th));
      let o = view('A 90° arc, R20, made of straight G1 moves');
      o += pa(`M${cx + R * k},${cy} A${R * k},${R * k} 0 0 0 ${cx},${cy - R * k}`, 'v-chain');
      const pts = [];
      for (let i = 0; i <= n; i++) { const a = (i / n) * (Math.PI / 2); pts.push([cx + R * k * Math.cos(a), cy - R * k * Math.sin(a)]); }
      o += pl(pts, 'v-feed') + pts.map((p) => ci(p[0], p[1], 2.2, 'v-feed-fill')).join('');
      // program size for a 100×60 face at 0.5 mm stepover, average radius 20
      const L = (100 * 60) / 0.5, seg = 2 * R * Math.sin(th / 2), lines = Math.round(L / seg), kb = Math.round((lines * 28) / 1024);
      o += tx(230, 70, `${n} moves on this arc`, 'v-label-strong');
      o += tx(230, 92, `each ${f(seg, 2)} mm long`, 'v-label');
      o += tx(230, 130, 'A 100 × 60 shape at 0.5 stepover:', 'v-label');
      o += tx(230, 150, `≈ ${lines.toLocaleString('en')} lines, ${kb.toLocaleString('en')} kB`, kb > 2000 ? 'v-label-bad' : 'v-label-strong');
      return o + note(kb > 2000 ? 'Big program: the control may starve and slow down, or need DNC' : 'Finishing 0.005–0.01 mm, roughing 0.025 mm or more');
    },
  };

  specs['wf-method'] = {
    title: 'Zigzag or One way',
    controls: [{ type: 'seg', key: 'm', label: 'Cutting method', options: [['zig', 'Zigzag'], ['one', 'One way']] }],
    init: { m: 'zig' },
    draw({ m }) {
      let o = view('Top view of the shape');
      const x0 = 50, x1 = 330, y0 = 50, n = 7, dy = 22;
      o += rc(x0 - 10, y0 - 12, x1 - x0 + 20, (n - 1) * dy + 24, 'v-stock-light');
      let cut = 0, air = 0;
      for (let i = 0; i < n; i++) {
        const y = y0 + i * dy, rev = m === 'zig' && i % 2;
        const a = rev ? x1 : x0, b = rev ? x0 : x1;
        o += ln(a, y, b, y, 'v-feed') + h.arrowHead(b, y, rev ? Math.PI : 0, 'v-feed-fill', 6);
        cut += x1 - x0;
        if (i < n - 1) {
          if (m === 'zig') { o += ln(b, y, b, y + dy, 'v-feed'); cut += dy; } else { o += ln(x1, y, x0, y + dy, 'v-rapid'); air += Math.hypot(x1 - x0, dy) + 2 * 20; }
        }
      }
      const tot = cut + air;
      o += tx(x0, y0 + n * dy + 8, m === 'zig' ? 'cuts both ways, steps over at the end' : 'up, back above the part, down, cut again', 'v-label');
      return o + note(m === 'zig' ? `100% of the moves cut. Half the passes climb, half are conventional.` : `${Math.round((air / tot) * 100)}% of the motion is air, but every pass cuts the same way`);
    },
  };

  // generic iso drawing of a shape with "along" or "across" passes
  const passes = (o, P, nU, nV, surf, along) => {
    // surf(u,v) -> [x,y,z]; u along the length, v across the profile
    const lines = [];
    if (along) for (let j = 0; j <= nV; j++) { const pts = []; for (let i = 0; i <= 30; i++) pts.push(P(...surf(i / 30, j / nV))); lines.push(pts); }
    else for (let i = 0; i <= nU; i++) { const pts = []; for (let j = 0; j <= 16; j++) pts.push(P(...surf(i / nU, j / 16))); lines.push(pts); }
    return o + lines.map((l) => pl(l, 'v-feed-thin')).join('');
  };
  const outline = (P, surf) => {
    const e = [];
    for (const [a, b] of [[0, 'v'], [1, 'v'], [0, 'u'], [1, 'u']]) {
      const pts = [];
      for (let i = 0; i <= 24; i++) pts.push(P(...(b === 'v' ? surf(a, i / 24) : surf(i / 24, a))));
      e.push(pl(pts, 'v-chain'));
    }
    return e.join('');
  };

  specs['wf-direction'] = {
    title: 'Cut along or across the shape',
    controls: [
      { type: 'seg', key: 'd', label: 'Cut direction', options: [['along', 'Along'], ['across', 'Across']] },
      { type: 'range', key: 's', label: 'Stepover', min: 0.2, max: 3, step: 0.1, unit: ' mm' },
    ],
    init: { d: 'along', s: 1 },
    draw({ d, s }) {
      const L = 200, R = 12;
      const P = iso(70, 120, 1.3), Rv = 34;
      const surf = (u, v) => { const a = v * Math.PI / 2; return [u * 150, Rv - Rv * Math.cos(a), Rv * Math.sin(a)]; };
      let o = view('A rounded edge, 200 mm long, R12');
      o += outline(P, surf);
      const prof = (Math.PI / 2) * R;
      const nAlong = Math.ceil(prof / s), nAcross = Math.ceil(L / s);
      o = passes(o, P, Math.min(40, nAcross), Math.min(14, nAlong), surf, d === 'along');
      const len = d === 'along' ? nAlong * L : nAcross * prof, turns = d === 'along' ? nAlong : nAcross;
      o += tx(20, 190, `${turns} passes`, 'v-label-strong') + tx(20, 208, `${Math.round(len).toLocaleString('en')} mm of cut`, 'v-label') + tx(20, 226, `${turns} direction changes`, turns > 100 ? 'v-label-bad' : 'v-label');
      return o + note(d === 'along' ? 'Few long passes: the feed stays up' : 'Hundreds of short passes: the machine never reaches the feed');
    },
  };

  specs['wf-comp'] = {
    title: 'Tool on the surface, not on the line',
    controls: [
      { type: 'seg', key: 'c', label: 'Compensation', options: [['on', 'To the surface'], ['off', 'Tip on the line']] },
      { type: 'range', key: 'R', label: 'Ball radius', min: 2, max: 10, step: 0.5, unit: ' mm' },
    ],
    init: { c: 'on', R: 5 },
    draw({ c, R }) {
      const k = 6, x0 = 40, yb = 215;
      const z = (x) => 14 * Math.exp(-((x - 30) ** 2) / 180); // hump, mm
      const dz = (x) => (z(x + 0.01) - z(x - 0.01)) / 0.02;
      let o = view('Section of the shape');
      const prof = [];
      for (let x = 0; x <= 60; x += 1) prof.push([x0 + x * k, yb - 10 * k / 6 - z(x) * k]);
      o += polygon([[x0, yb], ...prof, [x0 + 60 * k, yb]], 'v-hatch-fill');
      o += pl(prof, 'v-chain');
      const centres = [];
      let gouge = 0;
      for (let x = 4; x <= 56; x += 13) {
        const n = 1 / Math.hypot(1, dz(x));
        const [nx, nz] = [-dz(x) * n, n];
        const base = [x, z(x)];
        const cen = c === 'on' ? [base[0] + nx * R, base[1] + nz * R] : [base[0], base[1] + R];
        // does this ball cut below the profile?
        let bad = false;
        for (let t = -R; t <= R; t += 0.25) { const xx = cen[0] + t; if (xx < 0 || xx > 60) continue; if (cen[1] - Math.sqrt(R * R - t * t) < z(xx) - 0.05) bad = true; }
        if (bad) gouge++;
        centres.push(cen);
        o += ci(x0 + cen[0] * k, yb - 10 * k / 6 - cen[1] * k, R * k, bad ? 'v-tool-bad' : 'v-tool-ghost');
      }
      const path = [];
      for (let x = 0; x <= 60; x += 1) { const n = 1 / Math.hypot(1, dz(x)); const cz = c === 'on' ? [x - dz(x) * n * R, z(x) + n * R - R] : [x, z(x)]; path.push([x0 + cz[0] * k, yb - 10 * k / 6 - cz[1] * k]); }
      o += pl(path, 'v-feed') + tx(W - 12, 40, 'tool tip path', 'v-label', 'end');
      return o + note(c === 'on' ? 'The ball centre is pushed out along the normal: it touches the shape everywhere' : `Tip on the line: ${gouge} of ${centres.length} positions dig into the slopes`);
    },
  };

  // drop-cutter: lowest tool tip z at centre x without cutting below the profile
  const toolBottom = (type, R, r, dx) => {
    const a = Math.abs(dx);
    if (a > R) return Infinity;
    if (type === 'ball') return R - Math.sqrt(R * R - a * a);
    if (type === 'flat') return 0;
    return a <= R - r ? 0 : r - Math.sqrt(Math.max(0, r * r - (a - (R - r)) ** 2));
  };
  specs['wf-tool'] = {
    title: 'Ball, bull nose or flat on a curved shape',
    controls: [
      { type: 'seg', key: 't', label: 'Tool', options: [['ball', 'Ball'], ['bull', 'Bull nose r1'], ['flat', 'Flat']] },
      { type: 'range', key: 'R', label: 'Tool radius', min: 2, max: 8, step: 0.5, unit: ' mm' },
    ],
    init: { t: 'ball', R: 4 },
    draw({ t, R }) {
      const k = 6, x0 = 30, yb = 225, step = 1.2;
      const z = (x) => 10 + 6 * Math.sin((x / 60) * Math.PI * 2);
      const tipZ = (cx) => { let m = -Infinity; for (let x = cx - R; x <= cx + R; x += 0.1) { if (x < 0 || x > 60) continue; const b = toolBottom(t, R, 1, x - cx); m = Math.max(m, z(x) - b); } return m; };
      const P = (x, zz) => [x0 + x * k, yb - zz * k];
      let o = view('Section, ' + (t === 'ball' ? 'ball' : t === 'bull' ? 'bull nose' : 'flat end mill') + ' R' + R);
      const prof = []; for (let x = 0; x <= 60; x += 0.5) prof.push(P(x, z(x)));
      o += polygon([P(0, 0), ...prof, P(60, 0)], 'v-hatch-fill');
      // what is left: min over tool positions of the tool bottom
      const tips = []; for (let cx = 0; cx <= 60; cx += step) tips.push([cx, tipZ(cx)]);
      const left = []; let maxLeft = 0;
      for (let x = 0; x <= 60; x += 0.25) {
        let m = Infinity;
        for (const [cx, tz] of tips) { const b = toolBottom(t, R, 1, x - cx); if (b < Infinity) m = Math.min(m, tz + b); }
        if (m === Infinity) m = z(x);
        maxLeft = Math.max(maxLeft, m - z(x));
        left.push(P(x, m));
      }
      o += polygon([...left, ...prof.slice().reverse()], 'v-label-bad-fill') + pl(left, 'v-feed');
      for (const cx of [9, 30, 46]) {
        const tz = tipZ(cx), [px, py] = P(cx, tz);
        if (t === 'ball') o += ci(px, py - R * k, R * k, 'v-tool') + rc(px - R * k, py - R * k - 40, 2 * R * k, 40, 'v-tool');
        else if (t === 'flat') o += rc(px - R * k, py - 60, 2 * R * k, 60, 'v-tool');
        else o += rc(px - R * k, py - 60, 2 * R * k, 60, 'v-tool', k);
      }
      o += tx(20, 40, `material left: up to ${f(maxLeft, 2)} mm`, maxLeft > 0.3 ? 'v-label-bad' : 'v-label-strong');
      return o + note(t === 'ball' ? 'The ball touches the slope with its side: only small scallops stay' : t === 'flat' ? 'The flat cuts with its corner: steps on slopes, and it cannot follow the hollow' : 'Better than a flat, but the hollow keeps what the corner radius cannot reach');
    },
  };

  // ---------------------------------------------------------------- Swept 2D / 3D
  specs['wf-swept2d'] = {
    title: 'Swept 2D: a profile along an outline',
    controls: [
      { type: 'seg', key: 'p', label: 'Across contour', options: [['round', 'Round'], ['chamfer', 'Chamfer'], ['cove', 'Cove']] },
      { type: 'range', key: 'r', label: 'Profile size', min: 2, max: 14, step: 1, unit: ' mm' },
    ],
    init: { p: 'round', r: 8 },
    draw({ p, r }) {
      const prof = (u) => {
        const a = u * Math.PI / 2;
        if (p === 'round') return [r - r * Math.sin(a), r - r * Math.cos(a)];
        if (p === 'chamfer') return [r * (1 - u), r * u];
        return [r * Math.cos(a), r * Math.sin(a)];
      };
      // prof(u) -> [inset from the outline, drop from the top], u 0 at the top face, 1 on the side
      let o = view('Section (left) and the passes in 3D (right)');
      // section
      const k = 6, sx = 30, sy = 60, top = sy, edge = sx + 110;
      const sec = []; for (let i = 0; i <= 20; i++) { const [ins, dr] = prof(i / 20); sec.push([edge - ins * k, top + dr * k]); }
      o += polygon([[sx, top], ...sec, [edge, top + 140], [sx, top + 140]], 'v-hatch-fill');
      o += pl([[sx, top], [edge - r * k, top]], 'v-ink') + pl(sec, 'v-chain') + tx(sx, top - 8, 'across contour', 'v-label');
      const steps = Math.max(3, Math.round((p === 'chamfer' ? Math.SQRT2 : Math.PI / 2) * r / 1.5));
      for (let i = 0; i <= steps; i += Math.max(1, Math.round(steps / 5))) {
        const [ins, dr] = prof(i / steps);
        o += ci(edge - ins * k, top + dr * k, 2, 'v-feed-fill');
      }
      // 3D loops
      const P = iso(290, 150, 1.15);
      const Wb = 110, Hb = 70, Z = 30, rc0 = 12;
      const loop = (ins, zz) => {
        const pts = [], w = Wb - 2 * ins, hh = Hb - 2 * ins, rr = Math.max(0.5, rc0 - ins);
        const cs = [[w / 2 - rr, hh / 2 - rr], [-w / 2 + rr, hh / 2 - rr], [-w / 2 + rr, -hh / 2 + rr], [w / 2 - rr, -hh / 2 + rr]];
        cs.forEach(([cx, cy], q) => { for (let i = 0; i <= 6; i++) { const a = (q + i / 6) * Math.PI / 2; pts.push(P(cx + rr * Math.cos(a), cy + rr * Math.sin(a), zz)); } });
        pts.push(pts[0]);
        return pts;
      };
      o += pl(loop(0, 0), 'v-ink-thin');
      for (let i = 0; i <= steps; i++) { const [ins, dr] = prof(i / steps); o += pl(loop(Math.max(0, ins), Z - dr), 'v-feed-thin'); }
      o += pl(loop(0, Z - r), 'v-chain');
      return o + note(`${steps + 1} loops, each one flat: short code, all arcs and lines`);
    },
  };

  specs['wf-swept3d'] = {
    title: 'Swept 3D: one path or two guide curves',
    controls: [
      { type: 'seg', key: 'g', label: 'Along contours', options: [['one', 'One path'], ['two', 'Two guides']] },
      { type: 'range', key: 'w', label: 'Width at the end', min: 40, max: 250, step: 10, unit: '%' },
    ],
    init: { g: 'two', w: 180 },
    draw({ g, w }) {
      let o = view('Top view of a groove; side view below');
      const x0 = 40, x1 = 380, yc = 90, w0 = 24;
      const mid = (u) => yc + 18 * Math.sin(u * Math.PI);
      const half = (u) => (w0 / 2) * (g === 'one' ? 1 : 1 + (w / 100 - 1) * u);
      const A = [], B = [];
      for (let i = 0; i <= 30; i++) { const u = i / 30, x = x0 + u * (x1 - x0); A.push([x, mid(u) - half(u)]); B.push([x, mid(u) + half(u)]); }
      o += polygon([...A, ...B.slice().reverse()], 'v-air');
      o += pl(A, g === 'two' ? 'v-chain' : 'v-ink-thin') + pl(B, g === 'two' ? 'v-chain' : 'v-ink-thin');
      if (g === 'one') { const M = A.map((p, i) => [p[0], (p[1] + B[i][1]) / 2]); o += pl(M, 'v-chain'); }
      for (let i = 0; i <= 6; i++) { const u = i / 6, x = x0 + u * (x1 - x0); o += ln(x, mid(u) - half(u), x, mid(u) + half(u), 'v-feed'); }
      // side view: the path climbs
      const sy = 205;
      const side = []; for (let i = 0; i <= 30; i++) { const u = i / 30; side.push([x0 + u * (x1 - x0), sy - 22 * u]); }
      o += pl(side, 'v-chain') + tx(x0, sy + 14, 'the along path climbs 22 mm', 'v-label');
      return o + note(g === 'one' ? 'One path: the profile keeps its size and follows the path up and round' : `Two guides: the profile is stretched to ${w}% between them`);
    },
  };

  // ---------------------------------------------------------------- Revolved
  specs['wf-rev-axis'] = {
    title: 'Revolved: axis along X or Y',
    controls: [{ type: 'seg', key: 'a', label: 'Rotation axis', options: [['x', 'X'], ['y', 'Y']] }],
    init: { a: 'x' },
    draw({ a }) {
      let o = view('Top view of the stock');
      const x0 = 60, y0 = 40, ww = 260, hh = 170;
      o += rc(x0, y0, ww, hh, 'v-stock-light');
      const cxm = x0 + ww / 2, cym = y0 + hh / 2;
      if (a === 'x') {
        o += rc(x0, cym - 45, ww, 90, 'v-air') + ln(x0 - 20, cym, x0 + ww + 20, cym, 'c-ref') + tx(x0 + ww + 22, cym + 4, 'X', 'v-label-strong');
        for (let i = 0; i <= 12; i++) o += ln(x0 + 10 + i * ((ww - 20) / 12), cym - 45, x0 + 10 + i * ((ww - 20) / 12), cym + 45, 'v-feed');
      } else {
        o += rc(cxm - 45, y0, 90, hh, 'v-air') + ln(cxm, y0 - 15, cxm, y0 + hh + 15, 'c-ref') + tx(cxm + 6, y0 - 4, 'Y', 'v-label-strong');
        for (let i = 0; i <= 8; i++) o += ln(cxm - 45, y0 + 10 + i * ((hh - 20) / 8), cxm + 45, y0 + 10 + i * ((hh - 20) / 8), 'v-feed');
      }
      return o + note('The axis line also sets the height: draw it at the real Z of the centre');
    },
  };

  specs['wf-rev-sweep'] = {
    title: 'Revolved: start angle and sweep',
    controls: [
      { type: 'range', key: 'st', label: 'Start angle', min: -40, max: 90, step: 5, unit: '°' },
      { type: 'range', key: 'sw', label: 'Sweep angle', min: 30, max: 270, step: 5, unit: '°' },
    ],
    init: { st: 0, sw: 180 },
    draw({ st, sw }) {
      let o = view('Looking along the axis');
      const cx = 200, cy = 150, R = 62, rb = 12;
      o += rc(cx - 130, cy, 260, 50, 'v-hatch-fill') + pa(`M${cx - R},${cy} A${R},${R} 0 0 1 ${cx + R},${cy}Z`, 'v-hatch-fill') + ln(cx - 130, cy, cx + 130, cy, 'c-ref') + tx(cx + 132, cy + 4, 'axis height', 'v-label');
      let bad = 0, close = 0;
      for (let d = 0; d < sw; d += 3) {
        const a = st + d, a2 = st + Math.min(sw, d + 3);
        const p = (aa) => [cx + (R + rb) * Math.cos((aa * Math.PI) / 180), cy - (R + rb) * Math.sin((aa * Math.PI) / 180)];
        const under = a < 0 || a2 > 180, near = a < 12 || a2 > 168;
        if (under) bad++; else if (near) close++;
        o += ln(...p(a), ...p(a2), under ? 'v-label-bad-line' : 'v-feed');
      }
      const tool = (aa) => { const r = (aa * Math.PI) / 180; const x = cx + (R + rb) * Math.cos(r), y = cy - (R + rb) * Math.sin(r); return ci(x, y, rb, aa < 0 || aa > 180 ? 'v-tool-bad' : 'v-tool') + rc(x - rb, y - 90, 2 * rb, 90 - rb, aa < 0 || aa > 180 ? 'v-tool-bad' : 'v-tool-ghost'); };
      o += tool(st) + tool(st + sw);
      return o + note(bad ? 'Red part is under the axis: a 3-axis tool would go through the shape to get there' : close ? 'Near horizontal the shank runs close to the side: check it in Verify' : 'All of it reachable from above');
    },
  };

  specs['wf-rev-dir'] = {
    title: 'Revolved: around or along the axis',
    controls: [{ type: 'seg', key: 'd', label: 'Cut direction', options: [['around', 'Around'], ['along', 'Along']] }],
    init: { d: 'around' },
    draw({ d }) {
      const P = iso(90, 120, 1.4), L = 150, R = 30;
      const surf = (u, v) => { const a = v * Math.PI; return [u * L * 0.8, R * Math.cos(a) + 30, R * Math.sin(a)]; };
      let o = view('Half-round shape lying along X');
      o += outline(P, surf);
      o = passes(o, P, 18, 12, surf, d === 'along');
      return o + note(d === 'around' ? 'Arcs over the top, stepping along X: the same finish all over' : 'Long passes at a fixed angle: fewer, longer moves');
    },
  };

  // ---------------------------------------------------------------- Lofted
  specs['wf-lofted'] = {
    title: 'Lofted: sections in order, same direction',
    controls: [
      { type: 'range', key: 'n', label: 'Sections', min: 3, max: 6, step: 1, unit: '' },
      { type: 'seg', key: 'r', label: 'Section 2', options: [['same', 'Same direction'], ['flip', 'Chained backwards']] },
    ],
    init: { n: 4, r: 'same' },
    draw({ n, r }) {
      const P = iso(60, 112, 1.15);
      const secs = [];
      for (let i = 0; i < n; i++) {
        const x = (i / (n - 1)) * 160, hgt = 14 + 18 * Math.sin((i / (n - 1)) * Math.PI) + (i % 2) * 6;
        const pts = [];
        for (let j = 0; j <= 12; j++) { let v = j / 12; if (r === 'flip' && i === 1) v = 1 - v; pts.push([x, v * 70, hgt * Math.sin(v * Math.PI)]); }
        secs.push(pts);
      }
      let o = view('Section curves and the shape between them');
      for (let j = 0; j <= 12; j++) o += pl(secs.map((s) => P(...s[j])), 'v-feed-thin');
      secs.forEach((s, i) => {
        o += pl(s.map((q) => P(...q)), 'v-chain');
        const st = P(...s[0]); o += ci(st[0], st[1], 3.5, i === 1 && r === 'flip' ? 'v-tool-bad' : 'v-num-a');
        o += tx(...P(s[0][0], -12, 0), String(i + 1), 'v-label-strong', 'middle');
      });
      return o + note(r === 'flip' ? 'Section 2 starts on the wrong side: the shape folds over between 1 and 3' : 'Start points (dots) all on one side, arrows the same way: a smooth shape');
    },
  };

  // ---------------------------------------------------------------- Ruled
  specs['wf-ruled'] = {
    title: 'Ruled: straight lines between two chains',
    controls: [{ type: 'range', key: 'off', label: 'Start point of chain 2 moved by', min: 0, max: 50, step: 1, unit: '%' }],
    init: { off: 0 },
    draw({ off }) {
      const P = iso(195, 135, 1);
      const bottom = (u) => { const a = u * Math.PI * 2; const c = Math.cos(a), s = Math.sin(a); const k = 1 / Math.max(Math.abs(c), Math.abs(s)); return [70 * c * k * 0.9 + 0 * s, 50 * s * k * 0.9, 0]; };
      const top = (u) => { const a = u * Math.PI * 2; return [35 * Math.cos(a), 25 * Math.sin(a), 55]; };
      let o = view('Bottom: rounded square. Top: ellipse.');
      const B = [], T = [];
      for (let i = 0; i <= 48; i++) { B.push(P(...bottom(i / 48))); T.push(P(...top(i / 48))); }
      o += pl(B, 'v-chain');
      for (let i = 0; i < 24; i++) { const u = i / 24; o += ln(...P(...bottom(u)), ...P(...top(u + off / 100)), 'v-feed'); }
      o += pl(T, 'v-chain');
      o += ci(...P(...bottom(0)), 4, 'v-num-a') + ci(...P(...top(off / 100)), 4, off ? 'v-tool-bad' : 'v-num-a');
      return o + note(off === 0 ? 'Start points line up: straight, untwisted rulings' : off < 10 ? 'A small shift already leans every line' : 'The lines cross: the face twists and the tool cuts through it');
    },
  };

  specs['wf-ruled-method'] = {
    title: 'Ruled: cutting method',
    controls: [{ type: 'seg', key: 'm', label: 'Method', options: [['zig', 'Zigzag'], ['one', 'One way'], ['circ', 'Circular'], ['swirl', 'Swirl']] }],
    init: { m: 'swirl' },
    draw({ m }) {
      let o = view('Top view of a closed ruled shape');
      const cx = 200, cy = 125;
      const B = (u) => [cx + 150 * Math.cos(u * 2 * Math.PI), cy + 90 * Math.sin(u * 2 * Math.PI)];
      const T = (u) => [cx + 60 * Math.cos(u * 2 * Math.PI), cy + 30 * Math.sin(u * 2 * Math.PI)];
      const at = (u, v) => { const b = B(u), t = T(u); return [b[0] + (t[0] - b[0]) * v, b[1] + (t[1] - b[1]) * v]; };
      const pts = (fn, n) => { const r = []; for (let i = 0; i <= n; i++) r.push(fn(i / n)); return r; };
      o += pl(pts(B, 60), 'v-chain') + pl(pts(T, 40), 'v-chain');
      if (m === 'zig' || m === 'one') {
        for (let i = 0; i < 28; i++) {
          const u = i / 28, flip = m === 'zig' && i % 2;
          const a = at(u, flip ? 1 : 0), b = at(u, flip ? 0 : 1);
          o += ln(...a, ...b, 'v-feed');
          if (m === 'one' && i < 27) o += ln(...b, ...at((i + 1) / 28, 0), 'v-rapid');
        }
      } else if (m === 'circ') {
        for (let j = 0; j <= 6; j++) { o += pl(pts((u) => at(u, j / 6), 60), 'v-feed'); if (j < 6) o += ln(...at(0, j / 6), ...at(0, (j + 1) / 6), 'v-feed'); }
      } else {
        o += pl(pts((t) => at((t * 6.5) % 1, t), 360), 'v-feed');
      }
      const txt = { zig: 'Along the rulings, back and forth', one: 'Along the rulings, always the same way', circ: 'Loops that follow the chains, with a step mark', swirl: 'One continuous spiral from chain to chain: no step mark' };
      return o + note(txt[m]);
    },
  };

  // ---------------------------------------------------------------- Coons
  specs['wf-coons'] = {
    title: 'Coons: patches inside boundary curves',
    controls: [
      { type: 'range', key: 'a', label: 'Patches along', min: 1, max: 4, step: 1, unit: '' },
      { type: 'range', key: 'c', label: 'Patches across', min: 1, max: 3, step: 1, unit: '' },
    ],
    init: { a: 2, c: 1 },
    draw({ a, c }) {
      const P = iso(70, 138, 0.88);
      const surf = (u, v) => [u * 200, v * 110, 12 + 14 * Math.sin(u * Math.PI) * Math.cos((v - 0.5) * 2.2) + 8 * u * v];
      let o = view(`${a} × ${c} patches`);
      for (let j = 0; j <= 16; j++) { const pts = []; for (let i = 0; i <= 40; i++) pts.push(P(...surf(i / 40, j / 16))); o += pl(pts, 'v-feed-thin'); }
      for (let j = 0; j <= c; j++) { const pts = []; for (let i = 0; i <= 40; i++) pts.push(P(...surf(i / 40, j / c))); o += pl(pts, 'v-chain'); }
      for (let i = 0; i <= a; i++) { const pts = []; for (let j = 0; j <= 20; j++) pts.push(P(...surf(i / a, j / 20))); o += pl(pts, 'v-chain'); }
      for (let i = 0; i <= a; i++) for (let j = 0; j <= c; j++) o += ci(...P(...surf(i / a, j / c)), 3, 'v-num-a');
      const nAlong = (c + 1) * a, nAcross = (a + 1) * c;
      o += tx(20, 36, `Along: ${c + 1} curves, split into ${nAlong} pieces`, 'v-label-strong') + tx(20, 54, `Across: ${a + 1} curves, split into ${nAcross} pieces`, 'v-label-strong');
      return o + note('Every corner (dot) must be a shared endpoint: snap, never eyeball');
    },
  };

  // ---------------------------------------------------------------- Model Chamfer
  const chamferTool = (tipX, tipY, half, rad, k, cls, shank = 26) => {
    // cone from the tip up to the full radius, then a short piece of shank
    const hgt = (rad / Math.tan(half)) * k;
    return polygon([[tipX - 1.5, tipY], [tipX + 1.5, tipY], [tipX + rad * k, tipY - hgt], [tipX + rad * k, tipY - hgt - shank], [tipX - rad * k, tipY - hgt - shank], [tipX - rad * k, tipY - hgt]], cls);
  };

  specs['mc-select'] = {
    title: 'Model chamfer or sharp edge',
    controls: [{ type: 'seg', key: 'e', label: 'Edge picked', options: [['model', 'Chamfer on the model'], ['sharp', 'Sharp edge']] }],
    init: { e: 'model' },
    draw({ e }) {
      const k = 34, ex = 210, ey = 125, wd = 1, tip = 0.3;
      let o = view('Section through the edge');
      const prof = e === 'model' ? [[40, ey], [ex - wd * k, ey], [ex, ey + wd * k], [ex, 225], [40, 225]] : [[40, ey], [ex, ey], [ex, 225], [40, 225]];
      o += polygon(prof, 'v-hatch-fill');
      o += chamferTool(ex + tip * k, ey + (wd + tip) * k, Math.PI / 4, 1.8, k, 'v-tool-ghost');
      if (e === 'sharp') o += ln(ex - wd * k, ey, ex, ey + wd * k, 'v-label-bad-line') + tx(ex + 40, ey + 70, 'chamfer Mastercam adds', 'v-label');
      else o += ln(ex - wd * k, ey, ex, ey + wd * k, 'v-feed') + tx(ex + 40, ey + 70, 'chamfer face on the model', 'v-label');
      o += ci(ex + tip * k, ey + (wd + tip) * k, 2.5, 'v-feed-fill') + tx(ex + tip * k + 8, ey + (wd + tip) * k + 14, 'tool tip', 'v-label');
      return o + note(e === 'model' ? 'The toolpath follows the chamfer that is drawn' : 'Mastercam makes the chamfer: type the width from the drawing');
    },
  };

  specs['mc-width'] = {
    title: 'Chamfer width and the tool',
    controls: [
      { type: 'range', key: 'w', label: 'Width', min: 0.2, max: 3, step: 0.1, unit: ' mm' },
      { type: 'range', key: 'D', label: 'Tool Ø', min: 2, max: 12, step: 0.5, unit: ' mm' },
      { type: 'seg', key: 'A', label: 'Tool angle', options: [['90', '90°'], ['60', '60°'], ['120', '120°']] },
    ],
    init: { w: 1, D: 6, A: '90' },
    draw({ w, D, A }) {
      const half = (+A / 2) * Math.PI / 180, tip = 0.3;
      const depth = w / Math.tan(half); // vertical leg for that cone
      const reach = (D / 2) / Math.tan(half); // height where the cone reaches full Ø
      const k = Math.min(36, 120 / Math.max(reach, depth + tip + 0.3), 150 / Math.max(w, D / 2));
      const ex = 230, ey = 205 - Math.max(depth + tip, 0.5) * k - 10;
      let o = view('Section, ' + A + '° chamfer mill');
      o += polygon([[30, ey], [ex - w * k, ey], [ex, ey + depth * k], [ex, 212], [30, 212]], 'v-hatch-fill');
      const tx0 = ex + tip * Math.tan(half) * k, ty0 = ey + (depth + tip) * k;
      const ok = depth + tip < reach;
      o += chamferTool(tx0, ty0, half, D / 2, k, ok ? 'v-tool-ghost' : 'v-tool-bad');
      o += ln(ex - w * k, ey, ex, ey + depth * k, 'v-feed');
      o += ln(ex - w * k, ey - 8, ex, ey - 8, 'c-dim') + tx(ex - w * k - 6, ey - 4, `${w} mm`, 'v-label-strong', 'end');
      o += tx(20, 40, `legs ${w} × ${f(depth, 2)} mm`, 'v-label-strong');
      return o + note(ok ? `The cone reaches full Ø ${D} at ${f(reach, 2)} mm: room for this chamfer` : `The chamfer needs ${f(depth + tip, 2)} mm of cone, the tool has ${f(reach, 2)}: bigger tool`);
    },
  };

  specs['mc-tip-offset'] = {
    title: 'Tip offset next to a floor',
    controls: [
      { type: 'range', key: 't', label: 'Tip offset', min: 0, max: 2, step: 0.05, unit: ' mm' },
      { type: 'range', key: 'b', label: 'Boss height above the floor', min: 0.5, max: 4, step: 0.1, unit: ' mm' },
    ],
    init: { t: 0.3, b: 3 },
    draw({ t, b }) {
      const k = 30, w = 0.8, ex = 200, ey = 95, fy = ey + b * k;
      let o = view('Section: chamfer on the top edge of a boss');
      o += polygon([[30, ey], [ex - w * k, ey], [ex, ey + w * k], [ex, fy], [400, fy], [400, 245], [30, 245]], 'v-hatch-fill');
      const tipY = ey + (w + t) * k, hits = w + t > b;
      o += chamferTool(ex + t * k, tipY, Math.PI / 4, 1.6, k, hits ? 'v-tool-bad' : 'v-tool-ghost');
      o += ln(ex - w * k, ey, ex, ey + w * k, 'v-feed');
      o += ln(ex + t * k + 60, ey + w * k, ex + t * k + 60, tipY, 'c-dim') + tx(ex + t * k + 66, (ey + w * k + tipY) / 2 + 4, `tip ${t} mm`, 'v-label-strong');
      return o + note(hits ? 'The tip goes below the floor: it cuts a groove round the boss' : t < 0.1 ? 'Cutting with the very point: no speed there, ragged chamfer' : 'The cone cuts, the tip is clear of the floor');
    },
  };

  specs['mc-collision'] = {
    title: 'Holder next to a tall wall',
    controls: [
      { type: 'range', key: 'hw', label: 'Wall height', min: 5, max: 60, step: 1, unit: ' mm' },
      { type: 'seg', key: 'c', label: 'Collision checking', options: [['on', 'On'], ['off', 'Off']] },
    ],
    init: { hw: 35, c: 'on' },
    draw({ hw, c }) {
      const k = 3, fy = 205, step = 5, gap = 10, stick = 22, hr = 16, ex = 170;
      const ey = fy - step * k, wx = ex + gap * k;
      let o = view('Side view: a step edge close to a wall');
      o += rc(20, fy, 390, 20, 'v-hatch-fill') + rc(20, ey, ex - 20, step * k, 'v-hatch-fill') + rc(wx, fy - hw * k, 410 - wx, hw * k, 'v-hatch-fill');
      const holderBottom = ey - stick * k, hit = fy - hw * k < holderBottom && ex + hr * k > wx;
      o += chamferTool(ex, ey, Math.PI / 4, 2, k, 'v-tool', stick * k - 2 * k);
      o += rc(ex - hr * k, holderBottom - 50, 2 * hr * k, 50, hit ? (c === 'off' ? 'v-tool-bad' : 'v-tool-ghost') : 'v-tool-ghost');
      o += tx(ex - hr * k - 6, holderBottom - 20, 'holder', 'v-label', 'end');
      if (hit && c === 'on') o += ln(ex - 4, ey - 4, ex - 110, ey - 4, 'v-label-bad-line') + tx(ex - 60, ey - 12, 'edge skipped here', 'v-label', 'middle');
      return o + note(!hit ? 'The holder clears the wall' : c === 'on' ? 'Mastercam skips the edge where the holder would hit: finish it with a longer tool' : 'Holder in the wall. Without the check the backplot still looks fine.');
    },
  };

  for (const k of Object.keys(specs)) if (!before.has(k)) { const d = specs[k].draw; specs[k].draw = (v) => hatch + d(v); }
}
