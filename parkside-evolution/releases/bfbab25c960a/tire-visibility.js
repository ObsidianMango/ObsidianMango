// Guaranteed high-detail tire pass. Reuses the authored tire mesh geometry
// and materials, but avoids the normal car-body culling/material batching path.
// Four wheels per car are mirrored, not redrawn twice. The real wheel assemblies
// remain in the game for wheel physics, damage, and full cinematic replay.
export function createTireVisibility(T,scene){
 let asset=null,entries=[],frames=0,visibleCount=0;
 const localHub=new T.Vector3(),expectedWorld=new T.Vector3(),
  actualWorld=new T.Vector3(),worldQ=new T.Quaternion(),
  worldScale=new T.Vector3(),home=new T.Vector3(),rootWorldQ=new T.Quaternion();
 function showSource(entry,yes){
  if(entry.sourceOn===yes)return;
  entry.sourceOn=yes;
  entry.part.traverse(o=>{if(o.isMesh){
   if(yes)o.layers.enable(0);
   else o.layers.disable(0);
  }});
 }
 function clear(){
  for(const entry of entries){
   showSource(entry,true);
   scene.remove(entry.copy);
  }
  entries=[];asset=null;visibleCount=0;
 }
 function setVehicle(next){
  if(next===asset)return;
  clear();asset=next||null;
  if(!asset?.assemblies)return;
  for(const part of asset.assemblies){
   if(!/^wheel-(front|rear)(-(left|right))?$/.test(part.name))continue;
   if(!part.children.some(c=>c.isMesh||c.children.length))continue;
   const copy=part.clone(true);
   copy.name='Full-detail tire '+part.name;
   // We explicitly manage world transforms; never let automatic matrix updates
   // or an invalid merged wheel bounding sphere hide the wheel again.
   copy.visible=false;
   copy.traverse(o=>{if(o.isMesh){o.frustumCulled=false;o.layers.enable(0);}});
   scene.add(copy);
   entries.push({part,copy,sourceOn:true});
  }
 }
 function render(next,{live=true}={}){
  setVehicle(next);
  visibleCount=0;frames++;
  if(!asset?.root)return;
  const active=live&&asset.root.visible;
  if(active)asset.root.updateWorldMatrix(true,true);
  if(active)asset.root.getWorldQuaternion(rootWorldQ);
  for(const entry of entries){
   const {part,copy}=entry;
   const shown=active&&part.userData.attached!==false&&part.visible!==false;
   showSource(entry,!shown);
   copy.visible=shown;
   if(!shown)continue;
   part.getWorldPosition(actualWorld);
   part.getWorldQuaternion(worldQ);
   part.getWorldScale(worldScale);
   // A physics transform outside the wheel well shouldn't be allowed to send
   // a perfectly valid detailed wheel off-camera. Use its original mount.
   home.copy(part.userData.home||part.position);
   expectedWorld.copy(home);
   asset.root.localToWorld(expectedWorld);
   if(!Number.isFinite(actualWorld.x)||!Number.isFinite(actualWorld.y)||
      !Number.isFinite(actualWorld.z)||actualWorld.distanceToSquared(expectedWorld)>2.25){
    copy.position.copy(expectedWorld);
    copy.quaternion.copy(rootWorldQ);
   }else{
    copy.position.copy(actualWorld);
    copy.quaternion.copy(worldQ);
   }
   copy.scale.copy(worldScale);
   if(copy.scale.lengthSq()<.001)copy.scale.set(1,1,1);
   visibleCount++;
  }
 }
 return {setVehicle,render,clear,getInfo:()=>({
  wheels:entries.length,visible:visibleCount,frames,
  detailed:entries.every(e=>e.copy.children.some(c=>c.isMesh||c.children.length))
 })};
}
