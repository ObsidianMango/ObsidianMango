export const MATERIALS={
 stone:{color:0xb2b5b0,hp:95,density:2.4,friction:.72,points:40},
 sandstone:{color:0xd9ac6e,hp:65,density:1.8,friction:.7,points:35},
 reinforced:{color:0x717f87,hp:175,density:3.2,friction:.8,points:65},
 wood:{color:0x9c6336,hp:38,density:.65,friction:.65,points:25},
 glass:{color:0x80d9d5,hp:15,density:.8,friction:.35,points:25},
 iron:{color:0x415866,hp:240,density:5,friction:.6,points:90},
 barrel:{color:0xb64331,hp:28,density:.7,friction:.6,points:100},
 treasure:{color:0xffcc50,hp:25,density:1.5,friction:.6,points:500}
};
// Each entry supplies an actual projectile or assault mechanic, rather than a menu-only unlock.
export const WEAPONS=[
 {name:'Catapult',icon:'◉',type:'stone',speed:29,radius:.65,mass:14,damage:120,blast:2.2,cost:0,desc:'The original wall negotiator.'},
 {name:'Trebuchet',icon:'⚖',type:'stone',speed:34,radius:.85,mass:24,damage:175,blast:3,cost:180,desc:'Counterweight. Counterargument.'},
 {name:'Ballista',icon:'➶',type:'bolt',speed:45,radius:.22,mass:8,damage:210,blast:1,cost:120,desc:'Punch through narrow supports.'},
 {name:'Cannon',icon:'●',type:'iron',speed:39,radius:.65,mass:30,damage:220,blast:2.7,cost:200,desc:'Heavy iron; flatter trajectory.'},
 {name:'Battering Ram',icon:'▰',type:'ram',speed:22,radius:1,mass:65,damage:340,blast:2.3,cost:100,desc:'A rolling assault on the gate. Low elevation.'},
 {name:'Siege Tower',icon:'♜',type:'tower',speed:15,radius:1.35,mass:75,damage:250,blast:3.5,cost:220,desc:'An advancing timber battering fortress.'},
 {name:'Triple Catapult',icon:'⋮',type:'triple',speed:30,radius:.6,mass:14,damage:120,blast:2.1,cost:280,desc:'Three stones, one deeply unfair argument.'},
 {name:'Explosive Boulder',icon:'✹',type:'explosive',speed:30,radius:.8,mass:20,damage:260,blast:5,cost:320,desc:'Radial blast tears apart connected masonry.'},
 {name:'Flaming Meteor',icon:'☄',type:'meteor',speed:32,radius:1,mass:32,damage:300,blast:5.2,cost:450,desc:'Burns timber and rains sparks.'},
 {name:'Chain Cannonballs',icon:'∞',type:'chain',speed:34,radius:.6,mass:22,damage:170,blast:2.5,cost:350,desc:'Two iron balls connected by a physical rope joint.'},
 {name:'Cluster Trebuchet',icon:'⁙',type:'cluster',speed:31,radius:.8,mass:20,damage:100,blast:2,cost:430,desc:'Splits into six explosive submunitions.'},
 {name:'Lightning Cannon',icon:'ϟ',type:'lightning',speed:55,radius:.35,mass:10,damage:260,blast:4,cost:500,desc:'Arcs through nearby iron and stone.'},
 {name:'Gravity Bomb',icon:'◎',type:'gravity',speed:29,radius:.7,mass:20,damage:200,blast:6,cost:550,desc:'Pulls nearby pieces inward before detonation.'},
 {name:'Rubber Duck',icon:'♧',type:'duck',speed:30,radius:1.15,mass:35,damage:160,blast:3,cost:360,desc:'Bounces repeatedly. Honks professionally.'},
 {name:'Holy Hand Grenade',icon:'✚',type:'holy',speed:28,radius:.65,mass:18,damage:420,blast:6,cost:650,desc:'Three shall be the number of the counting.'},
 {name:'Exploding Sheep',icon:'♞',type:'sheep',speed:30,radius:.9,mass:22,damage:280,blast:4.8,cost:400,desc:'One small bleat for sheepkind.'}
];
export const LEVELS=[
 {name:'Training Fort',tag:'THE FIRST CRACK',theme:'meadow',mat:'wood',layout:'fort',height:4,ammo:6,goal:45,hint:'Aim low. Remove the front wall’s timber supports.',bonus:'Open the gate',target:'gate'},
 {name:'Stonewall Keep',tag:'MORTAR & MAYHEM',theme:'meadow',mat:'stone',layout:'keep',height:6,ammo:7,goal:55,hint:'The red barrels beside the gate are an opportunity.',bonus:'Ignite a barrel',target:'barrel'},
 {name:'Sibling Towers',tag:'DOMINO THEORY',theme:'meadow',mat:'stone',layout:'twin',height:42,ammo:6,goal:50,hint:'Tall silver façades, exposed lobby columns. Aim at the supports.',bonus:'Topple both towers',target:'tower'},
 {name:'Riverfront Castle',tag:'A BRIDGE TOO FRAGILE',theme:'river',mat:'stone',layout:'bridge',height:7,ammo:7,goal:55,hint:'The drawbridge beams connect the gatehouse.',bonus:'Break the drawbridge',target:'bridge'},
 {name:'Mountain Citadel',tag:'DOWNHILL FROM HERE',theme:'mountain',mat:'stone',layout:'citadel',height:9,ammo:7,goal:55,hint:'Strike the cliffside columns to release the upper keep.',bonus:'Destroy a column',target:'column'},
 {name:'Royal Palace',tag:'RENOVATION BY FORCE',theme:'royal',mat:'stone',layout:'palace',height:8,ammo:8,goal:60,hint:'Glass balconies and timber floors are weak links.',bonus:'Find the royal treasury',target:'treasure'},
 {name:'Viking Stronghold',tag:'TIMBER!',theme:'snow',mat:'wood',layout:'viking',height:6,ammo:6,goal:65,hint:'Fire spreads through these wooden halls.',bonus:'Break the longhouse roof',target:'roof'},
 {name:'Desert Fortress',tag:'SAND & DELIVER',theme:'desert',mat:'sandstone',layout:'keep',height:9,ammo:7,goal:65,hint:'Sandstone fractures easily; tall towers are top-heavy.',bonus:'Break a tower',target:'tower'},
 {name:'Haunted Castle',tag:'EVICTION NOTICE',theme:'haunted',mat:'stone',layout:'palace',height:9,ammo:8,goal:60,hint:'A secret beneath the spire is rather explosive.',bonus:'Open the secret chamber',target:'secret'},
 {name:'Island Fortress',tag:'SINKING PROPERTY VALUES',theme:'island',mat:'stone',layout:'bridge',height:8,ammo:8,goal:65,hint:'The coastal walls share exposed wooden foundations.',bonus:'Destroy the harbor bridge',target:'bridge'},
 {name:'Dwarven Mountain Hold',tag:'ROCK BOTTOM',theme:'mountain',mat:'reinforced',layout:'citadel',height:9,ammo:10,goal:55,hint:'Heavy masonry needs heavy weapons. Find the timber lintels.',bonus:'Smash a reinforced column',target:'column'},
 {name:'Imperial Mega Castle',tag:'THE FINAL FALL',theme:'royal',mat:'reinforced',layout:'mega',height:10,ammo:12,goal:65,hint:'Work inward through the layered defenses. Chain the powder stores.',bonus:'Discover the chicken kingdom',target:'secret'}
];
export const MEDALS=['Stone Smasher','Tower Toppler','Wall Breaker','Demolition Genius','Chain Reaction King','One-Shot Wonder','Total Annihilation','Medieval Menace'];
export const BUILD_PARTS={Wall:[3.6,2.4,.8,'stone'],Tower:[3.6,4.8,3.6,'stone'],Floor:[3.6,.3,3.6,'wood'],Roof:[3.6,.3,3.6,'wood'],Stairs:[1.8,2.7,6,'stone'],Gate:[3.6,2.4,.6,'stone'],Beam:[3.6,.4,.4,'wood'],Column:[.8,3.6,.8,'reinforced'],Barrel:[.8,1.2,.8,'barrel'],Glass:[2.4,2.4,.3,'glass'],Treasure:[.8,.6,.7,'treasure']};
export const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export function rng(seed=1){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
