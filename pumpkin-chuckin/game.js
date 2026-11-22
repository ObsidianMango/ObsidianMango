import { THREE, v3, clamp, lerp, buildField, groundHeight, buildLauncher, buildTarget } from './field.js';
import { canvasRenderer } from './canvas.js?v=booth-1';
import { makePumpkin, pumpkinRadius, prepareImpact, clearSmear } from './pumpkin.js?v=booth-1';
import { defaultProduce, findProduce, bindProducePicker } from './produce.js';
import { boothRounds, buildBooth, boothCollision } from './booth.js';
import { createSound } from './sound.js';

const $ = id => document.getElementById(id);
const ui = Object.fromEntries([
  'viewport','score','best','sound','help','instructions','round-number','round-name','distance','attempts',
  'aim-pin','pin-distance','film','film-label','feedback','feedback-type','feedback-title','feedback-detail',
  'loading','announcer','aim','angle','power','aim-value','angle-value','power-value','fire','replay',
  'produce-open','produce-current-icon','produce-current-name','produce-picker','produce-search','produce-categories',
  'produce-random','produce-results','produce-options','targets-mode','booth-mode'
].map(id => [id,$(id)]));
const targetRounds = [
  { name:'The Warm-Up', distance:23, x:.38, travel:0, rate:0 },
  { name:'Moving Target', distance:32, x:-.75, travel:2.15, rate:.93 },
  { name:'The Long Shot', distance:45, x:1.1, travel:3.7, rate:1.09 }
];
const rangeControls = [ui.aim,ui.angle,ui.power];
const bestKey = 'pumpkin-chuckin-best-v1';
const boothBestKey = 'pumpkin-chuckin-booth-best-v1';
const produceKey = 'pumpkin-chuckin-produce-v1';
const mobile = matchMedia('(pointer: coarse)').matches;
const lessMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const gravity = 9.81;
const stepSize = 1/120;
const attemptsPerRound = 3;
const liveImpactDuration = 1.28;
const replayImpactDuration = 2.67;

async function setup() {
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
  const booth=buildBooth(scene,materials);
  const fruit=makePumpkin(scene,materials.skin);
  const path=new THREE.InstancedMesh(new THREE.SphereGeometry(1,8,6),
    new THREE.MeshBasicMaterial({color:'#ffdb9d',transparent:true,opacity:.83}),60);
  const transform=new THREE.Object3D();
  path.frustumCulled=false;path.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  scene.add(path);
  const sounds=createSound();

  let course=new URLSearchParams(window.location.search).get('mode')==='booth'?'booth':'targets';
  let rounds=course==='booth'?boothRounds:targetRounds;
  let roundIndex=0, tries=0, roundScores=[0,0,0], best=0, phase='aim', volley=0;
  let animation=0, elapsed=0, rangeTime=0, flightTime=0, debt=0, effect=null, shot=null, lastShot=null, playback=false;
  let bestChanged=false, selectedProduce=defaultProduce;
  const position=v3(), rotation=new THREE.Quaternion(), spin=new THREE.Euler();
  let portrait=false, aimDirty=true, time=0, nextPreview=0;
  let marks=[], impactAge=0;
  const runs=new Map();
  const scoreKey=()=>course==='booth'?boothBestKey:bestKey;
  try {
    best=Number(localStorage.getItem(scoreKey()))||0;
    selectedProduce=findProduce(localStorage.getItem(produceKey))||defaultProduce;
  } catch {}
  activateProduce(selectedProduce);

  const current=()=>rounds[roundIndex];
  const total=()=>roundScores.reduce((sum,n)=>sum+n,0);
  const impactDuration=()=>playback?replayImpactDuration:course==='booth'?1.52:liveImpactDuration;
  function activateProduce(entry){
    if(fruit.produce!==entry)fruit.select(entry);
    fallback?.prepareFruit(fruit);
  }
  function chooseProduce(entry){
    selectedProduce=entry;
    activateProduce(entry);
    if(phase==='aim')seatPumpkin();
    aimDirty=true;
    try{localStorage.setItem(produceKey,entry.id);}catch{}
    repaint();
    announce(`${entry.name} selected.`);
  }
  const targetX=(seconds,round=current())=>round.x+Math.sin(seconds*round.rate)*round.travel;
  function rackTarget(seconds,hit=null,age=0){
    if(course==='booth'){
      booth.update(current(),seconds,hit,age);
      if(hit?.volunteer!==undefined&&effect){
        const damp=hit.reaction.cleanup==='wipe'?.63:.39;
        effect.mark.material.opacity=1-damp*clamp((age-.45)/.52,0,1);
      }
      return;
    }
    target.stand.position.set(targetX(seconds),groundHeight(targetX(seconds),-current().distance),-current().distance);
  }
  function showCourse(){
    target.stand.visible=course==='targets';
    booth.setVisible(course==='booth');
  }
  function switchCourse(name){
    if(course===name||(phase!=='aim'&&phase!=='roundEnd'))return;
    runs.set(course,{roundIndex,tries,roundScores,rangeTime,shot,lastShot,phase,marks,best,
      controls:rangeControls.map(control=>control.value)});
    for(const record of marks)record.mark.visible=false;
    course=name;
    rounds=course==='booth'?boothRounds:targetRounds;
    const prior=runs.get(course);
    roundIndex=prior?.roundIndex||0;
    tries=prior?.tries||0;
    roundScores=prior?.roundScores||[0,0,0];
    rangeTime=prior?.rangeTime||0;
    shot=prior?.shot||null;
    lastShot=prior?.lastShot||null;
    phase=prior?.phase||'aim';
    marks=prior?.marks||[];
    best=prior?.best||0;
    if(!prior)try{best=Number(localStorage.getItem(scoreKey()))||0;}catch{}
    for(const record of marks)record.mark.visible=true;
    showCourse();
    rackTarget(rangeTime);
    if(prior){
      rangeControls.forEach((control,i)=>control.value=prior.controls[i]);
      updateControlText();
    }else resetControls();
    if(phase==='roundEnd'){
      fruit.root.visible=false;
      showResult();
      repaint();
    }else enterAim();
    announce(course==='booth'?'Splat Booth selected.':'Bullseyes selected.');
  }
  function resetControls(){
    ui.aim.value=THREE.MathUtils.radToDeg(Math.atan2(current().x,current().distance)).toFixed(2);
    ui.angle.value=26;
    const launch=newShot(0,0);
    const depth=current().distance + launch.origin.z - .126 - launch.radius*.89;
    const distance=depth/Math.cos(launch.aim);
    const height=groundHeight(current().x,-current().distance)+(course==='booth'?1.43:target.center)-launch.origin.y;
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
    const anchor=v3(0,.46+(fruit.produce.scale[1]-1)*.39+fruit.seatLift,-.92);
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
      : active ? (playback?'Replaying…':phase==='impact'?'Impact!':'In flight…') : `Chuck ${selectedProduce.name.toLowerCase()}`;
    ui.fire.querySelector('span').textContent=fireText;
    ui.fire.disabled=active;
    ui.replay.disabled=active||!lastShot;
    ui['produce-open'].disabled=active;
    for(const key of ['targets','booth']){
      ui[key+'-mode'].disabled=active;
      ui[key+'-mode'].setAttribute('aria-pressed',String(course===key));
    }
    ui.film.hidden=phase!=='impact'&&!playback;
    ui['film-label'].textContent=playback?`Slow-motion replay · ${shot.produce.name}`:'IMPACT CAM';
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
    const produce=selectedProduce;
    const [width,height,depth]=produce.scale;
    const crossSection=Math.max(width,depth);
    return {
      origin:v3(Math.sin(heading)*.48,2.03+(height-1)*.35,-Math.cos(heading)*.48),
      initial:v3(Math.sin(heading)*Math.cos(angle)*speed,Math.sin(angle)*speed,-Math.cos(heading)*Math.cos(angle)*speed),
      aim:heading,seed,start,produce,radius:pumpkinRadius*crossSection,groundClearance:.47*(height*.58+crossSection*.42)
    };
  }
  function placeAt(throwData,t,out){
    return out.copy(throwData.initial).multiplyScalar(t).add(throwData.origin).addScaledVector(down,.5*gravity*t*t);
  }
  const down=v3(0,-1,0);
  function spinAt(throwData,t){
    return spin.set(.16+t*8.66,-throwData.aim+t*2.95,t*3.3);
  }
  function setFruit(t){
    placeAt(shot,t,position);
    fruit.root.position.copy(position);
    fruit.root.rotation.copy(spinAt(shot,t));
  }
  function collision(a,b,seconds,round,throwData){
    const boardZ=-round.distance+.126;
    const front=boardZ+throwData.radius*.89;
    if(course==='booth'){
      const volunteerHit=boothCollision(a,b,throwData.radius,round,throwData.start+seconds,throwData.seed);
      if(volunteerHit)return volunteerHit;
    }else if(a.z>=front&&b.z<front){
      const fraction=(a.z-front)/(a.z-b.z);
      const center=a.clone().lerp(b,fraction);
      const x=targetX(throwData.start+seconds-(1-fraction)*stepSize,round);
      const y=groundHeight(x,-round.distance)+target.center;
      const radial=Math.hypot(center.x-x,center.y-y);
      if(radial<target.radius+throwData.radius*.52){
        const reach=clamp((target.radius-.02)/Math.max(radial,.001),0,1);
        const contact=v3(x+(center.x-x)*reach,y+(center.y-y)*reach,boardZ);
        return {center,contact,onBoard:true,radial,fraction,boardX:x,boardY:y};
      }
    }
    const floor=groundHeight(b.x,b.z);
    if(b.y<=floor+throwData.groundClearance){
      const priorHeight=a.y-groundHeight(a.x,a.z);
      const fraction=clamp((priorHeight-throwData.groundClearance)/Math.max(.001,priorHeight-b.y+floor),0,1);
      const center=a.clone().lerp(b,fraction);
      const contact=v3(center.x,groundHeight(center.x,center.z)+.023,center.z);
      return {center,contact,onBoard:false,radial:Infinity,fraction};
    }
    return null;
  }
  function traceShot(throwData){
    const prior=throwData.origin.clone(), next=v3(), round=current();
    for(let t=stepSize;;t+=stepSize){
      placeAt(throwData,t,next);
      const hit=collision(prior,next,t,round,throwData);
      if(hit){
        hit.time=t-(1-hit.fraction)*stepSize;
        hit.velocity=throwData.initial.clone().addScaledVector(down,gravity*hit.time);
        if(hit.volunteer!==undefined){
          const style=throwData.produce.style;
          hit.reaction.cleanup=style.pulp>=.78?'wipe':style.name==='Leafy'?'brush':'shake';
          hit.reaction.lean*=clamp((hit.velocity.length()/20)*(.82+style.bounce*.78),.64,1.24);
        }
        return hit;
      }
      prior.copy(next);
    }
  }
  function stageImpact(throwData){
    const hit=throwData.hit;
    activateProduce(throwData.produce);
    rotation.setFromEuler(spinAt(throwData,hit.time));
    const patch=hit.volunteer===undefined?null:booth.decalAnchor(hit);
    const prepared=prepareImpact(scene,target,hit,rotation,fruit,throwData.seed,mobile,Boolean(fallback),patch);
    if(renderer)for(const texture of prepared.textures)renderer.initTexture(texture);
    return prepared;
  }
  function begin(){
    if(ui.fire.disabled||ui['produce-picker'].open)return;
    if(phase==='roundEnd'){nextRound();return;}
    if(phase!=='aim'||ui.instructions.open)return;
    clearEffect();
    const seed=(Date.now()+ ++volley*75) | 0;
    shot=newShot(seed,rangeTime+.31);
    shot.hit=traceShot(shot);
    phase='windup';elapsed=0;playback=false;
    ui.feedback.hidden=true;
    sounds.unlock();
    repaint();
    effect=stageImpact(shot);
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
    effect=stageImpact(shot);
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
    if(hit.volunteer!==undefined){
      points=hit.quality>=.60?1000:hit.quality>=.35?750:500;
      title=hit.region==='head'?'Cap splat':'Splat!';
    }else if(hit.onBoard){
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
      bestChanged=true;
    }
    return {points,title,improvement};
  }
  function advanceDebris(seconds){
    debt+=seconds;
    while(debt>=stepSize){
      debt-=stepSize;
      effect.update(stepSize);
      impactAge+=stepSize;
    }
    effect.syncParticles();
    const contacts=effect.takeSounds();
    if(contacts.length)sounds.fragments(contacts,shot,playback);
  }
  function shatter(overrun){
    const hit=shot.hit;
    phase='impact';elapsed=0;debt=0;impactAge=0;
    fruit.root.visible=false;
    sounds.impact(shot,effect.soundprint,playback);
    advanceDebris(Math.max(stepSize,playback?overrun*.158:overrun));
    effect.setVisible(true);
    if(course==='booth')rackTarget(shot.start+hit.time,hit,impactAge);
    if(!playback){
      rangeTime=shot.start+hit.time;
      shot.result=applyScore(hit);
      lastShot=shot;
      marks.push({mark:effect.mark,seed:shot.seed});
      const result=shot.result;
      const name=hit.volunteerName?` ${hit.volunteerName} took the splash.`:'';
      announce(`${result.title}${result.title.endsWith('!')?'':'.'}${name} ${result.points} points. ${attemptsPerRound-tries} throws remaining.`);
    }
    repaint();
  }
  function showResult(){
    const result=shot.result;
    ui['feedback-type'].textContent=playback?'Replay':tries===attemptsPerRound?'Round complete':'Last throw';
    ui['feedback-title'].textContent=result.title;
    const who=shot.hit.volunteerName?`${shot.hit.volunteerName} · `:'';
    ui['feedback-detail'].textContent=result.points ? `${who}${result.points} points${result.improvement<result.points?' · Round best '+roundScores[roundIndex]:''}`
      : `Landed ${Math.round(-shot.hit.contact.z)} m downrange`;
    if(tries===attemptsPerRound&&roundIndex===rounds.length-1&&!playback){
      ui['feedback-type'].textContent='Final score';
      ui['feedback-title'].textContent=total().toLocaleString('en-US');
      ui['feedback-detail'].textContent=total()===best&&best>0?'Personal best':`Best ${best.toLocaleString('en-US')}`;
    }
    ui.feedback.hidden=false;
  }
  function finishImpact(){
    if(bestChanged){
      try{localStorage.setItem(scoreKey(),String(best));}catch{}
      bestChanged=false;
    }
    showResult();
    const wasReplay=playback;
    clearEffect();
    if(wasReplay)for(const record of marks)if(record.seed===shot.seed)record.mark.visible=true;
    playback=false;
    activateProduce(selectedProduce);
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
        flightTime+=dt*(playback?.65:1);
        const t=Math.min(shot.hit.time,flightTime);
        setFruit(t);
        rackTarget(shot.start+t);
        if(flightTime>=shot.hit.time)shatter(flightTime-shot.hit.time);
        break;
      case 'impact':
        elapsed+=dt;
        advanceDebris(dt*(playback?lerp(.158,.78,clamp((elapsed-1.46)/.59,0,1)):1));
        if(course==='booth')rackTarget(shot.start+shot.hit.time,shot.hit,impactAge);
        if(elapsed>=impactDuration())finishImpact();
        break;
    }
  }

  const pathPoint=v3(), projected=v3();
  let markedVolunteer=0;
  function drawGuide(){
    const aim=phase==='aim';
    path.visible=aim;ui['aim-pin'].hidden=!aim;
    if(!aim)return;
    if(aimDirty||time>nextPreview){
      const preview=newShot(0,rangeTime+.31);
      let count=0;
      const predicted=traceShot(preview);
      const contactTime=predicted.time;
      markedVolunteer=predicted.volunteer??0;
      for(let t=.075;t<contactTime&&count<60;t+=.067){
        placeAt(preview,t,pathPoint);
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
    const actor=course==='booth'?booth.actors[markedVolunteer]:null;
    if(actor)projected.copy(actor.root.position).add(v3(0,actor.state.hip+1.31,0));
    else projected.copy(target.stand.position).add(v3(0,target.center+target.radius+.15,0));
    projected.project(camera);
    const onScreen=projected.z<1&&Math.abs(projected.x)<.95&&Math.abs(projected.y)<.89;
    ui['aim-pin'].hidden=!onScreen;
    if(onScreen){
      ui['aim-pin'].style.left=`${(projected.x*.5+.5)*100}%`;
      ui['aim-pin'].style.top=`${(.5-projected.y*.5)*100}%`;
      ui['pin-distance'].textContent=actor?`${actor.name} · ${Math.round(-actor.state.z)} m`:`${current().distance} m`;
    }
  }
  function frameCamera(dt,instant=false){
    let fov=portrait?57:47;
    let follow=4;
    if(phase==='aim'||phase==='windup'){
      const aimX=course==='booth'?booth.actors[0].state.x:target.stand.position.x;
      if(portrait){
        cameraGoal.set(-3.08,3.36,6.2);
        focusGoal.set(aimX*.12,2.6,-12.5);
      }else{
        cameraGoal.set(-5.65,3.5,7.19);
        focusGoal.set(-.45+aimX*.11,2.76,-13);
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
      const view=phase==='roundEnd'?liveImpactDuration:elapsed;
      const sweep=lessMotion?0:clamp(view/impactDuration(),0,1);
      const angle=lerp(-.58,-.23,sweep);
      const performer=shot.hit.volunteer!==undefined;
      const radius=(performer?(portrait?4.76:3.72):(portrait?6.65:5.55))+sweep*(performer?.49:1.25);
      const lift=performer?.78+sweep*.32:shot.hit.onBoard?1.10+sweep*.50:1.57+sweep*.40;
      cameraGoal.copy(point).add(v3(Math.sin(angle)*radius,lift,Math.cos(angle)*radius));
      focusGoal.copy(point).add(v3(0,performer?-.14:shot.hit.onBoard?.16:.60,0));
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
  ui['targets-mode'].addEventListener('click',()=>switchCourse('targets'));
  ui['booth-mode'].addEventListener('click',()=>switchCourse('booth'));
  bindProducePicker(ui,selectedProduce,chooseProduce);
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
    if(e.ctrlKey||e.metaKey||e.altKey||ui.instructions.open||ui['produce-picker'].open)return;
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
  showCourse();
  resize();rackTarget(0);resetControls();enterAim();
  function render(){
    if(renderer)renderer.render(scene,camera);
    else fallback.render(camera,phase==='aim'||phase==='windup'?launcher:null,target,fruit,path,
      [...marks.map(record=>record.mark),...(playback&&effect?[effect.mark]:[])],phase==='impact'?effect:null,course==='booth'?booth:null);
  }
  frameCamera(0,true);drawGuide();
  if(renderer){
    ui.fire.disabled=true;
    ui['produce-open'].disabled=true;
    ui['targets-mode'].disabled=true;
    ui['booth-mode'].disabled=true;
    const warmupShot=newShot(0,0);
    warmupShot.hit=traceShot(warmupShot);
    const warmup=stageImpact(warmupShot);
    const warmupCamera=camera.clone();
    warmupCamera.position.copy(warmupShot.hit.contact).add(v3(-2,2,6));
    warmupCamera.lookAt(warmupShot.hit.contact);
    warmup.setVisible(true);
    warmup.update(.14);
    warmup.syncParticles();
    renderer.domElement.style.visibility='hidden';
    // Keep the warmed materials in the scene so Three.js retains their shader programs.
    await renderer.compileAsync(scene,warmupCamera);
    renderer.render(scene,warmupCamera);
    warmup.setVisible(false);
    renderer.domElement.style.visibility='';
    repaint();
  }
  render();
  ui.loading.hidden=true;
  let then=performance.now();
  function frame(now){
    const dt=clamp((now-then)/1000,0,.25);
    then=now;time+=dt;
    simulate(dt);
    frameCamera(dt);
    drawGuide();
    render();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

setup().catch(error=>{
  console.error(error);
  ui.loading.textContent='The 3D field could not start. Try a browser with WebGL 2 enabled.';
});
