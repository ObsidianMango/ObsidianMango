import * as T from '../vendor/three.module.js';

export function domeMasonry({wedge:[lower,upper,thickness,halfAngle],h}) {
 const sin=Math.sin(halfAngle),cos=Math.cos(halfAngle);
 const inner=radius=>Math.max(.01,radius-thickness);
 const center=(Math.max(lower,upper)+inner(Math.min(lower,upper)))*cos/2;
 const vertices=[];
 for(const [outer,y] of [[lower,-h/2],[upper,h/2]]){
  for(const [radius,side] of [[outer,-1],[outer,1],[inner(outer),1],[inner(outer),-1]]){
   vertices.push(side*radius*sin,y,radius*cos-center);
  }
 }
 const faces=[[3,2,1,0],[4,5,6,7],[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7]];
 const positions=[];
 for(const [a,b,c,d] of faces)for(const i of [a,b,c,a,c,d])positions.push(...vertices.slice(i*3,i*3+3));
 const geometry=new T.BufferGeometry();
 geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));
 geometry.computeVertexNormals();
 return {geometry,vertices:new Float32Array(vertices)};
}
