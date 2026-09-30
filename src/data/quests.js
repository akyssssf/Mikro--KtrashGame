// Alur misi slice. Objektif dibaca dari progres (bukan dihitung dari event),
// sehingga aman dimuat ulang dari simpanan.
// Tipe objektif: flag, tool, pickedInArea, pickedCode, sortSessions.

export const QUESTS = [
  { id: 'kenalan', area: 'hub', objectives: [{ id: 'bicara', type: 'flag', flag: 'talked_cing' }] },
  {
    id: 'pungutDesa',
    area: 'hub',
    objectives: [{ id: 'pungut', type: 'pickedInArea', area: 'hub', count: 3 }],
    reward: { tool: 'lensa' },
  },
  {
    id: 'sungai',
    area: 'sungai',
    objectives: [
      { id: 'jaring', type: 'tool', tool: 'jaring' },
      { id: 'botol', type: 'pickedCode', code: 1, count: 6 },
      { id: 'jalan', type: 'flag', flag: 'sungai_pathOpen' },
    ],
  },
  {
    id: 'pilah',
    area: 'hub',
    objectives: [{ id: 'pilah', type: 'sortSessions', count: 1 }],
    reward: { tool: 'pencapit' },
  },
  {
    id: 'pasar',
    area: 'pasar',
    objectives: [
      { id: 'kresek', type: 'pickedCode', code: 4, count: 5 },
      { id: 'tas', type: 'tool', tool: 'tasKain' },
      { id: 'saluran', type: 'flag', flag: 'pasar_drainClear' },
    ],
  },
  { id: 'pulang', area: 'hub', objectives: [{ id: 'gerbang', type: 'flag', flag: 'finalGate' }] },
  { id: 'bebas', area: null, objectives: [] },
];

export const questIndex = (id) => QUESTS.findIndex((q) => q.id === id);
