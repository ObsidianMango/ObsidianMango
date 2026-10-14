import assert from 'node:assert/strict';import {passesGate} from '../gate-crossing.js';
const gate={x:0,z:0,yaw:0},pass=(a,b,x=0,reverse=false,speed=80)=>passesGate(x,a,x,b,{...gate,reverse},8,1.2,0,speed);
assert(pass(3,-3));assert(pass(3,1));assert(!pass(3,-3,3));assert(!pass(3,-3,0,true));assert(pass(-3,3,0,true,-80));assert(!pass(5,3));assert(!passesGate(3,0,-3,0,gate,8,1.2,Math.PI/2,80));
console.log('Swept gates: high-speed crossing, clearance, approach angle, reverse and non-crossing pass.');
