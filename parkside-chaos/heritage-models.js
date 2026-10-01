// Photo-inspired flame drag coupe + 1930s Maybach Zeppelin-style V12 for Parkside Chaos.
export function buildHeritage(T,kind){
 const may=kind==='maybach',root=new T.Group(),groups=new Map();
 const M=(c,metal=0,rough=.58)=>new T.MeshStandardMaterial({color:c,metalness:metal,roughness:rough});
 const mats=may?{
  paint:M(0x241f22,.38,.34),paint2:M(0x5b2730,.26,.4),dark:M(0x161719),rubber:M(0x171717,0,.96),chrome:M(0xc5c4b8,.88,.22),glass:M(0x324852,.24,.24),wood:M(0x5b3323,.08,.55),leather:M(0x8b6749),light:M(0xffe5ad),red:M(0x8d2528),white:M(0xe8e0cd),engine:M(0x77776f,.65,.38)
 }:{
  paint:M(0x145f78,.38,.34),white:M(0xf0ead7,.06,.55),dark:M(0x171b1d),rubber:M(0x181818,0,.97),chrome:M(0xc8ced0,.9,.2),glass:M(0x284958,.28,.22),light:M(0xf3ead0),red:M(0xa02e2e),engine:M(0x767b79,.62,.36),seat:M(0x373b3b)
 };
 mats.glass.side=T.DoubleSide;
 function group(n){if(!groups.has(n)){const g=new T.Group();g.name=n;groups.set(n,g);root.add(g);}return groups.get(n);}
 function add(n,o){group(n).add(o);return o;}
 function box(n,w,h,d,x,y,z,m='paint',rx=0,ry=0,rz=0){const o=new T.Mesh(new T.BoxGeometry(w,h,d),mats[m]);o.position.set(x,y,z);o.rotation.set(rx,ry,rz);o.castShadow=o.receiveShadow=true;return add(n,o);}
 function cyl(n,r,d,x,y,z,m='chrome',axis='x'){const o=new T.Mesh(new T.CylinderGeometry(r,r,d,20),mats[m]);o.position.set(x,y,z);if(axis==='x')o.rotation.z=Math.PI/2;else if(axis==='z')o.rotation.x=Math.PI/2;o.castShadow=o.receiveShadow=true;return add(n,o);}
 function sphere(n,x,y,z,sx,sy,sz,m){const o=new T.Mesh(new T.SphereGeometry(1,22,14),mats[m]);o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.castShadow=o.receiveShadow=true;return add(n,o);}
 function pane(n,p,m='glass'){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p.flat(),3));g.setIndex([0,1,2,0,2,3]);g.computeVertexNormals();const o=new T.Mesh(g,mats[m]);o.castShadow=true;return add(n,o);}
 function tube(n,p,r,m){const o=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(p.map(v=>new T.Vector3(...v))),Math.max(6,p.length*5),r,7,false),mats[m]);o.castShadow=true;return add(n,o);}
 function wheel(n,x,y,z,r,width,wire=false){
  cyl(n,r,width,x,y,z,'rubber');
  cyl(n,r*.69,width+.03,x,y,z,'chrome');
  cyl(n,r*.54,width+.05,x,y,z,may?'dark':'chrome');
  cyl(n,r*.15,width+.08,x,y,z,'chrome');
  if(wire)for(let i=0;i<12;i++){const a=i*Math.PI/6;const p1=[x-width*.55,y+Math.sin(a)*r*.48,z+Math.cos(a)*r*.48],p2=[x+width*.55,y-Math.sin(a)*r*.48,z-Math.cos(a)*r*.48];tube(n,[p1,p2],.009,'chrome');}
 }
 if(!may){
  // Blue flame drag coupe, based on the supplied photo.
  box('chassis',1.78,.16,4.28,0,.43,0,'dark');box('tub',1.86,.37,3.45,0,.72,.12,'paint');
  const front=-1.48,rear=1.43;
  for(const side of [-1,1]){wheel('wheel-front-'+(side>0?'left':'right'),side*.94,.42,front,.40,.24);wheel('wheel-rear-'+(side>0?'left':'right'),side*.97,.45,rear,.45,.36);}
  box('bonnet',1.86,.16,1.64,0,1.03,-1.42,'white',-.025,0,0);
  box('scoop',.93,.23,.95,0,1.27,-1.26,'paint',-.08,0,0);box('scoop',.82,.10,.72,0,1.36,-1.36,'dark',-.08,0,0);
  box('trunk',1.82,.17,.82,0,1.03,1.82,'paint',.015,0,0);
  box('roof',1.55,.14,1.66,0,1.63,.24,'paint');
  pane('windshield',[[-.82,1.12,-.77],[.82,1.12,-.77],[.69,1.60,-.53],[-.69,1.60,-.53]]);
  pane('rear-glass',[[-.80,1.13,1.08],[.80,1.13,1.08],[.69,1.58,.87],[-.69,1.58,.87]]);
  for(const side of [-1,1]){
   const door='door-'+side;box(door,.07,.48,1.10,side*.94,.93,.25,'paint');pane(door,[[side*.93,1.17,-.29],[side*.93,1.17,.72],[side*.72,1.58,.61],[side*.72,1.58,-.20]]);
   box(door,.04,.04,.18,side*.99,1.09,.55,'chrome');
   box('quarter-'+side,.08,.45,.83,side*.95,.94,1.31,'paint');
   box('fender-front-'+side,.10,.40,.82,side*.96,.75,-1.43,'paint');
   box('fender-rear-'+side,.11,.44,.94,side*.98,.77,1.43,'paint');
   // White flame streaks flowing rearward from the nose.
   for(let j=0;j<6;j++){const y=.78+j*.075,amp=.08+j*.018,start=-1.93+j*.07,end=.98-j*.05;const pts=[];for(let k=0;k<6;k++){const z=start+(end-start)*k/5;pts.push([side*1.015,y+Math.sin(k*1.5+j)*amp,z]);}tube(j<3?door:'quarter-'+side,pts,.023+j*.004,'white');}
  }
  // Hood flames and chrome front face.
  for(let j=-3;j<=3;j++){const x=j*.18;const pts=[];for(let k=0;k<5;k++){const z=-2.03+k*.27;pts.push([x+Math.sin(k+j)*.04,1.12,z]);}tube('bonnet',pts,.022+Math.abs(j)*.002,'paint');}
  box('grille',1.70,.29,.08,0,.83,-2.18,'dark');for(let i=-4;i<=4;i++)box('grille',1.62,.025,.025,0,.72+i*.045,-2.23,'chrome');
  box('front-bumper',1.95,.13,.16,0,.60,-2.24,'chrome');box('rear-bumper',1.92,.12,.14,0,.62,2.18,'chrome');
  for(const side of [-1,1]){cyl('headlight-'+side,.17,.08,side*.74,.91,-2.18,'light','z');box('tail-light-'+side,.30,.13,.07,side*.67,.91,2.12,'red');box('mirror-'+side,.17,.11,.20,side*1.03,1.17,-.45,'chrome');}
  box('engine',.78,.38,.76,0,.84,-1.28,'engine');for(let i=0;i<4;i++)box('engine',.10,.07,.62,-.24+i*.16,1.06,-1.28,'chrome');box('cabin',1.35,.33,.60,0,1.00,.34,'seat');
 }else{
  // Maybach Zeppelin DS8-inspired luxury limousine: long hood, upright radiator, sweeping fenders.
  box('chassis',1.68,.20,5.28,0,.47,0,'dark');box('tub',1.72,.36,3.50,0,.73,.63,'paint2');
  const front=-1.86,rear=1.78;
  for(const side of [-1,1]){wheel('wheel-front-'+(side>0?'left':'right'),side*.87,.50,front,.49,.22,true);wheel('wheel-rear-'+(side>0?'left':'right'),side*.87,.50,rear,.49,.22,true);}
  box('bonnet-left',.76,.30,2.27,-.40,1.05,-1.42,'paint');box('bonnet-right',.76,.30,2.27,.40,1.05,-1.42,'paint');
  for(const side of [-1,1]){for(let z=-1.85;z<-.78;z+=.17)box('bonnet-'+(side<0?'left':'right'),.035,.15,.07,side*.785,1.10,z,'chrome');}
  box('grille',.93,1.02,.14,0,1.03,-2.66,'chrome');box('grille',.77,.87,.05,0,1.03,-2.74,'dark');for(let i=-7;i<=7;i++)box('grille',.025,.78,.02,i*.047,1.03,-2.78,'chrome');
  sphere('grille',0,1.55,-2.72,.16,.08,.04,'chrome');
  for(const side of [-1,1]){cyl('headlight-'+side,.20,.12,side*.73,1.15,-2.53,'light','z');cyl('headlight-'+side,.24,.06,side*.73,1.15,-2.48,'chrome','z');}
  // Sweeping separate fender pods.
  for(const side of [-1,1]){
   const fn='fender-front-'+side,rn='fender-rear-'+side;
   const pf=[],pr=[];for(let i=0;i<=12;i++){const a=Math.PI*i/12;pf.push([side*.94,.49+Math.sin(a)*.64,front+Math.cos(a)*.64]);pr.push([side*.94,.49+Math.sin(a)*.64,rear+Math.cos(a)*.64]);}
   tube(fn,pf,.10,'paint');tube(rn,pr,.10,'paint');
   box('running-board-'+side,.25,.11,2.92,side*1.01,.55,.08,'dark');box('running-board-'+side,.20,.035,2.73,side*1.01,.63,.08,'chrome');
   for(const [label,z] of [['front',-.20],['rear',.88]]){const d='door-'+label+'-'+side;box(d,.07,.58,1.02,side*.87,1.11,z,'paint2');pane(d,[[side*.865,1.36,z-.46],[side*.865,1.36,z+.46],[side*.72,1.90,z+.39],[side*.72,1.90,z-.39]]);box(d,.04,.04,.16,side*.92,1.25,z+.27,'chrome');}
   pane('quarter-'+side,[[side*.86,1.36,1.42],[side*.86,1.36,2.04],[side*.72,1.84,1.82],[side*.72,1.90,1.42]]);
  }
  box('roof',1.47,.16,2.34,0,1.96,.79,'paint');box('roof',1.37,.08,2.22,0,2.07,.79,'paint2');
  pane('windshield',[[-.79,1.37,-.76],[.79,1.37,-.76],[.68,1.91,-.54],[-.68,1.91,-.54]]);
  pane('rear-glass',[[-.78,1.38,1.91],[.78,1.38,1.91],[.68,1.86,1.67],[-.68,1.86,1.67]]);
  box('tail',1.64,.43,.70,0,.91,2.19,'paint');box('rear-bumper',1.78,.12,.15,0,.60,2.58,'chrome');
  for(const side of [-1,1]){box('tail-light-'+side,.17,.18,.07,side*.68,.93,2.55,'red');box('mirror-'+side,.16,.16,.18,side*.96,1.42,-.47,'chrome');}
  // Side-mounted spare wheels, characteristic period detail.
  for(const side of [-1,1]){wheel('spare-'+side,side*1.01,1.05,-.61,.39,.12,true);}
  // V12 visual block with twin banks under the hood.
  box('engine',.82,.35,1.15,0,.82,-1.42,'engine');for(const side of [-1,1]){box('engine',.30,.22,.90,side*.24,1.07,-1.42,'dark');for(let i=0;i<6;i++)cyl('engine',.055,.31,side*.24,1.21,-1.78+i*.14,'chrome','x');}
  box('cabin',1.36,.38,1.34,0,1.02,.74,'leather');box('cabin',1.29,.08,1.24,0,1.23,.74,'wood');
 }
 const assemblies=[];
 for(const [name,g] of groups){g.updateMatrixWorld(true);const bb=new T.Box3().setFromObject(g),center=bb.getCenter(new T.Vector3()),size=bb.getSize(new T.Vector3());for(const c of g.children)c.position.sub(center);g.position.copy(center);g.userData={home:center.clone(),size,attached:true};assemblies.push(g);}
 return {root,assemblies,materials:mats};
}