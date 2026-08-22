import test from 'node:test';
import assert from 'node:assert/strict';
import { buyProduct, maxBuyable, sellProduct } from '../js/trading.js';
import { freeCapacity, validateState } from '../js/state.js';
import { game } from './helpers.js';

function listed(state){return Object.values(state.market.rows).find(row=>row.available);}

test('buying and selling use integer arithmetic and preserve capacity',()=>{
  const state=game('trade-basic');const row=listed(state);state.cash=row.price*8;const before=freeCapacity(state);
  assert.equal(maxBuyable(state,row.productId),8);assert.equal(buyProduct(state,row.productId,8).ok,true);assert.equal(state.cash,0);assert.equal(freeCapacity(state),before-8);
  assert.equal(sellProduct(state,row.productId,3).ok,true);assert.equal(state.inventory[row.productId],5);assert.equal(freeCapacity(state),before-5);assert.equal(validateState(state).valid,true);
});

test('invalid and rapid-style duplicate transactions cannot overspend or oversell',()=>{
  const state=game('trade-reject');const row=listed(state);state.cash=row.price*2;
  for(const quantity of [0,-1,1.5,NaN])assert.equal(buyProduct(state,row.productId,quantity).ok,false);
  assert.equal(buyProduct(state,row.productId,2).ok,true);const cash=state.cash;assert.equal(buyProduct(state,row.productId,2).ok,false);assert.equal(state.cash,cash);
  assert.equal(sellProduct(state,row.productId,3).ok,false);assert.equal(state.inventory[row.productId],2);
});

test('unavailable products cannot be traded while held inventory persists',()=>{
  const state=game('unavailable');const id=Object.values(state.market.rows).find(row=>!row.available)?.productId;
  if(!id)return;state.inventory[id]=5;assert.equal(buyProduct(state,id,1).ok,false);assert.equal(sellProduct(state,id,1).ok,false);assert.equal(state.inventory[id],5);
});
