import { SAVE_VERSION } from './config.js';
import { migrateState, validateState } from './state.js';

const PREFIX = 'mangowarz-classic';
const saveKey = mode => `${PREFIX}:save:${mode}`;
const bestKey = mode => `${PREFIX}:best:${mode}`;
const settingsKey = `${PREFIX}:settings`;

function usableStorage(storage) {
  return storage ?? globalThis.localStorage ?? null;
}

export function saveGame(state,storage = null) {
  const target = usableStorage(storage);
  if (!target) return {ok:false,reason:'Storage unavailable.'};
  const validation = validateState(state,state.mode);
  if (!validation.valid) return {ok:false,reason:`Refusing invalid save: ${validation.errors.join(', ')}`};
  state.saveVersion = SAVE_VERSION;
  state.updatedAt = Date.now();
  try {
    target.setItem(saveKey(state.mode),JSON.stringify(state));
    return {ok:true};
  } catch (error) { return {ok:false,reason:error.message}; }
}

export function loadGame(mode,storage = null) {
  const target = usableStorage(storage);
  if (!target) return {ok:false,state:null,reason:'Storage unavailable.'};
  const raw = target.getItem(saveKey(mode));
  if (!raw) return {ok:true,state:null};
  try {
    const parsed = JSON.parse(raw);
    if (parsed.mode !== mode) return {ok:false,state:null,reason:'Save mode does not match.'};
    const migrated = migrateState(parsed);
    if (!migrated) throw new Error('Save validation failed');
    return {ok:true,state:migrated};
  } catch (error) {
    try { target.setItem(`${saveKey(mode)}:corrupt:${Date.now()}`,raw); target.removeItem(saveKey(mode)); } catch {}
    return {ok:false,state:null,reason:'The save was corrupt and was safely quarantined.'};
  }
}

export function resetSave(mode,storage = null) {
  const target = usableStorage(storage);
  if (!target) return false;
  target.removeItem(saveKey(mode));
  return true;
}

export function loadSettings(storage = null) {
  const target = usableStorage(storage);
  if (!target) return {};
  try { return JSON.parse(target.getItem(settingsKey) ?? '{}'); } catch { return {}; }
}

export function saveSettings(settings,storage = null) {
  const target = usableStorage(storage);
  if (!target) return false;
  try { target.setItem(settingsKey,JSON.stringify(settings)); return true; } catch { return false; }
}

export function recordBestScore(state,storage = null) {
  const target = usableStorage(storage);
  if (!target || !state.finished) return {isBest:false,previous:null};
  const score = state.stats.finalScore;
  let previous = null;
  try { previous = JSON.parse(target.getItem(bestKey(state.mode)) ?? 'null'); } catch {}
  const isBest = !previous || score > previous.score;
  if (isBest) target.setItem(bestKey(state.mode),JSON.stringify({score,seed:state.seed,date:Date.now(),mode:state.mode}));
  return {isBest,previous};
}

export function getBestScore(mode,storage = null) {
  const target = usableStorage(storage);
  if (!target) return null;
  try { return JSON.parse(target.getItem(bestKey(mode)) ?? 'null'); } catch { return null; }
}

export const storageKeys = Object.freeze({saveKey,bestKey,settingsKey});
