import { emit } from './events.js';

// Cup: at is null | 'machine' | 'counter' | 'prep'
export const cup = { at: null, shots: [], milk: null, extras: [], art: null };

// Portafilter:
// at: 'grinder' | 'tamper' | 'machine' | 'knockbox'
// stage: 'empty' | 'ground' | 'tamped' | 'locked' | 'spent'
export const pf = { at: 'grinder', stage: 'empty', double: false, grind: 0, tamp: 0 };

// Milk Pitcher:
// at: 'milk' | 'wand' | 'pour'
// stage: 'empty' | 'filled' | 'steamed'
export const pitcher = { at: 'milk', stage: 'empty', fillQ: 0, steamQ: 0 };

// Active machine/wand processes (one tap starts an automatic timed cycle).
export const machineRun = { active: false, progress: 0, timer: null };
export const wandRun = { active: false, progress: 0, timer: null };

// Selected item for tap-to-move accessibility alongside drag-and-drop
export const held = { item: null }; // 'pf' | 'pitcher' | 'cup' | null

export const work = () => emit('work');

export function selectItem(item) {
  held.item = held.item === item ? null : item;
  emit('held', held.item);
}

export function resetCup() {
  cup.at = null;
  cup.shots = [];
  cup.milk = null;
  cup.extras = [];
  cup.art = null;
  if (held.item === 'cup') selectItem(null);
  emit('cup', cup);
}
