// Fictional game cash only. One saved ticket prevents rerolling by closing a shop.
export const WEAPONS=[
 {id:'hammer',name:'Hammer',price:40,rounds:0,refill:0,rate:.48,range:2.8,power:10},
 {id:'pistol',name:'Pistol',price:150,rounds:36,refill:25,rate:.27,range:65,power:4},
 {id:'machine',name:'Machine gun',price:450,rounds:180,refill:60,rate:.085,range:85,power:3},
 {id:'grenade',name:'Grenade launcher',price:800,rounds:10,refill:90,rate:.75,range:60,power:24}
];
export function createShopEconomy(storage=localStorage,random=Math.random){
 const key='parkside-street-life-v1';let data={cash:100,owned:[],ammo:{hammer:0,pistol:0,machine:0,grenade:0},equipped:null,ticket:null,serial:0,casinoRound:null,casinoResult:null,casinoStats:{rounds:0,wins:0,wagered:0,returned:0,best:0,played:{slots:0,roulette:0,poker:0,blackjack:0}},casinoHistory:[]};
 try{const s=JSON.parse(storage.getItem(key));if(s&&Number.isFinite(s.cash)){
  data.cash=Math.min(9999999,Math.max(0,Math.floor(s.cash)));data.owned=WEAPONS.filter(w=>s.owned?.includes(w.id)).map(w=>w.id);
  for(const w of WEAPONS)data.ammo[w.id]=Math.min(9999,Math.max(0,Math.floor(Number(s.ammo?.[w.id])||0)));
  data.equipped=data.owned.includes(s.equipped)?s.equipped:data.owned[0]||null;data.serial=Math.max(0,Math.floor(Number(s.serial)||0));
  const r=s.casinoRound;
  if(r&&['poker','blackjack','slots','roulette'].includes(r.game)&&Number.isSafeInteger(r.id)&&r.id>0&&Number.isInteger(r.bet)&&r.bet>=10&&r.bet<=1000){
   const hands=r.hands,all=[...(r.deck||[]),...(r.cards||[]),...(r.player||[]),...(r.dealer||[]),...(hands||[]).flatMap(h=>h.cards||[])],cardsOK=all.length===52&&new Set(all).size===52&&all.every(c=>Number.isInteger(c)&&c>=0&&c<52);
   if(r.game==='poker'&&r.bet<=100&&cardsOK&&r.cards?.length===5&&r.held?.length===5&&r.held.every(v=>typeof v==='boolean'))data.casinoRound=r;
   if(r.game==='blackjack'&&cardsOK&&r.dealer?.length>=2&&(r.player?.length>=2||hands?.length>=1&&hands.length<=2&&Number.isInteger(r.active)&&r.active>=0&&r.active<hands.length&&hands.every(h=>h.cards?.length>=2&&Number.isInteger(h.bet)&&h.bet>=10&&h.bet<=200&&typeof h.done==='boolean')&&hands.reduce((n,h)=>n+h.bet,0)===r.bet))data.casinoRound=r;
   if(r.game==='slots'&&r.bet<=100&&[3,9].includes(r.reels?.length)&&r.reels.every(v=>Number.isInteger(v)&&v>=0&&v<5))data.casinoRound=r;
   if(r.game==='roulette'&&Number.isInteger(r.number)&&r.number>=0&&r.number<=36)data.casinoRound=r;
   data.serial=Math.max(data.serial,r.id);
  }
  if(s.casinoResult&&Number.isFinite(s.casinoResult.payout)&&['slots','roulette','poker','blackjack'].includes(s.casinoResult.game))data.casinoResult=s.casinoResult;
  const stats=s.casinoStats;for(const k of ['rounds','wins','wagered','returned','best'])data.casinoStats[k]=Math.min(1e12,Math.max(0,Math.floor(Number(stats?.[k])||0)));
  for(const game of ['slots','roulette','poker','blackjack'])data.casinoStats.played[game]=Math.min(1e9,Math.max(0,Math.floor(Number(stats?.played?.[game])||0)));
  if(Array.isArray(s.casinoHistory))data.casinoHistory=s.casinoHistory.filter(h=>['slots','roulette','poker','blackjack'].includes(h.game)&&Number.isFinite(h.bet)&&Number.isFinite(h.payout)).slice(-12);

  if(s.ticket&&[0,10,25,100,500].includes(s.ticket.payout)&&Number.isSafeInteger(s.ticket.id))data.ticket={id:s.ticket.id,payout:s.ticket.payout};
 }}catch{}
 const save=()=>{try{storage.setItem(key,JSON.stringify(data));}catch{}};
 const info=()=>({...data,casinoStats:JSON.parse(JSON.stringify(data.casinoStats)),casinoHistory:data.casinoHistory.map(h=>({...h})),owned:[...data.owned],ammo:{...data.ammo},ticket:data.ticket?{...data.ticket}:null,casinoRound:data.casinoRound?JSON.parse(JSON.stringify(data.casinoRound)):null,casinoResult:data.casinoResult?JSON.parse(JSON.stringify(data.casinoResult)):null});
 function earn(amount){data.cash=Math.min(9999999,data.cash+Math.max(0,Math.floor(amount)||0));save();}
 function buy(id){const w=WEAPONS.find(w=>w.id===id);if(!w||data.owned.includes(id)||data.cash<w.price)return false;data.cash-=w.price;data.owned.push(id);data.ammo[id]=w.rounds;data.equipped=id;save();return true;}
 function refill(id){const w=WEAPONS.find(w=>w.id===id);if(!w?.refill||!data.owned.includes(id)||data.cash<w.refill||data.ammo[id]>9999-w.rounds)return false;data.cash-=w.refill;data.ammo[id]+=w.rounds;save();return true;}
 function equip(id){if(!data.owned.includes(id))return false;data.equipped=id;save();return true;}
 function consume(){const w=WEAPONS.find(w=>w.id===data.equipped);if(!w)return null;if(w.rounds){if(!data.ammo[w.id])return null;data.ammo[w.id]--;save();}return w;}
 function buyTicket(){if(data.ticket||data.cash<10)return false;const r=Math.max(0,Math.min(.999999,random()));const payout=r<.6?0:r<.8?10:r<.92?25:r<.98?100:500;data.cash-=10;data.ticket={id:++data.serial,payout};save();return true;}
 function claimTicket(){if(!data.ticket)return null;const payout=data.ticket.payout;data.ticket=null;earn(payout);return payout;}
 function beginRound(game,bet,state){if(data.casinoRound||!Number.isInteger(bet)||bet<10||bet>(game==='roulette'?1000:100)||data.cash<bet)return null;data.cash-=bet;data.casinoRound={...JSON.parse(JSON.stringify(state)),id:++data.serial,game,bet};save();return info().casinoRound;}
 function updateRound(round){if(!data.casinoRound||round.id!==data.casinoRound.id||round.game!==data.casinoRound.game)return false;data.casinoRound={...JSON.parse(JSON.stringify(round)),bet:data.casinoRound.bet};save();return true;}
 function commitRound(round,extra){if(!data.casinoRound||round.id!==data.casinoRound.id||round.game!==data.casinoRound.game||!Number.isInteger(extra)||extra<10||data.cash<extra||round.bet!==data.casinoRound.bet+extra)return false;data.cash-=extra;data.casinoRound=JSON.parse(JSON.stringify(round));save();return true;}
 function settleRound(id,payout,result){if(data.casinoRound?.id!==id||!Number.isFinite(payout)||payout<0)return false;data.casinoResult={...result,payout:Math.floor(payout),id};const bet=data.casinoRound.bet,game=data.casinoRound.game,stats=data.casinoStats;stats.rounds++;stats.wins+=payout>bet?1:0;stats.wagered+=bet;stats.returned+=Math.floor(payout);stats.best=Math.max(stats.best,Math.floor(payout)-bet);stats.played[game]=(stats.played[game]||0)+1;data.casinoHistory.push({game,bet,payout:Math.floor(payout),...(Number.isInteger(result.number)?{number:result.number}:{}),message:result.message});data.casinoHistory=data.casinoHistory.slice(-12);data.casinoRound=null;earn(Math.floor(payout));return true;}
 save();return{beginRound,updateRound,commitRound,settleRound,info,earn,buy,refill,equip,consume,buyTicket,claimTicket};
}
