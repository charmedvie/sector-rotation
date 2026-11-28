const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const script=fs.readFileSync('site/stocks.js','utf8');
function load(){
 const nodes=new Map();
 const document={getElementById(id){if(!nodes.has(id))nodes.set(id,{innerHTML:'',textContent:'',value:'',classList:{add(){},remove(){}},querySelectorAll(){return []},scrollIntoView(){}});return nodes.get(id);}};
 const ctx=vm.createContext({document,window:{},location:{hash:''},fetch:()=>new Promise(()=>{}),localStorage:{getItem(){return null},setItem(){}}});
 vm.runInContext(script,ctx);return {ctx,nodes};
}
test('every ticker and section renders without data',()=>{const {ctx}=load();vm.runInContext("for(const s of Object.keys(M)){symbol=s;for(const t of tabs){tab=t;render();if(!el('panel').innerHTML)throw Error(s+' '+t);}}",ctx);});
test('overview unchanged and fundamentals tables with SEC comparative fallback',()=>{const {ctx,nodes}=load();vm.runInContext("data={stocks:{IBKR:{quarterly:[{period:'2026-09-30',revenue:120,operating_profit:30,eps:1,pretax_margin:30},{period:'2026-06-30',revenue:110,operating_profit:20,eps:0.8,pretax_margin:20},{period:'2026-03-31',revenue:100,operating_profit:-5,eps:-0.1,pretax_margin:-5},{period:'2025-12-31',revenue:90,operating_profit:10,eps:0.4,pretax_margin:10}],annual:[],quote:{trailingPE:29},prices:[],prior_year:{'2026-09-30':{revenue:100},'2026-06-30':{revenue:100},'2026-03-31':{revenue:100},'2025-12-31':{revenue:100}}}}};render()",ctx);let page=nodes.get('panel').innerHTML;assert.match(page,/What deserves your attention/);assert.match(page,/VALUATION CONTEXT/);assert.doesNotMatch(page,/class="quarter-chart"|EXPLORE IN DEPTH|class="assessment-banner"[^]*?<p>Revenue /);vm.runInContext("tab='Fundamentals';render()",ctx);page=nodes.get('panel').innerHTML;assert.match(page,/Key fundamental insights/);assert.match(page,/Long-term trend/);assert.doesNotMatch(page,/Business trajectory|LONG-TERM FUNDAMENTAL MOMENTUM/);assert.match(page,/Detailed financials/);assert.match(page,/\+20%/);assert.doesNotMatch(page,/class="quarter-chart"|id="fin-chart"|id="margin-chart"/);for(const d of ['2025-12','2026-03','2026-06','2026-09'])assert.ok(page.includes(d));});

test('trend colours use two consecutive comparisons and distinguish economics',()=>{const {ctx}=load();vm.runInContext("symbol='AMZN';if(cellTrend('revenue',[1,1])!=='good'||cellTrend('revenue',[1,-1])!=='muted'||cellTrend('shares',[1,1])!=='bad'||cellTrend('debt',[1,1])!=='investigate'||cellTrend('capex',[-1,-1])!=='muted')throw Error('trend rules');symbol='IBKR';if(cellTrend('operating_margin',[1,1])!=='muted'||cellTrend('shares',[1,1])!=='investigate')throw Error('brokerage rules');",ctx);});

test('quarterly trends require two consecutive QoQ moves, not prior-year data',()=>{const {ctx}=load();vm.runInContext("symbol='AMZN';const rows=[{period:'2026-09-30',revenue:120,debt:120,shares:120,operating_margin:20},{period:'2026-06-30',revenue:110,debt:110,shares:110,operating_margin:19},{period:'2026-03-31',revenue:100,debt:100,shares:100,operating_margin:18}];if(columnTrend(rows,0,'revenue')!=='good'||columnTrend(rows,0,'debt')!=='investigate'||columnTrend(rows,0,'shares')!=='bad'||columnTrend(rows,0,'operating_margin')!=='good'||columnTrend(rows,1,'revenue')!=='muted')throw Error('QoQ confirmation');if(columnTrend([{...rows[0],revenue:100},rows[1],rows[2]],0,'revenue')!=='muted')throw Error('mixed direction');if(columnTrend([{...rows[0],revenue:111},rows[1],rows[2]],0,'revenue')!=='muted')throw Error('tolerance');if(columnTrend([rows[0],rows[2],{period:'2025-12-31',revenue:90}],0,'revenue')!=='muted')throw Error('missing quarter');symbol='IBKR';if(columnTrend(rows,0,'shares')!=='investigate'||columnTrend(rows,0,'operating_margin')!=='muted')throw Error('brokerage rules');",ctx);});

test('risk screens preserve uncertainty and use dated disclosures',()=>{const {ctx,nodes}=load();vm.runInContext("symbol='IBKR';const q={period:'2026-09-30'},d={quarterly:[q]};if(riskAt('IBKR',d,q,'capital').status!=='clear'||riskAt('IBKR',d,q,'credit').status!=='watch'||riskAt('IBKR',d,{period:'2026-06-30'},'capital').status!=='unknown')throw Error('dated risk');data={stocks:{IBKR:{quarterly:[q],annual:[],quote:{},prices:[]}}};tab='Financial risk';render();",ctx);const page=nodes.get('panel').innerHTML;assert.match(page,/Risk map/);assert.match(page,/Filing details|Supporting details/);assert.doesNotMatch(page,/Risks beneath the surface/);assert.match(page,/Financial stress tests/);assert.match(page,/Risk evolution/);assert.match(page,/5.39x coverage/);assert.match(nodes.get('stress-output-0').innerHTML,/332M/);});
test('no missing baseline is converted into a safe risk status',()=>{const {ctx}=load();vm.runInContext("symbol='OKLO';if(riskAt('OKLO',{quarterly:[]},{},'runway').status!=='unknown')throw Error('missing runway');symbol='AMZN';if(riskAt('AMZN',{quarterly:[]},{},'coverage').status!=='unknown')throw Error('missing interest');",ctx);});

test('business KPIs show dated observations for each pilot and never invent missing history',()=>{const {ctx,nodes}=load();vm.runInContext("for(const s of Object.keys(M)){symbol=s;tab='Business Drivers';render();if(!el('panel').innerHTML.includes('driver-assessment-status'))throw Error(s);}symbol='AMZN';tab='Business Drivers';render();",ctx);assert.match(nodes.get('panel').innerHTML,/46B/);assert.match(nodes.get('panel').innerHTML,/Sustained improvement/);assert.doesNotMatch(nodes.get('panel').innerHTML,/Sources & methodology/);assert.match(nodes.get('panel').innerHTML,/driver-inline-source/);vm.runInContext("symbol='OKLO';render();",ctx);assert.match(nodes.get('panel').innerHTML,/Not assessed/);assert.doesNotMatch(nodes.get('panel').innerHTML,/kpi-donut/);});
test('KPI colours require two successive changes and preserve ambiguous economics',()=>{const {ctx}=load();vm.runInContext("const r=kpiRow('test','Test','M','up',[1,2,3,4,null],'');if(kpiTrend(r,3)!=='good'||kpiTrend(r,1)!=='muted'||kpiTrend({...r,values:[1,null,3,4,null]},3)!=='muted'||kpiTrend({...r,kind:'context'},3)!=='muted'||kpiTrend({...r,kind:'watch'},3)!=='investigate')throw Error('trend');",ctx);});

test('valuation ranges, attribution and missing history',()=>{const {ctx,nodes}=load();vm.runInContext("symbol='NVDA';tab='Fundamentals';render();if(el('panel').innerHTML.includes('Historical indexed series unavailable')||el('panel').innerHTML.includes('val-index-chart'))throw Error('empty history section');const pts=Array.from({length:12},(_,i)=>({date:'2026-'+String(i+1).padStart(2,'0')+'-01',price:100+i*10,eps:5+i*.2,op:20+i,pe:(100+i*10)/(5+i*.2)}));data={stocks:{NVDA:{quarterly:[],annual:[],quote:{trailingPE:29},prices:[],valuation_history:pts}}};render();const a=valAttribution(pts);if(Math.abs(a.total-a.earn-a.multiple)>1e-9||!valStats(pts,'pe',pts.at(-1).pe)||valStats(pts,'pb',null))throw Error('valuation math');",ctx);const page=nodes.get('panel').innerHTML;assert.match(page,/Historical multiples/);assert.match(page,/Price vs fundamentals/i);assert.match(page,/val-index-chart/);assert.match(page,/val-multiple-chart/);assert.match(page,/Multiple contribution/);});

test('peer comparisons use selected peer medians and comparable reporting dates',()=>{const {ctx,nodes}=load();vm.runInContext("symbol='NVDA';tab='Peers';const mk=(r,old,pe,date='2026-09-30')=>({quarterly:[{period:date,revenue:r,operating_profit:r/2,operating_margin:50}],annual:[],quote:{trailingPE:pe},prices:[],peer_prior:{[date]:{revenue:old}}});data={stocks:{NVDA:mk(150,100,30),AMD:mk(120,100,20),AVGO:mk(140,100,40)}};render();if(peerBaseline('NVDA',['NVDA','AMD','AVGO'],'pe')!==30||peerTone('pe',20,30)!=='lower'||peerBaseline('NVDA',['NVDA','AMD'],'pe')!==null)throw Error('median');const g=peerGraph('NVDA',['NVDA','AMD','AVGO'],peerSettings('NVDA'));if(g.points.length!==3||Math.abs(g.mx-30)>1e-6||g.my!==30)throw Error('map');data.stocks.AVGO=mk(140,100,40,'2025-09-30');if(peerBaseline('NVDA',['NVDA','AMD','AVGO'],'pe')!==null)throw Error('stale peer');peerSettings('NVDA').enabled=['AMD'];render();",ctx);assert.match(nodes.get('panel').innerHTML,/Comparison universe/);assert.doesNotMatch(nodes.get('panel').innerHTML,/id="peer-scatter"/);assert.doesNotMatch(nodes.get('panel').innerHTML,/Relative fundamental momentum|Chart hidden|GROWTH VS VALUATION/i);});
test('financial and precommercial peer groups use appropriate metrics',()=>{const {ctx,nodes}=load();vm.runInContext("symbol='IBKR';tab='Peers';render();if(peerValue('IBKR',{operating_margin:99},'margin')!==null)throw Error('financial margin');symbol='OKLO';render();if(peerSettings('OKLO').x!=='cash'||peerSettings('OKLO').y!=='marketcap')throw Error('precommercial axes');",ctx);assert.match(nodes.get('panel').innerHTML,/BWXT/);assert.doesNotMatch(nodes.get('panel').innerHTML,/Capital and valuation map/);});

test('thesis tracker renders every company with explicit evidence and no fabricated reviews',()=>{const {ctx,nodes}=load();vm.runInContext("if(tabs.includes('Technical')||tabs.includes('Valuation')||tabs.length!==6)throw Error('technical tab');for(const s of Object.keys(M)){symbol=s;tab='Thesis & catalysts';render();const page=el('panel').innerHTML;if(!page.includes('Thesis validation')||!page.includes('Catalyst watchlist')||!page.includes('Research journal'))throw Error(s);}symbol='AMZN';tab='Thesis & catalysts';render();",ctx);assert.match(nodes.get('panel').innerHTML,/AWS capital productivity/);assert.match(nodes.get('panel').innerHTML,/Evidence review loading/);assert.match(nodes.get('history').innerHTML,/No dated reviews yet/);vm.runInContext("tab='Overview';render();",ctx);assert.doesNotMatch(nodes.get('panel').innerHTML,/Technical trend|data-target="Technical"/);});
test('thesis validation distinguishes missing and stale disclosures from actual evidence',()=>{const {ctx}=load();vm.runInContext("const c=thesisConfig.AMZN.checks[0];if(thesisCheck('AMZN',{quarterly:[{period:'2026-12-31'}]},c).status!=='unknown')throw Error('stale');if(thesisCheck('AMZN',{quarterly:[]},thesisConfig.AMZN.checks[3]).status!=='unknown')throw Error('missing FCF');if(thesisCheck('OKLO',{quarterly:[]},thesisConfig.OKLO.checks[3]).status!=='unknown')throw Error('unverified PPA');",ctx);});

test('private notes survive migration and saved reviews include dated evidence',()=>{const {ctx,nodes}=load();vm.runInContext("const store=new Map([['stock-intelligence-notes-IBKR',JSON.stringify([{date:'2026-10-01',text:'Existing note'}])]]);localStorage.getItem=k=>store.get(k)??null;localStorage.setItem=(k,v)=>store.set(k,v);symbol='IBKR';tab='Thesis & catalysts';render();el('thesis').value='New review';el('thesis-period').value='2026-09-30';el('save').onclick();const n=JSON.parse(store.get('stock-intelligence-notes-IBKR'));if(n.length!==2||n[1].text!=='Existing note'||!n[0].evidence.length||!n[0].thesis)throw Error('journal migration');",ctx);assert.match(nodes.get('history').innerHTML,/Existing note/);assert.match(nodes.get('history').innerHTML,/New review/);});

test('merged financial table retains each metric exactly once and annual trend in both views',()=>{const {ctx,nodes}=load();vm.runInContext("symbol='AMZN';tab='Fundamentals';const expected=[...fields,...extraFields].map(r=>r[0]).sort();if(JSON.stringify(financialGroups.flatMap(g=>g[1]).sort())!==JSON.stringify(expected))throw Error('missing or duplicated financial row');data={stocks:{AMZN:{quarterly:[{period:'2026-09-30',revenue:150},{period:'2026-06-30',revenue:140},{period:'2026-03-31',revenue:130},{period:'2025-12-31',revenue:120}],annual:[{period:'2025-12-31',revenue:144,operating_margin:20},{period:'2024-12-31',revenue:120,operating_margin:18},{period:'2023-12-31',revenue:100,operating_margin:16}],quote:{},prices:[],prior_year:{'2026-09-30':{revenue:100}}}}};frequency='quarterly';render();",ctx);let page=nodes.get('panel').innerHTML;assert.match(page,/2Y \+20% C/);assert.match(page,/2Y \+4pp/);assert.match(page,/\+50%/);assert.match(page,/Growth &amp; earnings/);assert.doesNotMatch(page,/Shareholder dilution &amp; tax|data-financial-field="(?:pretax|pretax_margin|equity|cash|sbc|shares|tax_rate|tax_expense)"/);assert.equal((page.match(/class="financial-group"/g)||[]).length,4);assert.equal((page.match(/data-financial-field=/g)||[]).length,16);assert.ok(page.indexOf('Long-term trend')<page.indexOf('Latest YoY'));assert.ok(page.indexOf('Latest YoY')<page.indexOf('2026-09-30',page.indexOf('Latest YoY')));vm.runInContext("frequency='annual';render();",ctx);page=nodes.get('panel').innerHTML;assert.match(page,/2Y \+20% C/);assert.match(page,/2Y \+4pp/);assert.match(page,/2025-12-31/);assert.doesNotMatch(page,/Business trajectory|Shareholder dilution &amp; tax|data-financial-field="(?:pretax|pretax_margin|equity|cash|sbc|shares|tax_rate|tax_expense)"/);});

test('earnings quality explains matched disclosures and excludes stale Amazon facts',()=>{const {ctx,nodes}=load();vm.runInContext("symbol='AMZN';tab='Fundamentals';data={stocks:{AMZN:{quarterly:[{period:'2026-09-30'}],annual:[],quote:{},prices:[]}}};render();",ctx);let page=nodes.get('panel').innerHTML;assert.match(page,/Anthropic investment gains/);assert.match(page,/1\.25x/);assert.match(page,/42B/);assert.match(page,/insight-bullets/);assert.doesNotMatch(page,/Observation:|Explanation:|Implication:/);vm.runInContext("data.stocks.AMZN.quarterly=[{period:'2026-12-31'}];render();",ctx);page=nodes.get('panel').innerHTML;assert.doesNotMatch(page,/Anthropic investment gains|1\.25x/);});
test('generic earnings bridge identifies nonoperating and tax changes without invented causes',()=>{const {ctx,nodes}=load();vm.runInContext("symbol='NVDA';tab='Fundamentals';data={stocks:{NVDA:{quarterly:[{period:'2026-10-25',operating_profit:200e6,pretax:180e6,tax_expense:30e6,net_income:150e6,eps:1.5},{period:'2025-10-25',operating_profit:100e6,pretax:200e6,tax_expense:40e6,net_income:160e6,eps:1.6}],annual:[],quote:{},prices:[]}}};render();",ctx);assert.match(nodes.get('panel').innerHTML,/Net non-operating contribution changed by −\$120M/);assert.match(nodes.get('panel').innerHTML,/Tax expense changed by −\$10M/);assert.doesNotMatch(nodes.get('panel').innerHTML,/Anthropic/);});

test('insights are material, concise, sector-specific and capped at six',()=>{const {ctx,nodes}=load();vm.runInContext("symbol='AMZN';tab='Fundamentals';data={stocks:{AMZN:{quarterly:[{period:'2026-09-30'}],annual:[],quote:{},prices:[]}}};render();",ctx);let page=nodes.get('panel').innerHTML;assert.match(page,/data-insight="earnings"/);assert.match(page,/data-insight="capex"/);assert.match(page,/data-insight="cash"/);assert.doesNotMatch(page,/data-insight="driver"/);assert.doesNotMatch(page,/data-insight="shares"|data-insight="tax"/);assert.ok((page.match(/data-insight=/g)||[]).length<=6);vm.runInContext("symbol='HOOD';data={stocks:{HOOD:{quarterly:[{period:'2026-09-30'}],annual:[],quote:{},prices:[]}}};render();",ctx);page=nodes.get('panel').innerHTML;assert.doesNotMatch(page,/data-insight="credit"/);assert.doesNotMatch(page,/data-insight="cash"/);vm.runInContext("symbol='OKLO';data={stocks:{OKLO:{quarterly:[{period:'2026-09-30'}],annual:[],quote:{},prices:[]}}};render();",ctx);assert.doesNotMatch(nodes.get('panel').innerHTML,/Commercial readiness remains unproven/);});

test('comparable evidence needs three periods and structural context',()=>{const {ctx}=load();vm.runInContext("const one=comparisonEvidence([{value:30}]);if(one.kind!=='emerging'||one.direction!==0)throw Error('single period');const dec=comparisonEvidence([{value:30},{value:42},{value:53},{value:65}]);if(dec.direction!==-1||dec.persistence!==1||dec.kind!=='sustained')throw Error('deceleration');const mixed=comparisonEvidence([{value:30},{value:-25},{value:35}]);if(mixed.kind!=='mixed')throw Error('mixed');const raw=kpiEvidence(kpiData.AMZN.rows.find(r=>r.id==='aws'));if(raw.count!==1||raw.kind!=='emerging')throw Error('raw KPI');const awsEv=kpiEvidence(kpiData.AMZN.rows.find(r=>r.id==='awsGrowth'));if(awsEv.count!==4||awsEv.direction!==0||awsEv.persistence!==1)throw Error('YoY growth-rate history');",ctx);});
test('matched prior TTM uses four comparable quarters and does not fabricate missing values',()=>{const {ctx}=load();vm.runInContext("const rows=[{period:'2026-09-30',ocf:40},{period:'2026-06-30',ocf:30},{period:'2026-03-31',ocf:20},{period:'2025-12-31',ocf:10}];const d={quality_prior:Object.fromEntries(rows.map(r=>[r.period,{ocf:r.ocf/2}]))};if(matchedTtmPrior(d,rows,'ocf')!==50)throw Error('prior TTM');delete d.quality_prior[rows[2].period];if(matchedTtmPrior(d,rows,'ocf')!==null)throw Error('missing TTM');",ctx);});
test('single favorable quarter cannot establish thesis support',()=>{const {ctx}=load();vm.runInContext("symbol='AMZN';const d={quarterly:[{period:'2026-09-30'}]};const check=thesisConfig.AMZN.checks.find(c=>c[2]==='awsMargin');if(thesisCheck('AMZN',d,check).status==='support')throw Error('single-quarter support');",ctx);});

test('risk tab separates filing exposures from operating performance and never reuses stale disclosures',()=>{const {ctx,nodes}=load();vm.runInContext("symbol='AMZN';tab='Financial risk';data={stocks:{AMZN:{quarterly:[{period:'2026-09-30'}],annual:[],quote:{},prices:[]}}};render();",ctx);let page=nodes.get('panel').innerHTML;assert.match(page,/884B/);assert.match(page,/165B/);assert.match(page,/Scheduled contractual payments/);assert.doesNotMatch(page,/Capital intensity|Cash generation|Earnings quality/);vm.runInContext("data.stocks.AMZN.quarterly=[{period:'2026-12-31'}];render();",ctx);page=nodes.get('panel').innerHTML;assert.doesNotMatch(page.split('Risk evolution tracker')[0],/884B|165B/);assert.match(page,/No period-matched filing-level exposure snapshot/);});
test('each pilot has distinct reviewed filing-level exposures',()=>{const {ctx}=load();vm.runInContext("for(const s of Object.keys(M)){const f=exposureFilings[s];if(!f||!exposureCards(s,{period:f.period}).length||exposureCards(s,{period:'1900-01-01'}).length)throw Error(s);}",ctx);});

test('stress tests use populated dated baselines and omit unavailable inputs',()=>{const {ctx,nodes}=load();vm.runInContext("for(const s of Object.keys(M)){symbol=s;tab='Financial risk';const q={period:exposureFilings[s].period};data={stocks:{[s]:{quarterly:[q],annual:[],quote:{},prices:[]}}};const specs=scenarioSpecs(s,get(s),q);if(specs.length<2||specs.some(x=>!num(x.base)||x.base<=0))throw Error(s+' baseline');render();if(el('panel').innerHTML.includes('stress-base-'))throw Error('manual baseline');for(let i=0;i<specs.length;i++){if(!el('stress-output-'+i).innerHTML||el('stress-output-'+i).innerHTML.includes('Baseline unavailable'))throw Error(s+' output');}}",ctx);});
test('risk evolution uses comparable observations and no empty cells',()=>{const {ctx,nodes}=load();vm.runInContext("for(const s of Object.keys(M)){const q={period:exposureFilings[s].period},d={quarterly:[q],annual:[]};const rows=riskHistory(s,d,q);if(!rows.length||rows.some(r=>r.obs.length<2||r.obs.some(o=>!num(o.value))))throw Error(s);if(renderRiskEvolution(s,d,q).includes('Not assessed'))throw Error('empty history');}symbol='AMZN';tab='Financial risk';data={stocks:{AMZN:{quarterly:[{period:'2026-09-30'}],annual:[],quote:{},prices:[]}}};render();",ctx);assert.match(nodes.get('panel').innerHTML,/Risk evolution tracker/);assert.match(nodes.get('panel').innerHTML,/333B/);assert.match(nodes.get('panel').innerHTML,/440B/);});

test('risk map uses financing context and display rounding',()=>{const {ctx,nodes}=load();vm.runInContext("symbol='AMZN';tab='Financial risk';const q={period:'2026-09-30',cash:100e9,debt:257.72e9};data={stocks:{AMZN:{quarterly:[q],annual:[],quote:{},prices:[]}}};render();if(money(157.72e9)!=='$158B'||money(1.51e9)!=='$1.5B'||money(359.6e6)!=='$360M')throw Error('rounding');",ctx);const page=nodes.get('panel').innerHTML;assert.match(page,/\$158B net debt/);assert.match(page,/financing dependency/);assert.match(page,/risk-map-conclusion/);assert.doesNotMatch(page,/\$157\.72B/);});
test('all risk map cards have implications; net debt alone does not establish distress',()=>{const {ctx}=load();vm.runInContext("for(const s of Object.keys(M)){const q={period:exposureFilings[s].period},d={quarterly:[q],annual:[]};for(const [id] of exposureDimensions[s]){const a=riskMapInsight(s,d,q,id,resilienceAt(s,d,q,id));if(!a.conclusion||!a.bullets.length||a.bullets.length>3)throw Error(s+' '+id);}}const q={period:'2026-12-31',cash:10e9,debt:30e9};const d={quarterly:[q],annual:[]};const a=riskMapInsight('AMZN',d,q,'liquidity',resilienceAt('AMZN',d,q,'liquidity'));if(a.status==='watch'||a.status==='high')throw Error('negative net cash only');",ctx);});

test('business drivers cover all engines, use real Amazon inputs and separate contributions',()=>{const {ctx,nodes}=load();vm.runInContext("for(const s of Object.keys(M)){symbol=s;tab='Business Drivers';render();if(!el('panel').innerHTML.includes('driver-group')||!el('panel').innerHTML.includes('Watch next'))throw Error(s);}symbol='AMZN';render();",ctx);const page=nodes.get('panel').innerHTML;for(const label of ['Retail demand &amp; fulfillment','Marketplace adoption &amp; monetisation','Advertising &amp; subscriptions','AWS demand &amp; scalability','Worldwide paid-unit growth','Third-party seller share of paid units','Incremental operating profit by reported segment','Incremental revenue by business category','Contracted future services'])assert.ok(page.includes(label));assert.match(page,/578B/);assert.doesNotMatch(page,/Business performance|Four-quarter operating trends/);});

test('business driver summary is compact and preserves expanded evidence',()=>{const {ctx,nodes}=load();vm.runInContext("symbol='AMZN';tab='Business Drivers';render();",ctx);const page=nodes.get('panel').innerHTML;assert.match(page,/driver-summary-grid/);assert.match(page,/Retail growth cooled in the latest quarter/);assert.match(page,/Metrics &amp; history/);assert.match(page,/Business mix &amp; growth contribution/);assert.match(page,/Weighted-average remaining long-term contract life/);assert.doesNotMatch(page,/<details class="driver-expand" open/);vm.runInContext("for(const s of Object.keys(M)){const g=driverGroups[s],b=driverBriefs[s];if(g.length!==b.length||b.some(x=>(x.ids||[]).length>3||x.points.length>2))throw Error(s);symbol=s;render();if(!el('panel').innerHTML.includes('driver-summary-grid'))throw Error(s);}",ctx);});

test('business driver assessment colours retain missing evidence and inline sources',()=>{const {ctx,nodes}=load();vm.runInContext("for(const s of Object.keys(M)){if(driverGroups[s].length!==driverTones[s].length)throw Error(s);symbol=s;tab='Business Drivers';render();if(!el('panel').innerHTML.includes('driver-tone-'))throw Error(s);}symbol='AMZN';render();",ctx);const page=nodes.get('panel').innerHTML;assert.match(page,/driver-tone-mixed/);assert.match(page,/driver-tone-positive/);assert.match(page,/driver-source-link/);assert.doesNotMatch(page,/Sources & methodology/);vm.runInContext("data={stocks:{AMZN:{quarterly:[{period:'2026-12-31'}],annual:[],quote:{},prices:[]}}};render();",ctx);assert.match(nodes.get('panel').innerHTML,/driver-tone-unknown/);assert.match(nodes.get('panel').innerHTML,/Historical snapshot/);});

test('valuation calculates multiples from reported inputs and distinguishes nonpositive denominators',()=>{const {ctx}=load();vm.runInContext("const rows=['2026-09-30','2026-06-30','2026-03-31','2025-12-31'].map(period=>({period,eps:2,revenue:100,operating_profit:20,fcf:-5,debt:100,cash:30,equity:200}));const d={quarterly:rows,quote:{lastClose:80,sharesOutstanding:10,marketCap:800,trailingPE:99},annual:[]};const x=currentValMetrics('AMZN',d,null);if(x.pe[1]!=='10x'||x.pb[1]!=='4x'||x.pfcf[1]!=='N/A'||x.yield[1]!=='-2.5%')throw Error(JSON.stringify(x));",ctx);});
test('single-quarter business driver is not presented as sustained positive assessment',()=>{const {ctx}=load();vm.runInContext("{const h=driverHorizon('IBKR',0,kpiData.IBKR);if(h.tone==='positive'||!h.label.includes('emerging'))throw Error(JSON.stringify(h));if(driverHorizon('AMZN',3,kpiData.AMZN).tone!=='positive')throw Error('AWS multi-quarter evidence');if(driverHorizon('AMZN',3,kpiData.AMZN,true).tone!=='unknown')throw Error('stale');}",ctx);});


test('Amazon peer scopes retain original layout and independent settings',()=>{const {ctx,nodes}=load();vm.runInContext("{symbol='AMZN';tab='Peers';for(const lens of ['aws','retail','ads','consolidated']){amazonPeerLens=lens;render();const page=el('panel').innerHTML;for(const title of ['Comparison universe','Competitive assessment','data-amzn-lens','data-peer'])if(!page.includes(title))throw Error(lens+' '+title);if(page.includes('segment-peer-company'))throw Error('alternate layout');}amazonPeerLens='aws';const ac=segmentAccess('aws');if(ac.value('Azure',ac.last('Azure'),'cloudMargin')!==null||ac.value('Azure',ac.last('Azure'),'cloudRev')!==null)throw Error('Azure proxy');if(peerGraph('AWS',['AWS','Azure','Google Cloud'],{...ac.st,x:'cloudGrowth',y:'cloudMargin'},ac).points.length!==2)throw Error('cloud map');if(ac.value('AWS',{period:'2025-12-31'},'cloudGrowth')!==null||ac.value('AWS',{period:'2025-12-31'},'cloudCC')!==24)throw Error('currency basis');ac.st.enabled=['Google Cloud'];if(segmentAccess('retail').st.enabled.length!==3)throw Error('lens settings');render();if(el('panel').innerHTML.includes('Contracted demand is substantial'))throw Error('unselected commentary');amazonPeerLens='retail';render();}",ctx);let page=nodes.get('panel').innerHTML;assert.match(page,/EBAY/);assert.match(page,/SHOP/);assert.match(page,/Seller \/ merchant service revenue · different scopes/);assert.doesNotMatch(page,/id="peer-scatter"/);assert.doesNotMatch(page,/US comparable sales growth|Global membership fee growth|Paid-unit growth · Amazon|Third-party seller unit share · Amazon/);vm.runInContext("{const ac=segmentAccess('retail');if(ac.value('Amazon',ac.last('Amazon'),'gmv')!==null||ac.baseline('Amazon',['Amazon','EBAY','SHOP'],'sellerGrowth')!==null)throw Error('mixed scope');amazonPeerLens='ads';render();}",ctx);page=nodes.get('panel').innerHTML;assert.match(page,/Google Ads/);assert.match(page,/Walmart retail media/);assert.match(page,/peer-scatter/);vm.runInContext("amazonPeerLens='consolidated';render();",ctx);assert.doesNotMatch(nodes.get('panel').innerHTML,/Growth versus valuation map/);vm.runInContext("symbol='NVDA';render();",ctx);assert.doesNotMatch(nodes.get('panel').innerHTML,/data-amzn-lens/);});

test('peer chart coverage requires focus and two peers; retail rows require two observations',()=>{const {ctx,nodes}=load();vm.runInContext("{const mk=(id,dates,vals)=>({name:id,x:dates,y:vals});const dates=['2026-03-31','2026-06-30','2026-09-30'];const a=mk('A',dates,[1,2,3]),b=mk('B',dates,[2,3,4]),c=mk('C',dates,[3,null,5]);if(peerTrendCoverage([a,b,c],'A').length!==3||peerTrendCoverage([a,b],'A').length!==0||peerTrendCoverage([b,c],'A').length!==0||peerTrendCoverage([a,b,mk('C',dates,[null,null,4])],'A').length!==0)throw Error('trend coverage');if(!peerScatterReady({points:[{id:'A'},{id:'B'},{id:'C'}]},'A')||peerScatterReady({points:[{id:'A'},{id:'B'}]},'A')||peerScatterReady({points:[{id:'B'},{id:'C'},{id:'D'}]},'A'))throw Error('scatter coverage');symbol='AMZN';tab='Peers';amazonPeerLens='retail';render();}",ctx);let page=nodes.get('panel').innerHTML;assert.doesNotMatch(page,/id="peer-scatter"|id="peer-trend-chart"|GROWTH VS BUSINESS ECONOMICS|RELATIVE FUNDAMENTAL MOMENTUM|Chart hidden|id="peer-x"|id="peer-trend"/);assert.match(page,/Marketplace \/ merchant GMV/);assert.match(page,/Online \/ eCommerce sales growth/);assert.doesNotMatch(page,/US marketplace sales growth · Walmart|Paid-unit growth · Amazon|Global membership fee growth/);vm.runInContext("amazonPeerLens='ads';render();",ctx);assert.match(nodes.get('panel').innerHTML,/id="peer-scatter"/);assert.doesNotMatch(nodes.get('panel').innerHTML,/id="peer-trend-chart"/);vm.runInContext("amazonPeerLens='retail';segmentAccess('retail').st.enabled=['WMT'];render();",ctx);page=nodes.get('panel').innerHTML;assert.doesNotMatch(page,/<th scope="row">(?:Seller \/ merchant service revenue · different scopes|Marketplace \/ merchant GMV)/);assert.match(page,/<th scope="row">Online \/ eCommerce sales growth/);});

test('compact dashboard shares analytical evidence and omits empty comparison sections',()=>{const {ctx,nodes}=load();vm.runInContext("{symbol='AMZN';data={stocks:{AMZN:{quarterly:[{period:'2026-09-30',cash:100e9,debt:257.72e9}],annual:[],quote:{},prices:[]}}};tab='Overview';render();const a=overviewInsights('AMZN',get('AMZN'),latest('AMZN'));if(!a.priority.some(f=>f.target==='Financial risk')||!a.priority.some(f=>f.target==='Fundamentals')||!a.priority.some(f=>f.target==='Business Drivers'))throw Error(JSON.stringify(a.priority));}",ctx);let page=nodes.get('panel').innerHTML;assert.match(page,/What deserves your attention/);assert.doesNotMatch(page,/RULE-BASED SNAPSHOT|comparable checks · not a risk rating/);vm.runInContext("tab='Financial risk';render();",ctx);page=nodes.get('panel').innerHTML;assert.match(page,/<details class="risk-section risk-method"><summary>Risk evolution tracker/);assert.match(page,/Scheduled contractual payments/);assert.doesNotMatch(page,/Risks beneath the surface/);vm.runInContext("tab='Thesis & catalysts';render();",ctx);page=nodes.get('panel').innerHTML;assert.match(page,/<details class="risk-method"><summary>Add dated catalyst/);assert.match(page,/<details class="risk-method"><summary>Add research review/);});

test('integrated valuation uses dated market observations and preserves current versus historical values',()=>{const {ctx,nodes}=load();vm.runInContext("{symbol='AMZN';tab='Fundamentals';frequency='quarterly';const hist=[{date:'2025-09-26',price:100,eps:5,pe:20},{date:'2026-06-26',price:120,eps:6,pe:20,market_cap_proxy:1200,fcf:60,fcf_period:'2026-03-31',shares_period:'2026-04-01'},{date:'2026-07-03',price:180,eps:6,pe:30},{date:'2026-09-25',price:150,eps:5,pe:30}];data={stocks:{AMZN:{quarterly:[{period:'2026-09-30'},{period:'2026-06-30'}],annual:[{period:'2026-06-30'}],quote:{lastClose:200,trailingPE:40,date:'2026-11-25'},prices:[],valuation_history:hist}}};if(valuationAt(hist,'2026-06-30').date!=='2026-06-26'||valuationAt(hist,'2026-06-15')!==null||historicalValValue('yield',hist[1],hist)!==5)throw Error('point in time');render();}",ctx);let page=nodes.get('panel').innerHTML;assert.match(page,/id="valuation-table"/);assert.match(page,/data-valuation-field="pe"/);assert.match(page,/Latest YoY \/ current/);assert.match(page,/40x/);assert.match(page,/20x/);assert.doesNotMatch(page,/data-target="Valuation"/);vm.runInContext("frequency='annual';render();",ctx);assert.match(nodes.get('panel').innerHTML,/data-valuation-field="pe"/);vm.runInContext("symbol='OKLO';render();",ctx);assert.doesNotMatch(nodes.get('panel').innerHTML,/data-valuation-field="pe"/);});

test('new screening tickers render automatic tabs without company-specific snapshots',()=>{const {ctx,nodes}=load();vm.runInContext("{const meta={name:'Example Semiconductor',sector:'Technology',industry:'Semiconductors',profile:'semiconductor',currency:'USD',cik:123};const mk=(s)=>({screening:s==='TEST',metadata:{...meta,name:s},quarterly:[{period:'2026-09-30',revenue:100,operating_profit:20,cash:50,debt:20,inventory:10,receivables:10}],annual:[],quote:{trailingPE:20},prices:[]});data={stocks:{TEST:mk('TEST'),AMD:mk('AMD'),AVGO:mk('AVGO')},screening_requests:{TEST:'available'}};registerScreeningStocks();select('TEST');if(!screeningTabs('TEST').includes('Peers')||screeningTabs('TEST').includes('Business Drivers')||broker('TEST'))throw Error('profile');for(const t of screeningTabs('TEST')){tab=t;render();if(!el('panel').innerHTML)throw Error(t);}data.stocks.BANK={...mk('BANK'),screening:true,metadata:{...meta,profile:'bank',industry:'Banks - Regional'}};data.screening_requests.BANK='available';registerScreeningStocks();select('BANK');if(!broker('BANK')||valTableKeys.BANK.includes('pfcf')||screeningTabs('BANK').includes('Peers'))throw Error('bank');tab='Financial risk';render();if(el('panel').innerHTML.includes('Interest service coverage'))throw Error('generic bank risk');el('ticker-search').value='AAPL';tickerSearch();}",ctx);assert.match(nodes.get('ticker-feedback').innerHTML,/Request AAPL on GitHub/);});

test('reviewed evidence enriches existing cards without changing reported metrics',()=>{const {ctx,nodes}=load();vm.runInContext("{const event={id:'test-fuel',date:'2026-11-12',headline:'Fuel contract confirmed',fact:'Binding procurement contract',kind:'confirmed',materiality:'high',state:'active',structural:true,sources:[{label:'Issuer',url:'https://example.com/fuel'}],impacts:[{symbol:'OKLO',tab:'driver',key:'Fuel & physical deployment',title:'Fuel progress',tone:'positive',implication:'Delivery remains pending',overview:true},{symbol:'OKLO',tab:'thesis',key:'Fuel readiness',title:'Fuel readiness',tone:'positive',implication:'Contract not fuel delivery',assessment:{status:'support',reason:'Binding contract improves readiness'}},{symbol:'OKLO',tab:'risk',key:'runway',title:'Funding exposure',tone:'mixed',implication:'Funding still unquantified'},{symbol:'OKLO',tab:'fundamental',key:'capex',title:'Cash impact',tone:'mixed',implication:'Future cash effect unquantified'}]};const old={...event,id:'old',date:'2026-09-01',structural:false,headline:'Older evidence',impacts:[event.impacts[0]]};if(!setResearchEvidence({schema_version:1,reviewed_at:'2026-11-26',events:[event,old,{...event,id:'bad',sources:[{label:'bad',url:'javascript:alert(1)'}]}]}))throw Error('schema');if(researchEvidence.events.length!==2)throw Error('unsafe source');symbol='OKLO';const check=thesisCheck(symbol,get(symbol),thesisConfig.OKLO.checks.find(c=>c[0]==='Fuel readiness'));if(check.status!=='support'||check.value!==thesisCheckReported(symbol,get(symbol),thesisConfig.OKLO.checks.find(c=>c[0]==='Fuel readiness')).value)throw Error('status or metric');if(evidenceOverview(symbol).length!==1)throw Error('duplicate overview');tab='Business Drivers';render();if(!el('panel').innerHTML.includes('Fuel contract confirmed')||!el('panel').innerHTML.includes('Supporting evidence'))throw Error('driver evidence');tab='Financial risk';render();if(!el('panel').innerHTML.includes('Funding still unquantified'))throw Error('risk evidence');tab='Fundamentals';render();if(!el('panel').innerHTML.includes('Future cash effect unquantified'))throw Error('forward evidence');tab='Thesis & catalysts';render();if(!el('panel').innerHTML.includes('Supports thesis · updated'))throw Error('thesis status');symbol='AMZN';render();if(el('panel').innerHTML.includes('Fuel contract confirmed'))throw Error('cross-symbol leak');}",ctx);});

test('news entries distinguish source facts and research assessment',()=>{const {ctx}=load();vm.runInContext("{const x={tone:'positive',implication:'Analysis',event:{date:'2026-11-26',kind:'confirmed',state:'active',headline:'Event',fact:'Fact',sources:[]}};const h=evidenceItem(x);if(!h.includes('research-news-icon')||!h.includes('NEWS ·')||!h.includes('Reported:')||!h.includes('Our assessment:'))throw Error('missing news marker');}",ctx);});

test('growth valuation uses matched fiscal growth and withholds unreliable classification',()=>{const {ctx}=load();vm.runInContext("{const r={eps:6,eps_prior1:5,eps_prior3:3,op:120,op_prior1:100,op_prior3:60,pretax:100,pretax_prior1:90,pretax_prior3:50,tax:20,tax_prior1:18,tax_prior3:10,pe:20};const a=growthRatio('peg',r,20,'AMZN'),b=growthRatio('peg3',r,20,'AMZN'),c=growthRatio('peop',r,20,'AMZN');if(Math.abs(a.value-1)>1e-8||Math.abs(b.value-20/(100*(Math.cbrt(2)-1)))>1e-8||Math.abs(c.value-1)>1e-8||c.tone!=='muted'||a.tone!=='peg-reasonable')throw Error('ratio');if(growthRatio('peg',{...r,eps_prior1:.01},20,'AMZN').tone!=='muted'||growthRatio('peg',{...r,eps_prior1:-1},20,'AMZN').status!=='N/A'||growthRatio('peg',{...r,tax:40},20,'AMZN').tone!=='muted')throw Error('quality screen');if(valTableKeys.AMZN.includes('pfcf')||valTableKeys.HOOD.includes('peop')||valTableKeys.OKLO.includes('peg')||!valTableKeys.IBKR.includes('peg3'))throw Error('scope');if(historicalValValue('peg',r,[],'AMZN')!==a.value)throw Error('historical');}",ctx);});

test('the shipped catalyst evidence renders for all seven companies',()=>{
 const {ctx,nodes}=load();
 ctx.payload=JSON.parse(fs.readFileSync('site/data/research-evidence.json','utf8'));
 assert.ok(vm.runInContext('setResearchEvidence(payload)',ctx));
 assert.equal(vm.runInContext('researchEvidence.catalysts.length',ctx),ctx.payload.catalysts.length);
 for(const {symbol,headline} of ctx.payload.catalysts.filter(c=>c.state==='active')){
  ctx.ticker=symbol;
  vm.runInContext("symbol=ticker;tab='Thesis & catalysts';render()",ctx);
  assert.ok(nodes.get('panel').innerHTML.includes(headline),symbol);
 }
 assert.equal(new Set(ctx.payload.catalysts.map(c=>c.symbol)).size,7);
 vm.runInContext("symbol='IBKR';render()",ctx);
 const page=nodes.get('panel').innerHTML;
 assert.match(page,/\+34%/);
 assert.match(page,/2026-12-09 · Fed decision \(scheduled\)/);
 assert.match(page,/Q4 results in January 2027 \(expected\)/);
 assert.match(page,/Your dated catalysts/);
});

test('catalysts keep old active evidence and ignore resolved, future and unsafe updates',()=>{
 const {ctx,nodes}=load();
 const payload=JSON.parse(fs.readFileSync('site/data/research-evidence.json','utf8'));
 const row=payload.catalysts.find(c=>c.key==='Monthly brokerage metrics');
 ctx.payload={...payload,reviewed_at:'2027-05-01',catalysts:[
  row,
  {...row,date:'2027-01-01',headline:'Superseded record',state:'superseded'},
  {...row,date:'2027-02-01',headline:'Resolved record',state:'resolved'},
  {...row,date:'2027-03-01',headline:'Unsafe record',sources:[{label:'Unsafe',url:'javascript:alert(1)'}]},
  {...row,date:'2027-04-01',headline:'Unverified schedule',next:{label:'Missing source',status:'scheduled',date:'2027-06-01'}},
  {...row,date:'2027-06-01',headline:'Future record'}
 ]};
 vm.runInContext("setResearchEvidence(payload);tab='Thesis & catalysts';render()",ctx);
 assert.match(nodes.get('panel').innerHTML,/October brokerage metrics/);
 assert.doesNotMatch(nodes.get('panel').innerHTML,/Superseded record|Resolved record|Unsafe record|Unverified schedule|Future record/);
 ctx.payload.catalysts.push({...row,date:'2027-04-30',headline:'Newer sourced report'});
 vm.runInContext('setResearchEvidence(payload);render()',ctx);
 assert.match(nodes.get('panel').innerHTML,/Newer sourced report/);
 assert.doesNotMatch(nodes.get('panel').innerHTML,/October brokerage metrics/);
 delete ctx.payload.catalysts;
 vm.runInContext('setResearchEvidence(payload);render()',ctx);
 assert.match(nodes.get('panel').innerHTML,/No sourced development yet/);
});

test('Overview shows filing-backed ownership rows and excludes planned sales from clusters',()=>{
 const {ctx,nodes}=load();
 ctx.payload=JSON.parse(fs.readFileSync('site/data/research-evidence.json','utf8'));
 vm.runInContext("setResearchEvidence(payload);symbol='AMZN';render()",ctx);
 let page=nodes.get('panel').innerHTML;
 assert.match(page,/Ownership Activity/);
 assert.match(page,/Huttenlocher/);
 assert.match(page,/Planned trade/);
 assert.doesNotMatch(page,/distinct insiders/);
 vm.runInContext("symbol='OKLO';render()",ctx);
 page=nodes.get('panel').innerHTML;
 assert.match(page,/Global X Management/);
 assert.match(page,/5\.08%/);
 assert.match(page,/Market-wide 13F comparison has yet to be compiled/);
});

test('all configured catalyst and thesis cards have sourced research evidence',()=>{
 const {ctx,nodes}=load();
 ctx.payload=JSON.parse(fs.readFileSync('site/data/research-evidence.json','utf8'));
 assert.ok(vm.runInContext('setResearchEvidence(payload)',ctx));
 assert.equal(vm.runInContext('researchEvidence.events.length',ctx),ctx.payload.events.length);
 vm.runInContext(`for(const [ticker,config] of Object.entries(thesisConfig)){
  for(const [key] of config.catalysts){
   const records=researchEvidence.catalysts.filter(c=>c.symbol===ticker&&c.key===key&&c.state==='active');
   if(records.length!==1)throw Error(ticker+' catalyst '+key);
  }
  for(const [key] of config.checks){
   if(!evidenceMatches(ticker,'thesis',key).length)throw Error(ticker+' thesis evidence '+key);
  }
 }`,ctx);
 vm.runInContext("symbol='KTOS';tab='Thesis & catalysts';render()",ctx);
 const page=nodes.get('panel').innerHTML;
 assert.match(page,/Gulf Space Technology awards gateway contract/);
 assert.match(page,/Growth consumed working capital and capex/);
 assert.match(page,/funded share fell from about 83.4% to 78.0%/);
});

test('reviewed watchlist companies show ownership records and manager samples remain scoped',()=>{
 const {ctx,nodes}=load();
 ctx.payload=JSON.parse(fs.readFileSync('site/data/research-evidence.json','utf8'));
 vm.runInContext('setResearchEvidence(payload)',ctx);
 for(const ticker of ['IBKR','HOOD','AMZN','GOOGL','NVDA','KTOS','OKLO']){
  const snapshot=ctx.payload.ownership[ticker];
  ctx.ticker=ticker;
  vm.runInContext("symbol=ticker;render()",ctx);
  assert.ok(nodes.get('panel').innerHTML.includes(snapshot.insiders[0].name));
 }
 const configured=JSON.parse(fs.readFileSync('src/stock_watchlists.json','utf8')).stocks;
 const pendingOwnership=new Set(['ASML.AS','CIBR','LRCX','WCBR']);
 for(const ticker of Object.keys(configured)){
  if(!pendingOwnership.has(ticker))assert.ok(ctx.payload.ownership[ticker],ticker+' ownership');
 }
 vm.runInContext("symbol='KTOS';render()",ctx);
 const page=nodes.get('panel').innerHTML;
 assert.match(page,/\+581,876 shares/);
 assert.match(page,/Prior quarter/);
 assert.match(page,/Market-wide 13F comparison has yet to be compiled/);
});

test('published peers are searchable during a registry outage without joining the watchlist',()=>{
 const {ctx,nodes}=load();
 vm.runInContext(`
  data={screening_registry_available:false,stocks:{SCHW:{
   metadata:{name:'Charles Schwab',currency:'USD',profile:'financial'},
   quote:{currency:'USD'},quarterly:[{period:'2026-09-30'}]
  }}};
  registerScreeningStocks();
  el('ticker-search').value='schw';
  tickerSearch();
 `,ctx);
 assert.match(nodes.get('company').textContent,/SCHW · Charles Schwab/);
 assert.doesNotMatch(nodes.get('watchlist').innerHTML,/data-symbol="SCHW"/);
 assert.equal(nodes.get('ticker-feedback').textContent,'');
});

test('TradingView groups preserve duplicate membership and keep missing-data stocks selectable',()=>{
 const {ctx,nodes}=load();
 vm.runInContext(`
  data={watchlists:{P1:['AAPL','IBKR'],Stablish:['AAPL','AMD']},stocks:{
   AAPL:{quarterly:[],annual:[],quote:{},prices:[],metadata:{name:'Apple',tradingviewSymbol:'NASDAQ:AAPL'}},
   AMD:{quarterly:[],annual:[],quote:{},prices:[],metadata:{name:'AMD',tradingviewSymbol:'NASDAQ:AMD'}}
  }};
  registerScreeningStocks();
  select('AAPL');
 `,ctx);
 const watchlist=nodes.get('watchlist').innerHTML;
 assert.equal((watchlist.match(/data-symbol="AAPL"/g)||[]).length,2);
 assert.match(watchlist,/aria-label="P1"/);
 assert.match(watchlist,/aria-label="Stablish"/);
 assert.match(nodes.get('company').textContent,/AAPL · Apple/);
 assert.match(nodes.get('tradingview-link').href,/NASDAQ%3AAAPL/);
 assert.match(watchlist,/aria-label="Other research"/);
});

test('filing-backed profiles render drivers, risks and thesis for every newly researched ticker',()=>{
 const {ctx,nodes}=load();
 ctx.payload=JSON.parse(fs.readFileSync('site/data/company-research.json','utf8'));
 assert.ok(vm.runInContext('setCompanyResearch(payload)',ctx));
 assert.equal(vm.runInContext('Object.keys(companyResearch).length',ctx),Object.keys(ctx.payload.companies).length);
 for(const [ticker,profile] of Object.entries(ctx.payload.companies)){
  ctx.ticker=ticker;
  vm.runInContext(`
   data.stocks[ticker]={metadata:{name:ticker},quote:{},quarterly:[],annual:[],prices:[]};
   data.watchlists={Test:[ticker]};
   registerScreeningStocks();
   select(ticker);
  `,ctx);
  for(const [section,heading] of [['Business Drivers',profile.drivers[0][0]],['Financial risk','Company-specific risks'],['Thesis & catalysts','Catalyst watchlist']]){
   ctx.section=section;
   vm.runInContext('tab=section;render()',ctx);
   assert.ok(nodes.get('panel').innerHTML.includes(heading),ticker+' '+section);
   assert.match(nodes.get('panel').innerHTML,/Primary source/);
  }
 }
});
