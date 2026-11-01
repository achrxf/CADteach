// Writes parts/<id>.dxf for every practice part. Run: node scripts/build-parts.mjs
import { writeFileSync, mkdirSync } from 'node:fs';
import { parts } from '../js/data/practice.js';
import { toDXF } from '../js/practice-geom.js';
mkdirSync(new URL('../parts/', import.meta.url), { recursive: true });
for (const p of parts) writeFileSync(new URL(`../parts/${p.id}.dxf`, import.meta.url), toDXF(p));
console.log(`parts/: ${parts.length} DXF files`);
