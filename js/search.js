// Client-side search over operations, pages, parameters, problems, glossary and G-codes.
import { operations } from './data/index.js';
import { symptoms, glossary, gcodes } from './data/reference.js';
import { cadTabs } from './data/cad.js';
import { parts } from './data/practice.js';

const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

let index = null;
function build() {
  const items = [];
  for (const op of operations) {
    items.push({ kind: 'Operation', title: op.name, alt: op.fr, text: op.summary + ' ' + op.useFor.join(' '), href: `#/op/${op.id}`, w: 3 });
    for (const pg of op.pages) {
      items.push({ kind: `${op.name} page`, title: pg.name, alt: pg.fr, text: pg.intro || '', href: `#/op/${op.id}/${pg.id}`, w: 1.2 });
      for (const p of pg.params) {
        items.push({
          kind: `${op.name} › ${pg.name}`, title: p.name, alt: p.fr,
          text: [p.what, p.when, p.typical, ...(p.mistakes || [])].join(' '),
          snip: p.what, href: `#/op/${op.id}/${pg.id}/${p.id}`, w: 2,
        });
      }
    }
  }
  for (const tab of cadTabs) {
    items.push({ kind: 'Design (CAD)', title: tab.name + (tab.guide ? '' : ' tab'), alt: '', text: tab.intro, href: `#/cad/${tab.id}`, w: 2 });
    for (const g of tab.groups) for (const c of g.cmds)
      items.push({ kind: `${tab.name} › ${g.name}`, title: c.name, alt: '', text: [c.what, c.when, c.tip, ...(c.mistakes || [])].join(' '), snip: c.what, href: `#/cad/${tab.id}/${c.id}`, w: c.key ? 2.6 : 1.6 });
  }
  for (const p of parts) items.push({ kind: 'Practice part', title: p.name, alt: '', text: p.brief.story + ' ' + p.ops.join(' '), snip: p.brief.story, href: `#/practice/${p.id}`, w: 1.8 });
  for (const s of symptoms) items.push({ kind: 'Problem', title: s.name, alt: s.fr, text: s.causes.map((c) => c.text).join(' '), snip: s.causes[0].text, href: `#/fix/${s.id}`, w: 2.5 });
  for (const g of glossary) items.push({ kind: 'Glossary', title: g.en, alt: g.fr, text: g.def, snip: g.def, href: `#/glossary#${encodeURIComponent(g.en)}`, w: 1.5 });
  const seen = new Set();
  for (const [code, d] of Object.entries(gcodes)) {
    if (seen.has(d) && code.length < 3) continue; // skip G1 when G01 exists
    seen.add(d);
    items.push({ kind: 'G/M code', title: code, alt: '', text: d, snip: d, href: `#/tools/gcode?code=${encodeURIComponent(code)}`, w: 1.5 });
  }
  items.push(
    { kind: 'Tool', title: 'Speeds & feeds calculator', alt: 'Vitesses et avances', text: 'rpm feed chip thinning chip load vc sfm mrr', href: '#/tools/feeds', w: 2 },
    { kind: 'Tool', title: 'G-code explainer', alt: 'Lecteur de code G', text: 'fanuc haas program explain nc', href: '#/tools/gcode', w: 2 },
  );
  for (const it of items) {
    it._k = norm(it.kind);
    it._t = norm(it.title);
    it._a = norm(it.alt);
    it._x = norm(it.text);
  }
  return items;
}

export function search(q, limit = 30) {
  index ||= build();
  const tokens = norm(q).split(/[\s,]+/).filter(Boolean);
  if (!tokens.length) return [];
  const out = [];
  for (const it of index) {
    let score = 0;
    let ok = true;
    for (const tk of tokens) {
      let s = 0;
      for (const [field, wt] of [[it._t, 10], [it._a, 7]]) {
        if (field === tk) s = Math.max(s, wt * 3);
        else if (field.startsWith(tk)) s = Math.max(s, wt * 2);
        else if (new RegExp('\\b' + tk.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).test(field)) s = Math.max(s, wt * 1.5);
        else if (field.includes(tk)) s = Math.max(s, wt);
      }
      if (!s && new RegExp('\\b' + tk.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).test(it._k)) s = 6;
      if (!s && it._x.includes(tk)) s = 2;
      if (!s) { ok = false; break; }
      score += s;
    }
    if (ok) out.push({ ...it, score: score * it.w });
  }
  // Shared pages (Linking, Depth Cuts…) appear in many toolpaths: show each field once.
  const seen = new Map();
  for (const it of out.sort((a, b) => b.score - a.score)) {
    const key = it.title + '|' + (it.snip || '');
    if (seen.has(key)) { seen.get(key).dup = (seen.get(key).dup || 1) + 1; continue; }
    seen.set(key, it);
  }
  return [...seen.values()].map((it) => (it.dup ? { ...it, kind: it.kind.split(' › ')[0] + ` (+${it.dup - 1} more toolpaths)` } : it)).slice(0, limit);
}

export function highlight(text, q, esc) {
  const tokens = norm(q).split(/\s+/).filter((t) => t.length > 1);
  let s = esc(text);
  if (!tokens.length) return s;
  const n = norm(text);
  // Mark ranges based on the accent-free version so "decalage" finds "Décalage".
  const marks = [];
  for (const tk of tokens) {
    let i = n.indexOf(tk);
    while (i !== -1) { marks.push([i, i + tk.length]); i = n.indexOf(tk, i + tk.length); }
  }
  if (!marks.length) return s;
  marks.sort((a, b) => a[0] - b[0]);
  let res = '';
  let pos = 0;
  for (const [a, b] of marks) {
    if (a < pos) continue;
    res += esc(text.slice(pos, a)) + '<mark>' + esc(text.slice(a, b)) + '</mark>';
    pos = b;
  }
  return res + esc(text.slice(pos));
}
