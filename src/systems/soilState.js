// Jembatan antara progres pemain dan fungsi murni soilHealth/timeSim.
import { decayOf, ITEM_TYPES } from '../data/items.js';
import { areaHealth, villageHealth } from './soilHealth.js';
import { AREA_DATA } from '../world/areaRegistry.js';

export class SoilState {
  constructor(progress) {
    this.progress = progress;
  }

  gid(areaId, itemId) { return `${areaId}:${itemId}`; }

  // Sampah yang masih tergeletak di area (belum dipungut).
  litter(areaId) {
    const data = AREA_DATA[areaId];
    return data.items
      .filter((it) => this.progress.itemStatus(this.gid(areaId, it.id)) === 'dunia')
      .map((it) => ({ gid: this.gid(areaId, it.id), type: it.type, ...decayOf(it.type) }));
  }

  // Sampah yang terkubur di area (dibuang sembarangan / salah pilah).
  buried(areaId) {
    return this.progress
      .itemsWhere((v) => v.status === 'terkubur' && v.buriedIn === areaId)
      .map((v) => ({ gid: v.gid, type: v.type, pos: v.pos, ...decayOf(v.type) }));
  }

  areaInput(areaId) {
    const data = AREA_DATA[areaId];
    return {
      legacy: data.legacy,
      repaired: this.progress.data.repaired[areaId] ?? 0,
      litter: this.litter(areaId),
      buried: this.buried(areaId),
    };
  }

  health(areaId) { return areaHealth(this.areaInput(areaId)); }

  healths() {
    return Object.fromEntries(Object.keys(AREA_DATA).map((id) => [id, this.health(id)]));
  }

  village() { return villageHealth(Object.values(this.healths())); }

  // Entri untuk timeSim: yang terkubur + yang dibiarkan (lama-lama ikut tertimbun).
  projectionEntries(areaId) {
    const toEntry = (it, buried) => {
      const type = ITEM_TYPES[it.type];
      return {
        D: it.D, w: it.w, organic: it.organic, type: it.type, gid: it.gid,
        code: type.kode === 'organik' ? null : type.kode, key: type.organic ?? null, buried,
      };
    };
    return [...this.buried(areaId).map((it) => toEntry(it, true)), ...this.litter(areaId).map((it) => toEntry(it, false))];
  }
}
