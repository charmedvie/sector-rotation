"""Fill older US GAAP quarters from consolidated filing facts for reviewed companies."""
from datetime import date, timedelta
from .valuation_data import _records, _adjust

FLOWS = {
    'revenue': ('RevenueFromContractWithCustomerExcludingAssessedTax',),
    'gross_profit': ('GrossProfit',), 'operating_profit': ('OperatingIncomeLoss',),
    'net_income': ('NetIncomeLoss',), 'tax_expense': ('IncomeTaxExpenseBenefit',),
    'eps': ('EarningsPerShareDiluted',), 'shares': ('WeightedAverageNumberOfDilutedSharesOutstanding',),
    'ocf': ('NetCashProvidedByUsedInOperatingActivities',),
    'capex': ('PaymentsToAcquirePropertyPlantAndEquipment','PaymentsToAcquireProductiveAssets'),
    'sbc': ('ShareBasedCompensation',),
}
BALANCES = {'assets':'Assets','equity':'StockholdersEquity','inventory':'InventoryNet',
            'receivables':'AccountsReceivableNetCurrent','cash':'CashAndCashEquivalentsAtCarryingValue'}


def filing_quarters(recent, facts, history, limit=20):
    if not recent or not facts or history is None or 'Stock Splits' not in history:
        return recent
    splits = [(d.date(),float(v)) for d,v in history['Stock Splits'].items() if v>0]
    rows = {r['period']:dict(r) for r in recent}
    latest = max(date.fromisoformat(r['period']) for r in recent if 'revenue' in r)
    cutoff = latest - timedelta(days=limit*93)
    def put(end, field, value):
        if cutoff <= end <= latest:
            rows.setdefault(end.isoformat(), {'period':end.isoformat()}).setdefault(field,value)
    for field,tags in FLOWS.items():
        unit = 'USD/shares' if field=='eps' else 'shares' if field=='shares' else 'USD'
        for tag in tags:
            durations = {}
            for r in _records(facts,(tag,),unit,True):
                if cutoff-timedelta(days=370)<=r[1]<=latest:
                    durations[(r[2],r[1])] = _adjust(r,field,splits)
            for (start,end),amount in durations.items():
                if 75 <= (end-start).days <= 103:
                    put(end,field,amount)
            if field in ('eps','shares'):
                continue  # Weighted-average per-share measures are not additive.
            for (start,end),amount in durations.items():
                previous = [p for (a,p) in durations if a==start and 75<=(end-p).days<=103]
                if len(previous)==1:
                    put(end,field,amount-durations[start,previous[0]])
    for field,tag in BALANCES.items():
        values={r[1]:r[3] for r in _records(facts,(tag,),'USD',False)}
        for end,value in values.items():
            if end.isoformat() in rows:
                put(end,field,value)
    out=sorted((r for r in rows.values() if r.get('revenue',0)>0),key=lambda r:r['period'],reverse=True)[:limit]
    for r in out:
        if 'ocf' in r and 'capex' in r:
            r.setdefault('fcf',r['ocf']-r['capex'])
        for margin,field in [('gross_margin','gross_profit'),('operating_margin','operating_profit'),('net_margin','net_income')]:
            if field in r:r.setdefault(margin,100*r[field]/r['revenue'])
    return out
