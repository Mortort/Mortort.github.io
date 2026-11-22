import { emit } from './events.js';
// The cup being built. Stations write to it; orders.js grades it.
export const cup = { shots: [], milk: null, extras: [], art: null };
export function resetCup() {
  cup.shots = []; cup.milk = null; cup.extras = []; cup.art = null;
  emit('cup', cup);
}
