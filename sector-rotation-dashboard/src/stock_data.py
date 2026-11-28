"""Optional public stock research data. No holdings or private notes are collected."""
from datetime import datetime, timezone
from pathlib import Path
import gzip
import json
import math
import os
from urllib.error import HTTPError
from urllib.request import Request, urlopen
import pandas as pd
from .filing_quarters import filing_quarters
from .asml_data import asml_financials
from .valuation_data import historical_valuation
from .screening_requests import fetch_requests, screening_profile

PILOTS = ['IBKR','HOOD','AMZN','GOOGL','NVDA','KTOS','OKLO']
PEERS = ['SCHW','SOFI','COIN','MSFT','WMT','META','AMD','AVGO','AVAV','LHX','SMR','NNE','RTX','BWXT','ICE','NDAQ','AMAT','LRCX','CRWD','ZS']
FIELDS = {
 'revenue': ['Total Revenue'], 'gross_profit':['Gross Profit'],
 'operating_profit':['Operating Income'], 'pretax':['Pretax Income'],
 'net_income':['Net Income Common Stockholders','Net Income'],
 'total_net_income':['Net Income Including Noncontrolling Interests'], 'tax_expense':['Tax Provision'],
 'total_equity':['Total Equity Gross Minority Interest'],
 'eps':['Diluted EPS'], 'shares':['Diluted Average Shares'],
 'interest_expense':['Interest Expense'], 'interest_income':['Interest Income'], 'other_nonop':['Other Non Operating Income Expenses'], 'nonop_interest':['Net Non Operating Interest Income Expense'], 'investment_gain':['Gain On Sale Of Security'], 'depreciation':['Depreciation And Amortization','Depreciation Amortization Depletion'], 'working_capital':['Change In Working Capital'], 'issuance':['Common Stock Issuance'], 'repurchases':['Common Stock Payments'], 'sbc':['Stock Based Compensation'],
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


CIKS = {'ASML':937966,'IBKR':1381197,'HOOD':1783879,'AMZN':1018724,'GOOGL':1652044,'NVDA':1045810,'KTOS':1069258,'OKLO':1849056}
SEC_TAGS = {
    'revenue': ['RevenueFromContractWithCustomerExcludingAssessedTax','Revenues','SalesRevenueNet','RevenueFromContractWithCustomerIncludingAssessedTax','InterestAndDividendIncomeOperating'],
    'operating_profit':['OperatingIncomeLoss'],
    'eps':['EarningsPerShareDiluted'],
}
SEC_SNAPSHOT = Path(__file__).with_name('sec_snapshot')


def sec_request(url):
    contact = os.environ.get('SEC_CONTACT', 'charmedvie@users.noreply.github.com')
    return Request(url, headers={'User-Agent': f'Stock Intelligence Lab {contact}', 'Accept': 'application/json'})


def sec_facts(symbol, cik=None):
    cik = cik if cik is not None else CIKS[symbol]
    req = sec_request(f'https://data.sec.gov/api/xbrl/companyfacts/CIK{cik:010d}.json')
    with urlopen(req, timeout=12) as res:
        facts = json.load(res).get('facts', {})
        return {**facts.get('us-gaap', {}), **{k:v for k,v in facts.get('dei', {}).items() if k == 'EntityCommonStockSharesOutstanding'}}


class FilingSource:
    def __init__(self):
        self.snapshot = json.loads((SEC_SNAPSHOT / 'manifest.json').read_text())
        self.live_blocked = False
        self.loaded = {}

    def get(self, symbol, cik):
        if cik not in self.loaded:
            self.loaded[cik] = self._load(symbol, cik)
        return self.loaded[cik]

    def _load(self, symbol, cik):
        if not self.live_blocked:
            try:
                facts = sec_facts(symbol, cik)
                if facts:
                    return facts, {'source': 'SEC live'}
            except HTTPError as exc:
                self.live_blocked = exc.code in (403, 429)
                print(f'SEC company facts for {symbol}: HTTP {exc.code}')
            except (OSError, ValueError) as exc:
                print(f'SEC company facts for {symbol}: {exc}')
        path = SEC_SNAPSHOT / f'CIK{cik:010d}.json.gz'
        if path.is_file():
            with gzip.open(path, 'rt', encoding='utf-8') as snapshot:
                return json.load(snapshot), {'source': 'SEC snapshot', 'retrieved': self.snapshot.get('retrieved_by_cik', {}).get(str(cik), self.snapshot['retrieved'])}
        return {}, {'source': 'Unavailable'}


def quarterly_facts(facts, tag, field):
    units=facts.get(tag,{}).get('units',{})
    rows=units.get('USD/shares' if field=='eps' else 'shares' if field=='shares' else 'USD',[])
    out={}
    for r in rows:
        if r.get('form') not in ('10-Q','10-K') or not r.get('start') or not r.get('end'): continue
        days=(pd.Timestamp(r['end'])-pd.Timestamp(r['start'])).days
        if not 70<=days<=105: continue
        v=number(r.get('val'))
        if v is None: continue
        end=r['end']; filed=r.get('filed','')
        if end not in out or filed>=out[end][0]: out[end]=(filed,v)
    return {k:v[1] for k,v in out.items()}

def prior_year_comparatives(rows, facts, tags_by_field=None):
    out={}
    for field,tags in (SEC_TAGS if tags_by_field is None else tags_by_field).items():
        for tag in tags:
            series=quarterly_facts(facts,tag,field)
            matches=[r for r in rows if r.get(field) is not None and r['period'] in series]
            # At least one same-period observation must agree; avoid substituting a segment or inconsistent split basis.
            if not matches: continue
            def agrees(r):
                x=r[field]; y=series[r['period']]
                return abs(x-y)<=max(0.011 if field=='eps' else 1,abs(x)*0.01)
            if not all(agrees(r) for r in matches): continue
            for r in rows[:4]:
                if r.get(field) is None: continue
                # Require agreement for the specific current quarter, not just another observation.
                if r['period'] not in series or not agrees(r): continue
                target=pd.Timestamp(r['period'])-pd.DateOffset(years=1)
                choices=[(abs((pd.Timestamp(k)-target).days),v) for k,v in series.items() if abs((pd.Timestamp(k)-target).days)<12]
                if choices:
                    out.setdefault(r['period'],{})[field]=min(choices,key=lambda t:t[0])[1]
            break
    return out


def sec_ticker_ciks():
    req = sec_request('https://www.sec.gov/files/company_tickers.json')
    with urlopen(req, timeout=12) as res:
        return {r['ticker']:int(r['cik_str']) for r in json.load(res).values()}

def instant_facts(facts, tag):
    out={}
    for r in facts.get(tag,{}).get('units',{}).get('USD',[]):
        if r.get('form') not in ('10-Q','10-K') or r.get('start') or not r.get('end'): continue
        v=number(r.get('val'))
        if v is None: continue
        end=r['end']; filed=r.get('filed','')
        if end not in out or filed>=out[end][0]: out[end]=(filed,v)
    return {k:v[1] for k,v in out.items()}

def peer_comparatives(rows, facts):
    out=prior_year_comparatives(rows,facts)
    # Require matching consolidated current values, then use the same compatible tag one year earlier.
    for field,tags in {'pretax':['IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest'],
                       'equity':['StockholdersEquity','CommonStockholdersEquity']}.items():
        for tag in tags:
            series=instant_facts(facts,tag) if field=='equity' else quarterly_facts(facts,tag,field)
            matches=[r for r in rows if r.get(field) is not None and r['period'] in series]
            def agrees(r):
                return abs(r[field]-series[r['period']])<=max(1,abs(r[field])*.01)
            if not matches or not all(agrees(r) for r in matches): continue
            for r in matches:
                target=pd.Timestamp(r['period'])-pd.DateOffset(years=1)
                candidates=[(abs((pd.Timestamp(k)-target).days),v) for k,v in series.items() if abs((pd.Timestamp(k)-target).days)<12]
                if candidates: out.setdefault(r['period'],{})[field]=min(candidates,key=lambda t:t[0])[1]
            break
    return out


QUALITY_TAGS = {
    'pretax':['IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest'],
    'tax_expense':['IncomeTaxExpenseBenefit'],
    'net_income':['NetIncomeLoss'],
    'total_net_income':['ProfitLoss','NetIncomeLoss'],
    'shares':['WeightedAverageNumberOfDilutedSharesOutstanding'],
    'interest_expense':['InterestExpense','InterestAndDebtExpense'],
    'other_nonop':['NonoperatingIncomeExpense'],
    'gross_profit':['GrossProfit'],
    'ocf':['NetCashProvidedByUsedInOperatingActivities'],
    'capex':['PaymentsToAcquirePropertyPlantAndEquipment'],
    'sbc':['ShareBasedCompensation'],
}
def quality_comparatives(rows,facts):
    # Only accept tags that reconcile to same-period standardized observations.
    out=prior_year_comparatives(rows,facts,{**SEC_TAGS,**QUALITY_TAGS})
    instant_tags={'cash':['CashAndCashEquivalentsAtCarryingValue'], 'inventory':['InventoryNet'], 'receivables':['AccountsReceivableNetCurrent','ReceivablesNetCurrent'], 'assets':['Assets'], 'equity':['StockholdersEquity'], 'debt':['LongTermDebtAndFinanceLeaseObligationsCurrent','LongTermDebtAndCapitalLeaseObligations']}
    for field,tags in instant_tags.items():
        for tag in tags:
            series=instant_facts(facts,tag)
            matches=[r for r in rows if r.get(field) is not None and r['period'] in series]
            if not matches or not all(abs(r[field]-series[r['period']])<=max(1,abs(r[field])*.01) for r in matches): continue
            for r in matches:
                target=pd.Timestamp(r['period'])-pd.DateOffset(years=1)
                candidates=[(abs((pd.Timestamp(k)-target).days),v) for k,v in series.items() if abs((pd.Timestamp(k)-target).days)<12]
                if candidates: out.setdefault(r['period'],{})[field]=min(candidates,key=lambda t:t[0])[1]
            break
    # Calculate ratios only from reconciled comparable components, never a standalone percentage guess.
    for period,p in out.items():
        for k,top in [('gross_margin','gross_profit'),('operating_margin','operating_profit'),('pretax_margin','pretax')]:
            if p.get('revenue',0)>0 and top in p: p[k]=100*p[top]/p['revenue']
        if 'ocf' in p and 'capex' in p: p['fcf']=p['ocf']-p['capex']
    return out

def generate(output):
    import yfinance as yf
    output=Path(output)
    payload={'generated_at':datetime.now(timezone.utc).isoformat(),'source':'Yahoo Finance via yfinance; compatible comparative quarters from SEC companyfacts when available. Standardized statements not independently reconciled.','stocks':{}}
    watchlists=json.loads(Path(__file__).with_name('stock_watchlists.json').read_text(encoding='utf-8'))
    payload['watchlists']=watchlists['watchlists']
    watchlist_stocks=watchlists['stocks']
    filings = FilingSource()
    live_ciks = safe(sec_ticker_ciks, {}) or {}
    peer_ciks = {**filings.snapshot['ciks'], **live_ciks}
    requests=safe(lambda:fetch_requests(live_ciks),None) if live_ciks else None
    payload['screening_requests']=requests or {}
    payload['screening_registry_available']=requests is not None
    requested=[s for s,status in (requests or {}).items() if status=='requested' and s not in PILOTS]
    full=set(PILOTS+requested)|set(watchlist_stocks)
    for symbol in dict.fromkeys(PILOTS+PEERS+list(watchlist_stocks)+requested):
        is_screening=symbol in requested
        watchlist_entry=watchlist_stocks.get(symbol, {})
        provider_symbol=watchlist_entry.get('provider_symbol') or symbol.replace('.', '-')
        t=yf.Ticker(provider_symbol)
        q=extract([safe(lambda:t.quarterly_income_stmt),safe(lambda:t.quarterly_balance_sheet),safe(lambda:t.quarterly_cashflow)])
        annual=extract([safe(lambda:t.income_stmt),safe(lambda:t.balance_sheet),safe(lambda:t.cashflow)]) if symbol in full else []
        info=safe(lambda:t.info,{}) or {}
        if is_screening and (info.get('quoteType')!='EQUITY' or info.get('currency')!='USD' or info.get('financialCurrency')!='USD' or info.get('exchange') not in ('NYQ','NMS','NGM','NCM','ASE','PCX','BTS')):
            payload['screening_requests'][symbol]='unsupported_or_unverified_currency'
            if symbol not in PEERS and not watchlist_entry: continue
            is_screening=False
        asml_eur = symbol == 'ASML' and info.get('financialCurrency') == 'EUR' and info.get('currency') == 'USD'
        if watchlist_entry and symbol not in PILOTS and info.get('financialCurrency')!='USD' and not asml_eur:
            q,annual=[],[]
        history_period='10y'
        h=safe(lambda:t.history(period=history_period,auto_adjust=False,actions=True,timeout=25)) if symbol in full else None
        if symbol in full and history_period!='1y' and (h is None or h.empty): h=safe(lambda:t.history(period='1y',auto_adjust=False,actions=True,timeout=15))
        prices=[]
        if h is not None and not h.empty and 'Close' in h:
            cutoff=pd.Timestamp(h.index[-1])-pd.DateOffset(years=1)
            prices=[{'date':pd.Timestamp(d).date().isoformat(),'close':number(v)} for d,v in h['Close'].items() if d>=cutoff and number(v) is not None]
        quote={k:number(info.get(k)) for k in ['trailingPE','priceToBook','enterpriseToRevenue','enterpriseToEbitda','priceToSalesTrailing12Months','marketCap','enterpriseValue','trailingEps','sharesOutstanding']}
        quote['currency']=info.get('currency')
        quote['financialCurrency']=info.get('financialCurrency')
        if watchlist_entry and symbol not in PILOTS and info.get('currency')!='USD':
            prices=[]
        if prices: quote['lastClose']=prices[-1]['close']; quote['date']=prices[-1]['date']
        cik=CIKS.get(symbol,peer_ciks.get(symbol) or peer_ciks.get(symbol.replace('-','.')) or peer_ciks.get(symbol.replace('.','-')))
        if watchlist_entry.get('provider_symbol'):
            cik = None
        facts, filing_source = filings.get(symbol, cik) if cik is not None else ({}, {'source': 'Unavailable'})
        if symbol in ('FTNT','PANW') and info.get('financialCurrency') == 'USD':
            q = filing_quarters(q, facts, h) if any('revenue' in row for row in q) else q
            annual = [row for row in annual if 'revenue' in row]
        prior = safe(lambda:prior_year_comparatives(q,facts),{}) if facts and symbol in full else {}
        peer_prior = safe(lambda:peer_comparatives(q,facts),{}) if facts else {}
        quality_prior = safe(lambda:quality_comparatives(q,facts),{}) if facts and symbol in full else {}
        valuation = safe(lambda:historical_valuation(symbol,facts,h),[]) if symbol in full and info.get('currency') == 'USD' else []
        statement_note = None
        if asml_eur:
            fx = safe(lambda:yf.Ticker('EURUSD=X').history(period='10y',auto_adjust=False))
            converted = safe(lambda:asml_financials(q, annual, quote, h, fx))
            if converted:
                q, annual, prior, valuation, statement_note = converted
                peer_prior = quality_prior = prior
                filing_source = {'source':'ASML quarterly results'}
            else:
                q, annual, valuation = [], [], []
                for field in ('trailingPE','priceToBook','enterpriseToRevenue','enterpriseToEbitda','priceToSalesTrailing12Months','enterpriseValue','trailingEps'):
                    quote[field] = None
        profile = 'exchange' if symbol in ('CME', 'CBOE', 'ICE', 'NDAQ') else screening_profile(info, q)
        if is_screening: payload['screening_requests'][symbol]='available' if q and prices else 'data_unavailable'
        payload['stocks'][symbol]={'screening':is_screening,'metadata':{'name':info.get('shortName') or info.get('longName') or watchlist_entry.get('name') or symbol,'tradingviewSymbol':watchlist_entry.get('symbol'),'sector':info.get('sector'),'industry':info.get('industry'),'exchange':info.get('exchange'),'cik':cik,'profile':profile,'currency':quote['financialCurrency']},'quarterly':q,'annual':annual,'quote':quote,'prices':prices,'prior_year':prior,'peer_prior':peer_prior,'quality_prior':quality_prior,'valuation_history':valuation,'valuation_filing_source':filing_source,'status':'available' if q else 'unavailable'}
        if statement_note:
            payload['stocks'][symbol]['statement_note'] = statement_note
            payload['stocks'][symbol]['metadata']['name'] = 'ASML Holding N.V.'
        print(f'{symbol}: {len(q)} quarters, {len(annual)} years; valuation {filing_source["source"]} '+str({k:sum(k in r for r in valuation) for k in ('price','eps','pe','market_cap_proxy','evop','pb','pfcf','fcf')}))
    output.parent.mkdir(parents=True,exist_ok=True)
    tmp=output.with_suffix('.tmp')
    tmp.write_text(json.dumps(payload,allow_nan=False,separators=(',',':')),encoding='utf-8')
    tmp.replace(output)

if __name__=='__main__':
    generate('site/data/stocks.json')
