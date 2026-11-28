"""Apply a validated owner request in a checkout before researching and publishing it."""
import argparse
import json
import re
from pathlib import Path

CONFIG = Path(__file__).resolve().parents[1] / 'src' / 'stock_watchlists.json'
TICKER = re.compile(r'[A-Z][A-Z0-9.-]{0,9}')
LIST_IDS = {'Defensive': 340008219, 'Stablish': 353388331, 'Volatile': 353388098}


def apply(config, title, remote=None):
    parts = title.split(' | ')
    if len(parts) < 3 or parts[0] != 'Watchlist' or parts[2] not in LIST_IDS:
        raise ValueError('Unknown watchlist request')
    action, group = parts[1:3]
    lists = config['watchlists']
    members = set(lists[group])
    baseline = config['tradingview_baseline'][group]
    manual = set(config['manual_memberships'].get(group, []))
    if action == 'sync' and len(parts) == 3:
        if not isinstance(remote, dict) or remote.get('id') != LIST_IDS[group] or remote.get('name') != group:
            raise ValueError('TradingView list does not match requested list')
        symbols = remote.get('symbols')
        if not isinstance(symbols, list):
            raise ValueError('TradingView membership unavailable')
        current = {}
        for symbol in symbols:
            if not isinstance(symbol, str):
                raise ValueError('Invalid TradingView symbol')
            if symbol.startswith('###'):  # TradingView section headers
                continue
            exchange, sep, ticker = symbol.partition(':')
            if not sep or not exchange or not TICKER.fullmatch(ticker):
                raise ValueError('Unsupported TradingView equity symbol: '+symbol)
            existing = config['stocks'].get(ticker, {}).get('symbol')
            if (existing and existing != symbol) or (ticker in current and current[ticker] != symbol):
                raise ValueError('Ticker is already associated with a different exchange: '+ticker)
            current[ticker] = symbol
        previously = set(baseline)
        members -= previously.difference(current, manual)
        members.update(set(current) - previously)
        for ticker in members.intersection(current):
            config['stocks'].setdefault(ticker, {'name':ticker, 'symbol':current[ticker]})
        config['tradingview_baseline'][group] = sorted(current)
    elif action in ('add','remove') and len(parts) == 4 and TICKER.fullmatch(parts[3]):
        ticker = parts[3]
        if action == 'add':
            members.add(ticker)
            manual.add(ticker)
            config['stocks'].setdefault(ticker, {'name':ticker})
        else:
            members.discard(ticker)
            manual.discard(ticker)
    else:
        raise ValueError('Invalid watchlist action')
    lists[group] = sorted(members)
    config['manual_memberships'][group] = sorted(manual)
    # Keep company records as searchable research, including after removal.
    return config


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('title')
    parser.add_argument('--tradingview-json',type=Path)
    args = parser.parse_args()
    remote = json.loads(args.tradingview_json.read_text()) if args.tradingview_json else None
    config = apply(json.loads(CONFIG.read_text()), args.title, remote)
    CONFIG.write_text(json.dumps(config, ensure_ascii=False, indent=2)+'\n')
