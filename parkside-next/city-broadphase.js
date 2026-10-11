// AABB sweep uses the same Cannon filters/intersection tests. Sorted interval
// bounds are checked before filters, so stationary pairs stop at the interval
// edge instead of scanning the entire remaining city.
export function createCityBroadphase(C,world){
 class CitySweep extends C.SAPBroadphase{
  constructor(world){super(world);this.useBoundingBoxes=true;this.stats={scanned:0,candidates:0};}
  collisionPairs(world,p1,p2){if(this.dirty){this.sortList();this.dirty=false;}const list=this.axisList,axis=['x','y','z'][this.axisIndex];let scanned=0,candidates=0;
   for(let i=0;i<list.length;i++){const a=list[i],end=a.aabb.upperBound[axis];for(let j=i+1;j<list.length;j++){const b=list[j];scanned++;if(b.aabb.lowerBound[axis]>end)break;if(!this.needBroadphaseCollision(a,b))continue;candidates++;this.intersectionTest(a,b,p1,p2);}}
   this.stats={scanned,candidates};
  }
 }
 return new CitySweep(world);
}
