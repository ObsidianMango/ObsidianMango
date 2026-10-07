export function createDestructionObjective({view,crowd,onClear}){
 const credited=new Set();let next=null;
 const cleared=t=>t.kind==='car'?t.car.damage>=.35:t.kind==='barrel'?t.entries.every(e=>e.detonated):t.kind==='building'?t.entries.filter(e=>e.broken).length>=Math.ceil(t.entries.length*.6):t.entries.every(e=>e.broken);
 function all(){return[...view.targets.map(t=>({...t,...(t.kind==='barrel'?{x:t.entries[0].body.position.x-view.ox,z:t.entries[0].body.position.z}:{}),key:'prop:'+t.id,done:cleared(t)})),...crowd.people.map(p=>({key:'person:'+p.i,kind:'person',name:'Pedestrian',district:p.district,x:p.pose[0].p.x-view.ox,z:p.pose[0].p.z,done:p.down}))];}
 function update(x,z,preferred=null){const items=all();for(const t of items)if(t.done&&!credited.has(t.key)){credited.add(t.key);onClear?.(t);}let remaining=items.filter(t=>!t.done);if(preferred){const matching=remaining.filter(preferred);if(matching.length)remaining=matching;}next=remaining.sort((a,b)=>Math.hypot(a.x-x,a.z-z)-Math.hypot(b.x-x,b.z-z))[0]||null;
  if(next?.entries&&next.kind!=='barrel'){const e=next.entries.filter(e=>!e.broken).sort((a,b)=>Math.hypot(a.home.x-view.ox-x,a.home.z-z)-Math.hypot(b.home.x-view.ox-x,b.home.z-z))[0];if(e){next.x=e.home.x-view.ox;next.z=e.home.z;}}
  return info(items);
 }
 function info(items=all()){const byKind={},districts=Array.from({length:4},()=>({total:0,done:0}));for(const t of items){const category=t.kind==='person'?'people':t.kind==='building'?'buildings':'props';byKind[category]??={total:0,done:0};byKind[category].total++;districts[t.district].total++;if(t.done){byKind[category].done++;districts[t.district].done++;}}const done=items.filter(t=>t.done).length;return{total:items.length,done,remaining:items.length-done,complete:items.length>0&&done===items.length,byKind,districts,next:next?{name:next.name,district:next.district,x:next.x,z:next.z}:null};}
 return{update,reset(){credited.clear();next=null;},forgetDistrict(d){for(const t of view.targets)if(t.district===d)credited.delete('prop:'+t.id);next=null;},getInfo:info,remaining:()=>all().filter(t=>!t.done)};
}

export function createBarrelEffects(T,scene){
 const geometry=new T.IcosahedronGeometry(1,1),ringGeometry=new T.RingGeometry(.85,1,32),pool=Array.from({length:8},()=>{const root=new T.Group(),fire=new T.Mesh(geometry,new T.MeshBasicMaterial({color:0xffba45,transparent:true,depthWrite:false})),smoke=new T.Mesh(geometry,new T.MeshBasicMaterial({color:0x43484b,transparent:true,depthWrite:false})),ring=new T.Mesh(ringGeometry,new T.MeshBasicMaterial({color:0xffd798,transparent:true,depthWrite:false,side:T.DoubleSide}));ring.rotation.x=-Math.PI/2;root.add(fire,smoke,ring);scene.add(root);root.visible=false;return{root,fire,smoke,ring,age:10};});let cursor=0;
 function show(point){const e=pool[cursor++%pool.length];e.root.position.copy(point);e.age=0;e.root.visible=true;}
 function update(dt){for(const e of pool){e.age+=dt;const a=e.age;e.root.visible=a<3;if(!e.root.visible)continue;e.fire.visible=a<.7;e.fire.scale.setScalar(.6+Math.sin(Math.min(1,a/.7)*Math.PI)*4);e.fire.material.opacity=Math.max(0,1-a/.7);e.fire.material.color.setHSL(.10-a*.1,1,.6);e.smoke.position.y=1+a*3;e.smoke.scale.set(1.5+a*2.2,1.2+a*2,1.5+a*2.2);e.smoke.material.opacity=Math.max(0,.6-a*.2);e.ring.position.y=-e.root.position.y+.10;e.ring.scale.setScalar(1+a*28);e.ring.material.opacity=Math.max(0,.8-a*1.5);}}
 return{show,update,clear(){for(const e of pool){e.age=10;e.root.visible=false;}}};
}
