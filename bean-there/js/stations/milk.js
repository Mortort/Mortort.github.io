import { pitcher, work, wandRun } from '../core/state.js';
import { emit, on } from '../core/events.js';
import { panel, gauge, makeProp, makeDropZone } from '../core/ui.js';

const FRIDGE_ART = `<svg viewBox="0 0 120 82"><rect x="34" y="6" width="52" height="68" rx="6" fill="#d8e0e2"/><line x1="34" y1="32" x2="86" y2="32" stroke="#9aa7aa" stroke-width="2"/><rect x="76" y="14" width="4" height="12" rx="2" fill="#6a7679"/><rect x="76" y="40" width="4" height="18" rx="2" fill="#6a7679"/></svg>`;

export function pitcherSVG() {
  const milkFill = pitcher.stage === 'filled'
    ? '<path d="M26 24h28l-3 18H29z" fill="#6fb4d6"/>'
    : pitcher.stage === 'steamed'
    ? '<path d="M25 18h30l-4 24H29z" fill="#ffffff"/>'
    : '';
  return `<svg viewBox="0 0 90 48" class="pitcher-svg">
    <path d="M22 10h36l-5 34H27z" fill="#c9d3d6"/>
    ${milkFill}
    <path d="M56 16q16 0 12 14q-3 8-12 6" fill="none" stroke="#c9d3d6" stroke-width="5"/>
  </svg>`;
}

export default {
  id: 'milk',
  mount(root) {
    const p = panel(root, 'Milk Fridge', 'milk');

    gauge(p, `${FRIDGE_ART}<span>Hold: Pour Cold Milk</span>`, {
      zone: [0.5, 0.72],
      speed: 0.5,
      canStart() {
        if (pitcher.at !== 'milk') { emit('toast', 'Place the milk pitcher at the milk fridge first'); return false; }
        if (pitcher.stage !== 'empty') { emit('toast', 'Pitcher already has milk'); return false; }
        return true;
      },
      onDone(q) {
        pitcher.stage = 'filled';
        pitcher.fillQ = q;
        pitcher.steamQ = 0;
        work();
        emit('toast', `Pitcher filled (${Math.round(q * 100)}%) — move to steam wand!`);
      }
    });

    const dock = document.createElement('div');
    dock.className = 'dock';
    p.append(dock);

    const dumpMilk = document.createElement('button');
    dumpMilk.className = 'quiet';
    dumpMilk.style.cssText = 'width:100%;margin-top:4px;padding:4px;font-size:.75rem';
    dumpMilk.textContent = 'Rinse Pitcher';
    dumpMilk.onclick = () => {
      if (wandRun.active) return emit('toast', 'Turn off steam wand first');
      pitcher.stage = 'empty';
      pitcher.fillQ = 0;
      pitcher.steamQ = 0;
      work();
    };
    p.append(dumpMilk);

    makeDropZone(p, ['pitcher'], () => {
      if (wandRun.active) return emit('toast', 'Turn off the steam wand before moving the pitcher!');
      pitcher.at = 'milk';
      work();
    });

    const renderDock = () => {
      dock.innerHTML = '';
      if (pitcher.at === 'milk') {
        const item = document.createElement('div');
        item.className = 'phys-item';
        const st = pitcher.stage === 'empty' ? 'Empty Pitcher' : pitcher.stage === 'filled' ? 'Cold Milk' : 'Steamed Milk';
        item.innerHTML = `${pitcherSVG()}<small>${st}</small>`;
        makeProp(item, 'pitcher', 'Milk Pitcher');
        dock.append(item);
      } else {
        dock.innerHTML = `<div class="slot-hint">Drop pitcher here</div>`;
      }
    };

    on('work', renderDock);
    renderDock();
  }
};
