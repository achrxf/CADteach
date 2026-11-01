# Changelog

Versions follow `MAJOR.MINOR.PATCH`: a new product area or app platform is a major version, new toolpaths or tools are minor, fixes and content corrections are patches.

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
