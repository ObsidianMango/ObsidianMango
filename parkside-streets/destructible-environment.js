import {setDamageAppearance} from './damage-appearance.js?v=wreck-16';
// Damageable scenery uses the same bodies during driving, wrecks and recorded replays.
import {createCrushContact} from './crush-contact.js?v=crush-12';
export function createDestructibleEnvironment({T,C,world,lots,onExplode}){
 let active=[],pending=new Map(),elapsed=0,explosionCount=0,launchedBarrels=0;const FRAGMENT_LIMIT=96,AWAKE_LIMIT=144;const structures=new Map(),dirtyStructures=new Set();const explosions=[],fragments=[],fragmentPool=[],fragmentBox=new T.BoxGeometry(1,1,1),rubbleMat=new C.Material({friction:.55,restitution:.04}),registered=new Set(),q=new T.Quaternion(),v=new T.Vector3(),contact=createCrushContact(C);
 const crackedRubble=new T.MeshStandardMaterial({color:0x9b978d,roughness:1}),burnedRubble=new T.MeshStandardMaterial({color:0x34312b,roughness:1});setDamageAppearance(T,crackedRubble,.85,0);setDamageAppearance(T,burnedRubble,1,1);
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
 function register(entries){for(const e of entries){if(registered.has(e))continue;registered.add(e);
  e.body.updateAABB();e.supportWidth=e.body.aabb.upperBound.x-e.body.aabb.lowerBound.x;e.supportDepth=e.body.aabb.upperBound.z-e.body.aabb.lowerBound.z;e.home=e.body.position.clone();e.turn=e.body.quaternion.clone();e.originalPhysicsMaterial=e.body.material;e.originalShape=e.body.shapes[0];e.originalScale=e.mesh.scale.clone();e.originalSize=e.size.slice();e.filterGroup=e.body.collisionFilterGroup;e.geometry=e.mesh.geometry;e.color=e.mesh.material.color.clone();e.damage=0;e.charred=0;e.broken=false;e.childMaterials=[];e.last=-10;e.lastRam=-10;e.dent=[0,0,0,0,0,1];e.visualDamage=-1;
  if(e.structure){if(!structures.has(e.structure))structures.set(e.structure,{entries:[],ordered:[],supports:new Map()});structures.get(e.structure).entries.push(e);}
  e.body.addEventListener('collide',event=>{
   const kind=event.body.userData?.kind,target=!!kind&&kind!=='pedestrian',armedTarget=e.explosive&&e.armed&&target&&elapsed-e.armedAt>.08&&e.body.position.distanceTo(e.launchPosition)>1.5;
   if(!active.includes(e)||event.body.mass<=0&&!armedTarget||kind==='pedestrian'||elapsed-e.last<.24&&!armedTarget)return;
   const speed=Math.abs(event.contact.getImpactVelocityAlongNormal());if(speed<1.4)return;
   const relative=event.contact.bi===e.body?event.contact.ri:event.contact.rj;
   const point=e.body.position.vadd(relative),velocity=event.body.velocity.clone();
   if(!pending.has(e)||pending.get(e).speed<speed)pending.set(e,{speed,point,velocity,target:armedTarget,monster:!!event.body.userData?.monster});
  });
 }for(const group of structures.values()){group.ordered=group.entries.slice().sort((a,b)=>a.home.y-b.home.y);for(const e of group.ordered){const bottom=e.home.y-e.originalSize[1]/2;e.foundation=e.role!=='contents'&&bottom<=.65;e.roof=e.role==='roof'||!e.role&&e.originalSize[1]<1&&Math.max(e.originalSize[0],e.originalSize[2])>6;group.supports.set(e,e.floorOwner?[e.floorOwner]:group.ordered.filter(o=>o.role!=='contents'&&o!==e&&o.home.y<e.home.y-.2&&bottom<=o.home.y+o.originalSize[1]/2+1&&Math.abs(o.home.x-e.home.x)<(o.supportWidth+e.supportWidth)/2+.6&&Math.abs(o.home.z-e.home.z)<(o.supportDepth+e.supportDepth)/2+.6));}}}register(lots.breakables);
 function deform(e,amount,dent=e.dent){
  if(Math.abs(e.visualDamage-amount)<.012&&e.visualChar===e.charred)return;e.visualChar=e.charred;e.mesh.userData.damage=amount;e.mesh.userData.charred=e.charred;e.visualDamage=amount;
  if(amount===0){if(e.mesh.geometry!==e.geometry)e.mesh.geometry.dispose();e.mesh.geometry=e.geometry;if(e.mesh.material!==e.originalMaterial&&e.originalMaterial){e.mesh.material.dispose();e.mesh.material=e.originalMaterial;}for(const child of e.childMaterials){child.mesh.material=child.original;child.material.dispose();}e.childMaterials.length=0;return;}
  if(e.mesh.geometry===e.geometry){e.originalMaterial=e.mesh.material;e.mesh.material=e.mesh.material.clone();e.mesh.geometry=e.geometry.type==='BoxGeometry'?new T.BoxGeometry(1,1,1,e.level===24?3:8,e.level===24?2:4,e.level===24?3:8):e.geometry.clone();e.baseVertices=e.mesh.geometry.attributes.position.array.slice();e.mesh.traverse(child=>{if(child!==e.mesh&&child.isMesh&&!child.isInstancedMesh&&!Array.isArray(child.material)){const original=child.material;child.material=original.clone();e.childMaterials.push({mesh:child,original,material:child.material,color:original.color.clone()});}});}
  const p=e.mesh.geometry.attributes.position,base=e.baseVertices,scale=e.mesh.scale,depth=Math.min(.65,Math.max(.09,Math.min(scale.x,scale.z)*.32))*amount;
  for(let i=0;i<p.count;i++){const k=i*3,dx=(base[k]-dent[0])*scale.x,dy=(base[k+1]-dent[1])*scale.y,dz=(base[k+2]-dent[2])*scale.z,falloff=Math.exp(-(dx*dx+dy*dy+dz*dz)/4);
   p.setXYZ(i,base[k]+dent[3]*depth*falloff/scale.x,base[k+1]+dent[4]*depth*falloff/scale.y,base[k+2]+dent[5]*depth*falloff/scale.z);
  }p.needsUpdate=true;e.mesh.geometry.computeVertexNormals();e.mesh.material.color.copy(e.color).multiplyScalar(1-amount*.45);e.mesh.material.roughness=.95;setDamageAppearance(T,e.mesh.material,amount,e.charred);for(const child of e.childMaterials){child.material.color.copy(child.color).multiplyScalar(1-amount*.35);setDamageAppearance(T,child.material,amount,e.charred);}
 }
 const pieceMass=e=>e.explosive?55:clamp(e.size[0]*e.size[1]*e.size[2]*90,12,650);
 function fracture(e){
  if(e.level!==24||e.explosive||e.shattered||Math.max(...e.size)<=6)return;
  e.shattered=true;const size=e.size.slice(),axes=[0,1,2].filter(i=>size[i]>6).sort((a,b)=>size[b]-size[a]),splits=[1,1,1];splits[axes[0]]=Math.min(4,Math.ceil(size[axes[0]]/2.8));if(axes.length>1)splits[axes[1]]=2;if(size[1]>2.4&&Math.min(size[0],size[2])<1)splits[1]=Math.min(3,Math.ceil(size[1]/1.4));
  const chunk=size.map((n,i)=>n/splits[i]),count=splits[0]*splits[1]*splits[2],mass=e.body.mass/count,origin=e.body.position.clone(),turn=e.body.quaternion.clone();let index=0;
  for(let x=0;x<splits[0];x++)for(let y=0;y<splits[1];y++)for(let z=0;z<splits[2];z++){
   const offset=new C.Vec3((x+.5)*chunk[0]-size[0]/2,(y+.5)*chunk[1]-size[1]/2,(z+.5)*chunk[2]-size[2]/2),position=turn.vmult(offset).vadd(origin);
   if(index++===0){e.size=chunk.slice();e.body.removeShape(e.body.shapes[0]);e.body.addShape(new C.Box(new C.Vec3(...chunk.map(n=>n/2))));e.body.mass=mass;e.body.position.copy(position);e.body.updateMassProperties();e.body.updateBoundingRadius();e.body.aabbNeedsUpdate=true;e.mesh.scale.set(e.originalScale.x/splits[0],e.originalScale.y/splits[1],e.originalScale.z/splits[2]);e.mesh.position.copy(position);continue;}
   let f=fragmentPool.find(f=>!f.active);
   if(!f&&fragmentPool.length<FRAGMENT_LIMIT){const mesh=new T.Mesh(fragmentBox,e.charred>.15?burnedRubble:crackedRubble),body=new C.Body({mass:1,material:rubbleMat,shape:new C.Box(new C.Vec3(1,1,1)),collisionFilterGroup:8,linearDamping:.20,angularDamping:.32,allowSleep:true,sleepSpeedLimit:.3,sleepTimeLimit:1.5});body.userData={kind:'building rubble'};f={mesh,body,size:[1,1,1],active:false};fragmentPool.push(f);}
   // Keep existing near-impact rubble when the pool is full; omit extra chips.
   if(!f)continue;const {mesh,body}=f;mesh.material=e.charred>.15?burnedRubble:crackedRubble;mesh.scale.set(...chunk);mesh.position.copy(position);mesh.quaternion.copy(turn);mesh.visible=true;mesh.castShadow=mesh.receiveShadow=true;e.mesh.parent.add(mesh);
   body.removeShape(body.shapes[0]);body.addShape(new C.Box(new C.Vec3(...chunk.map(n=>n/2))));body.mass=mass;body.position.copy(position);body.quaternion.copy(turn);body.velocity.copy(e.body.velocity);body.angularVelocity.copy(e.body.angularVelocity);body.force.setZero();body.torque.setZero();body.updateMassProperties();body.updateBoundingRadius();body.aabbNeedsUpdate=true;body.wakeUp();world.addBody(body);Object.assign(f,{size:chunk.slice(),source:e,age:0,active:true});fragments.push(f);
  }
 }
 function release(e,velocity,point,physical=false){
  if(e.broken)return;e.broken=true;e.age=0;e.body.type=C.Body.DYNAMIC;e.body.mass=pieceMass(e);e.body.linearDamping=.16;e.body.angularDamping=.26;e.body.allowSleep=true;if(e.level===24){e.body.collisionFilterGroup=8;e.body.material=rubbleMat;}e.body.updateMassProperties();e.body.wakeUp();
  if(physical){e.body.velocity.setZero();e.body.angularVelocity.setZero();}else{e.body.velocity.set(clamp(velocity.x*.38,-9,9),Math.min(4,1+velocity.length()*.12),clamp(velocity.z*.38,-9,9));e.body.angularVelocity.set((e.home.z-point.z)*.16,.5,(point.x-e.home.x)*.16);}e.body.aabbNeedsUpdate=true;
  // Local support failure pulls the facade and roof above it down, not the whole city.
  if(e.structure)dirtyStructures.add(e.structure);
  fracture(e);
 }
 function collapseUnsupported(){for(const id of dirtyStructures){const group=structures.get(id);if(!group)continue;const supported=new Set();for(const e of group.ordered){if(e.broken)continue;const below=group.supports.get(e).filter(o=>supported.has(o)&&!o.broken),valid=e.foundation||below.length>=(e.roof||e.role==='floor'?2:1);if(valid){supported.add(e);continue;}e.damage=Math.max(e.damage,.9);deform(e,e.damage);release(e,new C.Vec3(),e.body.position,true);e.body.sleepTimeLimit=2;e.body.wakeUp();}}dirtyStructures.clear();}
 function throwPiece(e,velocity,point){
  release(e,velocity,point);e.age=0;e.body.type=C.Body.DYNAMIC;if(!e.body.mass)e.body.mass=pieceMass(e);e.body.updateMassProperties();e.body.wakeUp();
  const speed=Math.hypot(velocity.x,velocity.z),dx=e.body.position.x-point.x,dz=e.body.position.z-point.z,d=Math.max(1,Math.hypot(dx,dz));
  e.body.velocity.set(clamp(velocity.x*.85+dx/d*7,-34,34),Math.min(11,4+speed*.18),clamp(velocity.z*.85+dz/d*7,-34,34));e.body.angularVelocity.set(dz/d*4,2,-dx/d*4);
 }
 function detonate(e){if(e.detonated)return;e.detonated=true;e.armed=false;e.damage=1;e.charred=1;if(e.fuseMesh)e.fuseMesh.visible=false;deform(e,1);release(e,new C.Vec3(0,4,0),e.body.position);explosions.push(e.body.position.clone());}
 function launchBarrel(e,velocity,point){
  if(e.detonated||e.armed&&elapsed-e.lastRam<.55)return;
  if(!e.armed){e.armed=true;e.armedAt=elapsed;e.launchPosition=e.body.position.clone();launchedBarrels++;}
  release(e,velocity,point);const speed=Math.hypot(velocity.x,velocity.z),scale=Math.min(32,Math.max(13,speed*1.25))/Math.max(.1,speed),vx=velocity.x*scale,vz=velocity.z*scale;
  e.body.linearDamping=.035;e.body.angularDamping=.045;e.body.quaternion.setFromVectors(new C.Vec3(0,1,0),new C.Vec3(-vz,0,vx).unit());e.body.velocity.set(vx,.7,vz);e.body.angularVelocity.set(vz/.475,0,-vx/.475);e.body.aabbNeedsUpdate=true;e.body.wakeUp();e.lastRam=elapsed;if(e.fuseMesh)e.fuseMesh.visible=true;
 }
 function hit(e,speed,point,velocity,source='collision',target=false){
  if(e.explosive){if(source==='blast'||target){detonate(e);return;}if(e.detonated)return;launchBarrel(e,velocity,point);return;}
  e.last=elapsed;if(source==='blast')e.charred=Math.max(e.charred,Math.min(1,speed/20));const lp=e.mesh.worldToLocal(new T.Vector3(point.x,point.y,point.z)),dir=new T.Vector3(velocity.x,velocity.y,velocity.z).normalize().applyQuaternion(q.copy(e.mesh.quaternion).invert());
  e.dent=[clamp(lp.x,-.5,.5),clamp(lp.y,-.5,.5),clamp(lp.z,-.5,.5),dir.x,dir.y,dir.z];e.damage=clamp(e.damage+speed/(e.structure?15:9),0,1);deform(e,e.damage);
  if(e.damage>=(e.structure ? .72 : .58))release(e,velocity,point,source==='ram');
  if(e.level===24&&source==='blast')throwPiece(e,velocity,point);
 }
 function recycleFragment(f){world.removeBody(f.body);f.mesh.removeFromParent();f.mesh.visible=false;f.active=false;f.source=null;const i=fragments.indexOf(f);if(i>=0)fragments.splice(i,1);}
 function restoreEntry(e){pending.delete(e);e.size=e.originalSize.slice();e.mesh.scale.copy(e.originalScale);if(e.shattered){e.body.removeShape(e.body.shapes[0]);e.body.addShape(e.originalShape);e.body.updateBoundingRadius();e.shattered=false;}e.body.type=C.Body.STATIC;e.body.mass=0;e.body.material=e.originalPhysicsMaterial;e.body.collisionFilterGroup=e.filterGroup;e.body.linearDamping=.16;e.body.angularDamping=.26;e.body.updateMassProperties();e.body.position.copy(e.home);e.body.quaternion.copy(e.turn);e.body.velocity.setZero();e.body.angularVelocity.setZero();e.body.force.setZero();e.body.torque.setZero();e.body.aabbNeedsUpdate=true;e.body.wakeUp();e.mesh.position.copy(e.home);e.mesh.quaternion.copy(e.turn);e.mesh.visible=true;e.damage=0;e.charred=0;e.broken=false;e.detonated=false;e.armed=false;e.age=0;if(e.fuseMesh)e.fuseMesh.visible=false;deform(e,0);e.baseVertices=null;e.last=e.lastRam=-10;}
 function reset(level){pending.clear();explosions.length=0;dirtyStructures.clear();explosionCount=0;launchedBarrels=0;elapsed=0;for(const f of [...fragments])recycleFragment(f);for(const e of active)restoreEntry(e);active=lots.breakables.filter(e=>e.level===level);}
 function resetDistrict(d){for(const [id,g]of structures)if(g.entries[0]?.target?.district===d)dirtyStructures.delete(id);for(const f of [...fragments])if(f.source.target?.district===d)recycleFragment(f);for(const e of active)if(e.target?.district===d)restoreEntry(e);}

 function blast(point,strength=1){for(const e of active){const dx=e.body.position.x-point.x,dz=e.body.position.z-point.z,dy=e.body.position.y-point.y,distance=Math.hypot(dx,dz,dy),radius=18;if(distance>radius)continue;const force=(1-distance/radius)*strength;
   if(force<.08)continue;const kick=e.level===24?25:18;hit(e,8+force*15,point,new C.Vec3(dx/(distance||1)*force*kick,force*(e.level===24?7:5),dz/(distance||1)*force*kick),'blast');}
  for(const f of fragments){const d=f.body.position.vsub(point),length=d.length(),power=Math.max(0,1-length/18)*strength;if(power<.08)continue;f.body.wakeUp();f.body.applyImpulse(new C.Vec3(d.x/Math.max(1,length)*power*f.body.mass*12,power*f.body.mass*4,d.z/Math.max(1,length)*power*f.body.mass*12));}
 }
 // Only actual collider contact can crush a piece. Held throttle continues to
 // stress an intact wall while it resists; released pieces start at rest, so their
 // mass and the solver's impulses give the truck a real slowdown and suspension jolt.
 function ram(chassis,dt,driveForce=0){const speed=Math.hypot(chassis.velocity.x,chassis.velocity.z);if(speed<.15&&driveForce<1)return;for(const e of active){const point=contact(chassis,e.body,e.size);if(!point)continue;
  if(e.explosive){if(!e.broken)release(e,chassis.velocity,point,true);continue;}
  if(e.broken){if(e.body.type!==C.Body.DYNAMIC||!e.body.mass){e.body.type=C.Body.DYNAMIC;e.body.mass=pieceMass(e);e.body.updateMassProperties();}e.body.wakeUp();continue;}
  const pushing=clamp(driveForce/88000,0,1);e.damage=clamp(e.damage+pushing*(e.structure?.95:1.5)*dt,0,1);deform(e,e.damage);
  if(elapsed-e.lastRam>.24&&speed>1.2){e.lastRam=elapsed;hit(e,speed,point,chassis.velocity,'ram');}
  if(e.damage>=(e.structure?.72:.58))release(e,chassis.velocity,point,true);
 }for(const f of fragments)if(contact(chassis,f.body,f.size))f.body.wakeUp();}
 function update(dt,focus=null){elapsed+=dt;for(const [e,h]of pending)hit(e,h.speed,h.point,h.velocity,h.monster?'ram':'collision',h.target);pending.clear();for(const e of active)if(e.armed&&!e.detonated){if(elapsed-e.armedAt>3)detonate(e);else if(e.fuseMesh)e.fuseMesh.material.emissiveIntensity=1.8+Math.sin(elapsed*30);}
  for(let i=0;i<3&&explosions.length;i++){const point=explosions.shift();explosionCount++;blast(point,2);onExplode?.(point,2);}collapseUnsupported();const moving=active.filter(e=>e.broken&&e.body.type===C.Body.DYNAMIC);for(const e of moving){e.age+=dt;e.mesh.position.copy(e.body.position);e.mesh.quaternion.copy(e.body.quaternion);const resting=e.body.sleepState===C.Body.SLEEPING||e.body.velocity.length()<.25&&e.body.angularVelocity.length()<.25;if(!e.armed&&resting&&(e.age>12||moving.length>72&&e.age>3)){if(e.level===24)e.body.sleep();else{e.body.type=C.Body.STATIC;e.body.mass=0;e.body.updateMassProperties();e.body.velocity.setZero();e.body.angularVelocity.setZero();}}}for(const f of [...fragments]){f.age+=dt;if(f.age>18||f.age>3&&focus&&f.body.position.distanceTo(focus)>100){recycleFragment(f);continue;}f.mesh.position.copy(f.body.position);f.mesh.quaternion.copy(f.body.quaternion);}
  if(active[0]?.level===24){const awake=moving.filter(e=>!e.armed&&e.body.sleepState!==C.Body.SLEEPING);awake.sort((a,b)=>b.age-a.age);let excess=Math.max(0,awake.length-AWAKE_LIMIT);for(const e of awake){if(!excess)break;if(e.age>2&&e.body.velocity.length()<.35&&e.body.angularVelocity.length()<.35){e.body.sleep();excess--;}}if(focus)for(const e of moving)if(!e.armed&&e.age>3&&e.body.position.distanceTo(focus)>120&&e.body.velocity.length()<.35&&e.body.angularVelocity.length()<.35)e.body.sleep();}
 }
 function snapshot(){const a=new Float32Array(active.length*16);active.forEach((e,i)=>a.set([...e.mesh.position.toArray(),...e.mesh.quaternion.toArray(),e.damage,...e.dent,e.broken?1:0,e.charred],i*16));return a;}
 function apply(a,b,u){if(!a||!b)return;active.forEach((e,i)=>{const n=i*16;if(b.length<=n)return;e.charred=a[n+15]+(b[n+15]-a[n+15])*u;e.mesh.position.fromArray(a,n).lerp(v.fromArray(b,n),u);e.mesh.quaternion.fromArray(a,n+3).slerp(q.fromArray(b,n+3),u);deform(e,a[n+7]+(b[n+7]-a[n+7])*u,Array.from(u<.5?a.slice(n+8,n+14):b.slice(n+8,n+14)));});}
 function strike(body,point,power){const e=active.find(e=>e.body===body);if(e)hit(e,power,point,new C.Vec3(0,.3,0),'weapon',!!e.explosive);}
 return{strike,register,reset,resetDistrict,update,blast,ram,snapshot,apply,get entries(){return active;},get fragments(){return fragments;},getInfo:()=>({props:active.length,unsupportedRoofs:active.filter(e=>e.roof&&!e.broken&&!(structures.get(e.structure)?.supports.get(e)||[]).some(o=>!o.broken)).length,charred:active.filter(e=>e.charred>.1).length,dented:active.filter(e=>e.damage>0).length,broken:active.filter(e=>e.broken).length,moving:active.filter(e=>e.broken&&e.body.type===C.Body.DYNAMIC&&e.body.sleepState!==C.Body.SLEEPING).length,rubbleFragments:fragments.length,rubblePool:fragmentPool.length,rubbleLimit:FRAGMENT_LIMIT,awakeBudget:AWAKE_LIMIT,explosions:explosionCount,queuedExplosions:explosions.length,rollingBarrels:active.filter(e=>e.armed&&!e.detonated).length,launchedBarrels})};
}

