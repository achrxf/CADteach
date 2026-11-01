// Sanity checks for the content: unique ids, links that resolve, visuals that exist.
// Run: node scripts/check-data.mjs
import { operations, opById, whatsNew } from '../js/data/index.js';
import { symptoms } from '../js/data/reference.js';
import { hasViz } from '../js/viz/param-viz.js';

let errors = 0;
const err = (m) => { console.error('✗ ' + m); errors++; };
const ids = new Set();
let params = 0;
for (const op of operations) {
  if (ids.has(op.id)) err(`duplicate op id ${op.id}`);
  ids.add(op.id);
  for (const k of ['name', 'fr', 'group', 'summary', 'useFor', 'avoid', 'chaining', 'preview']) if (!op[k]) err(`${op.id}: missing ${k}`);
  const pids = new Set();
  for (const pg of op.pages) {
    if (pids.has(pg.id)) err(`${op.id}: duplicate page ${pg.id}`);
    pids.add(pg.id);
    if (pg.viz && !hasViz(pg.viz)) err(`${op.id}/${pg.id}: unknown viz ${pg.viz}`);
    const prm = new Set();
    for (const p of pg.params) {
      params++;
      if (prm.has(p.id)) err(`${op.id}/${pg.id}: duplicate param ${p.id}`);
      prm.add(p.id);
      if (!p.name || !p.what) err(`${op.id}/${pg.id}/${p.id}: missing name/what`);
      if (!p.fr) err(`${op.id}/${pg.id}/${p.id}: missing French name`);
      if (p.viz && !hasViz(p.viz)) err(`${op.id}/${pg.id}/${p.id}: unknown viz ${p.viz}`);
    }
  }
}
const resolve = (o, pg, pa) => {
  const op = opById[o];
  if (!op) return false;
  if (!pg) return true;
  const page = op.pages.find((x) => x.id === pg);
  if (!page) return false;
  return !pa || page.params.some((x) => x.id === pa);
};
for (const s of symptoms) for (const c of s.causes) for (const l of c.links) if (!resolve(...l)) err(`symptom ${s.id}: bad link ${l.join('/')}`);
for (const i of whatsNew['2025'].items) if (i.op && !resolve(i.op, i.page)) err(`whatsNew: bad link ${i.op}/${i.page}`);
console.log(`${operations.length} operations, ${params} parameters, ${symptoms.length} symptoms`);
if (errors) { console.error(`${errors} problem(s)`); process.exit(1); } else console.log('✓ content checks passed');
