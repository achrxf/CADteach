// 3D operation previews: stock, finished part, toolpath (blue feed, amber rapid)
// and a tool running along it. Three.js is loaded lazily the first time a
// preview is shown so the rest of the site stays light.

let THREE = null;
let OrbitControls = null;
async function load() {
  if (!THREE) {
    THREE = await import('three');
    ({ OrbitControls } = await import('three/addons/OrbitControls.js'));
  }
}

const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#888';
const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---- geometry helpers (mm, Z up) ---------------------------------------
const STOCK = { x: 100, y: 70, z: 25 };

function roundedRect(path, cx, cy, w, h, r, ccw = true) {
  const x = cx - w / 2, y = cy - h / 2;
  r = Math.min(r, w / 2, h / 2);
  if (ccw) {
    path.moveTo(x + r, y);
    path.lineTo(x + w - r, y); path.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false);
    path.lineTo(x + w, y + h - r); path.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2, false);
    path.lineTo(x + r, y + h); path.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false);
    path.lineTo(x, y + r); path.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false);
  } else {
    path.moveTo(x + r, y);
    path.absarc(x + r, y + r, r, Math.PI * 1.5, Math.PI, true); path.lineTo(x, y + h - r);
    path.absarc(x + r, y + h - r, r, Math.PI, Math.PI / 2, true); path.lineTo(x + w - r, y + h);
    path.absarc(x + w - r, y + h - r, r, Math.PI / 2, 0, true); path.lineTo(x + w, y + r);
    path.absarc(x + w - r, y + r, r, 0, -Math.PI / 2, true); path.lineTo(x + r, y);
  }
  return path;
}

// Points around a rounded rectangle (closed), starting mid bottom edge, CW or CCW.
function rrPoints(cx, cy, w, h, r, z, ccw = true, seg = 10) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  const x0 = cx - w / 2, y0 = cy - h / 2, x1 = cx + w / 2, y1 = cy + h / 2;
  const pts = [];
  const arc = (ax, ay, a0, a1) => { for (let i = 0; i <= seg; i++) { const a = a0 + ((a1 - a0) * i) / seg; pts.push([ax + r * Math.cos(a), ay + r * Math.sin(a), z]); } };
  pts.push([cx, y0, z]);
  arc(x1 - r, y0 + r, -Math.PI / 2, 0);
  arc(x1 - r, y1 - r, 0, Math.PI / 2);
  arc(x0 + r, y1 - r, Math.PI / 2, Math.PI);
  arc(x0 + r, y0 + r, Math.PI, Math.PI * 1.5);
  pts.push([cx, y0, z]);
  return ccw ? pts : pts.reverse();
}

const helixPts = (cx, cy, r, z0, z1, pitch, ccw = true, seg = 36) => {
  const turns = Math.abs(z1 - z0) / pitch;
  const n = Math.max(2, Math.ceil(turns * seg));
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const f = i / n, a = (ccw ? 1 : -1) * f * turns * Math.PI * 2;
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a), z0 + (z1 - z0) * f]);
  }
  return pts;
};
const circlePts = (cx, cy, r, z, ccw = true, seg = 48, a0 = 0) => {
  const pts = [];
  for (let i = 0; i <= seg; i++) { const a = a0 + (ccw ? 1 : -1) * (i / seg) * Math.PI * 2; pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a), z]); }
  return pts;
};

// Each scene: { part: (THREE) => Mesh geometry, toolR, path: [[x,y,z,rapid?]...] }
// A path is built with a small builder that marks rapid vs feed moves.
function builder() {
  const p = [];
  return {
    rapid(x, y, z) { p.push([x, y, z, 1]); return this; },
    feed(x, y, z) { p.push([x, y, z, 0]); return this; },
    feedPts(pts) { for (const q of pts) p.push([q[0], q[1], q[2], 0]); return this; },
    pts: p,
  };
}

const cx = STOCK.x / 2, cy = STOCK.y / 2;
const SAFE = 40;

const scenes = {
  facing() {
    const R = 25, top = STOCK.z, cut = top - 1;
    const b = builder();
    const y0 = -R * 0.6, y1 = STOCK.y + R * 0.6, step = (y1 - y0) / Math.ceil((y1 - y0) / (R * 1.4));
    b.rapid(-R - 10, y0, SAFE).rapid(-R - 10, y0, cut + 2).feed(-R - 10, y0, cut);
    for (let y = y0; y <= y1 + 0.01; y += step) {
      b.feed(-R - 10, y, cut).feed(STOCK.x + R + 10, y, cut);
      if (y + step <= y1 + 0.01) b.rapid(STOCK.x + R + 10, y, cut + 2).rapid(-R - 10, y + step, cut + 2).feed(-R - 10, y + step, cut);
    }
    b.rapid(STOCK.x + R + 10, y1, SAFE);
    return { toolR: R, toolH: 30, path: b.pts, part: (T) => box(T, STOCK.x, STOCK.y, cut) };
  },
  contour() {
    const R = 5, w = 70, h = 46, rc = 6, ztop = STOCK.z;
    const b = builder();
    const levels = [17, 9, 0.0].map((z) => z);
    b.rapid(cx, cy - h / 2 - R - 12, SAFE);
    levels.forEach((z, i) => {
      const sx = cx, sy = cy - h / 2 - R, lc = sy - 10;
      const arc = (a0, a1) => { for (let k = 0; k <= 8; k++) { const a = a0 + ((a1 - a0) * k) / 8; b.feed(sx + 10 * Math.cos(a), lc + 10 * Math.sin(a), z); } };
      if (i === 0) b.rapid(sx + 10, lc, ztop + 2);
      b.feed(sx + 10, lc, z);
      arc(0, Math.PI / 2); // tangent arc lead-in
      b.feedPts(rrPoints(cx, cy, w + 2 * R, h + 2 * R, rc + R, z, false)); // clockwise = climb
      arc(Math.PI / 2, Math.PI); // arc lead-out
      if (i < levels.length - 1) b.rapid(sx - 10, lc, z + 2).rapid(sx + 10, lc, z + 2);
    });
    b.rapid(cx - 10, cy - h / 2 - R - 10, SAFE);
    return {
      toolR: R, toolH: 35, path: b.pts,
      part: (T) => {
        const g = new T.Group();
        g.add(mesh(T, box(T, STOCK.x, STOCK.y, 0.01)));
        g.add(mesh(T, extrude(T, roundedRect(new T.Shape(), cx, cy, w, h, rc), ztop)));
        return g;
      },
      noStockSolid: true,
    };
  },
  pocket(kind = 'spiral') {
    const R = 5, w = 64, h = 40, rc = 6, depth = 12, zf = STOCK.z - depth;
    const b = builder();
    b.rapid(cx, cy, SAFE).rapid(cx, cy, STOCK.z + 2);
    const levels = [STOCK.z - 6, zf];
    let zPrev = STOCK.z;
    for (const z of levels) {
      b.feedPts(helixPts(cx, cy, 3, zPrev + 0.5, z, 1.2));
      const offs = [];
      const W2 = w - 2 * R, H2 = h - 2 * R;
      for (let o = 0; H2 - 2 * o * 6 > 0; o++) offs.unshift([W2 - 2 * o * 6, H2 - 2 * o * 6]);
      for (const [ww, hh] of offs) {
        const r = kind === 'area' ? Math.min(ww, hh) / 2 : Math.max(0.5, rc - R);
        b.feedPts(rrPoints(cx, cy, ww, hh, r, z, true));
      }
      b.rapid(cx, cy - (h - 2 * R) / 2, z + 1).rapid(cx, cy, z + 1);
      zPrev = z;
    }
    b.rapid(cx, cy, SAFE);
    return {
      toolR: R, toolH: 35, path: b.pts,
      part: (T) => blockWith(T, (s) => s.holes.push(roundedRect(new T.Path(), cx, cy, w, h, rc, false)), depth),
    };
  },
  area() { return scenes.pocket('area'); },
  slot() {
    const R = 4, len = 60, wid = 12, depth = 8, zf = STOCK.z - depth;
    const b = builder();
    const xa = cx - len / 2 + wid / 2, xb = cx + len / 2 - wid / 2;
    b.rapid(xa, cy, SAFE).rapid(xa, cy, STOCK.z + 1);
    let z = STOCK.z;
    while (z > zf + 0.01) { const z2 = Math.max(zf, z - 2); b.feed(xb, cy, (z + z2) / 2).feed(xa, cy, z2); z = z2; }
    b.feed(xb, cy, zf);
    const off = wid / 2 - R;
    const pts = [];
    for (let i = 0; i <= 16; i++) { const a = -Math.PI / 2 + (i / 16) * Math.PI; pts.push([xb + off * Math.cos(a), cy + off * Math.sin(a), zf]); }
    for (let i = 0; i <= 16; i++) { const a = Math.PI / 2 + (i / 16) * Math.PI; pts.push([xa + off * Math.cos(a), cy + off * Math.sin(a), zf]); }
    pts.push([xb, cy - off, zf]);
    b.feed(xb, cy - off, zf).feedPts(pts);
    b.rapid(xb, cy - off, SAFE);
    return {
      toolR: R, toolH: 30, path: b.pts,
      part: (T) => blockWith(T, (s) => s.holes.push(roundedRect(new T.Path(), cx, cy, len, wid, wid / 2, false)), depth),
    };
  },
  dynamic() {
    // Open pocket cleared from outside with trochoidal loops.
    const R = 5, depth = 18, zf = STOCK.z - depth, y0 = 14, y1 = STOCK.y - 14;
    const b = builder();
    const x0 = 20;
    b.rapid(x0 - 14, y0 - 10, SAFE).rapid(x0 - 14, y0 - 10, zf).feed(x0 - 14, y0, zf);
    const rl = 6, adv = 1.6;
    let x = x0 - 8, row = 0;
    for (let yc = y0 + R; yc <= y1 - R + 0.01; yc += 8, row++) {
      const dirR = row % 2 === 0;
      const xs = dirR ? x0 - 8 : STOCK.x - x0 + 8, xe = dirR ? STOCK.x - x0 + 8 : x0 - 8;
      const n = Math.floor(Math.abs(xe - xs) / adv);
      for (let i = 0; i <= n; i++) {
        const c = xs + (dirR ? 1 : -1) * i * adv;
        const a = (i / 6) * Math.PI * 2;
        b.feed(c + rl * Math.cos(a) * 0.6, yc + rl * Math.sin(a), zf);
      }
      x = xe;
    }
    b.rapid(x, y1, SAFE);
    return {
      toolR: R, toolH: 40, path: b.pts,
      part: (T) => {
        const g = new T.Group();
        g.add(mesh(T, box(T, STOCK.x, STOCK.y, zf)));
        const wallB = new T.Shape(); roundedRect(wallB, cx, 5, STOCK.x, 10, 0);
        const wallT = new T.Shape(); roundedRect(wallT, cx, STOCK.y - 5, STOCK.x, 10, 0);
        g.add(mesh(T, extrude(T, wallB, STOCK.z))); g.add(mesh(T, extrude(T, wallT, STOCK.z)));
        return g;
      },
      noStockSolid: true,
    };
  },
  drill() {
    const holes = [];
    for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) holes.push([25 + i * 25, 22 + j * 26]);
    const r = 4, depth = 20, Rz = STOCK.z + 3;
    const b = builder();
    b.rapid(holes[0][0], holes[0][1], SAFE);
    holes.forEach(([x, y], i) => {
      b.rapid(x, y, Rz);
      let z = STOCK.z;
      while (z > STOCK.z - depth + 0.01) { const z2 = Math.max(STOCK.z - depth, z - 7); b.feed(x, y, z2); if (z2 > STOCK.z - depth) { b.rapid(x, y, Rz).rapid(x, y, z2 + 1); } z = z2; }
      b.rapid(x, y, Rz);
    });
    b.rapid(holes[5][0], holes[5][1], SAFE);
    return {
      toolR: r, toolH: 45, tip: true, path: b.pts,
      part: (T) => blockWith(T, (s) => holes.forEach(([x, y]) => s.holes.push(circleHole(T, x, y, r))), depth),
    };
  },
  circle() {
    const R = 5, hr = 15, depth = 14, zf = STOCK.z - depth;
    const b = builder();
    b.rapid(cx, cy, SAFE).rapid(cx, cy, STOCK.z + 2);
    b.feedPts(helixPts(cx, cy, 3, STOCK.z + 0.5, zf, 1.5));
    for (let rr = 6; rr < hr - R; rr += 3.5) b.feed(cx + rr, cy, zf).feedPts(circlePts(cx, cy, rr, zf));
    b.feed(cx + hr - R - 3, cy, zf);
    for (let i = 0; i <= 12; i++) { const a = Math.PI + (i / 12) * (Math.PI / 2); b.feed(cx + hr - R - 3 + 3 * Math.cos(a) + 3, cy - 3 + 3 * Math.sin(a) + 3, zf); }
    b.feedPts(circlePts(cx, cy, hr - R, zf));
    b.rapid(cx, cy, SAFE);
    return { toolR: R, toolH: 35, path: b.pts, part: (T) => blockWith(T, (s) => s.holes.push(circleHole(T, cx, cy, hr)), depth) };
  },
  helix() {
    const R = 6, hr = 14, depth = 22, zf = STOCK.z - depth;
    const b = builder();
    b.rapid(cx + hr - R, cy, SAFE).rapid(cx + hr - R, cy, STOCK.z + 1);
    b.feedPts(helixPts(cx, cy, hr - R, STOCK.z + 1, zf, 3));
    b.feedPts(circlePts(cx, cy, hr - R, zf));
    b.rapid(cx, cy, zf + 1).rapid(cx, cy, SAFE);
    return { toolR: R, toolH: 40, path: b.pts, part: (T) => blockWith(T, (s) => s.holes.push(circleHole(T, cx, cy, hr)), STOCK.z - 0.01) };
  },
  thread() {
    const R = 6, hr = 12, depth = 18, zf = STOCK.z - depth + 2;
    const b = builder();
    b.rapid(cx, cy, SAFE).rapid(cx, cy, zf);
    for (let i = 0; i <= 10; i++) { const a = Math.PI + (i / 10) * Math.PI; const rr = (hr - R) / 2; b.feed(cx + rr + rr * Math.cos(a), cy + rr * Math.sin(a), zf); }
    b.feedPts(helixPts(cx, cy, hr - R, zf, STOCK.z - 2, 1.5, true, 48));
    b.rapid(cx, cy, STOCK.z - 2).rapid(cx, cy, SAFE);
    return { toolR: R, toolH: 40, thread: true, path: b.pts, part: (T) => blockWith(T, (s) => s.holes.push(circleHole(T, cx, cy, hr)), STOCK.z - 0.01) };
  },
};
scenes.peel = scenes.slot;

function box(T, x, y, z) {
  const g = new T.BoxGeometry(x, y, z);
  g.translate(x / 2, y / 2, z / 2);
  return g;
}
function extrude(T, shape, h, z0 = 0) {
  const g = new T.ExtrudeGeometry(shape, { depth: h, bevelEnabled: false, curveSegments: 24 });
  g.translate(0, 0, z0);
  return g;
}
function circleHole(T, x, y, r) { const p = new T.Path(); p.absarc(x, y, r, 0, Math.PI * 2, true); return p; }
function blockWith(T, addHoles, depth) {
  const g = new T.Group();
  const s = new T.Shape();
  s.moveTo(0, 0); s.lineTo(STOCK.x, 0); s.lineTo(STOCK.x, STOCK.y); s.lineTo(0, STOCK.y); s.lineTo(0, 0);
  addHoles(s);
  g.add(mesh(T, box(T, STOCK.x, STOCK.y, STOCK.z - depth)));
  g.add(mesh(T, extrude(T, s, depth, STOCK.z - depth)));
  return g;
}
let partMat = null;
function mesh(T, geo) { return new T.Mesh(geo, partMat); }

// ---------------------------------------------------------------------------
export async function mountPreview(el, kind, { autoRotate = true } = {}) {
  await load();
  const T = THREE;
  const make = scenes[kind] || scenes.contour;
  const sc = make();

  const renderer = new T.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  el.append(renderer.domElement);
  renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;touch-action:none';

  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(32, 1, 1, 2000);
  camera.up.set(0, 0, 1);
  camera.position.set(cx + 105, cy - 135, 115);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(cx, cy, 8);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.minDistance = 120;
  controls.maxDistance = 520;
  controls.autoRotate = autoRotate && !reduceMotion();
  controls.autoRotateSpeed = 0.6;

  scene.add(new T.HemisphereLight(0xffffff, 0x445566, 1.6));
  const sun = new T.DirectionalLight(0xffffff, 1.8);
  sun.position.set(80, -120, 200);
  scene.add(sun);

  const disposables = [];
  const mats = {};
  const applyColors = () => {
    mats.part.color.set(css('--part'));
    mats.edge.color.set(css('--ink-3'));
    mats.trail.color.set(css('--feed'));
    mats.full.color.set(css('--feed'));
    mats.rapid.color.set(css('--rapid'));
    mats.tool.color.set(css('--ink-2'));
  };
  mats.part = new T.MeshStandardMaterial({ metalness: 0.35, roughness: 0.55 });
  partMat = mats.part;
  mats.edge = new T.LineBasicMaterial({ transparent: true, opacity: 0.6 });
  mats.full = new T.LineBasicMaterial({ transparent: true, opacity: 0.55 });
  mats.trail = new T.LineBasicMaterial();
  mats.rapid = new T.LineDashedMaterial({ dashSize: 2.5, gapSize: 2 });
  mats.tool = new T.MeshStandardMaterial({ metalness: 0.7, roughness: 0.3 });
  applyColors();

  let part = sc.part(T);
  if (part.isBufferGeometry) part = mesh(T, part);
  scene.add(part);
  // stock outline
  const stockEdges = new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(STOCK.x, STOCK.y, STOCK.z).translate(STOCK.x / 2, STOCK.y / 2, STOCK.z / 2)), mats.edge);
  scene.add(stockEdges);

  // toolpath: full (faint feed), rapids (dashed amber), trail (bright feed, grows)
  const P = sc.path;
  const feedSegs = [], rapidSegs = [];
  for (let i = 1; i < P.length; i++) (P[i][3] ? rapidSegs : feedSegs).push(P[i - 1][0], P[i - 1][1], P[i - 1][2], P[i][0], P[i][1], P[i][2]);
  const segGeo = (arr) => { const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(arr, 3)); return g; };
  const full = new T.LineSegments(segGeo(feedSegs), mats.full);
  const rapid = new T.LineSegments(segGeo(rapidSegs), mats.rapid);
  rapid.computeLineDistances();
  scene.add(full, rapid);
  const trailGeo = segGeo(feedSegs);
  const trail = new T.LineSegments(trailGeo, mats.trail);
  trailGeo.setDrawRange(0, 0);
  scene.add(trail);

  // tool
  const tg = new T.CylinderGeometry(sc.toolR, sc.toolR, sc.toolH, 32);
  tg.rotateX(Math.PI / 2);
  tg.translate(0, 0, sc.toolH / 2);
  const tool = new T.Mesh(tg, mats.tool);
  scene.add(tool);

  // timing along path (rapids 4× faster)
  const seg = [];
  let total = 0, feedIdx = 0;
  for (let i = 1; i < P.length; i++) {
    const len = Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1], P[i][2] - P[i - 1][2]);
    const dur = Math.max(len / (P[i][3] ? 160 : 40), 1e-4);
    seg.push({ a: P[i - 1], b: P[i], dur, start: total, done: feedIdx });
    if (!P[i][3]) feedIdx++;
    total += dur;
  }

  const resize = () => {
    const w = el.clientWidth, h = el.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(el);
  resize();

  let visible = true;
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
  io.observe(el);

  const animateTool = !reduceMotion();
  let raf, t0 = performance.now(), running = true;
  const place = (t) => {
    const tt = t % (total + 1.5);
    let lo = 0, hi = seg.length - 1;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (seg[mid].start + seg[mid].dur <= tt) lo = mid + 1; else hi = mid; }
    const s = seg[lo];
    const f = Math.min(1, Math.max(0, (tt - s.start) / s.dur));
    tool.position.set(s.a[0] + (s.b[0] - s.a[0]) * f, s.a[1] + (s.b[1] - s.a[1]) * f, s.a[2] + (s.b[2] - s.a[2]) * f);
    // trail: all feed segments before this one
    trailGeo.setDrawRange(0, s.done * 2);
  };
  const frame = () => {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    if (!visible) return;
    controls.update();
    if (animateTool) place((performance.now() - t0) / 1000);
    renderer.render(scene, camera);
  };
  if (!animateTool) { tool.position.set(P[0][0], P[0][1], P[0][2]); trailGeo.setDrawRange(0, feedSegs.length); }
  frame();

  const onTheme = () => applyColors();
  window.addEventListener('cadteach:theme', onTheme);

  return () => {
    running = false;
    cancelAnimationFrame(raf);
    ro.disconnect();
    io.disconnect();
    window.removeEventListener('cadteach:theme', onTheme);
    controls.dispose();
    scene.traverse((o) => { o.geometry?.dispose?.(); });
    Object.values(mats).forEach((m) => m.dispose());
    renderer.dispose();
    renderer.domElement.remove();
  };
}
