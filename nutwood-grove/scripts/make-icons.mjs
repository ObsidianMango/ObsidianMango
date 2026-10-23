import {createRequire} from 'node:module';
import {readFile,writeFile} from 'node:fs/promises';
const require=createRequire(import.meta.url);
const {createCanvas,loadImage}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/@napi-rs/canvas':'@napi-rs/canvas');
const root=new URL('../',import.meta.url),svg=await readFile(new URL('favicon.svg',root)),image=await loadImage(svg);
for(const [file,size]of[['favicon-16.png',16],['favicon-32.png',32],['apple-touch-icon.png',180],['icon-192.png',192],['icon-512.png',512]]){
 const c=createCanvas(size,size),ctx=c.getContext('2d');ctx.drawImage(image,0,0,size,size);await writeFile(new URL(file,root),c.toBuffer('image/png'));
}
