"""Builds parts/<id>.step (true arcs, real solids) from scripts/solids.json with CadQuery.
Run after node scripts/build-parts.mjs:   python3 scripts/build-step.py [part-id ...]
Needs: pip install cadquery
Work zero = centre of the part, Z0 on the finished top, like the drawings and DXFs."""
import json, sys, pathlib
import cadquery as cq

ROOT = pathlib.Path(__file__).resolve().parent.parent
specs = json.loads((ROOT / 'scripts' / 'solids.json').read_text())
only = set(sys.argv[1:])


def face(loop):
    if loop[0]['t'] == 'circle':
        c = loop[0]
        return cq.Workplane('XY').moveTo(*c['c']).circle(c['r'])
    w = cq.Workplane('XY').moveTo(*loop[0]['a'])
    for s in loop:
        w = w.lineTo(*s['b']) if s['t'] == 'line' else w.threePointArc(tuple(s['m']), tuple(s['b']))
    return w.close()


def prism(loop, z0, z1):
    """Solid of the outline between z1 (bottom) and z0 (top)."""
    return face(loop).extrude(z0 - z1).translate((0, 0, z1))


def box(x0, y0, x1, y1, z1, z0):
    return cq.Workplane('XY').box(x1 - x0, y1 - y0, z0 - z1, centered=False).translate((x0, y0, z1))


def inside(a, b):
    return a[0] >= b[0] - 1e-6 and a[1] >= b[1] - 1e-6 and a[2] <= b[2] + 1e-6 and a[3] <= b[3] + 1e-6


def overlap(a, b):
    return not (a[2] <= b[0] or b[2] <= a[0] or a[3] <= b[1] or b[3] <= a[1])


for sp in specs:
    if only and sp['id'] not in only:
        continue
    H = sp['H']
    solid = prism(sp['base'], 0, -H)
    feats = sp['features']
    for f in feats:
        if f['kind'] == 'outside':
            ring = box(-1000, -1000, 1000, 1000, f['z1'], 0.01).cut(prism(f['loop'], 0.02, f['z1'] - 0.01))
            solid = solid.cut(ring)
        elif f['kind'] == 'channel':
            v0, v1 = f['band']
            solid = solid.cut(box(-1000, v0, 1000, v1, f['z1'], 0.01) if f['axis'] == 'y' else box(v0, -1000, v1, 1000, f['z1'], 0.01))
    cuts = [f for f in feats if f['kind'] == 'cut']
    for c in cuts:
        solid = solid.cut(prism(c['loop'], c['z0'] + (0.01 if c['z0'] == 0 else 0), c['z1']))
    for i in [f for f in feats if f['kind'] == 'island']:
        parents = [c for c in cuts if overlap(c['bb'], i['bb'])]
        if not parents:
            continue
        floor = min(c['z1'] for c in parents)
        solid = solid.union(prism(i['loop'], i['top'], floor))
        for c in cuts:
            if inside(c['bb'], i['bb']):
                solid = solid.cut(prism(c['loop'], c['z0'] + 0.01, c['z1']))
    out = ROOT / 'parts' / f"{sp['id']}.step"
    cq.exporters.export(solid, str(out), opt={'write_pcurves': False})
    print(f"{sp['id']:24s} {out.stat().st_size // 1024:5d} KB  volume {solid.val().Volume() / 1000:.1f} cm3")
