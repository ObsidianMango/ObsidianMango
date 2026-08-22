import test from 'node:test';
import assert from 'node:assert/strict';
import { SeededRng } from '../js/rng.js';

test('seeded RNG repeats exactly',()=>{
  const a=new SeededRng('mango-repeat');const b=new SeededRng('mango-repeat');
  assert.deepEqual(Array.from({length:100},()=>a.nextUint32()),Array.from({length:100},()=>b.nextUint32()));
});

test('saved RNG state resumes exact sequence',()=>{
  const a=new SeededRng('resume');for(let i=0;i<17;i++)a.next();const saved=a.state;
  const expected=Array.from({length:20},()=>a.int(3,99));const b=new SeededRng('resume',saved);
  assert.deepEqual(Array.from({length:20},()=>b.int(3,99)),expected);
});

test('integer ranges are min inclusive and max exclusive',()=>{
  const rng=new SeededRng('ranges');for(let i=0;i<10000;i++){const value=rng.int(11,60);assert.ok(value>=11&&value<60);}
});
