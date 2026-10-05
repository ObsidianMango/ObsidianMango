import {detailKit} from './vehicle-detail-kit.js?v=gold-8';

// A dedicated reward vehicle; the player's parking-car selection stays intact.
export function buildMonsterTruck(T){
 const config={id:'monster-gold',baseId:'monster',name:'Golden Monster Truck',golden:true,monster:true,mass:6200,power:16500,maxSpeed:32,reverseSpeed:10,radius:1.18,track:1.75,front:-2.05,rear:2.05,offset:1.73,halfWidth:2.18,halfLength:3.03,box:[1.32,.42,2.65],center:.40,scoreMultiplier:1,suspension:.55};
 const k=detailKit(T),{mat,box,rounded,cyl,torus,tube,pane,loft,lamp}=k;
 mat('paint',0xe9b946,.78,.25);mat('goldLight',0xffdb7d,.65,.29);mat('frame',0x263135,.45,.43);mat('shock',0xd7a02c,.58,.30);mat('rubberTrim',0x152023,.08,.8);
 // Long-travel axles, steering links, four-link suspension and exposed coilovers.
 for(const side of [-1,1]){
  tube('chassis',[[side*.83,1.68,-2.55],[side*.83,1.83,-.85],[side*.83,1.83,.95],[side*.83,1.68,2.6]],.105,'frame');
  for(const z of [-2.05,2.05]){
   tube('suspension',[[side*.55,1.75,z*.38],[side*1.48,1.18,z]],.065,'steel');
   tube('suspension',[[side*.8,1.64,z*.4],[side*1.45,1.12,z+.16]],.05,'steel');
   tube('suspension',[[side*1.09,2.15,z+.1],[side*1.45,1.18,z]],.052,'trim');
   tube('suspension',[[side*1.09,2.15,z-.15],[side*1.45,1.18,z-.22]],.10,'shock');
   const spring=[];for(let i=0;i<=80;i++){const a=i*Math.PI/5,u=i/80;spring.push([side*(1.1+.34*u)+Math.cos(a)*.14,2.1-u*.85,z+.1+Math.sin(a)*.14]);}tube('suspension',spring,.019,'trim',80);
  }
  tube('steps',[[side*1.46,2.02,-1],[side*1.55,1.86,-.7],[side*1.55,1.86,.75],[side*1.46,2.02,.95]],.055,'steel');
 }
 for(const z of [-2.05,2.05]){cyl('drive',.13,3.45,0,1.18,z,'frame');cyl('drive',.33,.52,0,1.18,z,'steel');tube('drive',[[-1.47,1.17,z-.2],[1.47,1.17,z-.2]],.055,'trim');}
 cyl('drive',.07,4.1,0,1.3,0,'trim','z');rounded('chassis',2.1,.20,4.5,0,1.81,0,'frame',.06);
 // Curved pickup body, wheel openings, separate doors and a real open cargo bed.
 loft('bonnet',[[-2.77,1.13,2.03,2.61],[-2.4,1.32,2.12,2.83],[-1.02,1.27,2.19,2.9]],'paint');
 rounded('tub',2.61,.17,2.1,0,2.12,.07,'paint',.06);
 for(const side of [-1,1]){
  const n='door-'+side;rounded(n,.13,.69,1.77,side*1.29,2.52,.02,'paint',.04);
  pane(n,[[side*1.32,2.90,-.85],[side*1.32,2.90,.86],[side*1.1,3.74,.81],[side*1.1,3.74,-.43]]);
  tube(n,[[side*1.32,2.90,-.85],[side*1.1,3.77,-.43],[side*1.1,3.77,.86],[side*1.32,2.90,.89]],.055,'goldLight');
  tube(n,[[side*1.31,2.91,.20],[side*1.13,3.74,.20]],.025,'rubberTrim');
  rounded(n,.035,.065,.26,side*1.38,2.78,.57,'trim',.012);
  tube('mirror-'+side,[[side*1.3,2.91,-.67],[side*1.58,3.02,-.69]],.027,'steel');rounded('mirror-'+side,.29,.23,.17,side*1.66,3.06,-.69,'frame',.04);rounded('mirror-'+side,.24,.17,.018,side*1.66,3.06,-.596,'trim',.01);
  rounded('bed-'+side,.16,.70,1.67,side*1.27,2.55,1.82,'paint',.04);rounded('bed-'+side,.22,.06,1.78,side*1.27,2.94,1.82,'goldLight',.025);
  for(const z of [-2.05,2.05])k.arch('fender-'+side+'-'+z,side,z,1.18,1.29,1.35,2.84,'paint');
 }
 rounded('bed-floor',2.5,.13,1.77,0,2.17,1.78,'frame',.04);for(let x=-1;x<=1;x+=.25)box('bed-floor',.045,.04,1.57,x,2.25,1.78,'steel');rounded('tailgate',2.49,.68,.17,0,2.57,2.67,'paint',.04);rounded('tailgate',.82,.04,.03,0,2.81,2.77,'frame',.01);
 rounded('roof',2.27,.13,1.41,0,3.81,.22,'paint',.055);
 pane('glass',[[-1.29,2.91,-.91],[1.29,2.91,-.91],[1.08,3.75,-.48],[-1.08,3.75,-.48]]);
 pane('rear-glass',[[-1.14,2.96,.96],[1.14,2.96,.96],[1.07,3.73,.90],[-1.07,3.73,.90]]);
 for(const side of [-1,1])tube('glass',[[side*1.31,2.9,-.92],[side*1.1,3.77,-.48]],.045,'goldLight');
 for(const x of [-.42,.42])tube('wipers',[[x-.16,2.95,-.91],[x+.29,3.07,-.85]],.015,'black');
 k.interior({front:0,rear:.4,baseY:2.34,dash:-.64,width:1.02,rows:1});
 for(const side of [-1,1])tube('roll-cage',[[side*1.03,2.17,.88],[side*1.03,3.63,.86],[side*1.03,3.63,-.35],[side*1.15,2.26,-.83]],.05,'frame');tube('roll-cage',[[-1.03,3.63,.85],[1.03,3.63,.85]],.05,'frame');
 // V8, blower, exhaust stacks and a large tubular ram bumper.
 rounded('engine',.95,.43,.91,0,2.52,-1.85,'steel',.06);for(const side of [-1,1]){rounded('engine',.30,.17,1.02,side*.35,2.76,-1.85,'trim',.03);for(let i=0;i<4;i++)tube('engine',[[side*.4,2.7,-2.2+i*.22],[side*.65,2.52,-2.18+i*.22],[side*.72,2.18,-2.1+i*.22]],.035,'trim');tube('exhaust-'+side,[[side*.75,2.14,-1.8],[side*.93,1.95,.95],[side*1.08,2.12,1.1],[side*1.08,3.1,1.1]],.07,'steel');cyl('exhaust-'+side,.086,.05,side*1.08,3.14,1.1,'trim','y');}
 rounded('engine',.61,.28,.7,0,3.02,-1.8,'trim',.045);rounded('engine',.55,.16,.33,0,3.22,-2.08,'frame',.03);for(const x of [-.17,0,.17])cyl('engine',.064,.045,x,3.22,-2.27,'black','z');
 rounded('grille',2.28,.49,.17,0,2.34,-2.8,'frame',.04);for(let i=-5;i<=5;i++)box('grille',.028,.39,.03,i*.145,2.36,-2.902,'trim');
 for(const side of [-1,1]){lamp('headlights',side*.92,2.58,-2.89,.18);rounded('tail-lights',.18,.45,.045,side*1.11,2.62,2.78,'tailLens',.025);}
 for(const y of [1.93,2.42])tube('bullbar',[[-1.48,y,-2.7],[-1.36,y,-3],[1.36,y,-3],[1.48,y,-2.7]],.115,'steel');for(const x of [-.92,.92])tube('bullbar',[[x,1.92,-3],[x,2.83,-2.97],[x,2.86,-2.66]],.09,'trim');
 tube('rear-bumper',[[-1.48,2.01,2.69],[-1.3,1.95,2.88],[1.3,1.95,2.88],[1.48,2.01,2.69]],.10,'steel');
 for(const x of [-.75,-.25,.25,.75])lamp('roof-lights',x,3.99,-.41,.12);for(const x of [-.9,0,.9])rounded('roof-lights',.1,.05,.12,x,3.92,.65,'amberLens',.025);
 k.plate('bullbar',-3.13,2.13,'GOLD RUSH',.63);
 // Deep chevron tread, beadlock rings and visible bolts, merged per wheel.
 for(const side of [-1,1])for(const [end,z]of [['front',config.front],['rear',config.rear]]){
  const n='wheel-'+end+'-'+(side>0?'left':'right'),x=side*config.track,r=config.radius;k.wheel(n,x,r,z,r,.78,'steel');
  for(let i=0;i<32;i++){const a=i*Math.PI/16;for(const lane of [-1,1])box(n,.37,.09,.22,x+lane*.19,r+Math.cos(a)*(r-.025),z+Math.sin(a)*(r-.025),'tread',a,0,lane*.44);}
  const face=x+side*.425;torus(n,r*.63,.055,face,r,z,'goldLight');for(let i=0;i<16;i++){const a=i*Math.PI/8;cyl(n,.025,.045,face+side*.03,r+Math.sin(a)*r*.62,z+Math.cos(a)*r*.62,'trim','x',.025,8);}cyl(n,.17,.12,face+side*.04,r,z,'shock');
 }
 const result=k.finish();result.config=config;result.root.userData.monsterTruck=true;return result;
}
