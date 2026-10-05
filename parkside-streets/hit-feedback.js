export function createHitFeedback(){
 const style=document.createElement('style');style.textContent=`
 #hitAlerts{position:fixed;left:50%;top:40%;width:0;z-index:4;pointer-events:none;overflow:visible}
 .hit-award{position:absolute;left:var(--x);top:var(--y);width:138px;margin-left:-69px;text-align:center;animation:hit-award 1.25s both;filter:drop-shadow(0 3px 0 #392348) drop-shadow(0 0 12px #f94fa8aa)}
 .hit-award b{display:block;font:900 45px/1 system-ui,sans-serif;letter-spacing:-.05em;color:#fff489;-webkit-text-stroke:1px #713252;text-shadow:2px 2px 0 #ff48ad,-2px -1px 0 #ff48ad}
 .hit-award small{display:block;font:800 11px/1.5 system-ui;color:#b4fff3;text-shadow:0 2px 2px #122d37}
 .hit-award i{position:absolute;left:50%;top:20px;width:6px;height:6px;border-radius:2px;background:var(--color);box-shadow:0 0 9px var(--color);animation:hit-spark .8s ease-out both}
 @keyframes hit-award{0%{opacity:0;transform:translateY(16px) scale(.4) rotate(-8deg)}16%{opacity:1;transform:translateY(0) scale(1.18) rotate(3deg)}30%{transform:translateY(-6px) scale(1) rotate(0)}70%{opacity:1}100%{opacity:0;transform:translateY(-85px) scale(.9)}}
 @keyframes hit-spark{0%{opacity:1;transform:translate(0,0) scale(.5)}70%{opacity:1}100%{opacity:0;transform:translate(var(--dx),var(--dy)) rotate(150deg) scale(.25)}}
 .cinematic #hitAlerts{display:none}
 @media(max-height:540px){#hitAlerts{top:35%}.hit-award b{font-size:36px}}
 `;document.head.append(style);
 const layer=document.createElement('div');layer.id='hitAlerts';layer.setAttribute('role','status');layer.setAttribute('aria-live','polite');document.body.append(layer);let count=0;
 function show(points=100,total=0,combo=1,multiplier=1){const item=document.createElement('div');item.className='hit-award';item.style.setProperty('--x',[-32,32,0][count%3]+'px');item.style.setProperty('--y',-(count%2)*28+'px');count++;const label=document.createElement('b');label.textContent='+'+points;item.append(label);if(combo>1){const note=document.createElement('small');note.textContent=combo+' HIT · ×'+multiplier;item.append(note);}for(let i=0;i<8;i++){const spark=document.createElement('i'),a=i*Math.PI/4;spark.setAttribute('aria-hidden','true');spark.style.setProperty('--dx',Math.cos(a)*76+'px');spark.style.setProperty('--dy',Math.sin(a)*57-12+'px');spark.style.setProperty('--color',['#fff489','#ff48ad','#75fff0'][i%3]);item.append(spark);}layer.append(item);setTimeout(()=>item.remove(),1250);while(layer.children.length>6)layer.firstChild.remove();item.addEventListener('animationend',e=>{if(e.target===item)item.remove();});const score=document.getElementById('hitScore');if(score){score.textContent=total+' PTS';score.getAnimations().forEach(a=>a.cancel());score.animate([{transform:'scale(1)',color:'#ffd789'},{transform:'scale(1.3)',color:'#ff75cc'},{transform:'scale(1)',color:'#ffd789'}],{duration:450});}}
 return {show,clear:()=>{layer.replaceChildren();count=0;}};
}
