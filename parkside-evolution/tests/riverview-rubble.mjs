import assert from 'node:assert/strict';
import {bootGame} from './helpers/game.mjs';
import {LOTS,SECRET_LEVEL_INDEX,MULTIPLAYER_LEVELS,LEVEL_SIGNATURE} from '../level-catalog.js';
const {app,T,context,frame}=await bootGame(),t=app.test,C=context.C;
const level=LOTS.findIndex(l=>l.style==='riverviewHospital');assert.equal(level,25);assert.equal(SECRET_LEVEL_INDEX,LOTS.length);assert.equal(MULTIPLAYER_LEVELS.length,LOTS.length+1);
assert(t.loadLevel(level));app.start();t.setState('running');const v=t.lots.views[level],layout=v.group.userData.riverview;
assert.equal(layout.slots,144);assert(layout.occupied>125);assert.equal(t.traffic.active.length,layout.occupied);
assert(!t.traffic.active.some(p=>Math.hypot(p.body.position.x-v.ox+23.2,p.body.position.z-21.8)<1));
// Actual footprint overlap checks prove the approach and turn are not blocked by parked cars or gate islands.
const path=[[-53,64],[-53,-52],[-42,-52],[-42,-40],[-33,-40],[-33,21.8]];
for(let i=1;i<path.length;i++){const a=path[i-1],b=path[i],length=Math.hypot(b[0]-a[0],b[1]-a[1]);for(let s=0;s<=length;s+=1){const u=s/length,x=a[0]+(b[0]-a[0])*u,z=a[1]+(b[1]-a[1])*u;for(const e of t.environment.entries){if(e.home.y-e.originalSize[1]/2>2.4)continue;if(e.home.y+e.originalSize[1]/2<.3)continue;assert(!(Math.abs(e.home.x-v.ox-x)<e.size[0]/2+1.15&&Math.abs(e.home.z-z)<e.size[2]/2+1.15),'route obstructed at '+x+','+z);}}}
// Edges are closed except the shared northern entrance.
for(const [x,z] of [[0,46],[-46,0],[46,0],[0,-46]])assert(t.environment.entries.some(e=>Math.abs(e.home.x-v.ox-x)<=e.size[0]/2+.1&&Math.abs(e.home.z-z)<=e.size[2]/2+.1));
for(let i=0;i<3;i++)frame();assert(app.scene.children.length>0);
// Full mobile/controller action path: Hulk picks up an existing chunk, throws it and stops carrying.
t.loadLevel(SECRET_LEVEL_INDEX);app.start();t.setState('running');t.teleport(0,210);const life=t.streetLife;assert(life.exitVehicle());const ox=t.secretView.ox;
t.crowd.reset(SECRET_LEVEL_INDEX,ox,{count:0,routes:[]});
const source=t.environment.entries.find(e=>e.structure&&!e.role&&e.size[2]<1);t.environment.strike(source.body,source.home,20);t.environment.update(1/60);
const chunk=t.environment.fragments.find(e=>Math.max(...e.size)<4);assert(chunk);chunk.body.position.set(ox,1,198);chunk.mesh.position.copy(chunk.body.position);chunk.body.velocity.setZero();chunk.body.angularVelocity.setZero();
life.body.position.set(ox,.83,200);t.setFootCamera(0,.5);assert(life.hulk.toggle());life.beforeStep(.5,{},{});assert(life.fire());assert(life.hulk.held?.body===chunk.body);life.ui();assert.equal(context.document.getElementById('fireButton').textContent,'THROW');assert(context.document.getElementById('ripButton').hidden);assert.equal(chunk.body.collisionFilterMask,0);
life.beforeStep(.5,{},{});assert(life.fire());assert(!life.hulk.held);assert(chunk.body.velocity.length()>20);assert(chunk.body.collisionFilterMask!==0);
// Swept flight can hit a pedestrian, even when a fast chunk crosses them between steps.
t.crowd.reset(SECRET_LEVEL_INDEX,ox,{count:1,routes:[{x0:0,x1:4,z0:194,z1:198}]});const victim=t.crowd.people[0];const start=chunk.body.position.clone();victim.pose[0].p.set(start.x,start.y,start.z-1);chunk.body.position.z-=2;life.beforeStep(1/60,{},{});assert(victim.down,'thrown chunk knocks down pedestrian');
// Contact from the same thrown body breaks an actual destructible wall.
const wall=t.environment.entries.find(e=>e.structure&&!e.role&&!e.broken);assert(wall);chunk.body.dispatchEvent({type:'collide',body:wall.body,contact:{getImpactVelocityAlongNormal:()=>20}});life.beforeStep(1/60,{},{});assert(wall.damage>0);assert(wall.broken);
life.hulk.stop();assert.equal(life.hulk.getInfo().rubble.activeThrows,0);assert(t.environment.fragments.length<=96);
console.log(JSON.stringify({level:LOTS[level].name,slots:layout.slots,occupied:layout.occupied,signature:LEVEL_SIGNATURE,result:'single-neck perimeter, clear full approach, vacant target, menu catalog, full Hulk rubble controls, pedestrian sweep, wall damage, cleanup and fixed budgets pass'}));
