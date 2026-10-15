import assert from 'node:assert/strict';
import {bootGame} from './helpers/game.mjs';
import {VEHICLES} from '../garage-models.js';
const {app,T,document,frame}=await bootGame(),t=app.test;
for(const id of ['santafe','newyorker','nova','impala','montecarlo']){
 const index=VEHICLES.findIndex(v=>v.id===id);assert(index>=0,id);
 t.setState('menu');t.selectVehicle(index);app.start();t.setState('running');
 document.getElementById('perspectiveButton').click();
 frame();
 const car=t.car,seat=document.getElementById('seatAdjustPanel'),headrest=car.root.getObjectByName('driver-headrest');
 document.querySelector('[aria-label="Adjust driver seat"]').click();
 assert(!seat.hidden,'seat panel must be available in first person');
 const eye=car.root.worldToLocal(app.camera.position.clone());
 assert(eye.y>1.40);
 if(id==='santafe'||id==='newyorker'){
  assert(headrest,'separate driver headrest retains exterior model detail');
  assert.equal(headrest.visible,false,'hide only obstructing headrest in cockpit');
  assert(eye.y>=1.58&&eye.z>=.60,'camera clears headrest');
 }else assert.equal(headrest,undefined,'approved fleet camera geometry unchanged');
 const before=eye.clone();
 seat.querySelector('[data-seat=up]').click();seat.querySelector('[data-seat=back]').click();frame();
 const after=car.root.worldToLocal(app.camera.position.clone());
 assert(after.y>before.y&&after.z>before.z,'seat controls move actual camera');
 seat.querySelector('[data-seat=reset]').click();frame();
 const reset=car.root.worldToLocal(app.camera.position.clone());
 assert(reset.distanceTo(before)<.005);
 document.getElementById('perspectiveButton').click();frame();
 assert(headrest?.visible!==false,'all detail returns in exterior view');
 t.recover(true);
}
console.log('Five first-person views: Santa Fe/New Yorker headrest clearance, unchanged Nova/Impala/Monte Carlo, seat controls, reset and exterior restoration pass.');
