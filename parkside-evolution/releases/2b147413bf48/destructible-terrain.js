import {createSurfaceTextures} from './scenery-detail.js';
// Pavement overlays and parking paint stay flat: wheel contact must stay flat too.
// Bounded surface scars provide blast damage without invisible holes under those overlays.
export function createDestructibleTerrain({T,C,scene,world,ground}){
 const textures=createSurfaceTextures(T);let half=110,step=2,count=111,data=Array.from({length:count},()=>Array(count).fill(0)),shape;const craters=[];
 function install(){while(ground.shapes.length)ground.removeShape(ground.shapes[0]);shape=new C.Heightfield(data,{elementSize:step});ground.addShape(shape);ground.quaternion.setFromEuler(-Math.PI/2,0,0);}install();
 const grass=new T.Mesh(new T.PlaneGeometry(220,220,110,110),new T.MeshStandardMaterial({color:0x8d9e81,roughness:1,map:textures.grass})),road=new T.Mesh(new T.PlaneGeometry(96,96,48,48),new T.MeshStandardMaterial({color:0x566260,roughness:1,map:textures.road}));
 for(const m of [grass,road]){m.rotation.x=-Math.PI/2;m.receiveShadow=true;scene.add(m);}let origin=0,key='';
 const scars=new T.Group();scene.add(scars);
 const scarGeometry=new T.CircleGeometry(1,24),scarMaterial=new T.MeshBasicMaterial({color:0x242624,transparent:true,opacity:.64,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2});
 const crackGeometry=new T.BufferGeometry(),vertices=[];
 for(let i=0;i<12;i++){const angle=i*2.399;let x=0,z=0;for(let j=1;j<=3;j++){const r=j/3,a=angle+Math.sin(i*7+j)*.16,nx=Math.cos(a)*r,nz=Math.sin(a)*r;vertices.push(x,0,z,nx,0,nz);x=nx;z=nz;}}
 crackGeometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));
 const crackMaterial=new T.LineBasicMaterial({color:0x171916,transparent:true,opacity:.85,depthWrite:false});
 const scarPool=Array.from({length:8},()=>{const group=new T.Group(),patch=new T.Mesh(scarGeometry,scarMaterial),cracks=new T.LineSegments(crackGeometry,crackMaterial);patch.rotation.x=-Math.PI/2;patch.scale.set(.72,.72,1);cracks.position.y=.003;group.add(patch,cracks);group.visible=false;scars.add(group);return group;});
 function showScars(){scarPool.forEach((group,i)=>{const c=craters[i];group.visible=!!c;if(c){group.position.set(origin+c[0],.075,c[1]);group.scale.set(c[2],1,c[2]);group.rotation.y=i*1.9;}});}
 function height(){return 0;}
 function refresh(){showScars();}
 function reset(ox,style){origin=ox;craters.length=0;key='';const nextHalf=style==='sandbox'?260:110;if(nextHalf!==half){half=nextHalf;step=style==='sandbox'?4:2;count=Math.round(half*2/step)+1;data=Array.from({length:count},()=>Array(count).fill(0));install();grass.geometry.dispose();grass.geometry=new T.PlaneGeometry(half*2,half*2,count-1,count-1);}ground.position.set(ox-half,0,half);ground.aabbNeedsUpdate=true;grass.position.x=road.position.x=ox;road.visible=style!=='sandbox'&&style!=='redbankMarina'&&style!=='riverviewHospital'&&style!=='undici'&&style!=='churchStreet';textures.grass.repeat.set(style==='sandbox'?56:24,style==='sandbox'?56:24);grass.material.color.setHex(style==='lodge'?0xd6ded6:0x8d9e81);road.material.color.setHex(style==='lodge'?0x637171:0x566260);refresh();}
 function blast(point,strength=1){key='';if(craters.length>=8)craters.shift();craters.push([point.x-origin,point.z,4+Math.min(3,strength*2),Math.min(1.15,.35+strength*.4)]);refresh();}
 function snapshot(){return craters.map(c=>c.slice());}
 function apply(a,b,u){const next=u<.5?a:b;if(!next)return;const signature=JSON.stringify(next);if(signature===key)return;key=signature;craters.splice(0,craters.length,...next.slice(-8).map(c=>c.slice()));refresh();}
 return{reset,blast,snapshot,apply,height,getInfo:()=>({craters:craters.length,surfaceScars:craters.length,scarLimit:8,deepest:Math.abs(shape.minValue),width:half*2})};
}

