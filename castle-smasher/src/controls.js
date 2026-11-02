// Hand-drawn SVG instruments with touch, mouse and keyboard controls.
const svg=(content)=>`<svg viewBox="0 0 100 100" aria-hidden="true">${content}</svg>`;
const castle='<path d="M34 63V43h7v7h6V38h7v12h6v-7h7v20H54V53h-7v10Z" fill="#d8b464" stroke="#211c17" stroke-width="2"/>';
function instrument(kind){
 const marks=Array.from({length:32},(_,i)=>{const a=i*Math.PI/16,r=i%4?39:36;return `<path d="M${50+Math.sin(a)*r} ${50-Math.cos(a)*r}L${50+Math.sin(a)*43} ${50-Math.cos(a)*43}"/>`;}).join('');
 const face=`<circle cx="50" cy="50" r="47" fill="#171c1b" stroke="#6a4829" stroke-width="4"/><circle cx="50" cy="50" r="43" fill="#252c29" stroke="#e4bd70" stroke-width="1.5"/><g stroke="#bd9857" stroke-width="1">${marks}</g><circle cx="50" cy="50" r="31" fill="#142723" stroke="#6d7357"/>`;
 if(kind==='move')return svg(`${face}<path d="M24 48a26 26 0 0 1 43-18M67 24v8h-8M76 53a26 26 0 0 1-43 18M33 77v-8h8" fill="none" stroke="#e4bd70" stroke-width="2"/>${castle}<g class="dial-hand"><path d="m50 4 5 9H45Z" fill="#fff0b2" stroke="#422c18"/><circle cx="50" cy="50" r="46" fill="none" stroke="#a57237" stroke-width="1"/></g>`);
 if(kind==='bearing')return svg(`${face}<path d="M37 50h26M50 37v26" stroke="#7d9479" stroke-width="1"/><g class="dial-hand"><path d="m50 19 7 28-7-4-7 4Z" fill="#f1ca78" stroke="#34251d" stroke-width="1.5"/><path d="m50 76 4-23-4 2-4-2Z" fill="#8a5641"/><circle cx="50" cy="50" r="6" fill="#d9b675" stroke="#312719" stroke-width="2"/></g>`);
 return svg(`${face}<path d="M21 63H80M30 68v-6M70 68v-6" stroke="#8b9a7c"/><path d="M26 60a29 29 0 0 1 48-32" fill="none" stroke="#e6bf6c" stroke-width="2"/><g class="dial-hand"><path d="M46 46h31v9H46Z" fill="#d4a357" stroke="#28241e" stroke-width="2"/><path d="M75 43v14" stroke="#eee1a8" stroke-width="3"/><circle cx="46" cy="51" r="7" fill="#7c8d83" stroke="#171e1c" stroke-width="2"/></g>`);
}
export class SiegeControls{
 constructor(){this.disabled=false;this.dials=[['moveDial','flight_angle','move',0,360,2],['bearingDial','yaw','bearing',-180,180,2],['elevationDial','elev','elevation',-75,70,1]].map(([id,input,kind,min,max,step])=>{
  const el=document.getElementById(id),native=document.getElementById(input);el.innerHTML=instrument(kind);
  const send=v=>{if(this.disabled)return;native.value=Math.max(min,Math.min(max,v));native.dispatchEvent(new Event('input',{bubbles:true}));};
  const point=e=>{const rect=el.getBoundingClientRect(),x=e.clientX-rect.left-rect.width/2,y=e.clientY-rect.top-rect.height/2;if(Math.hypot(x,y)<rect.width*.16)return;let a=kind==='elevation'?Math.atan2(-y,x)*180/Math.PI:Math.atan2(x,-y)*180/Math.PI;if(kind==='move')a=(a+360)%360;send(Math.round(a));};
  el.addEventListener('pointerdown',e=>{if(this.disabled)return;e.preventDefault();el.setPointerCapture(e.pointerId);point(e);});
  el.addEventListener('pointermove',e=>{if(el.hasPointerCapture(e.pointerId))point(e);});
  el.addEventListener('pointerup',e=>{if(el.hasPointerCapture(e.pointerId))el.releasePointerCapture(e.pointerId);});
  el.addEventListener('keydown',e=>{let v=+native.value;if(['ArrowRight','ArrowUp'].includes(e.key))v+=step;else if(['ArrowLeft','ArrowDown'].includes(e.key))v-=step;else if(e.key==='Home')v=min;else if(e.key==='End')v=max;else return;e.preventDefault();e.stopPropagation();if(kind==='move')v=(v+360)%360;send(v);});
  return {el,native,kind,min,max};
 });
 document.getElementById('fireArt').innerHTML=svg('<path d="m57 10 4 21 17-9-8 19 18 3-20 9 6 16-18-7-3 17-10-17-17 9 7-20-19-3 19-9-5-17 17 8Z" fill="#f3c56b" stroke="#5c211b" stroke-width="2"/><circle cx="49" cy="48" r="13" fill="#3c302b" stroke="#ffe2a3" stroke-width="2"/><path d="m53 35 8-11 7 2" fill="none" stroke="#fff0be" stroke-width="3"/>');
 }
 update(){for(const d of this.dials){const n=+d.native.value;d.el.setAttribute('aria-valuenow',String(n));d.el.setAttribute('aria-valuetext',`${Math.round(n)} degrees`);const hand=d.el.querySelector('.dial-hand');hand.setAttribute('transform',d.kind==='elevation'?`rotate(${-n} 46 51)`:`rotate(${n} 50 50)`);}document.getElementById('power').style.setProperty('--charge',document.getElementById('power').value+'%');}
 setDisabled(disabled){this.disabled=disabled;for(const d of this.dials){d.el.setAttribute('aria-disabled',String(disabled));d.el.tabIndex=disabled?-1:0;}document.getElementById('power').disabled=disabled;}
}
