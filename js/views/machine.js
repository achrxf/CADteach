// The "control screen" around a 3D preview: a DRO readout (X Y Z, feed, spindle) and the
// current program block, fed by the preview's onTick callback.
import { html } from '../util.js';

// Nominal feeds and speeds for each preview, so the readout looks like a real program.
// mm/min and RPM, for the tool drawn in that preview.
const nominal = {
  facing: { f: 2400, s: 3800, t: 'T1  Ø50 face mill' },
  contour: { f: 1500, s: 12000, t: 'T2  Ø10 end mill' },
  pocket: { f: 1200, s: 12000, t: 'T2  Ø10 end mill' },
  slot: { f: 800, s: 14000, t: 'T3  Ø8 end mill' },
  dynamic: { f: 4200, s: 15000, t: 'T4  Ø10 HEM end mill' },
  area: { f: 4200, s: 15000, t: 'T4  Ø10 HEM end mill' },
  peel: { f: 3800, s: 15000, t: 'T4  Ø10 HEM end mill' },
  drill: { f: 300, s: 2400, t: 'T5  Ø8.5 drill' },
  circle: { f: 900, s: 12000, t: 'T6  Ø8 end mill' },
  helix: { f: 700, s: 12000, t: 'T6  Ø8 end mill' },
  thread: { f: 500, s: 9000, t: 'T7  M10 thread mill' },
};

const pad = (v) => {
  const n = Math.abs(v) < 0.0005 ? 0 : v;
  return ((n < 0 ? '-' : '') + Math.abs(n).toFixed(3)).padStart(8, ' ');
};

export function droHtml(kind) {
  const n = nominal[kind] || nominal.contour;
  return html`<div class="dro" data-dro aria-hidden="true">
    <div class="dro-axes">
      <span><b>X</b><output data-ax="x"> 0.000</output></span>
      <span><b>Y</b><output data-ax="y"> 0.000</output></span>
      <span><b>Z</b><output data-ax="z"> 0.000</output></span>
    </div>
    <div class="dro-mode">
      <span class="dro-f"><b>F</b><output data-f>${n.f}</output></span>
      <span><b>S</b><output>${n.s}</output></span>
      <span class="dro-tool">${n.t}</span>
    </div>
    <div class="dro-block"><span class="dro-lamp"></span><code data-block>N10 G00 G90 G54</code></div>
  </div>`;
}

// Returns the onTick callback for mountPreview.
export function droTicker(root, kind) {
  const n = nominal[kind] || nominal.contour;
  const box = root.querySelector('[data-dro]');
  if (!box) return null;
  const ax = { x: box.querySelector('[data-ax="x"]'), y: box.querySelector('[data-ax="y"]'), z: box.querySelector('[data-ax="z"]') };
  const fEl = box.querySelector('[data-f]');
  const bEl = box.querySelector('[data-block]');
  let lastBlock = -1, lastRapid = null;
  return (t) => {
    ax.x.textContent = pad(t.x);
    ax.y.textContent = pad(t.y);
    ax.z.textContent = pad(t.z);
    if (t.rapid !== lastRapid) {
      lastRapid = t.rapid;
      box.classList.toggle('is-rapid', t.rapid);
      fEl.textContent = t.rapid ? 'RAPID' : String(n.f);
    }
    if (t.block !== lastBlock) {
      lastBlock = t.block;
      const [x, y, z] = t.to.map((v) => (Math.abs(v) < 0.0005 ? 0 : v).toFixed(3).replace(/\.?0+$/, '') || '0');
      const nn = 'N' + (t.block + 1) * 10;
      bEl.textContent = t.still ? 'N10 G00 G90 G54  (tool animation off: reduced motion)'
        : t.rapid ? `${nn} G00 X${x} Y${y} Z${z}` : `${nn} G01 X${x} Y${y} Z${z} F${n.f}`;
    }
  };
}
