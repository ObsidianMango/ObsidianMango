import * as THREE from './vendor/three.module.js';
import {createSquirrel} from './squirrel.js?v=visitors-1';
import {createWoodland} from './woodland.js';
import {GrovePhysics} from './physics.js?v=visitors-1';
import {GroveAudio} from './audio.js?v=visitors-1';
import {GroveVisitors} from './visitors.js?v=visitors-1';
import {height,clamp,lerp,angleLerp,canvasTexture} from './utils.js';

const $=id=>document.getElementById(id),canvas=$('world'),audio=new GroveAudio();
let renderer;
try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});}catch(error){$('loading').classList.add('hidden');$('fatal').classList.remove('hidden');throw error}
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();scene.background=new THREE.Color('#bbc9ab');scene.fog=new THREE.FogExp2('#bbc9ab',.023);
const camera=new THREE.PerspectiveCamera(43,innerWidth/innerHeight,.08,130);
scene.add(new THREE.HemisphereLight('#e8f1d9','#5e6043',2.1));
const sun=new THREE.DirectionalLight('#ffe1ac',3.25);sun.position.set(-12,23,12);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-20;sun.shadow.camera.right=20;sun.shadow.camera.top=20;sun.shadow.camera.bottom=-20;sun.shadow.camera.near=1;sun.shadow.camera.far=70;sun.shadow.bias=-.0003;sun.shadow.normalBias=.025;sun.shadow.radius=3;scene.add(sun);scene.add(sun.target);
const fill=new THREE.DirectionalLight('#c8e0e0',.68);fill.position.set(8,7,-9);scene.add(fill);
const woodland=createWoodland(scene),physics=new GrovePhysics(scene,woodland),squirrel=createSquirrel();scene.add(squirrel.root);squirrel.root.position.copy(woodland.start);squirrel.root.rotation.y=.38;
const visitors=new GroveVisitors(scene,physics,woodland);
const visitorLabels=visitors.visitors.map(v=>{const label=document.createElement('div');label.className='visitor-bubble';label.hidden=true;$('gameUI').appendChild(label);return label});
const heroNut=physics.factory(0);heroNut.name='Squirrel portrait acorn';scene.add(heroNut);
const contactTex=canvasTexture((ctx,s)=>{const g=ctx.createRadialGradient(s/2,s/2,s*.03,s/2,s/2,s*.49);g.addColorStop(0,'rgba(22,33,17,.48)');g.addColorStop(1,'rgba(22,33,17,0)');ctx.fillStyle=g;ctx.fillRect(0,0,s,s)},128);
const contactShadow=new THREE.Mesh(new THREE.PlaneGeometry(1.8,1.7),new THREE.MeshBasicMaterial({map:contactTex,transparent:true,depthWrite:false}));contactShadow.rotation.x=-Math.PI/2;scene.add(contactShadow);
const highlight=new THREE.Mesh(new THREE.TorusGeometry(.28,.012,6,40),new THREE.MeshBasicMaterial({color:'#f2d598',transparent:true,opacity:.8}));highlight.rotation.x=-Math.PI/2;highlight.visible=false;scene.add(highlight);
const sparkleTex=canvasTexture((ctx,s)=>{const g=ctx.createRadialGradient(s/2,s/2,0,s/2,s/2,s*.5);g.addColorStop(0,'#fff6d4');g.addColorStop(.12,'#ffedbaaa');g.addColorStop(1,'#f8dc8100');ctx.fillStyle=g;ctx.fillRect(0,0,s,s)},64);
const sparkleMat=new THREE.SpriteMaterial({map:sparkleTex,color:'#ffe5a3',transparent:true,depthWrite:false});
const glints=physics.nuts.map(n=>{const s=new THREE.Sprite(sparkleMat);s.scale.setScalar(.16);scene.add(s);return s});
let mode='welcome',priorMode='welcome',yaw=.38,pitch=.35,distance=6.2,inspectYaw=.55,inspectPitch=.18,inspectDistance=5.0,introOrbit=0;
let time=0,last=performance.now(),toastUntil=0,uiTimer=0,playedAt=0,quality='auto',renderScale=1,qualitySeconds=0,qualityFrames=0,padGrab=false,padJump=false,padThrow=false,padClimb=false,padBite=false,biteAnim=0,feedAnim=0;
const keys=new Set(),stick={x:0,y:0},camTarget=new THREE.Vector3(),desired=new THREE.Vector3(),look=new THREE.Vector3(),carryPos=new THREE.Vector3(),temp=new THREE.Vector3(),proj=new THREE.Vector3(),input={x:0,z:0,run:false,climbX:0,climbY:0};
let runHeld=false,joystickPointer=null,dragPointers=new Map(),pinchDistance=0;
try{quality=localStorage.getItem('nutwood-quality')||'auto'}catch{}if(!['auto','high','low'].includes(quality))quality='auto';$('quality').value=quality;
function fit(){const mobile=innerWidth<800,max=quality==='low'?1:quality==='high'?2:mobile?1.5:1.65;renderer.setPixelRatio(Math.min(devicePixelRatio,max)*renderScale);renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix()}
fit();window.addEventListener('resize',fit);
function foliageScale(scale=1){woodland.treeFoliage.traverse(o=>{if(o.isInstancedMesh)o.count=Math.floor(o.userData.fullCount*scale)})}
function updateQuality(){const low=quality==='low';sun.shadow.mapSize.set(low?1024:2048,low?1024:2048);if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null}woodland.grassMesh.visible=!low;foliageScale(low?.55:1);renderScale=1;qualitySeconds=qualityFrames=0;fit()}
if(quality==='low')updateQuality();
function toast(message,seconds=3){$('toast').textContent=message;$('toast').classList.add('show');toastUntil=time+seconds}
function countUI(){const n=physics.stashed.size;$('stashCount').textContent=String(n).padStart(2,'0');document.querySelector('.stash-slash').textContent=n>=12?` / ${physics.nuts.length}`:' / 12';$('objective').lastElementChild.textContent=n>=physics.nuts.length?'Every nut, safely home. A legendary squirrel.':n>=12?'Winter stash ready. The grove is yours.':'Bring nuts back to the hollow stump.'}
countUI();
function setMode(next){
 if(next==='inspect'){if(mode!=='inspect')priorMode=mode;inspectYaw=.55;inspectPitch=.18;inspectDistance=innerWidth<800?5.2:4.9;}
 if(next==='welcome'&&mode!=='welcome')physics.returnHome();
 if(next==='play'&&mode==='welcome'){playedAt=time;toast('Visitors bring snacks. Be nice… or tap Bite.');}
 mode=next;document.body.classList.toggle('playing',mode==='play');document.body.classList.toggle('inspecting',mode==='inspect');$('welcome').classList.toggle('hidden',mode!=='welcome');$('sceneCaption').classList.toggle('hidden',mode!=='welcome');$('gameUI').classList.toggle('hidden',mode!=='play');$('stashHud').classList.toggle('hidden',mode!=='play');$('inspector').classList.toggle('hidden',mode!=='inspect');$('inspect').classList.toggle('active',mode==='inspect');keys.clear();stick.x=stick.y=0;runHeld=false;resetKnob();
}
function grab(){if(mode!=='play'||$('helpDialog').open)return;if(!physics.held&&visitors.tryFeed()){updateActions();return;}const result=physics.grab();audio.action(result);if(result==='stash'){countUI();const n=physics.stashed.size;toast(n===12?'Winter, handled. Twelve nuts safely home.':n===physics.nuts.length?'Every nut! King of the grove.':`Safely stashed. ${n} ${n===1?'nut':'nuts'} in your hollow.`)}else if(result==='empty')toast('Get a little closer to an acorn or walnut.',2);else if(result==='grab'&&physics.stashed.size===0)toast('Take it to the hollow stump, or give it a throw.',2.7);updateActions()}
function throwNut(){if(mode!=='play'||!physics.held)return;const f=new THREE.Vector3(Math.sin(squirrel.root.rotation.y),0,Math.cos(squirrel.root.rotation.y)),pos=physics.held.mesh.position.clone().addScaledVector(f,.55),vel=f.multiplyScalar(8.7);vel.y=4.7;vel.x+=physics.player.velocity.x*.4;vel.z+=physics.player.velocity.z*.4;physics.release(pos,vel);audio.action('throw');updateActions()}
function bite(){
 if(mode!=='play'||$('helpDialog').open)return;const result=visitors.bite();if(result.type==='cooldown')return;biteAnim=.34;audio.action('bite');
 if(result.type==='hit'){const v=result.visitor;squirrel.root.rotation.y=Math.atan2(v.position.x-physics.player.position.x,v.position.z-physics.player.position.z);toast(`${v.name}: ${v.message}`,3)}
 updateActions();
}
function jump(){if(mode==='play'&&!$('helpDialog').open&&physics.jump())audio.action('jump')}
function climb(){if(mode!=='play'||$('helpDialog').open)return;const result=physics.toggleClimb();if(result==='climb'){toast('Up to climb, down to descend. Jump to leap off.',3.3);audio.action('grab')}else if(result==='empty')toast('Move closer to a tree trunk.',2);updateActions()}
function updateActions(){
 if(mode!=='play')return;const held=physics.held,near=physics.nearest(),climbing=physics.climb,tree=climbing?.tree??physics.nearestTree();
 $('grabLabel').textContent=!held&&visitors.nearestOffer()?'Take offered nut':held?(physics.nearHome()?'Stash your nut':'Drop your nut'):(near?`Grab ${near.type?'walnut':'acorn'}`:'Find a nut');$('grab').classList.toggle('unavailable',!held&&!near&&!visitors.nearestOffer());$('throw').classList.toggle('hidden',!held);$('heldLabel').textContent=held?`HOLDING ${held.type?'A WALNUT':'AN ACORN'}`:'';
 $('climbAction').classList.toggle('hidden',!tree);$('climbLabel').textContent=climbing?'Let go':'Climb tree';$('climbAction').setAttribute('aria-label',climbing?'Let go of tree':'Climb tree');$('climbStatus').classList.toggle('hidden',!climbing);document.body.classList.toggle('climbing',!!climbing);
 if(climbing){$('climbHeight').textContent=`${climbing.height.toFixed(1)} m`;$('climbHint').textContent=climbing.height>=climbing.maxHeight-.05?'Crown reached · Jump to leap':matchMedia('(pointer:coarse)').matches?'Thumb up / down / around · Jump to leap':'↑ ↓ climb · ← → around · Space to leap'}
 highlight.visible=!!near&&!held;if(highlight.visible){highlight.position.copy(near.mesh.position);highlight.position.y=height(highlight.position.x,highlight.position.z)+.035;highlight.scale.setScalar(1+Math.sin(time*3)*.05)}
}
$('play').onclick=()=>setMode('play');$('meet').onclick=()=>setMode('inspect');$('inspect').onclick=()=>mode==='inspect'?setMode(priorMode):setMode('inspect');$('back').onclick=()=>setMode(priorMode);$('brand').onclick=e=>{e.preventDefault();setMode('welcome')};$('grab').onclick=grab;$('throw').onclick=throwNut;$('jump').onclick=jump;$('climbAction').onclick=climb;$('biteAction').onclick=bite;
$('help').onclick=()=>{keys.clear();stick.x=stick.y=0;resetKnob();$('helpDialog').showModal()};$('closeHelp').onclick=()=>$('helpDialog').close();$('helpDialog').addEventListener('click',e=>{if(e.target===$('helpDialog')){const r=$('helpDialog').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('helpDialog').close()}});
$('sound').onclick=()=>{const enabled=audio.toggle();$('sound').setAttribute('aria-pressed',String(enabled));$('soundSlash').style.display=enabled?'none':''};
$('quality').onchange=()=>{quality=$('quality').value;try{localStorage.setItem('nutwood-quality',quality)}catch{}updateQuality()};
$('home').onclick=()=>{physics.returnHome();$('helpDialog').close();setMode('play');toast('Home, sweet hollow.');};$('reset').onclick=()=>{visitors.reset();physics.reset();countUI();$('helpDialog').close();setMode('play');toast('A fresh start. The nuts are back in the grove.');};
document.addEventListener('keydown',e=>{if(e.target.matches('select,input,textarea')||e.metaKey||e.ctrlKey)return;if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();if($('helpDialog').open)return;keys.add(e.code);if(e.repeat)return;if(e.code==='Space')jump();if(e.code==='KeyE')grab();if(e.code==='KeyF')throwNut();if(e.code==='KeyC')climb();if(e.code==='KeyB')bite();if(e.code==='KeyI')mode==='inspect'?setMode(priorMode):setMode('inspect');if(e.code==='Escape'&&mode==='inspect')setMode(priorMode)});
document.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',()=>{keys.clear();stick.x=stick.y=0;runHeld=false;resetKnob()});document.addEventListener('visibilitychange',()=>{last=performance.now();keys.clear();stick.x=stick.y=0;runHeld=false;if(audio.ctx){if(document.hidden)audio.ctx.suspend();else if(audio.enabled)audio.ctx.resume()}});
function resetKnob(){$('joystickKnob').style.transform='translate(0px,0px)'}
$('joystick').addEventListener('pointerdown',e=>{e.preventDefault();joystickPointer=e.pointerId;$('joystick').setPointerCapture(e.pointerId);moveJoystick(e)});
function moveJoystick(e){if(e.pointerId!==joystickPointer)return;const rect=$('joystick').getBoundingClientRect(),dx=e.clientX-rect.left-rect.width/2,dy=e.clientY-rect.top-rect.height/2,len=Math.hypot(dx,dy),max=34,k=Math.min(1,max/Math.max(len,1));stick.x=dx*k/max;stick.y=dy*k/max;$('joystickKnob').style.transform=`translate(${dx*k}px,${dy*k}px)`}
$('joystick').addEventListener('pointermove',moveJoystick);for(const name of['pointerup','pointercancel','lostpointercapture'])$('joystick').addEventListener(name,e=>{if(e.pointerId===joystickPointer){joystickPointer=null;stick.x=stick.y=0;resetKnob()}});
$('run').addEventListener('pointerdown',e=>{runHeld=true;$('run').setPointerCapture(e.pointerId)});for(const name of['pointerup','pointercancel','lostpointercapture'])$('run').addEventListener(name,()=>runHeld=false);
canvas.addEventListener('pointerdown',e=>{if($('helpDialog').open)return;e.preventDefault();canvas.setPointerCapture(e.pointerId);dragPointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(dragPointers.size===2){const p=[...dragPointers.values()];pinchDistance=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y)}});
canvas.addEventListener('pointermove',e=>{const old=dragPointers.get(e.pointerId);if(!old)return;const dx=e.clientX-old.x,dy=e.clientY-old.y;dragPointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(dragPointers.size===2){const p=[...dragPointers.values()],d=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y),diff=(pinchDistance-d)*.018;pinchDistance=d;if(mode==='inspect')inspectDistance=clamp(inspectDistance+diff,3.2,8);if(mode==='play')distance=clamp(distance+diff,3.6,11);return}if(mode==='play'){yaw-=dx*.006;pitch=clamp(pitch+dy*.004,.06,1.02);$('lookHint').style.opacity='.35'}else if(mode==='inspect'){inspectYaw-=dx*.007;inspectPitch=clamp(inspectPitch+dy*.004,-.12,.8)}else introOrbit-=dx*.003});
for(const name of['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(name,e=>dragPointers.delete(e.pointerId));
canvas.addEventListener('wheel',e=>{e.preventDefault();if(mode==='inspect')inspectDistance=clamp(inspectDistance+e.deltaY*.005,3.2,8);else if(mode==='play')distance=clamp(distance+e.deltaY*.006,3.6,11)},{passive:false});canvas.addEventListener('contextmenu',e=>e.preventDefault());
function readInput(dt){let x=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0)+stick.x,y=(keys.has('KeyS')||keys.has('ArrowDown')?1:0)-(keys.has('KeyW')||keys.has('ArrowUp')?1:0)+stick.y;
 let pad;try{pad=[...navigator.getGamepads()].find(p=>p?.connected)}catch{}
 if(pad){const dead=v=>Math.abs(v)>.15?v:0;x+=dead(pad.axes[0]||0);y+=dead(pad.axes[1]||0);if(mode==='play'){yaw-=dead(pad.axes[2]||0)*dt*2.1;pitch=clamp(pitch+dead(pad.axes[3]||0)*dt*1.4,.06,1.02)}const g=pad.buttons[2]?.pressed,j=pad.buttons[0]?.pressed,t=pad.buttons[7]?.pressed;if(g&&!padGrab)grab();if(j&&!padJump)jump();if(t&&!padThrow)throwNut();const c=pad.buttons[3]?.pressed;if(c&&!padClimb)climb();const b=pad.buttons[1]?.pressed;if(b&&!padBite)bite();padBite=b;padClimb=c;padGrab=g;padJump=j;padThrow=t}
 const len=Math.hypot(x,y);if(len>1){x/=len;y/=len}input.climbX=x;input.climbY=-y;input.x=Math.cos(yaw)*x+Math.sin(yaw)*y;input.z=-Math.sin(yaw)*x+Math.cos(yaw)*y;input.run=runHeld||keys.has('ShiftLeft')||keys.has('ShiftRight')||!!pad?.buttons[10]?.pressed;return input;
}
function moveCamera(dt){const p=squirrel.root.position,mobile=innerWidth<800;
 if(mode==='play'){
  look.copy(p).add(new THREE.Vector3(0,1.18,0));desired.set(p.x+Math.sin(yaw)*distance*Math.cos(pitch),p.y+1.18+Math.sin(pitch)*distance,p.z+Math.cos(yaw)*distance*Math.cos(pitch));
  // Shorten the camera boom before it can pass through a trunk.
  const dx=desired.x-look.x,dz=desired.z-look.z,a=dx*dx+dz*dz;let limit=1;
  for(const c of woodland.colliders){if(c.type!=='trunk'||a<.01)continue;const ox=look.x-c.x,oz=look.z-c.z,b=2*(ox*dx+oz*dz),cc=ox*ox+oz*oz-(c.radius+.24)**2,disc=b*b-4*a*cc;if(disc<0)continue;const t=(-b-Math.sqrt(disc))/(2*a),yy=lerp(look.y,desired.y,t);if(t>.05&&t<limit&&yy>c.y-c.height/2&&yy<c.y+c.height/2)limit=Math.max(.15,t-.055)}
  if(limit<1)desired.lerpVectors(look,desired,limit);desired.y=Math.max(desired.y,height(desired.x,desired.z)+.5);
 }else if(mode==='inspect'){
  const a=inspectYaw,d=inspectDistance;desired.set(p.x+Math.sin(a)*d,p.y+1.35+Math.sin(inspectPitch)*d,p.z+Math.cos(a)*d);const right=new THREE.Vector3(Math.cos(a),0,-Math.sin(a));look.copy(p).addScaledVector(right,mobile?0:-1.15).add(new THREE.Vector3(0,mobile?.46:1.38,0));
 }else{
  const a=.52+Math.sin(time*.09)*.04+introOrbit,d=mobile?7.15:7.3;desired.set(p.x+Math.sin(a)*d,p.y+(mobile?2.25:2.5),p.z+Math.cos(a)*d);const right=new THREE.Vector3(Math.cos(a),0,-Math.sin(a));look.copy(p).addScaledVector(right,mobile?0:-1.85).add(new THREE.Vector3(0,mobile?.15:1.35,0));
 }
 const alpha=1-Math.exp(-dt*6);camera.position.lerp(desired,alpha);camTarget.lerp(look,alpha);camera.lookAt(camTarget);
}
function updateVisitorLabels(){
 visitors.visitors.forEach((v,i)=>{const label=visitorLabels[i];if(!v.root.visible||!v.message){label.hidden=true;return}v.head.getWorldPosition(proj);proj.y+=.70;proj.project(camera);const visible=proj.z<1&&proj.z>-1&&Math.abs(proj.x)<1.05&&Math.abs(proj.y)<.93;label.hidden=!visible;if(visible){label.textContent=`${v.name} · ${v.message}`;label.style.left=`${(proj.x*.5+.5)*innerWidth}px`;label.style.top=`${(-proj.y*.5+.5)*innerHeight}px`;label.classList.toggle('startled',v.state==='flinch'||v.state==='flee')}});
}
function updateMarker(){const h=woodland.home;proj.copy(h).y+=2.0;proj.project(camera);const dir=temp.copy(h).sub(camera.position),forward=camera.getWorldDirection(new THREE.Vector3());const show=dir.dot(forward)>0&&proj.z<1;const el=$('stashMarker');el.style.display=show?'flex':'none';if(show){el.style.left=`${clamp((proj.x*.5+.5)*innerWidth,38,innerWidth-38)}px`;el.style.top=`${clamp((-.5*proj.y+.5)*innerHeight,145,innerHeight-170)}px`;$('homeDistance').textContent=`${Math.round(Math.hypot(physics.player.position.x-h.x,physics.player.position.z-h.z))} m`}}
// Read-only state is also useful to check a build without altering the scene.
window.nutwood={get state(){return{mode,position:{x:physics.player.position.x,y:physics.player.position.y,z:physics.player.position.z},velocity:physics.player.velocity.toArray(),grounded:physics.grounded,climbing:!!physics.climb,climbHeight:physics.climb?.height??0,gait:squirrel.root.userData.gait,held:physics.held?.id??null,stashed:physics.stashed.size,nearest:physics.nearest()?.id??null,furStrands:squirrel.strandCount,nuts:physics.nuts.length,visitors:visitors.visitors.map(v=>({name:v.name,state:v.state})),visitorStats:{...visitors.stats},drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,quality,renderScale}},get scene(){return scene},get squirrel(){return squirrel.root},get physics(){return physics}};
camera.position.copy(woodland.start).add(new THREE.Vector3(4,2.5,6.5));camTarget.copy(woodland.start).add(new THREE.Vector3(-1,1.2,0));camera.lookAt(camTarget);
let ready=false;
function frame(now){requestAnimationFrame(frame);const dt=Math.min(.05,Math.max(.001,(now-last)/1000));last=now;time+=dt;
 const active=mode==='play'&&!$('helpDialog').open,controls=active?readInput(dt):{x:0,z:0,run:false};
 visitors.update(dt,active,yaw);physics.step(dt,controls,active);biteAnim=Math.max(0,biteAnim-dt);feedAnim=Math.max(0,feedAnim-dt);
 for(const event of visitors.drainEvents()){if(event.type==='feed'){feedAnim=2.0;audio.action('grab');toast(event.intoPaws?`${event.visitor.name} gave you a nut. Thanks, human!`:`${event.visitor.name} left you a nut.`,3)}}
 squirrel.root.position.copy(physics.player.position);const speed=Math.hypot(physics.player.velocity.x,physics.player.velocity.z);
 if(physics.climb)squirrel.root.rotation.y=angleLerp(squirrel.root.rotation.y,physics.climb.angle+Math.PI,1-Math.exp(-dt*16));else if(mode==='play'&&speed>.15)squirrel.root.rotation.y=angleLerp(squirrel.root.rotation.y,Math.atan2(physics.player.velocity.x,physics.player.velocity.z),1-Math.exp(-dt*13));else if(mode!=='play')squirrel.root.rotation.y=angleLerp(squirrel.root.rotation.y,.38,1-Math.exp(-dt*5));
 squirrel.animate(dt,time,mode==='play'?speed:0,!!physics.held||mode!=='play',mode==='play'&&!physics.grounded&&!physics.climb,physics.climb,{bite:biteAnim/.34,feed:feedAnim});scene.updateMatrixWorld(true);squirrel.carryPoint.getWorldPosition(carryPos);
 heroNut.visible=mode!=='play'&&!physics.held;if(heroNut.visible){heroNut.position.copy(carryPos);heroNut.rotation.set(.25,squirrel.root.rotation.y+time*.1,0)}if(physics.held){physics.held.mesh.position.copy(carryPos);physics.held.mesh.rotation.set(.25,squirrel.root.rotation.y,0)}
 contactShadow.position.set(squirrel.root.position.x,height(squirrel.root.position.x,squirrel.root.position.z)+.014,squirrel.root.position.z);const lift=Math.max(0,squirrel.root.position.y-height(squirrel.root.position.x,squirrel.root.position.z));contactShadow.visible=!physics.climb&&lift<4;contactShadow.material.opacity=clamp(1-lift*.22,.18,1);contactShadow.scale.setScalar(1+lift*.12);
 woodland.animate(time,dt);audio.tick(time);moveCamera(dt);
 glints.forEach((s,i)=>{const n=physics.nuts[i],d=Math.hypot(n.mesh.position.x-physics.player.position.x,n.mesh.position.z-physics.player.position.z);s.visible=n.active&&!n.stored&&n!==physics.held&&d<11;if(s.visible){s.position.copy(n.mesh.position);s.position.y+=.38+Math.sin(time*1.7+i)*.045;s.material.opacity=.75;s.scale.setScalar(.10+Math.max(0,Math.sin(time*2.2+i*3))*.06)}});
 if(mode==='play'){uiTimer+=dt;if(uiTimer>.1){updateActions();updateMarker();updateVisitorLabels();uiTimer=0}if(time>toastUntil)$('toast').classList.remove('show');$('objective').style.opacity=time-playedAt>18?'.55':'1';}
 renderer.render(scene,camera);
 if(!ready){ready=true;$('loading').classList.add('done');setTimeout(()=>$('loading').remove(),700)}
 if(quality==='auto'&&time>5){qualitySeconds+=dt;qualityFrames++;if(qualityFrames>=120){const fps=qualityFrames/qualitySeconds;let next=renderScale;if(fps<28)next=Math.max(.65,renderScale-.12);else if(fps>48)next=Math.min(1,renderScale+.06);if(next!==renderScale){renderScale=next;foliageScale(renderScale<.8?.72:1);fit()}qualityFrames=qualitySeconds=0;}}
}
requestAnimationFrame(frame);
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();$('fatal').classList.remove('hidden')});

$('downloadModel').onclick=async()=>{
 const button=$('downloadModel');button.disabled=true;button.textContent='Preparing your squirrel…';
 try{
  const {exportGLB}=await import('./scripts/export-glb.mjs');
  const result=exportGLB(squirrel.root),blob=new Blob([result.buffer],{type:'model/gltf-binary'}),url=URL.createObjectURL(blob),link=document.createElement('a');
  link.href=url;link.download='fluffy-squirrel.glb';document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);button.textContent='Download squirrel · .GLB ↧';
 }catch(error){console.error('Squirrel export failed',error);button.textContent='Download failed · Try again ↧';}
 finally{button.disabled=false;}
};
