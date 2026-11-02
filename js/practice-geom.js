// Geometry for the practice parts: turns feature descriptions into lines/arcs/circles,
// then into a DXF (R12, opens in Mastercam) or SVG. No browser APIs, so the build script can use it too.

import pc from '../vendor/polygon-clipping.esm.js';

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

// Polygon with a fillet radius per corner: pts [[x, y, r?], ...] in any order.
// Returns the corners as { t1, t2, c, r, left } (tangent points, centre, left turn?) in CCW order.
function filletCorners(pts0) {
  const a2 = pts0.reduce((s, [x, y], i) => { const [x2, y2] = pts0[(i + 1) % pts0.length]; return s + x * y2 - x2 * y; }, 0);
  const pts = a2 < 0 ? [...pts0].reverse() : pts0;
  return pts.map((P, i) => {
    const A = pts[(i - 1 + pts.length) % pts.length], B = pts[(i + 1) % pts.length], r = P[2] || 0;
    const u1 = norm2([A[0] - P[0], A[1] - P[1]]), u2 = norm2([B[0] - P[0], B[1] - P[1]]);
    const left = (P[0] - A[0]) * (B[1] - P[1]) - (P[1] - A[1]) * (B[0] - P[0]) > 0;
    if (!r) return { t1: [P[0], P[1]], t2: [P[0], P[1]], r: 0, left };
    const half = Math.acos(Math.max(-1, Math.min(1, u1[0] * u2[0] + u1[1] * u2[1]))) / 2;
    const t = r / Math.tan(half), bis = norm2([u1[0] + u2[0], u1[1] + u2[1]]), d = r / Math.sin(half);
    return { t1: [P[0] + u1[0] * t, P[1] + u1[1] * t], t2: [P[0] + u2[0] * t, P[1] + u2[1] * t], c: [P[0] + bis[0] * d, P[1] + bis[1] * d], r, left };
  });
}
const norm2 = ([x, y]) => { const l = Math.hypot(x, y) || 1; return [x / l, y / l]; };
const ang = (c, p) => (Math.atan2(p[1] - c[1], p[0] - c[0]) * 180) / Math.PI;

function polyEnts(pts, layer) {
  const C = filletCorners(pts), out = [];
  C.forEach((k, i) => {
    const nx = C[(i + 1) % C.length];
    if (k.r) out.push(k.left ? { t: 'arc', c: k.c, r: k.r, a0: ang(k.c, k.t1), a1: ang(k.c, k.t2), layer } : { t: 'arc', c: k.c, r: k.r, a0: ang(k.c, k.t2), a1: ang(k.c, k.t1), layer });
    out.push({ t: 'line', a: k.t2, b: nx.t1, layer });
  });
  return out;
}

// Rotate entities about (cx, cy) by `deg`.
function rotEnts(ents, cx, cy, deg) {
  if (!deg) return ents;
  const c = Math.cos(rad(deg)), s = Math.sin(rad(deg));
  const R = ([x, y]) => [cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c];
  return ents.map((e) => (e.t === 'line' ? { ...e, a: R(e.a), b: R(e.b) } : { ...e, c: R(e.c), a0: e.a0 + deg, a1: e.a1 + deg }));
}

export function entities(part) {
  const out = [];
  if (part.base.rrect) out.push(...rrect(...part.base.rrect.slice(0, 5), 'BLANK'));
  for (const f of part.features) {
    const zp = f.z1 != null ? `_Z${f.z1}` : '';
    const L = f.layer || `${f.id}_${(f.name || '').toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 30 - f.id.length - zp.length)}${zp}`;
    const g = f.geo;
    if (!g) continue;
    if (g.band) {
      const bb = bbox(polyOf(part.base));
      for (const v of g.band) {
        if (g.axis === 'y') { if (v > bb[1] && v < bb[3]) out.push({ t: 'line', a: [bb[0], v], b: [bb[2], v], layer: L }); }
        else if (v > bb[0] && v < bb[2]) out.push({ t: 'line', a: [v, bb[1]], b: [v, bb[3]], layer: L });
      }
      continue;
    }
    if (g.rrect) { const [cx, cy, w, h, r, a = 0] = g.rrect; out.push(...rotEnts(rrect(cx, cy, w, h, r, L), cx, cy, a)); }
    if (g.poly) out.push(...polyEnts(g.poly, L));
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
    const [cx, cy, w, h, r0, a = 0] = geo.rrect, r = Math.min(r0, w / 2, h / 2);
    let pts = [];
    if (!r) pts = [[cx - w / 2, cy - h / 2], [cx + w / 2, cy - h / 2], [cx + w / 2, cy + h / 2], [cx - w / 2, cy + h / 2]];
    else {
      const corners = [[cx + w / 2 - r, cy - h / 2 + r, -90], [cx + w / 2 - r, cy + h / 2 - r, 0], [cx - w / 2 + r, cy + h / 2 - r, 90], [cx - w / 2 + r, cy - h / 2 + r, 180]];
      for (const [x, y, q] of corners) for (let i = 0; i <= 8; i++) { const t = rad(q + (90 * i) / 8); pts.push([x + r * Math.cos(t), y + r * Math.sin(t)]); }
    }
    if (!a) return pts;
    const c = Math.cos(rad(a)), s = Math.sin(rad(a));
    return pts.map(([x, y]) => [cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c]);
  }
  if (geo.poly) {
    const out = [];
    for (const k of filletCorners(geo.poly)) {
      if (!k.r) { out.push(k.t1); continue; }
      let a0 = ang(k.c, k.t1), a1 = ang(k.c, k.t2);
      if (k.left) { while (a1 < a0) a1 += 360; } else { while (a1 > a0) a1 -= 360; }
      for (let i = 0; i <= 8; i++) { const t = rad(a0 + ((a1 - a0) * i) / 8); out.push([k.c[0] + k.r * Math.cos(t), k.c[1] + k.r * Math.sin(t)]); }
    }
    return out;
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
// Clip a polygon to coordinate[k] <= a (keep = 'low') or >= a ('high'); k = 0 for X, 1 for Y.
// Exact for convex outlines (channels are only used on convex ones).
function clipAxis(poly, a, keep, k) {
  const inn = (p) => (keep === 'low' ? p[k] <= a : p[k] >= a), out = [];
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i], q = poly[(i + 1) % poly.length];
    if (inn(p)) out.push(p);
    if (inn(p) !== inn(q)) {
      const t = (a - p[k]) / (q[k] - p[k]);
      out.push(k === 0 ? [a, p[1] + t * (q[1] - p[1])] : [p[0] + t * (q[0] - p[0]), a]);
    }
  }
  return out.length > 2 && Math.abs(area(out)) > 1e-3 ? out : null;
}
function area(p) { return p.reduce((s, [x, y], i) => { const [x2, y2] = p[(i + 1) % p.length]; return s + x * y2 - x2 * y; }, 0) / 2; }
const ccw = (p) => (area(p) < 0 ? [...p].reverse() : p);
const cw = (p) => (area(p) > 0 ? [...p].reverse() : p);

export function slabs(part) {
  // Exact 2D booleans per Z band: footprint − cuts − channels + islands − cuts inside islands.
  const H = part.H;
  const feats = part.features.flatMap(expand);
  const cuts = feats.filter((f) => f.kind === 'cut').map((f) => ({ ...f, z0: f.z0 ?? 0, poly: polyOf(f.geo) }));
  cuts.forEach((c) => (c.bb = bbox(c.poly)));
  const islands = feats.filter((f) => f.kind === 'island').map((f) => ({ ...f, top: f.top ?? 0, poly: polyOf(f.geo) }));
  islands.forEach((c) => (c.bb = bbox(c.poly)));
  const outsides = feats.filter((f) => f.kind === 'outside').map((f) => ({ ...f, poly: polyOf(f.geo) }));
  const channels = feats.filter((f) => f.kind === 'channel');
  const base = polyOf(part.base), bb = bbox(base), big = 1000;
  const zs = [...new Set([0, -H, ...cuts.flatMap((c) => [c.z0, c.z1]), ...islands.map((i) => i.top), ...outsides.map((o) => o.z1), ...channels.map((c) => c.z1)].map((z) => +z.toFixed(4)))]
    .filter((z) => z <= 0 && z >= -H).sort((a, b) => b - a);
  const ring = (p) => { const r = p.map(([x, y]) => [x, y]); r.push(r[0]); return [r]; };
  const out = [];
  for (let k = 0; k < zs.length - 1; k++) {
    const zt = zs[k], zb = zs[k + 1], mid = (zt + zb) / 2;
    let geom = [ring(base)];
    const os = outsides.filter((o) => o.z1 < mid);
    for (const o of os) geom = pc.intersection(geom, ring(o.poly)); // each wall limits the part above its depth
    for (const ch of channels.filter((c) => c.z1 < mid)) {
      const [v0, v1] = ch.geo.band;
      const r = ch.geo.axis === 'y' ? [[-big, v0], [big, v0], [big, v1], [-big, v1]] : [[v0, -big], [v1, -big], [v1, big], [v0, big]];
      geom = pc.difference(geom, ring(r));
    }
    const act = cuts.filter((c) => c.z0 > mid && c.z1 < mid);
    if (act.length) geom = pc.difference(geom, ...act.map((c) => ring(c.poly)));
    const isl = islands.filter((i) => i.top > mid && act.some((c) => pc.intersection(ring(i.poly), ring(c.poly)).length));
    if (isl.length) {
      geom = pc.union(geom, ...isl.map((i) => ring(i.poly)));
      const inner = act.filter((c) => isl.some((i) => inside(c.bb, i.bb)));
      if (inner.length) geom = pc.difference(geom, ...inner.map((c) => ring(c.poly)));
    }
    const pieces = geom.map((poly) => ({ outer: ccw(poly[0].slice(0, -1)), holes: poly.slice(1).map((h) => cw(h.slice(0, -1))) }));
    out.push({ zt, zb, pieces });
  }
  void bb;
  return out;
}

// Bounding box [x0, y0, x1, y1] of one geometry (for drawings and labels).
export const geoBox = (geo) => bbox(polyOf(geo));

// Closed outline of one shape as segments in order, for the STEP builder:
// { t: 'line', a, b } | { t: 'arc', a, m, b } (start, a point on the arc, end) | { t: 'circle', c, r }.
export function loopOf(geo) {
  if (geo.circle) return [{ t: 'circle', c: [geo.circle[0], geo.circle[1]], r: geo.circle[2] / 2 }];
  if (geo.obround) {
    const [cx, cy, len, w, a] = geo.obround, r = w / 2, h = (len - w) / 2, u = [Math.cos(rad(a)), Math.sin(rad(a))], n = [-u[1], u[0]];
    const p = (s, t) => [cx + u[0] * s + n[0] * t, cy + u[1] * s + n[1] * t];
    return [{ t: 'line', a: p(-h, -r), b: p(h, -r) }, { t: 'arc', a: p(h, -r), m: p(h + r, 0), b: p(h, r) }, { t: 'line', a: p(h, r), b: p(-h, r) }, { t: 'arc', a: p(-h, r), m: p(-h - r, 0), b: p(-h, -r) }];
  }
  let pts;
  if (geo.rrect) {
    const [cx, cy, w, h, r = 0, a = 0] = geo.rrect, c = Math.cos(rad(a)), s = Math.sin(rad(a));
    pts = [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]].map(([x, y]) => [cx + x * c - y * s, cy + x * s + y * c, r]);
  } else pts = geo.poly;
  const C = filletCorners(pts), out = [];
  C.forEach((k, i) => {
    if (k.r) {
      let a0 = ang(k.c, k.t1), a1 = ang(k.c, k.t2);
      if (k.left) { while (a1 < a0) a1 += 360; } else { while (a1 > a0) a1 -= 360; }
      const am = rad((a0 + a1) / 2);
      out.push({ t: 'arc', a: k.t1, m: [k.c[0] + k.r * Math.cos(am), k.c[1] + k.r * Math.sin(am)], b: k.t2 });
    }
    const nx = C[(i + 1) % C.length];
    if (Math.hypot(nx.t1[0] - k.t2[0], nx.t1[1] - k.t2[1]) > 1e-6) out.push({ t: 'line', a: k.t2, b: nx.t1 });
  });
  return out;
}

// Everything the STEP builder needs, as plain JSON.
export function solidSpec(part) {
  const feats = part.features.flatMap(expand).filter((f) => f.geo && f.kind !== 'note' && f.kind !== 'face');
  return {
    id: part.id, H: part.H, base: loopOf(part.base),
    features: feats.map((f) => ({ id: f.id, kind: f.kind, z0: f.z0 ?? 0, z1: f.z1 ?? -part.H, top: f.top ?? 0, band: f.geo.band, axis: f.geo.axis || 'x', loop: f.geo.band ? null : loopOf(f.geo), bb: f.geo.band ? null : bbox(polyOf(f.geo)) })),
  };
}
