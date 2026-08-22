import test from 'node:test';
import assert from 'node:assert/strict';
import { CHEAP_IDS, CLASSIC_PRODUCTS, EXPENSIVE_IDS, LOCATION_BY_ID } from '../js/config.js';
import { generateMarket, sampleSpecialEventCount } from '../js/market.js';
import { SeededRng } from '../js/rng.js';
import { createInitialState } from '../js/state.js';

test('ordinary prices and listing counts stay in configured ranges',()=>{
  for(const location of Object.values(LOCATION_BY_ID))for(let i=0;i<500;i++){
    const state=createInitialState({seed:`${location.id}-${i}`});state.location=location.id;const market=generateMarket(state,new SeededRng(state.seed));
    assert.ok(market.listedCount>=location.minListed&&market.listedCount<location.maxListedExclusive);
    for(const product of CLASSIC_PRODUCTS){const row=market.rows[product.id];if(!row.available){assert.equal(row.price,null);continue;}if(row.event==='ordinary')assert.ok(row.price>=product.min&&row.price<product.maxExclusive);}
  }
});

test('special count distribution tracks 30/42/26.6/1.4 percentages',()=>{
  const rng=new SeededRng('probability-200k');const counts=[0,0,0,0];const n=200000;
  for(let i=0;i<n;i++)counts[sampleSpecialEventCount(rng)]++;
  const expected=[.30,.42,.266,.014];counts.forEach((count,index)=>assert.ok(Math.abs(count/n-expected[index])<.006,`${index}: ${count/n}`));
});

test('generated markets realize the rolled number of special events',()=>{
  const counts=[0,0,0,0];const n=50000;
  for(let i=0;i<n;i++){
    const state=createInitialState({seed:`actual-shocks-${i}`});state.location='manhattan';
    const market=generateMarket(state,new SeededRng(state.seed));
    assert.equal(market.events.length,market.requestedEvents);
    counts[market.events.length]++;
  }
  const expected=[.30,.42,.266,.014];
  counts.forEach((count,index)=>assert.ok(Math.abs(count/n-expected[index])<.012,`${index}: ${count/n}`));
});

test('cheap and expensive shocks affect one eligible product each with exact multipliers',()=>{
  for(let i=0;i<2000;i++){
    const state=createInitialState({seed:`shock-${i}`});state.location=Object.keys(LOCATION_BY_ID)[i%6];const market=generateMarket(state,new SeededRng(state.seed));const seen=new Set();
    for(const event of market.events){assert.ok(!seen.has(event.productId));seen.add(event.productId);if(event.type==='cheap'){assert.ok(CHEAP_IDS.includes(event.productId));assert.equal(event.price,Math.max(1,Math.floor(event.ordinaryPrice/4)));}else{assert.ok(EXPENSIVE_IDS.includes(event.productId));assert.equal(event.price,event.ordinaryPrice*4);}}
  }
});

test('six-product variant never lists disabled products',()=>{
  const state=createInitialState({seed:'six',sixProductVariant:true});const market=generateMarket(state,new SeededRng(state.seed));assert.equal(Object.keys(market.rows).length,6);
});
