// Comical historical-dictator lookalike dummy. No flags, insignia, blood or gore.
// A tiny visual-only pool avoids creating Cannon bodies when Maybachs explode.
export function createMaybachEjection(T,scene){
 const skin=new T.MeshStandardMaterial({color:0xd0a18a,roughness:.85}),
 uniform=new T.MeshStandardMaterial({color:0x6a6956,roughness:.9}),
 trouser=new T.MeshStandardMaterial({color:0x46463f,roughness:.9}),
 dark=new T.MeshStandardMaterial({color:0x251f1c,roughness:.85}),
 soot=new T.MeshStandardMaterial({color:0x37312d,roughness:1}),
 shirt=new T.MeshStandardMaterial({color:0xb5a48c,roughness:.95});
 const box=new T.BoxGeometry(1,1,1),round=new T.IcosahedronGeometry(1,1);
 function part(root,geo,mat,p,s){const o=new T.Mesh(geo,mat);o.userData.originalMaterial=mat;o.position.set(...p);o.scale.set(...s);root.add(o);return o;}
 const pool=[];
 function build(){
  const g=new T.Group();g.name='Satirical 1940s dictator lookalike ragdoll';g.visible=false;scene.add(g);
  part(g,box,uniform,[0,.17,0],[.57,.75,.31]);
  part(g,box,shirt,[0,.46,-.17],[.19,.17,.02]);
  part(g,round,skin,[0,.78,0],[.215,.30,.21]);
  // unmistakable little square mustache and severe side-combed hairstyle
  part(g,box,dark,[0,.665,-.218],[.102,.044,.032]);
  part(g,round,dark,[0,1.007,.02],[.226,.103,.22]);
  part(g,box,dark,[-.085,1.006,-.185],[.211,.052,.090]);
  part(g,box,dark,[.153,.91,-.078],[.061,.08,.19]);
  part(g,round,skin,[0,.733,-.212],[.044,.088,.053]);
  const arms=[],legs=[];
  for(const side of [-1,1]){
   const a=new T.Group();a.position.set(side*.365,.43,0);g.add(a);
   part(a,box,uniform,[side*.015,-.26,0],[.21,.52,.23]);
   part(a,box,skin,[side*.015,-.58,0],[.13,.12,.14]);arms.push(a);
   const l=new T.Group();l.position.set(side*.165,-.22,.02);g.add(l);
   part(l,box,trouser,[0,-.24,0],[.25,.57,.26]);
   part(l,box,dark,[0,-.51,-.095],[.27,.15,.43]);legs.push(l);
  }
  return {root:g,arms,legs,position:new T.Vector3(),velocity:new T.Vector3(),angle:new T.Vector3(),spin:new T.Vector3(),age:0,active:false,bounces:0,blackened:false};
 }
 function launch(position,velocity,forward){
  let d=pool.find(d=>!d.active);if(!d){if(pool.length>=2)d=pool.reduce((a,b)=>a.age>b.age?a:b);else{d=build();pool.push(d);}}
  d.active=d.root.visible=true;d.age=0;d.bounces=0;d.blackened=false;d.position.copy(position).add(new T.Vector3(0,1.35,0));
  const f=new T.Vector3(forward?.x??0,0,forward?.z??-1).normalize();
  d.velocity.copy(velocity||new T.Vector3()).multiplyScalar(.58).addScaledVector(f,8).add(new T.Vector3(0,10,0));
  d.spin.set(3.5,2.1,4.4);d.angle.set(0,0,0);
  for(const m of d.root.children)if(m.isMesh)m.material=m.userData.originalMaterial||m.material;
  d.root.traverse(m=>{if(m.isMesh){m.userData.originalMaterial??=m.material;m.material=m.userData.originalMaterial;}});
  pose(d);return d;
 }
 function pose(d){d.root.position.copy(d.position);d.root.rotation.set(d.angle.x,d.angle.y,d.angle.z);for(let i=0;i<2;i++){d.arms[i].rotation.x=Math.sin(d.age*14+i)*Math.exp(-d.age*.7)*.8;d.legs[i].rotation.x=-d.arms[i].rotation.x*.65;}d.root.traverse(m=>{if(m.isMesh&&m.userData.originalMaterial)m.material=d.age>2.4&&m.userData.originalMaterial===uniform?soot:m.userData.originalMaterial;});}
 function update(dt){if(!Number.isFinite(dt)||dt<=0)return;dt=Math.min(.05,dt);
  for(const d of pool){if(!d.active)continue;d.age+=dt;d.velocity.y-=17*dt;d.position.addScaledVector(d.velocity,dt);
   d.angle.addScaledVector(d.spin,dt);d.spin.multiplyScalar(Math.exp(-.9*dt));
   if(d.position.y<=.88){d.position.y=.88;if(d.velocity.y<-.5&&d.bounces<2){d.velocity.y*=-.22;d.velocity.x*=.45;d.velocity.z*=.45;d.bounces++;}
   else{d.position.y=.25;d.velocity.set(0,0,0);d.spin.set(0,0,0);d.angle.set(Math.PI/2,0,.15);}}
   pose(d);
   if(d.age>16){d.root.visible=false;d.active=false;}
  }
 }
 function reset(){for(const d of pool){d.active=false;d.root.visible=false;}}
 // Fixed-size replay samples include visibility, age and the entire visual pose.
 function snapshot(){const values=new Float32Array(16);pool.forEach((d,i)=>values.set([d.root.visible?1:0,d.age,...d.root.position.toArray(),d.root.rotation.x,d.root.rotation.y,d.root.rotation.z],i*8));return values;}
 function apply(a,b,u){if(!a||!b)return;for(let i=0;i<2;i++){const k=i*8,visible=(u<1?a:b)[k]>.5;if(visible)while(pool.length<=i)pool.push(build());const d=pool[i];if(!d)continue;d.root.visible=visible;if(!visible)continue;d.age=a[k+1]+(b[k+1]-a[k+1])*u;d.position.set(a[k+2]+(b[k+2]-a[k+2])*u,a[k+3]+(b[k+3]-a[k+3])*u,a[k+4]+(b[k+4]-a[k+4])*u);d.angle.set(a[k+5]+(b[k+5]-a[k+5])*u,a[k+6]+(b[k+6]-a[k+6])*u,a[k+7]+(b[k+7]-a[k+7])*u);pose(d);}}
 return{launch,update,reset,snapshot,apply,getInfo:()=>({active:pool.filter(d=>d.active).length,capacity:2,visualOnly:true,modelCount:pool.length})};
}
