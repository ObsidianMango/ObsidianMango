import { THREE, v3, clamp, lerp, random, buildField, groundHeight, buildLauncher, buildTarget } from './field.js';
import { canvasRenderer } from './canvas.js';
import { makePumpkin, pumpkinRadius, impact, clearSmear } from './pumpkin.js';

const $ = id => document.getElementById(id);
const ui = Object.fromEntries([
  'viewport','score','best','sound','help','instructions','round-number','round-name','distance','attempts',
  'aim-pin','pin-distance','film','film-label','feedback','feedback-type','feedback-title','feedback-detail',
  'loading','announcer','aim','angle','power','aim-value','angle-value','power-value','fire','replay'
].map(id => [id,$(id)]));
const rounds = [
  { name:'The Warm-Up', distance:23, x:.38, travel:0, rate:0 },
  { name:'Moving Target', distance:32, x:-.75, travel:2.15, rate:.93 },
  { name:'The Long Shot', distance:45, x:1.1, travel:3.7, rate:1.09 }
];
const rangeControls = [ui.aim,ui.angle,ui.power];
const bestKey = 'pumpkin-chuckin-best-v1';
const mobile = matchMedia('(pointer: coarse)').matches;
const lessMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const gravity = 9.81;
const stepSize = 1/120;
const attemptsPerRound = 3;

function setup() {
  const scene = new THREE.Scene();
  let renderer, fallback;
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('webgl2',{antialias:!mobile,powerPreference:'high-performance'});
  if(context){
    renderer = new THREE.WebGLRenderer({ canvas, context, antialias:!mobile, powerPreference:'high-performance' });
    renderer.setPixelRatio(Math.min(devicePixelRatio,mobile?1.4:1.65));
    renderer.toneMapping=THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure=1.12;
    renderer.shadowMap.enabled=true;
    renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    ui.viewport.append(renderer.domElement);
  }else{
    fallback=canvasRenderer(ui.viewport);
  }
  const camera = new THREE.PerspectiveCamera(47,1,.08,260);
  const focus = v3(), cameraGoal=v3(), focusGoal=v3();
  const materials=buildField(scene,mobile,Boolean(fallback));
  const launcher=buildLauncher(scene,materials);
  const target=buildTarget(scene,materials,1.91);
  const fruit=makePumpkin(scene,materials.skin);
  const path=new THREE.InstancedMesh(new THREE.SphereGeometry(1,8,6),
    new THREE.MeshBasicMaterial({color:'#ffdb9d',transparent:true,opacity:.83}),60);
  const transform=new THREE.Object3D();
  path.frustumCulled=false;path.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  scene.add(path);
  const sounds=createSound();

  let roundIndex=0, tries=0, roundScores=[0,0,0], best=0, phase='aim', volley=0;
  let animation=0, elapsed=0, rangeTime=0, flightTime=0, debt=0, effect=null, shot=null, lastShot=null, playback=false;
  let targetTime=0, position=v3(), velocity=v3(), rotation=new THREE.Quaternion();
  let portrait=false, aimDirty=true, time=0, nextPreview=0;
  const marks=[];
  try { best=Number(localStorage.getItem(bestKey))||0; } catch {}

  const current=()=>rounds[roundIndex];
  const total=()=>roundScores.reduce((sum,n)=>sum+n,0);
  const targetX=(seconds,round=current())=>round.x+Math.sin(seconds*round.rate)*round.travel;
  function rackTarget(seconds){
    target.stand.position.set(targetX(seconds),groundHeight(targetX(seconds),-current().distance),-current().distance);
  }
  function resetControls(){
    ui.aim.value=THREE.MathUtils.radToDeg(Math.atan2(current().x,current().distance)).toFixed(2);
    ui.angle.value=26;
    const launch=newShot(0,0);
    const depth=current().distance + launch.origin.z - .126 - pumpkinRadius*.89;
    const distance=depth/Math.cos(launch.aim);
    const height=groundHeight(current().x,-current().distance)+target.center-launch.origin.y;
    const theta=THREE.MathUtils.degToRad(+ui.angle.value);
    const speed=Math.sqrt(gravity*distance**2/(2*Math.cos(theta)**2*(distance*Math.tan(theta)-height)));
    ui.power.value=clamp((speed-7)/.20,12,100);
    updateControlText();
  }
  function resize(){
    const width=ui.viewport.clientWidth,height=ui.viewport.clientHeight;
    if(!width||!height)return;
    portrait=height>width*1.16;
    camera.aspect=width/height;
    camera.updateProjectionMatrix();
    (renderer||fallback).setSize(width,height,false);
  }

  function updateControlText(){
    ui['aim-value'].textContent=`${Math.round(+ui.aim.value)}°`;
    ui['angle-value'].textContent=`${Math.round(+ui.angle.value)}°`;
    ui['power-value'].textContent=`${Math.round(+ui.power.value)}%`;
    launcher.stand.rotation.y=-THREE.MathUtils.degToRad(+ui.aim.value);
    aimDirty=true;
    if(phase==='aim')seatPumpkin();
  }
  function seatPumpkin(){
    const anchor=v3(0,.46,-.92);
    launcher.arm.updateWorldMatrix(true,false);
    fruit.root.position.copy(launcher.arm.localToWorld(anchor));
    fruit.root.rotation.set(.07,launcher.stand.rotation.y+.21,.13);
  }
  function repaint(){
    ui.score.textContent=String(total()).padStart(4,'0');
    ui.best.textContent=String(best).padStart(4,'0');
    ui['round-number'].textContent=`Round ${roundIndex+1} / ${rounds.length}`;
    ui['round-name'].textContent=current().name;
    ui.distance.textContent=`${current().distance} m`;
    ui.attempts.setAttribute('aria-label',`${attemptsPerRound-tries} throws remaining`);
    [...ui.attempts.children].forEach((item,i)=>item.classList.toggle('spent',i<tries));
    const active=phase==='windup'||phase==='flight'||phase==='impact';
    rangeControls.forEach(control=>control.disabled=phase!=='aim');
    const fireText=phase==='roundEnd' ? (roundIndex===rounds.length-1?'Play again':'Next round')
      : active ? (playback?'Replaying…':phase==='impact'?'Impact!':'In flight…') : 'Chuck pumpkin';
    ui.fire.querySelector('span').textContent=fireText;
    ui.fire.disabled=active;
    ui.replay.disabled=active||!lastShot;
    ui.film.hidden=phase!=='impact'&&!playback;
    ui['film-label'].textContent=playback?'SLOW-MOTION REPLAY':'IMPACT CAM';
  }
  function announce(message){ui.announcer.textContent=message;}
  function clearEffect(){
    if(!effect)return;
    effect.disposeDebris();
    if(playback)clearSmear(effect.mark);
    effect=null;
  }
  function nextRound(){
    const gameOver=roundIndex===rounds.length-1;
    if(gameOver){
      roundIndex=0;
      roundScores=[0,0,0];
    } else {
      roundIndex++;
    }
    tries=0;rangeTime=0;lastShot=null;
    while(marks.length)clearSmear(marks.pop().mark);
    rackTarget(0);
    resetControls();
    enterAim();
    announce(`Round ${roundIndex+1}. ${current().name}.`);
  }
  function enterAim(){
    phase='aim';playback=false;
    launcher.arm.rotation.x=-.12;
    fruit.root.visible=true;
    seatPumpkin();
    ui.feedback.hidden=true;
    aimDirty=true;
    repaint();
  }
  function newShot(seed,start){
    const heading=THREE.MathUtils.degToRad(+ui.aim.value);
    const angle=THREE.MathUtils.degToRad(+ui.angle.value), speed=7+.20*+ui.power.value;
    return {
      origin:v3(Math.sin(heading)*.48,2.03,-Math.cos(heading)*.48),
      initial:v3(Math.sin(heading)*Math.cos(angle)*speed,Math.sin(angle)*speed,-Math.cos(heading)*Math.cos(angle)*speed),
      aim:heading,seed,start
    };
  }
  function placeAt(throwData,t,out){
    return out.copy(throwData.initial).multiplyScalar(t).add(throwData.origin).addScaledVector(down,.5*gravity*t*t);
  }
  const down=v3(0,-1,0);
  function setFruit(t){
    placeAt(shot,t,position);
    velocity.copy(shot.initial).addScaledVector(down,gravity*t);
    fruit.root.position.copy(position);
    fruit.root.rotation.set(.16+t*8.66,-shot.aim+t*2.95,t*3.3);
  }
  function collision(a,b,seconds,round,throwData){
    const boardZ=-round.distance+.126;
    const front=boardZ+pumpkinRadius*.89;
    if(a.z>=front&&b.z<front){
      const fraction=(a.z-front)/(a.z-b.z);
      const center=a.clone().lerp(b,fraction);
      const x=targetX(throwData.start+seconds-(1-fraction)*stepSize,round);
      const floor=groundHeight(x,-round.distance);
      const radial=Math.hypot(center.x-x,center.y-floor-target.center);
      if(radial<target.radius+.34){
        const reach=clamp((target.radius-.02)/Math.max(radial,.001),0,1);
        const contact=v3(x+(center.x-x)*reach,floor+target.center+(center.y-floor-target.center)*reach,boardZ);
        return {center,contact,onBoard:true,radial,fraction};
      }
    }
    const floor=groundHeight(b.x,b.z);
    if(b.y<=floor+.47){
      const priorHeight=a.y-groundHeight(a.x,a.z);
      const fraction=clamp((priorHeight-.47)/Math.max(.001,priorHeight-b.y+floor),0,1);
      const center=a.clone().lerp(b,fraction);
      const contact=v3(center.x,groundHeight(center.x,center.z)+.023,center.z);
      return {center,contact,onBoard:false,radial:Infinity,fraction};
    }
    return null;
  }
  function begin(){
    if(phase==='roundEnd'){nextRound();return;}
    if(phase!=='aim'||ui.instructions.open)return;
    clearEffect();
    const seed=(Date.now()+ ++volley*75) | 0;
    shot=newShot(seed,rangeTime+.31);
    phase='windup';elapsed=0;playback=false;
    ui.feedback.hidden=true;
    sounds.unlock();
    repaint();
  }
  function launch(){
    phase='flight';elapsed=0;flightTime=0;debt=0;
    tries++;
    setFruit(0);
    sounds.launch();
    repaint();
  }
  function replay(){
    if(!lastShot||(phase!=='aim'&&phase!=='roundEnd')||ui.instructions.open)return;
    clearEffect();
    shot=lastShot;
    playback=true;phase='flight';elapsed=0;debt=0;
    flightTime=Math.max(0,shot.hit.time-.69);
    rackTarget(shot.start+flightTime);
    setFruit(flightTime);
    fruit.root.visible=true;
    ui.feedback.hidden=true;
    for(const record of marks)if(record.seed===shot.seed)record.mark.visible=false;
    sounds.unlock();
    announce('Playing the last impact again.');
    repaint();
  }
  function applyScore(hit){
    let points=0,title='Miss';
    if(hit.onBoard){
      const fraction=hit.radial/target.radius;
      if(fraction<=.145){title='Bullseye';points=1000;}
      else if(fraction<=.30){title='Inner ring';points=750;}
      else if(fraction<=.48){title='Clean hit';points=525;}
      else if(fraction<=.67){title='Middle ring';points=350;}
      else if(fraction<=.86){title='Outer ring';points=225;}
      else {title='Edge hit';points=100;}
    }
    const improvement=Math.max(0,points-roundScores[roundIndex]);
    roundScores[roundIndex]=Math.max(points,roundScores[roundIndex]);
    if(total()>best){
      best=total();
      try{localStorage.setItem(bestKey,String(best));}catch{}
    }
    return {points,title,improvement};
  }
  function shatter(hit){
    phase='impact';elapsed=0;debt=0;
    fruit.root.visible=false;
    rackTarget(shot.start+hit.time);
    rotation.setFromEuler(fruit.root.rotation);
    effect=impact(scene,target,hit,rotation,fruit,shot.seed,mobile,Boolean(fallback));
    effect.update(0);
    if(!playback){
      shot.hit=hit;
      shot.result=applyScore(hit);
      lastShot=shot;
      marks.push({mark:effect.mark,seed:shot.seed});
      const result=shot.result;
      announce(`${result.title}. ${result.points} points. ${attemptsPerRound-tries} throws remaining.`);
    }
    sounds.crack(shot.seed,hit.velocity.length(),hit.onBoard,playback);
    repaint();
  }
  function showResult(){
    const result=shot.result;
    ui['feedback-type'].textContent=playback?'Replay':tries===attemptsPerRound?'Round complete':'Last throw';
    ui['feedback-title'].textContent=result.title;
    ui['feedback-detail'].textContent=result.points ? `${result.points} points${result.improvement<result.points?' · Round best '+roundScores[roundIndex]:''}`
      : `Landed ${Math.round(-shot.hit.contact.z)} m downrange`;
    if(tries===attemptsPerRound&&roundIndex===rounds.length-1&&!playback){
      ui['feedback-type'].textContent='Final score';
      ui['feedback-title'].textContent=total().toLocaleString('en-US');
      ui['feedback-detail'].textContent=total()===best&&best>0?'Personal best':`Best ${best.toLocaleString('en-US')}`;
    }
    ui.feedback.hidden=false;
  }
  function finishImpact(){
    showResult();
    const wasReplay=playback;
    clearEffect();
    if(wasReplay)for(const record of marks)if(record.seed===shot.seed)record.mark.visible=true;
    playback=false;
    if(tries>=attemptsPerRound){
      phase='roundEnd';
      repaint();
      return;
    }
    phase='aim';
    launcher.arm.rotation.x=-.12;
    fruit.root.visible=true;
    seatPumpkin();
    animation=time+1.45;
    aimDirty=true;
    repaint();
  }

  const prev=v3();
  function simulate(dt){
    switch(phase){
      case 'aim':
        rangeTime+=dt;
        rackTarget(rangeTime);
        if(animation>0&&time>=animation){ui.feedback.hidden=true;animation=0;}
        break;
      case 'windup':
        rangeTime+=dt;
        rackTarget(rangeTime);
        elapsed+=dt;
        launcher.arm.rotation.x=lerp(-.12,-.53,Math.sin(clamp(elapsed/.31,0,1)*Math.PI*.8));
        seatPumpkin();
        if(elapsed>=.31)launch();
        break;
      case 'flight':
        launcher.arm.rotation.x=lerp(.74,-.12,clamp(flightTime/.65,0,1));
        debt+=dt*(playback?.65:1);
        while(debt>=stepSize){
          debt-=stepSize;
          prev.copy(position);
          flightTime+=stepSize;
          if(playback&&flightTime>=shot.hit.time){
            setFruit(shot.hit.time);
            shatter(shot.hit);
            break;
          }
          setFruit(flightTime);
          rackTarget(shot.start+flightTime);
          if(playback)continue;
          const hit=collision(prev,position,flightTime,current(),shot);
          if(hit){
            hit.time=flightTime-(1-hit.fraction)*stepSize;
            setFruit(hit.time);
            hit.velocity=velocity.clone();
            rangeTime=shot.start+hit.time;
            shatter(hit);
            break;
          }
        }
        break;
      case 'impact':
        elapsed+=dt;
        debt+=dt*(elapsed<1.46?.158:lerp(.158,.78,clamp((elapsed-1.46)/.59,0,1)));
        while(debt>=stepSize){debt-=stepSize;effect.update(stepSize);}
        if(elapsed>=2.67)finishImpact();
        break;
    }
  }

  const pathPoint=v3(), projected=v3();
  function drawGuide(){
    const aim=phase==='aim';
    path.visible=aim;ui['aim-pin'].hidden=!aim;
    if(!aim)return;
    if(aimDirty||time>nextPreview){
      const preview=newShot(0,rangeTime+.31);
      let count=0;
      for(let t=.075;t<3.85&&count<60;t+=.067){
        placeAt(preview,t,pathPoint);
        if(pathPoint.y<groundHeight(pathPoint.x,pathPoint.z)+.20)break;
        const zFront=-current().distance+.61;
        if(pathPoint.z<zFront){
          const x=targetX(preview.start+t), y=groundHeight(x,-current().distance)+target.center;
          if(count&&Math.hypot(pathPoint.x-x,pathPoint.y-y)<target.radius)break;
        }
        transform.position.copy(pathPoint);
        transform.scale.setScalar(.037+Math.min(t,2)*.018);
        transform.updateMatrix();
        path.setMatrixAt(count++,transform.matrix);
      }
      path.count=count;
      path.instanceMatrix.needsUpdate=true;
      nextPreview=time+.095;
      aimDirty=false;
    }
    camera.updateMatrixWorld();
    projected.copy(target.stand.position).add(v3(0,target.center+target.radius+.15,0)).project(camera);
    const onScreen=projected.z<1&&Math.abs(projected.x)<.95&&Math.abs(projected.y)<.89;
    ui['aim-pin'].hidden=!onScreen;
    if(onScreen){
      ui['aim-pin'].style.left=`${(projected.x*.5+.5)*100}%`;
      ui['aim-pin'].style.top=`${(.5-projected.y*.5)*100}%`;
      ui['pin-distance'].textContent=`${current().distance} m`;
    }
  }
  function frameCamera(dt,instant=false){
    let fov=portrait?57:47;
    let follow=4;
    if(phase==='aim'||phase==='windup'){
      if(portrait){
        cameraGoal.set(-3.08,3.36,6.2);
        focusGoal.set(target.stand.position.x*.12,2.6,-12.5);
      }else{
        cameraGoal.set(-5.65,3.5,7.19);
        focusGoal.set(-.45+target.stand.position.x*.11,2.76,-13);
      }
      if(!lessMotion)cameraGoal.y+=Math.sin(time*.9)*.042;
    } else if(phase==='flight'){
      const approaching=clamp((-position.z-current().distance+9)/9,0,1);
      const width=portrait?2.2:3.1;
      cameraGoal.copy(position).add(v3(-width+approaching*.8,1.38+approaching*.45,5.25+approaching*.65));
      focusGoal.copy(position).add(v3(.36,.01,-1.42));
      fov=portrait?54:46;
      follow=playback?12:8;
    } else {
      const point=shot.hit.contact;
      const view=phase==='roundEnd'?2.67:elapsed;
      const sweep=lessMotion?0:clamp(view/2.7,0,1);
      const angle=lerp(-.58,-.23,sweep);
      const radius=(portrait?6.65:5.55)+sweep*1.25;
      cameraGoal.copy(point).add(v3(Math.sin(angle)*radius,shot.hit.onBoard?1.10+sweep*.50:1.57+sweep*.40,Math.cos(angle)*radius));
      focusGoal.copy(point).add(v3(0,shot.hit.onBoard?.16:.60,0));
      if(!lessMotion&&view<.32){
        cameraGoal.y+=Math.sin(view*46)*.12*(1-view/.32);
        cameraGoal.x+=Math.sin(view*39)*.18*(1-view/.32);
      }
      fov=portrait?51:42;
      follow=9;
    }
    const blend=instant?1:1-Math.exp(-dt*follow);
    camera.position.lerp(cameraGoal,blend);
    focus.lerp(focusGoal,blend);
    camera.lookAt(focus);
    camera.fov=lerp(camera.fov,fov,blend);
    camera.updateProjectionMatrix();
  }

  ui.fire.addEventListener('click',begin);
  ui.replay.addEventListener('click',replay);
  ui.help.addEventListener('click',()=>ui.instructions.showModal());
  ui.sound.addEventListener('click',()=>{
    const muted=ui.sound.getAttribute('aria-pressed')!=='true';
    ui.sound.setAttribute('aria-pressed',String(muted));
    ui.sound.setAttribute('aria-label',muted?'Enable sound':'Mute sound');
    ui.sound.title=muted?'Enable sound':'Mute sound';
    sounds.mute(muted);
  });
  rangeControls.forEach(slider=>slider.addEventListener('input',updateControlText));
  window.addEventListener('keydown',e=>{
    if(e.ctrlKey||e.metaKey||e.altKey||ui.instructions.open)return;
    if(e.code==='Space'){
      if(e.target.closest?.('button')||e.target instanceof HTMLInputElement)return;
      e.preventDefault();
      if(!e.repeat)begin();
      return;
    }
    if(e.key.toLowerCase()==='r'){
      e.preventDefault();
      if(!e.repeat)replay();
      return;
    }
    if(phase!=='aim'||e.target instanceof HTMLInputElement)return;
    const commands={ArrowLeft:[ui.aim,-1],ArrowRight:[ui.aim,1],ArrowDown:[ui.angle,-1],ArrowUp:[ui.angle,1],'-':[ui.power,-2],'+':[ui.power,2],'=':[ui.power,2]};
    if(!Object.hasOwn(commands,e.key))return;
    e.preventDefault();
    const [control,amount]=commands[e.key];
    control.value=+control.value+amount*(e.shiftKey?3:1);
    updateControlText();
  });
  window.addEventListener('resize',resize);
  renderer?.domElement.addEventListener('webglcontextlost',e=>{
    e.preventDefault();
    ui.loading.textContent='The 3D renderer paused. Reload to return to the field.';
    ui.loading.hidden=false;
  });
  launcher.arm.rotation.x=-.12;
  resize();rackTarget(0);resetControls();enterAim();
  function render(){
    if(renderer)renderer.render(scene,camera);
    else fallback.render(camera,phase==='aim'||phase==='windup'?launcher:null,target,fruit,path,
      [...marks.map(record=>record.mark),...(playback&&effect?[effect.mark]:[])],effect);
  }
  frameCamera(0,true);drawGuide();render();
  ui.loading.hidden=true;
  let then=performance.now();
  function frame(now){
    const dt=Math.min((now-then)/1000,.135);
    then=now;time+=dt;
    simulate(dt);
    frameCamera(dt);
    drawGuide();
    render();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

function createSound(){
  let ctx,master,muted=false;
  function unlock(){
    if(muted)return;
    const Audio=window.AudioContext||window.webkitAudioContext;
    if(!Audio)return;
    if(!ctx){
      ctx=new Audio();
      master=ctx.createGain();master.gain.value=.57;master.connect(ctx.destination);
    }
    if(ctx.state==='suspended')ctx.resume().catch(()=>{});
  }
  function noise(seed,delay,duration,startHz,endHz,amplitude,accent='lowpass'){
    const t=ctx.currentTime+delay,rng=random(seed),floatCount=Math.ceil(duration*ctx.sampleRate);
    const buffer=ctx.createBuffer(1,floatCount,ctx.sampleRate);
    const samples=buffer.getChannelData(0);
    for(let i=0;i<floatCount;i++)samples[i]=(rng()*2-1);
    const source=ctx.createBufferSource();source.buffer=buffer;
    const filter=ctx.createBiquadFilter();filter.type=accent;
    filter.frequency.setValueAtTime(startHz,t);
    filter.frequency.exponentialRampToValueAtTime(endHz,t+duration);
    const gain=ctx.createGain();
    gain.gain.setValueAtTime(.001,t);
    gain.gain.linearRampToValueAtTime(amplitude,t+.006);
    gain.gain.exponentialRampToValueAtTime(.001,t+duration);
    source.connect(filter);filter.connect(gain);gain.connect(master);
    source.start(t);source.stop(t+duration);
  }
  function thump(delay,duration,startHz,endHz,amplitude){
    const t=ctx.currentTime+delay,osc=ctx.createOscillator(),gain=ctx.createGain();
    osc.type='sine';
    osc.frequency.setValueAtTime(startHz,t);
    osc.frequency.exponentialRampToValueAtTime(endHz,t+duration);
    gain.gain.setValueAtTime(amplitude,t);
    gain.gain.exponentialRampToValueAtTime(.001,t+duration);
    osc.connect(gain);gain.connect(master);
    osc.start(t);osc.stop(t+duration);
  }
  return {
    unlock,
    mute(value){muted=value;if(master)master.gain.value=muted?0:.57;},
    launch(){
      if(!ctx||muted)return;
      const seed=Date.now() | 0;
      thump(0,.20,140,42,.37);
      noise(seed,.006,.24,3000,420,.52);
      noise(seed+1,.061,.36,960,190,.19,'bandpass');
    },
    crack(seed,speed,board,replay){
      if(!ctx||muted)return;
      const amp=clamp(speed/22,.6,1.24);
      thump(0,.23,board?120:78,39,.65*amp);
      noise(seed,0,.075,board?5720:2660,610,.94*amp);
      noise(seed+1,.026,.34,1120,replay?170:269,.53*amp,'bandpass');
      const rng=random(seed+7);
      for(let i=0;i<9;i++){
        const frequency=620+rng()*4500;
        noise(seed+i+3,.042+i*(replay?.061:.04)+rng()*.031,.044+rng()*.05,frequency,frequency*.45,.105*amp,'bandpass');
      }
      noise(seed+9,.31,.31,1400,215,.19*amp);
    }
  };
}

try {
  setup();
} catch(error) {
  console.error(error);
  ui.loading.textContent='The 3D field could not start. Try a browser with WebGL 2 enabled.';
}
