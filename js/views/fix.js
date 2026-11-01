import { html, raw } from '../util.js';
import { t, nm, alt } from '../i18n.js';
import { ui } from '../icons.js';
import { symptoms } from '../data/reference.js';
import { opById } from '../data/index.js';

export function render(r) {
  const openId = r.parts[1];
  const area = r.query.get('area') || '';
  const areas = [...new Set(symptoms.map((s) => s.area))];
  const list = symptoms.filter((s) => !area || s.area === area || s.id === openId);

  const linkLabel = ([o, pg, pa]) => {
    const op = opById[o];
    const page = op?.pages.find((x) => x.id === pg);
    const p = page?.params.find((x) => x.id === pa);
    return p ? `${op.name} › ${p.name}` : page ? `${op.name} › ${page.name}` : op?.name || o;
  };

  return {
    title: t('fix'),
    html: html`
      <h1 class="page-title">${t('fix')}</h1>
      <p class="lede">Start from what you see on the part or hear at the machine. Each cause links to the exact parameter to change.</p>
      <div class="filters" role="group" aria-label="Filter by area">
        <a class="pill" href="#/fix" ${!area ? raw('style="background:var(--ink);color:var(--paper)"') : ''}>All</a>
        ${areas.map((a) => html`<a class="pill" href="#/fix?area=${encodeURIComponent(a)}" ${a === area ? raw('style="background:var(--ink);color:var(--paper)"') : ''}>${a}</a>`)}
      </div>
      <div class="symptom-list">
        ${list.map(
          (s) => html`<details class="symptom" id="${s.id}" ${s.id === openId ? raw('open') : ''}>
            <summary><h3>${nm(s)} ${alt(s) ? html`<span class="fr" style="font-family:var(--f-body);font-size:var(--t-sm)">${alt(s)}</span>` : ''}</h3><span class="pill">${s.area}</span><span class="chev">${raw(ui.chev.replace('<svg', '<svg width="18" height="18"'))}</span></summary>
            <ol>
              ${s.causes.map(
                (c) => html`<li>${c.text}
                  ${c.links.length || c.tool
                    ? html`<div class="links">
                        ${c.links.map((l) => html`<a href="#/op/${l.filter(Boolean).join('/')}">${linkLabel(l)}</a>`)}
                        ${c.tool === 'feeds' ? html`<a href="#/tools/feeds">${t('feeds')}</a>` : ''}
                      </div>`
                    : ''}
                </li>`,
              )}
            </ol>
          </details>`,
        )}
      </div>
    `,
    mount(root) {
      if (openId) root.querySelector('#' + CSS.escape(openId))?.scrollIntoView({ block: 'start' });
    },
  };
}
