import { emit } from './events.js';
// The cup being built. cup.at is where it sits: null (no cup), 'machine' or 'counter'.
export const cup = { at: null, shots: [], milk: null, extras: [], art: null };
// Portafilter: stage goes empty > ground > tamped > locked (in the machine).
export const pf = { stage: 'empty', double: false, grind: 0, tamp: 0 };
// Milk pitcher: stage goes empty > filled > steamed.
export const pitcher = { stage: 'empty', fillQ: 0, steamQ: 0 };
export const work = () => emit('work');
export function resetCup() {
  cup.at = null; cup.shots = []; cup.milk = null; cup.extras = []; cup.art = null;
  emit('cup', cup);
}
