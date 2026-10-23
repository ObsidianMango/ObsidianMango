import * as THREE from './vendor/three.module.js';
import {rng,material,mesh,canvasTexture,lerp} from './utils.js';

// All geometry is modeled in code. Each fur strand follows its underlying surface.
export function createSquirrel(){
 const random=rng(88),root=new THREE.Group(),rig=new THREE.Group();root.name='Fluffy squirrel';root.add(rig);
 const sphere=new THREE.SphereGeometry(1,32,24),smallSphere=new THREE.SphereGeometry(1,16,12);
 const furMap=canvasTexture((c,s)=>{c.fillStyle='#a8a094';c.fillRect(0,0,s,s);for(let i=0;i<22000;i++){const v=60+random()*130;c.fillStyle=`rgba(${v},${v*.96},${v*.88},${.10+random()*.3})`;c.fillRect(random()*s,random()*s,1,2+random()*4)}},256);
 furMap.wrapS=furMap.wrapT=THREE.RepeatWrapping;furMap.repeat.set(3,3);
 const coat=material('#838076',{map:furMap,bumpMap:furMap,bumpScale:.025}),dark=material('#343532',{map:furMap,bumpMap:furMap,bumpScale:.02}),cream=material('#eee8d1',{bumpMap:furMap,bumpScale:.015}),muzzleMat=material('#9c9180',{bumpMap:furMap,bumpScale:.015});
 const black=material('#101513',{roughness:.12,metalness:.03}),inner=material('#686056'),clawMat=material('#c2baa2');
 const hairGeo=new THREE.ConeGeometry(1,1,3,1);hairGeo.translate(0,.5,0);
 const hcolors=[];const hp=hairGeo.attributes.position;for(let i=0;i<hp.count;i++){const v=hp.getY(i),col=new THREE.Color().lerpColors(new THREE.Color('#a6a191'),new THREE.Color('#e0ddcc'),v);hcolors.push(col.r,col.g,col.b)}hairGeo.setAttribute('color',new THREE.Float32BufferAttribute(hcolors,3));
 const hairMat=material('#ffffff',{vertexColors:true,roughness:1}),dummy=new THREE.Object3D(),up=new THREE.Vector3(0,1,0),normal=new THREE.Vector3();
 let strandCount=0;
 function hairs(parent,points,color,len=.065,width=.005){
  const inst=new THREE.InstancedMesh(hairGeo,hairMat,points.length);inst.name='Surface-aligned fur';
  const base=new THREE.Color(color);
  points.forEach((p,i)=>{normal.copy(p.n).add(new THREE.Vector3((random()-.5)*.4,-.22,(random()-.5)*.2)).normalize();dummy.position.copy(p.p);dummy.quaternion.setFromUnitVectors(up,normal);const l=len*(.45+random()*.85);dummy.scale.set(width*(.5+random()*.8),l,width*(.5+random()*.8));dummy.updateMatrix();inst.setMatrixAt(i,dummy.matrix);const col=base.clone().multiplyScalar(.68+random()*.6);inst.setColorAt(i,col)});
  inst.castShadow=false;inst.receiveShadow=true;inst.computeBoundingSphere();parent.add(inst);strandCount+=points.length;return inst;
 }
 function fluffy(parent,p,s,mat,count=700,color='#85867e',len=.065,frontOnly=false){
  const m=mesh(sphere,mat,parent,p,s),points=[];
  for(let i=0;i<count;i++){let n=new THREE.Vector3(),v;do{v=random()*2-1;const t=random()*Math.PI*2,r=Math.sqrt(1-v*v);n.set(r*Math.cos(t),v,r*Math.sin(t))}while(frontOnly&&n.z<.2);const local=new THREE.Vector3(n.x*s[0],n.y*s[1],n.z*s[2]);points.push({p:local.add(new THREE.Vector3(...p)),n:new THREE.Vector3(n.x/s[0],n.y/s[1],n.z/s[2]).normalize()})}
  hairs(parent,points,color,len,len>.1?.006:.0038);return m;
 }
 fluffy(rig,[0,.91,-.045],[.49,.69,.39],coat,1800,'#797d75',.075);
 fluffy(rig,[0,1.38,.075],[.365,.43,.32],coat,850,'#85877d',.063);
 fluffy(rig,[0,.96,.286],[.338,.565,.118],cream,1500,'#e4e1cf',.05,true);
 fluffy(rig,[0,1.50,.284],[.255,.25,.095],cream,550,'#e7e6d6',.05,true);
 const head=new THREE.Group();head.position.set(0,1.78,.065);rig.add(head);
 fluffy(head,[0,.12,.09],[.405,.395,.36],coat,1500,'#909187',.055);
 fluffy(head,[0,-.085,.327],[.285,.21,.23],muzzleMat,600,'#aba28e',.039);
 fluffy(head,[-.16,-.13,.35],[.17,.13,.165],muzzleMat,250,'#a59b89',.031);
 fluffy(head,[.16,-.13,.35],[.17,.13,.165],muzzleMat,250,'#a59b89',.031);
 const jaw=new THREE.Group();jaw.position.set(0,-.215,.32);head.add(jaw);fluffy(jaw,[0,0,0],[.22,.10,.16],cream,350,'#d7d6c3',.034,true);
 const openMouth=mesh(smallSphere,material('#3e3028'),head,[0,-.19,.48],[.12,.05,.025]);openMouth.visible=false;
 const teeth=new THREE.Group();head.add(teeth);for(const side of[-1,1])mesh(new THREE.BoxGeometry(.040,.075,.024),material('#fff4d5'),teeth,[side*.025,-.19,.512]);teeth.visible=false;
 const nose=mesh(smallSphere,black,head,[0,-.032,.552],[.074,.052,.054]);
 mesh(smallSphere,material('#acaba2',{roughness:.3}),nose,[-.15,.25,.75],[.22,.12,.1]);
 const mouthCurve=new THREE.CatmullRomCurve3([new THREE.Vector3(-.12,-.17,.49),new THREE.Vector3(0,-.185,.51),new THREE.Vector3(.12,-.17,.49)]);
 mesh(new THREE.TubeGeometry(mouthCurve,16,.006,5,false),material('#413e35'),head);
 const eyes=[];
 for(const sign of[-1,1]){
  const eyePivot=new THREE.Group();head.add(eyePivot);eyePivot.position.set(sign*.295,.145,.334);eyePivot.rotation.y=sign*.38;
  mesh(smallSphere,material('#5c5b50'),eyePivot,[0,0,-.014],[.103,.12,.055]);
  const eye=mesh(smallSphere,black,eyePivot,[0,0,.02],[.085,.103,.058]);eyes.push(eye);
  mesh(smallSphere,new THREE.MeshBasicMaterial({color:'#e9f1e8'}),eyePivot,[-sign*.022,.039,.072],[.019,.024,.009]);
  mesh(smallSphere,new THREE.MeshBasicMaterial({color:'#a2b8a1'}),eyePivot,[sign*.028,-.035,.067],[.009,.011,.006]);
  // Rounded ears continue into long dark tufts, as in the supplied reference.
  const ear=new THREE.Group();ear.position.set(sign*.26,.385,-.018);ear.rotation.z=-sign*.17;head.add(ear);
  fluffy(ear,[0,.125,0],[.126,.30,.075],coat,420,'#686c65',.067);
  mesh(sphere,inner,ear,[0,.13,.054],[.075,.205,.018]);
  const points=[];for(let j=0;j<360;j++){const y=random()*.32;points.push({p:new THREE.Vector3((random()-.5)*.17*(1-y*.7),.24+y,(random()-.5)*.10),n:new THREE.Vector3(sign*.16+random()*.25,.9,-.16).normalize()})}hairs(ear,points,'#3d443f',.18,.0032);
  // Fine curved whiskers are actual 3D strands rather than a face texture.
  const whiskMat=new THREE.LineBasicMaterial({color:'#d7d4be',transparent:true,opacity:.65});
  for(let j=0;j<7;j++){const pts=[];for(let k=0;k<6;k++){const t=k/5;pts.push(new THREE.Vector3(sign*(.15+t*.53),-.10+(j-3)*.022+t*(j-3)*.037,.45+t*.03-t*t*.13))}head.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),whiskMat))}
 }
 const arms=[],feet=[],legs=[];
 for(const sign of[-1,1]){
  const leg=new THREE.Group();leg.name=sign<0?'Left hind leg':'Right hind leg';leg.position.set(sign*.31,.58,-.07);rig.add(leg);legs.push(leg);
  fluffy(leg,[sign*.04,-.11,.035],[.255,.36,.29],coat,500,'#767c73',.058);
  const foot=new THREE.Group();foot.position.set(0,-.45,.20);leg.add(foot);feet.push(foot);
  fluffy(foot,[0,0,.075],[.16,.12,.285],dark,320,'#4e5650',.04);
  for(let i=0;i<4;i++){const x=(i-1.5)*.066;mesh(smallSphere,dark,foot,[x,-.013,.27],[.039,.046,.135]);const claw=mesh(new THREE.ConeGeometry(.019,.10,6),clawMat,foot,[x,-.006,.40]);claw.rotation.x=Math.PI*.58}
  const arm=new THREE.Group();arm.position.set(sign*.36,1.43,.14);arm.rotation.z=sign*.19;rig.add(arm);arms.push(arm);
  fluffy(arm,[sign*.055,-.23,.015],[.135,.32,.14],coat,430,'#787d74',.054);
  const paw=new THREE.Group();paw.position.set(-sign*.035,-.49,.16);arm.add(paw);
  fluffy(paw,[0,0,0],[.12,.105,.15],dark,250,'#464f48',.038);
  for(let i=0;i<4;i++){const x=(i-1.5)*.047;mesh(smallSphere,dark,paw,[x,-.04,.12],[.025,.033,.095]);const claw=mesh(new THREE.ConeGeometry(.011,.062,5),clawMat,paw,[x,-.047,.211]);claw.rotation.x=Math.PI*.58}
 }
 const tail=new THREE.Group();tail.position.set(0,.40,-.32);rig.add(tail);
 const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(0,0,0),new THREE.Vector3(.08,.32,-.54),new THREE.Vector3(.14,.94,-.82),new THREE.Vector3(.13,1.60,-.81),new THREE.Vector3(.06,2.03,-.51),new THREE.Vector3(-.05,2.10,-.16),new THREE.Vector3(-.13,1.91,-.05)]);
 const frames=curve.computeFrenetFrames(44,false),tailPos=[],tailUV=[],tailIdx=[];
 const radius=t=>.035+Math.sin(Math.PI*Math.pow(t,.8))*.365;
 for(let i=0;i<=44;i++){const t=i/44,p=curve.getPointAt(t);for(let j=0;j<=20;j++){const a=j/20*Math.PI*2,r=radius(t),n=frames.normals[i].clone().multiplyScalar(Math.cos(a)).addScaledVector(frames.binormals[i],Math.sin(a));const v=p.clone().addScaledVector(n,r);tailPos.push(v.x,v.y,v.z);tailUV.push(j/20,t*3);if(i<44&&j<20){const k=i*21+j;tailIdx.push(k,k+21,k+1,k+1,k+21,k+22)}}}
 const tailGeo=new THREE.BufferGeometry();tailGeo.setAttribute('position',new THREE.Float32BufferAttribute(tailPos,3));tailGeo.setAttribute('uv',new THREE.Float32BufferAttribute(tailUV,2));tailGeo.setIndex(tailIdx);tailGeo.computeVertexNormals();mesh(tailGeo,dark,tail);
 const tailPoints=[];for(let i=0;i<7200;i++){const t=random(),f=Math.min(43,Math.floor(t*44)),a=random()*Math.PI*2,p=curve.getPointAt(t),n=frames.normals[f].clone().multiplyScalar(Math.cos(a)).addScaledVector(frames.binormals[f],Math.sin(a));tailPoints.push({p:p.addScaledVector(n,radius(t)*(.98+random()*.04)),n:n.addScaledVector(curve.getTangentAt(t),.38).normalize()})}hairs(tail,tailPoints,'#555e56',.13,.0045);
 const tailSilver=[];for(let i=0;i<1800;i++){const t=random()*.85+.05,f=Math.min(43,Math.floor(t*44)),a=random()*Math.PI*2,n=frames.normals[f].clone().multiplyScalar(Math.cos(a)).addScaledVector(frames.binormals[f],Math.sin(a));tailSilver.push({p:curve.getPointAt(t).addScaledVector(n,radius(t)*1.02),n:n.addScaledVector(curve.getTangentAt(t),.5).normalize()})}hairs(tail,tailSilver,'#92978a',.14,.0024);
 const carryPoint=new THREE.Object3D();carryPoint.position.set(0,1.10,.61);rig.add(carryPoint);
 let phase=0,tailX=0,tailZ=0,walkBlend=0,sprintBlend=0;
 function animate(dt,time,speed=0,holding=false,airborne=false,climbing=null,actions={}){
  const blend=1-Math.exp(-dt*10),limbBlend=1-Math.exp(-dt*24),moving=Math.min(speed/2.7,1),climbSpeed=climbing?Math.abs(climbing.speed)+Math.abs(climbing.orbitSpeed)*.5:0;
  walkBlend=lerp(walkBlend,climbing?0:moving,blend);sprintBlend=lerp(sprintBlend,climbing?0:THREE.MathUtils.clamp((speed-3)/2.5,0,1),blend);
  phase+=dt*(climbing?climbSpeed*5.4:speed>.12?7+speed*2:0);
  const lean=climbing?.09:airborne?.18:walkBlend*.28+sprintBlend*(holding?.29:.56);
  rig.rotation.x=lerp(rig.rotation.x,lean,blend);rig.rotation.z=lerp(rig.rotation.z,climbing?Math.sin(phase)*.035:Math.sin(phase)*walkBlend*(1-sprintBlend)*.025,blend);
  rig.position.y=climbing?Math.sin(phase)*Math.min(climbSpeed,1)*.022:Math.sin(time*2.2)*.010+walkBlend*.025+sprintBlend*.10+Math.abs(Math.sin(phase))*walkBlend*.035+Math.max(0,Math.sin(phase))*sprintBlend*.15;
  rig.scale.set(1,1+Math.sin(phase)*sprintBlend*.025,1);
  for(let i=0;i<2;i++){
   const sign=i?1:-1,walkPhase=phase+i*Math.PI,boundPhase=phase+i*.23,cycle=climbing?walkPhase:lerp(walkPhase,boundPhase,sprintBlend),swing=Math.sin(cycle);
   legs[i].rotation.x=lerp(legs[i].rotation.x,climbing?swing*.42:airborne?-.58:swing*(.42+.47*sprintBlend)*walkBlend,limbBlend);
   feet[i].position.y=climbing?-.30+Math.max(0,swing)*.13:-.45+Math.max(0,swing)*walkBlend*(.09+.06*sprintBlend);
   feet[i].position.z=climbing?.31:.20+swing*walkBlend*.075;
   feet[i].rotation.x=climbing?-.48+swing*.2:-legs[i].rotation.x*.38+Math.cos(cycle)*walkBlend*.16;
   const forePhase=climbing?walkPhase+Math.PI:lerp(walkPhase+Math.PI,boundPhase+2.7,sprintBlend);
   const armTarget=climbing?-1.73+Math.sin(forePhase)*.66:holding?-.85:-.12+Math.sin(forePhase)*walkBlend*(.52+.40*sprintBlend);
   arms[i].rotation.x=lerp(arms[i].rotation.x,armTarget,limbBlend);arms[i].rotation.z=lerp(arms[i].rotation.z,-sign*(climbing?.14:holding?.50:.10),limbBlend);
  }
  head.rotation.y=Math.sin(time*.8)*.045*(1-walkBlend);head.rotation.x=lerp(head.rotation.x,climbing?.04:-rig.rotation.x*.52+Math.sin(time*1.7)*.02,blend);
  const chomp=Math.sin(THREE.MathUtils.clamp(actions.bite||0,0,1)*Math.PI),nibble=(actions.feed||0)>0?Math.max(0,Math.sin(time*21))*.30:0,opening=Math.max(chomp,nibble);
  rig.position.z=climbing?0:chomp*.23;head.rotation.x-=chomp*.18;jaw.position.y=-.215-opening*.09;openMouth.visible=opening>.08;openMouth.scale.y=.05*(.3+opening);teeth.visible=opening>.08;
  carryPoint.position.set(0,climbing?1.70:1.10,climbing?.60:.61);
  nose.scale.y=.052*(1+Math.sin(time*15)*.035);
  const blink=Math.sin(time*1.4)>.997?.12:1;eyes.forEach(e=>e.scale.y=.103*blink);
  tailX=lerp(tailX,-rig.rotation.x*.82+Math.sin(time*1.8)*.045+Math.sin(phase-.8)*sprintBlend*.16+(climbing?-.18:0)+(airborne?-.12:0),1-Math.exp(-dt*5));
  tailZ=lerp(tailZ,Math.sin(time*1.15)*.09+Math.sin(phase-.6)*walkBlend*.10+(climbing?Math.sin(phase)*.12:0),1-Math.exp(-dt*4));tail.rotation.set(tailX,Math.sin(time*.7)*.05,tailZ);
  root.userData.gait={walk:walkBlend,sprint:sprintBlend,climbing:!!climbing,phase};
 }
 root.userData.strands=strandCount;
 return{root,rig,head,tail,carryPoint,legs,feet,arms,animate,strandCount};
}
