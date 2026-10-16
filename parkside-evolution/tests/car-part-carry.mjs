import assert from 'node:assert/strict';
import {bootGame} from './helpers/game.mjs';
const {app,context}=await bootGame(),t=app.test,life=t.streetLife,C=context.C;
app.start();t.setState('running');assert(life.exitVehicle());
const part=t.car.assemblies.find(p=>/door|hood|bumper/.test(p.name));assert(part);t.detach(part,0);
const loose=t.world.bodies.find(b=>b.mass===12&&b.collisionFilterGroup===2);assert(loose);
life.body.position.set(t.chassis.position.x+8,.83,t.chassis.position.z);t.setFootCamera(0,0);loose.position.set(life.body.position.x,1,life.body.position.z-1.7);loose.velocity.setZero();
assert(life.interact(),'interact picks up nearby detached part');assert(life.parts.held);assert.equal(loose.type,C.Body.KINEMATIC);t.step(1/60);assert.equal(loose.collisionFilterMask,0,'held collision mask stays disabled');
life.beforeStep(.5,{},{});assert(life.fire(),'normal player throws part without a weapon');assert(!life.parts.held);assert.equal(loose.type,C.Body.DYNAMIC);assert(loose.velocity.length()>7);
loose.position.set(life.body.position.x,1,life.body.position.z-1.7);assert(life.parts.grab(life.parts.nearest()));life.reset();assert(!life.parts.held);assert.equal(loose.type,C.Body.DYNAMIC);
console.log('Detached car parts pick up, stay collision-free while held, throw unarmed, and release on reset.');
// Parked-car pieces retain their parent transform and remain pickable after settling.
t.loadLevel(24);app.start();t.setState('running');assert(life.exitVehicle());const parked=t.traffic.active[0];t.traffic.blast(parked.body.position,1.5);const debris=t.traffic.debris.find(d=>Math.max(...d.size)<5);assert(debris);debris.body.velocity.setZero();debris.body.angularVelocity.setZero();t.traffic.update(20);assert(t.traffic.debris.includes(debris),'settled piece stays in bounded pickable pool');assert(life.parts.grab(debris));life.parts.follow();debris.mesh.updateWorldMatrix(true,false);const rendered=debris.mesh.getWorldPosition(debris.mesh.position.clone());assert(rendered.distanceTo(debris.body.position)<.001,'held parked part uses world-to-parent transform');t.traffic.update(20);assert(debris.active,'held wreckage cannot be frozen or recycled');life.parts.clear();t.traffic.reset(24);assert.equal(t.traffic.debris.length,0);assert(!t.world.bodies.includes(debris.body));
