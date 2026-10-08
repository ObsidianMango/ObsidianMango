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


const life=app.test.streetLife;app.test.loadLevel(24);app.start();app.test.teleport(0,190);assert(life.exitVehicle());life.refreshDoors();const casino=app.test.secretView.buildings.find(b=>b.type==='casino');assert(casino);life.body.position.set(casino.door.x+casino.door.nx*.6,1.05,casino.door.z+casino.door.nz*.6);assert(life.enterBuilding(casino));
const {CASINO_STATIONS}=await import(pathToFileURL(root+'casino-room.js'));
let roomSize=life.room.children.length;assert(roomSize>200&&roomSize<400);assert.equal(life.getInfo().casino.sharedGeometries,3);
for(const station of CASINO_STATIONS){life.body.position.set(-6000+station.x,.83,station.z);assert(life.interact(),station.name);assert.equal(get('casinoPanel').hidden,false);assert.equal(life.menu.menuRoot,get('casinoPanel'));assert(get('casinoName').textContent);life.closeShop();}
// Every cabinet/table interaction opens an actual playable game, not a static prop.
life.economy.earn(10000);life.openCasino('slots');get('casinoPlay').click();assert(life.economy.info().casinoResult.game==='slots');assert(get('casinoVisual').querySelectorAll('.slot-symbol').length===3);life.closeShop();life.openCasino('roulette');get('roulette-17').click();get('casinoPlay').click();assert.equal(life.economy.info().casinoResult.choice,17);assert.equal(get('casinoChoices').querySelectorAll('.roulette-grid button').length,37);life.closeShop();life.openCasino('poker');get('casinoPlay').click();assert(life.economy.info().casinoRound.game==='poker');get('pokerHold-0').click();const saved=life.economy.info().casinoRound;assert(saved.held[0]);life.closeShop();life.openCasino('blackjack');assert.equal(get('casinoName').textContent,'Draw poker');assert.deepEqual(life.economy.info().casinoRound,saved);get('casinoPlay').click();assert.equal(life.economy.info().casinoRound,null);assert.equal(life.economy.info().casinoResult.cards[0],saved.cards[0]);life.closeShop();life.openCasino('blackjack');get('casinoPlay').click();if(life.economy.info().casinoRound)get('casinoPlay').click();assert.equal(life.economy.info().casinoResult.game,'blackjack');assert(get('casinoVisual').querySelectorAll('.playing-card').length>=4);
report.push({check:'Four playable tables/cabinets open from their own floor positions; roulette has 37 number bets, poker holds persist across closing and other table entry, and blackjack reveals a completed dealer hand',casinoObjects:roomSize});
life.closeShop();life.openCasino('slots');pads=[{index:0,id:'Xbox Wireless Controller',mapping:'standard',connected:true,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({value:0,pressed:false}))}];frame();const serial=life.economy.info().serial;pads[0].buttons[0]={value:1,pressed:true};frame();assert.equal(life.economy.info().serial,serial+1);pads[0].buttons[0]={value:0,pressed:false};frame();pads[0].buttons[1]={value:1,pressed:true};frame();assert(!life.shopOpen);pads[0].buttons[1]={value:0,pressed:false};frame();life.openCasino('poker');frame();pads[0].buttons[0]={value:1,pressed:true};frame();assert(life.economy.info().casinoRound?.game==='poker');pads[0].buttons[0]={value:0,pressed:false};frame();const activeHand=life.economy.info().casinoRound;pads[0].buttons[9]={value:1,pressed:true};frame();assert.equal(app.getState().state,'paused');assert(!life.shopOpen);assert.deepEqual(life.economy.info().casinoRound,activeHand);pads[0].buttons[9]={value:0,pressed:false};frame();get('resume').click();assert(life.casinoUI.games.draw());pads=[];frame();get('resume').click();report.push({check:'Xbox A plays the focused game, B leaves the table, and Menu pauses while preserving the active poker hand'});assert(life.leaveBuilding());app.test.togglePerspective();frame();assert(app.getState().firstPerson);assert(app.camera.position.distanceTo(new T.Vector3(life.body.position.x,life.body.position.y+.6,life.body.position.z))<.15);assert.equal(app.camera.near,.035);app.test.setFootCamera(.75,-.45);frame();const forward=app.camera.getWorldDirection(new T.Vector3());assert(forward.y>0);assert(forward.x<0);
// A touch perspective button switches back; Xbox R3 works indoors as well.
get('perspectiveButton').click();frame();assert(!app.getState().firstPerson);life.body.position.set(casino.door.x+casino.door.nx*.6,1.05,casino.door.z+casino.door.nz*.6);assert(life.enterBuilding(casino));pads=[{index:0,id:'Xbox Wireless Controller',mapping:'standard',connected:true,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({value:0,pressed:false}))}];frame();pads[0].buttons[11]={value:1,pressed:true};frame();assert(app.getState().firstPerson);assert(app.camera.position.x<-5900);pads[0].buttons[11]={value:0,pressed:false};pads[0].axes=[0,0,.7,-.7];for(let i=0;i<15;i++)frame();assert(app.getState().orbitPitch<0);life.closeShop();assert(life.leaveBuilding());pads=[];frame();get('resume').click();life.body.position.set(app.test.chassis.position.x+3.5,1.05,app.test.chassis.position.z);assert(life.enterVehicle());frame();assert(app.getState().firstPerson);assert(app.camera.position.distanceTo(new T.Vector3().copy(app.test.chassis.position))<5);
report.push({check:'First-person eye camera works on foot, indoors and in the truck; touch and Xbox R3 toggle perspective, right stick looks upward/downward, and near clipping is reduced'});
const boundary=app.getState().boundary;assert.equal(boundary.batches,8);assert.equal(boundary.colliders,4);assert.equal(boundary.activeBorders,1);assert(boundary.instances>1000&&boundary.instances<3000);const C=context.C,ray=new C.RaycastResult();assert(app.test.world.raycastClosest(new C.Vec3(6240,.7,30),new C.Vec3(6255,.7,30),{},ray));assert.equal(ray.body.userData.kind,'world boundary');
for(let i=0;i<12;i++){app.test.loadLevel(i%2?24:0);assert.equal(app.getState().boundary.activeBorders,1);assert.equal(app.test.world.bodies.filter(b=>b.userData?.kind==='world boundary').length,4);}
report.push({check:'New boundary scenery stays at eight instanced batches and one active perimeter; four rail colliders block crossing and do not accumulate across 12 level switches',boundary});
const {createShopEconomy}=await import(pathToFileURL(root+'shop-economy.js')),rules=await import(pathToFileURL(root+'casino-games.js'));
const card=(rank,suit=0)=>suit*13+rank-2;assert.equal(rules.blackjackValue([card(14),card(14),card(9)]),21);assert.equal(rules.blackjackValue([card(14),card(13),card(5)]),16);
const hands=[[
 [10,11,12,13,14].map(r=>card(r)),800],[[2,3,4,5,14].map(r=>card(r)),50],[[card(7,0),card(7,1),card(7,2),card(7,3),card(2)],25],[[card(8,0),card(8,1),card(8,2),card(5,0),card(5,1)],9],[[2,4,7,9,13].map(r=>card(r)),6],[[card(2,0),card(3,1),card(4,2),card(5,3),card(6,0)],4],[[card(11,0),card(11,1),card(2,2),card(6,3),card(8,0)],1]];for(const [hand,pay]of hands)assert.equal(rules.pokerRank(hand).pay,pay);
assert.equal(rules.roulettePayout(0,'red',10),0);assert.equal(rules.roulettePayout(0,'even',10),0);assert.equal(rules.roulettePayout(17,17,10),360);assert.equal(rules.roulettePayout(1,'red',10),20);assert.equal(rules.roulettePayout(13,'second',10),30);
function wallet(random){const data=new Map(),store={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)},cash=createShopEconomy(store),games=rules.createCasinoGames(cash,random);cash.earn(10000);return {cash,games,store};}
const slots=wallet(()=>.85);let before=slots.cash.info().cash;assert(slots.games.play('slots',10));assert.equal(slots.cash.info().cash,before-10+500);assert.equal(slots.cash.settleRound(slots.cash.info().casinoResult.id,500,{}),false);assert(!slots.games.play('slots',1000));
const poker=wallet(()=>.41);before=poker.cash.info().cash;assert(poker.games.play('poker',20));assert.equal(poker.cash.info().cash,before-20);poker.games.hold(1);const round=poker.cash.info().casinoRound;const reloaded=createShopEconomy(poker.store),resumed=rules.createCasinoGames(reloaded,()=>.99);assert.deepEqual(reloaded.info().casinoRound,round);assert(!resumed.play('slots',10));assert(resumed.draw());assert.equal(reloaded.info().casinoRound,null);assert.equal(resumed.draw(),false);assert.equal(reloaded.info().casinoResult.cards[1],round.cards[1]);
// Controlled decks verify natural, push, dealer soft-17, and bust payouts against wallet behavior.
function bj(player,dealer,extra=[]){const w=wallet(()=>.4),used=[...player,...dealer,...extra],deck=Array.from({length:52},(_,i)=>i).filter(c=>!used.includes(c)).concat(extra);const r=w.cash.beginRound('blackjack',10,{player,dealer,deck});return {...w,r};}
let b=bj([card(14),card(13)],[card(10,1),card(7,2)]);rules.createCasinoGames(b.cash).info();assert.equal(b.cash.info().casinoResult.payout,25);b=bj([card(10),card(8)],[card(10,1),card(8,2)]);assert(b.games.stand());assert.equal(b.cash.info().casinoResult.payout,10);b=bj([card(10),card(8)],[card(14,1),card(6,2)]);assert(b.games.stand());assert.equal(b.cash.info().casinoResult.dealer.length,2);assert.equal(b.cash.info().casinoResult.payout,20);b=bj([card(10),card(9)],[card(10,1),card(7,2)],[card(5,3)]);assert(b.games.hit());assert.equal(b.cash.info().casinoResult.payout,0);
// An interrupted instantaneous spin resumes its stored outcome without another debit or reroll.
const interrupted=wallet(()=>0),balance=interrupted.cash.info().cash;interrupted.cash.beginRound('slots',10,{reels:[4,4,4]});const restored=createShopEconomy(interrupted.store);rules.createCasinoGames(restored,()=>0);assert.equal(restored.info().cash,balance-10+500);assert.equal(restored.info().casinoRound,null);rules.createCasinoGames(restored,()=>0);assert.equal(restored.info().cash,balance-10+500);
report.push({check:'Aces, poker ranks/paytable, roulette zero and payouts, natural blackjack, soft-17 stand, push/bust, stake debit, saved deck/holds and exactly-once interrupted-spin settlement all pass'});
console.log(JSON.stringify(report,null,2));
