import {BUILD_PARTS,MATERIALS,clamp} from './data.js?v=sibling-walk-7';
export const BUILD_LIMIT=180,BLOCK_LIMIT=2400;
export function sanitizeBlueprint(parts){const result=[];let count=0;for(const p of parts||[]){const v=BUILD_PARTS[p?.type];if(!v||![p.x,p.y,p.z,p.rot??0].every(Number.isFinite))continue;const part={type:p.type,x:clamp(p.x,-24,24),y:clamp(p.y,v[1]/2,30+v[1]/2),z:clamp(p.z,-24,24),rot:p.rot||0,material:MATERIALS[p.material]?p.material:v[3]},n=partBlocks(part).length;if(result.length>=BUILD_LIMIT||count+n>BLOCK_LIMIT)break;result.push(part);count+=n;}return result;}

export function dimensions(p){const v=BUILD_PARTS[p.type]||BUILD_PARTS.Wall,a=p.rot||0;return [Math.abs(Math.cos(a))*v[0]+Math.abs(Math.sin(a))*v[2],v[1],Math.abs(Math.sin(a))*v[0]+Math.abs(Math.cos(a))*v[2]];}
// One shared geometry description drives editor previews, walkable colliders and destruction.
export function partBlocks(p,structure=1){
 const v=BUILD_PARTS[p.type];if(!v)return[];const [w,h,d,defaultMat]=v,mat=p.material||defaultMat,rot=p.rot||0,base=p.y-h/2,blocks=[];
 const add=(x,y,z,bw,bh,bd,tag=p.type.toLowerCase(),material=mat)=>blocks.push({x:p.x+x*Math.cos(rot)+z*Math.sin(rot),y:base+y,z:p.z-x*Math.sin(rot)+z*Math.cos(rot),w:bw,h:bh,d:bd,mat:material,tag,rot,structure});
 const wall=(x,z,width,height,along='x',tag='wall')=>{const nx=Math.round(width/.9),ny=Math.round(height/.8);for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){const q=(i-(nx-1)/2)*width/nx;add(x+(along==='x'?q:0),(j+.5)*height/ny,z+(along==='z'?q:0),along==='x'?width/nx-.025:.58,height/ny-.025,along==='z'?width/nx-.025:.58,tag)}};
 if(p.type==='Wall')wall(0,0,w,h);
 else if(p.type==='Tower'){wall(0,-1.5,3.6,h,'x','tower');wall(0,1.5,3.6,h,'x','tower');wall(-1.5,0,2.4,h,'z','tower');wall(1.5,0,2.4,h,'z','tower');for(let i=0;i<3;i++)add((i-1)*1.2,h+.05,0,1.18,.25,3.6,'roof','wood');}
 else if(p.type==='Gate'){for(const x of[-1.45,1.45])for(let i=0;i<3;i++)add(x,.4+i*.8,0,.7,.775,d,'wall');add(0,h-.2,0,2.2,.4,d,'beam');}
 else if(p.type==='Stairs'){for(let i=0;i<15;i++){const rise=(i+1)*h/15;add(0,rise/2,d/2-(i+.5)*d/15,w,rise,d/15-.01,'stairs');}}
 else if(p.type==='Floor'||p.type==='Roof'){for(let i=0;i<3;i++)add((i-1)*1.2,h/2,0,1.19,h,d,p.type.toLowerCase());}
 else add(0,h/2,0,w,h,d);
 return blocks;
}
const part=(type,x,base,z,rot=0,material)=>({type,x,y:base+BUILD_PARTS[type][1]/2,z,rot,...(material?{material}:{})});
export function starterCastle(kind='courtyard'){
 if(kind==='empty')return[];
 if(kind==='watchtower')return [part('Tower',0,0,0),part('Floor',0,2.4,0),part('Stairs',3.6,0,2.4),part('Floor',3.6,2.4,-2.4)];
 const parts=[];
 for(const x of[-5.4,-1.8,1.8,5.4]){parts.push(part('Wall',x,0,-5.4));parts.push(part(x===-1.8||x===1.8?'Gate':'Wall',x,0,5.4));parts.push(part('Floor',x,2.4,-4.8));}
 for(const z of[-3.6,0,3.6])for(const x of[-7.2,7.2])parts.push(part('Wall',x,0,z,Math.PI/2));
 for(const x of[-7.2,7.2])parts.push(part('Tower',x,0,-5.4));
 parts.push(part('Stairs',0,0,0),part('Column',0,0,-3.6));return parts;
}
