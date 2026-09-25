// PART I — Neon Rain 2019. Wraps the original scenes and art into a "part"
// the engine can load. Low-res warm pixel art, CRT look, analog-synth score.
import * as A from './art.js';
import { SCENES, SPEAKERS, ITEMS, EGGS, CHAPTERS, DESTS, drawDream } from './scenes.js';

const rain = new A.Rain(200);

export default {
  id: 'p1',
  saveKey: 'neon-rain-save-v1',
  W: 320, H: 180, speed: 58,
  score: 'p1',
  bodyClass: 'p1',
  title: {
    h1: 'NEON RAIN', small: 'LOS ANGELES · NOVEMBER 2019',
    crawl: 'Early in the 21st century the Arcturus Corporation perfected the synthetic human — stronger, faster and as clever as their makers. Built for off-world labour, forbidden on Earth. Four of them have come home.<br><br>Special detectives called <em>Runners</em> are sent to find them.',
  },
  start: { scene: 'street', x: 120 },
  titleScene: { scene: 'street', x: 300 },
  SCENES, SPEAKERS, ITEMS, EGGS, CHAPTERS, DESTS, drawDream,

  person(look) { return A.CAST[look]; },
  personHeight(look) { return A.CAST[look]?.h || 30; },
  drawPerson(ctx, g, look, x, y, opts) { A.drawPerson(ctx, A.CAST[look], x, y, opts); },
  drawPlayer(ctx, g, x, y, opts) { A.drawPerson(ctx, A.CAST.runner, x, y, opts); },
  drawPortrait(canvas, look, t, tint) { A.drawPortrait(canvas, look ? A.CAST[look] : null, t, tint); },
  afterScene(ctx, g, dt) {
    const sc = g.scene;
    if (sc.wet) A.reflect(ctx, sc.floorY);
    if (sc.rain) rain.draw(ctx, dt, sc.floorY + 2, Math.min(1, sc.rain), -0.22 * sc.rain);
  },
  ambience(sc) { return sc.rain ? ['rain', Math.min(1, sc.rain)] : ['rain', 0.12]; },
};
