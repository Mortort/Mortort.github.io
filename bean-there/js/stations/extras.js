import { cup } from '../core/state.js';
import { emit, on } from '../core/events.js';
import { panel } from '../core/ui.js';
import { EXTRAS } from '../data/drinks.js';

export default {
  id: 'extras',
  mount(root) {
    const p = panel(root, 'Pantry');
    const g = document.createElement('div');
    g.className = 'grid';
    p.append(g);
    const btns = {};
    for (const [id, label] of Object.entries(EXTRAS)) {
      const b = document.createElement('button');
      b.textContent = label;
      b.onclick = () => {
        const i = cup.extras.indexOf(id);
        i < 0 ? cup.extras.push(id) : cup.extras.splice(i, 1);
        emit('cup', cup);
      };
      btns[id] = b; g.append(b);
    }
    on('cup', () => { for (const id in btns) btns[id].classList.toggle('on', cup.extras.includes(id)); });
  }
};
