import {partBlocks} from './blueprints.js?v=sibling-walk-7';
import {rng,BUILD_PARTS} from './data.js?v=sibling-walk-7';
export function generateCastle(level,index=0,custom=null){
 const blocks=[],r=rng(index*117+23);let structure=0;
 const add=(x,y,z,w,h,d,mat=level.mat,tag='wall',rot=0)=>{blocks.push({x,y,z,w,h,d,mat,tag,rot,structure});};
 const wall=(x,z,length,rows,along='x',mat=level.mat,tag='wall',base=0)=>{structure++;for(let y=0;y<rows;y++)for(let i=0;i<length;i++){const a=(i-(length-1)/2)*1.23+(y%2?.22:0);add(x+(along==='x'?a:0),base+.47+y*.96,z+(along==='z'?a:0),along==='x'?1.19:.78,.91,along==='z'?1.19:.78,mat,tag)}for(let i=0;i<length;i+=2){const a=(i-(length-1)/2)*1.23;add(x+(along==='x'?a:0),base+rows*.96+.4,z+(along==='z'?a:0),along==='x'?1.1:.8,.8,along==='z'?1.1:.8,mat,tag)}};
 const tower=(x,z,height,width=3,mat=level.mat,base=0)=>{structure++;const id=structure;for(let y=0;y<height;y++){const rad=width*.54;for(let side=0;side<4;side++)for(let j=0;j<width;j++){const p=(j-(width-1)/2)*1.1;const xs=side<2?p:(side===2?-rad:rad),zs=side<2?(side===0?-rad:rad):p;add(x+xs,base+y*.96+.47,z+zs,side<2?1.05:.7,.91,side<2?.7:1.05,mat,'tower')}if(y===height-2)for(let j=0;j<width;j++)add(x+(j-(width-1)/2)*1.1,base+y*.96+.98,z,1.1,.22,width*1.2,'wood','floor')}
 for(let side=0;side<4;side++)for(let j=0;j<width;j+=2){const p=(j-(width-1)/2)*1.1;add(x+(side<2?p:side===2?-width*.54:width*.54),base+height*.96+.35,z+(side<2?(side===0?-width*.54:width*.54):p),side<2?1:.75,.72,side<2?.75:1,mat,'tower')}
 add(x,base+height*.96+.6,z,.15,3,.15,'wood','flagpole');add(x+.7,base+height*.96+1.2,z,1.3,1.2,.09,'wood','banner');structure=id;};
 const gate=(z=6,h=4)=>{wall(-3.4,z,3,h);wall(3.4,z,3,h);structure++;for(let j=0;j<4;j++)add((j-1.5)*.6,1.2,z,.55,2.4,.45,'wood','gate');add(0,2.65,z,3,.35,.8,'wood','beam');for(let i=0;i<4;i++)add((i-1.5)*1.2,3.2,z,1.15,.75,.8,level.mat,'wall')};
 const barrel=(x,z,y=.6,tag='barrel')=>{structure++;add(x,y,z,.85,1.15,.85,'barrel',tag)};
 const hall=(x,z,w=7,h=4,d=5,base=0)=>{wall(x,z-d/2,Math.round(w/1.23),h,'x',level.mat,'wall',base);wall(x-w/2,z,Math.round(d/1.23),h,'z',level.mat,'wall',base);wall(x+w/2,z,Math.round(d/1.23),h,'z',level.mat,'wall',base);structure++;for(let i=0;i<Math.round(w/1.23);i++){add(x+(i-(Math.round(w/1.23)-1)/2)*1.23,base+h*.96+.1,z,1.2,.35,d,'wood','roof');}for(let i=0;i<3;i++)add(x+(i-1)*1.6,base+2,z-d/2-.45,1.1,1.4,.12,'glass','window')};
 if(custom){for(const p of custom)blocks.push(...partBlocks(p,++structure));return blocks;}
 switch(level.layout){
 case 'fort':wall(-5,0,8,4,'z','wood');wall(5,0,8,4,'z','wood');wall(0,-4.5,8,4,'x','wood');gate(4.5,4);tower(-5,-4.5,5,2,'wood');tower(5,-4.5,5,2,'wood');hall(0,-1,4,3,3);break;
 case 'twin':{
 // Slender square volumes, close-set silver mullions, dark glazing and flat roofs.
 // Facade strips are carried by destructible panels rather than static scene decoration.
 for(const [t,x,z] of [[0,-4.4,0],[1,4.4,-3]]){
  structure++;const floors=14,unit=level.height/floors;
  for(let row=0;row<floors;row++){
   for(let side=0;side<4;side++)for(let j=0;j<3;j++){
    const q=(j-1)*1.8,front=side<2;
    add(x+(front?q:side===2?-2.7:2.7),row*unit+unit/2,z+(front?(side===0?-2.7:2.7):q),row===0?.32:1.78,unit-.035,.36,'stone','tower',front?0:Math.PI/2);
    blocks.at(-1).facade=row>0;blocks.at(-1).band=row===4||row===9||row===13;
   }
   if(row%2===1||row===0){for(let i=0;i<3;i++)add(x+(i-1)*1.8,(row+1)*unit-.13,z,1.78,.24,5.3,'wood','floor');}
  }
  for(let i=0;i<3;i++)add(x+(i-1)*1.8,level.height+.1,z,1.78,.3,5.8,'stone','roof');
  if(t===0){add(x,level.height+3,z,.14,5.8,.14,'iron','antenna');add(x,level.height+6.25,z,.06,.7,.06,'stone','antenna');}
 }
 // Low shared plaza, with a small pedestrian pavilion between the towers.
 structure++;for(let i=0;i<5;i++)add((i-2)*1.2,.14,5,1.18,.25,3,'stone','floor');
 for(const x of[-1.2,1.2]){add(x,1.2,5,.3,2.4,.3,'stone','column');}add(0,2.5,5,3,.25,3,'wood','roof');
 barrel(-4.4,1.6);barrel(4.4,-1.4);break;}
 case 'citadel':for(const x of[-6,-2,2,6]){structure++;for(let y=0;y<4;y++)add(x,.47+y*.96,0,1.4,.91,1.4,level.mat,'column')}
 structure++;for(let i=0;i<12;i++)add((i-5.5)*1.23,4,0,1.2,.45,6,'wood','floor');for(const x of[-6,6])tower(x,-2,level.height,3,level.mat,4.4);hall(0,-1,8,6,4,4.4);gate(6,5);barrel(-2,0,4.8);barrel(2,0,4.8);break;
 case 'viking':hall(0,0,12,5,7);wall(-8,0,10,3,'z','wood');wall(8,0,10,3,'z','wood');tower(-8,5,6,2,'wood');tower(8,5,6,2,'wood');gate(7,4);break;
 case 'palace':hall(0,-2,12,6,8);for(const x of[-8,8])for(const z of[-5,5])tower(x,z,level.height+(z<0?2:0),2);gate(6,5);structure++;for(let i=0;i<6;i++)add((i-2.5)*1.2,6.3,4.5,1.16,.3,3,'wood','balcony');for(let i=0;i<6;i++)add((i-2.5)*1.2,7.2,6,1.16,1.4,.18,'glass','window');barrel(0,-3,.6,'secret');barrel(1,-3,.6,'secret');break;
 default:{const mega=level.layout==='mega',s=mega?11:7;for(const x of[-s,s])for(const z of[-s,s])tower(x,z,level.height+(z<0?2:0),mega?3:2);wall(0,-s,Math.round(s*1.6),level.height-3);wall(-s,0,Math.round(s*1.6),level.height-3,'z');wall(s,0,Math.round(s*1.6),level.height-3,'z');gate(s,5);hall(0,-1,mega?10:6,level.height-2,mega?8:4);if(mega){tower(0,-4,13,3);wall(-5,5,6,4);wall(5,5,6,4)}if(level.layout==='bridge'){structure++;for(let i=0;i<7;i++)add(0,.35,s+1+i,3,.35,.95,'wood','bridge');for(const x of[-1.4,1.4])add(x,.85,s+4,.2,.7,7,'wood','bridge')}
 barrel(-2,s-1);barrel(2,s-1);barrel(0,-2,.6,'secret');break;}}
 // Bonus objects participate in collisions and the support graph too.
 structure++;add(0,.4,-3,.8,.65,.7,'treasure','treasure');for(let i=0;i<4;i++)barrel((r()-.5)*12,(r()-.5)*7);
 structure++;add(11,.5,0,2,.5,1.5,'wood','cart');add(11,1.25,0,1.1,1,.8,'stone','statue');
 return blocks;
}
