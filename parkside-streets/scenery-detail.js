// Shared geometry and textures; background scenery is built only for visited lots.
export function createSceneryDetail(T){
 const box=new T.BoxGeometry(1,1,1),leaf=new T.SphereGeometry(1,10,7),trunk=new T.CylinderGeometry(.5,.65,1,9);
 const bark=new T.MeshStandardMaterial({color:0x65513f,roughness:1});
 const foliage=new T.MeshStandardMaterial({color:0xffffff,roughness:.95});
 const materials=new Map();
 const material=color=>{if(!materials.has(color))materials.set(color,new T.MeshStandardMaterial({color,roughness:.86}));return materials.get(color);};
 const dummy=new T.Object3D();
 const random=seed=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};

 function tree(parent,group,x,z,ox,snow=false){
  const rng=random(Math.round((x+71)*823+(z+61)*1783));
  parent.geometry=trunk;parent.material=bark;
  const crown=new T.InstancedMesh(leaf,foliage,7);
  crown.position.set(ox+x*2,0,z*2);crown.castShadow=true;crown.receiveShadow=true;
  for(let i=0;i<7;i++){
   const angle=i*Math.PI*2/6,r=i===6?0:1.3+rng()*.4;
   dummy.position.set(Math.cos(angle)*r,3.4+(i===6?1.3:rng()*.7),Math.sin(angle)*r);
   dummy.rotation.set(rng()*.3,rng()*Math.PI,rng()*.2);
   dummy.scale.set(1.4+rng()*.65,1.3+rng()*.65,1.4+rng()*.5);dummy.updateMatrix();crown.setMatrixAt(i,dummy.matrix);
   crown.setColorAt(i,new T.Color(snow?0xc3d4c5:[0x497152,0x587b55,0x6b8b61,0x3e684b][i%4]));
  }
  group.add(crown);group.updateMatrixWorld(true);parent.attach(crown);
  // Branches share one instanced draw and move with the breakable trunk.
  const branches=new T.InstancedMesh(trunk,bark,3);branches.position.set(ox+x*2,0,z*2);
  for(let i=0;i<3;i++){dummy.position.set(Math.cos(i*2.1)*.6,2.5,Math.sin(i*2.1)*.6);dummy.rotation.set(.5,0,i*2.1+.8);dummy.scale.set(.18,1.8,.18);dummy.updateMatrix();branches.setMatrixAt(i,dummy.matrix);}
  group.add(branches);group.updateMatrixWorld(true);parent.attach(branches);
 }

 // One reusable window mesh includes glass, frame, sill and a lintel.
 const positions=[],normals=[],colors=[];
 function windowPart(size,offset,color){
  const geo=box.toNonIndexed(),p=geo.attributes.position,n=geo.attributes.normal,c=new T.Color(color);
  for(let i=0;i<p.count;i++){positions.push(p.getX(i)*size[0]+offset[0],p.getY(i)*size[1]+offset[1],p.getZ(i)*size[2]+offset[2]);normals.push(n.getX(i),n.getY(i),n.getZ(i));colors.push(c.r,c.g,c.b);}geo.dispose();
 }
 windowPart([2.1,1.65,.12],[0,0,0],0xd1c7ae);
 windowPart([1.85,1.4,.14],[0,0,.04],0x527d87);
 windowPart([.06,1.45,.18],[0,0,.08],0xb9c3b5);
 windowPart([2.28,.13,.35],[0,-.85,.10],0x999f90);
 windowPart([2.3,.14,.23],[0,.85,.04],0xdfd4b8);
 const windowGeometry=new T.BufferGeometry();windowGeometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));windowGeometry.setAttribute('normal',new T.Float32BufferAttribute(normals,3));windowGeometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));
 const windowMaterial=new T.MeshStandardMaterial({vertexColors:true,roughness:.48,metalness:.12});
 function dress({group,ox,index,style,structures}){
  const root=new T.Group();root.name='lot-detail';root.userData.decorative=true;group.add(root);
  const rng=random(173+index*931),batches=new Map();
  function addBox(color,w,h,d,x,y,z,yaw=0){if(!batches.has(color))batches.set(color,[]);batches.get(color).push([w,h,d,x,y,z,yaw]);}
  // A paved edge, concrete joints and drains give the asphalt a real boundary.
  for(const side of [-1,1]){
   addBox(0xb8b6a5,3.2,.12,96,side*50,-.005,0);
   for(let z=-44;z<=44;z+=4)addBox(0x969a8d,3.1,.018,.045,side*50,.065,z);
   for(let z=-36;z<=36;z+=24){addBox(0x303d3b,1.2,.025,.65,side*46.8,.038,z);for(let k=-3;k<=3;k++)addBox(0x84918a,.045,.012,.58,side*46.8+k*.14,.055,z);}
  }
  const warm=['diner','street','motel','valet','orchard'].includes(style);
  // Buildings beyond the driveable boundary create a layered neighborhood horizon.
  for(let i=0;i<11;i++){
   const a=i/11*Math.PI*2,r=132+rng()*25,x=Math.sin(a)*r,z=Math.cos(a)*r;
   const w=9+rng()*13,h=5+rng()*17,d=8+rng()*12,col=warm?[0x9c8b73,0xa79c86,0x848f81][i%3]:[0x84979a,0x9ca89c,0x78898a][i%3];
   addBox(col,w,h,d,x,h/2-.2,z);addBox(0x606e68,w+.6,.35,d+.6,x,h,z);
   for(let y=2;y<h-1;y+=3.2)for(let px=-w/2+1.8;px<w/2-1;px+=3.3)addBox(0xbed0c5,1.25,1.5,.08,x+px,y,z+d/2+.05);
  }
  for(const [color,entries]of batches){const mesh=new T.InstancedMesh(box,material(color),entries.length);entries.forEach((v,i)=>{dummy.position.set(ox+v[3],v[4],v[5]);dummy.rotation.set(0,v[6],0);dummy.scale.set(v[0],v[1],v[2]);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);});mesh.receiveShadow=true;root.add(mesh);}
  // Soft ridgelines sit behind the skyline rather than ending at a blank horizon.
  const hills=new T.InstancedMesh(leaf,material(style==='lodge'?0xa4b7b3:0x809886),8);
  for(let i=0;i<8;i++){const a=i*Math.PI/4;dummy.position.set(ox+Math.sin(a)*183,-10,Math.cos(a)*183);dummy.rotation.set(0,a,0);dummy.scale.set(42,22+rng()*20,32);dummy.updateMatrix();hills.setMatrixAt(i,dummy.matrix);}root.add(hills);
  // Facade details attach to their structural section, so they fall with that section.
  const byStructure=new Map();for(const e of structures){if(!e.structure)continue;if(!byStructure.has(e.structure))byStructure.set(e.structure,[]);byStructure.get(e.structure).push(e);}
  let facadeWindows=0;
  for(const sections of byStructure.values()){
   const front=Math.max(...sections.filter(e=>e.size[2]<1).map(e=>e.mesh.position.z));
   for(const e of sections){if(e.size[2]>=1||Math.abs(e.mesh.position.z-front)>.1||e.size[0]<2.5)continue;
    const detail=new T.Mesh(windowGeometry,windowMaterial);detail.position.set(e.mesh.position.x,e.mesh.position.y+.05,front+.38);detail.castShadow=false;group.add(detail);group.updateMatrixWorld(true);e.mesh.attach(detail);facadeWindows++;
   }
  }
  root.userData.facadeWindows=facadeWindows;return root;
 }
 return {tree,dress};
}

export function createSurfaceTextures(T){
 function texture(kind){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=512;const ctx=canvas.getContext('2d');let seed=kind==='road'?931:124;
  const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  ctx.fillStyle=kind==='road'?'#c0c1b9':'#b7c49b';ctx.fillRect(0,0,512,512);
  for(let i=0;i<6500;i++){const v=Math.floor(150+rand()*100);ctx.fillStyle=kind==='road'?`rgba(${v},${v},${v},.32)`:`rgba(${v*.7},${v},${v*.45},.24)`;const s=.5+rand()*2.2;ctx.fillRect(rand()*512,rand()*512,s,kind==='road'?s:s*2);}
  if(kind==='road'){
   for(let i=0;i<8;i++){const x=rand()*512,y=rand()*512;ctx.fillStyle='rgba(55,62,61,.05)';ctx.beginPath();ctx.ellipse(x,y,12+rand()*38,6+rand()*17,rand()*6,0,Math.PI*2);ctx.fill();}
   ctx.strokeStyle='rgba(53,61,60,.22)';ctx.lineWidth=.7;for(let i=0;i<5;i++){let x=rand()*512,y=rand()*512;ctx.beginPath();ctx.moveTo(x,y);for(let j=0;j<7;j++){x+=(rand()-.5)*30;y+=8+rand()*12;ctx.lineTo(x,y);}ctx.stroke();}
  }
  const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;map.wrapS=map.wrapT=T.RepeatWrapping;map.repeat.set(kind==='road'?10:24,kind==='road'?10:24);map.anisotropy=4;return map;
 }
 return {road:texture('road'),grass:texture('grass')};
}

export function createSky(T,scene){
 const uniforms={sky:{value:new T.Color(0x93bed1)},horizon:{value:new T.Color(0xc9d5c6)}};
 const material=new T.ShaderMaterial({uniforms,side:T.BackSide,depthWrite:false,vertexShader:'varying vec3 vDirection; void main(){vDirection=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:'varying vec3 vDirection;uniform vec3 sky;uniform vec3 horizon;void main(){vec3 d=normalize(vDirection);float h=smoothstep(-.06,.78,d.y);vec3 color=mix(horizon,sky,h);float cloud=sin(d.x*18.0+d.z*7.0)*sin(d.z*24.0-d.x*5.0)+sin(d.x*38.0+d.z*28.0)*.25;float veil=smoothstep(.42,.92,cloud)*smoothstep(.12,.35,d.y)*(1.0-smoothstep(.65,.94,d.y));color=mix(color,vec3(.91,.94,.90),veil*.48);gl_FragColor=vec4(color,1.0);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>}',fog:false});
 const dome=new T.Mesh(new T.SphereGeometry(390,28,16),material);dome.renderOrder=-1;dome.frustumCulled=false;scene.add(dome);
 return {follow:camera=>dome.position.copy(camera.position),theme:color=>{uniforms.horizon.value.setHex(color).lerp(new T.Color(0xd5ddd0),.35);uniforms.sky.value.copy(uniforms.horizon.value).lerp(new T.Color(0x78adcf),.65);}};
}
