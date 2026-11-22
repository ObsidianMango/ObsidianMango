const styles = {
  juicy:  { name:'Juicy',       pulp:1.30, chips:.70, seeds:.86, dust:.63, spread:1.18, bounce:.19, drag:1.04 },
  crisp:  { name:'Crisp',       pulp:.78,  chips:1.19,seeds:.70, dust:.77, spread:1.05, bounce:.34, drag:.75 },
  leafy:  { name:'Leafy',       pulp:.27,  chips:1.46,seeds:0,   dust:.62, spread:1.10, bounce:.12, drag:1.46 },
  starchy:{ name:'Starchy',     pulp:.41,  chips:1.25,seeds:0,   dust:1.14,spread:.89,  bounce:.25, drag:.83 },
  soft:   { name:'Soft',        pulp:1.12, chips:.51, seeds:.72, dust:.72, spread:.90,  bounce:.13, drag:1.15 },
  hard:   { name:'Hard shell',  pulp:.53,  chips:1.30,seeds:.40, dust:1.12,spread:1.23, bounce:.46, drag:.64 },
  squash: { name:'Thick rind',  pulp:1,    chips:1,   seeds:1,   dust:1,   spread:1,    bounce:.26, drag:.39 }
};

const shapes = {
  pumpkin: { accent:'stem', pattern:'pumpkin' },
  melon:   { pattern:'bands' },
  netted:  { pattern:'net' },
  round:   {},
  apple:   { accent:'stem', pattern:'blush' },
  pear:    { accent:'stem', pattern:'blush' },
  peach:   { pattern:'seam' },
  plum:    { pattern:'seam' },
  citrus:  { pattern:'freckle' },
  oval:    { pattern:'freckle' },
  coconut: { pattern:'fiber' },
  berry:   { pattern:'cluster' },
  grape:   { accent:'stem', pattern:'cluster' },
  cherry:  { accent:'stem', pattern:'blush' },
  strawberry:{ accent:'leaf', pattern:'pips' },
  banana:  { accent:'tip', pattern:'ridges' },
  pineapple:{ accent:'crown', pattern:'diamond' },
  spiny:   { accent:'stem', pattern:'spines' },
  star:    { pattern:'ridges' },
  root:    { accent:'sprigs', pattern:'rings' },
  tuber:   { pattern:'eyes' },
  onion:   { accent:'tip', pattern:'fiber' },
  garlic:  { accent:'tip', pattern:'ridges' },
  pepper:  { accent:'stem', pattern:'ridges' },
  chili:   { accent:'stem', pattern:'blush' },
  eggplant:{ accent:'leaf', pattern:'blush' },
  gourd:   { accent:'stem', pattern:'ridges' },
  cuke:    { pattern:'freckle' },
  leafy:   { pattern:'veins' },
  greens:  { accent:'sprigs', pattern:'veins' },
  broccoli:{ accent:'stalk', pattern:'cluster' },
  corn:    { accent:'husk', pattern:'kernels' },
  stalk:   { accent:'tip', pattern:'ridges' },
  pod:     { accent:'tip', pattern:'pods' },
  scaly:   { accent:'tip', pattern:'diamond' }
};

// Width, height, and depth are relative to the launcher basket. Small produce
// is scaled up enough to remain visible in flight and at the far target.
const fruits = [
  ['Apple','apple','bc2632','fff0c7','f6cf69','crisp',[.93,.97,.92],'🍎'],
  ['Green apple','apple','87ae39','f7ebc1','d2df78','crisp',[.94,.95,.93],'🍏'],
  ['Apricot','peach','f3a34c','efb73e','f57f37','soft',[.70,.71,.69]],
  ['Asian pear','apple','ba985a','fff6de','d2b777','crisp',[.94,.98,.92]],
  ['Avocado','pear','3b5031','d8df79','6d8f3f','soft',[.84,1.2,.81],'🥑'],
  ['Banana','banana','f0cb41','eee1a6','d7aa25','soft',[.61,1.62,.58],'🍌'],
  ['Blackberry','berry','382141','702b62','a84d6b','juicy',[.69,.82,.74]],
  ['Blood orange','citrus','cf6139','b12f35','e55e54','juicy',[.88,.99,.89]],
  ['Blueberry','round','43558c','a7bda0','8294bf','juicy',[.66,.69,.67],'🫐'],
  ['Boysenberry','berry','4c2451','922853','c3627c','juicy',[.76,.84,.75]],
  ['Breadfruit','spiny','91a449','f3e7b8','d7d795','starchy',[1.02,1.12,.97]],
  ['Cantaloupe','netted','b79967','f8a251','6d8645','juicy',[.99,1.14,1],'🍈'],
  ['Cherimoya','scaly','78945a','eee8c8','bac77d','soft',[.95,1.20,.93]],
  ['Cherry','cherry','a31634','c83253','d9626b','juicy',[.69,.73,.69],'🍒'],
  ['Clementine','citrus','e87622','ffc36b','ffac42','juicy',[.76,.80,.77],'🍊'],
  ['Coconut','coconut','72513a','fff1d6','d6ad86','hard',[.91,1.12,.88],'🥥'],
  ['Cranberry','oval','9c253c','e48a9a','d45067','crisp',[.62,.72,.63]],
  ['Date','oval','704336','c28e59','945732','soft',[.63,.98,.66]],
  ['Dragon fruit','spiny','e34277','fff4ee','6eab42','soft',[.96,1.16,.90]],
  ['Durian','spiny','9b9b4c','ffdaa0','8a713e','hard',[1.06,1.30,.98]],
  ['Fig','pear','6e3b67','df7e89','dcaba0','soft',[.79,.91,.81]],
  ['Gooseberry','melon','9eb548','efdf8e','718c36','juicy',[.69,.79,.71]],
  ['Golden kiwi','oval','a68c50','e6c74d','9b7948','soft',[.77,.96,.74]],
  ['Grapefruit','citrus','e69943','f09489','f7bc99','juicy',[1.03,1.03,1.01]],
  ['Green grapes','grape','8da946','dfe7a0','a6bd53','juicy',[.79,1.19,.78],'🍇'],
  ['Guava','pear','9bb655','ed8f9e','e5cab0','soft',[.83,1.04,.84]],
  ['Honeydew','oval','c6d197','c4d89a','a9bd76','juicy',[.99,1.18,.99],'🍈'],
  ['Jackfruit','spiny','958743','e9b54f','a3a25b','starchy',[1.02,1.51,.91]],
  ['Kiwifruit','coconut','947040','9eae48','dee8a2','soft',[.79,.99,.76],'🥝'],
  ['Kumquat','citrus','f48d32','fbd680','e3a952','juicy',[.62,.85,.62]],
  ['Lemon','citrus','f0c732','f1df95','ffeb8d','juicy',[.83,1.03,.81],'🍋'],
  ['Lime','citrus','618d35','bddc7e','92a646','juicy',[.76,.89,.75],'🍋‍🟩'],
  ['Longan','round','ac7f50','f4e4cb','c0a37d','soft',[.64,.75,.64]],
  ['Loquat','oval','f3a64b','ffc777','e27e37','soft',[.65,.89,.67]],
  ['Lychee','spiny','bc4e58','fff0e1','d17879','soft',[.71,.83,.72]],
  ['Mandarin','citrus','ea7e21','ffc369','f5a745','juicy',[.88,.86,.90],'🍊'],
  ['Mango','peach','df943d','ffd16b','d95340','soft',[.92,1.23,.81],'🥭'],
  ['Mangosteen','round','633c59','f9f0df','864967','hard',[.82,.90,.83]],
  ['Mulberry','berry','54274b','ac426b','773458','juicy',[.68,.98,.65]],
  ['Nectarine','peach','c7423b','ffbc6d','f49b4d','juicy',[.83,.92,.84]],
  ['Orange','citrus','ef891f','ffbc64','ff9b35','juicy',[.91,1.01,.91],'🍊'],
  ['Papaya','pear','d5a340','f88b4f','9bab4b','soft',[.93,1.36,.91],''],
  ['Passion fruit','oval','823e74','f4bb4d','ab638c','juicy',[.79,.96,.78]],
  ['Peach','peach','ea8c62','ffd18c','cf4f49','soft',[.92,.94,.89],'🍑'],
  ['Pear','pear','acba57','e8edbb','e3b257','crisp',[.90,1.26,.87],'🍐'],
  ['Persimmon','apple','e77a34','f3a052','a88e44','soft',[.90,.90,.91]],
  ['Pineapple','pineapple','bd923e','f4d55d','817c40','crisp',[.85,1.02,.84],'🍍'],
  ['Plantain','banana','a1aa53','e8dcab','687d44','starchy',[.71,1.76,.64],'🍌'],
  ['Plum','plum','614265','dea174','9c6380','juicy',[.83,.96,.81],''],
  ['Pomegranate','apple','a83843','c53754','d15c57','juicy',[.95,1.06,.95]],
  ['Pomelo','pear','c5bc58','f7c4a5','d2a356','juicy',[1.05,1.16,1.02]],
  ['Prickly pear','oval','ba526d','e55c82','849b55','juicy',[.78,1.13,.73]],
  ['Quince','pear','dec442','f8e6b2','eed477','starchy',[.94,1.13,.91]],
  ['Rambutan','spiny','b94448','efe3cd','cb7854','soft',[.78,.93,.75]],
  ['Raspberry','berry','bd3859','e35276','ed8797','soft',[.72,.83,.73]],
  ['Red grapes','grape','703e69','c3c78e','9d7199','juicy',[.80,1.20,.76],'🍇'],
  ['Sapodilla','coconut','a67a4b','d0a274','ba8c60','soft',[.77,1.02,.74]],
  ['Soursop','spiny','718a48','f6eccb','a9b979','soft',[.90,1.37,.86]],
  ['Star fruit','star','e1b740','f3d968','93a441','juicy',[.82,1.35,.79]],
  ['Strawberry','strawberry','d83b47','fb838b','a82739','juicy',[.83,.99,.82],'🍓'],
  ['Tamarind','pod','895c43','b78750','745038','hard',[.66,1.42,.64]],
  ['Watermelon','melon','6e973d','ec5364','2a5331','juicy',[1.04,1.18,1.04],'🍉'],
  ['White peach','peach','efa48d','f9e5cb','bf4a4e','soft',[.88,.94,.89],'🍑']
];

const vegetables = [
  ['Acorn squash','pumpkin','516337','eea649','d89448','squash',[.89,1.11,.88]],
  ['Artichoke','scaly','64794d','c6c27b','91825c','leafy',[.91,1.12,.88]],
  ['Arugula','greens','578448','b0cc80','445f36','leafy',[.71,1.35,.69]],
  ['Asparagus','stalk','627e42','bbe18e','80678b','leafy',[.64,1.57,.62]],
  ['Beet','root','72354b','aa284f','874352','crisp',[1.02,.92,.99]],
  ['Bitter melon','spiny','76994b','bfc991','65873d','crisp',[.69,1.44,.68]],
  ['Bok choy','greens','6d944f','e3ebad','d2dfae','leafy',[.86,1.23,.79]],
  ['Bottle gourd','gourd','a7bd74','dbe3af','82a957','squash',[.89,1.45,.85]],
  ['Broccoli','broccoli','568148','a1c97c','39704a','leafy',[1.04,1.20,1.01],'🥦'],
  ['Brussels sprouts','leafy','7e9f56','cad894','547543','leafy',[.74,.91,.74]],
  ['Butternut squash','gourd','c99255','f4a64a','bf824b','squash',[.97,1.48,.90]],
  ['Carrot','root','ea7431','f9a654','b9532c','crisp',[.74,1.48,.66],'🥕'],
  ['Cassava','tuber','886243','f6eace','9c7552','starchy',[.69,1.39,.72]],
  ['Cauliflower','broccoli','e4d9b8','f5ebd6','839c54','crisp',[1.04,1.13,1.02]],
  ['Celery','stalk','8daf62','c6dca3','779450','crisp',[.77,1.4,.67]],
  ['Celeriac','tuber','a6916b','efe4c8','84724e','starchy',[.99,1.02,.98]],
  ['Chard','greens','4c844e','dbdb9c','bb4f61','leafy',[.87,1.26,.68]],
  ['Chayote','pear','a4b971','e5edc2','839742','crisp',[.88,1.16,.86]],
  ['Collard greens','greens','50784c','aabb75','365c40','leafy',[.81,1.25,.76]],
  ['Corn','corn','eebf46','fbdf8b','648346','crisp',[.74,1.40,.71],'🌽'],
  ['Cucumber','cuke','4d793a','d4e4a1','345d35','juicy',[.73,1.49,.70],'🥒'],
  ['Daikon','root','ebead6','fffce8','b2bc88','crisp',[.72,1.43,.69]],
  ['Delicata squash','melon','e7c379','eaae50','538050','squash',[.86,1.33,.81]],
  ['Eggplant','eggplant','593754','e5d6a2','814d77','soft',[.89,1.27,.84],'🍆'],
  ['Endive','greens','ddd58c','ebe8aa','9db464','leafy',[.80,1.27,.77]],
  ['Fennel','onion','e2dfb4','f4ead2','7ca061','crisp',[.92,1.25,.85]],
  ['Garlic','garlic','e3d2bb','f7e6d0','b88b9c','crisp',[.80,.89,.80],'🧄'],
  ['Green beans','pod','5d8a43','b1c784','476b38','crisp',[.75,1.48,.60]],
  ['Green bell pepper','pepper','51853f','a8c569','397343','crisp',[.94,1.15,.89],'🫑'],
  ['Green cabbage','leafy','8fae72','d1dc9e','668755','leafy',[1.00,1.13,.98]],
  ['Green peas','pod','6b973e','c5db7e','567f41','crisp',[.77,1.37,.67],'🫛'],
  ['Habanero','pepper','e37c38','f6bd7d','c54c31','crisp',[.78,.96,.76]],
  ['Iceberg lettuce','leafy','a8c68e','d4e4ae','7da16c','leafy',[.97,1.09,.96],'🥬'],
  ['Jalapeño','chili','638c4e','c7dc8b','386841','crisp',[.76,1.24,.68]],
  ['Jicama','tuber','b49167','f0e9ce','ae8455','crisp',[.99,1.03,.93]],
  ['Kabocha squash','pumpkin','506a39','f2a04e','638442','squash',[1.02,.94,1.01]],
  ['Kale','greens','4e7655','a1b77a','385842','leafy',[.88,1.19,.80]],
  ['Kohlrabi','apple','97ac67','e4e9bf','65845d','crisp',[.87,1.04,.85]],
  ['Leek','stalk','d5dcb1','eeedc5','678850','leafy',[.74,1.49,.66]],
  ['Napa cabbage','leafy','9fb473','e5e5ac','87a760','leafy',[.95,1.38,.86],'🥬'],
  ['Okra','star','76964e','dae3ac','678240','crisp',[.66,1.42,.63]],
  ['Parsnip','root','e8d0a6','fff0c5','ae9361','crisp',[.73,1.44,.70]],
  ['Poblano','pepper','426a41','a3b67b','305340','crisp',[.93,1.22,.81]],
  ['Potato','tuber','a67d52','f4dfa9','7b6148','starchy',[.98,1.12,.90],'🥔'],
  ['Pumpkin','pumpkin','df7d33','fba855','ab5728','squash',[1,1,1],'🎃'],
  ['Radicchio','leafy','9e4968','e6c0c5','c385a5','leafy',[.94,1.11,.92]],
  ['Radish','root','c94367','f4e5e3','dd9aa5','crisp',[.81,.82,.79]],
  ['Red bell pepper','pepper','c63731','ef916b','eb563e','crisp',[.96,1.17,.92],'🫑'],
  ['Red cabbage','leafy','79547c','bea2b9','533c60','leafy',[.98,1.12,.95]],
  ['Red chili','chili','c8382d','ed8d65','ef5b35','crisp',[.73,1.41,.65],'🌶️'],
  ['Red onion','onion','984c79','e7c6d5','633f68','crisp',[.91,1,.93],'🧅'],
  ['Romaine lettuce','greens','739f58','c8dd8e','97ba75','leafy',[.90,1.35,.83],'🥬'],
  ['Rutabaga','tuber','9e7d7b','e9c18c','d2bb91','starchy',[.99,1.05,.96]],
  ['Scallion','stalk','93b879','f2edd2','658953','leafy',[.61,1.55,.58]],
  ['Shallot','onion','b37380','f1d3ca','c58d77','crisp',[.76,1.07,.76],'🧅'],
  ['Snap peas','pod','8caa58','dce9a4','6b934d','crisp',[.75,1.36,.63],'🫛'],
  ['Spaghetti squash','oval','e7bb63','f2d594','c9a257','squash',[.91,1.27,.89]],
  ['Spinach','greens','548353','98bc73','406c43','leafy',[.84,1.17,.76]],
  ['Sweet potato','tuber','9b6248','f9964f','b6795c','starchy',[.89,1.34,.86],'🍠'],
  ['Taro','tuber','796753','e9d8e6','a68c81','starchy',[.89,1.17,.88]],
  ['Tomatillo','round','90ab5c','b8cd84','798e46','juicy',[.79,.88,.80]],
  ['Tomato','apple','d74638','f07b60','f19e51','juicy',[.98,.88,.97],'🍅'],
  ['Turnip','root','ba99a8','f1e5d0','e7dcd1','crisp',[.92,.99,.91]],
  ['White onion','onion','e9dfc8','fff2d4','c9bdac','crisp',[.94,.99,.92],'🧅'],
  ['Yam','tuber','725546','e2d5a7','987454','starchy',[.91,1.39,.82]],
  ['Yellow bell pepper','pepper','e4b43e','f8d76f','bc852a','crisp',[.95,1.14,.91],'🫑'],
  ['Yellow onion','onion','b28348','f9e9ba','d8a86e','crisp',[.97,.97,.94],'🧅'],
  ['Zucchini','cuke','486c41','d3d9a8','628759','crisp',[.75,1.43,.71],'🥒']
];

function entries(list,category){
  return list.map(([name,shape,skin,flesh,accent,style,scale,icon])=>({
    id:name.toLowerCase().replaceAll(' ','-'),name,category,shape,body:shapes[shape],
    skin:'#'+skin,flesh:'#'+flesh,accent:'#'+accent,style:styles[style],scale,icon
  }));
}
export const catalog=[...entries(fruits,'fruit'),...entries(vegetables,'vegetable')];
export const defaultProduce=catalog.find(entry=>entry.id==='pumpkin');
export const findProduce=id=>catalog.find(entry=>entry.id===id);
const aliases={
  cantaloupe:'melon muskmelon rockmelon', honeydew:'melon', kiwifruit:'kiwi',
  'asian-pear':'nashi', 'dragon-fruit':'dragonfruit pitaya', 'star-fruit':'starfruit carambola',
  'red-bell-pepper':'capsicum', 'green-bell-pepper':'capsicum', 'yellow-bell-pepper':'capsicum',
  zucchini:'courgette', eggplant:'aubergine', 'bok-choy':'pak choi',
  'green-beans':'string beans', corn:'maize sweetcorn', scallion:'spring onion green onion',
  'snap-peas':'sugar snap peas', radicchio:'chicory', arugula:'rocket', celeriac:'celery root',
  'passion-fruit':'passionfruit', 'prickly-pear':'cactus pear nopale fruit'
};

export function bindProducePicker(ui,selected,onChoose){
  let category='all';
  let matches=[];
  const sorted=[...catalog].sort((a,b)=>a.name.localeCompare(b.name));
  function showIcon(node,entry){
    node.textContent=entry.icon||'';
    node.classList.toggle('emoji',Boolean(entry.icon));
    node.style.setProperty('--skin',entry.skin);
    node.style.setProperty('--accent',entry.accent);
  }
  function display(entry){
    selected=entry;
    showIcon(ui['produce-current-icon'],entry);
    ui['produce-current-name'].textContent=entry.name;
    ui['produce-open'].setAttribute('aria-label',`Choose produce. ${entry.name} selected.`);
  }
  function fill(){
    const query=ui['produce-search'].value.trim().toLowerCase();
    const words=query.split(/\s+/);
    matches=sorted.filter(entry=>(category==='all'||entry.category===category) &&
      words.every(word=>`${entry.name.toLowerCase()} ${aliases[entry.id]||''}`.includes(word)));
    const content=document.createDocumentFragment();
    for(const entry of matches){
      const card=document.createElement('button');
      card.type='button';card.className='produce-card';card.dataset.produce=entry.id;
      card.setAttribute('aria-pressed',String(entry.id===selected.id));
      const swatch=document.createElement('span');
      swatch.className='produce-icon';swatch.setAttribute('aria-hidden','true');
      showIcon(swatch,entry);
      const label=document.createElement('span'), name=document.createElement('strong'), style=document.createElement('small');
      name.textContent=entry.name;style.textContent=entry.style.name;
      label.append(name,style);card.append(swatch,label);content.append(card);
    }
    ui['produce-options'].replaceChildren(content);
    ui['produce-random'].disabled=matches.length===0;
    ui['produce-results'].textContent=matches.length?`${matches.length} ${matches.length===1?'choice':'choices'}`:'No matching produce';
  }
  function choose(entry){
    if(!entry)return;
    onChoose(entry);
    display(entry);
    ui['produce-picker'].close();
    ui['produce-open'].focus();
  }
  ui['produce-open'].addEventListener('click',()=>{
    category='all';
    ui['produce-search'].value='';
    for(const button of ui['produce-categories'].children)button.setAttribute('aria-pressed',String(button.dataset.category===category));
    fill();
    ui['produce-picker'].showModal();
    ui['produce-picker'].querySelector('.produce-heading button').focus();
  });
  ui['produce-search'].addEventListener('input',fill);
  ui['produce-categories'].addEventListener('click',event=>{
    const button=event.target.closest('button[data-category]');
    if(!button)return;
    category=button.dataset.category;
    for(const item of ui['produce-categories'].children)item.setAttribute('aria-pressed',String(item===button));
    fill();
  });
  ui['produce-options'].addEventListener('click',event=>choose(findProduce(event.target.closest('button[data-produce]')?.dataset.produce)));
  ui['produce-random'].addEventListener('click',()=>{
    const choices=matches.length>1?matches.filter(entry=>entry.id!==selected.id):matches;
    choose(choices[Math.floor(Math.random()*choices.length)]);
  });
  display(selected);
}
