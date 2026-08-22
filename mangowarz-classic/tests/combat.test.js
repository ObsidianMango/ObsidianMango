import test from 'node:test';
import assert from 'node:assert/strict';
import { attemptEscape, beginCombatChoice, enemyAttack, finalizeCombat, playerAttack } from '../js/combat.js';
import { SeededRng } from '../js/rng.js';
import { game } from './helpers.js';

function combatState(seed='combat'){
  const state=game(seed);state.weapons=['38-special'];state.pendingEncounter={type:'police',resolved:false,art:'',text:''};state.combat={status:'encounter-start',round:0,resolving:false,unitName:'Test Patrol',enemyCount:1,activeEnemies:1,perEnemyHealth:12,enemyHealth:12,enemyMaxHealth:12,enemyDamage:[1,3],log:[],outcome:null,abandonedGoods:false};return state;
}

test('armed combat resolves to victory or health defeat without deadlock',()=>{
  const state=combatState('combat-resolution');const rng=new SeededRng(state.seed,state.rngState);beginCombatChoice(state);let turns=0;
  while(!['victory','defeat'].includes(state.combat.status)&&turns++<100){const attack=playerAttack(state,rng);assert.equal(attack.ok,true);if(!attack.victory)enemyAttack(state,rng);}
  assert.ok(['victory','defeat'].includes(state.combat.status));assert.ok(turns<100);assert.equal(finalizeCombat(state).ok,true);assert.equal(state.pendingEncounter.resolved,true);
});

test('escape attempts report probability and always transition out of escape-attempt',()=>{
  const state=combatState('escape-resolution');const rng=new SeededRng(state.seed,state.rngState);beginCombatChoice(state);const result=attemptEscape(state,rng,{abandonGoods:false});assert.equal(result.ok,true);assert.notEqual(state.combat.status,'escape-attempt');assert.ok(result.chance>=.08&&result.chance<=.92);
});

test('enemy attacks can reduce health to zero and terminate run',()=>{
  const state=combatState('health-defeat');state.health=1;state.combat.status='player-attack';state.combat.enemyDamage=[100,100];const rng=new SeededRng(state.seed,state.rngState);
  for(let i=0;i<20&&!state.ended;i++){state.combat.status='player-attack';enemyAttack(state,rng);}
  assert.equal(state.health,0);assert.equal(state.ended,true);assert.equal(state.finishReason,'health');
});
