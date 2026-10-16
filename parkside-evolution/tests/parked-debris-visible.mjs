import assert from 'node:assert/strict';
import {bootGame} from './helpers/game.mjs';
import {SECRET_LEVEL_INDEX} from '../level-catalog.js';
const {app,T,frame}=await bootGame(),t=app.test,life=t.streetLife;
t.loadLevel(SECRET_LEVEL_INDEX);app.start();t.setState('running');assert(life.exitVehicle());t.togglePerspective();
const car=t.traffic.active.find(c=>c.model==='montecarlo');const initial=t.traffic.snapshot();t.traffic.blast(car.body.position,1.5);
const pieces=t.traffic.debris.filter(d=>d.item===car);assert(pieces.length>=20);for(const name of ['wheel','door','bonnet','bumper','engine'])assert(pieces.some(d=>d.part.name.includes(name)),name+' must separate');
life.body.position.set(t.secretView.ox+1000,.83,210);t.setFootCamera(0,0);
function rendered(part){let count=0;app.scene.traverseVisible(m=>{if(m.isMesh){let p=m;while(p&&p!==part)p=p.parent;if(p===part)count++;}});return count;}
const wheel=pieces.find(d=>d.part.name.startsWith('wheel-'));assert(life.parts.grab(wheel));car.mesh.visible=false;car.mesh.removeFromParent();life.parts.follow();assert(rendered(wheel.part)>0,'debris renders independently of the wreck visibility/parent');
const point=wheel.part.getWorldPosition(new T.Vector3());assert(point.distanceTo(wheel.body.position)<.001);assert(wheel.part.quaternion.toArray().every(Number.isFinite),'Cannon rotation must be converted to a Three quaternion');assert(Math.abs(wheel.part.quaternion.length()-1)<.001);const bounds=new T.Box3().setFromObject(wheel.part);assert([...bounds.min.toArray(),...bounds.max.toArray()].every(Number.isFinite),'rendered wheel bounds must be finite');assert(Math.abs(point.y-life.body.position.y-.6)<.5,'normal carry stays in view');
life.beforeStep(.5,{},{});assert(life.fire());t.traffic.update(1/60);assert(rendered(wheel.part)>0,'thrown part still renders');
t.trafficLOD.originals();const door=pieces.find(d=>d.part.name.includes('door'));door.body.position.set(life.body.position.x,1,life.body.position.z-1);for(const d of pieces)if(d!==door)d.body.position.x+=50;
life.hulk.toggle();life.beforeStep(.5,{},{});assert(life.hulk.use());assert(life.hulk.held);life.hulk.follow();assert(Math.abs(life.hulk.held.body.position.y-(life.body.position.y+1.12))<.5,'Hulk first-person carry stays below eye level');assert(rendered(door.part)>0);assert(door.part.quaternion.toArray().every(Number.isFinite));life.hulk.stop();
// Replay still stores vehicle-local part poses, even though rendering is independent.
t.traffic.apply(initial,initial,0);const replay=t.traffic.snapshot();assert.equal(replay.length,initial.length);for(let i=0;i<initial.length;i++)assert(Math.abs(replay[i]-initial[i])<.002,'replay pose '+i);
t.traffic.reset(SECRET_LEVEL_INDEX);assert.equal(t.traffic.debris.length,0);assert(car.parts.every(p=>p.parent===car.mesh&&!p.userData.trafficDetached));assert(!app.scene.getObjectByName('Independent vehicle wreckage').children.length);
console.log('Recognizable wheels/doors/hoods/bumpers/engines detach; independent visibility, normal/Hulk carry, throws, replay and reset pass.');
