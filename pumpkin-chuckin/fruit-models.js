import { THREE, v3, clamp, lerp, random, TAU } from './field.js';

const fruitProfiles = {
  lemon:'lemon', lime:'lime', kumquat:'kumquat', banana:'banana', plantain:'banana',
  apple:'apple', 'green-apple':'apple', 'asian-pear':'asianPear', pear:'pear',
  avocado:'avocado', papaya:'papaya', guava:'guava', quince:'quince', fig:'fig',
  peach:'peach', 'white-peach':'peach', nectarine:'peach', apricot:'apricot', mango:'mango',
  pomegranate:'pomegranate', persimmon:'persimmon', mangosteen:'mangosteen', blueberry:'blueberry',
  coconut:'coconut', kiwifruit:'kiwi', 'golden-kiwi':'goldenKiwi', watermelon:'watermelon',
  cantaloupe:'cantaloupe', honeydew:'honeydew', pineapple:'pineapple', strawberry:'strawberry',
  'dragon-fruit':'dragon', durian:'durian', jackfruit:'jackfruit', rambutan:'rambutan',
  lychee:'lychee', 'star-fruit':'star', breadfruit:'breadfruit', soursop:'soursop'
};
const citrus = new Set(['orange','blood-orange','clementine','mandarin','grapefruit','pomelo']);
const denseSurface = new Set(['avocado','cantaloupe','strawberry','pineapple','durian','jackfruit','lychee','breadfruit','soursop']);
const offsets = ['#dfbc72','#794529','#704826'].map(color=>new THREE.Color(color));
const stemGreen = new THREE.Color('#648345');
const calyxGreen = new THREE.Color('#436830');
const stemBrown = new THREE.Color('#775235');

export function fruitProfile(entry){
  if(entry.category!=='fruit')return '';
  return fruitProfiles[entry.id]||(citrus.has(entry.id)?'citrus':'');
}
export const fruitNeedsDetail = entry => denseSurface.has(fruitProfile(entry));

function scaleCell(theta, phi, rows, columns){
  const row=theta/Math.PI*rows;
  const sector=phi/TAU*columns;
  const stagger=sector+(Math.floor(row)%2)*.5;
  const horizontal=Math.abs(stagger-Math.floor(stagger)-.5)*2;
  const vertical=Math.abs(row-Math.floor(row)-.5)*2;
  return clamp(1-(horizontal*.59+vertical*.75),0,1);
}

export function fruitPoint(entry,theta,phi,inset){
  const kind=fruitProfile(entry);
  if(!kind)return null;
  const u=Math.cos(theta),s=Math.sin(theta), c=Math.cos(phi),z=Math.sin(phi);
  const wave=(n,phase=0)=>Math.cos(phi*n+phase);
  let radius=s,y=u,xOffset=0,depth=1;
  switch(kind){
    case 'banana': {
      const bent=entry.id==='plantain'?.55:.80;
      const tangent=2*bent*u/.55;
      const normal=1/Math.sqrt(1+tangent*tangent);
      const ridge=1+.045*wave(5,theta*.42);
      const tube=(.227-inset*.48)*s**.56*(1-.15*u)*ridge;
      return v3(bent*(u*u-.47)+tube*c*normal,.55*u-tube*c*tangent*normal,tube*z);
    }
    case 'apple': case 'asianPear':
      radius=s*(1+.18*u+.042*wave(5,theta*.19)*u*u);
      y=u-(kind==='asianPear'?.12:.24)*u**9;
      xOffset=.021*u; break;
    case 'avocado':
      radius=s*(.87-.42*u+.074*u*u);
      radius*=1+.016*wave(26,theta*32)*Math.cos(theta*43);
      y=u*.98; xOffset=.066*u; break;
    case 'pear': case 'quince':
      radius=s*(.90-.45*u+.095*u*u)* (1+.038*wave(3,theta*.7));
      xOffset=.09*u; y=u+.044*u*u; break;
    case 'fig':
      radius=s*(.86-.43*u+.07*wave(7)*Math.max(0,u)); y=u+.09*u*u; break;
    case 'guava':
      radius=s*(.93-.19*u+.065*wave(3,theta)); y=u*.99; xOffset=.046*u; break;
    case 'papaya':
      radius=s*(.91-.19*u+.10*wave(3)*s*.4); xOffset=.052*(u+.3); y=u; break;
    case 'peach': case 'apricot': case 'mango': {
      const seam=Math.max(0,wave(1,-.38+s*.25))**15;
      radius=s*(1+.066*u-.074*seam);
      y=u-(kind==='mango'?.07:.14)*Math.sign(u)*Math.abs(u)**9;
      if(kind==='mango'){
        radius*=.90+.13*u;
        xOffset=.17*u+.11*u*u-.035;
        depth=.86;
      }
      if(kind==='apricot'){radius*=.94;depth=.93;}
      break;
    }
    case 'pomegranate':
      radius=s*(1-.11*u+.031*wave(5)); y=u*(1-.10*Math.abs(u)**7); break;
    case 'persimmon':
      radius=s**.62*(1+.056*wave(4)); y=u*.81; break;
    case 'mangosteen':
      radius=s*(1+.03*wave(3)); y=u*.91; break;
    case 'lemon': case 'lime': case 'kumquat': case 'citrus': {
      const pointed=kind==='lemon';
      y=u*(pointed?1+.22*Math.abs(u)**10:1);
      radius=s*(pointed?.88:1);
      if(entry.id==='mandarin'||entry.id==='clementine')y*=.88;
      if(entry.id==='pomelo')radius*=1-.24*u;
      if(kind==='kumquat')radius*=.82;
      break;
    }
    case 'strawberry':
      radius=s*(.92+.45*u-.11*u*u)*(1+.04*wave(5,theta*.9));
      y=u+.12*Math.min(0,u)*Math.min(0,u)*-1;
      xOffset=.038*u; break;
    case 'watermelon':
      radius=s**.95*(1+.03*wave(2)+.014*u);
      y=u*.94; break;
    case 'cantaloupe': case 'honeydew':
      radius=s*(1+.021*wave(kind==='cantaloupe'?8:3));
      y=u*.94; break;
    case 'pineapple':
      radius=s**.55*(.87+.046*wave(3))*(.96+.095*scaleCell(theta,phi,11,14));
      y=u*.94; break;
    case 'dragon':
      radius=s*(.86-.13*u+.038*wave(4,theta*2)); y=u; xOffset=.045*u; break;
    case 'durian': case 'jackfruit': case 'breadfruit': case 'lychee':
      radius=s*(.94+.044*wave(3)+(.105*scaleCell(theta,phi,kind==='lychee'?17:13,kind==='jackfruit'?23:17)));
      y=u; xOffset=.04*u; break;
    case 'soursop':
      radius=s*(.97+.17*u+.044*wave(5,theta*4)); xOffset=.048*u; break;
    case 'rambutan':
      radius=s*.90; y=u*.92; break;
    case 'blueberry':
      radius=s**.86*.93;
      y=u*.88-.089*Math.max(u,0)**12; break;
    case 'kiwi': case 'goldenKiwi':
      radius=s*(.93-.085*u+.029*wave(3)); y=u*.97;break;
    case 'coconut':
      radius=s*(.96-.11*u+.071*wave(3,theta*.57)); xOffset=.044*u; break;
    case 'star':
      radius=s**.83*(.72+.30*wave(5)); y=u; break;
  }
  const wide=(.665-inset)*radius;
  return v3(wide*c+xOffset,y*(.525-inset*.7),wide*z*depth);
}

const hash=(x,y)=>{ const n=Math.sin(x*127.1+y*311.7)*43758.5453; return n-Math.floor(n); };

function netRidge(theta,phi){
  const columns=37;
  const x=phi/TAU*columns,y=theta/Math.PI*25;
  const xi=Math.floor(x),yi=Math.floor(y);
  let best=100,next=100;
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
    const col=(xi+dx+columns)%columns,row=yi+dy;
    const xDelta=xi+dx+hash(col,row)*.72+.14-x;
    const yDelta=row+hash(col+718,row-31)*.72+.14-y;
    const distance=xDelta*xDelta+yDelta*yDelta;
    if(distance<best){next=best;best=distance;}
    else next=Math.min(next,distance);
  }
  return 1-clamp((next-best)/.20,0,1);
}

export function fruitTint(entry,theta,phi,colors){
  const kind=fruitProfile(entry);
  if(!kind)return null;
  const u=Math.cos(theta);
  const ripple=Math.sin(phi*17+theta*13)*Math.sin(theta*26-phi*7);
  const grain=Math.cos(theta*103+phi*17)*Math.sin(phi*77-theta*39);
  const tone=colors.skin.clone();
  const tint=(mix,shade=1)=>tone.lerp(colors.accent,clamp(mix,0,1)).multiplyScalar(shade);
  switch(kind){
    case 'watermelon': {
      const stripes=Math.cos(phi*9+Math.sin(theta*8+phi*3)*.57+Math.sin(theta*23+phi*5)*.22);
      const dark=clamp((stripes+.15+ripple*.10)*1.67,0,1);
      return tint(dark*.94,.91+.12*ripple+.10*Math.sin(theta)**3);
    }
    case 'cantaloupe':
      return tone.lerp(offsets[0],netRidge(theta,phi)*.78).multiplyScalar(.84+grain*.17+ripple*.09);
    case 'strawberry':
      return tint(.21+.17*ripple+.11*grain,.89+.17*Math.sin(theta)+.04*grain);
    case 'apple': case 'peach': case 'mango': case 'apricot': case 'pear': case 'papaya': {
      const blush=Math.cos(phi+(kind==='mango'?1.2:-.55)+.51*u)*.41+.38+ripple*.13;
      const amount=kind==='apple'&&entry.id==='apple'?.56:.93;
      return tint(blush*amount,.91+.14*Math.sin(theta)+grain*.08);
    }
    case 'banana':
      if(Math.abs(u)>.985)return tone.lerp(offsets[1],clamp((Math.abs(u)-.985)*105,0,1));
      return tint(.16+.10*Math.cos(phi*5)+.29*Math.max(0,grain)**6+.1*ripple,.96+.06*Math.cos(phi-1));
    case 'coconut': case 'kiwi': case 'goldenKiwi':
      return tint(.16+.19*Math.max(0,grain)+.14*ripple,.78+.24*Math.sin(phi*51+theta*3)**2+.16*Math.sin(theta));
    case 'pineapple': {
      const eye=scaleCell(theta,phi,11,14);
      return tint(.18+.66*(1-eye)**2+ripple*.12,.77+.43*eye+.12*grain);
    }
    case 'dragon':
      return tone.multiplyScalar(.81+.21*Math.sin(theta)+ripple*.10+grain*.05);
    case 'durian': case 'jackfruit': case 'lychee': case 'breadfruit': case 'soursop':
      return tint(.20+.28*grain+.24*ripple,.80+.30*scaleCell(theta,phi,13,17));
    case 'avocado':
      return tint(.12+.16*Math.max(0,grain)+.10*ripple,.64+.33*Math.max(0,ripple)+.15*Math.sin(theta));
    case 'blueberry':
      return tone.lerp(new THREE.Color('#7487a7'),.31+.17*ripple).multiplyScalar(.82+.17*Math.sin(theta));
    case 'citrus': case 'kumquat': case 'lemon': case 'lime':
      return tint(.20+.18*ripple+.10*grain,.92+.12*Math.sin(theta)+grain*.095);
    default:
      return tint(.18+.16*ripple+.11*grain,.838+.205*Math.sin(theta));
  }
}

export function ellipsoid(size){
  const geometry=new THREE.SphereGeometry(1,12,8);
  geometry.scale(...size);
  return geometry;
}

export function component(geometry,position,color,breakable=false,form='round'){
  return {geometry,position,color,breakable,form};
}

export function tendon(points,thickness,color){
  const curve=new THREE.CatmullRomCurve3(points);
  const geometry=new THREE.TubeGeometry(curve,8,thickness,5,false);
  return component(geometry,v3(),color);
}

export function leaf(base,direction,up,length,width,lift,color,tipColor=color){
  const along=direction.clone().normalize(),normal=up.clone().addScaledVector(along,-up.dot(along)).normalize();
  const side=along.clone().cross(normal).normalize();
  const positions=[],colorData=[],indices=[];
  const c=new THREE.Color();
  for(let i=0;i<=8;i++){
    const t=i/8;
    const taper=Math.sin(Math.PI*t)**.83*(1.10-.47*t);
    for(const edge of [-1,0,1]){
      const vertex=base.clone().addScaledVector(along,length*t)
        .addScaledVector(side,edge*width*taper)
        .addScaledVector(normal,lift*t*t+(!edge?.053:0)*taper);
      positions.push(...vertex);
      c.copy(color).lerp(tipColor,t*t*(.87+edge*.06)).multiplyScalar(edge===0?1.15:.90);
      colorData.push(c.r,c.g,c.b);
    }
    if(!i)continue;
    for(let j=0;j<2;j++){
      const a=(i-1)*3+j,b=a+1,cIndex=a+3,d=cIndex+1;
      indices.push(a,b,cIndex,b,d,cIndex);
    }
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('color',new THREE.Float32BufferAttribute(colorData,3));
  geometry.setIndex(indices);geometry.computeVertexNormals();
  return component(geometry,v3(),color);
}

export function mergeComponents(parts){
  const positions=[],normals=[],colors=[],indices=[];
  let start=0;
  for(const {geometry,position,color} of parts){
    const verts=geometry.getAttribute('position'),norm=geometry.getAttribute('normal');
    const tints=geometry.getAttribute('color');
    for(let i=0;i<verts.count;i++){
      positions.push(verts.getX(i)+position.x,verts.getY(i)+position.y,verts.getZ(i)+position.z);
      normals.push(norm.getX(i),norm.getY(i),norm.getZ(i));
      if(tints)colors.push(tints.getX(i),tints.getY(i),tints.getZ(i));
      else colors.push(color.r,color.g,color.b);
    }
    if(geometry.index)for(const index of geometry.index.array)indices.push(index+start);
    else for(let i=0;i<verts.count;i++)indices.push(i+start);
    start+=verts.count;
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));
  geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  geometry.setIndex(indices);
  return geometry;
}

function buildBerryCluster(entry,parts,seed){
  const skin=new THREE.Color(entry.skin),accent=new THREE.Color(entry.accent);
  if(entry.shape==='cherry'){
    for(const [x,y,z,w] of [[-.25,-.12,.12,.32],[.22,-.19,-.13,.34]]){
      const position=v3(x,y,z);
      const ball=ellipsoid([w,w*.94,w*.96]);
      parts.push(component(ball,position,skin.clone().lerp(accent,x<0?.07:.15),true));
      const bend=v3(x*.73,.25,z*.33),base=v3(x,y+w*.88,z),tip=v3(.02,.58,0);
      parts.push(tendon([base,bend,tip],.019,stemGreen));
    }
    return;
  }
  if(entry.shape==='grape'){
    const tiers=[[5,.31,.36,.221],[6,.072,.40,.216],[5,-.139,.32,.207],[3,-.332,.222,.191],[1,-.504,0,.166]];
    for(const [row,[count,y,spread,size]] of tiers.entries()){
      for(let i=0;i<count;i++){
        const theta=i*TAU/count+row*.53+seed()*.18;
        const w=size*(.88+seed()*.23);
        const position=v3(Math.cos(theta)*spread,y+(seed()-.5)*.11,Math.sin(theta)*spread*.89);
        const geometry=ellipsoid([w,w*.76,w*.97]);
        geometry.rotateZ(.16*Math.sin(theta));
        const grape=skin.clone().lerp(accent,.04+seed()*.28).multiplyScalar(.77+seed()*.36);
        parts.push(component(geometry,position,grape,true));
        if(row===0)parts.push(tendon([v3(0,.49,0),v3(position.x*.69,.42,position.z*.63),position.clone().add(v3(0,.12,0))],.015,stemGreen));
      }
    }
    parts.push(tendon([v3(.02,.36,.05),v3(.027,.65,0),v3(.14,.78,-.03)],.035,stemBrown));
    return;
  }
  const hollow=entry.id==='raspberry';
  const long=entry.id==='mulberry';
  const tiers=long?[[5,.38,.23],[7,.21,.35],[8,.02,.40],[7,-.18,.36],[6,-.35,.24],[2,-.48,.08]]
    :[[6,.32,.34],[9,.16,.44],[10,-.04,.44],[8,-.24,.38],[5,-.39,.23],[2,-.47,.07]];
  for(const [row,[count,y,spread]] of tiers.entries()){
    for(let i=0;i<count;i++){
      const theta=i*TAU/count+row*.27+(seed()-.5)*.17;
      const size=(long?.15:.157)*(.86+seed()*.20);
      const position=v3(Math.cos(theta)*spread,y+(seed()-.50)*.073,Math.sin(theta)*spread*(.93+seed()*.15));
      const drupe=skin.clone().lerp(accent,.06+seed()*.33).multiplyScalar(.76+seed()*.42);
      parts.push(component(ellipsoid([size,size*(.88+seed()*.23),size*.94]),position,drupe,true));
    }
  }
  parts.push(component(ellipsoid([.31,.15,.32]),v3(0,hollow?.083:.31,0),skin.clone().multiplyScalar(hollow?.26:.79)));
}

export function buildFruitDetails(entry,pointAt){
  if(entry.category!=='fruit')return null;
  const kind=fruitProfile(entry);
  const clustered=['grape','cherry','berry'].includes(entry.shape);
  const parts=[];
  const seed=random([...entry.id].reduce((seed,letter)=>Math.imul(seed,31)+letter.charCodeAt(0),971));
  if(clustered)buildBerryCluster(entry,parts,seed);
  if(['apple','asianPear','pear','quince','fig','persimmon','mangosteen','citrus','papaya','guava'].includes(kind)){
    const top=pointAt(.015,0);
    const stemLength=kind==='apple'||kind==='pear'?.18:kind==='citrus'?.052:.096;
    parts.push(tendon([top.clone().add(v3(0,-.04,0)),top.clone().add(v3(.022,stemLength*.58,-.012)),top.clone().add(v3(.078,stemLength,-.015))],kind==='citrus'?.028:.024,kind==='citrus'?stemGreen:stemBrown));
  }
  if(['strawberry','persimmon','mangosteen','pomegranate','blueberry'].includes(kind)){
    const top=pointAt(.045,0);
    const count=kind==='persimmon'||kind==='mangosteen'?4:5;
    const color=new THREE.Color(entry.skin);
    if(kind==='blueberry'||kind==='pomegranate'){
      const scar=top.clone().add(v3(0,kind==='blueberry'?.036:.022,0));
      const ring=new THREE.TorusGeometry(kind==='blueberry'?.082:.105,.017,5,20);
      ring.rotateX(-Math.PI/2);
      parts.push(component(ring,scar,color.clone().multiplyScalar(.72)));
    }
    for(let i=0;i<count;i++){
      const theta=i*TAU/count+.21;
      const axis=v3(Math.cos(theta),0,Math.sin(theta));
      if(kind==='pomegranate'||kind==='blueberry'){
        const dark=color.clone().multiplyScalar(kind==='blueberry'?.47:.58);
        parts.push(leaf(top.clone().addScaledVector(axis,kind==='blueberry'?.079:.093),axis.clone().multiplyScalar(.38).add(v3(0,1,0)),axis,kind==='blueberry'?.084:.17,kind==='blueberry'?.035:.058,.031,dark,offsets[2]));
      }else{
        const length=kind==='strawberry'?.26:.22;
        const base=top.clone().addScaledVector(axis,.034);
        parts.push(leaf(base,axis,v3(0,1,0),length,.066,-.084,calyxGreen,stemGreen));
      }
    }
  }
  if(kind==='strawberry'){
    for(let row=0;row<9;row++){
      const theta=.43+row*.255;
      const count=Math.round(6+10*Math.sin(theta));
      for(let i=0;i<count;i++){
        const phi=(i+row*.49)*TAU/count+(seed()-.5)*.077;
        const pos=pointAt(theta+(seed()-.5)*.10,phi);
        const geom=ellipsoid([.015,.025+seed()*.008,.009]);
        const n=v3(Math.cos(phi)*.92,-Math.cos(theta)*.33,Math.sin(phi)*.92).normalize();
        geom.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(v3(0,0,1),n));
        pos.addScaledVector(n,.006);
        parts.push(component(geom,pos,offsets[0].clone().lerp(offsets[1],seed()*.43)));
      }
    }
  }
  if(kind==='pineapple'){
    const top=pointAt(.03,0);
    for(let layer=0;layer<3;layer++){
      const count=6-layer;
      for(let i=0;i<count;i++){
        const phi=i*TAU/count+layer*.93;
        const radial=v3(Math.cos(phi),0,Math.sin(phi));
        const base=top.clone().addScaledVector(radial,.085-layer*.021).add(v3(0,layer*.046,0));
        const direction=radial.clone().multiplyScalar(.35-layer*.095).add(v3(0,.6,0));
        const length=.58+layer*.10+(seed()-.5)*.135;
        const green=calyxGreen.clone().lerp(stemGreen,(.14+layer*.22));
        parts.push(leaf(base,direction,radial,length,.107-layer*.016,.21-layer*.052,green,stemGreen));
      }
    }
  }
  if(kind==='dragon'){
    const rose=new THREE.Color('#be3261'),yellowGreen=new THREE.Color('#8ba448');
    for(let row=0;row<4;row++){
      for(let i=0;i<5;i++){
        const phi=(i+row*.51)*TAU/5;
        const theta=.56+row*.53;
        const p=pointAt(theta,phi);
        const n=v3(Math.cos(phi),.25*Math.cos(theta),Math.sin(phi)).normalize();
        const direction=v3(0,1,0).addScaledVector(n,-.29+row*.117);
        parts.push(leaf(p.clone().addScaledVector(n,-.008),direction,n,.30+row*.016,.107,.123+row*.016,rose,yellowGreen));
      }
    }
  }
  if(['durian','rambutan','soursop','kiwi','coconut'].includes(kind)){
    const color=new THREE.Color(entry.skin),tip=new THREE.Color(entry.accent);
    const count=kind==='durian'?151:kind==='rambutan'?142:kind==='kiwi'?148:kind==='soursop'?53:52;
    for(let i=0;i<count;i++){
      const u=1-2*(i+.5)/count,theta=Math.acos(u);
      const phi=i*2.399963+(seed()-.52)*.22;
      const base=pointAt(theta,phi);
      const n=v3(Math.cos(phi)*Math.sin(theta),u,Math.sin(phi)*Math.sin(theta)).normalize();
      const size=kind==='durian'?.124+seed()*.060:kind==='soursop'?.052+seed()*.025:kind==='rambutan'?.134+seed()*.086:kind==='kiwi'?.027+seed()*.036:.029+seed()*.024;
      if(kind==='durian'||kind==='soursop'){
        const spike=new THREE.ConeGeometry(kind==='durian'?.061:.028,size,5);
        spike.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(v3(0,1,0),n));
        parts.push(component(spike,base.clone().addScaledVector(n,size*.25),color.clone().lerp(tip,.18+seed()*.42)));
      }else{
        const bend=v3(-n.z,.43,n.x).multiplyScalar(size*.36);
        const points=[base,base.clone().addScaledVector(n,size*.61),base.clone().addScaledVector(n,size).add(bend)];
        const hair=color.clone().lerp(tip,.23+seed()*.55);
        parts.push(tendon(points,kind==='rambutan'?.0095:.0034,hair));
      }
    }
  }
  if(kind==='coconut'){
    const end=pointAt(.07,0);
    for(let i=0;i<3;i++){
      const a=i*TAU/3;
      const p=end.clone().add(v3(.105*Math.cos(a),-.013,.100*Math.sin(a)));
      parts.push(component(ellipsoid([.044,.015,.046]),p,new THREE.Color('#342820')));
    }
  }
  return finishDetails(parts,clustered);
}

export function finishDetails(parts,clustered){
  if(!parts.length)return null;
  const pieces=parts.filter(part=>part.breakable);
  for(const part of pieces){
    part.geometry.computeBoundingSphere();
    const {center,radius}=part.geometry.boundingSphere;
    part.position.add(center);
    part.geometry.translate(-center.x,-center.y,-center.z);
    part.radius=radius;
    if(!part.geometry.getAttribute('color')){
      const colors=new Float32Array(part.geometry.attributes.position.count*3);
      for(let i=0;i<colors.length;i+=3)part.color.toArray(colors,i);
      part.geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));
    }
  }
  const geometry=mergeComponents(parts);
  for(const part of parts)if(!part.breakable)part.geometry.dispose();
  return {geometry,pieces,clustered,customStem:true};
}
