// Unified input: keyboard, on-screen touch pad and gamepads all feed the same
// virtual buttons: left, right, up, down, a (interact), b (menu/back).

const KEYMAP = {
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  KeyE: 'a', Space: 'a', Enter: 'a', KeyZ: 'a',
  Escape: 'b', KeyX: 'b', KeyP: 'b', KeyI: 'b', Backspace: 'b',
};

const KONAMI = ['up', 'up', 'down', 'down', 'left', 'right', 'left', 'right', 'b', 'a'];

export class Input {
  constructor() {
    this.held = new Set();
    this.sources = new Map(); // button -> Set of sources holding it
    this.queue = [];          // edge presses, consumed once per frame
    this.history = [];
    this.listeners = { press: [], konami: [] };
    this.enabled = true;

    addEventListener('keydown', (e) => {
      if (e.target instanceof HTMLInputElement) return;
      const btn = KEYMAP[e.code];
      if (!btn) { this.emit('key', e); return; }
      e.preventDefault();
      if (!e.repeat) this.down(btn, 'kb');
    });
    addEventListener('keyup', (e) => { const btn = KEYMAP[e.code]; if (btn) this.up(btn, 'kb'); });
    addEventListener('blur', () => { this.sources.clear(); this.held.clear(); });

    document.querySelectorAll('#pad [data-key]').forEach((el) => {
      const btn = el.dataset.key;
      const id = 'pad-' + btn;
      const on = (e) => { e.preventDefault(); el.setPointerCapture?.(e.pointerId); el.classList.add('on'); this.down(btn, id); navigator.vibrate?.(8); };
      const off = (e) => { e.preventDefault(); el.classList.remove('on'); this.up(btn, id); };
      el.addEventListener('pointerdown', on);
      el.addEventListener('pointerup', off);
      el.addEventListener('pointercancel', off);
      el.addEventListener('lostpointercapture', off);
      el.addEventListener('contextmenu', (e) => e.preventDefault());
    });

    this.padPrev = {};
  }

  on(evt, fn) { (this.listeners[evt] ||= []).push(fn); }
  emit(evt, v) { (this.listeners[evt] || []).forEach((fn) => fn(v)); }

  down(btn, src) {
    let s = this.sources.get(btn);
    if (!s) this.sources.set(btn, s = new Set());
    const was = s.size > 0;
    s.add(src);
    this.held.add(btn);
    if (!was) {
      this.queue.push(btn);
      this.emit('press', btn);
      this.history = [...this.history, btn].slice(-KONAMI.length);
      if (this.history.join() === KONAMI.join()) { this.history = []; this.emit('konami'); }
    }
  }
  up(btn, src) {
    const s = this.sources.get(btn);
    if (!s) return;
    s.delete(src);
    if (s.size === 0) this.held.delete(btn);
  }

  isHeld(btn) { return this.enabled && this.held.has(btn); }
  take() { const q = this.queue; this.queue = []; return this.enabled ? q : []; }

  pollGamepads() {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const gp of pads) {
      if (!gp) continue;
      const ax = gp.axes[0] || 0, ay = gp.axes[1] || 0;
      const st = {
        left: ax < -0.5 || gp.buttons[14]?.pressed,
        right: ax > 0.5 || gp.buttons[15]?.pressed,
        up: ay < -0.5 || gp.buttons[12]?.pressed,
        down: ay > 0.5 || gp.buttons[13]?.pressed,
        a: gp.buttons[0]?.pressed,
        b: gp.buttons[1]?.pressed || gp.buttons[9]?.pressed,
      };
      const id = 'gp' + gp.index;
      for (const [btn, v] of Object.entries(st)) {
        const key = id + btn;
        if (v && !this.padPrev[key]) this.down(btn, id);
        if (!v && this.padPrev[key]) this.up(btn, id);
        this.padPrev[key] = !!v;
      }
    }
  }
}
