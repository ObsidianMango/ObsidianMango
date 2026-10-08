import {detailKit} from './vehicle-detail-kit.js?v=gold-8';
// A reusable sport motorcycle with two actual raycast wheels and a removable rider.
export function buildRacerBike(T){
 const config={id:'racer-bike',name:'Mango RR',bike:true,golden:true,mass:260,power:1800,maxSpeed:48,reverseSpeed:3,radius:.36,track:0,front:-.76,rear:.76,offset:.5,halfWidth:.46,halfLength:1.16,box:[.25,.28,1.02],center:.36,suspension:.22,scoreMultiplier:1};
 const k=detailKit(T),{mat,box,rounded,cyl,torus,tube,loft,capsule,pane}=k;
 mat('paint',0x2c7dd0,.55,.26);mat('orange',0xffa23d,.3,.32);mat('raceSuit',0x1c2b3a,0,.76);mat('visor',0x163b53,.62,.17);mat('helmet',0xe5e7df,.2,.3);
 // Rounded fairing and tank sections surround a visible engine and aluminum frame.
 capsule('fairing',[[-1.05,.05,.04,0,.73],[-.90,.25,.18,0,.77],[-.62,.33,.28,0,.7],[-.27,.31,.31,0,.59],[.03,.21,.18,0,.52]],'paint',20);
 capsule('tank',[[-.50,.1,.1,0,.95],[-.27,.25,.19,0,1.0],[.06,.26,.18,0,.96],[.3,.14,.08,0,.86]],'paint',20);
 cyl('tank',.064,.018,0,1.175,-.1,'trim','y');cyl('tank',.038,.02,0,1.186,-.1,'black','y');
 for(const side of [-1,1]){pane('fairing',[[side*.32,.47,-.65],[side*.33,.85,-.35],[side*.29,.84,.1],[side*.2,.34,.32],[side*.24,.31,-.35]],'paint');tube('frame',[[side*.22,.96,-.49],[side*.25,.67,.03],[side*.16,.47,.37],[side*.13,.58,.74]],.037,'steel',10);for(let i=0;i<4;i++)box('engine',.015,.016,.25,side*.25,.46+i*.055,-.03,'trim');tube('fairing',[[side*.27,.53,-.75],[side*.32,.44,-.28],[side*.23,.41,.20]],.02,'orange');box('fairing',.025,.045,.32,side*.313,.80,-.24,'ivory');}
 rounded('engine',.4,.34,.4,0,.51,.01,'steel',.055);cyl('engine',.13,.04,-.225,.51,.01,'black','x');cyl('engine',.12,.04,.225,.5,.07,'trim','x');
 // Tail, padded split seat, rear light, number plate and exposed swingarm/chain.
 loft('seat',[[.2,.17,.76,.89],[.62,.19,.78,.96],[.99,.1,.8,.9]],'paint');rounded('seat',.35,.09,.45,0,.91,.32,'black',.025);rounded('seat',.26,.07,.24,0,.98,.73,'black',.025);box('seat',.22,.035,.035,0,.84,1.01,'tailLens');k.plate('seat',1.04,.67,'RR',.22);
 for(const side of [-1,1]){tube('swingarm',[[side*.14,.54,.2],[side*.13,.36,.76]],.045,'steel');cyl('swingarm',.027,.20,side*.27,.54,.2,'trim','x');rounded('swingarm',.1,.035,.12,side*.34,.49,.28,'black',.01);}
 cyl('swingarm',.13,.026,-.13,.36,.76,'disc','x');tube('swingarm',[[-.15,.48,.72],[-.16,.53,.24],[-.16,.39,.24],[-.15,.23,.72],[-.15,.48,.72]],.013,'black',18);tube('swingarm',[[0,.55,.43],[0,.89,.29]],.05,'trim');for(let i=0;i<9;i++)torus('swingarm',.067,.008,0,.56+i*.032,.42-i*.013,'orange','y',12);
 tube('exhaust',[[.14,.43,-.14],[.27,.29,.17],[.31,.4,.62]],.034,'steel',12);cyl('exhaust',.095,.38,.32,.46,.65,'black','z');cyl('exhaust',.073,.023,.32,.46,.85,'trim','z');cyl('exhaust',.047,.025,.32,.46,.86,'black','z');
 // Forks, clip-ons, hand controls, twin lamps and curved transparent windscreen.
 for(const side of [-1,1]){tube('fork',[[side*.105,.36,-.76],[side*.105,.88,-.49],[side*.105,1.04,-.43]],.025,'trim',8);tube('fork',[[side*.11,.37,-.76],[side*.11,.63,-.63]],.04,'orange',4);tube('fork',[[side*.08,1.02,-.42],[side*.29,1.01,-.36]],.018,'steel',2);cyl('fork',.025,.16,side*.30,1.015,-.36,'black','x');tube('fork',[[side*.28,1.035,-.32],[side*.39,1.04,-.3]],.009,'trim',2);tube('fairing',[[side*.25,.95,-.67],[side*.37,1.08,-.61]],.012,'black',2);rounded('fairing',.12,.07,.045,side*.38,1.10,-.6,'black',.012);box('fairing',.09,.045,.005,side*.38,1.10,-.574,'trim');k.lamp('fairing',side*.135,.75,-.96,.075);}
 capsule('fairing',[[-.86,.05,.05,0,.96],[-.65,.20,.12,0,1.03],[-.47,.20,.1,0,1.13]],'glassDetail',16);box('fork',.14,.075,.015,0,1.02,-.40,'gauge',-.35);box('fork',.09,.04,.016,0,1.025,-.388,'lens',-.35);
 // Smooth round tires, twin drilled rotors, five-spoke rims and asymmetric calipers.
 for(const [name,z]of [['wheel-front',config.front],['wheel-rear',config.rear]]){cyl(name,.305,.17,0,.36,z,'tire','x');torus(name,.285,.075,0,.36,z,'tire','x',32);for(const side of [-1,1]){torus(name,.245,.018,side*.071,.36,z,'trim','x',24);cyl(name,.20,.012,side*.093,.36,z,'disc','x');for(let i=0;i<16;i++){const a=i*Math.PI/8;cyl(name,.009,.013,side*.101,.36+Math.sin(a)*.16,z+Math.cos(a)*.16,'black','x',.009,6);}for(let i=0;i<5;i++){const a=i*Math.PI*2/5;tube(name,[[side*.065,.36,z],[side*.075,.36+Math.sin(a)*.24,z+Math.cos(a)*.24]],.014,'black',1);}box(name,.045,.09,.06,side*.11,.46,z+.15,'caliper');}cyl(name,.043,.27,0,.36,z,'trim','x');for(let i=0;i<36;i++){const a=i*Math.PI/18;box(name,.13,.008,.025,0,.36+Math.cos(a)*.358,z+Math.sin(a)*.358,'tread',a,.3);}}
 // Bent knees and elbows, gloved grips and a full-face helmet; hidden when parked / first person.
 capsule('rider',[[.03,.04,.04,0,1.18],[.18,.18,.18,0,1.17],[.40,.17,.19,0,1.04]],'raceSuit',16);
 for(const side of [-1,1]){tube('rider',[[side*.14,1.02,.35],[side*.28,.80,-.04],[side*.24,.49,.26]],.07,'raceSuit',8);tube('rider',[[side*.15,1.29,.13],[side*.28,1.13,-.13],[side*.30,1.03,-.37]],.06,'raceSuit',8);rounded('rider',.1,.09,.21,side*.25,.46,.24,'black',.03);rounded('rider',.085,.085,.12,side*.3,1.025,-.37,'black',.02);box('rider',.09,.025,.035,side*.16,1.31,.1,'orange');}
 const helmet=k.add('rider',new T.SphereGeometry(.19,20,12),'helmet',0,1.44,-.12);helmet.scale.set(1,1.04,1.14);capsule('rider',[[-.33,.07,.05,0,1.45],[-.30,.15,.08,0,1.45],[-.23,.18,.08,0,1.45]],'visor',16);box('rider',.06,.025,.035,0,1.61,-.11,'orange');
 const asset=k.finish();asset.config=config;asset.root.userData.bike=true;asset.root.userData.driverSide='center';asset.root.userData.steeringX=0;
 for(const part of asset.assemblies)if(part.name.startsWith('wheel-')){const target=new T.Vector3(0,.36,part.name==='wheel-front'?config.front:config.rear),delta=part.position.clone().sub(target);for(const m of part.children)m.geometry.translate(delta.x,delta.y,delta.z);part.position.copy(target);part.userData.home.copy(target);}
 asset.root.getObjectByName('rider').visible=false;return asset;
}
