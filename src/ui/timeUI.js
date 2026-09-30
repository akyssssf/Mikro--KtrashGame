// UI waktu untuk Gerbang Waktu (global) dan Lensa Waktu (lokal).
// Data per tahun dihitung pemanggil lewat onTime(t) → { health, micro, rows, caption, note }.
import { t } from '../data/dialogs.id.js';
import { sliderFromYears, yearParts, yearsFromSlider } from '../systems/timeSim.js';
import { whenText } from '../systems/projection.js';
import { button, h, uiRoot } from './dom.js';

const STEPS = 1000;

const healthColor = (v) => (v >= 70 ? '#2fb35a' : v >= 40 ? '#f5b82e' : '#c0343a');

export class TimeUI {
  constructor(game) {
    this.game = game;
    this.caption = h('section', { id: 'time-cap', class: 'card hidden', 'aria-live': 'polite' });
    this.panel = h('section', { id: 'time-panel', class: 'card hidden' });
    this.yearEl = h('div', { class: 'year', 'aria-live': 'off' });
    this.slider = h('input', { type: 'range', min: 0, max: STEPS, value: 0, 'aria-label': t('time.slider') });
    this.jumps = h('div', { class: 'jumps' });
    this.noteEl = h('div', { class: 'note' });
    this.playBtn = button(t('time.play'), () => this.togglePlay());
    this.closeBtn = button(t('time.back'), () => this.finish(), 'ghost', 'Esc');
    this.bar = h('section', { id: 'time-bar', class: 'card hidden' },
      this.yearEl,
      h('div', { class: 'mid' }, this.slider, this.jumps, this.noteEl),
      h('div', { class: 'row', style: 'flex-direction:column;align-items:stretch;gap:6px' }, this.playBtn, this.closeBtn),
    );
    this.inset = h('div', { id: 'soil-inset', class: 'hidden' }, h('span', {}, t('time.inset')));
    uiRoot().append(this.caption, this.panel, this.bar, this.inset);
    this.slider.addEventListener('input', () => {
      this.playing = false;
      this.#syncPlay();
      this.setSlider(+this.slider.value / STEPS);
    });
    this.opts = null;
    this.s = 0;
    this.playing = false;
    this.maxReached = 0;
  }

  get open() { return !!this.opts; }

  start(opts) {
    this.opts = opts;
    this.maxReached = 0;
    document.body.classList.add('time-mode');
    this.caption.classList.remove('hidden');
    this.panel.classList.remove('hidden');
    this.bar.classList.remove('hidden');
    this.inset.classList.toggle('hidden', !opts.inset);
    this.closeBtn.firstChild.textContent = opts.closeLabel ?? t('time.back');
    this.jumps.innerHTML = '';
    for (const y of opts.jumps) {
      const label = y < 1 ? t('time.jumpMonth', { n: Math.round(y * 12) }) : t('time.jump', { n: y });
      this.jumps.append(button(label, () => {
        this.playing = false;
        this.#syncPlay();
        this.setSlider(sliderFromYears(y, opts.maxYears));
      }, 'small ghost'));
    }
    this.playing = false;
    this.#syncPlay();
    this.setSlider(0);
    this.playBtn.focus({ preventScroll: true });
  }

  close() {
    document.body.classList.remove('time-mode');
    this.opts = null;
    this.playing = false;
    for (const el of [this.caption, this.panel, this.bar, this.inset]) el.classList.add('hidden');
  }

  finish() {
    if (!this.opts) return;
    const cb = this.opts.onClose;
    const reached = this.maxReached;
    this.close();
    cb?.(reached);
  }

  get years() { return yearsFromSlider(this.s, this.opts.maxYears); }

  setSlider(s) {
    this.s = Math.max(0, Math.min(1, s));
    this.slider.value = String(Math.round(this.s * STEPS));
    const years = this.years;
    this.maxReached = Math.max(this.maxReached, years);
    this.#render(years);
  }

  togglePlay() {
    if (!this.opts) return;
    if (!this.playing && this.s >= 1) this.setSlider(0);
    this.playing = !this.playing;
    this.#syncPlay();
  }

  #syncPlay() { this.playBtn.firstChild.textContent = this.playing ? t('time.pause') : t('time.play'); }

  #render(years) {
    const o = this.opts;
    const r = o.onTime(years);
    const y = yearParts(years);
    this.yearEl.innerHTML = '';
    this.yearEl.append(whenText(years), h('small', {}, y.unit === 'sekarang' ? o.title : t('time.fromNow')));
    this.caption.innerHTML = '';
    this.caption.append(h('div', { class: 't-title' }, o.title), h('div', { html: r.caption }));
    const hv = Math.round(r.health);
    this.panel.innerHTML = '';
    this.panel.append(
      h('h3', {}, t('time.whatsInSoil')),
      h('div', { class: 'kv' }, h('span', {}, t('time.soilHealth')), h('span', {}, `${hv}%`)),
      h('div', { class: 'bar' }, h('i', { style: `width:${hv}%;background-color:${healthColor(hv)}` })),
      h('div', { class: 'kv' }, h('span', {}, t('time.micro')), h('span', {}, r.micro)),
      h('div', { class: 'rows' }, r.rows.map((row) => h('div', { class: 'r' },
        h('span', { class: 'dot', style: `background:${row.color}` }, row.badge),
        h('span', { class: 'nm' }, row.name, h('br'), h('span', { class: 'note' }, row.decay)),
        h('span', { class: 'st' }, row.status),
      ))),
    );
    this.noteEl.textContent = r.note ?? o.note ?? '';
  }

  update(dt) {
    if (!this.opts || !this.playing) return;
    this.setSlider(this.s + dt / (this.opts.playSeconds ?? 20));
    if (this.s >= 1) {
      this.playing = false;
      this.#syncPlay();
      this.opts.onEnd?.();
    }
  }
}
