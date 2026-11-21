"""Transparent RRG-style relative-strength calculations (not proprietary JdK)."""
from __future__ import annotations

import pandas as pd


def relative_rotation(
    asset: pd.Series,
    benchmark: pd.Series,
    trend_span: int = 20,
    momentum_span: int = 4,
) -> pd.DataFrame:
    """Return weekly RS-Ratio and RS-Momentum, both centered at 100.

    Relative price = adjusted_asset_close / adjusted_benchmark_close
    RS-Ratio = 100 * relative_price / EMA(relative_price, trend_span)
    RS-Momentum = 100 * RS-Ratio / EMA(RS-Ratio, momentum_span)

    EMA initialization needs a full warm-up window; non-positive closes are excluded.
    Neither metric is JdK's proprietary formula.
    """
    if trend_span < 2 or momentum_span < 2:
        raise ValueError("EMA spans must each be >= 2")
    values = pd.concat([asset.rename('asset'), benchmark.rename('benchmark')], axis=1)
    values = values.apply(pd.to_numeric, errors='coerce')
    values = values.where(values.gt(0))
    relative_price = values['asset'] / values['benchmark']
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

    all_metrics: dict[str, dict[str, pd.DataFrame]] = {}
    for benchmark in benchmarks:
        all_metrics[benchmark] = {}
        for sector in sector_names:
            all_metrics[benchmark][sector] = relative_rotation(
                weekly_prices[sector], weekly_prices[benchmark]
            )

    # A shared date index keeps all benchmark/sector paths aligned in the UI.
    valid = pd.Series(True, index=weekly_prices.index)
    for metrics in all_metrics.values():
        for frame in metrics.values():
            valid &= frame['ratio'].notna() & frame['momentum'].notna()
    valid_dates = weekly_prices.index[valid]
    valid_dates = valid_dates[-history_weeks:]
    if len(valid_dates) < 24:
        raise ValueError(f'Insufficient valid weeks across all symbols: {len(valid_dates)}')

    data = {'dates': [dt.strftime('%Y-%m-%d') for dt in valid_dates], 'benchmarks': {}}
    for bench, metrics in all_metrics.items():
        data['benchmarks'][bench] = {
            ticker: {
                'ratio': [round(float(n), 5) for n in frame.loc[valid_dates, 'ratio']],
                'momentum': [round(float(n), 5) for n in frame.loc[valid_dates, 'momentum']],
            }
            for ticker, frame in metrics.items()
        }
    data.update({
        'schema_version': 1,
        'is_demo': demo,
        'source': 'Synthetic illustration (not market prices)' if demo else 'Yahoo Finance adjusted daily closing prices via yfinance',
        'as_of': data['dates'][-1],
        'formula': {
            'x': '100 × (sector / benchmark) ÷ EMA_20(sector / benchmark)',
            'y': '100 × RS_Ratio ÷ EMA_4(RS_Ratio)',
            'note': 'RRG-style approximation, not proprietary JdK RS-Ratio/RS-Momentum',
            'frequency': 'Weekly, last available trading session of each week',
        },
        'sectors': [{'ticker': ticker, 'name': name} for ticker, name in sector_names.items()],
        'benchmark_names': {'SPY': 'S&P 500', 'RSP': 'Equal-weight S&P 500', 'QQQ': 'Nasdaq-100'},
    })
    return data
