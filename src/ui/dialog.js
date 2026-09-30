// Gelembung dialog: pendek, bisa dilanjut (E/Spasi/klik) dan dilewati (Esc).
import { t } from '../data/dialogs.id.js';
import { button, h, speakerSvg, uiRoot } from './dom.js';

const CPS = 55;

export class DialogBox {
  constructor(game) {
    this.game = game;
    this.portrait = h('div', { class: 'portrait' });
    this.who = h('div', { class: 'who' });
    this.text = h('div', { class: 'text' });
    this.nextBtn = button(t('dialogUi.next'), () => this.advance(), '', 'E');
    this.skipBtn = button(t('dialogUi.skip'), () => this.finish(), 'ghost small', 'Esc');
    this.el = h('section', { id: 'dialog', class: 'card hidden', role: 'dialog', 'aria-live': 'polite', 'aria-label': t('dialogUi.label') },
      this.portrait,
      h('div', { class: 'body' }, this.who, this.text, h('div', { class: 'actions' }, this.skipBtn, this.nextBtn)),
    );
    this.el.addEventListener('click', (e) => { if (e.target === this.text) this.advance(); });
    uiRoot().append(this.el);
    this.lines = [];
    this.index = 0;
    this.shown = 0;
    this.full = '';
    this.onDone = null;
  }

  get open() { return !this.el.classList.contains('hidden'); }

  start(lines, vars, onDone) {
    this.lines = lines.map((l) => ({ ...l, text: l.text.replace(/\{(\w+)\}/g, (_, k) => vars?.[k] ?? `{${k}}`) }));
    this.index = 0;
    this.onDone = onDone;
    this.el.classList.remove('hidden');
    this.#show();
  }

  #show() {
    const line = this.lines[this.index];
    this.who.textContent = t(`speakers.${line.who}`);
    this.portrait.innerHTML = speakerSvg(line.who);
    this.full = line.text;
    this.plain = line.text.replace(/<[^>]+>/g, '');
    this.shown = this.game.reducedMotion ? this.plain.length : 0;
    this.#render();
    this.nextBtn.firstChild.textContent = t(this.index === this.lines.length - 1 ? 'dialogUi.last' : 'dialogUi.next');
    this.nextBtn.focus({ preventScroll: true });
  }

  #render() {
    if (this.shown >= this.plain.length) { this.text.innerHTML = this.full; return; }
    this.text.textContent = this.plain.slice(0, Math.floor(this.shown));
  }

  advance() {
    if (this.shown < this.plain.length) {
      this.shown = this.plain.length;
      this.#render();
      return;
    }
    this.game.audio.click();
    this.index += 1;
    if (this.index >= this.lines.length) this.finish();
    else this.#show();
  }

  finish() {
    if (!this.open) return;
    this.el.classList.add('hidden');
    const cb = this.onDone;
    this.onDone = null;
    cb?.();
  }

  update(dt) {
    if (!this.open || this.shown >= this.plain.length) return;
    const before = Math.floor(this.shown);
    this.shown = Math.min(this.plain.length, this.shown + dt * CPS);
    if (Math.floor(this.shown) !== before) {
      if (before % 4 === 0) this.game.audio.talk();
      this.#render();
    }
  }
}
