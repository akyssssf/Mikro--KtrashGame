// Pulau diorama melayang: rumput di atas, lapisan tanah terlihat di tepi.
import * as THREE from 'three';
import { mesh, toon } from './builders.js';

export const SOIL_OK = [0x7b5536, 0x654329, 0x4e331f];
export const SOIL_BAD = [0x8b8680, 0x77736d, 0x5f5c58];
export const GRASS_OK = 0x9fd653;
export const GRASS_BAD = 0xb3ab7c;

export function roundedRectShape(hw, hd, r) {
  const s = new THREE.Shape();
  r = Math.min(r, hw, hd);
  s.moveTo(-hw + r, -hd);
  s.lineTo(hw - r, -hd);
  s.quadraticCurveTo(hw, -hd, hw, -hd + r);
  s.lineTo(hw, hd - r);
  s.quadraticCurveTo(hw, hd, hw - r, hd);
  s.lineTo(-hw + r, hd);
  s.quadraticCurveTo(-hw, hd, -hw, hd - r);
  s.lineTo(-hw, -hd + r);
  s.quadraticCurveTo(-hw, -hd, -hw + r, -hd);
  return s;
}

// Bentuk datar di permukaan tanah (jalan, lapangan). Dibuat dari Shape di bidang XZ.
export function flatShape(shape, color, y = 0.02) {
  const g = new THREE.ShapeGeometry(shape, 6);
  g.rotateX(-Math.PI / 2);
  const m = mesh(g, toon({ color }), 0, y, 0);
  m.castShadow = false;
  return m;
}

export function flatCircle(x, z, r, color, y = 0.02, seg = 20) {
  const g = new THREE.CircleGeometry(r, seg);
  g.rotateX(-Math.PI / 2);
  const m = mesh(g, toon({ color }), x, y, z);
  m.castShadow = false;
  return m;
}

// Jalan setapak dari titik ke titik (pita datar).
export function flatPath(points, width, color, y = 0.025) {
  const curve = new THREE.CatmullRomCurve3(points.map(([x, z]) => new THREE.Vector3(x, 0, z)));
  return ribbon(curve, width, color, y, Math.max(8, points.length * 10));
}

export function ribbon(curve, width, color, y, segments = 60) {
  const pos = [];
  const idx = [];
  const tangent = new THREE.Vector3();
  for (let i = 0; i <= segments; i++) {
    const u = i / segments;
    const p = curve.getPointAt(u);
    curve.getTangentAt(u, tangent);
    const nx = -tangent.z;
    const nz = tangent.x;
    const len = Math.hypot(nx, nz) || 1;
    const w = typeof width === 'function' ? width(u) : width;
    pos.push(p.x + (nx / len) * w / 2, y, p.z + (nz / len) * w / 2, p.x - (nx / len) * w / 2, y, p.z - (nz / len) * w / 2);
    if (i < segments) {
      const a = i * 2;
      idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  // Pastikan normal menghadap ke atas apa pun arah lilitannya.
  const n = g.attributes.normal;
  for (let i = 0; i < n.count; i++) n.setXYZ(i, 0, 1, 0);
  const m = mesh(g, toon({ color, side: THREE.DoubleSide }), 0, 0, 0);
  m.castShadow = false;
  return m;
}

export function buildIsland({ hw, hd, radius = 6 }) {
  const group = new THREE.Group();
  const grassMat = toon({ color: GRASS_OK });
  const soilMats = SOIL_OK.map((c) => toon({ color: c }));

  const layer = (inset, depth, top, material, receive = true) => {
    const g = new THREE.ExtrudeGeometry(roundedRectShape(hw - inset, hd - inset, Math.max(1, radius - inset)), {
      depth, bevelEnabled: false, curveSegments: 6,
    });
    g.rotateX(-Math.PI / 2);
    const m = mesh(g, material, 0, top - depth, 0);
    m.castShadow = false;
    m.receiveShadow = receive;
    group.add(m);
    return m;
  };
  const top = layer(0, 0.35, 0, grassMat);
  top.name = 'ground';
  layer(0.12, 1.3, -0.35, soilMats[0], false);
  layer(0.6, 1.4, -1.65, soilMats[1], false);
  layer(1.6, 1.6, -3.05, soilMats[2], false);
  // Batu dasar pulau melayang.
  const rock = new THREE.ConeGeometry(Math.min(hw, hd) * 0.8, 5, 7, 1);
  rock.scale(hw / Math.min(hw, hd), 1, hd / Math.min(hw, hd));
  rock.rotateX(Math.PI);
  const r = mesh(rock, soilMats[2], 0, -7.1, 0);
  r.castShadow = false;
  group.add(r);

  return { group, grassMat, soilMats, ground: top };
}
