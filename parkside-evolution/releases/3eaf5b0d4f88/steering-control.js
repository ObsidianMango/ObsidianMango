// Touch-wheel gestures and visual feedback are independent of the game loop.
export function createSteeringControl({wheel,art,keys,getPad,isActive,resumeAudio}){
  let pointer=null,angle=0,last=0;
  const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
  const polar=e=>{const r=wheel.getBoundingClientRect();return Math.atan2(e.clientX-r.left-r.width/2,-(e.clientY-r.top-r.height/2));};
  function paint(){
    const pad=getPad()||{},keyboard=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0);
    const visible=keyboard?keyboard*95:pointer!==null?angle:pad.active?pad.steering*135:angle;
    art.style.transform='rotate('+visible+'deg)';
    wheel.setAttribute('aria-valuenow',String(Math.round(visible)));
  }
  wheel.addEventListener('pointerdown',e=>{
    if(!isActive()||pointer!==null)return;
    e.preventDefault();pointer=e.pointerId;last=polar(e);
    wheel.setPointerCapture(e.pointerId);resumeAudio();
  });
  wheel.addEventListener('pointermove',e=>{
    if(e.pointerId!==pointer)return;
    e.preventDefault();const next=polar(e);
    let delta=next-last;
    if(delta>Math.PI)delta-=Math.PI*2;
    if(delta<-Math.PI)delta+=Math.PI*2;
    angle=clamp(angle+delta*180/Math.PI,-135,135);last=next;paint();
  });
  const release=e=>{if(e.pointerId===pointer)pointer=null;};
  for(const name of ['pointerup','pointercancel','lostpointercapture'])wheel.addEventListener(name,release);
  function update(dt){if(pointer===null)angle*=Math.exp(-dt*7);if(Math.abs(angle)<.05)angle=0;paint();}
  function reset(){pointer=null;angle=0;paint();}
  return {get angle(){return angle;},set angle(v){angle=clamp(v,-135,135);},
    get pointer(){return pointer;},set pointer(v){pointer=v;},
    paint,update,reset};
}
