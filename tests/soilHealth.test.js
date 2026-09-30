import { describe, expect, it } from 'vitest';
import { approach, areaDamage, areaHealth, moodOf, outcomeOf, villageHealth } from '../src/systems/soilHealth.js';

describe('soilHealth area', () => {
  it('tanah bersih = 100', () => {
    expect(areaHealth({ legacy: 0, litter: [], buried: [] })).toBe(100);
  });
  it('sampah berserakan dan terkubur menurunkan kesehatan', () => {
    const clean = areaHealth({ legacy: 1 });
    const dirty = areaHealth({ legacy: 1, litter: [{ w: 1 }, { w: 1 }] });
    const buried = areaHealth({ legacy: 1, buried: [{ w: 1.5 }] });
    expect(dirty).toBeLessThan(clean);
    expect(buried).toBeLessThan(clean);
  });
  it('organik (w = 0) tidak merusak', () => {
    expect(areaHealth({ legacy: 0, litter: [{ w: 0 }, { w: 0 }] })).toBe(100);
  });
  it('perbaikan tidak bisa membuat pencemaran lama negatif', () => {
    expect(areaDamage({ legacy: 2, repaired: 10 })).toBe(0);
    expect(areaDamage({ legacy: 2, repaired: 10, litter: [{ w: 1 }] })).toBeCloseTo(0.4, 6);
  });
  it('selalu di rentang 0–100', () => {
    const many = Array.from({ length: 200 }, () => ({ w: 1.5 }));
    expect(areaHealth({ legacy: 50, litter: many, buried: many })).toBe(0);
    expect(areaHealth({ legacy: -3 })).toBe(100);
  });
});

describe('desa, suasana hati, hasil akhir', () => {
  it('rata-rata area', () => {
    expect(villageHealth([100, 50, 0])).toBe(50);
    expect(villageHealth([])).toBe(100);
  });
  it('ekspresi Cing', () => {
    expect(moodOf(90)).toBe('ceria');
    expect(moodOf(55)).toBe('biasa');
    expect(moodOf(10)).toBe('lesu');
  });
  it('hasil akhir', () => {
    expect(outcomeOf(80)).toBe('subur');
    expect(outcomeOf(50)).toBe('pulih');
    expect(outcomeOf(20)).toBe('kusam');
  });
  it('transisi halus menuju target', () => {
    const a = approach(0, 100, 0.1);
    expect(a).toBeGreaterThan(0);
    expect(a).toBeLessThan(100);
    expect(approach(0, 100, 100)).toBeCloseTo(100, 3);
    expect(approach(40, 40, 1)).toBe(40);
  });
});
