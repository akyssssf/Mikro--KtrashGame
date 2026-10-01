// Layar akhir slice: hasil 100 tahun lagi + ringkasan statistik + kartu yang terbuka.
import { PLASTIC_CODES, PLASTICS } from '../data/plastics.js';
import { t } from '../data/dialogs.id.js';
import { outcomeOf } from '../systems/soilHealth.js';
import { button, cingSvg, h } from './dom.js';
import { Overlay, shell } from './panels.js';

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
    const mood = { subur: 'semangat', pulih: 'ceria', kusam: 'lesu' }[outcome];
    const accent = { subur: 'green', pulih: 'orange', kusam: 'sky' }[outcome];
    const panel = shell({
      id: 'end', title: t(`ending.${outcome}.title`), accent,
      children: [
        h('div', { class: 'end-hero' },
          h('div', { class: 'end-cing', html: cingSvg(mood) }),
          h('div', {}, h('span', { class: 'chip' }, t('ending.kicker')), h('p', { class: 'outcome' }, t(`ending.${outcome}.text`))),
        ),
        h('div', { class: 'stat-grid' },
          stat(s.picked, 'picked'), stat(s.recycled + s.composted, 'recycled'), stat(s.reused, 'reused'),
          stat(s.bags, 'bags'), stat(s.buried, 'buried'), stat(`${Math.round(health100)}%`, 'health'),
        ),
        h('h3', { class: 'sec' }, t('ending.cards')),
        cards,
        h('p', { class: 'lesson' }, t('ending.lesson')),
        h('p', { class: 'note' }, t('ending.teaser')),
        h('div', { class: 'cta', style: 'gap:10px' },
          button(t('ending.replay'), onReplay, 'ghost'),
          button(t('ending.keepPlaying'), onContinue),
        ),
      ],
    });
    this.overlay.show(panel);
    panel.querySelector('.cta .btn:last-child').focus();
  }

  hide() { this.overlay.hide(); }
}
