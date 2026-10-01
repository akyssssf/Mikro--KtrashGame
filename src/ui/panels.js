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

export function pausePanel({ muted, onResume, onCodex, onMute, onMenu, saveOk }) {
  return h('section', { class: 'card panel', role: 'dialog', 'aria-labelledby': 'pause-title', style: 'width:min(420px,94vw);text-align:center' },
    h('h2', { id: 'pause-title', style: 'margin-bottom:12px' }, t('pause.title')),
    h('div', { class: 'stack', style: 'display:grid;gap:10px' },
      button(t('pause.resume'), onResume, '', 'Esc'),
      button(t('pause.codex'), onCodex, 'alt', 'K'),
      button(`${t('pause.sound')}: ${muted ? t('pause.off') : t('pause.on')}`, onMute, 'ghost', 'M'),
      button(t('pause.toMenu'), onMenu, 'ghost'),
    ),
    h('p', { class: 'note' }, saveOk ? t('pause.saved') : t('toast.saveFail')),
  );
}

function itemRow(it, actions) {
  const b = codeBadge(it.code);
  return h('div', { class: 'item-row' },
    h('div', { class: 'code', style: `background:${b.color}` }, h('span', {}, b.label, h('small', {}, b.abbr))),
    h('div', { class: 'name' }, it.name, h('small', {}, typeof it.code === 'number' ? t('basket.codeLabel', { code: it.code, abbr: b.abbr }) : t('basket.organic'))),
    h('div', { class: 'acts' }, actions),
  );
}

export function basketPanel({ items, capacity, onDump, onClose }) {
  const list = h('div', { class: 'item-list' });
  if (!items.length) list.append(h('p', {}, t('basket.empty')));
  for (const it of items) list.append(itemRow(it, [button(t('basket.dump'), () => onDump(it.gid), 'warn small')]));
  return h('section', { class: 'card panel', role: 'dialog', 'aria-labelledby': 'basket-title' },
    h('header', {}, h('h2', { id: 'basket-title' }, t('basket.title')), button(t('basket.close'), onClose, 'ghost small', 'Esc')),
    h('p', { class: 'note' }, t('basket.capacity', { n: items.length, max: capacity })),
    list,
    h('p', { class: 'note' }, t('basket.dumpHint'), ' ', t('basket.reuseHere')),
  );
}

export function recyclePanel({ items, onReuse, onSort, onClose }) {
  const list = h('div', { class: 'item-list' });
  if (!items.length) list.append(h('p', {}, t('recycle.empty')));
  for (const it of items) {
    const acts = [];
    if (it.type.reuseAs) acts.push(button(`${t('recycle.reuseBtn')}: ${t(`reuse.${it.type.reuseAs}`)}`, () => onReuse(it.gid), 'alt small'));
    list.append(itemRow(it, acts));
  }
  const sortBtn = button(t('recycle.startSort', { n: items.length }), onSort);
  sortBtn.disabled = !items.length;
  return h('section', { class: 'card panel', role: 'dialog', 'aria-labelledby': 'recycle-title' },
    h('header', {}, h('h2', { id: 'recycle-title' }, t('recycle.title')), button(t('recycle.close'), onClose, 'ghost small', 'Esc')),
    h('p', {}, h('b', {}, t('recycle.order'))),
    h('p', { class: 'note' }, t('recycle.intro')),
    list,
    h('div', { class: 'row', style: 'justify-content:flex-end' }, sortBtn),
  );
}
