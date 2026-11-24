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
