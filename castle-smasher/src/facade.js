import * as T from '../vendor/three.module.js';
function boxes(parts){const positions=[],normals=[];for(const[x,y,z,w,h,d]of parts){const g=new T.BoxGeometry(w,h,d).toNonIndexed();g.translate(x,y,z);positions.push(...g.attributes.position.array);normals.push(...g.attributes.normal.array);g.dispose();}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('normal',new T.Float32BufferAttribute(normals,3));return g;}
export function addFacadePools(sim){
 const items=sim.entities.filter(e=>e.b?.facade);if(!items.length)return;
 const glass=[],ribs=[];for(const z of[-.52,.52]){glass.push([0,0,z,.94,.96,.035]);for(let i=0;i<7;i++)ribs.push([(i-3)*.15,0,z*1.05,.035,.99,.045]);for(const y of[-.33,0,.33])ribs.push([0,y,z*1.055,.94,.018,.035]);}
 for(const[parts,color]of[[glass,0x263a46],[ribs,0xe3e7e5]]){const pool=new T.InstancedMesh(boxes(parts),new T.MeshStandardMaterial({color,metalness:.4,roughness:.5}),items.length);pool.castShadow=true;pool.frustumCulled=false;sim.view.objects.add(pool);sim.pools.push({pool,items,decor:true});}
 const bands=items.filter(e=>e.b.band);const parts=[];for(const z of[-.56,.56])parts.push([0,0,z,.98,.28,.025]);const pool=new T.InstancedMesh(boxes(parts),new T.MeshStandardMaterial({color:0x617078}),bands.length);pool.frustumCulled=false;sim.view.objects.add(pool);sim.pools.push({pool,items:bands,decor:true});
}
