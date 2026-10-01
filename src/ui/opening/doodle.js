// Kuas "coretan krayon" untuk canvas 2D: garis pensil yang bergetar (digambar ulang ±8x/detik
// seperti animasi tangan), isian krayon berupa arsiran, dan kertas krem bertekstur.
export const INK = '#2c3a6b';
export const PAPER = '#f6efe1';
const TAU = Math.PI * 2;

// Angka acak tetap dari seed → −1..1 (jitter yang sama untuk seed & frame "boil" yang sama).
export function hash(n) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return (x - Math.floor(x)) * 2 - 1;
}

// Campur warna hex dengan abu-abu (dull 0..1) → desa yang meredup.
export function dullColor(hex, dull) {
  if (!dull) return hex;
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const grey = 0.3 * r + 0.59 * g + 0.11 * b;
  const m = (c) => Math.round(c + (grey * 0.92 - c) * dull);
  return `rgb(${m(r)},${m(g)},${m(b)})`;
}

export function ellipsePts(cx, cy, rx, ry, n = 22, a0 = 0, a1 = TAU) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
  }
  return pts;
}

export class Doodle {
  constructor(ctx) {
    this.ctx = ctx;
    this.boil = 0;
    this.dull = 0;
  }

  setTime(t) { this.boil = Math.floor(t * 8); }

  j(seed) { return hash(seed + this.boil * 7.31); }

  // Jitter titik-titik sebuah bentuk (ukuran wobble dalam piksel dunia).
  #wobble(pts, seed, w) {
    return pts.map(([x, y], i) => [x + this.j(seed + i * 1.7) * w, y + this.j(seed + i * 2.3 + 50) * w]);
  }

  #trace(pts, close) {
    const c = this.ctx;
    c.beginPath();
    c.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length - 1; i++) {
      const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2;
      c.quadraticCurveTo(pts[i][0], pts[i][1], mx, my);
    }
    const last = pts[pts.length - 1];
    c.lineTo(last[0], last[1]);
    if (close) c.closePath();
  }

  // Garis pensil: dua tarikan tipis yang sedikit meleset → kesan digambar tangan.
  // progress < 1 = baru tergambar sebagian (animasi menggambar).
  line(pts, { width = 2.6, color = INK, wobble = 1.3, seed = 0, close = false, progress = 1, alpha = 1 } = {}) {
    if (pts.length < 2 || progress <= 0) return;
    let p = pts;
    if (progress < 1) p = pts.slice(0, Math.max(2, Math.ceil(pts.length * progress)));
    const c = this.ctx;
    c.save();
    c.globalAlpha *= alpha;
    c.strokeStyle = color;
    c.lineCap = 'round';
    c.lineJoin = 'round';
    for (let pass = 0; pass < 2; pass++) {
      c.lineWidth = width * (pass ? 0.6 : 1);
      c.globalAlpha = alpha * (pass ? 0.55 : 0.9);
      this.#trace(this.#wobble(p, seed + pass * 91, wobble * (pass ? 1.6 : 1)), close && progress >= 1);
      c.stroke();
    }
    c.restore();
  }

  // Isian krayon: arsiran miring yang dipotong bentuknya, sedikit "keluar garis" seperti anak menggambar.
  fill(pts, color, { seed = 0, alpha = 0.85, angle = -0.9, gap = 5, width = 5.5 } = {}) {
    const c = this.ctx;
    const col = dullColor(color, this.dull);
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const [x, y] of pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
    c.save();
    this.#trace(this.#wobble(pts, seed + 300, 2.2), true);
    c.clip();
    // Dasar tipis supaya tidak bolong, lalu arsiran.
    c.globalAlpha = alpha * 0.45;
    c.fillStyle = col;
    c.fillRect(x0 - 4, y0 - 4, x1 - x0 + 8, y1 - y0 + 8);
    c.strokeStyle = col;
    c.lineCap = 'round';
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, R = Math.hypot(x1 - x0, y1 - y0) / 2 + 6;
    const dx = Math.cos(angle), dy = Math.sin(angle), nx = -dy, ny = dx;
    let k = 0;
    for (let d = -R; d <= R; d += gap, k++) {
      const off = this.j(seed + k * 3.1) * 1.5;
      c.globalAlpha = alpha * (0.55 + 0.35 * Math.abs(this.j(seed + k * 5.7)));
      c.lineWidth = width * (0.7 + 0.4 * Math.abs(this.j(seed + k)));
      c.beginPath();
      c.moveTo(cx + nx * (d + off) - dx * R, cy + ny * (d + off) - dy * R);
      c.lineTo(cx + nx * (d + off) + dx * R, cy + ny * (d + off) + dy * R);
      c.stroke();
    }
    c.restore();
  }

  shape(pts, color, opts = {}) {
    if (color) this.fill(pts, color, opts);
    this.line(pts, { ...opts, close: true });
  }

  circle(cx, cy, r, color, opts = {}) {
    this.shape(ellipsePts(cx, cy, r, r, Math.max(12, Math.round(r / 2.5))), color, opts);
  }

  // Titik/bulatan isian penuh (mata, pipi) — tetap bergetar sedikit.
  dot(cx, cy, r, color, seed = 0) {
    const c = this.ctx;
    c.save();
    c.fillStyle = dullColor(color, this.dull);
    c.beginPath();
    c.arc(cx + this.j(seed) * 0.6, cy + this.j(seed + 9) * 0.6, r, 0, TAU);
    c.fill();
    c.restore();
  }
}

// Tekstur kertas: bintik halus dibuat sekali, ditumpuk di atas setiap frame.
export function paperGrain(w, h) {
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const c = cv.getContext('2d');
  const img = c.createImageData(w, h);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.random();
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v > 0.5 ? 255 : 90;
    img.data[i + 3] = Math.random() < 0.18 ? 14 : 0;
  }
  c.putImageData(img, 0, 0);
  return cv;
}
