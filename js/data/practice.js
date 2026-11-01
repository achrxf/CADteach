// Practice parts: one small part per toolpath, then three complete 2D jobs.
// Units mm. Work zero: X0 Y0 at the centre of the part, Z0 on the finished top face.
// Feature kinds:
//   cut      material removed between z0 (default 0) and z1      geo: rrect | circle | obround | circles
//   island   material left standing inside a cut, up to `top`     geo: rrect | circle
//   outside  the part's outer wall: material outside it removed down to z1 (the rest stays in the vise)
//   channel  a straight cut across the whole part in X between band[0] and band[1], down to z1
//   face     the top skim (no geometry)
// geo shapes: rrect [cx, cy, w, h, r] · circle [cx, cy, d] · obround [cx, cy, overall length, width, angle°] · circles { d, at: [[x, y]…] }

export const machines = {
  alu: { name: '3-axis VMC, high-speed', spec: '15,000 rpm · BT30 · 21 tools · 500 × 400 × 300 mm travel · 50 m/min rapids', like: 'a typical drill-tap centre' },
  steel: { name: '3-axis VMC, general purpose', spec: '8,100 rpm · BT40 · 24 tools · 762 × 406 × 508 mm travel · 25 m/min rapids · through-spindle coolant', like: 'a typical 40-taper toolroom VMC' },
};

export const fixtures = {
  vise: (grip) => ({ type: 'vise', grip, name: `150 mm machinist vise on parallels, ${grip} mm of stock in the jaws` }),
  plate: () => ({ type: 'plate', name: 'Vacuum table with a sacrificial spoilboard, so tools can break through' }),
};

const T = {
  face50: 'Ø50 face mill, 5 inserts',
  em6: 'Ø6 3-flute carbide end mill',
  em8: 'Ø8 3-flute carbide end mill',
  em10: 'Ø10 3-flute carbide end mill',
  em12: 'Ø12 3-flute carbide end mill',
  hem10: 'Ø10 5-flute HEM end mill, 30 mm flute',
  hem12: 'Ø12 4-flute HEM end mill, AlTiN, 36 mm flute',
  ch10: 'Ø10 90° chamfer mill',
  spot10: 'Ø10 90° spot drill',
  tm10: 'Ø10 single-profile thread mill',
};

export const parts = [
  // ---------------------------------------------------------------- singles
  {
    id: 'face-blank', name: 'Face a sawn blank', level: 'single', ops: ['facing'], material: 'Aluminium 6061-T6',
    stock: { x: 110, y: 80, z: 32 }, H: 30, base: { rrect: [0, 0, 110, 80, 0] }, fixture: fixtures.vise(8), machine: 'alu',
    brief: { story: 'Saw-cut blanks come in 2 mm tall with a rough top. Bring them to a flat, clean face before the next operation.', qty: 50, cycle: 1.5, tol: ['Flatness 0.02 mm', 'Height 30 ±0.05 mm'], ra: 'Ra 1.6' },
    tools: [['T1', T.face50]],
    features: [{ id: 'face', kind: 'face', name: 'Top face', size: '2 mm off the top', op: 'facing' }],
    plan: [
      { op: 'facing', page: 'cut', do: 'Cutting method Zigzag, Across overlap 50% so the cutter clears both sides of the blank, Along overlap 10 mm.' },
      { op: 'facing', page: 'depth-cuts', do: 'Two cuts: Maximum rough step 1.5, then one Finish cut of 0.5 mm for the finish.' },
      { op: 'facing', page: 'linking', do: 'Top of Stock 2 (the blank sits 2 mm above Z0), Depth 0.' },
    ],
    checks: ['Backplot: the cutter fully leaves the blank on both sides at every pass', 'No pass runs half on, half off with the face mill centre on the edge (it chatters there)'],
  },
  {
    id: 'profile-bracket', name: 'Profile a bracket', level: 'single', ops: ['contour'], material: 'Aluminium 6061-T6',
    stock: { x: 100, y: 70, z: 31 }, H: 30, base: { rrect: [0, 0, 100, 70, 0] }, fixture: fixtures.vise(10), machine: 'alu',
    brief: { story: 'A simple bracket: an outside profile, a step on one end and a 1 mm chamfer on the top edge. The bottom 10 mm stays in the vise and is cut off on the saw.', qty: 20, cycle: 4, tol: ['Profile 90 × 60 ±0.02 mm', 'Step depth 6 ±0.05 mm'], ra: 'Ra 1.6 on the walls' },
    tools: [['T2', T.em10], ['T3', T.ch10]],
    features: [
      { id: 'A', kind: 'outside', name: 'Outside profile', geo: { rrect: [0, 0, 90, 60, 8] }, z1: -15, size: '90 × 60, R8 corners, 15 deep', op: 'contour' },
      { id: 'B', kind: 'channel', name: 'Step (open on one end)', geo: { band: [30, 99] }, z1: -6, size: '15 wide, 6 deep', op: 'contour' },
      { id: 'C', kind: 'note', name: 'Top edge chamfer', size: '1 × 45° on the outside profile', op: 'contour' },
    ],
    plan: [
      { op: 'contour', page: 'cut', do: 'A: Contour type 2D, Compensation Computer, Left for climb. Stock to leave on walls 0.2 for the roughing passes.' },
      { op: 'contour', page: 'depth-cuts', do: 'A: Maximum rough step 5 (3 cuts to Z-15).' },
      { op: 'contour', page: 'multi-passes', do: 'A: one Finish pass at 0.2, Finish passes at Final depth so the wall is cut in one go.' },
      { op: 'contour', page: 'lead-in-out', do: 'Arc 50% / 90° in and out so there is no dwell mark on the wall.' },
      { op: 'contour', page: 'cut', do: 'B: chain the step as an open chain, then extend the start and end past the part (Lead In/Out → Adjust start/end).' },
      { op: 'contour', page: 'cut', do: 'C: new Contour with T3, Contour type 2D chamfer, Chamfer width 1, Bottom offset 0.5 so the tip does not rub.' },
    ],
    checks: ['The vise jaws are 5 mm below the deepest cut', 'The step\'s open chain starts and ends outside the stock'],
  },
  {
    id: 'pocket-island', name: 'Pocket around an island', level: 'single', ops: ['pocket'], material: 'Aluminium 6061-T6',
    stock: { x: 100, y: 80, z: 25.5 }, H: 25, base: { rrect: [0, 0, 100, 80, 0] }, fixture: fixtures.vise(8), machine: 'alu',
    brief: { story: 'A cover with a pocket and a standing boss in the middle. The boss must keep its full height.', qty: 30, cycle: 3.5, tol: ['Pocket 70 × 50 ±0.03 mm', 'Floor depth 8 ±0.05 mm'], ra: 'Ra 1.6 on the floor' },
    tools: [['T1', T.em8]],
    features: [
      { id: 'A', kind: 'cut', name: 'Pocket', geo: { rrect: [0, 0, 70, 50, 6] }, z1: -8, size: '70 × 50, R6 corners, 8 deep', op: 'pocket' },
      { id: 'B', kind: 'island', name: 'Island (full height)', geo: { rrect: [0, 0, 24, 14, 4] }, size: '24 × 14, R4', op: 'pocket' },
    ],
    plan: [
      { op: 'pocket', page: 'cut', do: 'Chain the pocket and the island together; Pocket type Standard works out which is which.' },
      { op: 'pocket', page: 'roughing', do: 'Cutting method High Speed (or Constant Overlap Spiral), Stepover 40%.' },
      { op: 'pocket', page: 'entry-motion', do: 'Helix, maximum radius 4 (half the tool). If entry fails: Skip, not Plunge.' },
      { op: 'pocket', page: 'finishing', do: '1 pass at 0.2, Machine finish passes only at final depth.' },
      { op: 'pocket', page: 'depth-cuts', do: 'Maximum rough step 4 → 2 cuts.' },
    ],
    checks: ['The Ø8 tool fits the R6 corners without wrapping them (R4 < R6)', 'Nothing is cut on top of the island'],
  },
  {
    id: 'three-slots', name: 'Three slots', level: 'single', ops: ['slot-mill'], material: 'Aluminium 6061-T6',
    stock: { x: 100, y: 60, z: 20.5 }, H: 20, base: { rrect: [0, 0, 100, 60, 0] }, fixture: fixtures.vise(6), machine: 'alu',
    brief: { story: 'An adjustment plate with three slots of different widths, one at 45°. One tool for all three.', qty: 40, cycle: 3, tol: ['Slot widths +0.05 / 0', 'Depth 6 ±0.1'], ra: 'Ra 3.2' },
    tools: [['T1', T.em6]],
    features: [
      { id: 'A', kind: 'cut', name: 'Slot 8 wide', geo: { obround: [-32, 0, 40, 8, 90] }, z1: -6, size: '40 × 8, 6 deep', op: 'slot-mill' },
      { id: 'B', kind: 'cut', name: 'Slot 10 wide at 45°', geo: { obround: [0, 0, 40, 10, 45] }, z1: -6, size: '40 × 10, 6 deep', op: 'slot-mill' },
      { id: 'C', kind: 'cut', name: 'Slot 12 wide', geo: { obround: [32, 0, 40, 12, 90] }, z1: -6, size: '40 × 12, 6 deep', op: 'slot-mill' },
    ],
    plan: [
      { op: 'slot-mill', page: 'rough-finish', do: 'Ramp entry, Plunge angle 3°. Roughing stepover 40% for the wider slots; 1 finishing pass at 0.15.' },
      { op: 'slot-mill', page: 'cut', do: 'Compensation Computer, climb. Stock to leave on walls 0 (the finish pass is in the op).' },
      { op: 'slot-mill', page: 'depth-cuts', do: 'Maximum rough step 3 → 2 cuts.' },
    ],
    checks: ['Each slot is chained as one closed obround, not two arcs and two lines picked separately'],
  },
  {
    id: 'deep-pocket-steel', name: 'Deep pocket in tool steel', level: 'single', ops: ['dynamic-mill'], material: 'Tool steel 1.2312, pre-hardened 30 HRC',
    stock: { x: 120, y: 90, z: 39 }, H: 38, base: { rrect: [0, 0, 120, 90, 0] }, fixture: fixtures.vise(8), machine: 'steel',
    brief: { story: 'A mould plate pocket, 25 mm deep. Conventional pocketing breaks tools here; keep the load constant and use the whole flute.', qty: 4, cycle: 12, tol: ['Pocket 80 × 56 ±0.05 (roughing, leave 0.3 for finishing later)'], ra: '—' },
    tools: [['T1', T.hem12]],
    features: [{ id: 'A', kind: 'cut', name: 'Deep pocket', geo: { rrect: [0, 0, 80, 56, 10] }, z1: -25, size: '80 × 56, R10 corners, 25 deep', op: 'dynamic-mill' }],
    plan: [
      { op: 'dynamic-mill', page: 'chain-options', do: 'Machining region = the pocket, strategy Stay inside.' },
      { op: 'dynamic-mill', page: 'cut', do: 'Stepover 10% (1.2 mm). Stock to leave 0.3 on walls and floor.' },
      { op: 'dynamic-mill', page: 'depth-cuts', do: 'One depth: 25 mm at full flute. No depth cuts needed (2 × D is fine for this tool).' },
      { op: 'dynamic-mill', page: 'entry-motion', do: 'Helix, radius 5, plunge angle 2°, and lower feed for the entry.' },
    ],
    checks: ['Speeds & feeds with chip thinning at 10% stepover (use the calculator)', 'The tool stick-out clears the 25 mm wall with the holder'],
  },
  {
    id: 'wall-from-blank', name: 'Outside wall from a sawn blank', level: 'single', ops: ['dynamic-contour'], material: 'Aluminium 7075-T6',
    stock: { x: 110, y: 80, z: 45 }, H: 44, base: { rrect: [0, 0, 110, 80, 0] }, fixture: fixtures.vise(10), machine: 'alu',
    brief: { story: 'The blank is 5 mm oversize per side. Rough and finish the 30 mm outside wall in one operation.', qty: 25, cycle: 5, tol: ['100 × 70 ±0.02 mm'], ra: 'Ra 0.8 on the walls' },
    tools: [['T1', T.hem12]],
    features: [{ id: 'A', kind: 'outside', name: 'Outside wall', geo: { rrect: [0, 0, 100, 70, 12] }, z1: -30, size: '100 × 70, R12, 30 deep', op: 'dynamic-contour' }],
    plan: [
      { op: 'dynamic-contour', page: 'contour-wall', do: 'Stock thickness 5 (what is left on each side).' },
      { op: 'dynamic-contour', page: 'cut', do: 'Stepover 12%, climb. Stock to leave on walls 0.15 for the finish pass.' },
      { op: 'dynamic-contour', page: 'finishing', do: '1 finish pass, Compensation Wear so the operator can adjust size.' },
      { op: 'dynamic-contour', page: 'depth-cuts', do: 'Full depth (30) in one step.' },
    ],
    checks: ['Jaws 4 mm below the cut depth (Z-34)', 'Finish pass uses the wear comp D register'],
  },
  {
    id: 'stepped-pocket', name: 'Stepped pocket', level: 'single', ops: ['area-mill'], material: 'Aluminium 6061-T6',
    stock: { x: 100, y: 80, z: 26 }, H: 25, base: { rrect: [0, 0, 100, 80, 0] }, fixture: fixtures.vise(8), machine: 'alu',
    brief: { story: 'A two-level pocket. One Area Mill clears both levels in high-speed offsets.', qty: 30, cycle: 4, tol: ['Floors ±0.05'], ra: 'Ra 1.6' },
    tools: [['T1', T.hem10]],
    features: [
      { id: 'A', kind: 'cut', name: 'Upper pocket', geo: { rrect: [0, 0, 80, 60, 8] }, z1: -6, size: '80 × 60, R8, 6 deep', op: 'area-mill' },
      { id: 'B', kind: 'cut', name: 'Lower pocket', geo: { rrect: [0, 0, 50, 36, 6] }, z0: -6, z1: -14, size: '50 × 36, R6, 14 deep from top', op: 'area-mill' },
    ],
    plan: [
      { op: 'area-mill', page: 'chain-options', do: 'Two machining regions at their own depths, or one op per level.' },
      { op: 'area-mill', page: 'cut', do: 'XY stepover 40%, corner rounding on.' },
      { op: 'area-mill', page: 'depth-cuts', do: 'Maximum rough step 7, Use island depths.' },
      { op: 'area-mill', page: 'finish-passes', do: '1 finish pass at final depth.' },
    ],
    checks: ['The upper level is not cut a second time when clearing the lower level'],
  },
  {
    id: 'two-channels', name: 'Two channels', level: 'single', ops: ['peel-mill'], material: 'Aluminium 6061-T6',
    stock: { x: 110, y: 70, z: 30 }, H: 29, base: { rrect: [0, 0, 110, 70, 0] }, fixture: fixtures.vise(8), machine: 'alu',
    brief: { story: 'Two open channels straight across the part, 12 and 16 wide. Trochoidal motion keeps the small tool alive in the full-width cut.', qty: 30, cycle: 4, tol: ['Widths +0.05 / 0'], ra: 'Ra 3.2' },
    tools: [['T1', T.hem10]],
    features: [
      { id: 'A', kind: 'channel', name: 'Channel 12 wide', geo: { band: [-30, -18] }, z1: -10, size: '12 wide, 10 deep, open both ends', op: 'peel-mill' },
      { id: 'B', kind: 'channel', name: 'Channel 16 wide', geo: { band: [10, 26] }, z1: -15, size: '16 wide, 15 deep, open both ends', op: 'peel-mill' },
    ],
    plan: [
      { op: 'peel-mill', page: 'cut', do: 'Chain the two walls of each channel (or one centre line with Single chain only + Slot width). Extend entry and exit 5 mm past the part.' },
      { op: 'peel-mill', page: 'cut', do: 'Stepover 10%, climb.' },
      { op: 'peel-mill', page: 'depth-cuts', do: 'Full depth in one step.' },
    ],
    checks: ['The tool starts and ends outside the stock (no plunge in the channel)'],
  },
  {
    id: 'hole-pattern', name: 'Hole pattern', level: 'single', ops: ['drill'], material: 'Aluminium 6061-T6',
    stock: { x: 100, y: 70, z: 35.5 }, H: 35, base: { rrect: [0, 0, 100, 70, 0] }, fixture: fixtures.vise(6), machine: 'alu',
    brief: { story: 'A mounting block: tapped holes, two reamed dowel holes and three deep holes. Pick the right cycle for each.', qty: 60, cycle: 3, tol: ['Ø6 H7 dowels', 'Positions ±0.05'], ra: '—' },
    tools: [['T1', T.spot10], ['T2', 'Ø6.8 carbide drill (M8 tap drill)'], ['T3', 'Ø5.8 drill (before reaming)'], ['T4', 'Ø5 carbide drill, through-coolant, 8×D'], ['T5', 'M8 × 1.25 machine tap'], ['T6', 'Ø6 H7 reamer']],
    features: [
      { id: 'A', kind: 'cut', name: 'M8 tapped, through', geo: { circles: { d: 6.8, at: [[-38, -25], [38, -25], [-38, 25], [38, 25]] } }, z1: -35, size: '4 × M8 × 1.25 through (Ø6.8 drill)', op: 'drill' },
      { id: 'B', kind: 'cut', name: 'Ø6 H7 dowel holes', geo: { circles: { d: 6, at: [[-20, 0], [20, 0]] } }, z1: -35, size: '2 × Ø6 H7 through', op: 'drill' },
      { id: 'C', kind: 'cut', name: 'Deep holes', geo: { circles: { d: 5, at: [[0, -18], [0, 0], [0, 18]] } }, z1: -30, size: '3 × Ø5 × 30 deep', op: 'drill' },
    ],
    plan: [
      { op: 'drill', page: 'cycle', do: 'Spot all 9 holes: Drill/Counterbore (G81), depth so the 90° spot makes a Ø7.5 chamfer for the M8.' },
      { op: 'drill', page: 'cycle', do: 'A: Ø6.8 Drill/Counterbore through; B: Ø5.8 through; C: Peck drill (G83) or Chip break (G73), first peck 1×D.' },
      { op: 'drill', page: 'linking', do: 'Through holes: Tip Comp on, Breakthrough 1 mm. Blind holes: no tip comp, depth to the full diameter or the point as the drawing says.' },
      { op: 'drill', page: 'cycle', do: 'A: Tap (G84) rigid, B: Bore #1 (feed out) with the reamer.' },
      { op: 'drill', page: 'hole-definition', do: 'Sort the holes to keep the travel short (2D sort, zigzag).' },
    ],
    checks: ['Through holes: the parallels are not under a hole', 'Tap feed = pitch × rpm (1.25 mm/rev)'],
  },
  {
    id: 'counterbores', name: 'Counterbores and a bore', level: 'single', ops: ['circle-mill'], material: 'Aluminium 6061-T6',
    stock: { x: 100, y: 70, z: 25 }, H: 24, base: { rrect: [0, 0, 100, 70, 0] }, fixture: fixtures.vise(6), machine: 'alu',
    brief: { story: 'Counterbores for M6 cap screws and a Ø32 H7 bearing bore, all with one end mill.', qty: 25, cycle: 4, tol: ['Ø32 H7 (+0.025 / 0)', 'Counterbore depth 6.4 +0.2'], ra: 'Ra 0.8 in the bore' },
    tools: [['T1', T.em8], ['T2', 'Ø6.6 drill (already in the program from the drill exercise)']],
    features: [
      { id: 'A', kind: 'cut', name: 'Counterbores', geo: { circles: { d: 11, at: [[-36, -22], [36, -22], [-36, 22], [36, 22]] } }, z1: -6.4, size: '4 × Ø11 × 6.4 deep', op: 'circle-mill' },
      { id: 'B', kind: 'cut', name: 'Clearance holes', geo: { circles: { d: 6.6, at: [[-36, -22], [36, -22], [-36, 22], [36, 22]] } }, z1: -24, size: '4 × Ø6.6 through (drill)', op: 'drill' },
      { id: 'C', kind: 'cut', name: 'Bearing bore', geo: { circle: [0, 0, 32] }, z1: -15, size: 'Ø32 H7 × 15 deep', op: 'circle-mill' },
    ],
    plan: [
      { op: 'circle-mill', page: 'roughing', do: 'C: Roughing on, Stepover 40%, helical entry.' },
      { op: 'circle-mill', page: 'finishing', do: 'C: 2 finish passes at 0.1 + 1 spring pass, at Final depth. Compensation Wear so the bore can be sized.' },
      { op: 'circle-mill', page: 'cut', do: 'A: select the arc points; Circle diameter 11 (Override geometry diameter if the drawing only has the Ø6.6 circles).' },
    ],
    checks: ['The bore wall is finished in one pass top to bottom (no steps)', 'Order: drill Ø6.6 first, then counterbore'],
  },
  {
    id: 'through-bores', name: 'Through bores, no pre-drill', level: 'single', ops: ['helix-bore'], material: 'Aluminium 6061-T6',
    stock: { x: 100, y: 70, z: 20 }, H: 19, base: { rrect: [0, 0, 100, 70, 0] }, fixture: fixtures.plate(), machine: 'alu',
    brief: { story: 'Two through bores straight from solid. The spoilboard underneath lets the tool break through.', qty: 30, cycle: 2.5, tol: ['Ø30 ±0.03', 'Ø20 ±0.03'], ra: 'Ra 1.6' },
    tools: [['T1', T.em12]],
    features: [
      { id: 'A', kind: 'cut', name: 'Bore Ø30', geo: { circle: [-22, 0, 30] }, z1: -19, size: 'Ø30 through', op: 'helix-bore' },
      { id: 'B', kind: 'cut', name: 'Bore Ø20', geo: { circle: [28, 0, 20] }, z1: -19, size: 'Ø20 through', op: 'helix-bore' },
    ],
    plan: [
      { op: 'helix-bore', page: 'rough-finish', do: 'Rough pitch 1.5 mm per turn, then a Finish pass with the full depth at the end.' },
      { op: 'helix-bore', page: 'linking', do: 'Break Through 1 mm into the spoilboard.' },
      { op: 'helix-bore', page: 'cut', do: 'Start at center off; Entry/exit arc so the finish pass leaves no mark.' },
    ],
    checks: ['The slug drops free at break-through: keep the feed low on the last turn', 'Enough vacuum area is left around the bores to hold the part'],
  },
  {
    id: 'threads', name: 'Internal and external threads', level: 'single', ops: ['thread-mill'], material: 'Aluminium 6061-T6',
    stock: { x: 90, y: 70, z: 30 }, H: 29, base: { rrect: [0, 0, 90, 70, 0] }, fixture: fixtures.vise(8), machine: 'alu',
    brief: { story: 'An M16 internal thread and an M24 external thread on a boss, with the same thread mill.', qty: 20, cycle: 3, tol: ['6H internal, 6g external'], ra: '—' },
    tools: [['T1', T.tm10], ['T2', T.em10]],
    features: [
      { id: 'A', kind: 'cut', name: 'M16 × 2 internal', geo: { circle: [-22, 0, 14] }, z1: -20, size: 'M16 × 2, 16 deep thread, Ø14 × 20 pre-hole', op: 'thread-mill' },
      { id: 'B', kind: 'cut', name: 'Ring around the boss', geo: { circle: [22, 0, 44] }, z1: -15, size: 'Ø44 × 15 deep (pocket first)', op: 'pocket' },
      { id: 'C', kind: 'island', name: 'M24 × 2 external boss', geo: { circle: [22, 0, 24] }, size: 'M24 × 2, 12 long', op: 'thread-mill' },
    ],
    plan: [
      { op: 'thread-mill', page: 'cut', do: 'A: ID thread, right-hand, pitch 2, Major diameter 16. Machining direction Bottom to top for climb.' },
      { op: 'thread-mill', page: 'cut', do: 'C: OD thread, Major diameter 24, Bottom to top.' },
      { op: 'thread-mill', page: 'lead-in-out', do: 'Helical entry/exit so the tool never plunges into the thread.' },
    ],
    checks: ['The pre-hole is Ø14 (= 16 − 2), the boss is Ø24 before threading', 'Thread mill reach: 16 mm of thread + clearance'],
  },

  // ---------------------------------------------------------------- full jobs
  {
    id: 'bracket-plate', name: 'Bracket plate', level: 'beginner', ops: ['facing', 'drill', 'pocket', 'slot-mill', 'contour'], material: 'Aluminium 6061-T6',
    stock: { x: 105, y: 75, z: 21 }, H: 20, base: { rrect: [0, 0, 105, 75, 0] }, fixture: fixtures.plate(), machine: 'alu',
    brief: { story: 'A customer needs 25 mounting plates by Friday. The plate is cut out of a blank held on a vacuum table, so the outside profile goes right through into the spoilboard. Leave tabs so the part cannot move once it is cut free.', qty: 25, cycle: 9, tol: ['Outside 100 × 70 ±0.05', 'Pocket depth 6 ±0.05', 'Holes Ø6.6 ±0.1'], ra: 'Ra 1.6 top face, Ra 3.2 elsewhere' },
    tools: [['T1', T.face50], ['T2', T.spot10], ['T3', 'Ø6.6 drill'], ['T4', T.em8], ['T5', T.em10]],
    features: [
      { id: 'face', kind: 'face', name: 'Top face', size: '1 mm', op: 'facing' },
      { id: 'A', kind: 'outside', name: 'Outside profile, through', geo: { rrect: [0, 0, 100, 70, 8] }, z1: -20, size: '100 × 70, R8, through + 4 tabs', op: 'contour' },
      { id: 'B', kind: 'cut', name: 'Pocket', geo: { rrect: [-12, 0, 50, 30, 6] }, z1: -6, size: '50 × 30, R6, 6 deep', op: 'pocket' },
      { id: 'C', kind: 'cut', name: 'Slot', geo: { obround: [30, 0, 34, 10, 90] }, z1: -5, size: '34 × 10, 5 deep', op: 'slot-mill' },
      { id: 'D', kind: 'cut', name: 'Mounting holes', geo: { circles: { d: 6.6, at: [[-40, -27], [40, -27], [-40, 27], [40, 27]] } }, z1: -20, size: '4 × Ø6.6 through', op: 'drill' },
    ],
    plan: [
      { op: 'facing', page: 'cut', do: 'Face 1 mm, Zigzag, one pass.' },
      { op: 'drill', page: 'cycle', do: 'Spot D, then drill Ø6.6 through. Tip Comp + 1 mm break-through into the spoilboard.' },
      { op: 'pocket', page: 'roughing', do: 'B with T4: High Speed, helix entry, 1 finish pass. 2 depth cuts.' },
      { op: 'slot-mill', page: 'rough-finish', do: 'C with T4: ramp entry, 1 finish pass.' },
      { op: 'contour', page: 'tabs', do: 'A with T5 last: 4 tabs, 6 wide × 1 thick, Full tab motion. Break Through 0.5 into the spoilboard.' },
    ],
    checks: ['The outside profile is last so the part stays rigid', 'Tabs on the long sides, away from the slot and the pocket', 'Target: under 9 minutes per part including tool changes'],
  },
  {
    id: 'manifold-block', name: 'Manifold block', level: 'intermediate', ops: ['facing', 'dynamic-contour', 'dynamic-mill', 'circle-mill', 'area-mill', 'peel-mill', 'helix-bore', 'drill'], material: 'Aluminium 7075-T6',
    stock: { x: 145, y: 95, z: 32 }, H: 31, base: { rrect: [0, 0, 145, 95, 0] }, fixture: fixtures.vise(5), machine: 'alu',
    brief: { story: 'A small hydraulic block, 10 pieces. The shop wants it in one setup on the high-speed machine, with dynamic toolpaths wherever they save time. The last 5 mm in the vise is faced off on the second side (not in this exercise).', qty: 10, cycle: 14, tol: ['Outside 140 × 90 ±0.03', 'Bore Ø14 H8', 'Channel 12 +0.05 / 0'], ra: 'Ra 1.6 walls, Ra 0.8 bore' },
    tools: [['T1', T.face50], ['T2', T.hem10], ['T3', T.em8], ['T4', T.spot10], ['T5', 'Ø8.5 drill']],
    features: [
      { id: 'face', kind: 'face', name: 'Top face', size: '1 mm', op: 'facing' },
      { id: 'A', kind: 'outside', name: 'Outside wall', geo: { rrect: [0, 0, 140, 90, 10] }, z1: -22, size: '140 × 90, R10, 22 deep', op: 'dynamic-contour' },
      { id: 'B', kind: 'cut', name: 'Main pocket', geo: { rrect: [-32, 0, 60, 56, 8] }, z1: -18, size: '60 × 56, R8, 18 deep', op: 'dynamic-mill' },
      { id: 'C', kind: 'island', name: 'Boss in the pocket', geo: { circle: [-32, 0, 26] }, size: 'Ø26, full height', op: 'dynamic-mill' },
      { id: 'D', kind: 'cut', name: 'Bore in the boss', geo: { circle: [-32, 0, 14] }, z1: -12, size: 'Ø14 H8 × 12 deep', op: 'circle-mill' },
      { id: 'E', kind: 'cut', name: 'Narrow pocket', geo: { rrect: [14, 0, 20, 56, 5] }, z1: -8, size: '20 × 56, R5, 8 deep', op: 'area-mill' },
      { id: 'F', kind: 'channel', name: 'Channel', geo: { band: [34, 46] }, z1: -10, size: '12 wide, 10 deep, through in Y', op: 'peel-mill' },
      { id: 'G', kind: 'cut', name: 'Port bore', geo: { circle: [58, 0, 16] }, z1: -20, size: 'Ø16 × 20 deep', op: 'helix-bore' },
      { id: 'H', kind: 'cut', name: 'Fixing holes', geo: { circles: { d: 8.5, at: [[58, -32], [58, 32]] } }, z1: -20, size: '2 × Ø8.5 × 20 deep', op: 'drill' },
    ],
    plan: [
      { op: 'facing', page: 'cut', do: 'Face 1 mm with T1.' },
      { op: 'dynamic-contour', page: 'contour-wall', do: 'A with T2: stock thickness 2.5, full 22 mm depth, finish pass in the same op.' },
      { op: 'dynamic-mill', page: 'chain-options', do: 'B with T2: machining region = pocket, avoidance region = boss C. Stepover 10%, one depth.' },
      { op: 'area-mill', page: 'cut', do: 'E with T2: XY stepover 35%, 1 finish pass.' },
      { op: 'peel-mill', page: 'cut', do: 'F with T2: two chains, extend entry/exit past the part, full depth.' },
      { op: 'helix-bore', page: 'rough-finish', do: 'G with T3: rough pitch 1, finish pass to size.' },
      { op: 'circle-mill', page: 'finishing', do: 'D with T3: rough + 2 finish passes, Wear comp for the H8.' },
      { op: 'drill', page: 'cycle', do: 'H: spot (T4), drill T5 with Peck drill.' },
    ],
    checks: ['Profile depth Z-22, jaws top at Z-26: 4 mm clearance', 'One Ø10 HEM tool does A, B, E and F: stay on it to save tool changes', 'Target: under 14 minutes'],
  },
  {
    id: 'housing-cover', name: 'Housing cover', level: 'advanced', ops: ['facing', 'contour', 'pocket', 'slot-mill', 'helix-bore', 'circle-mill', 'drill', 'thread-mill'], material: 'Aluminium 7075-T6',
    stock: { x: 165, y: 115, z: 29 }, H: 28, base: { rrect: [0, 0, 165, 115, 0] }, fixture: fixtures.vise(6), machine: 'alu',
    brief: { story: 'An aerospace cover, batch of 40, first-article inspection on a CMM. Tight bores and dowels, threaded holes, a chamfered outside edge. Plan the tools so it runs under 22 minutes.', qty: 40, cycle: 22, tol: ['Bore Ø20 H7', 'Dowels Ø6 H7', 'Positions ±0.02 to datum A/B/C', 'Profile 160 × 110 ±0.03'], ra: 'Ra 0.8 bore, Ra 1.6 elsewhere' },
    tools: [['T1', T.face50], ['T2', T.em10], ['T3', T.em8], ['T4', T.ch10], ['T5', T.spot10], ['T6', 'Ø6.8 drill'], ['T7', 'Ø5.8 drill'], ['T8', 'Ø6 H7 reamer'], ['T9', 'Ø6 thread mill, M8 × 1.25']],
    features: [
      { id: 'face', kind: 'face', name: 'Top face', size: '1 mm', op: 'facing' },
      { id: 'A', kind: 'outside', name: 'Outside profile + 1 mm chamfer', geo: { rrect: [0, 0, 160, 110, 12] }, z1: -18, size: '160 × 110, R12, 18 deep, 1 × 45° top edge', op: 'contour' },
      { id: 'B', kind: 'cut', name: 'Pocket', geo: { rrect: [0, 0, 110, 60, 10] }, z1: -12, size: '110 × 60, R10, 12 deep', op: 'pocket' },
      { id: 'C', kind: 'island', name: 'Bearing boss', geo: { circle: [0, 0, 36] }, size: 'Ø36, full height', op: 'pocket' },
      { id: 'D', kind: 'cut', name: 'Counterbore on the boss', geo: { circle: [0, 0, 28] }, z1: -4, size: 'Ø28 × 4 deep', op: 'circle-mill' },
      { id: 'E', kind: 'cut', name: 'Bore, through', geo: { circle: [0, 0, 20] }, z1: -28, size: 'Ø20 H7 through', op: 'helix-bore' },
      { id: 'F', kind: 'cut', name: 'Slots in the pocket floor', geo: { obround: [-38, 0, 24, 8, 90] }, z0: -12, z1: -18, size: '24 × 8, 6 deep below the floor', op: 'slot-mill' },
      { id: 'F2', kind: 'cut', name: 'Slots in the pocket floor', geo: { obround: [38, 0, 24, 8, 90] }, z0: -12, z1: -18, hidden: true, op: 'slot-mill' },
      { id: 'G', kind: 'cut', name: 'M8 threaded holes', geo: { circles: { d: 6.8, at: [[-68, -43], [68, -43], [-68, 43], [68, 43]] } }, z1: -16, size: '4 × M8 × 1.25, 12 deep thread', op: 'thread-mill' },
      { id: 'H', kind: 'cut', name: 'Dowel holes', geo: { circles: { d: 6, at: [[-72, 0], [72, 0]] } }, z1: -15, size: '2 × Ø6 H7 × 15 deep', op: 'drill' },
    ],
    plan: [
      { op: 'facing', page: 'cut', do: 'Face 1 mm.' },
      { op: 'contour', page: 'multi-passes', do: 'A with T2: rough + 1 finish pass, depth cuts of 6.' },
      { op: 'pocket', page: 'cut', do: 'B + island C with T2: High Speed, finish walls and island.' },
      { op: 'slot-mill', page: 'linking', do: 'F with T3: Top of Stock −12 (the pocket floor), Depth −18.' },
      { op: 'helix-bore', page: 'rough-finish', do: 'E with T3: helix to Ø19.8, break through 0.5 between the parallels.' },
      { op: 'circle-mill', page: 'finishing', do: 'E finish to Ø20 H7 with spring pass; D counterbore with T3.' },
      { op: 'drill', page: 'cycle', do: 'Spot G and H (T5). G: drill Ø6.8 × 16. H: drill Ø5.8, ream Ø6 H7 (Bore #1).' },
      { op: 'thread-mill', page: 'cut', do: 'G with T9: ID thread, pitch 1.25, 12 deep, bottom to top.' },
      { op: 'contour', page: 'cut', do: 'A chamfer last with T4: Contour type 2D chamfer, width 1.' },
    ],
    checks: ['The bore break-through is between the parallels, not over one', 'Dowels and bore are machined in the same setup (positional tolerance)', 'Target: under 22 minutes; count your tool changes'],
  },
];

export const partById = Object.fromEntries(parts.map((p) => [p.id, p]));
export const levels = { single: 'One toolpath', beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' };
