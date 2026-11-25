from src.screening_requests import parse_requests, screening_profile

def issue(title, owner='charmedvie', state='open', **kwargs):
    return dict(title=title,user={'login':owner},state=state,**kwargs)

def test_requests_only_exact_owner_approved_sec_tickers():
    issues=[issue('Stock screening: AAPL'),issue('Stock screening: BRK-B'),issue('Stock screening: TSLA',owner='other'),issue('Stock screening: NVDA',state='closed'),issue('Stock screening: AAPL; echo nope'),issue('Stock screening: MISSING'),issue('Stock screening: MSFT',pull_request={})]
    assert parse_requests(issues,{'AAPL':1,'BRK.B':2,'TSLA':3,'NVDA':4,'MSFT':5}) == {'AAPL':'requested','BRK-B':'requested','MISSING':'not_in_sec_directory'}

def test_request_limit_and_profiles():
    assert parse_requests([issue('Stock screening: AAPL'),issue('Stock screening: MSFT')],{'AAPL':1,'MSFT':2},1)=={'AAPL':'requested','MSFT':'request_limit'}
    assert screening_profile({'sector':'Financial Services','industry':'Banks - Regional'},[])=='bank'
    assert screening_profile({'sector':'Technology','industry':'Semiconductors'},[])=='semiconductor'
    assert screening_profile({'sector':'Healthcare','industry':'Biotechnology'},[{'revenue':0}]*4)=='precommercial'
    assert screening_profile({},[])=='unclassified'
