import {SECRET_LEVEL_INDEX} from '../level-catalog.js';
import assert from 'node:assert/strict';
import {performance} from 'node:perf_hooks';
import {bootGame} from './helpers/game.mjs';
const {app,T}=await bootGame(),t=app.test;t.loadLevel(SECRET_LEVEL_INDEX);app.start();t.setState('running');t.teleport(0,210);
for(const b of t.secretView.buildings.slice(0,7))t.environment.blast(new T.Vector3(b.x,4,b.z),2);
const times=[];let peak=0;for(let i=0;i<240;i++){const start=performance.now();t.step(1/60);t.environment.render(1/60,t.streetLife.focus);times.push(performance.now()-start);peak=Math.max(peak,t.world.contacts.length);}
assert(t.environment.getInfo().broken>200);assert(t.environment.getInfo().rubblePool<=96);assert(t.world.bodyOverlapKeeper.current.length===0);assert(t.world.shapeOverlapKeeper.current.length===0);
const parked=t.environment.entries.find(e=>e.broken&&!e.explosive&&e.body.type===t.chassis.constructor.STATIC&&e.mesh.visible);assert(parked,'resting wreckage becomes a static collider');assert(parked.mesh.visible);assert(t.world.bodies.includes(parked.body));t.environment.strike(parked.body,parked.body.position,8);assert.equal(parked.body.type,t.chassis.constructor.DYNAMIC,'a weapon wakes resting wreckage');
t.recover(true);assert(t.environment.getInfo().broken===0);assert(t.environment.getInfo().rubbleFragments===0);assert(t.environment.entries.every(e=>e.body.mass===0));times.sort((a,b)=>a-b);console.log(JSON.stringify({physicsMedianMs:+times[120].toFixed(2),physicsP95Ms:+times[228].toFixed(2),peakContacts:peak,test:'Seven-building destruction, bounded rubble, visible resting colliders, wake-on-hit and full reset pass; CPU only, no GPU FPS claim.'}));
