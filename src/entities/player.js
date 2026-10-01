import * as THREE from 'three';
import { box, cyl, ico, mesh, uniqueMat } from '../world/builders.js';
import { cloneAsset } from '../core/assets.js';

const WALK = 4.2;
const RUN = 6.8;
export const PLAYER_RADIUS = 0.42;

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
    if (planar > 0.3) {
      const target = Math.atan2(this.velocity.x, this.velocity.z);
      let diff = target - this.heading;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      this.heading += diff * Math.min(1, dt * 12);
    }
    this.group.rotation.y = this.heading;

    const actual = moved / Math.max(dt, 1e-4);
    this.walkPhase += dt * actual * 2.4;
    const amp = Math.min(1, actual / WALK) * (this.reducedMotion ? 0.4 : 0.7);
    const s = Math.sin(this.walkPhase);
    this.legs[0].rotation.x = s * amp;
    this.legs[1].rotation.x = -s * amp;
    this.arms[0].rotation.x = -s * amp * 0.8;
    this.arms[1].rotation.x = s * amp * 0.8;
    this.body.position.y = Math.abs(Math.cos(this.walkPhase)) * 0.06 * amp;
    if (this.swingT > 0) {
      this.swingT -= dt;
      this.arms[1].rotation.x = -2.2 * Math.sin((this.swingT / 0.35) * Math.PI);
    }
    return actual;
  }
}

function blobShadow() {
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.45, 16), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.18, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.03;
  return shadow;
}
