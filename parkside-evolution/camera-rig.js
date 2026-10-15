// Vehicle-space first-person camera and persistent, per-car seat adjustment.
// Local z is forward-negative; positions never alter the physical vehicle or its model.
const presets=Object.freeze({
  nova:[1.54,.68],impala:[1.54,.68],montecarlo:[1.54,.68],roadster:[1.54,.68],
  santafe:[1.49,.10],newyorker:[1.49,.10],
  e250:[1.62,-.43],maybach:[1.56,.10],
  jalopy:[1.47,.09],suburban:[1.65,.13],colorado:[1.58,.12]
});
const limit=(v,lo,hi)=>Math.min(hi,Math.max(lo,v));
export function driverEye(spec,root,offset={y:0,z:0},out={}){
  const s=presets[spec.id]||[1.52,.12];
  const x=root?.userData?.steeringX;
  out.x=spec.bike?0:(Number.isFinite(x)?x:-.36);
  out.y=(spec.bike?1.45:spec.monster?3.55:s[0])+limit(Number(offset?.y)||0,-.25,.28);
  out.z=(spec.bike?-.15:spec.monster?.38:s[1])+limit(Number(offset?.z)||0,-.42,.24);
  return out;
}
export function createSeatAdjuster(storage,key='parkside-seat-offsets-v1'){
  let saved={};
  try{
    const parsed=JSON.parse(storage.getItem(key)||'{}');
    if(parsed&&typeof parsed==='object'&&!Array.isArray(parsed))saved=parsed;
  }catch{}
  const cache=new Map();
  function get(id){
    if(!cache.has(id)){
      const v=saved[id];
      cache.set(id,{y:limit(Number.isFinite(v?.y)?v.y:0,-.25,.28),z:limit(Number.isFinite(v?.z)?v.z:0,-.42,.24)});
    }
    return cache.get(id);
  }
  function persist(){
    try{storage.setItem(key,JSON.stringify(saved));}catch{}
  }
  function adjust(id,axis,delta){
    if(axis!=='y'&&axis!=='z')return get(id);
    const offset=get(id),bounds=axis==='y'?[-.25,.28]:[-.42,.24];
    offset[axis]=Math.round(limit(offset[axis]+delta,...bounds)*1000)/1000;
    saved[id]={...offset};persist();return offset;
  }
  function reset(id){const offset=get(id);offset.y=0;offset.z=0;delete saved[id];persist();return offset;}
  return {get,adjust,reset};
}
export function cameraHeading(quaternion,T){
  const forward=new T.Vector3(0,0,-1).applyQuaternion(quaternion);
  return Math.atan2(-forward.x,-forward.z);
}
export function cameraBlend(dt,firstPerson){
  return firstPerson?1:1-Math.exp(-Math.max(0,dt)*9);
}
