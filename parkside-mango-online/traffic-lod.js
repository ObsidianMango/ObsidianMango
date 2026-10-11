// Far vehicles retain the geometry of the player's authored cars.
// Merge each detailed fleet model into one instanced vertex-colored mesh for performance.
// A damaged/exploded car always falls back to its full destructible model.
export function createTrafficLOD(T,view){
 const cars=view.targets.filter(t=>t.kind==='car').map(t=>t.car);
 const byModel=new Map(),identity=new T.Matrix4(),inverse=new T.Matrix4(),relative=new T.Matrix4(),point=new T.Vector3(),normal=new T.Vector3(),nm=new T.Matrix3();
 const hidden=new T.Matrix4().makeScale(0,0,0);
 function merge(item){
  const positions=[],normals=[],colors=[];
  item.mesh.updateWorldMatrix(true,true);
  inverse.copy(item.mesh.matrixWorld).invert();
  item.mesh.traverse(mesh=>{
   if(!mesh.isMesh||!mesh.geometry?.attributes?.position)return;
   const a=mesh.geometry.attributes.position,n=mesh.geometry.attributes.normal,index=mesh.geometry.index;
   const material=Array.isArray(mesh.material)?mesh.material[0]:mesh.material;
   if(!material)return;
   const tint=material.color||new T.Color(0xffffff),base=material.emissive||new T.Color(0);
   relative.multiplyMatrices(inverse,mesh.matrixWorld);nm.getNormalMatrix(relative);
   const count=index?index.count:a.count;
   for(let k=0;k<count;k++){
    const j=index?index.getX(k):k;
    point.fromBufferAttribute(a,j).applyMatrix4(relative);
    if(n)normal.fromBufferAttribute(n,j).applyMatrix3(nm).normalize();else normal.set(0,1,0);
    positions.push(point.x,point.y,point.z);
    normals.push(normal.x,normal.y,normal.z);
    colors.push(Math.min(1,tint.r+base.r*.25),Math.min(1,tint.g+base.g*.25),Math.min(1,tint.b+base.b*.25));
   }
  });
  const geometry=new T.BufferGeometry();
  geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));
  geometry.setAttribute('normal',new T.Float32BufferAttribute(normals,3));
  geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));
  geometry.computeBoundingSphere();
  return geometry;
 }
 for(const item of cars){
  const key=item.model||'roadster';
  if(!byModel.has(key))byModel.set(key,{items:[],mesh:null});
  byModel.get(key).items.push(item);
 }
 for(const [name,group] of byModel){
  const geometry=merge(group.items[0]);
  const material=new T.MeshStandardMaterial({vertexColors:true,metalness:.18,roughness:.65,side:T.DoubleSide});
  const mesh=new T.InstancedMesh(geometry,material,group.items.length);
  mesh.name='Fleet model LOD: '+name;mesh.count=0;mesh.frustumCulled=false;mesh.castShadow=false;mesh.receiveShadow=false;
  mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
  view.group.add(mesh);group.mesh=mesh;
 }
 let distant=0,drawBatches=0;
 function update(x,z){
  distant=0;drawBatches=0;
  for(const group of byModel.values()){
   const mesh=group.mesh;let count=0;
   for(const item of group.items){
    const distance=Math.hypot(item.body.position.x-view.ox-x,item.body.position.z-z);
    const far=distance>80&&!item.exploded&&(item.damage||0)<.02&&!item.occupied;
    item.mesh.visible=!far&&!item.occupied;
    if(!far)continue;
    item.mesh.updateWorldMatrix(true,false);
    mesh.setMatrixAt(count++,item.mesh.matrixWorld);
    distant++;
   }
   mesh.count=count;
   if(count){mesh.instanceMatrix.needsUpdate=true;drawBatches++;}
  }
 }
 function originals(){
  distant=0;drawBatches=0;
  for(const item of cars)item.mesh.visible=!item.occupied;
  for(const group of byModel.values())group.mesh.count=0;
 }
 update(0,0);
 return {update,originals,getInfo:()=>({batches:drawBatches,capacity:cars.length,distant,authoredModels:byModel.size})};
}
