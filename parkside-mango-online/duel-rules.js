// Host-authoritative combat. No real-world money, save edits, or client-supplied damage.
export const GUNS={pistol:{damage:25,range:72,rate:.3},machine:{damage:9,range:90,rate:.09},grenade:{damage:65,range:60,rate:.85}};
export const COMBAT={...GUNS,web:{damage:0,range:45,rate:.32}};
export const eligible=p=>!!p&&Array.isArray(p.guns);
export const validLevel=n=>Number.isInteger(n)&&n>=0&&n<=24;
export const vec=v=>Array.isArray(v)&&v.length===3&&v.every(n=>Number.isFinite(n)&&Math.abs(n)<600);
export function cleanPose(p){if(!p||!Number.isSafeInteger(p.seq)||p.seq<0||!vec(p.p)||p.p[1]<-5||p.p[1]>100||Math.abs(p.p[0])>260||Math.abs(p.p[2])>260||!Number.isFinite(p.yaw)||!['foot','vehicle'].includes(p.mode))return null;return {seq:p.seq,p:[...p.p],yaw:p.yaw%(Math.PI*2),mode:p.mode,active:p.active===true,safe:p.safe===true,weapon:Object.hasOwn(COMBAT,p.weapon)?p.weapon:null,size:vec(p.size)&&p.size[0]>=.8&&p.size[0]<=2.6&&p.size[1]>=.8&&p.size[1]<=3&&p.size[2]>=1.2&&p.size[2]<=4?[...p.size]:[1.6,1.2,2.6]};}
export function raySphere(from,dir,center,radius,max){const o=from.map((v,i)=>v-center[i]),b=o.reduce((v,n,i)=>v+n*dir[i],0),c=o.reduce((v,n)=>v+n*n,0)-radius*radius,h=b*b-c;if(h<0)return null;const t=-b-Math.sqrt(h),exit=-b+Math.sqrt(h);return exit<0||t>max?null:Math.max(0,t);}
export function rayVehicle(from,dir,pose,max){const c=Math.cos(pose.yaw),s=Math.sin(pose.yaw),dx=from[0]-pose.p[0],dz=from[2]-pose.p[2],origin=[c*dx-s*dz,from[1]-pose.p[1]-pose.size[1],s*dx+c*dz],direction=[c*dir[0]-s*dir[2],dir[1],s*dir[0]+c*dir[2]];let near=0,far=max;for(let i=0;i<3;i++){if(Math.abs(direction[i])<1e-8){if(Math.abs(origin[i])>pose.size[i])return null;}else{let a=(-pose.size[i]-origin[i])/direction[i],b=(pose.size[i]-origin[i])/direction[i];if(a>b)[a,b]=[b,a];near=Math.max(near,a);far=Math.min(far,b);if(near>far)return null;}}return near;}
const distance=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
export function createDuelRules({now=()=>performance.now()/1000,blocked=()=>Infinity,onEffect=()=>{}}={}){
 const players=[0,1].map(()=>({hp:100,score:0,deaths:0,life:0,shield:now()+3,respawn:0,slowUntil:0,pose:null,seen:0,guns:[],shotSeq:-1,lastShot:-Infinity}));let shells=[];
 function setGuns(i,guns){players[i].guns=[...guns.filter(w=>Object.hasOwn(GUNS,w)).slice(0,3),'web'];}
 function pose(i,p){const v=cleanPose(p),a=players[i];if(!v||v.seq<=(a.pose?.seq??-1))return false;a.pose=v;a.seen=now();return true;}
 const vulnerable=a=>a.hp>0&&a.pose?.active&&!a.pose.safe&&now()-a.seen<1.5&&a.shield<=now();
 function hurt(target,source,damage){const a=players[target];if(!vulnerable(a))return false;a.hp=Math.max(0,a.hp-damage);if(!a.hp){a.slowUntil=0;a.deaths++;a.respawn=now()+5;if(source!==target)players[source].score++;}return true;}
 function shot(i,s){const a=players[i],w=COMBAT[s?.weapon],t=now();if(!w||!Number.isSafeInteger(s.seq)||s.seq<=a.shotSeq||!vec(s.from)||!vec(s.dir)||!a.guns.includes(s.weapon)||!a.pose?.active||a.pose.safe||a.hp<=0||now()-a.seen>=1.5||a.pose.mode!=='foot'||a.pose.weapon!==s.weapon||t-a.lastShot<w.rate*.85)return false;
  const len=Math.hypot(...s.dir),expected=[a.pose.p[0],a.pose.p[1]+1.47,a.pose.p[2]];if(len<.98||len>1.02||distance(s.from,expected)>2.8)return false;a.shotSeq=s.seq;a.lastShot=t;const dir=s.dir.map(n=>n/len);
  if(s.weapon==='grenade'){if(shells.length>=8)return false;shells.push({source:i,p:[...s.from],v:dir.map((n,j)=>n*26+(j===1?3:0)),life:1.7});return true;}
  const b=players[1-i],center=b.pose?[b.pose.p[0],b.pose.p[1]+(b.pose.mode==='foot'?.95:.6),b.pose.p[2]]:null,max=Math.min(w.range,blocked(s.from,dir,w.range));let hit=null;
  if(center&&vulnerable(b)){hit=b.pose.mode==='foot'?raySphere(s.from,dir,center,.55,max):rayVehicle(s.from,dir,b.pose,max);if(b.pose.mode==='foot'){const head=raySphere(s.from,dir,[center[0],b.pose.p[1]+1.5,center[2]],.24,max);if(head!==null&&(hit===null||head<hit))hit=head;}}
  if(hit!==null){if(s.weapon==='web')b.slowUntil=t+3;else hurt(1-i,i,w.damage);}onEffect({kind:s.weapon==='web'?'web':'shot',target:1-i,from:[...s.from],to:s.from.map((v,j)=>v+dir[j]*(hit??max)),hit:hit!==null});return true;
 }
 function tick(dt){dt=Math.min(.1,Math.max(0,dt));for(const a of players)if(a.hp===0&&a.respawn<=now()){a.hp=100;a.life++;a.shield=now()+3;a.respawn=0;a.slowUntil=0;a.pose=null;a.lastShot=-Infinity;}
  for(let n=shells.length-1;n>=0;n--){const s=shells[n];s.life-=dt;s.v[1]-=9.82*dt;const length=Math.hypot(...s.v)*dt,dir=s.v.map(v=>v/(Math.hypot(...s.v)||1)),wall=blocked(s.p,dir,length),travel=Math.min(length,Math.max(0,wall));s.p=s.p.map((v,i)=>v+dir[i]*travel);if(s.life<=0||wall<length){onEffect({kind:'blast',p:s.p});for(let i=0;i<2;i++){const a=players[i];if(!a.pose)continue;const d=distance(s.p,[a.pose.p[0],a.pose.p[1]+.8,a.pose.p[2]]);if(d<7&&blocked(s.p,a.pose.p.map((v,j)=>(v+(j===1?.8:0)-s.p[j])/(d||1)),d)>=d-.4)hurt(i,s.source,Math.round(65*(1-d/9)));}shells.splice(n,1);}}
 }
 function snapshot(){return players.map(a=>({hp:a.hp,score:a.score,deaths:a.deaths,life:a.life,respawn:Math.max(0,a.respawn-now()),shield:Math.max(0,a.shield-now()),slow:Math.max(0,a.slowUntil-now())}));}
 return {players,setGuns,pose,shot,tick,snapshot,getInfo:()=>({shells:shells.length,players:snapshot()})};
}
