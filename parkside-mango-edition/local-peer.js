// Server-free, explicit invite/reply pairing. One peer, one bounded data channel.
export const PROTOCOL='mango-duel-2';
const MAX_SIGNAL=48000,MAX_PACKET=4096;
export function encodeSignal(value){return 'MANGO1.'+btoa(JSON.stringify(value));}
export function decodeSignal(raw){
 let text=String(raw||'').trim();if(text.length>MAX_SIGNAL*2)throw Error('Invite is too long.');
 if(text.includes('#duel='))text=decodeURIComponent(text.split('#duel=')[1]);
 if(!text.startsWith('MANGO1.'))throw Error('Paste a Mango invite or reply.');
 let v;try{v=JSON.parse(atob(text.slice(7)));}catch{throw Error('The invite is incomplete. Copy the entire link or code.');}
 if(v?.v!==PROTOCOL||!['offer','answer'].includes(v.type)||typeof v.id!=='string'||!/^[a-z0-9-]{8,64}$/.test(v.id)||typeof v.sdp!=='string'||v.sdp.length>MAX_SIGNAL||!v.sdp.startsWith('v=0'))throw Error('This invite is incompatible.');return v;
}
export function createLocalPeer({RTC=globalThis.RTCPeerConnection,onStatus=()=>{},onOpen=()=>{},onPacket=()=>{},onClose=()=>{}}={}){
 let pc=null,channel=null,id='',role='',generation=0,connectionTimer=null,closed=true;
 const status=s=>onStatus(s);
 function close(reason='Disconnected'){
  const wasOpen=!closed;closed=true;generation++;clearTimeout(connectionTimer);connectionTimer=null;
  if(channel){channel.onopen=channel.onmessage=channel.onclose=channel.onerror=null;try{channel.close();}catch{}channel=null;}
  if(pc){pc.onconnectionstatechange=pc.ondatachannel=null;try{pc.close();}catch{}pc=null;}
  role='';id='';if(wasOpen){status(reason);onClose(reason);}
 }
 function bind(c,g){if(channel&&channel!==c){c.close();return;}channel=c;c.binaryType='arraybuffer';
  c.onopen=()=>{if(g!==generation)return;clearTimeout(connectionTimer);status('Connected · checking unlocks');onOpen();};
  c.onmessage=e=>{if(g!==generation||typeof e.data!=='string'||e.data.length>MAX_PACKET)return;try{const p=JSON.parse(e.data);if(p&&typeof p==='object'&&!Array.isArray(p))onPacket(p);}catch{}};
  c.onclose=()=>{if(g===generation)close('Other player left');};c.onerror=()=>{if(g===generation)close('Connection lost. Create a fresh invite.');};
 }
 function init(nextRole,nextId){close('New connection');if(!RTC)throw Error('This browser does not support peer connections. Open in Safari.');closed=false;role=nextRole;id=nextId;const g=generation;pc=new RTC({iceServers:[]});const current=pc;
  current.onconnectionstatechange=()=>{if(g!==generation)return;if(['failed','closed'].includes(current.connectionState))close('Could not connect. Use the same Wi-Fi, avoid guest Wi-Fi, and try a fresh invite.');};
  current.ondatachannel=e=>bind(e.channel,g);connectionTimer=setTimeout(()=>{if(g===generation&&channel?.readyState!=='open')close('Connection timed out. Recreate the invite on the same Wi-Fi.');},90000);return {current,g};
 }
 async function gather(current,g){
  if(current.iceGatheringState!=='complete')await new Promise((resolve,reject)=>{let timer;const finish=()=>{clearTimeout(timer);current.removeEventListener('icegatheringstatechange',check);resolve();};const check=()=>{if(current.iceGatheringState==='complete')finish();};current.addEventListener('icegatheringstatechange',check);timer=setTimeout(finish,12000);check();});
  if(g!==generation||closed)throw Error('Pairing cancelled.');const desc=current.localDescription;if(!desc?.sdp?.includes('a=candidate:')){close('No local network route');throw Error('Safari could not find a local network route. Check Local Network permission, use the same Wi-Fi, and open in Safari.');}return encodeSignal({v:PROTOCOL,id,type:desc.type,sdp:desc.sdp});
 }
 async function host(){const nextId=globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);const {current,g}=init('host',nextId);status('Preparing invite…');bind(current.createDataChannel(PROTOCOL,{ordered:true}),g);await current.setLocalDescription(await current.createOffer());const code=await gather(current,g);status('Share invite, then paste their reply');return code;}
 async function join(raw){const offer=decodeSignal(raw);if(offer.type!=='offer')throw Error('Join needs the host’s invite, not a reply.');const {current,g}=init('guest',offer.id);status('Preparing reply…');await current.setRemoteDescription({type:'offer',sdp:offer.sdp});await current.setLocalDescription(await current.createAnswer());const code=await gather(current,g);status('Share this reply with the host');return code;}
 async function accept(raw){const answer=decodeSignal(raw);if(role!=='host'||!pc||answer.type!=='answer'||answer.id!==id)throw Error('This reply belongs to a different invite. Create a fresh invite if needed.');status('Connecting…');await pc.setRemoteDescription({type:'answer',sdp:answer.sdp});}
 function send(p){if(channel?.readyState!=='open'||channel.bufferedAmount>32768)return false;const text=JSON.stringify(p);if(text.length>MAX_PACKET)return false;try{channel.send(text);return true;}catch{return false;}}
 return {host,join,accept,send,close,getInfo:()=>({role,id,open:channel?.readyState==='open',supported:!!RTC,buffered:channel?.bufferedAmount||0})};
}
