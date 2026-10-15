import assert from 'node:assert/strict';
import {bootGame} from './helpers/game.mjs';
import {VEHICLES} from '../garage-models.js';
import {SECRET_LEVEL_INDEX} from '../level-catalog.js';
const {app,document,get,frame,setPads}=await bootGame(),t=app.test;
assert(!get('vehicleStep').hidden);assert(get('levelStep').hidden);assert.equal(document.querySelectorAll('#garage img').length,0);assert(get('showroomCanvas'));
const first=app.getState().vehicle;get('nextVehicle').click();assert.notEqual(app.getState().vehicle,first);get('previousVehicle').click();assert.equal(app.getState().vehicle,first);
get('chooseVehicle').click();assert(get('vehicleStep').hidden);assert(!get('levelStep').hidden);get('backToVehicles').click();assert(!get('vehicleStep').hidden);
// Wrap left from the first vehicle to the unlocked reward truck.
t.selectVehicle(0);get('previousVehicle').click();assert.equal(app.getState().vehicle,'monster-gold');assert.match(get('selectedVehicleName').textContent,/Monster/);
get('chooseVehicle').click();t.loadLevel(0);get('start').click();assert.equal(app.getState().state,'running');assert.equal(app.getState().vehicle,'monster-gold');assert.equal(t.vehicle.wheelInfos.length,4);
get('pauseMenu').click();assert(!get('vehicleStep').hidden);get('nextVehicle').click();assert.equal(app.getState().vehicle,VEHICLES[0].id);
const pad={index:0,id:'Xbox',connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({value:0,pressed:false}))};setPads([pad]);frame();pad.buttons[15]={value:1,pressed:true};frame();assert.equal(app.getState().vehicle,VEHICLES[1].id);pad.buttons[15]={value:0,pressed:false};frame();pad.buttons[9]={value:1,pressed:true};frame();assert(!get('levelStep').hidden,'controller Menu advances to levels without starting');assert.equal(app.getState().state,'menu');
const chosen=app.getState().vehicle;t.loadLevel(SECRET_LEVEL_INDEX);assert.equal(app.getState().vehicle,chosen,'confirmed vehicle survives secret-level selection');
console.log('3D garage, carousel, two-step flow, Xbox navigation, monster unlock and normal-lot driving pass.');
