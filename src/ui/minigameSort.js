// Mini-game memilah (diadaptasi dari demo lama): ban berjalan + 8 tempat sampah (kode 1–7 + organik).
// Isinya sampah dari keranjang pemain. Seret ke tempat sampah, tekan 1–8, atau klik tombol tempat sampah.
import * as THREE from 'three';
import { PLASTICS } from '../data/plastics.js';
import { t } from '../data/dialogs.id.js';
import { makeItemModel } from '../world/items3d.js';
import { canvasTexture, toon } from '../world/builders.js';
import { button, codeBadge, h, uiRoot } from './dom.js';
import { shell } from './panels.js';

const BELT_TOP = 0.56;
const BELT_HALF = 9.5;
const BIN_Z = 4.4;
const ORGANIC_BIN = 8;
const binX = (n) => (n - 4.5) * 2.05;
const BINS = [1, 2, 3, 4, 5, 6, 7, ORGANIC_BIN];
const HINTS = ['always', 'hover', 'none'];

const rnd = (a, b) => a + Math.random() * (b - a);

function binLabel(n) {
  if (n === ORGANIC_BIN) return { color: '#4d7c0f', top: 'O', bottom: t('sort.binOrganic') };
  return { color: PLASTICS[n].color, top: String(n), bottom: PLASTICS[n].abbr };
}

export class SortGame {
  constructor(game) {
    this.game = game;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xcfeafb);
    this.camera = new THREE.PerspectiveCamera(40, 1, 0.1, 120);
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0xd9c9a0, 1.5));
    const sun = new THREE.DirectionalLight(0xffffff, 1.8);
    sun.position.set(6, 15, 9);
    this.scene.add(sun);
    this.#buildStage();
    this.#buildUi();
    this.items = [];
    this.active = false;
    this.ray = new THREE.Raycaster();
    this.dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -1.3);
    this.#bindPointer();
    window.addEventListener('resize', () => { if (this.active) this.resize(); });
  }

  #buildStage() {
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(70, 40), toon({ color: 0xf0e3bd }));
    ground.rotation.x = -Math.PI / 2;
    ground.position.z = 1;
    this.scene.add(ground);
    this.beltTex = canvasTexture(64, 64, (c) => {
      c.fillStyle = '#3d4a5e';
      c.fillRect(0, 0, 64, 64);
      c.fillStyle = '#2f3b4d';
      c.fillRect(0, 0, 8, 64);
    });
    this.beltTex.wrapS = this.beltTex.wrapT = THREE.RepeatWrapping;
    this.beltTex.repeat.set(BELT_HALF * 2, 1);
    const base = new THREE.Mesh(new THREE.BoxGeometry(BELT_HALF * 2, BELT_TOP, 2.6), toon({ color: 0x2b3442 }));
    base.position.y = BELT_TOP / 2;
    const top = new THREE.Mesh(new THREE.PlaneGeometry(BELT_HALF * 2, 2.6), toon({ map: this.beltTex }));
    top.rotation.x = -Math.PI / 2;
    top.position.y = BELT_TOP + 0.005;
    this.scene.add(base, top);
    for (const z of [-1.36, 1.36]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(BELT_HALF * 2, 0.2, 0.14), toon({ color: 0xffb020 }));
      rail.position.set(0, BELT_TOP + 0.08, z);
      this.scene.add(rail);
    }
    this.bins = {};
    for (const n of BINS) {
      const L = binLabel(n);
      const col = new THREE.Color(L.color);
      const front = toon({
        map: canvasTexture(256, 224, (x) => {
          x.fillStyle = L.color;
          x.fillRect(0, 0, 256, 224);
          x.lineJoin = 'round';
          x.lineWidth = 14;
          x.strokeStyle = '#fff';
          if (n !== ORGANIC_BIN) {
            x.beginPath();
            x.moveTo(128, 22);
            x.lineTo(212, 160);
            x.lineTo(44, 160);
            x.closePath();
            x.stroke();
          }
          x.fillStyle = '#fff';
          x.textAlign = 'center';
          x.textBaseline = 'middle';
          x.font = 'bold 78px system-ui, sans-serif';
          x.fillText(L.top, 128, 110);
          x.font = 'bold 34px system-ui, sans-serif';
          x.fillText(L.bottom, 128, 200);
        }),
      });
      const side = toon({ color: col });
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.4, 1.7), [side, side, toon({ color: 0x1f2937 }), side, front, side]);
      body.position.y = 0.7;
      const lid = new THREE.Mesh(new THREE.BoxGeometry(1.86, 0.14, 1.86), toon({ color: col.clone().multiplyScalar(0.8) }));
      lid.position.y = 1.42;
      g.add(body, lid);
      g.position.set(binX(n), 0, BIN_Z);
      this.scene.add(g);
      this.bins[n] = { n, g, front, shake: 0, glow: 0, x: binX(n) };
    }
  }

  #buildUi() {
    this.hud = h('section', { id: 'sort-hud', class: 'card hidden' });
    this.help = h('section', { id: 'sort-help', class: 'card hidden' });
    this.tags = h('div', { id: 'sort-tags', class: 'hidden passthrough' });
    this.keys = h('div', { class: 'bin-keys hidden', role: 'group', 'aria-label': t('sort.title') });
    for (const n of BINS) {
      const L = binLabel(n);
      const b = button('', () => this.sendFront(n));
      b.innerHTML = `${L.top}<small>${L.bottom}</small>`;
      b.style.background = L.color;
      b.setAttribute('aria-label', `${n}: ${L.bottom}`);
      this.keys.append(b);
    }
    this.quitBtn = button(t('sort.quit'), () => this.finish(true), 'ghost small', 'Esc');
    this.result = h('div', { class: 'backdrop hidden' });
    uiRoot().append(this.hud, this.help, this.tags, this.keys, this.result);
  }

  // ---------- siklus ----------
  start(entries, sessions) {
    this.active = true;
    this.entries = entries;
    this.queue = [...entries].sort(() => Math.random() - 0.5);
    this.hint = HINTS[Math.min(sessions, HINTS.length - 1)];
    this.speed = this.hint === 'always' ? 1.1 : this.hint === 'hover' ? 1.4 : 1.7;
    this.gap = 2.4;
    Object.assign(this, { time: 0, nextSpawn: 0.6, ok: 0, bad: 0, combo: 0, drag: null, hover: null, done: false });
    for (const el of [this.hud, this.help, this.tags, this.keys]) el.classList.remove('hidden');
    this.help.innerHTML = '';
    this.help.append(t('sort.help'), h('br'), h('span', { class: 'note' }, t(`sort.hint${this.hint[0].toUpperCase()}${this.hint.slice(1)}`)));
    this.#hud();
    this.resize();
  }

  stop() {
    this.active = false;
    for (const it of this.items) { this.scene.remove(it.obj); it.tag.remove(); }
    this.items = [];
    for (const el of [this.hud, this.help, this.tags, this.keys, this.result]) el.classList.add('hidden');
  }

  // Berhenti di tengah: sampah yang belum dipilah tetap di keranjang.
  finish(quit = false) {
    if (this.done) return;
    this.done = true;
    const total = this.ok + this.bad;
    const acc = total ? this.ok / total : 0;
    const title = acc >= 0.9 ? t('sort.resultGreat') : acc >= 0.7 ? t('sort.resultGood') : t('sort.resultTry');
    const firstReward = !quit && total > 0 && this.game.quests.activeId === 'pilah';
    const starCount = total ? (acc >= 0.9 ? 3 : acc >= 0.7 ? 2 : 1) : 0;
    const star = (on) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9z" fill="${on ? '#f5b82e' : '#e7e2d4'}" stroke="#17324d" stroke-width="1.8" stroke-linejoin="round"/></svg>`;
    const panel = shell({
      id: 'sortres', title: total ? title : t('sort.title'), icon: 'recycle', accent: 'green', width: 'min(460px,94vw)',
      children: [
        total ? h('div', { class: 'stars', role: 'img', 'aria-label': `${starCount}/3`, html: [0, 1, 2].map((i) => star(i < starCount)).join('') }) : null,
        h('p', { class: 'center-text', style: 'font-size:20px;font-weight:700;margin:4px 0' }, t('sort.resultBody', { ok: this.ok, bad: this.bad })),
        quit && this.queue.length + this.items.length ? h('p', { class: 'note center-text' }, t('sort.quitNote')) : null,
        this.ok ? h('p', { class: 'center-text' }, t('sort.healthUp')) : null,
        firstReward ? h('p', { class: 'lesson center-text' }, t('sort.reward')) : null,
        h('div', { class: 'cta', style: 'justify-content:center' }, button(t('sort.back'), () => this.game.endSort({ completed: !quit && total > 0, accuracy: acc }), 'big')),
      ],
    });
    this.result.innerHTML = '';
    this.result.append(panel);
    this.result.classList.remove('hidden');
    panel.querySelector('.cta button').focus();
  }

  resize() {
    const asp = window.innerWidth / window.innerHeight;
    this.camera.aspect = asp;
    this.camera.updateProjectionMatrix();
    const d = Math.max(14, 20 / (2 * Math.tan(THREE.MathUtils.degToRad(20)) * asp));
    const target = new THREE.Vector3(0, 0.5, 1.9);
    this.camera.position.set(0, 0.66 * d, 0.76 * d).add(target);
    this.camera.lookAt(target);
  }

  // ---------- item ----------
  #spawn() {
    const e = this.queue.shift();
    const obj = makeItemModel(e.type.model, 0.62);
    obj.position.set(-BELT_HALF - 0.3, BELT_TOP, rnd(-0.25, 0.25));
    obj.rotation.y = rnd(-0.5, 0.5);
    this.scene.add(obj);
    const tag = h('div', { class: 'tag' }, e.name, h('span', { class: 'c' }));
    this.tags.append(tag);
    const bin = typeof e.code === 'number' ? e.code : ORGANIC_BIN;
    this.items.push({ e, bin, obj, tag, state: 'belt', vel: new THREE.Vector3(), t: 0, from: new THREE.Vector3(), target: null, life: 0, zBase: obj.position.z });
  }

  sendFront(n) {
    if (!this.active || this.done) return;
    const front = this.items.filter((i) => i.state === 'belt').sort((a, b) => b.obj.position.x - a.obj.position.x)[0];
    if (front) this.#send(front, this.bins[n]);
  }

  #send(it, bin) {
    it.state = 'fly';
    it.t = 0;
    it.target = bin;
    it.from.copy(it.obj.position);
    if (this.drag === it) this.drag = null;
  }

  #judge(it) {
    const g = this.game;
    const bin = it.target;
    const correct = bin.n === it.bin;
    g.inventory.sorted(it.e.gid, correct);
    if (correct) {
      this.ok += 1;
      this.combo += 1;
      bin.glow = 1;
      g.audio.ok();
      if (this.combo > 0 && this.combo % 5 === 0) g.toast(t('sort.combo', { n: this.combo }), 'ok', 1400);
      it.state = 'done';
    } else {
      this.bad += 1;
      this.combo = 0;
      bin.shake = 1;
      g.audio.bad();
      const kind = typeof it.e.code === 'number' ? t('sort.kindPlastic', { code: it.e.code, abbr: PLASTICS[it.e.code].abbr }) : t('sort.kindOrganic');
      g.toast(t('sort.wrongToast', { item: it.e.name, kind, bin: binLabel(bin.n).bottom }), 'bad', 4200);
      it.state = 'reject';
      it.vel.set(rnd(-2, 2), 6, 4);
      it.life = 0;
    }
    this.#hud();
  }

  #miss(it) {
    this.bad += 1;
    this.combo = 0;
    this.game.inventory.sorted(it.e.gid, false);
    this.game.audio.bad();
    this.game.toast(t('sort.missToast', { item: it.e.name }), 'bad', 2600);
    it.state = 'fall';
    it.vel.set(this.speed, 0, 0);
    this.#hud();
  }

  #hud() {
    const left = this.queue.length + this.items.filter((i) => i.state === 'belt' || i.state === 'drag').length;
    this.hud.innerHTML = '';
    this.hud.append(
      h('h3', {}, t('sort.title')),
      h('div', { class: 'kv' }, h('span', {}, t('sort.correct')), h('b', {}, this.ok)),
      h('div', { class: 'kv' }, h('span', {}, t('sort.wrong')), h('b', {}, this.bad)),
      h('div', { class: 'kv' }, h('span', {}, t('sort.left')), h('b', {}, left)),
      h('div', { style: 'margin-top:8px' }, this.quitBtn),
    );
  }

  // ---------- pointer ----------
  #bindPointer() {
    const cv = this.game.renderer.domElement;
    const ndc = (e) => new THREE.Vector2((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
    const ground = (e) => {
      this.ray.setFromCamera(ndc(e), this.camera);
      const p = new THREE.Vector3();
      return this.ray.ray.intersectPlane(this.dragPlane, p) ? p : null;
    };
    cv.addEventListener('pointerdown', (e) => {
      if (!this.active || this.done) return;
      const it = this.#nearest(e.clientX, e.clientY);
      if (it) {
        this.drag = it;
        it.state = 'drag';
        this.game.audio.pick();
      }
    });
    cv.addEventListener('pointermove', (e) => {
      if (!this.active) return;
      if (this.drag) {
        const p = ground(e);
        if (p) this.drag.obj.position.set(p.x, 1.3, THREE.MathUtils.clamp(p.z, -1, 6.5));
      } else {
        this.hover = this.#nearest(e.clientX, e.clientY);
        cv.style.cursor = this.hover ? 'grab' : '';
      }
    });
    const release = () => {
      if (!this.drag) return;
      const it = this.drag;
      this.drag = null;
      const b = this.#binAt(it.obj.position.x, it.obj.position.z);
      if (b) this.#send(it, b);
      else { it.state = 'belt'; it.zBase = rnd(-0.2, 0.2); }
    };
    cv.addEventListener('pointerup', release);
    cv.addEventListener('pointercancel', release);
  }

  #screen(v) {
    const p = v.clone().project(this.camera);
    return { x: (p.x * 0.5 + 0.5) * window.innerWidth, y: (-p.y * 0.5 + 0.5) * window.innerHeight };
  }

  #nearest(px, py, maxd = 80) {
    let best = null;
    let bd = maxd;
    for (const it of this.items) {
      if (it.state !== 'belt') continue;
      const s = this.#screen(it.obj.position.clone().setY(it.obj.position.y + 0.3));
      const d = Math.hypot(s.x - px, s.y - py);
      if (d < bd) { bd = d; best = it; }
    }
    return best;
  }

  #binAt(x, z) {
    return Object.values(this.bins).find((b) => Math.abs(x - b.x) < 1.1 && Math.abs(z - BIN_Z) < 1.9) ?? null;
  }

  // ---------- loop ----------
  update(dt) {
    if (!this.active) return;
    const inp = this.game.input;
    for (let n = 1; n <= 8; n++) if (inp.consume(`slot${n}`)) this.sendFront(n);
    if (inp.consume('pause') && !this.done) this.finish(true);
    if (this.done) return;
    this.time += dt;
    if (this.queue.length && this.time >= this.nextSpawn) {
      this.#spawn();
      this.nextSpawn = this.time + this.gap * rnd(0.85, 1.15);
      this.#hud();
    }
    for (const it of this.items) this.#step(it, dt);
    this.items = this.items.filter((i) => {
      if (i.state !== 'gone') return true;
      this.scene.remove(i.obj);
      i.tag.remove();
      return false;
    });
    for (const b of Object.values(this.bins)) {
      const over = this.drag && this.#binAt(this.drag.obj.position.x, this.drag.obj.position.z) === b;
      b.glow = Math.max(0, b.glow - dt * 2.5);
      const gl = Math.max(b.glow, over ? 0.5 : 0);
      b.front.emissive.setRGB(gl, gl, gl);
      b.shake = Math.max(0, b.shake - dt * 2.2);
      b.g.position.x = b.x + Math.sin(b.shake * 40) * 0.12 * b.shake;
    }
    this.beltTex.offset.x -= this.speed * dt;
    if (!this.queue.length && !this.items.length) this.finish();
  }

  #step(it, dt) {
    const o = it.obj;
    if (it.state === 'belt') {
      o.position.x += this.speed * dt;
      o.position.z += (it.zBase - o.position.z) * Math.min(1, dt * 8);
      o.position.y += (BELT_TOP - o.position.y) * Math.min(1, dt * 10);
      if (o.position.x > BELT_HALF - 0.2) this.#miss(it);
    } else if (it.state === 'fly') {
      it.t += dt / 0.3;
      const k = Math.min(1, it.t);
      const e = k * k * (3 - 2 * k);
      o.position.set(it.from.x + (it.target.x - it.from.x) * e, it.from.y + (2 - it.from.y) * e + Math.sin(k * Math.PI) * 1.2, it.from.z + (BIN_Z - it.from.z) * e);
      o.rotation.y += dt * 6;
      if (it.t >= 1) {
        this.#judge(it);
        if (it.state === 'done') it.state = 'gone';
      }
    } else if (it.state === 'reject' || it.state === 'fall') {
      it.vel.y -= 16 * dt;
      o.position.addScaledVector(it.vel, dt);
      o.rotation.x += dt * 3;
      it.life += dt;
      if (o.position.y < -3 || it.life > 2) it.state = 'gone';
    }
    const visible = it.state === 'belt' || it.state === 'drag';
    it.tag.style.display = visible ? '' : 'none';
    if (visible) {
      const s = this.#screen(o.position.clone().setY(o.position.y + 1.1));
      const show = this.hint === 'always' || (this.hint === 'hover' && (this.hover === it || this.drag === it));
      const c = it.tag.querySelector('.c');
      c.style.display = show ? '' : 'none';
      if (show) c.textContent = codeBadge(it.e.code).label === 'O' ? t('sort.kindOrganic') : `${it.e.code} ${PLASTICS[it.e.code].abbr}`;
      it.tag.style.transform = `translate(${s.x}px, ${s.y}px) translate(-50%, -100%)`;
    }
  }
}
