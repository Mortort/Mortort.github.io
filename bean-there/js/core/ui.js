// Shared UI helpers every station can use.
export function panel(root, title) {
  const s = document.createElement('section');
  s.className = 'panel';
  s.innerHTML = `<h2>${title}</h2>`;
  root.append(s);
  return s;
}

// Hold-to-fill gauge. Release inside the green zone for quality 1.
// onDone(q) gets 0..1.
export function gauge(root, label, { zone: [lo, hi], speed, onDone }) {
  const w = document.createElement('div');
  w.className = 'ctl';
  w.innerHTML = `<button class="hold">${label}</button><div class="gauge"><i style="left:${lo * 100}%;width:${(hi - lo) * 100}%"></i><b></b></div>`;
  root.append(w);
  const btn = w.querySelector('button'), bar = w.querySelector('b');
  let v = 0, raf = 0, t0 = 0;
  const tick = t => {
    v = Math.min(1, v + speed * (t - t0) / 1000); t0 = t;
    bar.style.width = v * 100 + '%';
    if (v >= 1) stop(); else raf = requestAnimationFrame(tick);
  };
  const start = e => { e.preventDefault(); if (raf) return; v = 0; t0 = performance.now(); raf = requestAnimationFrame(tick); };
  const stop = () => {
    if (!raf) return;
    cancelAnimationFrame(raf); raf = 0;
    const d = v < lo ? lo - v : v > hi ? v - hi : 0;
    bar.style.width = '0';
    onDone(Math.max(0, 1 - d / 0.3));
  };
  btn.addEventListener('pointerdown', start);
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(n => btn.addEventListener(n, stop));
  btn.addEventListener('contextmenu', e => e.preventDefault());
}

// Small status line under a station. fn() returns the text; it refreshes on cup/work events.
import { on } from './events.js';
export function badge(p, fn) {
  const d = document.createElement('div');
  d.className = 'st'; p.append(d);
  const f = () => { d.textContent = fn(); };
  on('work', f); on('cup', f); f();
}
