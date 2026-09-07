# CRUMB. — Cookie Lab

[Play the 3D cookie simulator](https://obsidianmango.github.io/ObsidianMango/cookie-lab/)

30 cookie varieties, custom recipes, individual 3D toppings, sprinkle rain, falling crumbs, and real bites through dough, frosting, and fillings.

Drag to rotate. Pinch or scroll to zoom. Double-tap/double-click a spot to bite it, or use the Bite button. Keyboard: B bite, S sprinkles, R fresh cookie, + / - zoom.

Everything is served locally from this folder; there is no build step or CDN dependency. To run locally, serve the folder over HTTP (ES modules cannot load from file://):

```sh
python3 -m http.server 8000
```

## Source

- `app.js`: Three.js scene, camera, controls, and UI
- `cookie.js`: cookie materials, layers, and toppings
- `geometry.js`: procedural outlines, solid surfaces, and bite subtraction
- `physics.js`: individual loose topping and crumb simulation
- `recipes.js`: 30 presets and custom recipe definitions

Attached toppings are fixed in the dough. Released toppings and added sprinkles simulate gravity, bounce, drag, and cookie/plate/floor contact. Particle-to-particle collisions are not modeled.

Three.js r180 and polygon-clipping 0.15.7 are vendored under their MIT licenses in `vendor/`.
