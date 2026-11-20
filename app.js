/* Nibble pitch site — robot simulator + interactive demos (v2) */
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const sleep = ms => new Promise(r => setTimeout(r, ms));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* ---------------- sound ---------------- */
const Sfx = {
  on: true, c: null,
  ctx() {
    if (!this.c) { try { this.c = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
    if (this.c.state === 'suspended') this.c.resume();
    return this.c;
  },
  tone(f, d = .12, type = 'sine', v = .07, delay = 0, f2 = null) {
    if (!this.on) return; const c = this.ctx(); if (!c) return;
    const t = c.currentTime + delay, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    o.connect(g).connect(c.destination); o.start(t); o.stop(t + d + .03);
  },
  noise(d = .06, v = .08, delay = 0, freq = 1200, type = 'bandpass') {
    if (!this.on) return; const c = this.ctx(); if (!c) return;
    const t = c.currentTime + delay, len = Math.max(1, Math.floor(c.sampleRate * d));
    const buf = c.createBuffer(1, len, c.sampleRate), data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain();
    src.buffer = buf; fl.type = type; fl.frequency.value = freq; g.gain.value = v;
    src.connect(fl).connect(g).connect(c.destination); src.start(t);
  },
  ding() { this.tone(1318, .18, 'sine', .08); this.tone(1760, .32, 'sine', .07, .09); },
  chomp() { this.noise(.06, .14, 0, 500); this.noise(.06, .12, .13, 420); },
  chew(ms) { const n = Math.floor(ms / 220); for (let i = 0; i < n; i++) this.noise(.045, .07, i * .22, 380); },
  shutter() { this.noise(.03, .18, 0, 3200, 'highpass'); this.noise(.05, .12, .07, 2200, 'highpass'); },
  print(ms) { const n = Math.floor(ms / 55); for (let i = 0; i < n; i++) this.noise(.02, .05, i * .055, 2600); },
  success() { [660, 880, 1320].forEach((f, i) => this.tone(f, .17, 'triangle', .06, i * .08)); },
  alert() { this.tone(880, .12, 'square', .035); this.tone(660, .16, 'square', .035, .14); },
  error() { this.tone(320, .3, 'sawtooth', .05, 0, 140); },
  pop() { this.tone(520, .09, 'sine', .08, 0, 1100); },
  whoosh() { this.noise(.32, .07, 0, 900); },
  tear() { this.noise(.28, .09, 0, 4200, 'highpass'); },
  tick(p) { this.tone(400 + p * 700, .05, 'triangle', .05); },
  blip(i) { this.tone(700 + i * 60, .04, 'sine', .035); },
  beep() { this.tone(980, .08, 'square', .03); },
};
$('#soundBtn').addEventListener('click', e => {
  Sfx.on = !Sfx.on; e.currentTarget.textContent = Sfx.on ? '🔊 Sound on' : '🔇 Sound off';
  e.currentTarget.setAttribute('aria-pressed', Sfx.on); if (Sfx.on) Sfx.pop();
});

/* ---------------- helpers ---------------- */
const rectOf = x => (x.getBoundingClientRect ? x.getBoundingClientRect() : x);
const center = r => ({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
async function fly(from, to, html, { dur = 700, size = 28, arc = -70 } = {}) {
  const a = center(rectOf(from)), b = center(rectOf(to)), dx = b.x - a.x, dy = b.y - a.y;
  const f = document.createElement('div');
  f.className = 'flyer'; f.style.fontSize = size + 'px'; f.innerHTML = html; f.style.left = a.x + 'px'; f.style.top = a.y + 'px';
  document.body.appendChild(f);
  const anim = f.animate([
    { transform: 'translate(-50%,-50%) scale(1)' },
    { transform: `translate(calc(-50% + ${dx / 2}px), calc(-50% + ${dy / 2 + arc}px)) scale(1.15)` },
    { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(.35)`, opacity: .5 },
  ], { duration: dur, easing: 'cubic-bezier(.45,0,.3,1)' });
  await Promise.race([anim.finished.catch(() => {}), sleep(dur + 150)]); f.remove();
}
/* a file travelling along an arc with a trail of glowing packets */
async function stream(from, to, icon, { count = 12, dur = 1300, arc = -110, color = '#FF6B3D', onProgress } = {}) {
  const a = center(rectOf(from)), b = center(rectOf(to));
  const c = { x: (a.x + b.x) / 2, y: Math.min(a.y, b.y) + arc };
  const pt = t => ({ x: (1 - t) * (1 - t) * a.x + 2 * (1 - t) * t * c.x + t * t * b.x, y: (1 - t) * (1 - t) * a.y + 2 * (1 - t) * t * c.y + t * t * b.y });
  const frames = scale => Array.from({ length: 17 }, (_, k) => {
    const t = k / 16, p = pt(t);
    return { transform: `translate(${p.x}px,${p.y}px) scale(${scale(t)})` };
  });
  const els = [];
  for (let i = 0; i < count; i++) {
    const d = document.createElement('div'); d.className = 'dot'; d.style.background = color; d.style.boxShadow = `0 0 8px ${color}`;
    document.body.appendChild(d); els.push(d);
    d.animate(frames(t => .6 + Math.sin(Math.PI * t)), { duration: dur * .75, delay: i * (dur * .25 / count), easing: 'ease-in-out', fill: 'both' });
  }
  const f = document.createElement('div'); f.className = 'flyer'; f.style.left = '0'; f.style.top = '0'; f.style.fontSize = '30px';
  f.innerHTML = `<div style="transform:translate(-50%,-50%)">${icon}</div>`; document.body.appendChild(f); els.push(f);
  f.animate(frames(t => 1 + .5 * Math.sin(Math.PI * t) - .5 * t), { duration: dur, easing: 'cubic-bezier(.45,0,.35,1)', fill: 'both' });
  const t0 = performance.now();
  const iv = setInterval(() => {
    const p = clamp((performance.now() - t0) / dur, 0, 1); onProgress && onProgress(p);
    if (p >= 1) clearInterval(iv);
  }, 40);
  let k = 0; const bl = setInterval(() => { Sfx.blip(k++ % 8); if (k > dur / 90) clearInterval(bl); }, 90);
  await sleep(dur + 60); clearInterval(iv); clearInterval(bl); onProgress && onProgress(1);
  els.forEach(e => e.remove());
}
function stagePoint(stage, x, y) {
  const r = $('.stage-inner', stage).getBoundingClientRect(), s = r.width / 680;
  return { left: r.left + x * s, top: r.top + y * s, width: 0, height: 0 };
}
const stageScale = st => $('.stage-inner', st).getBoundingClientRect().width / 680;
function flash(stage) {
  const inner = $('.stage-inner', stage);
  let f = $('.flash', inner); if (!f) { f = document.createElement('div'); f.className = 'flash'; inner.appendChild(f); }
  f.classList.remove('go'); void f.offsetWidth; f.classList.add('go');
}

/* drag with a ghost + drop targets; a tap without moving calls onClick */
function draggable(el, { targets = () => [], onDrop, onClick, onMove, onStart, onEnd, accept = () => true }) {
  el.addEventListener('pointerdown', e => {
    if (e.button !== 0 || !accept()) return;
    if (e.target.closest('.tile, .ps-link')) return;
    e.preventDefault();
    const r = el.getBoundingClientRect(), scale = r.width / (el.offsetWidth || r.width);
    const sx = e.clientX, sy = e.clientY;
    let moved = false, ghost = null, over = null;
    const tlist = targets();
    const move = ev => {
      const dx = ev.clientX - sx, dy = ev.clientY - sy;
      if (!moved && Math.hypot(dx, dy) < 6) return;
      if (!moved) {
        moved = true;
        ghost = el.cloneNode(true);
        ghost.classList.add('drag-ghost'); ghost.removeAttribute('id');
        Object.assign(ghost.style, { position: 'fixed', left: r.left + 'px', top: r.top + 'px', right: 'auto', bottom: 'auto', margin: '0',
          width: el.offsetWidth + 'px', height: el.offsetHeight + 'px', transformOrigin: '0 0', transform: `scale(${scale}) rotate(-3deg)` });
        document.body.appendChild(ghost); el.style.opacity = '.25';
        onStart && onStart();
      }
      ghost.style.left = (r.left + dx) + 'px'; ghost.style.top = (r.top + dy) + 'px';
      onMove && onMove(ev.clientX, ev.clientY, dx, dy);
      over = null;
      tlist.forEach(t => {
        const tr = t.getBoundingClientRect(), pad = 24;
        const hit = ev.clientX > tr.left - pad && ev.clientX < tr.right + pad && ev.clientY > tr.top - pad && ev.clientY < tr.bottom + pad;
        t.classList.toggle('drop-hover', hit && !over); if (hit && !over) over = t;
      });
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up);
      tlist.forEach(t => t.classList.remove('drop-hover'));
      if (!moved) { onClick && onClick(); return; }
      el.style.opacity = '';
      if (over) { ghost.remove(); onDrop && onDrop(over); }
      else {
        ghost.animate([{ left: ghost.style.left, top: ghost.style.top }, { left: r.left + 'px', top: r.top + 'px' }], { duration: 250, easing: 'ease-out' })
          .finished.then(() => ghost.remove());
        setTimeout(() => ghost.remove(), 400);
      }
      onEnd && onEnd(!!over);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
  });
}

/* segmented controls (.seg) and chapter tabs (.subtabs) */
const segVal = {};
$$('.seg, .subtabs').forEach(seg => {
  const name = seg.dataset.seg || seg.dataset.tabs, on = $('button.on', seg) || $('button', seg);
  segVal[name] = on.dataset.v;
  seg.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    $$('button', seg).forEach(x => x.classList.toggle('on', x === b));
    segVal[name] = b.dataset.v;
    const ch = seg.closest('.chapter');
    if (ch && $$('.tabpane', ch).length) $$('.tabpane', ch).forEach(p => p.classList.toggle('on', p.dataset.pane === b.dataset.v));
    seg.dispatchEvent(new CustomEvent('segchange', { detail: b.dataset.v }));
  });
});

/* fit 680x400 stages to their container */
function fitStage(st) {
  if (!st.clientWidth) return;
  const s = Math.min(1.3, st.clientWidth / 680), h = (400 * s) + 'px';
  $('.stage-inner', st).style.transform = `scale(${s})`;
  if (st.style.height !== h) st.style.height = h;
}
const ro = new ResizeObserver(es => es.forEach(e => setTimeout(() => fitStage(e.target), 0)));
$$('.stage').forEach(st => { fitStage(st); ro.observe(st); });

/* printed receipts in a tray */
async function printReceipt(robot, tray, lines) {
  tray.innerHTML = '';
  const r = document.createElement('div');
  r.className = 'receipt-out';
  r.innerHTML = lines.map(l => `<div class="rl">${l}</div>`).join('') + '<button class="tear">✂ tear off</button>';
  tray.appendChild(r);
  $('.tear', r).addEventListener('click', () => { Sfx.tear(); r.classList.add('torn'); setTimeout(() => r.remove(), 700); });
  robot.printStrip(1600);
  requestAnimationFrame(() => requestAnimationFrame(() => r.classList.add('show')));
  setTimeout(() => r.classList.add('show'), 80);
  await sleep(1650);
}

const HAND_SVG = `<svg viewBox="0 0 90 124">
  <ellipse cx="45" cy="38" rx="21" ry="31" fill="#F4F5F7" stroke="#BFC5CF" stroke-width="2"/>
  <line x1="45" y1="8" x2="45" y2="27" stroke="#BFC5CF" stroke-width="2"/>
  <path d="M24 56 Q22 34 31 29 Q37 27 39 34 L40 23 Q42 15 47 16 Q52 17 52 25 L53 28 Q56 22 61 24 Q66 27 64 36 L63 41 Q68 39 70 45 Q72 53 66 63 Q62 73 62 86 L62 124 L28 124 L28 88 Q22 74 24 56 Z" fill="#F2C7A5" stroke="#D6A27C" stroke-width="2"/>
  <path d="M26 62 Q13 57 11 47 Q10 41 15 41 Q21 43 27 53" fill="#F2C7A5" stroke="#D6A27C" stroke-width="2"/>
  <rect x="24" y="100" width="42" height="26" rx="6" fill="#3A4152"/>
</svg>`;

/* ---------------- AI app window on the laptop ---------------- */
class AIWin {
  constructor(screen, name = 'Claude') {
    this.el = document.createElement('div'); this.el.className = 'aiwin';
    this.el.innerHTML = `<div class="aw-bar"><i></i><i></i><i></i><span class="aw-name"></span></div><div class="aw-body"></div>`;
    screen.appendChild(this.el); this.body = $('.aw-body', this.el); this.nameEl = $('.aw-name', this.el); this.setName(name);
  }
  setName(n) { this.nameEl.textContent = '✳ ' + n; }
  show(n) { if (n) this.setName(n); this.el.classList.add('show'); }
  hide() { this.el.classList.remove('show'); }
  reset() { this.body.innerHTML = ''; }
  add(html, cls) {
    const d = document.createElement('div'); d.className = cls; d.innerHTML = html; this.body.appendChild(d);
    while (this.body.children.length > 3) this.body.firstChild.remove();
    return d;
  }
  user(html) { return this.add(html, 'aw-user'); }
  async think(text, ms = 1400) {
    const d = this.add(`<span class="aw-spark spin">✳</span><div>${text}<div class="aw-shim"></div><div class="aw-shim s2"></div></div>`, 'aw-ai');
    await sleep(ms); d.remove();
  }
  async steps(list, per = 650) {
    const d = this.add(`<span class="aw-spark spin">✳</span><div class="aw-steps"></div>`, 'aw-ai'), box = $('.aw-steps', d);
    for (const s of list) {
      const row = document.createElement('div'); row.className = 'aw-step'; row.textContent = '○ ' + s; box.appendChild(row);
      await sleep(per); row.className = 'aw-step ok'; row.textContent = '✓ ' + s;
    }
    $('.aw-spark', d).classList.remove('spin'); return d;
  }
  done(title, line) { Sfx.pop(); return this.add(`<b>✓ ${title}</b>${line}`, 'aw-done'); }
  wait(title, line) { return this.add(`<b>⏳ ${title}</b>${line}`, 'aw-wait'); }
  err(title, line) { return this.add(`<b>✕ ${title}</b>${line}`, 'aw-err'); }
}

/* ---------------- the robot ---------------- */
class Robot {
  constructor(host, { nfc = true } = {}) {
    host.innerHTML = `
    <div class="robot ${nfc ? '' : 'no-nfc'}" data-led="idle">
      <div class="r-shadow"></div>
      <div class="r-move">
        <div class="r-bubble"></div>
        <div class="r-head">
          <div class="r-touch"></div><div class="r-cam"></div>
          <div class="r-face">
            <div class="r-eyes"><i class="eye l"></i><i class="eye r"></i></div>
            <div class="r-mouth"></div><div class="r-brief"></div><div class="r-emoji"></div>
          </div>
          <svg class="r-ring" viewBox="0 0 194 194"><circle cx="97" cy="97" r="89"/></svg>
          <div class="r-hat"></div><div class="r-sweat">💧</div><div class="r-zzz">z z</div>
        </div>
        <div class="r-neck"></div>
        <div class="r-body"><div class="r-led"></div><div class="r-slot"></div><div class="r-paper"></div><div class="r-nfc">NFC</div></div>
      </div>
    </div>`;
    this.el = $('.robot', host);
    this.moveEl = $('.r-move', host); this.headEl = $('.r-head', host); this.bodyEl = $('.r-body', host);
    this.mouthEl = $('.r-mouth', host); this.nfcEl = $('.r-nfc', host); this.bubble = $('.r-bubble', host);
    this.briefEl = $('.r-brief', host); this.emojiEl = $('.r-emoji', host); this.hatEl = $('.r-hat', host);
    this.paper = $('.r-paper', host); this.ring = $('.r-ring circle', host);
  }
  vars(ry, rx, rz, gx, gy) {
    const s = this.el.style;
    s.setProperty('--hry', ry + 'deg'); s.setProperty('--hrx', rx + 'deg'); s.setProperty('--hrz', rz + 'deg');
    s.setProperty('--gx', gx + 'px'); s.setProperty('--gy', gy + 'px');
  }
  look(dir = 'front') {
    const L = { front: [0, 0, 0, 0, 0], left: [-34, 0, 0, -15, 0], screen: [-34, 6, 0, -15, -2], right: [34, 0, 0, 15, 0],
      up: [0, 12, 0, 0, -6], down: [0, -10, 0, 0, 6], tilt: [0, 0, -14, 4, 0] };
    this.vars(...(L[dir] || L.front));
  }
  gazeAt(x, y) {
    const r = this.headEl.getBoundingClientRect();
    const dx = clamp((x - (r.left + r.width / 2)) / 380, -1, 1), dy = clamp((y - (r.top + r.height / 2)) / 300, -1, 1);
    this.vars(dx * 32, -dy * 14, 0, dx * 16, dy * 10);
  }
  expr(e) { if (e) this.el.dataset.expr = e; else delete this.el.dataset.expr; }
  mouth(m) { if (m) this.el.dataset.mouth = m; else delete this.el.dataset.mouth; }
  led(m) { this.el.dataset.led = m; }
  say(text, ms = 2800) {
    this.bubble.innerHTML = text; this.bubble.classList.add('show');
    clearTimeout(this._st); if (ms) this._st = setTimeout(() => this.bubble.classList.remove('show'), ms);
  }
  hush() { clearTimeout(this._st); this.bubble.classList.remove('show'); }
  brief(lines, lvl = 'g') {
    const c = { g: '#2BD47D', y: '#FFC93C', r: '#FF4D4D', b: '#4D8BFF' }[lvl];
    this.briefEl.style.setProperty('--lvl', c);
    this.briefEl.innerHTML = lines.map(l => `<div>${l}</div>`).join('');
    this.el.classList.add('briefing');
  }
  unbrief() { this.el.classList.remove('briefing'); }
  emoji(e, ms = 0) {
    clearTimeout(this._et);
    if (!e) { this.el.classList.remove('emoji'); return; }
    this.emojiEl.textContent = e; this.el.classList.add('emoji');
    if (ms) this._et = setTimeout(() => this.el.classList.remove('emoji'), ms);
  }
  hat(e) { if (e) { this.hatEl.textContent = e; this.el.classList.add('hatted'); } else this.el.classList.remove('hatted'); }
  async move(cls, ms) {
    const m = this.moveEl; m.classList.remove(cls); void m.offsetWidth; m.classList.add(cls);
    await sleep(ms); m.classList.remove(cls);
  }
  hop() { return this.move('hop', 560); }
  nod() { return this.move('nod', 1000); }
  shake() { return this.move('shake', 900); }
  recoil() { return this.move('recoil', 700); }
  wave() { return this.move('wave', 1600); }
  ripple() { const n = this.nfcEl; n.classList.remove('ripple'); void n.offsetWidth; n.classList.add('ripple'); setTimeout(() => n.classList.remove('ripple'), 1400); }
  async chew(ms = 1500) {
    this.expr('squint'); this.mouth('chew'); this.led('think'); Sfx.chew(ms);
    await sleep(ms); this.mouth(); this.expr();
  }
  async snap(stage) { Sfx.shutter(); flash(stage); this.expr('squint'); await sleep(220); this.expr(); }
  async printStrip(ms = 1600) {
    this.paper.classList.add('out'); Sfx.print(ms); await sleep(ms); this.paper.classList.remove('out');
  }
  setRing(p) { this.ring.style.strokeDashoffset = 560 * (1 - clamp(p, 0, 1)); }
  reset() {
    this.look('front'); this.expr(); this.mouth(); this.led('idle'); this.unbrief(); this.hush(); this.hat(null); this.emoji(null);
    this.el.classList.remove('ask', 'holding'); this.moveEl.className = 'r-move'; this.setRing(0);
  }
  celebrate(lines, lvl, text) {
    this.look('front'); this.led('done'); this.expr('happy'); this.mouth('smile'); this.hop(); Sfx.success();
    if (lines) this.brief(lines, lvl);
    if (text) this.say(text, 3600);
  }
}

/* ---------------- HERO ---------------- */
const rH = new Robot($('#heroRobot'), { nfc: false });
rH.led('listen');
setTimeout(() => rH.say("Hi! I'm Nibble. Feed me a file 🍪", 3500), 700);
window.addEventListener('pointermove', e => {
  const r = $('#heroRobot').getBoundingClientRect();
  if (r.bottom < 0 || r.top > innerHeight) return;
  rH.gazeAt(e.clientX, e.clientY);
});
const heroLines = ['Hehe, that tickles! 😆', "Drop a PDF on me. I'm hungry.", 'Pat my head to approve things ✋', 'I turn to your screen while I work 💻', 'Tap your phone on my nose 📱'];
let heroI = 0;
$('#heroRobot').addEventListener('click', () => {
  rH.expr('happy'); rH.mouth('smile'); rH.hop(); Sfx.pop();
  rH.say(heroLines[heroI++ % heroLines.length], 2600);
  setTimeout(() => { rH.expr(); rH.mouth(); }, 1400);
});

/* ================= 01a · DRAG TO AVATAR ================= */
(() => {
  const st = $('#st-drag'), inner = $('.stage-inner', st), r = new Robot($('.robot-host', st), { nfc: false });
  const avatar = $('.avatar', st), hand = $('#dragHand'), cursor = $('#dragCursor'), ai = new AIWin($('.laptop-screen', st), 'Claude');
  hand.innerHTML = HAND_SVG;
  let busy = false;
  const D = {
    pdf: { icon: '📄', name: 'Contract_v3.pdf', ask: 'Review this', ai: 'Claude', steps: ['Reading 12 pages', 'Checking clauses'], title: 'Review done', line: '3 risks · Clause 7: 20% penalty',
      brief: ['📄 Contract reviewed', '3 risks found', '⚠️ Clause 7: 20% penalty'], lvl: 'y', say: 'Read it! Clause 7 has a 20% penalty. Worth a look.' },
    audio: { icon: '🎙️', name: 'Standup.m4a', ask: 'Summarize', ai: 'Claude', steps: ['Transcribing 42 min', 'Finding action items'], title: 'Summary ready', line: '5 action items · sent to 4 people',
      brief: ['🎙️ Standup summarized', '5 action items', '✅ Sent to 4 owners'], lvl: 'g', say: 'Standup summarized. 5 to-dos, already sent.' },
    sheet: { icon: '📊', name: 'Q3_sales.xlsx', ask: 'Any insights?', ai: 'ChatGPT', steps: ['Reading 2,340 rows', 'Building a chart'], title: 'Insight found', line: 'Revenue +18% · Boston leads',
      brief: ['📊 Q3 sales', 'Revenue +18%', '🏆 Boston leads'], lvl: 'b', say: 'Q3 is up 18%. Boston is your best region.' },
  };
  function moveHand(dx, dy) {
    const s = stageScale(st);
    hand.style.transform = `translate(${clamp(dx / s * .3, -55, 55)}px, ${clamp(dy / s * .18, -24, 18)}px)`;
  }
  function releaseHand() { hand.classList.remove('press'); hand.style.transform = ''; }
  async function feed(file) {
    if (busy || file.classList.contains('eaten')) return; busy = true;
    const d = D[file.dataset.kind]; r.reset(); ai.hide();
    file.classList.add('eaten');
    avatar.classList.add('chomp'); Sfx.chomp();
    r.look('left'); r.mouth('open'); r.expr('wide');
    await sleep(450); avatar.classList.remove('chomp');
    await fly(avatar, r.mouthEl, d.icon, { dur: 700, size: 30 });
    Sfx.chomp(); r.expr();
    await r.chew(1000);
    r.look('screen'); r.led('think'); r.expr('focus'); r.say('Thinking… 💭', 1400);
    ai.reset(); ai.show(d.ai);
    ai.user(`<span class="aw-chip">${d.icon} ${d.name}</span>${d.ask}`);
    await sleep(400);
    await ai.steps(d.steps, 750);
    ai.done(d.title, d.line);
    await sleep(700);
    r.celebrate(d.brief, d.lvl, d.say);
    busy = false;
  }
  async function autoDrag(file) {
    if (busy || file.classList.contains('eaten')) return; busy = true;
    const s = stageScale(st), ir = inner.getBoundingClientRect();
    const toStage = rc => ({ x: (rc.left + rc.width / 2 - ir.left) / s, y: (rc.top + rc.height / 2 - ir.top) / s });
    const p0 = toStage(file.getBoundingClientRect()), p1 = toStage(avatar.getBoundingClientRect());
    const ghost = file.cloneNode(true); ghost.className = 'file ghost-file'; inner.appendChild(ghost);
    file.style.opacity = '.25'; cursor.classList.add('show'); hand.classList.add('press'); r.reset(); r.expr('wide'); ai.hide();
    const place = p => {
      cursor.style.left = p.x + 'px'; cursor.style.top = p.y + 'px';
      ghost.style.left = (p.x - 33) + 'px'; ghost.style.top = (p.y - 22) + 'px';
      hand.style.transform = `translate(${clamp((p.x - p0.x) * .3, -55, 55)}px, ${clamp((p.y - p0.y) * .18, -24, 18)}px)`;
      r.gazeAt(ir.left + p.x * s, ir.top + p.y * s);
    };
    place(p0); await sleep(350);
    const dur = 1500, t0 = performance.now();
    await new Promise(res => {
      const iv = setInterval(() => {
        const t = clamp((performance.now() - t0) / dur, 0, 1), e = t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        place({ x: p0.x + (p1.x - p0.x) * e, y: p0.y + (p1.y - p0.y) * e - Math.sin(Math.PI * e) * 24 });
        if (t >= 1) { clearInterval(iv); res(); }
      }, 16);
    });
    await sleep(150);
    ghost.remove(); cursor.classList.remove('show'); releaseHand(); file.style.opacity = '';
    busy = false; feed(file);
  }
  $$('.file', st).forEach(f => draggable(f, {
    accept: () => !busy,
    targets: () => [avatar],
    onStart: () => { hand.classList.add('press'); r.reset(); r.expr('wide'); ai.hide(); },
    onMove: (x, y, dx, dy) => { r.gazeAt(x, y); moveHand(dx, dy); },
    onDrop: () => feed(f),
    onEnd: hit => { releaseHand(); if (!hit) { r.look('front'); r.expr(); } },
    onClick: () => autoDrag(f),
  }));
  function reset() { $$('.file', st).forEach(f => f.classList.remove('eaten')); r.reset(); ai.hide(); busy = false; }
  $('#dragAuto').addEventListener('click', () => {
    if (busy) return;
    const f = $$('.file', st).find(x => !x.classList.contains('eaten'));
    if (f) autoDrag(f); else { reset(); setTimeout(() => autoDrag($('.file', st)), 300); }
  });
  $('#dragReset').addEventListener('click', reset);
})();

/* ================= 01b · TAP YOUR PHONE ================= */
(() => {
  const st = $('#st-tap'), r = new Robot($('.robot-host', st)), phone = $('#tapPhone'), scr = $('.phone-screen', phone);
  let state = 'home', busy = false;
  const T = {
    receipt: { i: '🧾', n: 'Lunch receipt', reply: "<b>🧾 Logged!</b>$86.40 lunch at Joe's → added to November expenses.", brief: ['🧾 Expense logged', '$86.40 · Meals', '✅ November sheet'], lvl: 'g', say: 'Yum, a receipt. Logged! ✓' },
    deck: { i: '📊', n: 'Pitch deck', reply: '<b>📊 3 takeaways</b>1. $4B market<br>2. Pilot in March<br>3. Asking $500k', brief: ['📊 Pitch deck', '24 slides → 3 points', '📤 Sent to your phone'], lvl: 'b', say: '24 slides, 3 takeaways ✓' },
    voice: { i: '🎙️', n: 'Voice memo', reply: '<b>🎙️ 4 to-dos</b>Call Maya · Book a room · Send the deck · Buy coffee ☕', brief: ['🎙️ Voice memo', '2 min → 4 to-dos', '✅ Added to your list'], lvl: 'g', say: 'Heard you! 4 to-dos added ✓' },
    board: { i: '🖼️', n: 'Whiteboard', reply: '<b>🖼️ Whiteboard → tasks</b>Created 4 tasks for Sprint 12 and assigned them.', brief: ['🖼️ Whiteboard', '4 tasks created', '👥 Assigned to team'], lvl: 'b', say: 'Turned it into 4 tasks ✓' },
  };
  const head = `<div class="ps-head"><div class="mini-face"><i></i><i></i></div><div><b>Nibble</b><small>Connected · Lin's desk</small></div></div>`;
  function render(v, k) {
    state = v;
    if (v === 'home') scr.innerHTML = `<div class="ps"><div class="ps-time">10:24</div><div class="ps-nfc">📲</div><div class="ps-msg">Hold me near Nibble's orange nose</div></div>`;
    if (v === 'pick') {
      scr.innerHTML = `<div class="ps light">${head}<div class="sheet"><h6>Send to Nibble</h6><div class="tiles">${Object.entries(T).map(([key, t]) => `<div class="tile" data-k="${key}"><span>${t.i}</span>${t.n}</div>`).join('')}</div></div></div>`;
      $$('.tile', scr).forEach(el => el.addEventListener('click', e => { e.stopPropagation(); send(el.dataset.k, el); }));
    }
    if (v === 'sending') scr.innerHTML = `<div class="ps light">${head}<div class="ring"><span>${T[k].i}</span></div><div class="ps-pct">0%</div><div class="ps-sub" style="text-align:center">Sending to Nibble…</div></div>`;
    if (v === 'waiting') scr.innerHTML = `<div class="ps light">${head}<div style="height:14px"></div><div class="ps-sub">Nibble is on it…</div><div class="typing"><i></i><i></i><i></i></div></div>`;
    if (v === 'reply') {
      scr.innerHTML = `<div class="ps light">${head}<div style="height:8px"></div><div class="bubble-in">${T[k].reply}</div><div class="ps-link">Send another →</div></div>`;
      $('.ps-link', scr).addEventListener('click', e => { e.stopPropagation(); if (!busy) { Sfx.pop(); r.reset(); render('pick'); } });
    }
  }
  async function connect() {
    if (busy || state !== 'home') return; busy = true;
    phone.classList.remove('buzz'); void phone.offsetWidth; phone.classList.add('buzz');
    r.reset(); r.ripple(); Sfx.ding();
    r.look('right'); r.expr('wide'); r.led('listen'); r.say('Oh, hi! 📲 What do you have for me?', 2600);
    await sleep(500); render('pick'); busy = false;
  }
  async function send(k, tile) {
    if (busy) return; busy = true;
    tile.style.transform = 'scale(1.15)'; Sfx.pop(); await sleep(250);
    render('sending', k);
    const ring = $('.ring', scr), pct = $('.ps-pct', scr);
    r.look('right'); r.expr('wide'); r.mouth('open'); r.led('think');
    await stream($('.ring span', scr), r.mouthEl, T[k].i, {
      count: 14, dur: 1500,
      onProgress: p => { ring.style.setProperty('--p', Math.round(p * 100)); pct.textContent = Math.round(p * 100) + '%'; },
    });
    Sfx.chomp(); r.mouth('chew'); await sleep(450);
    render('waiting'); r.mouth(); r.look('front'); r.expr('squint'); r.led('think'); r.say('Mmm… 🤔', 1300);
    Sfx.chew(1300); await sleep(1400);
    r.look('right'); r.expr('happy'); r.mouth('open');
    await stream(r.mouthEl, scr, '✨', { count: 10, dur: 1000, arc: -90, color: '#3DDBB4' });
    render('reply', k); Sfx.ding();
    phone.classList.remove('buzz'); void phone.offsetWidth; phone.classList.add('buzz');
    r.celebrate(T[k].brief, T[k].lvl, T[k].say);
    busy = false;
  }
  draggable(phone, {
    accept: () => state === 'home' && !busy,
    targets: () => [r.nfcEl, r.bodyEl],
    onDrop: () => connect(),
    onClick: async () => {
      if (state !== 'home' || busy) return;
      phone.animate([{ transform: 'none' }, { transform: 'translate(-118px,40px) rotate(-12deg)' }, { transform: 'none' }], { duration: 900, easing: 'ease-in-out' });
      await sleep(430); connect();
    },
  });
  $('#tapReset').addEventListener('click', () => { if (busy) return; r.reset(); render('home'); });
  render('home');
})();

/* ================= 01c · HOLD UP PAPER ================= */
(() => {
  const st = $('#st-show'), r = new Robot($('.robot-host', st), { nfc: false }), vf = $('#vf'), slot = $('.vf-slot', vf);
  const screen = $('.laptop-screen', st), ai = new AIWin(screen, 'ChatGPT');
  let busy = false;
  const D = {
    receipt: { ai: 'ChatGPT', ask: 'Add to my expenses', steps: ['Total: $32.40', 'Category: Meals'], title: 'Logged to Expenses.xlsx', line: "Row 14 · Joe's Pizza · $32.40",
      brief: ['🧾 Expense logged', '$32.40 · Meals', '✅ Row 14'], lvl: 'g', say: 'Logged to your expenses ✓' },
    invoice: { ai: 'Claude', ask: 'Audit this invoice', steps: ['Matches PO #4471', 'No duplicate payment', 'Totals add up'], title: 'Audit passed', line: 'Invoice #8812 is ready to pay',
      brief: ['🔍 Audit passed', 'Invoice #8812 · $1,280', '✅ Matches PO #4471'], lvl: 'g', say: 'Audit done. Everything checks out ✓' },
    board: { ai: 'Claude', ask: 'Turn this into tasks', steps: ['Found 4 tasks', 'Assigning owners'], title: 'Created 4 tasks', line: 'Login · API · Tests · Docs',
      brief: ['🗂 4 tasks created', 'Sprint 12', '👥 Assigned to the team'], lvl: 'b', say: 'Your sprint plan is now 4 tasks ✓' },
  };
  async function place(p) {
    if (busy || p.classList.contains('done')) return; busy = true;
    const d = D[p.dataset.kind]; r.reset(); ai.hide();
    const copy = p.cloneNode(true); copy.classList.remove('done', 'inuse'); copy.style.opacity = '';
    slot.innerHTML = ''; slot.appendChild(copy); p.classList.add('inuse');
    vf.classList.add('filled'); Sfx.pop();
    r.look('right'); r.expr('focus'); r.led('listen'); r.say('Hold still… 📸', 2000);
    await sleep(450); vf.classList.add('focus');
    for (const n of ['3', '2', '1']) {
      const c = document.createElement('div'); c.className = 'vf-count'; c.textContent = n; vf.appendChild(c);
      Sfx.beep(); await sleep(380); c.remove();
    }
    await r.snap(st);
    await sleep(200);
    vf.classList.remove('focus');
    await fly(vf, screen, '🖼️', { dur: 650, size: 34, arc: -40 });
    slot.innerHTML = ''; vf.classList.remove('filled'); p.classList.remove('inuse'); p.classList.add('done');
    r.look('screen'); r.led('think'); r.expr('focus');
    ai.reset(); ai.show(d.ai); ai.user(`<span class="aw-chip">📷 photo.jpg</span>${d.ask}`);
    await ai.think('Reading the photo…', 1100);
    await ai.steps(d.steps, 600);
    ai.done(d.title, d.line);
    await sleep(700);
    r.celebrate(d.brief, d.lvl, d.say);
    busy = false;
  }
  $$('.pp', st).forEach(p => draggable(p, {
    accept: () => !busy && !p.classList.contains('done'),
    targets: () => [vf],
    onStart: () => { r.reset(); r.expr('wide'); },
    onMove: (x, y) => r.gazeAt(x, y),
    onDrop: () => place(p),
    onEnd: hit => { if (!hit) { r.look('front'); r.expr(); } },
    onClick: async () => {
      if (busy || p.classList.contains('done')) return;
      await fly(p, vf, p.dataset.kind === 'receipt' ? '🧾' : p.dataset.kind === 'invoice' ? '📃' : '🖼️', { dur: 500, size: 36, arc: -30 });
      place(p);
    },
  }));
  $('#showReset').addEventListener('click', () => { if (busy) return; $$('.pp', st).forEach(p => p.classList.remove('done', 'inuse')); r.reset(); ai.hide(); });
})();

/* ================= 02 · WATCH IT WORK ================= */
(() => {
  const st = $('#st-work'), r = new Robot($('.robot-host', st), { nfc: false }), ai = new AIWin($('.laptop-screen', st), 'Claude');
  const desk = $('#workDesktop'), tray = $('#workTray'), chair = $('#workChair'), avatar = $('.avatar', st), awayBtn = $('#workAway');
  let busy = false, away = false, backlog = [];
  const T = {
    bug: { ack: 'On it! 🐛', ai: 'Claude Code', ask: 'Fix the login bug', steps: ['Reading auth.ts', 'Editing login.tsx', 'Running 42 tests'], title: 'Login bug fixed', line: '2 files changed · 42/42 tests pass',
      brief: ['🐛 Login bug fixed', '2 files · 42 tests ✓', 'Ready for review'], lvl: 'g', say: 'Fixed! All 42 tests pass ✨', note: '• Login bug fixed' },
    sum: { ack: 'Summarizing… 🎙️', ai: 'Claude', ask: 'Summarize Standup.m4a', steps: ['Transcribing 42 min', 'Finding action items'], title: 'Summary saved', line: '5 action items · on your desktop',
      brief: ['🎙️ Standup summary', '5 action items', '📝 On your desktop'], lvl: 'b', say: 'Summary is on your desktop 👈', note: '• Standup summarized',
      after: async () => {
        ai.hide(); r.look('left'); r.mouth('open'); Sfx.whoosh(); await sleep(250);
        await fly(r.mouthEl, avatar, '📝', { dur: 600 });
        desk.innerHTML = '<div class="file new"><span class="fi">📝</span><span>Standup_summary.md</span></div>'; Sfx.pop();
        r.mouth('smile'); await sleep(700); r.look('front');
      } },
    plan: { ack: "Let's plan your day ☀️", ai: 'ChatGPT', ask: 'Plan my day', steps: ['Checking your calendar', 'Reading 12 emails', 'Prioritizing'], title: 'Day planned', line: '3 priorities · 2 meetings',
      brief: ['📋 Day planned', '3 priorities', '🖨 Printed for you'], lvl: 'b', say: "Here's your day. Printed ☀️", note: '• Day planned',
      after: () => printReceipt(r, tray, ['NIBBLE · THU NOV 20', '------------------', '[ ] Ship login fix', "[ ] Review Wang's PR", '[ ] 2pm standup', '[ ] Reply to Maya', '------------------', 'you got this ☕']) },
  };
  async function run(k) {
    if (busy) return; busy = true;
    const t = T[k]; r.reset(); tray.innerHTML = '';
    $$('#ch-work [data-task]').forEach(b => b.classList.toggle('primary', b.dataset.task === k));
    if (!away) { r.led('listen'); r.mouth('o'); r.nod(); r.say(t.ack, 1500); await sleep(1000); r.mouth(); }
    r.look('screen'); r.led('think'); r.expr('focus');
    ai.reset(); ai.show(t.ai); ai.user(t.ask);
    await sleep(350);
    await ai.steps(t.steps, 800);
    ai.done(t.title, t.line);
    await sleep(600);
    if (away) {
      backlog.push(t.note);
      r.look('right'); r.led('done'); r.expr('happy'); r.say("Done. I'll tell you when you're back 🛡️", 2800);
    } else {
      r.celebrate(t.brief, t.lvl, t.say);
      if (t.after) { await sleep(900); await t.after(); }
    }
    busy = false;
  }
  $$('#ch-work [data-task]').forEach(b => b.addEventListener('click', () => run(b.dataset.task)));
  awayBtn.addEventListener('click', async () => {
    away = !away;
    chair.classList.toggle('away', away); $('small', chair).textContent = away ? 'empty' : 'you';
    awayBtn.textContent = away ? '👋 Come back' : '🚶 Leave desk';
    if (away) {
      if (!busy) { r.reset(); r.look('right'); r.expr('focus'); r.say('Guarding your desk 🛡️', 2400); }
    } else {
      if (busy) return;
      r.reset(); r.wave(); r.expr('happy'); r.mouth('smile'); r.led('listen'); Sfx.success();
      if (backlog.length) {
        r.say(`Welcome back! ${backlog.length} thing${backlog.length > 1 ? 's' : ''} finished while you were away.`, 3500);
        await printReceipt(r, tray, ['WHILE YOU WERE AWAY', '------------------', ...backlog]); backlog = [];
      } else r.say('Welcome back! 👋', 2200);
    }
  });
})();

/* ================= 03 · YOU DECIDE ================= */
(() => {
  const st = $('#st-decide'), r = new Robot($('.robot-host', st), { nfc: false }), ai = new AIWin($('.laptop-screen', st), 'Claude');
  const hint = $('#patHint'), chip = $('#undoChip'), tray = $('#decideTray'), hintLine = $('#decideHint');
  let pending = null, undoTimer = null, undoLeft = 0, starting = false, lastApprove = 0;
  const HINT = {
    y: "<b>Click Nibble's head to pat it</b> and approve. Drag the head sideways to push it away and cancel.",
    r: "<b>Press and hold Nibble's head for 3 seconds.</b> A quick pat is not enough for a payment.",
  };
  function stopUndo() { clearInterval(undoTimer); undoTimer = null; chip.classList.remove('show'); }
  async function start() {
    if (starting) return; starting = true;
    const lvl = segVal.risk;
    stopUndo(); pending = null; r.reset(); tray.innerHTML = ''; hint.classList.remove('show');
    hintLine.innerHTML = HINT[lvl];
    r.look('screen'); r.led('think'); r.expr('focus');
    ai.reset(); ai.show(lvl === 'y' ? 'Claude' : 'ChatGPT');
    if (lvl === 'y') {
      ai.user('Email the November expenses to finance');
      await ai.think('Drafting the email…', 1100);
      ai.wait('Waiting for your pat on Nibble', 'To: finance@ (3 people) · Nov_expenses.xlsx');
    } else {
      ai.user('Pay invoice #8812 from Acme');
      await ai.think('Preparing the payment…', 1100);
      ai.wait('Waiting for a 3-second hold', '$1,280.00 → Acme Supply (new payee)');
    }
    r.look('front'); r.expr('wide'); r.led('need'); r.el.classList.add('ask'); Sfx.alert();
    if (lvl === 'y') { r.brief(['📧 Send email', '→ finance@ (3 people)', '📎 Nov_expenses.xlsx'], 'y'); r.say('Pat my head to send it 👋', 0); }
    else { r.brief(['💳 Payment', '$1,280 → Acme Supply', '⛔ First-time payee'], 'r'); r.say('Big one. Hold my head for 3 seconds ✊', 0); }
    $('span', hint).textContent = lvl === 'y' ? 'pat' : 'hold';
    hint.classList.add('show'); pending = lvl; starting = false;
  }
  function approve(lvl) {
    lastApprove = performance.now(); pending = null; hint.classList.remove('show'); r.el.classList.remove('ask', 'holding'); r.setRing(0); r.unbrief();
    r.expr('happy'); r.mouth('smile'); r.led('done'); r.nod(); Sfx.success();
    if (lvl === 'y') {
      ai.done('Email sent', 'to finance@ · just now');
      r.say('Sent ✓ Pat my back within 10 s to undo.', 4000);
      undoLeft = 10; $('span', chip).textContent = undoLeft; chip.classList.add('show');
      undoTimer = setInterval(() => { undoLeft--; $('span', chip).textContent = undoLeft; if (undoLeft <= 0) stopUndo(); }, 1000);
    } else {
      ai.done('Payment sent', '$1,280.00 → Acme Supply');
      r.say("Phew 😮‍💨 Paid. Here's your receipt.", 3500);
      printReceipt(r, tray, ['DECISION RECEIPT', '------------------', '✓ PAID $1,280.00', 'To: Acme Supply', 'Invoice #8812', 'Approved: 3 s hold', new Date().toLocaleDateString()]);
    }
  }
  function reject() {
    pending = null; hint.classList.remove('show'); r.el.classList.remove('ask', 'holding'); r.setRing(0); r.unbrief();
    r.look('right'); r.expr('sad'); r.mouth('flat'); Sfx.error();
    ai.err('Cancelled', 'You pushed Nibble away. Nothing was sent.');
    r.say("Okay, okay. Cancelled. I won't do it 🙈", 2800);
    setTimeout(() => { r.look('front'); r.expr(); r.mouth(); r.led('idle'); }, 1600);
  }
  function undo() {
    if (!undoTimer) return; stopUndo();
    r.expr('wide'); r.led('need'); r.recoil(); Sfx.whoosh();
    ai.err('Email recalled', 'It never left your outbox.');
    r.say('Unsent! ↩ It never left.', 2800);
    setTimeout(() => { r.expr(); r.led('idle'); }, 1500);
  }
  let down = null, iv = null, done = false;
  r.el.addEventListener('pointerdown', e => {
    if (!pending) return;
    e.preventDefault(); try { r.el.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    down = { x: e.clientX, t: performance.now() }; done = false;
    hint.classList.remove('show');
    if (pending === 'r') {
      r.el.classList.add('holding'); r.expr('tense'); let lastTick = 0;
      clearInterval(iv);
      iv = setInterval(() => {
        if (!down || done) { clearInterval(iv); return; }
        const p = (performance.now() - down.t) / 3000; r.setRing(p);
        if (p - lastTick > .2) { lastTick = p; Sfx.tick(p); }
        r.say(`Keep holding… ${Math.min(3, Math.floor(p * 3) + 1)} / 3`, 0);
        if (p >= 1) { done = true; clearInterval(iv); approve('r'); }
      }, 30);
    } else { r.expr('happy'); }
  });
  r.el.addEventListener('pointermove', e => {
    if (!down || done || !pending) return;
    const dx = e.clientX - down.x;
    if (Math.abs(dx) > 6) r.vars(clamp(dx * .6, -40, 40), 0, clamp(dx * .1, -8, 8), clamp(dx * .2, -15, 15), 0);
    if (Math.abs(dx) > 60) { done = true; clearInterval(iv); reject(); }
  });
  const end = e => {
    if (!down) return;
    const dx = e.clientX - down.x; clearInterval(iv);
    const lvl = pending; down = null;
    if (done || !lvl) return;
    r.look('front');
    if (lvl === 'y' && Math.abs(dx) < 14) approve('y');
    else if (lvl === 'r') {
      r.el.classList.remove('holding'); r.setRing(0); r.expr('wide'); hint.classList.add('show');
      r.say('Not long enough. Nothing happened. Hold for 3 s ✊', 0);
    } else { hint.classList.add('show'); r.expr('wide'); }
  };
  r.el.addEventListener('pointerup', end); r.el.addEventListener('pointercancel', end);
  r.bodyEl.addEventListener('click', () => { if (!pending && performance.now() - lastApprove > 600) undo(); });
  chip.addEventListener('click', undo);
  $('[data-tabs="risk"]').addEventListener('segchange', start);
  $('#decideAgain').addEventListener('click', start);
  new IntersectionObserver((es, ob) => { if (es[0].isIntersecting) { start(); ob.disconnect(); } }, { threshold: .5 }).observe(st);
})();

/* ================= 04 · SHARE WITH COWORKERS ================= */
(() => {
  const st = $('#st-social'), r = new Robot($('.robot-host', st)), A = $('#phoneA'), B = $('#phoneB'), card = $('#socialCard'), cap = $('#socialCaption');
  let step = 0, busy = false;
  const scr = p => $('.phone-screen', p);
  const home = (p, name, msg) => { scr(p).innerHTML = `<div class="ps"><div class="ps-time">12:41</div><div class="ps-name">${name}</div><div class="ps-msg">${msg}</div></div>`; };
  const cardOn = (p, html) => { scr(p).innerHTML = `<div class="ps light"><div style="height:8px"></div><div class="ps-card">${html}</div></div>`; };
  const M = {
    card: { first: 'A', steps: 2, cap0: "<b>Tap Lin's phone first,</b> then Wang's." },
    aa: { first: 'A', steps: 2, cap0: "<b>Lin paid for coffee.</b> Tap Lin's phone, then Wang's." },
    msg: { first: 'A', steps: 2, cap0: "<b>Lin wants to leave Wang a file.</b> Tap Lin's phone." },
    guest: { first: 'B', steps: 1, cap0: "<b>A visitor arrives.</b> Tap the visitor's phone." },
  };
  function reset() {
    step = 0; busy = false; r.reset(); card.classList.remove('show');
    const m = segVal.social;
    home(A, 'Lin', 'Tap me on Nibble →');
    if (m === 'guest') { home(B, 'Visitor · Alex', '← Tap me on Nibble'); scr(B).firstChild.style.background = 'linear-gradient(160deg,#5BC0EB,#2F6BFF)'; }
    else home(B, 'Wang', '← Tap me on Nibble');
    cap.innerHTML = M[m].cap0;
  }
  async function printCard(lines) {
    card.classList.remove('show'); card.innerHTML = lines.map((l, i) => (i ? `<div>${l}</div>` : `<b>${l}</b>`)).join('');
    r.printStrip(1400); await sleep(250); card.classList.add('show');
  }
  async function tap(who) {
    if (busy) return;
    const m = segVal.social, cfg = M[m];
    if (step >= cfg.steps) { r.say('All done here. Hit reset to try again 🙂', 2000); return; }
    const expected = step === 0 ? cfg.first : (cfg.first === 'A' ? 'B' : 'A');
    if (who !== expected) { r.shake(); r.say(`One at a time. Tap ${expected === 'A' ? "Lin's" : (m === 'guest' ? "the visitor's" : "Wang's")} phone first.`, 2400); return; }
    busy = true;
    const p = who === 'A' ? A : B;
    p.animate([{ transform: 'none' }, { transform: `translateX(${who === 'A' ? 110 : -110}px) rotate(${who === 'A' ? 8 : -8}deg)` }, { transform: 'none' }], { duration: 800, easing: 'ease-in-out' });
    await sleep(380); Sfx.ding(); r.reset(); r.ripple();
    r.look(who === 'A' ? 'left' : 'right'); r.expr('wide'); r.led('listen');
    await sleep(300);
    if (m === 'card') {
      if (step === 0) { r.say('Hi Lin! Waiting for one more phone…', 0); cardOn(A, '⏳ Waiting for the other phone…'); cap.innerHTML = "<b>Now tap Wang's phone.</b>"; }
      else {
        r.celebrate(null, null, 'Contacts swapped! Printing a conversation starter 🖨');
        cardOn(A, '✅ <b>Connected on LinkedIn</b><br>Wang · MEng CS'); cardOn(B, '✅ <b>Connected on LinkedIn</b><br>Lin · MBA');
        await printCard(['🤝 LIN × WANG', 'Both at Cornell Tech · both into fintech', 'Talk about: you both build AI agents ✨', 'LinkedIn connected ✓']);
        cap.innerHTML = '<b>The printed card gives them something to talk about.</b> This is the moment people film.';
      }
    }
    if (m === 'aa') {
      if (step === 0) { r.say('Coffee for two: $23.40. Who is splitting? ☕', 0); cardOn(A, '☕ Paid $23.40<br>Splitting with…'); cap.innerHTML = "<b>Tap Wang's phone to split.</b>"; }
      else {
        r.celebrate(['💰 Coffee run', '$23.40 ÷ 2', '$11.70 each'], 'g', 'Split evenly: $11.70 each ✓');
        cardOn(B, '💸 <b>Payment request</b><br>$11.70 → Lin<br><u>Pay now</u>'); cardOn(A, '✅ Request sent to Wang<br>$11.70');
        cap.innerHTML = '<b>Split in two taps.</b> Each person still approves the payment in their own app.';
      }
    }
    if (m === 'msg') {
      if (step === 0) { r.hat('📦'); r.expr('happy'); r.say("Got it. I'll hold this for Wang 📦", 0); cardOn(A, '📎 Left <b>Design.fig</b> for Wang<br>"look before 3pm"'); cap.innerHTML = "<b>Later, Wang comes back to his desk.</b> Tap Wang's phone."; }
      else {
        r.hat(null); r.wave(); r.celebrate(null, null, 'Wang! Lin left you a design file 📎');
        cardOn(B, '📥 <b>From Lin</b><br>Design.fig<br>"look before 3pm"'); cap.innerHTML = '<b>Nibble was the messenger.</b> No Slack ping lost in the noise.';
      }
    }
    if (m === 'guest') {
      r.wave(); r.celebrate(null, null, "Welcome, Alex! I've let Lin know you're here 👋");
      cardOn(A, '👋 <b>Alex has arrived</b><br>at reception'); cardOn(B, '📶 Joined guest Wi-Fi ✓');
      await printCard(['👋 WELCOME, ALEX', 'Wi-Fi: CT-Guest', 'Password: nibble-2026', 'Lin is on the way']);
      cap.innerHTML = '<b>Visitor check-in with no app to install.</b> The host gets a ping.';
    }
    step++; busy = false;
  }
  draggable(A, { targets: () => [r.bodyEl, r.headEl], onDrop: () => tap('A'), onClick: () => tap('A') });
  draggable(B, { targets: () => [r.bodyEl, r.headEl], onDrop: () => tap('B'), onClick: () => tap('B') });
  $('[data-tabs="social"]').addEventListener('segchange', reset);
  $('#socialReset').addEventListener('click', reset);
  reset();
})();

/* ================= A DAY WITH NIBBLE ================= */
(() => {
  const st = $('#st-day'), r = new Robot($('.robot-host', st)), tray = $('#dayTray'), desk = $('#dayDesktop'),
    avatar = $('.avatar', st), clock = $('#dayClock'), cap = $('#dayCaption'), tl = $('#timeline'), ai = new AIWin($('.laptop-screen', st), 'Claude');
  let running = false, token = 0;
  const right = () => stagePoint(st, 690, 150), below = () => stagePoint(st, 405, 420);
  const patHead = async () => { await fly(below(), r.headEl, '✋', { dur: 650, arc: 0, size: 34 }); Sfx.pop(); };
  const dropFile = async (icon, name) => {
    ai.hide(); desk.innerHTML = `<div class="file new"><span class="fi">${icon}</span><span>${name}</span></div>`;
    await sleep(500);
    const f = $('.file', desk); await fly(f, avatar, icon, { dur: 500, arc: -30 }); f.classList.add('eaten');
    avatar.classList.add('chomp'); Sfx.chomp(); r.look('left'); r.mouth('open'); r.expr('wide');
    await sleep(450); avatar.classList.remove('chomp');
    await fly(avatar, r.mouthEl, icon, { dur: 650 }); r.expr(); await r.chew(1000);
    desk.innerHTML = '';
  };
  const work = async (name, ask, steps) => {
    r.look('screen'); r.led('think'); r.expr('focus');
    ai.reset(); ai.show(name); ai.user(ask); await sleep(300); await ai.steps(steps, 600);
  };
  const DEV = [
    { t: '09:30', title: 'Lin sits down', desc: "Nibble wakes up and prints today's to-dos.", run: async () => {
      ai.hide(); r.reset(); r.expr('sleep'); r.led('off'); await sleep(900);
      r.reset(); r.wave(); r.expr('happy'); r.mouth('smile'); r.led('listen'); Sfx.success(); r.say("Morning, Lin! Here's your day ☀️", 2600);
      await printReceipt(r, tray, ['NIBBLE · THU NOV 20', '------------------', '[ ] Fix login #231', "[ ] Review Wang's PR", '[ ] 2pm standup']);
    } },
    { t: '10:00', title: 'Holds up a paper sketch', desc: "The PM's sketch goes straight to Claude Code. No scanning.", run: async () => {
      r.reset(); r.look('right'); await fly(right(), r.headEl, '✏️', { dur: 700, size: 40, arc: -20 }); await r.snap(st); r.nod();
      r.say('Got the sketch. Building it now.', 2200);
      await work('Claude Code', '<span class="aw-chip">📷 sketch.jpg</span>Build this login page', ['Reading the sketch', 'Creating login.tsx']);
    } },
    { t: '10:20', title: 'The agent needs approval', desc: 'Lin is getting coffee. Nibble turns around, blinks yellow, and waits for a pat.', run: async () => {
      ai.show('Claude Code'); ai.wait('Waiting for your pat on Nibble', 'Run a database migration on "users"');
      r.reset(); r.led('need'); r.expr('wide'); r.el.classList.add('ask'); Sfx.alert();
      r.brief(['🗄 DB migration', 'ALTER TABLE users', '⚠️ No auto-rollback'], 'y'); r.say('Lin! I need your OK on this one 👀', 0);
      await sleep(2200); await patHead(); r.el.classList.remove('ask'); r.unbrief(); r.nod(); r.expr('happy'); r.say('Approved. Running it ✓', 2000);
      await sleep(1000); await work('Claude Code', 'Run migration', ['Migrating 12 tables']);
    } },
    { t: '11:00', title: 'The agent finishes', desc: 'A happy hop. Lin knows without checking a single window.', run: async () => {
      ai.show(); ai.done('Login page shipped', '42/42 tests pass'); await sleep(500);
      r.celebrate(['✅ Login page shipped', '42/42 tests pass', 'Ready to merge'], 'g', 'All done! ✨');
    } },
    { t: '14:30', title: 'Drags a PR onto the avatar', desc: 'Nibble eats it, chews, and prints the review to discuss in person.', run: async () => {
      r.reset(); await dropFile('🔗', 'PR #233');
      await work('Claude', 'Review PR #233', ['Reading 14 files', 'Checking security']);
      ai.err('2 issues found', 'SQL injection in db.ts:88'); await sleep(500);
      r.look('front'); r.led('error'); r.expr('wide'); Sfx.alert();
      r.brief(['🔗 PR #233', '2 issues · 1 critical', '⛔ SQL injection'], 'r'); r.say('Two issues, one critical. Printed for you.', 3000);
      await printReceipt(r, tray, ['PR #233 REVIEW', '------------------', '! L45 null check', '!! SQL injection', '   db.ts:88']);
    } },
    { t: '17:30', title: 'Wraps up the day', desc: 'A recap slip, then Nibble goes to sleep.', run: async () => {
      ai.hide(); r.reset(); r.expr('happy'); r.say("Great day! Here's your recap 🌙", 2400);
      await printReceipt(r, tray, ['RECAP · NOV 20', '------------------', '✓ Login page shipped', '✓ DB migrated', '✓ 1 PR reviewed', 'Tomorrow: PR #233']);
      await sleep(900); r.expr('sleep'); r.led('off');
    } },
  ];
  const CLERK = [
    { t: '09:00', title: '20 paper receipts', desc: 'Chen holds each one up. About 3 seconds per receipt, no scanner.', run: async () => {
      ai.hide(); r.reset(); r.look('right');
      for (let i = 0; i < 3; i++) { await fly(right(), r.headEl, '🧾', { dur: 450, size: 36, arc: -10 }); await r.snap(st); r.say(`Receipt ${[1, 7, 20][i]}/20 ✓`, 900); await sleep(300); }
      await work('ChatGPT', '<span class="aw-chip">📷 ×20</span>Add to expenses', ['Reading 20 receipts', 'Filling the sheet']);
      ai.done('20 rows added', 'Total $1,284.60'); await sleep(400);
      r.celebrate(['🧾 20 receipts', '$1,284.60 total', '✅ Sheet filled'], 'g', 'All 20 logged ✓');
    } },
    { t: '10:30', title: 'A coworker taps a contract', desc: "Maya walks in with a contract on her phone and taps Nibble's nose.", run: async () => {
      ai.hide(); r.reset(); r.look('right'); await fly(right(), r.nfcEl, '📱', { dur: 700, size: 38, arc: -10 }); r.ripple(); Sfx.ding();
      r.expr('wide'); r.say("Got Maya's contract 📄", 1800); await sleep(700);
      await work('Claude', '<span class="aw-chip">📄 contract_v2.pdf</span>Compare to last month', ['Comparing 2 versions']);
      ai.done('3 changes found', 'Price +8% · new 30-day term'); await sleep(400);
      r.look('front'); r.led('need'); r.expr('wide'); r.brief(['📄 Vendor contract', '3 changes vs last month', '⚠️ Price +8%'], 'y'); r.say('Heads up: the price went up 8%.', 3200);
    } },
    { t: '11:00', title: 'Drops a meeting recording', desc: 'Nibble eats the audio and prints the action items for the notice board.', run: async () => {
      r.reset(); await dropFile('🎙️', 'Weekly.m4a');
      await work('Claude', 'Summarize the weekly', ['Transcribing 38 min', 'Finding action items']);
      ai.done('5 action items', 'Printing for the notice board'); await sleep(400);
      r.celebrate(null, null, '5 action items. Printing for the board 📌');
      await printReceipt(r, tray, ['WEEKLY · 38 MIN', '------------------', 'Maya: vendor call', 'Chen: Nov expenses', 'Leo: order chairs']);
    } },
    { t: '14:00', title: 'Emails finance, with a pat', desc: 'Sending to the wrong person is the admin nightmare. The pat makes Chen check first.', run: async () => {
      r.reset(); ai.show('Claude'); ai.reset(); ai.user('Send Nov expenses to finance'); ai.wait('Waiting for your pat on Nibble', 'To: finance@ (3) · Nov_expenses.xlsx');
      r.led('need'); r.expr('wide'); r.el.classList.add('ask'); r.brief(['📧 Send to Finance', 'Nov_expenses.xlsx', '→ finance@ (3 people)'], 'y');
      r.say('Pat my head to send.', 0); Sfx.alert(); await sleep(2000); await patHead();
      r.el.classList.remove('ask'); ai.done('Email sent', 'to finance@'); r.celebrate(null, null, 'Sent ✓ (pat my back within 10 s to undo)');
    } },
    { t: '16:00', title: 'The boss asks a question', desc: 'Nibble is a team member anyone can talk to, not something hidden on one laptop.', run: async () => {
      ai.hide(); r.reset(); r.led('listen'); r.mouth('o'); r.say('🗣 "How much did we spend this month?"', 1800); await sleep(1900);
      r.celebrate(['📊 November', '$12,380 spent', '↑ 15% vs October'], 'b', 'November: $12,380. That is up 15% from October.');
    } },
  ];
  const data = () => (segVal.persona === 'dev' ? DEV : CLERK);
  function renderTL() {
    tl.innerHTML = data().map((s, i) => `<li data-i="${i}"><time>${s.t}</time><div><b>${s.title}</b><small>${s.desc}</small></div></li>`).join('');
    $$('li', tl).forEach(li => li.addEventListener('click', () => { if (!running) runOne(+li.dataset.i); }));
  }
  async function runOne(i, inPlay) {
    const s = data()[i];
    $$('li', tl).forEach((li, j) => li.classList.toggle('on', j === i));
    clock.textContent = s.t; cap.innerHTML = `<b>${s.t}</b> · ${s.desc}`;
    if (!inPlay) { running = true; $('#dayPlay').disabled = true; }
    await s.run();
    if (!inPlay) { running = false; $('#dayPlay').disabled = false; }
  }
  $('#dayPlay').addEventListener('click', async () => {
    if (running) return; running = true; const my = ++token; $('#dayPlay').disabled = true;
    tray.innerHTML = ''; r.reset(); ai.hide();
    for (let i = 0; i < data().length; i++) {
      if (my !== token) break;
      await runOne(i, true); if ($$('li', tl)[i]) $$('li', tl)[i].classList.add('done'); await sleep(1500);
    }
    running = false; $('#dayPlay').disabled = false; $$('li', tl).forEach(li => li.classList.remove('done'));
  });
  $('[data-seg="persona"]').addEventListener('segchange', () => {
    token++; r.reset(); ai.hide(); tray.innerHTML = ''; desk.innerHTML = '';
    renderTL(); clock.textContent = data()[0].t; cap.textContent = 'Press play, or click any moment on the left.';
  });
  renderTL();
})();
