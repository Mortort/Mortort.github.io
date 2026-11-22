import { DRINKS, EXTRAS } from '../data/drinks.js';
import { cup, resetCup } from '../core/state.js';
import { emit } from '../core/events.js';

const MAX_ORDERS = 3, PATIENCE = 120; // seconds, relaxed on purpose
let list = [], sel = null, nextId = 1, shown = undefined;
const stats = { served: 0, missed: 0, stars: 0, streak: 0 };
let root, statsEl;

export const describe = d => [
  `${d.shots} shot${d.shots > 1 ? 's' : ''}`,
  d.milk && `${d.milk} milk`,
  d.art && `${d.art} art`,
  ...(d.extras || []).map(e => EXTRAS[e])
].filter(Boolean).join(', ');

function spawn() {
  const drink = DRINKS[Math.floor(Math.random() * DRINKS.length)];
  list.push({ id: nextId++, drink, left: PATIENCE });
}

const current = () => list.find(o => o.id === sel) || list[0];

function render() {
  if (!list.length) root.innerHTML = '<div class="empty">Waiting for the next customer…</div>';
  else root.innerHTML = list.map(o => `<div class="order${o.id === (current()?.id) ? ' sel' : ''}" data-id="${o.id}">
    <b>${o.drink.name}</b><small>${describe(o.drink)}</small>
    <div class="pat"><i style="width:${o.left / PATIENCE * 100}%"></i></div></div>`).join('');
  const avg = stats.served ? (stats.stars / stats.served).toFixed(1) : '–';
  statsEl.textContent = `Served ${stats.served}, average ${avg} stars, streak ${stats.streak}, missed ${stats.missed}`;
  const cur = current();
  if ((cur?.id ?? null) !== shown) { shown = cur?.id ?? null; emit('order', cur?.drink || null); }
}

export function init(rootEl, statsElement) {
  root = rootEl; statsEl = statsElement;
  root.addEventListener('click', e => {
    const card = e.target.closest('.order');
    if (card) { sel = +card.dataset.id; render(); }
  });
  spawn(); render();
  setInterval(() => {
    list.forEach(o => o.left--);
    const gone = list.filter(o => o.left <= 0);
    if (gone.length) {
      list = list.filter(o => o.left > 0);
      stats.missed += gone.length; stats.streak = 0;
      emit('toast', `${gone[0].drink.name} order walked out`);
    }
    if (list.length < MAX_ORDERS && (!list.length || Math.random() < 0.08)) spawn();
    render();
  }, 1000);
}

export function serve() {
  const o = current();
  if (!o) return emit('toast', 'No customers yet');
  const d = o.drink, problems = [];
  if (cup.shots.length !== d.shots) problems.push(`needs ${d.shots} shot${d.shots > 1 ? 's' : ''}`);
  if ((cup.milk?.type || null) !== (d.milk || null)) problems.push(d.milk ? `needs ${d.milk} milk` : 'should have no milk');
  if (d.art && cup.art == null) problems.push('needs latte art');
  if ([...cup.extras].sort().join() !== [...(d.extras || [])].sort().join()) problems.push('extras are off');
  if (problems.length) return emit('toast', `${d.name} ${problems.join(', ')}`);

  const qs = [...cup.shots, ...(cup.milk ? [cup.milk.q] : []), ...(d.art ? [cup.art] : [])];
  const stars = Math.max(1, Math.round(qs.reduce((a, b) => a + b, 0) / qs.length * 5));
  stats.served++; stats.stars += stars; stats.streak++;
  list = list.filter(x => x !== o); sel = null;
  resetCup();
  emit('toast', `${d.name} served: ${stars} star${stars > 1 ? 's' : ''}`);
  render();
}
