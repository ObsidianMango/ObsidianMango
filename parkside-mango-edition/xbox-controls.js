// Standard Gamepad mapping: https://w3c.github.io/gamepad/#remapping
// Poll every rendered frame; button edges never run in the fixed-step solver.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const axis=v=>{v=Number.isFinite(v)?clamp(v,-1,1):0;return Math.abs(v)<.14?0:Math.sign(v)*(Math.abs(v)-.14)/.86;};
const value=b=>{const v=typeof b==='number'?b:b?.value;return Number.isFinite(v)?clamp(v,0,1):b?.pressed?1:0;};
const empty=()=>({connected:false,active:false,gas:0,brake:0,steering:0,cameraX:0,cameraY:0,zoom:0,handbrake:false,moveX:0,moveY:0,fire:0});

export function createXboxControls({onAction,onConnection,onMode}){
 let index=null,previous=[],armed=false,active=false,input=empty(),focus=null,focusKey='',root=null,nav='',repeat=0;
 const key=b=>b.id||b.getAttribute('aria-label')||b.textContent;
 function setMode(next){if(active===next)return;active=next;onMode(next);if(!next){focus?.classList.remove('controller-focus');focus=null;}}
 function suspend(){armed=false;input={...empty(),connected:index!==null,active};}
 function disconnect(){if(index===null)return;index=null;previous=[];setMode(false);suspend();root=null;onConnection(false);}
 function buttons(panel){return [...panel.querySelectorAll('button')].filter(b=>!b.disabled&&b.getClientRects().length&&!b.closest('[hidden]'));}
 function focusButton(button){if(!button)return;focus?.classList.remove('controller-focus');focus=button;focusKey=key(button);button.classList.add('controller-focus');button.focus({preventScroll:true});button.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});}
 function menuFocus(panel,defaultButton){
  if(panel!==root){focus?.classList.remove('controller-focus');focus=null;focusKey='';root=panel;nav='';repeat=0;}
  if(!panel||!active)return [];
  const all=buttons(panel);
  if(all.includes(document.activeElement)&&document.activeElement!==focus)focusButton(document.activeElement);
  if(!all.includes(focus))focusButton(all.find(b=>key(b)===focusKey)||all.find(b=>b.id===defaultButton)||all[0]);
  return all;
 }
 function navigate(direction,all){
  if(!focus||!all.length)return;
  const r=focus.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2;
  let next=null,best=Infinity;
  for(const b of all){if(b===focus)continue;const s=b.getBoundingClientRect(),dx=s.left+s.width/2-x,dy=s.top+s.height/2-y;
   const vertical=direction==='up'||direction==='down',along=vertical?dy:dx,cross=vertical?dx:dy,sign=direction==='up'||direction==='left'?-1:1;
   if(along*sign<5)continue;
   // Horizontal moves stay in their row; vertical moves favor their column.
   if(!vertical&&Math.abs(cross)>Math.max(r.height,s.height)*.6)continue;
   const score=Math.abs(along)+Math.abs(cross)*2.5;
   if(score<best){best=score;next=b;}
  }
  focusButton(next);
 }
 function poll(dt,{menuRoot=null,defaultButton='',driving=false,walking=false}={}){
  let pads=[];try{pads=Array.from(navigator.getGamepads?.()||[]);}catch{}
  const supported=p=>p?.connected&&(p.mapping==='standard'||(!p.mapping&&/xbox/i.test(p.id)&&p.buttons.length>=16&&p.axes.length>=4));
  let pad=pads.find(p=>p?.index===index&&supported(p));
  if(index!==null&&!pad){disconnect();return input;}
  if(!pad)pad=pads.find(supported);
  if(!pad)return input;
  if(index===null){index=pad.index;previous=[];armed=false;onConnection(true);}
  const down=Array.from(pad.buttons,b=>!!b?.pressed||value(b)>.5),edges=down.map((v,i)=>v&&!previous[i]),edge=i=>!!edges[i];
  const x=axis(pad.axes[0]),y=axis(pad.axes[1]),cx=axis(pad.axes[2]),cy=axis(pad.axes[3]);
  const gas=value(pad.buttons[7]),brake=value(pad.buttons[6]);
  if(x||y||cx||cy||gas>.02||brake>.02||down.some(Boolean))setMode(true);
  // Require released pedals after a menu, recovery, disconnect or backgrounding.
  if(!armed&&gas<=.02&&brake<=.02&&!down[0])armed=true;
  input={connected:true,active,gas:active&&armed&&driving&&gas>.02?gas:0,brake:active&&armed&&driving&&brake>.02?brake:0,steering:active&&driving?x:0,cameraX:active?cx:0,cameraY:active?cy:0,zoom:active?((down[4]||(!walking&&down[13])?1:0)-(down[5]||down[12]?1:0)):0,handbrake:active&&armed&&driving&&!!down[0]};
  input.moveX=active&&walking?x:0;input.moveY=active&&walking?y:0;input.fire=active&&armed&&walking?gas:0;const all=menuFocus(menuRoot,defaultButton);
  // Store the held state before callbacks: resets must not manufacture new edges.
  previous=down;
  if(menuRoot){
   const direction=down[12]?'up':down[13]?'down':down[14]?'left':down[15]?'right':Math.abs(x)>Math.abs(y)?x<-.5?'left':x>.5?'right':'':y<-.5?'up':y>.5?'down':'';
   repeat-=dt;
   if(direction&&(direction!==nav||repeat<=0)){navigate(direction,all);repeat=direction===nav?.13:.38;}
   if(!direction)repeat=0;nav=direction;
   if(edge(0))focus?.click();
   else if(edge(1))onAction('back');
   else if(edge(9))onAction('menu');
  }else{
   if(edge(9)||edge(1))onAction('pause');
   else if(walking&&edge(13))onAction('hulk');
   else if(walking&&edge(6))onAction('rip');
   else if(walking&&edge(0))onAction('drop');
   else if(edge(2))onAction(walking?'interact':'gear');
   else if(edge(3))onAction(walking?'weapon':'camera');
   else if(edge(8))onAction('interact');
   else if(edge(11))onAction('center');
   else if(edge(14))onAction('reverse');
   else if(edge(15))onAction('drive');
  }
  if(edge(10))onAction('sound');
  return input;
 }
 window.addEventListener('gamepaddisconnected',e=>{if(e.gamepad.index===index)disconnect();});
 window.addEventListener('pointerdown',()=>setMode(false),{passive:true});
 window.addEventListener('keydown',()=>setMode(false));
 return {poll,suspend,getState:()=>({...input})};
}

