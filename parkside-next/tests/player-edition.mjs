import assert from 'node:assert/strict';
import {bootGame} from './helpers/game.mjs';
const {app,T,frame}=await bootGame(),t=app.test,life=t.streetLife,dummy=t.maybachDummy;
const torso=app.scene.getObjectByName('Black V-neck shirt'),avatar=torso.parent,head=avatar.children[1],parts=avatar.children.slice(0,6),colors=head.geometry.attributes.color.array.slice();
assert.equal(new Set(parts.map(p=>p.material)).size,1);assert.equal(parts.length,6);
let triangles=0;for(const p of parts){assert(p.geometry.attributes.color);triangles+=p.geometry.attributes.position.count/3;for(const n of p.geometry.attributes.position.array)assert(Number.isFinite(n));}
assert(triangles<18000);assert.equal(life.getInfo().playerDetailMeshes,6);
app.start();assert(life.exitVehicle());life.afterStep();assert(avatar.visible);assert.equal(torso.scale.x,1);assert(life.hulk.toggle());life.afterStep();assert.equal(avatar.scale.x,1.35);assert.notDeepEqual(head.geometry.attributes.color.array,colors);assert(life.hulk.toggle());life.afterStep();assert.deepEqual(head.geometry.attributes.color.array,colors);assert.equal(torso.scale.x,1);
t.togglePerspective();life.afterStep();assert(!avatar.visible);assert(app.camera.getObjectByName('First-person hands').visible);t.togglePerspective();life.afterStep();assert(avatar.visible);
const before=life.body.position.clone();for(let i=0;i<30;i++){life.beforeStep(1/60,{KeyW:true},{});t.world.step(1/60);life.afterStep();}assert(life.body.position.distanceTo(before)>.3);
// Select a real Maybach and trigger the actual wreck route, including recorded playback.
t.setState('menu');t.selectVehicle(4);app.start();t.teleport(0,0,0,10);for(let i=0;i<20;i++)t.step(1/60);t.explode();assert.equal(dummy.getInfo().active,1);const d=app.scene.getObjectByName('Satirical 1940s dictator lookalike ragdoll');assert(d.position.distanceTo(new T.Vector3().copy(t.chassis.position))<2);assert(d.position.y>t.chassis.position.y);
const first=d.position.clone();for(let i=0;i<30;i++)t.step(1/60);assert(d.position.distanceTo(first)>2);
t.setState('paused');const paused=dummy.snapshot();for(let i=0;i<15;i++)frame();assert.deepEqual(dummy.snapshot(),paused,'pause freezes the airborne body');t.setState('wreck');for(let i=0;i<115&&app.getState().state==='wreck';i++)t.step(1/60);assert.equal(app.getState().state,'replay');let sawHidden=false,sawVisible=false;for(let i=0;i<240&&app.getState().state==='replay';i++){frame();sawHidden||=!d.visible;sawVisible||=d.visible;}assert(sawHidden&&sawVisible,'replay includes the pre-wreck absence and the ejection');
t.recover(true);assert.equal(dummy.getInfo().active,0);assert(!d.visible);
// The secret city's fifth featured parked car is a real Maybach; wrecking it ejects once.
t.loadLevel(24);app.start();const npc=t.traffic.active.find(p=>p.model==='maybach');assert(npc);t.traffic.strike(npc.body,npc.body.position,100);assert(npc.exploded);assert.equal(dummy.getInfo().active,1);t.traffic.strike(npc.body,npc.body.position,100);assert.equal(dummy.getInfo().active,1);
const bodyCount=t.world.bodies.length;for(let i=0;i<50;i++)dummy.launch(new T.Vector3(6000,2,0),new T.Vector3(),new T.Vector3(1,0,0));assert.equal(dummy.getInfo().modelCount,2);assert.equal(t.world.bodies.length,bodyCount);
const saved=dummy.snapshot();for(let i=0;i<10;i++)dummy.update(1/60);dummy.apply(saved,saved,0);assert.deepEqual(dummy.snapshot(),saved);for(let i=0;i<1000;i++)dummy.update(1/60);assert.equal(dummy.getInfo().active,0);assert(app.scene.children.filter(x=>x.name.startsWith('Satirical 1940s')).every(x=>!x.visible));
console.log(JSON.stringify({avatar:{meshes:6,materials:1,triangles,walking:true,firstPerson:true,hulkRestores:true},maybach:{playerWreck:true,npcWreck:true,pause:true,replay:true,pool:2,extraPhysicsBodies:0,expiry:true}}));
