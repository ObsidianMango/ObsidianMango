# Parkside Chaos — Wheel Physics Edition

This is a separate copy of `parkside-chaos`; the original page is untouched.

## Wheel sync fix
- Tire rotation follows each wheel's actual longitudinal motion, so coasting tires keep spinning even when the accelerator is released.
- The visual wheel angle is decoupled from Cannon's brake-lock shortcut that previously froze the tires whenever brake force exceeded engine force.
- Hard braking shows longitudinal tire slip rather than an instant visual freeze; the rear wheels slip more under the handbrake.
- Driven wheels can over-spin when the physics reports sliding under heavy throttle.
- Airborne wheels preserve/free-spin, while detached wheels continue to use debris-body physics.
- The original vehicle dynamics, parking rules, 24 levels, damage system, and save progress are unchanged.

Copied from `parkside-chaos` at commit `c4aeace4b5ce3aca88b12f1cec306a23e26239d9`.

## October 2026 reference-model and rolling update
- New dedicated `wienermobile-model.js`: smooth profiled yellow coach body, orange sausage cabin, raised rear, wrapped yellow brand band and Oscar Mayer badges.
- Curved windshield and side glazing are actual openings in the body surface. Includes wipers, mirrors, vents, steps, detailed cabin, drivetrain and smaller ventilated silver wheels. All 45 assemblies participate in the crash replay and reset.
- Wheel angles advance on fixed physics steps, including coasting and reverse. Rendering preserves Cannon's contact flags and uses the correct axle rotation direction. Steering and mass-scaled braking are accounted for.
- Slower cars retain uncapped forward speed and their existing engine-force settings. The 24 lots, chapter unlocks and save key remain unchanged.
