# Frog Nom 3 verification

Tested 2026-09-06.

## Automated gameplay

`npm test`: **28 passing tests**. Coverage includes campaign configuration; corrupt-save normalization; locked-stage enforcement; portrait-coordinate aiming; tongue cooldown; misses; hazard damage and invulnerability; death; hop timing; pause/resume; flower attraction, consumption, expiration, and recharge; all five new enemy behaviors; all three boss guard/attack/open phases; upgrade spending and replay anti-farming; retry state reset; save round-trip; victory retention; and bounded entities.

Three seeded end-to-end **engine simulations** each clear all 15 stages using the public shoot/hop/start gameplay methods and regular time steps, with no forced kills or free unlocks during the campaign. These establish reachability, not human difficulty calibration.

## Browser checks

Tested in the available Chromium cloud browser. The portrait harness embeds the unmodified game in exact CSS viewports; this is responsive layout testing, not physical-iPhone or Safari/WebKit emulation.

| CSS viewport | Result |
| --- | --- |
| Desktop, approximately 1348 × 926 | Title, playable arena, HUD, powers and scrolling full map visually inspected. |
| Desktop, 1280 × 720 | No horizontal overflow; powers remain inside viewport. |
| iPhone portrait, 390 × 844 | No horizontal overflow; powers remain inside viewport. Start, aim, map and guide exercised. |
| iPhone Pro Max portrait, 430 × 932 | No horizontal overflow; powers remain inside viewport. |
| iPhone SE portrait, 375 × 667 | No horizontal overflow; powers remain inside viewport. |
| Compact portrait, 320 × 568 | No horizontal overflow; powers remain inside viewport; pause/restart controls visually inspected. |

Interaction checks: desktop and portrait canvas clicks increment snack progress; Bloom enables BOOM; BOOM consumes its flower and disables; pause and resume work; locked map nodes remain disabled; the mobile map opens and closes; the field guide opens and closes; restart confirmation resets pond progress; mute preference survives reload.

Application JavaScript errors were not observed in the captured browser logs. Browser-extension metadata errors were excluded from application findings.

## Defects found and fixed during verification

- Removed an invalid CSS import that blocked the production build.
- Reduced arena height to keep desktop controls and footer visible.
- Reduced portrait arena height to remove vertical overflow and scrollbar-induced width loss.
- Simplified portrait power-button layout to prevent label wrapping.
- Returned focus to the canvas after using powers so keyboard hop remains available.
- Removed duplicated Bloom sound playback.
- Made overlays scrollable for short screens.

## Remaining validation boundary

Physical iPhone Safari, actual touch hardware, Safari audio behavior, safe-area insets on a real device, and long-session performance/battery use were not available for testing in this environment. The code includes Pointer Events, `dvh`, safe-area padding, device-pixel-ratio capping, and Web Audio activation from user input. A real-device pass is still recommended before public release. The full campaign was simulated rather than manually played through in the browser.
