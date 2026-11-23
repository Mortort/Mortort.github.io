import { DRINKS, EXTRAS } from './data/drinks.js';

const $ = s => document.querySelector(s);
const pick = a => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const saved = (() => { try { return JSON.parse(localStorage.getItem('bean-there-save') || '{}'); } catch { return {}; } })();
const state = {
  served: saved.served || 0, missedTotal: saved.missedTotal || 0, bestStreak: saved.bestStreak || 0,
  bestServed: saved.bestServed || 0, totalStars: saved.totalStars || 0, coins: saved.coins ?? 0, earnedTotal: saved.earnedTotal || 0,
  mistakesTotal: saved.mistakesTotal || 0, fewestMistakes: saved.fewestMistakes ?? null, shiftMistakes: 0,
  upgrades: { grinderAuto: false, tampAuto: false, brewAuto: false, steamAuto: false, extraPF: false, extraPitcher: false, fasterGrinder: 0, fasterMachine: 0, fasterMilk: 0, ...(saved.upgrades || {}) },
  unlocked: saved.unlocked || ['espresso','doppio','americano','cortado','macchiato','cappuccino','latte','flatwhite'],
  customers: [], missed: 0, streak: 0, shiftServed: 0, running: true, nextCustomerId: 1,
  cups: [], portafilters: [], pitchers: [], groups: [ { pf:null, cups:[], running:false, progress:0, timer:null }, { pf:null, cups:[], running:false, progress:0, timer:null } ],
  processes: {}, selected: null, spawnTimer: null, tickTimer: null
};

const recipes = Object.fromEntries(DRINKS.map(d => [d.id, d]));
const skin = ['#edc29d','#c98f68','#a96e4d','#75472f'];
const hair = ['#34251f','#68452e','#c4a06b','#8b9290','#a94f35'];
const shirts = ['#c87961','#72999a','#9aab79','#b28ca7','#d2a85f'];
const patienceFor = () => 145 + Math.random() * 65;
const upgradeDefs = [
  ['grinderAuto','Auto-dose grinder',90,'Automatically starts grinding when a portafilter is placed in the grinder.'],
  ['tampAuto','Automatic tamper',110,'Automatically tamps a freshly ground portafilter on the tamping mat.'],
  ['brewAuto','Automatic espresso',160,'Starts extraction as soon as a prepared portafilter and cup are in a group head.'],
  ['steamAuto','Automatic milk steaming',130,'Starts steaming when a filled pitcher is placed under the wand.'],
  ['extraPF','Extra portafilter',100,'Adds a third portafilter to your storage shelf.'],
  ['extraPitcher','Extra milk pitcher',85,'Adds a third milk pitcher to your storage shelf.'],
  ['fasterGrinder','Grinder speed I',120,'Grinding cycles become 15% faster.',true],
  ['fasterMachine','Espresso speed I',150,'Espresso extraction becomes 12% faster.',true],
  ['fasterMilk','Milk system speed I',120,'Filling and steaming become 15% faster.',true]
];

function save() {
  const data = { served:state.served, missedTotal:state.missedTotal, bestStreak:state.bestStreak, bestServed:state.bestServed, totalStars:state.totalStars, coins:state.coins, earnedTotal:state.earnedTotal, mistakesTotal:state.mistakesTotal, fewestMistakes:state.fewestMistakes, upgrades:state.upgrades, unlocked:state.unlocked };
  try { localStorage.setItem('bean-there-save', JSON.stringify(data)); } catch {}
}
function toast(msg) { const el=$('#toast'); el.textContent=msg; el.classList.add('show'); clearTimeout(toast.t); toast.t=setTimeout(()=>el.classList.remove('show'),2300); }
function uid(prefix) { return `${prefix}-${Math.random().toString(36).slice(2,8)}`; }
function newCup() { return { id:uid('cup'), kind:'cup', at:'shelf', shots:[], milk:null, extras:{}, art:false }; }
function newPF() { return { id:uid('pf'), kind:'pf', at:'shelf', doses:0, stage:'empty', grindQ:[], tampQ:0, group:null }; }
function newPitcher() { return { id:uid('pitcher'), kind:'pitcher', at:'shelf', stage:'empty', fillQ:0, steamQ:0 }; }
function inventoryInit() {
  state.cups = Array.from({length:7},newCup);
  state.portafilters = Array.from({length:state.upgrades.extraPF?3:2},newPF);
  state.pitchers = Array.from({length:state.upgrades.extraPitcher?3:2},newPitcher);
}
function byId(id) { return [...state.cups,...state.portafilters,...state.pitchers].find(x=>x.id===id); }
function itemLabel(item) { if(item.kind==='cup') return `Cup${item.shots.length?` · ${item.shots.length} shot`:''}`; if(item.kind==='pf') return `Portafilter · ${item.doses}/2 doses`; return `Pitcher · ${item.stage}`; }
function itemVisual(item) {
  if(item.kind==='cup') return `<span class="item-emoji cup-emoji">🥛</span><b>${itemLabel(item)}</b>`;
  if(item.kind==='pf') return `<span class="pf-visual"><i></i></span><b>${itemLabel(item)}</b>`;
  const liquid=item.stage==='steamed'?'🥛':item.stage==='filled'?'💧':'◯';
  return `<span class="pitcher-visual">${liquid}</span><b>${itemLabel(item)}</b>`;
}
function draggable(item, cls='') { return `<div class="object ${cls}" draggable="false" data-item="${item.id}">${itemVisual(item)}</div>`; }
function bindDrag(el) {
  el.addEventListener('pointerdown', e=>{
    if(e.button!==0) return;
    const id=el.dataset.item; if(!id) return;
    e.preventDefault();
    const startX=e.clientX,startY=e.clientY; let moved=false,ghost=null;
    const move=ev=>{
      const dx=ev.clientX-startX,dy=ev.clientY-startY;
      if(!moved && Math.hypot(dx,dy)>7){ moved=true; ghost=el.cloneNode(true); ghost.className='drag-ghost'; document.body.append(ghost); el.classList.add('dragging'); }
      if(moved){ ghost.style.left=ev.clientX+'px'; ghost.style.top=ev.clientY+'px';
        document.querySelectorAll('[data-drop]').forEach(z=>{ const r=z.getBoundingClientRect(); z.classList.toggle('drag-over',ev.clientX>=r.left&&ev.clientX<=r.right&&ev.clientY>=r.top&&ev.clientY<=r.bottom); });
        const scroller=$('#counterViewport'), r=scroller.getBoundingClientRect();
        if(ev.clientY>r.top && ev.clientY<r.bottom){ if(ev.clientX>r.right-42) scroller.scrollLeft+=12; else if(ev.clientX<r.left+42) scroller.scrollLeft-=12; }
      }
    };
    const up=ev=>{
      window.removeEventListener('pointermove',move); window.removeEventListener('pointerup',up); el.classList.remove('dragging');
      if(ghost){ ghost.remove(); document.querySelectorAll('.drag-over').forEach(z=>z.classList.remove('drag-over')); const target=document.elementFromPoint(ev.clientX,ev.clientY)?.closest('[data-drop]'); if(target) handleDrop(id,target.dataset.drop,target.dataset.target||''); }
      else { state.selected=id; toast(`${itemLabel(byId(id))} selected`); }
    };
    window.addEventListener('pointermove',move); window.addEventListener('pointerup',up);
  });
}
function dropZone(id,target,contents,cls='') { return `<div class="drop-slot ${cls}" data-drop="${id}" data-target="${target}">${contents||'<span class="slot-empty">Drop here</span>'}</div>`; }
function setAt(item,at) { item.at=at; }

function handleDrop(id, target, targetId) {
  const item=byId(id); if(!item || !state.running) return;
  if(['grind','tamp','fill','steam'].some(a=>state.processes[`${a}-${id}`])) return toast('Let that process finish before moving the item');
  const heldGroup=item.at.startsWith('group-')?Number(item.at.split('-')[1]):null;
  if(heldGroup!==null && state.groups[heldGroup]?.running) return toast('Wait for extraction to finish before moving equipment');
  if(item.kind==='cup' && heldGroup!==null) { state.groups[heldGroup].cups=state.groups[heldGroup].cups.map(x=>x===id?null:x); const home=item.originMat; item.at=home&&!state.cups.some(other=>other.id!==id&&other.at===home)?home:'shelf'; }
  if(item.kind==='pf' && item.group!==null) { const old=state.groups[item.group]; if(old.pf===id) old.pf=null; item.group=null; item.at='shelf'; }
  if(target==='shelf') { item.at='shelf'; if(item.kind==='pf') item.group=null; render(); return; }
  if(target.startsWith('mat-')) {
    if(item.kind==='cup') { const slot=Number(target.slice(4)); if(state.cups.some(c=>c.id!==id&&c.at===`mat-${slot}`)) return toast('That cup mat is occupied'); item.at=target; item.originMat=target; render(); }
    else if(item.kind==='pitcher') { const slot=Number(target.slice(4)); const cup=state.cups.find(c=>c.at===`mat-${slot}`); if(cup) pourPitcher(item,cup); else toast('Put a cup on this mat first'); }
    else toast('Portafilters belong at the grinder, tamper, or espresso machine');
    return;
  }
  if(target==='grinder' && item.kind==='pf') { if(item.stage==='spent') return toast('Knock out the spent puck first'); item.at='grinder'; render(); if(state.upgrades.grinderAuto) runGrind(item); return; }
  if(target==='tamper' && item.kind==='pf') { if(!item.doses) return toast('Grind coffee first'); if(item.stage==='spent') return toast('Knock out the spent puck first'); item.at='tamper'; render(); if(state.upgrades.tampAuto) runTamp(item); return; }
  if(target==='group' && item.kind==='pf') { const g=state.groups[Number(targetId)]; if(g.pf && g.pf!==id) return toast('That group head already has a portafilter'); if(item.stage!=='tamped') return toast('Tamp the coffee before locking in'); item.at=`group-${targetId}`; item.group=Number(targetId); g.pf=id; render(); maybeAutoBrew(Number(targetId)); return; }
  if(target==='groupcup' && item.kind==='cup') { const [gi,ci]=targetId.split('-').map(Number); const g=state.groups[gi]; if(g.cups[ci] && g.cups[ci]!==id) return toast('That cup position is occupied'); if(item.at.startsWith('group-')) { const old=Number(item.at.split('-')[1]); state.groups[old].cups=state.groups[old].cups.filter(x=>x!==id); }
    item.at=`group-${gi}`; g.cups[ci]=id; render(); maybeAutoBrew(gi); return; }
  if(target==='fridge' && item.kind==='pitcher') { item.at='fridge'; render(); if(state.upgrades.steamAuto && item.stage==='filled'){} return; }
  if(target==='wand' && item.kind==='pitcher') { if(item.stage!=='filled') return toast('Fill the pitcher with milk first'); item.at='wand'; render(); if(state.upgrades.steamAuto) runSteam(item); return; }
  if(target==='pump' && item.kind==='cup') { item.at='pump'; render(); return; }
  if(target==='customer' && item.kind==='cup') { serve(targetId,item); return; }
  if(target==='bin' && item.kind==='pf') { item.doses=0; item.stage='empty'; item.grindQ=[]; item.tampQ=0; item.at='shelf'; item.group=null; const g=state.groups.find(x=>x.pf===id); if(g) g.pf=null; render(); toast('Puck knocked out'); return; }
  if(target==='counter' && item.kind==='cup') { item.at='shelf'; render(); return; }
  toast('That item cannot go there');
}

function runProcess(key, seconds, onFinish, button) {
  if(state.processes[key]) return toast('Already running');
  const started=Date.now(), total=seconds*1000; button.disabled=true; button.classList.add('working');
  state.processes[key]=setInterval(()=>{
    const p=clamp((Date.now()-started)/total,0,1); button.style.setProperty('--progress',`${p*100}%`);
    if(p>=1){ clearInterval(state.processes[key]); delete state.processes[key]; button.disabled=false; button.classList.remove('working'); button.style.removeProperty('--progress'); onFinish(); }
  },80);
}
function runGrind(pf) {
  if(pf.at!=='grinder') return toast('Place a portafilter in the grinder');
  if(pf.doses>=2) return toast('Basket is full — tamp it');
  const b=document.querySelector(`[data-action="grind-${pf.id}"]`); if(!b) return;
  runProcess(`grind-${pf.id}`,2.9*(state.upgrades.fasterGrinder ? .85 : 1),()=>{ pf.doses++; pf.grindQ.push(.86+Math.random()*.12); pf.stage='ground'; render(); toast(`Dose ${pf.doses} ground. Grind again for another shot.`); },b);
}
function runTamp(pf) {
  if(pf.at!=='tamper'||!pf.doses) return toast('Place a ground portafilter on the tamping mat');
  if(pf.stage==='spent') return toast('Knock out the used puck');
  const b=document.querySelector(`[data-action="tamp-${pf.id}"]`); if(!b) return;
  runProcess(`tamp-${pf.id}`,2.4,()=>{pf.stage='tamped';pf.tampQ=.88+Math.random()*.1;render();toast('Puck tamped and ready');},b);
}
function maybeAutoBrew(i) { if(state.upgrades.brewAuto){ const g=state.groups[i]; if(g.pf&&g.cups.some(Boolean)) startBrew(i); } }
function startBrew(i) {
  const g=state.groups[i], pf=byId(g.pf), cups=g.cups.map(byId).filter(Boolean);
  if(!pf) return toast('Lock a portafilter into this group head');
  if(pf.stage!=='tamped') return toast('Tamp the coffee before brewing');
  if(!cups.length) return toast('Put at least one cup under the spout');
  if(g.running) return;
  g.running=true; const btn=document.querySelector(`[data-action="brew-${i}"]`); btn.disabled=true; btn.classList.add('working');
  const duration=4.8*(state.upgrades.fasterMachine ? .88 : 1), start=Date.now();
  g.timer=setInterval(()=>{ const p=clamp((Date.now()-start)/(duration*1000),0,1); btn.style.setProperty('--progress',`${p*100}%`); if(p>=1){ clearInterval(g.timer); g.running=false; btn.disabled=false; btn.classList.remove('working'); btn.style.removeProperty('--progress');
    const shotQ=(pf.grindQ.reduce((a,b)=>a+b,0)/(pf.grindQ.length||1)+pf.tampQ+.9)/3;
    if(pf.doses===2 && cups.length>=2){ cups[0].shots.push(shotQ); cups[1].shots.push(shotQ); toast('Double shot split between two cups'); }
    else { for(let n=0;n<pf.doses;n++) cups[0].shots.push(shotQ); toast(`${pf.doses===2?'Double':'Single'} espresso extracted`); }
    pf.stage='spent'; pf.at='shelf'; pf.group=null; g.pf=null; g.cups.forEach((id,j)=>{if(id){const c=byId(id); if(c)c.at=(c.originMat && !state.cups.some(other=>other.id!==c.id&&other.at===c.originMat))?c.originMat:'shelf';}}); g.cups=[null,null]; render();
  } },80);
}
function runFill(p) {
  if(p.at!=='fridge') return toast('Place a pitcher at the milk fridge'); if(p.stage!=='empty') return toast('Pitcher already contains milk');
  const b=document.querySelector(`[data-action="fill-${p.id}"]`); if(!b)return;
  runProcess(`fill-${p.id}`,2.7*(state.upgrades.fasterMilk ? .85 : 1),()=>{p.stage='filled';p.fillQ=.9;render();toast('Pitcher filled with cold milk');},b);
}
function runSteam(p) {
  if(p.at!=='wand') return toast('Place the pitcher under the steam wand'); if(p.stage!=='filled') return toast('Fill the pitcher first');
  const b=document.querySelector(`[data-action="steam-${p.id}"]`); if(!b)return;
  runProcess(`steam-${p.id}`,4.6*(state.upgrades.fasterMilk ? .85 : 1),()=>{p.stage='steamed';p.steamQ=.9;render();toast('Milk steamed to silky microfoam');},b);
}
function pourPitcher(p,c) {
  if(p.stage==='empty') return toast('The pitcher is empty');
  if(c.milk) return toast('This cup already has milk');
  c.milk={type:p.stage==='steamed'?'steamed':'cold',q:p.stage==='steamed'?(p.fillQ+p.steamQ)/2:p.fillQ}; p.stage='empty';p.fillQ=0;p.steamQ=0;p.at='shelf';render();toast('Milk poured into cup');
}
function addPump(id) {
  const cup=state.cups.find(c=>c.at==='pump'); if(!cup) return toast('Drag a cup to the syrup station first');
  cup.extras[id]=(cup.extras[id]||0)+1; render(); toast(`${EXTRAS[id]||id}: ${cup.extras[id]} pump${cup.extras[id]>1?'s':''}`);
}
function addArt() { const c=state.cups.find(x=>x.at==='pump'); if(!c) return toast('Bring a cup to the finishing station'); if(!c.milk||c.milk.type!=='steamed')return toast('Latte art needs steamed milk'); c.art=true;render();toast('Latte art added — bonus quality'); }

function spawnCustomer() {
  if(!state.running || state.customers.length>=5) return;
  const unlocked=state.unlocked.map(id=>recipes[id]).filter(Boolean);
  const drink=pick(unlocked.length?unlocked:DRINKS.slice(0,8));
  state.customers.push({id:String(state.nextCustomerId++),drink,left:patienceFor(),max:0,skin:pick(skin),hair:pick(hair),shirt:pick(shirts)});
  const c=state.customers[state.customers.length-1];c.max=c.left;renderCustomers();
}
function maybeUnlock() {
  const milestones=[['mocha',8],['carmac',16],['icedlatte',24],['icedvanilla',32],['affogato',42],['affcaramel',54],['psl',64]];
  for(const [id,n] of milestones) if(state.served>=n&&!state.unlocked.includes(id)){state.unlocked.push(id);toast(`New recipe unlocked: ${recipes[id].name}`);save();}
}
function renderCustomers() {
  $('#customers').innerHTML=Array.from({length:5},(_,i)=>{
    const c=state.customers[i]; if(!c)return `<div class="customer empty"><span>Waiting for customer</span></div>`;
    const ratio=c.left/c.max; const extras=Object.entries(c.drink.extras||{}).map(([x])=>EXTRAS[x]||x).join(', ');
    const details=[`${c.drink.shots} shot${c.drink.shots>1?'s':''}`,c.drink.milk?`${c.drink.milk} milk`:null,extras||null].filter(Boolean).join(' · ');
    return `<div class="customer" data-drop="customer" data-target="${c.id}"><div class="order-bubble"><b>${c.drink.name}</b><small>${details}</small><div class="patience"><i style="width:${ratio*100}%;background:hsl(${ratio*115} 65% 48%)"></i></div></div><div class="portrait" style="--skin:${c.skin};--hair:${c.hair};--shirt:${c.shirt}"><i></i><b></b><em></em></div><small class="customer-tip">Drop cup to serve</small></div>`;
  }).join('');
  $('#queueCount').textContent=`${state.customers.length} / 5`;
}
function serve(customerId,cup) {
  const customer=state.customers.find(c=>c.id===customerId); if(!customer)return;
  if(cup.at.startsWith('group-')) cup.at=cup.originMat||'shelf';
  const d=customer.drink;
  let mistakes=Math.abs(cup.shots.length-d.shots);
  if((cup.milk?.type||null)!==(d.milk||null)) mistakes++;
  const required=d.extras||[];
  for(const x of required) if(!cup.extras[x]) mistakes++;
  for(const x of Object.keys(cup.extras)) if(!required.includes(x)) mistakes++;
  for(const x of required) if(cup.extras[x]>1) mistakes+=cup.extras[x]-1;
  const qualities=[...cup.shots,...(cup.milk?[cup.milk.q]:[])];
  const baseQuality=qualities.length?qualities.reduce((a,b)=>a+b,0)/qualities.length:.35;
  const stars=clamp(Math.round(baseQuality*5+(cup.art?1:0)-mistakes*.8),1,5);
  const basePay=12+stars*3, tip=Math.max(0,Math.round(customer.left/customer.max*8)-mistakes*4), reward=basePay+tip;
  state.coins+=reward;state.earnedTotal+=reward;state.mistakesTotal+=mistakes;state.shiftMistakes+=mistakes;
  state.served++;state.shiftServed++;state.streak++;state.bestStreak=Math.max(state.bestStreak,state.streak);state.totalStars+=stars;
  state.customers=state.customers.filter(c=>c.id!==customerId); cup.at='shelf';cup.shots=[];cup.milk=null;cup.extras={};cup.art=false;
  maybeUnlock();save();render();
  toast(mistakes?`Order served with ${mistakes} mistake${mistakes===1?'':'s'} · ${'★'.repeat(stars)} · +${reward} coins`:`${d.name} served · ${'★'.repeat(stars)} · +${reward} coins`);
}
function endShift() {
  state.running=false;clearInterval(state.spawnTimer);clearInterval(state.tickTimer);Object.values(state.processes).forEach(clearInterval);state.processes={};state.groups.forEach(g=>{if(g.timer)clearInterval(g.timer);g.running=false;});state.bestServed=Math.max(state.bestServed,state.shiftServed);state.fewestMistakes=state.fewestMistakes===null?state.shiftMistakes:Math.min(state.fewestMistakes,state.shiftMistakes);save();$('#shiftState').textContent='CLOSED';$('#shiftSummary').textContent=`You served ${state.shiftServed} customers this shift and earned ${state.coins} coins. Your best shift is ${state.bestServed} customers.`;$('#shiftModal').hidden=false;
}
function startShift() {
  Object.values(state.processes).forEach(clearInterval);state.processes={};
  state.running=true;state.missed=0;state.streak=0;state.shiftServed=0;state.shiftMistakes=0;state.customers=[];state.groups.forEach(g=>{if(g.timer)clearInterval(g.timer);g.pf=null;g.cups=[null,null];g.running=false;});
  state.cups.forEach(c=>{c.at='shelf';c.shots=[];c.milk=null;c.extras={};c.art=false;});state.portafilters.forEach(p=>{p.at='shelf';p.doses=0;p.stage='empty';p.grindQ=[];p.group=null;});state.pitchers.forEach(p=>{p.at='shelf';p.stage='empty';});
  $('#shiftModal').hidden=true;$('#shiftState').textContent='OPEN';spawnCustomer();
  clearInterval(state.spawnTimer);state.spawnTimer=setInterval(()=>{const interval=Math.max(8500,16000-state.served*100);if(Math.random()<1000/interval)spawnCustomer();},1000);
  clearInterval(state.tickTimer);state.tickTimer=setInterval(()=>{let changed=false;for(const c of [...state.customers]){c.left--;changed=true;if(c.left<=0){state.customers=state.customers.filter(x=>x.id!==c.id);state.missed++;state.missedTotal++;state.streak=0;toast(`${c.drink.name} customer left`);if(state.missed>=5){endShift();break;}}}if(changed)renderCustomers();renderStats();save();},1000);
  render();
}

function renderStats() {
  const avg=state.served?(state.totalStars/state.served).toFixed(1):'—';
  $('#stats').innerHTML=`<span>🪙 <b>${state.coins}</b></span><span>Served <b>${state.served}</b></span><span>Best shift <b>${state.bestServed}</b></span><span>Best streak <b>${state.bestStreak}</b></span><span>Earned <b>${state.earnedTotal}</b></span><span>Fewest mistakes <b>${state.fewestMistakes??'—'}</b></span><span>Avg ★ <b>${avg}</b></span>`;
}
function renderShelf() {
  $('#inventory').innerHTML=`<div class="inventory-group"><b>CUPS</b>${state.cups.filter(x=>x.at==='shelf').map(x=>draggable(x)).join('')||'<small>All in use</small>'}</div><div class="inventory-group"><b>PORTAFILTERS</b>${state.portafilters.filter(x=>x.at==='shelf').map(x=>draggable(x)).join('')||'<small>All in use</small>'}</div><div class="inventory-group"><b>MILK PITCHERS</b>${state.pitchers.filter(x=>x.at==='shelf').map(x=>draggable(x)).join('')||'<small>All in use</small>'}</div><div class="inventory-tools"><span>☕ <b>${state.unlocked.length}</b> recipes</span></div>`;
}
function renderMats() {
  const slots=[1,2,3,4].map(n=>{const c=state.cups.find(x=>x.at===`mat-${n}`);return `<div class="mat"><label>CUP ${n}</label>${dropZone(`mat-${n}`,n,c?draggable(c):'') }</div>`;}).join('');
  return `<section class="station mat-station"><div class="station-title"><span>01</span><div><b>PREP MATS</b><small>Four dedicated cup positions</small></div></div><div class="mats-grid">${slots}</div><div class="station-note">Drag cups from the shelf. Cups stay on their mat until moved.</div></section>`;
}
function renderGrinder() {
  const pfs=state.portafilters.filter(x=>x.at==='grinder');
  return `<section class="station grinder-station" data-drop="grinder"><div class="station-title"><span>02</span><div><b>COFFEE GRINDER</b><small>One grind adds one dose</small></div></div><div class="machine-illustration grinder-art"><div class="hopper">● ● ●</div><div class="grinder-body"><i></i><b>GRIND</b></div><div class="grinder-base"></div></div>${pfs.map(p=>`<div class="station-object">${draggable(p)}<button data-action="grind-${p.id}" class="action">Grind dose</button></div>`).join('')||'<div class="station-empty">Drop a portafilter here</div>'}<div class="station-note">Grind again to add a second dose for a double.</div></section>`;
}
function renderTamper() {
  const pfs=state.portafilters.filter(x=>x.at==='tamper');
  return `<section class="station tamper-station" data-drop="tamper"><div class="station-title"><span>03</span><div><b>TAMPING MAT</b><small>Prepare the coffee puck</small></div></div><div class="machine-illustration tamper-art"><div class="tamper-handle"></div><div class="tamper-disc"></div><div class="tamper-base"></div></div>${pfs.map(p=>`<div class="station-object">${draggable(p)}<button data-action="tamp-${p.id}" class="action">Tamp puck</button></div>`).join('')||'<div class="station-empty">Drop a ground portafilter here</div>'}<div class="bin" data-drop="bin">🗑 Knock box · drop spent portafilter here</div></section>`;
}
function renderMachine() {
  return `<section class="station espresso-station"><div class="station-title"><span>04</span><div><b>ESPRESSO MACHINE</b><small>Two independent group heads</small></div></div><div class="espresso-shell"><div class="espresso-top"><i></i><i></i><i></i><span>BEAN THERE</span></div><div class="group-row">${state.groups.map((g,i)=>`<div class="group-head"><b>GROUP ${i+1}</b>${dropZone('group',i,g.pf?draggable(byId(g.pf)):'<span class="slot-empty">Portafilter</span>','group-slot')}${dropZone('groupcup',`${i}-0`,g.cups[0]?draggable(byId(g.cups[0])):'<span class="slot-empty">Cup A</span>','cup-target')}${dropZone('groupcup',`${i}-1`,g.cups[1]?draggable(byId(g.cups[1])):'<span class="slot-empty">Cup B</span>','cup-target') }<button data-action="brew-${i}" class="action brew">${g.running?'Brewing…':'Brew'}</button><div class="progress-track"><i></i></div></div>`).join('')}</div><div class="drip-tray"></div></div><div class="station-note">Double dose + one cup = two shots. Two cups = one shot in each.</div></section>`;
}
function renderMilk() {
  const fridge=state.pitchers.filter(p=>p.at==='fridge'), wand=state.pitchers.filter(p=>p.at==='wand');
  return `<section class="station milk-station" data-drop="fridge"><div class="station-title"><span>05</span><div><b>MILK FRIDGE</b><small>Fill a pitcher with cold milk</small></div></div><div class="fridge-art"><div class="fridge-door"><i></i><b>MILK</b></div></div>${fridge.map(p=>`<div class="station-object">${draggable(p)}<button data-action="fill-${p.id}" class="action">Fill pitcher</button></div>`).join('')||'<div class="station-empty">Drop an empty pitcher here</div>'}<div class="wand-zone" data-drop="wand"><b>♨ STEAM WAND</b><small>Drop filled pitcher here</small>${wand.map(p=>`<div class="station-object">${draggable(p)}<button data-action="steam-${p.id}" class="action">Steam milk</button></div>`).join('')}</div></section>`;
}
function renderPumps() {
  const pumpIds=['vanilla','caramel','choc','pumpkin','whip','ice','water','icecream'];
  const cup=state.cups.find(c=>c.at==='pump');
  return `<section class="station pantry-station"><div class="station-title"><span>06</span><div><b>SYRUP & FINISHING</b><small>Bring a cup to the pump rail</small></div></div><div class="pump-cup" data-drop="pump">${cup?draggable(cup):'<span>Drop cup here to add ingredients</span>'}</div><div class="pump-grid">${pumpIds.map(id=>`<button data-pump="${id}" class="pump" title="${EXTRAS[id]}"><i>${({vanilla:'🌼',caramel:'🍯',choc:'🍫',pumpkin:'🎃',whip:'🍥',ice:'🧊',water:'💧',icecream:'🍨'})[id]}</i><span>${EXTRAS[id]}</span><small>+1 pump</small></button>`).join('')}</div><button id="artBonus" class="secondary">♡ Add latte art bonus</button><div class="station-note">Each tap adds one pump. Extra ingredients affect the order.</div></section>`;
}
function renderWaterNote(){return `<section class="station recipe-station"><div class="station-title"><span>07</span><div><b>DRINK MENU</b><small>Recipes currently in rotation</small></div></div><div class="recipe-list">${state.unlocked.map(id=>recipes[id]).filter(Boolean).map(d=>`<div><b>${d.name}</b><small>${d.shots} shot${d.shots>1?'s':''}${d.milk?` · ${d.milk} milk`:''}${(d.extras||[]).length?' · '+d.extras.map(x=>EXTRAS[x]).join(', '):''}</small></div>`).join('')}</div><div class="station-note">New recipes unlock as you serve more customers.</div></section>`;}
function render() {
  $('#stations').innerHTML=renderMats()+renderGrinder()+renderTamper()+renderMachine()+renderMilk()+renderPumps();
  renderShelf();renderCustomers();renderStats();
  document.querySelectorAll('[data-item]').forEach(bindDrag);
  document.querySelectorAll('[data-action]').forEach(b=>b.addEventListener('click',()=>{const [action,id]=b.dataset.action.split(/-(.+)/);if(action==='brew')return startBrew(Number(id));const item=byId(id);if(!item)return;if(action==='grind')runGrind(item);if(action==='tamp')runTamp(item);if(action==='fill')runFill(item);if(action==='steam')runSteam(item);if(action==='brew')startBrew(Number(id));}));
  document.querySelectorAll('[data-pump]').forEach(b=>b.addEventListener('click',()=>addPump(b.dataset.pump)));
  $('#artBonus').onclick=addArt;
}
function renderUpgrades() {
  $('#upgradeList').innerHTML=upgradeDefs.map(([id,name,cost,desc,repeat])=>{const owned=!!state.upgrades[id];return `<div class="upgrade-row"><div><b>${name}</b><small>${desc}</small></div><button data-upgrade="${id}" ${owned?'disabled':''}>${owned?'Owned':`🪙 ${cost}`}</button></div>`;}).join('');
  $('#upgradeList').querySelectorAll('[data-upgrade]').forEach(b=>b.onclick=()=>{const d=upgradeDefs.find(x=>x[0]===b.dataset.upgrade);if(!d||state.upgrades[d[0]])return;if(state.coins<d[2])return toast('Not enough coins');state.coins-=d[2];state.upgrades[d[0]]=true;if(d[0]==='extraPF')state.portafilters.push(newPF());if(d[0]==='extraPitcher')state.pitchers.push(newPitcher());save();render();renderUpgrades();toast(`${d[1]} unlocked`);});
}
$('#upgradesBtn').onclick=()=>{$('#upgradeModal').hidden=false;renderUpgrades();};$('#closeUpgrades').onclick=()=>$('#upgradeModal').hidden=true;
$('#restartShift').onclick=startShift;


inventoryInit();render();startShift();
