// High-detail replacements for the Flame Coupe and Wienermobile in Parkside Chaos.
export function buildShowpiece(T,kind){
 const flame=kind==='flamecoupe',root=new T.Group(),groups=new Map();
 const M=(color,metalness=0,roughness=.55,extra={})=>new T.MeshStandardMaterial({color,metalness,roughness,...extra});
 const mats=flame?{
  blue:M(0x0f617d,.36,.31),blueDark:M(0x0b4053,.32,.36),cream:M(0xf2ead8,.02,.64),dark:M(0x14191b,.05,.88),
  rubber:M(0x151718,0,.97),chrome:M(0xc9d0d0,.92,.18),glass:M(0x244a5a,.26,.19,{transparent:true,opacity:.72}),
  light:M(0xf7ecd2,.08,.24,{emissive:0x4b402c,emissiveIntensity:.16}),red:M(0xa72d31,.12,.28),engine:M(0x6f7473,.7,.34),seat:M(0x32383a)
 }:{
  bun:M(0xe5a83e,.02,.68),bread:M(0xffd982,0,.76),toast:M(0xbe762d,.04,.72),dog:M(0xb34225,.06,.46),dogDark:M(0x7f2c1b,.06,.5),
  mustard:M(0xf4cf2f,.02,.5),cream:M(0xf3e8c7,.04,.68),red:M(0xc83c2f,.18,.4),dark:M(0x182123,.05,.82),
  rubber:M(0x151718,0,.97),chrome:M(0xc4cecf,.88,.2),glass:M(0x2f6070,.24,.2,{transparent:true,opacity:.72}),
  light:M(0xffe7ad,.08,.23,{emissive:0x45361e,emissiveIntensity:.15}),tail:M(0xa12626,.1,.28),engine:M(0x717877,.65,.36),seat:M(0x4a4035)
 };
 mats.glass.side=T.DoubleSide;

 function group(name){if(!groups.has(name)){const g=new T.Group();g.name=name;groups.set(name,g);root.add(g);}return groups.get(name);}
 function add(name,obj){group(name).add(obj);return obj;}
 function box(name,w,h,d,x,y,z,mat='dark',rx=0,ry=0,rz=0){
  const o=new T.Mesh(new T.BoxGeometry(w,h,d),mats[mat]);o.position.set(x,y,z);o.rotation.set(rx,ry,rz);o.castShadow=o.receiveShadow=true;return add(name,o);
 }
 function cyl(name,r,d,x,y,z,mat='chrome',axis='x',segments=20){
  const o=new T.Mesh(new T.CylinderGeometry(r,r,d,segments),mats[mat]);o.position.set(x,y,z);
  if(axis==='x')o.rotation.z=Math.PI/2;else if(axis==='z')o.rotation.x=Math.PI/2;
  o.castShadow=o.receiveShadow=true;return add(name,o);
 }
 function pane(name,pts,mat='glass'){
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pts.flat(),3));g.setIndex([0,1,2,0,2,3]);g.computeVertexNormals();
  const o=new T.Mesh(g,mats[mat]);o.castShadow=true;return add(name,o);
 }
 function tube(name,pts,r,mat='chrome',radial=7){
  const o=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts.map(p=>new T.Vector3(...p))),Math.max(6,pts.length*5),r,radial,false),mats[mat]);o.castShadow=true;return add(name,o);
 }
 function loft(name,rings,mat='blue'){
  const verts=[],idx=[],N=6;
  for(const [z,lw,uw,b,t] of rings){
   const m=b+(t-b)*.48;
   verts.push(-lw,b,z, lw,b,z, lw*1.02,m,z, uw,t,z, -uw,t,z, -lw*1.02,m,z);
  }
  for(let r=0;r<rings.length-1;r++)for(let k=0;k<N;k++){const a=r*N+k,b=r*N+(k+1)%N,c=(r+1)*N+(k+1)%N,d=(r+1)*N+k;idx.push(a,b,c,a,c,d);}
  for(let k=1;k<N-1;k++)idx.push(0,k+1,k);
  const e=(rings.length-1)*N;for(let k=1;k<N-1;k++)idx.push(e,e+k,e+k+1);
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(verts,3));g.setIndex(idx);g.computeVertexNormals();
  const o=new T.Mesh(g,mats[mat]);o.castShadow=o.receiveShadow=true;return add(name,o);
 }
 function capsule(name,rings,mat='dog',radial=22){
  const v=[],idx=[];
  for(const ring of rings){const [z,rx,ry,cx=0,cy=0]=ring;for(let i=0;i<radial;i++){const a=i/radial*Math.PI*2;v.push(cx+Math.cos(a)*rx,cy+Math.sin(a)*ry,z);}}
  for(let r=0;r<rings.length-1;r++)for(let i=0;i<radial;i++){const a=r*radial+i,b=r*radial+(i+1)%radial,c=(r+1)*radial+(i+1)%radial,d=(r+1)*radial+i;idx.push(a,b,c,a,c,d);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(v,3));g.setIndex(idx);g.computeVertexNormals();
  const o=new T.Mesh(g,mats[mat]);o.castShadow=o.receiveShadow=true;return add(name,o);
 }
 function wheel(name,x,y,z,r,width,rear=false){
  cyl(name,r,width,x,y,z,'rubber','x',24);cyl(name,r*.68,width+.025,x,y,z,'chrome','x',20);cyl(name,r*.52,width+.045,x,y,z,'dark','x',20);cyl(name,r*.15,width+.07,x,y,z,'chrome','x',16);
  for(let i=0;i<5;i++){const a=i*Math.PI*2/5;box(name,.028,.038,r*(rear?.92:.82),x+(width/2+.026)*(x>0?1:-1),y+Math.sin(a)*r*.30,z+Math.cos(a)*r*.30,'chrome',-a,0,0);}
 }
 function flameCanvas(){
  const c=document.createElement('canvas');c.width=1024;c.height=420;const ctx=c.getContext('2d');ctx.clearRect(0,0,c.width,c.height);ctx.fillStyle='#f3ead7';
  const flames=[
   [0,210,360,42,600,190],[0,95,310,20,520,115],[0,325,300,55,555,300],[185,205,400,34,735,195],[335,95,330,28,820,95],[350,315,300,32,845,300]
  ];
  for(const [sx,sy,len,amp,tx,ty] of flames){
   ctx.beginPath();ctx.moveTo(sx,sy);ctx.bezierCurveTo(sx+len*.18,sy-amp,sx+len*.42,sy+amp*.8,tx,ty);ctx.bezierCurveTo(sx+len*.62,sy+amp*.18,sx+len*.25,sy+amp*1.25,sx,sy);ctx.closePath();ctx.fill();
  }
  ctx.globalCompositeOperation='destination-out';
  for(let i=0;i<5;i++){ctx.beginPath();ctx.ellipse(170+i*115,210+(i%2?35:-28),70,20,0,0,Math.PI*2);ctx.fill();}
  ctx.globalCompositeOperation='source-over';return c;
 }
 function decal(name,w,h,x,y,z,rotY=0,rotX=0){
  if(!mats.flames){const tex=new T.CanvasTexture(flameCanvas());tex.colorSpace=T.SRGBColorSpace;tex.minFilter=T.LinearFilter;mats.flames=new T.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,side:T.DoubleSide});}
  const o=new T.Mesh(new T.PlaneGeometry(w,h),mats.flames);o.position.set(x,y,z);o.rotation.set(rotX,rotY,0);o.renderOrder=3;return add(name,o);
 }

 if(flame){
  // A solid 1960s compact drag coupe silhouette, based on the supplied blue/white flame car.
  box('chassis',1.72,.16,4.18,0,.41,.02,'dark');
  loft('tub',[[-2.08,.82,.72,.53,.86],[-1.55,.94,.87,.49,.96],[-.78,.98,.91,.49,1.05],[.10,.99,.91,.49,1.10],[1.08,.98,.88,.49,1.06],[1.94,.88,.77,.52,.92],[2.12,.78,.68,.57,.82]],'blue');
  // Hood/trunk are broad solid panels rather than linework.
  loft('bonnet',[[-2.14,.77,.72,.87,1.00],[-1.70,.92,.87,.91,1.07],[-.77,.92,.88,1.02,1.10]],'cream');
  loft('trunk',[[1.17,.89,.84,1.02,1.09],[1.90,.84,.76,.91,1.01],[2.12,.74,.66,.80,.90]],'blue');
  // Full greenhouse.
  loft('roof',[[-.66,.72,.68,1.08,1.54],[-.34,.77,.70,1.10,1.68],[.65,.76,.68,1.10,1.69],[1.05,.68,.61,1.07,1.52]],'blueDark');
  pane('windshield',[[-.82,1.10,-.75],[.82,1.10,-.75],[.66,1.62,-.43],[-.66,1.62,-.43]]);
  pane('rear-glass',[[-.80,1.10,1.08],[.80,1.10,1.08],[.64,1.58,.82],[-.64,1.58,.82]]);
  for(const side of [-1,1]){
   const d='door-'+side;pane(d,[[side*.985,.69,-.62],[side*.985,.69,.70],[side*.92,1.10,.70],[side*.92,1.10,-.62]],'blue');
   pane(d,[[side*.91,1.12,-.53],[side*.91,1.12,.62],[side*.69,1.60,.55],[side*.69,1.60,-.37]]);
   box(d,.035,.045,.20,side*1.005,1.04,.42,'chrome');
   loft('quarter-'+side,[[.72,.99,.91,.51,1.08],[1.32,1.00,.88,.50,1.07],[1.95,.88,.77,.52,.92]],'blue');
   // Wheel arch lips as one continuous trim curve per fender.
   for(const [end,z,r] of [['front',-1.48,.52],['rear',1.43,.57]]){const pts=[];for(let i=0;i<=16;i++){const a=i/16*Math.PI;pts.push([side*1.003,.46+Math.sin(a)*r,z+Math.cos(a)*r]);}tube('fender-'+end+'-'+side,pts,.035,'blueDark');}
   // Smooth white flame decal planes replace dozens of tube strips.
   decal(d,1.52,.63,side*1.013,.90,.03,side>0?-Math.PI/2:Math.PI/2,0);
   decal('quarter-'+side,1.05,.52,side*1.014,.86,1.23,side>0?-Math.PI/2:Math.PI/2,0);
  }
  // Hood flame decal.
  decal('bonnet',1.45,.94,0,1.115,-1.40,0,-Math.PI/2);
  // Substantial hood scoop with an actual dark opening.
  loft('scoop',[[-1.76,.39,.31,1.09,1.23],[-1.53,.47,.39,1.10,1.36],[-.98,.43,.36,1.10,1.34],[-.82,.34,.29,1.08,1.23]],'blue');
  box('scoop',.64,.13,.045,0,1.29,-1.80,'dark',-.05,0,0);
  // Chrome grille/bumper face.
  box('grille',1.68,.34,.09,0,.82,-2.16,'dark');for(let i=-3;i<=3;i++)box('grille',1.61,.023,.024,0,.74+i*.052,-2.215,'chrome');
  box('front-bumper',1.94,.13,.17,0,.59,-2.23,'chrome');box('rear-bumper',1.90,.12,.15,0,.60,2.12,'chrome');
  for(const side of [-1,1]){
   cyl('headlight-'+side,.18,.09,side*.72,.90,-2.18,'light','z');cyl('headlight-'+side,.205,.04,side*.72,.90,-2.145,'chrome','z');
   box('tail-light-'+side,.30,.14,.07,side*.68,.89,2.10,'red');box('mirror-'+side,.18,.11,.20,side*1.05,1.18,-.48,'chrome');
  }
  // Drag stance: skinny fronts, wide/tall rears.
  for(const side of [-1,1]){wheel('wheel-front-'+(side>0?'left':'right'),side*.94,.40,-1.48,.38,.20,false);wheel('wheel-rear-'+(side>0?'left':'right'),side*.98,.45,1.43,.46,.38,true);}
  box('engine',.78,.38,.76,0,.83,-1.25,'engine');box('engine',.70,.08,.68,0,1.06,-1.25,'dark');for(let i=0;i<4;i++)box('engine',.10,.065,.62,-.24+i*.16,1.11,-1.25,'chrome');
  box('cabin',1.34,.30,.63,0,.98,.30,'seat');
 }else{
  // Smooth, integrated hot-dog car: continuous buns + sausage over a real cream/red cab and chassis.
  box('chassis',1.72,.16,4.75,0,.40,.02,'dark');
  loft('tub',[[-2.42,.78,.70,.52,.78],[-1.82,.95,.84,.50,.88],[-.75,1.02,.93,.49,.92],[.80,1.02,.93,.49,.92],[1.80,.94,.84,.50,.87],[2.42,.78,.68,.54,.76]],'cream');
  // Cab is physically integrated at the nose, not floating above the food body.
  loft('cab',[[-2.40,.68,.57,.79,1.18],[-2.03,.79,.67,.80,1.51],[-1.46,.74,.64,.83,1.68],[-1.14,.68,.59,.88,1.55]],'red');
  pane('glass',[[-.64,1.13,-2.37],[.64,1.13,-2.37],[.57,1.54,-1.99],[-.57,1.54,-1.99]]);
  for(const side of [-1,1])pane('door-'+side,[[side*.77,.90,-2.00],[side*.77,.90,-1.35],[side*.60,1.54,-1.34],[side*.60,1.54,-1.90]]);
  // One continuous sausage silhouette split into crash sections with matching seam radii.
  const sausageRings=[[-2.12,.05,.05],[-2.00,.35,.33],[-1.70,.58,.53],[-.70,.64,.58],[.70,.64,.58],[1.70,.58,.53],[2.00,.35,.33],[2.12,.05,.05]];
  capsule('sausage-front',sausageRings.slice(0,4).map(r=>[r[0],r[1],r[2],0,1.61]),'dog');
  capsule('sausage-middle',sausageRings.slice(3,5).map(r=>[r[0],r[1],r[2],0,1.61]),'dog');
  capsule('sausage-rear',sausageRings.slice(4).map(r=>[r[0],r[1],r[2],0,1.61]),'dog');
  // Long smooth bun halves. Matching front/rear segments hide the crash seam.
  const bunSide=(side)=>{
   const x=side*.67;
   capsule('bun-front-'+side,[[-2.16,.06,.05,x,1.24],[-2.02,.28,.28,x,1.24],[-1.66,.48,.47,x,1.24],[-.05,.54,.52,x,1.24]],'bun');
   capsule('bun-rear-'+side,[[-.05,.54,.52,x,1.24],[1.62,.48,.47,x,1.24],[2.02,.28,.28,x,1.24],[2.16,.06,.05,x,1.24]],'bun');
   capsule('bread-'+side,[[-1.96,.02,.02,x-side*.17,1.29],[-1.78,.19,.18,x-side*.17,1.29],[-.05,.24,.23,x-side*.17,1.29],[1.76,.19,.18,x-side*.17,1.29],[1.96,.02,.02,x-side*.17,1.29]],'bread',18);
  };bunSide(-1);bunSide(1);
  // Mustard ribbon laid on top of the sausage.
  const mustardPts=[];for(let i=0;i<=32;i++){const z=-1.72+i*(3.44/32);mustardPts.push([Math.sin(i*.82)*.16,2.185,z]);}tube('mustard',mustardPts,.052,'mustard',8);
  // Cream beltline and bumpers make the object read as a vehicle.
  box('front-bumper',1.73,.16,.16,0,.58,-2.46,'chrome');box('rear-bumper',1.73,.15,.15,0,.58,2.44,'chrome');
  box('grille',1.12,.26,.06,0,.73,-2.48,'dark');for(let i=-3;i<=3;i++)box('grille',.025,.20,.025,i*.14,.73,-2.515,'chrome');
  for(const side of [-1,1]){
   cyl('headlight-'+side,.14,.08,side*.66,.84,-2.49,'light','z');box('tail-light-'+side,.20,.13,.065,side*.69,.75,2.45,'tail');
   box('mirror-'+side,.16,.10,.18,side*.88,1.23,-1.68,'chrome');
  }
  // Wheels tuck into the lower body, with period-ish white/chrome centers.
  for(const side of [-1,1]){wheel('wheel-front-'+(side>0?'left':'right'),side*1.00,.43,-1.62,.43,.25,false);wheel('wheel-rear-'+(side>0?'left':'right'),side*1.00,.43,1.58,.43,.25,false);}
  box('engine',.72,.35,.70,0,.80,-1.58,'engine');box('cabin',1.25,.28,.64,0,.94,-1.58,'seat');
  // Small roof sign to sell the classic novelty-car silhouette.
  box('sign',.09,.52,1.04,0,2.23,.48,'cream');box('sign',.04,.38,.90,0,2.23,.48,'red');
 }
 const assemblies=[];
 for(const [name,g] of groups){
  g.updateMatrixWorld(true);const bb=new T.Box3().setFromObject(g),center=bb.getCenter(new T.Vector3()),size=bb.getSize(new T.Vector3());
  for(const c of g.children)c.position.sub(center);g.position.copy(center);g.userData={home:center.clone(),size,attached:true};assemblies.push(g);
 }
 return {root,assemblies,materials:mats};
}