import numpy as np
import pandas as pd
import pytest

from src.rrg_math import PRESETS, absolute_snapshot, build_dataset, relative_rotation, week_closes


def test_constant_relative_price_is_centered():
    ix = pd.date_range('2020-01-03', periods=70, freq='W-FRI')
    base = pd.Series(np.linspace(100, 210, 70), index=ix)
    values = relative_rotation(base * 1.5, base)
    assert values.iloc[-1]['ratio'] == pytest.approx(100.0)
    assert values.iloc[-1]['momentum'] == pytest.approx(100.0)


def test_rising_relative_price_is_leading():
    ix = pd.date_range('2020-01-03', periods=80, freq='W-FRI')
    base = pd.Series(100.0, index=ix)
    rising = pd.Series(100.0 * np.exp(np.arange(80) * 0.01), index=ix)
    values = relative_rotation(rising, base)
    assert values.iloc[-1]['ratio'] > 100.0
    assert values.iloc[-1]['momentum'] > 100.0


def test_weekly_close_uses_actual_last_trading_date():
    ix = pd.to_datetime(['2026-11-16', '2026-11-17', '2026-11-18'])
    prices = pd.DataFrame({'XLK': [100, 101, 102]}, index=ix)
    weekly = week_closes(prices)
    assert weekly.index[-1] == pd.Timestamp('2026-11-18')
    assert weekly.iloc[-1]['XLK'] == 102


def test_complete_dataset_has_common_dates():
    ix = pd.date_range('2020-01-03', periods=78, freq='W-FRI')
    wave = np.arange(len(ix))
    prices = pd.DataFrame({
        'XLK': 100.0 * np.exp(0.003 * wave + np.sin(wave / 9.0) * 0.06),
        'SPY': 100.0 * np.exp(0.002 * wave),
        'RSP': 100.0 * np.exp(0.001 * wave),
        'QQQ': 100.0 * np.exp(0.004 * wave),
    }, index=ix)
    data = build_dataset(prices, {'XLK': 'Technology'}, ['SPY', 'RSP', 'QQQ'])
    assert len(data['dates']) > 24
    assert len(data['dates']) == len(data['benchmarks']['SPY']['XLK']['ratio'])
    assert data['as_of'] == data['dates'][-1]
    assert all(90 < r < 110 for r in data['benchmarks']['SPY']['XLK']['ratio'])


def test_rejects_missing_symbols():
    ix = pd.date_range('2020-01-03', periods=60, freq='W-FRI')
    with pytest.raises(ValueError, match='Missing symbols'):
        build_dataset(pd.DataFrame({'XLK': 1.0}, index=ix), {'XLK': 'Technology'}, ['SPY'])


def test_presets_preserve_high_and_share_observation_dates():
    ix = pd.date_range('2020-01-03', periods=150, freq='W-FRI')
    t = np.arange(len(ix))
    prices = pd.DataFrame({'XLK': 100*np.exp(.003*t+.06*np.sin(t/6)), 'SPY': 100*np.exp(.002*t)}, index=ix)
    data = build_dataset(prices, {'XLK': 'Technology'}, ['SPY'])
    assert set(data['sensitivities']) == set(PRESETS)
    expected = relative_rotation(prices['XLK'], prices['SPY']).loc[pd.to_datetime(data['dates'])]
    assert data['benchmarks'] == data['sensitivities']['high']
    assert data['sensitivities']['high']['SPY']['XLK']['ratio'] == pytest.approx(expected.ratio.tolist(), abs=5.1e-6)
    assert data['sensitivities']['high']['SPY']['XLK']['momentum'] == pytest.approx(expected.momentum.tolist(), abs=5.1e-6)
    for mode in PRESETS:
        series = data['sensitivities'][mode]['SPY']['XLK']
        assert len(series['ratio']) == len(series['momentum']) == len(data['dates'])
        assert np.isfinite(series['ratio']).all() and np.isfinite(series['momentum']).all()
    assert data['sensitivities']['low']['SPY']['XLK']['ratio'] != data['sensitivities']['high']['SPY']['XLK']['ratio']


def test_all_presets_center_constant_relative_prices():
    ix = pd.date_range('2020-01-03', periods=100, freq='W-FRI')
    base = pd.Series(np.linspace(100, 200, len(ix)), index=ix)
    for smoothing, trend, momentum in PRESETS.values():
        result = relative_rotation(base*1.5, base, trend, momentum, smoothing).dropna()
        assert len(result) > 0
        assert np.allclose(result.to_numpy(), 100.0)


def test_absolute_snapshot_uses_adjusted_returns_and_daily_emas():
    ix = pd.bdate_range('2024-01-01', periods=300)
    daily = pd.DataFrame({'XLK': np.arange(300, dtype=float)+100}, index=ix)
    date = ix[-2]  # Ensure future observations are excluded.
    weekly = week_closes(daily.loc[:date])
    out = absolute_snapshot(weekly, daily, ['XLK'], str(date.date()))['XLK']
    for n in (1,4,12):
        w = weekly['XLK']
        assert out[f'return_{n}w'] == pytest.approx(100*(w.iloc[-1]/w.iloc[-1-n]-1), abs=5.1e-6)
    for n in (50,200):
        d = daily['XLK'].loc[:date]
        expected = 100*(d.iloc[-1]/d.ewm(span=n, adjust=False).mean().iloc[-1]-1)
        assert out[f'ema_{n}d_pct'] == pytest.approx(expected, abs=5.1e-6)
    assert absolute_snapshot(weekly, None, ['XLK'], str(date.date()))['XLK']['ema_50d_pct'] is None
