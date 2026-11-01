// What the visitor has explored and how they did on the quizzes (this browser only).
import { store } from '../util.js';
import { operations } from '../data/index.js';

export const markVisited = (opId, pageId) => {
  const v = store.get('visited', {});
  const k = opId + '/' + pageId;
  if (!v[k]) { v[k] = Date.now(); store.set('visited', v); }
};
export const opProgress = (op) => {
  const v = store.get('visited', {});
  const seen = op.pages.filter((p) => v[op.id + '/' + p.id]).length;
  return { seen, total: op.pages.length, f: seen / op.pages.length };
};
export const totals = () => {
  const v = store.get('visited', {});
  const all = operations.flatMap((o) => o.pages.map((p) => o.id + '/' + p.id));
  return { seen: all.filter((k) => v[k]).length, total: all.length };
};
export const bestScore = (opId) => store.get('quiz', {})[opId] || null;
export const saveScore = (opId, score, of) => {
  const q = store.get('quiz', {});
  const prev = q[opId];
  const better = !prev || score / of > prev.score / prev.of;
  if (better) { q[opId] = { score, of, ts: Date.now() }; store.set('quiz', q); }
  return { better, prev };
};

// Ring drawn around a tile icon: how many of the op's pages have been opened.
export const ring = (f) => {
  const c = 2 * Math.PI * 25;
  return `<svg class="ring" viewBox="0 0 56 56" aria-hidden="true"><circle cx="28" cy="28" r="25" class="ring-bg"/><circle cx="28" cy="28" r="25" class="ring-fg" stroke-dasharray="${(f * c).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 28 28)"/></svg>`;
};
