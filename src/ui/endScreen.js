// Layar akhir slice: hasil 100 tahun lagi + ringkasan statistik + kartu yang terbuka.
import { PLASTIC_CODES, PLASTICS } from '../data/plastics.js';
import { t } from '../data/dialogs.id.js';
import { outcomeOf } from '../systems/soilHealth.js';
import { button, h } from './dom.js';
import { Overlay } from './panels.js';

export class EndScreen {
  constructor(game) {
    this.game = game;
    this.overlay = new Overlay('ending');
  }

  show(health100, { onContinue, onReplay }) {
    const p = this.game.progress;
    const outcome = outcomeOf(health100);
    const s = p.data.stats;
    const stat = (value, key) => h('div', { class: 'stat' }, h('b', {}, value), h('span', {}, t(`ending.stats.${key}`)));
    const cards = h('div', { class: 'mini-cards', 'aria-label': t('ending.cards') }, PLASTIC_CODES.map((c) => {
      const open = p.hasCard(c);
      return h('span', { class: open ? '' : 'locked', style: open ? `background:${PLASTICS[c].color}` : '' }, open ? `${c} ${PLASTICS[c].abbr}` : `${c} ?`);
    }));
    const panel = h('section', { class: 'card panel', role: 'dialog', 'aria-labelledby': 'end-title' },
      h('div', { class: 'note' }, t('ending.kicker')),
      h('h2', { id: 'end-title' }, t(`ending.${outcome}.title`)),
      h('p', { class: 'outcome' }, t(`ending.${outcome}.text`)),
      h('div', { class: 'stat-grid' },
        stat(s.picked, 'picked'), stat(s.recycled + s.composted, 'recycled'), stat(s.reused, 'reused'),
        stat(s.bags, 'bags'), stat(s.buried, 'buried'), stat(`${Math.round(health100)}%`, 'health'),
      ),
      h('h3', { style: 'font-size:16px;margin:4px 0' }, t('ending.cards')),
      cards,
      h('p', { style: 'font-weight:700' }, t('ending.lesson')),
      h('p', { class: 'note' }, t('ending.teaser')),
      h('div', { class: 'row', style: 'justify-content:flex-end' },
        button(t('ending.replay'), onReplay, 'ghost'),
        button(t('ending.keepPlaying'), onContinue),
      ),
    );
    this.overlay.show(panel);
    panel.querySelector('.btn:last-child').focus();
  }

  hide() { this.overlay.hide(); }
}
