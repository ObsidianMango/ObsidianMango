import { THREE, v3, clamp, random, TAU } from './field.js';
import { component, ellipsoid, leaf, tendon, mergeComponents, finishDetails } from './fruit-models.js';

const leafy = new Set(['arugula','bok-choy','brussels-sprouts','chard','collard-greens','endive','green-cabbage','iceberg-lettuce','kale','napa-cabbage','radicchio','red-cabbage','romaine-lettuce','spinach']);
const roots = new Set(['beet','carrot','daikon','parsnip','radish','turnip','rutabaga']);
const oblongHeads = new Set(['bok-choy','chard','collard-greens','endive','napa-cabbage','romaine-lettuce','spinach']);
const shoots = new Set(['asparagus','celery','fennel','leek','scallion']);
const skinFamilies = new Set(['pepper','chili','eggplant','onion','garlic','cuke','tuber','gourd','pod','corn','scaly','star','stalk']);
const leafGreen=new THREE.Color('#5c7838');
const darkLeaf=new THREE.Color('#3e5c32');
const cream=new THREE.Color('#e2dbac');
const ochre=new THREE.Color('#ad8553');

export function vegetableProfile(entry){
  if(entry.category!=='vegetable')return '';
  if(entry.id==='asparagus')return 'spears';
  if(leafy.has(entry.id))return 'leafHead';
  if(roots.has(entry.id))return 'root';
  if(entry.shape==='broccoli')return 'florets';
  if(skinFamilies.has(entry.shape))return entry.shape;
  if(entry.id==='tomato'||entry.id==='tomatillo'||entry.id==='kohlrabi')return entry.id;
  return '';
}

export function vegetablePoint(entry,theta,phi,inset){
  const kind=vegetableProfile(entry);
  if(!kind||kind==='leafHead'||kind==='florets'||kind==='spears')return null;
  const u=Math.cos(theta),s=Math.sin(theta),wav=(n,b=0)=>Math.cos(phi*n+b);
  let radius=s,y=u,xOffset=0,depth=1;
  switch(kind){
    case 'root': {
      if(entry.id==='carrot'||entry.id==='parsnip'){
        radius=s*(.58+.53*u+.12*u*u); y=u+Math.min(u,0)*.19*u*u; xOffset=.108*u*u-.048;
      }else if(entry.id==='daikon'){
        radius=s**.67*(.73+.25*u); y=u; xOffset=.042*Math.sin(theta*2); 
      }else{
        radius=s*(1+.26*u-.15*u*u); y=u+Math.min(u,0)*.17*u*u; xOffset=.045*u;
      }
      radius*=1+.041*wav(3,theta*3.1);
      break;
    }
    case 'pepper':
      radius=s**.84*(.87+.16*u+.126*wav(entry.id==='poblano'?3:4,.14*Math.sin(theta)));
      y=u*(1-.19*Math.abs(u)**9)+.042*wav(4)*s;
      if(entry.id==='habanero')radius*=1+.051*wav(8,theta*8);
      break;
    case 'chili':
      radius=s*(.51+.37*u)* (1+.055*wav(5));
      xOffset=.37*(Math.max(0,-u)**1.65)-.12+.049*u;
      y=u*1.08;break;
    case 'eggplant':
      radius=s*(.95-.36*u+.075*u*u); y=u; xOffset=.076*u*u+.06*u;break;
    case 'cuke':
      radius=s**.66*(.81+.039*wav(7)+.043*wav(26,theta*16)*Math.cos(theta*37));
      if(entry.id==='zucchini')radius*=.91-.10*u;
      xOffset=.043*u*u;break;
    case 'gourd':
      radius=entry.id==='butternut-squash'?s**.64*(.36+.63/(1+Math.exp((u+.18)*8.2))):s*(.89-.23*u+.19*Math.cos((u+.63)*5.4));
      y=u;break;
    case 'onion':
      radius=s*(1-.25*u+.026*wav(6,theta));
      y=u+.28*Math.max(0,u)**8;break;
    case 'garlic':
      radius=s**.75*(.94-.23*u+(.106-.049*u)*wav(8,theta*.49));
      y=u+.22*Math.max(0,u)**4;break;
    case 'tuber':
      radius=s*(.94+.10*wav(3,theta*3.5)+.061*wav(7,theta*4));
      xOffset=.074*Math.sin(theta*4)-.047*u;break;
    case 'pod':
      radius=s*(.50+.036*Math.cos(theta*(entry.id==='green-beans'?12:19)));
      xOffset=.39*u*u-.18;
      y=u*1.08;depth=entry.id==='green-beans'?.73:.66;break;
    case 'corn':
      radius=s**.56*(.63-.084*u);y=u*1.03;break;
    case 'scaly':
      radius=s*(.92+.09*wav(6,theta*.79));y=u*1.04;break;
    case 'star':
      radius=s*(.58+.17*u+.15*wav(5));y=u*1.10;xOffset=.07*u*u-.04;break;
    case 'stalk':
      radius=s**.43*(.53-.17*u+.105*wav(entry.id==='asparagus'?4:7));
      if(entry.id==='scallion')radius*=.76-.25*u;
      y=u*1.09;break;
    case 'tomato': case 'tomatillo':
      radius=s**.76*(.94+.11*u+.045*wav(6));
      y=u*(1-.205*Math.abs(u)**8); break;
    case 'kohlrabi':
      radius=s*(.88-.19*u+.045*wav(4));
      y=u*.96;break;
  }
  const radial=(.665-inset)*radius;
  return v3(Math.cos(phi)*radial+xOffset,y*(.525-inset*.70),Math.sin(phi)*radial*depth);
}

export function vegetableTint(entry,theta,phi,colors){
  const kind=vegetableProfile(entry);
  if(!kind||kind==='leafHead'||kind==='florets'||kind==='spears')return null;
  const u=Math.cos(theta);
  const uneven=Math.sin(phi*9+theta*13)*Math.cos(phi*13-theta*6);
  const texture=Math.cos(phi*34+theta*11)*Math.sin(theta*63+phi*6);
  const tone=colors.skin.clone();
  const tint=(mix,shade=1)=>tone.lerp(colors.accent,clamp(mix,0,1)).multiplyScalar(shade);
  if(kind==='root'){
    const stripe=.22*Math.max(0,Math.sin(theta*46+uneven*.32))**5;
    if(entry.id==='radish'||entry.id==='turnip'){
      const pale=entry.id==='radish'?clamp((-.33-u)*2.3,0,1):clamp((.49-u)*2.8,0,1);
      return tone.lerp(new THREE.Color(entry.flesh),pale*.9).multiplyScalar(.84+.18*Math.sin(theta)+uneven*.11);
    }
    return tint(stripe+.09+texture*.09,.86+.22*Math.sin(theta)+uneven*.09);
  }
  if(kind==='cuke'||kind==='tuber'){
    return tint(.14+.20*Math.max(0,uneven)+.48*Math.max(0,texture)**4,.82+.19*Math.sin(theta));
  }
  if(kind==='pepper'||kind==='chili'||kind==='eggplant'||kind==='tomato'){
    return tint(.105+.22*Math.sin(phi+.9)*Math.cos(theta*1.3)+.14*uneven,.87+.20*Math.sin(theta)+texture*.065);
  }
  if(kind==='onion'||kind==='garlic'){
    const striation=Math.sin(phi*28+theta*.83+uneven*.16)**2;
    return tint(.15+.32*striation+.12*texture,.87+.19*Math.sin(theta));
  }
  if(kind==='stalk'&&(entry.id==='scallion'||entry.id==='leek')){
    return tone.lerp(darkLeaf,clamp((u+.23)*.78,0,.82)).multiplyScalar(.91+.13*Math.cos(phi*6));
  }
  return tint(.22+.17*uneven+.12*texture,.858+.20*Math.sin(theta));
}

function buildHeadLeaf(angle,length,width,radius,extension,ruffle,closed,color,ribColor){
  const segments=17,columns=14;
  const vertices=[],colorData=[],indices=[];
  const tint=new THREE.Color();
  for(let j=0;j<=segments;j++){
    const t=j/segments;
    const widthFactor=Math.sin(Math.PI*t)**.74*(.83+.28*t);
    for(let i=0;i<=columns;i++){
      const u=i/columns*2-1;
      const side=Math.abs(u);
      const twist=angle+u*width*widthFactor+Math.sin(t*4+angle)*.09*t;
      const edge=side**1.4*widthFactor;
      const wrinkle=(Math.sin(t*36+u*13+angle)+Math.sin(t*22-u*19))*.022*ruffle;
      const outward=Math.sin(closed?(t*.93+.038)*Math.PI:t*2.12);
      const r=(.095+radius*outward)*(1-.39*edge)+extension*t*t+wrinkle;
      const y=-.47+length*t+.18*edge+Math.sin(t*24+angle)*.051*edge*ruffle;
      vertices.push(Math.cos(twist)*r,y,Math.sin(twist)*r);
      const midrib=Math.exp(-Math.abs(u)*20)*(1-t*.74);
      const branches=Math.max(0,Math.cos(t*59-Math.abs(u)*10))**18*.24;
      tint.copy(color).lerp(ribColor,clamp(midrib*.88+branches,0,.85)).multiplyScalar(.81+.22*t+wrinkle*2.5+.085*side);
      colorData.push(tint.r,tint.g,tint.b);
      if(i&&j){
        const d=j*(columns+1)+i,c=d-1,b=d-columns-1,a=b-1;
        indices.push(a,b,c,b,d,c);
      }
    }
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
  geometry.setAttribute('color',new THREE.Float32BufferAttribute(colorData,3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return component(geometry,v3(),color,true,'leaf');
}

function leafHead(entry,parts,seed){
  const tall=oblongHeads.has(entry.id);
  const open=['bok-choy','chard','spinach','arugula','collard-greens','kale','romaine-lettuce'].includes(entry.id);
  const ruffled=entry.id==='kale'||entry.id==='iceberg-lettuce'||entry.id==='napa-cabbage';
  const color=new THREE.Color(entry.skin),pale=new THREE.Color(entry.flesh),vein=new THREE.Color(entry.accent);
  const core=ellipsoid([open?.21:.465,tall?.48:.435,open?.20:.455]);
  parts.push(component(core,v3(0,open?-.109:.046,0),color.clone().lerp(pale,.26),true,'round'));
  for(let tier=0;tier<3;tier++){
    const count=5+tier*2;
    for(let i=0;i<count;i++){
      const angle=i*TAU/count+tier*.92+(seed()-.5)*.12;
      const length=(tall?1.04:.99)-tier*(open?.14:.12)+(seed()-.5)*.095;
      const radial=(tall?.29:.38)+tier*(open?.047:.048);
      const spread=open?.07+tier*.057:.014+tier*.018;
      const width=tall?.63+tier*.10:.88+tier*.22;
      const leafColor=color.clone().lerp(pale,(.42-tier*.12)+seed()*.11).multiplyScalar(.90+seed()*.17);
      const ribColor=(entry.id==='chard'?vein:pale).clone().lerp(cream,entry.id==='chard'?0:.19);
      parts.push(buildHeadLeaf(angle,length,width,radial,spread,ruffled?1.59:.70,!open,leafColor,ribColor));
      if(entry.id==='bok-choy'&&tier===2){
        const local=v3(Math.cos(angle)*.23,-.213,Math.sin(angle)*.23);
        const petiole=ellipsoid([.101,.27,.065]);
        const grow=v3(Math.cos(angle)*.64,1,Math.sin(angle)*.64).normalize();
        petiole.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(v3(0,1,0),grow));
        parts.push(component(petiole,local,pale.clone().lerp(cream,.26),true,'stalk'));
      }
    }
  }
}

function asparagus(parts){
  for(const [i,[x,y,z,angle]] of [[-.16,-.018,.08,.095],[.08,.05,-.105,-.13],[.23,-.055,.09,-.19]].entries()){
    const center=v3(x,y,z);
    const shaft=new THREE.CylinderGeometry(.062,.096,.92,12);
    const green=leafGreen.clone().multiplyScalar(.94+i*.10);
    const axis=v3(-Math.sin(angle),Math.cos(angle),0);
    shaft.rotateZ(angle);
    parts.push(component(shaft,center,green,true,'stalk'));
    const tip=ellipsoid([.071,.139,.069]);
    tip.rotateZ(angle);
    parts.push(component(tip,center.clone().addScaledVector(axis,.489),darkLeaf));
    for(let row=0;row<5;row++)for(let k=0;k<5;k++){
      const phi=k*TAU/5+row*.59;
      const radial=v3(Math.cos(phi),.01,Math.sin(phi));
      const stalkEnd=center.clone().addScaledVector(axis,.335+row*.049).addScaledVector(radial,.064-(row*.0065));
      parts.push(leaf(stalkEnd,axis,radial,.097-row*.006,.026,.022,green,darkLeaf));
    }
  }
}

function floret(entry,parts,seed){
  const cauliflower=entry.id==='cauliflower';
  const color=new THREE.Color(entry.skin),mid=new THREE.Color(entry.flesh),accent=new THREE.Color(entry.accent);
  const stemColor=cauliflower?cream:mid.clone().lerp(leafGreen,.28);
  const stock=new THREE.CylinderGeometry(cauliflower?.095:.118,.14,.51,11);
  parts.push(component(stock,v3(0,-.345,0),stemColor,true,'stalk'));
  const heads=[[0,.37,0,.30],[-.29,.23,.09,.25],[.275,.28,-.03,.25],[.07,.24,.27,.23],[-.10,.25,-.26,.25],[.27,.13,.22,.19],[-.28,.10,-.15,.21]];
  for(const [x,y,z,size] of heads){
    const center=v3(x,y+(cauliflower?-.055:0),z);
    const branchBase=v3(x*.12,-.26,z*.14);
    const branchEnd=center.clone().add(v3(0,-.12,0));
    parts.push(tendon([branchBase,branchBase.clone().lerp(branchEnd,.62).add(v3(0,.039,0)),branchEnd],.065,stemColor));
    const pieces=[component(ellipsoid([size,size*.59,size*.91]),v3(),color.clone().lerp(accent,cauliflower?.02:.26))];
    for(let i=0;i<(cauliflower?20:29);i++){
      const u=.15+.82*(i+.5)/(cauliflower?20:29),r=Math.sqrt(1-u*u);
      const phi=i*2.39996;
      const w=size*(.24+seed()*.13);
      const local=v3(size*Math.cos(phi)*r*.85,size*u*.68,size*Math.sin(phi)*r*.80);
      const bits=color.clone().lerp(cauliflower?mid:accent,.10+seed()*.31).multiplyScalar(.88+seed()*.24);
      pieces.push(component(ellipsoid([w,w*.81,w*.92]),local,bits));
    }
    const geometry=mergeComponents(pieces);
    for(const {geometry:part} of pieces)part.dispose();
    parts.push(component(geometry,center,color,true,'floret'));
  }
  if(cauliflower)for(let i=0;i<7;i++){
    const phi=i*TAU/7;
    const dir=v3(Math.cos(phi),.44,Math.sin(phi));
    parts.push(leaf(v3(0,-.35,0),dir,v3(0,1,0),.62,.19,.21,darkLeaf,leafGreen));
  }
}

function cob(parts,entry,pointAt,seed){
  const gold=new THREE.Color(entry.skin),light=new THREE.Color(entry.flesh);
  for(let j=0;j<18;j++){
    const theta=.39+j*.138;
    const count=j<2||j>15?10:13;
    for(let i=0;i<count;i++){
      const phi=(i+(j%2)*.18)*TAU/count;
      const face=v3(Math.cos(phi),.11*Math.cos(theta),Math.sin(phi)).normalize();
      const point=pointAt(theta,phi).addScaledVector(face,.005);
      const kernel=new THREE.SphereGeometry(1,8,5);
      kernel.scale(.055+seed()*.011,.039+seed()*.007,.033);
      kernel.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(v3(0,0,1),face));
      const color=gold.clone().lerp(light,.12+seed()*.65).multiplyScalar(.86+seed()*.20);
      parts.push(component(kernel,point,color));
    }
  }
  for(let i=0;i<6;i++){
    const phi=i*TAU/6;
    const dir=v3(Math.cos(phi),1.04,Math.sin(phi));
    const base=v3(Math.cos(phi)*.070,-.51,Math.sin(phi)*.070);
    const outside=v3(Math.cos(phi),0,Math.sin(phi));
    parts.push(leaf(base,dir,outside,.47+(i%3)*.11,.123,.185,darkLeaf,leafGreen));
  }
}

function calyx(parts,top,width,drop){
  for(let i=0;i<5;i++){
    const phi=i*TAU/5;
    const radial=v3(Math.cos(phi),0,Math.sin(phi));
    parts.push(leaf(top.clone().addScaledVector(radial,.043),radial,v3(0,1,0),width,.066,-drop,darkLeaf,leafGreen));
  }
  parts.push(tendon([top.clone().add(v3(0,-.047,0)),top.clone().add(v3(.014,.076,0)),top.clone().add(v3(.054,.143,.011))],.033,leafGreen));
}

export function buildVegetableDetails(entry,pointAt){
  const kind=vegetableProfile(entry);
  if(!kind)return null;
  const parts=[], seeded=random(entry.name.length*19537);
  if(kind==='leafHead')leafHead(entry,parts,seeded);
  if(kind==='florets')floret(entry,parts,seeded);
  if(kind==='spears')asparagus(parts);
  if(kind==='corn')cob(parts,entry,pointAt,seeded);
  if(['pepper','chili','eggplant','tomato','tomatillo','kohlrabi'].includes(kind)){
    const top=pointAt(.04,0).add(v3(0,.012,0));
    calyx(parts,top,kind==='eggplant'?.28:kind==='chili'?.112:.22,kind==='eggplant'?.14:.083);
  }
  if(kind==='root'){
    const top=pointAt(.045,0);
    const carrot=entry.id==='carrot'||entry.id==='parsnip';
    for(let i=0;i<(carrot?5:4);i++){
      const phi=i*TAU/5+.55;
      const dir=v3(Math.cos(phi),0,Math.sin(phi));
      const finish=top.clone().addScaledVector(dir,.155+seeded()*.075).add(v3(0,carrot?.25:.19,0));
      const mid=top.clone().lerp(finish,.59).add(v3(0,.028,0));
      parts.push(tendon([top.clone().add(v3(0,-.033,0)),mid,finish],carrot?.012:.015,leafGreen));
      for(let j=0;j<3;j++){
        const stem=mid.clone().lerp(finish,j*.385);
        const tip=dir.clone().add(v3(0,.53+j*.29,0));
        tip.applyAxisAngle(v3(0,1,0),(j%2?1:-1)*.57);
        parts.push(leaf(stem,tip,v3(0,1,0),carrot?.126:.144,carrot?.031:.077,.039,darkLeaf,leafGreen));
      }
    }
    const low=pointAt(Math.PI-.015,0);
    parts.push(tendon([low,low.clone().add(v3(-.016,-.052,.013)),low.clone().add(v3(.026,-.076,.023))],.011,ochre));
  }
  if(kind==='onion'||kind==='garlic'){
    const top=pointAt(.037,0),bottom=pointAt(Math.PI-.037,0);
    const neckColor=cream.clone().lerp(ochre,.52);
    parts.push(tendon([top.clone().add(v3(0,-.035,0)),top.clone().add(v3(-.018,.044,.016)),top.clone().add(v3(-.048,.078,.027))],kind==='garlic'?.055:.044,neckColor));
    for(let i=0;i<9;i++){
      const phi=i*TAU/9;
      const side=v3(Math.cos(phi),0,Math.sin(phi));
      const base=bottom.clone().addScaledVector(side,.039);
      const end=base.clone().addScaledVector(side,.056+seeded()*.045).add(v3(0,-.069-seeded()*.026,0));
      parts.push(tendon([base,base.clone().lerp(end,.52).add(v3(0,-.014,0)),end],.0049,ochre));
    }
  }
  if(kind==='stalk'&&shoots.has(entry.id)){
    const top=pointAt(.05,0);
    for(let i=0;i<6;i++){
      const phi=i*TAU/6;
      const side=v3(Math.cos(phi),0,Math.sin(phi));
      const dir=side.clone().multiplyScalar(entry.id==='asparagus'?.095:.3).add(v3(0,.54,0));
      const base=top.clone().addScaledVector(side,entry.id==='asparagus'?.058:.115).add(v3(0,-.11,0));
      parts.push(leaf(base,dir,side,entry.id==='asparagus'?.23:.43+(i%3)*.08,entry.id==='asparagus'?.043:.10,.087,darkLeaf,leafGreen));
    }
  }
  if(kind==='pod'){
    const seam=new THREE.Color(entry.skin).lerp(darkLeaf,.33);
    for(const phi of [0,Math.PI]){
      const side=v3(Math.cos(phi),0,0);
      const path=Array.from({length:11},(_,i)=>pointAt(.20+i*.271,phi).addScaledVector(side,.006));
      parts.push(tendon(path,.010,seam));
    }
  }
  if(entry.id==='artichoke'){
    for(let row=0;row<5;row++){
      const theta=2.70-row*.46;
      for(let i=0;i<8;i++){
        const phi=(i+row*.53)*TAU/8;
        const radial=v3(Math.cos(phi),.20,Math.sin(phi)).normalize();
        const base=pointAt(theta,phi).addScaledVector(radial,-.026);
        const dir=v3(0,1,0).addScaledVector(radial,.19-row*.058);
        parts.push(leaf(base,dir,radial,.25+row*.013,.117,.085,leafGreen.clone().lerp(cream,row*.071),darkLeaf));
      }
    }
  }
  return finishDetails(parts,kind==='leafHead'||kind==='florets'||kind==='spears');
}
