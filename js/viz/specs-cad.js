// Visuals for the Design (CAD) section: wireframe, transform, solids, planes, drafting.
// Convention: grey = geometry already there, blue = what the function creates,
// red dashed = what it removes, numbered dots = where you click.

export function addCadSpecs(specs, h) {
  const { W, H, ln, pl, ci, rc, tx, pa, arrowHead } = h;
  const old = 'c-old', neu = 'c-new', gone = 'c-gone';
  const click = (x, y, n) => ci(x, y, 9, 'v-num-a') + tx(x, y + 4, String(n), 'v-label-strong', 'middle');
  const dot = (x, y) => ci(x, y, 3.2, 'c-pt');
  const cross = (x, y, c = 'c-new') => ln(x - 6, y - 6, x + 6, y + 6, c) + ln(x - 6, y + 6, x + 6, y - 6, c);
  const arcPath = (cx, cy, r, a0, a1) => { // degrees, screen coords (y down), drawn a0 → a1 counter-clockwise on screen
    const p = (a) => [cx + r * Math.cos((a * Math.PI) / 180), cy - r * Math.sin((a * Math.PI) / 180)];
    const [x0, y0] = p(a0), [x1, y1] = p(a1);
    const sweep = ((a1 - a0) % 360 + 360) % 360;
    return `M${x0.toFixed(1)},${y0.toFixed(1)} A${r},${r} 0 ${sweep > 180 ? 1 : 0} 0 ${x1.toFixed(1)},${y1.toFixed(1)}`;
  };
  const note = (s) => tx(W - 10, H - 10, s, 'v-label', 'end');
  const axes = (x, y, l = 30) => ln(x, y, x + l, y, 'c-axis-x') + ln(x, y, x, y - l, 'c-axis-y') + tx(x + l + 4, y + 4, 'X', 'v-label') + tx(x - 3, y - l - 4, 'Y', 'v-label');

  // ----------------------------------------------------------------- lines
  specs['cad-line'] = {
    title: 'Line Endpoints',
    controls: [
      { type: 'seg', key: 't', label: 'Type', options: [['free', 'Freeform'], ['h', 'Horizontal'], ['v', 'Vertical']] },
      { type: 'seg', key: 'm', label: 'Method', options: [['two', 'Two endpoints'], ['mid', 'Midpoint'], ['multi', 'Multi-line']] },
    ],
    init: { t: 'free', m: 'two' },
    draw({ t, m }) {
      let s = axes(30, 225);
      const A = [110, 170], B = t === 'h' ? [310, 170] : t === 'v' ? [110, 50] : [320, 70];
      if (m === 'multi') {
        const pts = t === 'free' ? [[90, 190], [180, 80], [270, 160], [350, 60]] : t === 'h' ? [[90, 190], [330, 190]] : [[200, 210], [200, 40]];
        s += pl(pts, neu);
        pts.forEach(([x, y], i) => (s += click(x, y, i + 1)));
        return s + note(t === 'free' ? 'each click starts the next line from the last end' : 'Horizontal/Vertical lock the angle');
      }
      if (m === 'mid') {
        const M = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2], D = [B[0] - M[0], B[1] - M[1]];
        s += ln(M[0] - D[0], M[1] - D[1], M[0] + D[0], M[1] + D[1], neu) + click(M[0], M[1], 1) + click(B[0], B[1], 2);
        return s + note('1 = middle of the line, 2 = one end (or type Length)');
      }
      s += ln(A[0], A[1], B[0], B[1], neu) + click(A[0], A[1], 1) + click(B[0], B[1], 2);
      if (t === 'free') s += tx((A[0] + B[0]) / 2 + 12, (A[1] + B[1]) / 2 + 18, 'Length + Angle in the panel', 'v-label');
      return s + note(t === 'h' ? 'second click only sets the length; Y stays' : t === 'v' ? 'second click only sets the length; X stays' : 'click two points or type Length and Angle');
    },
  };

  specs['cad-line-more'] = {
    title: 'Other line functions',
    controls: [{ type: 'seg', key: 't', label: 'Function', options: [['par', 'Parallel'], ['perp', 'Perpendicular'], ['close', 'Closest'], ['bis', 'Bisect'], ['tan', 'Tangent through point']] }],
    init: { t: 'par' },
    draw({ t }) {
      let s = '';
      if (t === 'par') {
        s += ln(70, 170, 330, 110, old) + ln(70, 110, 330, 50, neu) + click(200, 140, 1) + click(200, 70, 2);
        s += pa('M250,120 L250,62', 'c-dim') + tx(256, 95, 'distance', 'v-label');
        return s + note('pick the line, then the side (or type the distance)');
      }
      if (t === 'perp') {
        s += ln(60, 190, 360, 120, old) + ln(220, 152, 190, 30, neu) + click(140, 171, 1) + click(190, 40, 2);
        s += rc(208, 138, 10, 10, 'c-right');
        return s + note('pick the line, then a point the new line goes through');
      }
      if (t === 'close') {
        s += ci(120, 125, 50, old) + ci(310, 125, 34, old) + ln(170, 125, 276, 125, neu) + click(120, 125, 1) + click(310, 125, 2);
        return s + note('shortest line between two entities');
      }
      if (t === 'bis') {
        s += ln(70, 200, 330, 200, old) + ln(70, 200, 300, 50, old) + ln(70, 200, 330, 130, neu);
        s += pa(arcPath(70, 200, 90, 0, 16), 'c-dim') + pa(arcPath(70, 200, 100, 16, 33), 'c-dim');
        return s + tx(175, 192, 'α', 'v-label-strong') + tx(170, 155, 'α', 'v-label-strong') + note('splits the angle between two lines');
      }
      s += ci(260, 130, 60, old) + ln(60, 210, 260 - 60 * 0.6, 130 - 60 * 0.8, neu) + click(60, 210, 2) + click(320, 130, 1);
      return s + note('pick the arc, then the point; it lands on the tangent');
    },
  };

  // ------------------------------------------------------------- arcs
  specs['cad-arc'] = {
    title: 'Circles and arcs',
    controls: [{ type: 'seg', key: 't', label: 'Function', options: [['cc', 'Circle Center Point'], ['ce', 'Circle Edge Point'], ['a3', 'Arc 3 Points'], ['ae', 'Arc Endpoints'], ['ap', 'Arc Polar'], ['at', 'Arc Tangent']] }],
    init: { t: 'cc' },
    draw({ t }) {
      let s = '';
      const C = [210, 130], R = 75;
      if (t === 'cc') {
        s += ci(C[0], C[1], R, neu) + cross(C[0], C[1], old) + click(C[0], C[1], 1) + click(C[0] + R, C[1], 2);
        s += ln(C[0], C[1], C[0] + R, C[1], 'c-dim') + tx(C[0] + R / 2, C[1] - 6, 'R', 'v-label-strong', 'middle');
        return s + note('centre, then a point on the edge (or type Radius / Diameter)');
      }
      if (t === 'ce') {
        s += ci(C[0], C[1], R, neu) + click(C[0] - R, C[1], 1) + click(C[0] + R, C[1], 2);
        return s + note('two points on the edge = the diameter (3 points also works)');
      }
      if (t === 'a3') {
        s += pa(arcPath(C[0], C[1], R, 180, 0), neu);
        s += click(C[0] - R, C[1], 1) + click(C[0], C[1] - R, 2) + click(C[0] + R, C[1], 3);
        return s + note('start, any point on it, end');
      }
      if (t === 'ae') {
        s += pa(arcPath(C[0], C[1] + 30, R + 20, 160, 20), neu) + click(C[0] - (R + 20) * 0.94, C[1] + 30 - (R + 20) * 0.34, 1) + click(C[0] + (R + 20) * 0.94, C[1] + 30 - (R + 20) * 0.34, 2);
        return s + note('two endpoints, then the radius (or a third point)');
      }
      if (t === 'ap') {
        s += pa(arcPath(C[0], C[1], R, 20, 140), neu) + cross(C[0], C[1], old) + click(C[0], C[1], 1);
        s += ln(C[0], C[1], C[0] + R * Math.cos(0.35), C[1] - R * Math.sin(0.35), 'c-dim') + ln(C[0], C[1], C[0] + R * Math.cos(2.44), C[1] - R * Math.sin(2.44), 'c-dim');
        s += tx(C[0] + 60, C[1] + 4, 'start 20°', 'v-label') + tx(C[0] - 100, C[1] + 4, 'end 140°', 'v-label');
        return s + note('centre + radius + start and end angles');
      }
      s += ln(40, 200, 260, 200, old) + ln(260, 200, 260, 60, old);
      s += pa('M200,200 A60,60 0 0 0 260,140', neu) + click(200, 200, 1) + click(260, 140, 2);
      return s + note('tangent to one or two entities: fillet-like corners, slot ends');
    },
  };

  // ---------------------------------------------------------- shapes
  specs['cad-rect'] = {
    title: 'Rectangular Shapes',
    controls: [
      { type: 'seg', key: 't', label: 'Type', options: [['rect', 'Rectangular'], ['ob', 'Obround'], ['sd', 'Single D'], ['dd', 'Double D']] },
      { type: 'seg', key: 'o', label: 'Origin', options: [['c', 'Centre'], ['bl', 'Bottom left']] },
      { type: 'range', key: 'r', label: 'Fillet radius', min: 0, max: 40, step: 2, unit: '' },
    ],
    init: { t: 'rect', o: 'c', r: 0 },
    draw({ t, o, r }) {
      const w = 240, hh = 130, x = 90, y = 60;
      let d;
      if (t === 'rect') d = `M${x + r},${y} H${x + w - r} A${r},${r} 0 0 1 ${x + w},${y + r} V${y + hh - r} A${r},${r} 0 0 1 ${x + w - r},${y + hh} H${x + r} A${r},${r} 0 0 1 ${x},${y + hh - r} V${y + r} A${r},${r} 0 0 1 ${x + r},${y}Z`;
      else if (t === 'ob') d = `M${x + hh / 2},${y} H${x + w - hh / 2} A${hh / 2},${hh / 2} 0 0 1 ${x + w - hh / 2},${y + hh} H${x + hh / 2} A${hh / 2},${hh / 2} 0 0 1 ${x + hh / 2},${y}Z`;
      else {
        // circle of Ø = width with one or two flats
        const R = w / 2 > hh ? hh * 0.75 : w / 2, cx = x + w / 2, cy = y + hh / 2, f = hh / 2 - 8;
        const dx = Math.sqrt(R * R - f * f);
        d = t === 'sd'
          ? `M${cx - dx},${cy - f} H${cx + dx} A${R},${R} 0 1 1 ${cx - dx},${cy - f}Z`
          : `M${cx - dx},${cy - f} H${cx + dx} A${R},${R} 0 0 1 ${cx + dx},${cy + f} H${cx - dx} A${R},${R} 0 0 1 ${cx - dx},${cy - f}Z`;
      }
      let s = pa(d, neu);
      const ox = o === 'c' ? x + w / 2 : x, oy = o === 'c' ? y + hh / 2 : y + hh;
      s += cross(ox, oy, 'c-origin') + tx(ox + 10, oy - 8, 'base point', 'v-label');
      if (t === 'rect') s += tx(x + w / 2, y - 10, 'Width', 'v-label', 'middle') + tx(x + w + 10, y + hh / 2, 'Height', 'v-label');
      return s + note(t === 'rect' ? (r ? 'Fillet radius rounds all four corners' : 'Fillet radius 0 = sharp corners') : t === 'ob' ? 'Obround: a slot shape, the ends are full radius' : 'D shapes: a round with one or two flats (shafts, keyed holes)');
    },
  };

  specs['cad-polygon'] = {
    title: 'Polygon',
    controls: [
      { type: 'range', key: 'n', label: 'Sides', min: 3, max: 12, step: 1, unit: '' },
      { type: 'seg', key: 'm', label: 'Radius', options: [['flat', 'Flat'], ['corner', 'Corner']] },
    ],
    init: { n: 6, m: 'flat' },
    draw({ n, m }) {
      const cx = 210, cy = 128, R = 85;
      const Rc = m === 'corner' ? R : R / Math.cos(Math.PI / n);
      const pts = [];
      for (let i = 0; i <= n; i++) { const a = -Math.PI / 2 + Math.PI / n + (2 * Math.PI * i) / n; pts.push([cx + Rc * Math.cos(a), cy + Rc * Math.sin(a)]); }
      let s = ci(cx, cy, R, 'c-ref') + pl(pts, neu) + cross(cx, cy, 'c-origin');
      s += ln(cx, cy, cx + (m === 'corner' ? pts[0][0] - cx : 0), cy + (m === 'corner' ? pts[0][1] - cy : R), 'c-dim');
      s += tx(cx + 8, cy + (m === 'corner' ? -30 : 50), 'radius', 'v-label');
      return s + note(m === 'flat' ? 'Flat: the radius goes to the middle of a side (across flats = 2 × R)' : 'Corner: the radius goes to a corner (across corners = 2 × R)');
    },
  };

  specs['cad-bolt'] = {
    title: 'Bolt Circle',
    controls: [
      { type: 'range', key: 'n', label: 'Number', min: 2, max: 12, step: 1, unit: '' },
      { type: 'seg', key: 'm', label: 'Method', options: [['full', 'Full circle'], ['part', 'Partial circle']] },
      { type: 'seg', key: 'c', label: 'Create', options: [['arcs', 'Arcs'], ['pts', 'Points'], ['both', 'Both']] },
    ],
    init: { n: 6, m: 'full', c: 'arcs' },
    draw({ n, m, c }) {
      const cx = 210, cy = 128, R = 85;
      let s = ci(cx, cy, R, 'c-ref') + cross(cx, cy, 'c-origin');
      const span = m === 'full' ? 360 : 135, step = m === 'full' ? span / n : span / Math.max(n - 1, 1);
      for (let i = 0; i < n; i++) {
        const a = ((0 + i * step) * Math.PI) / 180, x = cx + R * Math.cos(a), y = cy - R * Math.sin(a);
        if (c !== 'pts') s += ci(x, y, 11, neu);
        if (c !== 'arcs') s += dot(x, y);
      }
      s += ln(cx, cy, cx + R, cy, 'c-dim') + tx(cx + R + 6, cy + 4, 'start angle 0°', 'v-label');
      return s + note(m === 'full' ? `${n} holes, ${(360 / n).toFixed(1).replace('.0', '')}° apart` : 'Partial: number + angle between them');
    },
  };

  // ----------------------------------------------------------- modify
  specs['cad-trim'] = {
    title: 'Trim to Entities',
    controls: [{ type: 'seg', key: 't', label: 'Method', options: [['1', 'Trim 1 entity'], ['2', 'Trim 2 entities'], ['3', 'Trim 3 entities'], ['brk', 'Break'], ['div', 'Divide']] }],
    init: { t: '2' },
    draw({ t }) {
      let s = '';
      if (t === '1') {
        s += ln(80, 60, 80, 210, old) + ln(120, 130, 80, 130, neu) + ln(80, 130, 40, 130, gone) + ln(120, 130, 340, 130, neu);
        s += click(250, 130, 1) + click(80, 180, 2);
        return s + note('1 = the line to trim (click the side to keep), 2 = trim to this');
      }
      if (t === '2') {
        s += ln(100, 180, 330, 180, neu) + ln(40, 180, 100, 180, gone) + ln(100, 180, 100, 50, neu) + ln(100, 180, 100, 230, gone);
        s += click(200, 180, 1) + click(100, 110, 2);
        return s + note('both lines trimmed to their corner: click the sides to keep');
      }
      if (t === '3') {
        s += ln(100, 60, 100, 210, old) + ln(320, 60, 320, 210, old);
        s += pa('M100,130 A110,110 0 0 1 320,130', neu) + pa('M100,130 A110,110 0 0 0 320,130', gone);
        s += ln(100, 130, 100, 60, neu) + ln(320, 130, 320, 60, neu) + ln(100, 130, 100, 210, gone) + ln(320, 130, 320, 210, gone);
        s += click(100, 90, 1) + click(320, 90, 2) + click(210, 20, 3);
        return s + note('two lines to an arc between them (third pick)');
      }
      if (t === 'brk') {
        s += ln(60, 130, 210, 130, neu) + ln(210, 130, 360, 130, 'c-new2') + click(210, 130, 1);
        s += tx(135, 118, 'piece 1', 'v-label', 'middle') + tx(285, 118, 'piece 2', 'v-label', 'middle');
        return s + note('Break: cut a line into two without deleting anything');
      }
      s += ln(80, 60, 80, 200, old) + ln(260, 60, 260, 200, old) + ln(40, 130, 80, 130, neu) + ln(80, 130, 260, 130, gone) + ln(260, 130, 380, 130, neu) + click(170, 130, 1);
      return s + note('Divide (Modify group): deletes the piece between the nearest crossings');
    },
  };

  specs['cad-fillet'] = {
    title: 'Fillet Entities',
    controls: [
      { type: 'seg', key: 'm', label: 'Method', options: [['normal', 'Normal'], ['inverse', 'Inverse'], ['circle', 'Circle'], ['clear', 'Clearance']] },
      { type: 'seg', key: 'trim', label: 'Trim entities', options: [['y', 'On'], ['n', 'Off']] },
    ],
    init: { m: 'normal', trim: 'y' },
    draw({ m, trim }) {
      const X = 110, Y = 190, r = 60;
      let s = '';
      const keepH = trim === 'y' ? ln(X + r, Y, 360, Y, old) + ln(X, Y, X + r, Y, gone) : ln(X, Y, 360, Y, old);
      const keepV = trim === 'y' ? ln(X, Y - r, X, 40, old) + ln(X, Y, X, Y - r, gone) : ln(X, Y, X, 40, old);
      if (m === 'normal') s += keepH + keepV + pa(`M${X},${Y - r} A${r},${r} 0 0 0 ${X + r},${Y}`, neu);
      if (m === 'inverse') s += keepH + keepV + pa(`M${X},${Y - r} A${r},${r} 0 1 1 ${X + r},${Y}`, neu);
      if (m === 'circle') s += ln(X, Y, 360, Y, old) + ln(X, Y, X, 40, old) + ci(X + r, Y - r, r, neu);
      if (m === 'clear') s += keepH + keepV + pa(`M${X},${Y - r} A${r * 0.75},${r * 0.75} 0 0 1 ${X + r},${Y}`, neu) + tx(X + r + 10, Y - r, 'relief past the corner', 'v-label');
      s += tx(X + r * 0.4, Y - r * 0.4, 'R', 'v-label-strong');
      return s + note({ normal: 'the usual rounded corner', inverse: 'the long way around (the other 270°)', circle: 'a full circle tangent to both', clear: 'Clearance: undercut so a square part fits the corner' }[m]);
    },
  };

  specs['cad-chamfer'] = {
    title: 'Chamfer Entities',
    controls: [{ type: 'seg', key: 'm', label: 'Method', options: [['1', '1 Distance'], ['2', '2 Distances'], ['da', 'Distance and angle'], ['w', 'Width']] }],
    init: { m: '1' },
    draw({ m }) {
      const X = 110, Y = 190;
      const [a, b] = m === '1' ? [70, 70] : m === '2' ? [110, 50] : m === 'da' ? [100, 58] : [70, 70];
      let s = ln(X + a, Y, 360, Y, old) + ln(X, Y - b, X, 40, old) + ln(X, Y, X + a, Y, gone) + ln(X, Y, X, Y - b, gone) + ln(X, Y - b, X + a, Y, neu);
      if (m === 'w') s += pa(`M${X + 10},${Y - b - 10} L${X + a + 10},${Y - 10}`, 'c-dim') + tx(X + a / 2 + 24, Y - b / 2 - 10, 'width', 'v-label');
      else {
        s += tx(X + a / 2, Y + 18, m === '1' ? 'D' : 'D1', 'v-label-strong', 'middle');
        if (m !== 'da') s += tx(X - 14, Y - b / 2, m === '1' ? 'D' : 'D2', 'v-label-strong', 'end');
        else s += pa(arcPath(X + a, Y, 28, 120, 180), 'c-dim') + tx(X + a - 40, Y - 8, '30°', 'v-label');
      }
      return s + note({ '1': 'same distance on both sides (45°)', '2': 'different distance on each side', da: 'distance on the first line + angle', w: 'Width = length of the chamfer face itself' }[m]);
    },
  };

  specs['cad-offset'] = {
    title: 'Offset Entity / Offset Chains',
    controls: [
      { type: 'seg', key: 'm', label: 'Method', options: [['copy', 'Copy'], ['move', 'Move'], ['slot', 'Slot']] },
      { type: 'seg', key: 'd', label: 'Direction', options: [['sel', 'Selected side'], ['opp', 'Opposite side'], ['both', 'Both sides']] },
      { type: 'range', key: 'n', label: 'Number', min: 1, max: 3, step: 1, unit: '' },
    ],
    init: { m: 'copy', d: 'sel', n: 1 },
    draw({ m, d, n }) {
      const path = (o) => `M60,${150 - o} H200 A${50 + o},${50 + o} 0 0 0 ${250 + o},${100} V40`;
      let s = '';
      s += pa(path(0), m === 'move' ? gone : old);
      const offs = [];
      for (let i = 1; i <= n; i++) { if (d !== 'opp') offs.push(i * 22); if (d !== 'sel') offs.push(-i * 22); }
      for (const o of offs) s += pa(path(o), neu);
      if (m === 'slot') { const o2 = offs[1] ?? 0; s += ln(60, 150 - offs[0], 60, 150 - o2, neu) + ln(250 + offs[0], 40, 250 + o2, 40, neu) + tx(66, 175, 'ends closed', 'v-label'); }
      s += tx(70, 140, 'original', 'v-label');
      return s + note(m === 'move' ? 'Move: the original goes away' : m === 'slot' ? 'Slot: offsets joined at the ends (open chain)' : 'Copy: keeps the original');
    },
  };

  // --------------------------------------------------------- transform
  specs['cad-xform'] = {
    title: 'Translate, Rotate, Mirror, Scale',
    controls: [
      { type: 'seg', key: 't', label: 'Function', options: [['tr', 'Translate'], ['ro', 'Rotate'], ['mi', 'Mirror'], ['sc', 'Scale']] },
      { type: 'seg', key: 'm', label: 'Method', options: [['copy', 'Copy'], ['move', 'Move'], ['join', 'Join']] },
    ],
    init: { t: 'tr', m: 'copy' },
    draw({ t, m }) {
      const shape = (dx, dy, k = 1, rot = 0, mir = false, cls = neu) => {
        const pts = [[0, 0], [70, 0], [70, 30], [30, 30], [30, 60], [0, 60], [0, 0]].map(([x, y]) => {
          let X = (mir ? -x : x) * k, Y = -y * k;
          const a = (rot * Math.PI) / 180;
          return [dx + X * Math.cos(a) - Y * Math.sin(a), dy + X * Math.sin(a) + Y * Math.cos(a)];
        });
        return pl(pts, cls);
      };
      let s = '';
      const orig = m === 'move' ? 'c-gone' : old;
      if (t === 'tr') { s += shape(70, 190, 1, 0, false, orig) + shape(250, 120) + pa('M140,170 L240,105', 'c-dim') + arrowHead(240, 105, -0.58, 'c-dim-fill') + tx(180, 130, 'ΔX ΔY', 'v-label'); }
      if (t === 'ro') { s += shape(210, 150, 1, 0, false, orig) + shape(210, 150, 1, -60) + cross(210, 150, 'c-origin') + pa(arcPath(210, 150, 90, 0, 60), 'c-dim') + tx(300, 110, '60°', 'v-label'); }
      if (t === 'mi') { s += shape(240, 180, 1, 0, false, orig) + shape(180, 180, 1, 0, true) + ln(210, 30, 210, 220, 'c-axis-y') + tx(214, 40, 'mirror axis', 'v-label'); }
      if (t === 'sc') { s += shape(150, 200, 1, 0, false, orig) + shape(150, 200, 1.8) + cross(150, 200, 'c-origin') + tx(290, 90, 'factor 1.8', 'v-label'); }
      if (m === 'join' && t === 'tr') s += ln(70, 190, 250, 120, 'c-new2') + ln(140, 190, 320, 120, 'c-new2') + ln(70, 130, 250, 60, 'c-new2');
      return s + note(m === 'move' ? 'Move: the original is gone' : m === 'join' ? 'Join: copies plus lines joining the corners' : 'Copy: the original stays');
    },
  };

  specs['cad-array'] = {
    title: 'Rectangular Array',
    controls: [
      { type: 'range', key: 'a', label: 'Direction 1', min: 1, max: 6, step: 1, unit: '' },
      { type: 'range', key: 'b', label: 'Direction 2', min: 1, max: 4, step: 1, unit: '' },
    ],
    init: { a: 4, b: 2 },
    draw({ a, b }) {
      let s = '';
      const dx = 56, dy = 52, x0 = 70, y0 = 190;
      for (let i = 0; i < a; i++) for (let j = 0; j < b; j++) s += ci(x0 + i * dx, y0 - j * dy, 14, i + j === 0 ? old : neu);
      s += pa(`M${x0},${y0 + 26} H${x0 + dx}`, 'c-dim') + tx(x0 + dx / 2, y0 + 40, 'distance', 'v-label', 'middle');
      return s + note(`${a * b} instances: ${a} × ${b} (the original counts)`);
    },
  };

  // ----------------------------------------------------- planes / chaining
  specs['cad-planes'] = {
    title: 'WCS, Cplane and Tplane',
    controls: [{ type: 'seg', key: 'p', label: 'Plane', options: [['top', 'Top'], ['front', 'Front'], ['right', 'Right side']] }],
    init: { p: 'top' },
    draw({ p }) {
      // isometric block
      const o = [170, 175], X = [1, 0.5], Y = [-1, 0.5], Z = [0, -1];
      const P = (x, y, z) => [o[0] + X[0] * x + Y[0] * y, o[1] + X[1] * x * -1 + Y[1] * y * -1 + Z[1] * z];
      const iso = (x, y, z) => [o[0] + 0.87 * x - 0.87 * y, o[1] - 0.5 * x - 0.5 * y - z];
      const b = (pts, c) => pl([...pts, pts[0]].map((q) => iso(...q)), c);
      const L = 120, D = 80, Hh = 50;
      let s = b([[0, 0, Hh], [L, 0, Hh], [L, D, Hh], [0, D, Hh]], p === 'top' ? 'c-plane-on' : old);
      s += b([[0, 0, 0], [L, 0, 0], [L, 0, Hh], [0, 0, Hh]], p === 'front' ? 'c-plane-on' : old);
      s += b([[L, 0, 0], [L, D, 0], [L, D, Hh], [L, 0, Hh]], p === 'right' ? 'c-plane-on' : old);
      const g = p === 'top' ? [[0, 0, Hh], [30, 0, 0], [0, 30, 0]] : p === 'front' ? [[0, 0, 0], [30, 0, 0], [0, 0, 30]] : [[L, 0, 0], [0, 30, 0], [0, 0, 30]];
      const [O, ax, ay] = g, A = iso(...O);
      const Bx = iso(O[0] + ax[0], O[1] + ax[1], O[2] + ax[2]), By = iso(O[0] + ay[0], O[1] + ay[1], O[2] + ay[2]);
      s += ln(A[0], A[1], Bx[0], Bx[1], 'c-axis-x') + ln(A[0], A[1], By[0], By[1], 'c-axis-y') + tx(Bx[0] + 4, Bx[1] + 4, 'X', 'v-label-strong') + tx(By[0] + 4, By[1] - 2, 'Y', 'v-label-strong');
      s += tx(300, 60, `Cplane = ${p === 'top' ? 'Top' : p === 'front' ? 'Front' : 'Right'}`, 'v-label-strong');
      s += tx(300, 80, 'you draw on this face', 'v-label');
      return s + note(p === 'top' ? 'Top: the normal plane for 3-axis vertical milling' : 'Tplane = Front/Right: work on the side (4th axis or a second setup)');
    },
  };

  specs['cad-chain'] = {
    title: 'Chaining',
    controls: [{ type: 'seg', key: 'm', label: 'Selection', options: [['chain', 'Chain'], ['single', 'Single'], ['partial', 'Partial'], ['window', 'Window']] }],
    init: { m: 'chain' },
    draw({ m }) {
      const loop = 'M90,70 H300 A30,30 0 0 1 330,100 V180 H90Z';
      let s = pa(loop, old);
      if (m === 'chain') { s += pa(loop, neu) + click(200, 70, 1) + arrowHead(250, 70, 0, 'c-new-fill', 10) + tx(90, 60, 'start', 'v-label'); return s + note('one click picks every connected entity, arrow = direction'); }
      if (m === 'single') { s += ln(90, 180, 330, 180, neu) + click(210, 180, 1); return s + note('only the entity you click'); }
      if (m === 'partial') { s += pa('M90,70 H300 A30,30 0 0 1 330,100 V140', neu) + click(150, 70, 1) + click(330, 140, 2); return s + note('first and last entity of an open piece of the chain'); }
      s += rc(70, 50, 290, 150, 'c-window') + pa(loop, neu) + tx(74, 45, 'drag a window', 'v-label');
      return s + note('everything fully inside the window');
    },
  };

  // ------------------------------------------------------------ solids
  specs['cad-extrude'] = {
    title: 'Solid Extrude',
    controls: [
      { type: 'seg', key: 't', label: 'Type', options: [['create', 'Create body'], ['cut', 'Cut body'], ['boss', 'Add boss']] },
      { type: 'seg', key: 'd', label: 'Distance', options: [['dist', 'Distance'], ['all', 'Through all'], ['both', 'Both directions']] },
    ],
    init: { t: 'create', d: 'dist' },
    draw({ t, d }) {
      let s = tx(W - 10, 16, 'Section view', 'v-label', 'end');
      const base = 190;
      if (t === 'create') {
        const top = d === 'both' ? 80 : 100, bot = d === 'both' ? 220 : base;
        s += rc(110, top, 200, bot - top, 'c-solid') + ln(100, base, 320, base, 'c-plane-line') + tx(325, base + 4, 'chain on this plane', 'v-label');
        return s + note(d === 'both' ? 'both directions from the chain' : 'a new body from the chain');
      }
      s += rc(60, 90, 300, 100, 'c-solid-old');
      if (t === 'cut') {
        const depth = d === 'all' ? 100 : 50;
        s += rc(160, 90, 100, depth, 'c-cut') + ln(150, 90, 270, 90, 'c-plane-line');
        return s + note(d === 'all' ? 'Through all: cuts the whole body' : 'Cut body: removes material from a target body');
      }
      s += rc(160, 40, 100, 50, 'c-solid') + ln(150, 90, 270, 90, 'c-plane-line');
      return s + note('Add boss: adds to the target body');
    },
  };

  specs['cad-push-pull'] = {
    title: 'Push-Pull (Model Prep)',
    controls: [{ type: 'range', key: 'd', label: 'Pull face', min: -30, max: 30, step: 2, unit: ' mm' }],
    init: { d: 10 },
    draw({ d }) {
      let s = tx(W - 10, 16, 'Section view', 'v-label', 'end');
      s += rc(80, 110, 260, 90, 'c-solid-old');
      const y = 110 - d * 2;
      s += d > 0 ? rc(160, y, 100, 110 - y, 'c-solid') : rc(160, 110, 100, -d * 2, 'c-cut');
      s += ln(160, y, 260, y, 'c-face') + arrowHead(210, y - (d >= 0 ? 6 : -6), d >= 0 ? -Math.PI / 2 : Math.PI / 2, 'c-new-fill', 10);
      return s + note('drag a face: no history needed, works on STEP files');
    },
  };

  specs['cad-dims'] = {
    title: 'Dimension types',
    controls: [{ type: 'seg', key: 't', label: 'Type', options: [['h', 'Horizontal'], ['v', 'Vertical'], ['c', 'Circular'], ['a', 'Angular'], ['base', 'Baseline'], ['ord', 'Ordinate']] }],
    init: { t: 'h' },
    draw({ t }) {
      let s = rc(90, 90, 220, 110, old) + ci(250, 145, 24, old);
      const dim = (x1, y1, x2, y2, label, off = -24) => {
        const horiz = y1 === y2;
        return horiz
          ? ln(x1, y1 - 4, x1, y1 + off - 6, 'c-dim') + ln(x2, y2 - 4, x2, y2 + off - 6, 'c-dim') + ln(x1, y1 + off, x2, y2 + off, 'c-dim') + arrowHead(x1, y1 + off, Math.PI, 'c-dim-fill', 7) + arrowHead(x2, y2 + off, 0, 'c-dim-fill', 7) + tx((x1 + x2) / 2, y1 + off - 5, label, 'v-label-strong', 'middle')
          : ln(x1 - 4, y1, x1 + off - 6, y1, 'c-dim') + ln(x2 - 4, y2, x2 + off - 6, y2, 'c-dim') + ln(x1 + off, y1, x2 + off, y2, 'c-dim') + arrowHead(x1 + off, y1, -Math.PI / 2, 'c-dim-fill', 7) + arrowHead(x2 + off, y2, Math.PI / 2, 'c-dim-fill', 7) + tx(x1 + off - 6, (y1 + y2) / 2 + 4, label, 'v-label-strong', 'end');
      };
      if (t === 'h') s += dim(90, 90, 310, 90, '100');
      if (t === 'v') s += dim(90, 90, 90, 200, '50');
      if (t === 'c') s += ln(267, 128, 320, 70, 'c-dim') + ln(320, 70, 350, 70, 'c-dim') + tx(352, 74, 'Ø22', 'v-label-strong');
      if (t === 'a') s += ln(90, 200, 330, 120, old) + pa(arcPath(90, 200, 120, 0, 18.4), 'c-dim') + tx(215, 192, '18°', 'v-label-strong');
      if (t === 'base') s += dim(90, 90, 250, 90, '72', -20) + dim(90, 90, 310, 90, '100', -44);
      if (t === 'ord') { s += ['0', '72', '100'].map((l, i) => { const x = [90, 250, 310][i]; return ln(x, 86, x, 60, 'c-dim') + tx(x, 54, l, 'v-label-strong', 'middle'); }).join(''); }
      return s + note({ h: 'Horizontal: X distance only', v: 'Vertical: Y distance only', c: 'Circular: diameter or radius of an arc', a: 'Angular: between two lines', base: 'Baseline: every dimension from one edge', ord: 'Ordinate: values from zero, the way you program' }[t]);
    },
  };

  specs['cad-surface'] = {
    title: 'Ways to create a surface',
    controls: [{ type: 'seg', key: 't', label: 'Function', options: [['ext', 'Extrude'], ['rev', 'Revolve'], ['loft', 'Loft'], ['sweep', 'Sweep'], ['flat', 'Flat Boundary']] }],
    init: { t: 'ext' },
    draw({ t }) {
      let s = '';
      if (t === 'ext') { s += pa('M80,190 Q150,140 220,190 T360,190', old) + pa('M80,190 Q150,140 220,190 T360,190 V100 Q290,50 220,100 T80,100Z', 'c-surf') + tx(84, 210, 'profile', 'v-label'); return s + note('pull a profile along a straight direction'); }
      if (t === 'rev') { s += ln(210, 30, 210, 230, 'c-axis-y') + pa('M210,50 C260,60 230,140 280,210', old) + pa('M210,50 C260,60 230,140 280,210 L140,210 C190,140 160,60 210,50Z', 'c-surf') + tx(216, 40, 'axis', 'v-label'); return s + note('spin a profile around an axis'); }
      if (t === 'loft') { s += pa('M90,190 Q210,150 330,190', old) + pa('M120,70 Q210,40 300,70', old) + pa('M90,190 Q210,150 330,190 L300,70 Q210,40 120,70Z', 'c-surf'); return s + note('blend through two or more cross-sections'); }
      if (t === 'sweep') { s += pa('M70,200 C150,200 200,60 350,70', 'c-dim') + ci(70, 200, 18, old) + pa('M70,182 C150,182 200,42 350,52 L350,88 C200,78 150,218 70,218Z', 'c-surf'); return s + note('slide a section along a path'); }
      s += pa('M90,80 H330 L300,200 H120Z', 'c-surf') + pa('M90,80 H330 L300,200 H120Z', old);
      return s + note('a flat surface inside a closed chain');
    },
  };
}
