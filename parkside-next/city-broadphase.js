// Query overlapping intervals only for awake/kinematic bodies. Static/sleeping
// pairs cannot collide, so a large settled rubble pile never scans itself.
export function createCityBroadphase(C,world){
 class CitySweep extends C.SAPBroadphase{
  constructor(world){super(world);this.useBoundingBoxes=true;this.stats={scanned:0,candidates:0};this.finite=[];this.wide=[];this.awake=[];this.upper=[];this.rank=[];this.keys=[];}
  collisionPairs(world,p1,p2){
   if(this.dirty){this.sortList();this.dirty=false;}
   const axis=['x','y','z'][this.axisIndex],finite=this.finite,wide=this.wide,awake=this.awake,upper=this.upper;finite.length=wide.length=awake.length=upper.length=0;
   const passive=b=>!!(b.type&C.Body.STATIC)||b.sleepState===C.Body.SLEEPING;
   let high=-Infinity;const rank=this.rank,keys=this.keys,n=this.axisList.length;keys.length=0;for(let i=0;i<n;i++)rank[this.axisList[i].id]=i;
   for(const body of this.axisList){if(!passive(body))awake.push(body);const lo=body.aabb.lowerBound[axis],hi=body.aabb.upperBound[axis];if(!Number.isFinite(lo)||!Number.isFinite(hi)||hi-lo>100)wide.push(body);else{finite.push(body);high=Math.max(high,hi);upper.push(high);}}
   let scanned=0,candidates=0;
   const check=(a,b)=>{if(a===b||!passive(b)&&b.id<a.id)return;scanned++;if(!this.needBroadphaseCollision(a,b))return;candidates++;const i=rank[a.id],j=rank[b.id];keys.push(Math.min(i,j)*n+Math.max(i,j));};
   for(const a of awake){const lo=a.aabb.lowerBound[axis],hi=a.aabb.upperBound[axis];let left=0,right=upper.length;while(left<right){const mid=(left+right)>>1;if(upper[mid]<lo)left=mid+1;else right=mid;}
    for(let j=left;j<finite.length&&finite[j].aabb.lowerBound[axis]<=hi;j++)if(finite[j].aabb.upperBound[axis]>=lo)check(a,finite[j]);
    for(const b of wide)if(b.aabb.lowerBound[axis]<=hi&&b.aabb.upperBound[axis]>=lo)check(a,b);
   }
   keys.sort((a,b)=>a-b);for(const key of keys)this.intersectionTest(this.axisList[Math.floor(key/n)],this.axisList[key%n],p1,p2);
   this.stats={scanned,candidates,awake:awake.length,passive:this.axisList.length-awake.length};
  }
 }
 return new CitySweep(world);
}
