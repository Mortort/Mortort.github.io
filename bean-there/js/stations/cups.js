import { cup } from '../core/state.js';
import { emit } from '../core/events.js';
import { panel } from '../core/ui.js';

const ART = `<svg viewBox="0 0 120 100"><g fill="#f1efe8"><path d="M30 18h40l-4 24H34z"/><path d="M38 36h40l-4 24H42z" opacity=".9"/><path d="M46 54h40l-4 24H50z" opacity=".8"/></g><path d="M84 58q18 0 12 14" fill="none" stroke="#f1efe8" stroke-width="5"/></svg>`;

export default {
  id: 'cups',
  mount(root) {
    const p = panel(root, 'Cups', 'cups');
    const b = document.createElement('button');
    b.className = 'tile';
    b.innerHTML = `${ART}<span>Grab Cup</span>`;
    b.onclick = () => {
      if (cup.at) return emit('toast', 'You already have a cup on the bar');
      cup.at = 'counter';
      emit('cup', cup);
      emit('toast', 'Cup placed on counter — drag it under the espresso spout!');
    };
    p.append(b);
  }
};
