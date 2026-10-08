// Fixed-capacity district batches. Attached details follow the actual broken panels.
export function createSecretDetail(T,view){
 const box=new T.BoxGeometry(1,1,1),leaf=new T.IcosahedronGeometry(1,1),stone=new T.IcosahedronGeometry(1,0),obj=new T.Object3D(),matrix=new T.Matrix4(),batches=[],plans=[];
 const colors={trim:0xd2d0b6,glass:0x486e79,metal:0x657679,leaf:0x568951,stone:0x9c9c85,curb:0xbbbba5,soil:0x67784d,horizon:0x8da2a5,hill:0x97ac8c,wood:0x95744e,fabric:0x657d6f,paper:0xd4c8ad};
 const mats=Object.fromEntries(Object.entries(colors).map(([k,color])=>[k,new T.MeshStandardMaterial({color,roughness:k==='glass'?.35:.87})]));
 function add(d,key,x,y,z,w,h,l,source=null,turn=0,part=null){plans.push({d,key,x,y,z,w,h,l,source,turn,part});}
 for(const t of view.targets){
  const d=t.district;
  if(t.kind==='tree'){
   const trunk=t.entries[0];for(const child of [...trunk.mesh.children])child.removeFromParent();
   for(let i=0;i<9;i++){const a=i*2.399,r=i===0?0:1.35;add(d,'leaf',Math.cos(a)*r,3.3+(i%3)*1.15,Math.sin(a)*r,1.8+(i%2)*.5,1.7,1.8,trunk.mesh);}
   add(d,'metal',0,1.8,0,.16,1.8,.16,trunk.mesh,.6);
  }
  if(t.kind==='building'){
   for(const e of t.entries){const [w,h,l]=e.size;
    if(e.role==='contents'){for(const p of e.contentsParts)add(d,p.key,p.x,p.y,p.z,p.w,p.h,p.d,e.mesh,0,p);continue;}
    if(e.role==='floor'){for(let i=-2;i<=2;i++)add(d,'wood',i*w/5,.15,0,.035,.015,l,e.mesh);continue;}
    if(h<1){add(d,'metal',0,.7,0,1.4,1.15,1.2,e.mesh);add(d,'glass',0,.3,Math.min(2,l*.25),Math.min(2.5,w*.6),.18,1.4,e.mesh);continue;}
    if(Math.min(w,l)>.8)continue;
    const front=l<w;
    for(const side of [-1,1]){add(d,'trim',front?side*w*.24:0,0,front?-.32:side*l*.24,front?Math.min(2.8,w*.32):.18,.12,front?.18:Math.min(2.8,l*.32),e.mesh);}
    add(d,'trim',0,h*.42,0,w+.12,.13,l+.12,e.mesh);
   }
   if(!t.name.includes('crane')){
    const xs=t.entries.map(e=>e.mesh.position.x-view.ox),zs=t.entries.map(e=>e.mesh.position.z),w=Math.max(...xs)-Math.min(...xs)+4,l=Math.max(...zs)-Math.min(...zs)+4;
    add(d,'curb',t.x,.055,t.z,w,.08,l);
    // Pavement seams add scale without additional colliders.
    for(let i=-2;i<=2;i++)add(d,'metal',t.x+i*w/5,.101,t.z,.025,.008,l);
   }
  }
  if(t.kind==='cargo'){const e=t.entries[0];for(let i=-5;i<=5;i++)add(d,'metal',i,0,3.08,.06,2.8,.06,e.mesh);add(d,'trim',5,0,3.12,.08,2.6,.07,e.mesh);}
  if(t.kind==='light'){const e=t.entries[0];add(d,'metal',.6,2.18,0,1.3,.12,.6,e.mesh);}
 }
 // Curbs, crossings and patchwork belong to the avenues, leaving wide driving lanes.
 for(const x of [-220,-70,0,70,220])for(let z=-204;z<=204;z+=24){const d=x<0?(z<0?0:3):(z<0?1:2),side=x===0?15:9;for(const sign of [-1,1])add(d,'curb',x+sign*side,.06,z,1.25,.1,22);}
 for(const z of [-220,-70,0,70,220])for(let x=-204;x<=204;x+=24){const d=x<0?(z<0?0:3):(z<0?1:2),side=z===0?15:9;for(const sign of [-1,1])add(d,'curb',x,.06,z+sign*side,22,.1,1.25);}
 for(const x of [-70,70])for(const z of [-70,70])for(let i=0;i<7;i++)add(x<0?(z<0?0:3):(z<0?1:2),'trim',x-5+i*1.7,.055,z+11,1,.025,5);
 for(let i=0;i<120;i++){const x=-206+(i%12)*15,z=32+Math.floor(i/12)*19;if(Math.abs(x+70)<14||Math.abs(z-70)<14)continue;add(3,i%4?'soil':'stone',x,.2,z,1.2,.4,1.5,null,i*.6);}

 const keys=new Set(plans.map(p=>p.d+':'+p.key));
 for(const key of keys){const list=plans.filter(p=>p.d+':'+p.key===key),d=list[0].d,type=list[0].key,mesh=new T.InstancedMesh(type==='leaf'||type==='hill'?leaf:type==='stone'?stone:box,mats[type],list.length);mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);mesh.frustumCulled=false;mesh.receiveShadow=true;mesh.castShadow=false;view.group.add(mesh);batches.push({mesh,list,d,type});}
 const centers=[[-120,-120],[120,-120],[120,120],[-120,120]],sources=new Set(plans.filter(p=>p.source).map(p=>p.source)),axis=new T.Vector3(0,0,1),tint=new T.Color();let timer=1;
 function update(dt,x,z,force=false){timer+=dt;if(!force&&timer<.15)return;timer=0;
  for(const t of view.targets)for(const e of t.entries||[]){e.mesh.visible=force||Math.hypot(e.mesh.position.x-view.ox-x,e.mesh.position.z-z)<(t.kind==='building'?300:200);}
  for(const source of sources)source.updateWorldMatrix(true,false);
  for(const b of batches){const [cx,cz]=centers[b.d];b.mesh.visible=force||b.type==='horizon'||b.type==='hill'||Math.hypot(cx-x,cz-z)<275;if(!b.mesh.visible)continue;
   b.list.forEach((p,i)=>{obj.position.set(p.x+(p.source?0:view.ox),p.y,p.z);obj.scale.set(p.w,p.h,p.l);obj.quaternion.setFromAxisAngle(axis,p.turn);
    if(p.source){obj.position.divide(p.source.userData.detailScale);obj.scale.divide(p.source.userData.detailScale);if(!p.source.visible||p.part?.detached&&(p.source.userData.damage||0)>=.7)obj.scale.setScalar(0);}
    obj.updateMatrix();matrix.copy(obj.matrix);if(p.source)matrix.premultiply(p.source.matrixWorld);b.mesh.setMatrixAt(i,matrix);const dark=p.source?Math.max(.12,1-(p.source.userData.damage||0)*.45-(p.source.userData.charred||0)*.65):1;tint.setRGB(dark,dark,dark);b.mesh.setColorAt(i,tint);
   });b.mesh.instanceMatrix.needsUpdate=true;b.mesh.instanceColor.needsUpdate=true;
  }
 }
 for(const p of plans)if(p.source&&!p.source.userData.detailScale)p.source.userData.detailScale=p.source.scale.clone();
 update(0,0,0,true);
 return{update,getInfo:()=>({batches:batches.length,instances:plans.length,capacity:plans.length})};
}
