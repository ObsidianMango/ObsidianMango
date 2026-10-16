# Parkside Evolution

A separate edition of Parkside Next, derived from the original game source. Play at https://obsidianmango.github.io/ObsidianMango/parkside-evolution/ . The original `/parkside-next/` is unchanged.

Includes 26 parking levels (24 original challenges, Marine Park, Riverview Hospital) plus Secret City. The detailed fleet, Gold unlocks, upgrades, interiors, scratch-offs, casino games, demolition contracts, pedestrians, Hulk actions, weapons, webs and peer-to-peer multiplayer are retained.

## This edition

- Fixed-step scheduling, wheel visibility/spin, panel damage and runtime measurement now have separate modules.
- Distant intact traffic reuses full authored fleet batches; hidden original hierarchies leave the active scene graph. Geometry is compiled once per model and reused across visited lots. Nearby and damaged cars retain their individual meshes.
- Reused destruction scratch collections and cached vehicle interpolation nodes reduce per-step allocations. Physical rubble and visual fragmentation retain their existing budgets.
- Gates sweep the actual physics-step path, including reverse parking, so fast crossings are not missed between samples.
- Removed the forced Gold-car velocity restoration after collisions. Detached vehicle parts collide with vehicles and physical rubble after their initial separation grace period.
- Remote motion blends between packets and snaps on teleport, mode/vehicle changes, reappearance and reconnect. Release and level-catalog mismatches are rejected.
- Weapon selection round-trips consistently through saves. Existing progress is copied on first use into an independent edition namespace.
- Modernized outdated level/fixture assertions; added wheel, replay, level-transition, storage, scheduling, gate and remote-motion regressions.

## Run and validate

Use Node 24. From this directory:

```sh
npm ci
npm test
npm run build
npm run validate
```

`npm run prepublish:check` runs all three in order. Tests use LinkeDOM for browser APIs and real Cannon physics; network tests use local WebRTC ICE/DTLS/SCTP connections. They do not measure mobile GPU performance. Reports are written to `test-results/automated.json`.

Serve the repository over HTTP to play locally. On `localhost` the existing `window.roadster.test` integration hooks are enabled; `window.roadster.getState()` exposes read-only timings, simulation counters, renderer counts and pool sizes.

## Release integrity

`tools/build-release.mjs` creates a content-addressed `releases/<hash>/` directory containing the complete runtime graph, CSS, vendor libraries, manifest and build identity. The root HTML points only to that release. Keep previous release directories so cached HTML still loads a compatible set of modules. `tools/validate-release.mjs` verifies every file hash and local import. `drive.html` redirects to the same launcher.

## Saved progress

`progress-storage.js` uses the prefix `parkside-evolution:v1:`. The first read of an absent edition key copies the corresponding legacy value. Later writes affect Evolution only. Original parking records, Gold unlocks, upgrades, economy and demolition progress remain untouched. Clear neither edition's storage as part of publishing. This is a one-time per-key copy, not ongoing cross-edition synchronization.

## Module responsibilities

| Area | Modules |
| --- | --- |
| Scheduling and measurements | `frame-loop.js`, `simulation-clock.js`, `runtime-metrics.js` |
| Vehicle visuals and handling | `vehicle-wheels.js`, `wheel-spin.js`, `vehicle-motion.js`, `vehicle-damage.js`, `bike-dynamics.js` |
| Level catalog and authored layouts | `level-catalog.js`, `parking-lots.js`, `real-marine-park.js`, `real-riverview.js`, `secret-city.js` |
| Physics/destruction | `city-broadphase.js`, `contact-tracking.js`, `crush-contact.js`, `destructible-environment.js`, `contents-debris.js`, `parked-traffic.js` |
| Scene batching | `traffic-lod.js`, `city-shells.js`, `secret-detail.js` |
| Parking and progression | `gate-crossing.js`, `run-scoring.js`, `destruction-loop.js`, `demolition-contracts.js` |
| Multiplayer | `multiplayer.js`, `multiplayer-visuals.js`, `duel-rules.js`, `local-peer.js`, `room-peer.js` |
| Save and release boundaries | `progress-storage.js`, `release.js`, `tools/build-release.mjs` |
| Integration, camera, input and game states | `drive.js`, with `xbox-controls.js` and UI modules |

See [ADDING-LEVELS.md](ADDING-LEVELS.md) for data-driven level creation and [ROADMAP.md](ROADMAP.md) for remaining work. See [VALIDATION.md](VALIDATION.md) for measured results and test limits.

## Cockpit seat and headrest clearance (October 2026)

`cockpit-seat.js` maintains persistent per-vehicle first-person eye offsets. **Adjust Seat** is visible while driving in first-person view, with Up, Down, Forward, Back, Reset and Done. Presets improve Santa Fe and New Yorker visibility; Nova, Impala and Monte Carlo defaults are unchanged. The Santa Fe/New Yorker driver's headrests are separate cosmetic geometry, visible from third-person and temporarily hidden only while seated in first person. All other models, destruction, wheels, and parking progress remain intact. The controls are responsive on small landscape screens. Tests: `cockpit-seat.mjs` and `cockpit-seat-integration.mjs`.

### Car-part handling and visual detail

On foot, approach detached car wreckage and use Interact (E / Xbox X / touch prompt) to pick it up. Use Fire (Space / RT / THROW) to toss it, or Interact again to drop it. Heavier pieces throw more slowly. Recently settled parked-car wreckage remains pickable within the existing 128-piece pool; resetting the level releases held pieces.

First-person hands and weapons use cached, merged detail meshes with recoil. Marine Park has repeating pavement materials and 107 instanced surface details in five batches, without extra physics bodies. Adaptive resolution can reach 1.25 device pixels per CSS pixel on mobile and 1.75 on desktop, lowering resolution under sustained load.

Parked-car wrecks now release up to 24 recognizable assemblies, including wheels, doors, bumpers, hoods, and engines. Detached pieces render independently of the wreck, retain their original panel thickness, and use converted physics rotations so held/thrown parts remain visible. First-person carrying also keeps parts below eye level in Hulk mode.
