import * as THREE from 'three';

const DEG = Math.PI / 180;
const MIN_PITCH = 8 * DEG;
const MAX_PITCH = 62 * DEG;
const MIN_DIST = 5;
const MAX_DIST = 15;
const IDLE_BEFORE_RECENTER = 1.6;

// Kamera RPG orang ketiga: rendah di belakang pemain, horizon terlihat.
// Diputar dengan seret mouse / Q-R, zoom dengan roda, dan pelan-pelan kembali ke belakang pemain saat berjalan.
export class CameraRig {
  constructor(camera) {
    this.camera = camera;
    this.pitch = 22 * DEG;
    this.distance = 9;
    this.yaw = 0;
    this.goalYaw = 0;
    this.goalPitch = this.pitch;
    this.goalDistance = this.distance;
    this.focus = new THREE.Vector3();
    this.goalFocus = new THREE.Vector3();
    this.override = null;
    this.smoothing = 6;
    this.idle = IDLE_BEFORE_RECENTER;
    this.heading = 0;
    this.speed = 0;
  }

  // Putar tetap 45° (tombol Q/R).
  rotate(dir) {
    this.goalYaw += dir * (Math.PI / 4);
    this.idle = 0;
  }

  // Seret mouse: dx/dy dalam piksel.
  drag(dx, dy) {
    this.goalYaw -= dx * 0.006;
    this.goalPitch = THREE.MathUtils.clamp(this.goalPitch + dy * 0.004, MIN_PITCH, MAX_PITCH);
    this.idle = 0;
  }

  zoom(delta) {
    this.goalDistance = THREE.MathUtils.clamp(this.goalDistance * (1 + delta * 0.001), MIN_DIST, MAX_DIST);
  }

  follow(position, heading = this.heading, speed = 0) {
    this.goalFocus.set(position.x, position.y + 1.3, position.z);
    this.heading = heading;
    this.speed = speed;
  }

  // Pose khusus (Gerbang Waktu, menu, lensa): { focus, distance, pitch, yaw, smoothing }
  setOverride(pose) { this.override = pose; }

  clearOverride() {
    this.override = null;
    this.idle = 0;
  }

  // Letakkan kamera langsung di belakang pemain (saat pindah area).
  snap() {
    this.goalYaw = this.heading + Math.PI;
    this.yaw = this.goalYaw;
    this.pitch = this.goalPitch;
    this.distance = this.goalDistance;
    this.focus.copy(this.goalFocus);
    this.#apply(this.focus, this.yaw, this.distance, this.pitch);
  }

  // Arah gerak relatif kamera untuk sumbu input (x kanan, y maju).
  toWorldDir(ax, ay, out = new THREE.Vector3()) {
    const s = Math.sin(this.yaw);
    const c = Math.cos(this.yaw);
    out.set(ax * c - ay * s, 0, -ax * s - ay * c);
    return out;
  }

  #apply(focus, yaw, distance, pitch) {
    const h = Math.cos(pitch) * distance;
    this.camera.position.set(focus.x + Math.sin(yaw) * h, focus.y + Math.sin(pitch) * distance, focus.z + Math.cos(yaw) * h);
    // Jangan menembus tanah.
    this.camera.position.y = Math.max(0.6, this.camera.position.y);
    this.camera.lookAt(focus.x, focus.y + (this.override ? 0 : 0.4), focus.z);
  }

  update(dt) {
    const o = this.override;
    const k = 1 - Math.exp(-dt * (o?.smoothing ?? this.smoothing));
    if (!o) {
      // Kembali pelan ke belakang pemain setelah beberapa saat tanpa memutar kamera.
      this.idle += dt;
      if (this.idle > IDLE_BEFORE_RECENTER && this.speed > 1) {
        const behind = this.heading + Math.PI;
        const diff = Math.atan2(Math.sin(behind - this.goalYaw), Math.cos(behind - this.goalYaw));
        this.goalYaw += diff * Math.min(1, dt * 0.9);
      }
    }
    const goalYaw = o?.yaw ?? this.goalYaw;
    this.focus.lerp(o?.focus ?? this.goalFocus, k);
    this.yaw += (goalYaw - this.yaw) * k;
    this.pitch += ((o?.pitch ?? this.goalPitch) - this.pitch) * k;
    this.distance += ((o?.distance ?? this.goalDistance) - this.distance) * k;
    if (o?.yaw !== undefined) this.goalYaw = this.yaw;
    this.#apply(this.focus, this.yaw, this.distance, this.pitch);
  }
}
