// Katalog jenis sampah. Nama tampil ada di dialogs.id.js (items.<id>).
// kode: 1–7 untuk plastik, 'organik' untuk sampah organik.
// reuseAs: kunci teks hasil pakai ulang (hanya untuk yang masuk akal).
import { ORGANIC_DECAY, PLASTICS } from './plastics.js';

export const ITEM_TYPES = {
  botolAir: { kode: 1, model: 'bottleWater' },
  botolSoda: { kode: 1, model: 'bottleSoda' },
  botolSampo: { kode: 2, model: 'bottleShampoo', reuseAs: 'pot' },
  jeriken: { kode: 2, model: 'jerrycan', reuseAs: 'penyiram' },
  pipa: { kode: 3, model: 'pipe' },
  kresek: { kode: 4, model: 'kresek' },
  kresekHitam: { kode: 4, model: 'kresekBlack' },
  bungkusRoti: { kode: 4, model: 'breadBag' },
  gelasPlastik: { kode: 5, model: 'cupStraw', reuseAs: 'potBibit' },
  wadahMakanan: { kode: 5, model: 'foodBox', reuseAs: 'wadah' },
  kotakStyrofoam: { kode: 6, model: 'foamBox' },
  galon: { kode: 7, model: 'gallon' },
  daun: { kode: 'organik', model: 'leaf', organic: 'daun' },
  kulitPisang: { kode: 'organik', model: 'banana', organic: 'kulitPisang' },
};

export const isPlastic = (typeId) => typeof ITEM_TYPES[typeId]?.kode === 'number';

// Perkiraan lama terurai (tahun) dan bobot kerusakan untuk satu jenis sampah.
export function decayOf(typeId) {
  const t = ITEM_TYPES[typeId];
  if (!t) throw new Error(`Jenis sampah tidak dikenal: ${typeId}`);
  if (t.kode === 'organik') return { D: ORGANIC_DECAY[t.organic], w: 0, organic: true };
  const p = PLASTICS[t.kode];
  return { D: p.D, w: p.w, organic: false };
}
