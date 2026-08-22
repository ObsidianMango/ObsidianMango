import { EXTENDED_ASSETS, LOCATION_BY_ID, LOCATIONS, PRODUCT_BY_ID, WEAPON_BY_ID } from './config.js';
import { applyMotionPreference, announce } from './accessibility.js';
import { AssetLoader } from './asset-loader.js';
import { GameAudio } from './audio.js';
import { activeWeapon, attemptEscape, beginCombatChoice, enemyAttack, finalizeCombat, playerAttack, surrenderGoods } from './combat.js';
import { acceptOffer, clearResolvedEncounter, declineOffer, resolveStreetIncident } from './encounters.js';
import { buyTreatment, deposit, purchaseExtendedAsset, repayDebt, sellExtendedAsset, treatmentQuote, withdraw } from './finance.js';
import { Haptics } from './haptics.js';
import { ModalManager } from './modal-manager.js?v=5';
import { loadGame, loadSettings, recordBestScore, resetSave, saveGame, saveSettings } from './persistence.js';
import { createSeed, SeededRng } from './rng.js';
import { Renderer, escapeHtml, icon } from './renderer.js';
import { finishRun, shareSummary } from './scoring.js';
import { createInitialState, freeCapacity, totalCapacity, usedCapacity } from './state.js';
import { buyProduct, maxBuyable, maxSellable, sellProduct } from './trading.js';
import { initializeMarket, travelTo } from './travel.js';
import { formatMoney } from './utils.js';

const main=document.getElementById('game-main');
const renderer=new Renderer({main,header:document.getElementById('app-header'),status:document.getElementById('status-strip'),actions:document.getElementById('action-bar')});
const modal=new ModalManager(document.getElementById('modal-root'));
const assets=new AssetLoader();
const storedSettings=loadSettings();
const audio=new GameAudio(storedSettings.audio!==false);
const haptics=new Haptics(storedSettings.haptics!==false);
let state=null;
let busy=false;
let installPrompt=null;
let titleNotice='';

if('scrollRestoration' in history) history.scrollRestoration='manual';
applyMotionPreference(storedSettings.reducedMotion ?? null);
assets.load().then(()=>assets.guardAll());

function resetPageScroll() {
  const settle=()=>{main.focus({preventScroll:true});window.scrollTo({top:0,left:0,behavior:'instant'});};
  settle(); requestAnimationFrame(settle); setTimeout(settle,80);
}

function showTitle(notice=titleNotice) {
  state=null; modal.close();
  const classic=loadGame('classic'); const extended=loadGame('extended');
  renderer.renderTitle({classicSave:classic.state,extendedSave:extended.state,settings:loadSettings(),notice:notice || (!classic.ok?classic.reason:!extended.ok?extended.reason:'')});
  assets.guardAll(main); syncInstallButton(); resetPageScroll();
}

function renderGame({save=true}={}) {
  if(!state)return;
  if(save) saveGame(state);
  if(state.finished){renderer.renderFinal(state,state._isBest);assets.guardAll(main);return;}
  renderer.renderGame(state); assets.guardAll(document.getElementById('app'));
}

function toast(message,type='info') {
  const root=document.getElementById('toast-root'); root.setAttribute('aria-hidden','false');
  root.innerHTML=`<div class="toast ${type==='error'?'error':''}">${escapeHtml(message)}</div>`;
  announce(message,type==='error');
  clearTimeout(toast.timer); toast.timer=setTimeout(()=>{root.innerHTML='';root.setAttribute('aria-hidden','true');},2500);
}

function feedback(result,sound='purchase') {
  if(!result.ok){audio.play('error');haptics.error();toast(result.reason,'error');return false;}
  audio.play(sound);haptics.success();toast(result.message??'Done.');return true;
}

function confirmAction({title,text,confirmLabel='Confirm',danger=false,onConfirm}) {
  modal.open({title,content:`<p>${escapeHtml(text)}</p>`,actions:[{label:'Cancel',className:'button ghost',onClick:()=>modal.close()},{label:confirmLabel,className:`button ${danger?'danger':'primary'}`,onClick:()=>{modal.close(false);onConfirm();}}]});
}

function beginNewGame(values) {
  const mode=values.mode;
  const existing=loadGame(mode).state;
  const create=()=>{
    const settings={audio:values.audio,haptics:values.haptics,reducedMotion:storedSettings.reducedMotion??false};
    saveSettings(settings); audio.setEnabled(values.audio);haptics.setEnabled(values.haptics);
    state=createInitialState({mode,seed:values.seed||createSeed(),sixProductVariant:values.sixProductVariant,...settings});
    initializeMarket(state); saveGame(state); audio.play('travel'); renderGame(); resetPageScroll();
  };
  if(existing&&!existing.finished) confirmAction({title:'Replace saved run?',text:`This will replace the saved ${mode==='classic'?'Classic':'Extended'} run on Day ${existing.day}. The other mode is untouched.`,confirmLabel:'Replace run',danger:true,onConfirm:create}); else create();
}

function resumeMode(mode) {
  const loaded=loadGame(mode);
  if(!loaded.ok||!loaded.state){showTitle(loaded.reason||'No save found.');return;}
  state=loaded.state; audio.setEnabled(state.settings.audio); haptics.setEnabled(state.settings.haptics); applyMotionPreference(state.settings.reducedMotion);
  if(state.finished){const best=recordBestScore(state);state._isBest=best.isBest;renderGame({save:false});resetPageScroll();return;}
  renderGame({save:false}); resetPageScroll();
  if(state.pendingEncounter&&!state.pendingEncounter.resolved) queueMicrotask(openEncounter);
}

function quantityFor(productId) {
  const input=document.querySelector(`[data-quantity="${productId}"]`);
  const value=Number(input?.value);
  renderer.quantities.set(productId,value);
  return value;
}

function setQuantity(productId,value) {
  const safe=Math.max(1,Math.min(999999,Number.isSafeInteger(value)?value:1));
  renderer.quantities.set(productId,safe);
  const input=document.querySelector(`[data-quantity="${productId}"]`);if(input)input.value=String(safe);
}

function mutateTrade(kind,productId) {
  if(busy)return;busy=true;
  try{
    const quantity=quantityFor(productId); const result=kind==='buy'?buyProduct(state,productId,quantity):sellProduct(state,productId,quantity);
    if(feedback(result,kind==='buy'?'purchase':'sale')){saveGame(state);renderGame({save:false});}
  } finally {busy=false;}
}

function openTravel() {
  const cards=LOCATIONS.map(location=>`<button class="destination-card ${location.id===state.location?'current':''}" data-action="travel-destination" data-destination="${location.id}" ${location.id===state.location?'disabled':''}><img src="assets/locations/${location.id}-map.svg" alt="Map thumbnail for ${escapeHtml(location.name)}"><span><strong>${escapeHtml(location.name)}</strong><small>Listings ${location.minListed}–${location.maxListedExclusive-1}</small></span><span aria-label="Police rating ${location.police}" class="danger-dots">${'•'.repeat(Math.max(1,Math.ceil(location.police/20)))}</span></button>`).join('');
  modal.open({title:`Travel • Day ${state.day}`,content:`<p style="margin-bottom:10px">A successful trip advances the day and applies 10% debt interest plus 5% bank interest.</p><div class="sheet-grid">${cards}</div>${state.day===29?'<div class="change-preview"><b>Next stop is Day 30.</b> You will still get the full final market and services before choosing Finish Run.</div>':''}`,dismissible:true,returnFocus:document.querySelector('[data-action="travel"]')});
  assets.guardAll(modal.current.dialog);
}

function doTravel(destination) {
  if(busy)return;busy=true;
  modal.close(false);
  const result=travelTo(state,destination);
  busy=false;
  if(!result.ok){toast(result.reason,'error');return;}
  audio.play(result.encounter?.type==='police'?'police':'travel');haptics.pulse(25);saveGame(state);renderGame({save:false});
  if(result.encounter) setTimeout(openEncounter,state.settings.reducedMotion?0:220);
}

function serviceContent() {
  const quote=treatmentQuote(state);
  const loan=state.location==='bronx'?`<section class="panel-card form-stack"><div class="actor-chip"><img src="assets/civilians/loan-shark.svg" alt="Loan shark portrait"><div><h3>Loan Shark</h3><small>Repayment only. No new Classic loans.</small></div></div><div class="field"><label for="loan-amount">Repay debt</label><input id="loan-amount" inputmode="numeric" placeholder="Whole dollars"><button class="button ghost" data-action="service-max" data-target="loan-amount" data-value="${Math.min(state.cash,state.debt)}">Max ${formatMoney(Math.min(state.cash,state.debt))}</button></div><button class="button primary" data-action="repay-debt">Repay</button></section>`:'';
  const bank=state.location==='manhattan'?`<section class="panel-card form-stack"><div class="actor-chip"><img src="assets/civilians/banker.svg" alt="Banker portrait"><div><h3>Manhattan Bank</h3><small>Balances gain 5% after every completed trip.</small></div></div><div class="two-col"><div class="field"><label for="deposit-amount">Deposit</label><input id="deposit-amount" inputmode="numeric"><button class="button ghost" data-action="service-max" data-target="deposit-amount" data-value="${state.cash}">Max</button><button class="button buy" data-action="bank-deposit">Deposit</button></div><div class="field"><label for="withdraw-amount">Withdraw</label><input id="withdraw-amount" inputmode="numeric"><button class="button ghost" data-action="service-max" data-target="withdraw-amount" data-value="${state.bank}">Max</button><button class="button sell" data-action="bank-withdraw">Withdraw</button></div></div></section>`:'';
  const clinic=`<section class="panel-card form-stack"><div class="actor-chip"><img src="assets/civilians/doctor.svg" alt="Doctor portrait"><div><h3>Street Clinic</h3><small>Restore ${quote.healing} health for ${formatMoney(quote.cost)}.</small></div></div><button class="button buy" data-action="buy-treatment" ${quote.healing===0||state.cash<quote.cost?'disabled':''}>Treat to ${Math.min(100,state.health+quote.healing)} health</button></section>`;
  const extended=state.mode==='extended'?`<section><span class="eyebrow">Extended asset exchange</span><p>Resale factors and risks are disclosed on every card.</p><div class="sheet-grid" style="margin-top:10px">${EXTENDED_ASSETS.map(asset=>`<article class="asset-card"><img src="assets/extended-mode/${asset.id}.svg" alt="${escapeHtml(asset.name)} illustration"><span><strong>${escapeHtml(asset.name)} • ${formatMoney(asset.price)}</strong><small>${escapeHtml(asset.description)}</small><small>Owned: ${state.ownedAssets[asset.id]??0}</small></span><span><button class="button buy" data-action="asset-buy" data-asset="${asset.id}" ${state.cash<asset.price?'disabled':''}>Buy</button>${state.ownedAssets[asset.id]>0?`<button class="button sell" data-action="asset-sell" data-asset="${asset.id}">Sell</button>`:''}</span></article>`).join('')}</div></section>`:'';
  return `<div class="sheet-grid">${loan}${bank}${!loan&&!bank?'<div class="panel-card"><p>No bank or loan shark in this neighborhood.</p></div>':''}${clinic}${extended}</div>`;
}

function openServices() { modal.open({title:`Services • ${LOCATION_BY_ID[state.location].name}`,content:serviceContent(),dismissible:true,returnFocus:document.querySelector('[data-action="services"]')});assets.guardAll(modal.current.dialog); }

function serviceMutation(result,sound='purchase') { if(feedback(result,sound)){saveGame(state);renderGame({save:false});openServices();} }

function openInventory() {
  const products=Object.entries(state.inventory).filter(([,q])=>q>0).map(([id,q])=>`<div class="log-card"><img src="assets/products/${id}.svg" alt="${escapeHtml(PRODUCT_BY_ID[id].name)}"><span><strong>${escapeHtml(PRODUCT_BY_ID[id].name)}</strong><small>${q} units</small></span><b>${q}</b></div>`).join('')||'<div class="panel-card"><p>Your coat is empty.</p></div>';
  const weapons=state.weapons.map(id=>`<div class="log-card"><img src="assets/weapons/${id}.svg" alt="${escapeHtml(WEAPON_BY_ID[id].name)}"><span><strong>${escapeHtml(WEAPON_BY_ID[id].name)}</strong><small>Damage ${WEAPON_BY_ID[id].damage} • ${WEAPON_BY_ID[id].spaces} spaces</small></span></div>`).join('')||'<p class="small">No weapons.</p>';
  const assetsOwned=state.mode==='extended'?Object.entries(state.ownedAssets).filter(([,q])=>q>0).map(([id,q])=>`<div class="log-card"><img src="assets/extended-mode/${id}.svg" alt=""><span><strong>${escapeHtml(EXTENDED_ASSETS.find(x=>x.id===id)?.name)}</strong><small>Owned ${q}</small></span></div>`).join(''):'';
  modal.open({title:'Inventory',content:`<div class="panel-card"><span class="eyebrow">Capacity</span><h2>${freeCapacity(state)} free / ${totalCapacity(state)}</h2><p>${usedCapacity(state)} occupied, including weapon space.</p></div><div class="sheet-grid" style="margin-top:10px">${products}<h3>Weapons</h3>${weapons}${assetsOwned?`<h3>Extended assets</h3>${assetsOwned}`:''}</div>`,returnFocus:document.querySelector('[data-action="inventory"]')});assets.guardAll(modal.current.dialog);
}

function openHistory() {
  const logs=state.eventHistory.map(event=>`<article class="log-card"><img src="assets/ui/ticker.svg" alt=""><span><strong>Day ${event.day} • ${escapeHtml(LOCATION_BY_ID[event.location]?.name??event.location)}</strong><small>${escapeHtml(event.message)}</small></span><span class="tag">${escapeHtml(event.type)}</span></article>`).join('');
  modal.open({title:'Recent Event History',content:`<div class="sheet-grid">${logs||'<p>No events yet.</p>'}</div>`,returnFocus:document.querySelector('[data-action="history"]')});
}

function openSettings() {
  modal.open({title:'Settings & Run Data',content:`<div class="form-stack"><label class="check-row"><input type="checkbox" data-setting="audio" ${state.settings.audio?'checked':''}><span><b>Sound effects</b><small>Original synthesized audio after interaction only.</small></span></label><label class="check-row"><input type="checkbox" data-setting="haptics" ${state.settings.haptics?'checked':''}><span><b>Haptics</b><small>Supported devices only.</small></span></label><label class="check-row"><input type="checkbox" data-setting="reducedMotion" ${state.settings.reducedMotion?'checked':''}><span><b>Reduced motion</b><small>Replaces significant movement with instant changes.</small></span></label><div class="panel-card"><span class="eyebrow">Reproducible run</span><p>Mode: <b>${state.mode}</b></p><p>Seed: <code>${escapeHtml(state.seed)}</code></p><p>Product set: ${state.settings.sixProductVariant?'six-product variant':'default 12 products'}</p><button class="button ghost" data-action="copy-seed">Copy seed</button></div><button class="button ghost" data-action="return-title">Save & return to title</button><button class="button danger" data-action="reset-run">Reset this ${state.mode} save</button><p class="small">Gameplay note: “Baretta” preserves the requested compatibility spelling; the real-world brand is commonly spelled differently.</p></div>`,returnFocus:document.querySelector('[data-action="settings"]')});
}

function encounterMarkup(encounter) {
  return `<div class="encounter-layout"><div class="encounter-art"><img src="${encounter.art}" alt="${escapeHtml(encounter.title)} encounter illustration"><div class="actor-chip"><img src="${encounter.actorArt}" alt=""><small>${escapeHtml(encounter.actor)}</small></div></div><div><p>${escapeHtml(encounter.text)}</p>${encounter.data?.before!==undefined?`<div class="change-preview"><b>Capacity preview</b><p>${encounter.data.before} → ${encounter.data.after} total; inventory stays intact.</p></div>`:''}${encounter.data?.cost?`<div class="change-preview"><b>Cost ${formatMoney(encounter.data.cost)}</b>${encounter.data.damage?` • damage ${encounter.data.damage} • ${encounter.data.spaces} spaces`:''}</div>`:''}</div></div>`;
}

function openEncounter() {
  const encounter=state.pendingEncounter;if(!encounter)return;
  if(encounter.type==='police'&&state.combat?.status==='encounter-start'){beginCombatChoice(state);saveGame(state);}
  if(encounter.resolved){modal.open({title:encounter.title,content:encounterMarkup(encounter),dismissible:false,actions:[{label:state.ended?'View final score':'Continue',className:'button primary',onClick:completeEncounter}]});assets.guardAll(modal.current.dialog);return;}
  if(encounter.type==='street'){
    modal.open({title:encounter.title,content:`${encounterMarkup(encounter)}<div class="change-preview"><b>This consequence will be recorded when you continue.</b></div>`,dismissible:false,actions:[{label:'Continue',className:'button primary',onClick:()=>{const result=resolveStreetIncident(state);feedback(result,'market');saveGame(state);openEncounter();}}]});
  } else if(encounter.type==='offer'){
    modal.open({title:encounter.title,content:encounterMarkup(encounter),dismissible:false,actions:[{label:'Decline',className:'button ghost',onClick:()=>{declineOffer(state);saveGame(state);openEncounter();}},{label:encounter.kind==='tip'?'Take the tip':'Accept offer',className:'button primary',onClick:()=>{const result=acceptOffer(state);if(feedback(result,'purchase')){saveGame(state);renderGame({save:false});openEncounter();}}}]});
  } else openCombat();
  assets.guardAll(modal.current.dialog);
}

function openCombat() {
  const encounter=state.pendingEncounter,combat=state.combat,weapon=activeWeapon(state);if(!combat)return;
  const goods=Object.values(state.inventory).reduce((sum,q)=>sum+q,0); const enemyPct=Math.round(combat.enemyHealth/combat.enemyMaxHealth*100); const playerPct=state.health;
  const content=`${encounterMarkup(encounter)}<div class="combat-stats"><div class="panel-card"><span class="eyebrow">Player</span><h3>${state.health}/100 health</h3><div class="combat-meter" style="--meter:${playerPct}%"><i></i></div><small>${weapon?`${escapeHtml(weapon.name)} • ${weapon.damage} damage`:'Unarmed'} • ${goods} carried units</small></div><div class="panel-card"><span class="eyebrow">${combat.activeEnemies} active / ${combat.enemyCount}</span><h3>${combat.enemyHealth}/${combat.enemyMaxHealth} enemy health</h3><div class="combat-meter" style="--meter:${enemyPct}%"><i></i></div><small>Round ${combat.round} • state: ${combat.status}</small></div></div><div class="combat-log" aria-label="Combat log">${combat.log.map(line=>`<div>${escapeHtml(line)}</div>`).join('')}</div>`;
  const actions=[];
  if(combat.status==='player-choice'&&!combat.resolving){
    actions.push({label:'Run',className:'button sell',onClick:()=>runCombat(false)});
    if(weapon) actions.push({label:`Fight (${weapon.damage})`,className:'button danger',onClick:fightCombat});
    if(goods>0) actions.push({label:'Drop goods & run',className:'button ghost',onClick:()=>runCombat(true)});
    actions.push({label:'Surrender goods',className:'button ghost',onClick:()=>{surrenderGoods(state);saveGame(state);renderGame({save:false});openEncounter();}});
  } else if(['victory','defeat'].includes(combat.status)) actions.push({label:combat.status==='defeat'?'Accept defeat':'Resolve encounter',className:'button primary',onClick:()=>{finalizeCombat(state);saveGame(state);openEncounter();}});
  else actions.push({label:'Resolving…',className:'button',disabled:true,onClick:()=>{}});
  modal.open({title:encounter.title,content,dismissible:false,actions});assets.guardAll(modal.current.dialog);
}

const combatDelay=()=>state.settings.reducedMotion?0:360;
async function fightCombat(){
  if(busy)return;busy=true;
  const rng=new SeededRng(state.seed,state.rngState);const attack=playerAttack(state,rng);
  if(!attack.ok){busy=false;toast(attack.reason,'error');return;}
  audio.play(attack.hit?'hit':'error');combatVisualPause();
  if(!attack.victory){state.combat.resolving=true;openCombat();await new Promise(resolve=>setTimeout(resolve,combatDelay()));state.combat.resolving=false;enemyAttack(state,rng);if(state.health<=25)haptics.warning();}
  state.rngState=rng.state;saveGame(state);busy=false;renderGame({save:false});openCombat();
}

async function runCombat(abandonGoods){
  if(busy)return;busy=true;
  const rng=new SeededRng(state.seed,state.rngState);const attempt=attemptEscape(state,rng,{abandonGoods});
  if(!attempt.ok){busy=false;toast(attempt.reason,'error');return;}
  if(attempt.escaped){audio.play('escape');haptics.success();}
  else{state.combat.resolving=true;openCombat();await new Promise(resolve=>setTimeout(resolve,combatDelay()));state.combat.resolving=false;enemyAttack(state,rng);audio.play('hit');haptics.warning();}
  state.rngState=rng.state;saveGame(state);busy=false;renderGame({save:false});openCombat();
}

function combatVisualPause(){state.combat.resolving=true;setTimeout(()=>{if(state?.combat)state.combat.resolving=false;},combatDelay());}

function completeEncounter(){
  clearResolvedEncounter(state);modal.close(false);saveGame(state);
  if(state.ended){finishCurrentRun(true);return;}
  renderGame({save:false});
}

function finishCurrentRun(forced=false){
  const result=finishRun(state,{forced});if(!result.ok){toast(result.reason,'error');return;}
  const best=recordBestScore(state);state._isBest=best.isBest;saveGame(state);resetSave(state.mode);modal.close(false);audio.play(state.health===0?'defeat':'victory');renderGame({save:false});resetPageScroll();
}

async function copyText(text,success='Copied.') {
  try{await navigator.clipboard.writeText(text);toast(success);}catch{toast('Copy is unavailable in this browser.','error');}
}

document.addEventListener('submit',event=>{
  if(event.target.id!=='new-game-form')return;event.preventDefault();audio.unlock();
  const data=new FormData(event.target);beginNewGame({mode:data.get('mode'),seed:String(data.get('seed')??'').trim(),sixProductVariant:data.get('sixProductVariant')==='on',audio:data.get('audio')==='on',haptics:data.get('haptics')==='on'});
});

document.addEventListener('input',event=>{
  if(event.target.matches('[data-quantity]')){const id=event.target.dataset.quantity;const n=Number(event.target.value);if(Number.isSafeInteger(n)&&n>0)renderer.quantities.set(id,n);}
});

document.addEventListener('change',event=>{
  const key=event.target.dataset.setting;if(!key||!state)return;
  state.settings[key]=event.target.checked;
  if(key==='audio')audio.setEnabled(event.target.checked);if(key==='haptics')haptics.setEnabled(event.target.checked);if(key==='reducedMotion')applyMotionPreference(event.target.checked);
  saveSettings({audio:state.settings.audio,haptics:state.settings.haptics,reducedMotion:state.settings.reducedMotion});saveGame(state);toast('Setting saved.');
});

document.addEventListener('click',event=>{
  const button=event.target.closest('[data-action]');if(!button||button.disabled)return;audio.unlock();const action=button.dataset.action;
  if(action==='resume')return resumeMode(button.dataset.mode);
  if(action==='qty-minus')return setQuantity(button.dataset.product,quantityFor(button.dataset.product)-1);
  if(action==='qty-plus')return setQuantity(button.dataset.product,quantityFor(button.dataset.product)+1);
  if(action==='qty-max')return setQuantity(button.dataset.product,Math.max(1,maxBuyable(state,button.dataset.product),maxSellable(state,button.dataset.product)));
  if(action==='buy'||action==='sell')return mutateTrade(action,button.dataset.product);
  if(action==='travel')return openTravel();if(action==='travel-destination')return doTravel(button.dataset.destination);
  if(action==='services')return openServices();if(action==='inventory')return openInventory();if(action==='history')return openHistory();if(action==='settings')return openSettings();
  if(action==='service-max'){const input=document.getElementById(button.dataset.target);if(input)input.value=button.dataset.value;return;}
  if(action==='repay-debt')return serviceMutation(repayDebt(state,Number(document.getElementById('loan-amount')?.value)),'sale');
  if(action==='bank-deposit')return serviceMutation(deposit(state,Number(document.getElementById('deposit-amount')?.value)),'purchase');
  if(action==='bank-withdraw')return serviceMutation(withdraw(state,Number(document.getElementById('withdraw-amount')?.value)),'sale');
  if(action==='buy-treatment')return serviceMutation(buyTreatment(state),'purchase');
  if(action==='asset-buy')return serviceMutation(purchaseExtendedAsset(state,button.dataset.asset),'purchase');
  if(action==='asset-sell')return serviceMutation(sellExtendedAsset(state,button.dataset.asset),'sale');
  if(action==='finish-run')return confirmAction({title:'Close Day 30?',text:'Classic inventory will not be auto-liquidated. Your final score is cash + bank − debt.',confirmLabel:'Finish run',onConfirm:()=>finishCurrentRun(false)});
  if(action==='copy-seed')return copyText(state.seed,'Seed copied.');
  if(action==='return-title'){saveGame(state);return showTitle();}
  if(action==='reset-run')return confirmAction({title:'Reset saved run?',text:`Delete only the ${state.mode} save? The other mode and personal best remain.`,confirmLabel:'Reset save',danger:true,onConfirm:()=>{resetSave(state.mode);showTitle('Saved run reset.');}});
  if(action==='play-again')return showTitle();
  if(action==='share-summary'){const summary=shareSummary(state);if(navigator.share)navigator.share({title:'MangoWarz Classic',text:summary}).catch(()=>{});else copyText(summary,'Run summary copied.');}
});

document.getElementById('brand-home').addEventListener('click',()=>{if(state){saveGame(state);showTitle();}});

document.addEventListener('keydown',event=>{
  if(!state||modal.current||event.metaKey||event.ctrlKey||event.altKey||/INPUT|TEXTAREA|SELECT/.test(event.target.tagName))return;
  if(event.key.toLowerCase()==='t'&&state.day<state.maxDay)openTravel();
  if(event.key.toLowerCase()==='s')openServices();
  if(event.key.toLowerCase()==='i')openInventory();
  if(event.key.toLowerCase()==='h')openHistory();
});

function syncInstallButton(){const button=document.getElementById('install-button');if(button)button.hidden=!installPrompt;}
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();installPrompt=event;syncInstallButton();});
document.addEventListener('click',async event=>{if(event.target.id==='install-button'&&installPrompt){await installPrompt.prompt();installPrompt=null;syncInstallButton();}});

if('serviceWorker' in navigator) window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js',{scope:'./'}).then(registration=>{registration.addEventListener('updatefound',()=>{const worker=registration.installing;worker?.addEventListener('statechange',()=>{if(worker.state==='installed'&&navigator.serviceWorker.controller)toast('Update ready. Reload when convenient.');});});}).catch(error=>console.warn('Offline worker unavailable:',error)));

showTitle();
