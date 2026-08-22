import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const sharp=require('sharp');

const root=path.resolve(import.meta.dirname,'..');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'assets','asset-manifest.json'),'utf8'));
const errors=[];const ids=new Set();const paths=new Set();const hashes=new Map();
for(const asset of manifest.assets){
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
  ...['acid','cocaine','hashish','heroin','ludes','mda','opium','pcp','peyote','shrooms','speed','weed'].map(id=>`products.${id}`),
  ...['bronx','ghetto','central-park','manhattan','coney-island','brooklyn'].flatMap(id=>['day','travel','market','alert','map'].map(state=>`locations.${id}-${state}`)),
  ...['officer-hardass','officer-bob','agent-smith','patrol-officer','veteran-officer','plainclothes-officer','heavy-response-officer','k9-officer','deputy','police-dog'].map(id=>`cops.${id}`),
  ...['baretta','38-special','ruger','saturday-night-special'].map(id=>`weapons.${id}`),
  ...['police-stop','police-chase','shootout','successful-escape','failed-escape','mugging','robbery','found-cash','found-goods','lost-goods','friend-gift','medical-emergency','coat-upgrade-offer','coat-damage','weapon-offer','market-shortage','market-flood','quiet-journey','final-victory','final-defeat'].map(id=>`encounters.${id}`)
];
for(const id of required)if(!ids.has(id))errors.push(`Required asset absent: ${id}`);

const productHashes=required.filter(id=>id.startsWith('products.')).map(id=>hashes.get(id));
if(new Set(productHashes).size!==productHashes.length)errors.push('Product icons are not all distinct.');

if(errors.length){console.error(errors.join('\n'));process.exit(1);}
console.log(`Asset QA passed: ${manifest.assets.length} manifest entries, ${paths.size} unique files, all required art readable.`);
