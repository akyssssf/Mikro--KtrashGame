// Menyusun tampilan Gerbang Waktu / Lensa Waktu dari timeSim (tanpa DOM, tanpa Three.js).
import { PLASTICS } from '../data/plastics.js';
import { ITEM_TYPES } from '../data/items.js';
import { t } from '../data/dialogs.id.js';
import { AREA_IDS } from '../world/areaRegistry.js';
import { latestMilestone, milestones, simulate, stageOf, progressOf, yearParts } from './timeSim.js';
import { areaDamage, villageHealth } from './soilHealth.js';

const ORGANIC_COLOR = '#4d7c0f';

export function whenText(years) {
  const y = yearParts(years);
  if (y.unit === 'bulan') return t('time.months', { n: y.value });
  if (y.unit === 'tahun') return t('time.years', { n: y.value });
  return t('time.now');
}

function decayText(D) {
  const y = yearParts(D);
  const v = y.unit === 'bulan' ? t('time.decayMonths', { n: y.value }) : t('time.decayYears', { n: y.value });
  return t('time.decay', { D: v });
}

// Proyeksi desa: tiap area mulai dari kerusakannya sekarang, lalu ditambah kerusakan plastiknya ke depan.
export function villageAt(soil, years) {
  let micro = 0;
  const perArea = {};
  for (const id of AREA_IDS) {
    const entries = soil.projectionEntries(id);
    const sim = simulate(entries, years, { baseDamage: areaDamage(soil.areaInput(id)) });
    perArea[id] = sim.health;
    micro += sim.micro;
  }
  return { health: villageHealth(Object.values(perArea)), micro, perArea };
}

export function microLabel(amount) {
  if (amount <= 0.01) return t('time.microNone');
  return amount < 3 ? t('time.microSome') : t('time.microLots');
}

function badgeOf(typeId) {
  const kode = ITEM_TYPES[typeId].kode;
  return typeof kode === 'number' ? { color: PLASTICS[kode].color, badge: String(kode) } : { color: ORGANIC_COLOR, badge: 'O' };
}

// Baris panel: dikelompokkan per jenis sampah.
export function rowsFor(entries, years) {
  const groups = new Map();
  for (const e of entries) {
    const g = groups.get(e.type) ?? { ...e, count: 0 };
    g.count += 1;
    groups.set(e.type, g);
  }
  return [...groups.values()].sort((a, b) => a.D - b.D).map((g) => ({
    ...badgeOf(g.type),
    name: `${t(`items.${g.type}`)}${g.count > 1 ? ` ×${g.count}` : ''}`,
    decay: decayText(g.D),
    status: t(`stages.${stageOf(progressOf(years, g.D), g.organic)}`),
  }));
}

// Caption dinamis: hanya menyebut jenis yang memang ada.
export function captionFor(entries, years, startKey = 'time.captionStart') {
  if (years <= 0) return t(startKey);
  if (!entries.some((e) => !e.organic)) return t('time.captionClean');
  const m = latestMilestone(milestones(entries), years);
  if (!m) return t('time.captionWaiting');
  const when = whenText(m.years);
  if (m.organic) return t('time.captionOrganic', { when, name: t(`items.${m.key}`) });
  return t('time.captionPlastic', { when, abbr: PLASTICS[m.code].abbr, code: m.code });
}

export function anyMicro(entries, years) {
  return entries.some((e) => !e.organic && progressOf(years, e.D) >= 0.3);
}
