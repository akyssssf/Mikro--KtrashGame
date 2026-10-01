// Panel overlay: menu judul, jeda, keranjang, Tempat Daur Ulang.
import { t, TEXT } from '../data/dialogs.id.js';
import { button, cingSvg, codeBadge, h, uiRoot, UI_ICONS } from './dom.js';

export class Overlay {
  constructor(id) {
    this.el = h('div', { id, class: 'backdrop hidden' });
    uiRoot().append(this.el);
  }

  get open() { return !this.el.classList.contains('hidden'); }

  show(content) {
    this.el.innerHTML = '';
    this.el.append(content);
    this.el.classList.remove('hidden');
    this.el.querySelector('button:not([disabled])')?.focus({ preventScroll: true });
  }

  hide() { this.el.classList.add('hidden'); }
}

export function menuPanel({ hasSave, onContinue, onNew, onCodex }) {
  const stack = h('div', { class: 'stack' });
  const confirmBox = h('div', { class: 'stack hidden' },
    h('p', { class: 'confirm' }, t('menu.newGameConfirm')),
    h('div', { class: 'row' },
      button(t('menu.yes'), onNew, 'alt'),
      button(t('menu.no'), () => { confirmBox.classList.add('hidden'); stack.classList.remove('hidden'); }, 'ghost'),
    ),
  );
  const play = (label, fn, cls = '') => {
    const b = button(label, fn, `big ${cls}`.trim());
    b.insertAdjacentHTML('afterbegin', UI_ICONS.play);
    return b;
  };
  if (hasSave) {
    stack.append(play(t('menu.continue'), onContinue));
    stack.append(button(t('menu.newGame'), () => { stack.classList.add('hidden'); confirmBox.classList.remove('hidden'); confirmBox.querySelector('button').focus(); }, 'ghost'));
  } else {
    stack.append(play(t('menu.newGame'), onNew));
  }
  const codexBtn = button(t('menu.codex'), onCodex, 'alt');
  codexBtn.insertAdjacentHTML('afterbegin', UI_ICONS.codex);
  stack.append(codexBtn);
  const controls = h('div', { class: 'controls', 'aria-label': t('menu.controlsTitle') },
    TEXT.menu.controls.flatMap(([k, v]) => [h('span', { class: 'keys' }, k.split(' / ').map((x) => h('kbd', {}, x))), h('span', {}, v)]));
  return h('section', { id: 'menu', class: 'card', role: 'dialog', 'aria-labelledby': 'menu-title' },
    h('div', { class: 'brand' },
      h('div', { class: 'brand-cing', html: cingSvg('ceria') }),
      h('h1', { id: 'menu-title' }, h('span', { class: 'a' }, t('game.titleA')), h('span', { class: 'b' }, t('game.titleB'))),
    ),
    h('p', { class: 'tagline' }, t('game.tagline')),
    stack, confirmBox,
    h('details', { class: 'how' }, h('summary', {}, t('menu.controlsTitle')), controls),
    h('p', { class: 'foot' }, t('menu.footer')),
  );
}

const CLOSE_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6 L18 18 M18 6 L6 18" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/></svg>';

// Kerangka panel seragam: pita judul berwarna + ikon + tombol tutup.
export function shell({ id, title, icon, accent = 'green', onClose, width, children }) {
  const close = onClose ? h('button', {
    class: 'close-btn', type: 'button', 'aria-label': t('panel.close'), title: `${t('panel.close')} (Esc)`, html: CLOSE_SVG, onclick: onClose,
  }) : null;
  return h('section', { class: `card panel shell accent-${accent}`, role: 'dialog', 'aria-labelledby': `${id}-title`, style: width ? `width:${width}` : null },
    h('header', { class: 'shell-head' },
      icon ? h('span', { class: 'shell-icon', html: UI_ICONS[icon] }) : null,
      h('h2', { id: `${id}-title` }, title),
      close,
    ),
    h('div', { class: 'shell-body' }, children),
  );
}

export function pausePanel({ muted, quest, onResume, onCodex, onMute, onMenu, saveOk }) {
  const withIcon = (b, icon) => { b.insertAdjacentHTML('afterbegin', UI_ICONS[icon]); return b; };
  return shell({
    id: 'pause', title: t('pause.title'), icon: 'pause', accent: 'ink', width: 'min(460px,94vw)', onClose: onResume,
    children: [
      h('div', { class: 'pause-quest' },
        h('div', { class: 'pause-cing', html: cingSvg('ceria') }),
        h('div', {},
          h('span', { class: 'chip' }, t('hud.quest')),
          h('div', { class: 'title' }, quest.title),
          h('ul', {}, quest.objectives.map((o) => h('li', { class: o.done ? 'done' : '' }, o.text, o.need > 1 ? ` (${o.have}/${o.need})` : ''))),
        ),
      ),
      h('div', { class: 'stack' },
        withIcon(button(t('pause.resume'), onResume, 'big', 'Esc'), 'play'),
        withIcon(button(t('pause.codex'), onCodex, 'alt', 'K'), 'codex'),
        withIcon(button(`${t('pause.sound')}: ${muted ? t('pause.off') : t('pause.on')}`, onMute, 'ghost', 'M'), muted ? 'soundOff' : 'soundOn'),
        button(t('pause.toMenu'), onMenu, 'ghost'),
      ),
      h('p', { class: 'note center-text' }, saveOk ? t('pause.saved') : t('toast.saveFail')),
    ],
  });
}

function badge(it) {
  const b = codeBadge(it.code);
  return h('div', { class: 'code', style: `background:${b.color}` }, h('span', {}, b.label, h('small', {}, b.abbr)));
}

function itemName(it) {
  const b = codeBadge(it.code);
  return h('div', { class: 'name' }, it.name, h('small', {}, typeof it.code === 'number' ? t('basket.codeLabel', { code: it.code, abbr: b.abbr }) : t('basket.organic')));
}

export function basketPanel({ items, capacity, onDump, onClose }) {
  const grid = h('div', { class: 'item-grid' });
  for (const it of items) {
    grid.append(h('div', { class: 'item-card' }, badge(it), itemName(it),
      h('button', { class: 'link-warn', type: 'button', onclick: () => onDump(it.gid) }, t('basket.dump'))));
  }
  for (let i = items.length; i < capacity; i++) grid.append(h('div', { class: 'item-card empty', 'aria-hidden': 'true' }));
  const pct = Math.round((items.length / capacity) * 100);
  return shell({
    id: 'basket', title: t('basket.title'), icon: 'basket', accent: 'orange', onClose,
    children: [
      h('div', { class: 'cap-row' },
        h('span', {}, t('basket.capacity', { n: items.length, max: capacity })),
        h('div', { class: 'bar' }, h('i', { style: `width:${pct}%;background-color:${pct >= 100 ? '#c0343a' : '#f08a2c'}` })),
      ),
      items.length ? grid : h('p', { class: 'empty-note' }, t('basket.empty')),
      h('p', { class: 'note' }, t('basket.dumpHint'), ' ', t('basket.reuseHere')),
    ],
  });
}

export function recyclePanel({ items, onReuse, onSort, onClose }) {
  const steps = h('ol', { class: 'stepper', 'aria-label': t('recycle.order') },
    TEXT.recycle.steps.map((label, i) => h('li', { class: i === 1 || i === 2 ? 'here' : '' }, h('b', {}, i + 1), label)));
  const reusable = items.filter((it) => it.type.reuseAs);
  const reuseList = h('div', { class: 'item-grid' }, reusable.map((it) => h('div', { class: 'item-card' }, badge(it), itemName(it),
    button(t(`reuse.${it.type.reuseAs}`), () => onReuse(it.gid), 'alt small'))));
  const chips = h('div', { class: 'chips' }, items.map((it) => {
    const b = codeBadge(it.code);
    return h('span', { class: 'mini-chip', style: `background:${b.color}` }, b.label, h('span', { class: 'sr-only' }, it.name));
  }));
  const sortBtn = button(t('recycle.startSort', { n: items.length }), onSort, 'big');
  sortBtn.disabled = !items.length;
  return shell({
    id: 'recycle', title: t('recycle.title'), icon: 'recycle', accent: 'green', onClose,
    children: [
      steps,
      h('p', { class: 'note' }, t('recycle.intro')),
      reusable.length ? h('h3', { class: 'sec' }, t('recycle.reuseTitle')) : null,
      reusable.length ? reuseList : null,
      h('h3', { class: 'sec' }, t('recycle.sortTitle')),
      items.length ? chips : h('p', { class: 'empty-note' }, t('recycle.empty')),
      h('div', { class: 'cta' }, sortBtn),
    ],
  });
}
