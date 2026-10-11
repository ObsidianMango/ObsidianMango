import assert from 'node:assert/strict';
import {bootGame} from './helpers/game.mjs';
import {CASINO_STATIONS} from '../casino-room.js';
const {app,get,T,frame,setPads}=await bootGame(),t=app.test,life=t.streetLife;
t.loadLevel(24);app.start();t.teleport(0,190);assert(life.exitVehicle());life.refreshDoors();
const mart=t.secretView.buildings.find(b=>b.type==='convenience'),casino=t.secretView.buildings.find(b=>b.type==='casino');
function enter(b){if(life.inside)assert(life.leaveBuilding());life.body.position.set(b.door.x+b.door.nx*.6,.83,b.door.z+b.door.nz*.6);assert(life.enterBuilding(b));}
function station(game){life.closeShop();const s=CASINO_STATIONS.find(s=>s.game===game);life.body.position.set(-6000+s.x,.83,s.z);life.ui();get('interactButton').click();return s;}
enter(mart);life.economy.earn(20000);assert(life.openShop());
assert(get('scratchTicket').hidden);assert(get('buyScratch').disabled);assert.equal(life.scratchUI.getInfo().selected,null);
get('scratchGame-dice').click();get('buyScratch').click();const ticket=life.economy.info().ticket;assert.equal(ticket.design,'dice');life.closeShop();assert(life.openShop());assert.equal(life.economy.info().ticket.id,ticket.id,'paid unfinished ticket must survive reopening');
get('revealScratch').click();assert(!life.economy.info().ticket);assert(get('scratchTicket').hidden);assert.equal(life.scratchUI.getInfo().selected,null);assert(get('buyScratch').disabled);get('buyScratch').click();assert(!life.economy.info().ticket,'every purchase requires a fresh choice');
get('scratchGame-numbers').click();life.closeShop();assert(life.openShop());assert.equal(life.scratchUI.getInfo().selected,null);assert(get('scratchTicket').hidden);life.closeShop();
enter(casino);const cash=life.economy.info().cash;
for(const game of ['slots','roulette','poker','blackjack'])assert.equal(life.openCasino(game),false,'cannot gamble remotely from the entrance');
assert.equal(life.economy.info().cash,cash);
for(const s of CASINO_STATIONS.filter(s=>s.seatX!==undefined&&s.game!=='sit')){
 life.body.position.set(-6000+s.x,.83,s.z);life.ui();get('interactButton').click();assert(life.getInfo().seated);assert.equal(life.getInfo().seatGame,s.game);assert.equal(life.body.position.x,-6000+s.seatX);assert.equal(life.body.position.z,s.seatZ);
 for(const game of ['slots','roulette','poker','blackjack'])assert.equal(!!get('casinoTab-'+game),game===s.game,'only the corresponding table can be selected');
 const oldButton=get('casinoPlay');get('casinoClose').click();assert(!life.getInfo().seated);assert.equal(life.body.position.x,-6000+s.x);const serial=life.economy.info().serial;oldButton?.click();assert.equal(life.economy.info().serial,serial,'stale button cannot bet after standing');
}
station('poker');get('casinoPlay').click();life.casinoUI.finishReveal();get('pokerHold-0').click();const pending=life.economy.info().casinoRound;assert(pending?.game==='poker');
station('blackjack');assert.equal(get('casinoPlay'),null);assert.deepEqual(life.economy.info().casinoRound,pending);assert(get('casinoVisual').textContent.includes('Return to that table'));
station('lobby');assert(!get('casinoPlay'));assert(!get('casinoTab-slots'));station('poker');assert.deepEqual(life.economy.info().casinoRound,pending);get('casinoPlay').click();life.casinoUI.finishReveal();assert.equal(life.economy.info().casinoRound,null);life.closeShop();
// The actual Xbox X contextual action seats the walker; B restores the standing position.
life.body.position.set(-6004.8,.83,-2);const pad={index:0,id:'Xbox Wireless Controller',mapping:'standard',connected:true,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({value:0,pressed:false}))};setPads([pad]);frame();pad.buttons[2]={value:1,pressed:true};frame();assert(life.getInfo().seated);assert.equal(life.getInfo().seatGame,'slots');pad.buttons[2]={value:0,pressed:false};frame();pad.buttons[1]={value:1,pressed:true};frame();assert(!life.getInfo().seated);pad.buttons[1]={value:0,pressed:false};setPads([]);frame();t.setState('running');
// Real on-foot weapon rays break room geometry and remove furniture collision.
enter(mart);for(const id of ['hammer','pistol','machine','grenade'])assert(life.economy.buy(id));life.economy.equip('pistol');const bodies=t.world.bodies.length;
function aimAt(p,from){life.body.position.set(from.x,.83,from.z);app.camera.position.set(from.x,1.47,from.z);app.camera.lookAt(-6000+p.x,p.y,p.z);app.camera.updateMatrixWorld(true);life.beforeStep(.5,{},{});}
const shelf=life.breakage.targets.find(target=>target.collider&&target.p.x>5);assert(shelf);aimAt(shelf.p,{x:-6000,z:shelf.p.z});let hit=false;for(let i=0;i<5&&!shelf.broken;i++){life.beforeStep(.5,{},{});hit=life.fire()||hit;}assert(hit);assert(shelf.broken);assert(shelf.collider.broken);assert(life.getInfo().interiorBreakage.debris>0);assert.equal(t.world.bodies.length,bodies);
const broken=life.getInfo().interiorBreakage.broken;life.leaveBuilding();enter(mart);assert.equal(life.getInfo().interiorBreakage.broken,broken,'damage persists across leaving and reentering');assert.equal(life.getInfo().interiorBreakage.debris,0);
// Grenades use the indoor ray/blast path, without filling the exterior physics world.
life.economy.equip('grenade');const intact=life.breakage.targets.find(target=>target.collider&&!target.broken);aimAt(intact.p,{x:-6000,z:2});assert(life.fire());for(let i=0;i<150;i++)life.beforeStep(1/60,{},{});assert.equal(life.getInfo().grenades,0);assert(life.getInfo().interiorBreakage.broken>broken);assert.equal(t.world.bodies.length,bodies);
// Hundreds of hits reuse one 64-instance pool; room replacements retain no old parts.
let peak=0;for(let round=0;round<5;round++)for(const b of t.secretView.buildings){enter(b);for(const target of life.breakage.targets){life.breakage.blast(new T.Vector3(-6000+target.p.x,target.p.y,target.p.z),2);peak=Math.max(peak,life.getInfo().interiorBreakage.debris);}assert(life.getInfo().interiorBreakage.debris<=64);assert(life.getInfo().interiorBreakage.targets<=120);assert.equal(life.getInfo().interiorBreakage.physicsBodies,0);assert.equal(life.room.children.filter(m=>m.userData.interiorDebris).length,1);life.beforeStep(10,{},{});assert.equal(life.getInfo().interiorBreakage.debris,0);}
assert.equal(peak,64);assert(life.getInfo().materials<104);assert.equal(t.world.bodies.length,bodies);life.reset();assert.equal(life.getInfo().interiorBreakage.targets,0);assert.equal(life.getInfo().interiorBreakage.debris,0);
console.log('Fresh scratch selections, paid-ticket persistence, touch/Xbox seating, table-locked gambling and saved hands pass.');
console.log('Actual indoor pistol/grenade damage, removed shelf collision, persistent breakage, 115 room visits, 64 reusable debris instances and zero extra physics bodies pass.');
