import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.min.js';
import { SoftwareRenderer } from './software.js';
import { key, palettes, randomFrom } from './jobs.js';

const box = new THREE.BoxGeometry();
const blockMaterial = new THREE.MeshLambertMaterial();
const goldMaterial = new THREE.MeshStandardMaterial({ roughness: .32, metalness: .36, emissive: 0xc37918, emissiveIntensity: .25 });
const hiddenMatrix = new THREE.Matrix4().makeScale(0, 0, 0);
const dummy = new THREE.Object3D();
const shade = new THREE.Color();
const rayBounds = new THREE.Box3(new THREE.Vector3(-14.5, 0, -10.5), new THREE.Vector3(14.5, 20, 10.5));
const rayEntry = new THREE.Vector3();
const point = new THREE.Vector3();
const maxDebris = 580;
const tau = Math.PI * 2;
const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.55);

function batch(parent, geometry, material, count) {
  const mesh = new THREE.InstancedMesh(geometry, material, count);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.frustumCulled = false;
  parent.add(mesh);
  return mesh;
}

function setBox(mesh, id, x, y, z, sx, sy, sz, color) {
  dummy.position.set(x, y, z);
  dummy.rotation.set(0, 0, 0);
  dummy.scale.set(sx, sy, sz);
  dummy.updateMatrix();
  mesh.setMatrixAt(id, dummy.matrix);
  mesh.setColorAt(id, color);
}

function signTexture(text) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#19332e';
  ctx.fillRect(0, 0, 256, 64);
  ctx.strokeStyle = '#f0b363';
  ctx.lineWidth = 4;
  ctx.strokeRect(5, 5, 246, 54);
  ctx.fillStyle = '#ffdb91';
  ctx.font = 'bold 40px monospace';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.fillText(text, 128, 34, 226);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.NearestFilter;
  return texture;
}

function markerTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(32, 6);
  ctx.lineTo(58, 32);
  ctx.lineTo(32, 58);
  ctx.lineTo(6, 32);
  ctx.closePath();
  ctx.strokeStyle = '#181911';
  ctx.lineWidth = 8;
  ctx.stroke();
  ctx.fillStyle = '#36291a';
  ctx.fill();
  ctx.strokeStyle = '#ffce5a';
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.fillStyle = '#ffe390';
  ctx.fillRect(28, 20, 8, 24);
  ctx.fillRect(20, 28, 24, 8);
  return new THREE.CanvasTexture(canvas);
}

function trace(ray, cells) {
  if (!ray.intersectBox(rayBounds, rayEntry)) return [];
  const start = rayBounds.containsPoint(ray.origin) ? ray.origin : rayEntry;
  point.copy(start).addScaledVector(ray.direction, .0001);
  const positions = [point.x + .5, point.y + 1, point.z + .5];
  const steps = [ray.direction.x, ray.direction.y, ray.direction.z];
  const cell = positions.map(Math.floor);
  const delta = steps.map(step => Math.abs(1 / step));
  const cross = steps.map((step, i) => {
    if (step === 0) return Infinity;
    const face = cell[i] + (step > 0 ? 1 : 0);
    return (face - positions[i]) / step;
  });
  const found = [];
  let distance = 0;
  let first = null;
  for (let i = 0; i < 106; i++) {
    const voxel = cells.get(key(...cell));
    if (voxel) {
      first ??= distance;
      found.push({ voxel, distance: distance - first });
    }
    const axis = cross[0] <= cross[1] && cross[0] <= cross[2] ? 0 : cross[1] <= cross[2] ? 1 : 2;
    distance = cross[axis];
    if (distance > 63 || (first !== null && distance - first > 8)) break;
    cell[axis] += Math.sign(steps[axis]);
    cross[axis] += delta[axis];
  }
  return found;
}

export class Yard {
  constructor(element) {
    this.element = element;
    const canvas = document.createElement('canvas');
    const settings = { antialias: true, alpha: false, powerPreference: 'high-performance' };
    const context = canvas.getContext('webgl2', settings);
    this.renderer = context
      ? new THREE.WebGLRenderer({ ...settings, canvas, context })
      : new SoftwareRenderer(canvas);
    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.shadowMap.autoUpdate = false;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.36;
    element.append(this.renderer.domElement);
    this.renderer.domElement.setAttribute('aria-hidden', 'true');
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x44574d);
    this.scene.fog = new THREE.Fog(0x44574d, 42, 92);
    this.camera = new THREE.OrthographicCamera(-10, 10, 10, -10, .2, 150);
    this.look = new THREE.Vector3();
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.azimuth = .63;
    this.tilt = .67;
    this.goalAzimuth = this.azimuth;
    this.goalTilt = this.tilt;
    this.view = 'iso';
    this.shake = 0;
    this.reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.scene.add(new THREE.HemisphereLight(0xd6e8df, 0x5b6252, 1.65));
    const sun = new THREE.DirectionalLight(0xffe5b9, 2.6);
    sun.position.set(-18, 28, 19);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -23, right: 23, top: 23, bottom: -23, near: .5, far: 85 });
    sun.shadow.camera.updateProjectionMatrix();
    sun.shadow.normalBias = .045;
    sun.shadow.bias = -.0003;
    this.scene.add(sun);
    const fill = new THREE.DirectionalLight(0xb2e7e5, .58);
    fill.position.set(12, 5, -16);
    this.scene.add(fill);
    this.world = new THREE.Group();
    this.scene.add(this.world);
    this.debris = [];
    this.debrisMesh = batch(this.scene, box, blockMaterial, maxDebris);
    this.debrisMesh.count = 0;
    this.outline = new THREE.LineSegments(
      new THREE.EdgesGeometry(box),
      new THREE.LineBasicMaterial({ color: 0xffe5a0, transparent: true, opacity: 1, depthTest: false }),
    );
    this.outline.scale.setScalar(1.025);
    this.outline.renderOrder = 4;
    this.outline.visible = false;
    this.scene.add(this.outline);
    this.markerMaterial = new THREE.SpriteMaterial({ map: markerTexture(), depthTest: false, depthWrite: false, transparent: true, toneMapped: false });
    this.markers = new Map();
    this.rings = [];
    this.ringGeometry = new THREE.RingGeometry(.90, 1, 24);
    this.width = 1;
    this.height = 1;
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(element);
    this.lastFrame = performance.now();
    this.dirty = true;
    this.resize();
    requestAnimationFrame(now => this.frame(now));
  }

  resize() {
    this.width = Math.max(1, this.element.clientWidth);
    this.height = Math.max(1, this.element.clientHeight);
    this.renderer.setSize(this.width, this.height, false);
    this.updateFraming();
  }

  updateFraming() {
    if (!this.job) return;
    const aspect = this.width / this.height;
    const overhead = this.view === 'top';
    const front = this.view === 'front';
    const skyline = [3, 3, 4, 1, 6][this.job.theme];
    const span = overhead ? this.job.d + 7 : (this.job.h + skyline) * (front ? .92 : .79)
      + this.job.d * (front ? .21 : .53) + 3.2;
    const across = this.job.w + (overhead || front ? 5 : 7);
    const vertical = Math.max(span, across / aspect);
    this.camera.left = -vertical * aspect / 2;
    this.camera.right = vertical * aspect / 2;
    this.camera.top = vertical / 2;
    this.camera.bottom = -vertical / 2;
    this.camera.updateProjectionMatrix();
    this.look.set(0, overhead ? 1 : this.job.h * .50 + skyline * .23, .38);
    this.dirty = true;
  }

  setView(view, immediate = false) {
    this.view = view;
    this.goalAzimuth = view === 'iso' ? .63 : 0;
    while (this.goalAzimuth - this.azimuth > Math.PI) this.goalAzimuth -= tau;
    while (this.goalAzimuth - this.azimuth < -Math.PI) this.goalAzimuth += tau;
    this.goalTilt = view === 'iso' ? .64 : view === 'front' ? .13 : Math.PI / 2 - .0001;
    if (immediate || this.reduceMotion) {
      this.azimuth = this.goalAzimuth;
      this.tilt = this.goalTilt;
    }
    this.updateFraming();
  }

  turn(amount, drag = false) {
    this.goalAzimuth -= amount;
    if (drag || this.reduceMotion) this.azimuth = this.goalAzimuth;
    this.dirty = true;
  }

  load(job, cells) {
    for (const object of [...this.world.children]) {
      this.world.remove(object);
      if (object.isInstancedMesh) object.dispose();
      if (object === this.sign) {
        object.geometry.dispose();
        object.material.map.dispose();
        object.material.dispose();
      }
    }
    this.clearScan();
    this.debris.length = 0;
    this.debrisMesh.count = 0;
    for (const ring of this.rings) {
      this.scene.remove(ring.mesh);
      ring.mesh.material.dispose();
    }
    this.rings.length = 0;
    this.outline.visible = false;
    this.shake = 0;
    this.job = job;
    this.buildGround(job);
    this.signZ = (job.d - 1) / 2;
    this.signY = job.h === 7 ? 5 : job.theme === 3 ? 5 : job.h - 1;
    const face = new THREE.PlaneGeometry(job.theme === 1 ? 6.9 : 5.55, 1.36);
    this.sign = new THREE.Mesh(face, new THREE.MeshBasicMaterial({ map: signTexture(job.sign), toneMapped: false }));
    this.sign.position.set(0, this.signY - .38, this.signZ + .49);
    this.sign.userData.sign = true;
    this.world.add(this.sign);

    this.blocks = batch(this.world, box, blockMaterial, cells.length);
    this.blocks.userData.structure = job;
    this.blocks.castShadow = true;
    this.blocks.receiveShadow = true;
    const nuggets = cells.filter(cell => cell.kind === 'gold');
    this.nuggets = batch(this.world, box, goldMaterial, nuggets.length);
    this.nuggets.castShadow = true;
    this.nuggets.receiveShadow = true;
    const palette = palettes[job.theme];
    let nuggetIndex = 0;
    for (const cell of cells) {
      const isGold = cell.kind === 'gold';
      cell.color = new THREE.Color(isGold ? 0xffb12c : palette[cell.kind]).multiplyScalar(cell.shade);
      if (isGold) {
        this.blocks.setMatrixAt(cell.id, hiddenMatrix);
        this.blocks.setColorAt(cell.id, cell.color);
        cell.nuggetIndex = nuggetIndex++;
        setBox(this.nuggets, cell.nuggetIndex, cell.x, cell.y - .52, cell.z, .82, .68, .82, cell.color);
      } else {
        const size = cell.kind === 'glass' ? .925 : .965;
        setBox(this.blocks, cell.id, cell.x, cell.y - .5, cell.z, size, size, size, cell.color);
      }
    }
    this.renderer.shadowMap.needsUpdate = true;
    this.setView('iso', true);
  }

  buildGround(job) {
    const x = (job.w - 1) / 2;
    const z = (job.d - 1) / 2;
    const random = randomFrom(job.theme + 883);
    const blocks = [];
    const add = (x, y, z, w, h, d, color) => blocks.push([x, y, z, w, h, d, color]);
    add(0, -.65, 0, 170, .8, 170, 0x4d6654);
    add(0, -.26, .5, 52, .16, 41, 0x586059);
    add(0, -.085, .15, x * 2 + 4.9, .17, z * 2 + 5.8, 0x777a66);
    add(0, -.135, z + 6.2, 52, .11, 5.5, 0x3d4642);
    add(0, -.10, z + 3.27, 42, .08, .22, 0xaaa48a);
    add(0, -.10, z + 9.11, 42, .08, .20, 0xaaa48a);
    for (let i = -7; i <= 7; i++) add(i * 3.3, -.065, z + 6.18, 1.75, .027, .12, 0xc09851);
    for (let i = -4; i <= 4; i++) {
      add(i * 2.5, -.01, z + 2.82, .06, .026, .78, 0xaeab93);
      add(i * 2.6, -.01, -z - 2.1, .1, .026, .58, 0xafa992);
    }
    for (let dz = -z - 3; dz <= z + 2; dz++) {
      add(-x - 2.43, .01, dz, .20, .06, .82, dz % 2 ? 0xab934e : 0x4b5143);
      add(x + 2.43, .01, dz, .20, .06, .82, dz % 2 ? 0xab934e : 0x4b5143);
    }
    for (let i = 0; i < 85; i++) {
      const gx = (random() - .5) * 50;
      const gz = (random() - .5) * 37;
      if (Math.abs(gx) < x + 3 && Math.abs(gz) < z + 3 || gz > z + 3 && gz < z + 9.3) continue;
      add(gx, -.16, gz, .12 + random() * .65, .06, .25 + random() * .55, random() < .55 ? 0x626b61 : 0x4a554d);
    }
    for (const side of [-1, 1]) {
      for (let i = 0; i < 3; i++) {
        const gx = side * (x + 4.2 + i * 1.9);
        const gz = -z - 1.5 - i * .45;
        add(gx, .05, gz, 1.4, .31, 1.12, 0x77745d);
        add(gx, .32, gz, 1.1, .39, .86, i % 2 ? 0x536b4b : 0x62774c);
        add(gx + .16, .62, gz - .12, .72, .42, .57, 0x688252);
      }
      const gx = side * (x + 2.05);
      add(gx, .1, z + 2.25, .48, .24, .45, 0x687164);
      add(gx, 1.42, z + 2.25, .17, 2.8, .16, 0x495c54);
      add(gx - side * .38, 2.80, z + 2.25, .90, .19, .19, 0x647267);
      add(gx - side * .76, 2.76, z + 2.25, .35, .21, .31, 0xf4d390);
    }
    for (let i = 0; i < 12; i++) {
      const gx = -19 + i * 3.4;
      add(gx, .36, -z - 4.8, .1, 1.0, .14, 0x6d7561);
      if (i < 11) {
        add(gx + 1.7, .16, -z - 4.8, 3.32, .10, .08, 0x758174);
        add(gx + 1.7, .65, -z - 4.8, 3.32, .10, .08, 0x758174);
      }
    }
    const ground = batch(this.world, box, blockMaterial, blocks.length);
    blocks.forEach((params, id) => setBox(ground, id, ...params.slice(0, 6), shade.set(params[6])));
    ground.userData.ground = true;
    ground.receiveShadow = true;
  }

  aim(px, py, cells) {
    this.mouse.set(px / this.width * 2 - 1, 1 - py / this.height * 2);
    this.raycaster.setFromCamera(this.mouse, this.camera);
    return trace(this.raycaster.ray, cells);
  }

  highlight(voxel) {
    this.outline.visible = Boolean(voxel);
    if (voxel) this.outline.position.set(voxel.x, voxel.y - .5, voxel.z);
    this.dirty = true;
  }

  project(voxel) {
    point.set(voxel.x, voxel.y - .15, voxel.z).project(this.camera);
    return { x: (point.x * .5 + .5) * this.width, y: (.5 - point.y * .5) * this.height };
  }

  scan(cells) {
    this.clearScan();
    this.scanUntil = performance.now() + 7000;
    for (const cell of cells.values()) {
      if (cell.kind !== 'gold') continue;
      const sprite = new THREE.Sprite(this.markerMaterial);
      sprite.position.set(cell.x, cell.y - .46, cell.z);
      sprite.renderOrder = 6;
      this.scene.add(sprite);
      this.markers.set(cell.id, sprite);
    }
    this.dirty = true;
  }

  clearScan() {
    for (const sprite of this.markers.values()) this.scene.remove(sprite);
    this.markers.clear();
    this.scanUntil = 0;
    this.dirty = true;
  }

  damage(cell) {
    if (cell.kind === 'gold') return;
    this.blocks.setColorAt(cell.id, shade.copy(cell.color).multiplyScalar(.57));
    this.blocks.instanceColor.needsUpdate = true;
    this.dirty = true;
  }

  destroy(cells, origin, remaining, tool) {
    const gold = cells.filter(cell => cell.kind === 'gold');
    for (const cell of cells) {
      if (cell.kind === 'gold') {
        this.nuggets.setMatrixAt(cell.nuggetIndex, hiddenMatrix);
        const sprite = this.markers.get(cell.id);
        if (sprite) {
          this.scene.remove(sprite);
          this.markers.delete(cell.id);
        }
      } else {
        this.blocks.setMatrixAt(cell.id, hiddenMatrix);
      }
    }
    if (this.sign.visible) {
      const backing = [-2, -1, 0, 1, 2].filter(x => remaining.has(key(x, this.signY, this.signZ)));
      if (backing.length <= 2) this.sign.visible = false;
    }
    this.blocks.instanceMatrix.needsUpdate = true;
    this.nuggets.instanceMatrix.needsUpdate = true;
    this.renderer.shadowMap.needsUpdate = true;
    for (let i = 0; i < cells.length; i += Math.max(1, Math.ceil(cells.length / 185))) {
      const cell = cells[i];
      if (cell.kind === 'gold') continue;
      this.addDebris(cell, origin, false, tool === 'blast' ? 1.55 : 1);
      if (cells.length < 38) this.addDebris(cell, origin, false, .8);
    }
    for (const cell of gold) {
      for (let i = 0; i < 12; i++) this.addDebris(cell, origin, true, 1);
    }
    if (this.debris.length > maxDebris) this.debris.splice(0, this.debris.length - maxDebris);
    this.shake = this.reduceMotion ? 0 : Math.min(.55, .06 + cells.length * .002 + (tool === 'blast' ? .18 : 0));
    if (tool === 'blast' || gold.length) {
      const mesh = new THREE.Mesh(this.ringGeometry, new THREE.MeshBasicMaterial({
        color: gold.length ? 0xffcb56 : 0xf78b5b, transparent: true, opacity: .75, side: THREE.DoubleSide, depthWrite: false,
      }));
      mesh.userData.ring = true;
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(origin.x, origin.y - .55, origin.z);
      this.scene.add(mesh);
      this.rings.push({ mesh, age: 0 });
    }
    this.dirty = true;
  }

  addDebris(cell, origin, gold, strength) {
    const random = Math.random;
    this.debris.push({
      x: cell.x + (random() - .5) * .7,
      y: cell.y - .5 + (random() - .5) * .45,
      z: cell.z + (random() - .5) * .7,
      vx: ((cell.x - origin.x) * .68 + (random() - .5) * 5.8) * strength,
      vy: (2 + random() * (gold ? 8 : 5)) * strength,
      vz: ((cell.z - origin.z) * .68 + (random() - .5) * 5.8) * strength,
      spin: (random() - .5) * 13,
      angle: random() * 5,
      size: (gold ? .12 : .20) + random() * (gold ? .19 : .32),
      age: 0,
      life: (gold ? .78 : .52) + random() * .65,
      color: gold ? shade.clone().setHex(random() < .5 ? 0xffc137 : 0xffe483) : cell.color,
    });
  }

  frame(now) {
    const dt = Math.min(.04, (now - this.lastFrame) / 1000);
    this.lastFrame = now;
    const motion = Math.abs(this.goalAzimuth - this.azimuth) + Math.abs(this.goalTilt - this.tilt) > .0002;
    if (motion) {
      const easing = 1 - Math.exp(-15 * dt);
      this.azimuth += (this.goalAzimuth - this.azimuth) * easing;
      this.tilt += (this.goalTilt - this.tilt) * easing;
    }
    if (this.dirty || motion || this.debris.length || this.rings.length || this.scanUntil || this.shake > 0) {
      this.dirty = false;
      const y = Math.sin(this.tilt) * 43;
      const r = Math.cos(this.tilt) * 43;
      const kick = this.view === 'top' ? 0 : this.shake * Math.sin(now * .091);
      this.shake = Math.max(0, this.shake - dt * 2.4);
      this.camera.position.set(
        this.look.x + Math.sin(this.azimuth) * r,
        this.look.y + y,
        this.look.z + Math.cos(this.azimuth) * r,
      );
      this.camera.lookAt(this.look);
      this.camera.translateX(kick);
      this.camera.translateY(kick * .24);
      this.camera.updateMatrixWorld();
      this.updateEffects(now, dt);
      this.renderer.render(this.scene, this.camera);
    }
    requestAnimationFrame(time => this.frame(time));
  }

  updateEffects(now, dt) {
    if (this.scanUntil && now >= this.scanUntil) this.clearScan();
    if (this.scanUntil) {
      const pulse = this.reduceMotion ? .88 : .87 + Math.sin(now * .012) * .11;
      for (const sprite of this.markers.values()) sprite.scale.setScalar(pulse);
    }
    for (let i = this.rings.length - 1; i >= 0; i--) {
      const ring = this.rings[i];
      ring.age += dt;
      if (ring.age > .46) {
        this.scene.remove(ring.mesh);
        ring.mesh.material.dispose();
        this.rings.splice(i, 1);
      } else {
        ring.mesh.scale.setScalar(.35 + ring.age * 10);
        ring.mesh.material.opacity = .76 * (1 - ring.age / .46);
      }
    }
    if (!this.debris.length && !this.debrisMesh.count) return;
    let living = 0;
    for (const p of this.debris) {
      p.age += dt;
      if (p.age >= p.life) continue;
      p.vy -= dt * 23;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      if (p.y < .12) {
        p.y = .12;
        p.vy *= -.24;
        p.vx *= .76;
        p.vz *= .76;
      }
      p.angle += p.spin * dt;
      dummy.position.set(p.x, p.y, p.z);
      dummy.rotation.set(p.angle, p.angle * .67, p.angle * .23);
      dummy.scale.setScalar(p.size * Math.min(1, (p.life - p.age) * 4));
      dummy.updateMatrix();
      this.debrisMesh.setMatrixAt(living, dummy.matrix);
      this.debrisMesh.setColorAt(living, p.color);
      this.debris[living++] = p;
    }
    this.debris.length = living;
    this.debrisMesh.count = living;
    this.debrisMesh.instanceMatrix.needsUpdate = true;
    if (this.debrisMesh.instanceColor) this.debrisMesh.instanceColor.needsUpdate = true;
  }
}
