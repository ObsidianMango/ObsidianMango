// Prevent Safari/browser page zoom while keeping the game's own camera pinch gesture.
export function installTouchGuard(){
 let last=null,start=null;
 const playing=()=>document.body.classList.contains('playing');
 // Menus need native scrolling and taps. Only driving/camera gestures own a swipe.
 const menuTarget=target=>target instanceof Element&&!!target.closest('#intro,#pausePanel,#finish,#wreckPanel,#fatal,#shopPanel,#casinoPanel,#garagePanel');
 document.addEventListener('touchstart',e=>{if(e.touches.length===1){const t=e.touches[0];start={x:t.clientX,y:t.clientY,moved:false};}else{start=null;last=null;}},{passive:true,capture:true});
 document.addEventListener('touchmove',e=>{if(start&&e.touches.length===1){const t=e.touches[0];if(Math.hypot(t.clientX-start.x,t.clientY-start.y)>12)start.moved=true;}if(playing()&&(!menuTarget(e.target)||e.target.closest('#scratchCanvas'))&&e.cancelable)e.preventDefault();},{passive:false,capture:true});
 document.addEventListener('touchend',e=>{if(menuTarget(e.target)){start=null;last=null;return;}if(!start||start.moved||e.touches.length){start=null;return;}const t=e.changedTouches[0],now=performance.now(),rapid=last&&now-last.time<360&&Math.hypot(t.clientX-last.x,t.clientY-last.y)<36;if(rapid&&e.cancelable){e.preventDefault();const button=e.target instanceof Element?e.target.closest('button'):null;if(button&&!button.disabled&&!button.matches('[data-input]'))button.click();}last={x:t.clientX,y:t.clientY,time:now};start=null;},{passive:false,capture:true});
 document.addEventListener('touchcancel',()=>{start=null;last=null;},{passive:true,capture:true});
 document.addEventListener('dblclick',e=>{if(e.cancelable)e.preventDefault();},{passive:false,capture:true});
 for(const type of ['gesturestart','gesturechange','gestureend'])document.addEventListener(type,e=>{if(e.cancelable)e.preventDefault();},{passive:false,capture:true});
 document.addEventListener('contextmenu',e=>{if(playing())e.preventDefault();});
}

