const moveSpeed = 7;
const climbSpeed = 3.2;
const ceiling = 40;

export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export function takeControl(item) {
  item.flight = {
    pitch: -.12, altitude: item.position.y, destination: null,
    velocity: { x: 0, y: 0, z: 0 }, blocked: false,
  };
  item.expires ??= item.age + 110;
  item.waiting = false;
}

export function releaseControl(item) {
  item.flight = null;
  item.end = { ...item.position };
  item.waiting = true;
}

export function guideFlight(item, target) {
  const { position, flight } = item;
  const dx = target.x - position.x;
  const dy = target.y - position.y;
  const dz = target.z - position.z;
  const distance = Math.hypot(dx, dy, dz);
  if (distance < .8) return;
  const portion = (distance - .8) / distance;
  flight.destination = {
    x: position.x + dx * portion,
    y: clamp(position.y + dy * portion, -1.4, ceiling),
    z: position.z + dz * portion,
  };
  flight.blocked = false;
}

export function nudgeAltitude(flight, amount) {
  flight.destination = null;
  flight.altitude = clamp(flight.altitude + amount, -1.4, ceiling);
  flight.blocked = false;
}

function moveAxis(position, axis, distance, blocked) {
  if (Math.abs(distance) < .00005) return true;
  const before = position[axis];
  position[axis] += distance;
  if (!blocked(position)) return true;
  position[axis] = before;
  return false;
}

export function advanceFlight(item, elapsed, input, blocked) {
  item.age += elapsed;
  if (item.age >= item.expires) return true;
  const { flight, position } = item;
  const { velocity } = flight;
  const magnitude = Math.hypot(input.forward, input.side);
  if (magnitude > .02 || input.lift) {
    flight.destination = null;
    flight.blocked = false;
  }
  item.yaw -= input.turn * elapsed * 1.9;
  const sine = Math.sin(item.yaw);
  const cosine = Math.cos(item.yaw);
  const forward = input.forward / Math.max(1, magnitude);
  const side = input.side / Math.max(1, magnitude);
  const steps = Math.max(1, Math.ceil(elapsed * 80));
  const dt = elapsed / steps;
  for (let i = 0; i < steps; i++) {
    let x = (sine * forward - cosine * side) * moveSpeed;
    let z = (cosine * forward + sine * side) * moveSpeed;
    if (flight.destination) {
      const target = flight.destination;
      const dx = target.x - position.x;
      const dz = target.z - position.z;
      const scale = Math.min(4.3, 5.3 / Math.max(.01, Math.hypot(dx, dz)));
      x = dx * scale;
      z = dz * scale;
      flight.altitude = target.y;
      if (Math.hypot(dx, target.y - position.y, dz) < .13) flight.destination = null;
    } else if (input.lift) {
      nudgeAltitude(flight, input.lift * climbSpeed * dt);
    }
    const climb = clamp((flight.altitude - position.y) * 7, -climbSpeed, climbSpeed);
    const glide = 1 - Math.exp(-(x || z ? 10 : 24) * dt);
    velocity.x += (x - velocity.x) * glide;
    velocity.z += (z - velocity.z) * glide;
    velocity.y += (climb - velocity.y) * (1 - Math.exp(-22 * dt));
    const movedX = moveAxis(position, 'x', velocity.x * dt, blocked);
    const movedZ = moveAxis(position, 'z', velocity.z * dt, blocked);
    const movedY = moveAxis(position, 'y', velocity.y * dt, blocked);
    if (!movedX) velocity.x = 0;
    if (!movedZ) velocity.z = 0;
    if (!movedY) {
      velocity.y = 0;
      flight.altitude = position.y;
    }
    if (!movedX || !movedY || !movedZ) {
      if (flight.destination) flight.altitude = position.y;
      flight.destination = null;
      flight.blocked = true;
    }
  }
  return false;
}
