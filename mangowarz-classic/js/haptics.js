export class Haptics {
  constructor(enabled = true) { this.enabled = enabled; }
  setEnabled(value) { this.enabled = Boolean(value); }
  pulse(pattern = 18) {
    if (this.enabled && globalThis.navigator?.vibrate) navigator.vibrate(pattern);
  }
  success() { this.pulse([18,32,24]); }
  warning() { this.pulse([45,30,45]); }
  error() { this.pulse(70); }
}
