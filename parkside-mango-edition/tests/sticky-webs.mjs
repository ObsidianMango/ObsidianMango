import assert from 'node:assert/strict';
import {bootGame} from './helpers/game.mjs';
import {createWebShooter} from '../web-shooter.js';
const {app,T,context}=await bootGame(),C=context.C;
const scene=new T.Scene(),web=createWebShooter(T,scene),target=new C.Body({mass:10,shape:new C.Box(new C.Vec3(1,1,1))});
const from=new T.Vector3(1,2,4),hit=new T.Vector3(1,2,0),normal=new T.Vector3(0,0,1);
web.shoot(from,hit,normal,target);const root=scene.children[0],strands=root.children[0],beads=root.children[1],matrix=new T.Matrix4(),center=new T.Vector3();
const centerAt=()=>{beads.getMatrixAt(0,matrix);return center.setFromMatrixPosition(matrix).clone();};
const start=centerAt();target.position.x=1;web.update(.1);assert(centerAt().distanceTo(start.clone().add(new T.Vector3(1,0,0)))<1e-5);assert.equal(web.getInfo().stretching,1);
target.quaternion.setFromAxisAngle(new C.Vec3(0,1,0),Math.PI/2);web.update(.1);const expected=start.clone().applyQuaternion(new T.Quaternion().copy(target.quaternion)).add(target.position);assert(centerAt().distanceTo(expected)<1e-5,'adhesion follows target rotation as well as translation');
assert(web.getInfo().beads>=7);assert.equal(web.getInfo().strands,10,'only six drip segments and four stretch segments remain after the shot');
web.clear();web.shoot(from,hit,normal);web.update(.25);assert.equal(web.getInfo().strands,6,'stationary splat has drips only, without radial spokes or rings');assert.equal(web.getInfo().beads,7);
web.clear();for(let i=0;i<24;i++)web.shoot(from,hit,normal,target);target.velocity.set(10,0,0);target.angularVelocity.set(0,10,0);web.update(.1);assert(Math.abs(target.velocity.x-10*Math.exp(-.28))<1e-8,'multiple webs apply drag only once per target');assert.equal(web.getInfo().viscousTargets,1);
web.clear();const geometryCount=new Set(root.children.map(m=>m.geometry)).size,materialCount=new Set(root.children.map(m=>m.material)).size;
for(let i=0;i<300;i++){web.shoot(from,new T.Vector3(i%8,2,0),normal);web.update(1/60);assert(web.getInfo().active<=24);assert(strands.count<=strands.instanceMatrix.count);assert(beads.count<=beads.instanceMatrix.count);}
assert.equal(root.children.length,2);assert.equal(geometryCount,2);assert.equal(materialCount,1);assert.equal(web.getInfo().physicsBodies,0);for(const m of root.children)for(const n of m.instanceMatrix.array)assert(Number.isFinite(n));web.update(7);assert.equal(web.getInfo().active,0);assert.equal(strands.count,0);assert.equal(beads.count,0);
web.shoot(from,hit,normal,target);web.clear();assert.equal(web.getInfo().attached,0);assert.equal(web.getInfo().active,0);
const t=app.test,life=t.streetLife;t.loadLevel(24);app.start();t.setState('running');t.teleport(0,190);assert(life.exitVehicle());life.refreshDoors();const club=t.secretView.buildings.find(b=>b.type==='club');
function visit(){life.body.position.set(club.door.x+club.door.nx*.7,.83,club.door.z+club.door.nz*.7);assert(life.enterBuilding(club));}
visit();const models=life.room.children.filter(x=>x.name==='Adult stage performer');assert.equal(models.length,2);for(const m of models){assert(m.userData.adult);assert.equal(m.userData.style,'blocky-stage-costume');assert(m.children.some(p=>p.position.y===.77&&p.material.color.getHex()===0x302a39),'lower costume remains in place');}
const materials=life.getInfo().materials,bodies=t.world.bodies.length;for(let i=0;i<12;i++){assert(life.leaveBuilding());visit();assert.equal(life.clubRoom.getInfo().performers,2);assert.equal(life.getInfo().materials,materials);assert.equal(t.world.bodies.length,bodies);}
console.log('Sticky webs follow translation/rotation, stretch, apply non-stacking drag, and recycle 300 shots in 2 batches / 2 geometries / 1 material with no physics bodies. Expiry and room reset clear effects. Adult blocky models and 12 club visits retain stable resources.');
