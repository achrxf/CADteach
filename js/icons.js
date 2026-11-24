// Inline SVG icons. Operation icons are tiny top views of the toolpath pattern.
// pathLength="1" lets CSS draw the strokes in (tile hover animation).
const s = (body, vb = 24) =>
  `<svg viewBox="0 0 ${vb} ${vb}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body.replace(/<(path|rect|circle)\b/g, '<$1 pathLength="1"')}</svg>`;

export const opIcons = {
  facing: s('<rect x="3" y="4" width="18" height="16" rx="1" opacity=".35"/><path d="M5 7h14M19 7v3M19 10H5M5 10v3M5 13h14M19 13v3M19 16H5"/>'),
  contour: s('<path d="M6 6h9l3 3v9H6z" opacity=".35"/><path d="M4 4h11.8L20 8.2V20H4z"/>'),
  pocket: s('<rect x="3" y="4" width="18" height="16" rx="2" opacity=".35"/><path d="M12 12h2v2h-4V9h6v7H8V7h10v11H6V5"/>'),
  'slot-mill': s('<rect x="3" y="8" width="18" height="8" rx="4" opacity=".35"/><path d="M7 12h10"/><path d="M5 10.5h14M5 13.5h14" opacity=".7"/>'),
  'dynamic-mill': s('<rect x="3" y="4" width="18" height="16" rx="2" opacity=".35"/><path d="M4 16c2-4 4-4 4 0s2 4 4 0 2-4 4 0 3 4 4 0"/><path d="M4 10c2-4 4-4 4 0s2 4 4 0 2-4 4 0 3 4 4 0" opacity=".6"/>'),
  'dynamic-contour': s('<path d="M5 5v14h14" opacity=".35"/><path d="M8 4c3 1 3 4 0 5s-3 4 0 5 3 4 0 5"/><path d="M5 4v16"/>'),
  'area-mill': s('<rect x="3" y="4" width="18" height="16" rx="5" opacity=".35"/><rect x="6.5" y="7.5" width="11" height="9" rx="3"/><rect x="10" y="10.5" width="4" height="3" rx="1.5"/>'),
  'peel-mill': s('<path d="M3 9h18M3 15h18" opacity=".35"/><path d="M3 12c1.5-3 3-3 3 0s1.5 3 3 0 1.5-3 3 0 1.5 3 3 0 1.5-3 3 0 1.5 3 3 0"/>'),
  drill: s('<circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="7" r="2.5"/><circle cx="7" cy="17" r="2.5"/><circle cx="17" cy="17" r="2.5"/><path d="M7 3.5v1M17 3.5v1M7 13.5v1M17 13.5v1" opacity=".5"/>'),
  'circle-mill': s('<circle cx="12" cy="12" r="8" opacity=".35"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="3"/><path d="M12 12h3"/>'),
  'helix-bore': s('<path d="M6 4h12M6 20h12" opacity=".35"/><path d="M6 6c0 1.5 12 1.5 12 3S6 10.5 6 12s12 1.5 12 3-12 1.5-12 3"/>'),
  'thread-mill': s('<path d="M8 3v18M16 3v18" opacity=".35"/><path d="M8 5l8 2-8 2 8 2-8 2 8 2-8 2 8 2"/>'),
  'model-chamfer': s('<path d="M4 20V9l5-5h11v16z" opacity=".35"/><path d="M4 9l5-5"/><path d="M6 11l7-7" opacity=".6"/>'),
  'swept-2d': s('<rect x="3" y="5" width="18" height="14" rx="4" opacity=".35"/><rect x="5" y="7" width="14" height="10" rx="3"/><rect x="7.5" y="9.5" width="9" height="5" rx="2" opacity=".6"/>'),
  'swept-3d': s('<path d="M3 18c4-1 6-8 9-8s5 5 9 4" opacity=".35"/><path d="M3 15c4-1 6-8 9-8s5 5 9 4M3 21c4-1 6-8 9-8s5 5 9 4"/>'),
  revolved: s('<path d="M3 17h18" opacity=".5" stroke-dasharray="2 2"/><path d="M4 17a8 8 0 0 1 16 0"/><path d="M8 17a4 4 0 0 1 8 0" opacity=".6"/><path d="M12 9v8" opacity=".6"/>'),
  lofted: s('<path d="M4 19c0-6 2-12 4-12s2 12 4 12 2-9 4-9 4 9 4 9" opacity=".35"/><path d="M5 19c1-4 2-6 3-6M11 19c1-6 2-9 3-9M17 19c1-3 2-5 3-5"/>'),
  ruled: s('<path d="M3 19h18M7 5h10" /><path d="M4 19l4-14M8 19l2.7-14M12 19V5M16 19l-2.7-14M20 19L16 5" opacity=".6"/>'),
  coons: s('<path d="M3 17c4-3 14-3 18 0M4 7c4-2 12-2 16 0" /><path d="M3 17L4 7M21 17l-1-10M12 15.5L12 5.5" /><path d="M3.5 12c4-2 13-2 17 0" opacity=".5"/>'),
};

export const ui = {
  logo: `<svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true"><rect x="1" y="1" width="30" height="30" rx="6" fill="var(--ink)"/><path d="M8 22V12h8l4 4v6" fill="none" stroke="var(--paper)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 9h4" stroke="var(--rapid)" stroke-width="2" stroke-linecap="round" stroke-dasharray="2 2"/><circle cx="20" cy="22" r="2.6" fill="var(--feed)"/></svg>`,
  search: s('<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>'),
  learn: s('<path d="M4 5.5C4 4.7 4.7 4 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5z"/><path d="M20 5.5c0-.8-.7-1.5-1.5-1.5H13v16h5.5c.8 0 1.5-.7 1.5-1.5z"/>'),
  fix: s('<path d="M14.5 6.5a4 4 0 0 0 5 5L13 18a2.1 2.1 0 0 1-3-3l6.5-6.5"/><path d="M14.5 6.5L17 4l3 3-2.5 2.5"/><path d="M4 20l4-4"/>'),
  tools: s('<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h8M8 11h2M12 11h2M8 15h2M12 15h2M16 11v4"/>'),
  saved: s('<path d="M7 4h10v16l-5-4-5 4z"/>'),
  savedFill: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4h10v16l-5-4-5 4z" fill="currentColor"/></svg>',
  note: s('<path d="M5 4h10l4 4v12H5z"/><path d="M9 12h6M9 16h4"/>'),
  link: s('<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>'),
  sun: s('<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>'),
  moon: s('<path d="M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5z"/>'),
  chev: s('<path d="M9 6l6 6-6 6"/>'),
  check: s('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
  book: s('<path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h11"/>'),
  gcode: s('<path d="M8 8l-4 4 4 4M16 8l4 4-4 4M13.5 6l-3 12"/>'),
  part: s('<path d="M4 8l8-4 8 4v8l-8 4-8-4z"/><path d="M4 8l8 4 8-4M12 12v8"/><circle cx="12" cy="8" r="1.6"/>'),
  versions: s('<path d="M4 12h16"/><circle cx="6" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="18" cy="12" r="2.6"/><path d="M6 7v3M12 7v3M18 6v3.4" opacity=".5"/>'),
  calc: s('<circle cx="12" cy="12" r="8"/><path d="M12 12l4-3M12 4v2M20 12h-2M12 20v-2M4 12h2"/>'),
};
