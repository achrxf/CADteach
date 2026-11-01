# Changelog

Versions follow `MAJOR.MINOR.PATCH`: a new product area or app platform is a major version, new toolpaths or tools are minor, fixes and content corrections are patches.

## 1.4.0 — 2026-11-01

Practice parts and the CAD side of Mastercam.

- Practice parts: 12 small parts (one per toolpath) and 3 complete 2D jobs (Bracket plate, Manifold block, Housing cover) that use all 12 toolpaths
  - each with a job card: machine, material, stock, workholding, tolerances, tools in the magazine, quantity and a target cycle time
  - a 3D preview of the part in its vise or on a vacuum table, with the stock as a ghost and the work zero shown
  - downloads: DXF (opens in Mastercam, one level per feature with its depth), STL of the part, drawing as SVG
  - a suggested plan (hidden until you want it) linked to the toolpath pages, checks before posting, and a box to log your own cycle time against the target
- Design (CAD): every ribbon tab of Mastercam 2025 (Wireframe, Transform, Solids, Model Prep, Surfaces, Mesh, Drafting, Home, View, Machine) plus a "Start here" page on planes, levels, chaining and snaps
  - 107 functions, with real ribbon and function-panel screenshots from Mastercam 2025
  - 18 new interactive visuals: line, arc and circle methods, rectangular shapes, polygon flat/corner, bolt circle, trim, fillet, chamfer, offset, translate/rotate/mirror/scale, array, planes, chaining, solid extrude, push-pull, dimensions, surfaces
  - "Draw your first part": the Bracket plate drawn from nothing in 8 steps
- Search covers CAD functions and practice parts

## 1.3.0 — 2026-11-01

More fun to walk into.

- Machine-screen look: the home page and every toolpath open on a dark control panel, with the 3D backplot as the screen and a live DRO under it (X Y Z, F or RAPID, S, tool and the current program block, ticking as the tool moves)
- A colour per toolpath family (Standard blue, Dynamic teal, Holes violet) on tiles, headers, navigation and the first-part path
- "Test yourself": an 8-question quiz on every toolpath, built from its own fields, with instant answers, a link to read more, a score ring and your best score
- Progress: pages you have opened show as a ring on each tile and a meter on each toolpath
- "Program a first part": Facing → Dynamic Mill → Contour → Pocket → Drill, in machining order
- Drafting-grid background; toolpath icons draw themselves on hover

## 1.2.1 — 2026-11-01

Fixes from an 8-person tester panel (simulated users: junior programmer, operator, instructor, student, shop owner, sceptic, older machinist, designer):

- Engagement angle drawing now matches Mastercam's Angle field and the calculator (10% = 37°, 25% = 60°): contact only on the leading side, feed along the wall
- Wear comp explanation: positive D moves the tool away from the part (outside bigger, holes smaller); full radius in D with Wear = offset twice
- Lead In/Out visual: Tangent and Perpendicular now differ, defaults match Mastercam (100% / 100% / 90°)
- New Climb/Conventional visual for Dynamic and Pocket (no G41/G42 there)
- Compensation "typical" no longer contradicts the advice; visual defaults match the text (facing overlaps, compensation type)
- 3D previews no longer capture page scrolling (wheel passes through; on touch one finger scrolls, two rotate)
- Screenshot zoom: full-screen on phones at native size with scrolling; Close no longer covers the image
- Search ranks the toolpath name (e.g. "pocket stepover"), lands on the parameter even while visuals load; toolpath name shown in the sticky tab bar
- Speeds & feeds: real inch sizes (fractions), SFM rounded, HEM note for titanium/stainless/hardened, clearer fz labels, tidier result grid
- G-code explainer: warns on G43 H that doesn't match the tool, understands G187 P/E; sample shows two warnings
- Troubleshooting: new "Tool breaks in the middle of the cut", more causes for corner gouges
- Finish passes drawn in green everywhere (amber = rapid only); bigger labels in drawings; better grey text contrast

## 1.2.0 — 2026-11-01

- Sharp, full-resolution Mastercam 2025 dialog screenshots (42 pages) replace the blurry ones
- All 12 toolpaths now checked field by field against Mastercam 2025, including Facing, Slot Mill, Area Mill, Dynamic Contour, Peel Mill, Circle Mill, Helix Bore and Thread Mill (real fields and defaults, e.g. Dynamic Contour's Contour Wall page, Thread Mill Lead In/Out, Circle Mill helix 10–45%)
- Speeds & feeds: 42 materials in ISO groups (aluminium-lithium, Invar, Monel, PTFE, polycarbonate…), suggested Vc and fz by diameter, material filter box
- Fixes from a 400-user swarm test: "Copy link" no longer opens a browser pop-up when the clipboard is blocked; bigger tap targets (filters, sliders, breadcrumb, links)

## 1.1.0 — 2026-11-01

Visuals first, checked against a real Mastercam 2025 install.

- Each parameter now shows its visual right next to it; "when to change it" stays short and the common mistakes fold away
- Real Mastercam 2025 dialog screenshots on every page that was checked (tap to enlarge)
- 14 new interactive visuals: contour types, pocket types, all 8 pocket cutting methods, entry types, Chain Options regions, dynamic motion, rest material, depth cut order, tip/center, corner rounding, finish at final/all depths, open-contour extension, tolerance, fine-bore shift
- Clearer existing visuals: compensation side, depth cuts (pocket section), stock to leave
- Content corrected to match the 2025 dialogs: Break Through moved to Linking Parameters; Drill Tip Comp on Linking; real drill cycle names; Dynamic Mill pages (Chain Options, Stock, Corner Pretreatment, Entry Motion under Linking, Finish Passes); new fields like Internal corner rounding radius, Spring passes, Tab Cutoff, Coolant page; template defaults (feed plane 10, retract 25, lead line and arc 100%, pocket entry fails → Plunge)
- Toggle buttons in visuals are easier to tap on phones
- English only for now (French interface hidden until the translation pass)

## 1.0.0 — 2026-11-01

First release: Mastercam 2025, 2D mill.

- 12 toolpaths with their dialog pages and parameters (EN + FR names)
- What's new in Mastercam 2025 for 2D mill (Finish Passes on Dynamic/Area Mill, Thread Mill options)
- 19 interactive parameter visuals, 3D toolpath previews
- Fix a problem (16 symptoms), speeds & feeds with chip thinning, G-code explainer
- Search, EN/FR interface, dark mode, bookmarks, notes, export/import, "checked" markers
- Responsive from phone to desktop, offline-capable PWA
