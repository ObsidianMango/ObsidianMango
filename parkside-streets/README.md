# Parkside Streets

## Left-hand driving and the completion reward
- All eight interiors have the steering rim, spokes, column and pedals on the driver's left. The original Roadster's source coordinates are converted consistently with its +X-to−Z rotation.
- Finish all 24 lots with at least one star to unlock the Gold fleet selector. Existing completion saves qualify automatically; a saved gold selection is rejected if the challenges are incomplete.
- Eight golden variants reuse the full detailed geometry, wheel setup and dimensions. Metallic gold bodywork preserves rubber, glazing, lamps and interiors; the Nova retains a contrasting pale-gold flame pattern. Original materials are unchanged.
- Golden vehicles keep every assembly attached, cannot wreck, and take no damage, bump count, reset time penalty or unbanked-point loss. Gold impacts knock nearby scenery and parked cars aside; the E250's mechanical failures are disabled. Handling, checkpoint direction and full parking containment still apply.
- Gold parking uses separate vehicle score records and does not overwrite original challenge ratings/times. The fleet choice persists across reloads.
- Verified the actual final-lot unlock, incomplete/tampered-save lockout, left-side steering geometry, all eight gold vehicles' dimensions and parking, crash/detachment protection, free recovery, actual curb destruction, original materials/ratings, saved selection, mobile controls and ordinary-car wreck behavior.

## Larger staged routes and destructible surroundings
- All 24 lots now have a 96 × 96 parking surface, approximately twice the previous width and length. Bays and cars keep their dimensions. Three ordered directional checkpoints, alternating barriers, and close neighbours at the final bay make the route and parking maneuver more demanding; later chapters narrow the gates. Par times scale by 1.8.
- Buildings are hollow shells divided into facade and roof sections. Impacts deform their vertices; harder hits release physical rubble and collapse locally unsupported upper sections. Trees, signs, lights, curbs, islands and other solid scenery also break loose. Signs, foliage and other decorations follow their supports.
- Explosions propagate to scenery and parked cars. Deformable asphalt and soil use a shared Cannon heightfield: craters alter actual wheel and debris contacts. Up to eight craters per run and a bounded active rubble budget keep prolonged destruction manageable.
- Damage, collapse and craters appear in both recorded replay angles. Restart restores geometry, materials, static bodies, terrain, checkpoints and the crowd. Logical parking/checkpoint paint stays visible. Pedestrians remain on the outer promenade at z=52–58.
- Verification: all 192 vehicle/lot parking poses and checkpoint completion, 24 connected routes using 3.5m centre-path clearance, actual building collision deformation, physical crater wheel contact, explosion collapse, both replay angles, complete reset, pedestrian scoring and mobile double-tap prevention. Route connectivity checks are not a claim of manually driving every vehicle through every lot.

## Scored challenge runs
- Multipliers: Roadster/Santa Fe/Maybach ×1, Nova ×1.3, New Yorker ×1.4, Wienermobile ×1.6, E250 ×1.8, Jalopy ×2.2. Multipliers apply to hit, parking and failure-survival points.
- Pedestrian chains last five active-driving seconds, awarding base 100 / 150 / 200 / 250 (capped thereafter). Each knockdown counts once. Pausing freezes the combo clock.
- Parking awards base 1,000 + 250 per star + 10 per full second under par. Parking banks the entire run; a wreck banks 25% once. A car reset discards unbanked points, preventing resets from farming respawned crowds.
- E250 failures start after 18–30 seconds of moving outside the bay approach. A two-second warning precedes a loose mirror/exhaust, throttle cut, or brake fade. Control failures last 4–6 seconds, cannot overlap, and warning-stage failures cancel near the target bay. Surviving any failure and parking adds a one-time base 600 bonus.
- Wienermobile and New Yorker body envelopes are enlarged to 3.20 × 6.18 game units. Collision bounds, wheelbases and tracks match the enlargement; tires retain circular profiles. The smallest bay is 3.45 × 6.40.
- Score breakdowns, cumulative bank and personal bests per lot/vehicle use a separate save key. Existing parking progress and chapter unlocks carry over.
- Checked all eight vehicles at all 24 parking completion poses (192 combinations), including reverse requirements; this does not claim manual driving of every approach route. Tested actual pedestrian collisions/combo points, replay banking, all three van failures, full parking banking, persisted records and mobile layout.

## Flush trim and hit feedback
- New Yorker beltline, sill and hood accents are sampled from the same curved body profile, keeping chrome against the paint along the hood and trunk.
- Each pedestrian hit produces its own animated gold/pink +100 burst and sparks, plus a score-counter pulse. Rapid hits remain separate; alerts expire automatically and clear on reset.

## Final trim cleanup
- Santa Fe front and rear lamps now follow the body; hood accents sit against the paint.
- New Yorker bumper corners wrap into the body, and wheel covers use clean chrome discs with whitewall trim.
- Garage cards show vehicle names without extra descriptions.

## Model polish and parking-lot reactions
- Refined Santa Fe glazing, pillars and wipers; rounded Nova roof, wheel trim and scoop details; flush New Yorker headlamps and better window framing. Photo-inspired paint schemes are retained.
- Nearby parked cars become movable physics bodies in a crash blast, dent, darken and shed parts. Secondary collisions can damage other parked cars. Both replay angles capture the reactions; retry restores the lot.
- Up to two spaces per lot occasionally use randomly chosen garage vehicles, scaled within the existing parking footprint.
- Each pedestrian knockdown awards 100 points, once per knockdown. Score stays through a recovery and resets when starting a new run.
- Verified blast motion, debris, score deduplication, replay/reset and all 24 parking completion poses with the mixed parked fleet.

Separate edition at `parkside-streets/`, based on the published wheel-physics edition at `f4c26fc7cb18534c97e05c8567edbbd392338162`. Earlier game URLs are unchanged. It shares the existing parking progress key so unlocked chapters carry over.

## Fleet and pedestrians
- Eight playable vehicles. Rebuilt metallic warm-gray Santa Fe, pale sage Chrysler New Yorker with whitewalls and chrome trim, and a white Ford E250 cargo van.
- New models include shaped body panels, wheel openings, framed glazing, interiors, drivetrains, lights, trim and individual breakaway assemblies (54 / 50 / 62 respectively).
- An outer promenade beyond the south entrance has 6 pedestrians in level 1, increasing by 2 each level to 52. Walking routes remain outside the parking surface. The entrance now has an open curb gap for access.
- Shared instanced meshes render varied clothing and animated limbs. Vehicle impacts switch characters into seven-body constrained ragdolls. Knockdowns last for the rest of the run, including car recovery; restarting a challenge resets them. Settled physics bodies are removed while their fallen poses remain visible. No gore.
- Pedestrian poses are recorded and interpolated alongside the car in both crash-replay angles. Restarting resets the crowd and removes its old physics bodies and constraints.
- Verified all three revised/new vehicles against all 24 parking completion checks (72 combinations), driving/coasting/reverse, pedestrian collisions, ragdolls, replay and reset. These are automated simulation checks, not a claim that every approach route was manually driven.

## Wheel sync fix
- Tire rotation follows each wheel's actual longitudinal motion, so coasting tires keep spinning even when the accelerator is released.
- The visual wheel angle is decoupled from Cannon's brake-lock shortcut that previously froze the tires whenever brake force exceeded engine force.
- Hard braking shows longitudinal tire slip rather than an instant visual freeze; the rear wheels slip more under the handbrake.
- Driven wheels can over-spin when the physics reports sliding under heavy throttle.
- Airborne wheels preserve/free-spin, while detached wheels continue to use debris-body physics.
- The existing parking rules, 24 levels, damage system and chapter progress remain compatible; challenge vehicle behavior is documented above.

Copied from `parkside-chaos` at commit `c4aeace4b5ce3aca88b12f1cec306a23e26239d9`.

## October 2026 reference-model and rolling update
- New dedicated `wienermobile-model.js`: smooth profiled yellow coach body, orange sausage cabin, raised rear, wrapped yellow brand band and Oscar Mayer badges.
- Curved windshield and side glazing are actual openings in the body surface. Includes wipers, mirrors, vents, steps, detailed cabin, drivetrain and smaller ventilated silver wheels. All 45 assemblies participate in the crash replay and reset.
- Wheel angles advance on fixed physics steps, including coasting and reverse. Rendering preserves Cannon's contact flags and uses the correct axle rotation direction. Steering and mass-scaled braking are accounted for.
- Slower cars retain uncapped forward speed and their existing engine-force settings. The 24 lots, chapter unlocks and save key remain unchanged.

## Smooth driving at speed
- Controls, drag, suspension, damage and game timers advance together at a fixed 60 Hz. Forces are applied exactly once per physics step, including on 90/120 Hz displays and in slow motion.
- The visible chassis and attached wheels interpolate between physics poses. The camera follows that same displayed pose; collision checks and crash recordings use the actual simulated poses.
- Recovery and vehicle switches clear the interpolation buffer so the car never sweeps across the map from its previous position.
- Reverse speed and the Nova's existing forward limit use a continuous throttle taper rather than rapidly switching full power on and off. Launch power and uncapped vehicles are unchanged.
- Verification covers all eight vehicles at 30/60/90/120 Hz, reverse governors, coasting wheel interpolation, recovery, parking, gold immunity and crash playback.

## Secret destruction district: Golden Grounds
- Completing the original 24 parking challenges unlocks this map together with the golden fleet. Its garage card stays locked until then; entry automatically equips the Golden Monster Truck. The selected parking car, original parking progress and ratings remain separate.
- The driveable map is 480 × 480, five times a standard lot's width and length. A 520 × 520 heightfield supports the entire map. Long, wide boulevards connect downtown offices/shops, houses and gardens, harbor warehouses/quays/cranes/boats, and a forest with cabins.
- There are 160 pedestrians across the four districts, 20 damageable parked cars, explosive barrels, trees, lights, hydrants, fences, cargo containers and segmented buildings. The city is built lazily so regular levels carry none of its extra scenery/physics cost.
- Barrels produce pooled fire, smoke and shockwave effects and queued chain reactions. Explosions damage nearby scenery and cars and knock down pedestrians. Ragdolls are capped at 16, then their fallen poses persist; older rubble is retired from active simulation. Golden cars retain the smooth driving update and cannot wreck.
- The live objective and district counters cover every registered target and pedestrian. Buildings clear once at least 60% of their structural sections collapse; other scenery must break, parked cars must take damage, and all pedestrians must be down. A minimap and nearest-target ring point to remaining targets. No parking or checkpoint requirement applies here.
- Each new scenery target awards destruction points once. Clearing the whole district banks the run with a 10,000-point completion bonus before the vehicle multiplier. Car recovery keeps destruction, crowd and score progress. Restart begins a fresh sandbox; a completed-map badge is saved separately.

## Golden Monster Truck and rolling explosives
- Golden Grounds uses a dedicated 6.2-ton four-wheel-drive pickup with 2.36-metre tires, deep chevron tread, beadlock bolts, open bed, glazed cabin/interior, V8 blower, roll cage, exposed four-link suspension/coilovers and a tubular ram bumper. It is invincible and uses a wider follow camera; the eight normal/golden parking cars keep their existing dimensions and handling.
- A swept ram clears wall sections before they block the chassis and throws already-collapsed rubble aside again. Secret-map rubble and damaged parked cars remain physical against the environment but cannot wedge the monster chassis or support its tire rays. Recovery keeps destruction progress; returning to a parking lot restores the chosen car, suspension and collision filters.
- Kicked barrels become real rolling cylinders with a visible lit fuse. They travel first and detonate on contact with a scenery/car target after clearing the truck. A three-second fallback fuse handles misses; blast-triggered barrels detonate immediately for chain reactions. Barrel objectives count only after detonation, and their markers follow the rolling bodies. Restart restores upright, unarmed barrels.
