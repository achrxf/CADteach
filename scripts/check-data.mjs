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
// version changes must point at things that exist
const { changes, versionIds } = await import('../js/data/versions.js');
const cadIds = new Set(cadTabs.flatMap((t) => t.groups.flatMap((g) => g.cmds.map((c) => c.id))));
for (const c of changes) {
  const tag = `version ${c.v} "${c.text.slice(0, 40)}"`;
  if (!versionIds.includes(c.v)) err(`${tag}: unknown version`);
  if (!['added', 'changed', 'removed', 'info'].includes(c.type)) err(`${tag}: bad type`);
  if (c.type === 'changed' && !c.before) err(`${tag}: changed needs before`);
  if (c.cad) { if (!cadIds.has(c.cad)) err(`${tag}: unknown CAD ${c.cad}`); continue; }
  if (!c.op) continue;
  const ops = c.op === '*' ? operations.map((o) => o.id) : [].concat(c.op);
  let hit = 0;
  for (const id of ops) {
    const o = opById[id]; if (!o) { err(`${tag}: unknown op ${id}`); continue; }
    if (!c.page) { hit++; continue; }
    const pg = o.pages.find((x) => x.id === c.page); if (!pg) { if (c.op !== '*') err(`${tag}: ${id} has no page ${c.page}`); continue; }
    if (c.param && !pg.params.some((x) => x.id === c.param)) { if (c.op !== '*') err(`${tag}: ${id}/${c.page} has no param ${c.param}`); continue; }
    hit++;
  }
  if (!hit) err(`${tag}: matches nothing`);
}
console.log(`${changes.length} version changes 2018–2026`);
console.log(`${parts.length} practice parts, ${cadCmds} CAD functions`);
console.log(`${operations.length} operations, ${params} parameters, ${symptoms.length} symptoms`);
if (errors) { console.error(`${errors} problem(s)`); process.exit(1); } else console.log('✓ content checks passed');
