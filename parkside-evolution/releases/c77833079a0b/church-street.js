// Screenshot-derived shopping lots. North is -Z; Church Street slopes across the south.
export function buildChurchStreet({T,group,ox,piece,bay,parked,text,mini,mat,breakables,buildings,index}){
 const geo=new T.BoxGeometry(1,1,1),plans=new Map(),dummy=new T.Object3D(),poles=[],lights=[];
 function decor(w,h,d,x,y,z,color,yaw=0){if(!plans.has(color))plans.set(color,[]);plans.get(color).push([w,h,d,ox+x,y,z,yaw]);}
 function surface(w,d,x,z,color,y=.04,yaw=0){decor(w,.025,d,x,y,z,color,yaw);}
 function curb(w,d,x,z){return piece(w,.25,d,x,.125,z,0xb8b5a4);}
 function tree(x,z,i=0){const trunk=piece(.4,3.8,.4,x,1.9,z,0x6a5540),crown=new T.Mesh(new T.IcosahedronGeometry(1,1),mat([0x607948,0x8b713f,0x9a5a3b][i%3]));crown.position.set(ox+x,4.5,z);crown.scale.set(2.6,2.5,2.4);group.add(crown);group.updateMatrixWorld(true);trunk.attach(crown);}
 const lit=new T.MeshStandardMaterial({color:0xffedbd,emissive:0xffd987,emissiveIntensity:1.5,roughness:.5});
 function light(w,h,d,x,y,z){const m=new T.Mesh(geo,lit);m.scale.set(w,h,d);m.position.set(ox+x,y,z);m.userData.guide=true;group.add(m);lights.push(m);return m;}
 function building(name,x,z,w,d,h,color,type='shop'){
  const id=index+':church:'+buildings.length;buildings.push({id,level:index,x:ox+x,z,w,d,h,yaw:0,name,type});
  for(const side of [-1,1])for(const axis of [0,1]){const len=axis?d:w,n=Math.ceil(len/6);for(let i=0;i<n;i++)piece(axis?.4:len/n,h,axis?len/n:.4,x+(axis?side*w/2:-w/2+(i+.5)*len/n),h/2,z+(axis?-d/2+(i+.5)*len/n:side*d/2),color,0,id);}
  const nx=Math.ceil(w/8),nz=Math.ceil(d/8);for(let i=0;i<nx;i++)for(let j=0;j<nz;j++){piece(w/nx,.25,d/nz,x-w/2+(i+.5)*w/nx,h,z-d/2+(j+.5)*d/nz,0x747d7a,0,id);breakables.at(-1).role='roof';}
  for(let px=x-w/2+3;px<x+w/2-2;px+=5){decor(3.6,2,.07,px,2,z+d/2+.23,0x496775);light(3.4,.12,.1,px,3,z+d/2+.3);}
  mini.push({x,z,w,d,color:'#96877b'});
 }
 // Ground and lot necks, kept flat so paint never changes tire contact.
 surface(190,190,0,0,0x82906b,.02);
 surface(63,104,61,-17,0x50595b);surface(20,94,-42,-48,0x535a5a);surface(94,16,1,-15,0x515959);
 surface(22,88,-58,30,0x51595a);surface(40,42,-8,12,0x515959);surface(15,40,21,45,0x535b5b);surface(13,47,-35,53,0x535b5b);
 const roadYaw=Math.atan(.32);surface(214,14,0,79,0x414b50,.045,roadYaw);
 for(let x=-94;x<99;x+=6)surface(3,.13,x,79-.32*x,0xe9cd72,.07,roadYaw);
 // Short driveway aprons meet the road without sealed entrances.
 for(const [x,z,w,d] of [[42,57,20,26],[21,64,15,18],[-35,78,13,22],[-58,85,22,22]])surface(w,d,x,z,0x535b5b);
 building('ACME Markets',-4,-54,52,56,7.5,0xa09a88,'market');
 building("Olivia’s Trattoria",66,-85,54,14,6,0xc0b6a2,'restaurant');
 building('The Outpost',-10,48,23,26,5.2,0x899d8c,'shop');
 building('Church Street Shops',67,27.5,31,34,6,0xc4b99e,'shop');
 building('Cheshire Offices',-76,40,12,57,6.2,0xb2a38d,'office');
 const signs=[text('ACME MARKETS',22.3/2,5.8,-53/2,18,Math.PI/2),text('THE OUTPOST',-10/2,4.4,61.2/2,16),text('CHURCH STREET SHOPS',67/2,4.7,44.8/2,22),text('OLIVIA’S',66/2,4.8,-77.8/2,16)];
 for(const s of signs)s.userData.guide=true;
 text('CHURCH ST',-2, .09,77/2,14,roadYaw,true,'#495359');
 // Green annotation becomes planted verges and curbs, leaving all photographed aisles open.
 for(const [w,d,x,z] of [[.5,120,-70,25],[.5,61,-46,21],[.5,81,-29,42],[.5,61,29,22],[.5,67,-53,-53],[.5,56,-30,-54],[52,.5,-4,-26],[.5,57,22,-54],[.5,138,93,-7],[62,.5,62,-68]])curb(w,d,x,z);
 for(const [x,z,w,d] of [[-38,4,8,31],[17,10,6,32],[-7,-7,37,3],[-10,69,18,6]]){surface(w,d,x,z,0x748852,.06);curb(w,.45,x,z-d/2);}
 for(const [x,z] of [[-49,-5],[-49,20],[-49,47],[-65,7],[-65,34],[-65,64],[-38,0],[-38,23],[17,-2],[17,25],[-22,72],[4,68],[86,-60],[87,-17],[85,5]])tree(x,z,Math.abs(Math.round(x+z)));
 // East grocery lot: perpendicular banks, a broad store-side delivery aisle, and crosswalk.
 let slots=0,occupied=0;
 function stall(x,z,yaw=0){bay(x/2,z/2,yaw,3.3,6.1);slots++;if(slots%6!==0){parked(x/2,z/2,yaw);occupied++;}}
 for(const z of [-55,-31,-7])for(let i=0;i<10;i++)stall(53+i*3.4,z,0);
 for(const z of [-48,-24])for(let i=0;i<10;i++)stall(53+i*3.4,z,Math.PI);
 // Independent smaller lots with intact drive-through aisles.
 for(let z=0;z<54;z+=7)stall(-64,z,Math.PI/2);
 for(let x=-22;x<12;x+=3.7)stall(x,22,0);
 for(let z=3;z<24;z+=7)stall(9,z,-Math.PI/2);
 for(let z=10;z<48;z+=7)stall(48,z,-Math.PI/2);
 for(let z=-62;z<-56;z+=2)surface(11,.65,36,z,0xe4ded0,.08);
 // Rear service alley: dock doors, bins, rooftop ventilation and stopping box at the red X.
 for(const z of [-74,-59]){decor(.12,3.2,4,-30.25,2,z,0x596665);for(let y=.6;y<3.6;y+=.35)decor(.15,.04,3.9,-30.33,y,z,0x919997);piece(1.8,1.05,5,-31.2,.525,z,0xa6a296);}
 for(const z of [-39,-45]){piece(2,1.7,3,-32, .85,z,0x436953);decor(2.1,.12,3.1,-32,1.75,z,0x344846);}
 for(const [x,z] of [[-15,-55],[5,-43],[-8,-68]])decor(4,.9,3,x,8.1,z,0x919b98);
 text('DELIVERIES',-40/2,.1,-40/2,9,0,true,'#505b59');
 // Three red pavement hints follow the screenshot without cluttering the HUD.
 for(const [x,z] of [[7,77],[42,44],[42,0],[10,-15],[-40,-40],[-40,-57]])surface(.45,1.7,x,z,0xc87c62,.082);
 // Every utility pole participates in normal impact destruction; wires follow fallen tops.
 for(const side of [-1,1])for(let x=-84;x<=84;x+=28){const z=79-.32*x+side*9;if(z>100)continue;const m=piece(.48,8,.48,x,4,z,0x75604b),entry=breakables.at(-1);entry.unfragmented=true;entry.utilityPole=true;m.name='Church Street power pole';
  const cross=new T.Mesh(geo,mat(0x6c6e69));cross.scale.set(.2,.16,2.4);cross.position.set(ox+x,7.5,z);group.add(cross);group.updateMatrixWorld(true);m.attach(cross);
  const transformer=new T.Mesh(new T.CylinderGeometry(.35,.35,.85,10),mat(0x899592));transformer.position.set(ox+x+.5,6.4,z);group.add(transformer);group.updateMatrixWorld(true);m.attach(transformer);
  poles.push({entry,side,x,z});const lamp=light(1.4,.17,.6,x,7.6,z+side*1.8);group.updateMatrixWorld(true);m.attach(lamp);
 }
 for(const [x,z] of [[25,-50],[25,-4],[-25,11],[-56,30]]){piece(.16,6,.16,x,3,z,0x586467);light(1.8,.16,.7,x,6,z);}
 const spans=[];for(const side of [-1,1]){const row=poles.filter(p=>p.side===side);for(let i=1;i<row.length;i++)spans.push([row[i-1],row[i]]);}
 const wireGeo=new T.BufferGeometry(),wirePos=new Float32Array(spans.length*3*8*6);wireGeo.setAttribute('position',new T.BufferAttribute(wirePos,3));const wires=new T.LineSegments(wireGeo,new T.LineBasicMaterial({color:0x252d32}));wires.frustumCulled=false;wires.userData.guide=true;group.add(wires);
 let powered=true,wiresReady=false;const a=new T.Vector3(),b=new T.Vector3();
 function update(dt,notify){const next=!poles.some(p=>p.entry.broken);if(next&&powered&&wiresReady)return;if(next!==powered){powered=next;lit.emissiveIntensity=powered?1.5:0;lit.color.setHex(powered?0xffedbd:0x424a4d);for(const lamp of lights){lamp.material.emissiveIntensity=lit.emissiveIntensity;lamp.material.color.copy(lit.color);}for(const s of signs)s.material.color.setHex(powered?0xffffff:0x454b50);if(!powered)notify?.('Power out · Church Street',3);}
  for(const p of poles)p.entry.mesh.updateWorldMatrix(true,false);wiresReady=true;let n=0;for(const [p,r] of spans)for(const lane of [-1,0,1]){p.entry.mesh.localToWorld(a.set(0,.4375,lane*1.8));r.entry.mesh.localToWorld(b.set(0,.4375,lane*1.8));for(let i=0;i<8;i++)for(const t of [i/8,(i+1)/8]){wirePos[n++]=a.x+(b.x-a.x)*t;wirePos[n++]=a.y+(b.y-a.y)*t-Math.sin(t*Math.PI)*.65;wirePos[n++]=a.z+(b.z-a.z)*t;}}
  wireGeo.attributes.position.needsUpdate=true;
 }
 group.userData.powerGrid={update,getInfo:()=>({powered,poles:poles.length,down:poles.filter(p=>p.entry.broken).length,lights:lights.length}),poles};
 group.userData.churchStreet={slots,occupied,driveways:4,route:[[-75,103],[42,66],[42,-15],[-40,-15],[-40,-76]],boundary:'planted verges and curbs'};
 for(const [color,list] of plans){const m=new T.InstancedMesh(geo,mat(color),list.length);m.userData.guide=true;m.receiveShadow=true;m.frustumCulled=false;list.forEach(([w,h,d,x,y,z,yaw],i)=>{dummy.position.set(x,y,z);dummy.scale.set(w,h,d);dummy.rotation.set(0,yaw,0);dummy.updateMatrix();m.setMatrixAt(i,dummy.matrix);});group.add(m);}
 mini.push({x:0,z:79,w:214,d:14,yaw:roadYaw,color:'#586164'},{x:42,z:0,w:18,d:132,color:'#586164'},{x:-42,z:-48,w:20,d:94,color:'#586164'});update(0);
}
