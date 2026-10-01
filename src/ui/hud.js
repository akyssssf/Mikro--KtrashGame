// HUD eksplorasi: misi, kesehatan tanah + Cing, keranjang, alat, prompt, toast, banner, fade.
import { t, TEXT } from '../data/dialogs.id.js';
import { moodOf } from '../systems/soilHealth.js';
import { cingSvg, codeBadge, h, iconButton, TOOL_ICONS, UI_ICONS, uiRoot } from './dom.js';

const TOOL_ORDER = ['jaring', 'lensa', 'tasKain', 'pencapit'];

const healthColor = (v) => (v >= 70 ? '#2fb35a' : v >= 40 ? '#f5b82e' : '#c0343a');
const cingColor = (v) => {
  const k = Math.max(0, Math.min(1, v / 100));
  const mix = (a, b) => Math.round(a + (b - a) * k);
  return `rgb(${mix(185, 242)},${mix(163, 139)},${mix(166, 168)})`;
};

export class Hud {
  constructor(game) {
    this.game = game;
    const root = uiRoot();

    this.quest = h('section', { id: 'hud-quest', class: 'card', 'aria-label': t('hud.quest') });
    this.soil = h('section', { id: 'hud-soil', class: 'card', 'aria-label': t('hud.soil', { area: '' }) });
    this.cing = h('div', { class: 'cing' });
    this.areaLabel = h('span');
    this.areaVal = h('b');
    this.areaBar = h('i');
    this.villageVal = h('b');
    this.villageBar = h('i');
    this.moodText = h('span', { class: 'sr-only' });
    this.soil.append(this.cing, h('div', { class: 'meters' },
      h('div', { class: 'label' }, this.areaLabel, this.areaVal),
      h('div', { class: 'bar' }, this.areaBar),
      h('div', { class: 'label' }, h('span', {}, t('hud.village')), this.villageVal),
      h('div', { class: 'bar' }, this.villageBar),
      this.moodText,
    ));

    this.soundBtn = iconButton('soundOn', t('hud.soundOn'), () => game.toggleMute(), 'M');
    this.buttons = h('div', { class: 'icon-row' },
      iconButton('codex', t('hud.codexBtn'), () => game.openCodex(), 'K'),
      iconButton('basket', t('hud.basketBtn'), () => game.openBasket(), 'I'),
      this.soundBtn,
      iconButton('pause', t('hud.pauseBtn'), () => game.pause(), 'Esc'),
    );
    this.right = h('div', { id: 'hud-right' }, this.soil, this.buttons);

    this.slots = h('div', { class: 'slots', role: 'list', 'aria-label': t('hud.basket') });
    this.basketLabel = h('div', { class: 'basket-label' });
    this.tools = h('div', { class: 'tools', 'aria-label': t('hud.tools') });
    this.bottom = h('section', { id: 'hud-bottom', class: 'card' }, this.basketLabel, this.slots, h('div', { class: 'sep' }), this.tools);
    this.bottom.addEventListener('click', () => game.openBasket());

    this.promptEl = h('div', { id: 'prompt', class: 'hidden', role: 'status' });
    this.toastEl = h('div', { id: 'toast', role: 'status' });
    this.bannerEl = h('div', { id: 'banner', 'aria-live': 'polite' });
    this.fadeEl = h('div', { id: 'fade' });
    this.fpsEl = h('div', { id: 'fps', class: 'hidden' });

    this.group = [this.quest, this.right, this.bottom];
    root.append(...this.group, this.promptEl, this.toastEl, this.bannerEl, this.fpsEl);
    document.body.append(this.fadeEl);
    for (const el of [this.promptEl, this.toastEl, this.bannerEl, this.fpsEl]) el.classList.add('passthrough');

    this.prompt = {
      show: (p, s) => this.#showPrompt(p, s),
      hide: () => this.promptEl.classList.add('hidden'),
    };
    this.lastHealth = { area: -1, village: -1 };
  }

  setVisible(on) {
    for (const el of this.group) el.classList.toggle('hidden', !on);
    if (!on) this.prompt.hide();
  }

  #showPrompt(p, s) {
    if (s.behind) { this.prompt.hide(); return; }
    this.promptEl.classList.remove('hidden');
    this.promptEl.classList.toggle('warn', !!p.warn);
    const key = p.warn ? '' : '<kbd>E</kbd>';
    const html = `${key}<span>${p.verb}</span>`;
    if (this.promptEl.innerHTML !== html) this.promptEl.innerHTML = html;
    this.promptEl.style.transform = `translate(${Math.round(s.x)}px, ${Math.round(s.y - 8)}px) translate(-50%, -100%)`;
  }

  // Dipanggil saat progres berubah.
  refresh() {
    const g = this.game;
    const q = g.quests.active;
    const qText = TEXT.quests[q.id];
    const objs = g.quests.objectives();
    this.quest.innerHTML = '';
    this.quest.append(
      h('h3', {}, h('span', { class: 'chip' }, t('hud.quest'))),
      h('div', { class: 'title' }, qText.title),
      h('ul', {}, objs.map((o) => h('li', { class: o.done ? 'done' : '' },
        h('span', { class: 'box', 'aria-hidden': 'true' }),
        h('span', {}, qText.objectives[o.id], o.done ? h('span', { class: 'sr-only' }, t('a11y.done')) : null),
        o.need > 1 ? h('span', { class: 'count' }, `${o.have}/${o.need}`) : null,
      ))),
    );

    const items = g.inventory.items();
    const cap = g.progress.capacity;
    this.basketLabel.innerHTML = `${t('hud.basket')}<br>${items.length}/${cap}`;
    this.slots.innerHTML = '';
    for (let i = 0; i < cap; i++) {
      const it = items[i];
      if (!it) { this.slots.append(h('div', { class: 'slot empty', role: 'listitem' })); continue; }
      const b = codeBadge(it.code);
      this.slots.append(h('div', { class: 'slot', role: 'listitem', title: it.name, style: `background:${b.color}` },
        b.label, h('span', { class: 'sr-only' }, it.name)));
    }
    this.tools.innerHTML = '';
    for (const tool of TOOL_ORDER) {
      const has = g.progress.hasTool(tool);
      this.tools.append(h('div', { class: `tool ${has ? '' : 'locked'}`, title: t(`tools.${tool}`), html: TOOL_ICONS[tool] },
        h('span', { class: 'sr-only' }, `${t(`tools.${tool}`)}${has ? '' : t('a11y.locked')}`)));
    }
    const muted = g.audio.muted;
    this.soundBtn.firstElementChild.outerHTML = UI_ICONS[muted ? 'soundOff' : 'soundOn'];
    this.soundBtn.setAttribute('aria-label', t(muted ? 'hud.soundOff' : 'hud.soundOn'));
    this.soundBtn.title = `${t(muted ? 'hud.soundOff' : 'hud.soundOn')} (M)`;
  }

  // Kesehatan yang ditampilkan (sudah dihaluskan).
  setHealth(areaId, areaHealth, village) {
    const a = Math.round(areaHealth);
    const v = Math.round(village);
    if (a === this.lastHealth.area && v === this.lastHealth.village && this.lastHealth.id === areaId) return;
    this.lastHealth = { area: a, village: v, id: areaId };
    this.areaLabel.textContent = t('hud.soil', { area: t(`areas.${areaId}.name`) });
    this.areaVal.textContent = `${a}%`;
    this.areaBar.style.width = `${a}%`;
    this.areaBar.style.backgroundColor = healthColor(a);
    this.villageVal.textContent = `${v}%`;
    this.villageBar.style.width = `${v}%`;
    this.villageBar.style.backgroundColor = healthColor(v);
    const mood = moodOf(areaHealth);
    if (this.mood !== mood || Math.abs((this.cingHealth ?? 0) - a) >= 3) {
      this.mood = mood;
      this.cingHealth = a;
      this.cing.innerHTML = cingSvg(mood, cingColor(areaHealth));
      this.moodText.textContent = t(`hud.moods.${mood}`);
    }
  }

  toast(msg, kind = 'info', ms = 2600) {
    const el = this.toastEl;
    el.innerHTML = '';
    el.append(h('span', { class: 'ico', 'aria-hidden': 'true' }, { ok: '✓', bad: '!', info: 'i' }[kind] ?? 'i'), h('span', {}, msg));
    el.className = `show ${kind} passthrough`;
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => el.classList.remove('show'), ms);
  }

  banner(areaId) {
    this.bannerEl.innerHTML = `${t(`areas.${areaId}.name`)}<small>${t(`areas.${areaId}.sub`)}</small>`;
    this.bannerEl.classList.add('show');
    clearTimeout(this.bannerTimer);
    this.bannerTimer = setTimeout(() => this.bannerEl.classList.remove('show'), 2200);
  }

  fade(on) {
    this.fadeEl.classList.toggle('on', on);
    const ms = this.game.reducedMotion ? 60 : 380;
    return new Promise((r) => setTimeout(r, ms));
  }

  setFps(text) {
    this.fpsEl.classList.remove('hidden');
    this.fpsEl.textContent = text;
  }

  hideFps() { this.fpsEl.classList.add('hidden'); }
}
