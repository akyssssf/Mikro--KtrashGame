// Partikel ringan (satu InstancedMesh untuk semua percikan) + penanda klik.
import * as THREE from 'three';

const MAX = 160;

export class Effects {
  constructor(scene) {
    this.mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), new THREE.MeshBasicMaterial(), MAX);
    this.mesh.frustumCulled = false;
    this.mesh.count = 0;
    scene.add(this.mesh);
    this.parts = [];
    this.m = new THREE.Matrix4();
    this.c = new THREE.Color();
    this.reducedMotion = false;

    this.marker = new THREE.Mesh(new THREE.RingGeometry(0.25, 0.4, 20), new THREE.MeshBasicMaterial({ color: 0xf08a2c, transparent: true, depthWrite: false }));
    this.marker.rotation.x = -Math.PI / 2;
    this.marker.visible = false;
    scene.add(this.marker);
    this.markerT = 0;
  }

  burst(pos, color, n = 12, { up = 4, spread = 2.5, life = 0.7, gravity = 12 } = {}) {
    if (this.reducedMotion) n = Math.ceil(n / 3);
    for (let i = 0; i < n && this.parts.length < MAX; i++) {
      this.parts.push({
        p: new THREE.Vector3(pos.x, (pos.y ?? 0) + 0.6, pos.z),
        v: new THREE.Vector3((Math.random() - 0.5) * spread, up * (0.5 + Math.random()), (Math.random() - 0.5) * spread),
        life, max: life, color: this.c.set(color).clone(), gravity,
      });
    }
  }

  sparkle(pos, color = 0xffd166) { this.burst(pos, color, 10, { up: 3, spread: 2, life: 0.6 }); }
  dust(pos) { this.burst(pos, 0x8b7355, 16, { up: 2, spread: 3, life: 0.8, gravity: 6 }); }
  confetti(pos) {
    for (const c of [0x2fb35a, 0xf08a2c, 0x2563eb, 0xf5b82e]) this.burst(pos, c, 8, { up: 6, spread: 4, life: 1.1 });
  }

  clickMarker(x, z) {
    this.marker.position.set(x, 0.06, z);
    this.marker.visible = true;
    this.markerT = 0.6;
  }

  update(dt) {
    let n = 0;
    for (let i = this.parts.length - 1; i >= 0; i--) {
      const p = this.parts[i];
      p.life -= dt;
      if (p.life <= 0) { this.parts.splice(i, 1); continue; }
      p.v.y -= p.gravity * dt;
      p.p.addScaledVector(p.v, dt);
      const s = Math.max(0.05, p.life / p.max);
      this.m.makeScale(s, s, s).setPosition(p.p);
      this.mesh.setMatrixAt(n, this.m);
      this.mesh.setColorAt(n, p.color);
      n++;
    }
    this.mesh.count = n;
    if (n) {
      this.mesh.instanceMatrix.needsUpdate = true;
      if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
    }
    if (this.markerT > 0) {
      this.markerT -= dt;
      this.marker.material.opacity = Math.max(0, this.markerT / 0.6);
      this.marker.scale.setScalar(1 + (0.6 - this.markerT));
      if (this.markerT <= 0) this.marker.visible = false;
    }
  }
}
