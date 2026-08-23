import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..');
const out=path.join(root,'assets','classic-ui');
const productOut=path.join(out,'products');
const iconOut=path.join(out,'icons');
const locationOut=path.join(out,'locations');
for(const directory of [out,productOut,iconOut,locationOut])fs.mkdirSync(directory,{recursive:true});

const C={
  black:'#050505',ink:'#090a08',cream:'#f2e8c8',gold:'#e8ad35',frame:'#dfcc85',
  cyan:'#42aedd',green:'#78c850',red:'#d94b37',blue:'#1941b5',navy:'#071549',
  purple:'#762bb2',brick:'#78301f',orange:'#dc6b29',gray:'#8d8b76',white:'#fff8da'
};

const defs=`<defs>
  <pattern id="scan" width="4" height="4" patternUnits="userSpaceOnUse"><path d="M0 3.5h4" stroke="${C.cream}" stroke-width="1" opacity=".035"/></pattern>
  <pattern id="stars" width="19" height="17" patternUnits="userSpaceOnUse"><rect x="2" y="3" width="2" height="2" fill="${C.cyan}"/><rect x="13" y="10" width="1" height="1" fill="${C.blue}"/></pattern>
  <radialGradient id="vignette" cx="50%" cy="45%" r="75%"><stop offset="58%" stop-color="${C.black}" stop-opacity="0"/><stop offset="100%" stop-color="${C.black}" stop-opacity=".45"/></radialGradient>
</defs>`;

function svg(width,height,title,body,{background=C.black}={}){
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-labelledby="title" shape-rendering="crispEdges">
  <title id="title">${title}</title>${defs}<rect width="${width}" height="${height}" fill="${background}"/>${body}<rect width="${width}" height="${height}" fill="url(#scan)" pointer-events="none"/><rect width="${width}" height="${height}" fill="url(#vignette)" pointer-events="none"/></svg>`;
}

function save(relative,source){fs.writeFileSync(path.join(out,relative),`${source}\n`);}

function windows(x,y,columns,rows,color=C.gold,stepX=22,stepY=22){
  let result='';
  for(let row=0;row<rows;row++)for(let col=0;col<columns;col++){
    if((row*3+col*5)%7===1)continue;
    result+=`<rect x="${x+col*stepX}" y="${y+row*stepY}" width="7" height="9" fill="${color}"/>`;
  }
  return result;
}

const titleCity=svg(640,430,'Original MangoWarz 1985 pixel skyline',`
  <rect x="0" y="38" width="640" height="238" fill="url(#stars)"/>
  <path d="M0 276V214h36v-52h41v114h29v-83h45v83h26V126h42v150h28V173h55v103h25V98h35v178h20V151h49v125h31V185h39v91h26V134h46v142h28v-75h55v75z" fill="${C.ink}"/>
  <path d="M314 98h35v178h-35zm45 22h31v156h-31z" fill="${C.black}" stroke="${C.cream}" stroke-width="2"/>
  ${windows(9,226,27,3,C.cream,23,16)}
  ${windows(44,176,2,4,C.cyan,18,19)}${windows(185,145,2,6,C.gold,18,19)}${windows(455,153,2,6,C.cream,19,19)}
  <rect x="0" y="276" width="640" height="154" fill="${C.black}"/>
  <path d="M0 297h640M0 329h640" stroke="${C.blue}" stroke-width="3" stroke-dasharray="5 6"/>
  <g transform="translate(40 257)"><path d="M0 54h190v91H0z" fill="${C.black}" stroke="${C.green}" stroke-width="5"/><path d="M18 54L49 8h111l30 46" fill="${C.black}" stroke="${C.green}" stroke-width="5"/><path d="M37 119h119V59H37z" fill="${C.navy}" stroke="${C.green}" stroke-width="4"/><path d="M55 102h81" stroke="${C.cream}" stroke-width="6"/><path d="M94 71v31" stroke="${C.cyan}" stroke-width="7"/><path d="M80 86l14-15 14 15" fill="none" stroke="${C.cyan}" stroke-width="7"/></g>
  <g transform="translate(375 320)"><path d="M0 26h116v78H0z" fill="${C.gray}" stroke="${C.cream}" stroke-width="5"/><path d="M30 26V7h54v19" fill="none" stroke="${C.cream}" stroke-width="5"/><rect x="50" y="54" width="20" height="16" fill="${C.gold}"/><rect x="0" y="77" width="116" height="8" fill="${C.black}"/></g>
  <g transform="translate(530 337)" fill="none" stroke="${C.gold}" stroke-width="8"><circle cx="35" cy="35" r="31"/><path d="M48 17H31c-18 0-18 18 0 18h8c18 0 18 18 0 18H18M34 6v58"/></g>
`);
save('title-city.svg',titleCity);

const locationBodies={
  bronx:`<rect width="640" height="130" fill="url(#stars)"/><path d="M0 111h87V35h126v76h50V15h118v96h57V51h125v60h77v189H0z" fill="${C.black}"/>${windows(100,53,5,3,C.red,19,21)}${windows(279,38,4,3,C.cyan,20,21)}${windows(455,69,4,2,C.gold,20,21)}<path d="M0 206h640v94H0z" fill="${C.ink}"/><path d="M0 249h640" stroke="${C.cream}" stroke-width="3" stroke-dasharray="25 17"/><g transform="translate(190 194)"><path d="M0 26h126l32 30v38H0z" fill="${C.gold}" stroke="${C.black}" stroke-width="5"/><path d="M21 25l25-27h53l25 27" fill="${C.navy}" stroke="${C.black}" stroke-width="5"/><circle cx="32" cy="90" r="17" fill="${C.black}" stroke="${C.gray}" stroke-width="5"/><circle cx="130" cy="90" r="17" fill="${C.black}" stroke="${C.gray}" stroke-width="5"/></g><g transform="translate(470 128)"><rect width="138" height="100" fill="${C.black}" stroke="${C.green}" stroke-width="5"/><path d="M18 78h102M28 61h82M38 44h62" stroke="${C.green}" stroke-width="5"/><rect x="91" y="14" width="32" height="22" fill="${C.cream}"/></g>`,
  ghetto:`<rect width="640" height="112" fill="url(#stars)"/><path d="M0 85h74V35h76v50h39V8h127v77h52V43h108v42h43V24h121v276H0z" fill="${C.black}"/>${windows(204,30,5,3,C.orange,20,19)}${windows(383,59,4,2,C.cyan,20,18)}<path d="M194 54h230v124H194z" fill="${C.brick}" stroke="${C.cream}" stroke-width="4"/><path d="M213 75h36v27h-36zm58 0h36v27h-36zm58 0h36v27h-36zm58 0h20v27h-20z" fill="${C.cyan}"/><path d="M214 119h35v25h-35zm58 0h35v25h-35zm58 0h35v25h-35z" fill="${C.gold}"/><path d="M377 112h31v66h-31z" fill="${C.black}" stroke="${C.green}" stroke-width="4"/><path d="M185 108h196M201 151h166M205 103v53m56-53v53m57-53v53" fill="none" stroke="${C.gray}" stroke-width="4"/><rect y="178" width="640" height="122" fill="${C.ink}"/><path d="M0 247h640" stroke="${C.blue}" stroke-width="3" stroke-dasharray="17 12"/><path d="M48 86h138v92H48z" fill="${C.brick}" stroke="${C.cream}" stroke-width="3"/><path d="M61 158l29-35 28 16 30-43 25 62" fill="none" stroke="${C.green}" stroke-width="9"/><path d="M520 69v135M486 70h67" stroke="${C.gray}" stroke-width="7"/><rect x="489" y="61" width="24" height="18" fill="${C.gold}"/>`,
  'central-park':`<rect width="640" height="122" fill="url(#stars)"/><path d="M0 105h42V40h45v65h41V18h51v87h48V54h62v51h51V29h47v76h54V7h60v98h39V48h53v57h87v195H0z" fill="${C.black}"/>${windows(17,61,28,2,C.cyan,22,19)}<path d="M0 125h640v175H0z" fill="${C.navy}"/><path d="M271 300l44-175h55l42 175" fill="${C.gray}"/><g fill="${C.green}" stroke="${C.black}" stroke-width="5"><path d="M18 215l47-90 46 90z"/><path d="M76 232l54-112 55 112z"/><path d="M444 214l49-97 50 97z"/><path d="M507 239l61-122 61 122z"/></g><path d="M0 253h640v47H0z" fill="${C.ink}" opacity=".8"/>`,
  manhattan:`<rect width="640" height="112" fill="url(#stars)"/><path d="M0 205V70h57v135h36V20h86v185h32V53h72v152h37V3h80v202h40V45h64v160h35V78h101v222H0z" fill="${C.black}"/>${windows(18,91,27,5,C.gold,22,20)}<path d="M0 206h640v94H0z" fill="${C.ink}"/><path d="M0 257h640" stroke="${C.cyan}" stroke-width="3" stroke-dasharray="31 19"/><g transform="translate(405 204)"><path d="M0 24h146l27 26v38H0z" fill="${C.gold}" stroke="${C.black}" stroke-width="5"/><path d="M30 23L52 2h63l22 21" fill="${C.navy}" stroke="${C.black}" stroke-width="5"/><circle cx="35" cy="85" r="16" fill="${C.black}" stroke="${C.gray}" stroke-width="4"/><circle cx="142" cy="85" r="16" fill="${C.black}" stroke="${C.gray}" stroke-width="4"/></g>`,
  'coney-island':`<rect width="640" height="117" fill="url(#stars)"/><circle cx="493" cy="100" r="82" fill="none" stroke="${C.red}" stroke-width="7"/><path d="M493 18v164M411 100h164M435 42l116 116m0-116L435 158" stroke="${C.red}" stroke-width="4"/><path d="M0 171q44-86 89 0t90 0 90 0 90 0" fill="none" stroke="${C.gold}" stroke-width="8"/><path d="M0 190h640v110H0z" fill="${C.navy}"/><path d="M0 216q40-18 80 0t80 0 80 0 80 0 80 0 80 0 80 0 80 0" fill="none" stroke="${C.cyan}" stroke-width="6"/><path d="M0 251h640v49H0z" fill="${C.gray}"/><path d="M0 259h640M0 282h640" stroke="${C.cream}" stroke-width="3" stroke-dasharray="15 9"/>`,
  brooklyn:`<rect width="640" height="124" fill="url(#stars)"/><path d="M0 129h640v171H0z" fill="${C.navy}"/><path d="M0 225h640v75H0z" fill="${C.ink}"/><path d="M70 218V76M570 218V76M70 104h500M70 104l88 95m412-95l-88 95M70 104l-70 95m570-95l70 95" fill="none" stroke="${C.cream}" stroke-width="7"/><path d="M54 77h32V32h-32zm500 0h32V32h-32z" fill="${C.gold}"/><path d="M0 199h640" stroke="${C.red}" stroke-width="8"/><path d="M0 245h640" stroke="${C.cyan}" stroke-width="4" stroke-dasharray="28 18"/>`
};
for(const [id,body] of Object.entries(locationBodies))save(`locations/${id}.svg`,svg(640,300,`${id.replaceAll('-',' ')} pixel city scene`,body));

const productBodies={
  weed:`<path d="M32 55V29M31 35L18 19l4 19L9 31l14 13-12 2 20 7 20-7-12-2 14-13-17 7 5-19-10 16z" fill="${C.green}"/>`,
  acid:`<rect x="10" y="13" width="44" height="38" fill="${C.purple}"/><path d="M14 22l7-5 7 5 7-5 7 5 7-5 4 3M14 32l7-5 7 5 7-5 7 5 7-5 4 3M14 42l7-5 7 5 7-5 7 5 7-5 4 3" fill="none" stroke="${C.black}" stroke-width="4"/>`,
  speed:`<path d="M34 6L12 34h15l-7 24 31-35H37z" fill="${C.gold}"/>`,
  cocaine:`<path d="M32 7L6 54h52z" fill="${C.cream}"/><path d="M21 30h22M14 42h36M28 18h8" stroke="${C.black}" stroke-width="5"/>`,
  heroin:`<path d="M10 45l29-29 10 10-29 29zM39 11l5-5 14 14-5 5zM9 42l-4 13 13-4M18 40l7 7" fill="${C.red}"/>`,
  hashish:`<path d="M13 14h38v36H13z" fill="${C.orange}"/><path d="M18 21h28M18 31h28M18 41h28" stroke="${C.black}" stroke-width="5"/>`,
  ludes:`<path d="M9 25h25v14H9zM30 9h25v14H30zM32 42h23v13H32z" fill="${C.cyan}"/><path d="M21 25v14M42 9v14M43 42v13" stroke="${C.cream}" stroke-width="3"/>`,
  mda:`<path d="M32 7l25 25-25 25L7 32z" fill="${C.gold}"/><rect x="25" y="25" width="14" height="14" fill="${C.red}"/>`,
  opium:`<path d="M31 20V58" stroke="${C.green}" stroke-width="6"/><path d="M32 25C5 19 10 4 28 10 33-2 49 4 44 17c17 3 10 21-12 8z" fill="${C.red}"/><rect x="26" y="20" width="12" height="9" fill="${C.gold}"/>`,
  pcp:`<path d="M20 8h24v9H20zM16 17h32v40H16z" fill="${C.blue}"/><path d="M22 28h20v18H22z" fill="${C.cream}"/><path d="M27 37h10" stroke="${C.red}" stroke-width="4"/>`,
  peyote:`<circle cx="32" cy="32" r="23" fill="${C.green}"/><path d="M32 10v44M11 32h42M17 17l30 30m0-30L17 47" stroke="${C.black}" stroke-width="4"/><circle cx="32" cy="32" r="6" fill="${C.gold}"/>`,
  shrooms:`<path d="M26 31h12l6 27H20z" fill="${C.cream}"/><path d="M6 32C9 8 55 8 58 32z" fill="${C.purple}"/><rect x="16" y="19" width="7" height="7" fill="${C.cream}"/><rect x="40" y="16" width="7" height="7" fill="${C.cream}"/>`
};
for(const [id,body] of Object.entries(productBodies))save(`products/${id}.svg`,svg(64,64,`${id} pixel market icon`,`<rect x="2" y="2" width="60" height="60" fill="${C.navy}" stroke="${C.frame}" stroke-width="2"/>${body}`));

const iconBodies={
  market:`<rect x="8" y="28" width="48" height="28" fill="${C.green}"/><rect x="14" y="14" width="13" height="13" fill="${C.green}"/><rect x="37" y="9" width="13" height="18" fill="${C.green}"/><path d="M12 38h40M20 31v23M35 31v23M48 31v23" stroke="${C.black}" stroke-width="4"/>`,
  travel:`<path d="M16 6h32l8 10v32l-8 9H16l-8-9V16z" fill="${C.blue}"/><rect x="15" y="15" width="34" height="18" fill="${C.black}"/><rect x="19" y="19" width="11" height="9" fill="${C.cyan}"/><rect x="34" y="19" width="11" height="9" fill="${C.cyan}"/><circle cx="20" cy="43" r="5" fill="${C.cream}"/><circle cx="44" cy="43" r="5" fill="${C.cream}"/><path d="M16 58l-7 5m39-5 7 5" stroke="${C.blue}" stroke-width="5"/>`,
  bank:`<path d="M6 20L32 6l26 14zM10 23h44v7H10zM13 31h8v20h-8zm15 0h8v20h-8zm15 0h8v20h-8zM7 53h50v7H7z" fill="${C.cyan}"/>`,
  loan:`<path d="M4 35c15-4 21-21 38-20l17 10-15 6 11 6-19 17c-14 1-24-6-32-19z" fill="${C.red}"/><path d="M24 28l10 5-10 5M44 24l4 2" fill="none" stroke="${C.black}" stroke-width="4"/>`,
  clinic:`<path d="M23 4h18v19h19v18H41v19H23V41H4V23h19z" fill="${C.red}"/>`,
  stats:`<path d="M8 55V37h9v18zm14 0V24h9v31zm14 0V10h9v45zm14 0V30h8v25z" fill="${C.gold}"/><path d="M5 57h55" stroke="${C.cream}" stroke-width="4"/>`,
  log:`<path d="M12 5h35l7 7v47H12z" fill="${C.cyan}"/><path d="M20 18h26M20 29h26M20 40h19M20 51h23" stroke="${C.black}" stroke-width="4"/>`,
  options:`<path d="M10 16h44M10 32h44M10 48h44" stroke="${C.cream}" stroke-width="6"/><circle cx="24" cy="16" r="7" fill="${C.gold}"/><circle cx="43" cy="32" r="7" fill="${C.cyan}"/><circle cx="19" cy="48" r="7" fill="${C.green}"/>`
};
for(const [id,body] of Object.entries(iconBodies))save(`icons/${id}.svg`,svg(64,64,`${id} pixel interface icon`,body));

const map=svg(640,420,'Original abstract New York subway pixel map',`
  <path d="M87 36l98-25 91 38 102-24 115 42 55 104-28 93 64 95-123 41-119-21-101 32-117-61-75-90 24-98z" fill="${C.navy}"/>
  <path d="M72 76L193 147 277 97 329 196 431 109 558 72M50 291l104-65 98 57 94-64 92 86 144-37M121 32l48 105-18 109 62 129M277 49l-10 120 62 27 17 154M508 61l-77 48 7 196 65 80" fill="none" stroke="${C.frame}" stroke-width="7"/>
  <path d="M72 76L193 147 277 97" fill="none" stroke="${C.red}" stroke-width="5"/><path d="M329 196L431 109 558 72" fill="none" stroke="${C.green}" stroke-width="5"/><path d="M50 291l104-65 98 57" fill="none" stroke="${C.cyan}" stroke-width="5"/><path d="M346 219l92 86 144-37" fill="none" stroke="${C.orange}" stroke-width="5"/><path d="M121 32l48 105-18 109 62 129" fill="none" stroke="${C.purple}" stroke-width="5"/><path d="M277 49l-10 120 62 27 17 154" fill="none" stroke="${C.blue}" stroke-width="5"/>
  <g fill="${C.black}" stroke="${C.cream}" stroke-width="5">${[[72,76],[193,147],[277,97],[329,196],[431,109],[558,72],[50,291],[154,226],[252,283],[346,219],[438,305],[582,268],[121,32],[169,137],[151,246],[213,375],[277,49],[267,169],[346,350],[508,61],[438,305],[503,385]].map(([x,y])=>`<rect x="${x-8}" y="${y-8}" width="16" height="16"/>`).join('')}</g>
  <rect x="313" y="180" width="32" height="32" fill="${C.gold}" stroke="${C.cream}" stroke-width="5"/>
`);
save('subway-map.svg',map);

const manifest={
  version:1,
  generatedAt:new Date().toISOString().slice(0,10),
  style:'MangoWarz 1985 Pixel',
  palette:C,
  provenance:'Original deterministic coded SVG pixel art created for MangoWarz Classic. No external artwork or game assets were copied.',
  assets:[
    {id:'title-city',path:'assets/classic-ui/title-city.svg',width:640,height:430,alt:'Pixel skyline, subway entrance, briefcase and dollar coin'},
    {id:'subway-map',path:'assets/classic-ui/subway-map.svg',width:640,height:420,alt:'Abstract pixel-art subway network'},
    ...Object.keys(locationBodies).map(id=>({id:`location-${id}`,path:`assets/classic-ui/locations/${id}.svg`,width:640,height:300,alt:`Pixel-art ${id.replaceAll('-',' ')} street scene`})),
    ...Object.keys(productBodies).map(id=>({id:`product-${id}`,path:`assets/classic-ui/products/${id}.svg`,width:64,height:64,alt:`${id} market icon`})),
    ...Object.keys(iconBodies).map(id=>({id:`icon-${id}`,path:`assets/classic-ui/icons/${id}.svg`,width:64,height:64,alt:`${id} interface icon`}))
  ]
};
fs.writeFileSync(path.join(out,'asset-manifest.json'),`${JSON.stringify(manifest,null,2)}\n`);
console.log(`Generated ${manifest.assets.length} original reference-style pixel assets.`);
