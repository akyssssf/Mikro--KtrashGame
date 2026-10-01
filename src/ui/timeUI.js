// UI waktu untuk Gerbang Waktu (global) dan Lensa Waktu (lokal).
// Data per tahun dihitung pemanggil lewat onTime(t) → { health, micro, rows, caption, note }.
import { t } from '../data/dialogs.id.js';
import { sliderFromYears, yearParts, yearsFromSlider } from '../systems/timeSim.js';
import { whenText } from '../systems/projection.js';
import { button, h, uiRoot, UI_ICONS } from './dom.js';
import { shell } from './panels.js';

const STEPS = 1000;

const healthColor = (v) => (v >= 70 ? '#2fb35a' : v >= 40 ? '#f5b82e' : '#c0343a');

export class TimeUI {
  constructor(game) {
    this.game = game;
    // Kartu caption & panel isi tanah memakai kerangka panel yang sama dengan UI lain.
    this.captionBody = h('div', { class: 'cap-text', 'aria-live': 'polite' });
    this.caption = shell({ id: 'timecap', title: t('time.gateTitle'), icon: 'clock', accent: 'sky', children: [this.captionBody] });
    this.caption.id = 'time-cap';
    this.caption.classList.add('hidden');
    this.panelBody = h('div');
    this.panel = shell({ id: 'timepanel', title: t('time.whatsInSoil'), icon: 'recycle', accent: 'green', children: [this.panelBody] });
    this.panel.id = 'time-panel';
    this.panel.classList.add('hidden');
    this.yearEl = h('div', { class: 'year', 'aria-live': 'off' });
    this.slider = h('input', { type: 'range', min: 0, max: STEPS, value: 0, 'aria-label': t('time.slider') });
    this.jumps = h('div', { class: 'jumps' });
    this.noteEl = h('div', { class: 'note' });
    this.playBtn = button(t('time.play'), () => this.togglePlay(), 'big');
    this.playIcon = h('span', { class: 'play-ico', html: UI_ICONS.play });
    this.playBtn.prepend(this.playIcon);
    this.closeBtn = button(t('time.back'), () => this.finish(), 'ghost', 'Esc');
    this.bar = h('section', { id: 'time-bar', class: 'card hidden' },
      this.yearEl,
      h('div', { class: 'mid' }, this.slider, this.jumps, this.noteEl),
      h('div', { class: 'side' }, this.playBtn, this.closeBtn),
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
    this.caption.querySelector('h2').textContent = opts.title;
    this.jumps.innerHTML = '';
    for (const y of opts.jumps) {
      const label = y < 1 ? t('time.jumpMonth', { n: Math.round(y * 12) }) : t('time.jump', { n: y });
      this.jumps.append(button(label, () => {
        this.playing = false;
        this.#syncPlay();
        this.setSlider(sliderFromYears(y, opts.maxYears));
      }, 'small ghost jump'));
    }
    this.playing = false;
    this.#syncPlay();
    this.setSlider(0);
    this.playBtn.focus({ preventScroll: true });
  }

  close() {
    document.body.classList.remove('time-mode');
    this.stopAt = null;
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
    this.slider.style.setProperty('--p', `${this.s * 100}%`);
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

  #syncPlay() {
    this.playBtn.lastChild.textContent = this.playing ? t('time.pause') : t('time.play');
    this.playIcon.innerHTML = this.playing ? UI_ICONS.pause : UI_ICONS.play;
  }

  #render(years) {
    const o = this.opts;
    const r = o.onTime(years);
    const y = yearParts(years);
    this.yearEl.innerHTML = '';
    this.yearEl.append(whenText(years), h('small', {}, y.unit === 'sekarang' ? o.title : t('time.fromNow')));
    this.captionBody.innerHTML = r.caption;
    const hv = Math.round(r.health);
    this.panelBody.innerHTML = '';
    this.panelBody.append(
      h('div', { class: 'kv' }, h('span', {}, t('time.soilHealth')), h('b', {}, `${hv}%`)),
      h('div', { class: 'bar' }, h('i', { style: `width:${hv}%;background-color:${healthColor(hv)}` })),
      h('div', { class: 'kv' }, h('span', {}, t('time.micro')), h('b', {}, r.micro)),
      h('div', { class: 'rows' }, r.rows.map((row) => h('div', { class: 'r' },
        h('span', { class: 'dot', style: `background:${row.color}` }, row.badge),
        h('span', { class: 'nm' }, row.name, h('br'), h('span', { class: 'note' }, row.decay)),
        h('span', { class: 'st' }, row.status),
      ))),
    );
    this.noteEl.textContent = r.note ?? o.note ?? '';
  }

  // Putar otomatis sampai posisi slider tertentu (dipakai Gerbang Waktu final).
  playTo(s) {
    this.stopAt = s;
    this.playing = true;
    this.#syncPlay();
  }

  update(dt) {
    if (!this.opts || !this.playing) return;
    const end = this.stopAt ?? 1;
    this.setSlider(Math.min(end, this.s + dt / (this.opts.playSeconds ?? 20)));
    if (this.s >= end) {
      this.stopAt = null;
      this.playing = false;
      this.#syncPlay();
      this.opts.onEnd?.();
    }
  }
}
