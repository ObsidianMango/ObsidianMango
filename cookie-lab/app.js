import * as THREE from './vendor/three.module.js';
import {OrbitControls} from './vendor/OrbitControls.js';
import {RoomEnvironment} from './vendor/RoomEnvironment.js';
import {Cookie,toppingSpec} from './cookie.js';
import {CrumbPhysics} from './physics.js';
import {RECIPES,DOUGHS,customRecipe} from './recipes.js';

const $=id=>document.getElementById(id);
const paths={
  plus:'M12 5v14M5 12h14',minus:'M5 12h14',
  rotate:'M20 7v5h-5M4 17v-5h5M5.5 7a7 7 0 0 1 11.7-2L20 8M4 16l2.8 3A7 7 0 0 0 18.5 17',
  flip:'M12 3v18M7 7 3 12l4 5M17 7l4 5-4 5M3 12h6M15 12h6',
  focus:'M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5M9 12h6M12 9v6',
  bite:'M21 11a3 3 0 0 1-4-4 3 3 0 0 1-4-4A9 9 0 1 0 21 11ZM8 8h.01M6 13h.01M11 16h.01M15 13h.01',
  sprinkle:'M6 4 8 6M15 3l-1 3M19 8l2 1M10 11l2 1M4 12l-1 2M17 15l2 2M8 18l-1 3M13 21l2-2',
  refresh:'M20 4v5h-5M20 9a8 8 0 1 0 0 6',
  soundOff:'M11 5 6 9H3v6h3l5 4ZM17 9l5 6M22 9l-5 6',
  soundOn:'M11 5 6 9H3v6h3l5 4ZM15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14',
  help:'M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2-3 4M12 17h.01',
  hand:'M8 13V6a2 2 0 0 1 4 0v5M12 10a2 2 0 0 1 4 0v2M16 11a2 2 0 0 1 4 0v4c0 4-3 6-6 6h-1c-2 0-3-1-4-2l-5-5a2 2 0 0 1 3-2l2 2',
  shuffle:'M3 5h3c5 0 7 14 12 14h3M17 15l4 4-4 4M3 19h3c2 0 3-2 4-4M14 9c1-2 2-4 4-4h3M17 1l4 4-4 4',
  spark:'m12 3 2.4 6.6L21 12l-6.6 2.4L12 21l-2.4-6.6L3 12l6.6-2.4ZM20 2v4M18 4h4',
  close:'M6 6l12 12M18 6 6 18',check:'m6 12 4 4 8-8',
};
function icon(name){return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${name==='help'?'<circle cx="12" cy="12" r="10"/>':''}<path d="${paths[name]||paths.spark}"/></svg>`;}
document.querySelectorAll('[data-icon]').forEach(el=>el.innerHTML=icon(el.dataset.icon));

let renderer,scene,camera,controls,physics,cookie,pivot,envTarget;
let currentRecipe=RECIPES[0],seed=4269,autoRotate=!matchMedia('(prefers-reduced-motion: reduce)').matches;
let flipTarget=0,autoPauseUntil=0,lastTime=0,toastTimer,selectToken=0,busy=false,soundOn=false,audioContext=null,filter='all';
let pointerStart=null,lastTap=null,lastBite=0,shiver=0,entrance=0,ready=false,contextLost=false;
const activePointers=new Set();
const thumbnails=new Map(),stage=$('viewport'),raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
const scratchMatrix=new THREE.Matrix4(),scratchV=new THREE.Vector3();
const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
const previewScene=new THREE.Scene();let previewTarget,previewCamera,previewBusy=false,thumbnailIndex=0;
const thumbSize=132;

function toast(message){$('toast').textContent=message;$('toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),2400);}
function updateStats(){if(!cookie)return;$('topping-count').textContent=cookie.toppingCount.toLocaleString();const amount=Math.round(cookie.remaining*100);$('remaining-bar').style.width=amount+'%';$('remaining-label').textContent=amount?`${amount}% cookie left`:'Not a crumb of self-control.';$('bite').disabled=!amount||busy;$('sprinkle').disabled=!amount||busy||cookie.toppingCount>=5500;}
function updateHeading(recipe){
  const i=RECIPES.findIndex(r=>r.id===recipe.id);$('recipe-number').textContent=i<0?'YOUR RECIPE':`NO. ${String(i+1).padStart(2,'0')}`;
  $('recipe-family').textContent=i===0?'BAKERY CLASSIC':recipe.category==='chocolate'?'CHOCOLATE FIX':recipe.category==='classic'?'COOKIE CLASSIC':'FROM THE BAKERY';
  const name=recipe.name;const split=name.lastIndexOf(' ');$('cookie-name').replaceChildren();
  if(name.length>14&&split>4){$('cookie-name').append(document.createTextNode(name.slice(0,split)),document.createElement('br'),document.createTextNode(name.slice(split+1)+'.'));}else $('cookie-name').textContent=name+'.';
  $('cookie-description').textContent=recipe.description;
  document.querySelectorAll('.cookie-item').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.id===recipe.id)));
  $('dough').value=recipe.dough;$('shape').value=recipe.shape;$('icing').value=recipe.icing;$('topping').value=[...$('topping').options].some(o=>o.value===recipe.topping)?recipe.topping:'nuts';$('density').value=recipe.density||100;$('bake').value=recipe.bake;$('thickness').value=Math.round(recipe.thickness*100);updateRangeLabels();
}
function renderList(){
  $('cookie-list').replaceChildren();
  for(const [i,r] of RECIPES.entries()){
    if(filter!=='all'&&r.category!==filter)continue;
    const el=document.createElement('button');el.className='cookie-item';el.dataset.id=r.id;el.setAttribute('aria-pressed',String(r.id===currentRecipe.id));
    el.innerHTML=`<span class="thumb" style="--swatch:${r.dough==='chocolate'?'#e4d7d3':r.dough==='matcha'?'#e4e8d2':r.icing==='pink'?'#f7e1e7':'#eee3d7'}"><span class="thumb-number">${String(i+1).padStart(2,'0')}</span></span><span class="item-copy"><strong>${r.name}</strong><small>${r.short}</small></span><span class="check">${icon('check')}</span>`;
    if(thumbnails.has(r.id)){const img=new Image();img.alt='';img.src=thumbnails.get(r.id);el.querySelector('.thumb').append(img);}else el.querySelector('.thumb-number').setAttribute('aria-hidden','true');
    $('cookie-list').append(el);
  }
}
function updateRangeLabels(){
  $('density-value').textContent=$('density').value+'%';const b=Number($('bake').value),t=Number($('thickness').value);
  $('bake-value').textContent=b<30?'Soft':b<62?'Golden':b<85?'Toasty':'Extra toasty';$('thickness-value').textContent=t<32?'Thin & crisp':t<53?'Bakery':'Extra thick';
}
function switchTab(name){
  for(const tab of ['menu','mix']){const selected=name===tab;$(`tab-${tab}`).setAttribute('aria-selected',String(selected));$(`tab-${tab}`).tabIndex=selected?0:-1;$(`${tab}-panel`).hidden=!selected;}
}

function setupScene(){
  renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,innerWidth<761?1.65:2));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;renderer.setClearColor(0x000000,0);
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;stage.prepend(renderer.domElement);
  scene=new THREE.Scene();scene.fog=new THREE.FogExp2('#e9ddfd',.026);
  const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment();envTarget=pmrem.fromScene(room,.055);scene.environment=envTarget.texture;scene.environmentIntensity=.38;room.dispose();pmrem.dispose();
  const hemi=new THREE.HemisphereLight('#fff4e3','#b9a0d6',2.0);scene.add(hemi);
  const key=new THREE.DirectionalLight('#fff0da',3.8);key.position.set(-3.5,7,4);key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.camera.left=-4;key.shadow.camera.right=4;key.shadow.camera.top=4;key.shadow.camera.bottom=-4;key.shadow.camera.near=.5;key.shadow.camera.far=18;key.shadow.normalBias=.028;key.shadow.bias=-.0001;key.shadow.radius=3;scene.add(key);
  const fill=new THREE.DirectionalLight('#e4dcff',1.4);fill.position.set(4,4,-4);scene.add(fill);
  const points=[new THREE.Vector2(0,-.075),new THREE.Vector2(1.72,-.075),new THREE.Vector2(1.93,-.05),new THREE.Vector2(2.10,.015),new THREE.Vector2(2.16,.065),new THREE.Vector2(2.16,.096),new THREE.Vector2(2.12,.12),new THREE.Vector2(2.07,.11),new THREE.Vector2(1.96,.057),new THREE.Vector2(1.78,.03),new THREE.Vector2(0,.03)];
  const plate=new THREE.Mesh(new THREE.LatheGeometry(points,96),new THREE.MeshPhysicalMaterial({color:'#f1e8d9',roughness:.28,metalness:0,clearcoat:.32,clearcoatRoughness:.25}));plate.receiveShadow=true;plate.castShadow=true;scene.add(plate);
  const rim=new THREE.Mesh(new THREE.TorusGeometry(2.12,.008,6,128),new THREE.MeshStandardMaterial({color:'#987eac',roughness:.5}));rim.rotation.x=Math.PI/2;rim.position.y=.115;scene.add(rim);
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.ShadowMaterial({color:'#53376b',opacity:.13}));floor.rotation.x=-Math.PI/2;floor.position.y=-.19;floor.receiveShadow=true;scene.add(floor);
  const contactCanvas=document.createElement('canvas');contactCanvas.width=contactCanvas.height=128;const ctx=contactCanvas.getContext('2d'),gradient=ctx.createRadialGradient(64,64,5,64,64,64);gradient.addColorStop(0,'rgba(52,25,74,.20)');gradient.addColorStop(.7,'rgba(52,25,74,.07)');gradient.addColorStop(1,'rgba(52,25,74,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,128,128);const contactMap=new THREE.CanvasTexture(contactCanvas);const shadow=new THREE.Mesh(new THREE.PlaneGeometry(4.8,4.8),new THREE.MeshBasicMaterial({map:contactMap,transparent:true,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.y=-.18;scene.add(shadow);
  camera=new THREE.PerspectiveCamera(36,1,.08,100);controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.07;controls.enablePan=false;controls.minDistance=2.15;controls.maxDistance=20;controls.minPolarAngle=.07;controls.maxPolarAngle=Math.PI*.49;controls.rotateSpeed=.65;controls.zoomSpeed=.8;controls.touches.ONE=THREE.TOUCH.ROTATE;controls.touches.TWO=THREE.TOUCH.DOLLY_PAN;controls.addEventListener('start',()=>{autoPauseUntil=performance.now()+5500;});
  pivot=new THREE.Group();scene.add(pivot);physics=new CrumbPhysics(scene);
  resetCamera();new ResizeObserver(resize).observe(stage);resize();
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();contextLost=true;$('webgl-error').hidden=false;});
  renderer.domElement.addEventListener('webglcontextrestored',()=>location.reload());
  renderer.domElement.addEventListener('pointerdown',e=>{activePointers.add(e.pointerId);if(activePointers.size>1){pointerStart=null;lastTap=null;return;}pointerStart={x:e.clientX,y:e.clientY,time:performance.now(),id:e.pointerId};});
  renderer.domElement.addEventListener('pointerup',e=>{
    activePointers.delete(e.pointerId);if(!pointerStart||pointerStart.id!==e.pointerId)return;const moved=Math.hypot(e.clientX-pointerStart.x,e.clientY-pointerStart.y),now=performance.now();
    if(moved<9&&now-pointerStart.time<350){if(lastTap&&now-lastTap.time<330&&Math.hypot(e.clientX-lastTap.x,e.clientY-lastTap.y)<28){biteAt(e.clientX,e.clientY);lastTap=null;}else lastTap={x:e.clientX,y:e.clientY,time:now};}pointerStart=null;
  });
  renderer.domElement.addEventListener('pointercancel',e=>{activePointers.delete(e.pointerId);pointerStart=null;lastTap=null;});
  renderer.domElement.addEventListener('dblclick',e=>e.preventDefault());
  renderer.domElement.addEventListener('contextmenu',e=>e.preventDefault());
  previewScene.environment=envTarget.texture;previewScene.environmentIntensity=.4;previewScene.add(new THREE.HemisphereLight('#fff4dd','#c2aaca',2.0));const pk=new THREE.DirectionalLight('#fff4dd',3.3);pk.position.set(-2,5,4);previewScene.add(pk);previewCamera=new THREE.OrthographicCamera(-2.15,2.15,2.15,-2.15,.1,30);previewCamera.position.set(.4,5,5.1);previewCamera.lookAt(0,.15,0);previewTarget=new THREE.WebGLRenderTarget(thumbSize,thumbSize,{format:THREE.RGBAFormat});previewTarget.texture.colorSpace=THREE.SRGBColorSpace;
}
function resetCamera(){
  const w=stage.clientWidth,h=stage.clientHeight,aspect=w/h;
  const distance=Math.max(7.3,3.6/(2*Math.tan(Math.PI/10)*aspect*.90));
  controls.target.set(0,.29,0);camera.position.copy(new THREE.Vector3(innerWidth<761?1.1:2.3,6.4,6.7).normalize().multiplyScalar(distance).add(controls.target));controls.update();
}
let lastMobile=innerWidth<761,lastAspect=0;
function resize(){
  if(!renderer)return;const w=stage.clientWidth,h=stage.clientHeight;if(!w||!h)return;
  renderer.setSize(w,h,false);camera.aspect=w/h;camera.setViewOffset(w,h,innerWidth<761?0:-w*.04,-h*(innerWidth<761?.055:.035),w,h);camera.updateProjectionMatrix();
  if(lastMobile!==(innerWidth<761)||Math.abs(w/h-lastAspect)>.25){resetCamera();lastMobile=innerWidth<761;}lastAspect=w/h;
}
function zoom(factor){const offset=camera.position.clone().sub(controls.target),distance=THREE.MathUtils.clamp(offset.length()*factor,controls.minDistance,controls.maxDistance);camera.position.copy(offset.setLength(distance).add(controls.target));controls.update();autoPauseUntil=performance.now()+2500;}

async function choose(recipe,{fresh=false}={}){
  const token=++selectToken;busy=true;$('bite').disabled=true;$('sprinkle').disabled=true;
  await new Promise(requestAnimationFrame);if(token!==selectToken)return;
  try{
    const next=new Cookie(recipe,seed++);if(cookie){pivot.remove(cookie.group);cookie.dispose();}physics.clear();cookie=next;pivot.add(cookie.group);cookie.group.position.y=-cookie.height/2;pivot.position.y=cookie.height/2+.085;pivot.rotation.x=0;flipTarget=0;currentRecipe=recipe;entrance=reduceMotion?0:1;
    updateHeading(recipe);busy=false;updateStats();$('loading').hidden=true;ready=true;
    if(fresh)toast('Warm cookie. Clean slate.');
  }catch(error){console.error(error);busy=false;if(!cookie)$('webgl-error').hidden=false;else toast('That batch didn’t bake. Try another cookie.');updateStats();}
}
function crunch(){
  if(!soundOn)return;
  try{
    audioContext??=new(window.AudioContext||window.webkitAudioContext)();audioContext.resume();const ctx=audioContext,buffer=ctx.createBuffer(1,Math.round(ctx.sampleRate*.24),ctx.sampleRate),data=buffer.getChannelData(0);
    for(let i=0;i<data.length;i++){const t=i/ctx.sampleRate;data[i]=(Math.random()*2-1)*Math.exp(-t*20)*(.45+.55*Math.abs(Math.sin(t*240)));}
    const source=ctx.createBufferSource();source.buffer=buffer;const filter=ctx.createBiquadFilter();filter.type='highpass';filter.frequency.value=480;const gain=ctx.createGain();gain.gain.value=.18;source.connect(filter).connect(gain).connect(ctx.destination);source.start();
  }catch{soundOn=false;}
}
function biteResult(result){
  if(!result)return;cookie.group.updateWorldMatrix(true,false);lastBite=performance.now();shiver=1;crunch();
  const parentQuaternion=new THREE.Quaternion();cookie.group.getWorldQuaternion(parentQuaternion);
  // Every released topping has its own transform and velocity; instancing only batches drawing.
  for(const r of result.detached){
    const position=cookie.group.localToWorld(r.position.clone());const velocity=new THREE.Vector3((Math.random()-.5)*1.55,.4+Math.random()*1.2,(Math.random()-.5)*1.55);
    physics.add({type:r.type,color:r.color,scale:r.scale.clone(),raise:r.raise,position,velocity,quaternion:parentQuaternion.clone().multiply(r.quaternion),life:65});
  }
  for(let i=0;i<65;i++){
    const a=Math.random()*Math.PI*2,radius=result.radius*(.68+Math.random()*.35),x=result.x+Math.cos(a)*radius,z=result.z+Math.sin(a)*radius;
    const position=cookie.group.localToWorld(new THREE.Vector3(x,Math.random()*cookie.height,z));const scale=.008+Math.random()*.035;
    physics.add({type:'crumb',color:cookie.crumbColor.clone().multiplyScalar(.78+Math.random()*.3),position,scale:new THREE.Vector3(scale,scale*.7,scale*.9),quaternion:new THREE.Quaternion().random(),velocity:new THREE.Vector3((Math.random()-.5)*1.8,.35+Math.random(),(Math.random()-.5)*1.8),life:65});
  }
  physics.sync();updateStats();if(cookie.remaining===0)toast('Entire cookie demolished. Respect.');else if(cookie.bites===1)toast('Double-tap the cookie to choose your next bite.');
}
function biteAuto(){
  if(!ready||busy||!cookie.remaining||performance.now()-lastBite<220)return;
  cookie.group.updateWorldMatrix(true,false);const localCamera=cookie.group.worldToLocal(camera.position.clone());const dir=new THREE.Vector2(localCamera.x,localCamera.z);if(dir.length()<.1)dir.set(0,1);biteResult(cookie.autoBite(dir));
}
function biteAt(clientX,clientY){
  if(!ready||busy||!cookie.remaining||performance.now()-lastBite<220)return;
  const rect=renderer.domElement.getBoundingClientRect();pointer.set((clientX-rect.left)/rect.width*2-1,-(clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);cookie.group.updateWorldMatrix(true,true);const hit=raycaster.intersectObjects(cookie.body.children,false)[0];
  if(hit){const local=cookie.group.worldToLocal(hit.point.clone());biteResult(cookie.bite(local.x,local.z,.66));}
}
function addSprinkles(){
  if(!ready||busy||!cookie.remaining)return;if(cookie.toppingCount>=5500){toast('That cookie has reached maximum sprinkle.');return;}
  if(Math.abs(pivot.rotation.x%(Math.PI*2))>.12){flipTarget=Math.round(flipTarget/(Math.PI*2))*Math.PI*2;toast('Turning it frosting-side up…');setTimeout(addSprinkles,600);return;}
  const inFlight=physics.particles.filter(p=>p.canAttach).length;
  const n=Math.max(0,Math.min(180,5500-cookie.toppingCount-inFlight)),cookieQuaternion=new THREE.Quaternion();cookie.group.updateWorldMatrix(true,false);cookie.group.getWorldQuaternion(cookieQuaternion);
  let added=0;for(let i=0;i<n;i++){
    const point=cookie.randomPoint();if(!point)continue;const spec=toppingSpec('pearls',Math.random),position=cookie.group.localToWorld(new THREE.Vector3(point.x,cookie.surface(point.x,point.z)+1+Math.random()*1.8,point.z));
    if(physics.add({...spec,position,quaternion:cookieQuaternion.clone().multiply(spec.quaternion),restQuaternion:spec.quaternion.clone(),canAttach:true,velocity:new THREE.Vector3((Math.random()-.5)*.25,-.15,(Math.random()-.5)*.25),life:65}))added++;
  }
  physics.sync();if(added)toast('A little more is never a bad idea.');else toast('Let those sprinkles settle first.');
}

function bindUI(){
  $('cookie-list').addEventListener('click',e=>{const item=e.target.closest('.cookie-item');if(item){const r=RECIPES.find(r=>r.id===item.dataset.id);choose(r);}});
  document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{filter=button.dataset.filter;document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));renderList();}));
  $('surprise').addEventListener('click',()=>{const options=RECIPES.filter(r=>r.id!==currentRecipe.id);choose(options[Math.floor(Math.random()*options.length)]);});
  for(const name of ['menu','mix']){$('tab-'+name).addEventListener('click',()=>switchTab(name));$('tab-'+name).addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();const other=name==='menu'?'mix':'menu';switchTab(other);$('tab-'+other).focus();}});}
  for(const id of ['density','bake','thickness'])$(id).addEventListener('input',updateRangeLabels);
  $('bake-custom').addEventListener('click',()=>{const recipe=customRecipe({dough:$('dough').value,shape:$('shape').value,icing:$('icing').value,topping:$('topping').value,density:Number($('density').value),bake:Number($('bake').value),thickness:Number($('thickness').value)/100});choose(recipe).then(()=>{toast('Your signature cookie, fresh out of the oven.');if(innerWidth<761)document.querySelector('.playground').scrollIntoView({behavior:reduceMotion?'instant':'smooth',block:'start'});});});
  $('bite').addEventListener('click',biteAuto);$('sprinkle').addEventListener('click',addSprinkles);$('reset-cookie').addEventListener('click',()=>choose(currentRecipe,{fresh:true}));
  $('zoom-in').addEventListener('click',()=>zoom(.82));$('zoom-out').addEventListener('click',()=>zoom(1.22));$('camera-reset').addEventListener('click',resetCamera);
  $('rotate').setAttribute('aria-pressed',String(autoRotate));$('rotate').addEventListener('click',()=>{autoRotate=!autoRotate;$('rotate').setAttribute('aria-pressed',String(autoRotate));});
  $('flip').addEventListener('click',()=>{if(!cookie)return;flipTarget+=Math.PI;autoPauseUntil=performance.now()+1000;});
  $('sound').addEventListener('click',()=>{soundOn=!soundOn;$('sound').setAttribute('aria-pressed',String(soundOn));$('sound').setAttribute('aria-label',soundOn?'Mute crunch sounds':'Turn crunch sounds on');$('sound').title=soundOn?'Mute crunch sounds':'Turn crunch sounds on';$('sound').innerHTML=icon(soundOn?'soundOn':'soundOff');if(soundOn){try{audioContext??=new(window.AudioContext||window.webkitAudioContext)();audioContext.resume();toast('Crunch sounds on.');}catch{soundOn=false;toast('Sound is unavailable in this browser.');}}});
  $('help-open').addEventListener('click',()=>$('help-dialog').showModal());$('help-close').addEventListener('click',()=>$('help-dialog').close());$('help-dialog').addEventListener('click',e=>{if(e.target===$('help-dialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});
  window.addEventListener('keydown',e=>{
    if(!ready||e.ctrlKey||e.metaKey||e.altKey||$('help-dialog').open||/INPUT|SELECT|TEXTAREA/.test(document.activeElement?.tagName))return;
    const key=e.key.toLowerCase();if(key==='b'){e.preventDefault();biteAuto();}if(key==='s'){e.preventDefault();addSprinkles();}if(key==='r'){e.preventDefault();choose(currentRecipe,{fresh:true});}if(key==='+'||key==='='){e.preventDefault();zoom(.86);}if(key==='-'){e.preventDefault();zoom(1.16);}
    if(e.target===stage&&e.key.startsWith('Arrow')){e.preventDefault();const s=new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target));s.theta+=e.key==='ArrowLeft'?.12:e.key==='ArrowRight'?-.12:0;s.phi=THREE.MathUtils.clamp(s.phi+(e.key==='ArrowUp'?-.1:e.key==='ArrowDown'?.1:0),controls.minPolarAngle,controls.maxPolarAngle);camera.position.setFromSpherical(s).add(controls.target);controls.update();}
  });
  document.addEventListener('visibilitychange',()=>{lastTime=0;});
}

function makeNextThumbnail(){
  if(!renderer||!ready||thumbnailIndex>=RECIPES.length||contextLost)return;
  if(previewBusy||busy||physics.particles.some(p=>!p.sleeping)){setTimeout(makeNextThumbnail,700);return;}
  previewBusy=true;let model;
  try{
    const recipe=RECIPES[thumbnailIndex],r=recipe.aspect?{...recipe,aspect:1.7}:recipe;model=new Cookie(r,thumbnailIndex+420,{preview:true});previewScene.add(model.group);
    const scale=recipe.aspect?.87:1;model.group.scale.setScalar(scale);
    renderer.setRenderTarget(previewTarget);renderer.render(previewScene,previewCamera);const pixels=new Uint8Array(thumbSize*thumbSize*4);renderer.readRenderTargetPixels(previewTarget,0,0,thumbSize,thumbSize,pixels);renderer.setRenderTarget(null);
    const canvas=document.createElement('canvas');canvas.width=canvas.height=thumbSize;const ctx=canvas.getContext('2d'),data=ctx.createImageData(thumbSize,thumbSize);for(let y=0;y<thumbSize;y++)data.data.set(pixels.subarray((thumbSize-1-y)*thumbSize*4,(thumbSize-y)*thumbSize*4),y*thumbSize*4);ctx.putImageData(data,0,0);const url=canvas.toDataURL('image/png');thumbnails.set(recipe.id,url);
    const slot=document.querySelector(`.cookie-item[data-id="${recipe.id}"] .thumb`);if(slot){const img=new Image();img.alt='';img.src=url;slot.append(img);}
  }catch(error){console.warn('Cookie thumbnail unavailable',error);renderer.setRenderTarget(null);}finally{if(model){previewScene.remove(model.group);model.dispose();}previewBusy=false;thumbnailIndex++;}
  if(thumbnailIndex<RECIPES.length){if('requestIdleCallback'in window)requestIdleCallback(makeNextThumbnail,{timeout:1800});else setTimeout(makeNextThumbnail,120);}
}
function tick(time){
  requestAnimationFrame(tick);if(document.hidden||contextLost)return;const dt=lastTime?Math.min((time-lastTime)/1000,.035):.016;lastTime=time;
  if(cookie){
    if(autoRotate&&time>autoPauseUntil)pivot.rotation.y+=dt*.105;
    pivot.rotation.x=THREE.MathUtils.damp(pivot.rotation.x,flipTarget,9,dt);if(Math.abs(pivot.rotation.x-flipTarget)<.001)pivot.rotation.x=flipTarget;
    if(entrance>0){entrance=Math.max(0,entrance-dt*2.7);const s=1-.06*entrance;cookie.group.scale.setScalar(s);}else cookie.group.scale.setScalar(1);
    shiver=Math.max(0,shiver-dt*3.5);pivot.rotation.z=reduceMotion?0:Math.sin(time*.045)*shiver*.018;
    const halfDepth=Math.max(Math.abs(cookie.bounds.min.y),Math.abs(cookie.bounds.max.y));
    pivot.position.y=.085+cookie.height/2*Math.abs(Math.cos(pivot.rotation.x))+halfDepth*Math.abs(Math.sin(pivot.rotation.x));
    if(physics.particles.length){const attached=physics.update(dt,cookie);if(attached)updateStats();}
  }
  controls.update();if(!previewBusy)renderer.render(scene,camera);
}

renderList();bindUI();
try{setupScene();await choose(RECIPES[0]);requestAnimationFrame(tick);setTimeout(makeNextThumbnail,750);}catch(error){console.error('The 3D cookie renderer could not start.',error);$('loading').hidden=true;$('webgl-error').hidden=false;}
