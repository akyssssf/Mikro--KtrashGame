// Rumput stylized: rumpun bilah padat (InstancedMesh, 1 draw call) dengan gradasi akar→ujung,
// petak warna, goyang angin, dan tersibak saat pemain lewat. Semua gerak dihitung di shader.
import * as THREE from 'three';

const BLADES_PER_CLUMP = 5;
const SPACING = 0.42;

// Satu rumpun: beberapa bilah meruncing, tinggi ternormalisasi 0…1 (diskalakan per instance).
function clumpGeometry(rand) {
  const pos = [];
  const col = [];
  const idx = [];
  const rows = [0, 0.35, 0.7];
  for (let b = 0; b < BLADES_PER_CLUMP; b++) {
    const a = rand() * Math.PI * 2;
    const r = Math.sqrt(rand()) * 0.2;
    const ox = Math.cos(a) * r;
    const oz = Math.sin(a) * r;
    const yaw = rand() * Math.PI * 2;
    const lean = 0.15 + rand() * 0.25;
    const width = 0.05 + rand() * 0.03;
    const height = 0.75 + rand() * 0.35;
    const cx = Math.cos(yaw);
    const sz = Math.sin(yaw);
    const base = pos.length / 3;
    const point = (side, t) => {
      const w = width * (1 - t) * side;
      const forward = lean * t * t;
      // Bilah di bidang lokal, lalu diputar yaw.
      const lx = w;
      const lz = forward;
      pos.push(ox + lx * cx - lz * sz, t * height, oz + lx * sz + lz * cx);
      const shade = 0.6 + 0.55 * t;
      col.push(shade, shade, shade);
    };
    for (const t of rows) { point(-1, t); point(1, t); }
    point(0, 1);
    for (let i = 0; i < rows.length - 1; i++) {
      const v = base + i * 2;
      idx.push(v, v + 1, v + 2, v + 1, v + 3, v + 2);
    }
    const top = base + rows.length * 2;
    idx.push(top - 2, top - 1, top);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(new Array(pos.length).fill(0).map((_, i) => (i % 3 === 1 ? 1 : 0)), 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  return g;
}

// Derau halus murah untuk petak warna.
const patch = (x, z) => 0.5 + 0.25 * Math.sin(x * 0.21 + Math.cos(z * 0.13) * 2) + 0.25 * Math.sin(z * 0.17 - x * 0.07 + Math.sin(x * 0.05) * 3);

export function createGrass({ hw, hd, exclude, rand }) {
  const geo = clumpGeometry(rand);
  const material = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
  const uniforms = { uTime: { value: 0 }, uPlayer: { value: new THREE.Vector3(999, 0, 999) }, uWind: { value: 1 } };
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uTime;\nuniform vec3 uPlayer;\nuniform float uWind;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vec3 ip = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
        float bend = position.y * position.y;
        float w = sin(uTime * 1.6 + ip.x * 0.32 + ip.z * 0.21) * 0.6 + sin(uTime * 2.7 + ip.x * 0.9 - ip.z * 0.5) * 0.25;
        transformed.x += w * 0.22 * uWind * bend;
        transformed.z += w * 0.08 * uWind * bend;
        vec2 away = ip.xz - uPlayer.xz;
        float dist = length(away);
        float push = (1.0 - smoothstep(0.3, 1.3, dist)) * bend;
        transformed.xz += (away / max(dist, 0.001)) * push * 0.5;
        transformed.y -= push * 0.3;`);
  };
  material.customProgramCacheKey = () => 'stylized-grass';

  const spots = [];
  for (let x = -hw + 0.6; x < hw - 0.6; x += SPACING) {
    for (let z = -hd + 0.6; z < hd - 0.6; z += SPACING) {
      const px = x + (rand() - 0.5) * SPACING;
      const pz = z + (rand() - 0.5) * SPACING;
      if (!exclude(px, pz)) spots.push([px, pz]);
    }
  }
  const mesh = new THREE.InstancedMesh(geo, material, spots.length);
  const m = new THREE.Matrix4();
  const c = new THREE.Color();
  const yellow = new THREE.Color(1.08, 1.06, 0.78);
  const teal = new THREE.Color(0.78, 0.98, 1.0);
  spots.forEach(([x, z], i) => {
    const n = patch(x, z);
    const s = 0.26 + n * 0.2 + rand() * 0.08;
    m.makeScale(0.9 + rand() * 0.3, s, 0.9 + rand() * 0.3).setPosition(x, 0, z);
    mesh.setMatrixAt(i, m);
    // Petak kekuningan dan kebiruan supaya padang terlihat dilukis, bukan seragam.
    c.setRGB(1, 1, 1).lerp(n > 0.5 ? yellow : teal, Math.abs(n - 0.5) * 1.4).multiplyScalar(0.92 + rand() * 0.16);
    mesh.setColorAt(i, c);
  });
  mesh.receiveShadow = true;
  mesh.frustumCulled = false;

  return {
    mesh,
    material,
    update(time, player, reducedMotion) {
      uniforms.uTime.value = time;
      uniforms.uWind.value = reducedMotion ? 0.25 : 1;
      if (player) uniforms.uPlayer.value.copy(player);
    },
  };
}
