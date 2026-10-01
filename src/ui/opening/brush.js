// Kuas v2 untuk opening gaya krayon & pensil di canvas 2D.
// - Krayon: tekstur ribuan goresan pendek + pori kertas (dibuat sekali per warna, dipakai sebagai pattern).
// - Pensil: garis meruncing di ujung, dua tarikan, bergetar ("boil") 10x per detik seperti animasi tangan.
export const INK = '#26315f';
export const PAPER = '#f5eddc';
export const TAU = Math.PI * 2;

export function hash(n) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return (x - Math.floor(x)) * 2 - 1;
}
export const clamp01 = (x) => Math.max(0, Math.min(1, x));
export const lerp = (a, b, k) => a + (b - a) * k;
export const range = (t, a, b) => clamp01((t - a) / (b - a));
export const easeInOut = (x) => { x = clamp01(x); return x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2; };
export const easeOut = (x) => 1 - (1 - clamp01(x)) ** 3;
// Pegas "pop": 0 → lewat sedikit → 1.
export const pop = (x) => { x = clamp01(x); return x >= 1 ? 1 : 1 - Math.cos(x * Math.PI * 2.6) * Math.exp(-x * 6); };

function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16);
  const f = (c) => Math.max(0, Math.min(255, Math.round(k > 0 ? c + (255 - c) * k : c * (1 + k))));
  return `rgb(${f((n >> 16) & 255)},${f((n >> 8) & 255)},${f(n & 255)})`;
}

// ---------- tekstur krayon ----------
const patternCache = new Map();
function crayonTile(color) {
  const S = 192;
  const cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const c = cv.getContext('2d');
  let seed = 1;
  for (const ch of color) seed = (seed * 31 + ch.charCodeAt(0)) % 9973;
  const r = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  c.lineCap = 'round';
  // Goresan pendek miring, warna sedikit bervariasi (gelap/terang) seperti krayon asli.
  for (let i = 0; i < 1100; i++) {
    const x = r() * S, y = r() * S, len = 5 + r() * 16, a = -0.95 + (r() - 0.5) * 0.5;
    c.strokeStyle = shade(color, (r() - 0.55) * 0.35);
    c.globalAlpha = 0.35 + r() * 0.55;
    c.lineWidth = 1.2 + r() * 2.6;
    for (const ox of [0, -S, S]) for (const oy of [0, -S, S]) {
      if (x + ox < -20 || x + ox > S + 20 || y + oy < -20 || y + oy > S + 20) continue;
      c.beginPath();
      c.moveTo(x + ox, y + oy);
      c.lineTo(x + ox + Math.cos(a) * len, y + oy + Math.sin(a) * len);
      c.stroke();
    }
  }
  // Pori kertas: bintik bolong supaya kertas mengintip di antara goresan.
  c.globalCompositeOperation = 'destination-out';
  c.globalAlpha = 1;
  for (let i = 0; i < 1600; i++) {
    c.globalAlpha = 0.25 + r() * 0.6;
    c.fillRect(r() * S, r() * S, 1 + r() * 1.6, 1 + r() * 1.6);
  }
  return cv;
}
export function crayon(ctx, color) {
  let tile = patternCache.get(color);
  if (!tile) { tile = crayonTile(color); patternCache.set(color, tile); }
  return ctx.createPattern(tile, 'repeat');
}

export function paperTexture(w, h) {
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const c = cv.getContext('2d');
  c.fillStyle = PAPER;
  c.fillRect(0, 0, w, h);
  // Serat & bintik kertas.
  for (let i = 0; i < 9000; i++) {
    c.fillStyle = Math.random() < 0.5 ? 'rgba(120,96,60,.06)' : 'rgba(255,255,255,.16)';
    c.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 2, 1);
  }
  for (let i = 0; i < 60; i++) {
    c.strokeStyle = 'rgba(150,120,80,.05)';
    c.lineWidth = 1;
    c.beginPath();
    const y = Math.random() * h;
    c.moveTo(0, y);
    c.bezierCurveTo(w * 0.3, y + 20 * (Math.random() - 0.5), w * 0.6, y + 20 * (Math.random() - 0.5), w, y);
    c.stroke();
  }
  return cv;
}

export function ellipsePts(cx, cy, rx, ry, n = 24, a0 = 0, a1 = TAU) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
  }
  return pts;
}

// Bentuk "gumpal" (awan/daun) dari beberapa lingkaran — tepi bergelombang.
export function blobPts(cx, cy, r, n = 9, bump = 0.22, seed = 0) {
  const pts = [];
  const steps = n * 6;
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * TAU;
    const k = 1 + bump * Math.abs(Math.sin((a * n) / 2)) + hash(seed + Math.floor((i / steps) * n)) * 0.06;
    pts.push([cx + Math.cos(a) * r * k, cy + Math.sin(a) * r * k * 0.9]);
  }
  return pts;
}

export class Brush {
  constructor(ctx) {
    this.ctx = ctx;
    this.boil = 0;
  }

  setTime(t) { this.boil = Math.floor(t * 10); }
  j(seed) { return hash(seed * 1.37 + this.boil * 7.31); }

  #wob(pts, seed, w) {
    return pts.map(([x, y], i) => [x + this.j(seed + i * 1.7) * w, y + this.j(seed + i * 2.3 + 50) * w]);
  }

  path(pts, close) {
    const c = this.ctx;
    c.beginPath();
    c.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length - 1; i++) {
      c.quadraticCurveTo(pts[i][0], pts[i][1], (pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2);
    }
    c.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1]);
    if (close) c.closePath();
  }

  // Isian krayon + bayangan (sisi kanan-bawah lebih gelap) + sedikit keluar garis.
  fill(pts, color, { seed = 0, alpha = 1, shadow = 0.22, light = 0 } = {}) {
    const c = this.ctx;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const [x, y] of pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
    c.save();
    this.path(this.#wob(pts, seed + 300, 1.8), true);
    c.clip();
    c.globalAlpha = alpha * 0.55;
    c.fillStyle = color;
    c.fillRect(x0 - 6, y0 - 6, x1 - x0 + 12, y1 - y0 + 12);
    const pat = crayon(c, color);
    // Geser pattern per bentuk (dan per frame boil) supaya tidak terlihat berulang/kaku.
    pat.setTransform(new DOMMatrix([1, 0, 0, 1, hash(seed) * 90 + this.j(seed) * 2, hash(seed + 1) * 90]));
    c.globalAlpha = alpha;
    c.fillStyle = pat;
    c.fillRect(x0 - 6, y0 - 6, x1 - x0 + 12, y1 - y0 + 12);
    if (shadow > 0) {
      const g = c.createLinearGradient(x0, y0, x1, y1);
      g.addColorStop(0.45, 'rgba(40,30,60,0)');
      g.addColorStop(1, `rgba(40,30,60,${shadow})`);
      c.fillStyle = g;
      c.fillRect(x0 - 6, y0 - 6, x1 - x0 + 12, y1 - y0 + 12);
    }
    if (light > 0) {
      c.fillStyle = `rgba(255,255,255,${light})`;
      c.beginPath();
      c.ellipse(x0 + (x1 - x0) * 0.32, y0 + (y1 - y0) * 0.3, (x1 - x0) * 0.18, (y1 - y0) * 0.12, -0.6, 0, TAU);
      c.fill();
    }
    c.restore();
  }

  // Garis pensil meruncing. progress < 1 = baru tergambar sebagian.
  line(pts, { width = 2.8, color = INK, wobble = 1.2, seed = 0, close = false, progress = 1, alpha = 1, taper = true } = {}) {
    if (pts.length < 2 || progress <= 0) return;
    const c = this.ctx;
    const n = Math.max(2, Math.ceil(pts.length * clamp01(progress)));
    const p = this.#wob(close && progress >= 1 ? [...pts, pts[0]] : pts.slice(0, n), seed, wobble);
    c.save();
    c.strokeStyle = color;
    c.lineCap = 'round';
    c.lineJoin = 'round';
    if (!taper || p.length < 4) {
      c.globalAlpha = alpha * 0.92;
      c.lineWidth = width;
      this.path(p, false);
      c.stroke();
    } else {
      // Tebal berubah sepanjang garis (tekanan pensil): tipis di ujung, tebal di tengah.
      for (let i = 0; i < p.length - 1; i++) {
        const u = (i + 0.5) / (p.length - 1);
        c.globalAlpha = alpha * 0.92;
        c.lineWidth = width * (0.35 + 0.75 * Math.sin(Math.PI * u) ** 0.6);
        c.beginPath();
        c.moveTo(p[i][0], p[i][1]);
        c.lineTo(p[i + 1][0], p[i + 1][1]);
        c.stroke();
      }
    }
    // Tarikan kedua yang tipis & meleset sedikit.
    c.globalAlpha = alpha * 0.35;
    c.lineWidth = width * 0.45;
    this.path(this.#wob(p, seed + 77, wobble * 1.4), false);
    c.stroke();
    c.restore();
  }

  shape(pts, color, opts = {}) {
    if (color) this.fill(pts, color, opts);
    this.line(pts, { ...opts, close: true, taper: false, width: opts.width ?? 2.6 });
  }

  circle(cx, cy, r, color, opts = {}) {
    this.shape(ellipsePts(cx, cy, r, r, Math.max(14, Math.round(r / 2.2))), color, opts);
  }

  ellipse(cx, cy, rx, ry, color, opts = {}) {
    this.shape(ellipsePts(cx, cy, rx, ry, Math.max(14, Math.round((rx + ry) / 4))), color, opts);
  }

  dot(cx, cy, r, color, seed = 0) {
    const c = this.ctx;
    c.save();
    c.fillStyle = color;
    c.beginPath();
    c.ellipse(cx + this.j(seed) * 0.5, cy + this.j(seed + 9) * 0.5, r, r * (0.92 + this.j(seed + 3) * 0.06), 0, 0, TAU);
    c.fill();
    c.restore();
  }

  // Coretan zig-zag (langit menggelap / warna kembali).
  scribble(x0, y0, x1, y1, color, { seed = 0, width = 14, rows = 6, progress = 1, alpha = 0.85 } = {}) {
    const pts = [];
    const rowsH = (y1 - y0) / rows;
    for (let r = 0; r < rows; r++) {
      const y = y0 + r * rowsH;
      const dir = r % 2 ? -1 : 1;
      const steps = 14;
      for (let i = 0; i <= steps; i++) {
        const u = dir > 0 ? i / steps : 1 - i / steps;
        pts.push([x0 + (x1 - x0) * u + hash(seed + r * 20 + i) * 18, y + (i % 2) * rowsH * 1.3 + hash(seed + i * 3 + r) * 8]);
      }
    }
    const c = this.ctx;
    c.save();
    c.strokeStyle = crayon(c, color);
    c.lineCap = 'round';
    c.lineJoin = 'round';
    c.lineWidth = width;
    c.globalAlpha = alpha;
    const n = Math.max(2, Math.ceil(pts.length * clamp01(progress)));
    this.path(this.#wob(pts.slice(0, n), seed, 2), false);
    c.stroke();
    c.restore();
  }
}
