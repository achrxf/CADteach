// Version notes shown on parameters, pages and CAD commands when another Mastercam version is picked.
import { html } from '../util.js';

// Version notes for one item (param, page or CAD command) in version V
export function vnotes(st, V, { short = false } = {}) {
  const out = [];
  if (st.missing) out.push(html`<p class="vnote vnote-missing"><b>Not in Mastercam ${V}.</b> Added in ${st.missing.v}: ${st.missing.text}${st.missing.before ? html` <span class="vnote-before">Before ${st.missing.v}: ${st.missing.before}</span>` : ''}${st.missing.check ? html` <i class="vnote-check">(to check in your version)</i>` : ''}</p>`);
  if (st.gone) out.push(html`<p class="vnote vnote-missing"><b>Gone in Mastercam ${V}.</b> Removed in ${st.gone.v}: ${st.gone.text}</p>`);
  for (const c of st.older) out.push(html`<p class="vnote vnote-older"><b>In Mastercam ${V}:</b> ${c.before} <span class="vnote-before">Changed in ${c.v}: ${c.text}</span>${c.check ? html` <i class="vnote-check">(to check)</i>` : ''}</p>`);
  if (!short) for (const c of st.later) out.push(html`<p class="vnote vnote-later"><b>Later, in ${c.v}:</b> ${c.text}</p>`);
  return out;
}
export const vhistory = (st) =>
  st.all.length
    ? html`<div class="vhist"><span class="vhist-h">Version history</span><ol>${st.all.map((c) => html`<li><span class="vhist-v">${c.v}</span>${c.text}</li>`)}</ol></div>`
    : '';
