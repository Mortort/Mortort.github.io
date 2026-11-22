import { on, emit } from './core/events.js';
import { cup, resetCup } from './core/state.js';
import * as orders from './systems/orders.js';
import cups from './stations/cups.js';
import grinder from './stations/grinder.js';
import tamper from './stations/tamper.js';
import machine from './stations/machine.js';
import milk from './stations/milk.js';
import wand from './stations/wand.js';
import pour from './stations/pour.js';
import water from './stations/water.js';
import art from './stations/art.js';

// To add a station: create a module with { id, mount(root) } and list it here.
// Order here is the order on the counter, which follows the workflow.
const STATIONS = [cups, grinder, tamper, machine, milk, wand, pour, water, art];
const $ = s => document.querySelector(s);

STATIONS.forEach(s => s.mount($('#stations')));
orders.init($('#slots'), $('#stats'));
$('#dump').onclick = resetCup;
$('#move').onclick = () => {
  if (!cup.at) return emit('toast', 'No cup to move');
  cup.at = cup.at === 'machine' ? 'counter' : 'machine'; emit('cup', cup);
};

// Draws the cup as stacked liquid layers.
function cupSVG() {
  const L = [
    ...cup.shots.map(() => ['#3a2014', 16]),
    ...(cup.extras.includes('water') ? [['#9b7048', 24]] : []),
    ...(cup.milk ? [['#f1efe8', 30]] : [])
  ];
  const sum = L.reduce((a, l) => a + l[1], 0), k = Math.min(1, 64 / (sum || 1));
  let y = 106;
  const rects = L.map(([c, h]) => { h *= k; y -= h; return `<rect x="20" y="${y}" width="80" height="${h + 0.5}" fill="${c}"/>`; }).join('');
  return `<svg viewBox="0 0 140 130"><ellipse cx="60" cy="118" rx="52" ry="8" fill="rgba(0,0,0,.25)"/><defs><clipPath id="cp"><path d="M22 36H98V80Q98 108 60 108Q22 108 22 80Z"/></clipPath></defs><path d="M100 48q28 0 20 22q-6 14-20 12" fill="none" stroke="#f1efe8" stroke-width="9"/><path d="M18 30H102V80Q102 112 60 112Q18 112 18 80Z" fill="#f1efe8"/><g clip-path="url(#cp)"><rect x="20" y="36" width="80" height="72" fill="#d8d3c6"/>${rects}</g></svg>`;
}

on('cup', () => {
  const pct = q => Math.round(q * 100) + '%';
  const chips = cup.at ? [
    `at ${cup.at}`,
    ...cup.shots.map(q => `shot ${pct(q)}`),
    ...(cup.milk ? [`milk ${pct(cup.milk.q)}`] : []),
    ...(cup.art ? [`${cup.art.shape} ${pct(cup.art.q)}`] : []),
    ...(cup.extras.includes('water') ? ['hot water'] : [])
  ] : [];
  $('#cup').innerHTML = cup.at ? cupSVG() : '';
  $('#chips').innerHTML = chips.length ? chips.map(c => `<span>${c}</span>`).join('') : '<em>No cup yet</em>';
  $('#move').textContent = cup.at === 'machine' ? 'Move cup to counter' : 'Move cup to machine';
});

let t;
on('toast', msg => {
  const el = $('#toast');
  el.textContent = msg; el.classList.add('show');
  clearTimeout(t); t = setTimeout(() => el.classList.remove('show'), 2200);
});

resetCup();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');
