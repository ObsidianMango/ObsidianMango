// Minimal portable byte writer shared by the browser and offline model checks.
export class ByteBuffer extends Uint8Array{
 static alloc(size,fill=0){const b=new ByteBuffer(size);if(fill)b.fill(fill);return b}
 static from(value,offset=0,length){
  if(typeof value==='string'){
   if(offset==='base64'){const text=atob(value),out=new ByteBuffer(text.length);for(let i=0;i<text.length;i++)out[i]=text.charCodeAt(i);return out}
   return new ByteBuffer(new TextEncoder().encode(value));
  }
  if(value instanceof ArrayBuffer)return new ByteBuffer(value,offset,length);
  return new ByteBuffer(value);
 }
 static concat(parts){const out=new ByteBuffer(parts.reduce((n,p)=>n+p.length,0));let at=0;for(const part of parts){out.set(part,at);at+=part.length}return out}
 writeUInt32LE(value,offset){new DataView(this.buffer,this.byteOffset,this.byteLength).setUint32(offset,value,true)}
 readUInt32LE(offset){return new DataView(this.buffer,this.byteOffset,this.byteLength).getUint32(offset,true)}
 copy(target,offset=0){target.set(this,offset)}
}
