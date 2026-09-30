import './style.css';
import * as THREE from 'three';
import { createRenderContext } from './core/renderer.js';
import { InputManager } from './core/input.js';
import { CameraRig } from './core/camera.js';
import { StateMachine } from './core/state.js';
import { Progress } from './core/progress.js';
import { Audio } from './core/audio.js';
import { loadPrefs, savePrefs } from './core/save.js';
import { Player } from './entities/player.js';
import { Cing } from './entities/cing.js';
import { createSky } from './world/sky.js';
import { AreaManager } from './world/areaManager.js';
import { AREA_IDS } from './world/areaRegistry.js';
import { Interaction } from './systems/interaction.js';
import { Quests } from './systems/quests.js';
import { Inventory } from './systems/inventory.js';
import { SoilState } from './systems/soilState.js';
import { Effects } from './systems/effects.js';
import { moodOf } from './systems/soilHealth.js';
import { Hud } from './ui/hud.js';
import { DialogBox } from './ui/dialog.js';
import { Codex } from './ui/codex.js';
import { TimeUI } from './ui/timeUI.js';
import { SoilSection } from './world/soilSection.js';
import { anyMicro, captionFor, microLabel, rowsFor, villageAt } from './systems/projection.js';
import { simulate } from './systems/timeSim.js';
import { areaDamage } from './systems/soilHealth.js';
import { basketPanel, menuPanel, Overlay, pausePanel, recyclePanel } from './ui/panels.js';
import { h } from './ui/dom.js';
import { t, TEXT } from './data/dialogs.id.js';

class Game {
  constructor() {
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ctx = createRenderContext(document.getElementById('app'));
    Object.assign(this, ctx);
    this.renderer.info.autoReset = false;
    this.input = new InputManager(this.renderer.domElement);
    this.rig = new CameraRig(this.camera);
    this.sky = createSky(this.scene);
    this.prefs = loadPrefs();
    this.audio = new Audio(!!this.prefs.muted);
    this.progress = new Progress();
    this.soil = new SoilState(this.progress);
    this.quests = new Quests(this);
    this.inventory = new Inventory(this);
    this.effects = new Effects(this.scene);
    this.effects.reducedMotion = this.reducedMotion;
    this.interaction = new Interaction(this);
    this.areas = new AreaManager(this);

    this.player = new Player();
    this.player.reducedMotion = this.reducedMotion;
    this.cing = new Cing();
    this.cing.reducedMotion = this.reducedMotion;
    this.scene.add(this.player.group, this.cing.group);
    this.interaction.global = [this.#cingInteractable()];

    this.ui = {
      hud: new Hud(this),
      dialog: new DialogBox(this),
      codex: new Codex(this),
      time: new TimeUI(this),
      overlay: new Overlay('panel'),
      menu: new Overlay('menu-wrap'),
    };
    this.ui.prompt = this.ui.hud.prompt;
    this.ui.fade = (on) => this.ui.hud.fade(on);
    this.ui.banner = (id) => this.ui.hud.banner(id);
    this.ui.clickMarker = (x, z) => this.effects.clickMarker(x, z);

    this.dialogQueue = [];
    this.villageDisplay = null;
    this.showFps = new URLSearchParams(location.search).has('fps');
    this.fps = { frames: 0, time: 0, value: 0 };
    this.fsm = new StateMachine(this.#states());

    this.progress.on('change', (e) => this.#onProgress(e));
    this.input.on('tap', ({ x, y }) => {
      this.audio.unlock();
      if (this.fsm.is('explore')) this.interaction.handleTap(x, y);
    });
    window.addEventListener('pointerdown', () => this.audio.unlock(), { once: true });
    window.addEventListener('keydown', () => this.audio.unlock(), { once: true });
    window.addEventListener('beforeunload', () => this.progress.flush());
  }

  // ---------------- states ----------------
  #states() {
    return {
      loading: {},
      menu: {
        enter: () => {
          this.ui.hud.setVisible(false);
          this.player.group.visible = false;
          this.cing.group.visible = false;
          this.ui.menu.show(menuPanel({
            hasSave: this.hasSave,
            onContinue: () => this.#startGame(false),
            onNew: () => this.#startGame(true),
            onCodex: () => this.openCodex(),
          }));
        },
        exit: (next) => { if (next !== 'codex') this.ui.menu.hide(); },
        update: () => {
          this.rig.setOverride({ focus: new THREE.Vector3(0, 0, 0), distance: 46, pitch: 0.62, yaw: this.time * 0.05, smoothing: 2 });
        },
      },
      explore: {
        enter: () => {
          this.ui.hud.setVisible(true);
          this.rig.clearOverride();
          this.player.group.visible = true;
          this.cing.group.visible = true;
          this.renderer.domElement.focus({ preventScroll: true });
        },
        exit: () => this.ui.prompt.hide(),
        update: (dt) => this.#updateExplore(dt),
      },
      dialog: {
        enter: (prev, { lines, vars, onDone }) => {
          this.ui.prompt.hide();
          this.ui.dialog.start(lines, vars, () => {
            this.fsm.set('explore');
            onDone?.();
          });
        },
        update: (dt) => {
          this.ui.dialog.update(dt);
          if (this.input.consume('interact')) this.ui.dialog.advance();
          if (this.input.consume('pause')) this.ui.dialog.finish();
        },
      },
      panel: {
        enter: (prev, { content }) => this.ui.overlay.show(content),
        exit: () => this.ui.overlay.hide(),
        update: () => {
          if (this.input.consume('pause') || this.input.consume('inventory')) this.fsm.set('explore');
        },
      },
      codex: {
        enter: (prev) => {
          this.codexReturn = prev === 'codex' ? this.codexReturn : prev;
          this.ui.codex.show();
        },
        exit: () => this.ui.codex.hide(),
        update: (dt) => {
          this.ui.codex.update(dt);
          if (this.input.consume('pause') || this.input.consume('codex')) this.closeCodex();
        },
      },
      timeGate: {
        enter: (prev, { opts, pose, onExit }) => {
          this.ui.hud.setVisible(false);
          this.timeExit = onExit;
          this.rig.setOverride({ smoothing: 2.5, ...pose });
          this.ui.time.start(opts);
        },
        exit: () => {
          this.ui.time.close();
          this.rig.clearOverride();
          this.timeExit?.();
          this.timeExit = null;
        },
        update: (dt) => {
          this.ui.time.update(dt);
          if (this.input.consume('pause')) this.ui.time.finish();
          else if (this.input.consume('interact')) this.ui.time.togglePlay();
        },
      },
      pause: {
        enter: () => this.#showPause(),
        exit: () => this.ui.overlay.hide(),
        update: () => { if (this.input.consume('pause')) this.fsm.set('explore'); },
      },
    };
  }

  #showPause() {
    this.ui.overlay.show(pausePanel({
      muted: this.audio.muted,
      saveOk: this.progress.saveOk,
      onResume: () => this.fsm.set('explore'),
      onCodex: () => this.openCodex(),
      onMute: () => { this.toggleMute(); this.#showPause(); },
      onMenu: () => {
        this.progress.flush();
        this.resumeArea = this.progress.data.area;
        this.fsm.set('menu');
      },
    }));
  }

  // ---------------- alur ----------------
  async boot() {
    const loading = h('div', { id: 'loading' }, t('game.loading'));
    document.body.append(loading);
    this.fsm.set('loading');
    try {
      await Promise.race([document.fonts.load('800 58px "Baloo 2"'), new Promise((r) => setTimeout(r, 2000))]);
    } catch { /* font opsional */ }
    this.hasSave = this.progress.load();
    this.resumeArea = this.progress.data.area;
    this.areas.enter('hub');
    this.#placeCing();
    this.ui.hud.refresh();
    loading.remove();
    this.last = performance.now();
    this.time = 0;
    requestAnimationFrame((n) => this.#frame(n));
    this.fsm.set('menu');
  }

  #startGame(fresh) {
    this.audio.unlock();
    this.hasSave = true;
    this.progress.active = true;
    if (fresh) {
      this.progress.reset();
      this.areas.reset();
    }
    const areaId = fresh ? 'hub' : this.resumeArea ?? 'hub';
    this.areas.enter(areaId, areaId === 'hub' ? null : 'hub');
    this.#placeCing();
    this.ui.hud.refresh();
    this.fsm.set('explore');
    this.ui.banner(areaId);
    if (!this.progress.flag('talked_cing')) this.toast(t('toast.findCing'), 'info', 4000);
  }

  #placeCing() {
    const following = this.progress.flag('talked_cing');
    this.cing.following = following;
    if (!following && this.areas.current?.id === 'hub') {
      const c = this.areas.current.data.cing;
      this.cing.position.set(c.x, 0, c.z);
      this.cing.heading = Math.PI * 0.8;
    }
  }

  #cingInteractable() {
    return {
      id: 'cing',
      kind: 'npc',
      position: this.cing.position,
      height: 1.9,
      range: 2.4,
      enabled: () => this.cing.group.visible,
      prompt: () => ({ verb: t('prompts.talk') }),
      action: () => {
        if (!this.progress.flag('talked_cing')) {
          this.say('cingWaiting', {}, () => {
            this.progress.setFlag('talked_cing');
            this.cing.following = true;
          });
        } else {
          this.sayLines(TEXT.dialogs.cingIdle[this.quests.activeId]);
        }
      },
    };
  }

  // ---------------- API untuk area & UI ----------------
  say(key, vars = {}, onDone) { this.sayLines(TEXT.dialogs[key], vars, onDone); }

  sayLines(lines, vars = {}, onDone) {
    if (!lines?.length) { onDone?.(); return; }
    if (!this.fsm.is('explore')) {
      this.dialogQueue.push({ lines, vars, onDone });
      return;
    }
    this.fsm.set('dialog', { lines, vars, onDone });
  }

  toast(msg, kind, ms) { this.ui.hud.toast(msg, kind, ms); }

  pickTrash(trash, area) { this.inventory.pick(trash, area); }

  giveTool(tool) {
    if (!this.progress.giveTool(tool)) return;
    this.audio.tool();
    this.effects.confetti(this.player.position);
    const special = { jaring: 'toast.netGot', lensa: 'toast.lensGot', pencapit: 'toast.grabberGot' }[tool];
    if (tool === 'tasKain') this.toast(t('toast.bagGot', { max: this.progress.capacity }), 'ok', 4000);
    else this.toast(special ? t(special) : t('toast.newTool', { tool: t(`tools.${tool}`) }), 'ok', 4000);
  }

  openCodex() {
    this.audio.unlock();
    this.fsm.set('codex');
  }

  closeCodex() {
    const back = this.codexReturn;
    if (back === 'menu') this.fsm.set('menu');
    else if (back === 'pause') this.fsm.set('pause');
    else this.fsm.set('explore');
  }

  openBasket() {
    if (!this.fsm.is('explore') && !this.fsm.is('panel')) return;
    const render = () => basketPanel({
      items: this.inventory.items(),
      capacity: this.progress.capacity,
      onDump: (gid) => { this.inventory.dump(gid); this.fsm.set('explore'); },
      onClose: () => this.fsm.set('explore'),
    });
    this.fsm.set('panel', { content: render() });
  }

  openRecycle() {
    const render = () => recyclePanel({
      items: this.inventory.items(),
      onReuse: (gid) => { this.inventory.reuse(gid); this.ui.overlay.show(render()); },
      onSort: () => this.startSort(),
      onClose: () => this.fsm.set('explore'),
    });
    this.fsm.set('panel', { content: render() });
    if (!this.progress.flag('recycleIntro')) {
      this.progress.setFlag('recycleIntro');
      this.dialogQueue.push({ lines: TEXT.dialogs.recycleIntro, vars: {} });
    }
  }

  pause() { if (this.fsm.is('explore')) this.fsm.set('pause'); }

  // Gerbang Waktu (global): proyeksi desa. Dunia asli dikembalikan saat ditutup.
  openTimeGate() {
    if (!this.progress.flag('gateIntro')) {
      this.progress.setFlag('gateIntro');
      this.say('gateIntro', {}, () => this.openTimeGate());
      return;
    }
    const hub = this.areas.current;
    const all = AREA_IDS.flatMap((id) => this.soil.projectionEntries(id));
    this.section ??= new SoilSection();
    this.section.setEntries([...all].sort((a, b) => Number(b.buried) - Number(a.buried)));
    let explained = this.progress.flag('microExplained');
    const opts = {
      title: t('time.gateTitle'),
      note: t('time.gateNote'),
      maxYears: 1000,
      jumps: [1, 10, 50, 100, 500, 1000],
      inset: true,
      playSeconds: 22,
      onTime: (years) => {
        const v = villageAt(this.soil, years);
        hub.overrideHealth = v.health;
        hub.visuals.setMicro(v.micro / 8);
        this.section.apply(years, v.health);
        let note = null;
        if (!explained && anyMicro(all, years)) {
          explained = true;
          this.progress.setFlag('microExplained');
        }
        if (explained && anyMicro(all, years)) note = t('time.microExplain');
        return { health: v.health, micro: microLabel(v.micro), rows: rowsFor(all, years), caption: captionFor(all, years), note };
      },
      onClose: () => this.fsm.set('explore'),
    };
    this.fsm.set('timeGate', {
      opts,
      pose: { focus: new THREE.Vector3(0, 0, -1), distance: 50, pitch: 0.95 },
      onExit: () => {
        hub.overrideHealth = null;
        hub.visuals.setMicro(0);
      },
    });
  }

  // Lensa Waktu (lokal): memajukan waktu sungguhan di lingkaran kecil. targets: [{ typeId, D, organic, apply(years) }]
  openLens(area, lens, targets, onClose) {
    const entries = targets.map((x) => ({ ...x, type: x.typeId, w: x.organic ? 0 : x.w, key: x.key, code: x.code }));
    const base = areaDamage(this.soil.areaInput(area.id));
    lens.setActive(true);
    this.audio.whoosh();
    const opts = {
      title: t('time.lensTitle'),
      note: t('time.lensNote'),
      maxYears: 50,
      jumps: [1 / 12, 0.5, 1, 10, 50],
      inset: false,
      playSeconds: 10,
      closeLabel: t('time.done'),
      onTime: (years) => {
        for (const x of targets) x.apply(years);
        const sim = simulate(entries, years, { baseDamage: base });
        return { health: sim.health, micro: microLabel(sim.micro), rows: rowsFor(entries, years), caption: captionFor(entries, years, 'time.lensCaptionStart') };
      },
      onClose: (reached) => {
        this.fsm.set('explore');
        onClose?.(reached);
      },
    };
    this.fsm.set('timeGate', {
      opts,
      pose: { focus: lens.center.clone(), distance: 13, pitch: 0.95 },
      onExit: () => lens.setActive(false),
    });
    if (!this.progress.flag('lensIntro')) {
      this.progress.setFlag('lensIntro');
      this.toast(t('toast.lensIntro'), 'info', 4000);
    }
  }

  toggleMute() {
    this.audio.setMuted(!this.audio.muted);
    this.prefs.muted = this.audio.muted;
    savePrefs(this.prefs);
    this.toast(this.audio.muted ? t('toast.muted') : t('toast.unmuted'), 'info', 1200);
    this.ui.hud.refresh();
  }

  onAreaEntered(id) {
    this.#placeCing();
    const key = `enter_${id}`;
    if (TEXT.dialogs[key] && !this.progress.flag(`seen_${key}`)) {
      this.progress.setFlag(`seen_${key}`);
      this.say(key);
    }
  }

  #onProgress(e) {
    if (e.kind === 'reset' || e.kind === 'load') return;
    const done = this.quests.check();
    if (done) {
      this.audio.card();
      this.effects.confetti(this.player.position);
      const key = `done_${done}`;
      if (TEXT.dialogs[key]) this.dialogQueue.push({ lines: TEXT.dialogs[key], vars: {} });
    }
    this.player.setTools(this.progress.data.tools);
    this.player.setBasketLevel(this.progress.basket.length, this.progress.capacity);
    this.ui.hud.refresh();
  }

  // ---------------- loop ----------------
  #updateExplore(dt) {
    const inp = this.input;
    if (inp.consume('pause')) { this.pause(); return; }
    if (inp.consume('codex')) { this.openCodex(); return; }
    if (inp.consume('inventory')) { this.openBasket(); return; }
    if (inp.consume('rotateLeft')) this.rig.rotate(-1);
    if (inp.consume('rotateRight')) this.rig.rotate(1);
    if (this.dialogQueue.length && !this.areas.busy) {
      const d = this.dialogQueue.shift();
      this.fsm.set('dialog', d);
      return;
    }
    this.player.update(dt, inp, this.rig, this.collision, !this.areas.busy);
    this.rig.follow(this.player.position);
    this.interaction.update(!this.areas.busy);
    if (inp.consume('interact')) this.interaction.interact();
  }

  #frame(now) {
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    this.time += dt;
    const inp = this.input;
    if (inp.consume('mute')) this.toggleMute();
    if (inp.consume('fps')) this.showFps = !this.showFps;

    this.fsm.update(dt);
    if (!this.fsm.is('explore')) this.player.update(dt, inp, this.rig, this.collision, false);

    const area = this.areas.current;
    if (area) {
      area.update(dt, this.time);
      const ah = area.updateHealth(dt);
      const vTarget = this.soil.village();
      this.villageDisplay = this.villageDisplay === null ? vTarget : vTarget + (this.villageDisplay - vTarget) * Math.exp(-1.6 * dt);
      this.ui.hud.setHealth(area.id, ah, this.villageDisplay);
      this.cing.setHealth(ah);
      this.cing.setMood(moodOf(ah));
    }
    this.cing.setAlert(!this.progress.flag('talked_cing') || this.dialogQueue.length > 0);
    this.cing.update(dt, this.time, this.player);
    this.effects.update(dt);
    this.sky.update(dt);
    this.rig.update(dt);
    this.followShadow(this.rig.focus);

    this.renderer.info.reset();
    this.renderer.render(this.scene, this.camera);
    if (this.fsm.is('timeGate') && this.ui.time.opts?.inset && this.section) {
      this.section.render(this.renderer, this.ui.time.inset.getBoundingClientRect(), this.time);
    }
    this.#fpsTick(dt);
    inp.endFrame();
    requestAnimationFrame((n) => this.#frame(n));
  }

  #fpsTick(dt) {
    const f = this.fps;
    f.frames += 1;
    f.time += dt;
    if (f.time >= 0.5) {
      f.value = f.frames / f.time;
      f.frames = 0;
      f.time = 0;
      if (this.showFps) this.ui.hud.setFps(t('hud.fps', { fps: f.value.toFixed(0), calls: this.renderer.info.render.calls }));
      else this.ui.hud.hideFps();
    }
  }
}

const game = new Game();
game.boot();
if (import.meta.env.DEV) window.__game = game;
