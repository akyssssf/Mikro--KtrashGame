// Rumput stylized: padang bilah tipis yang rimbun (InstancedMesh, 1 draw call).
// - Gradasi pangkal (menyatu dengan tanah, sedikit gelap/oklusi) → ujung terang; warna tiap bilah sedikit beda.
// - Tinggi per petak (ada area tinggi dan pendek), memendek halus di tepi jalan dan dekat sampah.
// - Normal menghadap ke atas untuk kedua sisi bilah → tidak ada sisi gelap, terasa lembut.
// - Shader: gelombang angin, kilau ujung, cahaya tembus saat menghadap matahari, bayangan awan bergerak,
//   dan rumput tersibak saat pemain lewat.
import * as THREE from 'three';

const BLADES_PER_CLUMP = 6;
const SPACING = 0.3;
const ROWS = [0, 0.4, 0.75];

function clumpGeometry(rand) {
  const pos = [];
  const tAttr = [];
  const rAttr = [];
  const idx = [];
  for (let b = 0; b < BLADES_PER_CLUMP; b++) {
    const a = rand() * Math.PI * 2;
    const r = Math.sqrt(rand()) * 0.17;
    const ox = Math.cos(a) * r;
    const oz = Math.sin(a) * r;
    const yaw = rand() * Math.PI * 2;
    const lean = 0.15 + rand() * 0.35;
    const width = 0.04 + rand() * 0.025;
    const height = 0.6 + rand() * 0.5;
    const blade = rand();
    const c = Math.cos(yaw);
    const s = Math.sin(yaw);
    const base = pos.length / 3;
    const point = (side, t) => {
      const lx = width * (1 - t) ** 0.8 * side;
      const lz = lean * t * t;
      pos.push(ox + lx * c - lz * s, t * height, oz + lx * s + lz * c);
      tAttr.push(t);
      rAttr.push(blade);
    };
    for (const t of ROWS) { point(-1, t); point(1, t); }
    point(0, 1);
    for (let i = 0; i < ROWS.length - 1; i++) {
      const v = base + i * 2;
      idx.push(v, v + 1, v + 2, v + 1, v + 3, v + 2);
    }
    const tip = base + ROWS.length * 2;
    idx.push(tip - 2, tip - 1, tip);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(pos.map((_, i) => (i % 3 === 1 ? 1 : 0)), 3));
  g.setAttribute('aT', new THREE.Float32BufferAttribute(tAttr, 1));
  g.setAttribute('aRand', new THREE.Float32BufferAttribute(rAttr, 1));
  g.setIndex(idx);
  return g;
}

// Derau halus murah (tanpa tekstur) untuk petak tinggi & warna.
const patch = (x, z) => 0.5 + 0.25 * Math.sin(x * 0.21 + Math.cos(z * 0.13) * 2) + 0.25 * Math.sin(z * 0.17 - x * 0.07 + Math.sin(x * 0.05) * 3);
const tallness = (x, z) => THREE.MathUtils.smoothstep(patch(x, z), 0.35, 0.8);

// Perkiraan tinggi ujung rumput di suatu titik (untuk menaruh bunga di atasnya).
export const grassHeightAt = (x, z) => 0.85 * (0.44 + tallness(x, z) * 0.5);

const VERTEX_HEAD = `
  uniform float uTime;
  uniform vec3 uPlayer;
  uniform float uWind;
  attribute float aT;
  attribute float aRand;
  attribute vec3 aVar;
  varying float vT;
  varying float vRand;
  varying float vGust;
  varying vec3 vVar;
  varying vec3 vWPos;`;

const VERTEX_BODY = `
  vec3 ip = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
  float bend = aT * aT;
  // Gelombang angin besar yang menyapu padang + getar kecil per bilah.
  float gust = sin(uTime * 1.25 - ip.x * 0.16 - ip.z * 0.1) * 0.5 + 0.5;
  float w = (gust * 0.85 + sin(uTime * 3.3 + ip.x * 1.7 + ip.z * 1.3 + aRand * 6.0) * 0.18) * uWind;
  transformed.x += w * 0.3 * bend;
  transformed.z += w * 0.14 * bend;
  transformed.y -= w * 0.07 * bend;
  vec2 away = ip.xz - uPlayer.xz;
  float dist = length(away);
  float push = (1.0 - smoothstep(0.25, 1.3, dist)) * bend;
  transformed.xz += (away / max(dist, 0.001)) * push * 0.6;
  transformed.y -= push * 0.4;
  vT = aT;
  vRand = aRand;
  vGust = gust * uWind;
  vVar = aVar;
  vWPos = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;`;

const FRAGMENT_HEAD = `
  uniform vec3 uBase;
  uniform vec3 uTip;
  uniform vec3 uTipWarm;
  uniform vec3 uSunDir;
  uniform float uTime;
  varying float vT;
  varying float vRand;
  varying float vGust;
  varying vec3 vVar;
  varying vec3 vWPos;`;

const FRAGMENT_COLOR = `
  vec3 tipCol = mix(uTip, uTipWarm, smoothstep(0.55, 1.0, vRand));
  vec3 grassCol = mix(uBase, tipCol, pow(vT, 1.1)) * vVar;
  // Oklusi lembut di pangkal.
  grassCol *= mix(0.78, 1.0, smoothstep(0.0, 0.45, vT));
  // Kilau ujung saat tertiup angin.
  grassCol += vec3(0.08, 0.09, 0.03) * vGust * vT * vT;
  // Cahaya tembus: ujung bilah berpendar hangat saat kamera menghadap matahari.
  vec3 viewDir = normalize(vWPos - cameraPosition);
  float back = pow(max(dot(viewDir, uSunDir), 0.0), 3.0);
  grassCol += vec3(0.22, 0.2, 0.05) * back * vT * vT;
  // Bayangan awan besar yang bergerak pelan (petak sejuk kebiruan).
  float cloud = 0.5 + 0.5 * sin(vWPos.x * 0.06 + uTime * 0.12 + sin(vWPos.z * 0.045 - uTime * 0.07) * 2.2) * sin(vWPos.z * 0.05 - uTime * 0.09 + sin(vWPos.x * 0.03) * 1.7);
  grassCol *= mix(vec3(1.0), vec3(0.8, 0.9, 0.98), smoothstep(0.62, 0.9, cloud));
  diffuseColor.rgb = grassCol;`;

export function createGrass({ hw, hd, exclude, rand, clearSpots = [] }) {
  const geo = clumpGeometry(rand);
  const material = new THREE.MeshLambertMaterial({ side: THREE.DoubleSide });
  const uniforms = {
    uTime: { value: 0 },
    uPlayer: { value: new THREE.Vector3(999, 0, 999) },
    uWind: { value: 1 },
    uBase: { value: new THREE.Color() },
    uTip: { value: new THREE.Color() },
    uTipWarm: { value: new THREE.Color() },
    uSunDir: { value: new THREE.Vector3(14, 30, 12).normalize() },
  };
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\n${VERTEX_HEAD}`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>\n${VERTEX_BODY}`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n${FRAGMENT_HEAD}`)
      .replace('#include <color_fragment>', FRAGMENT_COLOR)
      // Normal ke atas untuk kedua sisi bilah (tanpa dibalik faceDirection).
      .replace('#include <normal_fragment_begin>', `
        float faceDirection = 1.0;
        vec3 normal = normalize( vNormal );
        vec3 nonPerturbedNormal = normal;`);
  };
  material.customProgramCacheKey = () => 'stylized-grass-v3';

  // Seberapa dekat ke area tanpa rumput (jalan, bangunan) atau sampah → rumput memendek.
  const edgeFactor = (x, z) => {
    let k = 1;
    for (const [dx, dz] of [[0.7, 0], [-0.7, 0], [0, 0.7], [0, -0.7]]) if (exclude(x + dx, z + dz)) k = Math.min(k, 0.55);
    for (const [sx, sz] of clearSpots) {
      const d = Math.hypot(x - sx, z - sz);
      if (d < 1.4) k = Math.min(k, 0.3 + 0.7 * (d / 1.4) ** 2);
    }
    return k;
  };

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
  const cool = new THREE.Color(0.82, 0.97, 1.03);
  spots.forEach(([x, z], i) => {
    const n = patch(x, z);
    const s = (0.38 + tallness(x, z) * 0.5 + rand() * 0.12) * edgeFactor(x, z);
    const spread = 0.9 + rand() * 0.25;
    m.makeScale(spread, s, spread).setPosition(x, 0, z);
    mesh.setMatrixAt(i, m);
    // Petak hangat (kekuningan) dan sejuk (kebiruan) supaya terlihat dilukis.
    c.setRGB(1, 1, 1).lerp(n > 0.5 ? warm : cool, Math.abs(n - 0.5) * 1.7).multiplyScalar(0.94 + rand() * 0.12);
    variation.set([c.r, c.g, c.b], i * 3);
  });
  geo.setAttribute('aVar', new THREE.InstancedBufferAttribute(variation, 3));
  mesh.receiveShadow = true;
  mesh.frustumCulled = false;

  return {
    mesh,
    // Warna pangkal (= tanah) dan ujung; diubah halus mengikuti kesehatan tanah.
    setColors(base, tip, tipWarm) {
      uniforms.uBase.value.copy(base);
      uniforms.uTip.value.copy(tip);
      uniforms.uTipWarm.value.copy(tipWarm);
    },
    update(time, player, reducedMotion) {
      uniforms.uTime.value = time;
      uniforms.uWind.value = reducedMotion ? 0.25 : 1;
      if (player) uniforms.uPlayer.value.copy(player);
    },
  };
}
