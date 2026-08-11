(async()=>{
  const parts=['code/00.txt','code/01.txt','code/02.txt'];
  try{
    const code=(await Promise.all(parts.map(async p=>{const r=await fetch(p,{cache:'force-cache'});if(!r.ok)throw new Error('Missing game code: '+p);return r.text()}))).join('');
    (new Function(code))();
  }catch(err){console.error(err);document.body.innerHTML='<main style="max-width:680px;margin:10vh auto;padding:24px;color:white;font-family:system-ui"><h1>Game failed to load</h1><p>Refresh the page and try again.</p></main>'}
})();
