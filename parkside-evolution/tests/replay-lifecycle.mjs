import assert from 'node:assert/strict';import {bootGame} from './helpers/game.mjs';import {wheelRenderInfo} from '../vehicle-wheels.js';
const {app,frame}=await bootGame(),t=app.test;
for(const index of [0,4,8,9,10,11]){
 t.setState('menu');t.setGoldenMode(false);t.selectVehicle(index);t.loadLevel(0);app.start();t.setState('running');t.teleport(0,70,0,14);for(let i=0;i<10;i++)t.step(1/60);
 const id=t.spec.id,count=t.car.assemblies.length;t.explode();assert.equal(app.getState().state,'wreck');assert.equal(app.getState().attached.length,0);assert.equal(app.getState().partsLost,count);for(let i=0;i<150;i++)frame();assert(['replay','wreckReview'].includes(app.getState().state));assert.equal(t.spec.id,id);assert(t.director.getInfo().frames>30);assert(t.car.assemblies.every(p=>p.visible),'recorded detached parts remain visible');
 t.recover(true);assert.equal(t.car.assemblies.filter(p=>p.userData.attached).length,count);assert(wheelRenderInfo(t.car).every(w=>w.visible&&w.attached));assert.equal(t.world.bodies.filter(b=>b.collisionFilterGroup===2).length,0,'wreck bodies removed on recovery');
}
const counts=new Map();for(let cycle=0;cycle<3;cycle++)for(const level of [0,8,24,25,26,27]){t.loadLevel(level);app.start();const count=t.world.bodies.length;if(counts.has(level))assert.equal(count,counts.get(level),'level body count stable after repeated transitions');else counts.set(level,count);assert.equal(t.world.bodies.filter(b=>b.userData?.kind==='world boundary').length,4);}
console.log('Six authored vehicle wrecks retain their parts through replay and reset all wheels; repeated normal/real-world/Secret transitions retain stable body counts.');
