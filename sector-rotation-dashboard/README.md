# Sector Rotation Lab

A personal, free, public, interactive **RRG-style sector rotation dashboard**. The chart shows 11 US SPDR sector ETFs relative to a chosen benchmark (SPY, RSP, or QQQ) with selectable 8–20-week historical trails, a ticker/full-name label selector, distinct sector colors, quadrant counts, recent crossings, and a sortable strength table.

**Free architecture:** static HTML/CSS/JS + Plotly.js CDN, Yahoo Finance historical data accessed by Python/yfinance, and GitHub Pages + scheduled GitHub Actions. No paid account, API key, app server, or database.

## Quick deploy (GitHub Pages)

1. Create a **public** GitHub repository named `sector-rotation` (or any name).
2. Upload **all files and folders** from this project to the repository's `main` branch. If using Git:
   ```bash
   git init
   git add .
   git commit -m "Launch sector rotation dashboard"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/sector-rotation.git
   git push -u origin main
   ```
3. Go to **Repository → Settings → Pages → Build and deployment** and set **Source = GitHub Actions**.
4. Go to **Actions → Refresh data and deploy RRG → Run workflow** if no run started automatically. The build runs tests, downloads historical prices, writes live JSON, then publishes the site.
5. When the workflow succeeds, browse `https://YOUR_USERNAME.github.io/sector-rotation/` (replace both segments to match your repository).

GitHub Actions updates **Monday–Friday 23:17 UTC**, after US close. Scheduled jobs can run late or be paused on inactive repositories. You can always manually trigger the workflow. If Yahoo Finance refuses/rate-limits requests, the deployment fails rather than displaying the bundled synthetic data as real quotes.

## Data warning

- The included `site/data/rotation.json` is **synthetic demo data** for a local preview. It is replaced by real adjusted closes during every successful deployment.
- Price history is fetched with `yfinance`, an unofficial Yahoo Finance interface intended for personal research. Availability, corporate-action adjustment, and redistribution rights are not guaranteed; review data licenses before publishing or sharing widely.
- This project uses a **custom transparent approximation**, not the proprietary JdK calculation. Interpret the chart's quadrants as a relative-trend visualization, not a trading signal or money-flow measurement.

## Relative-strength formula

Weekly adjusted closing prices are used. Weeks end on Friday, but the date displayed is always the last **actual trading session** of the week, never a future Friday.

```
RS = EMA(sector adjusted close / benchmark adjusted close, smoothing weeks)
RS Ratio = 100 × RS / EMA(RS, trend weeks)
RS Momentum = 100 × RS Ratio / EMA(RS Ratio, momentum weeks)
```

Sensitivity presets (all in weeks):

| Preset | Relative-price smoothing | Trend EMA | Momentum EMA |
|---|---:|---:|---:|
| Low | 10 | 30 | 10 |
| Medium (default) | 5 | 20 | 6 |
| High (original) | None | 20 | 4 |

All presets share the same observation dates and are computed from the same underlying prices at deployment. Switching presets updates the graph and standings without network requests. Smoothing is intended to reduce short-term noise but does not guarantee smaller metric values or later quadrant crossings. These are experimental presets, not calibrated JdK formulas.

Quadrants:

- **Leading**: ratio ≥100, momentum ≥100
- **Weakening**: ratio ≥100, momentum <100
- **Lagging**: ratio <100, momentum <100
- **Improving**: ratio <100, momentum ≥100

Trend and momentum use two different normalizations so scales differ between axes. Unlike total-return sector ranking, these metrics describe *relative* trend and its momentum against the selected benchmark.

## Trading context in the standings

- Direction and speed describe the latest weekly displacement in RS-ratio and RS-momentum coordinates. Speed is Euclidean distance in raw metric points, classified as Crawl (at or below the 33rd percentile), Walk (above the 33rd and at or below the 67th percentile), or Run (above the 67th percentile) against the preceding 52 weekly movements pooled across the full sector universe, separately for the active benchmark and sensitivity. The latest move is excluded from calibration; filtering visible sectors does not change the thresholds. Hover for raw speed. A Run is neither inherently bullish nor bearish. Hover on the quadrant for RS ratio, RS momentum and weekly ratio change.
- Absolute returns (1/4/12 weeks) use adjusted closes, not the selected benchmark.
- Daily 50/200 EMA distance is the percentage above or below the respective EMA, using daily adjusted closing prices through the displayed observation date. Unavailable data is shown as a dash.
- Agreement counts how many of the three sensitivity presets share the selected preset's quadrant. Hover to see each preset's quadrant. Agreement is not a probability or a trade signal.

## Stock watchlists

The universe selector includes an imported snapshot of four TradingView watchlists in src/watchlists.json. It is public, not a live connection to TradingView. Update this configuration to resync the lists. Stock data is refreshed with the same daily workflow. Own sector ETF uses individually assigned US sector proxies (not official GICS classifications, especially for foreign ADRs and diversified businesses). Hover on a stock for its benchmark. Unavailable symbols and insufficient preset warm-up history are listed separately; no stock data is fabricated. The sector view remains independent of optional stock fetch failures.

## Local preview

```bash
python -m http.server 8000 --directory site
# http://localhost:8000
```

The bundled preview is **demo data** in the original High mode. Run `python -m src.make_demo` to generate all three presets with synthetic data, or use the Python generator with network connectivity for actual data:

```bash
python -m pip install -r requirements.txt
python -m pytest -q
python -m src.generate_data --output site/data/rotation.json
```

## Customization

- Universe and benchmark tickers: `src/generate_data.py`
- Normalizations and EMA spans: `src/rrg_math.py`
- Design, filters and controls: `site/index.html`, `site/styles.css`, `site/app.js`
- Schedule: `.github/workflows/deploy.yml`
- Plotly is loaded from `https://cdn.plot.ly/plotly-3.3.1.min.js` (version-pinned).

No affiliation with RRG Research, JdK, Yahoo Finance, State Street, or Plotly.
