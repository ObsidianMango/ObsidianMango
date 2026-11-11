import { Yard } from './scene.js';
import { jobs, getJob, buildJob, key, medalFor, strike } from './jobs.js';

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const viewport = $('#viewport');
const arena = $('.arena');
const yard = new Yard(viewport);
const modal = $('#modal');
const body = $('#modal-body');
const goldBar = $('#gold-progress');
const crosshair = $('#crosshair');
const toolButtons = $$('[data-tool]');
const viewButtons = $$('[data-view]');
const tools = toolButtons.map(button => button.dataset.tool);
const views = viewButtons.map(button => button.dataset.view);
const toolsByKey = { '1': 'hammer', '2': 'drill', '3': 'blast' };
const storageKey = 'goldwreck.progress.v1';
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

function play(sound, loot = 0) {
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
      const heavy = sound === 'blast';
      const drill = sound === 'drill';
      tone(heavy ? 115 : drill ? 290 : 182, heavy ? 32 : drill ? 65 : 48, heavy ? .29 : .13, drill ? 'sawtooth' : 'triangle', .18);
      tone(heavy ? 46 : 91, 27, heavy ? .33 : .095, 'sine', .17);
      if (loot) {
        [685, 862, loot > 1 ? 1205 : 1045].forEach((hz, i) => tone(hz, hz * .98, .19, 'triangle', .11, .035 + i * .058));
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
  clearTimeout(toastTimeout);
  $('#toast').textContent = '';
  $('#feedback').replaceChildren();
  if (modal.open) modal.close();
  const job = getJob(index, contract);
  const voxels = buildJob(job);
  run = {
    index, job, hits: job.hits, score: 0, gold: 0, scans: 3, combo: 0, tool: 'hammer', ended: false,
    stock: { hammer: Infinity, drill: job.drills, blast: job.charges },
    initialBlocks: voxels.length,
    cells: new Map(voxels.map(voxel => [key(voxel.x, voxel.y, voxel.z), voxel])),
  };
  yard.load(job, voxels);
  keyboardAim = [.5, .53];
  crosshair.hidden = true;
  lastAim = null;
  pointer = null;
  viewport.classList.remove('dragging');
  $('#job-index').textContent = job.contract ? 'ENDLESS JOB' : `JOB 0${index + 1} / 0${jobs.length}`;
  $('#job-name').textContent = job.name;
  goldBar.setAttribute('aria-valuemax', job.gold);
  $('.gold-progress em').style.left = `calc(${job.quota / job.gold * 100}% - 1px)`;
  $('#aim-hint').textContent = coarsePointer.matches ? 'Tap blocks to smash · Drag to rotate' : 'Click blocks to smash · Drag to rotate';
  setView('iso', true);
  renderStats();
}

function scoreKey() {
  return run.job.contract ? 'endless' : run.index;
}

function renderStats() {
  const { job, gold, hits, score, scans, ended, tool, stock } = run;
  $('#gold').textContent = gold;
  $('#total').textContent = `/ ${job.gold}`;
  $('#hits').textContent = hits;
  $('#score').textContent = number.format(score);
  $('#scans').textContent = scans;
  $('#cleared').textContent = `${Math.floor((1 - run.cells.size / run.initialBlocks) * 100)}%`;
  $('#quota').textContent = gold >= job.quota ? 'Quota met' : `Quota ${job.quota} gold`;
  const best = saved.scores[scoreKey()]?.score;
  $('#best').textContent = best ? `Best ${number.format(best)}` : 'Best —';
  goldBar.setAttribute('aria-valuenow', gold);
  goldBar.querySelector('i').style.width = `${gold / job.gold * 100}%`;
  $('#cash').disabled = gold < job.quota || ended;
  $('#scanner').disabled = !scans || ended || !hits;
  $('#scanner').classList.toggle('active', yard.scanUntil > performance.now());
  for (const button of toolButtons) {
    const id = button.dataset.tool;
    button.setAttribute('aria-pressed', tool === id);
    button.disabled = !stock[id] || ended || !hits;
    button.querySelector('b').textContent = id === 'hammer' ? '∞' : stock[id];
  }
}

function notify(message) {
  const toast = $('#toast');
  clearTimeout(toastTimeout);
  toast.textContent = message;
  toastTimeout = setTimeout(() => { toast.textContent = ''; }, 2200);
}

function popup(voxel, label, gold = false) {
  const position = yard.project(voxel);
  const div = document.createElement('div');
  div.className = gold ? 'popup gold' : 'popup';
  div.textContent = label;
  div.style.left = `${Math.min(Math.max(position.x, 48), yard.width - 48)}px`;
  div.style.top = `${Math.max(94, position.y)}px`;
  $('#feedback').append(div);
  setTimeout(() => div.remove(), 950);
}

function scan() {
  if (!run.scans || !run.hits || run.ended || modal.open) return;
  run.scans--;
  yard.scan(run.cells);
  play('scan');
  notify('Gold marked for 7 seconds');
  renderStats();
  setTimeout(() => {
    if (performance.now() >= yard.scanUntil) $('#scanner').classList.remove('active');
  }, 7020);
}

function chooseTool(id) {
  if (run.ended || !run.hits || !run.stock[id]) return;
  run.tool = id;
  renderStats();
}

function setView(view, immediate = false) {
  yard.setView(view, immediate);
  yard.highlight(null);
  for (const button of viewButtons) button.setAttribute('aria-pressed', button.dataset.view === view);
}

function shoot(x, y) {
  if (run.ended || !run.hits || modal.open) return;
  const path = yard.aim(x, y, run.cells);
  if (!path.length) return;
  const tool = run.tool;
  const before = run.gold;
  run.hits--;
  run.stock[tool]--;
  const { target, broken, damaged, collapsed } = strike(run.cells, path, tool);
  damaged.forEach(voxel => yard.damage(voxel));
  const loot = broken.filter(voxel => voxel.kind === 'gold').length;
  run.gold += loot;
  run.combo = loot ? Math.min(5, run.combo + 1) : 0;
  const points = broken.length * 7 + loot * 400 * Math.max(1, run.combo) + collapsed * 8;
  run.score += points;
  if (broken.length) yard.destroy(broken, target, run.cells, tool);
  if (loot) {
    const combo = run.combo > 1 ? ` · ${run.combo}× streak` : '';
    popup(target, `+${loot} GOLD${combo}`, true);
  } else if (collapsed > 3) {
    popup(target, `${collapsed} BLOCK COLLAPSE`);
  } else if (broken.length) {
    popup(target, `+${number.format(points)}`);
  }
  play(tool, loot);
  if (!run.stock[tool]) run.tool = 'hammer';
  if (before < run.job.quota && run.gold >= run.job.quota && run.gold < run.job.gold) notify('Quota met · Cash out or keep digging');
  renderStats();
  yard.highlight(lastAim ? yard.aim(lastAim.x, lastAim.y, run.cells)[0]?.voxel : null);
  if (run.gold >= run.job.gold || !run.hits) {
    settleTimeout = setTimeout(() => {
      if (!modal.open) finish();
    }, 850);
  }
}

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
  if (run.ended) return;
  clearTimeout(settleTimeout);
  const { job, gold, index, hits } = run;
  const medal = medalFor(gold, job.gold, job.quota);
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

  openModal(medal ? ['','Bronze haul', 'Silver haul', 'Gold haul'][medal] : 'Quota missed');
  const summary = document.createElement('p');
  summary.textContent = medal
    ? gold === job.gold ? 'Every stash recovered.' : `${job.gold - gold} gold left at the site.`
    : `This job needs ${job.quota} gold to clear. Try a scan to locate stashes before spending your charges.`;
  const stats = document.createElement('div');
  stats.className = 'result-stats';
  for (const [label, value] of [['GOLD', `${gold}/${job.gold}`], ['HITS LEFT', hits], ['SCORE', number.format(run.score)]]) {
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
    const label = index < jobs.length - 1 ? 'Next job' : index === jobs.length - 1 ? 'Endless jobs' : 'Next contract';
    actions.append(action(label, () => reset(Math.min(index + 1, jobs.length)), true));
  } else {
    actions.append(action('Job board', jobBoard));
  }
  body.append(summary, stats, actions);
}

function jobBoard() {
  openModal('Job board');
  const list = document.createElement('div');
  list.className = 'job-list';
  [...jobs, { name: 'Endless contracts' }].forEach((job, index) => {
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
    <p>Smash the building to recover hidden gold. Meet the quota and cash out, or go after every stash for a gold medal. Find gold on consecutive hits to build a scoring streak.</p>
    <dl class="help-grid">
      <dt>Click / tap</dt><dd>Hit a block. Drag to orbit the site.</dd>
      <dt>Arrows / Space</dt><dd>Aim and hit when the site has focus.</dd>
      <dt>1 / 2 / 3</dt><dd>Hammer, drill, and explosive charge.</dd>
      <dt>R</dt><dd>Mark the remaining stashes for 7 seconds.</dd>
      <dt>V / Q / E</dt><dd>Change view or rotate the camera.</dd>
    </dl>
    <p>Drills bore through layers along your line of aim. Charges damage blocks around the impact. Disconnected sections come down, including any gold inside.</p>`;
  const actions = document.createElement('div');
  actions.className = 'modal-actions';
  actions.append(action('Back to site', () => modal.close(), true));
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
  yard.highlight(yard.aim(x, y, run.cells)[0]?.voxel);
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
    yard.highlight(run.ended ? null : yard.aim(lastAim.x, lastAim.y, run.cells)[0]?.voxel);
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
$('#cash').addEventListener('click', finish);
$('#scanner').addEventListener('click', scan);
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
  if (!run.ended && (run.gold >= run.job.gold || !run.hits)) finish();
});
arena.addEventListener('contextmenu', event => event.preventDefault());

soundLabel();
reset(Math.min(saved.unlocked, jobs.length));
