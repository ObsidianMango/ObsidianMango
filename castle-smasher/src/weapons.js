import * as T from '../vendor/three.module.js';
import {box} from './render.js?v=aim-guide-1';
import {createSiegeModel,createProjectileModel,animateSiegeModel,slingAngle,RELEASE_TIME,SHOT_CYCLE} from './weapon-models.js?v=sibling-walk-7';
import R from '../vendor/rapier.mjs';
import {projectileShape} from './physics.js?v=aim-guide-1';
import {WEAPONS} from './data.js?v=sibling-walk-7';
export const ORIGIN=new T.Vector3(0,2.1,24);
export function velocity(weapon,yaw,elevation,power,scale=1){const angle=(weapon.type==='ram'||weapon.type==='tower'?2:elevation)*Math.PI/180,a=yaw*Math.PI/180,s=weapon.speed*(.55+power*.008)*scale;return new T.Vector3(Math.sin(a)*Math.cos(angle)*s,Math.sin(angle)*s,-Math.cos(a)*Math.cos(angle)*s)}
export function trajectory(weapon,yaw,elevation,power,gravity=1,scale=1,releaseOrigin=null,sim=null){
 const rolling=weapon.type==='ram'||weapon.type==='tower';
 const v=velocity(weapon,yaw,elevation,power,scale);
 const origin=releaseOrigin?.clone()||ORIGIN.clone();
 if(!releaseOrigin&&rolling)origin.y=weapon.type==='ram'?.8:2.5;

 const world=sim?.world,shape=projectileShape(weapon);
 const rotation=new T.Quaternion(),travel=new T.Vector3();
 const points=[origin];
 const terrainOnly=collider=>!sim.colliders.has(collider.handle);
 const obstacle=collider=>{
  const entity=sim.colliders.get(collider.handle);
  return !entity?.projectile&&(!rolling||!!entity);
 };
 const terrainRay=rolling&&world?new R.Ray({x:0,y:150,z:0},{x:0,y:-1,z:0}):null;
 const steps=weapon.type==='cluster'?20:100;
 for(let i=1;i<=steps;i++){
  const t=i*.05;
  const dampedTime=-Math.expm1(-.01*t)/.01; // Match the projectile's light linear damping.
  const next=origin.clone().addScaledVector(v,rolling?t:dampedTime);
  next.y=origin.y+v.y*dampedTime-9.81*gravity*(t-dampedTime)/.01;
  if(terrainRay){
   terrainRay.origin.x=next.x;
   terrainRay.origin.z=next.z;
   const floor=world.castRay(terrainRay,200,true,undefined,undefined,undefined,undefined,terrainOnly);
   if(floor)next.y=Math.max(next.y,150-floor.timeOfImpact+shape.halfExtents.y);
  }
  const previous=points.at(-1);
  travel.subVectors(next,previous);
  const hit=world?.castShape(previous,rotation,travel,shape,0,1,true,undefined,undefined,undefined,undefined,obstacle);
  if(hit){
   const entity=sim.colliders.get(hit.collider.handle);
   const building=entity?.b&&!entity.dead&&entity.mat!=='barrel'&&entity.mat!=='treasure'
    &&entity.b.tag!=='cart'&&entity.b.tag!=='statue';
   points.push(previous.clone().addScaledVector(travel,hit.time_of_impact));
   return{points,target:new T.Vector3().copy(hit.witness1),impact:!!building,ground:!entity,
    contactTime:(i-1+hit.time_of_impact)*.05};
  }
  if(next.y<(world?-7:.1)){
   if(!world){next.y=.1;points.push(next);return{points,target:next,impact:false,ground:true};}
   break;
  }
  points.push(next);
 }
 return{points,target:points.at(-1),impact:false,ground:false};
}
export const projectileVisual=createProjectileModel;
export class Arsenal{
 constructor(view,sim){this.view=view;this.sim=sim;this.index=0;this.animation=0;this.model=null;this.platformPosition=new T.Vector3(0,0,24);this.launch=null;this.shotStart=-Infinity;this.build();sim.beforeStep=()=>this.updateLaunch();sim.onReset=()=>{this.launch=null;this.shotStart=-Infinity;};sim.onCluster=p=>{const pos=new T.Vector3().copy(p.body.translation()),v=p.body.linvel();for(let i=0;i<6;i++){const w={...WEAPONS[7],radius:.35,mass:4,blast:2.5,damage:130};this.sim.projectile(w,pos.clone().add(new T.Vector3((i%3-1)*.7,Math.floor(i/3)*.6,0)),{x:v.x+(i%3-1)*6,y:v.y+3+Math.floor(i/3)*4,z:v.z-3},projectileVisual(w))}}}
 select(i){this.index=i;this.build()}
 build(){if(this.launch)for(const e of this.launch.entities)if(e.inSling)this.sim.hideProjectile(e);this.launch=null;this.shotStart=-Infinity;const g=this.view.weapon;g.traverse(o=>{if(o.isMesh){if(o.geometry!==box)o.geometry.dispose();o.material.dispose()}});g.clear();g.position.copy(this.platformPosition);this.model=createSiegeModel(this.index,{golden:this.golden,weapon:WEAPONS[this.index]});g.add(this.model);this.animation=0;}

 setPosition(x,height,z){this.platformPosition.set(x,height,z);this.view.weapon.position.copy(this.platformPosition);}
 spawnPosition(w){return this.platformPosition.clone().add(new T.Vector3(0,w.type==='ram'?.8:w.type==='tower'?2.5:2.1,0));}
 get throwing(){return ['catapult','triple','trebuchet'].includes(this.model.userData.kind)}
 scoopPosition(slot,yaw,elevation,elapsed=RELEASE_TIME){const s=this.model.userData,a=s.loaded[slot]||s.loaded[0];return a.position.clone().applyAxisAngle(new T.Vector3(1,0,0),slingAngle(elapsed,elevation,a.position)).add(s.pivot.position).applyAxisAngle(new T.Vector3(0,1,0),-yaw*Math.PI/180).add(this.view.weapon.position);}
 guide(yaw,elevation,power,gravity=1,scale=1){
  const weapon=WEAPONS[this.index],sim=this.sim.clock>0?this.sim:null;
  const spawn=this.spawnPosition(weapon);
  const path=(bearing,origin)=>trajectory(weapon,bearing,elevation,power,gravity,scale,origin,sim);
  if(sim&&weapon.type==='chain'){
   const left=path(yaw,spawn.clone().add(new T.Vector3(-.75,0,0)));
   const right=path(yaw,spawn.clone().add(new T.Vector3(.75,0,0)));
   if(right.impact&&(!left.impact||right.contactTime<left.contactTime))return right;
   return left;
  }
  const center=path(yaw,this.throwing?this.scoopPosition(weapon.type==='triple'?1:0,yaw,elevation):spawn);
  if(!sim||weapon.type!=='triple'||center.impact)return center;
  const left=path(yaw-5,this.scoopPosition(0,yaw,elevation));
  const right=path(yaw+5,this.scoopPosition(2,yaw,elevation));
  if(right.impact&&(!left.impact||right.contactTime<left.contactTime))return right;
  return left.impact?left:center;
 }
 fire(yaw,elevation,power,scale=1){
  const w=WEAPONS[this.index],results=[],count=w.type==='triple'?3:w.type==='chain'?2:1;
  this.shotStart=this.sim.clock;this.shotAim={yaw,elevation};
  for(let i=0;i<count;i++){
   const a=yaw+(w.type==='triple'?(i-1)*5:0),v=velocity(w,a,elevation,power,scale);
   const p=this.throwing?this.scoopPosition(i,yaw,elevation,0):this.spawnPosition(w);
   if(w.type==='chain')p.x+=(i-.5)*1.5;
   const e=this.sim.projectile(w,p,v,projectileVisual(w));
   if(this.throwing){e.inSling=true;e.active=false;e.body.setBodyType(R.RigidBodyType.KinematicPositionBased,true);e.body.setLinvel({x:0,y:0,z:0},true);e.collider.setSensor(true);e.mesh.scale.copy(this.model.userData.loaded[i].scale);}
   results.push(e);
  }
  if(w.type==='chain')this.sim.world.createImpulseJoint(R.JointData.rope(2.5,{x:0,y:0,z:0},{x:0,y:0,z:0}),results[0].body,results[1].body,true);
  if(this.throwing)this.launch={start:this.sim.clock,yaw,elevation,power,scale,weapon:w,entities:results};else this.onRelease?.(w);
  this.animate(0,yaw,elevation);return results;
 }
 updateLaunch(){
  const launch=this.launch;if(!launch)return;
  const elapsed=this.sim.clock-launch.start,releasing=elapsed+1e-7>=RELEASE_TIME;
  launch.entities.forEach((e,i)=>{
   const p=this.scoopPosition(i,launch.yaw,launch.elevation,Math.min(RELEASE_TIME,elapsed));
   e.mesh.position.copy(p);
   if(!releasing){e.body.setNextKinematicTranslation(p);return;}
   e.body.setTranslation(p,true);e.body.setBodyType(R.RigidBodyType.Dynamic,true);e.collider.setSensor(false);
   const bearing=launch.yaw+(launch.weapon.type==='triple'?(i-1)*5:0);
   e.body.setLinvel(velocity(launch.weapon,bearing,launch.elevation,launch.power,launch.scale),true);
   e.body.setAngvel({x:-2,y:0,z:.3},true);e.inSling=false;e.active=true;e.born=this.sim.clock;
   e.releasePoint=p.clone();e.releaseTime=this.sim.clock;
  });
  if(releasing){this.onRelease?.(launch.weapon);this.launch=null;}
 }
 animate(dt,yaw,elevation,replayTime=null){const elapsed=replayTime??(this.sim.clock-this.shotStart);if(replayTime===null&&elapsed<SHOT_CYCLE&&this.shotAim){yaw=this.shotAim.yaw;elevation=this.shotAim.elevation;}this.animation=Math.max(0,SHOT_CYCLE-elapsed);animateSiegeModel(this.model,dt,yaw,elevation,this.animation);if(['ram','tower'].includes(WEAPONS[this.index].type))this.model.visible=!this.sim.entities.some(e=>e.projectile&&!e.spent&&e.weapon.type===WEAPONS[this.index].type);}
}
