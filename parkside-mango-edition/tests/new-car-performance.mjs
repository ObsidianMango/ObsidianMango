import assert from 'node:assert/strict';
import {bootGame} from './helpers/game.mjs';
import {VEHICLES} from '../garage-models.js';
import {tunedConfig} from '../garage-upgrades.js';
const {app}=await bootGame(),t=app.test;
const expected={montecarlo:[4200,1.08,1.10],suburban:[5900,1.14,1.15],impala:[4600,1.10,1.12],colorado:[4500,1.12,1.12]};
for(const [id,[power,grip,brakes]] of Object.entries(expected)){
 const index=VEHICLES.findIndex(c=>c.id===id),base=VEHICLES[index],upgraded=tunedConfig(base,{engine:3,tires:3,brakes:3});
 assert.equal(upgraded.power,power*1.45);assert.equal(upgraded.gripMultiplier,grip*1.3);assert.equal(upgraded.brakeMultiplier,brakes*1.6);
 t.setState('menu');t.selectVehicle(index);app.start();t.setState('running');t.teleport(0,0);t.input.KeyW=true;t.step(1/60);delete t.input.KeyW;
 assert.equal(t.spec.power,power);assert.equal(t.vehicle.wheelInfos[2].engineForce,power);assert.equal(t.vehicle.wheelInfos[3].engineForce,power);assert.equal(t.vehicle.wheelInfos[0].frictionSlip,3.8*grip);
 t.input.Space=true;t.step(1/60);delete t.input.Space;assert.equal(t.vehicle.wheelInfos[2].brake,70*brakes*base.mass/950);
 t.setState('menu');t.setGoldenMode(true);assert.equal(t.spec.power,power);assert.equal(t.spec.gripMultiplier,grip);assert.equal(t.spec.brakeMultiplier,brakes);t.setGoldenMode(false);
}
assert.equal(tunedConfig(VEHICLES[0]).power,1550);assert.equal(tunedConfig(VEHICLES[0]).gripMultiplier,1);assert.equal(tunedConfig(VEHICLES[0]).brakeMultiplier,1);
console.log('All four new cars apply increased power, grip and braking to actual wheel physics; garage upgrades stack; golden variants inherit boosts; Roadster defaults retained.');
