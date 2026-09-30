// Penampang tanah (diadaptasi dari demo lama): sampah terkubur, noda pencemaran, mikroplastik.
// Punya scene + kamera sendiri, digambar sebagai inset (scissor) di atas dunia.
import * as THREE from 'three';
import { makeItemModel, rememberLook, applyWear } from './items3d.js';
import { ITEM_TYPES } from '../data/items.js';
import { clamp, microFraction, microSpread, progressOf } from '../systems/timeSim.js';
import { rng, toon } from './builders.js';

const SW = 10;
const SD = 2.4;
const FRONT = SD / 2;
const MP_PER = 30;
const MAX_ITEMS = 14;
const SOIL_OK = [0x5b3a24, 0x7b5536, 0x9a7450].map((c) => new THREE.Color(c));
const SOIL_BAD = [0x6f6d68, 0x88857d, 0x9d998f].map((c) => new THREE.Color(c));
const GRASS_OK = new THREE.Color(0x5cb85c);
const GRASS_BAD = new THREE.Color(0x9a9265);
const MP_COLORS = [0xffffff, 0xfde68a, 0x93c5fd, 0xfca5a5, 0xc4b5fd].map((c) => new THREE.Color(c));

export class SoilSection {
  constructor() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xdff1fb);
    this.camera = new THREE.PerspectiveCamera(34, 1.6, 0.1, 60);
    this.camera.position.set(0, -1.2, 17);
    this.camera.lookAt(0, -1.7, 0);
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0xd9c9a0, 1.3));
    const sun = new THREE.DirectionalLight(0xffffff, 1.8);
    sun.position.set(4, 10, 8);
    this.scene.add(sun);

    const M = (c) => toon({ color: c, roughness: 1 });
    this.soilMats = SOIL_OK.map((c) => M(c.clone()));
    [[-0.65, 1.3], [-2.1, 1.6], [-3.7, 1.6]].forEach(([y, hgt], i) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(SW, hgt, SD), this.soilMats[i]);
      m.position.y = y;
      this.scene.add(m);
    });
    this.grassMat = M(GRASS_OK.clone());
    const top = new THREE.Mesh(new THREE.BoxGeometry(SW + 0.02, 0.3, SD + 0.02), this.grassMat);
    top.position.y = 0.15;
    this.scene.add(top);
    const rand = rng(11);
    const tuftGeo = new THREE.ConeGeometry(0.07, 0.6, 5);
    this.tufts = new THREE.InstancedMesh(tuftGeo, this.grassMat, 46);
    const mtx = new THREE.Matrix4();
    for (let i = 0; i < 46; i++) {
      mtx.makeTranslation((rand() - 0.5) * (SW - 0.6), 0.6, (rand() - 0.5) * 1.8);
      this.tufts.setMatrixAt(i, mtx);
    }
    this.tuftGroup = new THREE.Group();
    this.tuftGroup.add(this.tufts);
    this.scene.add(this.tuftGroup);
    this.worms = [];
    const wormMat = M(0xf4a3b5);
    for (let i = 0; i < 6; i++) {
      const w = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.32, 4, 8), wormMat);
      w.position.set(-4.2 + i * 1.7, -0.4 - rand() * 0.7, FRONT + 0.02);
      w.rotation.z = rand() * Math.PI;
      this.scene.add(w);
      this.worms.push(w);
    }
    this.entries = [];
    this.holder = new THREE.Group();
    this.scene.add(this.holder);
    this.mp = null;
    this.rand = rand;
  }

  // entries: [{ type, D, w, organic }] — ditampilkan maksimal MAX_ITEMS.
  setEntries(entries) {
    this.holder.clear();
    this.entries = [];
    const slots = [];
    for (let r = 0; r < 3; r++) for (let c = 0; c < 6; c++) slots.push([-4.2 + c * 1.68, -1.05 - r * 1.3]);
    for (let i = slots.length - 1; i > 0; i--) {
      const j = Math.floor(this.rand() * (i + 1));
      [slots[i], slots[j]] = [slots[j], slots[i]];
    }
    const list = entries.slice(0, MAX_ITEMS);
    list.forEach((e, i) => {
      const [x, y] = slots[i];
      const pivot = new THREE.Group();
      pivot.position.set(x, y, FRONT + 0.05);
      pivot.rotation.z = (this.rand() - 0.5);
      const model = makeItemModel(ITEM_TYPES[e.type].model, 0.72);
      model.position.y = -model.userData.height / 2;
      rememberLook(model);
      pivot.add(model);
      const stain = new THREE.Mesh(new THREE.CircleGeometry(1, 24), new THREE.MeshBasicMaterial({ color: 0x2a281c, transparent: true, opacity: 0, depthWrite: false }));
      stain.position.set(x, y, FRONT + 0.012);
      this.holder.add(stain, pivot);
      const dirs = Array.from({ length: MP_PER }, () => {
        const a = this.rand() * 6.28;
        const r = Math.sqrt(this.rand());
        return new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r * 0.9, this.rand() * 0.05);
      });
      this.entries.push({ ...e, pivot, model, stain, x, y, dirs });
    });
    const plastic = this.entries.filter((e) => !e.organic);
    const n = Math.max(1, plastic.length * MP_PER);
    const pos = new Float32Array(n * 3).fill(-999);
    const col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const c = MP_COLORS[i % MP_COLORS.length];
      col.set([c.r, c.g, c.b], i * 3);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    this.mp = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.09, vertexColors: true, depthWrite: false }));
    this.mp.frustumCulled = false;
    this.holder.add(this.mp);
  }

  apply(t, health) {
    const pos = this.mp.geometry.attributes.position;
    let pi = 0;
    for (const e of this.entries) {
      const p = progressOf(t, e.D);
      e.pivot.visible = p < 1;
      if (p < 1) {
        const k = clamp((p - 0.15) / 0.85, 0, 1);
        e.pivot.scale.setScalar(1 - 0.3 * k);
        applyWear(e.model, e.organic ? clamp(p, 0, 1) : k, e.organic);
      }
      if (e.organic) continue;
      const stainK = clamp(t / 20, 0, 1) * 0.6 + clamp(p, 0, 1) * 0.4;
      e.stain.material.opacity = 0.32 * stainK * (e.w > 1 ? 1.25 : 1);
      e.stain.scale.setScalar(0.35 + 0.45 * stainK);
      const shown = Math.floor(microFraction(p) * MP_PER);
      const spread = microSpread(p);
      for (let j = 0; j < MP_PER; j++) {
        const idx = (pi + j) * 3;
        if (j < shown) {
          const d = e.dirs[j];
          pos.array[idx] = clamp(e.x + d.x * spread, -SW / 2 + 0.05, SW / 2 - 0.05);
          pos.array[idx + 1] = clamp(e.y + d.y * spread - 0.1 * clamp(p - 1, 0, 1), -4.45, -0.05);
          pos.array[idx + 2] = FRONT + 0.07 + d.z;
        } else {
          pos.array[idx + 1] = -999;
        }
      }
      pi += MP_PER;
    }
    pos.needsUpdate = true;
    const bad = 1 - clamp(health / 100, 0, 1);
    this.soilMats.forEach((m, i) => m.color.copy(SOIL_OK[i]).lerp(SOIL_BAD[i], bad));
    this.grassMat.color.copy(GRASS_OK).lerp(GRASS_BAD, bad);
    this.tuftGroup.scale.y = 0.2 + 0.8 * (1 - bad);
    const shownWorms = Math.ceil(this.worms.length * (1 - bad));
    this.worms.forEach((w, i) => { w.visible = i < shownWorms; });
  }

  // Gambar ke kotak layar (piksel CSS) di atas render utama.
  render(renderer, rect, time) {
    this.worms.forEach((w, i) => { w.rotation.z += Math.sin(time * 2 + i) * 0.01; });
    const H = window.innerHeight;
    this.camera.aspect = rect.width / rect.height;
    this.camera.position.z = Math.max(15, 11 / this.camera.aspect + 9);
    this.camera.updateProjectionMatrix();
    renderer.setScissorTest(true);
    renderer.setViewport(rect.left, H - rect.bottom, rect.width, rect.height);
    renderer.setScissor(rect.left, H - rect.bottom, rect.width, rect.height);
    renderer.render(this.scene, this.camera);
    renderer.setScissorTest(false);
    renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
  }
}
