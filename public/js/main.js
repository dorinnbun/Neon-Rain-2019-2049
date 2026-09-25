import { Sound } from './audio.js';
import { Input } from './input.js';
import * as A from './art.js';
import { openEsper } from './esper.js';
import PART1 from './part1.js';
import PART2 from './part2/index.js';

const PARTS = { p1: PART1, p2: PART2 };
const $ = (s) => document.querySelector(s);
const PREFS_KEY = 'neon-rain-prefs-v1';
export const store = {
  get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode */ } },
  del(k) { try { localStorage.removeItem(k); } catch { /* ignore */ } },
};

class Game {
  constructor() {
    this.canvas = $('#game');
    this.ctx = this.canvas.getContext('2d');
    this.sound = new Sound();
    this.input = new Input();
    this.store = store;
    this.t = 0; this.last = 0;
    this.player = { x: 120, dir: 1, frame: 0, ft: 0, walking: false, pose: null };
    this.cam = 0; this.fadeA = 1; this.fadeTarget = 1; this.fadeSpeed = 2; this.flashA = 0;
    this.busy = 0; this.mode = 'title';
    this.dlg = null; this.qteState = null; this.overlay = null; this.near = null; this.minigame = null;
    this.comp = { x: 0, dir: 1 };
    this.prefs = Object.assign({ music: true, sfx: true, crt: true, pad: matchMedia('(pointer: coarse)').matches, part: 'p1' }, store.get(PREFS_KEY) || {});
    if (!PARTS[this.prefs.part]) this.prefs.part = 'p1';
    this.bindUI();
    this.applyPrefs();
    this.usePart(this.prefs.part);
    requestAnimationFrame((ts) => this.frame(ts));
  }

  // ------------------------------------------------------------ parts
  usePart(id) {
    const P = this.P = PARTS[id];
    this.W = P.W; this.H = P.H;
    this.canvas.width = P.W; this.canvas.height = P.H;
    this.ctx.imageSmoothingEnabled = false;
    document.body.classList.remove('p1', 'p2');
    document.body.classList.add(P.bodyClass);
    this.state = this.freshState();
    this.sound.setScore(P.score);
    // title copy
    $('#title h1').innerHTML = `${P.title.h1}<small>${P.title.small}</small>`;
    $('#title .crawl').innerHTML = P.title.crawl;
    document.title = P.title.h1.replace(/<[^>]+>/g, '') + (id === 'p2' ? ' 2049' : ' 2019');
    $('.brand').innerHTML = id === 'p2' ? 'NEON&nbsp;RAIN <b>2049</b>' : 'NEON&nbsp;RAIN <b>2019</b>';
    document.querySelectorAll('.part-btn').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.part === id)));
    const saved = store.get(P.saveKey);
    $('#btn-continue').hidden = !saved;
    this.titleSel = saved ? 1 : 0;
    this.markTitle();
    // title backdrop
    this.enterScene(P.titleScene.scene, P.titleScene.x);
    this.fadeTarget = 0.35; this.fadeA = Math.max(this.fadeA, 0.6);
  }
  switchPart(id) {
    if (this.mode !== 'title' || id === this.P.id || !PARTS[id]) return;
    this.prefs.part = id; this.applyPrefs();
    this.sound.select();
    this.usePart(id);
  }
  freshState() { const P = this.P; return { scene: P.start.scene, x: P.start.x, flags: {}, items: [], eggs: [], chapter: 0, obj: P.CHAPTERS[0].o }; }

  // ------------------------------------------------------------ state helpers
  flag(k) { return !!this.state.flags[k]; }
  setFlag(k, v = true) { this.state.flags[k] = v; this.save(); }
  has(id) { return this.state.items.includes(id); }
  hasEgg(id) { return this.state.eggs.includes(id); }
  give(id) {
    if (this.has(id)) return;
    this.state.items.push(id); this.sound.pickup();
    this.toast(`EVIDENCE ▸ ${this.P.ITEMS[id].name.toUpperCase()}`); this.save();
  }
  egg(id) {
    const EGGS = this.P.EGGS;
    if (!EGGS[id] || this.hasEgg(id)) return;
    this.state.eggs.push(id); this.sound.egg();
    this.toast(`★ SECRET ${this.state.eggs.length}/${Object.keys(EGGS).length} ▸ ${EGGS[id]}`, 3.2); this.save();
  }
  chapter(n) { this.state.chapter = n; this.objective(this.P.CHAPTERS[n].o); }
  objective(text) { this.state.obj = text; $('#objective').textContent = '◆ ' + text.toUpperCase(); this.save(); }
  obj(id) { return this.scene.objects.find((o) => o.id === id); }
  save() { if (this.mode !== 'title') store.set(this.P.saveKey, { ...this.state, scene: this.sceneId, x: Math.round(this.player.x) }); }

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
    this.sceneId = id; this.scene = this.P.SCENES[id];
    this.player.x = x ?? this.scene.spawn; this.player.walking = false;
    this.cam = this.clampCam(this.player.x - this.W / 2);
    this.comp.x = this.player.x - 20;
    this.sound.setMood(this.scene.mood);
    const [kind, level] = this.P.ambience(this.scene);
    this.sound.setAmbience(kind, level);
    $('#location').textContent = this.scene.name;
    this.save();
  }
  clampCam(c) { return Math.max(0, Math.min(this.scene.width - this.W, c)); }

  async script(fn) {
    this.busy++;
    try { await fn(); } catch (e) { console.error(e); } finally { this.busy--; this.save(); }
  }

  walk(o, x) {
    return new Promise((res) => { o.target = x; o.onArrive = res; o.speed ||= 40; });
  }

  // run a self-contained interactive mode (e.g. spinner flight); resolves with its result
  play(mg) {
    return new Promise((resolve) => { this.minigame = mg; mg.finish = (r) => { this.minigame = null; resolve(r); }; mg.start?.(this); });
  }

  // ------------------------------------------------------------ dialogue
  async say(who, text) {
    if (Array.isArray(text)) { for (const t of text) await this.say(who, t); return; }
    return new Promise((resolve) => {
      this.showSpeaker(who);
      $('#choices').hidden = true; $('#next').classList.add('off'); $('#timer').hidden = true;
      this.dlg = { who, text, shown: 0, done: false, resolve, choices: null };
      $('#line').textContent = '';
    });
  }
  // options: { timeout: seconds } → resolves -1 if time runs out
  choose(options, who = 'you', { timeout = 0 } = {}) {
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
      $('#timer').hidden = !timeout;
      this.dlg = { who, text: '', shown: 0, done: true, resolve, choices: options, sel: 0, timeout, left: timeout };
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
    this.dlg = null; $('#dialogue').hidden = true; $('#timer').hidden = true;
    r(i);
  }
  showSpeaker(who) {
    const sp = this.P.SPEAKERS[who] || this.P.SPEAKERS.narrator;
    $('#dialogue').hidden = false;
    $('#speaker').textContent = sp.name;
    $('#dialogue').classList.toggle('narr', !sp.name);
    $('#portrait').style.display = sp.look || sp.tint ? '' : 'none';
    this.P.drawPortrait($('#portrait canvas'), sp.look, this.t, sp.tint);
  }
  advance() {
    const d = this.dlg;
    if (!d || d.choices) return;
    if (!d.done) { d.shown = d.text.length; d.done = true; $('#line').textContent = d.text; $('#next').classList.remove('off'); return; }
    this.dlg = null; $('#dialogue').hidden = true; d.resolve();
  }
  tickDialogue(dt) {
    const d = this.dlg;
    if (!d) return;
    if (d.choices && d.timeout) {
      d.left -= dt;
      $('#timer').style.setProperty('--left', Math.max(0, d.left / d.timeout));
      if (d.left <= 0) { const r = d.resolve; this.dlg = null; $('#dialogue').hidden = true; $('#timer').hidden = true; r(-1); }
      return;
    }
    if (d.done) return;
    const before = Math.floor(d.shown);
    d.shown = Math.min(d.text.length, d.shown + dt * 48);
    const now = Math.floor(d.shown);
    if (now !== before) {
      $('#line').textContent = d.text.slice(0, now);
      if (now % 2 === 0 && d.text[now - 1] !== ' ') this.sound.blip((this.P.SPEAKERS[d.who] || this.P.SPEAKERS.narrator).pitch);
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
  async dream(draw = this.P.drawDream, secs = 5, mood = 'love') {
    this.sound.setMood(mood);
    await this.fade(1, 1);
    this.overlay = draw;
    await this.fade(0, 0.7);
    await this.wait(secs);
    await this.fade(1, 1);
    this.overlay = null;
    await this.fade(0, 1);
    this.sound.setMood(this.scene.mood);
  }

  async travel() {
    const dests = this.P.DESTS.filter((d) => d.ok(this) && d.id !== this.sceneId);
    if (!dests.length) return this.say('narrator', 'Nowhere to go. Not yet.');
    const i = await this.choose([...dests.map((d) => '▸ ' + d.name), 'Stay here'], 'narrator');
    if (i >= dests.length) return;
    if (this.P.travel) return this.P.travel(this, dests[i]);
    this.sound.spinner();
    await this.fade(1, 2);
    await this.card(['▲ SPINNER EN ROUTE', dests[i].name.toUpperCase()], 0.6);
    await this.goto(dests[i].id);
  }

  companionOn() { return !!this.P.companion?.visible(this); }

  // ------------------------------------------------------------ UI / menus
  bindUI() {
    const tg = (id, key, fn) => $(id).addEventListener('click', () => { this.prefs[key] = !this.prefs[key]; this.applyPrefs(); fn?.(); });
    tg('#tgl-music', 'music'); tg('#tgl-sfx', 'sfx'); tg('#tgl-crt', 'crt'); tg('#tgl-pad', 'pad');
    $('#btn-menu').addEventListener('click', () => this.toggleMenu());
    $('#btn-new').addEventListener('click', () => this.start(false));
    $('#btn-continue').addEventListener('click', () => this.start(true));
    $('#btn-resume').addEventListener('click', () => this.toggleMenu(false));
    $('#btn-restart').addEventListener('click', () => { if (confirm('Restart this part from the beginning? Secrets found stay found.')) this.restart(); });
    $('#btn-title').addEventListener('click', () => { this.save(); location.reload(); });
    document.querySelectorAll('.part-btn').forEach((b) => b.addEventListener('click', () => this.switchPart(b.dataset.part)));
    $('#dialogue').addEventListener('click', (e) => { if (!e.target.closest('button')) this.advance(); });
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
      if (this.mode === 'title' && (e.code === 'Digit1' || e.code === 'Digit2')) this.switchPart('p' + e.code.slice(-1));
    });
    // any touch/click unlocks audio
    addEventListener('pointerdown', () => this.sound.unlock(), { passive: true });
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
    this.titleSel = Math.max(0, Math.min(this.titleSel, btns.length - 1));
    btns.forEach((b, i) => b.classList.toggle('sel', i === this.titleSel));
    return btns;
  }

  start(cont) {
    this.sound.unlock();
    const saved = store.get(this.P.saveKey);
    const eggs = saved?.eggs || [];
    this.state = cont && saved ? Object.assign(this.freshState(), saved) : Object.assign(this.freshState(), { eggs });
    $('#title').hidden = true;
    this.mode = 'play';
    this.enterScene(this.state.scene, this.state.x);
    $('#objective').textContent = '◆ ' + this.state.obj.toUpperCase();
    this.fade(0, 1);
    if (this.scene.onEnter) this.script(() => this.scene.onEnter(this));
  }
  restart() {
    const eggs = this.state.eggs;
    this.state = Object.assign(this.freshState(), { eggs });
    store.set(this.P.saveKey, this.state);
    location.reload();
  }

  toggleMenu(force) {
    if (this.mode === 'title' || this.minigame) return;
    const open = force ?? $('#menu').hidden;
    $('#menu').hidden = !open;
    this.mode = open ? 'menu' : 'play';
    this.menuSel = 0;
    if (!open) return;
    this.sound.select();
    const { CHAPTERS, ITEMS, EGGS } = this.P;
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
    $('#egg-count').textContent = `${this.state.eggs.filter((e) => EGGS[e]).length}/${Object.keys(EGGS).length}`;
    this.markMenu();
  }
  menuButtons() { return [$('#btn-resume'), $('#btn-restart'), $('#btn-title')]; }
  markMenu() { this.menuButtons().forEach((b, i) => b.classList.toggle('sel', i === this.menuSel)); }

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
    const f = this.fadeTarget - this.fadeA;
    this.fadeA += Math.sign(f) * Math.min(Math.abs(f), dt * this.fadeSpeed);
    this.flashA = Math.max(0, this.flashA - dt * 2.5);

    if (this.mode === 'title') {
      for (const p of presses) {
        if (p === 'left') this.switchPart('p1');
        if (p === 'right') this.switchPart('p2');
        if (p === 'up') { this.titleSel = 0; this.markTitle(); }
        if (p === 'down') { this.titleSel = 1; this.markTitle(); }
        if (p === 'a') { const b = this.markTitle()[this.titleSel]; b?.click(); }
      }
      return;
    }
    if (this.mode === 'menu') {
      const n = this.menuButtons().length;
      for (const p of presses) {
        if (p === 'b') this.toggleMenu(false);
        if (p === 'left' || p === 'up') { this.menuSel = (this.menuSel + n - 1) % n; this.markMenu(); }
        if (p === 'right' || p === 'down') { this.menuSel = (this.menuSel + 1) % n; this.markMenu(); }
        if (p === 'a') this.menuButtons()[this.menuSel].click();
      }
      return;
    }
    if (this.minigame) { this.minigame.update(dt, this.input, presses, this); $('#prompt').hidden = true; return; }

    this.updateNpcs(dt);
    this.updateCompanion(dt);
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
      pl.x = Math.max(8, Math.min(this.scene.width - 8, pl.x + dx * this.P.speed * dt));
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
    const comp = this.companionOn();
    if (best) {
      const verb = best.kind === 'spinner' ? '▲ FLY' : best.kind === 'door' ? '▲ GO' : best.kind === 'item' ? 'A · TAKE' : best.look ? 'A · TALK' : 'A · EXAMINE';
      prompt.textContent = `${verb}  ${best.label}`; prompt.hidden = false;
    } else if (comp) {
      prompt.textContent = `▼ TALK  ${this.P.companion.name}`; prompt.hidden = false;
    } else prompt.hidden = true;

    for (const p of presses) {
      if (p === 'b') { this.toggleMenu(true); return; }
      if (p === 'down' && comp) { this.sound.select(); this.script(() => this.P.companion.talk(this)); return; }
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
    const want = this.clampCam(this.player.x - this.W / 2 + this.player.dir * 20);
    this.cam += (want - this.cam) * Math.min(1, dt * 4);
  }
  updateCompanion(dt) {
    if (!this.companionOn()) return;
    const c = this.comp, want = this.player.x - this.player.dir * 22;
    const d = want - c.x;
    c.walking = Math.abs(d) > 2;
    if (c.walking) { c.dir = Math.sign(d); c.x += Math.sign(d) * Math.min(Math.abs(d), Math.max(30, Math.abs(d) * 3) * dt); } else c.dir = this.player.dir;
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
    const ctx = this.ctx, sc = this.scene, cam = Math.round(this.cam), t = this.t, P = this.P;
    if (this.minigame) { this.minigame.draw(ctx, t, this); P.postFx?.(ctx, this, dt); this.drawFlashFade(ctx); return; }
    if (this.overlay) { this.overlay(ctx, t, this); P.postFx?.(ctx, this, dt); this.drawFlashFade(ctx); return; }
    sc.bg(ctx, this, cam, t);
    const fy = sc.floorY;
    const objs = sc.objects.filter((o) => !o.when || o.when(this)).sort((a, b) => (a.layer || 0) - (b.layer || 0));
    for (const o of objs) {
      const sx = o.x - cam;
      if (sx < -80 || sx > this.W + 80) continue;
      if (o.look) P.drawPerson(ctx, this, o.look, sx, fy + (o.y || 0), { dir: o.dir || 1, frame: Math.floor(t * 8 + o.x) % 4, walking: o.walking, t, pose: o.pose });
      if (o.draw) o.draw(ctx, this, sx, fy + (o.look ? 0 : (o.y || 0)), t, o);
    }
    if (this.mode !== 'title') {
      if (this.companionOn()) P.companion.draw(ctx, this, this.comp.x - cam, fy, { dir: this.comp.dir, walking: this.comp.walking, t });
      const pl = this.player;
      P.drawPlayer(ctx, this, pl.x - cam, fy, { dir: pl.dir, frame: pl.frame, walking: pl.walking, t, pose: pl.pose });
    }
    sc.fg?.(ctx, this, cam, t);
    if (this.near && !this.dlg && !this.busy) {
      const sx = Math.round(this.near.x - cam), by = fy - (this.near.look ? P.personHeight(this.near.look) + 10 : 30) + Math.round(Math.sin(t * 6));
      ctx.fillStyle = A.PAL.amber; ctx.fillRect(sx - 2, by, 5, 1); ctx.fillRect(sx - 1, by + 1, 3, 1); ctx.fillRect(sx, by + 2, 1, 1);
    }
    P.afterScene(ctx, this, dt);
    if (this.qteState) this.drawQte(ctx);
    P.postFx?.(ctx, this, dt);
    this.drawFlashFade(ctx);
  }
  drawFlashFade(ctx) {
    if (this.flashA > 0) { ctx.fillStyle = `rgba(230,240,255,${this.flashA})`; ctx.fillRect(0, 0, this.W, this.H); }
    if (this.fadeA > 0.001) { ctx.fillStyle = `rgba(0,0,0,${this.fadeA})`; ctx.fillRect(0, 0, this.W, this.H); }
  }
  drawQte(ctx) {
    const q = this.qteState, s = this.W > 320 ? 2 : 1, w = 140 * s, x = (this.W - w) / 2, y = 40 * s;
    ctx.fillStyle = 'rgba(5,4,12,0.85)'; ctx.fillRect(x - 6 * s, y - 14 * s, w + 12 * s, 34 * s);
    const lbl = `${q.label}!  MASH A`;
    A.pxText(ctx, lbl, Math.round((this.W - A.pxWidth(lbl, s)) / 2), y - 9 * s, Math.floor(this.t * 6) % 2 ? A.PAL.pink : A.PAL.amber, s, 4);
    ctx.fillStyle = '#2b2745'; ctx.fillRect(x, y, w, 6 * s);
    ctx.fillStyle = A.PAL.cyan; ctx.fillRect(x, y, Math.round(w * Math.min(1, q.got / q.need)), 6 * s);
    ctx.fillStyle = A.PAL.red; ctx.fillRect(x, y + 9 * s, Math.round(w * (q.left / q.total)), 2 * s);
  }
}

const game = new Game();
window.__game = game; // handy for debugging from the console
