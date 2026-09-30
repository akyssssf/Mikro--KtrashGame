// Pembuat bentuk low-poly prosedural + "bake" untuk menggabungkan properti statis
// menjadi sedikit mesh (hemat draw call).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const matCache = new Map();

// Material bersama per warna (dipakai sebelum di-bake / untuk objek dinamis).
export function mat(color, opts = {}) {
  const key = `${color}|${JSON.stringify(opts)}`;
  if (!matCache.has(key)) {
    matCache.set(key, new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0, flatShading: true, ...opts }));
  }
  return matCache.get(key);
}

// Material unik (untuk objek yang warnanya/transparansinya diubah per objek).
export const uniqueMat = (color, opts = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0, flatShading: true, ...opts });

export function place(obj, x = 0, y = 0, z = 0, ry = 0) {
  obj.position.set(x, y, z);
  obj.rotation.y = ry;
  return obj;
}

export function mesh(geo, material, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, material);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

export const box = (w, h, d, color, x, y, z) => mesh(new THREE.BoxGeometry(w, h, d), mat(color), x, y, z);
export const cyl = (rt, rb, h, color, x, y, z, seg = 10) =>
  mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat(color), x, y, z);
export const cone = (r, h, color, x, y, z, seg = 7) => mesh(new THREE.ConeGeometry(r, h, seg), mat(color), x, y, z);
export const ico = (r, color, x, y, z, detail = 0) => mesh(new THREE.IcosahedronGeometry(r, detail), mat(color), x, y, z);
export const sph = (r, color, x, y, z, sx = 1, sy = 1, sz = 1) => {
  const m = mesh(new THREE.SphereGeometry(r, 12, 9), mat(color), x, y, z);
  m.scale.set(sx, sy, sz);
  return m;
};

export function group(...children) {
  const g = new THREE.Group();
  for (const c of children) if (c) g.add(c);
  return g;
}

// Gabungkan semua mesh statis di dalam root menjadi satu mesh per "batch".
// Mesh bertekstur atau transparan dibiarkan apa adanya.
// userData.batch = 'foliage' dll. memisahkan batch agar warnanya bisa diwarnai ulang.
export function bake(root, { batchMaterials = {} } = {}) {
  root.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
  const buckets = new Map();
  const toRemove = [];
  root.traverse((o) => {
    if (!o.isMesh || o.isInstancedMesh) return;
    const m = o.material;
    if (Array.isArray(m) || m.map || m.transparent) return;
    const batch = findBatch(o, root);
    const shadow = o.castShadow ? 'cast' : 'nocast';
    const key = `${batch}|${shadow}`;
    let g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
    for (const name of Object.keys(g.attributes)) if (name !== 'position' && name !== 'normal') g.deleteAttribute(name);
    g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld));
    const count = g.attributes.position.count;
    const colors = new Float32Array(count * 3);
    const c = m.color;
    const e = m.emissive ?? { r: 0, g: 0, b: 0 };
    for (let i = 0; i < count; i++) colors.set([c.r + e.r * 0.5, c.g + e.g * 0.5, c.b + e.b * 0.5], i * 3);
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    if (!buckets.has(key)) buckets.set(key, { batch, shadow, geos: [] });
    buckets.get(key).geos.push(g);
    toRemove.push(o);
  });
  for (const o of toRemove) o.parent.remove(o);
  const out = {};
  for (const { batch, shadow, geos } of buckets.values()) {
    const merged = mergeGeometries(geos, false);
    geos.forEach((g) => g.dispose());
    const material = batchMaterials[batch] ??
      new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.88, metalness: 0, flatShading: true });
    batchMaterials[batch] = material;
    const m = new THREE.Mesh(merged, material);
    m.castShadow = shadow === 'cast';
    m.receiveShadow = true;
    m.name = `baked:${batch}`;
    root.add(m);
    out[batch] = material;
  }
  return out;
}

function findBatch(o, root) {
  for (let p = o; p && p !== root.parent; p = p.parent) if (p.userData.batch) return p.userData.batch;
  return 'static';
}

export function canvasTexture(width, height, draw) {
  const c = document.createElement('canvas');
  c.width = width;
  c.height = height;
  draw(c.getContext('2d'), width, height);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

// Pembangkit acak deterministik supaya dunia sama tiap kali dimuat.
export function rng(seed = 1) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
