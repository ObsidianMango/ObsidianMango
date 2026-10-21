// Separate edition writes; copy legacy values once on first read. Never delete originals.
export function createProgressStorage(source,namespace='parkside-evolution:v1:'){
 return {getItem(key){try{const own=source.getItem(namespace+key);if(own!==null)return own;const legacy=source.getItem(key);if(legacy!==null)source.setItem(namespace+key,legacy);return legacy;}catch{return null;}},setItem(key,value){source.setItem(namespace+key,String(value));},removeItem(key){source.removeItem(namespace+key);}};
}
export const progressStorage=createProgressStorage({getItem:key=>globalThis.localStorage.getItem(key),setItem:(key,value)=>globalThis.localStorage.setItem(key,value),removeItem:key=>globalThis.localStorage.removeItem(key)});
