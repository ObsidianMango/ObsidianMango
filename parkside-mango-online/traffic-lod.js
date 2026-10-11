// Distant traffic uses three shared batches. Nearby cars retain their full
// detailed bodies, damage, char, break-off parts and vehicle-entry behavior.
export function createTrafficLOD(T,view){
 const cars=view.targets.filter(t=>t.kind==='car').map(t=>t.car),box=new T.BoxGeometry(1,1,1),tire=new T.CylinderGeometry(.5,.5,1,8),material=new T.MeshStandardMaterial({color:0xffffff,roughness:.85});
 const body=new T.InstancedMesh(box,material,cars.length),cabin=new T.InstancedMesh(box,material,cars.length),wheels=new T.InstancedMesh(tire,material,cars.length*4),object=new T.Object3D(),position=new T.Vector3(),turn=new T.Quaternion(),wheelTurn=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,0,1),Math.PI/2),tint=new T.Color(),zero=new T.Matrix4().makeScale(0,0,0);
 for(const mesh of [body,cabin,wheels]){mesh.name='Distant street cars';mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);mesh.frustumCulled=false;mesh.castShadow=false;view.group.add(mesh);}let distant=0;
 function place(mesh,index,item,offset,size){position.set(...offset).applyQuaternion(turn).add(object.position.copy(item.body.position));object.position.copy(position);object.quaternion.copy(turn);object.scale.set(...size);object.updateMatrix();mesh.setMatrixAt(index,object.matrix);}
 function update(x,z){distant=0;cars.forEach((item,i)=>{const near=Math.hypot(item.body.position.x-view.ox-x,item.body.position.z-z)<75;item.mesh.visible=near&&!item.occupied;
   if(near||item.occupied){body.setMatrixAt(i,zero);cabin.setMatrixAt(i,zero);for(let n=0;n<4;n++)wheels.setMatrixAt(i*4+n,zero);return;}distant++;const size=item.collisionSize||{x:1.04,y:.75,z:2.18};turn.copy(item.body.quaternion);const shrink=item.exploded?.35:1-(item.damage||0)*.28;
   place(body,i,item,[0,-.1,0],[size.x*1.9,.65*shrink,size.z*1.9]);place(cabin,i,item,[0,.5*shrink,0],[size.x*1.5,.65*shrink,size.z]);const paint=item.materials?.find(m=>m.material.userData.garagePaint||m.material.name==='paint');(paint?tint.copy(paint.color):tint.setHex(0x8d9b99)).multiplyScalar(item.exploded?.22:1-(item.damage||0)*.4);body.setColorAt(i,tint);cabin.setColorAt(i,tint.setHex(item.exploded?0x292d2c:0x405b68));
   for(let n=0;n<4;n++){turn.copy(item.body.quaternion);position.set(n%2?size.x:-size.x,-.4,n<2?-size.z*.62:size.z*.62).applyQuaternion(turn).add(item.body.position);object.position.copy(position);object.quaternion.copy(turn).multiply(wheelTurn);object.scale.set(.7,.22,.7);object.updateMatrix();wheels.setMatrixAt(i*4+n,object.matrix);wheels.setColorAt(i*4+n,tint.setHex(0x272d2f));}
  });for(const mesh of [body,cabin,wheels]){mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;}}
 function originals(){distant=0;for(const item of cars)item.mesh.visible=!item.occupied;for(const mesh of [body,cabin,wheels]){mesh.count=0;}}
 const updateLOD=update;function refresh(x,z){body.count=cabin.count=cars.length;wheels.count=cars.length*4;updateLOD(x,z);}
 refresh(0,0);return {update:refresh,originals,getInfo:()=>({batches:3,capacity:cars.length,distant})};
}
