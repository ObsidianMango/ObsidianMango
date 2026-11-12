import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.min.js';

const corners = [
  [-.5, -.5, -.5], [.5, -.5, -.5], [.5, .5, -.5], [-.5, .5, -.5],
  [-.5, -.5, .5], [.5, -.5, .5], [.5, .5, .5], [-.5, .5, .5],
];
const faces = [
  [0, 3, 2, 1, 2, -1, .68], [4, 5, 6, 7, 2, 1, 1],
  [0, 4, 7, 3, 0, -1, .94], [1, 2, 6, 5, 0, 1, .72],
  [0, 1, 5, 4, 1, -1, .53], [3, 7, 6, 2, 1, 1, 1.24],
];
const lines = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
const matrix = new THREE.Matrix4();
const combined = new THREE.Matrix4();
const color = new THREE.Color();
const colorCSS = new Map();

function painted(tint, light) {
  const value = color.copy(tint).multiplyScalar(light).getHex();
  let css = colorCSS.get(value);
  if (!css) {
    css = '#' + value.toString(16).padStart(6, '0');
    if (colorCSS.size > 16000) colorCSS.clear();
    colorCSS.set(value, css);
  }
  return css;
}

export class SoftwareRenderer {
  constructor(canvas) {
    this.domElement = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.shadowMap = {};
    this.view = new THREE.Matrix4();
    this.ratio = 1;
  }

  setPixelRatio(ratio) {
    this.ratio = Math.min(ratio, 1.35);
  }

  setSize(width, height) {
    this.width = width;
    this.height = height;
    this.domElement.width = Math.round(width * this.ratio);
    this.domElement.height = Math.round(height * this.ratio);
  }

  clipCoordinates(x, y, z, m = this.view.elements) {
    return [
      m[0] * x + m[4] * y + m[8] * z + m[12],
      m[1] * x + m[5] * y + m[9] * z + m[13],
      m[2] * x + m[6] * y + m[10] * z + m[14],
      m[3] * x + m[7] * y + m[11] * z + m[15],
    ];
  }

  screen([x, y, z, w]) {
    return [(x / w + 1) * this.width * .5, (1 - y / w) * this.height * .5, z / w, w];
  }

  transform(x, y, z, m) {
    return this.screen(this.clipCoordinates(x, y, z, m));
  }

  clipFace(vertices) {
    const points = [];
    const near = .13;
    for (let i = 0; i < vertices.length; i++) {
      const a = vertices[i];
      const b = vertices[(i + 1) % vertices.length];
      if (a[3] >= near) points.push(this.screen(a));
      if ((a[3] >= near) === (b[3] >= near)) continue;
      const t = (near - a[3]) / (b[3] - a[3]);
      points.push(this.screen(a.map((value, axis) => value + (b[axis] - value) * t)));
    }
    return points;
  }

  pushBoxes(mesh, output, direction, camera) {
    const m = mesh.instanceMatrix.array;
    const perspective = camera.isPerspectiveCamera;
    for (let i = 0; i < mesh.count; i++) {
      const offset = i * 16;
      if (!m[offset] && !m[offset + 1] && !m[offset + 2]) continue;
      matrix.fromArray(m, offset);
      combined.multiplyMatrices(this.view, matrix);
      const vertices = corners.map(([x, y, z]) => this.clipCoordinates(x, y, z, combined.elements));
      if (perspective && vertices.every(p => p[3] < .13)) continue;
      const projected = perspective ? null : vertices.map(p => this.screen(p));
      if (projected && (projected.every(p => p[0] < 0) || projected.every(p => p[0] > this.width)
        || projected.every(p => p[1] < 0) || projected.every(p => p[1] > this.height))) continue;
      const dx = perspective ? camera.position.x - m[offset + 12] : direction[0];
      const dy = perspective ? camera.position.y - m[offset + 13] : direction[1];
      const dz = perspective ? camera.position.z - m[offset + 14] : direction[2];
      mesh.getColorAt(i, tint);
      for (const [a, b, c, d, axis, sign, light] of faces) {
        const axisOffset = offset + axis * 4;
        const dot = dx * m[axisOffset] + dy * m[axisOffset + 1] + dz * m[axisOffset + 2];
        if (dot * sign <= .00001) continue;
        const points = perspective
          ? this.clipFace([vertices[a], vertices[b], vertices[c], vertices[d]])
          : [projected[a], projected[b], projected[c], projected[d]];
        if (points.length < 3 || perspective && (points.every(p => p[0] < 0) || points.every(p => p[0] > this.width)
          || points.every(p => p[1] < 0) || points.every(p => p[1] > this.height))) continue;
        const depth = perspective ? points.reduce((sum, p) => sum + p[3], 0) / points.length : (points[0][2] + points[2][2]) * .5;
        output.push({ depth, points, fill: painted(tint, light) });
      }
    }
  }

  draw(items) {
    const ctx = this.ctx;
    items.sort((a, b) => b.depth - a.depth);
    for (const item of items) {
      if (item.image) {
        const [a, b, d] = item.points;
        ctx.save();
        ctx.transform(b[0] - a[0], b[1] - a[1], d[0] - a[0], d[1] - a[1], a[0], a[1]);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(item.image, item.left, 0, item.slice, item.image.height, 0, 0, 1, 1);
        ctx.restore();
      } else {
        const [first, ...rest] = item.points;
        ctx.beginPath();
        ctx.moveTo(first[0], first[1]);
        for (const [x, y] of rest) ctx.lineTo(x, y);
        ctx.closePath();
        ctx.fillStyle = item.fill;
        ctx.fill();
      }
    }
  }

  render(scene, camera) {
    const ctx = this.ctx;
    ctx.setTransform(this.ratio, 0, 0, this.ratio, 0, 0);
    ctx.fillStyle = '#405448';
    ctx.fillRect(0, 0, this.width, this.height);
    this.view.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    const perspective = camera.isPerspectiveCamera;
    const direction = camera.matrixWorld.elements.slice(8, 11);
    const ground = [];
    const blocks = [];
    const overlays = [];
    let world;
    scene.traverseVisible(mesh => {
      if (mesh.isInstancedMesh && mesh.count) {
        this.pushBoxes(mesh, mesh.userData.ground && !perspective ? ground : blocks, direction, camera);
        if (mesh.userData.structure) world = mesh;
      } else if (mesh.userData.sign && !perspective && direction[2] > .01) {
        const { x, y, z } = mesh.position;
        const { width, height } = mesh.geometry.parameters;
        const image = mesh.material.map.image;
        const slices = 16;
        const slice = image.width / slices;
        for (let i = 0; i < slices; i++) {
          const left = x - width / 2 + i * width / slices;
          const right = left + width / slices;
          const points = [
            this.transform(left, y + height / 2, z),
            this.transform(right, y + height / 2, z),
            this.transform(left, y - height / 2, z),
          ];
          const depth = this.transform((left + right) / 2, y, z)[2] - .004;
          blocks.push({ points, image, left: i * slice, slice, depth });
        }
      } else if (mesh.isSprite || mesh.isLineSegments || mesh.userData.ring) {
        overlays.push(mesh);
      }
    });
    this.draw(ground);
    if (world && !perspective && !world.userData.structure.sites) {
      const job = world.userData.structure;
      const spread = ctx.createRadialGradient(0, 0, .2, 0, 0, 1);
      spread.addColorStop(0, '#11171366');
      spread.addColorStop(1, '#11171300');
      const [x, y] = this.transform(1.25, .005, -.65);
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(job.w * this.width / (camera.right - camera.left) * .75, job.d * this.height / (camera.top - camera.bottom) * Math.max(.25, direction[1]) * .86);
      ctx.fillStyle = spread;
      ctx.fillRect(-1, -1, 2, 2);
      ctx.restore();
    }
    this.draw(blocks);
    for (const mesh of overlays) {
      const { x, y, z } = mesh.position;
      const [px, py, , depth] = this.transform(x, y, z);
      if (perspective && (depth < .25 || mesh.isLineSegments)) continue;
      const scale = perspective
        ? Math.min(88, this.width * camera.projectionMatrix.elements[0] * .5 * mesh.scale.x / depth)
        : this.width * camera.zoom / (camera.right - camera.left) * mesh.scale.x;
      if (mesh.isSprite) {
        ctx.drawImage(mesh.material.map.image, px - scale / 2, py - scale / 2, scale, scale);
      } else if (mesh.isLineSegments) {
        ctx.beginPath();
        const points = corners.map(([dx, dy, dz]) => this.transform(x + dx * mesh.scale.x, y + dy * mesh.scale.y, z + dz * mesh.scale.z));
        for (const [a, b] of lines) {
          ctx.moveTo(points[a][0], points[a][1]);
          ctx.lineTo(points[b][0], points[b][1]);
        }
        ctx.lineWidth = 1.25;
        ctx.strokeStyle = '#ffebaa';
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.ellipse(px, py, scale, scale * Math.max(.12, direction[1]), 0, 0, Math.PI * 2);
        ctx.strokeStyle = mesh.material.color.getStyle();
        ctx.globalAlpha = mesh.material.opacity;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }
  }
}

const tint = new THREE.Color();
