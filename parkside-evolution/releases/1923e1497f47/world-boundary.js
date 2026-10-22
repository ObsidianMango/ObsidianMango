// One active border, eight shared instanced batches, four solid perimeter colliders.
export function createWorldBoundary({T,C,world,groundMat}){
 const box=new T.BoxGeometry(1,1,1),rock=new T.IcosahedronGeometry(1,1),trunk=new T.CylinderGeometry(.5,.6,1,8),dummy=new T.Object3D(),materials=new Map(),geometries={ground:box,rail:box,posts:box,rocks:rock,hills:rock,trees:rock,trunks:trunk,skyline:box};let current=null,root=null,bodies=[],batches=[],count=0;
 const colors={ground:0x849077,rail:0xc5c2a9,posts:0x697879,rocks:0x7b8174,hills:0x748970,trees:0x496b4f,trunks:0x705943,skyline:0x81949a};
 for(const [key,color]of Object.entries(colors))materials.set(key,new T.MeshStandardMaterial({color,roughness:.88}));
 const waterMat=new T.MeshStandardMaterial({color:0x42768b,roughness:.35,metalness:.15});
 function clear(){if(root)root.parent?.remove(root);for(const m of batches)m.dispose();for(const b of bodies)world.removeBody(b);bodies=[];batches=[];count=0;}
 function show(view,secret=false){if(current===view)return;clear();current=view;root=new T.Group();root.name='World edge';view.group.add(root);const limit=secret?249:106,plans=new Map([...materials.keys()].map(k=>[k,[]]));
  function add(key,x,y,z,w,h,d,yaw=0){plans.get(key).push([view.ox+x,y,z,w,h,d,yaw]);}
  for(const side of [-1,1])for(const axis of [0,1]){
   const x=axis===0?side*limit:0,z=axis===1?side*limit:0,w=axis===0?.8:limit*2+.8,d=axis===1?.8:limit*2+.8;
   const b=new C.Body({mass:0,material:groundMat,shape:new C.Box(new C.Vec3(w/2,.55,d/2)),position:new C.Vec3(view.ox+x,.55,z)});b.userData={kind:'world boundary'};world.addBody(b);bodies.push(b);
   add('ground',axis===0?side*(limit+10):0,-.05,axis===1?side*(limit+10):0,axis===0?22:limit*2+44,.12,axis===1?22:limit*2+44);
   add('rail',x,.55,z,w,1.1,d);add('posts',x,1.14,z,axis===0?.9:limit*2+.8,.09,axis===1?.9:limit*2+.8);
   for(let v=-limit+6;v<limit;v+=8){add('posts',axis===0?x:v,1.35,axis===1?z:v,.17,.8,.17);add('rail',axis===0?x:v,1.74,axis===1?z:v,axis===0?.1:7.8,.1,axis===1?.1:7.8);}
  }
  // Outside the playable edge: layered rocky slopes, broad tree crowns, and coastal water.
  for(let i=0;i<(secret?180:88);i++){
   const a=i*Math.PI*2/(secret?180:88),r=limit+12+(i%4)*7,x=Math.cos(a)*r,z=Math.sin(a)*r;
   add('rocks',x,.5+(i%3)*.28,z,2+(i%4)*.65,1.2+(i%3)*.4,2.2+(i%5)*.35,a);
   if(!secret||x<0||z<0){add('trunks',x,2,z,.45,4,.45);for(let j=0;j<3;j++)add('trees',x+Math.cos(a+j)*1.2,3.7+j*.8,z+Math.sin(a+j)*1.2,2.7+j*.3,2.2,2.8,a);}
  }
  for(let i=0;i<44;i++){const a=i*Math.PI*2/44,r=limit+55+(i%3)*17,x=Math.cos(a)*r,z=Math.sin(a)*r;if(secret&&x>0&&z>0)continue;add('hills',x,2+(i%3)*2,z,25+(i%4)*8,15+(i%5)*5,23+(i%3)*8,a);}
  if(secret){
   for(const [x,z,w,d]of [[340,150,160,200],[150,340,200,160],[340,340,160,160]]){const m=new T.Mesh(box,waterMat);m.position.set(view.ox+x,-.07,z);m.scale.set(w,.08,d);root.add(m);}
   for(let i=0;i<28;i++){const x=-260+(i%14)*15,z=-305-Math.floor(i/14)*24,h=12+(i*7%23);add('skyline',x,h/2,z,10,h,12);add('posts',x,h+.5,z,11,1,13);for(let row=2;row<h-2;row+=3.2)for(let col=-3;col<=3;col+=3)add('rail',x+col,row,z+6.1,.9,1.5,.06);}
  }
  for(const [key,list]of plans){if(!list.length)continue;const m=new T.InstancedMesh(geometries[key],materials.get(key),list.length);m.receiveShadow=true;m.frustumCulled=false;m.name='Border '+key;list.forEach(([x,y,z,w,h,d,a],i)=>{dummy.position.set(x,y,z);dummy.scale.set(w,h,d);dummy.rotation.set(0,a,0);dummy.updateMatrix();m.setMatrixAt(i,dummy.matrix);});m.instanceMatrix.needsUpdate=true;root.add(m);batches.push(m);count+=list.length;}
 }
 return{show,getInfo:()=>({batches:batches.length,instances:count,colliders:bodies.length,activeBorders:root?1:0,sharedGeometries:3})};
}
