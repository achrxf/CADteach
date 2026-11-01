// 3D preview of a practice part: the finished part, the stock as a ghost, and the workholding
// (vise on parallels, or a vacuum table) on a machine table with T-slots.
import { slabs } from '../practice-geom.js';

let T = null, OrbitControls = null;
const css = (n, el) => getComputedStyle(el).getPropertyValue(n).trim() || '#888';

export async function mountPart(el, part, opts = {}) {
  if (!T) { T = await import('three'); ({ OrbitControls } = await import('three/addons/OrbitControls.js')); }
  const renderer = new T.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  el.append(renderer.domElement);
  renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;touch-action:pan-y;user-select:none';
  const scene = new T.Scene();
  scene.add(new T.HemisphereLight(0xdfe9f3, 0x2a3540, 1.6));
  const sun = new T.DirectionalLight(0xffffff, 1.6); sun.position.set(-120, -200, 260); scene.add(sun);
  const fill = new T.DirectionalLight(0xffffff, 0.5); fill.position.set(200, 120, 80); scene.add(fill);

  const mats = {
    part: new T.MeshStandardMaterial({ color: css('--part', el), metalness: 0.45, roughness: 0.42 }),
    edge: new T.LineBasicMaterial({ color: 0x0b1319, transparent: true, opacity: 0.3 }),
    stock: new T.LineBasicMaterial({ color: css('--rapid', el), transparent: true, opacity: 0.7 }),
    stockFill: new T.MeshBasicMaterial({ color: css('--rapid', el), transparent: true, opacity: 0.06, depthWrite: false }),
    vise: new T.MeshStandardMaterial({ color: 0x3e5568, metalness: 0.3, roughness: 0.6 }),
    jaw: new T.MeshStandardMaterial({ color: 0xa9b4bd, metalness: 0.75, roughness: 0.32 }),
    table: new T.MeshStandardMaterial({ color: 0x343e47, metalness: 0.4, roughness: 0.7 }),
    slot: new T.MeshStandardMaterial({ color: 0x1b2229, metalness: 0.2, roughness: 0.9 }),
    board: new T.MeshStandardMaterial({ color: 0xb59a6d, metalness: 0, roughness: 0.9 }),
  };
  const box = (x0, x1, y0, y1, z0, z1, m) => { const g = new T.BoxGeometry(x1 - x0, y1 - y0, z1 - z0); g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); return new T.Mesh(g, m); };

  // part
  const partG = new T.Group();
  for (const s of slabs(part)) {
    for (const pc of s.pieces) {
      const shape = new T.Shape(pc.outer.map(([x, y]) => new T.Vector2(x, y)));
      for (const h of pc.holes) shape.holes.push(new T.Path(h.map(([x, y]) => new T.Vector2(x, y))));
      const g = new T.ExtrudeGeometry(shape, { depth: s.zt - s.zb, bevelEnabled: false, curveSegments: 4 });
      g.translate(0, 0, s.zb);
      partG.add(new T.Mesh(g, mats.part));
      partG.add(new T.LineSegments(new T.EdgesGeometry(g, 28), mats.edge));
    }
  }
  scene.add(partG);

  // stock ghost
  const S = part.stock, z0 = -part.H, zTop = z0 + S.z;
  const stockG = new T.Group();
  const sb = new T.BoxGeometry(S.x, S.y, S.z); sb.translate(0, 0, z0 + S.z / 2);
  stockG.add(new T.LineSegments(new T.EdgesGeometry(sb), mats.stock), new T.Mesh(sb, mats.stockFill));
  scene.add(stockG);

  // workholding
  const fx = new T.Group();
  const hx = S.x / 2, hy = S.y / 2;
  let tableZ;
  if (part.fixture.type === 'vise') {
    const par = 25, jaw = Math.max(part.fixture.grip, 1) + par;
    const bodyZ = z0 - par;
    const vx = 80; // half width of the 150 mm jaws (+ body)
    fx.add(box(-vx + 5, vx - 5, -hy - 1, -hy + 6, bodyZ, z0, mats.jaw), box(-vx + 5, vx - 5, hy - 6, hy + 1, bodyZ, z0, mats.jaw)); // parallels
    fx.add(box(-vx, vx, hy, hy + 22, bodyZ, bodyZ + jaw, mats.jaw)); // fixed jaw plate
    fx.add(box(-vx, vx, -hy - 22, -hy, bodyZ, bodyZ + jaw, mats.jaw)); // moving jaw plate
    fx.add(box(-vx, vx, hy + 22, hy + 70, bodyZ - 30, bodyZ + jaw, mats.vise)); // fixed jaw body
    fx.add(box(-vx, vx, -hy - 72, -hy - 22, bodyZ - 30, bodyZ + jaw - 4, mats.vise)); // moving jaw body
    fx.add(box(-vx, vx, -hy - 150, hy + 70, bodyZ - 70, bodyZ, mats.vise)); // bed
    const screw = new T.CylinderGeometry(9, 9, 60, 20); screw.translate(0, -hy - 180, bodyZ - 35);
    fx.add(new T.Mesh(screw, mats.jaw));
    const hex = new T.CylinderGeometry(14, 14, 18, 6); hex.translate(0, -hy - 215, bodyZ - 35);
    fx.add(new T.Mesh(hex, mats.jaw));
    tableZ = bodyZ - 70;
  } else {
    const t = 18;
    fx.add(box(-hx - 50, hx + 50, -hy - 40, hy + 40, z0 - t, z0, mats.board));
    fx.add(box(-hx - 70, hx + 70, -hy - 60, hy + 60, z0 - t - 40, z0 - t, mats.vise));
    tableZ = z0 - t - 40;
  }
  // machine table with T-slots
  const TW = Math.max(420, S.x * 3), TD = 260 + S.y;
  fx.add(box(-TW / 2, TW / 2, -TD / 2 - 60, TD / 2, tableZ - 40, tableZ, mats.table));
  for (const y of [-100, 0, 100]) fx.add(box(-TW / 2, TW / 2, y - 9, y + 9, tableZ - 0.5, tableZ + 0.3, mats.slot));
  scene.add(fx);

  // work zero triad at X0 Y0 Z0
  const ax = new T.Group();
  for (const [dir, c] of [[[1, 0, 0], 0xff6b5b], [[0, 1, 0], 0x5fd39a], [[0, 0, 1], 0x74a6ff]]) {
    const g = new T.BufferGeometry().setFromPoints([new T.Vector3(0, 0, 0.3), new T.Vector3(dir[0] * 18, dir[1] * 18, dir[2] * 18 + 0.3)]);
    ax.add(new T.Line(g, new T.LineBasicMaterial({ color: c, depthTest: false })));
  }
  ax.renderOrder = 10;
  scene.add(ax);

  // camera
  const camera = new T.PerspectiveCamera(30, 1, 1, 5000);
  camera.up.set(0, 0, 1);
  const R = Math.hypot(S.x, S.y) * 0.5 + 45;
  const home = () => { camera.position.set(R * 1.15, -R * 1.9, R * 1.55); controls.target.set(0, -S.y * 0.08, z0 * 0.6); controls.update(); };
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.enablePan = false; controls.enableZoom = false;
  if (matchMedia('(pointer: coarse)').matches) controls.touches = { ONE: null, TWO: T.TOUCH.DOLLY_ROTATE };
  home();

  const resize = () => { const w = el.clientWidth, h = el.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); };
  const ro = new ResizeObserver(resize); ro.observe(el); resize();
  let raf, run = true, visible = true;
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }); io.observe(el);
  const spin = opts.autoRotate !== false && !matchMedia('(prefers-reduced-motion: reduce)').matches;
  controls.autoRotate = spin; controls.autoRotateSpeed = 0.6;
  renderer.domElement.addEventListener('pointerdown', () => { controls.autoRotate = false; }, { once: true });
  const frame = () => { if (!run) return; raf = requestAnimationFrame(frame); if (!visible) return; controls.update(); renderer.render(scene, camera); };
  frame();

  return {
    show(what, on) { ({ stock: stockG, fixture: fx, part: partG })[what].visible = on; },
    home,
    stl() { return toSTL(partG); },
    dispose() {
      run = false; cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); controls.dispose();
      scene.traverse((o) => o.geometry?.dispose?.()); Object.values(mats).forEach((m) => m.dispose());
      renderer.dispose(); renderer.domElement.remove();
    },
  };
}

// ASCII STL of the part meshes (mm).
function toSTL(group) {
  const out = ['solid cadteach_part'];
  const a = new T.Vector3(), b = new T.Vector3(), c = new T.Vector3(), n = new T.Vector3();
  const f = (v) => v.x.toFixed(4) + ' ' + v.y.toFixed(4) + ' ' + v.z.toFixed(4);
  group.traverse((m) => {
    if (!m.isMesh) return;
    const g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry;
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i += 3) {
      a.fromBufferAttribute(p, i); b.fromBufferAttribute(p, i + 1); c.fromBufferAttribute(p, i + 2);
      n.subVectors(c, b).cross(new T.Vector3().subVectors(a, b)).normalize();
      out.push(`facet normal ${f(n)}`, 'outer loop', `vertex ${f(a)}`, `vertex ${f(b)}`, `vertex ${f(c)}`, 'endloop', 'endfacet');
    }
  });
  out.push('endsolid cadteach_part');
  return out.join('\n');
}
