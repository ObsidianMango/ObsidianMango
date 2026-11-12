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

const rewindTime = 3000;
const aftermathTime = 2400;
const rewindStep = 100;

export class DetonationReplay {
  constructor(panel, onClose) {
    this.panel = panel;
    this.context = panel.querySelector('canvas').getContext('2d', { alpha: false });
    this.caption = panel.querySelector('span');
    this.skip = panel.querySelector('button');
    this.onClose = onClose;
    this.skip.addEventListener('click', () => this.close());
    this.reset();
  }

  reset() {
    this.panel.hidden = true;
    this.frames = [];
    this.sounds = [];
    this.nextFrame = 0;
    this.blast = null;
  }

  get active() {
    return !this.panel.hidden;
  }

  remember(yard, now, target) {
    if (!this.context || now < this.nextFrame) return;
    this.nextFrame = now + rewindStep;
    const source = yard.renderDetonationFrame(target);
    if (this.context.canvas.width !== source.width || this.context.canvas.height !== source.height) {
      this.context.canvas.width = source.width;
      this.context.canvas.height = source.height;
      this.frames.length = 0;
      this.cursor = 0;
      if (this.active) {
        this.close();
        return;
      }
    }
    this.context.drawImage(source, 0, 0);
    this.frames.push({ now, image: this.context.getImageData(0, 0, source.width, source.height) });
    if (!this.active) {
      while (this.frames.length > 1 && this.frames[1].now <= now - rewindTime) this.frames.shift();
    }
  }

  begin(yard, target) {
    const now = performance.now();
    this.nextFrame = 0;
    this.remember(yard, now - 1, target);
    if (!this.frames.length) return;
    this.blast = { now, target: { ...target } };
    this.started = null;
    this.cursor = 0;
    this.lastImage = null;
    this.panel.hidden = false;
    this.skip.focus({ preventScroll: true });
    this.nextFrame = 0;
    this.context.putImageData(this.frames[0].image, 0, 0);
    this.caption.textContent = 'FPV REPLAY · 3s TO BLAST';
  }

  queueSound(play) {
    this.sounds.push({ now: performance.now(), play });
  }

  get aftermathComplete() {
    return this.active && performance.now() - this.blast.now > aftermathTime;
  }

  advance(yard, now) {
    if (!this.active) return;
    const { target, now: blastTime } = this.blast;
    if (now <= blastTime + aftermathTime) this.remember(yard, now, target);
    if (!this.active) return;
    this.started ??= now;
    const elapsed = now - this.started;
    const moment = elapsed - rewindTime;
    if (moment >= aftermathTime) {
      this.close();
      return;
    }
    const time = blastTime + moment;
    while (this.sounds[0]?.now <= time) this.sounds.shift().play();
    while (this.frames[this.cursor + 1]?.now <= time) this.cursor++;
    const image = this.frames[this.cursor].image;
    if (image !== this.lastImage) {
      this.context.putImageData(image, 0, 0);
      this.lastImage = image;
    }
    const label = moment < 0 ? `FPV REPLAY · ${Math.ceil(-moment / 1000)}s TO BLAST` : 'FPV REPLAY · DETONATION';
    if (this.caption.textContent !== label) this.caption.textContent = label;
  }

  close() {
    if (!this.active) return;
    this.reset();
    this.onClose();
  }
}
