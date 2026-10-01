// Transisi pindah area: titik-titik halftone hijau menutup layar secara diagonal,
// Cing melompat + nama tujuan di tengah, lalu titik mengecil membuka area baru.
import { t } from '../data/dialogs.id.js';
import { cingSvg, h } from './dom.js';

const CELL = 54;
const SPREAD = 0.9; // seberapa "miring" sapuannya (0 = semua titik bersamaan)
const COLOR = '#1a7f3d';
const COLOR_LIGHT = '#2fb35a';

export class AreaTransition {
  constructor() {
    this.canvas = h('canvas', { class: 'area-wipe', 'aria-hidden': 'true' });
    this.label = h('div', { class: 'area-wipe-label', 'aria-live': 'polite' });
    document.body.append(this.canvas, this.label);
    this.ctx = this.canvas.getContext('2d');
  }

  #resize() {
    const dpr = Math.min(window.devicePixelRatio, 2);
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    this.canvas.width = this.w * dpr;
    this.canvas.height = this.h * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // p(x,y) 0..1: besar titik; cover = menutup (kiri-atas dulu), !cover = membuka (kiri-atas dulu juga).
  #draw(k, cover) {
    const { ctx, w, h } = this;
    ctx.clearRect(0, 0, w, h);
    const rMax = CELL * 0.76;
    for (let row = -1, y = 0; y < h + CELL; row++, y += CELL * 0.86) {
      const off = row % 2 ? CELL / 2 : 0;
      for (let x = -off; x < w + CELL; x += CELL) {
        const d = (x / w) * 0.65 + (y / h) * 0.35;
        let p = Math.min(1, Math.max(0, k * (1 + SPREAD) - d * SPREAD));
        p = p * p * (3 - 2 * p);
        const r = (cover ? p : 1 - p) * rMax;
        if (r < 0.5) continue;
        ctx.fillStyle = COLOR;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
        // Polkadot terang di tengah tiap titik (terlihat saat layar tertutup penuh).
        ctx.fillStyle = COLOR_LIGHT;
        ctx.beginPath();
        ctx.arc(x, y, r * 0.22, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  #animate(cover, ms) {
    return new Promise((resolve) => {
      const start = performance.now();
      const step = (now) => {
        const k = Math.min(1, (now - start) / ms);
        this.#draw(k, cover);
        if (k < 1) requestAnimationFrame(step);
        else resolve();
      };
      requestAnimationFrame(step);
    });
  }

  async cover(areaId) {
    this.#resize();
    this.canvas.classList.add('on');
    this.label.innerHTML = '';
    this.label.append(
      h('div', { class: 'cing', html: cingSvg('ceria') }),
      h('b', {}, t(`areas.${areaId}.name`)),
      h('span', { class: 'dots' }, h('i'), h('i'), h('i')),
    );
    await this.#animate(true, 620);
    this.label.classList.add('on');
  }

  async reveal() {
    // Biarkan nama tujuan terbaca sebentar.
    await new Promise((r) => setTimeout(r, 650));
    this.label.classList.remove('on');
    await this.#animate(false, 620);
    this.canvas.classList.remove('on');
  }
}
