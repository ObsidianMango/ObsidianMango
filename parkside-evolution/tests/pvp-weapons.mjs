import assert from 'node:assert/strict';
import {createDuelRules} from '../duel-rules.js';
let time=0,seq=0,shot=0,plane=null;
const blocked=(from,dir,max)=>{if(plane===null||Math.abs(dir[2])<1e-8)return max;const d=(plane-from[2])/dir[2];return d>=0&&d<=max?d:max;};
const r=createDuelRules({now:()=>time,blocked});r.setGuns(0,['pistol','machine','grenade','hammer']);r.setGuns(1,[]);time=4;
const pose=(weapon,target,mode='foot')=>{r.pose(0,{seq:++seq,p:[0,0,0],yaw:0,mode:'foot',active:true,safe:false,weapon});r.pose(1,{seq:++seq,p:[0,0,-target],yaw:0,mode,active:true,safe:false,size:[1.6,1.1,2.6]});};
pose('hammer',2);assert(r.shot(0,{seq:++shot,weapon:'hammer',from:[0,1.47,0],dir:[0,0,-1]}));assert.equal(r.players[1].hp,65);time+=.6;pose('hammer',5);assert(r.shot(0,{seq:++shot,weapon:'hammer',from:[0,1.47,0],dir:[0,0,-1]}));assert.equal(r.players[1].hp,65,'hammer has short reach');
for(const mode of ['foot','vehicle']){
 r.players[1].hp=100;time+=1;const range=mode==='foot'?20:12;plane=mode==='vehicle'?-9.7:null;pose('grenade',range,mode);
 const y=mode==='foot'?0:-.04,dir=[0,y,-Math.sqrt(1-y*y)];assert(r.shot(0,{seq:++shot,weapon:'grenade',from:[0,1.47,0],dir}));
 for(let i=0;i<40&&r.getInfo().shells;i++){time+=.05;pose('grenade',range,mode);r.tick(.05);}
 assert(r.players[1].hp<100,mode+' receives grenade collision damage even with its physical chassis in line of sight');assert.equal(r.getInfo().shells,0);
}
console.log('Owned hammer damages only at melee range; grenade segments hit remote foot/vehicle hitboxes and blast reaches drivers at the vehicle surface.');
