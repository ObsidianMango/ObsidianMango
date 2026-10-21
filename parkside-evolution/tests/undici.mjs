import assert from 'node:assert/strict';
import {bootGame} from './helpers/game.mjs';
import {LOTS} from '../level-catalog.js';
const {app}=await bootGame(),t=app.test,index=LOTS.findIndex(l=>l.style==='undici'),level=LOTS[index];
t.loadLevel(index);const v=t.lots.views[index],data=v.group.userData.undici;
assert.equal(data.slots,47);assert.equal(data.occupied,45);assert.equal(data.vacancies.length,2);
for(const lot of ['west','east'])assert.equal(data.vacancies.filter(s=>s.lot===lot).length,1);
assert.equal(t.traffic.active.length,45);
for(const target of [level.target,...level.alternateTargets]){
 app.start();
 for(const gate of level.gates){t.teleport(gate.x,gate.z+1,0,8);for(let i=0;i<25;i++)t.step(1/60);}
 assert.equal(app.getState().route.cleared,3);
 t.teleport(target.x,target.z,target.yaw);for(let i=0;i<240;i++)t.step(1/60);
 assert.equal(app.getState().state,'ended','either open bay must complete the level');
}
console.log('Undici: 47 marked spaces, 45 parked cars, one vacancy per lot, both parking wins pass.');
