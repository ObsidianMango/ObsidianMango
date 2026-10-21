import assert from 'node:assert/strict';
import fs from 'node:fs';
import {LOTS,SECRET_LEVEL_INDEX,MULTIPLAYER_LEVELS,LEVEL_SIGNATURE,validLevel} from '../level-catalog.js';
assert.equal(LOTS.length,28);assert.equal(SECRET_LEVEL_INDEX,28);assert.equal(MULTIPLAYER_LEVELS.length,29);assert(validLevel(25));assert(!validLevel(29));assert(!validLevel(-1));assert.equal(LOTS[24].code,'RB25');
const source=fs.readFileSync(new URL('../level-catalog.js',import.meta.url),'utf8');
const appended=source.replace('export const ORIGINAL_LOT_COUNT',"LEVEL_DEFINITIONS.push({name:'Future lot',code:'FUTURE',coordinates:'world',realWorld:true,style:'market',theme:0x888888,spawn:[1,2,0],target:{x:3,z:4,yaw:0,w:4,d:7},gates:[{x:2,z:3,yaw:0}],gateWidth:5,par:60});\nexport const ORIGINAL_LOT_COUNT");
const future=await import('data:text/javascript;base64,'+Buffer.from(appended).toString('base64'));assert.equal(future.LOTS.length,29);assert.equal(future.SECRET_LEVEL_INDEX,29);assert(future.validLevel(26));assert.equal(future.MULTIPLAYER_LEVELS.length,30);assert.equal(future.LOTS[28].gates[0].x,2);assert.deepEqual(future.LOTS.slice(0,28),LOTS);assert.notEqual(future.LEVEL_SIGNATURE,LEVEL_SIGNATURE);
console.log('Append-only level data automatically extends menus and valid multiplayer IDs, retains original layouts and saves, accepts explicit world gates and changes compatibility signature.');
