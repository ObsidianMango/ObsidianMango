import { THREE, v3, lerp, clamp, random, groundHeight, TAU } from './field.js';
import { skinPoint } from './pumpkin.js?v=produce-1';

const palette = ['#353320','#5e4229','#784625','#96502b','#a55d30','#b87641','#9d6838'];
const sine = Math.sin, cosine = Math.cos;

function treeSprite(index) {
  const canvas=document.createElement('canvas');
  canvas.width=220;canvas.height=270;
  const ctx=canvas.getContext('2d'), rng=random(89+index*991);
  ctx.lineCap='round';
  function branch(ax,ay,bx,by,width) {
    ctx.lineWidth=width;ctx.strokeStyle='#473628';
    ctx.beginPath();ctx.moveTo(ax,ay);ctx.quadraticCurveTo(lerp(ax,bx,.4)+6,lerp(ay,by,.65),bx,by);ctx.stroke();
  }
  branch(110,268,114,77,12);
  const sprays=[];
  for(let i=0;i<19;i++){
    const a=i*2.4, r= Math.sqrt(rng());
    const x=110+cosine(a)*r*76,y=93+sine(a)*r*57;
    branch(111,170+rng()*50,x,y,2+rng()*4.5);
    sprays.push([x,y,22+rng()*32]);
  }
  for(const [x,y,r] of sprays){
    for(let i=0;i<102;i++){
      const a=rng()*TAU, reach=Math.sqrt(rng());
      const w=1+rng()*6;
      ctx.fillStyle=palette[clamp(Math.floor(rng()*palette.length+(x-110)*.008),0,palette.length-1)];
      ctx.globalAlpha=.36+rng()*.50;
      ctx.beginPath();ctx.ellipse(x+cosine(a)*r*reach,y+sine(a)*r*.8*reach,w,w*.63,a,0,TAU);ctx.fill();
    }
  }
  return canvas;
}

function drawPumpkin(ctx,x,y,r,spin){
  ctx.save();ctx.translate(x,y);ctx.rotate(spin*.18);
  const shades=['#703212','#ae4c18','#d96b23','#ee8b3b','#faa34e'];
  for(let j=0;j<6;j++){
    const k=(j-2.5)/2.5;
    const xOffset=k*r*.52;
    const w=r*(.50-.20*Math.abs(k)), h=r*(.78-.10*Math.abs(k));
    const tint=ctx.createRadialGradient(xOffset-w*.40,-h*.45,r*.04,xOffset,h*.15,r*.86);
    tint.addColorStop(0,shades[4]);tint.addColorStop(.36,shades[3]);tint.addColorStop(.68,shades[2]);tint.addColorStop(1,shades[0]);
    ctx.fillStyle=tint;
    ctx.beginPath();ctx.ellipse(xOffset,0,w,h,k*.21,0,TAU);ctx.fill();
  }
  ctx.lineCap='round';ctx.strokeStyle='#635a32';ctx.lineWidth=r*.18;
  ctx.beginPath();ctx.moveTo(0,-r*.68);ctx.quadraticCurveTo(-r*.06,-r*.91,r*.15,-r*1.1);ctx.stroke();
  ctx.strokeStyle='#9a8b51';ctx.lineWidth=r*.055;
  ctx.beginPath();ctx.moveTo(-r*.03,-r*.76);ctx.quadraticCurveTo(-r*.03,-r*.97,r*.13,-r*1.08);ctx.stroke();
  ctx.restore();
}

function drawProduce(ctx,point,fruit){
  const produce=fruit.produce;
  if(produce.id==='pumpkin'){
    drawPumpkin(ctx,point.x,point.y,point.scale*.665,fruit.root.rotation.x);
    return;
  }
  const [sx,sy]=produce.scale, zoom=point.scale;
  const width=zoom*.71*sx, height=zoom*.55*sy;
  ctx.save();ctx.translate(point.x,point.y);ctx.rotate(fruit.root.rotation.x*.18);
  ctx.beginPath();
  for(let i=0;i<=72;i++){
    const side=i>36?Math.PI:0;
    const t=(i>36?72-i:i)/36*Math.PI;
    const p=skinPoint(t,side,0,produce);
    const x=p.x*zoom*sx,y=-p.y*zoom*sy;
    if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
  }
  ctx.closePath();
  const gradient=ctx.createRadialGradient(-width*.34,-height*.4,width*.02,0,0,Math.max(width,height)*1.22);
  gradient.addColorStop(0,'#fff4d1');gradient.addColorStop(.24,produce.skin);
  gradient.addColorStop(.66,produce.skin);gradient.addColorStop(1,produce.accent);
  ctx.fillStyle=gradient;ctx.fill();
  ctx.save();ctx.clip();
  const pattern=produce.body.pattern;
  if(['bands','ridges','fiber','veins','rings','seam','blush'].includes(pattern)){
    const count=pattern==='bands'?8:pattern==='seam'?1:pattern==='blush'?2:11;
    for(let i=0;i<count;i++){
      const x=(i/(count+1)-.5)*width*2.11;
      ctx.globalAlpha=pattern==='bands'?.69:pattern==='veins'?.60:.35;
      ctx.strokeStyle=pattern==='veins'?produce.flesh:produce.accent;
      ctx.lineWidth=Math.max(.8,width*(pattern==='bands'?.13:.068));
      ctx.beginPath();ctx.moveTo(x*.37,-height);
      ctx.bezierCurveTo(x*1.27,height*-.47,x*.83,height*.4,x*.41,height);ctx.stroke();
    }
  }else if(pattern){
    for(let i=0;i<88;i++){
      const x=(i%11/10-.5)*width*1.92+Math.sin(i*3)*width*.063;
      const y=(Math.floor(i/11)/7-.5)*height*1.94+Math.sin(i*1.1)*height*.064;
      const size=Math.max(.33,width*(pattern==='cluster'||pattern==='kernels'?.11:pattern==='spines'||pattern==='diamond'?.064:.019));
      ctx.fillStyle=pattern==='pips'?'#efcc87':i%3?produce.accent:produce.flesh;
      ctx.globalAlpha=i%3?.55:.66;
      ctx.beginPath();ctx.ellipse(x,y,size,size*(pattern==='pips'?1.45:.84),.3,0,TAU);ctx.fill();
    }
  }
  ctx.restore();
  const accent=produce.body.accent;
  if(accent==='stem'||accent==='tip'||accent==='stalk'){
    const y=accent==='stalk'?height*.78:-height*.90;
    ctx.lineCap='round';ctx.strokeStyle=accent==='stalk'?'#789551':'#70663d';ctx.lineWidth=Math.max(1,width*.13);
    ctx.beginPath();ctx.moveTo(0,y);ctx.quadraticCurveTo(width*.04,y+(accent==='stalk'?1:-1)*height*.15,width*.16,y+(accent==='stalk'?1:-1)*height*.28);ctx.stroke();
  }
  if(['crown','sprigs','leaf','husk'].includes(accent)){
    const stemY=accent==='husk'?height*.7:-height*.79;
    const leafHeight=height*(accent==='crown'?.95:accent==='sprigs'?.71:accent==='husk'?.98:.27);
    for(let i=0;i<7;i++){
      const tilt=(i-3)*.25;
      ctx.save();ctx.translate((i-3)*width*.12,stemY);ctx.rotate(tilt);
      ctx.fillStyle=i%2?'#698a4a':'#567b44';
      ctx.beginPath();ctx.ellipse(0,-leafHeight*.32,width*.10,leafHeight*.54,0,0,TAU);ctx.fill();ctx.restore();
    }
  }
  ctx.restore();
}

export function canvasRenderer(view) {
  const canvas=document.createElement('canvas');
  const ctx=canvas.getContext('2d',{alpha:false});
  if(!ctx)throw new Error('Canvas rendering is unavailable.');
  view.append(canvas);
  let width=0,height=0,focal=0;
  const projected=v3(),cameraSpace=v3();
  const rng=random(713523);
  const treeStamps=Array.from({length:7},(_,i)=>treeSprite(i));
  const trees=Array.from({length:84},(_,i)=>{
    const near=i>57,x=near?(i%2?1:-1)*(14+rng()*46):(rng()-.5)*170,z=near?-6-rng()*60:-47-rng()*70;
    return {point:v3(x,groundHeight(x,z),z),size:4+rng()*(near?9:7),width:.75+rng()*.49,stamp:treeStamps[i%7]};
  }).sort((a,b)=>a.point.z-b.point.z);
  const tufts=Array.from({length:1050},()=>{
    const x=(rng()<.5?-1:1)*(2.25+Math.pow(rng(),2)*31),z=11-rng()*93;
    return {point:v3(x,groundHeight(x,z),z),height:.055+rng()*.30,color:palette[Math.floor(rng()*palette.length)]};
  }).sort((a,b)=>a.point.z-b.point.z);
  const clouds=Array.from({length:44},()=>({x:rng(),y:rng()*.49,w:.02+rng()*.14,h:.016+rng()*.06,alpha:.03+rng()*.09}));
  const world=v3();
  const instance=new THREE.Matrix4();

  function project(point,camera){
    cameraSpace.copy(point).applyMatrix4(camera.matrixWorldInverse);
    if(cameraSpace.z>=-.13)return null;
    projected.copy(point).project(camera);
    return {x:(projected.x*.5+.5)*width,y:(.5-projected.y*.5)*height,scale:focal/-cameraSpace.z,depth:-cameraSpace.z};
  }
  function poly(points,camera,color,stroke=0){
    const screen=points.map(p=>project(p,camera));
    if(screen.some(p=>!p))return;
    ctx.beginPath();ctx.moveTo(screen[0].x,screen[0].y);
    for(const p of screen.slice(1))ctx.lineTo(p.x,p.y);
    if(stroke){
      ctx.strokeStyle=color;ctx.lineWidth=Math.max(1,stroke*screen[0].scale);ctx.lineCap='round';ctx.stroke();
    }else{
      ctx.closePath();ctx.fillStyle=color;ctx.fill();
    }
  }
  function drawSky(camera){
    const horizon=clamp((project(v3(camera.position.x,0,camera.position.z-190),camera)?.y??height*.55),height*.22,height*.78);
    let sky=ctx.createLinearGradient(0,0,0,horizon);
    sky.addColorStop(0,'#566873');sky.addColorStop(.54,'#ae8675');sky.addColorStop(1,'#eeac72');
    ctx.fillStyle=sky;ctx.fillRect(0,0,width,height);
    const sunlight=ctx.createRadialGradient(width*.19,horizon*.57,1,width*.19,horizon*.57,width*.58);
    sunlight.addColorStop(0,'#ffe0a8b3');sunlight.addColorStop(.34,'#fab47e52');sunlight.addColorStop(1,'#ef9d7000');
    ctx.fillStyle=sunlight;ctx.fillRect(0,0,width,horizon);
    for(const cloud of clouds){
      const x=cloud.x*width,y=cloud.y*horizon+height*.04;
      ctx.save();ctx.translate(x,y);ctx.scale(1,.24+cloud.h*3);
      const fog=ctx.createRadialGradient(0,0,0,0,0,cloud.w*width);
      fog.addColorStop(0,`rgba(253,203,171,${cloud.alpha})`);fog.addColorStop(1,'#e1b79500');
      ctx.fillStyle=fog;ctx.fillRect(-cloud.w*width,-cloud.w*width,cloud.w*width*2,cloud.w*width*2);
      ctx.restore();
    }
    sky=ctx.createLinearGradient(0,horizon-6,0,height);
    sky.addColorStop(0,'#8b7950');sky.addColorStop(.49,'#61512f');sky.addColorStop(1,'#3c3820');
    ctx.fillStyle=sky;ctx.fillRect(0,horizon-5,width,height-horizon+5);
  }
  function lane(camera){
    const sides=[[-3.0,3.0,'#806246'],[-2.63,2.63,'#87694d'],[-2.08,-1.35,'#7b6049'],[1.43,2.14,'#7c614a']];
    for(const [a,b,color] of sides){
      const points=[],right=[];
      const rear=Math.min(camera.position.z-1.4,11);
      for(let z=-96;z<rear;z+=1.8){
        const turn=.65*sine(z*.14), wobble=.14*sine(z*1.6);
        points.push(v3(a+turn+wobble,groundHeight(a,z)+.016,z));
        right.push(v3(b+turn+wobble,groundHeight(b,z)+.016,z));
      }
      poly([...points,...right.reverse()],camera,color);
    }
  }
  function treesAndGrass(camera){
    for(const {point,size,width:stretch,stamp} of trees){
      const p=project(point,camera);if(!p)continue;
      const h=p.scale*size,w=h*stretch;
      if(p.x+w*.6<0||p.x-w*.6>width||h<4)continue;
      ctx.globalAlpha=clamp(1-p.depth*.0044,.51,.98);
      ctx.drawImage(stamp,p.x-w*.5,p.y-h,w,h);
    }
    ctx.globalAlpha=1;
    for(const tuft of tufts){
      const p=project(tuft.point,camera);if(!p||p.x<0||p.x>width||p.y<height*.2||p.y>height+10)continue;
      const s=tuft.height*p.scale;
      ctx.strokeStyle=tuft.color;ctx.lineWidth=Math.max(.75,s*.12);
      ctx.beginPath();ctx.moveTo(p.x-s*.29,p.y-s*.57);ctx.lineTo(p.x,p.y);ctx.lineTo(p.x+s*.43,p.y-s);ctx.stroke();
    }
  }
  function barn(camera){
    const y=groundHeight(-17,-32), l=-23,r=-11,z=-28,b=-36,roof=y+7.8,wall=y+4.9;
    poly([v3(l,y,z),v3(r,y,z),v3(r,wall,z),v3(-17,roof,z),v3(l,wall,z)],camera,'#95553c');
    poly([v3(r,y,z),v3(r,y,b),v3(r,wall,b),v3(r,wall,z)],camera,'#764333');
    poly([v3(-17,roof,z+.27),v3(r+.36,wall,z+.27),v3(r+.36,wall,b-.3),v3(-17,roof,b-.3)],camera,'#49443a');
    for(let x=l+.29;x<r;x+=.38){
      poly([v3(x,y,z+.01),v3(x,wall+(1-Math.abs(x+17)/6)*2.8,z+.01)],camera,'#734732',.027);
    }
    poly([v3(-18.4,y,z+.02),v3(-15.6,y,z+.02),v3(-15.6,y+3.5,z+.02),v3(-18.4,y+3.5,z+.02)],camera,'#3c3026');
    poly([v3(-18.55,y+3.47,z+.04),v3(-15.45,y+3.47,z+.04)],camera,'#c59b70',.19);
  }
  function launcher(camera,rig){
    const point=(x,y,z)=>rig.stand.localToWorld(v3(x,y,z));
    for(const s of [-1,1]){
      poly([point(s*.85,.19,-.75),point(s*.85,.19,2.02)],camera,'#775132',.25);
      poly([point(s*.85,.19,-.69),point(s*.78,1.28,.58),point(s*.85,.19,2.02)],camera,'#a67445',.22);
    }
    poly([point(-.93,1.28,.59),point(.93,1.28,.59)],camera,'#514634',.19);
    const armPoint=(x,y,z)=>rig.arm.localToWorld(v3(x,y,z));
    poly([armPoint(0,0,-1.11),armPoint(0,0,1.38)],camera,'#83532e',.28);
    const p=project(armPoint(0,.09,-.92),camera);
    if(p){
      ctx.fillStyle='#64482e';
      ctx.beginPath();ctx.ellipse(p.x,p.y,p.scale*.63,p.scale*.20,0,0,TAU);ctx.fill();
      ctx.strokeStyle='#a67e50';ctx.lineWidth=Math.max(1,p.scale*.056);ctx.stroke();
    }
  }
  function board(camera,target,marks){
    const {x,y,z}=target.stand.position;
    const p=project(v3(x,y+target.center,z+.13),camera);if(!p)return;
    const r=target.radius*p.scale;
    for(const s of [-1,1]){
      poly([v3(x+s*target.radius*.84,y,z),v3(x+s*target.radius*.62,y+target.center+.43,z)],camera,'#7d5939',.18);
      poly([v3(x+s*target.radius*.92,y,z-1.42),v3(x+s*target.radius*.61,y+target.center,z)],camera,'#57432e',.14);
    }
    const skew=clamp(Math.abs(camera.position.z-z)/Math.hypot(camera.position.z-z,camera.position.x-x),.39,1);
    ctx.save();ctx.translate(p.x,p.y);ctx.scale(skew,1);
    ctx.beginPath();ctx.arc(0,0,r,0,TAU);ctx.clip();
    ctx.drawImage(target.face.material.map.image,-r,-r,r*2,r*2);
    for(const mark of marks){
      if(mark.parent!==target.board||!mark.visible)continue;
      const w=mark.geometry.parameters.width*p.scale;
      ctx.drawImage(mark.material.map.image,mark.position.x*p.scale-w/2,-mark.position.y*p.scale-w/2,w,w);
    }
    ctx.strokeStyle='#513b2e';ctx.lineWidth=Math.max(1.4,p.scale*.07);ctx.stroke();
    ctx.restore();
  }
  function hitEffect(camera,fx){
    if(!fx)return;
    const sprites=fx.sprites.filter(({item})=>item.visible);
    for(const {item} of sprites){
      const p=project(item.position,camera);if(!p)continue;
      const r=p.scale*item.scale.x;
      ctx.globalAlpha=item.material.opacity;
      ctx.drawImage(item.material.map.image,p.x-r/2,p.y-r/2,r,r);
    }
    ctx.globalAlpha=1;
    const particles=[];
    for(const {piece,radius} of fx.rigid){
      const p=project(piece.position,camera);
      if(p)particles.push({...p,size:radius*p.scale*1.62,angle:piece.rotation.z,kind:'rind'});
    }
    for(const bank of fx.banks){
      for(const [index,drop] of bank.particles.entries()){
        const p=project(drop.position,camera);
        if(p&&(bank.seed||bank.chip||drop.bounces<3))particles.push({...p,size:drop.size*p.scale,
          angle:drop.angle,kind:bank.seed?'seed':bank.chip?'chip':'pulp',color:`#${bank.colors[index%bank.colors.length].getHexString()}`});
      }
    }
    particles.sort((a,b)=>b.depth-a.depth);
    for(const {x,y,size,angle,kind,color} of particles){
      if(size<.35||x<-size||x>width+size||y<-size||y>height+size)continue;
      ctx.save();ctx.translate(x,y);ctx.rotate(angle);
      ctx.beginPath();
      if(kind==='rind'){
        ctx.moveTo(-size,-size*.42);ctx.quadraticCurveTo(size*.09,size*.92,size,-size*.15);
        ctx.lineTo(size*.55,-size*.54);ctx.quadraticCurveTo(-size*.16,-size*.22,-size*.73,-size*.64);ctx.closePath();
        const light=ctx.createLinearGradient(0,-size*.7,0,size*.62);
        light.addColorStop(0,fx.produce.flesh);light.addColorStop(.52,fx.produce.skin);light.addColorStop(1,fx.produce.accent);
        ctx.fillStyle=light;
      }else{
        ctx.ellipse(0,0,size*(kind==='seed'?1.48:1.13),size*(kind==='seed'?.50:.63),0,0,TAU);ctx.fillStyle=color;
      }
      ctx.fill();ctx.restore();
    }
  }
  return {
    setSize(w,h){
      const scale=Math.min(devicePixelRatio,1.6);
      width=w;height=h;canvas.width=w*scale;canvas.height=h*scale;
      ctx.setTransform(scale,0,0,scale,0,0);
    },
    render(camera,rig,target,fruit,path,marks,effect){
      camera.updateMatrixWorld();
      focal=height/2/Math.tan(camera.fov*Math.PI/360);
      drawSky(camera);lane(camera);treesAndGrass(camera);barn(camera);
      board(camera,target,marks);
      if(rig)launcher(camera,rig);
      if(fruit.root.visible){
        const p=project(fruit.root.position,camera);
        if(p&&p.scale>0)drawProduce(ctx,p,fruit);
      }
      if(path.visible){
        ctx.fillStyle='#ffdeaa';
        for(let i=0;i<path.count;i++){
          path.getMatrixAt(i,instance);
          const p=project(world.setFromMatrixPosition(instance),camera);
          if(!p)continue;
          ctx.beginPath();ctx.arc(p.x,p.y,Math.max(1.2,p.scale*.048),0,TAU);ctx.fill();
        }
      }
      hitEffect(camera,effect?.preview);
    }
  };
}
