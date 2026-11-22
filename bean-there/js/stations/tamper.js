import { pf, work } from '../core/state.js';
import { emit } from '../core/events.js';
import { panel, gauge } from '../core/ui.js';

const ART = `<svg viewBox="0 0 120 100"><circle cx="60" cy="22" r="16" fill="#8b5a34"/><rect x="54" y="36" width="12" height="30" fill="#b9c4c7"/><rect x="36" y="66" width="48" height="12" rx="4" fill="#d8e0e2"/><rect x="30" y="82" width="60" height="8" rx="3" fill="#2a2118"/></svg>`;

export default {
  id: 'tamper',
  mount(root) {
    gauge(panel(root, 'Tamper'), `${ART}Hold: press the puck`, {
      zone: [0.5, 0.7], speed: 0.6,
      onDone(q) {
        if (pf.stage === 'empty') return emit('toast', 'Grind beans into the portafilter first');
        if (pf.stage === 'locked') return emit('toast', 'The portafilter is in the machine');
        pf.stage = 'tamped'; pf.tamp = q; work();
      }
    });
  }
};
