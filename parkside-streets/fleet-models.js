import {detailKit} from './vehicle-detail-kit.js?v=quality-1';

export function buildFleetVehicle(T,c){
 const k=detailKit(T),{mat,box,rounded,tube,cyl,torus,lamp,plate}=k;
 const suv=c.id==='santafe',van=c.id==='e250';
 mat('paint',suv?0x77736f:van?0xe4e5dd:0xa3ae91,suv?.38:.26,suv?.27:.33,{side:T.DoubleSide});
 mat('roofPaint',van?0xe4e5dd:suv?0x77736f:0xc1c5ad,.20,.37,{side:T.DoubleSide});
 mat('rubber',0x202727,.03,.76);mat('window',0x405963,.20,.15,{transparent:true,opacity:.52,depthWrite:false,side:T.DoubleSide});
 mat('chrome',0xd5dfde,.67,.20);mat('seam',suv?0x363d38:van?0x929993:0x61715c,.1,.65);mat('badgeBlue',0x164776,.3,.25);
 function interp(rows,z){let j=0;while(j<rows.length-2&&z>rows[j+1][0])j++;const a=rows[j],b=rows[j+1],p=rows[Math.max(0,j-1)],n=rows[Math.min(rows.length-1,j+2)],u=Math.max(0,Math.min(1,(z-a[0])/(b[0]-a[0]))),h=b[0]-a[0];return a.slice(1).map((v,i)=>{i++;return (2*u**3-3*u*u+1)*v+(u**3-2*u*u+u)*h*(b[i]-p[i])/(b[0]-p[0])+(-2*u**3+3*u*u)*b[i]+(u**3-u*u)*h*(n[i]-a[i])/(n[0]-a[0]);});}
 function surfaceStrip(name,rows,z0,z1,xAt,upper=true,r=.012){const points=[];for(let i=0;i<=100;i++){const u=i/100,z=z0+(z1-z0)*u,[w,b,t]=interp(rows,z),x=xAt(w,u),s=Math.pow(Math.min(1,Math.abs(x)/w),1/.36),v=Math.pow(Math.sqrt(Math.max(0,1-s*s)),.48),y=(b+t)/2+(upper?1:-1)*v*(t-b)/2;points.push([x,y+(upper?.003:-.003),z]);}tube(name,points,r,'chrome',200);}
 // Continuous rounded pressings with wheel apertures and separate breakaway panels.
 function skin(rows,name,material='paint',wheels=false){const groups=new Map(),z0=rows[0][0],z1=rows.at(-1)[0],steps=Math.ceil((z1-z0)*36),rad=64;
  function point(z,a){const [w,b,t]=interp(rows,z),s=Math.sin(a),v=Math.cos(a),p=new T.Vector3(Math.sign(s)*Math.pow(Math.abs(s),.36)*w,(b+t)/2+Math.sign(v)*Math.pow(Math.abs(v),.48)*(t-b)/2,z);if(wheels&&Math.abs(p.x)>.69)for(const wz of [c.front,c.rear]){const dz=z-wz,r=c.radius+.075;if(Math.abs(dz)<r)p.y=Math.max(p.y,c.radius+Math.sqrt(r*r-dz*dz));}return p;}
  function vertex(z,a){const p=point(z,a),pa=point(z,a+.0001).sub(p),pz=point(Math.min(z+.0001,z1),a).sub(point(Math.max(z-.0001,z0),a));return {p,n:pa.cross(pz).normalize()};}
  for(let j=0;j<steps;j++)for(let i=0;i<rad;i++){const za=z0+(z1-z0)*j/steps,zb=z0+(z1-z0)*(j+1)/steps,aa=i/rad*Math.PI*2,ab=(i+1)/rad*Math.PI*2,v=[vertex(za,aa),vertex(za,ab),vertex(zb,ab),vertex(zb,aa)];for(const ids of [[0,1,2],[0,2,3]]){const p=ids.reduce((s,i)=>s.add(v[i].p),new T.Vector3()).multiplyScalar(1/3);if(wheels&&Math.abs(p.x)>.69&&[c.front,c.rear].some(z=>(p.z-z)**2+(p.y-c.radius)**2<(c.radius+.075)**2))continue;const n=typeof name==='function'?name(p):name;if(!groups.has(n))groups.set(n,{p:[],n:[]});const g=groups.get(n);for(const id of ids){g.p.push(...v[id].p.toArray());g.n.push(...v[id].n.toArray());}}}
  for(const [n,data]of groups){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(data.p,3));g.setAttribute('normal',new T.Float32BufferAttribute(data.n,3));k.add(n,g,material);}
  // Separate end caps close the shell without polluting smooth body normals.
  for(const z of [z0,z1]){const ps=[];for(let i=0;i<rad;i++)ps.push(point(z,i/rad*Math.PI*2).toArray());k.pane(typeof name==='function'?name(point(z,0)):name,ps,material);}
 }
 function glass(name,p,frame='chrome',bulge=.025){const pos=[],idx=[],a=new T.Vector3(...p[0]),b=new T.Vector3(...p[1]),d=new T.Vector3(...p[3]),cc=new T.Vector3(...p[2]),normal=b.clone().sub(a).cross(d.clone().sub(a)).normalize();for(let y=0;y<=10;y++)for(let x=0;x<=16;x++){const u=x/16,v=y/10,q=a.clone().lerp(b,u).lerp(d.clone().lerp(cc,u),v);q.addScaledVector(normal,Math.sin(u*Math.PI)*Math.sin(v*Math.PI)*bulge);pos.push(...q.toArray());}for(let y=0;y<10;y++)for(let x=0;x<16;x++){const i=y*17+x;idx.push(i,i+1,i+18,i,i+18,i+17);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();k.add(name,g,'window');for(let i=0;i<4;i++)tube(name,[p[i],p[(i+1)%4]],frame==='paint'?.028:.016,frame,1);}
 function textBadge(name,text,x,y,z,w,side=0){const cv=document.createElement('canvas');cv.width=512;cv.height=96;const ctx=cv.getContext('2d');ctx.clearRect(0,0,512,96);ctx.fillStyle='#e0e7df';ctx.font='italic bold 55px Georgia';ctx.textAlign='center';ctx.fillText(text,256,67);const tx=new T.CanvasTexture(cv);tx.colorSpace=T.SRGBColorSpace;const m=new T.MeshStandardMaterial({map:tx,transparent:true,roughness:.28,metalness:.35,side:T.DoubleSide});k.add(name,new T.PlaneGeometry(w,w*96/512),m,x,y,z,0,side?side*Math.PI/2:z<0?Math.PI:0);}
 function mirrors(y,z,w,classic=false){for(const s of [-1,1]){tube('mirror-'+s,[[s*w,y-.09,z],[s*(w+.16),y,z]],.024,'chrome',4);if(classic){cyl('mirror-'+s,.103,.05,s*(w+.17),y+.04,z,'chrome','z');cyl('mirror-'+s,.084,.006,s*(w+.17),y+.04,z+.03,'trim','z');}else{rounded('mirror-'+s,.23,.18,.22,s*(w+.16),y,z,'paint',.04);rounded('mirror-'+s,.19,.13,.014,s*(w+.16),y,z+.118,'chrome',.008);}}}
 function wipers(z0,y0,z1,y1){for(const s of [-1,1]){tube('windshield',[[s*.17,y0+.015,z0-.012],[s*.39,y0+.055,z0+.025]],.009,'rubber',1);tube('windshield',[[s*.24,y0+.04,z0+.015],[s*.68,y0+.078,z0+.045]],.012,'rubber',1);}}
 function doorSeams(s,width,y,zs,bottom){for(const z of zs)tube('door-'+s+'-'+z,[[s*width,bottom,z],[s*(width+.005),y-.13,z],[s*(width-.02),y,z]],.005,'seam',8);for(let i=1;i<zs.length;i++){const z=zs[i]-.16;rounded('door-'+s+'-'+zs[i],.027,.045,.19,s*(width+.024),y-.12,z,'chrome',.008);}}
 if(suv){
  skin([[-2.28,.77,.50,.98],[-2.12,.91,.46,1.10],[-1.5,.982,.47,1.18],[-.7,.98,.48,1.25],[.5,.99,.49,1.27],[1.35,.96,.49,1.26],[2.13,.83,.52,1.19]],p=>p.z<-.76?'bonnet':p.z>1.2?'tailgate':p.x>0?'door-left':'door-right','paint',true);
  skin([[-.42,.76,1.83,1.91],[-.22,.82,1.87,1.98],[.7,.83,1.87,2.0],[1.45,.75,1.79,1.92],[1.7,.65,1.75,1.83]],'roof','roofPaint');
  glass('windshield',[[-.91,1.27,-.94],[.91,1.27,-.94],[.755,1.862,-.38],[-.755,1.862,-.38]],'paint',.035);wipers(-.955,1.28,-.69,1.61);
  for(const s of [-1,1]){
   tube('front-window-'+s,[[s*.931,1.255,-.916],[s*.771,1.875,-.365]],.033,'paint',1);
   tube('rear-window-'+s,[[s*.965,1.27,.371],[s*.79,1.88,.355]],.027,'rubber',1);
   tube('quarter-glass-'+s,[[s*.829,1.235,2.0],[s*.648,1.77,1.64]],.041,'paint',1);
   glass('front-window-'+s,[[s*.938,1.28,-.88],[s*.965,1.29,.33],[s*.79,1.87,.30],[s*.775,1.87,-.33]],'rubber');
   glass('rear-window-'+s,[[s*.962,1.29,.41],[s*.931,1.29,1.24],[s*.74,1.83,1.19],[s*.79,1.87,.39]],'rubber');
   glass('quarter-glass-'+s,[[s*.924,1.29,1.32],[s*.818,1.28,1.99],[s*.64,1.76,1.60],[s*.724,1.82,1.29]],'paint');
   tube('window-trim-'+s,[[s*.97,1.255,-.71],[s*.97,1.265,.48],[s*.94,1.26,1.30],[s*.82,1.25,2.0]],.012,'chrome');
   doorSeams(s,.987,1.24,[-.74,.37,1.29],.60);tube('rocker-'+s,[[s*.968,.535,-.87],[s*.985,.535,.83]],.05,'rubber');
   tube('roof-rail-'+s,[[s*.64,1.96,-.17],[s*.68,2.065,.05],[s*.67,2.047,1.18],[s*.57,1.87,1.56]],.026,'chrome');
   // Swept headlamp housings with two projectors and an LED lower edge.
   const hp=[[s*.51,.94,-2.286],[s*.81,.96,-2.205],[s*.88,1.075,-2.07],[s*.61,1.065,-2.228]];
   k.pane('headlight-'+s,hp,'rubber');for(let j=0;j<4;j++)tube('headlight-'+s,[hp[j],hp[(j+1)%4]],.012,'chrome',1);
   for(let j=0;j<2;j++){const x=s*(.615+j*.145),y=.997+j*.022,z=-2.256+j*.075;cyl('headlight-'+s,.039,.008,x,y,z,'chrome','z');cyl('headlight-'+s,.028,.011,x,y,z-.006,'lens','z');}
   tube('headlight-'+s,[[s*.53,.95,-2.29],[s*.70,.966,-2.25],[s*.82,.984,-2.19]],.008,'lens');
   tube('bonnet',[[s*.47,.986,-2.22],[s*.50,1.142,-1.60],[s*.65,1.189,-.93]],.005,'seam');
   tube('body-line-'+s,[[s*.99,1.08,-.81],[s*1.005,1.10,.33],[s*.974,1.16,1.31]],.007,'seam');
   rounded('fog-'+s,.34,.19,.10,s*.74,.668,-2.232,'rubber',.025);rounded('fog-'+s,.25,.12,.035,s*.74,.668,-2.288,'chrome',.008);lamp('fog-'+s,s*.74,.67,-2.32,.039);
   rounded('tail-light-'+s,.30,.12,.035,s*.60,1.025,2.139,'tailLens',.014,0,-s*.10);for(let j=0;j<3;j++)tube('tail-light-'+s,[[s*.47,.989+j*.025,2.16],[s*.72,.996+j*.025,2.14]],.005,'tailLens');
  }
  glass('rear-glass',[[-.82,1.27,2.10],[.82,1.27,2.10],[.64,1.76,1.66],[-.64,1.76,1.66]],'rubber');
  rounded('spoiler',1.38,.07,.30,0,1.82,1.70,'paint',.02);rounded('sunroof',1.12,.022,.79,0,2.015,.46,'rubber',.005);
  rounded('grille',1.24,.40,.08,0,.934,-2.284,'rubber',.018);
  for(let j=0;j<4;j++){const y=.78+j*.091,w=.50+j*.035;tube('grille',[[-w,y+.015,-2.332],[-w+.12,y,-2.358],[w-.12,y,-2.358],[w,y+.015,-2.332]],.023,'chrome');}
  const emblem=k.add('grille',new T.TorusGeometry(.09,.010,8,32),'chrome',0,1.062,-2.385);emblem.scale.x=1.4;tube('grille',[[-.06,1.022,-2.393],[-.021,1.097,-2.393],[.058,1.035,-2.393],[.073,1.099,-2.393]],.009,'chrome',3);
  rounded('front-bumper',1.84,.15,.17,0,.50,-2.19,'rubber',.032);rounded('front-bumper',1.18,.065,.04,0,.491,-2.296,'chrome',.01);
  rounded('rear-bumper',1.82,.18,.17,0,.52,2.10,'rubber',.028);rounded('rear-bumper',1.13,.055,.08,0,.46,2.16,'chrome',.012);
  textBadge('tailgate','SANTA FE',-.50,.99,2.176,.39);plate('grille',-2.39,.64,'SANTA FE');plate('tailgate',2.185,1.02,'SANTA FE');mirrors(1.37,-.63,.97);
  k.interior({front:.02,rear:1.05,baseY:.79,dash:-.69,width:.79});
 }else if(!van){
  const bodyRows=[[-2.68,.93,.53,1.04],[-2.42,1.02,.48,1.15],[-1.65,1.04,.48,1.21],[-.72,1.025,.49,1.25],[.7,1.03,.49,1.25],[1.85,1.01,.49,1.20],[2.65,.91,.54,1.12]];
  skin(bodyRows,p=>p.z<-.8?'hood':p.z>1.22?'trunk':p.x>0?'door-left':'door-right','paint',true);
  skin([[-.66,.755,1.79,1.85],[-.48,.80,1.84,1.92],[.92,.79,1.83,1.91],[1.20,.73,1.78,1.84]],'roof','roofPaint');
  glass('windshield',[[-.94,1.27,-1.03],[.94,1.27,-1.03],[.75,1.80,-.65],[-.75,1.80,-.65]],'chrome');wipers(-1.044,1.28,-.87,1.53);
  glass('rear-glass',[[-.92,1.27,1.47],[.92,1.27,1.47],[.72,1.79,1.19],[-.72,1.79,1.19]],'chrome');
  for(const s of [-1,1]){
   tube('front-window-'+s,[[s*.949,1.25,-1.01],[s*.765,1.82,-.641]],.026,'chrome',1);
   tube('rear-window-'+s,[[s*.986,1.27,.29],[s*.776,1.824,.276]],.022,'chrome',1);
   tube('rear-glass',[[s*.938,1.257,1.46],[s*.74,1.804,1.18]],.028,'roofPaint',1);
   glass('front-window-'+s,[[s*.991,1.28,-.93],[s*.99,1.28,.25],[s*.775,1.81,.22],[s*.767,1.81,-.58]],'chrome');
   glass('rear-window-'+s,[[s*.99,1.28,.33],[s*.962,1.28,1.39],[s*.73,1.80,1.12],[s*.775,1.81,.32]],'chrome');
   tube('vent-window-'+s,[[s*.99,1.29,-.65],[s*.77,1.80,-.46]],.015,'chrome',1);
   doorSeams(s,1.033,1.23,[-.97,.30,1.43],.59);
   surfaceStrip('beltline-'+s,bodyRows,-2.64,2.64,w=>s*w*.955,true,.013);
   surfaceStrip('sill-'+s,bodyRows,-1.15,1.11,w=>s*w*.955,false,.018);
   textBadge('side-badge-'+s,'New Yorker',s*1.048,.73,-.90,.41,s);
   // Tall chrome headlamp eyebrows frame the paired round lights.
   rounded('headlight-'+s,.50,.38,.16,s*.79,1.016,-2.688,'chrome',.025);rounded('headlight-'+s,.445,.29,.016,s*.79,1.016,-2.782,'rubber',.003);
   for(const dx of [-.122,.122]){cyl('headlight-'+s,.095,.014,s*.79+dx,1.019,-2.794,'chrome','z');cyl('headlight-'+s,.081,.014,s*.79+dx,1.019,-2.808,'lens','z');for(let i=-2;i<=2;i++)tube('headlight-'+s,[[s*.79+dx+i*.025,.962,-2.818],[s*.79+dx+i*.025,1.076,-2.818]],.003,'ivory',1);}
   rounded('tail-light-'+s,.16,.29,.07,s*.83,.967,2.666,'chrome',.014);rounded('tail-light-'+s,.10,.235,.024,s*.83,.967,2.71,'tailLens',.005);
   cyl('fuel-cap',.065,.016,s*1.013,.97,2.05,'chrome');
  }
  rounded('grille',1.17,.33,.075,0,.999,-2.68,'rubber',.012);for(let j=0;j<10;j++)box('grille',1.17,.010,.02,0,.859+j*.031,-2.731,'chrome');for(let j=-7;j<=7;j++)box('grille',.008,.29,.014,j*.075,1.002,-2.744,'chrome');
  for(const z of [-2.73,2.70]){const n=z<0?'front-bumper':'rear-bumper';rounded(n,2.03,.17,.16,0,.665,z,'chrome',.041);for(const s of [-1,1])tube(n,[[s*.80,.665,z],[s*.94,.665,z],[s*1.025,.68,z+(z<0?.14:-.14)],[s*1.018,.69,z+(z<0?.30:-.30)]],.073,'chrome',12);}
  for(const x of [-.30,.30])surfaceStrip('hood',bodyRows,-2.34,-1.04,(_w,u)=>x*(1-.27*u),true,.006);
  const ornamentBase=interp(bodyRows,-2.34)[2];cyl('hood-ornament',.018,.16,0,ornamentBase+.08,-2.34,'chrome','y');torus('hood-ornament',.035,.007,0,ornamentBase+.175,-2.34,'chrome','z',20);
  textBadge('hood','C H R Y S L E R',0,1.17,-2.717,.88);textBadge('trunk','NEW YORKER',0,1.087,2.672,.63);
  mirrors(1.34,-.87,1.035,true);plate('front-bumper',-2.873,.665,'NEW YORK');plate('rear-bumper',2.831,.704,'NEW YORK');
  k.interior({front:.0,rear:1.03,baseY:.77,dash:-.82,width:.84,luxury:true});
 }else{
  skin([[-2.58,.91,.46,1.20],[-2.23,1.035,.45,1.27],[-1.40,1.06,.45,1.38],[-.65,1.06,.46,1.39],[1.60,1.055,.46,1.39],[2.63,.97,.47,1.36]],p=>p.z<-1.30?'hood':p.z>2?'rear-lower':p.x>0?'lower-left':'lower-right','paint',true);
  skin([[-.84,.90,2.05,2.22],[-.57,.98,2.13,2.32],[1.8,.98,2.14,2.34],[2.56,.91,2.04,2.27]],'roof','roofPaint');
  glass('windshield',[[-1.0,1.41,-1.39],[1.0,1.41,-1.39],[.89,2.105,-.82],[-.89,2.105,-.82]],'rubber',.04);wipers(-1.41,1.43,-1.16,1.77);
  for(const s of [-1,1]){
   glass('door-window-'+s,[[s*1.05,1.43,-1.27],[s*1.05,1.43,-.28],[s*.948,2.13,-.28],[s*.91,2.10,-.78]],'rubber');
   tube('pillar-'+s,[[s*1.062,1.37,-.20],[s*.97,2.17,-.20]],.065,'paint',1);
   // Rounded cargo side panels, pressed recess, seams and exposed door hinges.
   rounded('cargo-panel-'+s,.13,.92,2.67,s*.997,1.755,1.08,'paint',.032);
   rounded('cargo-recess-'+s,.018,.58,2.15,s*1.069,1.77,1.13,'roofPaint',.004);
   tube('rain-gutter-'+s,[[s*.977,2.235,-.57],[s*1.015,2.24,.1],[s*1.015,2.24,2.30]],.017,'paint');
   doorSeams(s,1.065,1.38,[-1.30,-.22,.12,1.18,2.38],.54);
   if(s<0){for(const z of [.11,1.18,2.38])tube('cargo-doors',[[s*1.07,1.38,z],[s*1.071,2.13,z]],.006,'seam',1);for(const z of [.14,2.34])for(const y of [1.47,1.99])rounded('hinges',.032,.09,.05,s*1.096,y,z,'chrome',.009);}
   rounded('side-molding-'+s,.048,.11,3.0,s*1.091,.94,.42,'rubber',.01);rounded('running-board-'+s,.32,.09,1.04,s*1.08,.40,-.72,'rubber',.019);
   tube('mirror-'+s,[[s*1.065,1.43,-1.12],[s*1.20,1.51,-1.18],[s*1.23,1.78,-1.18]],.029,'rubber',8);rounded('mirror-'+s,.22,.36,.13,s*1.23,1.70,-1.18,'rubber',.03);rounded('mirror-'+s,.17,.29,.013,s*1.23,1.70,-1.107,'chrome',.003);
   rounded('headlight-'+s,.40,.27,.12,s*.75,1.055,-2.594,'chrome',.024);rounded('headlight-'+s,.33,.20,.033,s*.75,1.055,-2.668,'lens',.008);for(let j=0;j<5;j++)box('headlight-'+s,.008,.165,.006,s*.75-.13+j*.064,1.055,-2.689,'ivory');rounded('indicator-'+s,.39,.075,.05,s*.75,.858,-2.63,'amberLens',.01);
   rounded('tail-light-'+s,.17,.43,.06,s*.906,1.11,2.66,'tailLens',.014);box('tail-light-'+s,.16,.09,.015,s*.906,1.15,2.70,'ivory');
  }
  rounded('rear-doors',1.88,.17,.12,0,1.405,2.57,'paint',.025);rounded('rear-doors',1.88,.14,.12,0,2.105,2.57,'paint',.025);rounded('rear-doors',.11,.69,.12,0,1.78,2.57,'paint',.02);for(const s of [-1,1]){rounded('rear-doors',.13,.69,.12,s*.875,1.78,2.57,'paint',.022);glass('rear-window-'+s,[[s*.08,1.50,2.638],[s*.81,1.50,2.638],[s*.81,2.04,2.612],[s*.08,2.04,2.612]],'rubber',0);}
  tube('rear-doors',[[0,.62,2.647],[0,2.12,2.647]],.009,'seam',1);rounded('rear-handle',.09,.16,.026,.10,1.30,2.66,'rubber',.006);
  rounded('grille',1.08,.41,.10,0,1.055,-2.61,'chrome',.019);rounded('grille',.95,.30,.019,0,1.055,-2.675,'rubber',.004);for(let j=0;j<3;j++)box('grille',.94,.045,.03,0,.953+j*.101,-2.70,'chrome');
  const emblem=k.add('grille',new T.SphereGeometry(1,20,12),'badgeBlue',0,1.059,-2.729);emblem.scale.set(.115,.054,.017);textBadge('grille','Ford',0,1.056,-2.75,.17);
  for(const z of [-2.66,2.66]){rounded(z<0?'front-bumper':'rear-bumper',2.18,.23,.21,0,.619,z,'chrome',.041);box(z<0?'front-bumper':'rear-bumper',1.91,.045,.19,0,.76,z,'rubber');}
  textBadge('rear-doors','E-250',-.55,1.37,2.65,.30);plate('front-bumper',-2.78,.615,'E 250');plate('rear-bumper',2.79,.626,'E 250');
  k.interior({baseY:.91,front:-.53,rear:-.53,dash:-1.17,width:.88,rows:1});box('cargo-floor',1.84,.07,2.77,0,.80,1.08,'rubber');for(let i=-6;i<=6;i++)box('cargo-floor',.018,.02,2.7,i*.13,.847,1.08,'steel');
 }
 box('chassis',1.55,.14,c.rear-c.front+1.1,0,.34,(c.front+c.rear)/2,'steel');
 k.mechanics(c,{engineZ:van?-1.76:suv?-1.27:-1.68,cylinders:suv?6:8});for(const m of k.group('engine').children)m.position.y-=.13;
 for(const s of [-1,1])for(const [end,z]of [['front',c.front],['rear',c.rear]]){
  const n='wheel-'+end+'-'+(s>0?'left':'right');k.wheel(n,s*c.track,c.radius,z,c.radius,van?.28:.25,van?'steel':suv?'alloy':'whitewall');
  if(!suv&&!van){for(const child of [...k.group(n).children])if(child.material===k.materials.black&&child.geometry.type==='CylinderGeometry'&&child.geometry.parameters.radiusTop<c.radius*.1){k.group(n).remove(child);child.geometry.dispose();}cyl(n,c.radius*.63,.033,s*(c.track+.18),c.radius,z,'chrome');cyl(n,c.radius*.24,.025,s*(c.track+.207),c.radius,z,'chrome');torus(n,c.radius*.79,c.radius*.035,s*(c.track+.154),c.radius,z,'ivory');torus(n,c.radius*.61,.008,s*(c.track+.199),c.radius,z,'chrome');torus(n,.072,.007,s*(c.track+.225),c.radius,z,'chrome');}
  const p=[];for(let j=0;j<=36;j++){const a=j*Math.PI/36;p.push([s*(suv?1.003:van?1.074:1.05),c.radius+Math.sin(a)*(c.radius+.078),z+Math.cos(a)*(c.radius+.078)]);}tube('fender-'+end+'-'+s,p,suv?.020:.013,suv||van?'rubber':'chrome',36);
 }
 return k.finish();
}
