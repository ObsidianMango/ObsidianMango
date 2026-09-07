import * as THREE from './vendor/three.module.js';
import './vendor/polygon-clipping.js';

const clipping=globalThis.polygonClipping;
export const TAU=Math.PI*2;
export function rng(seed=1){let s=seed|0;return()=>{s+=0x6D2B79F5;let t=s;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
export function noise(x,z,seed=0){return .48*Math.sin(x*7.43+Math.sin(z*5.37)+seed)+.28*Math.sin(z*13.71+x*4.8+seed*2)+.16*Math.cos(x*29.3-z*21.7+seed)+.08*Math.sin(z*69.1+x*37.3);}
export function signedArea(ring){let a=0;for(let i=0,j=ring.length-1;i<ring.length;j=i++)a+=ring[j][0]*ring[i][1]-ring[i][0]*ring[j][1];return a/2;}
export function area(polygons){return polygons.reduce((total,poly)=>total+Math.abs(signedArea(poly[0]))-poly.slice(1).reduce((s,r)=>s+Math.abs(signedArea(r)),0),0);}
function close(r){if(r.length&&r[0]!==r[r.length-1])r.push([...r[0]]);return r;}
export function circle(x,z,r,count=80,teeth=false){const out=[];for(let i=0;i<count;i++){const a=i/count*TAU,k=teeth?1+.035*Math.cos(a*10):1;out.push([x+Math.cos(a)*r*k,z+Math.sin(a)*r*k]);}return close(out);}
export function star(x=0,z=0,size=.48,count=10){const points=[];for(let i=0;i<count;i++){const a=i/count*TAU-Math.PI/2,r=(i%2?.48:1)*size;points.push([x+Math.cos(a)*r,z+Math.sin(a)*r]);}return close(points);}
export function boundary(recipe,seed=1){
  const points=[];const count=recipe.shape==='star'?100:160;
  for(let i=0;i<count;i++){
    const a=i/count*TAU;let x,z,r=1.61;
    if(recipe.shape==='heart'){
      x=1.65*Math.sin(a)**3;z=-(13*Math.cos(a)-5*Math.cos(2*a)-2*Math.cos(3*a)-Math.cos(4*a))*.107;
    }else{
      if(recipe.shape==='square')r=1.32/Math.pow(Math.abs(Math.cos(a))**5+Math.abs(Math.sin(a))**5,.2);
      if(recipe.shape==='scalloped')r*=1+.026*Math.cos(a*16);
      if(recipe.shape==='star')r*=.81+.19*Math.cos(a*5-Math.PI/2);
      r*=1+.008*Math.sin(a*11+seed)+.009*Math.cos(a*7+seed*.3)+.004*Math.sin(a*31+seed);
      x=r*Math.cos(a);z=r*Math.sin(a);
    }
    if(recipe.aspect){x*=Math.sqrt(recipe.aspect);z/=Math.sqrt(recipe.aspect);}
    points.push([x,z]);
  }
  if(signedArea(points)<0)points.reverse();close(points);
  const poly=[points];if(recipe.shape==='ring')poly.push(circle(0,0,.57).reverse());return [poly];
}
function inRing(x,z,ring){let inside=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[i],b=ring[j];if(((a[1]>z)!==(b[1]>z))&&(x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0]))inside=!inside;}return inside;}
export function contains(polygons,x,z){return polygons.some(poly=>inRing(x,z,poly[0])&&!poly.slice(1).some(hole=>inRing(x,z,hole)));}
export function difference(a,b){if(!a.length)return [];return clipping.difference(a,b);}
export function intersection(a,b){if(!a.length||!b.length)return [];return clipping.intersection(a,b);}
export function scaled(polygons,factor){return polygons.map(poly=>poly.map(ring=>ring.map(p=>[p[0]*factor,p[1]*factor])));}
export function distanceToRings(polygons,x,z){let best=Infinity;for(const poly of polygons)for(const ring of poly)for(let i=1;i<ring.length;i++){const a=ring[i-1],b=ring[i],dx=b[0]-a[0],dz=b[1]-a[1],len=dx*dx+dz*dz,t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(len||1)));best=Math.min(best,(x-a[0]-t*dx)**2+(z-a[1]-t*dz)**2);}return Math.sqrt(best);}

// The same closed 2D cut is rebuilt through every 3D layer. No invisible clipping planes.
export function layerGeometry(polygons,bottom,top,colorAt,original,{detail=3,crumb=true}={}){
  const positions=[],colors=[],indices=[[],[]],lookup=new Map();
  const vertex=(p,y,kind)=>{
    const key=p[0].toFixed(6)+','+p[1].toFixed(6)+','+y.toFixed(6)+','+kind;
    if(lookup.has(key))return lookup.get(key);
    const id=positions.length/3;positions.push(p[0],y,p[1]);const c=colorAt(p[0],p[1],kind,y);colors.push(c.r,c.g,c.b);lookup.set(key,id);return id;
  };
  const triangle=(a,b,c,level,isTop)=>{
    if(level>0){const ab=[(a[0]+b[0])/2,(a[1]+b[1])/2],bc=[(b[0]+c[0])/2,(b[1]+c[1])/2],ca=[(c[0]+a[0])/2,(c[1]+a[1])/2];triangle(a,ab,ca,level-1,isTop);triangle(ab,b,bc,level-1,isTop);triangle(ca,bc,c,level-1,isTop);triangle(ab,bc,ca,level-1,isTop);return;}
    const k=isTop?'top':'bottom',fn=isTop?top:bottom;let v=[vertex(a,fn(...a),k),vertex(b,fn(...b),k),vertex(c,fn(...c),k)];
    const cross=(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
    if((isTop&&cross>0)||(!isTop&&cross<0))v=[v[0],v[2],v[1]];indices[0].push(...v);
  };
  for(const poly of polygons){
    const rings=poly.map(r=>r.slice(0,-1));if(rings[0].length<3)continue;
    const contour=rings[0].map(p=>new THREE.Vector2(...p)),holes=rings.slice(1).map(r=>r.map(p=>new THREE.Vector2(...p)));
    const flat=rings.flat(),faces=THREE.ShapeUtils.triangulateShape(contour,holes);
    for(const [a,b,c] of faces){triangle(flat[a],flat[b],flat[c],detail,true);triangle(flat[a],flat[b],flat[c],detail,false);}
    for(const source of rings){
      const ring=source;
      for(let i=0;i<ring.length;i++){
        // Match every subdivided cap edge exactly, including its displaced height.
        const start=ring[i],end=ring[(i+1)%ring.length],segments=2**detail;
        for(let segment=0;segment<segments;segment++){
        const a=[THREE.MathUtils.lerp(start[0],end[0],segment/segments),THREE.MathUtils.lerp(start[1],end[1],segment/segments)];
        const b=[THREE.MathUtils.lerp(start[0],end[0],(segment+1)/segments),THREE.MathUtils.lerp(start[1],end[1],(segment+1)/segments)],mid=[(a[0]+b[0])/2,(a[1]+b[1])/2];
        const cut=crumb&&distanceToRings(original,...mid)>.04,k=cut?'crumb':'edge',group=cut?1:0;
        for(let j=0;j<3;j++){
          const a0=THREE.MathUtils.lerp(bottom(...a),top(...a),j/3),a1=THREE.MathUtils.lerp(bottom(...a),top(...a),(j+1)/3),b0=THREE.MathUtils.lerp(bottom(...b),top(...b),j/3),b1=THREE.MathUtils.lerp(bottom(...b),top(...b),(j+1)/3);
          const va=vertex(a,a0,k),vb=vertex(b,b0,k),vc=vertex(b,b1,k),vd=vertex(a,a1,k);indices[group].push(va,vc,vb,va,vd,vc);
        }
        }
      }
    }
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.setIndex([...indices[0],...indices[1]]);g.addGroup(0,indices[0].length,0);g.addGroup(indices[0].length,indices[1].length,1);g.computeVertexNormals();g.computeBoundingSphere();return g;
}
