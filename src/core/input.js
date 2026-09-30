// Lapisan input abstrak: game hanya membaca "aksi", bukan tombol.
// Sentuhan nanti cukup memanggil setVirtualAxis() dan tap() dari joystick/tombol layar.
import { Emitter } from './events.js';

const BINDINGS = {
  up: ['KeyW', 'ArrowUp'],
  down: ['KeyS', 'ArrowDown'],
  left: ['KeyA', 'ArrowLeft'],
  right: ['KeyD', 'ArrowRight'],
  run: ['ShiftLeft', 'ShiftRight'],
  interact: ['KeyE', 'Space', 'Enter', 'NumpadEnter'],
  rotateLeft: ['KeyQ'],
  rotateRight: ['KeyR'],
  pause: ['Escape'],
  codex: ['KeyK'],
  mute: ['KeyM'],
  inventory: ['KeyI', 'Tab'],
  fps: ['F3', 'Backquote'],
  slot1: ['Digit1', 'Numpad1'],
  slot2: ['Digit2', 'Numpad2'],
  slot3: ['Digit3', 'Numpad3'],
  slot4: ['Digit4', 'Numpad4'],
  slot5: ['Digit5', 'Numpad5'],
  slot6: ['Digit6', 'Numpad6'],
  slot7: ['Digit7', 'Numpad7'],
  slot8: ['Digit8', 'Numpad8'],
};

const codeToActions = new Map();
for (const [action, codes] of Object.entries(BINDINGS)) {
  for (const code of codes) {
    if (!codeToActions.has(code)) codeToActions.set(code, []);
    codeToActions.get(code).push(action);
  }
}

const isFormTarget = (el) => el instanceof HTMLElement && el.matches('button, input, select, textarea, a[href], summary');

export class InputManager extends Emitter {
  constructor(canvas) {
    super();
    this.canvas = canvas;
    this.held = new Set();
    this.pressed = new Set();
    this.virtualAxis = { x: 0, y: 0 };
    this.pointer = { x: 0, y: 0, inside: false };

    window.addEventListener('keydown', (e) => this.#onKey(e, true));
    window.addEventListener('keyup', (e) => this.#onKey(e, false));
    window.addEventListener('blur', () => this.held.clear());

    canvas.addEventListener('pointermove', (e) => {
      this.pointer.x = e.clientX;
      this.pointer.y = e.clientY;
      this.pointer.inside = true;
    });
    canvas.addEventListener('pointerleave', () => { this.pointer.inside = false; });
    canvas.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      this.pointer.x = e.clientX;
      this.pointer.y = e.clientY;
      this.emit('tap', { x: e.clientX, y: e.clientY, pointerId: e.pointerId, type: e.pointerType });
    });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  #onKey(e, isDown) {
    const actions = codeToActions.get(e.code);
    if (!actions) return;
    // Spasi/Enter pada tombol DOM yang sedang fokus biarkan ditangani tombol itu.
    if ((e.code === 'Space' || e.code.endsWith('Enter')) && isFormTarget(e.target)) return;
    if (e.code.startsWith('Arrow') && e.target instanceof HTMLInputElement) return;
    if (e.code === 'Tab' || e.code === 'Space' || e.code.startsWith('Arrow') || e.code === 'F3') e.preventDefault();
    for (const a of actions) {
      if (isDown) {
        if (!e.repeat) this.pressed.add(a);
        this.held.add(a);
      } else {
        this.held.delete(a);
      }
    }
    if (isDown && !e.repeat) this.emit('action', actions);
  }

  down(action) { return this.held.has(action); }

  // Sekali per tekan; dikonsumsi agar tidak dibaca dua sistem.
  consume(action) {
    const had = this.pressed.has(action);
    this.pressed.delete(action);
    return had;
  }

  setVirtualAxis(x, y) { this.virtualAxis = { x, y }; }

  // Sumbu gerak layar: x kanan, y maju. Panjang ≤ 1.
  axis() {
    let x = this.virtualAxis.x + (this.down('right') ? 1 : 0) - (this.down('left') ? 1 : 0);
    let y = this.virtualAxis.y + (this.down('up') ? 1 : 0) - (this.down('down') ? 1 : 0);
    const len = Math.hypot(x, y);
    if (len > 1) { x /= len; y /= len; }
    return { x, y };
  }

  endFrame() { this.pressed.clear(); }

  clear() {
    this.held.clear();
    this.pressed.clear();
  }
}
