// A fixed list of original targets keeps debris, resets and baskets from farming medals.
export const MEDAL_NAMES=['None','Bronze','Silver','Gold'];
export const DESTRUCTION_THRESHOLDS=[.25,.60,.90];
export function createLevelDestruction({onAward=()=>{},onMedal=()=>{}}={}){
 let targets=[],credited=new Set(),earned=0,total=0,medal=0;
 function reset({entries=[],cars=[]}={}){
  const structures=new Map();targets=[];credited=new Set();earned=total=medal=0;
  for(const e of entries){if(e.role==='contents'||e.role==='floor')continue;
   if(e.structure){if(!structures.has(e.structure))structures.set(e.structure,[]);structures.get(e.structure).push(e);}
   else targets.push({kind:e.barrel?'barrel':'prop',entries:[e],value:e.barrel?350:150});
  }
  for(const parts of structures.values())targets.push({kind:'building',entries:parts,value:1200});
  for(const car of cars)targets.push({kind:'car',car,value:300});
  total=targets.reduce((sum,t)=>sum+t.value,0);
 }
 function update(){
  for(const t of targets){if(credited.has(t))continue;
   const done=t.car?t.car.exploded||t.car.damage>=.35:t.entries.filter(e=>e.broken||e.detonated).length>=Math.ceil(t.entries.length*(t.kind==='building'?.6:1));
   if(done){credited.add(t);earned+=t.value;onAward(t.kind,t.value);}
  }
  const ratio=total?earned/total:0,next=DESTRUCTION_THRESHOLDS.filter(v=>ratio>=v).length;
  if(next>medal){medal=next;onMedal(info());}return info();
 }
 function info(){return{earned,total,percent:total?Math.min(100,Math.floor(earned/total*100)):0,medal,name:MEDAL_NAMES[medal],nextPercent:medal<3?Math.round(DESTRUCTION_THRESHOLDS[medal]*100):100,targets:targets.length,destroyed:credited.size,complete:total>0&&earned>=total};}
 return{reset,update,getInfo:info};
}
