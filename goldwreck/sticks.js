import { clamp, nudgeAltitude } from './flight.js?v=8';

const keys = new Set(['w', 's', 'a', 'd', 'q', 'e', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright']);

export function flightControls(movePad, climb, descend, currentFlight) {
  const held = new Set();
  const pointers = new Map();
  let side = 0;
  let forward = 0;

  function draw(x = side, y = forward) {
    movePad.style.setProperty('--stick-x', x * 35 + '%');
    movePad.style.setProperty('--stick-y', -y * 35 + '%');
  }

  function move(event) {
    if (pointers.get(movePad)?.id !== event.pointerId) return;
    const rect = movePad.getBoundingClientRect();
    const x = clamp((event.clientX - rect.left - rect.width / 2) / (rect.width * .35), -1, 1);
    const y = clamp((rect.top + rect.height / 2 - event.clientY) / (rect.height * .35), -1, 1);
    const radius = Math.hypot(x, y);
    const scale = radius > .13 ? Math.min(1, (radius - .13) / .87) / radius : 0;
    side = x * scale;
    forward = y * scale;
    draw();
  }

  movePad.addEventListener('pointermove', move);
  for (const [pad, lift] of [[movePad, 0], [climb, 1], [descend, -1]]) {
    pad.addEventListener('pointerdown', event => {
      if (!currentFlight() || event.button !== 0 || pointers.has(pad)) return;
      event.preventDefault();
      pointers.set(pad, { id: event.pointerId, start: performance.now() });
      pad.setPointerCapture(event.pointerId);
      pad.dataset.engaged = 'true';
      if (!lift) move(event);
    });
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      pad.addEventListener(type, event => {
        const pointer = pointers.get(pad);
        if (pointer?.id !== event.pointerId) return;
        pointers.delete(pad);
        delete pad.dataset.engaged;
        const flight = currentFlight();
        if (lift && flight && type === 'pointerup' && performance.now() - pointer.start < 165) {
          nudgeAltitude(flight, lift * .9);
        }
        if (!lift) {
          side = forward = 0;
          draw();
        }
      });
    }
    if (lift) pad.addEventListener('click', event => {
      const flight = currentFlight();
      if (flight && event.detail === 0) nudgeAltitude(flight, lift * .9);
    });
  }

  return {
    press(key) {
      if (!keys.has(key)) return false;
      held.add(key);
      return true;
    },
    release(key) { held.delete(key); },
    clear() {
      held.clear();
      for (const [pad, { id }] of pointers) {
        delete pad.dataset.engaged;
        if (pad.hasPointerCapture(id)) pad.releasePointerCapture(id);
      }
      pointers.clear();
      side = forward = 0;
      draw();
    },
    sample() {
      const axis = (plus, minus) => Number(plus) - Number(minus);
      const x = clamp(side + axis(held.has('d'), held.has('a')), -1, 1);
      const y = clamp(forward + axis(held.has('w'), held.has('s')), -1, 1);
      draw(x, y);
      return {
        side: x, forward: y,
        lift: axis(pointers.has(climb) || held.has('arrowup'), pointers.has(descend) || held.has('arrowdown')),
        turn: axis(held.has('e') || held.has('arrowright'), held.has('q') || held.has('arrowleft')),
      };
    },
  };
}
