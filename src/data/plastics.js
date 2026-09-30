// Satu-satunya tempat angka lama terurai. Guru/penantang boleh mengganti angka di sini.
// D = perkiraan tahun sampai hancur (menjadi mikroplastik), w = bobot kerusakan tanah.
// Teks (nama, contoh, catatan) ada di dialogs.id.js supaya siap diterjemahkan.

export const PLASTICS = {
  1: { code: 1, abbr: 'PET', color: '#2563eb', D: 450, w: 1.0, foodSafe: 'sekali', reuse: false, recycle: true },
  2: { code: 2, abbr: 'HDPE', color: '#c2620a', D: 100, w: 1.0, foodSafe: 'ya', reuse: true, recycle: true },
  3: { code: 3, abbr: 'PVC', color: '#15803d', D: 400, w: 1.5, foodSafe: 'tidak', reuse: false, recycle: false },
  4: { code: 4, abbr: 'LDPE', color: '#0f766e', D: 200, w: 1.0, foodSafe: 'ya', reuse: false, recycle: false },
  5: { code: 5, abbr: 'PP', color: '#dc2626', D: 50, w: 0.8, foodSafe: 'ya', reuse: true, recycle: true },
  6: { code: 6, abbr: 'PS', color: '#7e22ce', D: 500, w: 1.5, foodSafe: 'tidak', reuse: false, recycle: false },
  7: { code: 7, abbr: 'Other', color: '#475569', D: 1000, w: 1.5, foodSafe: 'tidak', reuse: false, recycle: false },
};

export const PLASTIC_CODES = [1, 2, 3, 4, 5, 6, 7];

// Organik: perkiraan lama berubah jadi tanah (tahun). Tidak merusak tanah.
export const ORGANIC_DECAY = {
  daun: 5 / 12,
  kulitPisang: 1,
};

export const ORGANIC_COLOR = '#4d7c0f';

export const SIM_CONFIG = {
  // soilHealth = clamp(100 − 100 × Σ kerusakan / ref)
  ref: 10,
  // Kerusakan plastik naik ke ~65% bobot dalam ±20 tahun pertama.
  earlyShare: 0.65,
  earlyYears: 20,
  // Sisa bobot bertambah pelan sebelum hancur, lalu mikroplastik terus menyebar.
  midShare: 0.1,
  lateShare: 0.25,
  maxYears: 1000,
  minYears: 0.1,
};

// Angka kondisi sekarang (disederhanakan untuk game), dipakai soilHealth.js.
export const HEALTH_CONFIG = {
  litterFactor: 0.4,
  buriedFactor: 0.4,
  repair: {
    recycled: 0.35,
    composted: 0.15,
    reused: 0.5,
    bagSwap: 1.5,
    drainCleared: 1.0,
    pathOpened: 0.3,
  },
};
