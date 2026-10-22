// Ten different games, identical $10 price and 40% winning / unchanged prize distribution.
export const SCRATCH_GAMES=[
 {id:'numbers',name:'Golden Numbers',color:'#c39328',accent:'#602266',rule:'Match any YOUR NUMBER to a WINNING NUMBER. Win the prize below it.'},
 {id:'triples',name:'Triple Treasure',color:'#305e9d',accent:'#b57e22',rule:'Match all three symbols in a row to win that row’s prize.'},
 {id:'tictac',name:'Cash Tic-Tac-Toe',color:'#b64058',accent:'#343c7f',rule:'Find three $ symbols across, down or diagonally. Win the prize.'},
 {id:'symbols',name:'Lucky Charms',color:'#37836b',accent:'#713d84',rule:'Match a YOUR SYMBOL to either LUCKY SYMBOL. Win its prize.'},
 {id:'race',name:'Finish Line',color:'#b0462f',accent:'#284f75',rule:'YOUR CAR must finish ahead of RIVAL. The higher speed wins the row prize.'},
 {id:'twentyone',name:'Pocket 21',color:'#275e52',accent:'#ac7728',rule:'Add the three card values in each row. Exactly 21 wins its prize.'},
 {id:'seven',name:'Seven Strikes',color:'#704c9e',accent:'#c66823',rule:'Find a 7 in any play to win the prize below it.'},
 {id:'dice',name:'Double Dice',color:'#3b6987',accent:'#ab446c',rule:'Roll doubles: both dice in a play must match to win its prize.'},
 {id:'vault',name:'Vault Breaker',color:'#355273',accent:'#b68632',rule:'Match a VAULT CODE to the winning three-digit combination. Win its prize.'},
 {id:'diamonds',name:'Diamond Mine',color:'#348b99',accent:'#64458a',rule:'Find at least three diamonds anywhere in the mine. Win the prize.'}
];
export const TICKET_WIDTH=360,TICKET_HEIGHT=560,CELLS_PER_ZONE=96;
function seeded(seed){let s=seed>>>0;return n=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return Math.floor(s/4294967296*n);};}
export function createScratchBoard(ticket){
 const design=SCRATCH_GAMES.find(g=>g.id===ticket.design)||SCRATCH_GAMES[0],roll=seeded(ticket.seed??Math.imul(ticket.id,7919)),won=ticket.payout>0,winner=roll(9),plays=[],zones=[],lucky=[];
 const distinct=(n,avoid=[])=>{const pool=Array.from({length:n},(_,i)=>i+1).filter(v=>!avoid.includes(v));return pool.splice(roll(pool.length),1)[0];},prize=()=>[10,25,100,500][roll(4)];
 const addZone=(x,y,w,h,lines,play=-1)=>zones.push({x,y,w,h,lines,play});
 if(design.id==='numbers'){while(lucky.length<4){const n=distinct(49,lucky);lucky.push(n);}addZone(18,147,158,50,['WINNING NUMBERS',lucky.slice(0,2).join('   ')]);addZone(184,147,158,50,['WINNING NUMBERS',lucky.slice(2).join('   ')]);for(let i=0;i<9;i++)plays.push({values:[won&&i===winner?lucky[roll(4)]:distinct(49,lucky)],prize:won&&i===winner?ticket.payout:prize()});}
 else if(design.id==='symbols'){lucky.push(roll(8),0);lucky[1]=(lucky[0]+1+roll(7))%8;addZone(18,147,158,50,['LUCKY SYMBOL',symbol(lucky[0])]);addZone(184,147,158,50,['LUCKY SYMBOL',symbol(lucky[1])]);for(let i=0;i<9;i++){let v;do{v=roll(8);}while(lucky.includes(v));plays.push({values:[won&&i===winner?lucky[roll(2)]:v],prize:won&&i===winner?ticket.payout:prize()});}}
 else if(design.id==='vault'){lucky.push(100+roll(900));addZone(18,147,324,50,['WINNING COMBINATION',String(lucky[0])]);for(let i=0;i<9;i++){let v;do{v=100+roll(900);}while(v===lucky[0]);plays.push({values:[won&&i===winner?lucky[0]:v],prize:won&&i===winner?ticket.payout:prize()});}}
 else if(design.id==='tictac'){const values=[0,1,0,1,0,1,1,0,1];if(won){const line=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]][roll(8)];for(const i of line)values[i]=1;}for(const v of values)plays.push({values:[v]});addZone(18,147,324,50,['LINE PRIZE','$'+(won?ticket.payout:prize())]);}
 else if(design.id==='diamonds'){const chosen=new Set(),count=won?3+roll(3):roll(3);while(chosen.size<count)chosen.add(roll(9));for(let i=0;i<9;i++)plays.push({values:[chosen.has(i)?1:0]});addZone(18,147,324,50,['MINE PRIZE','$'+(won?ticket.payout:prize())]);}
 else{
  addZone(18,147,324,50,['NINE PLAYS · SCRATCH EACH PANEL',design.id==='race'?'YOUR CAR  >  RIVAL':design.id==='twentyone'?'TOTAL 21':design.id==='dice'?'MATCH BOTH DICE':design.id==='seven'?'FIND A 7':'MATCH THREE SYMBOLS']);
  zones[0].covered=false;
  for(let i=0;i<9;i++){const win=won&&i===winner;let values;
   if(design.id==='triples'){const a=roll(8);values=[a,win?a:(a+1+roll(7))%8,win?a:roll(8)];}
   if(design.id==='race'){const rival=80+roll(40);values=[win?rival+1+roll(20):rival-1-roll(20),rival];}
   if(design.id==='twentyone'){values=win?[7,7,7]:[2+roll(9),2+roll(9),2+roll(9)];if(!win&&values.reduce((a,b)=>a+b,0)===21)values[0]=values[0]===10?9:values[0]+1;}
   if(design.id==='seven'){let n=1+roll(14);if(n===7)n=8;values=[win?7:n];}
   if(design.id==='dice'){const a=1+roll(6);values=[a,win?a:a%6+1];}
   plays.push({values,prize:win?ticket.payout:prize()});
  }
 }
 plays.forEach((p,i)=>{const text=design.id==='triples'?p.values.map(symbol).join(' '):design.id==='symbols'?symbol(p.values[0]):design.id==='tictac'?p.values[0]?'$':'X':design.id==='diamonds'?p.values[0]?'◆':'●':design.id==='dice'?p.values.map(v=>['','⚀','⚁','⚂','⚃','⚄','⚅'][v]).join('  '):design.id==='race'?p.values.join(' > '):p.values.join(' + ');addZone(18+i%3*110,218+Math.floor(i/3)*84,104,75,[design.id==='race'?'YOU  /  RIVAL':'PLAY '+(i+1),text,p.prize?'$'+p.prize:''],i);});
 return {design,plays,lucky,zones,payout:ticket.payout};
}
function symbol(n){return ['★','♣','♥','◆','☀','☘','♠','●'][n];}
export function evaluateScratchBoard(board){const id=board.design.id,p=board.plays;
 if(id==='tictac'){const wins=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]].some(line=>line.every(i=>p[i].values[0]===1));return wins?Number(board.zones[0].lines[1].slice(1)):0;}
 if(id==='diamonds')return p.filter(p=>p.values[0]===1).length>=3?Number(board.zones[0].lines[1].slice(1)):0;
 return p.reduce((total,p)=>{const v=p.values,win=id==='numbers'||id==='symbols'||id==='vault'?board.lucky.includes(v[0]):id==='triples'?v.every(n=>n===v[0]):id==='race'?v[0]>v[1]:id==='twentyone'?v.reduce((a,b)=>a+b,0)===21:id==='seven'?v[0]===7:v[0]===v[1];return total+(win?p.prize:0);},0);
}
export function ticketProgress(ticket,board=createScratchBoard(ticket)){const cells=new Set(ticket.scratched||[]);let revealed=0,total=0;for(let i=0;i<board.zones.length;i++){if(board.zones[i].covered===false)continue;total++;let count=0;for(let j=0;j<CELLS_PER_ZONE;j++)if(cells.has(i*CELLS_PER_ZONE+j))count++;if(count>=CELLS_PER_ZONE*.62)revealed++;}return {revealed,total,complete:revealed===total};}
