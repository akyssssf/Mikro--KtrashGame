// Opening v2 — cerita gaya krayon & pensil, digambar real-time (canvas 2D), sinkron dengan narasi 28 dtk.
//  0–5    Desa subur: kamera menyusuri desa, Cing mengintip dari tanah, celingukan, lalu merayap.
//  5–9.8  Sampah berjatuhan, langit ditelan coretan kelabu, botol jatuh tepat di depan Cing (kaget!).
//  9.8–16 Kamera mendekat ke botol; siang–malam berganti cepat (waktu berlalu); botol pudar, retak,
//         remuk jadi kepingan → kaca pembesar: "mikroplastik!".
//  16–22  Kamera menyelam ke dalam tanah: Cing & teman-teman (semut, kumbang, siput) kesulitan.
//  22–28  Naik lagi; coretan warna menyapu, sampah lenyap, pakis tumbuh, semua bersorak, logo.
import { Brush, clamp01, easeInOut, easeOut, ellipsePts, hash, INK, lerp, paperTexture, pop, range } from './brush.js';
import { drawAnt, drawBeetle, drawButterfly, drawCing, drawDragonfly, drawSnail } from './characters.js';
import {
  drawBag, drawBottle, drawCloud, drawCup, drawFern, drawFlower, drawFoam, drawFragment, drawGrass, drawHill,
  drawHouse, drawMoon, drawSun, drawTree, PLASTIC_COLORS,
} from './props.js';
import { TEXT } from '../../data/dialogs.id.js';

export const OPENING_LENGTH = 28;
const W = 1600;
const H = 900;
const G = 640; // garis tanah
const BOTTLE_X = 1820;
const CAPTIONS = [[0.27, 3.7], [5.0, 8.4], [9.87, 16.0], [16.07, 19.9], [22.0, 26.9]];

// ---------- tata letak dunia (x dunia) ----------
const HOUSES = [[260, 1.25, '#e9853a', 11, 1], [640, 1.0, '#d9663a', 12, 0], [1330, 1.15, '#e98f3a', 13, 1], [2380, 1.2, '#d9663a', 14, 1], [2760, 0.95, '#e9853a', 15, 0]];
const TREES = [[60, 1.2, 21, 'round'], [470, 0.95, 22, 'pine'], [1010, 1.15, 23, 'round'], [1120, 0.85, 24, 'pine'], [1600, 1.1, 25, 'round'],
  [2120, 1.3, 26, 'round'], [2560, 0.9, 27, 'pine'], [2980, 1.2, 28, 'round']];
const FLOWERS = Array.from({ length: 30 }, (_, i) => [-100 + i * 115 + hash(i) * 40, ['#ef6f8e', '#f7c948', '#7fb8ef', '#f29a52', '#c48af0'][i % 5], 30 + Math.abs(hash(i + 9)) * 16, 300 + i * 7]);
const GRASS = Array.from({ length: 60 }, (_, i) => [-200 + i * 62 + hash(i + 3) * 20, 500 + i * 3]);
// Sampah: [x, jenis, waktu jatuh, rotasi akhir]. Botol utama di BOTTLE_X.
const TRASH = [[1380, 'bag', 5.3, 0.15], [2050, 'foam', 5.6, -0.08], [1560, 'cup', 5.9, -0.3], [BOTTLE_X, 'bottle', 6.35, 0],
  [2280, 'bottle', 6.7, 1.45], [1180, 'foam', 7.0, 0.1], [2500, 'bag', 7.3, -0.2], [1950, 'cup', 7.6, 0.4], [2700, 'bottle', 7.9, -1.4]];
const FERNS = [[1420, 120, 701, 23.1], [1700, 150, 702, 23.4], [2000, 130, 703, 23.25], [2240, 110, 704, 23.6], [1530, 90, 705, 23.8]];

// ---------- kamera ----------
function camera(t) {
  // Menyusuri desa ke kanan.
  let x = lerp(820, 1240, easeInOut(range(t, 0, 4.8)));
  x = lerp(x, 1660, easeInOut(range(t, 4.8, 9.4)));
  let y = 385, z = 1;
  // Mendekat ke botol.
  const zin = easeInOut(range(t, 9.5, 11.3));
  x = lerp(x, BOTTLE_X + 30, zin); y = lerp(y, G - 95, zin); z = lerp(z, 2.35, zin);
  // Sedikit mundur saat botol remuk agar kepingan terlihat.
  z = lerp(z, 1.9, easeInOut(range(t, 13.3, 14.2)));
  // Menyelam ke dalam tanah.
  const dive = easeInOut(range(t, 15.3, 17.1));
  x = lerp(x, 1780, dive); y = lerp(y, 1085, dive); z = lerp(z, 1.05, dive);
  x += Math.sin(t * 0.35) * 18 * range(t, 17, 18);
  // Naik lagi ke permukaan.
  const up = easeInOut(range(t, 21.4, 23.1));
  x = lerp(x, 1800, up); y = lerp(y, 385, up); z = lerp(z, 1, up);
  // Getar kecil saat botol menghantam tanah.
  const shake = Math.max(0, 1 - Math.abs(t - 6.75) * 5) * 7;
  x += Math.sin(t * 90) * shake; y += Math.cos(t * 77) * shake;
  return { x, y, z };
}

// Seberapa kusam dunia (0 = segar, 1 = kelabu).
const dullness = (t) => 0.82 * easeInOut(range(t, 5.4, 8.6)) * (1 - easeInOut(range(t, 22.05, 23.3)));
// Siang/malam cepat (waktu berlalu) saat botol diperbesar: 0 = siang, 1 = malam.
const night = (t) => (t < 10.8 || t > 13.4 ? 0 : 0.5 - 0.5 * Math.cos(((t - 10.8) / 0.65) * Math.PI));

export class OpeningScene {
  // size: ukuran tetap {w, h, dpr} (render video); tanpa size = mengikuti jendela.
  constructor(canvas, { logoSrc, size } = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.b = new Brush(this.ctx);
    this.size = size;
    this.logo = new Image();
    this.logo.src = logoSrc ?? `${import.meta.env.BASE_URL}logo.png`;
  }

  resize() {
    // Dibatasi 1.5: krayon tetap halus, tapi ringan di HP.
    const dpr = this.size?.dpr ?? Math.min(window.devicePixelRatio, 1.5);
    this.cw = this.size?.w ?? window.innerWidth;
    this.ch = this.size?.h ?? window.innerHeight;
    this.canvas.width = Math.round(this.cw * dpr);
    this.canvas.height = Math.round(this.ch * dpr);
    this.dpr = dpr;
    this.fit = Math.max(this.cw / W, this.ch / H) * 0.98;
    this.paper = paperTexture(Math.ceil(this.cw), Math.ceil(this.ch));
  }

  // Buat semua tekstur krayon lebih dulu supaya frame pertama tidak tersendat.
  warmUp() {
    for (const t of [2, 7, 12, 14.5, 18, 24, 25.5]) this.draw(t);
  }

  #world(cam, par = 1) {
    const c = this.ctx;
    const s = this.fit * cam.z;
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    c.translate(this.cw / 2, this.ch / 2);
    c.scale(s, s);
    c.translate(-cam.x * par, -cam.y);
  }

  #screen() { this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); }

  draw(t) {
    const { ctx: c, b } = this;
    b.setTime(t);
    this.#screen();
    c.drawImage(this.paper, 0, 0, this.cw, this.ch);
    const cam = camera(t);
    const dull = dullness(t);
    const nt = night(t);

    // ---- lapisan latar (ikut kusam) ----
    this.#world(cam, 0.45);
    this.#farHills(t);
    this.#world(cam, 0.7);
    this.#clouds(t);
    this.#world(cam);
    this.#sunAndSky(t, cam);
    this.#village(t);
    this.#ground(t);
    this.#storm(t, cam);

    // Kusam: turunkan saturasi semua yang sudah digambar + sedikit kelabu.
    this.#screen();
    if (dull > 0.01) {
      c.save();
      c.globalCompositeOperation = 'saturation';
      c.fillStyle = `rgba(128,128,128,${dull})`;
      c.fillRect(0, 0, this.cw, this.ch);
      c.globalCompositeOperation = 'multiply';
      c.fillStyle = `rgba(190,190,200,${dull * 0.55})`;
      c.fillRect(0, 0, this.cw, this.ch);
      c.restore();
    }
    if (nt > 0.01) {
      c.save();
      c.globalCompositeOperation = 'multiply';
      c.fillStyle = `rgba(60,70,130,${nt * 0.7})`;
      c.fillRect(0, 0, this.cw, this.ch);
      c.restore();
    }

    // ---- lapisan depan (tetap berwarna: plastik & tokoh) ----
    this.#world(cam);
    // Tanah tidak ikut kelabu penuh (warnanya sendiri sudah lebih pucat).
    this.#soil(t);
    this.#trash(t);
    this.#crumbs(t);
    this.#friends(t);
    this.#cing(t);
    this.#flyers(t);
    this.#ferns(t);
    this.#sparkles(t);

    // ---- lapisan layar ----
    this.#screen();
    this.#timeDial(t);
    this.#colorWipe(t);
    this.#magnifier(t);
    this.#finale(t);
    this.#caption(t);
    this.#vignette();
    const fade = Math.max(1 - range(t, 0, 0.7), range(t, OPENING_LENGTH - 0.9, OPENING_LENGTH));
    if (fade > 0) {
      c.fillStyle = `rgba(245,237,220,${fade})`;
      c.fillRect(0, 0, this.cw, this.ch);
    }
  }

  // ---------- latar ----------
  #farHills(t) {
    const b = this.b;
    const k = easeOut(range(t, 0.2, 1.6));
    if (k <= 0) return;
    const lift = (1 - k) * 160;
    drawHill(b, 300, G + 10 + lift, 700, 210, '#bfe3a4', 31);
    drawHill(b, 1350, G + 10 + lift, 820, 250, '#a8d88f', 32);
    drawHill(b, 2500, G + 10 + lift, 760, 200, '#bfe3a4', 33);
    drawHill(b, 3400, G + 10 + lift, 700, 230, '#a8d88f', 34);
  }

  #clouds(t) {
    const b = this.b, c = this.ctx;
    for (let i = 0; i < 7; i++) {
      const k = pop(range(t, 0.6 + i * 0.15, 1.6 + i * 0.15));
      if (k <= 0.01) continue;
      const x = -200 + i * 520 + ((t * 14 + i * 90) % 220), y = 90 + (i % 3) * 55;
      c.save();
      c.translate(x, y);
      drawCloud(b, 0.75 * k + (i % 2) * 0.15, '#ffffff', 80 + i);
      c.restore();
    }
  }

  #sunAndSky(t, cam) {
    const b = this.b, c = this.ctx;
    const k = pop(range(t, 0.4, 1.5));
    if (k <= 0.01 || cam.y > 800) return;
    const cover = easeInOut(range(t, 6.2, 8.6)) * (1 - easeInOut(range(t, 22.2, 23.2)));
    c.save();
    c.translate(cam.x + 560 / cam.z, 130 + 40 * cover);
    c.scale(k * (1 - cover * 0.3), k * (1 - cover * 0.3));
    drawSun(b, t, 62, 40);
    c.restore();
    // Pelangi coretan saat harapan kembali.
    const rb = range(t, 23.0, 25.0);
    if (rb > 0) {
      ['#ef6f8e', '#f29a52', '#f7c948', '#8fd16a', '#7fb8ef', '#c48af0'].forEach((col, i) => {
        const r = 640 - i * 30;
        b.line(ellipsePts(1800, G - 4, r, r * 0.72, 44, Math.PI, Math.PI * 2), { color: col, width: 24, wobble: 2.4, seed: 60 + i, progress: easeOut(rb * 1.2 - i * 0.07), alpha: 0.7, taper: false });
      });
    }
  }

  #village(t) {
    const b = this.b, c = this.ctx;
    const droop = dullness(t);
    TREES.forEach(([x, s, seed, kind], i) => {
      const k = pop(range(t, 0.5 + i * 0.12, 1.6 + i * 0.12));
      if (k <= 0.01) return;
      c.save();
      c.translate(x, G);
      c.scale(1, k);
      drawTree(b, t, s, seed, kind);
      c.restore();
    });
    HOUSES.forEach(([x, s, roof, seed, smoke], i) => {
      const k = pop(range(t, 0.9 + i * 0.18, 2.0 + i * 0.18));
      if (k <= 0.01) return;
      c.save();
      c.translate(x, G);
      c.scale(k, k);
      drawHouse(b, t, s, roof, seed, smoke * (1 - droop));
      c.restore();
    });
    // Kolam kecil dengan riak.
    const pk = easeOut(range(t, 1.4, 2.2));
    if (pk > 0) {
      b.shape(ellipsePts(1180, G + 26, 100 * pk, 20 * pk, 24), '#7fc4ec', { seed: 90, width: 2.4, shadow: 0.1, light: 0.3 });
      for (let i = 0; i < 3; i++) {
        const x = 1140 + i * 30 + ((t * 30 + i * 20) % 24);
        b.line([[x, G + 22 + i * 6], [x + 18, G + 22 + i * 6]], { width: 1.8, color: '#ffffff', seed: 91 + i, taper: false });
      }
    }
    FLOWERS.forEach(([x, col, h, seed], i) => {
      const grow = pop(range(t, 1.5 + i * 0.04, 2.3 + i * 0.04));
      c.save();
      c.translate(x, G + 4);
      drawFlower(b, t, h, col, seed, grow * (1 - droop * 0.25), droop);
      c.restore();
    });
  }

  #ground(t) {
    const b = this.b, c = this.ctx;
    const k = range(t, 0, 1.4);
    const pts = [];
    for (let x = -300; x <= 3600; x += 50) pts.push([x, G + hash(x) * 2.5]);
    if (k > 0.2) {
      const band = pts.map(([x, y]) => [x, y - 6]).concat(pts.slice().reverse().map(([x, y]) => [x, y + 12]));
      b.fill(band, '#7cc66a', { seed: 95, shadow: 0 });
    }
    b.line(pts, { progress: k, width: 3.4, seed: 96, taper: false });
    if (k > 0.6) {
      GRASS.forEach(([x, seed]) => {
        c.save();
        c.translate(x, G);
        drawGrass(b, t, seed, dullness(t));
        c.restore();
      });
    }
  }

  // Penampang tanah (terlihat saat kamera menyelam).
  #soil(t) {
    if (t < 14.8 || t > 23.6) return;
    const b = this.b;
    const k = easeOut(range(t, 14.8, 16.2));
    const layers = [['#9c7b58', 0, 150], ['#86684b', 150, 330], ['#6f563f', 330, 900]];
    layers.forEach(([col, a, z], i) => {
      const top = [];
      for (let x = 600; x <= 3000; x += 70) top.push([x, G + 14 + a + (i ? hash(x * 0.3 + i) * 16 : 0)]);
      b.fill([...top, [3000, G + 14 + z], [600, G + 14 + z]], col, { seed: 200 + i, shadow: 0.12, alpha: k });
    });
    if (k < 0.5) return;
    // Akar pohon (layu).
    TREES.forEach(([x, , seed], i) => {
      if (x < 700 || x > 2900) return;
      const pts = [[x, G + 10]];
      for (let s = 1; s < 8; s++) pts.push([x + hash(seed * 3 + s) * 16 * s, G + 10 + s * 42]);
      b.line(pts, { width: 4.5, color: '#5b3a20', seed: 220 + i });
      b.line([pts[3], [pts[3][0] + 50, pts[3][1] + 46], [pts[3][0] + 70, pts[3][1] + 90]], { width: 2.6, color: '#5b3a20', seed: 230 + i });
      b.line([pts[5], [pts[5][0] - 46, pts[5][1] + 40]], { width: 2.2, color: '#5b3a20', seed: 240 + i });
    });
    for (let i = 0; i < 26; i++) {
      const x = 700 + i * 90 + hash(i + 40) * 30, y = G + 60 + Math.abs(hash(i + 60)) * 620;
      b.ellipse(x, y, 13 + Math.abs(hash(i)) * 10, 9 + Math.abs(hash(i + 1)) * 6, i % 3 ? '#cdbca2' : '#b7a284', { seed: 250 + i, width: 2, shadow: 0.2 });
    }
    // Lorong cacing.
    b.shape(ellipsePts(1780, 1150, 300, 120, 34), '#57381f', { seed: 270, width: 2.6, shadow: 0.2 });
    b.line([[1480, 1160], [1300, 1120], [1180, 1170]], { width: 46, color: '#57381f', seed: 271, taper: false });
    b.line([[2080, 1150], [2280, 1100], [2400, 1140]], { width: 46, color: '#57381f', seed: 272, taper: false });
  }

  // Coretan kelabu yang menelan langit.
  #storm(t, cam) {
    const k = range(t, 5.5, 8.7) * (1 - range(t, 21.9, 22.9));
    if (k <= 0 || cam.y > 800) return;
    const b = this.b;
    const left = cam.x - 980, right = cam.x + 980;
    for (let r = 0; r < 4; r++) {
      const p = clamp01(k * 1.25 - r * 0.12);
      if (p <= 0) continue;
      b.scribble(right - (right - left) * p, 20 + r * 70, right, 110 + r * 70, r % 2 ? '#7d7f8c' : '#5f6170', { seed: 600 + r, width: 22, rows: 2, alpha: 0.8 });
    }
  }

  // ---------- sampah ----------
  #trash(t) {
    const b = this.b, c = this.ctx;
    TRASH.forEach(([x, kind, t0, rot], i) => {
      if (t < t0 - 0.4) return;
      const main = x === BOTTLE_X && kind === 'bottle';
      if (main && t > 13.45) return;
      const gone = range(t, 22.5 + i * 0.1, 22.85 + i * 0.1);
      if (gone >= 1) return;
      const fall = clamp01((t - t0 + 0.4) / 0.55);
      const land = fall >= 1;
      const y = G + 2 - (1 - fall * fall) * 760;
      const since = t - t0 - 0.15;
      const bounce = land && since > 0 && since < 0.45 ? Math.sin((since / 0.45) * Math.PI) * 26 : 0;
      const spin = (1 - fall) * (3 + i);
      c.save();
      c.translate(x, y - bounce);
      if (!land) for (let k = 0; k < 3; k++) b.line([[-20 + k * 20, -150], [-20 + k * 20, -230]], { width: 2.2, seed: 650 + i * 3 + k, alpha: 0.6, taper: false });
      c.rotate(rot + spin);
      const sq = land && since > 0 && since < 0.18 ? 1 - Math.sin((since / 0.18) * Math.PI) * 0.18 : 1;
      c.scale((1 - gone) * (2 - sq), (1 - gone) * sq);
      if (kind === 'bottle') {
        const fade = main ? range(t, 10.9, 13.0) : 0;
        const crack = main ? range(t, 12.3, 13.35) : 0;
        if (main && t > 12.9) c.translate(Math.sin(t * 70) * 2.2, 0);
        drawBottle(b, 400 + i * 10, { fade, crack });
      } else if (kind === 'bag') drawBag(b, t, 400 + i * 10);
      else if (kind === 'foam') drawFoam(b, 400 + i * 10);
      else drawCup(b, 400 + i * 10);
      c.restore();
      if (land && since > 0 && since < 0.6) {
        for (let k = 0; k < 4; k++) {
          const e = since / 0.6;
          b.circle(x + (k - 1.5) * 26 * (1 + e * 1.5), G - 6 - e * 18, 8 * (1 - e) + 2, '#d8c9ad', { seed: 680 + i * 4 + k, width: 1.4, shadow: 0, alpha: 1 - e });
        }
      }
    });
  }

  // Botol remuk jadi kepingan yang mengecil dan meresap ke tanah.
  #crumbs(t) {
    if (t < 13.4 || t > 16.4) return;
    const b = this.b, c = this.ctx;
    const k = t - 13.4;
    for (let i = 0; i < 46; i++) {
      const a = -Math.PI / 2 + hash(i * 1.3) * 1.5;
      const v = 40 + Math.abs(hash(i * 2.7)) * 170;
      const burst = 1 - Math.exp(-k * 3.5);
      const x = BOTTLE_X + Math.cos(a) * v * burst;
      const y = G - 60 + Math.sin(a) * v * 0.55 * burst + Math.max(0, k - 0.7) ** 2 * 90;
      if (y > G + 120) continue;
      const size = Math.max(2.2, 13 * (1 - k / 2.6)) * (0.6 + Math.abs(hash(i)) * 0.6);
      c.save();
      c.translate(x, y);
      c.rotate(hash(i * 4.1) * 3 + k * hash(i) * 4);
      drawFragment(b, i % 3, size, PLASTIC_COLORS[i % PLASTIC_COLORS.length], 500 + i);
      c.restore();
    }
  }

  // ---------- tokoh ----------
  #cing(t) {
    const b = this.b, c = this.ctx;
    let x, y = G, o = { mood: 'happy' }, scale = 1.45, show = true, peek = 1;
    if (t < 9.7) {
      // Mengintip → celingukan → lompat senang → merayap → kaget → cemas.
      peek = easeOut(range(t, 1.0, 1.8));
      const crawl = range(t, 3.3, 6.1);
      x = lerp(930, 1640, easeInOut(crawl));
      o.crawl = crawl > 0 && crawl < 1 ? t * 9 : 0;
      o.look = t < 2.6 ? Math.sin(t * 4) : t > 6.1 ? 1 : 0.6;
      o.blink = Math.max(0, 1 - Math.abs((t % 2.6) - 2.3) * 9);
      const hop = range(t, 2.6, 3.2);
      y -= hop > 0 && hop < 1 ? Math.sin(hop * Math.PI) * 70 : 0;
      o.hat = hop > 0 && hop < 1 ? Math.sin(hop * Math.PI * 2) * 0.35 : 0;
      if (t > 6.55) {
        o.mood = t < 7.4 ? 'shocked' : 'worried';
        const jump = range(t, 6.6, 7.0);
        y -= jump > 0 && jump < 1 ? Math.sin(jump * Math.PI) * 50 : 0;
        x -= easeOut(range(t, 6.6, 7.0)) * 60;
        o.hat = jump > 0 && jump < 1 ? -0.4 * Math.sin(jump * Math.PI) : 0;
      }
    } else if (t > 15.5 && t < 22.6) {
      x = 1780; y = 1192; scale = 1.7; o = { mood: 'sad', cough: t > 18.2 && t < 20.5 };
      o.blink = Math.max(0, 1 - Math.abs(((t * 0.8) % 3) - 2.6) * 8);
    } else if (t >= 22.6) {
      x = 1800; scale = 1.5; o.mood = 'excited';
      peek = easeOut(range(t, 22.6, 23.1) * 1.3);
      const ph = Math.max(0, t - 23.2) * 2.4;
      y -= t > 23.2 ? Math.abs(Math.sin(ph * Math.PI * 0.5)) * 80 : 0;
      o.hat = Math.sin(ph * Math.PI) * 0.3;
    } else show = false;
    if (!show) return;
    c.save();
    c.translate(x, y);
    c.scale(scale, scale);
    if (peek < 1) {
      // Keluar dari lubang: potong di garis tanah.
      c.save();
      c.beginPath();
      c.rect(-200, -400, 400, 404);
      c.clip();
      c.translate(0, (1 - peek) * 220);
      drawCing(b, t, o);
      c.restore();
    } else drawCing(b, t, o);
    c.restore();
    if (t < 9.7 && peek < 1) b.shape(ellipsePts(930, G + 6, 80, 16, 18), '#7a4e2c', { seed: 990, width: 2.6 });
  }

  #friends(t) {
    const b = this.b, c = this.ctx;
    const under = t > 16.0 && t < 22.6;
    const above = t >= 22.9;
    if (!under && !above) return;
    const list = under
      ? [['ant', 1400 + (t - 16) * 22, 1180, 1.8], ['beetle', 2170, 1165, 1.8], ['snail', 1230, 1178, 1.7]]
      : [['ant', 1560, G, 1.5], ['beetle', 2060, G, 1.6], ['snail', 2260, G, 1.5]];
    list.forEach(([kind, x, y, s], i) => {
      const k = under ? easeOut(range(t, 16.4 + i * 0.3, 17.1 + i * 0.3)) : pop(range(t, 23.1 + i * 0.2, 23.8 + i * 0.2));
      if (k <= 0.01) return;
      const hop = above ? Math.abs(Math.sin((t - 23.3 - i * 0.2) * 5)) * 30 : 0;
      c.save();
      c.translate(x, y - hop);
      c.scale(s * k, s * k);
      if (kind === 'ant') drawAnt(b, t, { sad: under, carry: under ? '#6fb6f0' : null, walk: under ? t : t * 2 });
      else if (kind === 'beetle') drawBeetle(b, t, { sad: under });
      else drawSnail(b, t, { sad: under });
      c.restore();
    });
  }

  #flyers(t) {
    const b = this.b, c = this.ctx;
    if (t < 6.5) {
      const k = range(t, 0.8, 6.5);
      c.save();
      c.translate(lerp(700, 1900, k) + Math.sin(t * 2) * 40, 330 + Math.sin(t * 3.1) * 40);
      c.rotate(Math.sin(t * 2) * 0.15);
      drawDragonfly(b, t, 1500);
      c.restore();
    }
    if (t > 23.4) {
      ['#f7c948', '#ef8fb0', '#7fb8ef'].forEach((col, i) => {
        const k = t - 23.4 - i * 0.4;
        if (k < 0) return;
        c.save();
        c.translate(1500 + i * 220 + Math.sin(k * 1.4 + i) * 90, 470 - k * 30 + Math.sin(k * 3 + i) * 24);
        drawButterfly(b, t, col, 1600 + i * 10);
        c.restore();
      });
    }
  }

  #ferns(t) {
    const b = this.b, c = this.ctx;
    for (const [x, h, seed, t0] of FERNS) {
      const p = easeOut(range(t, t0, t0 + 1.6));
      if (p <= 0) continue;
      c.save();
      c.translate(x, G + 4);
      drawFern(b, t, h, seed, p);
      c.restore();
    }
  }

  // Butiran plastik berkelip di dalam tanah + kilau saat sampah dibersihkan.
  #sparkles(t) {
    const b = this.b, c = this.ctx;
    if (t > 15.6 && t < 23.4) {
      for (let i = 0; i < 70; i++) {
        const x = 900 + Math.abs(hash(i * 3.3)) * 1800, y = G + 40 + Math.abs(hash(i * 7.1)) * 640;
        const tw = 0.55 + 0.45 * Math.sin(t * 5 + i);
        c.save();
        c.translate(x, y);
        c.rotate(i);
        drawFragment(b, i % 3, 5.5 * tw + 2, PLASTIC_COLORS[i % PLASTIC_COLORS.length], 800 + i);
        c.restore();
      }
    }
    TRASH.forEach(([x], i) => {
      const k = range(t, 22.5 + i * 0.1, 23.1 + i * 0.1);
      if (k <= 0 || k >= 1) return;
      for (let s = 0; s < 6; s++) {
        const a = (s / 6) * Math.PI * 2;
        const r = 20 + k * 60;
        const st = [[0, -10], [3, -3], [10, 0], [3, 3], [0, 10], [-3, 3], [-10, 0], [-3, -3]].map(([px, py]) => [x + Math.cos(a) * r + px * (1 - k), G - 40 + Math.sin(a) * r + py * (1 - k)]);
        b.shape(st, '#f7c948', { seed: 850 + i * 6 + s, width: 1.6, shadow: 0, alpha: 1 - k });
      }
    });
  }

  // ---------- lapisan layar ----------
  // Matahari & bulan bergantian melintas (waktu berlalu) saat botol diperbesar.
  #timeDial(t) {
    if (t < 10.6 || t > 13.6) return;
    const b = this.b, c = this.ctx;
    const k = range(t, 10.6, 10.9) * (1 - range(t, 13.3, 13.6));
    const cyc = (t - 10.8) / 1.3;
    const ph = cyc - Math.floor(cyc);
    const isNight = Math.floor(cyc * 2) % 2 === 1;
    const a = Math.PI + ((ph * 2) % 1) * Math.PI;
    const cx = this.cw * 0.5 + Math.cos(a) * this.cw * 0.38, cy = this.ch * 0.62 + Math.sin(a) * this.ch * 0.5;
    c.save();
    c.globalAlpha = k;
    c.translate(cx, cy);
    const s = Math.min(this.cw, this.ch) / 900;
    c.scale(s, s);
    if (isNight) drawMoon(b, 46, 1700); else drawSun(b, t, 44, 1710);
    c.restore();
    if (t > 10.8) {
      const years = (Math.floor((t - 10.8) / 0.65) + 1) * 50;
      this.#hand(TEXT.opening.timePassing.replace('{n}', String(years)), this.cw * 0.5, this.ch * 0.14, Math.min(40, this.cw * 0.03), k);
    }
  }

  // Coretan warna yang menyapu layar dan mengembalikan warna dunia.
  #colorWipe(t) {
    const k = range(t, 21.9, 23.4);
    if (k <= 0 || k >= 1) return;
    const b = this.b;
    const fadeOut = 1 - range(t, 23.0, 23.4);
    const cols = ['#8fd16a', '#f7c948', '#ef8fb0', '#7fb8ef', '#f29a52'];
    cols.forEach((col, i) => {
      const y0 = (i / cols.length) * this.ch - 30, y1 = y0 + this.ch / cols.length + 60;
      b.scribble(-60, y0, -60 + (this.cw + 160) * easeOut(k * 1.3 - i * 0.06), y1, col, { seed: 1800 + i, width: Math.max(26, this.ch * 0.05), rows: 2, alpha: 0.85 * fadeOut });
    });
  }

  // Kaca pembesar: "mikroplastik!" (lebih kecil dari 5 mm).
  #magnifier(t) {
    const k = pop(range(t, 13.9, 14.6)) * (1 - easeInOut(range(t, 15.4, 15.9)));
    if (k <= 0.01) return;
    const b = this.b, c = this.ctx;
    const R = Math.min(this.cw, this.ch) * 0.24;
    const cx = this.cw * 0.63, cy = this.ch * 0.42;
    c.save();
    c.translate(cx, cy);
    c.scale(k, k);
    c.rotate((1 - k) * 0.4);
    b.line([[R * 0.72, R * 0.72], [R * 1.25, R * 1.25]], { width: R * 0.16, color: '#8a5a33', seed: 1900, taper: false });
    b.line([[R * 0.72, R * 0.72], [R * 1.25, R * 1.25]], { width: 3, seed: 1901, taper: false });
    c.save();
    c.beginPath();
    c.arc(0, 0, R, 0, Math.PI * 2);
    c.clip();
    c.fillStyle = '#fbf6ea';
    c.fillRect(-R, -R, R * 2, R * 2);
    for (let i = 0; i < 26; i++) {
      const x = hash(i * 2.1) * R * 0.85 + Math.sin(t * 0.8 + i) * 6, y = hash(i * 5.3) * R * 0.85 + Math.cos(t * 0.7 + i) * 6;
      c.save();
      c.translate(x, y);
      c.rotate(i + t * 0.3 * hash(i));
      drawFragment(b, i % 3, R * (0.05 + Math.abs(hash(i * 9)) * 0.05), PLASTIC_COLORS[i % PLASTIC_COLORS.length], 1910 + i);
      c.restore();
    }
    c.restore();
    b.line(ellipsePts(0, 0, R, R, 40), { width: R * 0.07, color: '#c9a227', seed: 1950, taper: false });
    b.line(ellipsePts(0, 0, R, R, 40), { width: 3, seed: 1951, taper: false });
    b.line(ellipsePts(0, 0, R * 0.8, R * 0.8, 16, -2.6, -1.9), { width: 5, color: 'rgba(255,255,255,.9)', seed: 1952, taper: false });
    c.restore();
    const ax = cx - R * 1.1 * k, ay = cy - R * 0.25;
    b.line([[ax - R * 0.75, ay - R * 0.55], [ax - R * 0.35, ay - R * 0.15], [ax, ay]], { width: 3.2, seed: 1960, progress: range(t, 14.3, 14.8) });
    if (t > 14.75) {
      b.line([[ax - 16, ay - 4], [ax, ay], [ax - 6, ay - 18]], { width: 3.2, seed: 1961, taper: false });
      const fs = Math.min(46, this.cw * 0.034);
      this.#hand(TEXT.opening.microLabel, ax - R * 0.9, ay - R * 0.7, fs, range(t, 14.75, 15.0), '#d2453f');
      this.#hand(TEXT.opening.microNote, ax - R * 0.9, ay - R * 0.7 + fs * 1.05, fs * 0.62, range(t, 14.9, 15.2));
    }
  }

  #finale(t) {
    const k = pop(range(t, 24.6, 25.5));
    if (k <= 0.01 || !this.logo.complete) return;
    const b = this.b, c = this.ctx;
    const w = Math.min(this.cw * 0.34, 560) * k;
    const h = w * (this.logo.naturalHeight / this.logo.naturalWidth);
    const cx = this.cw / 2, cy = this.ch * 0.19;
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 + 0.2;
      const r0 = w * 0.42, r1 = w * (0.55 + (i % 2) * 0.08);
      b.line([[cx + Math.cos(a) * r0, cy + Math.sin(a) * r0 * 0.7], [cx + Math.cos(a) * r1, cy + Math.sin(a) * r1 * 0.7]], { width: 6, color: ['#f7c948', '#ef8fb0', '#8fd16a'][i % 3], seed: 2000 + i, taper: false });
    }
    c.save();
    c.translate(cx, cy);
    c.rotate((1 - k) * -0.25 + Math.sin(t * 2) * 0.01);
    c.drawImage(this.logo, -w / 2, -h / 2, w, h);
    c.restore();
  }

  #hand(text, x, y, size, alpha = 1, color = INK) {
    const c = this.ctx;
    c.save();
    c.globalAlpha = alpha;
    c.font = `${size}px "Patrick Hand", "Baloo 2", cursive`;
    c.textAlign = 'center';
    c.lineJoin = 'round';
    c.strokeStyle = 'rgba(245,237,220,.92)';
    c.lineWidth = size * 0.28;
    c.strokeText(text, x, y);
    c.fillStyle = color;
    c.fillText(text, x, y);
    c.restore();
  }

  #caption(t) {
    const i = CAPTIONS.findIndex(([a, b]) => t >= a && t <= b + 0.4);
    if (i < 0) return;
    const [a, b] = CAPTIONS[i];
    const alpha = Math.min(range(t, a, a + 0.35), 1 - range(t, b, b + 0.4));
    const size = Math.max(20, Math.min(44, this.cw * 0.03));
    const lines = TEXT.opening.lines[i].split('\n');
    lines.forEach((ln, k) => this.#hand(ln, this.cw / 2, this.ch - size * (0.85 + (lines.length - 1 - k) * 1.15), size, alpha));
  }

  #vignette() {
    const c = this.ctx;
    const g = c.createRadialGradient(this.cw / 2, this.ch / 2, Math.min(this.cw, this.ch) * 0.45, this.cw / 2, this.ch / 2, Math.max(this.cw, this.ch) * 0.75);
    g.addColorStop(0, 'rgba(120,90,50,0)');
    g.addColorStop(1, 'rgba(120,90,50,0.22)');
    c.fillStyle = g;
    c.fillRect(0, 0, this.cw, this.ch);
  }
}
