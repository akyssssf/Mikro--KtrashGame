// Desa Lestari (hub). Koordinat dalam meter di bidang XZ; z negatif = utara (jauh dari kamera).
export default {
  id: 'hub',
  order: 0,
  codes: [],
  legacy: 2.5,
  size: { hw: 24, hd: 20, r: 7 },
  spawn: { x: -2, z: 9 },
  gate: { x: 0, z: -6 },
  well: { x: -6, z: 3 },
  cing: { x: -4.4, z: 4.6 },
  recycle: { x: 13.2, z: 2, front: { x: 10.2, z: 2 } },
  landfill: { x: 17.5, z: 9 },
  items: [
    { id: 'h1', type: 'gelasPlastik', x: 3, z: 4.5 },
    { id: 'h2', type: 'botolSampo', x: -9, z: -3 },
    { id: 'h3', type: 'kotakStyrofoam', x: 6, z: 9 },
    { id: 'h4', type: 'daun', x: -1.5, z: 12 },
    { id: 'h5', type: 'kulitPisang', x: 8, z: -3 },
    { id: 'h6', type: 'gelasPlastik', x: -12, z: 13 },
    { id: 'h7', type: 'wadahMakanan', x: 15, z: -9 },
  ],
};
