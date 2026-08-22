import { CHEAP_IDS, EXPENSIVE_IDS, LOCATION_BY_ID, enabledProducts } from './config.js';

export function sampleSpecialEventCount(rng) {
  const roll = rng.next();
  if (roll < 0.300) return 0;
  if (roll < 0.720) return 1;
  if (roll < 0.986) return 2;
  return 3;
}

export function ordinaryPrice(product, rng) {
  return rng.int(product.min, product.maxExclusive);
}

const messages = {
  cheap:[
    'A warehouse spill flooded the street market.',
    'A nervous supplier unloaded stock cheaply.',
    'Too much inventory hit the pavement at once.'
  ],
  expensive:[
    'A sudden shortage sent prices soaring.',
    'A festival caused unusual demand.',
    'Supply vanished and buyers started bidding.'
  ]
};

export function generateMarket(state, rng) {
  const location = LOCATION_BY_ID[state.location];
  if (!location) throw new Error('Unknown market location');
  const products = enabledProducts(state.settings);
  const maxExclusive = Math.min(location.maxListedExclusive, products.length + 1);
  const min = Math.min(location.minListed, products.length);
  const listedCount = maxExclusive > min ? rng.int(min,maxExclusive) : min;
  const requestedEvents = sampleSpecialEventCount(rng);
  const eligible = products.filter(product => CHEAP_IDS.includes(product.id) || EXPENSIVE_IDS.includes(product.id));
  const guaranteedEventIds = rng.shuffle(eligible).slice(0,Math.min(requestedEvents,listedCount));
  const remainingIds = rng.shuffle(products.map(product => product.id).filter(id => !guaranteedEventIds.some(product => product.id === id)));
  const selected = new Set([...guaranteedEventIds.map(product => product.id),...remainingIds.slice(0,listedCount-guaranteedEventIds.length)]);
  const rows = Object.fromEntries(products.map(product => {
    const listed = selected.has(product.id);
    const price = listed ? ordinaryPrice(product,rng) : null;
    return [product.id,{ productId:product.id, available:listed, ordinaryPrice:price, price, event:'ordinary', announcement:null }];
  }));

  const candidates = rng.shuffle(products.filter(product => selected.has(product.id) && (CHEAP_IDS.includes(product.id) || EXPENSIVE_IDS.includes(product.id))));
  const events = [];
  for (const product of candidates.slice(0,requestedEvents)) {
    const type = CHEAP_IDS.includes(product.id) ? 'cheap' : 'expensive';
    const row = rows[product.id];
    row.event = type;
    row.price = type === 'cheap' ? Math.max(1,Math.floor(row.ordinaryPrice / 4)) : row.ordinaryPrice * 4;
    row.announcement = `${rng.pick(messages[type])} ${product.name} is ${type === 'cheap' ? 'unusually cheap' : 'in severe shortage'}.`;
    events.push({ productId:product.id, type, ordinaryPrice:row.ordinaryPrice, price:row.price, message:row.announcement });
  }
  state.rngState = rng.state;
  return { id:`${state.day}-${state.location}-${rng.state.toString(16)}`, day:state.day, location:state.location, listedCount, requestedEvents, events, rows };
}

export function marketRow(state, productId) {
  return state.market?.rows?.[productId] ?? null;
}
