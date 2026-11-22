import { pf, work } from '../core/state.js';
import { emit } from '../core/events.js';
import { panel, gauge, badge } from '../core/ui.js';

const ART = `<svg viewBox="0 0 120 100"><path d="M34 6h52l-12 30H46z" fill="#c9d3d6"/><circle cx="52" cy="16" r="4" fill="#4a2c17"/><circle cx="66" cy="14" r="4" fill="#4a2c17"/><rect x="40" y="36" width="40" height="40" rx="6" fill="#3d4a4d"/><rect x="48" y="52" width="24" height="10" rx="3" fill="#d8e0e2"/><rect x="30" y="76" width="60" height="8" rx="3" fill="#2a2118"/><rect x="86" y="78" width="26" height="6" rx="3" fill="#2a2118"/></svg>`;
export const STAGE = { empty: 'Portafilter empty', ground: 'Beans ground', tamped: 'Puck tamped', locked: 'In the machine' };

export default {
  id: 'grinder',
  mount(root) {
    const p = panel(root, 'Grinder');
    gauge(p, `${ART}Hold: grind beans`, {
      zone: [0.6, 0.8], speed: 0.5,
      onDone(q) {
        if (pf.stage === 'locked') return emit('toast', 'The portafilter is in the machine');
        pf.stage = 'ground'; pf.grind = q; pf.tamp = 0; work();
      }
    });
    const b = document.createElement('button');
    b.className = 'quiet'; b.style.cssText = 'width:100%;margin-top:4px;padding:4px';
    const label = () => { b.textContent = `Basket: ${pf.double ? 'double' : 'single'}`; };
    b.onclick = () => { pf.double = !pf.double; label(); work(); };
    label(); p.append(b);
    badge(p, () => STAGE[pf.stage] + (pf.double ? ' (double)' : ''));
  }
};
