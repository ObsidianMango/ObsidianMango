// Reuse the same detailed avatar and vehicle meshes as the local game.
// Model meshes share existing geometry; never dispose geometry belonging to the garage.
import {buildSteveAvatar} from './player-likeness.js?v=mango-3';
import {characterById} from './characters.js?v=duel-2';

export function createRivalVisual({T,scene,makeVehicle,worldX=()=>0}){
 const root=new T.Group();root.name='Detailed network opponent';scene.add(root);
 const person=new T.Group(),carSlot=new T.Group();root.add(person,carSlot);
 const baseGeo=new T.BoxGeometry(1,1,1),baseMat=new T.MeshStandardMaterial({color:0x777777});
 for(const [pos,scale] of [
  [[0,1.08,0],[.56,.65,.28]],[[0,1.57,0],[.3,.32,.3]],
  [[-.16,.4,0],[.2,.67,.22]],[[.16,.4,0],[.2,.67,.22]],
  [[-.4,1.06,0],[.17,.57,.2]],[[.4,1.06,0],[.17,.57,.2]]
 ]){
  const part=new T.Mesh(baseGeo,baseMat);part.position.fromArray(pos);part.scale.fromArray(scale);
  part.castShadow=true;person.add(part);
 }
 const appearance=buildSteveAvatar(T,person,new T.Group());
 const legs=[person.children[2],person.children[3]],arms=[person.children[4],person.children[5]];
 const hp=new T.Group();hp.name='Opponent health';root.add(hp);
 const hpBg=new T.Mesh(new T.BoxGeometry(1.05,.11,.065),new T.MeshBasicMaterial({color:0x142229,depthTest:false}));
 const hpFill=new T.Mesh(new T.BoxGeometry(.99,.08,.07),new T.MeshBasicMaterial({color:0xf07365,depthTest:false}));
 hpFill.position.z=-.042;hp.add(hpBg,hpFill);
 let model=null,modelId='',assemblies=[],wheelNodes=[],wrecked=false,debris=[],retired=[],wreckAge=0,animation=0;
 const last=new T.Vector3();
 const wheelNames=['wheel-front-right','wheel-front-left','wheel-rear-right','wheel-rear-left'];
 function chooseCharacter(id){
  const c=characterById(id);
  appearance.setPalette({black:c.shirt,seam:c.seam,jeans:c.pants,denim:c.denim,hair:c.hair,hairHi:c.hairHi,beard:c.beard,beardHi:c.beardHi,skin:c.skin,cheek:c.cheek});
 }
 function clearDebris(){
  for(const d of debris){scene.remove(d.mesh);retired.push(d.mesh);}
  debris=[];wrecked=false;wreckAge=0;
 }
 function removeModel(){
  clearDebris();
  const geometries=new Set(),materials=new Set();
  for(const object of [model,...retired]){
   object?.traverse(node=>{if(!node.isMesh)return;if(node.geometry)geometries.add(node.geometry);if(Array.isArray(node.material))node.material.forEach(m=>materials.add(m));else if(node.material)materials.add(node.material);});
  }
  if(model)carSlot.remove(model);
  retired.length=0;
  for(const g of geometries)g.dispose?.();
  for(const m of materials)m.dispose?.();
  model=null;assemblies=[];wheelNodes=[];modelId='';
 }
 function ensureVehicle(id,force=false){
  if(model&&id===modelId&&!force)return;
  removeModel();
  const result=makeVehicle(id);
  if(!result?.root)return;
  model=result.root;modelId=id;model.position.set(0,0,0);model.quaternion.identity();model.scale.set(1,1,1);
  model.visible=true;carSlot.add(model);
  assemblies=(result.assemblies||[]).map(part=>model.getObjectByName(part.name)).filter(Boolean);
  wheelNodes=wheelNames.map(name=>model.getObjectByName(name));
  if(!wheelNodes[0]&&!wheelNodes[1])wheelNodes=[model.getObjectByName('wheel-front'),model.getObjectByName('wheel-rear')];
  last.set(0,0,0);
 }
 function reset(){
  removeModel();root.visible=false;person.visible=false;hp.visible=false;
 }
 function explode(event){
  if(wrecked)return;
  const id=event.vehicleId||modelId;
  if(id)ensureVehicle(id);
  if(!model)return;
  const p=event.p;if(Array.isArray(p)&&p.length===3)root.position.set(p[0]+worldX(),p[1],p[2]);
  if(Array.isArray(event.q)&&event.q.length===4)root.quaternion.fromArray(event.q);
  root.updateMatrixWorld(true);
  person.visible=false;hp.visible=false;carSlot.visible=true;root.visible=true;
  wrecked=true;wreckAge=0;
  // Detach representative whole vehicle panels, not crude placeholder cubes.
  let seed=(Number.isSafeInteger(event.id)?event.id:1)>>>0;
  const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const candidates=assemblies.filter(p=>p?.parent&&!/^glass|^windshield|^seat/i.test(p.name));
  const pieces=candidates.length?candidates:model.children.filter(p=>p.isGroup||p.isMesh);
  let count=0;
  for(const part of pieces){
   // Bound animated debris work on older iPhones without reducing car detail before impact.
   if(count>=65)break;
   if(!part.parent)continue;
   const origin=part.getWorldPosition(new T.Vector3()),out=origin.clone().sub(root.position);
   scene.attach(part);
   const n=out.length()>0.1?out.normalize():new T.Vector3(rand()-.5,.3,rand()-.5).normalize();
   const kick=Math.max(3,Math.min(13,Number(event.strength)||8));
   debris.push({mesh:part,v:new T.Vector3(n.x*kick+(rand()-.5)*5,3+rand()*kick*.7,n.z*kick+(rand()-.5)*5),spin:new T.Vector3((rand()-.5)*7,(rand()-.5)*7,(rand()-.5)*7)});
   count++;
  }
  model.visible=false;
 }
 function updateDebris(dt){
  if(!wrecked)return;
  wreckAge+=dt;
  for(const d of debris){
   d.v.y-=9.81*dt;
   d.mesh.position.addScaledVector(d.v,dt);
   d.mesh.rotation.x+=d.spin.x*dt;d.mesh.rotation.y+=d.spin.y*dt;d.mesh.rotation.z+=d.spin.z*dt;
   if(d.mesh.position.y<.05){d.mesh.position.y=.05;d.v.y=Math.abs(d.v.y)*.23;d.v.x*=.9;d.v.z*=.9;d.spin.multiplyScalar(.85);}
  }
  if(wreckAge>16){clearDebris();root.visible=false;}
 }
 function update(p,opponentHealth,dt,canSee){
  if(wrecked){
   if(p?.active&&p?.mode==='vehicle'&&!p.wreck&&wreckAge>.8){ensureVehicle(p.vehicleId||modelId,true);}
   else{updateDebris(dt);return;}
  }
  if(!p||!canSee){root.visible=false;return;}
  if(p.mode==='vehicle')ensureVehicle(p.vehicleId||modelId||'roadster',retired.length>0);
  root.visible=true;root.position.set(p.p[0]+worldX(),p.p[1],p.p[2]);
  if(p.mode==='vehicle'&&Array.isArray(p.q)&&p.q.length===4)root.quaternion.fromArray(p.q);
  else root.quaternion.setFromAxisAngle(new T.Vector3(0,1,0),p.yaw);
  person.visible=p.mode==='foot';carSlot.visible=!person.visible;
  if(!person.visible&&model){
   model.visible=true;
   if(Array.isArray(p.wheels))for(let i=0;i<Math.min(wheelNodes.length,p.wheels.length);i++){
    const wheel=wheelNodes[i],values=p.wheels[i];if(!wheel||!Array.isArray(values)||values.length!==7)continue;
    wheel.position.fromArray(values.slice(0,3));wheel.quaternion.fromArray(values.slice(3,7));
   }
  }
  if(person.visible){
   const moved=root.position.distanceTo(last),walking=Math.min(1,moved/Math.max(.016,dt)/5);
   animation+=Math.min(1,walking)*dt*9;
   legs[0].rotation.x=Math.sin(animation)*.45*walking;legs[1].rotation.x=-legs[0].rotation.x;
   arms[0].rotation.x=-legs[0].rotation.x;arms[1].rotation.x=legs[0].rotation.x;
   last.copy(root.position);
  }
  hp.visible=!!p.active&&opponentHealth?.hp>0;
  hp.position.set(0,person.visible?2.20:Math.max(2.0,(p.size?.[1]||1.2)*2+.4),0);
  hpFill.scale.x=Math.max(.0001,Math.min(1,(opponentHealth?.hp??100)/100));hpFill.position.x=-(1-hpFill.scale.x)*.495;
  // World-space billboard toward local camera is handled by caller.
 }
 function faceHealth(camera){hp.quaternion.copy(root.quaternion).invert().multiply(camera.quaternion);}
 return {root,person,carSlot,chooseCharacter,ensureVehicle,explode,reset,update,updateDebris,faceHealth,get modelId(){return modelId;},get wrecked(){return wrecked;},get partCount(){return assemblies.length;},get debrisCount(){return debris.length;}};
}
