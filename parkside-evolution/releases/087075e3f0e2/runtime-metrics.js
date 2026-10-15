// Bounded CPU/frame timing rings. Renderer.info reports GPU submissions, not GPU duration.
export function createRuntimeMetrics(now=()=>performance.now(),capacity=240){
 const bins=new Map();
 function measure(name,fn){const start=now();try{return fn();}finally{sample(name,now()-start);}}
 function sample(name,ms){if(!Number.isFinite(ms)||ms<0)return;let b=bins.get(name);if(!b){b={values:new Float64Array(capacity),count:0,next:0};bins.set(name,b);}b.values[b.next]=ms;b.next=(b.next+1)%capacity;b.count=Math.min(capacity,b.count+1);}
 return{measure,sample,snapshot(){return Object.fromEntries([...bins].map(([name,b])=>{const v=Array.from(b.values.subarray(0,b.count)).sort((a,b)=>a-b);return[name,{samples:b.count,medianMs:v[Math.floor(v.length*.5)]||0,p95Ms:v[Math.min(v.length-1,Math.floor(v.length*.95))]||0,maxMs:v.at(-1)||0}];}));}};
}
