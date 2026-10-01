// Pembuka: logo UNS (latar putih) → logo studio 21 (latar gelap), lalu layar judul
// berisi animasi logo Mikro! (video transparan) di atas langit + "ketuk untuk lanjut".
import { t } from '../data/dialogs.id.js';
import { h } from './dom.js';

const BASE = import.meta.env.BASE_URL;
// Safari belum mendukung video WebM transparan → pakai gambar logo dengan animasi CSS.
const NO_ALPHA_VIDEO = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

// Menunggu ms, atau lebih cepat bila pemain mengetuk/menekan tombol (lewati).
function waitOrSkip(ms) {
  return new Promise((resolve) => {
    const done = () => {
      clearTimeout(timer);
      window.removeEventListener('pointerdown', done);
      window.removeEventListener('keydown', done);
      resolve();
    };
    const timer = setTimeout(done, ms);
    window.addEventListener('pointerdown', done);
    window.addEventListener('keydown', done);
  });
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function playSplash() {
  const img = h('img', { alt: '' });
  const splash = h('div', { id: 'splash' }, img);
  document.body.append(splash);
  const logos = [
    { src: 'intro/uns.png', alt: t('game.unsAlt'), dark: false },
    { src: 'intro/studio21.png', alt: t('game.studioAlt'), dark: true },
  ];
  for (const logo of logos) {
    img.src = `${BASE}${logo.src}`;
    img.alt = logo.alt;
    img.className = logo.dark ? 'studio' : 'uni';
    // decode() bisa tertahan saat tab tidak terlihat; jangan sampai splash macet.
    await Promise.race([img.decode().catch(() => {}), sleep(1200)]);
    splash.classList.toggle('dark', logo.dark);
    await sleep(logo.dark ? 450 : 50);
    img.classList.add('on');
    await waitOrSkip(2200);
    img.classList.remove('on');
    await sleep(500);
  }
  splash.classList.add('out');
  await sleep(450);
  splash.remove();
}

export class TitleScreen {
  constructor() {
    this.video = NO_ALPHA_VIDEO ? null : h('video', { src: `${BASE}intro/mikro-title.webm`, muted: '', playsinline: '', preload: 'auto' });
    if (this.video) this.video.muted = true;
  }

  // onTap dipanggil saat pemain mengetuk setelah tulisan "ketuk" muncul.
  show(onTap, reducedMotion = false) {
    const art = this.video ?? h('img', { class: 'fallback', src: `${BASE}logo.png`, alt: t('game.logoAlt') });
    const prompt = h('p', { class: 'tap' }, t('game.tapToStart'));
    const el = h('div', { id: 'title', role: 'button', tabindex: '0', 'aria-label': `${t('game.title')}. ${t('game.tapToStart')}` }, art, prompt);
    document.getElementById('ui').append(el);
    el.focus({ preventScroll: true });

    let ready = false;
    const showPrompt = () => {
      if (ready) return;
      ready = true;
      prompt.classList.add('on');
      // Video tertahan (autoplay ditolak/tab di latar): tampilkan langsung frame akhir logo.
      if (this.video && !this.video.ended && Number.isFinite(this.video.duration)) this.video.currentTime = this.video.duration;
    };
    if (this.video) {
      this.video.currentTime = 0;
      this.video.play().catch(showPrompt);
      this.video.addEventListener('ended', showPrompt, { once: true });
      // Cadangan bila video gagal dimuat.
      this.video.addEventListener('error', showPrompt, { once: true });
    }
    setTimeout(showPrompt, this.video ? 6000 : 1400);

    const tap = (e) => {
      if (e.type === 'keydown' && ['Tab', 'Shift', 'Alt', 'Meta', 'Control'].includes(e.key)) return;
      e.preventDefault();
      if (!ready) {
        // Ketuk lebih awal: langsung lompat ke akhir animasi logo.
        showPrompt();
        return;
      }
      el.removeEventListener('pointerdown', tap);
      window.removeEventListener('keydown', tap);
      el.classList.add('out');
      setTimeout(() => el.remove(), reducedMotion ? 200 : 700);
      onTap();
    };
    el.addEventListener('pointerdown', tap);
    window.addEventListener('keydown', tap);
  }
}

// Video pembuka cerita (sekali tiap main baru). Bisa dilewati dengan tombol, Esc, Spasi atau Enter.
export function playOpening({ muted = false, reducedMotion = false } = {}) {
  return new Promise((resolve) => {
    const video = h('video', { src: `${BASE}intro/pembuka.mp4`, playsinline: '', preload: 'auto' });
    video.muted = muted;
    const skip = h('button', { class: 'btn ghost small skip', type: 'button' }, t('game.skipOpening'), h('span', { class: 'key' }, 'Esc'));
    const el = h('div', { id: 'opening', role: 'dialog', 'aria-label': t('game.openingLabel') }, video, skip);
    document.body.append(el);
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      window.removeEventListener('keydown', onKey, true);
      el.classList.add('out');
      video.pause();
      setTimeout(() => { el.remove(); resolve(); }, reducedMotion ? 100 : 550);
    };
    const onKey = (e) => {
      if (['Escape', 'Space', 'Enter', 'NumpadEnter'].includes(e.code)) {
        e.preventDefault();
        e.stopPropagation();
        finish();
      }
    };
    window.addEventListener('keydown', onKey, true);
    skip.addEventListener('click', finish);
    video.addEventListener('ended', finish);
    video.addEventListener('error', finish);
    requestAnimationFrame(() => el.classList.add('on'));
    // Klik "Main baru" adalah gestur pengguna, jadi video boleh berbunyi; kalau ditolak, putar tanpa suara.
    video.play().catch(() => { video.muted = true; video.play().catch(finish); });
    skip.focus({ preventScroll: true });
  });
}
