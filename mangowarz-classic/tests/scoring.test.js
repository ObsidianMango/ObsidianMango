import test from 'node:test';
import assert from 'node:assert/strict';
import { purchaseExtendedAsset } from '../js/finance.js';
import { classicFinalScore, extendedPortfolioValue, finalScore, finishRun } from '../js/scoring.js';
import { createInitialState } from '../js/state.js';
import { game } from './helpers.js';

test('Classic score is exactly cash plus bank minus debt and ignores inventory',()=>{
  const state=createInitialState({mode:'classic',seed:'score'});state.cash=10000;state.bank=2500;state.debt=3000;state.inventory.cocaine=99;assert.equal(classicFinalScore(state),9500);assert.equal(finalScore(state),9500);
});

test('large Extended values remain safe and portfolio factors are explicit',()=>{
  const state=createInitialState({mode:'extended',seed:'large'});state.cash=Number.MAX_SAFE_INTEGER;assert.equal(purchaseExtendedAsset(state,'galaxy').ok,true);assert.ok(Number.isSafeInteger(state.cash));const value=extendedPortfolioValue(state);assert.equal(value,93150000000);assert.ok(Number.isSafeInteger(finalScore(state)));
});

test('forced finish cannot bypass the Day 30 or defeat gate',()=>{
  const state=game('no-early-finish');
  assert.equal(finishRun(state,{forced:true}).ok,false);
  state.health=0;state.ended=true;
  assert.equal(finishRun(state,{forced:true}).ok,true);
});
