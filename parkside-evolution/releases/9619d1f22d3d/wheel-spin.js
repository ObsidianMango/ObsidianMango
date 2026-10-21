export function createWheelSpin(C,vehicle,chassis,getSpec,getParts,getInput){
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 const visualWheelAngle=[0,0,0,0],visualWheelOmega=[0,0,0,0],visualWheelSlip=[0,0,0,0];
const wheelPointVelocity=new C.Vec3(),wheelForwardLocal=new C.Vec3(),wheelForwardWorld=new C.Vec3();
function reset(){visualWheelAngle.fill(0);visualWheelOmega.fill(0);visualWheelSlip.fill(0);}
function update(dt){
 const spec=getSpec(),wheelParts=getParts(),input=getInput();
 for(let i=0;i<vehicle.wheelInfos.length;i++){
  const w=vehicle.wheelInfos[i],part=wheelParts[i];
  if(!part?.userData.attached){visualWheelOmega[i]=0;visualWheelSlip[i]=0;continue;}
  const steering=(spec.bike?i===0:i<2)?w.steering:0;
  wheelForwardLocal.set(-Math.sin(steering),0,-Math.cos(steering));
  chassis.vectorToWorldFrame(wheelForwardLocal,wheelForwardWorld);
  chassis.getVelocityAtWorldPoint(w.chassisConnectionPointWorld,wheelPointVelocity);
  const longitudinal=wheelForwardWorld.dot(wheelPointVelocity),radius=Math.max(.05,w.radius),roadOmega=longitudinal/radius;
  const fullBrake=(spec.bike?i===1:i>=2)&&input.handbrake?70:40,brakeRatio=clamp((Math.abs(w.brake)*950/spec.mass-8)/Math.max(1,fullBrake-8),0,1);
  let targetOmega=roadOmega;
  if(w.isInContact){
   if(brakeRatio>0&&Math.abs(longitudinal)>.12){
    const minimumRolling=(spec.bike?i===1:i>=2)&&input.handbrake?.22:.48;
    targetOmega*=1-brakeRatio*(1-minimumRolling);
   }
   const engineRatio=clamp(Math.abs(w.engineForce)/(spec.power||1),0,1);
   if(w.sliding&&engineRatio>.01&&Math.abs(longitudinal)<6){
    const launchSlip=(1-clamp(Math.abs(longitudinal)/6,0,1))*engineRatio;
    targetOmega+=Math.sign(w.engineForce||1)*launchSlip*5;
   }
   visualWheelSlip[i]=Math.abs(roadOmega-targetOmega)/Math.max(.5,Math.abs(roadOmega));
   // Rolling contact is distance / radius, with no throttle-dependent lag.
   visualWheelOmega[i]=targetOmega;
  }else{
   visualWheelSlip[i]=1;
   if(Math.abs(w.engineForce)>0){
    const freeTarget=Math.sign(w.engineForce)*(10+8*clamp(Math.abs(w.engineForce)/(spec.power||1),0,1));
    visualWheelOmega[i]+=(freeTarget-visualWheelOmega[i])*(1-Math.exp(-dt*7));
   }else visualWheelOmega[i]*=Math.exp(-dt*1.8);
  }
  if(Math.abs(longitudinal)<.025&&Math.abs(w.engineForce)<1)visualWheelOmega[i]*=Math.exp(-dt*10);
  visualWheelAngle[i]+=visualWheelOmega[i]*dt;
  if(Math.abs(visualWheelAngle[i])>Math.PI*4096)visualWheelAngle[i]%=Math.PI*2;
 }
}

 return {reset,update,angle:visualWheelAngle,omega:visualWheelOmega,slip:visualWheelSlip};
}
