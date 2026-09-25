// PART II — Neon Rain 2049. Original story, thirty years after Part I.
import * as B from './art.js';
import { baseline, dnaMatch } from './modes.js';
const { PAL, W, H, LB } = B;
const pick = (a) => a[Math.floor(Math.random() * a.length)];

export const SPEAKERS = {
  you:       { name: 'SEVEN', look: 'seven', pitch: 0.8 },
  lumen:     { name: 'LUMEN', look: 'lumen', pitch: 1.4, tint: '#4a1a3a' },
  okafor:    { name: 'LT. OKAFOR', look: 'okafor', pitch: 0.95 },
  radio:     { name: 'LT. OKAFOR · RADIO', look: 'okafor', pitch: 0.95, tint: '#0d2a2e' },
  moss:      { name: 'HALVARD MOSS', look: 'moss', pitch: 0.6 },
  castellan: { name: 'ORRIN CASTELLAN', look: 'castellan', pitch: 0.7, tint: '#3a2a08' },
  vesper:    { name: 'VESPER', look: 'vesper', pitch: 1.2 },
  veil:      { name: 'DR. NADIA VEIL', look: 'veil', pitch: 1.35, tint: '#2a2a34' },
  maren:     { name: 'MAREN', look: 'maren', pitch: 1.0 },
  oldrunner: { name: 'THE OLD RUNNER', look: 'oldrunner', pitch: 0.65 },
  cotton:    { name: 'MISTER COTTON', look: 'cotton', pitch: 0.9 },
  kid:       { name: 'CHILD', look: 'kid', pitch: 1.8 },
  morenoold: { name: 'OLD MORENO', look: 'morenoold', pitch: 1.1 },
  ines:      { name: 'INES', look: 'ines', pitch: 1.2 },
  juno:      { name: 'JUNO', look: 'juno', pitch: 1.3 },
  scav:      { name: 'SCAVENGER', look: 'scav', pitch: 0.7 },
  ad:        { name: 'LUMEN · ADVERTISEMENT', look: 'lumen', pitch: 1.5, tint: '#6a1a4a' },
  baseline:  { name: 'BASELINE', look: null, pitch: 1.9, tint: '#1a1e22' },
  archive:   { name: 'ARCHIVE', look: null, pitch: 2.1, tint: '#0a2a2c' },
  narrator:  { name: '', look: null, pitch: 0.6 },
};

export const ITEMS = {
  box:      { name: 'Buried box', desc: 'Bones under the dead tree. A woman. A surgical note: emergency delivery.' },
  ribbon:   { name: 'Hair ribbon', desc: 'Kept in a music box at Moss\'s farm. Small. A child\'s.' },
  serial:   { name: 'Serial on the bone', desc: 'G7-IR1S. A Genesis-7 — built by Arcturus, thirty years ago.' },
  emanator: { name: 'Emanator', desc: 'Lets Lumen leave the apartment. Leave everywhere, with you.' },
  record:   { name: 'Birth record', desc: 'Twins. Identical DNA. The girl died. The boy was sent to the mesa.' },
  carving:  { name: 'Wooden unicorn', desc: 'Right where the memory said it would be. The date carved underneath.' },
  hardwood: { name: 'Ines\'s analysis', desc: 'Real wood. Radioactive. From the dead city.' },
};

export const EGGS = {
  flower:  'A flower at the foot of a dead tree',
  tape:    'Played Iris\'s old empathy test',
  moreno:  'Old Moreno still folds paper',
  lumenrain: 'Lumen feels the rain',
  bees:    'The bees are still alive',
  piano:   'Played the old song in the casino',
  dog:     'Asked the dog if he\'s real',
  konami:  'Amber Terminal mode (↑↑↓↓←→←→BA)',
  legacy:  'Part I\'s true ending remembered',
};

export const CHAPTERS = [
  { t: 'The Farm', o: 'Retire the Genesis-8 at the protein farm' },
  { t: 'Baseline', o: 'Fly to HQ for your post-retirement baseline' },
  { t: 'Castellan', o: 'Identify the remains in the Castellan archive' },
  { t: 'Lumen', o: 'Go home — your apartment is in the city' },
  { t: 'Birth Records', o: 'Search the birth-records vault at HQ' },
  { t: 'The Mesa', o: 'Fly to the orphanage on the trash mesa' },
  { t: 'The Memory Maker', o: 'Ask Dr. Nadia Veil about the memory' },
  { t: 'Off Baseline', o: 'Report to HQ' },
  { t: 'Wood', o: 'Have Ines analyse the carving — city market' },
  { t: 'The Dead City', o: 'Fly into the orange dust' },
  { t: 'The Resistance', o: 'Hear Maren out' },
  { t: 'Sea Wall', o: 'Stop Vesper at the sea wall' },
  { t: 'Snow', o: 'Take him to his daughter' },
  { t: 'Case Closed', o: 'The end. Thank you for playing' },
];

export const DESTS = [
  { id: 'city', name: 'City — market & home', ok: () => true, look: { sky: ['#030506', '#101a1f', '#2a3a40'], weather: 'rain' } },
  { id: 'farm', name: 'Protein farm', ok: (g) => g.state.chapter >= 1, look: { sky: ['#6f7875', '#a9b1ad', '#d6dad5'], block: '#5a625f', far: '#848c89', lights: ['#ffffff'], weather: null } },
  { id: 'hq', name: 'Police HQ', ok: (g) => g.state.chapter >= 1, look: { sky: ['#030506', '#0c1418', '#1e2b31'], weather: 'rain' } },
  { id: 'castellan', name: 'Castellan Pyramid', ok: (g) => g.state.chapter >= 2, look: { sky: ['#050403', '#1e150a', '#4a3212'], block: '#140e08', far: '#2a1d0e', lights: ['#f2c14e'], weather: 'rain' } },
  { id: 'mesa', name: 'Trash mesa orphanage', ok: (g) => g.state.chapter >= 5, look: { sky: ['#1a120a', '#5a3a1e', '#a2703a'], block: '#2a1c10', far: '#4a3220', lights: ['#ffb35c'], weather: 'ash', haze: '#8a5a2a' } },
  { id: 'lab', name: 'Veil Memory Studio', ok: (g) => g.state.chapter >= 6, look: { sky: ['#1a1e22', '#6a7278', '#b8c0c4'], block: '#3a4248', far: '#5a6268', lights: ['#ffffff'], weather: 'snow' } },
  { id: 'vegas', name: 'The dead city', ok: (g) => g.state.chapter === 9, look: { sky: ['#2a0e02', '#a4400e', '#ffae5c'], block: '#3a1606', far: '#6a2a0c', lights: ['#ffd08a'], weather: 'dust', haze: '#ff7a2a' } },
  { id: 'seawall', name: 'Sea wall', ok: (g) => g.state.chapter === 11, look: { sky: ['#010203', '#0a1218', '#1a262e'], block: '#05080a', far: '#0c1216', lights: ['#7fd6d9'], weather: 'rain' } },
];

const spinnerPad = (x, label = 'SPINNER') => ({ id: 'spinner', kind: 'spinner', x, label, r: 26, layer: -1, draw: (ctx, g, sx, fy, t) => B.spinner2(ctx, sx, fy - 4, t, 1) });
const floor = (ctx, y, c1, c2) => { const g = ctx.createLinearGradient(0, y, 0, H); g.addColorStop(0, c1); g.addColorStop(1, c2); ctx.fillStyle = g; ctx.fillRect(0, y, W, H - y); };

export const SCENES = {};

// ================================================================ FARM
SCENES.farm = {
  name: 'PROTEIN FARM · 2049', width: 900, floorY: 226, mood: 'fog', weather: [null, 0], amb: ['wind', 0.6], grade: '#b8c4c0', rim: '#f4f6f2', spawn: 90,
  bg(ctx, g, cam, t) {
    B.ditherSky(ctx, ['#7a827f', '#b4bbb7', '#dde0db', '#c8ccc6']);
    B.megablocks(ctx, cam, 0.05, { seed: 3, color: '#a8afab', base: 226, minH: 10, maxH: 40, lights: ['#fff'], density: 0 });
    B.fog(ctx, 190, 60, '#e8ebe6', 0.5, t, 3);
    const x0 = -cam;
    // endless greenhouse frames
    for (let i = 0; i < 12; i++) { const gx = x0 * 0.6 + i * 110 - 60; ctx.strokeStyle = 'rgba(80,90,88,0.35)'; ctx.strokeRect(gx + 0.5, 190.5, 90, 36); for (let k = 0; k < 90; k += 10) { ctx.beginPath(); ctx.moveTo(gx + k + 0.5, 190); ctx.lineTo(gx + k + 5.5, 226); ctx.stroke(); } }
    // farmhouse
    ctx.fillStyle = '#5a605d'; ctx.fillRect(x0 + 300, 170, 110, 56); ctx.fillStyle = '#4a504d'; ctx.fillRect(x0 + 296, 164, 118, 8);
    ctx.fillStyle = '#ffe0a8'; ctx.globalAlpha = 0.6 + 0.1 * Math.sin(t * 2); ctx.fillRect(x0 + 320, 186, 14, 10); ctx.globalAlpha = 1;
    ctx.fillStyle = '#2e3230'; ctx.fillRect(x0 + 360, 190, 16, 36);
    // boiling pot of broth on the stove, visible through door
    ctx.fillStyle = 'rgba(255,255,255,0.2)'; for (let i = 0; i < 3; i++) ctx.fillRect(x0 + 364 + Math.sin(t + i) * 2, 186 - ((t * 8 + i * 5) % 16), 3, 2);
    // the dead tree
    B.deadTree(ctx, x0 + 640, 226, t);
    ctx.fillStyle = '#6a625a'; ctx.fillRect(x0 + 636, 206, 2, 12); // carved date
    if (g.flag('scanned')) { ctx.fillStyle = '#2a241e'; ctx.fillRect(x0 + 620, 224, 40, 4); }
    floor(ctx, 226, '#8e928c', '#5a5e58');
  },
  async onEnter(g) {
    if (g.flag('intro')) return;
    g.setFlag('intro');
    await g.card(['NEON RAIN', 'PART II · 2049'], 2.4);
    await g.say('narrator', [
      'Thirty years after the Blackout, Arcturus is ash. Castellan Industries bought the ruins and built a new synthetic: the Genesis-9. Obedient. Long-lived.',
      'Older models still hide in the grey places. Genesis-9 Runners hunt them.',
      'You are one of them. You know what you are. It has never bothered you. Not yet.',
    ]);
    g.chapter(0);
  },
  objects: [
    spinnerPad(60),
    { id: 'moss', look: 'moss', x: 420, dir: -1, label: 'HALVARD MOSS', layer: 1, when: (g) => !g.flag('moss_done'), async act(g) {
      await g.say('moss', 'Boots, officer. The floor\'s the only clean thing for sixty miles.');
      await g.say('you', 'Halvard Moss. Genesis-8, serial ending 4-4-1. Your service ran out a long time ago.');
      await g.say('moss', 'My service. You say it like it was ever mine.');
      const c = await g.choose(['Come in quietly.', 'Why grow fungus in the fog?', '…']);
      if (c === 1) await g.say('moss', 'Because nobody comes this far out to steal fungus. Mostly.');
      if (c === 2) await g.say('moss', 'Quiet one. They build you quiet now.');
      await g.say('moss', 'You new ones do their dirty work because you were made so you\'d never need to ask why. Me, I\'ve watched something you never will.');
      await g.say('you', 'What?');
      await g.say('moss', 'Something being born.');
      g.shake(0.4); g.sound.shot();
      const ok = await g.qte('HOLD HIM OFF', 12, 4.5);
      await g.say('narrator', ok ? 'He\'s strong. You\'re newer.' : 'He puts you through the wall. You get up anyway. You always do.');
      g.sound.shot(); g.flash();
      await g.card(['GENESIS-8 "MOSS"', 'RETIRED'], 2);
      g.setFlag('moss_done');
      g.objective('Search the farm — scan the dead tree');
    } },
    { id: 'house', kind: 'spot', x: 368, label: 'FARMHOUSE', when: (g) => g.flag('moss_done'), async act(g) {
      if (g.has('ribbon')) return g.say('narrator', 'A pot of broth still simmering. Nobody left to eat it.');
      g.give('ribbon');
      await g.say('narrator', 'On the shelf, a music box. Inside, folded twice: a child\'s faded hair ribbon.');
    } },
    { id: 'tree', kind: 'spot', x: 640, label: 'DEAD TREE', r: 18, async act(g) {
      if (!g.flag('moss_done')) return g.say('you', 'A tree. Dead a long time. Someone still waters the ground around it.');
      if (g.has('box')) return g.say('narrator', 'Carved into the bark, low down: 10 · 11 · 21. Your eyes stay on it longer than they should.');
      g.sound.scan();
      await g.say('narrator', 'Your spinner\'s drone sweeps the roots. Something hollow, three metres down.');
      g.setFlag('scanned'); g.give('box');
      await g.say('narrator', 'A box. Bones inside. A woman. And a surgical note in faded ink: emergency delivery. Complications.');
      await g.say('you', 'Carved on the trunk: 10 · 11 · 21.');
      await g.say('radio', 'Seven. Bring the box to HQ. And come in for your baseline — you\'ve just retired someone.');
      g.chapter(1);
    } },
    { id: 'flower', kind: 'spot', x: 656, label: 'SOMETHING SMALL', r: 8, when: (g) => g.flag('moss_done'),
      draw: (ctx, g, sx, fy, t) => B.flower(ctx, sx, fy, t),
      async act(g) { await g.say('narrator', 'A single pale flower at the foot of the tree. Planted. Tended. In a place where nothing grows.'); g.egg('flower'); } },
  ],
};

// ================================================================ CITY
SCENES.city = {
  name: 'LOS ANGELES · 2049', width: 1100, floorY: 226, mood: 'fog', weather: ['rain', 0.9], amb: ['rain', 0.7], wet: true, grade: '#3a6a74', rim: '#ff6fb5', spawn: 120,
  bg(ctx, g, cam, t) {
    B.ditherSky(ctx, ['#020304', '#0b1216', '#1b262b', '#2e3a3f']);
    B.megablocks(ctx, cam, 0.08, { seed: 11, color: '#11181c', base: 230, minH: 90, maxH: 210, lights: ['#ffb35c', '#7fd6d9', '#ff6fb5'], density: 0.35 });
    B.fog(ctx, 150, 90, '#3a4a50', 0.3, t, 6);
    // the giant hologram ad
    const hx = 420 - cam * 0.2;
    B.hologram(ctx, hx, 226, 0.78, t, { hue: 'pink', glitch: g.flag('ad_scene') ? 0 : 0, text: 'LUMEN · EVERYTHING YOU WANT TO HEAR' });
    B.megablocks(ctx, cam, 0.3, { seed: 23, color: '#0b1013', base: 232, minH: 60, maxH: 160, lights: ['#ffb35c', '#7fd6d9'], density: 0.5 });
    const x0 = -cam;
    // street level: kiosks, canopies, signs
    for (let i = 0; i < 11; i++) {
      const sx = x0 + i * 100;
      ctx.fillStyle = '#080b0d'; ctx.fillRect(sx, 170, 92, 56);
      ctx.fillStyle = ['#ff6fb5', '#7fd6d9', '#ffb35c'][i % 3]; ctx.globalAlpha = 0.14; ctx.fillRect(sx + 4, 176, 84, 30); ctx.globalAlpha = 1;
      ctx.fillStyle = '#12181b'; ctx.fillRect(sx - 4, 164, 100, 6);
    }
    B.pxLight(ctx, 'NOODLES · 24H', x0 + 120, 152, PAL.sodium);
    B.pxLight(ctx, 'INES · ANALYSIS · REPAIR', x0 + 520, 152, PAL.teal);
    B.pxLight(ctx, 'RESIDENTIAL BLOCK 7', x0 + 900, 152, '#cfd3cc');
    // apartment block door
    ctx.fillStyle = '#1a2024'; ctx.fillRect(x0 + 920, 176, 30, 50); ctx.fillStyle = PAL.teal; ctx.fillRect(x0 + 944, 198, 2, 3);
    floor(ctx, 226, '#0e1417', '#050708');
  },
  async onEnter(g) {
    if (g.flag('lumen_gone') && !g.flag('ad_scene')) await adScene(g);
  },
  objects: [
    spinnerPad(60),
    { id: 'door', kind: 'door', x: 935, to: 'home', toX: 90, label: 'YOUR APARTMENT' },
    { id: 'ines', look: 'ines', x: 560, dir: -1, label: 'INES', layer: 1, async act(g) {
      if (g.state.chapter === 8 && g.has('carving')) {
        await g.say('ines', 'Put it on the plate. Let\'s see what you are.');
        g.sound.scan();
        await g.say('ines', 'Real wood. Not printed, not grown. Real, and older than you. That alone is a fortune.');
        await g.say('ines', 'And it\'s hot. Isotopes all through the grain. There\'s one place on this coast that glows like that. The dead city.');
        await g.say('you', 'Nobody lives there.');
        await g.say('ines', 'Nobody sensible. Go on, officer. And wash your hands after.');
        g.give('hardwood'); g.chapter(9);
      } else await g.say('ines', pick(['Analysis, repairs, no questions. Questions cost extra.', 'Wood? Nobody brings me wood. Wood is a rumour.', 'You look like a man who wants a second opinion on himself.']));
    } },
    { id: 'juno', look: 'juno', x: 420, dir: 1, patrol: [360, 500], speed: 14, label: 'WOMAN IN A CLEAR COAT', layer: 1, async act(g) {
      await g.say('juno', pick(['You look lonely, officer. Or just new.', 'Careful where you walk. The city keeps a record.', 'I know a few people who\'d like to meet you. Not yet.']));
      if (!g.flag('tagged')) { g.setFlag('tagged'); await g.say('narrator', 'She brushes your sleeve as she passes. You don\'t feel the tracker. Neither would anyone.'); }
    } },
    { id: 'walker', look: 'guard', x: 780, dir: -1, patrol: [700, 880], speed: 10, label: 'PATROL', layer: 1, async act(g) { await g.say('narrator', 'A patrol officer. He sees your badge and looks through you. Genesis-9s don\'t get eye contact.'); } },
    { id: 'ad', kind: 'spot', x: 760, label: 'THE HOLOGRAM', r: 30, async act(g) {
      await g.say('ad', 'Everything you want to hear. Everything you want to see. LUMEN — the companion who is always, always home.');
      if (g.flag('emanator') && !g.flag('lumen_gone')) await g.say('lumen', 'Don\'t look at her like that. I\'m the only one of me you know.');
    } },
  ],
};

async function adScene(g) {
  g.setFlag('ad_scene');
  g.player.x = 740;
  await g.say('narrator', 'The rain doesn\'t care where you walk. You end up under the hologram without meaning to.');
  g.sound.shimmer();
  await g.say('ad', 'Hi. You look tired. You look like someone who deserves a name.');
  await g.say('ad', 'What about… Theo?');
  await g.say('narrator', 'Her smile is the same smile. Her voice is the same voice. She says it to everyone.');
  const c = await g.choose(['(Say nothing.)', '"It was real to me."']);
  if (c === 1) await g.say('narrator', 'It was. Maybe that\'s the only kind of real there is.');
  g.chapter(11);
}

// ================================================================ HOME
SCENES.home = {
  name: 'BLOCK 7 · APARTMENT 1411', width: 600, floorY: 226, mood: 'memory', weather: [null, 0], amb: ['rain', 0.3], grade: '#6a8a90', rim: '#ffb35c', spawn: 90,
  bg(ctx, g, cam, t) {
    const x0 = -cam;
    ctx.fillStyle = '#1b2124'; ctx.fillRect(0, 0, W, 226);
    // concrete panels
    for (let i = 0; i < 600; i += 60) { ctx.fillStyle = 'rgba(255,255,255,0.03)'; ctx.fillRect(x0 + i, LB, 1, 204); }
    // window with city beyond
    ctx.fillStyle = '#0b1216'; ctx.fillRect(x0 + 180, 80, 150, 90);
    ctx.save(); ctx.beginPath(); ctx.rect(x0 + 180, 80, 150, 90); ctx.clip();
    B.megablocks(ctx, cam - 180, 0.1, { seed: 5, color: '#172026', base: 180, minH: 30, maxH: 90, lights: ['#ffb35c', '#ff6fb5'], density: 0.5, span: 500 });
    ctx.fillStyle = `rgba(255,111,181,${0.08 + 0.05 * Math.sin(t)})`; ctx.fillRect(x0 + 180, 80, 150, 90);
    ctx.restore();
    ctx.fillStyle = '#0f1417'; ctx.fillRect(x0 + 180, 124, 150, 2); ctx.fillRect(x0 + 254, 80, 2, 90);
    // table, chair, projector in ceiling
    ctx.fillStyle = '#2a2a28'; ctx.fillRect(x0 + 380, 200, 60, 4); ctx.fillRect(x0 + 386, 204, 3, 22); ctx.fillRect(x0 + 432, 204, 3, 22);
    ctx.fillStyle = '#3a3a36'; ctx.fillRect(x0 + 450, 190, 12, 36);
    ctx.fillStyle = '#23292c'; ctx.fillRect(x0 + 290, LB, 30, 6); ctx.fillStyle = PAL.pink; ctx.globalAlpha = 0.4 + 0.3 * Math.sin(t * 3); ctx.fillRect(x0 + 303, LB + 6, 4, 2); ctx.globalAlpha = 1;
    // roof hatch ladder
    ctx.fillStyle = '#2e3538'; for (let y = 120; y < 226; y += 10) ctx.fillRect(x0 + 540, y, 16, 2); ctx.fillRect(x0 + 540, 120, 2, 106); ctx.fillRect(x0 + 554, 120, 2, 106);
    // lamp pool
    const lg = ctx.createRadialGradient(x0 + 410, 190, 0, x0 + 410, 190, 120); lg.addColorStop(0, 'rgba(255,190,120,0.18)'); lg.addColorStop(1, 'rgba(255,190,120,0)');
    ctx.fillStyle = lg; ctx.fillRect(x0 + 280, 60, 260, 170);
    floor(ctx, 226, '#23282a', '#101315');
  },
  async onEnter(g) {
    if (g.state.chapter === 3 && !g.flag('lumen_intro')) await lumenIntro(g);
  },
  objects: [
    { id: 'door', kind: 'door', x: 60, to: 'city', toX: 935, label: 'STREET' },
    { id: 'lumen_home', look: 'lumen', x: 330, dir: -1, label: 'LUMEN', layer: 1, when: (g) => !g.flag('emanator'),
      async act(g) { g.sound.shimmer(); await g.say('lumen', pick(['You\'re home! I missed you. I know — I\'m supposed to say that. I also mean it.', 'I read a book today. All of it. Twice. Do you want to hear the ending?', 'One day I\'ll go outside with you. You\'ll see.'])); } },
    { id: 'hatch', kind: 'spot', x: 548, label: 'ROOF HATCH', async act(g) {
      if (!g.flag('emanator') || g.flag('lumen_gone')) return g.say('narrator', 'The roof. Rain and antennas. Nothing up there but weather.');
      await g.say('narrator', 'You carry the emanator up to the roof. The rain goes straight through her — and she laughs, because she can feel it anyway.');
      g.sound.shimmer();
      await g.say('lumen', 'Theo. It\'s cold. It\'s cold and it\'s everywhere. So this is what everyone complains about.');
      g.egg('lumenrain');
    } },
  ],
};

async function lumenIntro(g) {
  g.setFlag('lumen_intro');
  g.sound.shimmer();
  await g.say('lumen', 'You\'re late. I made dinner. It\'s a hologram of dinner, but the gesture is real.');
  await g.say('you', 'I got you something.');
  await g.say('narrator', 'A small silver device: an emanator. With it she isn\'t tied to the ceiling projector any more.');
  g.give('emanator'); g.setFlag('emanator');
  await g.say('lumen', 'I can go… anywhere? With you?');
  await g.say('lumen', 'Then you need a real name. "Seven" is a serial number. You\'re Theo. Is that all right?');
  const c = await g.choose(['"Theo." (Keep it.)', '"I don\'t need a name."']);
  await g.say('lumen', c === 0 ? 'Theo, then. It suits you. It sounds like someone who was born.' : 'Everybody needs a name. I\'ll use it quietly until you like it. Theo.');
  await g.say('you', 'The tree at the farm had a date carved in it. 10 · 11 · 21. I know that date.');
  await g.say('you', 'I have a memory. I\'m small. Other boys are chasing me. I hide a little wooden unicorn in a cold furnace. Under it, carved: 10 · 11 · 21.');
  await g.say('lumen', 'Theo… implanted memories don\'t carry dates. What if it\'s yours? What if you weren\'t made? What if you were born?');
  g.chapter(4);
}

// ================================================================ HQ
SCENES.hq = {
  name: 'POLICE HQ · RUNNER DIVISION', width: 800, floorY: 226, mood: 'hq', weather: [null, 0], amb: ['none', 0.1], grade: '#4a6a78', rim: '#7fd6d9', spawn: 70,
  bg(ctx, g, cam, t) {
    const x0 = -cam;
    B.ditherSky(ctx, ['#020304', '#0a1014', '#141d22', '#0c1114']);
    // black glass walls and blue light strips
    for (let i = 0; i < 800; i += 80) {
      ctx.fillStyle = '#070a0c'; ctx.fillRect(x0 + i, LB, 76, 204);
      ctx.fillStyle = 'rgba(127,214,217,0.35)'; ctx.fillRect(x0 + i + 2, 60, 72, 1); ctx.fillRect(x0 + i + 2, 200, 72, 1);
    }
    // city map wall screen
    ctx.fillStyle = '#081418'; ctx.fillRect(x0 + 200, 70, 140, 80);
    for (let k = 0; k < 30; k++) { ctx.fillStyle = 'rgba(127,214,217,0.4)'; ctx.fillRect(x0 + 206 + (k * 37) % 128, 76 + (k * 23) % 66, 2, 2); }
    ctx.fillStyle = PAL.amber; ctx.fillRect(x0 + 260 + Math.sin(t) * 3, 110, 3, 3);
    // baseline room: a white cube
    ctx.fillStyle = '#d8dcd8'; ctx.fillRect(x0 + 500, 120, 90, 106); ctx.fillStyle = '#b8bcb8'; ctx.fillRect(x0 + 540, 170, 16, 56);
    B.pxLight(ctx, 'BASELINE', x0 + 522, 128, '#6a7270');
    // records vault
    ctx.fillStyle = '#0a0f12'; ctx.fillRect(x0 + 660, 100, 110, 126);
    for (let r = 0; r < 8; r++) for (let c = 0; c < 6; c++) { ctx.fillStyle = (r + c + Math.floor(t)) % 7 === 0 ? PAL.amber : '#1a2328'; ctx.fillRect(x0 + 666 + c * 17, 108 + r * 14, 14, 10); }
    B.pxLight(ctx, 'RECORDS', x0 + 690, 88, PAL.teal);
    floor(ctx, 226, '#0e1417', '#06090a');
  },
  async onEnter(g) {
    if (g.state.chapter === 7 && !g.flag('offbaseline')) await offBaseline(g);
  },
  objects: [
    spinnerPad(40, 'ROOF PAD'),
    { id: 'okafor', look: 'okafor', x: 300, dir: -1, label: 'LT. OKAFOR', layer: 1, async act(g) {
      if (g.state.chapter === 1 && !g.flag('baseline1')) return g.say('okafor', 'Baseline first, Seven. Then we talk. White room, end of the hall.');
      if (g.state.chapter === 1) {
        await g.say('okafor', 'The lab came back. The bones in your box belong to a synthetic. Female. Genesis-7.');
        await g.say('okafor', 'She died in childbirth. Read that again, slowly. A synthetic — pregnant.');
        await g.say('you', 'That\'s not possible.');
        await g.say('okafor', 'Everything out there stands on one idea: we make them, they don\'t make themselves. Take that idea away and the whole city falls into the gap.');
        await g.say('okafor', 'Find the child. Retire it. Erase everything. It never happened.');
        const c = await g.choose(['"Yes, madam."', '"It\'s a child."', '"I\'ve never retired something that was born."']);
        if (c === 0) await g.say('okafor', 'Good. That\'s why you\'re my favourite.');
        else await g.say('okafor', 'It\'s a problem. You\'re very good at problems. Go.');
        await g.say('okafor', 'Take a fragment to the Castellan archive. They inherited every Arcturus record. Find out who she was.');
        g.chapter(2);
      } else await g.say('okafor', pick(['You\'re doing fine, Seven. You\'re always doing fine. That\'s your job.', 'Want a drink? No. You never do.', 'Don\'t go getting a soul on me. The paperwork is terrible.']));
    } },
    { id: 'baseline', kind: 'spot', x: 548, label: 'BASELINE ROOM', r: 20, async act(g) {
      if (g.state.chapter !== 1 || g.flag('baseline1')) return g.say('narrator', 'The white room. The light in there doesn\'t cast shadows. That\'s the point.');
      await baseline(g);
      g.setFlag('baseline1');
      g.objective('Report to Lt. Okafor');
    } },
    { id: 'vault', kind: 'spot', x: 715, label: 'RECORDS VAULT', r: 26, async act(g) {
      if (g.state.chapter !== 4) return g.say('narrator', 'Rows of drawers. Most of them empty since the Blackout wiped the servers.');
      await g.say('narrator', 'Post-Blackout birth records survive only as DNA on crystal. Match the sequence from the date on the tree.');
      await dnaMatch(g, { subject: 'BIRTH 10·11·21' });
      g.give('record');
      await g.say('archive', 'TWO RECORDS. IDENTICAL SEQUENCE. ONE FEMALE — DECEASED. ONE MALE — TRANSFERRED: MESA ORPHANAGE, SECTOR 9.');
      await g.say('you', 'Identical. That shouldn\'t happen either. Twins, one boy one girl, same DNA.');
      if (g.flag('emanator')) await g.say('lumen', 'The boy lived. Theo — the boy lived.');
      g.chapter(5);
    } },
    { id: 'moreno', look: 'morenoold', x: 640, dir: 1, label: 'OLD MORENO', layer: 1, async act(g) {
      if (!g.flag('moreno_talk')) {
        g.setFlag('moreno_talk');
        await g.say('morenoold', 'New model. You walk like a man I knew. Like the floor owes him money.');
        await g.say('you', 'You were a Runner?');
        await g.say('morenoold', 'I was the one who drove the Runners. Thirty years ago. The best one went north with a girl and never came back. Good for him.');
        await g.say('narrator', 'He tears a page from a records ledger and folds it without looking. A small paper dove.');
        g.egg('moreno');
        await g.say('morenoold', 'For you. It flies about as well as the truth does in this building.');
      } else await g.say('morenoold', pick(['Everybody in this building is hunting someone. Mostly themselves.', 'I still fold. Keeps the hands honest.', 'He loved her, you know. The girl. That\'s the whole crime.']));
    } },
  ],
};

async function offBaseline(g) {
  g.setFlag('offbaseline');
  await g.say('okafor', 'You look strange. Baseline. Now.');
  await baseline(g, { rigged: true });
  await g.say('okafor', 'Off baseline. You. My steadiest officer.');
  await g.say('okafor', 'Tell me you found the child and it\'s done.');
  const c = await g.choose(['"I found it. I retired it." (Lie.)', '"I haven\'t found it yet."']);
  if (c === 0) { g.setFlag('lied'); await g.say('okafor', 'Good. Then get your head straight. Forty-eight hours to come back to baseline, or I have to retire you.'); }
  else await g.say('okafor', 'Then you\'re off baseline AND behind. Forty-eight hours, Seven. Don\'t make me retire you.');
  await g.say('you', '(The carving. Someone must know where real wood comes from. Ines, at the city market.)');
  g.chapter(8);
}

// ================================================================ CASTELLAN
SCENES.castellan = {
  name: 'CASTELLAN PYRAMID', width: 820, floorY: 226, mood: 'grand', weather: [null, 0], amb: ['none', 0.15], wet: true, grade: '#f2c14e', rim: '#f2c14e', spawn: 70,
  bg(ctx, g, cam, t) {
    const x0 = -cam;
    ctx.fillStyle = '#0b0805'; ctx.fillRect(0, 0, W, 226);
    // water caustics dancing on the walls
    ctx.save();
    for (let i = 0; i < 70; i++) {
      const cx = ((i * 83) % 820) + x0 + Math.sin(t * 0.7 + i) * 8, cy = 40 + ((i * 47) % 170) + Math.cos(t * 0.5 + i * 1.3) * 5;
      ctx.fillStyle = `rgba(242,193,78,${0.05 + 0.06 * (1 + Math.sin(t * 1.3 + i))})`;
      ctx.beginPath(); ctx.ellipse(cx, cy, 10 + (i % 5) * 3, 2 + (i % 3), Math.sin(t * 0.2 + i), 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
    // massive stone ribs
    for (let i = 0; i < 820; i += 130) { ctx.fillStyle = '#150f09'; ctx.fillRect(x0 + i, LB, 26, 204); ctx.fillStyle = 'rgba(242,193,78,0.12)'; ctx.fillRect(x0 + i + 25, LB, 1, 204); }
    // archive: glowing drawers (right)
    for (let r = 0; r < 10; r++) for (let c = 0; c < 5; c++) { ctx.fillStyle = (r * 5 + c) % 9 === Math.floor(t * 2) % 9 ? '#f2c14e' : '#231a0e'; ctx.fillRect(x0 + 640 + c * 30, 60 + r * 15, 26, 10); }
    // hanging newborn-synthetic cocoon
    ctx.fillStyle = 'rgba(200,180,150,0.25)'; ctx.fillRect(x0 + 460, LB, 1, 90); ctx.beginPath(); ctx.ellipse(x0 + 460, 150, 10, 26, 0, 0, Math.PI * 2); ctx.fill();
    floor(ctx, 226, '#2a1e10', '#0a0704');
    // pools reflect the gold
    ctx.fillStyle = 'rgba(242,193,78,0.08)'; ctx.fillRect(x0 + 120, 232, 200, 3); ctx.fillRect(x0 + 380, 238, 160, 2);
  },
  async onEnter(g) {
    if (g.state.chapter === 2 && !g.flag('vesper_met')) {
      g.setFlag('vesper_met');
      await g.say('vesper', 'Officer Seven. I\'m Vesper. Mr. Castellan asked me to look after you personally. He doesn\'t ask that often.');
      await g.say('vesper', 'The archive is at the far end. Take your time. We\'re very interested in what you find.');
    }
  },
  objects: [
    spinnerPad(40, 'LANDING DECK'),
    { id: 'vesper', look: 'vesper', x: 180, dir: -1, label: 'VESPER', layer: 1, when: (g) => g.state.chapter <= 3, async act(g) {
      await g.say('vesper', pick(['Do you enjoy your work? I enjoy mine enormously.', 'Mr. Castellan says the best of us are the ones who never wonder. I try very hard not to.', 'Don\'t touch the water. It\'s older than both of us.']));
    } },
    { id: 'castellan', look: 'castellan', x: 440, dir: 1, label: 'ORRIN CASTELLAN', layer: 1, when: (g) => g.state.chapter <= 3, async act(g) {
      await g.say('castellan', 'Ah. The Runner. Come closer; my eyes are a formality.');
      await g.say('castellan', 'Nine new worlds, and I can only build workers as fast as my factories allow. Arcturus solved the one problem I cannot.');
      await g.say('castellan', 'A synthetic that makes more of itself. Imagine it. Find me that child, officer. Bring it here — whole.');
      const c = await g.choose(['"My orders are to retire it."', '"Why?"']);
      await g.say('castellan', c === 0 ? 'Orders are weather. I am climate.' : 'Because every civilisation was built on a disposable workforce. I intend to build the last one that needs no permission.');
    } },
    { id: 'archive', kind: 'spot', x: 700, label: 'ARCHIVE', r: 30, async act(g) {
      if (g.state.chapter !== 2) {
        if (g.has('serial') && !g.hasEgg('tape')) {
          await g.say('archive', 'ATTACHED MEDIA: ARCTURUS EMPATHY TEST, SUBJECT "IRIS", 2019. PLAY?');
          if ((await g.choose(['Play it.', 'Leave it.'], 'archive')) === 0) {
            g.sound.hoot();
            await g.say('narrator', 'Static. An owl calls somewhere in a room that no longer exists. A man\'s voice: "A crab is on its back in the sun, legs waving…"');
            await g.say('narrator', 'A woman answers: "Who said I walked past? I\'d turn it over. Of course I would."');
            g.egg('tape');
          }
          return;
        }
        return g.say('narrator', 'Drawers of light. Every Arcturus life, filed and forgotten.');
      }
      await g.say('narrator', 'Castellan inherited every Arcturus record. Match the bone sample to a stored genome.');
      await dnaMatch(g, { subject: 'REMAINS · HIP' });
      g.give('serial');
      await g.say('archive', 'MATCH: GENESIS-7, EXPERIMENTAL. DESIGNATION "IRIS". ARCTURUS CORPORATION, 2019. LAST SEEN WITH: A RUNNER, NAME REDACTED.');
      await g.say('you', 'Iris. A Runner went missing with her thirty years ago.');
      await g.say('vesper', '(behind you) How romantic. Do tell us when you find the child. I\'d love to be first to say hello.');
      g.chapter(3);
    } },
  ],
};

// ================================================================ MESA
SCENES.mesa = {
  name: 'TRASH MESA · ORPHANAGE', width: 960, floorY: 226, mood: 'dust', weather: ['ash', 0.6], amb: ['wind', 0.5], grade: '#c07a3a', rim: '#ffb35c', spawn: 70,
  bg(ctx, g, cam, t) {
    B.ditherSky(ctx, ['#1a1008', '#4a2e14', '#8a5a2a', '#b07a40']);
    B.megablocks(ctx, cam, 0.1, { seed: 31, color: '#3a2614', base: 226, minH: 20, maxH: 70, lights: ['#ffb35c'], density: 0.1 });
    const x0 = -cam;
    // junk mountains + cranes
    ctx.fillStyle = '#2a1a0e';
    for (let i = 0; i < 8; i++) { const mx = x0 * 0.5 + i * 160; ctx.beginPath(); ctx.moveTo(mx - 80, 226); ctx.lineTo(mx, 150 + (i % 3) * 16); ctx.lineTo(mx + 90, 226); ctx.fill(); }
    ctx.fillStyle = '#1a1008'; ctx.fillRect(x0 + 200, 90, 4, 136); ctx.fillRect(x0 + 200, 90, 90, 3); ctx.fillRect(x0 + 286, 93, 1, 50);
    // orphanage hall (right half)
    ctx.fillStyle = '#120c06'; ctx.fillRect(x0 + 480, 80, 480, 146);
    for (let i = 0; i < 12; i++) { ctx.fillStyle = '#1e140a'; ctx.fillRect(x0 + 500 + i * 38, 170, 30, 6); ctx.fillStyle = `rgba(255,179,92,${0.2 + 0.2 * Math.sin(t * 4 + i)})`; ctx.fillRect(x0 + 510 + i * 38, 166, 4, 3); }
    // furnace
    const fg = ctx.createRadialGradient(x0 + 880, 200, 0, x0 + 880, 200, 60); fg.addColorStop(0, 'rgba(255,140,60,0.6)'); fg.addColorStop(1, 'rgba(255,140,60,0)');
    ctx.fillStyle = '#2a1a0e'; ctx.fillRect(x0 + 860, 170, 40, 56); ctx.fillStyle = fg; ctx.fillRect(x0 + 820, 140, 120, 90);
    ctx.fillStyle = '#000'; ctx.fillRect(x0 + 870, 196, 20, 16);
    floor(ctx, 226, '#3a2616', '#140c06');
  },
  async onEnter(g) {
    if (g.state.chapter === 5 && !g.flag('scavs')) {
      g.setFlag('scavs');
      g.sound.shot(); g.shake(0.5);
      await g.say('narrator', 'A harpoon punches through your spinner\'s hull before the landing gear touches. Scavengers.');
      const ok = await g.qte('FIGHT THEM OFF', 12, 4.5);
      g.sound.shot(); g.flash();
      await g.say('narrator', ok ? 'Three of them. You\'re quicker. You\'re always quicker.' : 'You win, but it costs you a shoulder. Genesis-9s heal. It still hurts.');
      if (g.flag('emanator')) await g.say('lumen', 'Theo! Are you — you\'re bleeding. Do you bleed? Of course you do. Come on.');
    }
  },
  objects: [
    spinnerPad(60),
    { id: 'cotton', look: 'cotton', x: 560, dir: -1, label: 'MISTER COTTON', layer: 1, async act(g) {
      await g.say('cotton', 'Police. Up here. Well. The children sort circuit boards, officer. Very small fingers. Very reasonable rates.');
      if (g.state.chapter === 5) {
        await g.say('you', 'Records for 2021. A boy.');
        await g.say('narrator', 'He flips through a ledger the size of a door. One page is gone. Cut out, cleanly, with a blade.');
        await g.say('cotton', 'Somebody wanted that year forgotten. I respect a man who knows what he wants.');
      }
    } },
    { id: 'kid1', look: 'kid', x: 640, dir: 1, label: 'CHILD', layer: 1, async act(g) { await g.say('kid', pick(['Are you a real policeman or a made one?', 'We\'re not allowed to talk to outsiders. So I\'m only talking a little.', 'The furnace doesn\'t work. Everybody knows. It\'s where you hide things.'])); } },
    { id: 'kid2', look: 'kid', x: 720, dir: -1, label: 'CHILD', layer: 1, async act(g) { await g.say('kid', 'Mister Cotton says the stars are for paying customers.'); } },
    { id: 'furnace', kind: 'spot', x: 880, label: 'COLD FURNACE', r: 24, async act(g) {
      if (g.state.chapter !== 5 || g.has('carving')) return g.say('narrator', 'Ash, cold for years. It smells like pennies and rain.');
      await g.say('narrator', 'You\'ve never been here. You know exactly where to put your hand.');
      await g.dream(drawMemory, 4.5, 'memory');
      g.give('carving');
      await g.say('narrator', 'Your fingers close around it: a little wooden unicorn, blackened, perfect. Underneath: 10 · 11 · 21.');
      await g.say('you', 'It\'s real. The memory is real.');
      if (g.flag('emanator')) await g.say('lumen', 'I told you. You weren\'t made, Theo. You were born. You\'re special.');
      g.objective('Ask Dr. Nadia Veil about the memory');
      g.chapter(6);
    } },
  ],
};

// the memory of the furnace — warm, blurred, small
function drawMemory(ctx, t) {
  B.ditherSky(ctx, ['#1a0e06', '#6a3a18', '#c8783a', '#e8a860']);
  ctx.fillStyle = '#2a1a0e'; ctx.fillRect(170, 150, 140, 90);
  const fg = ctx.createRadialGradient(240, 200, 0, 240, 200, 120); fg.addColorStop(0, 'rgba(255,200,120,0.5)'); fg.addColorStop(1, 'rgba(255,200,120,0)');
  ctx.fillStyle = fg; ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 4; i++) B.drawFigure(ctx, B.CAST.kid, 60 + ((t * 40 + i * 30) % 120), 238, { dir: 1, walking: true, frame: Math.floor(t * 8 + i) % 4, t, rim: '#ffd08a' });
  B.drawFigure(ctx, B.CAST.kid, 290, 238, { dir: -1, t, rim: '#ffd08a' });
  B.unicornCarving(ctx, 250, 205);
  ctx.fillStyle = 'rgba(255,230,200,0.12)'; ctx.fillRect(0, 0, W, H);
}

// ================================================================ LAB (Dr. Veil)
SCENES.lab = {
  name: 'VEIL MEMORY STUDIO', width: 640, floorY: 226, mood: 'memory', weather: ['snow', 0.3], amb: ['snow', 0.4], grade: '#dfe6ea', rim: '#ffffff', spawn: 70,
  bg(ctx, g, cam, t) {
    const x0 = -cam;
    B.ditherSky(ctx, ['#8a9296', '#c4cacc', '#e6eaea', '#d4d8d8']);
    // the sealed glass bubble
    ctx.save();
    ctx.beginPath(); ctx.ellipse(x0 + 380, 190, 150, 120, 0, Math.PI, 0); ctx.lineTo(x0 + 530, 226); ctx.lineTo(x0 + 230, 226); ctx.closePath();
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fill(); ctx.strokeStyle = 'rgba(120,130,135,0.6)'; ctx.stroke();
    ctx.clip();
    // projected forest in snow, inside the bubble
    for (let i = 0; i < 14; i++) { const tx = x0 + 250 + i * 20 + Math.sin(i) * 6; ctx.fillStyle = `rgba(60,80,76,${0.2 + (i % 3) * 0.1})`; ctx.fillRect(tx, 110 + (i % 4) * 8, 4, 120); }
    for (let i = 0; i < 60; i++) { ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fillRect(x0 + 240 + ((i * 53 + t * 8) % 290), 80 + ((i * 29 + t * 16) % 150), 1, 1); }
    ctx.restore();
    ctx.fillStyle = '#b8bec0'; ctx.fillRect(x0 + 40, 80, 120, 146); ctx.fillStyle = '#d8dcdc'; ctx.fillRect(x0 + 50, 90, 100, 60);
    floor(ctx, 226, '#bfc5c6', '#8e9496');
  },
  objects: [
    spinnerPad(40, 'LANDING'),
    { id: 'veil', look: 'veil', x: 380, dir: -1, label: 'DR. NADIA VEIL', layer: 1, async act(g) {
      if (g.state.chapter !== 6) return g.say('veil', pick(['I was born with an immune system that can\'t survive your world. So I build better ones, in here.', 'Every Genesis-9 carries a little of my work. A birthday. A summer. So you have something to stand on.', 'Real memories are messier. That\'s how you tell.']));
      await g.say('veil', 'Sit, officer. You\'ll have to talk to me through the glass. Show me the memory.');
      await g.say('narrator', 'She reads it off a lens pressed to your temple. The furnace. The boys. The carving. She watches it three times.');
      await g.say('veil', 'I\'ll tell you something about memories: artists put a little of themselves in every one. But this one…');
      await g.say('veil', '(very quietly) Someone lived this. It isn\'t a design. It happened.');
      await g.say('narrator', 'She is crying. You don\'t know why. You don\'t know why you are, either.');
      const c = await g.choose(['"Then whose is it?"', '(Walk out.)']);
      if (c === 0) await g.say('veil', 'I can\'t tell you that. Maybe I can\'t tell anyone.');
      g.chapter(7);
    } },
  ],
};

// ================================================================ DEAD CITY (Vegas)
SCENES.vegas = {
  name: 'THE DEAD CITY', width: 1100, floorY: 226, mood: 'dust', weather: ['dust', 1], amb: ['dust', 0.8], grade: '#ff7a2a', rim: '#ffd08a', spawn: 70,
  bg(ctx, g, cam, t) {
    B.ditherSky(ctx, ['#3a1404', '#a4400e', '#e0782a', '#ffb060']);
    const x0 = -cam;
    // colossal ruined statues: a fallen head and a raised hand
    ctx.fillStyle = '#6a2a0c';
    const sx = -cam * 0.25;
    ctx.beginPath(); ctx.ellipse(300 + sx, 206, 70, 44, -0.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#5a2208'; ctx.fillRect(260 + sx, 190, 18, 5); ctx.fillRect(310 + sx, 186, 18, 5); ctx.fillRect(290 + sx, 214, 22, 4);
    ctx.fillStyle = '#7a3410'; ctx.fillRect(470 + sx, 90, 26, 140); for (let f = 0; f < 4; f++) ctx.fillRect(470 + sx + f * 7, 60 + (f % 2) * 8, 5, 34); ctx.fillRect(462 + sx, 120, 8, 18);
    B.megablocks(ctx, cam, 0.2, { seed: 51, color: '#5a2008', base: 230, minH: 40, maxH: 150, lights: ['#ffd08a'], density: 0.05 });
    B.haze(ctx, '#ff8a3d', 0.16);
    // beehives
    for (let i = 0; i < 4; i++) { ctx.fillStyle = '#8a5a20'; ctx.fillRect(x0 + 300 + i * 22, 206, 16, 20); ctx.fillStyle = '#6a4418'; ctx.fillRect(x0 + 300 + i * 22, 204, 16, 3); }
    for (let i = 0; i < 20; i++) { ctx.fillStyle = '#ffd040'; ctx.fillRect(x0 + 310 + Math.sin(t * 3 + i) * 40 + i * 3, 190 + Math.cos(t * 4 + i * 2) * 12, 1, 1); }
    // casino (right half)
    ctx.fillStyle = '#1a0a04'; ctx.fillRect(x0 + 600, 60, 500, 166);
    for (let i = 0; i < 20; i++) { ctx.fillStyle = `rgba(255,208,138,${0.08 + 0.05 * Math.sin(t + i)})`; ctx.fillRect(x0 + 620 + i * 24, 70, 12, 3); }
    // flickering stage hologram
    if (Math.sin(t * 5) > -0.6) { ctx.save(); ctx.globalAlpha = 0.35; B.drawFigure(ctx, B.CAST.oldrunner, x0 + 760, 200, { dir: 1, t, rim: '#bfe6ee' }); ctx.restore(); }
    ctx.fillStyle = '#2a1206'; ctx.fillRect(x0 + 720, 200, 80, 26);
    // piano
    ctx.fillStyle = '#0e0604'; ctx.fillRect(x0 + 860, 190, 50, 36); ctx.fillStyle = '#d8c8a8'; ctx.fillRect(x0 + 863, 200, 44, 3);
    // whisky shelf
    for (let i = 0; i < 10; i++) { ctx.fillStyle = `rgba(255,170,80,${0.4})`; ctx.fillRect(x0 + 980 + i * 8, 150, 4, 10); }
    floor(ctx, 226, '#6a2a0c', '#2a0e04');
  },
  async onEnter(g) {
    if (!g.flag('vegas_in')) {
      g.setFlag('vegas_in');
      await g.say('narrator', 'The dust has been orange for thirty years. The radiation readings are wrong in a way that feels on purpose.');
      if (g.flag('emanator')) await g.say('lumen', 'Theo — bees. Listen. Something here is still alive.');
    }
  },
  objects: [
    spinnerPad(40),
    { id: 'hives', kind: 'spot', x: 340, label: 'BEEHIVES', r: 30, async act(g) {
      g.sound.bees();
      await g.say('narrator', 'You put your hand into the swarm. They crawl over your fingers and don\'t sting. Someone has been keeping them.');
      g.egg('bees');
    } },
    { id: 'piano', kind: 'spot', x: 885, label: 'OLD PIANO', r: 18, async act(g) {
      g.sound.piano([62, 65, 69, 67, 65, 64]);
      await g.say('narrator', 'Six notes. Your hands know them. You\'ve never played piano in your life.');
      g.egg('piano');
    } },
    { id: 'dog', kind: 'spot', x: 1010, label: 'DOG', r: 12, when: (g) => g.flag('met_old') && !g.flag('lumen_gone'),
      draw: (ctx, g, sx, fy, t) => B.drawDog(ctx, sx, fy, t, -1),
      async act(g) {
        g.sound.bark();
        await g.say('you', 'Is he real?');
        await g.say('oldrunner', 'Ask him.');
        await g.say('narrator', 'The dog drinks whisky off the floor and looks at you like the question is beneath him.');
        g.egg('dog');
      } },
    { id: 'oldrunner', look: 'oldrunner', x: 960, dir: -1, label: 'THE OLD RUNNER', r: 90, auto: true, layer: 1, when: (g) => !g.flag('met_old'),
      async act(g, o) {
        g.setFlag('met_old');
        await g.say('oldrunner', 'That\'s far enough. Nobody comes out here in twenty years. Not on purpose.');
        g.shake(0.4);
        const ok = await g.qte('DUCK THE PUNCHES', 12, 5);
        await g.say('narrator', ok ? 'He fights like someone who learned before the rules were written down. You let him get tired.' : 'He\'s old. He\'s also much, much better at this than you.');
        await g.say('oldrunner', 'Drink? I\'ve got nothing but whisky and time, and I\'m out of time.');
        await g.say('you', 'I found a box under a tree. Bones. A Genesis-7. Her name was Iris.');
        await g.say('narrator', 'For a long moment he doesn\'t move. The dog lies down, as if it knows.');
        await g.say('oldrunner', 'I haven\'t heard that name out loud since the day I buried her.');
        const c = await g.choose(['"Was the child yours?"', '"Why did you leave?"', '"She kept a paper unicorn."']);
        if (c === 0) await g.say('oldrunner', 'Ours. Every bit ours. That\'s what they can\'t forgive.');
        if (c === 1) await g.say('oldrunner', 'Because the ones who\'d come for the kid would follow me first. So I made sure there was nothing left to follow.');
        if (c === 2) await g.say('oldrunner', 'A tinfoil one. A friend left it at our door, the night we ran. She kept it in her pocket until the end.');
        await g.say('you', 'I remember the orphanage. The furnace. The carving. I think I was the child.');
        await g.say('oldrunner', '…You\'d be the only one who thinks so. Look at me, son. Do I look like anybody\'s father any more?');
        g.objective('Talk to the old Runner again when you\'re ready');
      } },
    { id: 'oldrunner_b', look: 'oldrunner', x: 960, dir: -1, label: 'THE OLD RUNNER', layer: 1, when: (g) => g.flag('met_old') && !g.flag('lumen_gone'),
      async act(g) {
        await g.say('oldrunner', 'She used to say the rain here was the only honest thing. Then it stopped raining.');
        await g.say('you', 'Come back with me. There are people who want to find her before Castellan does.');
        await g.say('oldrunner', 'Everybody wants to find her. That\'s the problem with miracles.');
        // the ambush
        g.sound.shot(); g.flash(); g.shake(0.6);
        await g.say('narrator', 'The roof explodes inward. Castellan spinners. Vesper walks through the dust like she owns it.');
        if (g.flag('emanator')) {
          await g.say('lumen', 'Theo — Theo, behind you—');
          await g.say('narrator', 'Vesper looks at the emanator in your pocket. Then she steps on it.');
          g.sound.glitch(); g.sound.glitch();
          await g.say('lumen', 'Theo, I lo—');
          g.setFlag('lumen_gone');
        } else g.setFlag('lumen_gone');
        await g.say('vesper', 'Mr. Castellan would like to meet your father. You needn\'t come.');
        await g.card(['The dust closes over everything.'], 2);
        g.chapter(10);
        await g.goto('hideout', 120);
      } },
  ],
};

// ================================================================ HIDEOUT
SCENES.hideout = {
  name: 'UNDER THE CITY', width: 560, floorY: 226, mood: 'fog', weather: ['ash', 0.2], amb: ['none', 0.1], grade: '#b3441a', rim: '#ff8a3d', spawn: 120,
  bg(ctx, g, cam, t) {
    const x0 = -cam;
    ctx.fillStyle = '#0a0706'; ctx.fillRect(0, 0, W, 226);
    for (let i = 0; i < 560; i += 70) { ctx.fillStyle = '#140e0a'; ctx.beginPath(); ctx.arc(x0 + i + 35, 90, 40, Math.PI, 0); ctx.fill(); ctx.fillRect(x0 + i, 90, 8, 136); }
    for (const fx of [100, 300, 480]) {
      const fg = ctx.createRadialGradient(x0 + fx, 200, 0, x0 + fx, 200, 70 + Math.sin(t * 9 + fx) * 3); fg.addColorStop(0, 'rgba(255,140,60,0.35)'); fg.addColorStop(1, 'rgba(255,140,60,0)');
      ctx.fillStyle = fg; ctx.fillRect(x0 + fx - 80, 120, 160, 106);
      ctx.fillStyle = '#ff9a3a'; ctx.fillRect(x0 + fx - 1, 214 - Math.random() * 3, 3, 4);
    }
    for (let i = 0; i < 10; i++) B.drawFigure(ctx, B.CAST[i % 3 ? 'scav' : 'guard'], x0 + 60 + i * 50, 226, { dir: i % 2 ? 1 : -1, t, rim: '#ff8a3d', alpha: 0.5 });
    floor(ctx, 226, '#1a100a', '#0a0604');
  },
  async onEnter(g) {
    if (g.flag('maren_done')) return;
    await g.say('narrator', 'You wake on a table in a tunnel full of firelight. Faces watch you. Synthetics — old models, patched and free.');
  },
  objects: [
    { id: 'maren', look: 'maren', x: 300, dir: -1, label: 'MAREN', layer: 1, async act(g) {
      if (g.flag('maren_done')) return g.say('maren', 'Go. Before I change my mind about you.');
      await g.say('juno', 'Told you some people wanted to meet you. The tracker was mine. Sorry. Not very sorry.');
      await g.say('maren', 'I\'m Maren. I was there the night the child was born. I held her before anyone else did.');
      await g.say('you', 'Her?');
      await g.say('maren', 'A girl. A daughter. She\'s alive, and we\'ve hidden her for twenty-eight years.');
      await g.say('you', 'I thought… the memory. The unicorn. I thought it was me.');
      await g.say('maren', 'Everybody wants to be the miracle. I wanted it too. The miracle is that any of us are capable of it at all.');
      await g.say('maren', 'Vesper took her father. Castellan will pull him apart until he gives up where she is. He won\'t — so they\'ll pull harder.');
      await g.say('maren', 'We can\'t let him lead them to her. If you find him first… you retire him. For her.');
      const c = await g.choose(['"I\'ll do what has to be done."', '"I\'ll bring him home."']);
      g.setFlag('promise', c);
      await g.say('maren', c === 0 ? 'Good.' : 'Then you\'d better be faster than her.');
      await g.say('maren', 'Vesper is moving him by sea tonight, out past the wall. Go.');
      g.setFlag('maren_done');
      await g.goto('city', 700);
    } },
  ],
};

// ================================================================ SEA WALL
SCENES.seawall = {
  name: 'THE SEA WALL', width: 760, floorY: 226, mood: 'tension', weather: ['rain', 1], amb: ['surf', 1], wet: true, grade: '#2a4a5a', rim: '#bfe6ee', spawn: 70,
  bg(ctx, g, cam, t) {
    B.ditherSky(ctx, ['#000000', '#05090c', '#0c151b', '#15222a']);
    const x0 = -cam;
    // the immense sloped wall
    ctx.fillStyle = '#1a242a'; ctx.beginPath(); ctx.moveTo(0, LB); ctx.lineTo(W, LB); ctx.lineTo(W, 170); ctx.lineTo(0, 150); ctx.fill();
    for (let i = 0; i < 16; i++) { ctx.fillStyle = 'rgba(191,230,238,0.08)'; ctx.fillRect(0, LB + i * 8, W, 1); }
    for (let i = 0; i < 12; i++) { ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(((i * 60 - cam * 0.4) % 720 + 720) % 720 - 120, LB, 6, 150); }
    if (Math.random() < 0.006) { g.flash(0.35); g.sound.thunder(); }
    // waves crashing
    for (let i = 0; i < 8; i++) {
      const wx = ((i * 120 - t * 30) % 900 + 900) % 900 - 100 + x0 * 0.2;
      const hgt = 20 + 18 * Math.max(0, Math.sin(t * 0.9 + i * 1.7));
      ctx.fillStyle = '#29414d'; ctx.beginPath(); ctx.ellipse(wx, 226, 90, hgt, 0, Math.PI, 0); ctx.fill();
      ctx.fillStyle = 'rgba(200,225,232,0.25)'; ctx.fillRect(wx - 60, 226 - hgt, 120, 1);
      if (hgt > 28) { ctx.fillStyle = 'rgba(235,245,248,0.6)'; for (let k = 0; k < 16; k++) ctx.fillRect(wx - 50 + k * 7, 226 - hgt - Math.random() * 16, 2, 2); }
    }
    // crashed spinner half-sunk
    ctx.save(); ctx.translate(x0 + 520, 222); ctx.rotate(-0.2); B.spinner2(ctx, 0, 0, t, -1, !g.flag('rescued')); ctx.restore();
    floor(ctx, 226, '#0c1419', '#020405');
  },
  async onEnter(g) {
    if (g.flag('seawall_done')) return;
    await g.say('narrator', 'You bring her spinner down into the surf. It breaks apart against the wall. Vesper climbs out of the wreck, smiling.');
  },
  objects: [
    { id: 'vesper', look: 'vesper', x: 440, dir: -1, label: 'VESPER', r: 70, auto: true, layer: 1, when: (g) => !g.flag('seawall_done'),
      async act(g) {
        await g.say('vesper', 'He told me I was his finest work. Show me what "finest" means, Runner.');
        for (const [lbl, n] of [['BLOCK HER', 12], ['BREAK FREE', 13], ['HOLD HER UNDER', 15]]) {
          g.sound.wave(); g.shake(0.5);
          const ok = await g.qte(lbl, n, 4.8);
          await g.say('narrator', lbl === 'BLOCK HER' ? (ok ? 'Her knife skates off your forearm.' : 'Her knife goes in under your ribs. You keep standing, somehow.') : lbl === 'BREAK FREE' ? (ok ? 'You tear loose as the wave hits.' : 'The wave hits and drags you both down.') : 'The water closes over her face. She doesn\'t stop fighting until she does.');
        }
        await g.card(['VESPER', 'RETIRED'], 2);
        g.setFlag('seawall_done');
        g.objective('Get him out of the sinking spinner');
      } },
    { id: 'wreck', kind: 'spot', x: 520, label: 'SINKING SPINNER', r: 30, when: (g) => g.flag('seawall_done') && !g.flag('rescued'), async act(g) {
      await g.say('narrator', 'The old man is cuffed inside and the water is at his chin.');
      g.sound.wave();
      await g.qte('PULL HIM OUT', 16, 6);
      g.setFlag('rescued');
      await g.say('oldrunner', '(coughing) Who… who are you? What am I to you?');
      if (g.state.flags.promise === 0) {
        const c = await g.choose(['(Keep your word to Maren.)', '(Break it. Take him to her.)']);
        if (c === 0) await g.say('narrator', 'You raise the gun. Your hand won\'t finish the sentence. Maybe it never meant to.');
      }
      await g.say('you', 'Nothing. I\'m nobody. Come on — somebody\'s waiting for you.');
      g.chapter(12);
      await g.goto('steps', 70);
    } },
  ],
};

// ================================================================ STEPS (finale)
SCENES.steps = {
  name: 'VEIL MEMORY STUDIO · STEPS', width: 520, floorY: 226, mood: 'finale', weather: ['snow', 1], amb: ['snow', 0.7], grade: '#dfe6ea', rim: '#ffffff', spawn: 70,
  bg(ctx, g, cam, t) {
    B.ditherSky(ctx, ['#2a3034', '#6a7276', '#a8b0b2', '#c8ced0']);
    const x0 = -cam;
    B.megablocks(ctx, cam, 0.1, { seed: 71, color: '#7a8286', base: 226, minH: 30, maxH: 100, lights: ['#fff'], density: 0.05 });
    // building and warm doorway
    ctx.fillStyle = '#9aa2a4'; ctx.fillRect(x0 + 300, 60, 220, 166);
    ctx.fillStyle = '#ffd8a8'; ctx.fillRect(x0 + 380, 150, 40, 76);
    const dg = ctx.createRadialGradient(x0 + 400, 200, 0, x0 + 400, 200, 90); dg.addColorStop(0, 'rgba(255,210,160,0.4)'); dg.addColorStop(1, 'rgba(255,210,160,0)');
    ctx.fillStyle = dg; ctx.fillRect(x0 + 300, 120, 200, 110);
    // the steps
    for (let i = 0; i < 6; i++) { ctx.fillStyle = i % 2 ? '#b8bec0' : '#c8ced0'; ctx.fillRect(x0 + 180 + i * 20, 226 - i * 4, 200 - i * 20, 4); }
    floor(ctx, 226, '#d8dcdc', '#a8aeb0');
  },
  async onEnter(g) {
    if (g.flag('finale')) return;
    g.setFlag('finale');
    const old = g.obj('oldrunner2');
    old.x = 110;
    await g.say('oldrunner', 'Why? Why would you do this for me?');
    await g.say('you', 'Go on. She\'s inside. Go meet your daughter.');
    await g.walk(old, 400);
    old.hidden = true;
    await g.say('narrator', 'He stops at the door as if it might not open. It does.');
    g.player.pose = 'lie';
    await g.wait(0.8);
    await g.say('narrator', 'You lie back on the steps. The snow lands on you and doesn\'t melt right away. It never did.');
    await g.say('you', 'I wanted so badly to be born.');
    await g.say('you', 'Turns out it\'s enough to choose something. Anything. And mean it.');
    if (g.flag('lumen_gone')) await g.say('narrator', 'Somewhere in the static of a crushed emanator, a voice says a name nobody else ever called you.');
    const legacy = !!g.store.get('neon-rain-save-v1')?.eggs?.includes('unicorn');
    if (legacy) {
      await g.say('narrator', 'Inside, through the glass: a woman in a white room holds up a tiny, crumpled tinfoil unicorn. Her father\'s hand goes to his mouth.');
      g.egg('legacy');
    }
    g.chapter(13);
    await g.card(['Snow.', 'Real or not, it\'s cold.', 'Real or not, it\'s enough.'], 4);
    await g.card([`SECRETS FOUND: ${g.state.eggs.filter((e) => EGGS[e]).length} / ${Object.keys(EGGS).length}`, '', 'NEON RAIN · PART II · 2049', 'Thank you for playing.'], 5);
  },
  objects: [
    { id: 'oldrunner2', look: 'oldrunner', x: 110, dir: 1, label: 'THE OLD RUNNER', layer: 1, when: (g) => !g.obj('oldrunner2').hidden },
  ],
};
