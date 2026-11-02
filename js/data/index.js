import contour from './ops/contour.js';
import pocket from './ops/pocket.js';
import { facing, slot } from './ops/facing-slot.js';
import { dynamicMill, dynamicContour, peelMill, areaMill } from './ops/dynamic.js';
import { drill, circleMill, helixBore, threadMill } from './ops/holes.js';

// Content is written against Mastercam 2025. Differences in 2018–2026 live in versions.js
// and are shown on each page when another version is picked.
import { versionList } from './versions.js';
export const versions = versionList.map((v) => ({ id: v.id, name: 'Mastercam ' + v.id, status: 'content' }));

export const products = [
  { id: 'mill-2d', name: '2D Mill', status: 'content' },
  { id: 'mill-3d', name: '3D Mill', status: 'planned' },
  { id: 'multiaxis', name: 'Multiaxis', status: 'planned' },
  { id: 'lathe', name: 'Lathe', status: 'planned' },
];

export const groups = [
  { id: 'standard', name: 'Standard 2D', fr: '2D standard', blurb: 'The classic toolpaths: facing, walls, pockets and slots.' },
  { id: 'dynamic', name: 'Dynamic (high-speed)', fr: 'Dynamique (UGV)', blurb: 'Constant engagement, full flute depth, smooth motion.' },
  { id: 'holes', name: 'Holes & threads', fr: 'Trous et filetages', blurb: 'Drilling cycles, milled holes and thread milling.' },
];

export const operations = [facing, contour, pocket, slot, dynamicMill, dynamicContour, areaMill, peelMill, drill, circleMill, helixBore, threadMill];

export const opById = Object.fromEntries(operations.map((o) => [o.id, o]));
// The page an operation opens on: its main parameters page, not the Tool page.
export const defaultPageIndex = (o) => Math.max(0, o.pages.findIndex((p) => p.id === 'cut' || p.id === 'cycle'));

// What changed in 2025 for the 2D mill product (source: Mastercam's own 2025 milling enhancements blog).
export const whatsNew = {
  '2025': {
    source: 'https://www.mastercam.com/community/blog/explore-the-latest-milling-enhancements-in-mastercam-2025/',
    items: [
      { op: 'dynamic-mill', page: 'finish-passes', text: 'Finish Passes page on 2D Dynamic Mill and Area Mill: high-speed finish passes along the boundaries, with feed/speed overrides, spacing and their own Lead In/Out.' },
      { op: 'area-mill', page: 'finish-passes', text: 'Same Finish Passes page on Area Mill.' },
      { op: 'thread-mill', page: 'cut', text: 'Thread Mill: Plunge after first move / Retract before last move, Cutting and Spindle direction on the parameters page, manufacturer-style helical Lead In/Out, entry feed/speed overrides, and a Tool Edge feed rate option.' },
      { op: 'drill', page: 'cycle', text: 'Hole Making / Process Hole: simpler solid hole selection, several hole types in one toolpath, holes split across bodies joined as one feature.' },
      { op: null, text: 'Mastercam Deburr add-on for automated edge finishing (2D/3D mill, router, mill-turn).' },
    ],
  },
};

export const roadmap = [
  { v: '1.x', text: 'Report-a-mistake button on every parameter; French interface and explanations' },
  { v: '1.x', text: 'Blend Mill, Engrave, Model Chamfer, 2D Swept, FBM Drill' },
  { v: '2.0', text: 'STEP part viewer with hole/pocket recognition and machining tips' },
  { v: '2.x', text: '3D Mill toolpaths (OptiRough, Waterline, Scallop…) and Mastercam 2026 differences' },
  { v: '3.0', text: 'Arabic interface, Android/iOS app from the same code (PWA → store)' },
  { v: 'Later', text: 'Other software: Vericut, CATIA V5 Machining, TopSolid' },
];
