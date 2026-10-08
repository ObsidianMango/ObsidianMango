export const UPGRADES=[
 {id:'engine',name:'Engine',prices:[150,350,700],effect:'+15% power per tier'},
 {id:'suspension',name:'Suspension',prices:[125,275,550],effect:'Stronger springs and more travel'},
 {id:'tires',name:'Tires',prices:[100,250,500],effect:'+10% grip per tier'},
 {id:'brakes',name:'Brakes',prices:[100,225,450],effect:'+20% braking · fixes missing brakes'},
 {id:'armor',name:'Armor',prices:[125,300,600],effect:'Reduces impact damage'},
 {id:'ram',name:'Ramming kit',prices:[150,350,650],effect:'Crush walls with held throttle'}
];
export const TOOL_PRICES=[200,450,900];
export const PAINTS=[{id:'factory',name:'Factory',color:null},{id:'red',name:'Cherry',color:0xbf343c},{id:'blue',name:'Ocean',color:0x286fb4},{id:'mint',name:'Mint',color:0x68b99b},{id:'purple',name:'Plum',color:0x754e94},{id:'black',name:'Black',color:0x212a2e},{id:'white',name:'Pearl',color:0xe3e1cc}];
export const vehicleKey=car=>(car.config.baseId||car.config.id).replace(/-gold$/,'');
export function cleanGarage(value){const result={vehicles:{},tools:0};result.tools=tier(value?.tools);for(const [id,r]of Object.entries(value?.vehicles||{}).slice(0,24)){if(!/^[a-z0-9-]{1,40}$/.test(id)||!r||typeof r!=='object')continue;const record={paint:PAINTS.some(p=>p.id===r.paint)?r.paint:'factory'};for(const u of UPGRADES)record[u.id]=tier(r[u.id]);result.vehicles[id]=record;}return result;}
const tier=v=>Math.min(3,Math.max(0,Math.floor(Number(v)||0)));
export function tunedConfig(base,r={}){return {...base,power:base.power*(1+.15*(r.engine||0)),maxSpeed:base.maxSpeed?base.maxSpeed*(1+.05*(r.engine||0)):base.maxSpeed,noBrakes:base.noBrakes&&!r.brakes,gripMultiplier:1+.1*(r.tires||0),brakeMultiplier:1+.2*(r.brakes||0),springMultiplier:1+.1*(r.suspension||0),travelMultiplier:1+.08*(r.suspension||0),armorMultiplier:1+.3*(r.armor||0),ramMultiplier:1+.2*(r.ram||0),ramTier:r.ram||0};}
// Each asset owns at most one replacement per body paint material. Factory,
// glass, lamps, chrome and rubber remain available without making new clones.
const paintCache=new WeakMap();
export function paintVehicle(car,id){let state=paintCache.get(car.root);if(!state){const names=new Set(['paint','roofPaint','cream','blue','blueDark','yellow','orange','accent','rust']);const materials=car.materials||{};const originals=new Set(Object.entries(materials).filter(([key])=>names.has(key)).map(([,m])=>m));const colors=new Set([...originals].map(m=>m.color.getHex()));state=[];const clones=new Map();car.root.traverse(m=>{if(!m.isMesh||Array.isArray(m.material)||m.material.transparent)return;const material=m.material;const eligible=originals.has(material)||material.userData.garagePaint||names.has(material.name)||(!material.map&&colors.has(material.color?.getHex()));if(!eligible)return;if(!clones.has(material)){const clone=material.clone();clone.userData.garageOwned=true;clones.set(material,clone);}state.push({mesh:m,original:material,paint:clones.get(material)});});paintCache.set(car.root,state);}const p=PAINTS.find(p=>p.id===id)||PAINTS[0];for(const s of state){s.mesh.material=p.color===null?s.original:s.paint;if(p.color!==null)s.paint.color.setHex(p.color);}return new Set(state.map(s=>s.paint)).size;}
export function disposeVehiclePaint(root){const state=paintCache.get(root);if(!state)return;for(const m of new Set(state.map(s=>s.paint)))m.dispose();paintCache.delete(root);}
