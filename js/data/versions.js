// What changed between Mastercam 2018 and 2026, for the parts of the program this app covers.
// The app's main content is written against 2025. Each entry here says what is different in
// other versions, so a page can show "not in your version" or "in your version it looked like this".
//
// Fields:
//   v       the version the change arrived in
//   type    'added'   the item does not exist before v (it is dimmed in older versions)
//           'changed' the item exists but worked or sat differently before v (show `before`)
//           'removed' the item is gone from v on (dimmed in v and later)
//           'info'    a change worth knowing that has no single field in the app
//   op      toolpath id, array of ids, or '*' for every toolpath that has the page/param
//   page, param   ids inside the toolpath (optional)
//   cad     CAD command id (instead of op/page/param)
//   text    what changed, in our own words
//   before  how it was before v (for 'changed')
//   check   true when the detail comes from a short release summary and should be checked in that version
//
// Sources: Mastercam "What's New" documents and release articles for each version (see the Versions page).

export const versionList = [
  { id: '2018', year: 2017, note: 'Ribbon interface (since 2017). Drill points picked with the Drill Point Selection / Drill Point Manager.' },
  { id: '2019', year: 2018, note: 'Toolpath Hole Definition for picking holes. Solid Hole function. Model Chamfer toolpath.' },
  { id: '2020', year: 2019, note: 'Hole Definition takes solid features. Override geometry diameter on milled holes. Trim Break Extend split up.' },
  { id: '2021', year: 2020, note: 'Advanced Drill and Chamfer Drill. Skip pockets on Dynamic Mill. Roll in on Face. Point Small Arcs.' },
  { id: '2022', year: 2021, note: 'Automatic regions from solids for Dynamic Mill and Area Mill. OptiRough in every Mill level.' },
  { id: '2023', year: 2022, note: 'Machine Group Setup panel for stock, material, workholding and tools.' },
  { id: '2024', year: 2023, note: 'Break Through and Tip Comp on the main Linking page. Area Mill direction fields. Maximum engagement. Process Hole.' },
  { id: '2025', year: 2024, note: 'Finish passes inside Dynamic Mill and Area Mill. Thread Mill tool edge feed and gradual lead. Simpler solid hole selection.' },
  { id: '2026', year: 2025, note: 'Tapered helix entry. Include voids for holes. Planes and Levels managers as trees. New tool designer panels.' },
];
export const BASE_VERSION = '2025';

const HOLES = ['drill', 'circle-mill', 'helix-bore', 'thread-mill'];
const MILLED_HOLES = ['circle-mill', 'helix-bore', 'thread-mill'];

export const changes = [
  // ---------------------------------------------------------------- 2018
  { v: '2018', type: 'added', op: 'contour', page: 'multi-passes', param: 'finish-after-all', text: 'Machine finish passes after roughing (all contours), Multi pass order and Rough pass cut direction arrive on the Multi Passes page.' },
  { v: '2018', type: 'info', op: ['dynamic-mill', 'area-mill', 'dynamic-contour'], page: 'depth-cuts', param: 'depth-cut-order', text: 'Depth cut order By region / By depth arrives for the dynamic toolpaths.' },
  { v: '2018', type: 'info', op: 'dynamic-mill', page: 'entry-motion', param: 'entry-method', text: 'New entry method Plunge only: straight down without setting up a helix.' },
  { v: '2018', type: 'info', op: ['contour', 'slot-mill', 'circle-mill', 'dynamic-contour', 'peel-mill'], text: 'Spring passes can be added on the finish page.' },
  { v: '2018', type: 'info', op: ['facing', 'contour', 'pocket'], page: 'depth-cuts', param: 'depth-direction', text: 'Depth cut direction Step up / Step down (for undercut tools).' },
  { v: '2018', type: 'info', op: ['contour', 'slot-mill'], page: 'arc-filter', param: 'arc-feed', text: 'Override arc feed rate (Max ID decrease / Max OD increase) is available for Contour and Slot Mill.' },
  { v: '2018', type: 'info', op: 'contour', page: 'cut', param: 'chamfer', text: 'Chamfer tool offset gets Top offset and Bottom offset; the width field becomes Chamfer width and can be 0 to follow an existing chamfer.' },
  { v: '2018', type: 'info', cad: 'create-letters', text: 'Create Letters becomes a function panel with letters you can still edit.' },
  { v: '2018', type: 'info', cad: 'analyze-entity', text: 'Analyze Distance Along Curve added; Analyze Entity can push one arc radius to all selected arcs.' },

  // ---------------------------------------------------------------- 2019
  { v: '2019', type: 'added', op: 'drill', page: 'hole-definition', text: 'Toolpath Hole Definition panel: pick holes, filter by type and sort them in a list (also used to pick holes for the milled-hole toolpaths).', before: 'You picked drill points with Drill Point Selection (the Drill Point Manager), with its own sort and "Sort by name" options.', check: true },
  { v: '2019', type: 'added', cad: 'hole', text: 'Solid Hole function: holes with presets (counterbore, tapped…) without sketching and extruding.' },
  { v: '2019', type: 'added', cad: 'align', text: 'Align to plane / face / Z tools for imported solids.' },
  { v: '2019', type: 'added', cad: 'section-view', text: 'One-click section view of the part and toolpaths.' },
  { v: '2019', type: 'info', cad: 'bounding-box', text: 'Bounding Box can be oriented to the plane, a face, automatically or by hand.' },
  { v: '2019', type: 'info', text: 'New 2D toolpath Model Chamfer: pick solid edges, Mastercam builds the chamfer path and keeps clear of fixtures.' },
  { v: '2019', type: 'info', text: 'Toolpath display: entry/exit, rapids and micro lifts can be shown or hidden separately.' },

  // ---------------------------------------------------------------- 2020
  { v: '2020', type: 'info', op: 'drill', page: 'hole-definition', param: 'select', text: 'Solid features and lines can be picked as holes; the list shows each hole\'s diameter. Ctrl+click a diameter picks all of that size.' },
  { v: '2020', type: 'added', op: 'circle-mill', page: 'cut', param: 'circle-diameter', text: 'Override geometry diameter: cut a different size than the selected arc or solid hole.', before: 'The circle size came from the arc you picked; only points used the typed diameter.' },
  { v: '2020', type: 'added', op: 'helix-bore', page: 'cut', param: 'diameter', text: 'Override geometry diameter on the Cut Parameters page.', before: 'The size came from the arc you picked; only points used the typed diameter.' },
  { v: '2020', type: 'added', op: 'thread-mill', page: 'cut', param: 'diameters', text: 'Override geometry diameter for the major / minor thread diameter.', before: 'The size came from the arc you picked.' },
  { v: '2020', type: 'changed', op: '*', page: 'linking', param: 'depth', text: '"Calculate depth from top of line/hole": depth and incremental values can be taken from the selected hole or line.', before: 'Incremental depth was always measured from the chained point; there was no option to use the top of a solid hole.' },
  { v: '2020', type: 'info', op: ['dynamic-mill', 'area-mill'], page: 'chain-options', param: 'regions', text: 'Several Air region chains per machining region (before: one).' },
  { v: '2020', type: 'info', op: ['contour', 'pocket'], page: 'lead-in-out', param: 'overlap', text: 'Overlap now works with spring passes (it is applied to the last spring pass).' },
  { v: '2020', type: 'changed', cad: 'trim', text: 'Trim Break Extend is split into Trim to Entities, Trim to Point and Modify Length.', before: 'One function, Trim Break Extend, with modes for trim, break and extend.' },
  { v: '2020', type: 'changed', cad: 'modify-length', text: 'Modify Length (the old Extend mode) is its own function.', before: 'Extend was a mode of Trim Break Extend.' },
  { v: '2020', type: 'changed', cad: 'history', text: 'Find Features is renamed Add History and can rebuild Hole operations on several bodies.', before: 'Called Find Features.' },
  { v: '2020', type: 'info', cad: 'push-pull', text: 'Push-Pull can make a copy (new body) instead of moving the faces.' },
  { v: '2020', type: 'info', cad: 'boolean', text: 'Boolean takes several tool bodies at once.' },

  // ---------------------------------------------------------------- 2021
  { v: '2021', type: 'added', op: 'dynamic-mill', page: 'entry-motion', param: 'skip-pockets', text: 'Skip pockets smaller than (tool % or a minimum size) and Skip all on the Entry Motion page.', before: 'No skip option: small closed areas were entered whatever their size.' },
  { v: '2021', type: 'added', op: 'area-mill', page: 'entry-motion', param: 'skip-pockets', text: 'Skip pockets smaller than / Skip all (listed for Dynamic Mill; check on Area Mill).', check: true },
  { v: '2021', type: 'added', op: 'dynamic-mill', page: 'corner-pretreatment', text: 'Corner Pretreatment page: clears corners before the main cut.' },
  { v: '2021', type: 'info', op: 'facing', page: 'cut', param: 'approach', text: 'Roll in: an arc lead-in at the start of the face pass (not for One pass or Dynamic).' },
  { v: '2021', type: 'info', op: '*', page: 'lead-in-out', param: 'line-type', text: 'New line option Profile ramp, a button to copy Entry to Exit, and negative Sweep values.' },
  { v: '2021', type: 'info', op: 'contour', page: 'multi-passes', param: 'finish-after-all', text: '"Apply to all finish passes" and "Machine spring passes after finishing all contours" added.' },
  { v: '2021', type: 'info', op: 'circle-mill', text: 'End at center added (Start and End at center can both be used).' },
  { v: '2021', type: 'info', op: 'helix-bore', page: 'cut', param: 'entry', text: 'End at center added on the Cut Parameters page.' },
  { v: '2021', type: 'info', op: 'thread-mill', page: 'cut', param: 'thread-pitch', text: 'Lock icons stop Mastercam recalculating Number of active teeth and Thread pitch.' },
  { v: '2021', type: 'info', op: HOLES, text: 'New toolpaths Advanced Drill (multi-segment cycle in a table) and Chamfer Drill (chamfer by width or depth).' },
  { v: '2021', type: 'info', op: '*', page: 'tool', param: 'tool-number', text: 'Check Tool Reach: checks tool and holder against the model without a toolpath.' },
  { v: '2021', type: 'added', cad: 'point-position', text: 'Point Small Arcs (under Point Position) puts points at the centre of small arcs; it replaces the old DrillPt add-in.', before: 'The DrillPt add-in did this job.' },
  { v: '2021', type: 'info', cad: 'z-depth', text: '"Automatically determine Z depth" keeps new points at the depth of the first point (3D mode only).' },
  { v: '2021', type: 'info', cad: 'fillet', text: 'Drag mode works with Trim to Entities, Fillet Entities and Chamfer Entities.' },

  // ---------------------------------------------------------------- 2022
  { v: '2022', type: 'info', op: ['dynamic-mill', 'area-mill'], page: 'chain-options', param: 'regions', text: 'Automatic regions: Machining, Air and Avoidance regions built from the solid, with "Convert automatic regions".' },
  { v: '2022', type: 'info', text: 'Dynamic OptiRough is in every Mill level, so a 2D licence can rough a whole part in one toolpath.' },
  { v: '2022', type: 'info', cad: 'mesh-from', text: 'More wireframe functions (Curve Slice, Point Dynamic, Line Normal…) work on meshes; one mesh can be built from several bodies.' },

  // ---------------------------------------------------------------- 2023
  { v: '2023', type: 'changed', cad: 'job-setup', text: 'Machine Group Setup function panel: stock, material, workholding, tools and simulation in one place.', before: 'Stock and tool settings were tabs in the Machine Group Properties dialog (Files, Tool Settings, Stock Setup).' },
  { v: '2023', type: 'info', text: 'Area Roughing and Dynamic OptiRough see undercut stock and cut less air.' },

  // ---------------------------------------------------------------- 2024
  { v: '2024', type: 'changed', op: '*', page: 'linking', param: 'break-through', text: 'Break Through sits on the main Linking Parameters page.', before: 'Break Through was its own child page under Cut Parameters (tick the page, then set the amount).' },
  { v: '2024', type: 'changed', op: '*', page: 'linking', param: 'tip-comp', text: 'Tip Comp sits on the main Linking Parameters page.', before: 'Tip Comp was a child page under Linking Parameters.' },
  { v: '2024', type: 'changed', op: 'contour', page: 'cut', param: 'tip-comp', text: 'Tip Comp sits on the main Linking Parameters page.', before: 'Tip Comp was a child page under Linking Parameters.' },
  { v: '2024', type: 'changed', op: 'area-mill', page: 'cut', param: 'direction', text: 'Closed contour direction and Open contour direction replace the old Cutting method list.', before: 'One drop-down, Cutting method (Climb / Conventional / Zigzag…), for every area.' },
  { v: '2024', type: 'info', op: 'area-mill', text: 'HST Leads page gets Horizontal arc entry / exit, Sweep angle and a Ramp angle (small helix) besides the vertical arcs.' },
  { v: '2024', type: 'added', op: ['dynamic-mill', 'facing'], page: 'cut', param: 'max-engagement', text: 'Maximum engagement: reaches the full stepover as fast as it can, for more full-size chips.' },
  { v: '2024', type: 'added', op: ['facing', 'pocket', 'dynamic-mill', 'dynamic-contour', 'area-mill', 'peel-mill', 'circle-mill', 'helix-bore', 'thread-mill'], page: 'arc-filter', param: 'arc-feed', text: 'Override arc feed rate available on more toolpaths (2018–2023: Contour and Slot Mill only).', check: true },
  { v: '2024', type: 'info', op: HOLES, text: 'New Process Hole toolpath: applies a saved process (spot, drill, tap…) to solid holes. A button shows or hides the hole graphics in the dialog.' },
  { v: '2024', type: 'info', cad: 'hole', text: 'Solid Hole: matching top and bottom edge treatments, flip a through hole, split one hole into new operations.' },
  { v: '2024', type: 'info', cad: 'disassemble', text: 'Disassembled bodies are laid on their largest face by default, and you can change it.' },
  { v: '2024', type: 'info', text: 'Toolpath defaults can be saved and loaded as a list.' },

  // ---------------------------------------------------------------- 2025
  { v: '2025', type: 'added', op: ['dynamic-mill', 'area-mill'], page: 'finish-passes', text: 'Finish Passes page: wall finishing passes inside the dynamic toolpath, with feed and speed overrides.', before: 'A separate Contour or Dynamic Contour operation finished the walls.' },
  { v: '2025', type: 'added', op: 'dynamic-mill', page: 'lead-in-out', text: 'A Lead In/Out child page for the new finish passes only.' },
  { v: '2025', type: 'info', op: ['dynamic-mill', 'area-mill'], page: 'cut', param: 'stock', text: 'Stock to leave options make sure material is left for the new finish passes.' },
  { v: '2025', type: 'added', op: 'thread-mill', page: 'cut', param: 'tool-edge-feed', text: 'Tool Edge Feed Rate: Mastercam works out the centre feed from the feed you want at the cutting edge.', before: 'Programmed feed was at the tool centre: you corrected it by hand (or with Override arc feed).' },
  { v: '2025', type: 'added', op: 'thread-mill', page: 'lead-in-out', param: 'gradual', text: 'Gradual lead in/out: the tool reaches thread depth over a 180° helical arc.' },
  { v: '2025', type: 'info', op: 'thread-mill', page: 'lead-in-out', param: 'standard', text: 'Speed / feed override for the lead in and out.' },
  { v: '2025', type: 'changed', op: 'drill', page: 'hole-definition', param: 'select', text: 'Solid hole selection is simpler: several hole types in one toolpath, all segments of a hole merged, same behaviour for Mastercam holes and imported STEP holes. New Hole Segments page.', before: 'Each segment of a stepped hole was its own feature and imported holes behaved differently from Mastercam holes.' },
  { v: '2025', type: 'info', cad: 'analyze-toolpath', text: 'Analyze Deviation: colour map of the gap between curves, surfaces and bodies.' },
  { v: '2025', type: 'info', cad: 'planes', text: 'Planes can be drawn in the graphics window with their own colour.' },

  // ---------------------------------------------------------------- 2026
  { v: '2026', type: 'info', op: 'dynamic-mill', page: 'entry-motion', param: 'entry-method', text: 'Helix only gets a tapered helix option for better chip evacuation.' },
  { v: '2026', type: 'info', op: 'drill', page: 'hole-definition', param: 'select', text: 'Include voids: collinear hole segments with a gap between them count as one hole (or as separate holes when off).' },
  { v: '2026', type: 'info', op: '*', page: 'tool', param: 'tool-number', text: 'Mill Tool Designer: panels with Tool, Geometry, Parameters and Coolant pages replace the wizard. Holder Designer redone the same way.' },
  { v: '2026', type: 'changed', cad: 'planes', text: 'Planes Manager is a tree with groups, drag and drop, and search.', before: 'A flat list of planes.' },
  { v: '2026', type: 'changed', cad: 'levels', text: 'Levels Manager is a tree with nested groups, drag and drop and search.', before: 'A flat table of level numbers and names.' },
  { v: '2026', type: 'info', cad: 'hole', text: 'Solid Hole panel split into Geometry Selection, Hole Style and Advanced.' },
];

// ---------------------------------------------------------------------------
const vNum = (v) => +v;
const opMatch = (c, opId) => !c.op ? false : c.op === '*' || c.op === opId || (Array.isArray(c.op) && c.op.includes(opId));

/** All changes touching this item (exact match on the deepest level given). */
export function changesFor({ op, page, param, cad }) {
  return changes.filter((c) => {
    if (cad) return c.cad === cad;
    if (!opMatch(c, op)) return false;
    if (param) return c.page === page && c.param === param;
    if (page) return c.page === page && !c.param;
    return !c.page;
  });
}

/** How this item looks in version V. */
export function statusIn(item, V) {
  const list = changesFor(item);
  const missing = list.find((c) => c.type === 'added' && vNum(V) < vNum(c.v));
  const gone = list.find((c) => c.type === 'removed' && vNum(V) >= vNum(c.v));
  const older = list.filter((c) => c.type === 'changed' && vNum(V) < vNum(c.v));
  const later = list.filter((c) => vNum(c.v) > vNum(V) && c.type !== 'added' && c.type !== 'changed');
  const history = list.filter((c) => vNum(c.v) <= vNum(V));
  return { missing, gone, older, later, history, all: list };
}

/** Everything that differs for one toolpath between version V and the 2025 base text. */
export function opDiff(opId, V) {
  return changes
    .filter((c) => opMatch(c, opId))
    .filter((c) => (vNum(V) < vNum(BASE_VERSION) ? vNum(c.v) > vNum(V) && vNum(c.v) <= vNum(BASE_VERSION) : vNum(c.v) > vNum(BASE_VERSION) && vNum(c.v) <= vNum(V)));
}

export const versionIds = versionList.map((v) => v.id);
