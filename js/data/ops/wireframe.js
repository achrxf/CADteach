// "3D in the 2D tab": the toolpaths under Toolpaths → 2D that cut a 3D shape.
// Model Chamfer (from solid edges) and the six wireframe toolpaths (Swept 2D, Swept 3D,
// Revolved, Lofted, Ruled, Coons) that build a surface from wireframe chains and cut it with a ball.
//
// These are written from shop use, not from screenshots: the wireframe toolpaths still open an
// older tabbed dialog, and some field names below are marked "(name to check)" until checked on a seat.
import { linking, toolPage, coolant, arcFilter } from '../common.js';

const pick = (page, ids) => ({ ...page, params: page.params.filter((p) => ids.includes(p.id)) });

// Clearance / Retract / Feed plane only: the wireframe toolpaths get their depth from the wireframe.
const heights = {
  ...pick(linking, ['clearance', 'retract', 'feed-plane']),
  name: 'Heights',
  fr: 'Hauteurs (Dégagement, Retrait, Plan d’avance)',
  intro: 'Only the safe heights. There is no Top of stock or Depth here: the Z of every move comes from the wireframe itself, so the chains must be drawn at their real Z.',
};

// ---------------------------------------------------------------- shared wireframe fields
const ballTool = {
  id: 'ball-tool',
  name: 'Tool type (picked on the Tool page) — Ball / Bull nose / Flat',
  fr: 'Type d’outil — Hémisphérique / Torique / Plat',
  what: 'Not a field on this page, but the first decision. A ball touches a curved shape at one point wherever the slope is, so the shape comes out true. A flat end mill on a slope cuts with its corner and leaves steps; on a concave shape it digs in with its edge.',
  when: 'Ball for any wireframe toolpath that finishes a curved shape. Bull nose for gentle shapes with a large flat area. Flat only for the straight rulings of a Ruled toolpath on a flat-ish face.',
  typical: 'Ball, Ø6–Ø12 for finishing',
  mistakes: ['Ball radius bigger than the smallest concave radius in the shape: the tool cannot get into it and Mastercam either gouges or leaves material, depending on the compensation.', 'Feeds from the Tool page set for the full diameter: on a shallow slope the ball cuts near its tip where the surface speed is almost zero. Raise the rpm or tilt the strategy.'],
  viz: 'wf-tool',
};

const compTo = {
  id: 'compensation',
  name: 'Compensation — the tool sits on the surface, not on the line (name to check)',
  fr: 'Correction — outil sur la surface',
  what: 'The wireframe describes the part surface. Mastercam offsets the ball centre along the surface normal by the tool radius, so the ball touches the shape. With compensation off, the tool tip runs on the wireframe itself and a ball cuts the shape too deep on every slope.',
  when: 'Keep the compensation on for finishing. Turn it off only when the wireframe is already the tool-centre path you want (rare).',
  typical: 'On (compensated to the surface)',
  mistakes: ['Wireframe drawn as the tool path instead of the part shape: the toolpath is offset twice and the part comes out small by one radius.', 'Checking the backplot only from the top: the error is in Z. Look from the side or run Verify against the solid.'],
  viz: 'wf-comp',
};

const cutTol = {
  id: 'cut-tolerance',
  name: 'Cut tolerance',
  fr: 'Tolérance de coupe',
  what: 'How far the straight G1 moves may stray from the true curve. A tighter tolerance means more, shorter moves: a truer shape and a much longer program.',
  when: 'Finishing: 0.005–0.01 mm. Roughing or a shape that gets polished: 0.02–0.05 mm. Older controls with a small look-ahead slow down on very short moves.',
  typical: '0.01 mm finishing, 0.025 mm roughing',
  mistakes: ['0.001 mm on a big shape: a program of several MB that the control drip-feeds slower than the feed you asked for.', 'Loose tolerance on a visible radius: you see the facets on the part.'],
  viz: 'wf-tolerance',
};

const stepover = {
  id: 'stepover',
  name: 'Maximum stepover / Number of cuts',
  fr: 'Pas latéral maximal / Nombre de passes',
  what: 'The distance between two passes across the shape, or how many passes you want. With a ball, the stepover sets the scallop (cusp) height left between passes.',
  when: 'Work it out from the finish you need: scallop h = R − √(R² − (stepover / 2)²). A Ø10 ball at 0.5 mm stepover leaves about 0.006 mm.',
  values: { al: '3–8% of Ø for finishing', steel: '3–6% of Ø', ti: '3–5% of Ø' },
  mistakes: ['A stepover set as a distance along the flat (top view) on a steep shape: the real distance on the slope is bigger and the scallops grow on the walls.', 'Roughing with a ball at 40% stepover: deep scallops for the finish tool to clean.'],
  viz: 'wf-scallop',
};

const cutMethod = {
  id: 'cut-method',
  name: 'Cutting method — Zigzag / One way',
  fr: 'Méthode — Zigzag / Unidirectionnel',
  what: 'Zigzag cuts on the way there and on the way back, with a short step between passes. One way always cuts in the same direction and goes back above the part (rapid or feed plane) between passes.',
  when: 'Zigzag for speed. One way when the finish must be the same on every pass (climb everywhere), or when the tool climbs a steep shape better than it goes down it.',
  typical: 'Zigzag (finishing), One way for a mirror finish',
  mistakes: ['One way with the retract set high: half of the cycle time is air.'],
  viz: 'wf-method',
};

const cutDir = {
  id: 'cut-direction',
  name: 'Cut direction — Along / Across',
  fr: 'Sens de coupe — Le long / En travers',
  what: 'Along: each pass follows the long direction of the shape (the along chain), and the tool steps over the profile. Across: each pass follows the profile and the tool steps along the length.',
  when: 'Along for long shapes: few long passes, fewer direction changes. Across on short shapes or when you want the tool to climb up the profile on every pass.',
  typical: 'Along for long features',
  mistakes: ['Across on a 400 mm long rounded edge: hundreds of short passes and a scallop pattern you can feel.'],
  viz: 'wf-direction',
};

// ---------------------------------------------------------------- Model Chamfer
export const modelChamfer = {
  id: 'model-chamfer',
  name: 'Model Chamfer',
  fr: 'Chanfrein sur modèle',
  group: 'surface',
  path: 'Toolpaths → 2D → Model Chamfer',
  preview: 'model-chamfer',
  summary: 'Chamfers or deburrs edges you pick on the solid: Mastercam reads the edge, even when it is not flat, and runs a chamfer mill along it at the right depth.',
  useFor: ['Chamfering edges of a solid model without drawing any chain', 'Edges that change height (a top edge on a slope, an edge around a boss on a curved face)', 'Deburring all the sharp edges of a part with one tool'],
  avoid: ['A simple flat chamfer around a 2D outline: Contour with Contour type 2D chamfer is quicker to set up and easier to edit', 'Edges the chamfer tool cannot reach from the top (undercuts, edges on the side walls in 3-axis)'],
  chaining: 'Pick solid edges, a face (all its edges) or a whole body. No wireframe needed. Check the side arrows: the chamfer goes on the material side of each edge.',
  pages: [
    toolPage,
    {
      id: 'cut',
      name: 'Cut Parameters',
      fr: 'Paramètres de coupe',
      intro: 'The chamfer size and how deep the tip runs. Field names here are from shop use: check them against your seat.',
      params: [
        {
          id: 'edges',
          name: 'Edges — model chamfers / sharp edges (name to check)',
          fr: 'Arêtes — chanfreins du modèle / arêtes vives',
          what: 'Pick an edge that already has a chamfer on the model and the toolpath follows that chamfer face. Pick a sharp edge and the toolpath makes a chamfer of the width you type.',
          when: 'Customer model with chamfers drawn: use them. Model without chamfers and a note "break all edges 0.5×45°": pick the sharp edges and type 0.5.',
          typical: '—',
          mistakes: ['Picking the edge on the inside of a pocket floor: the chamfer mill cuts into the floor.', 'Picking both edges of a chamfer face: two passes, the second in air or too deep.'],
          viz: 'mc-select',
        },
        {
          id: 'width',
          name: 'Width',
          fr: 'Largeur',
          what: 'The chamfer leg you want, measured on the face. With a 90° chamfer mill (45° each side), width 1 mm gives a 1 × 45° chamfer.',
          when: 'Type the size from the drawing. A "0.3–0.5" break edge: aim for the middle.',
          typical: '0.3–1 mm for edge breaks',
          mistakes: ['Width bigger than what the tool cone can give: the tool would need to go deeper than its flute length. Check the tool diameter against width + tip offset.'],
          viz: 'mc-width',
        },
        {
          id: 'tip-offset',
          name: 'Tip offset',
          fr: 'Décalage de pointe',
          what: 'How far the tool tip goes below the bottom of the chamfer. The tip of a chamfer mill has no speed and is often a flat or a small point: you cut with the cone above it.',
          when: '0.2–0.5 mm on a free edge. On an edge next to a floor (a boss on a face), the tip would hit the floor: keep the offset small or use a tool with a flat tip.',
          typical: '0.2–0.5 mm',
          mistakes: ['Tip offset 0: the tool cuts with its point, the chamfer is ragged and the tip chips.', 'Big tip offset next to a floor: a groove around the boss.'],
          viz: 'mc-tip-offset',
        },
        {
          id: 'collision',
          name: 'Collision checking — shank, holder, clearance (name to check)',
          fr: 'Contrôle de collision — corps, porte-outil, garde',
          what: 'Mastercam checks the tool shank and the holder against the solid (and the fixtures you add) and trims or lifts the path where they would touch.',
          when: 'Always on when the edge sits next to a tall wall or a clamp. Give 0.5–1 mm clearance.',
          typical: 'On, clearance 0.5 mm',
          mistakes: ['Holder not defined on the Tool page: nothing is checked against the holder and the backplot looks fine.'],
          viz: 'mc-collision',
        },
        {
          id: 'stock',
          name: 'Stock to leave',
          fr: 'Surépaisseur',
          what: 'Leaves material on the chamfer face (positive) or cuts deeper (negative).',
          when: 'Usually 0. Negative a few hundredths if the chamfer comes out small on the machine.',
          typical: '0',
          mistakes: [],
          viz: 'stock',
        },
      ],
    },
    linking,
    arcFilter,
    coolant,
  ],
};

// ---------------------------------------------------------------- wireframe toolpaths
const wireOp = (o, cutPage) => ({
  group: 'surface',
  ...o,
  pages: [toolPage, { id: 'cut', fr: 'Paramètres', ...cutPage }, heights, coolant],
});

export const swept2d = wireOp(
  {
    id: 'swept-2d',
    name: 'Swept 2D',
    fr: 'Balayage 2D',
    path: 'Toolpaths → 2D → Wireframe → Swept 2D',
    preview: 'swept-2d',
    summary: 'Sweeps one profile (a radius, a chamfer, a cove) along a flat outline: the classic way to put a 3D rounded edge on a 2D part without surfaces.',
    useFor: ['A full radius or a cove on the top edge of a boss or a plate', 'Edge rounds that are too big for a corner-rounding tool', 'Short, clean code: the path is planar arcs and lines'],
    avoid: ['Profiles that change along the length (Swept 3D or Lofted)', 'Along outlines that are not flat in the tool plane'],
    chaining: 'Chain the across contour (the profile, drawn in a vertical plane) first, then the along contour (the outline, flat in the tool plane). One along chain only.',
  },
  {
    name: 'Swept 2D Parameters',
    intro: 'The profile is swept along the outline: each pass is the outline offset and lowered to one point on the profile.',
    params: [
      {
        id: 'profile',
        name: 'Across contour (profile) and along contour (outline)',
        fr: 'Profil en travers et contour le long',
        what: 'The across contour is the shape you see when you cut the edge in section: a quarter arc for a round, a line for a chamfer. The along contour is the outline it follows. The across contour must touch the along contour and stand at 90° to it.',
        when: 'Draw the profile at the start point of the outline, in a plane square to it (Front or Side view, or a plane on the edge).',
        typical: '—',
        mistakes: ['Splines in either chain: not allowed, the toolpath fails.', 'Profile drawn away from the outline: the result is shifted by the gap.'],
        viz: 'wf-swept2d',
      },
      ballTool,
      compTo,
      stepover,
      cutDir,
      cutTol,
    ],
  },
);

export const swept3d = wireOp(
  {
    id: 'swept-3d',
    name: 'Swept 3D',
    fr: 'Balayage 3D',
    path: 'Toolpaths → 2D → Wireframe → Swept 3D',
    preview: 'swept-3d',
    summary: 'Sweeps a profile along a 3D path, or between two along chains so the profile stretches to fit: a channel that climbs, an edge round that follows a sloped edge.',
    useFor: ['Rounded grooves and channels that rise or fall', 'A profile that widens between two guide curves', 'Shapes where the along chain is not flat'],
    avoid: ['Flat outlines: Swept 2D gives shorter code', 'Large freeform faces: surface toolpaths in 3D Mill'],
    chaining: 'Chain the along contour(s) first (one, or two guide curves), then the across contour. Keep the chain directions the same.',
  },
  {
    name: 'Swept 3D Parameters',
    intro: 'The profile travels along the path. With two along chains it is scaled at every point so its ends stay on both.',
    params: [
      {
        id: 'guides',
        name: 'Along contours — one path or two guide curves',
        fr: 'Contours le long — un chemin ou deux guides',
        what: 'With one along chain, the profile keeps its size and follows the path (which may climb in Z). With two, the profile is stretched or squeezed so its two ends ride on both chains.',
        when: 'Two guides for a groove that gets wider or for a round whose two tangent edges are not parallel.',
        typical: '—',
        mistakes: ['Guide chains in opposite directions: the profile flips half way and the surface twists.'],
        viz: 'wf-swept3d',
      },
      ballTool,
      compTo,
      stepover,
      cutDir,
      cutTol,
    ],
  },
);

export const revolved = wireOp(
  {
    id: 'revolved',
    name: 'Revolved',
    fr: 'Révolution',
    path: 'Toolpaths → 2D → Wireframe → Revolved',
    preview: 'revolved',
    summary: 'Spins a profile around an axis lying in X or Y and cuts that round shape on a 3-axis machine: half-cylinders, dome tops, barrel shapes, a radius on a shaft lying down.',
    useFor: ['Half-round shapes lying along X or Y (a shaft seat, a curved top)', 'Turned-looking shapes on a mill, cut from the top', 'Soft jaws with a round cradle'],
    avoid: ['Shapes that need the tool below the axis (an undercut): only the top half can be reached in 3-axis', 'Round parts that should go on a 4th axis or a lathe'],
    chaining: 'Chain the profile, then pick the axis line (it gives the axis position; the direction is X or Y).',
  },
  {
    name: 'Revolved Parameters',
    intro: 'The tool goes round the axis (or along it) within the sweep you allow. On a 3-axis mill, keep the sweep in the top half.',
    params: [
      {
        id: 'axis',
        name: 'Rotation axis — X / Y',
        fr: 'Axe de révolution — X / Y',
        what: 'The axis the profile spins around. It lies flat in the tool plane, at the height of the axis line you picked.',
        when: 'Along the long side of the shape.',
        typical: 'X',
        mistakes: ['Axis line drawn at the wrong Z: the whole shape is too high or too low by the error.'],
        viz: 'wf-rev-axis',
      },
      {
        id: 'sweep',
        name: 'Start angle / Sweep angle (names to check)',
        fr: 'Angle de départ / Angle de balayage',
        what: 'Where the rotation starts and how far it goes. 0° to 180° is the top half: everything the tool can reach from above.',
        when: 'Keep it inside 0–180°. Stop a few degrees short of horizontal on each side if the shank would rub the side of the stock.',
        typical: '0° start, 180° sweep',
        mistakes: ['Sweep past 180°: the tool would need to cut under the axis and plunges through the part.'],
        viz: 'wf-rev-sweep',
      },
      {
        id: 'direction',
        name: 'Cut direction — Around / Along the axis (name to check)',
        fr: 'Sens — Autour / Le long de l’axe',
        what: 'Around: each pass is an arc over the top of the shape, stepping along the axis. Along: each pass runs the length of the shape at one angle, stepping round.',
        when: 'Around for short shapes and for a consistent finish over the top. Along for long shapes: fewer, longer passes.',
        typical: 'Around',
        mistakes: [],
        viz: 'wf-rev-dir',
      },
      ballTool,
      stepover,
      cutTol,
    ],
  },
);

export const lofted = wireOp(
  {
    id: 'lofted',
    name: 'Lofted',
    fr: 'Lissé (loft)',
    path: 'Toolpaths → 2D → Wireframe → Lofted',
    preview: 'lofted',
    summary: 'Blends a smooth shape through three or more section curves in order, like stringers on a hull, and cuts it with a ball.',
    useFor: ['Smooth shapes you know only from a few sections (a blade, a hull, a handle)', 'Old drawings that give sections and no model'],
    avoid: ['Shapes with only two sections (Ruled is simpler)', 'Customer solid models: cut the solid with a 3D toolpath instead'],
    chaining: 'Chain the sections one after the other in order. Every chain must run the same direction and start at the matching point.',
  },
  {
    name: 'Lofted Parameters',
    intro: 'The shape passes through every section and stays smooth between them.',
    params: [
      {
        id: 'sections',
        name: 'Sections — order, direction and start points',
        fr: 'Sections — ordre, sens, points de départ',
        what: 'Mastercam joins section 1 to 2 to 3 in the order you chain them, matching start point to start point. A start point in the wrong place twists the shape like a wrung cloth.',
        when: 'Before chaining, put each start point on the same edge of the shape (all on the left, say) and point the arrows the same way.',
        typical: '—',
        mistakes: ['One section chained the other way round: the shape folds over between two sections.', 'Sections chained out of order: the loft goes back and forth.'],
        viz: 'wf-lofted',
      },
      ballTool,
      compTo,
      stepover,
      cutMethod,
      cutTol,
    ],
  },
);

export const ruled = wireOp(
  {
    id: 'ruled',
    name: 'Ruled',
    fr: 'Réglé',
    path: 'Toolpaths → 2D → Wireframe → Ruled',
    preview: 'ruled',
    summary: 'Joins two (or more) chains with straight lines and cuts that face: a draft that changes, a wedge, a surface that goes from one shape at the bottom to another at the top.',
    useFor: ['Faces made of straight lines between two edges (a varying draft, a twisted wedge)', 'Joining a straight edge to a curved one'],
    avoid: ['Curved shapes between the chains (Lofted)', 'Constant draft walls: Contour with tapered walls on the Depth Cuts page'],
    chaining: 'Chain the first edge, then the second. Same direction and matching start points, or the straight lines cross over.',
  },
  {
    name: 'Ruled Parameters',
    intro: 'Every point on the first chain is joined to the matching point on the second by a straight line.',
    params: [
      {
        id: 'start-points',
        name: 'Chains — matching start points',
        fr: 'Chaînes — points de départ',
        what: 'The straight lines join point 0% of chain 1 to 0% of chain 2, 50% to 50% and so on. Move one start point and every line skews.',
        when: 'Put both start points at the same corner of the shape. On closed chains, break them at the same position.',
        typical: '—',
        mistakes: ['Start points half a turn apart on two closed chains: all the lines cross in the middle and the tool cuts a twisted mess.'],
        viz: 'wf-ruled',
      },
      {
        id: 'ruled-method',
        name: 'Cutting method — Zigzag / One way / Circular / Swirl (names to check)',
        fr: 'Méthode — Zigzag / Unidirectionnel / Circulaire / Spirale',
        what: 'Zigzag and One way run along the straight lines. Circular follows the chains, stepping from one to the other (good on closed chains). Swirl goes round and steps continuously, like a spiral, with no step mark.',
        when: 'Closed chains (a cone that changes shape): Circular or Swirl. Open chains: Zigzag.',
        typical: 'Zigzag on open chains, Swirl on closed',
        mistakes: [],
        viz: 'wf-ruled-method',
      },
      ballTool,
      stepover,
      cutTol,
    ],
  },
);

export const coons = wireOp(
  {
    id: 'coons',
    name: 'Coons',
    fr: 'Coons',
    path: 'Toolpaths → 2D → Wireframe → Coons',
    preview: 'coons',
    summary: 'Builds a smooth patch inside four boundary curves (or a grid of them) and cuts it: the way to machine a freeform face when all you have is its four edges.',
    useFor: ['Freeform faces defined by their edges', 'A patchwork of faces drawn as a grid of curves'],
    avoid: ['Faces you have as a solid: use a 3D toolpath on the solid', 'Three-sided faces: draw a short fourth edge or use a surface'],
    chaining: 'Give the number of patches along and across, then chain the curves along, then across, in order. The four corners of each patch must meet exactly.',
  },
  {
    name: 'Coons Parameters',
    intro: 'Each patch is a smooth blend between its four edges. The patches line up edge to edge.',
    params: [
      {
        id: 'patches',
        name: 'Number of patches — along / across',
        fr: 'Nombre de carreaux — le long / en travers',
        what: 'How many patches the grid has in each direction. A 2 × 1 grid needs three across curves and two along curves (each split where the across curves meet it).',
        when: 'Tell Mastercam the grid before chaining: it then expects the right number of chains.',
        typical: '1 × 1 for a single face',
        mistakes: ['Corners that miss by 0.01 mm: the patch fails or the chaining stops. Snap every corner to an endpoint.'],
        viz: 'wf-coons',
      },
      ballTool,
      compTo,
      stepover,
      cutDir,
      cutMethod,
      cutTol,
    ],
  },
);

export const wireframeOps = [modelChamfer, swept2d, swept3d, revolved, lofted, ruled, coons];
