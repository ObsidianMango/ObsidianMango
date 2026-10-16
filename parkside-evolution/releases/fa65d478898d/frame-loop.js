// Browser scheduling and hidden-tab handling; gameplay advances through a callback.
export function createFrameLoop({frame,quality,request=requestAnimationFrame,now=()=>performance.now(),hidden=()=>document.hidden}){
 let previous=now(),running=false;
 function tick(time){if(!running)return;request(tick);const raw=Math.max(0,(time-previous)/1000);previous=time;quality.sample(raw,!hidden());if(hidden())return;frame(Math.min(.06,raw));}
 return {start(){if(running)return;running=true;previous=now();request(tick);},stop(){running=false;}};
}
