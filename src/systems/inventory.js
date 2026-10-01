// Aksi keranjang: pungut, buang sembarangan, pakai ulang, hasil pilah, tukar kresek.
import { ITEM_TYPES } from '../data/items.js';
import { HEALTH_CONFIG, PLASTICS } from '../data/plastics.js';
import { t } from '../data/dialogs.id.js';

export class Inventory {
  constructor(game) {
    this.game = game;
  }

  get progress() { return this.game.progress; }

  items() {
    return this.progress.basket.map((gid) => {
      const s = this.progress.itemState(gid);
      const type = ITEM_TYPES[s.type];
      return { gid, typeId: s.type, type, code: type.kode, origin: s.origin, name: t(`items.${s.type}`) };
    });
  }

  countCode(code) { return this.items().filter((i) => i.code === code).length; }

  pick(trash, area) {
    const g = this.game;
    if (this.progress.basketFull) {
      g.toast(t('toast.basketFull'), 'info');
      g.audio.basketFull();
      return false;
    }
    const code = trash.type.kode;
    area.removeTrash(trash.gid);
    g.audio.pick(trash.type);
    g.player.swing();
    trash.flyTo(() => g.player.position.clone().setY(1.3), () => g.effects.sparkle(g.player.position, 0xffd166));
    this.progress.addToBasket(trash.gid, trash.typeId, area.id, typeof code === 'number' ? code : null);
    const name = t(`items.${trash.typeId}`);
    if (typeof code === 'number' && this.progress.unlockCard(code)) {
      g.audio.card();
      g.toast(t('toast.newCard', { abbr: PLASTICS[code].abbr, code }), 'ok', 4200);
    } else {
      g.toast(t(code === 'organik' ? 'toast.pickedOrganic' : 'toast.picked', { item: name }), 'ok', 1600);
    }
    return true;
  }

  // Buang sembarangan: sampah terkubur di tempat pemain berdiri. Konsekuensi terlihat di Gerbang Waktu.
  dump(gid) {
    const g = this.game;
    const area = g.areas.current;
    const p = g.player.position;
    const s = this.progress.itemState(gid);
    this.progress.removeFromBasket(gid, 'terkubur', { buriedIn: area.id, pos: { x: p.x + 0.9, z: p.z + 0.4 } });
    this.progress.stat('buried');
    area.refreshBuried();
    g.audio.bury();
    g.effects.dust(p);
    g.toast(t('toast.buried', { item: t(`items.${s.type}`) }), 'bad', 3800);
    if (ITEM_TYPES[s.type].kode !== 'organik' && !this.progress.flag('reactedBuried')) {
      this.progress.setFlag('reactedBuried');
      g.say('buriedReact');
    }
  }

  reuse(gid) {
    const g = this.game;
    const s = this.progress.itemState(gid);
    const type = ITEM_TYPES[s.type];
    this.progress.removeFromBasket(gid, 'dipakaiUlang');
    this.progress.repair(s.origin, HEALTH_CONFIG.repair.reused);
    this.progress.stat('reused');
    g.audio.ok();
    g.toast(t('toast.reused', { item: t(`items.${s.type}`), result: t(`reuse.${type.reuseAs}`) }), 'ok', 3000);
  }

  // Hasil mini-game. Salah pilah → ikut tertimbun di tempat penimbunan desa.
  sorted(gid, correct) {
    const s = this.progress.itemState(gid);
    const organic = ITEM_TYPES[s.type].kode === 'organik';
    if (correct) {
      this.progress.removeFromBasket(gid, 'didaur');
      this.progress.repair(s.origin, organic ? HEALTH_CONFIG.repair.composted : HEALTH_CONFIG.repair.recycled);
      this.progress.stat(organic ? 'composted' : 'recycled');
    } else {
      const lf = this.game.areas.get('hub').data.landfill;
      const n = this.progress.data.stats.wrong;
      const pos = { x: lf.x + ((n * 1.3) % 3.4) - 1.2, z: lf.z + (Math.floor(n / 3) % 3) * 1.1 - 1 };
      this.progress.removeFromBasket(gid, 'terkubur', { buriedIn: 'hub', pos });
      this.progress.stat('wrong');
      this.progress.stat('buried');
    }
  }

  // Tukar kresek (kode 4) dengan tas kain.
  swapForBag(need) {
    const kresek = this.items().filter((i) => i.code === 4).slice(0, need);
    if (kresek.length < need) return false;
    for (const k of kresek) this.progress.removeFromBasket(k.gid, 'ditukar');
    this.progress.stat('bags');
    return true;
  }
}
