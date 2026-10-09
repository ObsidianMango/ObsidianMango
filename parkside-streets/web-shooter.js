// A fixed cosmetic pool; web impacts slow targets without spawning rigid bodies.
export function createWebShooter(T,scene){
 const material=new T.LineBasicMaterial({color:0xf6fcff,transparent:true,opacity:.9,depthTest:true}),vertices=[];
 for(let i=0;i<8;i++){const a=i*Math.PI/4,b=(i+1)*Math.PI/4;vertices.push(0,0,0,Math.cos(a),Math.sin(a),0);for(const r of [.32,.62,.9])vertices.push(Math.cos(a)*r,Math.sin(a)*r,0,Math.cos(b)*r,Math.sin(b)*r,0);}
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));const root=new T.Group();root.name='White webs';scene.add(root);const marks=[],up=new T.Vector3(0,0,1);let cursor=0;
 for(let i=0;i<24;i++){const mesh=new T.LineSegments(geometry,material);mesh.visible=false;root.add(mesh);marks.push({mesh,life:0,body:null,offset:new T.Vector3()});}
 const beamGeometry=new T.BufferGeometry();beamGeometry.setAttribute('position',new T.Float32BufferAttribute(new Float32Array(6),3));const beam=new T.LineSegments(beamGeometry,material);beam.frustumCulled=false;beam.visible=false;root.add(beam);let beamLife=0;
 function shoot(from,to,normal,target){const a=beamGeometry.attributes.position;a.setXYZ(0,from.x,from.y,from.z);a.setXYZ(1,to.x,to.y,to.z);a.needsUpdate=true;beam.visible=true;beamLife=.12;if(!normal)return;const mark=marks[cursor++%marks.length];mark.life=6;mark.body=target||null;mark.mesh.position.copy(to).addScaledVector(normal,.035);mark.mesh.quaternion.setFromUnitVectors(up,new T.Vector3().copy(normal).normalize());mark.mesh.scale.setScalar(target?.userData?.person? .6:.65);mark.mesh.visible=true;if(target)mark.offset.copy(mark.mesh.position).sub(target.position);}
 function update(dt){beamLife-=dt;beam.visible=beamLife>0;for(const m of marks)if(m.life>0){m.life-=dt;m.mesh.visible=m.life>0;if(m.body)m.mesh.position.copy(m.body.position).add(m.offset);}}
 function clear(){beamLife=0;beam.visible=false;for(const m of marks){m.life=0;m.body=null;m.mesh.visible=false;}}
 return{shoot,update,clear,getInfo:()=>({active:marks.filter(m=>m.life>0).length,capacity:24,physicsBodies:0})};
}
