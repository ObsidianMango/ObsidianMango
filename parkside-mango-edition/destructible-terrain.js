import {createSurfaceTextures} from './scenery-detail.js?v=clarity-14';
// One active heightfield: craters change both the road surface and wheel contact.
export function createDestructibleTerrain({T,C,scene,world,ground}){
 const textures=createSurfaceTextures(T);let half=110,step=2,count=111,data=Array.from({length:count},()=>Array(count).fill(0)),shape;const craters=[];
 function install(){while(ground.shapes.length)ground.removeShape(ground.shapes[0]);shape=new C.Heightfield(data,{elementSize:step});ground.addShape(shape);ground.quaternion.setFromEuler(-Math.PI/2,0,0);}install();
 const grass=new T.Mesh(new T.PlaneGeometry(220,220,110,110),new T.MeshStandardMaterial({color:0x8d9e81,roughness:1,map:textures.grass})),road=new T.Mesh(new T.PlaneGeometry(96,96,48,48),new T.MeshStandardMaterial({color:0x566260,roughness:1,map:textures.road}));
 for(const m of [grass,road]){m.rotation.x=-Math.PI/2;m.receiveShadow=true;scene.add(m);}let origin=0,key='';
 function height(x,z){let h=0;for(const c of craters){const d=Math.hypot(x-c[0],z-c[1])/c[2];if(d<1)h-=c[3]*Math.pow(1-d*d,2);}return Math.max(-2,h);}
 function refresh(){for(let i=0;i<count;i++)for(let j=0;j<count;j++)data[i][j]=height(i*step-half,half-j*step);shape.updateMinValue();shape.updateMaxValue();shape.update();ground.aabbNeedsUpdate=true;
  for(const m of [grass,road]){const p=m.geometry.attributes.position;for(let i=0;i<p.count;i++)p.setZ(i,height(p.getX(i),-p.getY(i))+(m===road?.015:0));p.needsUpdate=true;m.geometry.computeVertexNormals();}
 }
 function reset(ox,style){origin=ox;craters.length=0;key='';const nextHalf=style==='sandbox'?260:110;if(nextHalf!==half){half=nextHalf;step=style==='sandbox'?4:2;count=Math.round(half*2/step)+1;data=Array.from({length:count},()=>Array(count).fill(0));install();grass.geometry.dispose();grass.geometry=new T.PlaneGeometry(half*2,half*2,count-1,count-1);}ground.position.set(ox-half,0,half);ground.aabbNeedsUpdate=true;grass.position.x=road.position.x=ox;road.visible=style!=='sandbox';textures.grass.repeat.set(style==='sandbox'?56:24,style==='sandbox'?56:24);grass.material.color.setHex(style==='lodge'?0xd6ded6:0x8d9e81);road.material.color.setHex(style==='lodge'?0x637171:0x566260);refresh();}
 function blast(point,strength){if(craters.length>=8)return;craters.push([point.x-origin,point.z,4+Math.min(3,strength*2),Math.min(1.15,.35+strength*.4)]);refresh();}
 function snapshot(){return craters.map(c=>c.slice());}
 function apply(a,b,u){const next=u<.5?a:b;if(!next)return;const signature=JSON.stringify(next);if(signature===key)return;key=signature;craters.splice(0,craters.length,...next.map(c=>c.slice()));refresh();}
 return{reset,blast,snapshot,apply,height,getInfo:()=>({craters:craters.length,deepest:Math.abs(shape.minValue),width:half*2})};
}

