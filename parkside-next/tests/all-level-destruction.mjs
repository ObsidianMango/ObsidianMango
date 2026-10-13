import assert from 'node:assert/strict';
import {bootGame} from './helpers/game.mjs';
import {LOTS,SECRET_LEVEL_INDEX} from '../level-catalog.js';
const {app,T,context}=await bootGame(),t=app.test,C=context.C;
// Every authored lot exposes physical scenery to the same damage pipeline.
for(let level=0;level<LOTS.length;level++){
 assert(t.loadLevel(level));
 const props=t.environment.entries;assert(props.length>0);
 const tree=props.find(e=>e.mesh.name==='Tree trunk'||e.geometry.type==='CylinderGeometry'&&!e.explosive);
 if(tree){const children=tree.mesh.children.length;t.environment.strike(tree.body,tree.body.position,12);t.environment.update(1/60);assert(tree.broken,'tree must release in lot '+level);assert(tree.mesh.children.length===children,'foliage remains attached to falling trunk');}
 const wall=props.find(e=>e.structure&&!e.role&&e.size[1]>2&&Math.min(e.size[0],e.size[2])<1);
 if(wall){const point=wall.body.position.clone();
  wall.body.dispatchEvent({type:'collide',body:t.chassis,contact:{bi:wall.body,bj:t.chassis,ri:new C.Vec3(),rj:new C.Vec3(),ni:new C.Vec3(0,0,-1),getImpactVelocityAlongNormal:()=>14}});
  t.environment.update(1/60);assert(wall.broken,'car impact releases wall in lot '+level);assert(wall.body.velocity.length()>4,'impact transfers motion to wall chunks');
  if(Math.max(...wall.originalSize)>3.6)assert(wall.shattered,'all lots use fracture');
 }
 assert(t.environment.getInfo().rubblePool<=96);t.recover(true);assert(t.environment.entries.every(e=>!e.broken));assert.equal(t.environment.fragments.length,0);
}
// Real lot crowns must move with their breakable trunks, rather than stay in the sky.
t.loadLevel(24);const tree=t.environment.entries.find(e=>e.mesh.name==='Tree trunk');assert(tree&&tree.mesh.children.length===6);
const leaf=tree.mesh.children[0];tree.mesh.updateWorldMatrix(true,true);const before=leaf.getWorldPosition(new T.Vector3());
t.environment.strike(tree.body,tree.home,12);for(let i=0;i<90;i++){t.world.step(1/60);t.environment.update(1/60);}
const after=leaf.getWorldPosition(new T.Vector3());assert(after.distanceTo(before)>1,'real-lot canopy follows moving tree');
const office=t.environment.entries.filter(e=>e.structure?.endsWith(':marina-office'));assert(office.length>60,'marina office has individual walls, roofs, floors and contents');
const roofs=office.filter(e=>e.role==='roof');assert(roofs.length===12);
// Removing load-bearing walls must drop the pitched roof and upper floors.
for(const e of office.filter(e=>!e.role))t.environment.strike(e.body,e.home,20);
t.environment.update(1/60);assert(roofs.every(e=>e.broken));
for(let i=0;i<150;i++){t.world.step(1/60);t.environment.update(1/60);}
assert(roofs.some(e=>e.body.position.y<e.home.y-2),'unsupported roof physically falls');
t.recover(true);assert(roofs.every(e=>!e.broken&&e.body.position.distanceTo(e.home)<.001));
// Secret city ram throws pieces too, and airborne rubble is never parked by the budget.
t.loadLevel(SECRET_LEVEL_INDEX);const wall=t.environment.entries.find(e=>e.structure&&!e.role&&e.size[2]<1);
t.chassis.position.set(wall.home.x,1.5,wall.home.z+2.45);t.chassis.quaternion.setFromEuler(0,0,0);t.chassis.velocity.set(0,0,-15);t.chassis.aabbNeedsUpdate=true;
t.environment.ram(t.chassis,1/60,90000);t.environment.update(1/60);assert(wall.broken&&wall.body.velocity.length()>4,'truck ram launches chunks instead of setting velocity to zero');
wall.body.position.y=30;wall.body.velocity.setZero();wall.body.angularVelocity.setZero();wall.age=3;wall.body.wakeUp();t.world.contacts.length=0;t.environment.update(1/60);assert.equal(wall.body.type,C.Body.DYNAMIC,'airborne slow piece remains simulated');
assert(t.environment.fragments.length<=96);assert(t.environment.getInfo().visualChips<=t.environment.getInfo().visualChipLimit);
// An ordinary roadster's actual physics collision also ejects chunks without a full wreck.
t.loadLevel(0);t.setState('menu');t.setGoldenMode(false);t.selectVehicle(0);app.start();t.setState('running');
const front=t.environment.entries.filter(e=>e.structure&&!e.role&&e.size[2]<1).sort((a,b)=>b.home.z-a.home.z)[2];
t.teleport(front.home.x,front.home.z+10,0,14);let peakFragments=0;
for(let i=0;i<80;i++){t.step(1/60);peakFragments=Math.max(peakFragments,t.environment.fragments.length);}
assert(front.broken);assert(peakFragments>0&&peakFragments<=96);assert.equal(app.getState().state,'running');
console.log('All parking lots: destructible trees/scenery, impact fracture, flying chunks, marine foliage, segmented office collapse, reset, secret truck ram, actual roadster crash and bounded debris pass.');
