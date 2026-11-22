import { pitcher, work } from '../core/state.js';
import { panel, gauge } from '../core/ui.js';

const ART = `<svg viewBox="0 0 120 100"><path d="M40 28l20-14 20 14v58H40z" fill="#f1efe8"/><rect x="40" y="46" width="40" height="22" fill="#6fb4d6"/><path d="M40 28h40" stroke="#c9c3b3" stroke-width="3"/></svg>`;

export default {
  id: 'milk',
  mount(root) {
    gauge(panel(root, 'Milk'), `${ART}Hold: fill pitcher`, {
      zone: [0.5, 0.7], speed: 0.5,
      onDone(q) { pitcher.stage = 'filled'; pitcher.fillQ = q; pitcher.steamQ = 0; work(); }
    });
  }
};
