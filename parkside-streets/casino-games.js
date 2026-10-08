// Small, deterministic rules engine. All bets and outcomes use fictional game cash.
export const SLOT_SYMBOLS=['CHERRY','BELL','STAR','SEVEN','DIAMOND'];
export const SLOT_PAY=[5,10,15,25,50];
export const RED_NUMBERS=new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
export const cardRank=c=>c%13+2,cardSuit=c=>Math.floor(c/13);
export function blackjackValue(cards){let total=0,aces=0;for(const c of cards){const r=cardRank(c);if(r===14){total+=11;aces++;}else total+=Math.min(10,r);}while(total>21&&aces){total-=10;aces--;}return total;}
export function pokerRank(cards){
 const ranks=cards.map(cardRank).sort((a,b)=>a-b),counts=new Map();for(const r of ranks)counts.set(r,(counts.get(r)||0)+1);const groups=[...counts.values()].sort((a,b)=>b-a),flush=cards.every(c=>cardSuit(c)===cardSuit(cards[0])),straight=counts.size===5&&(ranks[4]-ranks[0]===4||ranks.join(',')==='2,3,4,5,14');
 if(flush&&straight)return {name:ranks[0]===10?'Royal flush':'Straight flush',pay:ranks[0]===10?800:50};
 if(groups[0]===4)return {name:'Four of a kind',pay:25};if(groups[0]===3&&groups[1]===2)return {name:'Full house',pay:9};if(flush)return {name:'Flush',pay:6};if(straight)return {name:'Straight',pay:4};if(groups[0]===3)return {name:'Three of a kind',pay:3};if(groups[0]===2&&groups[1]===2)return {name:'Two pair',pay:2};if([...counts].some(([r,n])=>n===2&&r>=11))return {name:'Jacks or better',pay:1};return {name:'No paying hand',pay:0};
}
export function roulettePayout(number,choice,bet){if(Number.isInteger(choice))return number===choice?bet*36:0;if(number===0)return 0;const wins=choice==='red'?RED_NUMBERS.has(number):choice==='black'?!RED_NUMBERS.has(number):choice==='even'?number%2===0:choice==='odd'?number%2===1:choice==='low'?number<=18:choice==='high'?number>=19:choice==='first'?number<=12:choice==='second'?number>=13&&number<=24:choice==='third'?number>=25:false;return wins?bet*(['first','second','third'].includes(choice)?3:2):0;}
export function createCasinoGames(economy,random=Math.random){
 const roll=n=>Math.min(n-1,Math.max(0,Math.floor(random()*n))),deck=()=>{const cards=Array.from({length:52},(_,i)=>i);for(let i=51;i>0;i--){const j=roll(i+1);[cards[i],cards[j]]=[cards[j],cards[i]];}return cards;};
 const pending=()=>economy.info().casinoRound;
 function finish(r,payout,result){return economy.settleRound(r.id,payout,{game:r.game,bet:r.bet,...result});}
 function blackjackFinish(r){while(blackjackValue(r.dealer)<17)r.dealer.push(r.deck.pop());const p=blackjackValue(r.player),d=blackjackValue(r.dealer),win=p<=21&&(d>21||p>d),push=p<=21&&p===d;return finish(r,win?r.bet*2:push?r.bet:0,{player:r.player,dealer:r.dealer,message:p>21?'Bust':win?'You win':push?'Push · stake returned':'Dealer wins'});}
 function play(game,bet,choice='red'){
  if(pending()||!['slots','roulette','poker','blackjack'].includes(game)||!Number.isInteger(bet)||bet<10||bet>100||bet%2)return false;
  if(game==='roulette'&&!(Number.isInteger(choice)&&choice>=0&&choice<=36)&&!['red','black','even','odd','low','high','first','second','third'].includes(choice))return false;
  let state;if(game==='slots')state={reels:[roll(5),roll(5),roll(5)]};else if(game==='roulette')state={number:roll(37),choice};else{const cards=deck();state=game==='poker'?{deck:cards,cards:cards.splice(-5),held:[false,false,false,false,false]}:{deck:cards,player:[cards.pop(),cards.pop()],dealer:[cards.pop(),cards.pop()]};}
  const r=economy.beginRound(game,bet,state);if(!r)return false;
  if(game==='slots'){const [a,b,c]=r.reels,mult=a===b&&b===c?SLOT_PAY[a]:r.reels.filter(v=>v===0).length===2?1:0;return finish(r,bet*mult,{reels:r.reels,message:mult?'Payout ×'+mult:'No matching payout'});}
  if(game==='roulette')return finish(r,roulettePayout(r.number,choice,bet),{number:r.number,choice,message:r.number===0?'Zero · green':RED_NUMBERS.has(r.number)?'Red '+r.number:'Black '+r.number});
  if(game==='blackjack'&&(blackjackValue(r.player)===21||blackjackValue(r.dealer)===21)){const p=blackjackValue(r.player)===21,d=blackjackValue(r.dealer)===21;return finish(r,p&&d?bet:p?bet*2.5:0,{player:r.player,dealer:r.dealer,message:p&&d?'Push · both blackjack':p?'Blackjack · pays 3:2':'Dealer blackjack'});}
  return true;
 }
 function hit(){const r=pending();if(r?.game!=='blackjack')return false;r.player.push(r.deck.pop());if(blackjackValue(r.player)>=21)return blackjackFinish(r);return economy.updateRound(r);}
 function stand(){const r=pending();return r?.game==='blackjack'?blackjackFinish(r):false;}
 function hold(index){const r=pending();if(r?.game!=='poker'||!Number.isInteger(index)||index<0||index>4)return false;r.held[index]=!r.held[index];return economy.updateRound(r);}
 function draw(){const r=pending();if(r?.game!=='poker')return false;for(let i=0;i<5;i++)if(!r.held[i])r.cards[i]=r.deck.pop();const rank=pokerRank(r.cards);return finish(r,r.bet*rank.pay,{cards:r.cards,message:rank.name});}
 const saved=pending();if(saved?.game==='slots'){const [a,b,c]=saved.reels,mult=a===b&&b===c?SLOT_PAY[a]:saved.reels.filter(v=>v===0).length===2?1:0;finish(saved,saved.bet*mult,{reels:saved.reels,message:mult?'Payout ×'+mult:'No matching payout'});}else if(saved?.game==='roulette')finish(saved,roulettePayout(saved.number,saved.choice,saved.bet),{number:saved.number,choice:saved.choice,message:'Wheel: '+saved.number});else if(saved?.game==='blackjack'&&(blackjackValue(saved.player)===21||blackjackValue(saved.dealer)===21)){if(saved.player.length===2&&saved.dealer.length===2){const p=blackjackValue(saved.player)===21,d=blackjackValue(saved.dealer)===21;finish(saved,p&&d?saved.bet:p?saved.bet*2.5:0,{player:saved.player,dealer:saved.dealer,message:p?'Blackjack':'Dealer blackjack'});}else blackjackFinish(saved);}
 return{play,hit,stand,hold,draw,info:()=>({pending:pending(),result:economy.info().casinoResult})};
}
