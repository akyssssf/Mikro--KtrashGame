import * as THREE from 'three';

const SHADOW_SPAN = 20;

export function createRenderContext(container) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0xdff1fb);
  container.prepend(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.5, 400);

  const hemi = new THREE.HemisphereLight(0xfff6e0, 0xb6a57c, 1.25);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xfff2d6, 2.3);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, {
    left: -SHADOW_SPAN, right: SHADOW_SPAN, top: SHADOW_SPAN, bottom: -SHADOW_SPAN, near: 1, far: 80,
  });
  sun.shadow.bias = -0.0006;
  sun.shadow.normalBias = 0.03;
  scene.add(sun, sun.target);
  const sunOffset = new THREE.Vector3(14, 30, 12);

  // Bayangan hanya dari satu lampu; kotak bayangan mengikuti fokus kamera supaya tetap tajam.
  function followShadow(focus) {
    const snap = 0.5;
    const fx = Math.round(focus.x / snap) * snap;
    const fz = Math.round(focus.z / snap) * snap;
    sun.target.position.set(fx, 0, fz);
    sun.position.set(fx + sunOffset.x, sunOffset.y, fz + sunOffset.z);
  }

  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  return { renderer, scene, camera, sun, hemi, followShadow, resize };
}
