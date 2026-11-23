import { cup } from '../core/state.js';
import { emit } from '../core/events.js';
import { panel, makeProp } from '../core/ui.js';

const ART = `<svg viewBox="0 0 120 100" aria-hidden="true"><g fill="#f1efe8" stroke="#c9d3d6" stroke-width="2"><path d="M25 17h43l-4 28H29z"/><path d="M33 35h43l-4 28H37z"/><path d="M41 53h43l-4 28H45z"/></g><path d="M68 23q17-2 12 13q-3 7-13 6M76 42q17-2 12 13q-3 7-13 6M84 60q17-2 12 13q-3 7-13 6" fill="none" stroke="#f1efe8" stroke-width="4"/></svg>`;

export default {
  id: 'cups',
  mount(root) {
    const p = panel(root, 'Cup Stack', 'cups');
    const pile = document.createElement('div');
    pile.className = 'cup-pile phys-item';
    pile.innerHTML = `${ART}<small>Drag a cup to the serving mat</small>`;
    makeProp(pile, 'cup', 'Cup');
    p.append(pile);
    const hint = document.createElement('div');
    hint.className = 'st';
    hint.textContent = 'Take one whenever you need it';
    p.append(hint);
  }
};
