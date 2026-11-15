import * as T from '../vendor/three.module.js';

export class AimGuide {
 constructor(worldCanvas) {
  this.worldCanvas=worldCanvas;
  this.canvas=document.createElement('canvas');
  this.canvas.id='aimGuide';
  this.canvas.setAttribute('aria-hidden','true');
  Object.assign(this.canvas.style,{position:'absolute',inset:'0',pointerEvents:'none'});
  this.canvas.classList.add('hidden');
  worldCanvas.after(this.canvas);
  this.context=this.canvas.getContext('2d');
  this.reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
  this.preview=null;
  this.previous=new T.Vector3();
  this.current=new T.Vector3();
  this.clipped=new T.Vector3();
  this.screen=new T.Vector3();
 }

 draw(camera,time) {
  const {canvas,context:ctx,worldCanvas,preview}=this;
  canvas.classList.toggle('hidden',!preview);
  if(!preview||!ctx)return;
  const width=worldCanvas.clientWidth,height=worldCanvas.clientHeight;
  if(!width||!height)return;
  if(canvas.width!==worldCanvas.width||canvas.height!==worldCanvas.height){
   canvas.width=worldCanvas.width;
   canvas.height=worldCanvas.height;
  }
  ctx.setTransform(canvas.width/width,0,0,canvas.height/height,0,0);
  ctx.clearRect(0,0,width,height);
  const {points,target,impact,ground}=preview;
  const near=-camera.near;
  const project=point=>{
   const p=this.screen.copy(point).applyMatrix4(camera.projectionMatrix);
   p.x=(p.x+1)*width/2;
   p.y=(1-p.y)*height/2;
   return p;
  };
  const trace=(method,point)=>{
   const p=project(point);
   ctx[method](p.x,p.y);
  };
  const clip=(a,b)=>this.clipped.copy(a).lerp(b,(near-a.z)/(b.z-a.z));

  ctx.lineCap='round';
  ctx.lineJoin='round';
  ctx.beginPath();
  const a=this.previous,b=this.current;
  a.copy(points[0]).applyMatrix4(camera.matrixWorldInverse);
  if(a.z<=near)trace('moveTo',a);
  for(let i=1;i<points.length;i++){
   b.copy(points[i]).applyMatrix4(camera.matrixWorldInverse);
   if(b.z<=near){
    if(a.z>near)trace('moveTo',clip(a,b));
    trace('lineTo',b);
   }else if(a.z<=near)trace('lineTo',clip(a,b));
   a.copy(b);
  }
  ctx.setLineDash([9,8]);
  this.stroke(7,3,'#6ffaff');
  ctx.setLineDash([]);

  if(!impact&&!ground)return;
  b.copy(target).applyMatrix4(camera.matrixWorldInverse);
  if(b.z>near)return;
  const {x,y,z}=project(b);
  if(z>1||x<-16||x>width+16||y<-16||y>height+16)return;
  ctx.beginPath();
  if(impact){
   ctx.moveTo(x-8,y-8);ctx.lineTo(x+8,y+8);
   ctx.moveTo(x+8,y-8);ctx.lineTo(x-8,y+8);
   ctx.globalAlpha=this.reducedMotion.matches?1:.3+.7*(.5+.5*Math.cos(time*2*Math.PI));
   this.stroke(8,4,'#ff9250');
   ctx.globalAlpha=1;
  }else{
   ctx.arc(x,y,6,0,2*Math.PI);
   this.stroke(5,2,'#6ffaff');
  }
 }

 stroke(outline,width,color) {
  const ctx=this.context;
  ctx.lineWidth=outline;
  ctx.strokeStyle='#17242c';
  ctx.stroke();
  ctx.lineWidth=width;
  ctx.strokeStyle=color;
  ctx.stroke();
 }
}
