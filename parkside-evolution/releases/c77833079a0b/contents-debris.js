// Decorative flying contents share one permanent 64-instance pool, without
// adding city-wide colliders, textures, geometries or per-hit materials.
export function createContentsDebris(T,geometry){
 const LIMIT=64,material=new T.MeshStandardMaterial({color:0xffffff,roughness:.93}),mesh=new T.InstancedMesh(geometry,material,LIMIT),object=new T.Object3D(),zero=new T.Matrix4().makeScale(0,0,0),tint=new T.Color();
 const colors={wood:0x95744e,paper:0xd4c8ad,fabric:0x657d6f,metal:0x657679,glass:0x486e79};
 const slots=Array.from({length:LIMIT},()=>({active:false,p:new T.Vector3(),v:new T.Vector3(),size:new T.Vector3(),rotation:new T.Euler(),turn:new T.Vector3(),source:null,age:0}));
 mesh.name='Loose building contents';mesh.frustumCulled=false;mesh.castShadow=false;mesh.receiveShadow=true;mesh.count=0;
 function sync(entry,damage=entry.damage){
  for(const part of entry.contentsParts||[]){if(!part.batch)continue;part.batch.setMatrixAt(part.instance,part.detached&&damage>=.7?zero:part.matrix);part.batch.setColorAt(part.instance,tint.setScalar(Math.max(.12,1-damage*.45-entry.charred*.65)));part.batch.instanceMatrix.needsUpdate=true;part.batch.instanceColor.needsUpdate=true;}
 }
 function scatter(entry){
  if(entry.role!=='contents'||entry.contentsScattered)return;entry.contentsScattered=true;
  const candidates=entry.contentsParts.filter(p=>p.loose),count=Math.min(8,candidates.length);entry.mesh.updateWorldMatrix(true,false);
  for(let i=0;i<count;i++){
   const index=slots.findIndex(s=>!s.active);if(index<0)break;const slot=slots[index],part=candidates[Math.floor(i*candidates.length/count)];
   if(mesh.parent!==entry.mesh.parent)entry.mesh.parent.add(mesh);mesh.visible=true;slot.active=true;slot.source=entry;slot.age=0;slot.grounded=false;
   slot.p.set(part.x/entry.originalSize[0],part.y/entry.originalSize[1],part.z/entry.originalSize[2]);entry.mesh.localToWorld(slot.p);slot.size.set(part.w,part.h,part.d);slot.rotation.setFromQuaternion(entry.mesh.quaternion);
   // Falling contents spread gently; the existing furniture cores remain physical.
   slot.v.set(entry.body.velocity.x+(i%3-1)*2.5,entry.body.velocity.y+.8+(i%2)*.8,entry.body.velocity.z+(Math.floor(i/3)-1)*2.2);slot.turn.set(.6+i*.17,.4+i*.11,.8-i*.06);
   tint.setHex(colors[part.key]);tint.multiplyScalar(Math.max(.15,1-entry.damage*.3-entry.charred*.65));mesh.setColorAt(index,tint);part.detached=true;
  }
  if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;sync(entry);
 }
 function restore(entry){entry.contentsScattered=false;for(const p of entry.contentsParts||[])p.detached=false;sync(entry);}
 function clear(district=null){
  for(let i=0;i<LIMIT;i++){const s=slots[i];if(district!==null&&s.source?.target?.district!==district)continue;s.active=false;s.source=null;mesh.setMatrixAt(i,zero);}
  if(!slots.some(s=>s.active)){mesh.count=0;mesh.removeFromParent();}mesh.instanceMatrix.needsUpdate=true;
 }
 function update(dt,focus){
  let count=0;mesh.visible=true;
  for(let i=0;i<LIMIT;i++){
   const s=slots[i];if(!s.active){mesh.setMatrixAt(i,zero);continue;}s.age+=dt;
   if(s.age>10||s.age>3&&focus&&s.p.distanceTo(focus)>120){s.active=false;s.source=null;mesh.setMatrixAt(i,zero);continue;}
   count=Math.max(count,i+1);
   if(!s.grounded){s.v.y-=9.82*dt;s.p.addScaledVector(s.v,dt);s.rotation.x+=s.turn.x*dt;s.rotation.y+=s.turn.y*dt;s.rotation.z+=s.turn.z*dt;}
   object.rotation.copy(s.rotation);object.scale.copy(s.size);object.updateMatrix();const m=object.matrix.elements,ground=(Math.abs(m[1])+Math.abs(m[5])+Math.abs(m[9]))/2+.035;
   if(s.p.y<ground){s.p.y=ground;s.v.y*=-.15;s.v.x*=.45;s.v.z*=.45;if(Math.abs(s.v.y)<.3){s.v.set(0,0,0);s.grounded=true;}}
   object.position.copy(s.p);object.rotation.copy(s.rotation);object.scale.copy(s.size).multiplyScalar(s.age>9?10-s.age:1);object.updateMatrix();mesh.setMatrixAt(i,object.matrix);
  }
  mesh.count=count;if(!count)mesh.removeFromParent();mesh.instanceMatrix.needsUpdate=true;
 }
 return{scatter,restore,sync,clear,update,hide:()=>mesh.visible=false,getInfo:()=>({looseContents:slots.filter(s=>s.active).length,looseContentsLimit:LIMIT,looseContentsBatches:1,looseContentsBodies:0})};
}
