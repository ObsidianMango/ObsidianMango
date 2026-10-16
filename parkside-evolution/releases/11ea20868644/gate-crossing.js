// Sweep one physics step through the gate slab, including reverse approaches.
export function passesGate(fromX,fromZ,x,z,gate,width,halfWidth,yaw,forwardSpeed){
 const c=Math.cos(gate.yaw),s=Math.sin(gate.yaw),dx=x-gate.x,dz=z-gate.z;
 const across=c*dx-s*dz,along=s*dx+c*dz;
 const angle=Math.atan2(Math.sin(yaw-gate.yaw),Math.cos(yaw-gate.yaw));
 if(Math.abs(angle)>=Math.PI/4||(gate.reverse?forwardSpeed>=-.4:forwardSpeed<=.4))return false;
 const fits=a=>Math.abs(a)+halfWidth<width/2;
 if(Math.abs(along)<1.8&&fits(across))return true;
 const px=fromX-gate.x,pz=fromZ-gate.z,previousAlong=s*px+c*pz;
 if(previousAlong*along>0||Math.abs(previousAlong-along)<1e-8)return false;
 const u=previousAlong/(previousAlong-along),previousAcross=c*px-s*pz;
 return u>=0&&u<=1&&fits(previousAcross+(across-previousAcross)*u);
}
