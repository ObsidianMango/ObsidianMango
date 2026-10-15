export function createPanelDamage(T){
 const panelPosition=new T.Vector3(),panelRotation=new T.Quaternion();
 function dent(hit,car,syncCar){
  if(!hit?.point||hit.impact<1.4||hit.kind==='ground')return;
  syncCar();
  const eligible=car.assemblies.filter(p=>p.userData.attached&&/fender|panel|hood|bonnet|door|roof|trunk|boot|bumper|tailgate|grille|light|quarter|body|cabin|side|front|rear/i.test(p.name)&&!/wheel|tire|axle|steering|chassis|tub|rider|engine|glass|window/i.test(p.name));
  eligible.sort((a,b)=>a.getWorldPosition(panelPosition).distanceToSquared(hit.point)-b.getWorldPosition(new T.Vector3()).distanceToSquared(hit.point));
  for(const p of eligible.slice(0,Math.min(3,1+Math.floor(hit.impact/4)))){
   const home=p.userData.home,base=p.userData.homeScale||new T.Vector3(1,1,1);
   if(!home)continue;
   const amount=p.userData.panelDent=Math.min(.68,(p.userData.panelDent||0)+Math.max(.06,hit.impact*.035));
   p.scale.set(base.x*(1-amount*.14),base.y*(1-amount*.42),base.z*(1-amount*.13));
   p.position.copy(home);p.position.y-=amount*.16;
   p.quaternion.copy(p.userData.homeQuaternion||new T.Quaternion());
   panelRotation.setFromEuler(new T.Euler((p.position.x>=0?1:-1)*amount*.12,amount*.035,(p.position.x>=0?1:-1)*amount*.09));
   p.quaternion.multiply(panelRotation);
  }
 }

 return {dent};
}
