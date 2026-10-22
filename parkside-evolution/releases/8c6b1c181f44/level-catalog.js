// Level data only: no graphics or physics imports. Append new levels to preserve save indexes.
export const LEVEL_DEFINITIONS=[
 {name:'Market Square',kind:'Head-in',hint:'Drive around the island and park in A3.',code:'A3',theme:0xb6bca3,spawn:[-13,17,0],target:{x:4,z:-15,yaw:0,w:3.8,d:6.6},par:45,style:'market'},
 {name:'Sunset Diner',kind:'Angled bay',hint:'Follow the diagonal row. Stop inside D4.',code:'D4',theme:0xc7ab88,spawn:[-15,17,0],target:{x:7,z:-10,yaw:-Math.PI/4,w:3.7,d:6.6},par:55,style:'diner'},
 {name:'Office Hours',kind:'Reverse-in',hint:'Pass B2, select R, then back into the bay.',code:'B2',theme:0x9eb4bb,spawn:[-14,17,0],target:{x:5,z:14,yaw:0,w:3.6,d:6.5,reverse:true},par:65,style:'office'},
 {name:'Old Town',kind:'Parallel parking',hint:'Fit between the two cars along the right curb.',code:'P1',theme:0xc8baa6,spawn:[8,18,0],target:{x:16,z:0,yaw:0,w:3.5,d:7.5,reverse:true},par:80,style:'street'},
 {name:'Garden Centre',kind:'Slalom approach',hint:'Thread the planter islands to reach G6.',code:'G6',theme:0xaabb91,spawn:[-13,18,0],target:{x:11,z:-15,yaw:0,w:3.6,d:6.5},par:70,style:'garden'},
 {name:'The Courtyard',kind:'Tight turn',hint:'Go around the central fountain to reach C2.',code:'C2',theme:0xc1bba3,spawn:[-15,17,0],target:{x:15,z:-9,yaw:Math.PI/2,w:3.7,d:6.5},par:80,style:'motel'},
 {name:'Loading Dock',kind:'Reverse alley',hint:'Turn into the aisle, then back into L3.',code:'L3',theme:0xa5b2b0,spawn:[-15,16,0],target:{x:8,z:-14,yaw:Math.PI,w:3.6,d:6.5,reverse:true},par:90,style:'warehouse'},
 {name:'Harbour Finish',kind:'Precision parking',hint:'Navigate the barriers and reverse into H8.',code:'H8',theme:0x9cb7bb,spawn:[-14,18,0],target:{x:12,z:-14,yaw:Math.PI,w:3.45,d:6.4,reverse:true},par:100,style:'harbour'},
 {name:'Seaside Snacks',kind:'Wide approach',hint:'Pass the snack stands and park in S9.',code:'S9',theme:0xb5c9c0,spawn:[-14,18,0],target:{x:12,z:-15,yaw:0,w:4,d:7.2},par:70,style:'seaside'},
 {name:'Construction Yard',kind:'Reverse-in',hint:'Weave through the concrete barriers, then reverse into Y10.',code:'Y10',theme:0xc6b695,spawn:[15,18,0],target:{x:-14,z:-15,yaw:Math.PI,w:3.8,d:7.2,reverse:true},par:95,style:'construction'},
 {name:'Drive-in Cinema',kind:'Angled parking',hint:'Find the empty diagonal bay facing the screen.',code:'M11',theme:0x7b909f,spawn:[-15,18,0],target:{x:13,z:-12,yaw:-Math.PI/6,w:3.9,d:7.2},par:85,style:'cinema'},
 {name:'Campsite',kind:'Reverse turn',hint:'Circle the trees and back into the pitch on the right.',code:'C12',theme:0x9bae8e,spawn:[-15,18,0],target:{x:15,z:0,yaw:Math.PI/2,w:4,d:7.4,reverse:true},par:100,style:'camp'},
 {name:'Scrapyard',kind:'Obstacle maze',hint:'Navigate the scrap piles to reach J13.',code:'J13',theme:0xb1a58e,spawn:[-15,18,0],target:{x:12,z:-15,yaw:0,w:3.8,d:7.1},par:100,style:'scrap'},
 {name:'Hotel Valet',kind:'Reverse precision',hint:'Go around the fountain and reverse under the portico.',code:'V14',theme:0xc3bca8,spawn:[-16,18,0],target:{x:0,z:-17,yaw:Math.PI,w:3.7,d:7.1,reverse:true},par:100,style:'valet'},
 {name:'Factory Switchback',kind:'Double hairpin',hint:'Right around the first wall. Left around the next.',code:'F15',theme:0xa8b5b5,spawn:[-15,18,0],target:{x:-14,z:-14,yaw:0,w:3.8,d:7.2},par:120,style:'factory'},
 {name:'Festival Finale',kind:'Reverse slalom',hint:'Thread the festival stalls and reverse into F16.',code:'F16',theme:0xc4c2a3,spawn:[-15,18,0],target:{x:13,z:-15,yaw:Math.PI,w:3.7,d:7.4,reverse:true},par:120,style:'festival'},
 {name:'Station Approach',kind:'Angled bay',hint:'Pass the taxi island, then swing into R17 beside the platform.',code:'R17',theme:0xb3bac1,spawn:[-15,18,0],target:{x:12,z:-14,yaw:-Math.PI/4,w:3.9,d:7.4},par:95,style:'station'},
 {name:'Orchard Farm',kind:'Reverse barn',hint:'Weave around the hay stacks. Back into the barn apron.',code:'O18',theme:0xb9c292,spawn:[-15,18,0],target:{x:0,z:-16,yaw:Math.PI,w:3.9,d:7.5,reverse:true},par:115,style:'orchard'},
 {name:'Hospital Court',kind:'Island turns',hint:'Keep clear of the ambulance bays. Circle the gardens to H19.',code:'H19',theme:0xb6c5c4,spawn:[-15,18,0],target:{x:14,z:-14,yaw:0,w:3.7,d:7.2},par:110,style:'hospital'},
 {name:'Airport Shuttle',kind:'Angled reverse',hint:'Pass the luggage islands and back diagonally into A20.',code:'A20',theme:0xb2bec9,spawn:[-15,18,0],target:{x:12,z:-13,yaw:Math.PI+Math.PI/6,w:3.9,d:7.6,reverse:true},par:125,style:'airport'},
 {name:'Quarry Yard',kind:'Parallel reverse',hint:'Take the wide route around the stone piles, then reverse between the trucks.',code:'Q21',theme:0xc3b394,spawn:[-15,18,0],target:{x:15,z:0,yaw:0,w:3.7,d:8,reverse:true},par:130,style:'quarry'},
 {name:'Marina Service',kind:'Dry-dock reverse',hint:'Thread the boat cradles and back into the service bay.',code:'M22',theme:0xabc3c5,spawn:[15,18,0],target:{x:-14,z:-15,yaw:Math.PI,w:3.8,d:7.5,reverse:true},par:130,style:'marina'},
 {name:'Mountain Lodge',kind:'Angled arrival',hint:'Wind past the snow islands. Approach L23 on the diagonal.',code:'L23',theme:0xcad4d4,spawn:[-15,18,0],target:{x:0,z:-16,yaw:Math.PI/8,w:3.8,d:7.5},par:125,style:'lodge'},
 {name:'The Final Test',kind:'Precision reverse',hint:'Clear both staggered walls, turn in the upper court, then back into T24.',code:'T24',theme:0xb9c2b4,spawn:[-15,18,0],target:{x:13,z:-17,yaw:Math.PI,w:3.65,d:7.4,reverse:true},par:150,style:'academy'},
 {name:'Marine Park · Red Bank',kind:'Real marina',hint:'Enter from Union St, circle the island, reverse into the waterfront bay.',code:'RB25',theme:0x96bdc5,spawn:[12,44,0],target:{x:6,z:-31,yaw:Math.PI,w:3.2,d:6,reverse:true},par:170,style:'redbankMarina',realWorld:true,gates:[{x:12,z:22,yaw:0},{x:12,z:-8,yaw:0},{x:6,z:-22,yaw:Math.PI,reverse:true}],gateWidth:5.2},
 {name:'Riverview Hospital · Red Bank',kind:'Real hospital',hint:'Follow the hospital access road to the single entrance, then park in RV26.',code:'RV26',theme:0xaabfc4,spawn:[-53,64,0],target:{x:-23.2,z:21.8,yaw:-Math.PI/2,w:3.15,d:6.4},par:240,style:'riverviewHospital',realWorld:true,gates:[{x:-53,z:-30,yaw:0},{x:-48,z:-52,yaw:-Math.PI/2},{x:-33,z:-34,yaw:Math.PI}],gateWidth:6},
 {name:'Church Street · Store Delivery',kind:'Rear loading dock',hint:'Follow Church Street, turn into the shopping lots and deliver behind ACME.',code:'DOCK27',theme:0xaebcc0,spawn:[-65,96.8,-Math.PI/2+Math.atan(.32)],target:{x:-40,z:-68,yaw:0,w:5,d:28},par:300,style:'churchStreet',realWorld:true,halfSize:105,gates:[{x:0,z:76,yaw:-Math.PI/2+Math.atan(.32)},{x:42,z:5,yaw:0},{x:-25,z:-15,yaw:Math.PI/2}],gateWidth:12},
 {name:'Undici · Rumson',kind:'Choose either lot',hint:'Follow Washington Street, then park in the only open bay in either lot.',code:'U28',theme:0xb6c3ba,spawn:[0,94,0],target:{x:-42.4,z:3,yaw:-Math.PI/6,w:3.6,d:6.6},alternateTargets:[{x:57,z:23.5,yaw:Math.PI/2,w:3.6,d:6.6}],par:240,style:'undici',realWorld:true,halfSize:105,gates:[{x:0,z:74,yaw:0},{x:0,z:56,yaw:0},{x:0,z:38,yaw:0}],gateWidth:7}
];
export const ORIGINAL_LOT_COUNT=24;
export const LOTS=LEVEL_DEFINITIONS.map((l,i)=>{if(l.realWorld||l.coordinates==='world'){if(!l.gates?.length)throw Error('World-coordinate level needs gates: '+l.code);return {...l,target:{...l.target},spawn:[...l.spawn],gates:l.gates.map(g=>({...g})),gateWidth:l.gateWidth||5.2};}const t={...l.target,x:l.target.x*2,z:l.target.z*2},side=l.spawn[0]<0?-1:1;
 const gates=[{x:side*38,z:24,yaw:0},{x:-side*38,z:24,yaw:side<0?-Math.PI/2:Math.PI/2},{x:t.x+Math.sin(t.yaw)*9*(t.reverse?-1:1),z:t.z+Math.cos(t.yaw)*9*(t.reverse?-1:1),yaw:t.yaw,reverse:!!t.reverse}];
 return {...l,target:t,spawn:[side*38,40,0],par:Math.round(l.par*1.8),gates,gateWidth:6-Math.floor(i/8)*.55,hint:'Clear the three numbered gates, then '+(t.reverse?'reverse into ':'park in ')+l.code+'.'};
});

// Appending a definition updates rendering, menus and multiplayer together.
export const SECRET_LEVEL_INDEX=LOTS.length;
export const MULTIPLAYER_LEVELS=[...LOTS.map((l,id)=>({id,code:l.code,name:String(id+1).padStart(2,'0')+' · '+l.name})),{id:SECRET_LEVEL_INDEX,code:'SECRET',name:'Secret City · Golden Grounds'}];
export const validLevel=n=>Number.isInteger(n)&&n>=0&&n<=SECRET_LEVEL_INDEX;
let hash=2166136261;for(const ch of JSON.stringify(LOTS)){hash=Math.imul(hash^ch.charCodeAt(0),16777619);}
export const LEVEL_SIGNATURE='next-'+(hash>>>0).toString(16);
