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
// Practice parts and CAD pages
import { parts } from '../js/data/practice.js';
import { cadTabs, cadTabById, drawWalkthrough } from '../js/data/cad.js';
import { existsSync } from 'node:fs';
const img = (p) => existsSync(new URL('../' + p, import.meta.url));
for (const p of parts) {
  for (const o of p.ops) if (!opById[o]) err(`practice ${p.id}: unknown op ${o}`);
  for (const s of p.plan) if (!resolve(s.op, s.page)) err(`practice ${p.id}: bad plan link ${s.op}/${s.page}`);
  for (const f of p.features) if (!opById[f.op]) err(`practice ${p.id}/${f.id}: unknown op ${f.op}`);
  if (!img(`parts/${p.id}.dxf`)) err(`practice ${p.id}: parts/${p.id}.dxf missing (run node scripts/build-parts.mjs)`);
}
let cadCmds = 0;
for (const t of cadTabs) {
  if (t.ribbon && !img(`img/mc2025/cad/${t.ribbon}.png`)) err(`cad ${t.id}: missing ribbon image`);
  const ids = new Set();
  for (const g of t.groups) for (const c of g.cmds) {
    cadCmds++;
    if (ids.has(c.id)) err(`cad ${t.id}: duplicate ${c.id}`); ids.add(c.id);
    if (!c.name || !c.what) err(`cad ${t.id}/${c.id}: missing name/what`);
    if (c.viz && !hasViz(c.viz)) err(`cad ${t.id}/${c.id}: unknown viz ${c.viz}`);
    if (c.shot && !img(`img/mc2025/cad/${c.shot}.png`)) err(`cad ${t.id}/${c.id}: missing shot ${c.shot}`);
  }
}
for (const s of drawWalkthrough.steps) if (!cadTabById[s.tab]?.groups.some((g) => g.cmds.some((c) => c.id === s.cmd))) err(`walkthrough: bad link ${s.tab}/${s.cmd}`);
console.log(`${parts.length} practice parts, ${cadCmds} CAD functions`);
console.log(`${operations.length} operations, ${params} parameters, ${symptoms.length} symptoms`);
if (errors) { console.error(`${errors} problem(s)`); process.exit(1); } else console.log('✓ content checks passed');
