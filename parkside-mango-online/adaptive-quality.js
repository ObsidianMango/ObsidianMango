// Change buffer resolution after sustained slow frames, never simulation speed.
// Long suspension/menu/thumbnail frames are excluded by the caller.
export function createAdaptiveQuality(renderer,{pixelRatio=1,mobile=false,onChange=()=>{}}={}){
 const ceiling=Math.min(pixelRatio,mobile?1:1.5),floor=Math.min(ceiling,mobile?.65:.8);let ratio=ceiling,average=1/60,slow=0,fast=0,elapsed=0,changes=0;
 renderer.setPixelRatio(ratio);
 function change(next){next=Math.max(Math.min(floor,ceiling),Math.min(ceiling,next));if(Math.abs(next-ratio)<.01)return;ratio=next;renderer.setPixelRatio(ratio);changes++;onChange();slow=fast=0;}
 function sample(dt,active=true){if(!active||dt<=0||dt>.2)return;elapsed+=dt;average+=(dt-average)*Math.min(1,dt*2);if(average>1/38){slow+=dt;fast=0;if(slow>1.5)change(ratio-.15);}else if(average<1/55){fast+=dt;slow=0;if(fast>12)change(ratio+.1);}else slow=fast=0;}
 return {sample,getInfo:()=>({pixelRatio:+ratio.toFixed(2),estimatedFPS:Math.round(1/average),changes,mobile,elapsed})};
}
