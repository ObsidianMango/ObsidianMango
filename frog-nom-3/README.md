# Frog Nom 3 — The Wild Pond

A complete new chapter of Frog Nom, built after inspecting `frog.html` and `frog2.html` in ObsidianMango/ObsidianMango. The originals remain unchanged. The entry point is `frog-nom-3/index.html`; the root `frog3.html` redirects here.

## Play

Tap or click bugs to nom them. Avoid red-marked stingers. Guarded enemies cannot be eaten until their green OPEN window.

- **Bloom / B:** plant a flower to lure hazards and expose mantis/snail armor.
- **BOOM / X:** detonate flowers to clear nearby enemies and incoming spores.
- **Hop / Space:** dodge for 0.9 seconds; recharges in 2.2 seconds.
- **P / Escape:** pause or resume. The game pauses when the tab is hidden.
- **Arrow keys:** move the aim reticle. **Enter:** fire from the focused game canvas.

Five noms recharge one Bloom. Each first-time pond completion earns one perk point. Spend points on maximum hearts, tongue aim/cooldown, or Bloom capacity/blast radius. Perks apply when starting a pond. One to three stars reflect remaining hearts. Unlocked ponds, stars, perks, final victory, and sound preference save locally on this device; an unavailable-storage warning appears if saving fails.

## Campaign

Fifteen ponds span Lilywild, Lotus Grove, and Moonwater. The map shows every destination, boss, earned star, and locked stage. All previously reached stages are replayable.

Five new enemy types, in addition to the prior game's flies, mosquitoes, beetles, fireflies, dragonflies, bees, hornets, spiders, and toxic bugs:

| Enemy | Mechanic |
| --- | --- |
| Parry mantis | Crossed claws guard its two-hit body; attack in its open window or expose it with Bloom. |
| Dive wasp | Telegraphs a dive; nom it before the attack or time a hop. |
| Iron snail | Retracts into its armored shell; wait for it to emerge or use Bloom. |
| Spore shooter | Launches interceptable spores toward the frog. |
| Mimic fly | Alternates a spiky guarded disguise and an edible open form. |

Three redesigned bosses have guarded, warning, attack, and open phases. Each becomes faster below half health:

- **King of the Swarm, pond 5:** a diving attack that must be hopped.
- **Goliath Beetle, pond 10:** a timed slam followed by an exposed shell.
- **The Moon Moth, pond 15:** volleys of falling moon spores to intercept or dodge.

## Run and test

Requires Node 20.19+ or 22.12+ for Vite. Runtime gameplay uses browser APIs with no third-party JavaScript or remote assets.

```sh
npm ci
npm run dev
npm test
npm run build
```

The source can be served directly by GitHub Pages, with no build step. `npm run build` creates an equivalent standalone static release in `dist/` with relative asset paths. Serve via HTTP(S), not by double-clicking `index.html`: browsers restrict ES modules under `file://`.

`tests/portrait.html` is a developer-only responsive viewport harness served by the dev server. It is omitted from the production build. See `QA.md` for the precise verification scope.

## Source layout

- `engine.mjs`: deterministic, DOM-independent gameplay and validated save state.
- `game.js`: input, screen flows, audio, and animated Canvas rendering.
- `style.css`, `index.html`: responsive game UI and map.
- `pond.png`: original AI-generated pond illustration, created for this game.
- `tests/engine.test.mjs`: gameplay regression tests and seeded campaign simulations.

## Fixes carried forward from the earlier games

- Replace frame-count movement with elapsed-time movement and one animation loop.
- Normalize coordinates to the play area, so resizing preserves positions and accurate aim.
- Bound entities and keep edible prey available; hazards cannot permanently fill every spawn slot.
- Prevent rapid-tap damage exploits, repeated BOOM use, duplicate rewards, negative hearts, and score farming by retry.
- Replace delayed overlay callbacks with immediate state transitions so old timers cannot reopen a stale screen.
- Pause gameplay, attacks, and cooldowns in menus and background tabs.
- Validate corrupt saves and preserve final victory rather than resetting progression after completion.
- Use local artwork and system fonts; no remote font dependency.

Original reference files inspected on 2026-09-06: `frog.html` (blob `fdeb8321185a46ebfa7b8aaeddd15e2f8873469d`) and `frog2.html` (blob `83c62a1caf68b151d85eeba804673a1741c4fc6a`).
