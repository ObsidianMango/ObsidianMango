// Two fixed instanced batches: adhesive strands and wet beads, no rigid bodies.
export function createWebShooter(T,scene){
 const LIMIT=24,STRANDS=LIMIT*34+10,BEADS=LIMIT*7,lifeTime=6;
 const material=new T.MeshStandardMaterial({color:0xf4faf7,roughness:.18,metalness:.02}),tube=new T.CylinderGeometry(1,1,1,6),sphere=new T.IcosahedronGeometry(1,0);
 const root=new T.Group();root.name='Sticky white webs';scene.add(root);
 const strands=new T.InstancedMesh(tube,material,STRANDS),beads=new T.InstancedMesh(sphere,material,BEADS);
 for(const mesh of [strands,beads]){mesh.count=0;mesh.frustumCulled=false;mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);root.add(mesh);}
 const marks=Array.from({length:LIMIT},()=>({life:0,age:0,body:null,p:new T.Vector3(),q:new T.Quaternion(),local:new T.Vector3(),localQ:new T.Quaternion(),anchor:new T.Vector3(),size:1}));
 const dummy=new T.Object3D(),up=new T.Vector3(0,1,0),forward=new T.Vector3(0,0,1),normal=new T.Vector3(),a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3(),direction=new T.Vector3(),fall=new T.Vector3(),inverse=new T.Quaternion(),bodyQ=new T.Quaternion(),beamFrom=new T.Vector3(),beamTo=new T.Vector3(),dragged=new Set();
 let cursor=0,beamLife=0,stretching=0;
 function strand(from,to,radius){if(strands.count>=STRANDS)return;direction.subVectors(to,from);const length=direction.length();if(length<.001)return;dummy.position.copy(from).add(to).multiplyScalar(.5);dummy.quaternion.setFromUnitVectors(up,direction.multiplyScalar(1/length));dummy.scale.set(radius,length,radius);dummy.updateMatrix();strands.setMatrixAt(strands.count++,dummy.matrix);}
 function bead(point,radius,elongation=1){if(beads.count>=BEADS)return;dummy.position.copy(point);dummy.quaternion.identity();dummy.scale.set(radius,radius*elongation,radius);dummy.updateMatrix();beads.setMatrixAt(beads.count++,dummy.matrix);}
 function point(mark,x,y,z,out){return out.set(x*mark.size,y*mark.size,z*mark.size).applyQuaternion(mark.q).add(mark.p);}
 function attach(mark,target){mark.body=target;bodyQ.copy(target.quaternion);inverse.copy(bodyQ).invert();mark.local.copy(mark.p).sub(target.position).applyQuaternion(inverse);mark.localQ.copy(inverse).multiply(mark.q);}
 function shoot(from,to,hitNormal,target){beamFrom.copy(from);beamTo.copy(to);beamLife=.20;if(hitNormal){const m=marks[cursor++%LIMIT];m.life=lifeTime;m.age=0;m.body=null;m.size=target?.userData?.person ? .6 : .72;normal.copy(hitNormal).normalize();m.p.copy(to).addScaledVector(normal,.045);m.anchor.copy(m.p);m.q.setFromUnitVectors(forward,normal);if(target)attach(m,target);}render();}
 function render(){strands.count=beads.count=stretching=0;
  for(const m of marks){if(m.life<=0)continue;const fade=Math.min(1,m.life),r=.025*fade,spread=1+.12*(1-Math.exp(-m.age*5));
   // Thick irregular spokes, two elastic rings and a wet central blob.
   for(let i=0;i<8;i++){const angle=i*Math.PI/4,angle2=(i+1)*Math.PI/4,reach=(i%2?.88:1)*spread;point(m,0,0,.018,a);point(m,Math.cos(angle)*reach,Math.sin(angle)*reach,.012,b);strand(a,b,r);for(const size of [.37,.72]){point(m,Math.cos(angle)*size*spread,Math.sin(angle)*size*spread,.023,a);point(m,Math.cos(angle2)*size*spread,Math.sin(angle2)*size*spread,.023,b);strand(a,b,r*.72);}}
   point(m,0,0,.045,a);bead(a,.115*m.size*fade,.67);
   // Gravity drips project down the surface; beads elongate before dissolving.
   normal.copy(forward).applyQuaternion(m.q);fall.set(0,-1,0).addScaledVector(normal,normal.y);if(fall.lengthSq()<.01)fall.set(.15,0,.05);fall.normalize();
   for(let i=0;i<3;i++){const angle=(i+1)*Math.PI*.55,length=(.10+Math.min(1.1,m.age*.18))*(.7+i*.2)*m.size;point(m,Math.cos(angle)*.53,Math.sin(angle)*.4,.05,a);bead(a,.065*m.size*fade);b.copy(a).addScaledVector(fall,length);c.copy(a).lerp(b,.55).addScaledVector(normal,.065*m.size);strand(a,c,r);strand(c,b,r*.68);bead(b,(.045+i*.008)*m.size*fade,1.6);}
   // A stuck moving target pulls a short tether from its original contact point.
   const stretch=m.p.distanceTo(m.anchor);if(m.body&&stretch>.08&&stretch<4&&m.age<2.6){stretching++;a.copy(m.anchor);for(let i=1;i<=4;i++){const u=i/4;b.copy(m.anchor).lerp(m.p,u);b.y-=Math.sin(u*Math.PI)*Math.min(.6,stretch*.2);strand(a,b,Math.max(.008,r*(1-stretch/5)));a.copy(b);}}
  }
  if(beamLife>0){a.copy(beamFrom);for(let i=1;i<=8;i++){const u=i/8;b.copy(beamFrom).lerp(beamTo,u);b.y-=Math.sin(u*Math.PI)*(.20-beamLife)*1.6;strand(a,b,.027*Math.min(1,beamLife*10));a.copy(b);}}
  strands.instanceMatrix.needsUpdate=true;beads.instanceMatrix.needsUpdate=true;
 }
 function update(dt){if(!Number.isFinite(dt)||dt<=0)return;beamLife=Math.max(0,beamLife-dt);dragged.clear();for(const m of marks){if(m.life<=0)continue;m.life=Math.max(0,m.life-dt);m.age+=dt;if(!m.life){m.body=null;continue;}if(m.body){const person=m.body.userData?.person;if(person?.bodies?.[0]&&person.bodies[0]!==m.body)attach(m,person.bodies[0]);bodyQ.copy(m.body.quaternion);m.p.copy(m.local).applyQuaternion(bodyQ).add(m.body.position);m.q.copy(bodyQ).multiply(m.localQ);
    // Apply viscosity once per target, regardless of how many splats cover it.
    if(m.age<3&&m.body.mass>0&&!person&&!dragged.has(m.body)){dragged.add(m.body);m.body.velocity.scale(Math.exp(-2.8*dt),m.body.velocity);m.body.angularVelocity.scale(Math.exp(-3.2*dt),m.body.angularVelocity);}
   }}render();}
 function clear(){beamLife=0;for(const m of marks){m.life=0;m.body=null;}strands.count=beads.count=stretching=0;dragged.clear();}
 return{shoot,update,clear,getInfo:()=>({active:marks.filter(m=>m.life>0).length,capacity:LIMIT,physicsBodies:0,batches:2,geometries:2,strands:strands.count,beads:beads.count,stretching,attached:marks.filter(m=>m.life>0&&m.body).length,viscousTargets:dragged.size})};
}
