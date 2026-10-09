import {buildReferenceVehicle} from './reference-vehicles.js?v=mango-3';
import {detailKit} from './vehicle-detail-kit.js?v=mango-3';
import {buildNova} from './nova-model.js?v=nova-1';
import {buildFleetVehicle} from './fleet-models.js?v=mango-3';
import {buildWienermobile} from './wienermobile-model.js?v=mango-3';

export function buildDetailedVehicle(T,c){
 if(['montecarlo','suburban','impala','colorado'].includes(c.id))return buildReferenceVehicle(T,c);
 if(['santafe','newyorker','e250'].includes(c.id))return buildFleetVehicle(T,c);
 if(c.id==='wiener')return buildWienermobile(T,c);
 const coupe=c.id==='nova',k=detailKit(T,coupe?buildNova(T):null);
 const {mat,box,rounded,cyl,torus,tube,pane,loft,capsule,arch,wing,lamp,plate}=k;
 const worn=c.id==='jalopy',may=c.id==='maybach',hot=c.id==='wiener',suv=c.id==='santafe';
 mat('paint',suv?0x7d858c:worn?0x6c877f:may?0x211f27:0xc3422b,suv?.32:.16,.34);
 mat('accent',may?0x622e37:worn?0xaa9e7f:0xeee1ba,.13,.48);mat('rust',0x85452f,.02,.91);mat('rubberTrim',0x242b2e,.02,.85);
 if(coupe)buildCoupe();else if(suv)buildSantaFe();else if(worn)buildJalopy();else if(may)buildMaybach();else if(hot)buildWiener();
 for(const side of [-1,1])for(const [end,z]of [['front',c.front],['rear',c.rear]])k.wheel('wheel-'+end+'-'+(side>0?'left':'right'),side*c.track,c.radius,z,c.radius,may?.24:coupe&&end==='rear'?.33:.27,may?'wire':hot?'whitewall':worn?'steel':'alloy');
 k.mechanics(c,{engineZ:may?-1.52:hot?-1.65:-1.27,cylinders:may?12:suv?6:8});
 if(worn||hot||coupe)for(const mesh of k.group('engine').children){
  mesh.position.y-=coupe?.14:hot?.38:.23;
  if(hot)mesh.position.z+=.08;
 }
 if(coupe)k.interior({baseY:.76,front:.10,rear:.83,dash:-.63,width:.76});
 if(suv)k.interior({baseY:.79,front:.04,rear:1.04,dash:-.67,width:.82});
 if(worn)k.interior({baseY:.72,front:-.05,rear:.81,dash:-.77,width:.77});
 if(may)k.interior({baseY:.81,front:.17,rear:1.20,dash:-.57,width:.76,luxury:true});
 if(hot){
  k.interior({baseY:.64,front:-1.58,rear:-1.58,dash:-2.03,width:.50,rows:1});
  const cabin=k.groups.get('cabin');
  if(cabin)for(const mesh of cabin.children){mesh.position.y-=.06;mesh.position.z+=.03;}
 }
 // Front and rear fenders have full inward returns rather than thin cut-out plates.
 if(suv||worn)for(const side of [-1,1])for(const end of ['front','rear'])for(const mesh of k.group('fender-'+end+'-'+side).children){if(mesh.material!==k.materials.paint&&mesh.material!==k.materials.rust)continue;const pos=mesh.geometry.attributes.position,inner=suv?.90:.87;for(let i=0;i<pos.count;i++){const depth=Math.abs(pos.getX(i))-inner;pos.setX(i,side*(inner-.18+depth*2.5));}pos.needsUpdate=true;mesh.geometry.computeVertexNormals();}
 return k.finish();

 function windowFrame(n,p,paint='trim',radius=.022){pane(n,p);for(let i=0;i<p.length;i++)tube(n,[p[i],p[(i+1)%p.length]],radius,paint,1);}
 function wipers(n,zBottom,yBottom,zTop,yTop,width){for(const x of [-width*.43,width*.43]){tube(n,[[x-.08,yBottom,zBottom],[x+.12,yBottom+.05,zBottom-.025]],.012,'rubberTrim',1);tube(n,[[x-.05,yBottom+.045,zBottom-.023],[x+.29,yBottom+.055,zBottom-.028]],.014,'black',1);}}
 function doorDetail(n,side,z0,z1,width,top,bottom=.56,paint='paint'){
  // Solid door skin, inset panel seams and rocker trim.
  const mid=(z0+z1)/2;loft(n,[[z0,.041,bottom,top],[mid,.053,bottom,top+.012],[z1,.041,bottom,top]],paint).position.x=side*(width-.035);
  const seam=[[side*(width+.019),bottom+.03,z0+.025],[side*(width+.019),top-.015,z0+.025],[side*(width+.019),top-.015,z1-.025],[side*(width+.019),bottom+.03,z1-.025]];for(let i=0;i<seam.length-1;i++)tube(n,[seam[i],seam[i+1]],.006,'rubberTrim',1);
  rounded(n,.042,.042,.18,side*(width+.043),top-.11,z1-.18,'trim',.009);box(n,.045,.06,z1-z0-.03,side*(width+.022),bottom+.035,mid,'rubberTrim');
 }
 function buildCoupe(){
  // Keep the reference paint surfaces, replace the rough greenhouse and mechanical parts.
  k.materials.glass.opacity=.42;k.materials.glass.depthWrite=false;k.materials.glass.metalness=.16;
  k.remove('tub');loft('tub',[[-2.05,.72,.46,.61],[-.78,.86,.46,.62],[1.09,.85,.46,.62],[2.04,.68,.49,.65]],'blue');
  // Rebuild opaque body skins with actual wheel openings; flame decals sit on that same surface.
  const rings=[[-2.08,.82,.72,.53,.86],[-1.55,.94,.87,.49,.96],[-.78,.98,.91,.49,1.05],[.10,.99,.91,.49,1.10],[1.08,.98,.88,.49,1.06],[1.94,.88,.77,.52,.92],[2.12,.78,.68,.57,.82]];
  for(const side of [-1,1]){
   for(const [n,a,b]of [['fender-front-'+side,-2.08,-.64],['door-'+side,-.64,.72],['quarter-'+side,.72,2.12]]){
    const group=k.group(n);for(const mesh of [...group.children])if(mesh.material===k.materials.sideFlames||(n.startsWith('quarter')&&mesh.material===k.materials.blue)){group.remove(mesh);mesh.geometry.dispose();}
    const v=[],uv=[],idx=[],steps=60;
    for(let j=0;j<=steps;j++){const z=a+(b-a)*j/steps;let ri=0;while(ri<rings.length-2&&rings[ri+1][0]<z)ri++;const r0=rings[ri],r1=rings[ri+1],u=(z-r0[0])/(r1[0]-r0[0]),r=r0.map((q,i)=>q+(r1[i]-q)*u);let bottom=r[3],top=r[4];for(const wz of [c.front,c.rear]){const dz=z-wz;if(Math.abs(dz)<.505)bottom=Math.max(bottom,c.radius+Math.sqrt(.505*.505-dz*dz));}bottom=Math.min(bottom,top-.008);
     for(let row=0;row<3;row++){const y=bottom+(top-bottom)*row/2,h=(y-r[3])/(r[4]-r[3]),x=h<.48?r[1]*(1+.02*h/.48):r[1]*1.02+(r[2]-r[1]*1.02)*(h-.48)/.52;v.push(side*(x+.012),y,z);uv.push((z+2.25)/4.5,(y-.49)/.61);}}
    for(let j=0;j<steps;j++)for(let row=0;row<2;row++){const a=j*3+row;idx.push(a,a+3,a+4,a,a+4,a+1);}const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(v,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(side>0?idx:idx.flatMap((_,i)=>i%3===0?[idx[i],idx[i+2],idx[i+1]]:[]));geo.computeVertexNormals();const paint=k.materials.blue.clone();paint.side=T.DoubleSide;k.add(n,geo,paint);k.add(n,geo.clone(),k.materials.sideFlames);
   }
  }
  k.remove('roof');
  // A shallow curved roof pressing replaces the angular cap, with sealed pillars.
  const roofRows=[];for(let i=0;i<=24;i++){const z=-.45+i*1.29/24,t=i/24,crown=Math.sin(t*Math.PI);roofRows.push([z,.665+.045*crown,1.603+.035*crown,1.65+.046*crown]);}loft('roof',roofRows,'blueDark');
  for(const side of [-1,1]){
   const n='door-'+side;const p=[[side*.913,1.117,-.53],[side*.913,1.117,.63],[side*.695,1.604,.55],[side*.695,1.604,-.38]];
   for(let i=0;i<p.length;i++)tube(n,[p[i],p[(i+1)%p.length]],.015,'trim',1);tube(n,[[side*.913,1.12,.13],[side*.696,1.603,.13]],.015,'trim');
   tube(n,[[side*.994,.57,-.63],[side*.994,1.09,-.63],[side*.994,1.09,.70],[side*.994,.57,.70]],.007,'rubberTrim');
   tube('roof',[[side*.818,1.105,-.75],[side*.671,1.621,-.434]],.029,'blueDark',1);
   tube('roof',[[side*.798,1.105,1.077],[side*.652,1.626,.821]],.038,'blueDark',1);
   const frame=[[side*.823,1.11,-.755],[side*.67,1.62,-.44],[side*.66,1.63,.81],[side*.802,1.11,1.085]];for(let i=0;i<3;i++)tube('roof',[frame[i],frame[i+1]],.024,'trim',1);
   tube('sill-'+side,[[side*.999,.535,-.79],[side*1.011,.535,.90]],.026,'trim');
   // Fuel cap and quarter badges, each retained by the corresponding panel.
   cyl('quarter-'+side,.054,.014,side*1.014,.93,1.15,'trim');
   for(let i=0;i<3;i++)box('fender-front-'+side,.016,.018,.15,side*.969,1.03-i*.04,-.83,'trim');
  }
  wipers('windshield',-.756,1.13,-.44,1.62,.8);
  tube('windshield',[[-.81,1.113,-.758],[.81,1.113,-.758]],.023,'trim');tube('rear-glass',[[-.80,1.113,1.085],[.80,1.113,1.085]],.021,'trim');
  for(const side of [-1,1]){k.remove('headlight-'+side);lamp('headlight-'+side,side*.72,.90,-2.24,.16);rounded('front-bumper',.09,.20,.055,side*.51,.62,-2.33,'rubberTrim',.012);rounded('rear-bumper',.09,.19,.04,side*.52,.61,2.22,'rubberTrim',.012);box('tail-light-'+side,.21,.026,.012,side*.68,.89,2.144,'ivory');}
  for(let i=-5;i<=5;i++)box('grille',.012,.28,.014,i*.12,.83,-2.226,'steel');
  plate('front-bumper',-2.334,.63,c.id==='nova'?'NOVA 12':'FLAME');plate('rear-bumper',2.218,.73,c.id==='nova'?'NOVA 12':'FLAME');
  // Intake butterfly, ribbed scoop mouth, hood pins and individual fasteners.
  for(const x of [-.20,.20]){cyl('scoop',.068,.012,x,1.29,-1.831,'steel','z');tube('scoop',[[x-.057,1.29,-1.84],[x+.057,1.29,-1.84]],.006,'trim',1);}
  for(const x of [-.61,.61]){cyl('bonnet',.025,.011,x,1.066,-1.78,'trim','y');torus('bonnet',.030,.004,x,1.079,-1.78,'trim','y',16);}
  // Window visors and rear parcel shelf are visible through the real glass.
  for(const x of [-.35,.35])rounded('cabin',.29,.035,.17,x,1.51,-.39,'black',.008);
  box('cabin',1.25,.045,.30,0,1.075,.87,'black');
  // Flush wheel-lip trim, door locks and a finished scoop opening.
  for(const side of [-1,1])for(const z of [c.front,c.rear]){const edge=[];for(let i=0;i<=32;i++){const a=Math.PI*i/32;edge.push([side*.989,c.radius+Math.sin(a)*.506,z+Math.cos(a)*.506]);}tube(z<0?'fender-front-'+side:'quarter-'+side,edge,.011,'trim',32);}
  for(const side of [-1,1])cyl('door-'+side,.017,.012,side*1.023,1.013,.49,'trim');
  rounded('scoop',.66,.028,.06,0,1.379,-1.725,'blueDark',.007);for(let i=-4;i<=4;i++)box('scoop',.006,.086,.009,i*.061,1.29,-1.838,'steel');
 }
 function buildSantaFe(){
  box('chassis',1.66,.14,4.05,0,.39,0,'steel');loft('tub',[[-.80,.89,.48,.61],[.70,.95,.48,.61],[1.97,.78,.51,.69]],'paint');
  loft('bonnet',[[-2.24,.77,.94,1.04],[-1.94,.91,1.01,1.15],[-1.25,.98,1.10,1.23],[-.72,.93,1.13,1.25]],'paint');
  for(const side of [-1,1]){
   arch('fender-front-'+side,side,c.front,.41,.46,.90,1.15);arch('fender-rear-'+side,side,c.rear,.41,.46,.90,1.18);
   for(const [label,z0,z1,ta,tb]of [['front',-.78,.37,-.30,.32],['rear',.40,1.18,.38,1.16]]){
    const n='door-'+label+'-'+side;doorDetail(n,side,z0,z1,.963,1.23,.58);windowFrame(n,[[side*.953,1.25,z0+.04],[side*.947,1.25,z1-.035],[side*.791,1.86,tb],[side*.782,1.86,ta]],'rubberTrim',.028);
    tube(n,[[side*.962,1.244,z0+.03],[side*.955,1.244,z1-.015]],.014,'trim');
   }
   windowFrame('quarter-'+side,[[side*.948,1.25,1.22],[side*.874,1.24,1.98],[side*.713,1.77,1.61],[side*.781,1.86,1.20]],'paint',.039);
   tube('sill-'+side,[[side*.99,.54,-.89],[side*1.002,.54,.86]],.047,'rubberTrim');tube('sill-'+side,[[side*1.01,.58,-.84],[side*1.01,.58,.85]],.013,'trim');
   rounded('mirror-'+side,.23,.14,.22,side*1.095,1.31,-.59,'paint',.035);rounded('mirror-'+side,.18,.095,.014,side*1.10,1.31,-.469,'trim',.02);box('mirror-'+side,.018,.018,.14,side*1.214,1.32,-.60,'lens');tube('mirror-'+side,[[side*.95,1.27,-.63],[side*1.08,1.30,-.60]],.038,'rubberTrim');
   // Sculpted swept headlamp pods with separate projector lenses and LED strips.
   rounded('headlight-'+side,.42,.17,.15,side*.75,1.063,-2.137,'black',.037,0,-side*.23,side*.12);for(let i=0;i<2;i++){cyl('headlight-'+side,.043,.013,side*(.64+i*.15),1.065,-2.215,'trim','z');cyl('headlight-'+side,.032,.014,side*(.64+i*.15),1.065,-2.225,'lens','z');}
   tube('headlight-'+side,[[side*.52,1.01,-2.253],[side*.73,1.015,-2.253],[side*.95,1.11,-2.157]],.014,'lens');
   rounded('fog-'+side,.31,.19,.09,side*.74,.65,-2.235,'rubberTrim',.035);lamp('fog-'+side,side*.74,.65,-2.29,.047);
   rounded('tail-light-'+side,.42,.16,.07,side*.69,1.12,2.139,'tailLens',.026,0,-side*.18,side*-.12);for(let i=0;i<3;i++)tube('tail-light-'+side,[[side*.51,1.09+i*.025,2.184],[side*.85,1.11+i*.025,2.122]],.009,'tailLens');box('tail-light-'+side,.21,.025,.075,side*.68,1.137,2.167,'ivory');
  }
  loft('roof',[[-.34,.79,1.84,1.91],[.36,.85,1.87,1.97],[1.20,.81,1.82,1.93],[1.66,.72,1.73,1.84]],'paint');
  rounded('roof',1.23,.013,.80,0,1.973,.42,'black',.003);for(const side of [-1,1])tube('roof-rack',[[side*.69,1.93,-.22],[side*.70,2.04,-.08],[side*.70,2.03,1.22],[side*.64,1.89,1.52]],.025,'trim');
  windowFrame('windshield',[[-.906,1.25,-.737],[.906,1.25,-.737],[.762,1.852,-.327],[-.762,1.852,-.327]],'paint',.041);wipers('windshield',-.755,1.28,-.33,1.86,.9);
  loft('tailgate',[[1.86,.865,.84,1.23],[2.15,.83,.84,1.21]],'paint');windowFrame('tailgate',[[-.85,1.25,2.11],[.85,1.25,2.11],[.685,1.76,1.66],[-.685,1.76,1.66]],'rubberTrim',.028);
  rounded('roof',1.49,.065,.23,0,1.831,1.70,'paint',.022);
  tube('tailgate',[[-.17,1.32,2.057],[.27,1.38,2.001]],.012,'black');box('tailgate',.63,.025,.022,0,1.08,2.17,'trim');
  loft('grille',[[-2.31,.78,.55,.92],[-2.16,.94,.53,.96]],'paint');pane('grille',[[-.54,.65,-2.332],[.54,.65,-2.332],[.67,1.013,-2.292],[-.67,1.013,-2.292]],'black');
  for(let i=0;i<4;i++){const y=.70+i*.086,w=.49+i*.045;tube('grille',[[-w,y+.015,-2.346],[-w+.10,y,-2.36],[w-.10,y,-2.36],[w,y+.015,-2.346]],.022,'trim');}
  torus('grille',.083,.009,0,.945,-2.369,'trim','z');tube('grille',[[-.05,.913,-2.374],[.05,.972,-2.374]],.009,'trim',1);
  loft('front-bumper',[[-2.30,.86,.43,.56],[-2.10,.94,.43,.58]],'rubberTrim');rounded('front-bumper',1.19,.068,.10,0,.455,-2.28,'trim',.014);
  loft('rear-bumper',[[1.88,.93,.45,.84],[2.23,.86,.45,.83]],'rubberTrim');rounded('rear-bumper',1.24,.065,.09,0,.47,2.23,'trim',.014);
  plate('grille',-2.374,.60,'SANTA FE');plate('tailgate',2.186,.98,'SANTA FE');
 }
 function buildJalopy(){
  // A complete, battered sedan: curved steel panels, cracked glass and mismatched repairs.
  const cv=document.createElement('canvas');cv.width=512;cv.height=256;const ctx=cv.getContext('2d');ctx.fillStyle='#72847a';ctx.fillRect(0,0,512,256);let seed=79;const rand=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);for(let i=0;i<430;i++){const x=rand()*512,y=rand()*256,r=rand()*16+1;ctx.fillStyle=['#81482f','#a66f45','#4b5d56','#a4a08a'][i%4];ctx.globalAlpha=.15+rand()*.45;ctx.beginPath();ctx.ellipse(x,y,r,rand()*r+1,rand()*6,0,Math.PI*2);ctx.fill();}const tx=new T.CanvasTexture(cv);tx.colorSpace=T.SRGBColorSpace;k.materials.paint.map=tx;k.materials.paint.color.setHex(0xc5c8bf);k.materials.paint.roughness=.86;
  box('chassis',1.65,.15,4.04,0,.37,0,'rust');loft('tub',[[-.92,.83,.44,.59],[.30,.89,.45,.59],[1.1,.83,.46,.59]],'paint');
  loft('bonnet',[[-2.13,.82,.86,.98],[-1.55,.94,.92,1.05],[-.87,.87,1.01,1.10]],'rust');loft('trunk',[[1.06,.87,.88,1.08],[1.74,.90,.86,1.06],[2.15,.80,.76,.96]],'paint');
  for(const side of [-1,1]){
   arch('fender-front-'+side,side,c.front,.38,.44,.87,1.02,side<0?'rust':'paint');arch('fender-rear-'+side,side,c.rear,.38,.44,.87,1.04,'paint');
   for(const [label,a,b,ta,tb]of [['front',-.85,.17,-.61,.13],['rear',.20,1.07,.21,.83]]){const n='door-'+label+'-'+side;doorDetail(n,side,a,b,.933,1.10,.54,side===1&&label==='front'?'accent':'paint');windowFrame(n,[[side*.922,1.12,a+.025],[side*.922,1.12,b-.02],[side*.724,1.59,tb],[side*.724,1.59,ta]],'trim',.019);}
   tube('sill-'+side,[[side*.966,.53,-.78],[side*.972,.51,.82]],.034,'rust');rounded('mirror-'+side,.16,.12,.18,side*1.02,1.18,-.77,'rust',.024);box('mirror-'+side,.12,.08,.009,side*1.02,1.18,-.673,'trim');
   lamp('headlight-'+side,side*.64,.86,-2.193,.14);if(side<0){cyl('headlight-'+side,.112,.008,side*.64,.86,-2.23,'black','z');tube('headlight-'+side,[[side*.72,.79,-2.244],[side*.57,.92,-2.244]],.015,'steel',1);}
   rounded('tail-light-'+side,.30,.14,.06,side*.65,.91,2.158,'tailLens',.012);box('tail-light-'+side,.085,.08,.01,side*.69,.91,2.195,'ivory');
  }
  loft('roof',[[-.68,.72,1.58,1.65],[-.51,.78,1.61,1.70],[.79,.77,1.59,1.68],[.99,.70,1.54,1.61]],'accent');
  windowFrame('windshield',[[-.85,1.12,-.90],[.85,1.12,-.90],[.70,1.60,-.67],[-.70,1.60,-.67]],'trim');windowFrame('rear-glass',[[-.84,1.12,1.13],[.84,1.12,1.13],[.70,1.58,.96],[-.70,1.58,.96]],'trim');
  for(const pts of [[[-.40,1.17,-.89],[-.14,1.34,-.81],[.01,1.29,-.83],[.16,1.58,-.69]],[[-.14,1.34,-.81],[-.29,1.50,-.737]],[[-.14,1.34,-.81],[.28,1.39,-.786]]])tube('windshield',pts,.0045,'ivory');wipers('windshield',-.91,1.14,-.67,1.6,.8);
  rounded('grille',1.77,.27,.09,0,.83,-2.16,'black',.022);for(let i=-6;i<=6;i++)box('grille',.038,.18,.019,i*.09,.83,-2.222,'steel',0,0,i%3*.04);
  rounded('front-bumper',1.91,.12,.17,0,.58,-2.20,'steel',.024,0,.035,-.017);rounded('rear-bumper',1.93,.11,.15,0,.57,2.21,'rust',.024,0,-.02,.023);
  rounded('tail',1.65,.27,.10,0,.76,2.11,'paint',.03);
  // Bolted repair plates and loose exhaust, rather than a uniform rust-colored box.
  for(const side of [-1,1]){box('door-rear-'+side,.013,.16,.29,side*.97,.75,.61,'rust',0,0,.03);for(const z of [.50,.72])for(const y of [.70,.80])cyl('door-rear-'+side,.008,.017,side*.98,y,z,'trim');}
  for(const x of [-.40,.41]){tube('bonnet',[[x,.993,-1.98],[x+.02,1.096,-.98]],.011,'steel');}
  plate('front-bumper',-2.30,.63,'NO STOP');plate('rear-bumper',2.302,.70,'NO STOP');
 }
 function buildMaybach(){
  box('chassis',1.45,.17,5.1,0,.38,0,'steel');loft('tub',[[-.77,.78,.54,.65],[.6,.85,.54,.65],[1.98,.79,.54,.65],[2.42,.67,.58,.91]],'accent');
  for(const side of [-1,1]){
   const n='bonnet-'+(side<0?'left':'right');loft(n,[[-2.61,.38,.87,1.40],[-1.98,.40,.87,1.46],[-.70,.43,.89,1.46]],'paint').position.x=side*.39;
   for(let i=0;i<14;i++){const z=-2.33+i*.103;box(n,.012,.22,.028,side*.801,1.14,z,'black',0,0,-side*.12);tube(n,[[side*.810,1.03,z],[side*.810,1.26,z]],.007,'trim',1);}
   wing('fender-front-'+side,side,c.front,.61,.91,'paint');wing('fender-rear-'+side,side,c.rear,.62,.91,'paint');
   loft('running-board-'+side,[[-1.28,.17,.47,.56],[.0,.20,.47,.55],[1.21,.19,.48,.56]],'black').position.x=side*.94;
   for(let j=0;j<4;j++)tube('running-board-'+side,[[side*(.81+j*.075),.563,-1.18],[side*(.81+j*.075),.563,1.14]],.009,'trim',1);
   for(const [label,z0,z1]of [['front',-.64,.45],['rear',.48,1.49]]){const n='door-'+label+'-'+side;doorDetail(n,side,z0,z1,.845,1.36,.66,'accent');windowFrame(n,[[side*.846,1.395,z0+.05],[side*.846,1.395,z1-.045],[side*.721,1.939,z1-.055],[side*.721,1.939,z0+.10]],'trim',.022);box(n,.045,.056,.04,side*.886,.90,z0+.03,'trim');}
   windowFrame('quarter-'+side,[[side*.84,1.40,1.54],[side*.79,1.38,2.05],[side*.69,1.90,1.89],[side*.717,1.94,1.54]],'paint',.032);
   k.wheel('spare-'+side,side*.94,1.09,-.69,.34,.13,'wire');tube('spare-'+side,[[side*.83,.70,-.70],[side*1.02,1.10,-.70]],.035,'trim',1);
   lamp('headlight-'+side,side*.72,1.13,-2.53,.20);tube('headlight-'+side,[[side*.48,.83,-2.42],[side*.70,1.02,-2.47]],.027,'trim');lamp('fog-'+side,side*.46,.74,-2.70,.09);
   rounded('mirror-'+side,.15,.15,.08,side*.99,1.54,-.52,'trim',.027);tube('mirror-'+side,[[side*.82,1.42,-.58],[side*.99,1.52,-.54]],.017,'trim');
   cyl('tail-light-'+side,.085,.06,side*.69,.96,2.52,'tailLens','z');torus('tail-light-'+side,.087,.012,side*.69,.96,2.556,'trim','z');
  }
  loft('roof',[[-.63,.71,1.93,2.03],[-.38,.77,1.96,2.12],[1.56,.76,1.96,2.12],[1.99,.66,1.85,2.02]],'paint');rounded('roof',1.25,.026,1.82,0,2.124,.64,'rubberTrim',.008);
  windowFrame('windshield',[[-.78,1.43,-.751],[.78,1.43,-.751],[.679,1.95,-.579],[-.679,1.95,-.579]],'trim',.031);tube('windshield',[[0,1.43,-.77],[0,1.95,-.59]],.015,'trim');wipers('windshield',-.77,1.47,-.58,1.95,.78);
  windowFrame('rear-glass',[[-.74,1.39,2.07],[.74,1.39,2.07],[.635,1.87,1.89],[-.635,1.87,1.89]],'trim');
  rounded('grille',.93,1.05,.17,0,1.02,-2.66,'trim',.072);rounded('grille',.78,.91,.025,0,1.02,-2.76,'black',.008);for(let i=-10;i<=10;i++)box('grille',.012,.80,.018,i*.034,1.02,-2.782,'trim');
  tube('bonnet-left',[[0,1.43,-2.58],[0,1.48,-.76]],.014,'trim',1);cyl('grille',.035,.095,0,1.60,-2.64,'trim','y');torus('grille',.061,.009,0,1.68,-2.64,'trim','z',20);tube('grille',[[-.05,1.68,-2.64],[0,1.72,-2.64],[.05,1.68,-2.64]],.009,'trim');
  rounded('tail',1.52,.45,.68,0,.96,2.21,'paint',.075);rounded('luggage',1.22,.27,.42,0,1.34,2.05,'leatherDetail',.045);for(const x of [-.41,.41])box('luggage',.055,.28,.425,x,1.34,2.05,'black');
  for(const z of [-2.74,2.61])for(const y of [.53,.63])tube(z<0?'front-bumper':'rear-bumper',[[-.96,y,z+.03],[0,y,z+(z<0?-.08:.08)],[.96,y,z+.03]],.03,'trim');plate('grille',-2.828,.68,'ZEPPELIN',.48);plate('rear-bumper',2.70,.71,'V12 1930',.48);
 }
}
