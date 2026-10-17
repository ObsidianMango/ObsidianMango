// Track actual contacts, not a body-count-squared array. Body IDs remain stable
// when debris is recycled; index-based matrices do not have that property.
export function installSparseContactTracking(C,world){
 world.collisionMatrix=new C.ObjectCollisionMatrix();world.collisionMatrixPrevious=new C.ObjectCollisionMatrix();
 for(const [keeper,begin,end] of [[world.bodyOverlapKeeper,'beginContact','endContact'],[world.shapeOverlapKeeper,'beginShapeContact','endShapeContact']]){
  const record=keeper.set;
  keeper.set=function(i,j){if(world.hasAnyEventListener(begin)||world.hasAnyEventListener(end))record.call(this,i,j);};
 }
}
