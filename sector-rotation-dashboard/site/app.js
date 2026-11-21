'use strict';

const COLORS = {
  Leading: '#45d2a6',
  Weakening: '#ffbd6b',
  Lagging: '#f2809b',
  Improving: '#63bdf8',
};
const SECTOR_COLORS = {
  XLK: '#00caff', XLF: '#ff9f1c', XLY: '#f56bd8', XLC: '#aa8bfa',
  XLI: '#a7e34b', XLV: '#ff5656', XLP: '#19d5a1', XLE: '#f9e64f',
  XLB: '#f59775', XLU: '#689bff', XLRE: '#e4eaf4',
};
const sectorColor = ticker => SECTOR_COLORS[ticker] || '#ddd';
const sectorLabel = sector => state.fullNames ? sector.name : sector.ticker;
const QUADRANT_ORDER = { Leading: 0, Improving: 1, Weakening: 2, Lagging: 3 };
const $ = id => document.getElementById(id);
const state = {
  data: null,
  benchmark: 'SPY',
  sensitivity: 'medium',
  selected: new Set(),
  week: 0,
  trail: 8,
  fullNames: false,
  sort: 'ratio',
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
function seriesFor(ticker) {
  return (state.data.sensitivities?.[state.sensitivity] ?? state.data.benchmarks)[state.benchmark][ticker];
}
function updateSensitivityHint() {
  const p = state.data.preset_parameters?.[state.sensitivity];
  $('sensitivity-select').title = p
    ? `RS smoothing: ${p.smoothing === 1 ? 'None' : p.smoothing + ' weeks'}; trend EMA: ${p.trend} weeks; momentum EMA: ${p.momentum} weeks`
    : 'Original High calculation; refresh data to enable all presets';
}
function observationFor(sector) {
  const s = seriesFor(sector.ticker);
  const i = state.week;
  const ratio = s.ratio[i], momentum = s.momentum[i];
  const previous = i > 0 ? quadrant(s.ratio[i - 1], s.momentum[i - 1]) : null;
  return { ticker: sector.ticker, name: sector.name, ratio, momentum,
    change: i > 0 ? ratio - s.ratio[i - 1] : 0,
    quadrant: quadrant(ratio, momentum), previous };
}
function observations() { return state.data.sectors.map(observationFor); }

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
    initFilters();
    initEvents();
    render();
  } catch (e) {
    showError(`Unable to load rotation data: ${e.message}. When using the download locally, serve the site with python -m http.server --directory site 8000. For GitHub Pages, run the deployment workflow.`);
    $('data-indicator').textContent = 'DATA UNAVAILABLE';
    console.error(e);
  }
}

function initFilters() {
  $('sector-filters').innerHTML = '';
  for (const sector of state.data.sectors) {
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
  $('benchmark-select').addEventListener('change', event => {
    state.benchmark = event.target.value;
    render();
  });
  $('sensitivity-select').addEventListener('change', event => {
    state.sensitivity = event.target.value;
    updateSensitivityHint();
    render();
  });
  $('trail-select').addEventListener('change', event => {
    state.trail = Number(event.target.value); render();
  });
  $('select-all').addEventListener('click', () => {
    state.selected = new Set(state.data.sectors.map(s => s.ticker)); render();
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
  $('stat-benchmark').textContent = state.benchmark;
  $('stat-benchmark-description').textContent = state.data.benchmark_names?.[state.benchmark] ?? state.benchmark;
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
    else comparison = a[state.sort] - b[state.sort];
    return comparison * mult;
  });
  document.querySelectorAll('th button[data-sort]').forEach(b => {
    b.classList.toggle('active-sort', b.dataset.sort === state.sort);
  });
  $('standings-body').innerHTML = obs.map(s => {
    const selected = state.selected.has(s.ticker);
    const c = sectorColor(s.ticker);
    return `<tr tabindex="0" data-row="${s.ticker}" class="${selected && state.selected.size === 1 ? 'spotlight' : ''}" aria-label="Spotlight ${s.name}">
       <td><div class="ticker-cell"><div class="ticker-avatar" style="color:${c}">${s.ticker}</div>${state.fullNames ? `<div class="ticker-main">${s.name}</div>` : ''}</div></td>
       <td><span class="q-pill ${s.quadrant.toLowerCase()}">${s.quadrant.toUpperCase()}</span></td>
       <td class="right number-cell">${fmt(s.ratio)}</td>
       <td class="right number-cell">${fmt(s.momentum)}</td>
       <td class="right number-cell ${s.change >= 0 ? 'pos' : 'neg'}">${s.change >= 0 ? '+' : ''}${fmt(s.change)}</td>
       <td class="right">${sparkline(s.ticker, c)}</td>
     </tr>`;
  }).join('');
  document.querySelectorAll('[data-row]').forEach(row => {
    function spotlight() {
      const ticker = row.dataset.row;
      if (state.selected.size === 1 && state.selected.has(ticker)) {
        state.selected = new Set(state.data.sectors.map(s => s.ticker));
      } else state.selected = new Set([ticker]);
      render();
      if (window.innerWidth < 750) $('rrg-chart').scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    row.addEventListener('click', spotlight);
    row.addEventListener('keydown', e => { if (e.key === 'Enter') spotlight(); });
  });
}

function calculateBounds() {
  let maxX = 0.5, maxY = 0.20;
  for (const sector of state.data.sectors) {
    if (!state.selected.has(sector.ticker)) continue;
    const { ratio, momentum } = seriesFor(sector.ticker);
    const start = Math.max(0, state.week - state.trail + 1);
    for (let i = start; i <= state.week; i++) {
      maxX = Math.max(maxX, Math.abs(ratio[i] - 100));
      maxY = Math.max(maxY, Math.abs(momentum[i] - 100));
    }
  }
  maxX *= 1.38; maxY *= 1.50;
  return { xmin: 100 - maxX, xmax: 100 + maxX, ymin: 100 - maxY, ymax: 100 + maxY };
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
  const b = calculateBounds();
  const traces = [];
  for (const sector of state.data.sectors) {
    const ticker = sector.ticker;
    if (!state.selected.has(ticker)) continue;
    const s = seriesFor(ticker);
    const start = Math.max(0, state.week - state.trail + 1);
    const x = s.ratio.slice(start, state.week + 1);
    const y = s.momentum.slice(start, state.week + 1);
    const q = quadrant(x.at(-1), y.at(-1));
    const color = sectorColor(ticker);
    const dates = state.data.dates.slice(start, state.week + 1);
    const curve = smoothTrail(x, y, b);
    traces.push({
      type: 'scatter', mode: 'lines', x: curve.x, y: curve.y,
      line: { color, width: 2.8, shape: 'linear', simplify: false },
      opacity: 0.95, hoverinfo: 'skip', showlegend: false, cliponaxis: false,
    });
    traces.push({
      type: 'scatter', mode: 'markers', x: x.slice(0,-1), y: y.slice(0,-1),
      marker: { color, size: 4.5, opacity: 0.75 },
      hoverinfo: 'skip', showlegend: false, cliponaxis: false,
    });
    traces.push({
      type: 'scatter', mode: 'markers+text', x: [x.at(-1)], y: [y.at(-1)], text: [sectorLabel(sector)],
      textposition: 'top center', textfont: { color, size: 12, family: 'Arial, sans-serif' },
      marker: { color, size: 13, line: { color: '#0c1420', width: 2 } },
      customdata: [[sector.name, q, dates.at(-1), ticker]],
      hovertemplate: `<b>${ticker} · %{customdata[0]}</b><br>%{customdata[1]}<br>RS Ratio: %{x:.3f}<br>RS Momentum: %{y:.3f}<br>%{customdata[2]}<extra></extra>`,
      showlegend: false, cliponaxis: false,
    });
  }
  const margin = window.innerWidth < 660 ? { l: 55, r: 19, t: 24, b: 45 } : { l: 70, r: 35, t: 28, b: 55 };
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
      ...(!state.selected.size ? [{ x: 0.5, y: 0.5, xref: 'paper', yref: 'paper', showarrow: false,
        text: 'Select one or more sectors in the right-hand panel', font: { color: '#c4d3e5', size: 15 } }] : []),
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
        if (!point || !point.customdata || !point.data?.text) return;
        const symbol = point.customdata[3];
        if (!symbol || !seriesFor(symbol)) return;
        state.selected = state.selected.size === 1 && state.selected.has(symbol)
          ? new Set(state.data.sectors.map(s => s.ticker)) : new Set([symbol]);
        render();
      });
    }
  }).catch(err => { console.error(err); showError(`Chart error: ${err.message}`); });
}

loadData();
