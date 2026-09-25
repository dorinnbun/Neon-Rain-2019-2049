// PART II art: finer 480x270 pixels, dithered skies, brutalist megastructures,
// volumetric fog, holograms, snow/ash/dust, rim-lit figures and a cinematic
// post pipeline (colour grade, vignette, film grain, letterbox).
import { rng } from '../art.js';
export { pxText, pxWidth, rng } from '../art.js';

export const W = 480, H = 270, LB = 22; // letterbox bar height
export const FLOOR = 226;

export const PAL = {
  white: '#e7ebe8', bone: '#cfd3cc', ash: '#8e9794', slate: '#39424a', ink: '#07090a',
  amber: '#ff8a3d', rust: '#b3441a', sodium: '#ffb35c', teal: '#7fd6d9', ice: '#bfe6ee', pink: '#ff6fb5', violet: '#9b7bff', gold: '#f2c14e',
};

const hex = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

// ---------------------------------------------------------------- caches
const cache = new Map();
function cached(key, w, h, paint) {
  let c = cache.get(key);
  if (!c) { c = document.createElement('canvas'); c.width = w; c.height = h; paint(c.getContext('2d'), w, h); cache.set(key, c); }
  return c;
}

// ordered-dither vertical gradient, rendered once and cached
export function ditherSky(ctx, stops, key = stops.join()) {
  const c = cached('sky' + key, W, H, (x, w, h) => {
    const img = x.createImageData(w, h), d = img.data, cols = stops.map(hex);
    for (let y = 0; y < h; y++) {
      const tt = (y / (h - 1)) * (cols.length - 1), i = Math.min(cols.length - 2, Math.floor(tt)), f = tt - i;
      for (let xx = 0; xx < w; xx++) {
        // quantise into 6 bands per segment, dither between bands
        const q = f * 6, b = Math.floor(q), frac = q - b;
        const use = (BAYER[(y & 3) * 4 + (xx & 3)] / 16) < frac ? b + 1 : b;
        const k = Math.min(1, use / 6), a = cols[i], bb = cols[i + 1], o = (y * w + xx) * 4;
        d[o] = a[0] + (bb[0] - a[0]) * k; d[o + 1] = a[1] + (bb[1] - a[1]) * k; d[o + 2] = a[2] + (bb[2] - a[2]) * k; d[o + 3] = 255;
      }
    }
    x.putImageData(img, 0, 0);
  });
  ctx.drawImage(c, 0, 0);
}

// brutalist megastructure silhouettes, cached per layer then tiled with parallax
export function megablocks(ctx, cam, par, { seed = 1, base = FLOOR, minH = 40, maxH = 160, color = '#12171b', lights = ['#ffb35c', '#7fd6d9'], density = 0.5, span = 1400 } = {}) {
  const key = ['mb', seed, base, minH, maxH, color, lights.join(), density, span].join();
  const c = cached(key, span, H, (x) => {
    const r = rng(seed);
    let px = -20;
    while (px < span) {
      const w = 30 + Math.floor(r() * 90), h = minH + Math.floor(r() * (maxH - minH)), kind = r();
      x.fillStyle = color;
      if (kind < 0.35) { // stepped ziggurat slab
        for (let s = 0; s < 4; s++) x.fillRect(px + s * 6, base - h + s * (h / 5), w - s * 12, h);
      } else if (kind < 0.7) { // slab with vertical fins
        x.fillRect(px, base - h, w, h);
        x.fillStyle = 'rgba(255,255,255,0.025)';
        for (let f = 3; f < w; f += 6) x.fillRect(px + f, base - h, 2, h);
      } else { // tower with crown
        x.fillRect(px + w * 0.25, base - h - 20, w * 0.5, h + 20);
        x.fillRect(px, base - h * 0.6, w, h * 0.6);
      }
      // strip lights
      for (let ly = base - h + 6; ly < base - 4; ly += 5 + Math.floor(r() * 5)) {
        if (r() > density) continue;
        x.globalAlpha = 0.25 + r() * 0.5;
        x.fillStyle = lights[Math.floor(r() * lights.length)];
        const lx = px + 3 + Math.floor(r() * (w - 10));
        x.fillRect(lx, ly, 2 + Math.floor(r() * 18), 1);
        x.globalAlpha = 1;
      }
      if (r() < 0.3) { x.fillStyle = '#ff3b30'; x.fillRect(px + w / 2, base - h - 22, 1, 1); }
      px += w + Math.floor(r() * 12);
    }
  });
  const off = -((cam * par) % span);
  ctx.drawImage(c, Math.floor(off), 0);
  ctx.drawImage(c, Math.floor(off + span), 0);
}

// soft drifting fog bands
export function fog(ctx, y, h, color, alpha, t, speed = 4) {
  const [r, g, b] = hex(color);
  for (let i = 0; i < 4; i++) {
    const yy = y + i * h / 4 + Math.sin(t * 0.2 + i) * 3;
    const gr = ctx.createLinearGradient(0, yy - h / 3, 0, yy + h / 3);
    gr.addColorStop(0, `rgba(${r},${g},${b},0)`); gr.addColorStop(0.5, `rgba(${r},${g},${b},${alpha})`); gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
    ctx.fillStyle = gr;
    const ox = ((t * speed * (i + 1)) % 200) - 100;
    ctx.fillRect(ox - 100, yy - h / 3, W + 300, h * 2 / 3);
  }
}

// full-screen haze tint (dust storms, snow blindness)
export function haze(ctx, color, alpha) { ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = color; ctx.fillRect(0, 0, W, H); ctx.restore(); }

// giant advertising hologram of a woman — translucent, scanlined, glitching
export function hologram(ctx, x, y, scale, t, { hue = 'pink', glitch = 0, text = null } = {}) {
  const key = 'holo' + hue;
  const c = cached(key, 120, 260, (g) => {
    const grad = g.createLinearGradient(0, 0, 0, 260);
    if (hue === 'pink') { grad.addColorStop(0, '#ffb3dd'); grad.addColorStop(0.6, '#ff6fb5'); grad.addColorStop(1, '#6f7bff'); }
    else { grad.addColorStop(0, '#dff8ff'); grad.addColorStop(1, '#5aa8ff'); }
    g.fillStyle = grad;
    g.beginPath();
    g.ellipse(60, 30, 16, 20, 0, 0, Math.PI * 2); // head
    g.moveTo(44, 16); g.lineTo(76, 16); g.lineTo(80, 44); g.lineTo(40, 44); // bob haircut
    g.rect(54, 48, 12, 10); // neck
    g.moveTo(30, 60); g.lineTo(90, 60); g.lineTo(84, 140); g.lineTo(92, 250); g.lineTo(28, 250); g.lineTo(36, 140); g.closePath(); // dress
    g.fill();
    g.fillRect(18, 62, 12, 70); g.fillRect(90, 62, 12, 50); g.fillRect(96, 30, 8, 36); // arms, one raised
    g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(52, 28, 4, 2); g.fillRect(64, 28, 4, 2);
    g.globalCompositeOperation = 'destination-out';
    for (let yy = 0; yy < 260; yy += 3) g.fillRect(0, yy, 120, 1);
  });
  ctx.save();
  ctx.globalAlpha = 0.32 + 0.08 * Math.sin(t * 3) + (Math.random() < 0.03 ? -0.2 : 0);
  ctx.globalCompositeOperation = 'lighter';
  const w = 120 * scale, h = 260 * scale;
  if (glitch > 0 || Math.random() < 0.02) {
    for (let s = 0; s < 6; s++) {
      const sy = Math.floor(Math.random() * 260), sh = 4 + Math.floor(Math.random() * 20);
      ctx.drawImage(c, 0, sy, 120, sh, x - w / 2 + (Math.random() - 0.5) * 16 * scale, y - h + sy * scale, w, sh * scale);
    }
  }
  ctx.drawImage(c, x - w / 2, y - h, w, h);
  ctx.restore();
  if (text) pxLight(ctx, text, x - 60 * scale, y - h - 12, hue === 'pink' ? PAL.pink : PAL.ice);
}
export function pxLight(ctx, text, x, y, color) {
  ctx.save(); ctx.globalAlpha = 0.8; ctx.shadowColor = color; ctx.shadowBlur = 6; ctx.fillStyle = color;
  ctx.font = '8px "IBM Plex Mono", monospace'; ctx.textBaseline = 'top'; ctx.fillText(text, Math.round(x), Math.round(y)); ctx.restore();
}

// ---------------------------------------------------------------- weather
export class Weather {
  constructor() {
    const r = rng(42);
    this.p = Array.from({ length: 360 }, () => ({ x: r() * W, y: r() * H, z: r(), s: r() }));
  }
  draw(ctx, dt, t, kind, amount = 1, floorY = FLOOR) {
    if (!kind || !amount) return;
    const n = Math.floor(this.p.length * Math.min(1, amount));
    ctx.save();
    for (let i = 0; i < n; i++) {
      const p = this.p[i];
      if (kind === 'snow') {
        p.y += (10 + p.z * 22) * dt; p.x += (Math.sin(t * 0.8 + p.s * 10) * 6 - 4) * dt;
        ctx.fillStyle = `rgba(240,245,245,${0.35 + p.z * 0.55})`;
        const sz = p.z > 0.85 ? 2 : 1; ctx.fillRect(Math.round(p.x), Math.round(p.y), sz, sz);
      } else if (kind === 'rain') {
        p.y += (260 + p.z * 200) * dt; p.x -= 20 * dt;
        ctx.fillStyle = `rgba(190,210,220,${0.12 + p.z * 0.25})`; ctx.fillRect(Math.round(p.x), Math.round(p.y), 1, 4 + Math.round(p.z * 6));
      } else if (kind === 'dust') {
        p.x += (30 + p.z * 60) * dt; p.y += Math.sin(t + p.s * 20) * 6 * dt;
        ctx.fillStyle = `rgba(255,170,90,${0.12 + p.z * 0.3})`; ctx.fillRect(Math.round(p.x), Math.round(p.y), 1 + (p.z > 0.8), 1);
      } else if (kind === 'ash') {
        p.y += (6 + p.z * 10) * dt; p.x += (Math.sin(t * 0.5 + p.s * 7) * 4) * dt;
        ctx.fillStyle = `rgba(90,80,72,${0.3 + p.z * 0.4})`; ctx.fillRect(Math.round(p.x), Math.round(p.y), 1, 1);
      } else if (kind === 'embers') {
        p.y -= (12 + p.z * 20) * dt; p.x += Math.sin(t * 2 + p.s * 9) * 8 * dt;
        ctx.fillStyle = `rgba(255,${120 + p.z * 80 | 0},40,${0.4 + p.z * 0.5})`; ctx.fillRect(Math.round(p.x), Math.round(p.y), 1, 1);
      }
      if (p.y > floorY + 20 + p.z * 20) { p.y = LB - 4; p.x = Math.random() * (W + 40); }
      if (p.y < LB - 6) { p.y = floorY; p.x = Math.random() * W; }
      if (p.x > W + 10) p.x -= W + 20; if (p.x < -10) p.x += W + 20;
    }
    ctx.restore();
  }
}

// ---------------------------------------------------------------- figures
// Tall, silhouette-first figures lit by a single rim light (the 2049 look).
export const CAST = {
  seven:     { h: 46, coat: '#2a2622', coatL: '#4a3f35', collar: '#b9a78a', skin: '#c9a88f', hair: '#2a211b', hairStyle: 'short', legs: '#16181a', coatLen: 30 },
  lumen:     { h: 43, coat: '#ff9fce', coatL: '#ffd0e8', collar: null, skin: '#ffe0f0', hair: '#1b1b2a', hairStyle: 'bob', legs: '#ff9fce', coatLen: 24, holo: true },
  okafor:    { h: 44, coat: '#1a1d22', coatL: '#2c323a', collar: null, skin: '#6a4630', hair: '#15110f', hairStyle: 'tied', legs: '#121418', coatLen: 20 },
  moss:      { h: 50, coat: '#5a5a4e', coatL: '#7a7a68', collar: null, skin: '#b58a6a', hair: '#1e1a16', hairStyle: 'bald', legs: '#3a3a30', coatLen: 16, wide: 3, glasses: true },
  castellan: { h: 45, coat: '#1a1714', coatL: '#2e2924', collar: null, skin: '#d8c8b8', hair: '#0f0d0b', hairStyle: 'bun', legs: '#1a1714', coatLen: 40, robe: true, blind: true },
  vesper:    { h: 44, coat: '#e2e0da', coatL: '#ffffff', collar: null, skin: '#e0c2a6', hair: '#140f0c', hairStyle: 'bobsharp', legs: '#1c1c1c', coatLen: 20 },
  veil:      { h: 42, coat: '#e8e6ea', coatL: '#ffffff', collar: null, skin: '#f0d8c8', hair: '#6a4a36', hairStyle: 'long', legs: '#e8e6ea', coatLen: 34, robe: true },
  maren:     { h: 44, coat: '#2e2a26', coatL: '#4a4238', collar: null, skin: '#c89a78', hair: '#2a1a14', hairStyle: 'short', legs: '#1e1c1a', coatLen: 20, eyepatch: true },
  oldrunner: { h: 46, coat: '#3e362e', coatL: '#5a5044', collar: null, skin: '#caa088', hair: '#9a948c', hairStyle: 'short', legs: '#262320', coatLen: 12, wide: 1, beard: '#8a847c' },
  cotton:    { h: 42, coat: '#4a3a2a', coatL: '#6a563e', collar: null, skin: '#b08a6a', hair: '#1a1410', hairStyle: 'bald', legs: '#2a2018', coatLen: 22, glasses: true },
  kid:       { h: 28, coat: '#5a4a3a', coatL: '#7a6a52', collar: null, skin: '#b8906e', hair: '#2a1a12', hairStyle: 'short', legs: '#3a2e22', coatLen: 12 },
  morenoold: { h: 40, coat: '#2a2e3a', coatL: '#3e4454', collar: null, skin: '#b88a66', hair: '#d8d8d8', hairStyle: 'slick', legs: '#1e2028', coatLen: 26, cane: true, stoop: 2 },
  ines:      { h: 41, coat: '#3a4a3e', coatL: '#58705c', collar: null, skin: '#d0a888', hair: '#c8c8c0', hairStyle: 'tied', legs: '#1e2420', coatLen: 28, glasses: true },
  juno:      { h: 43, coat: '#c8e6ee', coatL: '#ffffff', collar: null, skin: '#e0b898', hair: '#ff6fb5', hairStyle: 'bobsharp', legs: '#2a2a3a', coatLen: 24, clear: true },
  scav:      { h: 45, coat: '#3a2e22', coatL: '#5a4632', collar: null, skin: '#8a6a50', hair: '#1a1410', hairStyle: 'hood', legs: '#2a2018', coatLen: 26, mask: true },
  guard:     { h: 45, coat: '#101214', coatL: '#23272c', collar: null, skin: '#b8906e', hair: '#101214', hairStyle: 'helmet', legs: '#0e1012', coatLen: 14 },
};

export function drawFigure(ctx, L, x, y, { dir = 1, frame = 0, walking = false, t = 0, rim = PAL.amber, light = 1, pose = null, alpha = 1 } = {}) {
  x = Math.round(x); y = Math.round(y);
  const h = L.h, wide = L.wide || 0, stoop = L.stoop || 0;
  const px = (dx, dy, w, hh, c) => { ctx.fillStyle = c; ctx.fillRect(dir > 0 ? x + dx : x - dx - w, y + dy, w, hh); };
  const step = walking ? [0, 2, 0, -2][frame % 4] : 0;
  const bob = walking && frame % 2 ? -1 : 0;
  const top = -h + bob;
  ctx.save();
  if (L.holo) {
    ctx.globalAlpha = (0.55 + 0.15 * Math.sin(t * 7)) * alpha;
    ctx.globalCompositeOperation = 'lighter';
    if (Math.random() < 0.04) x += Math.round((Math.random() - 0.5) * 6);
  } else if (alpha < 1) ctx.globalAlpha = alpha;
  // shadow
  if (!L.holo) { ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(x - 9, y - 1, 18, 2); }
  // legs
  const legTop = top + Math.round(h * 0.55);
  if (!L.robe) {
    px(-4 + step, legTop, 3, -2 - legTop, L.legs);
    px(1 - step, legTop, 3, -2 - legTop, L.legs);
    px(-4 + step, -2, 4, 2, '#0a0a0a'); px(1 - step, -2, 4, 2, '#0a0a0a');
  }
  // torso + coat (trapezoid flare)
  const shoulder = top + 11 + stoop, coatBottom = Math.min(shoulder + L.coatLen, -3);
  for (let yy = shoulder; yy < coatBottom; yy++) {
    const k = (yy - shoulder) / Math.max(1, coatBottom - shoulder);
    const half = 5 + wide + Math.round(k * (L.robe ? 4 : 2)) + (walking && yy > coatBottom - 6 ? (frame % 2) : 0);
    px(-half, yy, half * 2, 1, L.coat);
    px(half - 1, yy, 1, 1, rim); // rim light along the lit edge
  }
  if (L.clear) { ctx.globalAlpha *= 0.5; px(-7, shoulder, 14, coatBottom - shoulder, L.coatL); ctx.globalAlpha /= 0.5; }
  // lapel / light side panel
  px(1, shoulder + 1, 3 + wide, Math.max(2, coatBottom - shoulder - 2), L.coatL);
  if (L.collar) { px(-5 - wide, shoulder - 1, 11 + wide * 2, 3, L.collar); px(-4, shoulder + 2, 3, 3, L.collar); }
  // arms
  const sw = walking ? [0, 1, 0, -1][frame % 4] : 0;
  if (pose === 'aim') { px(4 + wide, shoulder + 2, 10, 2, L.coat); px(13 + wide, shoulder + 1, 4, 3, '#111'); }
  else if (pose === 'kneel') { /* handled by caller */ }
  else {
    px(-7 - wide, shoulder + 1 + sw, 2, 13, L.coat); px(-7 - wide, shoulder + 14 + sw, 2, 2, L.skin);
    px(5 + wide, shoulder + 1 - sw, 2, 13, L.coat); px(6 + wide, shoulder + 1 - sw, 1, 13, rim); px(5 + wide, shoulder + 14 - sw, 2, 2, L.skin);
  }
  if (L.cane) px(9, shoulder + 14, 1, -shoulder - 14, '#8a6a3a');
  // head
  const hx = -3 + stoop, hy = top + 2 + stoop;
  px(hx, hy, 7, 8, L.skin);
  px(hx + 6, hy + 1, 1, 6, rim);
  px(hx + 1, hy + 8, 5, 2, L.skin);
  if (L.blind) px(hx + 4, hy + 3, 2, 1, '#f8f8f0'); else px(hx + 4, hy + 3, 1, 1, '#141010');
  if (L.glasses) px(hx + 3, hy + 3, 4, 1, '#3a3a3a');
  if (L.eyepatch) px(hx + 3, hy + 2, 3, 3, '#0a0a0a');
  if (L.mask) px(hx + 2, hy + 5, 5, 3, '#2a2a28');
  if (L.beard) px(hx + 1, hy + 6, 6, 3, L.beard);
  const hc = L.hair;
  switch (L.hairStyle) {
    case 'short': px(hx - 1, hy - 1, 8, 3, hc); px(hx - 1, hy + 2, 2, 3, hc); break;
    case 'slick': px(hx - 1, hy - 1, 8, 2, hc); px(hx - 1, hy + 1, 2, 5, hc); break;
    case 'bald': px(hx, hy, 2, 3, hc); break;
    case 'bob': px(hx - 2, hy - 1, 10, 3, hc); px(hx - 2, hy + 2, 3, 7, hc); px(hx + 5, hy + 2, 2, 2, hc); break;
    case 'bobsharp': px(hx - 2, hy - 1, 10, 3, hc); px(hx - 2, hy + 2, 3, 8, hc); px(hx + 6, hy + 2, 2, 8, hc); break;
    case 'tied': px(hx - 1, hy - 1, 8, 3, hc); px(hx - 3, hy, 3, 3, hc); break;
    case 'bun': px(hx - 1, hy - 1, 8, 3, hc); px(hx - 1, hy + 2, 2, 6, hc); px(hx - 4, hy - 2, 4, 4, hc); break;
    case 'long': px(hx - 2, hy - 1, 9, 3, hc); px(hx - 2, hy + 2, 3, 12, hc); break;
    case 'hood': px(hx - 2, hy - 2, 10, 4, L.coat); px(hx - 2, hy + 2, 3, 9, L.coat); break;
    case 'helmet': px(hx - 2, hy - 2, 10, 6, '#1a1d22'); px(hx + 3, hy + 2, 5, 2, PAL.teal); break;
  }
  ctx.restore();
}

export function drawDog(ctx, x, y, t, dir = 1) {
  const px = (dx, dy, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(dir > 0 ? x + dx : x - dx - w, y + dy, w, h); };
  const wag = Math.floor(t * 8) % 2;
  px(-8, -10, 14, 6, '#6a5a44'); px(4, -14, 6, 6, '#6a5a44'); px(8, -12, 3, 3, '#4a3e30');
  px(-7, -4, 2, 4, '#5a4a38'); px(-2, -4, 2, 4, '#5a4a38'); px(1, -4, 2, 4, '#5a4a38'); px(4, -4, 2, 4, '#5a4a38');
  px(-11, -11 - wag, 3, 2, '#6a5a44'); px(7, -12, 1, 1, '#111');
}

export function drawPortrait(canvas, look, t, tint) {
  const c = canvas.getContext('2d');
  c.imageSmoothingEnabled = false;
  const g = c.createLinearGradient(0, 0, 0, 32);
  g.addColorStop(0, '#0a0d0f'); g.addColorStop(1, tint || '#2a1a10');
  c.fillStyle = g; c.fillRect(0, 0, 32, 32);
  if (!look) { c.fillStyle = PAL.amber; c.fillRect(14, 10, 4, 12); return; }
  const L = CAST[look];
  const tmp = document.createElement('canvas'); tmp.width = 24; tmp.height = 24;
  drawFigure(tmp.getContext('2d'), L, 12, L.h + 4, { dir: 1, t, rim: PAL.amber });
  c.drawImage(tmp, 2, 0, 20, 20, 1, 3, 30, 30);
  c.fillStyle = 'rgba(0,0,0,0.18)'; for (let y = 0; y < 32; y += 2) c.fillRect(0, y, 32, 1);
}

// ---------------------------------------------------------------- post-processing
const grains = [];
function grainFrames() {
  if (grains.length) return grains;
  for (let k = 0; k < 4; k++) {
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const x = c.getContext('2d'), img = x.createImageData(W, H), d = img.data;
    for (let i = 0; i < d.length; i += 4) { const v = Math.random() * 255; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = Math.random() < 0.5 ? 18 : 0; }
    x.putImageData(img, 0, 0); grains.push(c);
  }
  return grains;
}
export function postFx(ctx, t, { grade = null, gradeA = 0.18, vignette = 0.55 } = {}) {
  if (grade) { ctx.save(); ctx.globalCompositeOperation = 'soft-light'; ctx.globalAlpha = gradeA; ctx.fillStyle = grade; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  const v = cached('vig' + vignette, W, H, (x) => {
    const g = x.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, W * 0.62);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${vignette})`);
    x.fillStyle = g; x.fillRect(0, 0, W, H);
  });
  ctx.drawImage(v, 0, 0);
  ctx.drawImage(grainFrames()[Math.floor(t * 24) % 4], 0, 0);
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, LB); ctx.fillRect(0, H - LB, W, LB);
}

// wet-floor reflection (resolution independent)
export function reflect(ctx, floorY, strength = 0.22) {
  const h = H - floorY;
  ctx.save(); ctx.globalAlpha = strength; ctx.translate(0, floorY * 2); ctx.scale(1, -1);
  ctx.drawImage(ctx.canvas, 0, floorY - h, W, h, 0, floorY - h, W, h);
  ctx.restore();
}

// ---------------------------------------------------------------- props
export function deadTree(ctx, x, y, t) {
  ctx.strokeStyle = '#2a2622'; ctx.lineCap = 'square';
  const branch = (bx, by, len, ang, w, d) => {
    if (d > 6 || len < 3) return;
    const ex = bx + Math.cos(ang) * len, ey = by + Math.sin(ang) * len;
    ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(ex, ey); ctx.stroke();
    const r = rng(d * 97 + Math.round(len) * 7);
    branch(ex, ey, len * 0.72, ang - 0.4 - r() * 0.3, Math.max(1, w * 0.65), d + 1);
    branch(ex, ey, len * 0.66, ang + 0.35 + r() * 0.3, Math.max(1, w * 0.6), d + 1);
  };
  branch(x, y, 34, -Math.PI / 2, 6, 0);
}
export function flower(ctx, x, y, t) {
  ctx.fillStyle = '#3a5a2a'; ctx.fillRect(x, y - 6, 1, 6);
  ctx.fillStyle = '#f2e6c8'; ctx.fillRect(x - 1, y - 8, 3, 2); ctx.fillStyle = '#e8c040'; ctx.fillRect(x, y - 8, 1, 1);
}
export function unicornCarving(ctx, x, y) {
  ctx.fillStyle = '#8a6a44';
  ctx.fillRect(x, y + 3, 8, 4); ctx.fillRect(x + 6, y, 3, 4); ctx.fillRect(x + 9, y - 2, 1, 2);
  ctx.fillRect(x, y + 7, 1, 3); ctx.fillRect(x + 6, y + 7, 1, 3);
  ctx.fillStyle = '#6a4e30'; ctx.fillRect(x + 1, y + 4, 5, 1);
}
export function spinner2(ctx, x, y, t, dir = 1, lights = true) {
  // angular 2049 police spinner
  const px = (dx, dy, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(dir > 0 ? x + dx : x - dx - w, y + dy, w, h); };
  px(-20, -6, 40, 7, '#23272c'); px(-14, -12, 24, 7, '#1a1d21'); px(-10, -11, 14, 4, 'rgba(160,220,230,0.35)');
  px(-22, -2, 44, 2, '#101214'); px(14, -4, 8, 2, '#d8d8d0');
  if (lights) { px(-6, -13, 4, 1, Math.floor(t * 5) % 2 ? '#ff3b30' : '#3b7bff'); px(18, -4, 4, 1, '#fff5d0'); }
}
