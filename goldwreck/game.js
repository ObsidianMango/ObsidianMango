import { districtCenter, fronts, frontSupply, frontVehicles, patrol } from './fronts.js?v=8';
import { Yard } from './scene.js?v=9';
import { jobs, getJob, buildJob, key, impactRadius, strike, explode } from './jobs.js?v=8';
import { advance, flightCollision, isRemote, launch, placeTrackPilot, redirect, remotes, trackCollision } from './ordnance.js?v=8';
import { fallingChunk, fall, chunkPoint } from './collapse.js?v=7';
import { garrison, updateInfantry } from './infantry.js?v=8';
import { terrainFor, groundAt } from './terrain.js?v=8';
import { advanceFlight, advanceTrack, clamp, guideFlight, releaseControl, takeControl } from './flight.js?v=8';
import { flightControls } from './sticks.js?v=8';

import { arcadeModes, challengeSquad, convoySeconds, deckHeight, fuelRadius, spawnConvoy, updateTruck } from './arcade.js?v=7';
import { DetonationReplay, Replays } from './replay.js?v=9';

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const viewport = $('#viewport');
const arena = $('.arena');
const yard = new Yard(viewport);
const modal = $('#modal');
const body = $('#modal-body');
const missionBar = $('#mission-progress');
const crosshair = $('#crosshair');
const replays = new Replays($('#watch-replay'));
const detonationReplay = new DetonationReplay($('#detonation-replay'), () => {
  yard.dirty = true;
  renderStats();
  viewport.focus({ preventScroll: true });
});
yard.rewinding = () => detonationReplay.active;
yard.captureDetonation = now => {
  if (document.hidden || modal.open) return;
  if (detonationReplay.active) detonationReplay.advance(yard, now);
  else if (yard.fpv) detonationReplay.remember(yard, now, yard.fpv.position);
};
yard.recording = () => Boolean(replays.recording);
yard.captureReplay = now => replays.capture(yard, now);
yard.timeScale = dt => {
  if (!run || run.slow <= 0 || modal.open || document.hidden) return 1;
  run.slow -= dt;
  return .43;
};
const toolButtons = $$('[data-tool]');
const viewButtons = $$('[data-view]');
const tools = toolButtons.map(button => button.dataset.tool);
const views = viewButtons.map(button => button.dataset.view);
const toolsByKey = Object.fromEntries(tools.map((tool, i) => [String(i + 1), tool]));
const storageKey = 'goldwreck.front.v1';
const number = new Intl.NumberFormat();
const coarsePointer = matchMedia('(pointer: coarse)');
let audio;
let run;
let toastTimeout;
let settleTimeout;
let pointer;
let lastAim;
let keyboardAim = [.5, .53];
let nextTelemetry = 0;
const sticks = flightControls($('#fpv-move'), $('#fpv-climb'), $('#fpv-descend'), () => yard.fpv?.flight);
const flightHUD = ['altitude', 'speed', 'battery'].map(id => $('#fpv-' + id));

function telemetry(item) {
  const tracked = item.type === 'tank';
  const altitude = item.position.y - groundAt(run.terrain, item.position.x, item.position.z);
  const speed = Math.hypot(item.flight.velocity.x, item.flight.velocity.y, item.flight.velocity.z);
  const values = [`${altitude.toFixed(1)} m`,
    `${Math.round(speed)} m/s`, `${Math.max(0, Math.ceil(item.expires - item.age))} s`];
  flightHUD.forEach((field, i) => {
    if (field.textContent !== values[i]) field.textContent = values[i];
  });
  const resting = tracked ? 'Stopped' : 'Hovering';
  const moving = tracked ? 'Driving' : 'Flying';
  const status = item.flight.destination ? `${moving} to point` : speed > .22 ? moving
    : item.flight.blocked ? `${resting} · Obstacle` : resting;
  const label = `${tracked ? 'Track bot' : 'FPV'} · ${status}`;
  const remoteStatus = $('#remote-status');
  if (remoteStatus.textContent !== label) remoteStatus.textContent = label;
}

function setPilot(item) {
  if (yard.fpv) releaseControl(yard.fpv);
  sticks.clear();
  if (pointer) {
    const id = pointer.id;
    pointer = null;
    viewport.classList.remove('dragging');
    if (viewport.hasPointerCapture(id)) viewport.releasePointerCapture(id);
  }
  if (item) {
    const { position } = item;
    while (item.type === 'drone' && flightCollision(position, run.job, run.cells, run.terrain) && position.y < 24) position.y += .28;
    detonationReplay.reset();
    takeControl(item, run.job.front ? 180 : 110);
    telemetry(item);
    nextTelemetry = 0;
    lastAim = null;
    crosshair.hidden = true;
  }
  yard.setFPV(item);
}

const defaultSave = { unlocked: 0, contract: 1, scores: {}, sound: false };
let saved = { ...defaultSave };
try {
  const previous = JSON.parse(localStorage.getItem('goldwreck.progress.v1'));
  if (previous?.sound) saved.sound = true;
  const data = JSON.parse(localStorage.getItem(storageKey));
  if (data && Number.isInteger(data.unlocked) && data.unlocked >= 0 && data.unlocked <= jobs.length) {
    saved = { ...defaultSave, ...data, scores: data.scores || {}, contract: Math.max(1, Number(data.contract) || 1) };
  }
} catch {}

function save() {
  try { localStorage.setItem(storageKey, JSON.stringify(saved)); } catch {}
}

function tone(frequency, end, length, type, volume, delay = 0) {
  const now = audio.currentTime + delay;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, now);
  osc.frequency.exponentialRampToValueAtTime(end, now + length);
  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(.001, now + length);
  osc.connect(gain);
  gain.connect(audio.destination);
  osc.start(now);
  osc.stop(now + length);
}

function play(sound, downed = 0) {
  if (detonationReplay.active && saved.sound) {
    detonationReplay.queueSound(() => playSound(sound, downed));
  } else {
    playSound(sound, downed);
  }
}

function playSound(sound, downed) {
  if (!saved.sound) return;
  try {
    const Audio = window.AudioContext || window.webkitAudioContext;
    audio ||= new Audio();
    if (audio.state === 'suspended') audio.resume().catch(() => {});
    if (sound === 'scan') {
      tone(410, 850, .19, 'sine', .07);
      tone(760, 1350, .2, 'sine', .05, .10);
    } else if (sound === 'win') {
      [392, 494, 587, 784].forEach((hz, i) => tone(hz, hz * .99, .25, 'triangle', .10, i * .085));
    } else {
      const heavy = ['blast', 'grenade', 'drone', 'tank', 'crush', 'fuel'].includes(sound);
      const drill = sound === 'drill';
      tone(heavy ? 115 : drill ? 290 : 182, heavy ? 32 : drill ? 65 : 48, heavy ? .29 : .13, drill ? 'sawtooth' : 'triangle', .18);
      tone(heavy ? 46 : 91, 27, heavy ? .33 : .095, 'sine', .17);
      if (sound === 'fuel' || sound === 'crush') {
        tone(61, 24, .68, 'triangle', .25);
        tone(91, 33, .43, 'sawtooth', .11, .07);
      }
      if (downed) {
        [685, 862, downed > 1 ? 1205 : 1045].forEach((hz, i) => tone(hz, hz * .98, .19, 'triangle', .11, .035 + i * .058));
      }
    }
  } catch {}
}

function soundLabel() {
  const button = $('#sound');
  button.textContent = saved.sound ? 'Sound on' : 'Sound off';
  button.setAttribute('aria-pressed', saved.sound);
}

function reset(index, contract = saved.contract, mode = null) {
  sticks.clear();
  clearTimeout(settleTimeout);
  settleTimeout = null;
  clearTimeout(toastTimeout);
  $('#toast').textContent = '';
  $('#feedback').replaceChildren();
  if (modal.open) modal.close();
  detonationReplay.reset();
  replays.reset();
  const arcade = arcadeModes[mode];
  const base = getJob(arcade?.base ?? index, contract);
  const job = mode === 'front' ? fronts[index] : arcade ? { ...base, name: arcade.name, mode, hits: arcade.hits ?? base.hits,
    troops: mode === 'convoy' ? 0 : mode === 'bunker' ? 3 : mode === 'trench' ? 4 : base.troops } : base;
  const stock = { hammer: Infinity, drill: job.drills, blast: job.charges, grenade: job.sites ? 14 : 10,
    drone: job.sites ? 10 : 6, tank: job.sites ? 7 : 5 };
  if (arcade?.tool) for (const tool of tools) stock[tool] = tool === arcade.tool ? arcade.hits : 0;
  if (mode === 'sandbox' || job.front) for (const tool of tools) stock[tool] = Infinity;
  const terrain = terrainFor(job);
  const voxels = buildJob(job, terrain);
  const cells = new Map(voxels.map(voxel => [key(voxel.x, voxel.y, voxel.z), voxel]));
  const squad = challengeSquad(mode, garrison(job, cells, terrain), cells, terrain);
  run = {
    index, job, hits: mode === 'sandbox' ? Infinity : job.hits, score: 0, tool: arcade?.tool ?? (mode === 'convoy' ? 'hammer' : 'drone'), ended: false, stock,
    combo: 0, bestCombo: 0, comboTime: 0, slow: 0, shot: 0,
    assets: job.front ? frontVehicles(job) : null,
    depots: job.front ? new Map(frontSupply().map(point => [key(point.x, point.y, point.z), point])) : null,
    patrolTime: 0,
    convoy: mode === 'convoy' ? spawnConvoy() : null, gaps: new Map(),
    stopped: 0, escaped: 0, crashCount: 0, truckCauses: new Set(),
    munitions: new Set(), chunks: new Set(), remote: null, fpvArmed: false, terrain, squad: new Set(squad),
    initialBlocks: voxels.length, cells,
  };
  yard.load(job, voxels, squad, terrain);
  for (const truck of run.assets ?? run.convoy ?? []) yard.drawOrdnance(truck);
  selectSector(0, 0);
  showRecon();
  keyboardAim = [.5, .53];
  crosshair.hidden = true;
  lastAim = null;
  pointer = null;
  viewport.classList.remove('dragging');
  $('.console').classList.toggle('arcade', Boolean(arcade || job.front));
  $('#briefing').textContent = job.front ? 'Destroy the nine supply depots and nine patrol vehicles marked in gold. Gold also requires clearing the troops. Drag to pan and use the district grid to jump across the city.' : arcade?.briefing ?? 'Recon marks moving infantry. Take out the supports to drop the floors above them.';
  $('#job-index').textContent = job.front ? 'CITY FRONT' : arcade ? (mode === 'sandbox' ? 'FREE PLAY' : 'CHALLENGE') : job.contract ? 'ENDLESS OP' : `OP ${String(index + 1).padStart(2, '0')} / ${jobs.length}`;
  $('#job-name').textContent = job.name;
  buildDistrictGrid();
  missionBar.setAttribute('aria-valuemax', job.front ? 18 : run.convoy ? 3 : job.troops);
  missionBar.setAttribute('aria-label', job.front ? 'Objectives destroyed' : run.convoy ? 'Trucks stopped' : 'Hostiles down');
  setView('iso', true);
  renderStats();
}

function scoreKey() {
  if (run.job.front) return `city-front-${run.index}`;
  return run.job.mode ?? (run.job.contract ? 'endless' : run.index);
}

function renderStats() {
  const { job, hits, score, ended, tool, stock, remote, squad } = run;
  const remaining = run.convoy?.size ?? squad.size;
  const assetsLeft = job.front ? run.depots.size + run.assets.size : null;
  const total = run.convoy ? 3 : job.troops;
  const downed = run.convoy ? run.stopped : total - remaining;
  const sandbox = job.mode === 'sandbox';
  $('#hostiles').textContent = remaining;
  $('#target-label').textContent = run.convoy ? 'TRUCKS LEFT' : 'HOSTILES LEFT';
  $('#total').textContent = `/ ${total}`;
  $('#hits').textContent = Number.isFinite(hits) ? hits : '∞';
  $('#combo-label').textContent = run.combo > 1 ? `×${run.combo} chain` : '';
  $('#score').textContent = number.format(score);
  $('#scans').textContent = yard.scanActive ? 'On' : 'Off';
  $('#aim-hint').textContent = job.front && !remote ? 'Tap to attack · Drag to pan' : remote ? (coarsePointer.matches ? 'Tap to steer' : 'Click to steer')
    : coarsePointer.matches ? 'Tap to attack · Drag to orbit' : 'Click to attack · Drag to orbit';
  $('#remote-bar').hidden = !remote;
  $('#remote-status').textContent = remote ? `${remotes[remote.type].label} · ${remote.flight ? 'Hovering' : remote.waiting ? 'Holding' : 'Moving'}` : '';
  $('#follow').setAttribute('aria-pressed', Boolean(yard.following));
  $('#fpv-toggle').setAttribute('aria-pressed', Boolean(yard.fpv || run.fpvArmed));
  $('#fpv-toggle').disabled = ended || (!remote && (!hits || (!stock.drone && !stock.tank)));
  for (const button of viewButtons) button.setAttribute('aria-pressed', !yard.fpv && button.dataset.view === yard.view);
  const flight = yard.fpv?.flight;
  arena.classList.toggle('flying', Boolean(flight));
  $('#fpv-controls').hidden = !flight;
  $('#fpv-telemetry').hidden = !flight;
  arena.classList.toggle('driving', yard.fpv?.type === 'tank');
  $('#fpv-alt-readout').hidden = yard.fpv?.type === 'tank';
  $('#fpv-lift').hidden = yard.fpv?.type === 'tank';
  $('#fpv-tap').textContent = yard.fpv?.type === 'tank' ? 'Tap to drive' : 'Tap to fly';
  if (flight) telemetry(yard.fpv);
  $('#fpv-reticle').hidden = !yard.fpv;
  $('#sector-bar').hidden = !job.sites || job.front || Boolean(yard.fpv);
  $('#city-nav').hidden = !job.front || Boolean(yard.fpv);
  $('#front-counts').hidden = !job.front;
  if (job.front) {
    $('#front-counts').textContent = `${run.depots.size} depots · ${run.assets.size} vehicles`;
    updateDistrictGrid();
  }
  if (run.fpvArmed && !remote) $('#aim-hint').textContent = `Tap to launch ${tool === 'tank' ? 'track bot' : 'FPV drone'}`;
  $('#cleared').textContent = `${Math.floor((1 - run.cells.size / run.initialBlocks) * 100)}%`;
  if (job.front) $('#objective').textContent = assetsLeft ? 'Front objectives' : 'Front secured';
  else if (run.convoy) refreshConvoyStatus();
  else $('#objective').textContent = sandbox ? 'Free play' : remaining ? 'Russian infantry' : 'Position clear';
  const best = saved.scores[scoreKey()]?.score;
  $('#best').textContent = best ? `Best ${number.format(best)}` : 'Best —';
  const progress = job.front ? 18 - assetsLeft : downed;
  missionBar.setAttribute('aria-valuenow', progress);
  missionBar.querySelector('i').style.width = `${progress / (job.front ? 18 : total) * 100}%`;
  $('#end-mission').hidden = sandbox;
  $('#end-mission').disabled = Boolean(assetsLeft ?? remaining) || ended || pendingWork();
  $('#scanner').disabled = ended;
  $('#scanner').setAttribute('aria-pressed', yard.scanActive);
  $('#scanner').classList.toggle('active', yard.scanActive);
  for (const button of toolButtons) {
    const id = button.dataset.tool;
    button.setAttribute('aria-pressed', tool === id);
    button.disabled = !stock[id] || ended || !hits || Boolean(remote);
    button.querySelector('b').textContent = stock[id] === Infinity ? '∞' : stock[id];
  }
}

function refreshConvoyStatus() {
  const seconds = convoySeconds(run.convoy);
  const label = !run.shot ? 'Convoy waiting · Fire to start' : !run.convoy.size
    ? (run.escaped ? `${run.escaped} escaped` : 'Convoy stopped')
    : seconds ? `Exit in ~${seconds}s${run.escaped ? ` · ${run.escaped} escaped` : ''}` : 'Convoy falling';
  const objective = $('#objective');
  if (objective.textContent !== label) objective.textContent = label;
}

function notify(message) {
  const toast = $('#toast');
  clearTimeout(toastTimeout);
  toast.textContent = message;
  toastTimeout = setTimeout(() => { toast.textContent = ''; }, 2200);
}

function popup(voxel, label, target = false) {
  const position = yard.project(voxel);
  const div = document.createElement('div');
  div.className = target ? 'popup target' : 'popup';
  div.textContent = label;
  div.style.left = `${Math.min(Math.max(position.x, 48), yard.width - 48)}px`;
  div.style.top = `${Math.max(94, position.y)}px`;
  $('#feedback').append(div);
  setTimeout(() => div.remove(), 950);
}

function showRecon() {
  yard.scan(run.squad);
  for (const [id, depot] of run.depots ?? []) yard.markAsset(id, depot, .35);
  for (const truck of run.assets ?? []) yard.markAsset(truck.marker, truck.position, 1.48);
}

function scan() {
  if (run.ended || modal.open) return;
  if (yard.scanActive) {
    yard.clearScan();
  } else {
    showRecon();
    play('scan');
  }
  renderStats();
}

function chooseTool(id) {
  if (run.ended || !run.hits || !run.stock[id] || run.remote) return;
  run.tool = id;
  if (!isRemote(id)) run.fpvArmed = false;
  renderStats();
}

function setView(view, immediate = false) {
  if (yard.fpv) {
    setPilot(null);
    run.fpvArmed = false;
    renderStats();
  }
  yard.setView(view, immediate);
  yard.highlight(null);
  for (const button of viewButtons) button.setAttribute('aria-pressed', button.dataset.view === view);
}

function aim(x, y, throughCover = false) {
  const path = yard.aim(x, y, run.cells);
  const range = (path[0]?.rayDistance ?? Infinity) + (throughCover ? 8 : 0);
  const vehicles = run.convoy ?? run.assets;
  return { path, person: yard.aimInfantry(run.squad, range), truck: vehicles && yard.aimTruck(vehicles, range) };
}

function infantryAim(person) {
  return { x: person.x, y: person.y + 1.12, z: person.z };
}

function highlightAim(x, y) {
  const { path, person, truck } = aim(x, y);
  yard.highlight(truck ? truckPoint(truck) : person ? infantryAim(person) : path[0]?.voxel);
}

function truckPoint(truck) {
  return { ...truck.position, y: truck.position.y + .7 };
}

function shoot(x, y) {
  if (run.ended || modal.open || (!run.hits && !run.remote)) return;
  const tool = run.tool;
  const { path, person, truck } = aim(x, y, !run.remote && tool === 'drill');
  const visiblePoint = truck ? truckPoint(truck) : person && infantryAim(person);
  if (run.remote) {
    const target = truck ? visiblePoint : person ? { ...visiblePoint, y: visiblePoint.y - .5 } : yard.aimPoint(path);
    if (target) {
      if (yard.fpv) guideFlight(run.remote, target);
      else redirect(run.remote, target, run.terrain);
      renderStats();
    }
    return;
  }

  const projectile = tool === 'grenade' || isRemote(tool);
  const target = projectile
    ? truck ? visiblePoint : person ? { ...visiblePoint, y: visiblePoint.y - .5 } : yard.aimPoint(path)
    : truck ? visiblePoint : path[0]?.voxel ?? visiblePoint;
  if (!target) return;
  const shot = ++run.shot;
  run.hits--;
  run.stock[tool]--;
  if (!run.stock[tool]) run.tool = 'hammer';
  if (!projectile) {
    const impact = path.length && !truck && (!person || tool === 'drill')
      ? strike(run.cells, path, tool) : explode(run.cells, target, tool);
    showImpact(impact, tool, { person, truck, shot });
    return;
  }

  const item = launch(tool, target, run.job, yard.azimuth, run.terrain);
  item.shot = shot;
  run.munitions.add(item);
  yard.drawOrdnance(item);
  if (isRemote(tool)) {
    run.remote = item;
    if (run.fpvArmed) {
      const at = item.position;
      if (tool === 'tank') placeTrackPilot(item, target, run.job, run.cells, run.terrain);
      else {
        at.y = Math.max(6.5, at.y);
        while (run.cells.has(key(Math.round(at.x), Math.floor(at.y + 1), Math.round(at.z)))) at.y++;
      }
      item.waiting = true;
      setPilot(item);
    }
    run.fpvArmed = false;
  }
  renderStats();
}

function pendingWork() {
  return Boolean(detonationReplay.active || run.munitions.size || run.chunks.size || [...run.squad].some(person => person.fallStart !== null));
}

function maybeSettle() {
  const convoyDone = run.convoy && !run.convoy.size;
  if ((!convoyDone && (run.hits || run.convoy?.size)) || run.ended || pendingWork() || settleTimeout) return;
  settleTimeout = setTimeout(() => {
    settleTimeout = null;
    if (!modal.open) finish();
  }, 850);
}

function removeInfantry(person) {
  if (!run.squad.delete(person)) return;
  yard.removeInfantry(person);
  if (!run.squad.size && !run.job.front && run.job.mode !== 'sandbox') notify('Position clear · End mission or keep demolishing');
}

function scoreEvent(points, links) {
  if (!points) return 0;
  run.combo = Math.min(12, run.combo + links);
  run.bestCombo = Math.max(run.bestCombo, run.combo);
  run.comboTime = 2.6;
  const scored = Math.round(points * (1 + Math.max(0, run.combo - 1) * .2));
  run.score += scored;
  return scored;
}

function stopTruck(truck, shot, crashed = false) {
  if (!(run.convoy ?? run.assets).delete(truck)) return;
  run.stopped++;
  if (crashed) run.crashCount++;
  run.truckCauses.add(shot);
  yard.removeOrdnance(truck);
  const target = truckPoint(truck);
  const radius = truck.type === 'fuel-truck' ? fuelRadius : truck.type === 'armor-truck' ? 3.1 : 2.4;
  scoreEvent(900, 1);
  popup(target, crashed ? 'BRIDGE CRASH' : 'TRUCK STOPPED', true);
  showImpact(explode(run.cells, target, 'fuel', radius), 'fuel', { radius, shot });
}

function showImpact({ target, broken, damaged, falling, blasts }, tool, {
  person: direct = null, truck: directTruck = null, radius = impactRadius[tool], shot = run.shot,
} = {}) {
  damaged.forEach(voxel => yard.damage(voxel));
  const areas = [[target, radius ?? 0], ...blasts.map(barrel => [barrel, impactRadius[barrel.kind]])];
  const inRange = at => areas.some(([center, reach]) => reach > 0 &&
    Math.hypot(at.x - center.x, at.y - center.y, at.z - center.z) <= reach);
  for (const barrel of blasts) {
    if (barrel.kind !== 'supply') continue;
    const id = key(barrel.x, barrel.y, barrel.z);
    if (run.depots?.delete(id)) {
      yard.removeAssetMarker(id);
      scoreEvent(1000, 1);
      popup(barrel, 'DEPOT DESTROYED', true);
    }
  }
  let downed = 0;
  for (const person of run.squad) {
    if (person === direct || inRange(infantryAim(person))) {
      removeInfantry(person);
      downed++;
    } else if (tool !== 'hammer' && Math.hypot(person.x - target.x, person.y - target.y, person.z - target.z) < 7) {
      person.threat = target;
      person.wait = 0;
      person.next = null;
    }
  }
  const rememberGap = ({ x, y, z }) => {
    if (y === deckHeight && z === 0) run.gaps.set(x, shot);
  };
  if (run.convoy) broken.forEach(rememberGap);
  let collapseSize = 0;
  for (const group of falling) {
    const chunk = fallingChunk(group, target);
    chunk.shot = shot;
    run.chunks.add(chunk);
    yard.drawChunk(chunk, chunkPoint);
    collapseSize += group.length;
    if (run.convoy) group.forEach(rememberGap);
  }
  const weight = broken.length + collapseSize * 2 + blasts.length * 20 + downed * 15 + (tool === 'fuel' ? 30 : 0);
  if (!detonationReplay.active && weight >= 30) replays.start(target, weight);
  if (weight >= 85 && run.slow <= 0 && !yard.reduceMotion && !yard.fpv) run.slow = .85;
  const links = Math.max(1, downed + blasts.length + Number(collapseSize >= 8));
  const points = scoreEvent(broken.length * 7 + downed * 550 + collapseSize * 10 + blasts.length * 120, links);
  if (broken.length || tool !== 'crush' || blasts.length) yard.destroy(broken, target, run.cells, tool, blasts);
  if (downed) {
    popup(target, downed === 1 ? 'HOSTILE DOWN' : `${downed} HOSTILES DOWN`, true);
  } else if (blasts.length > 1) {
    popup(target, `${blasts.length} BARREL CHAIN`);
  } else if (collapseSize > 3) {
    popup(target, `${collapseSize} BLOCKS FALLING`);
  } else if (points && tool !== 'crush') {
    popup(target, `+${number.format(points)}`);
  }
  if (tool !== 'crush' || broken.length || downed) play(blasts.length && (tool === 'hammer' || tool === 'drill') ? 'blast' : tool, downed);
  const vehicles = run.convoy ?? run.assets;
  if (vehicles) {
    for (const truck of [...vehicles]) {
      if (truck === directTruck || inRange(truckPoint(truck))) stopTruck(truck, truck.drop ?? shot);
    }
  }
  renderStats();
  if (lastAim) highlightAim(lastAim.x, lastAim.y);
  else yard.highlight(null);
  maybeSettle();
}

function detonate(item) {
  if (!item || run.ended || modal.open || !run.munitions.delete(item)) return;
  if (yard.fpv === item) detonationReplay.begin(yard, item.position);
  if (run.remote === item) run.remote = null;
  if (item.flight) sticks.clear();
  yard.removeOrdnance(item);
  const { x, y, z } = item.position;
  showImpact(explode(run.cells, { x, y: y + .5, z }, item.type), item.type, { shot: item.shot });
}

function hitsTarget({ x, y, z }) {
  const vehicles = run.convoy ?? run.assets;
  if (vehicles) {
    for (const truck of vehicles) {
      const at = truckPoint(truck);
      if (Math.abs(x - at.x) < 1.65 && Math.hypot(y - at.y, z - at.z) < 1) return true;
    }
  }
  for (const person of run.squad) {
    if (Math.hypot(x - person.x, y - person.y - .62, z - person.z) < .63) return true;
  }
  return false;
}

yard.simulate = dt => {
  if (!run || run.ended || modal.open || document.hidden ||
    detonationReplay.aftermathComplete) return;
  if (run.combo && !run.chunks.size && ![...run.squad].some(person => person.fallStart !== null)) {
    run.comboTime -= dt;
    if (run.comboTime <= 0) {
      run.combo = 0;
      $('#combo-label').textContent = '';
    }
  }
  if (run.convoy?.size && run.shot) {
    for (const truck of [...run.convoy]) {
      if (!run.convoy.has(truck)) continue;
      const result = updateTruck(truck, dt, run.cells, run.gaps);
      if (result === 'crash') stopTruck(truck, truck.drop, true);
      else if (result === 'escaped') {
        run.convoy.delete(truck);
        run.escaped++;
        yard.removeOrdnance(truck);
        renderStats();
      } else yard.drawOrdnance(truck);
    }
    refreshConvoyStatus();
  }
  if (run.assets?.size) {
    run.patrolTime += dt;
    if (run.patrolTime >= .08) {
      for (const truck of run.assets) {
        patrol(truck, run.patrolTime);
        yard.drawOrdnance(truck);
      }
      run.patrolTime = 0;
    }
  }
  for (const item of run.munitions) {
    const wasWaiting = item.waiting;
    let impact;
    if (item.flight && item.type === 'tank') {
      impact = advanceTrack(item, dt, sticks.sample(), at => trackCollision(at, run.job, run.cells),
        at => groundAt(run.terrain, at.x, at.z) + remotes.tank.lift);
    } else if (item.flight) {
      impact = advanceFlight(item, dt, sticks.sample(), at => at.y < groundAt(run.terrain, at.x, at.z) + .5 ||
        flightCollision(at, run.job, run.cells, run.terrain));
    } else {
      impact = advance(item, dt, run.cells, run.terrain) || (isRemote(item.type) && hitsTarget(item.position));
    }
    if (item.flight && item.age >= nextTelemetry) {
      nextTelemetry = item.age + .085;
      telemetry(item);
    }
    if (impact) {
      detonate(item);
    } else {
      if (item.type !== 'tank' || !item.waiting || !wasWaiting) yard.drawOrdnance(item);
      if (item === run.remote && item.waiting !== wasWaiting) renderStats();
    }
  }
  for (const chunk of [...run.chunks]) {
    const contact = fall(chunk, dt, run.cells, (x, z) => groundAt(run.terrain, x, z));
    if (!contact) {
      yard.drawChunk(chunk, chunkPoint);
      continue;
    }
    run.chunks.delete(chunk);
    yard.landChunk(chunk, contact, chunkPoint);
    if (contact.speed > 3 && chunk.mass >= 2) {
      showImpact(explode(run.cells, contact, 'crush', contact.radius), 'crush', { radius: contact.radius, shot: chunk.shot });
    } else {
      renderStats();
    }
  }
  for (const person of run.squad) {
    const result = updateInfantry(person, dt, run.cells, run.job, run.terrain);
    if (result === 'move') yard.drawInfantry(person);
    if (result === 'down') {
      removeInfantry(person);
      scoreEvent(550, 1);
      popup(infantryAim(person), 'HOSTILE DOWN', true);
      renderStats();
    }
  }
  maybeSettle();
};

function openModal(title) {
  detonationReplay.close();
  sticks.clear();
  $('#modal-title').textContent = title;
  body.replaceChildren();
  if (!modal.open) modal.showModal();
}

function action(label, callback, primary = false) {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = label;
  if (primary) button.className = 'modal-primary';
  button.addEventListener('click', callback);
  return button;
}

function finish() {
  if (run.ended || run.job.mode === 'sandbox' || pendingWork() || run.convoy?.size) return;
  clearTimeout(settleTimeout);
  const { job, squad, index, hits, convoy, stopped, escaped } = run;
  const singleCollapse = Boolean(convoy && stopped === 3 && run.crashCount && run.truckCauses.size === 1 && !run.truckCauses.has(0));
  const won = job.front ? !run.assets.size && !run.depots.size : convoy ? stopped === 3 : !squad.size;
  if (job.front && !won) return;
  const medal = !won ? 0 : job.front ? (!squad.size ? 3 : squad.size <= job.troops / 2 ? 2 : 1) : convoy ? (singleCollapse ? 3 : run.shot <= 4 ? 2 : 1)
    : hits >= job.hits * .65 ? 3 : hits >= job.hits * .32 ? 2 : 1;
  run.ended = true;
  if (medal) {
    const score = run.score + (Number.isFinite(hits) ? hits * 60 : 0) + (medal === 3 ? 700 : 0);
    run.score = score;
    const previous = saved.scores[scoreKey()];
    saved.scores[scoreKey()] = { score: Math.max(previous?.score || 0, score), medal: Math.max(previous?.medal || 0, medal) };
    if (!job.front && !job.mode && index === saved.unlocked && index < jobs.length) {
      while (saved.unlocked < jobs.length && saved.scores[saved.unlocked]) saved.unlocked++;
    }
    if (job.contract) saved.contract = Math.max(saved.contract, job.contract + 1);
    save();
    play('win');
  }
  yard.clearScan();
  yard.highlight(null);
  renderStats();

  openModal(job.front ? 'Front secured' : convoy ? (won ? 'Convoy stopped' : 'Convoy escaped') : (won ? 'Position clear' : 'Mission incomplete'));
  const summary = document.createElement('p');
  const stars = '★'.repeat(medal);
  summary.textContent = job.front ? `${stars} · All depots and vehicles destroyed. ${job.troops - squad.size}/${job.troops} troops cleared.` : convoy
    ? won ? `${stars} · ${singleCollapse ? 'All three trucks stopped in one collapse.' : 'All three trucks stopped.'}`
      : `${escaped} of 3 trucks escaped. Hit a bridge pier earlier to cut off the convoy.`
    : won ? `${stars} · All hostiles down.`
      : `${squad.size} hostile${squad.size === 1 ? '' : 's'} remain. Use Recon to locate the squad.`;
  const stats = document.createElement('div');
  stats.className = 'result-stats';
  const goal = job.front ? ['OBJECTIVES', '18/18'] : convoy ? ['TRUCKS STOPPED', `${stopped}/3`] : ['HOSTILES DOWN', `${job.troops - squad.size}/${job.troops}`];
  for (const [label, value] of [goal, ['BEST CHAIN', `×${run.bestCombo}`], ['SCORE', number.format(run.score)]]) {
    const tile = document.createElement('div');
    const title = document.createElement('span');
    const amount = document.createElement('strong');
    title.textContent = label;
    amount.textContent = value;
    tile.append(title, amount);
    stats.append(tile);
  }
  const actions = document.createElement('div');
  actions.className = 'modal-actions';
  actions.append(action('Retry', () => reset(index, job.contract, job.front ? 'front' : job.mode), !won));
  if (replays.ready()) actions.append(action('Watch replay', () => showReplay(finishSummary)));
  if (job.front) {
    actions.append(index < fronts.length - 1
      ? action('Next front', () => reset(index + 1, saved.contract, 'front'), true)
      : action('City fronts', frontBoard, true));
  } else if (won && !job.mode) {
    const label = index === jobs.length - 1 ? 'Endless missions' : 'Next mission';
    actions.append(action(label, () => reset(Math.min(index + 1, jobs.length)), true));
  } else {
    actions.append(action(job.mode ? 'Challenges' : 'Missions', jobBoard, won));
  }
  body.append(summary, stats, actions);

  function finishSummary() {
    openModal(job.front ? 'Front secured' : convoy ? (won ? 'Convoy stopped' : 'Convoy escaped') : (won ? 'Position clear' : 'Mission incomplete'));
    body.append(summary, stats, actions);
  }
}

function showReplay(back) {
  if (!replays.ready()) return;
  openModal('Destruction replay');
  const canvas = document.createElement('canvas');
  canvas.className = 'replay-screen';
  canvas.setAttribute('aria-label', 'Replay of the biggest impact');
  const actions = document.createElement('div');
  actions.className = 'modal-actions';
  const restart = action('Play again', playClip);
  actions.append(restart, action('Back', back ?? (() => modal.close()), true));
  body.append(canvas, actions);
  playClip();

  function playClip() {
    restart.disabled = true;
    replays.play(canvas, () => modal.open && canvas.isConnected, () => { restart.disabled = false; });
  }
}

let districtButtons = [];

function districtIndex(at) {
  return Math.max(0, Math.min(2, Math.round(at.z / 38) + 1)) * 3 +
    Math.max(0, Math.min(2, Math.round(at.x / 42) + 1));
}

function buildDistrictGrid() {
  const grid = $('#district-grid');
  grid.replaceChildren();
  districtButtons = [];
  $('#district-name').textContent = 'Whole city';
  if (!run.job.front) return;
  districtButtons = run.job.districts.map((name, index) => {
    const button = action(String(index + 1), () => {
      yard.follow(null);
      yard.setMap(...districtCenter(index), 3.45);
      refreshMap();
    });
    button.dataset.district = index;
    grid.append(button);
    return button;
  });
  refreshMap();
}

function updateDistrictGrid() {
  const counts = Array(9).fill(0);
  for (const depot of run.depots.values()) counts[districtIndex(depot)]++;
  for (const vehicle of run.assets) counts[districtIndex(vehicle.position)]++;
  districtButtons.forEach((button, index) => {
    const name = run.job.districts[index];
    const label = `${name} · ${counts[index]} objectives left`;
    button.dataset.clear = counts[index] === 0;
    button.setAttribute('aria-label', label);
    button.title = label;
  });
}

function refreshMap() {
  if (!run.job.front) return;
  const current = yard.mapZoom > 1.2 ? districtIndex({ x: yard.panCenter[0], z: yard.panCenter[1] }) : -1;
  $('#district-name').textContent = run.job.districts[current] ?? 'Whole city';
  districtButtons.forEach((button, index) => button.setAttribute('aria-pressed', index === current));
  $('#map-out').disabled = yard.mapZoom <= 1;
  $('#map-in').disabled = yard.mapZoom >= 7;
}

function changeMapZoom(factor) {
  yard.follow(null);
  yard.setMap(...yard.panCenter, yard.mapZoom * factor);
  refreshMap();
}

function frontBoard() {
  openModal('City Fronts');
  const list = document.createElement('div');
  list.className = 'job-list arcade-list';
  fronts.forEach((front, index) => {
    const button = action('', () => reset(index, saved.contract, 'front'));
    const title = document.createElement('strong');
    const status = document.createElement('span');
    const best = saved.scores[`city-front-${index}`];
    title.textContent = front.name;
    status.textContent = best ? `${'★'.repeat(best.medal)} ${number.format(best.score)}` : '9 districts';
    button.append(title, status);
    list.append(button);
  });
  const intro = document.createElement('p');
  intro.textContent = 'Unlimited equipment. Destroy depots and patrol vehicles across the city. Clear the troops to earn gold.';
  body.append(intro, list);
}

function jobBoard() {
  openModal('Missions');
  const list = document.createElement('div');
  list.className = 'job-list';
  const arcade = document.createElement('div');
  arcade.className = 'job-list arcade-list';
  for (const [mode, entry] of Object.entries(arcadeModes)) {
    const record = saved.scores[mode];
    const button = action('', () => reset(entry.base, saved.contract, mode));
    const title = document.createElement('strong');
    title.textContent = entry.name;
    const status = document.createElement('span');
    status.textContent = record ? `${'★'.repeat(record.medal)}  ${number.format(record.score)}` : entry.label;
    button.append(title, status);
    arcade.append(button);
  }
  [...jobs, { name: 'Endless missions' }].forEach((job, index) => {
    const button = action('', () => reset(index));
    const title = document.createElement('strong');
    const status = document.createElement('span');
    title.textContent = job.name;
    button.disabled = index > saved.unlocked && !job.sites;
    const record = saved.scores[index === jobs.length ? 'endless' : index];
    status.textContent = button.disabled ? 'Locked' : record ? `${'★'.repeat(record.medal)}  ${number.format(record.score)}` : index === run.index ? 'Current' : job.sites ? `${job.w} × ${job.d}` : 'Play';
    button.append(title, status);
    list.append(button);
  });
  const city = action('City Fronts', frontBoard, true);
  city.classList.add('city-board-link');
  body.append(city, arcade, list);
}

function showHelp() {
  openModal('How to play');
  body.innerHTML = `
    <p>Lead a Ukrainian drone team through fictional positions held by Russian infantry. Clear the squad to unlock the next mission. You can keep demolishing after the position is clear.</p>
    <dl class="help-grid">
      <dt>Click / tap</dt><dd>Attack a soldier or structure. Drag to orbit.</dd>
      <dt>Arrows / Space</dt><dd>Aim and hit when the site has focus.</dd>
      <dt>1–6</dt><dd>Select a tool, grenade, drone, or track bot.</dd>
      <dt>R</dt><dd>Toggle recon markers for moving infantry.</dd>
      <dt>F</dt><dd>Detonate the active drone or bot.</dd>
      <dt>V / Q / E</dt><dd>Change view or rotate the camera.</dd>
    </dl>
    <p>Hit barrels or keep debris falling to build a scoring chain. Open Missions for Bridge Breaker, the two-charge bunker, Trench Run, and the unlimited-ammo Sandbox.</p>
    <p>Destroy supports to bring down floors and walls. Tap again to steer a drone or bot, then detonate it or let it hit the target. Select the FPV drone or Track bot, turn on FPV, then tap a launch point. The stick moves the drone. Drag the view to look around or tap a spot to fly there. Rise and Lower adjust altitude. Let go to stop and hover. On keyboard, use W/A/S/D to move, Q/E to turn, and ↑/↓ for altitude. FPV detonations replay the last three seconds from the map camera. Track bot FPV steers left and right with the stick and follows the terrain. City Fronts have map zoom, drag to pan, and a district grid.</p>`;
  const actions = document.createElement('div');
  actions.className = 'modal-actions';
  actions.append(action('Back to mission', () => modal.close(), true));
  body.append(actions);
}

function eventPosition(event) {
  const rect = viewport.getBoundingClientRect();
  return { x: event.clientX - rect.left, y: event.clientY - rect.top };
}

function showKeyboardAim() {
  crosshair.hidden = false;
  crosshair.style.left = `${keyboardAim[0] * 100}%`;
  crosshair.style.top = `${keyboardAim[1] * 100}%`;
  const x = keyboardAim[0] * yard.width;
  const y = keyboardAim[1] * yard.height;
  lastAim = { x, y };
  highlightAim(x, y);
}

viewport.addEventListener('pointerdown', event => {
  if (run.job.front && !yard.fpv && pointer && event.pointerType === 'touch' && !pointer.pinch) {
    pointer.pinch = { id: event.pointerId, x: event.clientX, y: event.clientY };
    pointer.moved = true;
    viewport.setPointerCapture(event.pointerId);
    return;
  }
  if (pointer || (!yard.fpv && !event.isPrimary) || event.button !== 0 || modal.open) return;
  pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, lastX: event.clientX, lastY: event.clientY, moved: false };
  viewport.setPointerCapture(event.pointerId);
  viewport.focus({ preventScroll: true });
  crosshair.hidden = true;
});
viewport.addEventListener('pointermove', event => {
  if (modal.open) return;
  if (pointer?.pinch) {
    const second = pointer.pinch;
    const before = Math.hypot(pointer.lastX - second.x, pointer.lastY - second.y);
    if (event.pointerId === second.id) {
      second.x = event.clientX;
      second.y = event.clientY;
    } else if (event.pointerId === pointer.id) {
      pointer.lastX = event.clientX;
      pointer.lastY = event.clientY;
    } else return;
    const after = Math.hypot(pointer.lastX - second.x, pointer.lastY - second.y);
    if (before > 10 && after > 10) changeMapZoom(after / before);
    return;
  }
  if (!yard.fpv && !event.isPrimary) return;
  if (pointer?.id === event.pointerId) {
    if (Math.hypot(event.clientX - pointer.x, event.clientY - pointer.y) > 7) pointer.moved = true;
    if (pointer.moved) {
      viewport.classList.add('dragging');
      if (yard.fpv) {
        yard.fpv.yaw -= (event.clientX - pointer.lastX) * .006;
        yard.fpv.flight.pitch = clamp(yard.fpv.flight.pitch - (event.clientY - pointer.lastY) * .006, -.85, .68);
      } else if (run.job.front && !event.shiftKey) {
        if (yard.following) yard.follow(null);
        yard.moveMap(event.clientX - pointer.lastX, event.clientY - pointer.lastY);
        refreshMap();
        yard.highlight(null);
      } else {
        yard.turn((event.clientX - pointer.lastX) * .009, true);
        yard.highlight(null);
      }
      pointer.lastX = event.clientX;
      pointer.lastY = event.clientY;
    }
  } else if (!yard.fpv && event.pointerType === 'mouse') {
    crosshair.hidden = true;
    lastAim = eventPosition(event);
    if (!run.ended) highlightAim(lastAim.x, lastAim.y);
  }
});
viewport.addEventListener('pointerup', event => {
  if (pointer?.pinch?.id === event.pointerId) {
    pointer.pinch = null;
    return;
  }
  if (pointer?.id !== event.pointerId) return;
  const { x, y } = eventPosition(event);
  if (!pointer.moved && x >= 0 && x <= yard.width && y >= 0 && y <= yard.height) shoot(x, y);
  pointer = null;
  viewport.classList.remove('dragging');
});
for (const event of ['lostpointercapture', 'pointercancel']) {
  viewport.addEventListener(event, event => {
    if (pointer?.pinch?.id === event.pointerId) {
      pointer.pinch = null;
      return;
    }
    if (pointer?.id !== event.pointerId) return;
    pointer = null;
    viewport.classList.remove('dragging');
  });
}
viewport.addEventListener('pointerleave', () => {
  lastAim = null;
  yard.highlight(null);
});
viewport.addEventListener('blur', () => { crosshair.hidden = true; });

function selectSector(x, z) {
  if (x || z) setView('top');
  yard.setSector(x, z);
  for (const button of $$('[data-sector]')) button.setAttribute('aria-pressed', button.dataset.sector === `${x},${z}`);
}

function toggleFPV() {
  if (run.remote) {
    yard.follow(null);
    setPilot(yard.fpv ? null : run.remote);
  } else if (run.hits && !run.ended) {
    if (!isRemote(run.tool)) run.tool = run.stock.drone ? 'drone' : 'tank';
    if (!run.stock[run.tool]) return;
    run.fpvArmed = !run.fpvArmed;
  }
  renderStats();
}

const movement = { ArrowUp: [0, -.018], ArrowDown: [0, .018], ArrowLeft: [-.018, 0], ArrowRight: [.018, 0] };
document.addEventListener('keydown', event => {
  if (detonationReplay.active) {
    if (event.key === 'Escape') detonationReplay.close();
    return;
  }
  if (modal.open || event.altKey || event.ctrlKey || event.metaKey) return;
  const input = event.key.toLowerCase();
  if (yard.fpv && sticks.press(input)) {
    event.preventDefault();
  } else if (!yard.fpv && event.target === viewport && movement[event.key]) {
    event.preventDefault();
    keyboardAim = keyboardAim.map((value, i) => Math.min(.97, Math.max(.03, value + movement[event.key][i])));
    showKeyboardAim();
  } else if (!yard.fpv && event.target === viewport && (event.key === ' ' || event.key === 'Enter')) {
    event.preventDefault();
    if (!event.repeat) {
      showKeyboardAim();
      shoot(lastAim.x, lastAim.y);
    }
  } else if (!event.repeat && toolsByKey[input]) {
    chooseTool(toolsByKey[input]);
  } else if (!event.repeat && input === 'f' && run.remote) {
    detonate(run.remote);
  } else if (!event.repeat && input === 'r') {
    scan();
  } else if (!event.repeat && input === 'v') {
    setView(views[(views.indexOf(yard.view) + 1) % views.length]);
  } else if (input === 'q' || input === 'e') {
    yard.turn(input === 'q' ? -.48 : .48);
    yard.highlight(null);
  }
});

document.addEventListener('keyup', event => sticks.release(event.key.toLowerCase()));
window.addEventListener('blur', () => sticks.clear());
document.addEventListener('visibilitychange', () => { if (document.hidden) sticks.clear(); });

for (const button of toolButtons) button.addEventListener('click', () => chooseTool(button.dataset.tool));
for (const button of viewButtons) button.addEventListener('click', () => setView(button.dataset.view));
for (const button of $$('[data-turn]')) {
  button.addEventListener('click', () => {
    yard.turn(Number(button.dataset.turn) * .6);
    yard.highlight(null);
  });
}
$('#retry').addEventListener('click', () => reset(run.index, run.job.contract, run.job.front ? 'front' : run.job.mode));
$('#end-mission').addEventListener('click', finish);
$('#watch-replay').addEventListener('click', () => showReplay());
$('#sandbox-button').addEventListener('click', () => reset(arcadeModes.sandbox.base, saved.contract, 'sandbox'));
$('#scanner').addEventListener('click', scan);
$('#detonate').addEventListener('click', () => detonate(run.remote));
$('#follow').addEventListener('click', () => {
  if (yard.fpv) setPilot(null);
  yard.follow(yard.following ? null : run.remote);
  renderStats();
});
$('#fpv-toggle').addEventListener('click', toggleFPV);
for (const button of $$('[data-sector]')) button.addEventListener('click', () => selectSector(...button.dataset.sector.split(',').map(Number)));
$('#front-button').addEventListener('click', frontBoard);
$('#map-in').addEventListener('click', () => changeMapZoom(1.55));
$('#map-out').addEventListener('click', () => changeMapZoom(1 / 1.55));
$('#map-all').addEventListener('click', () => {
  yard.follow(null);
  yard.setMap(0, 0, 1);
  refreshMap();
});
viewport.addEventListener('wheel', event => {
  if (!run.job.front || yard.fpv || modal.open) return;
  event.preventDefault();
  changeMapZoom(Math.exp(clamp(-event.deltaY, -160, 160) * .002));
}, { passive: false });
$('#jobs-button').addEventListener('click', jobBoard);
$('#help').addEventListener('click', showHelp);
$('#close-modal').addEventListener('click', () => modal.close());
$('#sound').addEventListener('click', () => {
  saved.sound = !saved.sound;
  soundLabel();
  save();
  play('scan');
});
modal.addEventListener('close', () => {
  if (!run.ended && !run.hits) maybeSettle();
});
arena.addEventListener('contextmenu', event => event.preventDefault());

soundLabel();
const params = new URLSearchParams(location.search);
const requested = Number(params.get('mission')) - 1;
const mode = params.get('mode');
const chosen = Number.isInteger(requested) && requested >= 0 && (requested <= saved.unlocked || jobs[requested]?.sites) && requested < jobs.length;
const requestedFront = Number(params.get('front')) - 1;
if (Number.isInteger(requestedFront) && fronts[requestedFront]) reset(requestedFront, saved.contract, 'front');
else if (Object.hasOwn(arcadeModes, mode)) reset(arcadeModes[mode].base, saved.contract, mode);
else reset(chosen ? requested : Math.min(saved.unlocked, jobs.length));
