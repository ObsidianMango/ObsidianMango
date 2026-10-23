import * as THREE from './vendor/three.module.js';
import * as CANNON from './vendor/cannon-es.js';
import {height,pathX,material,mesh,clamp,lerp,angleLerp,rng} from './utils.js';

const PEOPLE=[
 {name:'Nora',coat:'#c6ad76',pants:'#4d5860',skin:'#d8a17b',hair:'#513d2e',hat:false},
 {name:'Theo',coat:'#b4633d',pants:'#455965',skin:'#bd8965',hair:'#302e29',hat:true},
 {name:'Gus',coat:'#728263',pants:'#a09373',skin:'#d4ac88',hair:'#c6c5b7',hat:true}
];

function person(spec,factory){
 const root=new THREE.Group();root.name=spec.name+' the woodland visitor';
 const sphere=new THREE.SphereGeometry(1,14,10),cylinder=new THREE.CylinderGeometry(1,1,1,10),skin=material(spec.skin),coat=material(spec.coat),pants=material(spec.pants),hair=material(spec.hair),shoe=material('#3e3c31'),dark=material('#252d23'),cream=material('#e4dcc1');
 const hips=new THREE.Group();hips.position.y=1.90;root.add(hips);mesh(sphere,pants,hips,[0,0,0],[.43,.28,.27]);
 const spine=new THREE.Group();spine.position.y=.04;hips.add(spine);mesh(sphere,coat,spine,[0,.61,0],[.53,.73,.31]);mesh(new THREE.BoxGeometry(.035,.96,.02),cream,spine,[0,.62,.31]);
 for(const x of[-.22,.22])mesh(new THREE.BoxGeometry(.19,.23,.025),material(spec.coat).clone(),spine,[x,.32,.29]);
 const head=new THREE.Group();head.position.set(0,1.82,.015);spine.add(head);mesh(cylinder,skin,head,[0,-.43,0],[.15,.25,.15]);mesh(sphere,skin,head,[0,0,0],[.37,.46,.34]);
 mesh(new THREE.SphereGeometry(1,14,8,0,Math.PI*2,0,Math.PI*.58),hair,head,[0,.095,-.045],[.39,.42,.35]);
 for(const side of[-1,1]){mesh(sphere,skin,head,[side*.365,-.015,-.015],[.08,.12,.07]);mesh(sphere,dark,head,[side*.132,.055,.307],[.031,.039,.021]);mesh(sphere,cream,head,[side*.14,.068,.326],[.009,.010,.006]);const brow=mesh(new THREE.BoxGeometry(.10,.020,.018),hair,head,[side*.135,.17,.31]);brow.rotation.z=side*.08;}
 mesh(sphere,skin,head,[0,-.04,.346],[.074,.10,.093]);
 const smile=new THREE.CatmullRomCurve3([new THREE.Vector3(-.10,-.18,.301),new THREE.Vector3(0,-.205,.325),new THREE.Vector3(.10,-.18,.301)]);mesh(new THREE.TubeGeometry(smile,10,.009,4,false),material('#765745'),head);
 if(spec.name==='Nora'){mesh(sphere,hair,head,[0,.05,-.30],[.34,.38,.15]);mesh(sphere,hair,head,[.26,-.29,-.26],[.16,.17,.16]);}
 if(spec.hat){const hatMat=material(spec.name==='Gus'?'#a79a70':'#486c59');mesh(new THREE.CylinderGeometry(.39,.43,.18,20),hatMat,head,[0,.43,-.015]);mesh(new THREE.CylinderGeometry(.54,.54,.035,24),hatMat,head,[0,.345,.05],spec.name==='Gus'?[1,1,1]:[.85,1,1.15]);}
 const arms=[],legs=[];
 for(const side of[-1,1]){
  const arm=new THREE.Group();arm.position.set(side*.50,1.12,0);spine.add(arm);mesh(cylinder,coat,arm,[0,-.36,0],[.155,.74,.155]);mesh(sphere,coat,arm,[0,0,0],[.18,.20,.18]);
  const elbow=new THREE.Group();elbow.position.y=-.74;arm.add(elbow);mesh(cylinder,skin,elbow,[0,-.29,0],[.115,.60,.115]);mesh(sphere,skin,elbow,[0,0,0],[.125,.13,.125]);
  const hand=new THREE.Group();hand.position.set(0,-.66,.03);elbow.add(hand);mesh(sphere,skin,hand,[0,0,0],[.13,.17,.075]);for(let f=0;f<4;f++)mesh(sphere,skin,hand,[(f-1.5)*.045,-.13,.015],[.023,.085,.029]);mesh(sphere,skin,hand,[side*.13,-.02,.015],[.045,.08,.045]);arms.push({pivot:arm,elbow,hand});
  const leg=new THREE.Group();leg.position.x=side*.24;hips.add(leg);mesh(cylinder,pants,leg,[0,-.42,0],[.19,.86,.19]);
  const knee=new THREE.Group();knee.position.y=-.86;leg.add(knee);mesh(cylinder,pants,knee,[0,-.38,0],[.145,.78,.145]);const foot=new THREE.Group();foot.position.set(0,-.79,.13);knee.add(foot);const boot=mesh(sphere,shoe,foot,[0,0,0],[.19,.16,.35]);mesh(new THREE.BoxGeometry(.36,.06,.60),dark,foot,[0,-.09,0]);legs.push({pivot:leg,knee,boot,foot});
 }
 const bag=mesh(new THREE.BoxGeometry(.46,.60,.25),material('#8c6847'),spine,[-.62,.35,-.02]);bag.rotation.z=-.18;
 const strap=mesh(new THREE.BoxGeometry(.055,1.25,.035),material('#654c36'),spine,[-.44,.67,.23]);strap.rotation.z=-.22;
 const backpack=mesh(sphere,material('#64725b'),spine,[0,.69,-.38],[.39,.53,.19]);
 const offered=factory(0);offered.scale.setScalar(.72);offered.position.set(0,-.04,.13);arms[1].hand.add(offered);offered.visible=false;
 let phase=0,kneel=0;
 function animate(dt,t,state,speed){
  const blend=1-Math.exp(-dt*9),feeding=state==='offer',scared=state==='flinch'||state==='flee',run=state==='flee',walk=Math.min(speed/1.2,1);
  kneel=lerp(kneel,feeding?1:0,blend);phase+=dt*speed*(run?3.8:3.4);hips.position.y=1.90-kneel*.78+Math.abs(Math.sin(phase))*walk*(run?.11:.045);spine.rotation.x=lerp(spine.rotation.x,kneel*.17+(run?.26:0),blend);spine.rotation.z=state==='flinch'?Math.sin(t*22)*.12:0;
  for(let i=0;i<2;i++){
   const s=i?1:-1,swing=Math.sin(phase+i*Math.PI),a=arms[i],leg=legs[i];leg.pivot.rotation.x=lerp(leg.pivot.rotation.x,kneel*-.98+swing*walk*(run?.76:.44)*(1-kneel),blend);leg.knee.rotation.x=lerp(leg.knee.rotation.x,kneel*1.83+Math.max(0,-swing)*walk*.55*(1-kneel),blend);leg.foot.rotation.x=-(leg.pivot.rotation.x+leg.knee.rotation.x);
   a.pivot.rotation.x=lerp(a.pivot.rotation.x,scared?(run?-.4+Math.sin(phase+i*Math.PI)*1.0:-2.05):feeding?(i?-.95:-.1):-swing*walk*.4,blend);a.pivot.rotation.z=lerp(a.pivot.rotation.z,scared?s*.35:s*.06,blend);a.elbow.rotation.x=lerp(a.elbow.rotation.x,feeding&&i?-.50:scared?-.85:-.12,blend);
  }
  head.rotation.x=feeding?.16:scared?-.13:Math.sin(t*1.6)*.025;offered.visible=feeding;
 }
 return{root,hips,head,arms,offered,animate,get kneel(){return kneel}};
}

export class GroveVisitors{
 constructor(scene,physics,woodland){
  this.physics=physics;this.wood=woodland;this.clock=0;this.random=rng(672);this.events=[];this.stats={fed:0,bitten:0};this.biteCooldown=0;
  this.visitors=PEOPLE.map((spec,i)=>{
   const model=person(spec,physics.factory);scene.add(model.root);model.root.visible=false;
   const body=new CANNON.Body({type:CANNON.Body.KINEMATIC,mass:0});for(const [r,y]of[[.34,.38],[.34,1.35],[.40,2.60],[.34,3.80]])body.addShape(new CANNON.Sphere(r),new CANNON.Vec3(0,y,0));
   return{...model,model,index:i,name:spec.name,body,bodyAdded:false,state:'waiting',timer:1+i*14,age:0,invulnerable:0,speed:0,message:'',messageTime:0,position:model.root.position,target:new THREE.Vector3(),yaw:0};
  });
 }
 _activate(v){const z=v.index===2?-24:22+v.index*2;v.position.set(pathX(z)+(v.index-1)*1.8,height(pathX(z),z),z);v.root.visible=true;v.age=0;this._state(v,'approach');if(!v.bodyAdded){this.physics.world.addBody(v.body);v.bodyAdded=true}}
 _hide(v){v.root.visible=false;v.message='';v.offered.visible=false;v.state='waiting';v.timer=25+v.index*8;v.speed=0;if(v.bodyAdded){this.physics.world.removeBody(v.body);v.bodyAdded=false}}
 _say(v,text,seconds=4){v.message=text;v.messageTime=seconds}
 _state(v,state){v.state=state;v.timer=0;if(state==='offer')this._say(v,['A little snack for you?','Hey, fluffy. Want an acorn?','Brought you the good stuff.'][v.index],6);if(state==='leave'){const a=Math.atan2(v.position.x,v.position.z);v.target.set(Math.sin(a)*31,0,Math.cos(a)*31)}}
 _circle(c){if(c.type==='log')return null;return{x:c.x,z:c.z,r:c.radius+.44}}
 _move(v,target,speed,dt){
  const dx=target.x-v.position.x,dz=target.z-v.position.z,d=Math.hypot(dx,dz);if(d<.12){v.speed=0;return d}
  let sx=dx/d,sz=dz/d;const fx=v.position.x+sx*1.1,fz=v.position.z+sz*1.1;
  for(const c of this.wood.colliders){const o=this._circle(c);if(!o)continue;const ox=fx-o.x,oz=fz-o.z,dist=Math.hypot(ox,oz);if(dist<o.r+.8){const force=(o.r+.8-dist)*2.4;sx+=ox/Math.max(.12,dist)*force;sz+=oz/Math.max(.12,dist)*force}}
  for(const other of this.visitors){if(other===v||!other.root.visible)continue;const ox=v.position.x-other.position.x,oz=v.position.z-other.position.z,dist=Math.hypot(ox,oz);if(dist<1.25){sx+=ox/Math.max(.1,dist)*(1.25-dist)*2;sz+=oz/Math.max(.1,dist)*(1.25-dist)*2}}
  const length=Math.max(.001,Math.hypot(sx,sz));v.position.x+=sx/length*speed*dt;v.position.z+=sz/length*speed*dt;
  for(const c of this.wood.colliders){const o=this._circle(c);if(!o)continue;const ox=v.position.x-o.x,oz=v.position.z-o.z,dist=Math.hypot(ox,oz);if(dist<o.r){const a=dist>.001?Math.atan2(ox,oz):v.index+1;v.position.x=o.x+Math.sin(a)*o.r;v.position.z=o.z+Math.cos(a)*o.r}}
  v.yaw=angleLerp(v.yaw,Math.atan2(sx,sz),1-Math.exp(-dt*9));v.root.rotation.y=v.yaw;v.speed=speed;return d;
 }
 nearestOffer(){if(this.physics.held)return null;const p=this.physics.player.position;return this.visitors.find(v=>v.state==='offer'&&Math.hypot(p.x-v.position.x,p.z-v.position.z)<3.5&&Math.abs(p.y-height(v.position.x,v.position.z))<1.7)||null}
 tryFeed(v=this.nearestOffer(),intoPaws=true){
  if(!v||v.state!=='offer'||(intoPaws&&this.physics.held))return null;const p=this.physics.player.position;if(Math.hypot(p.x-v.position.x,p.z-v.position.z)>3.5||Math.abs(p.y-height(v.position.x,v.position.z))>1.7)return null;
  v.root.updateMatrixWorld(true);const at=v.offered.getWorldPosition(new THREE.Vector3()),direction=new THREE.Vector3(p.x-v.position.x,0,p.z-v.position.z).normalize();at.addScaledVector(direction,.25);const velocity=direction.multiplyScalar(1.8);velocity.y=1.2;
  const nut=this.physics.spawnGift(at,velocity,intoPaws);if(!nut)return null;this.stats.fed++;this._state(v,'fed');this._say(v,['There you go, little buddy.','Save that one for winter.','You are one fluffy customer.'][v.index]);v.offered.visible=false;this.events.push({type:'feed',visitor:v,nut,intoPaws});return v;
 }
 bite(){
  if(this.biteCooldown>0)return{type:'cooldown'};this.biteCooldown=.9;const p=this.physics.player.position;
  let target=null,best=1.85;for(const v of this.visitors){if(!v.root.visible||v.invulnerable>0||Math.abs(p.y-height(v.position.x,v.position.z))>2.6)continue;const d=Math.hypot(p.x-v.position.x,p.z-v.position.z);if(d<best){best=d;target=v}}
  if(!target)return{type:'miss'};const v=target;v.invulnerable=5;this.stats.bitten++;this._state(v,'flinch');this._say(v,['HEY! Those are fingers!','I brought snacks, not myself!','Well, that is just ungrateful!'][v.index],4);
  const away=new THREE.Vector3(v.position.x-p.x,0,v.position.z-p.z).normalize();if(away.lengthSq()<.1)away.set(1,0,0);v.target.copy(v.position).addScaledVector(away,25);const radius=Math.hypot(v.target.x,v.target.z);if(radius>31)v.target.multiplyScalar(31/radius);
  for(let i=0;i<3;i++){const velocity=away.clone().multiplyScalar(1.2+this.random()*2);velocity.x+=(this.random()-.5)*3;velocity.z+=(this.random()-.5)*3;velocity.y=2.2+this.random()*2;this.physics.spawnGift(new THREE.Vector3(v.position.x,height(v.position.x,v.position.z)+1.6,v.position.z),velocity,false)}
  this.events.push({type:'bite',visitor:v});return{type:'hit',visitor:v};
 }
 update(dt,enabled=true,cameraYaw=0){
  if(!enabled)return;this.clock+=dt;this.biteCooldown=Math.max(0,this.biteCooldown-dt);const p=this.physics.player.position;
  for(const v of this.visitors){
   v.invulnerable=Math.max(0,v.invulnerable-dt);v.messageTime-=dt;if(v.messageTime<=0)v.message='';
   if(v.state==='waiting'){v.timer-=dt;if(v.timer<=0)this._activate(v);else continue}
   v.timer+=dt;v.age+=dt;v.speed=0;const dist=Math.hypot(p.x-v.position.x,p.z-v.position.z);
   if(v.age>60&&!['leave','flinch','flee'].includes(v.state))this._state(v,'leave');
   if(v.state==='approach'){
    const a=cameraYaw+[Math.PI*.5,-Math.PI*.5,Math.PI][v.index];v.target.set(p.x+Math.sin(a)*2.65,0,p.z+Math.cos(a)*2.65);
    const distance=this._move(v,v.target,1.65,dt);if(distance<.45||dist<2.9){if(this.physics.availableGift())this._state(v,'offer');else{this._state(v,'fed');this._say(v,'All out of snacks!')}}
   }else if(v.state==='offer'){
    v.yaw=angleLerp(v.yaw,Math.atan2(p.x-v.position.x,p.z-v.position.z),1-Math.exp(-dt*10));v.root.rotation.y=v.yaw;
    if(dist>4.2||Math.abs(p.y-height(v.position.x,v.position.z))>1.7)this._state(v,'approach');else if(v.timer>2.2&&!this.physics.held)this.tryFeed(v,true);else if(v.timer>3.5&&this.physics.held)this.tryFeed(v,false);
   }else if(v.state==='fed'){if(v.timer>5.5)this._state(v,'leave');}
   else if(v.state==='flinch'){if(v.timer>.58){this._state(v,'flee');this._say(v,'Nope. Nope. NOPE.',3)}}
   else if(v.state==='leave'||v.state==='flee'){
    this._move(v,v.target,v.state==='flee'?5.5:1.85,dt);if(Math.hypot(v.position.x,v.position.z)>29.8||v.timer>20){this._hide(v);continue}
   }
   v.position.y=height(v.position.x,v.position.z)+(v.state==='flinch'?Math.sin(v.timer/.58*Math.PI)*.18:0);v.animate(dt,this.clock,v.state,v.speed);
   v.body.position.set(v.position.x,height(v.position.x,v.position.z),v.position.z);v.body.velocity.setZero();v.body.shapeOffsets[1].y=1.35-v.model.kneel*.3;v.body.shapeOffsets[2].y=2.6-v.model.kneel*.78;v.body.shapeOffsets[3].y=3.8-v.model.kneel*.78;v.body.aabbNeedsUpdate=true;this.physics.world.broadphase.dirty=true;
  }
 }
 drainEvents(){const out=this.events;this.events=[];return out}
 reset(){for(const v of this.visitors){this._hide(v);v.timer=1+v.index*14;v.invulnerable=0}this.stats={fed:0,bitten:0};this.events=[];this.biteCooldown=0;this.clock=0}
}
