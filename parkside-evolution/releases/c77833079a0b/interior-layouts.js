// Each layout is a separate room scene; only the selected hospital floor is built.
export const INTERIOR_LAYOUTS={restaurant:{title:'Marina Kitchen',floors:['Restaurant']},hospital:{title:'Riverview',floors:['Lobby','Patient floor 2','Patient floor 3']}};
export function buildInteriorLayout({T,room,box,label,people,building,floor,cutaway}){
 const hospital=building.type==='hospital',ward=hospital&&floor>0,wood=0x8f6c49,metal=0x879c9d,teal=0x547d7b,ivory=0xe4dfcf;
 function part(w,h,d,x,y,z,c,solid=false,structural=false,parent=room){const m=box(parent,w,h,d,x,y,z,c,solid);m.userData.interiorStatic=structural;return m;}
 let groupId=0;function breakable(mesh,id){mesh.userData.interiorBreakable=true;mesh.userData.breakGroup=id;return mesh;}
 function wall(w,d,x,z,c=ivory){const alongX=w>=d,count=Math.ceil(Math.max(w,d)/2.4);for(let i=0;i<count;i++){const sw=alongX?w/count:w,sd=alongX?d:d/count,sx=x+(alongX?(i-(count-1)/2)*sw:0),sz=z+(!alongX?(i-(count-1)/2)*sd:0),id='wall-'+groupId++;breakable(part(sw,.9,sd,sx,.45,sz,c,true,true),id);breakable(part(sw,2.45,sd,sx,2.125,sz,c,false,true,cutaway),id);breakable(part(sw+.02,.08,sd+.02,sx,.08,sz,teal,false,true),id);}}

 function sign(text,x,y,z,w=2,ry=0){const m=label(room,text,x,y,z,w);m.rotation.y=ry;return m;}
 function chair(x,z,yaw=0,color=teal){const m=part(.65,.1,.65,x,.46,z,color,true);for(const dx of [-.25,.25])for(const dz of [-.25,.25])part(.05,.43,.05,x+dx,.22,z+dz,metal);part(.67,.62,.09,x,.8,z+Math.cos(yaw)*.29,color);return m;}
 function table(x,z,w=1.8,d=1.05){part(w,.11,d,x,.8,z,wood,true);for(const dx of [-w*.4,w*.4])for(const dz of [-d*.35,d*.35])part(.07,.75,.07,x+dx,.38,z+dz,metal);for(const dx of [-.4,.4]){part(.30,.018,.30,x+dx,.87,z,0xeee9d8);part(.075,.13,.075,x+dx+.16,.94,z+.22,0x9fc1bb);}part(.06,.22,.06,x,.97,z,teal);}
 function plant(x,z){part(.45,.45,.45,x,.225,z,0x9c7857);for(const dx of [-.16,0,.16])part(.2,.65,.19,x+dx,.7,z,0x65875c);}
 function window(x,z,w=2.5){const id='window-'+groupId++;breakable(part(w,1.55,.025,x,1.9,z,0x87b2b6,false,true),id);breakable(part(w+.15,.08,.07,x,1.1,z-.03,ivory,false,true),id);for(const dx of [-w/2,0,w/2])breakable(part(.045,1.6,.06,x+dx,1.9,z-.04,ivory,false,true),id);}
 part(16,.15,14,0,-.075,0,hospital?0xc5cdc5:0x9f8d70,false,true);wall(16,.18,0,-7);for(const x of [-8,8])wall(.18,14,x,0);for(const x of [-4.8,4.8])wall(6.4,.18,x,7);
 for(let col=0;col<4;col++)for(let row=0;row<4;row++)breakable(part(3.95,.12,3.45,-5.925+col*3.95,3.42,-5.175+row*3.45,ivory,false,true,cutaway),'ceiling-'+col+'-'+row);for(const x of [-5,0,5])for(const z of [-4,1,4.5])breakable(part(1.4,.035,.55,x,3.28,z,0xf5edc9,false,true,cutaway),'ceiling-'+Math.min(3,Math.floor((x+7.9)/3.95))+'-'+Math.min(3,Math.floor((z+6.9)/3.45)));
 part(2.5,.025,1.8,0,.02,5.8,0x426f6b,false,true);sign(ward?'LOBBY ↓':'EXIT',0,2.25,6.87,1.6,Math.PI);plant(-7,5.5);plant(7,5.5);
 if(hospital){
  sign(building.name,0,2.9,-6.84,6);sign(ward?'FLOOR '+(floor+1)+' · PATIENT ROOMS':'LOBBY · RECEPTION',0,2.5,-6.82,5);
  // Elevator is shared by every floor, next to the entrance cross-corridor.
  part(2.25,2.8,.12,-5.8,1.4,6.79,metal,false,true);part(.035,2.5,.04,-5.8,1.3,6.70,0x40595d,false,true);part(.22,.38,.06,-4.45,1.25,6.65,0x3d575b,false,true);part(.08,.08,.04,-4.45,1.28,6.60,0xe4c474,false,true);part(2.6,.025,1.8,-5.8,.025,5.5,teal,false,true);sign('ELEVATOR',-5.8,2.98,6.65,2.1,Math.PI);
  if(!ward){
   part(4.8,1.1,.85,0,.55,-3.5,teal,true);part(5,.10,1,0,1.14,-3.5,ivory);part(.6,.42,.08,.8,1.41,-3.56,0x263d49);part(.55,.035,.25,.8,1.18,-3.18,0x4b626b);part(.3,.08,.22,-1,1.22,-3.5,0xf0e8c8);sign('RECEPTION',0,1.7,-3.0,2.5);
   people.add(room,{id:'reception',role:'Receptionist',x:0,z:-4.6,shirt:teal,line:'Welcome to Riverview. The elevator is beside the entrance.'});
   for(const z of [-.5,2.2])for(const x of [-6.4,-5.5,-4.6])chair(x,z,0,0x657c91);
   people.add(room,{id:'visitor-a',role:'Visitor',x:-5.5,z:-.5,pose:'seated',shirt:0xa0765f,line:'Just waiting for visiting hours.'});people.add(room,{id:'visitor-b',role:'Visitor',x:-6.4,z:2.2,pose:'seated',shirt:0x65704e,line:'The nurses have been very kind.'});
   part(1.7,2.15,.65,-6,1.08,-5.6,0x596c6f,true);part(1.35,1.25,.04,-6,1.38,-5.24,0x9db7b7);for(let i=0;i<6;i++)part(.21,.28,.08,-6.5+(i%3)*.45,.95+Math.floor(i/3)*.5,-5.18,[0xad7258,0x799585,0xc6b36c][i%3]);sign('WAITING AREA',-5.4,2.5,-6.82,3.2);
   // A small consultation room, entered through a clear opening.
   wall(.14,4.3,2.5,-4.7);wall(1.35,.14,3.18,-2.55);wall(1.7,.14,6.95,-2.55);sign('CONSULTATION',5.1,2.45,-2.48,2.9);part(2.1,.65,.85,5.4,.45,-5.2,0x99b4b2,true);part(.7,.13,.85,6.05,.82,-5.2,0xe8e7da);part(1.1,.9,.6,7,.45,-3.6,metal,true);
   people.add(room,{id:'doctor',role:'Doctor',x:3.9,z:.2,shirt:0xe9ece1,route:[[3.9,.2],[3.9,3.6]],line:'Patient rooms are on floors two and three.'});people.add(room,{id:'nurse-lobby',role:'Nurse',x:4.9,z:-4.2,shirt:0x6b9b9e,line:'This is the consultation room. Please keep the doorway clear.'});
   part(2.1,.04,1.4,3.9,.025,1.8,0xa5b8ad,false,true);plant(6.8,.2);
  }else{
   for(const side of [-1,1]){
    for(const [a,b]of [[-6.8,-4.35],[-2.95,.35],[1.75,4.25]])wall(.16,b-a,side*1.7,(a+b)/2);
    wall(6.1,.14,side*4.8,-.8);
    for(let row=0;row<2;row++){
     const z=row?1.6:-3.65,x=side*5,number=(floor+1)*100+row*2+(side<0?1:2);sign('ROOM '+number,side*2.8,2.4,z+.65,1.65);
     part(1.2,.38,2.35,x,.42,z,metal,true);part(1.14,.22,2.22,x,.72,z,0xe9e6da);part(1.12,.13,.43,x,.91,z+.83,0xf4f0e4);part(1.14,.11,1.38,x,.91,z-.3,0x91b3af);for(const dx of [-.65,.65])part(.045,.43,1.5,x+dx,.75,z,metal);for(const dz of [-1.2,1.2])part(1.25,.65,.07,x,.55,z+dz,metal);
     people.add(room,{id:'patient-'+number,role:'Patient '+number,x,z:z-.75,y:.88,pose:'patient',shirt:0xdde9e1,skin:row?0xba8968:0xd5aa8d,line:'Thanks for stopping by.'});
     part(.65,.8,.6,side*6.8,.4,z-.5,0x9aa9a0,true);part(.30,.33,.035,side*6.8,1.2,z-.48,0x233e45);part(.23,.12,.03,side*6.8,1.22,z-.5,0x87bc9d);part(.06,1.3,.06,side*6.5,1,z+.75,metal);part(.25,.35,.10,side*6.5,1.55,z+.75,0xc4ded6);
     chair(side*3.05,z-.7,Math.PI,0x728a9b);part(.6,.1,.45,side*7.1,1.02,z+.75,ivory);window(side*4.9,row?6.86:-6.86,3.2);
    }
   }
   people.add(room,{id:'ward-nurse',role:'Nurse',x:0,z:-3,shirt:0x6b9b9e,route:[[0,-4.8],[0,3.9]],line:'Please take your time visiting. The elevator returns to the lobby.'});people.add(room,{id:'ward-doctor',role:'Doctor',x:6.1,z:3.5,shirt:0xe8ece1,line:'We are making our rounds.'});
   part(.08,.012,10,0,.012,-.5,0x679b9a,false,true);sign('ROOMS '+((floor+1)*100+1)+'–'+((floor+1)*100+4),0,2.15,-6.78,2.8);
  }
 }else{
  sign('MARINA KITCHEN',-3.7,2.8,-6.84,5);sign('DINING · BAR',-3.7,2.35,-6.82,3);
  for(const [i,x,z]of [[0,-3.8,-.3],[1,-3.8,2.8],[2,3.7,-.3],[3,3.7,2.8]]){
   table(x,z);for(const side of [-1,1]){chair(x,z+side*.93,side<0?Math.PI:0);people.add(room,{id:'guest-'+i+'-'+side,role:'Diner',x,z:z+side*.93,yaw:side<0?Math.PI:0,pose:'seated',shirt:[0x83705e,0x5c7890,0x7b815c,0x995f59][(i+(side+1)/2)%4],skin:i%2?0xb78869:0xd3aa8b,line:['The waterfront is beautiful today.','I recommend the fish special.','We are waiting on our food.','Nice place to stop after a walk.'][i]});}
  }
  part(5.5,1.1,.8,-4.3,.55,-5,teal,true);part(5.7,.12,.94,-4.3,1.15,-5,wood);for(const x of [-6.4,-5.3,-4.2,-3.1,-2]){part(.13,.32,.13,x,1.38,-5.05,0x779a81);part(.10,.14,.10,x+.22,1.3,-4.9,0xd6c4a4);}people.add(room,{id:'bartender',role:'Bartender',x:-4.3,z:-6,shirt:0x374c56,line:'Welcome to Marina Kitchen. Grab a table or explore the dining room.'});
  // Kitchen partition with a broad, walkable doorway at x=4.4.
  wall(.14,3.6,1.7,-5);wall(1.6,.14,2.5,-3.2);wall(2.2,.14,6.9,-3.2);sign('KITCHEN',4.55,2.45,-3.1,2.1);
  part(4.9,.92,.75,4.6,.46,-6.3,metal,true);for(const x of [3.1,3.7,4.3])part(.35,.04,.4,x,.96,-6.25,0x32464d);part(1.3,.7,.35,3.7,1.8,-6.6,0xa8b9b5);part(1.0,1.9,.8,7.05,.95,-4.4,metal,true);part(.04,1.6,.06,6.8,1,-3.97,0xd8dfd9);part(1.1,.08,.65,5.4,.97,-6.25,0xcbd8d3);
  people.add(room,{id:'chef',role:'Chef',x:4.7,z:-5.2,shirt:0xe7e9df,line:'Service is underway. Mind the hot stove.'});people.add(room,{id:'server',role:'Server',x:0,z:-1.5,shirt:0x374c56,route:[[0,-2],[0,3.6]],line:'Welcome! The dining room is open.'});
  part(1.15,1,.6,2,.5,5.45,wood,true);sign('WELCOME',2,1.7,5.1,1.6);people.add(room,{id:'host',role:'Host',x:2.7,z:5.7,shirt:0x5b7374,line:'Take any open seat. The green mat leads back outside.'});
  // Bathroom off the bar side, with sink, mirror and a private stall.
  wall(2.6,.14,-6.65,-2.7);wall(.14,1.5,-5.35,-1.95);sign('WC',-5.3,2.1,-1.1,1);part(.65,.1,.5,-7.2,.9,-1.4,ivory,true);part(.55,.75,.025,-7.2,1.5,-2.6,0xa0b8b9);part(.55,.42,.75,-6.2,.25,-1.4,ivory,true);part(.5,.65,.16,-6.2,.6,-1.07,ivory);
  for(const x of [-4.5,4.5])window(x,6.86,3.5);
 }
 return{floorLabel:hospital?INTERIOR_LAYOUTS.hospital.floors[floor]:INTERIOR_LAYOUTS.restaurant.floors[0],elevator:hospital?{x:-5.8,z:5.4}:null,rooms:ward?4:hospital?2:4};
}
