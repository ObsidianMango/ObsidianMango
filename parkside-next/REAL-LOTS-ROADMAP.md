# Parkside Streets — Next Edition

## Status
Independent copy of the original `parkside-mango-online/` version as of October 11, 2026.
All current 24 original challenges, Secret City, 12 vehicles, interactive systems, online multiplayer, controller support, and destruction mechanics are preserved.
The source version is unchanged. This copy has only been renamed and its app manifest updated.
**Real-world parking lots have not been added yet.** They will be built one location at a time, without replacing existing levels.

## Real-World Lots — Development plan
1. **Make first real lot**: one known car park using a satellite overhead view, on-site photos, and (when possible) one measured reference length.
2. **Layout before appearance**: map accurate perimeter, road access, lanes, islands, curb heights, lot stalls, slopes, and major building silhouettes in world coordinates.
3. **Playable pass**: define spawn, three route gates (if suitable), target bay, traffic flow, pedestrian paths, and a physical no-drive boundary. Test parking, reversing, collisions, crash replays, and iPhone/Xbox controls.
4. **Visual pass**: improve sign placement, road markings, weathered asphalt, realistic sidewalk geometry, foliage, streetlights, rooflines, storefront windows, and believable stationary vehicles. Use repeated/instanced geometry and cached static colliders.
5. **Stress test**: benchmark iPhone portrait + iPad + desktop. Preserve tire transforms, camera occlusion, replay debris on every car, and multiplayer remote vehicle detail.
6. **Ship one location** and only then begin the next; add a "Real-world locations" filter/category rather than deleting or overwriting the 24 fantasy lots.

## Photo/data checklist
- Bird's-eye screenshot or marked aerial image showing driveways and property boundary
- 4–10 ground-level photos from multiple corners showing curbs, storefronts, and signage
- At least one known distance (width of a stall, standard door, measured stripe spacing)
- Which bay should be the parking objective and which driveway players should enter from
- Notable changes: traffic, parked cars, lighting/time-of-day, obstacles, and building access
- Avoid photographing private people or license plates when not necessary

## Architecture notes
Current levels are defined in `parking-lots.js`. Keep those 24 challenges intact and implement separate data definitions and builders for the future real-world level category. Reuse the same vehicle models, game mechanics, damage physics, scoring, and controller scheme. Keep realistic level visual art separate from physics meshes for performance.

## Deployment
This page is the new copy at:
https://obsidianmango.github.io/ObsidianMango/parkside-next/
The original remains:
https://obsidianmango.github.io/ObsidianMango/parkside-mango-online/

## Caveat
Some game progress is stored under site-wide localStorage keys. Since GitHub Pages serves both folders on the same origin, the two editions may share saved progress until storage namespaces are separated intentionally. Online two-device multiplayer must be tested on actual devices.
