import test from 'node:test';
import assert from 'node:assert/strict';
import { deposit, repayDebt, withdraw } from '../js/finance.js';
import { clearResolvedEncounter, declineOffer, resolveStreetIncident } from '../js/encounters.js';
import { surrenderGoods } from '../js/combat.js';
import { finishRun } from '../js/scoring.js';
import { travelTo } from '../js/travel.js';
import { game } from './helpers.js';

function resolve(state){const e=state.pendingEncounter;if(!e)return;if(e.type==='street')resolveStreetIncident(state);else if(e.type==='offer')declineOffer(state);else{state.combat.status='player-choice';surrenderGoods(state);}clearResolvedEncounter(state);}

test('travel advances one day only to a different neighborhood and applies exact interest',()=>{
  const state=game('travel-interest');assert.equal(travelTo(state,'bronx').ok,false);const result=travelTo(state,'ghetto');assert.equal(result.ok,true);assert.equal(state.day,2);assert.equal(state.trips,1);assert.equal(state.debt,6050);assert.equal(state.bank,0);
});

test('bank deposit/withdraw and Bronx debt repayment validate amounts',()=>{
  const state=game('finance');assert.equal(repayDebt(state,500).ok,true);assert.equal(state.cash,1500);assert.equal(state.debt,5000);assert.equal(repayDebt(state,2000).ok,false);
  resolve(state);travelTo(state,'manhattan');resolve(state);const cash=state.cash;assert.equal(deposit(state,500).ok,true);assert.equal(state.cash,cash-500);assert.equal(withdraw(state,200).ok,true);assert.equal(state.bank,300);assert.equal(deposit(state,-2).ok,false);
});

test('Day 30 stays playable and ends only on explicit finish',()=>{
  const state=game('day-30');const route=['ghetto','bronx'];
  while(state.day<30){const destination=route[state.day%2];resolve(state);const result=travelTo(state,destination===state.location?(destination==='bronx'?'ghetto':'bronx'):destination);assert.equal(result.ok,true);}
  resolve(state);assert.equal(state.day,30);assert.equal(state.ended,false);assert.ok(state.market);assert.equal(travelTo(state,'manhattan').ok,false);const finished=finishRun(state);assert.equal(finished.ok,true);assert.equal(state.finished,true);
});
