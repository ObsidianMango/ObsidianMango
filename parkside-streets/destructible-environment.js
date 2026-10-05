// Damageable scenery uses the same bodies during driving, wrecks and recorded replays.
export function createDestructibleEnvironment({T,C,world,lots,onExplode}){
 let active=[],pending=new Map(),elapsed=0,explosionCount=0,launchedBarrels=0;const explosions=[],registered=new Set(),q=new T.Quaternion(),v=new T.Vector3(),near=new C.Vec3(),local=new C.Vec3(),ramLocal=new C.Vec3();
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
 function register(entries){for(const e of entries){if(registered.has(e))continue;registered.add(e);
  e.home=e.body.position.clone();e.turn=e.body.quaternion.clone();e.filterGroup=e.body.collisionFilterGroup;e.geometry=e.mesh.geometry;e.color=e.mesh.material.color.clone();e.damage=0;e.broken=false;e.last=-10;e.lastRam=-10;e.dent=[0,0,0,0,0,1];e.visualDamage=-1;
  e.body.addEventListener('collide',event=>{
   const kind=event.body.userData?.kind,target=!!kind&&kind!=='pedestrian',armedTarget=e.explosive&&e.armed&&target&&elapsed-e.armedAt>.08&&e.body.position.distanceTo(e.launchPosition)>1.5;
   if(!active.includes(e)||event.body.mass<=0&&!armedTarget||kind==='pedestrian'||elapsed-e.last<.24&&!armedTarget)return;
   const speed=Math.abs(event.contact.getImpactVelocityAlongNormal());if(speed<1.4)return;
   const relative=event.contact.bi===e.body?event.contact.ri:event.contact.rj;
   const point=e.body.position.vadd(relative),velocity=event.body.velocity.clone();
   if(!pending.has(e)||pending.get(e).speed<speed)pending.set(e,{speed,point,velocity,target:armedTarget});
  });
 }}register(lots.breakables);
 function deform(e,amount,dent=e.dent){
  if(Math.abs(e.visualDamage-amount)<.012)return;e.visualDamage=amount;
  if(amount===0){if(e.mesh.geometry!==e.geometry)e.mesh.geometry.dispose();e.mesh.geometry=e.geometry;if(e.mesh.material!==e.originalMaterial&&e.originalMaterial){e.mesh.material.dispose();e.mesh.material=e.originalMaterial;}return;}
  if(e.mesh.geometry===e.geometry){e.originalMaterial=e.mesh.material;e.mesh.material=e.mesh.material.clone();e.mesh.geometry=e.geometry.type==='BoxGeometry'?new T.BoxGeometry(1,1,1,8,4,8):e.geometry.clone();e.baseVertices=e.mesh.geometry.attributes.position.array.slice();}
  const p=e.mesh.geometry.attributes.position,base=e.baseVertices,scale=e.mesh.scale,depth=Math.min(.65,Math.max(.09,Math.min(scale.x,scale.z)*.32))*amount;
  for(let i=0;i<p.count;i++){const k=i*3,dx=(base[k]-dent[0])*scale.x,dy=(base[k+1]-dent[1])*scale.y,dz=(base[k+2]-dent[2])*scale.z,falloff=Math.exp(-(dx*dx+dy*dy+dz*dz)/4);
   p.setXYZ(i,base[k]+dent[3]*depth*falloff/scale.x,base[k+1]+dent[4]*depth*falloff/scale.y,base[k+2]+dent[5]*depth*falloff/scale.z);
  }p.needsUpdate=true;e.mesh.geometry.computeVertexNormals();e.mesh.material.color.copy(e.color).multiplyScalar(1-amount*.30);
 }
 function release(e,velocity,point){
  if(e.broken)return;e.broken=true;e.age=0;e.body.type=C.Body.DYNAMIC;e.body.mass=e.explosive?55:clamp(e.size[0]*e.size[1]*e.size[2]*90,12,e.level===24?320:650);e.body.linearDamping=.16;e.body.angularDamping=.26;e.body.allowSleep=true;if(e.level===24)e.body.collisionFilterGroup=8;e.body.updateMassProperties();e.body.wakeUp();
  e.body.velocity.set(clamp(velocity.x*.38,-9,9),Math.min(4,1+velocity.length()*.12),clamp(velocity.z*.38,-9,9));e.body.angularVelocity.set((e.home.z-point.z)*.16,.5,(point.x-e.home.x)*.16);e.body.aabbNeedsUpdate=true;
  // Local support failure pulls the facade and roof above it down, not the whole city.
  if(e.structure)for(const neighbor of active){if(neighbor===e||neighbor.broken||neighbor.structure!==e.structure)continue;
   if(neighbor.home.y>e.home.y+1&&Math.hypot(neighbor.home.x-e.home.x,neighbor.home.z-e.home.z)<7){neighbor.damage=Math.max(neighbor.damage,.8);deform(neighbor,neighbor.damage);release(neighbor,velocity.scale(.4),point);}
  }
 }
 function throwPiece(e,velocity,point){
  release(e,velocity,point);e.age=0;e.body.type=C.Body.DYNAMIC;if(!e.body.mass)e.body.mass=clamp(e.size[0]*e.size[1]*e.size[2]*90,12,320);e.body.updateMassProperties();e.body.wakeUp();
  const speed=Math.hypot(velocity.x,velocity.z),dx=e.body.position.x-point.x,dz=e.body.position.z-point.z,d=Math.max(1,Math.hypot(dx,dz));
  e.body.velocity.set(clamp(velocity.x*.85+dx/d*7,-34,34),Math.min(11,4+speed*.18),clamp(velocity.z*.85+dz/d*7,-34,34));e.body.angularVelocity.set(dz/d*4,2,-dx/d*4);
 }
 function detonate(e){if(e.detonated)return;e.detonated=true;e.armed=false;e.damage=1;if(e.fuseMesh)e.fuseMesh.visible=false;deform(e,1);release(e,new C.Vec3(0,4,0),e.body.position);explosions.push(e.body.position.clone());}
 function launchBarrel(e,velocity,point){
  if(e.detonated||e.armed&&elapsed-e.lastRam<.55)return;
  if(!e.armed){e.armed=true;e.armedAt=elapsed;e.launchPosition=e.body.position.clone();launchedBarrels++;}
  release(e,velocity,point);const speed=Math.hypot(velocity.x,velocity.z),scale=Math.min(32,Math.max(13,speed*1.25))/Math.max(.1,speed),vx=velocity.x*scale,vz=velocity.z*scale;
  e.body.linearDamping=.035;e.body.angularDamping=.045;e.body.quaternion.setFromVectors(new C.Vec3(0,1,0),new C.Vec3(-vz,0,vx).unit());e.body.velocity.set(vx,.7,vz);e.body.angularVelocity.set(vz/.475,0,-vx/.475);e.body.aabbNeedsUpdate=true;e.body.wakeUp();e.lastRam=elapsed;if(e.fuseMesh)e.fuseMesh.visible=true;
 }
 function hit(e,speed,point,velocity,source='collision',target=false){
  if(e.explosive){if(source==='blast'||target){detonate(e);return;}if(e.detonated)return;launchBarrel(e,velocity,point);return;}
  e.last=elapsed;const lp=e.mesh.worldToLocal(new T.Vector3(point.x,point.y,point.z)),dir=new T.Vector3(velocity.x,velocity.y,velocity.z).normalize().applyQuaternion(q.copy(e.mesh.quaternion).invert());
  e.dent=[clamp(lp.x,-.5,.5),clamp(lp.y,-.5,.5),clamp(lp.z,-.5,.5),dir.x,dir.y,dir.z];e.damage=clamp(e.damage+speed/(e.structure?15:9),0,1);deform(e,e.damage);
  if(e.damage>=(e.structure ? .72 : .58))release(e,velocity,point);
  if(e.level===24&&(source==='ram'||source==='blast'))throwPiece(e,velocity,point);
 }
 function reset(level){pending.clear();explosions.length=0;explosionCount=0;launchedBarrels=0;elapsed=0;for(const e of active){e.body.type=C.Body.STATIC;e.body.mass=0;e.body.collisionFilterGroup=e.filterGroup;e.body.updateMassProperties();e.body.position.copy(e.home);e.body.quaternion.copy(e.turn);e.body.velocity.setZero();e.body.angularVelocity.setZero();e.body.force.setZero();e.body.torque.setZero();e.body.aabbNeedsUpdate=true;e.body.wakeUp();e.mesh.position.copy(e.home);e.mesh.quaternion.copy(e.turn);e.mesh.visible=true;e.damage=0;e.broken=false;e.detonated=false;e.armed=false;if(e.fuseMesh)e.fuseMesh.visible=false;deform(e,0);e.last=e.lastRam=-10;}active=lots.breakables.filter(e=>e.level===level);}
 function blast(point,strength=1){for(const e of active){const dx=e.body.position.x-point.x,dz=e.body.position.z-point.z,dy=e.body.position.y-point.y,distance=Math.hypot(dx,dz,dy),radius=18;if(distance>radius)continue;const force=(1-distance/radius)*strength;
   if(force<.08)continue;const kick=e.level===24?25:18;hit(e,8+force*15,point,new C.Vec3(dx/(distance||1)*force*kick,force*(e.level===24?7:5),dz/(distance||1)*force*kick),'blast');}
 }
 // Sweep the truck footprint before the solver: walls become flying rubble before
 // they can stop the chassis. Already-fallen rubble can be kicked aside again.
 function ram(chassis,dt){const speed=Math.hypot(chassis.velocity.x,chassis.velocity.z);if(speed<1.2)return;for(const e of active){if(elapsed-e.lastRam<(e.explosive?.55:.24)||e.detonated)continue;
  e.body.pointToLocalFrame(chassis.position,local);const [w,h,d]=e.size;local.set(clamp(local.x,-w/2,w/2),clamp(local.y,-h/2,h/2),clamp(local.z,-d/2,d/2));e.body.pointToWorldFrame(local,near);chassis.pointToLocalFrame(near,ramLocal);
  if(Math.abs(ramLocal.x)>2.3||Math.abs(ramLocal.z)>3.25+speed*dt||ramLocal.y< -1.45||ramLocal.y>1.7)continue;
  if(e.explosive)launchBarrel(e,chassis.velocity,near);else{e.lastRam=elapsed;hit(e,Math.max(16,speed*1.2),near,chassis.velocity,'ram');}
 }}
 function update(dt){elapsed+=dt;for(const [e,h]of pending)hit(e,h.speed,h.point,h.velocity,'collision',h.target);pending.clear();for(const e of active)if(e.armed&&!e.detonated){if(elapsed-e.armedAt>3)detonate(e);else if(e.fuseMesh)e.fuseMesh.material.emissiveIntensity=1.8+Math.sin(elapsed*30);}
  for(let i=0;i<3&&explosions.length;i++){const point=explosions.shift();explosionCount++;blast(point,2);onExplode?.(point,2);}const moving=active.filter(e=>e.broken&&e.body.type===C.Body.DYNAMIC);for(const e of moving){e.age+=dt;e.mesh.position.copy(e.body.position);e.mesh.quaternion.copy(e.body.quaternion);const resting=e.body.sleepState===C.Body.SLEEPING||e.body.velocity.length()<.25&&e.body.angularVelocity.length()<.25;if(!e.armed&&(resting&&(e.age>12||moving.length>72&&e.age>3)||active.length>400&&moving.length>72&&e.age>8)){e.body.type=C.Body.STATIC;e.body.mass=0;e.body.updateMassProperties();e.body.velocity.setZero();e.body.angularVelocity.setZero();}}
 }
 function snapshot(){const a=new Float32Array(active.length*15);active.forEach((e,i)=>a.set([...e.mesh.position.toArray(),...e.mesh.quaternion.toArray(),e.damage,...e.dent,e.broken?1:0],i*15));return a;}
 function apply(a,b,u){if(!a||!b)return;active.forEach((e,i)=>{const n=i*15;if(b.length<=n)return;e.mesh.position.fromArray(a,n).lerp(v.fromArray(b,n),u);e.mesh.quaternion.fromArray(a,n+3).slerp(q.fromArray(b,n+3),u);deform(e,a[n+7]+(b[n+7]-a[n+7])*u,Array.from(u<.5?a.slice(n+8,n+14):b.slice(n+8,n+14)));});}
 return{register,reset,update,blast,ram,snapshot,apply,get entries(){return active;},getInfo:()=>({props:active.length,dented:active.filter(e=>e.damage>0).length,broken:active.filter(e=>e.broken).length,moving:active.filter(e=>e.broken&&e.body.type===C.Body.DYNAMIC&&e.body.sleepState!==C.Body.SLEEPING).length,explosions:explosionCount,queuedExplosions:explosions.length,rollingBarrels:active.filter(e=>e.armed&&!e.detonated).length,launchedBarrels})};
}
