// Efek jejak: kepulan debu tiap langkah + pita angin tipis di belakang pemain saat berlari.
import * as THREE from 'three';

const MAX_PUFFS = 48;
const TRAIL_POINTS = 22;

export class Trail {
  constructor(scene) {
    // Kepulan debu bulat (satu InstancedMesh).
    this.puffMesh = new THREE.InstancedMesh(
      new THREE.IcosahedronGeometry(1, 1),
      new THREE.MeshLambertMaterial({ color: 0xfff6e3, emissive: 0x6b6252, flatShading: true }),
      MAX_PUFFS,
    );
    this.puffMesh.count = 0;
    this.puffMesh.frustumCulled = false;
    scene.add(this.puffMesh);
    this.puffs = [];
    this.m = new THREE.Matrix4();

    // Pita angin: strip segitiga dengan alpha memudar ke ekor.
    const pos = new Float32Array(TRAIL_POINTS * 2 * 3);
    const col = new Float32Array(TRAIL_POINTS * 2 * 4);
    const idx = [];
    for (let i = 0; i < TRAIL_POINTS - 1; i++) {
      const a = i * 2;
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
    this.geo = new THREE.BufferGeometry();
    this.geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.geo.setAttribute('color', new THREE.BufferAttribute(col, 4));
    this.geo.setIndex(idx);
    this.ribbon = new THREE.Mesh(this.geo, new THREE.MeshBasicMaterial({
      vertexColors: true, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false,
    }));
    this.ribbon.frustumCulled = false;
    this.ribbon.renderOrder = 3;
    scene.add(this.ribbon);
    this.points = [];
    this.strength = 0;
    this.reducedMotion = false;
  }

  // Dipanggil tiap kaki menapak.
  step(pos, running) {
    const n = running ? 3 : 1;
    for (let i = 0; i < n && this.puffs.length < MAX_PUFFS; i++) {
      this.puffs.push({
        p: new THREE.Vector3(pos.x + (Math.random() - 0.5) * 0.4, 0.08, pos.z + (Math.random() - 0.5) * 0.4),
        v: new THREE.Vector3((Math.random() - 0.5) * 0.6, 0.5 + Math.random() * 0.4, (Math.random() - 0.5) * 0.6),
        life: 0,
        max: running ? 0.7 : 0.5,
        size: (running ? 0.2 : 0.13) * (0.8 + Math.random() * 0.4),
      });
    }
  }

  update(dt, player, running, camera) {
    // Debu: membesar lalu mengecil sambil naik pelan.
    let n = 0;
    for (let i = this.puffs.length - 1; i >= 0; i--) {
      const f = this.puffs[i];
      f.life += dt;
      if (f.life >= f.max) { this.puffs.splice(i, 1); continue; }
      const k = f.life / f.max;
      f.p.addScaledVector(f.v, dt);
      f.v.multiplyScalar(1 - dt * 3);
      const s = f.size * Math.sin(Math.min(1, k * 1.3) * Math.PI);
      this.m.makeScale(s, s * 0.8, s).setPosition(f.p);
      this.puffMesh.setMatrixAt(n++, this.m);
    }
    this.puffMesh.count = n;
    if (n) this.puffMesh.instanceMatrix.needsUpdate = true;

    // Pita: rekam posisi pinggang pemain, lebar & alpha memudar.
    this.strength += ((running && !this.reducedMotion ? 1 : 0) - this.strength) * Math.min(1, dt * 6);
    const head = player.position.clone().setY(0.75);
    const last = this.points[0];
    if (!last || last.distanceToSquared(head) > 0.04) this.points.unshift(head);
    if (this.points.length > TRAIL_POINTS) this.points.length = TRAIL_POINTS;
    this.ribbon.visible = this.strength > 0.02 && this.points.length > 2;
    if (!this.ribbon.visible) return;
    const pos = this.geo.attributes.position;
    const col = this.geo.attributes.color;
    const toCam = new THREE.Vector3();
    const side = new THREE.Vector3();
    for (let i = 0; i < TRAIL_POINTS; i++) {
      const p = this.points[Math.min(i, this.points.length - 1)];
      const nxt = this.points[Math.min(i + 1, this.points.length - 1)];
      const dir = p.clone().sub(nxt);
      toCam.copy(camera.position).sub(p);
      side.crossVectors(dir, toCam).normalize();
      const k = i / (TRAIL_POINTS - 1);
      const w = 0.22 * (1 - k);
      pos.setXYZ(i * 2, p.x + side.x * w, p.y + side.y * w, p.z + side.z * w);
      pos.setXYZ(i * 2 + 1, p.x - side.x * w, p.y - side.y * w, p.z - side.z * w);
      const a = (1 - k) * 0.55 * this.strength * (i < this.points.length - 1 ? 1 : 0);
      col.setXYZW(i * 2, 1, 1, 1, a);
      col.setXYZW(i * 2 + 1, 1, 1, 1, a);
    }
    pos.needsUpdate = true;
    col.needsUpdate = true;
  }
}
