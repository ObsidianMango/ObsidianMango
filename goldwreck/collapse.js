export const key = (x, y, z) => `${x},${y},${z}`;
const sides = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const neighbors = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
const spans = { floor: 3, roof: 3, beam: 4, deck: 4, steel: 1, brick: 1, trim: 1, glass: 0, sandbag: 0 };
const loadBearing = cell => cell && Object.hasOwn(spans, cell.kind);

export function unsupported(cells) {
  const layers = [];
  for (const cell of cells.values()) (layers[cell.y] ??= []).push(cell);
  const safe = new Set();
  const loose = [];
  for (let y = 1; y < layers.length; y++) {
    const layer = layers[y] ?? [];
    const distance = new Map();
    const queue = [];
    for (const cell of layer) {
      const below = cells.get(key(cell.x, y - 1, cell.z));
      if (y !== 1 && (!loadBearing(below) || !safe.has(below))) continue;
      distance.set(cell, 0);
      if (loadBearing(cell)) queue.push(cell);
    }
    for (let i = 0; i < queue.length; i++) {
      const cell = queue[i];
      const span = distance.get(cell) + 1;
      for (const [dx, dz] of sides) {
        const next = cells.get(key(cell.x + dx, y, cell.z + dz));
        if (!loadBearing(next) || distance.has(next) || span > spans[next.kind]) continue;
        distance.set(next, span);
        queue.push(next);
      }
    }
    for (const cell of layer) {
      if (distance.has(cell)) safe.add(cell);
      else loose.push(cell);
    }
  }
  return loose;
}

export function detachUnsupported(cells) {
  const remaining = new Map();
  for (const cell of unsupported(cells)) {
    const id = key(cell.x, cell.y, cell.z);
    remaining.set(id, cell);
    cells.delete(id);
  }
  const groups = [];
  for (const [id, first] of remaining) {
    const group = [first];
    remaining.delete(id);
    for (let i = 0; i < group.length; i++) {
      const { x, y, z } = group[i];
      for (const [dx, dy, dz] of neighbors) {
        const next = key(x + dx, y + dy, z + dz);
        if (!remaining.has(next)) continue;
        group.push(remaining.get(next));
        remaining.delete(next);
      }
    }
    groups.push(group);
  }
  return groups;
}

export function fallingChunk(cells, origin) {
  const center = { x: 0, y: 0, z: 0 };
  const footprint = new Map();
  for (const cell of cells) {
    center.x += cell.x / cells.length;
    center.y += (cell.y - .5) / cells.length;
    center.z += cell.z / cells.length;
    const id = `${cell.x},${cell.z}`;
    if (!footprint.has(id) || footprint.get(id).y > cell.y) footprint.set(id, cell);
  }
  const feet = [...footprint.values()];
  const samples = feet.filter((_, i) => i % Math.max(1, Math.floor(feet.length / 28)) === 0);
  if (samples.at(-1) !== feet.at(-1)) samples.push(feet.at(-1));
  const dx = center.x - origin.x;
  const dz = center.z - origin.z;
  const direction = center.x + center.z >= 0 ? 1 : -1;
  const mass = cells.reduce((sum, cell) => sum + (cell.kind === 'steel' || cell.kind === 'beam' || cell.kind === 'deck' ? 2.2 : cell.kind === 'glass' ? .35 : 1), 0);
  return {
    cells, samples, center, position: { ...center }, mass,
    age: 0, vx: Math.tanh(dx / 3) * .72, vy: 0, vz: Math.tanh(dz / 3) * .72,
    ax: 0, az: 0,
    spinX: Math.tanh(dz / 4) * .48 + direction * .13,
    spinZ: -Math.tanh(dx / 4) * .55 + direction * .18,
  };
}

export function chunkPoint(chunk, cell) {
  const { center, position, ax, az } = chunk;
  const x = cell.x - center.x;
  const y = cell.y - .5 - center.y;
  const z = cell.z - center.z;
  const firstY = y * Math.cos(ax) - z * Math.sin(ax);
  return {
    x: position.x + x * Math.cos(az) - firstY * Math.sin(az),
    y: position.y + x * Math.sin(az) + firstY * Math.cos(az),
    z: position.z + y * Math.sin(ax) + z * Math.cos(ax),
  };
}

export function fall(chunk, dt, standing, groundAt = () => 0) {
  const steps = Math.max(1, Math.ceil(dt / .022));
  const step = dt / steps;
  for (let i = 0; i < steps; i++) {
    chunk.age += step;
    chunk.vy -= 18 * step;
    chunk.position.y += chunk.vy * step;
    chunk.position.x += chunk.vx * step;
    chunk.position.z += chunk.vz * step;
    chunk.ax += chunk.spinX * step;
    chunk.az += chunk.spinZ * step;
    let contact = null;
    for (const foot of chunk.samples) {
      const point = chunkPoint(chunk, foot);
      const bottom = point.y - .46;
      const x = Math.round(point.x);
      const z = Math.round(point.z);
      const y = Math.floor(bottom) + 1;
      const ground = groundAt(x, z);
      const obstacle = bottom > ground && standing.get(key(x, y, z));
      if (bottom > ground && !obstacle) continue;
      const surface = obstacle ? obstacle.y : ground;
      if (!contact || surface > contact.surface) contact = { x: point.x, y: surface + .5, z: point.z, surface, obstacle };
    }
    if (contact) {
      return { ...contact, speed: -chunk.vy, radius: Math.min(2.55, .86 + Math.sqrt(chunk.mass) * .18) };
    }
  }
  return null;
}
