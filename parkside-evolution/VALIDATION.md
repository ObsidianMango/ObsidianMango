# Validation and limits

## Automated verification

Run `npm run prepublish:check`. The suite covers actual Cannon collisions, support collapse, barrel chains, physical/visual debris budgets, wheel spawning, replay/recovery, repeated level transitions, all 27 catalog IDs, parking, controller event simulation, menus, casino/scratch-off flows, save migration and real local WebRTC transport. LinkeDOM substitutes browser layout and rendering; these are not visual or hardware tests.

## Reproducible headless profile

`node tools/profile.mjs` measures CPU stepping and scene graph/submission counts. The baseline uses the unchanged Parkside Next runtime with the same test harness. Raw values are in `performance-sample.json`.

| Scene | Traversed objects before → after | Mesh submissions before → after | CPU step median before → after | CPU step p95 before → after |
| --- | ---: | ---: | ---: | ---: |
| Lot 1 | 2,541 → 1,146 | 1,810 → 681 | 0.509 → 0.407 ms | 0.953 → 0.589 ms |
| Riverview Hospital | 22,169 → 3,057 | 2,759 → 2,759 | 8.901 → 9.052 ms | 11.961 → 11.689 ms |
| Secret City after seven blasts | 5,411 → 2,485 | 559 → 559 | 10.186 → 11.409 ms | 17.451 → 18.282 ms |

Hospital triangles remained 933,566 and Secret City triangles remained 837,966 in these views. Scene traversal is reduced without reducing those visible mesh details. Original active body counts remain 206 / 1,220 / 1,070 in the three scenes.

Physics CPU timing is mixed: the Secret City sample is slower. These single samples are sensitive to JIT, garbage collection and machine load; no sustained CPU-speedup claim is made. The measurable improvement is reduced scene traversal, plus fewer submissions in regular lots. No real-device FPS, GPU-time, thermal or memory measurements were performed.

## Outstanding limits

- No physical iPhone, iPad, Xbox controller or desktop GPU validation in this environment. The 30–60 FPS target remains unverified.
- Destruction remains local in multiplayer; progressive partial vehicle damage and persistent world replication require separate work.
- Camera, input and state coordination still partly reside in `drive.js`; extraction is incomplete.
- Inactive authored level resources are cached; active scene/physics membership is cleaned, but a total GPU cache eviction policy is not implemented.
- Extreme-speed continuous collision detection is not a solved universal guarantee. Existing ramp and ground-collision regressions pass, subject to the final suite report.
- Vendor Three.js deprecation and Node module auto-detection warnings are retained; no vendor upgrade was attempted.
