(() => {
'use strict';

/* ================= helpers ================= */
const $ = id => document.getElementById(id);
const R = i => { const s = Math.sin(i * 12.9898) * 43758.5453; return s - Math.floor(s); };
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const N = window.Native || null;
// settings live in the web view and, as a backup, in the app's own saved settings
const store = {
  get(k, d = '') {
    let v = null;
    try { v = localStorage.getItem('pbj.' + k); } catch (e) {}
    if ((v === null || v === '') && N && N.getSetting) { v = N.getSetting(k) || null; if (v) try { localStorage.setItem('pbj.' + k, v); } catch (e) {} }
    return (v === null || v === '') ? d : v;
  },
  set(k, v) { try { localStorage.setItem('pbj.' + k, v); } catch (e) {} if (N && N.saveSetting) N.saveSetting(k, String(v)); },
  del(k) { try { localStorage.removeItem('pbj.' + k); } catch (e) {} if (N && N.saveSetting) N.saveSetting(k, ''); }
};
let toastT = null;
function toast(msg, ms = 2600) {
  const t = $('toast'); t.textContent = msg; t.classList.add('on');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), ms);
}
function setLed(txt) { $('led').textContent = String(txt).replace(/^TRK /, ''); }

/* native HTTP (no CORS limits) */
let httpSeq = 0; const httpWait = {};
window.__http = (id, code, b64, finalUrl) => {
  const w = httpWait[id]; if (!w) return; delete httpWait[id];
  let text = '';
  try { text = new TextDecoder().decode(Uint8Array.from(atob(b64), c => c.charCodeAt(0))); } catch (e) {}
  w({ status: +code, text, url: finalUrl });
};
function httpGet(url) {
  if (!N) return fetch(url).then(async r => ({ status: r.status, text: await r.text(), url: r.url })).catch(() => ({ status: 0, text: '', url }));
  return new Promise(res => {
    const id = 'h' + (++httpSeq);
    httpWait[id] = res;
    setTimeout(() => { if (httpWait[id]) { delete httpWait[id]; res({ status: 0, text: '', url }); } }, 45000);
    N.httpGet(id, url);
  });
}
async function getJSON(url) { const r = await httpGet(url); try { return r.status === 200 ? JSON.parse(r.text) : null; } catch (e) { return null; } }

/* ================= scene ================= */
const S = $('scene');
(function buildScene() {
  const LINE = '#9a9aa4', WALL = '#3a3a40', SKY = '#2a1230';
  const PAIRS = [['#ff9a66', '#ffe08a'], ['#ff2d7a', '#ff79a8'], ['#9b5cff', '#5f9bff'], ['#20d4b8', '#7cf2c8'], ['#ff5a8a', '#ffb07a'], ['#c45cff', '#ff6cc4'], ['#4f8dff', '#a46cff'], ['#ffc46a', '#ff7a8a']];
  const BX = 176, BW = 584, NB = 13, BAY = BW / NB, BEAT = 60 / 123;
  const el = (css, inner = '', cls = '') => `<div${cls ? ` class="${cls}"` : ''} style="${css}">${inner}</div>`;
  const MULL = `linear-gradient(90deg,transparent 0 31%,${WALL} 31% 36%,transparent 36% 64%,${WALL} 64% 69%,transparent 69%),linear-gradient(transparent 0 12%,${WALL} 12% 16%,transparent 16% 52%,${WALL} 52% 56%,transparent 56% 86%,${WALL} 86% 90%,transparent 90%)`;
  const lit = (x, y, w, h, i) => {
    const [a, b] = PAIRS[(R(i) * PAIRS.length) | 0];
    return el(`left:${(x - 3).toFixed(1)}px;top:${y - 3}px;width:${(w + 6).toFixed(1)}px;height:${h + 6}px;border:1px solid ${LINE}`) +
      el(`left:${x.toFixed(1)}px;top:${y}px;width:${w.toFixed(1)}px;height:${h}px;background:${MULL},linear-gradient(${a},${b},${a},${b});background-size:100% 100%,100% 100%,100% 300%;` +
         `animation-delay:-${(((R(i + 600) * 16) | 0) * BEAT).toFixed(3)}s,0s,-${(((R(i + 900) * 4) | 0) * BEAT).toFixed(3)}s`, '', 'win');
  };
  const rosette = (cx, cy, r) => [r, r * .62, r * .25].map(rr => el(`left:${(cx - rr).toFixed(1)}px;top:${(cy - rr).toFixed(1)}px;width:${(2 * rr).toFixed(1)}px;height:${(2 * rr).toFixed(1)}px;border:1px solid ${LINE};border-radius:50%`)).join('');
  let h = '';
  h += el(`left:-60px;top:-420px;width:964px;height:810px;background:linear-gradient(#1e0c24 0,#2a1230 420px,#4a2048 650px,#5a2a50 750px)`);
  h += el('left:-60px;top:-420px;width:964px;height:750px;opacity:.9;background:radial-gradient(circle,rgba(255,236,220,.85) .6px,transparent 1.1px) 0 0/23px 19px,radial-gradient(circle,rgba(255,236,220,.55) .5px,transparent 1px) 7px 11px/37px 31px,radial-gradient(circle,rgba(255,236,220,.35) .5px,transparent 1px) 13px 3px/11px 13px');
  for (let i = 0; i < 14; i++) h += el(`left:${(R(i + 40) * 844) | 0}px;top:${(R(i + 60) * 120) | 0}px;width:2px;height:2px;background:#fff3e6;animation:twinkle ${(3 + R(i + 80) * 4).toFixed(1)}s ease-in-out infinite;animation-delay:-${(R(i + 90) * 5).toFixed(1)}s`);
  h += el('left:648px;top:-6px;width:112px;height:112px;border-radius:50%;background:radial-gradient(circle,rgba(255,228,196,.18),transparent 70%);transform:scale(1.5)');
  h += el('left:648px;top:-6px;width:112px;height:112px;border-radius:50%;background:#ffe4c4', '', 'moon');
  h += el('left:-30px;top:170px;width:200px;height:170px;border-radius:50% 50% 0 0;background:#24101f;border-top:1px solid #5a3a52');
  h += el('left:770px;top:180px;width:120px;height:160px;border-radius:50% 50% 0 0;background:#24101f;border-top:1px solid #4a2a42');
  h += el(`left:${BX - 8}px;top:54px;width:${BW + 16}px;height:276px;background:${WALL}`);
  [54, 60, 62, 94, 96, 128, 130, 300, 330].forEach(y => h += el(`left:${BX - 8}px;top:${y}px;width:${BW + 16}px;height:1px;background:${LINE}`));
  for (let i = 0; i < NB; i++) {
    const cx = BX + BAY * i + BAY / 2, w = BAY - 20;
    h += el(`left:${(cx - 11).toFixed(1)}px;top:74px;width:22px;height:7px;border:1px solid ${LINE}`);
    if (i % 2 === 0) h += el(`left:${(cx - 9).toFixed(1)}px;top:101px;width:18px;height:22px;border:1px solid ${LINE}`);
    h += el(`left:${(BX + BAY * i + 2).toFixed(1)}px;top:134px;width:${(BAY - 4).toFixed(1)}px;height:162px;border:1px solid ${LINE}`);
    h += el(`left:${(BX + BAY * i + 5).toFixed(1)}px;top:137px;width:${(BAY - 10).toFixed(1)}px;height:156px;border:1px solid #5a5a62`);
    h += lit(cx - w / 2, 144, w, 52, i);
    h += el(`left:${(cx - w / 2 - 3).toFixed(1)}px;top:203px;width:${(w + 6).toFixed(1)}px;height:24px;border:1px solid ${LINE}`);
    h += rosette(cx, 215, 9);
    h += lit(cx - w / 2, 234, w, 54, i + 50);
  }
  for (let i = 0; i < 26; i++) {
    let x = BX + 6 + R(i + 200) * (BW - 12); if (x > 440 && x < 500) x += 80;
    h += el(`left:${x | 0}px;top:${(306 + R(i + 210) * 18) | 0}px;width:${(6 + R(i + 220) * 16) | 0}px;height:3px;background:${PAIRS[i % 8][i % 2]};opacity:.5`);
  }
  h += el(`left:442px;top:304px;width:56px;height:26px;border:1px solid ${LINE};background:#18181b`) + el(`left:469px;top:304px;width:1px;height:26px;background:${LINE}`);
  [230, 310, 390, 550, 630, 710].forEach(x => { h += el(`left:${x - 10}px;top:300px;width:20px;height:16px;background:radial-gradient(ellipse at top,rgba(255,214,170,.45),transparent 70%)`) + el(`left:${x - 4}px;top:300px;width:8px;height:3px;background:#ffd6aa`); });
  h += el('left:-60px;top:330px;width:964px;height:260px;background:linear-gradient(#2a1426,#1c0c1a 120px)');
  h += el('left:-60px;top:330px;width:964px;height:260px;background:repeating-linear-gradient(90deg,transparent 0 60px,#3a2236 60px 61px);opacity:.8');
  h += el('left:600px;top:310px;width:280px;height:22px;transform:rotate(14deg);transform-origin:left top;border-top:1px solid #7a5070;border-bottom:1px solid #7a5070;background:repeating-linear-gradient(90deg,#5a3552 0 1px,transparent 1px 9px)');
  // the queue: people shuffle slowly along the fence towards the door and go in, new arrivals join at the back
  // stop-start: everyone waits 4 s, then the whole queue shuffles forward one place over 2 s
  {
    const SLOTS = 22, STEP = 6, HOLD = 4, path = [[806, 372], [520, 304], [472, 304]];
    const seg = path.slice(1).map((p, j) => Math.hypot(p[0] - path[j][0], p[1] - path[j][1]));
    const total = seg.reduce((a, b) => a + b, 0);
    const at = d => { for (let j = 0; j < seg.length; j++) { if (d <= seg[j]) { const t = d / seg[j]; return [path[j][0] + (path[j + 1][0] - path[j][0]) * t, path[j][1] + (path[j + 1][1] - path[j][1]) * t]; } d -= seg[j]; } return path[path.length - 1]; };
    const pct = t => (t / (SLOTS * STEP) * 100).toFixed(3) + '%';
    let k = '';
    for (let n = 0; n < SLOTS; n++) {
      const [x0, y0] = at(total * n / SLOTS), [x1, y1] = at(total * (n + 1) / SLOTS);
      const op0 = n === 0 ? 0 : 1, op1 = n === SLOTS - 1 ? 0 : 1;
      k += `${pct(n * STEP)}{transform:translate(${x0.toFixed(1)}px,${y0.toFixed(1)}px);opacity:${op0}}`;
      k += `${pct(n * STEP + HOLD)}{transform:translate(${x0.toFixed(1)}px,${y0.toFixed(1)}px);opacity:${op0}}`;
      if (n === SLOTS - 1) k += `100%{transform:translate(${x1.toFixed(1)}px,${y1.toFixed(1)}px);opacity:${op1}}`;
    }
    const st = document.createElement('style');
    st.textContent = `.qp{opacity:0;animation:queue ${SLOTS * STEP}s ease-in-out infinite}@keyframes queue{${k}}`;
    document.head.appendChild(st);
  }
  for (let i = 0; i < 22; i++) h += el(`left:0;top:0;width:9px;height:26px;animation-delay:-${i * 6}s`, el('left:1px;top:0;width:7px;height:7px;border-radius:50%;background:#0a0208;border:1px solid #4a2a42') + el('left:0;top:8px;width:9px;height:18px;border-radius:3px 3px 0 0;background:#0a0208;border:1px solid #4a2a42;border-bottom:0'), 'qp');
  h += el('left:505px;top:300px;width:10px;height:30px', el('left:1px;top:0;width:8px;height:8px;border-radius:50%;background:#000') + el('left:0;top:8px;width:10px;height:22px;background:#000'));
  S.innerHTML = h;
  let u = '<div id="post"><div id="led">PUSH</div></div>';
  u += '<div id="screen"></div>';
  u += '<div id="ytbar"><div id="scrub" role="slider" aria-label="Track position" tabindex="0"><b id="scrub-fill"></b><b id="scrub-knob"></b></div>' +
    '<div id="times"><span id="t-now">0:00</span><span id="t-dur">0:00</span></div>' +
    '<div id="ytbtns"><button id="yt-back" aria-label="Back 30 seconds">−30</button><button id="yt-big" aria-label="Bigger video">BIG</button><button id="yt-fwd" aria-label="Forward 30 seconds">+30</button></div></div>' +
    '';
  u += '<div id="card" role="status" aria-live="polite"></div>';
  u += '<button id="push" aria-label="Next track. Double tap to stop. Hold for track details"><span>PUSH</span></button>';
  u += '<button id="rewind" aria-label="Rewind: tap to restart the track, double tap for the previous track">REWIND</button>';
  $('ui').innerHTML = u;
})();

const stage = $('stage'), UI = $('ui');
function fit() {
  const W = stage.clientWidth, H = stage.clientHeight, port = H > W * 1.05;
  stage.classList.toggle('port', port);
  let k, ox, oy;
  if (!port) {
    k = Math.max(W / 844, H / 390);
    ox = (W - 844 * k) / 2; oy = Math.min(0, (H - 390 * k) * 0.35);
    UI.style.width = '844px'; UI.style.height = '390px';
    UI.style.transform = `translate(${ox}px,${oy}px) scale(${k})`;
  } else {
    k = W / 600; ox = -168 * k; oy = H * 0.34 - 54 * k;
    const k2 = W / 390;
    UI.style.width = '390px'; UI.style.height = (H / k2) + 'px';
    UI.style.transform = `scale(${k2})`;
  }
  S.style.transform = `translate(${ox}px,${oy}px) scale(${k})`;
  const g = Math.round(oy + 330 * k);
  stage.style.background = `linear-gradient(#1e0c24 0, #2a1230 ${Math.round(g * .6)}px, #5a2a50 ${g}px, #2a1426 ${g}px, #1c0c1a ${g + 160}px)`;
}
new ResizeObserver(fit).observe(stage); fit();

const PALS = [['#ff3fa4', '#35e0f0', '#5cff5c', '#ffd23f'], ['#35e0f0', '#9b5cff', '#5cff5c', '#35e0f0'], ['#5cff5c', '#ffd23f', '#ff3fa4', '#5cff5c'], ['#ffd23f', '#ff7a1a', '#ff3fa4', '#fff3c4'], ['#ff3355', '#9b5cff', '#ff3fa4', '#ffffff']];
function setPal(p) { const r = document.documentElement.style; p.forEach((c, i) => r.setProperty('--c' + (i + 1), c)); }
function beat() { S.classList.add('beat'); setTimeout(() => S.classList.remove('beat'), 90); }

/* ================= demo engine (used until Telegram is connected) ================= */
const P = s => s.split('').map(c => c === 'x');
const DEMO = [
  { artist: 'Halle Sieben', title: 'Concrete Hymn', label: 'Grey Wall Tapes', bpm: 132, root: 33, kick: P('x...x...x...x...'), clap: P('....x.......x...'), hat: P('..x...x...x...x.'), ch: P('xxxxxxxxxxxxxxxx'), bass: [null, 0, 0, null, null, 0, 0, null, null, 0, 0, null, null, 0, 12, null], cut: 520, res: 4, rumble: .5, verb: .22, drive: 0 },
  { artist: 'Dunkelkammer Trio', title: 'Hypnotic Drift', label: 'Nachtschicht Audio', bpm: 124, root: 29, kick: P('x...x...x...x...'), clap: P('................'), hat: P('..x...x...x...x.'), ch: P('x.x.x.x.x.x.x.x.'), bass: [null, null, 0, null, null, null, 0, null, null, null, 0, null, null, null, -2, null], cut: 300, res: 2, stab: { notes: [0, 3, 7, 10], pat: P('...x.......x..x.'), cut: 900 }, rumble: .25, verb: .35, drive: 0 },
  { artist: 'Acid Tomas', title: 'Acid Morning', label: 'Squelch Unit', bpm: 128, root: 36, kick: P('x...x...x...x...'), clap: P('....x.......x...'), hat: P('..x...x...x...x.'), ch: P('x.xxx.xxx.xxx.xx'), bass: [0, 0, 12, 0, 3, 0, 15, 0, 0, 7, 0, 12, 10, 0, 3, 5], accent: P('x..x..x...x..x..'), cut: 700, res: 16, acid: true, rumble: 0, verb: .18, drive: 0 },
  { artist: 'Lea Morgenrot', title: 'Panorama Sunrise', label: 'Upstairs Editions', bpm: 122, root: 31, kick: P('x...x...x...x...'), clap: P('....x.......x...'), hat: P('..x...x...x...x.'), ch: P('xxxxxxxxxxxxxxxx'), bass: [0, null, null, 0, null, null, 7, null, null, 0, null, null, 10, null, 7, null], cut: 900, res: 1, stab: { notes: [12, 15, 19, 22, 26], pat: P('..x..x....x..x..'), cut: 2400 }, rumble: 0, verb: .3, drive: 0 },
  { artist: 'Stahl & Regen', title: 'Steel Rain', label: 'Kesselwerk Industries', bpm: 138, root: 31, kick: P('x...x...x...x...'), clap: P('....x.......x...'), hat: P('xxxxxxxxxxxxxxxx'), ch: P('..x...x...x...x.'), bass: [null, 0, null, 0, null, 0, null, 0, null, 0, null, 0, null, 0, null, 1], cut: 260, res: 3, rumble: .8, verb: .4, drive: .6 }
];
const Demo = (() => {
  let ac = null, bus, verbSend, delay, dSend, noiseBuf, timer = null, tr = null, step = 0, nextT = 0, bar = 0;
  const mtof = m => 440 * 2 ** ((m - 69) / 12);
  function init() {
    ac = new (window.AudioContext || window.webkitAudioContext)();
    const comp = ac.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 4; comp.attack.value = .004; comp.release.value = .18;
    const lim = ac.createDynamicsCompressor(); lim.threshold.value = -2; lim.ratio.value = 20; lim.attack.value = .001; lim.release.value = .08;
    const out = ac.createGain(); out.gain.value = .85;
    bus = ac.createGain(); bus.connect(comp); comp.connect(lim); lim.connect(out); out.connect(ac.destination);
    noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate); const nd = noiseBuf.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    const len = ac.sampleRate * 2.6, ir = ac.createBuffer(2, len, ac.sampleRate);
    for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3; }
    const verb = ac.createConvolver(); verb.buffer = ir; verbSend = ac.createGain(); const vlp = ac.createBiquadFilter(); vlp.frequency.value = 5000;
    verbSend.connect(verb); verb.connect(vlp); vlp.connect(bus);
    delay = ac.createDelay(2); const fb = ac.createGain(); fb.gain.value = .38; const dlp = ac.createBiquadFilter(); dlp.frequency.value = 2200;
    dSend = ac.createGain(); dSend.connect(delay); delay.connect(dlp); dlp.connect(fb); fb.connect(delay); dlp.connect(bus);
  }
  function env(g, t, a, peak, d) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); }
  function shaper(amt) { const ws = ac.createWaveShaper(), n = 1024, c = new Float32Array(n), k = amt * 80; for (let i = 0; i < n; i++) { const x = i * 2 / n - 1; c[i] = (1 + k) * x / (1 + k * Math.abs(x)); } ws.curve = c; return ws; }
  function noise(t, dur) { const s = ac.createBufferSource(); s.buffer = noiseBuf; s.start(t, Math.random() * .5); s.stop(t + dur + .05); return s; }
  function kick(t) {
    const o = ac.createOscillator(), g = ac.createGain(); o.frequency.setValueAtTime(160, t); o.frequency.exponentialRampToValueAtTime(44, t + .11);
    env(g, t, .002, 1, .42); let node = g; o.connect(g);
    if (tr.drive) { const ws = shaper(tr.drive); g.connect(ws); node = ws; }
    node.connect(bus); o.start(t); o.stop(t + .5);
    if (tr.rumble) { const rg = ac.createGain(); rg.gain.value = tr.rumble; const lp = ac.createBiquadFilter(); lp.frequency.value = 180; node.connect(rg); rg.connect(lp); lp.connect(verbSend); }
    const n = noise(t, .01), hp = ac.createBiquadFilter(), ng = ac.createGain(); hp.type = 'highpass'; hp.frequency.value = 3000; env(ng, t, .001, .25, .012); n.connect(hp); hp.connect(ng); ng.connect(bus);
  }
  function hat(t, open) { const n = noise(t, open ? .3 : .05), f = ac.createBiquadFilter(), g = ac.createGain(); f.type = 'highpass'; f.frequency.value = tr.drive ? 9000 : 7500; env(g, t, .001, open ? .22 : .09, open ? .22 : .035); n.connect(f); f.connect(g); g.connect(bus); if (open) { const s = ac.createGain(); s.gain.value = .15; g.connect(s); s.connect(verbSend); } }
  function clap(t) {
    const n = noise(t, .3), f = ac.createBiquadFilter(), g = ac.createGain(); f.type = 'bandpass'; f.frequency.value = 1400; f.Q.value = 1.2;
    g.gain.setValueAtTime(0.0001, t); [0, .011, .022].forEach(o => { g.gain.setValueAtTime(.55, t + o); g.gain.exponentialRampToValueAtTime(.08, t + o + .01); }); g.gain.exponentialRampToValueAtTime(0.0001, t + .22);
    n.connect(f); f.connect(g); g.connect(bus); const s = ac.createGain(); s.gain.value = tr.verb * 1.6; g.connect(s); s.connect(verbSend);
  }
  function bass(t, note, len, acc) {
    const o = ac.createOscillator(), f = ac.createBiquadFilter(), g = ac.createGain(); o.type = 'sawtooth'; o.frequency.value = mtof(tr.root + note + (tr.acid ? 12 : 0));
    f.type = 'lowpass'; f.Q.value = tr.res; const lfo = tr.acid ? (.5 + .5 * Math.sin(bar * .7)) * 1800 : 0; const top = tr.cut + lfo + (acc ? 1400 : 0);
    f.frequency.setValueAtTime(top + 300, t); f.frequency.exponentialRampToValueAtTime(Math.max(80, tr.cut * .35), t + len * (tr.acid ? .9 : .7));
    env(g, t, .004, tr.acid ? (acc ? .34 : .24) : .42, len * .9); o.connect(f); f.connect(g); g.connect(bus);
    if (!tr.acid) { const sub = ac.createOscillator(), sg = ac.createGain(); sub.frequency.value = mtof(tr.root + note - 12); env(sg, t, .004, .35, len * .9); sub.connect(sg); sg.connect(bus); sub.start(t); sub.stop(t + len + .05); }
    else { const d = ac.createGain(); d.gain.value = .25; g.connect(d); d.connect(dSend); }
    o.start(t); o.stop(t + len + .05);
  }
  function stab(t, sp) {
    const st = tr.stab, f = ac.createBiquadFilter(), g = ac.createGain(); f.type = 'lowpass'; f.Q.value = 3;
    f.frequency.setValueAtTime(st.cut, t); f.frequency.exponentialRampToValueAtTime(st.cut * .25, t + sp * 3); env(g, t, .005, .11, sp * 3);
    st.notes.forEach(n => [-7, 7].forEach(dt => { const o = ac.createOscillator(); o.type = 'sawtooth'; o.detune.value = dt; o.frequency.value = mtof(tr.root + 24 + n); o.connect(f); o.start(t); o.stop(t + sp * 4); }));
    f.connect(g); g.connect(bus); const ds = ac.createGain(); ds.gain.value = .55; g.connect(ds); ds.connect(dSend); const vs = ac.createGain(); vs.gain.value = .4; g.connect(vs); vs.connect(verbSend);
  }
  function sched() {
    const sp = 60 / tr.bpm / 4;
    while (nextT < ac.currentTime + .12) {
      const s = step % 16, brk = (bar % 16) >= 14;
      if (tr.kick[s] && !brk) { kick(nextT); setTimeout(beat, (nextT - ac.currentTime) * 1000); }
      if (tr.clap[s]) clap(nextT);
      if (tr.hat[s]) hat(nextT, true);
      if (tr.ch[s] && !tr.hat[s]) hat(nextT + (s % 2 ? sp * .08 : 0), false);
      const b = tr.bass[s]; if (b !== null && b !== undefined && !(brk && !tr.acid)) bass(nextT, b, sp * (tr.acid ? .9 : 1.6), tr.accent && tr.accent[s]);
      if (tr.stab && tr.stab.pat[s]) stab(nextT, sp);
      nextT += sp; step++; if (step % 16 === 0) bar++;
    }
  }
  return {
    play(i) {
      if (!ac) init(); if (ac.state === 'suspended') ac.resume();
      tr = DEMO[i]; verbSend.gain.value = tr.verb; delay.delayTime.value = 60 / tr.bpm * .75; step = 0; bar = 0; nextT = ac.currentTime + .06;
      clearInterval(timer); timer = setInterval(sched, 25);
    },
    stop() { clearInterval(timer); timer = null; },
    running() { return !!timer && ac && ac.state === 'running'; }
  };
})();

/* ================= link parsing ================= */
const MUSIC_RE = /(open\.spotify\.com|spotify\.link|spoti\.fi|youtube\.com|youtu\.be|music\.youtube\.com|soundcloud\.com|on\.soundcloud\.com|bandcamp\.com|mixcloud\.com|music\.apple\.com|deezer\.com|deezer\.page\.link|tidal\.com|beatport\.com)/i;
function classify(url) {
  let m;
  if ((m = url.match(/open\.spotify\.com\/(?:intl-[a-z]+\/)?(track|album|playlist)\/([A-Za-z0-9]{10,})/i))) return { kind: 'spotify', spotifyUri: `spotify:${m[1].toLowerCase()}:${m[2]}` };
  if ((m = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/|music\.youtube\.com\/watch\?(?:.*&)?v=)([A-Za-z0-9_-]{11})/i))) return { kind: 'youtube', ytId: m[1] };
  if (/soundcloud\.com/i.test(url)) return { kind: 'soundcloud' };
  if (/mixcloud\.com\/[^/]+\/[^/]+/i.test(url)) return { kind: 'mixcloud' };
  return { kind: 'other' };
}
function linksFromMessage(m) {
  const out = new Set();
  const text = m.message || '';
  (text.match(/https?:\/\/[^\s<>"')\]]+/gi) || []).forEach(u => out.add(u));
  (m.entities || []).forEach(e => {
    if (e.url) out.add(e.url);
    else if (e.className === 'MessageEntityUrl') { let u = text.substr(e.offset, e.length); if (!/^https?:/i.test(u)) u = 'https://' + u; out.add(u); }
  });
  const wp = m.media && m.media.webpage;
  if (wp && wp.url) out.add(wp.url);
  return [...out].map(u => u.replace(/[.,!?]+$/, '')).filter(u => MUSIC_RE.test(u));
}
function senderName(m) {
  const s = m.sender || m._sender;
  if (!s) return '';
  if (s.username) return '@' + s.username;
  return [s.firstName, s.lastName].filter(Boolean).join(' ') || s.title || '';
}
function previewMeta(m) {
  const wp = m.media && m.media.webpage;
  if (!wp || !wp.title) return null;
  let title = wp.title, artist = '';
  const d = wp.description || '';
  // Spotify previews read "Song · Artist" in the description
  if (/spotify/i.test(wp.siteName || '') && d) { const p = d.split('·').map(x => x.trim()); if (p.length >= 2) artist = p[1] || p[0]; }
  if (/youtube/i.test(wp.siteName || '')) { const p = title.split(/\s[-–—]\s/); if (p.length >= 2) { artist = p[0]; title = p.slice(1).join(' - '); } }
  return { title, artist };
}

/* ================= Odesli (song.link) + MusicBrainz ================= */
const odCache = {};
async function odesli(url) {
  if (url in odCache) return odCache[url];
  const j = await getJSON('https://api.song.link/v1-alpha.1/links?userCountry=GB&url=' + encodeURIComponent(url));
  let res = null;
  if (j && j.linksByPlatform) {
    const L = j.linksByPlatform, E = j.entitiesByUniqueId || {};
    const ent = E[j.entityUniqueId] || {};
    res = { title: ent.title || '', artist: ent.artistName || '' };
    if (L.spotify && L.spotify.nativeAppUriDesktop) res.spotifyUri = L.spotify.nativeAppUriDesktop;
    const yt = L.youtube || L.youtubeMusic;
    if (yt && yt.entityUniqueId) { const id = yt.entityUniqueId.split('::')[1]; if (id && id.length === 11) res.ytId = id; }
    if (L.soundcloud && L.soundcloud.url) res.soundcloud = L.soundcloud.url;
  }
  odCache[url] = res;
  return res;
}
const labelCache = {};
async function findLabel(artist, title) {
  if (!artist || !title) return '';
  const key = artist + '|' + title;
  if (key in labelCache) return labelCache[key];
  const clean = s => s.replace(/\(.*?\)|\[.*?\]/g, '').replace(/["\\]/g, '').trim();
  const q = `recording:"${clean(title)}" AND artist:"${clean(artist)}"`;
  const j = await getJSON('https://musicbrainz.org/ws/2/recording/?fmt=json&limit=3&query=' + encodeURIComponent(q));
  let label = '';
  const rel = j && j.recordings && j.recordings.flatMap(r => r.releases || [])[0];
  if (rel && rel.id) {
    const rj = await getJSON(`https://musicbrainz.org/ws/2/release/${rel.id}?inc=labels&fmt=json`);
    const li = rj && rj['label-info'] && rj['label-info'].find(x => x.label && x.label.name);
    if (li) label = li.label.name;
  }
  labelCache[key] = label;
  return label;
}

/* ================= players ================= */
const screen = $('screen');
let spConnected = false, spState = null;
window.__spotify = (status, msg) => {
  if (status === 'connected') { spConnected = true; clearTimeout(spTimer); $('sp-err').textContent = ''; renderSpStatus(); toast('Spotify connected'); }
  else if (status === 'failed') { spConnected = false; clearTimeout(spTimer); renderSpStatus(); $('sp-err').textContent = 'Spotify said: ' + msg; toast('Spotify could not connect'); }
  else if (status === 'login') { $('sp-err').textContent = 'Opening the Spotify login… tap Agree.'; }
  else if (status === 'approved') { $('sp-err').textContent = 'Approved. Connecting to the Spotify app…'; }
  else if (status === 'retrying') { $('sp-err').textContent = `Spotify is slow to answer, trying again (${+msg + 1} of 3)…`; }
  else if (status === 'playerror') toast('Spotify could not play that one');
  else if (status === 'notconnected') { spConnected = false; renderSpStatus(); }
};
let spBase = 0, spAt = 0;
window.__spState = json => {
  try {
    spState = JSON.parse(json);
    if (cur && cur.how === 'spotify' && !scrubbing) {
      spBase = (spState.position || 0) / 1000; spAt = Date.now();
      ytTime = spBase; if (spState.duration) ytDur = spState.duration / 1000;
    }
    if (card.classList.contains('show')) fillCard();
  } catch (e) {}
};
// Spotify cover art shown in the player screen
let lastArt = '';
window.__spArt = url => {
  lastArt = url;
  if (!cur || cur.how !== 'spotify') return;
  const img = screen.querySelector('img.art');
  if (img) img.src = url;
};
function showSpotifyScreen() {
  screen.innerHTML = '<img class="art" alt="Cover art"><span class="badge">Spotify</span>';
  if (lastArt) screen.querySelector('img.art').src = lastArt;
  screen.classList.add('on');
  ytTime = 0; ytDur = 0; spBase = 0; spAt = Date.now();
  $('ytbar').classList.add('on');
}

let stopped = false;
function ytCmd(func) {
  const f = screen.querySelector('iframe'); if (!f || !f.contentWindow) return;
  if (cur && cur.how === 'youtube') f.contentWindow.postMessage(JSON.stringify({ event: 'command', func, args: [] }), '*');
  else if (cur && cur.how === 'soundcloud') f.contentWindow.postMessage(JSON.stringify({ method: func === 'pauseVideo' ? 'pause' : 'play' }), '*');
}
function toggleStop() {
  if (!stopped) {
    stopped = true;
    if (!live) Demo.stop();
    else if (cur && cur.how === 'spotify' && N) N.spotifyPause();
    else if (cur && (cur.how === 'youtube' || cur.how === 'soundcloud')) ytCmd('pauseVideo');
    else if (cur && cur.how === 'mixcloud') { screen.dataset.src = (screen.querySelector('iframe') || {}).src || ''; screen.innerHTML = ''; }
    setLed('STOP'); toast('Stopped · tap to play the next track, double tap to resume', 2200);
  } else {
    stopped = false;
    if (!live) { if (demoIdx >= 0) Demo.play(demoIdx); }
    else if (cur && cur.how === 'spotify' && N) N.spotifyResume();
    else if (cur && (cur.how === 'youtube' || cur.how === 'soundcloud')) ytCmd('playVideo');
    else if (cur && cur.how === 'mixcloud' && screen.dataset.src) showFrame(screen.dataset.src);
    setLed(live ? 'TRK ' + String(Math.max(1, feed.idx + 1)).padStart(2, '0') : 'TRK ' + String(demoIdx + 1).padStart(2, '0'));
  }
}
function stopAll() {
  stopped = false;
  Demo.stop();
  if (spConnected && N) N.spotifyPause();
  screen.innerHTML = ''; screen.classList.remove('on'); $('ytbar').classList.remove('on');
}
let ytTime = 0, ytDur = 0, ytState = -1, scrubbing = false, scrubFrac = 0;
function showFrame(src) {
  screen.innerHTML = `<iframe src="${esc(src)}" allow="autoplay; encrypted-media" referrerpolicy="strict-origin-when-cross-origin" title="Player"></iframe>`;
  screen.classList.add('on');
  ytTime = 0; ytDur = 0; ytState = -1;
  const isYt = /youtube\.com\/embed/.test(src);
  $('ytbar').classList.toggle('on', isYt);
  if (isYt) {
    const f = screen.querySelector('iframe');
    f.addEventListener('load', () => {
      const send = o => { try { f.contentWindow.postMessage(JSON.stringify(o), '*'); } catch (e) {} };
      send({ event: 'listening', id: 'pbj', channel: 'widget' });
      // keep subtitles off even if YouTube turns them on by itself
      [1200, 3500, 8000].forEach(t => setTimeout(() => {
        send({ event: 'command', func: 'unloadModule', args: ['captions'] });
        send({ event: 'command', func: 'unloadModule', args: ['cc'] });
      }, t));
    });
  }
}
window.addEventListener('message', e => {
  if (!/^https:\/\/(www\.)?youtube(-nocookie)?\.com$/.test(e.origin || '')) return;
  let d; try { d = typeof e.data === 'string' ? JSON.parse(e.data) : e.data; } catch (err) { return; }
  if (d && d.info) {
    if (typeof d.info.currentTime === 'number' && !scrubbing) ytTime = d.info.currentTime;
    if (typeof d.info.duration === 'number' && d.info.duration > 0) ytDur = d.info.duration;
    if (typeof d.info.playerState === 'number') ytState = d.info.playerState;
  }
});
function ytSeek(delta) {
  let t = Math.max(0, ytTime + delta); if (ytDur) t = Math.min(t, ytDur - 2);
  if (cur && cur.how === 'spotify') {
    if (N) N.spotifySeek(Math.round(t * 1000));
    spBase = t; spAt = Date.now();
  } else {
    const f = screen.querySelector('iframe'); if (!f) return;
    f.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'seekTo', args: [t, true] }), '*');
  }
  ytTime = t;
  const m = Math.floor(t / 60), sec = String(Math.floor(t % 60)).padStart(2, '0');
  setLed(m + ':' + sec);
  setTimeout(() => { if (!stopped && cur) setLed(back ? 'BACK ' + back : String(Math.max(1, feed.idx + 1)).padStart(2, '0')); }, 1500);
}
const fmt = t => { t = Math.max(0, t | 0); return (t / 60 | 0) + ':' + String(t % 60).padStart(2, '0'); };
function scrubUI() {
  const f = scrubbing ? scrubFrac : (ytDur ? Math.min(1, ytTime / ytDur) : 0);
  $('scrub-fill').style.width = (f * 100).toFixed(2) + '%';
  $('scrub-knob').style.left = (f * 100).toFixed(2) + '%';
  $('t-now').textContent = fmt(scrubbing ? scrubFrac * ytDur : ytTime);
  $('t-dur').textContent = ytDur ? fmt(ytDur) : '--:--';
}
const scrubEl = $('scrub');
const fracAt = e => { const r = scrubEl.getBoundingClientRect(); return Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)); };
scrubEl.addEventListener('pointerdown', e => { if (!ytDur) return; e.preventDefault(); scrubEl.setPointerCapture(e.pointerId); scrubbing = true; scrubFrac = fracAt(e); scrubUI(); });
scrubEl.addEventListener('pointermove', e => { if (!scrubbing) return; scrubFrac = fracAt(e); scrubUI(); });
const endScrub = () => { if (!scrubbing) return; scrubbing = false; ytTime = scrubFrac * ytDur; ytSeek(0); scrubUI(); };
scrubEl.addEventListener('pointerup', endScrub);
scrubEl.addEventListener('pointercancel', endScrub);
scrubEl.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') ytSeek(-10); if (e.key === 'ArrowRight') ytSeek(10); });
$('yt-back').addEventListener('click', () => ytSeek(-30));
$('yt-fwd').addEventListener('click', () => ytSeek(30));
// player sizes: mini (default, barely there) -> open (controls) -> big
function setPlayerMode(mode) {
  UI.classList.toggle('pv-mini', mode === 'mini');
  screen.classList.toggle('big', mode === 'big');
  $('ytbar').classList.toggle('big', mode === 'big');
  $('yt-big').textContent = mode === 'big' ? 'SMALL' : 'BIG';
  store.set('playerMode', mode);
}
$('yt-big').addEventListener('click', () => setPlayerMode(screen.classList.contains('big') ? 'open' : 'big'));
setPlayerMode('open');
async function playItem(it) {
  stopAll();
  setLed('LOAD');
  let how = '';
  if (spConnected) {
    let uri = it.spotifyUri;
    if (!uri) { const o = await odesli(it.url); if (o) { uri = o.spotifyUri; mergeMeta(it, o); } }
    if (uri) { N.spotifyPlay(uri); how = 'spotify'; it.how = 'spotify'; showSpotifyScreen(); }
  }
  if (!how) {
    let yt = it.ytId;
    if (!yt && it.kind !== 'soundcloud' && it.kind !== 'mixcloud') { const o = await odesli(it.url); if (o) { yt = o.ytId; mergeMeta(it, o); } }
    if (yt) { showFrame(`https://www.youtube.com/embed/${yt}?enablejsapi=1&autoplay=1&playsinline=1&controls=1&cc_load_policy=0&iv_load_policy=3&fs=0&rel=0&modestbranding=1&origin=${encodeURIComponent(location.origin)}`); how = 'youtube'; }
  }
  if (!how && (it.kind === 'soundcloud')) { showFrame('https://w.soundcloud.com/player/?auto_play=true&visual=true&url=' + encodeURIComponent(it.url)); how = 'soundcloud'; }
  if (!how && it.kind === 'mixcloud') { const path = it.url.replace(/^https?:\/\/(www\.)?mixcloud\.com/i, ''); showFrame('https://www.mixcloud.com/widget/iframe/?autoplay=1&feed=' + encodeURIComponent(path)); how = 'mixcloud'; }
  it.how = how;
  return !!how;
}
function mergeMeta(it, o) { if (!it.meta) it.meta = {}; if (!it.meta.title && o.title) it.meta.title = o.title; if (!it.meta.artist && o.artist) it.meta.artist = o.artist; }

/* ================= Telegram ================= */
const TG = window.telegram || null;
let client = null, peer = null;
const feed = { items: [], seen: new Set(), idx: -1, fresh: [], oldestId: 0, newestId: 0, loadingMore: false, done: false };
let live = false;

const replies = new Map();
const NAME = "(@\\w{3,}|[A-Z][\\w.&'\u2019-]+(?:\\s(?:[A-Z][\\w.&'\u2019-]+|b2b|B2B|&|x))*)";
const DJ_RES = [
  new RegExp("(?:[Pp]layed|[Dd]ropped|[Ss]pun|[Cc]losed|[Oo]pened|[Ss]et)\\s+by\\s+" + NAME),
  new RegExp("(?:\\bin|\\bduring|\\bfrom|\\bat)\\s+" + NAME + "(?:'s|\u2019s)\\s+(?:set|closing|opening)"),
  new RegExp("\\b(?:DJ|dj|Dj)\\s*[:\\-]\\s*" + NAME),
  new RegExp(NAME + "\\s+(?:played|dropped|closed with|opened with|was playing)\\b")
];
const NOT_DJ = /^(Panorama|Panoramabar|Berghain|Pano|Klubnacht|Saturday|Sunday|Friday|Monday|The|This|That|It|I|He|She|They|We|Someone|Last|Tonight|Today)$/i;
function findDJ(it) {
  const texts = [it.text || '', ...(replies.get(it.id) || [])];
  for (const t of texts) {
    for (const re of DJ_RES) {
      const m = t.match(re);
      if (m && m[1]) {
        const name = m[1].replace(/[.,!?]+$/, '').trim();
        if (name.length >= 2 && !NOT_DJ.test(name.split(/\s/)[0])) return name;
      }
    }
  }
  return '';
}
function itemsFromMessages(msgs) {
  for (const m of msgs) {
    const to = m && m.replyTo && m.replyTo.replyToMsgId;
    if (to && m.message) { if (!replies.has(to)) replies.set(to, []); replies.get(to).push(m.message); }
  }
  const out = [];
  for (const m of msgs) {
    if (!m || !m.id) continue;
    for (const url of linksFromMessage(m)) {
      const key = url.replace(/[?&](si|utm_[a-z]+|feature|pp)=[^&]*/gi, '');
      if (feed.seen.has(key)) continue;
      feed.seen.add(key);
      const it = { id: m.id, date: m.date, url, text: m.message || '', meta: previewMeta(m) || {}, ...classify(url) };
      out.push(it);
    }
  }
  return out;
}
async function tgClient() {
  if (!TG) throw new Error('Telegram library missing from this build');
  const { TelegramClient, sessions } = TG;
  const apiId = parseInt(store.get('apiId'), 10), apiHash = store.get('apiHash');
  if (!apiId || !apiHash) throw new Error('Enter your API ID and API hash');
  const c = new TelegramClient(new sessions.StringSession(store.get('session')), apiId, apiHash, { connectionRetries: 5, useWSS: true });
  try { c.setLogLevel('error'); } catch (e) {}
  await c.connect();
  return c;
}
async function resolvePeer() {
  const gid = store.get('groupId');
  if (!gid) return null;
  const dialogs = await client.getDialogs({ limit: 300 });
  const d = dialogs.find(x => String(x.id) === gid);
  return d ? d.entity : null;
}
async function loadInitial() {
  setLed('SYNC');
  const msgs = await client.getMessages(peer, { limit: 200 });
  const items = itemsFromMessages(msgs);
  feed.items = items; feed.idx = -1; feed.fresh = [];
  feed.newestId = msgs.length ? Math.max(...msgs.map(m => m.id)) : 0;
  feed.oldestId = msgs.length ? Math.min(...msgs.map(m => m.id)) : 0;
  feed.done = msgs.length < 200;
  live = true;
  restoreHistory();
  const seen = +store.get('seenNewest', '0');
  const lastId = +store.get('lastId', '0'), lastUrl = store.get('lastUrl');
  let resumed = false;
  if (lastId) {
    let pos = feed.items.findIndex(x => x.id === lastId && x.url === lastUrl);
    for (let pages = 0; pos < 0 && !feed.done && pages < 15; pages++) { await loadMore(); pos = feed.items.findIndex(x => x.id === lastId && x.url === lastUrl); }
    if (pos >= 0) { feed.idx = pos; resumed = true; }
  }
  if (resumed && seen) feed.fresh = feed.items.filter(x => x.id > seen).sort((a, b) => b.id - a.id);
  store.set('seenNewest', String(feed.newestId));
  setLed(items.length ? 'PUSH' : 'NONE');
  if (!items.length) toast('No music links found yet');
  else if (resumed) toast(feed.fresh.length ? `Carrying on where you left off · ${feed.fresh.length} new posts first` : 'Carrying on where you left off');
  else toast(`${items.length} tracks loaded, newest first`);
}
async function loadMore() {
  if (feed.loadingMore || feed.done || !client) return;
  feed.loadingMore = true;
  try {
    const msgs = await client.getMessages(peer, { limit: 200, offsetId: feed.oldestId });
    if (!msgs.length) feed.done = true;
    else { feed.oldestId = Math.min(...msgs.map(m => m.id)); feed.items.push(...itemsFromMessages(msgs)); }
  } catch (e) { console.log('loadMore', e && e.message); }
  feed.loadingMore = false;
}
async function poll() {
  if (!client || !peer || !live) return;
  try {
    const msgs = await client.getMessages(peer, { limit: 50, minId: feed.newestId });
    if (msgs.length) {
      feed.newestId = Math.max(feed.newestId, ...msgs.map(m => m.id));
      const items = itemsFromMessages(msgs).sort((a, b) => b.id - a.id);
      if (items.length) { feed.fresh.unshift(...items); toast(items.length === 1 ? 'New post! Push to play it' : `${items.length} new posts! Push to play`); }
    }
  } catch (e) { console.log('poll', e && e.message); }
}
setInterval(poll, 60000);

async function startLive() {
  try {
    client = await tgClient();
    if (!(await client.checkAuthorization())) { client = null; return false; }
    peer = await resolvePeer();
    if (!peer) { toast('Pick your group in settings'); return false; }
    await loadInitial();
    return true;
  } catch (e) {
    console.log('startLive', e && e.message);
    toast('Telegram: ' + (e && e.message || 'could not connect'));
    return false;
  }
}

/* ================= button ================= */
const push = $('push'), card = $('card');
let cur = null, demoIdx = -1, busy = false, palIdx = 0;
function relTime(sec) {
  const d = Date.now() / 1000 - sec;
  if (d < 3600) return Math.max(1, d / 60 | 0) + 'm ago';
  if (d < 86400) return (d / 3600 | 0) + 'h ago';
  return (d / 86400 | 0) + 'd ago';
}
function dayLabel(sec) { return new Date(sec * 1000).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }); }
function fillCard() {
  let artist = '', title = '', label = '', posted = '', src = '', dj = 'Unknown';
  if (!live) {
    const t = DEMO[demoIdx < 0 ? 0 : demoIdx];
    artist = t.artist; title = t.title; label = t.label; dj = 'Demo'; posted = 'Built-in demo'; src = 'Demo track · connect Telegram in settings';
  } else if (cur) {
    const m = cur.meta || {};
    if (cur.how === 'spotify' && spState && spState.name) { artist = spState.artist; title = spState.name; }
    artist = artist || m.artist || '—'; title = title || m.title || cur.url;
    label = cur.label === undefined ? 'Looking it up…' : (cur.label || 'Unknown');
    dj = findDJ(cur) || 'Unknown';
    src = 'Playing via ' + ({ spotify: 'Spotify', youtube: 'YouTube', soundcloud: 'SoundCloud', mixcloud: 'Mixcloud' }[cur.how] || 'nothing') + ' · tap to close';
  } else { title = 'Push the button to start'; }
  card.innerHTML = `<div class="k">ARTIST</div><div class="v big">${esc(artist)}</div><div class="k">TRACK</div><div class="v">${esc(title)}</div><div class="k">LABEL</div><div class="v">${esc(label)}</div><div class="k">DJ</div><div class="v dj">${esc(dj)}</div><div class="src">${esc(src)}</div>`;
}
async function lookupLabel(it) {
  if (it.label !== undefined) return;
  let { artist, title } = it.meta || {};
  if (!artist || !title) { const o = await odesli(it.url); if (o) { mergeMeta(it, o); artist = it.meta.artist; title = it.meta.title; } }
  it.label = await findLabel(artist || '', title || '');
  if (cur === it && card.classList.contains('show')) fillCard();
}
const HIST_MAX = 21;
let history = [], back = 0;
const slim = it => ({ id: it.id, date: it.date, url: it.url, text: (it.text || '').slice(0, 600), meta: it.meta, kind: it.kind, spotifyUri: it.spotifyUri, ytId: it.ytId, label: it.label });
function saveHistory() { store.set('history', JSON.stringify(history.map(slim))); }
function restoreHistory() { try { history = JSON.parse(store.get('history', '[]')) || []; } catch (e) { history = []; } back = 0; }
function remember(it) {
  history.push(it); if (history.length > HIST_MAX) history.shift(); back = 0; saveHistory();
}
function restartTrack() {
  stopped = false;
  if (!live) { if (demoIdx >= 0) Demo.play(demoIdx); return; }
  if (!cur) return;
  if (cur.how === 'spotify' && N) { N.spotifySeek(0); N.spotifyResume(); }
  else if (cur.how === 'youtube') { ytTime = 0; ytSeek(0); ytCmd('playVideo'); }
  else if (cur.how === 'soundcloud') { const f = screen.querySelector('iframe'); if (f) f.contentWindow.postMessage(JSON.stringify({ method: 'seekTo', value: 0 }), '*'); ytCmd('playVideo'); }
  else if (cur.how === 'mixcloud') { const f = screen.querySelector('iframe'); if (f) showFrame(f.src); }
  setLed('0:00'); setTimeout(() => { if (!stopped) setLed(back ? 'BACK ' + back : String(Math.max(1, feed.idx + 1)).padStart(2, '0')); }, 1200);
}
async function previousTrack() {
  if (busy) return;
  if (!live) {
    demoIdx = (demoIdx - 1 + DEMO.length) % DEMO.length; stopAll(); Demo.play(demoIdx); setLed(String(demoIdx + 1).padStart(2, '0'));
    if (card.classList.contains('show')) fillCard();
    return;
  }
  const maxBack = Math.min(20, history.length - 1);
  if (back >= maxBack) { toast(maxBack > 0 ? `That's as far back as it goes (${maxBack} tracks)` : 'No earlier tracks yet'); return; }
  busy = true;
  try {
    back++;
    const it = history[history.length - 1 - back];
    cur = it;
    const ok = await playItem(it);
    setLed(ok ? 'BACK ' + back : 'PUSH');
    if (ok) { lookupLabel(it); if (card.classList.contains('show')) fillCard(); }
  } finally { busy = false; }
}
async function next() {
  if (busy) return;
  busy = true;
  try {
    if (!live) {
      demoIdx = (demoIdx + 1) % DEMO.length; stopAll(); Demo.play(demoIdx); setLed('TRK ' + String(demoIdx + 1).padStart(2, '0'));
      if (card.classList.contains('show')) fillCard();
      return;
    }
    for (let tries = 0; tries < 6; tries++) {
      let it;
      let fromFresh = false;
      if (feed.fresh.length) { it = feed.fresh.shift(); fromFresh = true; }
      else {
        if (feed.idx + 5 >= feed.items.length) loadMore();
        if (feed.idx + 1 >= feed.items.length) { await loadMore(); if (feed.idx + 1 >= feed.items.length) { toast('You have heard them all. Starting again from the newest!'); feed.idx = -1; } }
        it = feed.items[++feed.idx];
        if (it) { store.set('lastId', String(it.id)); store.set('lastUrl', it.url); }
      }
      if (!it) break;
      cur = it;
      const ok = await playItem(it);
      if (ok) {
        remember(it);
        setLed(fromFresh ? 'NEW' : String(feed.idx + 1).padStart(2, '0'));
        lookupLabel(it);
        if (card.classList.contains('show')) fillCard();
        return;
      }
      toast('Skipped a link that could not be played');
    }
    setLed('PUSH');
  } finally { busy = false; }
}
let holdT = null, held = false, hideT = null;
push.addEventListener('pointerdown', e => {
  e.preventDefault(); push.classList.add('down'); held = false;
  holdT = setTimeout(() => { held = true; fillCard(); card.classList.add('show'); clearTimeout(hideT); if (cur) lookupLabel(cur); }, 450);
});
const rw = $('rewind');
let rwT = null, rwLast = 0;
rw.addEventListener('click', () => {
  const now = Date.now();
  if (now - rwLast < 320 && rwT) { clearTimeout(rwT); rwT = null; rwLast = 0; previousTrack(); return; }
  rwLast = now;
  rwT = setTimeout(() => { rwT = null; restartTrack(); }, 300);
});
let tapT = null, lastTap = 0;
push.addEventListener('pointerup', () => {
  push.classList.remove('down'); clearTimeout(holdT);
  if (held) { hideT = setTimeout(() => card.classList.remove('show'), 5000); return; }
  const now = Date.now();
  if (now - lastTap < 320 && tapT) { clearTimeout(tapT); tapT = null; lastTap = 0; toggleStop(); return; }
  lastTap = now;
  tapT = setTimeout(() => { tapT = null; next(); }, 300);
});
push.addEventListener('pointercancel', () => { push.classList.remove('down'); clearTimeout(holdT); });
push.addEventListener('contextmenu', e => e.preventDefault());
push.addEventListener('keydown', e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); next(); } });
card.addEventListener('click', () => card.classList.remove('show'));

// windows pulse at 123 bpm only while music is actually playing
function isPlaying() {
  if (stopped || busy) return false;
  if (!live) return Demo.running();
  if (!cur || !cur.how) return false;
  if (cur.how === 'spotify') return !!(spState && !spState.paused);
  if (cur.how === 'youtube') return ytState === 1;
  return true;
}
// background play: keep the app alive for sound it makes itself; YouTube pauses while the app is hidden
let svcOn = false, ytAutoPaused = false;
window.__appHidden = () => {
  if (cur && cur.how === 'youtube' && isPlaying()) { ytCmd('pauseVideo'); ytAutoPaused = true; }
};
window.__appShown = () => {
  if (ytAutoPaused && cur && cur.how === 'youtube' && !stopped) ytCmd('playVideo');
  ytAutoPaused = false;
};
setInterval(() => {
  const playing = isPlaying();
  const needSvc = playing && (!live || (cur && (cur.how === 'soundcloud' || cur.how === 'mixcloud')));
  if (needSvc !== svcOn && N && N.setPlaying) {
    svcOn = needSvc;
    const t = !live ? DEMO[Math.max(0, demoIdx)].title : ((cur && cur.meta && cur.meta.title) || 'Playing');
    N.setPlaying(needSvc, t);
  }
}, 500);
setInterval(() => {
  stage.classList.toggle('still', !isPlaying());
  if (cur && cur.how === 'spotify' && !scrubbing && spState && !spState.paused && spAt) ytTime = Math.min(ytDur || 1e9, spBase + (Date.now() - spAt) / 1000);
  if (cur && (cur.how === 'youtube' || cur.how === 'spotify')) scrubUI();
}, 200);

/* ================= settings panel ================= */
const panel = $('panel');
const show = (id, on) => $(id).classList.toggle('hide', !on);
function openPanel() { panel.classList.add('on'); renderTgStatus(); renderSpStatus(); }
$('gear').addEventListener('click', openPanel);
$('close-panel').addEventListener('click', () => panel.classList.remove('on'));
$('open-mytg').addEventListener('click', () => N ? N.openExternal('https://my.telegram.org/apps') : window.open('https://my.telegram.org/apps'));
$('open-spdev').addEventListener('click', () => N ? N.openExternal('https://developer.spotify.com/dashboard') : window.open('https://developer.spotify.com/dashboard'));

function renderTgStatus() {
  const name = store.get('groupName');
  const loggedIn = !!store.get('session');
  $('tg-status').innerHTML = loggedIn
    ? `<p class="ok">Connected${name ? ' · playing from ' + esc(name) : ''}</p>`
    : '<p>Not connected yet. Until you connect, the button plays built-in demo tracks.</p>';
  show('tg-connect', !loggedIn); show('tg-change', loggedIn); show('tg-logout', loggedIn);
}
function renderSpStatus() {
  $('sp-status').innerHTML = spConnected ? '<p class="ok">Connected. Spotify links play in full through your Spotify app.</p>'
    : (N && !N.spotifyInstalled() ? '<p>The Spotify app is not installed on this phone.</p>' : '<p>Not connected. Spotify links will play through YouTube instead.</p>');
  $('sp-id').value = store.get('spClientId');
}

/* login flow: gramjs asks for each value through these promises */
let waiters = {};
const ask = k => new Promise(res => { waiters[k] = res; });
const answer = (k, v) => { if (waiters[k]) { const f = waiters[k]; delete waiters[k]; f(v); } };
const tgErr = m => { $('tg-err').textContent = m || ''; };

$('tg-connect').addEventListener('click', () => {
  show('tg-creds', true); show('tg-connect', false);
  $('api-id').value = store.get('apiId'); $('api-hash').value = store.get('apiHash'); $('phone').value = store.get('phone');
});
$('send-code').addEventListener('click', async () => {
  const id = $('api-id').value.trim(), hash = $('api-hash').value.trim(), phone = $('phone').value.replace(/[^\d+]/g, '');
  if (!/^\d{3,}$/.test(id)) return tgErr('Enter the API ID: it is a number.');
  if (!/^[a-f0-9]{32}$/i.test(hash)) return tgErr('The API hash is 32 letters and numbers.');
  if (!/^\+\d{7,}$/.test(phone)) return tgErr('Enter your phone number starting with + and the country code.');
  tgErr(''); store.set('apiId', id); store.set('apiHash', hash); store.set('phone', phone); store.del('session');
  $('send-code').disabled = true; $('send-code').textContent = 'Sending…';
  try {
    client = await tgClient();
    await client.start({
      phoneNumber: async () => phone,
      phoneCode: async () => { show('tg-creds', false); show('tg-code', true); $('code').focus(); return ask('code'); },
      password: async () => { show('tg-code', false); show('tg-pass', true); $('pass').focus(); return ask('pass'); },
      onError: async err => { tgErr(String(err && (err.errorMessage || err.message) || err)); return false; }
    });
    store.set('session', client.session.save());
    show('tg-code', false); show('tg-pass', false);
    await showGroups();
  } catch (e) {
    tgErr('Telegram: ' + (e && (e.errorMessage || e.message) || 'login failed'));
    show('tg-creds', true); show('tg-code', false); show('tg-pass', false);
  }
  $('send-code').disabled = false; $('send-code').textContent = 'Send login code';
});
$('submit-code').addEventListener('click', () => { const v = $('code').value.trim(); if (!v) return tgErr('Enter the code.'); tgErr(''); answer('code', v); });
$('submit-pass').addEventListener('click', () => { const v = $('pass').value; if (!v) return tgErr('Enter your password.'); tgErr(''); answer('pass', v); });

let groupList = [];
async function showGroups() {
  show('tg-groups', true);
  $('glist').innerHTML = '<p style="padding:10px">Loading your chats…</p>';
  try {
    if (!client) client = await tgClient();
    const dialogs = await client.getDialogs({ limit: 300 });
    groupList = dialogs.filter(d => d.isGroup || d.isChannel).map(d => ({ id: String(d.id), name: d.title || d.name || 'Untitled', entity: d.entity }));
    renderGroups();
  } catch (e) { $('glist').innerHTML = ''; tgErr('Could not load chats: ' + (e && e.message)); }
}
function renderGroups() {
  const f = $('gfilter').value.trim().toLowerCase();
  const list = groupList.filter(g => !f || g.name.toLowerCase().includes(f)).slice(0, 80);
  $('glist').innerHTML = list.map(g => `<button data-id="${esc(g.id)}">${esc(g.name)}</button>`).join('') || '<p style="padding:10px">No matching chats</p>';
}
$('gfilter').addEventListener('input', renderGroups);
$('glist').addEventListener('click', async e => {
  const b = e.target.closest('button'); if (!b) return;
  const g = groupList.find(x => x.id === b.dataset.id); if (!g) return;
  store.set('groupId', g.id); store.set('groupName', g.name);
  peer = g.entity; show('tg-groups', false); renderTgStatus(); panel.classList.remove('on');
  stopAll(); cur = null;
  try { await loadInitial(); } catch (err) { toast('Could not read that chat: ' + (err && err.message)); }
});
$('tg-change').addEventListener('click', showGroups);
$('tg-logout').addEventListener('click', async () => {
  try { if (client) await client.invoke(new TG.Api.auth.LogOut()); } catch (e) {}
  store.del('session'); store.del('groupId'); store.del('groupName');
  client = null; peer = null; live = false; feed.items = []; feed.seen.clear(); cur = null; stopAll();
  renderTgStatus(); setLed('PUSH'); toast('Logged out. Demo tracks are back.');
});

let spTimer = null;
$('sp-open').addEventListener('click', () => { if (N) N.openExternal('spotify:'); });
$('sp-connect').addEventListener('click', () => {
  const id = $('sp-id').value.trim();
  if (!/^[a-f0-9]{32}$/i.test(id)) { $('sp-err').textContent = 'The Client ID is 32 letters and numbers.'; return; }
  if (!N) { $('sp-err').textContent = 'Spotify only works inside the Android app.'; return; }
  if (!N.spotifyInstalled()) { $('sp-err').textContent = 'Install the Spotify app first.'; return; }
  store.set('spClientId', id); $('sp-err').textContent = 'Connecting… approve it in Spotify if asked.';
  N.spotifyConnect(id);
  clearTimeout(spTimer);
  spTimer = setTimeout(() => {
    if (spConnected) return;
    if (!spConnected) $('sp-err').textContent = 'No answer from Spotify yet. Tap "Open Spotify", play any song for a few seconds, come back here and tap Connect Spotify again.';
  }, 45000);
});

/* ================= start ================= */
if (!TG) console.log('telegram.js missing');
if (store.get('spClientId') && N && N.spotifyInstalled()) N.spotifyConnect(store.get('spClientId'));
if (store.get('session')) startLive().then(ok => { if (!ok && !store.get('groupId')) openPanel(); });
else setTimeout(() => toast('Demo mode · tap the gear to connect Telegram', 4000), 800);
})();
