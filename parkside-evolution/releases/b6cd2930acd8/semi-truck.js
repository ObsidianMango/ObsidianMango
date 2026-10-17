import {detailKit} from './vehicle-detail-kit.js';
// Ten tractor tires and eight trailer tires. The trailer is one replayable assembly.
export function buildSemiTruck(T,c){
 const k=detailKit(T),{box,cyl,tube,pane}=k;
 k.mat('paint',0x234e69,.38,.32);k.mat('cargo',0xd9dfdc,.25,.58);
 box('chassis',1.8,.24,6.7,0,.72,0,'steel');
 box('bonnet',2.02,.86,1.8,0,1.55,-2.65,'paint');box('grille',1.6,.95,.12,0,1.5,-3.59,'trim');
 for(let i=-6;i<=6;i++)box('grille',.055,.79,.05,i*.105,1.5,-3.67,'black');
 box('front-bumper',2.5,.32,.25,0,.8,-3.7,'trim');
 box('tub',2.3,.15,2.35,0,1.23,-.58,'paint');box('roof',2.35,.14,2.4,0,3.15,-.58,'paint');box('cab-back',2.3,1.8,.12,0,2.2,.58,'paint');
 for(const side of [-1,1]){
  const n='door-'+side;box(n,.09,.95,2.25,side*1.12,1.77,-.58,'paint');
  pane(n,[[side*1.13,2.25,-1.65],[side*1.13,2.25,.46],[side*1.13,3.05,.46],[side*1.13,3.05,-1.65]]);
  tube(n,[[side*1.14,2.2,-1.68],[side*1.14,3.1,-1.68],[side*1.14,3.1,.5],[side*1.14,2.2,.5]],.045,'paint');
  box(n,.08,.07,.28,side*1.2,2.05,.2,'trim');box('step-'+side,.36,.18,1.7,side*1.18,.98,-.45,'trim');
  cyl('tank-'+side,.36,1.6,side*.92,.82,1.0,'trim','z');cyl('exhaust-'+side,.085,3.25,side*1.04,2.3,.7,'trim','y');
  tube('mirror-'+side,[[side*1.13,2.6,-1.5],[side*1.55,2.6,-1.5],[side*1.55,2.95,-1.5]],.035,'trim');box('mirror-'+side,.25,.48,.09,side*1.55,2.75,-1.5,'trim');
  k.lamp('headlight-'+side,side*.85,1.25,-3.6,.15);
  for(const [end,z] of [['front',c.front],['rear',c.rear],['aux',2.65]]){
   const n='wheel-'+end+'-'+(side>0?'left':'right');
   // Detail-kit wheels are merged per material, including the inner dual tire.
   k.wheel(n,side*c.track,c.radius,z,c.radius,.3,'steel');
   if(end!=='front'){cyl(n,c.radius*.98,.27,side*(c.track-.32),c.radius,z,'tire');cyl(n,c.radius*.54,.28,side*(c.track-.32),c.radius,z,'steel');}
  }
 }
 pane('windshield',[[-1.06,2.23,-1.72],[1.06,2.23,-1.72],[1.06,3.05,-1.72],[-1.06,3.05,-1.72]]);
 tube('windshield',[[0,2.23,-1.74],[0,3.07,-1.74]],.035,'trim');
 for(let i=-2;i<=2;i++)box('roof',.14,.1,.12,i*.4,3.27,-1.65,'amberLens');
 k.interior({baseY:1.4,front:-.3,rear:-.3,dash:-1.42,width:.93,rows:1});
 box('engine',.9,.65,1.15,0,1.35,-2.5,'steel');
 cyl('fifth-wheel',.65,.12,0,1.25,2.1,'black','y');
 const n='trailer';box(n,2.6,.16,12,0,1.25,8,'steel');box(n,2.6,.1,12,0,4.1,8,'cargo');
 for(const s of [-1,1]){box(n,.08,2.8,12,s*1.26,2.7,8,'cargo');for(let z=2.2;z<14;z+=.6)box(n,.04,2.7,.035,s*1.315,2.7,z,'trim');box(n,.04,.12,12,s*1.32,1.47,8,'paint');for(let z=2.4;z<14;z+=1.1)box(n,.045,.075,.32,s*1.35,1.34,z,'tailLens');}
 box(n,2.6,2.8,.08,0,2.7,2,'cargo');box(n,2.6,2.8,.08,0,2.7,14,'cargo');for(const x of [-.65,.65]){box(n,.04,2.45,.07,x,2.7,14.08,'trim');box(n,.28,.14,.08,x,1.42,14.1,'tailLens');}
 box(n,2.5,.16,.18,0,.65,14,'steel');
 for(const z of [11.6,12.85])for(const side of [-1,1])for(const x of [.89,1.19]){cyl(n,.5,.26,side*x,.5,z,'tire');cyl(n,.28,.28,side*x,.5,z,'trim');}
 const item=k.finish();item.root.userData.steeringX=-.47;item.root.userData.tires=18;return item;
}

export function createSemiTrailer({T,C,world,chassis,material}){
 let item=null,part=null,body=null,vehicle=null,joint=null;const pos=new T.Vector3(),q=new T.Quaternion();
 function clear(){if(vehicle)vehicle.removeFromWorld(world);if(joint)world.removeConstraint(joint);item=part=body=vehicle=joint=null;}
 function configure(next){clear();if(!next.config.semi)return;item=next;part=item.assemblies.find(p=>p.name==='trailer');const h=part.userData.home;
  body=new C.Body({mass:3600,material,linearDamping:.03,angularDamping:.35,allowSleep:false,collisionFilterGroup:1|32});body.userData={kind:'semi trailer'};
  body.addShape(new C.Box(new C.Vec3(1.3,1.45,6)),new C.Vec3(0,2.7-h.y,8-h.z));
  vehicle=new C.RaycastVehicle({chassisBody:body,indexRightAxis:0,indexUpAxis:1,indexForwardAxis:2});
  for(const z of [11.6,12.85])for(const x of [-1.08,1.08])vehicle.addWheel({radius:.5,directionLocal:new C.Vec3(0,-1,0),axleLocal:new C.Vec3(-1,0,0),chassisConnectionPointLocal:new C.Vec3(x,.76-h.y,z-h.z),suspensionRestLength:.26,maxSuspensionTravel:.2,suspensionStiffness:45,maxSuspensionForce:100000,dampingRelaxation:3,dampingCompression:5,frictionSlip:4,rollInfluence:.03});
  vehicle.addToWorld(world);joint=new C.HingeConstraint(chassis,body,{pivotA:new C.Vec3(0,1.35-item.config.offset,2.1),pivotB:new C.Vec3(0,1.35-h.y,2.1-h.z),axisA:new C.Vec3(0,1,0),axisB:new C.Vec3(0,1,0),maxForce:1e7,collideConnected:false});world.addConstraint(joint);reset();
 }
 function reset(){if(!body)return;const h=part.userData.home;chassis.pointToWorldFrame(new C.Vec3(h.x,h.y-item.config.offset,h.z),body.position);body.quaternion.copy(chassis.quaternion);body.velocity.setZero();body.angularVelocity.setZero();body.force.setZero();body.torque.setZero();body.aabbNeedsUpdate=true;body.wakeUp();}
 function beforeStep(brake=0){if(!body)return;if(!part.userData.attached){clear();return;}for(let i=0;i<4;i++)vehicle.setBrake(brake*3.6,i);}
 function sync(){if(!body||!part.userData.attached)return;item.root.updateMatrixWorld(true);pos.copy(body.position);item.root.worldToLocal(pos);part.position.copy(pos);part.quaternion.copy(item.root.quaternion).invert().multiply(q.copy(body.quaternion));
  for(const side of ['left','right']){const a=item.root.getObjectByName('wheel-aux-'+side),r=item.root.getObjectByName('wheel-rear-'+side);if(a?.userData.attached&&r?.userData.attached){a.quaternion.copy(r.quaternion);a.position.y=r.position.y;}}
 }
 function fits(target,ox,assess){if(!body)return false;const forward=body.quaternion.vmult(new C.Vec3(0,0,-1)),up=body.quaternion.vmult(new C.Vec3(0,1,0));return assess({x:body.position.x-ox,z:body.position.z,yaw:Math.atan2(-forward.x,-forward.z),halfWidth:1.36,halfLength:6.2,speed:body.velocity.length(),up:up.y,lastDirection:-1},target).valid;}
 return{configure,clear,reset,beforeStep,sync,fits,get body(){return body;},getInfo:()=>({active:!!body,tires:body?18:0,articulated:!!joint,position:body?{x:body.position.x,y:body.position.y,z:body.position.z}:null})};
}
