// Headless Cannon CPU and scene-graph measurements; not GPU time or device FPS.
import {pathToFileURL} from 'node:url';import path from 'node:path';
const root=path.resolve(process.argv[2]||new URL('..',import.meta.url).pathname),{bootGame}=await import(pathToFileURL(path.join(root,'tests/helpers/game.mjs'))),{app,frame}=await bootGame(),t=app.test,results=[];
for(const level of [0,25,26]){
 t.loadLevel(level);app.start();t.setState('running');
 if(level===26)for(const b of t.secretView.buildings.slice(0,7))t.environment.blast(b.target.entries[0].home,2);
 for(let i=0;i<30;i++)frame();
 const durations=[];for(let i=0;i<180;i++){const at=performance.now();t.step(1/60);durations.push(performance.now()-at);}frame();durations.sort((a,b)=>a-b);
 let nodes=0,calls=0,triangles=0;app.scene.traverse(()=>nodes++);app.scene.traverseVisible(m=>{if(!m.isMesh||!m.layers.test(app.camera.layers)||m.material.visible===false||m.isInstancedMesh&&!m.count)return;calls++;triangles+=(m.geometry.index?.count||m.geometry.attributes.position?.count||0)/3*(m.isInstancedMesh?m.count:1);});
 results.push({level,nodes,meshSubmissions:calls,triangles:Math.round(triangles),bodies:t.world.bodies.length,stepMedianMs:+durations[90].toFixed(3),stepP95Ms:+durations[171].toFixed(3)});
}
console.log(JSON.stringify({kind:'headless physics CPU and scene traversal; no real GPU',results},null,2));
