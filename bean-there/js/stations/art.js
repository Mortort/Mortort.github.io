import { cup } from '../core/state.js';
import { emit, on } from '../core/events.js';
import { panel } from '../core/ui.js';

// Target patterns as lists of [x,y] points on a 200x200 canvas.
const ring = (cx, cy, rx, ry, n = 24) => Array.from({ length: n }, (_, i) => {
  const t = i / n * Math.PI * 2; return [cx + rx * Math.cos(t), cy + ry * Math.sin(t)];
});
export const SHAPES = {
  heart: () => Array.from({ length: 60 }, (_, i) => {
    const t = i / 60 * Math.PI * 2, s = Math.sin(t);
    const v = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    return [100 + 5 * 16 * s ** 3, 95 - 5 * v];
  }),
  rosetta: () => Array.from({ length: 60 }, (_, i) => {
    const u = i / 59; return [100 + Math.sin(u * 18) * 40 * (1 - u * 0.4), 170 - u * 140];
  }),
  tulip: () => [...ring(100, 150, 50, 22), ...ring(100, 100, 40, 20), ...ring(100, 55, 28, 16)]
};

const TILE = `<svg viewBox="0 0 120 100"><circle cx="60" cy="50" r="38" fill="#7a4a2a"/><path d="M60 72C34 54 40 32 54 36 58 38 60 42 60 42 60 42 62 38 66 36 80 32 86 54 60 72z" fill="#f1efe8"/></svg>`;

export default {
  id: 'art',
  mount(root) {
    const tile = document.createElement('button');
    tile.className = 'tile';
    tile.innerHTML = `${TILE}Tap: latte art`;
    panel(root, 'Latte art').append(tile);

    const modal = document.createElement('div');
    modal.id = 'artModal'; modal.hidden = true;
    modal.innerHTML = `<div class="artbox"><b>Trace the pattern</b>
      <div class="row" id="shapes">${Object.keys(SHAPES).map(s => `<button data-s="${s}">${s}</button>`).join('')}</div>
      <canvas width="200" height="200"></canvas>
      <div class="row"><button class="quiet" id="aClear">Clear</button><button class="quiet" id="aBack">Back</button><button id="aPour">Pour</button></div></div>`;
    document.body.append(modal);

    const cv = modal.querySelector('canvas'), c = cv.getContext('2d');
    let shape = 'heart', pts = [], drawing = false;
    const redraw = () => {
      c.clearRect(0, 0, 200, 200);
      c.fillStyle = 'rgba(241,239,232,.3)';
      SHAPES[shape]().forEach(([x, y]) => { c.beginPath(); c.arc(x, y, 2.5, 0, 7); c.fill(); });
      modal.querySelectorAll('#shapes button').forEach(b => b.classList.toggle('on', b.dataset.s === shape));
    };
    const pos = e => { const r = cv.getBoundingClientRect(), k = 200 / r.width; return [(e.clientX - r.left) * k, (e.clientY - r.top) * k]; };
    const addPoint = pt => {
      const last = pts[pts.length - 1];
      if (last) {
        const d = Math.hypot(pt[0] - last[0], pt[1] - last[1]);
        for (let s = 6; s < d; s += 6) pts.push([last[0] + (pt[0] - last[0]) * s / d, last[1] + (pt[1] - last[1]) * s / d]);
        c.strokeStyle = '#f1efe8'; c.lineWidth = 7; c.lineCap = 'round';
        c.beginPath(); c.moveTo(...last); c.lineTo(...pt); c.stroke();
      }
      pts.push(pt);
    };
    cv.addEventListener('pointerdown', e => { drawing = true; cv.setPointerCapture(e.pointerId); addPoint(pos(e)); });
    cv.addEventListener('pointermove', e => { if (drawing) addPoint(pos(e)); });
    ['pointerup', 'pointercancel'].forEach(n => cv.addEventListener(n, () => { drawing = false; }));

    const score = () => {
      const T = SHAPES[shape]();
      const near = (a, arr, r) => arr.some(b => Math.hypot(a[0] - b[0], a[1] - b[1]) < r);
      const hit = T.filter(t => near(t, pts, 16)).length / T.length;
      const stray = pts.filter(q => !near(q, T, 24)).length / pts.length;
      return Math.min(1, Math.max(0, hit - stray * 0.5) * 1.2);
    };
    const clear = () => { pts = []; redraw(); };

    tile.onclick = () => {
      if (cup.milk?.type !== 'steamed') return emit('toast', 'Steam milk first, then pour art');
      clear(); modal.hidden = false;
    };
    modal.querySelector('#shapes').onclick = e => { if (e.target.dataset.s) { shape = e.target.dataset.s; clear(); } };
    modal.querySelector('#aClear').onclick = clear;
    modal.querySelector('#aBack').onclick = () => { modal.hidden = true; };
    modal.querySelector('#aPour').onclick = () => {
      if (pts.length < 10) return emit('toast', 'Draw the pattern first');
      cup.art = { shape, q: score() }; modal.hidden = true; emit('cup', cup);
    };
    redraw();
  }
};
