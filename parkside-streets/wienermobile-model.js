import {detailKit} from './vehicle-detail-kit.js?v=gold-8';

// The reference vehicle is a glazed orange sausage coach on a yellow road body.
// Surface patches share the same analytic profile, including the glass openings.
export function buildWienermobile(T,c){
 const k=detailKit(T),{mat,box,rounded,tube,cyl,torus}=k;
 mat('yellow',0xf7d91d,.12,.32,{side:T.DoubleSide});
 mat('orange',0xe97815,.12,.30,{side:T.DoubleSide});
 mat('seam',0xb97813,.08,.48);mat('gasket',0x182325,.1,.44);
 mat('glass',0x29434e,.30,.12,{side:T.DoubleSide,transparent:true,opacity:.78,depthWrite:false});
 mat('rim',0xd0d3cd,.65,.20);mat('reflector',0xffefcf,.35,.16);
 const upper=[[-2.49,.015,.02,1.39],[-2.39,.36,.27,1.48],[-2.12,.68,.52,1.59],[-1.60,.80,.64,1.66],[-.80,.83,.67,1.68],[0,.84,.69,1.70],[.78,.86,.72,1.76],[1.57,.86,.78,1.90],[2.13,.70,.71,2.03],[2.52,.38,.43,2.08],[2.70,.012,.015,2.09]];
 const lower=[[-2.84,.014,.025,.69],[-2.70,.57,.20,.71],[-2.37,.94,.31,.73],[-1.80,1.13,.39,.76],[-.9,1.17,.40,.77],[.4,1.18,.40,.78],[1.62,1.14,.39,.80],[2.27,.97,.35,.84],[2.65,.60,.26,.88],[2.81,.012,.025,.91]].map(([z,x,r,y])=>[z,x,r+.055*Math.min(1,x),y+.055]);
 function profile(rows,z){let j=0;while(j<rows.length-2&&z>rows[j+1][0])j++;const a=rows[j],b=rows[j+1],prev=rows[Math.max(0,j-1)],next=rows[Math.min(rows.length-1,j+2)],h=b[0]-a[0],u=Math.max(0,Math.min(1,(z-a[0])/h));return [1,2,3].map(i=>{const m0=(b[i]-prev[i])/(b[0]-prev[0]),m1=(next[i]-a[i])/(next[0]-a[0]);return (2*u**3-3*u*u+1)*a[i]+(u**3-2*u*u+u)*h*m0+(-2*u**3+3*u*u)*b[i]+(u**3-u*u)*h*m1;});}
 function point(rows,z,a,lift=0){const [rx,ry,cy]=profile(rows,z);return new T.Vector3(Math.sin(a)*(rx+lift),cy+Math.cos(a)*(ry+lift),z);}
 // Smooth normals are calculated before splitting the body into wreckable panels.
 function normal(rows,z,a){const dz=.0002,p=point(rows,z,a),ta=point(rows,z,a+dz).sub(p),tz=point(rows,z+dz,a).sub(p);return ta.cross(tz).normalize();}
 function surface(rows,z0,z1,steps,sides,classify){
  const bins=new Map();
  function vertex(z,a){return {p:point(rows,z,a),n:normal(rows,Math.min(z,rows.at(-1)[0]-.0003),a)};}
  for(let j=0;j<steps;j++)for(let i=0;i<sides;i++){
   const za=z0+(z1-z0)*j/steps,zb=z0+(z1-z0)*(j+1)/steps,aa=-Math.PI+i*2*Math.PI/sides,ab=-Math.PI+(i+1)*2*Math.PI/sides;
   const verts=[vertex(za,aa),vertex(za,ab),vertex(zb,ab),vertex(zb,aa)];
   for(const ids of [[0,1,2],[0,2,3]]){const p=ids.reduce((v,i)=>v.add(verts[i].p),new T.Vector3()).multiplyScalar(1/3),a=(aa+ab)/2,label=classify(p,a);if(!label)continue;const [name,material]=label,key=name+'|'+material;if(!bins.has(key))bins.set(key,{name,material,p:[],n:[]});const bin=bins.get(key);for(const id of ids){bin.p.push(...verts[id].p.toArray());bin.n.push(...verts[id].n.toArray());}}
  }
  for(const bin of bins.values()){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(bin.p,3));g.setAttribute('normal',new T.Float32BufferAttribute(bin.n,3));k.add(bin.name,g,bin.material);}
 }
 const windowBoxes=[[-1.19,-.38],[-.24,.59]];
 function windowRegion(z,a){
  const q=Math.abs(a);
  if(z<-1.28-.24*Math.cos(a)&&q<1.81&&point(upper,z,a).y>1.40)return 'windshield';
  for(let i=0;i<windowBoxes.length;i++){
   const [lo,hi]=windowBoxes[i],slant=.14*(1.15-q),u=(z-slant-(lo+hi)/2)/((hi-lo)/2),v=(q-1.14)/.68;
   if(Math.abs(u)<1&&Math.abs(v)<1&&(Math.max(0,Math.abs(u)-.78)/.22)**2+(Math.max(0,Math.abs(v)-.78)/.22)**2<1)return 'window-'+i+'-'+Math.sign(a);
  }return null;
 }
 surface(upper,-2.49,2.70,210,128,(p,a)=>{const w=windowRegion(p.z,a);return w?[w,'glass']:[p.z<-.36?'cab-front':p.z<.83?'cab-center':'sausage-tail','orange'];});
 // Raised yellow wrap and curved, readable brand plaques on each side.
 const bandRows=upper.map(r=>[r[0],r[1]+.012,r[2]+.012,r[3]]);
 surface(bandRows,.83,1.37,24,96,()=>['brand-band','yellow']);
 const badge=document.createElement('canvas');badge.width=512;badge.height=384;
 const ctx=badge.getContext('2d');ctx.fillStyle='#c82b21';ctx.fillRect(0,0,512,384);ctx.fillStyle='#fff7d8';ctx.fillRect(16,16,480,352);ctx.strokeStyle='#c82b21';ctx.lineWidth=8;ctx.strokeRect(29,29,454,326);ctx.fillStyle='#bd2720';ctx.textAlign='center';ctx.font='900 94px Arial';ctx.fillText('OSCAR',256,166);ctx.fillText('MAYER',256,270);
 const tex=new T.CanvasTexture(badge);tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=4;const badgeMat=new T.MeshStandardMaterial({map:tex,roughness:.5,side:T.DoubleSide});
 for(const side of [-1,1]){
  const positions=[],uv=[],idx=[];for(let y=0;y<=12;y++)for(let z=0;z<=16;z++){const a=side*(1.23+y/12*.59),zz=.89+z/16*.42,p=point(upper,zz,a,.024);positions.push(...p.toArray());uv.push(side>0?1-z/16:z/16,1-y/12);}for(let y=0;y<12;y++)for(let z=0;z<16;z++){const a=y*17+z;idx.push(a,a+1,a+18,a,a+18,a+17);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();k.add('brand-band',g,badgeMat);
 }
 // Fine rubber borders follow the exact surface rather than flat panes through it.
 for(const side of [-1,1])for(let i=0;i<windowBoxes.length;i++){
  const [lo,hi]=windowBoxes[i],points=[];for(let s=0;s<=100;s++){const a=s/100*Math.PI*2,u=Math.sign(Math.cos(a))*Math.pow(Math.abs(Math.cos(a)),.24),v=Math.sign(Math.sin(a))*Math.pow(Math.abs(Math.sin(a)),.24),q=1.14+v*.678,z=(lo+hi)/2+u*(hi-lo)/2+.14*(1.15-q);points.push(point(upper,z,side*q,.007).toArray());}tube('window-'+i+'-'+side,points,.012,'gasket',100);
  const rail=[];for(let j=0;j<=22;j++){const q=1.53,z=lo+(hi-lo)*j/22+.14*(1.15-q);rail.push(point(upper,z,side*q,.009).toArray());}tube('window-'+i+'-'+side,rail,.007,'gasket',22);
 }
 for(const side of [-1,1]){
  const border=[];for(let j=0;j<=32;j++){const a=side*1.81*j/32,z=-1.28-.24*Math.cos(a);border.push(point(upper,z,a,.006).toArray());}tube('windshield',border,.018,'orange',32);
  const sill=[];for(let j=0;j<=42;j++){const z=-2.36+j*1.03/42,[rx,ry,cy]=profile(upper,z),a=side*Math.acos(Math.max(-1,Math.min(1,(1.405-cy)/ry)));sill.push(point(upper,z,a,.012).toArray());}tube('windshield',sill,.013,'gasket',42);
  tube('wipers',[[side*.13,1.42,-2.405],[side*.43,1.59,-2.313],[side*.61,1.78,-2.137]],.012,'gasket',12);
  tube('wipers',[[side*.32,1.53,-2.369],[side*.54,1.73,-2.22]],.018,'gasket',8);
 }
 // Real recessed wheel openings cut into the rounded yellow shell.
 const opening=c.radius+.055;
 function wheelCut(p){if(Math.abs(p.x)<.78)return false;for(const z of [c.front,c.rear])if((p.z-z)**2+(p.y-c.radius)**2<opening**2)return true;return false;}
 surface(lower,-2.84,2.81,220,96,(p,a)=>wheelCut(p)?null:[p.z<-.9?'nose':p.z>1?'tail':'tub','yellow']);
 // A smooth oval intake follows the nose curvature, with no protruding black bumper.
 {
  const positions=[],indices=[];for(let ring=0;ring<=12;ring++)for(let j=0;j<=64;j++){
   const a=j/64*Math.PI*2,x=Math.cos(a)*.55*ring/12,y=.68+Math.sin(a)*.115*ring/12;let lo=-2.84,hi=-2.35;
   for(let n=0;n<24;n++){const z=(lo+hi)/2,[rx,ry,cy]=profile(lower,z);if((x/rx)**2+((y-cy)/ry)**2>1)lo=z;else hi=z;}
   positions.push(x,y,(lo+hi)/2-.009);
  }
  for(let r=0;r<12;r++)for(let j=0;j<64;j++){const a=r*65+j;indices.push(a,a+66,a+65,a,a+1,a+66);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();k.add('grille',g,'gasket');
 }
 for(const side of [-1,1])for(const [end,z]of [['front',c.front],['rear',c.rear]]){
  const pts=[];for(let j=0;j<=48;j++){const a=Math.PI*j/48,zz=z+Math.cos(a)*opening,y=c.radius+Math.sin(a)*opening,[rx,ry,cy]=profile(lower,zz),x=rx*Math.sqrt(Math.max(.01,1-((y-cy)/ry)**2));if(y>cy-ry+.015)pts.push([side*x,y,zz]);}tube('fender-'+end+'-'+side,pts,.018,'yellow',48);
  k.wheel('wheel-'+end+'-'+(side>0?'left':'right'),side*c.track,c.radius,z,c.radius,.26,'alloy');
  // Silver ventilated wheel covers, as on the photographed coach; no whitewalls.
  const face=side*(c.track+.142);cyl('wheel-'+end+'-'+(side>0?'left':'right'),c.radius*.58,.02,face,c.radius,z,'rim');for(let j=0;j<10;j++){const a=j*Math.PI/5;cyl('wheel-'+end+'-'+(side>0?'left':'right'),.020,.024,face+side*.014,c.radius+Math.sin(a)*c.radius*.44,z+Math.cos(a)*c.radius*.44,'black');}
 }
 for(const side of [-1,1]){
  // Close-fitting mirror housings and their rear-facing reflective glass.
  tube('mirror-'+side,[[side*.80,1.46,-1.34],[side*1.01,1.47,-1.49]],.026,'gasket',5);
  const mirror=k.add('mirror-'+side,new T.SphereGeometry(1,20,12),'gasket',side*1.06,1.50,-1.49);mirror.scale.set(.105,.14,.11);
  const glass=k.add('mirror-'+side,new T.SphereGeometry(1,16,12),'trim',side*1.06,1.50,-1.398);glass.scale.set(.076,.10,.013);
  // Door cut lines and inset service hatch, curved onto the body surface.
  const seam=[];for(let j=0;j<=35;j++){const z=-.35+j*.98/35,[rx,ry,cy]=profile(lower,z);seam.push([side*(rx+.003),cy,z]);}tube('service-door-'+side,seam,.006,'seam',35);
  for(const z of [-.35,.63]){const line=[];for(let j=0;j<=22;j++)line.push(point(lower,z,side*(1.06+j*.92/22),.006).toArray());tube('service-door-'+side,line,.006,'seam',22);}
  rounded('service-door-'+side,.02,.075,.12,side*1.185,.89,.42,'gasket',.008);
  const dz=-.45;rounded('door-handle-'+side,.035,.04,.17,side*.84,1.41,dz,'gasket',.008);
  for(let j=0;j<5;j++)rounded('vent-'+side,.018,.013,.27,side*1.178,.58+j*.034,.04,'gasket',.004);
  rounded('marker-'+side,.026,.06,.13,side*1.11,.66,-2.01,'amberLens',.01);
  rounded('step-'+side,.24,.05,.65,side*.95,.36,-.59,'steel',.012);
  for(let j=0;j<6;j++)box('step-'+side,.19,.004,.017,side*.97,.389,-.84+j*.10,'black');
  // Flush lamp lenses with rounded bezels and individual reflector elements.
  const lamp=k.add('headlight-'+side,new T.SphereGeometry(1,24,16),'trim',side*.71,.975,-2.39);lamp.scale.set(.25,.095,.095);lamp.rotation.y=-side*.45;
  const lens=k.add('headlight-'+side,new T.SphereGeometry(1,24,16),'reflector',side*.711,.987,-2.434);lens.scale.set(.211,.067,.068);lens.rotation.y=-side*.45;
  for(let j=0;j<3;j++)tube('headlight-'+side,[[side*(.57+j*.11),.941,-2.473],[side*(.57+j*.11),1.02,-2.467]],.004,'ivory',1);
  rounded('tail-light-'+side,.23,.10,.055,side*.68,.86,2.55,'tailLens',.02,0,side*.35);
 }
 k.plate('rear-bumper',2.72,.67,'WEENR',.34);
 box('chassis',1.36,.13,4.10,0,.44,0,'black');
 k.mechanics(c,{engineZ:-1.5,cylinders:8});for(const mesh of k.group('engine').children)mesh.position.y-=.16;
 k.interior({baseY:1.02,front:-1.10,rear:.0,dash:-1.80,width:.66,rows:2});
 const model=k.finish();model.root.userData.reference='Orange glazed coach, yellow body and rear brand band';return model;
}
