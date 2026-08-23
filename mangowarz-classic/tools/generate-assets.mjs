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
  const n = hash(id);
  const skinTones = ['#5f3828','#7b4930','#9b6445','#b97855','#d49a75','#edbd98'];
  const skin = skinTones[(n >>> 3) % skinTones.length];
  const headWidth = 31 + (n % 8);
  const torsoInset = 67 + ((n >>> 7) % 13);
  const hairVariant = (n >>> 11) % 7;
  const hair = police ? '' : [
    `<path d="M${128-headWidth} 83q2-48 ${headWidth} -48t${headWidth} 48q-18-18-${headWidth*2} 0z" fill="#171323" stroke="#050711" stroke-width="7"/>`,
    `<path d="M92 82q-3-48 36-50 42 2 40 53l-15-27-12 20-14-24-15 26z" fill="#40271d" stroke="#050711" stroke-width="7"/>`,
    `<path d="M93 76q9-42 35-42 31 0 38 44-21-12-73-2z" fill="#d7a74a" stroke="#050711" stroke-width="7"/><path d="M90 70h79" stroke="#ff9d21" stroke-width="8"/>`,
    `<path d="M97 72q10-31 31-31t31 31v34q-8-22-18-34-13 18-44 31z" fill="#121525" stroke="#050711" stroke-width="8"/>`,
    `<path d="M107 48l21-21 21 21 11 33q-27-14-64 1z" fill="#7a2945" stroke="#050711" stroke-width="7"/>`,
    `<path d="M94 77q2-39 34-39t35 39h-14l-8-21-13 17-13-17-8 21z" fill="#26202f" stroke="#050711" stroke-width="7"/>`,
    `<path d="M93 75q8-35 35-35t36 35z" fill="${b}" stroke="#050711" stroke-width="7"/><path d="M85 75h88" stroke="#050711" stroke-width="9"/>`
  ][hairVariant];
  const policeHeadgear = {
    'officer-hardass': `<path d="M88 65h80l-13-26h-54z" fill="#111a38" stroke="#050711" stroke-width="7"/><path d="M101 45h54" stroke="${palette.red}" stroke-width="7"/>`,
    'officer-bob': `<path d="M92 67q6-35 36-35t36 35z" fill="#203766" stroke="#050711" stroke-width="7"/><path d="M84 67h89" stroke="${palette.gold}" stroke-width="7"/>`,
    'agent-smith': `<path d="M94 66h68l-7-31h-54z" fill="#172f34" stroke="#050711" stroke-width="7"/><path d="M107 44h42" stroke="${palette.green}" stroke-width="6"/>`,
    'veteran-officer': `<path d="M91 67h74l-15-30h-44z" fill="#24284c" stroke="#050711" stroke-width="7"/><path d="M128 38v29" stroke="${palette.gold}" stroke-width="5"/>`,
    'plainclothes-officer': `<path d="M96 69q8-35 32-35t32 35" fill="#383243" stroke="#050711" stroke-width="8"/>`,
    'heavy-response-officer': `<path d="M87 74l13-41h56l13 41-18 18h-46z" fill="#12182d" stroke="#050711" stroke-width="8"/><path d="M101 57h54" stroke="${palette.blue}" stroke-width="8"/>`,
    'k9-officer': `<path d="M91 68q5-33 37-33t37 33z" fill="#1b3157" stroke="#050711" stroke-width="7"/><path d="M87 68h82" stroke="${palette.green}" stroke-width="7"/>`,
    deputy: `<path d="M82 65h92l-28-19-18-30-18 30z" fill="#463722" stroke="#050711" stroke-width="7"/><path d="M91 65h74" stroke="${palette.gold}" stroke-width="6"/>`
  }[id] ?? `<path d="M92 67q7-34 36-34t36 34z" fill="#18264b" stroke="#050711" stroke-width="7"/>`;
  const civilianProps = {
    'loan-shark': `<path d="M99 142q29 28 58 0" fill="none" stroke="${palette.gold}" stroke-width="7"/><path d="M159 103h35" stroke="${palette.orange}" stroke-width="7"/><circle cx="196" cy="103" r="5" fill="${palette.red}"/>`,
    banker: `<g fill="none" stroke="#090b18" stroke-width="5"><rect x="101" y="79" width="22" height="14" rx="4"/><rect x="137" y="79" width="22" height="14" rx="4"/><path d="M123 85h14"/></g><rect x="155" y="137" width="57" height="72" rx="6" fill="${palette.blue}" stroke="#050711" stroke-width="7"/>`,
    'weapon-seller': `<path d="M151 145h75v54h-75z" fill="#292d3d" stroke="#050711" stroke-width="8"/><path d="M170 145q0-23 18-23t18 23" fill="none" stroke="${palette.orange}" stroke-width="7"/>`,
    doctor: `<path d="M99 128v75m58-75v75" stroke="#f4edda" stroke-width="26"/><circle cx="128" cy="156" r="21" fill="none" stroke="${palette.blue}" stroke-width="7"/><path d="M128 145v22m-11-11h22" stroke="${palette.red}" stroke-width="6"/>`,
    bartender: `<path d="M170 134h24l8 62h-40z" fill="${palette.green}" stroke="#050711" stroke-width="7"/><path d="M176 115h13v22h-13z" fill="${palette.gold}"/>`,
    'street-dealer': `<path d="M69 126q59-51 118 0" fill="none" stroke="#050711" stroke-width="15"/><rect x="153" y="154" width="57" height="49" rx="8" fill="${b}" stroke="#050711" stroke-width="7"/>`,
    friend: `<path d="M168 149h38v44h-38z" fill="${palette.orange}" stroke="#050711" stroke-width="7"/><path d="M206 158q22 3 13 20-5 9-13 6" fill="none" stroke="${palette.orange}" stroke-width="7"/>`,
    mugger: `<path d="M92 75q35-39 72 0v30H92z" fill="#101323" stroke="#050711" stroke-width="8"/><path d="M101 85h54" stroke="${palette.red}" stroke-width="8"/>`,
    'subway-passenger': `<path d="M91 84q2-36 37-36t37 36" fill="none" stroke="${palette.blue}" stroke-width="8"/><rect x="84" y="78" width="17" height="32" rx="7" fill="${palette.blue}"/><rect x="155" y="78" width="17" height="32" rx="7" fill="${palette.blue}"/>`,
    'strange-woman': `<path d="M91 73q-17 40 2 92m72-92q18 40-1 92" fill="none" stroke="${palette.purple}" stroke-width="16"/><path d="M128 139l13 21-13 21-13-21z" fill="${palette.gold}"/>`,
    informant: `<path d="M87 83h33m20 0h33" stroke="#090b18" stroke-width="10"/><path d="M120 83h20" stroke="#090b18" stroke-width="5"/><rect x="173" y="132" width="35" height="61" rx="7" fill="${palette.blue}" stroke="#050711" stroke-width="7"/>`,
    'market-buyer': `<rect x="159" y="132" width="59" height="77" rx="5" fill="#f4edda" stroke="#050711" stroke-width="7"/><path d="M174 151h29m-29 17h29m-29 17h20" stroke="${palette.blue}" stroke-width="5"/>`,
    'market-seller': `<path d="M155 167h75v50h-75z" fill="#8a4d2c" stroke="#050711" stroke-width="8"/><path d="M168 180h14m14 0h20" stroke="${palette.gold}" stroke-width="7"/>`,
    'found-goods-owner': `<path d="M153 149l38-22 36 22v57h-74z" fill="${palette.orange}" stroke="#050711" stroke-width="8"/><path d="M191 128v78" stroke="${palette.indigo}" stroke-width="6"/>`,
    'found-cash-owner': `<path d="M157 145h69v47h-69z" fill="#f4edda" stroke="#050711" stroke-width="7"/><path d="M158 146l34 26 34-26" fill="none" stroke="${palette.green}" stroke-width="6"/>`,
    'abandoned-property-witness': `<path d="M175 127l-12 102" stroke="#8a5a34" stroke-width="9"/><path d="M159 128q17-23 35 0" fill="none" stroke="#8a5a34" stroke-width="8"/>`,
    'pedestrian-1': `<path d="M162 124q24-42 48 0" fill="none" stroke="${palette.orange}" stroke-width="8"/><path d="M186 124v84" stroke="${palette.orange}" stroke-width="7"/>`,
    'pedestrian-2': `<path d="M167 142h48v57h-48z" fill="${palette.green}" stroke="#050711" stroke-width="7"/>`,
    'pedestrian-3': `<circle cx="190" cy="164" r="29" fill="none" stroke="${palette.blue}" stroke-width="8"/><path d="M190 135v58m-29-29h58" stroke="${palette.blue}" stroke-width="5"/>`,
    'pedestrian-4': `<path d="M168 136h41l12 68h-65z" fill="${palette.purple}" stroke="#050711" stroke-width="7"/>`,
    'pedestrian-5': `<rect x="174" y="131" width="37" height="70" rx="6" fill="#15192b" stroke="${palette.gold}" stroke-width="6"/><circle cx="192" cy="184" r="5" fill="${palette.gold}"/>`,
    'pedestrian-6': `<path d="M168 139l44 0 13 47-35 26-35-26z" fill="${palette.red}" stroke="#050711" stroke-width="7"/>`,
    'pedestrian-7': `<path d="M169 142h53v53h-53z" fill="${palette.orange}" stroke="#050711" stroke-width="7"/><path d="M181 142q0-19 15-19t15 19" fill="none" stroke="${palette.orange}" stroke-width="6"/>`,
    'pedestrian-8': `<path d="M174 135l39 18-16 54-39-18z" fill="${palette.blue}" stroke="#050711" stroke-width="7"/><circle cx="194" cy="168" r="11" fill="${palette.gold}"/>`
  }[id] ?? '';
  const policeProps = {
    'officer-hardass': `<path d="M73 134h110v33H73z" fill="#15192b" stroke="${palette.red}" stroke-width="6"/><path d="M188 129h28v70h-28z" fill="#090b18" stroke="#050711" stroke-width="7"/>`,
    'officer-bob': `<path d="M112 102q16 14 32 0" fill="none" stroke="#472716" stroke-width="8"/><circle cx="179" cy="150" r="18" fill="${palette.gold}"/>`,
    'agent-smith': `<path d="M101 82h22m14 0h22" stroke="#090b18" stroke-width="9"/><path d="M123 82h14" stroke="#090b18" stroke-width="4"/><rect x="177" y="130" width="34" height="73" rx="4" fill="#183d44" stroke="#050711" stroke-width="7"/>`,
    'veteran-officer': `<path d="M101 82h24" stroke="#090b18" stroke-width="10"/><path d="M93 78l38 14" stroke="${palette.red}" stroke-width="6"/><path d="M177 130h33v76h-33z" fill="#28304f" stroke="#050711" stroke-width="7"/>`,
    'plainclothes-officer': `<path d="M78 129q50-34 100 0l-8 72H86z" fill="#3a3443" stroke="#050711" stroke-width="8"/><path d="M164 142l22 9-9 22-22-9z" fill="${palette.gold}"/>`,
    'heavy-response-officer': `<path d="M68 117h120l18 96H50z" fill="#151a2c" stroke="#050711" stroke-width="10"/><path d="M85 133h86v53H85z" fill="#28314a"/><path d="M105 143h46v32h-46z" fill="${palette.red}" opacity=".55"/>`,
    'k9-officer': `<path d="M170 133h42v71h-42z" fill="#1a2e49" stroke="#050711" stroke-width="7"/><path d="M192 205q-10 23-28 26" fill="none" stroke="${palette.green}" stroke-width="7"/>`,
    deputy: `<path d="M177 137l12-22 12 22 25 4-18 17 5 24-24-12-23 12 4-24-17-17z" fill="${palette.gold}" stroke="#050711" stroke-width="5"/>`
  }[id] ?? '';
  const pose = {
    trading: '<path d="M151 133l50 16-4 18-52-7z"/>', traveling: '<path d="M112 174l-18 56H72l17-65m46 7 25 53h-24l-25-47"/>',
    running: '<path d="M102 171l-48 43-15-16 44-51m50 18 50 29-11 19-58-28"/>', aiming: '<path d="M145 123l61 8-2 18-64 5z"/>',
    firing: `<path d="M203 124l34 15-35 12z" fill="${palette.gold}" filter="url(#glow)"/>`, hit: `<path d="M35 92l38 13-24 31 39 10-62 30 15-45-27-18z" fill="${palette.red}" opacity=".78"/>`,
    injured: `<path d="M70 164l94 0" stroke="${palette.red}" stroke-width="9" stroke-dasharray="10 8"/>`, critical: `<circle cx="128" cy="128" r="108" fill="none" stroke="${palette.red}" stroke-width="10" opacity=".72"/>`,
    victorious: `<path d="M133 72l37-48 14 13-34 54z"/>`, defeated: `<path d="M48 205h156" stroke="${palette.smoke}" stroke-width="20"/><path d="M92 160l-31 45m70-39 44 39"/>`
  }[state] ?? '';
  return `<rect width="256" height="256" rx="22" fill="url(#bg)"/><circle cx="128" cy="88" r="38" fill="${skin}" stroke="#050711" stroke-width="8"/>
  ${police ? policeHeadgear : hair}
  <path d="M${torsoInset} 126q${128-torsoInset} -34 ${256-torsoInset*2} 0l17 73H${torsoInset-17}z" fill="${police ? '#1b2850' : a}" stroke="#050711" stroke-width="9"/>
  <path d="M105 124h46v90h-46z" fill="${police ? b : palette.indigo}" opacity=".62"/>
  <path d="M84 132l-52 51 14 16 56-42m71-24 47 51-17 15-50-43" fill="none" stroke="${police ? '#253460' : skin}" stroke-width="22" stroke-linecap="square"/>
  <path d="M91 196l-12 47h34l15-35 15 35h35l-17-47z" fill="#15192b" stroke="#050711" stroke-width="8"/>
  <g fill="#050711"><rect x="109" y="83" width="8" height="6"/><rect x="143" y="83" width="8" height="6"/></g>
  <path d="M116 104q12 8 25 0" fill="none" stroke="#2b1520" stroke-width="5"/>
  ${police ? policeProps : civilianProps}${pose}`;
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
const weaponMotifs = {
  baretta: `<path d="M35 82h160v47h-53l-13 83H82l17-83H35z" fill="#4c546d" stroke="#090b18" stroke-width="11"/><path d="M55 96h122v14H55zm60 53h29l-8 45h-31z" fill="#42c8ff"/><path d="M195 91h28v27h-28z" fill="#202657"/>`,
  '.38-special': `<path d="M39 83h97l36 27h51v36h-85l-19 70H75l20-75-56-13z" fill="#69708a" stroke="#090b18" stroke-width="11"/><circle cx="130" cy="116" r="30" fill="#292d3d" stroke="#ffd166" stroke-width="8"/><circle cx="130" cy="116" r="10" fill="#090b18"/><path d="M174 110h48" stroke="#f4edda" stroke-width="12"/>`,
  ruger: `<path d="M27 77h190v35H91l-23 23H34z" fill="#292d3d" stroke="#090b18" stroke-width="10"/><path d="M79 111h73l-17 102H82l25-76-28-8z" fill="#8a4d2c" stroke="#090b18" stroke-width="10"/><path d="M184 65h26v12h-26z" fill="#46f29a"/>`,
  'saturday-night-special': `<path d="M58 95h131v43h-51l-10 67H87l14-67H58z" fill="#a879ff" stroke="#090b18" stroke-width="11"/><path d="M75 108h89v13H75zm43 45h26l-6 36h-27z" fill="#ff9d21"/><path d="M189 105h22v22h-22z" fill="#69708a"/>`
};
for (const id of weaponDefs) {
  addSvg('weapons', slug(id), id.replaceAll('-',' ').replace(/^./,c=>c.toUpperCase()), `<rect width="256" height="256" rx="22" fill="url(#bg)"/>${weaponMotifs[id]}`, { states:['store','street','owned','selected','empty'], mode:'classic' });
}

const combatItems = ['ammunition','empty-weapon','muzzle-flash','bullet-impact','hit-effect','miss-effect','police-badge','handcuffs','radio','flashlight','medical-kit','bandage','protective-vest','evidence-bag'];
const combatMotifs = {
  ammunition: `<g fill="#ffd166" stroke="#090b18" stroke-width="8"><path d="M60 184V91l17-34 17 34v93z"/><path d="M104 184V75l17-31 17 31v109z"/><path d="M148 184V97l17-35 17 35v87z"/></g>`,
  'empty-weapon': `<path d="M45 91h150v45h-59l-13 71H82l17-71H45z" fill="#292d3d" stroke="#090b18" stroke-width="10"/><path d="M72 113h76" stroke="#ff465f" stroke-width="12"/><path d="M164 72l45 45m0-45-45 45" stroke="#ff465f" stroke-width="11"/>`,
  'muzzle-flash': `<path d="M128 20l18 67 62-32-37 58 65 12-65 19 39 55-64-29-18 66-18-66-64 29 39-55-65-19 65-12-37-58 62 32z" fill="#ffd166" stroke="#ff5d24" stroke-width="9"/>`,
  'bullet-impact': `<circle cx="128" cy="128" r="75" fill="#292d3d" stroke="#69708a" stroke-width="11"/><path d="M128 37l12 62 53-34-38 51 63 12-63 12 38 51-53-34-12 62-12-62-53 34 38-51-63-12 63-12-38-51 53 34z" fill="#ff9d21"/>`,
  'hit-effect': `<path d="M37 128h57l-18-44 41 26 11-67 12 67 41-26-18 44h56l-47 28 31 49-55-20-20 45-19-45-56 20 31-49z" fill="#ff465f" stroke="#090b18" stroke-width="8"/>`,
  'miss-effect': `<path d="M44 70q87-55 168 14M35 128q91-34 181 0M48 184q83 41 159-6" fill="none" stroke="#42c8ff" stroke-width="13" stroke-linecap="round"/><path d="M169 45l43 39-49 25" fill="none" stroke="#f4edda" stroke-width="10"/>`,
  'police-badge': `<path d="M128 29l27 31 42-4-4 43 30 29-30 29 4 43-42-4-27 31-27-31-42 4 4-43-30-29 30-29-4-43 42 4z" fill="#ffd166" stroke="#090b18" stroke-width="10"/><circle cx="128" cy="128" r="35" fill="#202657"/>`,
  handcuffs: `<g fill="none" stroke="#69708a" stroke-width="14"><circle cx="78" cy="127" r="45"/><circle cx="178" cy="127" r="45"/><path d="M120 114h16v27h-16z"/></g><path d="M78 82v91m100-91v91" stroke="#f4edda" stroke-width="6"/>`,
  radio: `<rect x="68" y="61" width="120" height="157" rx="15" fill="#292d3d" stroke="#090b18" stroke-width="11"/><path d="M96 39v27m65-27 12 27" stroke="#42c8ff" stroke-width="9"/><rect x="91" y="86" width="74" height="46" rx="5" fill="#46f29a"/><circle cx="104" cy="172" r="18" fill="#69708a"/><path d="M139 158h29m-29 15h29m-29 15h29" stroke="#f4edda" stroke-width="6"/>`,
  flashlight: `<path d="M71 49h114l-22 65v100H93V114z" fill="#69708a" stroke="#090b18" stroke-width="11"/><path d="M93 114h70M102 145h52" stroke="#42c8ff" stroke-width="8"/><path d="M80 43h96l-16 43H96z" fill="#ffd166"/>`,
  'medical-kit': `<rect x="48" y="73" width="160" height="135" rx="20" fill="#f4edda" stroke="#090b18" stroke-width="11"/><path d="M92 73V51h72v22" fill="none" stroke="#69708a" stroke-width="11"/><path d="M128 103v76m-38-38h76" stroke="#ff465f" stroke-width="17"/>`,
  bandage: `<g transform="rotate(-33 128 128)"><rect x="32" y="91" width="192" height="74" rx="34" fill="#f4edda" stroke="#090b18" stroke-width="9"/><rect x="92" y="91" width="72" height="74" fill="#d9b99a"/><g fill="#8f5a3b"><circle cx="106" cy="108" r="4"/><circle cx="127" cy="108" r="4"/><circle cx="148" cy="108" r="4"/><circle cx="106" cy="147" r="4"/><circle cx="127" cy="147" r="4"/><circle cx="148" cy="147" r="4"/></g></g>`,
  'protective-vest': `<path d="M71 58l36-20 21 29 21-29 36 20 25 70-30 14v77H76v-77l-30-14z" fill="#292d3d" stroke="#090b18" stroke-width="10"/><path d="M91 91h74v90H91z" fill="#202657" stroke="#69708a" stroke-width="7"/><path d="M99 112h58m-58 27h58m-58 27h58" stroke="#42c8ff" stroke-width="6"/>`,
  'evidence-bag': `<path d="M61 63h134l12 155H49z" fill="#f4edda" fill-opacity=".77" stroke="#090b18" stroke-width="10"/><path d="M70 83h116" stroke="#ff465f" stroke-width="10"/><path d="M96 116h64v55H96z" fill="#ffd166" stroke="#090b18" stroke-width="7"/><path d="M109 187h38" stroke="#202657" stroke-width="7"/>`
};
for (const id of combatItems) {
  addSvg('weapons', id, id.split('-').map(x=>x[0].toUpperCase()+x.slice(1)).join(' '), `<rect width="256" height="256" rx="22" fill="url(#bg)"/>${combatMotifs[id]}`, { mode:'classic' });
}

const equipment = ['standard-coat','upgraded-coat','damaged-coat','full-capacity-coat','empty-capacity-coat','wallet-cash','bank-deposit','debt-document','travel-ticket','map','event-log-phone','medical-supplies','information-tip','locked-item','sold-item','purchased-item'];
const equipmentMotifs = {
  'standard-coat': `<path d="M78 61l50-24 50 24 37 54-34 23-13-22v102H88V116l-13 22-34-23z" fill="#39405a" stroke="#090b18" stroke-width="10"/><path d="M128 48v160M96 139h25m14 0h25" stroke="#42c8ff" stroke-width="7"/>`,
  'upgraded-coat': `<path d="M70 56l58-27 58 27 41 60-37 26-17-25v108H83V117l-17 25-37-26z" fill="#ff9d21" stroke="#090b18" stroke-width="10"/><path d="M128 42v174M92 126h28v32H92zm44 0h28v32h-28z" stroke="#ffd166" stroke-width="7"/><path d="M77 82h102" stroke="#46f29a" stroke-width="8"/>`,
  'damaged-coat': `<path d="M78 61l50-24 50 24 37 54-34 23-13-22v102H88V116l-13 22-34-23z" fill="#4a3442" stroke="#090b18" stroke-width="10"/><path d="M128 48v160" stroke="#69708a" stroke-width="7"/><path d="M98 103l23 20-18 24 25 18-20 39m58-109-21 25 19 20-24 29" fill="none" stroke="#ff465f" stroke-width="9"/>`,
  'full-capacity-coat': `<path d="M68 58l60-28 60 28 40 59-36 25-18-25v108H82V117l-18 25-36-25z" fill="#202657" stroke="#090b18" stroke-width="10"/><g fill="#ff9d21" stroke="#090b18" stroke-width="5"><rect x="84" y="111" width="37" height="37"/><rect x="135" y="111" width="37" height="37"/><rect x="84" y="160" width="37" height="37"/><rect x="135" y="160" width="37" height="37"/></g>`,
  'empty-capacity-coat': `<path d="M78 61l50-24 50 24 37 54-34 23-13-22v102H88V116l-13 22-34-23z" fill="#15192b" stroke="#090b18" stroke-width="10"/><path d="M128 48v160" stroke="#69708a" stroke-width="7"/><path d="M96 133h24v28H96zm40 0h24v28h-24z" fill="none" stroke="#42c8ff" stroke-width="6"/>`,
  'wallet-cash': `<path d="M43 86h170v114H43z" fill="#8a4d2c" stroke="#090b18" stroke-width="11"/><path d="M43 105h170" stroke="#ffd166" stroke-width="8"/><path d="M131 122h90v55h-90z" fill="#5f3828" stroke="#090b18" stroke-width="8"/><circle cx="170" cy="149" r="9" fill="#ffd166"/><g fill="#46f29a" stroke="#090b18" stroke-width="6"><path d="M69 49h95v70H69z"/><path d="M84 62h65v43H84z"/></g>`,
  'bank-deposit': `<path d="M35 104l93-65 93 65z" fill="#42c8ff" stroke="#090b18" stroke-width="10"/><path d="M50 104h156v108H50z" fill="#202657" stroke="#090b18" stroke-width="10"/><path d="M70 119v75m39-75v75m38-75v75m39-75v75M40 208h176" stroke="#f4edda" stroke-width="9"/><circle cx="128" cy="80" r="17" fill="#ffd166"/>`,
  'debt-document': `<path d="M66 31h124v194H66z" fill="#f4edda" stroke="#090b18" stroke-width="10"/><path d="M84 62h87m-87 26h87m-87 26h61m-61 50h87m-87 25h49" stroke="#202657" stroke-width="7"/><path d="M139 130l55 56" stroke="#ff465f" stroke-width="13"/><circle cx="116" cy="143" r="31" fill="none" stroke="#ff465f" stroke-width="9"/>`,
  'travel-ticket': `<path d="M40 75h176v106q-24 0-24 24H64q0-24-24-24z" fill="#ffd166" stroke="#090b18" stroke-width="10"/><path d="M96 76v128" stroke="#202657" stroke-width="7" stroke-dasharray="9 8"/><path d="M118 107h73m-73 25h51m-51 25h65" stroke="#ff5d24" stroke-width="7"/><circle cx="68" cy="128" r="20" fill="#42c8ff"/>`,
  map: `<path d="M38 54l58-22 64 22 58-22v170l-58 22-64-22-58 22z" fill="#f4edda" stroke="#090b18" stroke-width="10"/><path d="M96 32v170m64-148v170" stroke="#69708a" stroke-width="7"/><path d="M55 177q41-73 79-42t66-57" fill="none" stroke="#42c8ff" stroke-width="9"/><path d="M156 87q0-32 28-32t28 32q0 26-28 58-28-32-28-58z" fill="#ff465f"/><circle cx="184" cy="85" r="9" fill="#f4edda"/>`,
  'event-log-phone': `<rect x="72" y="25" width="112" height="207" rx="22" fill="#292d3d" stroke="#090b18" stroke-width="11"/><rect x="88" y="54" width="80" height="137" rx="5" fill="#42c8ff"/><path d="M101 80h54m-54 28h54m-54 28h42m-42 28h50" stroke="#202657" stroke-width="8"/><circle cx="128" cy="211" r="9" fill="#ffd166"/>`,
  'medical-supplies': `<path d="M58 72h140v141H58z" fill="#f4edda" stroke="#090b18" stroke-width="10"/><path d="M96 72V48h64v24" fill="none" stroke="#69708a" stroke-width="10"/><path d="M128 99v78m-39-39h78" stroke="#ff465f" stroke-width="15"/><path d="M52 190l36-48" stroke="#42c8ff" stroke-width="14"/><circle cx="50" cy="194" r="14" fill="#ffd166"/>`,
  'information-tip': `<path d="M128 28q55 0 55 48 0 28-25 45-17 12-17 31h-31q0-36 28-55 13-9 13-21 0-20-23-20-22 0-26 23l-33-6q8-45 59-45z" fill="#ffd166" stroke="#090b18" stroke-width="9"/><circle cx="125" cy="199" r="20" fill="#42c8ff" stroke="#090b18" stroke-width="8"/>`,
  'locked-item': `<rect x="52" y="105" width="152" height="118" rx="16" fill="#292d3d" stroke="#090b18" stroke-width="10"/><path d="M85 105V78q0-48 43-48t43 48v27" fill="none" stroke="#ffd166" stroke-width="15"/><circle cx="128" cy="158" r="18" fill="#ff465f"/><path d="M128 171v27" stroke="#ff465f" stroke-width="11"/>`,
  'sold-item': `<path d="M48 57h160v142H48z" fill="#202657" stroke="#090b18" stroke-width="10"/><path d="M66 86h124m-124 35h124m-124 35h124" stroke="#42c8ff" stroke-width="7"/><path d="M45 203L211 47" stroke="#ff465f" stroke-width="20"/>`,
  'purchased-item': `<path d="M64 67h128v139H64z" fill="#ff9d21" stroke="#090b18" stroke-width="10"/><path d="M91 67q0-39 37-39t37 39" fill="none" stroke="#46f29a" stroke-width="11"/><path d="M87 137l28 28 57-68" fill="none" stroke="#f4edda" stroke-width="16"/>`
};
for (const id of equipment) {
  addSvg('items', id, id.split('-').map(x=>x[0].toUpperCase()+x.slice(1)).join(' '), `<rect width="256" height="256" rx="22" fill="url(#bg)"/>${equipmentMotifs[id]}`, { mode:'classic' });
}

const locations = [
  ['bronx',palette.orange,palette.green],['ghetto',palette.purple,palette.orange],['central-park',palette.green,palette.gold],
  ['manhattan',palette.blue,palette.orange],['coney-island',palette.red,palette.blue],['brooklyn',palette.gold,palette.purple]
];
function locationScene(id, variant, a, b) {
  const landmarks = {
    bronx: `<path d="M0 292h768v140H0z" fill="#111522"/><path d="M0 112h768v26H0z" fill="#202638"/><path d="M0 100h768v9H0z" fill="${a}"/><g stroke="#090b18" stroke-width="14"><path d="M74 123v206m162-206v206m162-206v206m162-206v206m134-206v206"/></g><path d="M31 182h263v112H31zm464-43h238v155H495z" fill="#462f34" stroke="#090b18" stroke-width="12"/><g fill="${b}"><path d="M58 208h33v31H58zm55 0h33v31h-33zm55 0h33v31h-33zm55 0h33v31h-33zm301-10h35v33h-35zm57 0h35v33h-35zm57 0h35v33h-35zm-114 58h35v28h-35zm57 0h35v28h-35z"/></g><path d="M321 77h192q21 0 21 21v40H300V98q0-21 21-21z" fill="#39405a" stroke="#090b18" stroke-width="11"/><path d="M330 94h44v25h-44zm60 0h44v25h-44zm60 0h44v25h-44z" fill="${palette.blue}"/>`,
    ghetto: `<path d="M0 300h768v132H0z" fill="#131522"/><path d="M30 109h203v191H30zM241 65h236v235H241zM486 126h249v174H486z" fill="#563341" stroke="#090b18" stroke-width="12"/><g fill="${a}"><path d="M59 143h35v37H59zm59 0h35v37h-35zm59 0h35v37h-35zM274 104h39v39h-39zm67 0h39v39h-39zm67 0h39v39h-39zm-134 75h39v39h-39zm67 0h39v39h-39zm67 0h39v39h-39zM522 162h37v37h-37zm61 0h37v37h-37zm61 0h37v37h-37z"/></g><g fill="none" stroke="#69708a" stroke-width="8"><path d="M78 188h108v97H78zm218-34h125v132H296zm237 54h159v78H533z"/><path d="M91 214h82m-82 27h82m219-55H308m0 31h101m0 31H308m241-13h126"/></g><path d="M663 227v82m0-73h57v37" fill="none" stroke="${b}" stroke-width="10"/><circle cx="720" cy="274" r="24" fill="none" stroke="${b}" stroke-width="7"/>`,
    'central-park': `<rect width="768" height="432" fill="#14233a"/><path d="M0 272q128-66 256 0t256 0 256 0v160H0z" fill="#1f5138"/><path d="M0 344q205-58 389 12t379-8v84H0z" fill="#18364f"/><path d="M189 330q50-108 110-108t110 108" fill="#8a6b4a" stroke="#090b18" stroke-width="11"/><path d="M228 330q33-68 71-68t72 68" fill="#14233a"/><g fill="#28764a" stroke="#090b18" stroke-width="8"><circle cx="83" cy="240" r="63"/><circle cx="148" cy="272" r="49"/><circle cx="518" cy="242" r="68"/><circle cx="625" cy="263" r="55"/><circle cx="706" cy="232" r="61"/></g><g stroke="#6b432d" stroke-width="17"><path d="M83 252v104m65-72v80m370-108v110m107-91v88m81-116v111"/></g><path d="M0 156h52V87h43v69h49V43h57v113h64V78h48v78h70V31h62v125h54V72h45v84h74V51h51v105h69" fill="#202657" opacity=".85"/>`,
    manhattan: `<path d="M0 322h768v110H0z" fill="#111522"/><path d="M23 322V139h82v183M118 322V69h106v253M238 322V111h73v211M327 322V32h118v290M460 322V91h87v231M562 322V55h96v267M673 322V129h72v193" fill="#242a45" stroke="#090b18" stroke-width="12"/><g fill="${a}"><path d="M48 165h31v30H48zm0 54h31v30H48zM148 98h36v37h-36zm0 61h36v37h-36zm0 61h36v37h-36zM352 62h39v40h-39zm0 65h39v40h-39zm0 65h39v40h-39zm134-71h35v36h-35zm0 60h35v36h-35zm101-94h34v34h-34zm0 58h34v34h-34zm0 58h34v34h-34z"/></g><path d="M335 31l51-31 57 31" fill="${palette.gold}"/><path d="M286 354h151l37 42H249z" fill="${b}" stroke="#090b18" stroke-width="10"/><path d="M304 338h113l20 20H286z" fill="#42c8ff"/><circle cx="286" cy="397" r="22" fill="#090b18"/><circle cx="439" cy="397" r="22" fill="#090b18"/>`,
    'coney-island': `<rect width="768" height="432" fill="#18264b"/><path d="M0 287h768v145H0z" fill="#5d3f4d"/><path d="M0 336h768" stroke="#d7a75a" stroke-width="34"/><circle cx="188" cy="168" r="112" fill="none" stroke="${a}" stroke-width="13"/><circle cx="188" cy="168" r="16" fill="${palette.gold}"/><g stroke="${a}" stroke-width="7"><path d="M188 56v224M76 168h224M109 89l158 158M267 89L109 247"/></g><g fill="${b}" stroke="#090b18" stroke-width="6"><rect x="168" y="43" width="40" height="27"/><rect x="168" y="266" width="40" height="27"/><rect x="62" y="148" width="40" height="27"/><rect x="274" y="148" width="40" height="27"/></g><path d="M333 243q57-157 116 0t111 0 101-80 74 80" fill="none" stroke="${palette.red}" stroke-width="13"/><path d="M333 248h407" stroke="#090b18" stroke-width="8"/><path d="M391 243v77m85-77v77m86-77v77m84-77v77" stroke="#69708a" stroke-width="8"/>`,
    brooklyn: `<rect width="768" height="432" fill="#17223c"/><path d="M0 330h768v102H0z" fill="#143149"/><path d="M70 329h104V117h77v212m266 0V117h78v212h104" fill="#5d5362" stroke="#090b18" stroke-width="12"/><path d="M173 117h78l-39-77zM517 117h78l-39-77z" fill="${a}" stroke="#090b18" stroke-width="10"/><path d="M0 286h768" stroke="${a}" stroke-width="17"/><g fill="none" stroke="${b}" stroke-width="7"><path d="M212 70Q343 257 556 70M212 70Q410 257 556 70"/><path d="M212 86v200m44-150v150m45-100v100m45-63v63m46-63v63m45-100v100m44-150v150m45-200v200"/></g><path d="M354 211h83v99h-83z" fill="#8a4d2c" stroke="#090b18" stroke-width="9"/><path d="M367 211v-38h57v38" fill="none" stroke="#69708a" stroke-width="9"/>`
  }[id];
  const market = variant === 'market' ? `<g stroke="#090b18" stroke-width="9"><path d="M83 303h177v105H83z" fill="#202657"/><path d="M296 303h177v105H296z" fill="#202657"/><path d="M509 303h177v105H509z" fill="#202657"/><path d="M74 303l34-56h127l34 56z" fill="${a}"/><path d="M287 303l34-56h127l34 56z" fill="${b}"/><path d="M500 303l34-56h127l34 56z" fill="${a}"/></g>` : '';
  const travel = variant === 'travel' ? `<g stroke="${palette.orange}" stroke-width="9" opacity=".75"><path d="M21 84h155M3 125h128M572 72h170M608 116h145"/></g><path d="M250 333h267l48 48H202z" fill="#39405a" stroke="#090b18" stroke-width="11"/><path d="M280 309h192l45 27H250z" fill="${b}"/><circle cx="253" cy="384" r="25" fill="#090b18"/><circle cx="515" cy="384" r="25" fill="#090b18"/>` : '';
  const alert = variant === 'alert' ? `<path d="M0 0h384v32H0z" fill="#ff465f" opacity=".7"/><path d="M384 0h384v32H384z" fill="#42c8ff" opacity=".7"/><path d="M248 340h274l43 57H205z" fill="#15192b" stroke="#090b18" stroke-width="10"/><path d="M302 315h164l47 28H258z" fill="#f4edda"/><path d="M330 304h49v17h-49z" fill="#ff465f" filter="url(#glow)"/><path d="M389 304h49v17h-49z" fill="#42c8ff" filter="url(#glow)"/>` : '';
  const map = variant === 'map' ? `<path d="M40 367C162 201 270 342 388 193S622 79 727 171" fill="none" stroke="#f4edda" stroke-width="16" stroke-dasharray="18 12"/><path d="M351 163q0-47 39-47t39 47q0 39-39 87-39-48-39-87z" fill="${palette.red}" stroke="#090b18" stroke-width="8"/><circle cx="390" cy="161" r="13" fill="#f4edda"/>` : '';
  return `<rect width="768" height="432" fill="url(#bg)"/>${landmarks}${market}${travel}${alert}${map}<path d="M0 422h768" stroke="${a}" stroke-width="10"/>`;
}
for (const [id,a,b] of locations) {
  for (const variant of ['day','travel','market','alert','map']) {
    if (id === 'bronx' && variant === 'day') continue;
    addSvg('locations', `${id}-${variant}`, `${id.replaceAll('-',' ')} ${variant}`, locationScene(id,variant,a,b), {
      width:768,height:432,mode:'classic',states:[variant],priority:variant==='day'?'high':'lazy'
    });
  }
}
addRaster('locations','bronx-day','Bronx establishing scene','bronx-night.webp',960,540,{states:['day'],mode:'classic',priority:'high'});

const services = ['bronx-loan-shark-room','manhattan-bank','street-weapon-offer','clinic','bar-information-venue','subway-platform'];
const serviceScenes = {
  'bronx-loan-shark-room': `<rect width="768" height="512" fill="#171329"/><path d="M0 350h768v162H0z" fill="#2b2433"/><path d="M53 74h250v228H53z" fill="#202657" stroke="#090b18" stroke-width="13"/><path d="M87 109h182v150H87z" fill="#101323"/><path d="M108 132h64v44h-64zm80 0h60v44h-60zm-80 65h140v38H108z" fill="#ff9d21" opacity=".52"/><path d="M402 184h239v211H402z" fill="#292d3d" stroke="#090b18" stroke-width="13"/><circle cx="521" cy="283" r="70" fill="#15192b" stroke="#ffd166" stroke-width="11"/><path d="M521 226v114m-57-57h114" stroke="#69708a" stroke-width="9"/><path d="M256 333h435l35 111H223z" fill="#5f3828" stroke="#090b18" stroke-width="13"/><path d="M414 348h151v55H414z" fill="#46f29a" stroke="#090b18" stroke-width="9"/>`,
  'manhattan-bank': `<rect width="768" height="512" fill="#18264b"/><path d="M0 375h768v137H0z" fill="#d4b875"/><path d="M74 147h620v248H74z" fill="#f4edda" stroke="#090b18" stroke-width="13"/><path d="M38 147L384 37l346 110z" fill="#42c8ff" stroke="#090b18" stroke-width="13"/><g stroke="#202657" stroke-width="28"><path d="M131 167v206m126-206v206m127-206v206m127-206v206m126-206v206"/></g><circle cx="384" cy="105" r="38" fill="#ffd166" stroke="#090b18" stroke-width="10"/><circle cx="384" cy="105" r="17" fill="#46f29a"/><path d="M42 395h684" stroke="#090b18" stroke-width="14"/>`,
  'street-weapon-offer': `<rect width="768" height="512" fill="#101323"/><path d="M0 359h768v153H0z" fill="#292d3d"/><path d="M64 71h639v287H64z" fill="#171a29" stroke="#090b18" stroke-width="13"/><g fill="#69708a" stroke="#090b18" stroke-width="9"><path d="M112 121h180v43H169l-17 55h-38l15-55h-17z"/><path d="M387 109h226v38H472l-23 71h-43l18-71h-37z"/><path d="M162 251h151v39H211l-14 51h-38l14-51h-11z"/><path d="M410 249h183v40H476l-16 53h-39l15-53h-26z"/></g><path d="M141 355h486l55 111H86z" fill="#5f3828" stroke="#090b18" stroke-width="13"/><path d="M181 368h406v65H181z" fill="#202657" stroke="#ff9d21" stroke-width="8"/>`,
  clinic: `<rect width="768" height="512" fill="#d7e5e8"/><path d="M0 387h768v125H0z" fill="#9db9c4"/><path d="M47 59h259v287H47z" fill="#f4edda" stroke="#090b18" stroke-width="13"/><path d="M176 92v121m-60-60h120" stroke="#ff465f" stroke-width="24"/><path d="M403 248h277v112H403z" fill="#f4edda" stroke="#090b18" stroke-width="13"/><path d="M425 216h194l61 32H403z" fill="#42c8ff" stroke="#090b18" stroke-width="11"/><path d="M438 360v83m208-83v83" stroke="#202657" stroke-width="14"/><path d="M366 75h331v109H366z" fill="#202657" stroke="#090b18" stroke-width="12"/><g fill="#46f29a"><rect x="394" y="101" width="48" height="57"/><rect x="462" y="101" width="48" height="57"/><rect x="530" y="101" width="48" height="57"/><rect x="598" y="101" width="48" height="57"/></g>`,
  'bar-information-venue': `<rect width="768" height="512" fill="#21152d"/><path d="M0 381h768v131H0z" fill="#3c263a"/><path d="M59 55h650v224H59z" fill="#15192b" stroke="#090b18" stroke-width="13"/><g fill="#46f29a" stroke="#090b18" stroke-width="7"><path d="M101 97h42l8 116H93z"/><path d="M181 82h47l11 131h-69z"/><path d="M269 108h39l8 105h-55z"/></g><g fill="#ff9d21" stroke="#090b18" stroke-width="7"><path d="M449 91h42l9 122h-60z"/><path d="M537 105h38l8 108h-54z"/><path d="M611 79h45l11 134h-67z"/></g><path d="M34 280h700v102H34z" fill="#8a4d2c" stroke="#090b18" stroke-width="14"/><path d="M68 302h629" stroke="#ffd166" stroke-width="9"/><g fill="#202657" stroke="#090b18" stroke-width="10"><circle cx="172" cy="419" r="33"/><circle cx="384" cy="419" r="33"/><circle cx="596" cy="419" r="33"/></g><path d="M172 419v73m212-73v73m212-73v73" stroke="#69708a" stroke-width="13"/>`,
  'subway-platform': `<rect width="768" height="512" fill="#15192b"/><path d="M0 390h768v122H0z" fill="#69708a"/><path d="M0 369h768" stroke="#ffd166" stroke-width="22"/><path d="M54 89h660v247H54z" fill="#39405a" stroke="#090b18" stroke-width="14"/><g fill="#42c8ff" stroke="#090b18" stroke-width="9"><rect x="90" y="122" width="103" height="83"/><rect x="215" y="122" width="103" height="83"/><rect x="450" y="122" width="103" height="83"/><rect x="575" y="122" width="103" height="83"/></g><path d="M341 111h86v225h-86z" fill="#202657" stroke="#090b18" stroke-width="10"/><circle cx="79" cy="282" r="22" fill="#ff465f"/><circle cx="689" cy="282" r="22" fill="#ff465f"/><path d="M94 433h580" stroke="#202657" stroke-width="18"/><path d="M150 407v53m156-53v53m156-53v53m156-53v53" stroke="#090b18" stroke-width="11"/>`
};
for (const id of services) {
  addSvg('services', id, id.split('-').map(x=>x[0].toUpperCase()+x.slice(1)).join(' '), serviceScenes[id], { width:768,height:512,mode:'classic' });
}

const encounters = ['police-stop','police-chase','shootout','successful-escape','failed-escape','mugging','robbery','found-cash','found-goods','lost-goods','friend-gift','medical-emergency','coat-upgrade-offer','coat-damage','weapon-offer','market-shortage','market-flood','quiet-journey','final-victory','final-defeat','street-tip','risky-stranger','abandoned-property'];
const encounterMotifs = {
  'police-stop': `<path d="M113 286h516l74 102H65z" fill="#f4edda" stroke="#090b18" stroke-width="16"/><path d="M208 229h319l93 62H145z" fill="#202657" stroke="#090b18" stroke-width="13"/><path d="M258 210h91v27h-91z" fill="#ff465f" filter="url(#glow)"/><path d="M375 210h91v27h-91z" fill="#42c8ff" filter="url(#glow)"/><circle cx="168" cy="397" r="43" fill="#090b18"/><circle cx="598" cy="397" r="43" fill="#090b18"/>`,
  'police-chase': `<path d="M164 361l139-130 46 45-130 139z" fill="#ff9d21" stroke="#090b18" stroke-width="14"/><circle cx="320" cy="184" r="47" fill="#b97855" stroke="#090b18" stroke-width="13"/><path d="M330 230l88 71 106-43M376 300l-91 140m126-121 123 94" fill="none" stroke="#202657" stroke-width="34"/><path d="M548 151h129m-102 52h99m-71 51h82" stroke="#42c8ff" stroke-width="17"/>`,
  shootout: `<g stroke="#090b18" stroke-width="14"><path d="M91 264h236v67h-80l-18 111h-67l25-111H91z" fill="#69708a"/><path d="M677 264H441v67h80l18 111h67l-25-111h96z" fill="#69708a"/></g><path d="M329 253l55-103 55 103-55-24z" fill="#ffd166" stroke="#ff5d24" stroke-width="12"/><path d="M347 297l37-69 37 69" fill="none" stroke="#ff465f" stroke-width="13"/>`,
  'successful-escape': `<path d="M94 390h205V109H94zM469 109h205v281H469z" fill="#202657" stroke="#090b18" stroke-width="15"/><path d="M299 109h170v281H299z" fill="#42c8ff" opacity=".24"/><path d="M216 249h263" stroke="#46f29a" stroke-width="31"/><path d="M432 188l83 61-83 61" fill="none" stroke="#46f29a" stroke-width="31"/>`,
  'failed-escape': `<path d="M84 334h600v94H84z" fill="#292d3d" stroke="#090b18" stroke-width="15"/><path d="M151 334l84-129 84 129m130 0 84-129 84 129" fill="#ff9d21" stroke="#090b18" stroke-width="14"/><path d="M73 178h622" stroke="#ff465f" stroke-width="28"/><path d="M118 139v77m132-77v77m132-77v77m132-77v77m132-77v77" stroke="#f4edda" stroke-width="12"/>`,
  mugging: `<path d="M229 117q-91 29-106 126l18 162h121l21-157z" fill="#15192b" stroke="#090b18" stroke-width="15"/><path d="M539 117q91 29 106 126l-18 162H506l-21-157z" fill="#15192b" stroke="#090b18" stroke-width="15"/><path d="M274 225h220v143H274z" fill="#8a4d2c" stroke="#090b18" stroke-width="14"/><circle cx="452" cy="296" r="18" fill="#ffd166"/>`,
  robbery: `<path d="M69 234h488l126 98v91H69z" fill="#39405a" stroke="#090b18" stroke-width="16"/><path d="M435 234h122l84 72H435z" fill="#42c8ff"/><circle cx="184" cy="423" r="46" fill="#090b18"/><circle cx="558" cy="423" r="46" fill="#090b18"/><path d="M107 277h224v89H107z" fill="#202657"/><path d="M153 294h134v55H153z" fill="#ff9d21"/>`,
  'found-cash': `<path d="M132 131h504v279H132z" fill="#f4edda" stroke="#090b18" stroke-width="16"/><path d="M132 132l252 186 252-186" fill="none" stroke="#46f29a" stroke-width="16"/><circle cx="384" cy="248" r="82" fill="#ffd166" stroke="#090b18" stroke-width="14"/><path d="M384 191v114m-42-84q18-29 58-17 35 11 11 39-15 16-56 9-35-6-30 23 6 34 59 30 34-2 47-27" fill="none" stroke="#202657" stroke-width="17"/>`,
  'found-goods': `<path d="M131 177l253-116 253 116v238H131z" fill="#ff9d21" stroke="#090b18" stroke-width="16"/><path d="M131 177l253 124 253-124M384 61v354" fill="none" stroke="#202657" stroke-width="15"/><path d="M271 113l254 124" stroke="#ffd166" stroke-width="25"/>`,
  'lost-goods': `<path d="M112 108l272-67 272 67-59 288-213 69-213-69z" fill="#202657" stroke="#090b18" stroke-width="16"/><path d="M384 61v363" stroke="#69708a" stroke-width="14"/><path d="M279 169l79 61-61 74 95 47-62 102" fill="none" stroke="#ff465f" stroke-width="22"/><g fill="#ff9d21"><rect x="126" y="350" width="72" height="53"/><rect x="574" y="387" width="72" height="53"/></g>`,
  'friend-gift': `<circle cx="224" cy="188" r="75" fill="#b97855" stroke="#090b18" stroke-width="14"/><circle cx="544" cy="188" r="75" fill="#9b6445" stroke="#090b18" stroke-width="14"/><path d="M173 347q51-76 102 0m218 0q51-76 102 0" fill="none" stroke="#42c8ff" stroke-width="49"/><path d="M281 282h206v151H281z" fill="#ff9d21" stroke="#090b18" stroke-width="15"/><path d="M384 282v151m-103-94h206" stroke="#ffd166" stroke-width="13"/>`,
  'medical-emergency': `<path d="M75 279h618v139H75z" fill="#f4edda" stroke="#090b18" stroke-width="16"/><path d="M147 250h474l72 29H75z" fill="#42c8ff" stroke="#090b18" stroke-width="14"/><path d="M105 196h121l51-107 101 249 74-161 51 94h160" fill="none" stroke="#ff465f" stroke-width="20"/><circle cx="180" cy="419" r="39" fill="#202657"/><circle cx="588" cy="419" r="39" fill="#202657"/>`,
  'coat-upgrade-offer': `<path d="M209 96l175-72 175 72 131 162-116 70-52-73v193H246V255l-52 73-116-70z" fill="#ff9d21" stroke="#090b18" stroke-width="16"/><path d="M384 50v375" stroke="#ffd166" stroke-width="14"/><path d="M588 76v129m-64-65h129" stroke="#46f29a" stroke-width="25"/>`,
  'coat-damage': `<path d="M209 96l175-72 175 72 131 162-116 70-52-73v193H246V255l-52 73-116-70z" fill="#4a3442" stroke="#090b18" stroke-width="16"/><path d="M384 50v375" stroke="#69708a" stroke-width="14"/><path d="M288 138l85 68-64 79 105 60-70 108m132-313-74 68 69 61-88 76" fill="none" stroke="#ff465f" stroke-width="22"/>`,
  'weapon-offer': `<path d="M94 163h580v276H94z" fill="#292d3d" stroke="#090b18" stroke-width="17"/><path d="M226 163q0-108 158-108t158 108" fill="none" stroke="#69708a" stroke-width="17"/><path d="M158 250h433v80H420l-42 102h-91l54-102H158z" fill="#a879ff" stroke="#090b18" stroke-width="15"/><path d="M183 272h338" stroke="#ffd166" stroke-width="15"/>`,
  'market-shortage': `<path d="M81 368h606v73H81z" fill="#292d3d" stroke="#090b18" stroke-width="16"/><g fill="none" stroke="#69708a" stroke-width="14"><path d="M117 122h141v246H117zm196 0h141v246H313zm196 0h141v246H509z"/></g><path d="M113 331h549" stroke="#ff465f" stroke-width="24"/><path d="M223 302l161-181 161 181" fill="none" stroke="#ffd166" stroke-width="23"/><path d="M492 121h93v93" fill="none" stroke="#ffd166" stroke-width="23"/>`,
  'market-flood': `<path d="M81 368h606v73H81z" fill="#292d3d" stroke="#090b18" stroke-width="16"/><g fill="#ff9d21" stroke="#090b18" stroke-width="12"><rect x="99" y="179" width="159" height="189"/><rect x="305" y="109" width="159" height="259"/><rect x="511" y="208" width="159" height="160"/></g><path d="M93 411q84-65 168 0t168 0 168 0 91 0" fill="none" stroke="#42c8ff" stroke-width="28"/><path d="M384 63v170m-66-70 66 70 66-70" fill="none" stroke="#46f29a" stroke-width="23"/>`,
  'quiet-journey': `<circle cx="616" cy="104" r="63" fill="#ffd166"/><path d="M0 346h768v166H0z" fill="#111522"/><path d="M88 211h592v150H88z" fill="#39405a" stroke="#090b18" stroke-width="15"/><g fill="#42c8ff"><rect x="130" y="241" width="103" height="74"/><rect x="260" y="241" width="103" height="74"/><rect x="405" y="241" width="103" height="74"/><rect x="535" y="241" width="103" height="74"/></g><path d="M42 392h684m-617 58h550" stroke="#69708a" stroke-width="16"/>`,
  'final-victory': `<path d="M266 77h236v84q0 160-118 210-118-50-118-210z" fill="#ffd166" stroke="#090b18" stroke-width="16"/><path d="M266 102H108q0 128 176 146m218-146h158q0 128-176 146" fill="none" stroke="#ffd166" stroke-width="26"/><path d="M384 370v57m-101 0h202" stroke="#46f29a" stroke-width="24"/><path d="M384 117l31 65 72 10-52 50 13 72-64-34-64 34 13-72-52-50 72-10z" fill="#ff9d21"/>`,
  'final-defeat': `<circle cx="384" cy="200" r="133" fill="#ff465f" opacity=".55" stroke="#090b18" stroke-width="17"/><path d="M290 157q94-87 188 0v165H290z" fill="#202657" stroke="#090b18" stroke-width="16"/><path d="M327 189l48 48m0-48-48 48m67-48 48 48m0-48-48 48" stroke="#f4edda" stroke-width="15"/><path d="M93 417h582" stroke="#69708a" stroke-width="34"/>`,
  'street-tip': `<path d="M167 71h278v367H167z" fill="#292d3d" stroke="#090b18" stroke-width="16"/><rect x="194" y="111" width="224" height="247" rx="8" fill="#42c8ff"/><path d="M218 316q68-156 176-129" fill="none" stroke="#f4edda" stroke-width="17"/><path d="M342 143q0-52 44-52t44 52q0 43-44 95-44-52-44-95z" fill="#ff465f"/><path d="M500 172h126v148H500z" fill="#f4edda" stroke="#090b18" stroke-width="14"/><path d="M500 173l63 51 63-51" fill="none" stroke="#ff9d21" stroke-width="12"/>`,
  'risky-stranger': `<path d="M132 145h504v279H132z" fill="#f4edda" stroke="#090b18" stroke-width="16"/><path d="M132 146l252 186 252-186" fill="none" stroke="#a879ff" stroke-width="16"/><path d="M345 87q9-63 63-63 58 0 58 51 0 32-29 52-24 17-24 44h-49q0-46 37-72 16-11 16-24 0-20-25-20-24 0-30 37z" fill="#ffd166" stroke="#090b18" stroke-width="10"/><circle cx="389" cy="213" r="22" fill="#ff465f"/>`,
  'abandoned-property': `<path d="M115 156h538v285H115z" fill="#5f3828" stroke="#090b18" stroke-width="16"/><path d="M238 156q0-107 146-107t146 107" fill="none" stroke="#8a6b4a" stroke-width="18"/><path d="M115 244h538M384 156v285" stroke="#ffd166" stroke-width="14"/><circle cx="343" cy="318" r="19" fill="#090b18"/><circle cx="425" cy="318" r="19" fill="#090b18"/><path d="M75 80h116v76H75z" fill="#202657" stroke="#090b18" stroke-width="13"/><path d="M93 102h80m-80 26h52" stroke="#42c8ff" stroke-width="8"/>`
};
function encounterScene(id) {
  const [a,b]=colorsFor(id);const danger=/police|chase|shootout|failed|mugging|robbery|damage|defeat|emergency/.test(id);
  return `<rect width="768" height="512" fill="url(#bg)"/><circle cx="90" cy="90" r="170" fill="${a}" opacity=".12"/><circle cx="696" cy="430" r="210" fill="${b}" opacity=".1"/>${danger?`<path d="M0 0h384v23H0z" fill="#ff465f" opacity=".55"/><path d="M384 0h384v23H384z" fill="#42c8ff" opacity=".55"/>`:''}${encounterMotifs[id]}`;
}
for (const id of encounters) {
  const danger = /police|chase|shootout|failed|mugging|robbery|damage|defeat|emergency/.test(id);
  addSvg('encounters', id, id.split('-').map(x=>x[0].toUpperCase()+x.slice(1)).join(' '), encounterScene(id), { width:768,height:512,mode:'classic',priority:danger?'high':'lazy' });
}

const uiIcons = ['buy','sell','travel','bank','debt','health','capacity','inventory','weapon','settings','sound','haptics','save','warning','information','close','previous','next','quantity-plus','quantity-minus','max-quantity','ticker','day','map-pin','locked','unlocked','achievement-frame','score-bronze','score-silver','score-gold','image-fallback','history','services','finish','share'];
const uiGlyphs = {
  buy: `<path d="M13 26h38l-3 28H16z" fill="#46f29a" stroke="#090b18" stroke-width="4"/><path d="M22 26q0-14 10-14t10 14M32 33v14m-7-7h14" fill="none" stroke="#f4edda" stroke-width="4"/>`,
  sell: `<path d="M11 18h42v31H11z" fill="#42c8ff" stroke="#090b18" stroke-width="4"/><circle cx="32" cy="34" r="10" fill="#ffd166"/><path d="M19 54h27m0 0-8-7m8 7-8 7" stroke="#f4edda" stroke-width="4" fill="none"/>`,
  travel: `<path d="M10 20h44v25H10z" fill="#ff9d21" stroke="#090b18" stroke-width="4"/><rect x="16" y="25" width="11" height="9" fill="#42c8ff"/><rect x="37" y="25" width="11" height="9" fill="#42c8ff"/><circle cx="20" cy="48" r="5" fill="#090b18"/><circle cx="44" cy="48" r="5" fill="#090b18"/><path d="M21 12h28m0 0-7-6m7 6-7 6" stroke="#46f29a" stroke-width="4"/>`,
  bank: `<path d="M7 24L32 8l25 16z" fill="#42c8ff" stroke="#090b18" stroke-width="4"/><path d="M11 24h42v31H11z" fill="#202657" stroke="#090b18" stroke-width="4"/><path d="M18 28v21m9-21v21m10-21v21m9-21v21M7 54h50" stroke="#f4edda" stroke-width="4"/>`,
  debt: `<path d="M16 7h33v50H16z" fill="#f4edda" stroke="#090b18" stroke-width="4"/><path d="M22 17h20m-20 9h20m-20 9h14" stroke="#202657" stroke-width="4"/><path d="M38 35L53 53" stroke="#ff465f" stroke-width="6"/>`,
  health: `<path d="M32 55S7 41 7 23q0-14 13-14 8 0 12 8 4-8 12-8 13 0 13 14 0 18-25 32z" fill="#ff465f" stroke="#090b18" stroke-width="4"/><path d="M13 31h11l5-11 7 22 5-11h10" fill="none" stroke="#f4edda" stroke-width="4"/>`,
  capacity: `<path d="M19 12l13-6 13 6 10 14-9 6-4-6v30H22V26l-4 6-9-6z" fill="#ff9d21" stroke="#090b18" stroke-width="4"/><path d="M32 9v44M24 34h6m4 0h6" stroke="#ffd166" stroke-width="3"/>`,
  inventory: `<path d="M10 19L32 8l22 11v33L32 60 10 52z" fill="#a879ff" stroke="#090b18" stroke-width="4"/><path d="M10 19l22 11 22-11M32 30v30" fill="none" stroke="#ffd166" stroke-width="4"/>`,
  weapon: `<path d="M7 20h43v13H34l-4 23H19l5-23H7z" fill="#69708a" stroke="#090b18" stroke-width="4"/><path d="M49 23h9v7h-9z" fill="#ff9d21"/>`,
  settings: `<path d="M27 7h10l3 8 9-2 5 9-6 6 6 7-5 9-9-2-3 9H27l-3-9-9 2-5-9 6-7-6-6 5-9 9 2z" fill="#69708a" stroke="#090b18" stroke-width="4"/><circle cx="32" cy="28" r="9" fill="#42c8ff"/>`,
  sound: `<path d="M8 25h12l15-13v40L20 39H8z" fill="#42c8ff" stroke="#090b18" stroke-width="4"/><path d="M41 22q12 10 0 20m7-28q22 18 0 36" fill="none" stroke="#ff9d21" stroke-width="4"/>`,
  haptics: `<rect x="20" y="8" width="24" height="48" rx="6" fill="#202657" stroke="#090b18" stroke-width="4"/><circle cx="32" cy="49" r="3" fill="#ffd166"/><path d="M13 19q-9 13 0 26m38-26q9 13 0 26" fill="none" stroke="#a879ff" stroke-width="4"/>`,
  save: `<path d="M10 8h44v48H10z" fill="#42c8ff" stroke="#090b18" stroke-width="4"/><path d="M17 8h28v18H17z" fill="#202657"/><path d="M19 36h26v20H19z" fill="#f4edda"/><circle cx="40" cy="17" r="4" fill="#ffd166"/>`,
  warning: `<path d="M32 7l27 49H5z" fill="#ffd166" stroke="#090b18" stroke-width="4"/><path d="M32 22v18" stroke="#202657" stroke-width="6"/><circle cx="32" cy="48" r="4" fill="#202657"/>`,
  information: `<circle cx="32" cy="32" r="25" fill="#42c8ff" stroke="#090b18" stroke-width="4"/><circle cx="32" cy="19" r="4" fill="#f4edda"/><path d="M32 27v21" stroke="#f4edda" stroke-width="6"/>`,
  close: `<path d="M14 14l36 36m0-36L14 50" stroke="#ff465f" stroke-width="9" stroke-linecap="round"/>`,
  previous: `<path d="M42 10L18 32l24 22" fill="none" stroke="#42c8ff" stroke-width="10" stroke-linecap="square"/>`,
  next: `<path d="M22 10l24 22-24 22" fill="none" stroke="#42c8ff" stroke-width="10" stroke-linecap="square"/>`,
  'quantity-plus': `<circle cx="32" cy="32" r="25" fill="#46f29a" stroke="#090b18" stroke-width="4"/><path d="M32 17v30M17 32h30" stroke="#f4edda" stroke-width="6"/>`,
  'quantity-minus': `<circle cx="32" cy="32" r="25" fill="#ff465f" stroke="#090b18" stroke-width="4"/><path d="M17 32h30" stroke="#f4edda" stroke-width="6"/>`,
  'max-quantity': `<path d="M8 15h48v34H8z" fill="#202657" stroke="#090b18" stroke-width="4"/><path d="M12 32h40M43 23l9 9-9 9m-22 0-9-9 9-9" fill="none" stroke="#ffd166" stroke-width="5"/>`,
  ticker: `<circle cx="12" cy="32" r="7" fill="#ff9d21"/><path d="M24 17h33M24 31h26M24 45h31" stroke="#42c8ff" stroke-width="5"/>`,
  day: `<rect x="9" y="13" width="46" height="43" rx="6" fill="#f4edda" stroke="#090b18" stroke-width="4"/><path d="M9 24h46M20 7v13m24-13v13" stroke="#ff465f" stroke-width="5"/><circle cx="32" cy="39" r="10" fill="#ffd166"/>`,
  'map-pin': `<path d="M32 5q21 0 21 20 0 17-21 34Q11 42 11 25 11 5 32 5z" fill="#ff465f" stroke="#090b18" stroke-width="4"/><circle cx="32" cy="25" r="8" fill="#f4edda"/>`,
  locked: `<rect x="12" y="29" width="40" height="29" rx="6" fill="#69708a" stroke="#090b18" stroke-width="4"/><path d="M21 29V19q0-13 11-13t11 13v10" fill="none" stroke="#ffd166" stroke-width="6"/>`,
  unlocked: `<rect x="12" y="29" width="40" height="29" rx="6" fill="#46f29a" stroke="#090b18" stroke-width="4"/><path d="M42 29V19Q42 6 31 6 21 6 21 18" fill="none" stroke="#ffd166" stroke-width="6"/>`,
  'achievement-frame': `<path d="M32 5l8 10 13-1-1 13 8 10-10 8-1 13-13-3-11 7-7-11-13-2 3-13-7-11 11-7 2-13 13 3z" fill="#a879ff" stroke="#090b18" stroke-width="4"/><path d="M32 18l5 10 12 2-9 8 2 12-10-6-10 6 2-12-9-8 12-2z" fill="#ffd166"/>`,
  'score-bronze': `<circle cx="32" cy="26" r="22" fill="#b56a3c" stroke="#090b18" stroke-width="4"/><path d="M20 44l-5 17 17-9 17 9-5-17" fill="#8a4d2c"/><path d="M32 11l5 10 11 2-8 8 2 11-10-5-10 5 2-11-8-8 11-2z" fill="#ffd166"/>`,
  'score-silver': `<circle cx="32" cy="26" r="22" fill="#aeb7c6" stroke="#090b18" stroke-width="4"/><path d="M20 44l-5 17 17-9 17 9-5-17" fill="#69708a"/><path d="M32 11l5 10 11 2-8 8 2 11-10-5-10 5 2-11-8-8 11-2z" fill="#f4edda"/>`,
  'score-gold': `<circle cx="32" cy="26" r="22" fill="#ffd166" stroke="#090b18" stroke-width="4"/><path d="M20 44l-5 17 17-9 17 9-5-17" fill="#ff9d21"/><path d="M32 11l5 10 11 2-8 8 2 11-10-5-10 5 2-11-8-8 11-2z" fill="#f4edda"/>`,
  'image-fallback': `<rect x="7" y="9" width="50" height="46" rx="5" fill="#202657" stroke="#090b18" stroke-width="4"/><circle cx="21" cy="23" r="6" fill="#ffd166"/><path d="M10 48l15-15 10 10 8-8 11 13M12 12l40 40" fill="none" stroke="#ff465f" stroke-width="5"/>`,
  history: `<circle cx="32" cy="33" r="23" fill="#202657" stroke="#090b18" stroke-width="4"/><path d="M32 18v16l11 8M12 13v14h14" fill="none" stroke="#42c8ff" stroke-width="5"/><path d="M12 27Q20 8 38 10" fill="none" stroke="#ff9d21" stroke-width="4"/>`,
  services: `<path d="M10 48l21-21q-8-13 2-20l6 12 12-6q6 11-7 19L22 55z" fill="#69708a" stroke="#090b18" stroke-width="4"/><circle cx="18" cy="49" r="4" fill="#42c8ff"/>`,
  finish: `<path d="M15 7v51" stroke="#f4edda" stroke-width="5"/><path d="M18 10h37v25H18z" fill="#ff465f" stroke="#090b18" stroke-width="4"/><path d="M18 10l12 8-12 8m24-16 13 8-13 8" fill="#f4edda"/>`,
  share: `<circle cx="14" cy="32" r="8" fill="#42c8ff"/><circle cx="49" cy="14" r="8" fill="#46f29a"/><circle cx="49" cy="50" r="8" fill="#ff9d21"/><path d="M21 28l21-11M21 36l21 11" stroke="#f4edda" stroke-width="5"/>`
};
for (const id of uiIcons) {
  addSvg('ui', id, id.split('-').map(x=>x[0].toUpperCase()+x.slice(1)).join(' '), `<rect width="64" height="64" rx="14" fill="${palette.indigo}"/>${uiGlyphs[id]}`, { width:64,height:64,mode:'both',priority:'high' });
}

const effects = ['cash-increase','cash-decrease','debt-increase','bank-interest','purchase-success','sale-success','market-shortage','market-flood','player-damage','enemy-damage','critical-health','police-lights','travel','escape','victory','defeat','new-high-score'];
const effectGlyphs = {
  'cash-increase': `<circle cx="58" cy="70" r="38" fill="#46f29a" stroke="#090b18" stroke-width="8"/><path d="M58 43v54m-20-40q9-15 30-9 18 6 6 20-8 8-28 4-18-3-15 12 3 17 29 15 18-1 25-14" fill="none" stroke="#202657" stroke-width="9"/><path d="M100 83V24m-18 18 18-18 18 18" fill="none" stroke="#ffd166" stroke-width="11"/>`,
  'cash-decrease': `<circle cx="58" cy="58" r="38" fill="#ff465f" stroke="#090b18" stroke-width="8"/><path d="M58 31v54m-20-40q9-15 30-9 18 6 6 20-8 8-28 4-18-3-15 12 3 17 29 15 18-1 25-14" fill="none" stroke="#f4edda" stroke-width="9"/><path d="M100 45v59m-18-18 18 18 18-18" fill="none" stroke="#ffd166" stroke-width="11"/>`,
  'debt-increase': `<path d="M19 12h61v101H19z" fill="#f4edda" stroke="#090b18" stroke-width="8"/><path d="M31 32h36m-36 17h36m-36 17h27" stroke="#202657" stroke-width="7"/><path d="M101 91V24M80 45l21-21 20 21" fill="none" stroke="#ff465f" stroke-width="11"/>`,
  'bank-interest': `<path d="M8 49l50-33 50 33z" fill="#42c8ff" stroke="#090b18" stroke-width="8"/><path d="M16 49h84v63H16z" fill="#202657" stroke="#090b18" stroke-width="8"/><path d="M31 56v44m25-44v44m25-44v44" stroke="#f4edda" stroke-width="8"/><path d="M105 11l6 14 15 2-11 10 3 15-13-8-13 8 3-15-11-10 15-2z" fill="#ffd166"/>`,
  'purchase-success': `<path d="M17 46h94l-8 68H25z" fill="#46f29a" stroke="#090b18" stroke-width="8"/><path d="M38 46q0-30 26-30t26 30" fill="none" stroke="#ffd166" stroke-width="9"/><path d="M39 80l17 17 36-43" fill="none" stroke="#f4edda" stroke-width="11"/>`,
  'sale-success': `<path d="M14 29h73v58H14z" fill="#42c8ff" stroke="#090b18" stroke-width="8"/><circle cx="51" cy="58" r="18" fill="#ffd166"/><path d="M73 99h44m0 0-17-16m17 16-17 17" fill="none" stroke="#46f29a" stroke-width="10"/>`,
  'market-shortage': `<path d="M12 108h104M20 95l33-42 23 22 35-54" fill="none" stroke="#ff465f" stroke-width="11"/><path d="M90 21h21v22" fill="none" stroke="#ffd166" stroke-width="10"/>`,
  'market-flood': `<g fill="#ff9d21" stroke="#090b18" stroke-width="7"><rect x="12" y="68" width="31" height="39"/><rect x="49" y="45" width="31" height="62"/><rect x="86" y="74" width="31" height="33"/></g><path d="M7 112q19-18 38 0t38 0 38 0" fill="none" stroke="#42c8ff" stroke-width="11"/><path d="M64 9v46m-17-17 17 17 17-17" fill="none" stroke="#46f29a" stroke-width="10"/>`,
  'player-damage': `<circle cx="45" cy="40" r="22" fill="#b97855" stroke="#090b18" stroke-width="7"/><path d="M20 113q25-58 50 0" fill="none" stroke="#42c8ff" stroke-width="30"/><path d="M77 18l14 27 30 5-22 21 6 30-28-15-27 15 5-30-21-21 30-5z" fill="#ff465f" stroke="#090b18" stroke-width="6"/>`,
  'enemy-damage': `<circle cx="83" cy="40" r="22" fill="#9b6445" stroke="#090b18" stroke-width="7"/><path d="M58 113q25-58 50 0" fill="none" stroke="#ff465f" stroke-width="30"/><path d="M51 18L37 45 7 50l22 21-6 30 28-15 27 15-5-30 21-21-30-5z" fill="#ffd166" stroke="#090b18" stroke-width="6"/>`,
  'critical-health': `<path d="M64 116S13 87 13 49q0-28 26-28 16 0 25 16 9-16 25-16 26 0 26 28 0 38-51 67z" fill="#ff465f" stroke="#090b18" stroke-width="8"/><path d="M19 67h21l10-23 15 45 11-22h32" fill="none" stroke="#f4edda" stroke-width="9"/>`,
  'police-lights': `<path d="M10 69h108v42H10z" fill="#202657" stroke="#090b18" stroke-width="8"/><path d="M19 39h39v31H19z" fill="#ff465f" filter="url(#glow)"/><path d="M70 39h39v31H70z" fill="#42c8ff" filter="url(#glow)"/><path d="M0 29h37M91 29h37M0 119h37M91 119h37" stroke="#ffd166" stroke-width="8"/>`,
  travel: `<path d="M15 44h94v52H15z" fill="#ff9d21" stroke="#090b18" stroke-width="8"/><rect x="27" y="55" width="24" height="19" fill="#42c8ff"/><rect x="73" y="55" width="24" height="19" fill="#42c8ff"/><circle cx="35" cy="101" r="11" fill="#090b18"/><circle cx="89" cy="101" r="11" fill="#090b18"/><path d="M3 20h61m39 0h22M0 35h38" stroke="#46f29a" stroke-width="8"/>`,
  escape: `<path d="M19 14h58v101H19z" fill="#202657" stroke="#090b18" stroke-width="8"/><path d="M77 15h32v100H77z" fill="#42c8ff" opacity=".25"/><circle cx="65" cy="65" r="6" fill="#ffd166"/><path d="M56 64h68m-18-18 18 18-18 18" fill="none" stroke="#46f29a" stroke-width="10"/>`,
  victory: `<path d="M38 16h52v24q0 39-26 53-26-14-26-53z" fill="#ffd166" stroke="#090b18" stroke-width="8"/><path d="M38 24H9q0 32 34 39m47-39h29q0 32-34 39M64 93v21m-25 0h50" fill="none" stroke="#46f29a" stroke-width="9"/>`,
  defeat: `<circle cx="64" cy="61" r="48" fill="#ff465f" opacity=".6" stroke="#090b18" stroke-width="8"/><path d="M37 38l19 19m0-19L37 57m34-19 19 19m0-19L71 57" stroke="#f4edda" stroke-width="9"/><path d="M37 91q27-18 54 0" fill="none" stroke="#202657" stroke-width="9"/>`,
  'new-high-score': `<circle cx="64" cy="48" r="40" fill="#ffd166" stroke="#090b18" stroke-width="8"/><path d="M64 17l9 19 21 3-15 15 4 21-19-10-19 10 4-21-15-15 21-3z" fill="#ff9d21"/><path d="M40 82l-9 38 33-18 33 18-9-38" fill="#a879ff"/>`
};
for (const id of effects) {
  addSvg('effects', id, id.split('-').map(x=>x[0].toUpperCase()+x.slice(1)).join(' '), `<rect width="128" height="128" fill="none"/>${effectGlyphs[id]}`, { width:128,height:128,mode:'both',states:['start','peak','fade'],frames:3,timing:120 });
}

const extended = [
  ['car',45000],['truck',69000],['plane',170000],['boat',95000],['house',250000],['hotel',510000],['island',740000],['strip-club',1000000],['earth',100000000],['galaxy',69000000000],['hired-security',50000],['stripper',89000],['dog',3000],['wife',340000]
];
const extendedMotifs = {
  car: `<path d="M43 151l25-48h112l35 48v43H43z" fill="#ff9d21" stroke="#090b18" stroke-width="10"/><path d="M84 103l24-29h49l23 29z" fill="#42c8ff" stroke="#090b18" stroke-width="8"/><circle cx="83" cy="194" r="22" fill="#090b18"/><circle cx="181" cy="194" r="22" fill="#090b18"/><circle cx="83" cy="194" r="9" fill="#69708a"/><circle cx="181" cy="194" r="9" fill="#69708a"/>`,
  truck: `<path d="M35 91h119v91H35z" fill="#46f29a" stroke="#090b18" stroke-width="10"/><path d="M154 119h42l27 35v28h-69z" fill="#ff9d21" stroke="#090b18" stroke-width="10"/><path d="M169 130h22l15 22h-37z" fill="#42c8ff"/><circle cx="76" cy="190" r="22" fill="#090b18"/><circle cx="187" cy="190" r="22" fill="#090b18"/>`,
  plane: `<path d="M25 137l86-25 27-71h24l-11 67 70-13 17 22-84 33 9 62h-23l-29-51-66 20z" fill="#f4edda" stroke="#090b18" stroke-width="9"/><path d="M56 137l166-29" stroke="#42c8ff" stroke-width="8"/><circle cx="149" cy="112" r="7" fill="#ff9d21"/>`,
  boat: `<path d="M35 154h186l-31 55H65z" fill="#ff5d24" stroke="#090b18" stroke-width="10"/><path d="M89 96h82v58H89z" fill="#f4edda" stroke="#090b18" stroke-width="9"/><path d="M130 47v107M130 52l58 39h-58z" fill="#ffd166" stroke="#090b18" stroke-width="8"/><path d="M27 223q24-18 48 0t48 0 48 0 48 0" fill="none" stroke="#42c8ff" stroke-width="11"/>`,
  house: `<path d="M42 121l86-72 86 72v95H42z" fill="#ff9d21" stroke="#090b18" stroke-width="10"/><path d="M27 125L128 35l101 90" fill="none" stroke="#ff465f" stroke-width="14"/><path d="M103 157h49v59h-49z" fill="#202657"/><path d="M63 144h27v28H63zm103 0h27v28h-27z" fill="#42c8ff"/>`,
  hotel: `<path d="M61 42h134v181H61z" fill="#a879ff" stroke="#090b18" stroke-width="10"/><path d="M78 64h23v23H78zm39 0h23v23h-23zm39 0h23v23h-23M78 104h23v23H78zm39 0h23v23h-23zm39 0h23v23h-23M78 144h23v23H78zm78 0h23v23h-23z" fill="#ffd166"/><path d="M112 177h32v46h-32z" fill="#202657"/><path d="M47 42h162" stroke="#46f29a" stroke-width="11"/>`,
  island: `<ellipse cx="128" cy="190" rx="93" ry="31" fill="#ffd166" stroke="#090b18" stroke-width="9"/><path d="M132 179q-6-72 22-111" fill="none" stroke="#8a4d2c" stroke-width="15"/><path d="M151 70q-44-45-69-8 35 2 58 25m15-15q39-45 71-8-38 1-64 26m-7-17q-3-48 24-54 15 31-7 58" fill="#46f29a" stroke="#090b18" stroke-width="8"/><path d="M10 222q25-18 50 0t50 0 50 0 50 0" fill="none" stroke="#42c8ff" stroke-width="11"/>`,
  'strip-club': `<path d="M43 79h170v137H43z" fill="#202657" stroke="#090b18" stroke-width="10"/><path d="M55 48h146v48H55z" fill="#ff465f" stroke="#090b18" stroke-width="9"/><path d="M80 117h32v99H80zm63 0h32v99h-32z" fill="#a879ff"/><path d="M128 113v103" stroke="#ffd166" stroke-width="8"/><circle cx="128" cy="137" r="11" fill="#f4edda"/><path d="M128 148l-20 35m20-35 19 35m-19-20v47" stroke="#f4edda" stroke-width="7"/>`,
  earth: `<circle cx="128" cy="128" r="91" fill="#42c8ff" stroke="#090b18" stroke-width="11"/><path d="M66 77l32-26 28 13 5 27-24 17-32-9zm79 18 45-13 23 34-22 24-6 39-37 17-18-33 18-24z" fill="#46f29a" stroke="#090b18" stroke-width="5"/><path d="M23 151q105 54 211-10" fill="none" stroke="#f4edda" stroke-width="5" opacity=".65"/>`,
  galaxy: `<path d="M45 127q18-81 102-75 72 5 75 70 4 78-92 87-84 8-96-50-9-45 53-60 72-17 100 25 18 28-27 49-55 26-88-9-21-23 12-44 39-25 70-6" fill="none" stroke="#a879ff" stroke-width="18"/><path d="M55 70l6 14 15 2-11 10 3 15-13-8-13 8 3-15-11-10 15-2zm134 79l5 12 13 2-10 9 3 13-11-7-12 7 3-13-10-9 13-2z" fill="#ffd166"/><circle cx="128" cy="128" r="12" fill="#ff9d21"/>`,
  'hired-security': `<circle cx="128" cy="74" r="34" fill="#9b6445" stroke="#090b18" stroke-width="8"/><path d="M63 211q6-92 65-92t65 92z" fill="#202657" stroke="#090b18" stroke-width="10"/><path d="M89 128h78v56H89z" fill="#292d3d" stroke="#090b18" stroke-width="7"/><path d="M128 134l11 19 21 4-15 16 3 22-20-10-20 10 3-22-15-16 21-4z" fill="#ffd166"/>`,
  stripper: `<circle cx="128" cy="66" r="28" fill="#d49a75" stroke="#090b18" stroke-width="8"/><path d="M99 99q29 22 58 0l13 64-42 42-42-42z" fill="#ff465f" stroke="#090b18" stroke-width="9"/><path d="M128 31v193M101 113l-45 42m99-42 45 42M110 193l-15 39m51-39 16 39" fill="none" stroke="#ffd166" stroke-width="8"/><path d="M92 50q36-37 72 0" fill="none" stroke="#2c172d" stroke-width="15"/>`,
  dog: `<path d="M66 132q5-55 56-55h33q45 0 42 49l-7 55h-30l-7-34h-49l-6 34H67z" fill="#a86c3f" stroke="#090b18" stroke-width="9"/><circle cx="188" cy="92" r="35" fill="#b97855" stroke="#090b18" stroke-width="9"/><path d="M164 66l-20-35q43-3 50 34m17 10 24-24q11 37-18 52" fill="#5f3828" stroke="#090b18" stroke-width="8"/><circle cx="199" cy="87" r="5" fill="#090b18"/><path d="M214 102q-12 13-25 1" fill="none" stroke="#090b18" stroke-width="5"/><path d="M69 129q-38-19-42 17" fill="none" stroke="#a86c3f" stroke-width="12"/>`,
  wife: `<circle cx="128" cy="71" r="34" fill="#b97855" stroke="#090b18" stroke-width="8"/><path d="M63 219q9-103 65-103t65 103z" fill="#42c8ff" stroke="#090b18" stroke-width="10"/><path d="M91 66q10-48 37-48t41 48q-12 29-13 56l-20-26-18 25-22-29z" fill="#39243c" stroke="#090b18" stroke-width="8"/><path d="M172 138l16-15 16 15-16 35z" fill="#ffd166" stroke="#090b18" stroke-width="5"/>`
};
for (const [id] of extended) {
  addSvg('extended-mode', id, id.split('-').map(x=>x[0].toUpperCase()+x.slice(1)).join(' '), `<rect width="256" height="256" rx="22" fill="url(#bg)"/><circle cx="128" cy="128" r="105" fill="none" stroke="${colorsFor(id)[0]}" stroke-width="6" opacity=".25"/>${extendedMotifs[id]}`, { mode:'extended',states:['purchase','owned','selected','sold','unavailable'] });
}
const extendedScenes = {
  'divorce-event': `<rect width="768" height="432" fill="url(#bg)"/><path d="M104 60h242v308H104z" fill="#f4edda" stroke="#090b18" stroke-width="14"/><path d="M225 60l35 50-45 43 43 49-50 46 39 120" fill="none" stroke="#ff465f" stroke-width="16"/><path d="M474 131q42-65 85 0 42-65 85 0 0 62-85 124-85-62-85-124z" fill="#ff465f" stroke="#090b18" stroke-width="12"/><path d="M548 116l33 49-48 34 35 58" fill="none" stroke="#f4edda" stroke-width="12"/><circle cx="591" cy="315" r="47" fill="none" stroke="#ffd166" stroke-width="14"/><circle cx="626" cy="279" r="12" fill="#42c8ff"/>`,
  'vehicle-travel-car': `<rect width="768" height="432" fill="url(#bg)"/><path d="M0 291h768v141H0z" fill="#101323"/><path d="M0 357h768" stroke="#ffd166" stroke-width="10" stroke-dasharray="55 34"/><path d="M208 280l49-91h213l71 91v82H208z" fill="#ff9d21" stroke="#090b18" stroke-width="15"/><path d="M289 189l56-59h76l49 59z" fill="#42c8ff" stroke="#090b18" stroke-width="12"/><circle cx="294" cy="361" r="43" fill="#090b18"/><circle cx="472" cy="361" r="43" fill="#090b18"/><path d="M35 118h205M0 174h151M553 104h180" stroke="#46f29a" stroke-width="12"/>`,
  'vehicle-travel-truck': `<rect width="768" height="432" fill="url(#bg)"/><path d="M0 300h768v132H0z" fill="#101323"/><path d="M87 154h390v177H87z" fill="#46f29a" stroke="#090b18" stroke-width="15"/><path d="M477 211h113l77 83v37H477z" fill="#ff9d21" stroke="#090b18" stroke-width="15"/><path d="M512 229h62l44 50H512z" fill="#42c8ff"/><circle cx="198" cy="344" r="49" fill="#090b18"/><circle cx="555" cy="344" r="49" fill="#090b18"/><path d="M0 103h201M48 128h218" stroke="#42c8ff" stroke-width="12"/>`,
  'vehicle-travel-plane': `<rect width="768" height="432" fill="#182b4c"/><path d="M0 316q125-60 250 0t250 0 268 0v116H0z" fill="#f4edda" opacity=".75"/><path d="M74 224l295-66 85-120h64l-27 112 199-31 34 47-223 80 26 105h-62l-93-87-240 48z" fill="#f4edda" stroke="#090b18" stroke-width="15"/><path d="M117 231l572-88" stroke="#42c8ff" stroke-width="11"/>`,
  'vehicle-travel-boat': `<rect width="768" height="432" fill="#142b49"/><circle cx="603" cy="84" r="48" fill="#ffd166"/><path d="M0 324q90-42 180 0t180 0 180 0 228 0v108H0z" fill="#42c8ff"/><path d="M134 267h514l-87 103H224z" fill="#ff5d24" stroke="#090b18" stroke-width="15"/><path d="M273 139h208v128H273z" fill="#f4edda" stroke="#090b18" stroke-width="13"/><path d="M377 48v219M377 55l156 77H377z" fill="#ffd166" stroke="#090b18" stroke-width="12"/>`,
  'property-portfolio': `<rect width="768" height="432" fill="url(#bg)"/><path d="M47 343h674" stroke="#42c8ff" stroke-width="12"/><path d="M74 341V194l96-79 96 79v147z" fill="#ff9d21" stroke="#090b18" stroke-width="13"/><path d="M291 341V82h158v259z" fill="#a879ff" stroke="#090b18" stroke-width="13"/><path d="M469 341V147h201v194z" fill="#46f29a" stroke="#090b18" stroke-width="13"/><path d="M320 117h32v32h-32zm67 0h32v32h-32zm-67 62h32v32h-32zm67 0h32v32h-32zm-67 62h32v32h-32zm67 0h32v32h-32z" fill="#ffd166"/><path d="M112 228h43v43h-43zm48 0h43v43h-43zm355-39h37v37h-37zm55 0h37v37h-37zm-55 60h37v37h-37zm55 0h37v37h-37z" fill="#42c8ff"/>`
};
for (const id of Object.keys(extendedScenes)) {
  addSvg('extended-mode',id,id.split('-').map(x=>x[0].toUpperCase()+x.slice(1)).join(' '),extendedScenes[id],{width:768,height:432,mode:'extended'});
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
