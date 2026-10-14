export function revealWheelMeshes(item){
 const wheels=item?.assemblies?.filter(p=>/^wheel-(front|rear)(-(left|right))?$/.test(p.name))||[];
 for(const wheel of wheels){
  if(wheel.userData.attached===false)continue;
  wheel.visible=true;
  wheel.traverse(node=>{if(node.isMesh){node.layers.enable(0);node.visible=true;}});
 }
 return wheels.length;
}
export function wheelRenderInfo(car){
 const wheels=car?.assemblies?.filter(p=>/^wheel-(front|rear)(-(left|right))?$/.test(p.name))||[];
 return wheels.map(p=>{
  let meshes=0,renderable=0;
  p.traverse(o=>{if(o.isMesh){meshes++;if(o.visible&&o.layers.isEnabled(0))renderable++;}});
  return {name:p.name,attached:p.userData.attached!==false,visible:p.visible,meshes,renderable};
 });
}
