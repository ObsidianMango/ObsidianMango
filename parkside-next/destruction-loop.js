// Endless jobs reuse the same city. Only an unoccupied district can be rebuilt.
export function createDestructionLoop({view,objective,environment,traffic,scoring,onAward,onJob,protectedPositions=()=>[],storage=localStorage}){
 const key='parkside-destruction-record-v1',order=[3,0,1,2];
 let record={jobs:0,chain:0,score:0};try{const r=JSON.parse(storage.getItem(key));if(r)for(const k of Object.keys(record))if(Number.isFinite(r[k]))record[k]=Math.max(0,r[k]);}catch{}
 let now=0,chain=0,chainUntil=-1,jobs=0,total=0,job=null,waiting=false,completedAt=-1,rebuildAllowed=true;
 const matches=(t,type)=>t.kind!=='person'&&(type==='any'||type==='buildings'&&t.kind==='building'||type==='barrels'&&t.kind==='barrel'||type==='props'&&!['building','barrel'].includes(t.kind));
 const boost=()=>1+Math.min(4,Math.floor(Math.max(0,chain-1)/3))*.5;
 function persist(){record.jobs=Math.max(record.jobs,jobs);record.chain=Math.max(record.chain,chain);record.score=Math.max(record.score,scoring.snapshot(now).pending);try{storage.setItem(key,JSON.stringify(record));}catch{}}
 function canRebuild(d,x,z){if(!rebuildAllowed)return false;for(const p of protectedPositions())if(view.targets.some(t=>t.district===d&&Math.hypot(view.ox+t.x-p.x,t.z-p.z)<60))return false;const px=view.ox+x;return view.targets.filter(t=>t.district===d).every(t=>{
  if(Math.hypot(t.x-x,t.z-z)<60)return false;
  return (t.entries||[t.car]).every(e=>Math.hypot(e.body.position.x-px,e.body.position.z-z)>60);
 });}
 function prepare(x,z){const remaining=objective.remaining().filter(t=>t.district===job.district&&matches(t,job.type));
  if(remaining.length>=job.quota){waiting=false;return true;}
  if(environment.getInfo().queuedExplosions||!canRebuild(job.district,x,z)){waiting=true;return false;}
  environment.resetDistrict(job.district);traffic.resetDistrict(job.district);objective.forgetDistrict(job.district);waiting=false;
  // There are always enough reusable props, even after all pedestrians stay down.
  const available=objective.remaining().filter(t=>t.district===job.district&&matches(t,job.type)).length;
  job.quota=Math.max(1,Math.min(job.quota,available));job.started=now;return true;
 }
 function select(x,z){const district=order[jobs%4],types=['any','barrels','buildings','props'],type=types[(Math.floor(jobs/4)+jobs%4)%4],tier=Math.min(6,Math.floor(jobs/8));
  job={number:jobs+1,district,type,quota:type==='buildings'?2+Math.min(2,tier):type==='barrels'?4+Math.min(4,tier):type==='props'?8+tier:10+tier,done:0,started:now,bonusTime:90+tier*10};completedAt=-1;prepare(x,z);
 }
 function checkpoint(vehicle,elapsed){return scoring.checkpoint({lot:24,vehicle,elapsed});}
 function clear(t){if(t.kind==='person')return;chain=now<=chainUntil?chain+1:1;chainUntil=now+10;total++;const points=scoring.destroy(t.kind,boost());
  onAward?.(points,chain,boost());record.chain=Math.max(record.chain,chain);
  if(!waiting&&completedAt<0&&t.district===job.district&&matches(t,job.type)){job.done++;if(job.done>=job.quota)completedAt=now;}
 }
 function update(dt,x,z,vehicle,elapsed,allowRebuild=true){rebuildAllowed=allowRebuild;now+=dt;if(now>chainUntil)chain=0;
  if(waiting)prepare(x,z);
  if(completedAt>=0&&now-completedAt>=1.2){const quick=completedAt-job.started<=job.bonusTime,bonus=(1000+Math.min(5000,jobs*150))*(quick?1.5:1);scoring.bonus(bonus);jobs++;const banked=checkpoint(vehicle,elapsed);persist();onJob?.({number:jobs,banked,quick});select(x,z);}
 }
 function info(){const d=job?.district??3,signX=d===0||d===3?-1:1,signZ=d<2?-1:1;return{job:job?{...job}:null,jobs,total,chain,multiplier:boost(),chainRemaining:Math.max(0,chainUntil-now),waiting,completed:completedAt>=0,bonusRemaining:job?Math.max(0,job.bonusTime-(now-job.started)):0,record:{...record},escape:{x:-signX*100,z:-signZ*100,name:'Leave the rebuild zone',district:d}};}
 return{clear,update,checkpoint,getInfo:info,preferred:t=>!waiting&&t.district===job?.district&&matches(t,job.type),reset(x=0,z=210){now=0;chain=0;chainUntil=-1;jobs=0;total=0;select(x,z);},save(vehicle,elapsed){checkpoint(vehicle,elapsed);persist();}};
}
