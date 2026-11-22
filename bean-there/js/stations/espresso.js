import { cup } from '../core/state.js';
import { emit } from '../core/events.js';
import { panel, gauge } from '../core/ui.js';

export default {
  id: 'espresso',
  mount(root) {
    const p = panel(root, 'Espresso machine');
    gauge(p, 'Hold to pull a shot', {
      zone: [0.55, 0.75], speed: 0.3,
      onDone(q) {
        if (cup.shots.length >= 3) return emit('toast', 'That cup is full of espresso');
        cup.shots.push(q); emit('cup', cup);
      }
    });
  }
};
