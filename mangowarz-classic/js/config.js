export const APP_NAME = 'MangoWarz Classic';
export const SAVE_VERSION = 2;
export const MAX_DAY = 30;
export const MONEY_CAP = Number.MAX_SAFE_INTEGER;

export const CLASSIC_PRODUCTS = Object.freeze([
  { id:'acid', name:'Acid', min:1000, maxExclusive:4400, tendency:'cheap' },
  { id:'cocaine', name:'Cocaine', min:15000, maxExclusive:29000, tendency:'expensive' },
  { id:'hashish', name:'Hashish', min:480, maxExclusive:1280, tendency:'cheap' },
  { id:'heroin', name:'Heroin', min:5500, maxExclusive:13000, tendency:'expensive' },
  { id:'ludes', name:'Ludes', min:11, maxExclusive:60, tendency:'cheap' },
  { id:'mda', name:'MDA', min:1500, maxExclusive:4400, tendency:'normal' },
  { id:'opium', name:'Opium', min:540, maxExclusive:1250, tendency:'expensive' },
  { id:'pcp', name:'PCP', min:1000, maxExclusive:2500, tendency:'normal' },
  { id:'peyote', name:'Peyote', min:220, maxExclusive:700, tendency:'normal' },
  { id:'shrooms', name:'Shrooms', min:630, maxExclusive:1300, tendency:'normal' },
  { id:'speed', name:'Speed', min:90, maxExclusive:250, tendency:'expensive' },
  { id:'weed', name:'Weed', min:315, maxExclusive:890, tendency:'cheap' }
]);

export const SIX_PRODUCT_IDS = Object.freeze(['cocaine','heroin','acid','weed','speed','ludes']);
export const CHEAP_IDS = Object.freeze(['acid','hashish','ludes','weed']);
export const EXPENSIVE_IDS = Object.freeze(['cocaine','heroin','opium','speed']);

export const LOCATIONS = Object.freeze([
  { id:'bronx', name:'Bronx', police:10, minListed:7, maxListedExclusive:12 },
  { id:'ghetto', name:'Ghetto', police:5, minListed:8, maxListedExclusive:12 },
  { id:'central-park', name:'Central Park', police:15, minListed:6, maxListedExclusive:12 },
  { id:'manhattan', name:'Manhattan', police:90, minListed:4, maxListedExclusive:10 },
  { id:'coney-island', name:'Coney Island', police:20, minListed:6, maxListedExclusive:12 },
  { id:'brooklyn', name:'Brooklyn', police:70, minListed:4, maxListedExclusive:11 }
]);

export const WEAPONS = Object.freeze([
  { id:'baretta', name:'Baretta', storePrice:3000, streetPrice:300, spaces:4, damage:5 },
  { id:'38-special', name:'.38 Special', storePrice:3500, streetPrice:350, spaces:4, damage:9 },
  { id:'ruger', name:'Ruger', storePrice:2900, streetPrice:290, spaces:4, damage:4 },
  { id:'saturday-night-special', name:'Saturday Night Special', storePrice:3100, streetPrice:310, spaces:4, damage:7 }
]);

export const POLICE_UNITS = Object.freeze([
  { id:'officer-hardass', name:'Officer Hardass', baseHealth:28, damage:[5,11], portrait:'assets/cops/officer-hardass.svg' },
  { id:'officer-bob', name:'Officer Bob', baseHealth:21, damage:[3,8], portrait:'assets/cops/officer-bob.svg' },
  { id:'agent-smith', name:'Agent Smith', baseHealth:32, damage:[6,12], portrait:'assets/cops/agent-smith.svg' },
  { id:'patrol-officer', name:'Patrol Officer', baseHealth:20, damage:[3,8], portrait:'assets/cops/patrol-officer.webp' },
  { id:'veteran-officer', name:'Veteran Officer', baseHealth:27, damage:[5,10], portrait:'assets/cops/veteran-officer.svg' },
  { id:'plainclothes-officer', name:'Plainclothes Officer', baseHealth:23, damage:[4,9], portrait:'assets/cops/plainclothes-officer.svg' },
  { id:'heavy-response-officer', name:'Heavy-Response Officer', baseHealth:38, damage:[7,13], portrait:'assets/cops/heavy-response-officer.svg' },
  { id:'k9-officer', name:'K-9 Officer', baseHealth:29, damage:[5,11], portrait:'assets/cops/k9-officer.svg' },
  { id:'deputy', name:'Deputy', baseHealth:19, damage:[3,7], portrait:'assets/cops/deputy.svg' },
  { id:'police-dog', name:'Police Dog', baseHealth:18, damage:[4,9], portrait:'assets/cops/police-dog.svg' }
]);

export const EXTENDED_ASSETS = Object.freeze([
  { id:'car', name:'Car', type:'vehicle', price:45000, resaleFactor:0.60, capacityBonus:30, escapeBonus:0.08, description:'Compact transport. +30 capacity and +8% escape chance. Resells for 60%.' },
  { id:'truck', name:'Truck', type:'vehicle', price:69000, resaleFactor:0.60, capacityBonus:80, escapeBonus:0.03, description:'Heavy hauler. +80 capacity and +3% escape chance. Resells for 60%.' },
  { id:'plane', name:'Plane', type:'vehicle', price:170000, resaleFactor:0.60, capacityBonus:120, escapeBonus:0.15, description:'Fast air transport. +120 capacity and +15% escape chance. Resells for 60%.' },
  { id:'boat', name:'Boat', type:'vehicle', price:95000, resaleFactor:0.60, capacityBonus:60, escapeBonus:0.10, description:'Waterborne transport. +60 capacity and +10% escape chance. Resells for 60%.' },
  { id:'house', name:'House', type:'property', price:250000, resaleFactor:1.00, description:'A stable property holding. Resells at 100%.' },
  { id:'hotel', name:'Hotel', type:'property', price:510000, resaleFactor:1.35, description:'A risky income property with a 135% endgame resale factor.' },
  { id:'island', name:'Island', type:'property', price:740000, resaleFactor:1.00, description:'Private fictional island. Resells at 100%.' },
  { id:'strip-club', name:'Strip Club', type:'property', price:1000000, resaleFactor:1.35, description:'Non-explicit nightlife property. High-risk 135% resale factor.' },
  { id:'earth', name:'Earth', type:'property', price:100000000, resaleFactor:1.00, description:'Absurd fictional title deed. Resells at 100%.' },
  { id:'galaxy', name:'Galaxy', type:'property', price:69000000000, resaleFactor:1.35, description:'Economically ridiculous cosmic deed. 135% resale factor; values are safely capped.' },
  { id:'hired-security', name:'Hired Security', type:'companion', price:50000, resaleFactor:0.60, escapeBonus:0.12, description:'Reduces pursuit risk and adds +12% escape chance. Resells for 60%.' },
  { id:'stripper', name:'Stripper', type:'companion', price:89000, resaleFactor:0.60, description:'A fictional adult entertainer companion; no explicit content. Resells for 60%.' },
  { id:'dog', name:'Dog', type:'companion', price:3000, resaleFactor:1.00, escapeBonus:0.04, description:'Loyal road companion. +4% escape chance. Resells at 100%.' },
  { id:'wife', name:'Wife', type:'companion', price:340000, resaleFactor:0.60, divorceRisk:true, description:'Absurd fictional satire. Each trip has a disclosed 2% divorce risk that removes half of carried cash. Resells for 60%.' }
]);

export const LOCATION_BY_ID = Object.freeze(Object.fromEntries(LOCATIONS.map(x => [x.id,x])));
export const PRODUCT_BY_ID = Object.freeze(Object.fromEntries(CLASSIC_PRODUCTS.map(x => [x.id,x])));
export const WEAPON_BY_ID = Object.freeze(Object.fromEntries(WEAPONS.map(x => [x.id,x])));
export const EXTENDED_BY_ID = Object.freeze(Object.fromEntries(EXTENDED_ASSETS.map(x => [x.id,x])));

export function enabledProducts(settings = {}) {
  return settings.sixProductVariant ? CLASSIC_PRODUCTS.filter(p => SIX_PRODUCT_IDS.includes(p.id)) : [...CLASSIC_PRODUCTS];
}
