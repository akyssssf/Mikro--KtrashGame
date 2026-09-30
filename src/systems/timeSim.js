// Simulasi waktu murni (tanpa Three.js). Satu sumber kebenaran untuk
// Lensa Waktu, Gerbang Waktu, dan layar akhir.
import { SIM_CONFIG } from '../data/plastics.js';

export const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const smooth = (x) => x * x * (3 - 2 * x);

// Skala logaritmik: years = min × (max/min)^s. Default: 0.1 × 10^(4s). s = 0 → 0.
export function yearsFromSlider(s, maxYears = SIM_CONFIG.maxYears, minYears = SIM_CONFIG.minYears) {
  if (s <= 0) return 0;
  const k = Math.min(1, s);
  return minYears * Math.pow(maxYears / minYears, k);
}

export function sliderFromYears(years, maxYears = SIM_CONFIG.maxYears, minYears = SIM_CONFIG.minYears) {
  if (years <= 0) return 0;
  if (years <= minYears) return 0;
  return clamp(Math.log(years / minYears) / Math.log(maxYears / minYears), 0, 1);
}

// Bentuk tampilan: < 1 tahun ditampilkan dalam bulan.
export function yearParts(years) {
  if (years <= 0) return { unit: 'sekarang', value: 0 };
  if (years < 1) return { unit: 'bulan', value: Math.max(1, Math.round(years * 12)) };
  return { unit: 'tahun', value: years < 10 ? Math.round(years * 10) / 10 : Math.round(years) };
}

export const progressOf = (t, D) => (D > 0 ? Math.max(0, t) / D : Infinity);

// Tahapan visual per progres p = t / D.
export function stageOf(p, organic = false) {
  if (organic) {
    if (p >= 1) return 'jadiTanah';
    if (p >= 0.3) return 'membusuk';
    return 'utuh';
  }
  if (p >= 1) return 'mikroplastik';
  if (p >= 0.6) return 'hampirHancur';
  if (p >= 0.25) return 'kusam';
  return 'utuh';
}

// Kerusakan tanah dari satu plastik setelah t tahun (satuan bobot w).
// Naik ke ~65% w dalam ±20 tahun, naik pelan sampai hancur, lalu mikroplastik terus menyebar.
export function plasticDamage(t, D, w, cfg = SIM_CONFIG) {
  if (t <= 0 || w <= 0) return 0;
  const early = cfg.earlyShare * smooth(clamp(t / cfg.earlyYears, 0, 1));
  const midSpan = Math.max(1, D - cfg.earlyYears);
  const mid = cfg.midShare * clamp((t - cfg.earlyYears) / midSpan, 0, 1);
  const late = t > D ? cfg.lateShare * (1 - Math.exp(-(t - D) / D)) : 0;
  return w * (early + mid + late);
}

// Porsi partikel mikroplastik yang terlihat (0–1) dan jangkauan sebarannya.
export const microFraction = (p) => clamp((p - 0.3) / 0.7, 0, 1);
export const microSpread = (p) => 0.3 + 0.9 * Math.min(p, 1.6);

export function healthFromDamage(damage, ref = SIM_CONFIG.ref) {
  return clamp(100 - (100 * damage) / ref, 0, 100);
}

// entries: [{ D, w, organic }]. baseDamage: kerusakan kondisi sekarang (dari soilHealth).
export function simulate(entries, t, { baseDamage = 0, ref = SIM_CONFIG.ref } = {}) {
  let damage = baseDamage;
  let micro = 0;
  const perEntry = entries.map((e) => {
    const p = progressOf(t, e.D);
    const stage = stageOf(p, e.organic);
    const d = e.organic ? 0 : plasticDamage(t, e.D, e.w);
    const mf = e.organic ? 0 : microFraction(p);
    damage += d;
    micro += mf;
    return { p, stage, gone: p >= 1, damage: d, micro: mf };
  });
  return { t, damage, health: healthFromDamage(damage, ref), micro, perEntry };
}

// Kejadian penting untuk caption: organik jadi tanah, plastik hancur jadi mikroplastik.
export function milestones(entries) {
  const seen = new Map();
  for (const e of entries) {
    const key = e.organic ? `o:${e.key}` : `p:${e.code}`;
    if (!seen.has(key)) seen.set(key, { years: e.D, organic: !!e.organic, code: e.code, key: e.key });
  }
  return [...seen.values()].sort((a, b) => a.years - b.years);
}

// Kejadian terakhir yang sudah terjadi sampai tahun t (null bila belum ada).
export function latestMilestone(list, t) {
  let last = null;
  for (const m of list) if (t >= m.years) last = m;
  return last;
}
