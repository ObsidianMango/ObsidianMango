# Country Run — Roadster Physics Demo

Play `drive.html`. The original component explorer remains at `index.html`.

The game reuses the original Roadster Atlas geometry, regrouped into 25 independently breakable assemblies.

## Driving

- Mobile: drag around the steering-wheel rim for proportional steering; it springs back on release. Hold GAS with your other thumb. BRAKE/REV stops the car, then reverses. Handbrake and slow motion have separate buttons.
- Desktop: W/Up for throttle, S/Down for brake/reverse, A/D or arrows for steering, Space for handbrake, Shift for slow motion, C for camera, R for recovery, P/Escape for pause.
- Country run: reach the four service/finish gates along the 2.4 km road before the four-minute timer expires. Service gates repair minor damage. Best finish time is stored locally.
- Crash playground: no timer; E or Pause → Explode car deliberately triggers a full wreck.

## Wrecks and instant replay

Low-speed scrapes damage the body and may shed cosmetic parts while keeping the vehicle drivable. Major impacts scatter all 25 assemblies, including the chassis, body, wheels, engine, cabin and roof. Debris tumbles, collides and settles under gravity. Fire, smoke, sparks and a ground shockwave accompany the impact; enabled sound adds a bass explosion.

A bounded rolling recorder stores actual world transforms before and after the collision. Playback interpolates those recorded transforms without advancing physics. It shows a slow-motion roadside angle followed by an overhead orbit. Skip, Replay again and Back on the road are available. Continuing restores the car and preserves course progress, with a ten-second penalty in Country run.

## Technical scope

Cannon ES rigid-body chassis, raycast suspension, tire traction, braking and dynamic obstacles. This is stylized breakaway-assembly destruction, not continuous soft-body crumpling or engineering-accurate behavior. The source vehicle is illustrative.

Self-hosted dependencies: Three.js (THREE-LICENSE.txt) and cannon-es 0.20.0 (CANNON-LICENSE.txt). No build step, account, analytics or remote assets. Serve over HTTP; file:// module loading is not supported reliably.

Validated in Chromium desktop/mobile emulation: proportional wheel direction and recentering, simultaneous wheel/throttle touch input, collision-triggered 25-part wreck, recorded replay with both angles, frozen simulation during playback, replay/skip, and recovery to a complete drivable car. Physical iPhone Safari testing is still recommended.
