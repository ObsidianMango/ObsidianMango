import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const sharp=require('sharp');

const root=path.resolve(import.meta.dirname,'..');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'assets','asset-manifest.json'),'utf8'));
const errors=[];const ids=new Set();const paths=new Set();const hashes=new Map();
const metadataFields=['id','displayName','category','path','format','nativeDimensions','alt','animationStates','frameCount','frameTimingMs','anchorPoint','provenance','mode','fallbackAsset','preloadPriority'];
for(const asset of manifest.assets){
  for(const field of metadataFields)if(!(field in asset))errors.push(`Missing ${field}: ${asset.id ?? '(unknown asset)'}`);
  if(ids.has(asset.id))errors.push(`Duplicate id: ${asset.id}`);ids.add(asset.id);
  if(paths.has(asset.path))errors.push(`Duplicate path: ${asset.path}`);paths.add(asset.path);
  const file=path.join(root,asset.path);
  if(!fs.existsSync(file)){errors.push(`Missing: ${asset.path}`);continue;}
  const data=fs.readFileSync(file);const digest=crypto.createHash('sha256').update(data).digest('hex');hashes.set(asset.id,digest);
  try{const meta=await sharp(data).metadata();if(meta.width!==asset.nativeDimensions.width||meta.height!==asset.nativeDimensions.height)errors.push(`Dimension mismatch: ${asset.id} ${meta.width}x${meta.height}`);}catch(error){errors.push(`Unreadable image ${asset.id}: ${error.message}`);}
  if(asset.format==='svg'){
    const source=data.toString('utf8');
    if(!source.startsWith('<svg')&&!source.includes('<svg '))errors.push(`Invalid SVG start: ${asset.id}`);
    if(!source.includes('</svg>'))errors.push(`Invalid SVG end: ${asset.id}`);
    if(/<text\b/.test(source)&&asset.id!=='branding.logo')errors.push(`Unexpected visible text: ${asset.id}`);
  }
}

const required=[
  ...['logo','compact-logo','app-icon','maskable-icon','favicon','splash','social-preview','loading-screen','title-skyline','game-over','victory'].map(id=>`branding.${id}`),
  ...['neutral','trading','traveling','running','aiming','firing','hit','injured','critical','victorious','defeated'].map(id=>`characters.player-${id}`),
  ...['acid','cocaine','hashish','heroin','ludes','mda','opium','pcp','peyote','shrooms','speed','weed'].map(id=>`products.${id}`),
  ...['bronx','ghetto','central-park','manhattan','coney-island','brooklyn'].flatMap(id=>['day','travel','market','alert','map'].map(state=>`locations.${id}-${state}`)),
  ...['officer-hardass','officer-bob','agent-smith','patrol-officer','veteran-officer','plainclothes-officer','heavy-response-officer','k9-officer','deputy','police-dog'].map(id=>`cops.${id}`),
  ...['loan-shark','banker','weapon-seller','doctor','bartender','street-dealer','friend','mugger','subway-passenger','strange-woman','informant','market-buyer','market-seller','found-goods-owner','found-cash-owner','abandoned-property-witness',...Array.from({length:8},(_,index)=>`pedestrian-${index+1}`)].map(id=>`civilians.${id}`),
  ...['baretta','38-special','ruger','saturday-night-special','ammunition','empty-weapon','muzzle-flash','bullet-impact','hit-effect','miss-effect','police-badge','handcuffs','radio','flashlight','medical-kit','bandage','protective-vest','evidence-bag'].map(id=>`weapons.${id}`),
  ...['standard-coat','upgraded-coat','damaged-coat','full-capacity-coat','empty-capacity-coat','wallet-cash','bank-deposit','debt-document','travel-ticket','map','event-log-phone','medical-supplies','information-tip','locked-item','sold-item','purchased-item'].map(id=>`items.${id}`),
  ...['bronx-loan-shark-room','manhattan-bank','street-weapon-offer','clinic','bar-information-venue','subway-platform'].map(id=>`services.${id}`),
  ...['police-stop','police-chase','shootout','successful-escape','failed-escape','mugging','robbery','found-cash','found-goods','lost-goods','friend-gift','medical-emergency','coat-upgrade-offer','coat-damage','weapon-offer','market-shortage','market-flood','quiet-journey','final-victory','final-defeat','abandoned-property','risky-stranger','street-tip'].map(id=>`encounters.${id}`),
  ...['car','truck','plane','boat','house','hotel','island','strip-club','earth','galaxy','hired-security','stripper','dog','wife','divorce-event','property-portfolio','vehicle-travel-car','vehicle-travel-truck','vehicle-travel-plane','vehicle-travel-boat'].map(id=>`extended-mode.${id}`),
  ...['buy','sell','travel','bank','debt','health','capacity','inventory','weapon','settings','sound','haptics','save','warning','information','close','previous','next','quantity-plus','quantity-minus','max-quantity','ticker','day','map-pin','locked','unlocked','achievement-frame','score-bronze','score-silver','score-gold'].map(id=>`ui.${id}`),
  ...['cash-increase','cash-decrease','debt-increase','bank-interest','purchase-success','sale-success','market-shortage','market-flood','player-damage','enemy-damage','critical-health','police-lights','travel','escape','victory','defeat','new-high-score'].map(id=>`effects.${id}`)
];
for(const id of required)if(!ids.has(id))errors.push(`Required asset absent: ${id}`);

const productHashes=required.filter(id=>id.startsWith('products.')).map(id=>hashes.get(id));
if(new Set(productHashes).size!==productHashes.length)errors.push('Product icons are not all distinct.');

if(errors.length){console.error(errors.join('\n'));process.exit(1);}
console.log(`Asset QA passed: ${manifest.assets.length} manifest entries, ${paths.size} unique files, all required art readable.`);
