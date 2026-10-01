// Cing, cacing tanah pemandu. Warna dan ekspresinya mengikuti kesehatan tanah.
import * as THREE from 'three';
import { canvasTexture, toon } from '../world/builders.js';
import { cloneAsset } from '../core/assets.js';

const HAPPY = new THREE.Color(0xf28ba8);
const TIRED = new THREE.Color(0xb9a3a6);
const SEGMENTS = 6;
const FOLLOW_GAP = 1.8;
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

  // Gerakan lucu sesaat: 'hop' (lompat senang) atau 'spin' (berputar).
  trick(kind) {
    if (!this.trickAction) this.trickAction = { kind, t: 0, dur: kind === 'spin' ? 0.9 : 0.8 };
  }

  #applyTrick(dt, speed, motion) {
    // Diam cukup lama → lakukan gerakan sendiri sesekali.
    this.still = speed < 0.2 ? (this.still ?? 0) + dt : 0;
    if (this.still > (this.nextTrick ??= 5)) {
      this.trick(Math.random() < 0.5 ? 'spin' : 'hop');
      this.still = 0;
      this.nextTrick = 5 + Math.random() * 4;
    }
    const a = this.trickAction;
    if (!a || !this.body) return;
    a.t += dt;
    const k = Math.min(1, a.t / a.dur);
    if (a.kind === 'spin') this.body.rotation.y = k * Math.PI * 2 * motion;
    else this.body.position.y = Math.abs(Math.sin(k * Math.PI * 2)) * 0.35 * motion;
    if (k >= 1) {
      this.body.rotation.y = 0;
      this.body.position.y = 0;
      this.trickAction = null;
    }
  }

  // Hapus jejak saat pindah area (posisi lama tidak berlaku lagi).
  resetTrail() { this.trail = []; }

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

  // Mengikuti jejak langkah pemain (bukan titik di samping), jadi tetap di jalur yang bisa dilalui
  // seperti jembatan. Posisi juga melewati kolisi supaya tidak masuk air atau menembus bangunan.
  update(dt, time, player, collision) {
    const energy = 0.35 + 0.65 * (this.health / 100);
    const motion = this.reducedMotion ? 0.3 : 1;
    let speed = 0;
    if (this.following && player) {
      const trail = this.trail ?? (this.trail = []);
      const head = trail[0];
      if (!head || Math.hypot(head.x - player.position.x, head.z - player.position.z) > 0.25) {
        trail.unshift({ x: player.position.x, z: player.position.z });
        if (trail.length > 40) trail.length = 40;
      }
      // Titik di jejak sejauh ±1.8 m di belakang pemain.
      let goal = trail[trail.length - 1];
      let walked = 0;
      for (let i = 1; i < trail.length; i++) {
        walked += Math.hypot(trail[i].x - trail[i - 1].x, trail[i].z - trail[i - 1].z);
        if (walked >= FOLLOW_GAP) { goal = trail[i]; break; }
      }
      const dx = goal.x - this.position.x;
      const dz = goal.z - this.position.z;
      const d = Math.hypot(dx, dz);
      const toPlayer = Math.hypot(player.position.x - this.position.x, player.position.z - this.position.z);
      if (d > 0.3 && toPlayer > 1.2) {
        const step = Math.min(d, dt * Math.min(9, 2 + d * 2.2));
        const p = { x: this.position.x + (dx / d) * step, z: this.position.z + (dz / d) * step };
        collision?.resolve(p, 0.3);
        speed = Math.hypot(p.x - this.position.x, p.z - this.position.z) / Math.max(dt, 1e-4);
        this.position.x = p.x;
        this.position.z = p.z;
        const target = Math.atan2(dx, dz);
        const diff = Math.atan2(Math.sin(target - this.heading), Math.cos(target - this.heading));
        this.heading += diff * Math.min(1, dt * 8);
      } else {
        const target = Math.atan2(player.position.x - this.position.x, player.position.z - this.position.z);
        const diff = Math.atan2(Math.sin(target - this.heading), Math.cos(target - this.heading));
        this.heading += diff * Math.min(1, dt * 3);
      }
      // Tertinggal terlalu jauh (mis. terhalang): lompat ke jejak terdekat di belakang pemain.
      if (toPlayer > 8) {
        this.position.x = goal.x;
        this.position.z = goal.z;
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
    this.#applyTrick(dt, speed, motion);
    if (this.variants) return;
    const droop = this.mood === 'lesu' ? -0.12 : 0;
    this.head.position.y = 0.62 + Math.sin(this.phase * 0.8) * 0.04 * motion + droop;
    this.head.rotation.z = Math.sin(this.phase * 0.5) * 0.12 * motion * energy;
    this.head.rotation.x = this.mood === 'lesu' ? 0.25 : 0;
    const blink = (time % 4) < 0.12 ? 0.15 : 1;
    this.eyes.forEach((e) => { e.scale.y = blink; });
  }
}
