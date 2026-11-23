import { cup, pf, work, machineRun } from '../core/state.js';
import { emit, on } from '../core/events.js';
import { panel, makeProp, makeDropZone } from '../core/ui.js';

const machineArt = () => {
  const pouring = machineRun.active;
  const hasPf = pf.at === 'machine';
  const hasCup = cup.at === 'machine';
  return `<svg viewBox="0 0 120 105">
    <rect x="8" y="8" width="104" height="50" rx="8" fill="#b9c4c7"/>
    <rect x="8" y="8" width="104" height="12" rx="6" fill="#d8e0e2"/>
    <circle cx="26" cy="36" r="10" fill="${pouring ? '#e0b252' : '#2a3a3c'}"/>
    <circle cx="26" cy="36" r="5" fill="#f1efe8"/>
    <rect x="48" y="42" width="40" height="8" rx="3" fill="#6a7679"/>
    ${hasPf ? `<rect x="46" y="50" width="44" height="7" rx="3" fill="#2a2118"/><rect x="88" y="52" width="24" height="5" rx="2" fill="#2a2118"/>` : ''}
    ${pouring ? `<line x1="60" y1="57" x2="60" y2="82" stroke="#4a2816" stroke-width="4" stroke-dasharray="3 2"/>
                 <line x1="74" y1="57" x2="74" y2="82" stroke="#4a2816" stroke-width="4" stroke-dasharray="3 2"/>` : ''}
    <rect x="4" y="82" width="112" height="9" rx="4" fill="#6a7679"/>
    ${hasCup ? `<path d="M52 66h30l-3 16H55z" fill="#f1efe8"/>${cup.shots.length ? '<path d="M54 74h26l-1 8H55z" fill="#3a2014"/>' : ''}` : ''}
    <rect x="20" y="93" width="80" height="8" rx="3" fill="#8a979a"/>
  </svg>`;
};

export default {
  id: 'machine',
  mount(root) {
    const p = panel(root, 'Espresso Machine', 'machine');

    const head = document.createElement('div');
    head.className = 'machine-head';
    head.innerHTML = machineArt();
    p.append(head);

    // Click-to-start, click-to-stop brew button!
    const brewBtn = document.createElement('button');
    brewBtn.className = 'action-btn';
    brewBtn.textContent = '▶ Start Brew';
    p.append(brewBtn);

    const gaugeWrap = document.createElement('div');
    gaugeWrap.className = 'gauge';
    gaugeWrap.innerHTML = `<i style="left:55%;width:22%"></i><b></b>`;
    p.append(gaugeWrap);
    const bar = gaugeWrap.querySelector('b');

    const docks = document.createElement('div');
    docks.className = 'dual-dock';
    p.append(docks);

    const stopBrew = () => {
      if (!machineRun.active) return;
      clearInterval(machineRun.timer);
      machineRun.active = false;
      const v = machineRun.progress;
      machineRun.progress = 0;
      bar.style.width = '0%';
      brewBtn.textContent = '▶ Start Brew';
      brewBtn.classList.remove('active-run');

      const lo = 0.55, hi = 0.77;
      const d = v < lo ? lo - v : v > hi ? v - hi : 0;
      const brewQ = Math.max(0.1, 1 - d / 0.35);
      const shotQ = (pf.grind + pf.tamp + brewQ) / 3;

      if (cup.at === 'machine') {
        const count = pf.double ? 2 : 1;
        for (let i = 0; i < count; i++) cup.shots.push(shotQ);
        emit('toast', `Pulled ${count === 2 ? 'double' : 'single'} shot (${Math.round(shotQ * 100)}%)`);
      } else {
        emit('toast', 'Espresso poured onto the drip tray! Put a cup under the spout!');
      }
      pf.stage = 'spent';
      work();
      emit('cup', cup);
    };

    brewBtn.onclick = () => {
      if (machineRun.active) {
        stopBrew();
        return;
      }
      if (pf.at !== 'machine') return emit('toast', 'Lock the portafilter into the group head first');
      if (pf.stage === 'empty') return emit('toast', 'The portafilter is empty!');
      if (pf.stage === 'ground') return emit('toast', 'Tamp the grounds before brewing!');
      if (pf.stage === 'spent') return emit('toast', 'Knock out the spent puck and grind fresh beans');
      if (cup.at !== 'machine') return emit('toast', 'Place a cup under the spout first');

      machineRun.active = true;
      machineRun.progress = 0;
      brewBtn.textContent = '⏹ Stop Shot';
      brewBtn.classList.add('active-run');
      head.innerHTML = machineArt();

      machineRun.timer = setInterval(() => {
        machineRun.progress = Math.min(1, machineRun.progress + 0.016);
        bar.style.width = (machineRun.progress * 100) + '%';
        if (machineRun.progress >= 1) {
          stopBrew();
        }
      }, 50);
    };

    makeDropZone(p, ['pf', 'cup'], item => {
      if (item === 'pf') {
        if (pf.stage === 'empty') return emit('toast', 'Grind & tamp beans before locking in');
        if (pf.stage === 'ground') return emit('toast', 'Tamp the puck before locking in');
        pf.at = 'machine';
        if (pf.stage === 'tamped') pf.stage = 'locked';
        work();
      } else if (item === 'cup') {
        cup.at = 'machine';
        emit('cup', cup);
      }
    });

    const renderDocks = () => {
      head.innerHTML = machineArt();
      docks.innerHTML = '';

      const pfSlot = document.createElement('div');
      pfSlot.className = 'mini-slot';
      if (pf.at === 'machine') {
        pfSlot.innerHTML = `<span>🔒 PF Locked</span>`;
        makeProp(pfSlot, 'pf', 'Portafilter');
      } else {
        pfSlot.innerHTML = `<small>Drop PF</small>`;
      }

      const cupSlot = document.createElement('div');
      cupSlot.className = 'mini-slot';
      if (cup.at === 'machine') {
        cupSlot.innerHTML = `<span>☕ Cup Ready</span>`;
        makeProp(cupSlot, 'cup', 'Cup');
      } else {
        cupSlot.innerHTML = `<small>Drop Cup</small>`;
      }

      docks.append(pfSlot, cupSlot);
    };

    on('work', renderDocks);
    on('cup', renderDocks);
    renderDocks();
  }
};
