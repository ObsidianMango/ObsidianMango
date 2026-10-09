export function createVanFailures({random=Math.random,onLoosePart=()=>{}}={}){
 let enabled=false,phase='idle',kind=null,remaining=0,next=0,count=0,warningTime=0;
 function reset(active){enabled=active;phase='idle';kind=null;remaining=0;count=0;warningTime=0;next=18+random()*12;}
 function warn(type){if(!enabled||phase!=='idle')return false;kind=type;phase='warning';remaining=2;return true;}
 function update(dt,{moving,nearBay}){if(!enabled)return;
  warningTime=Math.max(0,warningTime-dt);
  if(phase==='idle'){if(moving&&!nearBay){next-=dt;if(next<=0)warn(['loose','brakes','throttle'][Math.floor(random()*3)]);}return;}
  if(phase==='warning'&&nearBay){phase='idle';kind=null;next=10;remaining=0;return;}
  remaining-=dt;if(remaining>0)return;
  if(phase==='warning'){count++;if(kind==='loose'){onLoosePart();warningTime=2;phase='idle';kind='loose';next=24+random()*16;}else{phase='active';remaining=4+random()*2;}}
  else{phase='idle';kind=null;next=24+random()*16;}
 }
 function snapshot(){let message='';if(phase==='warning')message=kind==='brakes'?'BRAKE FADE IN '+Math.ceil(remaining)+'s':kind==='throttle'?'THROTTLE CUT IN '+Math.ceil(remaining)+'s':'LOOSE PART';else if(phase==='active')message=(kind==='brakes'?'BRAKE FADE':'THROTTLE CUT')+' · '+Math.ceil(remaining)+'s';else if(warningTime>0)message='PART LOST';return{enabled,phase,kind,remaining,count,message,brakeFactor:phase==='active'&&kind==='brakes'?.12:1,throttleFactor:phase==='active'&&kind==='throttle'?0:1};}
 return{reset,update,snapshot,warn};
}
