import test from 'node:test';
import assert from 'node:assert/strict';
import { loadGame, resetSave, saveGame, storageKeys } from '../js/persistence.js';
import { game, MemoryStorage } from './helpers.js';

test('save and reload preserve market, RNG state, and pending encounter exactly',()=>{
  const storage=new MemoryStorage();const state=game('persist');state.pendingEncounter={type:'offer',kind:'tip',token:'fixed',resolved:false,data:{destinationId:'brooklyn'}};assert.equal(saveGame(state,storage).ok,true);const loaded=loadGame('classic',storage);assert.equal(loaded.ok,true);assert.deepEqual(loaded.state.market,state.market);assert.deepEqual(loaded.state.pendingEncounter,state.pendingEncounter);assert.equal(loaded.state.rngState,state.rngState);
});

test('corrupt saves are quarantined and rejected safely',()=>{
  const storage=new MemoryStorage();storage.setItem(storageKeys.saveKey('classic'),'{broken');const loaded=loadGame('classic',storage);assert.equal(loaded.ok,false);assert.equal(loaded.state,null);assert.equal(storage.getItem(storageKeys.saveKey('classic')),null);assert.ok([...storage.map.keys()].some(key=>key.includes(':corrupt:')));
});

test('structurally corrupt Extended holdings are rejected',()=>{
  const storage=new MemoryStorage();const state=game('bad-assets');state.mode='extended';state.ownedAssets.car=-1;
  storage.setItem(storageKeys.saveKey('extended'),JSON.stringify(state));
  const loaded=loadGame('extended',storage);assert.equal(loaded.ok,false);assert.equal(loaded.state,null);
});

test('tampered market prices are quarantined instead of loaded',()=>{
  const storage=new MemoryStorage();const state=game('bad-market');const row=Object.values(state.market.rows).find(item=>item.available);row.price+=1;
  storage.setItem(storageKeys.saveKey('classic'),JSON.stringify(state));
  const loaded=loadGame('classic',storage);assert.equal(loaded.ok,false);assert.equal(loaded.state,null);assert.ok([...storage.map.keys()].some(key=>key.includes(':corrupt:')));
});

test('Classic and Extended saves never cross-load',()=>{
  const storage=new MemoryStorage();const state=game('modes');assert.equal(saveGame(state,storage).ok,true);assert.equal(loadGame('extended',storage).state,null);assert.equal(loadGame('classic',storage).state.mode,'classic');assert.equal(resetSave('classic',storage),true);
});
