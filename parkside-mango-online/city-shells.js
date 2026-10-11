// Only intact shell meshes use shared draw batches. Original meshes, materials
// and bodies remain available for weapon hits, damage, fracture and replays.
export function createCityShells(T,view){
 const batches=[],records=[],byGeometry=new Map(),matrix=new T.Matrix4();let updates=0;
 const entryMeshes=new Set();
 function register(entry,root){const pieces=[];root.updateWorldMatrix(true,true);root.traverse(mesh=>{if(!mesh.visible||!mesh.isMesh||mesh.isInstancedMesh||Array.isArray(mesh.material))return;let byMaterial=byGeometry.get(mesh.geometry);if(!byMaterial){byMaterial=new Map();byGeometry.set(mesh.geometry,byMaterial);}let batch=byMaterial.get(mesh.material);if(!batch){batch={geometry:mesh.geometry,material:mesh.material,all:[],live:[],mesh:null};byMaterial.set(mesh.material,batch);batches.push(batch);}const part={source:mesh,batch,index:-1,matrix:mesh.matrixWorld.clone(),record:null};batch.all.push(part);pieces.push(part);});const record={entry,pieces,batched:false};pieces.forEach(p=>p.record=record);records.push(record);}
 for(const target of view.targets)for(const entry of target.entries||[]){entryMeshes.add(entry.mesh);register(entry,entry.mesh);}
 for(const mesh of [...view.group.children])if(mesh.isMesh&&!mesh.isInstancedMesh&&!entryMeshes.has(mesh)&&mesh!==view.marker.fill&&mesh!==view.beacon&&['BoxGeometry','CylinderGeometry'].includes(mesh.geometry.type))register(null,mesh);
 for(const batch of batches){const mesh=new T.InstancedMesh(batch.geometry,batch.material,batch.all.length);mesh.name='City shell batch';mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);mesh.count=0;mesh.castShadow=false;mesh.receiveShadow=true;mesh.frustumCulled=true;view.group.add(mesh);batch.mesh=mesh;}
 function add(part){const b=part.batch;part.index=b.live.length;b.live.push(part);matrix.copy(part.matrix);b.mesh.setMatrixAt(part.index,matrix);b.mesh.count=b.live.length;b.dirty=true;part.source.layers.disable(0);}
 function remove(part){const b=part.batch,index=part.index,last=b.live.pop();if(last!==part){b.live[index]=last;last.index=index;b.mesh.setMatrixAt(index,last.matrix);}part.index=-1;b.mesh.count=b.live.length;b.dirty=true;part.source.layers.enable(0);}
 function update(){updates++;for(const r of records){const intact=!r.entry||!r.entry.broken&&(r.entry.damage||0)===0;if(intact===r.batched)continue;r.batched=intact;for(const p of r.pieces)intact?add(p):remove(p);}for(const b of batches)if(b.dirty){b.mesh.instanceMatrix.needsUpdate=true;b.mesh.computeBoundingSphere();b.dirty=false;}}
 function originals(){for(const r of records)if(r.batched){r.batched=false;for(const p of r.pieces)remove(p);}for(const b of batches)if(b.dirty){b.mesh.instanceMatrix.needsUpdate=true;b.dirty=false;}}
 update();return {update,originals,getInfo:()=>({batches:batches.length,intactMeshes:batches.reduce((n,b)=>n+b.live.length,0),capacity:batches.reduce((n,b)=>n+b.all.length,0),updates})};
}
