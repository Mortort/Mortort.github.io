import { pf, work, machineRun } from '../core/state.js';
import { emit, on } from '../core/events.js';
import { panel, badge, makeProp, makeDropZone } from '../core/ui.js';

const GRINDER_ART = `<svg viewBox="0 0 120 90"><path d="M34 4h52l-12 28H46z" fill="#c9d3d6"/><circle cx="52" cy="14" r="4" fill="#4a2c17"/><circle cx="66" cy="12" r="4" fill="#4a2c17"/><rect x="40" y="32" width="40" height="36" rx="6" fill="#3d4a4d"/><rect x="48" y="46" width="24" height="10" rx="3" fill="#d8e0e2"/><rect x="26" y="68" width="68" height="14" rx="4" fill="#2a2118" opacity=".45"/></svg>`;

export function pfSVG() {
  const fill = pf.stage === 'ground' ? '<path d="M18 14 Q40 2 62 14 Z" fill="#5c361c"/>'
    : (pf.stage === 'tamped' || pf.stage === 'locked') ? '<rect x="18" y="10" width="44" height="5" rx="2" fill="#3a2014"/>'
    : pf.stage === 'spent' ? '<rect x="18" y="10" width="44" height="5" rx="2" fill="#24140d"/>' : '';
  return `<svg viewBox="0 0 120 32" class="pf-svg">
    ${fill}
    <rect x="14" y="13" width="52" height="12" rx="4" fill="#c9d3d6"/>
    <rect x="64" y="16" width="48" height="7" rx="3" fill="#2a2118"/>
  </svg>`;
}

export const STAGE = {
  empty: 'Empty basket',
  ground: 'Fluffy grounds',
  tamped: 'Tamped puck',
  locked: 'Locked in group',
  spent: 'Spent puck (knock out!)'
};

export default {
  id: 'grinder',
  mount(root) {
    const p = panel(root, 'Grinder', 'grinder');

    const grindBtn = document.createElement('button');
    grindBtn.className = 'action-btn';
    grindBtn.innerHTML = `${GRINDER_ART}<span>▶ Start Grinding</span>`;
    p.append(grindBtn);
    const grindGauge = document.createElement('div');
    grindGauge.className = 'gauge';
    grindGauge.innerHTML = '<i style="left:60%;width:20%"></i><b></b>';
    p.append(grindGauge);
    const grindBar = grindGauge.querySelector('b');
    let grindTimer = null, grindProgress = 0;
    const finishGrinding = () => {
      if (grindTimer) clearInterval(grindTimer);
      grindTimer = null;
      grindProgress = 0;
      grindBar.style.width = '0%';
      grindBtn.classList.remove('active-run');
      grindBtn.innerHTML = `${GRINDER_ART}<span>▶ Start Grinding</span>`;
      pf.stage = 'ground';
      pf.grind = 1;
      pf.tamp = 0;
      work();
      emit('toast', 'Grinding complete — grounds are ready to tamp');
    };
    grindBtn.onclick = () => {
      if (grindTimer) return;
      if (pf.at !== 'grinder') return emit('toast', 'Place the portafilter in the grinder cradle first');
      if (pf.stage === 'spent') return emit('toast', 'Knock out the used puck first!');
      if (pf.stage !== 'empty') return emit('toast', 'Empty the portafilter before grinding again');
      grindProgress = 0;
      grindBtn.classList.add('active-run');
      grindBtn.innerHTML = `${GRINDER_ART}<span>Grinding…</span>`;
      // Stop at the center of the ideal dose window automatically.
      grindTimer = setInterval(() => {
        grindProgress = Math.min(0.70, grindProgress + 0.01);
        grindBar.style.width = `${grindProgress * 100}%`;
        if (grindProgress >= 0.70) finishGrinding();
      }, 50);
    };

    const dock = document.createElement('div');
    dock.className = 'dock';
    p.append(dock);

    const b = document.createElement('button');
    b.className = 'quiet';
    b.style.cssText = 'width:100%;margin-top:4px;padding:4px';
    const label = () => { b.textContent = `Basket: ${pf.double ? 'Double (2)' : 'Single (1)'}`; };
    b.onclick = () => {
      if (pf.stage !== 'empty') return emit('toast', 'Empty the portafilter before switching baskets');
      pf.double = !pf.double; label(); work();
    };
    label();
    p.append(b);

    makeDropZone(p, ['pf'], () => {
      if (machineRun.active) return emit('toast', 'Stop the espresso shot before removing the portafilter!');
      pf.at = 'grinder';
      if (pf.stage === 'locked') pf.stage = 'tamped';
      work();
    });

    const renderDock = () => {
      dock.innerHTML = '';
      if (pf.at === 'grinder') {
        const item = document.createElement('div');
        item.className = 'phys-item';
        item.innerHTML = `${pfSVG()}<small>Portafilter (drag/tap)</small>`;
        makeProp(item, 'pf', 'Portafilter');
        dock.append(item);
      } else {
        dock.innerHTML = `<div class="slot-hint">Drop portafilter here</div>`;
      }
    };

    on('work', renderDock);
    renderDock();
    badge(p, () => STAGE[pf.stage]);
  }
};
