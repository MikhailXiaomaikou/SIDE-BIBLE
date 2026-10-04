export class Soundscape {
  constructor() { this.context = null; this.enabled = false; this.master = null; this.voices = []; }
  async setEnabled(enabled) {
    this.enabled = enabled;
    if (!enabled) { if (this.master) this.master.gain.setTargetAtTime(0, this.context.currentTime, .3); return true; }
    const AudioEngine = window.AudioContext || window.webkitAudioContext;
    if (!AudioEngine) { this.enabled = false; return false; }
    try {
      if (!this.context) {
        this.context = new AudioEngine();
        this.master = this.context.createGain();
        this.master.gain.value = 0;
        this.master.connect(this.context.destination);
        [110, 164.81, 220.12].forEach((frequency, index) => {
          const oscillator = this.context.createOscillator();
          const gain = this.context.createGain();
          oscillator.type = 'sine'; oscillator.frequency.value = frequency;
          gain.gain.value = [.19, .1, .05][index];
          oscillator.connect(gain); gain.connect(this.master); oscillator.start();
          this.voices.push(oscillator);
        });
      }
      await this.context.resume();
      this.master.gain.setTargetAtTime(.22, this.context.currentTime, .7);
      return true;
    } catch { this.enabled = false; return false; }
  }
  chime(index = 0) {
    if (!this.enabled || !this.context) return;
    const frequencies = [329.63, 392, 440, 493.88, 587.33, 659.25];
    const now = this.context.currentTime;
    [1, 2.002].forEach((ratio, part) => {
      const oscillator = this.context.createOscillator();
      const gain = this.context.createGain();
      oscillator.frequency.value = frequencies[index % frequencies.length] * ratio;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(part ? .08 : .28, now + .045);
      gain.gain.exponentialRampToValueAtTime(.0001, now + 2.7);
      oscillator.connect(gain); gain.connect(this.master);
      oscillator.start(now); oscillator.stop(now + 2.8);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    });
  }
  suspend() { if (this.context) this.context.suspend().catch(() => {}); }
  resume() { if (this.context && this.enabled) this.context.resume().catch(() => {}); }
}
