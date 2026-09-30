// Memuat/mengganti area dengan transisi fade. Area dibangun sekali lalu disimpan.
import { AREA_DATA } from './areaRegistry.js';

const areaModules = import.meta.glob('./areas/*.js', { eager: true });
const AREA_CLASSES = Object.fromEntries(
  Object.entries(areaModules).map(([path, m]) => [path.match(/\/(\w+)\.js$/)[1], m.default]),
);

export class AreaManager {
  constructor(game) {
    this.game = game;
    this.areas = {};
    this.current = null;
    this.busy = false;
  }

  get(id) {
    if (!this.areas[id]) {
      const Cls = AREA_CLASSES[id];
      if (!Cls) throw new Error(`Area tanpa kelas: ${id}`);
      const area = new Cls(AREA_DATA[id], this.game);
      area.build();
      this.areas[id] = area;
    }
    return this.areas[id];
  }

  // Buang semua area yang sudah dibangun (main baru).
  reset() {
    for (const area of Object.values(this.areas)) {
      area.root.removeFromParent();
      area.root.traverse((o) => {
        o.geometry?.dispose();
        for (const m of [o.material].flat()) { m?.map?.dispose(); m?.dispose?.(); }
      });
    }
    this.areas = {};
    this.current = null;
  }

  // Pasang area tanpa animasi (dipakai saat memuat game).
  enter(id, from = null, at = null) {
    const g = this.game;
    if (this.current) {
      this.current.onExit();
      g.scene.remove(this.current.root);
    }
    const area = this.get(id);
    this.current = area;
    g.scene.add(area.root);
    g.collision = area.collision;
    g.interaction.setList(area.interactables);
    const spot = at ?? area.arrivalFrom(from);
    g.player.position.set(spot.x, 0, spot.z);
    g.player.velocity.set(0, 0, 0);
    g.player.cancelWalk();
    if (from) g.player.heading = Math.atan2(-spot.x, -spot.z);
    g.cing.position.set(spot.x + 1.2, 0, spot.z + 1.4);
    g.rig.follow(g.player.position);
    g.rig.snap();
    area.updateHealth(0, true);
    g.progress.setArea(id);
    area.onEnter(from);
  }

  async go(id, { from = this.current?.id } = {}) {
    if (this.busy) return;
    this.busy = true;
    const g = this.game;
    g.audio.whoosh();
    await g.ui.fade(true);
    this.enter(id, from);
    g.ui.banner(id);
    await g.ui.fade(false);
    this.busy = false;
    g.onAreaEntered(id, from);
  }
}
