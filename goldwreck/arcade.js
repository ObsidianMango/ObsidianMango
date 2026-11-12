import { key } from './collapse.js';

export const arcadeModes = {
  convoy: {
    name: 'Bridge Breaker', label: 'Stop the convoy', base: 11,
    briefing: 'Hit the orange barrels under a bridge pier, or take out the trucks directly. The convoy starts moving after your first shot.',
  },
  bunker: {
    name: 'Two-Charge Bunker', label: 'Two charges', base: 11, tool: 'blast', hits: 2,
    briefing: 'Two charges. Three guards. Aim for the bunker roof or blast the supports to bring it down.',
  },
  trench: {
    name: 'Trench Run', label: 'Track bots only', base: 5, tool: 'tank', hits: 5,
    briefing: 'Send track bots into the trench and detonate when they’re in range. You have five bots to clear four guards.',
  },
  sandbox: {
    name: 'Demolition Sandbox', label: 'Unlimited ammo', base: 13,
    briefing: 'Unlimited ammo and actions. Blow up the town, chase a bigger combo, or reset instantly.',
  },
};

export const deckHeight = 4;
export const fuelRadius = 5.3;
const firstTruckX = -19;
const entryX = -28;
const exitX = 21;
const convoySpeed = 1.15;

export function buildBridge(put) {
  for (let x = entryX; x <= exitX; x++) {
    for (let z = -1; z <= 1; z++) {
      put(x, deckHeight, z, 'deck', 1);
      if (z) put(x, deckHeight + 1, z, 'trim', 1);
    }
  }
  for (const x of [-27, -23, -18, -12, -6, 0, 6, 12, 18]) {
    for (let y = 1; y < deckHeight; y++) {
      for (let z = -1; z <= 1; z++) put(x, y, z, 'steel', 1);
    }
    if (x < -18) continue;
    for (let z = -2; z <= 2; z += 2) put(x + 1, 1, z, 'powder', 4);
  }
}

export function spawnConvoy() {
  return new Set(Array.from({ length: 3 }, (_, i) => ({
    type: i === 0 ? 'fuel-truck' : 'cargo-truck', yaw: Math.PI / 2,
    position: { x: firstTruckX - i * 3.75, y: deckHeight, z: 0 },
    drop: null, velocity: 0,
  })));
}

export function updateTruck(truck, dt, cells, gaps) {
  const at = truck.position;
  if (truck.drop !== null) {
    truck.velocity += 20 * dt;
    at.y = Math.max(0, at.y - truck.velocity * dt);
    at.x += dt * convoySpeed * .38;
    return at.y === 0 ? 'crash' : 'moving';
  }
  at.x += dt * convoySpeed;
  const column = Math.round(at.x);
  if (column >= entryX && column <= exitX && !cells.has(key(column, deckHeight, 0))) {
    truck.drop = gaps.get(column) ?? 0;
  }
  return at.x >= exitX + .6 ? 'escaped' : 'moving';
}

export function convoySeconds(trucks) {
  const leading = Math.max(...[...trucks].filter(truck => truck.drop === null).map(truck => truck.position.x));
  return Number.isFinite(leading) ? Math.max(1, Math.ceil((exitX + .6 - leading) / convoySpeed)) : 0;
}

export function challengeSquad(mode, squad, cells, terrain) {
  if (mode !== 'bunker' && mode !== 'trench') return squad;
  const spots = mode === 'bunker'
    ? [[-12, -11], [-13, -10], [-11, -10]]
    : [[-8, 0], [-4, 1], [2, 0], [6, 1]];
  return spots.map(([x, z], index) => {
    let y = terrain.get(x + ',' + z) ?? 0;
    for (let floor = 16; floor > y; floor--) {
      if (!cells.has(key(x, floor, z))) continue;
      y = floor;
      break;
    }
    return { ...squad[index], x, y, z, wait: 999 };
  });
}
