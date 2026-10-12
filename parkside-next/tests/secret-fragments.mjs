import assert from 'node:assert/strict';
import {bootGame} from './helpers/game.mjs';

// The classic progression keeps 24 challenges. New locations must not become
// the destruction scene, or disable the Secret City rubble fracture path.
const {app}=await bootGame(), t=app.test;
const originalLots=24;
const secretLevel=t.lots.views.length; 
assert.equal(secretLevel,25,'Real-world lot precedes the secret city');
assert(t.loadLevel(secretLevel),'Golden Grounds should unlock after the classic levels');
app.start();
const env=t.environment;
assert.equal(t.secretView.levelIndex,secretLevel);
const wall=env.entries.find(e=>e.level===secretLevel&&!e.explosive&&Math.max(...e.size)>6&&e.structure);
assert(wall,'a destructible building wall must exist in Secret City');
assert.equal(env.getInfo().rubbleFragments,0);
env.strike(wall.body,wall.home,36);
env.update(1/60);
assert(wall.broken,'the wall should break under an impact');
assert(wall.shattered,'Secret City architecture must fracture into smaller chunks');
assert(env.getInfo().rubbleFragments>0,'fragments must be created for the scene');
assert(env.getInfo().visualChips>0,'instanced shards must burst from fractured structures');
assert(env.getInfo().visualChips<=env.getInfo().visualChipLimit,'shards remain within the fixed budget');
assert(env.getInfo().rubblePool<=96,'physics shards remain within the fixed budget');
assert(env.fragments.some(f=>f.source===wall),'fragments should retain source ownership');
env.reset(secretLevel);
assert.equal(env.getInfo().rubbleFragments,0,'reset should recycle debris without leaking physics bodies');
assert.equal(env.getInfo().visualChips,0,'reset must recycle cosmetic chips');
console.log('Secret City wall fragmentation and debris reset verified.');
