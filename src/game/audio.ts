// Procedural audio engine using Web Audio API — no external assets.
class AudioEngine {
  ctx: AudioContext | null = null;
  master: GainNode | null = null;
  muted = false;

  init() {
    if (this.ctx) return;
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.5;
    this.master.connect(this.ctx.destination);
  }

  resume() {
    this.init();
    if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.master) this.master.gain.value = m ? 0 : 0.5;
  }

  private env(gain: GainNode, t: number, peak: number, end: number) {
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0001), t + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + end);
  }

  private tone(
    freq: number,
    endFreq: number,
    dur: number,
    type: OscillatorType,
    peak: number,
    delay = 0
  ) {
    if (!this.ctx || !this.master || this.muted) return;
    const t = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(endFreq, 1), t + dur);
    this.env(g, t, peak, dur);
    osc.connect(g);
    g.connect(this.master);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  private noise(dur: number, peak: number, filterFreq: number, delay = 0, q = 1) {
    if (!this.ctx || !this.master || this.muted) return;
    const t = this.ctx.currentTime + delay;
    const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * dur, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = filterFreq;
    filter.Q.value = q;
    const g = this.ctx.createGain();
    this.env(g, t, peak, dur);
    src.connect(filter);
    filter.connect(g);
    g.connect(this.master);
    src.start(t);
  }

  shoot(type: string) {
    switch (type) {
      case "pistol":
        this.tone(900, 180, 0.12, "square", 0.28);
        this.noise(0.08, 0.3, 1400);
        break;
      case "rifle":
        this.tone(700, 140, 0.1, "square", 0.22);
        this.noise(0.07, 0.28, 1900);
        break;
      case "smg":
        this.tone(850, 200, 0.06, "square", 0.18);
        this.noise(0.05, 0.2, 2100);
        break;
      case "shotgun":
        this.tone(220, 60, 0.22, "square", 0.4);
        this.noise(0.2, 0.4, 900, 0, 0.5);
        break;
      case "sniper":
        this.tone(1400, 70, 0.3, "sine", 0.4);
        this.noise(0.28, 0.4, 1000, 0, 0.4);
        break;
      default:
        this.tone(800, 160, 0.1, "square", 0.25);
    }
  }

  reload() {
    this.noise(0.15, 0.25, 3000);
    this.tone(500, 700, 0.05, "sine", 0.15, 0.05);
  }

  hit() {
    this.noise(0.08, 0.25, 800);
    this.tone(200, 100, 0.08, "sine", 0.2);
  }

  kill() {
    this.tone(600, 1200, 0.12, "sawtooth", 0.22);
    this.tone(300, 80, 0.35, "sawtooth", 0.25, 0.08);
    this.noise(0.2, 0.3, 500, 0.1, 0.5);
  }

  explode() {
    this.tone(160, 40, 0.5, "sawtooth", 0.4);
    this.noise(0.5, 0.5, 500, 0, 0.4);
  }

  pickup() {
    this.tone(500, 900, 0.09, "sine", 0.2);
    this.tone(750, 1200, 0.09, "sine", 0.18, 0.06);
  }

  coin() {
    this.tone(900, 1400, 0.08, "triangle", 0.18);
    this.tone(1200, 1800, 0.08, "triangle", 0.16, 0.05);
  }

  hurt() {
    this.tone(300, 120, 0.15, "sawtooth", 0.3);
    this.noise(0.12, 0.3, 700);
  }

  dash() {
    this.tone(400, 1000, 0.12, "sine", 0.15);
    this.noise(0.12, 0.2, 2500);
  }

  levelup() {
    this.tone(500, 500, 0.1, "sine", 0.2);
    this.tone(660, 660, 0.1, "sine", 0.2, 0.1);
    this.tone(880, 880, 0.14, "sine", 0.22, 0.2);
    this.tone(1320, 1320, 0.2, "sine", 0.2, 0.3);
  }

  zoneWarn() {
    this.tone(220, 220, 0.3, "square", 0.25);
    this.tone(220, 220, 0.3, "square", 0.25, 0.35);
  }

  gameover() {
    this.tone(400, 380, 0.4, "sawtooth", 0.3);
    this.tone(320, 300, 0.4, "sawtooth", 0.3, 0.35);
    this.tone(220, 90, 1.2, "sawtooth", 0.3, 0.7);
  }

  victory() {
    this.tone(523, 523, 0.15, "triangle", 0.25);
    this.tone(659, 659, 0.15, "triangle", 0.25, 0.15);
    this.tone(784, 784, 0.15, "triangle", 0.25, 0.3);
    this.tone(1046, 1046, 0.35, "triangle", 0.28, 0.45);
  }
}

export const audio = new AudioEngine();
