import {bootGame} from './helpers/game.mjs';import assert from 'node:assert/strict';
const {app,context}=await bootGame(),t=app.test;t.selectVehicle(12);t.loadLevel(26);app.start();const ox=t.lots.views[26].ox;
const path=[[-65,96.8],[0,76],[20,69.6],[31,64],[40,54],[42,40],[42,8],[42,-3],[34,-12],[20,-15],[-22,-15],[-34,-17],[-41,-26],[-42,-40],[-40,-76]],pts=[];for(let i=1;i<path.length;i++){const a=path[i-1],b=path[i],len=Math.hypot(b[0]-a[0],b[1]-a[1]);for(let d=0;d<len;d+=.5)pts.push([a[0]+(b[0]-a[0])*d/len,a[1]+(b[1]-a[1])*d/len]);}pts.push(path.at(-1));let idx=0;
for(let frame=0;frame<7500;frame++){const p=t.chassis.position,x=p.x-ox,z=p.z,sp=Math.hypot(t.chassis.velocity.x,t.chassis.velocity.z);let best=Infinity;for(let i=idx;i<Math.min(pts.length,idx+40);i++){const d=Math.hypot(pts[i][0]-x,pts[i][1]-z);if(d<best){best=d;idx=i;}}
const aim=pts[Math.min(pts.length-1,idx+14)],f=t.chassis.quaternion.vmult(new context.C.Vec3(0,0,-1)),yaw=Math.atan2(-f.x,-f.z),want=Math.atan2(x-aim[0],z-aim[1]),delta=Math.atan2(Math.sin(want-yaw),Math.cos(want-yaw)),steer=Math.atan(2*3.95*Math.sin(delta)/Math.max(2,Math.hypot(aim[0]-x,aim[1]-z))),axis=Math.max(-1,Math.min(1,steer/(.69/(1+sp*.025))));const distance=Math.hypot(x+40,z+76);const desired=idx>pts.length-24?Math.min(3,distance*.65):4;
t.input.KeyW=sp<desired;t.input.KeyS=sp>desired+.5;t.input.KeyA=axis>.06;t.input.KeyD=axis<-.06;t.step(1/60);

if(app.getState().state!=='running'||distance<.7&&sp<.4){break;}
}
delete t.input.KeyW;delete t.input.KeyS;delete t.input.KeyA;delete t.input.KeyD;t.input.Space=true;for(let i=0;i<240;i++)t.step(1/60);assert.equal(app.getState().state,'ended');assert.equal(app.getState().health,100);assert(app.getState().parking.valid);assert.equal(app.getState().route.cleared,3);console.log('The complete Church Street delivery route is drivable with the articulated semi, clears all gates and parks both bodies without collision damage.');
