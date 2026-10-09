import {createSlotReels} from './slot-reels.js?v=street-29';
import {WHEEL_ORDER,RED_NUMBERS} from './casino-games.js?v=casino-19';
// Reusable geometry, emissive trims and painted table details; no expensive point lights.
export function createCasinoRoom(T){
 const slots=createSlotReels(T);
 const reducedMotion=typeof window!=='undefined'&&window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
 const cylinder=new T.CylinderGeometry(1,1,1,24),sphere=new T.IcosahedronGeometry(1,1),ring=new T.TorusGeometry(1,.07,6,32),mats=new Map();
 const material=color=>{if(!mats.has(color))mats.set(color,new T.MeshStandardMaterial({color,roughness:.55,metalness:color===0xccaa61?.55:.05}));return mats.get(color);};
 let ceiling=null,movers=[],reelFaces=[],ball=null,clock=0,lastNumber=0,resources={batches:0,instances:0};
 const glow=new T.MeshBasicMaterial({color:0xffcd77}),pink=new T.MeshBasicMaterial({color:0xf195d0});
 function mesh(parent,geo,color,x,y,z,sx,sy,sz){const m=new T.Mesh(geo,material(color));m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=m.receiveShadow=true;parent.add(m);return m;}
 function dynamic(m,kind){m.userData.casinoMotion=kind;movers.push(m);return m;}
 function batch(room){const groups=new Map();for(const m of [...room.children]){if(!m.isMesh||m.userData.casinoMotion||m.material.map)continue;const key=m.geometry.uuid+':'+m.material.uuid;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(m);}let instances=0,batches=0;for(const list of groups.values()){if(list.length<2)continue;const batch=new T.InstancedMesh(list[0].geometry,list[0].material,list.length);list.forEach((m,i)=>{m.updateMatrix();batch.setMatrixAt(i,m.matrix);room.remove(m);});batch.castShadow=false;batch.receiveShadow=true;batch.computeBoundingSphere();batch.instanceMatrix.needsUpdate=true;batch.userData.indoorParts=list.map(m=>({position:m.position.clone(),scale:m.scale.clone(),matrix:m.matrix.clone()}));batch.name='Casino shared detail';room.add(batch);instances+=list.length;batches++;}resources={batches:resources.batches+batches,instances:resources.instances+instances};}
 function build({room,box,label}){slots.clear();resources={batches:0,instances:0};movers=[];reelFaces=[];ball=null;clock=0;
  box(room,15.8,.02,13.8,0,.012,0,0x563650);for(let x=-7;x<8;x+=2)for(let z=-6;z<7;z+=2)box(room,.9,.014,.9,x,.029,z,0x674563);
  for(const x of [-7.8,7.8]){box(room,.1,.18,13.8,x,.25,0,0xccaa61);box(room,.1,.12,13.8,x,2.8,0,0xccaa61);}
  box(room,15.7,.12,.12,0,2.8,-6.8,0xccaa61);label(room,'LUCKY MANGO',0,2.4,-6.78,6);
  // Bar: counter, brass footrail, bottle shelving and two velvet stools.
  box(room,5.6,1,.7,0,.5,-5.95,0x33263e,true);box(room,5.8,.16,.95,0,1.1,-5.95,0xccaa61);box(room,5.8,.08,.08,0,.25,-5.3,0xccaa61);
  for(const y of [1.45,1.95]){box(room,5,.08,.3,0,y,-6.65,0x392d42);for(let i=0;i<12;i++){const x=-2.2+i*.4;mesh(room,cylinder,[0x438e7c,0xac604e,0xaabb77][i%3],x,y+.19,-6.6,.07,.3,.07);mesh(room,cylinder,0xccaa61,x,y+.38,-6.6,.035,.12,.035);}}
  for(const x of [-1.7,1.7]){mesh(room,cylinder,0x33263e,x,.43,-4.85,.12,.8,.12);mesh(room,cylinder,0x954766,x,.87,-4.85,.36,.14,.36);}
  // Slot cabinets with screens, button decks, coin slots, lights and separate painted reels.
  for(const z of [-2,.1,2.2]){
   box(room,1.15,.85,.85,-6.2,.425,z,0x282838,true);box(room,.55,1.95,.85,-6.5,.98,z,0x282838);for(const side of [-1,1])box(room,1.15,1.95,.08,-6.2,.98,z+side*.47,0x282838);box(room,1.27,.14,.97,-6.2,1.98,z,0xccaa61);box(room,.03,.66,.96,-5.74,1.35,z,0x0d2832);
   slots.build(room,z);
   box(room,.65,.15,1.13,-5.94,.87,z,0x4b3c58);for(const offset of [-.28,0,.28])mesh(room,cylinder,0xe8bd6c,-5.68,.97,z+offset,.07,.04,.07);box(room,.015,.035,.3,-5.73,.62,z,0xccaa61);const sign=label(room,'SLOTS',-5.7,2.18,z,1.2);sign.rotation.y=Math.PI/2;
  }
  for(const z of [-2,.1,2.2]){mesh(room,cylinder,0x33263e,-4.65,.25,z,.12,.5,.12);mesh(room,cylinder,0x954766,-4.65,.52,z,.3,.12,.3);}
  function table(x,z,w,d,title){box(room,w,.15,d,x,.9,z,0x253e37,true);box(room,w+.15,.13,d+.15,x,.8,z,0x39283e);for(const side of [-1,1])box(room,.14,.72,.14,x+side*(w/2-.2),.4,z,0xccaa61);label(room,title,x,1.48,z-.55,2);}
  table(-2,-2.9,2.8,1.8,'BLACKJACK');table(4,-2.9,3,2,'DRAW POKER');
  // Cards and chip stacks on both felt tables.
  for(const [x,z]of [[-2,-2.9],[4,-2.9]]){for(let i=0;i<5;i++){const c=box(room,.27,.02,.4,x-1+i*.5,1,z+.45,0xf4e8c7);c.rotation.y=(i-2)*.08;box(room,.065,.02,.12,x-1+i*.5,1.014,z+.45,i%2?0x973e49:0x263242);for(let j=0;j<3;j++)mesh(room,cylinder,[0xb94b64,0x8cb399,0xe6c67a][i%3],x-1+i*.5,1+j*.035,z,.11,.035,.11);}}
  // Roulette wheel, gold rim, numbered pockets and a white ball.
  box(room,2.8,.15,2.5,4,.9,1.6,0x253e37,true);mesh(room,cylinder,0x39283e,4,.7,1.6,1.2,.18,1.2);mesh(room,cylinder,0x644537,4,1.04,1.6,.92,.1,.92);const rim=mesh(room,ring,0xccaa61,4,1.09,1.6,.92,.92,.92);rim.rotation.x=-Math.PI/2;
  for(let i=0;i<37;i++){const a=i*Math.PI*2/37;const p=box(room,.12,.02,.22,4+Math.sin(a)*.72,1.11,1.6+Math.cos(a)*.72,WHEEL_ORDER[i]===0?0x518a6b:RED_NUMBERS.has(WHEEL_ORDER[i])?0xb34954:0x202333);p.rotation.y=a;}
  mesh(room,cylinder,0xccaa61,4,1.14,1.6,.16,.24,.16);ball=dynamic(mesh(room,sphere,0xf4eacb,4.7,1.15,1.7,.045,.045,.045),'ball');label(room,'ROULETTE',4,1.8,1.2,2.5);
  // Upholstered chairs and two dealers anchor the tables at human scale.
  for(const [x,z]of [[-2,-1.2],[4,-1.15],[4,3.25]]){box(room,.75,.12,.72,x,.5,z,0x914e76,true);box(room,.75,.65,.1,x,.9,z+.3,0x914e76);for(const s of [-1,1])box(room,.1,.48,.1,x+s*.25,.25,z,0xccaa61);}
  for(const [x,z]of [[-2,-4.2],[4,-4.35]]){box(room,.52,.7,.3,x,1,z,0x272c39);dynamic(mesh(room,sphere,0xc89f7c,x,1.55,z,.17,.2,.17),'head');dynamic(box(room,.16,.45,.25,x+.38,1.02,z+.1,0xf0e1c7),'arm');box(room,.08,.13,.02,x,1.28,z+.17,0xccaa61);}
  // Lounge, gilded wall panels and a chandelier silhouette.
  for(const x of [-5.2,5.2]){box(room,.1,.16,1.6,x,2.6,-6.8,0xccaa61);box(room,.1,1.2,.1,x,2.1,-6.8,0xccaa61);}
  for(let i=0;i<8;i++){const a=i*Math.PI/4,m=mesh(room,sphere,0xe8bc71,Math.cos(a)*1.1,3.15,Math.sin(a)*1.1,.11,.16,.11);m.material=i%2?pink:glow;}const crown=mesh(room,ring,0xccaa61,0,3.08,0,1.1,1.1,1.1);crown.rotation.x=-Math.PI/2;
  // A ceiling appears in eye-level view; overhead play keeps a readable dollhouse view.
  ceiling=new T.Group();ceiling.name='First-person casino ceiling';room.add(ceiling);box(ceiling,15.8,.08,13.8,0,3.62,0,0x33263e);for(const x of [-6,-2,2,6])for(const z of [-4.5,0,4.5]){box(ceiling,3.65,.06,4.1,x,3.55,z,0x563650);box(ceiling,.045,.07,4.1,x-1.8,3.5,z,0xccaa61);box(ceiling,3.65,.07,.045,x,3.5,z-2,0xccaa61);}batch(ceiling);ceiling.visible=false;
  // Paneled walls, upholstered booths, framed art, carpet borders and fluted columns.
  for(const x of [-7.75,7.75])for(let z=-5.8;z<=5.8;z+=2.9){box(room,.08,2.45,2.6,x,1.35,z,0x33263e);for(const a of [-1.22,1.22])box(room,.09,2.3,.045,x+.02,1.35,z+a,0xccaa61);for(const y of [.23,2.48])box(room,.1,.035,2.45,x+.03,y,z,0xccaa61);const art=box(room,.11,.7,1.1,x+(x<0?.04:-.04),1.75,z,0x438e7c);for(let i=0;i<3;i++)box(room,.13,.2,.14,x+(x<0?.07:-.07),1.6+i*.14,z-.3+i*.27,0xe8bd6c);}
  for(const [x,z]of [[-7,5.8],[7,5.8],[-7,-5.6],[7,-5.6]]){mesh(room,cylinder,0xccaa61,x,.11,z,.36,.18,.36);mesh(room,cylinder,0x563650,x,1.7,z,.24,3.1,.24);for(let i=0;i<8;i++){const a=i*Math.PI/4;mesh(room,cylinder,0xccaa61,x+Math.sin(a)*.25,1.7,z+Math.cos(a)*.25,.024,3,.024);}mesh(room,cylinder,0xccaa61,x,3.3,z,.38,.18,.38);}
  // Clear central red-carpet aisle from the entrance to the bar.
  box(room,1.8,.012,10.8,0,.045,.5,0x8d3457);for(const x of [-.91,.91])box(room,.04,.014,10.8,x,.048,.5,0xccaa61);
  for(const z of [-2.9,1.6])for(let x=2.85;x<5.2;x+=.3)box(room,.12,.012,.14,x,1.002,z+.35,0xccaa61);
  for(const [x,z]of [[-2,-2.9],[4,-2.9]]){for(const side of [-1,1])box(room,.06,.014,1.48,x+side*1.18,1.008,z,0xccaa61);box(room,2.4,.014,.045,x,1.008,z-.68,0xccaa61);for(let i=0;i<3;i++){const chip=mesh(room,cylinder,0xf4e8c7,x-1+i,1.02,z-.3,.15,.025,.15);for(let j=0;j<4;j++){const a=j*Math.PI/2;box(room,.04,.02,.04,x-1+i+Math.cos(a)*.13,1.037,z-.3+Math.sin(a)*.13,0x953d52);}}}
  // Cashier cage with glass, brass lattice and visible bundled chips.
  box(room,2.2,1.05,.8,5.5,.53,4.8,0x33263e,true);box(room,2.35,.12,.96,5.5,1.12,4.8,0xccaa61);for(let i=0;i<7;i++)box(room,.035,1.05,.04,4.5+i*.33,1.75,4.7,0xccaa61);for(const y of [1.3,2.2])box(room,2.2,.035,.04,5.5,y,4.7,0xccaa61);label(room,'CASHIER · PLAYER CARD',5.5,2.5,4.5,3);for(let i=0;i<8;i++)for(let j=0;j<3;j++)mesh(room,cylinder,[0xb94b64,0x8cb399,0xe6c67a][i%3],4.65+i*.24,1.2+j*.035,4.8,.09,.035,.09);
  box(room,.5,.7,.3,5.5,1.1,5.5,0x253e37);dynamic(mesh(room,sphere,0xc89f7c,5.5,1.66,5.5,.17,.2,.17),'head');
  // Booth backs, cushions, small tables, cups and greenery along the lounge.
  for(const [x,z]of [[-5.6,5.5],[-2.9,5.5]]){box(room,2.05,.32,.72,x,.25,z,0x914e76,true);box(room,2.05,.66,.18,x,.81,z+.3,0x73455e);for(const d of [-.6,0,.6])box(room,.55,.12,.6,x+d,.47,z,0xad6b86);mesh(room,cylinder,0xccaa61,x,.65,z-.8,.38,.06,.38);mesh(room,cylinder,0xe8e2b7,x,.78,z-.8,.075,.2,.075);box(room,.4,.02,.3,x-.13,.7,z-.74,0xf4e8c7);}
  for(const [x,z]of [[-7.1,3.8],[7.1,-.8]]){mesh(room,cylinder,0xccaa61,x,.32,z,.3,.6,.3);for(let i=0;i<5;i++)mesh(room,sphere,0x438e7c,x+Math.sin(i*2)*.22,.9+i*.09,z+Math.cos(i*2)*.22,.14,.4,.14);}
  label(room,'LOUNGE',-4.4,2.7,6.82,2.4);label(room,'BAR · MANGO SODA',0,2.95,-6.77,4.5);label(room,'FIVE PAYLINES',-5.7,2.7,.1,2.8).rotation.y=Math.PI/2;
  // Repeated furnishing becomes GPU instances, with only animated parts kept separate.
  batch(room);
 }
 function update(dt,result,busy=false,stationZ=null){slots.update(dt,result,busy,stationZ);clock+=Math.min(dt,.05);if(result?.game==='roulette')lastNumber=result.number;const angle=WHEEL_ORDER.indexOf(lastNumber)*Math.PI*2/37;if(ball)ball.position.set(4+Math.sin(angle)*.72,1.15,1.6+Math.cos(angle)*.72);for(let i=0;i<movers.length;i++){const m=movers[i],kind=m.userData.casinoMotion;if(!reducedMotion&&kind==='head')m.rotation.y=Math.sin(clock*.7+i)*.12;else if(!reducedMotion&&kind==='arm')m.rotation.x=Math.sin(clock*.8+i)*.12;}if(result?.game==='slots')for(let i=0;i<reelFaces.length;i++)reelFaces[i].material=material([0xcf554d,0xe2bb5a,0x7bad88,0xf195d0,0xf4eacb][result.reels[i%result.reels.length]]);}
 return {build,update,clear(){slots.clear();movers=[];reelFaces=[];ceiling=null;ball=null;},setFirstPerson(value){if(ceiling)ceiling.visible=value;},materials:slots.materials,geometries:new Set([cylinder,sphere,ring,...slots.geometries]),getInfo:()=>({slots:slots.getInfo(),sharedGeometries:5,materials:mats.size+2,...resources,animatedParts:movers.length})};
}
export const CASINO_STATIONS=[
 {game:'slots',x:-4.8,z:-2,seatX:-4.65,seatZ:-2,yaw:Math.PI/2,name:'Cherry slot'},
 {game:'slots',x:-4.8,z:.1,seatX:-4.65,seatZ:.1,yaw:Math.PI/2,name:'Mango slot'},
 {game:'slots',x:-4.8,z:2.2,seatX:-4.65,seatZ:2.2,yaw:Math.PI/2,name:'Diamond slot'},
 {game:'roulette',x:2.1,z:1.6,seatX:4,seatZ:3.25,yaw:0,name:'Roulette'},
 {game:'poker',x:2.05,z:-2.6,seatX:4,seatZ:-1.15,yaw:0,name:'Draw poker'},
 {game:'blackjack',x:-3.15,z:-.8,seatX:-2,seatZ:-1.2,yaw:0,name:'Blackjack'},
 {game:'lobby',x:5.5,z:3.45,name:'Cashier & player card'},
 {game:'bar',x:0,z:-4.5,name:'Bar'},
 {game:'sit',x:-4,z:4.4,seatX:-2.9,seatZ:5.35,yaw:0,name:'Lounge seat'}
];
