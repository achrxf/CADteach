# CADteach — notes for Claude

Static, no-build web app (ES modules + import map). Serve the repo root with any static server.

- Owner: Achraf, Mastercam programmer (Préparateur Méthodes) in aerospace. He programs with Mastercam and verifies in Vericut. Explanations should sound like an experienced programmer at the machine: plain English, concrete, shop-floor.
- Content lives in `js/data/`. Shared pages (Linking, Depth Cuts, Lead In/Out…) are in `common.js` — change them there, not per op.
- Never copy text from the Mastercam help; write explanations ourselves. Mark uncertain field names in the text rather than guessing silently.
- Content is written for Mastercam 2025; differences in 2018–2026 go in `js/data/versions.js` (checked by check-data).
- Every param needs `name`, `fr`, `what`. `viz` must exist in `js/viz/param-viz.js`.
- Before committing: `node scripts/check-data.mjs` (must pass) and `node scripts/build-sw.mjs`.
- Release = bump `APP_VERSION` in `js/app.js`, add a CHANGELOG entry, tag `vX.Y.Z`.
- Design: backplot palette (blue feed, amber rapid, steel stock), Barlow / Barlow Condensed. Keep it responsive down to 360px; test phone, tablet and desktop.
