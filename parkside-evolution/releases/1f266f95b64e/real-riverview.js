// Original geometry approximating the supplied Riverview parking photographs.
// x runs across the parking rows; hospital access road runs along the west edge.
export function buildRiverview({T,group,ox,piece,bay,parked,text,mini,mat,breakables,buildings,index}){
 const geo=new T.BoxGeometry(1,1,1);
 function surface(w,d,x,z,color,y=.035){const m=new T.Mesh(geo,mat(color));m.scale.set(w,.02,d);m.position.set(ox+x,y,z);m.userData.guide=true;group.add(m);return m;}
 function curb(w,d,x,z){return piece(w,.34,d,x,.17,z,0xd1b776);}
 function fence(w,d,x,z){piece(w,.75,d,x,.375,z,0xb5b5a5);}
 function tree(x,z){const trunk=piece(.45,4,.45,x,2,z,0x6b5943);trunk.name='Riverview tree';const crown=new T.Mesh(new T.IcosahedronGeometry(1,1),mat(0x688348));crown.position.set(ox+x,4.5,z);crown.scale.set(1.8,2,1.8);group.add(crown);group.updateMatrixWorld(true);trunk.attach(crown);}
 function hospital(name,x,z,w,d,h){const id=index+':hospital:'+buildings.length;buildings.push({id,level:index,x:ox+x,z,w,d,h,yaw:0,name,type:'hospital'});const rows=Math.ceil(h/3.5);
  for(let row=0;row<rows;row++)for(const side of [-1,1])for(const axis of [0,1]){const length=axis?d:w,n=Math.ceil(length/5);for(let col=0;col<n;col++){const offset=-length/2+(col+.5)*length/n,px=x+(axis?side*w/2:offset),pz=z+(axis?offset:side*d/2),y=(row+.5)*h/rows;const wall=piece(axis?.5:length/n,h/rows,axis?length/n:.5,px,y,pz,0xb28b68,0,id);const window=new T.Mesh(geo,mat(0x78969e));window.position.set(ox+px+(axis?side*.3:0),y,pz+(axis?0:side*.3));window.scale.set(axis?.08:1.5,1.3,axis?1.5:.08);group.add(window);group.updateMatrixWorld(true);wall.attach(window);}}
  for(let a=0;a<Math.ceil(w/5);a++)for(let b=0;b<Math.ceil(d/5);b++){piece(w/Math.ceil(w/5),.35,d/Math.ceil(d/5),x-w/2+(a+.5)*w/Math.ceil(w/5),h+.18,z-d/2+(b+.5)*d/Math.ceil(d/5),0xc4c7bd,0,id);breakables.at(-1).role='roof';}
  mini.push({x,z,w,d,color:'#ae8d75'});
 }
 surface(92,92,0,0,0x3d4445);surface(12,118,-53,7,0x43494a);surface(115,12,0,65,0x43494a);surface(29,12,-39,-52,0x43494a);
 // Exactly one open neck: north-west gate. Front Street and all other edges are closed.
 for(let z=-46;z<46;z+=4){fence(.6,4,-46,z+2);fence(.6,4,46,z+2);}
 for(let x=-46;x<46;x+=4)fence(4,.6,x+2,46);
 for(let x=-28;x<46;x+=4)fence(4,.6,x+2,-46);
 curb(.5,112,-60,4);curb(28,.5,-44,-59);
 hospital('Blaisdell Pavilion',-77,-1,25,91,15);
 hospital('Riverview Medical Center',-5,-76,108,24,19);
 hospital('Emergency wing',-76,63,25,24,10);
 text('RIVERVIEW MEDICAL CENTER',-5/2,16,-63.5/2,28);
 text('BLAISDELL PAVILION',-64/2,8,0,18,Math.PI/2);
 surface(12,186,-99,0,0x4b8d9b,.02);
 let slots=0,occupied=0;const vacancies=new Set([7,43,76,103]);
 function stall(x,z,yaw){const target=Math.abs(x+23.2)<.1&&Math.abs(z-21.8)<.15;bay(x/2,z/2,yaw,3.15,6.4);const n=slots++;if(!target&&!vacancies.has(n)&&n%19!==0){parked(x/2,z/2,yaw);occupied++;}}
 // Three long double banks and perimeter stalls leave continuous north/south aisles.
 for(const bank of [-20,0,20])for(let row=0;row<18;row++){const z=-32.6+row*3.4;stall(bank-3.2,z,-Math.PI/2);stall(bank+3.2,z,Math.PI/2);}
 for(let row=0;row<18;row++){const z=-32.6+row*3.4;stall(-41,z,-Math.PI/2);stall(41,z,Math.PI/2);}
 for(const x of [-20,0,20])for(const z of [-39,34]){curb(12,2,x,z);tree(x,z);}
 for(const z of [-30,-10,10,30]){tree(-48.8,z);tree(49.5,z);}
 // Ticket islands at the shared entrance/exit; both lanes stay passable.
 curb(1.1,6,-37,-47);for(const x of [-46,-28]){piece(.65,1.4,.7,x,.7,-48,0xe8e4d8);piece(.22,1.7,.22,x+(x<-37?-1:1),.85,-48,0xefc250);}
 for(const z of [-28,0,28]){const pole=piece(.22,7,.22,10,3.5,z,0x56616a);const lamp=new T.Mesh(geo,mat(0xe8e3c6));lamp.position.set(ox+10,7,z);lamp.scale.set(2,.2,.6);group.add(lamp);group.updateMatrixWorld(true);pole.attach(lamp);}
 for(let x=-52;x<46;x+=5)surface(2.6,.14,x,65,0xdbd8c0,.065);
 for(let i=0;i<6;i++)surface(.8,4,-43+i*2,-42,0xe5e2cf,.066);
 mini.push({x:-53,z:7,w:12,d:118,color:'#566063'},{x:-39,z:-52,w:29,d:12,color:'#566063'});
 group.userData.riverview={slots,occupied,entrances:1,approach:[[-53,64],[-53,-52],[-37,-52],[-37,-34]],vacantTarget:{x:-23.2,z:21.8}};
}
