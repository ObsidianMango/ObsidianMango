// Persistent, per-vehicle cockpit offsets. Does not change vehicle physics or saves.
export const seatDefaults=Object.freeze({
 e250:Object.freeze({height:1.78,depth:-.35}),
 santafe:Object.freeze({height:1.62,depth:.65}),
 newyorker:Object.freeze({height:1.59,depth:.67}),
 nova:Object.freeze({height:1.54,depth:.68}),
 impala:Object.freeze({height:1.54,depth:.68}),
 montecarlo:Object.freeze({height:1.54,depth:.68})
});
const safe=(v,backup,lo,hi)=>v!==null&&v!==undefined&&v!==''&&Number.isFinite(Number(v))?Math.max(lo,Math.min(hi,Number(v))):backup;
export function createCockpitSeats(storage,namespace='parkside-evolution:v1:seat:'){
 const entries=new Map();
 function defaults(spec){
  const b=seatDefaults[spec.id];
  return b?{...b}:{height:spec.monster?3.55:1.54,depth:spec.monster?.38:.68};
 }
 function get(spec){
  if(!entries.has(spec.id)){
   const base=defaults(spec);let stored={};
   try{stored=JSON.parse(storage.getItem(namespace+spec.id)||'{}')||{}}catch{}
   entries.set(spec.id,{height:safe(stored.height,base.height,.85,4.5),depth:safe(stored.depth,base.depth,-.8,1.6)});
  }
  return entries.get(spec.id);
 }
 function adjust(spec,action){
  const seat=get(spec),base=defaults(spec);
  if(action==='reset')Object.assign(seat,base);
  else if(action==='up')seat.height=safe(seat.height+.08,base.height,.85,4.5);
  else if(action==='down')seat.height=safe(seat.height-.08,base.height,.85,4.5);
  else if(action==='forward')seat.depth=safe(seat.depth-.1,base.depth,-.8,1.6);
  else if(action==='back')seat.depth=safe(seat.depth+.1,base.depth,-.8,1.6);
  else return seat;
  try{storage.setItem(namespace+spec.id,JSON.stringify(seat))}catch{}
  return seat;
 }
 return {get,adjust,defaults};
}
