# MangoWarz Classic

MangoWarz Classic is a mobile-first, static browser strategy game built around a 30-day travel, trading, finance, street-event, and police-encounter loop. It is an original implementation with original writing, synthesized sound, and a project-specific visual system.

Public path: `https://obsidianmango.github.io/ObsidianMango/mangowarz-classic/`

## Run locally

From the repository root:

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000/mangowarz-classic/`. ES modules and the service worker require HTTP(S); opening `index.html` directly as a `file:` URL is not supported.

No build step, API key, backend, CDN, runtime fetch, analytics, or tracking is required. Node is used only for tests and the reproducible asset pipeline.

## Rules

- Begin on Day 1 in the Bronx with $2,000 cash, $5,500 debt, 100 health, and 100 coat spaces.
- Buy available products, travel to a different neighborhood, and sell when the price is favorable.
- Every completed trip advances one day, adds 10% debt interest, and adds 5% bank interest using floored integer arithmetic.
- The Bronx loan shark accepts repayments but issues no new standard Classic loans. Manhattan provides bank deposits and withdrawals.
- Random events use the run’s seeded PRNG. A refresh resumes the exact market, RNG position, and pending encounter.
- Day 30 remains fully playable. The player explicitly finishes after final trading and services.
- Classic score is exactly `cash + bank - debt`. Inventory is not automatically liquidated.

The optional six-product variant is chosen only when starting a run. The default Classic game uses all 12 products.

## Modes

Classic Mode and Mango Extended Mode have separate new-game selections, save keys, personal bests, explanations, and balance data. Extended Mode keeps the 30-day core but adds disclosed vehicles, properties, companions, resale factors, capacity bonuses, escape bonuses, and the fictional Wife/divorce-risk satire. Extended portfolio resale value is added only to the separate Extended final score.

## Controls

- Touch/mouse: all controls use labeled targets at least about 44 CSS pixels tall.
- Keyboard: tab through every control; `T` opens Travel, `S` Services, `I` Inventory, and `H` History when no dialog is open.
- `Escape` closes dismissible sheets. Mandatory encounters intentionally remain open until resolved.
- Dialog focus is trapped while open and returned to the trigger on close.

## Save behavior

Versioned `localStorage` saves are written after transactions, travel, settings changes, and resolved events. Classic and Extended saves cannot cross-load. Invalid saves are rejected and quarantined. Resetting a run requires confirmation and removes only that mode’s active save; its separate personal best remains.

## Seeded debugging

Enter a seed on the title screen to reproduce a run. Leaving it blank creates a seed with `crypto.getRandomValues`. Runtime gameplay does not call `Math.random()`.

## Tests

With Node 20 or newer:

```bash
node --test tests/*.test.js
```

The suite covers RNG repeatability, ranges and event probabilities, all trading and finance limits, capacity, travel, encounters, combat, escape, health defeat, Day 30, scoring, save migration/recovery, pending-event persistence, mode separation, large Extended values, and 10,000 complete deterministic Classic simulations.

Asset QA uses Sharp:

```bash
npm install
npm run qa:assets
```

## Folder structure

- `index.html` — semantic app shell and PWA metadata
- `css/` — reset, tokens, responsive layout, components, motion, and accessibility
- `js/` — modular deterministic game engine, rendering, persistence, audio, and accessibility
- `assets/` — branding, characters, police, civilians, products, items, services, locations, encounters, effects, Extended art, and the manifest
- `tests/` — focused deterministic tests and the 10,000-run simulation
- `tools/` — reproducible SVG generation, raster export, and asset QA

## Asset pipeline and provenance

`tools/generate-assets.mjs` writes the deterministic original SVG pack and `assets/asset-manifest.json`. `tools/render-raster.mjs` exports optimized PWA PNG/WebP derivatives. The raster style anchor was generated specifically for this project with OpenAI image generation, then inspected and cropped into the representative player, patrol officer, product, and Bronx scene. The rest of the coordinated pack is original deterministic SVG work following that palette and silhouette guide.

Every manifest record includes a stable ID, category, path, format, dimensions, alt text, states, frame information, anchor, provenance, mode, fallback, and preload priority. Optional image failures fall back to `assets/ui/image-fallback.svg` without blocking play.

No external game code, protected artwork, music, screenshots, dialogue, logos, actor likenesses, or branded packaging were reused. There are no third-party license obligations.

## Accessibility

The interface uses semantic regions, logical headings, visible focus, text labels for icons, live announcements, color-independent labels, high-contrast status treatment, keyboard-operable trading/travel/banking/combat, modal focus management, safe-area padding, 200% zoom-friendly reflow, and both system and manual reduced-motion support.

## Intentional differences and limitations

- Writing, art, audio, character designs, and visual branding are original rather than copied from an older game.
- Market tips are clearly labeled as rumors, not guaranteed future prices.
- The clinic is available in every neighborhood for usability.
- Combat abstracts ammunition; weapons occupy capacity and deal the configured damage but do not model realistic ballistics.
- “Baretta” is retained as requested compatibility data; the real-world brand spelling is commonly different.
- Extended Mode is a separate portfolio layer on the completed Classic engine, not a second map or narrative campaign.
- Audio is synthesized through Web Audio, so no OGG/MP3 download is necessary; play remains unaffected if audio is unavailable.
- Offline installation requires one successful online load under HTTPS or localhost.

## License

See `LICENSE.md`. Code is MIT. Original assets are CC BY-NC-SA 4.0 unless their manifest provenance says otherwise.
