import {characterById} from './characters.js?v=duel-2';
import {createLocalPeer,PROTOCOL} from './local-peer.js?v=duel-2';
import {createRoomPeer} from './room-peer.js?v=online-1';
import {createRivalVisual} from './multiplayer-visuals.js?v=details-2';
import {eligible,cleanPose,vec,createDuelRules,GUNS,COMBAT,validLevel} from './duel-rules.js?v=details-2';
export function createMultiplayer({T,scene,camera,profile,sample,onStart,onRespawn,onNotice=()=>{},onCombatEffect=()=>{},makeVehicle=()=>null,blocked=()=>Infinity,worldX=()=>0,RTC,now=()=>performance.now()/1000}){
 let ready=false,remoteProfile=null,matchLevel=0,sessionProfile=null,remotePose=null,lastRemote=0,seq=0,shotSeq=0,beat=0,healthSeq=0,remoteHealthSeq=-1,role='',rules=null,localLife=0,health=[fresh(),fresh()],status='Not connected',healthSignature='',remoteRoot=null,visual=null,traceMesh=null,traces=[],wreckSeq=0,lastWreckSeq=-1;
 const subscribers=new Set(),geometries=[],materials=[];
 function fresh(){return {hp:100,score:0,deaths:0,life:0,respawn:0,shield:3,slow:0};}
 function change(s){status=s;for(const fn of subscribers)fn(info());}
 const index=()=>role==='host'?0:1;
 function info(){const i=index();return {ready,level:matchLevel,character:sessionProfile?.character||profile().character||'mango',opponentCharacter:remoteProfile?.character||'mango',role:role||peer.getInfo().role,status,health:health[i],opponent:health[1-i],pose:remotePose,eligible:eligible(profile()),supported:peer.getInfo().supported,connected:peer.getInfo().open,resources:{players:remoteRoot?1:0,vehicleParts:visual?.partCount||0,debris:visual?.debrisCount||0,geometries:geometries.length,materials:materials.length,traces:traces.length,physicsBodies:0}};}
 function canAct(){return !ready||health[index()].hp>0;}
 function movementScale(){return ready&&health[index()].slow>0?.45:1;}
 function material(color){const m=new T.MeshStandardMaterial({color,roughness:.8});materials.push(m);return m;}
 function buildVisual(){
  if(visual)return;
  visual=createRivalVisual({T,scene,makeVehicle,worldX});
  remoteRoot=visual.root;
  const g=new T.BoxGeometry(1,1,1);geometries.push(g);
  const m=material(0xffec9c);
  traceMesh=new T.InstancedMesh(g,m,8);traceMesh.frustumCulled=false;traceMesh.count=0;scene.add(traceMesh);
 }
 function receiveWreck(w){
  if(!ready||!w||!Number.isSafeInteger(w.id)||w.id<=lastWreckSeq||w.id>10000000||!vec(w.p)||!Array.isArray(w.q)||w.q.length!==4||w.q.some(n=>!Number.isFinite(n)||Math.abs(n)>1.01)||typeof w.vehicleId!=='string'||!/^[a-z0-9-]{1,32}$/.test(w.vehicleId)||!Number.isFinite(w.strength)||w.strength<0||w.strength>30)return;
  lastWreckSeq=w.id;buildVisual();
  visual.explode(w);
  onCombatEffect({kind:'vehicle-wreck',p:w.p,strength:w.strength});
  for(const fn of subscribers)fn(info());
 }
 function wreck({vehicleId,p,q,strength=10}={}){
  if(!ready||!vec(p)||!Array.isArray(q)||q.length!==4||q.some(n=>!Number.isFinite(n)||Math.abs(n)>1.01)||typeof vehicleId!=='string')return false;
  return peer.send({t:'wreck',wreck:{id:++wreckSeq,vehicleId,p,q,strength:Math.max(0,Math.min(30,strength))}});
 }
 function effect(e,broadcast=false){if(e?.kind==='web'&&vec(e.from)&&vec(e.to)&&[0,1].includes(e.target)){onCombatEffect({...e,target:e.target===index()?'local':'remote',object:e.target!==index()?remoteRoot:null});}else if(e?.kind==='shot'&&vec(e.from)&&vec(e.to)){if(traces.length===8)traces.shift();traces.push({from:e.from,to:e.to,life:.14});}else if(e?.kind==='blast'&&vec(e.p)){onCombatEffect(e);}else return;if(broadcast)peer.send({t:'effect',e});}
 function applyHealth(next){if(!Array.isArray(next)||next.length!==2||next.some(a=>!a||!['hp','score','deaths','life','respawn','shield','slow'].every(k=>Number.isFinite(a[k])&&a[k]>=0)||a.hp>100||a.respawn>6||a.shield>4||a.slow>3.1))return;const i=index(),was=health[i]?.hp,wasSlowed=health[i]?.slow>0;health=next.map(a=>({...a}));if(health[i].slow>0&&!wasSlowed)onNotice('Webbed · movement slowed for 3 seconds',2);if(health[i].hp===0&&was>0)onNotice('Knocked out · respawn in 5 seconds',5);if(health[i].life>localLife){localLife=health[i].life;onRespawn(role);onNotice('Respawned · 3 second shield',2);}const signature=health.map(a=>[a.hp,a.score,a.deaths,a.life,Math.ceil(a.respawn),Math.ceil(a.shield),Math.ceil(a.slow)]).flat().join(',');if(signature!==healthSignature){healthSignature=signature;for(const fn of subscribers)fn(info());}}
 function begin(){if(ready)return;ready=true;health=[fresh(),fresh()];localLife=0;buildVisual();visual.chooseCharacter(remoteProfile?.character);lastWreckSeq=-1;wreckSeq=0;onStart(role,matchLevel,characterById(sessionProfile?.character).id);change('Duel connected · both players opted in');}
 function localPose(){const p=sample();return cleanPose({...p,seq:++seq});}
 function welcome(){if(role!=='host'||!remoteProfile||ready||!peer.getInfo().open)return;rules=createDuelRules({now,blocked,onEffect:e=>effect(e,true)});rules.setGuns(0,sessionProfile.guns);rules.setGuns(1,remoteProfile.guns);if(peer.send({t:'welcome',v:PROTOCOL,profile:sessionProfile,level:matchLevel}))begin();}
 function packet(p){role=role||peer.getInfo().role;lastRemote=now();
  if(p.t==='bye'){peer.close('Other player left');return;}
  if(p.t==='hello'){if(ready)return;if(p.v!==PROTOCOL||!eligible(p.profile)||!validLevel(p.profile.level)){peer.close('This player has an incompatible game version.');return;}remoteProfile={level:p.profile.level,character:characterById(p.profile.character).id,guns:p.profile.guns.filter(w=>Object.hasOwn(GUNS,w)).slice(0,3)};
   welcome();return;}
  if(p.t==='welcome'&&role==='guest'&&!ready&&p.v===PROTOCOL&&eligible(p.profile)&&validLevel(p.level)){remoteProfile=p.profile;matchLevel=p.level;begin();return;}
  if(!ready)return;
  if(p.t==='pose'){const pose=cleanPose(p.pose);if(!pose||pose.seq<=(remotePose?.seq??-1))return;const changed=remotePose?.active!==pose.active||remotePose?.safe!==pose.safe;remotePose=pose;if(role==='host')rules.pose(1,pose);if(changed)for(const fn of subscribers)fn(info());}
  else if(p.t==='shot'&&role==='host')rules.shot(1,p.shot);
  else if(p.t==='health'&&role==='guest'&&Number.isSafeInteger(p.seq)&&p.seq>remoteHealthSeq){remoteHealthSeq=p.seq;applyHealth(p.players);}
  else if(p.t==='effect'&&role==='guest')effect(p.e);
  else if(p.t==='wreck')receiveWreck(p.wreck);
 }
 let peer;const callbacks={RTC,onStatus:change,onOpen:()=>{role=peer.getInfo().role;lastRemote=now();peer.send({t:'hello',v:PROTOCOL,profile:sessionProfile});welcome();},onPacket:packet,onClose:s=>{ready=false;role='';remotePose=null;rules=null;health=[fresh(),fresh()];if(visual)visual.reset();traces=[];if(traceMesh)traceMesh.count=0;change(s);}};
 const manualPeer=createLocalPeer(callbacks),onlinePeer=createRoomPeer(callbacks);peer=manualPeer;
 function check(){const p=profile();if(!eligible(p))throw Error('Player profile is unavailable. Reload the game.');sessionProfile={guns:p.guns.filter(w=>Object.hasOwn(GUNS,w)).slice(0,3),level:validLevel(p.level)?p.level:0,character:characterById(p.character).id};matchLevel=sessionProfile.level;}
 async function host(){check();remoteProfile=null;remotePose=null;remoteHealthSeq=-1;if(peer!==manualPeer)peer.close('Switching to local pairing');peer=manualPeer;return peer.host();}
 async function join(code){check();remoteProfile=null;remotePose=null;remoteHealthSeq=-1;if(peer!==manualPeer)peer.close('Switching to local pairing');peer=manualPeer;return peer.join(code);}
 async function hostRoom(){check();remoteProfile=null;remotePose=null;remoteHealthSeq=-1;if(peer!==onlinePeer)peer.close('Switching to online rooms');peer=onlinePeer;return peer.host();}
 async function joinRoom(code){check();remoteProfile=null;remotePose=null;remoteHealthSeq=-1;if(peer!==onlinePeer)peer.close('Switching to online rooms');peer=onlinePeer;return peer.join(code);}
 function shoot(weapon,from,dir){if(!ready||!canAct()||!Object.hasOwn(COMBAT,weapon))return false;const p=localPose();if(!p)return false;const shot={seq:++shotSeq,weapon,from:[from.x-worldX(),from.y,from.z],dir:[dir.x,dir.y,dir.z]};if(role==='host'){rules.pose(0,p);return rules.shot(0,shot);}peer.send({t:'pose',pose:p});return peer.send({t:'shot',shot});}
 function update(dt){if(!ready)return;if(now()-lastRemote>15){peer.close('Peer stopped responding. Create a fresh invite.');return;}dt=Math.min(.1,Math.max(0,dt));beat+=dt;const p=localPose();if(role==='host'&&p){rules.pose(0,p);rules.tick(dt);applyHealth(rules.snapshot());}
  if(beat>=1/15){beat=0;if(p)peer.send({t:'pose',pose:p});if(role==='host')peer.send({t:'health',seq:++healthSeq,players:rules.snapshot()});}
  const visible=remotePose&&remotePose.active&&!remotePose.safe&&sample()?.active&&!sample()?.safe&&health[1-index()].hp>0&&now()-lastRemote<1.5;
  visual.update(remotePose,health[1-index()],dt,!!visible);
  visual.faceHealth(camera);
  for(let i=traces.length-1;i>=0;i--){traces[i].life-=dt;if(traces[i].life<=0)traces.splice(i,1);}const dummy=new T.Object3D();for(let i=0;i<traces.length;i++){const e=traces[i],from=new T.Vector3(e.from[0]+worldX(),e.from[1],e.from[2]),to=new T.Vector3(e.to[0]+worldX(),e.to[1],e.to[2]),direction=to.clone().sub(from);dummy.position.copy(from).add(to).multiplyScalar(.5);dummy.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),direction.normalize());dummy.scale.set(.025,.025,from.distanceTo(to));dummy.updateMatrix();traceMesh.setMatrixAt(i,dummy.matrix);}traceMesh.count=traces.length;traceMesh.instanceMatrix.needsUpdate=true;
 }
 return {host,join,hostRoom,joinRoom,accept:code=>manualPeer.accept(code),shoot,wreck,update,canAct,movementScale,info,subscribe(fn){subscribers.add(fn);return ()=>subscribers.delete(fn);},leave(){peer.send({t:'bye'});peer.close('Left duel · solo mode');},get role(){return role;}};
}
