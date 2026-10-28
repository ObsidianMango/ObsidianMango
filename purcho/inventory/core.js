export const KEY='purcho-inventory-v1';
export const blankStore=()=>({stock:{},targets:{},revision:0,draft:null});
export const fresh=()=>({version:1,activeStore:'LS',stores:{LS:blankStore(),FH:blankStore()},customs:[]});
export function number(value){if(value===''||value===null||value===undefined)return null;const n=Number(value);return Number.isFinite(n)&&n>=0&&n<=9999?Math.round(n*100)/100:null;}
export const stockOf=(s,id)=>number(s.stock[id]);
export const targetOf=(s,id)=>number(s.targets[id])??1;
export function shortage(s,id){const stock=stockOf(s,id),target=targetOf(s,id);return target===0?0:stock===null?null:Math.max(0,Math.ceil(Math.round((target-stock)*100)/100));}
export function stats(s,products){const tracked=products.filter(p=>targetOf(s,p.id)>0);return {total:tracked.length,counted:tracked.filter(p=>stockOf(s,p.id)!==null).length,unknown:tracked.filter(p=>stockOf(s,p.id)===null).length,low:tracked.filter(p=>shortage(s,p.id)>0).length,stocked:tracked.filter(p=>shortage(s,p.id)===0).length,excluded:products.length-tracked.length};}
export function makeDraft(s,products){return {createdAt:new Date().toISOString(),revision:s.revision,edited:false,notes:s.draft?.notes||'',skipped:products.filter(p=>targetOf(s,p.id)>0&&stockOf(s,p.id)===null).length,lines:products.filter(p=>shortage(s,p.id)>0).map(p=>({id:p.id,name:p.name,vendor:p.vendor,qty:shortage(s,p.id),onHand:stockOf(s,p.id),target:targetOf(s,p.id)}))};}
export function normalizeBackup(x){
 if(!x||x.version!==1||!x.stores?.LS||!x.stores?.FH||!Array.isArray(x.customs)||x.customs.length>1000)throw Error('This is not a Purcho Inventory backup.');
 const out=fresh();out.activeStore=x.activeStore==='FH'?'FH':'LS';
 out.customs=x.customs.filter(p=>p&&/^custom-[a-z0-9-]+$/i.test(p.id)&&typeof p.name==='string'&&p.name.trim()&&['quality','soda','bags'].includes(p.vendor)).map(p=>({id:p.id,name:p.name.trim().slice(0,150),vendor:p.vendor,unit:'case'}));
 if(new Set(out.customs.map(p=>p.id)).size!==out.customs.length)throw Error('Backup has duplicate items.');
 for(const code of ['LS','FH']){const old=x.stores[code],s=out.stores[code];for(const key of ['stock','targets']){if(old[key]&&typeof old[key]==='object'){for(const [id,v] of Object.entries(old[key])){if(/^[a-z0-9-]+$/i.test(id)&&number(v)!==null)s[key][id]=number(v);}}}s.revision=Number.isSafeInteger(old.revision)&&old.revision>=0?old.revision:0;
 const d=old.draft;if(d&&Array.isArray(d.lines)&&d.lines.length<=2000){s.draft={createdAt:typeof d.createdAt==='string'&&!Number.isNaN(Date.parse(d.createdAt))?d.createdAt:new Date().toISOString(),revision:Number.isSafeInteger(d.revision)?d.revision:-1,edited:!!d.edited,notes:String(d.notes||'').slice(0,5000),skipped:Number.isSafeInteger(d.skipped)&&d.skipped>0?d.skipped:0,lines:d.lines.filter(p=>p&&typeof p.id==='string'&&/^[a-z0-9-]+$/i.test(p.id)&&typeof p.name==='string'&&['quality','soda','bags'].includes(p.vendor)&&number(p.qty)!==null&&Number(p.qty)>0).map(p=>({id:p.id,name:p.name.slice(0,150),vendor:p.vendor,qty:Math.ceil(number(p.qty)),onHand:number(p.onHand),target:number(p.target)}))};if(new Set(s.draft.lines.map(p=>p.id)).size!==s.draft.lines.length)throw Error('Backup has duplicate order lines.');}}
 return out;
}
