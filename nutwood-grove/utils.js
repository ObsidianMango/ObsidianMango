import * as THREE from './vendor/three.module.js';
export const clamp=THREE.MathUtils.clamp, lerp=THREE.MathUtils.lerp;
export function rng(seed=17){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
export function height(x,z){return .32*Math.sin(x*.17)*Math.cos(z*.14)+.18*Math.sin(z*.29+x*.12)+.11*Math.cos(x*.38-z*.11)}
export function pathX(z){return 2.2+Math.sin(z*.14)*4.2}
export function canvasTexture(draw,size=256){const c=document.createElement('canvas');c.width=c.height=size;draw(c.getContext('2d'),size);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t}
export function material(color,extra={}){return new THREE.MeshStandardMaterial({color,roughness:.93,...extra})}
export function mesh(geo,mat,parent,pos=[0,0,0],scale=[1,1,1]){const m=new THREE.Mesh(geo,mat);m.position.set(...pos);m.scale.set(...scale);m.castShadow=m.receiveShadow=true;parent.add(m);return m}
export class Batch{constructor(geo,mat){this.geo=geo;this.mat=mat;this.items=[];this.dummy=new THREE.Object3D()}
 add(p,s=[1,1,1],r=[0,0,0],color=null){this.dummy.position.set(...p);this.dummy.scale.set(...s);if(r.isQuaternion)this.dummy.quaternion.copy(r);else this.dummy.rotation.set(...r);this.dummy.updateMatrix();this.items.push({matrix:this.dummy.matrix.clone(),color});}
 finish(scene,shadow=true){if(!this.items.length)return;const m=new THREE.InstancedMesh(this.geo,this.mat,this.items.length);this.items.forEach((v,i)=>{m.setMatrixAt(i,v.matrix);if(v.color)m.setColorAt(i,new THREE.Color(v.color));});m.castShadow=shadow;m.receiveShadow=true;m.userData.fullCount=m.count;m.computeBoundingSphere();scene.add(m);return m;}
 finishGrouped(scene,shadow=true,cell=14){const cells=new Map(),group=new THREE.Group();for(const item of this.items){const e=item.matrix.elements,key=Math.floor(e[12]/cell)+','+Math.floor(e[14]/cell);if(!cells.has(key))cells.set(key,[]);cells.get(key).push(item)}for(const items of cells.values()){const b=new Batch(this.geo,this.mat);const random=rng(items.length+71);b.items=items;for(let i=items.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[b.items[i],b.items[j]]=[b.items[j],b.items[i]]}b.finish(group,shadow)}scene.add(group);return group;}}
export function segment(batch,a,b,r1,r2,color){const va=new THREE.Vector3(...a),vb=new THREE.Vector3(...b),d=vb.clone().sub(va),mid=va.add(vb).multiplyScalar(.5),q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.clone().normalize());batch.add(mid.toArray(),[r1,d.length(),r2??r1],q,color)}
export function angleLerp(a,b,t){return a+Math.atan2(Math.sin(b-a),Math.cos(b-a))*t}
