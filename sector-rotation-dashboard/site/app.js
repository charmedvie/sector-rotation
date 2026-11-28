'use strict';

const COLORS = {
  Leading: '#45d2a6',
  Weakening: '#ffbd6b',
  Lagging: '#f2809b',
  Improving: '#63bdf8',
};
const SECTOR_COLORS = {
  XLK: '#00caff', XLF: '#ff8200', XLY: '#f56bd8', XLC: '#aa8bfa',
  XLI: '#a7e34b', XLV: '#ff5656', XLP: '#19d5a1', XLE: '#f9e64f',
  XLB: '#9faab6', XLU: '#689bff', XLRE: '#e4eaf4',
};
const STOCK_PALETTE = Object.values(SECTOR_COLORS);
const sectorColor = ticker => state.universe === 'sectors' ? (SECTOR_COLORS[ticker] || '#ddd') :
  STOCK_PALETTE[Math.max(0, universeTickers().indexOf(ticker)) % STOCK_PALETTE.length];
const sectorLabel = sector => state.fullNames ? sector.name : sector.ticker;
const QUADRANT_ORDER = { Leading: 0, Improving: 1, Weakening: 2, Lagging: 3 };
const $ = id => document.getElementById(id);
const state = {
  data: null,
  benchmark: 'SPY',
  universe: 'sectors',
  sensitivity: 'medium',
  selected: new Set(),
  week: 0,
  trail: 8,
  scale: 'adaptive',
  fullNames: false,
  sort: 'return_4w',
  desc: true,
  chartReady: false,
};

function quadrant(ratio, momentum) {
  if (ratio >= 100 && momentum >= 100) return 'Leading';
  if (ratio >= 100) return 'Weakening';
  if (momentum >= 100) return 'Improving';
  return 'Lagging';
}

function fmt(n, places = 2) { return Number(n).toFixed(places); }
function dateLabel(iso, compact = false) {
  const d = new Date(`${iso}T12:00:00Z`);
  return d.toLocaleDateString('en-US', compact
    ? { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }
    : { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
}
function universeTickers() {
  return state.universe === 'sectors' ? state.data.sectors.map(s=>s.ticker) : (state.data.watchlists?.[state.universe] ?? []);
}
function seriesFor(ticker, mode=state.sensitivity) {
  if (state.universe === 'sectors') return (state.data.sensitivities?.[mode] ?? state.data.benchmarks)?.[state.benchmark]?.[ticker];
  return state.data.stock_rotation?.[mode]?.[state.benchmark]?.[ticker];
}
function validPoint(s,i) {
  return !!s && Number.isFinite(s.ratio[i]) && Number.isFinite(s.momentum[i]);
}
function activeAssets() {
  if (state.universe === 'sectors') return state.data.sectors;
  return universeTickers().filter(t=>validPoint(seriesFor(t),state.week)&&validPoint(seriesFor(t),state.week-1))
    .map(t=>({ticker:t,...state.data.stocks[t]}));
}
function updateUniverse(reset=false) {
  const assets = activeAssets();
  const available = new Set(assets.map(s=>s.ticker));
  state.selected = reset ? available : new Set([...state.selected].filter(t=>available.has(t)));
  const missing = universeTickers().filter(t=>!available.has(t));
  $('unavailable-assets').textContent = missing.length ? 'Unavailable or insufficient history for this setting: '+missing.join(', ') : '';
  $('universe-title').textContent = state.universe === 'sectors' ? 'Sector universe' : state.universe+' watchlist';
  $('universe-total').textContent = universeTickers().length;
  $('standings-title').textContent = state.universe === 'sectors' ? 'Sector standings' : 'Stock standings';
  initFilters(); render();
}
function updateSensitivityHint() {
  const p = state.data.preset_parameters?.[state.sensitivity];
  $('sensitivity-select').title = p
    ? `RS smoothing: ${p.smoothing === 1 ? 'None' : p.smoothing + ' weeks'}; trend EMA: ${p.trend} weeks; momentum EMA: ${p.momentum} weeks`
    : 'Original High calculation; refresh data to enable all presets';
}
function heading(dx, dy) {
  const east = dx > 0.00001, west = dx < -0.00001;
  const north = dy > 0.00001, south = dy < -0.00001;
  return north ? (east ? '↗ NE' : west ? '↖ NW' : '↑ N') :
    south ? (east ? '↘ SE' : west ? '↙ SW' : '↓ S') :
    east ? '→ E' : west ? '← W' : '— Flat';
}
// Compare latest displacement with the pooled prior 52 weekly movements
// of the full sector universe, for the active benchmark and sensitivity.
function speedThresholds() {
  const history = [];
  for (const sector of activeAssets()) {
    const s = seriesFor(sector.ticker);
    for (let j = Math.max(1, state.week - 52); j < state.week; j++) {
      if (!validPoint(s,j) || !validPoint(s,j-1)) continue;
      const d = Math.hypot(s.ratio[j] - s.ratio[j-1], s.momentum[j] - s.momentum[j-1]);
      if (Number.isFinite(d)) history.push(d);
    }
  }
  history.sort((a,b) => a-b);
  if (history.length < 12) return null;
  const quantile = q => {
    const p = (history.length - 1) * q, i = Math.floor(p), f = p - i;
    return history[i] * (1-f) + history[Math.min(i+1, history.length-1)] * f;
  };
  return [quantile(1/3), quantile(2/3)];
}
function speedLabel(speed, thresholds) {
  if (!Number.isFinite(speed) || !thresholds) return '—';
  if (speed <= thresholds[0]) return 'Crawl';
  if (speed <= thresholds[1]) return 'Walk';
  return 'Run';
}
function pctCell(n) {
  return Number.isFinite(n)
    ? `<td class="right number-cell ${n>0?'pos':n<0?'neg':''}">${n>0?'+':''}${fmt(n,1)}%</td>`
    : '<td class="right">—</td>';
}
function observationFor(sector, thresholds) {
  const s = seriesFor(sector.ticker);
  const i = state.week;
  const ratio = s.ratio[i], momentum = s.momentum[i];
  const previous = i > 0 ? quadrant(s.ratio[i - 1], s.momentum[i - 1]) : null;
  const dx = i > 0 ? ratio - s.ratio[i - 1] : 0;
  const dy = i > 0 ? momentum - s.momentum[i - 1] : 0;
  const q = quadrant(ratio, momentum);
  const speed = Math.hypot(dx,dy);
  const modes = ['low','medium','high'].map(mode => {
    const series = seriesFor(sector.ticker, mode);
    return validPoint(series,i) && (state.data.sensitivities || state.universe !== 'sectors') ? quadrant(series.ratio[i], series.momentum[i]) : null;
  });
  const agreement = modes.every(Boolean) ? modes.filter(m => m === q).length : null;
  const absolute = state.data.absolute?.[sector.ticker] ?? {};
  return { ticker: sector.ticker, name: sector.name, ratio, momentum,
    change: dx, direction: heading(dx,dy), speed, pace: speedLabel(speed, thresholds),
    quadrant: q, previous, agreement, modes, ...absolute };
}
function observations() {
  const thresholds = speedThresholds();
  return activeAssets().map(sector => observationFor(sector, thresholds));
}

function showError(message) {
  const banner = $('error-banner');
  banner.textContent = message;
  banner.hidden = false;
}

async function loadData() {
  try {
    const response = await fetch('data/rotation.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`Data request returned ${response.status}`);
    const data = await response.json();
    if (!data || !data.dates || data.dates.length < 24 || !data.benchmarks || !data.sectors)
      throw new Error('The data file is missing required fields');
    state.data = data;
    const selector = $('sensitivity-select');
    if (!data.sensitivities) {
      state.sensitivity = 'high';
      selector.value = 'high';
      selector.disabled = true;
    } else {
      selector.value = state.sensitivity;
    }
    updateSensitivityHint();
    state.selected = new Set(data.sectors.map(s => s.ticker));
    state.week = data.dates.length - 1;
    $('demo-banner').hidden = !data.is_demo;
    $('data-indicator').textContent = data.is_demo ? 'SIMULATED PREVIEW' : 'LATEST DATA LOADED';
    document.querySelector('.signal-indicator').classList.add(data.is_demo ? 'demo' : 'live');
    $('latest-date').textContent = dateLabel(data.as_of);
    $('observation-status').textContent = data.is_demo ? 'SIMULATION · NOT LIVE PRICES' : 'WEEKLY ADJUSTED CLOSE';
    $('source-label').textContent = data.is_demo ? 'Synthetic demo' : 'yfinance / Yahoo Finance';
    const universe = $('universe-select');
    for (const key of ['Volatile','Stablish','Explore','Defensive']) {
      if (!data.watchlists?.[key]) continue;
      const option = document.createElement('option');
      option.value=key; option.textContent=key; universe.appendChild(option);
    }
    initEvents();
    updateUniverse(true);
  } catch (e) {
    showError(`Unable to load rotation data: ${e.message}. When using the download locally, serve the site with python -m http.server --directory site 8000. For GitHub Pages, run the deployment workflow.`);
    $('data-indicator').textContent = 'DATA UNAVAILABLE';
    console.error(e);
  }
}

function initFilters() {
  $('sector-filters').innerHTML = '';
  for (const sector of activeAssets()) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'sector-filter';
    button.title = sector.name;
    button.dataset.sector = sector.ticker;
    button.innerHTML = `<span class="sector-dot"></span><span class="sector-ticker">${sectorLabel(sector)}</span>`;
    button.addEventListener('click', () => {
      if (state.selected.has(sector.ticker)) state.selected.delete(sector.ticker);
      else state.selected.add(sector.ticker);
      render();
    });
    $('sector-filters').appendChild(button);
  }
}

function initEvents() {
  $('universe-select').addEventListener('change', event => {
    state.universe=event.target.value;
    $('sector-benchmark-option').disabled=state.universe==='sectors';
    if (state.universe==='sectors' && state.benchmark==='sector') state.benchmark='SPY';
    $('benchmark-select').value=state.benchmark;
    updateUniverse(true);
  });
  $('benchmark-select').addEventListener('change', event => {
    state.benchmark = event.target.value;
    updateUniverse(true);
  });
  $('sensitivity-select').addEventListener('change', event => {
    state.sensitivity = event.target.value;
    updateSensitivityHint();
    updateUniverse(true);
  });
  $('scale-select').addEventListener('change', event => {
    state.scale = event.target.value; renderChart();
  });
  let resizeFrame;
  window.addEventListener('resize', () => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame=requestAnimationFrame(()=>{if(state.data) renderChart();});
  });
  $('trail-select').addEventListener('change', event => {
    state.trail = Number(event.target.value); render();
  });
  $('select-all').addEventListener('click', () => {
    state.selected = new Set(activeAssets().map(s => s.ticker)); render();
  });
  $('select-none').addEventListener('click', () => {
    state.selected.clear(); render();
  });
  $('label-select')?.addEventListener('change', event => {
    state.fullNames = event.target.value === 'name'; render();
  });
  document.querySelectorAll('th button[data-sort]').forEach(button => {
    button.addEventListener('click', () => {
      const key = button.dataset.sort;
      if (state.sort === key) state.desc = !state.desc;
      else { state.sort = key; state.desc = !['ticker', 'quadrant'].includes(key); }
      renderTable();
    });
  });
}
function render() {
  if (!state.data) return;
  const obs = observations();
  const count = q => obs.filter(s => s.quadrant === q).length;
  const transitions = obs.filter(s => s.previous !== null && s.previous !== s.quadrant);
  $('stat-benchmark').textContent = state.benchmark === 'sector' ? 'Sector ETF' : state.benchmark;
  $('stat-benchmark-description').textContent = state.benchmark === 'sector' ? 'Individual sector proxies' : (state.data.benchmark_names?.[state.benchmark] ?? state.benchmark);
  $('stat-leading').textContent = String(count('Leading')).padStart(2, '0');
  $('stat-improving').textContent = String(count('Improving')).padStart(2, '0');
  $('stat-crossings').textContent = String(transitions.length).padStart(2, '0');
  $('selected-count').textContent = state.selected.size;
  $('sector-filters').classList.toggle('full-names', state.fullNames);
  document.querySelectorAll('.sector-filter').forEach(button => {
    const isSelected = state.selected.has(button.dataset.sector);
    button.setAttribute('aria-pressed', String(isSelected));
    const record = obs.find(s => s.ticker === button.dataset.sector);
    button.querySelector('.sector-dot').style.background = sectorColor(record.ticker);
    button.querySelector('.sector-ticker').textContent = sectorLabel(record);
  });
  renderMoves(transitions);
  renderTable(obs);
  renderChart();
}

function renderMoves(changes) {
  const container = $('moves-list');
  if (!changes.length) {
    container.innerHTML = '<div class="empty-moves">No sector crossed a quadrant boundary this week.</div>';
    return;
  }
  container.innerHTML = changes.slice(0, 6).map(s => `
    <div class="move-row"><div class="move-top"><span class="move-sym">${sectorLabel(s)}</span><span class="move-now" style="color:${COLORS[s.quadrant]}">${s.quadrant.toUpperCase()}</span></div>
    <div class="move-desc">${s.previous}<span class="move-arrow">→</span>${s.quadrant}</div></div>`).join('');
}
function sparkline(ticker, color) {
  const a = seriesFor(ticker).ratio;
  const values = a.slice(Math.max(0, state.week - 15), state.week + 1);
  const min = Math.min(...values), max = Math.max(...values);
  const scale = (max - min) || 0.01;
  const points = values.map((n, i) => `${(i / Math.max(1, values.length - 1) * 86).toFixed(1)},${(23 - ((n - min) / scale) * 20).toFixed(1)}`).join(' ');
  return `<svg class="sparkline" viewBox="0 0 86 25" aria-hidden="true"><polyline points="${points}" style="stroke:${color}"/></svg>`;
}
function renderTable(existing = null) {
  const obs = existing || observations();
  const mult = state.desc ? -1 : 1;
  obs.sort((a, b) => {
    let comparison;
    if (state.sort === 'ticker') comparison = a.ticker.localeCompare(b.ticker);
    else if (state.sort === 'quadrant') comparison = QUADRANT_ORDER[a.quadrant] - QUADRANT_ORDER[b.quadrant];
    else if (state.sort === 'direction') comparison = a.direction.localeCompare(b.direction);
    else {
      const av = a[state.sort], bv = b[state.sort];
      if (!Number.isFinite(av)) return Number.isFinite(bv) ? 1 : 0;
      if (!Number.isFinite(bv)) return -1;
      comparison = av - bv;
    }
    return comparison * mult;
  });
  document.querySelectorAll('th button[data-sort]').forEach(b => {
    b.classList.toggle('active-sort', b.dataset.sort === state.sort);
  });
  $('standings-body').innerHTML = obs.length ? obs.map(s => {
    const selected = state.selected.has(s.ticker);
    const c = sectorColor(s.ticker);
    return `<tr tabindex="0" data-row="${s.ticker}" class="${selected && state.selected.size === 1 ? 'spotlight' : ''}" aria-label="Spotlight ${s.name}">
       <td><div class="ticker-cell"><div class="ticker-avatar" style="color:${c}">${s.ticker}</div>${state.fullNames ? `<div class="ticker-main">${s.name}</div>` : ''}</div></td>
       <td title="RS ratio: ${fmt(s.ratio)}; RS momentum: ${fmt(s.momentum)}; weekly ratio change: ${fmt(s.change)}"><span class="q-pill ${s.quadrant.toLowerCase()}">${s.quadrant.toUpperCase()}</span></td>
       <td class="direction-cell" title="Latest weekly direction: ${s.direction}">${s.direction.split(' ')[0]}</td>
       <td class="pace-cell" title="Weekly displacement: ${fmt(s.speed)} RS points; compared with the preceding 52 weeks across all sectors"><span class="pace pace-${s.pace.toLowerCase()}">${s.pace}</span></td>
       ${pctCell(s.return_1w)}
       ${pctCell(s.return_4w)}
       ${pctCell(s.return_12w)}
       ${pctCell(s.ema_50d_pct)}
       ${pctCell(s.ema_200d_pct)}
       <td class="right" title="Low: ${s.modes[0]??'—'} · Medium: ${s.modes[1]??'—'} · High: ${s.modes[2]??'—'}">${s.agreement===null?'—':s.agreement+'/3'}</td>
     </tr>`;
  }).join('') : '<tr><td colspan="10" class="loading-table">No symbols with sufficient current history for this view.</td></tr>';
  document.querySelectorAll('[data-row]').forEach(row => {
    function spotlight() {
      const ticker = row.dataset.row;
      if (state.selected.size === 1 && state.selected.has(ticker)) {
        state.selected = new Set(activeAssets().map(s => s.ticker));
      } else state.selected = new Set([ticker]);
      render();
      if (window.innerWidth < 750) $('rrg-chart').scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    row.addEventListener('click', spotlight);
    row.addEventListener('keydown', e => { if (e.key === 'Enter') spotlight(); });
  });
}

function collectTrails() {
  return activeAssets().filter(s=>state.selected.has(s.ticker)).map(sector=>{
    const s=seriesFor(sector.ticker), limit=Math.max(0,state.week-state.trail+1);
    let start=state.week;
    while(start>limit && validPoint(s,start-1)) start--;
    return {sector,x:s.ratio.slice(start,state.week+1),y:s.momentum.slice(start,state.week+1),
      dates:state.data.dates.slice(start,state.week+1)};
  });
}
function quantile(values,q) {
  const sorted=values.slice().sort((a,b)=>a-b);
  const p=(sorted.length-1)*q, i=Math.floor(p);
  return sorted[i]+(sorted[Math.min(i+1,sorted.length-1)]-sorted[i])*(p-i);
}
function calculateBounds(trails=collectTrails(),mode=state.scale) {
  const x=trails.flatMap(t=>t.x).filter(Number.isFinite), y=trails.flatMap(t=>t.y).filter(Number.isFinite);
  const axis=(values,minHalf,oldPadding)=>{
    if(mode==='balanced') {
      const half=Math.max(minHalf,...values.map(v=>Math.abs(v-100)))*oldPadding;
      return [100-half,100+half];
    }
    const focus=mode==='focus' && trails.length>=4 && values.length>=20;
    const lo=focus?quantile(values,.10):Math.min(100,...values);
    const hi=focus?quantile(values,.90):Math.max(100,...values);
    const min=Math.min(100-minHalf,lo), max=Math.max(100+minHalf,hi);
    const span=max-min;
    // Asymmetric padding; keep the neutral crosshair visible even if all assets are on one side.
    const pad=Math.max(span*.09,minHalf*.2);
    return [min-pad,max+pad];
  };
  const [xmin,xmax]=axis(x,.5,1.38),[ymin,ymax]=axis(y,.2,1.50);
  return {xmin,xmax,ymin,ymax};
}
function inside(x,y,b) {return x>=b.xmin&&x<=b.xmax&&y>=b.ymin&&y<=b.ymax;}
function edgePoint(x,y,b) {
  const dx=x-100,dy=y-100;
  const padX=(b.xmax-b.xmin)*.025,padY=(b.ymax-b.ymin)*.025;
  const tx=dx>0?(b.xmax-padX-100)/dx:dx<0?(b.xmin+padX-100)/dx:Infinity;
  const ty=dy>0?(b.ymax-padY-100)/dy:dy<0?(b.ymin+padY-100)/dy:Infinity;
  const t=Math.max(0,Math.min(1,tx,ty));
  const east=x>b.xmax,west=x<b.xmin,north=y>b.ymax,south=y<b.ymin;
  const arrow=north?(east?'↗':west?'↖':'↑'):south?(east?'↘':west?'↙':'↓'):east?'→':'←';
  return {x:100+dx*t,y:100+dy*t,arrow};
}
function escapeLabel(s) {return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');}
function layoutLabels(points,b,width,height) {
  const occupied=[], annotations=[];
  const toPixel=p=>({x:(p.x-b.xmin)/(b.xmax-b.xmin)*width,y:(b.ymax-p.y)/(b.ymax-b.ymin)*height});
  const markers=points.map(p=>({...toPixel(p)}));
  // Keep labels clear of the four corner quadrant captions.
  const reserve=Math.min(105,width*.23);
  occupied.push({l:0,r:reserve,t:0,b:23},{l:width-reserve,r:width,t:0,b:23},
    {l:0,r:reserve,t:height-23,b:height},{l:width-reserve,r:width,t:height-23,b:height});
  const overlap=(a,c)=>Math.max(0,Math.min(a.r,c.r)-Math.max(a.l,c.l))*Math.max(0,Math.min(a.b,c.b)-Math.max(a.t,c.t));
  for(const p of [...points].sort((a,c)=>a.y-c.y||a.x-c.x)) {
    const pos=toPixel(p);
    const raw=p.label, words=raw.split(' '), lines=[];
    let line='';
    for(const word of words) {if(line&&(line+' '+word).length>25){lines.push(line);line=word;}else line+=(line?' ':'')+word;}
    if(line)lines.push(line);
    const label=lines.map(escapeLabel).join('<br>');
    const w=Math.min(width-8,Math.max(22,...lines.map(s=>s.length*6.9))+8), h=lines.length*15+4;
    const candidates=[];
    for(const gap of [14,26,42,60,82]) for(const [sx,sy] of [[0,-1],[1,0],[-1,0],[0,1],[1,-1],[-1,-1],[1,1],[-1,1]]) {
      const cx=Math.max(w/2+2,Math.min(width-w/2-2,pos.x+sx*(gap+w/2)));
      const cy=Math.max(h/2+2,Math.min(height-h/2-2,pos.y+sy*(gap+h/2)));
      const rect={l:cx-w/2,r:cx+w/2,t:cy-h/2,b:cy+h/2};
      const conflict=occupied.reduce((n,r)=>n+overlap(rect,r),0)+markers.reduce((n,m)=>n+overlap(rect,{l:m.x-7,r:m.x+7,t:m.y-7,b:m.y+7}),0);
      candidates.push({cx,cy,rect,score:conflict*100+Math.hypot(cx-pos.x,cy-pos.y)});
    }
    candidates.sort((a,c)=>a.score-c.score);
    const best=candidates[0];occupied.push(best.rect);
    annotations.push({x:p.x,y:p.y,xref:'x',yref:'y',text:label,showarrow:true,ax:best.cx-pos.x,ay:best.cy-pos.y,
      axref:'pixel',ayref:'pixel',xanchor:'center',yanchor:'middle',arrowhead:0,arrowwidth:.8,arrowcolor:p.color,
      standoff:7,font:{color:p.color,size:12,family:'Arial, sans-serif'},bgcolor:'rgba(16,23,36,.82)',borderpad:2,captureevents:false,align:'center'});
  }
  return annotations;
}
// Centripetal Catmull–Rom spline, evaluated densely in two dimensions.
 // Normalize axes for tangent calculation; preserve the original observation coordinates.
function smoothTrail(x, y, bounds) {
  if (x.length < 2) return { x: x.slice(), y: y.slice() };
  const sx = bounds.xmax - bounds.xmin || 1;
  const sy = bounds.ymax - bounds.ymin || 1;
  const p = x.map((v, i) => [v, y[i]]);
  const spacing = (a, b) => Math.max(1e-6, Math.sqrt(Math.hypot((b[0]-a[0])/sx, (b[1]-a[1])/sy)));
  const t = [0];
  for (let i=1; i<p.length; i++) t.push(t[i-1] + spacing(p[i-1], p[i]));
  const tangent = (i, axis) => {
    if (i === 0) return (p[1][axis]-p[0][axis])/(t[1]-t[0]);
    if (i === p.length-1) return (p[i][axis]-p[i-1][axis])/(t[i]-t[i-1]);
    const a=t[i]-t[i-1], b=t[i+1]-t[i];
    return (b*(p[i][axis]-p[i-1][axis])/a + a*(p[i+1][axis]-p[i][axis])/b)/(a+b);
  };
  const out = { x: [], y: [] };
  for (let i=0; i<p.length-1; i++) {
    const dt=t[i+1]-t[i];
    for (let j=0; j<32; j++) {
      const u=j/32, u2=u*u, u3=u2*u;
      for (let axis=0; axis<2; axis++) {
        const v=(2*u3-3*u2+1)*p[i][axis]+(u3-2*u2+u)*dt*tangent(i,axis)
          +(-2*u3+3*u2)*p[i+1][axis]+(u3-u2)*dt*tangent(i+1,axis);
        out[axis===0?'x':'y'].push(v);
      }
    }
  }
  out.x.push(x.at(-1)); out.y.push(y.at(-1));
  return out;
}

function renderChart() {
  if (typeof Plotly === 'undefined') {
    $('rrg-chart').innerHTML = '<div class="loading-table">Chart library could not load. Check your internet connection.</div>';
    return;
  }
  const trails=collectTrails(), b=calculateBounds(trails), smoothingBounds=calculateBounds(trails,'adaptive');
  const traces=[], points=[], offscreen=[], clipped=[];
  const margin = window.innerWidth < 660 ? { l: 55, r: 19, t: 24, b: 45 } : { l: 70, r: 35, t: 28, b: 55 };
  for (const {sector,x,y,dates} of trails) {
    const ticker=sector.ticker, actualX=x.at(-1), actualY=y.at(-1);
    const q=quadrant(actualX,actualY), color=sectorColor(ticker);
    const off=!inside(actualX,actualY,b);
    const mark=off?edgePoint(actualX,actualY,b):{x:actualX,y:actualY,arrow:''};
    if(off)offscreen.push(ticker);
    const curve=smoothTrail(x,y,smoothingBounds);
    if(curve.x.some((v,i)=>!inside(v,curve.y[i],b)))clipped.push(ticker);
    traces.push({
      type:'scatter',mode:'lines',x:curve.x,y:curve.y,
      line:{color,width:2.8,shape:'linear',simplify:false},opacity:.95,hoverinfo:'skip',showlegend:false,cliponaxis:true,
    },{
      type:'scatter',mode:'markers',x:x.slice(0,-1),y:y.slice(0,-1),
      marker:{color,size:4.5,opacity:.75},hoverinfo:'skip',showlegend:false,cliponaxis:true,
    },{
      type:'scatter',mode:'markers',x:[mark.x],y:[mark.y],
      marker:{color,size:off?14:13,symbol:off?'diamond-open':'circle',line:{color:off?color:'#0c1420',width:2}},
      customdata:[[sector.name,q,dates.at(-1),ticker,state.benchmark==='sector'?sector.sector:state.benchmark,actualX,actualY,off?' · OFF CHART':'']],
      hovertemplate:`<b>${ticker} · %{customdata[0]}</b><br>%{customdata[1]} · vs %{customdata[4]}%{customdata[7]}<br>RS Ratio: %{customdata[5]:.3f}<br>RS Momentum: %{customdata[6]:.3f}<br>%{customdata[2]}<extra></extra>`,
      showlegend:false,cliponaxis:true,
    });
    points.push({x:mark.x,y:mark.y,label:sectorLabel(sector)+(off?' '+mark.arrow+' OFF':''),color});
  }
  const chart=$('rrg-chart');
  const labels=layoutLabels(points,b,Math.max(160,chart.clientWidth-margin.l-margin.r),Math.max(180,chart.clientHeight-margin.t-margin.b));
  const note=$('scale-note');
  note.hidden=state.scale!=='focus';
  note.textContent=state.scale==='focus'
    ? (offscreen.length?'Off-chart endpoints (hollow diamonds): '+offscreen.join(', ')+'. ':'All current endpoints visible. ')+
      (clipped.length?'Some historical trails are clipped. ':'')+'Switch to Adaptive to see the full range.'
    : '';
  const boxStyle = (x0, x1, y0, y1, fillcolor) => ({
    type: 'rect', xref: 'x', yref: 'y', x0, x1, y0, y1,
    fillcolor, line: { width: 0 }, layer: 'below',
  });
  const quadrantLabel = (name, x, y, xanchor, yanchor, color) => ({
    text: `<b>${name.toUpperCase()}</b>`, xref: 'paper', yref: 'paper', x, y,
    xanchor, yanchor, showarrow: false, font: { color, size: 11, family: 'Arial, sans-serif' },
    opacity: 0.83,
  });
  const layout = {
    paper_bgcolor: '#101724', plot_bgcolor: '#101724',
    margin, showlegend: false, hovermode: 'closest', dragmode: false,
    xaxis: {
      range: [b.xmin, b.xmax], color: '#8193ac', tickfont: { size: 10 },
      gridcolor: '#273344', gridwidth: 1, zeroline: false,
      linecolor: '#33435a', mirror: false, title: { text: 'RS RATIO →', font: { color: '#9aaec6', size: 11 }, standoff: 12 },
      tickformat: '.1f', fixedrange: true,
    },
    yaxis: {
      range: [b.ymin, b.ymax], color: '#8193ac', tickfont: { size: 10 },
      gridcolor: '#273344', gridwidth: 1, zeroline: false,
      linecolor: '#33435a', title: { text: 'RS MOMENTUM →', font: { color: '#9aaec6', size: 11 }, standoff: 12 },
      tickformat: '.1f', fixedrange: true,
    },
    shapes: [
      boxStyle(b.xmin, 100, 100, b.ymax, '#122333'),
      boxStyle(100, b.xmax, 100, b.ymax, '#102b28'),
      boxStyle(b.xmin, 100, b.ymin, 100, '#2c1b28'),
      boxStyle(100, b.xmax, b.ymin, 100, '#2b2620'),
      { type: 'line', x0: 100, x1: 100, y0: b.ymin, y1: b.ymax, line: { color: '#7b8da8', width: 1.2, dash: 'dot' } },
      { type: 'line', x0: b.xmin, x1: b.xmax, y0: 100, y1: 100, line: { color: '#7b8da8', width: 1.2, dash: 'dot' } },
    ],
    annotations: [
      quadrantLabel('Improving', 0.03, 0.96, 'left', 'top', '#5b9cc5'),
      quadrantLabel('Leading', 0.97, 0.96, 'right', 'top', '#58ae91'),
      quadrantLabel('Lagging', 0.03, 0.045, 'left', 'bottom', '#bd6a87'),
      quadrantLabel('Weakening', 0.97, 0.045, 'right', 'bottom', '#c59662'),
      ...labels,
      ...(!state.selected.size ? [{ x: 0.5, y: 0.5, xref: 'paper', yref: 'paper', showarrow: false,
        text: 'Select one or more available symbols', font: { color: '#c4d3e5', size: 15 } }] : []),
    ],
    font: { family: 'Arial, sans-serif', color: '#a9bcd3' },
  };
  Plotly.react('rrg-chart', traces, layout, {
    responsive: true, displaylogo: false, scrollZoom: false, doubleClick: false, displayModeBar: false,
    modeBarButtonsToRemove: ['lasso2d', 'select2d', 'autoScale2d', 'hoverClosestCartesian', 'hoverCompareCartesian'],
    toImageButtonOptions: { format: 'png', filename: 'sector-rotation', scale: 2 },
  }).then(() => {
    if (!state.chartReady) {
      state.chartReady = true;
      $('rrg-chart').on('plotly_click', event => {
        const point = event.points?.[0];
        if (!point || !point.customdata) return;
        const symbol = point.customdata[3];
        if (!symbol || !seriesFor(symbol)) return;
        state.selected = state.selected.size === 1 && state.selected.has(symbol)
          ? new Set(activeAssets().map(s => s.ticker)) : new Set([symbol]);
        render();
      });
    }
  }).catch(err => { console.error(err); showError(`Chart error: ${err.message}`); });
}

loadData();
