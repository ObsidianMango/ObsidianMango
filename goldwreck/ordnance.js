import { key } from './jobs.js?v=2';

export const remotes = {
  drone: { label: 'Flight drone', speed: 11.5, lift: 1.05 },
  tank: { label: 'Track bot', speed: 7.1, lift: .42 },
};
export const isRemote = type => Object.hasOwn(remotes, type);

export function launch(type, target, job, yaw) {
  const end = { ...target };
  const zEdge = job.d / 2;
  let position;
  if (type === 'tank') {
    position = { x: 0, y: remotes.tank.lift, z: zEdge + 4 };
    end.y = remotes.tank.lift;
  } else {
    if (type === 'drone') end.y = Math.max(remotes.drone.lift, end.y);
    const distance = (Math.abs(Math.sin(yaw)) * job.w + Math.abs(Math.cos(yaw)) * job.d) / 2 + 5;
    position = {
      x: Math.sin(yaw) * distance,
      y: type === 'grenade' ? Math.max(1.3, target.y * .46) : Math.max(remotes.drone.lift, target.y),
      z: Math.cos(yaw) * distance,
    };
  }
  return { type, position, start: { ...position }, end, age: 0, yaw, waiting: false };
}

export function redirect(item, target) {
  item.end = { ...target, y: item.type === 'tank' ? remotes.tank.lift : Math.max(remotes.drone.lift, target.y) };
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

export function advance(item, dt, cells) {
  item.age += dt;
  const { position, start, end, type } = item;
  if (type === 'grenade') {
    const t = Math.min(1, item.age / .64);
    position.x = start.x + (end.x - start.x) * t;
    position.y = start.y + (end.y - start.y) * t + Math.sin(t * Math.PI) * 2.75;
    position.z = start.z + (end.z - start.z) * t;
    return t >= 1;
  }

  if (item.age >= 14) return true;
  if (item.waiting) return false;
  const dx = end.x - position.x;
  const dy = end.y - position.y;
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
    if (obstructed(position, type, cells)) return true;
  }
  item.waiting = step === 1;
  return false;
}
