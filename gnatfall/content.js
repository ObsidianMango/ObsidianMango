'use strict';
window.GNAT = window.GNAT || {};
((G)=>{
const C={wall:[.37,.47,.43],floor:[.21,.29,.27],wood:[.39,.27,.16],ivory:[.77,.81,.65],metal:[.35,.48,.48],dark:[.09,.14,.14],leaf:[.28,.55,.19],soil:[.22,.13,.08],orange:[.95,.35,.12],lime:[.72,.9,.38],glass:[.25,.54,.56],red:[.7,.18,.12],blue:[.19,.4,.58],gold:[.93,.67,.18]};
G.COLORS=C;
G.SPECIES=[
 {name:'Gnat',plural:'GNATS',hp:.8,speed:1.1,points:60,color:[.65,.78,.34],behavior:'swarm',damage:4,description:'Hovers in clouds near wet drains. Weak alone, irritating in a crowd. Broad flame sweeps work best.'},
 {name:'Fruit fly',plural:'FRUIT FLIES',hp:1.1,speed:1.55,points:85,color:[.84,.45,.18],behavior:'dodge',damage:5,description:'Clusters around food and dodges an active burner. Cut off its escape with a wide sweep or lure it to a trap.'},
 {name:'Mosquito',plural:'MOSQUITOES',hp:1.35,speed:1.65,points:110,color:[.58,.38,.65],behavior:'dive',damage:9,description:'Circles, then dives toward you. Keep moving sideways and burn it during the approach.'},
 {name:'Housefly',plural:'HOUSEFLIES',hp:2.1,speed:1.9,points:140,color:[.25,.57,.54],behavior:'land',damage:7,description:'Alternates erratic flights with short landings. A precision torch makes short work of its tougher body.'},
 {name:'Moth',plural:'MOTHS',hp:1.8,speed:1.25,points:125,color:[.66,.59,.38],behavior:'light',damage:5,description:'Large wings, looping flight, and a fatal attraction to light. Working zappers are especially effective.'},
 {name:'Wasp',plural:'WASPS',hp:3.3,speed:2.15,points:200,color:[.95,.65,.13],behavior:'strafe',damage:12,description:'Strafes between attacks and spits stinging projectiles. Watch the orange trails and save a firebomb for groups.'}
];
G.WEAPONS=[
 {name:'SWEEP',label:'WIDE BURNER',range:6.8,cone:.24,damage:3.5,fuel:6.3,heat:23,unlock:0,description:'Wide flame. Excellent against swarms.'},
 {name:'TORCH',label:'PRECISION TORCH',range:10,cone:.10,damage:7,fuel:7.8,heat:31,unlock:1,description:'Long reach and high damage. Narrow aim.'},
 {name:'BURST',label:'PRESSURE BURST',range:8,cone:.16,damage:0,fuel:5,heat:18,unlock:2,description:'A fireball that bursts on impact. Tap or hold.'}
];
G.UPGRADES=[
 {id:'power',name:'HOTTER BURN',desc:'+18% flame and firebomb damage per tier.',base:140},
 {id:'cool',name:'COOLING JACKET',desc:'Faster cooling and less heat buildup.',base:120},
 {id:'tank',name:'BIG TANK',desc:'+25 fuel capacity per tier.',base:100},
 {id:'range',name:'LONG NOZZLE',desc:'+1 metre of flame reach per tier.',base:120},
 {id:'armor',name:'WORKWEAR',desc:'15% less incoming damage per tier.',base:130}
];
G.MISSIONS=[
 {title:'THE MIDNIGHT KITCHEN',short:'KITCHEN',tag:'01 / THE FIRST SHIFT',summary:'The sink is humming. So is the bin. Find both breeding sites before the whole kitchen takes flight.',kind:'kitchen',w:18,h:15,par:230,reward:220,types:[0],initial:10,nests:2,secrets:2,fog:[.055,.09,.075],wall:C.wall,floor:C.floor,start:[9,12],exit:[9,12],station:[11,12],targets:[[3,3],[14,5]],caches:[[3,10],[14,10]],lamps:[[4,3],[13,9]]},
 {title:'PANTRY AFTER DARK',short:'PANTRY',tag:'02 / SOMETHING IN THE CEREAL',summary:'A maze of shelves, spoiled fruit, and winged freeloaders. Open the stockroom and destroy the contaminated stores.',kind:'pantry',w:20,h:17,par:280,reward:290,types:[1,0,4],initial:13,nests:3,secrets:2,fog:[.075,.06,.04],wall:[.43,.35,.24],floor:[.29,.25,.17],start:[10,14],exit:[10,14],station:[12,14],targets:[[3,3],[16,4],[4,12]],caches:[[15,12],[9,3]],lamps:[[4,6],[15,9]]},
 {title:'THE GLASSHOUSE',short:'GREENHOUSE',tag:'03 / WATER, WATER EVERYWHERE',summary:'Standing water has become a mosquito nursery. Follow the greenhouse aisles, drain the breeding pools, and stop the dives.',kind:'greenhouse',w:22,h:18,par:320,reward:360,types:[2,0,1],initial:15,nests:3,secrets:3,fog:[.04,.10,.085],wall:[.2,.43,.4],floor:[.22,.29,.17],start:[11,15],exit:[11,15],station:[13,15],targets:[[4,3],[17,4],[5,12]],caches:[[3,8],[18,12],[11,3]],lamps:[[5,5],[16,11]]},
 {title:'TRASH NIGHT',short:'SERVICE YARD',tag:'04 / TAKING OUT THE TRASH',summary:'The loading yard is alive with houseflies. Red drums make a useful shortcut—if you give them enough room.',kind:'yard',w:22,h:18,par:330,reward:430,types:[3,1,2],initial:16,nests:3,secrets:3,fog:[.045,.065,.09],wall:[.3,.35,.38],floor:[.23,.26,.27],start:[11,15],exit:[11,15],station:[13,15],targets:[[4,3],[18,5],[5,13]],caches:[[3,8],[17,13],[11,3]],lamps:[[5,7],[16,9]]},
 {title:'SOMETHING IN THE RAFTERS',short:'ATTIC',tag:'05 / PLEASE MIND YOUR HEAD',summary:'Old trunks. Thick beams. A concerning amount of fluttering. Restore the bug zappers and burn the nests among the rafters.',kind:'attic',w:22,h:18,par:360,reward:500,types:[4,5,3],initial:17,nests:4,secrets:3,fog:[.065,.045,.035],wall:[.4,.26,.16],floor:[.34,.23,.14],start:[11,15],exit:[11,15],station:[13,15],targets:[[3,3],[18,4],[4,12],[16,11]],caches:[[3,8],[18,14],[11,3]],lamps:[[5,6],[16,8]]},
 {title:'THE ROOFTOP QUEEN',short:'ROOFTOP',tag:'06 / MANAGEMENT HAS ARRIVED',summary:'The colony ends here. Destroy the satellite nests to draw out the queen, then put an end to the infestation.',kind:'roof',w:24,h:20,par:430,reward:700,types:[5,2,4],initial:14,nests:3,secrets:3,boss:true,fog:[.035,.055,.09],wall:[.27,.33,.4],floor:[.19,.23,.29],start:[12,17],exit:[12,17],station:[14,17],targets:[[4,4],[19,5],[5,14]],caches:[[3,9],[20,15],[12,3]],lamps:[[6,6],[18,12]]}
];
for(const mission of G.MISSIONS){const x=Math.floor(mission.w*.68);mission.start=[x,mission.h-3];mission.exit=[x,mission.h-3];mission.station=[Math.min(mission.w-3,x+2),mission.h-3];}
const S=1.5;
G.TILE=S;
G.makeLevel=function(index){const m=G.MISSIONS[index],grid=Array.from({length:m.h},(_,z)=>Array.from({length:m.w},(_,x)=>x===0||z===0||x===m.w-1||z===m.h-1?'#':'.'));
const visual=[],solids=[],props=[],doors=[],nests=[],loot=[],lamps=[],zappers=[];
const pos=(x,z)=>({x:(x-m.w/2)*S+S/2,z:(z-m.h/2)*S+S/2});
const part=(x,y,z,w,h,d,color,em=0,type='box',extra={})=>visual.push({x,y,z,w,h,d,color,em,type,...extra});
const solid=(x,y,z,w,h,d)=>solids.push({min:[x,y,z],max:[x+w,y+h,z+d]});
const block=(tx,tz,w=1,h=1.2,d=1,color=C.wood)=>{const p=pos(tx,tz);part(p.x-w/2,0,p.z-d/2,w,h,d,color);solid(p.x-w/2,0,p.z-d/2,w,h,d);return p};
const reserve=new Set();for(const p of [m.start,m.station,...m.targets,...m.caches,...m.lamps])for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++)reserve.add((p[0]+dx)+','+(p[1]+dz));
// Connected rooms with two routes around each major partition.
const px=Math.floor(m.w*.46),pz=Math.floor(m.h*.48),gates=[4,m.h-5];
for(let z=2;z<m.h-2;z++)if(!gates.includes(z))grid[z][px]='#';
for(let x=px+1;x<m.w-2;x++)if(x!==m.w-5)grid[pz][x]='#';
for(const z of gates){const p=pos(px,z),id=doors.length;doors.push({id,x:p.x,y:0,z:p.z,w:.2,h:3.6,d:S,open:0,target:0});grid[z][px]='D'}
{const p=pos(m.w-5,pz),id=doors.length;doors.push({id,x:p.x,y:0,z:p.z,w:S,h:3.6,d:.2,open:0,target:0});grid[pz][m.w-5]='D'}
// Reserve objective positions even when a partition would otherwise cross one.
for(const key of reserve){const [x,z]=key.split(',').map(Number);if(x>0&&x<m.w-1&&z>0&&z<m.h-1&&grid[z][x]==='#')grid[z][x]='.'}
for(let z=0;z<m.h;z++)for(let x=0;x<m.w;x++){const p=pos(x,z);const fc=(x+z)%2?m.floor:m.floor.map(c=>c*.85);part(p.x-S/2,-.13,p.z-S/2,S,.13,S,fc);if(grid[z][x]==='#'){const outdoor=['yard','roof'].includes(m.kind),bh=outdoor&&(x===0||z===0||x===m.w-1||z===m.h-1)?1.5:3.8;part(p.x-S/2,0,p.z-S/2,S,bh,S,m.wall);part(p.x-S/2,.13,p.z-S/2,S,.1,S,m.wall.map(c=>c*.55));solid(p.x-S/2,0,p.z-S/2,S,bh,S)}}
if(!['yard','roof'].includes(m.kind))part(-m.w*S/2,3.9,-m.h*S/2,m.w*S,.15,m.h*S,m.wall.map(c=>c*.65));
function shelf(x,z){const p=pos(x,z);for(let y=.2;y<2.9;y+=.8){part(p.x-.6,y,p.z-.5,1.2,.08,1,C.wood);for(let k=0;k<3;k++)part(p.x-.5+k*.36,y+.08,p.z-.3,.24,.35,.4,k%2?C.ivory:C.red)}for(const dx of [-.58,.5])part(p.x+dx,0,p.z-.48,.08,3,1,C.metal);solid(p.x-.6,0,p.z-.5,1.2,3,1)}
function plant(x,z){const p=pos(x,z);part(p.x-.5,0,p.z-.5,1,.6,1,C.wood);part(p.x-.46,.6,p.z-.46,.92,.08,.92,C.soil);for(let k=0;k<3;k++){part(p.x-.25+k*.22,.66,p.z-.1,.08,1.1+(.2*k),.08,C.leaf);part(p.x-.5+k*.22,1.1+k*.15,p.z-.3,.5,.13,.5,C.leaf)}solid(p.x-.5,0,p.z-.5,1,.7,1)}
function counter(x,z){const p=block(x,z,1.4,1.1,1.35,C.wood);part(p.x-.75,1.1,p.z-.72,1.5,.14,1.44,C.ivory);part(p.x-.62,.45,p.z+.66,1.2,.035,.03,C.dark);part(p.x-.15,.76,p.z+.68,.3,.03,.04,C.metal);return p}
function crate(x,z,barrel=false){if(grid[z]?.[x]!=='.'||reserve.has(x+','+z))return;const p=pos(x,z);props.push({id:props.length,x:p.x,y:barrel?.65:.55,z:p.z,r:barrel?.5:.6,hp:barrel?2:1.7,maxHP:2,kind:barrel?'barrel':'crate',alive:true,drop:barrel?null:'supply'})}
for(let z=2;z<m.h-2;z++)for(let x=2;x<m.w-2;x++){if(grid[z][x]!=='.'||reserve.has(x+','+z))continue;const edge=x===2||z===2||x===m.w-3||z===m.h-3;
if(m.kind==='kitchen'){if(edge&&(x+z)%2===0){const p=counter(x,z);if((x+z)%4===0){part(p.x-.3,1.24,p.z-.25,.6,.03,.5,C.metal);part(p.x-.04,1.24,p.z-.25,.08,.5,.08,C.metal);part(p.x-.04,1.7,p.z-.25,.08,.08,.32,C.metal)}else{part(p.x-.3,1.24,p.z-.25,.55,.4,.5,C.ivory);part(p.x-.28,1.4,p.z+.26,.5,.08,.025,C.dark)}}else if(x===4&&z>5&&z<9){counter(x,z)}}
if(m.kind==='pantry'&&x%4===2&&z%3!==0)shelf(x,z);
if(m.kind==='greenhouse'&&x%4===2&&z%3!==0)plant(x,z);
if(m.kind==='yard'&&((x*7+z*3)%17===0))crate(x,z,(x+z)%3===0);
if(m.kind==='attic'&&((x+z*3)%11===0))crate(x,z);
if(m.kind==='roof'&&x%5===2&&z%5===2){const p=block(x,z,1.3,1.35,1.2,C.metal);for(let k=0;k<5;k++)part(p.x-.5,.3+k*.18,p.z+.61,1,.05,.025,C.dark)}
}
// Signature details make each location identifiable at character resolution.
if(m.kind==='kitchen'){let p=pos(14,2);part(p.x-.6,0,p.z-.6,1.2,2.8,1.2,C.ivory);part(p.x-.58,1.8,p.z+.62,1.15,.06,.04,C.dark);part(p.x+.35,.9,p.z+.65,.06,.6,.08,C.metal);solid(p.x-.6,0,p.z-.6,1.2,2.8,1.2);p=pos(5,7);part(p.x-.8,.95,p.z-.7,1.6,.12,1.4,C.wood);for(let k=0;k<4;k++)part(p.x-.68+(k%2)*1.2,0,p.z-.55+Math.floor(k/2)*1,.1,.95,.1,C.wood);solid(p.x-.8,.8,p.z-.7,1.6,.27,1.4)}
if(m.kind==='greenhouse'){for(let z=1;z<m.h-1;z+=3){const p=pos(1,z);part(-m.w*S/2+S,3.45,p.z,.08,.1,(m.h-z-1)*S,C.metal);part(-m.w*S/2+S,3.45,p.z,(m.w-2)*S,.08,.08,C.metal)}for(let x=2;x<m.w-2;x+=4){const p=pos(x,1);part(p.x,1.7,-m.h*S/2+S,.08,1.7,.06,C.glass, .22)}}
if(m.kind==='attic'){for(let z=3;z<m.h-2;z+=4){const p=pos(2,z);part(-m.w*S/2+S,3.1,p.z,(m.w-2)*S,.25,.25,C.wood);for(const x of [2,m.w-3]){const q=pos(x,z);part(q.x-.12,0,q.z-.12,.24,3.3,.24,C.wood);solid(q.x-.12,0,q.z-.12,.24,3.3,.24)}}}
if(['yard','roof'].includes(m.kind)){for(let i=0;i<14;i++){const a=i*Math.PI/7,r=34+(i%3)*4;part(Math.sin(a)*r,-2,Math.cos(a)*r,3,5+(i*7)%11,3,[.09,.13,.18])}for(let i=0;i<3;i++){const p=pos(m.w-3,3+i*4);part(p.x-.6,0,p.z-.7,1.2,2.3,1.4,C.blue);solid(p.x-.6,0,p.z-.7,1.2,2.3,1.4)}}
for(let i=0;i<m.targets.length;i++){const p=pos(...m.targets[i]);nests.push({id:i,x:p.x,y:m.kind==='attic'?2.3:.8,z:p.z,hp:6+index*1.5,maxHP:6+index*1.5,alive:true,spawnIn:13+i*3,kind:m.kind==='greenhouse'?'pool':m.kind==='kitchen'?'drain':'hive'})}
for(let i=0;i<m.caches.length;i++){const p=pos(...m.caches[i]);loot.push({id:loot.length,x:p.x,y:.55,z:p.z,kind:'cache',alive:true})}
for(const coord of m.lamps){const p=pos(...coord);lamps.push({x:p.x,y:3.2,z:p.z});part(p.x-.45,3.25,p.z-.2,.9,.1,.4,C.ivory,1);part(p.x-.02,3.35,p.z-.02,.04,.5,.04,C.dark);zappers.push({x:p.x+S*.7,y:1.9,z:p.z,active:false,cool:0});}
// Two breakables and one explosive in every mission, placed away from objectives.
for(const p of [[m.w-4,m.h-6],[4,6],[m.w-6,3]])crate(...p,p[0]===m.w-4);
for(const c of [[m.w-4,m.h-4],[3,m.h-4]]){const p=pos(...c);if(grid[c[1]][c[0]]!== '#')loot.push({id:loot.length,x:p.x,y:.45,z:p.z,kind:'supply',alive:true})}
const start=pos(...m.start),exit=pos(...m.exit),station=pos(...m.station);
return {index,mission:m,grid,visual,solids,props,doors,nests,loot,lamps,zappers,start:{...start,y:1.65,yaw:0,pitch:0},exit:{...exit,y:.2},station:{...station,y:.6,medUsed:false},pos,bounds:{minX:-m.w*S/2+S,maxX:m.w*S/2-S,minZ:-m.h*S/2+S,maxZ:m.h*S/2-S}};
};
})(window.GNAT);
