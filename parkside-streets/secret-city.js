import {buildRacerBike} from './racer-bike.js?v=street-20';
import {createSecretDetail} from './secret-detail.js?v=casino-18';
export const SECRET_LEVEL={name:'Golden Grounds',kind:'Destruction',code:'SECRET',style:'sandbox',type:'destruction',halfSize:240,worldHalf:260,spawn:[0,210,0],target:{x:0,z:0,w:0,d:0,yaw:0},gates:[],theme:0xb5cbd0,par:3600,hint:'Chain destruction, finish demolition jobs, and keep the city smashing forever.'};
export const DISTRICTS=[{name:'City',x:-120,z:-120,color:0x899b9c},{name:'Suburbs',x:120,z:-120,color:0xa9bd87},{name:'Harbor',x:120,z:120,color:0xa0a8a0},{name:'Forest',x:-120,z:120,color:0x688d60}];

// Built only after the reward unlock: normal parking lots carry no city overhead.
export function buildSecretCity({T,C,scene,lots,groundMat,rampMat=groundMat}){
 const index=24,ox=6000,group=new T.Group(),phys=[],entries=[],targets=[],mini=[],buildings=[],materials=new Map(),box=new T.BoxGeometry(1,1,1),cylinder=new T.CylinderGeometry(.5,.5,1,16),canopy=new T.IcosahedronGeometry(1,1),facades=new Map();
 group.visible=false;scene.add(group);
 const material=(color)=>{if(!materials.has(color))materials.set(color,new T.MeshStandardMaterial({color,roughness:.78}));return materials.get(color);};
 const target=(name,district,kind,x,z)=>{const t={id:targets.length,name,district,kind,x,z,entries:[]};targets.push(t);return t;};
 function visual(geo,mat,x,y,z,sx=1,sy=1,sz=1,parent=group){const m=new T.Mesh(geo,mat),s=parent===group?{x:1,y:1,z:1}:parent.scale;m.position.set((x+(parent===group?ox:0))/s.x,y/s.y,z/s.z);m.scale.set(sx/s.x,sy/s.y,sz/s.z);m.castShadow=sy>.4;m.receiveShadow=true;parent.add(m);return m;}
 function piece(t,w,h,d,x,y,z,color,structure=null,geo=box){const mesh=visual(geo,typeof color==='number'?material(color):color,x,y,z,w,h,d),body=new C.Body({mass:0,material:groundMat,shape:new C.Box(new C.Vec3(w/2,h/2,d/2)),position:new C.Vec3(ox+x,y,z)});body.userData={kind:structure?'building':t.kind==='barrel'?'explosive barrel':'scenery'};body.updateAABB();phys.push(body);const e={mesh,body,level:index,size:[w,h,d],structure,explosive:t.kind==='barrel',target:t};entries.push(e);t.entries.push(e);return e;}
 function facade(color,house=false){const key=color+':'+house;if(facades.has(key))return facades.get(key);const cv=document.createElement('canvas');cv.width=cv.height=256;const c=cv.getContext('2d');c.fillStyle='#'+color.toString(16).padStart(6,'0');c.fillRect(0,0,256,256);c.strokeStyle='#00000019';for(let y=0;y<256;y+=16){c.beginPath();c.moveTo(0,y);c.lineTo(256,y);c.stroke();}for(const x of [42,142]){c.fillStyle='#d2ddcf';c.fillRect(x-5,52,64,142);c.fillStyle=house?'#49616a':'#375568';c.fillRect(x,57,54,132);c.fillStyle='#7698a2';c.fillRect(x+4,61,18,114);c.fillStyle='#d2ddcf';c.fillRect(x+25,57,3,132);c.fillRect(x,118,54,3);}const map=new T.CanvasTexture(cv);map.colorSpace=T.SRGBColorSpace;const paint=new T.MeshStandardMaterial({color:0xffffff,map,roughness:.77});facades.set(key,paint);return paint;}
 function building(name,district,x,z,w,d,h,color,house=false){const t=target(name,district,'building',x,z),id='secret:'+t.id,rows=Math.ceil(h/4),paint=facade(color,house);buildings.push({id,level:index,district,x:ox+x,z,w,d,h,yaw:0,name,type:name==='Mint Mart'?'convenience':name==='Golden Arms'?'gun':name==='Lucky Mango Casino'?'casino':house?'house':name.startsWith('Warehouse')?'warehouse':'office',target:t});
  for(const side of [-1,1])for(let row=0;row<rows;row++)for(let col=0;col<2;col++){
   piece(t,w/2,h/rows,.48,x-w/2+(col+.5)*w/2,(row+.5)*h/rows,z+side*d/2,paint,id);
   piece(t,.48,h/rows,d/2,x+side*w/2,(row+.5)*h/rows,z-d/2+(col+.5)*d/2,paint,id);
  }
  for(const side of [-1,1]){const roof=piece(t,w/2,.55,d+1,x+side*w/4,h+.3,z,house?0x7e5747:0x6d7778,id);roof.role='roof';if(house){roof.mesh.rotation.z=side*-.24;roof.body.quaternion.copy(roof.mesh.quaternion);roof.body.aabbNeedsUpdate=true;}}
  const front=t.entries[0];visual(box,material(0x33484c),x+w*.21-front.mesh.position.x+ox,1.3-front.mesh.position.y,z-d/2-.28-front.mesh.position.z,1.5,2.6,.12,front.mesh);
  // Roof-mounted details remain part of the structure and fall with their panel.
  const roof=t.entries.at(-1);visual(box,material(house?0xc8bda5:0x909b98),0,.8,0,house?.7:2.2,house?1.4:1.2,house?.7:1.4,roof.mesh);
  mini.push({x,z,w,d,color:district===0?'#667e87':district===1?'#d2ad8b':'#889b9e',target:t.id});return t;
 }
 function prop(name,district,kind,x,z,w,h,d,color){return piece(target(name,district,kind,x,z),w,h,d,x,h/2,z,color);}
 function tree(x,z,district=3,i=0){const t=target('Tree',district,'tree',x,z),e=piece(t,.65,4,.65,x,2,z,0x765b42);visual(canopy,material([0x3e7953,0x528958,0x719d59][i%3]),0,3.6,0,2.7,3.8,2.7,e.mesh);}
 const sign=document.createElement('canvas');sign.width=sign.height=64;const signCtx=sign.getContext('2d');signCtx.fillStyle='#ffcf58';signCtx.fillRect(0,0,64,64);signCtx.fillStyle='#272d26';signCtx.font='bold 48px sans-serif';signCtx.textAlign='center';signCtx.fillText('!',32,50);const badgeMap=new T.CanvasTexture(sign);badgeMap.colorSpace=T.SRGBColorSpace;const badgeGeo=new T.PlaneGeometry(.45,.55),badgeMat=new T.MeshBasicMaterial({map:badgeMap,side:T.DoubleSide}),fuseGeo=new T.SphereGeometry(1,8,6),fuseMat=new T.MeshStandardMaterial({color:0xffe473,emissive:0xff6517,emissiveIntensity:2});
 function barrel(x,z,district){const t=target('Explosive barrel',district,'barrel',x,z),e=piece(t,.95,1.5,.95,x,.75,z,0xb9482e,null,cylinder);e.body.removeShape(e.body.shapes[0]);e.body.addShape(new C.Cylinder(.475,.475,1.5,12));e.body.updateBoundingRadius();e.body.aabbNeedsUpdate=true;for(const y of [-.42,.42])visual(cylinder,material(0x303a3b),0,y,0,1.015,.085,1.015,e.mesh);visual(badgeGeo,badgeMat,0,0,-.51,1,1,1,e.mesh);e.fuseMesh=visual(fuseGeo,fuseMat,0,.8,0,.14,.14,.14,e.mesh);e.fuseMesh.visible=false;return e;}
 function lamp(x,z,district){const t=target('Street light',district,'light',x,z),e=piece(t,.26,5,.26,x,2.5,z,0x53666a);visual(box,material(0xe9e2aa),.65,2.4,0,1.6,.22,.5,e.mesh);}
 function surface(color,grass=false){const cv=document.createElement('canvas');cv.width=cv.height=128;const c=cv.getContext('2d');c.fillStyle=color;c.fillRect(0,0,128,128);let seed=817;for(let i=0;i<2200;i++){seed=(seed*1664525+1013904223)>>>0;const x=seed%128,y=(seed>>>8)%128;c.fillStyle=i%2?'#ffffff13':'#00000018';c.fillRect(x,y,grass?1:2,grass?3:1);}const map=new T.CanvasTexture(cv);map.colorSpace=T.SRGBColorSpace;map.wrapS=map.wrapT=T.RepeatWrapping;map.repeat.set(32,32);return new T.MeshStandardMaterial({color:0xffffff,map,roughness:.95});}
 const asphalt=surface('#4c5b60'),grass=surface('#7c9568',true);
 function road(x,z,w,d){visual(box,asphalt,x,.015,z,w,.02,d);mini.push({x,z,w,d,color:'#445b61',road:true});const vertical=d>w;for(let v=-210;v<=210;v+=16)visual(box,material(0xd6c895),vertical?x:x+v,.037,vertical?z+v:z,vertical?.18:5,.012,vertical?5:.18);}
 for(const district of DISTRICTS)visual(box,district.name==='Forest'||district.name==='Suburbs'?grass:material(district.color),district.x,.005,district.z,222,.01,222);
 for(const x of [-220,-70,0,70,220])road(x,0,x===0?28:16,480);
 for(const z of [-220,-70,0,70,220])road(0,z,480,z===0?28:16);
 // Downtown streets: taller offices, brick shops, a low garage and service yards.
 let n=0;for(const x of [-162,-112,-38])for(const z of [-162,-112,-38]){building(n===0?'Mint Mart':n===1?'Golden Arms':n===2?'Lucky Mango Casino':['Office','Shop','Apartments'][n%3]+' '+(n+1),0,x,z,24,24,n%3===0?16:8,[0xb9b3a0,0x96acb0,0xbd806b][n%3]);n++;barrel(x+16,z+10,0);barrel(x+16,z+14,0);}
 // Houses have pitched roofs, chimneys, driveways, garages and low garden fences.
 n=0;for(const x of [40,118,173])for(const z of [-174,-118,-40]){building('House '+(++n),1,x,z,17,15,5,[0xd2bc96,0xb6c8b0,0xa6bed0][n%3],true);visual(box,material(0xb0b6a6),x+13,.03,z+10,10,.035,25);const f=prop('Garden fence',1,'fence',x,z+12,18,1.2,.18,0xcebda0);for(const dx of [-.4,-.2,0,.2,.4])visual(box,material(0xe1d5bb),dx*18,0,0,.12,1.15,.25,f.mesh);barrel(x-13,z+8,1);tree(x+18,z-12,1,n);}
 // Harbor: connected quays and piers; water is decorative over the driveable base.
 visual(box,new T.MeshStandardMaterial({color:0x437f98,roughness:.22,metalness:.28}),178,.018,155,96,.025,105);
 for(const z of [116,151,188]){visual(box,material(0x9b9e8c),168,.04,z,103,.03,10);mini.push({x:168,z,w:103,d:10,color:'#bdc5b0',road:true});}
 for(const [i,x,z]of [[0,39,115],[1,106,105],[2,110,40]]){building('Warehouse '+(i+1),2,x,z,28,24,8,0x9aa6a2);barrel(x+18,z+10,2);barrel(x+18,z+14,2);}
 for(let i=0;i<12;i++){const x=34+(i%3)*27,z=152+Math.floor(i/3)*16,e=prop('Cargo container',2,'cargo',x,z,13,3,6,[0xac684e,0x618d91,0xc2a050][i%3]);for(let j=-5;j<=5;j+=2)visual(box,material(0xcbd1bf),j,0,-3.05,.14,3,.08,e.mesh);barrel(x-9,z,2);}
 for(let i=0;i<7;i++)prop('Dock bollard',2,'bollard',170+i*7,104,1,1.4,1,0x556767);
 for(const z of [130,171]){
  const t=target('Harbor crane',2,'building',151,z),id='secret:'+t.id;
  for(const x of [145,157]){piece(t,.8,7,.8,x,3.5,z,0xd0aa4d,id);piece(t,.8,7,.8,x,10.5,z,0xd0aa4d,id);}
  for(const x of [145,157,169])piece(t,12,1,1,x,14,z,0xd0aa4d,id);
  const tower=t.entries[3];visual(box,material(0x476976),0,2.4,0,2,2.5,2,tower.mesh);
 }
 for(const [x,z]of [[194,134],[192,174]]){
  const t=target('Harbor boat',2,'boat',x,z),e=piece(t,16,2.2,5,x,1.1,z,0xe0ddc8);
  // A tapered hull silhouette, raised wheelhouse, cabin glazing and railings.
  const g=new T.BufferGeometry(),v=[-.5,-.5,-.3,.5,-.5,-.3,.38,-.5,.5,-.38,-.5,.5,-.5,.5,-.5,.5,.5,-.5,.5,.5,.5,-.5,.5,.5];g.setAttribute('position',new T.Float32BufferAttribute(v,3));g.setIndex([0,1,5,0,5,4,1,2,6,1,6,5,2,3,7,2,7,6,3,0,4,3,4,7,4,5,6,4,6,7,0,3,2,0,2,1]);g.computeVertexNormals();e.mesh.geometry=g;
  visual(box,material(0xb9c2b6),-2,2.4,0,4.5,2.8,3.4,e.mesh);visual(box,material(0x416572),-2,2.8,-1.72,3.8,1.4,.08,e.mesh);visual(box,material(0x4c6570),.3,2.8,0,.08,1.4,2.8,e.mesh);visual(box,material(0xf1e6c3),-2,3.9,0,5,.22,3.8,e.mesh);
  for(const side of [-1,1])visual(box,material(0xadb9ad),2,1.7,side*2.15,11,.12,.12,e.mesh);
  visual(box,material(0x586a6b),-2,5,0,.15,2,.15,e.mesh);
 }
 // Forest loops and open clearings, with enough gaps for every full-size vehicle.
 for(let i=0;i<72;i++){const x=-198+(i%9)*19,z=38+Math.floor(i/9)*21;if(Math.abs(x+70)<14||Math.abs(z-70)<14)continue;tree(x,z,3,i);if(i%8===0)barrel(x+4,z+4,3);}
 building('Forest cabin',3,-155,198,18,14,5,0xa58764,true);building('Ranger station',3,-34,122,18,20,6,0x929f77,true);
 for(const z of [-200,-150,-100,-40,40,100,150,200])for(const x of [-17,17])lamp(x,z,x<0?(z<0?0:3):(z<0?1:2));
 for(const x of [-195,-130,-40,40,130,195])for(const z of [-17,17]){const district=x<0?(z<0?0:3):(z<0?1:2);prop('Hydrant',district,'hydrant',x,z,.55,1,.55,0xc15c3c);barrel(x,z+(z<0?-5:5),district);}
 // Cars participate in the existing parked-car damage system and objective list.
 for(let i=0;i<20;i++){const district=i%4,x=(district===0||district===3?-1:1)*(24+(i%5)*35),z=(district<2?-1:1)*23,mesh=new T.Group();mesh.position.set(ox+x,0,z);group.add(mesh);const body=new C.Body({mass:0,material:groundMat,shape:new C.Box(new C.Vec3(1.04,.75,2.18)),position:new C.Vec3(ox+x,.8,z)});body.userData={kind:'parked car'};body.updateAABB();phys.push(body);visual(box,material([0x9b6359,0x698a97,0xc4b36a][i%3]),0,.7,0,1.95,.65,4.2,mesh);visual(box,material(0x405b68),0,1.3,.1,1.55,.65,2.2,mesh);for(const side of [-1,1])for(const end of [-1,1]){const m=visual(cylinder,material(0x272d2f),side,.4,end*1.35,.35,.22,.35,mesh);m.rotation.z=Math.PI/2;}
  const item={mesh,body,level:index,district};lots.parked.push(item);const t=target('Parked car',district,'car',x,z);t.car=item;mini.push({x,z,w:2.1,d:4.4,color:'#8fbdc0',target:t.id});
 }
 // A findable sport bike on the main avenue’s shoulder; separate from demolition targets.
 const bikeAsset=buildRacerBike(T),bikeMesh=bikeAsset.root;bikeMesh.position.set(ox+11,0,174);bikeMesh.rotation.y=-Math.PI/2;group.add(bikeMesh);const bikeBody=new C.Body({mass:0,material:groundMat,shape:new C.Box(new C.Vec3(.30,.34,1.08)),position:new C.Vec3(ox+11,.65,174)});bikeBody.quaternion.setFromEuler(0,-Math.PI/2,0);bikeBody.userData={kind:'racer bike'};bikeBody.updateAABB();phys.push(bikeBody);const rideables=[{kind:'bike',name:'Mango RR',asset:bikeAsset,mesh:bikeMesh,body:bikeBody,level:index,occupied:false,damage:0,exploded:false,homePosition:bikeBody.position.clone(),homeQuaternion:bikeBody.quaternion.clone()}];
 // Four solid launch ramps on broad avenues. The rendered wedge matches the collider.
 const rampVerts=[[-5,0,7],[5,0,7],[5,0,-7],[-5,0,-7],[-5,2.4,-7],[5,2.4,-7]],rampFaces=[[0,3,2,1],[3,4,5,2],[0,1,5,4],[0,4,3],[1,2,5]],rampGeo=new T.BufferGeometry(),vertices=[];
 for(const face of rampFaces)for(let i=1;i<face.length-1;i++)for(const vi of [face[0],face[i],face[i+1]])vertices.push(...rampVerts[vi]);rampGeo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));rampGeo.computeVertexNormals();
 for(const [x,z,yaw]of [[0,105,0],[0,-105,Math.PI],[105,0,Math.PI/2],[-105,0,-Math.PI/2]]){const mesh=visual(rampGeo,material(0xaa9e76),x,0,z);mesh.rotation.y=yaw;const body=new C.Body({mass:0,material:rampMat,shape:new C.ConvexPolyhedron({vertices:rampVerts.map(v=>new C.Vec3(...v)),faces:rampFaces}),position:new C.Vec3(ox+x,0,z)});body.quaternion.setFromEuler(0,yaw,0);body.shapes[0].material=rampMat;body.userData={kind:'ramp'};body.updateAABB();phys.push(body);mini.push({x,z,w:10,d:14,color:'#e2b868',road:true});}
 // Small interactive street furniture uses existing breakable bodies and scoring.
 for(let i=0;i<16;i++){const district=i%4,d=DISTRICTS[district],x=d.x+(i%2?25:-25),z=d.z+(i<8?35:-35),e=prop(i%2?'Park bench':'Waste bin',district,'furniture',x,z,i%2?3.5:.9,i%2?1.1:1.3,i%2?1:.9,i%2?0x826b4d:0x65796c);if(i%2)visual(box,material(0xb7a881),0,.55,.35,3.5,.75,.12,e.mesh);}
 const marker=new T.Mesh(new T.TorusGeometry(2,.09,6,32),new T.MeshBasicMaterial({color:0xffdf76,depthTest:false}));marker.rotation.x=-Math.PI/2;marker.position.set(ox,.12,0);marker.renderOrder=4;group.add(marker);
 const beacon=new T.Mesh(new T.ConeGeometry(.7,1.4,8),marker.material);beacon.rotation.x=Math.PI;group.add(beacon);
 const routes=DISTRICTS.map((d,district)=>({district,x0:d.x<0?-210:20,x1:d.x<0?-20:210,z0:d.z<0?-210:20,z1:d.z<0?-20:210}));
 const view={group,ox,phys,mini,gates:[],marker:{fill:marker},beacon,targets,routes,buildings,rideables};lots.views.push(view);lots.breakables.push(...entries);view.detail=createSecretDetail(T,view);
 return view;
}

