import assert from 'node:assert/strict';
import {bootGame} from './helpers/game.mjs';
import {VEHICLES} from '../garage-models.js';
const {app,T,document,frame}=await bootGame(),t=app.test;
for(const id of ['santafe','e250','newyorker','nova','impala','montecarlo']){
 const index=VEHICLES.findIndex(v=>v.id===id);assert(index>=0,id);
 t.setState('menu');t.selectVehicle(index);app.start();t.setState('running');
 document.getElementById('perspectiveButton').click();
 frame();
 const car=t.car,seat=document.getElementById('seatAdjustPanel'),headrest=car.root.getObjectByName('driver-headrest');
 document.querySelector('[aria-label="Adjust driver seat"]').click();
 assert(!seat.hidden,'seat panel must be available in first person');
 const eye=car.root.worldToLocal(app.camera.position.clone());
 assert(eye.y>1.40);
 if(['santafe','e250','newyorker'].includes(id)){
  assert(headrest,'separate driver headrest retains exterior model detail');
  assert.equal(headrest.visible,false,'hide only obstructing headrest in cockpit');
  assert(eye.y>=1.58,'camera clears headrest');
  if(id==='e250')assert(eye.z<0,'van camera sits in front cabin, not cargo area');
  const target=car.root.getObjectByName('steering-wheel').position.clone();
  const start=car.root.localToWorld(eye.clone()),end=car.root.localToWorld(target);
  const ray=new T.Raycaster(start,end.clone().sub(start).normalize(),0,start.distanceTo(end));
  const hits=ray.intersectObject(car.root,true).filter(h=>h.object.parent.visible&&!h.object.material.transparent);
  assert.equal(hits[0]?.object.parent.name,'steering-wheel',id+' wheel must be unobstructed');
  const shell=car.assemblies.filter(p=>/^(door-left|door-right|lower-left|lower-right)$/.test(p.name));
  for(const x of [-.4,0,.4]){
   const a=car.root.localToWorld(new T.Vector3(x,1.7,0)),b=car.root.localToWorld(new T.Vector3(x,.8,0));
   const probe=new T.Raycaster(a,b.clone().sub(a).normalize(),0,a.distanceTo(b));
   assert.equal(probe.intersectObjects(shell,true).length,0,id+' body shell must not span cabin');
  }
 }else assert.equal(headrest,undefined,'approved fleet camera geometry unchanged');
 const before=eye.clone();
 seat.querySelector('[data-seat=up]').click();seat.querySelector('[data-seat=back]').click();frame();
 const after=car.root.worldToLocal(app.camera.position.clone());
 assert(after.y>before.y&&after.z>before.z,'seat controls move actual camera');
 seat.querySelector('[data-seat=reset]').click();frame();
 const reset=car.root.worldToLocal(app.camera.position.clone());
 assert(reset.distanceTo(before)<.005);
 t.setState('paused');frame();
 assert(seat.hidden,'seat panel closes when paused');
 t.setState('running');frame();
 if(headrest){t.detach(headrest);assert(headrest.visible,'detached headrest must be visible');t.restore();frame();}
 document.getElementById('perspectiveButton').click();frame();
 assert(headrest?.visible!==false,'all detail returns in exterior view');
 t.recover(true);
}
console.log('Six first-person views: Santa Fe/E250/New Yorker open cabins and headrest clearance, unchanged Nova/Impala/Monte Carlo, seat controls, reset and exterior restoration pass.');
