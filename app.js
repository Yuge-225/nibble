/* Nibble — interactive product page (v3) */
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const sleep = ms => new Promise(r => setTimeout(r, ms));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* ================= ICONS (hand-drawn SVG, no emoji) ================= */
const P = {
  doc: '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5"/><path d="M10 13h6M10 17h6"/>',
  audio: '<path d="M4 10v4M8 7v10M12 4v16M16 8v8M20 11v2"/>',
  chart: '<path d="M4 20h16"/><rect x="6" y="11" width="3" height="7" rx="1"/><rect x="11" y="7" width="3" height="11" rx="1"/><rect x="16" y="13" width="3" height="5" rx="1"/>',
  receipt: '<path d="M6 3h12v18l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5L6 21z"/><path d="M9 8h6M9 12h6M9 16h3"/>',
  board: '<rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M8 20l4-4 4 4"/><path d="M7 8h5M7 11h8"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M3 10h18M8 3v4M16 3v4"/><path d="M8 14h2M12 14h2M16 14h0M8 17h2"/>',
  coins: '<circle cx="9" cy="10" r="5.5"/><path d="M14.5 9.2A5.5 5.5 0 1 1 9.8 15.5"/><path d="M9 7.5v5"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3.5 7l8.5 6 8.5-6"/>',
  card: '<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 10h19M6 15h4"/>',
  box: '<path d="M3 8l9-5 9 5v8l-9 5-9-5z"/><path d="M3 8l9 5 9-5M12 13v8M7.5 5.5l9 5"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
  phone: '<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/>',
  spark: '<path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6L5.6 18.4"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/>',
  play: '<path d="M8 5.5l11 6.5-11 6.5z" fill="currentColor"/>',
  reset: '<path d="M4 12a8 8 0 1 0 2.5-5.8"/><path d="M4 4.5V9h4.5"/>',
  cursor: '<path d="M5 3l14 7-6 2-2 6z"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  hand: '<path d="M18 11V6a2 2 0 0 0-4 0v5"/><path d="M14 10V4a2 2 0 0 0-4 0v6"/><path d="M10 10.5V6a2 2 0 0 0-4 0v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.9-6-2.4l-3.6-3.6a2 2 0 0 1 2.8-2.8L6 15"/>',
  sound: '<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16.5 9a4 4 0 0 1 0 6M19 6.5a7.5 7.5 0 0 1 0 11"/>',
  mute: '<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M17 9.5l5 5M22 9.5l-5 5"/>',
  star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" fill="currentColor"/>',
  nfc: '<path d="M7 8.5a5 5 0 0 1 0 7M10.5 6a8.5 8.5 0 0 1 0 12M14 3.5a12 12 0 0 1 0 17"/>',
  moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
};
const svg = (name, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" ${extra}>${P[name] || ''}</svg>`;
const ic = (name, color) => `<i data-ic="${name}" ${color ? `style="color:${color}"` : ''}>${svg(name)}</i>`;
const paintIcons = (root = document) => $$('i[data-ic]', root).forEach(el => { if (!el.firstChild) el.innerHTML = svg(el.dataset.ic); });
paintIcons();

/* ================= SOUND ================= */
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
  achieve() { [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, .22, 'triangle', .06, i * .07)); },
  alert() { this.tone(880, .12, 'square', .035); this.tone(660, .16, 'square', .035, .14); },
  error() { this.tone(320, .3, 'sawtooth', .05, 0, 140); },
  pop() { this.tone(520, .09, 'sine', .08, 0, 1100); },
  whoosh() { this.noise(.32, .07, 0, 900); },
  tear() { this.noise(.28, .09, 0, 4200, 'highpass'); },
  tick(p = 0) { this.tone(400 + p * 700, .05, 'triangle', .05); },
  blip(i) { this.tone(700 + i * 60, .04, 'sine', .035); },
  beep() { this.tone(980, .08, 'square', .03); },
  vibrate() { for (let i = 0; i < 3; i++) this.tone(150, .14, 'square', .04, i * .2); },
  steps(n = 4) { for (let i = 0; i < n; i++) this.noise(.05, .18, i * .28, 160, 'lowpass'); },
  scratch() { for (let i = 0; i < 9; i++) this.noise(.04, .05, i * .055, 5200, 'highpass'); },
  coin() { this.tone(1568, .08, 'square', .03); this.tone(2093, .2, 'square', .03, .07); },
  stamp() { this.noise(.12, .35, 0, 140, 'lowpass'); this.tone(90, .2, 'sine', .12); },
  yawn() { this.tone(520, .9, 'sine', .05, 0, 200); },
  clockTick() { this.noise(.015, .12, 0, 3000, 'highpass'); },
};
$('#soundBtn').addEventListener('click', e => {
  Sfx.on = !Sfx.on; const b = e.currentTarget;
  b.setAttribute('aria-pressed', Sfx.on); b.querySelector('i').innerHTML = svg(Sfx.on ? 'sound' : 'mute'); if (Sfx.on) Sfx.pop();
});

/* ================= HELPERS ================= */
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
    { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(.4)`, opacity: .6 },
  ], { duration: dur, easing: 'cubic-bezier(.45,0,.3,1)' });
  await Promise.race([anim.finished.catch(() => {}), sleep(dur + 150)]); f.remove();
}
async function stream(from, to, iconHTML, { count = 12, dur = 1300, arc = -110, color = '#FF6B3D', onProgress, size = 30 } = {}) {
  const a = center(rectOf(from)), b = center(rectOf(to));
  const c = { x: (a.x + b.x) / 2, y: Math.min(a.y, b.y) + arc };
  const pt = t => ({ x: (1 - t) * (1 - t) * a.x + 2 * (1 - t) * t * c.x + t * t * b.x, y: (1 - t) * (1 - t) * a.y + 2 * (1 - t) * t * c.y + t * t * b.y });
  const frames = scale => Array.from({ length: 17 }, (_, k) => { const t = k / 16, p = pt(t); return { transform: `translate(${p.x}px,${p.y}px) scale(${scale(t)})` }; });
  const els = [];
  for (let i = 0; i < count; i++) {
    const d = document.createElement('div'); d.className = 'dot'; d.style.background = color; d.style.boxShadow = `0 0 8px ${color}`;
    document.body.appendChild(d); els.push(d);
    d.animate(frames(t => .6 + Math.sin(Math.PI * t)), { duration: dur * .75, delay: i * (dur * .25 / count), easing: 'ease-in-out', fill: 'both' });
  }
  const f = document.createElement('div'); f.className = 'flyer'; f.style.left = '0'; f.style.top = '0'; f.style.fontSize = size + 'px'; f.style.color = color;
  f.innerHTML = `<div style="transform:translate(-50%,-50%)">${iconHTML}</div>`; document.body.appendChild(f); els.push(f);
  f.animate(frames(t => 1 + .5 * Math.sin(Math.PI * t) - .45 * t), { duration: dur, easing: 'cubic-bezier(.45,0,.35,1)', fill: 'both' });
  const t0 = performance.now();
  const iv = setInterval(() => { const p = clamp((performance.now() - t0) / dur, 0, 1); onProgress && onProgress(p); if (p >= 1) clearInterval(iv); }, 40);
  let k = 0; const bl = setInterval(() => { Sfx.blip(k++ % 8); if (k > dur / 90) clearInterval(bl); }, 90);
  await sleep(dur + 60); clearInterval(iv); clearInterval(bl); onProgress && onProgress(1);
  els.forEach(e => e.remove());
}
const stageScale = st => $('.stage-inner', st).getBoundingClientRect().width / 680;
function stagePoint(stage, x, y) { const r = $('.stage-inner', stage).getBoundingClientRect(), s = r.width / 680; return { left: r.left + x * s, top: r.top + y * s, width: 0, height: 0 }; }
function flash(stage) {
  const inner = $('.stage-inner', stage) || stage;
  let f = $('.flash', inner); if (!f) { f = document.createElement('div'); f.className = 'flash'; inner.appendChild(f); }
  f.classList.remove('go'); void f.offsetWidth; f.classList.add('go');
}
function setPrompt(el, text) { el.innerHTML = `<span class="pulse"></span>${text}`; }

function draggable(el, { targets = () => [], onDrop, onClick, onMove, onStart, onEnd, accept = () => true }) {
  el.addEventListener('pointerdown', e => {
    if (e.button !== 0 || !accept()) return;
    if (e.target.closest('.tile, .ps-link, .op-btn')) return;
    e.preventDefault();
    const r = el.getBoundingClientRect(), scale = r.width / (el.offsetWidth || r.width);
    const sx = e.clientX, sy = e.clientY; let moved = false, ghost = null, over = null; const tlist = targets();
    const move = ev => {
      const dx = ev.clientX - sx, dy = ev.clientY - sy;
      if (!moved && Math.hypot(dx, dy) < 6) return;
      if (!moved) {
        moved = true; ghost = el.cloneNode(true); ghost.classList.add('drag-ghost'); ghost.removeAttribute('id');
        Object.assign(ghost.style, { position: 'fixed', left: r.left + 'px', top: r.top + 'px', right: 'auto', bottom: 'auto', margin: '0', display: getComputedStyle(el).display,
          width: el.offsetWidth + 'px', height: el.offsetHeight + 'px', transformOrigin: '0 0', transform: `scale(${scale}) rotate(-3deg)` });
        document.body.appendChild(ghost); el.style.opacity = '.25'; onStart && onStart();
      }
      ghost.style.left = (r.left + dx) + 'px'; ghost.style.top = (r.top + dy) + 'px';
      onMove && onMove(ev.clientX, ev.clientY, dx, dy);
      over = null;
      tlist.forEach(t => {
        const tr = t.getBoundingClientRect(), pad = 26;
        const hit = ev.clientX > tr.left - pad && ev.clientX < tr.right + pad && ev.clientY > tr.top - pad && ev.clientY < tr.bottom + pad;
        t.classList.toggle('drop-hover', hit && !over); if (hit && !over) over = t;
      });
    };
    const up = () => {
      window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up);
      tlist.forEach(t => t.classList.remove('drop-hover'));
      if (!moved) { onClick && onClick(); return; }
      el.style.opacity = '';
      if (over) { ghost.remove(); onDrop && onDrop(over); }
      else { ghost.animate([{ left: ghost.style.left, top: ghost.style.top }, { left: r.left + 'px', top: r.top + 'px' }], { duration: 250, easing: 'ease-out' }); setTimeout(() => ghost.remove(), 260); }
      onEnd && onEnd(!!over);
    };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
  });
}

/* tabs */
const tabVal = {};
$$('.tabs').forEach(tb => {
  const name = tb.dataset.tabs; tabVal[name] = ($('button.on', tb) || $('button', tb)).dataset.v;
  tb.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    $$('button', tb).forEach(x => x.classList.toggle('on', x === b)); tabVal[name] = b.dataset.v; Sfx.tick(.3);
    const lv = tb.closest('.level'); $$('.pane', lv).forEach(p => p.classList.toggle('on', p.dataset.pane === b.dataset.v));
    tb.dispatchEvent(new CustomEvent('tabchange', { detail: b.dataset.v }));
  });
});

/* stage fit */
function fitStage(st) {
  if (!st.clientWidth) return;
  const s = Math.min(1.25, st.clientWidth / 680), h = (400 * s) + 'px';
  $('.stage-inner', st).style.transform = `scale(${s})`; if (st.style.height !== h) st.style.height = h;
}
const ro = new ResizeObserver(es => es.forEach(e => setTimeout(() => fitStage(e.target), 0)));
$$('.stage').forEach(st => { fitStage(st); ro.observe(st); });

async function printReceipt(robot, tray, lines) {
  tray.innerHTML = '';
  const r = document.createElement('div'); r.className = 'receipt-out';
  r.innerHTML = lines.map(l => `<div class="rl">${l}</div>`).join('') + '<button class="tear">tear off</button>';
  tray.appendChild(r);
  $('.tear', r).addEventListener('click', () => { Sfx.tear(); r.classList.add('torn'); setTimeout(() => r.remove(), 700); });
  robot.printStrip(1600); setTimeout(() => r.classList.add('show'), 60);
  await sleep(1650);
}

const HAND_SVG = `<svg viewBox="0 0 90 124">
  <ellipse cx="45" cy="38" rx="21" ry="31" fill="#F4F5F7" stroke="#BFC5CF" stroke-width="2"/>
  <line x1="45" y1="8" x2="45" y2="27" stroke="#BFC5CF" stroke-width="2"/>
  <path d="M24 56 Q22 34 31 29 Q37 27 39 34 L40 23 Q42 15 47 16 Q52 17 52 25 L53 28 Q56 22 61 24 Q66 27 64 36 L63 41 Q68 39 70 45 Q72 53 66 63 Q62 73 62 86 L62 124 L28 124 L28 88 Q22 74 24 56 Z" fill="#F2C7A5" stroke="#D6A27C" stroke-width="2"/>
  <path d="M26 62 Q13 57 11 47 Q10 41 15 41 Q21 43 27 53" fill="#F2C7A5" stroke="#D6A27C" stroke-width="2"/>
  <rect x="24" y="100" width="42" height="26" rx="6" fill="#3A4152"/></svg>`;
const COIN = '<span style="display:block;width:20px;height:20px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#FFE38A,#F2B21B);border:2px solid #C98C0A"></span>';
const MINI = '<span class="mini-face"><i></i><i></i></span>';

/* ================= GAME: tricks ================= */
const TRICKS = { drag: 'Drag to feed', tap: 'Tap to share', snap: 'Snap paper', plan: 'Morning plan', approve: 'Pat to approve', time: 'Find a time', split: 'Split the bill', message: 'Leave a message' };
const got = new Set();
const hud = $('#hud'), hudDots = $('#hudDots'), toast = $('#toast');
hudDots.innerHTML = Object.keys(TRICKS).map(k => `<b data-k="${k}" title="${TRICKS[k]}"></b>`).join('');
new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) hud.classList.add('show'); }), { threshold: .05 }).observe($('#play'));
let toastT;
function trick(k) {
  if (got.has(k)) return; got.add(k);
  $(`b[data-k="${k}"]`, hudDots).classList.add('on');
  $('#hudText').textContent = `${got.size} / 8 tricks`;
  hud.classList.remove('bump'); void hud.offsetWidth; hud.classList.add('bump');
  toast.innerHTML = `${ic('star')}<div>Trick found: ${TRICKS[k]}<small>${got.size} of 8</small></div>`;
  toast.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => toast.classList.remove('show'), 2600);
  setTimeout(() => Sfx.achieve(), 250);
  const tabMap = { drag: ['feed', 'drag'], tap: ['feed', 'tap'], snap: ['feed', 'snap'], time: ['office', 'time'], split: ['office', 'split'], message: ['office', 'msg'] };
  if (tabMap[k]) { const b = $(`.tabs[data-tabs="${tabMap[k][0]}"] button[data-v="${tabMap[k][1]}"]`); if (b) b.classList.add('got'); }
  if (got.size === 8) setTimeout(allFound, 1600);
}
function confetti() {
  const colors = ['#FF6B3D', '#FFC93C', '#22C273', '#3D7BFF', '#8B6CFF'];
  for (let i = 0; i < 70; i++) {
    const c = document.createElement('div'); c.className = 'confetti';
    c.style.left = Math.random() * 100 + 'vw'; c.style.background = colors[i % 5]; c.style.animationDelay = Math.random() * .6 + 's'; c.style.animationDuration = 2 + Math.random() * 1.5 + 's';
    document.body.appendChild(c); setTimeout(() => c.remove(), 4200);
  }
}
const modal = $('#modal');
let modalRobot = null;
function openModal(title, text, cta) {
  $('#modalTitle').textContent = title; $('#modalText').textContent = text;
  const c = $('#modalCta'); if (cta) { c.style.display = ''; c.textContent = cta.label; c.href = cta.href; } else c.style.display = 'none';
  modal.hidden = false;
  if (!modalRobot) { const h = document.createElement('div'); h.className = 'robot-host'; $('#modalArt').appendChild(h); modalRobot = new Robot(h, { nfc: false }); }
  modalRobot.reset(); modalRobot.expr('happy'); modalRobot.mouth('smile'); modalRobot.led('party'); setTimeout(() => modalRobot.hop(), 200);
}
$('#modalClose').addEventListener('click', () => { modal.hidden = true; });
$('#modalCta').addEventListener('click', () => { modal.hidden = true; });
modal.addEventListener('click', e => { if (e.target === modal) modal.hidden = true; });
function allFound() { confetti(); Sfx.achieve(); setTimeout(() => Sfx.success(), 500); openModal('You found all 8 tricks!', 'That is Nibble. Your AI, finally on your desk.', { label: 'Reserve yours', href: '#pricing' }); }
$$('[data-reserve]').forEach(b => b.addEventListener('click', () => { Sfx.pop(); openModal('Reservations open soon', 'Nibble is in development. Thanks for playing with it.', { label: 'Keep playing', href: '#play' }); }));

/* ================= AI WINDOW ================= */
class AIWin {
  constructor(screen, name = 'Claude') {
    this.el = document.createElement('div'); this.el.className = 'aiwin';
    this.el.innerHTML = `<div class="aw-bar"><i></i><i></i><i></i><span class="aw-name"></span></div><div class="aw-body"></div>`;
    screen.appendChild(this.el); this.body = $('.aw-body', this.el); this.nameEl = $('.aw-name', this.el); this.setName(name);
  }
  setName(n) { this.nameEl.innerHTML = `${svg('spark')}${n}`; }
  show(n) { if (n) this.setName(n); this.el.classList.add('show'); }
  hide() { this.el.classList.remove('show'); }
  reset() { this.body.innerHTML = ''; }
  add(html, cls) { const d = document.createElement('div'); d.className = cls; d.innerHTML = html; this.body.appendChild(d); while (this.body.children.length > 3) this.body.firstChild.remove(); return d; }
  user(html) { return this.add(html, 'aw-user'); }
  async think(text, ms = 1200) { const d = this.add(`<span class="aw-spark spin">${svg('spark')}</span><div>${text}<div class="aw-shim"></div><div class="aw-shim s2"></div></div>`, 'aw-ai'); await sleep(ms); d.remove(); }
  async steps(list, per = 650) {
    const d = this.add(`<span class="aw-spark spin">${svg('spark')}</span><div class="aw-steps"></div>`, 'aw-ai'), box = $('.aw-steps', d);
    for (const s of list) { const row = document.createElement('div'); row.className = 'aw-step'; row.textContent = '○ ' + s; box.appendChild(row); await sleep(per); row.className = 'aw-step ok'; row.textContent = '✓ ' + s; Sfx.tick(.5); }
    $('.aw-spark', d).classList.remove('spin'); return d;
  }
  done(title, line) { Sfx.pop(); return this.add(`<b>✓ ${title}</b>${line}`, 'aw-done'); }
  wait(title, line) { return this.add(`<b>${title}</b>${line}`, 'aw-wait'); }
  err(title, line) { return this.add(`<b>${title}</b>${line}`, 'aw-err'); }
}

/* ================= ROBOT ================= */
class Robot {
  constructor(host, { nfc = true } = {}) {
    host.innerHTML = `
    <div class="robot ${nfc ? '' : 'no-nfc'}" data-led="idle">
      <div class="r-shadow"></div>
      <div class="r-move">
        <div class="r-bubble"></div>
        <div class="r-head">
          <div class="r-touch"></div><div class="r-cam"></div>
          <div class="r-face"><div class="r-eyes"><i class="eye l"></i><i class="eye r"></i></div><div class="r-mouth"></div><div class="r-brief"></div><div class="r-emoji"></div></div>
          <svg class="r-ring" viewBox="0 0 194 194"><circle cx="97" cy="97" r="89"/></svg>
          <div class="r-hat"></div><div class="r-sweat"></div><div class="r-zzz">z z</div>
        </div>
        <div class="r-neck"></div>
        <div class="r-body"><div class="r-led"></div><div class="r-slot"></div><div class="r-paper"></div><div class="r-nfc">${svg('nfc', 'stroke-width="2.4"')}</div></div>
      </div>
    </div>`;
    this.el = $('.robot', host);
    this.moveEl = $('.r-move', host); this.headEl = $('.r-head', host); this.bodyEl = $('.r-body', host);
    this.mouthEl = $('.r-mouth', host); this.nfcEl = $('.r-nfc', host); this.bubble = $('.r-bubble', host);
    this.briefEl = $('.r-brief', host); this.emojiEl = $('.r-emoji', host); this.hatEl = $('.r-hat', host);
    this.paper = $('.r-paper', host); this.ring = $('.r-ring circle', host);
  }
  vars(ry, rx, rz, gx, gy) { const s = this.el.style; s.setProperty('--hry', ry + 'deg'); s.setProperty('--hrx', rx + 'deg'); s.setProperty('--hrz', rz + 'deg'); s.setProperty('--gx', gx + 'px'); s.setProperty('--gy', gy + 'px'); }
  look(dir = 'front') {
    const L = { front: [0, 0, 0, 0, 0], left: [-34, 0, 0, -15, 0], screen: [-34, 6, 0, -15, -2], right: [34, 0, 0, 15, 0], up: [0, 14, 0, 0, -8], down: [0, -10, 0, 0, 7], tilt: [0, 0, -14, 4, 0] };
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
  say(text, ms = 2800) { this.bubble.innerHTML = text; this.bubble.classList.add('show'); clearTimeout(this._st); if (ms) this._st = setTimeout(() => this.bubble.classList.remove('show'), ms); }
  hush() { clearTimeout(this._st); this.bubble.classList.remove('show'); }
  brief(lines, lvl = 'g') {
    this.briefEl.style.setProperty('--lvl', { g: '#2BD47D', y: '#FFC93C', r: '#FF4D4D', b: '#4D8BFF' }[lvl]);
    this.briefEl.innerHTML = lines.map(l => `<div>${l}</div>`).join(''); this.el.classList.add('briefing');
  }
  unbrief() { this.el.classList.remove('briefing'); }
  emoji(name) { if (!name) { this.el.classList.remove('emoji'); return; } this.emojiEl.innerHTML = name.startsWith('<') ? name : svg(name); this.el.classList.add('emoji'); }
  hat(html) { if (html) { this.hatEl.innerHTML = html; this.el.classList.add('hatted'); } else this.el.classList.remove('hatted'); }
  async move(cls, ms) { const m = this.moveEl; m.classList.remove(cls); void m.offsetWidth; m.classList.add(cls); await sleep(ms); m.classList.remove(cls); }
  hop() { return this.move('hop', 560); } nod() { return this.move('nod', 1000); } shake() { return this.move('shake', 900); }
  recoil() { return this.move('recoil', 700); } wave() { return this.move('wave', 1600); } stretch() { return this.move('stretch', 1400); }
  ripple() { const n = this.nfcEl; n.classList.remove('ripple'); void n.offsetWidth; n.classList.add('ripple'); setTimeout(() => n.classList.remove('ripple'), 1400); }
  async chew(ms = 1500) { this.expr('squint'); this.mouth('chew'); this.led('think'); Sfx.chew(ms); await sleep(ms); this.mouth(); this.expr(); }
  async snap(stage) { Sfx.shutter(); flash(stage); this.expr('squint'); await sleep(220); this.expr(); }
  async printStrip(ms = 1600) { this.paper.classList.add('out'); Sfx.print(ms); await sleep(ms); this.paper.classList.remove('out'); }
  setRing(p) { this.ring.style.strokeDashoffset = 560 * (1 - clamp(p, 0, 1)); }
  reset() {
    this.look('front'); this.expr(); this.mouth(); this.led('idle'); this.unbrief(); this.hush(); this.hat(null); this.emoji(null);
    this.el.classList.remove('ask', 'holding'); this.moveEl.className = 'r-move'; this.setRing(0);
  }
  celebrate(lines, lvl, text) {
    this.look('front'); this.led('done'); this.expr('happy'); this.mouth('smile'); this.hop(); Sfx.success();
    if (lines) this.brief(lines, lvl); if (text) this.say(text, 3600);
  }
}
const BOX_HAT = `<svg viewBox="0 0 48 48"><path d="M6 16l18-9 18 9v18l-18 9-18-9z" fill="#E9B872" stroke="#B9874A" stroke-width="2" stroke-linejoin="round"/><path d="M6 16l18 9 18-9M24 25v18" stroke="#B9874A" stroke-width="2" fill="none"/><path d="M15 11.5l18 9" stroke="#FF6B3D" stroke-width="4"/></svg>`;

/* ================= HERO ================= */
const rH = new Robot($('#heroRobot'), { nfc: false });
rH.led('listen');
setTimeout(() => rH.say("Hi, I'm Nibble.", 2600), 800);
window.addEventListener('pointermove', e => { const r = $('#heroRobot').getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return; rH.gazeAt(e.clientX, e.clientY); });
const heroLines = ['Hehe, that tickles!', "I'm hungry. Got a PDF?", 'Pat my head to approve things.', 'I print your day every morning.', 'Scroll down and play with me.'];
let heroI = 0;
$('#heroRobot').addEventListener('click', () => {
  rH.expr('happy'); rH.mouth('smile'); rH.hop(); Sfx.pop(); rH.say(heroLines[heroI++ % heroLines.length], 2400);
  setTimeout(() => { rH.expr(); rH.mouth(); }, 1300);
});

/* ================= 1a DRAG ================= */
(() => {
  const st = $('#st-drag'), inner = $('.stage-inner', st), r = new Robot($('.robot-host', st), { nfc: false });
  const avatar = $('.avatar', st), hand = $('#dragHand'), cursor = $('#dragCursor'), ai = new AIWin($('.laptop-screen', st));
  hand.innerHTML = HAND_SVG;
  let busy = false;
  const D = {
    pdf: { ic: 'doc', col: '#FF7A6B', name: 'Contract.pdf', ask: 'Review this', ai: 'Claude', steps: ['Reading 12 pages', 'Checking clauses'], title: 'Review done', line: '3 risks · Clause 7: 20% penalty', brief: ['Contract reviewed', '3 risks found', 'Clause 7: 20% penalty'], lvl: 'y', say: 'Clause 7 has a 20% penalty. Worth a look.' },
    audio: { ic: 'audio', col: '#B49CFF', name: 'Standup.m4a', ask: 'Summarize', ai: 'Claude', steps: ['Transcribing 42 min', 'Finding action items'], title: 'Summary ready', line: '5 action items · sent to the team', brief: ['Standup summarized', '5 action items', 'Sent to the team'], lvl: 'g', say: '5 to-dos. Already sent to the team.' },
    sheet: { ic: 'chart', col: '#5FE0A0', name: 'Q3_sales.xlsx', ask: 'Any insights?', ai: 'ChatGPT', steps: ['Reading 2,340 rows', 'Building a chart'], title: 'Insight found', line: 'Revenue +18% · Boston leads', brief: ['Q3 sales', 'Revenue up 18%', 'Boston leads'], lvl: 'b', say: 'Q3 is up 18%. Boston is winning.' },
  };
  const moveHand = (dx, dy) => { const s = stageScale(st); hand.style.transform = `translate(${clamp(dx / s * .3, -55, 55)}px, ${clamp(dy / s * .18, -24, 18)}px)`; };
  const releaseHand = () => { hand.classList.remove('press'); hand.style.transform = ''; };
  async function feed(file) {
    if (busy || file.classList.contains('eaten')) return; busy = true;
    const d = D[file.dataset.kind]; r.reset(); ai.hide(); file.classList.add('eaten');
    avatar.classList.add('chomp'); Sfx.chomp(); r.look('left'); r.mouth('open'); r.expr('wide');
    await sleep(450); avatar.classList.remove('chomp');
    await fly(avatar, r.mouthEl, `<span style="color:${d.col}">${svg(d.ic)}</span>`, { dur: 700, size: 32 });
    Sfx.chomp(); r.expr(); await r.chew(1000);
    r.look('screen'); r.led('think'); r.expr('focus'); r.say('Thinking...', 1400);
    ai.reset(); ai.show(d.ai); ai.user(`<span class="aw-chip">${d.name}</span>${d.ask}`);
    await sleep(400); await ai.steps(d.steps, 750); ai.done(d.title, d.line); await sleep(700);
    r.celebrate(d.brief, d.lvl, d.say); trick('drag'); busy = false;
  }
  async function autoDrag(file) {
    if (busy || file.classList.contains('eaten')) return; busy = true;
    const s = stageScale(st), ir = inner.getBoundingClientRect();
    const toStage = rc => ({ x: (rc.left + rc.width / 2 - ir.left) / s, y: (rc.top + rc.height / 2 - ir.top) / s });
    const p0 = toStage(file.getBoundingClientRect()), p1 = toStage(avatar.getBoundingClientRect());
    const ghost = file.cloneNode(true); ghost.className = 'file ghost-file'; inner.appendChild(ghost);
    file.style.opacity = '.25'; cursor.classList.add('show'); hand.classList.add('press'); r.reset(); r.expr('wide'); ai.hide();
    const place = p => {
      cursor.style.left = p.x + 'px'; cursor.style.top = p.y + 'px'; ghost.style.left = (p.x - 34) + 'px'; ghost.style.top = (p.y - 24) + 'px';
      hand.style.transform = `translate(${clamp((p.x - p0.x) * .3, -55, 55)}px, ${clamp((p.y - p0.y) * .18, -24, 18)}px)`;
      r.gazeAt(ir.left + p.x * s, ir.top + p.y * s);
    };
    place(p0); Sfx.tick(.2); await sleep(350);
    const dur = 1500, t0 = performance.now();
    await new Promise(res => { const iv = setInterval(() => {
      const t = clamp((performance.now() - t0) / dur, 0, 1), e = t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      place({ x: p0.x + (p1.x - p0.x) * e, y: p0.y + (p1.y - p0.y) * e - Math.sin(Math.PI * e) * 24 });
      if (t >= 1) { clearInterval(iv); res(); }
    }, 16); });
    await sleep(150); ghost.remove(); cursor.classList.remove('show'); releaseHand(); file.style.opacity = '';
    busy = false; feed(file);
  }
  $$('.file', st).forEach(f => draggable(f, {
    accept: () => !busy, targets: () => [avatar],
    onStart: () => { hand.classList.add('press'); r.reset(); r.expr('wide'); ai.hide(); Sfx.tick(.2); },
    onMove: (x, y, dx, dy) => { r.gazeAt(x, y); moveHand(dx, dy); },
    onDrop: () => feed(f), onEnd: hit => { releaseHand(); if (!hit) { r.look('front'); r.expr(); } },
    onClick: () => autoDrag(f),
  }));
  const reset = () => { $$('.file', st).forEach(f => f.classList.remove('eaten')); r.reset(); ai.hide(); busy = false; };
  $('#dragAuto').addEventListener('click', () => { if (busy) return; const f = $$('.file', st).find(x => !x.classList.contains('eaten')); if (f) autoDrag(f); else { reset(); setTimeout(() => autoDrag($('.file', st)), 300); } });
  $('#dragReset').addEventListener('click', reset);
})();

/* ================= 1b TAP ================= */
(() => {
  const st = $('#st-tap'), r = new Robot($('.robot-host', st)), phone = $('#tapPhone'), scr = $('.phone-screen', phone);
  let state = 'home', busy = false;
  const T = {
    receipt: { ic: 'receipt', col: '#FF8A5C', n: 'Receipt', reply: "<b>Logged</b>$86.40 lunch at Joe's, added to November expenses.", brief: ['Expense logged', '$86.40 · Meals', 'November sheet'], lvl: 'g', say: 'Yum. Receipt logged.' },
    deck: { ic: 'chart', col: '#3D7BFF', n: 'Pitch deck', reply: '<b>3 takeaways</b>$4B market · Pilot in March · Asking $500k', brief: ['Pitch deck', '24 slides, 3 points', 'Sent to your phone'], lvl: 'b', say: '24 slides. 3 takeaways.' },
    voice: { ic: 'audio', col: '#8B6CFF', n: 'Voice memo', reply: '<b>4 to-dos</b>Call Maya · Book a room · Send the deck · Buy coffee', brief: ['Voice memo', '2 min, 4 to-dos', 'Added to your list'], lvl: 'g', say: 'Heard you. 4 to-dos added.' },
    board: { ic: 'board', col: '#22C273', n: 'Whiteboard', reply: '<b>4 tasks created</b>Sprint 12, assigned to the team.', brief: ['Whiteboard', '4 tasks created', 'Assigned to team'], lvl: 'b', say: 'Turned it into 4 tasks.' },
  };
  const head = `<div class="ps-head">${MINI}<div><b>Nibble</b><small>Connected</small></div></div>`;
  function render(v, k) {
    state = v;
    if (v === 'home') scr.innerHTML = `<div class="ps"><div class="ps-time">10:24</div><div class="ps-nfc">${svg('nfc')}</div><div class="ps-msg">Tap me on Nibble's nose</div></div>`;
    if (v === 'pick') {
      scr.innerHTML = `<div class="ps light">${head}<div class="sheet"><h6>Send to Nibble</h6><div class="tiles">${Object.entries(T).map(([key, t]) => `<div class="tile" data-k="${key}">${ic(t.ic, t.col)}${t.n}</div>`).join('')}</div></div></div>`;
      $$('.tile', scr).forEach(el => el.addEventListener('click', e => { e.stopPropagation(); send(el.dataset.k, el); }));
    }
    if (v === 'sending') scr.innerHTML = `<div class="ps light">${head}<div class="ring"><span style="color:${T[k].col}">${svg(T[k].ic)}</span></div><div class="ps-pct">0%</div><div class="ps-sub">Sending to Nibble</div></div>`;
    if (v === 'waiting') scr.innerHTML = `<div class="ps light">${head}<div style="height:14px"></div><div class="ps-sub" style="text-align:left">Nibble is on it</div><div class="typing"><i></i><i></i><i></i></div></div>`;
    if (v === 'reply') {
      scr.innerHTML = `<div class="ps light">${head}<div style="height:8px"></div><div class="bubble-in">${T[k].reply}</div><div class="ps-link">Send another</div></div>`;
      $('.ps-link', scr).addEventListener('click', e => { e.stopPropagation(); if (!busy) { Sfx.pop(); r.reset(); render('pick'); } });
    }
  }
  async function connect() {
    if (busy || state !== 'home') return; busy = true;
    phone.classList.remove('buzz'); void phone.offsetWidth; phone.classList.add('buzz');
    r.reset(); r.ripple(); Sfx.ding(); r.look('right'); r.expr('wide'); r.led('listen'); r.say('Oh, hi! What do you have?', 2400);
    await sleep(500); render('pick'); busy = false;
  }
  async function send(k, tile) {
    if (busy) return; busy = true;
    tile.style.transform = 'scale(1.15)'; Sfx.pop(); await sleep(250); render('sending', k);
    const ring = $('.ring', scr), pct = $('.ps-pct', scr);
    r.look('right'); r.expr('wide'); r.mouth('open'); r.led('think');
    await stream($('.ring span', scr), r.mouthEl, svg(T[k].ic), { count: 14, dur: 1500, color: T[k].col, onProgress: p => { ring.style.setProperty('--p', Math.round(p * 100)); pct.textContent = Math.round(p * 100) + '%'; } });
    Sfx.chomp(); r.mouth('chew'); await sleep(450);
    render('waiting'); r.mouth(); r.look('front'); r.expr('squint'); r.led('think'); r.say('Hmm...', 1200); Sfx.chew(1300); await sleep(1400);
    r.look('right'); r.expr('happy'); r.mouth('open');
    await stream(r.mouthEl, scr, svg('spark'), { count: 10, dur: 1000, arc: -90, color: '#22C273' });
    render('reply', k); Sfx.ding(); phone.classList.remove('buzz'); void phone.offsetWidth; phone.classList.add('buzz');
    r.celebrate(T[k].brief, T[k].lvl, T[k].say); trick('tap'); busy = false;
  }
  draggable(phone, {
    accept: () => state === 'home' && !busy, targets: () => [r.nfcEl, r.bodyEl], onDrop: () => connect(),
    onClick: async () => { if (state !== 'home' || busy) return; phone.animate([{ transform: 'none' }, { transform: 'translate(-118px,40px) rotate(-12deg)' }, { transform: 'none' }], { duration: 900, easing: 'ease-in-out' }); await sleep(430); connect(); },
  });
  $('#tapReset').addEventListener('click', () => { if (busy) return; r.reset(); render('home'); });
  render('home');
})();

/* ================= 1c SNAP ================= */
(() => {
  const st = $('#st-show'), r = new Robot($('.robot-host', st), { nfc: false }), vf = $('#vf'), slot = $('.vf-slot', vf);
  const screen = $('.laptop-screen', st), ai = new AIWin(screen, 'ChatGPT');
  let busy = false;
  const D = {
    receipt: { ai: 'ChatGPT', ask: 'Add to my expenses', steps: ['Total: $32.40', 'Category: Meals'], title: 'Logged to Expenses.xlsx', line: "Row 14 · Joe's Pizza · $32.40", brief: ['Expense logged', '$32.40 · Meals', 'Row 14'], lvl: 'g', say: 'Logged to your expenses.' },
    invoice: { ai: 'Claude', ask: 'Audit this invoice', steps: ['Matches PO #4471', 'No duplicate payment', 'Totals add up'], title: 'Audit passed', line: 'Invoice #8812 is ready to pay', brief: ['Audit passed', 'Invoice #8812 · $1,280', 'Matches PO #4471'], lvl: 'g', say: 'Audit done. All good.' },
    board: { ai: 'Claude', ask: 'Turn this into tasks', steps: ['Found 4 tasks', 'Assigning owners'], title: 'Created 4 tasks', line: 'Login · API · Tests · Docs', brief: ['4 tasks created', 'Sprint 12', 'Assigned to the team'], lvl: 'b', say: 'Your sketch is now 4 tasks.' },
  };
  async function place(p) {
    if (busy || p.classList.contains('done')) return; busy = true;
    const d = D[p.dataset.kind]; r.reset(); ai.hide();
    const copy = p.cloneNode(true); copy.classList.remove('done', 'inuse'); copy.style.opacity = '';
    slot.innerHTML = ''; slot.appendChild(copy); p.classList.add('inuse'); vf.classList.add('filled'); Sfx.pop();
    r.look('right'); r.expr('focus'); r.led('listen'); r.say('Hold still...', 1900);
    await sleep(450); vf.classList.add('focus');
    for (const n of ['3', '2', '1']) { const c = document.createElement('div'); c.className = 'vf-count'; c.textContent = n; vf.appendChild(c); Sfx.beep(); await sleep(380); c.remove(); }
    await r.snap(st); await sleep(200); vf.classList.remove('focus');
    await fly(vf, screen, `<span style="color:#fff">${svg('camera')}</span>`, { dur: 650, size: 34, arc: -40 });
    slot.innerHTML = ''; vf.classList.remove('filled'); p.classList.remove('inuse'); p.classList.add('done');
    r.look('screen'); r.led('think'); r.expr('focus');
    ai.reset(); ai.show(d.ai); ai.user(`<span class="aw-chip">photo.jpg</span>${d.ask}`);
    await ai.think('Reading the photo...', 1100); await ai.steps(d.steps, 600); ai.done(d.title, d.line); await sleep(700);
    r.celebrate(d.brief, d.lvl, d.say); trick('snap'); busy = false;
  }
  $$('.pp', st).forEach(p => draggable(p, {
    accept: () => !busy && !p.classList.contains('done'), targets: () => [vf],
    onStart: () => { r.reset(); r.expr('wide'); Sfx.tick(.2); }, onMove: (x, y) => r.gazeAt(x, y),
    onDrop: () => place(p), onEnd: hit => { if (!hit) { r.look('front'); r.expr(); } },
    onClick: async () => { if (busy || p.classList.contains('done')) return; await fly(p, vf, `<span style="color:#888">${svg(p.dataset.kind === 'board' ? 'board' : 'receipt')}</span>`, { dur: 500, size: 36, arc: -30 }); place(p); },
  }));
  $('#showReset').addEventListener('click', () => { if (busy) return; $$('.pp', st).forEach(p => p.classList.remove('done', 'inuse')); r.reset(); ai.hide(); });
})();

/* ================= 2 MORNING ================= */
(() => {
  const st = $('#st-morning'), r = new Robot($('.robot-host', st), { nfc: false }), ai = new AIWin($('.laptop-screen', st), 'Claude');
  const slip = $('#slip'), pencil = $('#pencil'), stamp = $('#stamp'), wrap = $('#slipWrap'), prompt = $('#lv-morning .prompt'), go = $('#morningGo');
  let state = 'asleep', token = 0;
  const TASKS = [['9:30', 'Team standup'], ['11:00', "Review Mia's PR"], ['1:00', 'Lunch with Sam'], ['4:00', 'Send the deck']];
  function reset() {
    token++; state = 'asleep'; r.reset(); r.expr('sleep'); r.led('off'); ai.hide();
    slip.classList.remove('on'); slip.style.maxHeight = '0px'; slip.innerHTML = ''; pencil.classList.remove('show'); stamp.classList.remove('on');
    setPrompt(prompt, 'Nibble is asleep. Tap it to start your day.'); go.disabled = false;
  }
  const grow = () => { slip.style.maxHeight = slip.scrollHeight + 30 + 'px'; };
  async function run() {
    if (state !== 'asleep') return; state = 'running'; go.disabled = true; const my = token;
    const alive = () => my === token;
    Sfx.yawn(); r.expr('squint'); r.mouth('yawn'); await sleep(1100); if (!alive()) return;
    r.mouth(); r.stretch(); r.expr('happy'); r.led('listen'); r.say('Good morning!', 1600); await sleep(1400); if (!alive()) return;
    setPrompt(prompt, 'Planning your day...');
    r.look('screen'); r.led('think'); r.expr('focus'); ai.reset(); ai.show('Claude'); ai.user('Plan my day');
    await ai.steps(['Calendar: 3 events', 'Inbox: 12 new', 'Picked your top 4'], 600); if (!alive()) return;
    ai.done('Day planned', 'Printing it now'); await sleep(500);
    r.look('front'); r.expr('happy'); r.mouth('smile'); r.say("Here's your day.", 1600); setPrompt(prompt, 'Printing...');
    r.paper.classList.add('out'); slip.classList.add('on');
    const addLine = async (html, cls = '') => { const d = document.createElement('div'); d.className = cls; d.innerHTML = html; slip.appendChild(d); grow(); Sfx.print(380); await sleep(420); return d; };
    await addLine('TODAY', 'sh'); await addLine('Thursday, Nov 20', 'sd'); await addLine('', 'rule');
    const rows = [];
    for (const [t, n] of TASKS) { if (!alive()) return; rows.push(await addLine(`<span class="sbox"></span><span class="st"><b>${t}</b>${n}</span><span class="strike"></span>`, 'srow')); }
    await addLine('', 'rule'); await addLine('4 things. You got this.', 'sfoot');
    r.paper.classList.remove('out'); r.mouth(); await sleep(500); if (!alive()) return;
    setPrompt(prompt, 'Now watch your day get done.');
    for (const row of rows) {
      if (!alive()) return;
      const name = $('.st', row).lastChild.textContent;
      r.look('screen'); r.led('think'); r.expr('focus'); ai.reset(); ai.user(name); await sleep(700); ai.done('Done', name); await sleep(300);
      r.look('right'); r.expr('happy');
      const y = slip.offsetTop + row.offsetTop + row.offsetHeight / 2, x0 = slip.offsetLeft + 32, x1 = slip.offsetLeft + slip.offsetWidth - 10;
      pencil.style.transition = 'left .45s ease, top .45s ease, opacity .3s'; pencil.style.left = x0 + 'px'; pencil.style.top = (y - 12) + 'px'; pencil.classList.add('show');
      await sleep(480); if (!alive()) return;
      pencil.style.transition = 'left .55s ease-in-out, top .45s ease, opacity .3s'; pencil.style.left = x1 + 'px'; row.classList.add('done'); Sfx.scratch();
      await sleep(600); Sfx.pop(); await sleep(250);
    }
    pencil.classList.remove('show'); await sleep(300);
    stamp.classList.add('on'); Sfx.stamp(); await sleep(300);
    r.celebrate(null, null, 'All done. What a day!'); r.led('party'); ai.hide();
    setPrompt(prompt, 'Four tasks. Zero tabs open.'); state = 'done'; go.disabled = false; trick('plan');
  }
  r.el.addEventListener('click', () => { if (state === 'asleep') run(); else if (state === 'done') { r.hop(); Sfx.pop(); r.say('Same time tomorrow?', 1800); } });
  go.addEventListener('click', () => { if (state === 'done') { reset(); setTimeout(run, 300); } else run(); });
  $('#morningReset').addEventListener('click', reset);
  reset();
})();

/* ================= 3 DECIDE ================= */
(() => {
  const st = $('#st-decide'), r = new Robot($('.robot-host', st), { nfc: false }), ai = new AIWin($('.laptop-screen', st));
  const hint = $('#patHint'), chip = $('#undoChip'), tray = $('#decideTray'), prompt = $('#decidePrompt');
  let pending = null, undoTimer = null, undoLeft = 0, starting = false, lastApprove = 0;
  const stopUndo = () => { clearInterval(undoTimer); undoTimer = null; chip.classList.remove('show'); };
  async function start() {
    if (starting) return; starting = true; const lvl = tabVal.risk;
    stopUndo(); pending = null; r.reset(); tray.innerHTML = ''; hint.classList.remove('show');
    setPrompt(prompt, lvl === 'y' ? "Your agent wants to send an email. Pat Nibble's head to approve." : 'A $1,280 payment. Press and hold Nibble\'s head for 3 seconds.');
    r.look('screen'); r.led('think'); r.expr('focus'); ai.reset(); ai.show(lvl === 'y' ? 'Claude' : 'ChatGPT');
    if (lvl === 'y') { ai.user('Email the expenses to finance'); await ai.think('Drafting the email...', 1000); ai.wait('Waiting for a pat on Nibble', 'To finance@ · Nov_expenses.xlsx'); }
    else { ai.user('Pay invoice #8812'); await ai.think('Preparing the payment...', 1000); ai.wait('Waiting for a 3-second hold', '$1,280.00 to Acme Supply'); }
    r.look('front'); r.expr('wide'); r.led('need'); r.el.classList.add('ask'); Sfx.alert();
    if (lvl === 'y') { r.brief(['Send email', 'To finance (3 people)', 'Nov_expenses.xlsx'], 'y'); r.say('Pat my head to send it.', 0); }
    else { r.brief(['Payment', '$1,280 to Acme Supply', 'First-time payee'], 'r'); r.say('Big one. Hold my head for 3 seconds.', 0); }
    $('span', hint).textContent = lvl === 'y' ? 'pat' : 'hold'; hint.classList.add('show'); pending = lvl; starting = false;
  }
  function approve(lvl) {
    lastApprove = performance.now(); pending = null; hint.classList.remove('show'); r.el.classList.remove('ask', 'holding'); r.setRing(0); r.unbrief();
    r.expr('happy'); r.mouth('smile'); r.led('done'); r.nod(); Sfx.success(); trick('approve');
    if (lvl === 'y') {
      ai.done('Email sent', 'to finance@ · just now'); r.say('Sent! Pat my back within 10s to undo.', 4000);
      setPrompt(prompt, 'Sent. Changed your mind? Pat its back to undo.');
      undoLeft = 10; $('span', chip).textContent = undoLeft; chip.classList.add('show');
      undoTimer = setInterval(() => { undoLeft--; $('span', chip).textContent = undoLeft; if (undoLeft <= 0) stopUndo(); }, 1000);
    } else {
      ai.done('Payment sent', '$1,280.00 to Acme Supply'); r.say("Phew. Paid. Here's your receipt.", 3500);
      setPrompt(prompt, 'Paid, with a receipt to keep.');
      printReceipt(r, tray, ['DECISION RECEIPT', '------------------', 'PAID $1,280.00', 'To: Acme Supply', 'Invoice #8812', 'Approved: 3s hold', new Date().toLocaleDateString()]);
    }
  }
  function reject() {
    pending = null; hint.classList.remove('show'); r.el.classList.remove('ask', 'holding'); r.setRing(0); r.unbrief();
    r.look('right'); r.expr('sad'); r.mouth('flat'); Sfx.error(); ai.err('Cancelled', 'Nothing was sent.');
    r.say("Okay, okay. I won't do it.", 2600); setPrompt(prompt, 'Pushed away. Nothing happened.');
    setTimeout(() => { r.look('front'); r.expr(); r.mouth(); r.led('idle'); }, 1600);
  }
  function undo() {
    if (!undoTimer) return; stopUndo(); r.expr('wide'); r.led('need'); r.recoil(); Sfx.whoosh();
    ai.err('Email recalled', 'It never left your outbox.'); r.say('Unsent! It never left.', 2600); setPrompt(prompt, 'Undone. Like it never happened.');
    setTimeout(() => { r.expr(); r.led('idle'); }, 1500);
  }
  let down = null, iv = null, done = false;
  r.el.addEventListener('pointerdown', e => {
    if (!pending) return; e.preventDefault(); try { r.el.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    down = { x: e.clientX, t: performance.now() }; done = false; hint.classList.remove('show');
    if (pending === 'r') {
      r.el.classList.add('holding'); r.expr('tense'); let lastTick = 0; clearInterval(iv);
      iv = setInterval(() => {
        if (!down || done) { clearInterval(iv); return; }
        const p = (performance.now() - down.t) / 3000; r.setRing(p);
        if (p - lastTick > .2) { lastTick = p; Sfx.tick(p); }
        r.say(`Keep holding... ${Math.min(3, Math.floor(p * 3) + 1)}`, 0);
        if (p >= 1) { done = true; clearInterval(iv); approve('r'); }
      }, 30);
    } else r.expr('happy');
  });
  r.el.addEventListener('pointermove', e => {
    if (!down || done || !pending) return; const dx = e.clientX - down.x;
    if (Math.abs(dx) > 6) r.vars(clamp(dx * .6, -40, 40), 0, clamp(dx * .1, -8, 8), clamp(dx * .2, -15, 15), 0);
    if (Math.abs(dx) > 60) { done = true; clearInterval(iv); reject(); }
  });
  const end = e => {
    if (!down) return; const dx = e.clientX - down.x; clearInterval(iv); const lvl = pending; down = null;
    if (done || !lvl) return; r.look('front');
    if (lvl === 'y' && Math.abs(dx) < 14) approve('y');
    else if (lvl === 'r') { r.el.classList.remove('holding'); r.setRing(0); r.expr('wide'); hint.classList.add('show'); r.say('Not long enough. Hold for 3 seconds.', 0); Sfx.error(); }
    else { hint.classList.add('show'); r.expr('wide'); }
  };
  r.el.addEventListener('pointerup', end); r.el.addEventListener('pointercancel', end);
  r.bodyEl.addEventListener('click', () => { if (!pending && performance.now() - lastApprove > 600) undo(); });
  chip.addEventListener('click', undo);
  $('.tabs[data-tabs="risk"]').addEventListener('tabchange', start);
  $('#decideAgain').addEventListener('click', start);
  new IntersectionObserver((es, ob) => { if (es[0].isIntersecting) { start(); ob.disconnect(); } }, { threshold: .45 }).observe(st);
})();

/* ================= 4 OFFICE ================= */
function personSVG({ shirt, hair, skin, style }) {
  const back = style === 'long' ? `<path d="M34 42 Q30 12 60 12 Q90 12 86 42 L88 84 Q78 90 72 80 L48 80 Q42 90 32 84Z" fill="${hair}"/>` : '';
  const front = style === 'long'
    ? `<path d="M37 40 Q38 16 60 16 Q82 16 83 40 Q76 26 62 26 Q54 32 40 34Z" fill="${hair}"/>`
    : `<path d="M36 40 Q34 14 60 14 Q86 14 84 38 Q80 26 70 25 Q60 30 46 28 Q40 32 36 40Z" fill="${hair}"/>`;
  return `<svg viewBox="0 0 120 240">
    <ellipse cx="60" cy="236" rx="40" ry="5" fill="rgba(0,0,0,.12)"/>
    <rect x="40" y="148" width="17" height="86" rx="8" fill="#2E3445"/><rect x="63" y="148" width="17" height="86" rx="8" fill="#2E3445"/>
    <ellipse cx="47" cy="234" rx="12" ry="5" fill="#1C1F28"/><ellipse cx="73" cy="234" rx="12" ry="5" fill="#1C1F28"/>
    ${back}
    <rect x="30" y="70" width="60" height="92" rx="24" fill="${shirt}"/>
    <path d="M50 72 L60 84 L70 72" fill="none" stroke="rgba(0,0,0,.15)" stroke-width="3" stroke-linecap="round"/>
    <rect x="53" y="56" width="14" height="18" rx="6" fill="${skin}"/>
    <circle cx="60" cy="40" r="23" fill="${skin}"/>
    ${front}
    <circle cx="52" cy="42" r="2.7" fill="#2a2522"/><circle cx="68" cy="42" r="2.7" fill="#2a2522"/>
    <circle cx="46" cy="49" r="3.8" fill="#FF9E8A" opacity=".45"/><circle cx="74" cy="49" r="3.8" fill="#FF9E8A" opacity=".45"/>
    <path class="m-norm" d="M54 52 Q60 55 66 52" stroke="#7a3b2a" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    <path class="m-happy" d="M52 50 Q60 60 68 50 Z" fill="#7a3b2a"/>
    <g class="vib" stroke="#FF6B3D" stroke-width="2.5" stroke-linecap="round"><path d="M16 120 l-7 -4 M15 130 l-8 0 M16 140 l-7 4"/></g>
    <g class="arm-l"><rect x="22" y="76" width="14" height="62" rx="7" fill="${shirt}"/><circle cx="29" cy="139" r="7.5" fill="${skin}"/></g>
    <g class="arm-r"><rect x="84" y="76" width="14" height="62" rx="7" fill="${shirt}"/><circle cx="91" cy="139" r="7.5" fill="${skin}"/>
      <g class="cup"><rect x="81" y="126" width="21" height="23" rx="4" fill="#fff" stroke="#D9CFC2" stroke-width="1.5"/><rect x="81" y="132" width="21" height="7" fill="#C98A5B"/>
      <g class="steam" stroke="#B9B2A8" stroke-width="1.8" fill="none" stroke-linecap="round"><path d="M87 121 q-3 -4 0 -8"/><path d="M95 121 q-3 -4 0 -8"/></g></g></g>
  </svg>`;
}
(() => {
  const st = $('#st-office'), inner = $('.stage-inner', st), r = new Robot($('.robot-host', st)), prompt = $('#officePrompt');
  const cal = $('#calPanel'), rec = $('#officeReceipt'), go = $('#officeGo'), clockEl = $('#officeClock');
  const mk = (id, opts, flip) => {
    const el = $('#' + id);
    el.innerHTML = `<div class="pbubble"></div>${personSVG(opts)}<span class="name">${opts.name}</span>`;
    if (flip) $('svg', el).style.transform = 'scaleX(-1)';
    $('.cup', el).style.transformOrigin = '91px 139px';
    return { el, phone: $('#' + id + 'Phone'), name: opts.name, flip };
  };
  const mia = mk('mia', { name: 'Mia', shirt: '#FF8A5C', hair: '#3B2A22', skin: '#F2C7A5', style: 'long' });
  const sam = mk('sam', { name: 'Sam', shirt: '#5B8DEF', hair: '#1F1A17', skin: '#C98F67', style: 'short' }, true);
  let token = 0, busy = false;
  const alive = my => my === token;
  const pSay = (p, text, ms = 1800) => { const b = $('.pbubble', p.el); b.textContent = text; b.classList.add('show'); Sfx.pop(); setTimeout(() => b.classList.remove('show'), ms); };
  const pocket = p => { const rc = p.el.getBoundingClientRect(); return { left: rc.left + rc.width * (p.flip ? .75 : .25) - 4, top: rc.top + rc.height * .55, width: 8, height: 8 }; };
  const phoneOut = (p, html) => { p.el.classList.add('phone-out'); p.phone.querySelector('.op-screen').innerHTML = html; p.phone.classList.add('show'); Sfx.pop(); };
  const phoneIn = p => { p.el.classList.remove('phone-out'); p.phone.classList.remove('show'); };
  const buzz = async p => { p.el.classList.add('buzz'); Sfx.vibrate(); await sleep(650); p.el.classList.remove('buzz'); };
  const app = `<div class="op-app">${MINI}Nibble</div>`;
  const card = (icon, color, big, lines, btn, act, ghost) => `<div class="op">${app}<div class="op-card"><span class="ic" style="background:${color}">${svg(icon)}</span><span class="big">${big}</span>${lines.map(l => `<span>${l}</span>`).join('')}</div>${btn ? `<button class="op-btn" data-act="${act}">${btn}</button>` : ''}${ghost ? `<button class="op-btn ghost">${ghost}</button>` : ''}</div>`;
  const ok = (text, sub) => `<div class="op"><div class="op-ok"><span class="ck">${svg('check')}</span>${text}<span style="font-weight:600;color:#888;font-size:9.5px">${sub || ''}</span></div></div>`;
  function setClock(h, m) { $('.hh', clockEl).style.transform = `rotate(${(h % 12) * 30 + m * .5}deg)`; $('.mh', clockEl).style.transform = `rotate(${m * 6}deg)`; }
  async function spinClock(fromH, fromM, toH, toM, ms = 1500) {
    const a = fromH * 60 + fromM, b = toH * 60 + toM, t0 = performance.now();
    await new Promise(res => { const iv = setInterval(() => { const t = clamp((performance.now() - t0) / ms, 0, 1), v = a + (b - a) * t; setClock(Math.floor(v / 60), v % 60); if (Math.random() < .3) Sfx.clockTick(); if (t >= 1) { clearInterval(iv); res(); } }, 40); });
  }
  /* calendar */
  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], TIMES = ['10a', '11a', '1p', '2p', '3p'];
  const MB = [[0, 1, 2], [3, 4], [0, 1], [0, 2], [1, 3]], SB = [[3, 4], [0, 1, 2], [2, 3, 4], [1, 3], [0, 2, 4]];
  function buildCal() {
    let h = `<div class="cal-top">${ic('calendar')}Finding a time<span class="who"><span class="m">Mia</span><span class="s">Sam</span></span></div><div class="cal-grid"><span></span>${DAYS.map(d => `<span class="hd">${d}</span>`).join('')}`;
    TIMES.forEach((t, ri) => { h += `<span class="tm">${t}</span>`; DAYS.forEach((d, di) => { h += `<span class="cell" data-d="${di}" data-r="${ri}"><b class="m"></b><b class="s"></b></span>`; }); });
    cal.innerHTML = h + '</div>';
  }
  const cell = (d, rr) => $(`.cell[data-d="${d}"][data-r="${rr}"]`, cal);
  function setGo(label, show = true) { $('span', go).textContent = label; go.style.display = show ? '' : 'none'; go.disabled = false; }

  function reset() {
    token++; busy = false; const mode = tabVal.office;
    r.reset(); cal.classList.remove('show'); buildCal(); rec.classList.remove('show', 'glow'); rec.style.opacity = '';
    [mia, sam].forEach(p => { phoneIn(p); p.el.classList.remove('happy', 'buzz', 'walk', 'gone', 'sip'); p.el.style.transition = 'none'; p.el.style.transform = ''; });
    void st.offsetWidth; [mia, sam].forEach(p => { p.el.style.transition = ''; });
    setClock(10, 40);
    if (mode === 'time') { setPrompt(prompt, 'Mia and Sam want to grab coffee this week.'); setGo('Ask Nibble to find a time'); }
    if (mode === 'split') { rec.classList.add('show', 'glow'); setPrompt(prompt, 'Mia paid $23.40 for both coffees. Drag the receipt to Nibble.'); setGo('Split it'); }
    if (mode === 'msg') {
      sam.el.style.transition = 'none'; sam.el.style.transform = 'translateX(240px)'; sam.el.classList.add('gone'); setClock(9, 40);
      phoneOut(mia, card('doc', '#FF6B3D', 'Launch_deck.pdf', ['For Sam', '"Review before 3"'], 'Leave it with Nibble', 'leave'));
      setPrompt(prompt, 'Mia is heading out. She leaves Sam a file.'); setGo('Leave it with Nibble');
    }
  }

  /* FIND A TIME */
  const confirmed = new Set();
  async function runTime() {
    if (busy) return; busy = true; const my = token; go.style.display = 'none'; confirmed.clear();
    pSay(mia, 'Coffee this week?', 1800); await sleep(1000); if (!alive(my)) return;
    pSay(sam, 'Nibble, find us a time!', 1800); await sleep(900); if (!alive(my)) return;
    r.led('listen'); r.nod(); r.say('On it. Checking calendars.', 1800); await sleep(1100);
    r.look('up'); r.led('think'); r.expr('focus'); cal.classList.add('show'); Sfx.whoosh(); setPrompt(prompt, 'Nibble is checking both calendars...');
    await sleep(500);
    for (let d = 0; d < 5; d++) {
      if (!alive(my)) return;
      r.vars(-26 + d * 13, 14, 0, -12 + d * 6, -8);
      for (let rr = 0; rr < 5; rr++) { const c = cell(d, rr); c.classList.add('scan'); if (MB[d].includes(rr)) $('b.m', c).classList.add('on'); if (SB[d].includes(rr)) $('b.s', c).classList.add('on'); }
      Sfx.tick(d / 5); await sleep(430);
      for (let rr = 0; rr < 5; rr++) cell(d, rr).classList.remove('scan');
    }
    const slot = cell(3, 4); slot.classList.add('slot'); Sfx.ding();
    r.look('front'); r.expr('wide'); r.brief(['Thu 3:00 PM', 'Both free', 'Booking it...'], 'g'); r.say('Found one! Thursday at 3.', 2200); await sleep(1500); if (!alive(my)) return;
    slot.classList.add('booked'); slot.innerHTML = 'Coffee'; Sfx.pop();
    r.expr('happy'); r.mouth('open'); setPrompt(prompt, 'Booked. Sending invites...');
    await Promise.all([stream(r.mouthEl, pocket(mia), svg('mail'), { count: 8, dur: 950, arc: -70 }), stream(r.mouthEl, pocket(sam), svg('mail'), { count: 8, dur: 950, arc: -70, color: '#3D7BFF' })]);
    if (!alive(my)) return; r.mouth(); await Promise.all([buzz(mia), buzz(sam)]); if (!alive(my)) return;
    phoneOut(mia, card('calendar', '#22C273', 'Coffee chat', ['Thu · 3:00 PM', 'with Sam'], 'Confirm', 'conf'));
    await sleep(250); phoneOut(sam, card('calendar', '#22C273', 'Coffee chat', ['Thu · 3:00 PM', 'with Mia'], 'Confirm', 'conf'));
    setPrompt(prompt, 'Both phones buzzed. Tap Confirm on each phone.');
  }
  async function confirm(p) {
    if (confirmed.has(p)) return; confirmed.add(p);
    p.phone.querySelector('.op-screen').innerHTML = ok('Confirmed', 'Thu 3:00 PM'); p.el.classList.add('happy'); Sfx.success();
    pSay(p, p === mia ? 'Done!' : 'See you there!', 1400);
    if (confirmed.size === 2) {
      await sleep(700); const s = cell(3, 4); s.innerHTML = 'Booked';
      r.celebrate(['Coffee chat', 'Thu 3:00 PM', 'Both confirmed'], 'g', 'Booked. Enjoy your coffee!'); r.led('party');
      mia.el.classList.add('sip'); sam.el.classList.add('sip'); setTimeout(() => { mia.el.classList.remove('sip'); sam.el.classList.remove('sip'); }, 1400);
      setPrompt(prompt, 'Booked in two taps. No back-and-forth.'); trick('time'); setGo('Again'); busy = false;
    }
  }

  /* SPLIT */
  async function runSplit() {
    if (busy) return; busy = true; const my = token; go.style.display = 'none';
    rec.classList.remove('glow'); rec.style.opacity = '0';
    await r.snap(st); r.led('think'); r.expr('focus'); r.look('down'); setPrompt(prompt, 'Reading the receipt...'); await sleep(800); if (!alive(my)) return;
    r.look('front'); r.brief(['Coffee for 2', '$23.40 split 2 ways', '$11.70 each'], 'g'); r.say('$11.70 each. Asking Sam.', 2200); Sfx.pop(); await sleep(1000); if (!alive(my)) return;
    r.look('right'); r.mouth('open');
    await stream(r.mouthEl, pocket(sam), svg('coins'), { count: 8, dur: 900, arc: -70, color: '#F2B21B' }); if (!alive(my)) return;
    r.mouth(); await buzz(sam); if (!alive(my)) return;
    phoneOut(sam, card('coins', '#F2B21B', '$11.70', ['Mia requests', 'for coffee'], 'Pay $11.70', 'pay'));
    setPrompt(prompt, "Sam's phone buzzed. Tap Pay.");
  }
  async function pay() {
    const my = token; sam.phone.querySelector('.op-screen').innerHTML = ok('Paid $11.70', 'to Mia'); Sfx.success(); sam.el.classList.add('happy');
    for (let i = 0; i < 6; i++) { fly(sam.phone, pocket(mia), COIN, { dur: 750, arc: -90 - i * 8 }); setTimeout(() => Sfx.coin(), 650); await sleep(110); }
    await sleep(800); if (!alive(my)) return; await buzz(mia);
    phoneOut(mia, ok('+$11.70', 'from Sam')); mia.el.classList.add('happy'); pSay(mia, 'Thanks, Sam!', 1500);
    r.celebrate(['Bill split', 'Mia got $11.70', 'Nobody owes anybody'], 'g', 'Square! Nobody owes anybody.');
    setPrompt(prompt, 'Settled before the coffee got cold.'); trick('split'); setGo('Again'); busy = false;
  }
  draggable(rec, {
    accept: () => !busy && tabVal.office === 'split', targets: () => [r.headEl],
    onStart: () => { r.expr('wide'); Sfx.tick(.2); }, onMove: (x, y) => r.gazeAt(x, y),
    onDrop: () => runSplit(), onEnd: hit => { if (!hit) { r.look('front'); r.expr(); } },
    onClick: async () => { if (busy) return; await fly(rec, r.headEl, `<span style="color:#888">${svg('receipt')}</span>`, { dur: 550, size: 36 }); runSplit(); },
  });

  /* LEAVE A MESSAGE */
  async function runLeave() {
    if (busy) return; busy = true; const my = token; go.style.display = 'none';
    mia.phone.animate([{ transform: 'none' }, { transform: 'translate(70px,10px) rotate(8deg)' }, { transform: 'none' }], { duration: 800, easing: 'ease-in-out' });
    await sleep(380); r.ripple(); Sfx.ding(); r.look('left'); r.expr('wide');
    r.mouth('open'); await stream(mia.phone, r.mouthEl, svg('doc'), { count: 10, dur: 1000, arc: -60 }); if (!alive(my)) return;
    Sfx.chomp(); r.mouth(); r.hat(BOX_HAT); r.expr('happy'); r.say("Got it. I'll hold it for Sam.", 2200);
    mia.phone.querySelector('.op-screen').innerHTML = ok('Left with Nibble', 'for Sam'); await sleep(1300); if (!alive(my)) return;
    phoneIn(mia); pSay(mia, 'Thanks, Nibble!', 1200); await sleep(900);
    mia.el.classList.add('walk'); mia.el.style.transform = 'translateX(-240px)'; Sfx.steps(4); await sleep(1150); mia.el.classList.add('gone'); mia.el.classList.remove('walk');
    if (!alive(my)) return;
    setPrompt(prompt, 'Later that afternoon...'); r.look('front'); r.expr('sleep'); r.led('idle');
    await spinClock(9, 40, 14, 55, 1600); if (!alive(my)) return;
    sam.el.style.transition = ''; void sam.el.offsetWidth;
    sam.el.classList.remove('gone'); sam.el.classList.add('walk'); sam.el.style.transform = 'translateX(0)'; Sfx.steps(4); await sleep(1150); sam.el.classList.remove('walk');
    if (!alive(my)) return;
    r.expr('wide'); r.look('right'); await sleep(300); r.expr('happy'); r.wave(); Sfx.ding(); r.say('Sam! Mia left you something.', 2400);
    await sleep(900); await buzz(sam); if (!alive(my)) return;
    phoneOut(sam, card('box', '#E9B872', 'A file for you', ['Nibble is holding it', 'from Mia'], 'Receive', 'recv'));
    setPrompt(prompt, "Tap Receive on Sam's phone.");
  }
  async function receive() {
    const my = token; r.hat(null); r.mouth('open');
    await stream(r.hatEl, sam.phone, svg('doc'), { count: 10, dur: 900, arc: -60, color: '#3D7BFF' }); if (!alive(my)) return;
    r.mouth('smile'); Sfx.ding();
    sam.phone.querySelector('.op-screen').innerHTML = card('doc', '#FF6B3D', 'Launch_deck.pdf', ['from Mia', '"Review before 3"'], 'Open', 'open');
    setPrompt(prompt, 'Tap Open.');
  }
  function opened() {
    sam.phone.querySelector('.op-screen').innerHTML = ok('Opened', 'Launch_deck.pdf'); sam.el.classList.add('happy'); pSay(sam, 'Thanks, Mia!', 1500);
    r.celebrate(null, null, 'Delivered. Your tiny office mailroom.'); setPrompt(prompt, 'Delivered, even though they never crossed paths.'); trick('message'); setGo('Again'); busy = false;
  }
  /* phone buttons */
  [mia, sam].forEach(p => p.phone.addEventListener('click', e => {
    const b = e.target.closest('.op-btn'); if (!b) return; const act = b.dataset.act; if (!act) { Sfx.pop(); return; }
    if (act === 'conf') confirm(p); if (act === 'pay') pay(); if (act === 'leave') runLeave(); if (act === 'recv') receive(); if (act === 'open') opened();
  }));
  go.addEventListener('click', async () => {
    if ($('span', go).textContent === 'Again') { reset(); return; }
    const m = tabVal.office;
    if (m === 'time') runTime();
    if (m === 'split') { if (busy) return; await fly(rec, r.headEl, `<span style="color:#888">${svg('receipt')}</span>`, { dur: 550, size: 36 }); runSplit(); }
    if (m === 'msg') runLeave();
  });
  $('#officeReset').addEventListener('click', reset);
  $('.tabs[data-tabs="office"]').addEventListener('tabchange', reset);
  reset();
})();

/* ================= DAY FILM ================= */
(() => {
  const st = $('#st-day'), r = new Robot($('.robot-host', st), { nfc: false }), ai = new AIWin($('.laptop-screen', st));
  const win = $('#dayWin'), sun = $('#daySun'), stars = $('.d-stars', win), timeEl = $('#dayTime'), cap = $('#dayCap'), tray = $('#dayTray');
  const track = $('#dayTrack'), fill = $('#dayFill'), play = $('#dayPlay');
  const H0 = 8, H1 = 19.5;
  let token = 0, cur = 8, running = false;
  const SKY = [[7, '#FFD3A5', '#FFE9D2', '#9AA6BF'], [9.5, '#BFE3FF', '#FFF1DC', '#7E90AE'], [12.5, '#8CC8FF', '#D8EEFF', '#7387A6'], [16, '#A9C9FF', '#FFE1C2', '#7A86A0'], [18, '#FF9E7A', '#FFD29A', '#5D5B78'], [19, '#5B4A8A', '#C27BA0', '#3C3A5C'], [20, '#1E2350', '#3A3A70', '#262B4A']];
  const hx = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
  const mix = (a, b, t) => '#' + hx(a).map((v, i) => Math.round(v + (hx(b)[i] - v) * t).toString(16).padStart(2, '0')).join('');
  function setTime(h) {
    cur = h; let i = 0; while (i < SKY.length - 2 && h > SKY[i + 1][0]) i++;
    const A = SKY[i], B = SKY[i + 1], t = clamp((h - A[0]) / (B[0] - A[0]), 0, 1);
    win.style.background = `linear-gradient(${mix(A[1], B[1], t)},${mix(A[2], B[2], t)})`; win.style.setProperty('--city', mix(A[3], B[3], t));
    const night = h > 18.9;
    sun.classList.toggle('moon', night); stars.style.opacity = night ? 1 : 0;
    if (night) { sun.style.left = '78%'; sun.style.top = '26%'; }
    else { const p = clamp((h - 7) / 12, 0, 1); sun.style.left = (8 + p * 84) + '%'; sun.style.top = (80 - Math.sin(Math.PI * p) * 62) + '%'; }
    const hh = Math.floor(h), mm = Math.round((h - hh) * 60) % 60, h12 = ((hh + 11) % 12) + 1;
    timeEl.textContent = `${h12}:${String(mm).padStart(2, '0')} ${hh < 12 ? 'AM' : 'PM'}`;
    fill.style.width = clamp((h - H0) / (H1 - H0), 0, 1) * 100 + '%';
  }
  const below = () => stagePoint(st, 415, 420);
  const M = [
    { h: 8.83, cap: 'Good morning. Your day, printed.', run: async () => {
      ai.hide(); r.reset(); r.expr('sleep'); r.led('off'); await sleep(700); Sfx.yawn(); r.mouth('yawn'); await sleep(900);
      r.mouth('smile'); r.expr('happy'); r.led('listen'); r.say('Morning!', 1500);
      await printReceipt(r, tray, ['TODAY', '----------------', '[ ] Ship the fix', '[ ] Lunch with Sam', '[ ] Client email', '[ ] Coffee with Mia']);
    } },
    { h: 10.5, cap: 'Your agent ships the fix. Nibble cheers.', run: async () => {
      r.reset(); r.look('screen'); r.led('think'); r.expr('focus'); ai.reset(); ai.show('Claude Code'); ai.user('Fix the checkout bug');
      await ai.steps(['Editing 2 files', 'Tests pass'], 600); ai.done('Shipped', 'v2.4.1 is live'); await sleep(400);
      r.celebrate(['Fix shipped', 'All tests pass', 'v2.4.1 is live'], 'g', 'Shipped!');
    } },
    { h: 12.25, cap: 'Lunch for two. Split in a tap.', run: async () => {
      ai.hide(); r.reset(); r.emoji(COIN.replace('20px;height:20px', '1em;height:1em')); for (let i = 0; i < 3; i++) { Sfx.coin(); await sleep(250); }
      await sleep(400); r.emoji(null); r.brief(['Lunch for two', '$34.80 split', 'Sam paid you back'], 'g'); r.say('Sam paid you back.', 2400); r.hop();
    } },
    { h: 14.67, cap: 'A big email? Pat to approve.', run: async () => {
      r.reset(); ai.show('Claude'); ai.reset(); ai.user('Send the proposal to the client'); ai.wait('Waiting for a pat', 'to client@');
      r.led('need'); r.expr('wide'); r.el.classList.add('ask'); r.brief(['Send proposal', 'To the client', 'Needs your OK'], 'y'); r.say('Pat my head to send.', 0); Sfx.alert();
      await sleep(1600); await fly(below(), r.headEl, `<span style="color:var(--accent)">${svg('hand')}</span>`, { dur: 650, arc: 0, size: 40 }); Sfx.pop();
      r.el.classList.remove('ask'); r.unbrief(); r.nod(); r.expr('happy'); r.led('done'); ai.done('Sent', 'to client@'); r.say('Sent!', 1800); Sfx.success();
    } },
    { h: 16, cap: 'Coffee with Mia? Booked.', run: async () => {
      ai.hide(); r.reset(); r.look('up'); r.led('think'); r.emoji('calendar'); for (let i = 0; i < 4; i++) { Sfx.tick(i / 4); await sleep(220); }
      r.emoji(null); r.look('front'); r.brief(['Coffee with Mia', 'Thu 4:00 PM', 'Both confirmed'], 'b'); r.say('Coffee with Mia, booked.', 2400); r.hop(); Sfx.success();
    } },
    { h: 18.5, cap: 'Goodnight. See you tomorrow.', run: async () => {
      ai.hide(); r.reset(); r.expr('happy'); r.say("Great day. Here's your recap.", 2200);
      await printReceipt(r, tray, ['RECAP', '----------------', '[x] Ship the fix', '[x] Lunch with Sam', '[x] Client email', '[x] Coffee with Mia']);
      await sleep(800); r.expr('sleep'); r.led('off');
    } },
  ];
  track.insertAdjacentHTML('beforeend', M.map((m, i) => {
    const hh = Math.floor(m.h), mm = Math.round((m.h - hh) * 60), h12 = ((hh + 11) % 12) + 1;
    return `<button class="mk" data-i="${i}" style="left:${(m.h - H0) / (H1 - H0) * 100}%" aria-label="Jump to ${h12}:${String(mm).padStart(2, '0')}"><span>${h12}:${String(mm).padStart(2, '0')}</span></button>`;
  }).join(''));
  async function travel(to, ms, my) {
    const from = cur, t0 = performance.now();
    await new Promise(res => { const iv = setInterval(() => { if (my !== token) { clearInterval(iv); res(); return; } const t = clamp((performance.now() - t0) / ms, 0, 1); setTime(from + (to - from) * t); if (t >= 1) { clearInterval(iv); res(); } }, 30); });
  }
  async function moment(i, my) {
    $$('.mk', track).forEach((b, j) => b.classList.toggle('on', j <= i));
    cap.textContent = M[i].cap; cap.classList.add('show'); await M[i].run();
  }
  async function playAll() {
    const my = ++token; running = true; play.disabled = true; tray.innerHTML = ''; setTime(8); $$('.mk', track).forEach(b => b.classList.remove('on'));
    for (let i = 0; i < M.length; i++) { if (my !== token) return; await travel(M[i].h, 1300, my); if (my !== token) return; await moment(i, my); await sleep(1400); }
    await travel(H1, 900, my); running = false; play.disabled = false;
  }
  play.addEventListener('click', () => { if (!running) playAll(); });
  $$('.mk', track).forEach(b => b.addEventListener('click', async () => {
    const my = ++token; running = true; play.disabled = true; const i = +b.dataset.i;
    await travel(M[i].h, 700, my); if (my !== token) return; await moment(i, my); if (my === token) { running = false; play.disabled = false; }
  }));
  setTime(8); r.expr('sleep'); r.led('off');
  new IntersectionObserver((es, ob) => { if (es[0].isIntersecting) { setTimeout(() => { if (!running) playAll(); }, 400); ob.disconnect(); } }, { threshold: .6 }).observe(st);
})();

/* ================= MEET ================= */
(() => {
  const host = document.createElement('div'); host.className = 'robot-host'; $('#meetRobot').appendChild(host);
  const r = new Robot(host), stage = $('#meetStage'), parts = $('#parts');
  const POS = { eyes: [99, 94], head: [136, -4], face: [196, 132], led: [136, 258], nose: [232, 304], printer: [100, 326] };
  const ACT = {
    eyes: async () => { r.reset(); Sfx.shutter(); flash(stage); r.expr('squint'); await sleep(250); r.expr('happy'); r.say('Snap! I can read that.', 2000); },
    head: () => { r.reset(); r.expr('happy'); r.mouth('smile'); r.nod(); Sfx.success(); r.say('Approved!', 1800); },
    face: () => { r.reset(); r.brief(['Send to client', '3 recipients', 'Needs a pat'], 'y'); r.led('need'); Sfx.alert(); },
    led: async () => { r.reset(); for (const m of ['think', 'need', 'done', 'party']) { r.led(m); Sfx.tick(.5); await sleep(700); } },
    nose: () => { r.reset(); r.ripple(); Sfx.ding(); r.expr('wide'); r.say('Tap! Got your file.', 2000); },
    printer: async () => { r.reset(); r.expr('happy'); r.say('Printing...', 1600); await r.printStrip(1600); },
  };
  const go = k => { $$('.hs', stage).forEach(h => h.classList.toggle('on', h.dataset.part === k)); $$('li', parts).forEach(l => l.classList.toggle('on', l.dataset.part === k)); ACT[k](); };
  Object.entries(POS).forEach(([k, [x, y]]) => {
    const b = document.createElement('button'); b.className = 'hs'; b.dataset.part = k; b.style.left = x + 'px'; b.style.top = y + 'px'; b.setAttribute('aria-label', k);
    b.addEventListener('click', e => { e.stopPropagation(); go(k); }); $('#meetRobot').appendChild(b);
  });
  $$('li', parts).forEach(l => l.addEventListener('click', () => go(l.dataset.part)));
  window.addEventListener('pointermove', e => { const rc = stage.getBoundingClientRect(); if (rc.bottom < 0 || rc.top > innerHeight || r.el.classList.contains('briefing')) return; r.gazeAt(e.clientX, e.clientY); });
})();
