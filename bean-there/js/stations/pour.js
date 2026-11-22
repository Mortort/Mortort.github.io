import { cup, pitcher, work, wandRun } from '../core/state.js';
import { emit, on } from '../core/events.js';
import { panel, makeProp, makeDropZone } from '../core/ui.js';
import { pitcherSVG } from './milk.js';

const ART = `<svg viewBox="0 0 120 76"><g transform="rotate(-30 50 40)"><path d="M24 14h40l-5 40H29z" fill="#c9d3d6"/></g><path d="M22 50q-2 10 4 18" stroke="#f1efe8" stroke-width="4" fill="none"/><path d="M62 52h40l-4 20H66z" fill="#f1efe8"/></svg>`;

export default {
  id: 'pour',
  mount(root) {
    const p = panel(root, 'Pour Station', 'pour');

    const b = document.createElement('button');
    b.className = 'tile';
    b.innerHTML = `${ART}<span>Pour Milk Into Cup</span>`;
    b.onclick = () => {
      if (pitcher.at !== 'pour') return emit('toast', 'Bring the pitcher to the pour station first');
      if (pitcher.stage === 'empty') return emit('toast', 'Pitcher is empty');
      if (!cup.at) return emit('toast', 'Get a cup first');
      if (cup.at !== 'counter') return emit('toast', 'Move the cup from the machine to the counter first');
      if (cup.milk) return emit('toast', 'This cup already has milk');

      const milkType = pitcher.stage === 'steamed' ? 'steamed' : 'cold';
      const q = pitcher.stage === 'steamed' ? (pitcher.fillQ + pitcher.steamQ) / 2 : pitcher.fillQ;
      cup.milk = { type: milkType, q };
      pitcher.stage = 'empty';
      pitcher.fillQ = 0;
      pitcher.steamQ = 0;
      work();
      emit('cup', cup);
      emit('toast', `Poured ${milkType} milk!`);
    };
    p.append(b);

    const dock = document.createElement('div');
    dock.className = 'dock';
    p.append(dock);

    makeDropZone(p, ['pitcher'], () => {
      if (wandRun.active) return emit('toast', 'Turn off steam wand first!');
      pitcher.at = 'pour';
      work();
    });

    const renderDock = () => {
      dock.innerHTML = '';
      if (pitcher.at === 'pour') {
        const item = document.createElement('div');
        item.className = 'phys-item';
        const st = pitcher.stage === 'empty' ? 'Empty Pitcher' : pitcher.stage === 'filled' ? 'Cold Milk' : 'Steamed Milk';
        item.innerHTML = `${pitcherSVG()}<small>${st}</small>`;
        makeProp(item, 'pitcher', 'Milk Pitcher');
        dock.append(item);
      } else {
        dock.innerHTML = `<div class="slot-hint">Drop pitcher to pour</div>`;
      }
    };

    on('work', renderDock);
    renderDock();
  }
};
