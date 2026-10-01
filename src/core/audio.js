// Audio: file dari folder /audio (musik Suno, efek ElevenLabs) + suara sintetis sebagai cadangan
// untuk efek yang belum ada. Tidak ada audio sebelum interaksi pertama pengguna.
// Musik dipisah ke bus sendiri dengan filter low-pass: makin kusam tanahnya, makin redup musiknya.

// Format ditebak dari isi file oleh decodeAudioData, jadi ekstensi .ogg/.mp3 tidak masalah.
const files = import.meta.glob('/audio/*.{mp3,ogg,wav,m4a}', { query: '?url', import: 'default', eager: true });
const URLS = Object.fromEntries(Object.entries(files).map(([path, url]) => [path.match(/\/([\w-]+)\.\w+$/)[1], url]));

const MUSIC_VOLUME = 0.3;
const SFX_PEAK = 0.55;
// Volume relatif per efek (setelah dinormalkan ke puncak yang sama).
const SFX_GAIN = {
  ui_hover: 0.25, ui_click: 0.5, pick_bottle: 0.8, pick_bag: 0.8, pick_organic: 0.8, pick_foam: 0.8, net_swing: 0.55,
  net_splash: 0.7, basket_full: 0.7, card_unlock: 0.8, quest_done: 0.85, sort_correct: 0.7, soft_wrong: 0.6,
};
const MUSIC_TRACKS = ['main_theme', 'desa_ceria'];
// Suara panjang yang waktunya penting: jangan dipangkas heningnya.
const NO_TRIM = [...MUSIC_TRACKS, 'narasi_opening'];

export class Audio {
  constructor(muted = false) {
    this.muted = muted;
    this.ctx = null;
    this.master = null;
    this.buffers = {};
    this.gains = {};
    this.music = null;
    this.wantMusic = null;
    this.preloading = this.preload();
  }

  // Unduh DAN dekode sejak layar loading. OfflineAudioContext tidak butuh gestur pengguna,
  // jadi saat klik pertama musik bisa langsung berbunyi tanpa menunggu dekode.
  async preload() {
    const decoder = new OfflineAudioContext(2, 1, 48000);
    await Promise.all(Object.entries(URLS).map(async ([name, url]) => {
      try {
        const data = await (await fetch(url)).arrayBuffer();
        const buf = await decoder.decodeAudioData(data);
        const music = MUSIC_TRACKS.includes(name);
        this.buffers[name] = NO_TRIM.includes(name) ? buf : trimSilence(buf);
        this.gains[name] = name === 'narasi_opening' ? normalGain(buf, 0.95) : normalGain(buf, music ? 0.8 : SFX_PEAK);
      } catch {
        // Efek ini akan memakai suara sintetis.
      }
    }));
    if (this.ctx && this.wantMusic) this.playMusic(this.wantMusic.name, this.wantMusic.opts);
  }

  // Dipanggil dari gestur pengguna (klik/tombol) agar browser mengizinkan audio.
  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    try {
      const ctx = new AudioContext();
      this.ctx = ctx;
      this.master = ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.9;
      this.master.connect(ctx.destination);
      this.sfxBus = ctx.createGain();
      this.sfxBus.connect(this.master);
      this.musicFilter = ctx.createBiquadFilter();
      this.musicFilter.type = 'lowpass';
      this.musicFilter.frequency.value = 18000;
      this.musicBus = ctx.createGain();
      this.musicBus.gain.value = MUSIC_VOLUME;
      this.musicBus.connect(this.musicFilter).connect(this.master);
      this.#startAmbient();
      if (this.wantMusic) this.playMusic(this.wantMusic.name, this.wantMusic.opts, true);
    } catch {
      this.ctx = null;
    }
  }

  setMuted(m) {
    this.muted = m;
    if (this.master) this.master.gain.setTargetAtTime(m ? 0 : 0.9, this.ctx.currentTime, 0.05);
  }

  // ---------- efek ----------
  // Putar file bila ada; kalau tidak, panggil cadangan sintetis.
  #sfx(name, fallback, { volume = 1, rate = 1 } = {}) {
    if (!this.ctx || this.muted) return;
    const buf = this.buffers[name];
    if (!buf) { fallback?.(); return; }
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.playbackRate.value = rate;
    const g = this.ctx.createGain();
    g.gain.value = (this.gains[name] ?? 1) * (SFX_GAIN[name] ?? 0.7) * volume;
    src.connect(g).connect(this.sfxBus);
    src.start();
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
    o.connect(g).connect(this.sfxBus);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  // Pungut: suara berbeda untuk botol/wadah, kresek, styrofoam, dan organik (sedikit variasi nada).
  pick(type) {
    let name = 'pick_bottle';
    if (type?.kode === 'organik') name = 'pick_organic';
    else if (type?.kode === 4) name = 'pick_bag';
    else if (type?.kode === 6) name = 'pick_foam';
    this.#sfx(name, () => this.#tone(520, 0.08, 'triangle', 0.08, 780), { rate: 0.95 + Math.random() * 0.1 });
  }

  ok() {
    this.#sfx('sort_correct', () => {
      this.#tone(660, 0.1, 'triangle', 0.08);
      this.#tone(880, 0.14, 'triangle', 0.08, null, 0.08);
    }, { rate: 0.97 + Math.random() * 0.06 });
  }

  bad() { this.#sfx('soft_wrong', () => this.#tone(220, 0.25, 'square', 0.035, 150)); }
  basketFull() { this.#sfx('basket_full', () => this.#tone(220, 0.25, 'square', 0.035, 150)); }
  card() { this.#sfx('card_unlock', () => [523, 659, 784, 1047].forEach((f, i) => this.#tone(f, 0.16, 'triangle', 0.06, null, i * 0.07))); }
  questDone() { this.#sfx('quest_done', () => this.card()); }
  tool() { this.#sfx('quest_done', () => [392, 523, 659].forEach((f, i) => this.#tone(f, 0.18, 'sine', 0.08, null, i * 0.09)), { volume: 0.8, rate: 1.06 }); }
  netSwing() { this.#sfx('net_swing', () => this.#tone(400, 0.12, 'sine', 0.03, 200)); }
  splash() { this.#sfx('net_splash', () => this.#tone(900, 0.18, 'sine', 0.05, 250)); }
  click() { this.#sfx('ui_click', () => this.#tone(620, 0.06, 'triangle', 0.05, 900)); }
  hover() { this.#sfx('ui_hover', () => this.#tone(1150, 0.03, 'sine', 0.015), { rate: 1.1 }); }
  // Belum ada file: tetap sintetis.
  talk() { this.#tone(300 + Math.random() * 120, 0.05, 'sine', 0.03); }
  whoosh() { this.#tone(180, 0.6, 'sine', 0.06, 900); }
  // Langkah: file step_<permukaan>_<n> (variasi acak), nada dinaikkan agar terdengar imut.
  step(surface = 'grass', running = false) {
    const variants = Object.keys(this.buffers).filter((k) => k.startsWith(`step_${surface}`));
    const name = variants.length ? variants[Math.floor(Math.random() * variants.length)] : null;
    if (!name) { this.#tone(150 + Math.random() * 50, 0.05, 'triangle', 0.012); return; }
    const rate = (running ? 1.45 : 1.3) + Math.random() * 0.15;
    this.#sfx(name, null, { rate, volume: running ? 0.45 : 0.32 });
  }
  bury() { this.#tone(160, 0.35, 'sine', 0.08, 70); }

  // ---------- musik ----------
  // Ganti lagu dengan crossfade. rate < 1 terdengar lebih lambat (dipakai Gerbang Waktu).
  playMusic(name, opts = {}, immediate = false) {
    this.wantMusic = { name, opts };
    if (!this.ctx || !this.buffers[name]) return;
    const { rate = 1 } = opts;
    const now = this.ctx.currentTime;
    if (this.music?.name === name) {
      this.music.src.playbackRate.setTargetAtTime(rate, now, 0.4);
      return;
    }
    if (this.music) {
      const old = this.music;
      old.gain.gain.setTargetAtTime(0, now, 0.4);
      old.src.stop(now + 2.5);
    }
    const src = this.ctx.createBufferSource();
    src.buffer = this.buffers[name];
    src.loop = true;
    src.playbackRate.value = rate;
    const gain = this.ctx.createGain();
    gain.gain.value = 0;
    // Lagu pertama (saat klik pertama) masuk cepat; pergantian lagu tetap crossfade halus.
    gain.gain.setTargetAtTime(this.gains[name] ?? 1, now, immediate || !this.music ? 0.08 : 0.6);
    src.connect(gain).connect(this.musicBus);
    src.start();
    this.music = { name, src, gain };
  }

  // Kecilkan musik (mis. saat narator bicara di opening). k = pengali volume 0..1.
  duckMusic(k) {
    this.musicDucked = k < 1;
    if (this.ctx) this.musicBus.gain.setTargetAtTime(MUSIC_VOLUME * k, this.ctx.currentTime, 0.25);
  }

  // Putar suara narasi; kembalikan { time(): detik sejak mulai, stop() } (jam audio = sinkron).
  playVoice(name) {
    const buf = this.buffers[name];
    if (!this.ctx || !buf) return null;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const g = this.ctx.createGain();
    g.gain.value = this.muted ? 0 : (this.gains[name] ?? 1);
    src.connect(g).connect(this.master);
    const start = this.ctx.currentTime + 0.05;
    src.start(start);
    return { time: () => this.ctx.currentTime - start, stop: () => { try { src.stop(); } catch { /* sudah berhenti */ } } };
  }

  // Suasana musik mengikuti tanah (0–100): kusam → redup & teredam. dreamy: efek Gerbang Waktu.
  setMusicMood(health, dreamy = false) {
    if (!this.ctx || this.musicDucked) return;
    const k = Math.max(0, Math.min(1, health / 100));
    const cutoff = dreamy ? 1400 : 900 * Math.pow(18000 / 900, k);
    const now = this.ctx.currentTime;
    this.musicFilter.frequency.setTargetAtTime(cutoff, now, 0.5);
    this.musicBus.gain.setTargetAtTime(MUSIC_VOLUME * (dreamy ? 0.8 : 0.75 + 0.25 * k), now, 0.5);
  }

  // Angin lembut + kicau sesekali, volume rendah (di bawah musik).
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
    g.gain.value = 0.03;
    src.connect(filter).connect(g).connect(this.master);
    src.start();
    const chirp = () => {
      if (!this.muted && this.ctx.state === 'running') {
        const base = 1800 + Math.random() * 900;
        this.#tone(base, 0.07, 'sine', 0.01, base * 1.3);
        this.#tone(base * 1.1, 0.06, 'sine', 0.008, base * 1.4, 0.1);
      }
      setTimeout(chirp, 5000 + Math.random() * 8000);
    };
    setTimeout(chirp, 4000);
  }
}

// Pangkas hening di awal efek supaya terasa langsung saat tombol ditekan.
function trimSilence(buf) {
  const data = buf.getChannelData(0);
  let start = 0;
  while (start < data.length && Math.abs(data[start]) < 0.01) start++;
  start = Math.max(0, start - Math.floor(buf.sampleRate * 0.005));
  if (start < buf.sampleRate * 0.01 || start >= buf.length - 1) return buf;
  const out = new AudioBuffer({ numberOfChannels: buf.numberOfChannels, length: buf.length - start, sampleRate: buf.sampleRate });
  for (let c = 0; c < buf.numberOfChannels; c++) out.copyToChannel(buf.getChannelData(c).subarray(start), c);
  return out;
}

function normalGain(buf, target) {
  let peak = 0;
  for (let c = 0; c < buf.numberOfChannels; c++) {
    const d = buf.getChannelData(c);
    for (let i = 0; i < d.length; i += 4) peak = Math.max(peak, Math.abs(d[i]));
  }
  return peak > 0 ? Math.min(3, target / peak) : 1;
}
