import { LOCATION_BY_ID, POLICE_UNITS, WEAPONS, enabledProducts } from './config.js';
import { freeCapacity, totalCapacity } from './state.js';
import { addEvent, clamp, formatMoney, safeAdd, safePercentFloor } from './utils.js';

export function netWorth(state) {
  return state.cash + state.bank - state.debt;
}

export function encounterChance(value) {
  if (value <= 1_000_000) return 0.240;
  if (value <= 3_000_000) return 0.339;
  return 0.415;
}

export function encounterGroup(localRoll) {
  if (localRoll < 33) return 'offer';
  if (localRoll <= 49) return 'street';
  return 'police';
}

function token(state,rng) { return `e-${state.day}-${state.trips}-${rng.state.toString(16)}`; }

function makeOffer(state,rng) {
  const kind = rng.weighted([
    {value:'coat',weight:24},{value:'weapon',weight:22},{value:'medical',weight:18},
    {value:'tip',weight:22},{value:'risky',weight:14}
  ]);
  const base = { token:token(state,rng), type:'offer', kind, resolved:false, mandatory:true };
  if (kind === 'coat') {
    const cost = rng.int(200,300);
    return {...base,title:'Bigger Coat, Bigger Ambition',text:`A tailor offers ten permanent spaces for ${formatMoney(cost)}.`,art:'assets/encounters/coat-upgrade-offer.svg',actor:'Loan Shark’s Tailor',actorArt:'assets/civilians/street-dealer.svg',data:{cost,capacity:10,before:totalCapacity(state),after:totalCapacity(state)+10}};
  }
  if (kind === 'weapon') {
    const weapon = rng.pick(WEAPONS);
    return {...base,title:'Street Hardware Offer',text:`A seller opens a padded case: ${weapon.name}, damage ${weapon.damage}, ${weapon.spaces} coat spaces.`,art:'assets/encounters/weapon-offer.svg',actor:'Weapon Seller',actorArt:'assets/civilians/weapon-seller.svg',data:{weaponId:weapon.id,cost:weapon.streetPrice,spaces:weapon.spaces,damage:weapon.damage}};
  }
  if (kind === 'medical') {
    const healing = Math.min(30,100-state.health);
    const cost = Math.max(60,healing*15);
    return {...base,title:'Back-Room Medic',text:`A doctor offers ${healing} health for ${formatMoney(cost)}.`,art:'assets/encounters/medical-emergency.svg',actor:'Night Doctor',actorArt:'assets/civilians/doctor.svg',data:{healing,cost}};
  }
  if (kind === 'tip') {
    const product = rng.pick(enabledProducts(state.settings));
    const locations = Object.values(LOCATION_BY_ID).filter(location => location.id !== state.location);
    const destination = rng.pick(locations);
    const direction = rng.chance(.5) ? 'cheap' : 'expensive';
    return {...base,title:'A Whisper Through Static',text:`An informant heard ${product.name} may run ${direction} around ${destination.name}. It is a rumor, not a guarantee.`,art:'assets/encounters/street-tip.svg',actor:'Informant',actorArt:'assets/civilians/informant.svg',data:{productId:product.id,destinationId:destination.id,direction,cost:0}};
  }
  const stake = Math.min(state.cash,rng.int(75,351));
  const payout = rng.chance(.48) ? rng.int(150,801) : -stake;
  return {...base,title:'The Too-Friendly Stranger',text:`A stranger proposes a quick sealed-envelope gamble. Maximum loss: ${formatMoney(stake)}.`,art:'assets/encounters/risky-stranger.svg',actor:'Strange Woman',actorArt:'assets/civilians/strange-woman.svg',data:{stake,payout}};
}

function ownedProducts(state) {
  return enabledProducts(state.settings).filter(product => (state.inventory[product.id] ?? 0) > 0);
}

function makeStreetIncident(state,rng) {
  let kind = rng.weighted([
    {value:'mugging',weight:13},{value:'found-cash',weight:12},{value:'found-goods',weight:12},
    {value:'lost-goods',weight:10},{value:'friend-gift',weight:11},{value:'robbery',weight:10},
    {value:'medical-emergency',weight:9},{value:'coat-damage',weight:7},{value:'street-tip',weight:9},{value:'abandoned-property',weight:5},{value:'quiet-journey',weight:7}
  ]);
  if (kind === 'lost-goods' && ownedProducts(state).length === 0) kind = state.cash > 0 ? 'mugging' : 'quiet-journey';
  if (kind === 'robbery' && ownedProducts(state).length === 0 && state.cash === 0) kind = 'quiet-journey';
  if (kind === 'found-goods' && freeCapacity(state) === 0) kind = 'found-cash';
  if (kind === 'coat-damage' && freeCapacity(state) === 0) kind = ownedProducts(state).length ? 'lost-goods' : 'quiet-journey';
  const incident = { token:token(state,rng), type:'street', kind, resolved:false, mandatory:true, actor:'Street', actorArt:'assets/civilians/subway-passenger.svg', changes:{} };
  if (kind === 'mugging') {
    const amount = Math.min(state.cash,Math.max(0,safePercentFloor(state.cash,rng.int(8,26))));
    return {...incident,title:'Cornered at the Turnstile',text:`A mugger takes ${formatMoney(amount)} and disappears into the crowd.`,art:'assets/encounters/mugging.svg',actor:'Mugger',actorArt:'assets/civilians/mugger.svg',changes:{cash:-amount}};
  }
  if (kind === 'found-cash') {
    const amount = rng.int(40,501);
    return {...incident,title:'Cash Under the Bench',text:`An abandoned envelope holds ${formatMoney(amount)}.`,art:'assets/encounters/found-cash.svg',actor:'Hurrying Stranger',actorArt:'assets/civilians/found-cash-owner.svg',changes:{cash:amount}};
  }
  if (kind === 'found-goods') {
    const product = rng.pick(enabledProducts(state.settings));
    const quantity = rng.int(1,Math.min(10,freeCapacity(state))+1);
    return {...incident,title:'Unclaimed Package',text:`You find ${quantity} ${product.name} with no owner in sight.`,art:'assets/encounters/found-goods.svg',actor:'Nervous Witness',actorArt:'assets/civilians/found-goods-owner.svg',changes:{productId:product.id,quantity}};
  }
  if (kind === 'lost-goods') {
    const product = rng.pick(ownedProducts(state));
    const quantity = rng.int(1,Math.min(8,state.inventory[product.id])+1);
    return {...incident,title:'A Seam Gives Way',text:`${quantity} ${product.name} drops through a torn pocket.`,art:'assets/encounters/lost-goods.svg',actor:'Market Seller',actorArt:'assets/civilians/market-seller.svg',changes:{productId:product.id,quantity:-quantity}};
  }
  if (kind === 'friend-gift') {
    if (freeCapacity(state) > 0 && rng.chance(.55)) {
      const product = rng.pick(enabledProducts(state.settings));
      const quantity = rng.int(1,Math.min(6,freeCapacity(state))+1);
      return {...incident,title:'A Friend Pays It Forward',text:`A friend slips you ${quantity} ${product.name}.`,art:'assets/encounters/friend-gift.svg',actor:'Friend',actorArt:'assets/civilians/friend.svg',changes:{productId:product.id,quantity}};
    }
    const amount = rng.int(60,401);
    return {...incident,title:'A Friend Pays It Forward',text:`A friend spots you ${formatMoney(amount)}.`,art:'assets/encounters/friend-gift.svg',actor:'Friend',actorArt:'assets/civilians/friend.svg',changes:{cash:amount}};
  }
  if (kind === 'robbery') {
    const cashLoss = Math.min(state.cash,safePercentFloor(state.cash,rng.int(15,36)));
    const product = ownedProducts(state).length ? rng.pick(ownedProducts(state)) : null;
    const quantity = product ? rng.int(1,Math.min(state.inventory[product.id],12)+1) : 0;
    return {...incident,title:'The Fastest Hands on the Block',text:`A coordinated robbery costs ${formatMoney(cashLoss)}${product ? ` and ${quantity} ${product.name}` : ''}.`,art:'assets/encounters/robbery.svg',actor:'Robbery Crew',actorArt:'assets/civilians/mugger.svg',changes:{cash:-cashLoss,productId:product?.id,quantity:-quantity}};
  }
  if (kind === 'medical-emergency') {
    const damage = rng.int(5,19);
    return {...incident,title:'Bad Fall on Wet Concrete',text:`The trip turns ugly. You lose ${damage} health.`,art:'assets/encounters/medical-emergency.svg',actor:'Night Doctor',actorArt:'assets/civilians/doctor.svg',changes:{health:-damage}};
  }
  if (kind === 'coat-damage') {
    const loss = Math.min(10,freeCapacity(state));
    return {...incident,title:'Coat Strap Snaps',text:`The damage permanently removes ${loss} free spaces.`,art:'assets/encounters/coat-damage.svg',actor:'Market Buyer',actorArt:'assets/civilians/market-buyer.svg',changes:{capacity:-loss}};
  }
  if (kind === 'street-tip') {
    const product = rng.pick(enabledProducts(state.settings));
    return {...incident,title:'Useful Noise',text:`A bartender says to watch ${product.name} prices. It may be smoke, but it may be smoke with money behind it.`,art:'assets/encounters/street-tip.svg',actor:'Bartender',actorArt:'assets/civilians/bartender.svg',changes:{tip:product.id}};
  }
  if (kind === 'abandoned-property') {
    const amount = rng.int(25,226);
    return {...incident,title:'Nobody Came Back for It',text:`A witness points out abandoned property containing ${formatMoney(amount)}.`,art:'assets/encounters/abandoned-property.svg',actor:'Abandoned-Property Witness',actorArt:'assets/civilians/abandoned-property-witness.svg',changes:{cash:amount}};
  }
  return {...incident,title:'A Quiet Ride',text:'No sirens, no scams, no surprises. For once, the city just lets you pass.',art:'assets/encounters/quiet-journey.svg',actor:'Subway Passenger',actorArt:'assets/civilians/subway-passenger.svg',changes:{}};
}

function makePoliceEncounter(state,rng) {
  const location = LOCATION_BY_ID[state.location];
  const unit = rng.pick(POLICE_UNITS);
  const enemyCount = 1 + (rng.chance(location.police / 160) ? 1 : 0) + (rng.chance(Math.max(0,location.police-55)/180) ? 1 : 0);
  const perEnemyHealth = unit.baseHealth;
  const enemyHealth = perEnemyHealth * enemyCount;
  state.stats.policeEncounters += 1;
  state.combat = {
    status:'encounter-start', round:0, resolving:false, unitId:unit.id, unitName:unit.name, portrait:unit.portrait,
    enemyCount, activeEnemies:enemyCount, perEnemyHealth, enemyHealth, enemyMaxHealth:enemyHealth,
    enemyDamage:[...unit.damage], log:[`${unit.name} closes in with ${enemyCount === 1 ? 'no backup' : `${enemyCount-1} backup units`}.`], outcome:null, abandonedGoods:false
  };
  return {token:token(state,rng),type:'police',kind:'police-stop',resolved:false,mandatory:true,title:`${unit.name}: Street Stop`,text:'Sirens cut through the market noise. Choose fast, but choose with your eyes open.',art:'assets/encounters/police-stop.svg',actor:unit.name,actorArt:unit.portrait};
}

export function generateArrivalEncounter(state,rng) {
  const worth = netWorth(state);
  if (!rng.chance(encounterChance(worth))) {
    state.pendingEncounter = null;
    state.rngState = rng.state;
    return null;
  }
  const location = LOCATION_BY_ID[state.location];
  const roll = rng.int(0,81 + location.police);
  const group = encounterGroup(roll);
  const encounter = group === 'offer' ? makeOffer(state,rng) : group === 'street' ? makeStreetIncident(state,rng) : makePoliceEncounter(state,rng);
  encounter.localRoll = roll;
  encounter.netWorthAtRoll = worth;
  state.pendingEncounter = encounter;
  state.rngState = rng.state;
  if (group === 'offer') state.stats.offersSeen += 1;
  if (group === 'street') state.stats.streetIncidents += 1;
  return encounter;
}

export function resolveStreetIncident(state) {
  const encounter = state.pendingEncounter;
  if (!encounter || encounter.type !== 'street' || encounter.resolved) return {ok:false,reason:'No unresolved street incident.'};
  const changes = encounter.changes ?? {};
  if (changes.cash) state.cash = changes.cash > 0 ? safeAdd(state.cash,changes.cash) : Math.max(0,state.cash + changes.cash);
  if (changes.productId && changes.quantity) {
    const current = state.inventory[changes.productId] ?? 0;
    state.inventory[changes.productId] = changes.quantity > 0 ? current + Math.min(changes.quantity,freeCapacity(state)) : Math.max(0,current + changes.quantity);
  }
  if (changes.health) state.health = clamp(state.health + changes.health,0,100);
  if (changes.capacity) state.capacityModifier += changes.capacity;
  if (changes.tip) state.stats.tipsReceived += 1;
  encounter.resolved = true;
  addEvent(state,encounter.text,encounter.kind);
  if (state.health === 0) { state.ended = true; state.finishReason = 'health'; }
  return {ok:true,encounter};
}

export function acceptOffer(state) {
  const encounter = state.pendingEncounter;
  if (!encounter || encounter.type !== 'offer' || encounter.resolved) return {ok:false,reason:'That offer has expired.'};
  const data = encounter.data ?? {};
  if (['coat','weapon','medical'].includes(encounter.kind) && state.cash < data.cost) return {ok:false,reason:'Not enough carried cash.'};
  if (encounter.kind === 'weapon' && freeCapacity(state) < data.spaces) return {ok:false,reason:`You need ${data.spaces} free coat spaces.`};
  if (encounter.kind === 'medical' && data.healing <= 0) return {ok:false,reason:'You do not need treatment.'};
  if (encounter.kind === 'coat') { state.cash -= data.cost; state.capacityBase += data.capacity; }
  if (encounter.kind === 'weapon') { state.cash -= data.cost; state.weapons.push(data.weaponId); }
  if (encounter.kind === 'medical') { state.cash -= data.cost; state.health = Math.min(100,state.health + data.healing); }
  if (encounter.kind === 'tip') state.stats.tipsReceived += 1;
  if (encounter.kind === 'risky') state.cash = data.payout >= 0 ? safeAdd(state.cash,data.payout) : Math.max(0,state.cash + data.payout);
  encounter.resolved = true;
  const message = encounter.kind === 'risky' ? (data.payout >= 0 ? `The gamble pays ${formatMoney(data.payout)}.` : `The envelope trick costs ${formatMoney(-data.payout)}.`) : `Accepted: ${encounter.title}.`;
  addEvent(state,message,'offer');
  return {ok:true,message,encounter};
}

export function declineOffer(state) {
  const encounter = state.pendingEncounter;
  if (!encounter || encounter.type !== 'offer' || encounter.resolved) return {ok:false,reason:'That offer has expired.'};
  encounter.resolved = true;
  const message = `Passed on ${encounter.title}.`;
  addEvent(state,message,'offer');
  return {ok:true,message};
}

export function clearResolvedEncounter(state) {
  if (!state.pendingEncounter?.resolved) return false;
  state.pendingEncounter = null;
  if (state.combat?.status === 'resolved') state.combat = null;
  return true;
}
