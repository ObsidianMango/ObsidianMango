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
