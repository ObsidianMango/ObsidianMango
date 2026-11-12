const field = (name, w, d, theme, sites, trench, seed) => ({
  name, w, d, theme, sites, trench, seed, h: 9, troops: w > 60 ? 12 : w > 40 ? 9 : 7,
  hits: w > 60 ? 68 : w > 40 ? 58 : 48, drills: 12, charges: 14,
});

export const fields = [
  field('Sunken Lane', 29, 25, 0, ['house', 'shed'], 'line', 1027),
  field('Farmhouse Crossing', 35, 29, 3, ['barn', 'house', 'house'], 'zigzag', 1343),
  field('Rail Embankment', 41, 33, 1, ['depot', 'shed', 'bunker'], 'branches', 1789),
  field('Orchard Line', 43, 35, 0, ['house', 'barn', 'bunker'], 'zigzag', 1951),
  field('Brickworks Yard', 45, 37, 4, ['factory', 'depot', 'shed'], 'line', 2309),
  field('Three Roads', 47, 37, 2, ['house', 'house', 'house', 'shed'], 'branches', 2557),
  field('Dugout Ridge', 49, 41, 0, ['bunker', 'bunker', 'shed', 'bunker'], 'cross', 2903),
  field('Riverside Hamlet', 51, 41, 3, ['house', 'house', 'barn', 'depot'], 'zigzag', 3179),
  field('Fuel Transfer Station', 53, 43, 4, ['depot', 'factory', 'bunker', 'shed'], 'branches', 3631),
  field('Mill District', 57, 45, 1, ['factory', 'barn', 'house', 'depot'], 'cross', 4027),
  field('Outer Village', 63, 47, 3, ['house', 'house', 'house', 'barn', 'shed'], 'zigzag', 4441),
  field('Crossroads Fortifications', 65, 51, 0, ['bunker', 'depot', 'bunker', 'house', 'bunker'], 'branches', 4823),
  field('North Freight Terminal', 69, 53, 1, ['depot', 'factory', 'depot', 'house', 'shed'], 'line', 5087),
  field('The Wide Front', 73, 57, 2, ['barn', 'house', 'bunker', 'house', 'depot', 'shed'], 'cross', 5501),
  field('Industrial Belt', 77, 61, 4, ['factory', 'depot', 'factory', 'bunker', 'house', 'depot'], 'branches', 6043),
];

export function terrainFor(job) {
  const trench = new Map();
  if (!job.trench) return trench;
  const half = Math.floor(job.w * .42);
  const add = (x, z, depth) => {
    const id = x + ',' + z;
    trench.set(id, Math.min(depth, trench.get(id) ?? 0));
  };
  for (let x = -half; x <= half; x++) {
    const offset = job.trench === 'zigzag' && Math.abs(x) > half * .44 ? (x < 0 ? -2 : 2) : 0;
    for (let z = offset - 1; z <= offset + 1; z++) {
      add(x, z, Math.abs(x) >= half - 1 ? -1 : -2);
    }
  }
  if (job.trench === 'branches' || job.trench === 'cross') {
    const branches = job.trench === 'cross' ? [0] : [-Math.floor(half * .65), Math.floor(half * .65)];
    for (const x of branches) {
      const length = job.trench === 'cross' ? Math.floor(job.d * .34) : 5;
      for (let z = -length; z <= length; z++) {
        for (let dx = -1; dx <= 1; dx++) add(x + dx, z, Math.abs(z) === length ? -1 : -2);
      }
    }
  }
  job.sites.forEach((kind, i) => {
    const [x, z] = sitePositions(job)[i];
    const [w, d] = buildings[kind];
    for (let dx = -Math.floor(w / 2); dx <= Math.floor(w / 2); dx++) {
      for (let dz = -Math.floor(d / 2); dz <= Math.floor(d / 2); dz++) trench.delete((x + dx) + ',' + (z + dz));
    }
  });
  return trench;
}

export function groundAt(terrain, x, z) {
  return terrain?.get(Math.round(x) + ',' + Math.round(z)) ?? 0;
}

const buildings = {
  house: [7, 7, 5, 3], barn: [9, 7, 6, 0], shed: [5, 5, 4, 1],
  bunker: [7, 5, 4, 0], depot: [13, 9, 7, 1], factory: [15, 9, 8, 4],
};

function sitePositions(job) {
  const x = Math.round(job.w * (job.sites.length > 4 ? .31 : .24));
  const z = Math.round(job.d * .27);
  return [[-x,-z], [x,z], [x,-z], [-x,z], [0,-z], [0,z]];
}

export function buildField(job, terrain, put) {
  const sites = sitePositions(job);
  job.sites.forEach((kind, i) => {
    const [cx, cz] = sites[i];
    const [w, d, h, palette] = buildings[kind];
    const a = (w - 1) / 2, b = (d - 1) / 2;
    const place = (dx, y, dz, material) => put(cx + dx, y, cz + dz, material, palette);
    for (let dy = 1; dy <= h; dy++) {
      for (let dz = -b; dz <= b; dz++) {
        for (let dx = -a; dx <= a; dx++) {
          const edge = Math.abs(dx) === a || Math.abs(dz) === b;
          const doorway = dz === b && Math.abs(dx) <= 1;
          if (doorway && dy <= 3) continue;
          if (doorway && dy === 4) place(dx, dy, dz, 'beam');
          else if (dy === h) place(dx, dy, dz, 'roof');
          else if (dy === 1 || h >= 7 && dy === 4) place(dx, dy, dz, 'floor');
          else if (edge) {
            const window = kind !== 'bunker' && dy % 3 === 0 && (dz === b || dz === -b) && Math.abs(dx) % 3 === 2;
            place(dx, dy, dz, window ? 'glass' : kind === 'bunker' ? 'steel' : 'brick');
          } else if (dx % 4 === 0 && dz % 3 === 0) place(dx, dy, dz, 'beam');
        }
      }
    }
    if (kind === 'house' || kind === 'barn') {
      for (let dx = -a + 1; dx < a; dx++) {
        for (let dz = -b; dz <= b; dz++) {
          place(dx, h + 1, dz, 'roof');
          if (Math.abs(dx) < 2) place(dx, h + 2, dz, 'roof');
        }
      }
    }
    if (kind === 'factory') {
      for (const dx of [-a + 2, a - 2]) for (let y = h + 1; y <= h + 5; y++) place(dx, y, -b + 1, 'steel');
    }
    for (const dx of [-a + 1, a - 1]) {
      if (groundAt(terrain, cx + dx, cz + b + 2) === 0) place(dx, 1, b + 2, 'crate');
      if (groundAt(terrain, cx + dx, cz + b + 3) === 0) place(dx, 1, b + 3, 'powder');
    }
  });
  for (let x = -Math.floor(job.w * .4); x <= job.w * .4; x++) {
    for (const z of [-3, 3]) {
      if (x % 9 > 4 || x % 9 < -4 || groundAt(terrain, x, z) < 0) continue;
      put(x, 1, z, 'sandbag');
      if (x % 3 === 0) put(x, 2, z, 'sandbag');
    }
  }
}

export function fieldGround(job, terrain, add) {
  const hx = Math.floor(job.w / 2) + 6;
  const hz = Math.floor(job.d / 2) + 6;
  const surface = (x, z) => {
    const depth = groundAt(terrain, x, z);
    if (depth < 0) return [depth, depth === -2 ? 0x6d5942 : 0x807155];
    if (Math.abs(x) <= 2 || Math.abs(z) === Math.round(job.d * .22)) return [0, 0x81785e];
    return [0, Math.abs(Math.floor(x / 6) + Math.floor(z / 7)) % 2 ? 0x59614a : 0x60674e];
  };
  let strips = new Map();
  const drawStrip = ({ x, end, y, first, last, color }) => {
    add((x + end - 1) / 2, (y - 2.5) / 2, (first + last) / 2, end - x, y + 2.5, last - first + 1, color);
  };
  for (let z = -hz; z <= hz; z++) {
    const row = new Map();
    for (let x = -hx; x <= hx;) {
      const [y, color] = surface(x, z);
      let end = x + 1;
      while (end <= hx) {
        const [nextY, nextColor] = surface(end, z);
        if (nextY !== y || nextColor !== color) break;
        end++;
      }
      const id = [x, end, y, color].join(',');
      const strip = strips.get(id) ?? { x, end, y, color, first: z };
      strip.last = z;
      strips.delete(id);
      row.set(id, strip);
      x = end;
    }
    for (const strip of strips.values()) drawStrip(strip);
    strips = row;
  }
  for (const strip of strips.values()) drawStrip(strip);
  for (let x = -hx + 2; x <= hx - 2; x += 4) {
    for (const z of [-hz + 2, hz - 2]) {
      const height = 2 + ((x * x + job.seed) % 4) * .35;
      add(x, height * .37, z, .33, height * .74, .33, 0x5d4a3a);
      add(x, height * .83, z, 1.45, height * .69, 1.33, 0x515e44);
      add(x + .12, height * 1.15, z, .93, .68, .93, 0x647052);
    }
  }
}
