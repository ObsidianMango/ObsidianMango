import { key } from './collapse.js';
import { randomFrom } from './jobs.js?v=7';
import { groundAt } from './terrain.js';

const directions = [[1, 0], [-1, 0], [0, 1], [0, -1]];

function canStand(cells, x, y, z, job, terrain) {
  return Math.abs(x) <= (job.w - 1) / 2 && Math.abs(z) <= (job.d - 1) / 2
    && (y === groundAt(terrain, x, z) || cells.has(key(x, y, z)))
    && !cells.has(key(x, y + 1, z)) && !cells.has(key(x, y + 2, z));
}

export function garrison(job, cells, terrain) {
  const random = randomFrom(job.seed * 11);
  const floors = new Map();
  for (const floor of cells.values()) {
    const { x, y, z, kind } = floor;
    if (kind !== 'floor' && kind !== 'roof') continue;
    if (Math.abs(x) >= (job.w - 1) / 2 || Math.abs(z) >= (job.d - 1) / 2) continue;
    if (!canStand(cells, x, y, z, job, terrain)) continue;
    const band = floors.get(y) || [];
    band.push({ x, y, z });
    floors.set(y, band);
  }
  const levels = [...floors.values()].filter(level => level.length > 3);
  const trenches = [...(terrain ?? [])].filter(([_, y]) => y === -2).map(([id, y]) => {
    const [x, z] = id.split(',').map(Number);
    return { x, y, z };
  });
  const squad = [];
  for (let i = 0; i < job.troops; i++) {
    const options = trenches.length && i % 3 === 0 ? trenches : levels[i % levels.length];
    let index = Math.floor(random() * options.length);
    for (let tries = 0; tries < options.length; tries++) {
      const at = options[index];
      if (!squad.some(person => person.y === at.y && Math.hypot(person.x - at.x, person.z - at.z) < (job.sites ? 6 : 2.4))) break;
      index = (index + 1) % options.length;
    }
    const position = options.splice(index, 1)[0];
    squad.push({
      ...position, id: i, yaw: random() * Math.PI * 2, vy: 0, fallStart: null,
      wait: .6 + random() * 1.6, next: null, phase: random() * 4, random,
    });
  }
  return squad;
}

export function updateInfantry(person, dt, cells, job, terrain) {
  const x = Math.round(person.x);
  const z = Math.round(person.z);
  const floor = Math.round(person.y);
  const ground = groundAt(terrain, x, z);
  if (person.fallStart !== null || (floor > ground && !cells.has(key(x, floor, z)))) {
    person.fallStart ??= person.y;
    person.vy -= 18 * dt;
    const after = Math.max(ground, person.y + person.vy * dt);
    let surface = Math.floor(person.y - .01);
    for (; surface > ground && surface >= after; surface--) {
      if (cells.has(key(x, surface, z))) break;
    }
    if (after === ground || surface > ground && surface >= after) {
      person.y = Math.max(ground, surface);
      const drop = person.fallStart - person.y;
      person.fallStart = null;
      person.vy = 0;
      person.next = null;
      if (drop > 3.3) return 'down';
    } else {
      person.y = after;
    }
    return 'move';
  }
  if (!person.next) {
    person.wait -= dt;
    if (person.wait > 0) return 'idle';
    const choices = directions
      .map(([dx, dz]) => ({ x: x + dx, z: z + dz }))
      .filter(at => canStand(cells, at.x, floor, at.z, job, terrain));
    if (person.threat) {
      const { x: tx, z: tz } = person.threat;
      choices.sort((a, b) => Math.hypot(b.x - tx, b.z - tz) - Math.hypot(a.x - tx, a.z - tz));
      person.next = choices[0] ?? null;
      if (!person.next) person.threat = null;
    } else {
      person.next = choices[Math.floor(person.random() * choices.length)] ?? null;
    }
    person.wait = 1.2 + person.random() * 2.3;
    if (!person.next) return 'idle';
  }
  const dx = person.next.x - person.x;
  const dz = person.next.z - person.z;
  const distance = Math.hypot(dx, dz);
  const step = Math.min(1, dt * (person.threat ? 2.2 : 1.18) / Math.max(.01, distance));
  if (distance > .04) person.yaw = Math.atan2(dx, dz);
  person.x += dx * step;
  person.z += dz * step;
  person.phase += dt * 10;
  if (step === 1) {
    person.next = null;
    person.threat = null;
  }
  return 'move';
}
