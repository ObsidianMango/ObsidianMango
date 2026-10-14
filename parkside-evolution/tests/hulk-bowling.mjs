import assert from 'node:assert/strict';
import {bootGame} from './helpers/game.mjs';
import {SECRET_LEVEL_INDEX} from '../level-catalog.js';
const {app,context,get}=await bootGame(),t=app.test,life=t.streetLife,crowd=t.crowd,C=context.C;
assert(t.loadLevel(SECRET_LEVEL_INDEX));app.start();t.setState('running');t.teleport(0,210);assert(life.exitVehicle());const ox=t.secretView.ox;
crowd.reset(SECRET_LEVEL_INDEX,ox,{count:3,routes:[{x0:0,x1:4,z0:190,z1:194},{x0:0,x1:4,z0:183,z1:187},{x0:.2,x1:4.2,z0:177,z1:181}]});
life.body.position.set(ox,.83,192);life.body.velocity.setZero();t.setFootCamera(0,.35);get('hulkButton').click();assert(life.hulk.active);life.beforeStep(.5,{},{});assert(life.fire());assert.equal(crowd.held,crowd.people[0]);life.beforeStep(.5,{},{});assert(life.fire());assert(!crowd.held);
for(let i=0;i<90&&!crowd.people[1].down;i++)t.step(1/60);
assert(crowd.people[1].down,'actual Hulk grab/throw input topples a walking pedestrian');assert(crowd.getInfo().activeRagdolls<=16);
// High-frequency sweeps must not miss short movements. Solid walls still block bowling.
function sweep(wall){crowd.reset(SECRET_LEVEL_INDEX,ox,{count:2,routes:[{x0:0,x1:4,z0:190,z1:194}]});const [p,v]=crowd.people;assert(crowd.grab(p));assert(crowd.releaseHeld(new C.Vec3(0,0,-6)));const target=v.pose[0].p;p.lastFlight.set(target.x,target.y,target.z+.02);p.bodies[0].position.set(target.x,target.y,target.z-.02);p.bodies[0].velocity.set(0,0,-6);let body;if(wall){body=new C.Body({mass:0,shape:new C.Box(new C.Vec3(1,2,.005)),position:new C.Vec3(target.x,target.y,target.z+.01)});t.world.addBody(body);}crowd.afterStep(1/240,true);if(body)t.world.removeBody(body);return v.down;}
assert(sweep(false),'short per-frame sweep hits overlapping pedestrian');assert(!sweep(true),'solid wall blocks sweep');
crowd.reset(SECRET_LEVEL_INDEX,ox,{count:18,routes:[{x0:0,x1:30,z0:190,z1:220}]});
const carrier=crowd.people[0];assert(crowd.grab(carrier));assert(crowd.releaseHeld(new C.Vec3(0,0,-18)));for(let i=1;i<16;i++)crowd.strike(crowd.people[i].sensor,crowd.people[i].pose[0].p,100,'hammer');carrier.age=8;const bystander=crowd.people[16],point=bystander.pose[0].p;carrier.lastFlight.set(point.x,point.y,point.z+1);carrier.bodies[0].position.set(point.x,point.y,point.z-1);carrier.bodies[0].velocity.set(0,0,-18);crowd.afterStep(1/60,true);assert(bystander.down);assert(carrier.bodies,'throwing body is not evicted while knocking down the seventeenth ragdoll');assert(crowd.getInfo().activeRagdolls<=16);
console.log('Hulk touch grab/throw knocks down bystanders through actual physics; short high-FPS sweeps work; walls block bowling; ragdoll limit retained.');
