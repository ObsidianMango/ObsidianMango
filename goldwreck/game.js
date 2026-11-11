import { Yard } from './scene.js?v=3';
import { jobs, getJob, buildJob, key, impactRadius, strike, explode } from './jobs.js?v=3';
import { advance, isRemote, launch, redirect, remotes } from './ordnance.js?v=3';
import { fallingChunk, fall, chunkPoint } from './collapse.js';
import { garrison, updateInfantry } from './infantry.js';

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const viewport = $('#viewport');
const arena = $('.arena');
const yard = new Yard(viewport);
const modal = $('#modal');
const body = $('#modal-body');
const missionBar = $('#mission-progress');
const crosshair = $('#crosshair');
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
      const heavy = ['blast', 'grenade', 'drone', 'tank', 'crush'].includes(sound);
      const drill = sound === 'drill';
      tone(heavy ? 115 : drill ? 290 : 182, heavy ? 32 : drill ? 65 : 48, heavy ? .29 : .13, drill ? 'sawtooth' : 'triangle', .18);
      tone(heavy ? 46 : 91, 27, heavy ? .33 : .095, 'sine', .17);
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

function reset(index, contract = saved.contract) {
  clearTimeout(settleTimeout);
  settleTimeout = null;
  clearTimeout(toastTimeout);
  $('#toast').textContent = '';
  $('#feedback').replaceChildren();
  if (modal.open) modal.close();
  const job = getJob(index, contract);
  const voxels = buildJob(job);
  const cells = new Map(voxels.map(voxel => [key(voxel.x, voxel.y, voxel.z), voxel]));
  const squad = garrison(job, cells);
  run = {
    index, job, hits: job.hits, score: 0, combo: 0, tool: 'drone', ended: false,
    stock: { hammer: Infinity, drill: job.drills, blast: job.charges, grenade: 10, drone: 6, tank: 5 },
    munitions: new Set(), chunks: new Set(), remote: null, squad: new Set(squad),
    initialBlocks: voxels.length, cells,
  };
  yard.load(job, voxels, squad);
  yard.scan(run.squad);
  keyboardAim = [.5, .53];
  crosshair.hidden = true;
  lastAim = null;
  pointer = null;
  viewport.classList.remove('dragging');
  $('#job-index').textContent = job.contract ? 'ENDLESS OP' : `OP 0${index + 1} / 0${jobs.length}`;
  $('#job-name').textContent = job.name;
  missionBar.setAttribute('aria-valuemax', job.troops);
  setView('iso', true);
  renderStats();
}

function scoreKey() {
  return run.job.contract ? 'endless' : run.index;
}

function renderStats() {
  const { job, hits, score, ended, tool, stock, remote, squad } = run;
  const remaining = squad.size;
  const downed = job.troops - remaining;
  $('#hostiles').textContent = remaining;
  $('#total').textContent = `/ ${job.troops}`;
  $('#hits').textContent = hits;
  $('#score').textContent = number.format(score);
  $('#scans').textContent = yard.scanActive ? 'On' : 'Off';
  $('#aim-hint').textContent = remote ? (coarsePointer.matches ? 'Tap to steer' : 'Click to steer')
    : coarsePointer.matches ? 'Tap to attack · Drag to orbit' : 'Click to attack · Drag to orbit';
  $('#remote-bar').hidden = !remote;
  $('#remote-status').textContent = remote ? `${remotes[remote.type].label} · ${remote.waiting ? 'Holding' : 'Moving'}` : '';
  $('#follow').setAttribute('aria-pressed', Boolean(yard.following));
  $('#cleared').textContent = `${Math.floor((1 - run.cells.size / run.initialBlocks) * 100)}%`;
  $('#objective').textContent = remaining ? 'Russian infantry' : 'Position clear';
  const best = saved.scores[scoreKey()]?.score;
  $('#best').textContent = best ? `Best ${number.format(best)}` : 'Best —';
  missionBar.setAttribute('aria-valuenow', downed);
  missionBar.querySelector('i').style.width = `${downed / job.troops * 100}%`;
  $('#end-mission').disabled = Boolean(remaining) || ended || pendingWork();
  $('#scanner').disabled = ended;
  $('#scanner').setAttribute('aria-pressed', yard.scanActive);
  $('#scanner').classList.toggle('active', yard.scanActive);
  for (const button of toolButtons) {
    const id = button.dataset.tool;
    button.setAttribute('aria-pressed', tool === id);
    button.disabled = !stock[id] || ended || !hits || Boolean(remote);
    button.querySelector('b').textContent = id === 'hammer' ? '∞' : stock[id];
  }
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

function scan() {
  if (run.ended || modal.open) return;
  if (yard.scanActive) {
    yard.clearScan();
  } else {
    yard.scan(run.squad);
    play('scan');
  }
  renderStats();
}

function chooseTool(id) {
  if (run.ended || !run.hits || !run.stock[id] || run.remote) return;
  run.tool = id;
  renderStats();
}

function setView(view, immediate = false) {
  yard.setView(view, immediate);
  yard.highlight(null);
  for (const button of viewButtons) button.setAttribute('aria-pressed', button.dataset.view === view);
}

function aim(x, y, throughCover = false) {
  const path = yard.aim(x, y, run.cells);
  const range = (path[0]?.rayDistance ?? Infinity) + (throughCover ? 8 : 0);
  return { path, person: yard.aimInfantry(run.squad, range) };
}

function infantryAim(person) {
  return { x: person.x, y: person.y + 1.12, z: person.z };
}

function highlightAim(x, y) {
  const { path, person } = aim(x, y);
  yard.highlight(person ? infantryAim(person) : path[0]?.voxel);
}

function shoot(x, y) {
  if (run.ended || modal.open || (!run.hits && !run.remote)) return;
  const tool = run.tool;
  const { path, person } = aim(x, y, !run.remote && tool === 'drill');
  const visiblePoint = person && infantryAim(person);
  if (run.remote) {
    const target = person ? { ...visiblePoint, y: visiblePoint.y - .5 } : yard.aimPoint(path);
    if (target) {
      redirect(run.remote, target);
      renderStats();
    }
    return;
  }

  const projectile = tool === 'grenade' || isRemote(tool);
  const target = projectile
    ? person ? { ...visiblePoint, y: visiblePoint.y - .5 } : yard.aimPoint(path)
    : path[0]?.voxel ?? visiblePoint;
  if (!target) return;
  run.hits--;
  run.stock[tool]--;
  if (!run.stock[tool]) run.tool = 'hammer';
  if (!projectile) {
    const impact = path.length && (!person || tool === 'drill')
      ? strike(run.cells, path, tool) : explode(run.cells, visiblePoint, tool);
    showImpact(impact, tool, person);
    return;
  }

  const item = launch(tool, target, run.job, yard.azimuth);
  run.munitions.add(item);
  yard.drawOrdnance(item);
  if (isRemote(tool)) run.remote = item;
  renderStats();
}

function pendingWork() {
  return Boolean(run.munitions.size || run.chunks.size || [...run.squad].some(person => person.fallStart !== null));
}

function maybeSettle() {
  if (run.hits || pendingWork() || settleTimeout) return;
  settleTimeout = setTimeout(() => {
    settleTimeout = null;
    if (!modal.open) finish();
  }, 850);
}

function removeInfantry(person) {
  if (!run.squad.delete(person)) return;
  yard.removeInfantry(person);
  if (!run.squad.size) notify('Position clear · End mission or keep demolishing');
}

function showImpact({ target, broken, damaged, falling, blasts }, tool, direct = null, radius = impactRadius[tool]) {
  damaged.forEach(voxel => yard.damage(voxel));
  const areas = [[target, radius ?? 0], ...blasts.map(barrel => [barrel, impactRadius.powder])];
  let downed = 0;
  for (const person of run.squad) {
    const at = infantryAim(person);
    const distance = center => Math.hypot(at.x - center.x, at.y - center.y, at.z - center.z);
    if (person === direct || areas.some(([center, reach]) => reach > 0 && distance(center) <= reach)) {
      removeInfantry(person);
      downed++;
    } else if (tool !== 'hammer' && distance(target) < 7) {
      person.threat = target;
      person.wait = 0;
      person.next = null;
    }
  }
  let collapseSize = 0;
  for (const group of falling) {
    const chunk = fallingChunk(group, target);
    run.chunks.add(chunk);
    yard.drawChunk(chunk, chunkPoint);
    collapseSize += group.length;
  }
  if (downed) run.combo = Math.min(5, run.combo + 1);
  else if (tool !== 'crush') run.combo = 0;
  const points = broken.length * 7 + downed * 550 * Math.max(1, run.combo) + collapseSize * 10;
  run.score += points;
  if (broken.length || tool !== 'crush' || blasts.length) yard.destroy(broken, target, run.cells, tool, blasts);
  if (downed) {
    popup(target, downed === 1 ? 'HOSTILE DOWN' : `${downed} HOSTILES DOWN`, true);
  } else if (collapseSize > 3) {
    popup(target, `${collapseSize} BLOCKS FALLING`);
  } else if (blasts.length > 1) {
    popup(target, `${blasts.length} BARREL CHAIN`);
  } else if (broken.length && tool !== 'crush') {
    popup(target, `+${number.format(points)}`);
  }
  if (tool !== 'crush' || broken.length || downed) play(blasts.length && (tool === 'hammer' || tool === 'drill') ? 'blast' : tool, downed);
  renderStats();
  if (lastAim) highlightAim(lastAim.x, lastAim.y);
  else yard.highlight(null);
  maybeSettle();
}

function detonate(item) {
  if (!item || run.ended || modal.open || !run.munitions.delete(item)) return;
  if (run.remote === item) run.remote = null;
  yard.removeOrdnance(item);
  const { x, y, z } = item.position;
  showImpact(explode(run.cells, { x, y: y + .5, z }, item.type), item.type);
}

yard.simulate = dt => {
  if (!run || run.ended || modal.open) return;
  for (const item of run.munitions) {
    const wasWaiting = item.waiting;
    const hitStructure = advance(item, dt, run.cells);
    const { x, y, z } = item.position;
    const hitPerson = isRemote(item.type) && [...run.squad].some(person => Math.hypot(x - person.x, y - person.y - .62, z - person.z) < .63);
    if (hitStructure || hitPerson) {
      detonate(item);
    } else {
      if (item.type !== 'tank' || !item.waiting || !wasWaiting) yard.drawOrdnance(item);
      if (item === run.remote && item.waiting !== wasWaiting) renderStats();
    }
  }
  for (const chunk of [...run.chunks]) {
    const contact = fall(chunk, dt, run.cells);
    if (!contact) {
      yard.drawChunk(chunk, chunkPoint);
      continue;
    }
    run.chunks.delete(chunk);
    yard.landChunk(chunk, contact, chunkPoint);
    if (contact.speed > 3 && chunk.mass >= 2) {
      showImpact(explode(run.cells, contact, 'crush', contact.radius), 'crush', null, contact.radius);
    } else {
      renderStats();
    }
  }
  for (const person of run.squad) {
    const result = updateInfantry(person, dt, run.cells, run.job);
    if (result === 'move') yard.drawInfantry(person);
    if (result === 'down') {
      removeInfantry(person);
      run.score += 550;
      popup(infantryAim(person), 'HOSTILE DOWN', true);
      renderStats();
    }
  }
  maybeSettle();
};

function openModal(title) {
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
  if (run.ended || pendingWork()) return;
  clearTimeout(settleTimeout);
  const { job, squad, index, hits } = run;
  const medal = squad.size ? 0 : hits >= job.hits * .65 ? 3 : hits >= job.hits * .32 ? 2 : 1;
  run.ended = true;
  if (medal) {
    const score = run.score + hits * 60 + (medal === 3 ? 700 : 0);
    run.score = score;
    const previous = saved.scores[scoreKey()];
    saved.scores[scoreKey()] = { score: Math.max(previous?.score || 0, score), medal: Math.max(previous?.medal || 0, medal) };
    if (index < jobs.length) saved.unlocked = Math.max(saved.unlocked, index + 1);
    if (job.contract) saved.contract = Math.max(saved.contract, job.contract + 1);
    save();
    play('win');
  }
  yard.clearScan();
  yard.highlight(null);
  renderStats();

  openModal(medal ? 'Position clear' : 'Mission incomplete');
  const summary = document.createElement('p');
  summary.textContent = medal
    ? `${'★'.repeat(medal)} · All hostiles down.`
    : `${squad.size} hostile${squad.size === 1 ? '' : 's'} remain. Use Recon to locate the squad.`;
  const stats = document.createElement('div');
  stats.className = 'result-stats';
  for (const [label, value] of [['HOSTILES DOWN', `${job.troops - squad.size}/${job.troops}`], ['ACTIONS LEFT', hits], ['SCORE', number.format(run.score)]]) {
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
  actions.append(action('Replay', () => reset(index, job.contract), !medal));
  if (medal) {
    const label = index === jobs.length - 1 ? 'Endless missions' : 'Next mission';
    actions.append(action(label, () => reset(Math.min(index + 1, jobs.length)), true));
  } else {
    actions.append(action('Missions', jobBoard));
  }
  body.append(summary, stats, actions);
}

function jobBoard() {
  openModal('Missions');
  const list = document.createElement('div');
  list.className = 'job-list';
  [...jobs, { name: 'Endless missions' }].forEach((job, index) => {
    const button = action('', () => reset(index));
    const title = document.createElement('strong');
    const status = document.createElement('span');
    title.textContent = job.name;
    button.disabled = index > saved.unlocked;
    const record = saved.scores[index === jobs.length ? 'endless' : index];
    status.textContent = button.disabled ? 'Locked' : record ? `${'★'.repeat(record.medal)}  ${number.format(record.score)}` : index === run.index ? 'Current' : 'Play';
    button.append(title, status);
    list.append(button);
  });
  body.append(list);
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
    <p>Destroy supports to bring down floors and walls. Tap again to steer a drone or bot, then detonate it or let it hit the target. Follow zooms the camera in on the remote.</p>`;
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
  if (!event.isPrimary || event.button !== 0 || modal.open) return;
  pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, lastX: event.clientX, moved: false };
  viewport.setPointerCapture(event.pointerId);
  viewport.focus({ preventScroll: true });
  crosshair.hidden = true;
});
viewport.addEventListener('pointermove', event => {
  if (!event.isPrimary || modal.open) return;
  if (pointer?.id === event.pointerId) {
    if (Math.hypot(event.clientX - pointer.x, event.clientY - pointer.y) > 7) pointer.moved = true;
    if (pointer.moved) {
      viewport.classList.add('dragging');
      yard.turn((event.clientX - pointer.lastX) * .009, true);
      yard.highlight(null);
      pointer.lastX = event.clientX;
    }
  } else if (event.pointerType === 'mouse') {
    crosshair.hidden = true;
    lastAim = eventPosition(event);
    if (!run.ended) highlightAim(lastAim.x, lastAim.y);
  }
});
viewport.addEventListener('pointerup', event => {
  if (pointer?.id !== event.pointerId) return;
  const { x, y } = eventPosition(event);
  if (!pointer.moved && x >= 0 && x <= yard.width && y >= 0 && y <= yard.height) shoot(x, y);
  pointer = null;
  viewport.classList.remove('dragging');
});
for (const event of ['lostpointercapture', 'pointercancel']) {
  viewport.addEventListener(event, () => {
    pointer = null;
    viewport.classList.remove('dragging');
  });
}
viewport.addEventListener('pointerleave', () => {
  lastAim = null;
  yard.highlight(null);
});
viewport.addEventListener('blur', () => { crosshair.hidden = true; });

const movement = { ArrowUp: [0, -.018], ArrowDown: [0, .018], ArrowLeft: [-.018, 0], ArrowRight: [.018, 0] };
document.addEventListener('keydown', event => {
  if (modal.open || event.altKey || event.ctrlKey || event.metaKey) return;
  const input = event.key.toLowerCase();
  if (event.target === viewport && movement[event.key]) {
    event.preventDefault();
    keyboardAim = keyboardAim.map((value, i) => Math.min(.97, Math.max(.03, value + movement[event.key][i])));
    showKeyboardAim();
  } else if (event.target === viewport && (event.key === ' ' || event.key === 'Enter')) {
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

for (const button of toolButtons) button.addEventListener('click', () => chooseTool(button.dataset.tool));
for (const button of viewButtons) button.addEventListener('click', () => setView(button.dataset.view));
for (const button of $$('[data-turn]')) {
  button.addEventListener('click', () => {
    yard.turn(Number(button.dataset.turn) * .6);
    yard.highlight(null);
  });
}
$('#retry').addEventListener('click', () => reset(run.index, run.job.contract));
$('#end-mission').addEventListener('click', finish);
$('#scanner').addEventListener('click', scan);
$('#detonate').addEventListener('click', () => detonate(run.remote));
$('#follow').addEventListener('click', () => {
  yard.follow(yard.following ? null : run.remote);
  renderStats();
});
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
reset(Math.min(saved.unlocked, jobs.length));
