import { on, emit } from './events.js';
import { held, selectItem } from './state.js';

export function panel(root, title, id) {
  const s = document.createElement('section');
  s.className = 'panel';
  if (id) s.dataset.station = id;
  s.innerHTML = `<h2>${title}</h2>`;
  root.append(s);
  return s;
}

// Hold-to-fill gauge (for grinding, tamping, filling pitcher)
export function gauge(root, label, { zone: [lo, hi], speed, canStart, onDone }) {
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
  const start = e => {
    e.preventDefault();
    if (raf) return;
    if (canStart && !canStart()) return;
    v = 0; t0 = performance.now(); raf = requestAnimationFrame(tick);
  };
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
  return w;
}

// Makes an element a physical draggable & tap-selectable prop ('pf' | 'pitcher' | 'cup')
export function makeProp(el, itemType, label) {
  el.classList.add('prop');
  el.dataset.prop = itemType;
  el.setAttribute('draggable', 'true');
  el.title = `Drag or tap to move ${label}`;

  el.addEventListener('dragstart', e => {
    e.dataTransfer.setData('text/plain', itemType);
    e.dataTransfer.effectAllowed = 'move';
    el.classList.add('dragging');
  });
  el.addEventListener('dragend', () => el.classList.remove('dragging'));

  // Touch drag support via pointer events on drag handle
  let startX = 0, startY = 0, ghost = null, dragging = false;
  el.addEventListener('pointerdown', e => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    startX = e.clientX; startY = e.clientY; dragging = false;
    const onMove = ev => {
      if (!dragging && Math.hypot(ev.clientX - startX, ev.clientY - startY) > 10) {
        dragging = true;
        ghost = el.cloneNode(true);
        ghost.className = 'drag-ghost';
        document.body.append(ghost);
        el.classList.add('dragging');
      }
      if (dragging && ghost) {
        ghost.style.left = ev.clientX + 'px';
        ghost.style.top = ev.clientY + 'px';
        document.querySelectorAll('.drop-zone').forEach(z => {
          const r = z.getBoundingClientRect();
          const over = ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom;
          z.classList.toggle('drag-over', over && z.dataset.accepts?.split(',').includes(itemType));
        });
      }
    };
    const onUp = ev => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      el.classList.remove('dragging');
      if (ghost) {
        ghost.remove(); ghost = null;
        document.querySelectorAll('.drop-zone').forEach(z => z.classList.remove('drag-over'));
        const target = document.elementFromPoint(ev.clientX, ev.clientY)?.closest('.drop-zone');
        if (target && target.dataset.accepts?.split(',').includes(itemType)) {
          target._onDrop?.(itemType);
          if (held.item === itemType) selectItem(null);
        }
      } else {
        // Short tap toggles selection for tap-to-place
        selectItem(itemType);
      }
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  });

  on('held', h => el.classList.toggle('selected', h === itemType));
  el.classList.toggle('selected', held.item === itemType);
}

// Makes a station panel or slot accept dropped or tap-placed items
export function makeDropZone(el, accepts, onDrop) {
  el.classList.add('drop-zone');
  el.dataset.accepts = accepts.join(',');
  el._onDrop = onDrop;

  el.addEventListener('dragover', e => {
    e.preventDefault();
    el.classList.add('drag-over');
  });
  el.addEventListener('dragleave', () => el.classList.remove('drag-over'));
  el.addEventListener('drop', e => {
    e.preventDefault();
    el.classList.remove('drag-over');
    const item = e.dataTransfer.getData('text/plain');
    if (accepts.includes(item)) {
      onDrop(item);
      if (held.item === item) selectItem(null);
    }
  });

  // Tap-to-place when an item is selected
  el.addEventListener('click', e => {
    if (held.item && accepts.includes(held.item)) {
      e.stopPropagation();
      const item = held.item;
      selectItem(null);
      onDrop(item);
    }
  });

  on('held', h => {
    el.classList.toggle('can-drop', Boolean(h && accepts.includes(h)));
  });
}

export function badge(p, fn) {
  const d = document.createElement('div');
  d.className = 'st'; p.append(d);
  const f = () => { d.textContent = fn(); };
  on('work', f); on('cup', f); f();
}
