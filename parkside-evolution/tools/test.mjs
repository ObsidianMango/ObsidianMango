import fs from 'node:fs';import path from 'node:path';import {spawnSync} from 'node:child_process';import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),results=[];
for(const name of fs.readdirSync(path.join(root,'tests')).filter(n=>n.endsWith('.mjs')).sort()){
 const start=performance.now(),r=spawnSync(process.execPath,[path.join(root,'tests',name)],{encoding:'utf8',timeout:120000});
 results.push({test:name,passed:r.status===0,seconds:+((performance.now()-start)/1000).toFixed(3)});
 console.log(`${r.status===0?'PASS':'FAIL'} ${name}`);if(r.status!==0)console.error(r.stdout+r.stderr+(r.error?.message||''));
}
fs.mkdirSync(path.join(root,'test-results'),{recursive:true});fs.writeFileSync(path.join(root,'test-results','automated.json'),JSON.stringify(results,null,2));
console.log(`${results.filter(r=>r.passed).length}/${results.length} passing`);if(results.some(r=>!r.passed))process.exitCode=1;
