const esc=x=>String(x??" ").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
export function art(p){
 const n=p.name.toLowerCase();const type=p.vendor==="bags"?"bag":/solo cups/.test(n)?"cups":/cherr|olive|onion/.test(n)?"jar":/peanut|cashew|almond|beer nuts|sunflower/.test(n)?"pouch":/ can\b/.test(n)?"can":/everfresh|ocean spray/.test(n)?"juice":"bottle";
 let col="#b69bd4",dark="#6d4e87";
 if(/cherr|cran|grenadine|cola/.test(n)){col="#d2475d";dark="#773544";}else if(/olive|lime|mojito|sprite/.test(n)){col="#9ace6c";dark="#517c44";}else if(/pineapple|orange|marg|cider/.test(n)){col="#efba61";dark="#a7783c";}else if(/red bull|blue/.test(n)){col="#73afdf";dark="#386c9d";}else if(p.vendor==="bags"){col="#d4b285";dark="#80603c";}
 const id="grad"+p.id.replace(/[^a-z0-9]/gi,"");
 const shapes={
 bottle:'<rect x="101" y="34" width="38" height="38" rx="6" fill="'+dark+'"/><path d="M99 69h42l10 27c25 10 30 28 30 51v117c0 26-11 38-33 38H92c-22 0-33-12-33-38V147c0-23 5-41 30-51z" fill="url(#'+id+')" stroke="#f2e8e3" stroke-width="3"/>',
 can:'<rect x="65" y="60" width="110" height="243" rx="16" fill="url(#'+id+')" stroke="#dbe0db" stroke-width="3"/><ellipse cx="120" cy="62" rx="52" ry="10" fill="#e3e5e3"/><ellipse cx="120" cy="62" rx="16" ry="4" fill="#859996"/>',
 jar:'<rect x="66" y="60" width="108" height="33" rx="8" fill="'+dark+'"/><rect x="59" y="91" width="122" height="212" rx="22" fill="url(#'+id+')" stroke="#f4efe1" stroke-width="3"/>',
 bag:'<path d="M58 113l62-54 62 54v188H58z" fill="'+dark+'"/><path d="M73 105l47-39 47 39v196H73z" fill="url(#'+id+')" stroke="#f4e1c0" stroke-width="3"/>',
 pouch:'<path d="M68 44h104l15 32-10 224H63L53 76z" fill="url(#'+id+')" stroke="#f3e1bb" stroke-width="3"/><path d="M58 80h124M67 283h106" stroke="'+dark+'" stroke-width="9"/>',
 juice:'<path d="M75 66h87l15 27v207H63V93z" fill="url(#'+id+')" stroke="#f5f0dc" stroke-width="3"/><path d="M75 66l-12 27h114l-15-27" fill="'+dark+'"/>',
 cups:'<path d="M68 102h108l-18 201H88z" fill="url(#'+id+')" stroke="#f5e9e5" stroke-width="3"/><rect x="63" y="96" width="118" height="13" rx="6" fill="#e9efec"/>'
 };
 const words=p.name.replace(/\b(32oz|20oz|16oz|12oz|10oz|8oz|5oz|2\.25oz|1L|Can|Mix|Juice)\b/gi,"").trim().split(/\s+/);
 let lines=[],line="";words.forEach(w=>{if(line&&(line+" "+w).length>14){lines.push(line);line=w;}else line=(line+" "+w).trim();});if(line)lines.push(line);
 const text=lines.slice(0,3).map((x,i)=>'<text x="120" y="'+(183+20*i)+'" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="'+(x.length>11?10:12)+'" fill="#26382e">'+esc(x.toUpperCase())+'</text>').join("");
 return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 330" role="img" aria-label="'+esc(p.name)+' illustration"><defs><linearGradient id="'+id+'"><stop stop-color="'+dark+'"/><stop offset=".33" stop-color="'+col+'"/><stop offset=".7" stop-color="'+col+'"/><stop offset="1" stop-color="'+dark+'"/></linearGradient></defs><ellipse cx="120" cy="313" rx="66" ry="9" fill="#000" opacity=".15"/>'+shapes[type]+'<rect x="72" y="145" width="96" height="115" rx="8" fill="#f3f1df" stroke="'+dark+'" stroke-width="2"/><rect x="77" y="150" width="86" height="17" fill="'+dark+'"/><text x="120" y="162" text-anchor="middle" font-family="Arial" fill="white" font-size="8" font-weight="bold">PRODUCT</text>'+text+'</svg>';
}
