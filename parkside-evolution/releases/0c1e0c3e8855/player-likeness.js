// A sculpted, photo-inspired avatar. Each animated body part is one colored mesh.
export function buildSteveAvatar(T,avatar,firstHands){
 const palette={skin:0xd0a086,cheek:0xc89278,lip:0x915f53,hair:0x302820,hairHi:0x4b3c2e,beard:0x352b24,beardHi:0x695342,white:0xd7d1bc,iris:0x735332,pupil:0x191611,black:0x16191c,seam:0x272c30,jeans:0x34495e,denim:0x435b70,leather:0x332b26,sole:0x1d1e20,metal:0x918576};
 const material=new T.MeshStandardMaterial({vertexColors:true,roughness:.82});
 const ball=new T.SphereGeometry(1,12,8).toNonIndexed(),box=new T.BoxGeometry(1,1,1).toNonIndexed();
 const parts=avatar.children.slice(0,6),skinVertices=[],geometries=[],scratch=new T.Object3D(),normalMatrix=new T.Matrix3(),point=new T.Vector3(),normal=new T.Vector3();
 let positions=[],normals=[],colors=[],skinIndices=[],shapes=0;
 function piece(shape,color,x,y,z,sx,sy,sz,rx=0,ry=0,rz=0){
  scratch.position.set(x,y,z);scratch.scale.set(sx,sy,sz);scratch.rotation.set(rx,ry,rz);scratch.updateMatrix();normalMatrix.getNormalMatrix(scratch.matrix);
  const c=new T.Color(palette[color]),p=shape.attributes.position,n=shape.attributes.normal;shapes++;
  for(let i=0;i<p.count;i++){point.fromBufferAttribute(p,i).applyMatrix4(scratch.matrix);normal.fromBufferAttribute(n,i).applyMatrix3(normalMatrix).normalize();positions.push(point.x,point.y,point.z);normals.push(normal.x,normal.y,normal.z);if(color==='skin'||color==='cheek')skinIndices.push(colors.length/3);colors.push(c.r,c.g,c.b);}
 }
 const oval=(color,...v)=>piece(ball,color,...v),block=(color,...v)=>piece(box,color,...v);
 function finish(mesh,name){const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setAttribute('normal',new T.Float32BufferAttribute(normals,3));geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.computeBoundingSphere();geo.computeBoundingBox();mesh.geometry=geo;mesh.material=material;mesh.scale.set(1,1,1);mesh.name=name;geometries.push(geo);skinVertices.push({geo,indices:skinIndices,original:new Float32Array(colors)});positions=[];normals=[];colors=[];skinIndices=[];}
 // Broad shoulders, fitted dark shirt and a visible V neckline.
 oval('black',0,-.025,0,.30,.345,.165);oval('black',0,.18,0,.335,.16,.172);
 block('black',0,-.285,0,.54,.105,.30);block('seam',0,-.315,-.015,.54,.023,.31);
 for(const side of [-1,1]){block('seam',side*.24,-.055,-.12,.014,.30,.02,0,0,side*.10);oval('skin',side*.036,.278,-.109,.064,.094,.065);}
 // A triangle of skin forms the open V, bordered by dark stitched edges.
 const v=[-.112,.31,-.177,.112,.31,-.177,0,.15,-.177],c=new T.Color(palette.skin);
 for(let i=0;i<9;i+=3){positions.push(...v.slice(i,i+3));normals.push(0,0,-1);skinIndices.push(colors.length/3);colors.push(c.r,c.g,c.b);}
 for(const side of [-1,1])block('seam',side*.057,.231,-.181,.014,.195,.012,0,0,-side*.60);
 finish(parts[0],'Black V-neck shirt');
 // Face points toward -Z, with a high forehead, real eyes and a full rounded beard.
 oval('skin',0,.016,0,.186,.235,.161);oval('skin',0,-.113,-.011,.156,.13,.144);
 for(const side of [-1,1]){
  oval('skin',side*.19,-.015,.005,.038,.080,.045);oval('cheek',side*.195,-.019,-.027,.019,.047,.012);
  oval('cheek',side*.116,-.053,-.116,.074,.075,.053);
  oval('lip',side*.076,.002,-.148,.049,.025,.023);
  oval('white',side*.076,.011,-.165,.036,.019,.013);
  oval('iris',side*.076,.010,-.176,.016,.017,.005);
  oval('pupil',side*.076,.010,-.181,.008,.011,.003);
  oval('white',side*.071,.018,-.184,.004,.005,.002);
  oval('hair',side*.081,.060,-.157,.058,.014,.013,0,0,-side*.12);
  oval('beard',side*.139,-.108,-.110,.050,.097,.040,0,0,side*.25);
  oval('beard',side*.086,-.191,-.097,.091,.073,.079);
  oval('hair',side*.166,.097,.029,.032,.137,.130);
  oval('beard',side*.165,-.054,-.061,.021,.09,.031);
 }
 oval('skin',0,-.010,-.167,.033,.081,.033);oval('skin',0,-.058,-.199,.042,.033,.030);
 for(const side of [-1,1])oval('cheek',side*.031,-.068,-.188,.020,.018,.022);
 oval('beard',0,-.177,-.060,.158,.112,.133);oval('beard',0,-.206,-.106,.137,.070,.095);
 oval('lip',0,-.129,-.179,.063,.012,.012);
 for(const side of [-1,1]){oval('beard',side*.043,-.104,-.191,.060,.024,.025,0,0,side*.23);oval('beard',side*.067,-.144,-.159,.025,.045,.038,0,0,side*.15);}
 oval('beard',0,-.159,-.165,.026,.027,.027);
 for(let i=0;i<9;i++){const x=(i-4)*.024;oval('beardHi',x,-.220+Math.abs(x)*.22,-.18+Math.abs(x)*.22,.004,.028+(i%3)*.006,.004,0,0,x*1.5);}
 // Overlapping swept locks give the hairstyle volume without hundreds of draw calls.
 oval('hair',0,.186,.025,.19,.087,.156);oval('hair',0,.105,.117,.17,.147,.058);
 for(let i=0;i<7;i++){const x=-.145+i*.045;oval(i%3===0?'hairHi':'hair',x,.204+.015*Math.sin(i),-.041,.051,.055,.117,.30,0,-.40);}
 oval('hair',-.080,.169,-.105,.073,.045,.074,.55,0,-.45);
 oval('hair',-.026,.134,-.141,.019,.078,.020,0,0,-.30);
 oval('hairHi',-.15,.030,.022,.007,.050,.030);
 finish(parts[1],'Steve portrait — swept hair, hazel eyes and full beard');
 // Jeans, pockets, stitching and rounded leather shoes move with the original leg rig.
 for(let i=2;i<4;i++){const side=i===2?-1:1;oval('jeans',0,.03,0,.119,.342,.124);block('denim',side*.092,.05,-.024,.012,.54,.025);block('denim',0,.20,.114,.13,.15,.012);block('jeans',0,-.28,0,.20,.065,.23);oval('leather',0,-.315,-.063,.124,.070,.196);block('sole',0,-.362,-.064,.232,.034,.33);block('metal',0,-.278,-.099,.09,.008,.035);finish(parts[i],i===2?'Left jeans and shoe':'Right jeans and shoe');}
 // Short sleeves, exposed forearms and a thumb on each hand.
 for(let i=4;i<6;i++){const side=i===4?-1:1;oval('black',0,.15,0,.104,.174,.127);block('seam',0,.041,0,.186,.022,.229);oval('skin',0,-.111,-.003,.077,.172,.083);oval('skin',0,-.27,-.003,.074,.088,.067);oval('skin',-side*.058,-.247,-.019,.032,.050,.035);finish(parts[i],i===4?'Left sleeve and arm':'Right sleeve and arm');}
 ball.dispose();box.dispose();
 const green=new T.Color(0x70a850);let powered=false;
 function setHulk(active){if(powered===active)return;powered=active;avatar.scale.setScalar(active?1.35:1);parts[0].scale.x=active?1.35:1;parts[4].scale.x=parts[5].scale.x=active?1.5:1;for(const data of skinVertices){const attr=data.geo.attributes.color;if(active){for(const i of data.indices)attr.setXYZ(i,green.r,green.g,green.b);}else attr.array.set(data.original);attr.needsUpdate=true;}}
 let applied={};
 function setPalette(next){const keys=['skin','cheek','black','seam','jeans','denim','hair','hairHi','beard','beardHi'],pairs=keys.map(k=>({from:new T.Color(applied[k]??palette[k]),to:new T.Color(next[k]??palette[k])}));for(const data of skinVertices){const original=data.original;for(let i=0;i<original.length;i+=3){const pair=pairs.find(p=>Math.abs(original[i]-p.from.r)<.00001&&Math.abs(original[i+1]-p.from.g)<.00001&&Math.abs(original[i+2]-p.from.b)<.00001);if(pair){original[i]=pair.to.r;original[i+1]=pair.to.g;original[i+2]=pair.to.b;}}if(!powered){data.geo.attributes.color.array.set(original);data.geo.attributes.color.needsUpdate=true;}}applied={...next};}
 return{setHulk,setPalette,meshCount:6,shapes,geometries,material};
}
