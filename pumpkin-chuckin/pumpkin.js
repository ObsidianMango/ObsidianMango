import { THREE, v3, clamp, lerp, random, TAU, mesh, surface, groundHeight } from './field.js';

const HALF = Math.PI / 2;
const segmentRows = 3;
const segmentColumns = 8;
const rindRadius = .665;
export const pumpkinRadius = .65;

function skinPoint(theta, phi, inset = 0) {
  const sinus = Math.sin(theta);
  const rib = Math.cos(phi*10 + Math.sin(theta*3.1)*.33);
  const grooves = Math.pow((1-rib)*.5,4.3);
  const oval = 1 + .046*Math.cos(phi*2+.51) + .021*Math.sin(phi*3-.58);
  const r = (rindRadius - inset) * sinus * oval * (1+.042*rib-.077*grooves);
  const y = (.525 - inset*.7) * Math.cos(theta) * (1-.17*Math.pow(Math.abs(Math.cos(theta)),8));
  return v3(Math.cos(phi)*r,y + .027*Math.sin(phi*3+.71)*sinus,Math.sin(phi)*r);
}

function skinColor(theta,phi) {
  const ribs = Math.pow(.5-.5*Math.cos(phi*10+Math.sin(theta*3.1)*.33),6);
  const shoulder = Math.pow(Math.abs(Math.cos(theta)),8);
  const mottles = Math.sin(phi*9+theta*8)*Math.sin(theta*13-phi*5);
  return new THREE.Color().setRGB(.97-ribs*.105-shoulder*.21+mottles*.022,.92-ribs*.16-shoulder*.27+mottles*.043,.83-ribs*.18-shoulder*.32+mottles*.043);
}

function skinGeometry(rows,columns) {
  const positions=[],colors=[],uv=[],indices=[];
  for(let y=0;y<=rows;y++){
    for(let x=0;x<=columns;x++){
      const theta = lerp(.001,Math.PI-.001,y/rows), phi=x/columns*TAU;
      positions.push(...skinPoint(theta,phi));
      const c=skinColor(theta,phi);colors.push(c.r,c.g,c.b);
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

function fractureGeometry(row,column) {
  const edgeCount=8;
  const positions=[],colors=[],uv=[],indices=[];
  const geo=new THREE.BufferGeometry();
  const groupStart = material => ({start:indices.length,material});
  const finish = group => geo.addGroup(group.start,indices.length-group.start,group.material);
  const pivot=skinPoint((row+.5)/segmentRows*Math.PI,(column+.5)/segmentColumns*TAU,.041);
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
    const local=skinPoint(t,p,depth+uneven).sub(pivot);
    positions.push(...local);uv.push(p/TAU,1-t/Math.PI);
    const tint=outer ? skinColor(t,p) : new THREE.Color().setRGB(.92,.78+.16*Math.sin(t*34+p*48)**2,.62+.31*Math.sin(t*15-p*19)**2);
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
  stem.map = null;
  const root = new THREE.Group();
  const skin = skinGeometry(57,100);
  mesh(root,skin,outer);
  const stemGeo=curvedStem();
  mesh(root,stemGeo,stem,0,.54,0);
  scene.add(root);
  const fractures=[];
  for(let row=0;row<segmentRows;row++)for(let column=0;column<segmentColumns;column++){
    fractures.push(fractureGeometry(row,column));
  }
  return {root,outer,inner,flesh,stem,stemGeo,fractures};
}

function smearMap(seed) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext('2d');
  const rng = random(seed);
  for(let i=0;i<95;i++){
    const angle=rng()*TAU,burst=Math.pow(rng(),1.8);
    const x=256+Math.cos(angle)*burst*170,y=256+Math.sin(angle)*burst*168;
    const r=2+rng()*(51-29*burst);
    ctx.fillStyle=['#bc561fc9','#ec7934d5','#db6d28d6','#ed9b44ce','#a94317ae','#fbab55ec'][i%6];
    ctx.beginPath();ctx.ellipse(x,y,r,r*(.32+rng()*.64),angle,0,TAU);ctx.fill();
  }
  for(let i=0;i<165;i++){
    const angle=rng()*TAU,r=29+Math.pow(rng(),.8)*205;
    const x=256+Math.cos(angle)*r,y=256+Math.sin(angle)*r;
    ctx.fillStyle=['#fa9337ef','#f5ae55d5','#e47a27c5','#ffd078e4'][i%4];
    const w=(1.3+rng()*5.3)*(1.14-r/275);
    ctx.beginPath();ctx.ellipse(x,y,w*(1.5+rng()*6.3),w,angle,0,TAU);ctx.fill();
  }
  for(let i=0;i<64;i++){
    const a=rng()*TAU,r=18+rng()*101,w=2+rng()*5;
    const x=256+Math.cos(a)*r,y=256+Math.sin(a)*r;
    ctx.strokeStyle=i%3===0?'#ffda8ab9':'#a83d18be';
    ctx.lineWidth=1+rng()*2;
    ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+w,y-w,x+w*2.4,y+w*2);ctx.stroke();
  }
  const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;
  return tex;
}

function addSmear(scene,target,hit,power,seed) {
  const tex=smearMap(seed+311);
  const width=clamp(.65+power*.081,1.5,3.85);
  const g=new THREE.PlaneGeometry(width,width);
  if(hit.onBoard){
    // Clip the decal to the circular face while leaving its clear outer edges intact.
    const localX=hit.contact.x-target.stand.position.x;
    const localY=hit.contact.y-target.stand.position.y-target.center;
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

function particleBanks(mobile) {
  const detail=mobile ? 0 : 1;
  const sweet=new THREE.MeshPhysicalMaterial({color:'#ffffff',roughness:.32,clearcoat:.72,clearcoatRoughness:.18});
  const seed=surface('#ffffff',{roughness:.43});
  const rind=surface('#ffffff',{roughness:.59});
  return [
    {geo:new THREE.IcosahedronGeometry(1,detail),mat:sweet,count:mobile?137:222,colors:['#e77924','#ffac53','#f68b33','#ffb753','#ef6b1b'],min:.013,max:.086,drag:1.2,stretch:.9},
    {geo:new THREE.SphereGeometry(1,9,5),mat:seed,count:mobile?36:59,colors:['#e9d5a7','#ffe7b5','#eee2c4','#d4af73'],min:.044,max:.063,drag:.39,seed:true},
    {geo:new THREE.IcosahedronGeometry(1,0),mat:rind,count:mobile?30:53,colors:['#ec8534','#c65517','#ffa153','#ebb05c'],min:.043,max:.176,drag:.64,chip:true}
  ].map(pack=>({...pack, colors:pack.colors.map(c=>new THREE.Color(c))}));
}

function makePlume(scene, hit, rng, mobile) {
  const canvas = document.createElement('canvas');
  canvas.width=canvas.height=96;
  const ctx=canvas.getContext('2d');
  const glow=ctx.createRadialGradient(48,48,0,48,48,47);
  glow.addColorStop(0,'rgba(255,226,177,.49)');glow.addColorStop(.32,'rgba(242,193,141,.31)');glow.addColorStop(1,'rgba(241,162,88,0)');
  ctx.fillStyle=glow;ctx.fillRect(0,0,96,96);
  const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;
  const sprites=[];
  for(let i=0;i<(mobile?12:19);i++){
    const mat=new THREE.SpriteMaterial({ map:tex,transparent:true,depthWrite:false,color:hit.onBoard?0xffaa66:0xbe9f6e });
    const item=new THREE.Sprite(mat);
    item.position.copy(hit.contact);item.scale.setScalar(.18+rng()*.24);mat.opacity=0;
    scene.add(item);
    sprites.push({item,vel:v3((rng()-.5)*8,rng()*4+1,(rng()-.32)*7),life:.36+rng()*.71,delay:rng()*.12});
  }
  return {sprites,tex};
}

export function impact(scene,target,hit,rotation,pumpkin,seed,mobile,canvasOnly) {
  const rng=random(seed);
  const speed=hit.velocity.length();
  const energy=clamp(speed/22,.66,1.45);
  const normal=hit.onBoard ? v3(0,0,1):v3(0,1,0);
  const tangent=hit.velocity.clone().addScaledVector(normal,-hit.velocity.dot(normal));
  const splashOrigin=hit.contact.clone().addScaledVector(normal,.178);
  const rigid=[];
  const fractureGroup=new THREE.Group();scene.add(fractureGroup);
  for(const [index,part] of pumpkin.fractures.entries()){
    const piece=mesh(fractureGroup,part.geo,[pumpkin.outer,pumpkin.inner,pumpkin.flesh],0,0,0,!mobile);
    const offset=part.pivot.clone().applyQuaternion(rotation);
    piece.position.copy(hit.center).add(offset);
    if(hit.onBoard)piece.position.z=Math.max(piece.position.z,hit.contact.z+.18);
    piece.quaternion.copy(rotation);
    const velocity=offset.clone().normalize().multiplyScalar((3.9+rng()*6.7)*energy)
      .addScaledVector(normal,(2+rng()*4.1)*energy)
      .addScaledVector(tangent,.29+rng()*.10);
    velocity.y+=.7+rng()*2.2;
    rigid.push({piece,vel:velocity,spin:v3((rng()-.5)*10,(rng()-.5)*13,(rng()-.5)*12),radius:.12+index%3*.036});
  }
  const stem=mesh(fractureGroup,pumpkin.stemGeo,pumpkin.stem,0,0,0,false);
  stem.position.copy(v3(0,.54,0).applyQuaternion(rotation)).add(hit.center);
  stem.quaternion.copy(rotation);
  rigid.push({piece:stem,vel:normal.clone().multiplyScalar(6.1).addScaledVector(tangent,.37).add(v3(1.1,5.8,.1)),spin:v3(-8,10,4),radius:.115});

  const strands = [];
  const strandGeo = new THREE.SphereGeometry(1,10,6);
  for(let i=0;i<(mobile?11:19);i++){
    const part=mesh(fractureGroup,strandGeo,pumpkin.flesh,0,0,0,false);
    const vel=v3((rng()-.5)*11,rng()*7,(rng()-.5)*8).multiplyScalar(energy).addScaledVector(normal,2+rng()*2.9).addScaledVector(tangent,.38);
    part.position.copy(splashOrigin);
    strands.push({part,vel,width:.019+rng()*.024,length:.16+rng()*.64,spin:(rng()-.5)*8,life:.37+rng()*.72});
  }

  const dummy=new THREE.Object3D();
  const banks=particleBanks(mobile||canvasOnly).map(bank=>{
    const batch=new THREE.InstancedMesh(bank.geo,bank.mat,bank.count);
    batch.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    batch.frustumCulled=false;
    const particles=Array.from({length:bank.count},(_,i)=>{
      const direction=v3(rng()-.5,rng()-.36,rng()-.5).normalize();
      if(hit.onBoard) direction.z=Math.abs(direction.z)*.65;
      const spread=(3+Math.pow(rng(),2.0)*14)*energy;
      const vel=direction.multiplyScalar(spread).addScaledVector(tangent,.33+rng()*.36).addScaledVector(normal,(bank.seed?2.5:1.3)+rng()*6*energy);
      const position=splashOrigin.clone().add(v3((rng()-.5)*.43,(rng()-.5)*.35,(rng()-.5)*.29));
      const size=lerp(bank.min,bank.max,Math.pow(rng(),1.6));
      batch.setColorAt(i,bank.colors[i%bank.colors.length]);
      return {position,vel,size,angle:rng()*TAU,spin:(rng()-.5)*20,flick:rng()*.55,bounces:0};
    });
    scene.add(batch);
    return {...bank,batch,particles};
  });
  const mist=makePlume(scene,hit,rng,mobile);
  const mark=addSmear(scene,target,hit,speed,seed);
  let age=0;
  const up=v3(0,1,0), scratch=v3(), zero=v3(0,0,0);

  function advance(pos,vel,dt,radius,drag,bounce){
    vel.multiplyScalar(Math.exp(-drag*dt));
    vel.y-=9.81*dt;
    pos.addScaledVector(vel,dt);
    if(hit.onBoard && pos.z<hit.contact.z+radius && pos.z>hit.contact.z-.48 && vel.z<0 &&
      Math.hypot(pos.x-target.stand.position.x,pos.y-target.stand.position.y-target.center)<target.radius){
      pos.z=hit.contact.z+radius;
      vel.z*=-.39;
      vel.multiplyScalar(.83);
    }
    const ground=groundHeight(pos.x,pos.z)+radius;
    if(pos.y>ground || vel.y>=0)return false;
    pos.y=ground;vel.y=Math.abs(vel.y)*bounce;
    vel.x*=.69;vel.z*=.69;
    if(Math.abs(vel.y)<.27)vel.y=0;
    return true;
  }

  return {
    mark,
    preview: { rigid,banks,sprites:mist.sprites },
    update(dt){
      age+=dt;
      for(const obj of rigid){
        const {piece,vel,spin,radius}=obj;
        const onSurface=advance(piece.position,vel,dt,radius,.39,.26);
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
        bank.particles.forEach((p,i)=>{
          if(p.bounces<=3&&advance(p.position,p.vel,dt,p.size*.51,bank.drag,bank.seed?.38:.22))p.bounces++;
          p.angle+=dt*p.spin;
          if(canvasOnly)return;
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
        if(!canvasOnly)bank.batch.instanceMatrix.needsUpdate=true;
      }
      for(const {item,vel,life,delay} of mist.sprites){
        const localAge=age-delay;
        item.visible=localAge>0&&localAge<life;
        if(!item.visible)continue;
        item.position.addScaledVector(vel,dt*.62);
        vel.multiplyScalar(Math.exp(-2*dt));
        item.scale.addScalar(dt*1.51);
        item.material.opacity=Math.sin(clamp(localAge/life,0,1)*Math.PI)*(hit.onBoard?.59:.80);
      }
    },
    disposeDebris(){
      fractureGroup.removeFromParent();strandGeo.dispose();
      for(const bank of banks){bank.batch.removeFromParent();bank.batch.dispose();bank.geo.dispose();bank.mat.dispose();}
      for(const {item} of mist.sprites){item.removeFromParent();item.material.dispose();}
      mist.tex.dispose();
    }
  };
}
