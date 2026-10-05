// Instanced animated pedestrians; only struck characters become articulated physics bodies.
export function createPedestrians({T,C,scene,world,chassis,groundMat,onHit}){
 const max=52,people=[],pending=new Set(),root=new T.Group();scene.add(root);
 const skin=[0xf0c7a2,0xc99169,0x875a40,0x5e3d2e],shirts=[0x327c8c,0xa94443,0xd6ac47,0x64588c,0x548863,0xd0d0bc],pants=[0x35495e,0x45433d,0x252b38];
 const defs=[
  {n:'torso',p:[0,1.08,0],s:[.35,.56,.25],color:'shirt'},
  {n:'hips',p:[0,.78,0],s:[.34,.23,.24],color:'pants'},
  {n:'head',p:[0,1.53,0],s:[.27,.33,.27],color:'skin',sphere:true},
  {n:'armL',p:[-.27,1.03,0],s:[.135,.55,.135],color:'shirt'},
  {n:'armR',p:[.27,1.03,0],s:[.135,.55,.135],color:'shirt'},
  {n:'legL',p:[-.105,.40,0],s:[.16,.68,.17],color:'pants'},
  {n:'legR',p:[.105,.40,0],s:[.16,.68,.17],color:'pants'},
  {n:'handL',parent:3,offset:[0,-.285,0],s:[.12,.15,.12],color:'skin',sphere:true},
  {n:'handR',parent:4,offset:[0,-.285,0],s:[.12,.15,.12],color:'skin',sphere:true},
  {n:'shoeL',parent:5,offset:[0,-.325,-.055],s:[.18,.12,.28],color:'shoe'},
  {n:'shoeR',parent:6,offset:[0,-.325,-.055],s:[.18,.12,.28],color:'shoe'},
  {n:'hair',parent:2,offset:[0,.095,.024],s:[.285,.19,.275],color:'hair',sphere:true},
  {n:'nose',parent:2,offset:[0,-.01,-.143],s:[.055,.067,.068],color:'skin',sphere:true},
  {n:'eyeL',parent:2,offset:[-.055,.04,-.127],s:[.026,.026,.025],color:'shoe',sphere:true},
  {n:'eyeR',parent:2,offset:[.055,.04,-.127],s:[.026,.026,.025],color:'shoe',sphere:true}
 ];
 const sphere=new T.SphereGeometry(.5,12,8),capsule=new T.CapsuleGeometry(.5,.5,4,10);capsule.scale(1,2/3,1);
 const material=new T.MeshStandardMaterial({color:0xffffff,roughness:.87});
 const meshes=defs.map(d=>{const m=new T.InstancedMesh(d.sphere?sphere:capsule,material,max);m.instanceMatrix.setUsage(T.DynamicDrawUsage);m.frustumCulled=false;m.castShadow=true;root.add(m);return m;});
 const path=new T.Mesh(new T.PlaneGeometry(85,8),new T.MeshStandardMaterial({color:0xb2b2a3,roughness:1}));path.rotation.x=-Math.PI/2;path.position.set(0,.004,55);root.add(path);
 const obj=new T.Object3D(),q=new T.Quaternion(),yAxis=new T.Vector3(0,1,0),xAxis=new T.Vector3(1,0,0),v=new T.Vector3();let origin=0,hitCount=0,elapsed=0;
 const routeLength=172;
 function route(distance){let t=((distance%routeLength)+routeLength)%routeLength;if(t<80)return{x:origin-40+t,z:52,yaw:-Math.PI/2};t-=80;if(t<6)return{x:origin+40,z:52+t,yaw:Math.PI};t-=6;if(t<80)return{x:origin+40-t,z:58,yaw:Math.PI/2};return{x:origin-40,z:58-(t-80),yaw:0};}
 function cleanup(p){if(p.sensor)world.removeBody(p.sensor);if(p.bodies){for(const c of p.constraints)world.removeConstraint(c);for(const b of p.bodies)world.removeBody(b);p.bodies=null;}}
 function walkingPose(p){const r=route(p.distance),base=new T.Vector3(r.x,0,r.z),turn=new T.Quaternion().setFromAxisAngle(yAxis,r.yaw+(p.direction<0?Math.PI:0)),stride=Math.sin(p.phase)*.47;
  for(let i=0;i<7;i++){const d=defs[i],pos=new T.Vector3(...d.p),rot=new T.Quaternion();if(i>=3){const a=(i%2?1:-1)*stride*(i<5?-.8:1);rot.setFromAxisAngle(xAxis,a);const pivot=new T.Vector3(d.p[0],i<5?1.29:.76,0);pos.sub(pivot).applyQuaternion(rot).add(pivot);}pos.y+=Math.abs(Math.sin(p.phase))*.022;p.pose[i].p.copy(pos).multiplyScalar(p.scale).applyQuaternion(turn).add(base);p.pose[i].q.copy(turn).multiply(rot);}
  if(p.sensor){p.sensor.position.set(r.x,.87*p.scale,r.z);p.sensor.aabbNeedsUpdate=true;}
 }
 function makeSensor(p){const b=new C.Body({mass:0,type:C.Body.KINEMATIC,shape:new C.Box(new C.Vec3(.24,.77,.22)),collisionResponse:false,collisionFilterGroup:4,collisionFilterMask:1});b.userData={kind:'pedestrian'};b.addEventListener('collide',e=>{if(e.body===chassis&&chassis.velocity.length()>.8&&!p.bodies)pending.add(p);});world.addBody(b);p.sensor=b;}
 function reset(level,ox){for(const p of people)cleanup(p);people.length=0;pending.clear();origin=ox;hitCount=0;elapsed=0;path.position.x=ox;const count=6+2*level;meshes.forEach(m=>m.count=count);
  for(let i=0;i<count;i++){const p={i,distance:i*routeLength/count,phase:i*1.7,speed:.65+(i%5)*.10,direction:i%3?1:-1,scale:.94+(i%4)*.035,pose:Array.from({length:7},()=>({p:new T.Vector3(),q:new T.Quaternion()})),bodies:null,age:0};people.push(p);const colors={skin:skin[i%4],shirt:shirts[i%6],pants:pants[i%3],shoe:0x222625,hair:[0x302720,0x62503a,0x292421,0x8b6944][i%4]};meshes.forEach((m,j)=>m.setColorAt(i,new T.Color(colors[defs[j].color])));makeSensor(p);walkingPose(p);}
  meshes.forEach(m=>{m.instanceColor.needsUpdate=true;});render();
 }
 function knockDown(p){if(p.bodies)return;world.removeBody(p.sensor);p.sensor=null;p.age=0;hitCount++;onHit?.();p.bodies=[];p.constraints=[];
  const motion=chassis.velocity.clone(),speed=motion.length();motion.scale(Math.min(.72,8/Math.max(1,speed)),motion);
  for(let i=0;i<7;i++){const d=defs[i],s=p.scale,b=new C.Body({mass:i===0?23:i===1?12:i===2?5:7,material:groundMat,linearDamping:.20,angularDamping:.35,collisionFilterGroup:4,collisionFilterMask:3,allowSleep:true});b.addShape(i===2?new C.Sphere(.145*s):new C.Box(new C.Vec3(d.s[0]*s/2,d.s[1]*s/2,d.s[2]*s/2)));b.position.copy(p.pose[i].p);b.quaternion.copy(p.pose[i].q);b.velocity.set(motion.x,Math.min(3,.7+speed*.15),motion.z);b.angularVelocity.set((p.i%2?1:-1)*1.2,0,.8);b.userData={kind:'pedestrian'};world.addBody(b);p.bodies.push(b);}
  const links=[[0,1,[0,.83,0]],[0,2,[0,1.38,0]],[0,3,[-.24,1.29,0]],[0,4,[.24,1.29,0]],[1,5,[-.105,.76,0]],[1,6,[.105,.76,0]]];
  const r=route(p.distance),turn=new T.Quaternion().setFromAxisAngle(yAxis,r.yaw+(p.direction<0?Math.PI:0));for(const [a,b,pt]of links){const joint=new T.Vector3(...pt).multiplyScalar(p.scale).applyQuaternion(turn).add(new T.Vector3(r.x,0,r.z)),pa=new C.Vec3(),pb=new C.Vec3();p.bodies[a].pointToLocalFrame(new C.Vec3(...joint.toArray()),pa);p.bodies[b].pointToLocalFrame(new C.Vec3(...joint.toArray()),pb);const constraint=new C.ConeTwistConstraint(p.bodies[a],p.bodies[b],{pivotA:pa,pivotB:pb,axisA:new C.Vec3(0,1,0),axisB:new C.Vec3(0,1,0),angle:Math.PI*.40,twistAngle:.6,maxForce:3500,collideConnected:false});world.addConstraint(constraint);p.constraints.push(constraint);}
 }
 function beforeStep(dt,walking){elapsed+=dt;for(const p of people){if(p.bodies)continue;if(walking){p.distance+=p.speed*p.direction*dt;p.phase+=dt*p.speed*7;}walkingPose(p);}}
 function afterStep(dt,active){if(active)for(const p of pending)knockDown(p);pending.clear();for(const p of people)if(p.bodies){p.age+=dt;for(let i=0;i<7;i++){p.pose[i].p.copy(p.bodies[i].position);p.pose[i].q.copy(p.bodies[i].quaternion);}if(p.age>9&&active){cleanup(p);makeSensor(p);walkingPose(p);}}render();}
 function render(){for(const p of people)defs.forEach((d,j)=>{const pose=p.pose[d.parent??j];obj.position.copy(pose.p);obj.quaternion.copy(pose.q);if(d.parent!==undefined)obj.position.add(v.set(...d.offset).multiplyScalar(p.scale).applyQuaternion(obj.quaternion));obj.scale.set(...d.s).multiplyScalar(p.scale);obj.updateMatrix();meshes[j].setMatrixAt(p.i,obj.matrix);});for(const m of meshes)m.instanceMatrix.needsUpdate=true;}
 function snapshot(){const data=new Float32Array(people.length*7*7);for(const p of people)for(let i=0;i<7;i++){const offset=(p.i*7+i)*7;data.set([...p.pose[i].p.toArray(),...p.pose[i].q.toArray()],offset);}return data;}
 function apply(a,b,u){if(!a||!b)return;for(const p of people)for(let i=0;i<7;i++){const off=(p.i*7+i)*7;p.pose[i].p.fromArray(a,off).lerp(v.fromArray(b,off),u);p.pose[i].q.fromArray(a,off+3).slerp(q.fromArray(b,off+3),u);}render();}
 return{reset,beforeStep,afterStep,snapshot,apply,getInfo:()=>({count:people.length,down:people.filter(p=>p.bodies).length,hits:hitCount}),get people(){return people;}};
}
