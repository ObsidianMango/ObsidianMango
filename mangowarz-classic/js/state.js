import { CLASSIC_PRODUCTS, EXTENDED_ASSETS, MAX_DAY, MONEY_CAP, SAVE_VERSION, WEAPON_BY_ID } from './config.js';
import { safeMoney } from './utils.js';

export function inventoryUnits(state) {
  return Object.values(state.inventory ?? {}).reduce((sum, quantity) => sum + (Number.isSafeInteger(quantity) && quantity > 0 ? quantity : 0), 0);
}

export function weaponSpaces(state) {
  return (state.weapons ?? []).reduce((sum, weaponId) => sum + (WEAPON_BY_ID[weaponId]?.spaces ?? 0), 0);
}

export function capacityBonus(state) {
  if (state.mode !== 'extended') return 0;
  return EXTENDED_ASSETS.reduce((sum, asset) => sum + ((state.ownedAssets?.[asset.id] ?? 0) * (asset.capacityBonus ?? 0)), 0);
}

export function totalCapacity(state) {
  return Math.max(0, (state.capacityBase ?? 100) + (state.capacityModifier ?? 0) + capacityBonus(state));
}

export function usedCapacity(state) {
  return inventoryUnits(state) + weaponSpaces(state);
}

export function freeCapacity(state) {
  return Math.max(0, totalCapacity(state) - usedCapacity(state));
}

export function createInitialState({ mode = 'classic', seed, sixProductVariant = false, audio = true, haptics = true, reducedMotion = false } = {}) {
  if (!['classic','extended'].includes(mode)) throw new Error('Unknown game mode');
  const inventory = Object.fromEntries(CLASSIC_PRODUCTS.map(product => [product.id,0]));
  const costBasis = Object.fromEntries(CLASSIC_PRODUCTS.map(product => [product.id,0]));
  const ownedAssets = Object.fromEntries(EXTENDED_ASSETS.map(asset => [asset.id,0]));
  return {
    saveVersion:SAVE_VERSION, mode, seed:String(seed), rngState:null,
    day:1, maxDay:MAX_DAY, trips:0, location:'bronx', cash:2000, debt:5500, bank:0, health:100,
    capacityBase:100, capacityModifier:0, inventory, costBasis, weapons:[], ownedAssets,
    market:null, pendingEncounter:null, combat:null, eventSerial:0, eventHistory:[], ticker:'Fresh coat. Heavy debt. Thirty days. Make them count.',
    settings:{ sixProductVariant:Boolean(sixProductVariant), audio:Boolean(audio), haptics:Boolean(haptics), reducedMotion:Boolean(reducedMotion) },
    stats:{
      unitsBought:0, unitsSold:0, totalSpent:0, totalEarned:0, transactions:0,
      bestTrade:null, worstTrade:null, policeEncounters:0, successfulEscapes:0, combatVictories:0,
      streetIncidents:0, offersSeen:0, tipsReceived:0, scoreBonus:0, finalScore:null
    },
    achievements:[], finished:false, ended:false, finishReason:null, createdAt:Date.now(), updatedAt:Date.now()
  };
}

export function validateState(state, expectedMode = null) {
  const errors = [];
  if (!state || typeof state !== 'object') return { valid:false, errors:['Save is not an object'] };
  if (!['classic','extended'].includes(state.mode)) errors.push('Invalid mode');
  if (expectedMode && state.mode !== expectedMode) errors.push('Mode mismatch');
  if (!Number.isSafeInteger(state.day) || state.day < 1 || state.day > MAX_DAY) errors.push('Invalid day');
  if (!Number.isSafeInteger(state.trips) || state.trips < 0 || state.trips > MAX_DAY - 1) errors.push('Invalid trip count');
  for (const key of ['cash','debt','bank']) if (!Number.isSafeInteger(state[key]) || state[key] < 0 || state[key] > MONEY_CAP) errors.push(`Invalid ${key}`);
  if (!Number.isSafeInteger(state.health) || state.health < 0 || state.health > 100) errors.push('Invalid health');
  if (!Number.isSafeInteger(state.capacityBase) || !Number.isSafeInteger(state.capacityModifier)) errors.push('Invalid capacity');
  for (const product of CLASSIC_PRODUCTS) {
    const quantity = state.inventory?.[product.id];
    if (!Number.isSafeInteger(quantity) || quantity < 0) errors.push(`Invalid inventory: ${product.id}`);
  }
  if (!Array.isArray(state.weapons) || state.weapons.some(id => !WEAPON_BY_ID[id])) errors.push('Invalid weapons');
  if (usedCapacity(state) > totalCapacity(state)) errors.push('Used capacity exceeds total capacity');
  if (typeof state.seed !== 'string' || !state.seed) errors.push('Missing seed');
  return { valid:errors.length === 0, errors };
}

export function migrateState(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const version = Number(raw.saveVersion ?? 1);
  if (version > SAVE_VERSION || version < 1) return null;
  const base = createInitialState({ mode:raw.mode, seed:raw.seed ?? 'migrated', sixProductVariant:raw.settings?.sixProductVariant, audio:raw.settings?.audio, haptics:raw.settings?.haptics, reducedMotion:raw.settings?.reducedMotion });
  const migrated = { ...base, ...raw, settings:{...base.settings,...raw.settings}, stats:{...base.stats,...raw.stats} };
  migrated.inventory = { ...base.inventory, ...raw.inventory };
  migrated.costBasis = { ...base.costBasis, ...raw.costBasis };
  migrated.ownedAssets = { ...base.ownedAssets, ...raw.ownedAssets };
  migrated.saveVersion = SAVE_VERSION;
  migrated.cash = safeMoney(migrated.cash);
  migrated.debt = safeMoney(migrated.debt);
  migrated.bank = safeMoney(migrated.bank);
  return validateState(migrated, migrated.mode).valid ? migrated : null;
}

export function assertState(state) {
  const result = validateState(state, state?.mode);
  if (!result.valid) throw new Error(`Invalid game state: ${result.errors.join(', ')}`);
  return state;
}
