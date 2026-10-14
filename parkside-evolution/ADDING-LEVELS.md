# Adding a level to Parkside Evolution

All level definitions live in `level-catalog.js`. Append entries to `LEVEL_DEFINITIONS`; do not reorder existing entries, because saved parking results use their indexes. The original 24 challenges still determine the gold unlock.

An ordinary parking challenge can reuse an existing style (such as `market`, `garden`, or `warehouse`). Supply `name`, `kind`, `code`, `theme`, `spawn`, `target`, `par`, and `style`. Its compact coordinates are expanded using the existing challenge layout rules.

For a custom real-world layout, use `coordinates: 'world'` and `realWorld: true`. Supply world coordinates for `spawn`, `target`, and every gate, plus `gateWidth`. For example:

```js
{
  name: 'New waterfront lot', kind: 'Reverse parking', code: 'WATERFRONT-2',
  theme: 0x96bdc5, style: 'newWaterfront', realWorld: true,
  coordinates: 'world', spawn: [12, 44, 0],
  target: {x: 6, z: -31, yaw: Math.PI, w: 3.2, d: 6, reverse: true},
  gates: [{x: 12, z: 22, yaw: 0}, {x: 12, z: -8, yaw: 0},
    {x: 6, z: -22, yaw: Math.PI, reverse: true}],
  gateWidth: 5.2, par: 170
}
```

For a new custom environment, create its renderer module and register it by style in `LEVEL_BUILDERS` in `parking-lots.js`. Follow `real-marine-park.js`: use the supplied shared geometry/material helpers, and register physical obstacles, parked vehicles and breakable pieces. Keep colliders and repeated decoration bounded.

Appending the definition automatically updates Garage, multiplayer level choices, accepted network level IDs, and the Secret City index. No fixed multiplayer level count needs editing. The catalog signature rejects peers with different layouts; both players must open the same published update. Keep existing level codes unique.

When publishing, run `npm run prepublish:check`. The content-addressed release builder versions the complete runtime graph together; never add manual import query strings. Commit the resulting launcher, manifest and new release directory while retaining old releases.

Run `node tests/level-catalog.mjs`, `node tests/duel-game.mjs`, and the new map's parking/physics checks. Test physical iPhone/iPad performance and two-device joining before treating a new large environment as verified on hardware.
