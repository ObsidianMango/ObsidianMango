// Preserve the authored garage model's individual breakaway assemblies when borrowing traffic cars.
// Parked traffic already contains correctly named, detailed vehicle panel groups.
export function prepareBorrowedCar(T,item,garage,scoreMultiplier=1){
 const model=garage.find(g=>g.config.id===item.model);
 if(!model)throw Error('Cannot borrow an unknown fleet vehicle: '+String(item.model));
 const source=item.mesh.clone(true);
 source.name='Borrowed '+model.config.name;
 source.visible=true;
 source.position.set(0,0,0);
 source.quaternion.identity();
 source.scale.set(1,1,1);
 source.updateMatrixWorld(true);
 const parts=source.children.filter(p=>p.isGroup&&p.name&&p.children.length>0);
 if(parts.length<6||!parts.some(p=>p.name==='engine')||!parts.some(p=>p.name==='wheel-front-right')||!parts.some(p=>p.name==='wheel-rear-left')){
  throw Error('Borrowed vehicle is missing detailed breakaway assemblies');
 }
 // Preserve the current scaled park-car shape; restore() must not enlarge it back to full-size.
 for(const p of parts){
  const size=new T.Box3().setFromObject(p).getSize(new T.Vector3());
  p.userData={...p.userData,home:p.position.clone(),homeQuaternion:p.quaternion.clone(),homeScale:p.scale.clone(),size,attached:true};
 }
 const front=parts.find(p=>p.name==='wheel-front-right'),rear=parts.find(p=>p.name==='wheel-rear-right');
 const originalFront=Math.max(.01,Math.abs(model.config.front));
 const visualFactor=Math.max(.35,Math.min(1.25,Math.abs(front.position.z)/originalFront));
 // Keep the real model identity and driving character, scaled to match the parked instance.
 const config={...model.config,
  id:model.config.id,baseId:model.config.baseId||model.config.id,
  name:model.config.name,
  power:model.config.power,mass:model.config.mass,
  radius:model.config.radius*visualFactor,
  track:Math.abs(front.position.x),
  front:front.position.z,rear:rear.position.z,
  offset:model.config.offset*visualFactor,
  center:model.config.center*visualFactor,
  box:model.config.box.map(n=>n*visualFactor),
  halfWidth:(model.config.halfWidth||model.config.box[0])*visualFactor,
  halfLength:(model.config.halfLength||model.config.box[2])*visualFactor,
  scoreMultiplier,golden:false};
 return {source,parts,config,materials:model.materials};
}
