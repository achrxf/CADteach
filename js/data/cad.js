// Design (CAD) side of Mastercam 2025: the ribbon tabs, group by group.
// Ribbon layouts and the function panels with a `shot` were checked on a Mastercam 2025 install.
// Command: { id, name, what, when?, tip?, mistakes?, viz?, shot?, key? }   key = explained in full; others are one-liners.

export const cadTabs = [
  {
    id: 'basics', name: 'Start here', guide: true,
    intro: 'Five things that make every drawing job in Mastercam go smoother: planes, levels, chaining, AutoCursor snaps and the function panel.',
    groups: [
      {
        name: 'Planes and work zero',
        cmds: [
          { id: 'planes', key: true, name: 'WCS, Cplane and Tplane (Planes manager)', viz: 'cad-planes', what: 'The WCS is your work zero and orientation. The Cplane is the plane you draw on. The Tplane is the plane the tool works in. For 3-axis vertical work, all three are usually Top.', when: 'Change the Cplane to draw on a side face; change the Tplane when you machine from the side (second setup, 4th axis). Use the Planes manager to make a plane from a face of the solid.', mistakes: ['Drawing in the wrong Cplane: the geometry lands on the wrong face and toolpaths come out sideways.', 'Machining with the WCS still at the CAD origin instead of the part zero the operator will probe.'] },
          { id: 'z-depth', viz: 'cad-zdepth', name: 'Z depth (Home › Organize)', what: 'The Z value new 2D geometry is drawn at when the view is 2D. Keep it at 0 for flat profiles and let the toolpath set the depths.', mistakes: ['Geometry drawn at Z-12 by accident: the toolpath depths are then off by 12 if they are set incremental.'] },
        ],
      },
      {
        name: 'Levels',
        cmds: [
          { id: 'levels', viz: 'cad-levels', key: true, name: 'Levels manager', what: 'Levels are layers: put the solid, the wireframe you draw for toolpaths, the stock and the fixtures on their own levels, then switch them on and off.', when: 'Set the main level (the number in Home › Organize) before you draw so new geometry goes to the right place. DXF layers come in as levels.', tip: 'A simple shop habit: 1 = solid, 10 = machining wireframe, 20 = stock, 30 = fixtures, 100 = construction geometry.' },
        ],
      },
      {
        name: 'Chaining',
        cmds: [
          { id: 'chaining', key: true, name: 'Wireframe Chaining dialog', viz: 'cad-chain', shot: 'chaining', what: 'Opens whenever a function needs a chain: Contour, Pocket, Offset Chains, Solid Extrude… Chain picks every connected entity in one click; the arrow shows the direction and start.', when: 'Single for one entity, Partial for an open piece, Window for many shapes at once. Reverse flips the direction (that also flips climb/conventional on a contour).', mistakes: ['A tiny gap or a duplicate line stops the chain early: use Home › Delete › Duplicates and Analyze Chain.', 'Starting point in the middle of a wall: the tool enters there and leaves a mark.'] },
        ],
      },
      {
        name: 'Coming from SolidWorks, Fusion or Inventor',
        cmds: [
          { id: 'from-solidworks', viz: 'cad-sw-map', key: true, name: 'SolidWorks → Mastercam: what maps to what', what: 'Mastercam CAD is not parametric sketching. You draw plain wireframe on a construction plane (Cplane): no constraints and no dimensions driving the geometry. If something is wrong, you trim, delete and redraw, or use Modify and Transform.', when: 'Sketch → Wireframe on a Cplane. Extrude Boss/Cut → Solids › Extrude (Create body / Cut body / Add boss). Sketch plane / reference plane → Planes manager (new plane from a face, from geometry or by rotating). Fillet / Chamfer → Solids › Constant Fillet, or Fillet Entities in 2D. Hole Wizard → Solids › Hole. Feature tree → Solids manager (history can be edited, or removed in Model Prep). Configurations / layers → Levels. Mates / move part → Transform, Model Prep › Align.', tip: 'Native SOLIDWORKS, Parasolid, STEP and IGES files open through File › Open; after import, check the units, put the part zero where you will probe it (Move to Origin), and align the face you machine to Top.', mistakes: ['Expecting a dimension to drive the geometry: edit the number and nothing moves. Redraw or use Push-Pull on solids.', 'Working on a STEP model in the wrong plane because the CAD origin was not your part zero.'] },
        ],
      },
      {
        name: 'Snapping and the function panel',
        cmds: [
          { id: 'autocursor', viz: 'cad-autocursor', name: 'AutoCursor', what: 'The snap toolbar above the graphics area: endpoints, midpoints, centres, intersections, quadrants. Type coordinates directly with the space bar (e.g. 25,10).', tip: 'Press the space bar during any function to type X, Y (and Z) instead of clicking.' },
          { id: 'panel', viz: 'cad-panel', name: 'Function panel', what: 'Every drawing function opens a panel on the left with its options. The green check with a plus (OK and create new) keeps the function running; the plain green check finishes it.', tip: 'Values you type with the lock icon on stay for the next entity.' },
        ],
      },
    ],
  },

  {
    id: 'wireframe', name: 'Wireframe', ribbon: 'ribbon-wireframe',
    intro: 'Points, lines, arcs and shapes: the 2D geometry your 2D toolpaths follow. Most shop drawing is lines, arcs, rectangles, then fillet, trim and offset.',
    groups: [
      {
        name: 'Points',
        cmds: [
          { id: 'point-position', viz: 'cad-points', name: 'Point Position', what: 'A point where you click or type. Other point functions under the arrow: Point Dynamic, Point Segment, Point Endpoints, Point Nodes, Point Small Arcs.', when: 'Drill positions you get as coordinates. Point Small Arcs puts a point at the centre of every small arc: handy to turn a STEP model\'s hole edges into drill points.' },
          { id: 'bolt-circle', key: true, name: 'Bolt Circle', viz: 'cad-bolt', shot: 'bolt-circle', what: 'Holes (arcs, points or both) evenly around a centre: Full circle with a Number, or Partial circle with a Number and Angle.', when: 'Flange hole patterns. Set Diameter of the circle, Start Angle, and Arc diameter for the holes.', mistakes: ['Start angle 0 puts the first hole on the X axis: drawings often want it at 90° or between two axes.'] },
        ],
      },
      {
        name: 'Lines',
        cmds: [
          { id: 'line-endpoints', key: true, name: 'Line Endpoints', viz: 'cad-line', shot: 'line-endpoints', what: 'A line between two points. Type: Freeform, Horizontal or Vertical. Method: Two endpoints, Midpoint or Multi-line. Length and Angle can be typed.', when: 'The everyday line. Multi-line draws a connected profile point after point.', mistakes: ['Tangent left ticked in Freeform snaps the line tangent to an arc you did not mean to touch.'] },
          { id: 'line-parallel', name: 'Line Parallel', viz: 'cad-line-more', what: 'A copy of a line at a distance, on the side you pick.' },
          { id: 'line-perpendicular', viz: 'cad-line-more?t=perp', name: 'Line Perpendicular', what: 'A line at 90° to a line or arc, through a point.' },
          { id: 'line-closest', viz: 'cad-line-more?t=close', name: 'Line Closest', what: 'The shortest line between two entities. Under its arrow: Line Bisect, Line Tangent Through Point, Line Normal to Point, Line Normal to Grid, Line Normal Along Chain.' },
        ],
      },
      {
        name: 'Arcs',
        cmds: [
          { id: 'circle-center-point', key: true, name: 'Circle Center Point', viz: 'cad-arc', shot: 'circle-center-point', what: 'A full circle from its centre: Method Manual or Tangent, then Radius or Diameter.', when: 'Holes, bores, bosses. Type the diameter from the drawing; the panel keeps it for the next circle while the lock is on.' },
          { id: 'arc-3-points', viz: 'cad-arc?t=a3', name: 'Arc 3 Points', what: 'An arc through three points: start, any point on it, end.' },
          { id: 'arc-tangent', viz: 'cad-arc?t=at', name: 'Arc Tangent', what: 'An arc tangent to one or two entities (or through a point). Good for blends that Fillet cannot make.' },
          { id: 'circle-edge-point', viz: 'cad-arc?t=ce', name: 'Circle Edge Point', what: 'A circle through two or three points on its edge. Under its arrow: Arc Endpoints, Arc Polar, Arc Polar Endpoints.' },
        ],
      },
      {
        name: 'Splines',
        cmds: [
          { id: 'spline-manual', viz: 'cad-spline', name: 'Spline Manual', what: 'A smooth curve through points you click. Also: Spline Blended, Spline From Curves, Spline Automatic, Spline Convert to NURBS.', tip: 'For 2D toolpaths, prefer arcs and lines: splines post as many short G1 moves unless the toolpath Arc Filter fits arcs to them.' },
        ],
      },
      {
        name: 'Shapes',
        cmds: [
          { id: 'rectangle', viz: 'cad-rect?t=rect', key: true, name: 'Rectangle', shot: 'rectangle', what: 'Two corner points, or Width and Height. Anchor to center draws it around the first point.', when: 'Stock outlines and simple profiles. Create Additional Geometry can also make a surface, sheet solid or mesh from it.' },
          { id: 'rectangular-shapes', key: true, name: 'Rectangular Shapes', viz: 'cad-rect', shot: 'rectangular-shapes', what: 'Rectangular, Obround, Single D or Double D, from a Base point (with 9 origin positions) or 2 points, with Fillet radius and Rotation angle.', when: 'Rounded-corner pockets in one go (set Fillet radius ≥ tool radius), slots (Obround), D-shaped bores.', mistakes: ['Pocket corners drawn sharp: the toolpath then cannot reach them anyway and leaves the tool radius.'] },
          { id: 'polygon', key: true, name: 'Polygon', viz: 'cad-polygon', shot: 'polygon', what: 'A regular polygon: Sides, Radius measured Flat (to the middle of a side) or Corner, Corner Fillet and Rotation Angle.', mistakes: ['A hex for a 17 mm spanner is 17 across flats: Radius 8.5 with Flat, not Corner.'] },
          { id: 'ellipse', viz: 'cad-ellipse', name: 'Ellipse / Helix / Spiral', what: 'Under the Rectangle arrow, with Rectangle, Rectangular Shapes and Polygon.' },
          { id: 'create-letters', viz: 'cad-letters', name: 'Create Letters', what: 'Text as geometry for engraving: font, height, spacing, along a line or an arc.', tip: 'Use a single-line (stick) font for engraving with a V-bit; outline fonts need a pocket.' },
          { id: 'bounding-box', viz: 'cad-bbox', name: 'Bounding Box', what: 'The smallest box (or cylinder) around selected geometry or a solid, with extra stock if you want. A quick way to size the blank.' },
          { id: 'silhouette', viz: 'cad-silhouette', name: 'Silhouette Boundary', what: 'The outline of a solid seen from the current plane. Handy for a profile toolpath straight from a 3D model.' },
          { id: 'turn-profile', viz: 'cad-turn-profile', name: 'Turn Profile / Relief Groove / Stair / Door geometry', what: 'Specialised shapes: the half profile of a turned part, standard relief grooves, and woodworking stair and door geometry.' },
          { id: 'raster-to-vector', viz: 'cad-raster', name: 'Raster to Vector', what: 'Traces a picture (logo) into wireframe. Clean the result before machining it.' },
        ],
      },
      {
        name: 'Curves',
        cmds: [
          { id: 'curve-one-edge', viz: 'cad-silhouette?t=one', name: 'Curve One Edge / Curve All Edges', what: 'Wireframe from the edges of a solid or surface. The fastest way to get 2D chains from a customer\'s STEP model.', tip: 'Draw the curves on a separate level so you can hide the solid and chain cleanly.' },
          { id: 'curve-slice', viz: 'cad-slice', name: 'Curve Slice by Plane', what: 'The section of a model cut by a plane: get a profile at a given height.' },
        ],
      },
      {
        name: 'Modify',
        cmds: [
          { id: 'trim', key: true, name: 'Trim to Entities', viz: 'cad-trim', shot: 'trim-to-entities', what: 'Type Trim or Break. Method Auto, Trim 1 entity, Trim 2 entities or Trim 3 entities. You click the part you keep.', when: 'Clean corners after drawing construction lines. Also under the arrow: Trim to Point, Trim Many, Modify at Intersection.', mistakes: ['Clicking the piece you want to remove: Trim keeps the side you click.'] },
          { id: 'dynamic-trim', viz: 'cad-modify?t=dyn', name: 'Dynamic Trim', what: 'Drag over the pieces you want gone: they disappear up to the nearest crossing.' },
          { id: 'break', viz: 'cad-modify?t=brk', name: 'Break Two Pieces', what: 'Cuts an entity in two without removing anything. Also: Break at Intersection, Break Many, Break at Points.', when: 'To start a chain at a set point, or to give different pieces different toolpaths.' },
          { id: 'divide', viz: 'cad-modify?t=div', name: 'Divide', what: 'Removes the piece of a line or arc between the two nearest crossings, in one click.' },
          { id: 'join', viz: 'cad-modify?t=join', name: 'Join Entities', what: 'Joins broken lines or arcs that line up back into one entity.' },
          { id: 'modify-length', viz: 'cad-modify?t=len', name: 'Modify Length', what: 'Lengthens or shortens a line or arc by a value (Modify Vector under the arrow).' },
          { id: 'fillet', key: true, name: 'Fillet Entities', viz: 'cad-fillet', shot: 'fillet-entities', what: 'Rounds the corner between two entities. Method Normal, Inverse, Circle, Clearance or Relief, a Radius, and Trim entities on or off. Fillet Chains does every corner of a chain.', when: 'Internal corners at least slightly bigger than the tool radius cut cleaner: for a Ø10 tool, R5.5 rather than R5.', mistakes: ['Fillet radius equal to the tool radius: the tool wraps the corner at full engagement and chatters.'] },
          { id: 'chamfer', key: true, name: 'Chamfer Entities', viz: 'cad-chamfer', shot: 'chamfer-entities', what: 'Cuts the corner: Method 1 Distance, 2 Distances, Distance and angle or Width; Trim entities on or off.', tip: 'For a chamfered edge on the part, you usually don\'t draw it: use Contour with Contour type 2D chamfer.' },
          { id: 'offset', key: true, name: 'Offset Entity / Offset Chains', viz: 'cad-offset', shot: 'offset-entity', what: 'Parallel copy at a distance. Method Copy, Move, Join or Slot; Number of instances; Direction Selected side, Opposite side or Both sides.', when: 'Wall thickness, keep-out boundaries, stock outlines. Offset Chains keeps the corners connected.', mistakes: ['Offsetting the geometry to make the part bigger instead of using stock to leave: the drawing no longer matches the model.'] },
          { id: 'project', viz: 'cad-project', name: 'Project', what: 'Flattens or projects geometry onto a plane, a Z depth or a surface. Use it to bring 3D edges to Z0.' },
          { id: 'close-arc', viz: 'cad-modify?t=close', name: 'Close Arc', what: 'Turns an arc into a full circle.' },
          { id: 'combine-views', viz: 'cad-combine', name: 'Combine Views / Refit Spline', what: 'Clean-up tools for imported drawings: put geometry on one plane, simplify splines.' },
        ],
      },
    ],
  },

  {
    id: 'transform', name: 'Transform', ribbon: 'ribbon-transform',
    intro: 'Move, copy, rotate, mirror and pattern geometry. Every function has Method Copy, Move or Join, so you can keep the original or not.',
    groups: [
      {
        name: 'Position',
        cmds: [
          { id: 'translate', key: true, name: 'Translate', viz: 'cad-xform', shot: 'translate', what: 'Copies or moves by Delta X, Y, Z, by a Vector From/To, or by Polar length and angle. Number of instances for a row of copies.', when: 'Moving a model so its zero matches the part zero, copying a feature.' },
          { id: 'rotate', viz: 'cad-xform?t=ro', key: true, name: 'Rotate', shot: 'rotate', what: 'Around a Rotation Center Point by an Angle, with a Number of instances (Angle between or Total sweep).', when: 'Circular patterns of slots or pockets, turning an imported part to square.' },
          { id: 'mirror', viz: 'cad-xform?t=mi', key: true, name: 'Mirror', shot: 'mirror', what: 'About the X axis, the Y axis, both, a line, an angle or two points. Mirror annotation for text.', mistakes: ['Mirroring geometry for a left-hand part flips the chain direction: check climb milling on the mirrored toolpath.'] },
          { id: 'move-to-origin', viz: 'cad-origin', name: 'Move to Origin', what: 'Moves everything so the point you pick becomes X0 Y0 Z0. The quickest way to set the part zero on an imported model.' },
          { id: 'dynamic-xform', viz: 'cad-gnomon', name: 'Dynamic', what: 'Drag a gnomon to move and rotate geometry freely or by typed values.' },
          { id: 'translate-to-plane', viz: 'cad-xplane', name: 'Translate to Plane / Project / Roll', what: 'Move geometry from one plane to another, flatten it onto a plane, or wrap / unwrap it around a cylinder (Roll, for 4th axis).' },
        ],
      },
      {
        name: 'Offset',
        cmds: [{ id: 'xf-offset', viz: 'cad-offset', name: 'Entity / Chains', what: 'The same Offset Entity and Offset Chains as on the Wireframe tab.' }],
      },
      {
        name: 'Layout',
        cmds: [
          { id: 'rect-array', key: true, name: 'Rectangular Array', viz: 'cad-array', shot: 'rectangular-array', what: 'Rows and columns: Direction 1 and Direction 2, each with Instances, Distance and Angle.', when: 'Hole grids, several parts on one plate.' },
          { id: 'nesting', viz: 'cad-nesting', name: 'Geometry Nesting', what: 'Fits several part profiles on a sheet to save material (router and plate work).' },
          { id: 'distribute', viz: 'cad-distribute', name: 'Distribute', what: 'Spaces selected entities evenly.' },
        ],
      },
      {
        name: 'Size',
        cmds: [
          { id: 'scale', viz: 'cad-xform?t=sc', key: true, name: 'Scale', shot: 'scale', what: 'Uniform (one Factor or Percentage) or By axis, around a Reference point.', when: 'Inch to mm (factor 25.4), shrinkage allowance on a mould insert.', mistakes: ['Scaling a part that is dimensioned in mm because it looked small: check the file units first.'] },
          { id: 'stretch', viz: 'cad-stretch', name: 'Stretch', what: 'Moves only the entities inside a window, stretching the lines that cross it.' },
        ],
      },
    ],
  },

  {
    id: 'solids', name: 'Solids', ribbon: 'ribbon-solids',
    intro: 'Build or edit 3D solids. For 2D work you mostly use solids as the part to check against and the stock to verify with, but simple solids are quick to make from your 2D drawing.',
    groups: [
      {
        name: 'Simple',
        cmds: [{ id: 'primitives', viz: 'cad-primitive', name: 'Cylinder, Block, Sphere, Cone, Torus', what: 'Basic solids by size and position. A Block is a quick stock model for Verify.' }],
      },
      {
        name: 'Create',
        cmds: [
          { id: 'extrude', key: true, name: 'Extrude', viz: 'cad-extrude', shot: 'solid-extrude', what: 'Pulls closed chains into a solid. Type Create body, Cut body or Add boss; Distance, Through all or Both directions.', when: 'Turn a 2D profile into a solid in seconds: outline as Create body, pockets as Cut body to their depths. Then Verify against it.' },
          { id: 'revolve', viz: 'cad-revolve', name: 'Revolve / Loft / Sweep', what: 'Solid from a profile spun around an axis, blended through sections, or swept along a path.' },
          { id: 'boolean', viz: 'cad-boolean', name: 'Boolean', what: 'Add, remove or keep the common part of bodies. Remove a fixture body from stock to see what is left.' },
          { id: 'hole', viz: 'cad-hole', name: 'Hole', what: 'Real hole features (simple, counterbore, countersink, tapped) on a solid. Mastercam can use them later with hole-making toolpaths.' },
          { id: 'patterns', viz: 'cad-pattern', name: 'Rectangular / Circular / Manual Pattern', what: 'Copies solid features in a grid, around an axis or to picked positions.' },
          { id: 'impression', viz: 'cad-impression', name: 'Impression / Solids from Surfaces', what: 'Imprint a solid into another (moulds, soft jaws); turn closed surfaces into a solid.', tip: 'Impression is the quick way to cut soft-jaw shapes from the part solid.' },
        ],
      },
      {
        name: 'Modify',
        cmds: [
          { id: 'fillet-chamfer', viz: 'cad-solid-fillet', name: 'Constant Fillet / One Distance Chamfer', what: 'Round or chamfer solid edges.' },
          { id: 'shell', viz: 'cad-shell', name: 'Shell / Thicken', what: 'Hollow a solid to a wall thickness, or give a sheet a thickness.' },
          { id: 'draft-faces', viz: 'cad-draft', name: 'Draft Faces', what: 'Adds a draft angle to faces (moulds, castings).' },
          { id: 'trim-plane', viz: 'cad-trim-plane', name: 'Trim to Plane / Trim to Surface/Sheet', what: 'Cut a solid with a plane or surface and keep one side: model the part after operation 1.' },
        ],
      },
      { name: 'Drawing', cmds: [{ id: 'layout', viz: 'cad-layout', name: 'Layout', what: 'Makes a 2D drawing layout (views) from a solid.' }] },
    ],
  },

  {
    id: 'model-prep', name: 'Model Prep', ribbon: 'ribbon-model-prep',
    intro: 'Direct editing of solids, including STEP files with no history. This is where you fix a customer model before programming it.',
    groups: [
      { name: 'Create', cmds: [{ id: 'hole-axis', viz: 'cad-hole-axis', name: 'Hole Axis', what: 'Finds holes on a solid and creates their axes and points, grouped by size: drill positions from a 3D model in one go.' }] },
      {
        name: 'Direct Editing',
        cmds: [
          { id: 'push-pull', key: true, name: 'Push-Pull', viz: 'cad-push-pull', what: 'Drag a face, fillet or hole to change its size or position. No feature history needed.', when: 'Add machining stock to a face, close a slot you don\'t want to machine, make a hole the size of your drill.' },
          { id: 'move', viz: 'cad-mp-move', name: 'Move', what: 'Moves or copies faces or features of a solid.' },
          { id: 'split-faces', viz: 'cad-mp-move?t=split', name: 'Split Solid Faces', what: 'Splits a face along a curve or plane so part of it can be treated separately.' },
        ],
      },
      {
        name: 'Modify',
        cmds: [
          { id: 'remove-fillets', viz: 'cad-remove-fillets', name: 'Remove Fillets / Remove Faces', what: 'Strips fillets or faces from the model, e.g. to make an op-1 model or simplify toolpaths.' },
          { id: 'find-holes', viz: 'cad-modify-feature', name: 'Find Holes / Modify Feature / Modify Fillet', what: 'Recognise holes and features on a dumb solid and edit their size.' },
          { id: 'history', viz: 'cad-history', name: 'Remove History / Add History / Simplify Solid', what: 'Turn a featured solid into a dumb one and back, or simplify it.' },
        ],
      },
      {
        name: 'Layout',
        cmds: [
          { id: 'align', viz: 'cad-align', key: true, name: 'Align to Plane / Align to Face / Align to Z', what: 'Puts a model the right way up on the world planes, for example a STEP that arrives standing on its side.', when: 'Before you set the WCS: align the face you will machine to the top.' },
          { id: 'disassemble', viz: 'cad-disassemble', name: 'Disassemble / Solid Position', what: 'Spreads an assembly out, or positions one body against another.' },
        ],
      },
      { name: 'Color', cmds: [{ id: 'colors', viz: 'cad-face-colors', name: 'Change Face / Set Feature / Clear', what: 'Colour faces by tolerance or feature so the setup sheet and the operator see what matters.' }] },
    ],
  },

  {
    id: 'surfaces', name: 'Surfaces', ribbon: 'ribbon-surfaces',
    intro: 'Surface modelling. In a 2D shop you mostly use it to patch holes and slots so 3D toolpaths or Verify ignore them.',
    groups: [
      { name: 'Simple', cmds: [{ id: 'surf-primitives', viz: 'cad-surf-ops?t=prim', name: 'Cylinder, Block, Sphere, Cone, Torus', what: 'Simple surface shapes.' }] },
      {
        name: 'Create',
        cmds: [
          { id: 'surf-create', key: true, name: 'Extrude, Revolve, Loft, Sweep, Flat Boundary', viz: 'cad-surface', what: 'Surfaces from wireframe: pulled straight, spun around an axis, blended through sections, swept along a path, or flat inside a closed chain.' },
          { id: 'surf-from-solids', viz: 'cad-surf-ops?t=fromsol', name: 'Surfaces from Solids', what: 'Copies faces of a solid as surfaces (e.g. a check surface for a toolpath).' },
          { id: 'surf-other', viz: 'cad-surface', name: 'Net, Draft, Offset, Fence, Power Surface', what: 'Advanced surface creation for freeform shapes.' },
        ],
      },
      {
        name: 'Modify',
        cmds: [
          { id: 'fill-holes', viz: 'cad-surf-ops?t=fill', key: true, name: 'Fill Holes', what: 'Patches holes in a surface or face. Use it to stop 3D toolpaths diving into holes you drill anyway.' },
          { id: 'trim-curves', viz: 'cad-surf-ops?t=trim', name: 'Trim to Curves / Extend / Untrim / Split', what: 'Trim and edit surfaces.' },
          { id: 'blends', viz: 'cad-surf-ops?t=blend', name: 'Fillet to Surfaces / Two and Three Surface Blend', what: 'Smooth blends between surfaces.' },
        ],
      },
      { name: 'Flowline and Normals', cmds: [{ id: 'flow-normals', viz: 'cad-surf-ops?t=norm', name: 'Edit UV, Change / Set / Orient normals', what: 'Direction controls used by some surface toolpaths.' }] },
    ],
  },

  {
    id: 'mesh', name: 'Mesh', ribbon: 'ribbon-mesh',
    intro: 'STL-style triangle meshes: scans, 3D-printed parts, stock from a previous op.',
    groups: [
      { name: 'Create', cmds: [{ id: 'mesh-from', viz: 'cad-mesh', name: 'Meshes from Entities / Offset Mesh', what: 'Mesh from solids or surfaces, or an offset copy (a stock allowance).' }] },
      { name: 'Modify', cmds: [{ id: 'mesh-modify', viz: 'cad-mesh?t=mod', name: 'Smooth, Fill Holes, Refine, Decimation, Trim', what: 'Clean up and lighten scanned meshes.' }] },
      { name: 'Analyze', cmds: [{ id: 'check-mesh', viz: 'cad-mesh?t=check', name: 'Check Mesh', what: 'Finds holes and bad triangles before you use the mesh as stock or check geometry.' }] },
    ],
  },

  {
    id: 'drafting', name: 'Drafting', ribbon: 'ribbon-drafting',
    intro: 'Dimensions and notes on your geometry: for setup sheets, for checking a DXF, or for a quick drawing for the operator.',
    groups: [
      {
        name: 'Dimension',
        cmds: [
          { id: 'smart-dim', key: true, name: 'Smart Dimension', viz: 'cad-dims', what: 'Picks the right dimension for what you click: a line gives a length, an arc a diameter or radius, two lines an angle. Horizontal, Vertical, Circular, Angular, Baseline, Chained and others force a type.', when: 'Checking an imported DXF against the drawing before you program it.', tip: 'Analyze Distance (Home tab) is faster when you only need the number.' },
        ],
      },
      { name: 'Ordinate', cmds: [{ id: 'ordinate', viz: 'cad-dims?t=ord', name: 'Ordinate', what: 'Dimensions from a zero, the way you program and inspect: Horizontal, Vertical, Add To Existing, Window, Align.' }] },
      { name: 'Annotate', cmds: [{ id: 'annotate', viz: 'cad-annotate', name: 'Note, Hole Table, Cross Hatch, Leader, Witness Line', what: 'Text, a table of all holes with their positions and sizes, hatching for sections.', tip: 'Hole Table is a quick check of every hole position against the drawing.' }] },
      { name: 'Regenerate and Modify', cmds: [{ id: 'regen', viz: 'cad-dims?t=base', name: 'Regenerate / Multi-Edit / Break Into Lines', what: 'Update dimensions after geometry changes, edit several at once, or explode them into plain lines.' }] },
    ],
  },

  {
    id: 'home', name: 'Home', ribbon: 'ribbon-home',
    intro: 'Attributes, deleting and the Analyze tools you use to check geometry before programming.',
    groups: [
      { name: 'Attributes and Organize', cmds: [{ id: 'attributes', viz: 'cad-attrib', name: 'Colour, line style, point style, Z depth, level', what: 'What new geometry looks like and where it goes. Set the level before you draw.' }] },
      {
        name: 'Delete',
        cmds: [
          { id: 'duplicates', viz: 'cad-dupes', key: true, name: 'Delete › Duplicates', what: 'Finds and deletes geometry drawn twice on top of itself. Very common in DXF files.', when: 'Before chaining any imported geometry: duplicates break chains and double toolpaths.' },
          { id: 'delete', viz: 'cad-dupes?t=del', name: 'Delete Entities / Undelete Entity', what: 'Delete, and bring back what you just deleted.' },
        ],
      },
      { name: 'Display', cmds: [{ id: 'hide', viz: 'cad-hide', name: 'Hide/Unhide, Blank', what: 'Temporarily hide geometry to chain or select what is behind it.' }] },
      {
        name: 'Analyze',
        cmds: [
          { id: 'analyze-entity', viz: 'cad-analyze', key: true, name: 'Analyze Entity / Analyze Distance', what: 'The properties of what you click (length, radius, centre, endpoints) and the distance between two points.', when: 'Checking a radius before choosing the tool, checking the model against the drawing.' },
          { id: 'analyze-chain', viz: 'cad-analyze?t=chain', name: 'Chain (Analyze)', what: 'Shows gaps, overlaps and short entities in chains: the reason a chain stops halfway.' },
          { id: 'analyze-toolpath', viz: 'cad-analyze?t=tp', name: 'Analyze Toolpath / Analyze Deviation', what: 'Click a toolpath move to see its feed, position and origin; compare geometry against a model.' },
          { id: 'statistics', viz: 'cad-analyze?t=stats', name: 'Statistics / 2D Area / Angle / Check Solid', what: 'Count entities, measure a 2D area (handy for quoting), measure angles, check a solid is valid.' },
        ],
      },
      { name: 'Add-Ins', cmds: [{ id: 'command-finder', viz: 'cad-finder', name: 'Command Finder', what: 'Search for any function by name: the fastest way to find something you only use once a year.' }] },
    ],
  },

  {
    id: 'view', name: 'View', ribbon: 'ribbon-view',
    intro: 'How you look at the job: views, shading, section view, and the managers (Toolpaths, Solids, Planes, Levels).',
    groups: [
      { name: 'Zoom and Graphics View', cmds: [{ id: 'views', viz: 'cad-views', name: 'Fit, Window, Top, Isometric, Front, = Cplane', what: 'Standard views. Alt+F1 fits the screen in many setups; = Cplane looks straight at the plane you are drawing on.' }] },
      { name: 'Section View and Appearance', cmds: [{ id: 'section-view', viz: 'cad-section', name: 'Section View, Wireframe, Outline Shaded, Translucency', what: 'Cut the model to see inside a pocket, show it see-through to chain the bottom edges.' }] },
      { name: 'Managers', cmds: [{ id: 'managers', viz: 'cad-managers', name: 'Toolpaths, Solids, Planes, Levels, Groups, Recent Functions', what: 'Open or close the manager panels on the left.' }] },
      { name: 'Grid, Display, Viewsheets', cmds: [{ id: 'grid', viz: 'cad-grid', name: 'Show Grid, Snap to Grid, Show Axes, Viewsheets', what: 'A grid to click on, the axes, and saved view tabs at the bottom of the graphics area.' }] },
    ],
  },

  {
    id: 'machine', name: 'Machine', ribbon: 'ribbon-machine',
    intro: 'Where the CAD side hands over to machining: pick the machine, set stock and tools, simulate, post.',
    groups: [
      { name: 'Machine Type', cmds: [{ id: 'machine-type', viz: 'cad-machine-type', key: true, name: 'Mill, Lathe, Wire, Router, Design', what: 'Choosing Mill and a machine definition adds the Toolpaths tab for that machine. Design takes you back to pure CAD.', when: 'Pick the machine definition that matches your post: it sets the axes, limits and the post processor.' }] },
      { name: 'Job Setup', cmds: [{ id: 'job-setup', viz: 'cad-stock', name: 'Control Definition, Machine Definition, Material, Mill Tool Manager', what: 'The control (post settings), the machine kinematics, the material for feeds and speeds, and the tool library.' }] },
      { name: 'Simulator', cmds: [{ id: 'simulator', viz: 'cad-sim', key: true, name: 'Backplot, Verify, Simulate', what: 'Backplot draws the tool centre path. Verify removes material from the stock. Simulate shows the machine and fixtures.', tip: 'Verify against the solid with the compare tool before posting; in many shops a final check in Vericut follows.' }] },
      { name: 'Post', cmds: [{ id: 'post', viz: 'cad-post', name: 'Generate (G1)', what: 'Posts the selected operations to NC code through the machine\'s post processor. Then read it in the G-code explainer.' }] },
      { name: 'Setup Sheet and ATP', cmds: [{ id: 'setup-sheet', viz: 'cad-setup-sheet', name: 'Setup Sheet, Machine Simulation, Automatic Toolpathing', what: 'A sheet for the operator with tools, offsets and pictures; full machine simulation; and ATP, which creates toolpaths automatically from a solid.' }] },
    ],
  },
];

export const cadTabById = Object.fromEntries(cadTabs.map((t) => [t.id, t]));

// A walkthrough: drawing the Bracket plate practice part from scratch.
export const drawWalkthrough = {
  part: 'bracket-plate',
  steps: [
    { tab: 'basics', cmd: 'levels', do: 'Set the main level to 10 (machining wireframe), Z depth 0, Cplane and WCS Top.' },
    { tab: 'wireframe', cmd: 'rectangular-shapes', do: 'Rectangular Shapes: Rectangular, Base point at the centre origin, Width 100, Height 70, Fillet radius 8. Click X0 Y0 (space bar, type 0,0).' },
    { tab: 'wireframe', cmd: 'rectangular-shapes', do: 'Pocket: Rectangular Shapes again, Width 50, Height 30, Fillet radius 6, base point at −12, 0.' },
    { tab: 'wireframe', cmd: 'rectangular-shapes', do: 'Slot: Type Obround, Width 10, Height 34 (or Width 34 with Rotation angle 90), base point at 30, 0.' },
    { tab: 'wireframe', cmd: 'circle-center-point', do: 'Holes: Circle Center Point, Diameter 6.6, at 40,27 then −40,27, −40,−27, 40,−27 (keep the lock on so the diameter stays).' },
    { tab: 'transform', cmd: 'mirror', do: 'Or draw one hole and use Mirror about X and then Y (Method Copy).' },
    { tab: 'drafting', cmd: 'smart-dim', do: 'Check: Smart Dimension or Analyze Distance on the outline and one hole.' },
    { tab: 'solids', cmd: 'extrude', do: 'Optional: Extrude the outline 20 (Create body), then the pocket 6 and slot 5 as Cut body. Now you have a solid to Verify against.' },
  ],
};
