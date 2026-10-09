import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createMultiplayer} from '../multiplayer.js';
const require=createRequire(import.meta.url),T=require('../three.min.js'),{RTCPeerConnection}=require('/tmp/parkside-network/node_modules/werift');
// The container blocks interface enumeration; advertise loopback for real UDP ICE.
require('node:os').networkInterfaces=()=>({lo:[{address:'127.0.0.1',family:'IPv4',internal:true}]});
class LocalRTC extends RTCPeerConnection{constructor(config){super({...config,iceAdditionalHostAddresses:['127.0.0.1'],iceUseIpv6:false});}}
let time=0;const sceneA=new T.Scene(),sceneB=new T.Scene(),camera=new T.PerspectiveCamera(),positionA=[0,0,0],positionB=[0,0,-10],start=[],respawns=[];
const create=(n,scene,pos)=>createMultiplayer({T,scene,camera,RTC:LocalRTC,now:()=>time,profile:()=>({complete:true,guns:['pistol']}),sample:()=>({p:pos,yaw:0,mode:'foot',weapon:'pistol',active:true,safe:false}),onStart:r=>start.push(r),onRespawn:r=>respawns.push(r)});
const a=create(0,sceneA,positionA),b=create(1,sceneB,positionB),wait=ms=>new Promise(r=>setTimeout(r,ms));
try{const invite=await a.host();assert.equal(a.info().role,'host');const reply=await b.join(invite);assert.equal(b.info().role,'guest');await a.accept(reply);for(let i=0;i<200&&(!a.info().ready||!b.info().ready);i++)await wait(20);assert(a.info().ready,a.info().status);assert(b.info().ready,b.info().status);assert.deepEqual(start.sort(),['guest','host']);
 const step=async()=>{time+=.1;a.update(.1);b.update(.1);await wait(15);};for(let i=0;i<45;i++)await step();assert(b.info().pose);assert(a.info().pose);
 for(let i=0;i<4;i++){assert(a.shoot('pistol',{x:0,y:1.47,z:0},{x:0,y:0,z:-1}));for(let j=0;j<4;j++)await step();}assert.equal(a.info().opponent.hp,0);assert.equal(b.info().health.hp,0);assert(!b.canAct());assert.equal(a.info().health.score,1);
 for(let i=0;i<60;i++)await step();assert(b.canAct());assert.equal(b.info().health.hp,100);assert.deepEqual(respawns,['guest']);const resourceA=a.info().resources;assert.equal(resourceA.physicsBodies,0);assert.equal(resourceA.players,1);assert.equal(resourceA.geometries,1);assert(resourceA.materials<=8);assert(resourceA.traces<=8);
 a.leave();for(let i=0;i<50&&b.info().ready;i++)await wait(10);assert(!a.info().ready);assert(!b.info().ready);assert.equal(a.info().resources.traces,0);console.log('Real WebRTC ICE/DTLS/SCTP invite/reply, unlock handshake, bidirectional pose, authoritative shooting, remote health/score, knockout/respawn and disconnect passed.');
}finally{a.leave();b.leave();}process.exit(0);
