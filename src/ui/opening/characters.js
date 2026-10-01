// Tokoh opening: Cing (dirig dengan tulang punggung lentur) + teman-teman tanah + serangga terbang.
// Semua digambar di koordinat lokal: (0,0) = titik tumpu di tanah, menghadap kanan.
import { clamp01, crayon, ellipsePts, hash, INK, TAU } from './brush.js';

const PINK = '#f29bb2';
const PINK_DARK = '#d9708f';
const LEAF = '#5cb85c';

// Tulang punggung Cing: ekor di kiri menempel tanah, lalu naik ke kepala.
// crawl = fase merayap (punuk berjalan), sway = goyang badan, sad = badan merunduk.
function spine({ t, crawl = 0, sway = 1, sad = 0, stretch = 1 }) {
  const pts = [];
  const N = 16;
  for (let i = 0; i <= N; i++) {
    const s = i / N;
    let x, y;
    if (s < 0.55) {
      const u = s / 0.55;
      x = -86 + u * 74;
      y = -4 * Math.sin(u * Math.PI);
      // Punuk merayap yang berjalan dari ekor ke depan.
      y -= Math.max(0, Math.sin(u * TAU * 1.1 - crawl)) * 16 * clamp01(Math.abs(Math.sin(crawl * 0.5)) + 0.3) * (crawl ? 1 : 0);
    } else {
      const u = (s - 0.55) / 0.45;
      x = -12 + 20 * Math.sin(u * Math.PI * 0.5) - sad * 14 * u * u;
      y = -u * 100 * stretch * (1 - sad * 0.32);
    }
    x += Math.sin(t * 2.3 + s * 3.2) * 4 * s * sway;
    pts.push([x, y]);
  }
  return pts;
}

// mood: happy | worried | shocked | sad | excited. Opsi lain: blink 0..1, look (−1..1), hat (putaran topi), cough.
export function drawCing(b, t, o = {}) {
  const c = b.ctx;
  const mood = o.mood ?? 'happy';
  const sad = mood === 'sad' ? 1 : 0;
  const sp = spine({ t, crawl: o.crawl ?? 0, sad, stretch: o.stretch ?? 1 });
  c.save();
  c.lineCap = 'round';
  c.lineJoin = 'round';
  // Garis tepi badan (tinta), lalu isi krayon pink, berdiameter menebal ke kepala.
  for (const [col, extra] of [[INK, 7], ['pink', 0]]) {
    for (let i = 0; i < sp.length - 1; i++) {
      const s = i / (sp.length - 1);
      c.strokeStyle = col === 'pink' ? crayon(c, PINK) : col;
      c.globalAlpha = col === 'pink' ? 1 : 0.95;
      c.lineWidth = 26 + 10 * s + extra;
      c.beginPath();
      c.moveTo(sp[i][0] + b.j(i) * 0.6, sp[i][1] + b.j(i + 40) * 0.6);
      c.lineTo(sp[i + 1][0], sp[i + 1][1]);
      c.stroke();
    }
  }
  // Isi dasar supaya krayon tidak terlalu bolong.
  c.globalAlpha = 0.45;
  c.strokeStyle = PINK;
  c.lineWidth = 30;
  b.path(sp, false);
  c.stroke();
  c.globalAlpha = 1;
  // Kilau perut & cincin badan.
  b.line(sp.slice(2, 10).map(([x, y]) => [x + 2, y - 7]), { width: 3, color: 'rgba(255,255,255,.75)', seed: 900 });
  for (const s of [0.18, 0.3, 0.42, 0.56, 0.68, 0.8]) {
    const i = Math.round(s * (sp.length - 1));
    const [x0, y0] = sp[i];
    const [x1, y1] = sp[Math.min(sp.length - 1, i + 1)];
    const ang = Math.atan2(y1 - y0, x1 - x0) + Math.PI / 2;
    const r = 13 + 4 * s;
    b.line([[x0 + Math.cos(ang) * r, y0 + Math.sin(ang) * r], [x0 + 2, y0 + 1], [x0 - Math.cos(ang) * r, y0 - Math.sin(ang) * r]],
      { width: 2, color: PINK_DARK, seed: 910 + i, taper: false });
  }

  // ---------- kepala ----------
  const [hx0, hy0] = sp[sp.length - 1];
  const hx = hx0 + 4, hy = hy0 - 34;
  c.save();
  c.translate(hx, hy);
  c.rotate((o.tilt ?? 0) + Math.sin(t * 1.7) * 0.04 - sad * 0.18);
  b.circle(0, 0, 44, '#f7aec0', { seed: 920, width: 3.2, shadow: 0.18, light: 0.35 });
  // Topi daun (berayun saat melompat).
  c.save();
  c.translate(-4, -38);
  c.rotate(-0.25 + (o.hat ?? 0) - sad * 0.35);
  const leaf = [[-46, 6], [-30, -16], [0, -24], [32, -14], [44, 4], [10, 10]];
  b.shape(leaf, LEAF, { seed: 930, width: 2.6, shadow: 0.25 });
  b.line([[-36, 2], [-8, -6], [30, -6]], { width: 2, seed: 931 });
  b.line([[-14, -4], [-20, -14]], { width: 1.6, seed: 932 });
  b.line([[8, -6], [6, -16]], { width: 1.6, seed: 933 });
  b.line([[0, -22], [6, -38], [16, -44]], { width: 3, color: '#3e8f3e', seed: 934 });
  c.restore();

  // Pipi.
  b.ellipse(-28, 14, 9, 6, '#ef6f8e', { seed: 940, width: 0.01, shadow: 0, alpha: 0.6 });
  b.ellipse(30, 14, 9, 6, '#ef6f8e', { seed: 941, width: 0.01, shadow: 0, alpha: 0.6 });

  // Mata.
  const look = (o.look ?? 0) * 3.5;
  const blink = clamp01(o.blink ?? 0);
  const big = mood === 'shocked' ? 1.25 : mood === 'excited' ? 1.12 : 1;
  for (const ex of [-15, 15]) {
    const ey = -4 + sad * 3;
    if (blink > 0.85) {
      b.line([[ex - 9, ey], [ex, ey + 4], [ex + 9, ey]], { width: 3, seed: 950 + ex, taper: false });
      continue;
    }
    const ry = 13 * big * (1 - blink);
    b.shape(ellipsePts(ex, ey, 10.5 * big, ry, 16), '#ffffff', { seed: 952 + ex, width: 2.4, shadow: 0 });
    const pr = mood === 'shocked' ? 4 : 7;
    b.dot(ex + look, ey + 1.5, pr * (1 - blink * 0.6), INK, 954 + ex);
    if (mood === 'excited') {
      // Mata berbinar: bintang kecil.
      const st = [];
      for (let k = 0; k < 10; k++) { const a = (k / 10) * TAU - Math.PI / 2, r = k % 2 ? 1.6 : 4; st.push([ex + look + 2 + Math.cos(a) * r, ey - 1 + Math.sin(a) * r]); }
      c.fillStyle = '#fff';
      b.path(st, true);
      c.fill();
    } else {
      b.dot(ex + look + 2.6, ey - 2.5, 2.6, '#ffffff', 956 + ex);
    }
    // Alis.
    if (mood === 'sad' || mood === 'worried') {
      const k = ex < 0 ? 1 : -1;
      b.line([[ex - 9 * k, ey - 17 + (mood === 'sad' ? 1 : 0)], [ex + 6 * k, ey - 22]], { width: 2.6, seed: 958 + ex, taper: false });
    }
  }
  // Mulut.
  const my = 20;
  if (mood === 'happy' || mood === 'excited') {
    const w = mood === 'excited' ? 13 : 10;
    b.shape([[-w, my - 3], [-w * 0.5, my + w * 0.75], [w * 0.5, my + w * 0.75], [w, my - 3]], '#c4446a', { seed: 960, width: 2.4, shadow: 0 });
    b.ellipse(0, my + w * 0.45, w * 0.45, 3.2, '#ff8fa8', { seed: 961, width: 0.01, shadow: 0 });
  } else if (mood === 'shocked') {
    b.ellipse(0, my + 4, 6.5, 8.5, '#c4446a', { seed: 962, width: 2.4, shadow: 0 });
  } else if (mood === 'worried') {
    b.line([[-10, my + 3], [-4, my], [2, my + 4], [9, my + 1]], { width: 2.6, seed: 963, taper: false });
  } else {
    b.line([[-10, my + 6], [0, my], [10, my + 6]], { width: 2.8, seed: 964, taper: false });
  }
  // Air mata mengalir.
  if (sad) {
    for (const [ex, ph] of [[-17, 0], [17, 0.45]]) {
      const k = (t * 0.9 + ph) % 1;
      b.shape([[ex, 8 + k * 30], [ex - 4.5, 16 + k * 30], [ex, 20 + k * 30], [ex + 4.5, 16 + k * 30]], '#8fc6f4', { seed: 966 + ex, width: 1.6, shadow: 0, alpha: 1 - k * 0.6 });
    }
  }
  c.restore();

  // Tanda kaget "!" & garis senang.
  if (mood === 'shocked') {
    b.line([[hx + 52, hy - 76], [hx + 48, hy - 48]], { width: 6, color: '#e2433f', seed: 970 });
    b.dot(hx + 46, hy - 36, 4, '#e2433f', 971);
    for (let i = 0; i < 3; i++) {
      const a = -1.9 + i * 0.5;
      b.line([[hx + Math.cos(a) * 58, hy + Math.sin(a) * 58], [hx + Math.cos(a) * 74, hy + Math.sin(a) * 74]], { width: 3, seed: 972 + i });
    }
  }
  if (mood === 'excited') {
    for (let i = 0; i < 4; i++) {
      const a = -0.2 - i * 0.55 + Math.sin(t * 6) * 0.05;
      b.line([[hx + Math.cos(a) * 60, hy + Math.sin(a) * 60], [hx + Math.cos(a) * 80, hy + Math.sin(a) * 80]], { width: 3.4, color: '#f2a531', seed: 976 + i });
    }
  }
  if (o.cough) {
    for (let i = 0; i < 3; i++) {
      const k = (t * 1.3 + i * 0.33) % 1;
      b.circle(hx + 50 + k * 40, hy + 18 - k * 30, 6 + k * 8, '#bfb3a3', { seed: 980 + i, width: 1.6, shadow: 0, alpha: 1 - k });
    }
  }
  c.restore();
}

// ---------- teman di dalam tanah ----------
export function drawAnt(b, t, { sad = false, carry = null, walk = 0 } = {}) {
  const leg = (i) => Math.sin(walk * 10 + i * 2.1) * 6;
  for (let i = 0; i < 3; i++) {
    const x = -14 + i * 14;
    b.line([[x, -12], [x - 8 + leg(i), 0]], { width: 2.2, seed: 1000 + i });
    b.line([[x, -12], [x + 8 - leg(i), 0]], { width: 2.2, seed: 1010 + i });
  }
  b.ellipse(-24, -16, 13, 10, '#8a3b2c', { seed: 1020, width: 2.4 });
  b.ellipse(0, -16, 9, 8, '#9c4533', { seed: 1021, width: 2.4 });
  b.ellipse(20, -22, 11, 10, '#a84f3b', { seed: 1022, width: 2.4, light: 0.3 });
  b.line([[24, -30], [32, -44], [38, -46]], { width: 1.8, seed: 1023 });
  b.line([[18, -31], [20, -46], [26, -50]], { width: 1.8, seed: 1024 });
  b.dot(25, -24, 2.6, '#fff', 1025);
  b.dot(25.6, -23.6, 1.4, INK, 1026);
  if (sad) b.line([[22, -14], [26, -16], [30, -14]], { width: 1.6, seed: 1027, taper: false });
  if (carry) b.circle(4, -38, 7, carry, { seed: 1028, width: 1.6 });
}

export function drawBeetle(b, t, { sad = false } = {}) {
  for (let i = 0; i < 3; i++) {
    const x = -14 + i * 14, sw = Math.sin(t * 6 + i) * 2;
    b.line([[x, -10], [x - 6 + sw, 2]], { width: 2.2, seed: 1100 + i });
  }
  b.shape(ellipsePts(0, -18, 30, 20, 20, Math.PI, TAU).concat([[30, -12], [-30, -12]]), '#3f8fb0', { seed: 1110, width: 2.6, light: 0.35 });
  b.line([[0, -38], [0, -12]], { width: 2, seed: 1111 });
  b.dot(-12, -24, 4, INK, 1112);
  b.dot(12, -26, 4, INK, 1113);
  b.circle(34, -16, 10, '#2f6f8a', { seed: 1114, width: 2.4 });
  b.dot(37, -18, 2.6, '#fff', 1115);
  if (sad) b.line([[34, -6], [37, -8], [41, -6]], { width: 1.6, seed: 1116, taper: false });
}

export function drawSnail(b, t, { sad = false } = {}) {
  const droop = sad ? 0.6 : 0;
  b.shape([[-36, 0], [-30, -10], [20, -12], [40, -18], [46, -6], [40, 0]], '#e8cfa0', { seed: 1200, width: 2.4 });
  b.line([[34, -16], [38 + droop * 8, -36 + droop * 18]], { width: 2, seed: 1201 });
  b.line([[40, -16], [48 + droop * 8, -34 + droop * 18]], { width: 2, seed: 1202 });
  b.dot(38 + droop * 8, -37 + droop * 18, 3, INK, 1203);
  b.dot(48 + droop * 8, -35 + droop * 18, 3, INK, 1204);
  b.circle(-6, -30, 26, '#f2a35a', { seed: 1205, width: 2.6, light: 0.25 });
  const sp = [];
  for (let i = 0; i <= 30; i++) { const a = i * 0.42, r = 22 * (1 - i / 34); sp.push([-6 + Math.cos(a) * r, -30 + Math.sin(a) * r]); }
  b.line(sp, { width: 2.2, seed: 1206, taper: false });
}

// Capung (seperti di referensi): sayap mengepak, badan bergaris.
export function drawDragonfly(b, t, seed = 0) {
  const flap = Math.sin(t * 34 + seed) * 0.5 + 0.5;
  const c = b.ctx;
  for (const [wx, wy, a] of [[-6, -6, -0.5], [-6, 6, 0.5], [6, -6, -0.35], [6, 6, 0.35]]) {
    c.save();
    c.translate(wx, 0);
    c.rotate(a + (wy < 0 ? -1 : 1) * flap * 0.35);
    b.ellipse(0, wy * 3.2, 9, 24, '#bee1f5', { seed: seed + wx + wy, width: 1.6, shadow: 0, alpha: 0.55 });
    c.restore();
  }
  b.line([[-40, 0], [-8, 0]], { width: 6, color: '#e9853a', seed: seed + 5, taper: false });
  for (let k = 0; k < 4; k++) b.line([[-36 + k * 8, -3], [-36 + k * 8, 3]], { width: 1.4, seed: seed + 6 + k, taper: false });
  b.circle(2, 0, 9, '#e9853a', { seed: seed + 11, width: 2 });
  b.circle(10, -2, 7, '#3d8fe0', { seed: seed + 12, width: 2, light: 0.4 });
}

export function drawButterfly(b, t, color, seed = 0) {
  const flap = Math.abs(Math.sin(t * 9 + seed));
  const c = b.ctx;
  for (const side of [-1, 1]) {
    c.save();
    c.scale(side * (0.25 + flap * 0.75), 1);
    b.shape([[0, 0], [16, -20], [30, -12], [24, 4], [0, 2]], color, { seed: seed + side, width: 2, shadow: 0.15 });
    b.shape([[0, 2], [20, 8], [16, 22], [0, 10]], color, { seed: seed + side + 5, width: 2, shadow: 0.2 });
    c.restore();
  }
  b.line([[0, -12], [0, 14]], { width: 3, seed: seed + 9, taper: false });
  b.line([[0, -12], [-6, -24]], { width: 1.4, seed: seed + 10 });
  b.line([[0, -12], [6, -24]], { width: 1.4, seed: seed + 11 });
}

export const hashSeed = hash;
