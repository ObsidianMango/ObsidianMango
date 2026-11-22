import { THREE, v3, clamp } from './field.js';

const view=new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(.14,.49,-.045));
const lamp=v3(-.55,.67,.67).normalize();
const reflection=v3(-.29,.36,.95).normalize();
const toByte=value=>255*clamp(value<.00313?value*12.92:1.055*value**(1/2.4)-.055,0,1);

function projectMesh(item,rootScale,bounds){
  const matrix=view.clone().multiply(new THREE.Matrix4().makeScale(rootScale.x,rootScale.y,rootScale.z)).multiply(item.matrix);
  const normalMatrix=new THREE.Matrix3().getNormalMatrix(matrix);
  const { position,normal,color }=item.geometry.attributes;
  const projected=new Float32Array(position.count*6);
  const lightColor=item.material.color;
  const roughness=item.material.roughness??.55;
  const point=v3(), facing=v3();
  for(let i=0;i<position.count;i++){
    point.fromBufferAttribute(position,i).applyMatrix4(matrix);
    facing.fromBufferAttribute(normal,i).applyNormalMatrix(normalMatrix);
    if(item.material.side===THREE.DoubleSide&&facing.z<0)facing.negate();
    bounds.left=Math.min(bounds.left,point.x);bounds.right=Math.max(bounds.right,point.x);
    bounds.bottom=Math.min(bounds.bottom,point.y);bounds.top=Math.max(bounds.top,point.y);
    const sunlight=Math.max(0,facing.dot(lamp));
    const diffuse=.31+sunlight*.78+Math.max(0,facing.y)*.15;
    const sheen=Math.max(0,facing.dot(reflection))**(15+36*(1-roughness))*(1-roughness)*.30;
    const vertex=i*6;
    projected[vertex]=point.x;
    projected[vertex+1]=point.y;
    projected[vertex+2]=point.z;
    projected[vertex+3]=toByte((color?color.getX(i):lightColor.r)*diffuse+sheen);
    projected[vertex+4]=toByte((color?color.getY(i):lightColor.g)*diffuse*.96+sheen*.91);
    projected[vertex+5]=toByte((color?color.getZ(i):lightColor.b)*diffuse*.86+sheen*.73);
  }
  return {projected,indices:item.geometry.index?.array};
}

function rasterize({projected,indices},image,depth){
  const {width,height,data}=image;
  const count=indices?indices.length:projected.length/6;
  for(let i=0;i<count;i+=3){
    const a=(indices?indices[i]:i)*6;
    const b=(indices?indices[i+1]:i+1)*6;
    const c=(indices?indices[i+2]:i+2)*6;
    const ax=projected[a],ay=projected[a+1],bx=projected[b],by=projected[b+1],cx=projected[c],cy=projected[c+1];
    const denominator=(by-cy)*(ax-cx)+(cx-bx)*(ay-cy);
    if(Math.abs(denominator)<.00006)continue;
    const inv=1/denominator;
    const startX=Math.max(0,Math.floor(Math.min(ax,bx,cx)));
    const endX=Math.min(width-1,Math.ceil(Math.max(ax,bx,cx)));
    const startY=Math.max(0,Math.floor(Math.min(ay,by,cy)));
    const endY=Math.min(height-1,Math.ceil(Math.max(ay,by,cy)));
    for(let y=startY;y<=endY;y++){
      const dy=y+.5-cy;
      for(let x=startX;x<=endX;x++){
        const dx=x+.5-cx;
        const wa=((by-cy)*dx+(cx-bx)*dy)*inv;
        const wb=((cy-ay)*dx+(ax-cx)*dy)*inv;
        const wc=1-wa-wb;
        if(wa<0||wb<0||wc<0)continue;
        const z=wa*projected[a+2]+wb*projected[b+2]+wc*projected[c+2];
        const pixel=y*width+x;
        if(z<=depth[pixel])continue;
        depth[pixel]=z;
        const offset=pixel*4;
        for(let channel=0;channel<3;channel++){
          const tint=channel+3;
          data[offset+channel]=wa*projected[a+tint]+wb*projected[b+tint]+wc*projected[c+tint];
        }
        data[offset+3]=255;
      }
    }
  }
}

// Rasterize the same meshes used by WebGL once per selection for the Canvas fallback.
export function produceSprite(fruit){
  const bounds={left:Infinity,right:-Infinity,bottom:Infinity,top:-Infinity};
  const meshes=fruit.root.children.filter(item=>item.visible).map(item=>{
    item.updateMatrix();
    return projectMesh(item,fruit.root.scale,bounds);
  });
  const worldWidth=bounds.right-bounds.left,worldHeight=bounds.top-bounds.bottom;
  const density=Math.min(155,252/Math.max(worldWidth,worldHeight));
  const canvas=document.createElement('canvas');
  canvas.width=Math.ceil(worldWidth*density)+4;
  canvas.height=Math.ceil(worldHeight*density)+4;
  const context=canvas.getContext('2d');
  const image=context.createImageData(canvas.width,canvas.height);
  const depth=new Float32Array(canvas.width*canvas.height);
  depth.fill(-Infinity);
  for(const pack of meshes){
    for(let i=0;i<pack.projected.length;i+=6){
      pack.projected[i]=(pack.projected[i]-bounds.left)*density+2;
      pack.projected[i+1]=(bounds.top-pack.projected[i+1])*density+2;
    }
    rasterize(pack,image,depth);
  }
  context.putImageData(image,0,0);
  return {canvas,x:bounds.left-2/density,y:-bounds.top-2/density,width:canvas.width/density,height:canvas.height/density};
}
