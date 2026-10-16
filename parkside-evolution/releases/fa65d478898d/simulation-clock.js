// Fixed 60 Hz simulation, bounded catch-up, interpolation and explicit reset.
export function createSimulationClock(step=1/60,maxSteps=3){
 let accumulator=0,dropped=0,totalSteps=0;
 return {advance(dt,simulate,capture,canContinue=()=>true){accumulator+=Math.max(0,Math.min(dt,.1));let n=0;while(accumulator+1e-9>=step&&n<maxSteps){accumulator=Math.max(0,accumulator-step);simulate(step);capture();n++;totalSteps++;if(!canContinue())break;}if(accumulator>=step){const discard=Math.floor(accumulator/step)*step;dropped+=discard;accumulator-=discard;}return Math.min(1,accumulator/step);},reset(){accumulator=0;},getInfo:()=>({step,maxSteps,totalSteps,droppedSeconds:dropped,accumulator})};
}
