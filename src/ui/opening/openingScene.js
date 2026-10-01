// Opening cerita gaya coretan krayon, digambar real-time di canvas (tanpa file video).
// Satu dunia yang mengalir: desa subur → sampah datang → botol pecah jadi mikroplastik
// (kamera mendekat) → turun ke dalam tanah, Cing sedih → naik lagi, desa cerah, ajakan.
// Waktu adegan mengikuti narasi (audio/narasi_opening.mp3, 28 dtk).
import { Doodle, ellipsePts, hash, INK, PAPER, paperGrain } from './doodle.js';
import { t as tr } from '../../data/dialogs.id.js';

export const OPENING_LENGTH = 28;
const W = 1600;
const H = 900;
const GROUND = 640;

// Teks narasi (sama dengan suara) + jendela waktunya.
export const OPENING_CAPTIONS = [[0.27, 3.6], [5.0, 8.4], [9.87, 16.0], [16.07, 19.8], [22.0, 26.9]];

const clamp01 = (x) => Math.max(0, Math.min(1, x));
const ease = (x) => { x = clamp01(x); return x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2; };
const range = (t, a, b) => clamp01((t - a) / (b - a));
// Pegas sederhana untuk "pop": 0 → overshoot → 1.
const pop = (x) => { x = clamp01(x); return 1 - Math.cos(x * Math.PI * 2.5) * Math.exp(-x * 5.5); };
const lerp = (a, b, k) => a + (b - a) * k;

const HOUSES = [[230, 1.35, '#e9853a', 11], [480, 1.1, '#d9663a', 12], [1150, 1.2, '#e9853a', 13], [1400, 1.4, '#d9663a', 14]];
const TREES = [[70, 1.4, 21], [360, 1.05, 22], [600, 1.3, 23], [1000, 1.25, 24], [1270, 1.0, 25], [1550, 1.4, 26]];
const FLOWERS = Array.from({ length: 14 }, (_, i) => [60 + i * 112 + hash(i) * 30, ['#ef6f8e', '#f7c948', '#7fb8ef', '#f29a52'][i % 4], 40 + i]);
// Sampah yang jatuh: [x akhir, jenis, waktu mulai, putaran akhir]. Indeks 0 = botol utama.
const TRASH = [[880, 'bottle', 5.3, 1.45], [300, 'bag', 5.7, 0.2], [1180, 'foam', 6.0, -0.15], [560, 'bottle', 6.3, -1.3],
  [1420, 'bag', 6.6, 0.3], [140, 'foam', 6.9, 0.1], [1000, 'bottle', 7.2, 1.7]];
const SHARD_COLORS = ['#7fb8ef', '#ffffff', '#ef6f6f', '#f7c948', '#9be08a'];

// Kamera: pusat (dunia) + zoom mengikuti waktu.
function camera(t) {
  let x = 800, y = 450, z = 1;
  const zin = ease(range(t, 9.6, 11.2));
  x = lerp(x, 880, zin); y = lerp(y, 575, zin); z = lerp(z, 2.3, zin);
  const down = ease(range(t, 15.3, 17.0));
  x = lerp(x, 800, down); y = lerp(y, 1080, down); z = lerp(z, 1, down);
  const up = ease(range(t, 21.4, 23.0));
  y = lerp(y, 450, up);
  return { x, y, z };
}

export class OpeningScene {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.d = new Doodle(this.ctx);
    this.grain = paperGrain(512, 512);
    this.logo = new Image();
    this.logo.src = `${import.meta.env.BASE_URL}logo.png`;
  }

  resize() {
    // Dibatasi 1.5: garis krayon tetap halus, tapi ringan di HP.
    const dpr = Math.min(window.devicePixelRatio, 1.5);
    this.cw = window.innerWidth;
    this.ch = window.innerHeight;
    this.canvas.width = Math.round(this.cw * dpr);
    this.canvas.height = Math.round(this.ch * dpr);
    this.dpr = dpr;
    // Seluruh adegan 1600×900 muat di layar (sisa layar tetap kertas).
    this.fit = Math.min(this.cw / W, this.ch / H);
  }

  draw(t) {
    const { ctx: c, d } = this;
    d.setTime(t);
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    c.fillStyle = PAPER;
    c.fillRect(0, 0, this.cw, this.ch);

    const cam = camera(t);
    const s = this.fit * cam.z;
    c.save();
    c.translate(this.cw / 2, this.ch / 2);
    c.scale(s, s);
    c.translate(-cam.x, -cam.y);

    // Desa meredup saat sampah datang, cerah lagi di akhir.
    d.dull = 0.75 * ease(range(t, 5.2, 8.5)) * (1 - ease(range(t, 22.2, 23.6)));
    this.#soil(t);
    this.#sky(t);
    this.#village(t);
    this.#ground(t);
    this.#trash(t);
    this.#weather(t);
    this.#shards(t);
    this.#cing(t);
    c.restore();

    // Tekstur kertas di atas segalanya.
    c.save();
    c.globalCompositeOperation = 'multiply';
    c.fillStyle = c.createPattern(this.grain, 'repeat');
    c.fillRect(0, 0, this.cw, this.ch);
    c.restore();
    this.#finale(t);
    this.#caption(t);
    // Pudar masuk & keluar.
    const fade = Math.max(1 - range(t, 0, 0.6), range(t, OPENING_LENGTH - 0.8, OPENING_LENGTH));
    if (fade > 0) {
      c.fillStyle = `rgba(246,239,225,${fade})`;
      c.fillRect(0, 0, this.cw, this.ch);
    }
  }

  // ---------- langit ----------
  #sky(t) {
    const d = this.d;
    // Matahari spiral (seperti referensi), tertutup awan kelabu di tengah cerita.
    const k = pop(range(t, 0.3, 1.4));
    if (k > 0.01) {
      const cx = 1330, cy = 150, r = 62 * k;
      const spiral = [];
      for (let i = 0; i <= 40; i++) { const a = i * 0.45; spiral.push([cx + Math.cos(a) * r * (i / 40), cy + Math.sin(a) * r * (i / 40)]); }
      d.circle(cx, cy, r, '#f7b733', { seed: 1, width: 2.2 });
      d.line(spiral, { seed: 2, color: '#e9853a', width: 3.2 });
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * Math.PI * 2 + t * 0.15;
        d.line([[cx + Math.cos(a) * r * 1.3, cy + Math.sin(a) * r * 1.3], [cx + Math.cos(a) * r * 1.6, cy + Math.sin(a) * r * 1.6]], { seed: 3 + i, width: 2.4 });
      }
    }
    // Pelangi coretan saat harapan kembali.
    const rb = range(t, 22.6, 24.6);
    if (rb > 0) {
      ['#ef6f8e', '#f29a52', '#f7c948', '#9be08a', '#7fb8ef'].forEach((col, i) => {
        const r = 520 - i * 34;
        d.line(ellipsePts(800, GROUND + 40, r, r * 0.78, 40, Math.PI, Math.PI * 2), { color: col, width: 20, wobble: 2, seed: 60 + i, progress: ease(rb - i * 0.06), alpha: 0.75 });
      });
    }
    // Awan biasa (putih bergaris).
    for (let i = 0; i < 3; i++) {
      const x = 260 + i * 470 + ((t * 10 + i * 140) % 300) - 150, y = 120 + (i % 2) * 50;
      const a = pop(range(t, 0.8 + i * 0.25, 1.8 + i * 0.25));
      if (a > 0.01) this.#cloud(x, y, 0.8 * a, '#ffffff', 70 + i * 5);
    }
  }

  #cloud(x, y, s, color, seed) {
    const d = this.d;
    const pts = [];
    const bumps = [[-60, 0, 38], [-20, -22, 44], [30, -16, 40], [66, 4, 30]];
    for (const [bx, by, r] of bumps) pts.push(...ellipsePts(x + bx * s, y + by * s, r * s, r * s * 0.85, 10, Math.PI * 0.85, Math.PI * 2.15));
    pts.push([x + 90 * s, y + 24 * s], [x - 90 * s, y + 24 * s]);
    d.shape(pts, color, { seed, width: 2.2, alpha: 0.9 });
  }

  // ---------- desa ----------
  #village(t) {
    const d = this.d;
    TREES.forEach(([x, sc, seed], i) => {
      const k = pop(range(t, 0.6 + i * 0.18, 1.7 + i * 0.18));
      if (k < 0.01) return;
      const s = sc * k;
      d.line([[x, GROUND], [x - 3, GROUND - 90 * s]], { width: 9 * s, color: '#8a5a33', seed });
      d.circle(x, GROUND - 120 * s, 58 * s, '#5bb65a', { seed: seed + 1 });
      d.circle(x - 38 * s, GROUND - 92 * s, 36 * s, '#4aa04e', { seed: seed + 2 });
      d.circle(x + 40 * s, GROUND - 98 * s, 34 * s, '#6cc46a', { seed: seed + 3 });
    });
    HOUSES.forEach(([x, sc, roof, seed], i) => {
      const k = pop(range(t, 1.0 + i * 0.25, 2.1 + i * 0.25));
      if (k < 0.01) return;
      const s = sc * k, w = 120 * s, h = 90 * s, y = GROUND;
      d.shape([[x - w / 2, y], [x - w / 2, y - h], [x + w / 2, y - h], [x + w / 2, y]], '#f3d7a6', { seed });
      d.shape([[x - w / 2 - 18 * s, y - h], [x, y - h - 70 * s], [x + w / 2 + 18 * s, y - h]], roof, { seed: seed + 1 });
      d.shape([[x - 16 * s, y], [x - 16 * s, y - 46 * s], [x + 16 * s, y - 46 * s], [x + 16 * s, y]], '#9c6b43', { seed: seed + 2 });
      d.shape([[x + 26 * s, y - 62 * s], [x + 26 * s, y - 40 * s], [x + 48 * s, y - 40 * s], [x + 48 * s, y - 62 * s]], '#a9d8f5', { seed: seed + 3 });
    });
    FLOWERS.forEach(([x, col, seed], i) => {
      const grow = pop(range(t, 1.6 + i * 0.07, 2.4 + i * 0.07)) * (1 - 0.35 * this.d.dull);
      if (grow < 0.01) return;
      const h = 34 * grow, y = GROUND + 4;
      const droop = this.d.dull * 10;
      d.line([[x, y], [x + droop * 0.3, y - h * 0.6], [x + droop, y - h]], { width: 2.4, color: '#4aa04e', seed });
      d.circle(x + droop, y - h, 9 * grow, col, { seed: seed + 1, width: 1.8 });
    });
  }

  // ---------- tanah ----------
  #ground(t) {
    const d = this.d;
    const k = range(t, 0, 1.2);
    const pts = [];
    for (let x = -400; x <= 2000; x += 40) pts.push([x, GROUND + hash(x) * 3]);
    d.line(pts, { progress: k, width: 3, seed: 5 });
    if (k > 0.5) {
      for (let i = 0; i < 26; i++) {
        const x = -300 + i * 88 + hash(i + 3) * 20;
        d.line([[x, GROUND], [x + 6, GROUND - 14], [x + 10, GROUND]], { width: 2, color: '#4aa04e', seed: 100 + i, alpha: 1 - d.dull * 0.4 });
      }
    }
  }

  // Penampang tanah di bawah garis tanah (terlihat saat kamera turun).
  #soil(t) {
    if (t < 14.5 || t > 23.5) return;
    const d = this.d;
    const dull = d.dull;
    d.dull = dull * 0.35;
    const bands = [['#b9874f', GROUND, GROUND + 170], ['#a06f3d', GROUND + 170, GROUND + 360], ['#86592f', GROUND + 360, GROUND + 1000]];
    bands.forEach(([col, y0, y1], i) => {
      const top = [];
      for (let x = -300; x <= 1900; x += 60) top.push([x, y0 + (i ? hash(x + i) * 14 : 0)]);
      d.fill([...top, [1900, y1], [-300, y1]], col, { seed: 200 + i, alpha: 0.8, angle: -0.4, gap: 6 });
    });
    // Akar dari pohon & batu kerikil.
    TREES.forEach(([x], i) => {
      const pts = [[x, GROUND]];
      for (let k = 1; k < 7; k++) pts.push([x + hash(i * 9 + k) * 40 * k * 0.5, GROUND + k * 38]);
      d.line(pts, { width: 3.2, color: '#6b4423', seed: 220 + i });
      d.line([pts[2], [pts[2][0] + 60, pts[2][1] + 40]], { width: 2, color: '#6b4423', seed: 230 + i });
    });
    for (let i = 0; i < 18; i++) {
      const x = -200 + i * 120 + hash(i + 40) * 40, y = GROUND + 90 + Math.abs(hash(i + 60)) * 560;
      d.circle(x, y, 10 + Math.abs(hash(i)) * 12, '#c9b8a0', { seed: 240 + i, width: 1.8 });
    }
    // Lorong cacing tempat Cing bersedih.
    d.shape(ellipsePts(800, 1080, 230, 120, 30), '#5e3f22', { seed: 260, alpha: 0.7 });
    // Butiran mikroplastik berkelip di dalam tanah (plastik tidak ikut kusam).
    d.dull = 0;
    for (let i = 0; i < 60; i++) {
      const x = -150 + Math.abs(hash(i * 3.3)) * 1900, y = GROUND + 40 + Math.abs(hash(i * 7.1)) * 640;
      const tw = 0.6 + 0.4 * Math.sin(t * 4 + i);
      d.dot(x, y, 4.5 * tw, SHARD_COLORS[i % SHARD_COLORS.length], 280 + i);
    }
    d.dull = dull;
  }

  // ---------- sampah ----------
  #trash(t) {
    TRASH.forEach(([x, kind, t0, rot], i) => {
      if (t < t0) return;
      // Botol utama pecah di adegan 3.
      if (i === 0 && t > 13.4) return;
      // Dibersihkan (pop hilang) di akhir.
      const gone = range(t, 22.3 + i * 0.12, 22.6 + i * 0.12);
      if (gone >= 1) return;
      const fall = clamp01((t - t0) / 0.7);
      const y = GROUND - 22 - (1 - fall * fall) * 700;
      const bounce = Math.sin(clamp01((t - t0 - 0.7) / 0.5) * Math.PI) * 30 * (fall >= 1 ? 1 : 0);
      const r = lerp(rot + 3, rot, fall);
      const c = this.ctx;
      c.save();
      c.translate(x, y - bounce);
      c.rotate(r);
      c.scale(1 - gone, 1 - gone);
      if (kind === 'bottle') this.#bottle(i * 10, i === 0 ? t : 0);
      else if (kind === 'bag') this.#bag(i * 10);
      else this.#foam(i * 10);
      c.restore();
    });
  }

  // Botol PET berdiri di (0,0), tinggi ±110. t > 0 hanya untuk botol utama (pudar & retak).
  #bottle(seed, t) {
    const d = this.d;
    const fade = range(t, 10.8, 12.2);
    const body = [[-24, 50], [-24, -10], [-14, -34], [-9, -50], [9, -50], [14, -34], [24, -10], [24, 50]];
    d.shape(body, fade > 0 ? '#d5dde3' : '#aed6f2', { seed: seed + 1, width: 2.4, alpha: 0.75 - fade * 0.25 });
    d.shape([[-24, 0], [24, 0], [24, 22], [-24, 22]], fade > 0 ? '#b8c3cc' : '#3d8fe0', { seed: seed + 2, width: 2 });
    d.shape([[-10, -50], [-10, -62], [10, -62], [10, -50]], '#2f6fc4', { seed: seed + 3, width: 2 });
    const crack = range(t, 11.8, 13.2);
    if (crack > 0) {
      const cracks = [[[2, -40], [-6, -18], [6, 0], [-4, 26], [5, 46]], [[-20, -6], [-8, 4], [-14, 18]], [[18, 12], [6, 22], [16, 38]]];
      cracks.forEach((pts, i) => d.line(pts, { width: 2.4, seed: seed + 20 + i, progress: clamp01(crack * 1.6 - i * 0.3) }));
      // Retak bergetar sebelum pecah.
      if (t > 12.6) this.ctx.translate(Math.sin(t * 60) * 1.5, 0);
    }
  }

  #bag(seed) {
    const d = this.d;
    d.shape([[-34, 30], [-40, -8], [-26, -30], [-14, -26], [-8, -44], [8, -44], [14, -26], [28, -30], [40, -6], [32, 30]], '#ffffff', { seed: seed + 1, width: 2.4 });
    d.line([[-24, -2], [24, -2]], { color: '#ef6f6f', width: 6, seed: seed + 2 });
  }

  #foam(seed) {
    const d = this.d;
    d.shape([[-46, 26], [-46, -6], [46, -6], [46, 26]], '#fbfbf7', { seed: seed + 1, width: 2.4 });
    d.shape([[-46, -6], [-36, -26], [36, -26], [46, -6]], '#ecece4', { seed: seed + 2, width: 2.2 });
  }

  // Panas & hujan bergantian (adegan 3).
  #weather(t) {
    const d = this.d;
    const k = range(t, 10.0, 10.6) * (1 - range(t, 13.2, 13.8));
    if (k <= 0) return;
    const phase = Math.floor((t - 10) / 0.8) % 2;
    if (phase === 0) {
      for (let i = 0; i < 6; i++) {
        const a = -Math.PI / 2 - 0.6 + i * 0.24;
        d.line([[880 + Math.cos(a) * 110, 470 + Math.sin(a) * 110], [880 + Math.cos(a) * 160, 470 + Math.sin(a) * 160]], { color: '#f29a52', width: 4, seed: 400 + i, alpha: k });
      }
    } else {
      for (let i = 0; i < 14; i++) {
        const x = 760 + (i * 23) % 260, y = 440 + ((t * 300 + i * 37) % 160);
        d.line([[x, y], [x - 6, y + 18]], { color: '#5b8fd6', width: 2.6, seed: 420 + i, alpha: k });
      }
    }
  }

  // Botol pecah → serpihan → mengecil jadi butiran → meresap ke tanah.
  #shards(t) {
    if (t < 13.4 || t > 16.2) return;
    const d = this.d;
    const dull = d.dull;
    d.dull = 0;
    const k = t - 13.4;
    for (let i = 0; i < 30; i++) {
      const a = hash(i * 1.3) * Math.PI;
      const v = 60 + Math.abs(hash(i * 2.7)) * 120;
      const burst = 1 - Math.exp(-k * 4);
      let x = 880 + Math.cos(a) * v * burst;
      let y = GROUND - 30 - Math.abs(Math.sin(a)) * v * 0.7 * burst + Math.max(0, k - 0.6) ** 2 * 120;
      const size = Math.max(2.5, 14 * (1 - k / 2.4)) * (0.6 + Math.abs(hash(i)) * 0.6);
      if (y > GROUND + 160) continue;
      d.circle(x, y, size, SHARD_COLORS[i % SHARD_COLORS.length], { seed: 500 + i, width: 1.6 });
    }
    d.dull = dull;
  }

  // ---------- Cing ----------
  #cing(t) {
    let x, y, mood, s = 1, show = true, hop = 0;
    if (t < 9.8) {
      x = 760; y = GROUND;
      const peek = ease(range(t, 1.6, 2.4));
      hop = t > 3.0 && t < 3.8 ? Math.sin(range(t, 3.0, 3.8) * Math.PI) * 60 : 0;
      mood = t < 5.4 ? 'happy' : 'worried';
      this.#cingDraw(x, y - hop, 1, mood, t, peek);
      // Lubang tanah tempat Cing muncul.
      this.d.shape(ellipsePts(x, GROUND + 4, 46, 10, 16), '#8a5a33', { seed: 600, width: 2.2 });
      return;
    }
    if (t > 15.6 && t < 22.2) {
      x = 800; y = 1135; mood = 'sad'; s = 1.6;
    } else if (t >= 22.2) {
      x = 800; y = GROUND; mood = 'excited'; s = 1.15;
      const ph = (t - 22.6) / 0.7;
      hop = ph > 0 ? Math.abs(Math.sin(ph * Math.PI)) * 70 : 0;
    } else show = false;
    if (show) this.#cingDraw(x, y - hop, s, mood, t, 1);
  }

  // Cing: badan cacing pink melengkung + kepala, topi daun, ekspresi. peek 0..1 = keluar dari lubang.
  #cingDraw(x, y, s, mood, t, peek) {
    const d = this.d;
    const c = this.ctx;
    // Cing tidak ikut kusam; kesedihannya ditunjukkan lewat ekspresi.
    const dull = d.dull;
    d.dull = 0;
    c.save();
    c.translate(x, y);
    c.scale(s, s);
    // Saat mengintip, potong di garis tanah supaya terlihat keluar dari lubang.
    if (peek < 1) {
      c.beginPath();
      c.rect(-120, -260, 240, 264);
      c.clip();
      c.translate(0, (1 - peek) * 150);
    }
    const sway = Math.sin(t * 3) * 6;
    const body = [[-56, 0], [-46, -22], [-22, -30], [0, -18], [14, -40], [10, -70], [4, -92]].map(([bx, by], i) => [bx + (i < 2 ? sway : 0), by]);
    if (mood === 'sad') body.forEach((p) => { p[1] *= 0.8; });
    // Badan: garis tebal tinta lalu pink di atasnya.
    d.line(body, { width: 40, color: INK, wobble: 1, seed: 700 });
    d.line(body, { width: 33, color: '#f4a7b9', wobble: 1, seed: 701 });
    for (let i = 1; i < body.length - 1; i++) {
      const [bx, by] = body[i];
      d.line([[bx - 10, by - 6], [bx + 10, by + 6]], { width: 1.8, color: '#d9708a', seed: 710 + i });
    }
    const [hx, hy] = body[body.length - 1];
    const headY = hy - 26;
    d.circle(hx, headY, 38, '#f7b4c4', { seed: 720, width: 3 });
    // Topi daun.
    const tilt = mood === 'sad' ? 10 : 0;
    d.shape([[hx - 40, headY - 26 + tilt], [hx - 6, headY - 58], [hx + 34, headY - 44], [hx + 6, headY - 24]], '#5bb65a', { seed: 730, width: 2.4 });
    d.line([[hx - 30, headY - 30 + tilt * 0.6], [hx + 22, headY - 44]], { width: 1.8, seed: 731 });
    // Mata, pipi, mulut.
    const ey = headY - 4 + (mood === 'sad' ? 4 : 0);
    for (const ex of [hx - 14, hx + 14]) {
      d.dot(ex, ey, 7.5, INK, 740 + ex);
      d.dot(ex + 2.5, ey - 3, 2.6, '#ffffff', 742 + ex);
    }
    d.dot(hx - 26, headY + 10, 6, '#ef6f8e', 744);
    d.dot(hx + 26, headY + 10, 6, '#ef6f8e', 745);
    const my = headY + 16;
    if (mood === 'sad') {
      d.line([[hx - 9, my + 4], [hx, my - 1], [hx + 9, my + 4]], { width: 2.6, seed: 750 });
      const drop = ((t * 1.2) % 1);
      d.circle(hx - 16, ey + 12 + drop * 26, 4.5, '#7fb8ef', { seed: 751, width: 1.4 });
    } else if (mood === 'worried') {
      d.line([[hx - 8, my + 2], [hx + 8, my + 2]], { width: 2.6, seed: 752 });
    } else {
      const big = mood === 'excited' ? 1.4 : 1;
      d.shape([[hx - 11 * big, my - 2], [hx, my + 9 * big], [hx + 11 * big, my - 2]], '#c94b6a', { seed: 753, width: 2.4 });
    }
    // Garis "senang" di sekitar kepala saat semangat.
    if (mood === 'excited') {
      for (let i = 0; i < 3; i++) {
        const a = -0.4 - i * 0.45;
        d.line([[hx + Math.cos(a) * 54, headY + Math.sin(a) * 54], [hx + Math.cos(a) * 70, headY + Math.sin(a) * 70]], { width: 3, color: '#f7b733', seed: 760 + i });
      }
    }
    c.restore();
    d.dull = dull;
  }

  // ---------- akhir: logo ----------
  #finale(t) {
    const k = pop(range(t, 24.6, 25.6));
    if (k < 0.01 || !this.logo.complete) return;
    const c = this.ctx;
    const w = Math.min(this.cw * 0.42, 560) * k;
    const h = w * (this.logo.naturalHeight / this.logo.naturalWidth);
    c.save();
    c.translate(this.cw / 2, this.ch * 0.26);
    c.rotate((1 - k) * -0.2);
    c.drawImage(this.logo, -w / 2, -h / 2, w, h);
    c.restore();
  }

  // ---------- teks narasi (tulisan tangan) ----------
  #caption(t) {
    const i = OPENING_CAPTIONS.findIndex(([a, b]) => t >= a && t <= b + 0.4);
    if (i < 0) return;
    const [a, b] = OPENING_CAPTIONS[i];
    const alpha = Math.min(range(t, a, a + 0.35), 1 - range(t, b, b + 0.4));
    const c = this.ctx;
    const text = tr('opening.lines')[i];
    const size = Math.max(18, Math.min(40, this.cw * 0.028));
    c.save();
    c.globalAlpha = alpha;
    c.font = `${size}px "Patrick Hand", "Baloo 2", cursive`;
    c.textAlign = 'center';
    c.textBaseline = 'alphabetic';
    c.fillStyle = INK;
    const lines = text.split('\n');
    lines.forEach((ln, k) => c.fillText(ln, this.cw / 2, this.ch - size * (0.9 + (lines.length - 1 - k) * 1.2)));
    c.restore();
  }
}
