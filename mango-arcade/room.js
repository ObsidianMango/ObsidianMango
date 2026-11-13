import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js';
import { stations, spawn, room } from './catalog.js';
import { bar, clubDoor, club, doorwayHalf } from './nightlife.js';
import { buildClub, createProps } from './club.js';
import { featured } from './featured.js';
import { makeCanvas, texture, drawLabel, screenArt, marquee, wallSign, flooring, panelPack } from './graphics.js';

const boxGeometry = new THREE.BoxGeometry();
const planeGeometry = new THREE.PlaneGeometry();
const cylinderGeometry = new THREE.CylinderGeometry(1,1,1,16);
const sphereGeometry = new THREE.SphereGeometry(1,12,8);
const materials = new Map();
const batchable = new Set();
let building = true;
const cabinetSurfaces = [];
const obstacles = [];
const animated = [];
let vendingGlass;

function material(color, glow = 0, metalness = 0) {
  const key = [color,glow,metalness].join('/');
  if (!materials.has(key)) {
    materials.set(key, glow ? new THREE.MeshBasicMaterial({color, toneMapped:false}) :
      new THREE.MeshStandardMaterial({color,metalness,roughness:metalness ? .46 : .79}));
  }
  return materials.get(key);
}

function mesh(parent, geometry, appearance, x,y,z, sx=1,sy=1,sz=1, rx=0) {
  const item = new THREE.Mesh(geometry,appearance);
  item.position.set(x,y,z);
  item.scale.set(sx,sy,sz);
  item.rotation.x=rx;
  parent.add(item);
  return item;
}
function box(parent, x,y,z, w,h,d, appearance, angle=0) {
  const item=mesh(parent,boxGeometry,appearance,x,y,z,w,h,d,angle);
  if(building)batchable.add(item);
  return item;
}
function plate(parent,x,y,z,w,h,canvas,angle=0,nearest=false) {
  return mesh(parent,planeGeometry,new THREE.MeshBasicMaterial({map:texture(canvas,nearest),toneMapped:false}),x,y,z,w,h,1,angle);
}
function group(parent,x,y,z,rotation=0) {
  const item=new THREE.Group();
  item.position.set(x,y,z);
  item.rotation.y=rotation;
  parent.add(item);
  return item;
}
function light(scene,color,intensity,x,y,z,distance) {
  const point=new THREE.PointLight(color,intensity,distance,2);
  point.position.set(x,y,z);
  scene.add(point);
  return point;
}
function glowCanvas() {
  return makeCanvas(64,64,(ctx,w,h)=>{
    const gradient=ctx.createRadialGradient(w/2,h/2,2,w/2,h/2,w/2);
    gradient.addColorStop(0,'#ffffff8c');
    gradient.addColorStop(.28,'#ffffff32');
    gradient.addColorStop(1,'#ffffff00');
    ctx.fillStyle=gradient;ctx.fillRect(0,0,w,h);
  });
}

function profileGeometry() {
  const profile = new THREE.Shape();
  const points=[[-.69,.06],[.74,.06],[.74,1.01],[.84,1.14],[.78,1.35],[.48,1.45],
    [.3,2.23],[.39,2.37],[.54,2.38],[.54,2.75],[.36,2.87],[-.54,2.87],[-.69,2.67]];
  points.forEach(([z,y],i)=> i ? profile.lineTo(-z,y) : profile.moveTo(-z,y));
  profile.closePath();
  const geometry=new THREE.ExtrudeGeometry(profile,{depth:1.42,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:.028,bevelThickness:.028});
  geometry.rotateY(Math.PI/2);
  geometry.translate(-.71,0,0);
  return geometry;
}
const cabinetBody=profileGeometry();

function shadow(parent,x,z,w,d,map,opacity=.72) {
  const appearance=new THREE.MeshBasicMaterial({map,color:0x080511,transparent:true,opacity,depthWrite:false});
  return mesh(parent,planeGeometry,appearance,x,.015,z,w,d,1,-Math.PI/2);
}

function cabinet(scene, station, shadowMap) {
  const shell=group(scene,station.x,0,station.z,station.turn);
  shadow(shell,0,0,2.26,2.38,shadowMap);
  const dark=material(station.dark,0,.18);
  const face=material('#211a30',0,.21);
  const black=material('#100d18',0,.25);
  const trim=material(station.color,0,.25);
  const accent=material(station.color,1);
  mesh(shell,cabinetBody,dark,0,0,0);
  box(shell,0,.39,.76,1.3,.57,.075,face);
  box(shell,0,.11,.8,1.38,.12,.12,black);
  box(shell,0,.83,.76,1.29,.28,.055,dark);
  box(shell,0,2.51,.55,1.37,.39,.07,black);
  plate(shell,0,2.51,.592,1.31,.315,marquee(station));
  const tilt=-.225;
  box(shell,0,1.855,.43,1.3,.828,.15,black,tilt);
  plate(shell,0,1.858,.51,1.13,.7,screenArt(station),tilt,true);
  box(shell,0,1.418,.61,1.36,.077,.08,trim);
  box(shell,0,1.194,.732,1.39,.17,.29,face,-.33);
  box(shell,0,1.125,.872,1.4,.062,.035,accent);
  const controls=group(shell,0,1.282,.768);
  controls.rotation.x=-.30;
  mesh(controls,cylinderGeometry,black,-.32,.022,0,.093,.04,.093);
  mesh(controls,cylinderGeometry,material('#b6a8ae',0,.75),-.32,.083,0,.026,.13,.026);
  mesh(controls,sphereGeometry,accent,-.32,.153,0,.068,.068,.068);
  for(const [x,z,color] of [[.15,-.031,station.color],[.31,-.02,'#e87cba'],[.23,.074,'#ffe1a3'],[.4,.071,'#a88eee']]){
    mesh(controls,cylinderGeometry,black,x,.015,z,.06,.04,.06);
    mesh(controls,cylinderGeometry,material(color,1),x,.044,z,.043,.02,.043);
  }
  box(shell,0,.64,.808,.41,.27,.029,black);
  for(const x of [-.085,.085]){
    box(shell,x,.682,.83,.094,.1,.025,material('#55506a',0,.64));
    box(shell,x,.69,.847,.034,.011,.013,black);
    box(shell,x,.604,.84,.065,.043,.01,material('#ff8a6a',1));
  }
  for(const x of [-.726,.726]){
    box(shell,x,.58,.71,.035,.94,.035,trim);
    box(shell,x,1.85,.46,.037,.8,.04,trim,tilt);
    box(shell,x,2.51,.546,.035,.39,.035,trim);
    box(shell,x,2.75,.18,.04,.024,.65,accent);
    const side=makeCanvas(128,128,(ctx,w,h)=>{
      ctx.fillStyle=station.dark;ctx.fillRect(0,0,w,h);
      ctx.strokeStyle=station.color;ctx.lineWidth=3;ctx.beginPath();
      ctx.moveTo(64,6);ctx.lineTo(122,64);ctx.lineTo(64,122);ctx.lineTo(6,64);ctx.closePath();ctx.stroke();
      drawLabel(ctx,station.title.split(' ')[0].toUpperCase(),64,64,96,35,station.color);
    });
    const art=plate(shell,x,1.42,-.15,.81,.81,side);
    art.rotation.y=x>0?Math.PI/2:-Math.PI/2;
    art.position.x*=1.018;
  }
  const hit=mesh(shell,boxGeometry,new THREE.MeshBasicMaterial({visible:false}),0,1.43,.04,1.51,2.86,1.52);
  hit.userData.station=station;
  cabinetSurfaces.push(hit);
  obstacles.push({x:station.x,z:station.z,w:station.turn ? .80 : .75,d:station.turn ? .75 : .80});
}

function vendor(scene,station,shadowMap) {
  const unit=group(scene,station.x,0,station.z);
  shadow(unit,0,.08,3.4,2.9,shadowMap);
  const purple=material('#4d305f',0,.42);
  const pink=material('#e8a0ee',1);
  const black=material('#130e1e',0,.23);
  const frame=material('#8d599b',0,.39);
  box(unit,0,1.55,0,2.37,3.1,1.15,purple);
  box(unit,0,1.53,.596,2.18,2.88,.14,black);
  box(unit,0,2.79,.69,2.14,.47,.13,purple);
  plate(unit,0,2.81,.764,2.02,.4,marquee(station));
  for(const x of [-1.104,1.104]){
    box(unit,x,1.59,.69,.102,2.73,.145,frame);
    box(unit,x,1.61,.774,.024,2.58,.02,pink);
  }
  const packCanvas=makeCanvas(640,475,ctx=>ctx.fillRect(0,0,640,475));
  const images=featured.map(()=>null);
  const refresh=()=>{
    const ctx=packCanvas.getContext('2d');
    ctx.fillStyle='#211a30';ctx.fillRect(0,0,640,475);
    for(let i=0;i<featured.length;i++){
      panelPack(ctx,featured[i],9+i%4*158,10+Math.floor(i/4)*231,148,218,images[i]);
    }
    ctx.fillStyle='#b6a1ef13';
    ctx.beginPath();ctx.moveTo(65,0);ctx.lineTo(135,0);ctx.lineTo(525,475);ctx.lineTo(474,475);ctx.closePath();ctx.fill();
  };
  refresh();
  vendingGlass=plate(unit,-.14,1.71,.701,1.68,1.51,packCanvas);
  vendingGlass.userData.station=station;
  featured.forEach((set,index)=>{
    if (!set.art) return;
    const image=new Image();
    image.onload=()=>{images[index]=image;refresh();vendingGlass.material.map.needsUpdate=true;};
    image.src=set.art;
  });
  box(unit,.871,1.78,.69,.231,.89,.11,purple);
  box(unit,.871,2.099,.762,.15,.11,.014,material('#8ae6b8',1));
  for(let y=0;y<4;y++)for(let x=0;x<3;x++){
    box(unit,.811+x*.06,1.937-y*.117,.761,.036,.044,.019,material(y===3?'#f5a5d9':'#9587b6',1));
  }
  box(unit,-.09,.48,.681,1.57,.31,.11,frame);
  box(unit,-.09,.48,.746,1.39,.21,.035,black);
  const tray=box(unit,-.09,.378,.801,1.41,.028,.035,pink);
  const pingMaterial=new THREE.MeshBasicMaterial({color:'#ffb6e8'});
  const dispensed=mesh(unit,boxGeometry,pingMaterial,-.09,.53,.82,.31,.19,.03);
  dispensed.visible=false;
  animated.push((time,pulse)=>{
    tray.visible=pulse>0 || Math.floor(time*1.7)%4!==0;
    dispensed.visible=pulse>0;
    dispensed.position.y=.54-Math.min(1,(.55-pulse)*3)*.09;
  });
  const hit=mesh(unit,boxGeometry,new THREE.MeshBasicMaterial({visible:false}),0,1.54,.03,2.43,3.11,1.45);
  hit.userData.station=station;
  cabinetSurfaces.push(hit);
  obstacles.push({x:station.x,z:station.z,w:1.22,d:.78});
}

function wall(scene,x,z,w,rotation) {
  const wall=group(scene,x,0,z,rotation);
  box(wall,0,2.5,0,w,5,.20,material('#342545'));
  box(wall,0,.7,.122,w,1.4,.07,material('#191326'));
  box(wall,0,.12,.175,w,.24,.1,material('#160f20'));
  box(wall,0,1.42,.157,w,.115,.09,material('#513457'));
  box(wall,0,1.47,.209,w,.026,.025,material('#b46896',1));
  box(wall,0,3.39,.143,w,.08,.11,material('#21172f'));
  box(wall,0,3.45,.205,w,.023,.018,material('#8f568d',1));
  box(wall,0,4.81,.139,w,.24,.13,material('#21172f'));
  for(let xx=-w/2+.8;xx<w/2-.1;xx+=1.09){
    box(wall,xx,.72,.17,.031,1.13,.019,material('#372744'));
    box(wall,xx,2.5,.115,.019,1.82,.025,material('#413051'));
  }
  return wall;
}
function stool(scene,x,z,shadowMap,color='#6c365f') {
  shadow(scene,x,z,1.13,1.03,shadowMap,.58);
  mesh(scene,cylinderGeometry,material('#282233',0,.7),x,.038,z,.35,.064,.35);
  mesh(scene,cylinderGeometry,material('#665469',0,.72),x,.36,z,.08,.62,.08);
  mesh(scene,cylinderGeometry,material('#ac82a8',0,.55),x,.65,z,.32,.075,.32);
  mesh(scene,cylinderGeometry,material(color),x,.708,z,.34,.08,.34);
  obstacles.push({x,z,w:.27,d:.27});
}
function furnishing(scene,shadowMap) {
  const table=group(scene,-5.6,0,-10.75);
  shadow(table,0,0,2.8,2.7,shadowMap,.75);
  mesh(table,cylinderGeometry,material('#34283f',0,.6),0,.07,0,.48,.12,.48);
  mesh(table,cylinderGeometry,material('#69516c',0,.68),0,.57,0,.10,.95,.10);
  mesh(table,cylinderGeometry,material('#96658f',0,.35),0,1.04,0,.66,.09,.66);
  mesh(table,cylinderGeometry,material('#53375b'),0,1.1,0,.67,.047,.67);
  mesh(table,cylinderGeometry,material('#e0a78c'),-.23,1.23,.10,.105,.25,.105);
  mesh(table,cylinderGeometry,material('#ede0d4'),-.23,1.366,.10,.113,.035,.113);
  box(table,-.203,1.441,.10,.014,.13,.015,material('#f4a5c7'),.15);
  obstacles.push({x:-5.6,z:-10.75,w:.60,d:.60});
  stool(scene,-6.66,-10.0,shadowMap);
  stool(scene,-4.61,-10.0,shadowMap);
  const bench=group(scene,-5.45,0,9.54);
  shadow(bench,0,0,4.36,1.6,shadowMap);
  box(bench,0,.26,0,3.7,.45,.72,material('#2b213c'));
  box(bench,0,.51,.032,3.77,.15,.82,material('#793a60'));
  box(bench,0,.80,.37,3.77,.48,.14,material('#693454'));
  for(const x of [-.94,0,.94])box(bench,x,.597,.037,.016,.014,.79,material('#462540'));
  obstacles.push({x:-5.45,z:9.54,w:1.89,d:.48});
  const counter=group(scene,bar.x,0,bar.z,bar.turn);
  shadow(counter,0,0,5,1.8,shadowMap);
  box(counter,0,.55,0,4.25,1.1,.95,material('#3c2b45'));
  box(counter,0,1.13,.043,4.42,.115,1.08,material('#6e5575',0,.28));
  box(counter,0,.97,.493,4.13,.021,.03,material('#dd88b0',1));
  box(counter,-1.15,1.21,.04,.51,.08,.32,material('#201628'));
  box(counter,-1.15,1.43,-.018,.43,.36,.14,material('#292032'),-.14);
  box(counter,-1.15,1.44,.061,.35,.26,.019,material('#b881b7',1),-.14);
  for(const x of [-.1,.23,.6]){
    mesh(counter,cylinderGeometry,material('#eec6a2'),x,1.35,.12,.09,.30,.09);
    mesh(counter,cylinderGeometry,material('#e7d5d8'),x,1.508,.12,.095,.031,.095);
  }
  for(let i=0;i<6;i++){
    const x=-1.6+i*.34;
    const color=['#956c4b','#956b95','#718b5e'][i%3];
    mesh(counter,cylinderGeometry,material(color,0,.3),x,1.38,-.26,.087,.38,.087);
    mesh(counter,cylinderGeometry,material(color,0,.3),x,1.64,-.26,.046,.18,.046);
  }
  for(let i=0;i<3;i++){
    box(counter,1.2+i*.20,1.27,.17,.15,.20,.08,material(i%2?'#f3d8ad':'#dc758d'));
  }
  const hit=mesh(counter,boxGeometry,new THREE.MeshBasicMaterial({visible:false}),0,1.15,0,4.25,2.3,.95);
  hit.userData.station=bar;
  cabinetSurfaces.push(hit);
  obstacles.push({x:bar.x,z:bar.z,w:2.22,d:.56,h:1.15});
}

function batchBoxes(scene) {
  scene.updateMatrixWorld(true);
  const batches=new Map();
  for(const item of batchable) {
    if(!batches.has(item.material)) batches.set(item.material,[]);
    batches.get(item.material).push(item);
  }
  for(const [appearance,items] of batches) {
    if(items.length<4)continue;
    const instance=new THREE.InstancedMesh(boxGeometry,appearance,items.length);
    items.forEach((item,index)=>{
      instance.setMatrixAt(index,item.matrixWorld);
      item.removeFromParent();
    });
    instance.instanceMatrix.needsUpdate=true;
    instance.computeBoundingSphere();
    scene.add(instance);
  }
  batchable.clear();
}

export function createRoom(container) {
  const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance',alpha:false});
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.3;
  renderer.domElement.setAttribute('aria-hidden','true');
  container.append(renderer.domElement);

  const scene=new THREE.Scene();
  scene.background=new THREE.Color('#241732');
  scene.fog=new THREE.FogExp2('#2e1c3e',.026);
  const camera=new THREE.PerspectiveCamera(64,1,.06,60);
  camera.rotation.order='YXZ';
  scene.add(new THREE.HemisphereLight('#edc4ff','#71475f',2.02));
  scene.add(new THREE.AmbientLight('#bd8bcc',.37));
  const fill=new THREE.DirectionalLight('#ffd8bc',1.08);
  fill.position.set(-3,5,4);scene.add(fill);

  const shadowMap=texture(glowCanvas());
  const carpet=texture(flooring());
  carpet.wrapS=carpet.wrapT=THREE.RepeatWrapping;
  carpet.repeat.set(4.2,5.5);
  mesh(scene,planeGeometry,new THREE.MeshStandardMaterial({map:carpet,roughness:.94}),0,0,-1.5,18.5,25.9,1,-Math.PI/2);
  box(scene,0,5.03,-1.5,18.65,.13,25.9,material('#20192c'));
  wall(scene,0,-13.1,18.6,0);
  wall(scene,-9.17,-1.3,23.8,Math.PI/2);
  wall(scene,9.17,-1.3,23.8,-Math.PI/2);
  const wallWidth=9.3-doorwayHalf;
  for(const side of [-1,1])wall(scene,side*(doorwayHalf+wallWidth/2),10.65,wallWidth,Math.PI);
  box(scene,0,4.22,10.65,doorwayHalf*2,1.56,.22,material('#342545'));
  box(scene,0,.014,10.62,doorwayHalf*2,.029,.47,material('#845787',0,.4));

  const purpleNeon=material('#b977d1',1);
  const pinkNeon=material('#e483ac',1);
  const amberNeon=material('#ffd09c',1);
  for(const x of [-7.15,7.15]){
    box(scene,x,4.64,-1.52,.085,.079,22.7,purpleNeon);
    box(scene,x*.68,4.95,-1.44,.108,.1,24.3,material('#30243d'));
    box(scene,x*.28,4.86,-1.49,.05,.035,22.3,pinkNeon);
  }
  for(const z of [-10,-5.1,-.2,4.7,8.9]){
    box(scene,0,4.87,z,18.06,.19,.20,material('#352742'));
    for(const x of [-4,4]){
      box(scene,x,4.73,z,2.62,.095,.32,material('#4c3554'));
      box(scene,x,4.672,z,2.38,.033,.15,amberNeon);
    }
  }
  light(scene,'#fd99d5',17,-6.6,2.6,3,9);
  light(scene,'#8aa5ff',21,6.4,2.65,.4,10);
  light(scene,'#ffc288',24,0,3.8,-9.3,12);
  light(scene,'#dc89ef',20,4.8,2.75,-9.2,8);
  light(scene,'#ff96ba',15,-5.8,3,-6,8);
  light(scene,'#efb1ae',13,0,3.2,6.6,8);
  const sign=wallSign('MANGO ARCADE','GAMES  •  BOOSTERS');
  box(scene,0,3.72,-12.83,8.08,1.64,.29,material('#50344f'));
  plate(scene,0,3.72,-12.654,7.89,1.49,sign);
  box(scene,0,4.54,-12.66,8.03,.038,.04,amberNeon);
  box(scene,0,2.91,-12.66,8.03,.036,.04,pinkNeon);
  const concession=plate(scene,5.7,2.37,10.47,3.86,.91,wallSign('ARCADE BAR','DRINKS  •  CIGARETTES','#ffb7cd'));
  concession.rotation.y=Math.PI;
  const entrance=plate(scene,0,3.73,10.52,3.7,.81,wallSign('CLUB AFTERGLOW','DANCE FLOOR','#ffa5e1'));
  entrance.rotation.y=Math.PI;
  for(const x of [-1.24,1.24])box(scene,x,1.52,10.46,.10,3.01,.13,pinkNeon);
  const doorway=mesh(scene,boxGeometry,new THREE.MeshBasicMaterial({visible:false}),0,1.58,10.72,2.37,3.1,.16);
  doorway.userData.station=clubDoor;
  cabinetSurfaces.push(doorway);
  for(const x of [-2.94,2.94]){
    box(scene,x,.026,-.78,.065,.012,18.66,material('#7a487a'));
    box(scene,x*.958,.023,-.78,.022,.011,18.66,material('#a95d8e'));
  }
  const soffit=material('#583954');
  for(const z of [-7.54,-.3,7.15]) for(const x of [-8.75,8.75]){
    box(scene,x,2.36,z,.55,4.72,.5,soffit);
    box(scene,x*.988,2.33,z,.48,1.05,.085,material('#7f4b74',0,.25));
    box(scene,x*.987,2.34,z,.49,.72,.057,amberNeon);
  }
  furnishing(scene,shadowMap);
  for(const station of stations) {
    if(station.id==='vending')vendor(scene,station,shadowMap);
    else cabinet(scene,station,shadowMap);
  }
  const api={box,group,light,material,mesh,plate,wall,block:obstacle=>obstacles.push(obstacle),
    dynamic:item=>batchable.delete(item)};
  const animateClub=buildClub(scene,api);
  batchBoxes(scene);
  building=false;
  scene.add(camera);
  scene.updateMatrixWorld(true);

  const ray=new THREE.Raycaster();
  const direction=new THREE.Vector2();
  const center=new THREE.Vector2();
  const player={...spawn};
  const playerHeight=1.66;
  let pulse=0, time=0, buzz=0;
  const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
  function inside(x,z,margin=0) {
    if(z>=10.34-margin && z<=10.98+margin)return Math.abs(x)<=doorwayHalf-margin;
    const bounds=z>10.98?club:room;
    return x>=bounds.minX+margin && x<=bounds.maxX-margin &&
      z>=bounds.minZ && z<=(bounds===room?10.34:bounds.maxZ);
  }
  const props=createProps(scene,camera,api,(x,z,y)=>inside(x,z,.09) &&
    !obstacles.some(o=>y<(o.h??2.9) && Math.abs(x-o.x)<o.w+.09 && Math.abs(z-o.z)<o.d+.09));
  function look() {
    const retch=props.retches();
    const sway=reduced?0:Math.min(buzz/85,1)*.025;
    camera.position.set(player.x,playerHeight-(reduced?0:retch*.44),player.z);
    camera.rotation.set(player.pitch-(reduced?0:retch*.42),player.yaw,Math.sin(time*3)*sway,'YXZ');
    camera.updateMatrixWorld();
  }
  function resize() {
    const width=container.clientWidth,height=container.clientHeight;
    if(!width || !height)return;
    camera.fov=width/height<.8 ? 81 : 60;
    camera.aspect=width/height;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.55,Math.sqrt(2200000/(width*height))));
    renderer.setSize(width,height,false);
  }
  function free(x,z) {
    return inside(x,z,.19) &&
      !obstacles.some(o=>Math.abs(x-o.x)<o.w+.22 && Math.abs(z-o.z)<o.d+.22);
  }
  function move(side,forward,dt,sprint) {
    const length=Math.max(1,Math.hypot(side,forward));
    const rate=dt*(sprint?6.1:3.8)*(props.retches()>.12?.42:1)/length;
    const dx=(Math.cos(player.yaw)*side-Math.sin(player.yaw)*forward)*rate;
    const dz=(-Math.sin(player.yaw)*side-Math.cos(player.yaw)*forward)*rate;
    if(free(player.x+dx,player.z))player.x+=dx;
    if(free(player.x,player.z+dz))player.z+=dz;
  }
  function aim(dx,dy) {
    player.yaw-=dx*.0041;
    player.pitch=THREE.MathUtils.clamp(player.pitch-dy*.0039,-1.12,1.08);
  }
  function target(point=center) {
    ray.setFromCamera(point,camera);
    const hit=ray.intersectObjects(cabinetSurfaces,false)[0];
    const prop=props.hovered(ray.ray);
    if(prop && (!hit || prop.distance<hit.distance))return prop.station;
    if(hit?.object.userData.station===clubDoor && player.z>clubDoor.z+1.2)return null;
    return hit && hit.distance<=4.15 ? hit.object.userData.station : null;
  }
  function select(clientX,clientY) {
    const bounds=container.getBoundingClientRect();
    direction.set((clientX-bounds.left)/bounds.width*2-1,-(clientY-bounds.top)/bounds.height*2+1);
    const station=target(direction);
    if(!station)return null;
    const hit=station.id==='vending' && ray.intersectObject(vendingGlass,false)[0];
    if(hit){
      const col=Math.min(3,Math.floor(hit.uv.x*4));
      const row=hit.uv.y>.5?0:1;
      return {station,set:featured[row*4+col]};
    }
    return {station};
  }
  function visit(station) {
    player.x=station.x+Math.sin(station.turn)*2.9;
    player.z=station.z+Math.cos(station.turn)*2.9;
    player.yaw=station.turn;
    player.pitch=.01;
    look();
  }
  function enterClub(){
    Object.assign(player,{x:0,z:13.5,yaw:Math.PI,pitch:0});
    look();
  }
  function draw(dt, level=0) {
    buzz=level;
    props.update(dt);
    look();
    pulse=Math.max(0,pulse-dt);
    time+=dt;
    for(const animate of animated)animate(time,pulse);
    if(player.z>9.6)animateClub(time);
    renderer.render(scene,camera);
  }
  look();
  resize();
  return {player,resize,move,aim,target,select,visit,enterClub,draw,props,dispense:()=>{pulse=.55;}};
}
