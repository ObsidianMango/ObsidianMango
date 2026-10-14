# Engine roadmap

## Delivered foundation

Separate edition, isolated progress migration, immutable releases, fixed-step scheduling, extracted wheel/damage modules, fleet batching cache, swept parking gates, smoother remote motion, destruction allocation reductions and reproducible regression checks. Current catalog: 26 parking levels plus Secret City.

## Remaining engineering

- Complete extraction of camera, input orchestration, state transitions and level lifecycle from `drive.js`; these remain coupled. Preserve working input and replay behavior during each extraction.
- Profile Safari on actual iPhone/iPad and a desktop GPU. CPU-only tests do not establish 30/60 FPS. Measure GPU duration where supported, thermal throttling, JS/GPU memory and repeated demolition frame-time tails.
- Explore selective continuous collision detection for extreme velocities. Current fixed 60 Hz Cannon simulation and authored ramp handling remain; no universal no-tunnelling guarantee.
- Bound total cached visited-level GPU memory with an explicit eviction/rebuild policy. Active scene and physics membership is isolated, but inactive authored resources remain cached.
- Expand partial vehicle damage synchronization. Current remote wreck events and detailed wheel poses are retained, but arbitrary progressive panel dents/detachments are not a fully replicated physics simulation.

## Shared environmental destruction — separate feature

The release keeps environment simulation local. Do not label it persistent synchronized destruction.

A future implementation should assign stable object IDs from the level catalog, choose the host as authority for structural health/support transitions, and publish sequenced destruction events. Clients may predict cosmetic fragments, then reconcile authoritative structural state. Send compact late-join snapshots and bounded event history; ignore duplicate/out-of-order events. Keep purely visual fragments local. Host migration requires either a negotiated snapshot owner or a clean session restart.

Test two clients with loss, latency, duplicate events, reconnects, late joins and incompatible catalogs before enabling this independently of the current combat networking. Persistent worlds require a separate storage/service design.

## Physical-device release checklist

- iPhone Safari portrait/landscape, iPad split view and landscape menu, long scratch-off sessions, each casino station.
- Bluetooth Xbox analog triggers, steering, first-person camera, reconnect and focus changes.
- Two physical peers through local pairing and online rooms, including suspended Safari tabs and restrictive networks.
- Hospital traffic, chained building collapse and repeated replay/restart: capture sustained FPS, frame-time percentiles, memory and thermals.
