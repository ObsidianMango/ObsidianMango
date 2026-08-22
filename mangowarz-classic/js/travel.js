import { EXTENDED_BY_ID, LOCATION_BY_ID, MAX_DAY } from './config.js';
import { generateArrivalEncounter } from './encounters.js';
import { applyTripInterest } from './finance.js';
import { generateMarket } from './market.js';
import { SeededRng } from './rng.js';
import { addEvent, formatMoney } from './utils.js';

export function initializeMarket(state) {
  const rng = new SeededRng(state.seed,state.rngState);
  state.market = generateMarket(state,rng);
  state.rngState = rng.state;
  for (const event of state.market.events) addEvent(state,event.message,event.type);
  state.updatedAt = Date.now();
  return state.market;
}

export function canTravel(state,destinationId) {
  if (state.ended) return {ok:false,reason:'This run is over.'};
  if (state.pendingEncounter && !state.pendingEncounter.resolved) return {ok:false,reason:'Resolve the current encounter first.'};
  if (!LOCATION_BY_ID[destinationId]) return {ok:false,reason:'Unknown destination.'};
  if (destinationId === state.location) return {ok:false,reason:'Choose a different neighborhood.'};
  if (state.day >= MAX_DAY) return {ok:false,reason:'Day 30 is the final trading day. Finish the run when ready.'};
  return {ok:true};
}

function maybeDivorce(state,rng) {
  if (state.mode !== 'extended' || !(state.ownedAssets?.wife > 0) || !rng.chance(.02)) return null;
  const loss = Math.floor(state.cash/2);
  state.cash -= loss;
  addEvent(state,`The disclosed fictional divorce event removes ${formatMoney(loss)}—half your carried cash.`,'divorce');
  return {loss,art:'assets/extended-mode/divorce-event.svg'};
}

export function travelTo(state,destinationId) {
  const check = canTravel(state,destinationId);
  if (!check.ok) return check;
  const origin = state.location;
  state.location = destinationId;
  state.day += 1;
  state.trips += 1;
  applyTripInterest(state);
  const rng = new SeededRng(state.seed,state.rngState);
  const divorce = maybeDivorce(state,rng);
  state.market = generateMarket(state,rng);
  addEvent(state,`Day ${state.day}: arrived in ${LOCATION_BY_ID[destinationId].name} from ${LOCATION_BY_ID[origin].name}.`,'travel');
  for (const event of state.market.events) addEvent(state,event.message,event.type);
  const encounter = generateArrivalEncounter(state,rng);
  state.rngState = rng.state;
  state.updatedAt = Date.now();
  return {ok:true,origin,destination:destinationId,day:state.day,market:state.market,encounter,divorce};
}
