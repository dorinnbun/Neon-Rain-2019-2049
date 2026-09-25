// All sound is synthesised live with the Web Audio API — no audio files to host.
// Music is a small generative "analog synth" score: detuned saw pads, brass swells,
// glassy bells and a sub drone, drenched in a long synthetic reverb.

const NOTE = (n) => 440 * Math.pow(2, (n - 69) / 12);

const MOODS = {
  // chords as MIDI notes; each lasts `bar` seconds
  city:   { bar: 8, chords: [[38, 50, 57, 62, 65], [34, 46, 53, 58, 62], [36, 48, 55, 60, 64], [33, 45, 52, 57, 61]], bells: [74, 77, 79, 81, 84, 86], brass: true, cutoff: 1400 },
  noir:   { bar: 9, chords: [[40, 52, 59, 62, 67], [36, 48, 55, 59, 64], [38, 50, 57, 60, 65], [35, 47, 54, 57, 62]], bells: [71, 74, 76, 79, 83], brass: false, cutoff: 900 },
  love:   { bar: 10, chords: [[41, 53, 60, 64, 69], [38, 50, 57, 62, 65], [34, 46, 53, 58, 62], [36, 48, 55, 60, 67]], bells: [72, 76, 77, 79, 84], brass: false, cutoff: 1100 },
  tense:  { bar: 6, chords: [[37, 49, 56, 61], [37, 49, 55, 60], [36, 48, 55, 58], [37, 49, 56, 62]], bells: [73, 76, 80, 85], brass: false, cutoff: 650, pulse: true },
  finale: { bar: 8, chords: [[38, 50, 57, 62, 69], [41, 53, 60, 65, 72], [34, 46, 53, 62, 70], [45, 57, 61, 64, 69]], bells: [74, 76, 81, 86, 88], brass: true, cutoff: 1800 },
};

// PART II score: brutal low brass swells, sub drones, choir pads and a
// fragile memory piano — sparse, huge, cold.
const MOODS2 = {
  fog:     { bar: 10, chords: [[33, 45, 52], [31, 43, 50], [29, 41, 48], [31, 43, 50]], braam: 0.6, drone: 21, bells: [69, 72, 76], bellRate: 0.4, cutoff: 700, pad: true },
  hq:      { bar: 8, chords: [[36, 48, 55], [34, 46, 53], [36, 48, 51], [31, 43, 50]], braam: 0.25, drone: 24, pulse: true, cutoff: 600, pad: true },
  grand:   { bar: 12, chords: [[28, 40, 47, 52, 59], [29, 41, 48, 53, 57], [26, 38, 45, 50, 57], [28, 40, 47, 52, 56]], braam: 0.5, drone: 16, choir: true, cutoff: 900, pad: true, drips: true },
  memory:  { bar: 9, chords: [[45, 57, 64, 69], [41, 53, 60, 65], [43, 55, 62, 67], [40, 52, 59, 64]], arp: [69, 72, 76, 79, 76, 72], cutoff: 1300, pad: true, bells: [81, 84, 88], bellRate: 0.5 },
  dust:    { bar: 12, chords: [[33, 45, 52, 57], [34, 46, 53, 58], [33, 45, 52, 56], [31, 43, 50, 55]], braam: 0.45, drone: 21, choir: true, cutoff: 800, pad: true },
  tension: { bar: 6, chords: [[34, 46, 53], [34, 46, 52], [33, 45, 52], [35, 47, 54]], braam: 0.8, drone: 22, pulse: true, cutoff: 500, pad: true },
  finale:  MOODS.finale,
  love:    MOODS.love,
};
const SCORES = { p1: MOODS, p2: MOODS2 };

function distCurve(k = 12) {
  const n = 1024, c = new Float32Array(n);
  for (let i = 0; i < n; i++) { const x = (i * 2) / n - 1; c[i] = ((1 + k) * x) / (1 + k * Math.abs(x)); }
  return c;
}

export class Sound {
  constructor() {
    this.ctx = null;
    this.musicOn = true;
    this.sfxOn = true;
    this.mood = 'city';
    this.moods = MOODS;
    this.rainLevel = 0.5;
    this.amb = ['rain', 0.5];
    this.nextBar = 0;
    this.chordIx = 0;
    this.nextBell = 0;
    this.nextPulse = 0;
  }

  // Must be called from a user gesture (browser autoplay policy).
  unlock() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = this.ctx = new AC();
    this.master = ctx.createGain(); this.master.gain.value = 0.9; this.master.connect(ctx.destination);

    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18; comp.ratio.value = 3;
    comp.connect(this.master);

    this.reverb = ctx.createConvolver();
    this.reverb.buffer = this.impulse(5.5, 2.4);
    const wet = ctx.createGain(); wet.gain.value = 0.55;
    this.reverb.connect(wet).connect(comp);

    this.music = ctx.createGain(); this.music.gain.value = this.musicOn ? 0.32 : 0;
    this.music.connect(comp); this.music.connect(this.reverb);
    this.sfx = ctx.createGain(); this.sfx.gain.value = this.sfxOn ? 0.7 : 0;
    this.sfx.connect(comp);
    this.sfxVerb = ctx.createGain(); this.sfxVerb.gain.value = 0.25;
    this.sfx.connect(this.sfxVerb).connect(this.reverb);

    this.noise = this.noiseBuffer(3);
    this.startRain();
    this.nextBar = ctx.currentTime + 0.2;
    this.timer = setInterval(() => this.schedule(), 120);
  }

  impulse(seconds, decay) {
    const rate = this.ctx.sampleRate, len = Math.floor(rate * seconds);
    const buf = this.ctx.createBuffer(2, len, rate);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return buf;
  }

  noiseBuffer(seconds) {
    const rate = this.ctx.sampleRate, buf = this.ctx.createBuffer(1, rate * seconds, rate);
    const d = buf.getChannelData(0);
    let b = 0;
    for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; b = 0.97 * b + 0.03 * w; d[i] = w * 0.6 + b * 2; }
    return buf;
  }

  setMusic(on) {
    this.musicOn = on;
    if (this.ctx) this.music.gain.setTargetAtTime(on ? 0.32 : 0, this.ctx.currentTime, 0.4);
  }
  setSfx(on) {
    this.sfxOn = on;
    if (this.ctx) { this.sfx.gain.setTargetAtTime(on ? 0.7 : 0, this.ctx.currentTime, 0.1); this.setAmbience(...this.amb); }
  }
  setMood(mood) {
    if (!this.moods[mood] || mood === this.mood) return;
    this.mood = mood;
    if (this.ctx) { this.nextBar = Math.min(this.nextBar, this.ctx.currentTime + 1.5); this.chordIx = 0; }
  }
  setRain(level) { this.setAmbience('rain', level); }

  startRain() {
    const ctx = this.ctx;
    const src = ctx.createBufferSource(); src.buffer = this.noise; src.loop = true;
    this.ambHp = ctx.createBiquadFilter(); this.ambHp.type = 'highpass';
    this.ambLp = ctx.createBiquadFilter(); this.ambLp.type = 'lowpass';
    this.rainGain = ctx.createGain(); this.rainGain.gain.value = 0;
    this.lfo = ctx.createOscillator(); this.lfoGain = ctx.createGain(); this.lfoGain.gain.value = 0;
    this.lfo.connect(this.lfoGain).connect(this.rainGain.gain);
    src.connect(this.ambHp).connect(this.ambLp).connect(this.rainGain).connect(this.master);
    src.start(); this.lfo.start();
    this.setAmbience(...this.amb);
  }

  // kind: rain | snow | wind | surf | dust | none
  setAmbience(kind, level = 0.5) {
    this.amb = [kind, level]; this.rainLevel = level;
    if (!this.ctx) return;
    const P = { rain: [900, 7000, 0, 0.1], snow: [2600, 9000, 0.1, 0.35], wind: [180, 900, 0.12, 0.8], surf: [70, 1300, 0.16, 0.9], dust: [300, 2200, 0.07, 0.6], none: [2000, 3000, 0.1, 0] }[kind] || [900, 7000, 0, 0];
    const now = this.ctx.currentTime, on = this.sfxOn ? 1 : 0;
    const base = level * 0.22 * (kind === 'surf' ? 1.6 : kind === 'wind' ? 1.4 : 1);
    this.ambHp.frequency.setTargetAtTime(P[0], now, 0.6);
    this.ambLp.frequency.setTargetAtTime(P[1], now, 0.6);
    this.lfo.frequency.setTargetAtTime(P[2] || 0.1, now, 0.1);
    this.rainGain.gain.setTargetAtTime(on * base * (1 - P[3] * 0.5), now, 0.8);
    this.lfoGain.gain.setTargetAtTime(on * base * P[3] * 0.5, now, 0.8);
  }
  setScore(name) {
    const next = SCORES[name] || MOODS;
    if (next === this.moods) return;
    this.moods = next; this.mood = null;
    if (this.ctx) this.nextBar = Math.min(this.nextBar, this.ctx.currentTime + 0.5);
  }

  // ---------- generative score ----------
  schedule() {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running') return;
    const m = this.moods[this.mood] || Object.values(this.moods)[0], ahead = ctx.currentTime + 0.5;
    while (this.nextBar < ahead) {
      const chord = m.chords[this.chordIx % m.chords.length], t = this.nextBar;
      if (m.pad !== false) this.pad(chord, t, m.bar, m.cutoff);
      if (m.brass && this.chordIx % 2 === 0) this.brass(chord.slice(1, 4), t + 0.05, m.bar * 0.8);
      if (m.braam && Math.random() < m.braam) this.braam(chord.slice(0, 3), t + 0.3);
      if (m.drone) this.drone(m.drone, t, m.bar);
      if (m.choir) this.choir(chord.slice(-3).map((n) => n + 12), t, m.bar);
      if (m.arp) m.arp.forEach((n, i) => this.pianoNote(n + (this.chordIx % 2 ? -2 : 0), t + 1 + i * (m.bar - 2) / m.arp.length, 0.07));
      this.nextBar += m.bar; this.chordIx++;
    }
    if (m.bells && this.nextBell < ahead) {
      const t = Math.max(this.nextBell, ctx.currentTime + 0.05);
      const n = m.bells[Math.floor(Math.random() * m.bells.length)];
      this.bell(NOTE(n), t, 0.08 + Math.random() * 0.05);
      if (Math.random() < 0.4) this.bell(NOTE(n + 12), t + 0.18, 0.03);
      this.nextBell = t + (1.2 + Math.random() * 3.5) / (m.bellRate || 1);
    }
    if (m.drips && Math.random() < 0.06) this.bell(NOTE(84 + Math.floor(Math.random() * 12)), ctx.currentTime + 0.1, 0.02);
    if (m.pulse && this.nextPulse < ahead) {
      const t = Math.max(this.nextPulse, ctx.currentTime + 0.05);
      this.thump(t, 0.35); this.thump(t + 0.28, 0.22);
      this.nextPulse = t + 1.1;
    }
  }

  // the huge distorted low-brass swell
  braam(notes, t) {
    const ctx = this.ctx;
    const ws = ctx.createWaveShaper(); ws.curve = this.curve ||= distCurve(10); ws.oversample = '2x';
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 3;
    lp.frequency.setValueAtTime(80, t); lp.frequency.exponentialRampToValueAtTime(1500, t + 1.3); lp.frequency.exponentialRampToValueAtTime(160, t + 6);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.16, t + 0.9); g.gain.exponentialRampToValueAtTime(0.0001, t + 6.5);
    ws.connect(lp).connect(g).connect(this.music);
    for (const n of notes) for (const det of [-14, 0, 13]) {
      const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = NOTE(n - 12); o.detune.value = det;
      const vg = ctx.createGain(); vg.gain.value = 0.3;
      o.connect(vg).connect(ws); o.start(t); o.stop(t + 6.6);
    }
  }
  drone(n, t, dur) {
    const ctx = this.ctx;
    const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = NOTE(n + 12);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.22, t + 2); g.gain.linearRampToValueAtTime(0.0001, t + dur + 1.5);
    o.connect(g).connect(this.music); o.start(t); o.stop(t + dur + 1.6);
  }
  choir(notes, t, dur) {
    const ctx = this.ctx;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.05, t + 3); g.gain.linearRampToValueAtTime(0.0001, t + dur + 2);
    const f1 = ctx.createBiquadFilter(); f1.type = 'bandpass'; f1.frequency.value = 700; f1.Q.value = 5;
    const f2 = ctx.createBiquadFilter(); f2.type = 'bandpass'; f2.frequency.value = 1150; f2.Q.value = 6;
    f1.connect(g); f2.connect(g); g.connect(this.music);
    for (const n of notes) {
      const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = NOTE(n);
      const v = ctx.createOscillator(); v.frequency.value = 4.5; const vg = ctx.createGain(); vg.gain.value = 6; v.connect(vg).connect(o.detune);
      o.connect(f1); o.connect(f2); o.start(t); v.start(t); o.stop(t + dur + 2.1); v.stop(t + dur + 2.1);
    }
  }
  pianoNote(n, t, vol) {
    const ctx = this.ctx;
    for (const [mul, v, type] of [[1, vol, 'triangle'], [2, vol * 0.3, 'sine'], [3, vol * 0.1, 'sine']]) {
      const o = ctx.createOscillator(); o.type = type; o.frequency.value = NOTE(n) * mul;
      const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 3);
      o.connect(g).connect(this.music); o.start(t); o.stop(t + 3.1);
    }
  }

  pad(notes, t, dur, cutoff) {
    const ctx = this.ctx;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 2;
    lp.frequency.setValueAtTime(cutoff * 0.35, t);
    lp.frequency.linearRampToValueAtTime(cutoff, t + dur * 0.45);
    lp.frequency.linearRampToValueAtTime(cutoff * 0.5, t + dur + 3);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.09, t + 2.2);
    g.gain.setValueAtTime(0.09, t + dur - 0.5);
    g.gain.linearRampToValueAtTime(0.0001, t + dur + 3);
    lp.connect(g).connect(this.music);
    notes.forEach((n, i) => {
      for (const det of [-9, 7]) {
        const o = ctx.createOscillator(); o.type = i === 0 ? 'triangle' : 'sawtooth';
        o.frequency.value = NOTE(n); o.detune.value = det + (Math.random() * 4 - 2);
        const vg = ctx.createGain(); vg.gain.value = i === 0 ? 0.9 : 0.35;
        o.connect(vg).connect(lp); o.start(t); o.stop(t + dur + 3.2);
      }
    });
  }

  brass(notes, t, dur) {
    const ctx = this.ctx;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 6;
    lp.frequency.setValueAtTime(200, t);
    lp.frequency.exponentialRampToValueAtTime(2600, t + 1.4);
    lp.frequency.exponentialRampToValueAtTime(500, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.06, t + 1.2);
    g.gain.linearRampToValueAtTime(0.0001, t + dur);
    lp.connect(g).connect(this.music);
    for (const n of notes) {
      const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = NOTE(n);
      const vib = ctx.createOscillator(); vib.frequency.value = 5.2;
      const vg = ctx.createGain(); vg.gain.value = 4;
      vib.connect(vg).connect(o.detune);
      o.connect(lp); o.start(t); vib.start(t); o.stop(t + dur + 0.1); vib.stop(t + dur + 0.1);
    }
  }

  bell(freq, t, vol) {
    const ctx = this.ctx;
    const car = ctx.createOscillator(); car.frequency.value = freq;
    const mod = ctx.createOscillator(); mod.frequency.value = freq * 3.5;
    const mg = ctx.createGain(); mg.gain.setValueAtTime(freq * 1.2, t); mg.gain.exponentialRampToValueAtTime(1, t + 1.5);
    mod.connect(mg).connect(car.frequency);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 3.5);
    car.connect(g).connect(this.music);
    car.start(t); mod.start(t); car.stop(t + 3.6); mod.stop(t + 3.6);
  }

  thump(t, vol) {
    const ctx = this.ctx;
    const o = ctx.createOscillator(); o.frequency.setValueAtTime(90, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.2);
    const g = ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    o.connect(g).connect(this.music); o.start(t); o.stop(t + 0.35);
  }

  // ---------- sound effects ----------
  get ok() { return this.ctx && this.ctx.state === 'running'; }

  noiseHit({ t = 0, dur = 0.1, freq = 1000, q = 1, type = 'bandpass', vol = 0.3, sweep = null } = {}) {
    if (!this.ok) return;
    const ctx = this.ctx, at = ctx.currentTime + t;
    const s = ctx.createBufferSource(); s.buffer = this.noise;
    const f = ctx.createBiquadFilter(); f.type = type; f.frequency.setValueAtTime(freq, at); f.Q.value = q;
    if (sweep) f.frequency.exponentialRampToValueAtTime(sweep, at + dur);
    const g = ctx.createGain(); g.gain.setValueAtTime(vol, at); g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    s.connect(f).connect(g).connect(this.sfx);
    s.start(at, Math.random() * 2); s.stop(at + dur + 0.05);
  }

  tone({ t = 0, freq = 440, dur = 0.1, type = 'square', vol = 0.1, slide = null } = {}) {
    if (!this.ok) return;
    const ctx = this.ctx, at = ctx.currentTime + t;
    const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(freq, at);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, at + dur);
    const g = ctx.createGain(); g.gain.setValueAtTime(vol, at); g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    o.connect(g).connect(this.sfx); o.start(at); o.stop(at + dur + 0.02);
  }

  step(wet) { this.noiseHit({ dur: 0.07, freq: wet ? 1800 : 500, q: wet ? 0.8 : 2, vol: wet ? 0.22 : 0.3 }); }
  blip(pitch = 1) { this.tone({ freq: 380 * pitch * (0.97 + Math.random() * 0.06), dur: 0.045, vol: 0.035 }); }
  select() { this.tone({ freq: 660, dur: 0.06, vol: 0.06 }); this.tone({ t: 0.05, freq: 990, dur: 0.08, vol: 0.05 }); }
  door() { this.noiseHit({ dur: 0.5, freq: 300, sweep: 2400, q: 3, vol: 0.25 }); this.tone({ freq: 120, dur: 0.3, type: 'sine', vol: 0.2, slide: 60 }); }
  pickup() { [0, 0.07, 0.14].forEach((t, i) => this.tone({ t, freq: [523, 784, 1046][i], dur: 0.18, type: 'triangle', vol: 0.12 })); }
  egg() { [0, 0.09, 0.18, 0.27].forEach((t, i) => this.tone({ t, freq: [659, 880, 1175, 1568][i], dur: 0.35, type: 'sine', vol: 0.12 })); }
  beep() { this.tone({ freq: 1320, dur: 0.05, vol: 0.06 }); }
  esper() { this.tone({ freq: 220, dur: 0.25, type: 'sawtooth', vol: 0.05, slide: 880 }); this.noiseHit({ dur: 0.25, freq: 4000, q: 4, vol: 0.06 }); }
  print() { for (let i = 0; i < 10; i++) this.noiseHit({ t: i * 0.06, dur: 0.04, freq: 2600, q: 6, vol: 0.12 }); }
  spinner() { this.noiseHit({ dur: 2.2, freq: 200, sweep: 1400, q: 2, vol: 0.2 }); this.tone({ freq: 70, dur: 2.2, type: 'sawtooth', vol: 0.05, slide: 140 }); }
  thunder() {
    this.noiseHit({ dur: 3.5, freq: 180, type: 'lowpass', vol: 0.55, sweep: 60 });
    this.noiseHit({ t: 0.05, dur: 0.6, freq: 900, type: 'lowpass', vol: 0.35 });
  }
  shot() {
    this.noiseHit({ dur: 0.9, freq: 2400, type: 'lowpass', vol: 0.7, sweep: 120 });
    this.tone({ freq: 160, dur: 0.5, type: 'square', vol: 0.25, slide: 30 });
  }
  glass() { for (let i = 0; i < 14; i++) this.tone({ t: i * 0.035 + Math.random() * 0.03, freq: 2500 + Math.random() * 3500, dur: 0.12, type: 'triangle', vol: 0.06 }); this.noiseHit({ dur: 0.6, freq: 6000, q: 1, vol: 0.2 }); }
  heartbeat() { this.tone({ freq: 60, dur: 0.12, type: 'sine', vol: 0.4, slide: 40 }); this.tone({ t: 0.18, freq: 55, dur: 0.12, type: 'sine', vol: 0.3, slide: 38 }); }
  flutter() { for (let i = 0; i < 8; i++) this.noiseHit({ t: i * 0.09, dur: 0.07, freq: 700, q: 1, vol: 0.18 }); }
  hoot() { this.tone({ freq: 380, dur: 0.35, type: 'sine', vol: 0.12, slide: 330 }); this.tone({ t: 0.45, freq: 360, dur: 0.5, type: 'sine', vol: 0.1, slide: 300 }); }
  shimmer() { for (let i = 0; i < 7; i++) this.tone({ t: i * 0.04, freq: 1200 + i * 260 + Math.random() * 80, dur: 0.25, type: 'sine', vol: 0.035 }); }
  glitch() { for (let i = 0; i < 5; i++) this.tone({ t: i * 0.03, freq: 200 + Math.random() * 1800, dur: 0.03, type: 'square', vol: 0.05 }); }
  scan() { this.tone({ freq: 400, dur: 0.6, type: 'sine', vol: 0.06, slide: 1600 }); this.tone({ t: 0.6, freq: 1600, dur: 0.5, type: 'sine', vol: 0.05, slide: 500 }); }
  wave() { this.noiseHit({ dur: 2.4, freq: 900, type: 'lowpass', vol: 0.6, sweep: 120 }); }
  bees() { const o = { freq: 220, dur: 1.4, type: 'sawtooth', vol: 0.03 }; this.tone(o); this.tone({ ...o, freq: 233 }); this.tone({ ...o, freq: 247, t: 0.2 }); }
  bark() { this.tone({ freq: 320, dur: 0.12, type: 'sawtooth', vol: 0.12, slide: 180 }); this.noiseHit({ dur: 0.12, freq: 900, q: 2, vol: 0.2 }); this.tone({ t: 0.25, freq: 300, dur: 0.1, type: 'sawtooth', vol: 0.1, slide: 170 }); }
  engine() { this.tone({ freq: 55, dur: 1.8, type: 'sawtooth', vol: 0.08, slide: 90 }); this.noiseHit({ dur: 1.8, freq: 300, sweep: 900, q: 1, vol: 0.15 }); }
  piano(notes) { notes.forEach((n, i) => { this.tone({ t: i * 0.45, freq: NOTE(n), dur: 1.6, type: 'triangle', vol: 0.12 }); this.tone({ t: i * 0.45, freq: NOTE(n + 12), dur: 0.8, type: 'sine', vol: 0.04 }); }); }
}
