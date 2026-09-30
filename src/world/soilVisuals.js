// Tampilan dunia yang mengikuti soilHealth: warna rumput/tanah, rumput, bunga, cacing,
// kejernihan air, dan partikel mikroplastik (untuk proyeksi). Semua berulang pakai InstancedMesh.
import * as THREE from 'three';
import { GRASS_BAD, GRASS_OK, SOIL_BAD, SOIL_OK } from './diorama.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { rng } from './builders.js';

const FOLIAGE_OK = new THREE.Color(0xffffff);
const FOLIAGE_BAD = new THREE.Color(0xc7c09a);
const FLOWER_COLORS = [0xff7aa8, 0xffd23f, 0xffffff, 0xb58cff, 0xff9f43].map((c) => new THREE.Color(c));
const MICRO_COLORS = [0xffffff, 0xfde68a, 0x93c5fd, 0xfca5a5, 0xc4b5fd].map((c) => new THREE.Color(c));

export class SoilVisuals {
  constructor({ root, island, foliageMat, hw, hd, exclude, seed = 1, grass = 650, flowers = 90, worms = 8 }) {
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

    // Rumput: kerucut kecil. Tinggi seluruh kelompok disetel lewat scale.y (murah).
    const tuftGeo = new THREE.ConeGeometry(0.08, 0.5, 4);
    tuftGeo.translate(0, 0.25, 0);
    this.grassMat = new THREE.MeshStandardMaterial({ color: GRASS_OK, roughness: 1, flatShading: true });
    const grassSpots = spots(grass);
    this.grass = new THREE.InstancedMesh(tuftGeo, this.grassMat, grassSpots.length);
    grassSpots.forEach(([x, z], i) => {
      q.setFromAxisAngle(up, rand() * 6.28);
      const k = 0.6 + rand() * 0.9;
      s.set(k, k * (0.7 + rand() * 0.6), k);
      p.set(x, 0, z);
      this.grass.setMatrixAt(i, m.compose(p, q, s));
    });
    this.grass.receiveShadow = true;
    this.grassGroup = new THREE.Group();
    this.grassGroup.add(this.grass);
    root.add(this.grassGroup);

    // Bunga: batang + kepala dalam satu geometri, warna per instance. Jumlah tampil = f(kesehatan).
    const stem = new THREE.CylinderGeometry(0.02, 0.02, 0.45, 4);
    stem.translate(0, 0.22, 0);
    const head = new THREE.IcosahedronGeometry(0.11, 0);
    head.translate(0, 0.48, 0);
    const flowerGeo = mergeGeometries([stem.toNonIndexed(), head]);
    const flowerSpots = spots(flowers, 2);
    this.flowers = new THREE.InstancedMesh(flowerGeo, new THREE.MeshStandardMaterial({ roughness: 0.8, flatShading: true }), flowerSpots.length);
    flowerSpots.forEach(([x, z], i) => {
      q.setFromAxisAngle(up, rand() * 6.28);
      s.setScalar(0.8 + rand() * 0.6);
      p.set(x, 0, z);
      this.flowers.setMatrixAt(i, m.compose(p, q, s));
      this.flowers.setColorAt(i, FLOWER_COLORS[i % FLOWER_COLORS.length]);
    });
    this.flowers.castShadow = true;
    this.flowerMax = flowerSpots.length;
    root.add(this.flowers);

    // Cacing yang muncul di permukaan saat tanah sehat.
    this.worms = [];
    const wormMat = new THREE.MeshStandardMaterial({ color: 0xf4a3b5, roughness: 0.5 });
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
    this.island.grassMat.color.setHex(GRASS_OK).lerp(this.tmp.setHex(GRASS_BAD), bad);
    this.grassMat.color.copy(this.island.grassMat.color).multiplyScalar(0.92 + 0.1 * h);
    this.island.soilMats.forEach((mat, i) => mat.color.setHex(SOIL_OK[i]).lerp(this.tmp.setHex(SOIL_BAD[i]), bad));
    if (this.foliageMat) this.foliageMat.color.copy(FOLIAGE_OK).lerp(FOLIAGE_BAD, bad);
    this.grassGroup.scale.y = 0.25 + 0.95 * h;
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

  update(dt, time, reducedMotion) {
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
