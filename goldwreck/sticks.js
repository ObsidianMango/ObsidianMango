import { clamp, hoverThrottle } from './flight.js';

const keys = new Set(['w', 's', 'a', 'd', 'q', 'e', 'arrowup', 'arrowdown']);

export function flightSticks(left, right, currentFlight) {
  const held = new Set();
  const axes = { yaw: 0, pitch: 0, roll: 0 };
  const pointers = new Map();

  function draw(throttle = hoverThrottle, display = axes) {
    left.style.setProperty('--stick-x', display.yaw * 35 + '%');
    left.style.setProperty('--stick-y', (1 - 2 * throttle) * 35 + '%');
    right.style.setProperty('--stick-x', display.roll * 35 + '%');
    right.style.setProperty('--stick-y', -display.pitch * 35 + '%');
  }

  for (const pad of [left, right]) {
    function move(event) {
      const flight = currentFlight();
      if (!flight || pointers.get(pad) !== event.pointerId) return;
      const rect = pad.getBoundingClientRect();
      const x = clamp((event.clientX - rect.left - rect.width / 2) / (rect.width * .35), -1, 1);
      const y = clamp((event.clientY - rect.top - rect.height / 2) / (rect.height * .35), -1, 1);
      if (pad === left) {
        axes.yaw = x;
        flight.throttle = (1 - y) / 2;
      } else {
        axes.roll = x;
        axes.pitch = -y;
      }
      draw(flight.throttle);
    }
    pad.addEventListener('pointerdown', event => {
      if (!currentFlight() || event.button !== 0 || pointers.has(pad)) return;
      event.preventDefault();
      pointers.set(pad, event.pointerId);
      pad.setPointerCapture(event.pointerId);
      pad.dataset.engaged = 'true';
      move(event);
    });
    pad.addEventListener('pointermove', move);
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      pad.addEventListener(type, event => {
        if (pointers.get(pad) !== event.pointerId) return;
        pointers.delete(pad);
        delete pad.dataset.engaged;
        if (pad === left) axes.yaw = 0;
        else axes.roll = axes.pitch = 0;
        draw(currentFlight()?.throttle);
      });
    }
  }

  return {
    draw,
    press(key) {
      if (!keys.has(key)) return false;
      held.add(key);
      return true;
    },
    release(key) { held.delete(key); },
    clear() {
      held.clear();
      for (const [pad, id] of pointers) {
        delete pad.dataset.engaged;
        if (pad.hasPointerCapture(id)) pad.releasePointerCapture(id);
      }
      pointers.clear();
      axes.yaw = axes.pitch = axes.roll = 0;
      draw(currentFlight()?.throttle);
    },
    sample(flight, dt) {
      const axis = (plus, minus) => Number(held.has(plus)) - Number(held.has(minus));
      flight.throttle = clamp(flight.throttle + axis('arrowup', 'arrowdown') * dt * .48, 0, 1);
      const input = {
        yaw: clamp(axes.yaw + axis('e', 'q'), -1, 1),
        pitch: clamp(axes.pitch + axis('w', 's'), -1, 1),
        roll: clamp(axes.roll + axis('d', 'a'), -1, 1),
      };
      draw(flight.throttle, input);
      return input;
    },
  };
}
