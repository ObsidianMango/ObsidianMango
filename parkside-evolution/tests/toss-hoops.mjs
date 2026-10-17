import assert from 'node:assert/strict';
import {bootGame} from './helpers/game.mjs';
import {registerToss} from '../toss-hoops.js';
const {app,context,get,document}=await bootGame({progress:[]}),t=app.test,C=context.C,hoop=t.tossHoop;
get('chooseVehicle').click();assert.equal(document.querySelectorAll('.mode-levels:not([hidden]) .lot-card').length,24);
get('mode-real').click();assert.equal(app.getState().level,24);assert.equal(document.querySelectorAll('.mode-levels:not([hidden]) .lot-card').length,3);
get('mode-free').click();assert(get('start').disabled);assert(get('secretLot').disabled);assert.match(get('secretLot').textContent,/24 training/);
get('mode-training').click();assert.equal(app.getState().level,0);assert(!get('start').disabled);
app.start();const c=hoop.getInfo().center,body=new C.Body({mass:12,shape:new C.Sphere(.3)});t.world.addBody(body);const owner={carryGeneration:1};
function above(x=c.x){body.position.set(x,8,c.z);body.velocity.set(0,-10,0);}
function cross(){body.position.y=3;hoop.update(1/60);}
above();cross();assert.equal(hoop.getInfo().baskets,0,'ambient debris cannot score');
above();registerToss(t.world,body,'tire',owner);cross();assert.equal(hoop.getInfo().baskets,1);assert.equal(hoop.getInfo().lastAward.points,150);assert.equal(hoop.getInfo().lastAward.cash,15);
above();cross();assert.equal(hoop.getInfo().baskets,1,'one award per release');
above(c.x+15);registerToss(t.world,body,'person',owner);body.position.set(c.x,8,c.z);hoop.update(1/60);cross();assert.equal(hoop.getInfo().lastAward.points,400,'long shots double reward');
above();registerToss(t.world,body,'part',owner);owner.heldByHulk=true;cross();assert.equal(hoop.getInfo().baskets,2);owner.heldByHulk=false;
above();registerToss(t.world,body,'part',owner);owner.carryGeneration++;cross();assert.equal(hoop.getInfo().baskets,2,'recycled pieces cannot score');
above(c.x+4);registerToss(t.world,body,'part',owner);cross();assert.equal(hoop.getInfo().baskets,2,'miss outside rim');
above();registerToss(t.world,body,'part',owner);hoop.update(.1,false);cross();assert.equal(hoop.getInfo().baskets,2,'indoor and inactive throws cleared');
t.recover(true);assert.equal(hoop.getInfo().baskets,0);
// Real carry paths register the detached wheel and exactly one torso per person.
const life=t.streetLife;life.exitVehicle();const wheel=t.car.assemblies.find(p=>p.name.startsWith('wheel-'));t.detach(wheel,0);const wheelBody=t.world.bodies.find(b=>b.mass===25&&b.collisionFilterGroup===2);wheelBody.position.set(t.chassis.position.x+8,1,t.chassis.position.z);life.body.position.set(wheelBody.position.x,.83,wheelBody.position.z+1.7);t.setFootCamera(0,0);assert(life.interact());assert(life.parts.held);life.parts.release(new C.Vec3(0,12,-5));assert.equal(hoop.getInfo().activeThrows,1);hoop.reset();
const person=t.crowd.people[0];assert(t.crowd.grab(person));t.crowd.releaseHeld(new C.Vec3(0,12,-5));assert.equal(hoop.getInfo().activeThrows,1,'one torso, not seven body parts');hoop.reset();assert(t.crowd.grab(person));t.crowd.releaseHeld();assert.equal(hoop.getInfo().activeThrows,0,'dropping is not throwing');
console.log('Basket sweeps, rewards, throw ownership, held/recycled exclusions, reset, and mode locks pass.');
// A real ballistic arc reaches the rim using the existing normal throw strength.
hoop.reset();body.position.set(c.x,1.2,c.z+12);body.velocity.set(0,12,-6.45);body.linearDamping=0;registerToss(t.world,body,'tire',{});
for(let i=0;i<150;i++){t.world.step(1/60);hoop.update(1/60);}
assert.equal(hoop.getInfo().baskets,1,'normal-strength thrown tire reaches the basket under gravity');
const unlockedGame=await bootGame(),u=unlockedGame.app.test;
for(let i=0;i<=27;i++){assert(u.loadLevel(i));const h=u.tossHoop.getInfo(),v=u.lots.views[i];assert.equal(u.tossHoop.root.parent,v.group);assert.equal(h.activeThrows,0);assert(Math.abs(h.center.x-v.ox)+9<(i===27?249:106));assert(Math.abs(h.center.z)+9<(i===27?249:106));for(const b of v.phys){b.updateAABB();const lo=b.aabb.lowerBound,hi=b.aabb.upperBound;if(hi.y<.5)continue;assert(!(lo.x<h.center.x+5&&hi.x>h.center.x-5&&lo.z<h.center.z+5&&hi.z>h.center.z-5),'hoop overlaps obstacle in level '+i);}}
assert.equal(unlockedGame.app.getState().levelMode,'free');assert(!unlockedGame.get('start').disabled);
console.log('All 28 maps have a clear, in-bounds hoop; unlocked Free Roam starts.');
