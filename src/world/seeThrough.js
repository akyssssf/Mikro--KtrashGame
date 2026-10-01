// Tembus pandang: bagian objek besar (rumah, pohon) yang berada di antara kamera dan pemain
// "dilubangi" melingkar dengan pola halftone, jadi pemain selalu terlihat tanpa kamera maju.
// Bekerja di shader (gl_FragCoord), sehingga tetap jalan untuk mesh yang sudah digabung (bake).
import * as THREE from 'three';

export const seeThroughUniforms = {
  stCenter: { value: new THREE.Vector2(-9, -9) }, // posisi pemain di layar (0–1)
  stRes: { value: new THREE.Vector2(1, 1) },      // ukuran drawing buffer (piksel)
  stDepth: { value: 0 },                          // jarak pandang pemain; yang lebih dekat boleh dilubangi
  stRadius: { value: 0 },                         // jari-jari lubang (satuan tinggi layar); 0 = mati
};

export function enableSeeThrough(material) {
  if (!material || material.userData.seeThrough) return;
  material.userData.seeThrough = true;
  const prevCompile = material.onBeforeCompile;
  const prevKey = material.customProgramCacheKey?.bind(material);
  material.onBeforeCompile = (shader, renderer) => {
    prevCompile?.call(material, shader, renderer);
    Object.assign(shader.uniforms, seeThroughUniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying float vStViewZ;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvStViewZ = -mvPosition.z;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
varying float vStViewZ;
uniform vec2 stCenter; uniform vec2 stRes; uniform float stDepth; uniform float stRadius;`)
      .replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
if (stRadius > 0.0 && vStViewZ < stDepth) {
  vec2 d = gl_FragCoord.xy / stRes - stCenter;
  d.x *= stRes.x / stRes.y;
  // 1 di tengah lubang, memudar ke 0 di tepinya; makin dekat ke kamera makin bolong.
  float k = smoothstep(stRadius, stRadius * 0.45, length(d));
  k *= smoothstep(0.0, 1.2, stDepth - vStViewZ);
  // Halftone: titik bolong di tengah tiap sel, membesar mengikuti k.
  float cell = 7.0 * max(1.0, stRes.y / 900.0);
  vec2 c = mod(gl_FragCoord.xy, cell) - cell * 0.5;
  if (length(c) / (cell * 0.7071) < k * 1.08) discard;
}`);
  };
  material.customProgramCacheKey = () => `${prevKey ? prevKey() : ''}|seeThrough`;
  material.needsUpdate = true;
}

const tmp = new THREE.Vector3();

// Dipanggil tiap frame: posisi pemain di layar + ukuran lubang dari jaraknya ke kamera.
export function updateSeeThrough(camera, renderer, target, active) {
  const u = seeThroughUniforms;
  if (!active) { u.stRadius.value = 0; return; }
  renderer.getDrawingBufferSize(u.stRes.value);
  tmp.copy(target).project(camera);
  u.stCenter.value.set(tmp.x * 0.5 + 0.5, tmp.y * 0.5 + 0.5);
  const dist = camera.position.distanceTo(target);
  u.stDepth.value = dist - 0.9;
  // Tinggi ±2.2 unit (pemain + Cing) dalam satuan tinggi layar.
  const screenH = 2.2 / (2 * dist * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2));
  u.stRadius.value = THREE.MathUtils.clamp(screenH * 0.95, 0.09, 0.32);
}
