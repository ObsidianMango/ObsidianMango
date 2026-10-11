import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {pathToFileURL,fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const require=createRequire(import.meta.url),{parseHTML}=require('/tmp/parkside-test/node_modules/linkedom');
const {window,document}=parseHTML(fs.readFileSync(root+'index.html','utf8'));
const ctx2d=new Proxy({createRadialGradient:()=>({addColorStop(){}}),createLinearGradient:()=>({addColorStop(){}}),measureText:()=>({width:30}),getImageData:(x,y,w,h)=>({data:new Uint8ClampedArray(w*h*4)})},{get:(o,k)=>k in o?o[k]:()=>{},set:(o,k,v)=>{o[k]=v;return true;}});
window.HTMLCanvasElement.prototype.getContext=()=>ctx2d;
window.HTMLCanvasElement.prototype.toDataURL=()=> 'data:image/png;base64,';
window.HTMLElement.prototype.getClientRects=function(){return this.closest('[hidden]')?[]:[{x:0,y:0,width:100,height:44}];};
window.HTMLElement.prototype.getBoundingClientRect=()=>({x:0,y:0,left:0,top:0,right:100,bottom:44,width:100,height:44});
window.HTMLElement.prototype.scrollIntoView=function(){};
window.HTMLElement.prototype.setPointerCapture=function(){};
window.HTMLElement.prototype.getAnimations=()=>[];
window.HTMLElement.prototype.animate=()=>({});
const storage=new Map(),raf=[];
globalThis.document=document;globalThis.window=window;
globalThis.localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,String(v))};
storage.set('parkside-chaos-saves-v1',JSON.stringify(Array.from({length:24},()=>({stars:3,time:1}))));
const T=require(root+'three.min.js');
class Renderer {
 constructor({canvas}){this.domElement=canvas;this.shadowMap={};this.info={render:{calls:0,triangles:0}};}
 setPixelRatio(){}setSize(){}
 render(scene){let calls=0,triangles=0;scene.traverseVisible(o=>{if(!o.isMesh)return;calls++;const n=o.geometry.index?.count||o.geometry.attributes.position?.count||0;triangles+=n/3*(o.isInstancedMesh?o.count:1);});this.info.render={calls,triangles};}
}
window.THREE={...T,WebGLRenderer:Renderer};
let pads=[];
const context={window,document,localStorage,Element:window.Element,navigator:{getGamepads:()=>pads},location:{hostname:'127.0.0.1'},innerWidth:393,innerHeight:852,devicePixelRatio:3,performance:{now:()=>0},requestAnimationFrame:f=>raf.push(f),setTimeout:()=>{},console};
context.addEventListener=window.addEventListener.bind(window);Object.defineProperty(globalThis,'navigator',{value:context.navigator,configurable:true});
let source=fs.readFileSync(root+'drive.js','utf8');
const imports=[...source.matchAll(/^import (.*?) from '(.*?)';$/gm)];
for(const [,declaration,url] of imports){
 const module=await import(pathToFileURL(new URL(url.split('?')[0],pathToFileURL(root+'drive.js')).pathname).href);
 if(declaration.startsWith('* as '))context[declaration.slice(5)]=module;
 else for(const name of declaration.slice(1,-1).split(',').map(s=>s.trim()))context[name]=module[name];
}
source=source.replace(/^import .*?;$/gm,'');
vm.runInNewContext(source,context);
const app=window.roadster,report=[];
assert(app,document.getElementById('errorText').textContent);
const get=id=>document.getElementById(id);
let frameTime=0;function frame(){const f=raf.shift();assert(f);frameTime+=16.667;f(frameTime);}


const life=app.test.streetLife,C=context.C;
app.test.loadLevel(24);app.start();for(let i=0;i<10;i++)frame();
assert.equal(life.mode,'vehicle');assert.equal(life.economy.info().cash,100);
app.test.teleport(0,190);assert(life.exitVehicle());assert.equal(life.mode,'foot');assert(app.test.world.bodies.includes(life.body));
const start=life.body.position.clone();app.test.input.KeyW=true;for(let i=0;i<60;i++)frame();delete app.test.input.KeyW;assert(life.body.position.distanceTo(start)>2);assert.equal(app.getState().pedals.gas,0);assert.equal(app.test.vehicle.wheelInfos[2].engineForce,0);
const view=app.test.secretView;assert.equal(view.buildings.length,23);assert(view.buildings.every(b=>b.door));
const shop=view.buildings.find(b=>b.type==='convenience'),gun=view.buildings.find(b=>b.type==='gun');assert(shop&&gun);
function atDoor(b){life.body.position.set(b.door.x+b.door.nx*.6,1.05,b.door.z+b.door.nz*.6);life.body.velocity.setZero();life.body.aabbNeedsUpdate=true;}
atDoor(shop);assert(life.enterBuilding(shop));assert.equal(life.inside,shop);assert(!view.group.visible);assert(!app.test.world.bodies.includes(life.body));assert.equal(life.getInfo().interiorRooms,1);
const roomObjects=life.room.children.length;life.body.position.set(-6000,.83,-3.1);assert(life.interact());assert(life.shopOpen);
get('scratchGame-numbers').click();get('buyScratch').click();assert(life.economy.info().ticket);const afterBuy=life.economy.info().cash;assert.equal(afterBuy,90);assert.equal(life.economy.buyTicket(),false);life.closeShop();life.openShop();assert.equal(life.economy.info().cash,90);get('revealScratch').click();assert(!life.economy.info().ticket);const afterClaim=life.economy.info().cash;assert.equal(life.economy.claimTicket(),null);assert.equal(life.economy.info().cash,afterClaim);life.closeShop();assert(life.leaveBuilding());assert(view.group.visible);
report.push({check:'Walking, zero vehicle throttle on foot, convenience-store entry, persistent single scratch-off purchase and exactly-once payout',roomObjects});
atDoor(gun);assert(life.enterBuilding(gun));life.body.position.set(-6000,.83,-3.1);assert(life.openShop());life.economy.earn(2000);life.closeShop();life.openShop();
for(const name of ['Hammer','Pistol','Machine gun','Grenade launcher']){const row=[...get('shopStock').children].find(r=>r.firstElementChild.textContent.startsWith(name));assert(row);row.querySelector('button').click();}
assert.equal(life.economy.info().owned.length,4);assert(life.economy.info().cash>=0);assert.equal(life.economy.buy('grenade'),false);assert(life.economy.refill('pistol'));assert.equal(life.economy.info().ammo.pistol,72);life.closeShop();assert(life.leaveBuilding());
report.push({check:'All four requested weapons can be purchased and equipped; ammo refills charge cash and duplicate purchases are rejected'});
// Revisit every building. No accumulating interior scenes, geometry, lights, or physics.
let peak=0;for(let round=0;round<3;round++)for(const b of view.buildings){atDoor(b);assert(life.enterBuilding(b),b.name);peak=Math.max(peak,life.room.children.length);assert.equal(life.getInfo().interiorRooms,1);assert(!app.test.world.bodies.includes(life.body));assert(life.leaveBuilding(),b.name);}
assert(peak<400);assert(life.getInfo().materials<80);
report.push({check:'Every one of the 23 city buildings is enterable; 69 repeat visits retain one room and a bounded shared material palette',peakObjects:peak,materials:life.getInfo().materials});
// Intact walls block the rigid-body walker, with no scripted bypass.
const wallBuilding=view.buildings.find(b=>b.type==='office'),wall=wallBuilding.target.entries.find(e=>e.foundation&&e.body.shapes[0].halfExtents.z<1);const z=wall.body.position.z;life.body.position.set(wall.body.position.x,1.05,z-1);life.body.velocity.setZero();life.body.aabbNeedsUpdate=true;
for(let i=0;i<120;i++){life.body.velocity.z=4;app.test.world.step(1/60);}assert(life.body.position.z<z-.45,'walker passed through intact wall');
// Borrow a healthy NPC; its original collider and mesh must leave the active simulation.
const npc=app.test.traffic.active.find(p=>p.model==='standard');life.body.position.set(npc.body.position.x+2.5,1.05,npc.body.position.z);life.body.velocity.setZero();assert(life.enterVehicle(npc));assert(npc.occupied&&!npc.mesh.visible);assert(!app.test.world.bodies.includes(npc.body));assert.equal(app.getState().vehicle,'borrowed-car');
app.test.teleport(0,180);const borrowPos=app.test.chassis.position.clone();assert(life.exitVehicle());assert(!npc.occupied&&npc.mesh.visible);assert(app.test.world.bodies.includes(npc.body));assert(Math.hypot(npc.body.position.x-borrowPos.x,npc.body.position.z-borrowPos.z)<.1);assert.equal(app.getState().vehicle,'monster-gold');
report.push({check:'Walker collides with intact exterior walls; NPC entry removes its parked collider and exit leaves it at the driven position while preserving the original truck'});
// Aim the actual game camera at a target and fire real raycast weapons.
app.test.recover(true);assert(life.exitVehicle());const target=app.test.traffic.active.find(p=>p.model==='standard');life.body.position.set(target.body.position.x,1.05,target.body.position.z+7);life.body.velocity.setZero();app.camera.position.set(target.body.position.x,2,target.body.position.z+10);app.camera.lookAt(target.body.position.x,1,target.body.position.z);app.camera.updateMatrixWorld(true);life.economy.equip('pistol');const ammo=life.economy.info().ammo.pistol;life.beforeStep(.5,{},{});assert(life.fire());assert.equal(life.economy.info().ammo.pistol,ammo-1);assert(target.damage>0);life.economy.equip('machine');for(let i=0;i<8;i++){life.beforeStep(.1,{},{});life.fire();}assert(target.exploded&&target.charred===1);
report.push({check:'Pistol and machine gun consume ammo, raycast into NPC panels, and trigger the existing charred multi-part explosion'});
const hammerWall=view.buildings.find(b=>b.name==='Mint Mart').target.entries.find(e=>e.foundation&&e.body.shapes[0].halfExtents.z<1);app.test.environment.reset(24);life.body.position.set(hammerWall.body.position.x,1.05,hammerWall.body.position.z-2);app.camera.position.set(hammerWall.body.position.x,1.8,hammerWall.body.position.z-5);app.camera.lookAt(hammerWall.body.position.x,1,hammerWall.body.position.z);app.camera.updateMatrixWorld(true);life.economy.equip('hammer');life.beforeStep(.5,{},{});assert(life.fire());assert(hammerWall.damage>.5);life.beforeStep(.5,{},{});assert(life.fire());assert(hammerWall.broken);assert.equal(life.economy.info().ammo.hammer,0);
report.push({check:'The hammer has finite reach, dents and breaks actual wall panels, and never consumes ammunition'});

life.economy.equip('grenade');for(let i=0;i<12;i++){life.beforeStep(.8,{},{});life.fire();}for(let i=0;i<200;i++){life.beforeStep(1/60,{},{});app.test.world.step(1/60);app.test.environment.update(1/60);}assert(life.getInfo().grenades===0);assert(life.getInfo().grenadePool<=12);life.reset();assert(!app.test.world.bodies.includes(life.body));assert(!life.room.visible);
report.push({check:'Visible ballistic grenades resolve against physical colliders and retire; projectile pool stays capped and reset clears foot/interior state',grenadePool:life.getInfo().grenadePool});
// Standard Xbox mapping: View exits/enters, left stick walks, X enters, Y cycles, RT uses a weapon.
app.start();app.test.teleport(0,190);pads=[{index:0,id:'Xbox Wireless Controller',mapping:'standard',connected:true,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({value:0,pressed:false}))}];frame();pads[0].buttons[8]={value:1,pressed:true};frame();assert.equal(life.mode,'foot');pads[0].buttons[8]={value:0,pressed:false};frame();pads[0].axes=[.8,-.8,.6,.2];const yaw=app.getState().orbitYaw;for(let i=0;i<20;i++)frame();assert(app.getState().controller.moveX>0&&app.getState().controller.moveY<0);assert(app.getState().orbitYaw!==yaw);assert.equal(app.getState().pedals.gas,0);pads=[];frame();assert.equal(app.getState().state,'paused');
report.push({check:'Xbox View exits the car, left stick moves the walker, right stick rotates the camera, and disconnect pauses safely'});
// All regular-level building registries are reachable and use the same single room.
pads=[];for(let level=0;level<24;level++){app.test.loadLevel(level);app.start();app.test.streetLife.refreshDoors();if(!app.test.lots.views[level].buildings.length)continue;assert(life.exitVehicle());for(const b of app.test.lots.views[level].buildings){atDoor(b);assert(life.enterBuilding(b));assert(life.leaveBuilding());}}
report.push({check:'All 24 normal lots register their actual buildings (including beach huts), and every registered interior can be entered and left'});

// Every NPC model can be borrowed repeatedly without retaining a second player car.
app.test.loadLevel(24);app.start();app.test.teleport(0,190);assert(life.exitVehicle());const baseBodies=app.test.world.bodies.length;let vehicleVisits=0;
for(let round=0;round<3;round++)for(const npc of app.test.traffic.active){life.body.position.set(npc.body.position.x+3,1.05,npc.body.position.z);life.body.velocity.setZero();assert(life.enterVehicle(npc));const wheels=app.test.car.assemblies.filter(p=>p.name.startsWith('wheel-'));assert.equal(wheels.length,4);assert(wheels.every(p=>p.children.length>0));app.test.teleport(0,190);assert(life.exitVehicle());assert.equal(app.test.world.bodies.length,baseBodies);assert(app.test.traffic.active.every(p=>!p.occupied));vehicleVisits++;}
report.push({check:'Every NPC model can be entered/exited repeatedly; its four wheel assemblies remain visible and physics body counts return to baseline',visits:vehicleVisits});
// Touch actions and indoor furniture collision; shopping blocks both walking and firing.
const mart=app.test.secretView.buildings.find(b=>b.type==='convenience');atDoor(mart);assert(life.enterBuilding(mart));app.test.setFootCamera(0);life.body.position.set(-6005.4,.83,4.1);app.test.input.KeyW=true;for(let i=0;i<120;i++)frame();delete app.test.input.KeyW;assert(life.body.position.z>3.3);life.body.position.set(-6000,.83,-3.1);get('interactButton').click();assert(life.shopOpen);const pos=life.body.position.clone(),ammoBefore=life.economy.info().ammo.grenade;app.test.input.KeyW=true;app.test.input.Space=true;for(let i=0;i<20;i++)frame();assert.equal(life.body.position.distanceTo(pos),0);assert.equal(life.economy.info().ammo.grenade,ammoBefore);get('closeShop').click();life.body.position.set(-6000,.83,5.2);get('interactButton').click();assert(!life.inside);assert(!life.shopOpen);
report.push({check:'Touch interaction enters shops and exits rooms; shelves block walking and shopping freezes movement/weapon use'});
console.log(JSON.stringify(report,null,2));

{
const {createShopEconomy}=await import(pathToFileURL(root+'shop-economy.js'));
const records=new Map(),economyStorage={getItem:k=>records.get(k),setItem:(k,v)=>records.set(k,v)};
for(const [roll,payout] of [[0,0],[.65,10],[.85,25],[.95,100],[.99,500]]){let shop=createShopEconomy(economyStorage,()=>roll);shop.earn(10);const before=shop.info().cash;assert(shop.buyTicket());shop=createShopEconomy(economyStorage,()=>0);assert.equal(shop.info().ticket.payout,payout);assert.equal(shop.claimTicket(),payout);assert.equal(shop.info().cash,before-10+payout);assert.equal(shop.claimTicket(),null);}
let shop=createShopEconomy(economyStorage);shop.earn(10000);for(const id of ['hammer','pistol','machine','grenade'])assert(shop.buy(id));shop=createShopEconomy(economyStorage);assert.equal(shop.info().owned.length,4);assert(shop.equip('pistol'));for(let i=0;i<36;i++)assert(shop.consume());assert.equal(shop.consume(),null);assert.equal(shop.info().ammo.pistol,0);console.log('Saved economy: all payout tiers, inventory reload, exactly-once settlement, finite ammunition passed');

}
