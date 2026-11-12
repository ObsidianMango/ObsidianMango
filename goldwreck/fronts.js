export const fronts = [
  { name: 'Rivergate', theme: 2, seed: 8379, style: 'river', troops: 30,
    districts: ['Rail yards', 'Old town', 'North docks', 'West bank', 'River crossing', 'East bank', 'Mill quarter', 'South terraces', 'Fuel harbor'] },
  { name: 'Ironworks Corridor', theme: 4, seed: 14513, style: 'industry', troops: 36,
    districts: ['Freight sidings', 'Coking plant', 'Machine works', 'Assembly yards', 'Foundry', 'Rail exchange', 'Workers’ rows', 'Repair works', 'Tank farm'] },
  { name: 'Concrete Belt', theme: 1, seed: 23873, style: 'blocks', troops: 36,
    districts: ['North estates', 'Civic square', 'Market ward', 'West blocks', 'Central avenue', 'East blocks', 'Bus depot', 'South estates', 'Warehouse row'] },
  { name: 'Outer Ring', theme: 0, seed: 31289, style: 'ring', troops: 33,
    districts: ['Orchard line', 'North redoubt', 'Brickworks', 'West redoubt', 'Town center', 'East redoubt', 'Village edge', 'Motor pool', 'Supply yards'] },
].map((front, index) => ({ ...front, front: true, index, w: 137, d: 125, h: 14, sites: [], hits: Infinity }));

const halfWidth = 42;
const halfDepth = 38;

export function districtCenter(index) {
  return [(index % 3 - 1) * halfWidth, (Math.floor(index / 3) - 1) * halfDepth];
}

const patterns = {
  river: ['house', 'apartment', 'depot', 'shed', 'bunker', 'house', 'factory'],
  industry: ['factory', 'depot', 'shed', 'factory', 'depot', 'bunker', 'house'],
  blocks: ['apartment', 'house', 'apartment', 'apartment', 'bunker', 'house', 'depot'],
  ring: ['bunker', 'house', 'barn', 'bunker', 'shed', 'depot', 'apartment'],
};

export function frontSites(job) {
  const pattern = patterns[job.style];
  return job.districts.flatMap((_, index) => {
    const [x, z] = districtCenter(index);
    const sites = [[-10, -9], [9, -10], [10, 11]];
    if ((index + job.index) % 3 === 1) sites.push([-11, 11]);
    return sites.map(([dx, dz], slot) => ({
      x: x + dx, z: z + dz,
      kind: pattern[(index * 2 + slot + job.index) % pattern.length],
    }));
  });
}

export function frontTrenches(job) {
  const terrain = new Map();
  function dig(x, z, depth) {
    terrain.set(x + ',' + z, Math.min(depth, terrain.get(x + ',' + z) ?? 0));
  }
  for (let x = -62; x <= 62; x++) {
    const offset = Math.floor((x + 62) / 13) % 3 * 2 - 2;
    const lines = job.style === 'ring' ? [-24, 0, 24] : job.style === 'industry' ? [-18, 18] : [0, 27];
    if ([0, 42].some(lane => Math.abs(Math.abs(x) - lane) < 3)) continue;
    for (const line of lines) for (let dz = -1; dz <= 1; dz++) dig(x, line + offset + dz, -2);
  }
  const channels = job.style === 'river' ? [-23, -22, -21, -20, -19] : [-23, -22, 21, 22];
  for (let z = -59; z <= 59; z++) {
    if ([0, 38].some(lane => Math.abs(Math.abs(z) - lane) < 3)) continue;
    for (const x of channels) dig(x, z, job.style === 'river' ? -1 : -2);
  }
  return terrain;
}

export function frontSupply() {
  return Array.from({ length: 9 }, (_, index) => {
    const [x, z] = districtCenter(index);
    return { x: x - 8, y: 1, z: z + 5, label: 'SUPPLY DEPOT' };
  });
}

export function buildSupply(put) {
  for (const { x, z } of frontSupply()) {
    for (let dx = -2; dx <= 2; dx++) {
      put(x + dx, 1, z + 2, 'sandbag');
      if (dx) put(x + dx, 1, z, 'powder');
    }
    put(x, 1, z, 'supply');
    put(x - 1, 1, z - 1, 'crate');
    put(x + 1, 1, z - 1, 'crate');
  }
}

export function frontVehicles(job) {
  return new Set(job.districts.map((_, index) => {
    const [x, z] = districtCenter(index);
    const type = index % 3 === (job.index + 1) % 3 ? 'fuel-truck' : 'armor-truck';
    return {
      type, position: { x: x - 2, y: 0, z }, yaw: Math.PI / 2,
      lane: x, direction: 1, marker: 'vehicle-' + index,
    };
  }));
}

export function patrol(vehicle, dt) {
  const at = vehicle.position;
  const distance = vehicle.type === 'armor-truck' ? 1.35 : 1.65;
  at.x += vehicle.direction * distance * dt;
  if (Math.abs(at.x - vehicle.lane) >= 4.5) {
    at.x = vehicle.lane + 4.5 * vehicle.direction;
    vehicle.direction *= -1;
    vehicle.yaw = vehicle.direction * Math.PI / 2;
  }
}
