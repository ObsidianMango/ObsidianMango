import { EXTENDED_BY_ID, MONEY_CAP } from './config.js';
import { addEvent } from './utils.js';

function boundedBigInt(value) {
  const max = BigInt(MONEY_CAP);
  if (value > max) return MONEY_CAP;
  if (value < -max) return -MONEY_CAP;
  return Number(value);
}

export function classicFinalScore(state) {
  return boundedBigInt(BigInt(state.cash) + BigInt(state.bank) - BigInt(state.debt));
}

export function extendedPortfolioValue(state) {
  let value = 0n;
  for (const [id,count] of Object.entries(state.ownedAssets ?? {})) {
    const asset = EXTENDED_BY_ID[id];
    if (!asset || !Number.isSafeInteger(count) || count <= 0) continue;
    const cents = BigInt(Math.round(asset.resaleFactor * 100));
    value += (BigInt(asset.price) * BigInt(count) * cents) / 100n;
  }
  return boundedBigInt(value);
}

export function finalScore(state) {
  if (state.mode === 'classic') return classicFinalScore(state);
  return boundedBigInt(BigInt(classicFinalScore(state)) + BigInt(extendedPortfolioValue(state)));
}

export function evaluateAchievements(state) {
  const prefix=state.mode;
  const candidates=[
    {id:`${prefix}.survivor`,name:'Thirty-Day Survivor',earned:state.day===state.maxDay&&state.health>0},
    {id:`${prefix}.debt-free`,name:'Clean Ledger',earned:state.debt===0},
    {id:`${prefix}.market-mover`,name:'Market Mover',earned:state.stats.unitsSold>=100},
    {id:`${prefix}.escape-artist`,name:'Escape Artist',earned:state.stats.successfulEscapes>=3},
    {id:`${prefix}.fighter`,name:'Street Tested',earned:state.stats.combatVictories>=2},
    {id:'extended.asset-owner',name:'Portfolio Starter',earned:state.mode==='extended'&&Object.values(state.ownedAssets??{}).some(count=>count>0)},
    {id:'extended.cosmic',name:'Cosmic Landlord',earned:state.mode==='extended'&&(state.ownedAssets?.galaxy??0)>0}
  ];
  state.achievements=candidates.filter(item=>item.earned).map(({id,name})=>({id,name,category:prefix}));
  return state.achievements;
}

export function finishRun(state,{forced=false}={}) {
  if (state.finished) return {ok:false,reason:'Run already finished.'};
  if (!forced && !state.ended && state.day < state.maxDay) return {ok:false,reason:'Reach Day 30 before finishing.'};
  if (!forced && state.pendingEncounter && !state.pendingEncounter.resolved) return {ok:false,reason:'Resolve the current encounter first.'};
  const score = finalScore(state);
  state.finished = true;
  state.ended = true;
  state.finishReason ??= state.health === 0 ? 'health' : 'day-30';
  state.stats.finalScore = score;
  evaluateAchievements(state);
  addEvent(state,`Run complete. Final score: ${score}.`,'finish');
  return {ok:true,score,portfolio:state.mode==='extended'?extendedPortfolioValue(state):0};
}

export function shareSummary(state) {
  const score = state.stats.finalScore ?? finalScore(state);
  return [
    'MangoWarz Classic',
    `${state.mode === 'classic' ? 'Classic' : 'Mango Extended'} Mode`,
    `Score: $${score.toLocaleString('en-US')}`,
    `Day ${state.day}/${state.maxDay} • ${state.trips} trips`,
    `${state.stats.unitsBought} bought • ${state.stats.unitsSold} sold`,
    `${state.stats.successfulEscapes} escapes • ${state.stats.combatVictories} combat wins`,
    `Seed: ${state.seed}`
  ].join('\n');
}
