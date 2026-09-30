// Air: pita sungai beranimasi + air terjun kecil di tepi pulau.
import * as THREE from 'three';
import { canvasTexture } from './builders.js';
import { ribbon } from './diorama.js';

function rippleTexture() {
  const tex = canvasTexture(128, 128, (ctx, w, h) => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(160,190,210,0.55)';
    ctx.lineWidth = 3;
    for (let i = 0; i < 9; i++) {
      const y = (i / 9) * h + 6;
      ctx.beginPath();
      ctx.moveTo(((i * 37) % w), y);
      ctx.quadraticCurveTo(((i * 37) % w) + 18, y - 6, ((i * 37) % w) + 38, y);
      ctx.stroke();
    }
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export function buildRiver(points, width) {
  const curve = new THREE.CatmullRomCurve3(points.map(([x, z]) => new THREE.Vector3(x, 0, z)));
  const group = new THREE.Group();
  const bank = ribbon(curve, width + 1.6, 0xcdb68a, 0.03, 90);
  bank.material.side = THREE.FrontSide;
  const bed = ribbon(curve, width + 0.4, 0x6b8f71, 0.045, 90);
  const map = rippleTexture();
  const water = ribbon(curve, width, 0x3fa9e0, 0.07, 90);
  const len = curve.getLength();
  // UV sepanjang sungai supaya tekstur riak bisa digeser searah arus.
  const uv = [];
  for (let i = 0; i <= 90; i++) uv.push(0, (i / 90) * len / 3, 1, (i / 90) * len / 3);
  water.geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  water.material = new THREE.MeshStandardMaterial({ color: 0x3fa9e0, map, roughness: 0.25, metalness: 0.05, transparent: true, opacity: 0.9 });
  water.receiveShadow = true;
  group.add(bank, bed, water);

  // Air terjun di kedua ujung (tepi pulau).
  const fallMat = new THREE.MeshStandardMaterial({ color: 0x8fd0f2, map, transparent: true, opacity: 0.75, side: THREE.DoubleSide, roughness: 0.3 });
  for (const u of [0, 1]) {
    const p = curve.getPointAt(u);
    const tan = curve.getTangentAt(u);
    const fall = new THREE.Mesh(new THREE.PlaneGeometry(width * 0.9, 5), fallMat);
    fall.position.set(p.x, -2.4, p.z);
    fall.rotation.y = Math.atan2(tan.x, tan.z) + Math.PI / 2;
    group.add(fall);
  }
  return { group, curve, water, material: water.material, map, length: len };
}

// Kolisi air dalam: kapsul sepanjang kurva.
export function riverColliders(collision, curve, width, step = 1.2) {
  const len = curve.getLength();
  const n = Math.ceil(len / step);
  let prev = curve.getPointAt(0);
  for (let i = 1; i <= n; i++) {
    const p = curve.getPointAt(i / n);
    collision.addCapsule(prev.x, prev.z, p.x, p.z, width / 2 - 0.15, { water: true });
    prev = p;
  }
}

export function distanceToCurve(samples, x, z) {
  let best = Infinity;
  for (const p of samples) best = Math.min(best, Math.hypot(p.x - x, p.z - z));
  return best;
}
