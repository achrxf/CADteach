# CADteach

Mastercam explained parameter by parameter — for programmers and machinists.

**v1.0 covers Mastercam 2025, 2D mill toolpaths.** For every toolpath you get the dialog pages as Mastercam shows them, and for every parameter: what it does, when to change it, typical starting values in aluminium, steel and titanium, the mistakes that scrap parts, and an interactive visual where one helps.

## What's in v1.0

- **12 toolpaths:** Facing, Contour, Pocket, Slot Mill, Dynamic Mill, Dynamic Contour, Area Mill, Peel Mill, Drill, Circle Mill, Helix Bore, Thread Mill
- **19 interactive visuals:** compensation side and type, stock to leave, depth cuts, the five linking heights (animated), lead in/out, multi passes, tabs, stepover, engagement and chip thinning, roll around corners, facing overlaps, drill cycles, helix entry, thread milling direction, drill tip comp, chamfer tip offset, ramping, break through
- **3D previews** of each toolpath (three.js) — drag to rotate
- **Fix a problem:** 16 shop-floor symptoms traced to the parameters that cause them
- **Speeds & feeds** calculator with chip thinning, metric and inch
- **G-code explainer** for Fanuc/Haas style programs, with warnings for risky blocks
- **Search** everything with `/` or `Ctrl+K` — English or French names
- **English / French** interface, dark mode, bookmarks and personal notes (export/import)
- **"Checked in my Mastercam"** marker per page, to track which pages you verified on a real 2025 install
- Works offline once loaded (installable as an app — PWA)

## Run it

No build step. Serve the folder with any static server:

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

Opening `index.html` directly from disk won't work (browsers block ES modules on `file://`).

### GitHub Pages

Settings → Pages → Source: *Deploy from a branch* → `main` / root. The site is then at `https://achrxf.github.io/CADteach/`.

## Project layout

```
index.html              app shell, import map for three.js
css/app.css             design tokens + all styles
js/app.js               router, shell, theme, language
js/views/               one file per screen (home, op, fix, tools, misc, palette)
js/viz/param-viz.js     interactive SVG visuals (one spec per visual)
js/viz/preview3d.js     3D toolpath previews (three.js, loaded lazily)
js/data/common.js       parameter pages shared by many toolpaths (Linking, Depth Cuts…)
js/data/ops/*.js        one file per toolpath family
js/data/reference.js    troubleshooting, glossary, materials, G/M codes
js/data/index.js        versions, products, operation list, what's new, roadmap
scripts/check-data.mjs  content checks (ids, links, visuals)
scripts/build-sw.mjs    regenerates the offline file list in sw.js
vendor/                 three.js (r170)
fonts/                  Barlow, Barlow Condensed, JetBrains Mono (OFL)
```

## Adding content

Each parameter is a plain object:

```js
{
  id: 'stock-walls',
  name: 'Stock to leave on walls',      // as in Mastercam
  fr: 'Surépaisseur sur les parois',    // French UI name
  what: 'Material left on the walls…',
  when: 'Roughing operations leave stock…',
  values: { al: '0.2–0.5 mm', steel: '0.2–0.3 mm', ti: '0.15–0.3 mm' }, // or typical: '…'
  mistakes: ['Finishing op still has stock to leave from a copied roughing op…'],
  viz: 'stock',                          // optional, id from param-viz.js
  isNew: '2025',                         // optional, shows a "New in 2025" badge
}
```

After editing content:

```bash
node scripts/check-data.mjs   # must pass
node scripts/build-sw.mjs     # refresh offline cache list
```

### Versions

`js/data/index.js` lists the Mastercam versions. To add 2026, set its status to `content` and add differences on the parameters that changed (planned format: a `versions: { '2026': { …overrides } }` block on the param or page).

## Accuracy

The explanations are written from Mastercam knowledge and shop practice, not copied from the Mastercam help. Field names can differ slightly between versions. Each page has a **Mark as checked** button: verify the page against your 2025 install and mark it. Typical values are starting points for carbide in a rigid setup — the tool maker's data always wins.

Mastercam is a trademark of CNC Software, LLC. CADteach is an independent learning resource, not affiliated with or endorsed by CNC Software.
