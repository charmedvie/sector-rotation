"""Transparent RRG-style relative-strength calculations (not proprietary JdK)."""
from __future__ import annotations

import pandas as pd

# (relative price smoothing, trend reference, momentum reference), in weeks.
PRESETS = {'low': (10, 30, 10), 'medium': (5, 20, 6), 'high': (1, 20, 4)}


def relative_rotation(
    asset: pd.Series,
    benchmark: pd.Series,
    trend_span: int = 20,
    momentum_span: int = 4,
    smoothing_span: int = 1,
) -> pd.DataFrame:
    """Return weekly RS-Ratio and RS-Momentum, both centered at 100.

    Relative price = EMA(adjusted_asset_close / adjusted_benchmark_close, smoothing_span)
    A smoothing span of 1 preserves the original unsmoothed calculation.
    RS-Ratio = 100 * relative_price / EMA(relative_price, trend_span)
    RS-Momentum = 100 * RS-Ratio / EMA(RS-Ratio, momentum_span)

    EMA initialization needs a full warm-up window; non-positive closes are excluded.
    Neither metric is JdK's proprietary formula.
    """
    if trend_span < 2 or momentum_span < 2:
        raise ValueError("EMA spans must each be >= 2")
    if smoothing_span < 1:
        raise ValueError('Smoothing span must be >= 1')
    values = pd.concat([asset.rename('asset'), benchmark.rename('benchmark')], axis=1)
    values = values.apply(pd.to_numeric, errors='coerce')
    values = values.where(values.gt(0))
    relative_price = values['asset'] / values['benchmark']
    if smoothing_span > 1:
        relative_price = relative_price.ewm(span=smoothing_span, adjust=False, min_periods=smoothing_span).mean()
    trend = relative_price.ewm(span=trend_span, adjust=False, min_periods=trend_span).mean()
    ratio = 100.0 * relative_price / trend
    momentum_trend = ratio.ewm(span=momentum_span, adjust=False, min_periods=momentum_span).mean()
    momentum = 100.0 * ratio / momentum_trend
    return pd.DataFrame({'ratio': ratio, 'momentum': momentum}).replace([float('inf'), -float('inf')], float('nan'))


def week_closes(prices: pd.DataFrame) -> pd.DataFrame:
    """Select last available trading day per Fri-ending week, no future dates."""
    if not isinstance(prices.index, pd.DatetimeIndex):
        raise TypeError('Prices need a DatetimeIndex')
    clean = prices.sort_index().copy()
    clean.index = clean.index.tz_localize(None) if clean.index.tz is not None else clean.index
    clean = clean[~clean.index.duplicated(keep='last')]
    clean = clean.dropna(how='all')
    if clean.empty:
        raise ValueError('No prices available')
    clean = clean.ffill(limit=3)
    # Group by weeks ending on Friday, and retain the actual date of the last quote.
    groups = clean.groupby(clean.index.to_period('W-FRI'))
    weekly = groups.last()
    weekly.index = pd.DatetimeIndex(groups.apply(lambda frame: frame.index[-1]).tolist())
    weekly.index.name = 'date'
    return weekly


def build_dataset(
    weekly_prices: pd.DataFrame,
    sector_names: dict[str, str],
    benchmarks: list[str],
    *,
    history_weeks: int = 104,
    demo: bool = False,
) -> dict:
    """Create consistent, complete weekly JSON series for all sectors/benchmarks."""
    required = list(sector_names) + list(benchmarks)
    missing = [ticker for ticker in required if ticker not in weekly_prices.columns]
    if missing:
        raise ValueError(f'Missing symbols: {missing}')
    if len(weekly_prices) < 32:
        raise ValueError('Need at least 32 weekly observations')

    # Precompute all sensitivities from the same full price history.
    all_metrics = {}
    valid = pd.Series(True, index=weekly_prices.index)
    for preset, (smoothing, trend, momentum) in PRESETS.items():
        all_metrics[preset] = {}
        for benchmark in benchmarks:
            all_metrics[preset][benchmark] = {}
            for sector in sector_names:
                frame = relative_rotation(
                    weekly_prices[sector], weekly_prices[benchmark],
                    trend_span=trend, momentum_span=momentum, smoothing_span=smoothing,
                )
                all_metrics[preset][benchmark][sector] = frame
                valid &= frame['ratio'].notna() & frame['momentum'].notna()

    valid_dates = weekly_prices.index[valid][-history_weeks:]
    if len(valid_dates) < 24:
        raise ValueError(f'Insufficient valid weeks across all sensitivity modes: {len(valid_dates)}')

    data = {'dates': [dt.strftime('%Y-%m-%d') for dt in valid_dates], 'sensitivities': {}}
    for preset, benchmarks_data in all_metrics.items():
        data['sensitivities'][preset] = {
            bench: {
                ticker: {
                    'ratio': [round(float(n), 5) for n in frame.loc[valid_dates, 'ratio']],
                    'momentum': [round(float(n), 5) for n in frame.loc[valid_dates, 'momentum']],
                }
                for ticker, frame in metrics.items()
            }
            for bench, metrics in benchmarks_data.items()
        }
    # Preserve the original schema's benchmark path as the High reference.
    data['benchmarks'] = data['sensitivities']['high']
    data['preset_parameters'] = {
        name: {'smoothing': spans[0], 'trend': spans[1], 'momentum': spans[2]}
        for name, spans in PRESETS.items()
    }
    data.update({
        'schema_version': 2,
        'is_demo': demo,
        'source': 'Synthetic illustration (not market prices)' if demo else 'Yahoo Finance adjusted daily closing prices via yfinance',
        'as_of': data['dates'][-1],
        'formula': {
            'x': '100 × smoothed relative price ÷ EMA_trend(smoothed relative price)',
            'y': '100 × RS_Ratio ÷ EMA_momentum(RS_Ratio)',
            'note': 'RRG-style approximation, not proprietary JdK RS-Ratio/RS-Momentum',
            'frequency': 'Weekly, last available trading session of each week',
        },
        'sectors': [{'ticker': ticker, 'name': name} for ticker, name in sector_names.items()],
        'benchmark_names': {'SPY': 'S&P 500', 'RSP': 'Equal-weight S&P 500', 'QQQ': 'Nasdaq-100'},
    })
    return data


def absolute_snapshot(weekly_prices: pd.DataFrame, daily_prices: pd.DataFrame | None,
                      tickers: list[str], as_of: str) -> dict:
    """Adjusted-close returns and daily EMA distances at the displayed observation."""
    date = pd.Timestamp(as_of)
    weekly = weekly_prices.loc[:date]
    result = {}
    def finite(value):
        return round(float(value), 5) if pd.notna(value) and abs(value) != float('inf') else None

    for ticker in tickers:
        w = weekly[ticker]
        row = {}
        for n in (1, 4, 12):
            row[f'return_{n}w'] = finite(100 * (w.iloc[-1] / w.iloc[-1-n] - 1)) if len(w) > n and w.iloc[-1-n] > 0 else None
        for n in (50, 200):
            row[f'ema_{n}d_pct'] = None
        if daily_prices is not None:
            daily = daily_prices[ticker].sort_index().loc[:date].dropna()
            if len(daily) and daily.index[-1].normalize() == date:
                for n in (50, 200):
                    avg = daily.ewm(span=n, adjust=False, min_periods=n).mean().iloc[-1]
                    if pd.notna(avg) and avg > 0:
                        row[f'ema_{n}d_pct'] = finite(100 * (daily.iloc[-1] / avg - 1))
        result[ticker] = row
    return result


def build_stock_rotation(core_daily, stock_daily, stocks, benchmarks, dates):
    """Compute optional stocks on the sector date grid with nulls before warm-up.
    Stale or absent quotes are never filled with synthetic prices.
    """
    grid = pd.DatetimeIndex(pd.to_datetime(dates))
    as_of = grid[-1]
    core = week_closes(core_daily)
    output = {p: {b: {} for b in [*benchmarks, 'sector']} for p in PRESETS}
    absolute = {}
    for ticker, info in stocks.items():
        if ticker not in stock_daily:
            continue
        daily = stock_daily[ticker].dropna().sort_index()
        daily = daily.loc[:as_of]
        daily = daily[daily > 0]
        if daily.empty or daily.index[-1].normalize() != as_of:
            continue
        # Map observations to actual benchmark trading dates. Missing weeks stay missing.
        last = daily.groupby(daily.index.to_period('W-FRI')).last()
        w = pd.Series(last.reindex(core.index.to_period('W-FRI')).to_numpy(), index=core.index)
        # Do not allow EMA forward-fill behavior to produce values before IPO or during gaps.
        valid = w.notna()
        absolute.update(absolute_snapshot(w.to_frame(ticker), daily.to_frame(ticker), [ticker], dates[-1]))
        for mode, (smooth, trend, momentum) in PRESETS.items():
            for key in [*benchmarks, 'sector']:
                bench = info.get('sector') if key == 'sector' else key
                if bench not in core.columns:
                    continue
                frame = relative_rotation(w, core[bench], trend, momentum, smooth)
                frame = frame.where(valid, axis=0).reindex(grid)
                def encode(series):
                    return [round(float(v),5) if pd.notna(v) else None for v in series]
                output[mode][key][ticker] = {'ratio': encode(frame.ratio), 'momentum': encode(frame.momentum)}
    return output, absolute
