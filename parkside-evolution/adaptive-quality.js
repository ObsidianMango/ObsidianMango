// Fast overload protection, with gradual recovery once frame-time headroom returns.
export function createAdaptiveQuality(renderer,{pixelRatio=1,mobile=false,onChange=()=>{}}={}){
 const ceiling=Math.min(pixelRatio,mobile?1.25:1.75),floor=Math.min(ceiling,mobile?.55:.65);
 let ratio=ceiling,average=1/60,slow=0,fast=0,elapsed=0,changes=0,below30=0,raiseCooldown=0,lastRaise=-Infinity;
 renderer.setPixelRatio(ratio);
 function change(next){
  next=Math.max(floor,Math.min(ceiling,next));if(Math.abs(next-ratio)<.01)return;
  if(next>ratio)lastRaise=elapsed;
  else{if(elapsed-lastRaise<4)raiseCooldown=6;lastRaise=-Infinity;}
  ratio=next;renderer.setPixelRatio(ratio);changes++;onChange();slow=fast=0;
 }
 function sample(dt,active=true){
  if(!active||!Number.isFinite(dt)||dt<=0||dt>.5)return;
  elapsed+=dt;raiseCooldown=Math.max(0,raiseCooldown-dt);below30=dt>1/30?below30+dt:Math.max(0,below30-dt);
  const measured=Math.min(.1,dt);average+=(measured-average)*Math.min(1,measured*4);
  if(average>1/42){
   slow+=dt;fast=Math.max(0,fast-dt*2);
   if(slow>(average>1/30?.35:.8))change(ratio-.15);
  }else if(average<1/48){
   slow=Math.max(0,slow-dt*2);fast=Math.min(2,fast+dt);
   if(fast>=2&&raiseCooldown===0)change(ratio+.1);
  }else{
   // A brief dip spends some recovery progress instead of restarting the timer.
   slow=Math.max(0,slow-dt*2);fast=Math.max(0,fast-dt*.5);
  }
 }
 return {sample,getInfo:()=>({pixelRatio:+ratio.toFixed(2),estimatedFPS:Math.round(1/average),targetFPS:40,below30Seconds:+below30.toFixed(2),atResolutionFloor:ratio<=floor+.01,atResolutionCeiling:ratio>=ceiling-.01,recoveryProgress:+(fast/2).toFixed(2),recoveryCooldownSeconds:+raiseCooldown.toFixed(2),changes,mobile,elapsed})};
}
