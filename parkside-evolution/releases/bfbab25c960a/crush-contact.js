// Narrow contact preparation for the actual bumper, chassis and tire colliders.
// This does not move bodies or apply impulses; Cannon solves the physical hit.
export function createCrushContact(C){
 const center=new C.Vec3(),local=new C.Vec3(),nearest=new C.Vec3(),truckLocal=new C.Vec3();
 return function contact(chassis,body,size){
  if(chassis.position.distanceTo(body.position)>chassis.boundingRadius+body.boundingRadius+.1)return null;
  for(let i=0;i<chassis.shapes.length;i++){
   const offset=chassis.shapeOffsets[i],shape=chassis.shapes[i];chassis.pointToWorldFrame(offset,center);body.pointToLocalFrame(center,local);
   local.set(Math.max(-size[0]/2,Math.min(size[0]/2,local.x)),Math.max(-size[1]/2,Math.min(size[1]/2,local.y)),Math.max(-size[2]/2,Math.min(size[2]/2,local.z)));
   body.pointToWorldFrame(local,nearest);chassis.pointToLocalFrame(nearest,truckLocal);truckLocal.vsub(offset,truckLocal);const m=.045;
   const touching=shape instanceof C.Box?Math.abs(truckLocal.x)<=shape.halfExtents.x+m&&Math.abs(truckLocal.y)<=shape.halfExtents.y+m&&Math.abs(truckLocal.z)<=shape.halfExtents.z+m:
    shape instanceof C.Cylinder&&Math.abs(truckLocal.x)<=shape.height/2+m&&Math.hypot(truckLocal.y,truckLocal.z)<=shape.radiusTop+m;
   if(touching)return nearest.clone();
  }
  return null;
 };
}
