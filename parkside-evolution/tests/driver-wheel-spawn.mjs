import assert from 'node:assert/strict';
import {revealWheelMeshes,wheelRenderInfo} from '../vehicle-wheels.js';
import {bootGame} from './helpers/game.mjs';
const {app}=await bootGame(),t=app.test;t.setState('menu');t.setGoldenMode(false);
for(let i=0;i<14;i++){t.selectVehicle(i);const before=wheelRenderInfo(t.car);assert.equal(before.length,t.spec.bike?2:4);assert(before.every(w=>w.visible&&w.renderable===w.meshes));t.restore();assert.equal(revealWheelMeshes(t.car),t.spec.bike?2:4);assert(wheelRenderInfo(t.car).every(w=>w.visible&&w.attached&&w.renderable===w.meshes));}
console.log('Authored driver wheels remain visible through all fleet selections and restoration.');
