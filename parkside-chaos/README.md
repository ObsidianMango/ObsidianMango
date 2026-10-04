# Parkside Chaos

Separate parking-game build. The original `roadster-explorer` game is unchanged.

## Garage

Six vehicles: Roadster, Santa Fe, Jalopy, Wienermobile, Maybach Zeppelin V12, and Chevy Nova. The older Flame Coupe is removed from the garage; an old saved Flame Coupe selection safely falls back to the Roadster.

The original Roadster retains its source geometry. The other five vehicles use `vehicle-detail-kit.js` and `detailed-vehicles.js`:

- Solid shaped panels, transparent windows, frames, wipers, handles, mirrors, grilles, lens details, and plates.
- Modeled tire shoulders and tread, rims, lug nuts, brake discs, calipers and valve stems. The Maybach has wire wheels and side spares; the Wienermobile has whitewalls; the Jalopy has steel wheels.
- Seats with headrests and stitching, dashboards, instrument faces and needles, steering wheels, gear levers, pedals and seat belts.
- Engines, ignition wires, exhaust headers, radiators, axles, differentials, coil springs, chassis rails and exhaust systems visible when bodywork breaks away.
- Santa Fe: tapered crossover body, swept lamp clusters, roof rails, sunroof, four doors and rear hatch.
- Jalopy: worn paint texture, mismatched panels, bolted rust repairs, cracked windshield and broken lamp. Both brakes remain disabled.
- Wienermobile: smooth bun and sausage surfaces, mustard, glazed cab, service vents, steps and roof sign.
- Maybach: curved full-width fenders, divided hood and louvers, leather/wood interior, period lights, luggage and radiator ornament.
- Nova: blue/cream flame scheme, hood scoop, chrome detail, interior and aggressive 1,200 HP arcade tuning.

Geometry is merged by material within each breakaway assembly, preserving texture UVs. The cars are stylized procedural models, not scanned replicas. The HP badge describes fictional arcade tuning, not a calibrated engine simulation.

## Features

- 24 parking lots in three chapters. Lots 9–16 unlock after completing 1–8; lots 17–24 unlock after completing 1–16. Existing progress is preserved.
- Steering wheel, pedals, D/R selection, camera orbit and camera pinch zoom.
- Full-footprint parking checks, including wider Maybach and Wienermobile bodywork.
- Rigid-body damage, complete break-apart wrecks and two-angle recorded crash playback.
- Independent saves, standalone web-app metadata, and page double-tap zoom suppression that preserves rapid button activation.

## Validation

Desktop and touch-viewport Chromium checks cover all six selections, fallback from the removed Flame Coupe, forward driving, parking completion, real obstacle impacts, full detachment, both replay angles and restoration. All passed with no JavaScript errors. The Jalopy's brake forces remain zero. Model previews are inspected from front and rear; mobile rapid taps and portrait/landscape layouts are checked in emulation. Physical iOS Home Screen behavior remains device-dependent.

## 24-lot expansion

New sites: Station Approach, Orchard Farm, Hospital Court, Airport Shuttle, Quarry Yard, Marina Service, Mountain Lodge, and The Final Test. Each has a distinct layout and scenery, with head-in, angled, parallel, and reverse maneuvers.

The full campaign audit checks collision-free spawn/target poses and a forward/reverse kinematic route using a conservative 2.68 m × 5.90 m footprint and 4.5 m minimum turning radius. All 24 lots pass. The final test's upper court and staggered walls were widened after the first audit failed. This is an automated route-clearance check, not a claim of manual playtesting every route.

All 144 vehicle/lot combinations pass physical parking-completion tests, including a short reverse approach where required. Fresh, eight-complete, and sixteen-complete saves unlock exactly the correct chapters. Completing a chapter out of order opens its new chapter, and the next-lot button advances correctly rather than looping to lot 9.

Other polish: removed duplicate white lines under highlighted target bays, rotated and positioned bay labels correctly, added actual collisions to seaside kiosks, replaced parked cars' square wheels with round tires/rims, and updated the menu and app manifest to 24 levels.
