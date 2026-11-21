"""Fetch adjusted daily ETF closes and write weekly sector RRG JSON.

Command: python -m src.generate_data --output site/data/rotation.json
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

import pandas as pd

from src.rrg_math import absolute_snapshot, build_dataset, week_closes

SECTORS = {
    'XLK': 'Technology',
    'XLF': 'Financials',
    'XLY': 'Consumer Discretionary',
    'XLC': 'Communication Services',
    'XLI': 'Industrials',
    'XLV': 'Health Care',
    'XLP': 'Consumer Staples',
    'XLE': 'Energy',
    'XLB': 'Materials',
    'XLU': 'Utilities',
    'XLRE': 'Real Estate',
}
BENCHMARKS = ['SPY', 'RSP', 'QQQ']


def fetch_daily() -> pd.DataFrame:
    import yfinance as yf

    tickers = list(SECTORS) + BENCHMARKS
    prices = yf.download(
        tickers=tickers,
        period='5y',
        interval='1d',
        auto_adjust=True,
        actions=False,
        repair=True,
        progress=False,
        threads=False,
        timeout=25,
        group_by='column',
    )
    if prices is None or prices.empty:
        raise RuntimeError('yfinance returned no prices; aborting deployment')
    if isinstance(prices.columns, pd.MultiIndex):
        if 'Close' not in prices.columns.get_level_values(0):
            raise RuntimeError('yfinance output has no Close prices')
        closes = prices['Close'].copy()
    else:
        raise RuntimeError('Expected multiple ticker columns from yfinance')
    closes.index = pd.to_datetime(closes.index).tz_localize(None)
    missing = [ticker for ticker in tickers if ticker not in closes.columns]
    if missing:
        raise RuntimeError(f'Data fetch missing ETF(s): {missing}')
    for ticker in tickers:
        if closes[ticker].count() < 125:
            raise RuntimeError(f'Not enough daily data for {ticker}')
        # Reject a clearly stale ETF rather than silently publishing old signals.
        latest = closes[ticker].last_valid_index()
        if latest is None or (pd.Timestamp.now().normalize() - latest).days > 9:
            raise RuntimeError(f'Stale quote series for {ticker}: {latest}')
    return closes[tickers]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument('--output', default='site/data/rotation.json')
    args = parser.parse_args()
    daily = fetch_daily()
    weekly = week_closes(daily)
    payload = build_dataset(weekly, SECTORS, BENCHMARKS, history_weeks=130)
    payload['absolute'] = absolute_snapshot(weekly, daily, list(SECTORS) + BENCHMARKS, payload['as_of'])
    target = Path(args.output)
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(payload, separators=(',', ':')), encoding='utf-8')
    print(f'Wrote {len(payload["dates"])} weekly observations to {target}; as of {payload["as_of"]}')


if __name__ == '__main__':
    main()
