// PART II — Neon Rain 2049. Finer pixels, cinematic post-processing, a new
// score, spinner-flight travel and a holographic companion.
import * as B from './art.js';
import { SCENES, SPEAKERS, ITEMS, EGGS, CHAPTERS, DESTS } from './scenes.js';
import { flight } from './modes.js';

const weather = new B.Weather();
const pick = (a) => a[Math.floor(Math.random() * a.length)];

const LUMEN_LINES = {
  4: ['The records vault at HQ. If you were born, somebody wrote it down.', 'I like it out here. Everything is so… loud.'],
  5: ['The orphanage is on the mesa. Theo, be careful. I can\'t catch you if you fall.', 'Do you think you had a name there? Before?'],
  6: ['A memory maker would know if it\'s real. Dr. Veil. Everyone says she\'s the best.', 'You held that unicorn like it might fly away.'],
  7: ['You\'re off baseline, aren\'t you. It\'s all right. I like you off baseline.', 'Whatever they tell you at HQ — I know who you are.'],
  8: ['Ines at the market can read wood like a book. Let\'s go ask her.', 'You\'re not a serial number any more. You\'re a story.'],
  9: ['The dead city. I\'ve never seen the colour orange properly. Show me.', 'If he\'s your father, what will you say to him?'],
};

export default {
  id: 'p2',
  saveKey: 'neon-rain-2049-save-v1',
  W: B.W, H: B.H, speed: 70,
  score: 'p2',
  bodyClass: 'p2',
  title: {
    h1: 'NEON RAIN', small: 'PART II · LOS ANGELES · 2049',
    crawl: 'Thirty years after the Blackout, the Arcturus Corporation is ash. Castellan Industries bought its ruins and built a new synthetic — obedient, long-lived, loyal.<br><br>Older models still hide. New ones hunt them. You are a <em>Runner</em>, and you have never once wondered what you are.',
  },
  start: { scene: 'farm', x: 90 },
  titleScene: { scene: 'city', x: 700 },
  SCENES, SPEAKERS, ITEMS, EGGS, CHAPTERS, DESTS,

  personHeight(look) { return B.CAST[look]?.h || 44; },
  drawPerson(ctx, g, look, x, y, opts) { B.drawFigure(ctx, B.CAST[look], x, y, { ...opts, rim: g.scene.rim }); },
  drawPlayer(ctx, g, x, y, opts) {
    if (opts.pose === 'lie') {
      ctx.save(); ctx.translate(Math.round(x), y - 2); ctx.rotate(-Math.PI / 2);
      B.drawFigure(ctx, B.CAST.seven, 0, 0, { ...opts, pose: null, walking: false, rim: g.scene.rim });
      ctx.restore(); return;
    }
    B.drawFigure(ctx, B.CAST.seven, x, y, { ...opts, rim: g.scene.rim });
  },
  drawPortrait: B.drawPortrait,
  afterScene(ctx, g, dt) {
    const sc = g.scene;
    if (sc.wet) B.reflect(ctx, sc.floorY);
    const [kind, amt] = sc.weather || [];
    weather.draw(ctx, dt, g.t, kind, amt, sc.floorY);
  },
  postFx(ctx, g) { B.postFx(ctx, g.t, { grade: g.minigame ? '#6a8a90' : g.scene?.grade, gradeA: 0.2 }); },
  ambience(sc) { return sc.amb || ['none', 0.1]; },

  async travel(g, dest) {
    g.sound.spinner();
    await g.fade(1, 3);
    g.fadeTarget = 0; g.fadeA = 0;
    const res = await g.play(flight(dest, dest.look));
    await g.fade(1, 3);
    if (res.hits > 5) g.toast(`LANDED · HULL DAMAGE ${res.hits * 12}%`);
    await g.goto(dest.id);
  },

  companion: {
    name: 'LUMEN',
    visible: (g) => g.flag('emanator') && !g.flag('lumen_gone') && g.mode !== 'title',
    draw(ctx, g, x, y, o) { B.drawFigure(ctx, B.CAST.lumen, x, y, { ...o, frame: Math.floor(o.t * 8) % 4, rim: '#ffffff' }); },
    async talk(g) {
      g.sound.shimmer();
      const lines = LUMEN_LINES[g.state.chapter] || ['I\'m here, Theo.', 'Where to next?'];
      await g.say('lumen', pick(lines));
    },
  },
};
