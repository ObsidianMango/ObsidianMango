# Castle Smasher — Medieval Mayhem

A static, local-first Three.js / Rapier 3D castle destruction game. Entry point: `index.html`. All runtime libraries are vendored; no CDN or backend is required. Serve over HTTP rather than opening an ES module with `file://`.

## Play

Campaign has twelve castles, ammunition limits, objectives, coin unlocks and eight destruction medals. Sandbox unlocks all sixteen weapons and adds gravity, launch-power, explosion and strength settings. Castle Builder supports snapped placement, stacking, rotation, movement, duplication, deletion and local blueprint saves. Challenges include precision treasure hunting, limited ammunition, timed destruction and one-shot puzzles. Endless Siege scales fortress height and ammunition with each round.

Drag the world to orbit, pinch/scroll to zoom, and use the three aiming sliders. Space fires; arrows aim; +/− adjust power; R opens replay; C resets the camera. Optional standard-mapping gamepads support aim/orbit, fire, power and replay. On iOS, Share → Add to Home Screen uses the included icon and manifest.

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

Run `npm test` for simulation/replay/scoring checks. Run `python -m http.server 8080` in this directory for local play. Runtime paths are relative and compatible with `/ObsidianMango/castle-smasher/` on GitHub Pages. Third-party licenses are in `vendor/`.

## Scoop release and developer flight range

Catapults and trebuchets now carry a noncolliding projectile in the moving scoop for the wind-up. At release it becomes a dynamic Rapier body at the scoop position, with the chosen launch direction and power. Aiming previews start at this same release position. The wind-up runs on simulation time, pauses with gameplay, and is captured in recorded projectile transforms.

Use **Castle** to leave drag aiming and orbit the fortress through 360 degrees. Manual orbit stops the follow camera from taking over.

**Dev Mode** on the main menu opens all twelve castles and all sixteen weapons with unlimited ammunition. Its Flight Tools position the hovering launcher up to 60 metres high and 70 metres to either side/front/back, with full bearing rotation and downward elevation. Apply a new position during a ready-to-fire test or reset into a different level/weapon. Flight changes preserve the last replay, whose recorded launch platform is restored while watching. Dev tests do not award campaign coins, permanent medals or unlocks.
