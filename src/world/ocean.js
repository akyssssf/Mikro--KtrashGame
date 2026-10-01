// Laut di sekeliling pulau + pulau-pulau batu di kejauhan (supaya horizon terlihat hidup).
import * as THREE from 'three';
import { bake, canvasTexture, cone, ico, place, rng } from './builders.js';
import { cloneAsset } from '../core/assets.js';

export const OCEAN_Y = -1.1;
export const HORIZON = 0xc6efff;

export function createOcean(scene) {
  const tex = canvasTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(190,235,250,0.9)';
    const r = rng(5);
    for (let i = 0; i < 40; i++) {
      const x = r() * w;
      const y = r() * h;
      ctx.beginPath();
      ctx.ellipse(x, y, 10 + r() * 16, 2 + r() * 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(40, 40);
  const geo = new THREE.CircleGeometry(400, 48);
  geo.rotateX(-Math.PI / 2);
  const material = new THREE.MeshStandardMaterial({ color: 0x27bde6, map: tex, roughness: 0.35, metalness: 0 });
  const sea = new THREE.Mesh(geo, material);
  sea.position.y = OCEAN_Y;
  sea.receiveShadow = true;
  scene.add(sea);

  const far = new THREE.Group();
  const rand = rng(21);
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2 + rand() * 0.3;
    const d = 85 + rand() * 90;
    const stack = cloneAsset(`seaStack_${(i % 3) + 1}`, { shadow: false });
    if (stack) {
      stack.scale.setScalar(0.7 + rand() * 0.6);
      far.add(place(stack, Math.cos(a) * d, OCEAN_Y - 0.3, Math.sin(a) * d, rand() * 6));
      continue;
    }
    const s = 5 + rand() * 9;
    const isle = new THREE.Group();
    isle.add(cone(1, 2.2, 0x7d8fb3, 0, 1.1, 0, 6));
    isle.add(cone(0.7, 2.6, 0x8a9cc0, 0.7, 1.2, 0.3, 6));
    isle.add(ico(0.55, 0xa9d65a, 0, 0.35, 0.8, 0), ico(0.45, 0xa9d65a, -0.6, 0.3, -0.4, 0));
    isle.scale.set(s, s * (0.8 + rand() * 0.8), s);
    far.add(place(isle, Math.cos(a) * d, OCEAN_Y - 0.5, Math.sin(a) * d, rand() * 6));
  }
  bake(far);
  far.traverse((o) => { if (o.isMesh) o.castShadow = false; });
  scene.add(far);

  return {
    update(dt) {
      tex.offset.x += dt * 0.004;
      tex.offset.y += dt * 0.002;
    },
  };
}
