// Cached, merged view models: detailed silhouettes without a draw call per finger.
export function createFirstPersonView(T,root){
 const skin=new T.MeshStandardMaterial({color:0xd0a086,roughness:.72}),sleeve=new T.MeshStandardMaterial({color:0x22272b,roughness:.9}),steel=new T.MeshStandardMaterial({color:0x57606a,metalness:.72,roughness:.3}),dark=new T.MeshStandardMaterial({color:0x171c22,metalness:.35,roughness:.55}),rubber=new T.MeshStandardMaterial({color:0x3a3530,roughness:.92}),sight=new T.MeshStandardMaterial({color:0xbdd7b1,emissive:0x244825,roughness:.5});
 const cube=new T.BoxGeometry(1,1,1).toNonIndexed(),ball=new T.SphereGeometry(1,12,8).toNonIndexed(),tube=new T.CylinderGeometry(1,1,1,12).toNonIndexed(),scratch=new T.Object3D(),v=new T.Vector3(),n=new T.Vector3(),nm=new T.Matrix3();
 const cache=new Map();let batches=new Map(),recoil=0,clock=0,current=null,powered=false,color=0xd0a086;
 function shape(geo,material,x,y,z,sx,sy,sz,rx=0,ry=0,rz=0){let b=batches.get(material);if(!b){b={p:[],n:[]};batches.set(material,b);}scratch.position.set(x,y,z);scratch.scale.set(sx,sy,sz);scratch.rotation.set(rx,ry,rz);scratch.updateMatrix();nm.getNormalMatrix(scratch.matrix);for(let i=0;i<geo.attributes.position.count;i++){v.fromBufferAttribute(geo.attributes.position,i).applyMatrix4(scratch.matrix);n.fromBufferAttribute(geo.attributes.normal,i).applyMatrix3(nm).normalize();b.p.push(v.x,v.y,v.z);b.n.push(n.x,n.y,n.z);}}
 const box=(m,...a)=>shape(cube,m,...a),oval=(m,...a)=>shape(ball,m,...a),cylinder=(m,...a)=>shape(tube,m,...a);
 function finish(name){const group=new T.Group();group.name=name;for(const [material,b] of batches){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(b.p,3));g.setAttribute('normal',new T.Float32BufferAttribute(b.n,3));g.computeBoundingSphere();const mesh=new T.Mesh(g,material);mesh.frustumCulled=false;group.add(mesh);}batches=new Map();return group;}
 for(const side of [-1,1]){const x=side*.19;
  oval(sleeve,x,-.44,-.22,.065,.16,.085,.35);cylinder(sleeve,x,-.34,-.31,.064,.045,.065,.45);
  oval(skin,x,-.31,-.37,.052,.075,.044,.3);oval(skin,x,-.255,-.43,.061,.068,.037,.15);
  for(let f=0;f<4;f++){const fx=x+(f-1.5)*.026,z=-.452-Math.sin((f+1)*Math.PI/5)*.014;oval(skin,fx,-.225,z,.015,.041,.018,.55);oval(skin,fx,-.216,z-.024,.015,.021,.021);oval(skin,fx,-.24,z-.037,.014,.023,.016,-.5);}
  oval(skin,x-side*.052,-.264,-.455,.025,.045,.024,0,0,side*.55);
 }
 const hands=finish('Shaped palms, thumbs and curled fingers');root.add(hands);
 function weapon(id){if(cache.has(id))return cache.get(id);const x=.19,y=-.205,z=-.48;
  if(['pistol','machine','grenade'].includes(id)){
   const long=id!=='pistol',launcher=id==='grenade',length=long?.48:.23;
   box(dark,x,y,z-length*.32,.095,.095,length);box(rubber,x,y-.09,z+.04,.071,.15,.085,-.22);
   box(steel,x,y+.052,z-length*.3,.085,.025,length*.92);
   cylinder(steel,x,y,z-length*.95,launcher?.047:.021,launcher?.23:.12,launcher?.047:.021,Math.PI/2);
   cylinder(dark,x,y,z-length*.95-(launcher?.119:.064),launcher?.033:.013,.004,launcher?.033:.013,Math.PI/2);
   box(dark,x,y-.065,z-.045,.072,.012,.10);box(dark,x,y-.037,z-.09,.012,.06,.014);
   box(sight,x,y+.074,z+.035,.014,.015,.014);box(sight,x,y+.073,z-length*.72,.012,.018,.012);
   for(let i=0;i<6;i++)box(steel,x+.048,y+.008,z+.04-i*.014,.004,.043,.006);
   if(long){box(rubber,x,y-.1,z-.11,.07,.19,.09,.12);box(rubber,x,y-.005,z+.19,.085,.10,.18);for(let i=0;i<6;i++)box(dark,x,y-.052,z-.17-i*.026,.10,.019,.012);}
  }else if(id==='hammer'){cylinder(rubber,x,y-.04,z,.022,.33,.022,-.2);box(steel,x,y+.15,z-.04,.23,.075,.08);box(dark,x-.125,y+.15,z-.04,.025,.08,.085);}
  else if(id==='web'){cylinder(steel,x,y-.08,z,.055,.07,.055,Math.PI/2);box(dark,x,y-.025,z-.03,.08,.05,.12);cylinder(sight,x,y-.025,z-.095,.018,.01,.018,Math.PI/2);}
  const g=finish('Detailed '+(id||'unarmed'));cache.set(id,g);return g;
 }
 function equip(id){if(current)root.remove(current);current=weapon(id);root.add(current);current.visible=!powered;}
 function setHulk(active){powered=active;skin.color.set(active?0x70a850:color);hands.scale.setScalar(active?1.22:1);if(current)current.visible=!active;}
 function setSkin(c){color=c;skin.color.set(powered?0x70a850:c);}
 function update(dt,speed=0,carrying=false){clock+=dt;recoil=Math.max(0,recoil-dt*5);const bob=Math.min(1,speed/4);root.position.set(Math.sin(clock*7)*.004*bob,Math.abs(Math.cos(clock*7))*.005*bob,recoil*.055);root.rotation.x=recoil*.09;hands.visible=!carrying;if(current)current.visible=!powered&&!carrying;}
 equip(null);return{equip,setHulk,setSkin,update,kick:()=>{recoil=1;},getInfo:()=>({cachedWeapons:cache.size,handDrawCalls:hands.children.length})};
}
