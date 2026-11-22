import { cup, pf, work } from '../core/state.js';
import { emit, on } from '../core/events.js';
import { panel, gauge } from '../core/ui.js';

// The machine art changes with what is locked in and whether a cup is under the spout.
const art = () => `<svg viewBox="0 0 120 100"><rect x="10" y="10" width="100" height="50" rx="8" fill="#b9c4c7"/><rect x="10" y="10" width="100" height="12" rx="6" fill="#d8e0e2"/><circle cx="26" cy="38" r="9" fill="#2a3a3c"/><circle cx="26" cy="38" r="5" fill="#f1efe8"/><rect x="48" y="44" width="40" height="8" rx="3" fill="#6a7679"/>${pf.stage === 'locked' ? '<rect x="46" y="52" width="44" height="7" rx="3" fill="#2a2118"/><rect x="88" y="54" width="22" height="5" rx="2" fill="#2a2118"/>' : ''}<rect x="4" y="74" width="112" height="9" rx="4" fill="#6a7679"/>${cup.at === 'machine' ? `<path d="M42 62h28l-3 22H45z" fill="#f1efe8"/>${cup.shots.length ? '<path d="M44 74h24l-1 10H45z" fill="#3a2014"/>' : ''}` : ''}<rect x="20" y="88" width="80" height="8" rx="3" fill="#8a979a"/></svg>`;

export default {
  id: 'machine',
  mount(root) {
    const p = panel(root, 'Espresso machine');
    gauge(p, `${art()}Hold: pull shot`, {
      zone: [0.55, 0.75], speed: 0.3,
      onDone(q) {
        if (pf.stage !== 'locked') return emit('toast', 'Lock a tamped portafilter into the machine first');
        if (cup.at !== 'machine') return emit('toast', 'Put a cup under the spout first');
        const shotQ = (pf.grind + pf.tamp + q) / 3;
        for (let i = 0; i < (pf.double ? 2 : 1); i++) cup.shots.push(shotQ);
        pf.stage = 'empty'; work(); emit('cup', cup);
      }
    });
    const b = document.createElement('button');
    b.className = 'quiet'; b.style.cssText = 'width:100%;margin-top:4px;padding:4px';
    b.textContent = 'Lock in portafilter';
    b.onclick = () => {
      if (pf.stage === 'locked') return emit('toast', 'Already locked in');
      if (pf.stage === 'empty') return emit('toast', 'Grind beans first');
      if (pf.stage === 'ground') return emit('toast', 'Press the puck with the tamper first');
      pf.stage = 'locked'; work();
    };
    p.append(b);
    const refresh = () => { const s = p.querySelector('.hold svg'); if (s) s.outerHTML = art(); };
    on('work', refresh); on('cup', refresh);
  }
};
