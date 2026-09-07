import * as THREE from './vendor/three.module.js';
import {geometryFor,toppingMaterial} from './cookie.js';

const dummy=new THREE.Object3D(),local=new THREE.Vector3(),world=new THREE.Vector3(),up=new THREE.Vector3(0,1,0),localUp=new THREE.Vector3(),inverse=new THREE.Matrix4();
// Individual rigid particles: gravity, bounce, drag, plate contact, and cookie contact.
// Toppings touching the cookie settle into the dough. Detached pieces remain loose.
export class CrumbPhysics {
  constructor(scene){this.scene=scene;this.particles=[];this.batches=new Map();this.maxParticles=1600;this.contacts=0;}
  add(p){
    if(this.particles.length>=this.maxParticles){const index=this.particles.findIndex(v=>v.sleeping);if(index>=0)this.particles.splice(index,1);else return false;}
    this.particles.push({age:0,life:90,bounces:0,sleeping:false,canAttach:false,velocity:new THREE.Vector3(),spin:new THREE.Vector3((Math.random()-.5)*7,Math.random()*5,(Math.random()-.5)*7),...p});return true;
  }
  update(dt,cookie){
    let attached=false;if(cookie){cookie.group.updateWorldMatrix(true,false);inverse.copy(cookie.group.matrixWorld).invert();localUp.copy(up).transformDirection(cookie.group.matrixWorld);}
    for(const p of this.particles){
      p.age+=dt;if(p.sleeping||p.removed)continue;
      const prev=p.position.clone();p.velocity.y-=5.6*dt;p.velocity.multiplyScalar(Math.exp(-.28*dt));p.position.addScaledVector(p.velocity,dt);
      dummy.rotation.set(p.spin.x*dt,p.spin.y*dt,p.spin.z*dt);p.quaternion.multiply(dummy.quaternion);
      if(cookie&&p.canAttach&&localUp.y>.96&&p.velocity.y<0){
        local.copy(p.position).applyMatrix4(inverse);const old=prev.clone().applyMatrix4(inverse),height=cookie.surface(local.x,local.z)+(p.raise||p.scale.y*.5);
        if(cookie.supports(local.x,local.z)&&old.y>=height-.06&&local.y<=height){
          this.contacts++;
          if(p.bounces<1&&p.velocity.length()>.9){
            local.y=height+.006;p.position.copy(local).applyMatrix4(cookie.group.matrixWorld);p.velocity.y=Math.abs(p.velocity.y)*.19;p.velocity.x*=.5;p.velocity.z*=.5;p.bounces++;
          }else{
            const record={type:p.type,color:p.color,scale:p.scale,raise:p.raise,position:new THREE.Vector3(local.x,height,local.z),quaternion:p.restQuaternion||new THREE.Quaternion(),attached:true};cookie.addTopping(record);p.removed=true;attached=true;
          }
        }
      }
      const radial=Math.hypot(p.position.x,p.position.z),floor=radial<2.12?.044:-.19,radius=Math.max(.012,Math.min(p.scale.x,p.scale.y,p.scale.z)*.7);
      if(p.position.y<floor+radius&&p.velocity.y<0){
        p.position.y=floor+radius;p.velocity.y=-p.velocity.y*.31;p.velocity.x*=.73;p.velocity.z*=.73;p.spin.multiplyScalar(.63);p.bounces++;
        if(p.velocity.length()<.10||(p.bounces>5&&p.velocity.length()<.30)){p.velocity.set(0,0,0);p.sleeping=true;}
      }
      if(p.age>p.life||radial>8||p.position.y< -5)p.removed=true;
    }
    this.particles=this.particles.filter(p=>!p.removed);if(attached)cookie.syncToppings();this.sync();return attached;
  }
  sync(){
    const groups=new Map();for(const p of this.particles){if(!groups.has(p.type))groups.set(p.type,[]);groups.get(p.type).push(p);}
    for(const [type,particles] of groups){
      let batch=this.batches.get(type);
      if(!batch||particles.length>batch.capacity){
        if(batch){this.scene.remove(batch.mesh);batch.mesh.dispose();batch.mesh.material.dispose();}
        const capacity=Math.max(256,Math.ceil(particles.length/128)*128),mesh=new THREE.InstancedMesh(geometryFor[type]||geometryFor.crumb,type==='crumb'?new THREE.MeshStandardMaterial({roughness:1}):toppingMaterial(type),capacity);mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);mesh.frustumCulled=false;mesh.castShadow=false;mesh.receiveShadow=true;this.scene.add(mesh);batch={mesh,capacity};this.batches.set(type,batch);
      }
      batch.mesh.count=particles.length;particles.forEach((p,i)=>{dummy.position.copy(p.position);dummy.quaternion.copy(p.quaternion);dummy.scale.copy(p.scale);dummy.updateMatrix();batch.mesh.setMatrixAt(i,dummy.matrix);batch.mesh.setColorAt(i,p.color);});batch.mesh.instanceMatrix.needsUpdate=true;if(batch.mesh.instanceColor)batch.mesh.instanceColor.needsUpdate=true;
    }
    for(const [type,batch] of this.batches)if(!groups.has(type))batch.mesh.count=0;
  }
  clear(){this.particles=[];for(const batch of this.batches.values()){this.scene.remove(batch.mesh);batch.mesh.dispose();batch.mesh.material.dispose();}this.batches.clear();}
}
