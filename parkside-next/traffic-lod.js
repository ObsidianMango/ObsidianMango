// Full-geometry instancing for distant fleet cars. Keep the original detailed
// wheel/tire/chrome/glass surfaces rather than flattening them into one material.
// Cars within 80 m (and any damaged or moving car) use their complete original meshes.
export function createTrafficLOD(T,view){
 const cars=view.targets.filter(t=>t.kind==='car').map(t=>t.car);
 const wheelOverlays=new Map(),wheelInverse=new T.Matrix4(),wheelMatrix=new T.Matrix4();
 // A wheel clone shares the full original geometry and materials. Never bake the
 // rubber, spokes, rim or whitewall details into the distant body impostor.
 function overlayWheels(item){
  if(wheelOverlays.has(item))return wheelOverlays.get(item);
  const parts=item.mesh.children.filter(part=>part.name?.startsWith('wheel-')&&part.children.length);
  const groups=parts.map(original=>{
   const copy=original.clone(true);copy.name='Original detailed tire · '+original.name;
   copy.visible=false;copy.matrixAutoUpdate=false;copy.frustumCulled=true;
   view.group.add(copy);
   return {original,copy};
  });
  wheelOverlays.set(item,groups);return groups;
 }
 function showTires(item,visible,refresh=false){
  const groups=overlayWheels(item);
  if(visible&&(refresh||groups.some(({copy})=>!copy.visible))){
   view.group.updateWorldMatrix(true,false);wheelInverse.copy(view.group.matrixWorld).invert();
   item.mesh.updateWorldMatrix(true,true);
   for(const {original,copy} of groups){
    wheelMatrix.multiplyMatrices(wheelInverse,original.matrixWorld);
    copy.matrix.copy(wheelMatrix);copy.matrixWorldNeedsUpdate=true;
   }
  }
  for(const {copy} of groups)copy.visible=visible;
 }

 const byModel=new Map(),inverse=new T.Matrix4(),relative=new T.Matrix4(),
  point=new T.Vector3(),normal=new T.Vector3(),normalMatrix=new T.Matrix3();
 const categories={
  rubber:{metalness:0,roughness:.94},
  chrome:{metalness:.80,roughness:.23},
  glass:{metalness:.10,roughness:.17,transparent:true,opacity:.35,depthWrite:false},
  paint:{metalness:.18,roughness:.52},
  matte:{metalness:0,roughness:.85},
  light:{metalness:0,roughness:.35,emissive:0x777777,emissiveIntensity:.3}
 };
 function surfaceKey(material){
  const name=(material.name||'').toLowerCase();
  if(material.transparent||material.opacity<.98)return 'glass';
  if(/rubber|tire|tyre|tread/.test(name))return 'rubber';
  if(/chrome|polish|alloy|rim|wire/.test(name)||material.metalness>=.55&&material.roughness<.55)return 'chrome';
  if(/lamp|light|emissive|glow/.test(name)||material.emissiveIntensity>0.4&&material.emissive?.getHex?.()!==0)return 'light';
  if(material.roughness>.74&&material.metalness<.2)return 'matte';
  return 'paint';
 }
 function mergedSurfaces(item){
  const buffers=new Map();
  item.mesh.updateWorldMatrix(true,true);
  inverse.copy(item.mesh.matrixWorld).invert();
  item.mesh.traverse(mesh=>{
   if(!mesh.isMesh||!mesh.geometry?.attributes?.position)return;
   // Detailed wheels are rendered separately using their actual mesh objects.
   for(let parent=mesh.parent;parent&&parent!==item.mesh;parent=parent.parent)if(parent.name?.startsWith('wheel-'))return;
   const geometry=mesh.geometry,material=Array.isArray(mesh.material)?mesh.material[0]:mesh.material;
   if(!material)return;
   const key=surfaceKey(material);
   let record=buffers.get(key);
   if(!record){record={positions:[],normals:[],colors:[]};buffers.set(key,record);}
   const positionAttr=geometry.attributes.position,normalAttr=geometry.attributes.normal,index=geometry.index;
   const count=index?index.count:positionAttr.count;
   relative.multiplyMatrices(inverse,mesh.matrixWorld);normalMatrix.getNormalMatrix(relative);
   const tint=material.color||{r:1,g:1,b:1},glow=material.emissive;
   const cr=Math.min(1,tint.r+(glow?.r||0)*.12),
    cg=Math.min(1,tint.g+(glow?.g||0)*.12),
    cb=Math.min(1,tint.b+(glow?.b||0)*.12);
   for(let k=0;k<count;k++){
    const vertex=index?index.getX(k):k;
    point.fromBufferAttribute(positionAttr,vertex).applyMatrix4(relative);
    if(normalAttr)normal.fromBufferAttribute(normalAttr,vertex).applyMatrix3(normalMatrix).normalize();
    else normal.set(0,1,0);
    record.positions.push(point.x,point.y,point.z);
    record.normals.push(normal.x,normal.y,normal.z);
    record.colors.push(cr,cg,cb);
   }
  });
  return buffers;
 }
 for(const item of cars){
  const key=item.model||'roadster';
  if(!byModel.has(key))byModel.set(key,{items:[],batches:[],current:[]});
  byModel.get(key).items.push(item);
 }
 for(const [model,group] of byModel){
  const surfaces=mergedSurfaces(group.items[0]);
  for(const [kind,values] of surfaces){
   if(!values.positions.length)continue;
   const geometry=new T.BufferGeometry();
   geometry.setAttribute('position',new T.Float32BufferAttribute(values.positions,3));
   geometry.setAttribute('normal',new T.Float32BufferAttribute(values.normals,3));
   geometry.setAttribute('color',new T.Float32BufferAttribute(values.colors,3));
   geometry.computeBoundingSphere();
   const material=new T.MeshStandardMaterial({...categories[kind],vertexColors:true,side:T.DoubleSide});
   const mesh=new T.InstancedMesh(geometry,material,group.items.length);
   mesh.name='Full-detail fleet '+model+' / '+kind;
   mesh.count=0;mesh.frustumCulled=false;mesh.castShadow=false;mesh.receiveShadow=false;
   mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
   view.group.add(mesh);group.batches.push(mesh);
  }
 }
 let distant=0,drawBatches=0;
 function update(x,z){
  distant=0;drawBatches=0;
  for(const group of byModel.values()){
   const farCars=[];
   for(const item of group.items){
    const dx=item.body.position.x-view.ox-x,dz=item.body.position.z-z;
    const far=dx*dx+dz*dz>80*80&&!item.occupied&&!item.exploded&&
     (item.damage||0)<.02&&item.body.mass===0;
    item.mesh.visible=!far&&!item.occupied;
    if(far)farCars.push(item);
    showTires(item,far);
   }
   distant+=farCars.length;
   if(!farCars.length){for(const mesh of group.batches)mesh.count=0;group.current=[];continue;}
   drawBatches+=group.batches.length;
   const last=group.current;
   if(last.length===farCars.length&&farCars.every((item,i)=>item===last[i])){
    for(const mesh of group.batches)mesh.count=farCars.length;
    continue;
   }
   group.current=farCars;
   for(let i=0;i<farCars.length;i++){
    const item=farCars[i];
    item.mesh.updateWorldMatrix(true,false);
    for(const mesh of group.batches)mesh.setMatrixAt(i,item.mesh.matrixWorld);
   }
   for(const mesh of group.batches){
    mesh.count=farCars.length;
    mesh.instanceMatrix.needsUpdate=true;
   }
  }
 }
 function originals(){
  distant=0;drawBatches=0;
  for(const item of cars){item.mesh.visible=!item.occupied;showTires(item,false);}
  for(const group of byModel.values()){
   group.current=[];
   for(const mesh of group.batches)mesh.count=0;
  }
 }
 update(0,0);
 return {update,originals,getInfo:()=>({
  batches:drawBatches,capacity:cars.length,distant,authoredModels:byModel.size,
  materialSurfaces:[...byModel.values()].reduce((n,g)=>n+g.batches.length,0)
 })};
}
