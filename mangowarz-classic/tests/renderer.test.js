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

test('public title is Classic-only with one original 1985 pixel-art direction',()=>{
  const {renderer,main}=rendererFixture();
  renderer.renderTitle({classicSave:null,extendedSave:{mode:'extended',day:8,location:'brooklyn',cash:9000},settings:{audio:true,haptics:true}});
  assert.match(main.innerHTML,/MANGO/);
  assert.match(main.innerHTML,/WARZ/);
  assert.match(main.innerHTML,/name="mode" value="classic"/);
  assert.match(main.innerHTML,/assets\/classic-ui\/title-city\.svg/);
  assert.match(main.innerHTML,/HOW TO PLAY/);
  assert.doesNotMatch(main.innerHTML,/Mango Extended/i);
});

test('Classic hub mirrors the compact six-button 1985 mobile layout',()=>{
  const originalDocument=globalThis.document;
  const {renderer,main,status,actions,dayLocation}=rendererFixture();
  globalThis.document={getElementById:id=>id==='day-location'?dayLocation:null};
  try{
    const state=createInitialState({mode:'classic',seed:'renderer-hub'});
    initializeMarket(state);
    renderer.renderGame(state,{view:'home'});
    assert.match(main.innerHTML,/assets\/classic-ui\/locations\/bronx\.svg/);
    for(const label of ['MARKET','TRAVEL','BANK','LOAN SHARK','HOSPITAL','STATS'])assert.match(main.innerHTML,new RegExp(label));
    assert.match(status.innerHTML,/>DAY</);
    assert.match(status.innerHTML,/>LOCATION</);
    assert.match(status.innerHTML,/>COAT</);
    assert.equal(actions.hidden,true);
  }finally{
    globalThis.document=originalDocument;
  }
});

test('Classic market renders a focused pixel table with one trade target per listing',()=>{
  const originalDocument=globalThis.document;
  const {renderer,main,status,actions,dayLocation}=rendererFixture();
  globalThis.document={getElementById:id=>id==='day-location'?dayLocation:null};
  try{
    const state=createInitialState({mode:'classic',seed:'renderer-faithful'});
    initializeMarket(state);
    const selected=Object.values(state.market.rows).find(row=>row.available)?.productId;
    renderer.renderGame(state,{view:'market',selectedProductId:selected});
    const tradeTargets=(main.innerHTML.match(/data-action="trade-product"/g)??[]).length;
    assert.equal(tradeTargets,state.market.listedCount);
    assert.match(main.innerHTML,/STREET MARKET/);
    assert.match(main.innerHTML,/GOODS/);
    assert.match(main.innerHTML,/PRICE/);
    assert.match(main.innerHTML,/OWN/);
    assert.match(main.innerHTML,/assets\/classic-ui\/products\//);
    assert.match(main.innerHTML,/data-action="buy"/);
    assert.match(main.innerHTML,/data-action="sell"/);
    assert.match(main.innerHTML,/data-action="screen-back"/);
    assert.equal(status.hidden,true);
    assert.equal(actions.hidden,true);
  } finally {
    globalThis.document=originalDocument;
  }
});

test('subway view uses the six Classic destinations and a confirm step',()=>{
  const {renderer,main}=rendererFixture();
  const state=createInitialState({mode:'classic',seed:'renderer-subway'});
  initializeMarket(state);
  renderer.renderGame(state,{view:'travel',selectedDestination:'brooklyn'});
  assert.match(main.innerHTML,/assets\/classic-ui\/subway-map\.svg/);
  assert.equal((main.innerHTML.match(/data-action="select-destination"/g)??[]).length,6);
  assert.match(main.innerHTML,/data-action="travel-confirm" data-destination="brooklyn"/);
  assert.match(main.innerHTML,/TRAVEL ENDS THE DAY/);
});
