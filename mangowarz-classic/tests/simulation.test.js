import test from 'node:test';
import assert from 'node:assert/strict';
import { surrenderGoods } from '../js/combat.js';
import { clearResolvedEncounter, declineOffer, resolveStreetIncident } from '../js/encounters.js';
import { finishRun } from '../js/scoring.js';
import { freeCapacity, validateState } from '../js/state.js';
import { buyProduct, sellProduct } from '../js/trading.js';
import { travelTo } from '../js/travel.js';
import { game } from './helpers.js';

function resolve(state){const e=state.pendingEncounter;if(!e)return;if(e.type==='street')resolveStreetIncident(state);else if(e.type==='offer')declineOffer(state);else{state.combat.status='player-choice';surrenderGoods(state);}clearResolvedEncounter(state);}

test('10,000 deterministic Classic runs avoid impossible states and premature Day 30 endings',{timeout:120000},()=>{
  let transactions=0,encounters=0;
  const route=['bronx','ghetto','central-park','manhattan','coney-island','brooklyn'];
  for(let run=0;run<10000;run++){
    const state=game(`sim-${run.toString(36)}`);
    while(state.day<30){
      for(const row of Object.values(state.market.rows))if(row.available&&(state.inventory[row.productId]??0)>0&&row.price>Math.floor((state.costBasis[row.productId]??0)/state.inventory[row.productId])){const result=sellProduct(state,row.productId,state.inventory[row.productId]);if(result.ok)transactions++;}
      const cheapest=Object.values(state.market.rows).filter(row=>row.available).sort((a,b)=>a.price-b.price)[0];
      if(cheapest){const quantity=Math.min(3,Math.floor(state.cash/cheapest.price),freeCapacity(state));if(quantity>0&&buyProduct(state,cheapest.productId,quantity).ok)transactions++;}
      resolve(state);let destination=route[(state.day+run)%route.length];if(destination===state.location)destination=route[(state.day+run+1)%route.length];const result=travelTo(state,destination);assert.equal(result.ok,true);if(result.encounter)encounters++;
      const validation=validateState(state);assert.equal(validation.valid,true,validation.errors.join(', '));assert.ok(freeCapacity(state)>=0);for(const quantity of Object.values(state.inventory))assert.ok(quantity>=0);
    }
    resolve(state);assert.equal(state.day,30);assert.equal(state.ended,false);const finish=finishRun(state);assert.equal(finish.ok,true);assert.ok(Number.isSafeInteger(finish.score));
  }
  assert.ok(transactions>10000);assert.ok(encounters>10000);
});
