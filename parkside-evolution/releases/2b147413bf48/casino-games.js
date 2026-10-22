// Fictional cash; outcomes are saved with the wallet before presentation begins.
export const SLOT_SYMBOLS=['CHERRY','BELL','STAR','SEVEN','DIAMOND'];
export const SLOT_ICONS=['🍒','🔔','★','7','◆'];
export const SLOT_PAY=[5,10,15,25,50];
export const SLOT_LINES=[[0,1,2],[3,4,5],[6,7,8],[0,4,8],[6,4,2]];
export const WHEEL_ORDER=[0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];
export const RED_NUMBERS=new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
export const cardRank=c=>c%13+2,cardSuit=c=>Math.floor(c/13);
export function blackjackValue(cards){let total=0,aces=0;for(const c of cards){const r=cardRank(c);if(r===14){total+=11;aces++;}else total+=Math.min(10,r);}while(total>21&&aces){total-=10;aces--;}return total;}
export function pokerRank(cards){
 const ranks=cards.map(cardRank).sort((a,b)=>a-b),counts=new Map();for(const r of ranks)counts.set(r,(counts.get(r)||0)+1);const groups=[...counts.values()].sort((a,b)=>b-a),flush=cards.every(c=>cardSuit(c)===cardSuit(cards[0])),straight=counts.size===5&&(ranks[4]-ranks[0]===4||ranks.join(',')==='2,3,4,5,14');
 if(flush&&straight)return {name:ranks[0]===10?'Royal flush':'Straight flush',pay:ranks[0]===10?800:50};
 if(groups[0]===4)return {name:'Four of a kind',pay:25};if(groups[0]===3&&groups[1]===2)return {name:'Full house',pay:9};if(flush)return {name:'Flush',pay:6};if(straight)return {name:'Straight',pay:4};if(groups[0]===3)return {name:'Three of a kind',pay:3};if(groups[0]===2&&groups[1]===2)return {name:'Two pair',pay:2};if([...counts].some(([r,n])=>n===2&&r>=11))return {name:'Jacks or better',pay:1};return {name:'No paying hand',pay:0};
}
export function roulettePayout(number,choice,bet){if(Number.isInteger(choice))return number===choice?bet*36:0;if(number===0)return 0;const wins=choice==='red'?RED_NUMBERS.has(number):choice==='black'?!RED_NUMBERS.has(number):choice==='even'?number%2===0:choice==='odd'?number%2===1:choice==='low'?number<=18:choice==='high'?number>=19:choice==='first'?number<=12:choice==='second'?number>=13&&number<=24:choice==='third'?number>=25:choice==='col1'?number%3===1:choice==='col2'?number%3===2:choice==='col3'?number%3===0:false;return wins?bet*(['first','second','third','col1','col2','col3'].includes(choice)?3:2):0;}
export const validRouletteChoice=c=>Number.isInteger(c)&&c>=0&&c<=36||['red','black','even','odd','low','high','first','second','third','col1','col2','col3'].includes(c);
export function slotOutcome(reels,bet){
 const lines=reels.length===9?SLOT_LINES:[[0,1,2]],lineBet=bet/lines.length,wins=[];let payout=0;
 lines.forEach((indices,i)=>{const [a,b,c]=indices.map(j=>reels[j]),pay=a===b&&b===c?SLOT_PAY[a]:[a,b,c].filter(v=>v===0).length===2?1:0;if(pay){const amount=Math.floor(lineBet*pay);payout+=amount;wins.push({line:i+1,indices,pay,amount});}});return {payout,wins};
}
export function createCasinoGames(economy,random=Math.random){
 const roll=n=>Math.min(n-1,Math.max(0,Math.floor(random()*n))),deck=()=>{const cards=Array.from({length:52},(_,i)=>i);for(let i=51;i>0;i--){const j=roll(i+1);[cards[i],cards[j]]=[cards[j],cards[i]];}return cards;};
 const pending=()=>economy.info().casinoRound;
 function finish(r,payout,result){return economy.settleRound(r.id,payout,{game:r.game,bet:r.bet,...result});}
 function normalize(r){if(!r.hands){r.hands=[{cards:r.player,bet:r.bet,done:false}];delete r.player;r.active=0;r.unitBet=r.bet;}return r;}
 function blackjackFinish(r){normalize(r);if(r.hands.some(h=>blackjackValue(h.cards)<=21))while(blackjackValue(r.dealer)<17)r.dealer.push(r.deck.pop());const d=blackjackValue(r.dealer);let payout=0;const hands=r.hands.map(h=>{const p=blackjackValue(h.cards),win=p<=21&&(d>21||p>d),push=p<=21&&p===d,returned=win?h.bet*2:push?h.bet:0;payout+=returned;return {...h,payout:returned,message:p>21?'Bust':win?'You win':push?'Push':'Dealer wins'};});return finish(r,payout,{player:hands[0].cards,hands,dealer:r.dealer,message:hands.map((h,i)=>(hands.length>1?'Hand '+(i+1)+': ':'')+h.message).join(' · ')});}
 function advance(r){r.hands[r.active].done=true;const next=r.hands.findIndex(h=>!h.done);if(next<0)return blackjackFinish(r);r.active=next;return economy.updateRound(r);}
 function natural(r){normalize(r);const h=r.hands[0],p=blackjackValue(h.cards)===21,d=blackjackValue(r.dealer)===21;if(r.hands.length===1&&h.cards.length===2&&!h.split&&(p||d))return finish(r,p&&d?r.bet:p?r.bet*2.5:0,{player:h.cards,hands:[h],dealer:r.dealer,message:p&&d?'Push · both blackjack':p?'Blackjack · pays 3:2':'Dealer blackjack'});return false;}
 function instant(r){if(r.game==='slots'){const out=slotOutcome(r.reels,r.bet);return finish(r,out.payout,{reels:r.reels,wins:out.wins,message:out.wins.length?out.wins.length+' winning payline'+(out.wins.length===1?'':'s'):'No paying lines'});}if(r.game==='roulette'){const bets=r.bets||[{choice:r.choice,amount:r.bet}],payout=bets.reduce((v,b)=>v+roulettePayout(r.number,b.choice,b.amount),0);return finish(r,payout,{number:r.number,bets,choice:r.choice,message:r.number===0?'Zero · green':RED_NUMBERS.has(r.number)?'Red '+r.number:'Black '+r.number});}}
 function play(game,bet,choice='red'){
  if(pending()||!['slots','roulette','poker','blackjack'].includes(game)||!Number.isInteger(bet)||bet<10||bet>100||bet%10)return false;
  let bets;if(game==='roulette'){bets=Array.isArray(choice)?choice:[{choice,amount:bet}];if(!bets.length||bets.length>24||bets.some(b=>!validRouletteChoice(b.choice)||!Number.isInteger(b.amount)||b.amount<10||b.amount%10)||bets.reduce((v,b)=>v+b.amount,0)>1000)return false;bet=bets.reduce((v,b)=>v+b.amount,0);}
  let state;if(game==='slots')state={reels:Array.from({length:9},()=>roll(5))};else if(game==='roulette')state={number:roll(37),bets,choice:!Array.isArray(choice)?choice:null};else{const cards=deck();state=game==='poker'?{deck:cards,cards:cards.splice(-5),held:[false,false,false,false,false]}:{deck:cards,hands:[{cards:[cards.pop(),cards.pop()],bet,done:false}],active:0,unitBet:bet,dealer:[cards.pop(),cards.pop()]};}
  const r=economy.beginRound(game,bet,state);if(!r)return false;if(game==='slots'||game==='roulette')return instant(r);if(game==='blackjack'&&natural(r))return true;return true;
 }
 function hit(){const r=pending();if(r?.game!=='blackjack')return false;normalize(r);const h=r.hands[r.active];if(h.done||h.splitAces)return false;h.cards.push(r.deck.pop());return blackjackValue(h.cards)>=21?advance(r):economy.updateRound(r);}
 function stand(){const r=pending();return r?.game==='blackjack'?advance(normalize(r)):false;}
 function double(){const r=pending();if(r?.game!=='blackjack')return false;normalize(r);const h=r.hands[r.active];if(h.cards.length!==2||h.done||h.splitAces||economy.info().cash<h.bet)return false;const extra=h.bet;h.bet*=2;h.cards.push(r.deck.pop());h.doubled=true;h.done=true;r.bet+=extra;if(!economy.commitRound(r,extra))return false;const next=r.hands.findIndex(h=>!h.done);if(next<0)return blackjackFinish(r);r.active=next;return economy.updateRound(r);}
 function split(){const r=pending();if(r?.game!=='blackjack')return false;normalize(r);const h=r.hands[0];if(r.hands.length!==1||h.cards.length!==2||h.done||cardRank(h.cards[0])!==cardRank(h.cards[1])||economy.info().cash<h.bet)return false;const aces=cardRank(h.cards[0])===14;const a={cards:[h.cards[0],r.deck.pop()],bet:h.bet,done:aces,split:true,splitAces:aces},b={cards:[h.cards[1],r.deck.pop()],bet:h.bet,done:aces,split:true,splitAces:aces};a.done=aces||blackjackValue(a.cards)===21;b.done=aces||blackjackValue(b.cards)===21;r.hands=[a,b];r.active=Math.max(0,r.hands.findIndex(h=>!h.done));r.bet+=h.bet;if(!economy.commitRound(r,h.bet))return false;return r.hands.every(h=>h.done)?blackjackFinish(r):economy.updateRound(r);}
 function hold(index){const r=pending();if(r?.game!=='poker'||!Number.isInteger(index)||index<0||index>4)return false;r.held[index]=!r.held[index];return economy.updateRound(r);}
 function draw(){const r=pending();if(r?.game!=='poker')return false;for(let i=0;i<5;i++)if(!r.held[i])r.cards[i]=r.deck.pop();const rank=pokerRank(r.cards);return finish(r,r.bet*rank.pay,{cards:r.cards,message:rank.name});}
 const saved=pending();if(saved?.game==='slots'||saved?.game==='roulette')instant(saved);else if(saved?.game==='blackjack'){normalize(saved);if(!natural(saved)){if(saved.hands.every(h=>h.done))blackjackFinish(saved);else{if(saved.hands[saved.active].done||blackjackValue(saved.hands[saved.active].cards)>=21)advance(saved);else economy.updateRound(saved);}}}
 return{play,hit,stand,double,split,hold,draw,info:()=>({pending:pending(),result:economy.info().casinoResult})};
}
