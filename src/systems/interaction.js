// Memilih objek interaktif terdekat, menyorotnya, menampilkan prompt, dan klik-untuk-bergerak.
import * as THREE from 'three';

const TAP_RADIUS_PX = 56;
const GRABBER_BONUS = 0.9;

export class Interaction {
  constructor(game) {
    this.game = game;
    this.list = [];
    this.global = [];
    this.current = null;
    this.raycaster = new THREE.Raycaster();
    this.groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    this.tmp = new THREE.Vector3();
  }

  setList(list) {
    this.current?.highlight?.(false);
    this.current = null;
    this.list = list;
  }

  all() { return this.global.length ? [...this.list, ...this.global] : this.list; }

  rangeOf(it) {
    const bonus = it.pickable && this.game.progress.hasTool('pencapit') ? GRABBER_BONUS : 0;
    return (typeof it.range === 'function' ? it.range() : it.range) + bonus;
  }

  // Terdekat dalam jangkauan, diutamakan yang ada di depan pemain.
  findNearest() {
    const p = this.game.player.position;
    const heading = this.game.player.heading;
    const fx = Math.sin(heading);
    const fz = Math.cos(heading);
    let best = null;
    let bestScore = Infinity;
    for (const it of this.all()) {
      if (!it.enabled()) continue;
      const dx = it.position.x - p.x;
      const dz = it.position.z - p.z;
      const d = Math.hypot(dx, dz);
      if (d > this.rangeOf(it)) continue;
      const facing = d > 0.01 ? (dx * fx + dz * fz) / d : 1;
      const score = d - facing * 0.6;
      if (score < bestScore) { bestScore = score; best = it; }
    }
    return best;
  }

  update(active) {
    const next = active ? this.findNearest() : null;
    if (next !== this.current) {
      this.current?.highlight?.(false);
      next?.highlight?.(true);
      this.current = next;
    }
    const prompt = next?.prompt();
    if (!next || !prompt) {
      this.game.ui.prompt.hide();
      return;
    }
    this.tmp.set(next.position.x, next.height ?? 2, next.position.z);
    this.game.ui.prompt.show(prompt, this.screenOf(this.tmp));
  }

  interact() {
    const it = this.current;
    if (!it || !it.prompt()) return false;
    this.game.player.cancelWalk();
    it.action();
    return true;
  }

  screenOf(v) {
    const p = v.clone().project(this.game.camera);
    return { x: (p.x * 0.5 + 0.5) * window.innerWidth, y: (-p.y * 0.5 + 0.5) * window.innerHeight, behind: p.z > 1 };
  }

  // Klik: pada objek interaktif → jalan ke sana lalu pakai; pada tanah → jalan ke titik itu.
  handleTap(x, y) {
    let best = null;
    let bestD = TAP_RADIUS_PX;
    for (const it of this.all()) {
      if (!it.enabled()) continue;
      for (const h of [0.3, (it.height ?? 2) * 0.5]) {
        const s = this.screenOf(this.tmp.set(it.position.x, h, it.position.z));
        const d = Math.hypot(s.x - x, s.y - y);
        if (d < bestD) { bestD = d; best = it; }
      }
    }
    const player = this.game.player;
    if (best) {
      const range = this.rangeOf(best) * 0.8;
      const dx = best.position.x - player.position.x;
      const dz = best.position.z - player.position.z;
      const d = Math.hypot(dx, dz);
      const act = () => {
        if (!best.enabled() || !best.prompt()) return;
        player.heading = Math.atan2(best.position.x - player.position.x, best.position.z - player.position.z);
        best.action();
      };
      if (d <= range) act();
      else player.walkTo(best.position.x - (dx / d) * range * 0.8, best.position.z - (dz / d) * range * 0.8, act, 0.3);
      return;
    }
    const ndc = new THREE.Vector2((x / window.innerWidth) * 2 - 1, -(y / window.innerHeight) * 2 + 1);
    this.raycaster.setFromCamera(ndc, this.game.camera);
    const hit = this.raycaster.ray.intersectPlane(this.groundPlane, this.tmp);
    if (hit) {
      player.walkTo(hit.x, hit.z);
      this.game.ui.clickMarker?.(hit.x, hit.z);
    }
  }
}
