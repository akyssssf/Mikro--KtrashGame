// Properti dunia opening: rumah, pohon, bukit, kolam, bunga, pakis, matahari/bulan, awan, sampah.
// (0,0) = titik tumpu di tanah kecuali disebut lain.
import { blobPts, clamp01, ellipsePts, hash, INK, TAU } from './brush.js';

export function drawHill(b, cx, base, w, h, color, seed) {
  const pts = ellipsePts(cx, base, w, h, 30, Math.PI, TAU);
  b.shape(pts, color, { seed, width: 2.2, shadow: 0.12 });
}

export function drawTree(b, t, s, seed, kind = 'round') {
  const c = b.ctx;
  c.save();
  c.scale(s, s);
  c.rotate(Math.sin(t * 1.1 + seed) * 0.015);
  b.shape([[-9, 0], [-7, -70], [-16, -96], [-4, -88], [0, -110], [5, -88], [16, -98], [8, -70], [10, 0]], '#9a6234', { seed, width: 2.6, shadow: 0.3 });
  b.line([[-2, -20], [1, -42]], { width: 1.6, seed: seed + 1, alpha: 0.6 });
  if (kind === 'pine') {
    for (let k = 0; k < 3; k++) {
      const y = -70 - k * 42, w = 64 - k * 14;
      b.shape([[-w, y + 10], [0, y - 62], [w, y + 10]], k % 2 ? '#3f9a54' : '#4caf5f', { seed: seed + 10 + k, width: 2.6, shadow: 0.25 });
    }
  } else {
    const sway = Math.sin(t * 1.3 + seed) * 2;
    b.shape(blobPts(-34 + sway, -122, 46, 7, 0.2, seed + 3), '#3f9a54', { seed: seed + 3, width: 2.6, shadow: 0.25 });
    b.shape(blobPts(30 + sway, -128, 48, 7, 0.2, seed + 4), '#4caf5f', { seed: seed + 4, width: 2.6, shadow: 0.2 });
    b.shape(blobPts(-2 + sway, -166, 52, 8, 0.2, seed + 5), '#5cbf62', { seed: seed + 5, width: 2.6, shadow: 0.15, light: 0.25 });
    // Buah kecil merah.
    for (let k = 0; k < 4; k++) b.dot(-30 + k * 22 + sway, -140 + (k % 2) * 30, 4.5, '#e2574c', seed + 20 + k);
  }
  c.restore();
}

export function drawHouse(b, t, s, roof, seed, smoke = 0) {
  const c = b.ctx;
  c.save();
  c.scale(s, s);
  const w = 130, h = 96;
  // Cerobong + asap melingkar.
  b.shape([[30, -h - 40], [30, -h - 76], [52, -h - 76], [52, -h - 30]], '#c4744a', { seed: seed + 9, width: 2.4 });
  if (smoke > 0) {
    for (let i = 0; i < 4; i++) {
      const k = (t * 0.45 + i * 0.25) % 1;
      const pts = ellipsePts(41 + Math.sin(k * 6 + i) * 10 + k * 26, -h - 92 - k * 90, 9 + k * 14, 7 + k * 10, 14);
      b.line(pts, { width: 2, seed: seed + 30 + i, alpha: (1 - k) * smoke, taper: false });
    }
  }
  b.shape([[-w / 2, 0], [-w / 2, -h], [w / 2, -h], [w / 2, 0]], '#f4dcae', { seed, width: 2.8, shadow: 0.22 });
  // Garis papan dinding.
  for (let k = 1; k < 4; k++) b.line([[-w / 2 + 4, -k * 24], [w / 2 - 4, -k * 24 + 2]], { width: 1.3, seed: seed + 40 + k, alpha: 0.35, taper: false });
  b.shape([[-w / 2 - 22, -h + 4], [0, -h - 78], [w / 2 + 22, -h + 4]], roof, { seed: seed + 1, width: 3, shadow: 0.3 });
  for (let k = 0; k < 3; k++) b.line([[-w / 2 - 8 + k * 14, -h - 10 - k * 20], [w / 2 + 8 - k * 14, -h - 10 - k * 20]], { width: 1.6, seed: seed + 50 + k, alpha: 0.5, taper: false });
  b.shape([[-20, 0], [-20, -56], [20, -56], [20, 0]], '#9b6a42', { seed: seed + 2, width: 2.6, shadow: 0.25 });
  b.dot(12, -28, 3, INK, seed + 3);
  b.shape([[30, -76], [30, -46], [56, -46], [56, -76]], '#ffe7a3', { seed: seed + 4, width: 2.4, shadow: 0 });
  b.line([[43, -76], [43, -46]], { width: 2, seed: seed + 5, taper: false });
  b.line([[30, -61], [56, -61]], { width: 2, seed: seed + 6, taper: false });
  b.shape([[-56, -76], [-56, -46], [-30, -46], [-30, -76]], '#ffe7a3', { seed: seed + 7, width: 2.4, shadow: 0 });
  b.line([[-43, -76], [-43, -46]], { width: 2, seed: seed + 8, taper: false });
  c.restore();
}

export function drawFlower(b, t, h, color, seed, grow = 1, droop = 0) {
  if (grow <= 0.01) return;
  const sway = Math.sin(t * 2.2 + seed) * 4 + droop * 12;
  const top = [sway, -h * grow];
  b.line([[0, 0], [sway * 0.4, -h * grow * 0.5], top], { width: 2.6, color: '#3e8f3e', seed });
  b.shape([[0, -h * grow * 0.35], [-12, -h * grow * 0.5], [-2, -h * grow * 0.45]], '#5cb85c', { seed: seed + 1, width: 1.6, shadow: 0 });
  const r = 7 * grow;
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * TAU + seed;
    b.circle(top[0] + Math.cos(a) * r * 1.3, top[1] + Math.sin(a) * r * 1.3 + droop * 3, r, color, { seed: seed + 2 + k, width: 1.6, shadow: 0.1 });
  }
  b.circle(top[0], top[1] + droop * 3, r * 0.75, '#f7c948', { seed: seed + 9, width: 1.6, shadow: 0 });
}

export function drawGrass(b, t, seed, droop = 0) {
  const sway = Math.sin(t * 2.6 + seed) * 3 + droop * 6;
  for (let k = -1; k <= 1; k++) {
    b.line([[k * 5, 0], [k * 6 + sway * 0.5, -10], [k * 10 + sway, -20 + Math.abs(k) * 4 + droop * 6]], { width: 2.2, color: '#3e8f3e', seed: seed + k });
  }
}

// Pakis menggulung terbuka (seperti di referensi): progress 0..1.
export function drawFern(b, t, h, seed, progress) {
  if (progress <= 0) return;
  const pts = [];
  const N = 40;
  for (let i = 0; i <= N; i++) {
    const s = i / N;
    if (s < 0.65) pts.push([Math.sin(s * 3 + seed) * 6, -s / 0.65 * h * 0.75]);
    else {
      const u = (s - 0.65) / 0.35;
      const curl = (1 - progress) * 2.8 + 0.6;
      const a = -Math.PI / 2 + u * curl * Math.PI;
      const r = h * 0.18 * (1 - u * 0.6);
      pts.push([Math.cos(a + Math.PI / 2) * r - r, -h * 0.75 + Math.sin(a + Math.PI / 2) * -r * 0.2 - u * h * 0.2 * progress]);
    }
  }
  b.line(pts, { width: 4, color: '#4caf5f', seed, progress: Math.min(1, progress * 1.3) });
  for (let k = 1; k < 6; k++) {
    const p = pts[Math.round((k / 6) * N * 0.65)];
    const g = clamp01(progress * 1.4 - k * 0.1);
    if (g <= 0) continue;
    b.shape([[p[0], p[1]], [p[0] - 22 * g, p[1] - 8 * g], [p[0] - 6 * g, p[1] + 2]], '#5cbf62', { seed: seed + k, width: 1.6, shadow: 0 });
    b.shape([[p[0], p[1]], [p[0] + 22 * g, p[1] - 8 * g], [p[0] + 6 * g, p[1] + 2]], '#4caf5f', { seed: seed + k + 10, width: 1.6, shadow: 0 });
  }
}

export function drawSun(b, t, r, seed) {
  b.circle(0, 0, r, '#f8c43a', { seed, width: 2.4, shadow: 0.15, light: 0.3 });
  const sp = [];
  for (let i = 0; i <= 48; i++) { const a = i * 0.42 + t * 0.6; sp.push([Math.cos(a) * r * 0.85 * (i / 48), Math.sin(a) * r * 0.85 * (i / 48)]); }
  b.line(sp, { width: 3, color: '#e9853a', seed: seed + 1, taper: false });
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * TAU + t * 0.2;
    const l = i % 2 ? 1.5 : 1.75;
    b.line([[Math.cos(a) * r * 1.25, Math.sin(a) * r * 1.25], [Math.cos(a) * r * l, Math.sin(a) * r * l]], { width: 3, seed: seed + 2 + i });
  }
}

export function drawMoon(b, r, seed) {
  const outer = ellipsePts(0, 0, r, r, 24, -Math.PI * 0.6, Math.PI * 0.6);
  const inner = ellipsePts(r * 0.45, 0, r * 0.75, r * 0.85, 20, Math.PI * 0.55, -Math.PI * 0.55);
  b.shape([...outer, ...inner], '#f5e7a8', { seed, width: 2.4, shadow: 0.1 });
}

export function drawCloud(b, s, color, seed) {
  const c = b.ctx;
  c.save();
  c.scale(s, s);
  const pts = [];
  for (const [bx, by, r] of [[-62, 0, 36], [-22, -24, 46], [28, -18, 42], [66, 2, 30]]) pts.push(...ellipsePts(bx, by, r, r * 0.86, 10, Math.PI * 0.88, Math.PI * 2.12));
  pts.push([92, 22], [-92, 22]);
  b.shape(pts, color, { seed, width: 2.4, shadow: 0.12 });
  c.restore();
}

// ---------- sampah ----------
// Botol PET (tegak, alas di 0). fade 0..1 = pudar terbakar matahari, crack 0..1 = retak.
export function drawBottle(b, seed, { fade = 0, crack = 0 } = {}) {
  const body = [[-26, 0], [-28, -60], [-24, -84], [-12, -100], [-10, -112], [10, -112], [12, -100], [24, -84], [28, -60], [26, 0]];
  const glass = fade > 0.5 ? '#dfe4e2' : fade > 0.2 ? '#c8dce6' : '#a8d4f0';
  b.shape(body, glass, { seed, width: 2.8, alpha: 0.85, light: 0.5 - fade * 0.3, shadow: 0.15 });
  b.shape([[-27, -30], [27, -30], [27, -58], [-27, -58]], fade > 0.5 ? '#c9cfd3' : '#3d8fe0', { seed: seed + 1, width: 2.2, shadow: 0.2 });
  // Segitiga kode 1 di label.
  b.line([[-8, -36], [0, -52], [8, -36], [-8, -36]], { width: 2, color: '#ffffff', seed: seed + 2, taper: false });
  b.shape([[-11, -112], [-11, -126], [11, -126], [11, -112]], fade > 0.6 ? '#9fb4c4' : '#2f6fc4', { seed: seed + 3, width: 2.4 });
  for (let k = 0; k < 3; k++) b.line([[-6 + k * 6, -114], [-6 + k * 6, -124]], { width: 1.2, seed: seed + 4 + k, taper: false });
  if (crack > 0) {
    const cracks = [[[4, -104], [-6, -80], [8, -62], [-4, -38], [6, -14], [0, -2]], [[-24, -72], [-10, -64], [-18, -46]], [[22, -40], [8, -30], [18, -12]], [[-20, -20], [-8, -14]]];
    cracks.forEach((pts, i) => b.line(pts, { width: 2.6, seed: seed + 20 + i, progress: clamp01(crack * 1.8 - i * 0.28) }));
  }
}

export function drawBag(b, t, seed) {
  const fl = Math.sin(t * 5 + seed) * 3;
  b.shape([[-40, 0], [-44, -40], [-30, -64], [-24, -86], [-12, -86], [-14, -66], [14, -66], [12, -86], [24, -86], [30, -64], [44 + fl, -40], [40, 0]], '#fbfbf8', { seed, width: 2.6, shadow: 0.18, light: 0.2 });
  b.line([[-36, -36], [36, -34]], { width: 7, color: '#e2574c', seed: seed + 1, taper: false });
  b.line([[-20, -14], [-6, -30], [10, -18]], { width: 1.6, seed: seed + 2, alpha: 0.5 });
}

export function drawFoam(b, seed) {
  b.shape([[-52, 0], [-52, -34], [52, -34], [52, 0]], '#fdfdf8', { seed, width: 2.6, shadow: 0.2 });
  b.shape([[-52, -34], [-42, -58], [42, -58], [52, -34]], '#efefe6', { seed: seed + 1, width: 2.4, shadow: 0.15 });
  b.line([[-52, -16], [52, -16]], { width: 1.4, seed: seed + 2, alpha: 0.4, taper: false });
}

export function drawCup(b, seed) {
  b.shape([[-20, 0], [-26, -62], [26, -62], [20, 0]], '#fbfbf8', { seed, width: 2.6, shadow: 0.2 });
  b.shape([[-30, -62], [-30, -70], [30, -70], [30, -62]], '#e8e8e0', { seed: seed + 1, width: 2.2 });
  b.line([[6, -70], [14, -108], [28, -116]], { width: 7, color: '#e2574c', seed: seed + 2 });
}

export const PLASTIC_COLORS = ['#6fb6f0', '#ffffff', '#ef6464', '#f7c948', '#8fd16a', '#c48af0'];

// Kepingan plastik kecil (bentuk tak beraturan / serat / butir).
export function drawFragment(b, kind, size, color, seed) {
  if (kind === 0) b.shape([[-size, -size * 0.3], [size * 0.2, -size], [size, size * 0.1], [-size * 0.1, size * 0.8]], color, { seed, width: 1.6, shadow: 0.1 });
  else if (kind === 1) b.line([[-size * 1.4, 0], [-size * 0.3, -size * 0.5], [size * 0.6, size * 0.2], [size * 1.4, -size * 0.3]], { width: size * 0.5, color, seed, taper: false });
  else b.circle(0, 0, size * 0.6, color, { seed, width: 1.4, shadow: 0.1 });
  void hash;
}
