/* Nibble pitch site — robot simulator + interactive demos */
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
  knock() { this.noise(.05, .3, 0, 180, 'lowpass'); this.noise(.05, .3, .16, 180, 'lowpass'); },
  yawn() { this.tone(520, .9, 'sine', .05, 0, 200); },
  tear() { this.noise(.28, .09, 0, 4200, 'highpass'); },
  tick(p) { this.tone(400 + p * 700, .05, 'triangle', .05); },
};
$('#soundBtn').addEventListener('click', e => {
  Sfx.on = !Sfx.on; e.currentTarget.textContent = Sfx.on ? '🔊 Sound on' : '🔇 Sound off';
  e.currentTarget.setAttribute('aria-pressed', Sfx.on); if (Sfx.on) Sfx.pop();
});

/* ---------------- helpers ---------------- */
function rectOf(x) { return x.getBoundingClientRect ? x.getBoundingClientRect() : x; }
async function fly(from, to, html, { dur = 700, size = 28, arc = -70 } = {}) {
  const a = rectOf(from), b = rectOf(to);
  const ax = a.left + a.width / 2, ay = a.top + a.height / 2, dx = b.left + b.width / 2 - ax, dy = b.top + b.height / 2 - ay;
  const f = document.createElement('div');
  f.className = 'flyer'; f.style.fontSize = size + 'px'; f.innerHTML = html; f.style.left = ax + 'px'; f.style.top = ay + 'px';
  document.body.appendChild(f);
  const anim = f.animate([
    { transform: 'translate(-50%,-50%) scale(1)' },
    { transform: `translate(calc(-50% + ${dx / 2}px), calc(-50% + ${dy / 2 + arc}px)) scale(1.15)` },
    { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(.35)`, opacity: .5 },
  ], { duration: dur, easing: 'cubic-bezier(.45,0,.3,1)' });
  await Promise.race([anim.finished.catch(() => {}), sleep(dur + 150)]); f.remove();
}
function stagePoint(stage, x, y) {
  const r = $('.stage-inner', stage).getBoundingClientRect(), s = r.width / 680;
  return { left: r.left + x * s, top: r.top + y * s, width: 0, height: 0 };
}
function flash(stage) {
  const inner = $('.stage-inner', stage);
  let f = $('.flash', inner); if (!f) { f = document.createElement('div'); f.className = 'flash'; inner.appendChild(f); }
  f.classList.remove('go'); void f.offsetWidth; f.classList.add('go');
}
function setTerm(el, html) { if (el) el.innerHTML = html; }

/* drag with ghost + drop targets; tap without moving -> onClick */
function draggable(el, { targets = () => [], onDrop, onClick, onMove, onEnd }) {
  el.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
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
        document.body.appendChild(ghost); el.style.opacity = '.3';
      }
      ghost.style.left = (r.left + dx) + 'px'; ghost.style.top = (r.top + dy) + 'px';
      onMove && onMove(ev.clientX, ev.clientY);
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
      }
      onEnd && onEnd(!!over);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
  });
}

/* segmented controls */
const segVal = {};
$$('.seg').forEach(seg => {
  const name = seg.dataset.seg, on = $('button.on', seg) || $('button', seg);
  segVal[name] = on.dataset.v;
  seg.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    $$('button', seg).forEach(x => x.classList.toggle('on', x === b));
    segVal[name] = b.dataset.v;
    seg.dispatchEvent(new CustomEvent('segchange', { detail: b.dataset.v }));
  });
});

/* fit 680x400 stages to their container */
function fitStage(st) {
  const s = Math.min(1, st.clientWidth / 680), h = (400 * s) + 'px';
  $('.stage-inner', st).style.transform = `scale(${s})`;
  if (st.style.height !== h) st.style.height = h;
}
const ro = new ResizeObserver(es => es.forEach(e => fitStage(e.target)));
$$('.stage').forEach(st => { fitStage(st); ro.observe(st); });

/* printed receipts in a tray */
async function printReceipt(robot, tray, lines, { tear = true } = {}) {
  tray.innerHTML = '';
  const r = document.createElement('div');
  r.className = 'receipt-out';
  r.innerHTML = lines.map(l => `<div class="rl">${l}</div>`).join('') + (tear ? '<button class="tear">✂ tear off</button>' : '');
  tray.appendChild(r);
  const t = $('.tear', r);
  if (t) t.addEventListener('click', () => { Sfx.tear(); r.classList.add('torn'); setTimeout(() => r.remove(), 700); });
  robot.printStrip(1600);
  requestAnimationFrame(() => requestAnimationFrame(() => r.classList.add('show')));
  await sleep(1650);
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
    const dx = clamp((x - (r.left + r.width / 2)) / 420, -1, 1), dy = clamp((y - (r.top + r.height / 2)) / 320, -1, 1);
    this.vars(dx * 30, -dy * 14, 0, dx * 15, dy * 9);
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
  stretch() { return this.move('stretch', 1600); }
  fall() { return this.move('fall', 2200); }
  wave() { return this.move('wave', 1600); }
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
  state(s) {
    this.reset();
    switch (s) {
      case 'listen': this.led('listen'); this.mouth('o'); this.nod(); this.say("I'm listening…", 2400); break;
      case 'work': this.look('screen'); this.led('think'); this.expr('focus'); break;
      case 'need': this.led('need'); this.expr('wide'); this.el.classList.add('ask'); Sfx.alert(); this.say('Need your OK on this one 👀', 3000); break;
      case 'done': this.led('done'); this.expr('happy'); this.mouth('smile'); this.hop(); Sfx.success(); this.say('All done! ✨', 2500); break;
      case 'error': this.led('error'); this.expr('sad'); this.mouth('wavy'); Sfx.error(); this.say('3 tests failed… 😰', 2800); break;
      case 'away': this.look('right'); this.led('idle'); this.expr('focus'); this.say('Guarding your desk 🛡️', 2500); break;
      case 'back': this.expr('happy'); this.mouth('smile'); this.led('listen'); this.wave(); Sfx.success();
        this.say('Welcome back! 3 things happened while you were away.', 3200); break;
    }
  }
}

/* ---------------- HERO ---------------- */
const rH = new Robot($('#heroRobot'), { nfc: false });
rH.led('listen');
setTimeout(() => rH.say("Hi! I'm Nibble. Feed me a file 🍪", 3500), 700);
let heroIdle = 0;
window.addEventListener('pointermove', e => {
  const r = $('#heroRobot').getBoundingClientRect();
  if (r.bottom < 0 || r.top > innerHeight) return;
  rH.gazeAt(e.clientX, e.clientY); heroIdle = Date.now();
});
const heroLines = ['Hehe, that tickles! 😆', "Drop a PDF on me. I'm hungry.", 'Pat my head to approve things ✋', 'I turn to your screen while I work 💻', 'I can print you a receipt 🧾', 'Tap your phone on my nose 📱'];
let heroI = 0;
$('#heroRobot').addEventListener('click', () => {
  rH.expr('happy'); rH.mouth('smile'); rH.hop(); Sfx.pop();
  rH.say(heroLines[heroI++ % heroLines.length], 2600);
  setTimeout(() => { rH.expr(); rH.mouth(); }, 1400);
});

/* ---------------- DEMO 1: drag to avatar ---------------- */
(() => {
  const st = $('#st-drag'), r = new Robot($('.robot-host', st), { nfc: false }), avatar = $('.avatar', st);
  let busy = false;
  const res = {
    pdf: { icon: '📄', say: '12 pages. Clause 7 has a 20% penalty. Worth a look.', brief: ['📄 Contract_v3.pdf', '12 pages · 3 flags', '⚠️ Clause 7: 20% penalty'], lvl: 'y' },
    link: { icon: '🔗', say: 'Two issues: a missing null check on line 45, and a SQL injection risk.', brief: ['🔗 Review: PR #231', '2 issues · 1 critical', '⛔ SQL injection db.ts:88'], lvl: 'r' },
    audio: { icon: '🎙️', say: '42-minute standup → 5 action items. Sent to everyone.', brief: ['🎙️ Standup notes', '42 min · 5 to-dos', '✅ Sent to 4 owners'], lvl: 'g' },
  };
  async function feed(file) {
    if (busy || file.classList.contains('eaten')) return; busy = true;
    const k = file.dataset.kind; r.reset();
    file.classList.add('eaten');
    await fly(file, avatar, res[k].icon, { dur: 450, arc: -30 });
    avatar.classList.add('chomp'); Sfx.chomp();
    r.look('left'); r.mouth('open'); r.expr('wide');
    await sleep(500); avatar.classList.remove('chomp');
    await fly(avatar, r.mouthEl, res[k].icon, { dur: 700, size: 30 });
    Sfx.chomp(); r.expr();
    await r.chew(1700);
    r.look('front'); r.led('done'); r.expr('happy'); r.mouth('smile'); r.hop(); Sfx.success();
    await sleep(450);
    r.brief(res[k].brief, res[k].lvl); r.say(res[k].say, 5200);
    busy = false;
  }
  $$('.file', st).forEach(f => draggable(f, { targets: () => [avatar, r.headEl], onDrop: () => feed(f), onClick: () => feed(f) }));
  $('[data-reset="drag"]').addEventListener('click', () => { $$('.file', st).forEach(f => f.classList.remove('eaten')); r.reset(); busy = false; });
})();

/* ---------------- DEMO 2: NFC ---------------- */
(() => {
  const st = $('#st-nfc'), r = new Robot($('.robot-host', st)), phone = $('#nfcPhone'), scr = $('.phone-screen', phone);
  let busy = false, view = 'home', hasResult = false, waitingOwner = false;
  const items = [
    { k: 'photo', i: '🧾', n: 'Receipt.jpg' }, { k: 'shot', i: '🖼️', n: 'Screenshot' },
    { k: 'pdf', i: '📄', n: 'Proposal.pdf' }, { k: 'link', i: '🔗', n: 'Article link' },
  ];
  const homeHTML = (msg, bg) => `<div class="ps" ${bg ? `style="background:${bg}"` : ''}><div class="ps-time">10:24</div><div class="ps-msg">${msg}</div></div>`;
  function render(v, data) {
    view = v;
    if (v === 'home') scr.innerHTML = homeHTML(segVal.nfcMode === 'take' ? 'Tap me on Nibble to take results back →' : "Tap me on Nibble's orange nose →");
    if (v === 'stranger') scr.innerHTML = homeHTML("Visitor's phone<br>(not paired)", 'linear-gradient(160deg,#5BC0EB,#2F6BFF)');
    if (v === 'banner') {
      scr.innerHTML = homeHTML('…') + `<div class="ps-banner"><b>📎 Nibble · Desk 12</b>App Clip · tap to upload</div>`;
      $('.ps-banner', scr).addEventListener('click', e => { e.stopPropagation(); Sfx.pop(); render('upload'); });
    }
    if (v === 'upload') {
      scr.innerHTML = `<div class="ps light"><h5>Send to Nibble 🤖</h5><div class="ps-sub">Desk 12 · Lin's desk</div>
        <div class="ps-sub" style="margin-top:3px">Recent</div>
        <div class="ps-grid">${items.map(it => `<div class="ps-item" data-k="${it.k}"><span>${it.i}</span>${it.n}</div>`).join('')}</div>
        <div class="ps-browse">Browse files…</div></div>`;
      $$('.ps-item', scr).forEach(el => el.addEventListener('click', e => { e.stopPropagation(); upload(el.dataset.k); }));
    }
    if (v === 'progress') {
      scr.innerHTML = `<div class="ps light ps-center"><div class="ps-big">${data}</div><h5>Sending to Nibble…</h5><div class="ps-bar"><i></i></div><div class="ps-sub">via Wi-Fi · any size</div></div>`;
      requestAnimationFrame(() => requestAnimationFrame(() => { const i = $('.ps-bar i', scr); if (i) i.style.width = '100%'; }));
    }
    if (v === 'sent') scr.innerHTML = `<div class="ps light ps-center"><div class="ps-big">✅</div><h5>Handed to Nibble</h5><div class="ps-sub">Switch to "Take it back" and tap again</div></div>`;
    if (v === 'received') scr.innerHTML = `<div class="ps light"><div class="ps-big" style="margin-top:6px">📥</div><h5 class="ps-center">From Nibble</h5><div class="ps-card"><b>Standup_notes.md</b><br>• Ship v2 next Fri<br>• Wang: payments<br>• Budget +$2k (pending)</div></div>`;
    if (v === 'wait') scr.innerHTML = `<div class="ps light ps-center"><div class="ps-big">⏳</div><h5>Waiting for the owner…</h5><div class="ps-sub">Nibble asked its owner to pat its head</div></div>`;
  }
  async function tap() {
    if (busy) return; busy = true;
    phone.classList.remove('bump'); void phone.offsetWidth; phone.classList.add('bump');
    Sfx.ding(); r.reset();
    const mode = segVal.nfcMode;
    if (mode === 'give') {
      r.expr('wide'); r.led('listen'); r.say('Ding! 📲 Opening your upload page…', 2200);
      await sleep(450);
      render(segVal.nfcOS === 'ios' ? 'banner' : 'upload');
      r.expr();
    } else if (mode === 'take') {
      r.look('right'); r.mouth('open'); Sfx.whoosh();
      await fly(r.mouthEl, scr, '📄', { dur: 650 });
      r.mouth('smile'); r.expr('happy'); render('received'); r.wave();
      r.say(hasResult ? 'Here are your results. Take them to go 👋' : 'Here are the standup notes. Take them to go 👋', 3200);
      await sleep(400); r.look('front');
    } else {
      render('wait'); r.recoil(); r.expr('wide'); Sfx.alert();
      r.brief(['📱 Unknown phone', 'iPhone · not paired', 'Pat my head to allow'], 'y');
      r.el.classList.add('ask'); r.led('need'); waitingOwner = true;
      r.say('Who are you? 🤨 Owner, pat my head to let this phone in once.', 4200);
    }
    busy = false;
  }
  r.headEl.addEventListener('click', () => {
    if (!waitingOwner) return; waitingOwner = false;
    r.reset(); Sfx.pop(); r.expr('happy'); r.mouth('smile'); r.nod(); r.say('Okay, welcome! You can upload once.', 2600);
    render('upload');
  });
  async function upload(k) {
    if (busy) return; busy = true;
    const it = items.find(x => x.k === k); render('progress', it.i);
    await sleep(900); render('sent'); hasResult = true;
    r.reset();
    await fly(scr, r.headEl, it.i, { dur: 600 });
    if (k === 'photo') {
      r.expr('closed'); await sleep(140); r.expr('wide'); Sfx.pop(); await sleep(300);
      r.expr('happy'); r.led('done'); r.brief(['🧾 Receipt.jpg', '$86.40 · Lunch · Nov 20', '✅ Added to expenses'], 'g');
      r.say('A receipt: $86.40 lunch. Added to your expense report ✓', 4000);
    } else if (k === 'shot') {
      r.expr('closed'); await sleep(140); r.expr('wide'); await sleep(400);
      r.brief(['🖼️ Screenshot', 'TypeError · checkout.ts:42', '→ Claude Code is on it'], 'y');
      r.say("That's a TypeError in checkout.ts. I've asked Claude Code to look.", 4000);
      await sleep(1600); r.look('left'); r.led('think'); r.expr('focus');
    } else if (k === 'pdf') {
      r.mouth('open'); Sfx.chomp(); await sleep(300); await r.chew(1400);
      r.expr('happy'); r.led('done'); r.brief(['📄 Proposal.pdf', '18 pages → 3 key points', '🖨 Want them printed?'], 'g');
      r.say('18-page proposal → 3 key points. Want them printed?', 4000);
    } else {
      r.look('up'); r.mouth('sniff'); r.say('*sniff sniff* 👃', 1400); await sleep(1300);
      r.mouth(); r.look('front'); r.expr('happy'); r.brief(['🔗 Article', '"Building MCP servers"', '📚 Saved to read-later'], 'b');
      r.say('An article about MCP. Saved to read-later.', 3500);
    }
    busy = false;
  }
  draggable(phone, {
    targets: () => [r.nfcEl, r.bodyEl],
    onDrop: () => tap(),
    onClick: async () => {
      if (view === 'banner' || view === 'upload') return;
      phone.animate([{ transform: 'none' }, { transform: 'translate(-120px,-70px) rotate(-10deg)' }, { transform: 'none' }], { duration: 900, easing: 'ease-in-out' });
      await sleep(420); tap();
    },
  });
  $('[data-seg="nfcMode"]').addEventListener('segchange', e => { r.reset(); waitingOwner = false; render(e.detail === 'stranger' ? 'stranger' : 'home'); });
  $('[data-seg="nfcOS"]').addEventListener('segchange', () => { if (segVal.nfcMode !== 'stranger') render('home'); });
  render('home');
})();

/* ---------------- DEMO 3: hold paper up ---------------- */
(() => {
  const st = $('#st-show'), r = new Robot($('.robot-host', st), { nfc: false });
  let busy = false;
  async function show(item) {
    if (busy) return; busy = true;
    const k = item.dataset.kind; r.reset();
    if (k === 'blurry') {
      r.look('tilt'); r.expr('squint'); r.mouth('wavy'); r.say('Hmm, too blurry… hold it closer? 🤏', 3000);
      await sleep(1800); r.reset(); busy = false; return;
    }
    r.look('front'); r.expr('wide'); await sleep(250);
    await r.snap(st);
    item.classList.add('done');
    r.nod(); r.led('think'); r.expr('focus'); await sleep(900);
    r.expr('happy'); r.mouth('smile'); r.led('done'); Sfx.success();
    if (k === 'receipt') { r.brief(["🧾 Joe's Pizza", '$32.40 · Lunch · Nov 20', '✅ Added to Nov expenses'], 'g'); r.say('Got it. Logged to your expense report.', 3500); }
    if (k === 'note') { r.brief(['📝 Sticky note', '"Call client back"', '⏰ Reminder: Fri 10:00'], 'y'); r.say('Reminder set for Friday 10am ☎️', 3500); }
    if (k === 'board') {
      r.brief(['✏️ Login page sketch', '2 fields · 1 button', '→ Sent to Claude Code'], 'b'); r.say('Building this login page now!', 3000);
      await sleep(2200); r.unbrief(); r.mouth(); r.look('left'); r.led('think'); r.expr('focus'); r.say('Working on it… 💻', 2200);
    }
    busy = false;
  }
  $$('.pitem', st).forEach(p => draggable(p, {
    targets: () => [r.headEl],
    onMove: (x, y) => { if (!busy) { r.gazeAt(x, y); r.expr('wide'); } },
    onDrop: () => show(p),
    onEnd: hit => { if (!hit && !busy) { r.look('front'); r.expr(); } },
    onClick: () => show(p),
  }));
  $('[data-reset="show"]').addEventListener('click', () => { $$('.pitem', st).forEach(p => p.classList.remove('done')); r.reset(); busy = false; });
})();

/* ---------------- DEMO 4: body language ---------------- */
(() => {
  const st = $('#st-body'), r = new Robot($('.robot-host', st), { nfc: false }), term = $('#bodyTerm'), tray = $('#bodyTray'), cap = $('#bodyCaption');
  const T = {
    listen: ['$ nibble listen\n&gt; "fix the login bug"', 'Facing you, eyes on you, nodding. It heard you.'],
    work: ['<span class="dim">claude-code ▸ running…</span>\n✎ editing auth.ts\n✎ editing login.tsx\n▶ npm test', 'It turns to face your laptop. Blue LED scanning = working. You can look away.'],
    need: ['<span class="warn">? Allow: run DB migration</span>\n  ALTER TABLE users…\n<span class="dim">waiting for approval</span>', 'It turns back to you, eyes wide, yellow blinking, head glowing. Visible from across the room.'],
    done: ['<span class="ok">✓ 42 tests passed</span>\n<span class="ok">✓ login bug fixed</span>', 'A happy hop and a green LED. No need to check the window.'],
    error: ['<span class="err">✗ 3 tests failed</span>\n  auth.spec.ts:18\n  auth.spec.ts:44', 'Worried face, sweat drop, red blink.'],
    away: ['<span class="dim">screen locked 🔒</span>', 'You walked away, so it watches your empty chair and guards your desk.'],
    back: ['<span class="ok">welcome back 👋</span>', 'You sit down: it waves and prints what happened while you were gone.'],
  };
  let auto = null;
  function go(s) {
    $$('#d-body [data-state]').forEach(b => b.classList.toggle('on', b.dataset.state === s));
    setTerm(term, T[s][0]); cap.textContent = T[s][1]; tray.innerHTML = '';
    r.state(s);
    if (s === 'back') printReceipt(r, tray, ['WHILE YOU WERE AWAY', '------------------', '• PR #231 approved', '• Missed call: Mom', '• Build passed ✓']);
  }
  $$('#d-body [data-state]').forEach(b => b.addEventListener('click', () => { stop(); go(b.dataset.state); }));
  const order = ['listen', 'work', 'need', 'done', 'error', 'away', 'back'];
  function stop() { if (auto) { clearInterval(auto); auto = null; $('#bodyAuto').textContent = '▶ Auto-cycle'; } }
  $('#bodyAuto').addEventListener('click', () => {
    if (auto) return stop();
    let i = 0; go(order[i]);
    auto = setInterval(() => { i = (i + 1) % order.length; go(order[i]); }, 3200);
    $('#bodyAuto').textContent = '■ Stop';
  });
  setTerm(term, '<span class="dim">idle</span>');
})();

/* ---------------- DEMO 5: output ---------------- */
(() => {
  const st = $('#st-output'), r = new Robot($('.robot-host', st), { nfc: false }), tray = $('#outTray'), desk = $('#outDesktop'), avatar = $('.avatar', st);
  let busy = false;
  $('#outLaptop').addEventListener('click', async () => {
    if (busy) return; busy = true; r.reset();
    r.look('left'); r.mouth('open'); r.expr('wide'); Sfx.whoosh(); await sleep(300);
    await fly(r.mouthEl, avatar, '📝', { dur: 650 });
    avatar.classList.add('chomp'); await sleep(300); avatar.classList.remove('chomp');
    const f = document.createElement('div'); f.className = 'file new'; f.innerHTML = '<span class="fi">📝</span><span>Summary.md</span>';
    if (desk.children.length > 5) desk.innerHTML = '';
    desk.appendChild(f); Sfx.pop();
    r.mouth('smile'); r.expr('happy'); r.say('Your summary is on your desktop 👈', 3000);
    await sleep(1400); r.look('front'); busy = false;
  });
  const P = {
    todo: ['NIBBLE · THU NOV 20', '------------------', '[ ] Fix login #231', "[ ] Review Wang's PR", '[ ] 2pm standup', '(!) CI failed 2x', '------------------', 'you got this ☕'],
    meeting: ['STANDUP · 42 MIN', '------------------', '1 Ship v2 next Fri', '2 Wang: payments', '3 +$2k budget (TBD)', '------------------', '5 to-dos synced ✓'],
    decision: ['DECISION RECEIPT', '------------------', '✓ EXECUTED', 'Nov 20 · 14:03', 'Sent: Nov_exp.xlsx', 'To: finance@', 'Confirmed: pat ×1', 'Undo window closed'],
    win: ['🏆 THIS WEEK', '------------------', 'Bugs fixed     12', 'PRs merged      7', 'Hours saved   6.5', '------------------', 'proud of you 🎉'],
  };
  $$('#d-output [data-print]').forEach(b => b.addEventListener('click', async () => {
    if (busy) return; busy = true; r.reset(); r.expr('happy'); r.mouth('smile'); r.say('Printing… 🖨', 1600);
    await printReceipt(r, tray, P[b.dataset.print]); r.mouth(); busy = false;
  }));
  const B = {
    g: [['🗂 Tidy Downloads', 'Move 23 files', '✅ Undo anytime'], "Low risk. I'll just do it.", ''],
    y: [['📧 Send email', '→ Finance (3 people)', '⚠️ Attachment 2.3 MB'], 'Take a quick look before I send.', 'need'],
    r: [['💳 Payment', '$1,280 → Acme Supply', '⛔ First-time payee'], 'High risk. Read this carefully.', 'error'],
  };
  $$('#d-output [data-brief]').forEach(b => b.addEventListener('click', () => {
    const [lines, text, led] = B[b.dataset.brief]; r.reset(); r.brief(lines, b.dataset.brief); r.say(text, 3000);
    if (led) r.led(led); else r.led('done');
    if (b.dataset.brief === 'r') { r.recoil(); Sfx.alert(); } else Sfx.pop();
  }));
})();

/* ---------------- DEMO 6: confirm ---------------- */
(() => {
  const st = $('#st-confirm'), r = new Robot($('.robot-host', st), { nfc: false }), term = $('#confirmTerm'), tray = $('#confirmTray'),
    log = $('#confirmLog'), chip = $('#undoChip');
  let pending = null, undoTimer = null, undoLeft = 0, covered = false, laid = false;
  function addLog(t) {
    const e = $('.log-empty', log); if (e) e.remove();
    const d = document.createElement('div'); const now = new Date();
    d.textContent = `${now.toTimeString().slice(0, 5)}  ${t}`; log.prepend(d);
  }
  function stopUndo() { clearInterval(undoTimer); undoTimer = null; chip.classList.remove('show'); }
  const REQ = {
    g: { brief: ['🗂 Tidy Downloads', 'Move 23 files', '✅ Undo anytime'], term: '✎ moving 23 files → ~/Archive' },
    y: { brief: ['📧 Send email', '→ Finance (3 people)', '⚠️ Nov_expenses.xlsx'], term: '✉ draft: "Nov expenses"\n  to: finance@ (3)\n<span class="warn">? needs approval</span>' },
    r: { brief: ['💳 Payment', '$1,280 → Acme Supply', '⛔ First-time payee'], term: '💳 pay invoice #8812\n  $1,280.00 → Acme\n<span class="err">? HIGH RISK approval</span>' },
  };
  $('#confirmGo').addEventListener('click', async () => {
    stopUndo(); covered = false; laid = false; r.reset(); tray.innerHTML = '';
    const lvl = segVal.risk; pending = null;
    setTerm(term, '<span class="dim">agent ▸ planning…</span>'); r.look('screen'); r.led('think'); r.expr('focus');
    await sleep(1000);
    setTerm(term, REQ[lvl].term); r.look('front'); r.expr('wide'); r.brief(REQ[lvl].brief, lvl);
    if (lvl === 'g') { r.expr('happy'); r.led('done'); r.say('Small stuff. I just did it ✓', 3000); addLog('🟢 Tidied 23 files: auto-approved (low risk)'); return; }
    r.led('need'); r.el.classList.add('ask'); Sfx.alert(); pending = lvl;
    r.say(lvl === 'y' ? 'Pat my head to send. Push me away to cancel.' : 'High risk! Hold my head for 3 seconds.', 0);
  });
  function approve(lvl) {
    pending = null; r.el.classList.remove('ask', 'holding'); r.setRing(0); r.unbrief();
    r.expr('happy'); r.mouth('smile'); r.led('done'); r.nod(); Sfx.success();
    if (lvl === 'y') {
      setTerm(term, '<span class="ok">✓ email sent</span>');
      r.say('Sent ✓ Pat my back within 10 s to undo.', 3500); addLog('🟡 Email to Finance: approved with a pat');
      undoLeft = 10; $('span', chip).textContent = undoLeft; chip.classList.add('show');
      undoTimer = setInterval(() => { undoLeft--; $('span', chip).textContent = undoLeft; if (undoLeft <= 0) stopUndo(); }, 1000);
    } else {
      setTerm(term, '<span class="ok">✓ payment submitted</span>');
      r.say("Phew. Payment submitted. Here's your decision receipt.", 3500); addLog('🔴 $1,280 to Acme: approved with a 3 s hold');
      printReceipt(r, tray, ['DECISION RECEIPT', '------------------', '✓ PAID $1,280.00', 'To: Acme Supply', 'Inv #8812', 'Confirmed: hold 3s', new Date().toLocaleString()]);
    }
  }
  function reject() {
    const lvl = pending; pending = null; r.el.classList.remove('ask', 'holding'); r.setRing(0); r.unbrief();
    r.look('right'); r.expr('sad'); r.mouth('flat'); Sfx.error();
    setTerm(term, '<span class="dim">✗ cancelled by you</span>');
    r.say("Okay, cancelled. I won't do it.", 2600); addLog(`✋ Rejected: ${lvl === 'y' ? 'email to Finance' : '$1,280 payment'} (pushed away)`);
    setTimeout(() => { r.look('front'); r.expr(); r.mouth(); }, 1600);
  }
  // head gestures
  let down = null, raf = null, done = false;
  r.headEl.addEventListener('pointerdown', e => {
    if (!pending) return;
    e.preventDefault(); try { r.headEl.setPointerCapture(e.pointerId); } catch (err) { /* synthetic pointer */ }
    down = { x: e.clientX, t: performance.now() }; done = false;
    if (pending === 'r') {
      r.el.classList.add('holding'); r.expr('tense'); let lastTick = 0;
      clearInterval(raf);
      raf = setInterval(() => {
        if (!down || done) { clearInterval(raf); return; }
        const p = (performance.now() - down.t) / 3000; r.setRing(p);
        if (p - lastTick > .2) { lastTick = p; Sfx.tick(p); }
        if (p >= 1) { done = true; clearInterval(raf); approve('r'); }
      }, 30);
    }
  });
  r.headEl.addEventListener('pointermove', e => {
    if (!down || done || !pending) return;
    const dx = e.clientX - down.x;
    r.vars(clamp(dx * .6, -40, 40), 0, clamp(dx * .1, -8, 8), clamp(dx * .2, -15, 15), 0);
    if (Math.abs(dx) > 60) { done = true; clearInterval(raf); reject(); }
  });
  const end = e => {
    if (!down) return;
    const dx = e.clientX - down.x, dt = performance.now() - down.t; clearInterval(raf);
    const lvl = pending; down = null;
    if (done || !lvl) return;
    r.look('front');
    if (lvl === 'y' && Math.abs(dx) < 12) approve('y');
    else if (lvl === 'r') {
      r.el.classList.remove('holding'); r.setRing(0); r.expr('wide');
      r.say(dt < 400 ? 'A pat isn\'t enough for this one. Hold for 3 s.' : 'Not long enough. Nothing happened. Hold for 3 s.', 0);
    }
  };
  r.headEl.addEventListener('pointerup', end); r.headEl.addEventListener('pointercancel', end);
  r.bodyEl.addEventListener('click', () => {
    if (!undoTimer) return; stopUndo();
    r.expr('wide'); r.led('need'); r.recoil(); Sfx.whoosh();
    setTerm(term, '<span class="warn">↩ email recalled</span>');
    r.say('Unsent! ↩ It never left your outbox.', 3000); addLog('↩ Email to Finance: undone with a pat on the back');
    setTimeout(() => { r.expr(); r.led('idle'); }, 1500);
  });
  // extra controls
  function wake() {
    Sfx.knock(); laid = false; covered = false; r.moveEl.classList.remove('lay', 'freeze');
    r.reset(); r.hop(); r.expr('happy'); r.mouth('smile'); r.led('listen'); r.say("I'm here! 👋", 2200);
  }
  $$('#d-confirm [data-x]').forEach(b => b.addEventListener('click', () => {
    const x = b.dataset.x; stopUndo();
    if (x === 'stop') {
      pending = null; r.reset(); r.moveEl.classList.add('freeze'); r.led('red'); r.emoji('✋'); Sfx.error();
      setTerm(term, '<span class="err">■ ALL AGENTS STOPPED</span>');
      r.say('Stopped everything immediately.', 3000); addLog('✋ Emergency stop (palm gesture)');
    }
    if (x === 'eyes') {
      covered = !covered; r.reset();
      if (covered) { r.expr('closed'); r.led('off'); r.emoji('🙈', 1200); r.say("Privacy mode: I can't see or hear 🙈", 2600); addLog('🙈 Privacy mode on'); }
      else { r.say("I'm back 👀", 1800); addLog('👀 Privacy mode off'); }
    }
    if (x === 'dnd') {
      laid = !laid; r.reset();
      if (laid) { r.moveEl.classList.add('lay'); r.expr('sleep'); r.led('off'); r.say('Do not disturb 😴', 2000); addLog('😴 Do-not-disturb on'); }
      else wake();
    }
    if (x === 'wake') wake();
  }));
  $('#confirmDesk').addEventListener('dblclick', wake);
  setTerm(term, '<span class="dim">idle</span>');
})();

/* ---------------- DEMO 7: wow moments ---------------- */
(() => {
  const st = $('#st-wow'), r = new Robot($('.robot-host', st), { nfc: false }), term = $('#wowTerm'), tray = $('#wowTray'), sky = $('#wowSky');
  let follow = false;
  const followBtn = $('#d-wow [data-wow="follow"]');
  window.addEventListener('pointermove', e => { if (follow) r.gazeAt(e.clientX, e.clientY); });
  function sparks() {
    const head = r.headEl.getBoundingClientRect(), inner = $('.stage-inner', st).getBoundingClientRect(), s = inner.width / 680;
    const cx = (head.left + head.width / 2 - inner.left) / s, cy = (head.top - inner.top) / s;
    for (let i = 0; i < 16; i++) {
      const sp = document.createElement('div'); sp.className = 'spark'; sp.textContent = ['✨', '🎉', '⭐', '🎆'][i % 4];
      sp.style.left = cx + 'px'; sp.style.top = cy + 'px';
      const a = (i / 16) * Math.PI * 2, d = 90 + Math.random() * 60;
      sp.style.setProperty('--dx', Math.cos(a) * d + 'px'); sp.style.setProperty('--dy', Math.sin(a) * d - 30 + 'px');
      sky.appendChild(sp); setTimeout(() => sp.remove(), 1300);
    }
  }
  const W = {
    back: () => { r.state('back'); setTerm(term, '<span class="ok">welcome back 👋</span>'); printReceipt(r, tray, ['WHILE YOU WERE AWAY', '------------------', '• 2 agents finished', '• 1 needs approval', '• Wang left a file']); },
    stretch: async () => { r.expr('happy'); r.say("You've been sitting for 90 min. Stretch with me! 🧘", 3500); await r.stretch(); r.stretch(); },
    late: async () => { r.hat('🌙'); r.expr('squint'); r.mouth('open'); Sfx.yawn(); r.say("It's 1 a.m.… *yawn* Save and go to bed? 🌙", 3800); await sleep(1200); r.mouth('o'); },
    meeting: async () => { r.led('off'); r.emoji('🔇', 1600); r.mouth('flat'); setTerm(term, '<span class="dim">📹 Zoom: in a call</span>'); r.say("You're on a call. I'll stay quiet.", 2600); },
    focus: () => { r.hat('🎧'); r.expr('sleep'); r.led('off'); setTerm(term, '<span class="dim">focus · 50:00</span>'); r.say('Focus mode: 50 min. Only urgent stuff gets through.', 3500); },
    fail: async () => { setTerm(term, '<span class="err">✗ build failed</span>\n  tsc: 4 errors'); Sfx.error(); r.expr('sad'); r.led('error'); r.fall(); await sleep(2100); r.say("Build failed! …I'm okay 🩹", 2600); },
    merge: () => { setTerm(term, '<span class="ok">✓ PR #231 merged into main</span>'); r.emoji('🎆', 2000); r.led('done'); r.hop(); sparks(); Sfx.success(); r.say('PR merged! 🎉', 2400); },
    big: () => { r.hat('👷'); r.look('screen'); r.led('think'); r.expr('focus'); setTerm(term, '<span class="dim">refactor ▸ 37/120 files</span>\n✎ src/payments/*'); r.say('Big refactor in progress. Hard hat on 👷', 3000); },
  };
  $$('#d-wow [data-wow]').forEach(b => b.addEventListener('click', () => {
    const k = b.dataset.wow;
    if (k === 'follow') {
      follow = !follow; followBtn.classList.toggle('on', follow); r.reset();
      r.say(follow ? "I'm watching you 👀 (move your mouse anywhere)" : 'Okay, I stopped staring 😅', 2600); return;
    }
    follow = false; followBtn.classList.remove('on');
    $$('#d-wow [data-wow]').forEach(x => x.classList.toggle('on', x === b));
    r.reset(); tray.innerHTML = ''; W[k]();
  }));
  setTerm(term, '<span class="dim">idle</span>');
})();

/* ---------------- DEMO 8: social ---------------- */
(() => {
  const st = $('#st-social'), r = new Robot($('.robot-host', st)), A = $('#phoneA'), B = $('#phoneB'), card = $('#socialCard'), cap = $('#socialCaption');
  let step = 0, busy = false, askCal = false;
  const scr = p => $('.phone-screen', p);
  const home = (p, name, msg) => { scr(p).innerHTML = `<div class="ps"><div class="ps-time">12:41</div><div class="ps-name">${name}</div><div class="ps-msg">${msg}</div></div>`; };
  const cardOn = (p, html) => { scr(p).innerHTML = `<div class="ps light"><div style="height:8px"></div><div class="ps-card">${html}</div></div>`; };
  const M = {
    card: { first: 'A', cap0: "Tap Lin's phone first." },
    aa: { first: 'A', cap0: "Lin paid for coffee. Tap Lin's phone." },
    msg: { first: 'A', cap0: "Lin wants to leave Wang a file. Tap Lin's phone." },
    cal: { first: 'A', cap0: "Tap Lin's phone to start." },
    kudos: { first: 'A', cap0: "Lin wants to thank Wang. Tap Lin's phone." },
    guest: { first: 'B', cap0: "A visitor arrives. Tap the visitor's phone." },
  };
  function reset() {
    step = 0; busy = false; askCal = false; r.reset(); card.classList.remove('show');
    const m = segVal.social;
    home(A, 'Lin', 'Tap me on Nibble →');
    if (m === 'guest') { home(B, 'Visitor · Alex', '← Tap me on Nibble'); scr(B).firstChild.style.background = 'linear-gradient(160deg,#5BC0EB,#2F6BFF)'; }
    else home(B, 'Wang', '← Tap me on Nibble');
    cap.textContent = M[m].cap0;
  }
  async function printCard(lines) {
    card.classList.remove('show'); card.innerHTML = lines.map((l, i) => i ? `<div>${l}</div>` : `<b>${l}</b>`).join('');
    r.printStrip(1400); await sleep(250); card.classList.add('show');
  }
  async function tap(who) {
    if (busy) return;
    const m = segVal.social, cfg = M[m];
    const expected = step === 0 ? cfg.first : (cfg.first === 'A' ? 'B' : 'A');
    if (step >= 2 || (m === 'kudos' && step >= 1) || (m === 'guest' && step >= 1)) { r.say('All done here. Hit reset to try again 🙂', 2000); return; }
    if (who !== expected) { r.shake(); r.say(`One at a time. Tap ${expected === 'A' ? "Lin's" : (m === 'guest' ? "the visitor's" : "Wang's")} phone first.`, 2400); return; }
    busy = true;
    const p = who === 'A' ? A : B;
    p.animate([{ transform: 'none' }, { transform: `translateX(${who === 'A' ? 120 : -110}px) rotate(${who === 'A' ? 8 : -8}deg)` }, { transform: 'none' }], { duration: 800, easing: 'ease-in-out' });
    await sleep(380); Sfx.ding(); r.reset();
    r.look(who === 'A' ? 'left' : 'right'); r.expr('wide'); r.led('listen');
    await sleep(300);
    if (m === 'card') {
      if (step === 0) { r.say('Hi Lin! Waiting for one more phone…', 0); cardOn(A, '⏳ Waiting for the other phone…'); cap.textContent = "Now tap Wang's phone."; }
      else {
        r.look('front'); r.expr('happy'); r.mouth('smile'); r.hop(); Sfx.success(); r.say('Contacts swapped! Printing a conversation starter 🖨', 3200);
        cardOn(A, '✅ <b>Connected on LinkedIn</b><br>Wang · MEng CS'); cardOn(B, '✅ <b>Connected on LinkedIn</b><br>Lin · MBA');
        await printCard(['🤝 LIN × WANG', 'Both at Cornell Tech · both into fintech', 'Talk about: you both build AI agents ✨', 'LinkedIn connected ✓']);
        cap.textContent = 'The printed card gives them something to talk about. This is the moment people film.';
      }
    }
    if (m === 'aa') {
      if (step === 0) { r.say('Coffee for two: $23.40. Who is splitting? ☕', 0); cardOn(A, '☕ Paid $23.40<br>Splitting with…'); cap.textContent = "Tap Wang's phone to split."; }
      else {
        r.look('front'); r.expr('happy'); Sfx.success(); r.brief(['💰 Coffee run', '$23.40 ÷ 2', '$11.70 each'], 'g'); r.say('Split evenly: $11.70 each ✓', 3000);
        cardOn(B, '💸 <b>Venmo request</b><br>$11.70 → Lin<br><u>Pay now</u>'); cardOn(A, '✅ Request sent to Wang<br>$11.70');
        cap.textContent = 'Split done in two taps. Nibble only creates the request; each person approves the payment in their own app.';
      }
    }
    if (m === 'msg') {
      if (step === 0) { r.hat('📦'); r.expr('happy'); r.say("Got it. I'll hold this for Wang 📦", 0); cardOn(A, '📎 Left <b>Design.fig</b> for Wang<br>"look before 3pm"'); cap.textContent = "Later, Wang comes back to his desk. Tap Wang's phone."; }
      else {
        r.hat(null); r.wave(); r.expr('happy'); r.mouth('smile'); Sfx.success(); r.say('Wang! Lin left you a design file 📎', 3200);
        cardOn(B, '📥 <b>From Lin</b><br>Design.fig<br>"look before 3pm"'); cap.textContent = 'Nibble was the messenger. No Slack ping lost in the noise.';
      }
    }
    if (m === 'cal') {
      if (step === 0) { r.led('think'); r.look('screen'); r.say("Checking Lin's calendar…", 0); cardOn(A, '📅 Sharing calendar…'); cap.textContent = "Tap Wang's phone."; }
      else {
        r.look('front'); r.led('need'); r.brief(['📅 Lin + Wang', 'Thu 3:00 pm: both free', 'Pat my head to invite'], 'b'); r.el.classList.add('ask');
        r.say('Found a time! Pat my head to send invites.', 0); askCal = true; cap.textContent = "Pat Nibble's head to confirm.";
      }
    }
    if (m === 'kudos') {
      r.look('front'); r.expr('happy'); r.mouth('smile'); r.hop(); Sfx.success(); r.say('Kudos for Wang! Printing a thank-you 🙌', 3000);
      cardOn(A, '🙌 Kudos sent to Wang'); cardOn(B, '🙌 <b>You got kudos</b><br>from Lin');
      await printCard(['🙌 THANK YOU, WANG', 'for reviewing the payments module', '— Lin · Nov 20']);
      cap.textContent = 'One tap and a printed thank-you note lands on the desk.';
    }
    if (m === 'guest') {
      r.wave(); r.expr('happy'); r.mouth('smile'); Sfx.success(); r.say("Welcome, Alex! I've let Lin know you're here 👋", 3400);
      cardOn(A, '👋 <b>Alex has arrived</b><br>at reception'); cardOn(B, '📶 Joined CT-Guest Wi-Fi ✓');
      await printCard(['👋 WELCOME, ALEX', 'Wi-Fi: CT-Guest', 'Password: nibble-2026', 'Lin is on the way']);
      cap.textContent = 'Visitor check-in with no app needed (App Clip). The host gets notified.';
    }
    step++; busy = false;
  }
  r.headEl.addEventListener('click', () => {
    if (!askCal) return; askCal = false; r.el.classList.remove('ask'); r.unbrief();
    r.expr('happy'); r.mouth('smile'); r.nod(); r.led('done'); Sfx.success(); r.say('Invites sent ✓ Thu 3:00 pm coffee chat', 3000);
    cardOn(A, '📅 <b>Thu 3:00 pm</b><br>Coffee chat w/ Wang<br>Added ✓'); cardOn(B, '📅 <b>Thu 3:00 pm</b><br>Coffee chat w/ Lin<br>Added ✓');
    cap.textContent = 'Two taps and a pat: meeting booked.';
  });
  draggable(A, { targets: () => [r.bodyEl, r.headEl], onDrop: () => tap('A'), onClick: () => tap('A') });
  draggable(B, { targets: () => [r.bodyEl, r.headEl], onDrop: () => tap('B'), onClick: () => tap('B') });
  $('[data-seg="social"]').addEventListener('segchange', reset);
  $('#socialReset').addEventListener('click', reset);
  reset();
})();

/* ---------------- DAY IN THE LIFE ---------------- */
(() => {
  const st = $('#st-day'), r = new Robot($('.robot-host', st)), tray = $('#dayTray'), term = $('#dayTerm'), desk = $('#dayDesktop'),
    avatar = $('.avatar', st), clock = $('#dayClock'), cap = $('#dayCaption'), tl = $('#timeline');
  let running = false, token = 0;
  const right = () => stagePoint(st, 690, 150), below = () => stagePoint(st, 420, 420);
  const patHead = async () => { await fly(below(), r.headEl, '✋', { dur: 650, arc: 0, size: 34 }); Sfx.pop(); };
  const dropFile = async (icon, name) => {
    desk.innerHTML = `<div class="file new"><span class="fi">${icon}</span><span>${name}</span></div>`; term.style.display = 'none';
    await sleep(500);
    const f = $('.file', desk); await fly(f, avatar, icon, { dur: 500, arc: -30 }); f.classList.add('eaten');
    avatar.classList.add('chomp'); Sfx.chomp(); r.look('left'); r.mouth('open'); r.expr('wide');
    await sleep(450); avatar.classList.remove('chomp');
    await fly(avatar, r.mouthEl, icon, { dur: 650 }); r.expr(); await r.chew(1500); r.look('front');
  };
  const showTerm = html => { term.style.display = ''; desk.innerHTML = ''; setTerm(term, html); };
  const DEV = [
    { t: '09:30', title: 'Lin sits down', desc: "Nibble wakes up and prints today's to-dos.", run: async () => {
      r.expr('sleep'); r.led('off'); showTerm('<span class="dim">good morning ☀️</span>'); await sleep(900);
      r.state('back'); r.say("Morning, Lin! Here's your day ☀️", 2500); await sleep(500);
      await printReceipt(r, tray, ['NIBBLE · THU NOV 20', '------------------', '[ ] Fix login #231', "[ ] Review Wang's PR", '[ ] 2pm standup', '(!) CI failed 2x']);
    } },
    { t: '10:00', title: 'Holds up a paper sketch', desc: "The PM's sketch goes straight to Claude Code. No scanning.", run: async () => {
      r.reset(); await fly(right(), r.headEl, '✏️', { dur: 700, size: 40, arc: -20 }); await r.snap(st); r.nod();
      r.say('Login page sketch → sent to Claude Code.', 2600); await sleep(1500);
      r.look('screen'); r.led('think'); r.expr('focus'); showTerm('<span class="dim">claude-code ▸ from sketch</span>\n✎ login.tsx\n✎ auth.ts');
    } },
    { t: '10:20', title: 'Agent needs approval', desc: 'Lin is getting coffee. Nibble turns around, blinks yellow, and waits for a pat.', run: async () => {
      showTerm('<span class="warn">? Allow: DB migration</span>\n  ALTER TABLE users\n<span class="dim">waiting…</span>');
      r.reset(); r.led('need'); r.expr('wide'); r.el.classList.add('ask'); Sfx.alert();
      r.brief(['🗄 DB migration', 'ALTER TABLE users', '⚠️ No auto-rollback'], 'y'); r.say('Lin! I need your OK on this one 👀', 0);
      await sleep(2200); await patHead(); r.el.classList.remove('ask'); r.unbrief(); r.nod(); r.expr('happy'); r.say('Approved. Running it ✓', 2000);
      await sleep(1200); r.look('screen'); r.led('think'); r.expr('focus'); showTerm('▶ migrating… 12/12');
    } },
    { t: '11:00', title: 'Agent finishes', desc: 'A happy hop. Lin knows without checking a single window.', run: async () => {
      showTerm('<span class="ok">✓ migration done</span>\n<span class="ok">✓ 42 tests passed</span>'); r.state('done'); r.say('Login fixed. All 42 tests pass ✨', 2800);
    } },
    { t: '14:30', title: 'Drags a PR onto the avatar', desc: 'Nibble eats it, chews, and prints the review to discuss in person.', run: async () => {
      r.reset(); await dropFile('🔗', 'PR #233');
      r.brief(['🔗 Review: PR #233', '2 issues · 1 critical', '⛔ SQL injection db.ts:88'], 'r'); r.led('error'); r.say('Two issues, one critical. Printed for you.', 3000);
      await printReceipt(r, tray, ['PR #233 REVIEW', '------------------', '! L45 null check', '!! SQL injection', '   db.ts:88', '------------------', '2 issues · 1 high']);
    } },
    { t: '17:30', title: 'Wraps up the day', desc: 'A recap slip, then Nibble goes to sleep.', run: async () => {
      r.reset(); r.expr('happy'); r.say("Great day! Here's your recap 🌙", 2400); showTerm('<span class="dim">shutting down…</span>');
      await printReceipt(r, tray, ['RECAP · NOV 20', '------------------', '✓ Login bug fixed', '✓ DB migrated', '✓ 1 PR reviewed', 'Tomorrow: PR #233']);
      await sleep(900); r.expr('sleep'); r.led('off');
    } },
  ];
  const CLERK = [
    { t: '09:00', title: '20 paper receipts', desc: 'Chen holds each one up. About 3 seconds per receipt, no scanner.', run: async () => {
      r.reset(); showTerm('<span class="dim">expenses.xlsx</span>');
      for (let i = 1; i <= 3; i++) { await fly(right(), r.headEl, '🧾', { dur: 450, size: 36, arc: -10 }); await r.snap(st); r.say(`Receipt ${[1, 7, 20][i - 1]}/20 ✓`, 900); await sleep(350); }
      r.expr('happy'); r.led('done'); Sfx.success(); r.brief(['🧾 20 receipts', '$1,284.60 total', '✅ Expense sheet filled'], 'g');
      r.say('All 20 logged. $1,284.60 total.', 2800); showTerm('<span class="ok">✓ 20 rows added</span>\n  total $1,284.60');
    } },
    { t: '10:30', title: 'Coworker taps a contract', desc: 'Maya walks in with a contract on her phone and taps Nibble’s nose.', run: async () => {
      r.reset(); await fly(right(), r.nfcEl, '📱', { dur: 700, size: 38, arc: -10 }); Sfx.ding(); r.expr('wide'); r.say('Got the contract from Maya’s phone 📄', 1800);
      await sleep(900); await r.chew(1400);
      r.brief(['📄 Vendor contract v2', 'vs last month: 3 changes', '⚠️ Price +8%'], 'y'); r.led('need'); r.say('3 changes vs last month. Price is up 8%.', 3200);
    } },
    { t: '11:00', title: 'Drops a meeting recording', desc: 'Nibble eats the audio and prints the action items for the notice board.', run: async () => {
      r.reset(); await dropFile('🎙️', 'Weekly.m4a'); r.expr('happy'); r.say('5 action items. Printing them for the board 📌', 2600);
      await printReceipt(r, tray, ['WEEKLY · 38 MIN', '------------------', 'Maya: vendor call', 'Chen: Nov expenses', 'Leo: order chairs', 'All: holiday rota', 'Boss: approve +8%']);
    } },
    { t: '14:00', title: 'Emails finance, with a pat', desc: 'Sending to the wrong person is the admin nightmare. The pat makes Chen check first.', run: async () => {
      r.reset(); showTerm('✉ to: finance@ (3)\n  Nov_expenses.xlsx\n<span class="warn">? approve</span>');
      r.led('need'); r.expr('wide'); r.el.classList.add('ask'); r.brief(['📧 Send to Finance', 'Nov_expenses.xlsx', '→ finance@ (3 people)'], 'y');
      r.say('Pat my head to send.', 0); Sfx.alert(); await sleep(2000); await patHead();
      r.el.classList.remove('ask'); r.unbrief(); r.nod(); r.expr('happy'); r.led('done'); Sfx.success(); r.say('Sent ✓ (pat my back within 10 s to undo)', 2600);
      showTerm('<span class="ok">✓ sent to finance@</span>');
    } },
    { t: '16:00', title: 'The boss asks a question', desc: 'Nibble is a team member anyone can talk to, not something hidden on one laptop.', run: async () => {
      r.reset(); r.led('listen'); r.mouth('o'); r.say('🗣 "How much did we spend this month?"', 1800); await sleep(1900);
      r.mouth('smile'); r.expr('happy'); r.hop(); r.say('November expenses: $12,380. That is up 15% from October.', 4000);
      r.brief(['📊 November', '$12,380 spent', '↑ 15% vs Oct'], 'b');
    } },
  ];
  const data = () => segVal.persona === 'dev' ? DEV : CLERK;
  function renderTL() {
    tl.innerHTML = data().map((s, i) => `<li data-i="${i}"><time>${s.t}</time><div><b>${s.title}</b><small>${s.desc}</small></div></li>`).join('');
    $$('li', tl).forEach(li => li.addEventListener('click', () => { if (!running) runOne(+li.dataset.i); }));
  }
  async function runOne(i, my) {
    const s = data()[i];
    $$('li', tl).forEach((li, j) => { li.classList.toggle('on', j === i); });
    clock.textContent = s.t; cap.innerHTML = `<b>${s.t}</b> · ${s.desc}`;
    if (!my) { running = true; $('#dayPlay').disabled = true; }
    await s.run();
    if (!my) { running = false; $('#dayPlay').disabled = false; }
  }
  $('#dayPlay').addEventListener('click', async () => {
    if (running) return; running = true; const my = ++token; $('#dayPlay').disabled = true;
    tray.innerHTML = ''; r.reset();
    for (let i = 0; i < data().length; i++) {
      if (my !== token) break;
      await runOne(i, true); $$('li', tl)[i].classList.add('done'); await sleep(1600);
    }
    running = false; $('#dayPlay').disabled = false; $$('li', tl).forEach(li => li.classList.remove('done'));
  });
  $('[data-seg="persona"]').addEventListener('segchange', () => {
    token++; running = false; $('#dayPlay').disabled = false; r.reset(); tray.innerHTML = ''; desk.innerHTML = ''; showTerm('');
    renderTL(); clock.textContent = data()[0].t; cap.textContent = 'Press play, or click any moment on the left.';
  });
  renderTL(); showTerm('<span class="dim">idle</span>');
})();
