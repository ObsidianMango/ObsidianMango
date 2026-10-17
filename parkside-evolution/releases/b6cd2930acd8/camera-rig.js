// Camera framing helpers, shared by cockpit and chase views.
// Keep vehicle-specific eye geometry out of the main frame loop.
export function driverEye(spec,root){
  const steeringX=root?.userData?.steeringX;
  return {
    x:spec.bike?0:(Number.isFinite(steeringX)?steeringX:-.36),
    y:spec.bike?1.45:spec.monster?3.55:1.54,
    z:spec.bike?-.15:spec.monster?.38:.68
  };
}
export function cameraHeading(quaternion,T){
  const forward=new T.Vector3(0,0,-1).applyQuaternion(quaternion);
  return Math.atan2(-forward.x,-forward.z);
}
export function cameraBlend(dt,firstPerson){
  return firstPerson?1:1-Math.exp(-Math.max(0,dt)*9);
}
