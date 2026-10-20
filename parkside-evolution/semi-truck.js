import {detailKit} from './vehicle-detail-kit.js';
// Ten tractor tires and eight trailer tires. The trailer is one replayable assembly.
export function buildSemiTruck(T,c){
 const k=detailKit(T),{box,cyl,tube,pane}=k;
 k.mat('paint',0x234e69,.38,.32);k.mat('cargo',0xd9dfdc,.25,.58);
 box('chassis',1.8,.24,6.7,0,.72,0,'steel');
 k.loft('bonnet',[[-3.55,.88,1.12,1.88],[-3.25,1.01,1.12,2.02],[-1.75,1.01,1.12,2.12]],'paint');box('grille',1.6,.95,.12,0,1.5,-3.59,'trim');
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

 // Coachwork stays merged into existing breakaway assemblies.
 for(const side of [-1,1]){
  k.wing('fender-front-'+side,side,c.front,.58,c.track,'paint');
  box('bonnet',.025,.10,1.45,side*1.02,1.66,-2.55,'ivory');
  for(let z=-3.1;z<-2;z+=.16)box('bonnet',.025,.22,.045,side*1.025,1.39,z,'black');
  box('door-'+side,.025,.10,2.10,side*1.18,1.68,-.55,'ivory');
  box('door-'+side,.035,.055,.38,side*1.19,2.07,-.15,'black');
  for(const z of [.5,1.5])k.torus('tank-'+side,.365,.025,side*.92,.82,z,'steel','z');
  box('step-'+side,.42,.10,1.5,side*1.2,.67,-.45,'steel');
  for(let z=-1.1;z<.3;z+=.12)box('step-'+side,.35,.015,.035,side*1.2,1.08,z,'black');
  cyl('exhaust-'+side,.12,1.25,side*1.04,1.7,.7,'steel','y');
  cyl('exhaust-'+side,.065,.015,side*1.04,3.93,.7,'black','y');
  box('mirror-'+side,.19,.36,.012,side*1.55,2.75,-1.445,'disc');
  box('rear-mudguard-'+side,.68,.10,2.4,side*.98,1.15,2.03,'paint');
  box('rear-mudguard-'+side,.68,.58,.045,side*.98,.61,3.18,'black');
  for(const z of [11.6,12.85]){
   cyl(n,.16,.08,side*1.36,.5,z,'steel');
   for(let j=0;j<8;j++){const a=j*Math.PI/4;cyl(n,.035,.025,side*1.375,.5+Math.sin(a)*.21,z+Math.cos(a)*.21,'steel');}
  }
  box(n,.67,.62,.06,side*1.0,.55,13.45,'black');
  box(n,.16,.65,.16,side*.92,.83,4.4,'steel');box(n,.4,.08,.4,side*.92,.49,4.4,'black');
  for(let z=2.5;z<14;z+=1.1)box(n,.03,.075,.32,side*1.36,1.34,z,'ivory');
  for(const z of [2.3,7.9,13.7])box(n,.04,.1,.18,side*1.34,3.97,z,'amberLens');
 }
 box('roof',2.48,.06,.5,0,3.13,-1.85,'trim');
 for(const x of [-.63,.63]){tube('windshield',[[x-.22,2.27,-1.76],[x+.22,2.55,-1.76]],.018,'black');cyl('roof',.075,.65,x,3.31,-.7,'trim','z');cyl('roof',.13,.12,x,3.31,-1.07,'trim','z');}
 box('chassis',1.6,.05,.9,0,1.02,1.2,'trim');
 for(let z=3;z<13.8;z+=.8)box(n,2.35,.12,.08,0,1.12,z,'steel');
 box(n,.04,2.8,.045,0,2.7,14.06,'black');
 for(const x of [-1.18,1.18])for(const y of [1.6,2.6,3.7])box(n,.20,.12,.09,x,y,14.1,'steel');
 for(const x of [-.65,.65]){box(n,.36,.055,.12,x,2.05,14.15,'steel');box(n,.12,.26,.04,x,2.13,14.2,'black');}
 for(const x of [-.95,-.65,.65,.95])cyl(n,.09,.05,x,.95,14.13,'tailLens','z');
 box(n,2.5,.13,.15,0,.45,14.14,'trim');
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
