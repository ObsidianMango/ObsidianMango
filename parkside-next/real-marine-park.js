// Procedural Red Bank Marine Park approximation from supplied visual references.
// No Google imagery, tiles or screenshots are embedded in the game.
export function buildMarinePark({T,group,ox,piece,bay,parked,text,mini,mat}){
 const cube=new T.BoxGeometry(1,1,1);
 function deco(w,h,d,x,y,z,c,yaw=0){
  const m=new T.Mesh(cube,mat(c));m.position.set(ox+x,y,z);m.scale.set(w,h,d);m.rotation.y=yaw;
  m.castShadow=h>2;m.receiveShadow=true;m.userData.guide=true;group.add(m);return m;
 }
 function plane(w,d,x,z,c,y=.024){
  const m=new T.Mesh(new T.PlaneGeometry(w,d),mat(c));m.rotation.x=-Math.PI/2;
  m.position.set(ox+x,y,z);m.userData.guide=true;m.receiveShadow=true;group.add(m);return m;
 }
 function collision(w,h,d,x,y,z,c){return piece(w,h,d,x,y,z,c);}
 function curb(w,d,x,z){collision(w,.28,d,x,.16,z,0xd0d1c9);deco(w,.04,d,x,.31,z,0xe9e8db);}
 function planter(w,d,x,z){curb(w,d,x,z);deco(w-.5,.07,d-.5,x,.37,z,0x779066);}
 function shrub(x,z,k=1){
  deco(.16,.96,.16,x,.85,z,0x786648);
  for(let j=0;j<4;j++){
   const m=new T.Mesh(new T.IcosahedronGeometry(.6,1),mat(j%2?0x5e854e:0x8c9c63));
   m.position.set(ox+x+Math.cos(j*1.57)*.42*k,1.58+(j%2)*.12,z+Math.sin(j*1.57)*.42*k);
   m.scale.set(k,k*1.1,k);m.castShadow=true;m.userData.guide=true;group.add(m);
  }
 }
 function tree(x,z,c=0x587b4b,h=6){
  collision(.42,h,.42,x,h/2,z,0x675842);
  for(let j=0;j<6;j++){
   const m=new T.Mesh(new T.IcosahedronGeometry(1,1),mat(j%3?c:0x697c51)),q=j*Math.PI/3;
   m.position.set(ox+x+Math.cos(q)*1.25,h*.82+(j%2)*.55,z+Math.sin(q)*1.1);
   m.scale.set(1.55,1.8,1.35);m.castShadow=true;m.userData.guide=true;group.add(m);
  }
 }
 function lamp(x,z){
  collision(.24,6,.24,x,3,z,0x252b31);
  for(const dx of [-.7,.7]){
   deco(1.15,.12,.16,x+dx,6,z,0x262b30);
   deco(.58,.73,.55,x+dx*1.7,5.64,z,0x263039);
   deco(.43,.44,.44,x+dx*1.7,5.65,z,0xf7eed1);
   deco(.7,.12,.65,x+dx*1.7,6.08,z,0x222830);
  }
 }
 // Union St is south (+z), waterfront to north (-z), Oakley Lane east (+x).
 plane(44,77,0,0,0x343b3e);
 plane(46,17,0,45,0x474e50);
 plane(115,72,-5,-87,0x4a919f,.015);
 plane(32,66,-37,-11,0x598f9b,.015);
 plane(10,88,30,0,0x575c5a,.02);
 plane(4,82,23.8,0,0xb2b4a8,.04);
 // Painted parking lot rectangle and vehicle-collidable borders.
 curb(.6,72,-22,-1);curb(.6,72,22,-1);curb(43,.6,0,-37);
 curb(26,.6,-9,38);curb(4,.6,20,38);
 planter(7.5,3,-17.3,34.7);planter(5.6,3.1,18.6,34.6);
 // The very long, narrow landscaped center island in the actual overhead view.
 planter(2.6,39.2,0,-.5);
 for(const z of [-19,-7,6,18])shrub(0,z,.67);
 for(const [x,z] of [[-18.7,35],[19,34],[-20,-33],[20,-33]])shrub(x,z,.8);
 // North waterfront row, western row, both sides of central median, Oakley Ln row.
 for(let x=-12;x<=12;x+=3){
  bay(x/2,-31/2,Math.PI,2.9,5.9);
  if(x!==6&&[-12,-3,12].includes(x))parked(x/2,-31/2,Math.PI,0xb5c6cc);
 }
 for(let z=-22;z<27;z+=3.25){
  bay(-16/2,z/2,Math.PI/2,2.98,5.8);
  bay(17/2,z/2,-Math.PI/2,2.98,5.8);
 }
 for(let z=-18;z<20;z+=3.25){
  bay(-5.8/2,z/2,Math.PI/2,2.96,5.7);
  bay(5.8/2,z/2,-Math.PI/2,2.96,5.7);
 }
 parked(-16/2,16/2,Math.PI/2,0x9aa7a6);
 parked(17/2,15/2,-Math.PI/2,0x9aa7a6);
 parked(17/2,-15/2,-Math.PI/2,0xe4e5dd);
 // Entry crosswalk and STOP on asphalt; physical lane is left unobstructed.
 text('STOP',11.5,.061,44,7,Math.PI,true,'#40494c');
 for(let i=0;i<6;i++)deco(1.25,.024,4,6.9+i*1.65,.064,32.9,0xf3f2e8);
 deco(11.6,.025,.22,11.4,.065,29.6,0xe3e5df);
 for(let z=-25;z<=26;z+=12)deco(.12,.027,2.5,25,.07,z,0xe0e2d8);
 // Historic brown marina office at northwest end, slate roof and white-framed windows.
 collision(18,9.1,12,-14,4.55,-49,0x5e4c3f);
 deco(18.4,.4,12.4,-14,9.3,-49,0x626d6d);
 const roof=new T.Mesh(new T.ConeGeometry(1,1,4),mat(0x788080));roof.rotation.y=Math.PI/4;
 roof.scale.set(13,5.6,10);roof.position.set(ox-14,12.1,-49);roof.castShadow=true;roof.userData.guide=true;group.add(roof);
 for(const x of [-21,-16.5,-12,-7.5])for(const y of [2.5,6.2]){
  deco(1.35,1.95,.12,x,y,-42.89,0xe8e4d8);
  deco(1.01,1.60,.13,x,y,-42.81,0x537e8a);
  deco(1.45,.13,.2,x,y-1.05,-42.75,0xdadbd1);
 }
 for(let y=1;y<9;y+=.42)deco(17.5,.07,.08,-14,y,-42.93,0x70594a);
 // Docks, fence, sailboats and marina waterline.
 plane(35,4,-29,-46.3,0xb8b4a8,.06);
 for(const x of [-39,-34,-29,-24,-19])for(const z of [-59,-53])deco(.35,2.5,.35,x,1.25,z,0x555f57);
 for(let x=-37;x<20;x+=2.5)deco(.13,1.3,.13,x,.68,-57,0x313a3d);
 deco(57,.12,.12,-8,.94,-57,0x303a3d);
 for(const [x,z]of [[-39,-22],[-37,-7],[-38,9],[-32,-46],[-29,-62]]){
  const hull=new T.Mesh(new T.SphereGeometry(1,12,8),mat(0xd7ddd8));
  hull.scale.set(2.9,.66,1.1);hull.position.set(ox+x,.7,z);hull.userData.guide=true;group.add(hull);
  deco(.1,11,.1,x,6.2,z,0xbfc5c2);deco(3.4,.12,.12,x,6.0,z,0xe2e7e3);
 }
 // Black twin-arm lamps, landscaped waterfront, fall-colored trees on Oakley Lane.
 for(const [x,z,col]of [[33,-30,0x64845b],[35,-10,0xb08853],[35,9,0xa56b49],[33,26,0x9c624d]])tree(x,z,col,7);
 for(const [x,z]of [[-20,-22],[21,-16],[21,22],[-20,30]])lamp(x,z);
 // Background opposite-shore architecture, original simple procedural silhouettes.
 for(let i=0;i<9;i++){
  const x=-49+i*10,z=-117+(i%3)*4,h=3+(i%3)*1.4;
  deco(6,h,5,x,h/2,z,[0xc9d1c7,0xdfded5,0xaebbbd][i%3]);
  const r=new T.Mesh(new T.ConeGeometry(1,1,4),mat(0x788688));r.rotation.y=Math.PI/4;
  r.scale.set(4,2.4,4);r.position.set(ox+x,h+1,z);r.userData.guide=true;group.add(r);
 }
 mini.push({x:0,z:-.5,w:2.6,d:39.2,yaw:0,color:'#769469'});
 mini.push({x:-14,z:-49,w:18,d:12,yaw:0,color:'#71604f'});
}
