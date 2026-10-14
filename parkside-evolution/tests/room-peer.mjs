import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {createRoomPeer,normalizeRoomCode} from '../room-peer.js';
globalThis.RTCPeerConnection=class{};
const peers=new Map();let serial=0;
class Channel extends EventEmitter{
 open=false;dataChannel={bufferedAmount:0};
 send(message){this.other.emit('data',structuredClone(message));}
 close(){if(this.closed)return;this.closed=true;this.open=false;this.emit('close');this.other?.close();}
}
export class Peer extends EventEmitter{
 constructor(id){super();this.id=typeof id==='string'?id:'guest-'+(++serial);peers.set(this.id,this);queueMicrotask(()=>this.emit('open',this.id));}
 connect(id){const a=new Channel(),b=new Channel();a.other=b;b.other=a;this.connection=a;const host=peers.get(id);if(!host){queueMicrotask(()=>this.emit('error',{type:'peer-unavailable'}));return a;}
 host.emit('connection',b);queueMicrotask(()=>{a.open=true;a.emit('open');queueMicrotask(()=>{b.open=true;b.emit('open');});});return a;
 }
 destroy(){this.connection?.close();peers.delete(this.id);}
}
const wait=()=>new Promise(r=>setTimeout(r,0));
for(const value of ['MP-ABCD-1234-EF90','abcd1234ef90','https://example.test/#room=MP-ABCD-1234-EF90'])assert.equal(normalizeRoomCode(value),'abcd1234ef90');
for(const value of ['garbageabcd1234ef90','MP-ABCD-1234-EF90-junk','https://bad.test/#room=%xx'])assert.throws(()=>normalizeRoomCode(value));
const receivedA=[],receivedB=[];let openedA=0,openedB=0;
const a=createRoomPeer({loadPeer:async()=>Peer,onOpen:()=>{openedA++;a.send({t:'hello'});},onPacket:m=>receivedA.push(m)});
const b=createRoomPeer({loadPeer:async()=>Peer,onOpen:()=>{openedB++;b.send({t:'hello'});},onPacket:m=>receivedB.push(m)});
const code=await a.host();await b.join(code);await wait();assert(a.getInfo().open&&b.getInfo().open);assert.equal(openedA,1);assert.equal(openedB,1);assert.equal(receivedA[0].t,'hello','hello before host open is retained');assert.equal(receivedB[0].t,'hello');assert(!a.send({huge:'x'.repeat(5000)}));a.close();await wait();assert(!b.getInfo().open);
await assert.rejects(b.join('MP-0000-0000-0000'),/Room not found/);assert.equal(b.getInfo().role,'');
let resolveLoader;const delayed=createRoomPeer({loadPeer:()=>new Promise(r=>resolveLoader=r)});const pending=delayed.host();delayed.close('Cancelled');await assert.rejects(pending,/Cancelled/);const count=peers.size;resolveLoader(Peer);await wait();assert.equal(peers.size,count,'cancelled loader cannot resurrect a room');
const code2=await a.host();await b.join(code2);await wait();assert(a.getInfo().open);a.close();b.close();delete globalThis.RTCPeerConnection;
console.log('Online room-code host/join, early hello delivery, cancellation during library load, missing rooms, retries, packet limit and leave passed.');
