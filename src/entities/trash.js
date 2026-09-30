// Sampah di dunia: model, sorotan, animasi dipungut, dan (opsional) hanyut di sungai.
import * as THREE from 'three';
import { ITEM_TYPES } from '../data/items.js';
import { applyWear, makeItemModel, rememberLook, setEmissive } from '../world/items3d.js';

export class Trash {
  constructor({ gid, itemId, typeId, x = 0, y = 0, z = 0, rot = 0, lying = true }) {
    this.gid = gid;
    this.itemId = itemId;
    this.typeId = typeId;
    this.type = ITEM_TYPES[typeId];
    this.group = new THREE.Group();
    this.model = makeItemModel(this.type.model);
    // Sampah plastik tergeletak miring agar terlihat dibuang, bukan dipajang.
    if (lying && this.type.kode !== 'organik' && this.type.model.startsWith('bottle')) {
      this.model.rotation.z = Math.PI / 2;
      this.model.position.y = this.model.userData.radius * 0.9;
    }
    this.group.add(this.model);
    this.group.position.set(x, y, z);
    this.group.rotation.y = rot;
    rememberLook(this.model);
    this.position = this.group.position;
    this.height = Math.max(0.5, this.model.userData.height) + y;
    this.glow = 0;
    this.highlighted = false;
    this.flying = null;
    this.float = null;
    this.gone = false;
  }

  get organic() { return this.type.kode === 'organik'; }

  setHighlight(on) { this.highlighted = on; }

  // Tampilan tahap terurai (dipakai Lensa Waktu). k 0…1.
  setWear(k) { applyWear(this.model, k, this.organic); }

  // Animasi terbang ke keranjang pemain, lalu hilang.
  flyTo(getTarget, onDone) {
    this.flying = { t: 0, from: this.position.clone(), getTarget, onDone };
    this.float = null;
  }

  update(dt, time) {
    if (this.flying) {
      const f = this.flying;
      f.t += dt / 0.45;
      const k = Math.min(1, f.t);
      const e = k * k * (3 - 2 * k);
      const to = f.getTarget();
      this.position.lerpVectors(f.from, to, e);
      this.position.y += Math.sin(k * Math.PI) * 1.6;
      this.group.scale.setScalar(1 - 0.7 * e);
      this.group.rotation.y += dt * 10;
      if (k >= 1) {
        this.flying = null;
        this.gone = true;
        this.group.removeFromParent();
        f.onDone?.();
      }
      return;
    }
    const target = this.highlighted ? 0.35 + 0.2 * Math.sin(time * 6) : 0;
    const next = this.glow + (target - this.glow) * Math.min(1, dt * 10);
    if (Math.abs(next - this.glow) > 1e-3 || (target === 0 && this.glow !== 0)) {
      this.glow = next < 1e-3 ? 0 : next;
      setEmissive(this.model, this.glow);
    }
  }
}
