import * as THREE from 'three';

const DEG = Math.PI / 180;

// Kamera orang ketiga miring ~52°, tidak bisa diputar bebas; hanya snap 90°.
export class CameraRig {
  constructor(camera) {
    this.camera = camera;
    this.pitch = 52 * DEG;
    this.distance = 19;
    this.yawStep = 0;
    this.yaw = 0;
    this.focus = new THREE.Vector3();
    this.goalFocus = new THREE.Vector3();
    this.override = null;
    this.smoothing = 5;
  }

  get goalYaw() { return this.yawStep * (Math.PI / 2); }

  rotate(dir) { this.yawStep += dir; }

  follow(position) { this.goalFocus.set(position.x, position.y + 0.6, position.z); }

  // Pose khusus (Gerbang Waktu, menu, lensa): { focus, distance, pitch, yaw }
  setOverride(pose) { this.override = pose; }

  clearOverride() { this.override = null; }

  snap() {
    this.focus.copy(this.goalFocus);
    this.yaw = this.goalYaw;
    this.#apply(this.#currentPose(1));
  }

  // Arah gerak relatif kamera untuk sumbu input (x kanan, y maju).
  toWorldDir(ax, ay, out = new THREE.Vector3()) {
    const s = Math.sin(this.yaw);
    const c = Math.cos(this.yaw);
    out.set(ax * c - ay * s, 0, -ax * s - ay * c);
    return out;
  }

  #currentPose(k) {
    const o = this.override;
    const goalFocus = o?.focus ?? this.goalFocus;
    this.focus.lerp(goalFocus, k);
    const goalYaw = o?.yaw ?? this.goalYaw;
    this.yaw += (goalYaw - this.yaw) * k;
    this._dist = (this._dist ?? this.distance) + ((o?.distance ?? this.distance) - (this._dist ?? this.distance)) * k;
    this._pitch = (this._pitch ?? this.pitch) + ((o?.pitch ?? this.pitch) - (this._pitch ?? this.pitch)) * k;
    return { focus: this.focus, yaw: this.yaw, distance: this._dist, pitch: this._pitch };
  }

  #apply({ focus, yaw, distance, pitch }) {
    const h = Math.cos(pitch) * distance;
    this.camera.position.set(
      focus.x + Math.sin(yaw) * h,
      focus.y + Math.sin(pitch) * distance,
      focus.z + Math.cos(yaw) * h,
    );
    this.camera.lookAt(focus);
  }

  update(dt) {
    const rate = this.override?.smoothing ?? this.smoothing;
    const k = 1 - Math.exp(-dt * rate);
    this.#apply(this.#currentPose(k));
  }
}
