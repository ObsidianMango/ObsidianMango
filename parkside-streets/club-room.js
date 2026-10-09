// A small stage venue: clothed adult performers, no extra physics or lights.
export function createClubRoom(T){
 let dancers=[],lights=[],clock=0,tips=0;const palettes=[0xde75c3,0x79cbd0,0xe2b658];let palette=0;
 function build({room,box,label}){dancers=[];lights=[];clock=0;label(room,'VELVET · ADULT CLUB',0,2.9,-6.82,6);box(room,9,.35,3.4,0,.175,-4.5,0x482b49,true);box(room,9,.06,.14,0,.38,-2.85,0xe2b658);
  for(const x of [-2.6,2.6]){box(room,.065,3.1,.065,x,1.9,-4.3,0xcbd4da);const dancer=new T.Group();dancer.name='Adult stage performer';dancer.position.set(x+.42,.35,-4.3);room.add(dancer);box(dancer,.36,.52,.24,0,1.02,0,0x95466f);box(dancer,.28,.30,.27,0,1.46,0,0xbf967f);box(dancer,.32,.16,.29,0,1.62,.04,0x332939);const limbs=[];for(const side of [-1,1]){const leg=box(dancer,.13,.72,.17,side*.12,.43,0,0x302a39);const arm=box(dancer,.11,.5,.14,side*.26,1.04,0,0xbf967f);limbs.push(leg,arm);box(dancer,.15,.14,.27,side*.12,.12,-.05,0x222b35);}dancers.push({root:dancer,limbs});}
  for(const x of [-6,6])for(const z of [-.5,3]){box(room,2.3,.42,1.1,x,.3,z,0x6d375e,true);box(room,2.3,.72,.18,x,.86,z+.48,0x4d294a);box(room,1.2,.09,.8,x,.65,z-1.0,0x4a3646,true);box(room,.12,.6,.12,x,.30,z-1.0,0xcbb879);box(room,.09,.17,.09,x+.25,.78,z-1.0,0xe2b658);}
  box(room,3,1,.8,4.9,.5,-5.9,0x322c3b,true);label(room,'BAR',4.9,2.4,-6.82,2);for(let i=0;i<7;i++)box(room,.11,.36,.11,3.8+i*.35,1.27,-5.9,[0x76a9a5,0xba8d66][i%2]);
  box(room,2.2,.9,1.2,-5.5,.45,-5.4,0x292c3a,true);label(room,'DJ',-5.5,2.3,-6.8,1.4);for(const x of [-6,-5])box(room,.48,.07,.48,x,.95,-5.4,0xd0bd80);
  for(const x of [-4,-2,0,2,4]){const light=box(room,.75,.05,.6,x,3.1,-3.6,palettes[palette]);lights.push(light);box(room,.12,.06,3,x,.015,.15,palettes[palette]);}
  label(room,'DANCE FLOOR',0,1.9,2.3,3);label(room,'TIP STAGE · $10',0,1.15,-2.55,3);
 }
 function update(dt){clock+=Math.min(dt,.05);dancers.forEach((d,i)=>{d.root.rotation.y=Math.sin(clock*.8+i)*.55;d.root.position.y=.35+Math.sin(clock*2+i)*.035;d.limbs.forEach((l,j)=>l.rotation.z=Math.sin(clock*1.8+i+j)*.23);});}
 function changeLights(){palette=(palette+1)%palettes.length;for(const m of lights)m.material.color.setHex(palettes[palette]);}
 return{build,update,changeLights,tip(){tips++;},clear(){dancers=[];lights=[];},getInfo:()=>({performers:dancers.length,tips,palette})};
}
