import * as THREE from 'three';
import { box, cyl, ico, mesh, uniqueMat } from '../world/builders.js';
import { cloneAsset } from '../core/assets.js';

const WALK = 4.2;
const RUN = 6.8;
export const PLAYER_RADIUS = 0.42;
const IDLE_ACTIONS = [
  { name: 'look', dur: 2.2 },
  { name: 'wave', dur: 1.8 },
  { name: 'hop', dur: 1.1 },
  { name: 'tap', dur: 1.6 },
  { name: 'stretch', dur: 1.9 },
];

export class Player {
  constructor() {
    this.group = new THREE.Group();
    this.position = this.group.position;
    this.velocity = new THREE.Vector3();
    this.heading = 0;
    this.moveTarget = null;
    this.onArrive = null;
    this.stuckTime = 0;
    this.walkPhase = 0;
    this.walkK = 0;
    this.runK = 0;
    this.time = 0;
    this.onStep = null;
    this.idleT = 0;
    this.nextIdle = 2.5;
    this.idleAction = null;
    this.reducedMotion = false;
    this.#build();
  }

  #build() {
    const g = this.group;
    const body = new THREE.Group();
    this.body = body;
    g.add(body);
    g.add(blobShadow());
    const glb = cloneAsset('player');
    if (glb) {
      this.#buildFromAsset(glb);
      return;
    }
    this.legs = [-0.15, 0.15].map((x) => {
      const pivot = new THREE.Group();
      pivot.position.set(x, 0.72, 0);
      pivot.add(cyl(0.11, 0.1, 0.7, 0x2c4a6e, 0, -0.35, 0, 7));
      pivot.add(box(0.2, 0.12, 0.3, 0x3f2a1d, 0, -0.68, 0.05));
      body.add(pivot);
      return pivot;
    });
    const torso = cyl(0.3, 0.36, 0.72, 0x2fb35a, 0, 1.08, 0, 9);
    body.add(torso);
    body.add(box(0.5, 0.12, 0.34, 0xf5f0e1, 0, 1.4, 0.06));
    this.arms = [-1, 1].map((side) => {
      const pivot = new THREE.Group();
      pivot.position.set(side * 0.38, 1.38, 0);
      pivot.add(cyl(0.08, 0.08, 0.6, 0x2fb35a, 0, -0.28, 0, 6));
      pivot.add(ico(0.09, 0xe0a97a, 0, -0.62, 0));
      body.add(pivot);
      return pivot;
    });
    const head = new THREE.Group();
    head.position.y = 1.78;
    head.add(ico(0.34, 0xe8b58a, 0, 0, 0, 1));
    head.add(ico(0.33, 0x3b2a1a, 0, 0.1, -0.06, 1));
    head.add(box(0.07, 0.09, 0.03, 0x17324d, -0.12, 0.02, 0.31), box(0.07, 0.09, 0.03, 0x17324d, 0.12, 0.02, 0.31));
    // Topi caping kecil berwarna oranye (ciri khas penjaga).
    const cap = mesh(new THREE.ConeGeometry(0.46, 0.22, 10), uniqueMat(0xe8741f), 0, 0.3, 0);
    head.add(cap);
    body.add(head);
    this.head = head;
    // Keranjang di punggung.
    const basket = new THREE.Group();
    basket.position.set(0, 1.1, -0.36);
    basket.add(cyl(0.26, 0.2, 0.42, 0xc08a4a, 0, 0, 0, 8));
    basket.add(cyl(0.27, 0.27, 0.05, 0x8b5a2b, 0, 0.21, 0, 8));
    body.add(basket);
    this.basket = basket;
    this.basketFill = mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.05, 8), uniqueMat(0x60a5fa), 0, 0.05, 0);
    this.basketFill.visible = false;
    basket.add(this.basketFill);
    // Jaring (muncul saat didapat).
    const net = new THREE.Group();
    net.add(cyl(0.03, 0.03, 1.5, 0x7a5230, 0, 0.75, 0, 5));
    const hoop = mesh(new THREE.TorusGeometry(0.28, 0.03, 5, 12), uniqueMat(0x7a5230), 0, 1.6, 0);
    hoop.rotation.x = Math.PI / 2;
    net.add(hoop);
    const bag = mesh(new THREE.ConeGeometry(0.26, 0.45, 8, 1, true), uniqueMat(0xf5f0e1, { transparent: true, opacity: 0.8, side: THREE.DoubleSide }), 0, 1.4, 0);
    net.add(bag);
    net.position.set(0.2, 0.6, -0.42);
    net.rotation.z = -0.35;
    net.visible = false;
    body.add(net);
    this.net = net;

    // Hanya bagian besar yang memberi bayangan.
    g.traverse((o) => { if (o.isMesh) o.castShadow = false; });
    for (const part of [...this.legs, torso, head.children[0], basket.children[0]]) {
      part.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    }
  }

  // Aset GLB: node leg_L/leg_R/arm_L/arm_R/head/basket (pivot sendi sudah dibetulkan pemuat).
  #buildFromAsset(glb) {
    glb.scale.setScalar(1.15);
    this.body.add(glb);
    const part = (n) => glb.getObjectByName(n) ?? new THREE.Group();
    this.legs = [part('leg_L'), part('leg_R')];
    this.arms = [part('arm_L'), part('arm_R')];
    this.head = part('head');
    this.basket = part('basket');
    this.basketFill = null;
    this.net = cloneAsset('net', { shadow: false }) ?? new THREE.Group();
    this.net.position.set(0.22, 0.45, -0.42);
    this.net.rotation.z = -0.35;
    this.net.visible = false;
    this.body.add(this.net);
  }

  setTools(tools) { this.net.visible = !!tools.jaring; }

  setBasketLevel(count, capacity) {
    if (!this.basketFill) return;
    this.basketFill.visible = count > 0;
    this.basketFill.position.y = -0.18 + 0.38 * (count / capacity);
  }

  walkTo(x, z, onArrive = null, stopDistance = 0.25) {
    this.moveTarget = { x, z, stop: stopDistance };
    this.onArrive = onArrive;
    this.stuckTime = 0;
  }

  cancelWalk() {
    this.moveTarget = null;
    this.onArrive = null;
  }

  // Swing jaring sebentar (umpan balik visual).
  swing() { this.swingT = 0.35; }

  update(dt, input, rig, collision, enabled = true) {
    const desired = new THREE.Vector3();
    if (enabled) {
      const a = input.axis();
      if (a.x || a.y) {
        rig.toWorldDir(a.x, a.y, desired);
        this.cancelWalk();
      } else if (this.moveTarget) {
        const dx = this.moveTarget.x - this.position.x;
        const dz = this.moveTarget.z - this.position.z;
        const d = Math.hypot(dx, dz);
        if (d <= this.moveTarget.stop) {
          const cb = this.onArrive;
          this.cancelWalk();
          cb?.();
        } else {
          desired.set(dx / d, 0, dz / d).multiplyScalar(Math.min(1, d / 0.6 + 0.3));
        }
      }
    }
    const speed = enabled && input.down('run') ? RUN : WALK;
    desired.multiplyScalar(speed);
    const k = 1 - Math.exp(-dt * 12);
    this.velocity.lerp(desired, k);

    const before = { x: this.position.x, z: this.position.z };
    const p = { x: this.position.x + this.velocity.x * dt, z: this.position.z + this.velocity.z * dt };
    collision.resolve(p, PLAYER_RADIUS);
    this.position.x = p.x;
    this.position.z = p.z;

    const moved = Math.hypot(p.x - before.x, p.z - before.z);
    if (this.moveTarget) {
      this.stuckTime = moved < dt * 0.6 ? this.stuckTime + dt : 0;
      if (this.stuckTime > 0.5) this.cancelWalk();
    }

    const planar = Math.hypot(this.velocity.x, this.velocity.z);
    let turn = 0;
    if (planar > 0.3) {
      const target = Math.atan2(this.velocity.x, this.velocity.z);
      const diff = Math.atan2(Math.sin(target - this.heading), Math.cos(target - this.heading));
      turn = diff * Math.min(1, dt * 12);
      this.heading += turn;
    }
    this.group.rotation.y = this.heading;

    const actual = moved / Math.max(dt, 1e-4);
    this.#animate(dt, actual, turn / Math.max(dt, 1e-4));
    return actual;
  }

  // Siklus diam / jalan / lari dengan pembauran halus, condong saat lari & berbelok,
  // pantulan badan saat kaki menapak, napas saat diam. onStep dipanggil tiap langkah (untuk debu).
  #animate(dt, speed, turnRate) {
    const motion = this.reducedMotion ? 0.45 : 1;
    const walkK = Math.min(1, speed / WALK);
    const runK = THREE.MathUtils.clamp((speed - WALK) / (RUN - WALK), 0, 1);
    const blend = 1 - Math.exp(-dt * 10);
    this.walkK += (walkK - this.walkK) * blend;
    this.runK += (runK - this.runK) * blend;
    const wk = this.walkK;
    const rk = this.runK;

    const prev = this.walkPhase;
    this.walkPhase += dt * speed * (2.3 + 0.5 * rk);
    // Tiap setengah siklus = satu kaki menapak.
    if (speed > 0.8 && Math.floor(prev / Math.PI) !== Math.floor(this.walkPhase / Math.PI)) {
      this.onStep?.(this.position, rk > 0.5);
    }
    const s = Math.sin(this.walkPhase);
    const legAmp = (0.55 + 0.35 * rk) * wk * motion;
    const armAmp = (0.5 + 0.6 * rk) * wk * motion;
    // Kaki: ayunan maju-mundur; saat lari lutut "terangkat" (rotasi lebih besar di fase depan).
    this.legs[0].rotation.x = s * legAmp - Math.max(0, s) * 0.25 * rk;
    this.legs[1].rotation.x = -s * legAmp - Math.max(0, -s) * 0.25 * rk;
    this.arms[0].rotation.x = -s * armAmp;
    this.arms[1].rotation.x = s * armAmp;
    // Lengan sedikit membuka ke samping saat lari.
    this.arms[0].rotation.z = 0.12 * rk * motion;
    this.arms[1].rotation.z = -0.12 * rk * motion;

    const bounce = Math.abs(Math.cos(this.walkPhase));
    this.time += dt;
    const breathe = (1 - wk) * Math.sin(this.time * 2.2) * 0.012 * motion;
    this.body.position.y = bounce * (0.05 + 0.05 * rk) * wk * motion;
    // Squash-stretch: memendek saat menapak, memanjang di udara.
    const squash = (bounce - 0.5) * 0.06 * wk * motion;
    this.body.scale.set(1 - squash * 0.5, 1 + squash + breathe, 1 - squash * 0.5);
    // Condong ke depan saat lari dan ke dalam saat berbelok.
    const lean = (0.06 * wk + 0.16 * rk) * motion;
    const bank = THREE.MathUtils.clamp(-turnRate * 0.03, -0.18, 0.18) * wk * motion;
    this.body.rotation.x += (lean - this.body.rotation.x) * blend;
    this.body.rotation.z += (bank - this.body.rotation.z) * blend;
    // Kepala sedikit menahan goyangan badan supaya terlihat stabil.
    this.head.rotation.x = -this.body.rotation.x * 0.5 + Math.sin(this.walkPhase * 2) * 0.03 * wk * motion;
    this.head.rotation.z = -this.body.rotation.z * 0.6;
    this.head.rotation.y = 0;
    this.#idle(dt, wk, motion);

    if (this.swingT > 0) {
      this.swingT -= dt;
      this.arms[1].rotation.x = -2.2 * Math.sin((this.swingT / 0.35) * Math.PI);
    }
  }

  // Idle lucu: setelah diam beberapa detik, pemain melakukan gerakan acak
  // (menoleh, melambai, melompat kecil, mengetuk kaki, menggeliat).
  #idle(dt, wk, motion) {
    if (wk > 0.08 || this.swingT > 0) {
      this.idleT = 0;
      this.idleAction = null;
      return;
    }
    this.idleT += dt;
    if (!this.idleAction && this.idleT > this.nextIdle) {
      const options = IDLE_ACTIONS.filter((a) => a.name !== this.lastIdle);
      const pick = options[Math.floor(Math.random() * options.length)];
      this.idleAction = { ...pick, t: 0 };
      this.lastIdle = pick.name;
      this.onIdle?.(pick.name);
    }
    const a = this.idleAction;
    if (!a) return;
    a.t += dt;
    const k = Math.min(1, a.t / a.dur);
    // Masuk dan keluar gerakan dengan halus.
    const env = Math.min(1, k * 5, (1 - k) * 5) * motion;
    const [armL, armR] = this.arms;
    switch (a.name) {
      case 'look':
        this.head.rotation.y = Math.sin(k * Math.PI * 2) * 0.75 * env;
        this.head.rotation.x += Math.sin(k * Math.PI * 4) * 0.08 * env;
        break;
      case 'wave':
        armR.rotation.z = -2.5 * env + Math.sin(a.t * 14) * 0.35 * env;
        armR.rotation.x = 0;
        this.head.rotation.z += 0.15 * env;
        this.body.rotation.z += -0.05 * env;
        break;
      case 'hop': {
        const hop = Math.abs(Math.sin(k * Math.PI * 2));
        this.body.position.y += hop * 0.28 * env;
        const land = (1 - hop) * env;
        this.body.scale.set(1 + 0.08 * land, 1 - 0.1 * land, 1 + 0.08 * land);
        armL.rotation.z = 0.9 * hop * env;
        armR.rotation.z = -0.9 * hop * env;
        break;
      }
      case 'tap':
        this.legs[1].rotation.x = -Math.abs(Math.sin(a.t * 9)) * 0.4 * env;
        this.head.rotation.z += Math.sin(a.t * 9) * 0.06 * env;
        armL.rotation.z = 0.25 * env;
        armR.rotation.z = -0.25 * env;
        break;
      case 'stretch':
        armL.rotation.z = 2.8 * env;
        armR.rotation.z = -2.8 * env;
        armL.rotation.x = armR.rotation.x = 0;
        this.body.scale.y *= 1 + 0.07 * env;
        this.head.rotation.x = -0.35 * env;
        break;
      default:
        break;
    }
    if (k >= 1) {
      this.idleAction = null;
      this.idleT = 0;
      this.nextIdle = 3 + Math.random() * 3;
    }
  }
}

// Bayangan kontak lembut di bawah kaki (gradasi radial). Sedikit di atas tanah + polygonOffset
// supaya tidak berkedip/bergaris (z-fighting) dengan jalan setapak yang juga nyaris rata tanah.
let blobTexture = null;
function blobShadow() {
  if (!blobTexture) {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const ctx = c.getContext('2d');
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(0,0,0,0.35)');
    grad.addColorStop(0.6, 'rgba(0,0,0,0.18)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    blobTexture = new THREE.CanvasTexture(c);
  }
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.1), new THREE.MeshBasicMaterial({
    map: blobTexture, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4,
  }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.06;
  shadow.renderOrder = 2;
  return shadow;
}
