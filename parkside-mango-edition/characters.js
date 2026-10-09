export const CHARACTERS=[
 {id:'mango',name:'Mango',description:'Black shirt · swept brown hair · full beard',shirt:0x16191c,seam:0x272c30,pants:0x34495e,denim:0x435b70,hair:0x302820,hairHi:0x4b3c2e,beard:0x352b24,beardHi:0x695342,skin:0xd0a086,cheek:0xc89278},
 {id:'racer',name:'Street racer',description:'Cyan racing shirt · dark jeans · light hair',shirt:0x238da5,seam:0x216779,pants:0x273744,denim:0x425769,hair:0xa98755,hairHi:0xc4a474,beard:0x957446,beardHi:0xb99869,skin:0xd6af95,cheek:0xc79981},
 {id:'mechanic',name:'City mechanic',description:'Orange work shirt · navy trousers · dark hair',shirt:0xd58a38,seam:0x9c612b,pants:0x26394f,denim:0x3d5771,hair:0x201d22,hairHi:0x3a333e,beard:0x29232c,beardHi:0x514452,skin:0xa77b61,cheek:0x93674f},
 {id:'night',name:'Night runner',description:'Purple shirt · charcoal jeans · auburn hair',shirt:0x7953a1,seam:0x563b77,pants:0x323a40,denim:0x505c66,hair:0x704029,hairHi:0x9c5d3e,beard:0x653722,beardHi:0x905235,skin:0xc39174,cheek:0xaf795f}
];
export const characterById=id=>CHARACTERS.find(c=>c.id===id)||CHARACTERS[0];
