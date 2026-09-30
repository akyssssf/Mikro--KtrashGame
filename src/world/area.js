// Kelas dasar area: antarmuka Area { build(), update(dt), onEnter(), onExit() }.
// Subkelas cukup mengisi buildContent() dan (opsional) update/onEnter/onExit.
import * as THREE from 'three';
import { CollisionWorld } from '../systems/collision.js';
import { Trash } from '../entities/trash.js';
import { PLASTICS } from '../data/plastics.js';
import { ITEM_TYPES } from '../data/items.js';
import { t } from '../data/dialogs.id.js';
import { buildIsland, roundedRectShape } from './diorama.js';
import { OCEAN_Y } from './ocean.js';
import { bake, canvasTexture, mesh, rng, toon } from './builders.js';
import { signpost } from './props.js';
import { SoilVisuals } from './soilVisuals.js';

export class Area {
  constructor(data, game) {
    this.data = data;
    this.id = data.id;
    this.game = game;
    this.root = new THREE.Group();
    this.root.name = `area:${data.id}`;
    this.props = new THREE.Group();
    this.collision = new CollisionWorld();
    this.interactables = [];
    this.trash = new Map();
    this.leaving = new Set();
    this.noGrass = [];
    this.buriedGroup = new THREE.Group();
    this.built = false;
    this.displayHealth = null;
    this.overrideHealth = null;
    this.rand = rng(data.order * 101 + 7);
  }

  get progress() { return this.game.progress; }

  gid(itemId) { return `${this.id}:${itemId}`; }

  build() {
    const { hw, hd, r } = this.data.size;
    this.island = buildIsland({ hw, hd, radius: r });
    this.root.add(this.island.group);
    this.root.add(shallows(hw, hd, r));
    this.collision.setBounds(hw - 0.3, hd - 0.3, r);
    this.root.add(this.props);
    this.buildContent();
    const mats = bake(this.props);
    this.visuals = new SoilVisuals({
      root: this.root,
      island: this.island,
      foliageMat: mats.foliage,
      hw, hd,
      seed: this.data.order * 13 + 3,
      exclude: (x, z) => this.excludes(x, z),
    });
    this.setupWater?.();
    this.root.add(this.buriedGroup);
    this.spawnTrash();
    this.refreshBuried();
    this.built = true;
  }

  // Diisi subkelas: properti (ke this.props), kolisi, interaksi.
  buildContent() {}

  excludes(x, z) {
    return this.noGrass.some((c) => (c.hw
      ? Math.abs(x - c.x) < c.hw && Math.abs(z - c.z) < c.hd
      : Math.hypot(x - c.x, z - c.z) < c.r));
  }

  // ---------- sampah ----------
  spawnTrash() {
    for (const it of this.data.items) {
      const gid = this.gid(it.id);
      if (this.progress.itemStatus(gid) !== 'dunia' || this.trash.has(gid)) continue;
      const trash = this.createTrash(it, gid);
      if (!trash) continue;
      this.root.add(trash.group);
      this.trash.set(gid, trash);
      this.addInteractable(this.trashInteractable(trash, it));
    }
  }

  createTrash(it, gid) {
    return new Trash({ gid, itemId: it.id, typeId: it.type, x: it.x, y: it.y ?? 0, z: it.z, rot: this.rand() * Math.PI * 2 });
  }

  trashInteractable(trash, it) {
    return {
      id: trash.gid,
      kind: 'trash',
      pickable: true,
      position: trash.position,
      height: trash.height + 0.3,
      range: 1.9,
      trash,
      enabled: () => !trash.gone && !trash.flying,
      prompt: () => this.trashPrompt(trash, it),
      action: () => this.onTrashAction(trash, it),
      highlight: (on) => trash.setHighlight(on),
    };
  }

  trashPrompt() {
    if (this.progress.basketFull) return { verb: t('prompts.full'), warn: true };
    return { verb: t('prompts.pick') };
  }

  onTrashAction(trash) { this.game.pickTrash(trash, this); }

  removeTrash(gid) {
    const trash = this.trash.get(gid);
    this.trash.delete(gid);
    if (trash) this.leaving.add(trash);
    this.interactables = this.interactables.filter((i) => i.id !== gid);
    if (this.game.areas.current === this) this.game.interaction.setList(this.interactables);
    return trash;
  }

  // ---------- interaksi ----------
  addInteractable(def) {
    this.interactables.push({ range: 2.2, height: 2, enabled: () => true, ...def });
    return def;
  }

  addPortal({ x, z, target, label, arrow = 0, rot = 0, locked = () => false, onUse }) {
    const sign = signpost(label, { arrow });
    sign.position.set(x, 0, z);
    sign.rotation.y = rot;
    this.props.add(sign);
    this.collision.addCircle(x, z, 0.3);
    const marker = mesh(new THREE.RingGeometry(0.7, 1, 24), new THREE.MeshBasicMaterial({ color: 0xf08a2c, transparent: true, opacity: 0.8, depthWrite: false }));
    marker.rotation.x = -Math.PI / 2;
    marker.position.set(x, 0.05, z + (rot === 0 ? 1.4 : 0));
    marker.castShadow = false;
    this.root.add(marker);
    this.addInteractable({
      id: `portal:${target}`,
      kind: 'portal',
      position: new THREE.Vector3(x, 0, z),
      height: 2.6,
      range: 2.6,
      prompt: () => (locked()
        ? { verb: t('prompts.locked'), warn: true }
        : { verb: t('prompts.go', { area: t(`areas.${target}.name`) }) }),
      action: () => {
        if (locked()) { this.game.toast(t('toast.areaLocked'), 'info'); return; }
        if (onUse) onUse(); else this.game.areas.go(target, { from: this.id });
      },
      update: (time) => { marker.material.opacity = locked() ? 0.25 : 0.55 + 0.3 * Math.sin(time * 3); },
    });
    return sign;
  }

  // Papan "segera hadir" untuk area yang belum dibangun.
  addFutureSign(x, z, code, rot = 0) {
    const sign = signpost(t(`areas.future.${code}`), { locked: true, width: 2.6 });
    sign.position.set(x, 0, z);
    sign.rotation.y = rot;
    this.props.add(sign);
    this.collision.addCircle(x, z, 0.3);
    this.addInteractable({
      id: `future:${code}`,
      kind: 'sign',
      position: new THREE.Vector3(x, 0, z),
      height: 2.6,
      range: 2.2,
      prompt: () => ({ verb: t('areas.comingSoon'), warn: true }),
      action: () => this.game.toast(t('toast.comingSoon'), 'info'),
    });
  }

  // ---------- sampah terkubur ----------
  refreshBuried() {
    this.buriedGroup.clear();
    for (const b of this.game.soil.buried(this.id)) {
      const pos = b.pos ?? { x: 0, z: 0 };
      const mound = mesh(new THREE.SphereGeometry(0.5, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2), moundMat, pos.x, 0, pos.z);
      mound.scale.set(1, 0.35, 1);
      const code = ITEM_TYPES[b.type].kode;
      const bit = mesh(new THREE.BoxGeometry(0.18, 0.28, 0.08), toon({ color: typeof code === 'number' ? PLASTICS[code].color : 0x4d7c0f }), pos.x + 0.1, 0.18, pos.z);
      bit.rotation.z = 0.5;
      const stain = mesh(new THREE.CircleGeometry(0.9, 16), stainMat, pos.x, 0.03, pos.z);
      stain.rotation.x = -Math.PI / 2;
      stain.castShadow = false;
      this.buriedGroup.add(stain, mound, bit);
    }
  }

  // ---------- kesehatan tanah ----------
  targetHealth() { return this.overrideHealth ?? this.game.soil.health(this.id); }

  updateHealth(dt, snap = false) {
    const target = this.targetHealth();
    if (this.displayHealth === null || snap) this.displayHealth = target;
    else this.displayHealth = target + (this.displayHealth - target) * Math.exp(-1.6 * dt);
    this.visuals.apply(this.displayHealth);
    return this.displayHealth;
  }

  // ---------- siklus hidup ----------
  onEnter() {}
  onExit() {}

  // Titik muncul saat datang dari area lain.
  arrivalFrom(fromId) {
    if (this.data.entry && fromId === 'hub') return this.data.entry;
    return this.data.spawn ?? { x: 0, z: 0 };
  }

  update(dt, time) {
    const reduced = this.game.reducedMotion;
    for (const tr of this.trash.values()) tr.update(dt, time);
    for (const tr of this.leaving) {
      tr.update(dt, time);
      if (tr.gone) this.leaving.delete(tr);
    }
    for (const i of this.interactables) i.update?.(time);
    this.visuals.update(dt, time, reduced);
  }
}

const moundMat = toon({ color: 0x6b5a45, roughness: 1, flatShading: true });
const stainMat = new THREE.MeshBasicMaterial({ color: 0x3a3428, transparent: true, opacity: 0.35, depthWrite: false });

// Air dangkal terang di sekitar pulau (seperti laguna).
function shallows(hw, hd, r) {
  const g = new THREE.ShapeGeometry(roundedRectShape(hw + 5, hd + 5, r + 5), 12);
  g.rotateX(-Math.PI / 2);
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: 0x7fe6f5, roughness: 0.3, transparent: true, opacity: 0.85, polygonOffset: true, polygonOffsetFactor: -2 }));
  m.position.y = OCEAN_Y + 0.04;
  m.receiveShadow = true;
  return m;
}

// Label kecil melayang (mis. nama tempat) sebagai sprite.
export function labelSprite(text, { bg = '#fff8e7', ink = '#17324d', scale = 1 } = {}) {
  const tex = canvasTexture(512, 128, (ctx, w, h) => {
    ctx.font = '800 64px "Baloo 2", ui-rounded, system-ui, sans-serif';
    const tw = Math.min(w - 24, ctx.measureText(text).width + 60);
    const x0 = (w - tw) / 2;
    ctx.fillStyle = bg;
    ctx.strokeStyle = ink;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.roundRect(x0, 14, tw, h - 28, 40);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = ink;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, w / 2, h / 2 + 4, w - 60);
  });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthWrite: false }));
  s.scale.set(4 * scale, 1 * scale, 1);
  return s;
}
