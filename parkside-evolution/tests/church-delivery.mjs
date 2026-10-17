import assert from 'node:assert/strict';
import {bootGame} from './helpers/game.mjs';
import {LOTS} from '../level-catalog.js';
const {app,T}=await bootGame(),t=app.test,index=LOTS.findIndex(l=>l.style==='churchStreet');assert.equal(index,26);
t.setState('menu');t.selectVehicle(12);assert.equal(t.spec.id,'semi');assert.equal(t.car.root.userData.tires,18);t.loadLevel(index);app.start();
assert(t.semiTrailer.getInfo().active);const view=t.lots.views[index],grid=view.group.userData.powerGrid;assert(grid.getInfo().powered);assert(view.group.userData.churchStreet.driveways===4);
for(let i=0;i<240;i++)t.step(1/60);
let p=t.chassis.position,b=t.semiTrailer.body;console.log('rest',p,b.position,app.getState().health);
assert(Number.isFinite(b.position.x)&&b.position.y>1&&b.position.y<4);assert(Math.hypot(p.x-b.position.x,p.z-b.position.z)>6);assert(app.getState().health>90);
const start=p.clone();t.input.KeyW=true;for(let i=0;i<180;i++)t.step(1/60);delete t.input.KeyW;assert(p.distanceTo(start)>3,'truck can pull trailer');console.log('drive',p.x-start.x,p.z-start.z,app.getState().health);
// Joint remains connected during a turn, and trailer is visibly in its body pose.
t.input.KeyW=true;t.input.KeyA=true;for(let i=0;i<90;i++)t.step(1/60);delete t.input.KeyW;delete t.input.KeyA;assert(b.position.distanceTo(p)<12,'hitch stays connected');
t.semiTrailer.sync();const trailer=t.car.assemblies.find(p=>p.name==='trailer');t.car.root.updateMatrixWorld(true);const wp=trailer.getWorldPosition(new T.Vector3());assert(wp.distanceTo(new T.Vector3().copy(b.position))<.02);
// Delivery requires both tractor and trailer wholly inside the long stopping bay.
t.teleport(-40,-76,0);assert(t.semiTrailer.fits(LOTS[index].target,view.ox,t.assessParking));b.position.x+=10;assert(!t.semiTrailer.fits(LOTS[index].target,view.ox,t.assessParking));
const pole=grid.poles[3].entry;t.environment.strike(pole.body,pole.body.position,50);for(let i=0;i<6;i++)t.environment.update(1/60);grid.update(1/60);assert(pole.broken);assert(!grid.getInfo().powered);assert(grid.getInfo().down>=1);
t.recover(true);grid.update(0);assert(grid.getInfo().powered);assert(t.semiTrailer.getInfo().active);
const hitPole=grid.poles.find(p=>p.x===-28&&p.side===1);t.teleport(hitPole.x-14,hitPole.z,-Math.PI/2);t.input.KeyW=true;for(let i=0;i<240;i++)t.step(1/60);delete t.input.KeyW;grid.update(0);console.log('pole impact',hitPole.entry.damage,hitPole.entry.broken,t.chassis.position,app.getState().health);assert(hitPole.entry.broken,'physical truck impact topples a utility pole');assert(!grid.getInfo().powered);t.recover(true);grid.update(0);
const bodies=t.world.bodies.length;for(let i=0;i<3;i++){t.setState('menu');t.selectVehicle(0);assert(!t.semiTrailer.body);t.selectVehicle(12);t.recover(true);}assert.equal(t.world.bodies.length,bodies,'switching vehicles does not leak trailer bodies');
console.log('Church Street lots, 18 tires, hinged trailer physics, pulling, delivery containment, pole blackout/reset and lifecycle passed.');
