// State machine game: loading → menu → explore ⇄ dialog/codex/panel/minigame/timeGate/pause → ending.
export class StateMachine {
  constructor(states) {
    this.states = states;
    this.current = null;
    this.previous = null;
  }

  is(...names) { return names.includes(this.current); }

  set(name, payload) {
    if (!this.states[name]) throw new Error(`State tidak dikenal: ${name}`);
    const prev = this.current;
    this.states[prev]?.exit?.(name);
    this.previous = prev;
    this.current = name;
    this.states[name].enter?.(prev, payload);
  }

  update(dt) { this.states[this.current]?.update?.(dt); }
}
