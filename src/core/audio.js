// Efek suara sintetis (WebAudio). Tidak ada audio sebelum interaksi pertama pengguna.
export class Audio {
  constructor(muted = false) {
    this.muted = muted;
    this.ctx = null;
    this.master = null;
    this.ambient = null;
  }

  // Dipanggil dari gestur pengguna (klik/tombol) agar browser mengizinkan audio.
  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    try {
      this.ctx = new AudioContext();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.8;
      this.master.connect(this.ctx.destination);
      this.#startAmbient();
    } catch {
      this.ctx = null;
    }
  }

  setMuted(m) {
    this.muted = m;
    if (this.master) this.master.gain.setTargetAtTime(m ? 0 : 0.8, this.ctx.currentTime, 0.05);
  }

  #tone(freq, dur = 0.12, type = 'sine', vol = 0.07, freq2 = null, delay = 0) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime + delay;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (freq2) o.frequency.exponentialRampToValueAtTime(freq2, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.master);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  pick() { this.#tone(520, 0.08, 'triangle', 0.08, 780); }
  ok() { this.#tone(660, 0.1, 'triangle', 0.08); this.#tone(880, 0.14, 'triangle', 0.08, null, 0.08); }
  bad() { this.#tone(220, 0.25, 'square', 0.035, 150); }
  card() { [523, 659, 784, 1047].forEach((f, i) => this.#tone(f, 0.16, 'triangle', 0.06, null, i * 0.07)); }
  tool() { [392, 523, 659].forEach((f, i) => this.#tone(f, 0.18, 'sine', 0.08, null, i * 0.09)); }
  talk() { this.#tone(300 + Math.random() * 120, 0.05, 'sine', 0.03); }
  click() { this.#tone(700, 0.04, 'sine', 0.035); }
  whoosh() { this.#tone(180, 0.6, 'sine', 0.06, 900); }
  splash() { this.#tone(900, 0.18, 'sine', 0.05, 250); }
  step() { this.#tone(150 + Math.random() * 50, 0.05, 'triangle', 0.012); }
  bury() { this.#tone(160, 0.35, 'sine', 0.08, 70); }

  // Angin lembut + kicau sesekali, volume rendah.
  #startAmbient() {
    const ctx = this.ctx;
    const len = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
      d[i] = last * 3;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 500;
    const g = ctx.createGain();
    g.gain.value = 0.05;
    src.connect(filter).connect(g).connect(this.master);
    src.start();
    this.ambient = g;
    const chirp = () => {
      if (!this.muted && this.ctx.state === 'running') {
        const base = 1800 + Math.random() * 900;
        this.#tone(base, 0.07, 'sine', 0.012, base * 1.3);
        this.#tone(base * 1.1, 0.06, 'sine', 0.01, base * 1.4, 0.1);
      }
      setTimeout(chirp, 4000 + Math.random() * 7000);
    };
    setTimeout(chirp, 3000);
  }
}
