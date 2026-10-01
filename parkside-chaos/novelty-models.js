// Breakable novelty cars for Parkside Chaos.
export function buildNovelty(T,kind){
 const hot=kind==='wiener',root=new T.Group(),groups=new Map();
 const M=(c,metal=0,rough=.65)=>new T.MeshStandardMaterial({color:c,metalness:metal,roughness:rough});
 const mats={paint:M(hot?0xc93628:0x738b83,.12),rust:M(0x8b4931),patch:M(0xa39a77),dark:M(0x222a29),rubber:M(0x171b1b,0,.96),chrome:M(0xaab7b8,.72,.32),glass:M(0x356573,.3,.25),bun:M(0xefb34d),bread:M(0xffd77c),dog:M(0xaf4025),mustard:M(0xf4d83f),light:M(0xffe8ae),red:M(0xaa2f29),seat:M(0x51443a)};
 mats.glass.side=T.DoubleSide;
 function group(n){if(!groups.has(n)){const g=new T.Group();g.name=n;groups.set(n,g);root.add(g);}return groups.get(n);}
 function add(n,obj){group(n).add(obj);return obj;}
 function box(n,w,h,d,x,y,z,m='paint',rx=0,ry=0,rz=0){const o=new T.Mesh(new T.BoxGeometry(w,h,d),mats[m]);o.position.set(x,y,z);o.rotation.set(rx,ry,rz);o.castShadow=o.receiveShadow=true;return add(n,o);}
 function cyl(n,r,d,x,y,z,m='chrome',axis='x'){const o=new T.Mesh(new T.CylinderGeometry(r,r,d,16),mats[m]);o.position.set(x,y,z);if(axis==='x')o.rotation.z=Math.PI/2;else if(axis==='z')o.rotation.x=Math.PI/2;o.castShadow=true;return add(n,o);}
 function ell(n,x,y,z,sx,sy,sz,m){const o=new T.Mesh(new T.SphereGeometry(1,20,12),mats[m]);o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.castShadow=true;o.receiveShadow=true;return add(n,o);}
 function pane(n,p,m='glass'){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p.flat(),3));g.setIndex([0,1,2,0,2,3]);g.computeVertexNormals();return add(n,new T.Mesh(g,mats[m]));}
 function tube(n,p,r,m){const o=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(p.map(v=>new T.Vector3(...v))),Math.max(4,p.length*4),r,6,false),mats[m]);o.castShadow=true;return add(n,o);}
 const radius=hot?.45:.38,track=hot?1.04:.93,front=hot?-1.65:-1.35,rear=hot?1.60:1.35;
 box('chassis',1.74,.16,hot?4.9:4.15,0,.43,0,'dark');box('tub',1.82,.28,hot?4.7:3.9,0,.64,0);
 for(const [end,z] of [['front',front],['rear',rear]])for(const side of [-1,1]){const n='wheel-'+end+'-'+(side>0?'left':'right'),x=side*track;cyl(n,radius,.29,x,radius,z,'rubber');cyl(n,radius*.63,.31,x,radius,z,hot?'chrome':'rust');cyl(n,.09,.33,x,radius,z,'dark');}
 box('engine',.72,.36,.70,0,.84,hot?-1.65:-1.20,'chrome');
 if(hot){
  for(const side of [-1,1])for(const [end,z] of [['front',-1.25],['rear',1.15]]){ell('bun-'+end+'-'+side,side*.72,1.18,z,.54,.55,1.52,'bun');ell('bread-'+end+'-'+side,side*.50,1.33,z,.28,.40,1.38,'bread');}
  cyl('sausage-middle',.62,2.55,0,1.68,0,'dog','z');ell('sausage-front',0,1.68,-1.28,.62,.62,1.47,'dog');ell('sausage-rear',0,1.68,1.28,.62,.62,1.47,'dog');
  pane('glass',[[-.48,1.77,-2.38],[.48,1.77,-2.38],[.49,2.12,-1.72],[-.49,2.12,-1.72]]);tube('glass',[[-.48,1.77,-2.39],[-.49,2.13,-1.72],[.49,2.13,-1.72],[.48,1.77,-2.39]],.025,'chrome');
  for(const side of [-1,1]){pane('door-'+side,[[side*.62,1.61,-1.92],[side*.64,1.61,-.52],[side*.57,2.02,-.52],[side*.54,2.05,-1.60]]);box('door-'+side,.05,.08,.23,side*.97,1.34,-.72,'chrome');}
  for(const [n,a,b] of [['mustard-front',-1.7,-.15],['mustard-rear',-.05,1.85]]){const p=[];for(let z=a;z<=b;z+=.14)p.push([Math.sin(z*5)*.13,2.33,z]);tube(n,p,.055,'mustard');}
  box('grille',1.72,.22,.15,0,.63,-2.43,'chrome');box('rear-bumper',1.72,.18,.14,0,.61,2.42,'chrome');
  for(const side of [-1,1]){cyl('headlight-'+side,.13,.08,side*.73,.84,-2.48,'light','z');box('tail-light-'+side,.20,.13,.07,side*.78,.74,2.46,'red');}
  box('cabin',1.30,.28,.48,0,1.02,-.95,'seat');
 }else{
  box('bonnet',1.86,.15,1.32,0,1.04,-1.45,'rust',0,.02,-.04);box('trunk',1.82,.18,1.03,0,1.04,1.62,'paint',.02,0,.02);box('roof',1.52,.13,1.68,0,1.66,.18,'patch',0,0,.02);
  pane('glass',[[-.84,1.08,-.91],[.84,1.08,-.91],[.72,1.62,-.67],[-.72,1.62,-.67]]);pane('rear-glass',[[-.82,1.08,1.16],[.82,1.08,1.16],[.71,1.59,.95],[-.71,1.59,.95]]);tube('glass',[[-.38,1.16,-.88],[-.15,1.39,-.78],[.03,1.32,-.81],[.19,1.57,-.69]],.010,'chrome');
  for(const side of [-1,1])for(const [label,z] of [['front',-.40],['rear',.62]]){const n='door-'+label+'-'+side;box(n,.065,.44,.95,side*.94,.94,z,side===1&&label==='front'?'patch':'paint');pane(n,[[side*.93,1.15,z-.44],[side*.93,1.15,z+.44],[side*.75,1.58,z+.35],[side*.75,1.58,z-.35]]);box(n,.04,.04,.16,side*.99,1.07,z+.23,'chrome');}
  for(const side of [-1,1])for(const [end,z] of [['front',front],['rear',rear]]){const p=[];for(let i=0;i<=10;i++){const a=i/10*Math.PI;p.push([side*.99,.41+Math.sin(a)*.48,z+Math.cos(a)*.48]);}tube('fender-'+end+'-'+side,p,.045,'rust');}
  for(const side of [-1,1]){box('mirror-'+side,.17,.12,.19,side*1.03,1.19,-.78,'chrome');cyl('headlight-'+side,.14,.08,side*.65,.89,-2.17,side===1?'light':'dark','z');box('tail-light-'+side,.34,.13,.06,side*.70,.96,2.17,'red');}
  box('grille',1.80,.28,.10,0,.87,-2.13,'dark');for(let i=-5;i<=5;i++)box('grille',.07,.18,.015,i*.12,.88,-2.20,'chrome');box('rear-bumper',1.95,.12,.12,0,.63,2.20,'rust');box('cabin',1.40,.30,.54,0,1.02,.42,'seat');
 }
 const assemblies=[];for(const [name,g] of groups){g.updateMatrixWorld(true);const bb=new T.Box3().setFromObject(g),center=bb.getCenter(new T.Vector3()),size=bb.getSize(new T.Vector3());for(const child of g.children)child.position.sub(center);g.position.copy(center);g.userData={home:center.clone(),size,attached:true};assemblies.push(g);}
 return {root,assemblies,materials:mats};
}