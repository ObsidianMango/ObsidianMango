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

- 16 parking lots; lots 9–16 unlock after completing all original eight.
- Steering wheel, pedals, D/R selection, camera orbit and camera pinch zoom.
- Full-footprint parking checks, including wider Maybach and Wienermobile bodywork.
- Rigid-body damage, complete break-apart wrecks and two-angle recorded crash playback.
- Independent saves, standalone web-app metadata, and page double-tap zoom suppression that preserves rapid button activation.

## Validation

Desktop and touch-viewport Chromium checks cover all six selections, fallback from the removed Flame Coupe, forward driving, parking completion, real obstacle impacts, full detachment, both replay angles and restoration. All passed with no JavaScript errors. The Jalopy's brake forces remain zero. Model previews are inspected from front and rear; mobile rapid taps and portrait/landscape layouts are checked in emulation. Physical iOS Home Screen behavior remains device-dependent.
