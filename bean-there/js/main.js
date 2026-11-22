import { on } from './core/events.js';
import { cup, resetCup } from './core/state.js';
import { EXTRAS } from './data/drinks.js';
import * as orders from './systems/orders.js';
import espresso from './stations/espresso.js';
import frother from './stations/frother.js';
import art from './stations/art.js';
import extras from './stations/extras.js';

// To add a station: create a module with { id, mount(root) } and list it here.
const STATIONS = [espresso, frother, art, extras];
const $ = s => document.querySelector(s);

STATIONS.forEach(s => s.mount($('#stations')));
orders.init($('#orders'), $('#stats'));

$('#serve').onclick = () => orders.serve();
$('#dump').onclick = resetCup;

on('cup', () => {
  const pct = q => Math.round(q * 100) + '%';
  const chips = [
    ...cup.shots.map(q => `Shot ${pct(q)}`),
    ...(cup.milk ? [cup.milk.type === 'steamed' ? `Steamed milk ${pct(cup.milk.q)}` : 'Cold milk'] : []),
    ...(cup.art != null ? [`Art ${pct(cup.art)}`] : []),
    ...cup.extras.map(e => EXTRAS[e])
  ];
  $('#cup').innerHTML = chips.length ? chips.map(c => `<span>${c}</span>`).join('') : '<em>Empty cup</em>';
});

let t;
on('toast', msg => {
  const el = $('#toast');
  el.textContent = msg; el.classList.add('show');
  clearTimeout(t); t = setTimeout(() => el.classList.remove('show'), 2200);
});

resetCup();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');
