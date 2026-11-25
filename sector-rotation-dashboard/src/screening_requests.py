"""Owner-approved public ticker requests; never execute issue text."""
import json
import os
import re
from urllib.parse import urlencode
from urllib.request import Request, urlopen

OWNER = 'charmedvie'
REPO = 'charmedvie/sector-rotation'
LIMIT = 20
TITLE = re.compile(r'Stock screening: ([A-Z][A-Z0-9.-]{0,9})\Z')

def parse_requests(issues, ciks, limit=LIMIT):
    result = {}
    for issue in issues:
        if 'pull_request' in issue or issue.get('state') != 'open' or (issue.get('user') or {}).get('login') != OWNER:
            continue
        m = TITLE.fullmatch(issue.get('title') or '')
        if not m:
            continue
        ticker = m.group(1)
        canonical = ticker.replace('-', '.')
        cik = ciks.get(ticker) or ciks.get(canonical) or ciks.get(ticker.replace('.', '-'))
        if not cik:
            result[ticker] = 'not_in_sec_directory'
        elif sum(v == 'requested' for v in result.values()) >= limit and ticker not in result:
            result[ticker] = 'request_limit'
        else:
            result[ticker] = 'requested'
    return result

def fetch_requests(ciks):
    issues = []
    token = os.environ.get('GITHUB_TOKEN')
    headers = {'User-Agent':'Stock Intelligence Lab','Accept':'application/vnd.github+json'}
    if token:
        headers['Authorization'] = 'Bearer '+token
    for page in range(1, 11):
        query = urlencode({'state':'open','creator':OWNER,'sort':'created','direction':'asc','per_page':100,'page':page})
        req = Request('https://api.github.com/repos/'+REPO+'/issues?'+query, headers=headers)
        with urlopen(req, timeout=20) as res:
            batch = json.load(res)
        if not isinstance(batch, list):
            raise RuntimeError('Unexpected GitHub issue response')
        issues.extend(batch)
        if len(batch)<100:
            break
    return parse_requests(issues,ciks)

def screening_profile(info, quarters):
    sector = str(info.get('sector') or '').lower()
    industry = str(info.get('industry') or '').lower()
    if 'financial' in sector or any(x in industry for x in ('bank','insurance','broker','capital markets','asset management','credit services','mortgage','financial data')):
        return 'bank' if 'bank' in industry else 'insurance' if 'insurance' in industry else 'financial'
    if 'reit' in industry or 'real estate' in sector:
        return 'real_estate'
    revenue = [r['revenue'] for r in quarters[:4] if isinstance(r.get('revenue'), (int,float))]
    if len(revenue)==4 and all(v<=0 for v in revenue):
        return 'precommercial'
    if 'semiconductor' in industry:
        return 'semiconductor'
    if 'software' in industry:
        return 'software'
    if 'retail' in industry:
        return 'retail'
    if 'biotechnology' in industry:
        return 'biotech'
    if 'energy' in sector or 'utilities' in sector:
        return 'capital_intensive'
    if sector:
        return 'operating'
    return 'unclassified'
