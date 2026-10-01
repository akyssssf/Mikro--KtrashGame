// Lensa Waktu: batu soket + lensa melayang + pusaran di sekitar area kecil yang dimajukan waktunya.
import * as THREE from 'three';
import { canvasTexture, toon } from '../world/builders.js';
import { cloneAsset } from '../core/assets.js';

export class LensaWaktu {
  constructor({ socket, center, radius }) {
    this.center = new THREE.Vector3(center.x, 0, center.z);
    this.radius = radius;
    this.group = new THREE.Group();
    this.active = 0;
    this.goal = 0;

    const pedestal = new THREE.Group();
    pedestal.position.set(socket.x, 0, socket.z);
    const stone = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.75, 0.7, 7), toon({ color: 0x9ca3af, flatShading: true }));
    stone.position.y = 0.35;
    stone.castShadow = true;
    stone.receiveShadow = true;
    this.ringMat = new THREE.MeshBasicMaterial({ color: 0x7dd3fc });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.06, 6, 20), this.ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.72;
    const stoneAsset = cloneAsset('lensPedestal');
    if (stoneAsset) {
      stoneAsset.scale.setScalar(0.8);
      ring.position.y = 1.14;
    }
    pedestal.add(stoneAsset ?? stone, ring);
    this.group.add(pedestal);
    this.pedestal = pedestal;
    this.socket = new THREE.Vector3(socket.x, 0, socket.z);

    // Lensa yang melayang di atas pusat area.
    this.lens = new THREE.Group();
    const frame = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.09, 8, 28), toon({ color: 0xc9a227, metalness: 0.4, roughness: 0.35 }));
    const glass = new THREE.Mesh(new THREE.CircleGeometry(0.66, 28), new THREE.MeshBasicMaterial({ color: 0xbfe9ff, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false }));
    // Aset timeLens berdiri tegak (kaca pembesar bergagang); versi prosedural dimiringkan.
    this.lensAsset = cloneAsset('timeLens');
    if (this.lensAsset) {
      this.lensAsset.position.set(-0.15, -0.9, 0);
      this.lens.add(this.lensAsset);
    } else {
      this.lens.add(frame, glass);
      this.lens.rotation.x = -Math.PI / 2.4;
    }
    this.lens.position.set(center.x, 2.8, center.z);
    this.lens.visible = false;
    this.group.add(this.lens);

    // Pusaran di tanah + dinding tipis sebagai "wipe" area waktu.
    const swirlTex = canvasTexture(256, 256, (ctx, w, h) => {
      ctx.translate(w / 2, h / 2);
      for (let i = 0; i < 6; i++) {
        ctx.rotate(Math.PI / 3);
        const g = ctx.createLinearGradient(0, 0, w / 2, 0);
        g.addColorStop(0, 'rgba(125,211,252,0)');
        g.addColorStop(1, 'rgba(125,211,252,0.9)');
        ctx.strokeStyle = g;
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.arc(w / 6, 0, w / 3, Math.PI * 0.9, Math.PI * 1.6);
        ctx.stroke();
      }
    });
    this.swirlMat = new THREE.MeshBasicMaterial({ map: swirlTex, transparent: true, opacity: 0, depthWrite: false });
    this.swirl = new THREE.Mesh(new THREE.CircleGeometry(radius, 40), this.swirlMat);
    this.swirl.rotation.x = -Math.PI / 2;
    this.swirl.position.set(center.x, 0.06, center.z);
    this.group.add(this.swirl);
    this.wallMat = new THREE.MeshBasicMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false });
    this.wall = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 3, 40, 1, true), this.wallMat);
    this.wall.position.set(center.x, 1.5, center.z);
    this.group.add(this.wall);
  }

  setActive(on) { this.goal = on ? 1 : 0; }

  // Seberapa jauh objek dari pusat, untuk menentukan apakah ikut terkena waktu.
  contains(x, z) { return Math.hypot(x - this.center.x, z - this.center.z) <= this.radius; }

  update(dt, time, reducedMotion) {
    this.active += (this.goal - this.active) * Math.min(1, dt * 4);
    const a = this.active;
    this.lens.visible = a > 0.02;
    this.lens.scale.setScalar(0.4 + 0.6 * a);
    this.lens.position.y = 2.8 + Math.sin(time * 2) * 0.1 * (reducedMotion ? 0 : 1);
    if (this.lensAsset) this.lens.rotation.y = time * 0.8;
    else this.lens.rotation.z = time * 0.5;
    this.swirlMat.opacity = 0.75 * a;
    this.swirl.rotation.z = -time * (reducedMotion ? 0.3 : 1.6);
    this.wallMat.opacity = 0.14 * a;
    this.ringMat.color.setHSL(0.55, 0.9, 0.7 + 0.1 * Math.sin(time * 3));
  }
}
