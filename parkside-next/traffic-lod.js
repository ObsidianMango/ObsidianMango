// Batch complete intact fleet geometry, including authored tires and UVs.
// Nearby, occupied, moving or damaged cars always return to their original parts.
export function createTrafficLOD(T,view,nearDistance=80){
 const cars=view.parked||view.targets.filter(t=>t.kind==='car').map(t=>t.car),models=new Map();
 const inverse=new T.Matrix4(),relative=new T.Matrix4(),normalMatrix=new T.Matrix3(),point=new T.Vector3(),normal=new T.Vector3(),groupInverse=new T.Matrix4(),frustum=new T.Frustum(),projection=new T.Matrix4(),sphere=new T.Sphere(),center=new T.Vector3();
 for(const car of cars){const key=car.model||'roadster';if(!models.has(key))models.set(key,{cars:[],batches:[],current:[]});models.get(key).cars.push(car);}
 for(const group of models.values()){
  const exemplar=group.cars[0],surfaces=new Map();exemplar.mesh.updateWorldMatrix(true,true);inverse.copy(exemplar.mesh.matrixWorld).invert();
  exemplar.mesh.traverse(mesh=>{
   if(!mesh.isMesh||!mesh.visible||!mesh.geometry?.attributes.position)return;
   for(let p=mesh.parent;p&&p!==exemplar.mesh;p=p.parent)if(!p.visible)return;
   const g=mesh.geometry,a=g.attributes,index=g.index,total=index?index.count:a.position.count;
   relative.multiplyMatrices(inverse,mesh.matrixWorld);normalMatrix.getNormalMatrix(relative);
   const ranges=Array.isArray(mesh.material)?g.groups:[{start:0,count:total,materialIndex:0}];
   for(const range of ranges){const material=Array.isArray(mesh.material)?mesh.material[range.materialIndex]:mesh.material;if(!material)continue;
    let record=surfaces.get(material);if(!record){record={position:[],normal:[],uv:[],color:[]};surfaces.set(material,record);}
    for(let k=range.start;k<Math.min(total,range.start+range.count);k++){
     const i=index?index.getX(k):k;point.fromBufferAttribute(a.position,i).applyMatrix4(relative);normal.set(0,1,0);if(a.normal)normal.fromBufferAttribute(a.normal,i).applyMatrix3(normalMatrix).normalize();
     record.position.push(point.x,point.y,point.z);record.normal.push(normal.x,normal.y,normal.z);record.uv.push(a.uv?a.uv.getX(i):0,a.uv?a.uv.getY(i):0);record.color.push(a.color?a.color.getX(i):1,a.color?a.color.getY(i):1,a.color?a.color.getZ(i):1);
    }
   }
  });
  for(const [source,record] of surfaces){if(!record.position.length)continue;const geometry=new T.BufferGeometry();for(const [name,data] of Object.entries(record)){if(name==='color'&&!source.vertexColors)continue;geometry.setAttribute(name,new T.Float32BufferAttribute(data,name==='uv'?2:3));}geometry.computeBoundingSphere();
   // Own the intact material so damage to the exemplar cannot tint every instance.
   const metadata=source.userData;let material;try{source.userData={};material=source.clone();}finally{source.userData=metadata;}const batch=new T.InstancedMesh(geometry,material,group.cars.length);batch.name='Full-detail fleet batch';batch.count=0;batch.frustumCulled=true;batch.castShadow=false;batch.receiveShadow=false;batch.instanceMatrix.setUsage(T.DynamicDrawUsage);view.group.add(batch);group.batches.push(batch);
  }
 }
 let distant=0,drawBatches=0;
 function update(x,z,camera=null){distant=drawBatches=0;if(camera){camera.updateMatrixWorld();projection.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);frustum.setFromProjectionMatrix(projection);}view.group.updateWorldMatrix(true,false);groupInverse.copy(view.group.matrixWorld).invert();
  for(const group of models.values()){
   const far=[];for(const car of group.cars){const dx=car.body.position.x-view.ox-x,dz=car.body.position.z-z,eligible=dx*dx+dz*dz>nearDistance*nearDistance&&!car.occupied&&!car.exploded&&(car.damage||0)===0&&car.body.mass===0;car.mesh.visible=!eligible&&!car.occupied;if(eligible){center.set(car.body.position.x,car.body.position.y+1,car.body.position.z);sphere.set(center,5);if(!camera||frustum.intersectsSphere(sphere))far.push(car);}}
   distant+=far.length;drawBatches+=far.length?group.batches.length:0;
   if(far.length===group.current.length&&far.every((car,i)=>car===group.current[i]))continue;group.current=far;
   for(let i=0;i<far.length;i++){far[i].mesh.updateWorldMatrix(true,false);relative.multiplyMatrices(groupInverse,far[i].mesh.matrixWorld);for(const batch of group.batches)batch.setMatrixAt(i,relative);}
   for(const batch of group.batches){batch.count=far.length;batch.instanceMatrix.needsUpdate=true;if(far.length)batch.computeBoundingSphere();}
  }
 }
 function originals(){distant=drawBatches=0;for(const car of cars)car.mesh.visible=!car.occupied;for(const group of models.values()){group.current=[];for(const batch of group.batches)batch.count=0;}}
 update(0,0);return {update,originals,getInfo:()=>({batches:drawBatches,capacity:cars.length,distant,authoredModels:models.size,materialSurfaces:[...models.values()].reduce((n,g)=>n+g.batches.length,0),includesAuthoredTires:true})};
}
