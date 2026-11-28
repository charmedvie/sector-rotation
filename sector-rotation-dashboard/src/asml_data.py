"""ASML reports in EUR. Its Nasdaq registered ordinary share trades in USD."""
from bisect import bisect_left, bisect_right
from datetime import date, timedelta
import json
import math
from pathlib import Path

REPORTS = Path(__file__).with_name('asml_reports.json')
RATIOS = {'gross_margin': 'gross_profit', 'operating_margin': 'operating_profit',
          'net_margin': 'net_income', 'pretax_margin': 'pretax'}


def with_ratios(row):
    result = dict(row)
    if row.get('revenue', 0) > 0:
        for k, field in RATIOS.items():
            if field in row:
                result[k] = 100 * row[field] / row['revenue']
    if row.get('assets') and 'equity' in row:
        result['equity_assets'] = 100 * row['equity'] / row['assets']
    return result


def asml_financials(q, annual, quote, history, fx):
    reports = json.loads(REPORTS.read_text())
    rates = {d.date(): float(v) for d, v in fx['Close'].items() if math.isfinite(v) and v > 0}
    dates = sorted(rates)

    def rate_at(day):
        i = bisect_right(dates, day) - 1
        if i >= 0 and (day - dates[i]).days <= 5:
            return dates[i], rates[dates[i]]
        return None, None

    quote_day = date.fromisoformat(quote['date'])
    fx_day, rate = rate_at(quote_day)
    if rate is None:
        raise ValueError('EUR/USD rate missing for the latest Nasdaq close')
    snapshots = {}
    releases = []
    rows = {r['period']: dict(r) for r in q}
    for report in reports:
        released = date.fromisoformat(report['released'])
        if released > quote_day:
            continue
        quarters = report['quarters']
        for row in quarters:
            rows.setdefault(row['period'], {}).update(row)
        period = quarters[-1]['period']
        ttm = {}
        for key, field in [('eps','eps'),('op','operating_profit'),('revenue','revenue'),
                           ('fcf','fcf'),('pretax','pretax'),('tax','tax_expense')]:
            if all(field in row for row in quarters[-4:]):
                ttm[key] = sum(row[field] for row in quarters[-4:])
        snapshots[period] = ttm
        releases.append((released, period, quarters[-1]))
    statement_rows = {p: with_ratios(r) for p, r in rows.items()}
    quarters = [statement_rows[p] for p in sorted(rows, reverse=True) if 'revenue' in rows[p]]
    prior = {p: statement_rows[str(int(p[:4])-1)+p[4:]] for p in rows
             if str(int(p[:4])-1)+p[4:] in statement_rows}

    release_dates = [r[0] for r in releases]
    weekly = {}
    for stamp, price in history['Close'].items():
        if math.isfinite(price) and price > 0:
            day = stamp.date()
            weekly[day.isocalendar()[:2]] = day, float(price)
    observations = []
    for day, price in sorted(weekly.values()):
        i = bisect_left(release_dates, day) - 1
        _, spot = rate_at(day)
        if i < 0 or spot is None:
            continue
        released, period, last = releases[i]
        if (day - date.fromisoformat(period)).days > 180:
            continue
        obs = {'date': day.isoformat(), 'price': price / spot, 'asof': released.isoformat()}
        for key, value in snapshots[period].items():
            obs[key] = value
            obs[key+'_period'] = period
            for years in (1, 3):
                old_period = str(int(period[:4])-years)+period[4:]
                if key in snapshots.get(old_period, {}):
                    name = f'{key}_prior{years}'
                    obs[name] = snapshots[old_period][key]
                    obs[name+'_period'] = old_period
        cap = obs['price'] * last['shares']
        obs.update(market_cap_proxy=cap, shares=last['shares'], shares_period=period,
                   pb=cap/last['equity'], equity=last['equity'], equity_period=period)
        if obs['eps'] > 0:
            obs['pe'] = obs['price'] / obs['eps']
        if obs['fcf'] > 0:
            obs['pfcf'] = cap / obs['fcf']
        if obs['op'] > 0:
            obs['evop'] = (cap + last.get('debt', last['long_term_debt']) - last['cash']) / obs['op']
        observations.append(obs)

    last = quarters[0]
    if not quote.get('sharesOutstanding'):
        raise ValueError('Current ASML outstanding share count unavailable')
    valuation_close = quote['lastClose'] / rate
    cap = valuation_close * quote['sharesOutstanding']
    eps = sum(r['eps'] for r in quarters[:4])
    sales = sum(r['revenue'] for r in quarters[:4])
    debt = last.get('debt', last.get('long_term_debt'))
    ev = cap + debt - last['cash'] if debt is not None and 'cash' in last else None
    ebitda = sum(r['operating_profit']+r['depreciation'] for r in quarters[:4]) if all('depreciation' in r for r in quarters[:4]) else None
    quote.update(financialCurrency='EUR', reportedCurrency='EUR', valuationClose=valuation_close, marketCap=cap,
                 trailingEps=eps, trailingPE=valuation_close/eps if eps>0 else None,
                 priceToBook=cap/last['equity'] if last.get('equity',0)>0 else None,
                 priceToSalesTrailing12Months=cap/sales, enterpriseValue=ev,
                 enterpriseToRevenue=ev/sales if ev else None,
                 enterpriseToEbitda=ev/ebitda if ev and ebitda and ebitda>0 else None)
    note = ('Statements and valuation amounts are in EUR. Nasdaq prices used for valuation '
            f'are converted at the observation-date EUR/USD rate (latest: {rate:.4f} USD per EUR on {fx_day}). '
            'Historical multiples use the last published four quarters and diluted shares as a market-cap proxy. '
            'Historical enterprise value uses disclosed debt, with long-term debt as the fallback. '
            'Statement dates are calendar-quarter labels.')
    return quarters, [with_ratios(r) for r in annual if 'revenue' in r], prior, observations, note
