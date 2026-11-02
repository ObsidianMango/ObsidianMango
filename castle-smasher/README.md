# Castle Smasher — Medieval Mayhem

A static, local-first Three.js / Rapier 3D castle destruction game. Entry point: `index.html`. All runtime libraries are vendored; no CDN or backend is required. Serve over HTTP rather than opening an ES module with `file://`.

## Play

Campaign has twelve castles, ammunition limits, objectives, coins and eight destruction medals. All twelve castles and sixteen weapons are available through the normal menus. Sandbox adds gravity, launch-power, explosion and strength settings. Castle Builder supports snapped placement, stacking, rotation, movement, duplication, deletion and local blueprint saves. Challenges include precision treasure hunting, limited ammunition, timed destruction and one-shot puzzles. Endless Siege scales fortress height and ammunition with each round.

Drag the world to orbit, pinch/scroll to zoom, and use the siege dials and power lever. Space fires; arrows aim; +/− adjust power; R opens replay; C resets the camera. Optional standard-mapping gamepads support aim/orbit, fire, power and replay. On iOS, Share → Add to Home Screen uses the included icon and manifest.

## Actual-shot replay

Each shot captures timestamped entity transforms, visibility, scale, color and destruction events. Playback interpolates these snapshots and never steps or rewinds Rapier. The live transforms are restored on exit; physics remains paused during playback. The recorder bounds transform storage to 24 MiB / 400 frames, coarsening samples when needed; event storage is also bounded. Shots record up to 18 simulation seconds. Frame stepping follows recorded timestamps. Cameras include projectile, impact, tower, ground, wide, free orbit and an automatic director. Highlights select impact/collapse moments. One replay can be saved to IndexedDB and reloaded from Settings; loading a saved replay creates a fresh siege for its level rather than restoring campaign simulation progress.

## Simulation and rendering

Masonry starts as fixed colliders with a spatial support graph. Damage releases components to dynamic Rapier bodies; sparse fixed mortar joints temporarily bind released courses, then fail under damage or fatigue. Unsupported dependents activate recursively. Contact forces from falling components damage neighboring masonry. Seven construction materials plus treasure have different durability, density and friction. Barrels propagate explosions; timber can burn. These are emergent collapses, not prerecorded animations.

Materials use instanced meshes. Sleeping bodies, sparse joints, pooled particles, projectile cleanup, graphics presets and bounded recordings limit resource use. A basic canvas renderer is available if WebGL is unavailable. Detailed physical fragmentation, articulated character ragdolls, motion blur and commercial-quality siege machinery are simplified in this version. Characters use reactive capsule bodies. Environmental scenery is mostly decorative; carts, statues, bridges and powder stores are physical. Performance depends on device and scene size; real-device 30–60 FPS has not been benchmarked.

## Modules

- `physics.js`: Rapier world, impacts, supports, breakable mortar, characters.
- `render.js`, `software-renderer.js`: scene, instancing, effects, cameras and fallback.
- `weapons.js`: weapon models, launch mechanics and secondary projectiles.
- `replay.js`: recording, interpolation, timeline, highlights and IndexedDB.
- `castles.js`, `data.js`, `secrets.js`: layouts, materials, equipment and secrets.
- `builder.js`: blueprint editing and persistence.
- `scoring.js`, `save.js`: medals, economy and browser-local progress.
- `audio.js`: synthesized weapon/impact sounds and optional music.
- `main.js`: game flow, modes, UI and input.
- `controls.js`: SVG siege dials, pointer capture, keyboard input and accessibility.

Run `npm test` for simulation/replay/scoring checks. Run `python -m http.server 8080` in this directory for local play. Runtime paths are relative and compatible with `/ObsidianMango/castle-smasher/` on GitHub Pages. Third-party licenses are in `vendor/`.

## Scoop release and siege controls

Catapults and trebuchets now carry a noncolliding projectile in the moving scoop for the wind-up. At release it becomes a dynamic Rapier body at the scoop position, with the chosen launch direction and power. Aiming previews start at this same release position. The wind-up runs on simulation time, pauses with gameplay, and is captured in recorded projectile transforms.

Use **Castle** to leave drag aiming and orbit the fortress through 360 degrees. Manual orbit stops the follow camera from taking over.

All twelve castles and sixteen weapons are available in the normal menus. Campaign objectives, ammunition, results and scoring work normally; there is no developer mode.

The playing screen uses custom SVG siege instruments: drag the **Move Around** wheel to place the weapon around the castle, the **Bearing** compass to aim horizontally, and the **Elevation** cannon gauge to aim up or down. Drag the vertical **Power** lever and press the red **Fire** seal to launch. The dials support arrow keys as well as mouse/touch input.

**Range / Height** expands optional live distance and height controls. The guide and launcher update immediately; movement is paused briefly while a projectile remains attached to the scoop. There is no jet platform.


## Workshop and first-person exploration

**Sibling Towers** replaces Twin Towers with two slender, square, 42-unit towers: close vertical façade ribs, dark glazing, horizontal service bands, open columned lobbies, flat roofs and a single antenna. Each façade panel and its attached detailing follow the same recorded/destructible entity. The design takes architectural cues from the original towers, rather than replicating their real engineering or scale. References: [Skyscraper Museum](https://www.skyscraper.org/exhibitions/giants-twin-towers-and-the-twentieth-century/) and [9/11 Memorial & Museum](https://www.911memorial.org/learn/resources/world-trade-center-history).

The Castle Workshop now shares geometry with the siege simulation. Towers are hollow, gates are open doorways, and fifteen low stair treads climb onto the next storey's floor. Choose a piece, material, and storey; tap to place or use Select / move. The inspector edits X, Z and base height. Rotate, duplicate, delete, undo/redo, three starting templates and browser-local named saves are available. A 180-piece / 2,400-collider budget bounds custom builds. **SIEGE IT** keeps the blueprint available via **Edit build**; returning to editing restores the intact blueprint rather than converting rubble back into components.

**Walk** is available in normal gameplay and after a shot. Choose Sideline, Courtyard, Upper floor or Rooftop. Elevated spawns use clear, existing surfaces and fall back when no suitable deck remains. WASD/arrows or the touch joystick walk; drag the scene to look, Space/Jump jumps, and Shift runs. Xbox sticks move/look, A jumps and RT fires. Aim your siege first, then use **FIRE SHOT** from your lookout to watch it. Exit Walk restores the orbit camera and aiming console. Result screens also offer ruin exploration.

Walking uses a Rapier kinematic capsule, collision queries, autostepping and gravity; removing a floor makes the spectator fall. The spectator's sensor body cannot push debris or intercept projectiles. It stays outside the bounded replay entity list. Replay entry exits walking and continues to restore the exact recorded destruction independently of live physics. Scenery outside the castle platform remains decorative. The browser QA environment uses the Canvas compatibility renderer; on-device WebGL performance has not been measured.
