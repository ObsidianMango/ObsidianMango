// Display poses between fixed physics steps without changing collision geometry.
export function createVehicleMotion(T){
 const pose=()=>({p:new T.Vector3(),q:new T.Quaternion()}),previous=[],current=[];
 let nodes=[];
 function capture(car,reset=false){
  const next=[car.root,...car.assemblies.filter(p=>p.name.startsWith('wheel-')||p.name==='steering-wheel')];
  if(reset||next.length!==nodes.length||next.some((n,i)=>n!==nodes[i])){
   nodes=next;previous.length=current.length=0;
   for(const node of nodes){const a=pose(),b=pose();a.p.copy(node.position);a.q.copy(node.quaternion);b.p.copy(a.p);b.q.copy(a.q);previous.push(a);current.push(b);}
   return;
  }
  nodes.forEach((node,i)=>{previous[i].p.copy(current[i].p);previous[i].q.copy(current[i].q);current[i].p.copy(node.position);current[i].q.copy(node.quaternion);});
 }
 function render(alpha){nodes.forEach((node,i)=>{if(i&&!node.userData.attached)return;node.position.lerpVectors(previous[i].p,current[i].p,alpha);node.quaternion.slerpQuaternions(previous[i].q,current[i].q,alpha);});}
 return{capture,render};
}

// Full launch power, then a continuous taper instead of an on/off governor.
export function motorForce(power,direction,forwardSpeed,limit=Infinity){
 if(!Number.isFinite(limit))return direction*power;
 const band=Math.min(1.5,limit*.15),u=Math.max(0,Math.min(1,(forwardSpeed*direction-(limit-band))/band));
 return direction*power*(1-u*u*(3-2*u));
}
