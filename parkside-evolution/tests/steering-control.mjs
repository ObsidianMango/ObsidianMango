import assert from 'node:assert/strict';
import {createSteeringControl} from '../steering-control.js';
function surface(){
 const listeners=new Map(),attrs=new Map();
 return {style:{},addEventListener:(n,cb)=>listeners.set(n,cb),getBoundingClientRect:()=>({left:0,top:0,width:200,height:200}),
  setAttribute:(n,v)=>attrs.set(n,v),setPointerCapture(){},
  emit(n,e){listeners.get(n)?.(e);},attr:n=>attrs.get(n)};
}
const wheel=surface(),art=surface(),keys={},pad={active:false,steering:0};let running=false,audio=0;
const control=createSteeringControl({wheel,art,keys,getPad:()=>pad,isActive:()=>running,resumeAudio:()=>audio++});
const evt=(pointerId,x,y)=>({pointerId,clientX:x,clientY:y,preventDefault(){}});
wheel.emit('pointerdown',evt(1,100,0));assert.equal(control.pointer,null,'menu input stays blocked');
running=true;wheel.emit('pointerdown',evt(1,100,0));assert.equal(audio,1);
wheel.emit('pointermove',evt(1,200,100));assert(Math.abs(control.angle-90)<.01,'drag angle');
wheel.emit('pointermove',evt(2,0,100));assert(Math.abs(control.angle-90)<.01,'other finger ignored');
wheel.emit('pointermove',evt(1,100,200));assert(Math.abs(control.angle-135)<.01,'steering clamp');
wheel.emit('pointerup',evt(2,0,0));assert.equal(control.pointer,1);
wheel.emit('pointerup',evt(1,0,0));control.update(.2);assert(control.angle<135&&control.angle>0,'spring recenter');
control.reset();assert.equal(control.angle,0);assert.equal(control.pointer,null);
keys.KeyA=true;control.paint();assert.equal(wheel.attr('aria-valuenow'),'95');keys.KeyA=false;
pad.active=true;pad.steering=-.5;control.paint();assert.equal(wheel.attr('aria-valuenow'),'-68');
control.pointer=5;control.angle=-300;assert.equal(control.angle,-135);control.reset();
console.log('Independent touch steering: game-state guard, pointer ownership, clamp, recenter, keyboard and Xbox visual priority pass.');
