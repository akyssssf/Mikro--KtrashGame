// Kolisi 2D sederhana di bidang tanah (XZ): lingkaran, kotak berputar, kapsul.
// Penghalang ber-flag water diabaikan saat pemain berada di atas jembatan.

export class CollisionWorld {
  constructor() {
    this.shapes = new Set();
    this.bridges = [];
    this.bounds = null;
  }

  // Batas pulau: persegi panjang sudut membulat (hw, hd = setengah lebar/dalam).
  setBounds(hw, hd, radius) { this.bounds = { hw, hd, radius }; }

  addCircle(x, z, r, opts = {}) { return this.#add({ kind: 'circle', x, z, r, ...opts }); }

  addBox(x, z, hw, hd, rot = 0, opts = {}) {
    return this.#add({ kind: 'box', x, z, hw, hd, rot, c: Math.cos(rot), s: Math.sin(rot), ...opts });
  }

  addCapsule(ax, az, bx, bz, r, opts = {}) { return this.#add({ kind: 'capsule', ax, az, bx, bz, r, ...opts }); }

  addBridge(x, z, hw, hd, rot = 0) {
    const b = { x, z, hw, hd, c: Math.cos(rot), s: Math.sin(rot) };
    this.bridges.push(b);
    return b;
  }

  remove(shape) { this.shapes.delete(shape); }

  #add(shape) {
    this.shapes.add(shape);
    return shape;
  }

  onBridge(x, z) {
    return this.bridges.some((b) => {
      const dx = x - b.x;
      const dz = z - b.z;
      const lx = dx * b.c - dz * b.s;
      const lz = dx * b.s + dz * b.c;
      return Math.abs(lx) <= b.hw && Math.abs(lz) <= b.hd;
    });
  }

  // Dorong posisi (objek {x, z}) keluar dari penghalang. Mengembalikan true bila tersentuh.
  resolve(p, radius) {
    let hit = false;
    const bridge = this.onBridge(p.x, p.z);
    for (let iter = 0; iter < 3; iter++) {
      let moved = false;
      for (const s of this.shapes) {
        if (s.water && bridge) continue;
        if (s.disabled) continue;
        if (this.#push(p, radius, s)) moved = true;
      }
      if (this.#clampBounds(p, radius)) moved = true;
      if (!moved) break;
      hit = true;
    }
    return hit;
  }

  blocked(x, z, radius) {
    const p = { x, z };
    const bridge = this.onBridge(x, z);
    for (const s of this.shapes) {
      if ((s.water && bridge) || s.disabled) continue;
      if (this.#push(p, radius, s)) return true;
    }
    return false;
  }

  #push(p, radius, s) {
    if (s.kind === 'circle') return pushFromPoint(p, s.x, s.z, s.r + radius);
    if (s.kind === 'capsule') {
      const abx = s.bx - s.ax;
      const abz = s.bz - s.az;
      const len2 = abx * abx + abz * abz || 1;
      const t = Math.max(0, Math.min(1, ((p.x - s.ax) * abx + (p.z - s.az) * abz) / len2));
      return pushFromPoint(p, s.ax + abx * t, s.az + abz * t, s.r + radius);
    }
    // Kotak berputar: kerjakan di ruang lokal kotak.
    const dx = p.x - s.x;
    const dz = p.z - s.z;
    const lx = dx * s.c - dz * s.s;
    const lz = dx * s.s + dz * s.c;
    const cx = Math.max(-s.hw, Math.min(s.hw, lx));
    const cz = Math.max(-s.hd, Math.min(s.hd, lz));
    let nx = lx - cx;
    let nz = lz - cz;
    const d = Math.hypot(nx, nz);
    let outX;
    let outZ;
    if (d > 1e-6) {
      if (d >= radius) return false;
      outX = cx + (nx / d) * radius;
      outZ = cz + (nz / d) * radius;
    } else {
      // Titik di dalam kotak: keluar lewat sisi terdekat.
      const px = s.hw - Math.abs(lx);
      const pz = s.hd - Math.abs(lz);
      if (px < pz) { outX = Math.sign(lx || 1) * (s.hw + radius); outZ = lz; }
      else { outX = lx; outZ = Math.sign(lz || 1) * (s.hd + radius); }
    }
    p.x = s.x + outX * s.c + outZ * s.s;
    p.z = s.z - outX * s.s + outZ * s.c;
    return true;
  }

  #clampBounds(p, radius) {
    const b = this.bounds;
    if (!b) return false;
    const hw = b.hw - radius;
    const hd = b.hd - radius;
    const r = Math.max(0, b.radius - radius);
    let x = Math.max(-hw, Math.min(hw, p.x));
    let z = Math.max(-hd, Math.min(hd, p.z));
    // Sudut membulat.
    const ix = hw - r;
    const iz = hd - r;
    if (Math.abs(x) > ix && Math.abs(z) > iz) {
      const cx = Math.sign(x) * ix;
      const cz = Math.sign(z) * iz;
      const dx = x - cx;
      const dz = z - cz;
      const d = Math.hypot(dx, dz);
      if (d > r) { x = cx + (dx / d) * r; z = cz + (dz / d) * r; }
    }
    const moved = x !== p.x || z !== p.z;
    p.x = x;
    p.z = z;
    return moved;
  }
}

function pushFromPoint(p, x, z, minDist) {
  const dx = p.x - x;
  const dz = p.z - z;
  const d = Math.hypot(dx, dz);
  if (d >= minDist) return false;
  if (d < 1e-6) { p.x = x + minDist; return true; }
  p.x = x + (dx / d) * minDist;
  p.z = z + (dz / d) * minDist;
  return true;
}
