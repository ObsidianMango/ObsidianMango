const CACHE_NAME='mangowarz-classic-v13';
const SHELL=[
  './','./index.html','./manifest.webmanifest','./assets/asset-manifest.json?v=2',
  './css/reset.css','./css/tokens.css','./css/layout.css','./css/components.css','./css/polish.css?v=8','./css/animations.css','./css/accessibility.css','./css/crowd.css','./css/classic.css?v=3',
  './js/main.js?v=12','./js/config.js?v=8','./js/state.js','./js/rng.js','./js/utils.js','./js/market.js','./js/trading.js','./js/travel.js','./js/encounters.js','./js/combat.js','./js/finance.js','./js/scoring.js','./js/persistence.js','./js/audio.js','./js/haptics.js','./js/renderer.js?v=12','./js/modal-manager.js?v=5','./js/asset-loader.js?v=2','./js/accessibility.js',
  './assets/classic-ui/asset-manifest.json','./assets/classic-ui/title-city.svg','./assets/classic-ui/subway-map.svg',
  './assets/classic-ui/locations/bronx.svg','./assets/classic-ui/locations/ghetto.svg','./assets/classic-ui/locations/central-park.svg','./assets/classic-ui/locations/manhattan.svg','./assets/classic-ui/locations/coney-island.svg','./assets/classic-ui/locations/brooklyn.svg',
  './assets/classic-ui/products/acid.svg','./assets/classic-ui/products/cocaine.svg','./assets/classic-ui/products/hashish.svg','./assets/classic-ui/products/heroin.svg','./assets/classic-ui/products/ludes.svg','./assets/classic-ui/products/mda.svg','./assets/classic-ui/products/opium.svg','./assets/classic-ui/products/pcp.svg','./assets/classic-ui/products/peyote.svg','./assets/classic-ui/products/shrooms.svg','./assets/classic-ui/products/speed.svg','./assets/classic-ui/products/weed.svg',
  './assets/classic-ui/icons/market.svg','./assets/classic-ui/icons/travel.svg','./assets/classic-ui/icons/bank.svg','./assets/classic-ui/icons/loan.svg','./assets/classic-ui/icons/clinic.svg','./assets/classic-ui/icons/stats.svg','./assets/classic-ui/icons/log.svg','./assets/classic-ui/icons/options.svg'
];

self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE_NAME);
    await cache.addAll(SHELL);
    try{
      const response=await fetch('./assets/asset-manifest.json?v=2');
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
