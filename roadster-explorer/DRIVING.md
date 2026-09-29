# Country Run — Roadster Physics Demo

Play `drive.html`. The original component explorer remains at `index.html`.

The drivable model is extracted from the original Roadster Atlas procedural geometry and regrouped into independent assemblies. No replacement vehicle asset is used.

## Modes and controls

- Country run: drive 2.4 km through all service gates before the four-minute timer expires. Service gates repair the car. Finish times are saved locally.
- Crash playground: no timer or permanent game over. Pause → Explode car (or E) launches the assemblies; Recover repairs and resets the car.
- W / Up: throttle; S / Down: brake, then reverse.
- A/D or Left/Right: steering; Space: handbrake.
- Shift: slow motion; C: cycle chase/bonnet/overhead cameras.
- R: recover upright on the road (+10 seconds in Country run).
- P / Escape: pause. Touch buttons support simultaneous steering and throttle.

## Simulation scope

Cannon ES rigid-body chassis, raycast-wheel suspension, tire traction, braking, dynamic obstacles, gravity, angular momentum and detached-part collision bodies. Damage depends on collision speed and contact location. Losing wheels changes suspension and grip; losing the engine cuts power. Severe damage ends a timed run.

This is a playable rigid-body destruction demo, not a soft-body deformation model or an engineering-accurate reconstruction. Parts separate as assemblies; panels do not continuously crumple. The source model itself is illustrative.

Dependencies are self-hosted: Three.js (existing THREE-LICENSE.txt) and cannon-es 0.20.0 (CANNON-LICENSE.txt). No build step, account, analytics or remote game assets. Serve the folder over HTTP; JavaScript modules do not support file:// loading reliably.
