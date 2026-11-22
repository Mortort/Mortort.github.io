import { cup, pitcher, work } from '../core/state.js';
import { emit } from '../core/events.js';
import { panel } from '../core/ui.js';

const ART = `<svg viewBox="0 0 120 100"><g transform="rotate(-35 50 50)"><path d="M24 18h40l-5 46H29z" fill="#c9d3d6"/></g><path d="M22 60q-2 12 4 22" stroke="#f1efe8" stroke-width="4" fill="none"/><path d="M62 66h40l-4 24H66z" fill="#f1efe8"/></svg>`;

export default {
  id: 'pour',
  mount(root) {
    const b = document.createElement('button');
    b.className = 'tile';
    b.innerHTML = `${ART}Tap: pour milk in cup`;
    b.onclick = () => {
      if (pitcher.stage !== 'steamed') return emit('toast', 'Steam the milk first');
      if (!cup.at) return emit('toast', 'Get a cup first');
      if (cup.at !== 'counter') return emit('toast', 'Move the cup to the counter first');
      if (cup.milk) return emit('toast', 'This cup already has milk');
      cup.milk = { type: 'steamed', q: (pitcher.fillQ + pitcher.steamQ) / 2 };
      pitcher.stage = 'empty'; work(); emit('cup', cup);
    };
    panel(root, 'Pour').append(b);
  }
};
