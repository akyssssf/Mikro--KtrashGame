// Kontrol sentuh untuk HP/tablet: joystick (jalan) di kiri, tombol Aksi & Lari di kanan.
// Seret di area kosong layar memutar kamera (lihat main.js). Hanya muncul saat menjelajah.
import { t } from '../data/dialogs.id.js';
import { h } from './dom.js';

export const isTouchDevice = () => window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 1;

const RADIUS = 52;
const capture = (el, id) => { try { el.setPointerCapture(id); } catch { /* pointer sudah dilepas */ } };

export class TouchControls {
  constructor(input) {
    this.input = input;
    this.knob = h('div', { class: 'knob' });
    this.stick = h('div', { class: 'stick', 'aria-label': t('mobile.stick') }, h('div', { class: 'ring' }, this.knob));
    this.actBtn = h('button', { class: 'tbtn act', type: 'button', 'aria-label': t('mobile.act') }, t('mobile.act'));
    this.runBtn = h('button', { class: 'tbtn run', type: 'button', 'aria-label': t('mobile.run') }, t('mobile.run'));
    this.el = h('div', { id: 'touch', class: 'hidden' }, this.stick, h('div', { class: 'tbtns' }, this.runBtn, this.actBtn));
    document.body.append(this.el);
    this.#bindStick();
    this.#bindHold(this.actBtn, 'interact');
    this.#bindHold(this.runBtn, 'run');
  }

  setVisible(v) {
    if (v === this.visible) return;
    this.visible = v;
    this.el.classList.toggle('hidden', !v);
    if (!v) this.#resetStick();
  }

  #bindStick() {
    let id = null;
    let origin = null;
    const move = (e) => {
      const dx = e.clientX - origin.x;
      const dy = e.clientY - origin.y;
      const len = Math.hypot(dx, dy);
      const k = len > RADIUS ? RADIUS / len : 1;
      this.knob.style.transform = `translate(${dx * k}px, ${dy * k}px)`;
      // Zona mati kecil; makin jauh makin cepat (≤1). y layar ke atas = maju.
      const m = Math.min(1, len / RADIUS);
      const s = m < 0.15 ? 0 : m;
      this.input.setVirtualAxis(len ? (dx / len) * s : 0, len ? (-dy / len) * s : 0);
      // Didorong penuh = lari otomatis.
      if (m > 0.95) this.input.held.add('run'); else if (!this.runHeld) this.input.held.delete('run');
    };
    this.stick.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      id = e.pointerId;
      const r = this.stick.querySelector('.ring').getBoundingClientRect();
      origin = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      capture(this.stick, id);
      this.stick.classList.add('on');
      move(e);
    });
    this.stick.addEventListener('pointermove', (e) => { if (e.pointerId === id) move(e); });
    const end = (e) => { if (e.pointerId === id) { id = null; this.#resetStick(); } };
    this.stick.addEventListener('pointerup', end);
    this.stick.addEventListener('pointercancel', end);
  }

  #resetStick() {
    this.knob.style.transform = '';
    this.stick.classList.remove('on');
    this.input.setVirtualAxis(0, 0);
    if (!this.runHeld) this.input.held.delete('run');
  }

  #bindHold(btn, action) {
    btn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      btn.classList.add('on');
      this.input.pressed.add(action);
      this.input.held.add(action);
      if (action === 'run') this.runHeld = true;
      capture(btn, e.pointerId);
    });
    const up = () => {
      btn.classList.remove('on');
      this.input.held.delete(action);
      if (action === 'run') this.runHeld = false;
    };
    btn.addEventListener('pointerup', up);
    btn.addEventListener('pointercancel', up);
  }
}

// Pesan "putar ke horizontal" yang muncul kapan pun HP dipegang tegak (diatur CSS).
export function addRotateHint() {
  document.body.append(h('div', { id: 'rotate-hint', 'aria-live': 'polite' },
    h('div', { class: 'phone', 'aria-hidden': 'true' }, h('i')), h('p', {}, t('mobile.portrait'))));
}

// Sebelum logo pembuka (khusus layar sentuh): ajak putar HP ke horizontal + layar penuh.
// Ketukan tombol ini juga menjadi gestur pertama, jadi audio bisa langsung menyala.
export function mobileGate() {
  return new Promise((resolve) => {
    const canFull = !!(document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen);
    const btn = h('button', { class: 'btn big', type: 'button' }, t(canFull ? 'mobile.playFull' : 'mobile.play'));
    const el = h('div', { id: 'mobile-gate' },
      h('div', { class: 'phone', 'aria-hidden': 'true' }, h('i')),
      h('h2', {}, t('mobile.title')),
      h('p', {}, t('mobile.rotate')),
      btn,
      canFull ? null : h('p', { class: 'hint' }, t('mobile.iosHint')),
    );
    document.body.append(el);
    btn.addEventListener('click', () => {
      // Jangan ditunggu: di sebagian browser janji ini tidak pernah selesai.
      const de = document.documentElement;
      const lock = () => screen.orientation?.lock?.('landscape').catch(() => {});
      try {
        const p = de.requestFullscreen ? de.requestFullscreen({ navigationUI: 'hide' }) : de.webkitRequestFullscreen?.();
        if (p?.then) p.then(lock, () => {}); else lock();
      } catch { /* layar penuh opsional */ }
      el.classList.add('out');
      setTimeout(() => { el.remove(); resolve(); }, 350);
    });
  });
}
