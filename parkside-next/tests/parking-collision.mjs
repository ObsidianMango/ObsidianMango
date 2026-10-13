import assert from 'node:assert/strict';
import {bootGame} from './helpers/game.mjs';
const {app,T,context}=await bootGame(),t=app.test,C=context.C;
for(const level of [0,12,24,25]){
 assert(t.loadLevel(level));app.start();t.setState('running');t.teleport(0,0);
 const origin=t.chassis.position.x;
 for(let i=0;i<20;i++)t.terrain.blast(new T.Vector3(origin+i*.1,0,0),2);
 assert.equal(t.terrain.getInfo().deepest,0,'flat rendered pavement cannot hide a deep physics crater');
 assert.equal(t.terrain.getInfo().surfaceScars,8,'blast scars replace the oldest within a fixed pool');
 assert(Math.abs(t.terrain.snapshot().at(-1)[0]-1.9)<.001,'new impacts still show after the pool fills');
 const ground=t.world.bodies.find(b=>b.shapes.some(s=>s instanceof C.Heightfield));assert(ground);
 const result=new C.RaycastResult();assert(t.world.raycastClosest(new C.Vec3(origin,5,0),new C.Vec3(origin,-3,0),{collisionFilterMask:1},result));
 assert(result.hitPointWorld.y>=-.001,'wheel ray must never fall into an invisible pavement hole');
 const scars=app.scene.children.find(g=>g.children?.length===8&&g.children.every(c=>c.children?.some(p=>p.isLineSegments)));
 assert(scars);assert.equal(scars.children.filter(c=>c.visible).length,8);
 t.recover(true);assert.equal(t.terrain.getInfo().surfaceScars,0);assert(scars.children.every(c=>!c.visible));
}
t.loadLevel(0);t.setState('menu');t.setGoldenMode(false);t.selectVehicle(0);t.setState('running');
let panel=t.car.assemblies.find(p=>/fender|hood|bonnet|bumper|door/i.test(p.name));t.car.root.updateMatrixWorld(true);
const point=panel.getWorldPosition(new T.Vector3());
t.handleHit({impact:1.8,kind:'scenery',point,velocity:new T.Vector3()});
assert(t.car.assemblies.some(p=>p.userData.panelDent>0),'small impacts leave visible panel dents');
t.handleHit({impact:5,kind:'scenery',point,velocity:new T.Vector3()});assert(app.getState().partsLost>0);assert.equal(app.getState().state,'running');
t.handleHit({impact:12,kind:'scenery',point,velocity:new T.Vector3()});assert.equal(app.getState().state,'running','moderate impacts progressively damage before a full wreck');
t.recover(true);
const e=t.environment.entries.find(e=>!e.explosive);assert(e);const original=e.mesh.geometry;
// Solver has already stopped the car: use the contact normal, not zero velocity.
e.body.dispatchEvent({type:'collide',body:t.chassis,contact:{bi:e.body,bj:t.chassis,ri:new C.Vec3(0,0,.3),rj:new C.Vec3(),ni:new C.Vec3(0,0,1),getImpactVelocityAlongNormal:()=>2}});
t.environment.update(1/60);assert(e.damage>0&&!e.broken);assert.notEqual(e.mesh.geometry,original);assert(Math.hypot(...e.dent.slice(3))>.99,'contact retains dent direction after solver stops car');
assert(e.mesh.geometry.attributes.position.array.some((v,i)=>Math.abs(v-e.baseVertices[i])>.001),'scenery geometry visibly deforms');
t.recover(true);assert.equal(e.mesh.geometry,original);assert.equal(e.damage,0);
console.log('Parking collision: four maps, flat wheel contact after blasts, pooled visible scars, small dents, loose trim, progressive car damage, directed scenery dents and reset pass.');
