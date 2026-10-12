// Target headroom above 30 FPS; resolution adapts while geometry/physics stay intact.
export function createAdaptiveQuality(renderer,{pixelRatio=1,mobile=false,onChange=()=>{}}={}){
 const ceiling=Math.min(pixelRatio,mobile?1:1.5),floor=Math.min(ceiling,mobile?.55:.65);let ratio=ceiling,average=1/60,slow=0,fast=0,elapsed=0,changes=0,below30=0;
 renderer.setPixelRatio(ratio);
 function change(next){next=Math.max(floor,Math.min(ceiling,next));if(Math.abs(next-ratio)<.01)return;ratio=next;renderer.setPixelRatio(ratio);changes++;onChange();slow=fast=0;}
 function sample(dt,active=true){if(!active||dt<=0||dt>.5)return;elapsed+=dt;below30=dt>1/30?below30+dt:Math.max(0,below30-dt);const measured=Math.min(.1,dt);average+=(measured-average)*Math.min(1,measured*4);
  if(average>1/42){slow+=dt;fast=0;if(slow>(average>1/30?.35:.8))change(ratio-.15);}else if(average<1/56){fast+=dt;slow=0;if(fast>18)change(ratio+.1);}else slow=fast=0;
 }
 return {sample,getInfo:()=>({pixelRatio:+ratio.toFixed(2),estimatedFPS:Math.round(1/average),targetFPS:40,below30Seconds:+below30.toFixed(2),atResolutionFloor:ratio<=floor+.01,changes,mobile,elapsed})};
}
