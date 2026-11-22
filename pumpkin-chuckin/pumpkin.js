import { THREE, v3, clamp, lerp, random, TAU, mesh, surface, groundHeight } from './field.js';
import { defaultProduce } from './produce.js';
import { fruitPoint, fruitTint, fruitProfile, fruitNeedsDetail, buildFruitDetails } from './fruit-models.js';
import { vegetablePoint, vegetableTint, vegetableProfile, buildVegetableDetails } from './vegetable-models.js';

const HALF = Math.PI / 2;
const segmentRows = 3;
const segmentColumns = 8;
const rindRadius = .665;
export const pumpkinRadius = .65;

export function skinPoint(theta, phi, inset = 0, produce = defaultProduce) {
  const modeled=produce.category==='fruit'?fruitPoint(produce,theta,phi,inset):vegetablePoint(produce,theta,phi,inset);
  if(modeled)return modeled;
  if(produce.shape!=='pumpkin'){
    const u=Math.cos(theta), s=Math.sin(theta);
    let r=s,y=u,bend=0;
    const wave=(frequency,phase=0)=>Math.cos(phi*frequency+phase);
    switch(produce.shape){
      case 'apple': r*=1+.12*u; y*=1-.18*Math.abs(u)**9; r*=1+.054*wave(5)*u*u;break;
      case 'pear': r*=.95-.41*u; y*=1+.08*u; break;
      case 'peach': r*=1+.09*u; y*=1-.09*Math.abs(u)**8; r*=1-.087*Math.max(0,wave(1))**18; break;
      case 'plum': r*=.93-.15*u; r*=1-.115*Math.max(0,wave(1))**20; break;
      case 'cherry': r*=.96+.19*u; y*=1-.18*Math.max(0,u)**7; break;
      case 'citrus': r*=1-.06*u*u; y*=1+.10*Math.abs(u)**10; break;
      case 'coconut': r*=.94-.16*u+.045*wave(3); bend=.046*u; break;
      case 'banana': r*=.55*(1-.20*u)*(1+.08*wave(5)); bend=.72*u*u-.30; y*=1.04; break;
      case 'strawberry': r*=.90+.47*u; y*=1+.10*Math.max(0,-u); break;
      case 'grape': r*=.86+.27*u; r*=1+.21*wave(6,theta*6)*Math.sin(theta*9)**2; break;
      case 'berry': r*=1+.107*wave(9,theta*3)+.115*Math.cos(theta*21)*wave(10,theta*5); break;
      case 'pineapple': r=s**.54*(.91+.075*Math.cos(theta*14)*wave(10,theta*3)); y*=.97; break;
      case 'spiny': r*=.95-.08*u+.17*Math.max(0,wave(13,theta*8)*Math.cos(theta*30))**2; break;
      case 'star': r*=.73+.31*wave(5); r*=1+.06*u; break;
      case 'root': r*=.80+.65*u; y*=1+.14*Math.max(0,-u); bend=.11*u*u; break;
      case 'tuber': r*=1+.08*wave(3,theta*4)+.07*wave(5,theta*5); bend=.10*Math.sin(theta*4); break;
      case 'onion': r*=1-.30*u; y*=1+.17*Math.max(0,u)**3; break;
      case 'garlic': r*=.88-.28*u+.12*wave(7); y*=1+.23*Math.max(0,u)**3; break;
      case 'pepper': r*=.88+.24*u+.115*wave(4); y*=1-.11*Math.abs(u)**9; break;
      case 'chili': r*=.53+.39*u; bend=.62*Math.max(0,-u)**1.65-.19; y*=1.08; break;
      case 'eggplant': r*=.94-.31*u; bend=.18*u*u-.03; break;
      case 'gourd': r*=.82-.15*u+.24*Math.cos((u+.47)*5); break;
      case 'cuke': r=s**.64*(.80+.055*Math.sin(theta*13)+.037*wave(6)); break;
      case 'leafy': r*=1+.10*wave(8,theta*7)+.065*Math.sin(theta*33)*wave(11); break;
      case 'greens': r*=.80+.35*u+.17*wave(7,theta*9); y*=1.12; break;
      case 'broccoli': r*=1.06+.12*u+.12*wave(8,theta*12)*Math.sin(theta*15); y=.86*u+.15; break;
      case 'corn': r=s**.61*(.71+.075*Math.cos(theta*30)*wave(14)); break;
      case 'stalk': r=s**.41*(.58-.16*u+.05*wave(6)); y*=1.12;break;
      case 'pod': r*=.61+.10*Math.cos(theta*16); bend=.43*u*u-.14; break;
      case 'scaly': r*=1+.10*wave(9,theta*7)*Math.cos(theta*21)+.10*u; break;
    }
    const width=(rindRadius-inset)*r;
    return v3(Math.cos(phi)*width+bend*.48,y*(.525-inset*.70),Math.sin(phi)*width);
  }
  const sinus = Math.sin(theta);
  const rib = Math.cos(phi*10 + Math.sin(theta*3.1)*.33);
  const grooves = Math.pow((1-rib)*.5,4.3);
  const oval = 1 + .046*Math.cos(phi*2+.51) + .021*Math.sin(phi*3-.58);
  const r = (rindRadius - inset) * sinus * oval * (1+.042*rib-.077*grooves);
  const y = (.525 - inset*.7) * Math.cos(theta) * (1-.17*Math.pow(Math.abs(Math.cos(theta)),8));
  return v3(Math.cos(phi)*r,y + .027*Math.sin(phi*3+.71)*sinus,Math.sin(phi)*r);
}

function skinColor(theta,phi,produce,colors) {
  if(produce.id!==defaultProduce.id){
    const modeled=produce.category==='fruit'?fruitTint(produce,theta,phi,colors):vegetableTint(produce,theta,phi,colors);
    if(modeled)return modeled;
    const texture=Math.sin(theta*16+phi*4)*Math.sin(phi*11-theta*9);
    const pattern=produce.body.pattern;
    const wave=(n,t,b=0)=>Math.cos(phi*n+theta*t+b);
    let tint=.14+.11*texture;
    if(pattern==='blush'||pattern==='seam')tint=clamp(.35+.33*wave(2,2)+.21*texture,0,.86);
    if(pattern==='bands')tint=clamp(.50+.66*wave(9,0,Math.sin(theta*11)*.63)+.15*texture,0,1);
    if(pattern==='ridges'||pattern==='fiber'||pattern==='pumpkin')tint=.30+.29*wave(pattern==='pumpkin'?10:7,1)+.16*texture;
    if(pattern==='freckle'||pattern==='eyes')tint=.09+.75*Math.max(0,wave(24,21)*Math.cos(theta*63))**5;
    if(pattern==='pips')tint=.05+.82*Math.max(0,wave(23,13)*Math.cos(theta*39))**10;
    if(pattern==='net'||pattern==='veins'||pattern==='diamond'||pattern==='kernels'){
      const cell=wave(pattern==='net'?22:14,14)*wave(pattern==='veins'?13:19,-20);
      tint=.18+.50*Math.abs(cell)**3;
    }
    if(pattern==='cluster'||pattern==='spines')tint=.25+.25*wave(11,7)*Math.cos(theta*32);
    if(pattern==='rings'||pattern==='pods')tint=.24+.23*Math.cos(theta*49);
    return colors.skin.clone().lerp(colors.accent,clamp(tint,0,1)).multiplyScalar(.86+.19*Math.sin(theta)+texture*.065);
  }
  const ribs = Math.pow(.5-.5*Math.cos(phi*10+Math.sin(theta*3.1)*.33),6);
  const shoulder = Math.pow(Math.abs(Math.cos(theta)),8);
  const mottles = Math.sin(phi*9+theta*8)*Math.sin(theta*13-phi*5);
  return new THREE.Color().setRGB(.97-ribs*.105-shoulder*.21+mottles*.022,.92-ribs*.16-shoulder*.27+mottles*.043,.83-ribs*.18-shoulder*.32+mottles*.043);
}

function skinGeometry(rows,columns,produce,colorsByRole) {
  const positions=[],colors=[],uv=[],indices=[];
  for(let y=0;y<=rows;y++){
    for(let x=0;x<=columns;x++){
      const theta = lerp(.001,Math.PI-.001,y/rows), phi=x/columns*TAU;
      positions.push(...skinPoint(theta,phi,0,produce));
      const c=skinColor(theta,phi,produce,colorsByRole);colors.push(c.r,c.g,c.b);
      uv.push(x/columns,1-y/rows);
      if(y===0||x===0)continue;
      const d=y*(columns+1)+x,cIndex=d-1,b=d-columns-1,a=b-1;
      indices.push(a,b,cIndex,b,d,cIndex);
    }
  }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  geo.setIndex(indices);geo.computeVertexNormals();
  return geo;
}

function curvedStem() {
  const geo=new THREE.CylinderGeometry(.047,.101,.31,13,10);
  const points=geo.attributes.position;
  for(let i=0;i<points.count;i++){
    const x=points.getX(i),y=points.getY(i),z=points.getZ(i), t=(y+.155)/.31;
    const ridges=1+.18*Math.cos(Math.atan2(z,x)*6+.45*t);
    points.setXYZ(i,x*ridges+.10*t*t,y,z*ridges+.05*t);
  }
  geo.computeVertexNormals();
  return geo;
}

function fractureGeometry(row,column,produce,colorsByRole) {
  const edgeCount=8;
  const positions=[],colors=[],uv=[],indices=[];
  const geo=new THREE.BufferGeometry();
  const groupStart = material => ({start:indices.length,material});
  const finish = group => geo.addGroup(group.start,indices.length-group.start,group.material);
  const pivot=skinPoint((row+.5)/segmentRows*Math.PI,(column+.5)/segmentColumns*TAU,.041,produce);
  function angles(u,v){
    const p=(column+u)*TAU/segmentColumns;
    const t=(row+v)*Math.PI/segmentRows;
    const envelope=Math.sin(t);
    const jaggedT=(.088*Math.sin(p*17 + row*1.86+v*1.86)+.042*Math.sin(p*31 + (row+v)*.63))*envelope;
    const jaggedP=(.077*Math.sin(t*12+(column+u)*.72)+.033*Math.sin(t*36-(column+u)*.71))*envelope;
    return [clamp(t+jaggedT,.004,Math.PI-.004),p+jaggedP];
  }
  function append(u,v,depth,outer) {
    const [t,p]=angles(u,v);
    const uneven = depth ? .022*(.5+.5*Math.sin(t*41+p*23))*Math.sin(t) : 0;
    const local=skinPoint(t,p,depth+uneven,produce).sub(pivot);
    positions.push(...local);uv.push(p/TAU,1-t/Math.PI);
    const tint=outer ? skinColor(t,p,produce,colorsByRole) : new THREE.Color().setRGB(.92,.81+.15*Math.sin(t*34+p*48)**2,.76+.22*Math.sin(t*15-p*19)**2);
    colors.push(tint.r,tint.g,tint.b);
    return positions.length/3-1;
  }
  function grid(outer, depth) {
    const group=groupStart(outer?0:1);
    const start=positions.length/3;
    for(let v=0;v<=edgeCount;v++)for(let u=0;u<=edgeCount;u++)append(u/edgeCount,v/edgeCount,depth,outer);
    const stride=edgeCount+1;
    for(let v=0;v<edgeCount;v++)for(let u=0;u<edgeCount;u++){
      const a=start+v*stride+u,b=a+1,c=a+stride,d=c+1;
      if(outer)indices.push(a,b,c,b,d,c);
      else indices.push(a,c,b,b,c,d);
    }
    finish(group);
  }
  grid(true,0);grid(false,.11);
  const edgeGroup=groupStart(2);
  for(const edge of [t=>[t,0],t=>[1,t],t=>[1-t,1],t=>[0,1-t]]){
    for(let i=0;i<edgeCount;i++){
      const start=edge(i/edgeCount),end=edge((i+1)/edgeCount);
      const a=append(...start,0,false), b=append(...end,0,false), c=append(...start,.11,false), d=append(...end,.11,false);
      indices.push(a,c,b,b,c,d);
    }
  }
  finish(edgeGroup);
  geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  geo.setIndex(indices);geo.computeVertexNormals();
  return {geo,pivot};
}

export function makePumpkin(scene, skinMap) {
  const outer = new THREE.MeshPhysicalMaterial({ ...skinMap, vertexColors:true, roughness:.42, clearcoat:.48, clearcoatRoughness:.32, bumpScale:.085 });
  const inner = new THREE.MeshPhysicalMaterial({ color:'#f89e48', bumpMap:skinMap.bumpMap, bumpScale:.035, vertexColors:true, roughness:.29, clearcoat:.66, clearcoatRoughness:.17, side:THREE.DoubleSide });
  const flesh = new THREE.MeshPhysicalMaterial({ color:'#ffd17e', bumpMap:skinMap.bumpMap, bumpScale:.030, vertexColors:true, roughness:.46, clearcoat:.34, side:THREE.DoubleSide });
  const stem = surface('#777341',{ ...skinMap, bumpScale:.045, vertexColors:false });
  const detailSurface=new THREE.MeshPhysicalMaterial({vertexColors:true,roughness:.44,clearcoat:.24,side:THREE.DoubleSide});
  stem.map = null;
  const root = new THREE.Group();
  const stemGeo=curvedStem();
  const stemMesh=mesh(root,stemGeo,stem,0,.54,0);
  const leafGeometry=new THREE.SphereGeometry(1,14,8);
  const leaves=Array.from({length:9},()=>mesh(root,leafGeometry,stem));
  scene.add(root);
  const models=new Map();
  function getModel(produce){
    const cached=models.get(produce.id);
    if(cached){
      models.delete(produce.id);
      models.set(produce.id,cached);
      return cached;
    }
    const colors={skin:new THREE.Color(produce.skin),accent:new THREE.Color(produce.accent)};
    const pointAt=(theta,phi)=>skinPoint(theta,phi,0,produce);
    const details=produce.category==='fruit'?buildFruitDetails(produce,pointAt):buildVegetableDetails(produce,pointAt);
    const fine=fruitNeedsDetail(produce);
    const detail=produce.id===defaultProduce.id || ['spiny','pineapple','berry','corn','leafy'].includes(produce.shape);
    const skin=details?.clustered?null:skinGeometry(fine?64:detail?55:40,fine?112:detail?100:72,produce,colors);
    const fractures=[];
    if(skin)for(let row=0;row<segmentRows;row++)for(let column=0;column<segmentColumns;column++){
      fractures.push(fractureGeometry(row,column,produce,colors));
    }
    if(details?.clustered)details.geometry.computeBoundingBox();
    const model={skin,fractures,details};
    models.set(produce.id,model);
    return model;
  }
  const originalShell=getModel(defaultProduce).skin;
  const skinMesh=mesh(root,originalShell,outer);
  const detailMesh=mesh(root,originalShell,detailSurface);
  const fruit={root,outer,inner,flesh,stem,stemGeo,detailSurface,select(produce){
    const original=produce.id===defaultProduce.id;
    const model=getModel(produce);
    fruit.produce=produce;
    fruit.fractures=model.fractures;
    fruit.clusterPieces=model.details?.pieces||[];
    fruit.seatLift=model.details?.clustered?Math.max(0,-model.details.geometry.boundingBox.min.y-.53)*produce.scale[1]:0;
    root.scale.set(...produce.scale);
    skinMesh.visible=Boolean(model.skin);
    skinMesh.geometry=model.skin||originalShell;
    detailMesh.visible=Boolean(model.details);
    detailMesh.geometry=model.details?.geometry||originalShell;
    outer.map=original?skinMap.map:skinMap.bumpMap;
    const profile=fruitProfile(produce);
    const coarse=['coconut','kiwi','cantaloupe','rambutan','durian','jackfruit','breadfruit','soursop','lychee'].includes(profile) ||
      ['tuber','root','garlic','scaly'].includes(vegetableProfile(produce));
    outer.roughness=coarse?.73:original?.42:.37;
    outer.clearcoat=coarse?.10:original?.48:.52;
    detailSurface.roughness=coarse||['leafHead','florets','spears'].includes(vegetableProfile(produce))?.69:.44;
    inner.color.set(original?'#f89e48':produce.flesh);
    flesh.color.set(original?'#ffd17e':produce.flesh).lerp(new THREE.Color('#fff1ce'),original?0:.28);
    const accent=produce.body.accent;
    stem.color.set(accent==='leaf'||accent==='crown'||accent==='husk'||accent==='sprigs'||accent==='stalk'?'#628148':'#777341');
    const customStem=model.details?.customStem||profile==='banana';
    stemMesh.visible=!customStem&&(accent==='stem'||accent==='tip'||accent==='stalk');
    stemMesh.position.set(accent==='tip'&&produce.shape==='banana'?.20:0,accent==='stalk'?-.39:original?.54:.50,0);
    stemMesh.rotation.set(0,0,accent==='stalk'?Math.PI:0);
    stemMesh.scale.setScalar(accent==='stalk'?1.65:original?1:accent==='tip'?.54:.69);
    fruit.stemMesh=stemMesh;
    const count=customStem?0:accent==='crown'?9:accent==='sprigs'?7:accent==='leaf'?5:accent==='husk'?4:0;
    leaves.forEach((leaf,i)=>{
      leaf.visible=i<count;
      if(i>=count)return;
      const angle=i*TAU/count;
      const length=accent==='crown'?.45+i%3*.11:accent==='sprigs'?.31+i%3*.10:accent==='husk'?.48:.17;
      const spread=accent==='leaf'?.18:accent==='husk'?.26:.13;
      leaf.position.set(Math.cos(angle)*spread,accent==='husk'?-.20:.51+length*.36,Math.sin(angle)*spread);
      leaf.scale.set(accent==='husk'?.20:.080,length,accent==='husk'?.042:.032);
      leaf.rotation.set(Math.sin(angle)*.4,angle,Math.cos(angle)*(accent==='leaf'?1.22:.42));
    });
    if(models.size>5){
      const oldest=[...models.keys()].find(id=>id!==defaultProduce.id&&id!==produce.id);
      const expired=models.get(oldest);
      expired.skin?.dispose();
      for(const part of expired.fractures)part.geo.dispose();
      expired.details?.geometry.dispose();
      if(expired.details)for(const part of expired.details.pieces)part.geometry.dispose();
      models.delete(oldest);
    }
  }};
  fruit.select(defaultProduce);
  return fruit;
}

function smearMap(seed,produce) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext('2d');
  const rng = random(seed);
  const colorful=produce.id!==defaultProduce.id;
  const pulps=colorful?[produce.skin+'c9',produce.flesh+'d5',produce.accent+'d6',produce.flesh+'ce',produce.skin+'ae',produce.flesh+'ec']:['#bc561fc9','#ec7934d5','#db6d28d6','#ed9b44ce','#a94317ae','#fbab55ec'];
  const drops=colorful?[produce.flesh+'ef',produce.accent+'d5',produce.skin+'c5',produce.flesh+'e4']:['#fa9337ef','#f5ae55d5','#e47a27c5','#ffd078e4'];
  const streaks=colorful?[produce.flesh+'b9',produce.accent+'be']:['#ffda8ab9','#a83d18be'];
  for(let i=0;i<95;i++){
    const angle=rng()*TAU,burst=Math.pow(rng(),1.8);
    const x=256+Math.cos(angle)*burst*170,y=256+Math.sin(angle)*burst*168;
    const r=2+rng()*(51-29*burst);
    ctx.fillStyle=pulps[i%pulps.length];
    ctx.beginPath();ctx.ellipse(x,y,r,r*(.32+rng()*.64),angle,0,TAU);ctx.fill();
  }
  for(let i=0;i<165;i++){
    const angle=rng()*TAU,r=29+Math.pow(rng(),.8)*205;
    const x=256+Math.cos(angle)*r,y=256+Math.sin(angle)*r;
    ctx.fillStyle=drops[i%drops.length];
    const w=(1.3+rng()*5.3)*(1.14-r/275);
    ctx.beginPath();ctx.ellipse(x,y,w*(1.5+rng()*6.3),w,angle,0,TAU);ctx.fill();
  }
  for(let i=0;i<64;i++){
    const a=rng()*TAU,r=18+rng()*101,w=2+rng()*5;
    const x=256+Math.cos(a)*r,y=256+Math.sin(a)*r;
    ctx.strokeStyle=streaks[i%3===0?0:1];
    ctx.lineWidth=1+rng()*2;
    ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+w,y-w,x+w*2.4,y+w*2);ctx.stroke();
  }
  const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;
  return tex;
}

function addSmear(scene,target,hit,power,seed,produce,patch) {
  const tex=smearMap(seed+311,produce);
  if(patch){
    const width=clamp((.37+power*.015)*lerp(.65,1,Math.min(produce.style.pulp,1)),.29,hit.region==='head'?.52:.75);
    const decal=new THREE.PlaneGeometry(width,width);
    const offsets=hit.region==='head'?.35:.54;
    const ctx=tex.image.getContext('2d');
    const side=tex.image.width;
    ctx.globalCompositeOperation='destination-in';
    ctx.beginPath();
    ctx.ellipse(side*(.5-hit.patchX*offsets/width),side*(.5+hit.patchY*offsets/width),
      side*(hit.region==='head'?.191:.346)/width,side*(hit.region==='head'?.221:.358)/width,0,0,TAU);
    ctx.fill();tex.needsUpdate=true;
    return mesh(patch,decal,surface('#ffffff',{map:tex,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,roughness:.92}),
      hit.patchX*offsets,hit.patchY*offsets,.017+(seed>>>0)%256*.00013,false);
  }
  const width=clamp((.65+power*.081)*lerp(.56,1,Math.min(produce.style.pulp,1)),.80,3.85);
  const g=new THREE.PlaneGeometry(width,width);
  if(hit.onBoard){
    // Clip the decal to the circular face while leaving its clear outer edges intact.
    const localX=hit.contact.x-hit.boardX;
    const localY=hit.contact.y-hit.boardY;
    const ctx=tex.image.getContext('2d');
    const canvasSize=tex.image.width;
    ctx.globalCompositeOperation='destination-in';
    ctx.beginPath();
    ctx.arc(canvasSize*(.5-localX/width),canvasSize*(.5+localY/width),canvasSize*(target.radius-.022)/width,0,TAU);
    ctx.fill();tex.needsUpdate=true;
    return mesh(target.board,g,surface('#ffffff',{map:tex,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,roughness:.72}),localX,localY,.138+(seed%256)*.000014,false);
  }
  const n=24;
  const floor=new THREE.PlaneGeometry(width*1.1,width*.76,n,n);
  floor.rotateX(-HALF);
  const vertices=floor.attributes.position;
  for(let i=0;i<vertices.count;i++)vertices.setY(i,groundHeight(hit.contact.x+vertices.getX(i),hit.contact.z+vertices.getZ(i))+.035);
  floor.computeVertexNormals();g.dispose();
  const mark=mesh(scene,floor,surface('#b99b73',{map:tex,transparent:true,depthWrite:false,roughness:.86}),hit.contact.x,0,hit.contact.z,false);
  return mark;
}

export function clearSmear(mark) {
  mark.removeFromParent();
  mark.geometry.dispose();mark.material.map.dispose();mark.material.dispose();
}

function particleBanks(mobile,produce) {
  const detail=mobile ? 0 : 1;
  const sweet=new THREE.MeshPhysicalMaterial({color:'#ffffff',roughness:.32,clearcoat:.72,clearcoatRoughness:.18});
  const seed=surface('#ffffff',{roughness:.43});
  const rind=surface('#ffffff',{roughness:.59});
  const {skin,flesh,accent,style}=produce;
  const original=produce.id===defaultProduce.id;
  const seedColors=['#e9d5a7','#ffe7b5','#eee2c4','#d4af73'];
  if(['watermelon','papaya','dragon-fruit','passion-fruit'].includes(produce.id))seedColors.splice(0,4,'#302425','#362929','#55413a','#443934');
  return [
    {geo:new THREE.IcosahedronGeometry(1,detail),mat:sweet,count:Math.round((mobile?137:222)*style.pulp),colors:original?['#e77924','#ffac53','#f68b33','#ffb753','#ef6b1b']:[skin,flesh,flesh,accent],min:.013,max:.086,drag:1.2,stretch:.9},
    {geo:new THREE.SphereGeometry(1,9,5),mat:seed,count:Math.round((mobile?36:59)*style.seeds),colors:seedColors,min:.044,max:.063,drag:.39,seed:true},
    {geo:new THREE.IcosahedronGeometry(1,0),mat:rind,count:Math.round((mobile?30:53)*style.chips),colors:original?['#ec8534','#c65517','#ffa153','#ebb05c']:[skin,accent,flesh],min:.043,max:.176,drag:.64,chip:true}
  ].map(pack=>({...pack, colors:pack.colors.map(c=>new THREE.Color(c))}));
}

function makePlume(scene, hit, rng, mobile, produce) {
  const canvas = document.createElement('canvas');
  canvas.width=canvas.height=96;
  const ctx=canvas.getContext('2d');
  const glow=ctx.createRadialGradient(48,48,0,48,48,47);
  glow.addColorStop(0,'rgba(255,226,177,.49)');glow.addColorStop(.32,'rgba(242,193,141,.31)');glow.addColorStop(1,'rgba(241,162,88,0)');
  ctx.fillStyle=glow;ctx.fillRect(0,0,96,96);
  const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;
  const sprites=[];
  const tint=produce.id===defaultProduce.id?0xffaa66:produce.flesh;
  const upright=hit.onBoard||hit.volunteer!==undefined;
  for(let i=0;i<Math.round((mobile?12:19)*produce.style.dust);i++){
    const mat=new THREE.SpriteMaterial({ map:tex,transparent:true,depthWrite:false,color:upright?tint:0xbe9f6e });
    const item=new THREE.Sprite(mat);
    item.position.copy(hit.contact);item.scale.setScalar(.18+rng()*.24);mat.opacity=0;
    scene.add(item);
    sprites.push({item,vel:v3((rng()-.5)*8,rng()*4+1,(rng()-.32)*7),life:.36+rng()*.71,delay:rng()*.12});
  }
  return {sprites,tex};
}

export function prepareImpact(scene,target,hit,rotation,pumpkin,seed,mobile,canvasOnly,patch=null) {
  const rng=random(seed);
  const produce=pumpkin.produce, style=produce.style, size=pumpkin.root.scale;
  const speed=hit.velocity.length();
  const energy=clamp(speed/22,.66,1.45)*(patch?.85:1);
  const normal=hit.normal||(hit.onBoard?v3(0,0,1):v3(0,1,0));
  const surfaceSound=hit.onBoard?'wood':patch?'cloth':'soil';
  const upright=hit.onBoard||Boolean(patch);
  const tangent=hit.velocity.clone().addScaledVector(normal,-hit.velocity.dot(normal));
  const splashOrigin=hit.contact.clone().addScaledVector(normal,.178);
  const rigid=[];
  const debris=new THREE.Group();
  debris.visible=false;
  scene.add(debris);
  const clustered=pumpkin.clusterPieces.length>0;
  const pieces=clustered?pumpkin.clusterPieces:pumpkin.fractures;
  for(const [index,part] of pieces.entries()){
    const piece=mesh(debris,clustered?part.geometry:part.geo,clustered?pumpkin.detailSurface:[pumpkin.outer,pumpkin.inner,pumpkin.flesh],0,0,0,!mobile);
    piece.scale.copy(size);
    const offset=(clustered?part.position:part.pivot).clone().multiply(size).applyQuaternion(rotation);
    piece.position.copy(hit.center).add(offset);
    if(upright)piece.position.z=Math.max(piece.position.z,hit.contact.z+.10);
    piece.quaternion.copy(rotation);
    const velocity=offset.clone().normalize().multiplyScalar((3.9+rng()*6.7)*energy*style.spread)
      .addScaledVector(normal,(2+rng()*4.1)*energy)
      .addScaledVector(tangent,.29+rng()*.10);
    velocity.y+=.7+rng()*2.2;
    const radius=clustered?part.radius*Math.max(size.x,size.z):.12+index%3*.036;
    const form=clustered?part.form:'rind';
    rigid.push({piece,vel:velocity,spin:v3((rng()-.5)*10,(rng()-.5)*13,(rng()-.5)*12),radius,form,tint:part.color,
      audio:{type:form,size:radius,seed:(seed+index*247)>>>0,left:2}});
  }
  if(pumpkin.stemMesh.visible){
    const stem=mesh(debris,pumpkin.stemGeo,pumpkin.stem,0,0,0,false);
    stem.position.copy(pumpkin.stemMesh.position).multiply(size).applyQuaternion(rotation).add(hit.center);
    stem.scale.copy(pumpkin.stemMesh.scale).multiply(size);
    stem.quaternion.copy(rotation).multiply(pumpkin.stemMesh.quaternion);
    rigid.push({piece:stem,vel:normal.clone().multiplyScalar(6.1).addScaledVector(tangent,.37).add(v3(1.1,5.8,.1)),spin:v3(-8,10,4),radius:.115,
      audio:{type:'stalk',size:.115,seed:(seed+17)>>>0,left:1}});
  }

  const strands = [];
  const strandGeo = new THREE.SphereGeometry(1,10,6);
  for(let i=0;i<Math.round((mobile?11:19)*style.pulp);i++){
    const part=mesh(debris,strandGeo,pumpkin.flesh,0,0,0,false);
    const vel=v3((rng()-.5)*11,rng()*7,(rng()-.5)*8).multiplyScalar(energy).addScaledVector(normal,2+rng()*2.9).addScaledVector(tangent,.38);
    part.position.copy(splashOrigin);
    strands.push({part,vel,width:.019+rng()*.024,length:.16+rng()*.64,spin:(rng()-.5)*8,life:.37+rng()*.72});
  }

  const dummy=new THREE.Object3D();
  const banks=particleBanks(mobile||canvasOnly,produce).map(bank=>{
    const batch=new THREE.InstancedMesh(bank.geo,bank.mat,bank.count);
    batch.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    batch.frustumCulled=false;
    const particles=Array.from({length:bank.count},(_,i)=>{
      const direction=v3(rng()-.5,rng()-.36,rng()-.5).normalize();
      if(upright) direction.z=Math.abs(direction.z)*.65;
      const spread=(3+Math.pow(rng(),2.0)*14)*energy*style.spread;
      const vel=direction.multiplyScalar(spread).addScaledVector(tangent,.33+rng()*.36).addScaledVector(normal,(bank.seed?2.5:1.3)+rng()*6*energy);
      const position=splashOrigin.clone().add(v3((rng()-.5)*.43,(rng()-.5)*.35,(rng()-.5)*.29));
      const size=lerp(bank.min,bank.max,Math.pow(rng(),1.6));
      batch.setColorAt(i,bank.colors[i%bank.colors.length]);
      const type=bank.seed?'seed':bank.chip?'chip':'pulp';
      const audio=i%(bank.seed?5:bank.chip?7:12)===0?{type,size,seed:(seed+193+i*277)>>>0,left:1}:null;
      return {position,vel,size,angle:rng()*TAU,spin:(rng()-.5)*20,flick:rng()*.55,bounces:0,audio};
    });
    debris.add(batch);
    return {...bank,batch,particles};
  });
  const mist=makePlume(debris,hit,rng,mobile,produce);
  const mark=addSmear(scene,target,hit,speed,seed,produce,patch);
  mark.visible=false;
  let age=0;
  const up=v3(0,1,0), scratch=v3(), zero=v3(0,0,0);
  const heard=[];
  const soundprint={rindLength:rigid.reduce((sum,item)=>sum+item.radius,0)/4.5,
    whole:clustered?rigid.length:0,pulp:banks[0].count};

  function record(audio,material,speed,pos){
    if(!audio||!audio.left||speed<.76||heard.length>=22)return;
    audio.left--;
    heard.push({type:audio.type,size:audio.size,seed:audio.seed+audio.left*607,material,speed,x:pos.x});
  }

  function advance(pos,vel,dt,radius,drag,bounce,audio){
    vel.multiplyScalar(Math.exp(-drag*dt));
    vel.y-=9.81*dt;
    pos.addScaledVector(vel,dt);
    if(upright && pos.z<hit.contact.z+radius && pos.z>hit.contact.z-.48 && vel.z<0 &&
      (patch?Math.hypot(pos.x-hit.contact.x,pos.y-hit.contact.y)<.44:
        Math.hypot(pos.x-hit.boardX,pos.y-hit.boardY)<target.radius)){
      record(audio,surfaceSound,-vel.z,pos);
      pos.z=hit.contact.z+radius;
      vel.z*=patch?-.15:-.39;
      vel.multiplyScalar(.83);
    }
    const ground=groundHeight(pos.x,pos.z)+radius;
    if(pos.y>ground || vel.y>=0)return false;
    record(audio,'soil',-vel.y,pos);
    pos.y=ground;vel.y=Math.abs(vel.y)*bounce;
    vel.x*=.69;vel.z*=.69;
    if(Math.abs(vel.y)<.27)vel.y=0;
    return true;
  }

  return {
    mark,
    soundprint,
    takeSounds(){
      if(!heard.length)return heard;
      const impacts=heard.splice(0);
      impacts.sort((a,b)=>b.speed*Math.sqrt(b.size)-a.speed*Math.sqrt(a.size));
      return impacts;
    },
    textures: [mark.material.map,mist.tex],
    preview: { rigid,banks,sprites:mist.sprites,produce },
    setVisible(visible){
      debris.visible=visible;
      mark.visible=visible;
    },
    update(dt){
      age+=dt;
      for(const obj of rigid){
        const {piece,vel,spin,radius,form,audio}=obj;
        const onSurface=advance(piece.position,vel,dt,form==='leaf'?Math.min(radius,.11):radius,style.drag,style.bounce,audio);
        if(onSurface)spin.multiplyScalar(.77);
        piece.rotateX(spin.x*dt);piece.rotateY(spin.y*dt);piece.rotateZ(spin.z*dt);
      }
      for(const {part,vel,width,length,spin,life} of strands){
        part.visible=age<life;
        if(!part.visible)continue;
        advance(part.position,vel,dt,.06,1.4,.12);
        scratch.copy(vel).normalize();
        if(scratch.lengthSq()>.01)part.quaternion.setFromUnitVectors(up,scratch);
        part.rotateZ(spin*age*.19);
        const fade=clamp(1-age/life,.05,1);
        part.scale.set(width*fade,length*fade*(.77+.46*Math.sin(age*31)),width*fade);
      }
      for(const bank of banks){
        for(const p of bank.particles){
          if(p.bounces<=3&&advance(p.position,p.vel,dt,p.size*.51,bank.drag,bank.seed?.38:.22,p.audio))p.bounces++;
          p.angle+=dt*p.spin;
        }
      }
      for(const {item,vel,life,delay} of mist.sprites){
        const localAge=age-delay;
        item.visible=localAge>0&&localAge<life;
        if(!item.visible)continue;
        item.position.addScaledVector(vel,dt*.62);
        vel.multiplyScalar(Math.exp(-2*dt));
        item.scale.addScalar(dt*1.51);
        item.material.opacity=Math.sin(clamp(localAge/life,0,1)*Math.PI)*(upright?.59:.80);
      }
    },
    syncParticles(){
      if(canvasOnly)return;
      for(const bank of banks){
        bank.particles.forEach((p,i)=>{
          dummy.position.copy(p.position);
          dummy.rotation.set(p.angle,p.angle*.51,p.angle*.38);
          if(bank.seed)dummy.scale.set(p.size*.61,p.size*1.42,p.size*.22);
          else if(bank.chip)dummy.scale.set(p.size*.46,p.size*1.1,p.size*.23);
          else {
            scratch.copy(p.vel).normalize();
            if(scratch.lengthSq()>.01)dummy.quaternion.setFromUnitVectors(up,scratch);
            dummy.scale.set(p.size,p.size*(1+clamp(p.vel.length()*.09,0,2.1))*bank.stretch,p.size*.72);
            if(p.bounces>1&&!bank.chip)dummy.scale.multiplyScalar(clamp(1-(age-.41-p.flick)*1.7,0,1));
          }
          if(!bank.seed&&!bank.chip&&p.bounces>3)dummy.scale.copy(zero);
          dummy.updateMatrix();
          bank.batch.setMatrixAt(i,dummy.matrix);
        });
        bank.batch.instanceMatrix.needsUpdate=true;
      }
    },
    disposeDebris(){
      debris.removeFromParent();strandGeo.dispose();
      for(const bank of banks){bank.batch.removeFromParent();bank.batch.dispose();bank.geo.dispose();bank.mat.dispose();}
      for(const {item} of mist.sprites){item.removeFromParent();item.material.dispose();}
      mist.tex.dispose();
    }
  };
}
