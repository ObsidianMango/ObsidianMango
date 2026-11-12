import { fields, buildField, groundAt, terrainFor } from './terrain.js';
import { buildBridge } from './arcade.js?v=7';
import { detachUnsupported } from './collapse.js?v=7';

export const jobs = [
  { name: 'Border Checkpoint', sign: 'CHECKPOINT', theme: 0, w: 13, d: 9, h: 7, troops: 4, hits: 36, drills: 7, charges: 7, seed: 802 },
  { name: 'Freight Depot', sign: 'FREIGHT', theme: 1, w: 17, d: 9, h: 8, troops: 5, hits: 39, drills: 8, charges: 8, seed: 616 },
  { name: 'Municipal Block', sign: 'MUNICIPAL', theme: 2, w: 15, d: 11, h: 11, troops: 6, hits: 42, drills: 9, charges: 8, seed: 330 },
  { name: 'Observation Post', sign: 'OBSERVATION', theme: 3, w: 13, d: 11, h: 13, troops: 7, hits: 45, drills: 9, charges: 9, seed: 966 },
  { name: 'Industrial Works', sign: 'FOUNDRY', theme: 4, w: 17, d: 11, h: 9, troops: 7, hits: 48, drills: 10, charges: 10, seed: 281 },
  ...fields,
];

export const materials = {
  brick: { hp: 1 },
  trim: { hp: 1 },
  roof: { hp: 1 },
  floor: { hp: 1 },
  glass: { hp: 1 },
  steel: { hp: 2 },
  crate: { hp: 1 },
  beam: { hp: 2 },
  deck: { hp: 2 },
  sandbag: { hp: 2 },
  powder: { hp: 1 },
};

export const palettes = [
  { brick: 0x89715b, trim: 0xc4ad82, roof: 0x5d6e55, floor: 0x8c7657, glass: 0x527673, steel: 0x596665, crate: 0x92714c },
  { brick: 0x577779, trim: 0xb5aa80, roof: 0x46575a, floor: 0x7e7259, glass: 0x719994, steel: 0x466771, crate: 0x9b7049 },
  { brick: 0xd2ab7a, trim: 0xf4deac, roof: 0x427469, floor: 0xa98161, glass: 0x589d9e, steel: 0x79827a, crate: 0x937046 },
  { brick: 0x896b66, trim: 0xbca183, roof: 0x566961, floor: 0x906f69, glass: 0x728d8d, steel: 0x565963, crate: 0x9a6f50 },
  { brick: 0x786b5e, trim: 0xefae4c, roof: 0x975342, floor: 0x7f6958, glass: 0x799f83, steel: 0x506b62, crate: 0xa46a39 },
];

export function randomFrom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

export function getJob(index, contract = 1) {
  if (index < jobs.length) return jobs[index];
  const base = jobs[(contract - 1) % jobs.length];
  return { ...base, name: `Contract ${contract}`, seed: base.seed + contract * 913, contract };
}

export { key } from './collapse.js?v=7';
import { key } from './collapse.js?v=7';

export function buildJob(job, terrain = terrainFor(job)) {
  const cells = new Map();
  const random = randomFrom(job.seed);
  const xMax = (job.w - 1) / 2;
  const zMax = (job.d - 1) / 2;
  const put = (x, y, z, kind, palette) => cells.set(key(x, y, z), { x, y, z, kind, palette });
  const finalize = () => [...cells.values()].map((cell, id) => ({ ...cell, id, hp: materials[cell.kind].hp, shade: .87 + random() * .24 }));
  if (job.sites) {
    buildField(job, terrain, put);
    if (job.mode === 'convoy') buildBridge(put);
    if (job.mode === 'sandbox') {
      for (const side of [-1, 1]) {
        for (let z = 4; z <= 10; z += 2) {
          for (const x of [side * 7, side * 9, side * 11]) {
            if (!cells.has(key(x, 1, z)) && groundAt(terrain, x, z) === 0) put(x, 1, z, 'powder', 4);
          }
        }
      }
    }
    return finalize();
  }
  for (let y = 1; y <= job.h; y++) {
    for (let z = -zMax; z <= zMax; z++) {
      for (let x = -xMax; x <= xMax; x++) {
        const front = z === zMax;
        const side = Math.abs(x) === xMax;
        const edge = front || side || z === -zMax;
        const corner = side && Math.abs(z) === zMax;
        const band = y % 3 === 1;
        const doorWidth = job.theme === 1 || job.theme === 4 ? 2 : 1;
        if (front && y <= 3 && Math.abs(x) <= doorWidth) continue;
        if (y === job.h) {
          put(x, y, z, edge ? 'trim' : 'roof');
        } else if (edge) {
          const pane = !band && y > 1 && !corner && (side ? Math.abs(z) % 4 !== 2 : Math.abs(x) % 4 !== 2);
          const strong = corner && (job.theme === 2 || job.theme === 4) && !band;
          const foundation = y === 1 && (front ? Math.abs(x) <= doorWidth + 1 : corner);
          const lintel = front && y === 4 && Math.abs(x) <= doorWidth + 1;
          put(x, y, z, lintel ? 'beam' : strong || foundation ? 'steel' : pane ? 'glass' : band || corner ? 'trim' : 'brick');
        } else if (band) {
          const reinforced = job.theme === 4 && y === 4 && z >= zMax - 3 && Math.abs(x) <= 2;
          put(x, y, z, reinforced ? 'beam' : 'floor');
        } else if (x % 4 === 0 && z % 4 === 0 && !(x === 0 && z > 0)) {
          put(x, y, z, job.theme === 2 || job.theme === 4 ? 'steel' : 'brick');
        }
      }
    }
  }

  // Raised roof silhouettes give each job a different outline.
  for (let x = -xMax; x <= xMax; x++) {
    if (job.theme === 1 || job.theme === 4) {
      const rise = Math.max(0, 3 - Math.floor(Math.abs(x) / 2));
      for (let z = -zMax; z <= zMax; z++) {
        for (let extra = 1; extra <= rise; extra++) {
          put(x, job.h + extra, z, extra === rise ? 'roof' : 'brick');
        }
      }
    } else {
      for (const z of [-zMax, zMax]) {
        if (x % 2 === 0 || job.theme !== 0) put(x, job.h + 1, z, 'trim');
      }
      if (job.theme === 2 && Math.abs(x) <= 4) {
        for (let extra = 2; extra <= 4 - Math.floor(Math.abs(x) / 2); extra++) {
          put(x, job.h + extra, zMax, extra % 2 ? 'brick' : 'trim');
        }
      }
    }
  }
  for (let z = -zMax + 1; z < zMax; z++) {
    if (job.theme === 3 || z % 2 === 0) {
      put(-xMax, job.h + 1, z, 'trim');
      put(xMax, job.h + 1, z, 'trim');
    }
  }

  if (job.theme === 0 || job.theme === 3) {
    const awningY = 4;
    for (let x = -xMax + 1; x < xMax; x++) {
      put(x, awningY, zMax + 1, 'roof');
      if (Math.abs(x) < xMax - 1) put(x, awningY, zMax + 2, 'beam');
    }
  }
  if (job.theme === 0 || job.theme === 4) {
    for (let extra = 1; extra <= (job.theme === 4 ? 6 : 3); extra++) {
      for (let offset = 0; offset < 2; offset++) {
        put(-xMax + 2 + offset, job.h + extra, -zMax + 2, extra % 3 === 0 ? 'trim' : 'steel');
        if (job.theme === 4) put(xMax - 2 - offset, job.h + extra, -zMax + 2, extra % 3 === 0 ? 'trim' : 'steel');
      }
    }
  }

  for (const side of [-1, 1]) {
    for (let offset = 0; offset < 4; offset++) {
      const x = side * (xMax - offset);
      put(x, 1, zMax + 3, 'sandbag');
      if (offset < 3) put(x, 2, zMax + 3, 'sandbag');
    }
  }

  const barrelSites = [[0, 2, zMax - 2], [0, 2, -zMax + 1], [-xMax + 1, 2, 0], [xMax - 1, 2, 0],
    [-2, 5, 1], [2, 5, -1], [-2, 8, 1], [2, 8, -1], [0, 11, 0]];
  for (const [x, y, z] of barrelSites) {
    const base = cells.get(key(x, y - 1, z));
    if (y < job.h && base && !cells.has(key(x, y, z))) put(x, y, z, 'powder');
  }
  for (let z = -zMax + 1; z < zMax; z++) {
    for (let x = -xMax + 1; x < xMax; x++) {
      if (random() < .065 && !cells.has(key(x, 2, z))) put(x, 2, z, 'crate');
    }
  }

  return finalize();
}

export const impactRadius = { hammer: 1.46, blast: 3.85, grenade: 3.5, drone: 4.25, tank: 5.15, powder: 2.95 };

export function strike(cells, trace, tool) {
  return resolveImpact(cells, trace[0].voxel, tool, trace);
}

export function explode(cells, target, tool, radius = impactRadius[tool]) {
  return resolveImpact(cells, target, tool, [], radius);
}

function resolveImpact(cells, target, tool, trace = [], radius = impactRadius[tool]) {
  const broken = [];
  const damaged = new Set();
  const blasts = [];
  function hit(cell, power) {
    cell.hp -= power;
    if (cell.hp > 0) {
      damaged.add(cell);
      return;
    }
    damaged.delete(cell);
    cells.delete(key(cell.x, cell.y, cell.z));
    broken.push(cell);
    if (cell.kind === 'powder') blasts.push(cell);
  }

  function hitArea(center, radius, strength) {
    const squared = radius * radius;
    const core = squared * .72;
    for (const cell of cells.values()) {
      const distance = (cell.x - center.x) ** 2 + (cell.y - center.y) ** 2 + (cell.z - center.z) ** 2;
      if (distance <= squared) hit(cell, distance <= core ? strength : 1);
    }
  }

  if (tool === 'drill') {
    for (const { voxel, distance } of trace) {
      if (distance > 8) break;
      hit(voxel, 2);
    }
  } else {
    hitArea(target, radius, 2);
  }

  for (let i = 0; i < blasts.length; i++) hitArea(blasts[i], impactRadius.powder, 2);
  const falling = detachUnsupported(cells);
  for (const group of falling) for (const cell of group) damaged.delete(cell);
  return { target, broken, damaged: [...damaged], falling, blasts };
}
