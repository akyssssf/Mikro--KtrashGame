// Misi dibaca dari progres. Saat semua objektif terpenuhi: beri hadiah, maju ke misi berikutnya.
import { QUESTS, questIndex } from '../data/quests.js';
import { AREA_DATA } from '../world/areaRegistry.js';

export class Quests {
  constructor(game) {
    this.game = game;
  }

  get progress() { return this.game.progress; }
  get index() { return Math.min(this.progress.data.quest, QUESTS.length - 1); }
  get active() { return QUESTS[this.index]; }
  get activeId() { return this.active.id; }

  reached(id) { return this.index >= questIndex(id); }
  passed(id) { return this.index > questIndex(id); }

  isAreaUnlocked(areaId) {
    const after = AREA_DATA[areaId]?.unlockAfter;
    return !after || this.passed(after);
  }

  value(obj) {
    const p = this.progress;
    switch (obj.type) {
      case 'flag': return p.flag(obj.flag) ? 1 : 0;
      case 'tool': return p.hasTool(obj.tool) ? 1 : 0;
      case 'sortSessions': return p.data.sortSessions;
      case 'pickedCode': return p.data.stats.pickedByCode[obj.code] ?? 0;
      case 'pickedInArea': {
        const items = AREA_DATA[obj.area].items;
        return items.filter((it) => p.itemStatus(`${obj.area}:${it.id}`) !== 'dunia').length;
      }
      default: return 0;
    }
  }

  objectives(quest = this.active) {
    return quest.objectives.map((o) => {
      const need = o.count ?? 1;
      const have = Math.min(need, this.value(o));
      return { ...o, need, have, done: have >= need };
    });
  }

  // Dipanggil setiap progres berubah. Mengembalikan id misi yang baru selesai (bisa beruntun,
  // mis. pemain sudah memilah sebelum misi "pilah" aktif).
  check() {
    if (this.checking) return [];
    this.checking = true;
    const done = [];
    for (;;) {
      const q = this.active;
      if (!q.objectives.length || !this.objectives(q).every((o) => o.done)) break;
      // Hadiah memicu 'change' lagi; flag checking mencegah misi maju dua kali.
      this.progress.setQuest(this.index + 1);
      if (q.reward?.tool) this.game.giveTool(q.reward.tool);
      done.push(q.id);
    }
    this.checking = false;
    return done;
  }
}
