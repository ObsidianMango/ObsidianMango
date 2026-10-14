// One room, one shared debris batch, no extra rigid bodies or per-hit geometry.
export function createInteriorBreakage(T,geometry){
 const LIMIT=64,TARGET_LIMIT=120,material=new T.MeshStandardMaterial({color:0x7c624b,roughness:.94});
 const debris=new T.InstancedMesh(geometry,material,LIMIT),dummy=new T.Object3D(),ray=new T.Raycaster(),zero=new T.Matrix4().makeScale(0,0,0),saved=new WeakMap();
 debris.name='Interior debris';debris.frustumCulled=false;debris.count=0;debris.userData.interiorDebris=true;
 const chips=Array.from({length:LIMIT},()=>({p:new T.Vector3(),v:new T.Vector3(),spin:new T.Vector3(),turn:new T.Vector3(),size:new T.Vector3(),age:0,active:false}));
 let room=null,building=null,targets=[],lookup=new Map(),next=0;
 function clear(){debris.removeFromParent();debris.count=0;for(const c of chips)c.active=false;targets=[];lookup.clear();room=building=null;next=0;}
 function visible(mesh){for(let p=mesh;p;p=p.parent)if(!p.visible)return false;return true;}
 function change(part,broken,damage){
  if(part.index===undefined){part.mesh.visible=!broken;if(!broken)part.mesh.rotation.z=part.rotationZ+damage*.07;}
  else {const matrix=part.matrix.clone();if(broken)matrix.copy(zero);else if(damage){dummy.position.copy(part.p);dummy.quaternion.setFromRotationMatrix(part.matrix.clone().extractRotation(part.matrix));dummy.scale.copy(part.size);dummy.rotation.z+=damage*.07;dummy.updateMatrix();matrix.copy(dummy.matrix);}part.mesh.setMatrixAt(part.index,matrix);part.mesh.instanceMatrix.needsUpdate=true;}
 }
 function build(nextRoom,nextBuilding,colliders){
  clear();room=nextRoom;building=nextBuilding;
  const protectedCounter=c=>c.z<-4&&Math.abs(c.x)<.1||nextBuilding.type==='casino'&&c.x===5.5&&c.z===4.8;
  for(const c of colliders){c.broken=false;if(protectedCounter(c))continue;targets.push({p:new T.Vector3(c.x,c.mesh.position.y,c.z),size:c.mesh.scale.clone(),collider:c,parts:[],damage:0,broken:false});}
  const parts=[];
  room.traverse(mesh=>{
   if(!mesh.isMesh||mesh.material?.map||mesh.userData.casinoMotion&&mesh.userData.casinoMotion!=='reel')return;
   if(mesh.isInstancedMesh){if(mesh.parent!==room)return;for(const [index,p]of (mesh.userData.indoorParts||[]).entries())parts.push({mesh,index,p:p.position,size:p.scale,matrix:p.matrix});}
   else if(mesh.parent===room)parts.push({mesh,p:mesh.position.clone(),size:mesh.scale.clone(),rotationZ:mesh.rotation.z});
  });
  for(const part of parts){
   const {p,size}=part;let target=targets.find(t=>t.collider?.mesh===part.mesh);
   if(!target)target=targets.filter(t=>Math.abs(p.x-t.p.x)<=t.size.x/2+.18&&Math.abs(p.z-t.p.z)<=t.size.z/2+.22&&p.y>=.1&&p.y<t.p.y+t.size.y/2+1.1).sort((a,b)=>p.distanceToSquared(a.p)-p.distanceToSquared(b.p))[0];
   const small=Math.max(size.x,size.y,size.z)<=1.1&&p.y>.12&&p.y<2.8&&Math.abs(p.x)<7.5&&p.z>-6.8;
   const window=Math.abs(p.x)>7.8&&size.x<.1&&size.y>1&&size.z<2;
   if(!target&&(small||window)&&targets.length<TARGET_LIMIT){target={p:p.clone(),size:size.clone(),parts:[],damage:0,broken:false};targets.push(target);}
   if(!target)continue;
   target.parts.push(part);if(!lookup.has(part.mesh))lookup.set(part.mesh,new Map());lookup.get(part.mesh).set(part.index??-1,target);
  }
  targets=targets.filter(t=>t.parts.length);
  const history=saved.get(building)||[];
  targets.forEach((t,i)=>{t.id=i;t.damage=history[i]||0;t.broken=t.damage>=1;if(t.collider)t.collider.broken=t.broken;for(const p of t.parts)change(p,t.broken,t.damage);});
  room.add(debris);room.updateMatrixWorld(true);
 }
 function scatter(target,direction,burned){
  const count=Math.min(8,Math.max(3,target.parts.length));
  for(let i=0;i<count;i++){
   const c=chips[next++%LIMIT],part=target.parts[i%target.parts.length];c.active=true;c.age=0;c.p.copy(part.p);c.p.y=Math.max(.25,c.p.y);c.size.set(Math.min(.45,part.size.x*.45),Math.min(.3,part.size.y*.5),Math.min(.45,part.size.z*.45));c.size.max(new T.Vector3(.045,.045,.045));
   c.v.set(direction.x*2+(i%3-1)*2,2+(i%4)*.7,direction.z*2+(Math.floor(i/3)-1)*1.6);c.spin.set(1+i*.3,.5+i*.17,1.3);c.turn.set(i*.4,0,i*.2);debris.setColorAt((next-1)%LIMIT,new T.Color(burned?0x373936:part.mesh.material.color));
  }
  if(debris.instanceColor)debris.instanceColor.needsUpdate=true;
 }
 function damage(target,power,direction,burned=false){
  if(!target||target.broken)return false;target.damage=Math.min(1,target.damage+power/(target.collider?12:4));target.broken=target.damage>=1;if(target.collider)target.collider.broken=target.broken;
  for(const p of target.parts)change(p,target.broken,target.damage);saved.set(building,targets.map(t=>t.damage));if(target.broken)scatter(target,direction,burned);return true;
 }
 function trace(from,to){
  if(!room)return null;room.updateMatrixWorld(true);const direction=new T.Vector3().subVectors(to,from),length=direction.length();if(length<.0001)return null;ray.set(from,direction.multiplyScalar(1/length));ray.near=0;ray.far=length;
  const hit=ray.intersectObject(room,true).find(h=>h.object!==debris&&visible(h.object));if(!hit)return null;return {point:hit.point,target:lookup.get(hit.object)?.get(hit.instanceId??-1)||null};
 }
 function strike(from,direction,range,power){const to=from.clone().addScaledVector(direction,range),hit=trace(from,to);return hit?damage(hit.target,power,direction):false;}
 function blast(point,power=1){if(!room)return;const p=room.worldToLocal(point.clone());for(const t of targets){const distance=p.distanceTo(t.p);if(distance>4.5)continue;damage(t,Math.max(0,1-distance/4.5)*power*28,t.p.clone().sub(p).normalize(),true);}}
 function update(dt){
  let count=0;for(let i=0;i<LIMIT;i++){const c=chips[i];if(!c.active){debris.setMatrixAt(i,zero);continue;}c.age+=dt;if(c.age>9){c.active=false;debris.setMatrixAt(i,zero);continue;}count=Math.max(count,i+1);if(c.p.y>c.size.y/2+.035||c.v.y>0){c.v.y-=9.82*dt;c.p.addScaledVector(c.v,dt);c.turn.addScaledVector(c.spin,dt);if(c.p.y<c.size.y/2+.035){c.p.y=c.size.y/2+.035;c.v.y*=-.18;c.v.x*=.55;c.v.z*=.55;if(Math.abs(c.v.y)<.3)c.v.y=0;}}c.p.x=Math.max(-7.7,Math.min(7.7,c.p.x));c.p.z=Math.max(-6.7,Math.min(6.7,c.p.z));dummy.position.copy(c.p);dummy.rotation.set(c.turn.x,c.turn.y,c.turn.z);dummy.scale.copy(c.size).multiplyScalar(c.age>8?9-c.age:1);dummy.updateMatrix();debris.setMatrixAt(i,dummy.matrix);}
  debris.count=count;debris.instanceMatrix.needsUpdate=true;
 }
 return{build,clear,strike,trace,blast,update,get targets(){return targets;},getInfo:()=>({targets:targets.length,broken:targets.filter(t=>t.broken).length,debris:chips.filter(c=>c.active).length,debrisLimit:LIMIT,batches:1,physicsBodies:0})};
}
