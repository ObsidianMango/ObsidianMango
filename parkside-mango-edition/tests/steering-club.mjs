import assert from 'node:assert/strict';
import {bootGame} from './helpers/game.mjs';
import {VEHICLES} from '../garage-models.js';
const {app,T,get,window,frame,setPads}=await bootGame(),t=app.test,life=t.streetLife;
function steerFor(code,count=25){if(code)t.input[code]=true;for(let i=0;i<count;i++)t.step(1/60);if(code)delete t.input[code];}
const tested=[];
for(let i=0;i<VEHICLES.length;i++){
 t.setState('menu');t.selectVehicle(i);app.start();const car=t.car,wheel=car.assemblies.find(p=>p.name==='steering-wheel'),cabin=car.assemblies.find(p=>p.name==='cabin');assert(wheel,VEHICLES[i].id);const home=wheel.position.clone(),cabinQ=cabin.quaternion.clone();
 steerFor('KeyA');assert(wheel.rotation.z>.8,car.config.id+' left');assert(wheel.position.distanceTo(home)<1e-5,'spin remains centered');assert(cabin.quaternion.equals(cabinQ),'dashboard remains fixed');assert(t.vehicle.wheelInfos[0].steering>0);
 steerFor('KeyD',45);assert(wheel.rotation.z<-.8,car.config.id+' right');assert(t.vehicle.wheelInfos[0].steering<0);steerFor(null,90);assert(Math.abs(wheel.rotation.z)<1e-4,'wheel returns to center');
 t.setState('menu');t.setGoldenMode(true);assert(t.car.assemblies.some(p=>p.name==='steering-wheel'));app.start();steerFor('KeyA');assert(t.car.assemblies.find(p=>p.name==='steering-wheel').rotation.z>.8);t.setState('menu');t.setGoldenMode(false);tested.push(VEHICLES[i].id);
}
// Real touch wheel gesture and Xbox axes flow into the same cockpit wheel.
t.selectVehicle(0);app.start();const wheel=t.car.assemblies.find(p=>p.name==='steering-wheel');
function pointer(type,x,y){const e=new window.Event(type,{bubbles:true,cancelable:true});Object.assign(e,{pointerId:1,clientX:x,clientY:y});get('steeringWheel').dispatchEvent(e);}
pointer('pointerdown',50,0);pointer('pointermove',100,22);for(let i=0;i<20;i++)t.step(1/60);assert(wheel.rotation.z<-.5,'touch gesture rotates cockpit');pointer('pointerup',100,22);for(let i=0;i<90;i++)frame();
const pad={index:0,id:'Xbox Wireless Controller',mapping:'standard',connected:true,axes:[-.8,0,0,0],buttons:Array.from({length:17},()=>({value:0,pressed:false}))};setPads([pad]);for(let i=0;i<30;i++)frame();assert(wheel.rotation.z>.5,'Xbox axis rotates cockpit');setPads([]);for(let i=0;i<70;i++)frame();
// A detached steering assembly keeps its own simulated pose and replay visibility.
steerFor('KeyA');t.detach(wheel,4,true);assert(!wheel.userData.attached);steerFor('KeyD');assert(!wheel.userData.attached);assert(wheel.parent===app.scene);assert(wheel.quaternion.angleTo(new T.Quaternion().setFromAxisAngle(new T.Vector3(0,0,1),t.vehicle.wheelInfos[0].steering/.69*Math.PI*.75))>.01);t.recover(true);assert(wheel.userData.attached);
// Secret monster and a borrowed reference car also have a working wheel.
t.loadLevel(24);app.start();const monsterWheel=t.car.assemblies.find(p=>p.name==='steering-wheel');assert(monsterWheel);steerFor('KeyA');assert(monsterWheel.rotation.z>.5);t.chassis.velocity.setZero();t.teleport(0,190);assert(life.exitVehicle());const car=t.traffic.active.find(p=>p.model==='montecarlo');life.body.position.copy(car.body.position);life.body.position.x+=3;assert(life.enterVehicle(car));steerFor('KeyD');assert(t.car.assemblies.find(p=>p.name==='steering-wheel').rotation.z<-.5);t.chassis.velocity.setZero();assert(life.exitVehicle());
life.refreshDoors();const club=t.secretView.buildings.find(b=>b.type==='club');function visit(){life.body.position.set(club.door.x+club.door.nx*.6,.83,club.door.z+club.door.nz*.6);assert(life.enterBuilding(club));}
visit();const performers=life.room.children.filter(x=>x.name==='Adult stage performer'),female=performers.find(p=>p.userData.gender==='female');assert(female?.userData.adult);assert(performers.some(p=>p.userData.gender==='male'));assert.equal(life.clubRoom.getInfo().femalePerformers,1);assert.equal(female.children.filter(m=>m.material.color.getHex()===0x93426d&&m.scale.x===.15).length,2,'covered cuboid bustier forms');const before=female.rotation.y;life.updateVisuals(.05);assert.notEqual(female.rotation.y,before);
const bodies=t.world.bodies.length,materials=life.getInfo().materials,count=life.room.children.length;for(let i=0;i<12;i++){assert(life.leaveBuilding());visit();assert.equal(t.world.bodies.length,bodies);assert.equal(life.getInfo().materials,materials);assert.equal(life.room.children.length,count);assert.equal(life.clubRoom.getInfo().femalePerformers,1);}
console.log(JSON.stringify({steering:{vehicles:tested,golden:true,monster:true,borrowed:true,touch:true,xbox:true,returnsToCenter:true,detaches:true},club:{adultFemale:true,adultMale:true,coveredBlockyBustier:true,animated:true,repeatedVisits:12,stableResources:true}}));
