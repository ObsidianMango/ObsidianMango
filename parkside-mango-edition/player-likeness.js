// Procedural, reference-inspired playable portrait. No texture downloads or face photos.
export function buildSteveAvatar(T,avatar,firstHands){
 const g=new T.Group();g.name='Steve — face, hair, beard, mirrored shades';g.position.set(0,1.56,0);avatar.add(g);
 const colors={hair:0x292523,hairHi:0x44382f,beard:0x352923,beardHi:0x594336,skin:0xd5a88c,shade:0x398bb4,shadeHi:0x72c7e8,frame:0x89949c,dark:0x1b2025,black:0x17191d,stitch:0x30343a,jean:0x394553,leather:0x292828,tongue:0xc16c80};
 const mats=Object.fromEntries(Object.entries(colors).map(([k,v])=>[k,new T.MeshStandardMaterial({color:v,roughness:k==='shade'?.18:k==='frame'?.3:.79,metalness:k==='shade'?.6:k==='frame'?.45:0})]));
 const cube=new T.BoxGeometry(1,1,1),ball=new T.IcosahedronGeometry(1,1),cone=new T.ConeGeometry(1,1,5);
 function part(parent,shape,m,x,y,z,sx,sy,sz,rx=0,ry=0,rz=0){const obj=new T.Mesh(shape,mats[m]);obj.position.set(x,y,z);obj.scale.set(sx,sy,sz);obj.rotation.set(rx,ry,rz);obj.castShadow=false;parent.add(obj);return obj;}
 // Keep the original collision/walk rigs and transform them instead of replacing controls.
 const torso=avatar.children[0],head=avatar.children[1];torso.material=mats.black;torso.scale.set(.68,.73,.37);torso.position.y=1.05;
 head.material=mats.skin;head.scale.set(.375,.41,.34);head.position.y=1.57;
 // Dark tee, collar, subtle fabric folds and sleeve openings.
 part(avatar,ball,'stitch',0,1.43,-.08,.205,.060,.17);
 for(const side of [-1,1]){part(avatar,cube,'stitch',side*.25,1.1,-.197,.012,.38,.012,0,0,side*.13);part(avatar,cube,'black',side*.325,1.23,-.01,.16,.24,.29,0,0,side*.17);}
 part(avatar,cube,'black',0,.70,-.005,.59,.10,.37);
 // Eyes are visible beneath blue-reflective glass, with a nose and soft cheeks.
 for(const side of [-1,1]){
  part(g,ball,'skin',side*.145,-.04,-.176,.113,.128,.085);
  part(g,ball,'hair',side*.12,.085,-.188,.091,.018,.016,0,0,-side*.14);
  part(g,ball,'shade',side*.143,.035,-.228,.156,.116,.022,0,-side*.07,side*.06);
  part(g,cube,'frame',side*.145,.156,-.238,.296,.017,.021,0,0,side*.045);
  part(g,cube,'frame',side*.297,.068,-.203,.026,.18,.023,0,0,-side*.14);
  part(g,cube,'shadeHi',side*.205,.078,-.255,.06,.013,.007,0,0,side*.18);
  part(g,ball,'skin',side*.207,-.095,-.105,.105,.10,.090);
  part(g,ball,'beard',side*.197,-.190,-.139,.079,.115,.076);
  part(g,ball,'beardHi',side*.21,-.175,-.197,.035,.072,.017);
  part(g,ball,'hair',side*.342,.002,0,.051,.11,.079);
 }
 part(g,ball,'skin',0,-.035,-.223,.074,.119,.083);
 part(g,ball,'frame',0,.073,-.256,.050,.020,.028);
 part(g,ball,'beard',0,-.257,-.169,.193,.157,.123);
 part(g,ball,'beardHi',0,-.310,-.239,.101,.089,.040);
 for(const side of [-1,1]){
  part(g,ball,'beard',side*.085,-.138,-.247,.099,.040,.048,0,0,side*.24);
  for(let i=0;i<3;i++)part(g,cone,i%2?'beardHi':'beard',side*(.045+i*.055),-.265-i*.020,-.204,.040,.135,.039,0,0,side*.15);
 }
 // Mouth and a playful tongue based on the supplied expression.
 part(g,ball,'dark',0,-.193,-.268,.110,.045,.025);
 part(g,ball,'tongue',0,-.233,-.285,.073,.065,.019);
 // Thick, asymmetrically swept hair, separated locks and sideburns.
 part(g,ball,'hair',0,.223,.012,.380,.185,.327,0,0,-.06);
 for(let i=0;i<8;i++){
  const x=-.31+i*.086,dy=.05*Math.sin(i*1.41);
  part(g,cone,i%3?'hair':'hairHi',x,.284+dy,-.190,.063,.22+(i%3)*.048,.066,.14,0,.47);
 }
 for(const side of [-1,1]){
  part(g,ball,'hair',side*.318,.155,.016,.078,.174,.178,0,0,side*.17);
  part(g,cone,'hair',side*.26,.135,-.182,.066,.20,.068,.15,0,side*.16);
 }
 const legs=avatar.children.filter((o,i)=>i===2||i===3),arms=avatar.children.filter((o,i)=>i===4||i===5);
 legs.forEach((m,i)=>{m.material=mats.jean;m.scale.set(.25,.71,.25);m.position.x=i? .185:-.185;part(m,cube,'leather',0,-.47,-.30,.99,.15,1.50);});
 arms.forEach(m=>{m.material=mats.black;m.scale.set(.18,.59,.22);});
 for(const m of firstHands.children.slice(0,2))m.material=mats.skin;
 return {detail:g,materials:mats,meshCount:g.children.length};
}
