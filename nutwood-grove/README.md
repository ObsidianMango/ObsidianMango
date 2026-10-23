# Nutwood Grove 🐿️

A fluffy squirrel, a living woodland, and a few good things to get your paws on. Built with Three.js and Cannon-es, with locally bundled dependencies and no API keys or build step.

## Play

Walk, run, jump, climb any full-size tree, circle the trunk, and leap back to the ground. Grab, carry, throw and stash 42 acorns and walnuts in the hollow stump. Carry nuts in your mouth while climbing. Stashing 12 completes the first winter goal; you can keep collecting all 42. Your stash saves on this device.

The bounding run blends articulated hind legs, front-paw strides, body lean, hopping, head stabilization and a springy tail. Climbing has alternating paw grips and leg movements. The model includes 21,210 surface-aligned fur strands, tufted ears, a cream belly, whiskers, glossy eyes and individual claws.

The grove includes branching trees, bushes, ferns, grass, rocks, mushrooms, a fallen log, butterflies and airborne pollen. Spatially grouped instancing, automatic render scaling and a quality setting help smaller devices.

| Action | Keyboard | Touch | Standard gamepad |
| --- | --- | --- | --- |
| Move | WASD / arrows | Left thumb joystick | Left stick |
| Look | Drag | Swipe the woodland | Right stick |
| Run | Hold Shift | Hold Run | Left stick click |
| Jump / leap off tree | Space | Jump | A |
| Climb / let go | C near a tree | Climb tree / Let go | Y |
| Climb up or down | W / S or up / down | Joystick up / down | Left stick up / down |
| Circle a trunk | A / D or left / right | Joystick sideways | Left stick sideways |
| Grab / drop / stash | E | Grab button | X |
| Throw held nut | F | Throw | Right trigger |
| Inspect model | I / cube icon | Cube icon | Cube icon |

## Download the model

The model view includes **Download squirrel · .GLB**. The page generates `fluffy-squirrel.glb` directly from the detailed 3D geometry for Blender or another glTF 2.0 viewer. This is the posed mesh with materials and fur; the live procedural animation is implemented in `squirrel.js`.

## Run locally

Serve this directory over HTTP. For example: `python -m http.server 8000`, then open `http://localhost:8000/`. The game needs a WebGL 2 capable browser. Safari and Chrome on phones use the touch interface automatically.

## Verify changes

Install the package's development dependency, then run `npm test`. The verification script checks geometry, terrain and tree collisions, nut grabs and throws, jumping and landing, stash persistence, resets, tree ascent, circling, crown limits, paused grips, leaping, carrying while climbing, descending, and distinct walking and running gaits. It also regenerates `squirrel.glb`. The browser uses the same portable GLB writer for its model download.

The supplied cloud browser had WebGL disabled. Physics and animation checks passed directly, and software renders were used to inspect the squirrel's proportions and running pose; live GPU rendering and physical iPhone input remain unverified.

The original squirrel photograph is included as the model reference. Third-party licenses are in `vendor/`.
