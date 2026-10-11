import assert from 'node:assert/strict';
import {bootGame} from './helpers/game.mjs';
const {app,T,context}=await bootGame(),t=app.test,C=context.C;
t.loadLevel(24);app.start();const env=t.environment,view=t.secretView,baseline=t.world.bodies.length,initial=env.snapshot();
assert.equal(baseline,1070,'furnished floors must not add permanent city physics bodies');
assert.equal(env.entries.length,879);assert.equal(env.getInfo().looseContentsBodies,0);
const furniture=env.entries.filter(e=>e.role==='contents'),objects=furniture.reduce((n,e)=>n+e.contentsObjects,0);
assert(objects>furniture.length*6);assert(view.detail.getInfo().instances<10000);assert(view.detail.getInfo().batches<=32);
for(const building of view.buildings){const entries=building.target.entries,stories=Math.ceil(building.h/4);assert.equal(entries.filter(e=>e.role==='contents').length,stories*2);for(const e of entries.filter(e=>e.role==='contents')){assert(e.contentsObjects>=3);assert(e.contentsParts.some(p=>p.loose));assert(e.floorOwner&&!e.foundation);}}
function hiddenInstances(){let count=0;const m=new T.Matrix4();for(const mesh of view.group.children){if(!mesh.isInstancedMesh||mesh.name==='Loose building contents')continue;for(let i=0;i<mesh.count;i++){mesh.getMatrixAt(i,m);if(m.elements[0]===0&&m.elements[5]===0&&m.elements[10]===0)count++;}}return count;}
view.detail.update(0,0,0,true);const beforeHidden=hiddenInstances();
const tower=view.buildings.find(b=>b.h===16),walls=tower.target.entries.filter(e=>e.foundation&&e.role!=='floor'),upper=tower.target.entries.filter(e=>e.role==='contents'&&e.floorOwner.floorStory>0);
for(const e of walls)env.strike(e.body,e.home,20);env.update(1/60);env.update(1/60);view.detail.update(0,0,0,true);
assert(upper.every(e=>e.broken&&e.body.type===C.Body.DYNAMIC));assert(upper.some(e=>e.contentsParts.some(p=>p.detached)));assert(env.getInfo().looseContents>0);assert.equal(hiddenInstances()-beforeHidden,env.getInfo().looseContents,'detached visuals must replace, not duplicate, their source detail');
const debris=app.scene.getObjectByName('Loose building contents');assert(debris?.isInstancedMesh);assert(debris.count<=64);assert.equal(t.world.bodies.length,baseline+env.fragments.length,'loose contents add zero bodies');
const matrix=new T.Matrix4();debris.getMatrixAt(0,matrix);const beforeY=matrix.elements[13];env.update(.2);debris.getMatrixAt(0,matrix);assert.notEqual(matrix.elements[13],beforeY,'contents move independently while the floor collapses');
// Snapshot playback restores intact furnishing rather than leaving missing bits.
env.apply(initial,initial,0);view.detail.update(0,0,0,true);assert.equal(hiddenInstances(),beforeHidden);assert(!debris.visible);env.reset(24);view.detail.update(0,0,0,true);assert.equal(t.world.bodies.length,baseline);assert.equal(env.getInfo().looseContents,0);assert(furniture.every(e=>!e.contentsScattered&&e.contentsParts.every(p=>!p.detached)));
for(let round=0;round<12;round++){
 for(const building of view.buildings)for(const e of building.target.entries.filter(e=>e.role==='contents'))env.strike(e.body,e.home,20);
 env.update(1/60);assert.equal(env.getInfo().looseContents,64);assert(env.getInfo().rubblePool<=96);assert.equal(t.world.bodies.length,baseline+env.fragments.length);assert.equal(view.group.children.filter(m=>m.name==='Loose building contents').length,1);
 env.update(11);assert.equal(env.getInfo().looseContents,0);env.reset(24);assert.equal(t.world.bodies.length,baseline);assert(!app.scene.getObjectByName('Loose building contents'));
}
// Normal lots use at most five shared batches per furniture core and restore
// the exact matrices when their detached details are rebuilt.
let cores=0;for(let level=0;level<24;level++){t.loadLevel(level);for(const e of t.lots.breakables.filter(e=>e.level===level&&e.role==='contents')){cores++;assert(e.mesh.children.every(m=>m.isInstancedMesh));assert(e.mesh.children.length<=5);const part=e.contentsParts.find(p=>p.loose);assert(part);env.strike(e.body,e.home,20);env.update(1/60);assert(e.contentsScattered);const detached=e.contentsParts.find(p=>p.detached);assert(detached);detached.batch.getMatrixAt(detached.instance,matrix);assert.equal(matrix.elements[0],0);env.reset(level);detached.batch.getMatrixAt(detached.instance,matrix);assert(matrix.elements.every((value,i)=>Math.abs(value-detached.matrix.elements[i])<2e-6));assert.equal(env.getInfo().looseContents,0);}}
console.log(JSON.stringify({objects,originalFurnitureCores:furniture.length,cityInstances:view.detail.getInfo().instances,cityBatches:view.detail.getInfo().batches,permanentBodies:baseline,looseLimit:64,loosePhysicsBodies:0,normalCoresChecked:cores,rebuilds:12},null,2));
