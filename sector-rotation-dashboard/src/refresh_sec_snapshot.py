"""Refresh the deploy fallback with a contactable SEC_CONTACT and SEC Company Facts."""
from datetime import date, timedelta
import gzip
import json
import os
from pathlib import Path
import time

from .stock_data import PEERS, PILOTS, QUALITY_TAGS, SEC_SNAPSHOT, SEC_TAGS, sec_facts, sec_ticker_ciks
from .valuation_data import BAL_TAGS, FLOW_TAGS

COMPARATIVE_TAGS = (
    'CashAndCashEquivalentsAtCarryingValue', 'InventoryNet', 'AccountsReceivableNetCurrent',
    'ReceivablesNetCurrent', 'Assets', 'CommonStockholdersEquity',
    'LongTermDebtAndFinanceLeaseObligationsCurrent', 'LongTermDebtAndCapitalLeaseObligations',
    'EntityCommonStockSharesOutstanding',
)
TAGS = set(COMPARATIVE_TAGS).union(*(tags for group in (SEC_TAGS, QUALITY_TAGS, BAL_TAGS, FLOW_TAGS) for tags in group.values()))


def save_snapshot(facts, cik, retrieved):
    cutoff = (retrieved - timedelta(days=365 * 15)).isoformat()
    end = retrieved.isoformat()
    selected = {}
    for tag in sorted(TAGS & facts.keys()):
        units = {}
        for unit in ('USD', 'USD/shares', 'shares'):
            rows = [
                {key: row[key] for key in ('start', 'end', 'filed', 'form', 'accn', 'val') if key in row}
                for row in facts[tag].get('units', {}).get(unit, [])
                if cutoff <= row.get('filed', '') <= end
                and row.get('form') in ('10-K', '10-Q', '10-K/A', '10-Q/A')
            ]
            if rows:
                units[unit] = rows
        if units:
            selected[tag] = {'units': units}
    if selected:
        content = json.dumps(selected, separators=(',', ':')).encode()
        (SEC_SNAPSHOT / f'CIK{cik:010d}.json.gz').write_bytes(gzip.compress(content, mtime=0))
    return len(selected)


def refresh():
    if not os.environ.get('SEC_CONTACT'):
        raise SystemExit('Set SEC_CONTACT to a contactable email address.')
    watchlist = Path(__file__).with_name('stock_watchlists.json')
    symbols = set(json.loads(watchlist.read_text())['stocks']) | set(PILOTS) | set(PEERS)
    registry = sec_ticker_ciks()
    ciks = {symbol: registry[symbol] for symbol in sorted(symbols) if symbol in registry}
    SEC_SNAPSHOT.mkdir(exist_ok=True)
    retrieved = date.today()
    for cik in sorted(set(ciks.values())):
        time.sleep(0.3)
        tags = save_snapshot(sec_facts('', cik), cik, retrieved)
        print(f'{cik:010d}: {tags} filing concepts')
    write_manifest(ciks, retrieved)


def write_manifest(ciks, retrieved):
    manifest = {
        'retrieved': retrieved.isoformat(),
        'source': 'https://data.sec.gov/api/xbrl/companyfacts/',
        'ciks': ciks,
    }
    (SEC_SNAPSHOT / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')


if __name__ == '__main__':
    refresh()
