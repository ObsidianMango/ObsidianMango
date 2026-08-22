import test from 'node:test';
import assert from 'node:assert/strict';
import { acceptOffer, encounterChance, encounterGroup, generateArrivalEncounter, netWorth, resolveStreetIncident } from '../js/encounters.js';
import { SeededRng } from '../js/rng.js';
import { freeCapacity, validateState } from '../js/state.js';
import { game } from './helpers.js';

test('encounter wealth thresholds and local groups match specification',()=>{
  assert.equal(encounterChance(1_000_000),.24);assert.equal(encounterChance(1_000_001),.339);assert.equal(encounterChance(3_000_000),.339);assert.equal(encounterChance(3_000_001),.415);
  assert.equal(encounterGroup(32),'offer');assert.equal(encounterGroup(33),'street');assert.equal(encounterGroup(49),'street');assert.equal(encounterGroup(50),'police');
});

test('net worth uses the deliberate safe-integer cap policy',()=>{
  const state=game('worth-cap');state.cash=Number.MAX_SAFE_INTEGER;state.bank=Number.MAX_SAFE_INTEGER;state.debt=0;
  assert.equal(netWorth(state),Number.MAX_SAFE_INTEGER);
  state.cash=0;state.bank=0;state.debt=Number.MAX_SAFE_INTEGER;
  assert.equal(netWorth(state),-Number.MAX_SAFE_INTEGER);
});

test('generated incidents never create negative inventory or capacity',()=>{
  for(let i=0;i<5000;i++){
    const state=game(`incident-${i}`);state.cash=i%101;const rng=new SeededRng(state.seed,state.rngState);let encounter=null;
    for(let tries=0;tries<20&&!encounter;tries++)encounter=generateArrivalEncounter(state,rng);
    if(encounter?.type==='street')resolveStreetIncident(state);
    assert.ok(freeCapacity(state)>=0);assert.equal(validateState(state).valid,true);
  }
});

test('coat and weapon offers fail safely when resources are insufficient',()=>{
  const state=game('offer-safe');state.cash=0;state.pendingEncounter={type:'offer',kind:'coat',resolved:false,title:'Coat',data:{cost:250,capacity:10,before:100,after:110}};const before=JSON.stringify(state);assert.equal(acceptOffer(state).ok,false);assert.equal(JSON.stringify(state),before);
});
