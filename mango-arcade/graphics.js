import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js';

export function makeCanvas(width, height, draw) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  draw(canvas.getContext('2d'), width, height);
  return canvas;
}

export function texture(canvas, nearest = false) {
  const result = new THREE.CanvasTexture(canvas);
  result.colorSpace = THREE.SRGBColorSpace;
  result.anisotropy = 4;
  if (nearest) {
    result.magFilter = THREE.NearestFilter;
    result.minFilter = THREE.NearestMipmapLinearFilter;
  }
  return result;
}

export function drawLabel(ctx, value, x, y, limit, size, color, weight = 800) {
  do {
    ctx.font = `${weight} ${size--}px "Barlow Condensed", Impact, sans-serif`;
  } while (ctx.measureText(value).width > limit && size > 10);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(value, x, y);
}

function shape(ctx, color, ...points) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(...points[0]);
  for (const point of points.slice(1)) ctx.lineTo(...point);
  ctx.closePath();
  ctx.fill();
}

function circle(ctx, color, x, y, radius) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

const themes = {
  ember(ctx) {
    circle(ctx, '#ffc97d', 212, 64, 38);
    for (let i = 0; i < 9; i++) {
      const x = i * 40 - 13;
      shape(ctx, i % 2 ? '#5c355b' : '#714052', [x-25,142],[x+20,53+i%3*15],[x+64,142]);
    }
    for (let i = 0; i < 4; i++) shape(ctx, '#b96b50', [0,141+i*16],[310,137+i*19],[310,145+i*18],[0,149+i*17]);
    ctx.fillStyle = '#fff5bc'; ctx.fillRect(137,106,9,21);
    shape(ctx, '#a596f1', [122,118],[139,91],[153,118]); ctx.fillStyle = '#694b91';ctx.fillRect(131,126,18,20);
  },
  nutwood(ctx) {
    circle(ctx, '#e0d394', 226, 61, 38);
    for (let i = 0; i < 9; i++) {
      const x = i*42-13, y = 44+(i%4)*10;
      ctx.fillStyle = '#705643';ctx.fillRect(x+26,y+51,10,74);
      shape(ctx, i%2?'#62864d':'#3e7256',[x,y+79],[x+29,y],[x+62,y+80]);
    }
    circle(ctx,'#a35c40',188,132,25);circle(ctx,'#c48456',158,144,17);circle(ctx,'#e3a875',142,131,13);
    circle(ctx,'#32202d',139,129,2.7);ctx.fillStyle='#879659';ctx.fillRect(0,160,320,60);
  },
  gnat(ctx) {
    ctx.fillStyle='#382443';ctx.fillRect(0,27,320,144);
    for (let x=0;x<320;x+=40) {ctx.fillStyle='#68404e';ctx.fillRect(x,55,35,57);ctx.fillStyle='#ff8762';ctx.fillRect(x+3,60,6,36);}
    shape(ctx,'#ffc25e',[0,159],[83,122],[136,127],[182,120],[244,138],[128,151],[0,189]);
    shape(ctx,'#ff724e',[0,170],[89,129],[159,139],[75,170],[0,196]);
    for (let i=0;i<9;i++){const x=180+i%3*35,y=50+Math.floor(i/3)*32+(i%2)*8;circle(ctx,'#e2a4c9',x-6,y-5,6);circle(ctx,'#e2a4c9',x+6,y-5,6);circle(ctx,'#251523',x,y,6);}
  },
  castle(ctx) {
    circle(ctx,'#f9c987',233,56,37);
    shape(ctx,'#795063',[0,151],[88,104],[191,114],[259,85],[320,131],[320,210],[0,210]);
    ctx.fillStyle='#c29a88';ctx.fillRect(94,87,135,68);
    for(const x of [86,139,212]){
      ctx.fillStyle='#e2b5a0';ctx.fillRect(x,62,24,95);
      for(let i=0;i<3;i++)ctx.fillRect(x+i*9,53,6,10);
      ctx.fillStyle='#49304b';ctx.fillRect(x+9,83,7,16);
    }
    ctx.fillStyle='#49304b';ctx.fillRect(154,118,17,38);
    for(let i=0;i<7;i++)circle(ctx,'#ffd37e',46+i*9,61-i*3,3+i*.5);
  },
  gold(ctx) {
    for(let x=0;x<320;x+=24){const h=33+(x*7)%59;ctx.fillStyle=x%48?'#716063':'#89746c';ctx.fillRect(x,151-h,20,h);ctx.fillStyle='#d9a177';ctx.fillRect(x+5,158-h,3,5);}
    shape(ctx,'#442f42',[0,183],[143,139],[179,139],[320,183],[320,220],[0,220]);
    ctx.strokeStyle='#ffc884';ctx.lineWidth=2;ctx.strokeRect(132,58,56,50);
    ctx.fillStyle='#211f33';ctx.fillRect(139,75,44,15);ctx.fillRect(152,65,18,37);
    for(const x of [119,185]){ctx.fillRect(x,75,18,9);circle(ctx,'#e28161',x+9,79,3);}
  },
  life(ctx) {
    for(let r=65;r>15;r-=10){ctx.strokeStyle=r%20===5?'#347560':'#63547d';ctx.lineWidth=2;ctx.beginPath();ctx.arc(160,93,r,0,Math.PI*2);ctx.stroke();}
    shape(ctx,'#87e8b8',[160,41],[207,68],[207,118],[160,145],[113,118],[113,68]);
    shape(ctx,'#23423e',[160,46],[201,71],[201,115],[160,140],[119,115],[119,71]);
    drawLabel(ctx,'40',160,93,73,52,'#c8ffdb');
  },
  dia(ctx) {
    for(let y=78;y<205;y+=12){
      ctx.strokeStyle=y%24===6?'#558cd6':'#7458aa';ctx.lineWidth=2;ctx.beginPath();
      for(let x=0;x<=320;x+=4){const yy=y+Math.sin(x*.036+y*.055)*(6+(y-70)*.09);x?ctx.lineTo(x,yy):ctx.moveTo(x,yy);}
      ctx.stroke();
    }
    shape(ctx,'#75d9f3',[160,25],[215,79],[160,133],[105,79]);
    shape(ctx,'#47397c',[160,32],[208,79],[160,125],[112,79]);
    shape(ctx,'#b6ebff',[160,36],[181,79],[160,119],[137,79]);
  },
  frog(ctx) {
    for(let y=65;y<205;y+=19){ctx.fillStyle=y%38===8?'#417e73':'#356461';ctx.fillRect(0,y,320,11);}
    for(const [x,y] of [[45,100],[249,127],[86,141],[271,72]]){
      ctx.fillStyle='#79a560';ctx.beginPath();ctx.ellipse(x,y,28,12,0,.15,5.7);ctx.lineTo(x,y);ctx.fill();
    }
    circle(ctx,'#6caa53',160,101,43);circle(ctx,'#a4d864',135,71,18);circle(ctx,'#a4d864',184,71,18);
    circle(ctx,'#223d38',135,72,7);circle(ctx,'#223d38',184,72,7);
    ctx.strokeStyle='#de7290';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(179,108);ctx.quadraticCurveTo(227,105,233,78);ctx.stroke();
  },
  bag(ctx) {
    for(let x=21;x<320;x+=39){ctx.fillStyle='#6e88a6';ctx.fillRect(x,47,25,58);ctx.fillStyle='#a6d1cf';ctx.fillRect(x+3,52,12,9);}
    ctx.fillStyle='#597391';ctx.fillRect(0,103,320,72);ctx.fillStyle='#304559';ctx.fillRect(0,157,320,50);
    shape(ctx,'#c99767',[116,74],[193,74],[190,151],[123,151]);
    ctx.strokeStyle='#f3c58f';ctx.lineWidth=5;ctx.strokeRect(142,58,28,21);
    ctx.fillStyle='#6d4b52';ctx.fillRect(130,120,45,5);
    circle(ctx,'#db755e',106,127,14);circle(ctx,'#b0d08b',214,131,17);
  },
  food(ctx) {
    const tiles=[[2,1],[3,1],[3,2],[4,2],[1,3],[2,3],[3,3],[4,3],[5,3],[1,4],[2,4],[3,4],[4,4],[5,4],[6,4]];
    tiles.forEach(([x,y],i)=>{
      const xx=61+x*26,yy=34+y*26;
      ctx.fillStyle=['#f4ad69','#ec7d9f','#a8cb78','#db8ecc'][i%4];ctx.fillRect(xx,yy,23,23);
      circle(ctx,'#9c4a63',xx+8,yy+7,2.5);circle(ctx,'#9c4a63',xx+16,yy+14,2.5);
    });
    shape(ctx,'#f8ce8e',[201,43],[246,55],[222,90]);circle(ctx,'#a95060',221,58,4);circle(ctx,'#a95060',225,70,3.5);
  }
};

export function screenArt(station) {
  return makeCanvas(320, 210, (ctx,w,h) => {
    const sky = ctx.createLinearGradient(0,0,0,h);
    sky.addColorStop(0,'#1b1636');sky.addColorStop(.63,station.dark);sky.addColorStop(1,'#171123');
    ctx.fillStyle = sky;ctx.fillRect(0,0,w,h);
    for(let i=0;i<36;i++){
      ctx.fillStyle=i%5?'#e9c4e473':'#fff2b5';ctx.fillRect((i*101)%w,14+(i*83)%140,i%5?1:2,i%5?1:2);
    }
    themes[station.id]?.(ctx);
    const fade = ctx.createLinearGradient(0,130,0,204);
    fade.addColorStop(0,'#120d2100');fade.addColorStop(1,'#130e23');
    ctx.fillStyle=fade;ctx.fillRect(0,130,w,80);
    for(let y=0;y<h;y+=3){ctx.fillStyle='#170d2825';ctx.fillRect(0,y,w,1);}
    ctx.fillStyle=station.color;ctx.fillRect(15,160,w-30,2);
    drawLabel(ctx,station.title.toUpperCase(),w/2,179,286,27,'#fff4dd');
    drawLabel(ctx,'PRESS PLAY',w/2,199,190,12,station.color,700);
  });
}

export function marquee(station) {
  return makeCanvas(512,120,(ctx,w,h)=>{
    const tint=ctx.createLinearGradient(0,0,w,h);
    tint.addColorStop(0,station.dark);tint.addColorStop(.5,'#1d1632');tint.addColorStop(1,station.dark);
    ctx.fillStyle=tint;ctx.fillRect(0,0,w,h);
    ctx.strokeStyle=station.color;ctx.lineWidth=4;ctx.strokeRect(7,7,w-14,h-14);
    ctx.fillStyle=station.color;
    for(const x of [20,w-29]){ctx.fillRect(x,46,9,28);ctx.fillRect(x+3,41,3,38);}
    drawLabel(ctx,station.title.toUpperCase(),w/2,h/2+1,w-83,65,'#fff3dc');
  });
}

export function wallSign(title, subtitle, color = '#ffd181') {
  return makeCanvas(1024,256,(ctx,w,h)=>{
    ctx.fillStyle='#20152e';ctx.fillRect(0,0,w,h);
    ctx.strokeStyle='#4b3256';ctx.lineWidth=14;ctx.strokeRect(13,13,w-26,h-26);
    ctx.shadowBlur=18;ctx.shadowColor=color;
    drawLabel(ctx,title,w/2,104,w-130,141,color);
    ctx.shadowBlur=0;
    ctx.strokeStyle='#bc729d';ctx.lineWidth=3;
    for(const x of [112,830]){ctx.beginPath();ctx.moveTo(x,191);ctx.lineTo(x+82,191);ctx.stroke();}
    drawLabel(ctx,subtitle,w/2,192,w-410,40,'#edbcd9',700);
  });
}

export function flooring() {
  return makeCanvas(768,768,(ctx,w,h)=>{
    ctx.fillStyle='#241a39';ctx.fillRect(0,0,w,h);
    const colors=['#a45193','#d78062','#4c6593','#624d89','#925a82','#557276'];
    let seed=731;
    const random=()=>((seed=(1664525*seed+1013904223)>>>0)/4294967296);
    for(let i=0;i<17000;i++){
      ctx.globalAlpha=.08+random()*.22;ctx.fillStyle=i%2?'#b581c7':'#0c071c';
      ctx.fillRect(random()*w,random()*h,1+random()*3,1+random()*2);
    }
    ctx.globalAlpha=1;
    for(let y=-1;y<10;y++) for(let x=-1;x<10;x++){
      const xx=x*87+(y%2)*34+random()*34,yy=y*83+random()*46;
      ctx.strokeStyle=colors[(x+y+14)%colors.length];ctx.lineWidth=2;
      ctx.beginPath();ctx.moveTo(xx-9,yy+4);ctx.lineTo(xx,yy-5);ctx.lineTo(xx+10,yy+2);ctx.lineTo(xx+20,yy-7);ctx.stroke();
      ctx.fillStyle='#86567e';ctx.fillRect(xx+27,yy+5,4,4);ctx.fillStyle='#bf8463';ctx.fillRect(xx-7,yy-16,3,3);
    }
  });
}

export function panelPack(ctx, set, x, y, w, h, img) {
  ctx.fillStyle='#241730';ctx.fillRect(x,y,w,h);
  if(img)ctx.drawImage(img,x+2,y+2,w-4,h*.74);
  else{
    const gradient=ctx.createLinearGradient(x,y,x+w,y+h);
    gradient.addColorStop(0,set.color);gradient.addColorStop(1,'#221630');
    ctx.fillStyle=gradient;ctx.fillRect(x+2,y+2,w-4,h-4);
    shape(ctx,'#ffebbe', [x+w*.5,y+h*.12],[x+w*.73,y+h*.39],[x+w*.5,y+h*.67],[x+w*.27,y+h*.39]);
  }
  ctx.fillStyle='#160e25eb';ctx.fillRect(x+2,y+h*.73,w-4,h*.27-2);
  ctx.strokeStyle=set.color;ctx.lineWidth=2;ctx.strokeRect(x+1,y+1,w-2,h-2);
  drawLabel(ctx,set.label.toUpperCase(),x+w/2,y+h*.865,w-8,19,'#fff1db');
}
