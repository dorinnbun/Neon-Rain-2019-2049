// ESPER-9: a voice/keyboard driven photo enhancer. Type commands (or tap the
// buttons) to pan and zoom into Brick's photograph and find what's hidden in it.

const PW = 640, PH = 480, VW = 160, VH = 120;
const TARGET = { x: 452, y: 150, r: 26 };  // the woman reflected in the convex mirror
const CAT = { x: 104, y: 404, r: 24 };     // an easter egg asleep under the chair

let photo = null;
function buildPhoto() {
  const c = document.createElement('canvas'); c.width = PW; c.height = PH;
  const x = c.getContext('2d');
  // room
  x.fillStyle = '#3a3226'; x.fillRect(0, 0, PW, PH);
  for (let i = 0; i < PW; i += 16) { x.fillStyle = 'rgba(0,0,0,0.12)'; x.fillRect(i, 0, 6, 330); }
  x.fillStyle = '#231d15'; x.fillRect(0, 330, PW, 150);
  for (let i = 0; i < PW; i += 40) { x.fillStyle = 'rgba(0,0,0,0.2)'; x.fillRect(i, 330, 2, 150); }
  // doorway to the next room
  x.fillStyle = '#17120c'; x.fillRect(250, 90, 120, 240);
  x.fillStyle = '#4a3e2c'; x.fillRect(240, 80, 140, 12); x.fillRect(240, 80, 12, 250); x.fillRect(368, 80, 12, 250);
  // bed through the doorway
  x.fillStyle = '#6a604c'; x.fillRect(270, 250, 100, 40); x.fillStyle = '#8a8068'; x.fillRect(270, 240, 100, 14);
  // window with blinds
  x.fillStyle = '#6a5a38'; x.fillRect(40, 70, 150, 180);
  for (let i = 74; i < 246; i += 8) { x.fillStyle = '#b8a070'; x.fillRect(44, i, 142, 4); }
  // armchair with the cat under it
  x.fillStyle = '#4a2a20'; x.fillRect(40, 300, 140, 80); x.fillRect(40, 260, 30, 120); x.fillRect(150, 260, 30, 120);
  x.fillStyle = '#2a1812'; x.fillRect(50, 380, 10, 40); x.fillRect(160, 380, 10, 40);
  // cat (tiny)
  x.fillStyle = '#8a6a44'; x.fillRect(90, 400, 26, 10); x.fillRect(112, 396, 8, 8); x.fillRect(112, 393, 2, 3); x.fillRect(118, 393, 2, 3);
  x.fillStyle = '#6a4a2c'; x.fillRect(84, 404, 8, 3); x.fillStyle = '#2a1a0a'; x.fillRect(115, 399, 3, 1);
  for (let i = 0; i < 4; i++) { x.fillStyle = '#6a4a2c'; x.fillRect(94 + i * 5, 401, 2, 8); }
  // side table, lamp
  x.fillStyle = '#3a2a1c'; x.fillRect(470, 280, 90, 10); x.fillRect(478, 290, 8, 110); x.fillRect(544, 290, 8, 110);
  x.fillStyle = '#c8a860'; x.fillRect(500, 230, 30, 22); x.fillStyle = '#5a4a3a'; x.fillRect(512, 252, 6, 28);
  // the convex mirror
  x.fillStyle = '#6a5a3a'; x.beginPath(); x.arc(452, 150, 44, 0, Math.PI * 2); x.fill();
  const mg = x.createRadialGradient(440, 138, 4, 452, 150, 40);
  mg.addColorStop(0, '#b8b8a8'); mg.addColorStop(1, '#5a5a50');
  x.fillStyle = mg; x.beginPath(); x.arc(452, 150, 38, 0, Math.PI * 2); x.fill();
  // reflection: a woman asleep, snake tattoo along her neck
  x.save(); x.beginPath(); x.arc(452, 150, 38, 0, Math.PI * 2); x.clip();
  x.fillStyle = '#6a604c'; x.fillRect(420, 152, 64, 14);
  x.fillStyle = '#e0c0a0'; x.fillRect(438, 142, 12, 10); x.fillRect(450, 150, 22, 5);
  x.fillStyle = '#c83a2c'; x.fillRect(434, 139, 16, 5); x.fillRect(434, 144, 4, 8);
  x.fillStyle = '#2a6a2a'; for (let i = 0; i < 8; i++) x.fillRect(446 + i * 2, 152 + (i % 2), 2, 1);
  x.fillStyle = '#3a8a3a'; x.fillRect(461, 151, 2, 2);
  x.restore();
  x.fillStyle = 'rgba(255,255,255,0.25)'; x.beginPath(); x.ellipse(436, 130, 10, 5, -0.6, 0, Math.PI * 2); x.fill();
  // film grain + sepia wash
  const img = x.getImageData(0, 0, PW, PH), d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * 22, l = d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11 + n;
    d[i] = l * 1.08 + 12; d[i + 1] = l * 0.95 + 4; d[i + 2] = l * 0.72;
  }
  x.putImageData(img, 0, 0);
  return c;
}

export function openEsper(g) {
  photo ||= buildPhoto();
  const root = document.getElementById('esper');
  const view = document.getElementById('esper-view');
  const vctx = view.getContext('2d'); vctx.imageSmoothingEnabled = false;
  const log = document.getElementById('esper-log');
  const form = document.getElementById('esper-form');
  const input = document.getElementById('esper-input');
  const help = root.querySelector('.esper-help');

  let cx = PW / 2, cy = PH / 2, z = 1, scanY = VH, raf = 0, found = false;
  let finish = () => {};
  const target = document.createElement('canvas'); target.width = VW; target.height = VH;
  const tctx = target.getContext('2d'); tctx.imageSmoothingEnabled = false;

  const say = (s) => { const p = document.createElement('div'); p.textContent = s; log.append(p); while (log.children.length > 9) log.firstChild.remove(); };
  const rect = () => {
    const w = PW / z, h = PH / z;
    cx = Math.min(PW - w / 2, Math.max(w / 2, cx)); cy = Math.min(PH - h / 2, Math.max(h / 2, cy));
    return { x: cx - w / 2, y: cy - h / 2, w, h };
  };
  const sees = (p) => { const r = rect(); return p.x > r.x && p.x < r.x + r.w && p.y > r.y && p.y < r.y + r.h; };
  const render = () => {
    const r = rect();
    tctx.drawImage(photo, r.x, r.y, r.w, r.h, 0, 0, VW, VH);
    scanY = 0; g.sound.esper();
    say(`  Z${z.toFixed(1)}  X${String(Math.round(cx)).padStart(4, '0')}  Y${String(Math.round(cy)).padStart(4, '0')}`);
    if (z >= 4 && sees(CAT) && !g.hasEgg('esper')) { say('  ◆ FELINE. ASLEEP. POSSIBLY REAL.'); g.egg('esper'); }
  };
  const loop = () => {
    if (scanY < VH) {
      scanY = Math.min(VH, scanY + 4);
      vctx.drawImage(target, 0, 0, VW, scanY, 0, 0, VW, scanY);
      vctx.fillStyle = '#7dffa1'; vctx.fillRect(0, scanY, VW, 1);
    } else vctx.drawImage(target, 0, 0);
    // crosshair
    vctx.strokeStyle = 'rgba(125,255,161,0.5)'; vctx.lineWidth = 1;
    vctx.beginPath(); vctx.moveTo(VW / 2 + 0.5, VH / 2 - 8); vctx.lineTo(VW / 2 + 0.5, VH / 2 + 8); vctx.moveTo(VW / 2 - 8, VH / 2 + 0.5); vctx.lineTo(VW / 2 + 8, VH / 2 + 0.5); vctx.stroke();
    vctx.strokeRect(1.5, 1.5, VW - 3, VH - 3);
    raf = requestAnimationFrame(loop);
  };

  const run = (raw) => {
    const s = raw.trim().toUpperCase().replace(/\s+/g, ' ');
    if (!s) return;
    say('> ' + s);
    const nums = (s.match(/\d+/g) || []).map(Number);
    const step = PW / z / 4;
    if (/^(EXIT|QUIT|CLOSE|OFF)/.test(s)) return finish();
    if (/^(ENHANCE|ZOOM IN|CLOSER|MAGNIFY)/.test(s)) {
      if (nums.length >= 2) { cx = nums[0]; cy = nums[1]; }
      if (z >= 8) { say('  MAX RESOLUTION.'); return; }
      z *= 2; return render();
    }
    if (/^(ZOOM OUT|PULL BACK|WIDER|BACK)/.test(s)) { z = Math.max(1, z / 2); return render(); }
    if (/^(CENTER|CENTRE|GO TO|GOTO)/.test(s) && nums.length >= 2) { cx = nums[0]; cy = nums[1]; return render(); }
    const dir = s.match(/(LEFT|RIGHT|UP|DOWN)/);
    if (dir) { const d = dir[1]; if (d === 'LEFT') cx -= step; if (d === 'RIGHT') cx += step; if (d === 'UP') cy -= step; if (d === 'DOWN') cy += step; return render(); }
    if (/^(STOP|HOLD|WAIT)/.test(s)) return say('  HOLDING.');
    if (/^(PRINT|HARD ?COPY|CAPTURE)/.test(s)) {
      if (z >= 4 && sees(TARGET)) {
        g.sound.print(); say('  PRINTING…'); found = true;
        setTimeout(finish, 1400);
      } else { g.sound.print(); say('  PRINTED. NOTHING OF INTEREST.'); }
      return;
    }
    say('  COMMAND NOT RECOGNISED.');
  };

  return new Promise((resolve) => {
    const onSubmit = (e) => { e.preventDefault(); run(input.value); input.value = ''; };
    const onKey = (e) => {
      const map = { ArrowLeft: 'PAN LEFT', ArrowRight: 'PAN RIGHT', ArrowUp: 'PAN UP', ArrowDown: 'PAN DOWN', Escape: 'EXIT' };
      if (map[e.key] && !input.value) { e.preventDefault(); run(map[e.key]); }
    };
    const onHelp = (e) => { const b = e.target.closest('button'); if (b) run(b.dataset.cmd); };
    function cleanup() {
      cancelAnimationFrame(raf);
      form.removeEventListener('submit', onSubmit); input.removeEventListener('keydown', onKey); help.removeEventListener('click', onHelp);
      root.hidden = true; g.input.enabled = true; input.blur();
      resolve(found);
    }
    finish = cleanup;
    help.innerHTML = ['ENHANCE', 'ZOOM OUT', 'LEFT', 'RIGHT', 'UP', 'DOWN', 'PRINT', 'EXIT']
      .map((c) => `<button type="button" data-cmd="${c === 'LEFT' || c === 'RIGHT' || c === 'UP' || c === 'DOWN' ? 'PAN ' + c : c}">${c}</button>`).join('');
    log.innerHTML = '';
    say('ESPER-9 READY. INSERT PHOTOGRAPH.');
    say('Tip: type ENHANCE, PAN LEFT/RIGHT/UP/DOWN, PRINT.');
    root.hidden = false; g.input.enabled = false;
    form.addEventListener('submit', onSubmit); input.addEventListener('keydown', onKey); help.addEventListener('click', onHelp);
    if (!matchMedia('(pointer: coarse)').matches) input.focus();
    render(); loop();
  });
}
