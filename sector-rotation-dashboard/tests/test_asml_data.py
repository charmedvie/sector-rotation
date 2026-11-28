import json

import pandas as pd
import pytest

from src.asml_data import REPORTS, asml_financials


def test_asml_uses_published_quarters_and_observation_day_fx():
    days = pd.to_datetime(['2026-10-09', '2026-10-14', '2026-10-23'])
    prices = pd.DataFrame({'Close': [1400.0]*3}, index=days)
    rates = pd.DataFrame({'Close': [1.1, 1.15, 1.2]}, index=days)
    quote = {'date': '2026-10-23', 'sharesOutstanding': 385e6, 'lastClose': 1400}
    q, annual, prior, history, note = asml_financials([], [], quote, prices, rates)
    assert q[0]['revenue'] == pytest.approx(11.662e9)
    assert q[0]['shares'] == 383.5e6
    assert q[0]['gross_margin'] == pytest.approx(57.45, abs=.02)
    assert all('revenue' in row for row in prior.values())
    assert history[1]['asof'] == '2026-07-15'
    assert history[2]['asof'] == '2026-10-14'
    eps = sum(r['eps'] for r in json.loads(REPORTS.read_text())[-1]['quarters'][-4:])
    assert history[-1]['pe'] == pytest.approx(1400 / (eps * 1.2))
    assert quote['trailingPE'] == pytest.approx(history[-1]['pe'])
    assert quote['valuationClose'] == pytest.approx(1400 / 1.2)
    assert quote['lastClose'] == 1400
    assert quote['financialCurrency'] == 'EUR'
    assert history[-1]['price'] == pytest.approx(1400 / 1.2)
    assert history[-1]['eps'] == pytest.approx(eps)
    assert '2026-10-23' in note
