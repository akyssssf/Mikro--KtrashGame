// Tampilan dunia yang mengikuti soilHealth: warna rumput/tanah, rumput, bunga, cacing,
// kejernihan air, dan partikel mikroplastik (untuk proyeksi). Semua berulang pakai InstancedMesh.
import * as THREE from 'three';
import { SOIL_BAD, SOIL_OK } from './diorama.js';
import { createGrass, grassHeightAt } from './grass.js';
import { rng, toon } from './builders.js';

const GRASS_BASE_OK = 0x5aa23a;
const GRASS_BASE_BAD = 0x8c8660;
const GRASS_TIP_OK = 0xb8e65a;
const GRASS_WARM_OK = 0xdcf07a;
const GRASS_TIP_BAD = 0xcfc597;
const TMP2 = new THREE.Color();
const TMP3 = new THREE.Color();
const TMP4 = new THREE.Color();
const FOLIAGE_OK = new THREE.Color(0xffffff);
const FOLIAGE_BAD = new THREE.Color(0xc7c09a);
const FLOWER_COLORS = [0xffffff, 0xffd84a, 0xff8fb5, 0x8fd3ff, 0xffffff, 0xc5a3ff, 0xffd84a].map((c) => new THREE.Color(c));
const MICRO_COLORS = [0xffffff, 0xfde68a, 0x93c5fd, 0xfca5a5, 0xc4b5fd].map((c) => new THREE.Color(c));

export class SoilVisuals {
  constructor({ root, island, foliageMat, hw, hd, exclude, clearSpots = [], seed = 1, flowers = 220, worms = 8 }) {
    this.island = island;
    this.foliageMat = foliageMat;
    this.water = [];
    const rand = rng(seed);
    const spots = (n, pad = 1.2) => {
      const out = [];
      let guard = 0;
      while (out.length < n && guard++ < n * 30) {
        const x = (rand() * 2 - 1) * (hw - pad);
        const z = (rand() * 2 - 1) * (hd - pad);
        if (!exclude(x, z)) out.push([x, z]);
      }
      return out;
    };
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const s = new THREE.Vector3();
    const p = new THREE.Vector3();
    const up = new THREE.Vector3(0, 1, 0);

    // Rumput stylized padat. Tinggi seluruh padang disetel lewat scale.y (murah).
    this.grass = createGrass({ hw, hd, exclude, rand, clearSpots });
    this.grassGroup = new THREE.Group();
    this.grassGroup.add(this.grass.mesh);
    root.add(this.grassGroup);

    // Bunga kecil kelopak lima yang mengambang di ujung rumput (batang tertutup rumput).
    const petals = new THREE.Shape();
    for (let i = 0; i <= 40; i++) {
      const a = (i / 40) * Math.PI * 2;
      const r = 0.05 + 0.055 * Math.abs(Math.cos(a * 2.5));
      if (i === 0) petals.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      else petals.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    const flowerGeo = new THREE.ShapeGeometry(petals);
    flowerGeo.rotateX(-Math.PI / 2);
    const flowerSpots = spots(flowers, 2);
    this.flowers = new THREE.InstancedMesh(flowerGeo, new THREE.MeshLambertMaterial({ side: THREE.DoubleSide, emissive: 0x222222 }), flowerSpots.length);
    flowerSpots.forEach(([x, z], i) => {
      q.setFromEuler(new THREE.Euler((rand() - 0.5) * 0.5, rand() * 6.28, (rand() - 0.5) * 0.5));
      s.setScalar(0.8 + rand() * 0.6);
      p.set(x, grassHeightAt(x, z) * (0.85 + rand() * 0.2), z);
      this.flowers.setMatrixAt(i, m.compose(p, q, s));
      this.flowers.setColorAt(i, FLOWER_COLORS[i % FLOWER_COLORS.length]);
    });
    this.flowers.castShadow = true;
    this.flowerMax = flowerSpots.length;
    root.add(this.flowers);

    // Cacing yang muncul di permukaan saat tanah sehat.
    this.worms = [];
    const wormMat = toon({ color: 0xf4a3b5 });
    const wormGeo = new THREE.CapsuleGeometry(0.06, 0.34, 3, 6);
    wormGeo.rotateZ(Math.PI / 2);
    for (const [x, z] of spots(worms, 3)) {
      const w = new THREE.Mesh(wormGeo, wormMat);
      w.position.set(x, 0.07, z);
      w.userData.phase = rand() * 6.28;
      w.userData.base = new THREE.Vector3(x, 0.07, z);
      root.add(w);
      this.worms.push(w);
    }

    // Mikroplastik (hanya tampil saat proyeksi waktu).
    const microSpots = spots(360, 1);
    this.micro = new THREE.InstancedMesh(new THREE.BoxGeometry(0.07, 0.07, 0.07), new THREE.MeshBasicMaterial(), microSpots.length);
    this.microBase = microSpots.map(([x, z], i) => {
      this.micro.setColorAt(i, MICRO_COLORS[i % MICRO_COLORS.length]);
      return { x, z, y: 0.05 + rand() * 0.9, ph: rand() * 6.28 };
    });
    this.micro.count = 0;
    this.micro.frustumCulled = false;
    root.add(this.micro);

    this.tmp = new THREE.Color();
    this.health = -1;
  }

  addWater(material, clear, murky) { this.water.push({ material, clear: new THREE.Color(clear), murky: new THREE.Color(murky) }); }

  apply(health) {
    if (Math.abs(health - this.health) < 0.05) return;
    this.health = health;
    const h = THREE.MathUtils.clamp(health / 100, 0, 1);
    const bad = 1 - h;
    // Pangkal bilah = warna tanah berumput, supaya padang menyatu seperti karpet.
    const base = this.tmp.setHex(GRASS_BASE_OK).lerp(TMP2.setHex(GRASS_BASE_BAD), bad);
    const tip = TMP3.setHex(GRASS_TIP_OK).lerp(TMP2.setHex(GRASS_TIP_BAD), bad);
    const warm = TMP4.setHex(GRASS_WARM_OK).lerp(TMP2.setHex(GRASS_TIP_BAD), bad);
    this.grass.setColors(base, tip, warm);
    // Tanah berwarna sama dengan rata-rata rumput (bukan hijau gelap), jadi area tanpa rumput
    // (sekitar rumah, pohon) tetap menyatu dengan padang.
    this.island.grassMat.color.copy(base).lerp(tip, 0.45);
    this.island.soilMats.forEach((mat, i) => mat.color.setHex(SOIL_OK[i]).lerp(this.tmp.setHex(SOIL_BAD[i]), bad));
    if (this.foliageMat) this.foliageMat.color.copy(FOLIAGE_OK).lerp(FOLIAGE_BAD, bad);
    this.grassGroup.scale.y = 0.3 + 0.8 * h;
    this.flowers.count = Math.round(this.flowerMax * THREE.MathUtils.clamp((h - 0.35) / 0.6, 0, 1));
    const wormsShown = Math.round(this.worms.length * THREE.MathUtils.clamp((h - 0.45) / 0.5, 0, 1));
    this.worms.forEach((w, i) => { w.visible = i < wormsShown; });
    for (const wtr of this.water) wtr.material.color.copy(wtr.murky).lerp(wtr.clear, h);
  }

  // amount: 0…1 banyaknya mikroplastik yang ditampilkan.
  setMicro(amount) {
    this.micro.count = Math.round(this.microBase.length * THREE.MathUtils.clamp(amount, 0, 1));
    this.microDirty = true;
  }

  update(dt, time, reducedMotion, player) {
    this.grass.update(time, player, reducedMotion);
    const motion = reducedMotion ? 0.2 : 1;
    for (const w of this.worms) {
      if (!w.visible) continue;
      const ph = time * 1.5 + w.userData.phase;
      w.position.x = w.userData.base.x + Math.sin(ph * 0.3) * 0.4 * motion;
      w.rotation.y = Math.sin(ph) * 0.5 * motion;
      w.scale.x = 1 + Math.sin(ph * 3) * 0.12 * motion;
    }
    if (this.micro.count > 0) {
      const m = new THREE.Matrix4();
      for (let i = 0; i < this.micro.count; i++) {
        const b = this.microBase[i];
        m.makeTranslation(b.x, b.y + Math.sin(time * 0.8 + b.ph) * 0.08 * motion, b.z);
        this.micro.setMatrixAt(i, m);
      }
      this.micro.instanceMatrix.needsUpdate = true;
    }
  }
}
