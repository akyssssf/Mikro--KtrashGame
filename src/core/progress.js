// Kemajuan pemain: satu objek data yang bisa disimpan. Setiap perubahan memicu 'change'.
import { Emitter } from './events.js';
import { loadGame, saveGame } from './save.js';

const BASE_CAPACITY = 10;
const BAG_BONUS = 4;

function fresh() {
  return {
    version: 1,
    area: 'hub',
    quest: 0,
    cards: [],
    tools: {},
    flags: {},
    items: {},
    basket: [],
    repaired: {},
    lens: {},
    sortSessions: 0,
    sortAccuracy: [],
    stats: { picked: 0, pickedByCode: {}, recycled: 0, reused: 0, bags: 0, buried: 0, composted: 0, wrong: 0 },
  };
}

export class Progress extends Emitter {
  #timer = 0;

  constructor() {
    super();
    this.data = fresh();
    this.saveOk = true;
    // Disimpan hanya setelah pemain benar-benar mulai (bukan saat menu judul).
    this.active = false;
  }

  load() {
    const saved = loadGame();
    if (saved?.version === 1) this.data = { ...fresh(), ...saved, stats: { ...fresh().stats, ...saved.stats } };
    this.emit('change', { kind: 'load' });
    return !!saved;
  }

  reset() {
    this.data = fresh();
    this.#persist();
    this.emit('change', { kind: 'reset' });
  }

  #changed(kind, detail) {
    clearTimeout(this.#timer);
    this.#timer = setTimeout(() => this.#persist(), 300);
    this.emit('change', { kind, ...detail });
  }

  #persist() {
    if (this.active) this.saveOk = saveGame(this.data);
  }

  flush() {
    clearTimeout(this.#timer);
    this.#persist();
  }

  // ---- item ----
  itemState(gid) { return this.data.items[gid]; }
  itemStatus(gid) { return this.data.items[gid]?.status ?? 'dunia'; }

  setItem(gid, patch) {
    this.data.items[gid] = { ...(this.data.items[gid] ?? {}), ...patch };
    this.#changed('item', { gid });
  }

  itemsWhere(pred) {
    return Object.entries(this.data.items).filter(([, v]) => pred(v)).map(([gid, v]) => ({ gid, ...v }));
  }

  // ---- keranjang ----
  get capacity() { return BASE_CAPACITY + (this.data.tools.tasKain ? BAG_BONUS : 0); }
  get basket() { return this.data.basket; }
  get basketFull() { return this.data.basket.length >= this.capacity; }

  addToBasket(gid, typeId, originArea, code) {
    this.data.basket.push(gid);
    this.data.items[gid] = { ...(this.data.items[gid] ?? {}), status: 'keranjang', type: typeId, origin: originArea };
    this.data.stats.picked += 1;
    if (typeof code === 'number') {
      const by = this.data.stats.pickedByCode;
      by[code] = (by[code] ?? 0) + 1;
    }
    this.#changed('pick', { gid, typeId, originArea, code });
  }

  removeFromBasket(gid, status, extra = {}) {
    this.data.basket = this.data.basket.filter((g) => g !== gid);
    this.data.items[gid] = { ...this.data.items[gid], status, ...extra };
    this.#changed('basket', { gid, status });
  }

  // ---- kartu, alat, flag ----
  hasCard(code) { return this.data.cards.includes(code); }

  unlockCard(code) {
    if (this.hasCard(code)) return false;
    this.data.cards.push(code);
    this.data.cards.sort((a, b) => a - b);
    this.#changed('card', { code });
    return true;
  }

  hasTool(tool) { return !!this.data.tools[tool]; }

  giveTool(tool) {
    if (this.hasTool(tool)) return false;
    this.data.tools[tool] = true;
    this.#changed('tool', { tool });
    return true;
  }

  flag(name) { return !!this.data.flags[name]; }

  setFlag(name, value = true) {
    if (this.data.flags[name] === value) return;
    this.data.flags[name] = value;
    this.#changed('flag', { name });
  }

  // ---- kesehatan & statistik ----
  repair(area, amount) {
    this.data.repaired[area] = (this.data.repaired[area] ?? 0) + amount;
    this.#changed('repair', { area });
  }

  stat(name, delta = 1) {
    this.data.stats[name] = (this.data.stats[name] ?? 0) + delta;
    this.#changed('stat', { name });
  }

  setLens(area, years) {
    this.data.lens[area] = Math.max(this.data.lens[area] ?? 0, years);
    this.#changed('lens', { area });
  }

  finishSort(accuracy) {
    this.data.sortSessions += 1;
    this.data.sortAccuracy.push(accuracy);
    this.#changed('sort', { accuracy });
  }

  setQuest(index) {
    this.data.quest = index;
    this.#changed('quest', { index });
  }

  setArea(id) {
    this.data.area = id;
    this.#changed('area', { id });
  }
}
