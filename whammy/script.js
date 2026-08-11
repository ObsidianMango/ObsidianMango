(async()=>{
  const parts=["code/00.txt","code/01.txt","code/02.txt","code/03.txt","code/04.txt","code/05.txt"];
  try{
    let code=(await Promise.all(parts.map(async p=>{
      const r=await fetch(p,{cache:"force-cache"});
      if(!r.ok) throw new Error("Missing game code: "+p);
      return r.text();
    }))).join("");
    code=code.replace(
      /const ART_PARTS = \[[^;]+;/,
      "const ART_PARTS = ['assets/art/00.b64','assets/art/01.b64','assets/art/02.b64','assets/art/03.b64','assets/art/04.b64','assets/art/05.b64','assets/art/06.b64','assets/art/07.b64','assets/art/08.b64','assets/art/09.b64','assets/art/10.b64','assets/art/11.b64'];"
    );
    (new Function(code))();
  }catch(err){
    console.error(err);
    document.body.innerHTML='<main style="max-width:680px;margin:10vh auto;padding:24px;color:white;font-family:system-ui"><h1>Game failed to load</h1><p>Refresh the page and try again.</p></main>';
  }
})();
