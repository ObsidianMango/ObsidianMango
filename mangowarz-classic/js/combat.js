import { EXTENDED_BY_ID, LOCATION_BY_ID, WEAPON_BY_ID } from './config.js';
import { addEvent, clamp, formatMoney, safeAdd, safePercentFloor } from './utils.js';

function result(ok, extra = {}) { return {ok,...extra}; }

export function activeWeapon(state) {
  return (state.weapons ?? []).map(id => WEAPON_BY_ID[id]).filter(Boolean).sort((a,b)=>b.damage-a.damage)[0] ?? null;
}

export function beginCombatChoice(state) {
  if (!state.combat || state.pendingEncounter?.type !== 'police') return result(false,{reason:'No active police encounter.'});
  if (!['encounter-start','player-choice'].includes(state.combat.status)) return result(false,{reason:'Combat is resolving.'});
  state.combat.status = 'player-choice';
  return result(true,{combat:state.combat});
}

export function playerAttack(state,rng) {
  const combat = state.combat;
  const weapon = activeWeapon(state);
  if (!combat || combat.status !== 'player-choice' || combat.resolving) return result(false,{reason:'It is not your attack window.'});
  if (!weapon) return result(false,{reason:'You are unarmed.'});
  combat.status = 'player-attack';
  combat.round += 1;
  const hitChance = clamp(.67 + weapon.damage * .018 - (combat.activeEnemies-1)*.035,.48,.88);
  const hit = rng.chance(hitChance);
  const damage = hit ? weapon.damage + rng.int(0,Math.max(2,Math.ceil(weapon.damage/2))) : 0;
  if (hit) {
    combat.enemyHealth = Math.max(0,combat.enemyHealth-damage);
    combat.activeEnemies = Math.max(0,Math.ceil(combat.enemyHealth/combat.perEnemyHealth));
    combat.log.unshift(`${weapon.name} hits for ${damage}.`);
  } else combat.log.unshift(`${weapon.name} misses in the rain.`);
  state.rngState = rng.state;
  if (combat.enemyHealth === 0) return combatVictory(state,rng);
  return result(true,{hit,damage,victory:false,combat});
}

export function enemyAttack(state,rng) {
  const combat = state.combat;
  if (!combat || combat.status !== 'player-attack' || combat.enemyHealth <= 0) return result(false,{reason:'Enemy cannot respond.'});
  combat.status = 'enemy-attack';
  const [min,max] = combat.enemyDamage;
  const raw = rng.int(min,max+1) + Math.max(0,combat.activeEnemies-1) * rng.int(1,4);
  const hit = rng.chance(clamp(.58 + combat.activeEnemies*.06,.6,.86));
  const damage = hit ? raw : 0;
  state.health = Math.max(0,state.health-damage);
  combat.log.unshift(hit ? `${combat.unitName} hits you for ${damage}.` : `${combat.unitName} fires wide.`);
  if (hit) addEvent(state,`${combat.unitName} dealt ${damage} damage. Health: ${state.health}/100.`,'health');
  state.rngState = rng.state;
  if (state.health === 0) {
    combat.status = 'defeat';
    combat.outcome = 'defeat';
    state.ended = true;
    state.finishReason = 'health';
    state.pendingEncounter.art = 'assets/encounters/final-defeat.svg';
    state.pendingEncounter.text = 'Your run ends under the city lights.';
    addEvent(state,'Health reached zero. The run is over.','defeat');
    return result(true,{hit,damage,defeat:true,combat});
  }
  combat.status = 'player-choice';
  return result(true,{hit,damage,defeat:false,combat});
}

function extendedEscapeBonus(state) {
  if (state.mode !== 'extended') return 0;
  return Object.entries(state.ownedAssets ?? {}).reduce((sum,[id,count]) => sum + (EXTENDED_BY_ID[id]?.escapeBonus ?? 0) * count,0);
}

export function escapeProbability(state,{abandonGoods=false}={}) {
  const combat = state.combat;
  const location = LOCATION_BY_ID[state.location];
  if (!combat || !location) return 0;
  return clamp(.42 + state.health/500 - combat.activeEnemies*.075 - location.police/550 + Math.min(.16,combat.round*.035) + (abandonGoods ? .20 : 0) + extendedEscapeBonus(state),.08,.92);
}

function abandonCarriedGoods(state) {
  let dropped = 0;
  for (const [id,quantity] of Object.entries(state.inventory)) {
    const loss = Math.ceil(quantity*.55);
    state.inventory[id] -= loss;
    if (state.inventory[id] === 0) state.costBasis[id] = 0;
    else state.costBasis[id] = Math.max(0,state.costBasis[id] - safePercentFloor(state.costBasis[id],55));
    dropped += loss;
  }
  return dropped;
}

export function attemptEscape(state,rng,{abandonGoods=false}={}) {
  const combat = state.combat;
  if (!combat || combat.status !== 'player-choice' || combat.resolving) return result(false,{reason:'You cannot run right now.'});
  combat.status = 'escape-attempt';
  combat.round += 1;
  const chance = escapeProbability(state,{abandonGoods});
  let dropped = 0;
  if (abandonGoods && !combat.abandonedGoods) { dropped = abandonCarriedGoods(state); combat.abandonedGoods = true; }
  const escaped = rng.chance(chance);
  state.rngState = rng.state;
  if (escaped) {
    combat.status = 'victory';
    combat.outcome = 'escape';
    combat.log.unshift(`Escape succeeds at ${Math.round(chance*100)}% odds${dropped ? ` after dropping ${dropped} units` : ''}.`);
    state.stats.successfulEscapes += 1;
    state.pendingEncounter.art = 'assets/encounters/successful-escape.svg';
    state.pendingEncounter.text = `You break contact. Escape chance was ${Math.round(chance*100)}%.`;
    addEvent(state,'Escaped the police pursuit.','escape');
    return result(true,{escaped:true,chance,dropped,combat});
  }
  combat.log.unshift(`Escape fails at ${Math.round(chance*100)}% odds.`);
  state.pendingEncounter.art = 'assets/encounters/failed-escape.svg';
  combat.status = 'player-attack';
  return result(true,{escaped:false,chance,dropped,combat});
}

export function surrenderGoods(state) {
  const combat = state.combat;
  if (!combat || combat.status !== 'player-choice') return result(false,{reason:'Surrender is unavailable.'});
  const units = Object.values(state.inventory).reduce((sum,q)=>sum+q,0);
  for (const id of Object.keys(state.inventory)) { state.inventory[id]=0; state.costBasis[id]=0; }
  const cashLoss = safePercentFloor(state.cash,10);
  state.cash -= cashLoss;
  combat.status = 'resolved';
  combat.outcome = 'surrender';
  combat.log.unshift(`You surrender ${units} units and ${formatMoney(cashLoss)}.`);
  state.pendingEncounter.resolved = true;
  state.pendingEncounter.art = 'assets/weapons/evidence-bag.svg';
  state.pendingEncounter.text = 'The goods are gone, but the run continues.';
  addEvent(state,`Surrendered ${units} carried units and ${formatMoney(cashLoss)}.`, 'police');
  return result(true,{units,cashLoss,combat});
}

export function combatVictory(state,rng) {
  const combat = state.combat;
  if (!combat) return result(false,{reason:'No combat.'});
  const reward = rng.int(100,501) * combat.enemyCount;
  state.cash = safeAdd(state.cash,reward);
  state.stats.combatVictories += 1;
  state.stats.scoreBonus = safeAdd(state.stats.scoreBonus,combat.enemyCount*250);
  state.rngState = rng.state;
  combat.status = 'victory';
  combat.outcome = 'combat-victory';
  combat.log.unshift(`Pursuit broken. You recover ${formatMoney(reward)}.`);
  state.pendingEncounter.art = 'assets/encounters/shootout.svg';
  state.pendingEncounter.text = `The unit withdraws. You recover ${formatMoney(reward)}.`;
  addEvent(state,`Combat victory against ${combat.unitName}; recovered ${formatMoney(reward)}.`,'victory');
  return result(true,{victory:true,reward,combat});
}

export function finalizeCombat(state) {
  const combat = state.combat;
  if (!combat || !['victory','defeat'].includes(combat.status)) return result(false,{reason:'Combat has not reached an outcome.'});
  combat.status = 'resolved';
  state.pendingEncounter.resolved = true;
  return result(true,{outcome:combat.outcome});
}
