import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {pathToFileURL,fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url));
export async function bootGame(){
const require=createRequire(import.meta.url),{parseHTML}=require('/tmp/parkside-test/node_modules/linkedom');
const {window,document}=parseHTML(fs.readFileSync(root+'index.html','utf8'));
const ctx2d=new Proxy({createRadialGradient:()=>({addColorStop(){}}),createLinearGradient:()=>({addColorStop(){}}),measureText:()=>({width:30}),getImageData:(x,y,w,h)=>({data:new Uint8ClampedArray(w*h*4)})},{get:(o,k)=>k in o?o[k]:()=>{},set:(o,k,v)=>{o[k]=v;return true;}});
window.HTMLCanvasElement.prototype.getContext=()=>ctx2d;
window.HTMLCanvasElement.prototype.toDataURL=()=> 'data:image/png;base64,';
window.HTMLElement.prototype.getClientRects=function(){return this.closest('[hidden]')?[]:[{x:0,y:0,width:100,height:44}];};
window.HTMLElement.prototype.getBoundingClientRect=()=>({x:0,y:0,left:0,top:0,right:100,bottom:44,width:100,height:44});
window.HTMLElement.prototype.scrollIntoView=function(){};
window.HTMLElement.prototype.setPointerCapture=function(){};
window.HTMLElement.prototype.getAnimations=()=>[];
window.HTMLElement.prototype.animate=()=>({});
const storage=new Map(),raf=[];
globalThis.document=document;globalThis.window=window;
globalThis.localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,String(v))};
storage.set('parkside-chaos-saves-v1',JSON.stringify(Array.from({length:24},()=>({stars:3,time:1}))));
const T=require(root+'three.min.js');
class Renderer {
 constructor({canvas}){this.domElement=canvas;this.shadowMap={};this.info={render:{calls:0,triangles:0}};}
 setPixelRatio(){}setSize(){}
 render(scene){let calls=0,triangles=0;scene.traverseVisible(o=>{if(!o.isMesh)return;calls++;const n=o.geometry.index?.count||o.geometry.attributes.position?.count||0;triangles+=n/3*(o.isInstancedMesh?o.count:1);});this.info.render={calls,triangles};}
}
window.THREE={...T,WebGLRenderer:Renderer};
let pads=[];
const context={window,document,localStorage,Element:window.Element,navigator:{getGamepads:()=>pads},location:{hostname:'127.0.0.1'},innerWidth:393,innerHeight:852,devicePixelRatio:3,performance:{now:()=>0},requestAnimationFrame:f=>raf.push(f),setTimeout:()=>{},console};
context.addEventListener=window.addEventListener.bind(window);Object.defineProperty(globalThis,'navigator',{value:context.navigator,configurable:true});
let source=fs.readFileSync(root+'drive.js','utf8');
const imports=[...source.matchAll(/^import (.*?) from '(.*?)';$/gm)];
for(const [,declaration,url] of imports){
 const module=await import(pathToFileURL(new URL(url.split('?')[0],pathToFileURL(root+'drive.js')).pathname).href);
 if(declaration.startsWith('* as '))context[declaration.slice(5)]=module;
 else for(const name of declaration.slice(1,-1).split(',').map(s=>s.trim()))context[name]=module[name];
}
source=source.replace(/^import .*?;$/gm,'');
vm.runInNewContext(source,context);
const app=window.roadster,report=[];
assert(app,document.getElementById('errorText').textContent);
const get=id=>document.getElementById(id);
let frameTime=0;function frame(){const f=raf.shift();assert(f);frameTime+=16.667;f(frameTime);}


return {app,document,window,context,storage,frame,get,T,setPads:value=>pads=value};
}
