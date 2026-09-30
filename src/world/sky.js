import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { rng } from './builders.js';

export function createSky(scene) {
  const skyGeo = new THREE.SphereGeometry(300, 24, 12);
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      top: { value: new THREE.Color(0x5fb8ef) },
      horizon: { value: new THREE.Color(0xdff3ff) },
      bottom: { value: new THREE.Color(0xf6ecd3) },
    },
    vertexShader: `varying vec3 vPos; void main(){ vPos = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `uniform vec3 top; uniform vec3 horizon; uniform vec3 bottom; varying vec3 vPos;
      void main(){ float h = normalize(vPos).y;
        vec3 c = h > 0.0 ? mix(horizon, top, pow(h, 0.6)) : mix(horizon, bottom, pow(-h, 0.5));
        gl_FragColor = vec4(c, 1.0);
        #include <colorspace_fragment>
      }`,
  });
  const sky = new THREE.Mesh(skyGeo, skyMat);
  sky.renderOrder = -10;
  sky.frustumCulled = false;
  scene.add(sky);

  // Awan: satu geometri gabungan, digambar lewat InstancedMesh (1 draw call).
  const rand = rng(7);
  const puffs = [];
  for (let k = 0; k < 5; k++) {
    const s = new THREE.IcosahedronGeometry(1 + rand() * 0.6, 1);
    s.scale(1, 0.62, 0.85);
    s.translate(k * 1.3 - 2.6, rand() * 0.4, rand() * 0.6 - 0.3);
    puffs.push(s);
  }
  const cloudGeo = mergeGeometries(puffs);
  const clouds = new THREE.InstancedMesh(cloudGeo, new THREE.MeshLambertMaterial({ color: 0xffffff, flatShading: true }), 12);
  const cloudData = [];
  const m = new THREE.Matrix4();
  for (let i = 0; i < clouds.count; i++) {
    const a = rand() * Math.PI * 2;
    const r = 45 + rand() * 45;
    cloudData.push({ a, r, y: 10 + rand() * 18, s: 1.2 + rand() * 1.6, v: 0.004 + rand() * 0.006 });
  }
  const pos = new THREE.Vector3();
  const quat = new THREE.Quaternion();
  const scl = new THREE.Vector3();
  function update(dt) {
    cloudData.forEach((c, i) => {
      c.a += c.v * dt;
      pos.set(Math.cos(c.a) * c.r, c.y, Math.sin(c.a) * c.r);
      quat.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -c.a);
      scl.setScalar(c.s);
      m.compose(pos, quat, scl);
      clouds.setMatrixAt(i, m);
    });
    clouds.instanceMatrix.needsUpdate = true;
  }
  update(0);
  clouds.frustumCulled = false;
  scene.add(clouds);
  return { sky, clouds, update };
}
