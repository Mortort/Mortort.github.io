import { pitcher, work } from '../core/state.js';
import { emit } from '../core/events.js';
import { panel, gauge, badge } from '../core/ui.js';

const ART = `<svg viewBox="0 0 120 100"><path d="M34 22h46l-6 62H40z" fill="#c9d3d6"/><path d="M80 34q26 0 20 22q-4 12-20 10" fill="none" stroke="#c9d3d6" stroke-width="8"/><ellipse cx="57" cy="24" rx="23" ry="5" fill="#f1efe8"/><rect x="100" y="8" width="6" height="64" rx="3" fill="#9aa7aa"/></svg>`;
const TEXT = { empty: 'Pitcher empty', filled: 'Milk in pitcher', steamed: 'Milk steamed' };

export default {
  id: 'wand',
  mount(root) {
    const p = panel(root, 'Steam wand');
    gauge(p, `${ART}Hold: steam milk`, {
      zone: [0.6, 0.8], speed: 0.35,
      onDone(q) {
        if (pitcher.stage === 'empty') return emit('toast', 'Pour milk into the pitcher first');
        if (pitcher.stage === 'steamed') return emit('toast', 'Already steamed, pour it into the cup');
        pitcher.stage = 'steamed'; pitcher.steamQ = q; work();
      }
    });
    badge(p, () => TEXT[pitcher.stage]);
  }
};
