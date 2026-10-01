// Pembantu DOM kecil + ikon SVG (tanpa emoji).
import { PLASTICS } from '../data/plastics.js';

export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

export const uiRoot = () => document.getElementById('ui');

export function button(label, onClick, cls = '', key = null) {
  const b = h('button', { class: `btn ${cls}`.trim(), type: 'button' }, label);
  if (key) b.append(h('span', { class: 'key', 'aria-hidden': 'true' }, key));
  b.addEventListener('click', (e) => {
    e.currentTarget.blur();
    onClick(e);
  });
  return b;
}

// Wajah Cing untuk HUD/dialog. mood: ceria | biasa | lesu.
export function cingSvg(mood = 'ceria', color = '#f28ba8') {
  const mouth = {
    ceria: '<path d="M26 44 Q35 53 44 44" stroke="#7a2340" stroke-width="4" fill="none" stroke-linecap="round"/>',
    biasa: '<path d="M27 46 L43 46" stroke="#7a2340" stroke-width="4" fill="none" stroke-linecap="round"/>',
    lesu: '<path d="M27 49 Q35 42 43 49" stroke="#7a2340" stroke-width="4" fill="none" stroke-linecap="round"/>',
  }[mood];
  const brow = mood === 'lesu'
    ? '<path d="M22 24 L30 27 M48 24 L40 27" stroke="#17324d" stroke-width="3" stroke-linecap="round"/>'
    : '';
  return `<svg viewBox="0 0 70 70" role="img" aria-label="Cing">
    <ellipse cx="35" cy="64" rx="22" ry="4" fill="#17324d" opacity=".15"/>
    <circle cx="35" cy="38" r="24" fill="${color}" stroke="#17324d" stroke-width="3"/>
    <path d="M40 14 Q52 6 58 14 Q50 18 40 14Z" fill="#4f9e45" stroke="#17324d" stroke-width="2.5"/>
    <circle cx="27" cy="33" r="6" fill="#fff" stroke="#17324d" stroke-width="2"/>
    <circle cx="43" cy="33" r="6" fill="#fff" stroke="#17324d" stroke-width="2"/>
    <circle cx="28" cy="34" r="3" fill="#17324d"/><circle cx="44" cy="34" r="3" fill="#17324d"/>
    ${brow}${mouth}
    <circle cx="19" cy="42" r="3.5" fill="#ff6b8b" opacity=".45"/><circle cx="51" cy="42" r="3.5" fill="#ff6b8b" opacity=".45"/>
  </svg>`;
}

export function speakerSvg(who) {
  if (who === 'cing') return cingSvg('ceria');
  const colors = { busari: ['#1a7f3d', '#f3c9a0', '#3b2a1a'], darto: ['#2563eb', '#d9a578', '#1f2937'], nelayan: ['#b45309', '#e0a97a', '#6b7280'] };
  const [shirt, skin, hair] = colors[who] ?? ['#f08a2c', '#e0a97a', '#3b2a1a'];
  return `<svg viewBox="0 0 70 70" role="img" aria-label="${who}">
    <path d="M12 68 Q14 46 35 46 Q56 46 58 68Z" fill="${shirt}" stroke="#17324d" stroke-width="3"/>
    <circle cx="35" cy="30" r="15" fill="${skin}" stroke="#17324d" stroke-width="3"/>
    <path d="M20 26 Q22 12 35 13 Q49 12 50 26 Q42 20 35 21 Q27 20 20 26Z" fill="${hair}" stroke="#17324d" stroke-width="2.5"/>
    <circle cx="30" cy="31" r="2.2" fill="#17324d"/><circle cx="40" cy="31" r="2.2" fill="#17324d"/>
    <path d="M30 38 Q35 42 40 38" stroke="#17324d" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  </svg>`;
}

// Segitiga kode daur ulang.
export function codeTriangle(code, color = PLASTICS[code]?.color ?? '#475569', locked = false) {
  const fill = locked ? '#b8b2a3' : color;
  return `<svg class="tri" viewBox="0 0 60 60" aria-hidden="true">
    <path d="M30 6 L55 50 L5 50 Z" fill="${fill}" stroke="#17324d" stroke-width="4" stroke-linejoin="round"/>
    <text x="30" y="43" text-anchor="middle" font-size="22" font-weight="800" fill="#fff" font-family="system-ui, sans-serif">${locked ? '?' : code}</text>
  </svg>`;
}

export const TOOL_ICONS = {
  jaring: '<svg viewBox="0 0 32 32"><path d="M4 28 L16 16" stroke="#7a5230" stroke-width="3" stroke-linecap="round"/><circle cx="21" cy="11" r="8" fill="#fff8e7" stroke="#17324d" stroke-width="2.5"/><path d="M15 7 L27 15 M15 15 L27 7 M21 3 L21 19 M13 11 L29 11" stroke="#17324d" stroke-width="1.2"/></svg>',
  lensa: '<svg viewBox="0 0 32 32"><circle cx="14" cy="14" r="9" fill="#bfe9ff" stroke="#c9a227" stroke-width="3"/><path d="M20.5 20.5 L28 28" stroke="#17324d" stroke-width="3.5" stroke-linecap="round"/><path d="M14 9 L14 14 L18 16" stroke="#17324d" stroke-width="2" fill="none" stroke-linecap="round"/></svg>',
  tasKain: '<svg viewBox="0 0 32 32"><path d="M11 12 Q11 4 16 4 Q21 4 21 12" stroke="#17324d" stroke-width="2.5" fill="none"/><path d="M6 11 L26 11 L24 29 L8 29 Z" fill="#e9d8b4" stroke="#17324d" stroke-width="2.5" stroke-linejoin="round"/><path d="M12 19 Q16 15 20 19 Q16 24 12 19Z" fill="#1a7f3d"/></svg>',
  pencapit: '<svg viewBox="0 0 32 32"><path d="M6 27 L22 9" stroke="#475569" stroke-width="3" stroke-linecap="round"/><path d="M22 9 L27 5 M22 9 L26 12" stroke="#17324d" stroke-width="3" stroke-linecap="round"/><rect x="3" y="24" width="7" height="5" rx="2" fill="#f08a2c" stroke="#17324d" stroke-width="2"/></svg>',
};

export const UI_ICONS = {
  codex: '<svg viewBox="0 0 32 32" aria-hidden="true"><rect x="5" y="7" width="14" height="19" rx="3" fill="#fff8e7" stroke="#17324d" stroke-width="2.5" transform="rotate(-10 12 16)"/><rect x="12" y="5" width="14" height="19" rx="3" fill="#f08a2c" stroke="#17324d" stroke-width="2.5"/><path d="M19 10 L23 17 L15 17 Z" fill="none" stroke="#17324d" stroke-width="2" stroke-linejoin="round"/></svg>',
  basket: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M9 13 Q16 3 23 13" stroke="#17324d" stroke-width="2.5" fill="none"/><path d="M5 13 H27 L24 27 H8 Z" fill="#e3b06d" stroke="#17324d" stroke-width="2.5" stroke-linejoin="round"/><path d="M11 17 V23 M16 17 V23 M21 17 V23" stroke="#17324d" stroke-width="2" stroke-linecap="round"/></svg>',
  soundOn: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M6 12 H11 L17 7 V25 L11 20 H6 Z" fill="#fff8e7" stroke="#17324d" stroke-width="2.5" stroke-linejoin="round"/><path d="M21 11 Q25 16 21 21 M24 8 Q30 16 24 24" stroke="#17324d" stroke-width="2.5" fill="none" stroke-linecap="round"/></svg>',
  soundOff: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M6 12 H11 L17 7 V25 L11 20 H6 Z" fill="#fff8e7" stroke="#17324d" stroke-width="2.5" stroke-linejoin="round"/><path d="M21 12 L28 20 M28 12 L21 20" stroke="#c0343a" stroke-width="3" stroke-linecap="round"/></svg>',
  pause: '<svg viewBox="0 0 32 32" aria-hidden="true"><rect x="8" y="7" width="6" height="18" rx="2" fill="#fff8e7" stroke="#17324d" stroke-width="2.5"/><rect x="18" y="7" width="6" height="18" rx="2" fill="#fff8e7" stroke="#17324d" stroke-width="2.5"/></svg>',
  recycle: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 5 L21 13 H11 Z" fill="#d9f7e3" stroke="#17324d" stroke-width="2.2" stroke-linejoin="round"/><path d="M7 25 L4 17 L12 19 Z" fill="#d9f7e3" stroke="#17324d" stroke-width="2.2" stroke-linejoin="round"/><path d="M28 22 L20 27 V19 Z" fill="#d9f7e3" stroke="#17324d" stroke-width="2.2" stroke-linejoin="round"/><path d="M13 9 Q8 12 7 18 M20 24 Q14 27 9 23 M23 12 Q27 16 25 21" stroke="#17324d" stroke-width="2.2" fill="none" stroke-linecap="round"/></svg>',
  clock: '<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="17" r="11" fill="#bfe9ff" stroke="#17324d" stroke-width="2.5"/><path d="M16 10 V17 L21 20" stroke="#17324d" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M12 4 H20" stroke="#17324d" stroke-width="2.5" stroke-linecap="round"/></svg>',
  play: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M10 6 L26 16 L10 26 Z" fill="currentColor"/></svg>',
};

// Tombol ikon persegi dengan label untuk pembaca layar dan petunjuk tombol keyboard.
export function iconButton(icon, label, onClick, key) {
  const b = h('button', { class: 'icon-btn', type: 'button', title: `${label} (${key})`, 'aria-label': label, html: UI_ICONS[icon] });
  b.append(h('span', { class: 'key', 'aria-hidden': 'true' }, key));
  b.addEventListener('click', (e) => { e.currentTarget.blur(); onClick(e); });
  return b;
}

export const ORGANIC_SWATCH = '#4d7c0f';

export function codeBadge(code) {
  if (typeof code !== 'number') return { color: ORGANIC_SWATCH, label: 'O', abbr: 'organik' };
  return { color: PLASTICS[code].color, label: String(code), abbr: PLASTICS[code].abbr };
}
