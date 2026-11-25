"""Historical valuation using filing-date information and split-adjusted closing prices.
Interim TTM EPS is an annual + current YTD - comparable prior YTD proxy.
No dividend adjustment, earnings forecasts, or forward filling across missing filing periods.
"""
from datetime import date, timedelta
from bisect import bisect_right
import math
import pandas as pd

FLOW_TAGS = {
    'eps': ('EarningsPerShareDiluted',),
    'op': ('OperatingIncomeLoss',),
    'revenue': ('RevenueFromContractWithCustomerExcludingAssessedTax','Revenues','SalesRevenueNet'),
    'ocf': ('NetCashProvidedByUsedInOperatingActivities',),
    'capex': ('PaymentsToAcquirePropertyPlantAndEquipment','PaymentsToAcquireProductiveAssets'),
}
BAL_TAGS = {'equity': ('StockholdersEquity',), 'shares': ('CommonStockSharesOutstanding',)}
SINGLE_CLASS = {'AMZN','NVDA','KTOS','OKLO'}

def _day(x):
    return date.fromisoformat(str(x)[:10])

def _finite(x):
    return isinstance(x, (int,float)) and math.isfinite(x)

def _records(facts, tags, unit, flow):
    out=[]
    for tag in tags:
        tagged=[]
        for r in facts.get(tag,{}).get('units',{}).get(unit,[]):
            if r.get('form') not in ('10-K','10-Q','10-K/A','10-Q/A') or not r.get('filed') or not r.get('end') or not _finite(r.get('val')):
                continue
            if flow and not r.get('start'): continue
            if not flow and r.get('start'): continue
            try:
                end, filed = _day(r['end']), _day(r['filed'])
                start = _day(r['start']) if flow else None
            except ValueError:
                continue
            if filed < end: continue
            tagged.append((filed,end,start,float(r['val']),r.get('accn',''),r['form']))
        # Use a single consistent taxonomy concept, not a mixture of scopes.
        if tagged:
            out=tagged
            break
    return sorted(out,key=lambda r:(r[0],r[1]))

def _split_factor(filed, splits):
    # Statements filed after an effective split generally already report on the new basis.
    return math.prod(v for d,v in splits if d>filed and v>0)

def _adjust(r, key, splits):
    factor=_split_factor(r[0],splits)
    return r[3]/factor if key=='eps' else r[3]*factor if key=='shares' else r[3]

def _duration(r):
    return (r[1]-r[2]).days if r[2] else 0

def _snapshot(records, asof, key, splits):
    known=[r for r in records if r[0]<=asof]
    if not known: return None,None
    # Most recent period known, not a prior-year comparative repeated in a new filing.
    end=max(r[1] for r in known)
    rows=[r for r in known if r[1]==end]
    if key in BAL_TAGS:
        r=max(rows,key=lambda r:r[0])
        return _adjust(r,key,splits),end
    annual=[r for r in rows if 340<=_duration(r)<=385]
    if annual:
        r=max(annual,key=lambda r:r[0])
        return _adjust(r,key,splits),end
    # Prefer four actual reported quarters where available (no fiscal Q4 estimates).
    quarters={}
    for r in known:
        if 70<=_duration(r)<=105:
            if r[1] not in quarters or r[0]>=quarters[r[1]][0]: quarters[r[1]]=r
    ends=sorted(quarters,reverse=True)[:4]
    if len(ends)==4 and ends[0]==end and all(70<=(a-b).days<=105 for a,b in zip(ends,ends[1:])):
        return sum(_adjust(quarters[e],key,splits) for e in ends),end
    # Annual plus YTD change, additive for cash flow and operating income;
    # for EPS this is a proxy (weighted average share counts can change).
    interim=[r for r in rows if 70<=_duration(r)<=295]
    if not interim: return None,end
    current=max(interim,key=lambda r:(_duration(r),r[0]))
    fy=[r for r in known if 340<=_duration(r)<=385 and 0<=(current[2]-r[1]).days<=8]
    if not fy: return None,end
    full=max(fy,key=lambda r:r[0])
    comparables=[r for r in known if r[4]==current[4] and r[1]<end and 345<=(end-r[1]).days<=385 and abs(_duration(r)-_duration(current))<=10]
    if not comparables:
        # Older published comparative of the same concept and duration, known as of this date.
        comparables=[r for r in known if r[1]<end and 345<=(end-r[1]).days<=385 and abs(_duration(r)-_duration(current))<=10]
    if not comparables: return None,end
    prior=max(comparables,key=lambda r:r[0])
    return _adjust(full,key,splits)+_adjust(current,key,splits)-_adjust(prior,key,splits),end

def historical_valuation(symbol,facts,history):
    if not facts or history is None or history.empty or 'Close' not in history: return []
    records={k:_records(facts,t,'USD/shares' if k=='eps' else 'USD',True) for k,t in FLOW_TAGS.items()}
    if symbol in SINGLE_CLASS:
        records.update({k:_records(facts,t,'shares' if k=='shares' else 'USD',False) for k,t in BAL_TAGS.items()})
        # Cover-page counts are separately tagged and often dated after fiscal period-end.
        # Only use undimensioned companyfacts for single-class issuers.
        records['shares']+=_records(facts,('EntityCommonStockSharesOutstanding',),'shares',False)
        records['shares'].sort(key=lambda r:(r[0],r[1]))
    splits=[(_day(d),float(v)) for d,v in history.get('Stock Splits',pd.Series(dtype=float)).items() if _finite(v) and v>0]
    dates=sorted({r[0] for rec in records.values() for r in rec})
    snapshots=[]
    for asof in dates:
        vals={k:_snapshot(rec,asof,k,splits) for k,rec in records.items()}
        snapshots.append(vals)
    # Last valid trading close of each ISO week, including latest close.
    weekly={}
    for d,v in history['Close'].items():
        if _finite(v) and v>0:
            day=_day(d)
            weekly[day.isocalendar()[:2]]=(day,float(v))
    result=[]
    for day,close in sorted(weekly.values()):
        pos=bisect_right(dates,day-timedelta(days=1))-1
        r={'date':day.isoformat(),'price':close}
        if pos>=0:
            vals=snapshots[pos]
            r['asof']=dates[pos].isoformat()
            def val(k):
                v,e=vals.get(k,(None,None))
                return v if e and (day-e).days<=180 and _finite(v) else None
            eps,op=val('eps'),val('op')
            for k in ('eps','op','revenue','ocf','capex','equity','shares'):
                v=val(k)
                if v is not None:
                    r[k]=v
                    r[k+'_period']=vals[k][1].isoformat()
            if eps is not None and eps>0:
                r['pe']=close/eps
            equity,shares,ocf,capex=map(val,('equity','shares','ocf','capex'))
            eq_end,sh_end=vals.get('equity',(None,None))[1],vals.get('shares',(None,None))[1]
            ocf_end,capex_end=vals.get('ocf',(None,None))[1],vals.get('capex',(None,None))[1]
            if ocf is not None and capex is not None and ocf_end==capex_end:
                r['fcf']=ocf-capex
                r['fcf_period']=ocf_end.isoformat()
            # Same or nearby disclosed counts are valid approximations, not exact daily market cap.
            # Both facts must have been filed before the price observation.
            if shares is not None and shares>0 and sh_end:
                r['market_cap_proxy']=close*shares
                if equity is not None and equity>0 and eq_end and abs((eq_end-sh_end).days)<=60:
                    r['pb']=close*shares/equity
                if r.get('fcf',0)>0 and ocf_end and abs((ocf_end-sh_end).days)<=60:
                    r['pfcf']=close*shares/r['fcf']
        result.append(r)
    return result
