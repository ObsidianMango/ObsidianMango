// Reuse detailed geometry and dimensions; gold variants own their paint materials.
export function buildGoldenVehicle(T,base){
 const root=base.root.clone(true),paintNames=new Set(['paint','roofPaint','cream','blue','blueDark','yellow','orange','accent','rust','canvas']);
 const paints=new Set(Object.entries(base.materials).filter(([name])=>paintNames.has(name)).map(([,material])=>material));
 const replacements=new Map(),baseColors=new Set([...paints].map(m=>m.color.getHex())),lightColors=new Set(Object.entries(base.materials).filter(([name])=>['cream','roofPaint','yellow','accent','canvas'].includes(name)).map(([,m])=>m.color.getHex()));
 root.traverse(mesh=>{if(!mesh.isMesh)return;const material=mesh.material;
  // Some curved body sections use clones of the named paint material.
  if(!material.transparent&&!material.map&&(paints.has(material)||baseColors.has(material.color.getHex()))){
   if(!replacements.has(material)){const gold=material.clone();gold.userData.garagePaint=true;gold.color.setHex(lightColors.has(material.color.getHex())?0xffdf86:0xe6b64c);gold.metalness=.78;gold.roughness=.27;replacements.set(material,gold);}mesh.material=replacements.get(material);
  }
 });
 const assemblies=base.assemblies.map(part=>root.children.find(p=>p.name===part.name));
 assemblies.forEach((part,i)=>{part.userData={...base.assemblies[i].userData,home:base.assemblies[i].userData.home.clone(),size:base.assemblies[i].userData.size.clone(),attached:true};part.position.copy(part.userData.home);part.quaternion.identity();part.scale.set(1,1,1);part.visible=true;});
 root.position.set(0,0,0);root.quaternion.identity();root.visible=false;
 return{root,assemblies,materials:{...base.materials},config:{...base.config,id:base.config.id+'-gold',baseId:base.config.id,name:'Golden '+base.config.name,golden:true}};
}
