import { key } from './collapse.js';
import { groundAt } from './terrain.js';

export const remotes = {
  drone: { label: 'FPV drone', speed: 11.5, lift: 1.05 },
  tank: { label: 'Track bot', speed: 7.1, lift: .42 },
};
export const isRemote = type => Object.hasOwn(remotes, type);

export function launch(type, target, job, yaw, terrain) {
  const end = { ...target };
  const zEdge = job.d / 2;
  let position;
  if (type === 'tank') {
    position = { x: job.sites ? target.x : 0, y: remotes.tank.lift,
      z: job.sites ? Math.min(zEdge + 4, target.z + 9) : zEdge + 4 };
    end.y = groundAt(terrain, end.x, end.z) + remotes.tank.lift;
  } else {
    if (type === 'drone') end.y = Math.max(groundAt(terrain, end.x, end.z) + .48, end.y);
    const distance = job.sites ? 11 : (Math.abs(Math.sin(yaw)) * job.w + Math.abs(Math.cos(yaw)) * job.d) / 2 + 5;
    position = {
      x: (job.sites ? target.x : 0) + Math.sin(yaw) * distance,
      y: type === 'grenade' ? Math.max(1.3, target.y * .46) : Math.max(remotes.drone.lift, target.y + (job.sites ? 1 : 0)),
      z: (job.sites ? target.z : 0) + Math.cos(yaw) * distance,
    };
  }
  if (type === 'tank') position.y += groundAt(terrain, position.x, position.z);
  const heading = Math.atan2(end.x - position.x, end.z - position.z);
  return { type, position, start: { ...position }, end, age: 0, yaw: heading, waiting: false };
}

export function redirect(item, target, terrain) {
  const ground = groundAt(terrain, target.x, target.z);
  item.end = { ...target, y: item.type === 'tank' ? ground + remotes.tank.lift : Math.max(ground + .48, target.y) };
  item.waiting = false;
}

function obstructed(position, type, cells) {
  const x = Math.floor(position.x + .5);
  const z = Math.floor(position.z + .5);
  if (type === 'tank') {
    const lower = cells.get(key(x, 1, z));
    return Boolean(cells.has(key(x, 2, z)) || lower && lower.kind !== 'floor');
  }
  return cells.has(key(x, Math.floor(position.y + 1), z));
}

export function advance(item, dt, cells, terrain) {
  item.age += dt;
  const { position, start, end, type } = item;
  if (type === 'grenade') {
    const t = Math.min(1, item.age / .64);
    position.x = start.x + (end.x - start.x) * t;
    position.y = start.y + (end.y - start.y) * t + Math.sin(t * Math.PI) * 2.75;
    position.z = start.z + (end.z - start.z) * t;
    return t >= 1;
  }

  if (item.age >= (type === 'drone' ? 28 : 18)) return true;
  if (item.waiting) return false;
  const dx = end.x - position.x;
  const dy = type === 'tank' ? 0 : end.y - position.y;
  const dz = end.z - position.z;
  const distance = Math.hypot(dx, dy, dz);
  if (distance < .04) {
    item.waiting = true;
    return false;
  }
  if (Math.hypot(dx, dz) > .04) item.yaw = Math.atan2(dx, dz);
  const step = Math.min(1, dt * remotes[type].speed / distance);
  const travel = distance * step;
  const substeps = Math.max(1, Math.ceil(travel / .18));
  for (let i = 0; i < substeps; i++) {
    position.x += dx * step / substeps;
    position.y += dy * step / substeps;
    position.z += dz * step / substeps;
    const ground = groundAt(terrain, position.x, position.z);
    if (type === 'tank') position.y = ground + remotes.tank.lift;
    if (position.y < ground + .17 || obstructed(position, type, cells)) return true;
  }
  item.waiting = step === 1;
  return false;
}
