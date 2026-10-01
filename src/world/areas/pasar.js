// Area Pasar (LDPE): kresek di pagar/pohon, tukar kresek → tas kain, saluran mampet + Lensa Waktu.
import * as THREE from 'three';
import { Area, labelSprite } from '../area.js';
import { LensaWaktu } from '../../entities/lensaWaktu.js';
import { HEALTH_CONFIG, PLASTICS } from '../../data/plastics.js';
import { ITEM_TYPES } from '../../data/items.js';
import { t } from '../../data/dialogs.id.js';
import { flatPath } from '../diorama.js';
import { box, cyl, mat, mesh, place } from '../builders.js';
import { asset, bush, crate, fence, lamp, produce, rock, stall, tree, villager } from '../props.js';
import { clamp, progressOf } from '../../systems/timeSim.js';
import { hasAsset } from '../../core/assets.js';

const PROOF_YEARS = 10;
const MERCHANTS = {
  busari: { shirt: 0x1a7f3d, skin: 0xf3c9a0, hair: 0x3b2a1a, key: 'npc_busari' },
  darto: { shirt: 0x2563eb, skin: 0xd9a578, hair: 0x1f2937, key: 'npc_darto' },
  buah: { shirt: 0xf59e0b }, roti: { shirt: 0xdb2777, hair: 0x7c2d12, hue: 0.12 }, ikan: { shirt: 0x0f766e, hue: 0.5 }, kue: { shirt: 0x7e22ce, hue: 0.8 },
};

export default class PasarArea extends Area {
  buildContent() {
    const d = this.data;
    const P = this.props;
    const C = this.collision;

    P.add(flatPath([[-24, 1], [-10, 0.5], [0, 0.8], [12, 0.5], [24, 0.8]], 5, 0xd9c08c));
    this.noGrass.push({ x: 0, z: 0.7, hw: 24, hd: 3.2 });

    for (const s of d.stalls) {
      const north = s.facing === 'north';
      const g = stall({ awning: s.awning });
      if (g.userData.asset) {
        // Lapak dari aset: dagangan cukup keranjang di depan lapak.
        g.add(place(asset('produceBasket') ?? produce(s.goods, 6), 0.9, 0, 1.45));
      } else if (s.goods === 'bags') {
        for (let i = 0; i < 4; i++) g.add(box(0.45, 0.5, 0.12, [0xe9d8b4, 0x1a7f3d, 0xf08a2c, 0xe9d8b4][i], -1 + i * 0.65, 1.22, 0.7));
      } else {
        const goods = produce(s.goods, 6);
        goods.position.set(-0.6, 0.45, 0.7);
        const goods2 = produce(s.goods, 6);
        goods2.position.set(0.6, 0.45, 0.7);
        g.add(goods, goods2);
      }
      const seller = villager(MERCHANTS[s.id]);
      seller.position.set(0, 0, -0.35);
      g.add(seller);
      place(g, s.x, 0, s.z, north ? Math.PI : 0);
      P.add(g);
      C.addBox(s.x, s.z, 1.75, 1.15);
      this.noGrass.push({ x: s.x, z: s.z, hw: 2.2, hd: 1.6 });
      P.add(place(crate(), s.x + 2.1, 0, s.z + (north ? -0.6 : 0.6)));
      C.addBox(s.x + 2.1, s.z + (north ? -0.6 : 0.6), 0.4, 0.3);
    }

    this.#busari();
    this.#drain();

    // Pagar utara tempat kresek tersangkut.
    for (let x = -18; x <= 18; x += 6) P.add(place(fence(6), x, 0, d.fenceZ));
    C.addBox(0, d.fenceZ, 21, 0.18);
    // Pohon tempat kresek tersangkut di dahan + pepohonan lain.
    for (const [x, z, s] of [[-16.3, -8.4, 1.1], [16.4, 11.5, 1.1], [-20, 12, 1], [21, -9, 0.9], [-4, 13.5, 1], [19, 4.5, 0.9], [-21, -3, 0.9]]) {
      P.add(place(tree(s, Math.floor(this.rand() * 2)), x, 0, z, this.rand() * 6));
      C.addCircle(x, z, 0.45 * s);
    }
    for (const [x, z] of [[-13, 12], [2, 13.5], [12, -9.5], [-8, -9.5], [22, 13]]) {
      P.add(place(bush(1), x, 0, z));
      C.addCircle(x, z, 0.6);
    }
    for (const [x, z] of [[-22, 8], [14, 15], [22, -14]]) {
      P.add(place(rock(1.1), x, 0, z));
      C.addCircle(x, z, 0.7);
    }
    for (const x of [-14, 0, 14]) {
      P.add(place(lamp(), x, 0, -3.1));
      C.addCircle(x, -3.1, 0.2);
    }
    this.#bunting();
    this.addPortal({ x: d.exit.x, z: d.exit.z, target: 'hub', label: t('areas.hub.name'), arrow: -1 });
  }

  // Tali bendera warna-warni di atas jalan.
  #bunting() {
    const from = -18.6;
    const to = 19;
    if (hasAsset('bunting')) {
      const n = 6;
      const span = (to - from) / n;
      for (let i = 0; i < n; i++) {
        const seg = asset('bunting');
        seg.scale.x = span / 6.56;
        this.props.add(place(seg, from + (i + 0.5) * span, 1.25, 0.8));
      }
    }
    const colors = [0xe2483d, 0xf5b82e, 0x1a7f3d, 0x2563eb, 0xf08a2c];
    const g = new THREE.Group();
    for (let i = 0; i < (hasAsset('bunting') ? 0 : 30); i++) {
      const x = -18 + i * 1.25;
      const flag = mesh(new THREE.ConeGeometry(0.25, 0.5, 3), mat(colors[i % colors.length]), x, 3.2 - Math.sin(((i % 10) / 10) * Math.PI) * 0.4, 0.8);
      flag.rotation.x = Math.PI;
      g.add(flag);
    }
    for (const x of [from, to]) g.add(cyl(0.07, 0.07, 3.4, 0x7a5230, x, 1.7, 0.8, 6));
    this.props.add(g);
    this.collision.addCircle(-18.6, 0.8, 0.15);
    this.collision.addCircle(19, 0.8, 0.15);
  }

  #busari() {
    const s = this.data.stalls.find((x) => x.id === 'busari');
    const label = labelSprite(t('places.busari'), { bg: '#d9f7e3', scale: 0.75 });
    label.position.set(s.x, 3.4, s.z + 0.4);
    this.root.add(label);
    this.addInteractable({
      id: 'busari',
      kind: 'npc',
      position: new THREE.Vector3(s.x, 0, s.z + 1.7),
      height: 2.6,
      range: 2.4,
      prompt: () => ({ verb: this.progress.hasTool('tasKain') ? t('prompts.talk') : t('prompts.swap') }),
      action: () => this.#talkBusari(),
    });
  }

  #talkBusari() {
    const g = this.game;
    const need = this.data.bagSwap.need;
    if (this.progress.hasTool('tasKain')) { g.say('busariAfter'); return; }
    const have = g.inventory.countCode(4);
    if (have < need) {
      g.say('busariNeed', { need });
      g.toast(t('toast.notEnoughKresek', { need, have }), 'info', 3200);
      return;
    }
    g.say('busariSwap', {}, () => {
      g.inventory.swapForBag(need);
      this.progress.repair(this.id, HEALTH_CONFIG.repair.bagSwap);
      g.giveTool('tasKain');
    });
  }

  #drain() {
    const d = this.data.drain;
    const P = this.props;
    const darto = this.data.stalls.find((x) => x.id === 'darto');
    // Saluran + jeruji.
    P.add(box(d.length, 0.06, 0.9, 0x4b5563, d.x, 0.03, d.z));
    P.add(box(d.length, 0.12, 0.1, 0x9ca3af, d.x, 0.06, d.z - 0.5), box(d.length, 0.12, 0.1, 0x9ca3af, d.x, 0.06, d.z + 0.5));
    this.grate = new THREE.Group();
    const grateAsset = asset('drainGrate', 1.2);
    if (grateAsset) this.grate.add(grateAsset);
    else for (let i = 0; i < 7; i++) this.grate.add(box(0.08, 0.08, 0.95, 0x374151, -0.9 + i * 0.3, 0.12, 0));
    this.grate.position.set(d.x, 0, d.z);
    this.root.add(this.grate);
    this.noGrass.push({ x: d.x, z: d.z, hw: d.length / 2 + 0.3, hd: 0.9 });
    // Genangan air karena saluran mampet.
    this.puddleMat = new THREE.MeshStandardMaterial({ color: 0x6b9ab8, transparent: true, opacity: 0.7, roughness: 0.2 });
    this.puddle = mesh(new THREE.CircleGeometry(2.4, 24), this.puddleMat, d.x - 0.6, 0.035, d.z + 1.6);
    this.puddle.rotation.x = -Math.PI / 2;
    this.puddle.castShadow = false;
    this.root.add(this.puddle);

    const label = labelSprite(t('places.darto'), { bg: '#dbeafe', scale: 0.75 });
    label.position.set(darto.x, 3.4, darto.z + 0.4);
    this.root.add(label);
    this.addInteractable({
      id: 'darto',
      kind: 'npc',
      position: new THREE.Vector3(darto.x - 1.2, 0, darto.z + 1.7),
      height: 2.6,
      range: 2.2,
      prompt: () => ({ verb: t('prompts.talk') }),
      action: () => this.#talkDarto(),
    });

    this.lens = new LensaWaktu(this.data.lens);
    this.root.add(this.lens.group);
    this.addInteractable({
      id: 'lensSocket',
      kind: 'lens',
      position: this.lens.socket,
      height: 1.6,
      range: 2.3,
      enabled: () => !this.progress.flag('pasar_drainClear'),
      prompt: () => (this.progress.hasTool('lensa') ? { verb: t('prompts.lens') } : { verb: t('prompts.lensNeed'), warn: true }),
      action: () => this.#useLens(),
    });
  }

  #talkDarto() {
    const p = this.progress;
    if (p.flag('pasar_drainClear')) this.game.say('dartoDone');
    else if (p.flag('pasar_grateOpen')) this.game.say('dartoAfterLens');
    else this.game.say('dartoBefore');
  }

  // Kresek di saluran baru bisa diambil setelah Pak Darto yakin (jeruji dibuka).
  trashPrompt(trash, it) {
    if (it.special === 'drain' && !this.progress.flag('pasar_grateOpen')) return { verb: t('prompts.pull'), warn: true };
    return super.trashPrompt(trash, it);
  }

  onTrashAction(trash, it) {
    if (it.special === 'drain') {
      if (!this.progress.flag('pasar_grateOpen')) { this.game.toast(t('toast.wedged'), 'info', 3200); return; }
      if (!this.game.inventory.pick(trash, this)) return;
      this.progress.repair(this.id, HEALTH_CONFIG.repair.drainCleared);
      this.progress.setFlag('pasar_drainClear');
      this.game.toast(t('toast.drainClear'), 'ok');
      this.game.say('dartoDone');
      return;
    }
    super.onTrashAction(trash, it);
  }

  #drainTrash() { return [...this.trash.values()].find((tr) => tr.itemId === 'pDrain'); }

  #useLens() {
    if (!this.progress.hasTool('lensa')) { this.game.toast(t('prompts.lensNeed'), 'info'); return; }
    const targets = [];
    for (const tr of this.trash.values()) {
      if (!this.lens.contains(tr.position.x, tr.position.z)) continue;
      const kode = ITEM_TYPES[tr.typeId].kode;
      if (typeof kode !== 'number') continue;
      const { D, w } = PLASTICS[kode];
      tr.setHighlight(true);
      targets.push({ typeId: tr.typeId, code: kode, D, w, organic: false, apply: (y) => tr.setWear(clamp((progressOf(y, D) - 0.15) / 0.85, 0, 1)) });
    }
    this.game.openLens(this, this.lens, targets, (reached) => this.#lensClosed(reached));
  }

  #lensClosed(reached) {
    for (const tr of this.trash.values()) tr.setHighlight(false);
    this.progress.setLens(this.id, reached);
    if (this.progress.flag('pasar_grateOpen') || !this.#drainTrash()) return;
    if (reached >= PROOF_YEARS) {
      this.progress.setFlag('pasar_grateOpen');
      this.#openGrate();
      this.game.say('dartoAfterLens');
    } else {
      this.game.say('dartoLensShort');
    }
  }

  #openGrate() {
    this.grate.position.x = this.data.drain.x + 1.6;
    this.grate.rotation.z = 0.2;
  }

  spawnTrash() {
    super.spawnTrash();
    const years = this.progress.data.lens[this.id] ?? 0;
    const drainTrash = this.#drainTrash();
    if (years > 0 && drainTrash) {
      const { D } = PLASTICS[4];
      drainTrash.setWear(clamp((progressOf(years, D) - 0.15) / 0.85, 0, 1));
    }
    if (this.progress.flag('pasar_grateOpen')) this.#openGrate();
  }

  update(dt, time) {
    const clear = this.progress.flag('pasar_drainClear');
    const s = this.puddle.scale.x + ((clear ? 0.01 : 1) - this.puddle.scale.x) * Math.min(1, dt * 0.8);
    this.puddle.scale.setScalar(s);
    this.puddle.visible = s > 0.02;
    const motion = this.game.reducedMotion ? 0.2 : 1;
    for (const tr of this.trash.values()) {
      if (tr.type.kode !== 4 || tr.flying) continue;
      tr.model.rotation.z = Math.sin(time * 2 + tr.position.x) * 0.12 * motion;
    }
    this.lens.update(dt, time, this.game.reducedMotion);
    super.update(dt, time);
  }
}
