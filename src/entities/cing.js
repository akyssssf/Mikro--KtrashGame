// Cing, cacing tanah pemandu. Warna dan ekspresinya mengikuti kesehatan tanah.
import * as THREE from 'three';
import { canvasTexture, toon } from '../world/builders.js';
import { cloneAsset } from '../core/assets.js';

const HAPPY = new THREE.Color(0xf28ba8);
const TIRED = new THREE.Color(0xb9a3a6);
const SEGMENTS = 6;
const ASSET_MOODS = { ceria: 'cing_happy', biasa: 'cing_neutral', lesu: 'cing_tired' };
const ASSET_SCALE = 0.55;
const WHITE = new THREE.Color(0xffffff);
const FADED = new THREE.Color(0xc9bfc2);

export class Cing {
  constructor() {
    this.group = new THREE.Group();
    this.position = this.group.position;
    this.health = 60;
    this.mood = 'biasa';
    this.following = false;
    this.phase = 0;
    this.heading = 0;
    this.reducedMotion = false;
    this.segments = [];
    this.eyes = [];
    const variants = Object.fromEntries(Object.entries(ASSET_MOODS).map(([mood, key]) => [mood, cloneAsset(key, { uniqueMaterials: true })]));
    if (Object.values(variants).every(Boolean)) this.#buildFromAssets(variants);
    else this.#buildProcedural();
    this.#buildMarker();
    this.setMood('biasa');
  }

  // Tiga aset ekspresi (ceria/biasa/lesu); hanya satu yang tampil.
  #buildFromAssets(variants) {
    this.variants = variants;
    this.body = new THREE.Group();
    for (const [mood, obj] of Object.entries(variants)) {
      obj.scale.setScalar(ASSET_SCALE);
      obj.userData.head = obj.getObjectByName(`head_${ASSET_MOODS[mood].split('_')[1]}`);
      this.body.add(obj);
    }
    this.materials = [];
    this.body.traverse((o) => { if (o.isMesh) this.materials.push(o.material); });
    this.group.add(this.body);
    this.markerY = 1.55;
  }

  #buildProcedural() {
    this.markerY = 1.45;
    this.bodyMat = toon({ color: HAPPY.clone(), roughness: 0.45 });
    this.bandMat = toon({ color: 0xe46f93, roughness: 0.5 });
    for (let i = 0; i < SEGMENTS; i++) {
      const r = 0.26 - i * 0.025;
      const s = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), i === 2 ? this.bandMat : this.bodyMat);
      s.castShadow = i % 2 === 0;
      s.position.set(0, r, -i * 0.3);
      this.group.add(s);
      this.segments.push(s);
    }
    this.head = new THREE.Group();
    this.head.position.set(0, 0.62, 0.08);
    const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.36, 16, 12), this.bodyMat);
    headMesh.castShadow = true;
    this.head.add(headMesh);
    const eyeWhite = toon({ color: 0xffffff, roughness: 0.3 });
    const pupil = toon({ color: 0x17324d, roughness: 0.3 });
    this.eyes = [-0.13, 0.13].map((x) => {
      const e = new THREE.Group();
      e.position.set(x, 0.08, 0.29);
      e.add(new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), eyeWhite));
      const p = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), pupil);
      p.position.z = 0.06;
      e.add(p);
      this.head.add(e);
      return e;
    });
    const mouthMat = toon({ color: 0x7a2340, roughness: 0.6 });
    const smile = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.025, 6, 12, Math.PI), mouthMat);
    smile.rotation.z = Math.PI;
    smile.position.set(0, -0.06, 0.32);
    const flat = new THREE.Mesh(new THREE.CapsuleGeometry(0.022, 0.13, 3, 6), mouthMat);
    flat.rotation.z = Math.PI / 2;
    flat.position.set(0, -0.1, 0.33);
    const frown = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.025, 6, 12, Math.PI), mouthMat);
    frown.position.set(0, -0.16, 0.31);
    this.mouths = { ceria: smile, biasa: flat, lesu: frown };
    Object.values(this.mouths).forEach((m) => this.head.add(m));
    // Topi daun kecil.
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), toon({ color: 0x4f9e45, flatShading: true }));
    leaf.scale.set(1.3, 0.35, 0.7);
    leaf.position.set(0.05, 0.36, 0);
    leaf.rotation.z = 0.3;
    this.head.add(leaf);
    this.group.add(this.head);
  }

  #buildMarker() {
    this.marker = new THREE.Sprite(new THREE.SpriteMaterial({
      map: canvasTexture(64, 64, (ctx) => {
        ctx.fillStyle = '#f08a2c';
        ctx.strokeStyle = '#17324d';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(32, 32, 26, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#17324d';
        ctx.font = '800 40px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('!', 32, 35);
      }),
      depthTest: false,
    }));
    this.marker.scale.setScalar(0.55);
    this.marker.position.y = this.markerY;
    this.marker.renderOrder = 5;
    this.group.add(this.marker);
  }

  setAlert(on) { this.marker.visible = on; }

  setMood(mood) {
    this.mood = mood;
    for (const [k, m] of Object.entries(this.variants ?? this.mouths)) m.visible = k === mood;
  }

  // Warna berubah halus mengikuti kesehatan tanah yang ditampilkan.
  setHealth(h) {
    this.health = h;
    const k = THREE.MathUtils.clamp(h / 100, 0, 1);
    if (this.variants) for (const m of this.materials) m.color.copy(FADED).lerp(WHITE, k);
    else this.bodyMat.color.copy(TIRED).lerp(HAPPY, k);
  }

  update(dt, time, player) {
    const energy = 0.35 + 0.65 * (this.health / 100);
    const motion = this.reducedMotion ? 0.3 : 1;
    let speed = 0;
    if (this.following && player) {
      const back = new THREE.Vector3(Math.sin(player.heading), 0, Math.cos(player.heading)).multiplyScalar(-1.9);
      const side = new THREE.Vector3(Math.cos(player.heading), 0, -Math.sin(player.heading)).multiplyScalar(1.2);
      const goal = player.position.clone().add(back).add(side);
      const d = goal.distanceTo(this.position);
      if (d > 0.35) {
        const step = Math.min(d, dt * Math.min(9, 2 + d * 2.2));
        const dir = goal.sub(this.position).normalize();
        this.position.addScaledVector(dir, step);
        speed = step / Math.max(dt, 1e-4);
        const target = Math.atan2(dir.x, dir.z);
        const diff = Math.atan2(Math.sin(target - this.heading), Math.cos(target - this.heading));
        this.heading += diff * Math.min(1, dt * 8);
      } else if (player) {
        const toP = player.position.clone().sub(this.position);
        const target = Math.atan2(toP.x, toP.z);
        const diff = Math.atan2(Math.sin(target - this.heading), Math.cos(target - this.heading));
        this.heading += diff * Math.min(1, dt * 3);
      }
    }
    this.group.rotation.y = this.heading;
    this.phase += dt * (3 + speed * 1.5) * energy;
    if (this.variants) {
      // Aset utuh: animasi liuk lewat mengembang-mengempis + kepala bergoyang.
      const squash = Math.sin(this.phase * 1.4) * 0.05 * motion * energy;
      this.body.scale.set(1 - squash * 0.5, 1 + squash, 1 - squash * 0.5);
      this.body.rotation.z = Math.sin(this.phase * 0.7) * 0.05 * motion;
      const head = this.variants[this.mood]?.userData.head;
      if (head) head.rotation.z = Math.sin(this.phase * 0.5) * 0.1 * motion * energy;
    }
    this.segments.forEach((s, i) => {
      const w = Math.sin(this.phase - i * 0.9) * 0.12 * motion;
      s.position.x = w * (i / SEGMENTS + 0.3);
      s.position.y = s.geometry.parameters.radius + Math.max(0, Math.sin(this.phase * 0.5 - i * 0.7)) * 0.06 * motion * energy;
    });
    this.marker.position.y = this.markerY + Math.sin(time * 3) * 0.08 * motion;
    if (this.variants) return;
    const droop = this.mood === 'lesu' ? -0.12 : 0;
    this.head.position.y = 0.62 + Math.sin(this.phase * 0.8) * 0.04 * motion + droop;
    this.head.rotation.z = Math.sin(this.phase * 0.5) * 0.12 * motion * energy;
    this.head.rotation.x = this.mood === 'lesu' ? 0.25 : 0;
    const blink = (time % 4) < 0.12 ? 0.15 : 1;
    this.eyes.forEach((e) => { e.scale.y = blink; });
  }
}
