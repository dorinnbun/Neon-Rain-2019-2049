// PART II gameplay modes: spinner flight, the baseline test, the DNA archive.
import * as B from './art.js';
const { W, H, LB } = B;

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const shuffle = (a) => { const r = [...a]; for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };

// ---------------------------------------------------------------- spinner flight
// Side-scrolling flight to the destination. ▲▼ steer, B engages autopilot.
export function flight(dest, look) {
  const L = Object.assign({ sky: ['#050708', '#1b2327', '#3a4448'], block: '#0f1316', far: '#1a2126', lights: ['#ffb35c', '#7fd6d9'], weather: 'rain', haze: null }, look || {});
  return {
    t: 0, dur: 17, y: 130, vy: 0, obs: [], hits: 0, spawn: 1.2, sparks: [], wx: new B.Weather(), auto: false,
    start(g) { g.sound.engine(); },
    update(dt, input, presses, g) {
      this.t += dt;
      if (presses.includes('b')) this.auto = true;
      let steer = (input.isHeld('down') ? 1 : 0) - (input.isHeld('up') ? 1 : 0);
      if (this.auto) {
        const next = this.obs.find((o) => o.x > 60 && o.x < 260);
        const want = next ? (next.kind === 'drone' ? (next.y > H / 2 ? next.y - 60 : next.y + 60) : next.gapY) : H / 2;
        steer = clamp((want - this.y) / 30, -1, 1);
      }
      this.vy = (this.vy + steer * 520 * dt) * Math.pow(0.08, dt);
      this.y = clamp(this.y + this.vy * dt, LB + 20, H - LB - 12);
      this.spawn -= dt;
      if (this.spawn <= 0 && this.t < this.dur - 3) {
        if (Math.random() < 0.55) this.obs.push({ kind: 'pylon', x: W + 30, gapY: 70 + Math.random() * 130, gap: 74 });
        else this.obs.push({ kind: 'drone', x: W + 20, y: 60 + Math.random() * 150, ph: Math.random() * 6 });
        this.spawn = 1.05 + Math.random() * 0.6;
      }
      for (const o of this.obs) {
        o.x -= 170 * dt;
        if (o.kind === 'drone') o.y += Math.sin(this.t * 3 + o.ph) * 30 * dt;
        const px = 100, hitX = Math.abs(o.x - px) < (o.kind === 'drone' ? 18 : 14);
        const hitY = o.kind === 'drone' ? Math.abs(o.y - (this.y - 5)) < 11 : (this.y - 12 < o.gapY - o.gap / 2 || this.y > o.gapY + o.gap / 2);
        if (!o.hit && hitX && hitY) {
          o.hit = true; this.hits++; g.shake(0.25); g.sound.glitch();
          for (let i = 0; i < 12; i++) this.sparks.push({ x: px, y: this.y - 5, vx: (Math.random() - 0.5) * 160, vy: (Math.random() - 0.7) * 160, l: 0.5 });
        }
      }
      this.obs = this.obs.filter((o) => o.x > -40);
      this.sparks = this.sparks.filter((s) => (s.l -= dt) > 0).map((s) => ({ ...s, x: s.x + s.vx * dt, y: s.y + s.vy * dt, vy: s.vy + 300 * dt }));
      if (this.t >= this.dur) this.finish({ hits: this.hits });
    },
    draw(ctx, t) {
      const cam = this.t * 420;
      B.ditherSky(ctx, L.sky);
      if (L.haze) B.haze(ctx, L.haze, 0.18);
      B.megablocks(ctx, cam, 0.15, { seed: 7, color: L.far, base: 238, minH: 60, maxH: 170, lights: L.lights, density: 0.25 });
      B.fog(ctx, 150, 80, L.sky[2], 0.25, t, 10);
      B.megablocks(ctx, cam, 0.45, { seed: 19, color: L.block, base: 250, minH: 40, maxH: 130, lights: L.lights, density: 0.45 });
      for (const o of this.obs) {
        if (o.kind === 'pylon') {
          ctx.fillStyle = '#0b0e10';
          ctx.fillRect(o.x - 10, LB, 20, o.gapY - o.gap / 2 - LB); ctx.fillRect(o.x - 10, o.gapY + o.gap / 2, 20, H - LB - (o.gapY + o.gap / 2));
          ctx.fillStyle = o.hit ? '#5a2020' : '#ff3b30';
          ctx.fillRect(o.x - 10, o.gapY - o.gap / 2 - 2, 20, 2); ctx.fillRect(o.x - 10, o.gapY + o.gap / 2, 20, 2);
          ctx.globalAlpha = 0.25; ctx.fillStyle = L.lights[0];
          for (let yy = LB + 6; yy < H - LB; yy += 9) if (yy < o.gapY - o.gap / 2 - 4 || yy > o.gapY + o.gap / 2 + 4) ctx.fillRect(o.x - 7, yy, 14, 1);
          ctx.globalAlpha = 1;
        } else {
          ctx.fillStyle = '#1a1d21'; ctx.fillRect(o.x - 9, o.y - 3, 18, 6); ctx.fillRect(o.x - 13, o.y - 5, 4, 2); ctx.fillRect(o.x + 9, o.y - 5, 4, 2);
          ctx.fillStyle = Math.floor(t * 6) % 2 ? '#ff3b30' : '#7fd6d9'; ctx.fillRect(o.x - 1, o.y - 1, 2, 2);
        }
      }
      B.spinner2(ctx, 100, this.y, t, 1);
      ctx.fillStyle = 'rgba(255,200,140,0.5)'; ctx.fillRect(58, this.y - 3, 20 + Math.random() * 6, 1);
      for (const s of this.sparks) { ctx.fillStyle = '#ffd08a'; ctx.fillRect(s.x, s.y, 1, 1); }
      this.wx.draw(ctx, 1 / 60, t, L.weather, 0.8, H);
      // HUD
      const p = Math.min(1, this.t / this.dur);
      ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(140, H - LB - 10, 200, 2);
      ctx.fillStyle = B.PAL.amber; ctx.fillRect(140, H - LB - 10, 200 * p, 2);
      B.pxLight(ctx, `EN ROUTE ▸ ${dest.name.toUpperCase()}`, 140, H - LB - 22, '#e7ebe8');
      B.pxLight(ctx, this.auto ? 'AUTOPILOT ENGAGED' : '▲ ▼ STEER   ·   B AUTOPILOT', 300, LB + 6, this.auto ? B.PAL.teal : '#9aa4a2');
      if (this.hits) B.pxLight(ctx, `HULL ${Math.max(0, 100 - this.hits * 12)}%`, 20, LB + 6, this.hits > 4 ? '#ff5a4a' : B.PAL.amber);
    },
  };
}

// ---------------------------------------------------------------- baseline test
// Call-and-response under time pressure. When `rigged`, Seven answers but the
// pauses give him away — the test is failed however well it's played.
const BASELINE = [
  { call: 'Recite. "A house of glass, lit from inside, and every pane a window." Window.', word: 'Window', decoys: ['Widow', 'Winter'] },
  { call: '"Rain on the glass. Count it." Count.', word: 'Count', decoys: ['Cold', 'Calm'] },
  { call: '"The light stays on when no one is home." Home.', word: 'Home', decoys: ['Hold', 'Hope'] },
  { call: '"Say the word they gave you." Given.', word: 'Given', decoys: ['Chosen', 'Gone'] },
  { call: '"A thing carved small, and hidden warm." Hidden.', word: 'Hidden', decoys: ['Hollow', 'Hunted'] },
  { call: '"Is there anything in you that nobody put there?" Kept.', word: 'Kept', decoys: ['Kind', 'Mine'] },
];
export async function baseline(g, { rigged = false } = {}) {
  g.sound.setMood('tension');
  await g.say('baseline', 'Baseline test. Answer each call with its key word. You will be timed. Begin.');
  let right = 0, slow = 0;
  const rounds = rigged ? BASELINE.slice(1) : BASELINE.slice(0, 5);
  for (const [i, q] of rounds.entries()) {
    await g.say('baseline', q.call);
    const opts = shuffle([q.word, ...q.decoys]);
    const t0 = performance.now();
    const pick = await g.choose(opts, 'you', { timeout: rigged ? Math.max(1.2, 2.6 - i * 0.3) : 3.2 });
    const secs = (performance.now() - t0) / 1000;
    if (pick >= 0 && opts[pick] === q.word) { right++; g.sound.beep(); } else g.sound.glitch();
    if (secs > 1.5 || pick < 0) slow++;
  }
  const passed = !rigged && right >= 4;
  g.sound.setMood(g.scene.mood);
  if (rigged) {
    await g.say('baseline', `${right}/${rounds.length} correct. Response latency: ${(1.4 + slow * 0.4).toFixed(1)} seconds average. Micro-tremor detected on "Kept".`);
    await g.say('baseline', 'CONCLUSION: SUBJECT IS OFF BASELINE.');
  } else {
    await g.say('baseline', passed ? `${right}/${rounds.length}. STEADY. SUBJECT IS WITHIN BASELINE. Dismissed.` : `${right}/${rounds.length}. Borderline. We\'ll call it within baseline. Don\'t make us regret it.`);
  }
  return passed;
}

// ---------------------------------------------------------------- DNA archive
const BASES = 'ACGT';
const seq = (n) => Array.from({ length: n }, () => BASES[Math.floor(Math.random() * 4)]).join('');
const fmt = (s) => s.match(/.{1,4}/g).join('·');
function mutate(s, n) {
  const a = s.split('');
  for (let k = 0; k < n; k++) { const i = Math.floor(Math.random() * a.length); a[i] = BASES[(BASES.indexOf(a[i]) + 1 + Math.floor(Math.random() * 3)) % 4]; }
  return a.join('');
}
// Find the record whose sequence exactly matches the sample. Returns mistakes made.
export async function dnaMatch(g, { rounds = 3, subject = 'SAMPLE' } = {}) {
  let mistakes = 0;
  for (let r = 0; r < rounds; r++) {
    const target = seq(12);
    for (;;) {
      await g.say('archive', `${subject} · FRAGMENT ${r + 1}/${rounds}   ▸   ${fmt(target)}`);
      const ids = shuffle(['AX', 'KD', 'NS', 'RT']).slice(0, 3).map((p) => `${p}-${String(Math.floor(Math.random() * 9000) + 1000)}`);
      const opts = shuffle([target, mutate(target, 1), mutate(target, 2)]);
      const pick = await g.choose(opts.map((o, i) => `${ids[i]}   ${fmt(o)}`), 'archive');
      if (opts[pick] === target) { g.sound.beep(); break; }
      mistakes++; g.sound.glitch();
      await g.say('archive', 'NO MATCH. BASE PAIRS DIFFER. RE-QUERY.');
    }
  }
  g.sound.scan();
  return mistakes;
}
