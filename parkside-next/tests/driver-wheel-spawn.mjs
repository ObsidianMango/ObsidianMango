// Regression: the selected player's four authored tires must be rendered directly.
// Run with Node.js: node tests/driver-wheel-spawn.mjs
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
const base=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const drive=readFileSync(resolve(base,'drive.js'),'utf8');
const reader=readFileSync(resolve(base,'index.html'),'utf8');
const original=drive.indexOf('function revealWheelMeshes(');
assert(original>=0,'Spawn wheel restoration function missing');
const bodyStart=drive.indexOf('{',original);let depth=0,end=bodyStart;
for(;end<drive.length;end++){if(drive[end]==='{')depth++;else if(drive[end]==='}'&&!--depth){end++;break;}}
const reveal=new Function('return '+drive.slice(original,end))();
const wheel=n=>{
 const child={isMesh:true,visible:false,layers:{mask:0,enable(n){this.mask|=1<<n},isEnabled(n){return !!(this.mask&(1<<n));}}};
 return {name:n,visible:false,userData:{attached:true},traverse(fn){fn(this);fn(child);},child};
};
const wheels=['wheel-front-right','wheel-front-left','wheel-rear-right','wheel-rear-left'].map(wheel);
const door=wheel('door-left');
const count=reveal({assemblies:[...wheels,door]});
assert.equal(count,4,'Exactly four wheel groups recognized');
assert(wheels.every(w=>w.visible&&w.child.visible&&w.child.layers.isEnabled(0)),'Real tires must render in layer zero');
assert.equal(door.visible,false,'Do not modify car body parts');
assert(!drive.includes('tireVisibility.render('),'No secondary wheel renderer should hide originals');
assert(!drive.includes('createTireVisibility('),'Old duplicate wheel rendering must be disabled');
assert(drive.includes('revealWheelMeshes(car);for(const w of vehicle.wheelInfos)'),'Recovery must restore tires');
assert(drive.includes('const wheelCount=revealWheelMeshes(car);'),'Every selected car must reveal tires at configuration');
assert(reader.includes('drive.js?v=debris-fps-1'),'Browser must load new code instead of stale script');
console.log('Driver wheel spawn, respawn and layer-zero visibility checks passed.');
