import { describe, expect, it } from 'vitest';
import {
  healthFromDamage,
  latestMilestone,
  milestones,
  plasticDamage,
  simulate,
  sliderFromYears,
  stageOf,
  yearParts,
  yearsFromSlider,
} from '../src/systems/timeSim.js';
import { PLASTICS } from '../src/data/plastics.js';

describe('skala logaritmik', () => {
  it('s = 0 menjadi 0 tahun', () => {
    expect(yearsFromSlider(0)).toBe(0);
  });
  it('mengikuti 0.1 × 10^(4s)', () => {
    expect(yearsFromSlider(1)).toBeCloseTo(1000, 6);
    expect(yearsFromSlider(0.25)).toBeCloseTo(1, 6);
    expect(yearsFromSlider(0.5)).toBeCloseTo(10, 6);
    expect(yearsFromSlider(0.75)).toBeCloseTo(100, 6);
  });
  it('kebalikannya konsisten', () => {
    for (const y of [1, 10, 50, 100, 500, 1000]) {
      expect(yearsFromSlider(sliderFromYears(y))).toBeCloseTo(y, 6);
    }
    expect(sliderFromYears(0)).toBe(0);
  });
  it('batas maksimum bisa diganti (Lensa Waktu 50 tahun)', () => {
    expect(yearsFromSlider(1, 50)).toBeCloseTo(50, 6);
  });
  it('kurang dari setahun ditampilkan dalam bulan', () => {
    expect(yearParts(0)).toEqual({ unit: 'sekarang', value: 0 });
    expect(yearParts(5 / 12)).toEqual({ unit: 'bulan', value: 5 });
    expect(yearParts(0.01)).toEqual({ unit: 'bulan', value: 1 });
    expect(yearParts(100)).toEqual({ unit: 'tahun', value: 100 });
  });
});

describe('tahapan progres', () => {
  it('plastik: utuh → kusam → hampir hancur → mikroplastik', () => {
    expect(stageOf(0.1)).toBe('utuh');
    expect(stageOf(0.25)).toBe('kusam');
    expect(stageOf(0.59)).toBe('kusam');
    expect(stageOf(0.6)).toBe('hampirHancur');
    expect(stageOf(1)).toBe('mikroplastik');
    expect(stageOf(3)).toBe('mikroplastik');
  });
  it('organik jadi tanah saat p ≥ 1', () => {
    expect(stageOf(0.1, true)).toBe('utuh');
    expect(stageOf(0.5, true)).toBe('membusuk');
    expect(stageOf(1, true)).toBe('jadiTanah');
  });
  it('botol PET masih utuh setelah 50 tahun, daun sudah jadi tanah setelah 1 tahun', () => {
    const pet = simulate([{ D: PLASTICS[1].D, w: 1 }], 50).perEntry[0];
    expect(pet.stage).toBe('utuh');
    expect(pet.gone).toBe(false);
    const daun = simulate([{ D: 5 / 12, w: 0, organic: true }], 1).perEntry[0];
    expect(daun.gone).toBe(true);
  });
  it('kresek LDPE tidak hilang dalam 50 tahun', () => {
    const r = simulate([{ D: PLASTICS[4].D, w: 1 }], 50).perEntry[0];
    expect(r.gone).toBe(false);
  });
});

describe('kerusakan tanah', () => {
  it('nol di awal dan tidak pernah turun', () => {
    expect(plasticDamage(0, 450, 1)).toBe(0);
    let prev = 0;
    for (let t = 0.5; t <= 2000; t *= 1.3) {
      const d = plasticDamage(t, 450, 1);
      expect(d).toBeGreaterThanOrEqual(prev - 1e-12);
      prev = d;
    }
  });
  it('sekitar 65% bobot pada tahun ke-20', () => {
    expect(plasticDamage(20, 450, 1)).toBeCloseTo(0.65, 2);
    expect(plasticDamage(20, 450, 1.5)).toBeCloseTo(0.975, 2);
  });
  it('tetap naik setelah plastik hancur (mikroplastik menyebar)', () => {
    const atBreak = plasticDamage(50, 50, 0.8);
    const later = plasticDamage(100, 50, 0.8);
    expect(later).toBeGreaterThan(atBreak);
    expect(plasticDamage(1e6, 50, 1)).toBeLessThanOrEqual(1 + 1e-9);
  });
  it('organik tidak merusak tanah', () => {
    expect(simulate([{ D: 1, w: 0, organic: true }], 100).damage).toBe(0);
  });
});

describe('kesehatan tanah dari kerusakan', () => {
  it('dibatasi 0–100', () => {
    expect(healthFromDamage(0)).toBe(100);
    expect(healthFromDamage(-5)).toBe(100);
    expect(healthFromDamage(10, 10)).toBe(0);
    expect(healthFromDamage(999)).toBe(0);
    expect(healthFromDamage(2.5, 10)).toBe(75);
  });
  it('proyeksi dimulai dari kondisi sekarang', () => {
    const r = simulate([{ D: 450, w: 1 }], 0, { baseDamage: 3 });
    expect(r.health).toBe(70);
    const later = simulate([{ D: 450, w: 1 }], 100, { baseDamage: 3 });
    expect(later.health).toBeLessThan(70);
  });
});

describe('milestone caption', () => {
  it('urut berdasar tahun dan hanya jenis yang ada', () => {
    const list = milestones([
      { D: 450, w: 1, code: 1 },
      { D: 450, w: 1, code: 1 },
      { D: 1, w: 0, organic: true, key: 'kulitPisang' },
    ]);
    expect(list.map((m) => m.years)).toEqual([1, 450]);
    expect(latestMilestone(list, 0.5)).toBe(null);
    expect(latestMilestone(list, 100).key).toBe('kulitPisang');
    expect(latestMilestone(list, 500).code).toBe(1);
  });
});
