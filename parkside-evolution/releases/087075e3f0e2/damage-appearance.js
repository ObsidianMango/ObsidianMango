// Shared damage masks; damage amounts are uniforms, so textures never grow per hit.
const assets=new WeakMap();
export function damageAssets(T){
 if(assets.has(T))return assets.get(T);
 const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const c=canvas.getContext('2d');c.fillStyle='#e5e2db';c.fillRect(0,0,128,128);let seed=841;
 const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 for(let i=0;i<700;i++){c.fillStyle=i%2?'#302a2399':'#11100b55';c.fillRect(rand()*128,rand()*128,1+rand()*4,1+rand()*3);}
 for(let i=0;i<26;i++){let x=rand()*128,y=rand()*128;c.strokeStyle='#1a1714';c.lineWidth=i%3?1:2;c.beginPath();c.moveTo(x,y);for(let j=0;j<5;j++){x+=(rand()-.5)*23;y+=rand()*15;c.lineTo(x,y);}c.stroke();}
 const mask=new T.CanvasTexture(canvas);mask.wrapS=mask.wrapT=T.RepeatWrapping;
 const white=new T.DataTexture(new Uint8Array([255,255,255,255]),1,1);white.needsUpdate=true;
 const value={mask,white};assets.set(T,value);return value;
}
export function setDamageAppearance(T,material,damage=0,charred=0){
 let u=material.userData.wreckUniforms;
 if(!u){const {mask,white}=damageAssets(T);u={parksideDamage:{value:0},parksideChar:{value:0},parksideDamageMap:{value:mask}};material.userData.wreckUniforms=u;material.map=material.map||white;
  material.onBeforeCompile=shader=>{Object.assign(shader.uniforms,u);shader.fragmentShader='uniform float parksideDamage;\nuniform float parksideChar;\nuniform sampler2D parksideDamageMap;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
   vec3 scar = texture2D(parksideDamageMap, vMapUv * 1.7).rgb;
   diffuseColor.rgb *= mix(vec3(1.0), scar, parksideDamage * 0.8);
   diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.025, 0.022, 0.019) + scar * 0.055, parksideChar);
  `);};material.customProgramCacheKey=()=> 'parkside-wreck-16';material.needsUpdate=true;
 }
 u.parksideDamage.value=Math.max(0,Math.min(1,damage));u.parksideChar.value=Math.max(0,Math.min(1,charred));
}
