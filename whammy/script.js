(async()=>{
  const parts=["code/00.txt","code/01.txt","code/02.txt","code/03.txt","code/04.txt","code/05.txt"];
  const ART_DECL="const ART_PARTS = ['assets/art/00.b64','assets/art/01.b64','assets/art/02.b64','assets/art/03.b64','assets/art/04.b64','assets/art/05.b64','assets/art/06.b64','assets/art/07.b64','assets/art/08.b64','assets/art/09.b64','assets/art/10.b64','assets/art/11.b64'];";
  try{
    const responses=await Promise.all(parts.map(async p=>{
      const r=await fetch(p,{cache:"no-cache"});
      if(!r.ok) throw new Error(`Missing game code: ${p} (${r.status})`);
      return r.text();
    }));
    let code=responses.join("");
    code=code.replace(/const ART_PARTS\s*=\s*\[[\s\S]*?\];/,ART_DECL);
    if(!code.includes(ART_DECL)) throw new Error("Could not configure art pack");

    // Do not use eval/new Function here. Some mobile browsers and hosted-page
    // security policies reject dynamic evaluation. A Blob-backed script behaves
    // like a normal external JS file and preserves the complete joined source.
    const blob=new Blob([code],{type:"text/javascript"});
    const url=URL.createObjectURL(blob);
    await new Promise((resolve,reject)=>{
      const s=document.createElement("script");
      s.src=url;
      s.async=false;
      s.onload=resolve;
      s.onerror=()=>reject(new Error("Browser rejected the assembled game script"));
      document.head.appendChild(s);
    });
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  }catch(err){
    console.error("WHAMMY loader:",err);
    document.body.innerHTML=`<main style="max-width:720px;margin:10vh auto;padding:24px;color:white;font-family:system-ui;background:#14051e;border:2px solid #ffd447;border-radius:18px"><h1 style="color:#ffd447">Game failed to load</h1><p>${String(err.message||err)}</p><button onclick="location.reload(true)" style="font:700 18px system-ui;padding:12px 18px;border:0;border-radius:10px;background:#e31b23;color:white">TRY AGAIN</button></main>`;
  }
})();
