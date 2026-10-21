// Screenshot-inspired Washington Street / W River Road, with a choice of two full lots.
export function buildUndici({T,group,ox,piece,bay,parked,text,mini,mat,breakables,buildings,index}){
 const geo=new T.BoxGeometry(1,1,1),plans=new Map(),dummy=new T.Object3D();
 function decor(w,h,d,x,y,z,color){if(!plans.has(color))plans.set(color,[]);plans.get(color).push([w,h,d,ox+x,y,z]);}
 const surface=(w,d,x,z,color=0x50585a)=>decor(w,.025,d,x,.045,z,color);
 function curb(w,d,x,z){piece(w,.24,d,x,.12,z,0xc5c0ae);}
 function tree(x,z,i){const trunk=piece(.4,3.5,.4,x,1.75,z,0x6b543d),m=new T.Mesh(new T.IcosahedronGeometry(1,1),mat([0x677d48,0x947039,0x9c593c][i%3]));m.position.set(ox+x,4,z);m.scale.set(2.3,2.6,2.3);group.add(m);group.updateMatrixWorld(true);trunk.attach(m);}
 function building(name,x,z,w,d,h,color,type='shop'){
  const id=index+':undici:'+buildings.length;buildings.push({id,level:index,x:ox+x,z,w,d,h,yaw:0,name,type});
  for(const side of [-1,1])for(const axis of [0,1]){const len=axis?d:w,n=Math.ceil(len/5);for(let i=0;i<n;i++)piece(axis?.4:len/n,h,axis?len/n:.4,x+(axis?side*w/2:-w/2+(i+.5)*len/n),h/2,z+(axis?-d/2+(i+.5)*len/n:side*d/2),color,0,id);}
  const nx=Math.ceil(w/6),nz=Math.ceil(d/6);for(let i=0;i<nx;i++)for(let j=0;j<nz;j++){piece(w/nx,.25,d/nz,x-w/2+(i+.5)*w/nx,h,z-d/2+(j+.5)*d/nz,0x858781,0,id);breakables.at(-1).role='roof';}
  for(let px=x-w/2+3;px<x+w/2-2;px+=5)decor(2.8,1.7,.08,px,2,z+d/2+.25,0x496b72);
  const sign=text(name,x/2,h-.8,(z+d/2+.3)/2,Math.min(w-1,20));sign.userData.guide=true;mini.push({x,z,w,d,color:'#aa9077'});
 }
 surface(16,210,0,0,0x454e52);surface(210,16,0,-55,0x454e52);
 for(let z=-100;z<104;z+=7){surface(.12,3,-.2,z,0xe7c66d);surface(.12,3,.2,z,0xe7c66d);}
 for(let x=-100;x<104;x+=7)if(Math.abs(x)>12)surface(3,.15,x,-55,0xe7c66d);
 for(const x of [-10,10]){surface(3,210,x,0,0xbfb9a8);curb(.25,117,x+(x<0?1.5:-1.5),-46.5);curb(.25,77,x+(x<0?1.5:-1.5),66.5);}
 // Both driveways have open curb gaps from z=12 to z=28.
 surface(66,53,-44,18);surface(52,65,38,28);surface(15,14,-7,20);surface(15,16,8,19);
 for(const [w,d,x,z]of [[.4,53,-77,18],[66,.4,-44,44.5],[.4,65,64,28],[52,.4,38,60.5]])curb(w,d,x,z);
 for(let x=-7;x<=7;x+=2){surface(1,5,x,-43,0xf1eee0);surface(1,5,x,-67,0xf1eee0);}
 for(let z=-61;z<=-49;z+=2)surface(5,1,-13,z,0xf1eee0);
 building('UNDICI',-61,-28,29,34,6,0xac7557,'restaurant');building('LE PAPILLON',-27,-28,30,34,6.8,0xbebbb0);
 building('RUMSON WINE & SPIRITS',37,-27,45,32,6,0x9f9c91);
 building('WELLS FARGO',-45,-85,55,30,7,0xb0a28d,'office');building('REALTORS',35,-85,24,23,5,0xc2b69c,'office');
 building('32 WASHINGTON',-43,57,42,19,5,0xb18762,'house');building('34',-43,81,30,18,5,0xbeb9aa,'house');
 // Patio behind the restaurant, distinct from the parked-car rows.
 surface(24,9,-62,-5,0x9c8a6d);for(const x of [-70,-62,-54]){piece(1.8,.15,1.8,x,.8,-5,0xb69a71);for(const dx of [-1.2,1.2])piece(.6,.6,.6,x+dx,.3,-5,0x665b4c);}
 const stalls=[];function stall(lot,x,z,yaw,open=false){stalls.push({lot,x,z,yaw,open});if(!open){bay(x/2,z/2,yaw,3.6,6.6);parked(x/2,z/2,yaw);} }
 for(let i=0;i<12;i++)stall('west',-67+i*4.1,3,-Math.PI/6,i===6);
 for(let i=0;i<11;i++)stall('west',-65+i*4.1,36,Math.PI+Math.PI/6);
 for(let i=0;i<12;i++){stall('east',18,1+i*4.5,-Math.PI/2);stall('east',57,1+i*4.5,Math.PI/2,i===5);}
 for(const [x,z]of [[-83,-34],[-83,4],[-83,30],[-81,61],[-75,85],[70,-7],[71,24],[70,52],[39,75],[51,86],[28,89]])tree(x,z,Math.abs(x+z)%3);
 text('WASHINGTON ST',0,.09,40,11,0,true,'#465153');text('W RIVER RD',-25,.09,-27.5,18,0,true,'#465153');
 group.userData.undici={stalls,slots:stalls.length,occupied:stalls.filter(s=>!s.open).length,vacancies:stalls.filter(s=>s.open)};
 for(const [color,list]of plans){const mesh=new T.InstancedMesh(geo,mat(color),list.length);mesh.userData.guide=true;mesh.receiveShadow=true;mesh.frustumCulled=false;list.forEach(([w,h,d,x,y,z],i)=>{dummy.position.set(x,y,z);dummy.scale.set(w,h,d);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);});group.add(mesh);}
 mini.push({x:0,z:0,w:16,d:210,color:'#586164'},{x:0,z:-55,w:210,d:16,color:'#586164'},{x:-44,z:18,w:66,d:53,color:'#586164'},{x:38,z:28,w:52,d:65,color:'#586164'});
}
