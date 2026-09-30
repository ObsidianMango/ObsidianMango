# Parkside — Roadster Parking

Play `drive.html`. The driving game has been rebuilt as eight finite parking challenges using the original roadster model, suspension, steering wheel and crash replay system.

## Lots

1. Market Square — head-in parking around a central island.
2. Sunset Diner — diagonal parking bays.
3. Office Hours — reverse into a row of occupied spaces.
4. Old Town — parallel parking between two cars.
5. Garden Centre — negotiate planter islands and cones.
6. The Courtyard — turn around the central fountain.
7. Loading Dock — reverse into a bay beyond a narrow approach.
8. Harbour Finish — precision reversing through staggered barriers.

All lots are selectable. Complete one to advance, retry for a better rating, or return to the lot selector. Best star rating and time per lot are stored locally. Three stars require no bumps and completion within the displayed post-run target time; slower clean runs or up to two bumps earn two stars. More bumps earn one star. There is no endless-road mode or forced time limit.

## Parking rules

The complete 2.54 × 4.8 m car footprint must fit inside the designated green bay, face its arrow within ten degrees, remain upright, and stop below 0.22 m/s for 1.35 seconds. Another empty bay does not count. Reverse challenges require meaningful backward movement near the target; gentle forward corrections are allowed.

## Controls

- Touch: drag the steering-wheel rim, hold GAS, tap D/R to switch direction, and use BRAKE to stop. Handbrake and recovery remain available.
- Keyboard: W/Up drives forward, S/Down brakes into reverse, A/D or arrows steer, Space is the handbrake, R recovers, X changes the selected touch gear, P/Escape pauses.
- Camera: drag the scene to orbit freely; pinch or scroll to zoom. Follow, Back view and Top provide quick viewpoints. Manual orbit persists while driving and reversing. Touch camera gestures are separate from the wheel and pedal pointers.
- Curved reversing guides appear behind the car in reverse.

Recover resets to the entrance with a ten-second and one-bump penalty. A major impact retains the full 25-assembly wreck and recorded two-angle replay; Retry this lot starts a fresh attempt.

## Implementation

Self-hosted Three.js and Cannon ES, no build step. `parking-lots.js` defines the environments and parking validation; `drive.js` handles the vehicle, campaign, controls and orbit camera; `crash-replay.js` records and plays crash transforms. Existing license files apply. Serve over HTTP, not file://.

Validation uses Chromium desktop/mobile emulation, including all eight target bays, mandatory reverse approach, camera gestures and presets, and level switching. It does not substitute for physical iPhone Safari testing.
