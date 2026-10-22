import assert from 'node:assert/strict';
import {createLevelDestruction} from '../level-destruction.js';
import {completedThrough,isLotUnlocked} from '../parking-lots.js';
import {bootGame} from './helpers/game.mjs';
// A building counts once even when its fragments continue to split; baskets are outside this registry.
const awards=[],medals=[],tracker=createLevelDestruction({onAward:(...a)=>awards.push(a),onMedal:m=>medals.push(m.medal)});
const props=Array.from({length:20},()=>({broken:false})),contents={role:'contents',broken:true},floor={role:'floor',broken:true};
tracker.reset({entries:[...props,contents,floor]});assert.equal(tracker.getInfo().targets,20);
props.slice(0,5).forEach(e=>e.broken=true);assert.equal(tracker.update().medal,1);tracker.update();assert.equal(awards.length,5);
props.slice(5,12).forEach(e=>e.broken=true);assert.equal(tracker.update().medal,2);
props.slice(12,18).forEach(e=>e.broken=true);assert.equal(tracker.update().medal,3);assert.deepEqual(medals,[1,2,3]);
const wall=Array.from({length:10},()=>({structure:'one',broken:false}));tracker.reset({entries:wall});wall.slice(0,5).forEach(e=>e.broken=true);assert.equal(tracker.update().destroyed,0);wall[5].broken=true;assert.equal(tracker.update().destroyed,1);tracker.update();assert.equal(tracker.getInfo().targets,1);
assert(completedThrough(Array.from({length:24},(_,i)=>i%2?{destruction:1}:{stars:1}),24));assert(isLotUnlocked(8,Array.from({length:8},()=>({destruction:1}))));
const {app,get,storage,frame}=await bootGame({progress:[]}),t=app.test;
assert.equal(app.getState().title,'Parker Destroy');app.start();t.setGoalFocus('destroy');
const v=t.lots.views[0],entries=t.lots.breakables.filter(e=>e.level===0&&e.role!=='floor'&&e.role!=='contents');
entries.forEach(e=>e.broken=true);t.traffic.active.forEach(c=>c.damage=1);t.levelDestruction.update();
assert.equal(app.getState().destructionMedal.medal,3);assert.equal(app.getState().medals[0].destruction,3);assert.equal(app.getState().medals[0].parking,0);
assert(app.getState().scoring.destructionPoints>0);const earned=app.getState().scoring.pending;t.levelDestruction.update();assert.equal(app.getState().scoring.pending,earned,'targets cannot score twice');
t.finishLevelDestruction();assert.equal(app.getState().state,'ended');assert.match(get('finishTag').textContent,/GOLD DESTRUCTION/);assert.equal(app.getState().scoring.settled,true);
// Restart, then earn a parking medal while preserving the destruction medal.
app.start();assert.equal(app.getState().destructionMedal.medal,0);assert.equal(app.getState().medals[0].destruction,3);t.finish();assert.equal(app.getState().medals[0].parking,3);assert.equal(app.getState().medals[0].destruction,3);
assert([...storage.values()].some(s=>typeof s==='string'&&s.includes('"destruction":3')),'medals persist in existing progress storage');
console.log('Parker Destroy: tier thresholds, fixed target credit, building groups, either-path unlocks, destruction banking, independent medals and saved parking progress pass.');
