// Bake horizontal enlargement into assemblies so wheel sync, debris and replay
// all use the same dimensions; tires retain circular rolling profiles.
export function sizeChallengeVehicle(T,asset,config){
 const multipliers={roadster:1,santafe:1,jalopy:2.2,wiener:1.6,maybach:1,nova:1.3,newyorker:1.4,e250:1.8,montecarlo:1.2,suburban:1.8,impala:1.4,colorado:1.5};
 const spec={...config,scoreMultiplier:multipliers[config.id]||1};
 if(config.id!=='wiener'&&config.id!=='newyorker')return{...asset,config:spec};
 asset.root.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(asset.root),size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3()),sx=3.2/size.x,sz=6.18/size.z;
 for(const part of asset.assemblies){const wheel=part.name.startsWith('wheel-'),steering=part.name==='steering-wheel';for(const mesh of part.children){if(!mesh.isMesh)continue;mesh.geometry.scale(steering?1:sx,1,wheel||steering?1:sz);mesh.geometry.computeBoundingBox();mesh.geometry.computeBoundingSphere();}part.position.x=(part.position.x-center.x)*sx;part.position.z=(part.position.z-center.z)*sz;part.userData.home.copy(part.position);part.userData.size.x*=steering?1:sx;if(!wheel&&!steering)part.userData.size.z*=sz;}
 const steering=asset.assemblies.find(p=>p.name==='steering-wheel');if(steering)asset.root.userData.steeringX=steering.position.x;
 asset.root.updateMatrixWorld(true);const finalBounds=new T.Box3().setFromObject(asset.root);
 spec.track*=sx;spec.front=(spec.front-center.z)*sz;spec.rear=(spec.rear-center.z)*sz;spec.halfWidth=Math.max(Math.abs(finalBounds.min.x),Math.abs(finalBounds.max.x));spec.halfLength=Math.max(Math.abs(finalBounds.min.z),Math.abs(finalBounds.max.z));spec.box=[spec.halfWidth,config.box[1],spec.halfLength];
 return{...asset,config:spec};
}
