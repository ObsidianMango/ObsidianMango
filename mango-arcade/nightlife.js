export const stock = [
  { id:'beer', name:'Lager', detail:'Cold can', price:5, doses:3, strength:26, color:'#f3bc6a', shape:'can' },
  { id:'cocktail', name:'Mango Highball', detail:'Mixed drink', price:8, doses:3, strength:36, color:'#ff9758', shape:'cup' },
  { id:'shot', name:'Whiskey Shot', detail:'Single pour', price:6, doses:1, strength:34, color:'#d68b48', shape:'shot' },
  { id:'water', name:'Water', detail:'Cools you down', price:0, doses:3, strength:-14, color:'#85daf4', shape:'cup' },
  { id:'cigs', name:'Cigarette Pack', detail:'Five cigarettes', price:7, doses:5, color:'#eb6f7e', shape:'pack' }
];

export const looseProps = [
  {id:'ball',name:'Arcade Ball',shape:'ball',color:'#ed824d',x:-4.55,z:7.75},
  {id:'cup',name:'Empty Cup',shape:'cup',color:'#7ab7ef',x:3.35,z:7.95},
  {id:'can',name:'Empty Can',shape:'can',color:'#af89ee',x:-3.2,z:-7.85},
  {id:'glow',name:'Glow Stick',shape:'stick',color:'#9ef798',x:3.4,z:15.1}
];

export const bar = {
  id:'bar',title:'Arcade Bar',genre:'Drinks & cigarettes',x:5.7,z:9.62,turn:Math.PI,color:'#ffd08c',icon:'assets/bar.svg'
};
export const clubDoor = {
  id:'club',title:'Club Afterglow',genre:'Dance floor',x:0,z:10.65,turn:Math.PI,color:'#f281c6',icon:'assets/club.svg'
};
export const club = {minX:-6.6,maxX:6.6,minZ:10.34,maxZ:22.65};
export const doorwayHalf = 1.18;

export function createInventory() {
  let cash=60, buzz=0, held;
  const items=[];
  function add(item) {
    held={...item, remaining:item.doses || 0};
    items.push(held);
  }
  function remove() {
    const item=held;
    items.splice(items.indexOf(item),1);
    held=items.at(-1);
    return item;
  }
  return {
    get cash(){return cash;},
    get buzz(){return buzz;},
    get held(){return held;},
    get count(){return items.length;},
    buy(item){
      if(cash<item.price || items.length>=12)return false;
      cash-=item.price;
      add(item);
      return true;
    },
    pick(item) {
      if(items.length>=12)return false;
      add(item);
      held.remaining=item.remaining;
      return true;
    },
    next(){
      if(items.length>1)held=items[(items.indexOf(held)+1)%items.length];
    },
    toss(){return held && remove();},
    use(){
      if(!held?.remaining)return null;
      const item=held;
      item.remaining--;
      if(item.shape==='pack')return 'smoke';
      buzz=Math.max(0,buzz+item.strength/item.doses);
      if(buzz>=90){
        buzz=32;
        return 'puke';
      }
      return 'drink';
    },
    sober(dt){buzz=Math.max(0,buzz-dt*.19);}
  };
}
