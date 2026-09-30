// Model sampah prosedural (diadaptasi dari demo lama). Tiap model memakai material unik
// supaya bisa dikusamkan/dipudarkan saat waktu dimajukan.
import * as THREE from 'three';
import { toon } from './builders.js';

const M = (color, opts = {}) => toon({ color, ...opts });
const clear = (op) => ({ transparent: true, opacity: op, roughness: 0.25 });

// Sampah kecil tidak memberi bayangan (menghemat draw call bayangan).
function mesh(geo, material, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, material);
  m.position.set(x, y, z);
  return m;
}
const cyl = (rt, rb, h, mat, x, y, z, seg = 16) => mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat, x, y, z);
const box = (w, h, d, mat, x, y, z) => mesh(new THREE.BoxGeometry(w, h, d), mat, x, y, z);
const sph = (r, mat, x, y, z, sx = 1, sy = 1, sz = 1) => {
  const m = mesh(new THREE.SphereGeometry(r, 14, 10), mat, x, y, z);
  m.scale.set(sx, sy, sz);
  return m;
};
const tor = (r, t, arc, mat, x, y, z) => mesh(new THREE.TorusGeometry(r, t, 6, 14, arc), mat, x, y, z);

function bottle(body, cap, label, op = 0.75) {
  const g = new THREE.Group();
  g.add(cyl(0.27, 0.27, 0.72, M(body, clear(op)), 0, 0.36, 0));
  g.add(cyl(0.275, 0.275, 0.24, M(label), 0, 0.4, 0));
  g.add(cyl(0.11, 0.27, 0.22, M(body, clear(op)), 0, 0.83, 0));
  g.add(cyl(0.12, 0.12, 0.14, M(cap), 0, 1.0, 0));
  return g;
}

function kresek(color) {
  const g = new THREE.Group();
  g.add(sph(0.5, M(color, { roughness: 0.35 }), 0, 0.5, 0, 0.95, 1.05, 0.4));
  g.add(tor(0.15, 0.035, Math.PI, M(color), -0.2, 1.02, 0), tor(0.15, 0.035, Math.PI, M(color), 0.2, 1.02, 0));
  return g;
}

const BUILDERS = {
  bottleWater: () => bottle(0xa8dcff, 0x2563eb, 0xffffff),
  bottleSoda: () => bottle(0x2fb37b, 0xdc2626, 0xef4444, 0.85),
  bottleShampoo: () => {
    const g = new THREE.Group();
    g.add(cyl(0.32, 0.32, 0.72, M(0xffc2dc), 0, 0.36, 0), cyl(0.14, 0.22, 0.16, M(0xffc2dc), 0, 0.8, 0));
    g.add(cyl(0.05, 0.05, 0.26, M(0xffffff), 0, 1.0, 0), box(0.26, 0.06, 0.08, M(0xffffff), 0.08, 1.15, 0));
    return g;
  },
  jerrycan: () => {
    const g = new THREE.Group();
    g.add(box(0.85, 0.85, 0.5, M(0x35b6c9), 0, 0.425, 0), cyl(0.12, 0.12, 0.12, M(0xffffff), 0.25, 0.9, 0));
    g.add(tor(0.2, 0.045, Math.PI, M(0x35b6c9), -0.12, 0.85, 0));
    return g;
  },
  pipe: () => {
    const g = new THREE.Group();
    const p = cyl(0.3, 0.3, 1.25, M(0xd6dde2), 0, 0.3, 0);
    p.rotation.z = Math.PI / 2;
    g.add(p);
    return g;
  },
  kresek: () => kresek(0xef4444),
  kresekBlack: () => kresek(0x2b2f36),
  breadBag: () => {
    const g = new THREE.Group();
    g.add(sph(0.55, M(0xfde68a, clear(0.85)), 0, 0.3, 0, 1.1, 0.55, 0.55));
    g.add(box(0.08, 0.3, 0.5, M(0xfde68a), -0.6, 0.3, 0), box(0.08, 0.3, 0.5, M(0xfde68a), 0.6, 0.3, 0));
    return g;
  },
  cupStraw: () => {
    const g = new THREE.Group();
    g.add(cyl(0.34, 0.23, 0.68, M(0xffffff, clear(0.6)), 0, 0.34, 0));
    const rim = tor(0.34, 0.03, Math.PI * 2, M(0xffffff), 0, 0.68, 0);
    rim.rotation.x = Math.PI / 2;
    g.add(rim);
    const s = cyl(0.03, 0.03, 0.95, M(0xef4444), 0.08, 0.65, 0, 6);
    s.rotation.z = -0.15;
    g.add(s);
    return g;
  },
  foodBox: () => {
    const g = new THREE.Group();
    g.add(box(1.0, 0.42, 0.68, M(0xfffbe6), 0, 0.21, 0), box(1.06, 0.12, 0.74, M(0x4ade80), 0, 0.47, 0));
    return g;
  },
  foamBox: () => {
    const g = new THREE.Group();
    g.add(box(1.0, 0.5, 0.72, M(0xfafafa, { roughness: 1 }), 0, 0.25, 0));
    g.add(box(1.02, 0.05, 0.74, M(0xe5e7eb, { roughness: 1 }), 0, 0.52, 0));
    return g;
  },
  gallon: () => {
    const g = new THREE.Group();
    g.add(cyl(0.4, 0.4, 0.8, M(0x2d6cdf, clear(0.75)), 0, 0.4, 0), cyl(0.16, 0.4, 0.3, M(0x2d6cdf, clear(0.75)), 0, 0.95, 0));
    g.add(cyl(0.16, 0.16, 0.12, M(0x1e40af), 0, 1.16, 0));
    return g;
  },
  leaf: () => {
    const g = new THREE.Group();
    g.add(sph(0.5, M(0x7a9a2f), 0, 0.05, 0, 1, 0.12, 0.55));
    const stem = cyl(0.02, 0.02, 0.4, M(0x6b4a2b), 0.55, 0.05, 0, 5);
    stem.rotation.z = Math.PI / 2;
    g.add(stem);
    return g;
  },
  banana: () => {
    const g = new THREE.Group();
    const t = tor(0.42, 0.11, Math.PI * 1.25, M(0xf3c623), 0, 0.15, 0);
    t.scale.z = 0.6;
    t.rotation.x = Math.PI / 2;
    g.add(t);
    return g;
  },
};

// Model di atas tanah (dasar y = 0), skala demo × scale.
export function makeItemModel(model, scale = 0.42) {
  const build = BUILDERS[model];
  if (!build) throw new Error(`Model sampah tidak dikenal: ${model}`);
  const inner = build();
  const b = new THREE.Box3().setFromObject(inner);
  inner.position.y = -b.min.y;
  const outer = new THREE.Group();
  outer.add(inner);
  outer.scale.setScalar(scale);
  outer.userData.height = (b.max.y - b.min.y) * scale;
  outer.userData.radius = Math.max(b.max.x - b.min.x, b.max.z - b.min.z) * 0.5 * scale;
  return outer;
}

// Simpan warna/opasitas asli agar bisa dikembalikan setelah efek waktu.
export function rememberLook(obj) {
  obj.traverse((m) => {
    if (!m.isMesh) return;
    m.material.userData.c0 ??= m.material.color.clone();
    m.material.userData.o0 ??= m.material.opacity;
    m.material.userData.t0 ??= m.material.transparent;
  });
}

const DIRT = new THREE.Color(0x6e6a55);

// Terapkan tampilan tahap terurai. k: 0 (baru) … 1 (hampir hancur).
export function applyWear(obj, k, organic) {
  obj.traverse((m) => {
    if (!m.isMesh) return;
    const mat = m.material;
    const c0 = mat.userData.c0;
    if (!c0) return;
    const fade = organic ? 1 - 0.8 * k : 1 - 0.45 * k;
    mat.transparent = mat.userData.t0 || fade < 1;
    mat.opacity = mat.userData.o0 * fade;
    mat.color.copy(c0).lerp(DIRT, organic ? 0.7 * k : 0.6 * k);
  });
}

export function setEmissive(obj, amount, color = 0xffd166) {
  obj.traverse((m) => {
    if (!m.isMesh) return;
    m.material.emissive.setHex(color);
    m.material.emissiveIntensity = amount;
  });
}
