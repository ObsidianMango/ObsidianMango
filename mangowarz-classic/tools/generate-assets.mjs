import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const ASSETS = path.join(ROOT, 'assets');
const palette = {
  ink: '#090b18', indigo: '#141633', indigo2: '#202657', asphalt: '#292d3d',
  smoke: '#69708a', paper: '#f4edda', orange: '#ff9d21', orange2: '#ff5d24',
  green: '#46f29a', blue: '#42c8ff', red: '#ff465f', gold: '#ffd166', purple: '#a879ff'
};

const manifest = [];
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const slug = value => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const hash = value => [...value].reduce((acc, c) => ((acc << 5) - acc + c.charCodeAt(0)) >>> 0, 2166136261);
const colorsFor = id => {
  const accents = [palette.orange, palette.green, palette.blue, palette.red, palette.gold, palette.purple, palette.orange2];
  const n = hash(id);
  return [accents[n % accents.length], accents[(n >>> 5) % accents.length]];
};

function svgFrame(title, body, width = 256, height = 256, extra = '') {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-labelledby="title">
  <title id="title">${esc(title)}</title>
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${palette.indigo}"/><stop offset="1" stop-color="${palette.ink}"/></linearGradient>
    <linearGradient id="neon" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${palette.orange}"/><stop offset="1" stop-color="${palette.orange2}"/></linearGradient>
    <filter id="glow"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    ${extra}
  </defs>
  ${body}
</svg>`;
}

function addSvg(category, id, displayName, body, opts = {}) {
  const dir = path.join(ASSETS, category);
  fs.mkdirSync(dir, { recursive: true });
  const filename = `${id}.svg`;
  const width = opts.width ?? 256;
  const height = opts.height ?? 256;
  fs.writeFileSync(path.join(dir, filename), svgFrame(displayName, body, width, height, opts.defs ?? ''));
  manifest.push({
    id: `${category}.${id}`,
    displayName,
    category,
    path: `assets/${category}/${filename}`,
    format: 'svg',
    nativeDimensions: { width, height },
    alt: opts.alt ?? displayName,
    animationStates: opts.states ?? ['idle'],
    frameCount: opts.frames ?? 1,
    frameTimingMs: opts.timing ?? 0,
    anchorPoint: opts.anchor ?? { x: 0.5, y: 0.5 },
    provenance: 'Original deterministic SVG artwork created for MangoWarz Classic; CC BY-NC-SA 4.0 project license.',
    mode: opts.mode ?? 'both',
    fallbackAsset: opts.fallback ?? 'assets/ui/image-fallback.svg',
    preloadPriority: opts.priority ?? 'lazy'
  });
}

function addRaster(category, id, displayName, filename, width, height, opts = {}) {
  manifest.push({
    id: `${category}.${id}`, displayName, category, path: `assets/${category}/${filename}`,
    format: filename.split('.').pop(), nativeDimensions: { width, height }, alt: opts.alt ?? displayName,
    animationStates: opts.states ?? ['idle'], frameCount: 1, frameTimingMs: 0,
    anchorPoint: opts.anchor ?? { x: 0.5, y: 0.5 },
    provenance: 'Original OpenAI image-generation output created exclusively for MangoWarz Classic; no external source art.',
    mode: opts.mode ?? 'both', fallbackAsset: opts.fallback ?? 'assets/ui/image-fallback.svg', preloadPriority: opts.priority ?? 'lazy'
  });
}

function pixelBackdrop(accent, secondary, police = false) {
  return `<rect width="256" height="256" rx="22" fill="url(#bg)"/>
  <path d="M0 188h256v68H0z" fill="#101323"/><path d="M0 208h256" stroke="${palette.smoke}" stroke-width="3" stroke-dasharray="16 11" opacity=".45"/>
  <path d="M14 178V72h42v106M66 178V39h55v139M132 178V87h35v91M177 178V55h64v123" fill="${palette.asphalt}" stroke="#050711" stroke-width="6"/>
  <g fill="${accent}" opacity=".86"><path d="M24 88h10v10H24zM39 88h10v10H39zM78 56h12v12H78zM99 56h12v12H99zM190 72h12v12h-12zM214 72h12v12h-12z"/></g>
  <g fill="${secondary}" opacity=".72"><path d="M78 82h12v12H78zM99 82h12v12H99zM141 104h12v12h-12zM190 98h12v12h-12zM214 98h12v12h-12z"/></g>
  <path d="M0 183h256" stroke="${accent}" stroke-width="3" opacity=".65"/>
  ${police ? `<path d="M0 0h128v16H0z" fill="${palette.red}" opacity=".45"/><path d="M128 0h128v16H128z" fill="${palette.blue}" opacity=".45"/><path d="M40 222h176" stroke="${palette.red}" stroke-width="8" opacity=".18" filter="url(#glow)"/>` : ''}`;
}

function personArt(id, role = 'civilian', state = 'neutral') {
  const [a, b] = colorsFor(id);
  const police = role === 'police';
  const pose = {
    trading: '<path d="M151 133l50 16-4 18-52-7z"/>', traveling: '<path d="M112 174l-18 56H72l17-65m46 7 25 53h-24l-25-47"/>',
    running: '<path d="M102 171l-48 43-15-16 44-51m50 18 50 29-11 19-58-28"/>', aiming: '<path d="M145 123l61 8-2 18-64 5z"/>',
    firing: `<path d="M203 124l34 15-35 12z" fill="${palette.gold}" filter="url(#glow)"/>`, hit: `<path d="M35 92l38 13-24 31 39 10-62 30 15-45-27-18z" fill="${palette.red}" opacity=".78"/>`,
    injured: `<path d="M70 164l94 0" stroke="${palette.red}" stroke-width="9" stroke-dasharray="10 8"/>`, critical: `<circle cx="128" cy="128" r="108" fill="none" stroke="${palette.red}" stroke-width="10" opacity=".72"/>`,
    victorious: `<path d="M133 72l37-48 14 13-34 54z"/>`, defeated: `<path d="M48 205h156" stroke="${palette.smoke}" stroke-width="20"/><path d="M92 160l-31 45m70-39 44 39"/>`
  }[state] ?? '';
  return `<rect width="256" height="256" rx="22" fill="url(#bg)"/><circle cx="128" cy="88" r="38" fill="#8f5a3b" stroke="#050711" stroke-width="8"/>
  <path d="M91 82q8-47 42-43 36 5 41 43-23-15-83 0z" fill="${police ? '#18264b' : '#24263b'}" stroke="#050711" stroke-width="8"/>
  ${police ? `<path d="M103 48h53l9 17H94z" fill="${a}"/><path d="M122 51h16v16h-16z" fill="${palette.gold}"/>` : `<path d="M103 52q26-23 53 5" stroke="${a}" stroke-width="8"/>`}
  <path d="M83 126q45-32 90 0l17 73H66z" fill="${police ? '#1b2850' : a}" stroke="#050711" stroke-width="9"/>
  <path d="M105 124h46v90h-46z" fill="${police ? b : palette.indigo}" opacity=".62"/>
  <path d="M84 132l-52 51 14 16 56-42m71-24 47 51-17 15-50-43" fill="none" stroke="${police ? '#253460' : '#8f5a3b'}" stroke-width="22" stroke-linecap="square"/>
  <path d="M91 196l-12 47h34l15-35 15 35h35l-17-47z" fill="#15192b" stroke="#050711" stroke-width="8"/>
  <g fill="#050711"><rect x="109" y="83" width="8" height="6"/><rect x="143" y="83" width="8" height="6"/></g>
  <path d="M116 104q12 8 25 0" fill="none" stroke="#2b1520" stroke-width="5"/>
  ${pose}`;
}

const productMotifs = {
  acid: `<path d="M78 72h100v112H78z" fill="#ffe36d" stroke="#090b18" stroke-width="10"/><path d="M92 88h30v30H92zm45 0h27v30h-27zm-45 45h30v35H92zm45 0h27v35h-27z" fill="#ff5d91"/>`,
  cocaine: `<path d="M51 175l61-112 97 112z" fill="#f7f8ff" stroke="#090b18" stroke-width="10"/><path d="M87 150l31-60 43 60z" fill="#cad6f4"/>`,
  hashish: `<path d="M64 77l104-25 28 118-104 25z" fill="#8a4d2c" stroke="#090b18" stroke-width="10"/><path d="M91 98l59-14 14 59-59 14z" fill="#b86b34"/>`,
  heroin: `<path d="M91 54h74v35l19 26v82H72v-82l19-26z" fill="#ab72ff" stroke="#090b18" stroke-width="10"/><path d="M93 123h70v49H93z" fill="#e1c7ff"/>`,
  ludes: `<g stroke="#090b18" stroke-width="9"><path d="M53 99q0-34 34-34h15v68H87q-34 0-34-34z" fill="#42c8ff"/><path d="M102 65h15q34 0 34 34t-34 34h-15z" fill="#f4edda"/><path d="M100 151q0-25 25-25h12v50h-12q-25 0-25-25z" fill="#ff9d21"/><path d="M137 126h12q25 0 25 25t-25 25h-12z" fill="#f4edda"/></g>`,
  mda: `<path d="M128 48l19 45 49 4-37 32 11 48-42-25-42 25 11-48-37-32 49-4z" fill="#ff5dac" stroke="#090b18" stroke-width="10"/><circle cx="128" cy="119" r="22" fill="#ffd166"/>`,
  opium: `<path d="M128 184V98" stroke="#46f29a" stroke-width="16"/><path d="M128 105q-59-13-54-56 46-9 54 34 8-43 54-34 5 43-54 56z" fill="#ff9d21" stroke="#090b18" stroke-width="9"/><circle cx="128" cy="91" r="25" fill="#382144"/>`,
  pcp: `<path d="M82 61h92v137H82z" fill="#42c8ff" stroke="#090b18" stroke-width="10"/><path d="M96 80h64v28H96z" fill="#f4edda"/><path d="M101 131h54v46h-54z" fill="#22568a"/>`,
  peyote: `<circle cx="128" cy="128" r="79" fill="#50c878" stroke="#090b18" stroke-width="11"/><path d="M128 52v152M52 128h152M74 74l108 108M182 74L74 182" stroke="#b8f7a7" stroke-width="8"/><circle cx="128" cy="128" r="19" fill="#ff7bba"/>`,
  shrooms: `<path d="M83 116q0-62 47-62t47 62z" fill="#ff5d91" stroke="#090b18" stroke-width="10"/><path d="M112 111h36l18 89H94z" fill="#f4edda" stroke="#090b18" stroke-width="10"/><circle cx="105" cy="86" r="8" fill="#f4edda"/><circle cx="147" cy="78" r="10" fill="#f4edda"/>`,
  speed: `<path d="M144 42L69 139h50l-10 75 78-106h-51z" fill="#ffd166" stroke="#090b18" stroke-width="10"/>`,
  weed: `<path d="M128 205v-65M126 150q-52-6-63-54 39-5 62 27-7-56 3-83 25 42 4 83 23-32 62-27-12 48-64 54z" fill="#46f29a" stroke="#090b18" stroke-width="9"/>`
};

for (const [id, motif] of Object.entries(productMotifs)) {
  addSvg('products', id, id[0].toUpperCase() + id.slice(1), `<rect width="256" height="256" rx="32" fill="url(#bg)"/><circle cx="128" cy="128" r="101" fill="none" stroke="${colorsFor(id)[0]}" stroke-width="7" opacity=".25"/>${motif}`, {
    states: ['ordinary','cheap','expensive','selected','owned','unavailable','confiscated','dropped','found'], mode: 'classic', priority: 'high'
  });
}

const playerStates = ['trading','traveling','running','aiming','firing','hit','injured','critical','victorious','defeated'];
for (const state of playerStates) addSvg('characters', `player-${state}`, `Player ${state}`, personArt(`player-${state}`, 'civilian', state), { states: [state], mode: 'both' });
addRaster('characters','player-neutral','Player neutral','player-neutral.webp',512,512,{states:['neutral'],priority:'high'});

const namedCops = ['officer-hardass','officer-bob','agent-smith'];
const genericCops = ['veteran-officer','plainclothes-officer','heavy-response-officer','k9-officer','deputy','police-dog'];
for (const id of [...namedCops, ...genericCops]) {
  const isDog = id === 'police-dog';
  const [a,b] = colorsFor(id);
  const body = isDog ? `<rect width="256" height="256" rx="22" fill="url(#bg)"/><path d="M51 149q10-67 83-65l40-28 25 13-15 45q25 25 13 65l-32 31H69z" fill="#4d382e" stroke="#090b18" stroke-width="10"/><path d="M113 92l-21-42 43 29m42-6 27-30 4 48" fill="#4d382e" stroke="#090b18" stroke-width="10"/><circle cx="171" cy="116" r="7" fill="${a}"/><path d="M158 141h31" stroke="#090b18" stroke-width="8"/><path d="M58 165h132" stroke="${b}" stroke-width="13"/>` : personArt(id,'police','neutral');
  addSvg('cops', id, id.split('-').map(x=>x[0].toUpperCase()+x.slice(1)).join(' '), body, { states:['idle','entering','pursuing','aiming','attacking','hit','injured','defeated','player-escaped'], mode:'classic' });
}
addRaster('cops','patrol-officer','Patrol officer','patrol-officer.webp',512,512,{states:['idle','entering','pursuing','aiming','attacking','hit','injured','defeated','player-escaped'],mode:'classic',priority:'high'});

const civilians = ['loan-shark','banker','weapon-seller','doctor','bartender','street-dealer','friend','mugger','subway-passenger','strange-woman','informant','market-buyer','market-seller','found-goods-owner','found-cash-owner','abandoned-property-witness', ...Array.from({length:8},(_,i)=>`pedestrian-${i+1}`)];
for (const id of civilians) addSvg('civilians', id, id.split('-').map(x=>x[0].toUpperCase()+x.slice(1)).join(' '), personArt(id,'civilian','neutral'), { mode:'classic' });

const weaponDefs = ['baretta','.38-special','ruger','saturday-night-special'];
for (const id of weaponDefs) {
  const [a,b] = colorsFor(id);
  addSvg('weapons', slug(id), id.replaceAll('-',' ').replace(/^./,c=>c.toUpperCase()), `<rect width="256" height="256" rx="22" fill="url(#bg)"/><path d="M41 86h148v57h-51l-11 75H82l15-75H41z" fill="${a}" stroke="#090b18" stroke-width="11"/><path d="M58 102h106v15H58zm61 54h30l-8 43h-30z" fill="${b}" opacity=".75"/><path d="M189 97h31v25h-31z" fill="${palette.smoke}"/>`, { states:['store','street','owned','selected','empty'], mode:'classic' });
}

const combatItems = ['ammunition','empty-weapon','muzzle-flash','bullet-impact','hit-effect','miss-effect','police-badge','handcuffs','radio','flashlight','medical-kit','bandage','protective-vest','evidence-bag'];
for (const id of combatItems) {
  const [a,b] = colorsFor(id);
  addSvg('weapons', id, id.split('-').map(x=>x[0].toUpperCase()+x.slice(1)).join(' '), `<rect width="256" height="256" rx="22" fill="url(#bg)"/><path d="M128 39l24 54 59 6-44 39 13 58-52-30-52 30 13-58-44-39 59-6z" fill="${a}" stroke="#090b18" stroke-width="10"/><circle cx="128" cy="128" r="30" fill="${b}" opacity=".75"/>`, { mode:'classic' });
}

const equipment = ['standard-coat','upgraded-coat','damaged-coat','full-capacity-coat','empty-capacity-coat','wallet-cash','bank-deposit','debt-document','travel-ticket','map','event-log-phone','medical-supplies','information-tip','locked-item','sold-item','purchased-item'];
for (const id of equipment) {
  const [a,b] = colorsFor(id);
  const coat = id.includes('coat');
  const motif = coat ? `<path d="M79 61l49-23 49 23 37 54-33 23-13-21v101H88V117l-13 21-33-23z" fill="${a}" stroke="#090b18" stroke-width="10"/><path d="M128 49v158" stroke="${b}" stroke-width="8"/>` : `<rect x="60" y="57" width="136" height="151" rx="18" fill="${a}" stroke="#090b18" stroke-width="11"/><path d="M79 83h98v23H79zm0 42h98v58H79z" fill="${b}" opacity=".72"/><circle cx="164" cy="155" r="12" fill="${palette.gold}"/>`;
  addSvg('items', id, id.split('-').map(x=>x[0].toUpperCase()+x.slice(1)).join(' '), `<rect width="256" height="256" rx="22" fill="url(#bg)"/>${motif}`, { mode:'classic' });
}

const locations = [
  ['bronx',palette.orange,palette.green],['ghetto',palette.purple,palette.orange],['central-park',palette.green,palette.gold],
  ['manhattan',palette.blue,palette.orange],['coney-island',palette.red,palette.blue],['brooklyn',palette.gold,palette.purple]
];
for (const [id,a,b] of locations) {
  for (const variant of ['day','travel','market','alert','map']) {
    if (id === 'bronx' && variant === 'day') continue;
    const police = variant === 'alert';
    addSvg('locations', `${id}-${variant}`, `${id.replaceAll('-',' ')} ${variant}`, `${pixelBackdrop(a,b,police)}<path d="M28 232h200" stroke="${variant === 'travel' ? palette.orange : a}" stroke-width="${variant === 'travel' ? 12 : 5}" opacity=".8"/>`, {
      width:256,height:256,mode:'classic',states:[variant],priority:variant==='day'?'high':'lazy'
    });
  }
}
addRaster('locations','bronx-day','Bronx establishing scene','bronx-night.webp',960,540,{states:['day'],mode:'classic',priority:'high'});

const services = ['bronx-loan-shark-room','manhattan-bank','street-weapon-offer','clinic','bar-information-venue','subway-platform'];
for (const id of services) {
  const [a,b] = colorsFor(id);
  addSvg('services', id, id.split('-').map(x=>x[0].toUpperCase()+x.slice(1)).join(' '), `${pixelBackdrop(a,b,false)}<path d="M45 125h166v91H45z" fill="#171a29" stroke="#090b18" stroke-width="8"/><path d="M62 143h132v17H62zm0 32h92v20H62z" fill="${a}" opacity=".75"/><circle cx="182" cy="185" r="17" fill="${b}"/>`, { mode:'classic' });
}

const encounters = ['police-stop','police-chase','shootout','successful-escape','failed-escape','mugging','robbery','found-cash','found-goods','lost-goods','friend-gift','medical-emergency','coat-upgrade-offer','coat-damage','weapon-offer','market-shortage','market-flood','quiet-journey','final-victory','final-defeat','street-tip','risky-stranger','abandoned-property'];
for (const id of encounters) {
  const [a,b] = colorsFor(id);
  const danger = /police|chase|shootout|failed|mugging|robbery|damage|defeat|emergency/.test(id);
  addSvg('encounters', id, id.split('-').map(x=>x[0].toUpperCase()+x.slice(1)).join(' '), `${pixelBackdrop(a,b,danger)}<path d="M128 45l29 56 62 9-45 44 11 62-57-29-57 29 11-62-45-44 62-9z" fill="${a}" stroke="#090b18" stroke-width="10" opacity=".92"/><circle cx="128" cy="138" r="27" fill="${b}"/>`, { width:256,height:256,mode:'classic',priority:danger?'high':'lazy' });
}

const uiIcons = ['buy','sell','travel','bank','debt','health','capacity','inventory','weapon','settings','sound','haptics','save','warning','information','close','previous','next','quantity-plus','quantity-minus','max-quantity','ticker','day','map-pin','locked','unlocked','achievement-frame','score-bronze','score-silver','score-gold','image-fallback','history','services','finish','share'];
for (const id of uiIcons) {
  const [a,b] = colorsFor(id);
  addSvg('ui', id, id.split('-').map(x=>x[0].toUpperCase()+x.slice(1)).join(' '), `<rect width="64" height="64" rx="14" fill="${palette.indigo}"/><path d="M32 8l7 15 17 2-12 12 3 17-15-8-15 8 3-17L8 25l17-2z" fill="${a}" stroke="#090b18" stroke-width="3"/><circle cx="32" cy="32" r="7" fill="${b}"/>`, { width:64,height:64,mode:'both',priority:'high' });
}

const effects = ['cash-increase','cash-decrease','debt-increase','bank-interest','purchase-success','sale-success','market-shortage','market-flood','player-damage','enemy-damage','critical-health','police-lights','travel','escape','victory','defeat','new-high-score'];
for (const id of effects) {
  const [a,b] = colorsFor(id);
  addSvg('effects', id, id.split('-').map(x=>x[0].toUpperCase()+x.slice(1)).join(' '), `<rect width="128" height="128" fill="none"/><path d="M64 5l13 37 39-9-24 31 31 24-40 1-1 40-23-32-32 24 10-39L0 69l37-13z" fill="${a}" opacity=".9"/><circle cx="64" cy="64" r="20" fill="${b}"/>`, { width:128,height:128,mode:'both',states:['start','peak','fade'],frames:3,timing:120 });
}

const extended = [
  ['car',45000],['truck',69000],['plane',170000],['boat',95000],['house',250000],['hotel',510000],['island',740000],['strip-club',1000000],['earth',100000000],['galaxy',69000000000],['hired-security',50000],['stripper',89000],['dog',3000],['wife',340000]
];
for (const [id] of extended) {
  const [a,b] = colorsFor(id);
  addSvg('extended-mode', id, id.split('-').map(x=>x[0].toUpperCase()+x.slice(1)).join(' '), `${pixelBackdrop(a,b,false)}<path d="M48 180l25-67 55-39 55 39 25 67z" fill="${a}" stroke="#090b18" stroke-width="10"/><path d="M83 130h90v47H83z" fill="${b}" opacity=".72"/><circle cx="87" cy="188" r="16" fill="#090b18"/><circle cx="173" cy="188" r="16" fill="#090b18"/>`, { mode:'extended',states:['purchase','owned','selected','sold','unavailable'] });
}
for (const id of ['divorce-event','vehicle-travel-car','vehicle-travel-truck','vehicle-travel-plane','vehicle-travel-boat','property-portfolio']) {
  const [a,b]=colorsFor(id);
  addSvg('extended-mode',id,id.split('-').map(x=>x[0].toUpperCase()+x.slice(1)).join(' '),`${pixelBackdrop(a,b,/divorce/.test(id))}<circle cx="128" cy="133" r="70" fill="${a}" stroke="#090b18" stroke-width="10"/><path d="M85 133h86M128 90v86" stroke="${b}" stroke-width="13"/>`,{mode:'extended'});
}

function brandingScene(id, title, mood = 'normal') {
  const victory = mood === 'victory';
  const defeat = mood === 'defeat';
  const a = victory ? palette.green : defeat ? palette.red : palette.orange;
  return `${pixelBackdrop(a,palette.blue,defeat)}<circle cx="128" cy="126" r="62" fill="${a}" stroke="#090b18" stroke-width="10"/><path d="M128 73q54 41 0 105Q74 137 128 73z" fill="${palette.orange}"/><path d="M128 82q-5-35 35-44" fill="none" stroke="${palette.green}" stroke-width="12"/>`;
}
addSvg('branding','compact-logo','MangoWarz compact logo',brandingScene('compact-logo','MangoWarz'),{width:256,height:256,priority:'high'});
addSvg('branding','app-icon','MangoWarz app icon',`<g transform="scale(2)">${brandingScene('app-icon','MangoWarz')}</g>`,{width:512,height:512,priority:'high'});
addSvg('branding','maskable-icon','MangoWarz maskable app icon',`<rect width="512" height="512" fill="${palette.indigo}"/><g transform="translate(64 64) scale(1.5)">${brandingScene('maskable','MangoWarz')}</g>`,{width:512,height:512,priority:'high'});
addSvg('branding','favicon','MangoWarz favicon',`<g transform="scale(.25)">${brandingScene('favicon','MangoWarz')}</g>`,{width:64,height:64,priority:'high'});
addSvg('branding','logo','MangoWarz Classic logo',`${pixelBackdrop(palette.orange,palette.blue,false)}<path d="M52 79h152v98H52z" fill="${palette.indigo}" stroke="${palette.orange}" stroke-width="8"/><text x="128" y="120" text-anchor="middle" fill="${palette.paper}" font-family="ui-monospace,monospace" font-size="25" font-weight="900">MANGOWARZ</text><text x="128" y="151" text-anchor="middle" fill="${palette.orange}" font-family="ui-monospace,monospace" font-size="24" font-weight="900">CLASSIC</text>`,{width:256,height:256,priority:'high'});
for (const [id,mood] of [['splash','normal'],['social-preview','normal'],['loading-screen','normal'],['title-skyline','normal'],['game-over','defeat'],['victory','victory']]) addSvg('branding',id,id.split('-').map(x=>x[0].toUpperCase()+x.slice(1)).join(' '),brandingScene(id,id,mood),{width:256,height:256,priority:'high'});

addRaster('branding','style-anchor','MangoWarz visual style anchor','style-anchor.png',512,512,{priority:'lazy'});
addRaster('products','street-vial','Fictional street vial concept','street-vial.webp',256,256,{mode:'classic'});
addRaster('branding','icon-192','MangoWarz 192 pixel app icon','icon-192.png',192,192,{priority:'high'});
addRaster('branding','icon-512','MangoWarz 512 pixel app icon','icon-512.png',512,512,{priority:'high'});
addRaster('branding','maskable-512','MangoWarz maskable PWA icon','maskable-512.png',512,512,{priority:'high'});
addRaster('branding','social-preview-raster','MangoWarz social preview','social-preview.webp',1200,630,{priority:'high'});
addRaster('branding','splash-raster','MangoWarz splash image','splash.webp',1280,720,{priority:'high'});

manifest.sort((a,b)=>a.id.localeCompare(b.id));
fs.writeFileSync(path.join(ASSETS,'asset-manifest.json'), JSON.stringify({version:1,generatedAt:'2026-08-22',style:{name:'Mango Noir 32',palette,notes:'Original crisp neo-retro pixel-inspired illustration. Raster style anchor plus deterministic SVG production assets.'},assets:manifest},null,2)+'\n');
console.log(`Generated ${manifest.length} manifest entries.`);
