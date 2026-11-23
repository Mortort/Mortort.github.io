import { ACTIVE_DRINKS, EXTRAS } from '../data/drinks.js';
import { cup, resetCup } from '../core/state.js';
import { emit } from '../core/events.js';

const SLOTS = 3, PATIENCE = 150; // seconds, relaxed on purpose
const SKIN = ['#f2c9a0', '#d9a273', '#a8734a', '#7a4d31'];
const HAIR = ['#2a2118', '#6b3f1d', '#c8a14a', '#8a8f94', '#a2402a'];
const SHIRT = ['#e9806a', '#6fb4d6', '#9ccf7b', '#d9a1e0', '#f0c75e'];
const pick = a => a[Math.floor(Math.random() * a.length)];
const slots = Array(SLOTS).fill(null);
const stats = { served: 0, missed: 0, stars: 0, streak: 0 };
let nextId = 1, root, statsEl;

export const describe = d => [
  `${d.shots} shot${d.shots > 1 ? 's' : ''}`,
  d.milk && `${d.milk} milk`,
  d.art && `${d.art} art`,
  ...(d.extras || []).map(e => EXTRAS[e])
].filter(Boolean).join(', ');

const spawn = i => {
  slots[i] = { id: nextId++, drink: pick(ACTIVE_DRINKS), left: PATIENCE, fresh: true, skin: pick(SKIN), hair: pick(HAIR), shirt: pick(SHIRT) };
};

const face = o => {
  const mouth = o.left / PATIENCE > 0.35 ? 'M42 50Q50 57 58 50' : 'M42 54Q50 47 58 54';
  return `<svg viewBox="0 0 100 110"><path d="M8 110Q8 64 50 64Q92 64 92 110Z" fill="${o.shirt}"/><circle cx="50" cy="38" r="24" fill="${o.skin}"/><path d="M25 38Q24 12 50 12Q76 12 75 38Q64 26 50 28Q36 26 25 38Z" fill="${o.hair}"/><circle cx="41" cy="40" r="3" fill="#2a2118"/><circle cx="59" cy="40" r="3" fill="#2a2118"/><path d="${mouth}" fill="none" stroke="#2a2118" stroke-width="2.5" stroke-linecap="round"/></svg>`;
};

function render() {
  root.innerHTML = slots.map((o, i) => o
    ? `<div class="cust${o.fresh ? ' enter' : ''}" data-i="${i}"><div class="bubble"><b>${o.drink.name}</b><small>${describe(o.drink)}</small><div class="pat"><i style="width:${o.left / PATIENCE * 100}%;background:hsl(${o.left / PATIENCE * 120} 65% 50%)"></i></div></div>${face(o)}</div>`
    : '<div class="cust empty"></div>').join('');
  slots.forEach(o => { if (o) o.fresh = false; });
  const avg = stats.served ? (stats.stars / stats.served).toFixed(1) : '–';
  statsEl.textContent = `Served ${stats.served}, avg ${avg} stars, streak ${stats.streak}, missed ${stats.missed}`;
}

export function init(rootEl, statsElement) {
  root = rootEl; statsEl = statsElement;
  root.addEventListener('click', e => {
    const el = e.target.closest('.cust');
    if (el && !el.classList.contains('empty')) serve(+el.dataset.i);
  });
  spawn(0); render();
  setInterval(() => {
    slots.forEach((o, i) => {
      if (o && --o.left <= 0) { slots[i] = null; stats.missed++; stats.streak = 0; emit('toast', `${o.drink.name} customer walked out`); }
    });
    const none = slots.every(o => !o);
    slots.forEach((o, i) => { if (!o && (none || Math.random() < 0.055)) spawn(i); });
    render();
  }, 1000);
}

// Tap a customer to hand them the cup in your hand.
export function serve(i) {
  const o = slots[i]; if (!o) return;
  if (!cup.at) return emit('toast', 'Grab a cup first');
  const d = o.drink, problems = [];
  if (cup.shots.length !== d.shots) problems.push(`needs ${d.shots} shot${d.shots > 1 ? 's' : ''}`);
  if ((cup.milk?.type || null) !== (d.milk || null)) problems.push(d.milk ? 'needs steamed milk' : 'should have no milk');
  if (d.art && cup.art?.shape !== d.art) problems.push(`needs ${d.art} art`);
  if ([...cup.extras].sort().join() !== [...(d.extras || [])].sort().join()) problems.push(d.extras ? 'needs hot water' : 'should have no water');
  if (problems.length) return emit('toast', `${d.name} ${problems.join(', ')}`);

  const qs = [...cup.shots, ...(cup.milk ? [cup.milk.q] : []), ...(d.art ? [cup.art.q] : [])];
  const stars = Math.max(1, Math.round(qs.reduce((a, b) => a + b, 0) / qs.length * 5));
  stats.served++; stats.stars += stars; stats.streak++;
  slots[i] = null;
  resetCup();
  emit('toast', `${d.name}: ${'★'.repeat(stars)}${'☆'.repeat(5 - stars)}`);
  render();
}
