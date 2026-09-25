// Procedural pixel art: every building, sign, character and raindrop is drawn in code.

export const W = 320, H = 180;

export const PAL = {
  night: '#07060d', sky1: '#140a24', sky2: '#2a0f33', smog: '#3b1a3a',
  amber: '#f5b14a', pink: '#ff2e88', cyan: '#38e1ff', green: '#7dffa1', red: '#ff4a3d', violet: '#a66bff',
  white: '#e9e3d0', steel: '#4a4a63', steelD: '#23223a', floor: '#15131f',
};

// ---------- seeded RNG so the city looks the same on every visit ----------
export function rng(seed) {
  let s = seed >>> 0;
  return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// ---------- 3x5 pixel font for crisp neon signage ----------
const GLYPHS = {
  A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111',
  F: '111100110100100', G: '011100101101011', H: '101101111101101', I: '111010010010111', J: '001001001101010',
  K: '101101110101101', L: '100100100100111', M: '101111111101101', N: '110101101101101', O: '010101101101010',
  P: '110101110100100', Q: '010101101110011', R: '110101110101101', S: '011100010001110', T: '111010010010010',
  U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101', Y: '101101010010010',
  Z: '111001010100111', 0: '111101101101111', 1: '010110010010111', 2: '110001010100111', 3: '110001010001110',
  4: '101101111001001', 5: '111100110001110', 6: '011100111101111', 7: '111001010010010', 8: '111101111101111',
  9: '111101111001110', '-': '000000111000000', '.': '000000000000010', '!': '010010010000010', "'": '010010000000000',
  ':': '000010000010000', '/': '001001010100100', '?': '110001010000010', '+': '000010111010000', ' ': '000000000000000',
  '♥': '000101111111010', '*': '000101010101000',
};
export function pxText(ctx, str, x, y, color, scale = 1, glow = 0) {
  ctx.save();
  ctx.fillStyle = color;
  if (glow) { ctx.shadowColor = color; ctx.shadowBlur = glow; }
  let cx = x;
  for (const ch of str.toUpperCase()) {
    const g = GLYPHS[ch] || GLYPHS[' '];
    for (let i = 0; i < 15; i++) if (g[i] === '1') ctx.fillRect(cx + (i % 3) * scale, y + Math.floor(i / 3) * scale, scale, scale);
    cx += 4 * scale;
  }
  ctx.restore();
  return cx - x;
}
export const pxWidth = (str, scale = 1) => str.length * 4 * scale - scale;

// vertical text (like hanging signs)
export function pxTextV(ctx, str, x, y, color, glow = 0) {
  [...str].forEach((c, i) => pxText(ctx, c, x, y + i * 6, color, 1, glow));
}

// ---------- sky & skyline ----------
export function sky(ctx, top = PAL.sky1, bottom = PAL.sky2) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#05040a'); g.addColorStop(0.45, top); g.addColorStop(1, bottom);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}

const skylineCache = new Map();
function buildSkyline(seed, width, minH, maxH, color, windowOdds) {
  const key = [seed, width, minH, maxH, color, windowOdds].join();
  if (skylineCache.has(key)) return skylineCache.get(key);
  const r = rng(seed), blds = [];
  let x = -10;
  while (x < width + 20) {
    const w = 10 + Math.floor(r() * 26), h = minH + Math.floor(r() * (maxH - minH));
    const b = { x, w, h, windows: [], antenna: r() < 0.3, beacon: r() < 0.25, top: Math.floor(r() * 3) };
    for (let wy = 4; wy < h - 2; wy += 3) for (let wx = 2; wx < w - 2; wx += 3)
      if (r() < windowOdds) b.windows.push([wx, wy, r() < 0.75 ? 0 : r() < 0.5 ? 1 : 2, r()]);
    blds.push(b);
    x += w + Math.floor(r() * 3);
  }
  const out = { blds, color };
  skylineCache.set(key, out);
  return out;
}
const WIN = ['#f5b14a', '#38e1ff', '#ff2e88'];
export function skyline(ctx, camX, par, seed, baseY, minH, maxH, color, t, windowOdds = 0.18) {
  const span = 900;
  const sk = buildSkyline(seed, span, minH, maxH, color, windowOdds);
  const off = -((camX * par) % span);
  for (const rep of [0, span]) {
    for (const b of sk.blds) {
      const x = Math.floor(b.x + off + rep);
      if (x > W || x + b.w < 0) continue;
      ctx.fillStyle = color;
      ctx.fillRect(x, baseY - b.h, b.w, b.h);
      if (b.top === 1) ctx.fillRect(x + 2, baseY - b.h - 3, b.w - 4, 3);
      if (b.top === 2) { ctx.fillRect(x + b.w / 2 - 1, baseY - b.h - 6, 3, 6); }
      if (b.antenna) ctx.fillRect(x + 3, baseY - b.h - 9, 1, 9);
      if (b.beacon && Math.floor(t * 1.5 + b.x) % 2) { ctx.fillStyle = PAL.red; ctx.fillRect(x + 3, baseY - b.h - 10, 1, 1); }
      for (const [wx, wy, c, ph] of b.windows) {
        if (Math.sin(t * 0.3 + ph * 50) > 0.92) continue;
        ctx.globalAlpha = 0.35 + ph * 0.5;
        ctx.fillStyle = WIN[c];
        ctx.fillRect(x + wx, baseY - b.h + wy, 1, 1);
      }
      ctx.globalAlpha = 1;
    }
  }
}

// the corporation's ziggurat, glowing in the distance
export function pyramid(ctx, x, baseY, size, t) {
  ctx.fillStyle = '#120d1c';
  for (let i = 0; i < size; i += 2) ctx.fillRect(x - size + i, baseY - i, (size - i) * 2, 2);
  for (let i = 4; i < size - 4; i += 6) {
    ctx.fillStyle = i % 12 === 4 ? '#f5b14a' : '#8a5a22';
    ctx.globalAlpha = 0.5 + 0.2 * Math.sin(t + i);
    for (let j = x - size + i + 2; j < x + size - i - 2; j += 3) ctx.fillRect(j, baseY - i, 2, 1);
  }
  ctx.globalAlpha = 1;
  // searchlights
  ctx.save();
  ctx.globalAlpha = 0.07;
  ctx.fillStyle = '#ffe9b0';
  for (let k = 0; k < 2; k++) {
    const a = Math.sin(t * 0.4 + k * 2) * 0.5 - Math.PI / 2;
    ctx.beginPath(); ctx.moveTo(x, baseY - size + 4);
    ctx.lineTo(x + Math.cos(a - 0.05) * 300, baseY - size + Math.sin(a - 0.05) * 300);
    ctx.lineTo(x + Math.cos(a + 0.05) * 300, baseY - size + Math.sin(a + 0.05) * 300);
    ctx.fill();
  }
  ctx.restore();
}

// industrial flare stacks
export function flares(ctx, xs, baseY, t) {
  for (const [i, x] of xs.entries()) {
    ctx.fillStyle = '#0d0a14'; ctx.fillRect(x, baseY - 26, 3, 26);
    const burst = Math.sin(t * 0.7 + i * 1.7);
    const h = burst > 0.6 ? 10 + Math.random() * 8 : 3 + Math.random() * 2;
    const g = ctx.createRadialGradient(x + 1, baseY - 27 - h / 2, 0, x + 1, baseY - 27 - h / 2, h * 1.8);
    g.addColorStop(0, '#fff3c0'); g.addColorStop(0.3, '#ff9a2e'); g.addColorStop(1, 'rgba(255,60,0,0)');
    ctx.fillStyle = g; ctx.fillRect(x - h * 2, baseY - 27 - h * 2.5, h * 4 + 3, h * 3);
  }
}

// flying cars crossing the sky
export function spinners(ctx, t, seed = 1, count = 4) {
  const r = rng(seed);
  for (let i = 0; i < count; i++) {
    const speed = 12 + r() * 30, y = 20 + r() * 60, dir = r() < 0.5 ? 1 : -1, ph = r() * 400;
    const x = dir > 0 ? ((t * speed + ph) % 420) - 50 : W + 50 - ((t * speed + ph) % 420);
    const s = y < 45 ? 1 : 2;
    ctx.fillStyle = '#1c1a2c'; ctx.fillRect(x, y, 5 * s, 2 * s);
    ctx.fillStyle = '#fff5d0'; ctx.fillRect(dir > 0 ? x + 5 * s : x - 1, y + s - 1, 1, 1);
    ctx.fillStyle = Math.floor(t * 4 + i) % 2 ? PAL.red : PAL.cyan; ctx.fillRect(x + 2 * s, y - 1, 1, 1);
  }
}

// advertising blimp with scrolling message
export function blimp(ctx, t, camX, msg) {
  const x = ((t * 6 - camX * 0.15) % 560 + 560) % 560 - 120, y = 24;
  ctx.fillStyle = '#1b1828';
  ctx.beginPath(); ctx.ellipse(x + 40, y + 9, 42, 10, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillRect(x + 30, y + 18, 20, 4);
  // screen
  ctx.fillStyle = '#0a0812'; ctx.fillRect(x + 12, y + 4, 56, 9);
  ctx.save(); ctx.beginPath(); ctx.rect(x + 13, y + 5, 54, 7); ctx.clip();
  const w = pxWidth(msg);
  pxText(ctx, msg, x + 67 - ((t * 14) % (w + 56)), y + 6, PAL.pink, 1, 4);
  ctx.restore();
  // light beams downward
  ctx.globalAlpha = 0.05; ctx.fillStyle = '#bfe8ff';
  ctx.beginPath(); ctx.moveTo(x + 36, y + 20); ctx.lineTo(x + 10, H); ctx.lineTo(x + 70, H); ctx.closePath(); ctx.fill();
  ctx.globalAlpha = 1;
  for (let i = 0; i < 6; i++) if (Math.floor(t * 3 + i) % 3 === 0) { ctx.fillStyle = PAL.amber; ctx.fillRect(x + 8 + i * 12, y + 17, 1, 1); }
  return { x, y, w: 84, h: 22 };
}

// neon sign with occasional flicker
export function neon(ctx, text, x, y, color, t, { scale = 1, box = true, flicker = 0.02, vertical = false } = {}) {
  const off = Math.sin(t * 13 + x) > 1 - flicker * 2 && Math.sin(t * 3.7 + y) > 0.5;
  const c = off ? '#3a2233' : color;
  if (vertical) {
    const h = text.length * 6 + 3;
    if (box) { ctx.fillStyle = '#0c0a14'; ctx.fillRect(x - 2, y - 2, 7, h); ctx.strokeStyle = off ? '#2a1a28' : color; ctx.globalAlpha = 0.6; ctx.strokeRect(x - 2.5, y - 2.5, 8, h + 1); ctx.globalAlpha = 1; }
    pxTextV(ctx, text, x, y, c, off ? 0 : 6);
    return;
  }
  const w = pxWidth(text, scale);
  if (box) {
    ctx.fillStyle = '#0c0a14'; ctx.fillRect(x - 3, y - 3, w + 6, 5 * scale + 6);
    ctx.strokeStyle = off ? '#2a1a28' : color; ctx.globalAlpha = 0.6; ctx.strokeRect(x - 3.5, y - 3.5, w + 7, 5 * scale + 7); ctx.globalAlpha = 1;
  }
  pxText(ctx, text, x, y, c, scale, off ? 0 : 6);
  if (!off) { ctx.globalAlpha = 0.12; ctx.fillStyle = color; ctx.fillRect(x - 8, y - 8, w + 16, 5 * scale + 16); ctx.globalAlpha = 1; }
}

// ---------- rain ----------
export class Rain {
  constructor(n = 180) {
    const r = rng(7);
    this.drops = Array.from({ length: n }, () => ({ x: r() * W, y: r() * H, s: 180 + r() * 140, l: 3 + r() * 5, z: r() }));
    this.splashes = [];
  }
  draw(ctx, dt, floorY, intensity = 1, wind = -0.25) {
    ctx.save();
    ctx.lineWidth = 1;
    const n = Math.floor(this.drops.length * intensity);
    for (let i = 0; i < n; i++) {
      const d = this.drops[i];
      d.y += d.s * dt; d.x += d.s * wind * dt;
      if (d.y > floorY + d.z * 14) {
        if (floorY < H && Math.random() < 0.3) this.splashes.push({ x: d.x, y: floorY + d.z * 14, t: 0 });
        d.y = -10 - Math.random() * 40; d.x = Math.random() * (W + 60);
      }
      if (d.x < -10) d.x += W + 20;
      ctx.strokeStyle = `rgba(170, 200, 255, ${0.18 + d.z * 0.3})`;
      ctx.beginPath(); ctx.moveTo(d.x + 0.5, d.y); ctx.lineTo(d.x + 0.5 + d.l * wind, d.y + d.l); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(190, 215, 255, 0.5)';
    this.splashes = this.splashes.filter((s) => (s.t += dt) < 0.18);
    for (const s of this.splashes) { const k = s.t * 22; ctx.fillRect(s.x - k, s.y - 1, 1, 1); ctx.fillRect(s.x + k, s.y - 1, 1, 1); }
    ctx.restore();
  }
}

// mirror the scene above the floor onto wet pavement
export function reflect(ctx, floorY, strength = 0.28) {
  const W = ctx.canvas.width, H = ctx.canvas.height;
  const h = H - floorY;
  if (h <= 0) return;
  ctx.save();
  ctx.globalAlpha = strength;
  ctx.translate(0, floorY * 2);
  ctx.scale(1, -1);
  ctx.drawImage(ctx.canvas, 0, floorY - h, W, h, 0, floorY - h, W, h);
  ctx.restore();
  // ripple lines
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  for (let y = floorY + 2; y < H; y += 3) ctx.fillRect(0, y, W, 1);
}

// ---------- characters ----------
// Every person is assembled from a small set of parts so one routine can draw
// the whole cast. `look` describes clothes/hair; `frame` animates legs & arms.
export const CAST = {
  runner:  { skin: '#d7a582', hair: '#3a2718', hairStyle: 'short', coat: '#5b4a36', coatD: '#3d3124', shirt: '#b9b09a', tie: '#6b2020', legs: '#2b2620', coatLen: 20, h: 30 },
  moreno:  { skin: '#c48c62', hair: '#1c1c1c', hairStyle: 'slick', coat: '#3a3f4f', coatD: '#262a36', shirt: '#d8d2c0', tie: '#a2322a', legs: '#1e1f28', coatLen: 16, h: 31, hat: '#2a2a34', cane: true },
  captain: { skin: '#d8a88a', hair: '#8c8579', hairStyle: 'bald', coat: '#4a3d33', coatD: '#352b24', shirt: '#cfc7b2', tie: '#2d3a52', legs: '#2f2a26', coatLen: 10, h: 28, wide: true },
  iris:    { skin: '#efd3be', hair: '#140e0c', hairStyle: 'bun', coat: '#2a2226', coatD: '#1a1416', shirt: '#2a2226', tie: null, legs: '#1c1718', coatLen: 22, h: 29, shoulders: true, lips: '#b3243a' },
  vance:   { skin: '#e6c4a8', hair: '#d8d2c8', hairStyle: 'short', coat: '#e7e2d6', coatD: '#b9b2a4', shirt: '#e7e2d6', tie: null, legs: '#b9b2a4', coatLen: 24, h: 28, glasses: true, robe: true },
  brick:   { skin: '#c9a07c', hair: '#4a3522', hairStyle: 'short', coat: '#6d6a5a', coatD: '#4b493d', shirt: '#8b8674', tie: null, legs: '#3b3a31', coatLen: 12, h: 32, wide: true },
  sable:   { skin: '#e9c7a8', hair: '#c83a2c', hairStyle: 'bob', coat: '#9ad8e8', coatD: '#6db2c6', shirt: '#1a1a1a', tie: null, legs: '#e9c7a8', coatLen: 14, h: 29, clear: true },
  wren:    { skin: '#f0dccd', hair: '#e8d9a0', hairStyle: 'punk', coat: '#2a2a2a', coatD: '#161616', shirt: '#2a2a2a', tie: null, legs: '#e0cfc0', coatLen: 6, h: 27, mask: true },
  kaspar:  { skin: '#ecd0b8', hair: '#f2ecd8', hairStyle: 'crop', coat: '#1c1c22', coatD: '#101014', shirt: '#1c1c22', tie: null, legs: '#15151a', coatLen: 16, h: 33, wide: true },
  pell:    { skin: '#e2b996', hair: '#7a5a3a', hairStyle: 'short', coat: '#6a5a4a', coatD: '#4a3e32', shirt: '#8e8e70', tie: null, legs: '#3a3228', coatLen: 18, h: 27, stoop: true },
  chef:    { skin: '#d9b08a', hair: '#1b1b1b', hairStyle: 'cap', coat: '#dcd6c8', coatD: '#b8b2a4', shirt: '#dcd6c8', tie: null, legs: '#2a2a2a', coatLen: 8, h: 27 },
  hsu:     { skin: '#d8b28e', hair: '#e2e2e2', hairStyle: 'bald', coat: '#6a4a2c', coatD: '#4a3420', shirt: '#6a4a2c', tie: null, legs: '#3a2a1c', coatLen: 24, h: 26, goggles: true, robe: true },
  kato:    { skin: '#e0b894', hair: '#555', hairStyle: 'bun', coat: '#5a2a3a', coatD: '#3a1a26', shirt: '#5a2a3a', tie: null, legs: '#2a1a1a', coatLen: 22, h: 25, robe: true },
  punk:    { skin: '#c89a78', hair: '#38e1ff', hairStyle: 'punk', coat: '#2c1d38', coatD: '#1a1024', shirt: '#2c1d38', tie: null, legs: '#1a1024', coatLen: 12, h: 29, umbrella: '#ff2e88' },
  monk:    { skin: '#c89a78', hair: '#222', hairStyle: 'bald', coat: '#c8762a', coatD: '#99561a', shirt: '#c8762a', tie: null, legs: '#99561a', coatLen: 26, h: 28, robe: true },
  walker:  { skin: '#b88c68', hair: '#222', hairStyle: 'hood', coat: '#2a3a3a', coatD: '#1a2626', shirt: '#2a3a3a', tie: null, legs: '#1a1a1a', coatLen: 20, h: 29, umbrella: '#38e1ff' },
};

export function drawPerson(ctx, look, x, y, { dir = 1, frame = 0, walking = false, t = 0, pose = null } = {}) {
  // (x, y) = feet centre on the floor
  const L = look, h = L.h, wide = L.wide ? 1 : 0;
  x = Math.round(x); y = Math.round(y);
  const px = (dx, dy, w, hh, c) => { ctx.fillStyle = c; ctx.fillRect(dir > 0 ? x + dx : x - dx - w, y + dy, w, hh); };
  const step = walking ? [0, 1, 0, -1][frame % 4] : 0;
  const bob = walking && frame % 2 ? -1 : 0;
  const breathe = !walking && Math.sin(t * 2) > 0.6 ? -0 : 0;
  const top = -h + bob + breathe;
  const stoop = L.stoop ? 1 : 0;

  // shadow
  ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(x - 6, y - 1, 12, 2);

  // legs
  const legTop = top + 18;
  const legH = h - 18;
  if (!L.robe) {
    px(-3 + step, legTop, 2, legH - 1, L.legs);
    px(1 - step, legTop, 2, legH - 1, L.legs);
    px(-3 + step, -2, 3, 2, '#111'); px(1 - step, -2, 3, 2, '#111');
  } else {
    px(-2 + step, -2, 2, 2, '#111'); px(1 - step, -2, 2, 2, '#111');
  }
  // body / coat
  const bodyW = 8 + wide * 2;
  px(-4 - wide, top + 8, bodyW, 11, L.shirt);
  if (L.tie) px(0, top + 9, 1, 6, L.tie);
  const coatBottom = Math.min(top + 8 + L.coatLen, -3);
  const flap = walking ? (frame % 2 ? 1 : 0) : 0;
  px(-4 - wide, top + 8, 2 + (L.shoulders ? 1 : 0), coatBottom - (top + 8), L.coat);
  px(2 + wide - (L.shoulders ? 1 : 0), top + 8, 2 + (L.shoulders ? 1 : 0), coatBottom - (top + 8), L.coatD);
  if (L.coatLen > 12 || L.robe) {
    px(-5 - wide - flap, top + 18, 2, coatBottom - (top + 18), L.coatD);
    px(3 + wide + flap, top + 18, 2, coatBottom - (top + 18), L.coat);
    if (L.robe) px(-4 - wide, top + 8, bodyW, coatBottom - (top + 8), L.coat);
  }
  if (L.shoulders) { px(-6, top + 8, 12, 2, L.coat); }
  if (L.clear) { ctx.globalAlpha = 0.5; px(-5, top + 8, 10, 16, L.coat); ctx.globalAlpha = 1; }
  // collar
  px(-3 - wide, top + 7, 2, 2, L.coatD); px(1 + wide, top + 7, 2, 2, L.coatD);
  // arms
  const swing = walking ? [0, 1, 0, -1][frame % 4] : 0;
  if (pose === 'aim') {
    px(2, top + 10, 8, 2, L.coat); px(10, top + 9, 3, 2, '#222'); px(9, top + 10, 1, 2, L.skin);
  } else if (pose === 'reach') {
    px(2, top + 7, 2, 2, L.coat); px(3, top + 3, 2, 5, L.coat); px(3, top + 1, 2, 2, L.skin);
  } else {
    px(-5 - wide, top + 9 + swing, 2, 8, L.coatD); px(-5 - wide, top + 17 + swing, 2, 2, L.skin);
    px(3 + wide, top + 9 - swing, 2, 8, L.coat); px(3 + wide, top + 17 - swing, 2, 2, L.skin);
  }
  if (L.cane) px(6, top + 17, 1, h - 19, '#8a6a3a');
  // head
  const hx = -3 + stoop;
  px(hx, top + 1 + stoop, 6, 7, L.skin);
  px(hx + 4, top + 3 + stoop, 1, 1, '#1a1010'); // eye
  if (L.lips) px(hx + 4, top + 6 + stoop, 1, 1, L.lips);
  if (L.glasses) { px(hx + 3, top + 3 + stoop, 3, 1, '#9ab'); }
  if (L.goggles) { px(hx + 2, top + 2 + stoop, 4, 2, '#7dffa1'); }
  if (L.mask) { px(hx + 3, top + 2, 3, 2, '#111'); }
  // hair
  const hc = L.hair;
  switch (L.hairStyle) {
    case 'short': px(hx, top, 6, 2, hc); px(hx, top + 2, 2, 3, hc); break;
    case 'slick': px(hx - 1, top, 7, 2, hc); px(hx - 1, top + 2, 2, 4, hc); break;
    case 'bald': px(hx, top + 1, 2, 3, hc); break;
    case 'bun': px(hx - 1, top - 1, 7, 3, hc); px(hx - 1, top + 2, 2, 5, hc); px(hx - 3, top - 1, 3, 3, hc); break;
    case 'bob': px(hx - 1, top, 8, 2, hc); px(hx - 1, top + 2, 2, 6, hc); px(hx + 5, top + 2, 2, 3, hc); break;
    case 'punk': px(hx - 1, top - 2, 7, 3, hc); px(hx - 1, top + 1, 2, 6, hc); px(hx + 1, top - 3, 3, 1, hc); break;
    case 'crop': px(hx, top - 1, 6, 2, hc); px(hx, top + 1, 1, 2, hc); break;
    case 'cap': px(hx - 1, top - 1, 7, 3, '#e8e2d4'); break;
    case 'hood': px(hx - 1, top - 1, 8, 3, L.coat); px(hx - 1, top + 2, 2, 6, L.coat); break;
  }
  if (L.hat) { px(hx - 2, top - 1, 10, 1, L.hat); px(hx - 1, top - 3, 7, 2, L.hat); }
  if (L.umbrella) {
    const ux = dir > 0 ? x + 4 : x - 4;
    ctx.fillStyle = '#888'; ctx.fillRect(ux, y + top - 8, 1, 26);
    ctx.fillStyle = L.umbrella; ctx.shadowColor = L.umbrella; ctx.shadowBlur = 8;
    ctx.fillRect(ux - 1, y + top - 8, 3, 24);
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 0.35; ctx.beginPath(); ctx.moveTo(ux - 12, y + top - 6); ctx.quadraticCurveTo(ux, y + top - 18, ux + 12, y + top - 6); ctx.fill(); ctx.globalAlpha = 1;
  }
}

// dialogue portrait (32x32), drawn by scaling the head region of the sprite
export function drawPortrait(canvas, look, t = 0, tint = null) {
  const c = canvas.getContext('2d');
  c.imageSmoothingEnabled = false;
  c.fillStyle = '#05040a'; c.fillRect(0, 0, 32, 32);
  const g = c.createLinearGradient(0, 0, 0, 32); g.addColorStop(0, '#1a0f2a'); g.addColorStop(1, tint || '#3a1030');
  c.fillStyle = g; c.fillRect(0, 0, 32, 32);
  if (!look) { pxText(c, '?', 13, 13, PAL.amber); return; }
  const tmp = document.createElement('canvas'); tmp.width = 16; tmp.height = 16;
  const tc = tmp.getContext('2d');
  drawPerson(tc, look, 8, look.h + 3, { dir: 1, t });
  c.drawImage(tmp, 0, 0, 16, 16, 0, 2, 32, 32);
  // scanline
  c.fillStyle = 'rgba(0,0,0,0.25)'; for (let y = 0; y < 32; y += 2) c.fillRect(0, y, 32, 1);
}

// ---------- small props & creatures ----------
export function owl(ctx, x, y, t, blink) {
  ctx.fillStyle = '#6b5a44'; ctx.fillRect(x, y, 8, 10);
  ctx.fillStyle = '#8a7658'; ctx.fillRect(x + 1, y + 4, 6, 6);
  ctx.fillStyle = '#6b5a44'; ctx.fillRect(x - 1, y - 1, 2, 2); ctx.fillRect(x + 7, y - 1, 2, 2);
  const eye = blink ? '#6b5a44' : '#ffcf3a';
  ctx.fillStyle = eye; ctx.fillRect(x + 1, y + 2, 2, 2); ctx.fillRect(x + 5, y + 2, 2, 2);
  if (!blink) { ctx.fillStyle = '#000'; ctx.fillRect(x + 2, y + 3, 1, 1); ctx.fillRect(x + 5, y + 3, 1, 1); }
  ctx.fillStyle = '#e0b020'; ctx.fillRect(x + 3, y + 4, 2, 1);
  ctx.fillStyle = '#2a2018'; ctx.fillRect(x - 2, y + 10, 12, 1);
}
export function dove(ctx, x, y, t, flying = false) {
  const flap = flying ? Math.floor(t * 12) % 2 : 0;
  ctx.fillStyle = '#f2f2ee';
  ctx.fillRect(x, y, 5, 3); ctx.fillRect(x + 4, y - 1, 2, 2);
  if (flying) { ctx.fillRect(x + 1, y - (flap ? 3 : -2), 3, 2); }
  else ctx.fillRect(x + 1, y + 1, 3, 1);
  ctx.fillStyle = '#e0a040'; ctx.fillRect(x + 6, y, 1, 1);
}
export function origami(ctx, kind, x, y, t) {
  const glow = 0.5 + 0.5 * Math.sin(t * 4);
  ctx.save(); ctx.shadowColor = '#fff6d8'; ctx.shadowBlur = 3 + glow * 5;
  ctx.fillStyle = '#efe6cf';
  if (kind === 'chicken') { ctx.fillRect(x, y + 2, 5, 3); ctx.fillRect(x + 4, y, 2, 3); ctx.fillRect(x - 1, y + 1, 2, 2); }
  if (kind === 'matchman') { ctx.fillRect(x + 2, y, 2, 2); ctx.fillRect(x + 2, y + 2, 1, 4); ctx.fillRect(x, y + 3, 5, 1); ctx.fillRect(x + 1, y + 6, 1, 2); ctx.fillRect(x + 3, y + 6, 1, 2); }
  if (kind === 'unicorn') { ctx.fillRect(x, y + 3, 6, 3); ctx.fillRect(x + 5, y + 1, 2, 3); ctx.fillRect(x + 7, y - 1, 1, 2); ctx.fillRect(x, y + 6, 1, 2); ctx.fillRect(x + 5, y + 6, 1, 2); }
  ctx.restore();
}
export function snake(ctx, x, y, t) {
  for (let i = 0; i < 14; i++) {
    ctx.fillStyle = i % 2 ? '#3c6a2a' : '#5a8a3a';
    ctx.fillRect(x + i, y + Math.round(Math.sin(t * 3 + i * 0.6) * 2), 1, 2);
  }
  ctx.fillStyle = '#5a8a3a'; ctx.fillRect(x + 14, y + Math.round(Math.sin(t * 3 + 8.4) * 2) - 1, 2, 3);
}

// generic interior helpers
export function room(ctx, camX, width, wall, trim, floorY, floor = '#1a1622') {
  ctx.fillStyle = wall; ctx.fillRect(0, 0, W, floorY);
  ctx.fillStyle = trim; ctx.fillRect(0, floorY - 3, W, 3);
  ctx.fillStyle = floor; ctx.fillRect(0, floorY, W, H - floorY);
}
export function blinds(ctx, x, y, w, h, t, color = '#ffe8b0') {
  ctx.save();
  ctx.fillStyle = '#0a0812'; ctx.fillRect(x, y, w, h);
  ctx.globalAlpha = 0.5 + 0.15 * Math.sin(t * 0.8);
  for (let yy = 1; yy < h; yy += 3) { ctx.fillStyle = color; ctx.fillRect(x + 1, y + yy, w - 2, 1); }
  ctx.restore();
}
// sweeping searchlight through window blinds (casts stripes into the room)
export function sweep(ctx, t, floorY, color = 'rgba(255, 236, 190, 0.06)') {
  const x = ((t * 60) % (W + 400)) - 200;
  ctx.save(); ctx.fillStyle = color;
  for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(x + i * 9, 0); ctx.lineTo(x + i * 9 + 5, 0); ctx.lineTo(x + i * 9 + 60, floorY); ctx.lineTo(x + i * 9 + 50, floorY); ctx.fill(); }
  ctx.restore();
}
