import * as THREE from './vendor/three.module.js';
import {rng,height,pathX,material,mesh,canvasTexture,Batch,segment,clamp} from './utils.js';

export function createWoodland(scene){
 const random=rng(241),colliders=[],wind={value:0};
 const barkTex=canvasTexture((c,s)=>{c.fillStyle='#6d5c42';c.fillRect(0,0,s,s);for(let i=0;i<460;i++){const x=random()*s,y=random()*s;c.strokeStyle=i%3?'#493f2d':'#a4946b';c.lineWidth=.5+random()*2;c.beginPath();c.moveTo(x,y);c.bezierCurveTo(x+random()*12,y+20,x-4,y+30,x+random()*7,y+50+random()*55);c.stroke()}for(let i=0;i<15;i++){c.strokeStyle='#4a402e';c.lineWidth=2;c.beginPath();c.ellipse(random()*s,random()*s,3+random()*5,6+random()*12,.2,0,Math.PI*2);c.stroke()}},512);barkTex.wrapS=barkTex.wrapT=THREE.RepeatWrapping;barkTex.repeat.set(2,3);
 const bark=material('#887f64',{map:barkTex,bumpMap:barkTex,bumpScale:.11});
 const branchGeo=new THREE.CylinderGeometry(.65,1,1,9,4);const pa=branchGeo.attributes.position;for(let i=0;i<pa.count;i++){const y=pa.getY(i),a=Math.atan2(pa.getZ(i),pa.getX(i)),f=1+Math.sin(a*5+y*6)*.07;pa.setX(i,pa.getX(i)*f);pa.setZ(i,pa.getZ(i)*f)}branchGeo.computeVertexNormals();
 const branches=new Batch(branchGeo,bark);
 function sway(mat,amount){mat.onBeforeCompile=shader=>{shader.uniforms.uWind=wind;shader.vertexShader='uniform float uWind;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>\n#ifdef USE_INSTANCING\nvec3 wp=instanceMatrix[3].xyz;transformed.x+=sin(uWind*1.3+wp.x*.7+wp.z*.4)*${amount.toFixed(3)}*max(position.y,0.0);transformed.z+=cos(uWind*.9+wp.z*.6)*${(amount*.6).toFixed(3)}*max(position.y,0.0);\n#endif`)};return mat}
 const leafMat=sway(material('#ffffff',{side:THREE.DoubleSide,roughness:1}),.16);
 const leafGeo=new THREE.SphereGeometry(1,5,3),leaves=new Batch(leafGeo,leafMat),bushLeaves=new Batch(leafGeo,leafMat);
 const leafColors=['#6f8740','#647c38','#819447','#8c9c50','#a4a45b','#597737','#8c9f54'];
 function leafCluster(center,r,count,autumn=false){for(let j=0;j<count;j++){const a=random()*Math.PI*2,rr=Math.cbrt(random())*r,y=(random()-.5)*r*1.1;const p=[center[0]+Math.cos(a)*rr,center[1]+y,center[2]+Math.sin(a)*rr];const s=.17+random()*.20;leaves.add(p,[s,s*.13,s*(1.3+random()*.5)],[random()*.8,random()*6.28,random()*.6],autumn?'#b1a15a':leafColors[Math.floor(random()*leafColors.length)])}}
 function tree(x,z,size=1,seedAngle=0){
  const y=height(x,z),h=(7+random()*3.5)*size,r=(.34+random()*.23)*size,leanX=(random()-.5)*.65,leanZ=(random()-.5)*.6;
  const tip=[x+leanX,y+h,z+leanZ];segment(branches,[x,y-.05,z],tip,r,r*.95,'#ddd4b8');
  colliders.push({type:'trunk',climbable:true,x,z,y:y+h/2,baseY:y,radius:r*.85,barkRadius:r,height:h,leanX,leanZ});
  for(let i=0;i<6;i++){const a=i/6*Math.PI*2+seedAngle;segment(branches,[x+Math.cos(a)*r*2.7,y+.05,z+Math.sin(a)*r*2.7],[x+Math.cos(a)*r*.5,y+.7*size,z+Math.sin(a)*r*.5],r*.25,r*.26,'#c3bb99')}
  for(let i=0;i<7;i++){
   const a=i*2.399+seedAngle,yy=y+h*(.47+i*.061),length=(2.5+random()*1.3)*size*(1-i*.055),base=[x+leanX*.6,yy,z+leanZ*.6],end=[x+Math.cos(a)*length,yy+(.9+random())*size,z+Math.sin(a)*length];
   segment(branches,base,end,r*(.34-i*.028),r*(.31-i*.025),'#cfc7a9');
   for(let k=0;k<3;k++){const aa=a+(k-1)*.65,p=[end[0]+Math.cos(aa)*size*.9,end[1]+(.3+random()*.7)*size,end[2]+Math.sin(aa)*size*.9];segment(branches,end,p,r*.085,r*.085,'#d0c8ac');leafCluster(p,(1.10+random()*.45)*size,42+Math.floor(size*15),random()<.11)}
  }
  leafCluster(tip,1.5*size,90);
 }
 // A playable clearing, surrounded by progressively taller layers of forest.
 const placements=[[-7,-5,1.2],[6,-7,1.1],[-11,2,1.1],[11,1,1.25],[-6,11,1.0],[9,12,.95],[-16,-9,1.3],[16,-12,1.2],[-14,12,1.15],[18,10,1.4],[-3,-16,1.2],[7,-18,1.1]];
 placements.forEach(([x,z,s],i)=>tree(x,z,s,i*.7));
 for(let i=0;i<45;i++){const a=i/45*Math.PI*2,r=25+random()*16;tree(Math.cos(a)*r,Math.sin(a)*r,.9+random()*.65,i)}
 for(let i=0;i<10;i++){const a=random()*6.28,r=16+random()*7;tree(Math.cos(a)*r,Math.sin(a)*r,.7+random()*.6,i)}
 branches.finish(scene);const treeFoliage=leaves.finishGrouped(scene,true,14);
 const groundTex=canvasTexture((c,s)=>{c.fillStyle='#c2bd97';c.fillRect(0,0,s,s);for(let i=0;i<24000;i++){c.fillStyle=i%3?'#64704c30':'#ede4b747';const x=random()*s,y=random()*s;c.fillRect(x,y,1+random()*2,1+random()*3)}},256);groundTex.wrapS=groundTex.wrapT=THREE.RepeatWrapping;groundTex.repeat.set(50,50);
 const groundGeo=new THREE.PlaneGeometry(130,130,130,130);groundGeo.rotateX(-Math.PI/2);const gp=groundGeo.attributes.position,gc=[];
 for(let i=0;i<gp.count;i++){const x=gp.getX(i),z=gp.getZ(i);gp.setY(i,height(x,z));const path=Math.exp(-Math.pow((x-pathX(z))/1.9,4)),bare=Math.exp(-(x*x+(z-2)**2)/20);const col=new THREE.Color('#71824b').lerp(new THREE.Color('#b0a17c'),Math.max(path,bare*.8));col.multiplyScalar(.90+random()*.15);gc.push(col.r,col.g,col.b)}groundGeo.setAttribute('color',new THREE.Float32BufferAttribute(gc,3));groundGeo.computeVertexNormals();
 const ground=mesh(groundGeo,material('#ffffff',{vertexColors:true,map:groundTex,bumpMap:groundTex,bumpScale:.035}),scene);ground.castShadow=false;
 const bladeGeo=new THREE.BufferGeometry();bladeGeo.setAttribute('position',new THREE.Float32BufferAttribute([-.025,0,0,.025,0,0,-.015,.29,.035,.015,.29,.035,.018,.56,.10],3));bladeGeo.setIndex([0,1,2,1,3,2,2,3,4]);bladeGeo.computeVertexNormals();
 const grassMat=sway(material('#ffffff',{side:THREE.DoubleSide}),.25),grass=new Batch(bladeGeo,grassMat);
 for(let i=0;i<23000;i++){const a=random()*6.28,r=Math.sqrt(random())*43,x=Math.cos(a)*r,z=Math.sin(a)*r,path=Math.abs(x-pathX(z));if(path<1.5+random()*.65||Math.hypot(x,z-2)<3.4||Math.hypot(x+5,z+3)<1.9)continue;const s=.4+random()*.8;grass.add([x,height(x,z)-.015,z],[s,s*(.7+random()*.6),s],[0,random()*6.28,0],['#7e9349','#98a95b','#687d37','#b1b56d'][Math.floor(random()*4)])}
 const grassMesh=grass.finishGrouped(scene,false,12);
 const bushBranches=new Batch(branchGeo,bark);
 function bush(x,z,s=1){const y=height(x,z);for(let j=0;j<7;j++){const a=j*2.4,end=[x+Math.cos(a)*s*.55,y+s*(.45+random()*.5),z+Math.sin(a)*s*.55];segment(bushBranches,[x,y,z],end,.022,.022);for(let k=0;k<32;k++){const aa=random()*6.28,rr=random()*s*.6,p=[end[0]+Math.cos(aa)*rr,end[1]+(random()-.5)*s*.6,end[2]+Math.sin(aa)*rr];bushLeaves.add(p,[.12*s,.045*s,.22*s],[random(),random()*6.28,random()*.5],leafColors[Math.floor(random()*5)])}}}
 [[-4,6,1.2],[5,3,1.1],[-8,-2,1.4],[6,-10,1.2],[11,5,1.4],[-10,9,1.6],[1,-12,1.1],[-14,-3,1.3],[15,-1,1.8]].forEach(p=>bush(...p));
 for(let i=0;i<75;i++){const a=random()*6.28,r=11+random()*28;bush(Math.cos(a)*r,Math.sin(a)*r,.55+random()*.7)}bushBranches.finish(scene,false);bushLeaves.finishGrouped(scene,false,12);
 // Compound fern fronds: each frond carries two rows of tapered leaflets.
 const fernLeaves=new Batch(leafGeo,material('#ffffff',{side:THREE.DoubleSide}));
 for(let i=0;i<120;i++){const a=random()*6.28,r=5+random()*29,x=Math.cos(a)*r,z=Math.sin(a)*r;if(Math.abs(x-pathX(z))<2)continue;const y=height(x,z),s=.55+random()*.55;for(let f=0;f<7;f++){const aa=f/7*6.28+random()*.3;for(let k=1;k<9;k++){const t=k/9,px=x+Math.cos(aa)*t*s,pz=z+Math.sin(aa)*t*s,py=y+Math.sin(t*Math.PI*.9)*s*.62;for(const sign of[-1,1]){const d=(1-t)*s*.22;fernLeaves.add([px+Math.cos(aa+sign*1.15)*d,py,pz+Math.sin(aa+sign*1.15)*d],[d,.014,d*.38],[.15,aa+sign*1.1,.13],f%2?'#67904b':'#829b53')}}}}
 fernLeaves.finishGrouped(scene,false,12);
 const rockMat=material('#858b75',{bumpMap:groundTex,bumpScale:.08}),rocks=new Batch(new THREE.DodecahedronGeometry(1,1),rockMat);
 for(let i=0;i<70;i++){const a=random()*6.28,r=7+random()*27,x=Math.cos(a)*r,z=Math.sin(a)*r,s=.22+random()*.72;if(Math.abs(x-pathX(z))<1.7)continue;const y=height(x,z);rocks.add([x,y+s*.22,z],[s,s*.65,s*.8],[random(),random()*6.28,random()],['#8e907a','#747f69','#999880'][i%3]);if(s>.55)colliders.push({type:'rock',x,z,y:y+s*.22,radius:s*.78})}rocks.finish(scene,true);
 const pebbles=new Batch(new THREE.DodecahedronGeometry(1,0),material('#ffffff'));
 for(let i=0;i<450;i++){const z=(random()-.5)*58,x=pathX(z)+(random()-.5)*3.4,s=.02+random()*.06;pebbles.add([x,height(x,z)+.015,z],[s,s*.3,s*.75],[0,random()*6.28,0],i%3?'#b5ac90':'#7c8067')}pebbles.finish(scene,false);
 const wood=material('#c3a774',{map:groundTex,bumpMap:barkTex,bumpScale:.04}),home=new THREE.Vector3(-5,height(-5,-3),-3),stump=new THREE.Group();stump.position.copy(home);scene.add(stump);
 mesh(new THREE.CylinderGeometry(1.0,1.17,1.1,18,4,true),bark,stump,[0,.55,0]);
 const top=mesh(new THREE.RingGeometry(.64,1.01,48),wood,stump,[0,1.105,0]);top.rotation.x=-Math.PI/2;
 mesh(new THREE.CylinderGeometry(.64,.6,.43,32,1,true),material('#665238'),stump,[0,.89,0]);
 mesh(new THREE.CylinderGeometry(.62,.62,.10,32),material('#302f21'),stump,[0,.68,0]);
 const ringsMat=material('#786344');for(let i=0;i<6;i++){const ring=mesh(new THREE.TorusGeometry(.69+i*.054,.006,4,48),ringsMat,stump,[0,1.112,0]);ring.rotation.x=Math.PI/2}
 for(let i=0;i<7;i++){const a=i/7*6.28;const rroot=mesh(new THREE.ConeGeometry(.25,1.6,7),bark,stump,[Math.cos(a)*1.05,.13,Math.sin(a)*1.05]);rroot.rotation.z=Math.PI/2;rroot.rotation.y=-a}
 colliders.push({type:'trunk',x:home.x,z:home.z,y:home.y+.5,radius:1.03,height:1});
 const signTex=canvasTexture((c,s)=>{c.fillStyle='#d4bf8f';c.fillRect(0,0,s,s);c.fillStyle='#4c5036';c.textAlign='center';c.font='bold 25px Georgia';c.fillText('THE HOLLOW',s/2,112);c.font='15px Arial';c.fillText('GOOD THINGS GO HERE',s/2,148);c.strokeStyle='#8f8e61';c.strokeRect(12,65,232,120)},256);
 const sign=mesh(new THREE.PlaneGeometry(1.0,.65),material('#ffffff',{map:signTex,transparent:false}),scene,[home.x+.95,home.y+.90,home.z+1.0]);sign.rotation.y=.2;
 mesh(new THREE.CylinderGeometry(.035,.04,1,6),bark,scene,[home.x+.95,home.y+.40,home.z+1.0]);
 const storedVisual=new THREE.Group();storedVisual.position.copy(home).add(new THREE.Vector3(0,.77,0));scene.add(storedVisual);
 // A fallen log is a physical obstacle you can leap onto.
 const logA=new THREE.Vector3(4,height(4,9)+.38,9),logB=new THREE.Vector3(8,height(8,11)+.38,11),logMid=logA.clone().add(logB).multiplyScalar(.5),logLen=logA.distanceTo(logB),logQ=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),logB.clone().sub(logA).normalize());
 const log=mesh(new THREE.CylinderGeometry(.37,.43,logLen,13),bark,scene,logMid.toArray());log.quaternion.copy(logQ);for(const p of[logA,logB]){const cap=mesh(new THREE.CircleGeometry(.35,24),wood,scene,p.toArray());cap.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),p.clone().sub(logMid).normalize())}colliders.push({type:'log',position:logMid,quaternion:logQ,radius:.4,length:logLen});
 const stemBatch=new Batch(new THREE.CylinderGeometry(.55,1,1,6),material('#e1d5ad')),capBatch=new Batch(new THREE.SphereGeometry(1,12,8,0,Math.PI*2,0,Math.PI*.52),material('#bd6a3c')),spots=new Batch(new THREE.SphereGeometry(1,5,3),material('#f2e4b9'));
 for(let i=0;i<62;i++){const a=random()*6.28,r=5+random()*23,x=Math.cos(a)*r,z=Math.sin(a)*r,s=.09+random()*.15,y=height(x,z);stemBatch.add([x,y+s*.55,z],[s*.17,s*1.1,s*.17]);capBatch.add([x,y+s*1.05,z],[s,s*.54,s]);for(let k=0;k<5;k++){const aa=random()*6.28,rr=random()*s*.8;spots.add([x+Math.cos(aa)*rr,y+s*1.05+Math.sqrt(Math.max(0,s*s-rr*rr))*.55,z+Math.sin(aa)*rr],[s*.08,s*.025,s*.08])}}stemBatch.finish(scene,false);capBatch.finish(scene,false);spots.finish(scene,false);
 // Airborne pollen and a few butterflies give the glade a little life.
 const dustPositions=new Float32Array(180*3);for(let i=0;i<180;i++){dustPositions[i*3]=(random()-.5)*40;dustPositions[i*3+1]=random()*7+.4;dustPositions[i*3+2]=(random()-.5)*40}const dustGeo=new THREE.BufferGeometry();dustGeo.setAttribute('position',new THREE.BufferAttribute(dustPositions,3));const dust=new THREE.Points(dustGeo,new THREE.PointsMaterial({color:'#f3e4a3',size:.035,transparent:true,opacity:.52,depthWrite:false}));scene.add(dust);
 const butterflies=[];const wingMat=material('#d0a957',{side:THREE.DoubleSide});for(let i=0;i<7;i++){const group=new THREE.Group(),wings=[];for(const s of[-1,1]){const pivot=new THREE.Group();group.add(pivot);const wing=mesh(new THREE.SphereGeometry(1,8,5),wingMat,pivot,[s*.065,0,0],[.075,.006,.10]);wings.push(pivot)}scene.add(group);butterflies.push({group,wings,a:random()*6.28,r:4+random()*12,phase:random()*10})}
 function animate(t,dt){wind.value=t;dust.rotation.y=t*.003;butterflies.forEach((b,i)=>{const a=b.a+t*.09;b.group.position.set(Math.cos(a)*b.r,1.2+Math.sin(t*.9+b.phase)*.45,Math.sin(a)*b.r);b.group.rotation.y=-a;b.wings[0].rotation.z=Math.sin(t*26+b.phase)*.8;b.wings[1].rotation.z=-Math.sin(t*26+b.phase)*.8})}
 return{colliders,home,storedVisual,animate,treeFoliage,grassMesh,start:new THREE.Vector3(0,height(0,2.5)+.03,2.5)};
}
