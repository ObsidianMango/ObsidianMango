// Run with: node --experimental-default-type=module tests/borrowed-wreck.mjs
// Regression test: entering a detailed parked vehicle must not wrap all its panels
// inside one large unbreakable shell, and every panel must retain restore metadata.
import assert from 'node:assert/strict';
import {prepareBorrowedCar} from '../borrowed-vehicle-parts.js';

class Vector3{
 constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z;}
 clone(){return new Vector3(this.x,this.y,this.z);}
 copy(v){this.x=v.x;this.y=v.y;this.z=v.z;return this;}
 set(x,y,z){this.x=x;this.y=y;this.z=z;return this;}
}
class Quaternion{
 constructor(x=0,y=0,z=0,w=1){this.x=x;this.y=y;this.z=z;this.w=w;}
 clone(){return new Quaternion(this.x,this.y,this.z,this.w);}
 identity(){return this;}
}
class Group{
 constructor(name='',size=new Vector3(1,1,1)){
  this.isGroup=true;this.name=name;this.children=[];this.userData={};
  this.size=size;this.position=new Vector3();this.quaternion=new Quaternion();
  this.scale=new Vector3(1,1,1);this.visible=true;
 }
 add(child){this.children.push(child);child.parent=this;}
 clone(){
  const g=new Group(this.name,this.size.clone());
  g.position.copy(this.position);g.scale.copy(this.scale);g.userData={...this.userData};
  for(const c of this.children)g.add(c.clone());return g;
 }
 updateMatrixWorld(){}
}
class Box3{
 setFromObject(part){this.part=part;return this;}
 getSize(target){
  const p=this.part;return target.set(p.size.x*p.scale.x,p.size.y*p.scale.y,p.size.z*p.scale.z);
 }
}
const names=['chassis','tub','engine','bonnet','roof','rear-bumper',
 'left-door','right-door','fender-left','fender-right',
 'wheel-front-right','wheel-front-left','wheel-rear-right','wheel-rear-left'];
const parked=new Group('parked car');
for(let i=0;i<names.length;i++){
 const g=new Group(names[i],new Vector3(1,.5,1));
 g.position.set(i*.09,.6,i*.13-1.2);
 g.scale.set(.78,.78,.78);
 g.add(new Group('painted detail'));
 parked.add(g);
}
const config={id:'roadster',name:'Roadster',front:-1.48,rear:1.45,track:1.04,radius:.525,
 offset:.85,center:.05,halfWidth:1.16,halfLength:2.28,box:[1.16,.26,2.28],power:1550,mass:950};
const originalChildren=[...parked.children];
const result=prepareBorrowedCar({Vector3,Box3},{mesh:parked,model:'roadster'},[{config,materials:{}}],2);
assert.equal(result.parts.length,names.length,'one separate breakaway assembly per authored panel');
assert.equal(result.source.children.length,names.length,'no extra slab wrapper');
assert(result.parts.every(p=>p.parent===result.source),'all parts detach directly from vehicle root');
assert(result.parts.every(p=>p.userData.attached&&p.userData.size.x>0),'each part has physics dimensions');
assert(result.parts.every(p=>p.userData.homeScale.x===.78),'restore keeps original parked scale');
assert.equal(result.config.id,'roadster','multiplayer wreck retains source vehicle model ID');
assert.equal(result.config.golden,false,'borrowed cars can actually be destroyed');
assert.equal(result.config.scoreMultiplier,2);
assert(parked.children.every((p,i)=>p===originalChildren[i]),'original parked car was not modified');
console.log('Borrowed car breakaway assembly and restore-metadata regression passed.');
