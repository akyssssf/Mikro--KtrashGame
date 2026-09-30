// Desa Lestari: lapangan, rumah, sumur, Gerbang Waktu, Tempat Daur Ulang, papan ke area lain.
import * as THREE from 'three';
import { Area, labelSprite } from '../area.js';
import { AREA_DATA, AREA_IDS, FUTURE_CODES } from '../areaRegistry.js';
import { flatCircle, flatPath } from '../diorama.js';
import { place } from '../builders.js';
import { bench, bush, fence, flowerPot, house, lamp, recyclingCenter, rock, stoneArch, tree, well } from '../props.js';
import { t } from '../../data/dialogs.id.js';

const TREES = [
  [-20, -15, 1.2, 0], [-17, -3, 1, 1], [-21, 14, 1.1, 0], [-9, 17, 1, 1], [3, 17.5, 1.2, 0], [12, 16, 1, 1],
  [20, 14, 1.1, 0], [21, 5, 0.9, 1], [15, -16.5, 1.1, 0], [-4, -16, 0.9, 1], [-10, -6, 0.8, 0], [21, -16, 1, 1],
];

export default class HubArea extends Area {
  buildContent() {
    const d = this.data;
    const P = this.props;
    const C = this.collision;

    P.add(flatCircle(0, 0, 8, 0xd9c08c, 0.02, 28));
    P.add(flatCircle(0, 0, 6.6, 0xe5d2a3, 0.03, 28));
    P.add(flatPath([[-6, 1], [-14, 1.5], [-23, 1]], 2.6, 0xd9c08c));
    P.add(flatPath([[6, -1], [15, -3], [23.5, -3]], 2.6, 0xd9c08c));
    P.add(flatPath([[0, 7], [-1, 13], [0, 19]], 2.2, 0xd9c08c));
    this.noGrass.push({ x: 0, z: 0, r: 8.6 }, { x: -15, z: 1.2, hw: 9, hd: 1.8 }, { x: 15, z: -2.5, hw: 9, hd: 1.8 }, { x: -0.5, z: 13, hw: 1.8, hd: 7 });

    // Gerbang Waktu.
    const arch = stoneArch();
    place(arch.group, d.gate.x, 0, d.gate.z);
    P.add(arch.group);
    this.gateGlow = arch.portalMat;
    C.addBox(d.gate.x, d.gate.z, 2.8, 0.85);
    this.noGrass.push({ x: d.gate.x, z: d.gate.z, hw: 3.2, hd: 1.4 });
    this.addInteractable({
      id: 'gate',
      kind: 'gate',
      position: new THREE.Vector3(d.gate.x, 0, d.gate.z + 1.2),
      height: 5,
      range: 2.8,
      prompt: () => ({ verb: this.game.quests.activeId === 'pulang' ? t('prompts.gateFinal') : t('prompts.gate') }),
      action: () => this.game.openTimeGate(),
    });

    // Sumur + Cing menunggu di dekatnya.
    P.add(place(well(), d.well.x, 0, d.well.z));
    C.addCircle(d.well.x, d.well.z, 1.15);
    this.noGrass.push({ x: d.well.x, z: d.well.z, r: 1.6 });

    // Tempat Daur Ulang (menghadap lapangan).
    const rc = recyclingCenter();
    place(rc, d.recycle.x, 0, d.recycle.z, -Math.PI / 2);
    P.add(rc);
    C.addBox(d.recycle.x + 0.3, d.recycle.z - 0.3, 2.2, 3.1);
    C.addCircle(d.recycle.x - 0.4, d.recycle.z + 3.6, 0.95);
    this.noGrass.push({ x: d.recycle.x, z: d.recycle.z, hw: 3.4, hd: 3.8 });
    const rcLabel = labelSprite(t('places.recycle'), { bg: '#d9f7e3', scale: 0.9 });
    rcLabel.position.set(d.recycle.x - 0.2, 4.4, d.recycle.z);
    this.root.add(rcLabel);
    this.addInteractable({
      id: 'recycle',
      kind: 'recycle',
      position: new THREE.Vector3(d.recycle.front.x, 0, d.recycle.front.z),
      height: 3.2,
      range: 2.4,
      prompt: () => ({ verb: t('prompts.recycle') }),
      action: () => this.game.openRecycle(),
    });

    // Tempat penimbunan kecil (sampah salah pilah).
    const lf = d.landfill;
    P.add(place(fence(4.6, 0x8b7355), lf.x, 0, lf.z - 2.2));
    P.add(place(fence(4.6, 0x8b7355), lf.x - 2.3, 0, lf.z, Math.PI / 2));
    C.addBox(lf.x, lf.z - 2.2, 2.3, 0.15);
    C.addBox(lf.x - 2.3, lf.z, 0.15, 2.3);

    // Rumah-rumah.
    const homes = [
      { x: -14, z: -10, r: 0.25, c: { roof: 0xd9623b } },
      { x: -15.5, z: 9.5, r: Math.PI / 2 - 0.2, c: { roof: 0x2f855a, wall: 0xfdf1d6 } },
      { x: 8.5, z: -13, r: -0.15, c: { roof: 0x3b82c4, wall: 0xf6e7c8 } },
      { x: 17.5, z: -11, r: -0.4, c: { roof: 0xe8741f, wall: 0xfff3dc } },
    ];
    for (const h of homes) {
      P.add(place(house(h.c), h.x, 0, h.z, h.r));
      C.addBox(h.x, h.z, 2.1, 1.8, h.r);
      this.noGrass.push({ x: h.x, z: h.z, r: 3 });
      P.add(place(flowerPot(0xff7aa8), h.x + 2.4 * Math.cos(h.r), 0, h.z + 2.2));
    }

    for (const [x, z, s, v] of TREES) {
      P.add(place(tree(s, v), x, 0, z, this.rand() * 6));
      C.addCircle(x, z, 0.45 * s);
    }
    for (const [x, z] of [[-7, -12], [4, -10], [11, 11], [-19, -9], [18, 10], [-11, 4], [6, 14]]) {
      P.add(place(bush(0.9 + this.rand() * 0.4), x, 0, z));
      C.addCircle(x, z, 0.6);
    }
    for (const [x, z] of [[-22, -7], [22.5, 9], [-2, -18.5], [16, 17]]) {
      P.add(place(rock(1 + this.rand() * 0.5), x, 0, z));
      C.addCircle(x, z, 0.7);
    }
    for (const [x, z] of [[-7.5, -3], [7.5, 5], [-5, 9]]) {
      P.add(place(lamp(), x, 0, z));
      C.addCircle(x, z, 0.2);
    }
    P.add(place(bench(), 4.5, 0, -8.5, 0.2));
    C.addBox(4.5, -8.5, 0.8, 0.3, 0.2);
    P.add(place(bench(), -5, 0, 6, Math.PI + 0.4));
    C.addBox(-5, 6, 0.8, 0.3, Math.PI + 0.4);

    // Papan ke area lain (otomatis dari registry).
    for (const id of AREA_IDS) {
      const hp = AREA_DATA[id].hubPortal;
      if (!hp) continue;
      this.addPortal({
        x: hp.x, z: hp.z, target: id,
        label: t(`areas.${id}.name`),
        arrow: hp.x < 0 ? -1 : 1,
        locked: () => !this.game.quests.isAreaUnlocked(id),
      });
    }
    FUTURE_CODES.forEach((code, i) => {
      const x = -14 + i * (28 / Math.max(1, FUTURE_CODES.length - 1));
      this.addFutureSign(x, -18, code);
    });
  }

  arrivalFrom(fromId) {
    const hp = AREA_DATA[fromId]?.hubPortal;
    if (hp) return { x: hp.x - Math.sign(hp.x) * 2.6, z: hp.z + 1.2 };
    return this.data.spawn;
  }

  update(dt, time) {
    super.update(dt, time);
    this.gateGlow.opacity = 0.45 + 0.12 * Math.sin(time * 2);
    this.gateGlow.color.setHSL(0.55 + 0.03 * Math.sin(time * 0.7), 0.85, 0.72);
  }
}
