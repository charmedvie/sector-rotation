"""Optional public stock research data. No holdings or private notes are collected."""
from datetime import datetime, timezone
from pathlib import Path
import json
import math
import pandas as pd

PILOTS = ['IBKR','HOOD','AMZN','GOOGL','NVDA','KTOS','OKLO']
PEERS = ['SCHW','SOFI','COIN','MSFT','WMT','META','AMD','AVGO','AVAV','LHX','SMR','NNE']
FIELDS = {
 'revenue': ['Total Revenue'], 'gross_profit':['Gross Profit'],
 'operating_profit':['Operating Income'], 'pretax':['Pretax Income'],
 'net_income':['Net Income Common Stockholders','Net Income'],
 'eps':['Diluted EPS'], 'shares':['Diluted Average Shares'],
 'interest_expense':['Interest Expense'], 'sbc':['Stock Based Compensation'],
 'ocf':['Operating Cash Flow'], 'capex':['Capital Expenditure'],
 'assets':['Total Assets'], 'equity':['Stockholders Equity','Common Stock Equity'],
 'cash':['Cash Cash Equivalents And Short Term Investments','Cash And Cash Equivalents'],
 'debt':['Total Debt'], 'receivables':['Receivables','Accounts Receivable'],
 'inventory':['Inventory'], 'current_assets':['Current Assets'], 'current_liabilities':['Current Liabilities']
}
def number(v):
    try:
        x=float(v)
        return x if math.isfinite(x) else None
    except (ValueError, TypeError):
        return None

def extract(frames):
    dates=sorted({pd.Timestamp(c) for f in frames if f is not None for c in f.columns},reverse=True)
    out=[]
    for d in dates:
        row={'period':d.date().isoformat()}
        for k,aliases in FIELDS.items():
            for f in frames:
                if f is None or d not in f.columns: continue
                for a in aliases:
                    if a in f.index:
                        v=number(f.loc[a,d])
                        if v is not None:
                            row[k]=v
                            break
                if k in row: break
        if 'capex' in row: row['capex']=abs(row['capex'])
        if 'ocf' in row and 'capex' in row: row['fcf']=row['ocf']-row['capex']
        for key,top in [('gross_margin','gross_profit'),('operating_margin','operating_profit'),('pretax_margin','pretax'),('net_margin','net_income')]:
            if row.get('revenue',0)>0 and top in row: row[key]=100*row[top]/row['revenue']
        if row.get('equity',0)>0 and 'assets' in row and row['assets']>0: row['equity_assets']=100*row['equity']/row['assets']
        if len(row)>1: out.append(row)
    return out

def safe(call, default=None):
    try: return call()
    except Exception as exc:
        print(f'Stock source unavailable: {exc}')
        return default

def generate(output):
    import yfinance as yf
    output=Path(output)
    payload={'generated_at':datetime.now(timezone.utc).isoformat(),'source':'Yahoo Finance via yfinance; standardized statements, not independently reconciled to filings','stocks':{}}
    for symbol in PILOTS+PEERS:
        t=yf.Ticker(symbol)
        q=extract([safe(lambda:t.quarterly_income_stmt),safe(lambda:t.quarterly_balance_sheet),safe(lambda:t.quarterly_cashflow)])
        annual=extract([safe(lambda:t.income_stmt),safe(lambda:t.balance_sheet),safe(lambda:t.cashflow)]) if symbol in PILOTS else []
        info=safe(lambda:t.info,{}) or {}
        h=safe(lambda:t.history(period='1y',auto_adjust=False,timeout=15)) if symbol in PILOTS else None
        prices=[]
        if h is not None and not h.empty and 'Close' in h:
            prices=[{'date':pd.Timestamp(d).date().isoformat(),'close':number(v)} for d,v in h['Close'].items() if number(v) is not None]
        quote={k:number(info.get(k)) for k in ['trailingPE','priceToBook','enterpriseToRevenue','enterpriseToEbitda','marketCap','enterpriseValue','trailingEps']}
        quote['currency']=info.get('currency')
        quote['financialCurrency']=info.get('financialCurrency')
        if prices: quote['lastClose']=prices[-1]['close']; quote['date']=prices[-1]['date']
        payload['stocks'][symbol]={'quarterly':q,'annual':annual,'quote':quote,'prices':prices,'status':'available' if q else 'unavailable'}
        print(f'{symbol}: {len(q)} quarters, {len(annual)} years')
    output.parent.mkdir(parents=True,exist_ok=True)
    tmp=output.with_suffix('.tmp')
    tmp.write_text(json.dumps(payload,allow_nan=False,separators=(',',':')),encoding='utf-8')
    tmp.replace(output)

if __name__=='__main__':
    generate('site/data/stocks.json')
