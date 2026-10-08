import {createCasinoGames,blackjackValue,cardRank,cardSuit,SLOT_SYMBOLS,RED_NUMBERS} from './casino-games.js?v=casino-18';
const SUITS=['♣','♦','♥','♠'],NAMES={slots:'Slots',roulette:'Roulette',poker:'Draw poker',blackjack:'Blackjack'};
export function createCasinoUI(economy,onClose){
 const $=id=>document.getElementById(id),games=createCasinoGames(economy);let selected='slots',bet=10,choice='red',animate=null;
 function button(label,id,action,parent,disabled=false){const b=document.createElement('button');b.textContent=label;b.id=id;b.disabled=disabled;b.onclick=()=>{action();render();};parent.append(b);return b;}
 function text(parent,value,tag='p',cls=''){const e=document.createElement(tag);e.textContent=value;e.className=cls;parent.append(e);return e;}
 function card(parent,c,id,action,held=false){const e=action?button('',id,action,parent):document.createElement('span');if(!action)parent.append(e);const suit=cardSuit(c),rank=cardRank(c);e.className='playing-card'+(suit===1||suit===2?' red':'')+(held?' held':'');e.textContent=(rank===14?'A':rank===13?'K':rank===12?'Q':rank===11?'J':rank)+SUITS[suit];if(action){e.setAttribute('aria-pressed',String(held));text(e,held?'HOLD':'SWAP','small');}return e;}
 function render(){const {pending:r,result:last}=games.info(),result=last?.game===selected?last:null;$('casinoCash').textContent='$'+economy.info().cash.toLocaleString();$('casinoName').textContent=NAMES[selected];
  for(const el of [$('casinoTabs'),$('casinoBets'),$('casinoVisual'),$('casinoChoices'),$('casinoActions')])el.replaceChildren();
  for(const [id,name]of Object.entries(NAMES)){const b=button(name,'casinoTab-'+id,()=>selected=id,$('casinoTabs'),!!r);b.classList.toggle('active',id===selected);b.setAttribute('aria-pressed',String(id===selected));}
  for(const amount of [10,20,50,100]){const b=button('$'+amount,'casinoBet-'+amount,()=>bet=amount,$('casinoBets'),!!r);b.classList.toggle('active',bet===amount);b.setAttribute('aria-pressed',String(bet===amount));}
  const visual=$('casinoVisual');visual.className=animate?'casino-animate-'+animate:'';animate=null;const actions=$('casinoActions'),choices=$('casinoChoices');
  if(selected==='slots'){
   const reels=text(visual,'','div','slot-reels');for(const index of result?.reels||[0,3,4])text(reels,SLOT_SYMBOLS[index],'span','slot-symbol');
   $('casinoRules').textContent='Three matching symbols pay 5× / 10× / 15× / 25× / 50×. Two cherries return your stake. Payouts include the stake.';
  }else if(selected==='roulette'){
   const winner=result?.number,wheel=text(visual,'','div','roulette-wheel');text(wheel,winner===undefined?'SPIN':String(winner),'strong',winner===0?'green':RED_NUMBERS.has(winner)?'red':'');
   for(const pick of ['red','black','even','odd','low','high','first','second','third']){const b=button({low:'1–18',high:'19–36',first:'1–12',second:'13–24',third:'25–36'}[pick]||pick,'roulette-'+pick,()=>choice=pick,choices);b.className='roulette-pick'+(pick==='red'?' red':pick==='black'?' black':'');b.classList.toggle('active',choice===pick);}
   const grid=text(choices,'','div','roulette-grid');for(let n=0;n<=36;n++){const b=button(String(n),'roulette-'+n,()=>choice=n,grid);b.className=n===0?'green':RED_NUMBERS.has(n)?'red':'black';b.classList.toggle('active',choice===n);}
   $('casinoRules').textContent='European wheel · single zero. Number: 35:1. Red/black, odd/even, low/high: 1:1. Dozens: 2:1. Zero loses all outside bets.';
   text(visual,'Bet on '+(typeof choice==='number'?'number '+choice:choice));
  }else if(selected==='poker'){
   const hand=text(visual,'','div','card-hand');for(const [i,c]of (r?.cards||result?.cards||[9,22,35,48,12]).entries())card(hand,c,'pokerHold-'+i,r?()=>games.hold(i):null,!!r?.held[i]);
   $('casinoRules').textContent='Five-card draw · choose HOLD, then draw once. Royal 800× · straight flush 50× · four 25× · full house 9× · flush 6× · straight 4× · three 3× · two pair 2× · jacks-or-better pair 1×. Payouts include the stake.';
   if(r)text(visual,'Hold any cards you want to keep; all others are replaced.');
  }else{
   text(visual,'DEALER','small');const dealer=text(visual,'','div','card-hand');for(const [i,c]of (r?.dealer||result?.dealer||[]).entries()){if(r&&i===1)text(dealer,'?','span','playing-card card-back');else card(dealer,c);}if(!r&&result)text(visual,'Dealer: '+blackjackValue(result.dealer));
   text(visual,'YOUR HAND','small');const player=text(visual,'','div','card-hand');for(const c of r?.player||result?.player||[])card(player,c);if(r||result)text(visual,'Your total: '+blackjackValue((r||result).player));
   $('casinoRules').textContent='Dealer stands on all 17s. Aces count as 1 or 11. Blackjack pays 3:2; ordinary wins 1:1; ties return the stake. Hit or stand · no splits, insurance or double-down.';
  }
  if(r?.game==='blackjack'){button('Hit','casinoHit',()=>games.hit(),actions);button('Stand','casinoPlay',()=>games.stand(),actions);}else if(r?.game==='poker')button('Draw cards','casinoPlay',()=>games.draw(),actions);else button((selected==='slots'?'Spin':selected==='roulette'?'Spin wheel':'Deal')+' · $'+bet,'casinoPlay',()=>{if(games.play(selected,bet,choice))animate=selected;},actions,economy.info().cash<bet);
  $('casinoResult').textContent=r?'Hand in progress · stake $'+r.bet:result?result.message+' · '+(result.payout?'Returned $'+result.payout:'No payout'):'Choose your stake and play.';
  $('casinoResume').textContent=r?'Your hand saves if you leave the table.':'Game cash only · no purchases or cash-out';
 }
 $('casinoLeave').onclick=onClose;
 return{games,open(game){selected=games.info().pending?.game||game;bet=games.info().pending?.bet||bet;$('casinoPanel').hidden=false;render();},hide(){ $('casinoPanel').hidden=true;},render,get menu(){return {menuRoot:$('casinoPanel'),defaultButton:'casinoPlay'};}};
}
