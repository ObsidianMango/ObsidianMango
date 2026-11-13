import { stations, room } from './catalog.js';
import { stock, bar, clubDoor, club, createInventory } from './nightlife.js';
import { featured } from './featured.js';

const get = id => document.getElementById(id);
const view = get('view');
const directory = get('directory');
const vending = get('vending');
const playerDialog = get('player');
const barDialog=get('bar');
const panels = [directory, vending, playerDialog, barDialog];
const inventory=createInventory();
const packGrid = get('packs');
const search = get('set-search');
const allButton = get('set-all');
const moreButton = get('set-more');
const vendingStatus = get('vending-status');
const frameSlot = get('frame-slot');
const frameLoading = get('frame-loading');
const prompt = get('prompt');
const touchUse = get('touch-use');
const map = get('map');
const floorMap = get('floor-map');
const mapCtx = map.getContext('2d');
const vendingStation = stations.find(station => station.id === 'vending');
const keys = new Set();
const joystick = get('joystick');
const stick = get('stick');

let arcade, current, drag, joystickId, audio, loadingTimer;
let joystickX=0, joystickY=0;
let showAll=false, limit=24, dispensing=false, sound=false;
let allSets, loadingSets, setsFailed=false;
let toastTimer, effectTimer, busyUntil=0, nextBeat=0, beat=0;

function beep(notes) {
  if (!sound) return;
  try {
    audio ||= new AudioContext();
    if (audio.state==='suspended') audio.resume().catch(()=>{});
    const start=audio.currentTime;
    notes.forEach((hz,index)=>{
      const oscillator=audio.createOscillator();
      const volume=audio.createGain();
      const time=start+index*.073;
      oscillator.type='triangle';
      oscillator.frequency.value=hz;
      volume.gain.setValueAtTime(.0001,time);
      volume.gain.exponentialRampToValueAtTime(.068,time+.02);
      volume.gain.exponentialRampToValueAtTime(.0001,time+.14);
      oscillator.connect(volume).connect(audio.destination);
      oscillator.start(time);
      oscillator.stop(time+.15);
    });
  } catch {}
}

get('sound').onclick=event=>{
  sound=!sound;
  event.currentTarget.setAttribute('aria-pressed',String(sound));
  event.currentTarget.innerHTML=sound ?
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10v4h4l5 4V6l-5 4H4m12-1c2 1 2 5 0 6m2-9c4 3 4 9 0 12"/></svg>' :
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10v4h4l5 4V6l-5 4H4m12 0 4 4m0-4-4 4"/></svg>';
  beep([392,523]);
};
get('map-button').onclick=event=>{
  floorMap.hidden=!floorMap.hidden;
  event.currentTarget.setAttribute('aria-pressed',String(!floorMap.hidden));
};
get('directory-button').onclick=()=>open(directory);
get('interact').onclick=()=>use(current);
touchUse.onclick=()=>use(current);
get('use-item').onclick=useHeld;
get('toss-item').onclick=tossHeld;
get('cycle-item').onclick=()=>{inventory.next();renderItems();};
get('bar-done').onclick=()=>barDialog.close();

function notify(message) {
  const element=get('nightlife-message');
  element.textContent=message;
  element.hidden=false;
  clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>{element.hidden=true;},2400);
}

function renderItems() {
  const item=inventory.held;
  get('cash').textContent=`$${inventory.cash}`;
  get('held-tools').hidden=!item;
  get('cycle-item').hidden=inventory.count<2;
  get('use-item').hidden=!item?.remaining;
  get('use-item').textContent=item?.shape==='pack'?'Smoke':'Drink';
  get('toss-item').textContent=item?`Toss ${item.remaining ? item.name : item.doses ? 'empty '+item.name.toLowerCase() : item.name}`:'Toss';
  arcade?.props.held(item);
}

function useHeld() {
  if(performance.now()<busyUntil)return;
  const item=inventory.held;
  const result=inventory.use();
  if(!result)return;
  busyUntil=performance.now()+(result==='puke'?1050:480);
  arcade?.props.use(result);
  const count=item.remaining;
  if(result==='puke'){
    notify('Too much. You puked.');
    const fx=get('nightlife-fx');
    fx.classList.add('sick');
    clearTimeout(effectTimer);
    effectTimer=setTimeout(()=>fx.classList.remove('sick'),850);
    beep([183,143,106]);
  } else if(result==='smoke'){
    notify(count?`Lit a cigarette. ${count} left.`:'Lit the last cigarette.');
    beep([418,468]);
  } else {
    notify(count?`${item.name} · ${count} ${count===1?'sip':'sips'} left`:`Finished ${item.name}.`);
    beep([220,290]);
  }
  get('use-item').hidden=!count;
  if(!count)get('toss-item').textContent=`Toss empty ${item.name.toLowerCase()}`;
  updateBuzz();
}

function tossHeld() {
  if(!arcade){notify('Tossing requires the 3D arcade.');return;}
  if(performance.now()<busyUntil)return;
  const item=inventory.toss();
  if(!item)return;
  arcade.props.toss(item);
  renderItems();
  beep([390,251]);
}

function updateBuzz() {
  get('buzz').hidden=inventory.buzz<1;
  get('buzz-level').value=inventory.buzz;
}

function buildBar() {
  for(const item of stock){
    const row=document.createElement('button');
    row.type='button';
    row.className='bar-item';
    row.style.setProperty('--drink-color',item.color);
    const name=document.createElement('strong');
    name.textContent=item.name;
    const detail=document.createElement('small');
    detail.textContent=item.detail;
    const price=document.createElement('b');
    price.textContent=item.price?`$${item.price}`:'Free';
    const icon=document.createElement('span');
    icon.className=`bar-product ${item.shape}`;
    icon.setAttribute('aria-hidden','true');
    row.append(icon,name,detail,price);
    row.onclick=()=>{
      const bought=inventory.buy(item);
      get('bar-message').textContent=bought?`${item.name} is in your hand.`:inventory.cash<item.price?'You’re short on cash.':'Your pockets are full.';
      if(!bought)return;
      get('bar-cash').textContent=`$${inventory.cash} cash`;
      renderItems();
      beep([440,659]);
    };
    get('bar-menu').append(row);
  }
}

function clubMusic() {
  if(!sound || !audio || audio.state!=='running' || arcade.player.z<11.3)return;
  const time=audio.currentTime;
  if(nextBeat>time)return;
  nextBeat=time+.242;
  const offbeat=beat%2;
  const oscillator=audio.createOscillator();
  const volume=audio.createGain();
  oscillator.type=offbeat?'triangle':'sine';
  oscillator.frequency.setValueAtTime(offbeat?[110,123.47,98,130.81][Math.floor(beat/4)%4]:118,time);
  if(!offbeat)oscillator.frequency.exponentialRampToValueAtTime(46,time+.12);
  volume.gain.setValueAtTime(.001,time);
  volume.gain.exponentialRampToValueAtTime(offbeat?.045:.105,time+.009);
  volume.gain.exponentialRampToValueAtTime(.001,time+.16);
  oscillator.connect(volume).connect(audio.destination);
  oscillator.start(time);
  oscillator.stop(time+.17);
  beat++;
}

function clearInput() {
  keys.clear();
  drag=undefined;
  joystickId=undefined;
  joystickX=joystickY=0;
  stick.style.transform='';
}

function open(dialog) {
  clearInput();
  for (const panel of panels) if(panel!==dialog && panel.open)panel.close();
  if(!dialog.open)dialog.showModal();
}

for (const panel of panels) {
  panel.querySelector('[data-close]').onclick=()=>panel.close();
  panel.addEventListener('click',event=>{
    if(panel===playerDialog || event.target!==panel)return;
    const r=panel.getBoundingClientRect();
    if(event.clientX<r.left || event.clientX>r.right || event.clientY<r.top || event.clientY>r.bottom)panel.close();
  });
}
playerDialog.addEventListener('close',()=>{
  clearTimeout(loadingTimer);
  frameSlot.replaceChildren();
});

function play(station, set) {
  const url=new URL(station.url);
  if(set)url.searchParams.set('set',set.code);
  get('game-title').textContent=set ? set.name : station.title;
  get('external').href=url.href;
  const frame=document.createElement('iframe');
  frame.title=set ? `Open a ${set.name} booster pack` : station.title;
  frame.allow='fullscreen; gamepad; autoplay';
  frame.allowFullscreen=true;
  frame.src=url.href;
  frameLoading.textContent='Loading…';
  frameLoading.hidden=false;
  frame.onload=()=>{
    if(!frame.isConnected)return;
    clearTimeout(loadingTimer);
    frameLoading.hidden=true;
  };
  frameSlot.replaceChildren(frame);
  clearTimeout(loadingTimer);
  loadingTimer=setTimeout(()=>{
    frameLoading.textContent='Still loading? Try Open in new tab.';
  },12000);
  open(playerDialog);
}

function use(station) {
  if(!station || dispensing)return;
  beep([330,440]);
  if(station.prop){
    if(!inventory.pick(station.prop.item)){notify('Your pockets are full.');return;}
    arcade.props.pick(station.prop);
    renderItems();
    refreshTarget(null);
    return;
  }
  if(station===bar){
    get('bar-cash').textContent=`$${inventory.cash} cash`;
    get('bar-message').textContent='';
    open(barDialog);
    return;
  }
  if(station===clubDoor){
    if(!arcade){notify('The dance floor requires the 3D arcade.');return;}
    directory.close();
    arcade.enterClub();
    refreshTarget(null);
    return;
  }
  if(station===vendingStation) {
    open(vending);
    renderSets();
  } else play(station);
}

function dispense(set, tile) {
  if(dispensing || !set)return;
  dispensing=true;
  tile?.classList.add('dispensing');
  arcade?.dispense();
  beep([349,440,523,698]);
  if(vending.open)vendingStatus.textContent=`Dispensing ${set.name}…`;
  const wasOpen=vending.open;
  setTimeout(()=>{
    dispensing=false;
    tile?.classList.remove('dispensing');
    if(wasOpen && !vending.open)return;
    play(vendingStation,set);
  },matchMedia('(prefers-reduced-motion:reduce)').matches?20:450);
}

function buildDirectory() {
  const list=get('games');
  for(const station of [...stations,bar,clubDoor]) {
    const card=document.createElement('div');
    card.className='game';
    const icon=new Image();
    icon.src=station.icon;
    icon.alt='';
    icon.onerror=()=>{icon.onerror=null;icon.src='assets/arcade.svg';};
    const label=document.createElement('button');
    label.type='button';label.className='game-name';
    const title=document.createElement('strong');
    title.textContent=station.title;
    const genre=document.createElement('small');
    genre.textContent=station.genre;
    label.append(title,genre);
    label.onclick=()=>use(station);
    const walk=document.createElement('button');
    walk.type='button';walk.className='walk';walk.textContent='↗';
    walk.title=`Go to ${station.title}`;
    walk.setAttribute('aria-label',walk.title);
    walk.hidden=!arcade;
    walk.onclick=()=>{
      arcade.visit(station);
      directory.close();
      refreshTarget(arcade.target());
    };
    card.append(icon,label,walk);
    list.append(card);
  }
}

async function fetchSets() {
  if(allSets || loadingSets)return;
  setsFailed=false;
  loadingSets=true;
  renderSets();
  try {
    const response=await fetch('https://api.scryfall.com/sets',{signal:AbortSignal.timeout(10000)});
    if(!response.ok)throw new Error('Set list unavailable');
    const {data}=await response.json();
    const types=new Set(['core','expansion','masters','draft_innovation','commander','funny']);
    const stock=new Map(featured.map(set=>[set.code,set]));
    allSets=[...featured,...data.filter(set=>types.has(set.set_type) && set.card_count>0 && !stock.has(set.code))
      .map(set=>({code:set.code,name:set.name,icon:set.icon_svg_uri,color:'#a18ae0'}))];
  } catch {setsFailed=true;}
  loadingSets=false;
  renderSets();
}

function renderSets() {
  if(!vending.open || dispensing)return;
  const query=search.value.trim().toLowerCase();
  const expanded=showAll || Boolean(query);
  const stock=expanded && allSets ? allSets : featured;
  const sets=stock.filter(set=>!query || set.name.toLowerCase().includes(query) || set.code.includes(query));
  packGrid.replaceChildren();
  for (const set of sets.slice(0,limit)) {
    const tile=document.createElement('button');
    tile.type='button';
    tile.className='pack';
    tile.style.setProperty('--pack-color',set.color);
    tile.setAttribute('aria-label',`Dispense ${set.name}`);
    const art=new Image();
    art.alt='';
    art.loading='lazy';
    art.src=set.art || set.icon || 'assets/arcade.svg';
    if(!set.art)art.className='symbol';
    art.onerror=()=>{
      art.onerror=null;
      art.className='symbol';
      art.src='assets/arcade.svg';
    };
    const name=document.createElement('b');
    name.textContent=set.name;
    tile.append(art,name);
    tile.onclick=()=>dispense(set,tile);
    packGrid.append(tile);
  }
  allButton.textContent=showAll?'Featured':setsFailed?'Retry all sets':'All sets';
  moreButton.hidden=sets.length<=limit;
  vendingStatus.textContent=expanded && loadingSets ? 'Loading more sets…' :
    expanded && setsFailed ? 'The full set list is unavailable. Featured packs are still here.' :
    sets.length===0 ? 'No sets found.' : '';
}

allButton.onclick=()=>{
  showAll=setsFailed || !showAll;
  search.value='';
  limit=24;
  if(showAll)fetchSets();
  renderSets();
};
search.oninput=()=>{
  limit=24;
  if(search.value.trim() && !setsFailed)fetchSets();
  renderSets();
};
moreButton.onclick=()=>{
  limit+=24;
  renderSets();
};

function refreshTarget(station) {
  if(station===current)return;
  current=station;
  prompt.hidden=!station;
  touchUse.hidden=!station;
  if(!station)return;
  get('target-name').textContent=station.title;
  get('target-action').textContent=station.prop?'Pick up':station===bar?'Buy a drink':station===clubDoor?'Enter dance club':station===vendingStation?'Choose a set':'Play cabinet';
}

window.addEventListener('keydown',event=>{
  if(panels.some(panel=>panel.open) || event.ctrlKey || event.metaKey || event.altKey)return;
  if(event.code==='KeyE' && !event.repeat){if(current)event.preventDefault();use(current);return;}
  if(!event.repeat && ['KeyF','KeyG','KeyQ'].includes(event.code)){
    event.preventDefault();
    if(event.code==='KeyF')useHeld();
    else if(event.code==='KeyG')tossHeld();
    else {inventory.next();renderItems();}
    return;
  }
  if(event.code==='KeyM' && !event.repeat){get('map-button').click();return;}
  if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowLeft','ArrowDown','ArrowRight','ShiftLeft','ShiftRight'].includes(event.code)){
    event.preventDefault();
    keys.add(event.code);
  }
});
window.addEventListener('keyup',event=>keys.delete(event.code));
window.addEventListener('blur',clearInput);
document.addEventListener('visibilitychange',()=>{if(document.hidden)clearInput();});

view.addEventListener('pointerdown',event=>{
  if(!arcade || drag || event.button!==0)return;
  view.setPointerCapture(event.pointerId);
  drag={id:event.pointerId,x:event.clientX,y:event.clientY,length:0};
});
view.addEventListener('pointermove',event=>{
  if(!drag || drag.id!==event.pointerId)return;
  const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
  drag.length+=Math.hypot(dx,dy);
  drag.x=event.clientX;drag.y=event.clientY;
  if(drag.length>5)arcade.aim(dx,dy);
});
view.addEventListener('pointerup',event=>{
  if(!drag || drag.id!==event.pointerId)return;
  const click=drag.length<=5;
  drag=undefined;
  if(!click)return;
  const hit=arcade.select(event.clientX,event.clientY);
  if(hit?.set)dispense(hit.set);
  else if(hit?.station)use(hit.station);
});
view.addEventListener('pointercancel',()=>{drag=undefined;});
view.addEventListener('lostpointercapture',()=>{drag=undefined;});

function steer(event) {
  const r=joystick.getBoundingClientRect();
  const x=event.clientX-(r.left+r.width/2),y=event.clientY-(r.top+r.height/2);
  const reach=34;
  const magnitude=Math.max(reach,Math.hypot(x,y));
  joystickX=x/magnitude;joystickY=-y/magnitude;
  stick.style.transform=`translate(${joystickX*reach}px,${-joystickY*reach}px)`;
}
joystick.addEventListener('pointerdown',event=>{
  if(joystickId!==undefined || event.button!==0)return;
  joystickId=event.pointerId;
  joystick.setPointerCapture(event.pointerId);
  steer(event);
});
joystick.addEventListener('pointermove',event=>{if(event.pointerId===joystickId)steer(event);});
for(const name of ['pointerup','pointercancel','lostpointercapture']){
  joystick.addEventListener(name,event=>{
    if(event.pointerId!==joystickId)return;
    joystickId=undefined;
    joystickX=joystickY=0;
    stick.style.transform='';
  });
}

function drawMap() {
  if(floorMap.hidden)return;
  const {x,z,yaw}=arcade.player;
  const margin=11, width=92, height=96;
  const px=value=>margin+(value-room.minX)/(room.maxX-room.minX)*width;
  const pz=value=>12+(value-room.minZ)/(club.maxZ-room.minZ)*height;
  mapCtx.clearRect(0,0,map.width,map.height);
  const boundary=pz(clubDoor.z);
  mapCtx.fillStyle='#312643';mapCtx.fillRect(10,10,95,boundary-10);
  mapCtx.strokeStyle='#a483aa';mapCtx.strokeRect(10,10,95,boundary-10);
  mapCtx.fillStyle='#532940';mapCtx.fillRect(px(club.minX),boundary,px(club.maxX)-px(club.minX),pz(club.maxZ)-boundary);
  mapCtx.strokeRect(px(club.minX),boundary,px(club.maxX)-px(club.minX),pz(club.maxZ)-boundary);
  for(const station of [...stations,bar,clubDoor]){
    mapCtx.fillStyle=station.color;
    const size=station===vendingStation?10:6;
    mapCtx.fillRect(px(station.x)-size/2,pz(station.z)-3,size,6);
  }
  mapCtx.save();
  mapCtx.translate(px(x),pz(z));
  mapCtx.rotate(-yaw);
  mapCtx.fillStyle='#fff9e6';mapCtx.beginPath();
  mapCtx.moveTo(0,-7);mapCtx.lineTo(4,4);mapCtx.lineTo(0,2);mapCtx.lineTo(-4,4);mapCtx.closePath();mapCtx.fill();
  mapCtx.restore();
  mapCtx.fillStyle='#f0d9ee';mapCtx.font='bold 12px system-ui';mapCtx.fillText('FLOOR',117,30);
  mapCtx.fillText('MAP',117,45);
  mapCtx.fillStyle='#e399f6';mapCtx.fillRect(118,60,7,7);
  mapCtx.fillStyle='#cdbad0';mapCtx.font='11px system-ui';mapCtx.fillText('Packs',129,67);
  mapCtx.fillStyle='#bca2cc';mapCtx.fillText('Club',46,125);
}

function loop(now) {
  const dt=Math.min((now-(loop.last??now))/1000,.05);
  loop.last=now;
  if(!document.hidden && !panels.some(panel=>panel.open)) {
    const side=Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft'));
    const forward=Number(keys.has('KeyW')||keys.has('ArrowUp'))-Number(keys.has('KeyS')||keys.has('ArrowDown'));
    arcade.move(side+joystickX,forward+joystickY,dt,keys.has('ShiftLeft')||keys.has('ShiftRight'));
    inventory.sober(dt);
    arcade.draw(dt,inventory.buzz);
    clubMusic();
    refreshTarget(arcade.target());
    if(now-(loop.mapTime??0)>65){drawMap();updateBuzz();loop.mapTime=now;}
  }
  requestAnimationFrame(loop);
}

buildDirectory();
buildBar();
renderItems();

try {
  const [{createRoom}]=await Promise.all([
    import('./room.js?v=afterglow'),
    Promise.race([document.fonts.load('800 40px "Barlow Condensed"'),new Promise(resolve=>setTimeout(resolve,900))]).catch(()=>{})
  ]);
  arcade=createRoom(view);
  get('games').querySelectorAll('.walk').forEach(button=>{button.hidden=false;});
  addEventListener('resize',arcade.resize);
  get('status').hidden=true;
  requestAnimationFrame(loop);
} catch(error) {
  console.error('Mango Arcade could not start',error);
  get('status').textContent='The 3D arcade could not load. Open Game list to play.';
  floorMap.hidden=true;
  get('map-button').hidden=true;
  get('controls-tip').hidden=true;
  joystick.hidden=true;
  get('reticle').hidden=true;
}
