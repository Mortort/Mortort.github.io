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

export default {
  id: 'art',
  mount(root) {
    const p = panel(root, 'Latte art');
    const cv = document.createElement('canvas');
    cv.width = cv.height = 200;
    p.append(cv);
    const c = cv.getContext('2d');
    let shape = 'heart', pts = [], drawing = false;

    const redraw = () => {
      c.clearRect(0, 0, 200, 200);
      c.fillStyle = 'rgba(241,239,232,.3)';
      SHAPES[shape]().forEach(([x, y]) => { c.beginPath(); c.arc(x, y, 2.5, 0, 7); c.fill(); });
    };
    const pos = e => {
      const r = cv.getBoundingClientRect(), k = 200 / r.width;
      return [(e.clientX - r.left) * k, (e.clientY - r.top) * k];
    };
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

    const row = document.createElement('div');
    row.className = 'row';
    row.innerHTML = '<button class="quiet">Clear</button><button>Finish pour</button>';
    const [bClear, bDone] = row.children;
    bClear.onclick = () => { clear(); cup.art = null; emit('cup', cup); };
    bDone.onclick = () => {
      if (cup.milk?.type !== 'steamed') return emit('toast', 'Steam milk before pouring art');
      if (pts.length < 10) return emit('toast', 'Draw the pattern first');
      cup.art = score(); emit('cup', cup);
    };
    p.append(row);

    on('order', d => { shape = d?.art || 'heart'; clear(); });
    on('cup', () => { if (cup.milk === null && cup.art === null) clear(); });
    redraw();
  }
};
