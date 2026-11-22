import { cup } from '../core/state.js';
import { emit, on } from '../core/events.js';
import { panel } from '../core/ui.js';

const ART = `<svg viewBox="0 0 120 100"><path d="M30 44q0-24 30-24t30 24v36H30z" fill="#5aa3c9"/><path d="M90 50q24-6 22 16" fill="none" stroke="#5aa3c9" stroke-width="7"/><path d="M30 56l-16-14" stroke="#5aa3c9" stroke-width="7"/><rect x="46" y="12" width="28" height="9" rx="4" fill="#d8e0e2"/></svg>`;

export default {
  id: 'water',
  mount(root) {
    const p = panel(root, 'Hot water');
    const b = document.createElement('button');
    b.className = 'tile';
    b.innerHTML = `${ART}Tap: hot water`;
    b.onclick = () => {
      if (!cup.at) return emit('toast', 'Get a cup first');
      const i = cup.extras.indexOf('water');
      i < 0 ? cup.extras.push('water') : cup.extras.splice(i, 1);
      emit('cup', cup);
    };
    p.append(b);
  }
};
