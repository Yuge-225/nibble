/* Nibble — interactive product page (v4) */
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const sleep = ms => new Promise(r => setTimeout(r, ms));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const easeIO = t => (t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const hx = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
const mixHex = (a, b, t) => '#' + hx(a).map((v, i) => Math.round(v + (hx(b)[i] - v) * t).toString(16).padStart(2, '0')).join('');
const money = n => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/* ================= ICONS (hand-drawn SVG, no emoji) ================= */
const P = {
  doc: '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5"/><path d="M10 13h6M10 17h6"/>',
  audio: '<path d="M4 10v4M8 7v10M12 4v16M16 8v8M20 11v2"/>',
  chart: '<path d="M4 20h16"/><rect x="6" y="11" width="3" height="7" rx="1"/><rect x="11" y="7" width="3" height="11" rx="1"/><rect x="16" y="13" width="3" height="5" rx="1"/>',
  receipt: '<path d="M6 3h12v18l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5L6 21z"/><path d="M9 8h6M9 12h6M9 16h3"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M3 10h18M8 3v4M16 3v4"/><path d="M8 14h2M12 14h2M8 17h2"/>',
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
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',
  list: '<path d="M10 6h10M10 12h10M10 18h10"/><path d="M3.5 6l1.5 1.5L7.5 5M3.5 12l1.5 1.5 2.5-2.5M3.5 18l1.5 1.5 2.5-2.5"/>',
  up: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
  printer: '<path d="M7 9V3h10v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M7 14h10v7H7z"/>',
  clip: '<path d="M20 11.5l-8 8a5 5 0 0 1-7-7l8.5-8.5a3.3 3.3 0 0 1 4.7 4.7L9.7 17.2a1.7 1.7 0 0 1-2.4-2.4L15 7"/>',
  send: '<path d="M21 3L10 14"/><path d="M21 3l-7 18-4-7-7-4z"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  cup: '<path d="M5 9h11v5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5z"/><path d="M16 10h1.5a2.5 2.5 0 0 1 0 5H16"/><path d="M8 3.5v3M11.5 3.5v3"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  light: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
  face: '<rect x="3" y="5" width="18" height="14" rx="4"/><path d="M8.5 10v2M15.5 10v2"/><path d="M9.5 15.5c1.5 1 3.5 1 5 0"/>',
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
  tap() { this.tone(1700, .03, 'square', .025); this.noise(.02, .06, 0, 2400); },
  thwack() { this.noise(.08, .3, 0, 260, 'lowpass'); this.tone(150, .12, 'sine', .09); },
  chime() { [784, 988, 1319, 1568].forEach((f, i) => this.tone(f, .22, 'sine', .055, i * .07)); },
  cash() { this.noise(.05, .1, 0, 3000, 'highpass'); this.tone(2093, .15, 'triangle', .05, .05); this.tone(2637, .32, 'triangle', .05, .13); },
  notify() { this.tone(1046, .1, 'sine', .07); this.tone(1568, .2, 'sine', .07, .1); },
  click() { this.noise(.025, .25, 0, 1800); this.tone(600, .04, 'square', .03); },
};
$('#soundBtn').addEventListener('click', e => {
  Sfx.on = !Sfx.on; const b = e.currentTarget;
  b.setAttribute('aria-pressed', Sfx.on); b.querySelector('i').innerHTML = svg(Sfx.on ? 'sound' : 'mute'); if (Sfx.on) Sfx.pop();
});

/* ================= HELPERS ================= */
const rectOf = x => (x.getBoundingClientRect ? x.getBoundingClientRect() : x);
const center = r => ({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
function tween(ms, fn, ease = easeIO) {
  return new Promise(res => {
    const t0 = performance.now();
    const iv = setInterval(() => { const t = clamp((performance.now() - t0) / ms, 0, 1); fn(ease(t), t); if (t >= 1) { clearInterval(iv); res(); } }, 16);
  });
}
async function fly(from, to, html, { dur = 700, size = 28, arc = -70 } = {}) {
  const a = center(rectOf(from)), b = center(rectOf(to));
  const f = document.createElement('div');
  f.className = 'flyer'; f.style.fontSize = size + 'px'; f.innerHTML = `<div style="transform:translate(-50%,-50%)">${html}</div>`; document.body.appendChild(f);
  const c = { x: (a.x + b.x) / 2, y: Math.min(a.y, b.y) + arc };
  await tween(dur, e => {
    const u = 1 - e, x = u * u * a.x + 2 * u * e * c.x + e * e * b.x, y = u * u * a.y + 2 * u * e * c.y + e * e * b.y;
    f.style.transform = `translate(${x}px,${y}px) scale(${1 + .2 * Math.sin(Math.PI * e) - .5 * e})`;
  });
  f.remove();
}
async function stream(from, to, iconHTML, { count = 12, dur = 1300, arc = -110, color = '#FF6B3D', onProgress, size = 30 } = {}) {
  const a = center(rectOf(from)), b = center(rectOf(to));
  const c = { x: (a.x + b.x) / 2, y: Math.min(a.y, b.y) + arc };
  const pt = t => ({ x: (1 - t) * (1 - t) * a.x + 2 * (1 - t) * t * c.x + t * t * b.x, y: (1 - t) * (1 - t) * a.y + 2 * (1 - t) * t * c.y + t * t * b.y });
  const dots = [];
  for (let i = 0; i < count; i++) { const d = document.createElement('div'); d.className = 'dot'; d.style.background = color; d.style.boxShadow = `0 0 8px ${color}`; d.style.opacity = 0; document.body.appendChild(d); dots.push(d); }
  const f = document.createElement('div'); f.className = 'flyer'; f.style.fontSize = size + 'px'; f.style.color = color;
  f.innerHTML = `<div style="transform:translate(-50%,-50%)">${iconHTML}</div>`; document.body.appendChild(f);
  let k = 0; const bl = setInterval(() => Sfx.blip(k++ % 8), 90);
  await tween(dur, (e, t) => {
    const p = pt(e); f.style.transform = `translate(${p.x}px,${p.y}px) scale(${1 + .5 * Math.sin(Math.PI * e) - .45 * e})`;
    dots.forEach((d, i) => { const lt = clamp((t - i * .25 / count) / .75, 0, 1), q = pt(easeIO(lt)); d.style.opacity = lt > 0 && lt < 1 ? 1 : 0; d.style.transform = `translate(${q.x}px,${q.y}px) scale(${.6 + Math.sin(Math.PI * lt)})`; });
    onProgress && onProgress(t);
  }, t => t);
  clearInterval(bl); onProgress && onProgress(1);
  dots.forEach(d => d.remove()); f.remove();
}
/* stage coordinates */
const stageScale = st => $('.stage-inner', st).getBoundingClientRect().width / 680;
function toStage(st, el) {
  const ir = $('.stage-inner', st).getBoundingClientRect(), s = ir.width / 680, r = rectOf(el);
  return { x: (r.left - ir.left) / s, y: (r.top - ir.top) / s, w: r.width / s, h: r.height / s, cx: (r.left + r.width / 2 - ir.left) / s, cy: (r.top + r.height / 2 - ir.top) / s };
}
function stagePoint(stage, x, y) { const r = $('.stage-inner', stage).getBoundingClientRect(), s = r.width / 680; return { left: r.left + x * s, top: r.top + y * s, width: 0, height: 0 }; }
function flash(stage) {
  const inner = stage.classList.contains('stage') ? stage : ($('.stage-inner', stage) || stage);
  let f = $(':scope > .flash', inner); if (!f) { f = document.createElement('div'); f.className = 'flash'; inner.appendChild(f); }
  f.classList.remove('go'); void f.offsetWidth; f.classList.add('go');
}
function setPrompt(el, text) { el.innerHTML = `<span class="pulse"></span>${text}`; }
function bump(el, val) { el.textContent = val; el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
function trail(inner, p, kind, color) {
  const d = document.createElement('i'); d.className = 'trail t-' + kind;
  d.style.left = p.x + 'px'; d.style.top = p.y + 'px'; d.style.setProperty('--c', color); d.style.setProperty('--r', (Math.random() * 70 - 35) + 'deg');
  inner.appendChild(d); setTimeout(() => d.remove(), 800);
}
/* move an element (inside the stage) along an arc, leaving a trail */
async function flight(st, el, a, b, { dur = 1000, arc = -120, kind = 'dot', color = '#FF6B3D', spin = 0, scale = [1, 1], onStep, ease } = {}) {
  const inner = $('.stage-inner', st); if (!el.parentNode) inner.appendChild(el);
  el.classList.add('flying');
  const c = { x: (a.x + b.x) / 2, y: Math.min(a.y, b.y) + arc }; let last = -1;
  await tween(dur, e => {
    const u = 1 - e, x = u * u * a.x + 2 * u * e * c.x + e * e * b.x, y = u * u * a.y + 2 * u * e * c.y + e * e * b.y;
    const sc = scale[0] + (scale[1] - scale[0]) * e + .25 * Math.sin(Math.PI * e);
    el.style.transform = `translate(${x}px,${y}px) translate(-50%,-50%) rotate(${spin * Math.sin(Math.PI * e)}deg) scale(${sc})`;
    const k = Math.floor(e * 16); if (kind && k !== last) { last = k; trail(inner, { x, y }, kind, color); }
    onStep && onStep(x, y, e);
  }, ease);
}
/* dashed live link between two things in a stage */
function beam(st, a, b, color = '#4D8BFF') {
  const inner = $('.stage-inner', st), A = toStage(st, a), B = toStage(st, b);
  const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('class', 'beam'); s.setAttribute('viewBox', '0 0 680 400');
  s.innerHTML = `<path d="M${A.cx} ${A.cy} Q${(A.cx + B.cx) / 2} ${Math.min(A.cy, B.cy) - 50} ${B.cx} ${B.cy}" stroke="${color}"/>`;
  inner.appendChild(s); return () => s.remove();
}

function draggable(el, { targets = () => [], onDrop, onClick, onMove, onStart, onEnd, accept = () => true }) {
  el.addEventListener('pointerdown', e => {
    if (e.button !== 0 || !accept()) return;
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
      else { ghost.style.transition = 'left .25s ease-out, top .25s ease-out'; ghost.style.left = r.left + 'px'; ghost.style.top = r.top + 'px'; setTimeout(() => ghost.remove(), 270); }
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
  const s = Math.min(1.25, st.clientWidth / 680), h = (400 * s) + 'px', inn = $('.stage-inner', st);
  inn.style.transform = `scale(${s})`; inn.style.left = Math.max(0, (st.clientWidth - 680 * s) / 2) + 'px'; if (st.style.height !== h) st.style.height = h;
}
const ro = new ResizeObserver(es => es.forEach(e => setTimeout(() => fitStage(e.target), 0)));
$$('.stage').forEach(st => { fitStage(st); ro.observe(st); });

/* ================= ART ================= */
const HAND_SVG = `<svg viewBox="0 0 90 124">
  <ellipse cx="45" cy="38" rx="21" ry="31" fill="#F4F5F7" stroke="#BFC5CF" stroke-width="2"/>
  <line x1="45" y1="8" x2="45" y2="27" stroke="#BFC5CF" stroke-width="2"/>
  <path d="M24 56 Q22 34 31 29 Q37 27 39 34 L40 23 Q42 15 47 16 Q52 17 52 25 L53 28 Q56 22 61 24 Q66 27 64 36 L63 41 Q68 39 70 45 Q72 53 66 63 Q62 73 62 86 L62 124 L28 124 L28 88 Q22 74 24 56 Z" fill="#F2C7A5" stroke="#D6A27C" stroke-width="2"/>
  <path d="M26 62 Q13 57 11 47 Q10 41 15 41 Q21 43 27 53" fill="#F2C7A5" stroke="#D6A27C" stroke-width="2"/>
  <rect x="24" y="100" width="42" height="26" rx="6" fill="#3A4152"/></svg>`;
/* a hand coming down from above, palm flat */
const PRESS_HAND = `<svg viewBox="0 0 90 130">
  <rect x="27" y="0" width="38" height="58" rx="8" fill="#5B8DEF"/><rect x="25" y="50" width="42" height="12" rx="5" fill="#4A78D6"/>
  <path d="M22 66 Q22 58 32 58 L62 58 Q72 58 72 68 L72 96 Q72 104 64 104 L28 104 Q20 104 20 96 Z" fill="#F2C7A5" stroke="#D6A27C" stroke-width="2"/>
  <g fill="#F2C7A5" stroke="#D6A27C" stroke-width="2"><rect x="22" y="94" width="11" height="26" rx="5.5"/><rect x="34" y="96" width="11" height="30" rx="5.5"/><rect x="46" y="96" width="11" height="29" rx="5.5"/><rect x="58" y="94" width="11" height="24" rx="5.5"/></g>
  <path d="M72 72 Q86 76 84 88 Q82 94 74 92" fill="#F2C7A5" stroke="#D6A27C" stroke-width="2"/></svg>`;
const PENCIL_SVG = '<svg viewBox="0 0 120 24"><polygon points="0,12 18,4 18,20" fill="#F3D2A2"/><polygon points="0,12 7,9 7,15" fill="#333"/><rect x="18" y="4" width="78" height="16" fill="#FFC93C"/><rect x="18" y="4" width="78" height="5" fill="#FFD866"/><rect x="96" y="4" width="10" height="16" fill="#C9CED6"/><rect x="106" y="4" width="12" height="16" rx="4" fill="#FF8FA3"/></svg>';
$$('.pencil').forEach(p => { p.innerHTML = PENCIL_SVG; });
const ENVELOPE = '<svg viewBox="0 0 44 32"><rect x="2" y="2" width="40" height="28" rx="4" fill="#fff" stroke="#3D7BFF" stroke-width="2.5"/><path d="M3.5 4.5L22 18 40.5 4.5" fill="none" stroke="#3D7BFF" stroke-width="2.5" stroke-linejoin="round"/></svg>';
const SHOP_SVG = `<svg viewBox="0 0 136 150"><rect x="12" y="44" width="112" height="104" fill="#FFF6EA" stroke="#2B303B" stroke-width="3"/>
  ${[0, 1, 2, 3, 4, 5].map(i => `<path d="M${8 + i * 20} 26h20v18a10 10 0 0 1-20 0z" fill="${i % 2 ? '#fff' : '#FF6B3D'}" stroke="#2B303B" stroke-width="2.5"/>`).join('')}
  <rect x="30" y="4" width="76" height="20" rx="5" fill="#2B303B"/><text x="68" y="19" text-anchor="middle" font-size="13" font-weight="800" fill="#fff" font-family="Inter,sans-serif" letter-spacing="1.5">ACME</text>
  <rect x="22" y="68" width="30" height="26" rx="3" fill="#BFD9FF" stroke="#2B303B" stroke-width="2.5"/><rect x="84" y="68" width="30" height="26" rx="3" fill="#BFD9FF" stroke="#2B303B" stroke-width="2.5"/>
  <rect x="54" y="92" width="28" height="56" rx="3" fill="#7FB0FF" stroke="#2B303B" stroke-width="2.5"/><circle cx="76" cy="122" r="2.5" fill="#2B303B"/></svg>`;
const BOX_HAT = `<svg viewBox="0 0 48 48"><path d="M6 16l18-9 18 9v18l-18 9-18-9z" fill="#E9B872" stroke="#B9874A" stroke-width="2" stroke-linejoin="round"/><path d="M6 16l18 9 18-9M24 25v18" stroke="#B9874A" stroke-width="2" fill="none"/><path d="M15 11.5l18 9" stroke="#FF6B3D" stroke-width="4"/></svg>`;
const COIN = '<span style="display:block;width:20px;height:20px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#FFE38A,#F2B21B);border:2px solid #C98C0A"></span>';
const MINI = '<span class="mini-face"><i></i><i></i></span>';
const docCard = (icon, col) => `<div class="dcard" style="--c:${col}"><b>${svg(icon)}</b><i></i><i></i><i></i></div>`;

/* people */
const PEOPLE = {
  mia: { name: 'Mia', shirt: '#FF8A5C', hair: '#3B2A22', skin: '#F2C7A5', style: 'long' },
  sam: { name: 'Sam', shirt: '#5B8DEF', hair: '#1F1A17', skin: '#C98F67', style: 'short' },
  leo: { name: 'Leo', shirt: '#22C273', hair: '#8A5A33', skin: '#F0C09A', style: 'short' },
  ava: { name: 'Ava', shirt: '#8B6CFF', hair: '#2A1C16', skin: '#9A6446', style: 'long' },
  kai: { name: 'Kai', shirt: '#FFC93C', hair: '#3A3A3A', skin: '#E2AE86', style: 'short' },
  alex: { name: 'Alex', shirt: '#3D7BFF', hair: '#4A3426', skin: '#EFC3A0', style: 'short' },
};
function avatar(k) {
  const p = PEOPLE[k];
  const back = p.style === 'long' ? `<path d="M10.5 22 Q9.5 7.5 20 7.5 Q30.5 7.5 29.5 22 L30.5 33 L9.5 33Z" fill="${p.hair}"/>` : '';
  const top = p.style === 'long'
    ? `<path d="M12.3 17.5 Q12.6 9.6 20 9.6 Q27.4 9.6 27.7 17.5 Q24.5 12.6 20.5 13 Q16 13.8 12.3 17.5Z" fill="${p.hair}"/>`
    : `<path d="M12 17 Q11.6 8.6 20 8.6 Q28.4 8.6 28 16.5 Q26 12.2 22.6 12.6 Q18 13.6 14.2 13 Q12.6 14.6 12 17Z" fill="${p.hair}"/>`;
  return `<span class="av" title="${p.name}"><svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="20" fill="${mixHex(p.shirt, '#ffffff', .72)}"/>${back}<path d="M5 40 Q6.5 27.5 20 27.5 Q33.5 27.5 35 40Z" fill="${p.shirt}"/><circle cx="20" cy="18.5" r="8" fill="${p.skin}"/>${top}<circle cx="17" cy="19.5" r="1" fill="#2a2522"/><circle cx="23" cy="19.5" r="1" fill="#2a2522"/></svg></span>`;
}
function personSVG({ shirt, hair, skin, style, cup = true }) {
  const back = style === 'long' ? `<path d="M34 42 Q30 12 60 12 Q90 12 86 42 L88 84 Q78 90 72 80 L48 80 Q42 90 32 84Z" fill="${hair}"/>` : '';
  const front = style === 'long'
    ? `<path d="M37 40 Q38 16 60 16 Q82 16 83 40 Q76 26 62 26 Q54 32 40 34Z" fill="${hair}"/>`
    : `<path d="M36 40 Q34 14 60 14 Q86 14 84 38 Q80 26 70 25 Q60 30 46 28 Q40 32 36 40Z" fill="${hair}"/>`;
  const cupG = cup ? `<g class="cup"><rect x="81" y="126" width="21" height="23" rx="4" fill="#fff" stroke="#D9CFC2" stroke-width="1.5"/><rect x="81" y="132" width="21" height="7" fill="#C98A5B"/>
      <g class="steam" stroke="#B9B2A8" stroke-width="1.8" fill="none" stroke-linecap="round"><path d="M87 121 q-3 -4 0 -8"/><path d="M95 121 q-3 -4 0 -8"/></g></g>` : '';
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
    <g class="arm-r"><rect x="84" y="76" width="14" height="62" rx="7" fill="${shirt}"/><circle cx="91" cy="139" r="7.5" fill="${skin}"/>${cupG}</g>
  </svg>`;
}

/* face glyphs: big, simple pictures for Nibble's screen (138 x 93) */
const EYE = '#6FF3D3';
const GF = 'font-family="Bricolage Grotesque,Inter,sans-serif" font-weight="800"';
const gw = s => `<svg class="gl" viewBox="0 0 138 93">${s}</svg>`;
const gIcon = (name, x, y, k, color = EYE, sw = 1.7) => `<g transform="translate(${x},${y}) scale(${k})" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${P[name]}</g>`;
const gBadge = (x, y, r, fill, t, fs = 24, tc = '#fff') => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/><text x="${x}" y="${y + fs * .35}" text-anchor="middle" font-size="${fs}" fill="${tc}" ${GF}>${t}</text>`;
const gTick = (x, y, r, fill = '#2BD47D') => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/><path d="M${x - r * .45} ${y + r * .02}l${r * .32} ${r * .32} ${r * .6}-${r * .66}" fill="none" stroke="#fff" stroke-width="${r * .22}" stroke-linecap="round" stroke-linejoin="round"/>`;
const G = {
  risk: n => gw(`<g fill="none" stroke="${EYE}" stroke-width="3" stroke-linejoin="round"><path d="M24 12h30l12 12v58H24z"/><path d="M54 12v12h12"/></g><g stroke-width="4.5" stroke-linecap="round"><path d="M32 38h26" stroke="#FF5A5A"/><path d="M32 50h26" stroke="${EYE}" opacity=".4"/><path d="M32 62h26" stroke="#FF5A5A"/><path d="M32 73h16" stroke="#FF5A5A"/></g>${gBadge(102, 46, 23, '#FF5A5A', n, 28)}`),
  todo: n => gw(`<g fill="none" stroke="${EYE}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${[22, 46, 70].map(y => `<rect x="18" y="${y - 8}" width="16" height="16" rx="4"/><path d="M22 ${y} l3.5 3.5 6-7"/><path d="M42 ${y}h28"/>`).join('')}</g>${gBadge(104, 46, 23, '#8B6CFF', n, 28)}`),
  up: t => gw(`<rect x="14" y="60" width="13" height="18" rx="2" fill="${EYE}" opacity=".45"/><rect x="31" y="49" width="13" height="29" rx="2" fill="${EYE}" opacity=".6"/><rect x="48" y="37" width="13" height="41" rx="2" fill="${EYE}" opacity=".8"/><rect x="65" y="20" width="13" height="58" rx="2" fill="#2BD47D"/><text x="110" y="55" text-anchor="middle" font-size="22" fill="#2BD47D" ${GF}>${t}</text>`),
  deck: n => gw(`<rect x="16" y="14" width="64" height="46" rx="5" fill="none" stroke="${EYE}" stroke-width="3"/><path d="M48 60v12M36 76h24" stroke="${EYE}" stroke-width="3" stroke-linecap="round"/><g fill="${EYE}"><circle cx="28" cy="27" r="3"/><circle cx="28" cy="37" r="3"/><circle cx="28" cy="47" r="3"/></g><g stroke="${EYE}" stroke-width="3" stroke-linecap="round" opacity=".6"><path d="M36 27h34M36 37h28M36 47h32"/></g>${gBadge(108, 42, 22, '#FF6B3D', n, 26)}`),
  check: t => gw(`${gTick(32, 46, 21)}<text x="94" y="54" text-anchor="middle" font-size="${t.length > 6 ? 18 : 22}" fill="#fff" ${GF}>${t}</text>`),
  ok: () => gw(gTick(69, 46, 28)),
  ask: icon => gw(`${gIcon(icon, 12, 16, 2.6)}${gBadge(106, 46, 21, '#FFC93C', '?', 28, '#3A2A00')}`),
  count: n => gw(`<text x="69" y="70" text-anchor="middle" font-size="64" fill="#FFC93C" ${GF}>${n}</text>`),
  view: () => gw(`<g class="gl-corners" fill="none" stroke="${EYE}" stroke-width="3.5" stroke-linecap="round"><path d="M28 24v-10h12M110 24v-10H98M28 69v10h12M110 69v10H98"/></g><rect x="55" y="20" width="28" height="53" rx="2" fill="#FFFEFA"/><g stroke="#AAA" stroke-width="2"><path d="M59 29h20M59 36h15M59 43h20M59 50h13"/></g><path d="M59 62h20" stroke="#333" stroke-width="3.5"/><circle cx="120" cy="16" r="4" fill="#FF4D4D"/>`),
  snapped: () => gw(`<rect width="138" height="93" fill="#FFFFFF"/>${gIcon('camera', 45, 22, 2, '#141923', 2)}`),
  coins: () => gw(`${gIcon('coins', 10, 12, 2.7, '#FFC93C')}<text x="106" y="56" text-anchor="middle" font-size="24" fill="#FFC93C" ${GF}>÷2</text>`),
  cal: () => gw(`${gIcon('calendar', 12, 10, 2.8)}${gTick(106, 46, 20)}`),
  mail: () => gw(`${gIcon('mail', 12, 14, 2.7)}${gTick(106, 46, 20)}`),
  box: () => gw(`${gIcon('box', 12, 12, 2.8, '#E9B872')}${gTick(106, 46, 20)}`),
  code: () => gw(`<g fill="none" stroke="${EYE}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="M36 28L18 46l18 18M68 28l18 18-18 18"/></g>${gTick(110, 46, 18)}`),
  read: () => gw(`<g fill="none" stroke="${EYE}" stroke-width="3"><rect x="34" y="16" width="44" height="60" rx="4"/></g><g stroke="${EYE}" stroke-width="3" stroke-linecap="round" opacity=".5"><path d="M42 30h28M42 40h28M42 50h20M42 60h24"/></g><rect class="gl-scan" x="30" y="22" width="52" height="5" rx="2" fill="#4D8BFF"/>`),
};

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
  const tabMap = { drag: ['feed', 'drag'], tap: ['feed', 'tap'], snap: ['feed', 'snap'], time: ['office', 'time'], split: ['office', 'split'], message: ['office', 'msg'], approve: ['risk', tabVal.risk] };
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

/* ================= AI WINDOW (on the laptop) ================= */
class AIWin {
  constructor(screen, name = 'Claude') {
    this.el = document.createElement('div'); this.el.className = 'aiwin';
    this.el.innerHTML = `<div class="aw-bar"><i></i><i></i><i></i><span class="aw-name"></span><span class="aw-fin">${svg('check')}Done</span></div><div class="aw-body"></div>`;
    screen.appendChild(this.el); this.body = $('.aw-body', this.el); this.nameEl = $('.aw-name', this.el); this.setName(name);
  }
  setName(n) { this.nameEl.innerHTML = `${svg('spark')}${n}`; }
  show(n, full) { if (n) this.setName(n); this.el.classList.toggle('full', !!full); this.el.classList.add('show'); }
  hide() { this.el.classList.remove('show'); }
  reset() { this.body.innerHTML = ''; this.el.classList.remove('fin'); }
  finish() { this.el.classList.add('fin'); }
  add(html, cls) { const d = document.createElement('div'); d.className = cls; d.innerHTML = html; this.body.appendChild(d); while (this.body.children.length > 3) this.body.firstChild.remove(); return d; }
  view(html) { const d = document.createElement('div'); d.className = 'aw-view'; d.innerHTML = html; this.body.appendChild(d); return d; }
  user(html) { return this.add(html, 'aw-user'); }
  async think(text, ms = 1200) { const d = this.add(`<span class="aw-spark spin">${svg('spark')}</span><div>${text}<div class="aw-shim"></div><div class="aw-shim s2"></div></div>`, 'aw-ai'); await sleep(ms); d.remove(); }
  async steps(list, per = 650) {
    const d = this.add(`<span class="aw-spark spin">${svg('spark')}</span><div class="aw-steps"></div>`, 'aw-ai'), box = $('.aw-steps', d);
    for (const s of list) { const row = document.createElement('div'); row.className = 'aw-step'; row.innerHTML = `<i class="sk"></i>${s}`; box.appendChild(row); await sleep(per); row.className = 'aw-step ok'; row.innerHTML = `<i class="sk">${svg('check')}</i>${s}`; Sfx.tick(.5); }
    $('.aw-spark', d).classList.remove('spin'); return d;
  }
  done(title, line) { Sfx.pop(); return this.add(`<b>${svg('check')}${title}</b>${line}`, 'aw-done'); }
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
    this.paper = $('.r-paper', host); this.ring = $('.r-ring circle', host); this.camEl = $('.r-cam', host); this.slotEl = $('.r-slot', host);
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
  emoji(name) { if (!name) { this.el.classList.remove('emoji', 'glyph'); return; } this.emojiEl.innerHTML = name.startsWith('<') ? name : svg(name); this.el.classList.add('emoji'); }
  glyph(html) { if (!html) { this.el.classList.remove('emoji', 'glyph'); return; } this.emojiEl.innerHTML = html; this.el.classList.add('emoji', 'glyph'); this.emojiEl.classList.remove('pop'); void this.emojiEl.offsetWidth; this.emojiEl.classList.add('pop'); }
  hat(html) { if (html) { this.hatEl.innerHTML = html; this.el.classList.add('hatted'); } else this.el.classList.remove('hatted'); }
  press(on) { this.el.classList.toggle('pressed', !!on); }
  async move(cls, ms) { const m = this.moveEl; m.classList.remove(cls); void m.offsetWidth; m.classList.add(cls); await sleep(ms); m.classList.remove(cls); }
  hop() { return this.move('hop', 560); } nod() { return this.move('nod', 1000); } shake() { return this.move('shake', 900); }
  recoil() { return this.move('recoil', 700); } wave() { return this.move('wave', 1600); } stretch() { return this.move('stretch', 1400); }
  ripple() { const n = this.nfcEl; n.classList.remove('ripple'); void n.offsetWidth; n.classList.add('ripple'); setTimeout(() => n.classList.remove('ripple'), 1400); }
  async chew(ms = 1500) { this.expr('squint'); this.mouth('chew'); this.led('think'); Sfx.chew(ms); await sleep(ms); this.mouth(); this.expr(); }
  async snap(stage) { Sfx.shutter(); flash(stage); this.expr('squint'); await sleep(220); this.expr(); }
  async printStrip(ms = 1600) { this.paper.classList.add('out'); Sfx.print(ms); await sleep(ms); this.paper.classList.remove('out'); }
  setRing(p) { this.ring.style.strokeDashoffset = 560 * (1 - clamp(p, 0, 1)); }
  reset() {
    this.look('front'); this.expr(); this.mouth(); this.led('idle'); this.unbrief(); this.hush(); this.hat(null); this.glyph(null); this.press(false);
    this.el.classList.remove('ask', 'holding', 'cam-on'); this.moveEl.className = 'r-move'; this.setRing(0); this.bodyEl.classList.remove('printing');
  }
  celebrate(lines, lvl, text) {
    this.look('front'); this.led('done'); this.expr('happy'); this.mouth('smile'); this.hop(); Sfx.success();
    if (lines) this.brief(lines, lvl); if (text) this.say(text, 3600);
  }
}

/* ================= PHONE APP (the Nibble app, drawn) ================= */
class PhoneApp {
  constructor(screen) { this.s = screen; this.fx = 64; this.fy = 210; }
  set(html) { this.s.innerHTML = html; paintIcons(this.s); return this.s.firstElementChild; }
  lock(hint = 'Tap on Nibble') { this.set(`<div class="ap lock"><div class="lk-time">10:24</div><div class="lk-date">Thursday, Nov 20</div><div class="lk-nfc">${svg('nfc')}</div><div class="lk-hint">${hint}</div></div>`); }
  async banner() {
    const b = document.createElement('div'); b.className = 'ap-banner';
    b.innerHTML = `<span class="app-ic">${MINI}</span><div><b>Nibble</b><small>Nibble is nearby. Tap to open.</small></div>`;
    this.s.appendChild(b); Sfx.notify(); void b.offsetWidth; b.classList.add('show'); await sleep(700); return b;
  }
  splash(still) { const L = document.createElement('div'); L.className = 'ap-launch' + (still ? ' still' : ''); L.innerHTML = '<div class="lf"><i></i><i></i></div><span>nibble</span>'; this.s.appendChild(L); return L; }
  async launch(render) {
    const f = $('.finger', this.s); if (f) f.classList.remove('show');
    this.splash(); Sfx.chime(); await sleep(1050);
    render(); const a = this.s.firstElementChild; if (a) a.style.animation = 'none'; const L = this.splash(true); void L.offsetWidth; L.classList.add('out'); await sleep(380); L.remove();
  }
  home(user = 'alex', dev = 'Desk Nibble') {
    const tiles = [['send', 'send', '#FF6B3D', 'Send file'], ['snap', 'camera', '#8B6CFF', 'Snap'], ['time', 'calendar', '#22C273', 'Schedule'], ['split', 'coins', '#F2B21B', 'Split bill'], ['leave', 'box', '#C98A5B', 'Leave a file'], ['print', 'printer', '#3D7BFF', 'Print']];
    this.set(`<div class="ap"><div class="ap-top"><div class="ap-hi"><small>Good morning</small><b>${PEOPLE[user].name}</b></div>${avatar(user)}</div>
      <div class="ap-dev"><span class="app-ic">${MINI}</span><div><b>${dev}</b><small><i class="dotg"></i>Connected</small></div></div>
      <div class="ap-grid">${tiles.map(([k, i, c, n]) => `<div class="ap-tile" data-t="${k}"><span class="ti" style="background:${c}">${svg(i)}</span>${n}</div>`).join('')}</div></div>`);
  }
  page(title, body, btn) { this.set(`<div class="ap"><div class="ap-hd"><span class="bk">${svg('back')}</span>${title}</div>${body}${btn ? `<button class="ap-btn">${btn}</button>` : ''}</div>`); }
  async tapOn(target, hold = 0) {
    const el = typeof target === 'string' ? $(target, this.s) : target; if (!el) return;
    const sr = this.s.getBoundingClientRect(), k = this.s.offsetWidth ? sr.width / this.s.offsetWidth : 1, r = el.getBoundingClientRect();
    const x = (r.left + r.width / 2 - sr.left) / k, y = (r.top + r.height / 2 - sr.top) / k;
    let f = $('.finger', this.s);
    if (!f) { f = document.createElement('div'); f.className = 'finger'; f.style.left = this.fx + 'px'; f.style.top = (this.fy + 30) + 'px'; this.s.appendChild(f); void f.offsetWidth; }
    f.classList.add('show'); f.style.left = x + 'px'; f.style.top = y + 'px'; this.fx = x; this.fy = y;
    await sleep(480); f.classList.add('press'); el.classList.add('pressed'); Sfx.tap(); await sleep(220 + hold);
    f.classList.remove('press'); await sleep(140); el.classList.remove('pressed');
  }
}

/* ================= PRINT, PIN, STRIKE ================= */
const planLines = (title, date, tasks, foot) => [
  `<div class="sh">${title}</div>`, `<div class="sd">${date}</div>`, '<div class="rule"></div>',
  ...tasks.map(([t, n]) => `<div class="srow"><span class="sbox"></span><span class="st">${t ? `<b>${t}</b>` : ''}${n}</span><span class="strike"></span></div>`),
  '<div class="rule"></div>', `<div class="sfoot">${foot}</div>`];
function makePaper(st, lines, w, cls = '') {
  const p = document.createElement('div'); p.className = 'pin-paper ' + cls; p.style.width = w + 'px';
  p.innerHTML = '<span class="tape"></span>' + lines.join(''); $('.stage-inner', st).appendChild(p); return p;
}
function pinNow(st, { lines, w = 180, x, y, rot = 2, cls }) {
  const p = makePaper(st, lines, w, cls); p.style.left = x + 'px'; p.style.top = y + 'px'; p.style.transform = `rotate(${rot}deg)`; p.classList.add('pinned');
  const spot = $('.pin-spot', st); if (spot) spot.classList.add('used'); return p;
}
async function printPin(st, robot, { lines, w = 180, x, y, rot = 2, alive = () => true, cls }) {
  const p = makePaper(st, lines, w, cls);
  const slot = toStage(st, robot.slotEl), k = clamp(slot.w * 1.05 / w, .2, .6);
  p.style.left = (slot.cx - w / 2) + 'px'; p.style.top = (slot.cy - 1) + 'px'; p.style.transformOrigin = '50% 0'; p.style.transform = `scale(${k})`;
  const H = p.offsetHeight; p.style.clipPath = `inset(0 0 ${H}px 0)`;
  robot.led('think'); robot.bodyEl.classList.add('printing');
  const rows = [...p.children].filter(c => !c.classList.contains('tape'));
  for (const row of rows) {
    if (!alive()) { p.remove(); return null; }
    const b = row.offsetTop + row.offsetHeight + 5; p.style.clipPath = `inset(0 0 ${Math.max(0, H - b)}px 0)`; Sfx.print(250); await sleep(280);
  }
  p.style.clipPath = 'inset(0 0 0 0)'; robot.bodyEl.classList.remove('printing');
  await sleep(300); if (!alive()) { p.remove(); return null; }
  Sfx.tear(); p.classList.add('torn'); await sleep(220);
  p.style.clipPath = 'none';
  p.style.transition = 'left .85s cubic-bezier(.5,-.25,.25,1.1), top .85s cubic-bezier(.5,-.25,.25,1.1), transform .85s cubic-bezier(.5,-.25,.25,1.1)';
  p.style.left = x + 'px'; p.style.top = y + 'px'; p.style.transform = `rotate(${rot}deg)`; Sfx.whoosh();
  await sleep(870); p.classList.remove('torn'); p.classList.add('pinned'); Sfx.thwack(); robot.led('done');
  const spot = $('.pin-spot', st); if (spot) spot.classList.add('used');
  await sleep(250);
  return p;
}
async function strike(st, pencil, row) {
  if (!row) return;
  const rr = toStage(st, row), y = rr.y + rr.h * .55, x0 = rr.x + 18, x1 = rr.x + rr.w - 2;
  if (!pencil.classList.contains('show')) { pencil.style.transition = 'none'; pencil.style.left = (x0 + 40) + 'px'; pencil.style.top = (y + 30) + 'px'; void pencil.offsetWidth; }
  pencil.style.transition = 'left .4s ease, top .4s ease, opacity .25s'; pencil.style.left = x0 + 'px'; pencil.style.top = (y - 12) + 'px'; pencil.classList.add('show');
  await sleep(430);
  pencil.style.transition = 'left .55s ease-in-out, top .3s, opacity .25s'; pencil.style.left = x1 + 'px'; row.classList.add('done'); Sfx.scratch();
  await sleep(620); Sfx.pop();
}
function stampIt(paper, text = 'ALL DONE') { const s = document.createElement('div'); s.className = 'stamp'; s.textContent = text; paper.appendChild(s); void s.offsetWidth; s.classList.add('on'); Sfx.stamp(); }

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
  const screen = $('.laptop-screen', st), avatarEl = $('.avatar', st), hand = $('#dragHand'), cursor = $('#dragCursor'), guide = $('.drag-guide', st);
  const ai = new AIWin(screen);
  hand.innerHTML = HAND_SVG;
  let busy = false, hideT, greeted = false;

  async function workPdf() {
    const W = [90, 76, 94, 62, 86, 80, 92, 70, 54];
    const v = ai.view(`<div class="wv pdf"><div class="pg">${W.map(w => `<i class="ln" style="width:${w}%"></i>`).join('')}<b class="scan"></b></div><div class="wv-side"><span class="cnt" style="--c:#FF4D4D">0</span><small>risks</small></div></div>`);
    const lns = $$('.ln', v), scan = $('.scan', v), cnt = $('.cnt', v); let n = 0;
    for (let i = 0; i < lns.length; i++) {
      scan.style.top = (lns[i].offsetTop - 4) + 'px'; lns[i].classList.add('read');
      if ([2, 5, 7].includes(i)) { await sleep(130); lns[i].classList.add('hit'); bump(cnt, ++n); Sfx.alert(); await sleep(170); }
      else { Sfx.tick(.2); await sleep(230); }
    }
    scan.style.opacity = 0;
  }
  async function workAudio() {
    const bars = Array.from({ length: 34 }, (_, i) => 18 + Math.round(Math.abs(Math.sin(i * 1.3) * 55 + Math.sin(i * .45) * 25)));
    const who = ['mia', 'sam', 'leo', 'ava', 'kai'], W = [70, 54, 82, 60, 48];
    const v = ai.view(`<div class="wv aud"><div class="wave">${bars.map(h => `<i style="height:${clamp(h, 12, 100)}%"></i>`).join('')}<b class="head"></b></div><div class="aud-low"><div class="todos"></div><div class="wv-side"><span class="cnt" style="--c:#8B6CFF">0</span><small>to-dos</small></div></div></div>`);
    const bs = $$('.wave i', v), head = $('.head', v), todos = $('.todos', v), cnt = $('.cnt', v); let n = 0;
    for (let i = 0; i < bs.length; i++) {
      bs[i].classList.add('on'); head.style.left = ((i + 1) / bs.length * 100) + '%';
      if (i % 7 === 5 && n < 5) { todos.insertAdjacentHTML('beforeend', `<div class="td"><i class="cb"></i><span style="width:${W[n]}%"></span>${avatar(who[n])}</div>`); bump(cnt, ++n); Sfx.pop(); }
      await sleep(64);
    }
  }
  async function workSheet() {
    const H = [36, 48, 42, 58, 54, 88];
    const v = ai.view(`<div class="wv xls"><div class="grid">${'<i></i>'.repeat(36)}</div><div class="bars">${H.map((h, i) => `<i class="${i === 5 ? 'up' : ''}" style="--h:${h}%"></i>`).join('')}</div><span class="chip">${svg('up')}18%</span></div>`);
    const cells = $$('.grid i', v);
    for (let row = 0; row < 6; row++) { for (let c = 0; c < 6; c++) cells[row * 6 + c].classList.add('rd'); Sfx.blip(row); await sleep(180); }
    $('.wv', v).classList.add('chart'); Sfx.whoosh(); await sleep(300);
    const bars = $$('.bars i', v);
    for (let i = 0; i < bars.length; i++) { bars[i].classList.add('grow'); Sfx.tick(i / 6); await sleep(150); }
    await sleep(250); $('.chip', v).classList.add('show'); Sfx.pop(); await sleep(300);
  }
  const D = {
    pdf: { col: '#FF7A6B', ic: 'doc', name: 'Contract.pdf', ask: 'Review this contract', app: 'Claude', work: workPdf, glyph: () => G.risk(3), say: '3 risky clauses. Worth a look.' },
    audio: { col: '#B49CFF', ic: 'audio', name: 'Standup.m4a', ask: 'Turn this into to-dos', app: 'Claude', work: workAudio, glyph: () => G.todo(5), say: '5 to-dos, sent to the team.' },
    sheet: { col: '#5FE0A0', ic: 'chart', name: 'Q3_sales.xlsx', ask: 'Chart this for me', app: 'ChatGPT', work: workSheet, glyph: () => G.up('+18%'), say: 'Sales are up 18%!' },
  };
  /* the file jumps out of the screen and Nibble catches it */
  async function toss(kind) {
    const d = D[kind], a = toStage(st, avatarEl), b = toStage(st, r.mouthEl), ir = inner.getBoundingClientRect(), s = ir.width / 680;
    const f = document.createElement('div'); f.innerHTML = docCard(d.ic, d.col);
    r.expr('wide'); Sfx.whoosh(); let opened = false;
    await flight(st, f, { x: a.cx, y: a.cy }, { x: b.cx, y: b.cy }, {
      dur: 1150, arc: -120, kind, color: d.col, spin: -16, scale: [1.2, .35],
      onStep: (x, y, e) => { r.gazeAt(ir.left + x * s, ir.top + y * s); if (!opened && e > .5) { opened = true; r.mouth('open'); } },
    });
    f.remove();
  }
  async function feed(file) {
    if (busy) return; busy = true; clearTimeout(hideT); guide.classList.add('off');
    const kind = file.dataset.kind, d = D[kind];
    r.reset(); ai.hide(); file.classList.remove('done'); file.classList.add('sent');
    avatarEl.classList.add('chomp'); Sfx.chomp(); await sleep(380); avatarEl.classList.remove('chomp');
    await toss(kind);
    Sfx.chomp(); r.mouth('chew'); r.expr('squint'); r.led('think'); Sfx.chew(800); await sleep(850); r.mouth(); r.expr();
    r.look('screen'); r.expr('focus'); r.led('think');
    const hr = r.headEl.getBoundingClientRect(), unbeam = beam(st, { left: hr.left + hr.width * .1, top: hr.top + hr.height * .55, width: 0, height: 0 }, screen, d.col);
    ai.reset(); ai.show(d.app, true); ai.user(`<span class="aw-chip" style="--c:${d.col}">${svg(d.ic)}${d.name}</span>${d.ask}`); await sleep(650);
    await d.work(); ai.finish(); Sfx.ding(); await sleep(450); unbeam();
    r.look('front'); r.expr('happy'); r.mouth('smile'); r.led('done'); r.glyph(d.glyph()); r.hop(); Sfx.success(); r.say(d.say, 3200);
    file.classList.remove('sent'); file.classList.add('done'); trick('drag'); busy = false;
    hideT = setTimeout(() => { if (!busy) ai.hide(); }, 3400);
  }
  async function autoDrag(file) {
    if (busy) return; busy = true; clearTimeout(hideT); ai.hide(); guide.classList.add('off');
    const s = stageScale(st), ir = inner.getBoundingClientRect();
    const toS = rc => ({ x: (rc.left + rc.width / 2 - ir.left) / s, y: (rc.top + rc.height / 2 - ir.top) / s });
    await sleep(300);
    const p0 = toS(file.getBoundingClientRect()), p1 = toS(avatarEl.getBoundingClientRect());
    const ghost = file.cloneNode(true); ghost.className = 'file ghost-file'; inner.appendChild(ghost);
    file.style.opacity = '.25'; cursor.classList.add('show'); hand.classList.add('press'); r.reset(); r.expr('wide');
    const place = p => {
      cursor.style.left = p.x + 'px'; cursor.style.top = p.y + 'px'; ghost.style.left = (p.x - 34) + 'px'; ghost.style.top = (p.y - 24) + 'px';
      hand.style.transform = `translate(${clamp((p.x - p0.x) * .3, -55, 55)}px, ${clamp((p.y - p0.y) * .18, -24, 18)}px)`;
      r.gazeAt(ir.left + p.x * s, ir.top + p.y * s);
    };
    place(p0); Sfx.tick(.2); await sleep(350);
    await tween(1500, e => place({ x: p0.x + (p1.x - p0.x) * e, y: p0.y + (p1.y - p0.y) * e - Math.sin(Math.PI * e) * 24 }));
    avatarEl.classList.add('drop-hover'); await sleep(200); avatarEl.classList.remove('drop-hover');
    ghost.remove(); cursor.classList.remove('show'); hand.classList.remove('press'); hand.style.transform = ''; file.style.opacity = '';
    busy = false; feed(file);
  }
  $$('.file', st).forEach(f => draggable(f, {
    accept: () => !busy, targets: () => [avatarEl],
    onStart: () => { clearTimeout(hideT); hand.classList.add('press'); r.reset(); r.expr('wide'); ai.hide(); guide.classList.add('off'); Sfx.tick(.2); },
    onMove: (x, y, dx, dy) => { r.gazeAt(x, y); const s = stageScale(st); hand.style.transform = `translate(${clamp(dx / s * .3, -55, 55)}px, ${clamp(dy / s * .18, -24, 18)}px)`; },
    onDrop: () => feed(f), onEnd: hit => { hand.classList.remove('press'); hand.style.transform = ''; if (!hit) { r.look('front'); r.expr(); } },
    onClick: () => autoDrag(f),
  }));
  const reset = () => { if (busy) return; clearTimeout(hideT); $$('.file', st).forEach(f => f.classList.remove('done', 'sent')); r.reset(); ai.hide(); guide.classList.remove('off'); };
  $('#dragAuto').addEventListener('click', () => { if (busy) return; const f = $$('.file', st).find(x => !x.classList.contains('done')); if (f) autoDrag(f); else { reset(); setTimeout(() => autoDrag($('.file', st)), 300); } });
  $('#dragReset').addEventListener('click', reset);
  new IntersectionObserver(es => { if (es[0].isIntersecting && !greeted && !busy) { greeted = true; setTimeout(() => { r.look('screen'); r.say('Feed me a file!', 2400); setTimeout(() => { if (!busy) r.look('front'); }, 2200); }, 500); } }, { threshold: .6 }).observe(st);
})();

/* ================= 1b TAP ================= */
(() => {
  const st = $('#st-tap'), r = new Robot($('.robot-host', st)), phone = $('#tapPhone'), scr = $('.phone-screen', phone), app = new PhoneApp(scr);
  const prompt = $('#tapPrompt'), goBtn = $('#tapGo');
  let state = 'home', busy = false, token = 0;
  const buzz = () => { phone.classList.remove('buzz'); void phone.offsetWidth; phone.classList.add('buzz'); };
  const row = (k, icon, col, name, sub) => `<div class="ap-row" data-k="${k}"><span class="th" style="background:${col}">${svg(icon)}</span><div><b>${name}</b><small>${sub}</small></div><i class="ck">${svg('check')}</i></div>`;
  async function toNose() {
    const a = toStage(st, phone), b = toStage(st, r.nfcEl);
    phone.style.transition = 'transform .5s cubic-bezier(.45,0,.25,1)';
    phone.style.transform = `translate(${b.cx - a.x - 6}px, ${b.cy - a.cy}px) rotate(-12deg)`;
    await sleep(520);
  }
  async function back() { phone.style.transform = ''; await sleep(520); phone.style.transition = ''; }
  async function connect(dragged) {
    if (busy || state !== 'home') return; busy = true; state = 'run'; goBtn.disabled = true;
    const my = ++token, alive = () => my === token;
    if (!dragged) await toNose();
    r.reset(); r.ripple(); Sfx.ding(); buzz(); r.look('right'); r.expr('wide'); r.led('listen'); r.say('Hi! Opening the app for you.', 2000);
    setPrompt(prompt, 'Tapped. The Nibble app opens by itself.');
    await sleep(380); if (!dragged) back();
    const b = await app.banner(); if (!alive()) return;
    await app.tapOn(b); if (!alive()) return;
    await app.launch(() => app.home('alex', 'Desk Nibble')); if (!alive()) return;
    await sleep(450); await app.tapOn('[data-t="send"]'); if (!alive()) return;
    app.page('Send to Nibble', `<div class="ap-sec">Recent</div><div class="ap-list">${row('deck', 'doc', '#FF6B3D', 'Pitch_deck.pdf', '24 slides')}${row('memo', 'audio', '#8B6CFF', 'Voice memo', '2 min')}</div><div class="ap-sec">Ask</div><div class="ap-ask">${svg('spark')}<span>3 takeaways, please</span></div>`, 'Send');
    await sleep(450); await app.tapOn('.ap-row[data-k="deck"]'); if (!alive()) return;
    $('.ap-row[data-k="deck"]', scr).classList.add('sel'); Sfx.tick(.6); await sleep(300);
    await app.tapOn('.ap-btn'); if (!alive()) return;
    setPrompt(prompt, 'Sending the deck to Nibble...');
    app.set(`<div class="ap center"><div class="ap-hd">Sending</div><div class="ring"><span>${svg('doc')}</span></div><div class="ps-pct">0%</div><div class="ps-sub">to Desk Nibble</div></div>`);
    const ring = $('.ring', scr), pct = $('.ps-pct', scr);
    r.mouth('open'); r.expr('wide'); r.led('think');
    await stream($('.ring span', scr), r.mouthEl, svg('doc'), { count: 14, dur: 1500, color: '#FF6B3D', onProgress: p => { ring.style.setProperty('--p', Math.round(p * 100)); pct.textContent = Math.round(p * 100) + '%'; } });
    if (!alive()) return;
    Sfx.chomp(); r.mouth('chew'); r.expr('squint'); Sfx.chew(900); await sleep(900); r.mouth(); if (!alive()) return;
    app.set(`<div class="ap center"><div class="ap-hd">Pitch_deck.pdf</div><div class="ap-think">${MINI}<div class="typing"><i></i><i></i><i></i></div></div><div class="ps-sub">Nibble is reading 24 slides</div></div>`);
    setPrompt(prompt, 'Nibble reads it with your AI...');
    r.look('front'); r.expr(); r.glyph(G.read()); await sleep(1700); if (!alive()) return;
    r.glyph(null); r.look('right'); r.expr('happy'); r.mouth('open');
    await stream(r.mouthEl, scr, svg('spark'), { count: 10, dur: 1000, arc: -90, color: '#22C273' }); if (!alive()) return;
    app.page('3 takeaways', `<div class="ap-file"><span class="th" style="background:#FF6B3D">${svg('doc')}</span>Pitch_deck.pdf</div><div class="tk-list">${[['chart', '#22C273', '$4B market'], ['calendar', '#3D7BFF', 'Pilot in March'], ['coins', '#F2B21B', 'Raising $500k']].map(([i, c, t], n) => `<div class="tk" style="animation-delay:${n * .2}s"><span class="ti" style="background:${c}">${svg(i)}</span><b>${t}</b></div>`).join('')}</div>`);
    buzz(); Sfx.ding();
    r.look('front'); r.mouth('smile'); r.led('done'); r.glyph(G.deck(3)); r.hop(); Sfx.success(); r.say('3 takeaways. On your phone.', 3000);
    setPrompt(prompt, 'One tap. App open, file sent, answer back.');
    trick('tap'); state = 'done'; busy = false; goBtn.disabled = false; $('span', goBtn).textContent = 'Tap again';
  }
  function reset() { token++; busy = false; state = 'home'; r.reset(); app.lock(); phone.style.transform = ''; phone.style.transition = ''; goBtn.disabled = false; $('span', goBtn).textContent = 'Tap it for me'; setPrompt(prompt, "Tap the phone on Nibble's orange nose."); }
  draggable(phone, {
    accept: () => state === 'home' && !busy, targets: () => [r.nfcEl, r.bodyEl], onDrop: () => connect(true),
    onClick: () => connect(false),
  });
  goBtn.addEventListener('click', () => { if (busy) return; if (state === 'done') { reset(); setTimeout(() => connect(false), 300); } else connect(false); });
  $('#tapReset').addEventListener('click', reset);
  reset();
})();

/* ================= 1c SNAP ================= */
(() => {
  const st = $('#st-show'), cam = $('#snapCam'), r = new Robot($('.robot-host', st), { nfc: false });
  const screen = $('.laptop-screen', st), ai = new AIWin(screen), rec = $('#snapReceipt'), cone = $('#snapCone'), tag = $('#camTag');
  const cine = $('#snapCine'), prompt = $('#snapPrompt'), go = $('#snapGo'), ava = $('#ava');
  ava.innerHTML = `<div class="pbubble"></div>${personSVG({ ...PEOPLE.ava, cup: false })}`;
  const arm = $('.arm-r', ava);
  let token = 0, busy = false, done = false;
  const FOCUS = { s: 2.3, x: 104, y: 250 };
  const setCam = (s, fx, fy, ms) => { cam.style.transition = ms ? `transform ${ms}ms cubic-bezier(.65,0,.25,1)` : 'none'; cam.style.transform = s === 1 ? 'none' : `translate(${340 - fx * s}px, ${200 - fy * s}px) scale(${s})`; };
  const armTo = (deg, ms = 450) => { arm.style.transition = ms ? `transform ${ms}ms cubic-bezier(.3,1.2,.5,1)` : 'none'; arm.style.transform = `rotate(${deg}deg)`; };
  const pSay = (text, ms = 1600) => { const b = $('.pbubble', ava); b.textContent = text; b.classList.add('show'); Sfx.pop(); setTimeout(() => b.classList.remove('show'), ms); };
  function drawCone() {
    const c = toStage(st, r.camEl), p = toStage(st, rec);
    $('polygon', cone).setAttribute('points', `${c.cx},${c.cy} ${p.x - 6},${p.y + p.h + 4} ${p.x + p.w + 6},${p.y + p.h + 4}`);
  }
  function reset() {
    token++; busy = false; done = false; r.reset(); ai.hide(); rec.className = 's-receipt'; cone.classList.remove('on'); tag.classList.remove('show'); ava.classList.remove('happy');
    armTo(50, 0); setCam(FOCUS.s, FOCUS.x, FOCUS.y, 0); cine.classList.add('on'); go.disabled = false; $('span', go).textContent = 'Snap it';
    setPrompt(prompt, 'Close-up: Ava has a lunch receipt to log.');
  }
  async function run() {
    if (busy) return; if (done) { reset(); await sleep(350); }
    busy = true; go.disabled = true; const my = ++token, alive = () => my === token;
    pSay('Need to log this...', 1500); rec.classList.add('wiggle'); await sleep(900); if (!alive()) return;
    cine.classList.remove('on'); Sfx.whoosh(); setCam(1, 0, 0, 1500); setPrompt(prompt, 'Meet Ava. And Nibble, with its camera.'); await sleep(1550); if (!alive()) return;
    r.look('left'); r.expr('happy'); r.hop(); r.el.classList.add('cam-on'); pSay('Nibble, log this?', 1500);
    const c = toStage(st, r.camEl); tag.style.left = (c.cx + 8) + 'px'; tag.style.top = (c.cy - 46) + 'px'; tag.classList.add('show'); Sfx.beep();
    await sleep(1300); if (!alive()) return;
    setPrompt(prompt, "She lays it under Nibble's camera...");
    armTo(-20); await sleep(260); rec.classList.remove('wiggle'); rec.classList.add('down'); Sfx.pop(); await sleep(700); armTo(20); if (!alive()) return;
    r.vars(-16, -12, 0, -10, 8); r.expr('focus'); drawCone(); cone.classList.add('on'); r.glyph(G.view()); Sfx.beep(); await sleep(1100); if (!alive()) return;
    setPrompt(prompt, '...and presses its head once. Click!');
    armTo(-124, 520); await sleep(560); if (!alive()) return;
    r.press(true); Sfx.click(); await sleep(170); Sfx.shutter(); flash(st); r.glyph(G.snapped()); await sleep(320);
    r.press(false); armTo(20); cone.classList.remove('on'); tag.classList.remove('show'); r.glyph(G.view()); await sleep(450); if (!alive()) return;
    setPrompt(prompt, 'The photo goes straight into Claude.');
    r.glyph(null); r.look('right'); r.expr('wide');
    await stream(r.headEl, screen, svg('camera'), { count: 10, dur: 1000, arc: -80, color: '#8B6CFF' }); if (!alive()) return;
    r.expr('focus'); r.led('think');
    ai.reset(); ai.show('Claude', true); ai.user('<span class="aw-img"><i></i><i></i><i></i><i></i></span>Log this expense');
    await ai.think('Reading the photo...', 1300); if (!alive()) return;
    ai.view(`<div class="snap-res"><div class="sr-card"><span class="sr-ic">${svg('receipt')}</span><div><b>$32.40</b><small>Meals · Joe's Pizza</small></div><span class="sr-ok">${svg('check')}</span></div><div class="sr-sheet"><div><span>Nov 18</span><span>Taxi</span><span>18.20</span></div><div class="new"><span>Nov 20</span><span>Joe's Pizza</span><span>32.40</span></div></div></div>`);
    ai.finish(); Sfx.ding(); await sleep(600); if (!alive()) return;
    r.look('front'); r.expr('happy'); r.mouth('smile'); r.led('done'); r.glyph(G.check('$32.40')); r.hop(); Sfx.success(); r.say('Logged!', 2400);
    ava.classList.add('happy'); pSay('That was easy.', 1800);
    setPrompt(prompt, 'One press. Photo to Claude. Logged.'); trick('snap');
    busy = false; done = true; go.disabled = false; $('span', go).textContent = 'Again';
  }
  go.addEventListener('click', run);
  rec.addEventListener('click', () => { if (!busy && !done) run(); });
  $('#showReset').addEventListener('click', reset);
  reset();
})();

/* ================= 2 MORNING ================= */
(() => {
  const st = $('#st-morning'), r = new Robot($('.robot-host', st), { nfc: false }), ai = new AIWin($('.laptop-screen', st), 'Claude');
  const pencil = $('.pencil', st), prompt = $('#lv-morning .prompt'), go = $('#morningGo'), spot = $('.pin-spot', st);
  let state = 'asleep', token = 0, paper = null;
  const TASKS = [['9:30', 'Team standup'], ['11:00', "Review Mia's PR"], ['1:00', 'Lunch with Sam'], ['4:00', 'Send the deck']];
  const DONE = ['Notes shared', 'PR approved', 'Table booked', 'Deck sent'];
  function reset() {
    token++; state = 'asleep'; r.reset(); r.expr('sleep'); r.led('off'); ai.hide();
    if (paper) paper.remove(); paper = null; $$('.pin-paper', st).forEach(p => p.remove()); spot.classList.remove('used'); pencil.classList.remove('show');
    setPrompt(prompt, 'Nibble is asleep. Tap it to start your day.'); go.disabled = false;
  }
  async function run() {
    if (state !== 'asleep') return; state = 'running'; go.disabled = true; const my = token, alive = () => my === token;
    Sfx.yawn(); r.expr('squint'); r.mouth('yawn'); await sleep(1100); if (!alive()) return;
    r.mouth(); r.stretch(); r.expr('happy'); r.led('listen'); r.say('Good morning!', 1600); await sleep(1400); if (!alive()) return;
    setPrompt(prompt, 'Planning your day...');
    r.look('screen'); r.led('think'); r.expr('focus'); ai.reset(); ai.show('Claude'); ai.user('Plan my day');
    await ai.steps(['Calendar: 3 events', 'Inbox: 12 new', 'Picked your top 4'], 550); if (!alive()) return;
    ai.done('Day planned', 'Printing it now'); await sleep(400);
    r.look('front'); r.expr('happy'); r.mouth('smile'); r.say('Printing your day!', 1500); setPrompt(prompt, 'Printing...');
    paper = await printPin(st, r, { w: 186, x: 474, y: 22, rot: 2, alive, lines: planLines('TODAY', 'Thursday, Nov 20', TASKS, '4 things. You got this.') });
    if (!paper || !alive()) return;
    r.mouth(); ai.hide(); setPrompt(prompt, 'Pinned up. Now watch it get done.'); await sleep(600);
    const rows = $$('.srow', paper);
    for (let i = 0; i < rows.length; i++) {
      if (!alive()) return;
      r.look('screen'); r.led('think'); r.expr('focus'); ai.reset(); ai.show('Claude'); ai.user(TASKS[i][1]); await sleep(650); ai.done(DONE[i], ''); await sleep(300); if (!alive()) return;
      r.look('right'); r.expr('happy'); r.led('done');
      await strike(st, pencil, rows[i]); if (!alive()) return;
    }
    pencil.classList.remove('show'); await sleep(250);
    stampIt(paper); await sleep(300);
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
  const st = $('#st-decide'), inner = $('.stage-inner', st), r = new Robot($('.robot-host', st), { nfc: false }), screen = $('.laptop-screen', st), ai = new AIWin(screen);
  const hint = $('#patHint'), chip = $('#undoChip'), prompt = $('#decidePrompt'), inbox = $('#inbox'), bank = $('#bankCard'), shop = $('#shop'), hand = $('#pressHand');
  shop.insertAdjacentHTML('beforeend', SHOP_SVG); hand.innerHTML = PRESS_HAND;
  let pending = null, undoTimer = null, undoLeft = 0, starting = false, lastApprove = 0, token = 0, pinned = null, again = false, lastCount = 0;
  const stopUndo = () => { clearInterval(undoTimer); undoTimer = null; chip.classList.remove('show'); };
  const TEAM = ['leo', 'kai', 'ava'];
  function buildInbox() {
    inbox.innerHTML = `<div class="ib-hd">${svg('mail')}<b>Finance team</b></div><div class="ib-team">${TEAM.map(k => `<span class="ib-p">${avatar(k)}<i>${svg('check')}</i></span>`).join('')}</div><div class="ib-list">${'<div class="ib-row old"><i></i><span></span></div>'.repeat(3)}</div>`;
  }
  function clearScene() {
    token++; inbox.classList.remove('show'); bank.classList.remove('show', 'drain'); shop.classList.remove('show', 'paid', 'gone'); bank.classList.remove('gone');
    hand.className = 'press-hand'; if (pinned) { pinned.remove(); pinned = null; } $$('.flying, .pin-paper', inner).forEach(e => e.remove());
    $('.bc-bal b', bank).textContent = '$4,200.00'; $('.shop-amt', shop).textContent = '+$0';
  }
  const composeHTML = `<div class="wv mail"><div class="ml-row"><span class="lb">To</span><span class="avs">${TEAM.map(k => avatar(k)).join('')}</span><span class="grp">Finance</span></div><div class="ml-row"><span class="lb">Re</span><b>November expenses</b></div><div class="ml-att">${svg('chart')}Nov_expenses.xlsx</div><i class="ln"></i><i class="ln s"></i><div class="ml-send">${svg('hand')}Waiting for a pat</div></div>`;
  const payHTML = `<div class="wv pay"><div class="py-to"><span class="py-ic">${svg('receipt')}</span><div><b>Acme Supply</b><small>Invoice #8812</small></div></div><div class="py-amt">$1,280.00</div><div class="py-card">${svg('card')}from •••• 4821</div><div class="ml-send">${svg('hand')}Hold Nibble's head</div></div>`;
  async function start() {
    if (starting) { again = true; return; } starting = true; again = false; const lvl = tabVal.risk;
    stopUndo(); pending = null; r.reset(); hint.classList.remove('show'); clearScene(); const my = token;
    r.look('screen'); r.led('think'); r.expr('focus'); ai.reset(); ai.show(lvl === 'y' ? 'Claude' : 'ChatGPT', true);
    if (lvl === 'y') {
      buildInbox(); inbox.classList.add('show');
      setPrompt(prompt, 'Your AI is writing an email to finance...');
      ai.user('Email the expenses to finance'); await ai.think('Drafting the email...', 1000);
      if (my === token) ai.view(composeHTML);
    } else {
      bank.classList.add('show'); shop.classList.add('show');
      setPrompt(prompt, 'Your AI wants to pay an invoice...');
      ai.user('Pay invoice #8812'); await ai.think('Preparing the payment...', 1000);
      if (my === token) ai.view(payHTML);
    }
    starting = false;
    if (again || tabVal.risk !== lvl) { start(); return; }
    r.look('front'); r.expr('wide'); r.led('need'); r.el.classList.add('ask'); Sfx.alert(); r.glyph(G.ask(lvl === 'y' ? 'mail' : 'card'));
    setPrompt(prompt, lvl === 'y' ? "Ready to send. Pat Nibble's head to approve." : '$1,280 is a big one. Press and hold Nibble\'s head for 3 seconds.');
    $('span', hint).textContent = lvl === 'y' ? 'pat' : 'hold 3s'; hint.classList.add('show'); pending = lvl;
  }
  async function sendMail(my) {
    const v = $('.aw-view', ai.body); if (v) { $('.ml-send', v).innerHTML = `${svg('send')}Sending`; v.classList.add('fold'); }
    await sleep(380); if (my !== token) return;
    const env = document.createElement('div'); env.className = 'env'; env.innerHTML = ENVELOPE;
    const a = toStage(st, screen), b = toStage(st, $('.ib-list', inbox));
    Sfx.whoosh(); setPrompt(prompt, 'Off it goes...');
    await flight(st, env, { x: a.cx, y: a.cy }, { x: b.cx, y: b.y + 10 }, { dur: 1300, arc: -150, kind: 'dot', color: '#3D7BFF', spin: 10, scale: [1, .5] });
    env.remove(); if (my !== token) return;
    $('.ib-list', inbox).insertAdjacentHTML('afterbegin', `<div class="ib-row new"><i></i>${svg('mail')}<b>Nov expenses</b>${svg('clip')}</div>`); Sfx.ding();
    inbox.classList.remove('bump'); void inbox.offsetWidth; inbox.classList.add('bump');
    ai.reset(); ai.view(`<div class="wv sent">${svg('send')}<b>Sent to Finance</b><span class="avs">${TEAM.map(k => avatar(k)).join('')}</span></div>`); ai.finish();
    setPrompt(prompt, 'Delivered. Watch them open it.');
    for (const p of $$('.ib-p', inbox)) { await sleep(450); if (my !== token) return; p.classList.add('read'); Sfx.tick(.7); }
    if (undoTimer) setPrompt(prompt, 'Sent and read. Pat its back to undo.');
  }
  async function payOut(my) {
    const v = $('.aw-view', ai.body); if (v) $('.ml-send', v).innerHTML = `${svg('check')}Approved`;
    setPrompt(prompt, 'Money moves from your card to Acme...');
    const a = toStage(st, bank), b = toStage(st, shop), bal = $('.bc-bal b', bank), amt = $('.shop-amt', shop);
    bank.classList.add('drain');
    for (let i = 0; i < 9; i++) {
      const bill = document.createElement('div'); bill.className = 'bill'; bill.innerHTML = '<span>$</span>';
      flight(st, bill, { x: a.cx + 20, y: a.cy }, { x: b.cx, y: b.y + 50 }, { dur: 950, arc: -120 - i * 5, kind: null, spin: 30 }).then(() => { bill.remove(); Sfx.coin(); });
      await sleep(140); if (my !== token) return;
    }
    await tween(1100, e => { bal.textContent = money(4200 - 1280 * e); amt.textContent = '+' + money(1280 * e).replace('.00', ''); });
    await sleep(500); if (my !== token) return;
    shop.classList.add('paid'); bank.classList.remove('drain'); Sfx.cash();
    ai.reset(); ai.view(`<div class="wv sent">${svg('check')}<b>Paid $1,280.00</b><small>to Acme Supply</small></div>`); ai.finish();
    await sleep(1300); if (my !== token) return;
    bank.classList.add('gone'); shop.classList.add('gone');
    r.look('front'); r.say("Here's your receipt.", 1800); setPrompt(prompt, 'Nibble prints the receipt and pins it up.');
    pinned = await printPin(st, r, { w: 132, x: 532, y: 18, rot: 3, cls: 'rcpt', alive: () => my === token, lines: [
      '<div class="sh">RECEIPT</div>', '<div class="sd">Nov 20 · 10:42 AM</div>', '<div class="rule"></div>',
      '<div class="kv"><span>To</span><b>Acme Supply</b></div>', '<div class="kv"><span>Invoice</span><b>#8812</b></div>', '<div class="kv"><span>From</span><b>•••• 4821</b></div>',
      '<div class="rule"></div>', '<div class="big">$1,280.00</div>', '<div class="sfoot">Approved by a 3s hold</div>'] });
    if (!pinned || my !== token) return;
    stampIt(pinned, 'PAID'); r.celebrate(null, null, 'Paid and filed.'); r.glyph(G.check('$1,280')); setPrompt(prompt, 'Paid, with a receipt on the wall.');
  }
  function approve(lvl) {
    lastApprove = performance.now(); pending = null; hint.classList.remove('show'); r.el.classList.remove('ask', 'holding'); r.setRing(0);
    r.expr('happy'); r.mouth('smile'); r.led('done'); r.nod(); Sfx.success(); trick('approve'); const my = token;
    if (lvl === 'y') {
      hand.className = 'press-hand pat'; setTimeout(() => { hand.className = 'press-hand'; }, 650);
      r.glyph(G.mail()); r.say('Sending!', 1600);
      undoLeft = 10; $('span', chip).textContent = undoLeft; chip.classList.add('show');
      undoTimer = setInterval(() => { undoLeft--; $('span', chip).textContent = undoLeft; if (undoLeft <= 0) stopUndo(); }, 1000);
      sendMail(my);
    } else {
      setTimeout(() => { hand.className = 'press-hand'; r.press(false); }, 300);
      r.glyph(G.ok()); r.say('Approved. Paying now.', 2000); payOut(my);
    }
  }
  function reject() {
    pending = null; hint.classList.remove('show'); r.el.classList.remove('ask', 'holding'); r.setRing(0); r.glyph(null); hand.className = 'press-hand'; r.press(false);
    r.look('right'); r.expr('sad'); r.mouth('flat'); Sfx.error();
    const v = $('.aw-view', ai.body); if (v) v.classList.add('cancel'); ai.err('Cancelled', 'Nothing was sent.');
    r.say("Okay, okay. I won't do it.", 2600); setPrompt(prompt, 'Pushed away. Nothing happened.');
    setTimeout(() => { r.look('front'); r.expr(); r.mouth(); r.led('idle'); }, 1600);
  }
  async function undo() {
    if (!undoTimer) return; stopUndo(); const my = ++token;
    r.expr('wide'); r.led('need'); r.recoil(); r.glyph(null); Sfx.whoosh(); r.say('Unsending!', 1800);
    const row = $('.ib-row.new', inbox); $$('.ib-p', inbox).forEach(p => p.classList.remove('read'));
    if (row) {
      const a = toStage(st, row), b = toStage(st, screen); row.classList.add('out');
      const env = document.createElement('div'); env.className = 'env'; env.innerHTML = ENVELOPE;
      await flight(st, env, { x: a.cx, y: a.cy }, { x: b.cx, y: b.cy }, { dur: 1000, arc: -120, kind: 'dot', color: '#FF6B3D', spin: -10, scale: [.5, 1] });
      env.remove(); row.remove();
    }
    if (my !== token) return;
    ai.reset(); ai.view(`<div class="wv sent back">${svg('reset')}<b>Back in your drafts</b><small>Nobody saw a thing</small></div>`);
    r.expr(); r.led('idle'); setPrompt(prompt, 'Undone. Like it never happened.');
  }
  let down = null, iv = null, done = false;
  r.el.addEventListener('pointerdown', e => {
    if (!pending) return; e.preventDefault(); try { r.el.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    down = { x: e.clientX, t: performance.now() }; done = false; hint.classList.remove('show');
    if (pending === 'r') {
      r.el.classList.add('holding'); r.expr('tense'); r.press(true); hand.className = 'press-hand down'; Sfx.click(); lastCount = 0; clearInterval(iv);
      iv = setInterval(() => {
        if (!down || done) { clearInterval(iv); return; }
        const p = (performance.now() - down.t) / 3000; r.setRing(p);
        const n = 3 - Math.min(2, Math.floor(p * 3));
        if (n !== lastCount) { lastCount = n; r.glyph(G.count(n)); Sfx.tick(1 - n / 3); }
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
    else if (lvl === 'r') { r.el.classList.remove('holding'); r.setRing(0); r.press(false); hand.className = 'press-hand'; r.expr('wide'); r.glyph(G.ask('card')); hint.classList.add('show'); r.say('Not long enough. Hold for 3 seconds.', 2200); Sfx.error(); }
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
(() => {
  const st = $('#st-office'), r = new Robot($('.robot-host', st)), prompt = $('#officePrompt');
  const cal = $('#calPanel'), rec = $('#officeReceipt'), go = $('#officeGo'), clockEl = $('#officeClock');
  const zp = $('#zPhone'), zin = $('.zp-in', zp), app = new PhoneApp($('.phone-screen', zp));
  const mk = (id, key, flip) => {
    const o = PEOPLE[key], el = $('#' + id);
    el.innerHTML = `<div class="pbubble"></div>${personSVG(o)}<span class="name">${o.name}</span>`;
    if (flip) $('svg', el).style.transform = 'scaleX(-1)';
    $('.cup', el).style.transformOrigin = '91px 139px';
    return { el, key, phone: $('#' + id + 'Phone'), name: o.name, flip };
  };
  const mia = mk('mia', 'mia'), sam = mk('sam', 'sam', true);
  let token = 0, busy = false;
  const alive = my => my === token;
  const pSay = (p, text, ms = 1800) => { const b = $('.pbubble', p.el); b.textContent = text; b.classList.add('show'); Sfx.pop(); setTimeout(() => b.classList.remove('show'), ms); };
  const pocket = p => { const rc = p.el.getBoundingClientRect(); return { left: rc.left + rc.width * (p.flip ? .75 : .25) - 4, top: rc.top + rc.height * .55, width: 8, height: 8 }; };
  const scr = p => p.phone.querySelector('.op-screen');
  const phoneOut = (p, html) => { p.el.classList.add('phone-out'); scr(p).innerHTML = html; p.phone.classList.add('show'); Sfx.pop(); };
  const phoneIn = p => { p.el.classList.remove('phone-out'); p.phone.classList.remove('show'); };
  const buzz = async p => { p.el.classList.add('buzz'); Sfx.vibrate(); await sleep(650); p.el.classList.remove('buzz'); };
  const OP_LOCK = `<div class="op lock"><div class="ol-time">10:40</div><div class="ol-nfc">${svg('nfc')}</div></div>`;
  const OP_SPLASH = '<div class="op splash"><span class="mini-face"><i></i><i></i></span></div>';
  const appHdr = `<div class="op-app">${MINI}Nibble</div>`;
  const card = ({ icon, color, big, lines = [], avs = [], btn, act }) => `<div class="op">${appHdr}<div class="op-card"><span class="ic" style="background:${color}">${svg(icon)}</span><span class="big">${big}</span>${lines.map(l => `<span>${l}</span>`).join('')}${avs.length ? `<span class="op-avs">${avs.map(k => avatar(k)).join('')}</span>` : ''}</div>${btn ? `<button class="op-btn" data-act="${act}">${btn}</button>` : ''}</div>`;
  const ok = (text, sub) => `<div class="op"><div class="op-ok"><span class="ck">${svg('check')}</span>${text}<span style="font-weight:600;color:#888;font-size:9.5px">${sub || ''}</span></div></div>`;
  function setClock(h, m) { $('.hh', clockEl).style.transform = `rotate(${(h % 12) * 30 + m * .5}deg)`; $('.mh', clockEl).style.transform = `rotate(${m * 6}deg)`; }
  async function spinClock(fromH, fromM, toH, toM, ms = 1500) {
    const a = fromH * 60 + fromM, b = toH * 60 + toM;
    await tween(ms, e => { const v = a + (b - a) * e; setClock(Math.floor(v / 60), v % 60); if (Math.random() < .3) Sfx.clockTick(); });
  }
  /* a person takes out their phone and taps it on Nibble's nose */
  async function tapNose(p, my) {
    phoneOut(p, OP_LOCK); await sleep(600); if (!alive(my)) return false;
    const ph = p.phone, a = toStage(st, ph), b = toStage(st, r.nfcEl), left = p === mia;
    ph.style.transition = 'transform .55s cubic-bezier(.45,0,.25,1)';
    ph.style.transform = `translate(${b.cx - a.cx + (left ? -30 : 30)}px,${b.cy - a.cy + 10}px) rotate(${left ? 14 : -14}deg) scale(.8)`;
    r.look(left ? 'left' : 'right'); r.expr('wide'); await sleep(600); if (!alive(my)) return false;
    r.ripple(); Sfx.ding(); ph.classList.remove('buzz'); void ph.offsetWidth; ph.classList.add('buzz'); r.led('listen'); r.expr('happy');
    await sleep(450); scr(p).innerHTML = OP_SPLASH;
    ph.style.transform = ''; await sleep(580); ph.style.transition = '';
    return alive(my);
  }
  async function zoomOpen(p) {
    const left = p === mia ? 146 : 418; zp.style.left = left + 'px';
    const a = toStage(st, p.phone); zin.style.transformOrigin = `${(a.cx - left) / .8}px ${(a.cy - 16) / .8}px`;
    app.set(''); zp.classList.add('show'); p.phone.classList.add('zoomed'); Sfx.pop(); await sleep(480);
  }
  async function zoomClose() { zp.classList.remove('show'); await sleep(300); [mia, sam].forEach(x => x.phone.classList.remove('zoomed')); await sleep(150); }
  const people = keys => `<div class="ap-people">${keys.map(k => `<div class="ap-person" data-p="${k}">${avatar(k)}<span>${PEOPLE[k].name}</span></div>`).join('')}</div>`;
  const select = (sel) => { const el = $(sel, app.s); if (el) el.classList.add('sel'); Sfx.tick(.6); };

  /* calendar */
  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], TIMES = ['10a', '11a', '1p', '2p', '3p'];
  const MB = [[0, 1, 2], [3, 4], [0, 1], [0, 2], [1, 3]], SB = [[3, 4], [0, 1, 2], [2, 3, 4], [1, 3], [0, 2, 4]];
  function buildCal() {
    let h = `<div class="cal-top">${ic('calendar')}Finding a time<span class="who"><span class="m">${avatar('mia')}Mia</span><span class="s">${avatar('sam')}Sam</span></span></div><div class="cal-grid"><span></span>${DAYS.map(d => `<span class="hd">${d}</span>`).join('')}`;
    TIMES.forEach((t, ri) => { h += `<span class="tm">${t}</span>`; DAYS.forEach((d, di) => { h += `<span class="cell" data-d="${di}" data-r="${ri}"><b class="m"></b><b class="s"></b></span>`; }); });
    cal.innerHTML = h + '</div>';
  }
  const cell = (d, rr) => $(`.cell[data-d="${d}"][data-r="${rr}"]`, cal);
  function setGo(label, show = true) { $('span', go).textContent = label; go.style.display = show ? '' : 'none'; go.disabled = false; }

  function reset() {
    token++; busy = false; const mode = tabVal.office;
    r.reset(); cal.classList.remove('show'); buildCal(); rec.classList.remove('show', 'glow', 'scanned'); zp.classList.remove('show'); app.set(''); [mia, sam].forEach(x => x.phone.classList.remove('zoomed'));
    [mia, sam].forEach(p => { phoneIn(p); p.phone.style.transform = ''; p.phone.style.transition = ''; p.el.classList.remove('happy', 'buzz', 'walk', 'gone', 'sip'); p.el.style.transition = 'none'; p.el.style.transform = ''; });
    void st.offsetWidth; [mia, sam].forEach(p => { p.el.style.transition = ''; });
    setClock(10, 40);
    if (mode === 'time') { setPrompt(prompt, 'Mia and Sam want to grab coffee this week.'); setGo('Watch Mia tap Nibble'); }
    if (mode === 'split') { rec.classList.add('show', 'glow'); setPrompt(prompt, 'Mia paid $23.40 for both coffees.'); setGo('Watch Mia split it'); }
    if (mode === 'msg') {
      sam.el.style.transition = 'none'; sam.el.style.transform = 'translateX(240px)'; sam.el.classList.add('gone'); setClock(9, 40);
      setPrompt(prompt, 'Mia is heading out. Sam is not in yet.'); setGo('Watch Mia leave a file');
    }
  }

  /* FIND A TIME */
  const confirmed = new Set();
  async function runTime() {
    if (busy) return; busy = true; const my = token; go.style.display = 'none'; confirmed.clear();
    pSay(mia, 'Coffee with Sam?', 1500); await sleep(900); if (!alive(my)) return;
    setPrompt(prompt, 'Mia taps her phone on Nibble.');
    if (!await tapNose(mia, my)) return;
    r.say('Hi Mia!', 1200); await zoomOpen(mia); if (!alive(my)) return;
    setPrompt(prompt, 'The Nibble app opens by itself.');
    await app.launch(() => app.home('mia', 'Office Nibble')); if (!alive(my)) return;
    await sleep(400); await app.tapOn('[data-t="time"]'); if (!alive(my)) return;
    app.page('Schedule a time', `<div class="ap-sec">With</div>${people(['sam', 'leo', 'ava', 'kai'])}<div class="ap-sec">How long</div><div class="chips"><span class="chip">15 min</span><span class="chip" data-v="30">30 min</span><span class="chip">1 hr</span></div><div class="ap-sec">Where</div><div class="ap-where">${svg('cup')}Coffee bar, 2nd floor</div>`, 'Find a time');
    setPrompt(prompt, 'Schedule a time: pick Sam, 30 minutes.');
    await sleep(450); await app.tapOn('.ap-person[data-p="sam"]'); if (!alive(my)) return; select('.ap-person[data-p="sam"]'); await sleep(250);
    await app.tapOn('.chip[data-v="30"]'); if (!alive(my)) return; $$('.chip', app.s).forEach(c => c.classList.toggle('on', c.dataset.v === '30')); await sleep(250);
    await app.tapOn('.ap-btn'); if (!alive(my)) return;
    app.set(`<div class="ap center"><div class="ap-hd">Finding a time</div><div class="ap-pair">${avatar('mia')}<span class="dots"><i></i><i></i><i></i></span>${avatar('sam')}</div><div class="ps-sub">Nibble is checking both calendars</div></div>`);
    await sleep(900); await zoomClose(); if (!alive(my)) return;
    r.look('up'); r.led('think'); r.expr('focus'); cal.classList.add('show'); Sfx.whoosh(); setPrompt(prompt, 'Nibble checks both calendars...');
    await sleep(500);
    for (let d = 0; d < 5; d++) {
      if (!alive(my)) return;
      r.vars(-26 + d * 13, 14, 0, -12 + d * 6, -8);
      for (let rr = 0; rr < 5; rr++) { const c = cell(d, rr); c.classList.add('scan'); if (MB[d].includes(rr)) $('b.m', c).classList.add('on'); if (SB[d].includes(rr)) $('b.s', c).classList.add('on'); }
      Sfx.tick(d / 5); await sleep(430);
      for (let rr = 0; rr < 5; rr++) cell(d, rr).classList.remove('scan');
    }
    const slot = cell(3, 4); slot.classList.add('slot'); Sfx.ding();
    r.look('front'); r.expr('wide'); r.glyph(G.cal()); r.say('Thursday at 3. Both free!', 2200); await sleep(1500); if (!alive(my)) return;
    slot.classList.add('booked'); slot.innerHTML = 'Coffee'; Sfx.pop();
    r.expr('happy'); r.mouth('open'); setPrompt(prompt, 'Booked. Invites go to both phones...');
    await Promise.all([stream(r.mouthEl, pocket(mia), svg('mail'), { count: 8, dur: 950, arc: -70 }), stream(r.mouthEl, pocket(sam), svg('mail'), { count: 8, dur: 950, arc: -70, color: '#3D7BFF' })]);
    if (!alive(my)) return; r.mouth(); await Promise.all([buzz(mia), buzz(sam)]); if (!alive(my)) return;
    const inv = { icon: 'calendar', color: '#22C273', big: 'Coffee chat', lines: ['Thu · 3:00 PM'], avs: ['mia', 'sam'], btn: 'Confirm', act: 'conf' };
    phoneOut(mia, card(inv)); await sleep(250); phoneOut(sam, card(inv));
    setPrompt(prompt, 'Both phones buzzed. Tap Confirm on each phone.');
  }
  async function confirm(p) {
    if (confirmed.has(p)) return; confirmed.add(p);
    scr(p).innerHTML = ok('Confirmed', 'Thu 3:00 PM'); p.el.classList.add('happy'); Sfx.success();
    pSay(p, p === mia ? 'Done!' : 'See you there!', 1400);
    if (confirmed.size === 2) {
      await sleep(700); const s = cell(3, 4); s.innerHTML = 'Booked';
      r.celebrate(null, null, 'Booked. Enjoy your coffee!'); r.glyph(G.cal()); r.led('party');
      mia.el.classList.add('sip'); sam.el.classList.add('sip'); setTimeout(() => { mia.el.classList.remove('sip'); sam.el.classList.remove('sip'); }, 1400);
      setPrompt(prompt, 'One tap, two confirms. No back-and-forth.'); trick('time'); setGo('Again'); busy = false;
    }
  }

  /* SPLIT */
  async function runSplit() {
    if (busy) return; busy = true; const my = token; go.style.display = 'none';
    pSay(mia, "Let's split it.", 1400); await sleep(800); if (!alive(my)) return;
    setPrompt(prompt, 'Mia taps her phone on Nibble.');
    if (!await tapNose(mia, my)) return;
    await zoomOpen(mia); if (!alive(my)) return;
    await app.launch(() => app.home('mia', 'Office Nibble')); if (!alive(my)) return;
    await sleep(350); await app.tapOn('[data-t="split"]'); if (!alive(my)) return;
    app.page('Split a bill', `<div class="ap-scan"><div class="rc"><b></b><i></i><i></i><i></i><i></i><b></b></div><span class="sl"></span></div><div class="ps-sub">Nibble is snapping the receipt</div>`);
    setPrompt(prompt, 'Nibble snaps the receipt on the counter.');
    rec.classList.remove('glow'); r.vars(-22, -12, 0, -10, 8); r.expr('focus'); r.el.classList.add('cam-on'); await sleep(900); if (!alive(my)) return;
    Sfx.shutter(); flash(st); r.expr('squint'); await sleep(250); r.expr('happy'); r.el.classList.remove('cam-on'); rec.classList.add('scanned'); r.look('front');
    app.page('Split a bill', `<div class="ap-card items">${[['Latte', '5.20'], ['Cold brew', '4.80'], ['Croissant ×2', '9.00'], ['Tax', '4.40']].map(([n, v]) => `<div class="it"><span>${n}</span><b>${v}</b></div>`).join('')}<div class="it tot"><span>Total · split 2 ways</span><b>$23.40</b></div></div><div class="ap-each"><div>${avatar('mia')}<span><b>$11.70</b><small>Mia, paid</small></span></div><div>${avatar('sam')}<span><b>$11.70</b><small>Sam owes</small></span></div></div>`, 'Request from Sam');
    for (const it of $$('.it', app.s)) { it.classList.add('in'); Sfx.tick(.4); await sleep(200); }
    $('.ap-each', app.s).classList.add('in'); Sfx.pop(); setPrompt(prompt, '$23.40 for two. $11.70 each.'); await sleep(900); if (!alive(my)) return;
    await app.tapOn('.ap-btn'); if (!alive(my)) return;
    app.set(`<div class="ap center"><div class="ap-done">${svg('check')}</div><b>Request sent</b><div class="ps-sub">$11.70 from Sam</div></div>`); Sfx.success(); await sleep(800);
    await zoomClose(); scr(mia).innerHTML = ok('Request sent', '$11.70 from Sam'); if (!alive(my)) return;
    r.look('right'); r.mouth('open'); r.glyph(G.coins());
    await stream(r.mouthEl, pocket(sam), svg('coins'), { count: 8, dur: 900, arc: -70, color: '#F2B21B' }); if (!alive(my)) return;
    r.mouth(); await buzz(sam); if (!alive(my)) return;
    phoneOut(sam, card({ icon: 'coins', color: '#F2B21B', big: '$11.70', lines: ['Coffee with Mia'], avs: ['mia'], btn: 'Pay $11.70', act: 'pay' }));
    setPrompt(prompt, "Sam's phone buzzed. Tap Pay.");
  }
  async function pay() {
    const my = token; scr(sam).innerHTML = ok('Paid $11.70', 'to Mia'); Sfx.success(); sam.el.classList.add('happy');
    for (let i = 0; i < 6; i++) { fly(sam.phone, pocket(mia), COIN, { dur: 750, arc: -90 - i * 8 }); setTimeout(() => Sfx.coin(), 650); await sleep(110); }
    await sleep(800); if (!alive(my)) return; await buzz(mia);
    phoneOut(mia, ok('+$11.70', 'from Sam')); mia.el.classList.add('happy'); pSay(mia, 'Thanks, Sam!', 1500);
    r.celebrate(null, null, 'Square! Nobody owes anybody.'); r.glyph(G.check('Even'));
    setPrompt(prompt, 'Settled before the coffee got cold.'); trick('split'); setGo('Again'); busy = false;
  }

  /* LEAVE A MESSAGE */
  async function runLeave() {
    if (busy) return; busy = true; const my = token; go.style.display = 'none';
    setPrompt(prompt, 'Mia taps her phone on Nibble.');
    if (!await tapNose(mia, my)) return;
    await zoomOpen(mia); if (!alive(my)) return;
    await app.launch(() => app.home('mia', 'Office Nibble')); if (!alive(my)) return;
    await sleep(350); await app.tapOn('[data-t="leave"]'); if (!alive(my)) return;
    app.page('Leave a file', `<div class="ap-sec">For</div>${people(['sam', 'leo', 'ava', 'kai'])}<div class="ap-sec">File</div><div class="ap-row" data-k="deck"><span class="th" style="background:#FF6B3D">${svg('doc')}</span><div><b>Launch_deck.pdf</b><small>12 slides</small></div><i class="ck">${svg('check')}</i></div><div class="ap-sec">Note</div><div class="ap-note">Review before 3, please!</div>`, 'Leave it with Nibble');
    setPrompt(prompt, 'Leave a file: for Sam, with a note.');
    await sleep(450); await app.tapOn('.ap-person[data-p="sam"]'); if (!alive(my)) return; select('.ap-person[data-p="sam"]'); await sleep(200);
    await app.tapOn('.ap-row'); if (!alive(my)) return; select('.ap-row'); await sleep(200);
    await app.tapOn('.ap-btn'); if (!alive(my)) return;
    await zoomClose(); if (!alive(my)) return;
    r.look('left'); r.mouth('open'); await stream(mia.phone, r.mouthEl, svg('doc'), { count: 10, dur: 1000, arc: -60 }); if (!alive(my)) return;
    Sfx.chomp(); r.mouth(); r.hat(BOX_HAT); r.expr('happy'); r.say("Got it. I'll hold it for Sam.", 2200);
    scr(mia).innerHTML = ok('Left with Nibble', 'for Sam'); await sleep(1300); if (!alive(my)) return;
    phoneIn(mia); pSay(mia, 'Thanks, Nibble!', 1200); await sleep(900);
    mia.el.classList.add('walk'); mia.el.style.transform = 'translateX(-240px)'; Sfx.steps(4); await sleep(1150); mia.el.classList.add('gone'); mia.el.classList.remove('walk');
    if (!alive(my)) return;
    setPrompt(prompt, 'Later that afternoon...'); r.look('front'); r.expr('sleep'); r.led('idle');
    await spinClock(9, 40, 14, 55, 1600); if (!alive(my)) return;
    sam.el.style.transition = ''; void sam.el.offsetWidth;
    sam.el.classList.remove('gone'); sam.el.classList.add('walk'); sam.el.style.transform = 'translateX(0)'; Sfx.steps(4); await sleep(1150); sam.el.classList.remove('walk');
    if (!alive(my)) return;
    r.expr('wide'); r.look('right'); await sleep(300); r.expr('happy'); r.wave(); Sfx.ding(); r.say('Sam! Mia left you something.', 2200);
    await sleep(1600); if (!alive(my)) return;
    setPrompt(prompt, 'Sam taps his phone on Nibble.');
    if (!await tapNose(sam, my)) return;
    await zoomOpen(sam); if (!alive(my)) return;
    await app.launch(() => app.page('For you', `<div class="ap-card pick"><div class="from">${avatar('mia')}<div><b>Mia left you a file</b><small>9:41 AM · held by Nibble</small></div></div><div class="ap-row"><span class="th" style="background:#FF6B3D">${svg('doc')}</span><div><b>Launch_deck.pdf</b><small>12 slides</small></div></div><div class="ap-note">Review before 3, please!</div></div>`, 'Receive')); if (!alive(my)) return;
    await sleep(800); await app.tapOn('.ap-btn'); if (!alive(my)) return;
    r.hat(null); r.mouth('open');
    await stream(r.hatEl, app.s, svg('doc'), { count: 10, dur: 900, arc: -60, color: '#3D7BFF' }); if (!alive(my)) return;
    r.mouth('smile'); Sfx.ding();
    app.page('Launch_deck.pdf', `<div class="ap-slide"><b>Launch plan</b><i></i><i></i><i class="s"></i><span class="bars"><i></i><i></i><i></i></span></div><div class="ap-thumbs"><i class="on"></i><i></i><i></i><i></i></div><div class="ap-note from">${avatar('mia')}<span>Review before 3, please!</span></div>`);
    sam.el.classList.add('happy'); pSay(sam, 'Thanks, Mia!', 1500);
    r.celebrate(null, null, 'Delivered. Your tiny office mailroom.'); r.glyph(G.box());
    setPrompt(prompt, 'Delivered, even though they never crossed paths.'); trick('message');
    await sleep(2600); if (!alive(my)) return;
    await zoomClose(); scr(sam).innerHTML = ok('Opened', 'Launch_deck.pdf');
    setGo('Again'); busy = false;
  }
  /* phone buttons */
  [mia, sam].forEach(p => p.phone.addEventListener('click', e => {
    const b = e.target.closest('.op-btn'); if (!b) return; const act = b.dataset.act; if (!act) { Sfx.pop(); return; }
    if (act === 'conf') confirm(p); if (act === 'pay') pay();
  }));
  go.addEventListener('click', () => {
    if ($('span', go).textContent === 'Again') { reset(); return; }
    const m = tabVal.office;
    if (m === 'time') runTime(); if (m === 'split') runSplit(); if (m === 'msg') runLeave();
  });
  $('#officeReset').addEventListener('click', reset);
  $('.tabs[data-tabs="office"]').addEventListener('tabchange', reset);
  reset();
})();

/* ================= DAY FILM ================= */
(() => {
  const st = $('#st-day'), r = new Robot($('.robot-host', st), { nfc: false }), ai = new AIWin($('.laptop-screen', st));
  const win = $('#dayWin'), sun = $('#daySun'), stars = $('.d-stars', win), timeEl = $('#dayTime'), cap = $('#dayCap'), pencil = $('.pencil', st), spot = $('.pin-spot', st);
  const track = $('#dayTrack'), fill = $('#dayFill'), play = $('#dayPlay');
  const H0 = 8, H1 = 19.5;
  let token = 0, cur = 8, running = false, plan = null;
  const TASKS = [['', 'Ship the fix'], ['', 'Lunch with Sam'], ['', 'Client email'], ['', 'Coffee with Mia']];
  const OPTS = { w: 154, x: 512, y: 14, rot: 2, lines: planLines('TODAY', 'Thu, Nov 20', TASKS, 'Have a good one.') };
  const SKY = [[7, '#FFD3A5', '#FFE9D2', '#9AA6BF'], [9.5, '#BFE3FF', '#FFF1DC', '#7E90AE'], [12.5, '#8CC8FF', '#D8EEFF', '#7387A6'], [16, '#A9C9FF', '#FFE1C2', '#7A86A0'], [18, '#FF9E7A', '#FFD29A', '#5D5B78'], [19, '#5B4A8A', '#C27BA0', '#3C3A5C'], [20, '#1E2350', '#3A3A70', '#262B4A']];
  function setTime(h) {
    cur = h; let i = 0; while (i < SKY.length - 2 && h > SKY[i + 1][0]) i++;
    const A = SKY[i], B = SKY[i + 1], t = clamp((h - A[0]) / (B[0] - A[0]), 0, 1);
    win.style.background = `linear-gradient(${mixHex(A[1], B[1], t)},${mixHex(A[2], B[2], t)})`; win.style.setProperty('--city', mixHex(A[3], B[3], t));
    const night = h > 18.9;
    sun.classList.toggle('moon', night); stars.style.opacity = night ? 1 : 0;
    if (night) { sun.style.left = '78%'; sun.style.top = '26%'; }
    else { const p = clamp((h - 7) / 12, 0, 1); sun.style.left = (8 + p * 84) + '%'; sun.style.top = (80 - Math.sin(Math.PI * p) * 62) + '%'; }
    const hh = Math.floor(h), mm = Math.round((h - hh) * 60) % 60, h12 = ((hh + 11) % 12) + 1;
    timeEl.textContent = `${h12}:${String(mm).padStart(2, '0')} ${hh < 12 ? 'AM' : 'PM'}`;
    fill.style.width = clamp((h - H0) / (H1 - H0), 0, 1) * 100 + '%';
  }
  function clearPlan() { $$('.pin-paper', st).forEach(p => p.remove()); plan = null; spot.classList.remove('used'); pencil.classList.remove('show'); }
  /* before moment i, the plan is up and tasks before i-1 are crossed off */
  function syncPlan(i) {
    if (i === 0) { clearPlan(); return; }
    if (!plan) plan = pinNow(st, OPTS);
    $$('.srow', plan).forEach((row, j) => row.classList.toggle('done', j < i - 1));
    const s = $('.stamp', plan); if (s) s.remove();
  }
  async function cross(i, my) { if (my !== token || !plan) return; r.look('right'); await strike(st, pencil, $$('.srow', plan)[i]); pencil.classList.remove('show'); }
  const below = () => stagePoint(st, 407, 420);
  const M = [
    { h: 8.83, cap: 'Morning. Nibble prints your day.', run: async my => {
      ai.hide(); r.reset(); r.expr('sleep'); r.led('off'); await sleep(700); Sfx.yawn(); r.mouth('yawn'); await sleep(900);
      r.mouth('smile'); r.expr('happy'); r.led('listen'); r.say('Morning!', 1300); await sleep(600); if (my !== token) return;
      plan = await printPin(st, r, { ...OPTS, alive: () => my === token });
    } },
    { h: 10.5, cap: 'Your agent ships the fix.', run: async my => {
      r.reset(); r.look('screen'); r.led('think'); r.expr('focus'); ai.reset(); ai.show('Claude Code'); ai.user('Fix the checkout bug');
      await ai.steps(['Editing 2 files', 'Tests pass'], 600); if (my !== token) return; ai.done('Shipped', 'v2.4.1 is live'); await sleep(400);
      r.celebrate(null, null, 'Shipped!'); r.glyph(G.code()); await sleep(900); await cross(0, my);
    } },
    { h: 12.25, cap: 'Lunch with Sam. Split in a tap.', run: async my => {
      ai.hide(); r.reset(); r.ripple(); r.glyph(G.coins()); for (let i = 0; i < 3; i++) { Sfx.coin(); await sleep(250); }
      r.hop(); r.say('Sam paid you back.', 2000); await sleep(900); await cross(1, my);
    } },
    { h: 14.67, cap: 'Client email? Pat to approve.', run: async my => {
      r.reset(); ai.show('Claude'); ai.reset(); ai.user('Send the proposal to the client'); ai.wait('Waiting for a pat', 'to client@');
      r.led('need'); r.expr('wide'); r.el.classList.add('ask'); r.glyph(G.ask('mail')); Sfx.alert();
      await sleep(1500); if (my !== token) return;
      await fly(below(), r.headEl, `<span style="color:var(--accent)">${svg('hand')}</span>`, { dur: 650, arc: 0, size: 40 }); Sfx.pop();
      r.el.classList.remove('ask'); r.nod(); r.expr('happy'); r.led('done'); r.glyph(G.mail()); ai.done('Sent', 'to client@'); r.say('Sent!', 1500); Sfx.success();
      await sleep(900); await cross(2, my);
    } },
    { h: 16, cap: 'Coffee with Mia. Booked.', run: async my => {
      ai.hide(); r.reset(); r.look('up'); r.led('think'); r.emoji('calendar'); for (let i = 0; i < 4; i++) { Sfx.tick(i / 4); await sleep(220); }
      r.look('front'); r.glyph(G.cal()); r.say('Coffee with Mia, Thu 4 PM.', 2000); r.hop(); Sfx.success(); await sleep(900); await cross(3, my);
    } },
    { h: 18.5, cap: 'All done. Goodnight.', run: async my => {
      ai.hide(); r.reset(); r.look('right'); r.expr('happy'); await sleep(500); if (my !== token || !plan) return;
      stampIt(plan); r.say('Everything got done.', 2000); r.led('party'); await sleep(2000); if (my !== token) return;
      r.look('front'); r.expr('sleep'); r.led('off');
    } },
  ];
  track.insertAdjacentHTML('beforeend', M.map((m, i) => {
    const hh = Math.floor(m.h), mm = Math.round((m.h - hh) * 60), h12 = ((hh + 11) % 12) + 1;
    return `<button class="mk" data-i="${i}" style="left:${(m.h - H0) / (H1 - H0) * 100}%" aria-label="Jump to ${h12}:${String(mm).padStart(2, '0')}"><span>${h12}:${String(mm).padStart(2, '0')}</span></button>`;
  }).join(''));
  async function travel(to, ms, my) {
    const from = cur;
    await tween(ms, e => { if (my === token) setTime(from + (to - from) * e); });
  }
  async function moment(i, my) {
    $$('.mk', track).forEach((b, j) => b.classList.toggle('on', j <= i));
    syncPlan(i); cap.textContent = M[i].cap; cap.classList.add('show'); await M[i].run(my);
  }
  async function playAll() {
    const my = ++token; running = true; play.disabled = true; clearPlan(); setTime(8); $$('.mk', track).forEach(b => b.classList.remove('on'));
    for (let i = 0; i < M.length; i++) { if (my !== token) return; await travel(M[i].h, 1300, my); if (my !== token) return; await moment(i, my); await sleep(1300); }
    await travel(H1, 900, my); if (my === token) { running = false; play.disabled = false; }
  }
  play.addEventListener('click', () => { if (!running) playAll(); });
  $$('.mk', track).forEach(b => b.addEventListener('click', async () => {
    const my = ++token; running = true; play.disabled = true; const i = +b.dataset.i;
    r.reset(); pencil.classList.remove('show');
    await travel(M[i].h, 700, my); if (my !== token) return; await moment(i, my); if (my === token) { running = false; play.disabled = false; }
  }));
  setTime(8); r.expr('sleep'); r.led('off');
  new IntersectionObserver((es, ob) => { if (es[0].isIntersecting) { setTimeout(() => { if (!running) playAll(); }, 400); ob.disconnect(); } }, { threshold: .6 }).observe(st);
})();

/* ================= MEET ================= */
(() => {
  const mr = $('#meetRobot'), stage = $('#meetStage');
  const host = document.createElement('div'); host.className = 'robot-host'; mr.appendChild(host);
  const r = new Robot(host);
  const PARTS = [
    { k: 'camera', side: 'L', y: -26, dot: [136, 22], icon: 'camera', t: 'Camera', d: 'Snaps the paper you show it.' },
    { k: 'touch', side: 'R', y: -46, dot: [192, 4], icon: 'hand', t: 'Touch head', d: 'Pat for yes. Hold 3s for big things.' },
    { k: 'face', side: 'R', y: 96, dot: [204, 120], icon: 'face', t: 'Face screen', d: 'Shows what it found, as a picture.' },
    { k: 'led', side: 'L', y: 218, dot: [136, 258], icon: 'light', t: 'Mood light', d: 'Blue: working. Yellow: needs you.' },
    { k: 'nose', side: 'R', y: 276, dot: [232, 304], icon: 'nfc', t: 'Tap spot', d: 'Tap a phone here. The app opens.' },
    { k: 'printer', side: 'L', y: 316, dot: [100, 326], icon: 'printer', t: 'Printer', d: 'Prints your plan and receipts.' },
  ];
  const lines = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); lines.setAttribute('class', 'meet-lines'); mr.appendChild(lines);
  const LW = 272, GAP = 40;
  lines.innerHTML = PARTS.map(p => { const ax = p.side === 'L' ? -GAP : LW + GAP, ay = p.y + 27; return `<path data-part="${p.k}" d="M${p.dot[0]} ${p.dot[1]} L${(p.dot[0] + ax) / 2} ${ay} L${ax} ${ay}"/>`; }).join('');
  PARTS.forEach((p, i) => {
    const b = document.createElement('button'); b.className = 'hs'; b.dataset.part = p.k; b.style.left = p.dot[0] + 'px'; b.style.top = p.dot[1] + 'px'; b.textContent = i + 1; b.setAttribute('aria-label', p.t);
    mr.appendChild(b);
    const l = document.createElement('button'); l.className = 'mlabel ' + p.side; l.dataset.part = p.k; l.style.top = p.y + 'px';
    l.innerHTML = `<span class="n">${i + 1}</span><span class="mi">${svg(p.icon)}</span><span class="mt"><b>${p.t}</b><small>${p.d}</small></span>`;
    mr.appendChild(l);
  });
  const ACT = {
    camera: async () => { r.el.classList.add('cam-on'); r.glyph(G.view()); await sleep(700); Sfx.shutter(); flash(stage); r.glyph(G.snapped()); await sleep(300); r.glyph(G.check('Got it')); r.say('Snap! I can read that.', 1800); await sleep(900); r.el.classList.remove('cam-on'); },
    touch: async () => { r.el.classList.add('ask'); r.glyph(G.ask('mail')); Sfx.alert(); await sleep(800); r.press(true); Sfx.click(); await sleep(200); r.press(false); r.el.classList.remove('ask'); r.nod(); r.expr('happy'); r.glyph(G.ok()); Sfx.success(); r.say('Pat = yes.', 1800); },
    face: async () => { for (const g of [G.risk(3), G.todo(5), G.up('+18%')]) { r.glyph(g); Sfx.pop(); await sleep(800); } r.say('Pictures, not paragraphs.', 1800); },
    led: async () => { const L = [['think', 'Working'], ['need', 'Needs you'], ['done', 'Done'], ['party', 'Party']]; for (const [m, t] of L) { r.led(m); r.say(t, 700); Sfx.tick(.5); await sleep(750); } },
    nose: async () => { r.ripple(); Sfx.ding(); r.expr('wide'); r.look('right'); r.say('Tap! Opening your app.', 1800); await sleep(800); r.look('front'); r.expr('happy'); },
    printer: async () => { r.expr('happy'); r.say('Printing...', 1500); await r.printStrip(1500); },
  };
  let cur = null, tourT = null, touched = false, run = 0;
  async function go(k) {
    const my = ++run; cur = k;
    $$('[data-part]', mr).forEach(el => el.classList.toggle('on', el.dataset.part === k));
    r.reset(); await ACT[k](); if (my === run) setTimeout(() => { if (my === run) { r.reset(); } }, 1200);
  }
  mr.addEventListener('click', e => { const b = e.target.closest('[data-part]'); if (!b || b.tagName === 'path') return; touched = true; clearInterval(tourT); go(b.dataset.part); });
  window.addEventListener('pointermove', e => { const rc = stage.getBoundingClientRect(); if (rc.bottom < 0 || rc.top > innerHeight || r.el.classList.contains('emoji')) return; r.gazeAt(e.clientX, e.clientY); });
  new IntersectionObserver(es => {
    if (es[0].isIntersecting && !touched && !tourT) { let i = 0; go(PARTS[0].k); tourT = setInterval(() => { if (touched) { clearInterval(tourT); return; } i = (i + 1) % PARTS.length; go(PARTS[i].k); }, 3200); }
    else if (!es[0].isIntersecting && tourT) { clearInterval(tourT); tourT = null; }
  }, { threshold: .5 }).observe(stage);
})();
