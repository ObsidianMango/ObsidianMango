// Adult stage figures: shared boxes, bounded cached fill materials, no extra physics or lights.
export function createClubRoom(T){
 let dancers=[],lights=[],clock=0,tips=0;const performerMaterials=new Map();
 const performerMat=color=>{if(!performerMaterials.has(color))performerMaterials.set(color,new T.MeshStandardMaterial({color,roughness:.78,emissive:color,emissiveIntensity:.18}));return performerMaterials.get(color);};const palettes=[0xde75c3,0x79cbd0,0xe2b658];let palette=0;
 function build({room,box,label}){dancers=[];lights=[];clock=0;label(room,'VELVET · ADULT CLUB',0,2.9,-6.82,6);box(room,9,.35,3.4,0,.175,-4.5,0x482b49,true);box(room,9,.06,.14,0,.38,-2.85,0xe2b658);
  for(const x of [-2.6,2.6]){
   box(room,.065,3.1,.065,x,1.9,-4.3,0xcbd4da);
   const skin=x<0?0xbf967f:0x9c735d,costume=x<0?0x93426d:0x397f88,hairColor=x<0?0x332939:0x75432c,dancer=new T.Group();
   dancer.name='Adult stage performer';dancer.position.set(x+.42,.35,-4.3);dancer.rotation.y=Math.PI;room.add(dancer);
   dancer.userData.adult=true;dancer.userData.gender='female';dancer.userData.style='blocky-stage-costume';dancer.userData.hairstyle=x<0?'long-side-part':'auburn-bob';dancer.userData.costume=x<0?'plum-dress':'teal-dress';
   const torso=new T.Group();torso.name='Outfit and shoulders';torso.position.y=1.06;dancer.add(torso);
   box(torso,.30,.22,.21,0,.07,0,costume);box(torso,.26,.17,.21,0,-.125,0,costume);box(torso,.33,.11,.22,0,.16,0,costume);
   const belt=box(torso,.28,.035,.225,0,-.19,0,0xe2b658);belt.name='Costume waist trim';
   // Modest covered clothing contours, kept fixed to the torso throughout animation.
   for(const side of [-1,1]){const contour=box(torso,.13,.11,.065,side*.065,.07,-.115,costume);contour.name='Covered outfit contour';box(torso,.024,.025,.015,side*.13,.17,-.12,0xe2b658);}
   box(torso,.19,.035,.025,0,.205,-.09,0xe2b658);
   box(dancer,.32,.17,.22,0,.77,0,0x302a39);box(dancer,.095,.09,.10,0,1.28,0,skin);
   const cloth=[];for(const z of [-.13,.13]){const panel=new T.Group();panel.name='Costume hem';panel.position.set(0,.83,z);dancer.add(panel);box(panel,.36,.33,.035,0,-.15,0,costume);cloth.push(panel);}for(const side of [-1,1])box(dancer,.025,.34,.28,side*.17,.675,0,costume);
   const head=new T.Group();head.name='Performer head';head.position.y=1.45;dancer.add(head);
   box(head,.25,.29,.25,0,0,0,skin);box(head,.21,.035,.20,0,-.153,0,skin);box(head,.28,.11,.27,0,.15,.025,hairColor);
   const fringe=box(head,.17,.055,.04,x<0?-.035:.035,.105,-.125,hairColor);fringe.name='Side-part fringe';fringe.rotation.z=x<0?-.12:.12;
   for(const side of [-1,1]){
    const eye=box(head,.039,.025,.012,side*.052,.019,-.13,0xf0e7dc);eye.name='Performer eye';box(head,.016,.022,.013,side*.052,.019,-.139,0x302a39);
    const brow=box(head,.041,.011,.012,side*.052,.052,-.133,hairColor);brow.name='Performer eyebrow';brow.rotation.z=side*.07;
    box(head,.042,.007,.014,side*.054,.034,-.139,0x302a39);box(head,.024,.062,.055,side*.132,-.025,0,skin);
    const earring=box(head,.018,.038,.019,side*.143,-.077,-.027,0xe2b658);earring.name='Stage earring';
   }
   box(head,.038,.05,.027,0,-.028,-.135,skin);box(head,.046,.014,.012,0,-.075,-.133,0xa25164);box(head,.034,.010,.012,0,-.088,-.132,0xa25164);
   const hair=[];for(const x of [-.13,0,.13]){const lock=new T.Group();lock.name='Hair sway';lock.position.set(x,.10,.095);head.add(lock);const length=x===0?.32:.35;box(lock,x===0?.13:.07,skin===0xbf967f?length:.20,.075,0,skin===0xbf967f?-.13:-.06,.015,hairColor);hair.push(lock);}
   const legs=[],knees=[],arms=[],elbows=[];
   for(const side of [-1,1]){
    const hip=new T.Group();hip.position.set(side*.10,.76,0);dancer.add(hip);box(hip,.13,.34,.15,0,-.17,0,skin);legs.push(hip);
    const knee=new T.Group();knee.position.y=-.34;hip.add(knee);box(knee,.11,.30,.13,0,-.15,0,skin);box(knee,.14,.11,.23,0,-.305,-.045,0x222b35);knees.push(knee);
    const shoulder=new T.Group();shoulder.position.set(side*.215,.18,0);torso.add(shoulder);box(shoulder,.095,.25,.12,0,-.125,0,skin);box(shoulder,.105,.085,.13,0,-.04,0,costume);arms.push(shoulder);
    const elbow=new T.Group();elbow.position.y=-.25;shoulder.add(elbow);box(elbow,.085,.24,.105,0,-.12,0,skin);box(elbow,.075,.08,.095,0,-.25,0,skin);elbows.push(elbow);
   }
   dancer.traverse(m=>{if(m.isMesh){m.material=performerMat(m.material.color.getHex());m.castShadow=false;}});
   dancers.push({root:dancer,baseX:x+.42,torso,head,hair,cloth,legs,knees,arms,elbows});
  }
  for(const x of [-6,6])for(const z of [-.5,3]){box(room,2.3,.42,1.1,x,.3,z,0x6d375e,true);box(room,2.3,.72,.18,x,.86,z+.48,0x4d294a);box(room,1.2,.09,.8,x,.65,z-1.0,0x4a3646,true);box(room,.12,.6,.12,x,.30,z-1.0,0xcbb879);box(room,.09,.17,.09,x+.25,.78,z-1.0,0xe2b658);}
  box(room,3,1,.8,4.9,.5,-5.9,0x322c3b,true);label(room,'BAR',4.9,2.4,-6.82,2);for(let i=0;i<7;i++)box(room,.11,.36,.11,3.8+i*.35,1.27,-5.9,[0x76a9a5,0xba8d66][i%2]);
  box(room,2.2,.9,1.2,-5.5,.45,-5.4,0x292c3a,true);label(room,'DJ',-5.5,2.3,-6.8,1.4);for(const x of [-6,-5])box(room,.48,.07,.48,x,.95,-5.4,0xd0bd80);
  // Bright stage framing gives the performers separation from the dark wall.
  for(const x of [-2.6,2.6]){box(room,1.5,2.35,.035,x+.42,1.6,-6.78,0x62405d);for(const side of [-1,1]){const fill=box(room,.055,2.4,.05,x+.42+side*.8,1.6,-6.73,0xe2b658);fill.material=performerMat(0xe2b658);}}
  for(const x of [-4,-2,0,2,4]){const light=box(room,.75,.05,.6,x,3.1,-3.6,palettes[palette]);lights.push(light);box(room,.12,.06,3,x,.015,.15,palettes[palette]);}
  label(room,'DANCE FLOOR',0,1.9,2.3,3);label(room,'TIP STAGE · $10',0,1.15,-2.55,3);
 }
 function update(dt){
  if(!Number.isFinite(dt)||dt<=0)return;dt=Math.min(dt,.05);clock+=dt;
  dancers.forEach((d,i)=>{
   const phase=clock*1.7+i*Math.PI,step=Math.sin(phase),sway=Math.sin(phase*.55),follow=1-Math.exp(-dt*8);
   d.root.position.x=d.baseX+step*.10;d.root.position.y=.35+Math.abs(step)*.022;d.root.rotation.y=Math.PI+sway*.22;
   d.torso.rotation.z=step*.025;d.head.rotation.y=-sway*.13;d.head.rotation.z=-step*.025;
   for(let j=0;j<2;j++){const side=j?1:-1;d.legs[j].rotation.x=side*step*.12;d.legs[j].rotation.z=side*.018;d.knees[j].rotation.x=Math.max(0,-side*step)*.18;d.arms[j].rotation.z=side*(.12+.09*Math.sin(phase+.4));d.arms[j].rotation.x=side*step*.13;d.elbows[j].rotation.x=-.18-.14*(1+Math.sin(phase+j));}
   // Hair and hems lag behind the whole-body step; no body-part deformation.
   for(let j=0;j<d.hair.length;j++){const lock=d.hair[j];lock.rotation.z+=(-step*.06+j*.006-lock.rotation.z)*follow;lock.rotation.x+=(sway*.035-lock.rotation.x)*follow;}
   for(let j=0;j<d.cloth.length;j++){const panel=d.cloth[j];panel.rotation.x+=((j?1:-1)*Math.abs(step)*.035-panel.rotation.x)*follow;}
  });
 }
 function changeLights(){palette=(palette+1)%palettes.length;for(const m of lights)m.material.color.setHex(palettes[palette]);}
 return{build,update,changeLights,tip(){tips++;},clear(){dancers=[];lights=[];},getInfo:()=>({performerMaterials:performerMaterials.size,performers:dancers.length,femalePerformers:dancers.filter(d=>d.root.userData.gender==='female').length,tips,palette})};
}
