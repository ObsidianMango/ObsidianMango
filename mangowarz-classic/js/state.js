import { CHEAP_IDS, CLASSIC_PRODUCTS, EXPENSIVE_IDS, EXTENDED_ASSETS, LOCATION_BY_ID, MAX_DAY, MONEY_CAP, SAVE_VERSION, WEAPON_BY_ID, enabledProducts } from './config.js';
import { safeMoney } from './utils.js';

export function inventoryUnits(state) {
  const total = Object.values(state.inventory ?? {}).reduce((sum, quantity) => sum + BigInt(Number.isSafeInteger(quantity) && quantity > 0 ? quantity : 0), 0n);
  return Number(total > BigInt(MONEY_CAP) ? BigInt(MONEY_CAP) : total);
}

export function weaponSpaces(state) {
  const total = (state.weapons ?? []).reduce((sum, weaponId) => sum + BigInt(WEAPON_BY_ID[weaponId]?.spaces ?? 0), 0n);
  return Number(total > BigInt(MONEY_CAP) ? BigInt(MONEY_CAP) : total);
}

export function capacityBonus(state) {
  if (state.mode !== 'extended') return 0;
  const total = EXTENDED_ASSETS.reduce((sum, asset) => {
    const count = state.ownedAssets?.[asset.id] ?? 0;
    return sum + BigInt(Number.isSafeInteger(count) && count > 0 ? count : 0) * BigInt(asset.capacityBonus ?? 0);
  },0n);
  return Number(total > BigInt(MONEY_CAP) ? BigInt(MONEY_CAP) : total);
}

export function totalCapacity(state) {
  const base = Number.isSafeInteger(state.capacityBase) ? state.capacityBase : 0;
  const modifier = Number.isSafeInteger(state.capacityModifier) ? state.capacityModifier : 0;
  const total = BigInt(base) + BigInt(modifier) + BigInt(capacityBonus(state));
  if (total <= 0n) return 0;
  return Number(total > BigInt(MONEY_CAP) ? BigInt(MONEY_CAP) : total);
}

export function usedCapacity(state) {
  const total = BigInt(inventoryUnits(state)) + BigInt(weaponSpaces(state));
  return Number(total > BigInt(MONEY_CAP) ? BigInt(MONEY_CAP) : total);
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
  if (state.maxDay !== MAX_DAY) errors.push('Invalid maximum day');
  if (!Number.isSafeInteger(state.day) || state.day < 1 || state.day > MAX_DAY) errors.push('Invalid day');
  if (!Number.isSafeInteger(state.trips) || state.trips < 0 || state.trips > MAX_DAY - 1) errors.push('Invalid trip count');
  if (Number.isSafeInteger(state.day) && Number.isSafeInteger(state.trips) && state.trips !== state.day - 1) errors.push('Day and trip count do not match');
  if (!LOCATION_BY_ID[state.location]) errors.push('Invalid location');
  for (const key of ['cash','debt','bank']) if (!Number.isSafeInteger(state[key]) || state[key] < 0 || state[key] > MONEY_CAP) errors.push(`Invalid ${key}`);
  if (!Number.isSafeInteger(state.health) || state.health < 0 || state.health > 100) errors.push('Invalid health');
  if (!Number.isSafeInteger(state.capacityBase) || state.capacityBase <= 0 || !Number.isSafeInteger(state.capacityModifier)) errors.push('Invalid capacity');
  for (const product of CLASSIC_PRODUCTS) {
    const quantity = state.inventory?.[product.id];
    if (!Number.isSafeInteger(quantity) || quantity < 0) errors.push(`Invalid inventory: ${product.id}`);
    const basis = state.costBasis?.[product.id];
    if (!Number.isSafeInteger(basis) || basis < 0 || basis > MONEY_CAP) errors.push(`Invalid cost basis: ${product.id}`);
  }
  if (!Array.isArray(state.weapons) || state.weapons.some(id => !WEAPON_BY_ID[id])) errors.push('Invalid weapons');
  for (const asset of EXTENDED_ASSETS) {
    const count = state.ownedAssets?.[asset.id];
    if (!Number.isSafeInteger(count) || count < 0) errors.push(`Invalid owned asset: ${asset.id}`);
  }
  if (!state.settings || typeof state.settings !== 'object' || ['sixProductVariant','audio','haptics','reducedMotion'].some(key => typeof state.settings[key] !== 'boolean')) errors.push('Invalid settings');
  if (state.rngState !== null && (!Number.isSafeInteger(state.rngState) || state.rngState < 0 || state.rngState > 0xffffffff)) errors.push('Invalid RNG state');
  if (!Number.isSafeInteger(state.eventSerial) || state.eventSerial < 0) errors.push('Invalid event serial');
  if (!Array.isArray(state.eventHistory) || state.eventHistory.length > 100 || state.eventHistory.some(event => !event || typeof event !== 'object' || !Number.isSafeInteger(event.day) || typeof event.message !== 'string')) errors.push('Invalid event history');
  if (typeof state.finished !== 'boolean' || typeof state.ended !== 'boolean' || (state.finished && !state.ended)) errors.push('Invalid run status');
  const counterStats=['unitsBought','unitsSold','totalSpent','totalEarned','transactions','policeEncounters','successfulEscapes','combatVictories','streetIncidents','offersSeen','tipsReceived','scoreBonus'];
  if (!state.stats || typeof state.stats !== 'object' || counterStats.some(key => !Number.isSafeInteger(state.stats[key]) || state.stats[key] < 0) || (state.stats.finalScore !== null && !Number.isSafeInteger(state.stats.finalScore))) errors.push('Invalid statistics');
  if (state.pendingEncounter !== null && (typeof state.pendingEncounter !== 'object' || !['offer','street','police'].includes(state.pendingEncounter.type) || typeof state.pendingEncounter.resolved !== 'boolean')) errors.push('Invalid pending encounter');
  if (state.combat !== null && (typeof state.combat !== 'object' || !['encounter-start','player-choice','player-attack','enemy-attack','escape-attempt','victory','defeat','resolved'].includes(state.combat.status))) errors.push('Invalid combat state');
  if (state.pendingEncounter?.type === 'police' && !state.combat) errors.push('Police encounter is missing combat state');
  if (!Number.isSafeInteger(totalCapacity(state)) || totalCapacity(state) <= 0) errors.push('Capacity exceeds safe integer policy');
  if (usedCapacity(state) > totalCapacity(state)) errors.push('Used capacity exceeds total capacity');
  if (!state.market || typeof state.market !== 'object' || !state.market.rows || typeof state.market.rows !== 'object') errors.push('Invalid market');
  else {
    const products = enabledProducts(state.settings);
    const location = LOCATION_BY_ID[state.location];
    const availableRows = [];
    const expectedIds = new Set(products.map(product => product.id));
    if (Object.keys(state.market.rows).length !== expectedIds.size || Object.keys(state.market.rows).some(id => !expectedIds.has(id))) errors.push('Market product set does not match settings');
    for (const product of products) {
      const row = state.market.rows[product.id];
      if (!row || row.productId !== product.id || typeof row.available !== 'boolean' || !['ordinary','cheap','expensive'].includes(row.event)) { errors.push(`Invalid market row: ${product.id}`); continue; }
      if (row.available) {
        availableRows.push(row);
        if (!Number.isSafeInteger(row.price) || row.price <= 0 || !Number.isSafeInteger(row.ordinaryPrice) || row.ordinaryPrice <= 0) errors.push(`Invalid market price: ${product.id}`);
        else if (row.ordinaryPrice < product.min || row.ordinaryPrice >= product.maxExclusive) errors.push(`Ordinary market price is out of range: ${product.id}`);
        else if (row.event === 'cheap' && (!CHEAP_IDS.includes(product.id) || row.price !== Math.max(1,Math.floor(row.ordinaryPrice/4)))) errors.push(`Invalid cheap market event: ${product.id}`);
        else if (row.event === 'expensive' && (!EXPENSIVE_IDS.includes(product.id) || row.price !== row.ordinaryPrice*4)) errors.push(`Invalid expensive market event: ${product.id}`);
        else if (row.event === 'ordinary' && row.price !== row.ordinaryPrice) errors.push(`Invalid ordinary market event: ${product.id}`);
      } else if (row.price !== null || row.ordinaryPrice !== null || row.event !== 'ordinary') errors.push(`Unavailable market row is inconsistent: ${product.id}`);
    }
    const maxListed = Math.min(location?.maxListedExclusive ?? 0,products.length + 1);
    const minListed = Math.min(location?.minListed ?? 0,products.length);
    if (!Number.isSafeInteger(state.market.listedCount) || state.market.listedCount !== availableRows.length || state.market.listedCount < minListed || state.market.listedCount >= maxListed) errors.push('Invalid market listing count');
    const shocks=availableRows.filter(row=>row.event!=='ordinary');
    if (!Array.isArray(state.market.events) || state.market.events.length > 3 || state.market.events.length !== shocks.length || state.market.events.some(event => !event || !shocks.some(row => row.productId === event.productId && row.event === event.type))) errors.push('Invalid market events');
  }
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
