import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.js';
import {Simulation} from '../src/physics.js';
import {generateCastle} from '../src/castles.js';
import {BUILD_PARTS,LEVELS} from '../src/data.js';
import {partBlocks,starterCastle} from '../src/blueprints.js';
import {WalkMotor,walkSpawn,clearHeadroom} from '../src/walk.js';
await Simulation.init();
function world(parts){const sim=new Simulation({objects:new T.Group(),particles:{clear(){},add(){}},shake:0},()=>{},{strength:1,gravity:1});sim.build(generateCastle(LEVELS[1],1,parts));sim.step(1/60);return sim;}
function release(sim,motor){motor?.dispose();sim.world.free();sim.queue.free();}
test('Sibling Towers have tall square facades, flat decks and a single antenna',()=>{assert.equal(LEVELS[2].name,'Sibling Towers');const bs=generateCastle(LEVELS[2],2),facades=bs.filter(b=>b.facade);assert(facades.length>300);assert(Math.max(...facades.map(b=>b.y+b.h/2))>40);assert(new Set(facades.map(b=>b.structure)).size===2);assert(bs.some(b=>b.tag==='antenna'));assert(!bs.some(b=>b.tag==='banner'));});
test('each builder part produces finite collision geometry and gates/towers are hollow',()=>{for(const [type,v]of Object.entries(BUILD_PARTS)){const blocks=partBlocks({type,x:4,y:v[1]/2,z:-3,rot:Math.PI/2});assert(blocks.length>0,type);assert(blocks.every(b=>[b.x,b.y,b.z,b.w,b.h,b.d].every(Number.isFinite)&&b.w>0&&b.h>0&&b.d>0),type);}const sim=world(starterCastle());assert(clearHeadroom(sim,{x:0,y:0,z:4}));assert(walkSpawn(sim,'upper').y>=2.4);assert(walkSpawn(sim,'roof').y>4.8);release(sim);});
test('walk motor stops at walls and climbs stairs onto a second-story landing',()=>{
 const parts=[{type:'Stairs',x:0,y:1.35,z:0,rot:0},{type:'Floor',x:0,y:2.55,z:-4.8,rot:0},{type:'Wall',x:0,y:1.2,z:-8,rot:0},{type:'Wall',x:0,y:3.6,z:-8,rot:0}];const sim=world(parts),motor=new WalkMotor(sim,{x:0,y:.05,z:4});
 for(let i=0;i<420&&motor.feet.z>-3.4;i++){motor.step(1/60,0,-2.5);sim.step(1/60);}assert(motor.feet.y>2.55,JSON.stringify(motor.feet));assert(motor.feet.z<-2.4,'reached landing');
 for(let i=0;i<240;i++){motor.step(1/60,0,-2.5);sim.step(1/60);}assert(motor.feet.z>-7.5,`wall stops the walker: ${JSON.stringify(motor.feet)}`);assert(motor.feet.y>-.1);release(sim,motor);
});
test('a walker falls when a walkable deck is removed and does not push structures',()=>{const sim=world([{type:'Floor',x:0,y:2.55,z:0,rot:0}]),motor=new WalkMotor(sim,{x:0,y:2.76,z:0});for(let i=0;i<30;i++){motor.step(1/60);sim.step(1/60);}assert(motor.feet.y>2.6);assert.equal(sim.destroyed,0);for(const e of sim.entities.filter(e=>e.b))e.body.setEnabled(false);for(let i=0;i<120;i++){motor.step(1/60);sim.step(1/60);}assert(motor.feet.y<.2);assert(motor.feet.y>-.1);release(sim,motor);});
test('builder keeps edited positions through duplicate, undo, save and collision budgets',async()=>{const {Builder}=await import('../src/builder.js'),{sanitizeBlueprint,BLOCK_LIMIT}=await import('../src/blueprints.js');const save={data:{builds:[]},write:()=>true},view={scene:new T.Scene(),controls:{enabled:true},renderer:{domElement:{addEventListener(){}}}},b=new Builder(view,save,()=>{});b.start([]);b.type='Stairs';b.storey=1;b.material='wood';b.add();b.moveSelected('x',12);b.duplicate();assert.equal(b.parts.length,2);b.undo();assert.equal(b.parts[0].x,12);assert.equal(b.parts[0].material,'wood');b.saveBuild('Steps');assert.equal(save.data.builds[0].parts[0].x,12);b.parts[0].x=0;assert.equal(save.data.builds[0].parts[0].x,12,'save owns an independent blueprint');const huge=Array.from({length:180},()=>({type:'Tower',x:0,y:2.4,z:0,rot:0})),safe=sanitizeBlueprint(huge);assert(safe.flatMap(p=>partBlocks(p)).length<=BLOCK_LIMIT);assert(safe.length<180);b.stop();});
