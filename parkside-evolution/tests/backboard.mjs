import assert from 'node:assert/strict';
import {bootGame} from './helpers/game.mjs';
import {registerToss} from '../toss-hoops.js';
const {app,context}=await bootGame(),t=app.test,C=context.C,h=t.tossHoop;
app.start();const c=h.getInfo().center;
const b=new C.Body({mass:12,material:t.chassis.material,shape:new C.Sphere(.25),linearDamping:0});t.world.addBody(b);
b.position.set(c.x,8,c.z-2);b.velocity.set(0,0,-15);let bounced=false;
for(let i=0;i<30;i++){t.world.step(1/120);if(b.velocity.z>2)bounced=true;}
assert(bounced,'backboard physically rebounds a thrown body');assert(b.position.z>c.z-3.8,'body stays in front of board');
let banked=false;
for(const vy of [9,10,11,12]){h.reset();b.position.set(c.x,2,c.z+3);b.velocity.set(0,vy,-9);b.angularVelocity.setZero();b.wakeUp();registerToss(t.world,b,'tire',{});let hit=false;for(let i=0;i<300;i++){t.world.step(1/120);if(b.velocity.z>2)hit=true;h.update(1/120);if(h.getInfo().baskets){banked=hit;break;}}if(banked)break;}
assert(banked,'a real bank shot bounces then falls through the hoop');
h.reset();b.position.set(c.x,9,c.z-2);b.velocity.set(0,0,-180);registerToss(t.world,b,'part',{});t.world.step(1/60);h.update(1/60);assert(b.velocity.z>0,'fast throw cannot tunnel through thin board');
const before=t.world.bodies.filter(x=>x.userData?.kind==='basket backboard').length;for(const i of [24,25,26,0])t.loadLevel(i);assert.equal(before,1);assert.equal(t.world.bodies.filter(x=>x.userData?.kind==='basket backboard').length,1,'one collider across map changes');
console.log('Solid rebound, gravity-driven bank shot, and collider lifecycle pass.');
