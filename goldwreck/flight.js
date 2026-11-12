const gravity = 9.81;
const maxThrust = 23.5;
const maxAngle = .82;
const maxRate = 6.4;

export const hoverThrottle = gravity / maxThrust;
export const flightBattery = 75;
export const clamp = (value, low, high) => Math.min(high, Math.max(low, value));

function multiply(a, b) {
  return {
    x: a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
    y: a.w * b.y + a.y * b.w + a.z * b.x - a.x * b.z,
    z: a.w * b.z + a.z * b.w + a.x * b.y - a.y * b.x,
    w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z,
  };
}

function normalize(q) {
  const n = Math.hypot(q.x, q.y, q.z, q.w);
  return { x: q.x / n, y: q.y / n, z: q.z / n, w: q.w / n };
}

function toward(a, b, factor) {
  const sign = a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w < 0 ? -1 : 1;
  return normalize({
    x: a.x + (b.x * sign - a.x) * factor,
    y: a.y + (b.y * sign - a.y) * factor,
    z: a.z + (b.z * sign - a.z) * factor,
    w: a.w + (b.w * sign - a.w) * factor,
  });
}

function attitude(yaw, pitch = 0, roll = 0) {
  const y = yaw * .5, p = pitch * .5, r = roll * .5;
  return multiply(
    multiply({ x: 0, y: Math.sin(y), z: 0, w: Math.cos(y) }, { x: Math.sin(p), y: 0, z: 0, w: Math.cos(p) }),
    { x: 0, y: 0, z: Math.sin(r), w: Math.cos(r) },
  );
}

function rotate(q, x, y, z) {
  const a = 2 * (q.y * z - q.z * y);
  const b = 2 * (q.z * x - q.x * z);
  const c = 2 * (q.x * y - q.y * x);
  return {
    x: x + q.w * a + q.y * c - q.z * b,
    y: y + q.w * b + q.z * a - q.x * c,
    z: z + q.w * c + q.x * b - q.y * a,
  };
}

function curve(value) {
  const scale = clamp((Math.abs(value) - .035) / .965, 0, 1);
  return Math.sign(value) * (.67 * scale + .33 * scale ** 3);
}

export function takeControl(item) {
  const dx = item.end.x - item.position.x;
  const dy = item.end.y - item.position.y;
  const dz = item.end.z - item.position.z;
  const magnitude = Math.hypot(dx, dy, dz);
  const speed = !item.waiting && magnitude > .05 ? Math.min(11.5, magnitude * 5) / magnitude : 0;
  item.flight = {
    mode: 'angle', q: attitude(item.yaw), throttle: hoverThrottle, motor: hoverThrottle,
    velocity: { x: dx * speed, y: dy * speed, z: dz * speed }, rates: { x: 0, y: 0, z: 0 },
  };
  item.expires = Math.max(item.expires ?? 0, flightBattery);
  item.waiting = false;
}

export function releaseControl(item) {
  item.flight = null;
  item.end = { ...item.position };
  item.waiting = true;
}

export function advanceFlight(item, elapsed, input, collides) {
  item.age += elapsed;
  if (item.age >= item.expires) return true;
  const { flight, position } = item;
  const { velocity, rates } = flight;
  const pitch = curve(input.pitch);
  const roll = curve(input.roll);
  const yaw = curve(input.yaw);
  const steps = Math.max(1, Math.ceil(elapsed * 160));
  const dt = elapsed / steps;
  for (let i = 0; i < steps; i++) {
    if (flight.mode === 'acro') {
      const rateEase = 1 - Math.exp(-15 * dt);
      rates.x += (pitch * maxRate - rates.x) * rateEase;
      rates.y += (-yaw * maxRate * .66 - rates.y) * rateEase;
      rates.z += (roll * maxRate - rates.z) * rateEase;
      const speed = Math.hypot(rates.x, rates.y, rates.z);
      if (speed > .0001) {
        const amount = speed * dt * .5;
        const s = Math.sin(amount) / speed;
        flight.q = normalize(multiply(flight.q, { x: rates.x * s, y: rates.y * s, z: rates.z * s, w: Math.cos(amount) }));
      }
      const forward = rotate(flight.q, 0, 0, 1);
      if (Math.hypot(forward.x, forward.z) > .05) item.yaw = Math.atan2(forward.x, forward.z);
    } else {
      rates.y += (-yaw * 2.85 - rates.y) * (1 - Math.exp(-12 * dt));
      rates.x = 0;
      rates.z = 0;
      item.yaw += rates.y * dt;
      flight.q = toward(flight.q, attitude(item.yaw, pitch * maxAngle, roll * maxAngle), 1 - Math.exp(-6.8 * dt));
    }
    flight.motor += (flight.throttle - flight.motor) * (1 - Math.exp(-10 * dt));
    const thrust = rotate(flight.q, 0, flight.motor * maxThrust, 0);
    const speed = Math.hypot(velocity.x, velocity.y, velocity.z);
    const drag = .17 + speed * .028;
    velocity.x += (thrust.x - velocity.x * drag) * dt;
    velocity.y += (thrust.y - gravity - velocity.y * drag) * dt;
    velocity.z += (thrust.z - velocity.z * drag) * dt;
    position.x += velocity.x * dt;
    position.y += velocity.y * dt;
    position.z += velocity.z * dt;
    if (collides(position)) return true;
  }
  return false;
}
