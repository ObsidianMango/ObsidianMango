import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js';
import { looseProps } from './nightlife.js';
import { wallSign } from './graphics.js';

const oval = new THREE.SphereGeometry(1,16,12);
const tube = new THREE.CylinderGeometry(.77,1,1,12);
const hoop = new THREE.TorusGeometry(1,.19,7,16);
const profile = points=>new THREE.LatheGeometry(points.map(([r,y])=>new THREE.Vector2(r,y)),24);
const torso = profile([[0,-.13],[.19,-.13],[.24,-.07],[.253,.025],[.205,.115],
  [.157,.205],[.163,.265],[.205,.343],[.224,.40],[.197,.446],[.15,.472],[0,.472]]);
const dress = profile([[0,-.42],[.34,-.42],[.345,-.40],[.296,-.30],[.256,-.18],[.224,-.06],[0,-.06]]);
const shortSkirt = profile([[0,-.235],[.284,-.235],[.285,-.21],[.253,-.10],[.22,-.016],[0,-.016]]);
const waistband = profile([[0,.11],[.208,.11],[.196,.143],[.188,.164],[0,.164]]);
const hairFalls = {
  waves:[[-.116,-.19,-.068,.081,.33,.097],[.126,-.17,-.055,.073,.29,.104],[.053,-.20,-.122,.142,.27,.081]],
  bob:[[-.136,-.065,.014,.066,.168,.107],[.129,-.065,-.009,.06,.155,.119],[0,-.075,-.10,.16,.151,.107]],
  curls:[[-.132,-.095,-.035,.092,.215,.127],[.133,-.102,-.032,.083,.221,.128],[0,-.107,-.126,.184,.187,.115]],
  ponytail:[],
  sidePart:[[-.111,-.15,.028,.074,.268,.078],[.133,-.045,-.049,.05,.154,.109],[.038,-.176,-.118,.141,.286,.091]]
};

function dancer({parent,x,y,z,skin,hair,outfit,style,hairStyle,phase,api}) {
  const {group,mesh,material}=api;
  const figure=group(parent,x,y,z,Math.PI);
  const body=group(figure,0,.95,0);
  const skinMat=material(skin);
  const fabric=material(outfit,0,.18);
  const hairMat=material(hair,0,.12);
  const shoes=material('#24172e',0,.36);
  const jewelry=material('#ffe7b1',1);
  const lashes=material('#2c1631');
  const lipstick=material(style==='trousers'?'#b95f86':'#d95879');
  const ellipsoid=(node,mat,px,py,pz,w,h,d)=>mesh(node,oval,mat,px,py,pz,w,h,d);
  const limb=(node,mat,px,py,pz,r,len)=>mesh(node,tube,mat,px,py,pz,r,len,r);

  mesh(body,torso,fabric,0,0,0,1,1,.64);
  ellipsoid(body,skinMat,0,.466,.038,.149,.093,.101);
  limb(body,skinMat,0,.548,0,.056,.154);
  for(const side of [-1,1]){
    const strap=ellipsoid(body,fabric,side*.118,.463,.074,.024,.086,.057);
    strap.rotation.z=side*.24;
  }
  ellipsoid(body,jewelry,0,.446,.136,.017,.019,.009);
  mesh(body,waistband,jewelry,0,0,0,1,1,.66);
  if(style==='dress')mesh(body,dress,fabric,0,0,0,1,1,.67);
  if(style==='skirt')mesh(body,shortSkirt,fabric,0,0,0,1,1,.70);

  const head=group(body,0,.713,.025);
  ellipsoid(head,hairMat,0,.03,-.058,.171,.217,.151);
  ellipsoid(head,skinMat,0,-.008,.042,.127,.153,.116);
  ellipsoid(head,hairMat,0,.127,.018,.162,.09,.151);
  const fringe=ellipsoid(head,hairMat,-.058,.093,.113,.103,.057,.057);
  fringe.rotation.z=.37;
  for(const shape of hairFalls[hairStyle])ellipsoid(head,hairMat,...shape);
  const tail=group(head,.04,.127,-.171);
  if(hairStyle==='ponytail'){
    ellipsoid(tail,hairMat,.036,-.112,-.069,.081,.215,.09).rotation.x=.32;
    ellipsoid(tail,hairMat,.057,-.26,-.109,.065,.146,.072).rotation.z=.27;
    ellipsoid(tail,jewelry,0,0,0,.061,.025,.059);
  }
  if(hairStyle==='curls'){
    for(const side of [-1,1])for(let i=0;i<3;i++){
      ellipsoid(head,hairMat,side*(.137+i*.008),.069-i*.077,-.015,.064,.064,.079);
    }
  }
  for(const side of [-1,1]){
    const x=side*.051;
    const eye=ellipsoid(head,lashes,x,.017,.146,.024,.012,.012);
    eye.rotation.z=side*.15;
    ellipsoid(head,material('#fff3ec'),x-side*.003,.018,.155,.013,.005,.005);
    ellipsoid(head,lashes,x+side*.003,.018,.158,.007,.007,.005);
    ellipsoid(head,hairMat,x,.046,.143,.026,.006,.009).rotation.z=side*.19;
    const earring=mesh(head,hoop,jewelry,side*.137,-.069,.082,.024,.035,.024);
    earring.rotation.y=side*.42;
  }
  ellipsoid(head,skinMat,0,-.025,.153,.021,.027,.020);
  ellipsoid(head,lipstick,0,-.066,.148,.034,.012,.013);
  ellipsoid(head,material('#ef9caa'),0,-.063,.159,.019,.004,.004);

  const arms=[], knees=[];
  const legMat=style==='trousers'?fabric:skinMat;
  for(const side of [-1,1]){
    const shoulder=group(body,side*.184,.407,0);
    const elbow=group(shoulder,0,-.246,0);
    ellipsoid(shoulder,skinMat,0,-.048,0,.058,.077,.056);
    limb(shoulder,skinMat,0,-.13,0,.049,.25);
    limb(elbow,skinMat,0,-.111,0,.037,.231);
    ellipsoid(elbow,jewelry,0,-.202,0,.041,.016,.04);
    ellipsoid(elbow,skinMat,0,-.236,0,.041,.055,.031);
    arms.push([shoulder,elbow,side]);

    const thigh=group(figure,side*.105,.875,0);
    const calf=group(thigh,0,-.37,0);
    limb(thigh,legMat,0,-.168,0,.087,.397);
    ellipsoid(calf,legMat,0,-.142,0,.058,.205,.059);
    limb(calf,legMat,0,-.265,0,.04,.145);
    ellipsoid(calf,shoes,0,-.35,.066,.062,.047,.103).rotation.x=-.22;
    ellipsoid(calf,shoes,0,-.354,-.011,.029,.069,.035);
    ellipsoid(calf,jewelry,0,-.303,.019,.053,.015,.057);
    knees.push([thigh,calf,side]);
  }

  return time=>{
    const t=time*3.05+phase;
    figure.position.x=x+Math.sin(t*.45)*.39;
    figure.position.z=z+Math.cos(t*.45)*.21;
    figure.rotation.y=Math.PI+Math.sin(t*.5)*.53;
    body.position.y=.94+Math.abs(Math.sin(t))*.057;
    body.rotation.z=Math.sin(t)*.11;
    head.rotation.y=Math.sin(t*.82)*.22;
    tail.rotation.z=Math.sin(t+.5)*.25;
    for(const [shoulder,elbow,side] of arms){
      shoulder.rotation.z=side*(.79+.69*Math.sin(t+side*.8));
      shoulder.rotation.x=.34*Math.sin(t+side);
      elbow.rotation.x=-.75+.57*Math.sin(t*1.25+side);
      elbow.rotation.z=side*.45;
    }
    for(const [thigh,calf,side] of knees){
      thigh.rotation.x=Math.sin(t+side*Math.PI/2)*.23;
      thigh.rotation.z=side*(.13+Math.sin(t)*.075);
      calf.rotation.x=.14+Math.max(0,-Math.sin(t+side*Math.PI/2))*.35;
    }
  };
}

export function buildClub(scene,api) {
  const {box,group,light,material,mesh,plate,wall,block}=api;
  const clubGroup=group(scene,0,0,0);
  const wallDark=material('#24142c');
  const floor=material('#211a33',0,.25);
  const edge=material('#634173',0,.36);
  const amber=material('#ffbd92',1);
  const pink=material('#ff8fda',1);
  const blue=material('#8aaeff',1);
  box(clubGroup,0,-.06,16.67,13.6,.12,12.25,floor);
  box(clubGroup,0,4.72,16.67,13.6,.12,12.25,wallDark);
  wall(clubGroup,0,22.9,13.7,Math.PI);
  wall(clubGroup,-6.9,16.73,12.4,Math.PI/2);
  wall(clubGroup,6.9,16.73,12.4,-Math.PI/2);
  const sign=plate(clubGroup,0,3.38,22.59,7.6,1.5,wallSign('CLUB AFTERGLOW','DANCE FLOOR','#ffa5e1'));
  sign.rotation.y=Math.PI;
  box(clubGroup,0,.13,21.1,8.4,.26,2.65,edge);
  box(clubGroup,0,.19,19.77,8.3,.04,.04,pink);
  block({x:0,z:21.12,w:4.2,d:1.35,h:.28});
  box(clubGroup,0,.7,21.9,2,1.18,.67,wallDark);
  box(clubGroup,0,1.32,21.9,2.05,.12,.72,edge);
  box(clubGroup,0,.94,21.54,1.71,.025,.03,blue);
  for(const x of [-3.88,3.88]){
    box(clubGroup,x,.79,21.55,.8,1.35,.72,wallDark);
    for(const y of [.62,1.03]) {
      mesh(clubGroup,new THREE.CylinderGeometry(.19,.19,.045,14),edge,x,y,21.171,1,1,1,Math.PI/2);
    }
  }
  for(const x of [-5.7,5.7]){
    box(clubGroup,x,.30,17.73,1.25,.59,4.5,wallDark);
    box(clubGroup,x,.61,17.73,1.27,.18,4.5,edge);
    box(clubGroup,x+Math.sign(x)*.55,1.02,17.73,.20,.79,4.52,material('#793658'));
    box(clubGroup,x-Math.sign(x)*.64,.32,17.73,.024,.035,4.49,pink);
    block({x,z:17.73,w:.64,d:2.26});
  }
  const tiles=[];
  const colors=['#482e6a','#61355e','#303d65','#7a426c','#4c5f88','#b85d8c'].map(c=>material(c,1));
  for(let x=0;x<8;x++)for(let z=0;z<7;z++){
    const tile=box(clubGroup,(x-3.5)*.91,.013,13.03+z*.9,.86,.028,.85,colors[(x+z*2)%4]);
    api.dynamic(tile);
    tiles.push({tile,x,z});
  }
  for(const x of [-4.38,4.38]){
    box(clubGroup,x,4.17,16.7,.08,.07,11.8,blue);
    box(clubGroup,x,4.06,16.7,.13,.20,11.8,edge);
    for(const z of [12.1,15.3,18.6,21.6])box(clubGroup,x,3.99,z,.16,.17,.49,pink);
  }
  const ball=group(clubGroup,0,3.75,16.9);
  box(ball,0,.59,0,.031,.69,.031,edge);
  const discoMesh=mesh(ball,new THREE.IcosahedronGeometry(.45,2),new THREE.MeshStandardMaterial({color:'#cab7ee',metalness:.62,roughness:.29,flatShading:true}),0,0,0);
  const dots=new THREE.InstancedMesh(new THREE.BoxGeometry(.046,.046,.046),pink,80);
  const matrix=new THREE.Matrix4();
  for(let i=0;i<80;i++){
    const y=1-2*(i+.5)/80,a=i*2.3999632,r=Math.sqrt(1-y*y);
    matrix.makeTranslation(Math.cos(a)*r*.449,y*.449,Math.sin(a)*r*.449);
    dots.setMatrixAt(i,matrix);
  }
  ball.add(dots);
  const lamps=[
    light(clubGroup,'#fe72cd',24,-3.7,2.4,17,11),
    light(clubGroup,'#9082ff',23,3.6,2.75,18.4,11),
    light(clubGroup,'#fab894',23,0,3.45,20,9)
  ];
  box(clubGroup,-1.39,1.56,11.05,.135,3.08,.12,pink);
  box(clubGroup,1.39,1.56,11.05,.135,3.08,.12,blue);
  box(clubGroup,0,3.13,11.05,2.90,.084,.12,amber);
  const dancers=[
    [-2.18,.28,20.3,'#995b47','#251428','#ee7dab','dress','curls'],
    [2.21,.28,20.24,'#d7a68b','#8e442f','#96a7fa','trousers','ponytail'],
    [-1.76,0,16.64,'#e5b99b','#392239','#68cfba','skirt','bob'],
    [1.79,0,15.93,'#7b463a','#271a2a','#f4ae69','skirt','waves'],
    [.64,0,18.24,'#bd815c','#692951','#ca83ec','dress','sidePart']
  ].map(([x,y,z,skin,hair,outfit,style,hairStyle],index)=>
    dancer({parent:clubGroup,x,y,z,skin,hair,outfit,style,hairStyle,phase:index*1.57,api}));
  light(clubGroup,'#ffe1cf',24,0,3.5,15.1,9);

  for(const animate of dancers)animate(0);
  const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
  let lastStep=-1;
  return (time)=>{
    if(reduced)return;
    ball.rotation.y=time*.37;
    discoMesh.rotation.x=time*.35;
    for(const animate of dancers)animate(time);
    const step=Math.floor(time*2.05);
    if(step===lastStep)return;
    lastStep=step;
    tiles.forEach(({tile,x,z})=>{
      const lit=(x+z+step)%8===0 || (x-z+step)%9===0;
      tile.material=colors[lit?4+(x+z)%2:(x+z*2)%4];
    });
    lamps.forEach((lamp,i)=>{lamp.intensity=16+(1+Math.sin(step*.48+i*2))*7;});
  };
}

const propCylinder=new THREE.CylinderGeometry(1,1,1,14);
const propSphere=new THREE.SphereGeometry(1,16,10);

function model(item,api) {
  const {box,group,material,mesh}=api;
  const object=new THREE.Group();
  const paint=material(item.color,0,.16);
  const metal=material('#bbb6bf',0,.67);
  const cylinder=(mat,y,r,h)=>mesh(object,propCylinder,mat,0,y,0,r,h,r);
  if(item.shape==='ball'){
    mesh(object,propSphere,paint,0,0,0,.145,.145,.145);
    mesh(object,new THREE.TorusGeometry(.145,.007,7,20),material('#482b34'),0,0,0,1,1,1,Math.PI/2);
  } else if(item.shape==='pack'){
    box(object,0,0,0,.13,.19,.067,paint);
    box(object,0,.06,.036,.12,.058,.012,material('#f3dec7'));
  } else if(item.shape==='stick'){
    box(object,0,0,0,.034,.27,.034,material(item.color,1));
  } else {
    const small=item.shape==='shot';
    const r=small?.062:.092;
    const h=small?.105:.217;
    cylinder(paint,0,r,h);
    cylinder(item.shape==='can'?metal:material('#ece1cf'),h/2,r*1.03,.019);
    if(item.shape==='cup'){
      const straw=group(object,.036,.16,0);
      straw.rotation.z=-.17;
      mesh(straw,propCylinder,material('#ff91b0'),0,0,0,.012,.18,.012);
    }
  }
  return object;
}

export function createProps(scene, camera, api, collide) {
  const objects=[];
  const effects=[];
  const heldRoot=new THREE.Group();
  heldRoot.position.set(.32,-.26,-.62);
  camera.add(heldRoot);
  let heldMesh, useTime=0, effectKind, retch=0;

  function add(item,x,y,z,velocity=null) {
    if(objects.length>=28){
      const settled=objects.findIndex(({velocity})=>!velocity || velocity.lengthSq()===0);
      const index=Math.max(0,settled);
      scene.remove(objects[index].object);
      objects.splice(index,1);
    }
    const object=model(item,api);
    object.position.set(x,y,z);
    scene.add(object);
    const prop={object,item,velocity};
    prop.station={title:item.name,prop};
    objects.push(prop);
  }
  for(const item of looseProps)add({...item,remaining:0},item.x,item.shape==='ball'?.15:.12,item.z);

  function aimVector() {
    return camera.getWorldDirection(new THREE.Vector3());
  }
  function toss(item) {
    const from=camera.position.clone().addScaledVector(aimVector(),.29);
    from.y-=.19;
    const velocity=aimVector().multiplyScalar(7.3);
    velocity.y+=1.55;
    add(item,from.x,from.y,from.z,velocity);
  }
  function hovered(ray) {
    let chosen, nearest=3.3;
    for(const prop of objects){
      const delta=prop.object.position.clone().sub(ray.origin);
      const distance=delta.dot(ray.direction);
      if(distance>.25 && distance<nearest && delta.addScaledVector(ray.direction,-distance).length()<.24){
        chosen=prop;
        nearest=distance;
      }
    }
    return chosen && {station:chosen.station,distance:nearest};
  }
  function pick(prop) {
    const index=objects.indexOf(prop);
    if(index<0)return;
    scene.remove(prop.object);
    objects.splice(index,1);
  }
  function held(item) {
    heldRoot.clear();
    heldMesh=item && model(item,api);
    if(heldMesh)heldRoot.add(heldMesh);
    useTime=0;
  }
  function use(kind) {
    useTime=.55;
    effectKind=kind;
    if(kind==='drink')return;
    const forward=aimVector();
    const color=kind==='puke'?'#a4bb51':'#c5b6c9';
    if(kind==='puke')retch=.82;
    for(let i=0;i<(kind==='puke'?20:9);i++){
      if(effects.length>=45)break;
      const drop=api.mesh(scene,propSphere,api.material(color),camera.position.x,camera.position.y-.20,camera.position.z,.045,.045,.045);
      drop.position.addScaledVector(forward,.32);
      const velocity=forward.clone().multiplyScalar(kind==='puke'?2.9:.7);
      velocity.x+=(Math.random()-.5)*1.2;
      velocity.z+=(Math.random()-.5)*1.2;
      velocity.y=kind==='puke'?-.25-Math.random():.4+Math.random()*.65;
      effects.push({drop,velocity,life:kind==='puke'?2.6:1.35,kind});
    }
  }
  function update(dt) {
    useTime=Math.max(0,useTime-dt);
    retch=Math.max(0,retch-dt);
    const lift=Math.sin(useTime/.55*Math.PI);
    heldRoot.position.set(.32-lift*.16,-.26+lift*.16,-.62+lift*.21);
    if(heldMesh)heldMesh.rotation.x=effectKind==='drink'?-lift*.8:0;
    for(const {object,velocity,item} of objects){
      if(!velocity || velocity.lengthSq()===0)continue;
      const p=object.position;
      velocity.y-=9.8*dt;
      const x=p.x+velocity.x*dt,z=p.z+velocity.z*dt;
      if(collide(x,p.z,p.y))p.x=x;
      else velocity.x*=-.5;
      if(collide(p.x,z,p.y))p.z=z;
      else velocity.z*=-.5;
      p.y+=velocity.y*dt;
      const bottom=item.shape==='ball'?.147:.105;
      if(p.y<bottom){
        p.y=bottom;
        velocity.y=velocity.y<-.68?-velocity.y*.40:0;
        velocity.x*=.69;
        velocity.z*=.69;
        if(velocity.lengthSq()<.055)velocity.set(0,0,0);
      }
      object.rotation.x+=velocity.z*dt*2;
      object.rotation.z-=velocity.x*dt*2;
    }
    for(let i=effects.length-1;i>=0;i--){
      const effect=effects[i];
      effect.life-=dt;
      if(effect.life<=0){
        scene.remove(effect.drop);
        effects.splice(i,1);
        continue;
      }
      const smoke=effect.kind==='smoke';
      if(!smoke)effect.velocity.y-=8*dt;
      effect.drop.position.addScaledVector(effect.velocity,dt);
      if(smoke)effect.drop.scale.addScalar(dt*.042);
      else if(effect.drop.position.y<.024){
        effect.drop.position.y=.024;
        effect.velocity.set(0,0,0);
        effect.drop.scale.set(.086,.012,.069);
      }
    }
  }
  return {toss,pick,hovered,held,use,update,retches:()=>retch};
}
