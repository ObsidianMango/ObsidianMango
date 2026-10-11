// node tests/fps-quality.mjs
// Check optimization invariants without loading a WebGL context.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';

const base=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=name=>readFileSync(resolve(base,name),'utf8');
const drive=read('drive.js'),parked=read('parked-traffic.js'),env=read('destructible-environment.js');
const crowd=read('pedestrians.js'),web=read('web-shooter.js'),replay=read('crash-replay.js');
function extractFunction(source,name){
 const start=source.indexOf('function '+name+'(');
 assert(start>=0,'Missing '+name);
 const open=source.indexOf('{',start);
 let depth=0,end=open;
 for(;end<source.length;end++){
  if(source[end]==='{')depth++;
  else if(source[end]==='}'&&--depth===0){end++;break;}
 }
 return source.slice(start,end);
}
const vector=(x,y,z)=>({x,y,z,toArray:()=>[x,y,z]});
const quaternion=(x,y,z,w)=>({x,y,z,w,toArray:()=>[x,y,z,w]});
const cars=[
 {mesh:{position:vector(1,2,3),quaternion:quaternion(0,.2,0,.98)},damage:.25,charred:.4,exploded:false,parts:[{position:vector(2,3,4),quaternion:quaternion(.1,.2,.3,.93),scale:vector(1.2,1,1),visible:true},{position:vector(3,6,9),quaternion:quaternion(0,0,0,1),scale:vector(1,1.4,1),visible:false}]},
 {mesh:{position:vector(11,12,13),quaternion:quaternion(.2,0,.4,.89)},damage:.8,charred:1,exploded:true,parts:[{position:vector(4,3,2),quaternion:quaternion(0,0,0,1),scale:vector(.5,1,.9),visible:false}]}
];
const efficientParked=new Function('active',extractFunction(parked,'snapshot')+';return snapshot()')(cars);
const priorParked=[];
for(const car of cars){
 priorParked.push(...car.mesh.position.toArray(),...car.mesh.quaternion.toArray(),car.damage,car.charred,car.exploded?1:0);
 for(const part of car.parts)priorParked.push(...part.position.toArray(),...part.quaternion.toArray(),...part.scale.toArray(),part.visible?1:0);
}
assert.deepEqual(Array.from(efficientParked),Array.from(new Float32Array(priorParked)),'Parked-car replay data must remain identical');
const structures=[
 {mesh:{position:vector(1,2,3),quaternion:quaternion(0,0,0,1)},damage:.25,dent:[0,.2,.4,.6,.8,1],broken:true,charred:.2},
 {mesh:{position:vector(4,5,6),quaternion:quaternion(0,.2,0,.98)},damage:.9,dent:[2,3,4,5,6,7],broken:false,charred:1}
];
const efficientEnv=new Function('active',extractFunction(env,'snapshot')+';return snapshot()')(structures);
const priorEnv=new Float32Array(structures.length*16);
structures.forEach((e,i)=>priorEnv.set([...e.mesh.position.toArray(),...e.mesh.quaternion.toArray(),e.damage,...e.dent,e.broken?1:0,e.charred],i*16));
assert.deepEqual(Array.from(efficientEnv),Array.from(priorEnv),'Structural destruction replay data must remain identical');

assert(!extractFunction(replay,'record').includes('scene.updateMatrixWorld(true)'),'Replay recording should not traverse hidden levels');
assert(!extractFunction(crowd,'afterStep').includes('render();'),'Crowd mesh buffers must update only once per visible frame');
assert(!extractFunction(web,'update').includes('render();'),'Goo mesh buffers must update only once per visible frame');
assert(drive.includes('crowd.render();streetLife.webs.render();'),'Frame loop must render full-detail crowd and goo');
assert(drive.includes('world.step(dt)'),'Full collision simulation must be retained');
assert(drive.includes('Math.max(64,car.assemblies.length)'),'Full borrowed-vehicle debris must be retained');
assert(read('index.html').includes('drive.js?v=fps-1'),'Published game should use fresh optimized bundle');
console.log('FPS performance invariants and bit-identical replay snapshots passed.');
