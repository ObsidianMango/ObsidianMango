// Room-code signaling over PeerJS Cloud; game data flows through WebRTC.
const PREFIX='parkside-evolution-v1-';
let loader;
async function getPeer(){
 if(globalThis.Peer)return globalThis.Peer;
 if(!loader)loader=(async()=>{for(const url of ['https://cdn.jsdelivr.net/npm/peerjs@1.5.5/dist/peerjs.min.js','https://cdnjs.cloudflare.com/ajax/libs/peerjs/1.5.5/peerjs.min.js']){
  try{await new Promise((ok,fail)=>{const s=document.createElement('script');s.src=url;let settled=false;const done=e=>{if(settled)return;settled=true;clearTimeout(timer);e?fail(e):ok();};const timer=setTimeout(()=>{s.remove();done(Error('CDN timeout'));},12000);s.onload=()=>done();s.onerror=()=>{s.remove();done(Error('CDN failed'));};document.head.append(s);});if(globalThis.Peer)return globalThis.Peer;}catch(e){console.warn('PeerJS CDN',e);}
 }throw Error('Online multiplayer library failed to load. Use local pairing.');})();
 try{return await loader;}catch(e){loader=null;throw e;}
}
export function normalizeRoomCode(raw){
 let s=String(raw||'').trim();
 if(s.includes('#room=')){try{s=decodeURIComponent(s.split('#room=')[1].split('&')[0]);}catch{throw Error('Invite link is incomplete.');}}
 if(!/^(?:MP-)?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}$/i.test(s))throw Error('Invalid room code. Expected MP-XXXX-XXXX-XXXX.');
 return s.replace(/^MP-/i,'').replaceAll('-','').toLowerCase();
}
function formatted(code){return 'MP-'+code.slice(0,4).toUpperCase()+'-'+code.slice(4,8).toUpperCase()+'-'+code.slice(8).toUpperCase();}
function makeCode(){const bytes=new Uint8Array(6);crypto.getRandomValues(bytes);return [...bytes].map(n=>n.toString(16).padStart(2,'0')).join('');}
function problem(e){return e?.type==='peer-unavailable'?'Room not found. Check the code and ask the host to keep their page open.':e?.type==='unavailable-id'?'Room code already taken. Create another.':e?.message||'Online connection failed. Try same Wi-Fi or local pairing.';}
export function createRoomPeer({onStatus=()=>{},onOpen=()=>{},onPacket=()=>{},onClose=()=>{},loadPeer=getPeer}={}){
 let peer=null,channel=null,role='',id='',open=false,closed=true,generation=0,timer=0,pendingReject=null;
 function close(reason='Left online room'){
  const notify=!closed;closed=true;generation++;clearTimeout(timer);timer=0;
  const reject=pendingReject;pendingReject=null;reject?.(Error(reason));
  const c=channel,p=peer;channel=null;peer=null;open=false;role='';id='';
  try{c?.removeAllListeners();c?.close();}catch{}
  try{p?.removeAllListeners();p?.destroy();}catch{}
  if(notify){onStatus(reason);onClose(reason);}
 }
 function attach(c,g,connected=()=>{}){
  if(g!==generation||closed||channel&&channel!==c){try{c.close();}catch{}return;}
  channel=c;const pending=[];
  const opened=()=>{if(g!==generation||closed||open)return;clearTimeout(timer);timer=0;open=true;onStatus('Connected · syncing players');onOpen();for(const message of pending.splice(0))if(g===generation&&!closed)onPacket(message);if(g===generation&&!closed)connected();};
  c.on('open',opened);if(c.open)queueMicrotask(opened);
  c.on('data',m=>{if(g!==generation||closed||!m||typeof m!=='object'||Array.isArray(m))return;try{if(JSON.stringify(m).length<=4096){if(open)onPacket(m);else if(pending.length<4)pending.push(m);}}catch{}});
  c.on('close',()=>{if(g===generation)close('Other player disconnected');});
  c.on('error',e=>{if(g===generation)close(problem(e));});
 }
 async function connect(nextRole,raw){
  if(!globalThis.RTCPeerConnection)throw Error('WebRTC is not supported by this browser.');
  const code=nextRole==='host'?makeCode():normalizeRoomCode(raw);
  close('Changing multiplayer mode');closed=false;role=nextRole;id=code;const g=generation;
  onStatus('Loading online room service…');
  const current=()=>g===generation&&!closed;
  return new Promise((resolve,reject)=>{
   let settled=false;
   const done=(error,value)=>{if(settled)return;settled=true;if(pendingReject===cancel)pendingReject=null;error?reject(error):resolve(value);};
   const cancel=error=>done(error);pendingReject=cancel;
   timer=setTimeout(()=>{if(current())close('Room connection timed out. Try local pairing.');},45000);
   (async()=>{
    const Peer=await loadPeer();if(!current())return;
    onStatus(nextRole==='host'?'Creating room…':'Finding '+formatted(code)+'…');
    const config={host:'0.peerjs.com',port:443,path:'/',secure:true,config:{iceServers:[{urls:'stun:stun.l.google.com:19302'},{urls:'stun:stun1.l.google.com:19302'}]}};
    const p=nextRole==='host'?new Peer(PREFIX+code,config):new Peer(config);peer=p;
    p.on('connection',c=>{if(!current()||role!=='host'||channel){try{c.close();}catch{}return;}attach(c,g);});
    p.on('error',e=>{if(current())close(problem(e));});
    p.on('disconnected',()=>{if(current()&&!open)onStatus('Room service disconnected. Cancel and try again.');});
    p.once('open',()=>{
     if(!current())return;
     if(nextRole==='host'){clearTimeout(timer);timer=0;onStatus('Room '+formatted(code)+' is ready · waiting for a friend');done(null,formatted(code));}
     else{onStatus('Connecting to host…');attach(p.connect(PREFIX+code,{reliable:true,serialization:'json'}),g,()=>done(null));}
    });
   })().catch(e=>{if(current())close(problem(e));});
  });
 }
 function send(msg){if(!open||!channel?.open||channel.dataChannel?.bufferedAmount>32768)return false;try{if(JSON.stringify(msg).length>4096)return false;channel.send(msg);return true;}catch{return false;}}
 return {host:()=>connect('host'),join:raw=>connect('guest',raw),send,close,getInfo:()=>({role,id,open,supported:!!globalThis.RTCPeerConnection,buffered:channel?.dataChannel?.bufferedAmount||0})};
}
