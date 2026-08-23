import test from 'node:test';
import assert from 'node:assert/strict';
import { Renderer } from '../js/renderer.js';
import { createInitialState } from '../js/state.js';
import { initializeMarket } from '../js/travel.js';

function rendererFixture() {
  const dayLocation={innerHTML:''};
  const main={innerHTML:'',focus(){}};
  const header={hidden:false,querySelector(){return dayLocation;}};
  const status={hidden:false,innerHTML:''};
  const actions={hidden:false,innerHTML:''};
  return {renderer:new Renderer({main,header,status,actions}),main,header,status,actions,dayLocation};
}

test('public title is Classic-only and character-mode text first',()=>{
  const {renderer,main}=rendererFixture();
  renderer.renderTitle({classicSave:null,extendedSave:{mode:'extended',day:8,location:'brooklyn',cash:9000},settings:{audio:true,haptics:true}});
  assert.match(main.innerHTML,/MANGOWARZ/);
  assert.match(main.innerHTML,/name="mode" value="classic"/);
  assert.doesNotMatch(main.innerHTML,/Mango Extended|<img\b/i);
});

test('Classic market renders as a compact text list with one trade target per listing',()=>{
  const originalDocument=globalThis.document;
  const {renderer,main,status,actions,dayLocation}=rendererFixture();
  globalThis.document={getElementById:id=>id==='day-location'?dayLocation:null};
  try{
    const state=createInitialState({mode:'classic',seed:'renderer-faithful'});
    initializeMarket(state);
    renderer.renderGame(state);
    const tradeTargets=(main.innerHTML.match(/data-action="trade-product"/g)??[]).length;
    assert.equal(tradeTargets,state.market.listedCount);
    assert.match(main.innerHTML,/DRUG/);
    assert.match(main.innerHTML,/PRICE/);
    assert.match(main.innerHTML,/HAVE/);
    assert.doesNotMatch(main.innerHTML,/<img\b|market-atmosphere|location-card/i);
    assert.match(status.innerHTML,/>Guns</);
    assert.doesNotMatch(status.innerHTML,/Net worth/i);
    assert.match(actions.innerHTML,/\[J\]/);
  } finally {
    globalThis.document=originalDocument;
  }
});
