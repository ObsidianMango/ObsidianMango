import assert from 'node:assert/strict';
import {driverEye,createSeatAdjuster} from '../camera-rig.js';
import {VEHICLES} from '../garage-models.js';
import {bootGame} from './helpers/game.mjs';
const storage=new Map(),io={getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v)};
const adjustment=createSeatAdjuster(io);
for(const id of ['nova','impala','montecarlo']){
  const old=driverEye({id},{userData:{steeringX:-.4}});
  assert.equal(old.z,.68,id+' reference cockpit');
  assert.equal(old.y,1.54);
}
for(const id of ['santafe','newyorker']){
  const eye=driverEye({id},{userData:{steeringX:-.41}});
  assert(eye.z<.28,'driver must sit forward of seat back, '+id);
  assert(eye.y>1.4);
}
adjustment.adjust('santafe','z',-.12);
adjustment.adjust('santafe','y',.11);
assert.equal(adjustment.get('santafe').z,-.12);
assert.equal(adjustment.get('newyorker').z,0,'separate car offsets');
assert.equal(createSeatAdjuster(io).get('santafe').y,.11,'seat persists');
for(let i=0;i<50;i++)adjustment.adjust('santafe','z',-.06);
assert.equal(adjustment.get('santafe').z,-.42,'forward movement clamped');
adjustment.reset('santafe');assert.deepEqual(adjustment.get('santafe'),{y:0,z:0});
const {app,T,get,frame,storage:browserStorage}=await bootGame(),t=app.test;
for(const id of ['santafe','newyorker']){
  t.setState('menu');t.selectVehicle(VEHICLES.findIndex(c=>c.id===id));app.start();
  t.togglePerspective();frame();
  assert.equal(app.getState().firstPerson,true);
  assert.equal(get('seatAdjustToggle').hidden,false,'adjust seat visible in cockpit');
  const local=app.camera.position.clone().sub(t.car.root.position).applyQuaternion(t.car.root.quaternion.clone().invert());
  assert(local.z<.28,id+' first person camera clears the seat back');
  const roof=t.car.assemblies.find(p=>p.name==='roof');
  assert(roof?.children.length,'detailed removable roof retained');
  let centerBelow=0;
  for(const mesh of roof.children){
    const arr=mesh.geometry.attributes.position;
    for(let i=0;i<arr.count;i+=3){
      let x=0,y=0;
      for(let k=0;k<3;k++){x+=arr.getX(i+k)+roof.position.x;y+=arr.getY(i+k)+roof.position.y;}
      x/=3;y/=3;
      if(Math.abs(x)<.55&&y<1.78)centerBelow++;
    }
  }
  assert.equal(centerBelow,0,'no opaque roof wedge through cockpit '+id);
  get('seatAdjustToggle').click();assert.equal(get('seatAdjustPanel').hidden,false);
  get('seatAdjustPanel').querySelector('[data-seat-step="up"]').click();
  get('seatAdjustPanel').querySelector('[data-seat-step="forward"]').click();
  frame();
  const higher=app.camera.position.clone().sub(t.car.root.position).applyQuaternion(t.car.root.quaternion.clone().invert());
  assert(higher.y>local.y+.045,'up button raises eye');
  assert(higher.z<local.z-.05,'forward button moves toward wheel');
  assert(JSON.parse(browserStorage.get('parkside-evolution:v1:parkside-seat-offsets-v1'))[id],'stored per-car');
  get('seatAdjustReset').click();frame();
  assert.deepEqual(app.getState().seatOffset,{y:0,z:0},'reset seat');
  t.togglePerspective();assert.equal(get('seatAdjustToggle').hidden,true,'panel hidden outside cockpit');
}
console.log('Driver seat positions, reference cars, user adjustment/persistence, roof geometry and cockpit UI pass.');
