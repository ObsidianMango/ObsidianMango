const BASE_LOTS=[
 {name:'Market Square',kind:'Head-in',hint:'Drive around the island and park in A3.',code:'A3',theme:0xb6bca3,spawn:[-13,17,0],target:{x:4,z:-15,yaw:0,w:3.8,d:6.6},par:45,style:'market'},
 {name:'Sunset Diner',kind:'Angled bay',hint:'Follow the diagonal row. Stop inside D4.',code:'D4',theme:0xc7ab88,spawn:[-15,17,0],target:{x:7,z:-10,yaw:-Math.PI/4,w:3.7,d:6.6},par:55,style:'diner'},
 {name:'Office Hours',kind:'Reverse-in',hint:'Pass B2, select R, then back into the bay.',code:'B2',theme:0x9eb4bb,spawn:[-14,17,0],target:{x:5,z:14,yaw:0,w:3.6,d:6.5,reverse:true},par:65,style:'office'},
 {name:'Old Town',kind:'Parallel parking',hint:'Fit between the two cars along the right curb.',code:'P1',theme:0xc8baa6,spawn:[8,18,0],target:{x:16,z:0,yaw:0,w:3.5,d:7.5,reverse:true},par:80,style:'street'},
 {name:'Garden Centre',kind:'Slalom approach',hint:'Thread the planter islands to reach G6.',code:'G6',theme:0xaabb91,spawn:[-13,18,0],target:{x:11,z:-15,yaw:0,w:3.6,d:6.5},par:70,style:'garden'},
 {name:'The Courtyard',kind:'Tight turn',hint:'Go around the central fountain to reach C2.',code:'C2',theme:0xc1bba3,spawn:[-15,17,0],target:{x:15,z:-9,yaw:Math.PI/2,w:3.7,d:6.5},par:80,style:'motel'},
 {name:'Loading Dock',kind:'Reverse alley',hint:'Turn into the aisle, then back into L3.',code:'L3',theme:0xa5b2b0,spawn:[-15,16,0],target:{x:8,z:-14,yaw:Math.PI,w:3.6,d:6.5,reverse:true},par:90,style:'warehouse'},
 {name:'Harbour Finish',kind:'Precision parking',hint:'Navigate the barriers and reverse into H8.',code:'H8',theme:0x9cb7bb,spawn:[-14,18,0],target:{x:12,z:-14,yaw:Math.PI,w:3.45,d:6.4,reverse:true},par:100,style:'harbour'},
 {name:'Seaside Snacks',kind:'Wide approach',hint:'Pass the snack stands and park in S9.',code:'S9',theme:0xb5c9c0,spawn:[-14,18,0],target:{x:12,z:-15,yaw:0,w:4,d:7.2},par:70,style:'seaside'},
 {name:'Construction Yard',kind:'Reverse-in',hint:'Weave through the concrete barriers, then reverse into Y10.',code:'Y10',theme:0xc6b695,spawn:[15,18,0],target:{x:-14,z:-15,yaw:Math.PI,w:3.8,d:7.2,reverse:true},par:95,style:'construction'},
 {name:'Drive-in Cinema',kind:'Angled parking',hint:'Find the empty diagonal bay facing the screen.',code:'M11',theme:0x7b909f,spawn:[-15,18,0],target:{x:13,z:-12,yaw:-Math.PI/6,w:3.9,d:7.2},par:85,style:'cinema'},
 {name:'Campsite',kind:'Reverse turn',hint:'Circle the trees and back into the pitch on the right.',code:'C12',theme:0x9bae8e,spawn:[-15,18,0],target:{x:15,z:0,yaw:Math.PI/2,w:4,d:7.4,reverse:true},par:100,style:'camp'},
 {name:'Scrapyard',kind:'Obstacle maze',hint:'Navigate the scrap piles to reach J13.',code:'J13',theme:0xb1a58e,spawn:[-15,18,0],target:{x:12,z:-15,yaw:0,w:3.8,d:7.1},par:100,style:'scrap'},
 {name:'Hotel Valet',kind:'Reverse precision',hint:'Go around the fountain and reverse under the portico.',code:'V14',theme:0xc3bca8,spawn:[-16,18,0],target:{x:0,z:-17,yaw:Math.PI,w:3.7,d:7.1,reverse:true},par:100,style:'valet'},
 {name:'Factory Switchback',kind:'Double hairpin',hint:'Right around the first wall. Left around the next.',code:'F15',theme:0xa8b5b5,spawn:[-15,18,0],target:{x:-14,z:-14,yaw:0,w:3.8,d:7.2},par:120,style:'factory'},
 {name:'Festival Finale',kind:'Reverse slalom',hint:'Thread the festival stalls and reverse into F16.',code:'F16',theme:0xc4c2a3,spawn:[-15,18,0],target:{x:13,z:-15,yaw:Math.PI,w:3.7,d:7.4,reverse:true},par:120,style:'festival'},
 {name:'Station Approach',kind:'Angled bay',hint:'Pass the taxi island, then swing into R17 beside the platform.',code:'R17',theme:0xb3bac1,spawn:[-15,18,0],target:{x:12,z:-14,yaw:-Math.PI/4,w:3.9,d:7.4},par:95,style:'station'},
 {name:'Orchard Farm',kind:'Reverse barn',hint:'Weave around the hay stacks. Back into the barn apron.',code:'O18',theme:0xb9c292,spawn:[-15,18,0],target:{x:0,z:-16,yaw:Math.PI,w:3.9,d:7.5,reverse:true},par:115,style:'orchard'},
 {name:'Hospital Court',kind:'Island turns',hint:'Keep clear of the ambulance bays. Circle the gardens to H19.',code:'H19',theme:0xb6c5c4,spawn:[-15,18,0],target:{x:14,z:-14,yaw:0,w:3.7,d:7.2},par:110,style:'hospital'},
 {name:'Airport Shuttle',kind:'Angled reverse',hint:'Pass the luggage islands and back diagonally into A20.',code:'A20',theme:0xb2bec9,spawn:[-15,18,0],target:{x:12,z:-13,yaw:Math.PI+Math.PI/6,w:3.9,d:7.6,reverse:true},par:125,style:'airport'},
 {name:'Quarry Yard',kind:'Parallel reverse',hint:'Take the wide route around the stone piles, then reverse between the trucks.',code:'Q21',theme:0xc3b394,spawn:[-15,18,0],target:{x:15,z:0,yaw:0,w:3.7,d:8,reverse:true},par:130,style:'quarry'},
 {name:'Marina Service',kind:'Dry-dock reverse',hint:'Thread the boat cradles and back into the service bay.',code:'M22',theme:0xabc3c5,spawn:[15,18,0],target:{x:-14,z:-15,yaw:Math.PI,w:3.8,d:7.5,reverse:true},par:130,style:'marina'},
 {name:'Mountain Lodge',kind:'Angled arrival',hint:'Wind past the snow islands. Approach L23 on the diagonal.',code:'L23',theme:0xcad4d4,spawn:[-15,18,0],target:{x:0,z:-16,yaw:Math.PI/8,w:3.8,d:7.5},par:125,style:'lodge'},
 {name:'The Final Test',kind:'Precision reverse',hint:'Clear both staggered walls, turn in the upper court, then back into T24.',code:'T24',theme:0xb9c2b4,spawn:[-15,18,0],target:{x:13,z:-17,yaw:Math.PI,w:3.65,d:7.4,reverse:true},par:150,style:'academy'}
];
export const LOTS=BASE_LOTS.map((l,i)=>{const t={...l.target,x:l.target.x*2,z:l.target.z*2},side=l.spawn[0]<0?-1:1;
 const gates=[{x:side*38,z:24,yaw:0},{x:-side*38,z:24,yaw:side<0?-Math.PI/2:Math.PI/2},{x:t.x+Math.sin(t.yaw)*9*(t.reverse?-1:1),z:t.z+Math.cos(t.yaw)*9*(t.reverse?-1:1),yaw:t.yaw,reverse:!!t.reverse}];
 return {...l,target:t,spawn:[side*38,40,0],par:Math.round(l.par*1.8),gates,gateWidth:6-Math.floor(i/8)*.55,hint:'Clear the three numbered gates, then '+(t.reverse?'reverse into ':'park in ')+l.code+'.'};
});
export const CHAPTER_SIZE=8;
export function completedThrough(saves,count){return Array.from({length:count},(_,i)=>saves[i]?.stars>=1).every(Boolean);}
export function isLotUnlocked(index,saves){return Number.isInteger(index)&&index>=0&&index<LOTS.length&&completedThrough(saves,Math.floor(index/CHAPTER_SIZE)*CHAPTER_SIZE);}
export function nextLotIndex(index,saves){
 const next=index+1;if(next<LOTS.length&&isLotUnlocked(next,saves))return next;
 for(let i=0;i<LOTS.length;i++)if(isLotUnlocked(i,saves)&&!(saves[i]?.stars>=1))return i;
 return null;
}
// Full footprint containment, heading, final approach, upright and stationary checks.
export function assessParking(pose,target){
 const dx=pose.x-target.x,dz=pose.z-target.z,c=Math.cos(target.yaw),s=Math.sin(target.yaw),x=c*dx-s*dz,z=s*dx+c*dz;
 const angle=Math.atan2(Math.sin(pose.yaw-target.yaw),Math.cos(pose.yaw-target.yaw));
 const width=pose.halfWidth??1.27,length=pose.halfLength??2.4;
 const halfW=Math.abs(Math.cos(angle))*width+Math.abs(Math.sin(angle))*length,halfD=Math.abs(Math.cos(angle))*length+Math.abs(Math.sin(angle))*width;
 const contained=Math.abs(x)+halfW<=target.w/2&&Math.abs(z)+halfD<=target.d/2;
 const aligned=Math.abs(angle)<Math.PI/18,stopped=pose.speed<.22,upright=pose.up>.92,approach=!target.reverse||pose.lastDirection===-1;
 return {contained,aligned,stopped,approach,valid:contained&&aligned&&stopped&&upright&&approach,offset:Math.hypot(x,z),angle:Math.abs(angle),near:Math.hypot(dx,dz)<8};
}
export function buildLots({T,C,scene,world,groundMat}){
 const parkedCars=[],obstacles=[],breakables=[],views=[],materials=new Map(),boxGeo=new T.BoxGeometry(1,1,1);
 const mat=c=>{if(!materials.has(c))materials.set(c,new T.MeshStandardMaterial({color:c,roughness:.82}));return materials.get(c);};
 LOTS.forEach((level,index)=>{const ox=index*240,g=new T.Group();scene.add(g);g.visible=index===0;let mini=[];const phys=[];
 let structureSerial=0;
 function piece(w,h,d,x,y,z,color,yaw=0,structure=null){const m=new T.Mesh(boxGeo,mat(color));m.scale.set(w,h,d);m.position.set(ox+x,y,z);m.rotation.y=yaw;m.castShadow=h>.3;m.receiveShadow=true;g.add(m);
 const b=new C.Body({mass:0,material:groundMat,shape:new C.Box(new C.Vec3(w/2,h/2,d/2)),position:new C.Vec3(ox+x,y,z)});b.quaternion.setFromEuler(0,yaw,0);b.userData={kind:structure?'building':'scenery'};b.updateAABB();phys.push(b);m.userData.body=b;breakables.push({mesh:m,body:b,level:index,size:[w,h,d],structure});return m;}
 function box(w,h,d,x,y,z,color,yaw=0,solid=false){x*=2;z*=2;
 // Ground is supplied by the deformable heightfield; markings remain logical guides.
 if(y<0&&w>40&&d>40)return null;
 const building=h>=4&&w>=7&&d>=5;
 if(building){w*=2;d*=2;const id=index+':'+structureSerial++,rows=Math.ceil(h/4),hx=w/2,hz=d/2;
  const wall=(length,axis,side)=>{const cols=Math.ceil(length/6);for(let row=0;row<rows;row++)for(let c=0;c<cols;c++){const offset=-length/2+(c+.5)*length/cols;piece(axis===0?length/cols:.55,h/rows,axis===0?.55:length/cols,x+(axis===0?offset:side*hx),y-h/2+(row+.5)*h/rows,z+(axis===0?side*hz:offset),color,yaw,id);}};
  for(const side of [-1,1]){wall(w,0,side);wall(d,1,side);}const nx=Math.ceil(w/6),nz=Math.ceil(d/6);for(let i=0;i<nx;i++)for(let j=0;j<nz;j++)piece(w/nx,.35,d/nz,x-w/2+(i+.5)*w/nx,y+h/2+.18,z-d/2+(j+.5)*d/nz,0x7b8277,yaw,id);mini.push({x,z,w,d,yaw,color:'#677b75'});return null;
 }
 // Stretch architecture and boundary walls, while preserving full-size vehicles and bays.
 if(Math.abs(x)>44||Math.abs(z)>44){w*=2;d*=2;}
 const physical=solid||h>.025&&y>.11;
 if(physical){const nx=Math.ceil(w/7),nz=Math.ceil(d/7);let first=null;for(let i=0;i<nx;i++)for(let j=0;j<nz;j++){const px=-w/2+(i+.5)*w/nx,pz=-d/2+(j+.5)*d/nz;const m=piece(w/nx,h,d/nz,x+Math.cos(yaw)*px+Math.sin(yaw)*pz,y,z-Math.sin(yaw)*px+Math.cos(yaw)*pz,color,yaw);first??=m;}mini.push({x,z,w,d,yaw,color:'#a5b6ac'});return first;}
 const m=new T.Mesh(boxGeo,mat(color));m.scale.set(w,h,d);m.position.set(ox+x,y,z);m.rotation.y=yaw;m.receiveShadow=true;g.add(m);m.userData.guide=y<=.11;return m;}
 function text(value,x,y,z,width=5,yaw=0,ground=false,color='#193c35'){const cv=document.createElement('canvas');cv.width=512;cv.height=128;const ctx=cv.getContext('2d');ctx.fillStyle=color;ctx.fillRect(0,0,512,128);ctx.fillStyle='#fff6dd';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 46px system-ui';ctx.fillText(value,256,65);const tx=new T.CanvasTexture(cv);tx.colorSpace=T.SRGBColorSpace;const mesh=new T.Mesh(new T.PlaneGeometry(width,width/4),new T.MeshBasicMaterial({map:tx,side:T.DoubleSide}));mesh.position.set(ox+x*2,y,z*2);mesh.userData.guide=ground;if(ground){mesh.rotation.x=-Math.PI/2;mesh.rotation.z=yaw;}else mesh.rotation.y=yaw;g.add(mesh);return mesh;}
 function tree(x,z){box(.45,3,.45,x,1.5,z,0x6d634e,0,true);const crown=new T.Mesh(new T.IcosahedronGeometry(2.3,0),mat(0x527f65));crown.position.set(ox+x*2,4,z*2);g.add(crown);}
 function island(x,z,w,d){box(w,.28,d,x,.14,z,0xc6cab6,0,true);box(w-.4,.08,d-.4,x,.3,z,0x81946d);if(w>3)tree(x,z);}
 function cone(x,z){const m=new T.Mesh(new T.ConeGeometry(.32,.8,12),mat(0xec9d4f));m.position.set(ox+x*2,.4,z*2);g.add(m);box(.5,.08,.5,x,.04,z,0x393e37,0,true);}
 function parked(x,z,yaw,color=0x688d9b){x*=2;z*=2;const car=new T.Group();car.position.set(ox+x,0,z);car.rotation.y=yaw;g.add(car);function part(w,h,d,px,py,pz,col){const m=new T.Mesh(boxGeo,mat(col));m.scale.set(w,h,d);m.position.set(px,py,pz);m.castShadow=true;car.add(m);}part(1.95,.65,4.2,0,.7,0,color);part(1.55,.65,2.2,0,1.3,.1,0x40565a);part(1.62,.1,1.7,0,1.66,.2,color);for(const side of [-1,1])for(const end of [-1,1]){const tire=new T.Mesh(new T.CylinderGeometry(.35,.35,.22,12),mat(0x252c2a));tire.rotation.z=Math.PI/2;tire.position.set(side,.40,end*1.35);tire.castShadow=true;car.add(tire);const rim=new T.Mesh(new T.CylinderGeometry(.21,.21,.225,12),mat(0xa9b5ae));rim.rotation.z=Math.PI/2;rim.position.copy(tire.position);car.add(rim);}part(1.5,.17,.07,0,.78,-2.14,0xe7e3bf);part(1.5,.15,.07,0,.78,2.14,0xa15143);const body=new C.Body({mass:0,material:groundMat,shape:new C.Box(new C.Vec3(1.04,.75,2.18)),position:new C.Vec3(ox+x,.8,z)});body.quaternion.setFromEuler(0,yaw,0);body.userData={kind:'parked car'};parkedCars.push({mesh:car,body,level:index});body.updateAABB();world.addBody(body);phys.push(body);mini.push({x,z,w:2.1,d:4.4,yaw,color:'#677e89'});}
 function bay(x,z,yaw=0,w=3.6,d=6.4,target=false){x*=2;z*=2;if(!target&&Math.hypot(x-level.target.x,z-level.target.z)<.1)return null;const group=new T.Group();group.position.set(ox+x,.035,z);group.rotation.y=yaw;group.userData.guide=true;g.add(group);for(const side of [-1,1]){const line=new T.Mesh(boxGeo,mat(target?0x83f0b0:0xcfd4bd));line.scale.set(.11,.025,d);line.position.x=side*w/2;group.add(line);}for(const end of [-1,1]){const line=new T.Mesh(boxGeo,mat(target?0x83f0b0:0xcfd4bd));line.scale.set(w,.025,.11);line.position.z=end*d/2;group.add(line);}if(target){const fill=new T.Mesh(new T.PlaneGeometry(w,d),new T.MeshBasicMaterial({color:0x74e6ab,transparent:true,opacity:.22,depthWrite:false,side:T.DoubleSide}));fill.rotation.x=-Math.PI/2;fill.position.y=.01;group.add(fill);const shape=new T.Shape();shape.moveTo(0,-1);shape.lineTo(-.55,-.2);shape.lineTo(-.17,-.2);shape.lineTo(-.17,.65);shape.lineTo(.17,.65);shape.lineTo(.17,-.2);shape.lineTo(.55,-.2);shape.closePath();const arrow=new T.Mesh(new T.ShapeGeometry(shape),new T.MeshBasicMaterial({color:0xc9ffd9,side:T.DoubleSide}));arrow.rotation.x=Math.PI/2;arrow.position.y=.08;group.add(arrow);return {group,fill};}}
 // A bounded lot with a generous internal entrance and no endless road.
 box(110,.1,105,0,-.13,0,0x8d9e81);box(96,.08,96,0,-.01,0,0x566260);
 box(47,.32,.45,0,.16,-23.3,0xbdc5b5,0,true);box(.45,.32,47,-23.3,.16,0,0xbdc5b5,0,true);box(.45,.32,47,23.3,.16,0,0xbdc5b5,0,true);box(18,.32,.45,-14.5,.16,23.3,0xbdc5b5,0,true);box(18,.32,.45,14.5,.16,23.3,0xbdc5b5,0,true);
 for(let x=-18;x<=18;x+=9)tree(x,-28);for(let z=-12;z<=18;z+=12)tree(-28,z);
 text(level.name.toUpperCase(),0,3.7,-25,13);box(17,1.3,.2,0,3.7,-25,0x244339);box(.18,4,.18,-6,2,-25,0x626b60);box(.18,4,.18,6,2,-25,0x626b60);
 const colors=[0x9b6359,0x698a97,0xcbc7b0,0x676977,0xa69667];
 if(level.style==='market'){box(29,5,8,3,2.5,-34,0xc3c3ab);text('MARKET',3,3,-29.9,8);for(let x of [-12,-8,-4,0,4,8,12,16]){bay(x,-15);if(x!==4)parked(x,-15,0,colors[(x+12)/4%5]);}island(-1,2,12,3);cone(-8,6);cone(7,6);}
 if(level.style==='diner'){box(19,4,9,0,2,-32,0xbf7866);text('SUNSET DINER',0,2.8,-27.4,11);for(let x of [-12,-6,0,7,13]){bay(x,-10,-Math.PI/4);if(x!==7)parked(x,-10,-Math.PI/4,colors[Math.abs(x)%5]);}island(1,8,12,2.5);box(8,.5,1,-12,.25,-19,0xbdc4b2,0,true);}
 if(level.style==='office'){box(25,12,9,2,6,-32,0x829c9b);for(let x of [-14,-10,-6,-2,2,6,10,14,18]){bay(x,-15);parked(x,-15,0,colors[Math.abs(x)%5]);}for(let x of [-7,-3,1,5,9,13,17]){bay(x,14);if(x!==5)parked(x,14,Math.PI,colors[Math.abs(x)%5]);}island(-4,-1,13,2.6);}
 if(level.style==='street'){for(let z of [-18,-9,9,18])parked(16,z,0,colors[Math.abs(z)%5]);for(let z of [-14,-6,3,12])parked(-16,z,Math.PI,colors[Math.abs(z)%5]);box(4,.25,46,21,.12,0,0xcbbfa8,0,true);box(4,.25,46,-21,.12,0,0xcbbfa8,0,true);for(let z=-18;z<=18;z+=9){box(7,6+(z+18)%4,7,-29,3,z,0xa99078);box(5,6,7,29,3,z,0xb5ab8e);}for(let z=-20;z<20;z+=5)box(.12,.02,2,0,.05,z,0xd7ce9e);}
 if(level.style==='garden'){box(23,4,7,3,2,-32,0x69896b);text('GARDEN CENTRE',3,2.7,-28.4,13);island(-8,7,9,3);island(8,-1,9,3);island(-7,-8,9,3);for(let x of [3,7,11,15,19]){bay(x,-15);if(x!==11)parked(x,-15,0,colors[x%5]);}for(let z of [-4,2,8])cone(0,z);}
 if(level.style==='motel'){box(7,5,34,-30,2.5,0,0xb7a08a);box(44,5,7,0,2.5,-31,0xb7a08a);island(0,0,12,12);box(6,.55,6,0,.7,0,0xa7c6c1,0,true);for(let z of [-15,-9,-3,3,9]){bay(15,z,Math.PI/2);if(z!==-9)parked(15,z,Math.PI/2,colors[Math.abs(z)%5]);}text('COURTYARD',0,3.5,-27.4,12);}
 if(level.style==='warehouse'){box(37,7,9,0,3.5,-31,0x87989a);text('GOODS IN',6,3,-26.4,10);for(let x of [0,4,8,12,16]){bay(x,-14,Math.PI);if(x!==8)parked(x,-14,Math.PI,colors[x%5]);}box(14,1.3,3,-9,.65,-4,0xa89472,0,true);box(9,1.3,3,12,.65,7,0xa89472,0,true);for(let z of [-4,0,4])cone(1,z);}
 if(level.style==='harbour'){box(30,.05,75,42,-.05,0,0x6b9caa);box(1,.7,46,22,.35,0,0xd3c8a6,0,true);for(let z=-18;z<20;z+=5)box(.35,1.3,.35,21,.65,z,0x796d57,0,true);for(let x of [0,4,8,12,16]){bay(x,-14,Math.PI);if(x!==12)parked(x,-14,Math.PI,colors[x%5]);}box(19,.8,2,-8,.4,7,0xc7b285,0,true);box(14,.8,2,14,.4,-1,0xc7b285,0,true);for(let z of [-6,-3,0])cone(-2,z);}

 if(level.style==='seaside'){box(32,.05,90,43,-.04,0,0x6397a9);for(let z of [-15,-5,5,15]){box(5,2.8,5,-19,1.4,z,colors[(z+15)/10%5],0,true);box(5.7,.2,5.7,-19,2.9,z,0xd9b25d);}text('SNACK SHACK',-19,3.8,-5,6);island(-5,6,13,3);island(8,-3,10,2.5);for(let x of [0,4,8,12,16]){bay(x,-15,0,4,7.2);if(x!==12)parked(x,-15,0,colors[x%5]);}}
 if(level.style==='construction'){box(13,.9,2,11,.45,7,0xe7bb53,0,true);box(16,.9,2,-8,.45,-2,0xe7bb53,0,true);for(let x of [-14,-9,-4]){bay(x,-15,Math.PI,3.8,7.2);if(x!==-14)parked(x,-15,Math.PI,0xbd884c);}for(let x of [10,15,20]){box(3,2,4,x,1,-15,0x8c918c,0,true);cone(x,1);}box(.4,13,.4,26,6.5,-16,0xdcb445);box(18,.5,.5,18,13,-16,0xdcb445);text('WORK ZONE',4,2.5,-23,9);}
 if(level.style==='cinema'){box(31,10,.5,0,7,-28,0x273e47);box(28,8,.1,0,7.5,-27.7,0xcbd9d7);text('DRIVE-IN',0,7.5,-27.5,14,0,false,'#536c74');for(let z of [-12,3])for(let x of [-14,-5,4,13]){bay(x,z,-Math.PI/6,3.9,7.2);if(!(x===13&&z===-12))parked(x,z,-Math.PI/6,colors[Math.abs(x+z)%5]);}}
 if(level.style==='camp'){for(const [x,z] of [[-4,8],[0,-6],[-14,-12]])island(x,z,7,6);for(const [x,z] of [[-14,0],[13,-14],[13,13]]){box(3,2.4,5,x,1.5,z,0xc6ba90,0,true);box(2.6,.15,5.4,x,2.8,z,0x839a7d);}bay(15,0,Math.PI/2,4,7.4);text('CAMPSITE',0,3,-26,10);}
 if(level.style==='scrap'){for(const [x,z] of [[-9,8],[9,0],[-9,-8]]){box(12,1.1,3,x,.55,z,0x8e6b4d,0,true);for(let j=-1;j<=1;j++)parked(x+j*3.2,z,Math.PI/2,colors[(j+2)%5]);}for(let x of [4,8,12,16]){bay(x,-15,0,3.8,7.1);if(x!==12)parked(x,-15,0,0x947453);}text('SALVAGE',0,4,-28,12);}
 if(level.style==='valet'){box(38,11,8,0,5.5,-31,0xd0c7ad);box(13,.3,8,0,4.8,-18,0xb7a182);for(let x of [-6,6])box(.6,4.8,.6,x,2.4,-16,0xcabb9e,0,true);island(0,0,12,10);box(5,.55,5,0,.7,0,0x83b5b6,0,true);for(let z of [-9,0,9])for(let x of [-17,17])parked(x,z,Math.PI/2,colors[Math.abs(z)%5]);text('HOTEL',0,7,-26.8,10);}
 if(level.style==='factory'){box(27,1.2,2,-9,.6,8,0x82969a,0,true);box(27,1.2,2,9,.6,-2,0x82969a,0,true);for(let x of [-14,-9,-4]){bay(x,-14,0,3.8,7.2);if(x!==-14)parked(x,-14,0,colors[Math.abs(x)%5]);}for(let x of [9,16])box(5,3.5,7,x,1.75,-15,0x97695d,0,true);box(42,8,8,0,4,-31,0x829094);text('FACTORY',0,5,-26.7,13);}
 if(level.style==='festival'){for(const [x,z] of [[-9,8],[9,0],[-9,-8]]){box(10,.45,3,x,.225,z,0xc7b27f,0,true);for(let k of [-1,1])box(3,2.6,3,x+k*2.5,1.3,z,colors[Math.abs(z+k)%5],0,true);}for(let x of [5,9,13,17]){bay(x,-15,Math.PI,3.7,7.4);if(x!==13)parked(x,-15,Math.PI,colors[x%5]);}text('FESTIVAL',0,4,-28,12);}

 // Chapter three: eight distinct sites, with generous maneuvering space for the limousine.
 if(level.style==='station'){
  box(47,.35,5,0,.16,-28,0xa7aba6);for(const offset of [-.72,.72])box(48,.10,.12,0,.22,-34+offset,0x687575);
  for(let x=-22;x<=22;x+=2)box(.22,.08,2.2,x,.15,-34,0x786957);
  box(15,3.1,3.4,-7,1.9,-34,0xa65446);box(13.9,.9,3.5,-7,2.2,-34,0x637e89);box(16,.18,4.0,-7,3.6,-34,0xd5c8ab);
  island(-3,0,15,4);for(const x of [-9,-3,3]){box(2,.4,.7,x,.7,0,0x926e4d);box(.12,1,.8,x-.7,.7,0,0x6a756d);}
  for(const x of [-15,-8,12]){bay(x,-14,-Math.PI/4,3.9,7.4);if(x!==12)parked(x,-14,-Math.PI/4,0xc8aa48);}
  box(10,4,6,-29,2,8,0xbab19c);text('STATION',-7,4.4,-28,12);
 }
 if(level.style==='orchard'){
  box(18,6,9,0,3,-30,0x9c5946);box(5.5,4.5,.10,0,2.25,-25.4,0x443c32);box(19,.2,10,0,6,-30,0x564b43);text('ORCHARD',0,5,-25.2,10);
  for(const [x,z,w]of [[-8,7,12],[8,-4,12]]){box(w,1.3,3,x,.65,z,0xc9aa59,0,true);for(let k=-w/2+1.5;k<w/2;k+=3){box(.04,1.33,3.02,x+k,.66,z,0x9a8246);box(2.8,.02,.035,x+k,1.31,z,0xe5cf84);}}
  for(const x of [-29,28])for(const z of [-16,-6,4,14]){tree(x,z);box(.25,.25,.25,x+.9,3.8,z,0xad4439);}
  for(const x of [-11,-5,0,6,12]){bay(x,-16,Math.PI,3.9,7.5);if(x!==0)parked(x,-16,Math.PI,colors[Math.abs(x)%5]);}
 }
 if(level.style==='hospital'){
  box(38,12,8,0,6,-31,0xc8d4d0);for(let x=-15;x<=15;x+=5)for(const y of [3,6,9])box(3,1.5,.05,x,y,-26.94,0x7d9ea5);text('HOSPITAL',0,10.3,-26.7,12);
  box(.8,2.7,.08,-10,5.8,-26.6,0xbd584c);box(2.7,.8,.08,-10,5.8,-26.6,0xbd584c);
  island(-7,6,11,5);island(7,-4,9,5);for(const x of [-15,-10,-5,9,14,19]){bay(x,-14,0,3.7,7.2);if(x!==14)parked(x,-14,0,x<0?0xe4ded0:colors[x%5]);}
  for(const z of [2,10]){box(.2,4,.2,20,2,z,0x657a79,0,true);box(1.6,.12,.5,19.4,4,z,0xd6dfbd);}
 }
 if(level.style==='airport'){
  box(45,7,9,0,3.5,-32,0x92a8b1);box(42,3,.08,0,3.8,-27.44,0x537b8e);text('SHUTTLES',0,6.1,-27.3,13);
  island(-8,6,12,3);island(8,-3,11,3);for(const [x,z]of [[-8,6],[8,-3]]){for(let j=-1;j<=1;j++){box(1,.9,1.4,x+j*2,.85,z,0x637d8a);box(.09,.5,.09,x+j*2,1.5,z,0xd4d2bb);}}
  for(const x of [-14,-5,3,12]){bay(x,-13,Math.PI+Math.PI/6,3.9,7.6);if(x!==12)parked(x,-13,Math.PI+Math.PI/6,colors[Math.abs(x)%5]);}
  // Aircraft silhouette is outside the play area, not an invisible collision hazard.
  box(4,1,17,31,2,-9,0xd1d8d1);box(16,.22,3,31,2.4,-7,0xe4e6d5);box(.25,3,3,31,3,0,0x777ba1);
 }
 if(level.style==='quarry'){
  for(const [x,z,w,d]of [[-7,6,12,5],[1,-7,8,5]]){box(w,1.8,d,x,.9,z,0xa8987e,0,true);for(let j=-1;j<=1;j++){const rock=new T.Mesh(new T.IcosahedronGeometry(1,1),mat(0x9f998a));rock.position.set(ox+x*2+j*w*.23,2,z*2);rock.scale.set(w*.22,2,d*.40);g.add(rock);}}
  for(const z of [-10,10]){parked(15,z,0,0xc7a644);box(1.5,.5,2.4,15,1.9,z+.5,0x967e51);}bay(15,0,0,3.7,8);
  box(8,4,7,-29,2,-14,0xa78e65);text('QUARRY',0,3.6,-26,12);for(const z of [-16,-8,0,8,16])box(.25,1.1,.25,21,.55,z,0xd9bc59,0,true);
 }
 if(level.style==='marina'){
  box(32,.05,85,-43,-.04,0,0x649ca8);
  for(const [x,z]of [[8,7],[-7,-3],[10,-14]]){box(9,1,3,x,.5,z,0x667d79,0,true);const hull=new T.Mesh(new T.SphereGeometry(1,16,8),mat(0xe2dfc7));hull.scale.set(4.2,.8,1.4);hull.position.set(ox+x*2,1.5,z*2);g.add(hull);box(3.2,1.2,1.5,x,2,z,0xc7d0bc);box(2.3,.6,.02,x,2.2,z+ .77,0x5d808b);}
  for(const x of [-14,-9,-4]){bay(x,-15,Math.PI,3.8,7.5);if(x!==-14)parked(x,-15,Math.PI,0x829ca6);}text('MARINA SERVICE',-7,3.8,-26,15);
 }
 if(level.style==='lodge'){
  box(110,.08,105,0,-.075,0,0xd6ded6);box(96,.09,96,0,-.008,0,0x637171);
  for(const [x,z]of [[-8,6],[8,-5]]){box(12,.6,4,x,.30,z,0xd9e1d7,0,true);for(const tx of [x-3,x+3])tree(tx,z);}
  box(25,5,9,0,2.5,-31,0x836a51);const roof=new T.Mesh(new T.ConeGeometry(1,1,4),mat(0xd5ddd6));roof.scale.set(20,4,8);roof.rotation.y=Math.PI/4;roof.position.set(ox,6,-62);g.add(roof);text('LODGE',0,3.6,-26.3,10);
  for(const x of [-13,-6,0,7,14]){bay(x,-16,Math.PI/8,3.8,7.5);if(x!==0)parked(x,-16,Math.PI/8,colors[Math.abs(x)%5]);}
  for(const [x,z,r,h]of [[-37,-37,18,24],[25,-47,24,30]]){const mountain=new T.Mesh(new T.ConeGeometry(r,h,6),mat(0xaebdba));mountain.position.set(ox+x*2,h/2-2,z*2);g.add(mountain);}
 }
 if(level.style==='academy'){
  box(20,.75,2,-10,.375,8,0xc4b885,0,true);box(15,.75,2,11,.375,-2,0xc4b885,0,true);
  for(const [x,z]of [[-10,8],[11,-2]])for(let j=-3;j<=3;j++)box(.5,.02,1.8,x+j*2,.76,z,0x686e62);
  for(const x of [5,9,13,17]){bay(x,-17,Math.PI,3.65,7.4);if(x!==13)parked(x,-17,Math.PI,colors[x%5]);}
  for(const z of [-13,-6,0])cone(-18,z);box(18,5,8,0,2.5,-31,0x879c86);text('FINAL TEST',0,3.5,-26.8,12);
 }

 const t=level.target,marker=bay(t.x/2,t.z/2,t.yaw,t.w,t.d,true);text(level.code,(t.x+Math.sin(t.yaw)*(t.d/2-.44))/2,.085,(t.z+Math.cos(t.yaw)*(t.d/2-.44))/2,1.55,t.yaw,true,'#247957');
 // Beacon stays low enough to avoid blocking orbit cameras.
 const beacon=text('P · '+level.code,t.x/2,2.8,t.z/2,2.8);beacon.userData.guide=true;beacon.material.depthTest=false;beacon.renderOrder=2;
 // Precision gates create a staged route; paint cannot be bypassed by blowing up posts.
 const gates=level.gates.map((gate,i)=>{const width=level.gateWidth,group=new T.Group();group.position.set(ox+gate.x,.06,gate.z);group.rotation.y=gate.yaw;group.userData.guide=true;g.add(group);
  const line=new T.Mesh(boxGeo,new T.MeshBasicMaterial({color:0xffcf72,transparent:true,opacity:.9,side:T.DoubleSide}));line.scale.set(width,.035,.35);group.add(line);
  const arrowShape=new T.Shape();arrowShape.moveTo(0,-1.5);arrowShape.lineTo(-.65,-.5);arrowShape.lineTo(-.2,-.5);arrowShape.lineTo(-.2,1);arrowShape.lineTo(.2,1);arrowShape.lineTo(.2,-.5);arrowShape.lineTo(.65,-.5);arrowShape.closePath();const arrow=new T.Mesh(new T.ShapeGeometry(arrowShape),line.material);arrow.rotation.x=Math.PI/2;arrow.rotation.z=gate.reverse?Math.PI:0;arrow.position.set(0,.04,gate.reverse?-2.2:2.2);group.add(arrow);
  const label=text(String(i+1)+(gate.reverse?' · R':''),gate.x/2,3.2,gate.z/2,2.2);label.userData.guide=true;label.material.depthTest=false;label.material.depthWrite=false;label.renderOrder=4;
  for(const side of [-1,1])piece(.35,1,.35,gate.x+Math.cos(gate.yaw)*side*(width/2+.3),.5,gate.z-Math.sin(gate.yaw)*side*(width/2+.3),0xe7b05b);
  return{...gate,group,label,line};});
 // Alternating barriers force an S-turn through the cross aisle, away from bay approaches.
 const clear=(x,z,r)=>Math.hypot(x-t.x,z-t.z)>r&&level.gates.every(a=>Math.hypot(a.x-x,a.z-z)>6);
 for(const [x,z]of [[-22,20],[0,28],[22,20]])if(clear(x,z,11)){box(7,.85,1,x/2,.425,z/2,0xe2bb68,0,true);cone((x-4)/2,z/2);cone((x+4)/2,z/2);}
 for(const x of [-26,-10,10,26])if(clear(x,40,10))parked(x/2,20,0,colors[(index+Math.abs(x))%5]);
 // Close neighbours make the final bay a realistic fit even in the much larger lot.
 for(const side of [-1,1]){const offset=t.w/2+1.25,x=t.x+Math.cos(t.yaw)*offset*side,z=t.z-Math.sin(t.yaw)*offset*side;
  const occupied=parkedCars.some(p=>p.level===index&&Math.hypot(p.body.position.x-ox-x,p.body.position.z-z)<4.8);
  if(!occupied)parked(x/2,z/2,t.yaw,colors[(index+(side>0?1:0))%5]);}
 // Every remaining physical prop gets a body. Decorations ride with their support.
 g.updateMatrixWorld(true);for(const m of [...g.children]){if(!m.isMesh||m.userData.guide||m.userData.body)continue;
  m.geometry.computeBoundingBox();const bounds=m.geometry.boundingBox.clone().applyMatrix4(m.matrixWorld),size=new T.Vector3();bounds.getSize(size);
  const local=breakables.filter(e=>e.level===index),support=local.map(e=>({e,d:e.mesh.position.distanceTo(m.position)})).filter(a=>a.d<Math.max(3,Math.max(...a.e.size)/2+1.5)).sort((a,b)=>a.d-b.d)[0]?.e;
  if(support){support.mesh.attach(m);continue;}
  const b=new C.Body({mass:0,material:groundMat,shape:new C.Box(new C.Vec3(Math.max(.08,size.x/2),Math.max(.08,size.y/2),Math.max(.08,size.z/2))),position:new C.Vec3(m.position.x,m.position.y,m.position.z)});b.userData={kind:'scenery'};m.userData.body=b;phys.push(b);breakables.push({mesh:m,body:b,level:index,size:size.toArray(),structure:null});
 }
 views.push({group:g,ox,marker,beacon,mini,phys,gates});

 });
 return {views,obstacles,breakables,parked:parkedCars,show(index){views.forEach((v,i)=>{v.group.visible=i===index;for(const body of v.phys){const present=world.bodies.includes(body);if(i===index&&!present)world.addBody(body);else if(i!==index&&present)world.removeBody(body);}});}};
}
