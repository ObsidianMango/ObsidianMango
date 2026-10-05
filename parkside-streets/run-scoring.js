export function createRunScoring(storage=localStorage){
 const key='parkside-streets-records-v1';let saved={bank:0,bests:{}};
 try{const value=JSON.parse(storage.getItem(key));if(value&&Number.isFinite(value.bank)&&value.bank>=0&&value.bests&&typeof value.bests==='object')saved=value;}catch{}
 let run,multiplier=1;
 const persist=()=>{try{storage.setItem(key,JSON.stringify(saved));}catch{}};
 function reset(mult=1){multiplier=mult;run={rawPedestrians:0,rawParking:0,rawFailure:0,hits:0,combo:0,maxCombo:0,comboUntil:-1,settled:false,result:null};}
 function snapshot(now=0){const pedestrianPoints=Math.round(run.rawPedestrians*multiplier),parkingPoints=Math.round(run.rawParking*multiplier),failurePoints=Math.round(run.rawFailure*multiplier);return{multiplier,pedestrianPoints,parkingPoints,failurePoints,pending:pedestrianPoints+parkingPoints+failurePoints,hits:run.hits,combo:now<=run.comboUntil?run.combo:0,comboRemaining:Math.max(0,run.comboUntil-now),maxCombo:run.maxCombo,bank:saved.bank,settled:run.settled,result:run.result};}
 function hit(now){if(run.settled)return null;run.combo=now<=run.comboUntil?run.combo+1:1;run.comboUntil=now+5;run.maxCombo=Math.max(run.maxCombo,run.combo);run.hits++;const raw=100+50*Math.min(3,run.combo-1);run.rawPedestrians+=raw;return{points:Math.round(raw*multiplier),...snapshot(now)};}
 function bank({parked,stars=0,elapsed=0,par=0,failures=0,lot,vehicle}){if(run.settled)return run.result;
  if(parked){run.rawParking=1000+stars*250+Math.max(0,Math.floor(par-elapsed))*10;run.rawFailure=failures?600:0;}
  const points=snapshot(),total=points.pending,banked=parked?total:Math.floor(total*.25),id=lot+':'+vehicle,previous=saved.bests[id];saved.bank+=banked;
  const newBest=parked&&(!previous||total>previous.score||(total===previous.score&&elapsed<previous.time));if(newBest)saved.bests[id]={score:total,time:elapsed,stars,maxCombo:run.maxCombo};
  run.settled=true;run.result={...points,total,banked,retained:parked?1:.25,parked,newBest,best:saved.bests[id]?.score||0,bank:saved.bank};persist();return run.result;
 }
 reset();return{reset,hit,bank,snapshot,best:(lot,vehicle)=>saved.bests[lot+':'+vehicle]?.score||0};
}
