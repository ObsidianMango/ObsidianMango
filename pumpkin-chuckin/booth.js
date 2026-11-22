import { THREE, v3, clamp, groundHeight, mesh, box, surface, TAU } from './field.js';

export const boothRounds=[
  {name:'First Splat',distance:18,x:-1.13,travel:.31,rate:1.14,duck:0},
  {name:'Side Steps',distance:23,x:-1.53,travel:.82,rate:1.45,duck:.32},
  {name:'Duck & Cover',distance:29,x:-1.42,travel:.93,rate:1.61,duck:.85}
];
const volunteers=[
  {name:'Rory',skin:'#cc865a',shirt:'#e7aa47',overalls:'#496479',hat:'#be613f',boots:'#563d30',hair:'#623524'},
  {name:'Kit',skin:'#8f573d',shirt:'#68a886',overalls:'#634a72',hat:'#e2af64',boots:'#4c3c32',hair:'#2f2523'}
];
const up=v3(0,1,0);
const bodyPitch=.98;
const torsoHeight=.42;
const headHeight=.89;
const torsoShape=[.36,.36,.205];
const headShape=[.205,.249,.193];

export function volunteerPose(round,index,time,result={}){
  const wave=time*round.rate+index*1.58;
  const pace=Math.sin(wave), stride=Math.cos(wave);
  const base=index===0?round.x:1.40+round.distance*.018;
  const x=base+pace*round.travel*(index===0?1:.87);
  const z=-round.distance-index*1.15;
  const duck=round.duck*clamp((Math.sin(time*.94+index*2.4+1.0)-.36)*1.7,0,1);
  const bob=Math.abs(Math.sin(wave*2))*.037;
  result.x=x;
  result.z=z;
  result.y=groundHeight(x,z);
  result.crouch=duck;
  result.hip=bodyPitch-duck*.43+bob;
  result.stride=stride*(.38+round.travel*.5);
  result.walk=wave*2;
  return result;
}

function ellipsoid(parent,mat,x,y,z,sx,sy,sz){
  const model=mesh(parent,new THREE.SphereGeometry(1,18,12),mat,x,y,z);
  model.scale.set(sx,sy,sz);
  return model;
}

function interpolateSegment(model,from,to,radius){
  const delta=to.clone().sub(from);
  model.position.copy(from).addScaledVector(delta,.5);
  model.quaternion.setFromUnitVectors(up,delta.clone().normalize());
  model.scale.set(radius,delta.length()/2+radius*.53,radius);
}

function volunteer(scene,index){
  const colors=volunteers[index];
  const root=new THREE.Group();
  const body=new THREE.Group();
  const head=new THREE.Group();
  root.add(body);
  body.add(head);
  head.position.y=headHeight;
  scene.add(root);
  const skin=surface(colors.skin,{roughness:.55}), hair=surface(colors.hair);
  const shirt=surface(colors.shirt), overalls=surface(colors.overalls), hat=surface(colors.hat);
  const boots=surface(colors.boots), glove=surface('#ead29f');
  const ivory=surface('#fff1d4'), enamel=surface('#393126'), lip=surface('#5d312e');
  const brass=surface('#ddb474',{metalness:.24});
  ellipsoid(body,shirt,0,.38,0,.385,.399,.218);
  ellipsoid(body,overalls,0,.10,.004,.317,.186,.224);
  const bib=box(body,overalls,.48,.40,.065,0,.33,.195);
  bib.rotation.x=-.12;
  for(const side of [-1,1]){
    const strap=box(body,overalls,.073,.377,.059,side*.211,.557,.171);
    strap.rotation.z=side*.096;strap.rotation.x=-.16;
    ellipsoid(body,brass,side*.207,.443,.235,.035,.035,.018);
  }
  ellipsoid(head,skin,0,0,0,...headShape);
  ellipsoid(head,hair,0,.119,-.053,.213,.174,.178);
  ellipsoid(head,hat,0,.190,-.012,.226,index===0?.114:.144,.201);
  if(index===0)ellipsoid(head,hat,0,.161,.149,.224,.025,.178);
  else ellipsoid(head,hat,0,.17,-.021,.228,.047,.203);
  ellipsoid(head,skin,0,-.025,.193,.057,.048,.066);
  const eyes=[],brows=[];
  for(const side of [-1,1]){
    ellipsoid(head,skin,side*.197,-.006,.015,.048,.074,.043);
    const pupil=new THREE.Group();
    pupil.position.set(side*.081,.050,.178);
    head.add(pupil);
    ellipsoid(pupil,ivory,0,0,0,.048,.035,.022);
    ellipsoid(pupil,enamel,.005,-.002,.022,.018,.022,.009);
    eyes.push(pupil);
    const brow=ellipsoid(head,hair,side*.083,.108,.182,.055,.011,.010);
    brows.push(brow);
    ellipsoid(head,skin,side*.122,-.056,.167,.052,.030,.027);
    if(index===1){
      const frames=mesh(head,new THREE.TorusGeometry(.063,.010,7,18),hat,side*.081,.050,.209);
      frames.scale.y=.92;
    }
  }
  if(index===1)box(head,hat,.064,.012,.015,0,.056,.213);
  const mouth=ellipsoid(head,lip,0,-.106,.178,.072,.018,.017);
  const smile=ellipsoid(head,ivory,0,-.101,.192,.048,.008,.008);
  const patches={head:new THREE.Group(),torso:new THREE.Group()};
  patches.head.position.set(0,-.021,.205);
  patches.torso.position.set(0,torsoHeight,.228);
  head.add(patches.head);
  body.add(patches.torso);
  const legs=[],arms=[];
  for(const side of [-1,1]){
    const thigh=ellipsoid(root,overalls,0,0,0,1,1,1);
    const calf=ellipsoid(root,overalls,0,0,0,1,1,1);
    const shoe=ellipsoid(root,boots,0,0,0,.124,.083,.218);
    legs.push({side,thigh,calf,shoe,hip:v3(),knee:v3(),ankle:v3()});
    const sleeve=ellipsoid(body,shirt,0,0,0,1,1,1);
    const forearm=ellipsoid(body,skin,0,0,0,1,1,1);
    const mitten=ellipsoid(body,glove,0,0,0,.103,.125,.084);
    arms.push({side,sleeve,forearm,mitten,shoulder:v3(),elbow:v3(),hand:v3()});
  }
  return {name:colors.name,colors,root,body,head,eyes,brows,mouth,smile,patches,legs,arms,state:{}};
}

function animate(actor,round,index,time,hit,age){
  const p=volunteerPose(round,index,time,actor.state);
  const impacted=hit?.volunteer===index;
  const witness=hit?.volunteer!==undefined&&!impacted;
  const recoil=impacted?(1-Math.exp(-age*38))*Math.exp(-age*5.7):0;
  const wipe=impacted?Math.sin(clamp((age-.31)/.69,0,1)*Math.PI):0;
  const cleanup=impacted?hit.reaction.cleanup:'';
  const shake=cleanup==='shake'?wipe*Math.sin(age*21)*.46:0;
  const laugh=impacted?Math.sin(clamp((age-.64)/.66,0,1)*Math.PI):0;
  const cheer=witness?Math.sin(clamp(age/1.15,0,1)*Math.PI):0;
  const direction=impacted?hit.reaction.direction:1;
  const wipeSide=impacted?hit.reaction.hand:1;
  const lean=impacted?hit.reaction.lean:0;
  const wipeHeight=hit?.region==='head'?.91:.52;
  actor.root.position.set(p.x+direction*recoil*.24*lean,p.y,p.z-recoil*.29*lean);
  actor.body.position.set(0,p.hip-recoil*.17,0);
  actor.body.rotation.set(-recoil*.66*lean, p.stride*.21 + direction*recoil*.31, -direction*recoil*.59*lean);
  actor.head.rotation.set(-recoil*.35+wipe*.13, p.stride*-.15+wipe*.19*direction+shake, direction*(recoil*.36-wipe*.18));
  const blink=!impacted&&Math.abs(Math.sin(time*1.37+index*2.7))<.040?.13:1;
  for(const eye of actor.eyes)eye.scale.y=Math.max(.10,blink*(1-.88*recoil-.46*wipe));
  for(let i=0;i<actor.brows.length;i++)actor.brows[i].rotation.z=(i===0?-1:1)*(recoil*.45+cheer*.21);
  actor.mouth.scale.y=.018*(1+5*recoil+2.2*laugh+1.7*cheer);
  actor.smile.visible=recoil<.14&&(impacted||witness||index===1);

  const stride=hit?0:p.stride;
  for(const leg of actor.legs){
    const side=leg.side;
    const step=side*Math.sin(p.walk)*.12*stride;
    const brace=impacted?recoil*.20:0;
    leg.hip.set(side*.153,p.hip-.05,0);
    leg.knee.set(side*(.16+brace),.45-p.crouch*.18,.020+step*.38+p.crouch*.23);
    leg.ankle.set(side*(.177+brace),.12+Math.max(0,step*.39),.033+step-recoil*.20*(side===direction?1:.20));
    interpolateSegment(leg.thigh,leg.hip,leg.knee,.116);
    interpolateSegment(leg.calf,leg.knee,leg.ankle,.094);
    leg.shoe.position.copy(leg.ankle).add(v3(0,-.042,.074));
    leg.shoe.rotation.y=side*.12;
  }
  for(const arm of actor.arms){
    const side=arm.side;
    const shielding=p.crouch*.55;
    const wave=hit?0:.07*Math.sin(p.walk+side);
    arm.shoulder.set(side*.373,.596,0);
    arm.elbow.set(side*(.446+recoil*.15+cheer*.13),.242+shielding*.37+recoil*.40+cheer*.35,.036+wave+shielding*.17);
    arm.hand.set(side*(.434+recoil*.24+cheer*.13),-.011+shielding+.98*recoil+cheer*.98,.097+wave*1.5+shielding*.30+recoil*.12);
    if(impacted&&side===wipeSide){
      arm.elbow.lerp(v3(side*.494,.392,.264),wipe);
      const sweep=cleanup==='brush'?.26*Math.sin(age*17):cleanup==='shake'?side*.24:.104*Math.cos(age*13);
      arm.hand.lerp(v3(side*.025+sweep,wipeHeight,.33),wipe);
    }
    interpolateSegment(arm.sleeve,arm.shoulder,arm.elbow,.108);
    interpolateSegment(arm.forearm,arm.elbow,arm.hand,.077);
    arm.mitten.position.copy(arm.hand);
    arm.mitten.rotation.z=side*(recoil*.42+wipe*.31);
  }
  actor.recoil=recoil;
  actor.cheer=cheer;
  actor.wipe=wipe;
  actor.laugh=laugh;
}

function volunteerFixture(scene,materials){
  const frame=new THREE.Group();
  const wood=surface('#bc9461',{...materials.wood,bumpScale:.045});
  const rail=surface('#b65140',{...materials.wood,bumpScale:.043});
  const upper=surface('#c3a77a',{...materials.wood,bumpScale:.035});
  for(const side of [-1,1]){
    const x=side*4.2;
    box(frame,wood,.23,3.88,.27,x,1.91,0);
    box(frame,rail,.30,.26,.30,x,3.79,0);
  }
  box(frame,wood,8.74,.27,.25,0,3.62,0);
  for(let i=0;i<12;i++){
    const panel=box(frame,i%2?upper:rail,.58,.10,1.65,(i-5.5)*.704,3.66,.58);
    panel.rotation.x=.14;
  }
  box(frame,wood,8.53,.13,.18,0,.69,-.15);
  const label=document.createElement('canvas');
  label.width=512;label.height=92;
  const ctx=label.getContext('2d');
  ctx.fillStyle='#644339';ctx.fillRect(0,0,512,92);
  ctx.strokeStyle='#baa37a';ctx.lineWidth=5;ctx.strokeRect(7,7,498,78);
  ctx.fillStyle='#ffeece';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 40px Georgia';
  ctx.fillText('SPLAT BOOTH',256,47);
  const map=new THREE.CanvasTexture(label);map.colorSpace=THREE.SRGBColorSpace;
  mesh(frame,new THREE.PlaneGeometry(2.9,.53),surface('#ffffff',{map}),0,3.34,.14);
  scene.add(frame);
  return {frame,label};
}

export function buildBooth(scene,materials){
  const actors=volunteers.map((_,i)=>volunteer(scene,i));
  const {frame,label}=volunteerFixture(scene,materials);
  function setVisible(visible){
    frame.visible=visible;
    for(const actor of actors)actor.root.visible=visible;
  }
  setVisible(false);
  return {
    actors,frame,label,setVisible,
    update(round,time,hit,age=0){
      const backZ=-round.distance-2.85;
      frame.position.set(.21,groundHeight(.21,backZ),backZ);
      for(let i=0;i<actors.length;i++)animate(actors[i],round,i,time,hit,age);
    },
    decalAnchor(hit){
      return actors[hit.volunteer].patches[hit.region];
    }
  };
}

function hitRegion(a,b,radius,pose,region){
  const head=region==='head';
  const y=pose.y+pose.hip+(head?headHeight:torsoHeight);
  const [w,h,d]=head?headShape:torsoShape;
  const centerZ=pose.z+(head?0:.054);
  const sx=w+radius*.60, sy=h+radius*.57, sz=d+radius*.88;
  const ox=(a.x-pose.x)/sx,oy=(a.y-y)/sy,oz=(a.z-centerZ)/sz;
  const dx=(b.x-a.x)/sx,dy=(b.y-a.y)/sy,dz=(b.z-a.z)/sz;
  const quad=dx*dx+dy*dy+dz*dz;
  const dot=ox*dx+oy*dy+oz*dz;
  const outside=ox*ox+oy*oy+oz*oz-1;
  const discriminant=dot*dot-quad*outside;
  if(discriminant<0||quad<1e-8)return null;
  const fraction=outside<=0?0:(-dot-Math.sqrt(discriminant))/quad;
  if(fraction<0||fraction>1)return null;
  const center=a.clone().lerp(b,fraction);
  const localX=clamp(center.x-pose.x,-w*.91,w*.91);
  const localY=clamp(center.y-y,-h*.87,h*.87);
  const forward=Math.sqrt(Math.max(.06,1-(localX/w)**2-(localY/h)**2));
  const contact=v3(pose.x+localX,y+localY,centerZ+d*forward);
  const normal=v3(localX/(w*w)*.34,localY/(h*h)*.24,forward/d).normalize();
  const quality=1-clamp(Math.hypot(localX/w,localY/h)*.8,0,1);
  return {fraction,center,contact,normal,quality,region,patchX:localX,patchY:localY};
}

export function boothCollision(a,b,radius,round,time,seed){
  let closest=null;
  for(let i=0;i<volunteers.length;i++){
    if(Math.abs(b.z+round.distance+i*1.15)>radius*1.4+.51)continue;
    const pose=volunteerPose(round,i,time);
    if(Math.abs(b.x-pose.x)>radius+.53)continue;
    for(const region of ['head','torso']){
      const hit=hitRegion(a,b,radius,pose,region);
      if(!hit||(closest&&closest.fraction<=hit.fraction))continue;
      const toss=(seed>>>((i+3)*2))&7;
      closest={...hit,onBoard:false,volunteer:i,volunteerName:volunteers[i].name,
        reaction:{hand:toss%2?-1:1,direction:hit.patchX<0?1:-1,lean:.81+toss*.081}};
    }
  }
  return closest;
}
