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
    await img.decode().catch(() => {});
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
