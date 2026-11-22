import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.min.js';

export { THREE };
export const clamp = THREE.MathUtils.clamp;
export const lerp = THREE.MathUtils.lerp;
export const v3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
export const TAU = Math.PI * 2;
export function random(seed) {
  return () => {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function surface(color, props = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: .82, ...props });
}
export function mesh(parent, geo, material, x = 0, y = 0, z = 0, shadow = true) {
  const result = new THREE.Mesh(geo, material);
  result.position.set(x, y, z);
  result.castShadow = shadow;
  result.receiveShadow = true;
  parent.add(result);
  return result;
}
export const box = (p, m, w, h, d, x, y, z, s) => mesh(p, new THREE.BoxGeometry(w, h, d), m, x, y, z, s);
export function beam(p, m, start, end, width, depth = width) {
  const direction = end.clone().sub(start);
  const center = start.clone().addScaledVector(direction, .5);
  const result = box(p, m, width, direction.length(), depth, ...center);
  result.quaternion.setFromUnitVectors(v3(0, 1), direction.normalize());
  return result;
}

function makeMaterialMaps(kind) {
  const size = 384;
  const canvas = document.createElement('canvas');
  const height = document.createElement('canvas');
  canvas.width = canvas.height = height.width = height.height = size;
  const ctx = canvas.getContext('2d');
  const bump = height.getContext('2d');
  const base = ctx.createImageData(size, size);
  const relief = bump.createImageData(size, size);
  const rng = random(7411);
  const grids = [4, 13, 37, 113].map(count => ({ count, values: Array.from({ length: count * count }, rng) }));
  function noise(grid, u, v) {
    const { count, values } = grid;
    const x = u * count, y = v * count;
    const ix = Math.floor(x), iy = Math.floor(y);
    const fx = x - ix, fy = y - iy;
    const a = fx * fx * (3 - 2 * fx), b = fy * fy * (3 - 2 * fy);
    const at = (xx, yy) => values[(yy % count) * count + (xx % count)];
    return lerp(lerp(at(ix,iy),at(ix+1,iy),a),lerp(at(ix,iy+1),at(ix+1,iy+1),a),b);
  }
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size, v = y / size, index = (y * size + x) * 4;
      const large = noise(grids[0], u, v), middle = noise(grids[1], u, v);
      const tiny = noise(grids[2], u, v), fine = noise(grids[3], u, v);
      let rgb, depth;
      if (kind === 'soil') {
        const green = clamp((large * .65 + middle * .35 - .29) * 1.6, 0, 1);
        const shade = (tiny - .5) * 28 + (fine - .5) * 24 + (rng() - .5) * 22;
        rgb = [78 - 15 * green + shade, 56 + 4 * green + shade, 38 - 8 * green + shade];
        depth = 80 + tiny * 41 + fine * 48 + rng() * 35;
      } else if (kind === 'wood') {
        const grain = Math.sin((u * 29 + .65 * large + .35 * middle + .13 * tiny) * TAU);
        const streaks = Math.pow(.5 + .5 * grain, 6);
        const shade = 49 * large + 35 * middle + 18 * fine - 32 * streaks;
        rgb = [102 + shade, 69 + shade, 43 + shade * .92];
        depth = 135 + 34 * fine - 32 * streaks;
      } else {
        const freckles = Math.pow(tiny * fine, 2) * 60;
        const shade = (large - .5) * 24 + (middle - .5) * 16 + freckles + rng() * 12;
        rgb = [215 + shade, 121 + shade * .72, 56 + shade * .48];
        depth = 115 + fine * 23 + rng() * 67;
      }
      base.data.set([...rgb,255],index);
      relief.data.set([depth,depth,depth,255],index);
    }
  }
  ctx.putImageData(base, 0, 0);
  bump.putImageData(relief, 0, 0);
  const albedo = new THREE.CanvasTexture(canvas);
  albedo.colorSpace = THREE.SRGBColorSpace;
  const bumpMap = new THREE.CanvasTexture(height);
  for (const tex of [albedo,bumpMap]) {
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.anisotropy = 4;
  }
  return { map: albedo, bumpMap };
}

export function groundHeight(x, z) {
  const edge = clamp((Math.abs(x) - 3.5) / 8, 0, 1);
  return .09 * Math.sin(z * .31) + .07 * Math.cos(x * 1.3 + z * .18) + edge * (.56 * Math.cos(z * .068) + .32 * Math.sin(x * .11 + z * .14));
}

function sky(scene) {
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { sun: { value: v3(-.60,.36,-.71).normalize() } },
    vertexShader: `
      varying vec3 direction;
      void main() {
        direction = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.);
      }`,
    fragmentShader: `
      varying vec3 direction;
      uniform vec3 sun;
      float hash(vec2 p) { return fract(sin(dot(p,vec2(113.1,31.7)))*43758.5453); }
      float noise(vec2 p) {
        vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f);
        return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);
      }
      float cloud(vec2 p) {
        return .53*noise(p)+.25*noise(p*2.07+3.)+.13*noise(p*4.21+7.)+.06*noise(p*8.7)+.03*noise(p*17.7);
      }
      void main() {
        vec3 d=normalize(direction);
        float h=max(0.,d.y), glow=max(0.,dot(d,sun));
        vec3 col=mix(vec3(.65,.41,.245),vec3(.16,.29,.43),smoothstep(-.05,.57,h));
        col+=vec3(.54,.22,.047)*pow(glow,7.)*exp(-h*1.7);
        col+=vec3(1.7,.89,.41)*pow(glow,60.);
        col+=vec3(9.0,4.0,1.4)*smoothstep(.99961,.99989,glow);
        vec2 p=d.xz/max(.08,d.y+.14)*vec2(3.7,4.9);
        float turbulence=cloud(p+vec2(2.4,6.8));
        float clouds=smoothstep(.47,.72,turbulence)*smoothstep(.01,.19,h);
        vec3 cloudCol=mix(vec3(.33,.31,.31),vec3(.92,.51,.29),pow(glow,4.));
        cloudCol+=vec3(.28,.19,.13)*smoothstep(.51,.63,turbulence);
        col=mix(col,cloudCol,clouds*.82);
        gl_FragColor=vec4(col,1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`
  });
  mesh(scene, new THREE.SphereGeometry(225, 36, 22), skyMat, 0, 0, -28, false).renderOrder = -10;
}

function makeTerrain(scene, rng, materials) {
  const ground = new THREE.PlaneGeometry(250, 225, 100, 88);
  ground.rotateX(-Math.PI / 2);
  ground.translate(0, 0, -48);
  const points = ground.attributes.position;
  const texCoords = ground.attributes.uv;
  const colors = [];
  const lane = new THREE.Color('#f6c19e'), grass = new THREE.Color('#9ca56b'), color = new THREE.Color();
  for (let i = 0; i < points.count; i++) {
    const x = points.getX(i), z = points.getZ(i);
    points.setY(i, groundHeight(x,z));
    texCoords.setXY(i, x / 13, z / 13);
    const verge = Math.abs(x - .65 * Math.sin(z * .14)) + .32 * Math.sin(z * 1.8);
    color.copy(lane).lerp(grass, clamp((verge - 2.7) / 2.2, .08, 1));
    color.multiplyScalar(.8 + rng() * .27);
    colors.push(color.r,color.g,color.b);
  }
  ground.setAttribute('color', new THREE.Float32BufferAttribute(colors,3));
  ground.computeVertexNormals();
  mesh(scene,ground,surface(0xffffff,{ ...materials.soil, vertexColors:true, bumpScale:.11 }),0,0,0,false);

  // Close grass tufts and fallen leaves retain their silhouettes at ground level.
  const bladeGeom = new THREE.BufferGeometry();
  bladeGeom.setAttribute('position', new THREE.Float32BufferAttribute([
    -.09,0,0, .09,0,0, .035,.42,.03, -.09,0,0, .035,.42,.03, -.035,.37,.05, -.035,.37,.05, .035,.42,.03, .12,.71,.11,
    0,0,-.09, 0,.43,-.07, 0,0,.07, 0,0,.07, 0,.43,-.07, .02,.37,.045, 0,.43,-.07, -.03,.65,-.11, .02,.37,.045
  ],3));
  bladeGeom.computeVertexNormals();
  const tuft = new THREE.InstancedMesh(bladeGeom,surface(0xffffff,{ side:THREE.DoubleSide }),6650);
  const dummy = new THREE.Object3D();
  const palette = ['#6e692d','#7a7434','#91804d','#a08d49','#585927','#a8955f','#4a5427'].map(c => new THREE.Color(c));
  for (let i = 0; i < tuft.count; i++) {
    const near = i < 4200;
    const z = 13 - Math.pow(rng(),1.4) * (near ? 48 : 99);
    const sign = rng() < .49 ? -1 : 1;
    const x = sign * (2.5 + Math.pow(rng(),1.6) * (near ? 16 : 71));
    const bare = 1 - Math.exp(-(Math.abs(x) - 2.5));
    const h = (.11 + rng() * .54) * (.32 + bare * .68);
    dummy.position.set(x,groundHeight(x,z)-.04,z);
    dummy.rotation.set((rng()-.5)*.4,rng()*TAU,(rng()-.5)*.5);
    dummy.scale.set(.36 + rng() * .85,h,.4 + rng() * .65);
    dummy.updateMatrix();
    tuft.setMatrixAt(i,dummy.matrix);
    tuft.setColorAt(i,palette[Math.floor(rng()*palette.length)]);
  }
  tuft.receiveShadow = true;
  scene.add(tuft);

  const leaf = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,0),surface(0xffffff),900);
  const autumn = ['#823c17','#8e4d20','#ab642b','#ae8245','#694627','#1f1b14','#c37b43'].map(c => new THREE.Color(c));
  for (let i = 0; i < leaf.count; ++i) {
    const x = (rng() - .5) * 34, z = 10 - rng() * 64, w = .025 + rng() * .105;
    dummy.position.set(x,groundHeight(x,z)+.026,z);
    dummy.rotation.set(0,rng()*TAU,0);
    dummy.scale.set(w,.006 + rng() * .019,w * (.48+rng()));
    dummy.updateMatrix();
    leaf.setMatrixAt(i,dummy.matrix);
    leaf.setColorAt(i,autumn[Math.floor(rng()*autumn.length)]);
  }
  scene.add(leaf);
}

function makeGrove(scene, rng, mobile) {
  const canopyPalette = ['#7b381c','#a45526','#c26e2e','#aa7539','#7f713b','#493d22','#6d4e28','#a74924'].map(c => new THREE.Color(c));
  const foliage = [];
  const bark = surface('#514335');
  const coords = [];
  for (let i = 0; i < 38; i++) coords.push([(rng()-.5)*167,-55-i*.9+rng()*9,.65+rng()*.8]);
  for (let i = 0; i < 24; i++) coords.push([(i % 2 ? 1 : -1)*(17+rng()*39),8-rng()*68,.6+rng()*.8]);
  for (const [x,z,scale] of coords) {
    const y = groundHeight(x,z);
    const h = (3.8 + rng() * 3.3) * scale;
    const trunk = mesh(scene,new THREE.CylinderGeometry(.096*scale,.285*scale,h,7),bark,x,y+h*.5,z,z > -36);
    trunk.rotation.z = (rng()-.5)*.12;
    const main = Math.floor(rng() * canopyPalette.length);
    for (let j = 0; j < 8; j++) {
      const angle = j * 2.4, r = (.75 + rng() * 2.5) * scale;
      const branch = v3(x + Math.cos(angle) * r,y + h * (.83 + rng() * .41),z + Math.sin(angle) * r);
      if (z > -39) {
        const base = v3(x,y+h*(.51+rng()*.32),z);
        const delta = branch.clone().sub(base);
        const center = base.addScaledVector(delta,.5);
        const stick = mesh(scene,new THREE.CylinderGeometry(.038*scale,.108*scale,delta.length(),5),bark,...center);
        stick.quaternion.setFromUnitVectors(v3(0,1),delta.normalize());
      }
      for (let k = 0; k < (mobile ? 12 : 17); k++) {
        const a = rng()*TAU, spread = Math.sqrt(rng()) * 1.84 * scale;
        const height = (.32+rng()) * scale;
        const c = canopyPalette[rng() < .22 ? (main + 1) % canopyPalette.length : main].clone();
        c.multiplyScalar(.55+rng()*.67);
        foliage.push([branch.x+Math.cos(a)*spread,branch.y+(rng()-.43)*1.9*scale,branch.z+Math.sin(a)*spread,height,c]);
      }
    }
  }
  const crown = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,mobile ? 0 : 1),surface(0xffffff,{ flatShading:true }),foliage.length);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < foliage.length; ++i) {
    const [x,y,z,w,c] = foliage[i];
    dummy.position.set(x,y,z);
    dummy.scale.set(w*(1+rng()*.45),w*.72,w*(1+rng()*.32));
    dummy.rotation.set(rng()*TAU,rng()*TAU,rng()*TAU);
    dummy.updateMatrix();
    crown.setMatrixAt(i,dummy.matrix);
    crown.setColorAt(i,c);
  }
  crown.receiveShadow=true;
  scene.add(crown);
}

function makeBarn(scene, rng, woodMap) {
  const barn = new THREE.Group();
  barn.position.set(-17,groundHeight(-17,-32),-32);
  barn.rotation.y = .22;
  scene.add(barn);
  const red = ['#a5583b','#935339','#874734','#b46946','#96523e'].map(color => surface(color,{ ...woodMap,bumpScale:.06 }));
  const dry = surface('#d8ad79',{ ...woodMap,bumpScale:.057 });
  const interior = surface('#29241d',{ ...woodMap });
  const roofColors = ['#433e31','#454136','#514b3e','#473d31','#595045'].map(c=>surface(c,{ metalness:.34,roughness:.62 }));
  const base = surface('#534b40',{ ...woodMap });
  box(barn,base,12.15,.45,8.18,0,.225,0);
  box(barn,interior,11.9,4.55,7.85,0,2.55,0);
  for (let i=0;i<38;i++){
    const x=(i-18.5)*.315, above=2.85*(1-Math.abs(x)/6.2);
    const pattern=red[Math.floor(rng()*red.length)];
    const door=Math.abs(x)<1.65;
    const bottom=door ? 3.27 : .43;
    const top=4.82+above;
    box(barn,pattern,.304,top-bottom,.15,x,(top+bottom)/2,4.02+rng()*.024);
    box(barn,pattern,.306,top-.41,.14,x,(top+.41)/2,-4.02);
  }
  for (const side of [-1,1]) {
    for (let j=0;j<25;j++) {
      const z=(j-12)*.32;
      box(barn,red[Math.floor(rng()*red.length)],.15,4.39,.313,side*5.98,2.61,z);
    }
    for(let j=0;j<24;j++){
      const z=(j-11.5)*.375;
      const panel=box(barn,roofColors[Math.floor(rng()*roofColors.length)],7.12,.13,.376,side*3.03,6.22,z);
      panel.rotation.z=-side*.44;
      const seam=box(barn,roofColors[0],7.14,.085,.034,side*3.03,6.29,z+.182);
      seam.rotation.z=-side*.44;
    }
    beam(barn,dry,v3(0,7.76,4.53),v3(side*6.35,4.76,4.53),.20,.17);
    box(barn,dry,.16,4.43,.17,side*5.99,2.63,4.11);
    box(barn,dry,.13,3.07,.15,side*1.71,1.82,4.13);
  }
  box(barn,dry,3.63,.18,.23,0,3.32,4.13);
  const door = box(barn,red[0],1.62,3,.12,2.55,1.83,4.22);
  door.rotation.y=-.045;
  beam(barn,dry,v3(1.78,.45,4.31),v3(3.29,3.31,4.31),.075);
  box(barn,dry,1.56,1.48,.17,0,5.1,4.12);
  box(barn,interior,1.35,1.27,.1,0,5.1,4.24);
  box(barn,dry,.068,1.28,.11,0,5.10,4.31);
  box(barn,dry,1.34,.068,.11,0,5.1,4.31);

  const hayMap = document.createElement('canvas');
  hayMap.width=hayMap.height=256;
  const hayCtx=hayMap.getContext('2d');
  hayCtx.fillStyle='#937134';hayCtx.fillRect(0,0,256,256);
  for(let i=0;i<4400;i++){
    const x=rng()*256,y=rng()*256;
    hayCtx.strokeStyle=['#c7a458','#a27b35','#705721','#d9ae53','#ae934f'][i%5];
    hayCtx.lineWidth=rng()*1.5+.4;
    hayCtx.beginPath();hayCtx.moveTo(x,y);hayCtx.quadraticCurveTo(x+10,y-3-rng()*5,x+13+rng()*17,y-11+rng()*18);hayCtx.stroke();
  }
  const texture=new THREE.CanvasTexture(hayMap);
  texture.colorSpace=THREE.SRGBColorSpace;
  const straw=surface('#e5c087',{map:texture,bumpMap:texture,bumpScale:.095});
  const twine=surface('#67512e');
  for(const [x,z,w,rot] of [[-6,-8,1,.19],[-7,-10,1.3,.46],[7,-15,1.25,-.57],[12,-22,1.05,.2],[-8,-24,1.25,.42],[-7.1,-31,1.38,.07],[8,-38,1.08,.6],[-7,-47,1.1,.4]]){
    const group=new THREE.Group();
    group.position.set(x,groundHeight(x,z)+w*.45,z);
    group.rotation.y=rot;
    scene.add(group);
    const roll=mesh(group,new THREE.CylinderGeometry(w*.49,w*.49,w,24),straw);
    roll.rotation.z=Math.PI/2;
    for(const f of [-.34,.34]){
      const ring=mesh(group,new THREE.TorusGeometry(w*.492,.012,4,27),twine,w*f);
      ring.rotation.y=Math.PI/2;
    }
  }
  for(const side of [-1,1]){
    for(let z=5;z>=-59;z-=4){
      const x=side*(8.7+.12*Math.cos(z*.4));
      const y=groundHeight(x,z);
      const post=box(scene,dry,.18,1.44,.21,x,y+.68,z);
      post.rotation.z=(rng()-.5)*.12;
      if(z<=-59)continue;
      const farY=groundHeight(x,z-4);
      for (const offset of [.53,1.05]) beam(scene,dry,v3(x,y+offset,z+.1),v3(x,farY+offset,z-4.15),.11,.16);
    }
  }
}

function targetTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 768;
  const ctx = canvas.getContext('2d');
  const rng = random(205);
  ctx.fillStyle = '#53372a';ctx.fillRect(0,0,768,768);
  for (const [fraction,color] of [[.984,'#c6b292'],[.86,'#9d3a2b'],[.67,'#cdbba0'],[.48,'#a6422f'],[.30,'#ddc2a3'],[.145,'#e59042']]){
    ctx.beginPath();ctx.arc(384,384,384*fraction,0,TAU);ctx.fillStyle=color;ctx.fill();
  }
  for (let j=0;j<14000;j++){
    const x=rng()*768,y=rng()*768;
    ctx.strokeStyle = rng()<.54 ? 'rgba(73,49,35,.21)' : 'rgba(255,236,202,.19)';
    ctx.lineWidth=.3+rng()*1.4;
    ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+(rng()-.5)*2,y+rng()*23);ctx.stroke();
  }
  for (let x=57;x<769;x+=73){
    ctx.fillStyle='#4a362b82';ctx.fillRect(x,0,3,768);
    ctx.fillStyle='#ead3b066';ctx.fillRect(x+3,0,2,768);
  }
  ctx.strokeStyle='#643921';ctx.lineWidth=4;
  ctx.beginPath();ctx.moveTo(372,384);ctx.lineTo(396,384);ctx.moveTo(384,372);ctx.lineTo(384,396);ctx.stroke();
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace=THREE.SRGBColorSpace;
  map.anisotropy=4;
  return map;
}

function skyReflections(scene) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const sky = ctx.createLinearGradient(0,0,0,256);
  for (const [i,c] of [[0,'#627e9b'],[.27,'#9bb0c3'],[.48,'#f0b58b'],[.56,'#675038'],[1,'#443729']]) {
    sky.addColorStop(i,c);
  }
  ctx.fillStyle=sky;
  ctx.fillRect(0,0,512,256);
  const glow=ctx.createRadialGradient(207,96,1,207,96,52);
  glow.addColorStop(0,'#fff8de');
  glow.addColorStop(.19,'#ffda9fdf');
  glow.addColorStop(1,'#ffac7200');
  ctx.fillStyle=glow;
  ctx.fillRect(0,0,512,256);
  const texture=new THREE.CanvasTexture(canvas);
  texture.colorSpace=THREE.SRGBColorSpace;
  texture.mapping=THREE.EquirectangularReflectionMapping;
  scene.environment=texture;
  scene.environmentIntensity=.43;
}

function batchScenery(scene) {
  const batches=new Map();
  scene.updateMatrixWorld(true);
  scene.traverse(object=>{
    if(!object.isMesh || object.isInstancedMesh || !object.geometry.index ||
      object.material.type!=='MeshStandardMaterial' || object.geometry.getAttribute('color'))return;
    const key=`${object.material.id}:${object.castShadow}`;
    if(!batches.has(key))batches.set(key,[]);
    batches.get(key).push(object);
  });
  const matrix=new THREE.Matrix3();
  const vector=v3();
  for(const batch of batches.values()){
    if(batch.length<2)continue;
    const data={position:[],normal:[],uv:[]},indices=[];
    let offset=0;
    for(const item of batch){
      const geometry=item.geometry;
      const {position,normal,uv}=geometry.attributes;
      matrix.getNormalMatrix(item.matrixWorld);
      for(let i=0;i<position.count;i++){
        data.position.push(...vector.fromBufferAttribute(position,i).applyMatrix4(item.matrixWorld));
        data.normal.push(...vector.fromBufferAttribute(normal,i).applyNormalMatrix(matrix));
        data.uv.push(uv.getX(i),uv.getY(i));
      }
      for(const index of geometry.index.array)indices.push(index+offset);
      offset+=position.count;
      item.removeFromParent();
      geometry.dispose();
    }
    const merged=new THREE.BufferGeometry();
    for(const [attribute,values] of Object.entries(data))merged.setAttribute(attribute,new THREE.Float32BufferAttribute(values,attribute==='uv'?2:3));
    merged.setIndex(indices);
    mesh(scene,merged,batch[0].material,0,0,0,batch[0].castShadow);
  }
}

export function buildField(scene,isMobile,canvasOnly) {
  const rng = random(95618);
  scene.fog = new THREE.FogExp2('#b78762',.011);
  const materials = { soil: makeMaterialMaps('soil'), wood: makeMaterialMaps('wood'), skin: makeMaterialMaps('skin') };
  if(canvasOnly)return materials;
  sky(scene);
  skyReflections(scene);
  const light = new THREE.DirectionalLight('#ffe0b9',3.05);
  light.position.set(-29,29,-44);
  light.target.position.set(0,0,-19);
  light.castShadow = true;
  light.shadow.mapSize.set(isMobile ? 1024 : 2048,isMobile ? 1024 : 2048);
  const c = light.shadow.camera;
  c.left=-36;c.right=36;c.top=37;c.bottom=-31;c.near=1;c.far=100;
  light.shadow.bias=-.0004;light.shadow.normalBias=.036;
  scene.add(light,light.target,new THREE.HemisphereLight('#d8e5f8','#aa754c',1.75));
  const fill=new THREE.DirectionalLight('#f8c9a2',.56);
  fill.position.set(6,8,14);scene.add(fill);
  makeTerrain(scene,rng,materials);
  makeGrove(scene,rng,isMobile);
  makeBarn(scene,rng,materials.wood);
  batchScenery(scene);
  return materials;
}

export function buildTarget(scene, materials, radius) {
  const wood = surface('#f2c49b',{ ...materials.wood,bumpScale:.05 });
  const dark = surface('#ac835b',{ ...materials.wood,bumpScale:.05 });
  const edge = surface('#503d34',{ roughness:.53,metalness:.32 });
  const bolts = surface('#585653',{ roughness:.46,metalness:.5 });
  const stand = new THREE.Group();
  scene.add(stand);
  const center = 2.48;
  const board = new THREE.Group();
  board.position.y=center;
  stand.add(board);
  const body = mesh(board,new THREE.CylinderGeometry(radius,radius,.24,96),dark);
  body.rotation.x=Math.PI/2;
  const map = targetTexture();
  const face = mesh(board,new THREE.CircleGeometry(radius*.989,96),surface('#ffffff',{map,bumpMap:map,bumpScale:.047}),0,0,.127,false);
  face.receiveShadow=true;
  const rim=mesh(board,new THREE.TorusGeometry(radius-.024,.035,6,96),edge,0,0,.125);
  for(let i=0;i<10;i++){
    const theta=i*TAU/10;
    mesh(board,new THREE.IcosahedronGeometry(.041,1),bolts,Math.cos(theta)*(radius-.105),Math.sin(theta)*(radius-.105),.145,false);
  }
  for(const side of [-1,1]){
    beam(stand,wood,v3(side*radius*.86,.02,-.27),v3(side*radius*.58,center+radius*.44,-.18),.19,.21);
    beam(stand,dark,v3(side*radius*.93,.02,-1.52),v3(side*radius*.62,center+.16,-.24),.16,.18);
  }
  box(stand,wood,radius*2.12,.15,.18,0,.46,-.18);
  return {stand,board,face,rim,center,radius};
}

export function buildLauncher(scene, materials) {
  const stand=new THREE.Group();
  scene.add(stand);
  const wood=surface('#c99768',{ ...materials.wood,bumpScale:.075 });
  const metal=surface('#564e3f',{ roughness:.46,metalness:.49 });
  const rope=surface('#8c6b46',{ ...materials.wood,bumpScale:.043 });
  const soft=surface('#68513b',{ ...materials.wood,bumpScale:.11 });
  const platform=new THREE.Group();platform.position.z=.68;stand.add(platform);
  for(const side of [-1,1]){
    box(platform,wood,.25,.26,2.88,side*.85,.21,.12);
    box(platform,metal,.31,.08,.35,side*.85,.37,1.33);
    beam(platform,wood,v3(side*.87,.3,-1.31),v3(side*.78,1.36,-.10),.21);
    beam(platform,wood,v3(side*.85,.31,1.47),v3(side*.78,1.36,-.10),.24);
    const bearing=mesh(platform,new THREE.CylinderGeometry(.245,.245,.24,12),metal,side*.79,1.29,-.10);
    bearing.rotation.z=Math.PI/2;
    const hub=mesh(platform,new THREE.CylinderGeometry(.081,.081,.05,8),rope,side*.928,1.29,-.10);
    hub.rotation.z=Math.PI/2;
    for(let j=0;j<5;j++)box(platform,metal,.31,.07,.055,side*.86,.355,-.96+j*.105);
  }
  for(const z of [-.99,.57,1.36])box(platform,wood,2.02,.19,.20,0,.27,z);
  const arm=new THREE.Group();arm.position.set(0,1.28,-.1);platform.add(arm);
  box(arm,wood,.30,.22,2.30,0,0,.19);
  box(arm,metal,.40,.29,.26,0,0,.77);
  box(arm,metal,.54,.31,.52,0,0,-.91);
  const basket=mesh(arm,new THREE.SphereGeometry(.69,26,13,0,TAU,Math.PI*.49,Math.PI*.51),soft,0,.16,-.92);
  basket.scale.y=.30;
  basket.material.side=THREE.DoubleSide;
  for(let i=0;i<6;i++){
    const ring=mesh(arm,new THREE.TorusGeometry(.36+i*.060,.021,5,46),rope,0,-.01+i*.026,-.92);
    ring.rotation.x=Math.PI/2;
  }
  return {stand,arm};
}
