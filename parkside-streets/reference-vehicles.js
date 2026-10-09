import {detailKit} from './vehicle-detail-kit.js?v=street-27';
// Photo-reference fleet. Each skin has real wheel openings and independent wreck assemblies.
export function buildReferenceVehicle(T,c){
 const k=detailKit(T),{mat,box,rounded,loft,pane,tube,cyl}=k,ss=c.id==='montecarlo',sedan=c.id==='impala',suv=c.id==='suburban',pickup=c.id==='colorado',truck=suv||pickup;
 const color=ss?0x15191e:sedan?0x345768:suv?0x197e7b:0xbf672d,base=truck?.85:.45,belt=truck?1.64:1.08,roof=truck?2.52:1.79,end=c.halfLength-.09,frontCab=truck?-.65:-.7,roofFront=truck?-.3:-.20,roofBack=suv?2.10:pickup?.77:sedan?1.05:.85,backCab=suv?2.45:pickup?.93:sedan?1.68:1.31,w=truck?1.05:1.0;
 mat('paint',color,.48,.3);mat('stripe',ss?0xe45b2e:0x919ca4,.25,.4);mat('cladding',0x333c42,.1,.78);mat('wheelBlack',0x232a30,.3,.5);
 box('chassis',1.75,.16,end*1.8,0,base-.06,0,'steel');
 loft('bonnet',[[-end,.85,base+.38,belt-.17],[-end+.35,w,base+.4,belt-.03],[frontCab,w*.96,belt-.13,belt+.04]],'paint');
 // Curved shoulders and sealed side skins; opening profiles leave tires unobstructed.
 function skin(n,side,a,b){const v=[],idx=[],steps=32;for(let i=0;i<=steps;i++){const z=a+(b-a)*i/steps,tip=Math.max(0,(Math.abs(z)-(end-.4))/.4),width=w-.15*Math.min(1,tip);let low=base;for(const wz of [c.front,c.rear]){const dz=z-wz,r=c.radius+.14;if(Math.abs(dz)<r)low=Math.max(low,c.radius+Math.sqrt(r*r-dz*dz));}const high=belt-(tip*.12);low=Math.min(low,high-.01);for(const [y,x]of [[low,width*.99],[high-.10,width],[high,width*.94]])v.push(side*x,y,z);}for(let i=0;i<steps;i++)for(let j=0;j<2;j++){const a=i*3+j;if(side>0)idx.push(a,a+3,a+4,a,a+4,a+1);else idx.push(a,a+4,a+3,a,a+1,a+4);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(v,3));g.setIndex(idx);g.computeVertexNormals();const material=k.materials.paint;material.side=T.DoubleSide;k.add(n,g,material);}
 for(const side of [-1,1]){
  skin('fender-front-'+side,side,-end,frontCab);skin('door-front-'+side,side,frontCab,ss?.8:.43);skin('quarter-'+side,side,ss?.8:.43,end);
  for(const z of [c.front,c.rear]){const points=[];for(let i=0;i<=20;i++){const a=Math.PI*i/20;points.push([side*(w+.015),c.radius+Math.sin(a)*(c.radius+.145),z+Math.cos(a)*(c.radius+.145)]);}tube('fender-'+z+'-'+side,points,truck?.067:.024,truck?'cladding':ss?'stripe':'trim',20);}
  for(const [name,a,b]of ss?[['front',frontCab,.79]]:[['front',frontCab,.42],['rear',.46,pickup?.88:suv?1.52:1.28]]){
   const n='door-'+name+'-'+side,topA=name==='front'?roofFront:a,topB=name==='rear'&&!suv?Math.min(b,roofBack):b;
   const p=[[side*w*.94,belt+.035,a],[side*w*.94,belt+.035,b],[side*w*.81,roof-.08,topB],[side*w*.81,roof-.08,topA]];pane(n,p);for(let i=0;i<4;i++)tube(n,[p[i],p[(i+1)%4]],.027,truck?'cladding':'trim',1);
   tube(n,[[side*(w+.004),base+.04,a],[side*(w+.004),belt-.04,a]],.008,'black',1);rounded(n,.045,.055,.19,side*(w+.02),belt-.13,b-.17,truck?'cladding':'trim',.01);
  }
  if(suv||ss){const a=ss?.87:1.57,b=ss?1.3:2.4;pane('quarter-'+side,[[side*.93,belt+.05,a],[side*.93,belt+.05,b],[side*.81,roof-.10,ss?1.02:2.12],[side*.81,roof-.10,ss?.86:1.57]]);}
  const endDoor=pickup?.98:suv?2.38:1.4;box('sill-'+side,.08,.16,endDoor-frontCab,side*w,base+.06,(endDoor+frontCab)/2,'cladding');
  if(ss)for(const y of [.58,.615])box('sill-'+side,.018,.016,end*2-.2,side*(w+.03),y,0,'stripe');
  if(sedan)box('sill-'+side,.035,.045,end*2-.24,side*(w+.02),.65,0,'trim');
  rounded('mirror-'+side,.23,.15,.28,side*(w+.13),belt+.18,frontCab+.05,ss?'paint':'cladding',.03);box('mirror-'+side,.18,.11,.018,side*(w+.13),belt+.18,frontCab+.20,'trim');
  box('tail-light-'+side,truck?.17:.32,truck?.56:.21,.09,side*(w-.12),truck?1.27:.95,end+.015,'tailLens');
  if(truck){tube('step-'+side,[[side*1.17,base-.04,frontCab],[side*1.17,base-.04,pickup?.9:1.54]],.07,'cladding',1);for(const z of [c.front,c.rear]){tube('drive',[[side*.58,.52,z],[side*.88,base+.13,z]],.048,'steel',1);}}
 }
 // Distinct greenhouse silhouettes: formal coupe, rounded sedan, long SUV, extended-cab pickup.
 const rows=[];for(let i=0;i<=12;i++){const u=i/12,z=roofFront+(roofBack-roofFront)*u,curve=Math.sin(u*Math.PI);rows.push([z,.81+.025*curve,roof-.04+.02*curve,roof+.035*curve]);}loft('roof',rows,'paint');
 pane('windshield',[[-w*.93,belt+.04,frontCab],[w*.93,belt+.04,frontCab],[.8,roof-.08,roofFront],[-.8,roof-.08,roofFront]]);
 for(const side of [-1,1]){tube('roof',[[side*w*.94,belt,frontCab],[side*.82,roof,roofFront],[side*.82,roof,roofBack],[side*w*.92,belt,backCab]],ss?.042:.033,'paint',4);tube('wipers',[[side*.2,belt+.08,frontCab-.02],[side*.6,belt+.10,frontCab-.015]],.013,'black',1);}
 pane('rear-glass',[[-.81,roof-.07,roofBack],[.81,roof-.07,roofBack],[w*.93,belt+.05,backCab],[-w*.93,belt+.05,backCab]]);
 if(pickup){box('bed-floor',1.85,.1,end-backCab,0,base+.12,(end+backCab)/2,'cladding');for(let i=-5;i<=5;i++)box('bed-floor',.025,.025,end-backCab-.12,i*.15,base+.18,(end+backCab)/2,'steel');for(const side of [-1,1])box('bed-rail-'+side,.14,.11,end-backCab,side*.99,belt,(end+backCab)/2,'cladding');box('tailgate',1.98,.68,.14,0,belt-.35,end,'paint');rounded('tailgate',.32,.08,.025,0,belt-.15,end+.08,'cladding',.01);}
 else if(suv){box('tailgate',1.88,.65,.12,0,1.3,end,'paint');pane('tailgate',[[-.83,1.69,end-.04],[.83,1.69,end-.04],[.79,2.4,roofBack],[-.79,2.4,roofBack]]);}
 else loft('trunk',[[backCab,w*.93,.82,1.12],[end-.18,.94,.74,1.04],[end,.84,.69,.98]],'paint');
 const face=-end-.025;rounded('front-bumper',w*2,.23,.19,0,truck?base+.06:.48,face,truck?'trim':'paint',.04);rounded('rear-bumper',w*2,.22,.19,0,truck?base+.03:.48,end+.02,truck?'trim':'paint',.035);
 box('grille',truck?1.0:.72,truck?.48:.31,.065,0,belt-.32,face-.03,'black');for(let i=-3;i<=3;i++)box('grille',.018,truck?.40:.26,.03,i*.10,belt-.32,face-.075,'steel');for(let j=0;j<3;j++)box('grille',truck?1:.72,.018,.03,0,belt-.47+j*.14,face-.083,'steel');
 for(const side of [-1,1]){if(ss||suv){for(let i=0;i<2;i++){const x=side*(ss?.61:.73)+(ss?(i-.5)*.19:0),y=belt-.25-(suv?i*.25:0);rounded('headlight-'+side,.18+(suv?.15:0),.15,.055,x,y,face-.07,'lens',.012);}}else rounded('headlight-'+side,.61,.17,.06,side*.69,belt-.24,face-.07,'lens',.025);
 box('headlight-'+side,.1,.15,.035,side*.98,belt-.26,face-.06,'amberLens');box('fog-'+side,.25,.1,.06,side*.74,truck?base+.04:.47,face-.12,'lens');}
 if(truck){box('grille',2.04,.065,.08,0,belt-.32,face-.12,'trim');box('grille',.19,.09,.018,0,belt-.31,face-.17,'ivory');box('grille',.30,.035,.018,0,belt-.31,face-.18,'ivory');}
 if(ss){loft('spoiler',[[end-.30,.94,1.07,1.14],[end+.015,.95,1.12,1.20]],'paint');k.plate('rear-bumper',end+.13,.53,'MONTE SS');}
 else k.plate('rear-bumper',end+.14,truck?.93:.55,suv?'SUBURBAN':sedan?'IMPALA SS':'COLORADO');
 k.mechanics(c,{engineZ:truck?-1.38:-1.35,cylinders:pickup?6:8});
 if(truck)for(const n of ['engine','drive'])for(const m of k.group(n).children)m.position.y+=base-.45;
 for(const m of k.group('engine').children)m.position.y-=truck?.20:.26;
 k.interior({baseY:truck?1.05:.72,front:truck?.0:.1,rear:suv?1.1:sedan?.96:.73,dash:frontCab+.04,width:.81,rows:pickup?1:2});
 for(const side of [-1,1])for(const [name,z]of [['front',c.front],['rear',c.rear]]){const n='wheel-'+name+'-'+(side>0?'left':'right');k.wheel(n,side*c.track,c.radius,z,c.radius,truck?.34:.27,'alloy');if(suv)for(const m of k.group(n).children)if(m.material===k.materials.trim)m.material=k.materials.wheelBlack;}
 return k.finish();
}
