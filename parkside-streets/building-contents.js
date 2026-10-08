// Furnished floor clusters share two existing furniture bodies per story.
export function addBuildingContents(building,make,decorate){
 const {w,d,h,type}=building,stories=Math.ceil(h/4),step=h/stories,added=[];
 const home=['house','camp','lodge','orchard','motel'].includes(type),shop=['convenience','gun','market','diner','casino'].includes(type),industrial=['warehouse','factory','harbour','construction','scrap','marina','quarry'].includes(type);
 function item(kind,x,y,z,floor){
  let size,color,parts=[];
  const part=(key,x,y,z,w,h,d,loose=false)=>parts.push({key,x,y,z,w,h,d,loose});
  if(kind==='desk'||kind==='table'){size=[kind==='desk'?1.9:1.3,.15,.95];color=0x95744e;for(const sx of [-1,1])for(const sz of [-1,1])part('metal',sx*.52,kind==='desk'?-.375:-.325,sz*.32,.08,kind==='desk'?.75:.65,.08);if(kind==='desk'){part('metal',0,.15,-.12,.24,.22,.20);part('glass',0,.36,-.12,.65,.42,.07);part('paper',.50,.1,.1,.45,.025,.3);}}
  else if(kind==='chair'){size=[.55,.15,.55];color=0x497b80;part('fabric',0,.35,.25,.55,.65,.12);for(const sx of [-1,1])for(const sz of [-1,1])part('metal',sx*.21,-.23,sz*.21,.07,.46,.07);}
  else if(kind==='sofa'){size=[2.2,.32,.95];color=0x657d6f;part('fabric',0,.38,.36,2.2,.62,.22);for(const sx of [-1,1])part('fabric',sx*.98,.20,0,.25,.45,.98);for(const sx of [-.5,.5])part('fabric',sx,.19,0,.88,.12,.70);for(const sx of [-.8,.8])for(const sz of [-.3,.3])part('metal',sx,-.28,sz,.10,.26,.10);}
  else if(kind==='crate'){size=[1.1,.85,1.0];color=0x9b7950;for(const sx of [-1,1])part('metal',sx*.40,0,0,.06,.88,1.03);part('wood',0,.46,0,1.12,.06,1.02);}
  else if(kind==='pallet'){size=[2,.16,1.25];color=0x987647;for(const sx of [-.55,.55])part('paper',sx,.55,0,.8,.9,.95);part('metal',0,.20,0,2.02,.04,1.28);}
  else {size=[1.9,1.75,.12];color=0x686e65;for(const sy of [-.65,-.1,.5]){part('wood',0,sy,-.24,1.95,.10,.58);for(const sx of [-.6,0,.6])part(kind==='rack'?'metal':'paper',sx,sy+.22,-.22,.28,.34,.32);}}
  // Fill each half-floor with inexpensive box arrangements. The core furniture
  // still owns the support/collision body; only a fixed pool of loose parts flies.
  const cols=Math.min(3,Math.max(1,Math.floor((w/2-1)/3.4))),rows=Math.min(4,Math.max(2,Math.floor((d-2)/4)));
  const ground=floor.mesh.position.y+.14-y;let objects=1;
  function clutter(key,px,py,pz,cw,ch,cd){part(key,px-x,ground+py,pz-z,cw,ch,cd,true);}
  for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
   const px=Math.sign(x)*(.8+(col+.5)*(w/2-1.6)/cols),pz=-d/2+1+(row+.5)*(d-2)/rows;
   if(Math.abs(px-x)<Math.max(.65,size[0]/2+.25)&&Math.abs(pz-z)<Math.max(.65,size[2]/2+.25))continue;
   const variant=(row*cols+col+Math.round(y*3))%4;objects++;
   if(industrial||variant===0){
    clutter('wood',px,.08,pz,1.7,.16,1.3);
    clutter('paper',px-.4,.47,pz-.1,.72,.65,.88);clutter('wood',px+.4,.6,pz+.1,.7,.9,.85);
    if(industrial)clutter('paper',px-.4,.98,pz-.1,.64,.36,.76);
   }else if(home&&variant===1){
    clutter('wood',px,.25,pz,1.5,.5,2.1);clutter('fabric',px,.59,pz,1.45,.18,2.04);clutter('paper',px,.75,pz-.65,1.15,.15,.5);
   }else if(variant===2){
    clutter('wood',px,.75,pz,1.8,.12,1.1);clutter('metal',px,.36,pz,.65,.7,.6);
    clutter('glass',px,.99,pz-.23,.58,.36,.08);clutter('paper',px+.47,.85,pz+.1,.46,.045,.3);
    clutter('fabric',px,.5,pz+.95,.62,.12,.62);clutter('fabric',px,.84,pz+1.21,.62,.62,.1);
   }else if(shop){
    clutter('metal',px,.8,pz,1.5,1.6,.4);
    for(const shelf of [.43,.95,1.47]){clutter('wood',px,shelf,pz+.14,1.65,.08,.75);for(const side of [-1,1])clutter('paper',px+side*.4,shelf+.2,pz+.14,.5,.32,.5);}
   }else{
    clutter('wood',px,.62,pz,1.15,1.24,.65);clutter('paper',px-.23,1.31,pz,.42,.12,.48);clutter('glass',px+.3,1.43,pz,.18,.35,.18);
   }
  }
  const e=make(size,x,y,z,color);e.role='contents';e.floorOwner=floor;e.contentsKind=kind;e.contentsParts=parts;e.contentsObjects=objects;e.mesh.name='Interior '+kind;added.push(e);decorate?.(e,parts);return e;
 }
 for(let story=0;story<stories;story++){
  const y=story*step+.15,floors=[];
  for(const side of [-1,1]){const e=make([w/2-.35,.28,d-.7],side*w/4,y,0,home?0x9d825e:0xb8b5a6);e.role='floor';e.floorStory=story;e.mesh.name='Floor '+(story+1);floors.push(e);added.push(e);}
  const kinds=industrial?['pallet','crate']:shop?['shelf',type==='gun'?'rack':'desk']:home?['sofa','table']:['desk','chair'];
  for(let i=0;i<2;i++){const kind=kinds[i],height=kind==='sofa'?.53:kind==='chair'?.55:kind==='table'?.76:kind==='pallet'?.25:kind==='crate'?.65:kind==='shelf'||kind==='rack'?1.05:.86;item(kind,(i?1:-1)*w*.23,y+height,(i?1:-1)*d*.14,floors[i]);}
 }
 return added;
}
