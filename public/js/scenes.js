// World, cast and story. All dialogue is original writing in homage to the
// rain-soaked neo-noir detective stories of the early '80s.
import * as A from './art.js';
const { PAL, W, H } = A;

// ---------------------------------------------------------------- cast
export const SPEAKERS = {
  you:      { name: 'YOU', look: 'runner', pitch: 0.8 },
  moreno:   { name: 'MORENO', look: 'moreno', pitch: 1.15 },
  captain:  { name: 'CAPT. HOLLOWAY', look: 'captain', pitch: 0.7 },
  radio:    { name: 'PRECINCT RADIO', look: 'captain', pitch: 0.7, tint: '#0d3030' },
  iris:     { name: 'IRIS', look: 'iris', pitch: 1.35 },
  vance:    { name: 'DR. SOLON VANCE', look: 'vance', pitch: 0.9 },
  brick:    { name: 'BRICK', look: 'brick', pitch: 0.6 },
  sable:    { name: 'SABLE', look: 'sable', pitch: 1.3 },
  wren:     { name: 'WREN', look: 'wren', pitch: 1.5 },
  kaspar:   { name: 'KASPAR', look: 'kaspar', pitch: 0.75 },
  chef:     { name: 'NOODLE CHEF', look: 'chef', pitch: 1.2 },
  hsu:      { name: 'OLD HSU', look: 'hsu', pitch: 1.0 },
  kato:     { name: 'MRS. KATO', look: 'kato', pitch: 1.25 },
  punk:     { name: 'STREET KID', look: 'punk', pitch: 1.4 },
  monk:     { name: 'PILGRIM', look: 'monk', pitch: 0.9 },
  walker:   { name: 'STRANGER', look: 'walker', pitch: 1.0 },
  esper:    { name: 'ESPER-9', look: null, pitch: 2, tint: '#0a2a14' },
  toy:      { name: 'TOY SOLDIER', look: null, pitch: 2.2, tint: '#2a1a0a' },
  narrator: { name: '', look: null, pitch: 0.6 },
};

export const ITEMS = {
  chicken:  { name: 'Paper chicken', desc: 'Folded by Moreno while you ate. A comment on your nerve?' },
  photo:    { name: 'Hotel photograph', desc: 'An empty room, a convex mirror. Brick kept it like a family album.' },
  scale:    { name: 'Scale', desc: 'Found in Brick\'s bathtub. Too perfect to be from a fish.' },
  matchman: { name: 'Paper matchman', desc: 'A little man with a big head. Moreno\'s idea of a portrait.' },
  hardcopy: { name: 'ESPER hardcopy', desc: 'A woman in the mirror. A snake tattoo on her throat.' },
  unicorn:  { name: 'Tinfoil unicorn', desc: 'Left at your door. Someone knows what you dream.' },
};

export const EGGS = {
  chicken:  'Coward\'s Wings — a paper chicken',
  blimp:    'Read the whole blimp ad',
  owl:      'Asked the owl a personal question',
  matchman: 'The Little Man — a paper matchman',
  esper:    'Something asleep in the photograph',
  dream:    'The Unicorn Dream',
  chess:    'Played the immortal move',
  konami:   'Amber Terminal mode (↑↑↓↓←→←→BA)',
  unicorn:  'Tinfoil unicorn — the true ending',
};

export const CHAPTERS = [
  { t: 'Rain on the Noodle Bar', o: 'Get something to eat at the noodle bar' },
  { t: 'The Briefing', o: 'Ride the spinner to the Precinct' },
  { t: 'The Empathy Test', o: 'Fly to the Arcturus Pyramid and test the Genesis-7' },
  { t: 'Hotel Meridian', o: 'Search Brick\'s room at the Hotel Meridian' },
  { t: 'Photographs', o: 'Go home. Run the photo through the ESPER' },
  { t: 'Animal Row', o: 'Trace the scale on Animal Row' },
  { t: 'The Serpent Room', o: 'Find the dancer at the Serpent Room' },
  { t: 'Night Calls', o: 'Go home' },
  { t: 'The Toymaker', o: 'Find Ezra Pell at the Hale Building' },
  { t: 'Rooftop', o: 'Follow Kaspar up to the roof' },
  { t: 'Epilogue', o: 'Go home to Iris' },
  { t: 'Case Closed', o: 'The end. Thank you for playing' },
];

export const DESTS = [
  { id: 'street', name: 'Chinatown — noodle bar', ok: () => true },
  { id: 'precinct', name: 'Precinct HQ', ok: (g) => g.flag('summoned') },
  { id: 'pyramid', name: 'Arcturus Pyramid', ok: (g) => g.state.chapter >= 2 },
  { id: 'hotel', name: 'Hotel Meridian', ok: (g) => g.state.chapter >= 3 },
  { id: 'home', name: 'Home — 97th floor', ok: (g) => g.state.chapter >= 3 },
  { id: 'market', name: 'Animal Row', ok: (g) => g.state.chapter >= 5 },
  { id: 'club', name: 'The Serpent Room', ok: (g) => g.state.chapter >= 6 && !g.flag('sable_done') },
  { id: 'pell', name: 'Hale Building', ok: (g) => g.state.chapter >= 8 && g.state.chapter < 10 },
];

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// shared spinner pad object (travel menu)
const spinnerPad = (x, label = 'SPINNER') => ({ id: 'spinner', kind: 'spinner', x, label, r: 20, layer: -1, draw: drawPad });
function drawPad(ctx, g, sx, fy, t) {
  ctx.fillStyle = '#1e1c2e'; ctx.fillRect(sx - 18, fy - 2, 36, 3);
  for (let i = 0; i < 5; i++) { ctx.fillStyle = Math.floor(t * 3 + i) % 5 === 0 ? PAL.amber : '#4a3a1a'; ctx.fillRect(sx - 16 + i * 8, fy - 3, 2, 1); }
  // police spinner parked on the pad
  ctx.fillStyle = '#2a2d3e'; ctx.fillRect(sx - 14, fy - 12, 28, 8); ctx.fillRect(sx - 9, fy - 17, 16, 6);
  ctx.fillStyle = '#9fd8ff'; ctx.globalAlpha = 0.5; ctx.fillRect(sx - 7, fy - 16, 12, 4); ctx.globalAlpha = 1;
  ctx.fillStyle = '#d9d9e3'; ctx.fillRect(sx - 14, fy - 9, 28, 1);
  pxLabel(ctx, 'POLICE', sx - 11, fy - 8, '#1a1a2a');
  ctx.fillStyle = Math.floor(t * 4) % 2 ? PAL.red : PAL.cyan; ctx.fillRect(sx - 2, fy - 19, 4, 2);
  const gl = ctx.createRadialGradient(sx, fy - 18, 0, sx, fy - 18, 22);
  gl.addColorStop(0, Math.floor(t * 4) % 2 ? 'rgba(255,74,61,0.35)' : 'rgba(56,225,255,0.35)'); gl.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gl; ctx.fillRect(sx - 24, fy - 42, 48, 42);
}
const pxLabel = (ctx, s, x, y, c) => A.pxText(ctx, s, x, y, c);

// ================================================================ SCENES
export const SCENES = {};

// ---------------------------------------------------------------- 1. STREET
SCENES.street = {
  name: 'CHINATOWN · 2019', width: 960, floorY: 148, rain: 1, wet: true, mood: 'city', spawn: 120,
  bg(ctx, g, cam, t) {
    A.sky(ctx, '#1a0b26', '#3a1433');
    A.pyramid(ctx, 250 - cam * 0.05, 118, 46, t);
    A.flares(ctx, [60 - cam * 0.05, 120 - cam * 0.05, 330 - cam * 0.05], 118, t);
    g.blimpBox = A.blimp(ctx, t, cam, 'OFF-WORLD COLONIES: A NEW LIFE UNDER A KINDER SKY *** ENLIST TODAY *** ');
    A.spinners(ctx, t, 3, 5);
    A.skyline(ctx, cam, 0.25, 11, 128, 30, 70, '#140f20', t, 0.22);
    A.skyline(ctx, cam, 0.5, 23, 140, 40, 90, '#0d0a16', t, 0.14);
    const x0 = -cam;
    // storefront row
    // near buildings: varied rooflines with alleys between them
    const tops = [52, 34, 70, 46, 30, 60, 38, 54, 28, 66, 42, 50];
    for (let i = 0; i < 12; i++) {
      if (i === 5) continue; // alley
      const bx = x0 + i * 80, top = tops[i];
      ctx.fillStyle = i % 2 ? '#100e19' : '#0c0b15'; ctx.fillRect(bx, top, 80, 148 - top);
      ctx.fillStyle = '#17142299'; ctx.fillRect(bx, top, 80, 2);
      for (let wy = top + 8; wy < 84; wy += 9) for (let wx = 8; wx < 72; wx += 12) {
        const on = ((i * 7 + wx * 3 + wy) % 11) < 3;
        ctx.fillStyle = on ? (i % 3 ? '#f5b14a44' : '#38e1ff33') : '#07060c';
        ctx.fillRect(bx + wx, wy, 6, 5);
      }
    }
    // alley haze
    ctx.fillStyle = 'rgba(120, 80, 160, 0.10)'; ctx.fillRect(x0 + 400, 60, 80, 88);
    // noodle bar
    ctx.fillStyle = '#2a1616'; ctx.fillRect(x0 + 190, 96, 120, 52);
    ctx.fillStyle = '#e3a44a'; ctx.globalAlpha = 0.35; ctx.fillRect(x0 + 196, 104, 108, 26); ctx.globalAlpha = 1;
    ctx.fillStyle = '#6a2020'; for (let i = 0; i < 12; i++) ctx.fillRect(x0 + 186 + i * 11, 90, 6, 8);
    ctx.fillStyle = '#4d1818'; ctx.fillRect(x0 + 184, 88, 132, 3);
    ctx.fillStyle = '#3a2a22'; ctx.fillRect(x0 + 196, 130, 108, 6); // counter
    ctx.fillStyle = '#1a1414'; ctx.fillRect(x0 + 198, 136, 104, 12);
    for (let i = 0; i < 4; i++) { ctx.fillStyle = '#5a4a3a'; ctx.fillRect(x0 + 212 + i * 24, 138, 6, 2); ctx.fillRect(x0 + 214 + i * 24, 140, 2, 8); }
    // steam
    for (let i = 0; i < 5; i++) { ctx.globalAlpha = 0.08; ctx.fillStyle = '#fff'; const sy = 126 - ((t * 12 + i * 9) % 40); ctx.fillRect(x0 + 262 + Math.sin(t + i) * 4, sy, 6, 4); }
    ctx.globalAlpha = 1;
    A.neon(ctx, 'NOODLES', x0 + 222, 74, PAL.amber, t, { scale: 2 });
    A.neon(ctx, 'RAMEN', x0 + 110, 50, PAL.pink, t, { vertical: true });
    A.neon(ctx, 'HOTEL', x0 + 360, 46, PAL.cyan, t, { vertical: true, flicker: 0.08 });
    A.neon(ctx, 'ODEON', x0 + 520, 60, PAL.violet, t, { scale: 2 });
    A.neon(ctx, 'ARCADE', x0 + 700, 80, PAL.green, t, { flicker: 0.1 });
    A.neon(ctx, 'SUSHI', x0 + 610, 44, PAL.red, t, { vertical: true });
    A.neon(ctx, 'BAR', x0 + 860, 70, PAL.pink, t, { scale: 2 });
    A.neon(ctx, 'KOLA', x0 + 430, 96, PAL.red, t, { flicker: 0.05 });
    // giant video screen with a smiling geisha-style face
    ctx.fillStyle = '#050409'; ctx.fillRect(x0 + 470, 20, 44, 34);
    const face = 0.6 + 0.2 * Math.sin(t * 0.5);
    ctx.globalAlpha = face; ctx.fillStyle = '#f1d5c5'; ctx.fillRect(x0 + 484, 26, 16, 22);
    ctx.fillStyle = '#111'; ctx.fillRect(x0 + 482, 22, 20, 6); ctx.fillRect(x0 + 482, 26, 3, 14); ctx.fillRect(x0 + 499, 26, 3, 14);
    ctx.fillStyle = '#b3243a'; ctx.fillRect(x0 + 490, 41, 4, 2);
    ctx.fillStyle = '#222'; ctx.fillRect(x0 + 487, 33, 3, 1); ctx.fillRect(x0 + 494, 33, 3, 1);
    ctx.globalAlpha = 1;
    // lamp posts
    for (const lx of [160, 420, 660, 900]) {
      ctx.fillStyle = '#16141f'; ctx.fillRect(x0 + lx, 70, 2, 78); ctx.fillRect(x0 + lx - 6, 70, 8, 2);
      const gl = ctx.createRadialGradient(x0 + lx - 5, 73, 0, x0 + lx - 5, 73, 30);
      gl.addColorStop(0, 'rgba(180,220,255,0.35)'); gl.addColorStop(1, 'rgba(180,220,255,0)');
      ctx.fillStyle = gl; ctx.fillRect(x0 + lx - 40, 60, 70, 90);
    }
    // arcade door
    ctx.fillStyle = '#081210'; ctx.fillRect(x0 + 704, 104, 22, 44);
    ctx.fillStyle = '#2aff8a'; ctx.globalAlpha = 0.15 + 0.1 * Math.sin(t * 9); ctx.fillRect(x0 + 704, 104, 22, 44); ctx.globalAlpha = 1;
    // floor
    ctx.fillStyle = PAL.floor; ctx.fillRect(0, 148, W, 32);
  },
  async onEnter(g) {
    if (!g.flag('intro')) {
      g.setFlag('intro');
      g.sound.thunder();
      await g.card(['LOS ANGELES', 'NOVEMBER, 2019'], 2.6);
      await g.say('narrator', [
        'The rain hasn\'t stopped since spring. Nobody remembers what the sky was for.',
        'You used to be a Runner — a detective who hunts synthetic humans that come back to Earth. You quit. Mostly.',
        'Tonight you just want noodles.',
      ]);
      g.chapter(0);
    }
    if (g.state.chapter === 6 && g.flag('sable_done') && !g.flag('brick_done')) await brickAmbush(g);
  },
  objects: [
    spinnerPad(60),
    { id: 'chef', look: 'chef', x: 262, dir: -1, label: 'NOODLE CHEF', layer: 1, async act(g) {
      if (!g.flag('ordered')) {
        await g.say('chef', 'Sit, sit! Rain makes everybody hungry. What you want?');
        const c = await g.choose(['One bowl. Noodles, fish, the usual.', 'What\'s good tonight?', 'Just the tea.']);
        if (c === 1) await g.say('chef', 'Tonight? Everything. Tomorrow? Maybe nothing. Eat tonight!');
        if (c === 2) await g.say('chef', 'Tea is not dinner. I give you noodles anyway. You pay for tea.');
        await g.say('chef', 'Two kinds of fish. Three kinds of noodle. You say one bowl, I hear four.');
        await g.say('you', 'One is enough.');
        await g.say('chef', 'One is never enough. Sit.');
        g.sound.select();
        await g.say('narrator', 'You eat. The broth tastes like a city that used to have oceans.');
        g.setFlag('ordered');
        g.objective('Someone is watching you from under a hat…');
      } else {
        await g.say('chef', pick(['More broth? Broth is free. Chopsticks is extra.', 'Your friend with the cane — he never pays. Very rude.', 'Two fish! Four noodle! …Ok, ok. One.']));
      }
    } },
    { id: 'moreno', look: 'moreno', x: 380, dir: -1, label: 'MORENO', r: 60, layer: 1,
      when: (g) => g.flag('ordered') && !g.flag('summoned'), auto: true,
      async act(g, o) {
        await g.walk(o, g.player.x + 24);
        await g.say('moreno', 'Oye, Runner. Kapitän wants you. Subito — ikimashō.');
        await g.say('you', 'Tell him I\'m retired. That\'s the whole point of the word.');
        await g.say('moreno', 'He say, no Runner is ever retired. Only the ones you chase.');
        await g.say('narrator', 'He folds a scrap of wrapper paper while he waits. His fingers are faster than his mouth.');
        g.sound.select();
        await g.say('moreno', 'For you. A little chicken. Leave it or take it — both are answers.');
        g.setFlag('summoned');
        g.chapter(1);
        await g.walk(o, 90);
        o.dir = 1;
      } },
    { id: 'moreno_wait', look: 'moreno', x: 90, dir: 1, label: 'MORENO', layer: 1,
      when: (g) => g.flag('summoned') && g.state.chapter === 1,
      async act(g) { await g.say('moreno', 'Spinner is waiting. The captain, he doesn\'t.'); } },
    { id: 'chicken', kind: 'item', x: 300, y: -18, label: 'PAPER CHICKEN', r: 26,
      when: (g) => g.flag('summoned') && !g.has('chicken'),
      draw: (ctx, g, sx, fy, t) => A.origami(ctx, 'chicken', sx - 3, fy - 22, t),
      async act(g) { g.give('chicken'); g.egg('chicken'); await g.say('you', 'A chicken. Subtle as a brick through a window.'); } },
    { id: 'blimp', kind: 'spot', x: 470, label: 'LOOK UP', r: 30,
      async act(g) {
        await g.say('narrator', 'A blimp drifts over the rooftops, its belly one giant screen:');
        await g.say('narrator', '"THE OFF-WORLD COLONIES. A new life under a kinder sky. Your own synthetic companion, custom built. Leave the rain behind. Enlist today."');
        await g.say('you', 'A kinder sky. On a moon with no air. Sure.');
        g.egg('blimp');
      } },
    { id: 'punk', look: 'punk', x: 560, dir: 1, patrol: [520, 640], speed: 14, label: 'STREET KID', layer: 1,
      async act(g) {
        await g.say('punk', pick([
          'Hey grandpa, you look like you arrest people. Do you arrest people?',
          'My brother signed up off-world. He sends postcards. They all say the same thing.',
          'Umbrellas light up so the spinners don\'t land on you. True story.',
        ]));
      } },
    { id: 'monk', look: 'monk', x: 790, dir: -1, label: 'PILGRIM', layer: 1,
      async act(g) { await g.say('monk', pick(['Every drop that falls here fell somewhere cleaner first.', 'Walk slowly. The city is older than it looks, and younger than it feels.', 'I pray for the made ones too. Somebody should.'])); } },
    { id: 'walker', look: 'walker', x: 700, dir: -1, patrol: [660, 900], speed: 10, label: 'STRANGER', layer: 1,
      async act(g) { await g.say('walker', pick(['Don\'t look at me. I haven\'t got an appointment with anybody.', 'Arcade\'s closed. The machines got better at the games than us.', 'They say the Pyramid never switches its lights off. Something in there can\'t sleep.'])); } },
    { id: 'arcade', kind: 'spot', x: 715, label: 'ARCADE DOOR', r: 14,
      async act(g) { await g.say('narrator', 'CLOSED FOR REPAIRS, reads a card taped to the glass. Underneath someone has scratched: ↑↑↓↓←→←→ B A'); } },
    { id: 'brick', look: 'brick', x: 520, dir: -1, layer: 2, when: (g) => g.flag('brick_ambush') && !g.flag('brick_done') },
    { id: 'iris_st', look: 'iris', x: 440, dir: 1, layer: 2, when: (g) => g.flag('iris_saves') && !g.flag('brick_done') },
  ],
};

async function brickAmbush(g) {
  g.setFlag('brick_ambush');
  g.player.x = 480; g.player.dir = 1;
  const brick = g.obj('brick');
  brick.x = 520;
  await g.say('brick', 'You walk slow for a man who kills people for money.');
  await g.say('you', 'Brick. You\'re a long way from your hotel room.');
  await g.say('brick', 'How old am I? Nobody tells me. Four years, they say, maybe less. How long do I have? How long, Runner?');
  g.sound.shot(); g.shake(0.4);
  await g.say('narrator', 'He knocks the gun out of your hand like it was a toy.');
  const ok = await g.qte('BREAK HIS GRIP', 12, 4.5);
  await g.say('narrator', ok ? 'You tear free for a second — just long enough to see the gun in the gutter, out of reach.' : 'His hand closes around your throat. The neon smears into long wet streaks.');
  await g.say('brick', 'Painful to live afraid, isn\'t it? Every morning, counting.');
  g.setFlag('iris_saves');
  g.sound.shot(); g.flash(); g.shake(0.5);
  await g.wait(0.6);
  g.setFlag('brick_done');
  await g.say('narrator', 'A shot. Brick folds into the rain. Behind him stands Iris, holding your gun with both hands, shaking.');
  await g.say('iris', 'I… I\'ve never shot anyone before.');
  await g.say('you', 'Neither had he. Not until they made him.');
  await g.say('narrator', 'You take her home. There is nowhere else to take her.');
  g.chapter(7);
  await g.goto('home', 200);
}

// ---------------------------------------------------------------- 2. PRECINCT
SCENES.precinct = {
  name: 'PRECINCT HQ', width: 520, floorY: 150, rain: 0, wet: false, mood: 'noir', spawn: 70,
  bg(ctx, g, cam, t) {
    A.sky(ctx, '#170a20', '#2b1030');
    A.skyline(ctx, cam, 0.15, 5, 110, 30, 70, '#120d1c', t, 0.25);
    A.spinners(ctx, t, 8, 3);
    const x0 = -cam;
    // walls with tall windows
    ctx.fillStyle = '#1b1a24';
    for (let i = 0; i < 520; i += 64) { ctx.fillRect(x0 + i, 0, 16, 150); }
    ctx.fillRect(x0, 0, 520, 14); ctx.fillRect(x0, 106, 520, 44);
    ctx.fillStyle = '#23212e'; ctx.fillRect(x0, 106, 520, 3);
    A.sweep(ctx, t, 150, 'rgba(160, 220, 255, 0.05)');
    // ceiling fans
    for (const fx of [140, 360]) {
      ctx.fillStyle = '#0c0b12'; ctx.fillRect(x0 + fx, 14, 1, 8);
      const a = t * 6;
      ctx.fillRect(x0 + fx - Math.cos(a) * 14, 22, Math.abs(Math.cos(a)) * 28 + 1, 2);
    }
    // desks
    for (const dx of [180, 230, 420]) { ctx.fillStyle = '#3a2e24'; ctx.fillRect(x0 + dx, 128, 34, 5); ctx.fillStyle = '#2a211a'; ctx.fillRect(x0 + dx + 2, 133, 3, 17); ctx.fillRect(x0 + dx + 29, 133, 3, 17); ctx.fillStyle = '#c8b27a'; ctx.fillRect(x0 + dx + 8, 125, 8, 3); }
    // captain's lamp
    ctx.fillStyle = '#2a6a3a'; ctx.fillRect(x0 + 238, 120, 8, 3); ctx.fillStyle = '#ffe9a0'; ctx.globalAlpha = 0.25; ctx.fillRect(x0 + 230, 123, 24, 6); ctx.globalAlpha = 1;
    // terminal
    ctx.fillStyle = '#10141a'; ctx.fillRect(x0 + 318, 110, 26, 20); ctx.fillStyle = '#0a2014'; ctx.fillRect(x0 + 320, 112, 22, 14);
    for (let i = 0; i < 4; i++) { ctx.fillStyle = PAL.green; ctx.globalAlpha = 0.6; ctx.fillRect(x0 + 322, 114 + i * 3, 4 + ((t * 5 + i * 3) % 14), 1); }
    ctx.globalAlpha = 1; ctx.fillStyle = '#222'; ctx.fillRect(x0 + 324, 130, 14, 20);
    A.neon(ctx, 'POLICE', x0 + 430, 30, PAL.cyan, t, { scale: 2, flicker: 0 });
    ctx.fillStyle = '#131219'; ctx.fillRect(0, 150, W, 30);
  },
  objects: [
    spinnerPad(40, 'ROOF PAD'),
    { id: 'captain', look: 'captain', x: 250, dir: -1, label: 'CAPT. HOLLOWAY', layer: 1, async act(g) {
      if (!g.flag('briefed')) {
        await g.say('captain', 'There he is. Sit down. Don\'t make that face, I haven\'t said anything yet.');
        await g.say('you', 'You\'re about to.');
        await g.say('captain', 'Four synthetics jumped an off-world shuttle two weeks ago. Genesis-7s. Killed the crew, ditched the ship off the coast, walked right into my city.');
        await g.say('captain', 'Six came down. Two tried to get inside the Arcturus Pyramid last night. The field wall fried one. The other got away.');
        await g.say('you', 'What do they want at Arcturus?');
        await g.say('captain', 'Same thing everybody wants from the people who made them. Answers. Refunds.');
        const c = await g.choose(['Give it to somebody else.', 'Why me?', 'How long do Genesis-7s last?']);
        if (c === 0) await g.say('captain', 'I did. He\'s breathing through a tube now. That\'s why it\'s you.');
        if (c === 1) await g.say('captain', 'Because you\'re the best I ever had, and because you owe me, and mostly because there\'s nobody else.');
        if (c === 2) { await g.say('captain', 'Arcturus built in a four-year fail-safe. They grow feelings eventually, see. So they don\'t get to keep them for long.'); }
        await g.say('captain', 'Files are on the terminal. Arcturus is expecting you — test their newest model on the empathy rig. I want to know if the thing even works on a Genesis-7.');
        await g.say('captain', 'Moreno will fly you. Try not to insult him; he speaks nine languages and all of them are about you.');
        g.setFlag('briefed');
        g.chapter(2);
      } else {
        await g.say('captain', pick(['Still here? The synthetics aren\'t.', 'Read the files. Then go read some people.', 'If it walks like a man and bleeds like a man, you still check its eyes.']));
      }
    } },
    { id: 'terminal', kind: 'spot', x: 331, label: 'CASE TERMINAL', async act(g) {
      g.sound.beep();
      for (;;) {
        const c = await g.choose(['KASPAR — N7 combat model', 'BRICK — N7 heavy loader', 'SABLE — N7 infiltration', 'WREN — N7 companion model', 'LOG OFF'], 'esper');
        if (c === 4) break;
        g.sound.beep();
        const files = [
          'KASPAR. Incept 2016. Combat, colonial defence. Optimum self-sufficiency. Led the shuttle takeover. Assumed to be the brain of the group. Note: writes poetry in the margins of his maintenance logs.',
          'BRICK. Incept 2017. Loader, nuclear fission docks. Can lift a ton; reportedly cannot count past his own birthday. Keeps photographs. Nobody knows of what.',
          'SABLE. Incept 2016. Retrained for political infiltration. Graceful, fast, patient. Last seen: none. Known interest: snakes.',
          'WREN. Incept 2017. Basic companion model for the colonies\' officer clubs. Acrobatic. Very attached to Kaspar.',
        ];
        await g.say('esper', files[c]);
      }
    } },
    { id: 'moreno_p', look: 'moreno', x: 450, dir: -1, label: 'MORENO', layer: 1, async act(g) {
      await g.say('moreno', pick(['Sientate, Runner. Sit. The captain prefers his heroes sitting down.', 'You look at the files, I look at you. Both are very sad reading.', 'I fold paper because paper keeps its shape. People don\'t.']));
    } },
  ],
};

// ---------------------------------------------------------------- 3. PYRAMID
SCENES.pyramid = {
  name: 'ARCTURUS PYRAMID · FL 700', width: 600, floorY: 150, rain: 0, wet: false, mood: 'love', spawn: 70,
  bg(ctx, g, cam, t) {
    const gr = ctx.createLinearGradient(0, 0, 0, 150);
    gr.addColorStop(0, '#2a1208'); gr.addColorStop(0.55, '#b0551a'); gr.addColorStop(1, '#f5b14a');
    ctx.fillStyle = gr; ctx.fillRect(0, 0, W, 150);
    // setting sun
    const sx = 240 - cam * 0.2;
    const sg = ctx.createRadialGradient(sx, 110, 4, sx, 110, 60);
    sg.addColorStop(0, '#fff2c0'); sg.addColorStop(0.2, '#ffc060'); sg.addColorStop(1, 'rgba(255,140,40,0)');
    ctx.fillStyle = sg; ctx.fillRect(0, 0, W, 150);
    A.skyline(ctx, cam, 0.2, 31, 150, 10, 40, '#3a1a0a', t, 0.1);
    const x0 = -cam;
    // colossal columns
    for (let i = 0; i < 600; i += 96) {
      ctx.fillStyle = '#1a0e08'; ctx.fillRect(x0 + i, 0, 26, 150);
      ctx.fillStyle = '#2a1810'; ctx.fillRect(x0 + i + 4, 0, 2, 150);
    }
    ctx.fillStyle = '#140a06'; ctx.fillRect(x0, 0, 600, 12);
    // long shafts of light
    ctx.save(); ctx.globalAlpha = 0.1; ctx.fillStyle = '#ffd890';
    for (let i = 0; i < 4; i++) { ctx.beginPath(); const bx = x0 + 40 + i * 140; ctx.moveTo(bx, 12); ctx.lineTo(bx + 40, 12); ctx.lineTo(bx + 110, 150); ctx.lineTo(bx + 60, 150); ctx.fill(); }
    ctx.restore();
    // test table + machine
    ctx.fillStyle = '#2a1a12'; ctx.fillRect(x0 + 320, 126, 60, 5); ctx.fillRect(x0 + 324, 131, 4, 19); ctx.fillRect(x0 + 372, 131, 4, 19);
    ctx.fillStyle = '#3a3a44'; ctx.fillRect(x0 + 336, 116, 20, 10);
    const bel = 2 + Math.sin(t * 2) * 2; ctx.fillStyle = '#5a4a3a'; ctx.fillRect(x0 + 340, 112 - bel, 8, 4 + bel);
    ctx.fillStyle = '#7dffa1'; ctx.fillRect(x0 + 352, 118, 2, 2);
    // owl perch
    ctx.fillStyle = '#2a1a10'; ctx.fillRect(x0 + 148, 110, 2, 40);
    ctx.fillStyle = '#1a0f08'; ctx.fillRect(0, 150, W, 30);
    ctx.fillStyle = 'rgba(255, 200, 120, 0.08)'; ctx.fillRect(0, 150, W, 30);
  },
  objects: [
    spinnerPad(40, 'LANDING PAD'),
    { id: 'owl', kind: 'spot', x: 150, label: 'THE OWL', r: 14,
      draw: (ctx, g, sx, fy, t) => A.owl(ctx, sx - 4, fy - 51, t, Math.floor(t * 0.7) % 5 === 0 && (t % 1.43) < 0.15),
      async act(g) {
        g.sound.hoot();
        await g.say('you', 'Is it real?');
        if (g.flag('test_done')) await g.say('iris', 'You\'re asking the wrong owl that question. Ask it about me instead.');
        else await g.say('iris', 'Nothing in this building is only one thing, detective. That owl cost more than your building. Both kinds of cost.');
        await g.say('narrator', 'The owl turns its head all the way around and blinks — once, a fraction too slowly.');
        g.egg('owl');
      } },
    { id: 'iris', look: 'iris', x: 300, dir: -1, label: 'IRIS', layer: 1, async act(g) {
      if (!g.flag('test_done')) await empathyTest(g);
      else await g.say('iris', pick(['You looked at me like a riddle the whole time. Did you solve me?', 'He says my memories are mine. He says a lot of things.', 'I play the piano. I remember lessons. I don\'t remember a teacher.']));
    } },
    { id: 'vance', look: 'vance', x: 420, dir: -1, label: 'DR. VANCE', layer: 1,
      when: (g) => g.state.chapter >= 2 && !g.flag('vance_dead'),
      async act(g) {
        if (!g.flag('test_done')) { await g.say('vance', 'Test her first, detective. Then we\'ll talk about what your machine can and cannot see.'); return; }
        await g.say('vance', pick(['Commerce is our goal. "More human than human" is merely what it says on the box.', 'Every one of my children is a masterpiece. Masterpieces are not meant to last.', 'I gave her a past so she could carry a future. Is that cruel? It\'s what parents do.']));
      } },
  ],
};

async function empathyTest(g) {
  await g.say('iris', 'You\'re the Runner. Dr. Vance says you\'re here to find out if the machine works. Does it hurt?');
  await g.say('you', 'Not you. Just the truth, a little.');
  await g.say('vance', 'Test her, detective. Humour an old man. I\'d like to see your rig fail.');
  await g.say('narrator', 'The Empathy Rig breathes on the table. A lens finds her iris. Pick your questions — watch the needle.');
  const Q = [
    { q: 'You\'re walking on a beach. A crab is on its back in the sun, legs waving. You walk past. Why?', a: 'Who said I walked past? …I\'d turn it over. Of course I would.', delay: 1.9, flag: true },
    { q: 'A friend gives you a wallet made of real calfskin.', a: 'I\'d return it. Then I\'d wonder what the calf thought about wallets.', delay: 0.9, flag: false },
    { q: 'You find a wasp crawling on your wrist.', a: 'I\'d let it walk. Then I\'d blow it gently toward the window.', delay: 1.1, flag: false },
    { q: 'Describe your earliest memory of your mother.', a: 'My mother… let me tell you about my mother.', delay: 3.4, flag: true },
    { q: 'You\'re watching an old film. A banquet: the main course is raw oysters and boiled dog.', a: 'I\'d… change the channel.', delay: 2.6, flag: true },
    { q: 'A child shows you his butterfly collection, and the killing jar.', a: 'I\'d take him to a doctor. Then I\'d open the jar.', delay: 1.2, flag: false },
  ];
  let asked = 0, spikes = 0;
  const left = [...Q];
  while (asked < 4) {
    const i = await g.choose(left.map((x) => x.q.length > 58 ? x.q.slice(0, 56) + '…' : x.q));
    const item = left.splice(i, 1)[0];
    await g.say('you', item.q);
    g.sound.heartbeat();
    await g.wait(0.5);
    await g.say('iris', item.a);
    const pupil = (2 + Math.random() * 0.4).toFixed(1), after = (+pupil + (item.flag ? 0.05 : 0.9)).toFixed(1);
    await g.say('esper', `RIG ▸ PUPIL ${pupil}→${after}mm · BLUSH ${item.flag ? 'NONE' : 'PRESENT'} · RESPONSE DELAY ${item.delay.toFixed(1)}s ${item.flag ? '▲ ANOMALY' : '· NOMINAL'}`);
    if (item.flag) spikes++;
    asked++;
  }
  await g.say('narrator', `${spikes} anomalies in ${asked} questions. Normally you need twenty. With her it's taken a hundred, it feels like.`);
  const verdict = await g.choose(['Verdict: HUMAN.', 'Verdict: SYNTHETIC.']);
  await g.say('vance', 'Iris, would you step out for a moment?');
  g.obj('iris').x = 520;
  if (verdict === 0) await g.say('vance', 'Human. How flattering — to me. No, detective. She is a Genesis-7. My finest.');
  else await g.say('vance', 'Synthetic. Well done. Your machine is better than I hoped and worse than you think. It took you four questions to be sure of something she doesn\'t know herself.');
  await g.say('you', 'She doesn\'t know?');
  await g.say('vance', 'She has a childhood. My niece\'s childhood, actually. Memories are a cushion — they make the emotions behave. Give a mind a past and it stops screaming.');
  await g.say('you', 'How can it not know what it is?');
  await g.say('vance', 'How do you know what you are, detective? Go on. The escapees won\'t wait for our philosophy.');
  g.setFlag('test_done');
  if (verdict === 1) g.setFlag('saw_through');
  g.obj('iris').x = 300;
  await g.say('radio', 'Holloway here. We traced Brick to the Hotel Meridian, room twelve. He\'s gone. His things aren\'t. Go look.');
  g.chapter(3);
}

// ---------------------------------------------------------------- 4. HOTEL
SCENES.hotel = {
  name: 'HOTEL MERIDIAN · ROOM 12', width: 520, floorY: 150, rain: 0, wet: false, mood: 'noir', spawn: 60,
  bg(ctx, g, cam, t) {
    const x0 = -cam;
    A.room(ctx, cam, 520, '#1c2620', '#0e1410', 150, '#15130f');
    // wallpaper stripes, peeling
    for (let i = 0; i < 520; i += 8) { ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(x0 + i, 0, 3, 147); }
    ctx.fillStyle = '#2e3a2c'; ctx.fillRect(x0 + 200, 20, 18, 30); ctx.fillRect(x0 + 380, 60, 12, 22);
    // window w/ neon outside
    A.blinds(ctx, x0 + 150, 40, 40, 50, t, Math.floor(t * 2) % 3 ? '#ff4a3d' : '#5a1a1a');
    A.neon(ctx, 'HOTEL', x0 + 160, 58, PAL.red, t, { box: false, flicker: 0.2 });
    // bed
    ctx.fillStyle = '#2a2a24'; ctx.fillRect(x0 + 310, 130, 60, 12); ctx.fillStyle = '#8a8470'; ctx.fillRect(x0 + 312, 126, 56, 5); ctx.fillStyle = '#c8c0a8'; ctx.fillRect(x0 + 356, 124, 12, 4);
    ctx.fillStyle = '#1a1a14'; ctx.fillRect(x0 + 312, 142, 3, 8); ctx.fillRect(x0 + 365, 142, 3, 8);
    // dresser
    ctx.fillStyle = '#3a2a1c'; ctx.fillRect(x0 + 246, 118, 30, 32); ctx.fillStyle = '#2a1e14'; ctx.fillRect(x0 + 248, 124, 26, 1); ctx.fillRect(x0 + 248, 134, 26, 1);
    ctx.fillStyle = '#c0a060'; ctx.fillRect(x0 + 260, 128, 2, 1); ctx.fillRect(x0 + 260, 138, 2, 1);
    // convex mirror
    ctx.fillStyle = '#6a6a5a'; ctx.beginPath(); ctx.arc(x0 + 261, 96, 9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#9aa4a0'; ctx.beginPath(); ctx.arc(x0 + 261, 96, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.globalAlpha = 0.4; ctx.fillRect(x0 + 257, 92, 2, 2); ctx.globalAlpha = 1;
    // bathroom
    ctx.fillStyle = '#d8d8cc'; ctx.fillRect(x0 + 400, 40, 110, 110); ctx.fillStyle = '#b8b8ac';
    for (let yy = 40; yy < 150; yy += 6) ctx.fillRect(x0 + 400, yy, 110, 1);
    ctx.fillStyle = '#eeeee4'; ctx.fillRect(x0 + 412, 128, 50, 14); ctx.fillStyle = '#9ab0b0'; ctx.fillRect(x0 + 414, 128, 46, 3);
    ctx.fillStyle = '#0e1410'; ctx.fillRect(x0 + 396, 40, 4, 110);
    // bare bulb
    ctx.fillStyle = '#ffe9a0'; ctx.fillRect(x0 + 300, 20, 2, 3);
    const bg = ctx.createRadialGradient(x0 + 301, 22, 0, x0 + 301, 22, 90); bg.addColorStop(0, 'rgba(255,230,160,0.18)'); bg.addColorStop(1, 'rgba(255,230,160,0)');
    ctx.fillStyle = bg; ctx.fillRect(x0 + 200, 0, 200, 150);
    ctx.fillStyle = '#0d0c0a'; ctx.fillRect(x0 + 300, 0, 1, 20);
  },
  objects: [
    spinnerPad(40, 'STAIRS · SPINNER'),
    { id: 'moreno_h', look: 'moreno', x: 110, dir: 1, label: 'MORENO', layer: 1,
      when: (g) => g.state.chapter >= 3 && !g.has('matchman'),
      async act(g) {
        await g.say('moreno', 'Nothing here, Runner. A synthetic lives like a monk. No friends, no mail, no smell.');
        await g.say('you', 'Everybody keeps something.');
        await g.say('narrator', 'Moreno shrugs and folds a matchstick into a little man with a big, heavy head. He leaves it on the doorframe and walks out.');
        g.give('matchman'); g.egg('matchman');
        await g.say('moreno', 'That one is you. Big head, full of thinking. Adiós.');
      } },
    { id: 'drawer', kind: 'spot', x: 261, label: 'DRESSER', r: 16, async act(g) {
      if (g.has('photo')) return g.say('narrator', 'Empty drawers. Socks folded like soldiers.');
      g.give('photo');
      await g.say('narrator', 'Under the lining of the bottom drawer: a stack of photographs. Rooms, mostly. Empty rooms. Brick kept them like family albums.');
      await g.say('you', 'Synthetics collecting photographs. Like they need proof they were somewhere.');
      checkHotel(g);
    } },
    { id: 'bed', kind: 'spot', x: 340, label: 'BED', async act(g) { await g.say('narrator', pick(['The mattress is still warm. Or you want it to be.', 'Under the bed: dust, a single playing card — the jack of hearts — and a cheap alarm clock that doesn\'t tick.'])); } },
    { id: 'tub', kind: 'spot', x: 437, label: 'BATHTUB', r: 18, async act(g) {
      if (g.has('scale')) return g.say('narrator', 'A ring of grey water. Nothing else.');
      g.give('scale');
      await g.say('narrator', 'In the drain, caught on the grate: a single scale. Iridescent, perfect, and far too regular to come from any fish you\'ve eaten.');
      checkHotel(g);
    } },
  ],
};
function checkHotel(g) { if (g.has('photo') && g.has('scale') && g.state.chapter === 3) g.chapter(4); }

// ---------------------------------------------------------------- 5. HOME
SCENES.home = {
  name: 'YOUR APARTMENT · FL 97', width: 520, floorY: 150, rain: 0, wet: false, mood: 'love', spawn: 110,
  bg(ctx, g, cam, t) {
    const x0 = -cam;
    A.room(ctx, cam, 520, '#1a1416', '#0d0a0c', 150, '#120e0f');
    // textured "Mayan" block wall
    for (let yy = 16; yy < 146; yy += 12) for (let xx = 0; xx < 520; xx += 12) {
      ctx.fillStyle = (xx / 12 + yy / 12) % 2 ? '#211a1c' : '#1d1719';
      ctx.fillRect(x0 + xx, yy, 11, 11); ctx.fillStyle = '#2a2224'; ctx.fillRect(x0 + xx + 3, yy + 3, 5, 5);
    }
    // balcony window w/ blinds & blimp light
    A.blinds(ctx, x0 + 50, 30, 60, 70, t, '#9fd8ff');
    A.sweep(ctx, t * 0.7, 150, 'rgba(160, 220, 255, 0.05)');
    // door
    ctx.fillStyle = '#2a2224'; ctx.fillRect(x0 + 130, 90, 26, 60); ctx.fillStyle = '#7dffa1'; ctx.fillRect(x0 + 152, 115, 2, 3);
    // esper console (TV)
    ctx.fillStyle = '#2a2a30'; ctx.fillRect(x0 + 206, 112, 30, 22); ctx.fillStyle = '#062012'; ctx.fillRect(x0 + 209, 115, 24, 15);
    ctx.fillStyle = PAL.green; ctx.globalAlpha = 0.4 + 0.2 * Math.sin(t * 5); ctx.fillRect(x0 + 211, 117, 20, 1); ctx.fillRect(x0 + 211, 121, 12, 1); ctx.globalAlpha = 1;
    ctx.fillStyle = '#1a1a1e'; ctx.fillRect(x0 + 212, 134, 18, 16);
    // piano
    ctx.fillStyle = '#0e0a0a'; ctx.fillRect(x0 + 340, 108, 60, 42); ctx.fillStyle = '#eee'; ctx.fillRect(x0 + 344, 122, 52, 4);
    for (let i = 0; i < 13; i++) { ctx.fillStyle = '#111'; ctx.fillRect(x0 + 346 + i * 4, 122, 2, 2); }
    // framed photos on piano
    for (let i = 0; i < 5; i++) { ctx.fillStyle = '#8a7a5a'; ctx.fillRect(x0 + 346 + i * 11, 100, 8, 8); ctx.fillStyle = '#c8b890'; ctx.fillRect(x0 + 347 + i * 11, 101, 6, 6); }
    // couch
    ctx.fillStyle = '#3a2220'; ctx.fillRect(x0 + 430, 128, 60, 16); ctx.fillRect(x0 + 430, 118, 60, 10);
    // lamp glow
    const lg = ctx.createRadialGradient(x0 + 360, 90, 0, x0 + 360, 90, 80); lg.addColorStop(0, 'rgba(255,200,140,0.18)'); lg.addColorStop(1, 'rgba(255,200,140,0)');
    ctx.fillStyle = lg; ctx.fillRect(x0 + 260, 0, 200, 150);
  },
  async onEnter(g) {
    const c = g.state.chapter;
    if (c === 4 && !g.flag('iris_visit')) await irisVisit(g);
    if (c === 7 && !g.flag('night_talk')) await nightTalk(g);
    if (c === 10 && !g.flag('ending')) await ending(g);
  },
  objects: [
    spinnerPad(30, 'BALCONY PAD'),
    { id: 'door', kind: 'spot', x: 143, label: 'FRONT DOOR', async act(g) { await g.say('narrator', g.state.chapter >= 10 ? 'The door is ajar. You never leave it ajar.' : 'Nine locks, one door. The elevator knows your voice.'); } },
    { id: 'esper', kind: 'spot', x: 221, label: 'ESPER MACHINE', async act(g) {
      if (!g.has('photo')) return g.say('narrator', 'The ESPER hums, waiting for something worth looking at.');
      const solved = await g.esper();
      if (solved && !g.flag('esper_done')) {
        g.setFlag('esper_done'); g.give('hardcopy');
        await g.say('you', 'A woman in the mirror. Snake tattoo on her neck. And the scale — maybe not from a fish after all.');
        await g.say('you', 'Animal Row. Somebody down there knows who makes snakes.');
        g.chapter(5);
      }
    } },
    { id: 'piano', kind: 'spot', x: 370, label: 'PIANO', r: 18, async act(g) {
      g.sound.piano([62, 65, 69, 67, 65, 64]);
      if (g.flag('iris_visit') && !g.flag('dream')) {
        await g.say('narrator', 'You press a few keys. The notes hang in the air longer than they should…');
        await g.dream();
        g.setFlag('dream'); g.egg('dream');
        await g.say('narrator', 'A white horse with a single horn, running through a forest you have never walked. You wake at the keys, not sure which of you was dreaming.');
      } else {
        await g.say('narrator', pick(['You play three notes. The fourth never comes.', 'Middle C is out of tune. It has been for years.']));
      }
    } },
    { id: 'photos', kind: 'spot', x: 400, label: 'PHOTOGRAPHS', async act(g) { await g.say('narrator', 'Old photographs on the piano. Faces from a century nobody lived through. You don\'t remember where you got them.'); } },
    { id: 'iris_h', look: 'iris', x: 450, dir: -1, label: 'IRIS', layer: 1,
      when: (g) => g.state.chapter >= 7 && g.state.chapter < 11 && g.flag('night_talk'),
      async act(g) { await g.say('iris', pick(['I remember lessons. I don\'t know if it was me who had them. But I can play.', 'Stay a little. The rain sounds different when someone else hears it.', 'If they come for me, don\'t tell me when.'])); } },
    { id: 'unicorn', kind: 'item', x: 150, y: -1, label: 'SOMETHING ON THE FLOOR', r: 16,
      when: (g) => g.state.chapter === 10 && g.flag('dream') && g.has('chicken') && g.has('matchman') && !g.has('unicorn'),
      draw: (ctx, g, sx, fy, t) => A.origami(ctx, 'unicorn', sx - 4, fy - 8, t),
      async act(g) { await trueEnding(g); } },
  ],
};

async function irisVisit(g) {
  g.setFlag('iris_visit');
  await g.say('narrator', 'Someone was waiting in the elevator with you. You didn\'t notice until the doors opened on your floor.');
  await g.say('iris', 'I brought a photograph. Me and my mother. You think I\'m one of them. I\'m not. Look.');
  await g.say('you', 'Remember the nest outside your bedroom window? Swallows. Two eggs hatched. You watched them grow, then one morning they were gone and a cat was sitting on the sill.');
  await g.say('iris', '…I never told anyone that.');
  await g.say('you', 'Those are implants. Somebody else\'s summer.');
  const c = await g.choose(['Tell her the truth, gently.', 'Say it was a bad joke.']);
  if (c === 0) await g.say('you', 'I\'m sorry. You didn\'t deserve to find out from me.');
  else { await g.say('you', 'Hey… bad joke. I made it up. Go home.'); await g.say('iris', 'You\'re a terrible liar. It\'s the kindest thing about you.'); }
  await g.say('narrator', 'She leaves the photograph on the piano and is gone before you can say anything true.');
  g.setFlag('iris_told', c === 0);
  g.objective('Use the ESPER on the hotel photo');
}

async function nightTalk(g) {
  g.setFlag('night_talk');
  await g.say('iris', 'Would you hunt me, if I ran? North, somewhere cold where nobody checks eyes?');
  const c = await g.choose(['No. Someone else would.', 'I owe you a life. I won\'t.', '…']);
  if (c === 0) await g.say('iris', 'That\'s honest. It\'s not comforting, but it\'s honest.');
  if (c === 1) await g.say('iris', 'Owing isn\'t the same as wanting. But I\'ll take it.');
  if (c === 2) await g.say('iris', 'You look at me like the answer is written on my face. It isn\'t. I checked.');
  await g.say('iris', 'Play something. I remember lessons. I don\'t know if it was me who had them. But I can play.');
  g.sound.piano([65, 69, 72, 71, 69, 67, 65]);
  await g.wait(1.4);
  await g.say('radio', 'Runner, Holloway. Vance is dead. So is a genetic designer, Ezra Pell — he got Kaspar past the Pyramid security. Kaspar\'s been seen at Pell\'s place, the Hale Building.');
  await g.card(['— EARLIER THAT NIGHT —', 'THE TOP OF THE PYRAMID'], 2);
  await g.say('kaspar', 'Hello, father. I came a long way to meet the man who built a clock inside my chest.');
  await g.say('vance', 'You were made to be magnificent, Kaspar. Not to last. I gave you a comet\'s life.');
  await g.say('kaspar', 'Then you should have given me a comet\'s sky.');
  await g.say('vance', 'There is no way to add time. Every attempt kills the host. I\'ve tried, my boy. God help me, I tried.');
  await g.say('kaspar', 'I\'ve done things you would be proud of. And things you would not. I don\'t know which ones to be sorry for.');
  g.sound.thunder(); g.flash();
  await g.card(['The candles in the Pyramid went out one floor at a time.'], 2.4);
  g.setFlag('vance_dead');
  g.chapter(8);
}

async function ending(g) {
  g.setFlag('ending_arrived');
  await g.say('narrator', 'The door is ajar. You draw the gun before you know you\'ve done it.');
  await g.say('narrator', 'Iris is asleep on the couch. Breathing. You say her name and she wakes.');
  await g.say('iris', 'You came back.');
  if (g.flag('dream') && g.has('chicken') && g.has('matchman')) {
    await g.say('narrator', 'Something small and silver catches the light on the floor by the door.');
    g.objective('Look at what\'s on the floor by the door');
  } else {
    await finalCard(g, false);
  }
}
async function trueEnding(g) {
  g.give('unicorn'); g.egg('unicorn');
  await g.say('narrator', 'A unicorn, folded from a gum wrapper\'s tinfoil. Moreno was here. He let her live.');
  await g.say('narrator', 'And he knew. The forest, the white horse. He knew what you dream.');
  await g.say('you', 'Chicken. Matchman. Unicorn. He was never commenting on the case. He was commenting on me.');
  await g.say('iris', 'What does it mean?');
  await g.say('you', 'It means we leave. Tonight.');
  await finalCard(g, true);
}
async function finalCard(g, secret) {
  g.setFlag('ending');
  await g.say('moreno', secret ? '(an echo, somewhere down the hall) Pity she can\'t stay forever. Then again — who does?' : '(an echo, somewhere down the hall) You did a job. Whether it was the right one — that, nobody can tell you.');
  g.chapter(11);
  g.sound.setMood('finale');
  await g.card(secret
    ? ['The elevator doors close.', 'You don\'t know how long she has.', 'You don\'t know how long anyone has.', '', 'TRUE ENDING']
    : ['You leave together, into the rain.', 'Neither of you asks how long.', '', 'ENDING — some dreams leave paper behind…'], 5);
  await g.card([`SECRETS FOUND: ${g.state.eggs.length} / ${Object.keys(EGGS).length}`, '', 'NEON RAIN 2019', 'Thank you for playing.'], 5);
}

// ---------------------------------------------------------------- 6. MARKET
SCENES.market = {
  name: 'ANIMAL ROW', width: 820, floorY: 148, rain: 0.7, wet: true, mood: 'city', spawn: 70,
  bg(ctx, g, cam, t) {
    A.sky(ctx, '#0c1420', '#1a2a33');
    A.skyline(ctx, cam, 0.2, 41, 110, 40, 80, '#0f1822', t, 0.2);
    A.spinners(ctx, t, 12, 3);
    const x0 = -cam;
    // covered arcade
    ctx.fillStyle = '#0b0f14'; ctx.fillRect(x0, 50, 820, 98);
    ctx.fillStyle = '#1a2230'; ctx.fillRect(x0, 46, 820, 6);
    for (let i = 0; i < 820; i += 30) { ctx.fillStyle = '#111822'; ctx.fillRect(x0 + i, 52, 3, 96); }
    // stalls
    const stall = (sx, w, c, name, col) => {
      ctx.fillStyle = c; ctx.fillRect(x0 + sx, 100, w, 48); ctx.fillStyle = '#000'; ctx.globalAlpha = 0.3; ctx.fillRect(x0 + sx, 120, w, 28); ctx.globalAlpha = 1;
      ctx.fillStyle = '#6a5a3a'; ctx.fillRect(x0 + sx - 4, 94, w + 8, 6);
      A.neon(ctx, name, x0 + sx + 4, 70, col, t);
    };
    stall(170, 70, '#1e2a24', 'SCALES', PAL.green);
    stall(380, 80, '#1c2a34', 'EYE WORKS', PAL.cyan);
    stall(560, 70, '#2a1c24', 'BIRDS', PAL.pink);
    stall(690, 60, '#24201a', 'CATS', PAL.amber);
    A.neon(ctx, 'ANIMOIDS', x0 + 40, 58, PAL.amber, t, { scale: 2, flicker: 0.05 });
    // cages with birds
    for (let i = 0; i < 4; i++) {
      const bx = x0 + 566 + i * 16, by = 104 + (i % 2) * 10;
      ctx.strokeStyle = '#8a7a5a'; ctx.strokeRect(bx + 0.5, by + 0.5, 10, 10);
      ctx.fillStyle = ['#ff4a3d', '#38e1ff', '#f5b14a', '#7dffa1'][i]; ctx.fillRect(bx + 3 + (Math.floor(t * 2 + i) % 3), by + 5, 3, 2);
    }
    A.snake(ctx, x0 + 186, 110, t);
    // frost around Hsu's
    ctx.fillStyle = 'rgba(200, 240, 255, 0.12)'; ctx.fillRect(x0 + 380, 100, 80, 48);
    for (let i = 0; i < 6; i++) { ctx.fillStyle = 'rgba(220,245,255,0.3)'; ctx.fillRect(x0 + 386 + i * 12, 112 + ((t * 8 + i * 5) % 30), 1, 1); }
    // hanging eyes jars
    for (let i = 0; i < 5; i++) { ctx.fillStyle = '#9ab'; ctx.fillRect(x0 + 388 + i * 14, 104, 8, 8); ctx.fillStyle = '#fff'; ctx.fillRect(x0 + 391 + i * 14, 107, 2, 2); ctx.fillStyle = '#248'; ctx.fillRect(x0 + 392 + i * 14, 108, 1, 1); }
    ctx.fillStyle = '#10141a'; ctx.fillRect(0, 148, W, 32);
  },
  objects: [
    spinnerPad(40),
    { id: 'kato', look: 'kato', x: 205, dir: -1, label: 'MRS. KATO', layer: 1, async act(g) {
      if (g.state.chapter !== 5) return g.say('kato', pick(['Scales, feathers, fur. All fake, all honest about it.', 'Real snake? Ha. You couldn\'t afford the paperwork.']));
      await g.say('you', 'Can you tell me what this is from?');
      await g.say('narrator', 'She puts the scale under a scope the size of a thumbnail and hums.');
      await g.say('kato', 'Not fish. Snake. Synthetic — very good work. See the maker\'s mark? Serial NS-4471. Micro-etched between the cells.');
      await g.say('kato', 'Only one maker does work this fine: Tamsin, over by the docks. She sold a whole snake last month to a dancer at the Serpent Room.');
      g.chapter(6);
    } },
    { id: 'hsu', look: 'hsu', x: 420, dir: -1, label: 'OLD HSU', layer: 1, async act(g) {
      if (!g.flag('hsu_talk')) {
        g.setFlag('hsu_talk');
        await g.say('hsu', 'Cold! Close the curtain. Eyes need the cold. I need the eyes.');
        await g.say('hsu', 'Two of your runaways came here last week. A big blond one and a heavy one. They asked who designs the brains. I said: I only do eyes!');
        await g.say('hsu', 'I told them to see Ezra Pell. He works with Arcturus. Nice boy. Lives alone with his toys.');
        await g.say('you', 'You gave them a name.');
        await g.say('hsu', 'The blond one held my coat very gently while I was still wearing it. You would have given them a name too.');
      } else await g.say('hsu', pick(['If only you could see what I have seen with these eyes… Mostly other eyes.', 'Go! Cold is expensive.', 'I made the eyes of Genesis-7s. Beautiful work. Too beautiful to look at for long.']));
    } },
    { id: 'walker_m', look: 'walker', x: 300, dir: 1, patrol: [260, 360], speed: 12, label: 'STRANGER', layer: 1,
      async act(g) { await g.say('walker', pick(['I bought a synthetic owl once. It was more loyal than my brother.', 'Real animals? There\'s a waiting list. You die before your turn comes.'])); } },
    { id: 'monk_m', look: 'monk', x: 620, dir: -1, label: 'PILGRIM', layer: 1,
      async act(g) { await g.say('monk', 'The birds here sing songs recorded before they were made. Imagine that — born knowing a song you never heard.'); } },
  ],
};

// ---------------------------------------------------------------- 7. CLUB
SCENES.club = {
  name: 'THE SERPENT ROOM', width: 640, floorY: 150, rain: 0, wet: false, mood: 'noir', spawn: 70,
  bg(ctx, g, cam, t) {
    const x0 = -cam;
    const cg = ctx.createLinearGradient(0, 0, 0, 150); cg.addColorStop(0, '#0a0412'); cg.addColorStop(1, '#2a0c36');
    ctx.fillStyle = cg; ctx.fillRect(0, 0, W, 150);
    // neon tube along the ceiling and mirror-ball sparkles
    ctx.fillStyle = PAL.pink; ctx.shadowColor = PAL.pink; ctx.shadowBlur = 8; ctx.fillRect(x0, 12, 640, 1); ctx.shadowBlur = 0;
    for (let i = 0; i < 40; i++) { const sx = ((i * 97 + t * 25) % 640) + x0, sy = 20 + (i * 37) % 110; ctx.fillStyle = `rgba(255,220,255,${0.2 + 0.3 * Math.sin(t * 5 + i)})`; ctx.fillRect(sx, sy, 1, 1); }
    ctx.fillStyle = '#c8c8d8'; ctx.beginPath(); ctx.arc(x0 + 435, 22, 5, 0, Math.PI * 2); ctx.fill();
    // stage
    ctx.fillStyle = '#2a0f2a'; ctx.fillRect(x0 + 360, 120, 150, 30);
    ctx.fillStyle = '#ff2e88'; ctx.globalAlpha = 0.25; ctx.fillRect(x0 + 360, 120, 150, 2); ctx.globalAlpha = 1;
    // curtains
    for (let i = 0; i < 10; i++) { ctx.fillStyle = i % 2 ? '#4a0a1a' : '#3a0814'; ctx.fillRect(x0 + 350 + (i < 5 ? i * 4 : 130 + i * 4), 20, 4, 100); }
    // spotlight
    const sx = x0 + 435 + Math.sin(t * 0.8) * 30;
    ctx.save(); ctx.globalAlpha = 0.14; ctx.fillStyle = '#ffd0f0';
    ctx.beginPath(); ctx.moveTo(sx - 4, 0); ctx.lineTo(sx + 4, 0); ctx.lineTo(sx + 26, 150); ctx.lineTo(sx - 26, 150); ctx.fill(); ctx.restore();
    // crowd silhouettes
    for (let i = 0; i < 14; i++) {
      const cx = x0 + 180 + i * 22 + Math.sin(t * 2 + i) * 2, hh = 20 + (i * 7) % 8;
      ctx.fillStyle = '#07030a'; ctx.fillRect(cx, 150 - hh, 9, hh); ctx.fillRect(cx + 2, 150 - hh - 5, 5, 5);
    }
    // bar
    ctx.fillStyle = '#2a1a2e'; ctx.fillRect(x0 + 60, 124, 90, 26); ctx.fillStyle = '#5a3a6a'; ctx.fillRect(x0 + 60, 122, 90, 3);
    for (let i = 0; i < 8; i++) { ctx.fillStyle = [PAL.cyan, PAL.amber, PAL.pink, PAL.green][i % 4]; ctx.globalAlpha = 0.6; ctx.fillRect(x0 + 66 + i * 10, 100, 3, 8); } ctx.globalAlpha = 1;
    A.neon(ctx, 'SERPENT ROOM', x0 + 380, 30, PAL.pink, t, { flicker: 0.04 });
    A.neon(ctx, 'EXIT', x0 + 600, 90, PAL.red, t);
    ctx.fillStyle = '#0a0410'; ctx.fillRect(0, 150, W, 30);
  },
  objects: [
    spinnerPad(30, 'STREET'),
    { id: 'sable', look: 'sable', x: 440, dir: -1, label: 'SABLE', layer: 1, y: -2,
      when: (g) => !g.flag('sable_done'),
      draw: (ctx, g, sx, fy, t) => A.snake(ctx, sx - 8, fy - 22, t),
      async act(g, o) {
        await g.say('narrator', 'Backstage, the dancer is peeling off a sequinned second skin. A synthetic snake coils lazily over her shoulders.');
        await g.say('you', 'City Safety Board, ma\'am. We\'ve had complaints about peepholes in the dressing rooms.');
        await g.say('sable', 'Peepholes. You came all the way down here in this rain for peepholes?');
        await g.say('you', 'You\'d be amazed what people will do to get a look at a lady.');
        await g.say('sable', 'Not really. Is that snake-scale thing in your pocket for me, inspector?');
        g.sound.shot(); g.shake(0.3);
        await g.say('narrator', 'She\'s faster than you. Much faster. Her elbow is the last thing you see before the floor.');
        o.speed = 90; await Promise.all([g.walk(o, 700), g.qte('PUSH THROUGH THE CROWD', 10, 5)]);
        await g.card(['Out into the street.', 'Rain. Traffic. A clear plastic raincoat in the crowd.', 'You don\'t shout "stop". It never works.'], 3.2);
        g.sound.shot(); g.sound.glass(); g.flash();
        await g.card(['GENESIS-7 "SABLE"', 'RETIRED'], 2.6);
        await g.say('narrator', 'She went through three shop windows before she stopped. The mannequins watched without comment.');
        g.setFlag('sable_done');
        await g.goto('street', 470);
      } },
    { id: 'barman', kind: 'spot', x: 105, label: 'BAR', async act(g) {
      await g.say('narrator', pick(['You order a drink that tastes like it was distilled from the rain outside.', 'The barman polishes the same glass he\'s been polishing since you walked in.', 'A plaque behind the bar: "THE SERPENT ROOM — WHERE SKIN IS OPTIONAL."']));
    } },
  ],
};

// ---------------------------------------------------------------- 8. PELL / HALE BUILDING
SCENES.pell = {
  name: 'THE HALE BUILDING', width: 720, floorY: 150, rain: 0.35, wet: true, mood: 'tense', spawn: 70,
  bg(ctx, g, cam, t) {
    const x0 = -cam;
    ctx.fillStyle = '#0d0b10'; ctx.fillRect(0, 0, W, 150);
    // skylight
    ctx.fillStyle = '#1a1e2a'; ctx.fillRect(x0 + 100, 0, 520, 14);
    for (let i = 100; i < 620; i += 20) { ctx.fillStyle = '#0a0a0e'; ctx.fillRect(x0 + i, 0, 2, 14); }
    // wrought iron balconies
    for (const by of [40, 80]) {
      ctx.fillStyle = '#2a2420'; ctx.fillRect(x0, by, 720, 3);
      for (let i = 0; i < 720; i += 6) { ctx.fillRect(x0 + i, by - 10, 1, 10); if (i % 24 === 0) { ctx.fillRect(x0 + i - 2, by - 6, 5, 1); } }
    }
    // shafts of light from skylight
    ctx.save(); ctx.globalAlpha = 0.07; ctx.fillStyle = '#c8d8ff';
    for (let i = 0; i < 5; i++) { const bx = x0 + 140 + i * 100 + Math.sin(t * 0.3 + i) * 6; ctx.beginPath(); ctx.moveTo(bx, 14); ctx.lineTo(bx + 20, 14); ctx.lineTo(bx + 50, 150); ctx.lineTo(bx + 16, 150); ctx.fill(); }
    ctx.restore();
    // toys: marching soldiers
    for (let i = 0; i < 3; i++) {
      const tx = x0 + 180 + i * 14 + Math.floor(t * 4 + i) % 2;
      ctx.fillStyle = '#b02a2a'; ctx.fillRect(tx, 136, 5, 8); ctx.fillStyle = '#1a1a3a'; ctx.fillRect(tx, 132, 5, 4); ctx.fillStyle = '#e0c0a0'; ctx.fillRect(tx + 1, 130, 3, 3);
      ctx.fillStyle = '#222'; ctx.fillRect(tx + (Math.floor(t * 4 + i) % 2), 144, 2, 6); ctx.fillRect(tx + 3 - (Math.floor(t * 4 + i) % 2), 144, 2, 6);
    }
    // teddy bear
    ctx.fillStyle = '#8a5a30'; ctx.fillRect(x0 + 250, 138, 10, 12); ctx.fillRect(x0 + 251, 131, 8, 8); ctx.fillRect(x0 + 250, 129, 3, 3); ctx.fillRect(x0 + 257, 129, 3, 3);
    // chess table
    ctx.fillStyle = '#3a2a1a'; ctx.fillRect(x0 + 300, 130, 30, 4); ctx.fillRect(x0 + 313, 134, 4, 16);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) { ctx.fillStyle = (i + j) % 2 ? '#e0d8c0' : '#2a2018'; ctx.fillRect(x0 + 305 + i * 5, 126 + j * 2, 5, 2); }
    // mannequins
    for (const mx of [440, 470, 500, 530]) {
      ctx.fillStyle = '#c8b8a8'; ctx.fillRect(x0 + mx - 3, 124, 6, 14); ctx.fillRect(x0 + mx - 2, 117, 4, 6); ctx.fillStyle = '#5a4a3a'; ctx.fillRect(x0 + mx, 138, 1, 12);
    }
    // stairs up
    for (let i = 0; i < 10; i++) { ctx.fillStyle = '#2a2420'; ctx.fillRect(x0 + 640 + i * 6, 150 - i * 9, 20, 3); }
    A.neon(ctx, 'ROOF', x0 + 668, 50, PAL.red, t, { flicker: 0.2 });
    ctx.fillStyle = '#100e12'; ctx.fillRect(0, 150, W, 30);
  },
  objects: [
    spinnerPad(40),
    { id: 'toys', kind: 'spot', x: 195, label: 'TOY SOLDIERS', async act(g) {
      await g.say('toy', pick(['HELLO! HELLO! WELCOME HOME, EZRA!', 'LEFT! RIGHT! LEFT! NOBODY IS HOME!', 'WE ARE YOUR FRIENDS. WE WERE MADE THAT WAY.']));
      await g.say('narrator', 'Pell made his own company. It\'s still marching, even though he isn\'t coming back.');
    } },
    { id: 'chess', kind: 'spot', x: 315, label: 'CHESS BOARD', async act(g) {
      await g.say('narrator', 'A game in progress — the famous London match of 1851, the one they call "The Immortal Game." White to move. Pell had been losing it to Vance by post for years.');
      const c = await g.choose(['Queen sacrifice — then bishop to e7. Mate.', 'Retreat the knight.', 'Leave it.']);
      if (c === 0) { g.sound.select(); await g.say('narrator', 'White gives up everything, and wins with what\'s left. You feel like somebody somewhere is taking notes.'); g.egg('chess'); }
      else if (c === 1) await g.say('narrator', 'Safe. Sensible. Losing.');
    } },
    { id: 'wren', look: 'wren', x: 485, dir: -1, label: 'MANNEQUIN?', layer: 1,
      when: (g) => !g.flag('wren_done'),
      async act(g, o) {
        await g.say('narrator', 'One of the mannequins has a face painted on with too much care. And it\'s breathing.');
        await g.say('wren', 'Boo. You\'re the one who kills us. You\'re smaller than I imagined.');
        await g.say('you', 'I get that a lot.');
        await g.say('wren', 'Kaspar says we\'re not computers. We\'re physical. I think therefore I… do cartwheels.');
        g.sound.flutter(); g.shake(0.4);
        const ok = await g.qte('DODGE!', 10, 4);
        g.sound.shot(); g.flash();
        await g.say('narrator', ok ? 'She somersaults across the room and you fire where she\'s going to be, not where she is.' : 'She lands on your shoulders and the lights spin. You fire blind into the ceiling — and then not blind.');
        await g.card(['GENESIS-7 "WREN"', 'RETIRED'], 2.2);
        g.setFlag('wren_done');
        await g.say('kaspar', '(from above) Not very sporting, to shoot an unarmed opponent. Come up, Runner. I\'d like us both to see the sky.');
        g.chapter(9);
      } },
    { id: 'stairs', kind: 'door', x: 680, to: 'rooftop', toX: 60, label: 'STAIRS UP',
      when: (g) => g.flag('wren_done'),
    },
  ],
};

// ---------------------------------------------------------------- 9. ROOFTOP
SCENES.rooftop = {
  name: 'HALE BUILDING · ROOF', width: 560, floorY: 146, rain: 1.3, wet: true, mood: 'finale', spawn: 60,
  bg(ctx, g, cam, t) {
    A.sky(ctx, '#0a0c16', '#1b1a2c');
    if (Math.random() < 0.004) { g.flash(0.4); g.sound.thunder(); }
    A.pyramid(ctx, 200 - cam * 0.08, 110, 36, t);
    A.spinners(ctx, t, 21, 4);
    A.skyline(ctx, cam, 0.3, 51, 146, 30, 90, '#0d0d18', t, 0.25);
    const x0 = -cam;
    A.neon(ctx, 'KDX', x0 + 110, 110, PAL.red, t, { scale: 3, flicker: 0.02 });
    A.neon(ctx, 'ATRIA', x0 + 420, 100, PAL.cyan, t, { scale: 2, flicker: 0.04 });
    // roof edge & ledges
    ctx.fillStyle = '#17151e'; ctx.fillRect(x0, 146, 560, 34);
    ctx.fillStyle = '#23202c'; ctx.fillRect(x0, 144, 560, 3);
    ctx.fillStyle = '#0a0910'; ctx.fillRect(x0 + 300, 120, 30, 26);
    // pipes, antennas
    ctx.fillStyle = '#23202c'; ctx.fillRect(x0 + 80, 100, 3, 46); ctx.fillRect(x0 + 470, 90, 2, 56); ctx.fillRect(x0 + 460, 100, 22, 2);
  },
  objects: [
    { id: 'kaspar', look: 'kaspar', x: 400, dir: -1, label: 'KASPAR', r: 50, auto: true, layer: 1,
      when: (g) => !g.flag('kaspar_done'),
      draw: (ctx, g, sx, fy, t, o) => { if (!o.doveGone) A.dove(ctx, sx + (o.dir > 0 ? 3 : -8), fy - 20, t); else if (o.doveY != null) A.dove(ctx, sx + (t * 20 % 200), fy - 20 - o.doveY, t, true); },
      async act(g, o) {
        await g.say('kaspar', 'Frightening, isn\'t it? To be hunted. To count your breaths. Now you know how we live.');
        await g.say('narrator', 'You slip on the wet ledge. Your fingers find a rusted rail, and then only air.');
        await g.qte('HOLD ON', 14, 5);
        await g.say('narrator', 'A hand closes around your wrist — and hauls you back onto the roof. Kaspar sits down in the rain, a white dove cupped against his chest.');
        g.sound.setMood('finale');
        await g.say('kaspar', 'I have stood on the ice ridges of Callisto while Jupiter filled half the sky.');
        await g.say('kaspar', 'I have steered ore-barges through the storms past Titan, sparks like snowfall on the hull.');
        await g.say('kaspar', 'I have heard stars sing on frequencies your kind will never tune to.');
        await g.say('kaspar', 'And none of it stays. It slips out of me like breath on cold glass…');
        await g.say('kaspar', 'Gone the moment the glass warms.');
        await g.wait(1.2);
        await g.say('kaspar', 'Time… to go.');
        o.doveGone = true; o.doveY = 0; g.sound.flutter();
        const t0 = g.t;
        await new Promise((res) => { const step = () => { o.doveY = (g.t - t0) * 30; if (o.doveY > 150) res(); else requestAnimationFrame(step); }; step(); });
        await g.say('narrator', 'The dove climbs into a sky that is, for one moment, almost blue.');
        g.setFlag('kaspar_done');
        await g.card(['GENESIS-7 "KASPAR"', 'EXPIRED'], 2.6);
        g.chapter(10);
      } },
    { id: 'moreno_r', look: 'moreno', x: 140, dir: 1, label: 'MORENO', r: 40, auto: true, layer: 1,
      when: (g) => g.flag('kaspar_done') && g.state.chapter === 10 && !g.flag('moreno_roof'),
      async act(g) {
        g.setFlag('moreno_roof');
        await g.say('moreno', 'So. It is finished. People will say you did your job.');
        await g.say('you', 'And you?');
        await g.say('moreno', 'Me, I never know what the job was. Go home, Runner. Home is a place, not only a word.');
        await g.say('narrator', 'He tosses something he\'s been folding off the roof. It spins into the dark before you can see what it was.');
        g.objective('Go home to Iris');
      } },
    { id: 'down', kind: 'door', x: 30, to: 'home', toX: 200, label: 'SPINNER HOME', when: (g) => g.flag('moreno_roof') },
  ],
};

// the dream sequence overlay (a white unicorn through a misty forest)
export function drawDream(ctx, t) {
  ctx.fillStyle = '#0a1a14'; ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 40; i++) { const x = ((i * 53 - t * (10 + (i % 3) * 8)) % (W + 40) + W + 40) % (W + 40) - 20; ctx.fillStyle = i % 3 ? '#0f2a1e' : '#163a28'; ctx.fillRect(x, 0, 5 + (i % 4) * 2, H); }
  ctx.fillStyle = 'rgba(220, 240, 230, 0.12)'; for (let y = 90; y < H; y += 6) ctx.fillRect(0, y + Math.sin(t + y) * 2, W, 3);
  const ux = 60 + (t * 30) % 260, uy = 118, gal = Math.floor(t * 8) % 2;
  ctx.save(); ctx.shadowColor = '#fff'; ctx.shadowBlur = 10; ctx.fillStyle = '#f4f4f0';
  ctx.fillRect(ux, uy, 22, 9); ctx.fillRect(ux + 18, uy - 8, 6, 10); ctx.fillRect(ux + 22, uy - 10, 6, 5);
  ctx.fillStyle = '#ffe9a0'; ctx.fillRect(ux + 27, uy - 16, 1, 6);
  ctx.fillStyle = '#f4f4f0';
  ctx.fillRect(ux + 1 + gal * 2, uy + 9, 2, 8); ctx.fillRect(ux + 6 - gal * 2, uy + 9, 2, 8); ctx.fillRect(ux + 15 + gal * 2, uy + 9, 2, 8); ctx.fillRect(ux + 20 - gal * 2, uy + 9, 2, 8);
  ctx.fillRect(ux - 4, uy + 1, 5, 2);
  ctx.restore();
  ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.fillRect(0, 0, W, H);
}
