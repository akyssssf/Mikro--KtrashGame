// Properti low-poly untuk dunia (rumah, pohon, lapak, jembatan, dsb.).
import * as THREE from 'three';
import { box, canvasTexture, cone, cyl, group, ico, mat, mesh, place, toon } from './builders.js';

export function tree(scale = 1, variant = 0) {
  const g = new THREE.Group();
  g.add(cyl(0.18, 0.26, 1.6, 0x7a5230, 0, 0.8, 0, 7));
  const foliage = new THREE.Group();
  foliage.userData.batch = 'foliage';
  if (variant % 2 === 0) {
    foliage.add(ico(1.15, 0x58b04a, 0, 2.2, 0, 0), ico(0.85, 0x58b04a, 0.55, 2.8, 0.2, 0), ico(0.8, 0x58b04a, -0.5, 2.7, -0.2, 0));
  } else {
    foliage.add(cone(1.2, 1.9, 0x4f9e45, 0, 2.3, 0, 7), cone(0.9, 1.5, 0x4f9e45, 0, 3.2, 0, 7));
  }
  g.add(foliage);
  g.scale.setScalar(scale);
  return g;
}

export function bush(scale = 1) {
  const g = new THREE.Group();
  g.userData.batch = 'foliage';
  g.add(ico(0.55, 0x5aa648, 0, 0.35, 0), ico(0.4, 0x5aa648, 0.45, 0.3, 0.1), ico(0.38, 0x5aa648, -0.4, 0.28, -0.1));
  g.scale.setScalar(scale);
  return g;
}

export function rock(scale = 1, color = 0x9aa0a6) {
  const m = ico(0.6, color, 0, 0.3, 0, 0);
  m.scale.set(scale * 1.2, scale * 0.8, scale);
  return m;
}

export function house({ wall = 0xf6e7c8, roof = 0xd9623b, door = 0x7a4b2a, w = 4, d = 3.4, h = 2.4 } = {}) {
  const g = new THREE.Group();
  g.add(box(w, 0.25, d, 0xbfae8e, 0, 0.12, 0));
  g.add(box(w - 0.2, h, d - 0.2, wall, 0, 0.25 + h / 2, 0));
  const roofGeo = new THREE.CylinderGeometry(0.01, 1, 1, 4, 1);
  roofGeo.rotateY(Math.PI / 4);
  const r = mesh(roofGeo, mat(roof), 0, 0.25 + h + 0.8, 0);
  r.scale.set(w * 0.78, 1.6, d * 0.78);
  g.add(r);
  g.add(box(0.8, 1.35, 0.08, door, 0, 0.25 + 0.68, d / 2 - 0.06));
  for (const x of [-w / 2 + 0.85, w / 2 - 0.85]) {
    g.add(box(0.7, 0.6, 0.08, 0x9fd4f0, x, 1.55, d / 2 - 0.06));
    g.add(box(0.86, 0.1, 0.12, 0xffffff, x, 1.2, d / 2 - 0.04));
  }
  g.add(box(0.4, 0.8, 0.4, 0x9c6b4a, w / 4, 0.25 + h + 1.1, -d / 6));
  return g;
}

export function well() {
  const g = new THREE.Group();
  g.add(cyl(0.95, 1.05, 0.9, 0x9ca3af, 0, 0.45, 0, 12));
  g.add(cyl(0.72, 0.72, 0.1, 0x3b82c4, 0, 0.82, 0, 12));
  g.add(box(0.14, 1.7, 0.14, 0x7a5230, -0.85, 1.35, 0), box(0.14, 1.7, 0.14, 0x7a5230, 0.85, 1.35, 0));
  const roofGeo = new THREE.CylinderGeometry(0.01, 1.3, 0.8, 4, 1);
  roofGeo.rotateY(Math.PI / 4);
  const roof = mesh(roofGeo, mat(0xc2410c), 0, 2.55, 0);
  roof.scale.set(1.1, 1, 0.8);
  g.add(roof);
  const bar = cyl(0.06, 0.06, 1.7, 0x5b3b1f, 0, 1.9, 0, 6);
  bar.rotation.z = Math.PI / 2;
  g.add(bar);
  g.add(cyl(0.2, 0.16, 0.28, 0x8b5a2b, 0.2, 1.45, 0, 8));
  return g;
}

export function fence(length, color = 0xc79a63) {
  const g = new THREE.Group();
  const posts = Math.max(2, Math.round(length / 1.2) + 1);
  for (let i = 0; i < posts; i++) {
    const x = -length / 2 + (length * i) / (posts - 1);
    g.add(box(0.16, 0.9, 0.16, color, x, 0.45, 0));
  }
  g.add(box(length, 0.1, 0.07, color, 0, 0.62, 0), box(length, 0.1, 0.07, color, 0, 0.32, 0));
  return g;
}

export function lamp() {
  return group(
    cyl(0.07, 0.09, 2.4, 0x374151, 0, 1.2, 0, 6),
    box(0.4, 0.35, 0.4, 0xfde68a, 0, 2.5, 0),
    box(0.5, 0.08, 0.5, 0x374151, 0, 2.72, 0),
  );
}

export function bench() {
  return group(
    box(1.6, 0.1, 0.5, 0xb7793f, 0, 0.5, 0),
    box(1.6, 0.4, 0.08, 0xb7793f, 0, 0.8, -0.22),
    box(0.1, 0.5, 0.45, 0x5b3b1f, -0.65, 0.25, 0),
    box(0.1, 0.5, 0.45, 0x5b3b1f, 0.65, 0.25, 0),
  );
}

export function flowerPot(color = 0xf472b6) {
  return group(cyl(0.25, 0.2, 0.35, 0xc2410c, 0, 0.18, 0, 8), ico(0.25, 0x4f9e45, 0, 0.45, 0), ico(0.1, color, 0.08, 0.62, 0.05));
}

// Papan petunjuk dengan tulisan. Papan bertekstur (tidak di-bake).
export function signpost(text, { color = '#fff8e7', ink = '#17324d', arrow = 0, width = 2.4, locked = false } = {}) {
  const g = new THREE.Group();
  g.add(box(0.14, 1.9, 0.14, 0x7a5230, 0, 0.95, 0));
  const tex = canvasTexture(512, 144, (ctx, w, h) => {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, w, h);
    ctx.lineWidth = 12;
    ctx.strokeStyle = ink;
    ctx.strokeRect(6, 6, w - 12, h - 12);
    ctx.fillStyle = ink;
    ctx.font = '800 58px "Baloo 2", ui-rounded, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const label = arrow < 0 ? `◀ ${text}` : arrow > 0 ? `${text} ▶` : text;
    ctx.fillText(label, w / 2, h / 2 + 4, w - 40);
    if (locked) {
      ctx.fillStyle = 'rgba(23,50,77,.35)';
      ctx.fillRect(0, 0, w, h);
    }
  });
  const bh = width * 0.28;
  g.add(box(width, bh, 0.1, 0xb7793f, 0, 1.6, 0));
  const face = new THREE.Mesh(new THREE.PlaneGeometry(width - 0.08, bh - 0.08), toon({ map: tex, roughness: 0.9 }));
  face.position.set(0, 1.6, 0.056);
  g.add(face);
  return g;
}

// Lapak pasar dengan atap belang.
export function stall({ awning = '#ef4444', counter = 0xb7793f, w = 3.2, d = 2 } = {}) {
  const g = new THREE.Group();
  g.add(box(w, 0.9, 0.6, counter, 0, 0.45, d / 2 - 0.3));
  g.add(box(w, 0.08, 0.7, 0xe7c690, 0, 0.93, d / 2 - 0.3));
  for (const [x, z] of [[-w / 2 + 0.1, -d / 2 + 0.1], [w / 2 - 0.1, -d / 2 + 0.1], [-w / 2 + 0.1, d / 2 - 0.1], [w / 2 - 0.1, d / 2 - 0.1]]) {
    g.add(box(0.12, 2.3, 0.12, 0x6b4a2b, x, 1.15, z));
  }
  const tex = canvasTexture(256, 64, (ctx, cw, ch) => {
    const stripes = 8;
    for (let i = 0; i < stripes; i++) {
      ctx.fillStyle = i % 2 ? '#fff8e7' : awning;
      ctx.fillRect((cw / stripes) * i, 0, cw / stripes + 1, ch);
    }
  });
  const roof = new THREE.Mesh(new THREE.BoxGeometry(w + 0.4, 0.12, d + 0.5), toon({ map: tex, roughness: 0.9 }));
  roof.position.set(0, 2.4, 0.1);
  roof.rotation.x = -0.18;
  roof.castShadow = true;
  g.add(roof);
  g.add(box(w - 0.3, 0.12, d - 0.6, 0xa0703f, 0, 0.12, -0.2));
  return g;
}

export function crate(color = 0xb7793f) {
  return group(box(0.7, 0.5, 0.5, color, 0, 0.25, 0), box(0.72, 0.06, 0.52, 0x8b5a2b, 0, 0.5, 0));
}

export function produce(color, n = 5) {
  const g = new THREE.Group();
  for (let i = 0; i < n; i++) g.add(ico(0.12, color, -0.25 + (i % 3) * 0.25, 0.55 + Math.floor(i / 3) * 0.12, (i % 2) * 0.12 - 0.06));
  return g;
}

export function bridge(length, width = 2.2) {
  const g = new THREE.Group();
  const planks = Math.round(length / 0.45);
  for (let i = 0; i < planks; i++) {
    const z = -length / 2 + (i + 0.5) * (length / planks);
    g.add(box(width, 0.12, length / planks - 0.05, i % 2 ? 0xb7793f : 0xa86d36, 0, 0.32, z));
  }
  for (const x of [-width / 2, width / 2]) {
    g.add(box(0.12, 0.08, length, 0x7a5230, x, 0.95, 0));
    for (let i = 0; i <= 4; i++) g.add(box(0.12, 0.7, 0.12, 0x7a5230, x, 0.6, -length / 2 + (length * i) / 4));
  }
  return g;
}

// Lengkung batu Gerbang Waktu. Portal bercahaya dikembalikan terpisah agar bisa dianimasikan.
export function stoneArch() {
  const g = new THREE.Group();
  const stone = [0x9ca3af, 0x8b929a, 0xa8aeb5];
  for (const side of [-1, 1]) {
    for (let i = 0; i < 5; i++) g.add(box(0.9, 0.7, 0.9, stone[i % 3], side * 1.9, 0.35 + i * 0.7, 0));
  }
  const arc = new THREE.TorusGeometry(1.9, 0.45, 5, 12, Math.PI);
  const a = mesh(arc, mat(0x9ca3af), 0, 3.5, 0);
  g.add(a);
  g.add(box(5.4, 0.3, 1.6, 0x7c838b, 0, 0.15, 0));
  const portalMat = new THREE.MeshBasicMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false });
  const portalGeo = new THREE.CircleGeometry(1.5, 32, 0, Math.PI);
  const portal = new THREE.Mesh(portalGeo, portalMat);
  portal.position.y = 3.5;
  const lower = new THREE.Mesh(new THREE.PlaneGeometry(3, 3.2), portalMat);
  lower.position.y = 1.9;
  const glow = new THREE.Group();
  glow.add(portal, lower);
  g.add(glow);
  return { group: g, glow, portalMat };
}

export function recyclingCenter() {
  const g = new THREE.Group();
  g.add(box(6, 0.25, 4.6, 0xbfae8e, 0, 0.12, 0));
  g.add(box(5.6, 2.8, 3.6, 0xdff3e4, 0, 1.65, -0.3));
  g.add(box(6.2, 0.35, 4.3, 0x2f855a, 0, 3.2, -0.2));
  g.add(box(2.2, 2, 0.1, 0x3f6b52, 0, 1.25, 1.52));
  g.add(box(2, 1.8, 0.05, 0x1f2937, 0, 1.15, 1.56));
  // Mesin di samping.
  g.add(box(1.4, 1.6, 1.4, 0x60a5fa, 3.6, 0.95, 0.4));
  g.add(cyl(0.3, 0.3, 1, 0x94a3b8, 3.6, 2.2, 0.4, 8));
  g.add(box(0.9, 0.2, 0.5, 0xfbbf24, 3.6, 1.2, 1.15));
  return g;
}

export function villager({ shirt = 0xf59e0b, skin = 0xe0a97a, hair = 0x3b2a1a, pants = 0x334155 } = {}) {
  const g = new THREE.Group();
  g.add(cyl(0.12, 0.12, 0.7, pants, -0.14, 0.35, 0, 6), cyl(0.12, 0.12, 0.7, pants, 0.14, 0.35, 0, 6));
  g.add(cyl(0.34, 0.4, 0.85, shirt, 0, 1.1, 0, 8));
  g.add(ico(0.32, skin, 0, 1.8, 0, 1));
  g.add(ico(0.3, hair, 0, 1.95, -0.06, 0));
  g.add(box(0.07, 0.07, 0.03, 0x17324d, -0.1, 1.83, 0.3), box(0.07, 0.07, 0.03, 0x17324d, 0.1, 1.83, 0.3));
  return g;
}

export { place };
