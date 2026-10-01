// Area Sungai (PET): botol di tepi dan hanyut, jaring, jembatan, puzzle Lensa Waktu tumpukan organik.
import * as THREE from 'three';
import { Area } from '../area.js';
import { Trash } from '../../entities/trash.js';
import { LensaWaktu } from '../../entities/lensaWaktu.js';
import { HEALTH_CONFIG, ORGANIC_DECAY, PLASTICS } from '../../data/plastics.js';
import { ITEM_TYPES } from '../../data/items.js';
import { t } from '../../data/dialogs.id.js';
import { buildRiver, distanceToCurve, riverColliders } from '../water.js';
import { clamp, progressOf } from '../../systems/timeSim.js';
import { makeItemModel } from '../items3d.js';
import { bake, box, cyl, place, toon } from '../builders.js';
import { asset, bridge, bush, fence, house, rock, tree, villager } from '../props.js';

const FLOAT_SPEED = 0.9;

export default class SungaiArea extends Area {
  buildContent() {
    const d = this.data;
    const P = this.props;
    const C = this.collision;

    // Sungai + kolisi air dalam.
    this.river = buildRiver(d.river.points, d.river.width);
    this.root.add(this.river.group);
    riverColliders(C, this.river.curve, d.river.width);
    this.riverSamples = this.river.curve.getSpacedPoints(160);

    for (const b of d.river.bridges) {
      P.add(place(bridge(b.length), b.x, 0, b.z, Math.PI / 2));
      C.addBridge(b.x, b.z, b.length / 2, 1.05);
      C.addBox(b.x, b.z - 1.2, b.length / 2, 0.12);
      C.addBox(b.x, b.z + 1.2, b.length / 2, 0.12);
      this.noGrass.push({ x: b.x, z: b.z, hw: b.length / 2 + 0.5, hd: 1.6 });
    }

    // Pondok nelayan + rak jaring.
    P.add(place(asset('fishingHut') ?? house({ wall: 0xc9a06a, roof: 0x8b5a2b, w: 3.4, d: 3, h: 2.1 }), d.hut.x, 0, d.hut.z, -0.3));
    C.addBox(d.hut.x, d.hut.z, 1.8, 1.6, -0.3);
    this.noGrass.push({ x: d.hut.x, z: d.hut.z, r: 2.8 });
    let rack = asset('netRack', 0.75);
    if (!rack) {
      rack = new THREE.Group();
      rack.add(box(0.12, 1.6, 0.12, 0x7a5230, -0.7, 0.8, 0), box(0.12, 1.6, 0.12, 0x7a5230, 0.7, 0.8, 0), box(1.6, 0.1, 0.1, 0x7a5230, 0, 1.55, 0));
    }
    P.add(place(rack, d.netRack.x, 0, d.netRack.z));
    C.addBox(d.netRack.x, d.netRack.z, 0.85, 0.2);
    this.rackNet = asset('net');
    if (this.rackNet) {
      this.rackNet.position.set(d.netRack.x + 0.4, 0, d.netRack.z + 0.25);
      this.rackNet.rotation.z = -0.15;
    } else {
      this.rackNet = new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.9, 8, 1, true), toon({ color: 0xf5f0e1, side: THREE.DoubleSide, transparent: true, opacity: 0.9 }));
      this.rackNet.position.set(d.netRack.x, 1.05, d.netRack.z);
      this.rackNet.rotation.x = Math.PI;
    }
    this.rackNet.visible = !this.progress.hasTool('jaring');
    this.root.add(this.rackNet);
    this.addInteractable({
      id: 'netRack',
      kind: 'tool',
      position: new THREE.Vector3(d.netRack.x, 0, d.netRack.z + 0.4),
      height: 2.2,
      enabled: () => !this.progress.hasTool('jaring'),
      prompt: () => ({ verb: `${t('prompts.take')}: ${t('tools.jaring')}` }),
      action: () => {
        this.rackNet.visible = false;
        this.game.giveTool('jaring');
      },
    });

    const fisher = villager({ shirt: 0xb45309, hair: 0x6b7280, key: 'npc_udin' });
    place(fisher, d.fisher.x, 0, d.fisher.z, Math.PI * 0.9);
    P.add(fisher);
    C.addCircle(d.fisher.x, d.fisher.z, 0.45);
    this.addInteractable({
      id: 'fisher',
      kind: 'npc',
      position: new THREE.Vector3(d.fisher.x, 0, d.fisher.z),
      height: 2.4,
      prompt: () => ({ verb: t('prompts.talk') }),
      action: () => this.game.say('nelayan'),
    });

    this.#buildWallAndPile();

    // Pepohonan dan batu (hindari air).
    const spots = [[20, 14], [23, -6], [8, 15], [-20, 3], [-22, 15], [-15, -17], [-21, -6], [2, 17], [18, -18], [5, -17], [-12, 3], [9, 9]];
    for (const [x, z] of spots) {
      if (distanceToCurve(this.riverSamples, x, z) < d.river.width) continue;
      const s = 0.9 + this.rand() * 0.4;
      P.add(place(tree(s, Math.floor(this.rand() * 2)), x, 0, z, this.rand() * 6));
      C.addCircle(x, z, 0.45 * s);
    }
    for (const [x, z] of [[1, 8], [-10, -9], [16, 1], [-17, 12], [6, -2]]) {
      P.add(place(bush(1), x, 0, z));
      C.addCircle(x, z, 0.6);
    }
    // Alang-alang di tepi sungai.
    for (let i = 0; i < 26; i++) {
      const u = i / 26;
      const p = this.river.curve.getPointAt(u);
      const tan = this.river.curve.getTangentAt(u);
      const side = i % 2 ? 1 : -1;
      const x = p.x - tan.z * side * (d.river.width / 2 + 0.6);
      const z = p.z + tan.x * side * (d.river.width / 2 + 0.6);
      if (d.river.bridges.some((b) => Math.abs(z - b.z) < 1.8)) continue;
      let reed = asset('reeds', 0.7);
      if (!reed) {
        reed = new THREE.Group();
        reed.add(cyl(0.03, 0.03, 1, 0x5a8f3a, 0, 0.5, 0, 4), cyl(0.06, 0.06, 0.25, 0x7a5230, 0, 1, 0, 5));
      }
      reed.userData.batch = 'foliage';
      P.add(place(reed, x, 0, z, this.rand() * 6));
    }

    this.addPortal({ x: d.exit.x, z: d.exit.z, target: 'hub', label: t('areas.hub.name'), arrow: 1 });
    P.add(place(fence(3, 0xc79a63), 24.5, 0, -3.2, Math.PI / 2));
  }

  #buildWallAndPile() {
    const d = this.data;
    const w = d.wall;
    const [g0, g1] = w.gapX;
    const hw = d.size.hw;
    for (const [a, b] of [[w.fromX, g0], [g1, hw]]) {
      this.collision.addBox((a + b) / 2, w.z, (b - a) / 2, 0.75);
      const segments = Math.max(1, Math.round((b - a) / 2.3));
      for (let i = 0; i < segments; i++) {
        const x = a + (i + 0.5) * ((b - a) / segments);
        const seg = asset('rockWall', 1.15);
        if (seg) {
          seg.scale.x *= (b - a) / segments / 2.6;
          this.props.add(place(seg, x, 0, w.z + (this.rand() - 0.5) * 0.2, i % 2 ? Math.PI : 0));
        } else {
          this.props.add(place(rock(1.3, 0x9aa0a6), x, 0, w.z, this.rand() * 6));
        }
      }
      this.noGrass.push({ x: (a + b) / 2, z: w.z, hw: (b - a) / 2, hd: 1 });
    }

    // Tumpukan daun + kulit pisang yang menutup celah.
    this.pile = new THREE.Group();
    const pileAsset = asset('leafPile', 1.05);
    if (pileAsset) this.pile.add(pileAsset);
    for (let i = 0; i < (pileAsset ? 0 : 14); i++) {
      const model = makeItemModel(i % 3 ? 'leaf' : 'banana', 0.55 + this.rand() * 0.25);
      model.position.set((this.rand() - 0.5) * 2.2, i * 0.07, (this.rand() - 0.5) * 1.2);
      model.rotation.set(this.rand() * 0.6, this.rand() * 6, this.rand() * 0.6);
      this.pile.add(model);
    }
    const mound = new THREE.Mesh(new THREE.SphereGeometry(1.2, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), toon({ color: 0x6f7d2f, flatShading: true }));
    mound.scale.set(1.2, 0.55, 0.8);
    mound.castShadow = true;
    if (!pileAsset) this.pile.add(mound);
    // Satu mesh gabungan; warnanya dikusamkan lewat material (vertex color × warna material).
    this.pileMat = toon({ vertexColors: true, roughness: 0.8, flatShading: true });
    bake(this.pile, { batchMaterials: { static: this.pileMat } });
    this.pile.position.set(d.pile.x, 0, d.pile.z);
    this.root.add(this.pile);
    this.pileCollider = this.collision.addBox(d.pile.x, d.pile.z, 1.3, 0.9);
    this.addInteractable({
      id: 'pile',
      kind: 'info',
      position: new THREE.Vector3(d.pile.x, 0, d.pile.z + 1),
      height: 2,
      range: 2.2,
      enabled: () => !this.progress.flag('sungai_pathOpen'),
      prompt: () => ({ verb: t('items.tumpukanDaun'), warn: true }),
      action: () => this.game.say('pileInfo'),
    });

    this.lens = new LensaWaktu(d.lens);
    this.root.add(this.lens.group);
    this.addInteractable({
      id: 'lensSocket',
      kind: 'lens',
      position: this.lens.socket,
      height: 1.6,
      range: 2.3,
      prompt: () => (this.progress.hasTool('lensa') ? { verb: t('prompts.lens') } : { verb: t('prompts.lensNeed'), warn: true }),
      action: () => this.#useLens(),
    });
  }

  createTrash(it, gid) {
    if (it.floating === undefined) return super.createTrash(it, gid);
    const trash = new Trash({ gid, itemId: it.id, typeId: it.type, lying: true });
    trash.float = { u: it.floating, phase: this.rand() * 6.28 };
    return trash;
  }

  trashInteractable(trash, it) {
    const base = super.trashInteractable(trash, it);
    if (!trash.float) return base;
    return {
      ...base,
      range: 3.8,
      pickable: false,
      prompt: () => {
        if (!this.progress.hasTool('jaring')) return { verb: t('prompts.netNeed'), warn: true };
        if (this.progress.basketFull) return { verb: t('prompts.full'), warn: true };
        return { verb: t('prompts.net') };
      },
      action: () => {
        if (!this.progress.hasTool('jaring')) { this.game.toast(t('toast.needNet'), 'info'); return; }
        this.game.audio.netSwing();
        this.game.audio.splash();
        this.game.effects.burst(trash.position, 0x8fd0f2, 14, { up: 3 });
        this.game.pickTrash(trash, this);
      },
    };
  }

  // Target Lensa Waktu: tumpukan organik + sampah di dalam lingkaran lensa.
  #lensTargets() {
    const targets = [];
    if (!this.progress.flag('sungai_pathOpen')) {
      targets.push({
        typeId: 'kulitPisang', key: 'kulitPisang', D: this.data.pile.D, organic: true,
        apply: (years) => this.#applyPile(years),
      });
      targets.push({ typeId: 'daun', key: 'daun', D: ORGANIC_DECAY.daun, organic: true, apply: () => {} });
    }
    for (const tr of this.trash.values()) {
      if (tr.float || !this.lens.contains(tr.position.x, tr.position.z)) continue;
      const kode = ITEM_TYPES[tr.typeId].kode;
      const D = typeof kode === 'number' ? PLASTICS[kode].D : ORGANIC_DECAY[ITEM_TYPES[tr.typeId].organic];
      tr.setHighlight(true);
      targets.push({
        typeId: tr.typeId, code: kode, D, w: typeof kode === 'number' ? PLASTICS[kode].w : 0, organic: kode === 'organik',
        apply: (years) => tr.setWear(clamp((progressOf(years, D) - 0.15) / 0.85, 0, 1)),
      });
    }
    return targets;
  }

  #applyPile(years) {
    const p = progressOf(years, this.data.pile.D);
    const k = clamp(p, 0, 1);
    this.pile.visible = p < 1;
    this.pile.scale.set(1, 1 - 0.75 * k, 1);
    this.pileMat.color.setHex(0xffffff).lerp(DIRT, 0.85 * k);
  }

  #useLens() {
    if (!this.progress.hasTool('lensa')) { this.game.toast(t('prompts.lensNeed'), 'info'); return; }
    const targets = this.#lensTargets();
    this.game.openLens(this, this.lens, targets, (reached) => this.#lensClosed(reached));
  }

  #lensClosed(reached) {
    for (const tr of this.trash.values()) tr.setHighlight(false);
    this.progress.setLens(this.id, reached);
    if (this.progress.flag('sungai_pathOpen')) return;
    if (reached >= this.data.pile.D) {
      this.#openPath();
      this.progress.repair(this.id, HEALTH_CONFIG.repair.pathOpened);
      this.progress.setFlag('sungai_pathOpen');
      this.game.toast(t('toast.pathOpen'), 'ok');
      this.game.say('lensSungaiDone');
    } else {
      this.#applyPile(0);
      this.game.say('lensSungaiNotYet');
    }
  }

  #openPath() {
    this.pile.visible = false;
    this.pileCollider.disabled = true;
    // Bekas tumpukan menjadi tanah subur dengan tunas kecil.
    if (!this.sprouts) {
      this.sprouts = new THREE.Group();
      const soil = new THREE.Mesh(new THREE.CircleGeometry(1.4, 16), toon({ color: 0x5b3a24, roughness: 1 }));
      soil.rotation.x = -Math.PI / 2;
      soil.position.y = 0.04;
      this.sprouts.add(soil);
      for (let i = 0; i < 6; i++) {
        const s = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.35, 4), toon({ color: 0x5cb85c }));
        s.position.set(Math.cos(i) * 0.8, 0.18, Math.sin(i * 1.7) * 0.6);
        this.sprouts.add(s);
      }
      this.sprouts.position.set(this.data.pile.x, 0, this.data.pile.z);
      this.root.add(this.sprouts);
    }
  }

  setupWater() {
    this.visuals.addWater(this.river.material, 0x3fa9e0, 0x8a8f5c);
  }

  excludes(x, z) {
    return super.excludes(x, z) || distanceToCurve(this.riverSamples, x, z) < this.data.river.width / 2 + 0.9;
  }

  spawnTrash() {
    super.spawnTrash();
    const years = this.progress.data.lens[this.id] ?? 0;
    if (years > 0) {
      for (const x of this.#lensTargets()) if (!x.organic) x.apply(years);
    }
    if (this.progress.flag('sungai_pathOpen')) this.#openPath();
  }

  update(dt, time) {
    const len = this.river.length;
    for (const tr of this.trash.values()) {
      if (!tr.float || tr.flying) continue;
      const f = tr.float;
      f.u += (FLOAT_SPEED * dt) / len;
      if (f.u > 0.96) f.u = 0.04;
      const p = this.river.curve.getPointAt(f.u);
      const tan = this.river.curve.getTangentAt(f.u);
      const side = Math.sin(time * 0.4 + f.phase) * 0.9;
      tr.position.set(p.x - tan.z * side, 0.02 + Math.sin(time * 2.2 + f.phase) * 0.04, p.z + tan.x * side);
      tr.group.rotation.y += dt * 0.4;
    }
    this.river.map.offset.y -= dt * 0.25;
    this.lens.update(dt, time, this.game.reducedMotion);
    super.update(dt, time);
  }

  onEnter() {
    this.rackNet.visible = !this.progress.hasTool('jaring');
  }
}

const DIRT = new THREE.Color(0x5b4a32);
