const frameInterval = .16;
const framesPerClip = 22;

export class Replays {
  constructor(button) {
    this.button = button;
    this.context = document.createElement('canvas').getContext('2d', { alpha: false });
    this.reset();
  }

  reset() {
    this.clip = null;
    this.recording = null;
    this.button.disabled = true;
  }

  start(target, weight) {
    if (!this.context || weight <= (this.recording?.weight ?? this.clip?.weight ?? 0)) return;
    if (this.recording?.frames.length >= 2) this.clip = this.recording;
    this.recording = { target: { ...target }, weight, frames: [], nextFrame: 0, width: 0, height: 0 };
  }

  capture(yard, now) {
    const clip = this.recording;
    if (!clip || now < clip.nextFrame) return;
    clip.nextFrame = now + frameInterval * 1000;
    const source = yard.renderer.domElement;
    if (!clip.width) {
      const scale = Math.min(1, 360 / Math.max(source.width, source.height));
      clip.width = Math.max(1, Math.round(source.width * scale));
      clip.height = Math.max(1, Math.round(source.height * scale));
      this.context.canvas.width = clip.width;
      this.context.canvas.height = clip.height;
    }
    // The software renderer reuses the main view to avoid doubling CPU raster work.
    if (yard.renderer.isWebGLRenderer) yard.renderReplayAngle(clip.target);
    this.context.drawImage(source, 0, 0, clip.width, clip.height);
    clip.frames.push(this.context.getImageData(0, 0, clip.width, clip.height));
    if (clip.frames.length === 2) this.button.disabled = false;
    if (clip.frames.length >= framesPerClip) {
      this.clip = clip;
      this.recording = null;
    }
  }

  ready() {
    return (this.recording?.frames.length ?? 0) >= 2 || Boolean(this.clip);
  }

  play(canvas, active, complete) {
    const frames = this.recording?.frames.length >= 2 ? [...this.recording.frames] : this.clip?.frames;
    if (!frames?.length) return;
    canvas.width = frames[0].width;
    canvas.height = frames[0].height;
    const context = canvas.getContext('2d');
    let start;
    function frame(now) {
      if (!active()) return;
      start ??= now;
      const index = Math.min(frames.length - 1, Math.floor((now - start) / (frameInterval * 1000)));
      context.putImageData(frames[index], 0, 0);
      if (index < frames.length - 1) requestAnimationFrame(frame);
      else complete();
    }
    requestAnimationFrame(frame);
  }
}

const leadIn = 3;
const aftermath = 3.1;
const sampleInterval = 1 / 30;

export class DetonationReplay {
  constructor(panel, onClose) {
    this.panel = panel;
    this.caption = panel.querySelector('span');
    this.skip = panel.querySelector('button');
    this.onClose = onClose;
    this.skip.addEventListener('click', () => this.close());
    this.reset();
  }

  reset() {
    this.panel.hidden = true;
    this.samples = [];
    this.time = 0;
    this.shot = null;
  }

  get active() {
    return Boolean(this.shot);
  }

  get approaching() {
    return this.active && this.shot.blast === null;
  }

  get timeScale() {
    if (!this.active) return 1;
    if (this.approaching) return 0;
    if (this.shot.reducedMotion) return 1;
    return .50 + .50 * Math.min(1, this.shot.blast / 1.35);
  }

  remember(item, dt) {
    this.time += dt;
    if (this.time - (this.samples.at(-1)?.time ?? -Infinity) < sampleInterval) return;
    this.samples.push(this.sample(item));
    while (this.samples.length > 1 && this.samples[1].time <= this.time - leadIn) this.samples.shift();
  }

  sample(item) {
    return { time: this.time, position: { ...item.position }, yaw: item.yaw, age: item.age };
  }

  begin(item, reducedMotion, detonate) {
    const impact = this.sample(item);
    this.samples.push(impact);
    const duration = Math.min(leadIn, impact.time - this.samples[0].time);
    this.shot = { item, impact, duration, reducedMotion, detonate, elapsed: 0, blast: null, sampleIndex: 0 };
    this.panel.hidden = false;
    this.caption.textContent = 'FPV REPLAY';
    this.skip.focus({ preventScroll: true });
  }

  advance(yard, dt) {
    const shot = this.shot;
    shot.elapsed += dt;
    if (this.approaching && shot.elapsed >= shot.duration) {
      this.trigger();
    } else if (!this.approaching) {
      shot.blast += dt;
      if (shot.blast >= aftermath) {
        this.close();
        return;
      }
    }

    let pose = shot.impact;
    if (this.approaching) {
      const sampleTime = shot.impact.time - shot.duration + shot.elapsed;
      while (this.samples[shot.sampleIndex + 1]?.time < sampleTime) shot.sampleIndex++;
      const from = this.samples[shot.sampleIndex];
      const to = this.samples[shot.sampleIndex + 1] ?? from;
      const t = Math.max(0, Math.min(1, (sampleTime - from.time) / Math.max(.001, to.time - from.time)));
      const { x, y, z } = from.position;
      const turn = Math.atan2(Math.sin(to.yaw - from.yaw), Math.cos(to.yaw - from.yaw));
      pose = {
        position: { x: x + (to.position.x - x) * t, y: y + (to.position.y - y) * t, z: z + (to.position.z - z) * t },
        yaw: from.yaw + turn * t, age: from.age + (to.age - from.age) * t,
      };
      yard.drawOrdnance(shot.item, pose);
    }
    yard.frameDetonation(pose.position, shot.impact.position, shot.elapsed, shot.blast);
  }

  trigger() {
    if (!this.approaching) return;
    this.shot.blast = 0;
    this.caption.textContent = 'DETONATION';
    this.shot.detonate();
  }

  close() {
    if (!this.active) return;
    this.trigger();
    this.reset();
    this.onClose();
  }
}
