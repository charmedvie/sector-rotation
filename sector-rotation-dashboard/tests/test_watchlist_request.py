import json
import pytest
from scripts.watchlist_request import apply, CONFIG, LIST_IDS


def test_sync_preserves_local_changes_and_removes_upstream_deletions():
    data=json.loads(CONFIG.read_text())
    apply(data,'Watchlist | remove | Stablish | AMD')
    for ticker in ('ASML', 'CME', 'CBOE', 'FTNT', 'PANW', 'IBM'):
        apply(data, f'Watchlist | add | Stablish | {ticker}')
    remote={'id':LIST_IDS['Stablish'],'name':'Stablish','symbols':['NASDAQ:AMD','NASDAQ:META','NASDAQ:ZS']}
    apply(data,'Watchlist | sync | Stablish',remote)
    assert {'ASML','CME','CBOE','FTNT','PANW','IBM','META','ZS'} <= set(data['watchlists']['Stablish'])
    assert 'AMD' not in data['watchlists']['Stablish']
    assert 'AAPL' not in data['watchlists']['Stablish']
    assert data['stocks']['ZS']['symbol']=='NASDAQ:ZS'
    assert 'AAPL' in data['stocks'] and 'AAPL' not in data['watchlists']['Defensive']
    before=json.dumps(data)
    apply(data,'Watchlist | sync | Stablish',remote)
    assert json.dumps(data)==before


def test_sync_rejects_missing_or_wrong_source():
    data=json.loads(CONFIG.read_text())
    for remote in [None, {'id':3,'name':'Stablish','symbols':[]},{'id':LIST_IDS['Stablish'],'name':'Stablish','symbols':None}]:
        with pytest.raises(ValueError):
            apply(data,'Watchlist | sync | Stablish',remote)
