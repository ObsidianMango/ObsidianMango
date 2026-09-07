import * as THREE from './vendor/three.module.js';
import {DOUGHS,ICINGS,TOPPING_COLORS} from './recipes.js';
import {TAU,rng,noise,boundary,area,contains,circle,star,difference,intersection,scaled,layerGeometry,distanceToRings} from './geometry.js';

const _dummy=new THREE.Object3D();const WHITE=new THREE.Color('#ffffff');
const shaderNoise=`
varying vec3 vCookiePosition;
float chash(vec3 p){p=fract(p*.3183099+vec3(.13,.71,.31));p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float cnoise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(chash(i),chash(i+vec3(1,0,0)),f.x),mix(chash(i+vec3(0,1,0)),chash(i+vec3(1,1,0)),f.x),f.y),mix(mix(chash(i+vec3(0,0,1)),chash(i+vec3(1,0,1)),f.x),mix(chash(i+vec3(0,1,1)),chash(i+vec3(1,1,1)),f.x),f.y),f.z);}
`;
function texturedMaterial(crumb=false){
  const m=new THREE.MeshStandardMaterial({vertexColors:true,roughness:crumb?1:.87,metalness:0});
  m.onBeforeCompile=s=>{
    s.vertexShader='varying vec3 vCookiePosition;\n'+s.vertexShader;
    s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvCookiePosition=position;');
    s.fragmentShader=shaderNoise+s.fragmentShader;
    s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      float coarse=cnoise(vCookiePosition*${crumb?'34.':'19.'});
      float fine=cnoise(vCookiePosition*135.);
      float pores=smoothstep(.63,.83,cnoise(vCookiePosition*${crumb?'65.':'90.'}));
      diffuseColor.rgb*=.87+coarse*.19+fine*.08-pores*${crumb?'.29':'.15'};
    `);
    s.fragmentShader=s.fragmentShader.replace('#include <normal_fragment_begin>',`#include <normal_fragment_begin>
      float relief=cnoise(vCookiePosition*44.)*.014+cnoise(vCookiePosition*132.)*.004-smoothstep(.64,.84,cnoise(vCookiePosition*83.))*.009;
      vec3 qx=dFdx(-vViewPosition),qy=dFdy(-vViewPosition);
      vec3 rx=cross(qy,normal),ry=cross(normal,qx);
      float det=dot(qx,rx);
      normal=normalize(abs(det)*normal-sign(det)*(dFdx(relief)*rx+dFdy(relief)*ry));
    `);
  };m.customProgramCacheKey=()=>crumb?'crumb-v1':'cookie-v1';return m;
}
export const geometryFor={
  pearls:new THREE.SphereGeometry(1,9,6),jimmies:new THREE.CapsuleGeometry(.21,.72,3,5),chips:new THREE.DodecahedronGeometry(1,0),whitechips:new THREE.DodecahedronGeometry(1,0),candy:new THREE.SphereGeometry(1,10,6),nuts:new THREE.DodecahedronGeometry(1,0),pistachio:new THREE.DodecahedronGeometry(1,0),oats:new THREE.SphereGeometry(1,7,4),raisins:new THREE.SphereGeometry(1,8,5),coconut:new THREE.CapsuleGeometry(.12,.8,2,4),sugar:new THREE.OctahedronGeometry(1,0),cinnamon:new THREE.OctahedronGeometry(1,0),marshmallow:new THREE.CapsuleGeometry(.68,.5,3,7),crumb:new THREE.DodecahedronGeometry(1,0)
};
export function toppingSpec(type,random){
  const color=new THREE.Color((TOPPING_COLORS[type]||TOPPING_COLORS.pearls)[Math.floor(random()*(TOPPING_COLORS[type]||TOPPING_COLORS.pearls).length)]);
  const size=(.8+random()*.45);let scale,raise;
  switch(type){
    case 'pearls':scale=new THREE.Vector3(.031,.030,.031).multiplyScalar(size);raise=scale.y*.70;break;
    case 'jimmies':scale=new THREE.Vector3(.084,.094,.084).multiplyScalar(size);raise=.02;break;
    case 'chips':case 'whitechips':scale=new THREE.Vector3(.075,.059,.078).multiplyScalar(size);raise=.022;break;
    case 'candy':scale=new THREE.Vector3(.088,.036,.071).multiplyScalar(size);raise=.018;break;
    case 'nuts':case 'pistachio':scale=new THREE.Vector3(.045,.028,.039).multiplyScalar(size);raise=.019;break;
    case 'oats':scale=new THREE.Vector3(.064,.010,.026).multiplyScalar(size);raise=.007;break;
    case 'raisins':scale=new THREE.Vector3(.068,.042,.047).multiplyScalar(size);raise=.024;break;
    case 'coconut':scale=new THREE.Vector3(.060,.102,.062).multiplyScalar(size);raise=.012;break;
    case 'sugar':case 'cinnamon':scale=new THREE.Vector3(.014,.014,.015).multiplyScalar(size);raise=.006;break;
    case 'marshmallow':scale=new THREE.Vector3(.13,.14,.13).multiplyScalar(size);raise=.085;break;
    default:scale=new THREE.Vector3(.025,.025,.025);raise=.02;
  }
  const rotation=new THREE.Euler(type==='jimmies'||type==='coconut'?Math.PI/2+random()*.4:(random()-.5)*.7,random()*TAU,(random()-.5)*.45);
  return {type,color,scale,raise,quaternion:new THREE.Quaternion().setFromEuler(rotation)};
}
export function toppingMaterial(type){return new THREE.MeshStandardMaterial({color:0xffffff,roughness:['candy','pearls'].includes(type)?.3:['chips','whitechips'].includes(type)?.48:.86,metalness:0});}

export class Cookie {
  constructor(recipe,seed=10,{preview=false}={}){
    this.recipe={...recipe};this.seed=seed;this.random=rng(seed);this.preview=preview;this.group=new THREE.Group();this.body=new THREE.Group();this.group.add(this.body);this.batches=new Map();this.original=boundary(recipe,seed);this.polygons=structuredClone(this.original);this.originalArea=area(this.original);this.bites=0;this.height=recipe.thickness;this.materials=[texturedMaterial(),texturedMaterial(true)];this.extraMaterials=[];this.records=[];this.bounds=new THREE.Box2();for(const p of this.original[0][0])this.bounds.expandByPoint(new THREE.Vector2(...p));
    this.palette=DOUGHS[recipe.dough]||DOUGHS.butter;this.baseColor=new THREE.Color(this.palette.color);this.edgeColor=new THREE.Color(this.palette.edge);this.crumbColor=new THREE.Color(this.palette.crumb);this.baseColor.lerp(this.edgeColor,Math.max(0,(recipe.bake-48)/150));this.baseColor.lerp(new THREE.Color('#f5d99a'),Math.max(0,(40-recipe.bake)/240));
    this.topPolygons=this.polygons;this.rebuild();
    this.populate(recipe.topping,recipe.amount||0);
    if(recipe.extra)this.populate(recipe.extra.type,recipe.extra.amount);
    if(recipe.drizzle)this.drizzle(recipe.drizzle);
    this.syncToppings();
  }
  get remaining(){return Math.max(0,Math.min(1,area(this.polygons)/this.originalArea));}
  get toppingCount(){return this.records.filter(r=>r.attached&&!r.drizzle).length;}
  contains(x,z){return contains(this.polygons,x,z);}
  supports(x,z){return contains(this.topPolygons,x,z);}
  edgeDistance(x,z){return distanceToRings(this.original,x,z);}
  baseHeight(x,z){
    const r=this.recipe,dist=this.edgeDistance(x,z);let h=r.thickness-.06*Math.exp(-dist/.08);
    h+=noise(x,z,this.seed)*.018*(r.rough?2:1);
    if(r.dome)h=.27+r.thickness*.70*Math.pow(Math.max(0,1-(Math.hypot(x,z)/1.67)**2),.65);
    if(r.pattern==='crosshatch'){
      const stripe=(v)=>Math.exp(-Math.pow(Math.sin(v*9.2)/.21,2));h-=.027*(stripe(x)+stripe(z))*Math.max(0,1-(Math.hypot(x,z)/1.5)**8);
    }
    if(r.pattern==='dimples'){
      for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++)h-=.025*Math.exp(-((x-i*.52)**2+(z-j*.52)**2)/.004);
    }
    if(r.pattern==='emboss')h+=.009*Math.cos(x*19)*Math.cos(z*19)+.022*Math.exp(-Math.pow((Math.hypot(x,z)-1.32)/.025,2));
    if(r.pattern==='crinkle')h-=.016*Math.exp(-Math.pow((Math.sin(x*6+Math.sin(z*5))+.6*Math.cos(z*9))/.15,2));
    if(r.jam)h-=.16*Math.exp(-(x*x+z*z)/.20);
    return Math.max(.09,h);
  }
  surface(x,z){
    if(this.recipe.window&&Math.hypot(x,z)<.40)return this.height*.52;
    const h=this.baseHeight(x,z);return h+(this.recipe.icing!=='none'&&contains(this.icingPolygons||[],x,z)?.065:0)+(this.recipe.jam&&Math.hypot(x,z)<.43?.025:0);
  }
  colorAt(x,z,kind){
    if(kind==='crumb')return this.crumbColor.clone().multiplyScalar(.97+noise(x*1.2,z*1.2,this.seed)*.1);
    const edge=this.edgeDistance(x,z),n=noise(x,z,this.seed),c=this.baseColor.clone();
    let brown=kind==='bottom'?.42:kind==='edge'?.23+Math.abs(n)*.20:.28*Math.exp(-edge/.15)+Math.max(0,n)*.23;
    if(this.recipe.powder&&kind==='top'){
      const crack=Math.abs(Math.sin(x*6+Math.sin(z*5))+.6*Math.cos(z*9));
      if(crack>.24)c.lerp(new THREE.Color('#f7eedb'),Math.min(.96,(crack-.24)*3));
    }
    return c.lerp(this.edgeColor,Math.min(.65,brown)).multiplyScalar(1+n*.04);
  }
  makeLayer(polys,bottom,top,material=this.materials,color=null,crumb=true){
    if(!polys.length)return;
    const g=layerGeometry(polys,bottom,top,color?()=>color:(x,z,k)=>this.colorAt(x,z,k),this.original,{detail:this.preview?1:3,crumb});
    const mesh=new THREE.Mesh(g,material);mesh.castShadow=true;mesh.receiveShadow=true;this.body.add(mesh);return mesh;
  }
  icingMat(color,extra={}){const m=new THREE.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:.38,metalness:0,...extra});this.extraMaterials.push(m);return m;}
  rebuild(){
    for(const child of [...this.body.children]){child.geometry.dispose();this.body.remove(child);}for(const m of this.extraMaterials)m.dispose();this.extraMaterials=[];
    const r=this.recipe;this.topPolygons=this.polygons;
    if(r.window)this.topPolygons=difference(this.polygons,[[star(0,0,.56)]]);
    if(r.sandwich){
      this.makeLayer(this.polygons,()=>0,(x,z)=>.29*this.height+noise(x,z,this.seed)*.005);
      const fillColor=new THREE.Color(r.sandwich==='jam'?'#a52539':ICINGS[r.sandwich]);
      const fill=this.icingMat(fillColor,{roughness:r.sandwich==='jam'?.23:.62});
      const filling=intersection(this.polygons,scaled(this.original,.955));
      this.makeLayer(filling,()=>this.height*.27,()=>this.height*.62,[fill,fill],fillColor,false);
      this.makeLayer(this.topPolygons,()=>this.height*.57,(x,z)=>this.baseHeight(x,z));
    }else this.makeLayer(this.polygons,()=>.004,(x,z)=>this.baseHeight(x,z));
    this.icingPolygons=[];
    if(r.icing!=='none'){
      this.icingPolygons=intersection(this.topPolygons,scaled(this.original,.925));
      const m=this.icingMat(new THREE.Color(ICINGS[r.icing]||'#fff0d3'));
      const color=r.icing==='whiteblack'?(x)=>new THREE.Color(x>0?'#45251c':'#fff2db'):()=>new THREE.Color(ICINGS[r.icing]||'#fff0d3');
      if(this.icingPolygons.length){const geom=layerGeometry(this.icingPolygons,(x,z)=>this.baseHeight(x,z)-.005,(x,z)=>this.baseHeight(x,z)+.06,color,this.original,{detail:this.preview?1:3,crumb:false});const mesh=new THREE.Mesh(geom,[m,m]);mesh.castShadow=true;mesh.receiveShadow=true;this.body.add(mesh);}
    }
    if(r.jam){const jamPolys=intersection(this.polygons,[[circle(0,0,.46)]]),color=new THREE.Color('#bc2948'),m=this.icingMat(color,{roughness:.18});this.makeLayer(jamPolys,(x,z)=>this.baseHeight(x,z),(x,z)=>this.baseHeight(x,z)+.04,[m,m],color,false);}
  }
  randomPoint(type='pearls'){
    for(let t=0;t<200;t++){
      const x=THREE.MathUtils.lerp(this.bounds.min.x,this.bounds.max.x,this.random()),z=THREE.MathUtils.lerp(this.bounds.min.y,this.bounds.max.y,this.random());
      if(!this.supports(x,z)||this.edgeDistance(x,z)<.05)continue;
      if(this.recipe.jam&&Math.hypot(x,z)<.49)continue;
      if(this.recipe.powder&&type==='sugar'&&Math.abs(Math.sin(x*6+Math.sin(z*5))+.6*Math.cos(z*9))<.23)continue;
      return {x,z};
    }return null;
  }
  populate(type,count){
    if(!type||type==='none')return;const total=this.preview?Math.min(count,180):count;const grid=new Map();
    const spacing=['chips','whitechips','candy','raisins','marshmallow'].includes(type)?(type==='marshmallow'?.23:.13):type==='pearls'?.039:0;
    for(let i=0;i<total;i++){
      let p;for(let t=0;t<18;t++){p=this.randomPoint(type);if(!p)break;if(!spacing)break;const key=Math.round(p.x/spacing)+','+Math.round(p.z/spacing);if(!grid.has(key)){grid.set(key,true);break;}if(t===17)p=null;}
      if(!p)continue;const spec=toppingSpec(type,this.random);this.records.push({...spec,position:new THREE.Vector3(p.x,this.surface(p.x,p.z)+spec.raise,p.z),attached:true});
    }
  }
  drizzle(flavor){
    const color=new THREE.Color(ICINGS[flavor]||ICINGS.chocolate);
    for(let s=-1;s<=1;s+=.4)for(let z=-1.45;z<1.45;z+=.044){const x=s+.13*Math.sin(z*4+s);if(!this.supports(x,z)||this.edgeDistance(x,z)<.12)continue;this.records.push({type:'pearls',drizzle:true,color,position:new THREE.Vector3(x,this.surface(x,z)+.015,z),scale:new THREE.Vector3(.029,.027,.036),quaternion:new THREE.Quaternion(),raise:.015,attached:true});}
  }
  syncToppings(){
    const types=new Set(this.records.map(r=>r.type));
    for(const type of types){
      const records=this.records.filter(r=>r.type===type);let batch=this.batches.get(type);
      if(!batch||batch.capacity<records.length){
        if(batch){this.group.remove(batch.mesh);batch.mesh.dispose();batch.mesh.material.dispose();}
        const capacity=Math.max(records.length+100,256),mesh=new THREE.InstancedMesh(geometryFor[type],toppingMaterial(type),capacity);mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);mesh.castShadow=true;mesh.receiveShadow=true;mesh.frustumCulled=false;batch={mesh,capacity};this.batches.set(type,batch);this.group.add(mesh);
      }
      batch.mesh.count=records.length;
      records.forEach((r,i)=>{r.instance=i;_dummy.position.copy(r.position);_dummy.quaternion.copy(r.quaternion);_dummy.scale.copy(r.scale);if(!r.attached)_dummy.scale.setScalar(0);_dummy.updateMatrix();batch.mesh.setMatrixAt(i,_dummy.matrix);batch.mesh.setColorAt(i,r.color);});
      batch.mesh.instanceMatrix.needsUpdate=true;if(batch.mesh.instanceColor)batch.mesh.instanceColor.needsUpdate=true;
    }
  }
  addTopping(record){record.attached=true;this.records.push(record);}
  bite(x,z,radius=.74){
    if(!this.polygons.length)return null;const before=area(this.polygons),biteShape=circle(x,z,radius,90,true);const cut=difference(this.polygons,[[biteShape]]);const after=area(cut);if(before-after<.0001)return null;
    this.polygons=after/this.originalArea<.012?[]:cut;this.bites++;
    const detached=[];for(const record of this.records){if(record.attached&&!this.contains(record.position.x,record.position.z)){record.attached=false;if(!record.drizzle)detached.push(record);}}
    this.rebuild();this.syncToppings();return {removed:before-area(this.polygons),detached,x,z,radius};
  }
  autoBite(direction){
    if(!this.polygons.length)return null;const d=direction.clone().normalize();let best=null,score=-Infinity;
    for(const poly of this.polygons)for(const p of poly[0]){const dot=p[0]*d.x+p[1]*d.y,perp=Math.abs(p[0]*d.y-p[1]*d.x),s=dot-perp*.55;if(s>score){score=s;best=p;}}
    if(!best)return null;return this.bite(best[0]+d.x*.04,best[1]+d.y*.04,.76);
  }
  dispose(){
    for(const child of this.body.children)child.geometry.dispose();for(const mat of [...this.materials,...this.extraMaterials])mat.dispose();for(const batch of this.batches.values()){batch.mesh.dispose();batch.mesh.material.dispose();}this.group.clear();
  }
}
