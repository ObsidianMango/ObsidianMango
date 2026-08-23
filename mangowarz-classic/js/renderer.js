import { LOCATION_BY_ID, PRODUCT_BY_ID, WEAPON_BY_ID, enabledProducts } from './config.js?v=8';
import { freeCapacity, totalCapacity, usedCapacity } from './state.js';
import { finalScore } from './scoring.js';
import { maxBuyable, maxSellable } from './trading.js';
import { formatMoney } from './utils.js';

const escapeHtml=value=>String(value??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const pixelAsset=(path,label='',className='')=>`<img class="${className}" src="assets/classic-ui/${path}.svg" alt="${escapeHtml(label)}">`;

export class Renderer {
  constructor({main,header,status,actions}){
    this.main=main;
    this.header=header;
    this.status=status;
    this.actions=actions;
    this.quantities=new Map();
  }

  showChrome(showStatus=false){
    this.header.hidden=true;
    this.status.hidden=!showStatus;
    this.actions.hidden=true;
  }

  renderTitle({classicSave=null,settings={},notice=''}){
    this.showChrome(false);
    const resume=classicSave?`<button class="arcade-button" type="button" data-action="resume" data-mode="classic">CONTINUE <small>DAY ${classicSave.day}</small></button>`:'';
    this.main.innerHTML=`<section class="title-screen arcade-screen" aria-labelledby="game-title">
      <div class="title-lockup">
        <h1 id="game-title"><span>MANGO</span><span>WARZ</span></h1>
        <p>NEW YORK CITY <i aria-hidden="true">◆</i> 1985</p>
      </div>
      <figure class="title-city">${pixelAsset('title-city','Pixel-art New York skyline with a subway entrance and briefcase')}</figure>
      ${notice?`<p class="arcade-notice" role="alert">${escapeHtml(notice)}</p>`:''}
      <form id="new-game-form" class="title-menu">
        <input type="hidden" name="mode" value="classic">
        <button class="arcade-button primary" type="submit">NEW GAME</button>
        ${resume}
        <button class="arcade-button" type="button" data-action="how-to-play">HOW TO PLAY</button>
        <details class="setup-panel"><summary>SETUP &amp; DEBUG</summary><div class="form-stack">
          <label class="check-row"><input type="checkbox" name="sixProductVariant"><span><b>SIX-PRODUCT VARIANT</b><small>Use the compact historical market.</small></span></label>
          <label class="field" for="seed-input"><span>KNOWN SEED</span><input id="seed-input" name="seed" autocomplete="off" spellcheck="false" placeholder="RANDOM"></label>
          <div class="two-col"><label class="check-row"><input type="checkbox" name="audio" ${settings.audio!==false?'checked':''}><span><b>SOUND</b></span></label><label class="check-row"><input type="checkbox" name="haptics" ${settings.haptics!==false?'checked':''}><span><b>HAPTICS</b></span></label></div>
        </div></details>
      </form>
      <button id="install-button" class="arcade-button install-button" type="button" hidden>INSTALL GAME</button>
      <p class="title-tagline">30 DAYS. ONE WAY OUT.</p>
    </section>`;
  }

  renderStatus(state){
    const used=usedCapacity(state),total=totalCapacity(state);
    this.status.innerHTML=`
      <div class="status-item"><span>DAY</span><strong>${String(state.day).padStart(2,'0')}/${state.maxDay}</strong></div>
      <div class="status-item location"><span>LOCATION</span><strong>${escapeHtml(LOCATION_BY_ID[state.location].name).toUpperCase()}</strong></div>
      <div class="status-item cash"><span>CASH</span><strong>${formatMoney(state.cash)}</strong></div>
      <div class="status-item debt"><span>DEBT</span><strong>${formatMoney(state.debt)}</strong></div>
      <div class="status-item health ${state.health<=25?'critical':''}"><span>HEALTH</span><strong>${state.health}</strong></div>
      <div class="status-item coat"><span>COAT</span><strong>${used}/${total}</strong></div>`;
  }

  renderGame(state,{view='home',selectedProductId=null,selectedDestination=null}={}){
    this.showChrome(view==='home');
    if(view==='home'){
      this.renderStatus(state);
      this.renderHub(state);
    }else if(view==='market')this.renderMarket(state,selectedProductId);
    else if(view==='travel')this.renderTravel(state,selectedDestination);
    else this.renderHub(state);
  }

  renderHub(state){
    const location=LOCATION_BY_ID[state.location];
    const loanAvailable=state.location==='bronx';
    const bankAvailable=state.location==='manhattan';
    this.main.innerHTML=`<section class="hub-screen arcade-screen" aria-label="${escapeHtml(location.name)} street hub">
      <figure class="location-scene">${pixelAsset(`locations/${state.location}`,`Pixel-art ${location.name} street scene`)}</figure>
      <div class="hub-menu" aria-label="Neighborhood actions">
        ${this.hubAction('open-market','icons/market','MARKET','Browse local prices','green')}
        ${this.hubAction('open-travel','icons/travel','TRAVEL','Choose a neighborhood','blue',state.day>=state.maxDay||state.ended)}
        ${this.hubAction('service-bank','icons/bank','BANK',bankAvailable?`BAL ${formatMoney(state.bank)}`:'MANHATTAN ONLY','cyan',!bankAvailable)}
        ${this.hubAction('service-loan','icons/loan','LOAN SHARK',loanAvailable?`OWED ${formatMoney(state.debt)}`:'BRONX ONLY','red',!loanAvailable)}
        ${this.hubAction('service-clinic','icons/clinic','HOSPITAL',state.health<100?`${state.health}/100 HEALTH`:'HEALTH FULL','red')}
        ${this.hubAction('inventory','icons/stats','STATS',`${state.stats.unitsBought} BOUGHT · ${state.stats.unitsSold} SOLD`,'gold')}
      </div>
      <div class="hub-tools"><button data-action="history">${pixelAsset('icons/log','')}<span>EVENT LOG</span></button><button data-action="settings">${pixelAsset('icons/options','')}<span>OPTIONS</span></button></div>
      ${state.day===state.maxDay?`<button class="arcade-button primary finish-button" data-action="finish-run">FINISH DAY 30</button>`:''}
      <footer class="screen-footer"><span>BANK ${formatMoney(state.bank)}</span><span>GUNS ${state.weapons.length}</span><span>PRICES CHANGE WHEN YOU TRAVEL</span></footer>
    </section>`;
  }

  hubAction(action,asset,label,meta,tone,disabled=false){
    return `<button class="hub-action ${tone}" data-action="${action}" ${disabled?'disabled':''}>${pixelAsset(asset,'')}<span><b>${label}</b><small>${meta}</small></span></button>`;
  }

  renderMarket(state,selectedProductId){
    const products=enabledProducts(state.settings).filter(product=>state.market?.rows?.[product.id]?.available||(state.inventory[product.id]??0)>0);
    const fallback=products.find(product=>state.market?.rows?.[product.id]?.available)?.id??null;
    const activeId=products.some(product=>product.id===selectedProductId&&state.market?.rows?.[product.id]?.available)?selectedProductId:fallback;
    const rows=products.map(product=>this.marketRow(state,product,product.id===activeId)).join('');
    const activeProduct=activeId?PRODUCT_BY_ID[activeId]:null;
    const activeRow=activeId?state.market.rows[activeId]:null;
    const buyMax=activeId?maxBuyable(state,activeId):0;
    const sellMax=activeId?maxSellable(state,activeId):0;
    const quantity=activeId?(this.quantities.get(activeId)??1):1;
    this.main.innerHTML=`<section class="market-screen arcade-screen" aria-label="Street market">
      <header class="screen-title"><h1>STREET MARKET</h1></header>
      <div class="screen-readout"><strong>${escapeHtml(LOCATION_BY_ID[state.location].name).toUpperCase()}</strong><span>CASH ${formatMoney(state.cash)}</span><span>SPACE ${freeCapacity(state)}</span></div>
      <div class="market-table">
        <div class="market-row market-heading" aria-hidden="true"><span>GOODS</span><span>PRICE</span><span>OWN</span></div>
        <div class="market-viewport">${rows}</div>
      </div>
      <div class="market-console" aria-label="Trade controls">
        <div class="selected-readout"><span>${activeProduct?escapeHtml(activeProduct.name).toUpperCase():'NO GOODS SELECTED'}</span><strong>${activeRow?formatMoney(activeRow.price):'—'}</strong></div>
        <div class="quantity-line">
          <button class="pixel-qty" data-action="qty-minus" data-product="${activeId??''}" ${activeId?'':'disabled'} aria-label="Decrease quantity">−</button>
          <input class="qty-input" data-quantity="${activeId??''}" inputmode="numeric" pattern="[0-9]*" value="${quantity}" ${activeId?'':'disabled'} aria-label="Trade quantity">
          <button class="pixel-qty" data-action="qty-plus" data-product="${activeId??''}" ${activeId?'':'disabled'} aria-label="Increase quantity">+</button>
        </div>
        <div class="market-actions">
          <button class="arcade-button buy" data-action="buy" data-product="${activeId??''}" ${buyMax===0?'disabled':''}>BUY <small>MAX ${buyMax}</small></button>
          <button class="arcade-button sell" data-action="sell" data-product="${activeId??''}" ${sellMax===0?'disabled':''}>SELL <small>MAX ${sellMax}</small></button>
          <button class="arcade-button max" data-action="qty-auto-max" data-product="${activeId??''}" data-buy-max="${buyMax}" data-sell-max="${sellMax}" ${buyMax===0&&sellMax===0?'disabled':''}>MAX</button>
          <button class="arcade-button" data-action="screen-back">BACK</button>
        </div>
      </div>
      <footer class="screen-footer market-message">${escapeHtml(state.ticker)}</footer>
    </section>`;
  }

  marketRow(state,product,selected=false){
    const row=state.market?.rows?.[product.id];
    const available=Boolean(row?.available);
    const owned=state.inventory[product.id]??0;
    const event=row?.event??'ordinary';
    const stateText=event==='cheap'?'FLOOD':event==='expensive'?'SHORTAGE':'';
    return `<button type="button" class="market-row ${selected?'selected':''} ${available?'':'unavailable'}" data-event="${event}" data-action="trade-product" data-product="${product.id}" ${available?'':'disabled'} aria-pressed="${selected}" aria-label="${escapeHtml(product.name)}, ${available?`${formatMoney(row.price)}, ${owned} owned`:'not for sale'}, ${stateText}">
      <span class="goods-cell">${pixelAsset(`products/${product.id}`,'')}<span><b>${escapeHtml(product.name).toUpperCase()}</b>${stateText?`<small>${stateText}</small>`:''}</span></span>
      <span class="market-price">${available?formatMoney(row.price):'—'}</span>
      <span class="market-owned">${owned}</span>
    </button>`;
  }

  renderTravel(state,selectedDestination){
    const candidates=Object.values(LOCATION_BY_ID);
    const fallback=candidates.find(location=>location.id!==state.location)?.id??null;
    const active=candidates.some(location=>location.id===selectedDestination&&location.id!==state.location)?selectedDestination:fallback;
    const rows=candidates.map(location=>`<button class="subway-stop ${location.id===active?'selected':''} ${location.id===state.location?'current':''}" data-action="select-destination" data-destination="${location.id}" ${location.id===state.location?'disabled':''} aria-pressed="${location.id===active}"><span>${escapeHtml(location.name).toUpperCase()}</span>${location.id===state.location?'<small>YOU ARE HERE</small>':''}</button>`).join('');
    this.main.innerHTML=`<section class="travel-screen arcade-screen" aria-label="Subway map">
      <header class="screen-title"><h1>SUBWAY MAP</h1></header>
      <div class="screen-readout"><span>DAY ${String(state.day).padStart(2,'0')}/${state.maxDay}</span><strong>FARE $0</strong></div>
      <figure class="subway-map">${pixelAsset('subway-map','Abstract pixel-art subway map')}</figure>
      <div class="subway-list">${rows}</div>
      <div class="travel-actions"><button class="arcade-button buy" data-action="travel-confirm" data-destination="${active??''}" ${active?'':'disabled'}>TRAVEL</button><button class="arcade-button danger" data-action="screen-back">CANCEL</button></div>
      <footer class="screen-footer">TRAVEL ENDS THE DAY</footer>
    </section>`;
  }

  renderFinal(state,isBest=false){
    this.showChrome(false);
    const score=state.stats.finalScore??finalScore(state);
    const remaining=Object.entries(state.inventory).filter(([,quantity])=>quantity>0).map(([id,quantity])=>`${PRODUCT_BY_ID[id].name} ×${quantity}`).join(', ')||'None';
    const weapons=state.weapons.map(id=>WEAPON_BY_ID[id]?.name).filter(Boolean).join(', ')||'None';
    this.main.innerHTML=`<section class="final-screen arcade-screen">
      <header class="screen-title"><h1>${state.health===0?'GAME OVER':'RUN COMPLETE'}</h1></header>
      <div class="final-score"><span>FINAL SCORE</span><strong>${formatMoney(score)}</strong>${isBest?'<b>NEW PERSONAL BEST</b>':''}<small>SEED ${escapeHtml(state.seed)}</small></div>
      <div class="score-grid"><div><span>CASH</span><b>${formatMoney(state.cash)}</b></div><div><span>BANK</span><b>${formatMoney(state.bank)}</b></div><div><span>DEBT</span><b>${formatMoney(state.debt)}</b></div><div><span>HEALTH</span><b>${state.health}/100</b></div><div><span>COAT</span><b>${freeCapacity(state)} FREE / ${totalCapacity(state)}</b></div><div><span>TRIPS</span><b>${state.trips}</b></div><div><span>BOUGHT / SOLD</span><b>${state.stats.unitsBought} / ${state.stats.unitsSold}</b></div><div><span>POLICE / ESCAPES</span><b>${state.stats.policeEncounters} / ${state.stats.successfulEscapes}</b></div><div><span>COMBAT WINS</span><b>${state.stats.combatVictories}</b></div><div><span>WEAPONS</span><b>${escapeHtml(weapons)}</b></div></div>
      <div class="final-inventory"><span>REMAINING GOODS</span><p>${escapeHtml(remaining)}</p></div>
      <div class="final-actions"><button class="arcade-button primary" data-action="play-again">PLAY AGAIN</button><button class="arcade-button sell" data-action="share-summary">COPY SCORE</button></div>
    </section>`;
  }
}

export { escapeHtml, pixelAsset as icon };
