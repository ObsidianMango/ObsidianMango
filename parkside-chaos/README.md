# Parkside Chaos

This is a separate sequel build. The original `roadster-explorer` folder is intentionally untouched.

## Features
- Seven cars: Roadster, Santa Fe, Jalopy, Wienermobile, a photo-inspired blue/white Flame Coupe, and a 1930s Maybach Zeppelin V12-inspired limousine, and the photo-inspired Chevy Nova.
- The Jalopy has no working foot brake or handbrake. Coast or select the opposite gear and use GAS to scrub speed.
- 16 parking levels. Lots 9–16 unlock only after every original lot 1–8 has been completed at least once.
- Independent save keys so progress here does not overwrite Parkside progress.
- Installable standalone web-app metadata.
- Double-tap/page zoom suppression during gameplay while retaining the game's own camera pinch-to-zoom gesture.
- Breakaway crash physics and two-angle replay system on all cars.

Arcade physics only; not a real vehicle simulator.

## Heritage garage update
- Flame Coupe: boxy drag-car proportions inspired by the supplied model-car photo, teal-blue body, white flame graphics, hood scoop, chrome bumpers/grille, staggered drag stance, and breakaway body panels.
- Maybach Zeppelin V12: long-wheelbase 1930s luxury shape with a tall vertical radiator grille, sweeping external fenders, running boards, wire-style wheels, side spares, wood/leather cabin details, long divided hood, and a visual twin-bank V12.
- Both use their own mass, wheelbase, tire size, collision footprint, breakaway assemblies, and crash replays.

## Showpiece model rebuild
- Flame Coupe was rebuilt from the supplied photo around solid lofted body panels: full lower body, broad hood and trunk, greenhouse/roof, side doors and quarter panels, proper grille/bumpers, big hood scoop, skinny front tires and wide drag rears. The white flames are now canvas decal surfaces over the blue body instead of tube geometry.
- Wienermobile was rebuilt as an integrated vehicle silhouette: cream/red lower car and cab, continuous split hot-dog sausage, smooth left/right bun shells with inner bread, mustard ribbon, tucked wheels, windshield/doors, lighting, grille, bumpers, engine and roof sign.
- Both preserve named wheel, engine, chassis and body assemblies for suspension, damage, full break-apart crashes and recorded replays.


## Nova garage update
- Separate Chevy Nova garage choice with dark teal-blue paint, continuous cream side flames, cream/blue flame hood, raised intake scoop, chrome trim and round headlights matching the supplied reference scheme. This is a stylized procedural model, not an exact scanned replica.
- Fictional 1,200 HP arcade specification: 9,500 N engine force per driven rear wheel, 1,270 kg chassis and a 27 m/s forward speed cap. Tap the gas for parking; holding it gives an aggressive launch. Brakes and reverse remain functional.
- 31 breakaway assemblies, including all four wheels, scoop, hood, doors, grille and engine, participate in recorded two-angle crash replays.
- Rapid second taps still activate buttons while native double-tap zoom is blocked; held pedals continue using independent pointer events.

Validation: desktop Chromium and mobile Chromium emulation verified Nova acceleration/braking/reverse, full parking completion, an actual obstacle collision, all 31 pieces detaching, both replay shots and restoration; seven garage choices; eight bonus lots locked/unlocked by save progress; zero brake force on the Jalopy; rapid taps and mobile control layouts. Physical iOS/Home Screen testing remains device-dependent.
