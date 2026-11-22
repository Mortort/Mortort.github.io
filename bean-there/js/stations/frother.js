import { cup } from '../core/state.js';
import { emit } from '../core/events.js';
import { panel, gauge } from '../core/ui.js';

export default {
  id: 'frother',
  mount(root) {
    const p = panel(root, 'Milk frother');
    gauge(p, 'Hold to steam milk', {
      zone: [0.6, 0.8], speed: 0.35,
      onDone(q) { cup.milk = { type: 'steamed', q }; emit('cup', cup); }
    });
    const b = document.createElement('button');
    b.textContent = 'Pour cold milk';
    b.style.cssText = 'width:100%;margin-top:10px';
    b.onclick = () => { cup.milk = { type: 'cold', q: 1 }; emit('cup', cup); };
    p.append(b);
  }
};
