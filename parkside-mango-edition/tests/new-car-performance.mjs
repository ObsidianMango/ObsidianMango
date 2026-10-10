import assert from 'node:assert/strict';
import {bootGame} from './helpers/game.mjs';
const {app,get}=await bootGame(),t=app.test;
const expected={montecarlo:[8,1.2,3100],suburban:[9,1.8,4400],impala:[10,1.4,3400],colorado:[11,1.5,3300]};
for(const [id,[index,mult,power]] of Object.entries(expected)){
 t.setState('menu');t.selectVehicle(index);
 assert.equal(t.spec.id,id);assert.equal(t.spec.power,power);
 assert.equal(t.spec.scoreMultiplier,mult);
 assert.equal(get('garage').children[index].querySelector('.vehicle-multiplier').textContent,'×'+mult);
 app.start();t.setState('running');
 assert.equal(t.scoring.hit(0).points,100*mult);
 const result=t.scoring.bank({parked:true,stars:0,elapsed:0,par:0,lot:0,vehicle:id});
 assert.equal(result.parkingPoints,1000*mult);assert.equal(result.total,1100*mult);
 t.setState('menu');t.setGoldenMode(true);assert.equal(t.spec.scoreMultiplier,mult);t.setGoldenMode(false);
}
console.log('New car challenge badges, pedestrian points, parking bank, golden multiplier inheritance and original engine tuning pass.');
