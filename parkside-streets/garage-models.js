// Photo-inspired SUVs. Every panel belongs to a separate, replayable wreck assembly.
export const VEHICLES=[
 {id:'roadster',name:'Roadster',detail:'Vintage classic',mass:950,radius:.525,track:1.04,front:-1.48,rear:1.45,offset:.85,power:1550,box:[1.16,.26,2.28],center:.05},
 {id:'santafe',name:'Santa Fe',detail:'Metallic gray · rebuilt',mass:1580,radius:.40,track:.96,front:-1.43,rear:1.43,offset:.653,power:2550,box:[.97,.38,2.22],center:.23},
 {id:'jalopy',name:'Jalopy',detail:'Beater · NO BRAKES',noBrakes:true,mass:1150,radius:.38,track:.93,front:-1.35,rear:1.35,offset:.633,power:1650,halfWidth:1.08,halfLength:2.35,box:[.98,.28,2.18],center:.15},
 {id:'wiener',name:'Wienermobile',detail:'Photo-matched classic coach',mass:1900,radius:.36,track:1.00,front:-1.65,rear:1.60,offset:.613,power:2750,halfWidth:1.24,halfLength:2.88,box:[1.18,.48,2.70],center:.41},
 {id:'maybach',name:'Maybach Zeppelin V12',detail:'1930s luxury giant',mass:2800,radius:.49,track:.87,front:-1.86,rear:1.78,offset:.73,power:3900,halfWidth:1.19,halfLength:2.88,box:[1.11,.40,2.65],center:.27},
 {id:'nova',name:'Chevy Nova',detail:'1,200 HP · Supercharged',mass:1270,radius:.41,track:.94,front:-1.48,rear:1.43,offset:.663,power:9500,maxSpeed:27,halfWidth:1.16,halfLength:2.38,box:[1.00,.30,2.24],center:.17},
 {id:'newyorker',name:'Chrysler New Yorker',detail:'Sage green · chrome & whitewalls',mass:1920,radius:.41,track:.98,front:-1.65,rear:1.65,offset:.663,power:2950,halfWidth:1.20,halfLength:2.89,box:[1.07,.34,2.76],center:.21},
 {id:'e250',name:'Ford E250',detail:'Full-size cargo van',mass:2450,radius:.44,track:1.04,front:-1.69,rear:1.64,offset:.693,power:3350,halfWidth:1.35,halfLength:2.83,box:[1.10,.65,2.70],center:.47},
];
export function buildSUV(T,kind){
 const jeep=kind==='jeep',root=new T.Group(),groups=new Map();
 const material=(color,metalness=0,roughness=.5)=>new T.MeshStandardMaterial({color,metalness,roughness});
 const materials={paint:material(jeep?0x303a3e:0x858b92,.48,.32),dark:material(0x171e20,.18,.6),chrome:material(0xbfcbd0,.8,.23),glass:material(0x405864,.25,.3),rubber:material(0x171b1c,0,.94),light:material(0xf2f2dc,.1,.24),red:material(0xb32828,.15,.28),amber:material(0xf39c36),seat:material(0x3b4140),steel:material(0x555e61,.7,.45)};
 materials.glass.side=T.DoubleSide;
 function mesh(name,geo,mat,x=0,y=0,z=0,rx=0,ry=0,rz=0){if(!groups.has(name))groups.set(name,[]);const m=new T.Mesh(geo,materials[mat]);m.position.set(x,y,z);m.rotation.set(rx,ry,rz);m.updateMatrix();groups.get(name).push(m);return m;}
 const box=(n,w,h,d,x,y,z,mat='paint',rx=0,ry=0,rz=0)=>mesh(n,new T.BoxGeometry(w,h,d),mat,x,y,z,rx,ry,rz);
 const cylinder=(n,r,h,x,y,z,mat='steel',axis='x')=>mesh(n,new T.CylinderGeometry(r,r,h,16),mat,x,y,z,axis==='z'?Math.PI/2:0,0,axis==='x'?Math.PI/2:0);
 function line(n,points,r,mat){const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));mesh(n,new T.TubeGeometry(curve,Math.max(1,(points.length-1)*4),r,6,false),mat);}
 // Closed, tapered body sections: z, half-width, bottom, top.
 function shell(n,rings,mat='paint'){
  const vertices=[],indices=[];rings.forEach(([z,w,b,t])=>vertices.push(-w,b,z,w,b,z,w,t,z,-w,t,z));
  for(let j=0;j<rings.length-1;j++)for(let k=0;k<4;k++){const a=j*4+k,b=j*4+(k+1)%4,c=b+4,d=a+4;indices.push(a,b,c,a,c,d);}
  indices.push(0,2,1,0,3,2);const end=(rings.length-1)*4;indices.push(end,end+1,end+2,end,end+2,end+3);
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();mesh(n,g,mat);
 }
 function polygon(n,points,mat){const p=points.flat(),g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex([0,1,2,0,2,3]);g.computeVertexNormals();mesh(n,g,mat);}
 const ride=jeep?.16:0,at=y=>y+ride;
 box('chassis',1.72,.15,3.95,0,at(.43),0,'steel');box('tub',1.75,.14,2.8,0,at(.60),.25,'paint');
 for(const z of [-1.43,jeep?1.38:1.43]){cylinder('drive',.07,2.0,0,at(.46),z,'steel');cylinder('drive',.17,.32,0,at(.46),z,'dark');}cylinder('drive',.065,2.9,0,at(.45),0,'steel','z');
 shell('bonnet',jeep?[[-2.12,.96,at(.94),at(1.17)],[-.73,.96,at(1.02),at(1.2)]]:[[-2.18,.83,.89,1.03],[-1.78,.99,1.00,1.18],[-.70,.97,1.1,1.25]]);
 shell('rear-bumper',jeep?[[1.94,1.02,at(.52),at(.78)],[2.23,1.02,at(.52),at(.78)]]:[[1.88,.98,.48,.87],[2.24,.87,.48,.85]],'dark');
 shell('grille',jeep?[[-2.25,1.01,at(.59),at(1.15)],[-2.09,1.01,at(.60),at(1.16)]]:[[-2.30,.87,.50,.91],[-2.14,1.00,.56,1.04]],'paint');
 box('grille',jeep?1.13:1.32,jeep?.48:.40,.07,0,at(jeep?.94:.83),-2.315,'dark');
 if(jeep){for(let i=-3;i<=3;i++)box('grille',.06,.43,.045,i*.15,at(.94),-2.36,'paint');}
 else {for(let i=0;i<3;i++){const y=.72+i*.13,w=1.0+i*.15;line('grille',[[-w/2,y+.03,-2.36],[-w/2+.12,y,-2.38],[w/2-.12,y,-2.38],[w/2,y+.03,-2.36]],.029,'chrome');}mesh('grille',new T.TorusGeometry(.095,.013,6,18),'chrome',0,.97,-2.39,0,0,Math.PI/8);box('grille',1.25,.075,.12,0,.47,-2.27,'chrome');}
 for(const side of [-1,1]){
  const x=side*(jeep?.83:.77);
  box('headlight-'+side,jeep?.31:.43,jeep?.27:.15,.10,x,at(jeep?1.00:1.10),-2.20,'chrome',0,jeep?0:side*-.24,jeep?0:side*.12);
  box('headlight-'+side,jeep?.25:.35,jeep?.21:.10,.025,x,at(jeep?1.00:1.10),-2.26,'light',0,jeep?0:side*-.24,jeep?0:side*.12);
  box('headlight-'+side,.09,.17,.06,side*.99,at(.87),-2.20,'amber');
  box('grille',.26,.13,.065,x,.64+ride,-2.27,'light');
  box('tail-light-'+side,jeep?.18:.40,jeep?.39:.15,.10,side*.84,at(jeep?1.02:1.03),2.14,'red',0,0,jeep?0:side*-.15);
  for(const [end,z] of [['front',-1.43],['rear',jeep?1.38:1.43]]){
   const r=jeep?.53:.40,n='wheel-'+end+'-'+(side>0?'left':'right'),wx=side*(jeep?1.03:.96);
   cylinder(n,r,jeep?.35:.26,wx,r,z,'rubber');
   for(const sign of [-1,1]){const face=wx+sign*(jeep?.18:.137);cylinder(n,r*.66,.018,face,r,z,jeep?'dark':'chrome');cylinder(n,r*.23,.03,face+sign*.012,r,z,'steel');
    for(let i=0;i<(jeep?8:5);i++){const a=i*Math.PI*2/(jeep?8:5);if(jeep)cylinder(n,.041,.025,face+sign*.013,r+Math.sin(a)*r*.46,z+Math.cos(a)*r*.46,'steel');else box(n,.025,.042,r*.94,face+sign*.02,r+Math.sin(a)*r*.33,z+Math.cos(a)*r*.33,'dark',-a,0,0);}}
   if(jeep)for(let i=0;i<24;i++){const a=i/24*Math.PI*2;box(n,.37,.045,.10,wx,r+Math.cos(a)*r,z+Math.sin(a)*r,'rubber',a,0,0);}
   const f='fender-'+end+'-'+side,R=r+.12,points=[];for(let i=0;i<=12;i++){const a=Math.PI*i/12;points.push([side*(jeep?1.045:1.0),at(.46)+Math.sin(a)*R,z+Math.cos(a)*R]);}line(f,points,jeep?.07:.045,'dark');
  }
  box('sill-'+side,.12,.17,1.82,side*.98,at(.58),.0,'dark');
  // Four doors remain separate, including their window, handle and belt trim.
  for(const [label,za,zb] of [['front',-.76,.36],['rear',.40,1.50]]){
   const n='door-'+label+'-'+side;box(n,.065,jeep?.53:.52,1.06,side*.977,at(.93),(za+zb)/2,'paint');
   const top=jeep?at(1.93):1.85,lower=at(1.20),upperX=side*(jeep?.91:.80),lowerX=side*.98;
   const topFront=label==='front'?(jeep?-.58:-.28):za,topRear=label==='rear'?(jeep?1.5:1.23):zb;
   polygon(n,[[lowerX,lower,za],[lowerX,lower,zb],[upperX,top,topRear],[upperX,top,topFront]],'glass');
   line(n,[[lowerX,lower,za],[upperX,top,topFront],[upperX,top,topRear],[lowerX,lower,zb]],.028,'paint');
   box(n,.026,.028,1.05,side*1.018,at(1.20),(za+zb)/2,jeep?'dark':'chrome');box(n,.035,.045,.18,side*1.025,at(1.11),zb-.17,jeep?'dark':'chrome');
   if(jeep)box(n,.03,.06,1.02,side*1.02,at(.82),(za+zb)/2,'dark');
  }
  box('mirror-'+side,.22,.16,.28,side*1.10,at(1.29),-.69,'paint');box('mirror-'+side,.19,.12,.02,side*1.10,at(1.29),-.54,'chrome');
  box('cabin',.60,.16,.67,side*.45,at(.75),.0,'seat');box('cabin',.60,.60,.15,side*.45,at(1.06),.33,'seat');
 }
 const roofY=jeep?at(1.99):1.92;
 shell('roof',jeep?[[-.63,.95,roofY-.07,roofY],[1.93,.95,roofY-.07,roofY]]:[[-.31,.81,1.87,1.92],[.7,.86,1.90,1.97],[1.66,.73,1.77,1.84]]);
 const lowZ=jeep?-.79:-.73,highZ=jeep?-.63:-.31,screenTop=jeep?at(1.93):1.85,halfTop=jeep?.90:.78;
 polygon('glass',[[-.93,at(1.25),lowZ],[.93,at(1.25),lowZ],[halfTop,screenTop,highZ],[-halfTop,screenTop,highZ]],'glass');
 for(const side of [-1,1])line('glass',[[side*.96,at(1.22),lowZ],[side*(halfTop+.025),screenTop+.04,highZ]],.038,'paint');
 for(const x of [-.38,.38])line('glass',[[x-.20,at(1.28),lowZ-.015],[x+.24,at(1.31),lowZ+.015]],.012,'dark');
 const tailTop=jeep?1.93:1.63;
 shell('tailgate',jeep?[[1.96,.97,at(.78),at(1.27)],[2.13,.97,at(.78),at(1.27)]]:[[1.86,.90,.82,1.22],[2.14,.86,.83,1.19]]);
 polygon('tailgate',[[-.88,at(1.24),2.10],[.88,at(1.24),2.10],[jeep?.9:.71,jeep?at(1.91):1.77,tailTop],[-(jeep?.9:.71),jeep?at(1.91):1.77,tailTop]],'glass');
 for(const side of [-1,1]){polygon('quarter-'+side,[[side*.98,at(1.21),1.53],[side*.89,at(1.23),2.08],[side*(jeep?.9:.72),jeep?at(1.92):1.78,tailTop],[side*(jeep?.91:.78),jeep?at(1.92):1.81,1.51]],'glass');line('quarter-'+side,[[side*.98,at(.80),2.12],[side*.95,at(1.24),2.12],[side*(jeep?.94:.74),jeep?at(1.97):1.83,tailTop]],.055,'paint');}
 for(const side of [-1,1])line('roof-rack',[[side*.72,roofY,-.38],[side*.72,roofY+.12,-.30],[side*.72,roofY+.12,1.55],[side*.72,roofY,1.62]],jeep?.04:.029,jeep?'dark':'chrome');
 if(jeep){for(const z of [-.18,1.32])box('roof-rack',1.70,.07,.12,0,roofY+.13,z,'dark');line('bullbar',[[-1.03,at(.59),-2.35],[-.86,at(.63),-2.38],[-.52,at(1.12),-2.38],[.52,at(1.12),-2.38],[.86,at(.63),-2.38],[1.03,at(.59),-2.35]],.055,'steel');box('bullbar',2.10,.14,.22,0,at(.53),-2.31,'dark');for(const side of [-1,1]){box('bullbar',.20,.20,.09,side*.68,at(.67),-2.45,'chrome');box('bullbar',.14,.14,.025,side*.68,at(.67),-2.51,'light');}}
 else {box('roof',1.53,.075,.23,0,1.83,1.73,'paint');box('tailgate',.75,.025,.02,0,1.12,2.23,'chrome');}
 box('engine',.66,.36,.64,0,at(.84),-1.30,'steel');box('engine',.7,.06,.66,0,at(1.04),-1.30,'dark');for(let i=0;i<4;i++)box('engine',.10,.04,.52,-.23+i*.15,at(1.09),-1.30,'chrome');
 // Merge each material within an assembly to keep mobile draw calls low.
 const assemblies=[];
 for(const [name,list] of groups){const bounds=new T.Box3(),byMat=new Map();for(const m of list){const g=m.geometry.clone().applyMatrix4(m.matrix);const flat=g.index?g.toNonIndexed():g;flat.computeBoundingBox();bounds.union(flat.boundingBox);if(!byMat.has(m.material))byMat.set(m.material,[]);byMat.get(m.material).push(flat);m.geometry.dispose();if(g!==flat)g.dispose();}
  const center=bounds.getCenter(new T.Vector3()),part=new T.Group();part.name=name;part.position.copy(center);
  for(const [mat,geos] of byMat){const positions=[],normals=[];for(const g of geos){const p=g.attributes.position,n=g.attributes.normal;for(let i=0;i<p.count;i++){positions.push(p.getX(i)-center.x,p.getY(i)-center.y,p.getZ(i)-center.z);normals.push(n.getX(i),n.getY(i),n.getZ(i));}g.dispose();}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('normal',new T.Float32BufferAttribute(normals,3));g.computeBoundingSphere();const m=new T.Mesh(g,mat);m.castShadow=true;m.receiveShadow=true;part.add(m);}
  part.userData={home:center.clone(),size:bounds.getSize(new T.Vector3()),attached:true};root.add(part);assemblies.push(part);
 }
 return {root,assemblies,materials};
}
