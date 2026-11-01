// Design (CAD): the Mastercam ribbon tabs explained, command by command.
import { html, raw } from '../util.js';
import { cadTabs, cadTabById, drawWalkthrough } from '../data/cad.js';
import { partById } from '../data/practice.js';
import { mountViz, hasViz } from '../viz/param-viz.js';
import { drawing } from './practice.js';

const shot = (name, alt, cls = 'shot') =>
  html`<button type="button" class="${cls}" data-zoom="img/mc2025/cad/${name}.png" aria-label="Enlarge screenshot: ${alt}"><img src="img/mc2025/cad/${name}.png" alt="${alt}" loading="lazy"></button>`;

const lightbox = html`<dialog class="lightbox" aria-label="Screenshot"><form method="dialog" class="lightbox-bar"><span>Mastercam 2025 · scroll to see all of it</span><button class="icon-btn lightbox-close">Close</button></form><div class="lightbox-scroll"><img alt=""></div></dialog>`;

function overview() {
  const tabs = cadTabs.filter((t) => !t.guide);
  const nKey = cadTabs.reduce((n, t) => n + t.groups.reduce((m, g) => m + g.cmds.length, 0), 0);
  const part = partById[drawWalkthrough.part];
  return {
    title: 'Design (CAD)',
    html: html`
      <section class="machine cad-head" data-group="dynamic">
        <div class="machine-bar"><span class="lamp" aria-hidden="true"></span><span>Mastercam 2025</span><span>Design</span><span class="machine-bar-r">${nKey} functions explained</span></div>
        <div class="machine-body">
          <div>
            <h1>Draw it before you machine it.</h1>
            <p class="summary">Every ribbon tab of Mastercam's CAD side: what each function does, when a programmer actually uses it, and the traps. Wireframe and Transform in detail, the rest at the level you need for 2D work.</p>
            <div class="head-actions"><a class="btn btn-cycle" href="#/cad/basics"><span class="cycle-dot" aria-hidden="true"></span>Start here: planes, levels, chaining</a><a class="btn ghost" href="#/cad/wireframe">Wireframe</a></div>
          </div>
          <div class="screen ribbon-screen">${shot('ribbon-wireframe', 'The Wireframe tab of the Mastercam 2025 ribbon', 'shot ribbon-shot')}</div>
        </div>
      </section>

      <h2 class="section-title">The ribbon, tab by tab</h2>
      <div class="cad-grid">${tabs.map((t) => html`<a class="cad-card" href="#/cad/${t.id}">
          <span class="cad-ribbon-thumb"><img src="img/mc2025/cad/${t.ribbon}.png" alt="" loading="lazy"></span>
          <strong>${t.name}</strong><span class="muted">${(t.intro.match(/^.*?[.!?](\s|$)/) || [t.intro])[0].trim()}</span>
          <span class="part-meta">${t.groups.reduce((m, g) => m + g.cmds.length, 0)} functions · ${t.groups.map((g) => g.name).join(', ')}</span>
        </a>`)}</div>

      <h2 class="section-title">Draw your first part</h2>
      <div class="walk">
        <div class="walk-part"><a href="#/practice/${part.id}">${raw(drawing(part, { small: true }))}</a><p><a href="#/practice/${part.id}">${part.name}</a>, the beginner practice part, drawn from nothing in 8 steps.</p></div>
        <ol class="walk-steps">${drawWalkthrough.steps.map((s) => html`<li><p>${s.do}</p><a class="op-chip" href="#/cad/${s.tab}/${s.cmd}">${cadTabById[s.tab].name} › ${cmdName(s.tab, s.cmd)}</a></li>`)}</ol>
      </div>
      ${lightbox}
    `,
    mount: (root) => zoomable(root),
  };
}

function zoomable(root) {
  const lb = root.querySelector('.lightbox');
  const onClick = (e) => {
    const z = e.target.closest('[data-zoom]');
    if (z) { lb.querySelector('img').src = z.dataset.zoom; lb.querySelector('img').alt = z.getAttribute('aria-label'); lb.showModal(); }
    if (e.target === lb) lb.close();
  };
  root.addEventListener('click', onClick);
  return () => root.removeEventListener('click', onClick);
}

const cmdName = (tab, id) => cadTabById[tab].groups.flatMap((g) => g.cmds).find((c) => c.id === id)?.name || id;

export function render(r) {
  const [, tabId, cmdId] = r.parts;
  if (!tabId) return overview();
  const tab = cadTabById[tabId];
  if (!tab) return { title: 'Not found', html: html`<p class="empty">No CAD page called “${tabId}”. <a href="#/cad">Design (CAD)</a></p>` };
  const shown = new Set();
  const cmd = (c) => {
    const viz = c.viz && hasViz(c.viz) && !shown.has(c.viz) ? (shown.add(c.viz), html`<div class="param-viz" data-viz="${c.viz}"></div>`) : '';
    return html`<article class="param ${viz ? 'has-viz' : ''}" id="c-${c.id}">
      <div class="param-text">
        <div class="param-top"><div class="titles"><h3>${c.name}</h3></div></div>
        <p class="what">${c.what}</p>
        ${c.when ? html`<p class="when">${c.when}</p>` : ''}
        ${c.tip ? html`<p class="tip">${c.tip}</p>` : ''}
        ${c.mistakes?.length ? html`<details class="more"><summary><span class="warn-dot" aria-hidden="true"></span>${c.mistakes.length} common mistake${c.mistakes.length > 1 ? 's' : ''}</summary><ul class="mistakes">${c.mistakes.map((m) => html`<li>${m}</li>`)}</ul></details>` : ''}
        ${c.shot ? html`<figure class="param-shot cad-shot">${shot(c.shot, `${c.name} panel in Mastercam 2025`)}<figcaption>The ${c.name.split(' /')[0]} panel in Mastercam 2025</figcaption></figure>` : ''}
      </div>
      ${viz}
    </article>`;
  };
  const minor = (c) => html`<li id="c-${c.id}"><strong>${c.name}</strong> ${c.what}${c.tip ? html` <span class="muted">${c.tip}</span>` : ''}</li>`;
  return {
    title: `${tab.name} — Design (CAD)`,
    html: html`
      <div class="crumbs"><a href="#/cad">Design (CAD)</a> › ${tab.name}</div>
      <section class="machine cad-head" data-group="dynamic">
        <div class="machine-bar"><span class="lamp" aria-hidden="true"></span><span>${tab.guide ? 'Basics' : 'Ribbon tab'}</span><span class="machine-bar-r">${tab.groups.map((g) => g.name).join(' · ')}</span></div>
        <div class="machine-body ${tab.ribbon ? '' : 'single'}">
          <div><h1>${tab.name}</h1><p class="summary">${tab.intro}</p></div>
          ${tab.ribbon ? html`<div class="screen ribbon-screen">${shot(tab.ribbon, `The ${tab.name} tab of the Mastercam 2025 ribbon`, 'shot ribbon-shot')}<p class="ribbon-cap">The ${tab.name} tab in Mastercam 2025 · tap to enlarge</p></div>` : ''}
        </div>
      </section>
      <nav class="page-tabs" aria-label="Ribbon tabs">
        <span class="tabs-op">CAD</span>
        ${cadTabs.map((t) => html`<a href="#/cad/${t.id}" ${t.id === tab.id ? raw('aria-current="page"') : ''}>${t.name}</a>`)}
      </nav>
      <div class="page-body">
        ${tab.groups.map((g) => {
          const keys = g.cmds.filter((c) => c.key), rest = g.cmds.filter((c) => !c.key);
          return html`<section class="cad-group">
            <h2 class="cad-group-title">${g.name}</h2>
            ${keys.length ? html`<div class="params">${keys.map(cmd)}</div>` : ''}
            ${rest.length ? html`<ul class="cad-minor">${rest.map(minor)}</ul>` : ''}
          </section>`;
        })}
      </div>
      ${lightbox}
    `,
    mount(root) {
      const stops = [];
      const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { io.unobserve(e.target); stops.push(mountViz(e.target.dataset.viz, e.target)); } }), { rootMargin: '300px' });
      root.querySelectorAll('.param-viz').forEach((el) => io.observe(el));
      const unzoom = zoomable(root);
      if (cmdId) {
        const el = root.querySelector('#c-' + CSS.escape(cmdId));
        if (el) { const go = () => el.scrollIntoView({ block: 'start' }); go(); setTimeout(go, 500); el.classList.add('flash'); }
      }
      return () => { io.disconnect(); stops.forEach((f) => f()); unzoom(); };
    },
  };
}

