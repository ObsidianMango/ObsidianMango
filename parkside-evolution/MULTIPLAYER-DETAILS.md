# Online multiplayer visual synchronization

This branch of Parkside Streets renders other players with the existing detailed Steve-style character rig and accurate detailed car assembly instead of the placeholder boxes.

## What's synchronized
- Chosen character appearance using the same vertex-painted avatar as local first-/third-person gameplay.
- Real vehicle identifier (including golden variants and monster truck), 3D orientation, position, local wheel steering/spin transforms, and other pose metadata.
- Player vehicle destruction: a one-time wreck event sends vehicle ID, coordinates, orientation, and impact strength. The other peer detaches real body assemblies as temporary 3D debris, triggers sparks and an explosion effect, then restores a pristine detailed model on recovery.
- Events propagate over the already-open multiplayer data connection; no additional server is required.

## Limitations
- Each client simulates the detached wreck fragments locally from the same event, so fragments scatter similarly but are not frame-perfect synchronized rigid bodies. Nonplayer buildings, parked traffic and pedestrian collisions are still locally simulated.
- A peer that joins after the wreck event will not replay that past wreck. This is a two-player prototype, not a persistent authoritative world.
- Actual two-device multiplayer rendering and network conditions still require device testing.

## Original intact
The source `parkside-mango-edition` directory is unchanged. All changes are in `parkside-mango-online`.
