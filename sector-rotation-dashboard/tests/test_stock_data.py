import pandas as pd
from src.stock_data import extract, number
def test_extract_and_missing():
    d=pd.Timestamp('2025-12-31')
    income=pd.DataFrame({d:[100.,20.,float('nan')]},index=['Total Revenue','Operating Income','Diluted EPS'])
    cash=pd.DataFrame({d:[30.,-10.]},index=['Operating Cash Flow','Capital Expenditure'])
    r=extract([income,cash])[0]
    assert r['operating_margin']==20
    assert r['fcf']==20
    assert 'eps' not in r
    assert number(float('inf')) is None

from src.valuation_data import historical_valuation
def test_valuation_filing_dates_and_split():
    def fact(start,end,filed,val,accn,form='10-K'):
        return dict(start=start,end=end,filed=filed,val=val,accn=accn,form=form)
    eps=[fact('2024-01-01','2024-12-31','2025-02-20',4,'a'),
         fact('2025-01-01','2025-03-31','2025-05-01',1.5,'b','10-Q'),
         fact('2024-01-01','2024-03-31','2025-05-01',1,'b','10-Q')]
    facts={'EarningsPerShareDiluted':{'units':{'USD/shares':eps}}}
    h=pd.DataFrame({'Close':[20.,20.,20.,20.],'Stock Splits':[0.,0.,0.,2.]},index=pd.to_datetime(['2025-02-19','2025-02-28','2025-05-02','2025-06-06']))
    pts=historical_valuation('NVDA',facts,h)
    assert 'pe' not in pts[0]
    assert pts[1]['eps']==2 and pts[1]['pe']==10
    assert pts[2]['eps']==2.25 and pts[2]['asof']=='2025-05-01'
    assert pts[3]['eps']==2.25
def test_valuation_missing_or_negative_eps_no_multiple():
    facts={'EarningsPerShareDiluted':{'units':{'USD/shares':[dict(start='2024-01-01',end='2024-12-31',filed='2025-02-20',val=-1,accn='a',form='10-K')]}}}
    h=pd.DataFrame({'Close':[20.]},index=pd.to_datetime(['2025-02-28']))
    assert 'pe' not in historical_valuation('OKLO',facts,h)[0]

from src.stock_data import peer_comparatives
def test_peer_equity_and_pretax_comparatives():
    rows=[{'period':'2026-09-30','equity':1000,'pretax':200}]
    def rec(end,val,start=None):
        r=dict(form='10-Q',filed='2026-11-01',end=end,val=val)
        if start:r['start']=start
        return r
    facts={'StockholdersEquity':{'units':{'USD':[rec('2026-09-30',1000),rec('2025-09-30',800)]}},
           'IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest':{'units':{'USD':[rec('2026-09-30',200,'2026-07-01'),rec('2025-09-30',150,'2025-07-01')]}}}
    assert peer_comparatives(rows,facts)['2026-09-30']=={'pretax':150,'equity':800}
    rows[0]['equity']=2000
    assert 'equity' not in peer_comparatives(rows,facts)['2026-09-30']

from src.stock_data import quality_comparatives
def test_quality_comparatives_require_current_match():
    rows=[{'period':'2026-09-30','tax_expense':20,'shares':100}]
    def r(start,end,val):return dict(form='10-Q',filed='2026-11-01',start=start,end=end,val=val)
    facts={'IncomeTaxExpenseBenefit':{'units':{'USD':[r('2026-07-01','2026-09-30',20),r('2025-07-01','2025-09-30',15)]}},'WeightedAverageNumberOfDilutedSharesOutstanding':{'units':{'shares':[r('2026-07-01','2026-09-30',100),r('2025-07-01','2025-09-30',95)]}}}
    assert quality_comparatives(rows,facts)['2026-09-30']=={'tax_expense':15,'shares':95}
    rows[0]['tax_expense']=200
    assert 'tax_expense' not in quality_comparatives(rows,facts)['2026-09-30']
