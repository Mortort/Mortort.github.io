import { pf, work, machineRun } from '../core/state.js';
import { emit, on } from '../core/events.js';
import { panel, gauge, makeProp, makeDropZone } from '../core/ui.js';
import { pfSVG } from './grinder.js';

const ART = `<svg viewBox="0 0 120 82"><circle cx="60" cy="18" r="14" fill="#8b5a34"/><rect x="54" y="30" width="12" height="24" fill="#b9c4c7"/><rect x="36" y="54" width="48" height="10" rx="4" fill="#d8e0e2"/><rect x="26" y="68" width="68" height="10" rx="3" fill="#2a2118" opacity=".45"/></svg>`;

export default {
  id: 'tamper',
  mount(root) {
    const p = panel(root, 'Tamping Mat', 'tamper');

    gauge(p, `${ART}<span>Hold: Tamp Puck</span>`, {
      zone: [0.5, 0.7],
      speed: 0.6,
      canStart() {
        if (pf.at !== 'tamper') { emit('toast', 'Move the portafilter onto the tamping mat first'); return false; }
        if (pf.stage === 'empty') { emit('toast', 'Grind beans into the portafilter first'); return false; }
        if (pf.stage === 'spent') { emit('toast', 'Knock out the spent puck first'); return false; }
        return true;
      },
      onDone(q) {
        pf.stage = 'tamped';
        pf.tamp = q;
        work();
      }
    });

    const dock = document.createElement('div');
    dock.className = 'dock';
    p.append(dock);

    // Knock box button right below the mat to dump spent pucks!
    const knock = document.createElement('button');
    knock.className = 'quiet knock-btn';
    knock.innerHTML = '🗑️ Knock Box (Dump Puck)';
    knock.onclick = () => {
      if (pf.at !== 'tamper' && pf.at !== 'grinder') {
        return emit('toast', 'Remove the portafilter from the machine first');
      }
      if (pf.stage === 'empty') return emit('toast', 'Basket is already empty');
      pf.stage = 'empty';
      pf.grind = 0;
      pf.tamp = 0;
      work();
      emit('toast', 'Thwack! Puck knocked into bin');
    };
    p.append(knock);

    makeDropZone(p, ['pf'], () => {
      if (machineRun.active) return emit('toast', 'Stop the shot before removing the portafilter!');
      pf.at = 'tamper';
      if (pf.stage === 'locked') pf.stage = 'tamped';
      work();
    });

    const renderDock = () => {
      dock.innerHTML = '';
      if (pf.at === 'tamper') {
        const item = document.createElement('div');
        item.className = 'phys-item';
        item.innerHTML = `${pfSVG()}<small>Portafilter (drag/tap)</small>`;
        makeProp(item, 'pf', 'Portafilter');
        dock.append(item);
      } else {
        dock.innerHTML = `<div class="slot-hint">Drop portafilter on mat</div>`;
      }
    };

    on('work', renderDock);
    renderDock();
  }
};
