export const TYPES = {
 fly:{name:'Pond fly',color:'#f8d75e',points:1,speed:38,r:21,tip:'Your daily snack. Tap to nom.'},
 mosquito:{name:'Mosquito',color:'#f8a6cf',points:2,speed:63,r:21,tip:'Zigzags. Lead your next tap.'},
 beetle:{name:'Beetle',color:'#8dcc60',points:2,speed:32,r:24,hp:2,tip:'Two taps crack the shell.'},
 firefly:{name:'Firefly',color:'#eaff83',points:2,speed:42,r:21,tip:'Nom it while it glows.'},
 dragonfly:{name:'Dragonfly',color:'#64e4ed',points:3,speed:98,r:24,tip:'Fast, but worth three snacks.'},
 bee:{name:'Bee',color:'#ffb744',speed:40,r:23,hazard:true,tip:'Do not eat! Lure it with Bloom, then BOOM.'},
 hornet:{name:'Hornet',color:'#ff7e52',speed:73,r:24,hazard:true,tip:'A faster stinger. Bloom draws it away.'},
 spider:{name:'Reed spider',color:'#ad85e6',speed:35,r:24,hazard:true,tip:'Hangs from the reeds. Do not eat.'},
 toxic:{name:'Toxic bug',color:'#c5e650',speed:39,r:24,hazard:true,tip:'A poisonous snack. Clear it with BOOM.'},
 mantis:{name:'Parry mantis',color:'#a8ee68',points:3,speed:33,r:27,hp:2,new:true,tip:'Crossed claws block your tongue. Tap when OPEN.'},
 wasp:{name:'Dive wasp',color:'#ff8755',points:3,speed:49,r:26,new:true,tip:'NOM while it aims. HOP when it dives.'},
 snail:{name:'Iron snail',color:'#b6a8ff',points:3,speed:22,r:27,hp:2,new:true,tip:'Wait for OPEN, or use Bloom to expose its shell.'},
 spore:{name:'Spore shooter',color:'#ff98c3',points:3,speed:28,r:27,hp:2,new:true,tip:'Tap its spores before they hit your lily pad.'},
 mimic:{name:'Mimic fly',color:'#a3dcf4',points:4,speed:52,r:25,new:true,tip:'Do not bite its spiky disguise. Wait for OPEN.'},
 king:{name:'King of the Swarm',color:'#ffd669',speed:42,r:57,boss:true,hp:12,tip:'Break the swarm. HOP through its dive, then attack while OPEN.'},
 goliath:{name:'Goliath Beetle',color:'#c6a4ff',speed:32,r:61,boss:true,hp:16,tip:'Armored until its slam. HOP the impact, then hit the exposed shell.'},
 moon:{name:'The Moon Moth',color:'#ffd1f2',speed:48,r:62,boss:true,hp:20,tip:'Tap falling moon spores. Strike while its wings are OPEN.'}
};
const level=(name,biome,goal,pool,tease,boss=null)=>({name,biome,goal,pool,tease,boss});
export const LEVELS=[
 level('Lily Pad Lunch',0,8,['fly','fly','mosquito'],'Bees join the picnic.'),
 level('Buzzing Banks',0,12,['fly','mosquito','beetle','bee'],'NEW · The parry mantis.'),
 level('Mantis Crossing',0,15,['fly','mosquito','mantis','bee'],'NEW · Watch for diving wasps.'),
 level('Dive Club',0,18,['fly','beetle','mantis','wasp','bee'],'BOSS · King of the Swarm.'),
 level('King of the Swarm',0,14,['fly','mosquito','wasp','bee'],'A new pond. A harder shell.','king'),
 level('Shell Boulevard',1,18,['fly','firefly','snail','beetle'],'NEW · Spore shooters awake.'),
 level('Spore Garden',1,20,['fly','firefly','snail','spore'],'Dragonflies race the rapids.'),
 level('Dragonfly Rapids',1,22,['fly','dragonfly','wasp','spore','hornet'],'NEW · That fly looks suspicious…'),
 level('The Impostor Pond',1,24,['fly','firefly','mimic','mantis','spider'],'BOSS · The Goliath is stirring.'),
 level('Goliath Grove',1,20,['fly','dragonfly','snail','spore','toxic'],'Moonwater is calling.','goliath'),
 level('Moonwater',2,24,['fly','firefly','mimic','spider','snail'],'The reeds have teeth.'),
 level('Midnight Reeds',2,26,['fly','dragonfly','mantis','wasp','spider'],'A very spicy swamp.'),
 level('Toxic Bloom',2,28,['fly','firefly','spore','mimic','toxic'],'One last feast before the crown.'),
 level('The Last Supper',2,30,['fly','dragonfly','wasp','snail','mantis','spore','mimic','hornet'],'FINAL BOSS · The Moon Moth.'),
 level('Moon Crown',2,24,['fly','firefly','dragonfly','mimic','spore'],'The pond has a new monarch.','moon')
];
export const BIOMES=['Lilywild','Lotus Grove','Moonwater'];
export const UPGRADES={heart:{name:'Big-hearted',description:'+1 maximum heart',max:3},tongue:{name:'Quick tongue',description:'Wider aim + faster tongue',max:3},bloom:{name:'Flower power',description:'+1 starting Bloom + stronger BOOM',max:3}};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function cleanSave(raw){
 const s=raw&&typeof raw==='object'?raw:{};
 const integer=(v,max)=>Number.isFinite(v)?clamp(Math.floor(v),0,max):0;
 const stars=Array.from({length:15},(_,i)=>integer(s.stars?.[i],3));
 const upgrades=Object.fromEntries(Object.keys(UPGRADES).map(k=>[k,integer(s.upgrades?.[k],3)]));
 let budget=stars.filter(Boolean).length;
 for(const k of Object.keys(upgrades)){upgrades[k]=Math.min(upgrades[k],budget);budget-=upgrades[k];}
 return {version:1,unlocked:integer(s.unlocked,14),stars,upgrades,best:integer(s.best,9999999),won:!!s.won&&stars[14]>0,sound:s.sound!==false};
}
export class Game {
 constructor(save={},random=Math.random){this.save=cleanSave(save);this.random=random;this.mode='title';this.level=0;this.events=[];this.enemies=[];this.shots=[];this.flowers=[];this.projectiles=[];this.time=0;this.score=0;this.nextId=1;this.hp=5;this.maxHp=5;this.progress=0;this.blooms=2;this.cooldown=0;this.hopCooldown=0;this.invulnerable=0;this.bossSpawned=false;this.combo=0;}
 emit(type,data={}){this.events.push({type,...data});}
 drain(){return this.events.splice(0);}
 rand(a,b){return a+this.random()*(b-a);}
 start(index=0){
  if(!Number.isInteger(index)||index<0||index>this.save.unlocked||index>=LEVELS.length)return false;
  this.level=index;this.mode='playing';this.time=0;this.progress=0;this.score=0;this.combo=0;this.hits=0;this.misses=0;this.kills=0;
  this.maxHp=5+this.save.upgrades.heart;this.hp=this.maxHp;this.blooms=2+this.save.upgrades.bloom;
  this.enemies=[];this.flowers=[];this.projectiles=[];this.shots=[];this.cooldown=0;this.hopCooldown=0;this.invulnerable=1.3;this.spawnClock=0;this.bossSpawned=false;this.bossDead=false;this.events=[];
  this.spawn('fly');this.spawn('fly');this.spawn(LEVELS[index].pool.find(x=>TYPES[x].new)||'mosquito');
  this.emit('start');return true;
 }
 pause(){if(this.mode==='playing'){this.mode='paused';this.emit('pause');}}
 resume(){if(this.mode==='paused')this.mode='playing';}
 get tokens(){return this.save.stars.filter(Boolean).length-Object.values(this.save.upgrades).reduce((a,b)=>a+b,0);}
 upgrade(key){if(!(key in UPGRADES)||this.mode==='playing'||this.tokens<=0||this.save.upgrades[key]>=3)return false;this.save.upgrades[key]++;this.emit('save');return true;}
 spawn(type){const t=TYPES[type];const e={id:this.nextId++,type,x:this.rand(.12,.88),y:this.rand(.12,.55),vx:this.rand(-1,1),vy:this.rand(-.5,.5),age:0,offset:this.rand(0,4),hp:t.hp||1,maxHp:t.hp||1,flash:0,stun:0,open:true,attackClock:0,phase:'guard',phaseTime:0,attackDone:false};if(t.boss){e.x=.5;e.y=.24;}this.enemies.push(e);return e;}
 hurt(reason){if(this.mode!=='playing'||this.invulnerable>0)return false;this.hp--;this.combo=0;this.invulnerable=1.1;this.emit('hurt',{text:reason});if(this.hp<=0){this.hp=0;this.mode='dead';this.emit('dead');}return true;}
 hop(){if(this.mode!=='playing'||this.hopCooldown>0)return false;this.hopCooldown=2.2;this.invulnerable=Math.max(this.invulnerable,.9);this.emit('hop');return true;}
 bloom(){if(this.mode!=='playing'||this.blooms<=0)return false;this.blooms--;this.flowers.push({x:this.flowers.length%2?.77:.23,y:.63,life:8});for(const e of this.enemies){if(e.type==='snail'||e.type==='mantis')e.stun=3;}this.emit('bloom');return true;}
 boom(){if(this.mode!=='playing'||!this.flowers.length)return false;const blooms=this.flowers.splice(0);const radius=.34+this.save.upgrades.bloom*.05;
  for(const e of [...this.enemies]){if(!blooms.some(f=>Math.hypot(e.x-f.x,(e.y-f.y)*1.25)<radius))continue;if(TYPES[e.type].boss){if(e.open)this.damage(e,2);}else if(TYPES[e.type].hazard){this.enemies=this.enemies.filter(x=>x!==e);this.score++;}else this.damage(e,3);if(this.mode!=='playing')break;}
  this.projectiles=[];this.emit('boom',{flowers:blooms});return true;
 }
 shoot(x,y,aspect=1){if(this.mode!=='playing'||this.cooldown>0||!Number.isFinite(x)||!Number.isFinite(y))return false;
  this.cooldown=.18-this.save.upgrades.tongue*.025;this.shots.push({x:clamp(x,0,1),y:clamp(y,0,1),life:.17});
  let target=null,best=Infinity;const dist=e=>Math.hypot(e.x-x,(e.y-y)*aspect);
  for(const p of this.projectiles){const d=dist(p);if(d<.065&&d<best){best=d;target=p;}}
  for(const e of this.enemies){const d=dist(e),radius=(TYPES[e.type].boss?.12:.065)+this.save.upgrades.tongue*.007;if(d<radius&&d<best){best=d;target=e;}}
  if(!target){this.misses++;this.combo=0;this.emit('miss',{x,y});return true;}
  if(target.projectile){this.projectiles=this.projectiles.filter(p=>p!==target);this.emit('pop',{x:target.x,y:target.y,color:'#ffa9d1',text:'POP'});return true;}
  const t=TYPES[target.type];
  if(t.hazard){this.hurt('Stinger! Use Bloom + BOOM.');return true;}
  if(!target.open){this.emit('block',{x:target.x,y:target.y,text:target.type==='firefly'?'WAIT FOR THE GLOW':'GUARDED'});this.combo=0;return true;}
  this.hits++;this.damage(target,1);return true;
 }
 damage(e,amount){if(!this.enemies.includes(e)||this.mode!=='playing')return;e.hp-=amount;e.flash=.16;if(e.hp>0){this.emit('hit',{x:e.x,y:e.y,color:TYPES[e.type].color});return;}
  this.enemies=this.enemies.filter(x=>x!==e);this.score+=TYPES[e.type].points||15;this.combo++;this.kills++;this.emit('nom',{x:e.x,y:e.y,color:TYPES[e.type].color,text:TYPES[e.type].boss?'CROWNED!':`+${TYPES[e.type].points||1}`});
  if(TYPES[e.type].boss){this.bossDead=true;this.complete();return;}
  if(this.kills%5===0){this.blooms=Math.min(9,this.blooms+1);this.emit('charge');}
  if(!this.bossSpawned){this.progress=Math.min(LEVELS[this.level].goal,this.progress+(TYPES[e.type].points||1));if(this.progress>=LEVELS[this.level].goal){if(LEVELS[this.level].boss){this.bossSpawned=true;this.enemies=[];this.projectiles=[];this.spawn(LEVELS[this.level].boss);this.invulnerable=1;this.emit('boss');}else this.complete();}}
 }
 complete(){if(this.mode!=='playing')return;const first=!this.save.stars[this.level];const stars=this.hp===this.maxHp?3:this.hp>=Math.ceil(this.maxHp/2)?2:1;this.save.stars[this.level]=Math.max(this.save.stars[this.level],stars);this.save.unlocked=Math.max(this.save.unlocked,Math.min(14,this.level+1));this.save.best=Math.max(this.save.best,this.score);this.save.won=this.save.won||this.level===14;this.mode=this.level===14?'victory':'clear';this.projectiles=[];this.emit('save');this.emit('clear',{stars,first});}
 projectile(e,dx=0){const x=clamp(e.x+dx,.05,.95),y=e.y+.04;this.projectiles.push({projectile:true,x,y,vx:(.5-x)/2.7,vy:(.91-y)/2.7,life:3.1});}
 bossStep(e,dt){e.phaseTime+=dt;const enraged=e.hp<=e.maxHp/2;
  const duration={guard:enraged?1.2:1.6,warning:1.15,attack:.35,open:enraged?1.6:2.1};
  if(e.phaseTime>=duration[e.phase]){e.phaseTime=0;e.phase={guard:'warning',warning:'attack',attack:'open',open:'guard'}[e.phase];e.attackDone=false;
   if(e.phase==='warning')this.emit('warning',{text:e.type==='moon'?'MOON SPORES · TAP TO POP':'INCOMING · GET READY TO HOP'});
  }
  e.open=e.phase==='open';
  if(e.phase==='attack'&&!e.attackDone){e.attackDone=true;if(e.type==='moon'){this.projectile(e,-.18);this.projectile(e,0);this.projectile(e,.18);if(enraged)this.projectile(e,.28);}else this.hurt(e.type==='king'?'Swarm dive! Hop after the warning.':'Ground slam! Time your hop.');}
  e.x=.5+Math.sin(e.age*.9)*.22;e.y=.24+(e.phase==='attack'&&e.type==='king'?Math.sin(e.phaseTime/.35*Math.PI)*.42:Math.sin(e.age*1.3)*.025);
 }
 step(dt){if(this.mode!=='playing')return;dt=clamp(Number.isFinite(dt)?dt:0,0,.05);this.time+=dt;this.cooldown=Math.max(0,this.cooldown-dt);this.hopCooldown=Math.max(0,this.hopCooldown-dt);this.invulnerable=Math.max(0,this.invulnerable-dt);
  this.shots=this.shots.filter(s=>(s.life-=dt)>0);this.flowers=this.flowers.filter(f=>(f.life-=dt)>0);
  this.spawnClock+=dt;const cfg=LEVELS[this.level];
  if(!this.bossSpawned&&this.spawnClock>Math.max(.65,1.35-this.level*.035)){this.spawnClock=0;if(this.enemies.length<Math.min(9,5+Math.floor(this.level/3))){const edible=this.enemies.filter(e=>!TYPES[e.type].hazard).length;this.spawn(edible<2?'fly':cfg.pool[Math.floor(this.random()*cfg.pool.length)]);}}
  for(const e of [...this.enemies]){if(this.mode!=='playing')break;const t=TYPES[e.type];e.age+=dt;e.flash=Math.max(0,e.flash-dt);e.stun=Math.max(0,e.stun-dt);
   if(t.boss){this.bossStep(e,dt);continue;}
   e.open=true;const phase=(e.age+e.offset)%4.4;
   if(e.type==='mantis')e.open=e.stun>0||phase>2.2;
   if(e.type==='snail')e.open=e.stun>0||phase>2.6;
   if(e.type==='mimic')e.open=phase>2.1;
   if(e.type==='firefly')e.open=phase>1;
   if(e.type==='wasp'){e.attackClock+=dt;e.phase=e.attackClock>3.7?'warning':'guard';if(e.attackClock>=4.8){this.hurt('Dive wasp! Nom it early or HOP.');e.attackClock=0;this.emit('dive',{x:e.x,y:e.y});}}
   if(e.type==='spore'){e.attackClock+=dt;if(e.attackClock>4.2){e.attackClock=0;this.projectile(e);}}
   let speed=t.speed/600*(1+this.level*.01)*(e.stun>0?.2:1);if(e.type==='dragonfly')speed*=1+Math.max(0,Math.sin(e.age*2));
   if(t.hazard&&this.flowers.length){const f=this.flowers[0],d=Math.max(.01,Math.hypot(f.x-e.x,f.y-e.y));e.x+=(f.x-e.x)/d*speed*dt;e.y+=(f.y-e.y)/d*speed*dt;}
   else{e.x+=e.vx*speed*dt;e.y+=(e.vy+(e.type==='mosquito'?Math.sin(e.age*5)*.65:Math.sin(e.age*2+e.offset)*.22))*speed*dt;}
   if(e.x<.065||e.x>.935){e.x=clamp(e.x,.065,.935);e.vx*=-1;}if(e.y<.09||e.y>.72){e.y=clamp(e.y,.09,.72);e.vy*=-1;}
  }
  for(const p of [...this.projectiles]){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;if(p.y>=.88||p.life<=0){this.projectiles=this.projectiles.filter(x=>x!==p);this.hurt('Spore hit! Tap spores or HOP.');}}
 }
}
