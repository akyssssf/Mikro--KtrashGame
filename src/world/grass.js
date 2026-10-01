// Rumput stylized: karpet bilah tipis yang padat (InstancedMesh, 1 draw call).
// Warna = gradasi pangkal (sama dengan tanah) → ujung terang, plus petak warna per rumpun.
// Normal selalu menghadap ke atas (bukan per bilah) supaya bilah tidak gelap di sisi belakang
// dan padang terlihat lembut seperti lukisan. Angin, kilau ujung, dan sibakan pemain di shader.
import * as THREE from 'three';

const BLADES_PER_CLUMP = 6;
const SPACING = 0.32;

function clumpGeometry(rand) {
  const pos = [];
  const tAttr = [];
  const idx = [];
  for (let b = 0; b < BLADES_PER_CLUMP; b++) {
    const a = rand() * Math.PI * 2;
    const r = Math.sqrt(rand()) * 0.17;
    const ox = Math.cos(a) * r;
    const oz = Math.sin(a) * r;
    const yaw = rand() * Math.PI * 2;
    const lean = 0.12 + rand() * 0.28;
    const width = 0.035 + rand() * 0.02;
    const height = 0.6 + rand() * 0.45;
    const c = Math.cos(yaw);
    const s = Math.sin(yaw);
    const base = pos.length / 3;
    const point = (side, t) => {
      const lx = width * (1 - t * 0.85) * side;
      const lz = lean * t * t;
      pos.push(ox + lx * c - lz * s, t * height, oz + lx * s + lz * c);
      tAttr.push(t);
    };
    for (const t of [0, 0.5]) { point(-1, t); point(1, t); }
    point(0, 1);
    idx.push(base, base + 1, base + 2, base + 1, base + 3, base + 2, base + 2, base + 3, base + 4);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(pos.map((_, i) => (i % 3 === 1 ? 1 : 0)), 3));
  g.setAttribute('aT', new THREE.Float32BufferAttribute(tAttr, 1));
  g.setIndex(idx);
  return g;
}

// Derau halus murah untuk petak warna.
const patch = (x, z) => 0.5 + 0.25 * Math.sin(x * 0.21 + Math.cos(z * 0.13) * 2) + 0.25 * Math.sin(z * 0.17 - x * 0.07 + Math.sin(x * 0.05) * 3);

export function createGrass({ hw, hd, exclude, rand }) {
  const geo = clumpGeometry(rand);
  const material = new THREE.MeshLambertMaterial({ side: THREE.DoubleSide });
  const uniforms = {
    uTime: { value: 0 },
    uPlayer: { value: new THREE.Vector3(999, 0, 999) },
    uWind: { value: 1 },
    uBase: { value: new THREE.Color() },
    uTip: { value: new THREE.Color() },
  };
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>
        uniform float uTime;
        uniform vec3 uPlayer;
        uniform float uWind;
        attribute float aT;
        attribute vec3 aVar;
        varying float vT;
        varying float vGust;
        varying vec3 vVar;`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vec3 ip = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
        float bend = aT * aT;
        // Gelombang angin besar yang bergerak melintasi padang + getar kecil.
        float gust = sin(uTime * 1.3 - ip.x * 0.18 - ip.z * 0.11) * 0.5 + 0.5;
        float w = (gust * 0.8 + sin(uTime * 3.1 + ip.x * 1.7 + ip.z * 1.3) * 0.2) * uWind;
        transformed.x += w * 0.28 * bend;
        transformed.z += w * 0.12 * bend;
        transformed.y -= w * 0.06 * bend;
        vec2 away = ip.xz - uPlayer.xz;
        float dist = length(away);
        float push = (1.0 - smoothstep(0.25, 1.2, dist)) * bend;
        transformed.xz += (away / max(dist, 0.001)) * push * 0.55;
        transformed.y -= push * 0.35;
        vT = aT;
        vGust = gust * uWind;
        vVar = aVar;`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
        uniform vec3 uBase;
        uniform vec3 uTip;
        varying float vT;
        varying float vGust;
        varying vec3 vVar;`)
      .replace('#include <color_fragment>', `
        vec3 grassCol = mix(uBase, uTip, pow(vT, 1.15)) * vVar;
        grassCol += vec3(0.07, 0.08, 0.03) * vGust * vT * vT;
        diffuseColor.rgb = grassCol;`)
      // Normal ke atas untuk kedua sisi bilah (tanpa dibalik faceDirection).
      .replace('#include <normal_fragment_begin>', `
        float faceDirection = 1.0;
        vec3 normal = normalize( vNormal );
        vec3 nonPerturbedNormal = normal;`);
  };
  material.customProgramCacheKey = () => 'stylized-grass-v2';

  const spots = [];
  for (let x = -hw + 0.5; x < hw - 0.5; x += SPACING) {
    for (let z = -hd + 0.5; z < hd - 0.5; z += SPACING) {
      const px = x + (rand() - 0.5) * SPACING;
      const pz = z + (rand() - 0.5) * SPACING;
      if (!exclude(px, pz)) spots.push([px, pz]);
    }
  }
  const mesh = new THREE.InstancedMesh(geo, material, spots.length);
  const variation = new Float32Array(spots.length * 3);
  const m = new THREE.Matrix4();
  const c = new THREE.Color();
  const warm = new THREE.Color(1.1, 1.05, 0.8);
  const cool = new THREE.Color(0.85, 1.0, 1.02);
  spots.forEach(([x, z], i) => {
    const n = patch(x, z);
    const s = 0.42 + n * 0.22 + rand() * 0.1;
    m.makeScale(1, s, 1).setPosition(x, 0, z);
    mesh.setMatrixAt(i, m);
    // Petak hangat (kekuningan) dan sejuk (kebiruan) supaya terlihat dilukis.
    c.setRGB(1, 1, 1).lerp(n > 0.5 ? warm : cool, Math.abs(n - 0.5) * 1.6).multiplyScalar(0.95 + rand() * 0.1);
    variation.set([c.r, c.g, c.b], i * 3);
  });
  geo.setAttribute('aVar', new THREE.InstancedBufferAttribute(variation, 3));
  mesh.receiveShadow = true;
  mesh.frustumCulled = false;

  return {
    mesh,
    // Warna pangkal (= tanah) dan ujung; diubah halus mengikuti kesehatan tanah.
    setColors(base, tip) {
      uniforms.uBase.value.copy(base);
      uniforms.uTip.value.copy(tip);
    },
    update(time, player, reducedMotion) {
      uniforms.uTime.value = time;
      uniforms.uWind.value = reducedMotion ? 0.25 : 1;
      if (player) uniforms.uPlayer.value.copy(player);
    },
  };
}
