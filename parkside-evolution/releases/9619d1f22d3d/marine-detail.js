// Small repeating surface maps and instanced dressing; no extra physics bodies.
export function createMarineDetail(T,group,ox){
 let seed=417;const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296),size=256;
 function surface(base,seams=false){const c=new T.Color(base),data=new Uint8Array(size*size*4);for(let y=0;y<size;y++)for(let x=0;x<size;x++){const i=(y*size+x)*4,grain=(rand()-.5)*.035,line=seams&&(x<2||y<2)?-.15:0;data[i]=Math.max(0,Math.min(255,(c.r+grain+line)*255));data[i+1]=Math.max(0,Math.min(255,(c.g+grain+line)*255));data[i+2]=Math.max(0,Math.min(255,(c.b+grain+line)*255));data[i+3]=255;}const tx=new T.DataTexture(data,size,size,T.RGBAFormat);tx.wrapS=tx.wrapT=T.RepeatWrapping;tx.magFilter=T.LinearFilter;tx.minFilter=T.LinearMipmapLinearFilter;tx.generateMipmaps=true;tx.anisotropy=4;tx.needsUpdate=true;return tx;}
 const asphalt=surface(0x42494b),concrete=surface(0xb2b4a8,true);
 function ground(w,d,concreteSurface=false){const tx=(concreteSurface?concrete:asphalt).clone();tx.repeat.set(w/(concreteSurface?2:5),d/(concreteSurface?2:5));tx.needsUpdate=true;return new T.MeshStandardMaterial({map:tx,roughness:concreteSurface?.93:.97});}
 const batches=new Map(),dummy=new T.Object3D();let instances=0;
 function add(color,x,y,z,w,h,d,yaw=0){if(!batches.has(color))batches.set(color,[]);batches.get(color).push({x,y,z,w,h,d,yaw});instances++;}
 // Drainage at the road edge and fine joints on the promenade.
 for(const z of [-28,-12,4,20,36]){add(0x242c2d,20.8,.109,z,.65,.025,1.1);for(let j=0;j<8;j++)add(0x647075,20.8,.127,z-.44+j*.125,.58,.014,.035);}
 for(let z=-39;z<40;z+=2)add(0x93988f,23.8,.101,z,3.95,.009,.018);
 // Low-contrast repaired asphalt, outside parking bays and the driving centerline.
 for(let i=0;i<22;i++){const x=18.6+rand()*1.3,z=-33+rand()*77;add(i%2?0x383f40:0x4c5352,x,.043,z,.03,.006,.25+rand()*.65,(rand()-.5)*1.2);}
 function finish(){for(const [color,items] of batches){const mesh=new T.InstancedMesh(new T.BoxGeometry(1,1,1),new T.MeshStandardMaterial({color,roughness:.9}),items.length);mesh.name='Marine Park pavement details';items.forEach((a,i)=>{dummy.position.set(ox+a.x,a.y,a.z);dummy.scale.set(a.w,a.h,a.d);dummy.rotation.set(0,a.yaw,0);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);});mesh.instanceMatrix.needsUpdate=true;mesh.receiveShadow=true;group.add(mesh);}group.userData.marineDetail={instances,drawCalls:batches.size,textureSize:size};}
 finish();return{ground};
}
