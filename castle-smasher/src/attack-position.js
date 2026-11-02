// Position the actual launcher around the fortress, independently of the camera.
export function attackPosition(degrees,distance,height=0){
 const a=((degrees%360)+360)%360*Math.PI/180;
 return {x:Math.sin(a)*distance,y:height,z:Math.cos(a)*distance};
}
export function castleBearing(position){return Math.atan2(-position.x,position.z)*180/Math.PI;}
