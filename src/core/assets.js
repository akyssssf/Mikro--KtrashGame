// Pemuat aset GLB dari folder /assets. Semua dimuat sekali saat layar "memuat",
// lalu dikloning sesuai kebutuhan. Bila aset tidak ada, kode memakai model prosedural.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { toon } from '../world/builders.js';

// Lembar gaya (referensi besar) tidak dimuat ke game.
const files = import.meta.glob(['/assets/*.glb', '!/assets/styleSheet_*.glb'], { query: '?url', import: 'default', eager: true });

const templates = new Map();
const materialCache = new Map();

// Pivot sendi: kaki/lengan diputar dari atas, kepala dari bawah.
const JOINTS = {
  leg_L: 'top', leg_R: 'top', arm_L: 'top', arm_R: 'top', head: 'bottom',
  head_happy: 'bottom', head_neutral: 'bottom', head_tired: 'bottom',
};

function toonFrom(m) {
  if (materialCache.has(m)) return materialCache.get(m);
  const t = toon({
    color: m.color,
    map: m.map ?? null,
    vertexColors: true,
    transparent: m.transparent,
    opacity: m.opacity,
    side: m.side,
    alphaTest: m.alphaTest,
  });
  t.name = m.name;
  materialCache.set(m, t);
  return t;
}

// Pindahkan pivot node bagian tubuh ke sendinya (aset dari Claude Design pivotnya di lantai).
function fixJoints(root) {
  root.updateMatrixWorld(true);
  for (const [name, where] of Object.entries(JOINTS)) {
    const node = root.getObjectByName(name);
    if (!node || node.userData.pivoted) continue;
    const box = new THREE.Box3().setFromObject(node);
    if (box.isEmpty()) continue;
    const pivotWorld = new THREE.Vector3((box.min.x + box.max.x) / 2, where === 'top' ? box.max.y : box.min.y, (box.min.z + box.max.z) / 2);
    const pivotLocal = node.parent.worldToLocal(pivotWorld.clone());
    const delta = pivotLocal.clone().sub(node.position);
    node.position.copy(pivotLocal);
    for (const c of node.children) c.position.sub(delta);
    node.userData.pivoted = true;
  }
}

export async function loadAssets(onProgress) {
  const loader = new GLTFLoader();
  const entries = Object.entries(files);
  let done = 0;
  await Promise.all(entries.map(async ([path, url]) => {
    const key = path.match(/\/([\w-]+)\.glb$/)[1];
    try {
      const gltf = await loader.loadAsync(url);
      const scene = gltf.scene;
      scene.traverse((o) => {
        if (!o.isMesh) return;
        o.material = toonFrom(o.material);
        o.castShadow = true;
        o.receiveShadow = true;
      });
      fixJoints(scene);
      templates.set(key, scene);
    } catch (err) {
      console.warn(`Aset gagal dimuat: ${key}`, err);
    }
    done += 1;
    onProgress?.(done / entries.length);
  }));
  return templates.size;
}

export const hasAsset = (key) => templates.has(key);

// Klon aset. uniqueMaterials: material disalin agar warnanya bisa diubah per objek.
export function cloneAsset(key, { uniqueMaterials = false, shadow = true } = {}) {
  const src = templates.get(key);
  if (!src) return null;
  const obj = src.clone(true);
  obj.traverse((o) => {
    if (!o.isMesh) return;
    if (uniqueMaterials) o.material = o.material.clone();
    o.castShadow = shadow;
  });
  return obj;
}

// Klon lalu skalakan agar tingginya = height meter (pivot tetap di bawah).
export function assetWithHeight(key, height, opts) {
  const obj = cloneAsset(key, opts);
  if (!obj) return null;
  const size = new THREE.Box3().setFromObject(obj).getSize(new THREE.Vector3());
  obj.scale.setScalar(height / Math.max(size.y, 1e-3));
  return obj;
}

// Variasi warna: geser hue warna vertex yang jenuh (putih/hitam/abu dibiarkan, mis. mata).
export function shiftHue(obj, shift) {
  const c = new THREE.Color();
  const hsl = {};
  obj.traverse((o) => {
    if (!o.isMesh || !o.geometry.attributes.color) return;
    o.geometry = o.geometry.clone();
    const col = o.geometry.attributes.color;
    for (let i = 0; i < col.count; i++) {
      c.setRGB(col.getX(i), col.getY(i), col.getZ(i));
      c.getHSL(hsl);
      if (hsl.s < 0.3 || hsl.l < 0.08 || hsl.l > 0.92) continue;
      c.setHSL((hsl.h + shift + 1) % 1, hsl.s, hsl.l);
      col.setXYZ(i, c.r, c.g, c.b);
    }
    col.needsUpdate = true;
  });
  return obj;
}
