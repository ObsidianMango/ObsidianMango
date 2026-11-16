import {partBlocks} from './blueprints.js?v=sibling-walk-7';
import {rng} from './data.js?v=twin-domes-1';
export function generateCastle(level,index=0,custom=null){
 const blocks=[],r=rng(index*117+23);let structure=0;
 const add=(x,y,z,w,h,d,mat=level.mat,tag='wall',rot=0,details={})=>{blocks.push({x,y,z,w,h,d,mat,tag,rot,structure,...details});};
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
 case 'domes':{
  const limestone=0xead2ab,trim=0xce9b62;
  // The arcades carry one shared roof deck. Timber lintels are the weak points.
  structure++;
  for(const z of [-4.35,4.35]){
   for(const x of [-9.7,-6,-2,2,6,9.7]){
    add(x,.16,z,1.52,.30,1.35,'stone','column',0,{color:trim});
    for(let row=0;row<2;row++)add(x,.8+row*1.02,z,1.13,1,1.04,'sandstone','column',0,{color:limestone});
    add(x,2.49,z,1.59,.33,1.32,'wood','beam',0,{color:trim});
   }
   for(let i=-2;i<=2;i++){
    const x=i*3.94;
    add(x,2.81,z,i===0?3.2:2.94,.32,.92,'wood','beam');
    add(x,3.16,z,3.90,.35,1.15,'sandstone','wall',0,{color:limestone});
   }
   add(0,.1,z*1.24,3.9,.2,1.15,'stone','floor',0,{color:limestone});
  }
  for(const x of [-9.7,9.7]){
   for(const z of [-2.1,0,2.1]){
    for(let row=0;row<3;row++)add(x,.51+row*1.06,z,1.04,1.02,2.05,'sandstone','wall',0,{color:limestone});
   }
   add(x,3.29,0,1.15,.3,7.4,'sandstone','wall',0,{color:trim});
  }
  for(let i=-4;i<=4;i++)add(i*2.22,3.54,0,2.19,.39,9.8,'sandstone','roof',0,{color:limestone});

  // Tapered masonry courses form two hollow shells with raised ornamental caps.
  const profile=[
   [4.78,4.78,.38,0xc88e54],
   [4.78,4.70,.83,0xe1a389],
   [4.70,4.45,.83,0xe5aa94],
   [4.45,4.02,.83,0xe6ab96],
   [4.02,3.39,.83,0xe5ac95],
   [3.39,2.50,.83,0xe8b09b],
   [2.50,1.12,.68,0xe8af99],
   [1.12,.80,.18,0xd9a463],
   [.80,.63,.38,0xb97363],
   [.63,.10,.25,0xbf7f6b]
  ];
  const sectors=12,halfAngle=Math.PI/sectors-.005;
  const cos=Math.cos(halfAngle),sin=Math.sin(halfAngle);
  for(const center of [-5.15,5.15]){
   structure++;
   let base=3.75;
   for(const [lower,upper,height,color] of profile){
    const thickness=1.1,outer=Math.max(lower,upper),inner=Math.max(.01,Math.min(lower,upper)-thickness);
    const radius=(outer+inner)*cos/2;
    for(let i=0;i<sectors;i++){
     const rot=(i+.5)*2*Math.PI/sectors;
     add(center+Math.sin(rot)*radius,base+height/2,Math.cos(rot)*radius,2*outer*sin,height-.018,
      (outer-inner)*cos,'sandstone','dome',rot,{color,wedge:[lower,upper,thickness,halfAngle]});
    }
    base+=height;
   }
  }
  for(const x of [-5.15,5.15])for(const z of [-5.6,5.6])barrel(x,z);
  return blocks;}
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
