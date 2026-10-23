import * as THREE from './vendor/three.module.js';
import * as CANNON from './vendor/cannon-es.js';
import {height,rng,material,mesh,canvasTexture,clamp} from './utils.js';

export function createNutFactory(){
 const random=rng(91),shellTex=canvasTexture((c,s)=>{c.fillStyle='#ad7743';c.fillRect(0,0,s,s);for(let i=0;i<220;i++){const x=random()*s;c.strokeStyle=i%2?'#68452355':'#edb56b55';c.lineWidth=1+random()*3;c.beginPath();c.moveTo(x,0);c.bezierCurveTo(x-10,s*.3,x+10,s*.6,x,s);c.stroke()}},256);
 const capTex=canvasTexture((c,s)=>{c.fillStyle='#846b42';c.fillRect(0,0,s,s);for(let y=-10;y<s+10;y+=13)for(let x=-10;x<s+10;x+=14){c.fillStyle='#bd9b61';c.beginPath();c.ellipse(x+(Math.floor(y/13)%2)*7,y,5,4,-.2,0,6.28);c.fill();c.strokeStyle='#59472b';c.lineWidth=1;c.stroke()}},256);
 const shell=material('#e1b270',{map:shellTex,bumpMap:shellTex,bumpScale:.016}),capMat=material('#bba473',{map:capTex,bumpMap:capTex,bumpScale:.025}),stemMat=material('#675339');
 const acornGeo=new THREE.SphereGeometry(1,20,16),capGeo=new THREE.SphereGeometry(1,20,12,0,6.283,0,Math.PI*.56),stemGeo=new THREE.CylinderGeometry(.012,.018,.07,7),walGeo=new THREE.SphereGeometry(1,28,20);
 const p=walGeo.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),a=Math.atan2(z,x),theta=Math.acos(clamp(y,-1,1)),r=1+Math.sin(a*11+Math.sin(theta*12)*.4)*.045+Math.cos(theta*17+a*2)*.035;p.setXYZ(i,x*r,y*r,z*r)}walGeo.computeVertexNormals();
 const walnutMat=material('#a08251',{map:capTex,bumpMap:shellTex,bumpScale:.015});
 return function nut(type=0){const group=new THREE.Group();group.name=type?'Walnut':'Acorn';if(!type){mesh(acornGeo,shell,group,[0,-.025,0],[.165,.218,.165]);mesh(capGeo,capMat,group,[0,.080,0],[.185,.115,.185]);const stem=mesh(stemGeo,stemMat,group,[.008,.205,0]);stem.rotation.z=-.24;const point=mesh(new THREE.ConeGeometry(.026,.05,8),shell,group,[0,-.238,0]);point.rotation.z=Math.PI}else{mesh(walGeo,walnutMat,group,[0,0,0],[.196,.208,.18]);const seam=mesh(new THREE.TorusGeometry(.19,.006,5,48),stemMat,group);seam.rotation.y=Math.PI/2;seam.scale.y=1.08}return group}
}

export class GrovePhysics{
 constructor(scene,woodland){
  this.scene=scene;this.wood=woodland;this.factory=createNutFactory();this.world=new CANNON.World({gravity:new CANNON.Vec3(0,-15,0),allowSleep:true});this.world.broadphase=new CANNON.SAPBroadphase(this.world);this.world.solver.iterations=7;
  const earth=new CANNON.Material('earth'),nutMat=new CANNON.Material('nut'),playerMat=new CANNON.Material('player');this.nutMat=nutMat;
  this.world.defaultContactMaterial.friction=.58;this.world.defaultContactMaterial.restitution=.15;
  this.world.addContactMaterial(new CANNON.ContactMaterial(earth,nutMat,{friction:.58,restitution:.32}));
  this.world.addContactMaterial(new CANNON.ContactMaterial(playerMat,earth,{friction:0,restitution:0}));
  this.world.addContactMaterial(new CANNON.ContactMaterial(playerMat,nutMat,{friction:.25,restitution:.25}));
  const data=[],n=81,step=1.5;for(let i=0;i<n;i++){data[i]=[];for(let j=0;j<n;j++)data[i][j]=height(-60+i*step,60-j*step)}
  const ground=new CANNON.Body({mass:0,material:earth});ground.addShape(new CANNON.Heightfield(data,{elementSize:step}));ground.position.set(-60,0,60);ground.quaternion.setFromEuler(-Math.PI/2,0,0);this.world.addBody(ground);
  for(const c of woodland.colliders){let shape,b=new CANNON.Body({mass:0,material:earth});if(c.type==='trunk'){shape=new CANNON.Cylinder(c.radius,c.radius,c.height,10);b.position.set(c.x,c.y,c.z)}else if(c.type==='rock'){shape=new CANNON.Sphere(c.radius);b.position.set(c.x,c.y,c.z)}else{shape=new CANNON.Cylinder(c.radius,c.radius,c.length,12);b.position.copy(c.position);b.quaternion.copy(c.quaternion)}b.addShape(shape);this.world.addBody(b)}
  this.player=new CANNON.Body({mass:2.3,material:playerMat,fixedRotation:true,linearDamping:.1,allowSleep:false});this.player.addShape(new CANNON.Sphere(.35),new CANNON.Vec3(0,.37,0));this.player.addShape(new CANNON.Sphere(.30),new CANNON.Vec3(0,1.12,0));this.player.position.copy(woodland.start);this.world.addBody(this.player);
  this.stashed=new Set();try{const ids=JSON.parse(localStorage.getItem('nutwood-stash-v1')||'[]');if(Array.isArray(ids))ids.filter(id=>Number.isInteger(id)&&id>=0&&id<42).forEach(id=>this.stashed.add(id))}catch{}
  this.nuts=[];this.held=null;this.grounded=false;this.jumpCooldown=0;this.climb=null;this.climbCooldown=0;const random=rng(452);
  const close=[[1.1,3.4],[-1.3,.6],[2.8,-1],[-3.1,-1.3],[-4.1,1.6],[4.3,5]];
  for(let i=0;i<42;i++){let x,z;if(i<close.length)[x,z]=close[i];else{const a=random()*6.28,r=5+Math.sqrt(random())*21;x=Math.cos(a)*r;z=Math.sin(a)*r;if(Math.hypot(x+5,z+3)<1.8)x+=3}
   const type=i%4===2?1:0,obj=this.factory(type),body=new CANNON.Body({mass:type?.115:.08,shape:new CANNON.Sphere(type?.195:.177),material:nutMat,linearDamping:.23,angularDamping:.3,sleepSpeedLimit:.13,sleepTimeLimit:1.3});body.position.set(x,height(x,z)+.27,z);body.quaternion.setFromEuler(random()*.7,random()*6.28,random()*.6);scene.add(obj);
   const nut={id:i,type,mesh:obj,body,start:new THREE.Vector3(x,height(x,z)+.27,z),stored:this.stashed.has(i)};this.nuts.push(nut);if(nut.stored)obj.visible=false;else this.world.addBody(body);
  }
  this.renderStored();
 }
 renderStored(){this.wood.storedVisual.clear();let n=0;for(const id of this.stashed){if(n>=18)break;const nut=this.factory(id%4===2?1:0),a=n*2.399,r=Math.sqrt(n/18)*.47;nut.scale.setScalar(.63);nut.position.set(Math.cos(a)*r,.06+Math.floor(n/9)*.14,Math.sin(a)*r);nut.rotation.set(.5,n,Math.sin(n));this.wood.storedVisual.add(nut);n++}}
 save(){try{localStorage.setItem('nutwood-stash-v1',JSON.stringify([...this.stashed]))}catch{}}
 nearest(){const p=this.player.position;let best=null,d=2.3;for(const n of this.nuts){if(n.stored||n===this.held)continue;const dist=Math.hypot(n.body.position.x-p.x,n.body.position.z-p.z);if(dist<d&&Math.abs(n.body.position.y-p.y)<1.9){d=dist;best=n}}return best}
 nearHome(){return !this.climb&&Math.abs(this.player.position.y-this.wood.home.y)<1.9&&Math.hypot(this.player.position.x-this.wood.home.x,this.player.position.z-this.wood.home.z)<3.05}
 grab(){if(this.held){if(this.nearHome()){const n=this.held;n.stored=true;n.mesh.visible=false;this.stashed.add(n.id);this.held=null;this.save();this.renderStored();return'stash'}this.release(new THREE.Vector3(0,.1,.2),new THREE.Vector3(0,0,0));return'drop'}const n=this.nearest();if(!n)return'empty';this.world.removeBody(n.body);n.body.velocity.setZero();n.body.angularVelocity.setZero();this.held=n;return'grab'}
 release(position,velocity){if(!this.held)return;const n=this.held;this.held=null;n.mesh.visible=true;if(position.length()<.5){n.mesh.getWorldPosition(position);position.y-=.1}n.body.position.copy(position);n.body.velocity.copy(velocity);n.body.angularVelocity.set(3+velocity.z*.5,2,velocity.x*.7);n.body.quaternion.copy(n.mesh.quaternion);this.world.addBody(n.body);n.body.wakeUp();return n}
 nearestTree(){
  const p=this.player.position;let best=null,nearest=.95;
  for(const tree of this.wood.colliders){if(!tree.climbable)continue;const relY=p.y-tree.baseY;if(relY<-.3||relY>tree.height-1.5)continue;const t=clamp(relY/tree.height,0,1),x=tree.x+tree.leanX*t,z=tree.z+tree.leanZ*t,d=Math.hypot(p.x-x,p.z-z)-tree.barkRadius-.35;if(d<nearest){nearest=d;best=tree}}
  return best;
 }
 toggleClimb(){
  if(this.climb){this.detachClimb(false);return'drop'}
  if(this.climbCooldown>0)return'wait';const tree=this.nearestTree();if(!tree)return'empty';
  const p=this.player,relY=clamp(p.position.y-tree.baseY,.06,tree.height-1.85),t=relY/tree.height;
  this.climb={tree,angle:Math.atan2(p.position.x-tree.x-tree.leanX*t,p.position.z-tree.z-tree.leanZ*t),height:relY,maxHeight:tree.height-1.85,speed:0,orbitSpeed:0};
  p.type=CANNON.Body.KINEMATIC;p.collisionResponse=false;p.updateMassProperties();p.velocity.setZero();p.angularVelocity.setZero();p.force.setZero();p.torque.setZero();this.grounded=false;this.placeOnTrunk();return'climb';
 }
 placeOnTrunk(){
  const c=this.climb;if(!c)return;const t=clamp(c.height/c.tree.height,0,1),radius=c.tree.barkRadius*(1-.35*t)+.57;
  this.player.position.set(c.tree.x+c.tree.leanX*t+Math.sin(c.angle)*radius,c.tree.baseY+c.height,c.tree.z+c.tree.leanZ*t+Math.cos(c.angle)*radius);this.player.aabbNeedsUpdate=true;this.world.broadphase.dirty=true;
 }
 detachClimb(leap=false){
  const c=this.climb;if(!c)return false;this.climb=null;const p=this.player,nx=Math.sin(c.angle),nz=Math.cos(c.angle);
  p.type=CANNON.Body.DYNAMIC;p.collisionResponse=true;p.updateMassProperties();
  // Move clear of the full collision cylinder before gravity or the leap resumes.
  const radius=c.tree.radius+.80,t=clamp(c.height/c.tree.height,0,1);
  p.position.x=c.tree.x+c.tree.leanX*t+nx*radius;p.position.z=c.tree.z+c.tree.leanZ*t+nz*radius;
  p.velocity.set(leap?nx*5:0,leap?6.5:-.3,leap?nz*5:0);p.aabbNeedsUpdate=true;p.wakeUp();this.world.broadphase.dirty=true;this.grounded=false;this.jumpCooldown=.3;this.climbCooldown=.55;return true;
 }
 updateClimb(dt,input,enabled){
  const c=this.climb;if(!c)return;const vertical=enabled?clamp(input.climbY??0,-1,1):0,around=enabled?clamp(input.climbX??0,-1,1):0,speed=vertical*(input.run?4.3:2.7),previous=c.height;
  c.height=clamp(c.height+speed*dt,.04,c.maxHeight);c.speed=(c.height-previous)/Math.max(dt,.001);c.orbitSpeed=around*1.5;c.angle+=c.orbitSpeed*dt;this.placeOnTrunk();this.player.velocity.setZero();
  if(c.height<=.045&&vertical<-.1)this.detachClimb(false);
 }
 jump(){if(this.climb)return this.detachClimb(true);if(!this.grounded||this.jumpCooldown>0)return false;this.player.velocity.y=6.5;this.jumpCooldown=.3;this.grounded=false;return true}
 step(dt,input={x:0,z:0,run:false},enabled=true){
  const p=this.player;this.jumpCooldown=Math.max(0,this.jumpCooldown-dt);this.climbCooldown=Math.max(0,this.climbCooldown-dt);const targetSpeed=input.run?6:3.1,blend=1-Math.exp(-dt*(this.grounded?14:4));
  if(this.climb)this.updateClimb(dt,input,enabled);else{p.velocity.x+=(enabled?input.x*targetSpeed-p.velocity.x:-p.velocity.x)*blend;p.velocity.z+=(enabled?input.z*targetSpeed-p.velocity.z:-p.velocity.z)*blend;}
  if(!this.climb&&enabled&&Math.hypot(p.position.x,p.position.z)>33){const a=Math.atan2(p.position.z,p.position.x);p.position.x=Math.cos(a)*32.9;p.position.z=Math.sin(a)*32.9;p.velocity.x*=.2;p.velocity.z*=.2}
  this.world.step(1/60,dt,4);this.grounded=false;
  if(!this.climb){for(const c of this.world.contacts){if((c.bi===p||c.bj===p)&&(c.bi===p?-c.ni.y:c.ni.y)>.45){this.grounded=true;break}}
  if(p.position.y<=height(p.position.x,p.position.z)+.09&&p.velocity.y<.4&&this.jumpCooldown<=0)this.grounded=true;}
  if(p.position.y< -5)this.returnHome();
  for(const n of this.nuts){if(n.stored||n===this.held)continue;if(n.body.position.y< -5||Math.hypot(n.body.position.x,n.body.position.z)>55){n.body.position.copy(n.start);n.body.velocity.setZero();n.body.angularVelocity.setZero();n.body.wakeUp()}n.mesh.position.copy(n.body.position);n.mesh.quaternion.copy(n.body.quaternion)}
 }
 returnHome(){if(this.climb)this.detachClimb(false);this.climbCooldown=0;this.player.position.copy(this.wood.start);this.player.velocity.setZero();this.player.angularVelocity.setZero();this.player.aabbNeedsUpdate=true;this.world.broadphase.dirty=true}
 reset(){if(this.held){const n=this.held;this.held=null;this.world.addBody(n.body)}this.stashed.clear();this.save();for(const n of this.nuts){n.stored=false;n.mesh.visible=true;n.body.position.copy(n.start);n.body.velocity.setZero();n.body.angularVelocity.setZero();if(!this.world.bodies.includes(n.body))this.world.addBody(n.body);n.body.wakeUp()}this.renderStored();this.returnHome()}
}
