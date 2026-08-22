const CACHE_NAME='mangowarz-classic-v6';
const SHELL=[
  './','./index.html','./manifest.webmanifest','./assets/asset-manifest.json',
  './css/reset.css','./css/tokens.css','./css/layout.css','./css/components.css','./css/polish.css?v=5','./css/animations.css','./css/accessibility.css','./css/crowd.css',
  './js/main.js?v=6','./js/config.js','./js/state.js','./js/rng.js','./js/utils.js','./js/market.js','./js/trading.js','./js/travel.js','./js/encounters.js','./js/combat.js','./js/finance.js','./js/scoring.js','./js/persistence.js','./js/audio.js','./js/haptics.js','./js/renderer.js','./js/modal-manager.js?v=5','./js/asset-loader.js','./js/accessibility.js'
];

self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE_NAME);
    await cache.addAll(SHELL);
    try{
      const response=await fetch('./assets/asset-manifest.json');
      const manifest=await response.json();
      const paths=[...new Set(manifest.assets.map(asset=>`./${asset.path}`))];
      await Promise.allSettled(paths.map(path=>cache.add(path)));
    }catch(error){console.warn('Optional asset precache incomplete:',error);}
    await self.skipWaiting();
  })());
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const names=await caches.keys();
    await Promise.all(names.filter(name=>name.startsWith('mangowarz-classic-')&&name!==CACHE_NAME).map(name=>caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin)return;
  if(event.request.mode==='navigate'){
    event.respondWith(fetch(event.request).then(response=>{const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put('./index.html',copy));return response;}).catch(()=>caches.match('./index.html')));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy));}return response;})));
});
