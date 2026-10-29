# GNATFALL — Burn Notice

A dependency-free, first-person 3D ASCII pest hunt. One late-night kitchen, five infestations, and an overheating flamethrower.

**Play:** https://obsidianmango.github.io/ObsidianMango/gnatfall/

Clear gnats, fruit flies, mosquitoes, houseflies, then wasps. Track remaining pests on the radar, get within flame range, and hold fire to burn them. A scan reveals the nearest pest's direction and temporarily marks visible targets. Nearby pests drain composure. Release fire to cool the burner; overheating forces a cooldown. Each cleared wave awards a composure bonus and offers a longer flame, improved cooling, or more damage. Best scores save on the device.

## Controls

- Desktop: WASD move, mouse or arrow keys look, hold left click or Space to burn, Q scan, Escape/P pause. Shift moves faster.
- Phone/tablet: left joystick moves, swipe the scene to look, hold BURN to fire. SCAN and pause buttons are always available.
- Gamepad: left stick moves, right stick looks, right trigger or A fires. Start the game through the on-screen button.

Tap SOUND ON/OFF to mute. HD/LO changes ASCII detail on desktop. Turning away from the page pauses play.

## Run

Serve this directory with any static web server or GitHub Pages. No build, external libraries, network requests, or CDN needed. `game.js` uses a perspective ray caster with a 3D depth buffer, shared solid geometry for rendering/collision/flame occlusion, animated ASCII pests, 3D flame and ash particles, procedural audio, and responsive controls. The scene and glyphs are generated in code.

Validation: JavaScript syntax check; browser start/render/fire checks; simulated desktop and mobile game-state checks for movement, solid collisions, flame damage, score, cooling, pause/resume, five-wave progression, upgrades, victory, defeat, and restart. Touch input is implemented; physical iPhone verification is still useful.
