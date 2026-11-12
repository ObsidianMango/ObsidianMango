import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.min.js';
import { SoftwareRenderer } from './software.js?v=4';
import { key, palettes, randomFrom } from './jobs.js?v=4';

import { fieldGround, groundAt } from './terrain.js';

const box = new THREE.BoxGeometry();
const blockMaterial = new THREE.MeshLambertMaterial();

const hiddenMatrix = new THREE.Matrix4().makeScale(0, 0, 0);
const dummy = new THREE.Object3D();
const shade = new THREE.Color();

const rayEntry = new THREE.Vector3();
const point = new THREE.Vector3();
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -.5);
const remoteTarget = new THREE.Vector3();
const soldierBounds = new THREE.Box3();
const soldierParts = [
  [-.125, .23, 0, .20, .41, .24, 0x455044], [.125, .23, 0, .20, .41, .24, 0x455044],
  [-.125, .067, .05, .21, .13, .31, 0x302f29], [.125, .067, .05, .21, .13, .31, 0x302f29],
  [0, .64, 0, .50, .51, .30, 0x798161], [0, .66, .13, .42, .34, .12, 0x555c3c],
  [-.32, .66, .03, .17, .36, .19, 0x747c56], [.32, .66, .04, .17, .36, .19, 0x747c56],
  [0, 1.025, .015, .32, .27, .29, 0xbc986e], [0, 1.163, .01, .37, .15, .34, 0x495647],
  [-.374, .73, .08, .07, .09, .16, 0xdeb8a0], [.22, .64, .28, .12, .12, .65, 0x313630],
];
const rubbleLimit = 190;
const hulls = {
  grenade: [[0, 0, 0, .52, .51, .55, 0x3c5d35], [0, .28, 0, .26, .17, .24, 0xf0ac54],
    [0, .41, 0, .12, .1, .11, 0xff6140]],
  drone: [[0, 0, 0, .66, .31, .82, 0x263e35], [0, .2, .29, .38, .17, .35, 0x69d2a0],
    [0, -.20, .05, .37, .24, .42, 0xe4844b], [0, 0, .33, 1.57, .12, .18, 0x465f50],
    [0, 0, -.32, 1.57, .12, .18, 0x465f50],
    ...[-.68, .68].flatMap(x => [-.34, .34].flatMap(z => [[x, .06, z, .26, .18, .25, 0x36463b],
      [x, .19, z, .65, .045, .17, 0xb6c4a2], [x, .19, z, .17, .045, .65, 0xb6c4a2]]))],
  tank: [[0, 0, 0, .96, .40, 1.39, 0x62734a], [0, .27, 0, .59, .25, .71, 0x324639],
    [0, .36, .45, .19, .12, .64, 0x465c47], [0, .08, .67, .56, .25, .22, 0xe47e48],
    ...[-.49, .49].flatMap(x => [[x, -.10, 0, .28, .40, 1.58, 0x293832],
      ...[-.55, -.29, 0, .29, .55].map(z => [x * 1.25, -.10, z, .08, .21, .17, 0x879579])])],
};
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
  ctx.font = 'bold 36px monospace';
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
  ctx.fillStyle = '#411f22';
  ctx.fill();
  ctx.strokeStyle = '#ff9e90';
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.fillStyle = '#ffd1c4';
  ctx.fillRect(28, 20, 8, 24);
  ctx.fillRect(20, 28, 24, 8);
  return new THREE.CanvasTexture(canvas);
}

function trace(ray, cells, rayBounds, groundDistance) {
  if (!ray.intersectBox(rayBounds, rayEntry)) return [];
  const start = rayBounds.containsPoint(ray.origin) ? ray.origin : rayEntry;
  point.copy(start).addScaledVector(ray.direction, .0001);
  const offset = point.distanceTo(ray.origin);
  if (offset > groundDistance) return [];
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
  for (let i = 0; i < 260; i++) {
    const voxel = cells.get(key(...cell));
    if (voxel) {
      first ??= distance;
      found.push({ voxel, distance: distance - first, rayDistance: distance + offset });
    }
    const axis = cross[0] <= cross[1] && cross[0] <= cross[2] ? 0 : cross[1] <= cross[2] ? 1 : 2;
    distance = cross[axis];
    if (distance + offset > groundDistance || distance > 190 || (first !== null && distance - first > 8)) break;
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
    this.camera = new THREE.OrthographicCamera(-10, 10, 10, -10, .2, 270);
    this.fpvCamera = new THREE.PerspectiveCamera(66, 1, .12, 170);
    this.fpv = null;
    this.sector = [0, 0];
    this.rayBounds = new THREE.Box3();
    this.look = new THREE.Vector3();
    this.focus = new THREE.Vector3();
    this.following = null;
    this.ordnance = new Map();
    this.infantry = new Map();
    this.falling = new Map();
    this.scanActive = false;
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
    const sun = this.sun = new THREE.DirectionalLight(0xffe5b9, 2.6);
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
    this.rubble = batch(this.scene, box, blockMaterial, rubbleLimit);
    this.rubble.count = 0;
    this.rubbleCursor = 0;
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
    this.fpvCamera.aspect = this.width / this.height;
    this.fpvCamera.updateProjectionMatrix();
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
    const fieldSpan = this.job.sites ? Math.max((overhead ? this.job.d * 1.10 + 8 : front ? span : (this.job.d * .81 + this.job.w * .59) * .59 + 11), (across + (overhead || front ? 0 : this.job.d * .25)) / aspect) : 0;
    const vertical = Math.max(span, across / aspect, fieldSpan);
    this.camera.left = -vertical * aspect / 2;
    this.camera.right = vertical * aspect / 2;
    this.camera.top = vertical / 2;
    this.camera.bottom = -vertical / 2;
    this.camera.updateProjectionMatrix();
    this.look.set(this.sector[0] * this.job.w * .23, overhead ? 1 : this.job.h * .50 + skyline * .23,
      this.sector[1] * this.job.d * .23 + .38);
    this.dirty = true;
  }

  setSector(x, z) {
    this.sector = [x, z];
    this.updateFraming();
  }

  setFPV(item) {
    this.fpv = item;
    this.highlight(null);
    this.dirty = true;
  }

  get viewingCamera() {
    return this.fpv ? this.fpvCamera : this.camera;
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

  load(job, cells, squad, terrain) {
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
    for (const item of this.ordnance.keys()) this.removeOrdnance(item);
    for (const person of this.infantry.keys()) this.removeInfantry(person);
    for (const mesh of this.falling.values()) {
      this.scene.remove(mesh);
      mesh.dispose();
    }
    this.falling.clear();
    this.rubble.count = 0;
    this.rubbleCursor = 0;
    this.following = null;
    this.camera.zoom = 1;
    this.fpv = null;
    this.sector = [0, 0];
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
    this.terrain = terrain;
    this.orbitRadius = job.sites ? Math.max(49, job.w * .82 + 18) : 43;
    this.rayBounds.min.set(-job.w / 2 - 12, -3, -job.d / 2 - 12);
    this.rayBounds.max.set(job.w / 2 + 12, 24, job.d / 2 + 12);
    const shadowExtent = Math.max(23, Math.hypot(job.w, job.d) * .57);
    const shadow = this.sun.shadow.camera;
    Object.assign(shadow, { left: -shadowExtent, right: shadowExtent, top: shadowExtent, bottom: -shadowExtent, far: 120 });
    shadow.updateProjectionMatrix();
    this.buildGround(job);
    this.signZ = (job.d - 1) / 2;
    this.signY = job.h === 7 ? 5 : job.theme === 3 ? 5 : job.h - 1;
    const face = new THREE.PlaneGeometry(job.theme === 1 ? 6.9 : 5.55, 1.36);
    this.sign = new THREE.Mesh(face, new THREE.MeshBasicMaterial({ map: signTexture(job.sign), toneMapped: false }));
    this.sign.position.set(0, this.signY - .38, this.signZ + .49);
    this.sign.userData.sign = true;
    this.sign.visible = !job.sites;
    this.world.add(this.sign);

    this.blocks = batch(this.world, box, blockMaterial, cells.length);
    this.blocks.userData.structure = job;
    this.blocks.castShadow = true;
    this.blocks.receiveShadow = true;
    for (const cell of cells) {
      const palette = palettes[cell.palette ?? job.theme];
      const color = cell.kind === 'powder' ? 0xf27642 : cell.kind === 'sandbag' ? 0x919467 : cell.kind === 'beam' ? palette.trim : palette[cell.kind];
      cell.color = new THREE.Color(color).multiplyScalar(cell.shade);
      const size = cell.kind === 'glass' ? .925 : cell.kind === 'powder' ? .71 : .965;
      const height = cell.kind === 'powder' ? .79 : cell.kind === 'sandbag' ? .83 : size;
      setBox(this.blocks, cell.id, cell.x, cell.y - 1 + height / 2, cell.z, size, height, cell.kind === 'sandbag' ? .63 : size, cell.color);
    }
    for (const person of squad) this.drawInfantry(person);
    this.renderer.shadowMap.needsUpdate = true;
    this.setView('iso', true);
    this.focus.copy(this.look);
  }

  buildGround(job) {
    const x = (job.w - 1) / 2;
    const z = (job.d - 1) / 2;
    const random = randomFrom(job.theme + 883);
    const blocks = [];
    const add = (x, y, z, w, h, d, color) => blocks.push([x, y, z, w, h, d, color]);
    if (job.sites) {
      fieldGround(job, this.terrain, add);
    } else {
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
    }
    const ground = batch(this.world, box, blockMaterial, blocks.length);
    blocks.forEach((params, id) => setBox(ground, id, ...params.slice(0, 6), shade.set(params[6])));
    ground.userData.ground = true;
    ground.receiveShadow = true;
  }

  aim(px, py, cells) {
    this.mouse.set(px / this.width * 2 - 1, 1 - py / this.height * 2);
    this.raycaster.setFromCamera(this.mouse, this.viewingCamera);
    const ray = this.raycaster.ray;
    this.groundTarget = null;
    let range = Infinity;
    for (const level of [0, -1, -2]) {
      groundPlane.constant = -level;
      if (!ray.intersectPlane(groundPlane, point) || groundAt(this.terrain, point.x, point.z) !== level) continue;
      const distance = point.distanceTo(ray.origin);
      if (distance >= range) continue;
      range = distance;
      this.groundTarget = { x: point.x, y: level + .45, z: point.z };
    }
    this.aimRange = range;
    return trace(ray, cells, this.rayBounds, range);
  }

  aimPoint(path) {
    const voxel = path[0]?.voxel;
    if (voxel) return { x: voxel.x, y: voxel.y - .5, z: voxel.z };
    const target = this.groundTarget;
    if (!target || Math.abs(target.x) > this.job.w / 2 + 4 || Math.abs(target.z) > this.job.d / 2 + 5) return null;
    return target;
  }

  drawOrdnance(item) {
    const parts = hulls[item.type];
    let mesh = this.ordnance.get(item);
    if (!mesh) {
      mesh = batch(this.scene, box, blockMaterial, parts.length);
      this.ordnance.set(item, mesh);
      parts.forEach((part, i) => mesh.setColorAt(i, shade.set(part[6])));
    }
    const { position, type } = item;
    const yaw = item.yaw + (type === 'grenade' ? item.age * 10 : 0);
    const sine = Math.sin(yaw);
    const cosine = Math.cos(yaw);
    const hover = type === 'drone' ? Math.sin(item.age * 13) * .055 : 0;
    parts.forEach(([x, y, z, sx, sy, sz], i) => {
      dummy.position.set(position.x + x * cosine + z * sine, position.y + y + hover, position.z + z * cosine - x * sine);
      dummy.rotation.set(type === 'grenade' ? item.age * 11 : 0, yaw, 0);
      dummy.scale.set(sx, sy, sz);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    this.dirty = true;
  }

  removeOrdnance(item) {
    const mesh = this.ordnance.get(item);
    if (mesh) {
      this.scene.remove(mesh);
      mesh.dispose();
      this.ordnance.delete(item);
      this.dirty = true;
    }
    if (this.following === item) this.following = null;
    if (this.fpv === item) this.setFPV(null);
  }

  follow(item) {
    this.following = item;
    this.dirty = true;
  }

  highlight(voxel) {
    this.outline.visible = Boolean(voxel);
    if (voxel) this.outline.position.set(voxel.x, voxel.y - .5, voxel.z);
    this.dirty = true;
  }

  project(voxel) {
    point.set(voxel.x, voxel.y - .15, voxel.z).project(this.viewingCamera);
    return { x: (point.x * .5 + .5) * this.width, y: (.5 - point.y * .5) * this.height };
  }

  aimInfantry(squad, range = Infinity) {
    const ray = this.raycaster.ray;
    range = Math.min(range, this.aimRange);
    let closest = null;
    for (const person of squad) {
      soldierBounds.min.set(person.x - .42, person.y, person.z - .40);
      soldierBounds.max.set(person.x + .42, person.y + 1.24, person.z + .40);
      if (!ray.intersectBox(soldierBounds, point)) continue;
      const distance = ray.origin.distanceTo(point);
      if (distance >= range) continue;
      range = distance;
      closest = person;
    }
    return closest;
  }

  drawInfantry(person) {
    let mesh = this.infantry.get(person);
    if (!mesh) {
      mesh = batch(this.scene, box, blockMaterial, soldierParts.length);
      this.infantry.set(person, mesh);
      soldierParts.forEach((part, i) => mesh.setColorAt(i, shade.set(part[6])));
    }
    const sine = Math.sin(person.yaw);
    const cosine = Math.cos(person.yaw);
    const stride = person.next ? Math.sin(person.phase) * .075 : 0;
    soldierParts.forEach(([x, y, z, sx, sy, sz], i) => {
      const step = i < 4 ? stride * (x > 0 ? 1 : -1) : 0;
      dummy.position.set(person.x + x * cosine + (z + step) * sine, person.y + y, person.z + (z + step) * cosine - x * sine);
      dummy.rotation.set(0, person.yaw, 0);
      dummy.scale.set(sx, sy, sz);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    this.markers.get(person.id)?.position.set(person.x, person.y + .79, person.z);
    this.dirty = true;
  }

  removeInfantry(person) {
    const mesh = this.infantry.get(person);
    if (mesh) {
      this.scene.remove(mesh);
      mesh.dispose();
      this.infantry.delete(person);
    }
    const marker = this.markers.get(person.id);
    if (marker) {
      this.scene.remove(marker);
      this.markers.delete(person.id);
    }
    this.dirty = true;
  }

  scan(squad) {
    this.clearScan();
    this.scanActive = true;
    for (const person of squad) {
      const sprite = new THREE.Sprite(this.markerMaterial);
      sprite.position.set(person.x, person.y + .79, person.z);
      sprite.renderOrder = 6;
      sprite.scale.setScalar(this.job.sites ? Math.min(2.2, this.job.w * .041) : .91);
      this.scene.add(sprite);
      this.markers.set(person.id, sprite);
    }
    this.dirty = true;
  }

  clearScan() {
    for (const sprite of this.markers.values()) this.scene.remove(sprite);
    this.markers.clear();
    this.scanActive = false;
    this.dirty = true;
  }

  damage(cell) {
    this.blocks.setColorAt(cell.id, shade.copy(cell.color).multiplyScalar(.57));
    this.blocks.instanceColor.needsUpdate = true;
    this.dirty = true;
  }

  hideBlocks(cells) {
    for (const cell of cells) this.blocks.setMatrixAt(cell.id, hiddenMatrix);
    this.blocks.instanceMatrix.needsUpdate = true;
  }

  drawChunk(chunk, pointFor) {
    let mesh = this.falling.get(chunk);
    if (!mesh) {
      this.hideBlocks(chunk.cells);
      mesh = batch(this.scene, box, blockMaterial, chunk.cells.length);
      this.falling.set(chunk, mesh);
      chunk.cells.forEach((cell, i) => mesh.setColorAt(i, cell.color));
    }
    chunk.cells.forEach((cell, i) => {
      const { x, y, z } = pointFor(chunk, cell);
      dummy.position.set(x, y, z);
      dummy.rotation.set(chunk.ax, 0, chunk.az, 'ZXY');
      dummy.scale.setScalar(cell.kind === 'powder' ? .73 : .955);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    this.dirty = true;
  }

  landChunk(chunk, contact, pointFor) {
    const mesh = this.falling.get(chunk);
    this.scene.remove(mesh);
    mesh.dispose();
    this.falling.delete(chunk);
    const stride = Math.max(1, Math.ceil(chunk.cells.length / 48));
    for (let i = 0; i < chunk.cells.length; i += stride) {
      const cell = chunk.cells[i];
      const position = pointFor(chunk, cell);
      this.addDebris({ ...position, y: Math.min(position.y + .5, contact.y + 1), color: cell.color }, contact, .55);
      if (contact.surface > 0) continue;
      const size = .24 + Math.random() * .42;
      const id = this.rubbleCursor++ % rubbleLimit;
      dummy.position.set(position.x + (Math.random() - .5) * 1.3, groundAt(this.terrain, position.x, position.z) + size * .39, position.z + (Math.random() - .5) * 1.3);
      dummy.rotation.set(Math.random() * .6, Math.random() * 6, Math.random() * .45);
      dummy.scale.set(size, size * .66, size * .78);
      dummy.updateMatrix();
      this.rubble.setMatrixAt(id, dummy.matrix);
      this.rubble.setColorAt(id, cell.color);
    }
    this.rubble.count = Math.min(this.rubbleCursor, rubbleLimit);
    this.rubble.instanceMatrix.needsUpdate = true;
    if (this.rubble.instanceColor) this.rubble.instanceColor.needsUpdate = true;
    if (this.debris.length > maxDebris) this.debris.splice(0, this.debris.length - maxDebris);
    this.dirty = true;
  }

  destroy(cells, origin, remaining, tool, blasts = []) {
    const explosive = ['blast', 'grenade', 'drone', 'tank'].includes(tool);
    this.hideBlocks(cells);
    if (this.sign.visible) {
      const backing = [-2, -1, 0, 1, 2].filter(x => remaining.has(key(x, this.signY, this.signZ)));
      if (backing.length <= 2) this.sign.visible = false;
    }
    this.renderer.shadowMap.needsUpdate = true;
    for (let i = 0; i < cells.length; i += Math.max(1, Math.ceil(cells.length / 150))) {
      const cell = cells[i];
      this.addDebris(cell, origin, explosive ? 1.55 : 1);
      if (cells.length < 38) this.addDebris(cell, origin, .8);
    }
    if (this.debris.length > maxDebris) this.debris.splice(0, this.debris.length - maxDebris);
    if (explosive) this.shockwave(origin, tool === 'tank' ? 1.55 : 1.16, 0xff8b57);
    for (const barrel of blasts) this.shockwave(barrel, .85, 0xffa75e);
    this.shake = this.reduceMotion ? 0 : Math.min(.65, .06 + cells.length * .002 + (explosive ? .22 : 0));
    this.dirty = true;
  }

  shockwave(origin, strength, color) {
    const mesh = new THREE.Mesh(this.ringGeometry, new THREE.MeshBasicMaterial({
      color, transparent: true, opacity: .75, side: THREE.DoubleSide, depthWrite: false,
    }));
    mesh.userData.ring = true;
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(origin.x, origin.y - .48, origin.z);
    this.scene.add(mesh);
    this.rings.push({ mesh, strength, age: 0 });
    for (let i = 0; i < 18; i++) {
      shade.set(i % 3 ? 0xffae45 : 0xff6639);
      this.addDebris({ ...origin, color: shade.clone() }, origin, strength * 1.45);
    }
    if (this.debris.length > maxDebris) this.debris.splice(0, this.debris.length - maxDebris);
  }

  addDebris(cell, origin, strength) {
    const random = Math.random;
    this.debris.push({
      x: cell.x + (random() - .5) * .7,
      y: cell.y - .5 + (random() - .5) * .45,
      z: cell.z + (random() - .5) * .7,
      vx: ((cell.x - origin.x) * .68 + (random() - .5) * 5.8) * strength,
      vy: (2 + random() * 5) * strength,
      vz: ((cell.z - origin.z) * .68 + (random() - .5) * 5.8) * strength,
      spin: (random() - .5) * 13,
      angle: random() * 5,
      size: .20 + random() * .32,
      age: 0,
      life: .52 + random() * .65,
      color: cell.color,
    });
  }

  frame(now) {
    const elapsed = (now - this.lastFrame) / 1000;
    const dt = Math.min(.04, elapsed);
    this.lastFrame = now;
    this.simulate?.(Math.min(.16, elapsed));
    const desired = this.following
      ? remoteTarget.set(this.following.position.x, this.following.position.y + 1.1, this.following.position.z)
      : this.look;
    const zoom = this.following ? 1.62 : this.sector.some(Boolean) ? 1.93 : 1;
    const refocus = this.focus.distanceToSquared(desired) > .0001 || Math.abs(this.camera.zoom - zoom) > .001;
    if (refocus) {
      const ease = this.reduceMotion ? 1 : 1 - Math.exp(-8 * dt);
      this.focus.lerp(desired, ease);
      this.camera.zoom += (zoom - this.camera.zoom) * ease;
      this.camera.updateProjectionMatrix();
    }
    const motion = Math.abs(this.goalAzimuth - this.azimuth) + Math.abs(this.goalTilt - this.tilt) > .0002;
    if (motion) {
      const easing = 1 - Math.exp(-15 * dt);
      this.azimuth += (this.goalAzimuth - this.azimuth) * easing;
      this.tilt += (this.goalTilt - this.tilt) * easing;
    }
    if (this.dirty || this.fpv || motion || refocus || this.debris.length || this.rings.length || this.shake > 0) {
      this.dirty = false;
      const y = Math.sin(this.tilt) * this.orbitRadius;
      const r = Math.cos(this.tilt) * this.orbitRadius;
      const kick = this.view === 'top' ? 0 : this.shake * Math.sin(now * .091);
      this.shake = Math.max(0, this.shake - dt * 2.4);
      this.camera.position.set(
        this.focus.x + Math.sin(this.azimuth) * r,
        this.focus.y + y,
        this.focus.z + Math.cos(this.azimuth) * r,
      );
      this.camera.lookAt(this.focus);
      this.camera.translateX(kick);
      this.camera.translateY(kick * .24);
      this.camera.updateMatrixWorld();
      this.updateEffects(dt);
      const pilot = this.fpv;
      if (pilot) {
        const { x, y, z } = pilot.position;
        const dx = Math.sin(pilot.yaw);
        const dz = Math.cos(pilot.yaw);
        const pitch = pilot.waiting ? -.06 : Math.max(-.58, Math.min(.52, (pilot.end.y - y) / Math.max(1.5, Math.hypot(pilot.end.x - x, pilot.end.z - z))));
        this.fpvCamera.position.set(x + dx * .22, y + .10, z + dz * .22);
        this.fpvCamera.lookAt(x + dx * 8, y + pitch * 8, z + dz * 8);
        this.fpvCamera.updateMatrixWorld();
      }
      this.scene.fog.near = pilot ? 28 : this.orbitRadius + (this.job.sites ? 19 : -1);
      this.scene.fog.far = pilot ? 105 : this.orbitRadius + (this.job.sites ? 115 : 49);
      const hull = this.ordnance.get(pilot);
      if (hull) hull.visible = false;
      this.renderer.render(this.scene, this.viewingCamera);
      if (hull) hull.visible = true;
    }
    requestAnimationFrame(time => this.frame(time));
  }

  updateEffects(dt) {
    for (let i = this.rings.length - 1; i >= 0; i--) {
      const ring = this.rings[i];
      ring.age += dt;
      if (ring.age > .46) {
        this.scene.remove(ring.mesh);
        ring.mesh.material.dispose();
        this.rings.splice(i, 1);
      } else {
        ring.mesh.scale.setScalar((.35 + ring.age * 10) * ring.strength);
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
      const floor = groundAt(this.terrain, p.x, p.z) + .12;
      if (p.y < floor) {
        p.y = floor;
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
