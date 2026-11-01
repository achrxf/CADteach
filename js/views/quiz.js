// "Test yourself": 8 questions built from a toolpath's own content.
import { html, raw } from '../util.js';
import { nm } from '../i18n.js';
import { opById, operations } from '../data/index.js';
import { saveScore, bestScore } from './progress.js';

const N = 8;
const shuffle = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const first = (s) => (String(s).match(/^.*?[.!?](\s|$)/) || [s])[0].trim();
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function build(op) {
  // every param once, with the page it lives on
  const seen = new Set();
  const items = [];
  for (const pg of op.pages) for (const p of pg.params) {
    if (seen.has(p.name) || !p.what) continue;
    seen.add(p.name);
    items.push({ p, pg });
  }
  const pick = (exclude, n, key) => {
    const vals = new Set();
    for (const it of shuffle(items)) {
      const v = key(it);
      if (v && v !== exclude && !vals.has(v)) vals.add(v);
      if (vals.size === n) break;
    }
    return [...vals];
  };
  const qs = [];
  const kinds = ['name', 'what', 'page'];
  for (const [i, it] of shuffle(items).entries()) {
    if (qs.length === N) break;
    const kind = kinds[i % 3];
    const { p, pg } = it;
    if (kind === 'name') {
      // Describe the field (name hidden), pick its name.
      // Hide the name and each part of it ("Finish passes — Final depth / All depths").
      const parts = [p.name, ...p.name.split(/\s*(?:—|\/|,|\(|\))\s*/)].map((x) => x.trim()).filter((x) => x.length > 3).sort((a, b) => b.length - a.length);
      let masked = first(p.what);
      for (const x of parts) masked = masked.replace(new RegExp(esc(x), 'gi'), 'this setting');
      masked = masked.replace(/^this setting/, 'This setting');
      const wrong = pick(p.name, 3, (x) => x.p.name);
      if (wrong.length < 3) continue;
      qs.push({ prompt: 'Which field does this?', quote: masked, answer: p.name, options: shuffle([p.name, ...wrong]), it });
    } else if (kind === 'what') {
      const right = first(p.what);
      const wrong = pick(right, 3, (x) => first(x.p.what));
      if (wrong.length < 3) continue;
      qs.push({ prompt: `What does “${p.name}” do?`, answer: right, options: shuffle([right, ...wrong]), it, long: true });
    } else {
      if (op.pages.length < 4) continue;
      const right = pg.name;
      const wrong = shuffle(op.pages.filter((x) => x.id !== pg.id && !x.params.some((q) => q.name === p.name)).map((x) => x.name)).slice(0, 3);
      if (wrong.length < 3) continue;
      qs.push({ prompt: `On which page of the ${op.name} dialog is “${p.name}”?`, answer: right, options: shuffle([right, ...wrong]), it });
    }
  }
  return qs;
}

export function render(r) {
  const op = opById[r.parts[1]];
  if (!op) {
    return {
      title: 'Test yourself',
      html: html`<h1 class="page-title">Test yourself</h1><p class="lede">Pick a toolpath. Eight questions, built from its fields.</p>
        <div class="quiz-pick">${operations.map((o) => { const b = bestScore(o.id); return html`<a href="#/quiz/${o.id}" data-group="${o.group}"><strong>${nm(o)}</strong>${b ? html`<span class="quiz-badge ${b.score === b.of ? 'perfect' : ''}">best ${b.score}/${b.of}</span>` : html`<span class="muted">Not tried</span>`}</a>`; })}</div>`,
    };
  }
  return {
    title: `Test yourself — ${op.name}`,
    html: html`<div class="crumbs"><a href="#/op/${op.id}">${nm(op)}</a> › Test yourself</div>
      <section class="machine quiz" data-group="${op.group}">
        <div class="machine-bar"><span class="lamp" aria-hidden="true"></span><span>Test yourself</span><span class="machine-bar-r" data-qcount></span></div>
        <div class="quiz-body" data-quiz aria-live="polite"></div>
      </section>`,
    mount(root) {
      const box = root.querySelector('[data-quiz]');
      const count = root.querySelector('[data-qcount]');
      let qs, i, score, missed;
      const start = () => { qs = build(op); i = 0; score = 0; missed = []; show(); };
      const progress = () => html`<div class="quiz-steps" aria-hidden="true">${qs.map((q, k) => html`<i class="${k < i ? (q.ok ? 'ok' : 'bad') : k === i ? 'cur' : ''}"></i>`)}</div>`;
      const show = () => {
        const q = qs[i];
        count.textContent = `Question ${i + 1} of ${qs.length}`;
        box.innerHTML = String(html`${progress()}
          <h1 class="quiz-q">${q.prompt}</h1>
          ${q.quote ? html`<blockquote class="quiz-quote">${q.quote}</blockquote>` : ''}
          <div class="quiz-options ${q.long ? 'long' : ''}">${q.options.map((o, k) => html`<button type="button" class="quiz-opt" data-opt="${k}"><span class="key">${'ABCD'[k]}</span><span>${o}</span></button>`)}</div>
          <div class="quiz-feedback" hidden></div>`);
        box.querySelector('.quiz-opt')?.focus({ preventScroll: true });
      };
      const answer = (k) => {
        const q = qs[i];
        if (q.done) return;
        q.done = true;
        q.ok = q.options[k] === q.answer;
        if (q.ok) score++; else missed.push(q);
        box.querySelectorAll('.quiz-opt').forEach((b, n) => {
          b.disabled = true;
          if (q.options[n] === q.answer) b.classList.add('right');
          else if (n === k) b.classList.add('wrong');
        });
        const fb = box.querySelector('.quiz-feedback');
        const { p, pg } = q.it;
        fb.hidden = false;
        fb.innerHTML = String(html`<p><strong>${q.ok ? 'Right.' : 'Not quite.'}</strong> ${p.name} (${pg.name}): ${first(p.what)}</p>
          <div class="quiz-nav"><a href="#/op/${op.id}/${pg.id}/${p.id}">Read about it</a>
          <button class="btn" type="button" data-next>${i + 1 < qs.length ? 'Next question' : 'See my score'}</button></div>`);
        box.querySelector('.quiz-steps').outerHTML = String(progress());
        fb.querySelector('[data-next]').focus({ preventScroll: true });
      };
      const end = () => {
        const of = qs.length;
        const { better, prev } = saveScore(op.id, score, of);
        count.textContent = 'Result';
        const f = score / of;
        const msg = f === 1 ? 'Perfect. You could program this one blindfolded.' : f >= 0.75 ? 'Solid. A couple of fields to look at again.' : f >= 0.5 ? 'Halfway there. Review the ones you missed and go again.' : 'Worth a read-through first: open the pages below, then try again.';
        const c = 2 * Math.PI * 52;
        box.innerHTML = String(html`
          <div class="quiz-result">
            <div class="quiz-score">
              <svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="52" class="ring-bg"/><circle cx="60" cy="60" r="52" class="ring-fg" stroke-dasharray="${(f * c).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 60 60)"/></svg>
              <div><b>${score}</b><span>of ${of}</span></div>
            </div>
            <div>
              <h1 class="quiz-q">${msg}</h1>
              <p class="muted">${better && prev ? `New best (was ${prev.score}/${prev.of}).` : prev ? `Your best is ${Math.max(prev.score, score)}/${of}.` : 'Your score is saved on this device.'}</p>
              <div class="quiz-nav"><button class="btn btn-cycle" type="button" data-again><span class="cycle-dot" aria-hidden="true"></span>Try again</button><a class="btn ghost" href="#/op/${op.id}">Back to ${nm(op)}</a></div>
            </div>
          </div>
          ${missed.length ? html`<h2 class="quiz-missed-title">Review what you missed</h2><ul class="quiz-missed">${missed.map((q) => html`<li><a href="#/op/${op.id}/${q.it.pg.id}/${q.it.p.id}">${q.it.p.name}</a> <span class="muted">· ${q.it.pg.name}</span></li>`)}</ul>` : ''}`);
        if (f >= 0.75 && !matchMedia('(prefers-reduced-motion: reduce)').matches) chips(box.querySelector('.quiz-score'));
      };
      const onClick = (e) => {
        const o = e.target.closest('[data-opt]');
        if (o) answer(+o.dataset.opt);
        if (e.target.closest('[data-next]')) { i++; if (i < qs.length) show(); else end(); }
        if (e.target.closest('[data-again]')) start();
      };
      const onKey = (e) => {
        if (/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName) || e.ctrlKey || e.metaKey || e.altKey) return;
        const k = 'abcd'.indexOf(e.key.toLowerCase());
        if (k >= 0 && qs[i] && !qs[i].done && box.querySelector(`[data-opt="${k}"]`)) answer(k);
      };
      root.addEventListener('click', onClick);
      document.addEventListener('keydown', onKey);
      start();
      return () => { root.removeEventListener('click', onClick); document.removeEventListener('keydown', onKey); };
    },
  };
}

// Little metal chips flying off the score, like a good finishing pass.
function chips(el) {
  const wrap = document.createElement('div');
  wrap.className = 'chips';
  wrap.setAttribute('aria-hidden', 'true');
  for (let k = 0; k < 26; k++) {
    const s = document.createElement('i');
    const a = Math.random() * Math.PI * 2, d = 70 + Math.random() * 90;
    s.style.cssText = `--x:${Math.cos(a) * d}px;--y:${Math.sin(a) * d}px;--r:${Math.random() * 720 - 360}deg;--d:${0.7 + Math.random() * 0.6}s;--c:${['var(--rapid)', 'var(--feed)', 'var(--m-ink-2)'][k % 3]}`;
    wrap.append(s);
  }
  el.append(wrap);
  setTimeout(() => wrap.remove(), 1600);
}
