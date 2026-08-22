const sequences = {
  purchase:[[520,.05,'square'],[780,.08,'square']], sale:[[660,.05,'triangle'],[990,.09,'triangle']],
  travel:[[180,.08,'sawtooth'],[260,.08,'sawtooth'],[390,.12,'triangle']], market:[[420,.08,'square'],[520,.08,'square'],[620,.12,'square']],
  police:[[180,.10,'square'],[310,.10,'square'],[180,.10,'square'],[310,.14,'square']], hit:[[90,.11,'sawtooth']],
  escape:[[330,.06,'triangle'],[495,.07,'triangle'],[740,.15,'triangle']], error:[[150,.09,'square'],[120,.14,'square']],
  victory:[[392,.08,'triangle'],[523,.08,'triangle'],[659,.18,'triangle']], defeat:[[220,.12,'sawtooth'],[165,.18,'sawtooth']]
};

export class GameAudio {
  constructor(enabled = true) { this.enabled = enabled; this.context = null; }
  setEnabled(value) { this.enabled = Boolean(value); }
  unlock() {
    if (!this.enabled) return;
    const AudioContext = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!AudioContext) return;
    this.context ??= new AudioContext();
    if (this.context.state === 'suspended') this.context.resume().catch(()=>{});
  }
  play(name) {
    if (!this.enabled || !sequences[name]) return;
    this.unlock();
    if (!this.context) return;
    let offset = 0;
    for (const [frequency,duration,type] of sequences[name]) {
      const osc = this.context.createOscillator();
      const gain = this.context.createGain();
      osc.type = type; osc.frequency.value = frequency;
      const start = this.context.currentTime + offset;
      gain.gain.setValueAtTime(.0001,start);
      gain.gain.exponentialRampToValueAtTime(.055,start+.008);
      gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
      osc.connect(gain).connect(this.context.destination);
      osc.start(start); osc.stop(start+duration+.01);
      offset += duration;
    }
  }
}
