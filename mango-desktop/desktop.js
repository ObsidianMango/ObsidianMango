const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const BASE = 'https://obsidianmango.github.io/ObsidianMango/';
const KEY = 'mango-windows-31-v1';
const uniqueId = () => globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,12)}`;
const defaults = {wall:'#008080',pattern:'none',accent:'#000080',size:'classic',click:'double',launch:'window',sound:false,volume:25,remember:true,view:'icons',scanlines:false,motion:true,saver:0,clock24:false};
const initialFavorites = ['castle-smasher/index.html','gnatfall/index.html','parkside-evolution/index.html','mangowarz-classic/index.html','repo:bag-shift-06','life-forge.html','purcho/unified/index.html'];
let storageAvailable = true;
let state;
try { state = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { state = null; storageAvailable = false; }
if (!state || typeof state !== 'object' || Array.isArray(state)) state = {};
function cleanSettings(s = {}) {
  const out = {...defaults};
  for (const k of ['sound','remember','scanlines','motion','clock24']) if (typeof s[k] === 'boolean') out[k] = s[k];
  for (const k of ['wall','accent']) if (/^#[0-9a-f]{6}$/i.test(s[k] || '')) out[k] = s[k];
  for (const [k, choices] of Object.entries({pattern:['none','dots','grid','weave'],size:['classic','comfortable'],click:['single','double'],launch:['window','tab'],view:['icons','list']})) if (choices.includes(s[k])) out[k] = s[k];
  if (Number.isFinite(s.volume)) out.volume = Math.min(100, Math.max(0, s.volume));
  if ([0,1,3,5,10].includes(s.saver)) out.saver = s.saver;
  return out;
}
state.settings = cleanSettings(state.settings);
state.favorites = Array.isArray(state.favorites) ? state.favorites.filter(x => typeof x === 'string').slice(0,1000) : initialFavorites;
state.recent = Array.isArray(state.recent) ? state.recent.filter(x => typeof x === 'string').slice(0,30) : [];
state.layout = state.layout && typeof state.layout === 'object' && !Array.isArray(state.layout) ? state.layout : {};
state.custom = Array.isArray(state.custom) ? state.custom.filter(validCustom).slice(0,500) : [];
state.groups = Array.isArray(state.groups) ? state.groups.filter(validGroup).slice(0,30) : [];
state.overrides = state.overrides && typeof state.overrides === 'object' && !Array.isArray(state.overrides) ? state.overrides : {};
const ws = $('#workspace'), windowLayer = $('#windows');
const windows = new Map();
let catalog, allItems = [], groups = [], z = 10, sequence = 0, selected = null, menuCleanup = null, audioContext;
let saveTimer, toastTimer, lastActivity = Date.now(), saverShowing = false;
const mobile = () => matchMedia('(max-width:620px)').matches;
const safeURL = value => { try { const u = new URL(value); return ['https:','http:'].includes(u.protocol) ? u.href : null; } catch { return null; } };
function validCustom(x) { return x && typeof x.id === 'string' && typeof x.title === 'string' && x.title.trim() && typeof x.group === 'string' && /^https?:\/\//i.test(x.url || '') && (() => {try{return ['http:','https:'].includes(new URL(x.url).protocol);}catch{return false;}})(); }
function validGroup(x) { return x && typeof x.id === 'string' && /^custom-group-[a-z0-9-]+$/i.test(x.id) && typeof x.title === 'string' && x.title.trim(); }
function cleanLayout(layout) {
  const out={};
  if(!layout || typeof layout!=='object')return out;
  for(const [id,l]of Object.entries(layout).slice(0,100))if(id.startsWith('group:')&&l&&[l.x,l.y,l.width,l.height].every(Number.isFinite))out[id]={x:Math.max(0,l.x),y:Math.max(0,l.y),width:Math.max(275,Math.min(4000,l.width)),height:Math.max(200,Math.min(3000,l.height)),maximized:!!l.maximized,open:!!l.open,minimized:!!l.minimized};
  return out;
}
function persist() {
  clearTimeout(saveTimer);
  try { localStorage.setItem(KEY, JSON.stringify(state)); storageAvailable = true; }
  catch { storageAvailable = false; toast('Your browser could not save changes. Use Control Panel → Data to export a backup.'); }
}
function scheduleSave() { clearTimeout(saveTimer); saveTimer = setTimeout(persist, 250); }
function toast(message) { $('#toast').textContent = message; $('#toast').hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => $('#toast').hidden = true, 4200); }
function beep(kind = 'open') {
  if (!state.settings.sound) return;
  try {
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === 'suspended') audioContext.resume();
    const osc = audioContext.createOscillator(), gain = audioContext.createGain(), now = audioContext.currentTime;
    osc.type = 'square'; osc.frequency.value = kind === 'close' ? 330 : kind === 'error' ? 180 : 660;
    gain.gain.setValueAtTime(state.settings.volume / 2500, now); gain.gain.exponentialRampToValueAtTime(0.0001, now + .075);
    osc.connect(gain).connect(audioContext.destination); osc.start(now); osc.stop(now + .08);
  } catch { /* Audio is optional. */ }
}
function icon(name = 'game', seed = '') {
  const colors = ['#000080','#800080','#008080','#008000','#800000','#b06000'];
  const hue = colors[[...seed].reduce((n,c) => n + c.charCodeAt(0),0) % colors.length];
  const shape = {
    folder:'<path fill="#000" d="M2 7h12l3 3h13v19H2z"/><path fill="#ffff80" d="M3 8h10l3 3h13v16H3z"/><path fill="#808000" d="M4 14h27l-4 15H1z"/><path fill="#ffff00" d="M5 15h25l-4 12H2z"/><path fill="#fff" d="M4 10h9v2H4z"/>',
    game:'<path fill="#000" d="M7 9h18l5 6v12h-6l-5-5h-6l-5 5H2V15z"/><path fill="#c0c0c0" d="M8 10h16l5 6v9h-4l-5-5h-8l-5 5H3v-9z"/><path fill="#fff" d="M9 11h14v2H9z"/><path fill="#000" d="M8 13h3v3h3v3h-3v3H8v-3H5v-3h3z"/><path fill="#f00" d="M24 14h3v3h-3z"/><path fill="#00f" d="M20 18h3v3h-3z"/>',
    car:'<path fill="#000" d="M8 4h16l4 9h3v13h-5v3h-6v-3h-9v3H5v-4H1V13h3z"/><path fill="'+hue+'" d="M9 5h14l4 9h3v10H2V14h3z"/><path fill="#0ff" d="M10 7h11l3 7H7z"/><path fill="#fff" d="M3 16h7v4H3zM23 16h6v4h-6z"/><path fill="#808080" d="M12 19h9v3h-9z"/>',
    cards:'<path fill="#000" d="M2 7l20-5 7 24-20 5z"/><path fill="#fff" d="M3 8l18-4 6 21-17 5z"/><path fill="#000" d="M9 5h21v25H9z"/><path fill="#fff" d="M10 6h19v23H10z"/><path fill="#f00" d="M17 12h3v2h3v4h-2v2h-2v2h-2v-2h-2v-2h-2v-4h4zM12 8h3v3h-3z"/>',
    work:'<path fill="#000" d="M10 4h13v5h7v20H2V9h8z"/><path fill="#808000" d="M3 10h26v18H3z"/><path fill="#ffff80" d="M11 5h11v4h-2V7h-7v2h-2zM3 10h26v8H3z"/><path fill="#fff" d="M4 11h24v2H4z"/><path fill="#000" d="M14 16h5v5h-5z"/><path fill="#c0c0c0" d="M15 17h3v3h-3z"/>',
    tools:'<path fill="#000" d="M3 2h7v4H7v6h7V6h-3V2h8v13l-5 5v9H8V19l-5-4z"/><path fill="#c0c0c0" d="M4 3h5v2H6v8h9V5h-3V3h6v11l-5 5v9H9V18l-5-4z"/><path fill="#000" d="M23 2h4v14l4 5v9H20v-9l3-5z"/><path fill="'+hue+'" d="M21 22h9v7h-9z"/><path fill="#fff" d="M24 3h2v13h-2z"/>',
    art:'<path fill="#000" d="M3 3h24v24H3z"/><path fill="#fff" d="M4 4h22v22H4z"/><path fill="#00ffff" d="M6 6h18v12H6z"/><path fill="#008000" d="M6 18l5-7 6 8 3-5 4 6v4H6z"/><path fill="#ff0" d="M19 7h4v4h-4z"/><path fill="#000" d="M14 29l14-20 3 2-13 20z"/><path fill="#b06000" d="M15 28l13-18 2 1-13 19z"/>',
    world:'<path fill="#000" d="M10 2h12v2h5v5h3v14h-3v5h-6v3H10v-3H4v-5H1V10h3V5h6z"/><path fill="#0000ff" d="M11 3h10v2h5v5h3v12h-3v5h-6v3h-9v-3H5v-5H2V11h3V6h6z"/><path fill="#0f0" d="M10 4h9v4h-5v3H7v6H3v-6h3V7h4zM20 12h8v9h-4v5h-5v-7h-3v-5h4zM9 20h5v8h-3v-3H7v-4z"/>',
    book:'<path fill="#000" d="M2 4h11l3 3 3-3h11v24H19l-3 3-3-3H2z"/><path fill="#fff" d="M3 5h9l3 3v20l-3-2H3zM17 8l3-3h9v21h-9l-3 2z"/><path fill="#000080" d="M5 9h7v2H5zM5 14h7v1H5zM5 18h7v1H5zM20 9h6v2h-6zM20 14h6v1h-6zM20 18h6v1h-6z"/>',
    flask:'<path fill="#000" d="M11 2h11v4h-2v8l10 14v3H2v-3l11-14V6h-2z"/><path fill="#fff" d="M14 5h5v10l9 13v2H4v-2l10-13z"/><path fill="#00ff00" d="M10 21h12l5 7H5z"/><path fill="#008000" d="M12 24h3v3h-3zM19 22h3v3h-3z"/>',
    star:'<path fill="#000" d="M14 2h4l3 9h10v4l-8 5 3 11h-4l-6-6-7 6H5l4-11-8-5v-4h10z"/><path fill="#ff0" d="M16 3l4 10h10l-9 6 3 10-8-6-9 6 4-10-9-6h11z"/><path fill="#fff" d="M15 8h2v7h-7v-2h5z"/>',
    clock:'<path fill="#000" d="M9 2h14v3h5v5h3v13h-3v5h-6v3H9v-3H4v-6H1V10h3V5h5z"/><path fill="#fff" d="M10 3h12v3h5v5h3v11h-3v5h-6v3H10v-3H5v-6H2V11h3V6h5z"/><path fill="#000" d="M15 7h2v10h7v2h-9z"/>',
    monitor:'<path fill="#000" d="M2 2h28v21H2zM12 23h8v4h7v4H5v-4h7z"/><path fill="#c0c0c0" d="M3 3h26v19H3z"/><path fill="#fff" d="M3 3h26v2H3zM3 3h2v18H3z"/><path fill="#000080" d="M6 6h20v13H6z"/><path fill="#ffb52e" d="M11 10h10v7H10v-5h1z"/><path fill="#00ff00" d="M14 8h7v2h-7z"/>',
    castle:'<path fill="#000" d="M1 6h4v4h3V6h5v4h5V6h5v4h4V6h4v24H1z"/><path fill="#c0c0c0" d="M2 7h2v4h5V7h3v23H2zM20 7h2v4h6V7h2v23H20zM13 15h6v15h-6z"/><path fill="#808080" d="M3 16h7v2H3zM3 23h7v2H3zM21 16h7v2h-7zM21 23h7v2h-7z"/><path fill="#000" d="M14 22h4v8h-4zM5 12h3v4H5zM23 12h3v4h-3z"/>',
    bug:'<path fill="#c0c0c0" stroke="#000" d="M13 13L1 3v10l12 6M19 13L31 3v10l-12 6"/><path fill="#000" d="M12 9h9v16h-3v6h-4v-6h-3zM7 19h6v2H7v5H5v-7zM20 19h6v7h-2v-5h-4z"/><path fill="#f00" d="M12 10h4v4h-4zM18 10h4v4h-4z"/><path fill="#808000" d="M14 16h5v9h-5z"/>',
    frog:'<path fill="#000" d="M5 4h7v4h8V4h7v8h3v14h-4v4h-8v-4h-5v4H3v-4H1V13h4z"/><path fill="#00ff00" d="M6 5h5v4h10V5h5v8h3v12h-4v4h-6v-4h-7v4H4v-4H2V14h4z"/><path fill="#fff" d="M6 6h4v5H6zM22 6h4v5h-4z"/><path fill="#000" d="M7 7h2v3H7zM23 7h2v3h-2zM8 18h16v3H8z"/>',
    tree:'<path fill="#000" d="M13 1h6v4h5v5h5v10h-9v10h-8V20H3V10h5V5h5z"/><path fill="#008000" d="M14 2h4v4h5v5h5v8H4v-8h5V6h5z"/><path fill="#00ff00" d="M14 3h3v4h-5v5H6v-2h4V6h4z"/><path fill="#805000" d="M13 20h6v9h-6z"/>',
    night:'<path fill="#000" d="M2 2h28v29H2z"/><path fill="#000080" d="M3 3h26v27H3z"/><path fill="#f0f" d="M5 5h22v4H5zM5 12h3v13H5zM24 12h3v13h-3z"/><path fill="#ffff00" d="M11 12h10v3H11zM13 16h6v3h-6zM10 21h12v6H10z"/>',
    barcode:'<path fill="#000" d="M2 3h28v26H2z"/><path fill="#fff" d="M3 4h26v24H3z"/><path fill="#000" d="M5 7h2v14H5zM9 7h1v14H9zM12 7h3v14h-3zM17 7h1v14h-1zM20 7h2v14h-2zM24 7h3v14h-3zM5 23h22v2H5z"/>',
    slot:'<path fill="#000" d="M3 2h24v9h3v16h-2v4H2v-4H1V11h2z"/><path fill="#808000" d="M4 3h22v9h3v14H3V12h1z"/><path fill="#ff0" d="M5 4h20v6H5zM3 27h24v3H3z"/><path fill="#fff" d="M4 13h7v11H4zM13 13h6v11h-6zM21 13h6v11h-6z"/><path fill="#f00" d="M5 15h5v2H8v5H6v-5H5zM14 15h4v2h-2v5h-2zM22 15h4v2h-2v5h-2z"/>',
    puzzle:'<path fill="#000" d="M2 2h28v28H2z"/><path fill="#000080" d="M3 3h26v26H3z"/><path fill="#f00" d="M4 4h10v10H4z"/><path fill="#0f0" d="M17 4h10v10H17z"/><path fill="#ff0" d="M4 17h10v10H4z"/><path fill="#0ff" d="M17 17h10v10H17z"/><path fill="#fff" d="M5 5h8v2H5zM18 5h8v2h-8zM5 18h8v2H5zM18 18h8v2h-8z"/>',
    dice:'<path fill="#000" d="M8 2h16l7 7v21H8l-7-7V8z"/><path fill="#808080" d="M2 9l6-6h15l6 6H8v19l-6-6z"/><path fill="#fff" d="M9 10h20v18H9z"/><path fill="#000" d="M12 12h3v3h-3zM23 12h3v3h-3zM17 17h3v3h-3zM12 23h3v3h-3zM23 23h3v3h-3z"/>',
    calculator:'<path fill="#000" d="M5 1h23v30H5z"/><path fill="#c0c0c0" d="M6 2h21v28H6z"/><path fill="#008000" d="M8 4h17v7H8z"/><path fill="#0f0" d="M19 5h4v4h-4z"/><path fill="#000080" d="M8 14h4v4H8zM14 14h4v4h-4zM20 14h4v4h-4zM8 20h4v4H8zM14 20h4v4h-4zM20 20h4v7h-4zM8 26h10v2H8z"/>',
    note:'<path fill="#000" d="M4 1h22v30H4z"/><path fill="#fff" d="M5 2h20v28H5z"/><path fill="#000080" d="M8 6h14v2H8zM8 11h14v1H8zM8 15h14v1H8zM8 19h14v1H8zM8 23h10v1H8z"/><path fill="#f00" d="M19 25l9-18 3 2-9 18-4 3z"/><path fill="#ff0" d="M20 25l8-16 1 1-8 16z"/>',
    wine:'<path fill="#000" d="M4 2h24v12l-4 5-6 2v7h7v3H7v-3h7v-7l-6-2-4-5z"/><path fill="#fff" d="M5 3h22v10l-4 5-7 2-7-2-4-5z"/><path fill="'+(hue==='#008000'?'#800000':hue)+'" d="M6 9h20v4l-4 4-6 2-6-2-4-4z"/><path fill="#fff" d="M8 10h2v4H8z"/>'
  };
  return `<span class="pixel-icon" aria-hidden="true"><svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">${shape[name] || shape.folder}</svg></span>`;
}
function itemIcon(item) {
  let kind = item.icon;
  if (/frog/i.test(item.id)) kind = 'frog';
  if (/castle/.test(item.id)) kind = 'castle';
  if (/slot|whammy|price-right/.test(item.id)) kind = 'slot';
  if (/15p|cuber|cube2|tetris|foodtris|mine|stack|word/.test(item.id)) kind = 'puzzle';
  if (/dice|d20|roll-the-bones/.test(item.id)) kind = 'dice';
  if (/calc|princos|ccc/.test(item.id)) kind = 'calculator';
  if (/note|qw|tm5|tm8|clean/.test(item.id)) kind = 'note';
  if (/boozy|wine|vinobrot|VINOO|liq|keg|dplan/.test(item.id)) kind = 'wine';
  return icon(kind, item.id);
}
function rebuildCatalog() {
  groups = [...catalog.groups, ...state.groups.map(g => ({...g,icon:'folder',description:'Your custom program group'}))];
  const validGroups = new Set(groups.map(g => g.id));
  allItems = [...catalog.items, ...state.custom].map(i => {
    const o = state.overrides[i.id] || {};
    return {...i,title:typeof o.title === 'string' && o.title.trim() ? o.title.slice(0,100) : i.title,group:validGroups.has(o.group) ? o.group : validGroups.has(i.group) ? i.group : 'accessories',icon:i.icon || 'game'};
  });
}
function itemURL(item) { return item.url ? safeURL(item.url) : new URL(item.path,BASE).href; }
function applySettings() {
  const s = state.settings;
  document.documentElement.style.setProperty('--wall',s.wall);
  document.documentElement.style.setProperty('--navy',s.accent);
  document.documentElement.style.setProperty('--ui',s.size === 'comfortable' ? '15px' : '13px');
  document.documentElement.style.setProperty('--icon',s.size === 'comfortable' ? '44px' : '36px');
  ws.className = s.pattern === 'none' ? '' : `pattern-${s.pattern}`;
  document.body.classList.toggle('scanlines',s.scanlines);
  document.body.classList.toggle('no-motion',!s.motion);
  $('#sound-toggle').textContent = `Sound: ${s.sound ? 'on' : 'off'}`;
  $('#sound-toggle').setAttribute('aria-pressed',String(s.sound));
  updateClock();
}
function selectItem(button, item, win) {
  $$('.program.selected,.desktop-item.selected').forEach(n => n.classList.remove('selected'));
  button.classList.add('selected');
  selected = {item,win,button};
  if (win?.status) {
    win.status.querySelector('span').textContent = item.description || item.title;
    const open = win.status.querySelector('button');
    if (open) {open.hidden = false;open.onclick = () => launch(item);}
  }
  $('#desktop-status').textContent = item.description || item.title;
}
function wireActivation(button, select, open) {
  button.addEventListener('click', e => {
    select();
    if (state.settings.click === 'single' || e.pointerType === 'touch' || e.pointerType === 'pen' || e.detail === 0) open();
  });
  button.addEventListener('dblclick', e => { if (state.settings.click === 'double' && e.pointerType !== 'touch' && e.pointerType !== 'pen') open(); });
}
function renderDesktop() {
  const special = [
    {id:'favorites',title:'Favorites',icon:'star'},
    ...groups,
    {id:'recent',title:'Recently Used',icon:'clock'},
    {id:'control',title:'Control Panel',icon:'tools'},
    {id:'help',title:'Getting Started',icon:'book'}
  ];
  const container = $('#desktop-icons'); container.replaceChildren();
  for (const group of special) {
    const b = document.createElement('button'); b.className = 'desktop-item';b.dataset.group = group.id;
    b.innerHTML = `${icon(group.icon)}<span>${esc(group.title)}</span>`;
    b.title = group.description || group.title;
    wireActivation(b,() => {$$('.desktop-item.selected').forEach(n => n.classList.remove('selected'));b.classList.add('selected');},() => group.id === 'control' ? openSettings() : group.id === 'help' ? openHelp() : openGroup(group.id));
    b.addEventListener('dragover',e => {if(groups.some(g => g.id === group.id)){e.preventDefault();b.classList.add('drop-target');}});
    b.addEventListener('dragleave',() => b.classList.remove('drop-target'));
    b.addEventListener('drop',e => {e.preventDefault();b.classList.remove('drop-target');const id=e.dataTransfer.getData('text/mango-id');if(allItems.some(i => i.id === id)&&groups.some(g => g.id === group.id)){state.overrides[id]={...state.overrides[id],group:group.id};persist();refreshPrograms();toast(`Moved to ${group.title}.`);}});
    container.append(b);
  }
}
function clampWindow(win) {
  if (win.maximized) return;
  const rect = ws.getBoundingClientRect();
  win.width = Math.min(Math.max(275,win.width),rect.width);
  win.height = Math.min(Math.max(200,win.height),rect.height - (mobile() ? 46 : 42));
  win.x = Math.min(Math.max(0,win.x),Math.max(0,rect.width-win.width));
  win.y = Math.min(Math.max(0,win.y),Math.max(0,rect.height-win.height-40));
  Object.assign(win.el.style,{left:`${win.x}px`,top:`${win.y}px`,width:`${win.width}px`,height:`${win.height}px`});
}
function rememberWindow(win) {
  if (!state.settings.remember || win.kind === 'app') return;
  state.layout[win.id] = {x:win.x,y:win.y,width:win.width,height:win.height,maximized:win.maximized,open:!win.closed,minimized:win.minimized};
  scheduleSave();
}
function focusWindow(win) {
  if (win.minimized) {win.minimized=false;win.el.hidden=false;win.dock?.remove();win.dock=null;}
  for (const w of windows.values()) w.el.classList.toggle('active',w === win);
  win.el.style.zIndex = ++z;
  $('#desktop-status').textContent = win.title;
}
function closeWindow(win) {
  if (!windows.has(win.id)) return;
  win.closed = true;rememberWindow(win);win.el.remove();win.dock?.remove();windows.delete(win.id);beep('close');
  const remaining = [...windows.values()].filter(w => !w.minimized).sort((a,b) => +b.el.style.zIndex - +a.el.style.zIndex);
  if (remaining[0]) focusWindow(remaining[0]);else $('#desktop-status').textContent = `${allItems.length} programs · ${groups.length} groups`;
  if (selected?.win === win) selected = null;
}
function minimizeWindow(win) {
  win.minimized=true;win.el.hidden=true;
  const b=document.createElement('button');b.className='minimized-item';b.innerHTML=`${icon(win.icon)}<span>${esc(win.title)}</span>`;b.title=`Restore ${win.title}`;b.onclick=()=>{focusWindow(win);rememberWindow(win);};$('#minimized').append(b);win.dock=b;rememberWindow(win);
}
function maximizeWindow(win) {
  win.maximized=!win.maximized;win.el.classList.toggle('maximized',win.maximized);
  win.maxButton.textContent = win.maximized ? '◆' : '▲';win.maxButton.setAttribute('aria-label',win.maximized ? 'Restore window' : 'Maximize window');
  if (!win.maximized) clampWindow(win);
  rememberWindow(win);
}
function createWindow({id,title,icon:iconName='folder',width=640,height=470,x,y,kind='panel',panel=false}) {
  if (windows.has(id)) {const w=windows.get(id);focusWindow(w);return w;}
  const saved = state.settings.remember && kind !== 'app' ? state.layout[id] : null;
  const win = {id,title,icon:iconName,kind,x:x??(180+(sequence%5)*25),y:y??(45+(sequence%5)*24),width,height,maximized:false,minimized:false,closed:false};
  if (saved && [saved.x,saved.y,saved.width,saved.height].every(Number.isFinite)) Object.assign(win,{x:saved.x,y:saved.y,width:saved.width,height:saved.height,maximized:!!saved.maximized});
  sequence++;
  const el=document.createElement('section');el.className='window';el.dataset.window=id;el.setAttribute('role','region');el.setAttribute('aria-label',title);
  el.innerHTML=`<header class="titlebar"><button class="system-button" aria-label="Window menu">−</button><span class="title-text">${esc(title)}</span><button class="title-control minimize" aria-label="Minimize window">▼</button><button class="title-control maximize" aria-label="Maximize window">▲</button><button class="title-control close" aria-label="Close window">×</button></header><div class="window-content${panel?' panel':''}"></div><div class="resize-grip" aria-label="Resize window"></div>`;
  win.el=el;win.content=$('.window-content',el);win.maxButton=$('.maximize',el);
  windowLayer.append(el);windows.set(id,win);
  if (mobile()) {win.x=0;win.y=0;win.width=ws.clientWidth;win.height=ws.clientHeight-44;win.maximized=false;}
  el.classList.toggle('maximized',win.maximized);clampWindow(win);focusWindow(win);
  $('.close',el).onclick=()=>closeWindow(win);$('.minimize',el).onclick=()=>minimizeWindow(win);win.maxButton.onclick=()=>maximizeWindow(win);
  $('.system-button',el).onclick=e=>{e.stopPropagation();popup([['Restore',()=>{if(win.maximized)maximizeWindow(win);}],['Minimize',()=>minimizeWindow(win)],['Maximize',()=>{if(!win.maximized)maximizeWindow(win);}],null,['Close',()=>closeWindow(win),'Esc']],e.currentTarget.getBoundingClientRect().left,e.currentTarget.getBoundingClientRect().bottom);};
  el.addEventListener('pointerdown',()=>focusWindow(win));
  const titlebar=$('.titlebar',el);
  titlebar.addEventListener('dblclick',e=>{if(!e.target.closest('button'))maximizeWindow(win);});
  titlebar.addEventListener('pointerdown',e=>{
    if(e.target.closest('button')||win.maximized||mobile()||e.button!==0)return;
    beginPointer(e,win,(dx,dy)=>{win.x=startX+dx;win.y=startY+dy;clampWindow(win);});
    const startX=win.x,startY=win.y;
  });
  $('.resize-grip',el).addEventListener('pointerdown',e=>{
    if(win.maximized||mobile()||e.button!==0)return;
    const startW=win.width,startH=win.height;
    beginPointer(e,win,(dx,dy)=>{win.width=startW+dx;win.height=startH+dy;clampWindow(win);});
  });
  beep();rememberWindow(win);return win;
}
function beginPointer(e,win,move) {
  e.preventDefault();const handle=e.currentTarget,startX=e.clientX,startY=e.clientY;handle.setPointerCapture(e.pointerId);win.el.classList.add('dragging');
  const onMove=ev=>move(ev.clientX-startX,ev.clientY-startY);
  const onEnd=()=>{handle.removeEventListener('pointermove',onMove);handle.removeEventListener('pointerup',onEnd);handle.removeEventListener('pointercancel',onEnd);win.el.classList.remove('dragging');rememberWindow(win);};
  handle.addEventListener('pointermove',onMove);handle.addEventListener('pointerup',onEnd);handle.addEventListener('pointercancel',onEnd);
}
function groupItems(id) {
  if(id==='favorites')return state.favorites.map(id=>allItems.find(i=>i.id===id)).filter(Boolean);
  if(id==='recent')return state.recent.map(id=>allItems.find(i=>i.id===id)).filter(Boolean);
  return allItems.filter(i=>id==='all'||i.group===id);
}
function groupTitle(id) {return ({favorites:'Favorites',recent:'Recently Used',all:'All Programs'})[id]||groups.find(g=>g.id===id)?.title||'Programs';}
function openGroup(id) {
  const existing=windows.get(`group:${id}`);if(existing){focusWindow(existing);return existing;}
  const g=groups.find(g=>g.id===id);
  const w=createWindow({id:`group:${id}`,title:groupTitle(id),icon:g?.icon||(id==='favorites'?'star':'folder'),kind:'group',width:660,height:478});w.group=id;w.view=state.settings.view;w.filter='';renderGroup(w);return w;
}
function renderGroup(w) {
  $('.window-tools',w.el)?.remove();$('.window-status',w.el)?.remove();
  const tools=document.createElement('div');tools.className='window-tools';
  tools.innerHTML=`<span class="trail">C:\\MANGO\\${esc(groupTitle(w.group).toUpperCase())}</span><button class="classic-button small-button" data-action="view" title="Switch icons and list view">${w.view==='icons'?'≡ List':'▦ Icons'}</button><button class="classic-button small-button" data-action="search" title="Find a program">Find…</button>`;
  w.el.insertBefore(tools,w.content);
  $('[data-action=view]',tools).onclick=()=>{w.view=w.view==='icons'?'list':'icons';renderGroup(w);};
  $('[data-action=search]',tools).onclick=()=>openSearch('',w.group);
  const status=document.createElement('div');status.className='window-status';
  const items=groupItems(w.group);
  status.innerHTML=`<span>${items.length} programs · ${mobile()?'Tap':state.settings.click==='single'?'Click':'Double-click'} to open</span><button class="classic-button small-button" hidden>Open</button>`;
  w.el.insertBefore(status,$('.resize-grip',w.el));w.status=status;
  w.content.replaceChildren();
  const grid=document.createElement('div');grid.className=`icon-grid ${w.view==='list'?'list-view':''}`;
  for(const item of items)grid.append(programButton(item,w));
  if(!items.length)grid.innerHTML=`<div class="empty">${w.group==='favorites'?'No favorites yet. Right-click a program or use its Properties to add one.':w.group==='recent'?'Open a program and it will appear here.':'This group is empty. Use File → New Shortcut, or move a program here through Properties.'}</div>`;
  w.content.append(grid);
}
function programButton(item,w,showGroup=false) {
  const b=document.createElement('button');b.className='program';b.dataset.item=item.id;b.title=`${item.title}\n${item.description}`;b.draggable=true;
  b.innerHTML=`${itemIcon(item)}<span class="label">${esc(item.title)}</span>${state.favorites.includes(item.id)?'<span class="favorite-dot" aria-label="Favorite">★</span>':''}${showGroup?`<span class="result-group">${esc(groupTitle(item.group))}</span>`:''}`;
  wireActivation(b,()=>selectItem(b,item,w),()=>launch(item));
  b.addEventListener('contextmenu',e=>{e.preventDefault();selectItem(b,item,w);programMenu(item,e.clientX,e.clientY);});
  b.addEventListener('dragstart',e=>{e.dataTransfer.setData('text/mango-id',item.id);e.dataTransfer.effectAllowed='move';});
  return b;
}
function refreshPrograms() {rebuildCatalog();renderDesktop();for(const w of windows.values())if(w.kind==='group')renderGroup(w);else if(w.kind==='search')renderSearchResults(w);}
function recordLaunch(item) {state.recent=[item.id,...state.recent.filter(id=>id!==item.id)].slice(0,30);persist();const recent=windows.get('group:recent');if(recent)renderGroup(recent);}
function newTab(item) {
  const url=itemURL(item);if(!url)return toast('This shortcut does not have a valid web address.');
  const opened=window.open(url,'_blank','noopener,noreferrer');
  // noopener may return null even when the tab successfully opened.
  recordLaunch(item);return opened;
}
function launch(item,forceMode) {
  closeMenu();
  if((forceMode||state.settings.launch)==='tab'){newTab(item);return;}
  recordLaunch(item);
  const id=`app:${item.id}`;if(windows.has(id)){focusWindow(windows.get(id));return;}
  const url=itemURL(item);if(!url)return toast('This shortcut does not have a valid web address.');
  const w=createWindow({id,title:item.title,icon:item.icon,kind:'app',width:Math.min(ws.clientWidth-30,1000),height:Math.min(ws.clientHeight-60,720),x:Math.min(190,Math.max(0,(ws.clientWidth-1000)/2)),y:20});w.item=item;
  const bar=document.createElement('div');bar.className='appbar';bar.innerHTML=`<span class="app-url" title="${esc(url)}">${esc(url)}</span><button class="classic-button small-button" data-app="reload">Reload</button><button class="classic-button small-button" data-app="properties">Properties</button><button class="classic-button small-button" data-app="tab">Open in tab ↗</button>`;w.el.insertBefore(bar,w.content);
  w.content.classList.add('frame-container');
  const notice=document.createElement('div');notice.className='frame-notice';notice.innerHTML='<span>For more space or if the app cannot load here, open it in a tab.</span><button aria-label="Dismiss launch hint">Dismiss</button>';notice.querySelector('button').onclick=()=>notice.remove();
  const frame=document.createElement('iframe');frame.className='app-frame';frame.title=item.title;frame.src=url;frame.allow='fullscreen; gamepad; clipboard-write; camera; microphone; autoplay';frame.allowFullscreen=true;frame.referrerPolicy='strict-origin-when-cross-origin';
  w.content.append(notice,frame);
  $('[data-app=reload]',bar).onclick=()=>{frame.src=url;};$('[data-app=properties]',bar).onclick=()=>openProperties(item);$('[data-app=tab]',bar).onclick=()=>newTab(item);
}
function toggleFavorite(item) {state.favorites=state.favorites.includes(item.id)?state.favorites.filter(id=>id!==item.id):[...state.favorites,item.id];persist();refreshPrograms();toast(state.favorites.includes(item.id)?'Added to Favorites.':'Removed from Favorites.');}
function programMenu(item,x,y) {popup([['Open',()=>launch(item)],['Open in new tab',()=>newTab(item)],null,[state.favorites.includes(item.id)?'Remove from Favorites':'Add to Favorites',()=>toggleFavorite(item)],['Properties…',()=>openProperties(item),'Alt+Enter']],x,y);}
function popup(entries,x,y) {
  closeMenu();const p=$('#menu-popup');p.replaceChildren();
  for(const entry of entries){if(!entry){p.append(document.createElement('hr'));continue;}const [label,action,key]=entry;const b=document.createElement('button');b.innerHTML=`<span>${esc(label)}</span>${key?`<kbd>${esc(key)}</kbd>`:''}`;b.onclick=()=>{closeMenu();action();};p.append(b);}
  p.hidden=false;const r=p.getBoundingClientRect();p.style.left=`${Math.max(4,Math.min(x,innerWidth-r.width-5))}px`;p.style.top=`${Math.max(4,Math.min(y,innerHeight-r.height-5))}px`;
  const outside=e=>{if(!p.contains(e.target)&&!e.target.closest('[data-menu]'))closeMenu();};
  document.addEventListener('pointerdown',outside);menuCleanup=()=>document.removeEventListener('pointerdown',outside);
}
function closeMenu() {$('#menu-popup').hidden=true;menuCleanup?.();menuCleanup=null;$$('[data-menu].open').forEach(b=>b.classList.remove('open'));}
function openSearch(query='',scope='all') {
  const existing=windows.get('search');if(existing){focusWindow(existing);existing.scope=scope;existing.input.value=query;renderSearchResults(existing);existing.input.focus();return existing;}
  const w=createWindow({id:'search',title:'Find a Program',icon:'book',kind:'search',width:610,height:475});w.scope=scope;
  const tools=document.createElement('div');tools.className='window-tools';tools.innerHTML=`<div class="search-wrap"><label for="program-query">Find:</label><input class="search-input" id="program-query" type="search" placeholder="Name, folder, description…" autocomplete="off" spellcheck="false"></div><select aria-label="Search group"><option value="all">All programs</option>${groups.map(g=>`<option value="${esc(g.id)}">${esc(g.title)}</option>`).join('')}</select>`;
  w.el.insertBefore(tools,w.content);w.input=$('input',tools);w.input.value=query;
  const select=$('select',tools);select.value=groups.some(g=>g.id===scope)?scope:'all';w.scope=select.value;
  w.input.oninput=()=>renderSearchResults(w);select.onchange=()=>{w.scope=select.value;renderSearchResults(w);};
  w.input.onkeydown=e=>{if(e.key==='Enter'){const item=w.results?.[0];if(item)launch(item);}if(e.key==='ArrowDown'){$('.program',w.content)?.focus();e.preventDefault();}};
  const status=document.createElement('div');status.className='window-status';status.innerHTML='<span></span><button class="classic-button small-button" hidden>Open</button>';w.el.insertBefore(status,$('.resize-grip',w.el));w.status=status;
  renderSearchResults(w);setTimeout(()=>w.input.focus(),50);return w;
}
function renderSearchResults(w) {
  const q=w.input.value.trim().toLocaleLowerCase();
  const terms=q.split(/\s+/).filter(Boolean);
  w.results=allItems.filter(i=>(w.scope==='all'||i.group===w.scope)&&terms.every(t=>`${i.title} ${i.description} ${i.path||''} ${groupTitle(i.group)}`.toLocaleLowerCase().includes(t)));
  w.content.replaceChildren();const grid=document.createElement('div');grid.className='icon-grid list-view search-results';w.results.forEach(i=>grid.append(programButton(i,w,true)));
  if(!w.results.length)grid.innerHTML='<div class="empty">No programs match. Try another name or search all groups.</div>';
  w.content.append(grid);$('span',w.status).textContent=`${w.results.length} matching programs`;w.status.querySelector('button').hidden=true;
}
function openProperties(item) {
  const w=createWindow({id:`properties:${item.id}`,title:'Program Properties',icon:item.icon,width:440,height:475,panel:true});
  w.content.innerHTML=`<form class="panel-pad"><div class="properties-head">${itemIcon(item)}<strong>${esc(item.title)}</strong></div><label class="stacked">Program name<input name="title" maxlength="100" required value="${esc(item.title)}"></label><label class="stacked">Program group<select name="group">${groups.map(g=>`<option value="${esc(g.id)}"${g.id===item.group?' selected':''}>${esc(g.title)}</option>`).join('')}</select></label><label><input name="favorite" type="checkbox"${state.favorites.includes(item.id)?' checked':''}> Show in Favorites</label><p class="muted">${esc(item.description)}</p><div class="properties-url">${esc(itemURL(item))}</div><div class="dialog-actions">${item.id.startsWith('custom:')?'<button type="button" class="classic-button" data-delete>Delete shortcut</button>':''}<button type="button" class="classic-button" data-cancel>Cancel</button><button class="classic-button primary" type="submit">OK</button></div></form>`;
  $('[data-cancel]',w.content).onclick=()=>closeWindow(w);
  const form=$('form',w.content);form.onsubmit=e=>{e.preventDefault();const data=new FormData(form);state.overrides[item.id]={title:String(data.get('title')).trim()||item.title,group:String(data.get('group'))};const favorite=data.has('favorite');state.favorites=state.favorites.filter(id=>id!==item.id);if(favorite)state.favorites.push(item.id);persist();closeWindow(w);refreshPrograms();};
  const del=$('[data-delete]',w.content);if(del)del.onclick=()=>confirmDialog('Delete Shortcut',`Remove “${item.title}” from this desktop? The original website will remain available.`,()=>{state.custom=state.custom.filter(i=>i.id!==item.id);state.favorites=state.favorites.filter(id=>id!==item.id);delete state.overrides[item.id];persist();closeWindow(w);refreshPrograms();});
}
function openNewShortcut() {
  const w=createWindow({id:'new-shortcut',title:'New Program Shortcut',icon:'game',width:440,height:365,panel:true});
  w.content.innerHTML=`<form class="panel-pad"><label class="stacked">Program name<input name="title" required maxlength="100" placeholder="My new game"></label><label class="stacked">Web address<input name="url" type="url" required placeholder="https://…"></label><label class="stacked">Program group<select name="group">${groups.map(g=>`<option value="${esc(g.id)}">${esc(g.title)}</option>`).join('')}</select></label><p class="muted">Custom shortcuts are saved in this browser. Export a backup in Control Panel to take them with you.</p><div class="dialog-actions"><button type="button" class="classic-button" data-cancel>Cancel</button><button class="classic-button primary" type="submit">Create</button></div></form>`;
  $('[data-cancel]',w.content).onclick=()=>closeWindow(w);
  $('form',w.content).onsubmit=e=>{e.preventDefault();const f=new FormData(e.target),url=safeURL(f.get('url'));if(!url)return toast('Enter a complete http or https address.');const g=String(f.get('group'));state.custom.push({id:`custom:${uniqueId()}`,title:String(f.get('title')).trim().slice(0,100),url,group:g,description:'Your custom shortcut.',icon:'game'});persist();refreshPrograms();closeWindow(w);openGroup(g);toast('Shortcut created.');};
}
function openNewGroup() {
  const w=createWindow({id:'new-group',title:'New Program Group',icon:'folder',width:365,height:230,panel:true});
  w.content.innerHTML='<form class="panel-pad"><label class="stacked">Group name<input name="title" required maxlength="40" placeholder="My collection"></label><div class="dialog-actions"><button type="button" class="classic-button" data-cancel>Cancel</button><button type="submit" class="classic-button primary">Create</button></div></form>';
  $('[data-cancel]',w.content).onclick=()=>closeWindow(w);$('form',w.content).onsubmit=e=>{e.preventDefault();const title=new FormData(e.target).get('title').trim();if(!title)return;const id=`custom-group-${uniqueId()}`;state.groups.push({id,title});persist();refreshPrograms();closeWindow(w);openGroup(id);toast('Group created. Move programs here through Properties.');};
}
function openSettings(tab='display') {
  const w=createWindow({id:'control-panel',title:'Control Panel',icon:'tools',width:480,height:550,panel:true});
  w.settingsTab=tab;renderSettings(w);return w;
}
function renderSettings(w) {
  const s=state.settings,tab=w.settingsTab;
  const tabs=[['display','Display'],['desktop','Desktop'],['sound','Sound'],['data','Data']];
  w.content.innerHTML=`<div class="tabs" role="tablist" aria-label="Control Panel">${tabs.map(([id,name])=>`<button role="tab" aria-selected="${id===tab}" data-tab="${id}">${name}</button>`).join('')}</div><div class="panel-pad" data-settings-panel role="tabpanel"></div>`;
  $$('[data-tab]',w.content).forEach(b=>b.onclick=()=>{w.settingsTab=b.dataset.tab;renderSettings(w);});
  const panel=$('[data-settings-panel]',w.content);
  if(tab==='display')panel.innerHTML=`<div class="settings-preview"><div><div class="fake-title">Mango Windows</div><div class="fake-body">Program Manager</div></div></div><form data-settings-form><fieldset><legend>Colors & Pattern</legend><label>Desktop color <input name="wall" type="color" value="${s.wall}"></label><label>Title bar color <input name="accent" type="color" value="${s.accent}"></label><label>Desktop pattern <select name="pattern">${['none','dots','grid','weave'].map(v=>`<option${s.pattern===v?' selected':''}>${v}</option>`).join('')}</select></label></fieldset><label>Interface size <select name="size"><option value="classic"${s.size==='classic'?' selected':''}>Classic</option><option value="comfortable"${s.size==='comfortable'?' selected':''}>Comfortable · larger icons</option></select></label><label><input name="scanlines" type="checkbox"${s.scanlines?' checked':''}> Subtle CRT scanlines</label><label><input name="motion" type="checkbox"${s.motion?' checked':''}> Enable screensaver animation</label><div class="dialog-actions"><button type="button" class="classic-button" data-default-colors>Classic colors</button><button class="classic-button primary" type="submit">Apply</button></div></form>`;
  if(tab==='desktop')panel.innerHTML=`<form data-settings-form><fieldset><legend>Opening Programs</legend><label>Mouse activation <select name="click"><option value="double"${s.click==='double'?' selected':''}>Double-click</option><option value="single"${s.click==='single'?' selected':''}>Single-click</option></select></label><p class="muted">On touchscreens, a single tap always opens programs and folders.</p><label>Launch programs <select name="launch"><option value="window"${s.launch==='window'?' selected':''}>Inside desktop windows</option><option value="tab"${s.launch==='tab'?' selected':''}>In a new browser tab</option></select></label><label>Folder view <select name="view"><option value="icons"${s.view==='icons'?' selected':''}>Large icons</option><option value="list"${s.view==='list'?' selected':''}>List</option></select></label></fieldset><fieldset><legend>Desktop</legend><label><input name="remember" type="checkbox"${s.remember?' checked':''}> Remember window layout</label><label><input name="clock24" type="checkbox"${s.clock24?' checked':''}> Use a 24-hour clock</label><label>Screensaver after <select name="saver">${[0,1,3,5,10].map(n=>`<option value="${n}"${s.saver===n?' selected':''}>${n?`${n} minute${n===1?'':'s'}`:'Never'}</option>`).join('')}</select></label><p class="muted">The screensaver stays off while a program window is open.</p></fieldset><div class="dialog-actions"><button type="button" class="classic-button" data-test-saver>Test screensaver</button><button class="classic-button primary" type="submit">Apply</button></div></form>`;
  if(tab==='sound')panel.innerHTML=`<form data-settings-form><h2>Interface Sounds</h2><label><input name="sound" type="checkbox"${s.sound?' checked':''}> Play short sounds when opening and closing windows</label><label>Volume <input name="volume" type="range" min="0" max="100" value="${s.volume}"><output>${s.volume}%</output></label><p class="muted">This controls desktop interface sounds. Each game keeps its own audio settings.</p><div class="dialog-actions"><button type="button" class="classic-button" data-test-sound>Test sound</button><button class="classic-button primary" type="submit">Apply</button></div></form>`;
  if(tab==='data')panel.innerHTML=`<h2>Your Desktop, Saved Here</h2><p>Settings, Favorites, recent programs, custom shortcuts, groups and window positions are stored in this browser.</p>${storageAvailable?'':'<div class="storage-alert">Browser storage is unavailable. Export a backup to keep your changes.</div>'}<fieldset><legend>Backup & Restore</legend><p class="muted">Export your desktop as a small JSON file, then import it on another device. Game saves are stored by the individual games and are not included.</p><div class="dialog-actions"><button class="classic-button" data-export>Export backup</button><button class="classic-button" data-import>Import backup…</button></div></fieldset><fieldset><legend>Maintenance</legend><p class="muted">Reset layout only, clear recent programs, or restore desktop defaults.</p><div class="dialog-actions"><button class="classic-button" data-reset-layout>Reset layout</button><button class="classic-button" data-clear-recent>Clear recent</button></div></fieldset><div class="dialog-actions"><button class="classic-button" data-reset-all>Reset desktop…</button></div><p class="muted">Catalog: ${catalog.generated} · ${catalog.items.length} included programs<br>${state.custom.length} custom shortcuts · No account or tracking.</p>`;
  const form=$('[data-settings-form]',panel);
  if(form)form.onsubmit=e=>{e.preventDefault();const data=new FormData(form),next={...s};for(const [k,v] of data)next[k]=v;const checks=tab==='display'?['scanlines','motion']:tab==='desktop'?['remember','clock24']:['sound'];for(const k of checks)next[k]=data.has(k);if(data.has('saver'))next.saver=Number(data.get('saver'));if(data.has('volume'))next.volume=Number(data.get('volume'));state.settings=cleanSettings(next);persist();applySettings();for(const f of windows.values())if(f.kind==='group'){f.view=state.settings.view;renderGroup(f);}toast('Settings saved.');beep();};
  const on=(sel,fn)=>{const b=$(sel,panel);if(b)b.onclick=fn;};
  on('[data-default-colors]',()=>{form.elements.wall.value='#008080';form.elements.accent.value='#000080';form.elements.pattern.value='none';});
  on('[data-test-saver]',showSaver);
  on('[data-test-sound]',()=>{const oldSound=s.sound,oldVolume=s.volume;s.sound=true;s.volume=Number(form.elements.volume.value);beep();s.sound=oldSound;s.volume=oldVolume;});
  const range=$('input[type=range]',panel);if(range)range.oninput=()=>$('output',panel).textContent=`${range.value}%`;
  on('[data-export]',exportBackup);on('[data-import]',()=>$('#import-file').click());
  on('[data-clear-recent]',()=>{state.recent=[];persist();refreshPrograms();toast('Recently Used cleared.');});
  on('[data-reset-layout]',resetLayout);
  on('[data-reset-all]',()=>confirmDialog('Reset Desktop','Restore the original desktop settings? This clears custom shortcuts, custom groups, Favorites and recent programs. Game saves are unaffected. Export a backup first if you want to keep your setup.',()=>{state={settings:{...defaults},favorites:[...initialFavorites],recent:[],layout:{},custom:[],groups:[],overrides:{}};persist();location.reload();}));
}
function exportBackup() {
  const blob=new Blob([JSON.stringify({format:'mango-windows-31',version:1,exported:new Date().toISOString(),desktop:state},null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='mango-windows-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Desktop backup exported.');
}
$('#import-file').addEventListener('change',async e=>{
  const file=e.target.files?.[0];e.target.value='';if(!file)return;
  try {
    if(file.size>2000000)throw Error('This backup is too large.');
    const backup=JSON.parse(await file.text());
    if(backup.format!=='mango-windows-31'||backup.version!==1||!backup.desktop||typeof backup.desktop!=='object')throw Error('Choose a Mango Windows 3.1 backup.');
    const d=backup.desktop;
    if(!Array.isArray(d.custom)||!Array.isArray(d.groups)||!Array.isArray(d.favorites)||!Array.isArray(d.recent)||d.custom.length>500||d.groups.length>30||!d.custom.every(validCustom)||!d.groups.every(validGroup))throw Error('This backup contains invalid shortcuts or groups.');
    confirmDialog('Import Desktop','Replace this browser’s desktop settings, shortcuts, Favorites and layout with the imported backup? Game saves are unaffected.',()=>{
      const overrides={};for(const [id,o]of Object.entries(d.overrides||{})){if(o&&typeof o==='object'&&typeof o.title==='string'&&typeof o.group==='string')overrides[id]={title:o.title.slice(0,100),group:o.group};}
      state={settings:cleanSettings(d.settings),custom:d.custom.map(c=>({...c,title:c.title.slice(0,100),url:safeURL(c.url)})),groups:d.groups.map(g=>({id:g.id,title:g.title.slice(0,40)})),favorites:d.favorites.filter(x=>typeof x==='string').slice(0,1000),recent:d.recent.filter(x=>typeof x==='string').slice(0,30),layout:cleanLayout(d.layout),overrides,visited:true};persist();location.reload();
    });
  } catch(err){toast(err.message||'Could not read this backup.');beep('error');}
});
function confirmDialog(title,message,accept) {
  const w=createWindow({id:'confirm',title,icon:'monitor',width:430,height:260,panel:true});
  w.content.innerHTML=`<div class="panel-pad"><p>${esc(message)}</p><div class="dialog-actions"><button class="classic-button" data-cancel>Cancel</button><button class="classic-button primary" data-ok>Continue</button></div></div>`;
  $('[data-cancel]',w.content).onclick=()=>closeWindow(w);$('[data-ok]',w.content).onclick=()=>{closeWindow(w);accept();};$('[data-cancel]',w.content).focus();
}
function openHelp(about=false) {
  const w=createWindow({id:'help',title:about?'About Mango Windows':'Welcome to Mango Windows',icon:'monitor',width:430,height:465,panel:true});
  w.content.innerHTML=`<div class="panel-pad"><div class="welcome-heading">${icon('monitor')}<div><h1>Mango Windows</h1><small>VERSION 3.1 · STEVE’S PERSONAL EDITION</small></div></div><p>A home for ${allItems.length} games, tools and wonderfully strange experiments.</p><div class="welcome-links"><button class="classic-button" data-welcome="games">${icon('game')} Games</button><button class="classic-button" data-welcome="favorites">${icon('star')} Favorites</button><button class="classic-button" data-welcome="find">${icon('book')} Find a program</button><button class="classic-button" data-welcome="control">${icon('tools')} Control Panel</button></div><dl class="help-keys"><dt>Open</dt><dd>Double-click with a mouse. Tap once on a phone.</dd><dt>Organize</dt><dd>Right-click a program → Properties to rename, move or favorite it. On a phone, select Properties from the running app.</dd><dt>Windows</dt><dd>Drag the title bar. Use ▼ to minimize, ▲ to maximize, and × to close.</dd><dt>Keyboard</dt><dd>Ctrl+K to find · Enter to open · Escape to close · Alt+Enter for properties.</dd></dl><p class="muted">File → New adds your own shortcuts and groups. Open in tab gives games the full screen. Preferences stay in this browser; Control Panel → Data exports a backup.</p><p class="muted">An independent retro web desktop inspired by Windows 3.1. Not affiliated with Microsoft.</p><div class="dialog-actions"><button class="classic-button primary" data-done>OK</button></div></div>`;
  $$('[data-welcome]',w.content).forEach(b=>b.onclick=()=>{const id=b.dataset.welcome;if(id==='find')openSearch();else if(id==='control')openSettings();else openGroup(id);});$('[data-done]',w.content).onclick=()=>closeWindow(w);return w;
}
function arrangeWindows(mode) {
  const list=[...windows.values()].filter(w=>!w.minimized);if(!list.length)return;
  list.forEach((w,i)=>{w.maximized=false;w.el.classList.remove('maximized');w.maxButton.textContent='▲';if(mode==='tile'){const cols=Math.ceil(Math.sqrt(list.length)),rows=Math.ceil(list.length/cols);w.width=ws.clientWidth/cols;w.height=(ws.clientHeight-42)/rows;w.x=i%cols*w.width;w.y=Math.floor(i/cols)*w.height;}else{w.width=Math.min(660,ws.clientWidth-40);w.height=Math.min(460,ws.clientHeight-90);w.x=mobile()?0:Math.min(175+i*27,ws.clientWidth-w.width);w.y=i*27;}clampWindow(w);focusWindow(w);rememberWindow(w);});
}
function resetLayout() {
  state.layout={};persist();
  for(const w of [...windows.values()])closeWindow(w);
  state.layout={};initialWindows();persist();toast('Window layout reset.');
}
function updateClock() {const now=new Date();$('#clock').textContent=now.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit',hour12:!state.settings.clock24});$('#clock').title=now.toLocaleDateString([],{weekday:'long',year:'numeric',month:'long',day:'numeric'});}
function showSaver() {closeMenu();$('#screensaver').hidden=false;saverShowing=true;$('#screensaver').focus();}
function hideSaver() {if(saverShowing){$('#screensaver').hidden=true;saverShowing=false;lastActivity=Date.now();}}
for(const event of ['pointerdown','keydown','wheel'])document.addEventListener(event,()=>{lastActivity=Date.now();if(saverShowing)hideSaver();},{passive:true});
$('#screensaver').addEventListener('pointermove',hideSaver);
setInterval(()=>{if(state.settings.saver>0&&!saverShowing&&![...windows.values()].some(w=>w.kind==='app')&&Date.now()-lastActivity>state.settings.saver*60000)showSaver();},10000);
setInterval(updateClock,1000);
$('#sound-toggle').onclick=()=>{state.settings.sound=!state.settings.sound;persist();applySettings();beep();};
$('#clock').onclick=()=>{const i=allItems.find(i=>i.id==='cal.html');if(i)launch(i);};
$('#find-button').onclick=()=>openSearch();
$('#manager-system').onclick=e=>{const r=e.currentTarget.getBoundingClientRect();popup([['About Mango Windows…',()=>openHelp(true)],['Control Panel…',()=>openSettings()],['Find a program…',()=>openSearch(),'Ctrl+K']],r.left,r.bottom);};
$('#fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();else toast('Use Share → Add to Home Screen for an app-sized desktop on iPhone.');}catch{toast('Full screen is unavailable in this browser. Try adding the desktop to your Home Screen.');}};
const menus={
  file:()=>[['New Shortcut…',openNewShortcut],['New Program Group…',openNewGroup],null,['Find / Run…',()=>openSearch(),'Ctrl+K'],['All Programs',()=>openGroup('all')],null,['Properties…',()=>selected?openProperties(selected.item):toast('Select a program in a folder first.'),'Alt+Enter'],null,['Exit Windows…',()=>confirmDialog('Exit Windows','Close all desktop windows? Your shortcuts and preferences will stay saved.',()=>{for(const w of [...windows.values()])closeWindow(w);toast('Windows closed. Open a program group to continue.');})]],
  options:()=>[['Control Panel…',()=>openSettings()],['Display…',()=>openSettings('display')],['Opening Programs…',()=>openSettings('desktop')],['Sound…',()=>openSettings('sound')],null,[`${state.settings.remember?'✓ ':''}Remember Window Layout`,()=>{state.settings.remember=!state.settings.remember;persist();toast(`Remember layout ${state.settings.remember?'enabled':'disabled'}.`);}],['Backup & Restore…',()=>openSettings('data')]],
  window:()=>[['Cascade',()=>arrangeWindows('cascade')],['Tile',()=>arrangeWindows('tile')],['Reset Layout',resetLayout],['Close All',()=>{for(const w of [...windows.values()])closeWindow(w);}],null,...[...windows.values()].map(w=>[`${w.minimized?'◇ ':''}${w.title}`,()=>focusWindow(w)])],
  help:()=>[['Getting Started',()=>openHelp()],['Keyboard Shortcuts',()=>openHelp()],null,['About Mango Windows…',()=>openHelp(true)]]
};
$$('[data-menu]').forEach(b=>b.onclick=e=>{e.stopPropagation();if(b.classList.contains('open')){closeMenu();return;}const r=b.getBoundingClientRect();popup(menus[b.dataset.menu](),r.left,r.bottom);b.classList.add('open');});
ws.addEventListener('contextmenu',e=>{if(e.target===ws||e.target.closest('.desktop-watermark')){e.preventDefault();popup([['New Shortcut…',openNewShortcut],['New Program Group…',openNewGroup],['Find a Program…',()=>openSearch()],null,['Display Properties…',()=>openSettings('display')]],e.clientX,e.clientY);}});
document.addEventListener('keydown',e=>{
  const typing=/INPUT|TEXTAREA|SELECT/.test(e.target.tagName);
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openSearch();return;}
  if(e.altKey&&e.key==='Enter'&&selected){e.preventDefault();openProperties(selected.item);return;}
  if(e.key==='Escape'){if(!$('#menu-popup').hidden){closeMenu();return;}if(typing)return;const top=[...windows.values()].filter(w=>!w.minimized).sort((a,b)=>+b.el.style.zIndex-+a.el.style.zIndex)[0];if(top)closeWindow(top);}
  if(!typing&&['ArrowRight','ArrowLeft','ArrowDown','ArrowUp'].includes(e.key)&&e.target.classList.contains('program')){
    const list=$$('.program',e.target.parentElement),index=list.indexOf(e.target),columns=e.target.parentElement.classList.contains('list-view')?1:Math.max(1,Math.floor(e.target.parentElement.clientWidth/e.target.clientWidth));
    const delta=({ArrowRight:1,ArrowLeft:-1,ArrowDown:columns,ArrowUp:-columns})[e.key];list[Math.max(0,Math.min(list.length-1,index+delta))]?.focus();e.preventDefault();
  }
});
window.addEventListener('resize',()=>{closeMenu();for(const w of windows.values()){if(mobile()){w.x=0;w.y=0;w.width=ws.clientWidth;w.height=ws.clientHeight-44;}clampWindow(w);}});
window.addEventListener('pagehide',persist);
function initialWindows() {
  if(mobile())return;
  const w=openGroup('games');w.x=185;w.y=42;w.width=Math.min(660,ws.clientWidth-220);w.height=Math.min(500,ws.clientHeight-95);clampWindow(w);rememberWindow(w);
  if(ws.clientWidth>1050){const f=openGroup('favorites');f.x=Math.min(865,ws.clientWidth-350);f.y=106;f.width=320;f.height=Math.min(365,ws.clientHeight-160);clampWindow(f);rememberWindow(f);focusWindow(w);}
}
async function init() {
  applySettings();$('#brand-mark').innerHTML=icon('monitor');
  try {
    const response=await fetch('./catalog.json');if(!response.ok)throw Error(`Catalog request failed (${response.status})`);catalog=await response.json();
    if(!Array.isArray(catalog.items)||!Array.isArray(catalog.groups))throw Error('Invalid program catalog');
    rebuildCatalog();renderDesktop();
    const saved=state.settings.remember?Object.entries(state.layout).filter(([id,l])=>id.startsWith('group:')&&l.open):[];
    if(saved.length){for(const [id,l]of saved.slice(0,12)){const gid=id.slice(6);if(groups.some(g=>g.id===gid)||['all','recent','favorites'].includes(gid)){const w=openGroup(gid);if(l.minimized)minimizeWindow(w);}}}
    else initialWindows();
    $('#desktop-status').textContent=`${allItems.length} programs · ${groups.length} groups · ${mobile()?'Tap':'Double-click'} to open`;
    if(!state.visited){state.visited=true;persist();if(!mobile()&&ws.clientWidth>1250){const w=openHelp();w.x=ws.clientWidth-455;w.y=Math.min(335,ws.clientHeight-430);w.width=420;w.height=Math.min(430,ws.clientHeight-60);clampWindow(w);}}
  } catch(err){$('#desktop-status').textContent='Unable to load program catalog';const w=createWindow({id:'load-error',title:'Program Manager',width:420,height:240,panel:true});w.content.innerHTML=`<div class="error-screen"><strong>The program catalog could not load.</strong><p>Check your connection and reload the desktop.</p><p class="muted">${esc(err.message)}</p><button class="classic-button" onclick="location.reload()">Retry</button></div>`;}
}
init();
