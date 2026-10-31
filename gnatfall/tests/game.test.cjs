'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const dir=path.resolve(__dirname,'..'),sandbox={window:{},console},context=vm.createContext(sandbox);
for(const f of ['content.js','render.js','game.js'])vm.runInContext(fs.readFileSync(path.join(dir,f),'utf8'),context,{filename:f});
const G=sandbox.window.GNAT;
const data=new Map(),storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)};
function game(index=0){const g=new G.Game(storage);g.save.unlocked=5;g.start(index);return g}
const step=(g,seconds,input={})=>{for(let i=0;i<seconds*30;i++)g.update(1/30,input)};
function reachable(g){for(const d of g.level.doors)d.open=d.target=1;g._solidCache=null;const l=g.level,start=l.mission.start,q=[start],seen=new Set([start.join(',')]);for(let i=0;i<q.length;i++){const [x,z]=q[i];for(const [dx,dz]of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,nz=z+dz,key=nx+','+nz;if(seen.has(key)||!l.grid[nz]||l.grid[nz][nx]==='#')continue;const p=l.pos(nx,nz);if(!g.canWalk(p.x,p.z))continue;seen.add(key);q.push([nx,nz])}}return q.map(c=>({...l.pos(...c),y:1.65}))}
for(let i=0;i<6;i++){const g=game(i),points=reachable(g),m=g.level.mission;assert(g.canWalk(g.player.x,g.player.z),m.short+': safe spawn');assert(points.length>40,m.short+': connected exploration space');for(const target of [g.level.station,g.level.exit,...g.level.loot.filter(l=>l.kind==='cache')])assert(points.some(p=>Math.hypot(p.x-target.x,p.z-target.z)<2),m.short+': interaction and salvage reachable');for(const n of g.level.nests)assert(points.some(p=>Math.hypot(p.x-n.x,p.z-n.z)<5&&g.lineClear(p,n)),m.short+': nest has a reachable firing position');console.log(m.short+': connected rooms, supply, salvage, exit, and all nests accessible');}
{
 const g=game();g.bugs=[];const p=g.player;const start=p.z;step(g,.5,{z:-1});assert(p.z<start-1,'walking');const fuel=g.fuel;step(g,.5,{fire:true});assert(g.fuel<fuel,'burning consumes fuel');assert(g.heat>0,'burning builds heat');step(g,5);assert.equal(g.heat,0,'heat cools fully');g.heat=90;g.fuel=50;g.vent();assert.equal(g.heat,35);assert.equal(g.fuel,47);g.fuel=0;step(g,.2,{fire:true});assert(!g.firing,'empty tank blocks firing');p.x=g.level.station.x;p.z=g.level.station.z;g.health=25;g.interact();assert.equal(g.fuel,g.maxFuel,'station prevents fuel softlocks');assert.equal(g.health,70);g.health=25;g.interact();assert.equal(g.health,25,'first aid works once per mission');
 const b=g.spawnBug(0);b.x=p.x;b.y=p.y;b.z=p.z-2;b.vx=b.vz=0;b.roam={...b};b.roamIn=10;p.yaw=0;p.pitch=0;const old=g.stats.kills;step(g,1,{fire:true});assert(g.stats.kills>old,'flame kills visible pests');assert(g.score>0,'kills score');console.log('Fuel, heating/cooling, venting, refill, first aid limits, flame damage, score passed');
}
{
 const g=game();g.bugs=[];for(const d of g.level.doors)d.open=d.target=1;g._solidCache=null;const wall=g.level.solids.find(s=>s.min[1]===0&&s.max[1]===3.8);const z=(wall.min[2]+wall.max[2])/2;assert(!g.lineClear({x:wall.min[0]-.3,y:1.6,z},{x:wall.max[0]+.3,y:1.6,z}),'walls block flame and sight');const obj=g.level.props.find(p=>p.kind==='crate');assert(obj);g.damageProp(obj,100);assert(!obj.alive);assert(g.level.loot.some(l=>l.x===obj.x&&l.z===obj.z&&l.kind==='supply'),'crates drop supplies');const door=g.level.doors[0];door.open=0;door.target=0;g.player.x=door.x;g.player.z=door.z+1.5;g._solidCache=null;g.interact();assert.equal(door.target,1,'interact opens door');step(g,.6);assert(door.open>.85,'doors animate open');console.log('Wall occlusion, breakable supply crates, and interactive doors passed');
}
{
 const g=game(5);g.bugs=[];for(const n of g.level.nests)g.damageNest(n,1000);step(g,.1);const queen=g.bugs.find(b=>b.queen);assert(queen,'queen arrives after satellite nests are destroyed');queen.hp=queen.maxHP*.6;step(g,.1);assert(g.bugs.length>=5,'queen calls escorts at phase boundary');g.kill(queen);assert(g.bossDown);for(const b of g.bugs)g.kill(b);assert(g.objectivesReady());g.player.x=g.level.exit.x;g.player.z=g.level.exit.z;g.interact();assert.equal(g.phase,'review');assert(g.save.credits>0);const credits=g.save.credits;g.complete();assert.equal(g.save.credits,credits,'extraction rewards once');console.log('Queen shield objective, phase reinforcements, extraction, and reward idempotence passed');
}
{
 const g=game(0);g.bugs=[];for(const n of g.level.nests)n.alive=false;g.stats.caches=g.level.mission.secrets;g.elapsed=20;g.complete();assert.equal(g.result.stars,3);g.save.credits=1000;const old=g.save.upgrades.power;assert(g.buy('power'));assert.equal(g.save.upgrades.power,old+1);assert(g.save.credits<1000);const loaded=new G.Game(storage);assert.equal(loaded.save.upgrades.power,g.save.upgrades.power);assert.equal(loaded.save.cleared[0].stars,3);g.start(0);assert.equal(g.health,100);assert.equal(g.readyNotified,false);g.hurt(1000);assert.equal(g.phase,'dead');g.start(0);assert.equal(g.phase,'play');assert.equal(g.heat,0);console.log('Medals, permanent purchases, save/load, fresh mission state, defeat and retry passed');
}
{
 const g=game();g.bugs=[];g.level.nests.forEach(n=>n.alive=false);g.phase='paused';const before=g.elapsed;step(g,2,{fire:true,z:-1});assert.equal(g.elapsed,before);assert.equal(g.fuel,g.maxFuel);g.phase='play';g.bombs=1;g.throwBomb();assert.equal(g.bombs,0);assert(g.projectiles.some(p=>p.bomb));g.dropBait();assert.equal(g.baitCount,1);assert.equal(g.baits.length,1);g.scanNow();assert(g.scan>0&&g.scanCD>0);g.setWeapon(2);assert.equal(g.weapon,2);step(g,.1,{fire:true});assert(g.projectiles.some(p=>!p.bomb&&!p.enemy));console.log('Pause safety, firebombs, bait, scanner cooldown, and alternate firing mode passed');
}
{
 const fresh=new G.Game({getItem:()=>null,setItem(){}});assert.equal(fresh.save.unlocked,0);assert.equal(fresh.start(1),false);fresh.start(0);fresh.bugs=[];fresh.level.nests.forEach(n=>n.alive=false);fresh.complete();assert.equal(fresh.save.unlocked,1);assert.equal(fresh.unlockedWeapons,2);assert.equal(fresh.start(2),false);console.log('Fresh campaign locks, first mission unlock, and new firing-mode unlock passed');
}
for(let index=0;index<6;index++){
 const g=game(index);for(let i=0;i<240;i++){g.update(1/30,{x:Math.sin(i*.13),z:-.3,turn:.01,fire:i%60<15,run:i%70<20});if(i===60)g.throwBomb();if(i===100)g.scanNow();if(i===120)g.dropBait();}
 for(const b of g.bugs)for(const key of ['x','y','z','hp'])assert(Number.isFinite(b[key]),'finite AI state');assert(g.particles.length<=230,'particle budget');assert(Number.isFinite(g.health)&&Number.isFinite(g.fuel));
}
console.log('Six-location mixed-input simulation, finite AI state, and effect budgets passed');
console.log('All GNATFALL campaign regression checks passed.');
// Doors span each opening, blocking travel through the partition until raised.
for(let index=0;index<6;index++){
 const g=game(index);
 for(const d of g.level.doors){
  const acrossX=d.w<d.d;
  assert.equal(acrossX,d.id<2,'door matches partition orientation');
  const a={x:d.x+(acrossX?-1:0),y:1.65,z:d.z+(acrossX?0:-1)};
  const b={x:d.x+(acrossX?1:0),y:1.65,z:d.z+(acrossX?0:1)};
  assert(rayCrosses(a,b,g.doorSolid(d)),'closed door spans route');
  d.open=1;assert(!rayCrosses(a,b,g.doorSolid(d)),'raised door clears route');
 }
}
function rayCrosses(a,b,s){const axis=a.x!==b.x?'x':'z',i=axis==='x'?0:2,mid=(a[axis]+b[axis])/2;return mid>=s.min[i]&&mid<=s.max[i]&&a.y>=s.min[1]&&a.y<=s.max[1]}
assert.equal(new G.Game({getItem:()=>JSON.stringify({version:2,graphics:0}),setItem(){}}).save.graphics,2,'old saves migrate to pixel graphics');
console.log('Door orientation, closed/open clearance, and pixel save migration passed');
