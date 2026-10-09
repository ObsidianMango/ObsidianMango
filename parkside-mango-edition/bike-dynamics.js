// Arcade rider balance follows the bike's heading, never a fixed world-axis lock.
export function createBikeDynamics(C){
 const forward=new C.Vec3(),up=new C.Vec3(),right=new C.Vec3(),axis=new C.Vec3(),targetUp=new C.Vec3(),correction=new C.Vec3(),localUp=new C.Vec3(0,1,0),localForward=new C.Vec3(0,0,-1);
 let lean=0;
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 function update(dt,body,vehicle,steer,active=true){
  body.quaternion.vmult(localForward,forward);body.quaternion.vmult(localUp,up);
  const horizontal=Math.hypot(forward.x,forward.z);if(horizontal<.05){forward.set(0,0,-1);}else forward.set(forward.x/horizontal,0,forward.z/horizontal);
  right.set(-forward.z,0,forward.x);
  const contacts=vehicle.wheelInfos.filter(w=>w.isInContact),grounded=contacts.length>0;
  // Follow the ramp pitch, but keep the collision chassis balanced across its width.
  let slope=0;for(const w of contacts){const n=w.raycastResult.hitNormalWorld;slope+=Math.atan2(-n.dot(forward),Math.max(.15,n.y));}slope=contacts.length?clamp(slope/contacts.length,-.5,.5):0;
  targetUp.set(-forward.x*Math.sin(slope),Math.cos(slope),-forward.z*Math.sin(slope));
  up.cross(targetUp,axis);const cross=axis.length(),angle=Math.atan2(cross,up.dot(targetUp));
  if(cross>.001)axis.scale(1/cross,axis);else if(up.dot(targetUp)<0)axis.copy(forward);else axis.setZero();
  const blend=1-Math.exp(-dt*(grounded?14:5));
  correction.copy(axis);correction.scale(Math.min(3.5,angle*(grounded?9:4)),correction);
  const yaw=body.angularVelocity.y,turnSpeed=body.velocity.dot(forward),yawTarget=active&&grounded?clamp(Math.tan(steer)*turnSpeed/1.52,-1.65,1.65):yaw;
  body.angularVelocity.x+=(correction.x-body.angularVelocity.x)*blend;
  body.angularVelocity.z+=(correction.z-body.angularVelocity.z)*blend;
  body.angularVelocity.y+=(yawTarget-body.angularVelocity.y)*(1-Math.exp(-dt*(grounded?9:1)));
  // Tire grip removes sideways skating only while touching the road.
  if(grounded){const lateral=body.velocity.dot(right),grip=1-Math.exp(-dt*7);body.velocity.x-=right.x*lateral*grip;body.velocity.z-=right.z*lateral*grip;}
  const targetLean=active&&grounded?clamp(Math.atan2(turnSpeed*yawTarget,9.82),-.48,.48):0;
  lean+=(targetLean-lean)*(1-Math.exp(-dt*7));
 }
 return{update,reset(){lean=0;},get lean(){return lean;}};
}
