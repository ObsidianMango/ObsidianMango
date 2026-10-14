import {SECRET_LEVEL_INDEX} from '../level-catalog.js';
import assert from 'node:assert/strict';
import {bootGame} from './helpers/game.mjs';

// Regression: progressive panel damage should happen before total disassembly.
const a=await bootGame(),t=a.app.test,T=a.T,C=a.context.C;
a.app.start();t.setState('running');
const car=t.car;
const panel=car.assemblies.find(p=>p.userData.attached&&/fender|bonnet|hood|door|bumper|grille/i.test(p.name));
assert(panel,'expected an authored damageable body panel');
car.root.updateMatrixWorld(true);
const impact=panel.getWorldPosition(new T.Vector3()),before=panel.scale.clone();
t.handleHit({impact:3.3,kind:'scenery',point:impact,velocity:new T.Vector3()});
assert(t.car.assemblies.some(p=>p.userData.panelDent>0),'collision must dent at least one attached body panel');
assert.equal(a.app.getState().state,'running','modest dent should not wreck the whole car');
t.loadLevel(0);t.setState('menu');t.selectVehicle(0);
assert.equal(t.car.assemblies.filter(p=>p.userData.panelDent>0).length,0,'reset must remove cumulative dents');

// Regression: thrown ragdolls collide with existing pedestrian positions.
const b=await bootGame(),g=b.app.test;
assert(g.loadLevel(SECRET_LEVEL_INDEX),'unlock final Secret City');
b.app.start();g.setState('running');
g.crowd.reset(SECRET_LEVEL_INDEX,g.secretView.ox,{count:2,routes:[{x0:0,x1:8,z0:0,z1:8}]});
const [thrower,victim]=g.crowd.people;
assert(g.crowd.grab(thrower));
assert(g.crowd.releaseHeld(new C.Vec3(0,2,-18)));
const target=victim.pose[0].p;
thrower.lastFlight.set(target.x,target.y,target.z+1.7);
thrower.bodies[0].position.set(target.x,target.y,target.z-1.7);
thrower.bodies[0].velocity.set(0,0,-18);
g.crowd.afterStep(1/60,true);
assert(victim.down,'throw must topple another pedestrian along its flight');
assert(g.crowd.getInfo().activeRagdolls<=16,'ragdoll budget must remain capped');
console.log('Chaos destruction: dents, restore, thrown ragdoll collisions and ragdoll budget pass.');
