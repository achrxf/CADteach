// Geometry for the practice parts: turns feature descriptions into lines/arcs/circles,
// then into a DXF (R12, opens in Mastercam) or SVG. No browser APIs, so the build script can use it too.

const rad = (d) => (d * Math.PI) / 180;

function rrect(cx, cy, w, h, r, layer) {
  const x0 = cx - w / 2, x1 = cx + w / 2, y0 = cy - h / 2, y1 = cy + h / 2;
  if (!r) return [[x0, y0, x1, y0], [x1, y0, x1, y1], [x1, y1, x0, y1], [x0, y1, x0, y0]].map(([a, b, c, d]) => ({ t: 'line', a: [a, b], b: [c, d], layer }));
  return [
    { t: 'line', a: [x0 + r, y0], b: [x1 - r, y0], layer },
    { t: 'arc', c: [x1 - r, y0 + r], r, a0: 270, a1: 360, layer },
    { t: 'line', a: [x1, y0 + r], b: [x1, y1 - r], layer },
    { t: 'arc', c: [x1 - r, y1 - r], r, a0: 0, a1: 90, layer },
    { t: 'line', a: [x1 - r, y1], b: [x0 + r, y1], layer },
    { t: 'arc', c: [x0 + r, y1 - r], r, a0: 90, a1: 180, layer },
    { t: 'line', a: [x0, y1 - r], b: [x0, y0 + r], layer },
    { t: 'arc', c: [x0 + r, y0 + r], r, a0: 180, a1: 270, layer },
  ];
}

// Obround slot: overall length along `angle` (degrees), width w.
function obround(cx, cy, len, w, angle, layer) {
  const r = w / 2, h = (len - w) / 2, u = [Math.cos(rad(angle)), Math.sin(rad(angle))], n = [-u[1], u[0]];
  const p = (s, t) => [cx + u[0] * s + n[0] * t, cy + u[1] * s + n[1] * t];
  return [
    { t: 'line', a: p(-h, -r), b: p(h, -r), layer },
    { t: 'arc', c: p(h, 0), r, a0: angle - 90, a1: angle + 90, layer },
    { t: 'line', a: p(h, r), b: p(-h, r), layer },
    { t: 'arc', c: p(-h, 0), r, a0: angle + 90, a1: angle + 270, layer },
  ];
}

export function entities(part) {
  const out = [];
  if (part.base.rrect) out.push(...rrect(...part.base.rrect, 'BLANK'));
  for (const f of part.features) {
    const zp = f.z1 != null ? `_Z${f.z1}` : '';
    const L = f.layer || `${f.id}_${(f.name || '').toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 30 - f.id.length - zp.length)}${zp}`;
    const g = f.geo;
    if (!g) continue;
    if (g.band) {
      const bb = bbox(polyOf(part.base));
      for (const x of g.band) if (x > bb[0] && x < bb[2]) out.push({ t: 'line', a: [x, bb[1]], b: [x, bb[3]], layer: L });
      continue;
    }
    if (g.rrect) out.push(...rrect(...g.rrect, L));
    if (g.obround) out.push(...obround(...g.obround, L));
    if (g.circle) out.push({ t: 'circle', c: [g.circle[0], g.circle[1]], r: g.circle[2] / 2, layer: L });
    if (g.circles) for (const [x, y] of g.circles.at) out.push({ t: 'circle', c: [x, y], r: g.circles.d / 2, layer: L });
    if (g.lines) for (const [a, b] of g.lines) out.push({ t: 'line', a, b, layer: L });
  }
  return out;
}

const n = (v) => (Math.abs(v) < 1e-9 ? 0 : +v.toFixed(4));

export function toDXF(part) {
  const ents = entities(part);
  const layers = [...new Set(ents.map((e) => e.layer))];
  const L = [];
  const g = (code, val) => L.push(String(code), String(val));
  g(0, 'SECTION'); g(2, 'HEADER'); g(9, '$ACADVER'); g(1, 'AC1009'); g(9, '$INSUNITS'); g(70, 4); g(9, '$MEASUREMENT'); g(70, 1); g(0, 'ENDSEC');
  g(0, 'SECTION'); g(2, 'TABLES'); g(0, 'TABLE'); g(2, 'LAYER'); g(70, layers.length);
  layers.forEach((name, i) => { g(0, 'LAYER'); g(2, name); g(70, 0); g(62, (i % 6) + 1); g(6, 'CONTINUOUS'); });
  g(0, 'ENDTAB'); g(0, 'ENDSEC');
  g(0, 'SECTION'); g(2, 'ENTITIES');
  for (const e of ents) {
    if (e.t === 'line') { g(0, 'LINE'); g(8, e.layer); g(10, n(e.a[0])); g(20, n(e.a[1])); g(30, 0); g(11, n(e.b[0])); g(21, n(e.b[1])); g(31, 0); }
    if (e.t === 'circle') { g(0, 'CIRCLE'); g(8, e.layer); g(10, n(e.c[0])); g(20, n(e.c[1])); g(30, 0); g(40, n(e.r)); }
    if (e.t === 'arc') { g(0, 'ARC'); g(8, e.layer); g(10, n(e.c[0])); g(20, n(e.c[1])); g(30, 0); g(40, n(e.r)); g(50, n(((e.a0 % 360) + 360) % 360)); g(51, n(((e.a1 % 360) + 360) % 360)); }
  }
  g(0, 'ENDSEC'); g(0, 'EOF');
  return L.join('\r\n') + '\r\n';
}

// SVG path data in drawing units (y flipped so +Y is up).
export function svgPaths(part) {
  const P = (x, y) => `${n(x)} ${n(-y)}`;
  return entities(part).map((e) => {
    let d = '';
    if (e.t === 'line') d = `M${P(...e.a)}L${P(...e.b)}`;
    if (e.t === 'circle') d = `M${P(e.c[0] - e.r, e.c[1])}a${e.r} ${e.r} 0 1 0 ${2 * e.r} 0a${e.r} ${e.r} 0 1 0 ${-2 * e.r} 0`;
    if (e.t === 'arc') {
      const s = [e.c[0] + e.r * Math.cos(rad(e.a0)), e.c[1] + e.r * Math.sin(rad(e.a0))];
      const t = [e.c[0] + e.r * Math.cos(rad(e.a1)), e.c[1] + e.r * Math.sin(rad(e.a1))];
      const large = (((e.a1 - e.a0) % 360) + 360) % 360 > 180 ? 1 : 0;
      d = `M${P(...s)}A${e.r} ${e.r} 0 ${large} 0 ${P(...t)}`;
    }
    return { d, layer: e.layer };
  });
}

// ---------------------------------------------------------------------------
// 2.5D solid as stacked slabs, for the 3D preview and the STL download.
// Each slab: a list of pieces { outer: [[x,y]...], holes: [[[x,y]...]] } between zb and zt.

const SEG = 48;
function polyOf(geo) {
  if (geo.rrect) {
    const [cx, cy, w, h, r0] = geo.rrect, r = Math.min(r0, w / 2, h / 2), pts = [];
    if (!r) return [[cx - w / 2, cy - h / 2], [cx + w / 2, cy - h / 2], [cx + w / 2, cy + h / 2], [cx - w / 2, cy + h / 2]];
    const corners = [[cx + w / 2 - r, cy - h / 2 + r, -90], [cx + w / 2 - r, cy + h / 2 - r, 0], [cx - w / 2 + r, cy + h / 2 - r, 90], [cx - w / 2 + r, cy - h / 2 + r, 180]];
    for (const [x, y, a] of corners) for (let i = 0; i <= 8; i++) { const t = rad(a + (90 * i) / 8); pts.push([x + r * Math.cos(t), y + r * Math.sin(t)]); }
    return pts;
  }
  if (geo.circle) {
    const [cx, cy, d] = geo.circle, pts = [];
    for (let i = 0; i < SEG; i++) { const t = (2 * Math.PI * i) / SEG; pts.push([cx + (d / 2) * Math.cos(t), cy + (d / 2) * Math.sin(t)]); }
    return pts;
  }
  if (geo.obround) {
    const [cx, cy, len, w, ang] = geo.obround, r = w / 2, h = (len - w) / 2, u = [Math.cos(rad(ang)), Math.sin(rad(ang))], pts = [];
    for (const [s, a0] of [[h, ang - 90], [-h, ang + 90]]) for (let i = 0; i <= 16; i++) { const t = rad(a0 + (180 * i) / 16); pts.push([cx + u[0] * s + r * Math.cos(t), cy + u[1] * s + r * Math.sin(t)]); }
    return pts;
  }
  return null;
}
// Expand multi-instance geometry (circles: { d, at }) into single shapes.
const expand = (f) => (f.geo?.circles ? f.geo.circles.at.map(([x, y]) => ({ ...f, geo: { circle: [x, y, f.geo.circles.d] } })) : [f]);

const bbox = (pts) => pts.reduce((b, [x, y]) => [Math.min(b[0], x), Math.min(b[1], y), Math.max(b[2], x), Math.max(b[3], y)], [Infinity, Infinity, -Infinity, -Infinity]);
const inside = (a, b) => a[0] >= b[0] - 1e-6 && a[1] >= b[1] - 1e-6 && a[2] <= b[2] + 1e-6 && a[3] <= b[3] + 1e-6;
function pointIn(pt, poly) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if (yi > pt[1] !== yj > pt[1] && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}
// Clip a convex polygon to x <= a (keep = 'left') or x >= a ('right').
function clipX(poly, a, keep) {
  const inn = (p) => (keep === 'left' ? p[0] <= a : p[0] >= a), out = [];
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i], q = poly[(i + 1) % poly.length];
    if (inn(p)) out.push(p);
    if (inn(p) !== inn(q)) { const t = (a - p[0]) / (q[0] - p[0]); out.push([a, p[1] + t * (q[1] - p[1])]); }
  }
  return out.length > 2 ? out : null;
}
const area = (p) => p.reduce((s, [x, y], i) => { const [x2, y2] = p[(i + 1) % p.length]; return s + x * y2 - x2 * y; }, 0) / 2;
const ccw = (p) => (area(p) < 0 ? [...p].reverse() : p);
const cw = (p) => (area(p) > 0 ? [...p].reverse() : p);

export function slabs(part) {
  const H = part.H;
  const feats = part.features.flatMap(expand);
  const cuts = feats.filter((f) => f.kind === 'cut').map((f) => ({ ...f, z0: f.z0 ?? 0, poly: polyOf(f.geo) }));
  cuts.forEach((c) => (c.bb = bbox(c.poly)));
  const islands = feats.filter((f) => f.kind === 'island').map((f) => ({ ...f, top: f.top ?? 0, poly: polyOf(f.geo) }));
  islands.forEach((c) => (c.bb = bbox(c.poly)));
  const outsides = feats.filter((f) => f.kind === 'outside').map((f) => ({ ...f, poly: polyOf(f.geo) }));
  const channels = feats.filter((f) => f.kind === 'channel');
  const zs = [...new Set([0, -H, ...cuts.flatMap((c) => [c.z0, c.z1]), ...islands.map((i) => i.top), ...outsides.map((o) => o.z1), ...channels.map((c) => c.z1)].map((z) => +z.toFixed(4)))]
    .filter((z) => z <= 0 && z >= -H).sort((a, b) => b - a);
  const base = polyOf(part.base);
  const out = [];
  for (let k = 0; k < zs.length - 1; k++) {
    const zt = zs[k], zb = zs[k + 1];
    const os = outsides.filter((o) => o.z1 <= zb + 1e-6);
    let pieces = [os.length ? os[0].poly : base];
    for (const ch of channels.filter((c) => c.z1 <= zb + 1e-6)) {
      const [x0, x1] = ch.geo.band;
      pieces = pieces.flatMap((p) => [clipX(p, x0, 'left'), clipX(p, x1, 'right')]).filter(Boolean);
    }
    const act = cuts.filter((c) => c.z0 >= zt - 1e-6 && c.z1 <= zb + 1e-6);
    const isl = islands.filter((i) => i.top >= zt - 1e-6 && act.some((c) => inside(i.bb, c.bb)));
    const P = pieces.map((p) => ({ outer: ccw(p), holes: [] }));
    const I = isl.map((i) => ({ outer: ccw(i.poly), holes: [] }));
    for (const c of act) {
      const center = [(c.bb[0] + c.bb[2]) / 2, (c.bb[1] + c.bb[3]) / 2];
      const n = isl.findIndex((i) => inside(c.bb, i.bb));
      const bigger = (o) => o !== c && inside(c.bb, o.bb) && !(inside(o.bb, c.bb) && act.indexOf(o) > act.indexOf(c));
      if (n >= 0) {
        // inside an island: skip if another cut inside the same island already covers it
        if (act.some((o) => bigger(o) && inside(o.bb, isl[n].bb))) continue;
        I[n].holes.push(cw(c.poly));
        continue;
      }
      if (act.some(bigger)) continue;
      const host = P.find((p) => pointIn(center, p.outer));
      if (host) host.holes.push(cw(c.poly));
    }
    out.push({ zt, zb, pieces: [...P, ...I] });
  }
  return out;
}
