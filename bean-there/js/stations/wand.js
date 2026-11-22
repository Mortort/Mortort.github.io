import { pitcher, work, wandRun } from '../core/state.js';
import { emit, on } from '../core/events.js';
import { panel, makeProp, makeDropZone } from '../core/ui.js';
import { pitcherSVG } from './milk.js';

const wandArt = () => {
  const active = wandRun.active;
  return `<svg viewBox="0 0 120 82">
    <rect x="35" y="4" width="50" height="16" rx="5" fill="#9aa7aa"/>
    <path d="M60 20 L52 58" stroke="#d8e0e2" stroke-width="6" stroke-linecap="round"/>
    ${active ? `<circle cx="48" cy="64" r="10" fill="rgba(255,255,255,.55)"/>
                <circle cx="58" cy="68" r="8" fill="rgba(255,255,255,.45)"/>` : ''}
  </svg>`;
};

export default {
  id: 'wand',
  mount(root) {
    const p = panel(root, 'Steam Wand', 'wand');

    const head = document.createElement('div');
    head.className = 'wand-head';
    head.innerHTML = wandArt();
    p.append(head);

    const steamBtn = document.createElement('button');
    steamBtn.className = 'action-btn';
    steamBtn.textContent = '♨️ Open Steam Valve';
    p.append(steamBtn);

    const gaugeWrap = document.createElement('div');
    gaugeWrap.className = 'gauge';
    gaugeWrap.innerHTML = `<i style="left:60%;width:22%"></i><b></b>`;
    p.append(gaugeWrap);
    const bar = gaugeWrap.querySelector('b');

    const dock = document.createElement('div');
    dock.className = 'dock';
    p.append(dock);

    const stopSteam = () => {
      if (!wandRun.active) return;
      clearInterval(wandRun.timer);
      wandRun.active = false;
      const v = wandRun.progress;
      wandRun.progress = 0;
      bar.style.width = '0%';
      steamBtn.textContent = '♨️ Open Steam Valve';
      steamBtn.classList.remove('active-run');

      const lo = 0.60, hi = 0.82;
      const d = v < lo ? lo - v : v > hi ? v - hi : 0;
      const steamQ = Math.max(0.1, 1 - d / 0.35);

      pitcher.stage = 'steamed';
      pitcher.steamQ = steamQ;
      emit('toast', `Microfoam ready (${Math.round(steamQ * 100)}%) — move pitcher to pour!`);
      work();
    };

    steamBtn.onclick = () => {
      if (wandRun.active) {
        stopSteam();
        return;
      }
      if (pitcher.at !== 'wand') return emit('toast', 'Place the filled pitcher under the steam wand first');
      if (pitcher.stage === 'empty') return emit('toast', 'Fill the pitcher with cold milk first!');
      if (pitcher.stage === 'steamed') return emit('toast', 'Milk is already steamed!');

      wandRun.active = true;
      wandRun.progress = 0;
      steamBtn.textContent = '⏹ Close Valve';
      steamBtn.classList.add('active-run');
      head.innerHTML = wandArt();

      wandRun.timer = setInterval(() => {
        wandRun.progress = Math.min(1, wandRun.progress + 0.018);
        bar.style.width = (wandRun.progress * 100) + '%';
        if (wandRun.progress >= 1) {
          stopSteam();
        }
      }, 50);
    };

    makeDropZone(p, ['pitcher'], () => {
      pitcher.at = 'wand';
      work();
    });

    const renderDock = () => {
      head.innerHTML = wandArt();
      dock.innerHTML = '';
      if (pitcher.at === 'wand') {
        const item = document.createElement('div');
        item.className = 'phys-item';
        const st = pitcher.stage === 'empty' ? 'Empty Pitcher' : pitcher.stage === 'filled' ? 'Cold Milk' : 'Silky Microfoam';
        item.innerHTML = `${pitcherSVG()}<small>${st}</small>`;
        makeProp(item, 'pitcher', 'Milk Pitcher');
        dock.append(item);
      } else {
        dock.innerHTML = `<div class="slot-hint">Drop pitcher under wand</div>`;
      }
    };

    on('work', renderDock);
    renderDock();
  }
};
