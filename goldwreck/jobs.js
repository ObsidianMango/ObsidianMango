export const jobs = [
  { name: 'The Pawn Shop', sign: 'PAWN', theme: 0, w: 13, d: 9, h: 7, gold: 6, quota: 3, hits: 36, drills: 7, charges: 7, seed: 802 },
  { name: 'Dockside Freight', sign: 'FREIGHT', theme: 1, w: 17, d: 9, h: 8, gold: 8, quota: 4, hits: 39, drills: 8, charges: 8, seed: 616 },
  { name: 'Bullion Exchange', sign: 'BULLION', theme: 2, w: 15, d: 11, h: 11, gold: 9, quota: 5, hits: 42, drills: 9, charges: 8, seed: 330 },
  { name: 'Lucky Seven Hotel', sign: 'LUCKY 7', theme: 3, w: 13, d: 11, h: 13, gold: 10, quota: 5, hits: 45, drills: 9, charges: 9, seed: 966 },
  { name: 'Foundry No. 9', sign: 'FOUNDRY', theme: 4, w: 17, d: 11, h: 9, gold: 11, quota: 6, hits: 48, drills: 10, charges: 10, seed: 281 },
];

export const materials = {
  brick: { hp: 1 },
  trim: { hp: 1 },
  roof: { hp: 1 },
  floor: { hp: 1 },
  glass: { hp: 1 },
  steel: { hp: 2 },
  crate: { hp: 1 },
  gold: { hp: 1 },
  powder: { hp: 1 },
};

export const palettes = [
  { brick: 0xb45d42, trim: 0xefd0a0, roof: 0x36726a, floor: 0x956d51, glass: 0x47978e, steel: 0x596665, crate: 0xa76b35 },
  { brick: 0x4d8284, trim: 0xf4bf69, roof: 0x45636a, floor: 0x7e7259, glass: 0x7ebbb2, steel: 0x466771, crate: 0xa86736 },
  { brick: 0xd2ab7a, trim: 0xf4deac, roof: 0x427469, floor: 0xa98161, glass: 0x589d9e, steel: 0x79827a, crate: 0x937046 },
  { brick: 0x95647f, trim: 0xf5b87d, roof: 0x557770, floor: 0x906f69, glass: 0x77a6a8, steel: 0x5b536f, crate: 0xaa663c },
  { brick: 0x786b5e, trim: 0xefae4c, roof: 0x975342, floor: 0x7f6958, glass: 0x799f83, steel: 0x506b62, crate: 0xa46a39 },
];

const stashSites = [
  [[-4, 2, 0], [4, 2, 1], [0, 2, -2], [-4, 5, -1], [4, 5, -1], [0, 5, 1]],
  [[-6, 2, 1], [-3, 2, -1], [0, 2, -2], [3, 2, 1], [6, 2, -1], [-5, 5, -1], [0, 5, -1], [5, 5, 1]],
  [[-5, 2, 2], [-2, 2, -2], [2, 2, -3], [5, 2, -2], [-5, 5, -2], [0, 5, 1], [5, 5, 1], [-3, 8, 0], [3, 8, -1]],
  [[-4, 2, 1], [0, 2, -2], [4, 2, 1], [-4, 5, -2], [4, 5, 1], [-4, 8, 1], [0, 8, -2], [4, 8, 0], [-3, 11, -1], [3, 11, 1]],
  [[-6, 2, 2], [-3, 2, -2], [0, 2, 1], [3, 2, -3], [6, 2, 1], [-5, 5, -2], [0, 5, 2], [5, 5, 0], [-4, 8, 1], [0, 8, -1], [4, 8, 1]],
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

export const key = (x, y, z) => `${x},${y},${z}`;
export const neighbors = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];

export function buildJob(job) {
  const cells = new Map();
  const random = randomFrom(job.seed);
  const xMax = (job.w - 1) / 2;
  const zMax = (job.d - 1) / 2;
  const put = (x, y, z, kind) => cells.set(key(x, y, z), { x, y, z, kind });
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
          put(x, y, z, strong || foundation ? 'steel' : pane ? 'glass' : band || corner ? 'trim' : 'brick');
        } else if (band) {
          put(x, y, z, 'floor');
        } else if (Math.abs(x) === xMax - 3 && (z === -zMax + 2 || z === zMax - 2)) {
          put(x, y, z, job.theme === 2 ? 'steel' : 'brick');
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
          if (extra === rise || Math.abs(z) === zMax) put(x, job.h + extra, z, extra === rise ? 'roof' : 'brick');
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
      put(x, awningY, zMax + 1, x % 2 ? 'trim' : 'roof');
      if (Math.abs(x) < xMax - 1) put(x, awningY, zMax + 2, x % 2 ? 'trim' : 'roof');
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

  const flip = job.contract && random() < .5 ? -1 : 1;
  const used = new Set();
  for (const [originalX, y, originalZ] of stashSites[job.theme]) {
    let x = originalX * flip;
    let z = originalZ;
    if (job.contract) {
      const tryX = Math.max(2 - xMax, Math.min(xMax - 2, x + Math.floor(random() * 3) - 1));
      const tryZ = Math.max(2 - zMax, Math.min(zMax - 2, z + Math.floor(random() * 3) - 1));
      const occupied = stashSites[job.theme].some(([sx, sy, sz]) => sx * flip === tryX && sy === y && sz === tryZ);
      if (!occupied && !used.has(key(tryX, y, tryZ))) {
        x = tryX;
        z = tryZ;
      }
    }
    used.add(key(x, y, z));
    const shell = job.theme >= 2 && random() > .49 ? 'steel' : 'crate';
    for (let dz = -1; dz <= 1; dz++) {
      for (let dx = -1; dx <= 1; dx++) {
        put(x + dx, y, z + dz, shell);
      }
    }
    if (y + 1 < job.h) put(x, y + 1, z, shell);
  }
  for (const location of used) put(...location.split(',').map(Number), 'gold');
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

  return [...cells.values()].map((cell, id) => ({ ...cell, id, hp: materials[cell.kind].hp, shade: .87 + random() * .24 }));
}

export function unsupported(cells) {
  const supported = new Set();
  const queue = [];
  for (const cell of cells.values()) {
    if (cell.y === 1) {
      supported.add(cell.id);
      queue.push(cell);
    }
  }
  for (let i = 0; i < queue.length; i++) {
    const { x, y, z } = queue[i];
    for (const [dx, dy, dz] of neighbors) {
      const next = cells.get(key(x + dx, y + dy, z + dz));
      if (next && !supported.has(next.id)) {
        supported.add(next.id);
        queue.push(next);
      }
    }
  }
  return [...cells.values()].filter(cell => !supported.has(cell.id));
}

export function medalFor(recovered, total, quota) {
  if (recovered >= total) return 3;
  if (recovered >= Math.ceil((total + quota) / 2)) return 2;
  return recovered >= quota ? 1 : 0;
}

const impactRadius = { hammer: 1.46, blast: 3.85, grenade: 3.5, drone: 4.25, tank: 5.15, powder: 2.95 };

export function strike(cells, trace, tool) {
  return resolveImpact(cells, trace[0].voxel, tool, trace);
}

export function explode(cells, target, tool) {
  return resolveImpact(cells, target, tool);
}

function resolveImpact(cells, target, tool, trace = []) {
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
    hitArea(target, impactRadius[tool], 2);
  }

  let nextBlast = 0;
  let collapsed = 0;
  while (true) {
    while (nextBlast < blasts.length) hitArea(blasts[nextBlast++], impactRadius.powder, 2);
    const fallen = unsupported(cells);
    if (!fallen.length) break;
    collapsed += fallen.length;
    for (const cell of fallen) hit(cell, cell.hp);
    if (nextBlast === blasts.length) break;
  }
  return { target, broken, damaged: [...damaged], collapsed, blasts };
}
