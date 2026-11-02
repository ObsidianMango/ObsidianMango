import * as T from '../vendor/three.module.js';
import {BUILD_PARTS,MATERIALS,clamp} from './data.js?v=sibling-walk-7';
import {box} from './render.js?v=sibling-walk-7';
import {partBlocks,starterCastle,BUILD_LIMIT,BLOCK_LIMIT,sanitizeBlueprint,dimensions} from './blueprints.js?v=sibling-walk-7';
export class Builder{
 constructor(view,save,notify){
  Object.assign(this,{view,save,notify,parts:[],selected:-1,type:'Wall',rotation:0,storey:0,material:'stone',tool:'place',active:false,history:[],future:[]});
  this.cursor=new T.Vector3();this.group=new T.Group();view.scene.add(this.group);this.ghost=new T.Group();view.scene.add(this.ghost);this.ray=new T.Raycaster();this.plane=new T.Plane(new T.Vector3(0,1,0),0);
  this.grid=new T.GridHelper(48,80,0xd9b667,0x6c866e);this.grid.position.y=.025;this.grid.visible=false;view.scene.add(this.grid);
  const canvas=view.renderer.domElement;canvas.addEventListener('pointerdown',e=>this.pointerDown(e));canvas.addEventListener('pointermove',e=>this.pointerMove(e));canvas.addEventListener('pointerup',e=>this.pointerUp(e));canvas.addEventListener('pointercancel',()=>{this.down=null;this.view.controls.enabled=!view.firstPerson;});
 }
 snapshot(){this.history.push(JSON.stringify(this.parts));if(this.history.length>50)this.history.shift();this.future=[];}
 undo(){if(!this.history.length)return;this.future.push(JSON.stringify(this.parts));this.parts=JSON.parse(this.history.pop());this.selected=-1;this.refresh();}
 redo(){if(!this.future.length)return;this.history.push(JSON.stringify(this.parts));this.parts=JSON.parse(this.future.pop());this.selected=-1;this.refresh();}
 point(e){const r=this.view.renderer.domElement.getBoundingClientRect();this.ray.setFromCamera({x:(e.clientX-r.left)/r.width*2-1,y:1-(e.clientY-r.top)/r.height*2},this.view.camera);this.plane.constant=-this.storey*2.4;return this.ray.ray.intersectPlane(this.plane,new T.Vector3());}
 snap(p){p.x=clamp(Math.round(p.x/.6)*.6,-24,24);p.z=clamp(Math.round(p.z/.6)*.6,-24,24);return p;}
 pointerDown(e){if(!this.active||this.blocked?.())return;this.down={x:e.clientX,y:e.clientY};this.dragging=false;if(this.tool==='select'){const hit=this.rayPick(e);this.selected=hit;if(hit>=0){this.dragging=true;this.snapshot();this.view.controls.enabled=false;}this.refresh();}}
 pointerMove(e){if(!this.active||this.blocked?.())return;const p=this.point(e);if(!p)return;this.cursor.copy(this.snap(p));if(this.dragging&&this.selected>=0){const b=this.parts[this.selected];b.x=this.cursor.x;b.z=this.cursor.z;this.refresh();}else this.preview();}
 pointerUp(e){if(!this.active||!this.down)return;const moved=Math.hypot(e.clientX-this.down.x,e.clientY-this.down.y);if(this.tool==='place'&&moved<7&&!this.blocked?.()){const p=this.point(e);if(p){this.cursor.copy(this.snap(p));this.add();}}this.dragging=false;this.view.controls.enabled=true;this.down=null;}
 rayPick(e){this.point(e);const hits=this.ray.intersectObjects(this.group.children);return hits.length?hits[0].object.userData.partIds[hits[0].instanceId]??-1:-1;}
 start(parts=null){this.active=true;this.group.visible=this.grid.visible=true;this.parts=sanitizeBlueprint(parts||starterCastle());this.history=[];this.future=[];this.selected=-1;this.tool='place';this.refresh();}
 stop(){this.active=false;this.group.visible=this.grid.visible=this.ghost.visible=false;this.view.controls.enabled=true;this.dragging=false;this.down=null;}
 setTool(tool){this.tool=tool;this.selected=-1;this.refresh();}
 setType(type){this.type=type;this.selected=-1;this.tool='place';this.preview();this.changed?.();}
 canAdd(p){if(this.parts.length>=BUILD_LIMIT||this.parts.reduce((n,p)=>n+partBlocks(p).length,0)+partBlocks(p).length>BLOCK_LIMIT){this.notify('Build budget reached — remove a few pieces first');return false;}return true;}
 add(){if(this.parts.length>=BUILD_LIMIT){this.notify(`${BUILD_LIMIT}-piece build limit reached`);return;}this.snapshot();const h=BUILD_PARTS[this.type][1];const p={type:this.type,x:this.cursor.x,y:this.storey*2.4+h/2,z:this.cursor.z,rot:this.rotation,material:['Barrel','Glass','Treasure'].includes(this.type)?BUILD_PARTS[this.type][3]:this.material};if(!this.canAdd(p))return;this.parts.push(p);this.selected=this.parts.length-1;this.refresh();}
 rotate(){this.snapshot();if(this.selected>=0){const p=this.parts[this.selected];p.rot=(p.rot+Math.PI/2)%(Math.PI*2);this.rotation=p.rot;}else this.rotation=(this.rotation+Math.PI/2)%(Math.PI*2);this.refresh();}
 duplicate(){if(this.selected<0||this.parts.length>=BUILD_LIMIT)return;const p={...this.parts[this.selected]};if(!this.canAdd(p))return;this.snapshot();p.x=clamp(p.x+dimensions(p)[0]+.6,-24,24);this.parts.push(p);this.selected=this.parts.length-1;this.refresh();}
 delete(){if(this.selected<0)return;this.snapshot();this.parts.splice(this.selected,1);this.selected=-1;this.refresh();}
 moveSelected(key,value){const p=this.parts[this.selected];if(!p)return;this.snapshot();const h=BUILD_PARTS[p.type][1];if(key==='base')p.y=clamp(+value,0,30)+h/2;else p[key]=clamp(+value,-24,24);this.refresh();}
 template(kind){this.snapshot();this.parts=starterCastle(kind);this.selected=-1;this.refresh();}
 disposeGroup(group){for(const m of group.children){m.material?.dispose();m.dispose?.();}group.clear();}
 draw(group,blocks,opacity=1){for(const mat of Object.keys(MATERIALS)){const items=blocks.filter(b=>b.mat===mat);if(!items.length)continue;const material=new T.MeshStandardMaterial({color:MATERIALS[mat].color,roughness:.8,transparent:opacity<1,opacity}),inst=new T.InstancedMesh(box,material,items.length),dummy=new T.Object3D();inst.userData.partIds=[];for(let i=0;i<items.length;i++){const b=items[i];dummy.position.set(b.x,b.y,b.z);dummy.rotation.set(0,b.rot||0,0);dummy.scale.set(b.w,b.h,b.d);dummy.updateMatrix();inst.setMatrixAt(i,dummy.matrix);inst.setColorAt(i,new T.Color(b.part===this.selected?0xffd27d:0xffffff));inst.userData.partIds.push(b.part);}inst.castShadow=inst.receiveShadow=true;inst.instanceMatrix.needsUpdate=true;group.add(inst);}}
 refresh(){this.disposeGroup(this.group);const blocks=this.parts.flatMap((p,i)=>partBlocks(p,i+1).map(b=>({...b,part:i})));this.draw(this.group,blocks);this.preview();this.changed?.();}
 preview(){this.disposeGroup(this.ghost);this.ghost.visible=this.active&&this.tool==='place';if(!this.ghost.visible)return;const p={type:this.type,x:this.cursor.x,y:this.storey*2.4+BUILD_PARTS[this.type][1]/2,z:this.cursor.z,rot:this.rotation,material:['Barrel','Glass','Treasure'].includes(this.type)?BUILD_PARTS[this.type][3]:this.material};this.draw(this.ghost,partBlocks(p).map(b=>({...b,part:-1})),.25);this.grid.position.y=this.storey*2.4+.025;}
 saveBuild(name='My Castle'){const data={name,parts:structuredClone(this.parts),date:new Date().toISOString()};const i=this.save.data.builds.findIndex(b=>b.name===name);if(i>=0)this.save.data.builds[i]=data;else this.save.data.builds.push(data);if(this.save.write())this.notify('Castle saved','BLUEPRINTS');else this.notify('Storage full — clear an older build');}
}
