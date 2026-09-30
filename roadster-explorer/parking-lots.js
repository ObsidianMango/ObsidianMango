export const LOTS=[
 {name:'Market Square',kind:'Head-in',hint:'Drive around the island and park in A3.',code:'A3',theme:0xb6bca3,spawn:[-13,17,0],target:{x:4,z:-15,yaw:0,w:3.8,d:6.6},par:45,style:'market'},
 {name:'Sunset Diner',kind:'Angled bay',hint:'Follow the diagonal row. Stop inside D4.',code:'D4',theme:0xc7ab88,spawn:[-15,17,0],target:{x:7,z:-10,yaw:-Math.PI/4,w:3.7,d:6.6},par:55,style:'diner'},
 {name:'Office Hours',kind:'Reverse-in',hint:'Pass B2, select R, then back into the bay.',code:'B2',theme:0x9eb4bb,spawn:[-14,17,0],target:{x:5,z:14,yaw:0,w:3.6,d:6.5,reverse:true},par:65,style:'office'},
 {name:'Old Town',kind:'Parallel parking',hint:'Fit between the two cars along the right curb.',code:'P1',theme:0xc8baa6,spawn:[8,18,0],target:{x:16,z:0,yaw:0,w:3.5,d:7.5,reverse:true},par:80,style:'street'},
 {name:'Garden Centre',kind:'Slalom approach',hint:'Thread the planter islands to reach G6.',code:'G6',theme:0xaabb91,spawn:[-13,18,0],target:{x:11,z:-15,yaw:0,w:3.6,d:6.5},par:70,style:'garden'},
 {name:'The Courtyard',kind:'Tight turn',hint:'Go around the central fountain to reach C2.',code:'C2',theme:0xc1bba3,spawn:[-15,17,0],target:{x:15,z:-9,yaw:Math.PI/2,w:3.7,d:6.5},par:80,style:'motel'},
 {name:'Loading Dock',kind:'Reverse alley',hint:'Turn into the aisle, then back into L3.',code:'L3',theme:0xa5b2b0,spawn:[-15,16,0],target:{x:8,z:-14,yaw:Math.PI,w:3.6,d:6.5,reverse:true},par:90,style:'warehouse'},
 {name:'Harbour Finish',kind:'Precision parking',hint:'Navigate the barriers and reverse into H8.',code:'H8',theme:0x9cb7bb,spawn:[-14,18,0],target:{x:12,z:-14,yaw:Math.PI,w:3.45,d:6.4,reverse:true},par:100,style:'harbour'}
];
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
 const obstacles=[],views=[],materials=new Map(),boxGeo=new T.BoxGeometry(1,1,1);
 const mat=c=>{if(!materials.has(c))materials.set(c,new T.MeshStandardMaterial({color:c,roughness:.82}));return materials.get(c);};
 LOTS.forEach((level,index)=>{const ox=index*120,g=new T.Group();scene.add(g);g.visible=index===0;let mini=[];const phys=[];
 function box(w,h,d,x,y,z,color,yaw=0,solid=false){const m=new T.Mesh(boxGeo,mat(color));m.scale.set(w,h,d);m.position.set(ox+x,y,z);m.rotation.y=yaw;m.castShadow=h>.3;m.receiveShadow=true;g.add(m);if(solid){const b=new C.Body({mass:0,material:groundMat,shape:new C.Box(new C.Vec3(w/2,h/2,d/2)),position:new C.Vec3(ox+x,y,z)});b.quaternion.setFromEuler(0,yaw,0);b.userData={kind:'obstacle'};b.updateAABB();world.addBody(b);phys.push(b);mini.push({x,z,w,d,yaw,color:'#a5b6ac'});}return m;}
 function text(value,x,y,z,width=5,yaw=0,ground=false,color='#193c35'){const cv=document.createElement('canvas');cv.width=512;cv.height=128;const ctx=cv.getContext('2d');ctx.fillStyle=color;ctx.fillRect(0,0,512,128);ctx.fillStyle='#fff6dd';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 46px system-ui';ctx.fillText(value,256,65);const tx=new T.CanvasTexture(cv);tx.colorSpace=T.SRGBColorSpace;const mesh=new T.Mesh(new T.PlaneGeometry(width,width/4),new T.MeshBasicMaterial({map:tx,side:T.DoubleSide}));mesh.position.set(ox+x,y,z);if(ground)mesh.rotation.x=-Math.PI/2;else mesh.rotation.y=yaw;g.add(mesh);return mesh;}
 function tree(x,z){box(.45,3,.45,x,1.5,z,0x6d634e,0,true);const crown=new T.Mesh(new T.IcosahedronGeometry(2.3,0),mat(0x527f65));crown.position.set(ox+x,4,z);g.add(crown);}
 function island(x,z,w,d){box(w,.28,d,x,.14,z,0xc6cab6,0,true);box(w-.4,.08,d-.4,x,.3,z,0x81946d);if(w>3)tree(x,z);}
 function cone(x,z){const m=new T.Mesh(new T.ConeGeometry(.32,.8,12),mat(0xec9d4f));m.position.set(ox+x,.4,z);g.add(m);box(.5,.08,.5,x,.04,z,0x393e37,0,true);}
 function parked(x,z,yaw,color=0x688d9b){const car=new T.Group();car.position.set(ox+x,0,z);car.rotation.y=yaw;g.add(car);function part(w,h,d,px,py,pz,col){const m=new T.Mesh(boxGeo,mat(col));m.scale.set(w,h,d);m.position.set(px,py,pz);m.castShadow=true;car.add(m);}part(1.95,.65,4.2,0,.7,0,color);part(1.55,.65,2.2,0,1.3,.1,0x40565a);part(1.62,.1,1.7,0,1.66,.2,color);for(const side of [-1,1])for(const end of [-1,1])part(.2,.65,.65,side, .43,end*1.35,0x252c2a);part(1.5,.17,.07,0,.78,-2.14,0xe7e3bf);part(1.5,.15,.07,0,.78,2.14,0xa15143);const body=new C.Body({mass:0,material:groundMat,shape:new C.Box(new C.Vec3(1.04,.75,2.18)),position:new C.Vec3(ox+x,.8,z)});body.quaternion.setFromEuler(0,yaw,0);body.userData={kind:'parked car'};body.updateAABB();world.addBody(body);phys.push(body);mini.push({x,z,w:2.1,d:4.4,yaw,color:'#677e89'});}
 function bay(x,z,yaw=0,w=3.6,d=6.4,target=false){const group=new T.Group();group.position.set(ox+x,.035,z);group.rotation.y=yaw;g.add(group);for(const side of [-1,1]){const line=new T.Mesh(boxGeo,mat(target?0x83f0b0:0xcfd4bd));line.scale.set(.11,.025,d);line.position.x=side*w/2;group.add(line);}for(const end of [-1,1]){const line=new T.Mesh(boxGeo,mat(target?0x83f0b0:0xcfd4bd));line.scale.set(w,.025,.11);line.position.z=end*d/2;group.add(line);}if(target){const fill=new T.Mesh(new T.PlaneGeometry(w,d),new T.MeshBasicMaterial({color:0x74e6ab,transparent:true,opacity:.22,depthWrite:false,side:T.DoubleSide}));fill.rotation.x=-Math.PI/2;fill.position.y=.01;group.add(fill);const shape=new T.Shape();shape.moveTo(0,-1);shape.lineTo(-.55,-.2);shape.lineTo(-.17,-.2);shape.lineTo(-.17,.65);shape.lineTo(.17,.65);shape.lineTo(.17,-.2);shape.lineTo(.55,-.2);shape.closePath();const arrow=new T.Mesh(new T.ShapeGeometry(shape),new T.MeshBasicMaterial({color:0xc9ffd9,side:T.DoubleSide}));arrow.rotation.x=Math.PI/2;arrow.position.y=.08;group.add(arrow);return {group,fill};}}
 // A bounded lot with a generous internal entrance and no endless road.
 box(110,.1,105,0,-.13,0,0x8d9e81);box(46,.08,46,0,-.01,0,0x566260);
 box(47,.32,.45,0,.16,-23.3,0xbdc5b5,0,true);box(.45,.32,47,-23.3,.16,0,0xbdc5b5,0,true);box(.45,.32,47,23.3,.16,0,0xbdc5b5,0,true);box(47,.32,.45,0,.16,23.3,0xbdc5b5,0,true);
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
 const t=level.target,marker=bay(t.x,t.z,t.yaw,t.w,t.d,true);text(level.code,t.x,.07,t.z+Math.cos(t.yaw)*2.2,1.8,0,true,'#247957');
 // Beacon stays low enough to avoid blocking orbit cameras.
 const beacon=text('P · '+level.code,t.x,2.8,t.z,2.8);beacon.material.depthTest=false;beacon.renderOrder=2;
 views.push({group:g,ox,marker,beacon,mini,phys});
 });
 return {views,obstacles,show(index){views.forEach((v,i)=>v.group.visible=i===index);}};
}
