// Area terdaftar otomatis: cukup tambah data/areas/<id>.js dan world/areas/<id>.js.
import { PLASTIC_CODES } from '../data/plastics.js';

const dataModules = import.meta.glob('../data/areas/*.js', { eager: true });

export const AREA_DATA = Object.fromEntries(
  Object.values(dataModules)
    .map((m) => m.default)
    .sort((a, b) => a.order - b.order)
    .map((d) => [d.id, d]),
);

export const AREA_IDS = Object.keys(AREA_DATA);

// Jenis plastik yang belum punya area (ditampilkan sebagai papan "segera hadir" di desa).
export const FUTURE_CODES = PLASTIC_CODES.filter((c) => !AREA_IDS.some((id) => AREA_DATA[id].codes.includes(c)));
