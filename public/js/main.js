import { Sound } from './audio.js';
import { Input } from './input.js';
import * as A from './art.js';
import { SCENES, SPEAKERS, ITEMS, EGGS, CHAPTERS, DESTS, drawDream } from './scenes.js';
import { openEsper } from './esper.js';

const $ = (s) => document.querySelector(s);
const SAVE_KEY = 'neon-rain-save-v1', PREFS_KEY = 'neon-rain-prefs-v1';
const store = {
  get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode */ } },
  del(k) { try { localStorage.removeItem(k); } catch { /* ignore */ } },
};
const freshState = () => ({ scene: 'street', x: 120, flags: {}, items: [], eggs: [], chapter: 0, obj: CHAPTERS[0].o });
const SPEED = 58;

class Game {
  constructor() {
    this.canvas = $('#game');
    this.ctx = this.canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;
    this.sound = new Sound();
    this.input = new Input();
    this.rain = new A.Rain(200);
    this.t = 0; this.last = 0;
    this.state = freshState();
    this.player = { x: 120, dir: 1, frame: 0, ft: 0, walking: false, pose: null };
    this.cam = 0; this.fadeA = 1; this.fadeTarget = 1; this.fadeSpeed = 2; this.flashA = 0;
    this.busy = 0; this.mode = 'title';
    this.dlg = null; this.qteState = null; this.overlay = null; this.near = null;
    this.prefs = Object.assign({ music: true, sfx: true, crt: true, pad: matchMedia('(pointer: coarse)').matches }, store.get(PREFS_KEY) || {});
    this.bindUI();
    this.applyPrefs();
    this.scene = SCENES.street;
    requestAnimationFrame((ts) => this.frame(ts));
  }

  // ------------------------------------------------------------ state helpers
  flag(k) { return !!this.state.flags[k]; }
  setFlag(k, v = true) { this.state.flags[k] = v; this.save(); }
  has(id) { return this.state.items.includes(id); }
  hasEgg(id) { return this.state.eggs.includes(id); }
  give(id) {
    if (this.has(id)) return;
    this.state.items.push(id); this.sound.pickup();
    this.toast(`EVIDENCE ▸ ${ITEMS[id].name.toUpperCase()}`); this.save();
  }
  egg(id) {
    if (this.hasEgg(id)) return;
    this.state.eggs.push(id); this.sound.egg();
    this.toast(`★ SECRET ${this.state.eggs.length}/${Object.keys(EGGS).length} ▸ ${EGGS[id]}`, 3.2); this.save();
  }
  chapter(n) { this.state.chapter = n; this.objective(CHAPTERS[n].o); }
  objective(text) { this.state.obj = text; $('#objective').textContent = '◆ ' + text.toUpperCase(); this.save(); }
  obj(id) { return this.scene.objects.find((o) => o.id === id); }
  save() { if (this.mode !== 'title') store.set(SAVE_KEY, { ...this.state, scene: this.sceneId, x: Math.round(this.player.x) }); }

  // ------------------------------------------------------------ flow helpers
  wait(s) { return new Promise((r) => setTimeout(r, s * 1000)); }
  fade(to, speed = 2) { this.fadeTarget = to; this.fadeSpeed = speed; return new Promise((r) => { const chk = () => (Math.abs(this.fadeA - to) < 0.01 ? r() : requestAnimationFrame(chk)); chk(); }); }
  flash(a = 1) { this.flashA = a; }
  shake(s) { const c = this.canvas; c.animate([{ transform: 'translate(3px,-2px)' }, { transform: 'translate(-3px,2px)' }, { transform: 'translate(2px,1px)' }, { transform: 'none' }], { duration: s * 1000, iterations: 1, easing: 'steps(6)' }); }
  toast(msg, secs = 2.4) {
    const el = $('#toast'); el.textContent = msg; el.hidden = false;
    clearTimeout(this.toastT); this.toastT = setTimeout(() => (el.hidden = true), secs * 1000);
  }

  async goto(id, x) {
    this.busy++;
    try {
      await this.fade(1, 3);
      this.enterScene(id, x);
      await this.fade(0, 2);
    } finally { this.busy--; }
    if (this.scene.onEnter) await this.script(() => this.scene.onEnter(this));
  }
  enterScene(id, x) {
    this.sceneId = id; this.scene = SCENES[id];
    this.player.x = x ?? this.scene.spawn; this.player.walking = false;
    this.cam = this.clampCam(this.player.x - A.W / 2);
    this.sound.setMood(this.scene.mood);
    this.sound.setRain(this.scene.rain ? Math.min(1, this.scene.rain) : 0.12);
    $('#location').textContent = this.scene.name;
    this.save();
  }
  clampCam(c) { return Math.max(0, Math.min(this.scene.width - A.W, c)); }

  async script(fn) {
    this.busy++;
    try { await fn(); } catch (e) { console.error(e); } finally { this.busy--; this.save(); }
  }

  walk(o, x) {
    return new Promise((res) => { o.target = x; o.onArrive = res; o.speed ||= 40; });
  }

  // ------------------------------------------------------------ dialogue
  async say(who, text) {
    if (Array.isArray(text)) { for (const t of text) await this.say(who, t); return; }
    return new Promise((resolve) => {
      this.showSpeaker(who);
      const line = $('#line');
      $('#choices').hidden = true; $('#next').classList.add('off');
      this.dlg = { who, text, shown: 0, done: false, resolve, choices: null };
      line.textContent = '';
    });
  }
  choose(options, who = 'you') {
    return new Promise((resolve) => {
      if (!this.dlg || this.dlg.who !== who) this.showSpeaker(who);
      if (!this.dlg) $('#line').textContent = '';
      const list = $('#choices'); list.innerHTML = '';
      options.forEach((o, i) => {
        const li = document.createElement('li'), b = document.createElement('button');
        b.textContent = o; b.type = 'button';
        b.addEventListener('click', () => this.pickChoice(i));
        b.addEventListener('pointerenter', () => this.markChoice(i));
        li.append(b); list.append(li);
      });
      list.hidden = false; $('#next').classList.add('off');
      this.dlg = { who, text: '', shown: 0, done: true, resolve, choices: options, sel: 0 };
      this.markChoice(0);
    });
  }
  markChoice(i) {
    if (!this.dlg?.choices) return;
    this.dlg.sel = (i + this.dlg.choices.length) % this.dlg.choices.length;
    [...$('#choices').children].forEach((li, k) => li.firstChild.classList.toggle('sel', k === this.dlg.sel));
  }
  pickChoice(i) {
    if (!this.dlg?.choices) return;
    const r = this.dlg.resolve; this.sound.select();
    this.dlg = null; $('#dialogue').hidden = true;
    r(i);
  }
  showSpeaker(who) {
    const sp = SPEAKERS[who] || SPEAKERS.narrator;
    $('#dialogue').hidden = false;
    $('#speaker').textContent = sp.name;
    $('#dialogue').classList.toggle('narr', !sp.name);
    $('#portrait').style.display = sp.look || sp.tint ? '' : 'none';
    A.drawPortrait($('#portrait canvas'), sp.look ? A.CAST[sp.look] : null, this.t, sp.tint);
  }
  advance() {
    const d = this.dlg;
    if (!d || d.choices) return;
    if (!d.done) { d.shown = d.text.length; d.done = true; $('#line').textContent = d.text; $('#next').classList.remove('off'); return; }
    this.dlg = null; $('#dialogue').hidden = true; d.resolve();
  }
  tickDialogue(dt) {
    const d = this.dlg;
    if (!d || d.done) return;
    const before = Math.floor(d.shown);
    d.shown = Math.min(d.text.length, d.shown + dt * 48);
    const now = Math.floor(d.shown);
    if (now !== before) {
      $('#line').textContent = d.text.slice(0, now);
      if (now % 2 === 0 && d.text[now - 1] !== ' ') this.sound.blip((SPEAKERS[d.who] || SPEAKERS.narrator).pitch);
    }
    if (d.shown >= d.text.length) { d.done = true; $('#next').classList.remove('off'); }
  }

  async card(lines, hold = 2.5) {
    const el = $('#card');
    el.innerHTML = ''; lines.forEach((l) => { const p = document.createElement('p'); p.textContent = l; el.append(p); });
    el.classList.add('show');
    await this.wait(0.8 + hold);
    el.classList.remove('show');
    await this.wait(0.8);
  }

  qte(label, need, secs) {
    return new Promise((resolve) => { this.qteState = { label, need, got: 0, left: secs, total: secs, resolve }; });
  }
  tickQte(dt, presses) {
    const q = this.qteState; if (!q) return;
    for (const p of presses) if (p === 'a') { q.got++; this.sound.tone({ freq: 300 + q.got * 30, dur: 0.05, vol: 0.06 }); }
    q.left -= dt;
    if (q.got >= q.need || q.left <= 0) { this.qteState = null; q.resolve(q.got >= q.need); }
  }

  async esper() { $('#prompt').hidden = true; return openEsper(this); }
  async dream() {
    this.sound.setMood('love');
    await this.fade(1, 1);
    this.overlay = drawDream;
    await this.fade(0, 0.7);
    await this.wait(5);
    await this.fade(1, 1);
    this.overlay = null;
    await this.fade(0, 1);
    this.sound.setMood(this.scene.mood);
  }

  async travel() {
    const dests = DESTS.filter((d) => d.ok(this) && d.id !== this.sceneId);
    if (!dests.length) return this.say('narrator', 'Nowhere to go. Not yet.');
    const i = await this.choose([...dests.map((d) => '▸ ' + d.name), 'Stay here'], 'narrator');
    if (i >= dests.length) return;
    this.sound.spinner();
    await this.fade(1, 2);
    await this.card(['▲ SPINNER EN ROUTE', dests[i].name.toUpperCase()], 0.6);
    await this.goto(dests[i].id);
  }

  // ------------------------------------------------------------ UI / menus
  bindUI() {
    const tg = (id, key, fn) => $(id).addEventListener('click', () => { this.prefs[key] = !this.prefs[key]; this.applyPrefs(); fn?.(); });
    tg('#tgl-music', 'music'); tg('#tgl-sfx', 'sfx'); tg('#tgl-crt', 'crt'); tg('#tgl-pad', 'pad');
    $('#btn-menu').addEventListener('click', () => this.toggleMenu());
    $('#btn-new').addEventListener('click', () => this.start(false));
    $('#btn-continue').addEventListener('click', () => this.start(true));
    $('#btn-resume').addEventListener('click', () => this.toggleMenu(false));
    $('#btn-restart').addEventListener('click', () => { if (confirm('Restart the case from the beginning? Secrets found stay found.')) this.restart(); });
    $('#dialogue').addEventListener('click', (e) => { if (!e.target.closest('button')) this.advance(); });
    $('#btn-continue').hidden = !store.get(SAVE_KEY);
    this.titleSel = store.get(SAVE_KEY) ? 1 : 0;
    this.markTitle();
    this.input.on('konami', () => {
      document.body.classList.toggle('retro');
      this.egg('konami');
      this.toast(document.body.classList.contains('retro') ? 'AMBER TERMINAL MODE: ON' : 'AMBER TERMINAL MODE: OFF');
    });
    this.input.on('key', (e) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.code === 'KeyM') { this.prefs.music = !this.prefs.music; this.applyPrefs(); }
      if (e.code === 'KeyN') { this.prefs.sfx = !this.prefs.sfx; this.applyPrefs(); }
      if (e.code === 'KeyC') { this.prefs.crt = !this.prefs.crt; this.applyPrefs(); }
    });
    // any touch/click unlocks audio
    addEventListener('pointerdown', () => this.sound.unlock(), { once: false, passive: true });
    addEventListener('keydown', () => this.sound.unlock());
    this.canvas.addEventListener('click', () => { if (this.dlg) this.advance(); });
  }
  applyPrefs() {
    const p = this.prefs;
    const set = (id, v) => $(id).setAttribute('aria-pressed', String(v));
    set('#tgl-music', p.music); set('#tgl-sfx', p.sfx); set('#tgl-crt', p.crt); set('#tgl-pad', p.pad);
    document.body.classList.toggle('crt', p.crt);
    document.body.classList.toggle('pad-on', p.pad);
    this.sound.setMusic(p.music); this.sound.setSfx(p.sfx);
    store.set(PREFS_KEY, p);
  }
  markTitle() {
    const btns = [$('#btn-new'), $('#btn-continue')].filter((b) => !b.hidden);
    this.titleSel = Math.min(this.titleSel, btns.length - 1);
    btns.forEach((b, i) => b.classList.toggle('sel', i === this.titleSel));
    return btns;
  }

  start(cont) {
    this.sound.unlock();
    const saved = store.get(SAVE_KEY);
    const eggs = saved?.eggs || [];
    this.state = cont && saved ? Object.assign(freshState(), saved) : Object.assign(freshState(), { eggs });
    $('#title').hidden = true;
    this.mode = 'play';
    this.enterScene(this.state.scene, this.state.x);
    $('#objective').textContent = '◆ ' + this.state.obj.toUpperCase();
    this.fade(0, 1);
    if (this.scene.onEnter) this.script(() => this.scene.onEnter(this));
  }
  restart() {
    const eggs = this.state.eggs;
    store.del(SAVE_KEY);
    location.hash = '';
    this.state = Object.assign(freshState(), { eggs });
    store.set(SAVE_KEY, this.state);
    location.reload();
  }

  toggleMenu(force) {
    if (this.mode === 'title') return;
    const open = force ?? $('#menu').hidden;
    $('#menu').hidden = !open;
    this.mode = open ? 'menu' : 'play';
    this.menuSel = 0;
    if (!open) return;
    this.sound.select();
    const cf = $('#casefile'); cf.innerHTML = '';
    CHAPTERS.forEach((c, i) => {
      if (i > this.state.chapter) return;
      const li = document.createElement('li');
      li.className = i < this.state.chapter ? 'done' : 'cur';
      li.textContent = `${String(i + 1).padStart(2, '0')}. ${c.t}`;
      cf.append(li);
    });
    const inv = $('#inventory'); inv.innerHTML = '';
    if (!this.state.items.length) inv.innerHTML = '<li>— nothing yet —</li>';
    this.state.items.forEach((id) => { const li = document.createElement('li'); li.innerHTML = `${ITEMS[id].name}<span class="d"></span>`; li.querySelector('.d').textContent = ITEMS[id].desc; inv.append(li); });
    const eg = $('#eggs'); eg.innerHTML = '';
    Object.entries(EGGS).forEach(([id, name]) => { const li = document.createElement('li'); li.textContent = this.hasEgg(id) ? '★ ' + name : '☆ ???'; eg.append(li); });
    $('#egg-count').textContent = `${this.state.eggs.length}/${Object.keys(EGGS).length}`;
    this.markMenu();
  }
  markMenu() { [$('#btn-resume'), $('#btn-restart')].forEach((b, i) => b.classList.toggle('sel', i === this.menuSel)); }

  // ------------------------------------------------------------ main loop
  frame(ts) {
    const dt = Math.min(0.05, (ts - (this.last || ts)) / 1000);
    this.last = ts; this.t += dt;
    this.input.pollGamepads();
    const presses = this.input.take();
    this.update(dt, presses);
    this.draw(dt);
    requestAnimationFrame((t) => this.frame(t));
  }

  update(dt, presses) {
    // fades
    const f = this.fadeTarget - this.fadeA;
    this.fadeA += Math.sign(f) * Math.min(Math.abs(f), dt * this.fadeSpeed);
    this.flashA = Math.max(0, this.flashA - dt * 2.5);

    if (this.mode === 'title') {
      for (const p of presses) {
        if (p === 'left' || p === 'up') { this.titleSel = 0; this.markTitle(); }
        if (p === 'right' || p === 'down') { this.titleSel = 1; this.markTitle(); }
        if (p === 'a') { const b = this.markTitle()[this.titleSel]; b?.click(); }
      }
      return;
    }
    if (this.mode === 'menu') {
      for (const p of presses) {
        if (p === 'b') this.toggleMenu(false);
        if (p === 'left' || p === 'right' || p === 'up' || p === 'down') { this.menuSel = 1 - this.menuSel; this.markMenu(); }
        if (p === 'a') (this.menuSel ? $('#btn-restart') : $('#btn-resume')).click();
      }
      return;
    }

    this.updateNpcs(dt);
    this.tickDialogue(dt);
    if (this.qteState) { this.tickQte(dt, presses); this.player.walking = false; return; }

    if (this.dlg) {
      for (const p of presses) {
        if (this.dlg?.choices) {
          if (p === 'up') this.markChoice(this.dlg.sel - 1);
          if (p === 'down') this.markChoice(this.dlg.sel + 1);
          if (p === 'a') this.pickChoice(this.dlg.sel);
        } else if (p === 'a' || p === 'b') this.advance();
      }
      this.player.walking = false;
      $('#prompt').hidden = true;
      return;
    }
    if (this.busy) { this.player.walking = false; $('#prompt').hidden = true; this.followCam(dt); return; }

    // movement
    const pl = this.player;
    const dx = (this.input.isHeld('right') ? 1 : 0) - (this.input.isHeld('left') ? 1 : 0);
    pl.walking = dx !== 0;
    if (dx) {
      pl.dir = dx;
      pl.x = Math.max(8, Math.min(this.scene.width - 8, pl.x + dx * SPEED * dt));
      pl.ft += dt;
      if (pl.ft > 0.13) { pl.ft = 0; pl.frame = (pl.frame + 1) % 4; if (pl.frame % 2 === 0) this.sound.step(this.scene.wet); }
    }
    this.followCam(dt);

    // nearest interactable
    const vis = this.scene.objects.filter((o) => (o.act || o.kind === 'door' || o.kind === 'spinner') && (!o.when || o.when(this)));
    let best = null, bd = 1e9;
    for (const o of vis) {
      const d = Math.abs(o.x - pl.x);
      if (d <= (o.r || 14) && d < bd) { best = o; bd = d; }
    }
    this.near = best;
    const prompt = $('#prompt');
    if (best?.auto) { this.near = null; prompt.hidden = true; this.script(() => best.act(this, best)); return; }
    if (best) {
      const verb = best.kind === 'spinner' ? '▲ FLY' : best.kind === 'door' ? '▲ GO' : best.kind === 'item' ? 'A · TAKE' : best.look ? 'A · TALK' : 'A · EXAMINE';
      prompt.textContent = `${verb}  ${best.label}`; prompt.hidden = false;
    } else prompt.hidden = true;

    for (const p of presses) {
      if (p === 'b') { this.toggleMenu(true); return; }
      if ((p === 'a' || p === 'up') && best) {
        this.sound.select();
        if (best.kind === 'spinner') this.script(() => this.travel());
        else if (best.kind === 'door') { this.sound.door(); this.goto(best.to, best.toX); }
        else if (best.act) { if (best.look) best.dir = pl.x < best.x ? -1 : 1; this.script(() => best.act(this, best)); }
        return;
      }
    }
  }
  followCam(dt) {
    const want = this.clampCam(this.player.x - A.W / 2 + this.player.dir * 20);
    this.cam += (want - this.cam) * Math.min(1, dt * 4);
  }
  updateNpcs(dt) {
    for (const o of this.scene.objects) {
      if (!o.look) continue;
      if (o.target != null) {
        const d = o.target - o.x;
        if (Math.abs(d) < 1) { o.x = o.target; o.target = null; o.walking = false; const r = o.onArrive; o.onArrive = null; r?.(); continue; }
        o.dir = Math.sign(d); o.walking = true;
        o.x += Math.sign(d) * Math.min(Math.abs(d), (o.speed || 40) * dt);
      } else if (o.patrol && !this.dlg && !(this.near === o)) {
        o.walking = true; o.dir ||= 1;
        o.x += o.dir * (o.speed || 12) * dt;
        if (o.x > o.patrol[1]) o.dir = -1; if (o.x < o.patrol[0]) o.dir = 1;
      } else o.walking = false;
    }
  }

  draw(dt) {
    const ctx = this.ctx, sc = this.scene, cam = Math.round(this.cam), t = this.t;
    if (this.overlay) { this.overlay(ctx, t); this.drawFade(ctx); return; }
    sc.bg(ctx, this, cam, t);
    const fy = sc.floorY;
    const objs = sc.objects.filter((o) => !o.when || o.when(this)).sort((a, b) => (a.layer || 0) - (b.layer || 0));
    for (const o of objs) {
      const sx = o.x - cam;
      if (sx < -60 || sx > A.W + 60) continue;
      if (o.look) A.drawPerson(ctx, A.CAST[o.look], sx, fy + (o.y || 0), { dir: o.dir || 1, frame: Math.floor(t * 8 + o.x) % 4, walking: o.walking, t });
      if (o.draw) o.draw(ctx, this, sx, fy + (o.look ? 0 : (o.y || 0)), t, o);
    }
    if (this.mode !== 'title') {
      const pl = this.player;
      A.drawPerson(ctx, A.CAST.runner, pl.x - cam, fy, { dir: pl.dir, frame: pl.frame, walking: pl.walking, t, pose: pl.pose });
    }
    // interaction marker
    if (this.near && !this.dlg && !this.busy) {
      const sx = Math.round(this.near.x - cam), by = fy - (this.near.look ? A.CAST[this.near.look].h + 10 : 30) + Math.round(Math.sin(t * 6));
      ctx.fillStyle = A.PAL.amber; ctx.fillRect(sx - 2, by, 5, 1); ctx.fillRect(sx - 1, by + 1, 3, 1); ctx.fillRect(sx, by + 2, 1, 1);
    }
    if (sc.wet) A.reflect(ctx, fy);
    if (sc.rain) this.rain.draw(ctx, dt, fy + 2, Math.min(1, sc.rain), -0.22 * sc.rain);
    if (this.qteState) this.drawQte(ctx);
    if (this.flashA > 0) { ctx.fillStyle = `rgba(230,240,255,${this.flashA})`; ctx.fillRect(0, 0, A.W, A.H); }
    this.drawFade(ctx);
  }
  drawFade(ctx) { if (this.fadeA > 0.001) { ctx.fillStyle = `rgba(0,0,0,${this.fadeA})`; ctx.fillRect(0, 0, A.W, A.H); } }
  drawQte(ctx) {
    const q = this.qteState, w = 140, x = (A.W - w) / 2, y = 40;
    ctx.fillStyle = 'rgba(5,4,12,0.85)'; ctx.fillRect(x - 6, y - 14, w + 12, 34);
    const lbl = `${q.label}!  MASH A`;
    A.pxText(ctx, lbl, Math.round((A.W - A.pxWidth(lbl)) / 2), y - 9, Math.floor(this.t * 6) % 2 ? A.PAL.pink : A.PAL.amber, 1, 4);
    ctx.fillStyle = '#2b2745'; ctx.fillRect(x, y, w, 6);
    ctx.fillStyle = A.PAL.cyan; ctx.fillRect(x, y, Math.round(w * Math.min(1, q.got / q.need)), 6);
    ctx.fillStyle = A.PAL.red; ctx.fillRect(x, y + 9, Math.round(w * (q.left / q.total)), 2);
  }
}

const game = new Game();
window.__game = game; // handy for debugging from the console
// title screen backdrop
game.enterScene('street', 300);
game.fadeTarget = 0.35; game.fadeA = 1;
