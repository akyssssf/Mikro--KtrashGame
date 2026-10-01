// Kartu Plastik: 7 kartu (terkunci = siluet), detail + model 3D kecil berputar + Fakta Lanjut.
import * as THREE from 'three';
import { PLASTIC_CODES, PLASTICS } from '../data/plastics.js';
import { ITEM_TYPES } from '../data/items.js';
import { t, TEXT } from '../data/dialogs.id.js';
import { makeItemModel } from '../world/items3d.js';
import { codeTriangle, h } from './dom.js';
import { Overlay, shell } from './panels.js';

const FOOD_CLASS = { ya: 'yes', sekali: 'mid', tidak: 'no' };

export class Codex {
  constructor(game) {
    this.game = game;
    this.overlay = new Overlay('codex');
    this.selected = null;
    this.preview = null;
  }

  get open() { return this.overlay.open; }

  show(code = null) {
    const cards = this.game.progress.data.cards;
    this.selected = code ?? this.selected ?? cards[cards.length - 1] ?? 1;
    this.#render();
  }

  hide() {
    this.overlay.hide();
    this.previewModel = null;
  }

  #render() {
    const prog = this.game.progress;
    const grid = h('div', { class: 'codex-grid', role: 'group', 'aria-label': t('plastics.title') });
    for (const code of PLASTIC_CODES) {
      const open = prog.hasCard(code);
      const p = PLASTICS[code];
      grid.append(h('button', {
        class: `codex-card ${open ? '' : 'locked'}`,
        type: 'button',
        'aria-pressed': String(code === this.selected),
        'aria-label': open ? `${code} ${p.abbr}` : `${code} ${t('plastics.locked')}`,
        onclick: () => { this.selected = code; this.#render(); },
        html: `${codeTriangle(code, p.color, !open)}<b>${open ? p.abbr : '???'}</b>`,
      }));
    }
    const detail = this.#detail(this.selected, prog.hasCard(this.selected));
    const panel = shell({
      id: 'codex', title: t('plastics.title'), icon: 'codex', accent: 'orange', onClose: () => this.game.closeCodex(),
      children: [
        h('p', { class: 'note', style: 'margin:0 0 4px' }, t('plastics.subtitle')),
        grid, detail,
        h('p', { class: 'note' }, t('plastics.note'), ' ', t('plastics.source')),
      ],
    });
    this.overlay.show(panel);
    panel.querySelector(`.codex-card[aria-pressed="true"]`)?.focus({ preventScroll: true });
    this.#mountPreview(panel.querySelector('.preview'), this.selected, prog.hasCard(this.selected));
  }

  #detail(code, open) {
    const p = PLASTICS[code];
    const tx = TEXT.plastics[code];
    const preview = h('div', { class: 'preview', 'aria-hidden': 'true' });
    if (!open) {
      return h('div', { class: 'codex-detail' }, preview,
        h('div', {}, h('h3', {}, `${code} · ???`), h('p', {}, t('plastics.lockedHint'))));
    }
    const L = TEXT.plastics.labels;
    return h('div', { class: 'codex-detail' }, preview,
      h('div', {},
        h('h3', { style: `color:${p.color}` }, `${code} · ${p.abbr}`),
        h('div', { class: 'full' }, tx.full),
        h('dl', { class: 'facts' },
          h('dt', {}, L.examples), h('dd', {}, tx.examples),
          h('dt', {}, L.food), h('dd', {}, h('span', { class: `pill ${FOOD_CLASS[p.foodSafe]}` }, tx.food)),
          h('dt', {}, L.reuse), h('dd', {}, tx.reuse),
          h('dt', {}, L.recycle), h('dd', {}, tx.recycle),
          h('dt', {}, L.decay), h('dd', {}, h('b', {}, t('plastics.decay', { D: p.D }))),
        ),
        h('details', { class: 'lanjut' }, h('summary', {}, t('plastics.advanced')), tx.advanced.map((f) => h('p', {}, f))),
      ),
    );
  }

  #mountPreview(container, code, open) {
    if (!container) return;
    if (!this.preview) {
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      const scene = new THREE.Scene();
      scene.add(new THREE.HemisphereLight(0xffffff, 0xcdbf9a, 1.6));
      const sun = new THREE.DirectionalLight(0xffffff, 1.8);
      sun.position.set(2, 4, 3);
      scene.add(sun);
      const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 20);
      camera.position.set(0, 0.7, 2.4);
      camera.lookAt(0, 0.28, 0);
      this.preview = { renderer, scene, camera, holder: new THREE.Group() };
      scene.add(this.preview.holder);
    }
    const { renderer, holder } = this.preview;
    container.append(renderer.domElement);
    const w = container.clientWidth || 240;
    const hgt = container.clientHeight || 240;
    renderer.setSize(w, hgt, false);
    this.preview.camera.aspect = w / hgt;
    this.preview.camera.updateProjectionMatrix();
    holder.clear();
    const typeId = Object.keys(ITEM_TYPES).find((k) => ITEM_TYPES[k].kode === code);
    if (!typeId) { this.previewModel = null; return; }
    const model = makeItemModel(ITEM_TYPES[typeId].model, 0.5);
    if (!open) {
      model.traverse((m) => {
        if (m.isMesh) m.material = new THREE.MeshBasicMaterial({ color: 0x9aa3ad });
      });
    }
    holder.add(model);
    this.previewModel = holder;
  }

  update(dt) {
    if (!this.open || !this.previewModel) return;
    this.previewModel.rotation.y += dt * (this.game.reducedMotion ? 0.3 : 1.1);
    const { renderer, scene, camera } = this.preview;
    renderer.render(scene, camera);
  }
}
