export const CONTRACTS=[
 {id:'precision',name:'Precision demolition',reward:450,description:'Flatten the gold building. Keep the green neighbor intact.'},
 {id:'roof',name:'Roof drop',reward:800,description:'Park the marked street car in the gold ring inside the building. Get out, clear the supports, and drop the roof onto it.'},
 {id:'barrel',name:'Barrel shot',reward:350,description:'Launch the marked barrel into the gold building. A nearby explosion alone will not count.'},
 {id:'clearance',name:'Loading-zone clearance',reward:600,description:'Demolish the gold building, then push its two marked furniture piles out of the striped loading zone.'}
];
const structural=b=>b.target.entries.filter(e=>e.role!=='contents'&&!(e.role==='floor'&&e.floorStory===0));
const damage=b=>structural(b).reduce((n,e)=>n+(e.broken?1:e.damage||0),0)/structural(b).length;
const demolished=b=>structural(b).filter(e=>e.broken).length/structural(b).length>=.6;
export function createDemolitionContracts({T,view,economy,notify}){
 let active=null,last=null;
 const geometry=new T.RingGeometry(.91,1,32),materials=[0xffcc68,0x79eda8,0xffac65].map(color=>new T.MeshBasicMaterial({color,side:T.DoubleSide,depthWrite:false}));
 const markers=materials.map(material=>{const mesh=new T.Mesh(geometry,material);mesh.rotation.x=-Math.PI/2;mesh.visible=false;view.group.add(mesh);return mesh;});
 const stripeVertices=[];function rect(x,z,w,d){stripeVertices.push(x-w/2,z-d/2,0,x+w/2,z-d/2,0,x+w/2,z+d/2,0,x-w/2,z-d/2,0,x+w/2,z+d/2,0,x-w/2,z+d/2,0);}
 for(const x of [-.5,.5])rect(x,0,.012,1);for(const z of [-.5,.5])rect(0,z,1,.012);for(let x=-.45;x<=.46;x+=.075){rect(x,-.47,.025,.05);rect(x,.47,.025,.05);}const zoneGeometry=new T.BufferGeometry();zoneGeometry.setAttribute('position',new T.Float32BufferAttribute(stripeVertices,3));
 function candidates(){return view.buildings.filter(b=>b.type!=='garage'&&damage(b)<.05);}
 function setup(type){const buildings=candidates();if(!buildings.length)return null;let b=buildings.find(b=>b.h<=8)||buildings[0],neighbor=null,car=null,barrel=null,drop=null,cores=[];
  if(type==='precision'){neighbor=buildings.filter(n=>n!==b&&n.district===b.district).sort((a,c)=>Math.hypot(a.x-b.x,a.z-b.z)-Math.hypot(c.x-b.x,c.z-b.z))[0];if(!neighbor)return null;}
  if(type==='roof'){b=buildings.find(b=>b.h<=6)||b;const cars=view.targets.filter(t=>t.kind==='car'&&t.car&&!t.car.exploded&&!t.car.occupied&&(t.car.damage||0)<.3);if(!cars.length)return null;const roof=b.target.entries.find(e=>e.roof);const offset=new T.Vector3(-b.w/8,0,-3*(b.d+1)/8).applyQuaternion(new T.Quaternion().copy(roof.turn));drop={x:roof.home.x+offset.x,z:roof.home.z+offset.z};car=cars.sort((a,c)=>Math.hypot(a.car.body.position.x-b.x,a.car.body.position.z-b.z)-Math.hypot(c.car.body.position.x-b.x,c.car.body.position.z-b.z))[0].car;}
  if(type==='barrel'){const barrels=view.targets.filter(t=>t.kind==='barrel'&&!t.entries[0].broken&&!t.entries[0].detonated);if(!barrels.length)return null;let best=Infinity;for(const building of buildings)for(const t of barrels){const e=t.entries[0],dist=Math.hypot(e.body.position.x-building.x,e.body.position.z-building.z);if(dist<best){best=dist;b=building;barrel=e;}}}
  if(type==='clearance'){cores=b.target.entries.filter(e=>e.role==='contents'&&e.floorOwner?.floorStory===0);if(cores.length!==2)return null;}
  return {b,neighbor,car,barrel,drop,cores,neighborBroken:neighbor?structural(neighbor).filter(e=>e.broken).length:0,neighborDamage:neighbor?damage(neighbor):0,hit:false,hold:0,status:'active'};
 }
 function board(){return CONTRACTS.map(c=>({...c,available:!!setup(c.id)}));}
 function accept(type){if(active?.status==='active')return false;const definition=CONTRACTS.find(c=>c.id===type),selection=definition&&setup(type);if(!selection)return false;active={...selection,...definition,awardId:economy.nextContractId()};last=null;refreshMarkers();notify(definition.name+' · $'+definition.reward,2);return true;}
 function cancel(){active=null;hide();}
 function hide(){for(const mesh of markers)mesh.visible=false;}
 function finish(success,message){if(!active||active.status!=='active')return;active.status=success?'complete':'failed';last={id:active.id,name:active.name,status:active.status,reward:success?active.reward:0,message};if(success)economy.awardContract(active.awardId,active.reward);notify(message+(success?' · +$'+active.reward:''),3);hide();}
 function contact(entry,other,speed,impactBody=entry.body){if(!active||active.status!=='active'||speed<1.2)return;const a=active;if(a.id==='roof'&&entry.roof&&entry.broken&&a.b.target.entries.includes(entry)&&other===a.car.body&&impactBody.position.y>other.position.y+.5)a.hit=true;if(a.id==='barrel'&&entry===a.barrel&&entry.armed&&entry.launchPosition&&entry.body.position.distanceTo(entry.launchPosition)>1.5&&a.b.target.entries.some(e=>e.body===other))a.hit=true;}
 function zone(){const b=active.b;return {x:b.x,z:b.z,w:b.w,d:b.d};}
 function uncleared(){const z=zone();return active.cores.filter(e=>{if(!e.broken)return true;e.body.updateAABB();const a=e.body.aabb;return a.upperBound.x>z.x-z.w/2&&a.lowerBound.x<z.x+z.w/2&&a.upperBound.z>z.z-z.d/2&&a.lowerBound.z<z.z+z.d/2;});}
 function update(dt){if(!active||active.status!=='active')return;const a=active;if(a.id==='precision'){if(damage(a.neighbor)-a.neighborDamage>.1||structural(a.neighbor).filter(e=>e.broken).length>a.neighborBroken){finish(false,'Neighbor damaged · contract failed');return;}if(demolished(a.b))finish(true,'Precision demolition complete');}
  else if(a.id==='roof'){if(a.hit)finish(true,'Roof landed on the marked car');else if(a.car.exploded||a.car.damage>.8)finish(false,'Marked car destroyed before a roof hit');}
  else if(a.id==='barrel'){if(a.hit)finish(true,'Barrel shot connected');else if(a.barrel.detonated)finish(false,'Barrel missed · contract failed');}
  else if(a.id==='clearance'){a.hold=demolished(a.b)&&!uncleared().length?a.hold+dt:0;if(a.hold>=2)finish(true,'Loading zone cleared');}refreshMarkers();
 }
 function point(body){return {x:body.position.x-view.ox,z:body.position.z};}
 function getInfo(){if(!active)return {active:false,last};const a=active,b=a.b;let title=a.name,step='',target={x:b.x-view.ox,z:b.z,name:b.name};
  if(a.id==='precision')step='Demolish '+b.name+' · preserve '+a.neighbor.name;
  if(a.id==='roof'){const p=a.car.body.position,inside=Math.abs(p.x-b.x)<b.w/2&&Math.abs(p.z-b.z)<b.d/2,aligned=Math.hypot(p.x-a.drop.x,p.z-a.drop.z)<2;step=aligned?'Get out · remove supports above the gold ring':inside?'Park marked car in the gold ring · then get out':'Drive marked car to the gold ring inside '+b.name;target=inside?{x:a.drop.x-view.ox,z:a.drop.z,name:'Roof drop zone'}:{...point(a.car.body),name:'Marked street car'};}
  if(a.id==='barrel'){step='Launch marked barrel into '+b.name;target={...point(a.barrel.body),name:'Marked barrel'};}
  if(a.id==='clearance'){markers[0].geometry=zoneGeometry;markers[0].scale.set(a.b.w,a.b.d,1);const remaining=uncleared();step=demolished(b)?remaining.length+' furniture piles in loading zone · push outside stripes':'Demolish '+b.name+' · then clear striped zone';if(demolished(b)&&remaining[0])target={...point(remaining[0].body),name:'Furniture pile'};}
  return {active:a.status==='active',id:a.id,title,step,target,status:a.status,reward:a.reward,last,buildingId:b.id,neighborId:a.neighbor?.id,carTargetId:view.targets.find(t=>t.car===a.car)?.id,barrelTargetId:a.barrel?.target.id,markerCount:markers.length};
 }
 function refreshMarkers(){hide();if(!active||active.status!=='active')return;const a=active;function mark(i,x,z,r){markers[i].geometry=geometry;markers[i].visible=true;markers[i].position.set(x,.18+i*.01,z);markers[i].scale.set(r,r,1);}mark(0,a.drop?.x||a.b.x,a.drop?.z||a.b.z,a.drop?2.7:Math.max(a.b.w,a.b.d)*.74);if(a.neighbor)mark(1,a.neighbor.x,a.neighbor.z,Math.max(a.neighbor.w,a.neighbor.d)*.74);if(a.car)mark(1,a.car.body.position.x,a.car.body.position.z,3);if(a.barrel)mark(2,a.barrel.body.position.x,a.barrel.body.position.z,1.7);if(a.id==='clearance'){markers[0].geometry=zoneGeometry;markers[0].scale.set(a.b.w,a.b.d,1);const remaining=uncleared();for(let i=0;i<Math.min(2,remaining.length);i++)mark(i+1,remaining[i].body.position.x,remaining[i].body.position.z,1.5);}}
 function protectedPositions(){if(!active||active.status!=='active')return [];const a=active;return [{x:a.b.x,z:a.b.z},...(a.neighbor?[{x:a.neighbor.x,z:a.neighbor.z}]:[]),...(a.car?[a.car.body.position]:[]),...(a.barrel?[a.barrel.body.position]:[])];}
 return {accept,cancel,board,update,contact,getInfo,protectedPositions,reset(){active=last=null;hide();}};
}
