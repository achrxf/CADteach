// Writes parts/<id>.dxf for every practice part, and parts/solids.json for scripts/build-step.py.
// Run: node scripts/build-parts.mjs && python3 scripts/build-step.py
import { writeFileSync, mkdirSync } from 'node:fs';
import { parts } from '../js/data/practice.js';
import { toDXF, solidSpec } from '../js/practice-geom.js';
mkdirSync(new URL('../parts/', import.meta.url), { recursive: true });
for (const p of parts) writeFileSync(new URL(`../parts/${p.id}.dxf`, import.meta.url), toDXF(p));
writeFileSync(new URL('../scripts/solids.json', import.meta.url), JSON.stringify(parts.map(solidSpec)));
console.log(`parts/: ${parts.length} DXF files, scripts/solids.json`);
