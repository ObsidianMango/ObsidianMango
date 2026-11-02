import * as T from '../vendor/three.module.js';
import R from '../vendor/rapier.mjs';
import {clamp} from './data.js?v=sibling-walk-7';
export function clearHeadroom(sim,p){
 for(const e of sim.entities){if(!e.b||!e.mesh.visible||!e.body.isEnabled())continue;const b=e.b,t=e.body.translation(),q=new T.Quaternion().copy(e.body.rotation()).invert(),local=new T.Vector3(p.x-t.x,p.y+.8-t.y,p.z-t.z).applyQuaternion(q);if(Math.abs(local.x)<b.w/2+.31&&Math.abs(local.z)<b.d/2+.31&&Math.abs(local.y)<b.h/2+.79)return false;}return true;
}
export function walkSpawn(sim,kind='sideline'){
 if(kind==='sideline')return{x:18,y:sim.terrain==='mountain'?0:0,z:18};
 const surfaces=sim.entities.filter(e=>e.b&&e.mesh.visible&&['floor','roof','balcony','stairs'].includes(e.b.tag)&&Math.abs(e.body.rotation().x)+Math.abs(e.body.rotation().z)<.08).map(e=>{const p=e.body.translation();return{x:p.x,y:p.y+e.b.h/2+.06,z:p.z,tag:e.b.tag};}).filter(p=>p.y>2&&clearHeadroom(sim,p));
 surfaces.sort((a,b)=>kind==='roof'?b.y-a.y:((['floor','balcony'].includes(a.tag)?0:1)-(['floor','balcony'].includes(b.tag)?0:1))||a.y-b.y||Math.abs(a.x)-Math.abs(b.x));
 if((kind==='upper'||kind==='roof')&&surfaces.length)return surfaces[0];
 for(const z of[2,0,7,10])for(const x of[0,2,-2,6,-6]){const p={x,y:0,z};if(clearHeadroom(sim,p))return p;}
 return walkSpawn(sim);
}
// Kept outside the entity/replay list: walking never pushes masonry or alters recorded shots.
export class WalkMotor{
 constructor(sim,position){this.sim=sim;this.body=sim.world.createRigidBody(R.RigidBodyDesc.kinematicPositionBased().setTranslation(position.x,position.y+.8,position.z));this.collider=sim.world.createCollider(R.ColliderDesc.capsule(.5,.28).setFriction(0).setSensor(true),this.body);this.controller=sim.world.createCharacterController(.025);this.controller.enableAutostep(.46,.05,false);this.controller.enableSnapToGround(.5);this.controller.setApplyImpulsesToDynamicBodies(false);this.controller.setMaxSlopeClimbAngle(Math.PI*.3);this.vy=0;this.grounded=false;}
 step(dt,x=0,z=0,jump=false){if(jump&&this.grounded)this.vy=5.2;this.vy=Math.max(-22,this.vy-9.81*dt);this.controller.computeColliderMovement(this.collider,{x:x*dt,y:this.vy*dt,z:z*dt},R.QueryFilterFlags.EXCLUDE_SENSORS,undefined,c=>!this.sim.colliders.get(c.handle)?.character);const m=this.controller.computedMovement(),p=this.body.translation();this.body.setNextKinematicTranslation({x:p.x+m.x,y:p.y+m.y,z:p.z+m.z});this.grounded=this.controller.computedGrounded();if(this.grounded&&this.vy<0)this.vy=-.5;}
 get feet(){const p=this.body.translation();return{x:p.x,y:p.y-.8,z:p.z};}
 dispose(){this.sim.world.removeCharacterController(this.controller);this.sim.world.removeRigidBody(this.body);}
}
export class Walker{
 constructor(view,sim,notify){Object.assign(this,{view,sim,notify,active:false,keys:new Set(),stick:{x:0,y:0},padMove:{x:0,y:0},jump:false});
  const canvas=view.renderer.domElement;
  canvas.addEventListener('pointerdown',e=>{if(!this.active||this.blocked?.())return;this.look={id:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);});
  canvas.addEventListener('pointermove',e=>{if(!this.active||this.blocked?.()||this.look?.id!==e.pointerId)return;this.yaw-=(e.clientX-this.look.x)*.004;this.pitch=clamp(this.pitch-(e.clientY-this.look.y)*.004,-1.4,1.4);this.look.x=e.clientX;this.look.y=e.clientY;});
  const release=e=>{if(this.look?.id===e.pointerId)this.look=null;};canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);
  addEventListener('keydown',e=>{if(!this.active||this.blocked?.()||['INPUT','SELECT'].includes(e.target.tagName))return;if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ShiftLeft','ShiftRight','Space'].includes(e.code)){e.preventDefault();e.stopImmediatePropagation();this.keys.add(e.code);if(e.code==='Space'&&!e.repeat)this.jump=true;}});
  addEventListener('keyup',e=>this.keys.delete(e.code));addEventListener('blur',()=>this.resetInput());
  const joystick=document.getElementById('walkStick'),thumb=document.getElementById('walkThumb');
  const update=e=>{const r=joystick.getBoundingClientRect(),x=(e.clientX-r.left-r.width/2)/(r.width*.34),y=(e.clientY-r.top-r.height/2)/(r.height*.34),n=Math.max(1,Math.hypot(x,y));this.stick={x:x/n,y:y/n};thumb.style.transform=`translate(${this.stick.x*28}px,${this.stick.y*28}px)`;};
  joystick.addEventListener('pointerdown',e=>{e.preventDefault();joystick.setPointerCapture(e.pointerId);update(e);});joystick.addEventListener('pointermove',e=>{if(joystick.hasPointerCapture(e.pointerId))update(e);});
  const clear=()=>{this.stick={x:0,y:0};thumb.style.transform='';};joystick.addEventListener('pointerup',clear);joystick.addEventListener('pointercancel',clear);
  joystick.addEventListener('keydown',e=>{if(e.key.startsWith('Arrow')){e.preventDefault();this.keys.add(e.code);}});document.getElementById('walkJump').onclick=()=>this.jump=true;
 }
 resetInput(){this.keys.clear();this.stick={x:0,y:0};this.padMove={x:0,y:0};this.jump=false;this.look=null;}
 enter(kind='sideline'){
  if(this.active)this.motor.dispose();else this.saved={position:this.view.camera.position.clone(),quaternion:this.view.camera.quaternion.clone(),target:this.view.controls.target.clone()};
  const p=walkSpawn(this.sim,kind);this.motor=new WalkMotor(this.sim,p);this.active=true;this.resetInput();this.yaw=Math.atan2(p.x,p.z);this.pitch=p.y>5?-.3:0;this.view.firstPerson=true;this.view.controls.enabled=false;this.view.camera.near=.05;this.view.camera.updateProjectionMatrix();document.getElementById('walkHUD').classList.remove('hidden');this.camera();return p;
 }
 exit(){if(!this.active)return;this.motor.dispose();this.active=false;this.resetInput();this.view.firstPerson=false;this.view.controls.enabled=true;this.view.camera.near=.1;this.view.camera.updateProjectionMatrix();this.view.camera.position.copy(this.saved.position);this.view.camera.quaternion.copy(this.saved.quaternion);this.view.controls.target.copy(this.saved.target);document.getElementById('walkHUD').classList.add('hidden');}
 step(dt){if(!this.active)return;const k=c=>this.keys.has(c)?1:0,forward=k('KeyW')+k('ArrowUp')-k('KeyS')-k('ArrowDown')-this.stick.y-this.padMove.y,side=k('KeyD')+k('ArrowRight')-k('KeyA')-k('ArrowLeft')+this.stick.x+this.padMove.x,n=Math.max(1,Math.hypot(side,forward)),speed=k('ShiftLeft')||k('ShiftRight')?6:3.8;this.motor.step(dt,(side*Math.cos(this.yaw)-forward*Math.sin(this.yaw))/n*speed,(-side*Math.sin(this.yaw)-forward*Math.cos(this.yaw))/n*speed,this.jump);this.jump=false;if(this.motor.feet.y<-15){this.enter('sideline');this.notify('Returned to the sideline');}}
 camera(){if(!this.active)return;const p=this.motor.feet;this.view.camera.position.set(p.x,p.y+1.62,p.z);this.view.camera.quaternion.setFromEuler(new T.Euler(this.pitch,this.yaw,0,'YXZ'));document.getElementById('walkLocation').textContent=`${p.x.toFixed(1)}, ${p.z.toFixed(1)} · HEIGHT ${Math.max(0,p.y).toFixed(1)} m`;}
 pad(p,dt){const dead=x=>Math.abs(x||0)>.15?x:0;this.padMove={x:dead(p.axes[0]),y:dead(p.axes[1])};this.yaw-=dead(p.axes[2])*dt*2;this.pitch=clamp(this.pitch-dead(p.axes[3])*dt*1.5,-1.4,1.4);}
}
