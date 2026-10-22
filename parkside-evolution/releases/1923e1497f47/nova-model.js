// Photo-matched Nova: dark blue, continuous cream flames, chrome and hood scoop.
export function buildNova(T){
 const root=new T.Group(),groups=new Map();
 const M=(color,metalness=0,roughness=.55,extra={})=>new T.MeshStandardMaterial({color,metalness,roughness,...extra});
 const mats={
  blue:M(0x164e66,.14,.34),blueDark:M(0x123e52,.12,.36),cream:M(0xf0dfb7,.02,.55),dark:M(0x14191b,.05,.88),
  rubber:M(0x151718,0,.97),chrome:M(0xc9d0d0,.32,.24),glass:M(0x375665,.12,.22,{transparent:true,opacity:.7}),
  light:M(0xf7ecd2,.08,.24,{emissive:0x4b402c,emissiveIntensity:.16}),red:M(0xa72d31,.12,.28),engine:M(0x6f7473,.45,.34),seat:M(0x32383a)
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
 function wheel(name,x,y,z,r,width,rear=false){
  cyl(name,r,width,x,y,z,'rubber','x',24);cyl(name,r*.68,width+.025,x,y,z,'chrome','x',20);cyl(name,r*.52,width+.045,x,y,z,'dark','x',20);cyl(name,r*.15,width+.07,x,y,z,'chrome','x',16);
  for(let i=0;i<5;i++){const a=i*Math.PI*2/5;box(name,.028,.038,r*(rear?.92:.82),x+(width/2+.026)*(x>0?1:-1),y+Math.sin(a)*r*.30,z+Math.cos(a)*r*.30,'chrome',-a,0,0);}
 }

 function sideTexture(){
  const cv=document.createElement('canvas');cv.width=1536;cv.height=384;const c=cv.getContext('2d');c.fillStyle='#f0dfb7';
  c.fillRect(0,0,210,384);
  function tongue(sx,sy,L,A){c.beginPath();c.moveTo(sx,sy-A*.38);c.bezierCurveTo(sx+L*.14,sy-A*.6,sx+L*.20,sy+A*.85,sx+L*.33,sy+A*.25);c.bezierCurveTo(sx+L*.46,sy-A*.9,sx+L*.57,sy-A*.5,sx+L*.72,sy);c.bezierCurveTo(sx+L*.85,sy+A*.65,sx+L*.92,sy-A*.1,sx+L,sy-A*.7);c.bezierCurveTo(sx+L*.91,sy+A*.64,sx+L*.81,sy+A*.84,sx+L*.68,sy+A*.45);c.bezierCurveTo(sx+L*.53,sy-A*.1,sx+L*.43,sy-A*.5,sx+L*.32,sy+A*.8);c.bezierCurveTo(sx+L*.19,sy+A*1.25,sx+L*.1,sy+A*.4,sx,sy+A*.3);c.closePath();c.fill();}
  for(const [y,l,a] of [[42,1170,64],[162,1300,96],[290,1100,84]])tongue(180,y,l,a);
  tongue(470,125,610,34);tongue(510,355,830,35);
  return cv;
 }
 function hoodTexture(){const cv=document.createElement('canvas');cv.width=768;cv.height=1024;const c=cv.getContext('2d');c.fillStyle='#f0dfb7';c.fillRect(0,0,768,1024);c.fillStyle='#164e66';
  for(let i=0;i<7;i++){const x=30+i*116,tip=65+(i%3)*100;c.beginPath();c.moveTo(x-48,1024);c.bezierCurveTo(x-70,750,x+75,660,x+8,450);c.bezierCurveTo(x-55,300,x+70,230,x+15,tip);c.bezierCurveTo(x+112,240,x-2,320,x+55,455);c.bezierCurveTo(x+142,710,x+5,770,x+66,1024);c.closePath();c.fill();}return cv;}
 function textureMaterial(canvas){const tex=new T.CanvasTexture(canvas);tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=4;return new T.MeshStandardMaterial({map:tex,transparent:true,depthWrite:false,roughness:.35,metalness:.12,side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});}
 mats.sideFlames=textureMaterial(sideTexture());mats.hoodFlames=textureMaterial(hoodTexture());
 const bodyRings=[[-2.08,.82,.72,.53,.86],[-1.55,.94,.87,.49,.96],[-.78,.98,.91,.49,1.05],[.10,.99,.91,.49,1.10],[1.08,.98,.88,.49,1.06],[1.94,.88,.77,.52,.92],[2.12,.78,.68,.57,.82]];
 function sideDecal(name,z0,z1,side){
  z0=Math.max(z0,bodyRings[0][0]);const zs=[z0,...bodyRings.map(r=>r[0]).filter(z=>z>z0&&z<z1),z1],v=[],uv=[],idx=[];
  for(const z of zs){let i=0;while(i<bodyRings.length-2&&bodyRings[i+1][0]<z)i++;const a=bodyRings[i],b=bodyRings[i+1],u=(z-a[0])/(b[0]-a[0]),r=a.map((n,k)=>n+(b[k]-n)*u),[,lw,uw,bottom,top]=r;
   for(const [x,y] of [[lw,bottom],[lw*1.02,bottom+(top-bottom)*.48],[uw,top]]){v.push(side*(x+.007),y+.001,z);uv.push((z+2.25)/4.5,(y-.49)/.61);}
  }
  for(let i=0;i<zs.length-1;i++)for(let j=0;j<2;j++){const a=i*3+j;idx.push(a,a+3,a+4,a,a+4,a+1);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(v,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();const m=new T.Mesh(g,mats.sideFlames);m.renderOrder=2;add(name,m);
 }
 function hoodDecal(){const v=[],uv=[],idx=[],rings=[[-2.14,.72,1],[-1.70,.87,1.07],[-.77,.88,1.10]];for(const [z,w,y] of rings){v.push(-w,y+.006,z,w,y+.006,z);uv.push(0,1-(z+2.14)/1.37,1,1-(z+2.14)/1.37);}for(let i=0;i<2;i++){const a=i*2;idx.push(a,a+1,a+3,a,a+3,a+2);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(v,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();add('bonnet',new T.Mesh(g,mats.hoodFlames));}

 {
  // A solid 1960s compact drag coupe silhouette, based on the supplied blue/white flame car.
  box('chassis',1.72,.16,4.18,0,.41,.02,'dark');
  loft('tub',bodyRings,'blue');
  // Hood/trunk are broad solid panels rather than linework.
  loft('bonnet',[[-2.14,.77,.72,.87,1.00],[-1.70,.92,.87,.91,1.07],[-.77,.92,.88,1.02,1.10]],'cream');
  loft('trunk',[[1.17,.89,.84,1.02,1.09],[1.90,.84,.76,.91,1.01],[2.12,.74,.66,.80,.90]],'blue');
  // Full greenhouse.
  loft('roof',[[-.43,.68,.66,1.61,1.65],[-.34,.71,.70,1.62,1.68],[.65,.70,.68,1.62,1.69],[.82,.65,.63,1.58,1.63]],'blueDark');
  for(const side of [-1,1]){tube('roof',[[side*.82,1.1,-.75],[side*.66,1.62,-.43]],.035,'chrome');tube('roof',[[side*.80,1.1,1.08],[side*.64,1.58,.82]],.045,'blue');}
  pane('windshield',[[-.82,1.10,-.75],[.82,1.10,-.75],[.66,1.62,-.43],[-.66,1.62,-.43]]);
  pane('rear-glass',[[-.80,1.10,1.08],[.80,1.10,1.08],[.64,1.58,.82],[-.64,1.58,.82]]);
  for(const side of [-1,1]){
   const d='door-'+side;pane(d,[[side*.993,.54,-.62],[side*.993,.54,.70],[side*.905,1.095,.70],[side*.905,1.095,-.62]],'blue');
   pane(d,[[side*.91,1.12,-.53],[side*.91,1.12,.62],[side*.69,1.60,.55],[side*.69,1.60,-.37]]);
   box(d,.035,.045,.20,side*1.005,1.04,.42,'chrome');
   pane('quarter-'+side,[[side*.98,.54,.72],[side*.98,.54,1.99],[side*.89,1.08,1.99],[side*.905,1.095,.72]],'blue');
   // Wheel arch lips as one continuous trim curve per fender.
   for(const [end,z,r] of [['front',-1.48,.52],['rear',1.43,.57]]){const pts=[];for(let i=0;i<=16;i++){const a=i/16*Math.PI;pts.push([side*1.003,.46+Math.sin(a)*r,z+Math.cos(a)*r]);}tube('fender-'+end+'-'+side,pts,.035,'blueDark');}
   sideDecal(d,-.64,.72,side);sideDecal('quarter-'+side,.72,2.12,side);sideDecal('fender-front-'+side,-2.12,-.64,side);
   // Thin chrome window frames and the rear quarter window match the reference coupe.
   tube(d,[[side*.91,1.11,-.55],[side*.69,1.61,-.39],[side*.69,1.61,.55],[side*.91,1.11,.65]],.017,'chrome');
   tube(d,[[side*.90,1.12,.16],[side*.69,1.61,.16]],.017,'chrome');
  }
  hoodDecal();
  // Substantial hood scoop with an actual dark opening.
  loft('scoop',[[-1.76,.39,.31,1.09,1.23],[-1.53,.47,.39,1.10,1.36],[-.98,.43,.36,1.10,1.34],[-.82,.34,.29,1.08,1.23]],'blue');
  box('scoop',.72,.035,.07,0,1.375,-1.70,'cream');box('scoop',.64,.13,.045,0,1.29,-1.80,'dark',-.05,0,0);
  // Chrome grille/bumper face.
  box('grille',1.83,.41,.075,0,.87,-2.145,'cream');box('grille',1.68,.34,.09,0,.82,-2.16,'dark');for(let i=-3;i<=3;i++)box('grille',1.61,.023,.024,0,.74+i*.052,-2.215,'chrome');
  box('front-bumper',1.94,.13,.17,0,.59,-2.23,'chrome');box('rear-bumper',1.90,.12,.15,0,.60,2.12,'chrome');
  for(const side of [-1,1]){
   cyl('headlight-'+side,.18,.09,side*.72,.90,-2.18,'light','z');cyl('headlight-'+side,.205,.04,side*.72,.90,-2.145,'chrome','z');
   box('tail-light-'+side,.30,.14,.07,side*.68,.89,2.10,'red');box('mirror-'+side,.18,.11,.20,side*1.05,1.18,-.48,'chrome');
  }
  // Drag stance: skinny fronts and wide rear tires.
  for(const side of [-1,1]){wheel('wheel-front-'+(side>0?'left':'right'),side*.94,.41,-1.48,.41,.24,false);wheel('wheel-rear-'+(side>0?'left':'right'),side*.94,.41,1.43,.41,.32,true);}
  box('engine',.78,.38,.76,0,.83,-1.25,'engine');box('engine',.70,.08,.68,0,1.06,-1.25,'dark');for(let i=0;i<4;i++)box('engine',.10,.065,.62,-.24+i*.16,1.11,-1.25,'chrome');
  box('cabin',1.34,.30,.63,0,.98,.30,'seat');

 }
 const assemblies=[];
 for(const [name,g] of groups){
  g.updateMatrixWorld(true);const bb=new T.Box3().setFromObject(g),center=bb.getCenter(new T.Vector3()),size=bb.getSize(new T.Vector3());
  for(const c of g.children)c.position.sub(center);g.position.copy(center);g.userData={home:center.clone(),size,attached:true};assemblies.push(g);
 }
 return {root,assemblies,materials:mats};
}

