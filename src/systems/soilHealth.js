// Kesehatan tanah "sekarang" per area (fungsi murni, disederhanakan untuk game).
import { HEALTH_CONFIG, SIM_CONFIG } from '../data/plastics.js';
import { clamp, healthFromDamage } from './timeSim.js';

// area: { legacy, repaired, litter: [{ w }], buried: [{ w }] }
// legacy = pencemaran lama di tanah; hanya berkurang lewat tindakan baik (repaired).
export function areaDamage(area, cfg = HEALTH_CONFIG) {
  const legacyLeft = Math.max(0, (area.legacy ?? 0) - (area.repaired ?? 0));
  const sum = (list, k) => (list ?? []).reduce((acc, it) => acc + (it.w ?? 0) * k, 0);
  return legacyLeft + sum(area.litter, cfg.litterFactor) + sum(area.buried, cfg.buriedFactor);
}

export function areaHealth(area, cfg = HEALTH_CONFIG, ref = SIM_CONFIG.ref) {
  return healthFromDamage(areaDamage(area, cfg), ref);
}

export function villageHealth(healths) {
  if (!healths.length) return 100;
  return clamp(healths.reduce((a, b) => a + b, 0) / healths.length, 0, 100);
}

// Suasana hati Cing mengikuti tanah.
export function moodOf(health) {
  if (health >= 70) return 'ceria';
  if (health >= 40) return 'biasa';
  return 'lesu';
}

// Hasil akhir slice berdasarkan proyeksi 100 tahun.
export function outcomeOf(health) {
  if (health >= 70) return 'subur';
  if (health >= 40) return 'pulih';
  return 'kusam';
}

// Mendekat halus ke target (tidak loncat), aman untuk dt besar.
export function approach(current, target, dt, rate = 1.5) {
  return target + (current - target) * Math.exp(-rate * Math.max(0, dt));
}
