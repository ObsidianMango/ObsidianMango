import * as C from './cannon-es.js';
// Only explicit releases enter this bounded registry; explosions and held objects never score.
const registries=new WeakMap();
function throwsFor(world){if(!registries.has(world))registries.set(world,new Map());return registries.get(world);}
export function cancelToss(world,body){throwsFor(world).delete(body);}
export function registerToss(world,body,kind='part',owner={}){
 const entries=throwsFor(world);entries.delete(body);
 if(entries.size>=32)entries.delete(entries.keys().next().value);
 entries.set(body,{body,kind,owner,generation:owner.carryGeneration,last:{...body.position},start:{...body.position},age:0});
}
export function createTossHoop({T,world,onScore}){
 // One shared compound collider follows the active map. No per-level body accumulation.
 const surface=new C.Material({friction:.18,restitution:.72});
 const collider=new C.Body({mass:0,material:surface,collisionFilterGroup:1,collisionFilterMask:-1});
 collider.userData={kind:'basket backboard'};
 collider.addShape(new C.Box(new C.Vec3(4.5,2.5,.125)),new C.Vec3(0,9,-3.8));
 collider.addShape(new C.Box(new C.Vec3(.25,5,.25)),new C.Vec3(0,5,-4));
 world.addBody(collider);
 // Contact materials are explicit because several debris materials override restitution.
 const contacts=new Set();function materials(){for(const b of world.bodies)if(b.material&&!contacts.has(b.material.id)){contacts.add(b.material.id);world.addContactMaterial(new C.ContactMaterial(surface,b.material,{friction:.18,restitution:.72}));}}
 const root=new T.Group();root.name='Scrapyard basket';
 const orange=new T.MeshStandardMaterial({color:0xff7738,roughness:.6,emissive:0xff7738,emissiveIntensity:.12});
 const white=new T.MeshStandardMaterial({color:0xf2e8cf,roughness:.8});
 const steel=new T.MeshStandardMaterial({color:0x35484a,roughness:.8});
 function box(w,h,d,x,y,z,material){const m=new T.Mesh(new T.BoxGeometry(w,h,d),material);m.position.set(x,y,z);root.add(m);return m;}
 box(.5,10,.5,0,5,-4,steel);box(9,5,.25,0,9,-3.8,white);
 box(3,.12,.1,0,8.5,-3.6,orange);box(.12,2,.1,-1.5,7.5,-3.6,orange);box(.12,2,.1,1.5,7.5,-3.6,orange);
 const rim=new T.Mesh(new T.TorusGeometry(3.3,.16,8,40),orange);rim.rotation.x=Math.PI/2;rim.position.y=6.5;root.add(rim);
 // A single line mesh gives the oversized net its shape without cloth simulation.
 const points=[];for(let i=0;i<20;i++){const a=i*Math.PI/10,b=(i+1)*Math.PI/10;points.push(Math.cos(a)*3.3,6.5,Math.sin(a)*3.3,Math.cos(b)*2.5,4.5,Math.sin(b)*2.5);points.push(Math.cos(a)*3.3,6.5,Math.sin(a)*3.3,Math.cos(a)*2.5,4.5,Math.sin(a)*2.5);}
 root.add(new T.LineSegments(new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute(points,3)),new T.LineBasicMaterial({color:0xf5e8cc})));
 const court=new T.Mesh(new T.RingGeometry(8.8,9,48),white);court.rotation.x=-Math.PI/2;court.position.y=.04;root.add(court);
 const cv=document.createElement('canvas');cv.width=512;cv.height=128;const ctx=cv.getContext('2d');ctx.fillStyle='#213539';ctx.fillRect(0,0,512,128);ctx.fillStyle='#fff1cc';ctx.font='bold 44px sans-serif';ctx.textAlign='center';ctx.fillText('SCRAP SHOTS',256,54);ctx.font='24px sans-serif';ctx.fillText('TOSS IT • CASH IN',256,96);const map=new T.CanvasTexture(cv);map.colorSpace=T.SRGBColorSpace;const sign=new T.Mesh(new T.PlaneGeometry(8,2),new T.MeshBasicMaterial({map,side:T.DoubleSide}));sign.position.set(0,12.7,-3.45);map.anisotropy=4;root.add(sign);
 let center={x:0,y:6.5,z:0},baskets=0,lastAward=null,flash=0;
 const entries=throwsFor(world);
 function reset(){entries.clear();baskets=0;lastAward=null;flash=0;orange.emissiveIntensity=.12;}
 function show(view,secret=false){reset();view.group.add(root);const x=secret?0:65,z=secret?235:80;root.position.set(view.ox+x,0,z);collider.position.set(view.ox+x,0,z);collider.aabbNeedsUpdate=true;world.broadphase.dirty=true;materials();center={x:view.ox+x,y:6.5,z};}
 function update(dt,active=true){if(!active){entries.clear();return;}flash=Math.max(0,flash-dt);orange.emissiveIntensity=flash>0?1.4:.12;
  for(const [body,f] of entries){f.age+=dt;const p=body.position,o=f.owner;
   if(f.age>9||o.held||o.heldByHulk||o.active===false||o.carryGeneration!==f.generation||!world.bodies.includes(body)){entries.delete(body);continue;}
   // Sweep fast throws that cross the thin board between physics steps.
   const boardZ=center.z-3.8,side=f.last.z>=boardZ?1:-1,face=boardZ+side*.125;
   if((f.last.z-face)*side>0&&(p.z-face)*side<=0&&body.velocity.z*side<0){
    const u=(f.last.z-face)/(f.last.z-p.z),x=f.last.x+(p.x-f.last.x)*u,y=f.last.y+(p.y-f.last.y)*u;
    if(Math.abs(x-center.x)<4.5&&y>=6.5&&y<=11.5){const dz=face+side*.3-p.z;for(const b of o.bodies||[body]){b.position.z+=dz;if(b.velocity.z*side<0)b.velocity.z*=-.72;b.aabbNeedsUpdate=true;b.wakeUp();}}
   }
   if(f.last.y>center.y&&p.y<=center.y){const t=(f.last.y-center.y)/(f.last.y-p.y),x=f.last.x+(p.x-f.last.x)*t,z=f.last.z+(p.z-f.last.z)*t;
    if(Math.hypot(x-center.x,z-center.z)<3.05){const distance=Math.hypot(f.start.x-center.x,f.start.z-center.z),long=distance>=14,base=f.kind==='person'?200:f.kind==='tire'?150:100;lastAward={kind:f.kind,points:base*(long?2:1),cash:(f.kind==='person'?20:f.kind==='tire'?15:10)*(long?2:1),long,distance};baskets++;flash=1;entries.delete(body);onScore(lastAward);continue;}
   }f.last={...p};
  }
 }
 return{root,collider,show,reset,update,getInfo:()=>({center:{...center},baskets,lastAward,activeThrows:entries.size})};
}
