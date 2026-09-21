# Ball model

Original geometry authored in Blender 4.5.4 through the live Blender MCP connection. No third-party assets or textures. The editable source is `ball.blend`; the runtime GLB is `public/models/ball.glb`.

Coordinates are intentionally exported without Blender's Y-up conversion: the viewing aperture faces +Z. The body radius is 1.6 units. The genuine recessed opening has a clear radius of 0.836 units, with the rim at Z=1.33. The eight mark is on the opposite side, facing -Z.

Stable node names:

- `BallShell`: lathed glossy black body with open viewing recess.
- `ApertureRim`: separate rounded retaining lip.
- `EightBadge` and `EightMark`: white inlay and black numeral.
- `GlassWindow` and `FluidChamber`: separate reference meshes replaced by the runtime optical effect.
- `Die20`: separate 20-face icosahedron, radius 0.75, centered at Z=0.45; replaced by the runtime animated and labeled die.

The interactive liquid uses a real-time visual approximation, not a baked fluid simulation. The source retains the reference chamber and die for editing. Existing Blender scenes were preserved; this asset was created in a separate `Ball studio` scene and saved with only its dependencies.
