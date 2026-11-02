import * as T from '../vendor/three.module.js';
import {box} from './render.js';
import {createSiegeModel,createProjectileModel,animateSiegeModel} from './weapon-models.js';
import R from '../vendor/rapier.mjs';
import {WEAPONS} from './data.js';
export const ORIGIN=new T.Vector3(0,2.1,24);
export function velocity(weapon,yaw,elevation,power,scale=1){const angle=(weapon.type==='ram'||weapon.type==='tower'?2:elevation)*Math.PI/180,a=yaw*Math.PI/180,s=weapon.speed*(.55+power*.008)*scale;return new T.Vector3(Math.sin(a)*Math.cos(angle)*s,Math.sin(angle)*s,-Math.cos(a)*Math.cos(angle)*s)}
export function trajectory(weapon,yaw,elevation,power,gravity=1,scale=1){const v=velocity(weapon,yaw,elevation,power,scale),origin=ORIGIN.clone();if(weapon.type==='ram'||weapon.type==='tower')origin.y=weapon.type==='ram'?.8:2.5;const points=[];let target=new T.Vector3();for(let i=0;i<100;i++){const t=i*.05;const p=origin.clone().addScaledVector(v,t);p.y-=.5*9.81*gravity*t*t;if(p.y<.1){target.copy(p);target.y=.1;break}points.push(p);target.copy(p)}return{points,target}}
export const projectileVisual=createProjectileModel;
export class Arsenal{
 constructor(view,sim){this.view=view;this.sim=sim;this.index=0;this.animation=0;this.model=null;this.build();sim.onCluster=p=>{const pos=new T.Vector3().copy(p.body.translation()),v=p.body.linvel();for(let i=0;i<6;i++){const w={...WEAPONS[7],radius:.35,mass:4,blast:2.5,damage:130};this.sim.projectile(w,pos.clone().add(new T.Vector3((i%3-1)*.7,Math.floor(i/3)*.6,0)),{x:v.x+(i%3-1)*6,y:v.y+3+Math.floor(i/3)*4,z:v.z-3},projectileVisual(w))}}}
 select(i){this.index=i;this.build()}
 build(){const g=this.view.weapon;g.traverse(o=>{if(o.isMesh){if(o.geometry!==box)o.geometry.dispose();o.material.dispose()}});g.clear();g.position.copy(ORIGIN);g.position.y=0;this.model=createSiegeModel(this.index,{golden:this.golden,weapon:WEAPONS[this.index]});g.add(this.model);this.animation=0;}

 fire(yaw,elevation,power,scale=1){const w=WEAPONS[this.index],pos=ORIGIN.clone();if(w.type==='ram'||w.type==='tower')pos.y=w.type==='ram'?.8:2.5;const results=[];const count=w.type==='triple'?3:w.type==='chain'?2:1;for(let i=0;i<count;i++){const a=yaw+(w.type==='triple'?(i-1)*5:0),v=velocity(w,a,elevation,power,scale),p=pos.clone();if(w.type==='chain')p.x+=(i-.5)*1.5;results.push(this.sim.projectile(w,p,v,projectileVisual(w)))}if(w.type==='chain'){this.sim.world.createImpulseJoint(R.JointData.rope(2.5,{x:0,y:0,z:0},{x:0,y:0,z:0}),results[0].body,results[1].body,true)}this.animation=.85;return results}
 animate(dt,yaw,elevation){this.animation=Math.max(0,this.animation-dt);animateSiegeModel(this.model,dt,yaw,elevation,this.animation);if(['ram','tower'].includes(WEAPONS[this.index].type))this.model.visible=!this.sim.entities.some(e=>e.projectile&&!e.spent&&e.weapon.type===WEAPONS[this.index].type);}
}
