'use strict';
const M={
IBKR:{name:'Interactive Brokers',industry:'Global brokerage',question:'Can customer and asset growth sustain earnings through rate cycles?',peers:['SCHW','HOOD'],kpis:['Customer accounts / equity / net deposits','DARTs and commissions per account','Net interest margin and interest income mix','Regulatory capital coverage and excess','Margin loans / customer equity; bad debt','Noncontrolling ownership and tax receivable agreements'],risks:['Rate sensitivity and falling net interest margins','Gap risk and customer margin loan losses','Governance and ownership exchanges'],sec:'1381197'},
HOOD:{name:'Robinhood',industry:'Diversified fintech',question:'Can diversification sustain growth without weakening credit quality?',peers:['IBKR','SCHW','SOFI','COIN'],kpis:['Funded customers / net deposits / assets','Gold subscribers and revenue per user','Options / crypto / equities / event contracts','Credit card balances, delinquencies, charge-offs','FICO mix and card credit provisions','Investment gains/losses versus operating profit'],risks:['Unsecured credit losses and portfolio seasoning','Speculative trading cyclicality','Non-operating gains and tax distortions'],sec:'1783879'},
AMZN:{name:'Amazon',industry:'Retail, advertising & cloud',question:'Will AI investment deliver capital returns and restore cash generation?',peers:['MSFT','GOOGL','WMT','META'],kpis:['AWS revenue growth and backlog','AWS operating margin and profit / average segment assets','North America and International retail margins','Advertising growth','Operating cash flow versus capex and leases','Depreciation, debt and financing costs'],risks:['Capex outpacing AWS operating profit','Infrastructure commitments and depreciation','Retail margin reversal'],sec:'1018724'},
GOOGL:{name:'Alphabet',industry:'Search, advertising & cloud',question:'Can search economics withstand AI disruption while cloud scales?',peers:['MSFT','META','AMZN'],kpis:['Search and YouTube revenue','Cloud growth / backlog / segment margin','Services operating margin','Traffic acquisition costs / revenue','AI capex and depreciation','Other Bets losses'],risks:['AI search cannibalisation and serving costs','Antitrust and distribution remedies','Cloud capital productivity'],sec:'1652044'},
NVDA:{name:'NVIDIA',industry:'AI semiconductor infrastructure',question:'Can accelerated computing demand and margins remain durable?',peers:['AMD','AVGO'],kpis:['Data center compute and networking revenue','Gross margin and incremental margin','Customer concentration','Inventory and receivables','Purchase commitments and supply capacity','Export restrictions and customer financing'],risks:['Hyperscaler capex slowdown','Inventory and receivables outpacing revenue','Customer concentration and export controls'],sec:'1045810'},
KTOS:{name:'Kratos Defense',industry:'Defence technology',question:'Can funded backlog turn into profitable production and cash flow?',peers:['AVAV','LHX'],kpis:['Organic and segment revenue growth','Funded versus unfunded backlog','Book-to-bill and contract awards','Segment margins and production ramp','Contract assets and working capital','Capex, SBC and capital raising'],risks:['Fixed-price contract overruns','Unfunded backlog and delayed awards','Cash conversion and financing'],sec:'1069258'},
OKLO:{name:'Oklo',industry:'Advanced nuclear development',question:'Can licensing, deployment and financing converge before material dilution?',peers:['SMR','NNE'],kpis:['NRC licensing milestones','First deployment and construction readiness','Binding contracts versus nonbinding agreements','Contracted MW and fuel procurement','Capital cost per MW and funding commitments','Unrestricted cash, burn and runway'],risks:['Licensing and deployment delays','Nonbinding pipeline not converting','Funding gaps and equity dilution'],sec:'1849056'}};
const tabs=['Overview','Fundamentals','Financial risk','Business KPIs','Valuation','Peers','Thesis & catalysts'];
let data={stocks:{}},symbol='IBKR',tab=tabs[0],frequency='quarterly';
const el=id=>document.getElementById(id);
const fmt=(v,d=1)=>v==null||!Number.isFinite(v)?'—':v.toLocaleString('en-US',{maximumFractionDigits:d});
const money=v=>v==null?'—':(v<0?'−':'')+'$'+fmt(Math.abs(v)>=1e9?Math.abs(v)/1e9:Math.abs(v)/1e6,2)+(Math.abs(v)>=1e9?'B':'M');
const pct=v=>v==null?'—':fmt(v,1)+'%';
const get=s=>data.stocks[s]||{quarterly:[],annual:[],quote:{},prices:[]};
const latest=s=>get(s).quarterly[0]||{};
function previous(rows,latest){if(!latest.period)return {};const target=new Date(latest.period+'T00:00:00Z');target.setUTCFullYear(target.getUTCFullYear()-1);return rows.find(r=>r.period!==latest.period&&Math.abs(new Date(r.period+'T00:00:00Z')-target)<12*86400000)||{};}
function growth(a,b,k){return a[k]!=null&&b[k]>0?100*(a[k]/b[k]-1):null;}
const yoy=(s,k)=>{const q=latest(s),b=previous(get(s).quarterly,q);return growth(q,{[k]:b[k]??get(s).prior_year?.[q.period]?.[k]},k);};
const fields=[['revenue','Revenue'],['gross_profit','Gross profit'],['operating_profit','Operating profit'],['pretax','Pretax profit'],['net_income','Net income (common)'],['eps','Diluted EPS'],['gross_margin','Gross margin'],['operating_margin','Operating margin'],['pretax_margin','Pretax margin'],['ocf','Operating cash flow'],['capex','Capex'],['fcf','Free cash flow'],['sbc','Share-based compensation'],['shares','Diluted average shares'],['assets','Assets'],['equity','Stockholders equity'],['cash','Cash & short-term investments'],['debt','Total debt'],['receivables','Receivables'],['inventory','Inventory']];
const value=(k,v)=>k.includes('margin')?pct(v):k==='eps'?(v==null?'—':'$'+fmt(v,2)):k==='shares'?(v==null?'—':fmt(v/1e6,1)+'M'):money(v);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function table(headers,rows){return '<div class="table-scroll"><table><thead><tr>'+headers.map(h=>'<th>'+esc(h)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(r=>'<tr>'+r.map(c=>'<td>'+esc(c)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';}
function box(title,body){return '<div class="stock-item"><h3>'+esc(title)+'</h3>'+body+'</div>';}
function list(arr){return '<ul>'+arr.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>';}
function chart(id,traces,ytitle){if(!window.Plotly)return;Plotly.react(id,traces,{paper_bgcolor:'transparent',plot_bgcolor:'transparent',font:{color:'#b7c6db'},margin:{l:64,r:18,t:18,b:45},legend:{orientation:'h'},xaxis:{gridcolor:'#28364a'},yaxis:{title:ytitle,gridcolor:'#28364a'},hovermode:'x unified'},{responsive:true,displayModeBar:false});}
function controls(){el('watchlist').innerHTML=Object.keys(M).map(s=>'<button aria-pressed="'+(s===symbol)+'" data-symbol="'+s+'">'+s+'</button>').join('');el('watchlist').querySelectorAll('button').forEach(b=>b.onclick=()=>select(b.dataset.symbol));el('tabs').innerHTML=tabs.map(t=>'<button aria-pressed="'+(t===tab)+'">'+esc(t)+'</button>').join('');el('tabs').querySelectorAll('button').forEach(b=>b.onclick=()=>{tab=b.textContent;render();});}
function select(s){symbol=s;tab='Overview';location.hash=s;render();}
function spark(values,color='#8caee1'){
 const valid=values.filter(Number.isFinite);if(valid.length<2)return '<div class="spark-empty">Insufficient history</div>';
 const lo=Math.min(...valid),hi=Math.max(...valid),span=hi-lo||1;
 let paths=[],seg=[];values.forEach((v,i)=>{if(Number.isFinite(v)){seg.push((4+i*152/Math.max(1,values.length-1)).toFixed(1)+','+(38-(v-lo)/span*32).toFixed(1));}else if(seg.length){paths.push(seg);seg=[];}});if(seg.length)paths.push(seg);
 return '<svg class="mini-spark" viewBox="0 0 160 44" preserveAspectRatio="none" aria-label="Historical trend" role="img"><path d="M4 40H156" stroke="#334154" stroke-dasharray="3 3" fill="none"/>'+paths.filter(p=>p.length>1).map(p=>'<polyline points="'+p.join(' ')+'" fill="none" stroke="'+color+'" stroke-width="2" vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round"/>').join('')+'</svg>';
}
const tone=v=>v==null?'neutral':v>0?'positive':v<0?'negative':'neutral';
const signed=v=>v==null?'—':(v>0?'+':'')+pct(v);
function riskFlags(s){const d=get(s),q=latest(s),b=previous(d.quarterly,q),rg=growth(q,b,'revenue'),out=[];let tested=0;for(const [k,n,ex] of [['receivables','Receivables','Review collections and revenue recognition.'],['inventory','Inventory','Review demand and inventory turns.'],['capex','Capex','Review incremental returns.'],['shares','Diluted shares','Check SBC, offerings and ownership exchanges.'],['debt','Debt','Review financing and maturities.']]){const g=growth(q,b,k);if(g!=null&&rg!=null){tested++;if(g>rg+10)out.push(n+' grew '+pct(g)+' vs revenue '+pct(rg)+'. '+ex);}}const eg=growth(q,b,'eps'),og=growth(q,b,'operating_profit');if(eg!=null&&og!=null){tested++;if(Math.abs(eg-og)>15)out.push('EPS vs operating profit growth diverged by '+fmt(Math.abs(eg-og))+'pp.');}return {out,tested};}

function compareQuarter(rows,r,k){
 const b=previous(rows,r);if(Number.isFinite(b[k]))return b[k];
 const sec=get(symbol).prior_year||{};return sec[r.period]?.[k]??null;
}
function quarterGrowth(rows,r,k){const b=compareQuarter(rows,r,k);return growth(r,{[k]:b},k);}
function fourBars(title,rows,values,formatter,caption){
 const all=values.filter(Number.isFinite),lo=Math.min(0,...all),hi=Math.max(0,...all),span=hi-lo||1;
 const y=v=>12+(hi-v)/span*70,zero=y(0);
 const slots=Array.from({length:4},(_,i)=>{const idx=i-(4-rows.length);return idx<0?{label:'—',v:null}:{label:rows[idx].period.slice(0,7),v:values[idx]};});
 return '<button class="quarter-chart" data-target="Fundamentals"><span class="tile-kicker">'+esc(title)+'<span>↗</span></span><svg viewBox="0 0 240 106" role="img" aria-label="'+esc(title+' '+slots.map(s=>s.label+': '+(s.v==null?'unavailable':formatter(s.v))).join(', '))+'"><line x1="8" x2="232" y1="'+zero+'" y2="'+zero+'" stroke="#526279" stroke-width="0.7"/>'+slots.map((s,i)=>{const x=33+i*58,valid=Number.isFinite(s.v),yy=valid?y(s.v):zero,top=Math.min(yy,zero),height=Math.max(1,Math.abs(yy-zero));const labelY=valid?(s.v>=0?Math.max(9,top-4):Math.min(92,top+height+10)):Math.max(10,zero-5);return (valid?'<rect x="'+(x-15)+'" y="'+top+'" width="30" height="'+height+'" rx="2" fill="'+(s.v<0?'#e88c92':i===3?'#70d5bd':'#4f8194')+'"/>':'<line x1="'+(x-8)+'" x2="'+(x+8)+'" y1="'+zero+'" y2="'+zero+'" stroke="#68788e" stroke-dasharray="2 3"/>')+'<text x="'+x+'" y="'+labelY+'" text-anchor="middle" font-size="10" fill="#dce6f5">'+esc(valid?formatter(s.v):'—')+'</text><text x="'+x+'" y="103" text-anchor="middle" font-size="9" fill="#91a4bf">'+esc(s.label)+'</text>';}).join('')+'</svg><span class="chart-caption">'+esc(caption)+'</span></button>';
}
function momentumChart(rows,all,k,label,levelFmt){
 const rates=rows.map(r=>quarterGrowth(all,r,k));
 // Preserve actual four-quarter visibility where year-ago data or positive bases are unavailable.
 if(rates.filter(Number.isFinite).length>=3)return fourBars(label+' YoY',rows,rates,signed,'Growth vs same fiscal quarter a year ago');
 return fourBars(label,rows,rows.map(r=>r[k]??null),levelFmt,'Quarterly levels · YoY history incomplete');
}
function assessmentLabel(v,positive,negative){return v==null?'Not assessed':v>0?positive:v<0?negative:'Stable';}
function summaryTile(title,status,detail,target,cls='neutral'){
 return '<button class="summary-tile" data-target="'+esc(target)+'"><span class="tile-kicker">'+esc(title)+'<span>↗</span></span><strong class="'+cls+'">'+esc(status)+'</strong><span class="tile-context">'+esc(detail)+'</span></button>';
}
function median(a){const b=a.filter(Number.isFinite).sort((x,y)=>x-y);return b.length?b.length%2?b[(b.length-1)/2]:(b[b.length/2-1]+b[b.length/2])/2:null;}
function valuationContext(m,p,pre){
 const pe=p.trailingPE>0?p.trailingPE:null,peerValues=m.peers.map(s=>get(s).quote.trailingPE).filter(v=>v>0),med=peerValues.length>=2?median(peerValues):null;
 if(pre||pe==null)return '<div class="valuation-visual"><div class="tile-kicker">VALUATION CONTEXT</div><strong>'+ (pre?'Milestone-based valuation':'P/E not meaningful or unavailable')+'</strong><p>EV / sales '+(p.enterpriseToRevenue>0?fmt(p.enterpriseToRevenue)+'x':'—')+' · P/B '+(p.priceToBook>0?fmt(p.priceToBook)+'x':'—')+'</p><button class="stock-action" data-target="Valuation">Explore valuation ↗</button></div>';
 const delta=med?100*(pe/med-1):null;
 if(!med)return '<div class="valuation-visual"><div class="tile-kicker">VALUATION CONTEXT</div><strong>'+fmt(pe)+'x trailing P/E</strong><p>Not enough profitable peers for a comparison. Historical P/E range not available.</p><button class="stock-action" data-target="Valuation">Explore valuation ↗</button></div>';
 const max=Math.max(pe,med,...peerValues)*1.12,x=v=>20+v/max*260,mid=x(med),cur=x(pe);
 return '<div class="valuation-visual"><div class="tile-kicker">VALUATION CONTEXT <span>PEER BENCHMARK</span></div><strong>'+fmt(pe)+'x <span class="valuation-sub">vs '+fmt(med)+'x peer median</span></strong><svg viewBox="0 0 300 76" role="img" aria-label="Trailing P/E compared with peer median"><rect x="20" y="25" width="260" height="7" rx="3" fill="#344259"/><line x1="'+mid+'" x2="'+mid+'" y1="15" y2="41" stroke="#aabbd0" stroke-width="1.5"/><circle cx="'+cur+'" cy="28.5" r="5.5" fill="#e8b365"/><text x="'+mid+'" y="11" text-anchor="middle" font-size="9" fill="#aabbd0">Peer median</text><text x="'+cur+'" y="54" text-anchor="middle" font-size="10" fill="#e8b365">Current</text><text x="20" y="44" font-size="9" fill="#91a4bf">0x</text><text x="280" y="44" font-size="9" text-anchor="end" fill="#91a4bf">'+fmt(max,0)+'x</text></svg><p>'+fmt(Math.abs(delta))+'% '+(delta>=0?'above':'below')+' peer median · '+peerValues.length+' profitable peers. Not fair value; historical P/E pending.</p><button class="stock-action" data-target="Valuation">Explore valuation ↗</button></div>';
}
function finding(title,detail,target,tone='neutral'){return {title,detail,target,tone};}
function overviewPanel(panel,m,d,q,p,source){
 const all=d.quarterly,prev=previous(all,q);
 const rg=quarterGrowth(all,q,'revenue'),og=quarterGrowth(all,q,'operating_profit'),eg=quarterGrowth(all,q,'eps');
 const last=all[1]||{},prg=quarterGrowth(all,last,'revenue'),diff=rg!=null&&prg!=null?rg-prg:null;
 const margin=q.operating_margin??null,marginChange=margin!=null&&prev.operating_margin!=null?margin-prev.operating_margin:null;
 const rr=riskFlags(symbol);
 const pre=symbol==='OKLO',pe=p.trailingPE>0?p.trailingPE:null;
 const peerPE=m.peers.map(s=>get(s).quote.trailingPE).filter(v=>v>0),med=peerPE.length>=2?median(peerPE):null;
 const mom=diff==null?'Not assessed':diff>2?'Accelerating':diff<-2?'Slowing':'Broadly stable';
 const growthLabel=pre?'Pre-commercial':assessmentLabel(rg,'Growing','Contracting');
 const profitLabel=q.operating_profit==null?'Not assessed':q.operating_profit>0?'Profitable':q.operating_profit<0?'Loss-making':'Break-even';
 const headline=pre?'Commercial execution is the central question.':rg==null&&q.operating_profit==null?'Financial assessment not yet available.':growthLabel+' revenue · '+profitLabel.toLowerCase()+' operations.';
 const findings=[];
 if(rg!=null&&og!=null&&Math.abs(rg-og)>8)findings.push(finding('Operating leverage', 'Operating profit '+signed(og)+' vs revenue '+signed(rg)+' YoY. '+(og<rg?'Profit growth trails sales; review costs and mix.':'Profit growth exceeds sales; review margin drivers.'),'Fundamentals',og<rg?'caution':'positive'));
 if(eg!=null&&og!=null&&Math.abs(eg-og)>15)findings.push(finding('Earnings quality divergence','Reported EPS '+signed(eg)+' vs operating profit '+signed(og)+' YoY. Review taxes and non-operating items.','Financial risk','caution'));
 for(const flag of rr.out){if(flag.startsWith('EPS vs')&&findings.some(f=>f.title==='Earnings quality divergence'))continue;findings.push(finding('Financial anomaly',flag,'Financial risk','caution'));}
 if(diff!=null)findings.push(finding('Revenue momentum',signed(rg)+' YoY vs '+signed(prg)+' in previous quarter ('+(diff>0?'+':'')+fmt(diff)+'pp).','Fundamentals',diff<-2?'caution':diff>2?'positive':'neutral'));
 if(marginChange!=null)findings.push(finding('Operating margin',pct(margin)+' · '+(marginChange>0?'+':'')+fmt(marginChange)+'pp YoY.','Fundamentals',marginChange< -1?'caution':marginChange>1?'positive':'neutral'));
 if(q.fcf!=null&&!['IBKR','HOOD'].includes(symbol))findings.push(finding('Free cash flow',money(q.fcf)+' this quarter. '+(q.fcf<0?'Review cash burn and capital spending.':'Positive cash generation after capex.'),'Fundamentals',q.fcf<0?'caution':'positive'));
 const priority=findings.sort((a,b)=>Number(b.tone==='caution')-Number(a.tone==='caution')).slice(0,4);
 panel.classList.add('overview-panel');
 panel.innerHTML='<div class="overview-caption"><h2>Investment overview</h2><span>'+esc(q.period?'Quarter ended '+q.period:'Financial period unavailable')+'</span></div>'+
 '<div class="assessment-banner"><div class="tile-kicker">BUSINESS ASSESSMENT <span>RULE-BASED SNAPSHOT</span></div><h3>'+esc(headline)+'</h3><p class="assessment-question">'+esc(m.question)+'</p></div>'+
 '<div class="summary-strip">'+
 summaryTile('Growth',growthLabel,rg==null?'Revenue YoY unavailable':'Revenue '+signed(rg)+' YoY','Fundamentals',pre?'neutral':tone(rg))+
 summaryTile('Profitability',profitLabel,margin==null?'Margin unavailable':'Operating margin '+pct(margin),'Fundamentals',tone(q.operating_profit))+
 summaryTile('Momentum',mom,diff==null?'Prior YoY unavailable':(diff>0?'+':'')+fmt(diff)+'pp revenue growth change','Fundamentals',diff==null?'neutral':diff<-2?'caution':diff>2?'positive':'neutral')+
 summaryTile('Financial risk',rr.tested?(rr.out.length?rr.out.length+' flags':'No screen flags'):'Not assessed',rr.tested?rr.tested+' comparable checks · not a risk rating':'Financial footnotes pending','Financial risk',rr.out.length?'caution':'neutral')+
 summaryTile('Valuation',pre?'Milestones':pe==null?'N/A':med?(pe>med?'Above peers':'At/below peers'):'Current P/E',pe?fmt(pe)+'x trailing P/E':'P/E unavailable / not relevant','Valuation',med&&pe&&pe>med?'caution':'neutral')+'</div>'+
 '<section class="attention-section" aria-labelledby="attention-title"><div class="attention-heading"><div><div class="section-kicker">RESEARCH PRIORITIES</div><h2 id="attention-title">What deserves your attention</h2></div><span class="attention-count">'+esc(priority.length?priority.length+' calculated findings':'No comparable findings')+'</span></div>'+
 '<div class="attention-content"><div class="findings-list">'+(priority.length?priority.map(f=>'<button class="finding finding-'+f.tone+'" data-target="'+esc(f.target)+'"><span class="finding-symbol" aria-hidden="true">'+(f.tone==='caution'?'!':f.tone==='positive'?'↑':'•')+'</span><span class="finding-copy"><span class="finding-label">'+(f.tone==='caution'?'NEEDS ATTENTION':f.tone==='positive'?'POSITIVE CHANGE':'OBSERVATION')+'</span><strong>'+esc(f.title)+'</strong><small>'+esc(f.detail)+'</small></span><span class="finding-arrow" aria-hidden="true">›</span></button>').join(''):'<p class="stock-note">Insufficient comparable information for automated findings.</p>')+'</div>'+
 '<aside class="diligence"><div class="tile-kicker">COMPANY-SPECIFIC RISKS TO INVESTIGATE</div>'+list(m.risks)+'<button class="stock-action" data-target="Business KPIs">Business KPIs ↗</button></aside></div></section>'+
 '<div class="valuation-section">'+valuationContext(m,p,pre)+'</div>'+
 '<p class="stock-note">Growth uses positive comparable prior-year values only. Financial figures: standardized Yahoo Finance; compatible prior-year comparatives may use SEC companyfacts. Assessments are mechanical, not investment recommendations or verified filing interpretations.</p>'+source;
 panel.querySelectorAll('[data-target]').forEach(b=>b.onclick=()=>{tab=b.dataset.target;render();el('panel').scrollIntoView({block:'nearest'});});
}


const broker=s=>['IBKR','HOOD'].includes(s);
const isRate=k=>['gross_margin','operating_margin','pretax_margin','roe','roic','tax_rate'].includes(k);
const higherGood=new Set(['revenue','gross_profit','operating_profit','pretax','net_income','eps','gross_margin','operating_margin','pretax_margin','ocf','fcf','roe','roic']);
const lowerGood=new Set(['shares','sbc']);
function num(v){return Number.isFinite(v);}
function change(a,b,k){
 if(!num(a)||!num(b))return null;
 if(isRate(k))return a-b;
 if(b>0&&a>=0)return 100*(a/b-1);
 return null;
}
function changeText(a,b,k){
 if(!num(a)||!num(b))return '—';
 if(!isRate(k)&&b<=0){if(b<0&&a>0)return 'Loss → profit';if(b===0&&a>0)return 'Zero → positive';if(b<0&&a===0)return 'Loss → zero';if(b<0&&a<0)return a>b?'Loss narrows':a<b?'Loss widens':'Flat loss';return 'N/M';}
 const v=change(a,b,k);if(v==null)return a<0&&b>0?'Positive → negative':'—';
 return (v>0?'+':'')+fmt(v,1)+(isRate(k)?'pp':'%');
}
function eligible(k){
 if(broker(symbol)&&['gross_profit','gross_margin','operating_profit','operating_margin','ocf','fcf','roic','shares','sbc'].includes(k))return false;
 return higherGood.has(k)||lowerGood.has(k);
}
function direction(a,b,k){
 if(!num(a)||!num(b))return null;
 const delta=a-b,tol=isRate(k)?0.75:Math.max(Math.abs(b)*0.02, k==='eps'?0.01:1e-9);
 return Math.abs(delta)<=tol?0:Math.sign(delta);
}
function cellTrend(k,dirs){
 if(dirs.length<2||dirs.some(x=>x==null))return 'muted';
 if(dirs.every(x=>x===0))return 'muted';
 if(dirs[0]===0||dirs[1]===0||dirs[0]!==dirs[1])return 'muted';
 if(!eligible(k))return ['debt','receivables','inventory','capex','shares','sbc','tax_rate'].includes(k)&&dirs[0]>0?'investigate':'muted';
 return (lowerGood.has(k)?-dirs[0]:dirs[0])>0?'good':'bad';
}
function periodBase(rows,r,k,annual=false){
 const b=previous(rows,r);
 if(num(b[k]))return b[k];
 return annual?null:(get(symbol).prior_year?.[r.period]?.[k]??null);
}
function consecutive(a,b,annual=false){
 if(!a?.period||!b?.period)return false;
 const days=(new Date(a.period)-new Date(b.period))/86400000;
 return annual?days>=345&&days<=385:days>=70&&days<=105;
}
function columnTrend(rows,i,k,annual=false){
 const a=rows[i],b=rows[i+1],c=rows[i+2];
 if(!consecutive(a,b,annual)||!consecutive(b,c,annual))return 'muted';
 return cellTrend(k,[direction(a[k],b[k],k),direction(b[k],c[k],k)]);
}
function yoyColour(rows,k,annual=false){
 const q=rows[0];if(!q)return 'muted';
 const dir=direction(q[k],periodBase(rows,q,k,annual),k);
 if(dir==null||dir===0)return 'muted';
 // The YoY column is a separate single-period comparison, not a confirmed QoQ trend.
 return cellTrend(k,[dir,dir]);
}
function sumField(rows,k){return rows.length===4&&rows.every(r=>num(r[k]))?rows.reduce((a,r)=>a+r[k],0):null;}
function average(a,b){return num(a)&&num(b)?(a+b)/2:null;}
function invested(r){return num(r?.total_equity)&&num(r?.debt)&&num(r?.cash)?r.total_equity+r.debt-r.cash:null;}
function deriveRows(raw,annual=false){
 return raw.map((r,i)=>{
 const out={...r}, prior=previous(raw,r), window=raw.slice(i,i+4);
 const valid=annual||window.length===4&&window.every((w,j)=>j===0||consecutive(window[j-1],w));
 const n=k=>annual?(r[k]??null):valid?sumField(window,k):null;
 const ni=n('net_income'),eq=average(r.equity,prior.equity);
 if(num(ni)&&eq>0)out.roe=100*ni/eq;
 const tax=n('tax_expense'),pt=n('pretax'),op=n('operating_profit'),ic=average(invested(r),invested(prior));
 if(num(r.tax_expense)&&r.pretax>0)out.tax_rate=100*r.tax_expense/r.pretax;
 if(!broker(symbol)&&num(op)&&op>0&&num(tax)&&pt>0&&tax>=0&&tax<=pt&&ic>0)out.roic=100*op*(1-tax/pt)/ic;
 return out;
 });
}
const extraFields=[['roe','ROE (annual / TTM)'],['roic','ROIC (annual / TTM)'],['tax_rate','Effective tax rate'],['tax_expense','Income tax expense']];
function fundValue(k,v){return isRate(k)?pct(v):value(k,v);}
function trendCell(text,cl='muted',tooltip=''){return '<td class="trend-'+cl+'"'+(tooltip?' title="'+esc(tooltip)+'"':'')+'>'+esc(text)+'</td>';}
const financialGroups=[
 ['Growth & earnings',['revenue','gross_profit','operating_profit','pretax','net_income','eps']],
 ['Profitability & capital efficiency',['gross_margin','operating_margin','pretax_margin','roe','roic']],
 ['Cash flow & investment',['ocf','capex','fcf']],
 ['Balance sheet & financial health',['assets','equity','cash','debt','receivables','inventory']],
 ['Shareholder dilution & tax',['sbc','shares','tax_rate','tax_expense']]
];
function longTermCell(annual,k){
 const a=annual.find(r=>num(r[k])), candidates=a?annual.filter(r=>num(r[k])&&r.period<a.period&&(new Date(a.period)-new Date(r.period))/86400000<=1850):[],b=candidates.at(-1);
 let text='—',cl='muted';
 if(a&&b){
  const years=(new Date(a.period)-new Date(b.period))/86400000/365.2425;
  if(years>=1.8){
   const y=Math.round(years);
   if(isRate(k))text=y+'Y '+changeText(a[k],b[k],k);
   else if(a[k]>0&&b[k]>0){const c=100*(Math.pow(a[k]/b[k],1/years)-1);text=y+'Y '+(c>0?'+':'')+fmt(c,1)+'% C';}
   else text=y+'Y '+changeText(a[k],b[k],k);
   cl=columnTrend(annual,annual.indexOf(a),k,true);
  }
 }
 return trendCell(text,cl,'Actual available fiscal year span; colour uses two latest annual comparisons, not the full-period change');
}
function detailedTable(rows,annualView,annualRows){
 const named=Object.fromEntries([...fields,...extraFields]);
 return '<div class="table-scroll"><table class="fund-table grouped-financials"><thead><tr>'+['Metric','Long-term trend','Latest YoY',...rows.map(r=>r.period)].map(n=>'<th>'+esc(n)+'</th>').join('')+'</tr></thead>'+
 financialGroups.map(([heading,keys])=>'<tbody><tr class="financial-group"><th scope="rowgroup" colspan="'+(3+rows.length)+'">'+esc(heading)+'</th></tr>'+keys.map(k=>'<tr data-financial-field="'+esc(k)+'"><th scope="row">'+esc(named[k])+'</th>'+longTermCell(annualRows,k)+trendCell(changeText(rows[0]?.[k],rows[0]?periodBase(rows,rows[0],k,annualView):null,k),yoyColour(rows,k,annualView),'Single YoY comparison, independent of period trend')+rows.map((r,i)=>trendCell(fundValue(k,r[k]),columnTrend(rows,i,k,annualView),'Two consistent '+(annualView?'annual':'quarter-over-quarter')+' changes required')).join('')+'</tr>').join('')+'</tbody>').join('')+'</table></div>';
}

const qualityDisclosures={
 AMZN:{period:'2026-09-30',url:'https://ir.aboutamazon.com/news-release/news-release-details/2026/Amazon-com-Announces-Third-Quarter-Results/',q:{operating_profit:28076e6,pretax:26869e6,net_income:20685e6,total_net_income:20685e6,tax_expense:6184e6,eps:1.89,interest_expense:1691e6},prior:{operating_profit:17422e6,pretax:28170e6,net_income:21187e6,total_net_income:21187e6,tax_expense:6983e6,eps:1.95,interest_expense:538e6},ttm:{ocf:168300e6,total_net_income:134779e6,net_capex:210657e6,fcf:-42357e6,old_ocf:130700e6,old_fcf:14788e6},note:'Management attributes the decline in reported net income primarily to $9.5B of pre-tax Anthropic investment gains in Q3 2025.'}
};

function qualitySection(qrows){
 const s=symbol,d=get(s),q=qrows[0]||{},prev=previous(qrows,q),snapshot=qualityDisclosures[s],disc=snapshot?.period===q.period?snapshot:null,financial=broker(s),findings=[],missing=[];
 const v=k=>disc&&num(disc.q[k])?disc.q[k]:q[k],p=k=>disc&&num(disc.prior[k])?disc.prior[k]:num(prev[k])?prev[k]:d.quality_prior?.[q.period]?.[k]??d.peer_prior?.[q.period]?.[k]??periodBase(qrows,q,k);
 const g=k=>num(v(k))&&p(k)>0?100*(v(k)/p(k)-1):null,delta=k=>num(v(k))&&num(p(k))?v(k)-p(k):null,dm=x=>(x>=0?'+':'−')+money(Math.abs(x)),pp=x=>(x>=0?'+':'')+fmt(x,1)+'pp';
 const t=k=>ttmAt(qrows,0,k),core=financial?'pretax':'operating_profit',label=financial?'Pretax profit':'Operating profit',eg=g('eps'),og=g(core),rg=g('revenue'),sg=g('shares');
 const cfg=kpiData[s],matched=!!q.period&&cfg?.period===q.period,kr=id=>matched?cfg.rows.find(r=>r.id===id):null,kv=id=>kr(id)?.values[3],ky=id=>{const r=kr(id);return r?kpiDelta(r,r.values[3],r.values[4]):null;},kf=id=>{const r=kr(id);return r?kpiFmt(r,r.values[3]):'—';};
 const source=matched?cfg.sources[0]?.[1]:'',disclosure=disc?.url||'',add=(id,title,metric,metricLabel,bullets,conclusion,cls,priority,url='')=>findings.push({id,title,metric,metricLabel,bullets:bullets.filter(Boolean).slice(0,3),conclusion,cls,priority,url});
 const tr=num(v('tax_expense'))&&v('pretax')>0?100*v('tax_expense')/v('pretax'):q.tax_rate,oldTr=num(p('tax_expense'))&&p('pretax')>0?100*p('tax_expense')/p('pretax'):p('tax_rate'),taxShift=num(tr)&&num(oldTr)&&Math.abs(tr-oldTr)>5;
 const taxImpact=taxShift&&num(v('pretax'))?(oldTr-tr)*v('pretax')/100:null;
 const pt=delta('pretax'),op=delta('operating_profit'),tax=delta('tax_expense'),ni=delta('net_income');
 // A material EPS/core-profit divergence or tax shift gets one earnings-quality card.
 if((num(eg)&&num(og)&&Math.abs(eg-og)>15)||taxShift){
  const bullets=[],diverge=num(eg)&&num(og)&&Math.abs(eg-og)>15;
  if(num(eg))bullets.push('Diluted EPS '+signed(eg)+' YoY'+(num(og)?' vs '+label.toLowerCase()+' '+signed(og):''));
  if(disc)bullets.push('Prior-year Anthropic investment gains: $9.5B pre-tax (issuer disclosure)');
  const bridge=!financial&&num(pt)&&num(op)?pt-op:null;
  if(num(bridge))bullets.push('Net non-operating contribution changed by '+dm(bridge));
  if(taxShift){const taxLine='Effective tax rate '+pct(oldTr)+' → '+pct(tr)+(num(taxImpact)?' · '+dm(taxImpact)+' profit sensitivity':'');if(bullets.length>=3)bullets[2]=taxLine;else bullets.push(taxLine);}
  else if(num(tax)&&bullets.length<3)bullets.push('Tax expense changed by '+dm(tax));
  else if(num(sg)&&Math.abs(sg)>2&&bullets.length<3)bullets.push('Diluted shares '+signed(sg)+' YoY');
  const known=!!disc||(!financial&&num(bridge)&&num(tax)&&num(ni))||(financial&&num(pt)&&num(tax)&&num(ni));
  const improving=diverge&&og>0&&eg<og;
  const conclusion=(improving?'Core profit growth exceeds reported EPS growth.':diverge?'Reported EPS diverges from core profit.':'Tax-rate changes materially affect reported earnings.')+(disc?' Prior-year investment gains explain the comparison effect.':known?' Arithmetic bridge, not verified underlying causes.':' Full attribution remains unresolved.');
  add('earnings',improving?'Underlying earnings strengthening':taxShift&&!diverge?'Tax-driven earnings change':'Earnings divergence',num(og)?signed(og):pct(tr),num(og)?label+' YoY':'Effective tax rate',bullets,conclusion,improving&&known?'positive':'caution',100,disclosure);
 }else if(s!=='OKLO'&&(!num(eg)||!num(og)))missing.push('Comparable EPS / '+label.toLowerCase()+' growth');
 // Operating leverage is separate only if it adds a material insight.
 const marginKey=financial?'pretax_margin':'operating_margin',margin=v(marginKey),oldMargin=p(marginKey),marginMove=num(margin)&&num(oldMargin)?margin-oldMargin:null;
 if(num(rg)&&num(og)&&(Math.abs(og-rg)>=8||Math.abs(marginMove??0)>=1.5)){
  const spread=og-rg,positive=spread>=8&&(!num(marginMove)||marginMove>=0),negative=spread<=-8||num(marginMove)&&marginMove<=-1.5;
  // Avoid a second profit-growth card when the earnings bridge already conveys the same result,
  // unless the revenue/profit gap or margin change independently adds context.
  if(s!=='AMZN'||!findings.some(f=>f.id==='earnings')||Math.abs(marginMove??0)>=3||Math.abs(spread)>=25){
   add('leverage',positive?'Positive operating leverage':negative?'Profitability lagging sales':'Profit and revenue divergence',num(marginMove)?pp(marginMove):pp(spread),num(marginMove)?(financial?'Pretax':'Operating')+' margin change YoY':label+' growth less revenue growth',['Revenue '+signed(rg)+' YoY',label+' '+signed(og)+' YoY',num(marginMove)?'Margin '+pct(oldMargin)+' → '+pct(margin):null],positive?'Profit growth outpaces sales. Cost and mix attribution requires segment detail.':negative?'Profitability is lagging growth; distinguish costs, mix and execution.':'Profit and sales are moving at different rates.',positive?'positive':negative?'caution':'neutral',72,disclosure);
  }
 }else if(s!=='OKLO'&&num(rg)&&Math.abs(rg)>=10&&!findings.some(f=>f.id==='earnings')){
  add('growth',rg>0?'Material revenue growth':'Revenue contraction',signed(rg),'Revenue YoY',[num(v('revenue'))?'Quarterly revenue '+money(v('revenue')):null,num(og)?label+' '+signed(og)+' YoY':null],rg>0?'Sales expansion is evident; profitability determines its economic quality.':'Sales are contracting; duration and business drivers matter.',rg>0?'positive':'caution',50);
 }
 if(!financial){
  const net=disc?.ttm?.total_net_income??t('total_net_income'),ocf=disc?.ttm?.ocf??t('ocf'),cap=disc?.ttm?.net_capex??t('capex'),fcf=disc?.ttm?.fcf??t('fcf'),cg=g('capex'),oldFcf=disc?.ttm?.old_fcf??ttmAt(qrows,4,'fcf');
  const cashRatio=num(net)&&net>0&&num(ocf)?ocf/net:null;
  if(num(cashRatio)&&(cashRatio<.8||cashRatio>=1.1)){
   const dep=t('depreciation'),wc=t('working_capital'),sbc=t('sbc');
   add('cash',cashRatio<.8?'Weak operating cash conversion':'Strong operating cash generation',fmt(cashRatio,2)+'x','TTM OCF / consolidated net income',['OCF '+money(ocf)+' · net income '+money(net),num(disc?.ttm?.old_ocf)?'OCF prior year '+money(disc.ttm.old_ocf):num(dep)?'Depreciation / amortisation '+money(dep):null,num(wc)?'Working capital change '+money(wc):num(sbc)?'Stock compensation '+money(sbc):null],cashRatio<.8?'Cash generation trails accounting earnings; accrual drivers may still be unresolved.':'Operating cash exceeds reported earnings, before investment spending.',cashRatio<.8?'caution':'positive',85,disclosure);
  }else if(s!=='OKLO'&&(!num(net)||!num(ocf)))missing.push('Matched TTM consolidated income / operating cash flow');
  const capGap=num(cg)&&num(og)&&cg>og+10,negativeFcf=num(fcf)&&fcf<0,fcfDrop=num(fcf)&&num(oldFcf)&&oldFcf>0&&fcf<.75*oldFcf;
  if(s==='OKLO'&&(num(fcf)||num(q.cash))){
   const runway=num(fcf)&&fcf<0&&num(q.cash)?12*q.cash/-fcf:null;
   add('runway','Pre-commercial cash burn',num(runway)?fmt(runway,1)+' mo':num(fcf)?money(fcf):money(q.cash),num(runway)?'TTM cash runway proxy':num(fcf)?'TTM free cash flow':'Cash & short-term investments',[num(q.cash)?'Reported cash '+money(q.cash):null,num(fcf)?'TTM FCF '+money(fcf):null], 'Runway proxy is not committed project funding; licensing and construction remain critical.',negativeFcf?'caution':'neutral',95);
  }else if(capGap||negativeFcf||fcfDrop){
   const bullets=[num(cg)&&num(og)?'Capex '+signed(cg)+' vs operating profit '+signed(og)+' YoY':null,num(ocf)&&num(cap)?'TTM OCF '+money(ocf)+' vs '+(disc?'net cash capex ':'capex ')+money(cap):null];
   const assets=kr('assets');
   if(s==='AMZN'&&assets&&num(assets.values[0])&&num(assets.values[3]))bullets.push('AWS assets '+money(assets.values[0]*1e9)+' → '+money(assets.values[3]*1e9)+' since FY-end');
   else if(num(oldFcf))bullets.push('Prior-year FCF '+money(oldFcf));
   add('capex',negativeFcf?'Capital investment and cash pressure':'Investment outpaces profit',num(fcf)?money(fcf):num(cg)?signed(cg):'—',num(fcf)?'TTM free cash flow':'Quarterly capex growth YoY',bullets,negativeFcf?'Investment exceeds internally generated cash; incremental returns remain unproven.':'Capital intensity is rising; assess incremental operating returns.', 'caution',98,disclosure||source);
  }else if(!num(fcf)&&!num(cg)&&s!=='OKLO')missing.push('Comparable capex / free cash flow');
 }
 if(num(sg)&&Math.abs(sg)>2){
  add('shares',sg>0?'Diluted share count rising':'Diluted share count declining',signed(sg),'Diluted average shares YoY',[num(g('net_income'))?'Common net income '+signed(g('net_income'))+' YoY':null,num(q.sbc)?'Quarterly stock compensation '+money(q.sbc):null,num(q.repurchases)?'Common stock payments '+money(Math.abs(q.repurchases)):num(q.issuance)?'Common stock issuance '+money(q.issuance):null],s==='IBKR'?'Ownership exchanges can affect listed share count without equivalent economic dilution.':sg>0?'Higher weighted shares can dilute per-share results; issuance attribution is incomplete.':'Lower weighted shares can support EPS; buyback attribution requires reconciliation.',sg>0?'caution':'neutral',67);
 }
 // Company-specific operational evidence: matched reporting periods only.
 if(matched){
  if(s==='AMZN'&&num(ky('awsProfit'))&&num(ky('aws'))){
   const incrOp=kr('awsProfit').values[3]-kr('awsProfit').values[4],incrRev=kr('aws').values[3]-kr('aws').values[4],totalOp=delta('operating_profit'),totalRev=delta('revenue');
   add('driver','AWS growth and profitability',signed(ky('awsProfit')),'AWS operating profit YoY',['AWS revenue '+signed(ky('aws'))+' YoY · margin '+kf('awsMargin'),'Incremental AWS revenue '+money(incrRev*1e9)+' · profit '+money(incrOp*1e9),num(totalOp)&&totalOp>0?'AWS contributed '+pct(100*incrOp*1e9/totalOp)+' of consolidated operating profit growth':num(totalRev)&&totalRev>0?'AWS contributed '+pct(100*incrRev*1e9/totalRev)+' of consolidated revenue growth':null],ky('awsProfit')>ky('aws')?'Cloud profit growth exceeds revenue growth; incremental asset returns still need evidence.':'Cloud growth and profit contribution remain central.',ky('awsProfit')>0?'positive':'caution',93,source);
  }
  if(s==='GOOGL'&&num(ky('cloud'))){
   const cr=kr('cloud'),inc=cr.values[3]-cr.values[4],total=delta('revenue');
   add('driver','Cloud and Search growth',signed(ky('cloud')),'Google Cloud revenue YoY',[num(ky('search'))?'Search revenue '+signed(ky('search'))+' YoY':null,'Cloud margin '+kf('cloudMargin')+' · backlog '+kf('backlog'),num(total)&&total>0?'Cloud share of consolidated revenue growth '+pct(100*inc*1e9/total):'Incremental Cloud revenue '+money(inc*1e9)],'Cloud is expanding; Search durability and backlog conversion remain important.','positive',91,source);
  }
  if(s==='NVDA'&&num(ky('dc'))){
   const r=kr('dc'),inc=r.values[3]-r.values[4],total=delta('revenue');
   add('driver','Data Center demand',signed(ky('dc')),'Data Center revenue YoY',['Data Center revenue '+kf('dc'),'Data Center share of total sales '+kf('dcShare'),num(total)&&total>0?'Data Center share of consolidated revenue growth '+pct(100*inc*1e9/total):'Incremental Data Center revenue '+money(inc*1e9)],'AI infrastructure demand drives growth and increases end-market concentration.','positive',91,cfg.sources[r.src]?.[1]||source);
  }
  if(s==='IBKR'&&num(ky('accounts'))&&num(ky('comm'))){
   add('driver','Customer growth vs monetisation',signed(ky('accounts')),'Customer accounts YoY',['Commission revenue '+signed(ky('comm'))+' YoY','Daily revenue trades '+signed(ky('darts'))+' YoY','Net interest margin '+kf('nim')+' vs '+pct(kr('nim').values[4])],ky('accounts')-ky('comm')>10?'Customer growth exceeds commission growth; mix and activity may explain the gap.':'Customer acquisition and monetisation are expanding together.',ky('accounts')-ky('comm')>10?'caution':'positive',92,source);
  }
  if(s==='HOOD'&&num(ky('gold'))){
   add('driver','Subscription and asset gathering',signed(ky('gold')),'Gold subscribers YoY',['Funded customers '+signed(ky('customers'))+' YoY · ARPU '+kf('arpu'),'Quarterly net deposits '+kf('deposits')+' vs '+kpiFmt(kr('deposits'),kr('deposits').values[2])+' prior quarter','Net interest revenue '+signed(ky('nii'))+' YoY'],'Subscription adoption is expanding, but deposits and interest monetisation need monitoring.','neutral',91,source);
  }
  if(s==='KTOS'&&num(kv('bookTTM'))){
   add('driver','Funded demand and backlog',kf('bookTTM'),'TTM book-to-bill',['Total backlog '+kf('backlog'),'Funded backlog '+kf('funded')+' · '+kf('fundedShare')+' of total','Organic revenue growth '+kf('organic')],'Bookings support future production; funded backlog is not recognized revenue.',kv('bookTTM')>1?'positive':'caution',92,source);
  }
  if(s==='OKLO'){
   add('driver','Commercial readiness remains unproven','12 GW','Announced Switch master agreement',['Preliminary safety analysis approved (June 2026)','5 metric tons HALEU awarded; fabrication not established','Binding contracted capacity not verified'],'Announced pipeline and approvals are not operating authorization or funded capacity.','caution',92,source);
  }
 }else if(q.period)missing.push('Current-period company-specific KPI disclosures');
 if(financial){
  const f=filingRisk[s];
  if(f?.date===q.period&&s==='IBKR'){
   add('capital','Regulatory capital and margin lending',fmt(f.capital/f.required,2)+'x','Aggregate regulatory capital coverage',['Capital '+money(f.capital)+' vs required '+money(f.required),'Average margin loans '+signed(100*(f.marginLoans/f.oldMarginLoans-1))+' YoY','Nine-month bad debt '+money(f.badDebt9m)],'Reported capital exceeds requirements; margin lending and gap losses remain relevant.','neutral',88,f.url);
  }
  if(f?.date===q.period&&s==='HOOD'){
   add('credit','Consumer credit expansion',money(f.cardProvision),'Quarterly card credit provision',['Prior-year card provision '+money(f.oldCardProvision),'Past-due loans '+money(f.pastDue)+' of '+money(f.loans),'Write-offs '+money(f.writeOff)+' vs '+money(f.oldWriteOff)+' prior year'],'Credit costs are rising; assess loan growth, seasoning and risk-adjusted product profitability.','caution',99,f.url);
  }
 }
 const chosen=findings.sort((a,b)=>b.priority-a.priority).slice(0,6);
 return (chosen.length?'<div class="fund-findings insight-grid">'+chosen.map(f=>'<article class="fund-finding insight-card '+f.cls+'" data-insight="'+esc(f.id)+'"><div class="fund-finding-top"><strong>'+esc(f.title)+'</strong></div><div class="insight-number">'+esc(f.metric)+'</div><div class="insight-metric">'+esc(f.metricLabel)+'</div><ul class="insight-bullets">'+f.bullets.map(b=>'<li>'+esc(b)+'</li>').join('')+'</ul><div class="insight-conclusion">'+esc(f.conclusion)+'</div>'+(f.url?'<a class="insight-source" href="'+esc(f.url)+'" target="_blank" rel="noopener">Disclosure ↗</a>':'')+'</article>').join('')+'</div>':'<p class="stock-note">No material insight can be established from the available comparable observations.</p>')+(missing.length?'<p class="stock-note insight-missing">Important data gaps: '+esc(missing.join(' · '))+'.</p>':'');
}
function fundamentalsPanel(panel,d,note,source){
 const qrows=deriveRows(d.quarterly),annual=deriveRows(d.annual,true),rows=frequency==='annual'?annual:qrows;
 panel.innerHTML='<h2>Fundamentals</h2><section class="fund-section"><div class="section-kicker">01 / KEY FUNDAMENTAL INSIGHTS</div><h3>What matters in the latest results?</h3>'+qualitySection(qrows)+'<p class="stock-note">Materiality screens prioritise up to six insights; fewer appear when evidence is limited. Quarterly comparisons use compatible prior-year figures; cash metrics use TTM. Arithmetic bridges are not verified causal attribution. Operational disclosures must match the financial period. Screening thresholds are research heuristics, not investment rules.</p></section>'+
 '<section class="fund-section"><div class="section-kicker">02 / FINANCIAL STATEMENTS</div><div class="fund-table-heading"><h3>Detailed financials</h3><label>Period <select id="freq"><option value="quarterly">Quarterly</option><option value="annual">Annual</option></select></label></div><div class="trend-legend"><span class="trend-good">Improving</span><span class="trend-bad">Deteriorating</span><span class="trend-muted">Stable / inconclusive</span><span class="trend-investigate">Investigate</span></div>'+detailedTable(rows,frequency==='annual',annual)+'<p class="stock-note">Colours require two consecutive comparable changes in the same direction (2% relative tolerance; 0.75pp for rates). Quarterly colours compare three successive quarters (two QoQ movements); annual colours compare three successive years. Latest YoY is coloured independently using a single year-over-year comparison. Seasonal effects may influence quarterly trends. Ambiguous balance-sheet and investment increases are not automatically good or bad. Missing values and unsupported comparisons are grey. Raw provider figures are retained.</p><p class="stock-note">Long-term trend: up to five fiscal years, actual available span shown; C = CAGR. Margin and return changes are in percentage points. Long-term colour reflects the two latest annual movements, not the entire CAGR. Latest YoY uses the selected quarterly or annual view. ROE = common earnings / average common equity; ROIC = operating profit after effective tax / average (total equity + debt − cash), approximate. Quarterly returns use TTM and require four consecutive quarters and year-ago balance sheet. Brokerage metrics are adapted; generic ROIC/FCF trends are not interpreted as operating quality.</p>'+note+source+'</section>';
 el('freq').value=frequency;el('freq').onchange=e=>{frequency=e.target.value;render();};
}


const filingRisk={
 IBKR:{date:'2026-09-30',url:'https://www.sec.gov/Archives/edgar/data/1381197/000138119726000163/ibkr-20260930.htm',capital:17956e6,required:3334e6,liquid:98.9,marginLoans:104032e6,oldMarginLoans:70805e6,netInterest:1154e6,netRevenue:1914e6,nim:1.99,oldNim:2.16,rate25:83e6,pretax:1496e6,badDebt9m:10e6},
 HOOD:{date:'2026-09-30',url:'https://www.sec.gov/Archives/edgar/data/1783879/000178387926000167/hood-20260930.htm',loans:1841e6,pastDue:102e6,oldLoans:1040e6,oldPastDue:49e6,cardProvision:61e6,oldCardProvision:23e6,totalProvision:71e6,oldTotalProvision:26e6,cryptoRevenue:120e6,writeOff:31e6,oldWriteOff:5e6}
};
const riskLabels={clear:'No flag',watch:'Monitor',high:'Elevated',unknown:'Not assessed',disclosed:'Disclosed',structural:'Structural'};
const riskConfig={
 IBKR:[['capital','Regulatory capital','Capital buffer by regulated subsidiary'],['liquidity','Liquidity','Segregation, clearing liquidity and cash mobility'],['credit','Customer credit','Margin loans and losses beyond collateral'],['rates','Rate sensitivity','Interest revenue concentration and yield compression'],['ownership','Governance','Noncontrolling ownership and tax agreements'],['tail','Market tail exposure','Liquidation gaps and clearing obligations']],
 HOOD:[['capital','Regulatory capital','Capital buffer and subsidiary funding'],['cards','Consumer credit','Unsecured lending, delinquency and provisions'],['trading','Trading concentration','Crypto, options and event contracts'],['liquidity','Liquidity','Customer assets, funding trust and available corporate cash'],['earnings','Earnings quality','Non-operating gains, tax and investment exposure'],['regulation','Regulatory exposure','Crypto and event contract restrictions']],
 AMZN:[['liquidity','Liquidity','Cash relative to debt, not cash available for all obligations'],['coverage','Debt service','TTM operating profit / interest expense'],['cashflow','Cash generation','Cash remaining after reported capex'],['capex','Capital intensity','Capex versus operating profit growth'],['aws','AWS capital productivity','Segment asset growth, depreciation and incremental profit'],['commitments','Off-balance-sheet commitments','Leases, infrastructure and contractual purchase obligations']],
 GOOGL:[['liquidity','Liquidity','Cash relative to debt'],['coverage','Debt service','TTM operating profit / interest expense'],['cashflow','Cash generation','Cash remaining after reported capex'],['capex','Capital intensity','Capex versus operating profit growth'],['search','Search economics','AI substitution, traffic costs and distribution'],['legal','Legal and regulatory','Antitrust remedies and contingent liabilities']],
 NVDA:[['liquidity','Liquidity','Cash relative to debt'],['coverage','Debt service','TTM operating profit / interest expense'],['inventory','Inventory exposure','Inventory growth relative to sales'],['receivables','Receivables exposure','Receivables growth relative to sales'],['gross','Gross margin','Year-over-year margin compression'],['concentration','Concentration and commitments','Major customers, supply obligations and export restrictions']],
 KTOS:[['liquidity','Liquidity','Cash relative to debt'],['coverage','Debt service','TTM operating profit / interest expense'],['cashflow','Cash generation','Cash remaining after reported capex'],['receivables','Working capital','Receivables growth relative to revenue'],['contracts','Contract execution','Funded backlog, fixed-price risks and unbilled assets'],['shares','Share count','Potential shareholder dilution']],
 OKLO:[['runway','Cash runway proxy','Reported cash / recent free cash burn'],['cashflow','Cash burn','Reported quarterly free cash flow'],['shares','Share count','Potential financing dilution'],['license','Licensing','NRC approvals and site milestones'],['funding','Project financing','Committed capital versus funded obligations'],['commercial','Commercial readiness','Binding agreements and deployment milestones']]
};
const ratio=(a,b)=>num(a)&&num(b)&&b>0?a/b:null;
function riskResult(status,metric,why,next,values=[],src=null){return {status,metric,why,next,values,src};}
function unknownRisk(desc){return riskResult('unknown','—','Required comparable or filing-level evidence is unavailable.','Review '+desc.toLowerCase()+' in the latest filing.');}
function ttmAt(rows,i,k){const w=rows.slice(i,i+4);return w.length===4&&w.every((r,j)=>j===0||consecutive(w[j-1],r))?sumField(w,k):null;}
function riskAt(s,d,q,id){
 const rows=d.quarterly||[],i=rows.indexOf(q),r=q||{},f=filingRisk[s],same=f&&r.period===f.date;
 const source=same?f.url:null,prev=k=>periodBase(rows,r,k),g=k=>growth(r,{[k]:prev(k)},k),rev=g('revenue');
 const pair=(name,a,b,format=money)=>[{label:name+' prior',value:a,format},{label:name+' latest',value:b,format}];
 const cfg=riskConfig[s].find(x=>x[0]===id);
 const missing=()=>unknownRisk(cfg[2]);
 if(s==='IBKR'){
  if(!same)return missing();
  if(id==='capital'){const v=f.capital/f.required;return riskResult('clear',fmt(v,2)+'x coverage','All regulated subsidiaries met their requirements; aggregate excess capital was '+money(f.capital-f.required)+'. Capital is not necessarily transferable between subsidiaries.','Track capital coverage and excess at each regulated entity.',[{label:'Required capital',value:f.required,format:money},{label:'Reported capital',value:f.capital,format:money}],source);}
  if(id==='liquidity')return riskResult('disclosed',pct(f.liquid)+' liquid assets','Management classifies this share of assets as liquid; customer-segregated assets are not free corporate cash.','Review segregation, clearing liquidity and cash mobility.',[],source);
  if(id==='credit')return riskResult('watch',signed(100*(f.marginLoans/f.oldMarginLoans-1))+' margin loans YoY','Average margin loans expanded; nine-month customer bad-debt expense was '+money(f.badDebt9m)+'. Low realized losses do not remove gap risk.','Track margin loans relative to customer equity, bad debt and regulatory capital.',pair('Average margin loans',f.oldMarginLoans,f.marginLoans),source);
  if(id==='rates')return riskResult('watch',pct(100*f.netInterest/f.netRevenue)+' of net revenue','Net interest margin fell from '+pct(f.oldNim)+' to '+pct(f.nim)+'. Customer balances and rates can move independently.','Track net interest margin, customer balances and rate sensitivity.',pair('Net interest margin',f.oldNim,f.nim,pct),source);
  if(id==='ownership')return riskResult('structural','Complex ownership','The listed company shares economics with noncontrolling owners; exchanges and tax agreements complicate per-share analysis.','Track ownership percentages, tax receivable payments and exchanges.',[],source);
  if(id==='tail')return riskResult('structural','Collateral gap risk','Customer obligations may exceed collateral during discontinuous price moves; a realized loss estimate is not available.','Review stress controls, collateral concentration and clearing obligations.',[],source);
 }
 if(s==='HOOD'){
  if(id==='cards'&&same){const v=100*f.pastDue/f.loans,old=100*f.oldPastDue/f.oldLoans;return riskResult('watch',pct(v)+' past due','Past-due share rose from '+pct(old)+' at Dec 2025; quarterly card provisions increased from '+money(f.oldCardProvision)+' to '+money(f.cardProvision)+' YoY. Portfolio growth and credit quality both matter.','Monitor delinquency, charge-offs, FICO mix and card economics.',pair('Past-due share',old,v,pct),source);}
  if(id==='cards'&&r.period==='2025-12-31')return riskResult('disclosed',pct(100*f.oldPastDue/f.oldLoans)+' past due','December baseline reported in the September 2026 filing. No prior comparable used for this period.','Review delinquency and portfolio seasoning.',[],f.url);
  if(id==='trading'&&same)return riskResult('disclosed',money(f.cryptoRevenue)+' crypto revenue','Trading revenues depend on customer activity, pricing and product mix. Crypto risk cannot be inferred from a single revenue level.','Track revenue mix and trading activity by product.',[],source);
  if(id==='earnings'){const e=g('eps'),p=g('pretax');if(!num(e)||!num(p))return missing();const gap=Math.abs(e-p);return riskResult(gap>15?'watch':'clear',fmt(gap)+'pp growth gap','EPS '+signed(e)+' vs pretax profit '+signed(p)+' YoY. This is a screen, not a diagnosis.','Review tax, investment gains/losses and share changes.',pair('Growth',p,e,signed));}
  return missing();
 }
 if(id==='liquidity'){if(!num(r.cash)||!num(r.debt))return missing();const net=r.cash-r.debt;return riskResult(net<0?'watch':'clear',money(net)+' net cash','Reported cash and short-term investments less total debt. This is not a complete liquidity or solvency measure.','Review maturities, restricted cash and commitments.',[{label:'Cash & investments',value:r.cash,format:money},{label:'Total debt',value:r.debt,format:money}]);}
 if(id==='coverage'){if(i<0)return missing();const op=ttmAt(rows,i,'operating_profit'),interest=ttmAt(rows,i,'interest_expense'),v=ratio(op,interest);if(v==null)return missing();return riskResult(v<1?'high':v<3?'watch':'clear',fmt(v,2)+'x coverage','TTM operating profit divided by reported interest expense; lease and refinancing obligations are not fully captured.','Review interest expense, maturities and borrowing terms.');}
 if(id==='cashflow'){if(!num(r.fcf))return missing();return riskResult(r.fcf<0?'watch':'clear',money(r.fcf)+' FCF','Quarterly operating cash flow less reported capital expenditure. Negative FCF can reflect investment or working-capital timing.','Track TTM cash conversion, investment commitments and funding.',num(r.ocf)&&num(r.capex)?[{label:'Operating cash flow',value:r.ocf,format:money},{label:'Capex',value:r.capex,format:money}]:[]);}
 if(['capex','inventory','receivables'].includes(id)){const x=g(id),base=id==='capex'?g('operating_profit'):rev;if(!num(x)||!num(base))return missing();const gap=x-base;return riskResult(gap>10?'watch':'clear',(gap>0?'+':'')+fmt(gap)+'pp growth gap',cfg[1]+' grew '+signed(x)+' vs '+(id==='capex'?'operating profit':'revenue')+' '+signed(base)+' YoY. A positive divergence needs context, not an automatic negative conclusion.','Review '+cfg[2].toLowerCase()+'.',[{label:cfg[1]+' growth',value:x,format:signed},{label:(id==='capex'?'Profit':'Revenue')+' growth',value:base,format:signed}]);}
 if(id==='gross'){const old=prev('gross_margin');if(!num(r.gross_margin)||!num(old))return missing();const gap=r.gross_margin-old;return riskResult(gap< -2?'watch':'clear',(gap>0?'+':'')+fmt(gap)+'pp YoY','Gross margin '+pct(r.gross_margin)+' compared with '+pct(old)+' a year earlier.','Review product mix, pricing and supply costs.',pair('Gross margin',old,r.gross_margin,pct));}
 if(id==='shares'){const x=g('shares');if(!num(x))return missing();return riskResult(x>2?'watch':'clear',signed(x)+' shares YoY','Diluted average share count is a proxy; it does not establish actual economic dilution.','Review issuance, stock compensation and fully diluted ownership.');}
 if(id==='runway'){if(i<0||!num(r.cash))return missing();const burn=ttmAt(rows,i,'fcf');if(!num(burn)||burn>=0)return missing();const v=12*r.cash/-burn;return riskResult(v<12?'high':v<24?'watch':'disclosed',fmt(v,0)+' months proxy','Reported cash and investments / annual trailing free cash burn. Assumes all reported cash is available and constant burn; actual project funding and restrictions can materially change runway.','Review unrestricted cash and forward project commitments.');}
 return missing();
}
function riskVisual(values){
 if(!values.length)return '';
 const max=Math.max(1,...values.map(v=>Math.abs(v.value)));
 return '<div class="risk-bars">'+values.map(v=>'<div><div class="risk-bar-label"><span>'+esc(v.label)+'</span><strong>'+esc(v.format(v.value))+'</strong></div><div class="risk-bar-track"><span style="width:'+Math.abs(v.value)/max*100+'%;background:'+(v.value<0?'#e88c92':'#75a7ba')+'"></span></div></div>').join('')+'</div>';
}
function riskSource(result,f){return result.src?'<a class="risk-cite" href="'+esc(result.src)+'" target="_blank" rel="noopener">SEC 10-Q · '+esc(f.date)+' ↗</a>':'<span class="risk-cite">Standardized financials · calculated screen</span>';}
function scenarioSpecs(s,d,q){
 const f=filingRisk[s],rows=d.quarterly||[],i=rows.indexOf(q),ttm=k=>i>=0?ttmAt(rows,i,k):null;
 const make=(title,label,unit,max,step,initial,base,desc,calc,source='')=>({title,label,unit,max,step,initial,base,desc,calc,source});
 const input=(title,label,unit,max,step,initial,baseLabel,initialBase,desc,calc)=>({...make(title,label,unit,max,step,initial,null,desc,calc),baseLabel,initialBase});
 if(s==='IBKR')return [
 make('US rate cuts','Rate reduction','bps',200,25,100,f.rate25,'Company-disclosed annual net interest sensitivity per 25 bps, as of '+f.date+'. Linear extrapolation; balances, other currencies and reinvestment assumptions fixed.',(v,b)=>['Annual net interest impact',money(-v/25*b),'Versus annualized Q3 pretax profit: '+pct(v/25*b/(4*f.pretax)*100)+' reduction'],f.url),
 make('Margin loan loss shock','Hypothetical loss rate','%',2,.1,.5,f.marginLoans,'Illustrative unrecovered loss on disclosed average margin loans (Q3 2026); not a predicted default rate or a stress model. Collateral and recoveries assumed already reflected in the loss rate.',(v,b)=>['Hypothetical loss',money(-b*v/100),pct(100*b*v/100/(f.capital-f.required))+' of disclosed aggregate capital surplus'],f.url)
 ];
 if(s==='HOOD')return [
 make('Consumer credit loss shock','Additional loss rate','pp',10,.5,2,f.loans,'Illustrative incremental losses across the disclosed on/off-balance-sheet gross card portfolio as of '+f.date+'. Actual allocation to Robinhood depends on program terms and recovery.',(v,b)=>['Gross portfolio loss',money(-b*v/100),'Before recoveries and allocation of losses'],f.url),
 make('Crypto revenue contraction','Quarterly revenue decline','%',100,5,30,f.cryptoRevenue,'Applies to the Q3 2026 disclosed crypto revenue baseline. No assumption about costs, taxes or offsets.',(v,b)=>['Quarterly revenue impact',money(-b*v/100),'Remaining crypto revenue '+money(b*(1-v/100))],f.url)
 ];
 if(s==='AMZN')return [
 make('Capex expansion','Increase in annual capex','%',100,5,20,ttm('capex'),'Uses trailing four-quarter reported capex. Holds operating cash flow unchanged; excludes changes in lease financing.',(v,b)=>['Incremental annual cash outflow',money(-b*v/100),num(ttm('fcf'))?'Illustrative FCF '+money(ttm('fcf')-b*v/100):'FCF baseline unavailable']),
 input('AWS margin compression','Margin reduction','pp',15,.5,3,'Quarterly AWS revenue ($B)','', 'Enter disclosed AWS quarterly revenue in billions. Revenue held fixed; operating profit changes by revenue × margin change.',(v,b)=>['Quarterly AWS operating profit impact',money(-b*1e9*v/100),'No assumed change in revenue'])
 ];
 if(s==='GOOGL')return [
 input('Search revenue contraction','Revenue decline','%',50,5,10,'Quarterly Search revenue ($B)','', 'Enter disclosed Search revenue in billions. Estimates revenue impact only; no assumed cost offset.',(v,b)=>['Quarterly search revenue impact',money(-b*1e9*v/100),'Remaining search revenue '+money(b*1e9*(1-v/100))]),
 make('AI infrastructure spending','Annual capex increase','%',100,5,20,ttm('capex'),'Uses trailing reported capex; unchanged operating cash flow and financing.',(v,b)=>['Incremental annual cash outflow',money(-b*v/100),num(ttm('fcf'))?'Illustrative FCF '+money(ttm('fcf')-b*v/100):'FCF baseline unavailable'])
 ];
 if(s==='NVDA')return [
 make('Gross margin compression','Margin reduction','pp',20,1,5,q.revenue,'Latest quarter revenue held fixed; reduction in gross profit before operating expenses and taxes.',(v,b)=>['Quarterly gross profit impact',money(-b*v/100),num(q.gross_margin)?'Illustrative gross margin '+pct(q.gross_margin-v):'Margin unavailable']),
 make('Demand slowdown','Quarterly sales decline','%',50,5,15,q.revenue,'Revenue sensitivity only, before cost or mix changes.',(v,b)=>['Quarterly revenue impact',money(-b*v/100),'Remaining revenue '+money(b*(1-v/100))])
 ];
 if(s==='KTOS')return [
 input('Contract delay','Revenue deferred','%',100,5,25,'Quarterly revenue exposed ($M)','', 'Enter revenue exposed to delays. Deferral is a timing scenario, not a cancellation or earnings forecast.',(v,b)=>['Quarterly revenue deferred',money(b*1e6*v/100),'No assumption about later recognition']),
 make('Production cost overrun','Incremental costs / sales','%',20,1,5,q.revenue,'Assumes extra costs as a share of latest quarterly revenue; no offset from pricing or tax.',(v,b)=>['Quarterly operating profit impact',money(-b*v/100),'Before tax and mitigation'])
 ];
 const burn=ttm('fcf');
 return [
 make('Deployment delay / cash burn','Additional months of burn','months',36,1,12,num(burn)&&burn<0?-burn/12:null,'Uses monthly average trailing free cash burn; constant burn assumption excludes new construction obligations and funding.',(v,b)=>['Additional cash consumption',money(-b*v),num(q.cash)?'Remaining reported cash proxy '+money(q.cash-b*v):'Cash baseline unavailable']),
 input('Equity financing dilution','New shares / existing shares','%',100,5,20,'Existing shares (millions)','', 'Enter current fully diluted shares in millions. Simple issuance dilution; excludes price changes, warrants or other instruments.',(v,b)=>['Existing ownership diluted by',pct(100*v/(100+v)),'New shares '+fmt(b*v/100,2)+'M; total '+fmt(b*(1+v/100),2)+'M'])
 ];
}
function renderStress(s,d,q){
 const specs=scenarioSpecs(s,d,q);
 const html=specs.map((x,i)=>'<article class="stress-card"><h3>'+esc(x.title)+'</h3><p>'+esc(x.desc)+'</p>'+(x.baseLabel?'<label for="stress-base-'+i+'">'+esc(x.baseLabel)+'</label><input id="stress-base-'+i+'" type="number" min="0" step="any" placeholder="Enter disclosed value" value="'+esc(x.initialBase)+'">':'')+'<label for="stress-slider-'+i+'">'+esc(x.label)+' <strong id="stress-val-'+i+'"></strong></label><input id="stress-slider-'+i+'" type="range" min="0" max="'+x.max+'" step="'+x.step+'" value="'+x.initial+'"><div class="stress-output" id="stress-output-'+i+'"></div>'+(x.source?'<a class="risk-cite" href="'+esc(x.source)+'" target="_blank" rel="noopener">Source: dated SEC filing ↗</a>':'')+'</article>').join('');
 return {html,bind(){specs.forEach((x,i)=>{const slider=el('stress-slider-'+i),base=x.baseLabel?el('stress-base-'+i):null;slider.value=String(x.initial);const update=()=>{const v=Number(slider.value),b=base?(base.value.trim()!==''?Number(base.value):null):x.base;el('stress-val-'+i).textContent=fmt(v,1)+' '+x.unit;if(!num(b)||b<0||(base&&b===0)){el('stress-output-'+i).innerHTML='<p>Baseline unavailable. '+(base?'Enter a disclosed value to calculate.':'No estimate substituted.')+'</p>';return;}const [label,result,detail]=x.calc(v,b);el('stress-output-'+i).innerHTML='<span>'+esc(label)+'</span><strong>'+esc(result)+'</strong><small>'+esc(detail)+'</small>';};slider.oninput=update;if(base)base.oninput=update;update();});}};
}
function riskPanel(panel,m,d,q,note,source){
 const config=riskConfig[symbol],f=filingRisk[symbol],rs=config.map(([id,title,desc])=>({id,title,desc,...riskAt(symbol,d,q,id)})),priority=rs.filter(r=>['watch','high','structural'].includes(r.status)).sort((a,b)=>({high:0,watch:1,structural:2}[a.status]-({high:0,watch:1,structural:2}[b.status])));
 const recent=(d.quarterly||[]).slice(0,4).reverse(),stress=renderStress(symbol,d,q);
 const label=r=>riskLabels[r.status]||'Not assessed';
 panel.innerHTML='<h2>Financial risk</h2><p class="risk-intro">Independent risk dimensions · '+esc(q.period?'Quarter ended '+q.period:'Reporting period unavailable')+' · no composite score</p>'+
 '<section class="risk-section"><div class="section-kicker">01 / FINANCIAL RESILIENCE</div><h3>Risk map</h3><div class="risk-map">'+rs.map(r=>'<article class="risk-map-item risk-'+r.status+'"><div class="risk-map-top"><strong>'+esc(r.title)+'</strong><span>'+esc(label(r))+'</span></div><div class="risk-metric">'+esc(r.metric)+'</div><small>'+esc(r.desc)+'</small></article>').join('')+'</div><p class="stock-note">No flag means a specific check did not trigger; it does not establish low overall risk. Structural exposure is not a quantified loss estimate.</p></section>'+
 '<section class="risk-section risk-focus"><div class="section-kicker">02 / PRIORITY DILIGENCE</div><h3>Risks beneath the surface</h3><div class="risk-priority-grid">'+(priority.length?priority.map(r=>'<article class="risk-priority risk-'+r.status+'"><div class="risk-map-top"><span>'+esc(label(r))+'</span></div><h4>'+esc(r.title)+'</h4><div class="risk-metric">'+esc(r.metric)+'</div>'+riskVisual(r.values)+'<p>'+esc(r.why)+'</p><div class="risk-next"><strong>MONITOR NEXT QUARTER</strong><p>'+esc(r.next)+'</p></div>'+riskSource(r,f)+'</article>').join(''):'<p class="stock-note">No priority flags from available checks. Unassessed dimensions still require diligence.</p>')+'</div><div class="risk-unassessed"><strong>Filing work still needed</strong>'+list(rs.filter(r=>r.status==='unknown').map(r=>r.title+' — '+r.desc))+'</div></section>'+
 '<section class="risk-section"><div class="section-kicker">03 / SCENARIO ANALYSIS</div><h3>Financial stress tests</h3><div class="stress-grid">'+stress.html+'</div><p class="stock-note">Independent sensitivity scenarios, not forecasts or probabilities. Dated filing baselines remain fixed until reviewed; user-entered assumptions are not verified.</p></section>'+
 '<section class="risk-section"><div class="section-kicker">04 / HISTORICAL MONITORING</div><h3>Risk evolution · four quarters</h3><div class="table-scroll"><table class="risk-history"><thead><tr><th>Risk dimension</th>'+recent.map(r=>'<th>'+esc(r.period)+'</th>').join('')+'</tr></thead><tbody>'+config.map(([id,title])=>'<tr><th scope="row">'+esc(title)+'</th>'+recent.map(qr=>{const rr=riskAt(symbol,d,qr,id);return '<td><div class="risk-history-cell risk-'+rr.status+'" title="'+esc(rr.why)+'"><strong>'+esc(label(rr))+'</strong><small>'+esc(rr.metric)+'</small></div></td>';}).join('')+'</tr>').join('')+'</tbody></table></div><p class="stock-note">Historical cells are recalculated from available dated observations, not backfilled judgments or saved point-in-time ratings. Missing quarters or disclosures remain unassessed.</p></section>'+
 '<details class="risk-method"><summary>Screening methodology & sources</summary><p>Non-financial screens: net cash below zero; interest coverage below 3x (elevated below 1x); negative quarterly FCF; growth divergence above 10pp; gross margin decline above 2pp; share count growth above 2%; runway proxy below 24 months (elevated below 12). Brokerage-specific measures are not assessed using generic debt or FCF rules. Thresholds are research heuristics.</p>'+note+source+(f?'<p>Dated filing baseline: <a href="'+esc(f.url)+'" target="_blank" rel="noopener">'+esc(f.date)+' 10-Q ↗</a> · manually verified snapshot; not automatically refreshed.</p>':'')+'</details>';
 stress.bind();
}


// Reviewed company disclosures: values in reporting units shown in labels, oldest to newest.
// Array: Q4 / Q1 / Q2 / Q3, then comparable prior-year Q3. Null is never estimated.
const kpiRow=(id,label,unit,kind,values,why,src=0)=>({id,label,unit,kind,values,why,src});
const kpiData={
IBKR:{period:'2026-09-30',sources:[['Q3 2026 10-Q','https://www.sec.gov/Archives/edgar/data/1381197/000138119726000163/ibkr-20260930.htm']],rows:[
kpiRow('accounts','Customer accounts','M','up',[null,null,5.185,5.576,4.127],'Scale of the customer franchise.'),
kpiRow('equity','Customer equity','$B','up',[null,null,930,965,758],'Client assets also move with markets.'),
kpiRow('darts','Daily average revenue trades','M','up',[null,null,4.824,4.273,3.616],'Trading engagement; can be cyclical.'),
kpiRow('comm','Commissions','$M','up',[null,null,null,602,537],'Trading revenue, including passed-through regulatory fees.'),
kpiRow('perOrder','Commission per cleared order','$','context',[null,null,null,2.59,2.70],'Mix and order size affect monetisation.'),
kpiRow('loans','Average margin loans','$B','watch',[null,null,null,104.032,70.805],'Lending demand and collateral exposure.'),
kpiRow('nii','Net interest income','$M','up',[null,null,null,1154,null],'Interest monetisation of client balances.'),
kpiRow('nim','Net interest margin','%','up',[null,null,null,1.99,2.16],'Yield on interest-earning balances.'),
kpiRow('deposits','Net client deposits','$B','up',[null,null,null,null,null],'Not yet extracted on a comparable quarterly basis.')
],core:['accounts','equity','darts','nim'],compare:['accounts','darts','comm','loans'],mix:{total:1914,unit:'$M',items:[['Net interest income',1154],['Commissions',602],['Other net revenue',158]],note:'Other net revenue is the residual. Commission revenue includes certain passed-through fees.'},insight:'Account growth materially exceeds commission growth, while net interest margin declined year over year. This warrants monitoring engagement, commission per order and customer balance mix; it does not establish weakening customer lifetime value.'},
HOOD:{period:'2026-09-30',sources:[['Q3 2026 earnings release','https://investors.robinhood.com/news-releases/news-release-details/robinhood-reports-third-quarter-2026-results'],['Q2 2026 earnings release','https://investors.robinhood.com/news-releases/news-release-details/robinhood-reports-second-quarter-2026-results']],rows:[
kpiRow('customers','Funded customers','M','up',[null,null,28.4,28.7,26.8],'Customer base; WonderFi included from June 2026.'),
kpiRow('assets','Total platform assets','$B','up',[null,null,368.7,396,null],'Includes market movements and acquired platform assets.'),
kpiRow('deposits','Net deposits','$B','up',[null,null,21.7,15.7,null],'Metric scope expanded in 2026; comparisons are not entirely organic.'),
kpiRow('depositRate','Annualised net deposit rate','%','up',[null,null,28,17,29],'Relative to prior-quarter platform assets.'),
kpiRow('gold','Gold subscribers','M','up',[null,null,4.84,5.18,3.88],'Paid subscription adoption.'),
kpiRow('arpu','Annualised ARPU','$','up',[null,null,187,200,191],'Company-defined annualised revenue per funded customer.'),
kpiRow('trans','Transaction revenue','$M','up',[null,null,776,867,730],'Trading monetisation.'),
kpiRow('nii','Net interest revenue','$M','up',[null,null,389,415,456],'Interest-related monetisation.'),
kpiRow('goldCard','Gold Card customers','M','up',[null,null,null,1.3,null],'Card adoption, not a credit-quality metric.')
],core:['customers','deposits','gold','arpu'],compare:['customers','gold','arpu','trans','nii'],mix:{total:1424,unit:'$M',items:[['Transaction revenue',867],['Net interest revenue',415],['Other revenue',142]],note:'Transactions include options, equities, crypto and event contracts; categories shown do not overlap.'},insight:'Gold adoption and ARPU are rising year over year, but net deposits slowed sequentially and interest revenue fell versus last year. Track organic customer acquisition and credit economics alongside monetisation.'},
AMZN:{period:'2026-09-30',sources:[['Q3 2026 supplemental business metrics','https://ir.aboutamazon.com/news-release/news-release-details/2026/Amazon-com-Announces-Third-Quarter-Results/'],['Q3 2026 10-Q · segment assets','https://www.sec.gov/Archives/edgar/data/1018724/000101872426000040/amzn-20260930.htm']],rows:[
kpiRow('aws','AWS revenue','$B','up',[35.579,37.587,42.232,45.984,33.006],'Cloud scale and demand.'),
kpiRow('awsGrowth','AWS revenue growth ex-FX','%','up',[24,28,37,39,20],'Reported constant-currency YoY growth.'),
kpiRow('awsProfit','AWS operating income','$B','up',[12.465,14.161,16.621,17.773,11.434],'Cloud profit generation.'),
kpiRow('awsMargin','AWS operating margin','%','up',[35,37.7,39.4,38.7,34.6],'Cloud segment profitability.'),
kpiRow('assets','AWS segment assets','$B','context',[252.588,null,null,419.594,null],'Assets include leases, receivables and property; expansion is not itself deterioration.',1),
kpiRow('assetReturn','AWS profit / average assets proxy','%','up',[null,null,null,100*61.020/((252.588+419.594)/2),null],'TTM operating profit / average Dec 2025 and Sep 2026 segment assets; not full-year average ROIC.',1),
kpiRow('naMargin','North America operating margin','%','up',[9,7.9,7.9,7.7,4.5],'Regional profitability.'),
kpiRow('intlMargin','International operating margin','%','up',[2.1,3.6,4.1,3.7,2.9],'Regional profitability.'),
kpiRow('ads','Advertising services revenue','$B','up',[21.317,17.243,19.809,19.637,17.703],'Advertising is included in geographic segments; do not add to segment revenue.'),
kpiRow('seller','Third-party seller services','$B','up',[52.816,41.578,46.780,46.492,42.486],'Marketplace monetisation; included in geographic segments.')
],core:['awsGrowth','awsMargin','assetReturn','ads'],compare:['aws','awsProfit','ads','seller'],mix:{total:201.944,unit:'$B',items:[['North America',112.852],['International',43.108],['AWS',45.984]],note:'Reported segment net sales; advertising and seller services overlap geographic segments and are not added.'},insight:'AWS growth and operating income increased, but the latest AWS margin eased sequentially. Segment assets expanded substantially since December; the key question is whether incremental cloud profit and cash generation keep pace with infrastructure investment.'},
GOOGL:{period:'2026-09-30',sources:[['Q3 2026 earnings release (SEC)','https://www.sec.gov/Archives/edgar/data/1652044/000165204426000080/googexhibit991q32026.htm'],['Q3 2026 earnings call','https://abc.xyz/investor/events/event-details/2026/2026-Q3-Earnings-Call-2026-Ujou16CTw9/default.aspx']],rows:[
kpiRow('search','Search & other revenue','$B','up',[null,null,null,63.350,56.567],'Core search monetisation.'),
kpiRow('youtube','YouTube advertising','$B','up',[null,null,null,11.207,10.261],'Video advertising revenue, excluding subscriptions.'),
kpiRow('cloud','Cloud revenue','$B','up',[null,null,null,30.709,15.157],'Cloud and TPU systems revenue.'),
kpiRow('cloudMargin','Cloud operating margin','%','up',[null,null,35.6,100*11.121/30.709,100*3.594/15.157],'Segment operating income divided by segment revenue.',1),
kpiRow('backlog','Cloud backlog','$B','up',[null,null,null,561,null],'Reported contract backlog; recognition timing and mix matter.',1),
kpiRow('servicesMargin','Services operating margin','%','up',[null,null,null,100*39.157/96.302,100*33.527/87.052],'Services segment profitability.'),
kpiRow('tac','TAC / advertising revenue','%','down',[null,null,null,100*16.366/82.012,100*14.876/74.182],'Distribution and traffic cost intensity.'),
kpiRow('subs','Subscriptions, platforms & devices','$B','up',[null,null,null,14.290,12.870],'Non-advertising services revenue.')
],core:['search','cloud','cloudMargin','backlog'],compare:['search','youtube','cloud','subs'],mix:{total:127.577,unit:'$B',items:[['Search & other',63.350],['YouTube ads',11.207],['Network',7.455],['Subscriptions, platforms & devices',14.290],['Cloud',30.709],['Other Bets / hedging',.566]],note:'Non-overlapping revenue categories; Other Bets and hedging combined.'},insight:'Cloud revenue more than doubled year over year, with substantially higher segment margins. Search remains the largest revenue driver; monitor Search monetisation and traffic costs alongside Cloud backlog conversion.'},
NVDA:{period:'2026-10-25',periods:['Q4 FY26','Q1 FY27','Q2 FY27','Q3 FY27'],sources:[['Q3 FY2027 earnings release','https://investor.nvidia.com/news/press-release-details/2026/NVIDIA-Announces-Financial-Results-for-Third-Quarter-Fiscal-2027/'],['Q3 FY2027 revenue by market historical series','https://s201.q4cdn.com/141608511/files/doc_financials/2027/Q327/Rev-by-Mkt-Qtrly-Trend-Q327.pdf']],rows:[
kpiRow('dc','Data Center revenue','$B','up',[62.314,75.246,89.023,107.610,51.215],'Market-platform revenue, including compute and networking.',1),
kpiRow('compute','Compute & Networking segment revenue','$B','up',[null,null,88.3,106.0,50.9],'Reporting segment, not solely Data Center compute.'),
kpiRow('graphics','Graphics segment revenue','$B','up',[null,null,7.9,9.8,6.1],'Reporting segment revenue.'),
kpiRow('dcShare','Data Center share of sales','%','context',[null,null,100*89.023/96.2,100*107.610/115.8,100*51.215/57.0],'Market concentration proxy; not customer concentration.'),
kpiRow('total','Total revenue','$B','up',[null,null,96.2,115.8,57.0],'Reported quarterly revenue rounded to billions.'),
kpiRow('dcCompute','Data Center compute revenue','$B','up',[null,null,null,null,null],'Separate compute/networking breakout not yet extracted.'),
kpiRow('turnover','Inventory turnover','x','up',[null,null,null,null,null],'Requires consistent average inventory and cost of sales.'),
kpiRow('customer','Largest customer share','%','watch',[null,null,null,null,null],'Requires verified customer concentration disclosures.')
],core:['dc','compute','dcShare','graphics'],compare:['dc','compute','graphics'],mix:{total:115.8,unit:'$B',items:[['Data Center',107.610],['Other market platforms (residual)',8.190]],note:'Market-platform split using rounded total; Compute & Networking is a separate reporting dimension and is not added.'},insight:'Data Center revenue grew strongly across four disclosed quarters and represents most of sales. That scale increases exposure to enterprise AI investment; separate compute/networking mix and customer concentration still need filing extraction.'},
KTOS:{period:'2026-09-27',sources:[['Q3 2026 earnings release','https://www.sec.gov/Archives/edgar/data/1069258/000106925826000085/ktos202609278kexhibit991.htm']],rows:[
kpiRow('backlog','Total backlog','$B','up',[null,null,2.0846,2.650,null],'Includes both funded and unfunded orders; Q2 sums disclosed segments.'),
kpiRow('funded','Funded backlog','$B','up',[null,null,null,2.067,null],'Funded orders are not yet recognized revenue.'),
kpiRow('fundedShare','Funded share of backlog','%','up',[null,null,null,100*2.067/2.650,null],'Funded backlog / total backlog.'),
kpiRow('book','Quarterly book-to-bill','x','up',[null,null,null,2.2,null],'Bookings relative to sales; timing can be lumpy.'),
kpiRow('bookTTM','TTM book-to-bill','x','up',[null,null,null,1.6,null],'More stable demand-to-sales comparison.'),
kpiRow('organic','Organic revenue growth','%','up',[null,null,null,23.2,null],'Company-defined organic growth.'),
kpiRow('kgs','Government Solutions backlog','$B','up',[null,null,1.710,2.292,null],'Segment backlog.'),
kpiRow('kus','Unmanned Systems backlog','$B','up',[null,null,.3746,.3574,null],'Segment backlog.')
],core:['backlog','fundedShare','book','organic'],compare:[],mix:{title:'Backlog funding mix',total:2.6499,unit:'$B',items:[['Funded',2.067],['Unfunded',.5829]],note:'Funding mix is not revenue mix or a guarantee of conversion.'},insight:'Book-to-bill above one and a higher total backlog indicate strong order intake, but Unmanned Systems backlog declined sequentially. Monitor funded order conversion, production margins and schedule execution.'},
OKLO:{period:'2026-09-30',sources:[['Q3 2026 10-Q','https://www.sec.gov/Archives/edgar/data/1849056/000162828026071319/oklo-20260930.htm']],rows:[],core:[],compare:[],milestones:[
['Aurora-ID site','Non-nuclear construction approved; groundbreaking','Reported milestone','Sep 2025','Physical buildout, not operating authorization.'],
['DOE agreement','Other Transaction Agreement executed','Reported milestone','Feb 2026','Agreement is not commercial operating approval.'],
['Nuclear safety design','DOE Nuclear Safety Design Agreement approved','Reported milestone','Feb 2026','Design-stage authorization.'],
['NRC design criteria','Principal Design Criteria report approved','Reported milestone','Apr 2026','Not a combined license.'],
['Preliminary safety analysis','Preliminary Documented Safety Analysis approved','Reported milestone','Jun 2026','Additional authorization steps remain.'],
['Fuel readiness','Five metric tons of HALEU awarded for Idaho','Reported award','As of Q3 2026','Award does not establish fabricated fuel readiness.'],
['Commercial pipeline','12 GW Switch master power agreement; other nonbinding LOIs','Preliminary agreements','As of Q3 2026','Not equivalent to 12 GW of funded, binding projects.'],
['Binding contracted capacity','Not extracted','Not assessed','—','Verify binding PPAs and committed MW separately.'],
['Commercial operation','Operating authorization and deployment date not verified here','Not assessed','—','Track construction and authorization separately.']
],insight:'For a pre-commercial business, progress through authorization, fuel fabrication, construction and binding customer commitments matters more than revenue growth. Announced pipeline is not equivalent to executable funded capacity.'}
};
function kpiFmt(r,v){if(!num(v))return '—';if(r.unit==='%')return pct(v);if(r.unit==='x')return fmt(v,2)+'x';if(r.unit.startsWith('$'))return '$'+fmt(v,3)+(r.unit.slice(1));return fmt(v,3)+(r.unit==='M'?'M':' '+r.unit);}
function kpiDelta(r,v,old){if(!num(v)||!num(old))return null;return r.unit==='%'?v-old:old>0?100*(v/old-1):null;}
function kpiDeltaText(r,v,old){const d=kpiDelta(r,v,old);return d==null?'—':(d>0?'+':'')+fmt(d,1)+(r.unit==='%'?'pp':'%');}
function kpiTrend(r,i){
 if(i<2)return 'muted';const [a,b,c]=r.values.slice(i-2,i+1);if(![a,b,c].every(num))return 'muted';
 const tol=(x)=>r.unit==='%'?.75:Math.max(Math.abs(x)*.02,1e-9);
 const dir=(x,y)=>Math.abs(x-y)<=tol(y)?0:Math.sign(x-y),x=dir(b,a),y=dir(c,b);
 if(!x||x!==y)return 'muted';if(r.kind==='watch')return y>0?'investigate':'muted';if(r.kind==='context')return 'muted';return (r.kind==='down'?-y:y)>0?'good':'bad';
}
const kpiColors=['#6ba2c7','#70d5bd','#e4b575','#a99bd7','#db8c9c','#708399'];
function kpiMix(m){
 const parts=m.items.filter(x=>num(x[1])&&x[1]>=0),total=parts.reduce((a,x)=>a+x[1],0);
 if(!total)return '';
 let start=0;const gradient=parts.map((x,i)=>{const a=start;start+=100*x[1]/total;return kpiColors[i%kpiColors.length]+' '+a+'% '+start+'%';}).join(',');
 return '<div class="kpi-mix"><div class="kpi-donut" style="background:conic-gradient('+gradient+')"><div><strong>'+esc(kpiFmt({unit:m.unit},m.total))+'</strong><small>'+esc(m.title?'Backlog':'Revenue')+'</small></div></div><div class="kpi-mix-legend">'+parts.map((x,i)=>'<div><i style="background:'+kpiColors[i%kpiColors.length]+'"></i><span>'+esc(x[0])+'</span><b>'+esc(kpiFmt({unit:m.unit},x[1]))+'</b><small>'+pct(100*x[1]/total)+'</small></div>').join('')+'</div></div><p class="stock-note">'+esc(m.note)+'</p>';
}
function kpiGrowthBars(rows){
 const xs=rows.map(r=>({label:r.label,value:kpiDelta(r,r.values[3],r.values[4])})).filter(x=>num(x.value));if(!xs.length)return '<p class="stock-note">Comparable prior-year growth not yet available.</p>';
 const max=Math.max(1,...xs.map(x=>Math.abs(x.value)));
 return '<div class="kpi-growth">'+xs.map(x=>'<div><div class="risk-bar-label"><span>'+esc(x.label)+'</span><strong>'+esc(signed(x.value))+'</strong></div><div class="kpi-signed-track"><i></i><span class="'+(x.value<0?'negative':'positive')+'" style="width:'+Math.abs(x.value)/max*50+'%"></span></div></div>').join('')+'</div>';
}
function kpiPanel(panel,m,d,source){
 const cfg=kpiData[symbol],rows=cfg.rows,labels=cfg.periods||['Q4 2025','Q1 2026','Q2 2026','Q3 2026'],by=id=>rows.find(r=>r.id===id),latestPeriod=d.quarterly?.[0]?.period,stale=latestPeriod&&latestPeriod>cfg.period;
 const card=r=>'<article class="kpi-tile"><div>'+esc(r.label)+'</div><strong class="trend-'+kpiTrend(r,3)+'">'+esc(kpiFmt(r,r.values[3]))+'</strong><small>YoY '+esc(kpiDeltaText(r,r.values[3],r.values[4]))+' · QoQ '+esc(kpiDeltaText(r,r.values[3],r.values[2]))+'</small><p>'+esc(r.why)+'</p></article>';
 const milestone=cfg.milestones;
 const foot=cfg.sources.map(([n,url],i)=>'<a href="'+esc(url)+'" target="_blank" rel="noopener">['+(i+1)+'] '+esc(n)+' ↗</a>').join(' · ');
 panel.innerHTML='<h2>Business KPIs</h2><p class="stock-note">Reviewed operational disclosure snapshot · quarter ended '+esc(cfg.period)+(stale?' · newer financial quarter exists; operational data has not yet been refreshed':'')+' · not a live filing feed</p>'+
 '<section class="kpi-section"><div class="section-kicker">01 / CORE BUSINESS DRIVERS</div><h3>'+esc(milestone?'Execution milestones':'Business performance')+'</h3>'+(milestone?'<div class="kpi-milestones">'+milestone.slice(0,6).map(x=>'<article class="kpi-tile"><div>'+esc(x[0])+'</div><strong class="kpi-milestone-title">'+esc(x[1])+'</strong><small>'+esc(x[3])+' · '+esc(x[2])+'</small><p>'+esc(x[4])+'</p></article>').join('')+'</div>':'<div class="kpi-tiles">'+cfg.core.map(id=>card(by(id))).join('')+'</div>')+'</section>'+
 '<section class="kpi-section"><div class="section-kicker">02 / BUSINESS ECONOMICS</div><h3>'+esc(milestone?'Commercial readiness':cfg.mix.title||'Revenue engine')+'</h3>'+(milestone?'<div class="kpi-milestones">'+milestone.slice(6).map(x=>'<article class="kpi-tile"><div>'+esc(x[0])+'</div><strong class="kpi-milestone-title">'+esc(x[1])+'</strong><small>'+esc(x[3])+' · '+esc(x[2])+'</small><p>'+esc(x[4])+'</p></article>').join('')+'</div>':'<div class="kpi-economics"><div>'+kpiMix(cfg.mix)+'</div>'+(cfg.compare.length?'<div><div class="section-kicker">YOY GROWTH COMPARISON</div>'+kpiGrowthBars(cfg.compare.map(by))+'</div>':'<div><div class="section-kicker">DEMAND & EXECUTION</div>'+card(by('bookTTM'))+card(by('funded'))+'</div>')+'</div>')+'<div class="kpi-insight"><strong>What this means</strong><p>'+esc(cfg.insight)+'</p></div></section>'+
 '<section class="kpi-section"><div class="section-kicker">03 / OPERATIONAL MOMENTUM</div><h3>'+esc(milestone?'Milestone tracker':'Four-quarter operating trends')+'</h3>'+(milestone?table(['Metric / milestone','Reported observation','Status','Timing','What to verify'],milestone):'<div class="table-scroll"><table class="fund-table kpi-table"><thead><tr>'+['KPI',...labels,'Latest YoY'].map(h=>'<th>'+esc(h)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(r=>'<tr><th scope="row" title="'+esc(r.why)+'">'+esc(r.label)+' <sup>['+(r.src+1)+']</sup></th>'+r.values.slice(0,4).map((v,i)=>trendCell(kpiFmt(r,v),kpiTrend(r,i),'Two successive quarterly movements; metric-specific direction')).join('')+trendCell(kpiDeltaText(r,r.values[3],r.values[4]),'muted','Year-over-year change; percentage points for percentage metrics')+'</tr>').join('')+'</tbody></table></div><p class="stock-note">Green/red requires two successive movements beyond 2% relative or 0.75pp for percentage metrics. Higher margin lending/concentration can warrant investigation, not automatic improvement. Missing history remains grey; quarter-to-quarter seasonality and definition changes can affect trends.</p>')+'</section>'+
 '<details class="risk-method"><summary>Sources & methodology</summary><p>'+foot+'</p><p>Reviewed snapshot; updates require new filing extraction. Calculated ratios and residuals are identified in the metric descriptions; unavailable values are not estimated. Historical quarter labels are fiscal quarters for NVIDIA.</p>'+source+'</details>';
}


let valuationYears=5,valuationMetric='pe';
const valuationKeys={pe:'Trailing P/E',pb:'Price / book',pfcf:'Price / free cash flow'};
const valMultiple=(v)=>num(v)&&v>0?fmt(v,1)+'x':'—';
const valSigned=(v)=>num(v)?(v>0?'+':'')+fmt(v,1)+'%':'—';
function valHistory(d){return (d.valuation_history||[]).filter(r=>r.date&&num(r.price)&&r.price>0).slice().sort((a,b)=>a.date.localeCompare(b.date));}
function valWindow(history,years){if(!history.length)return [];const cutoff=new Date(history.at(-1).date+'T00:00:00Z');cutoff.setUTCFullYear(cutoff.getUTCFullYear()-years);return history.filter(r=>new Date(r.date+'T00:00:00Z')>=cutoff);}
function valStats(rows,k,current){
 const x=rows.map(r=>r[k]).filter(v=>num(v)&&v>0).sort((a,b)=>a-b);
 if(x.length<8||!num(current)||current<=0)return null;
 const mid=x.length>>1,median=x.length%2?x[mid]:(x[mid-1]+x[mid])/2;
 return {lo:x[0],hi:x.at(-1),median,n:x.length,percentile:100*(x.filter(v=>v<current).length+.5*x.filter(v=>v===current).length)/x.length,premium:100*(current/median-1)};
}
function valRange(k,rows,last){
 const st=valStats(rows,k,last?.[k]);if(!st)return '<article class="val-range"><h3>'+esc(valuationKeys[k])+'</h3><p class="stock-note">Comparable historical observations unavailable.</p></article>';
 const pos=v=>12+296*(v-st.lo)/(st.hi-st.lo||1),mid=pos(st.median),cur=Math.max(12,Math.min(308,pos(last[k])));
 return '<article class="val-range"><div class="val-range-head"><h3>'+esc(valuationKeys[k])+'</h3><strong>'+valMultiple(last[k])+'</strong></div><svg viewBox="0 0 320 52" role="img" aria-label="'+esc('Range '+valMultiple(st.lo)+' to '+valMultiple(st.hi)+'; median '+valMultiple(st.median)+'; latest '+valMultiple(last[k]))+'"><rect x="12" y="14" width="296" height="9" rx="4" fill="#35465c"/><line x1="'+mid+'" x2="'+mid+'" y1="6" y2="31" stroke="#a8b9ce" stroke-dasharray="3 2" stroke-width="2"/><circle cx="'+cur+'" cy="18.5" r="6" fill="#e8b365" stroke="#141e2d" stroke-width="2"/><text x="12" y="46" fill="#a9b9ce" font-size="10">'+valMultiple(st.lo)+'</text><text x="308" y="46" text-anchor="end" fill="#a9b9ce" font-size="10">'+valMultiple(st.hi)+'</text></svg><div class="val-range-meta"><span>Median <b>'+valMultiple(st.median)+'</b></span><span>'+fmt(st.percentile,0)+'th percentile</span><span>'+valSigned(st.premium)+' vs median</span></div></article>';
}
function valAttribution(rows){
 const good=rows.filter(r=>num(r.eps)&&r.eps>0&&num(r.pe)&&r.pe>0),first=good[0],last=rows.at(-1);
 if(!first||!last||!num(last.eps)||last.eps<=0||!num(last.pe)||first.date===last.date)return null;
 const total=100*(last.price/first.price-1),earn=100*(last.eps/first.eps-1),multiple=total-earn;
 return {first,last,total,earn,multiple};
}
function valAttributionHtml(a){
 if(!a)return '<p class="stock-note">Positive comparable EPS at both endpoints is required for price-return attribution.</p>';
 const mx=Math.max(1,Math.abs(a.earn),Math.abs(a.multiple),Math.abs(a.total));
 return '<div class="val-attribution"><div class="val-return"><small>Share price change</small><strong>'+valSigned(a.total)+'</strong><small>'+esc(a.first.date)+' → '+esc(a.last.date)+'</small></div>'+[['Earnings growth',a.earn],['Multiple contribution (incl. interaction)',a.multiple]].map(([n,v])=>'<div><div class="risk-bar-label"><span>'+esc(n)+'</span><strong>'+(v>0?'+':'')+fmt(v,1)+'pp</strong></div><div class="kpi-signed-track"><i></i><span class="'+(v<0?'negative':'positive')+'" style="width:'+Math.abs(v)/mx*50+'%"></span></div></div>').join('')+'<p class="stock-note">Exact arithmetic decomposition: price return = EPS change + residual multiple contribution, including interaction. Price return excludes dividends.</p></div>';
}
function valCurrent(s,d,last){
 const p=d.quote||{},q=d.quarterly?.[0]||{},rows=d.quarterly||[],annual=deriveRows(rows),ttm=k=>ttmAt(rows,0,k),op=ttm('operating_profit'),fcf=ttm('fcf'),mc=p.marketCap,ev=p.enterpriseValue;
 const items={
  pe:['Trailing P/E',valMultiple(p.trailingPE),'Provider; positive earnings only'],
  pb:['Price / book',valMultiple(p.priceToBook),'Provider; ownership structure may affect comparability'],
  ps:['Price / sales',valMultiple(p.priceToSalesTrailing12Months),'Provider'],
  evsales:['EV / sales',valMultiple(p.enterpriseToRevenue),'Provider'],
  evebitda:['EV / EBITDA',valMultiple(p.enterpriseToEbitda),'Provider; positive denominator only'],
  evop:['EV / operating profit',num(ev)&&num(op)&&ev>0&&op>0?valMultiple(ev/op):'—','Enterprise value / four-quarter operating profit'],
  yield:['FCF yield',num(fcf)&&num(mc)&&mc>0?valSigned(100*fcf/mc):'—','Four-quarter FCF / provider market cap; negative yield shown'],
  roe:['ROE',num(annual[0]?.roe)?pct(annual[0].roe):'—','TTM common earnings / average common equity'],
  cap:['Market cap',num(mc)?money(mc):'—','Provider'],
  ev:['Enterprise value',num(ev)?money(ev):'—','Provider'],
  cashadj:['Market cap less reported cash',num(mc)&&num(q.cash)?money(mc-q.cash):'—','Not enterprise value; debt and cash restrictions excluded'],
  cash:['Cash & short-term investments',num(q.cash)?money(q.cash):'—','Reported balance; not necessarily unrestricted'],
  pfcf:['Price / FCF',num(mc)&&num(fcf)&&mc>0&&fcf>0?valMultiple(mc/fcf):'—','Market cap / four-quarter FCF'],
 };
 const hist=valHistory(d),prior=last&&valWindow(hist,1)[0],eg=prior&&last&&((new Date(last.date)-new Date(prior.date))/86400000)>=350&&num(prior.eps)&&prior.eps>0&&num(last.eps)&&last.eps>0?100*(last.eps/prior.eps-1):null;
 items.peg=['Trailing PEG',num(eg)&&eg>0&&num(last?.pe)&&last.pe>0?valMultiple(last.pe/eg):'—','Reconstructed P/E divided by trailing EPS YoY growth (%)'];
 const keys={IBKR:['pe','pb','roe','cap'],HOOD:['pe','ps','pb','cap'],AMZN:['pe','evop','yield','pfcf'],GOOGL:['pe','yield','evop','pfcf'],NVDA:['pe','peg','yield','pfcf'],KTOS:['evsales','evebitda','pe','yield'],OKLO:['cap','ev','cashadj','cash']}[s];
 return '<div class="val-current">'+keys.map(k=>{const [n,v,detail]=items[k];return '<article><small>'+esc(n)+'</small><strong>'+esc(v)+'</strong><p>'+esc(detail)+'</p></article>';}).join('')+'</div>';
}
function valAssessment(s,rows,last,a){
 if(s==='OKLO')return '<div class="kpi-insight"><strong>Pre-commercial valuation</strong><p>Conventional earnings multiples cannot establish fair value without positive, durable earnings. Focus on cash-adjusted market value, funding requirements, deployment and binding commercial milestones. No assumed project value.</p></div>';
 const st=valStats(rows,'pe',last?.pe),findings=[];
 if(st)findings.push('Reconstructed P/E is '+valSigned(st.premium)+' versus the selected historical median ('+fmt(st.percentile,0)+'th percentile).');
 else findings.push('A reliable current historical P/E comparison is not available.');
 if(a){findings.push('Share price '+valSigned(a.total)+' versus trailing EPS '+valSigned(a.earn)+' over the comparable period.');findings.push('Multiple contribution '+(a.multiple>0?'+':'')+fmt(a.multiple,1)+'pp, including the interaction with earnings growth.');}
 let headline='Insufficient historical evidence for a valuation assessment';
 if(st)headline=st.premium>10?'Trading above its own historical median':st.premium< -10?'Trading below its own historical median':'Trading near its own historical median';
 if(st&&a&&a.earn>0&&a.multiple>0&&st.premium>10)headline='Earnings growth accompanied by multiple expansion';
 return '<div class="kpi-insight"><strong>'+esc(headline)+'</strong>'+list(findings)+'<p>Research question: '+esc(M[s].question)+' Historical pricing is context, not a fair-value estimate.</p></div>';
}
function valPanel(panel,m,d,p,source){
 const hist=valHistory(d),rows=valWindow(hist,valuationYears),last=rows.at(-1),a=valAttribution(rows),st=valStats(rows,valuationMetric,last?.[valuationMetric]),has=rows.length>=8,metrics=Object.keys(valuationKeys);
 const period=rows.length?rows[0].date+' to '+last.date:'History unavailable';
 const usable=metrics.filter(k=>valStats(rows,k,last?.[k]));if(usable.length&&!usable.includes(valuationMetric))valuationMetric=usable[0];
 const stat=valStats(rows,valuationMetric,last?.[valuationMetric]),short=valStats(valWindow(hist,1),valuationMetric,last?.[valuationMetric]),long=valStats(valWindow(hist,5),valuationMetric,last?.[valuationMetric]);
 const indexFields=[['price','Share price'],['eps','TTM diluted EPS'],['op','TTM operating profit']];
 // All indexed series use the same first date with positive price, EPS and operating profit where possible.
 const active=indexFields.filter(([k])=>rows.some(r=>num(r[k])&&r[k]>0));
 const base=rows.find(r=>active.every(([k])=>num(r[k])&&r[k]>0));
 const indexRows=base?rows.filter(r=>r.date>=base.date):[];
 const traces=base?active.map(([k,n])=>({name:n,x:indexRows.map(r=>r.date),y:indexRows.map(r=>num(r[k])?100*r[k]/base[k]:null),mode:'lines',connectgaps:false})):[]; 
 const options=[1,3,5,10].map(n=>'<button data-val-years="'+n+'" aria-pressed="'+(n===valuationYears)+'">'+n+'Y</button>').join('');
 panel.innerHTML='<h2>Valuation</h2><p class="stock-note">Historical comparisons use the company’s own trading history, not forecasts or a target price. '+esc(period)+'</p><div class="val-toolbar"><span>History window</span><div class="val-periods">'+options+'</div></div>'+
 '<section class="val-section"><div class="section-kicker">01 / HISTORICAL VALUATION CONTEXT</div><h3>Where does valuation sit?</h3><div class="val-ranges">'+metrics.map(k=>valRange(k,rows,last)).join('')+'</div><p class="stock-note">Weekly closes; reconstructed multiples at latest observed date '+esc(last?.date||'—')+'. Ranges require at least eight valid observations; median is calculated from available positive observations. P/B and P/FCF history is only reconstructed for suitable single-class companies.</p></section>'+
 '<section class="val-section"><div class="section-kicker">02 / PRICE VS FUNDAMENTALS</div><h3>What drove the share price?</h3>'+(traces.length&&has?'<div id="val-index-chart" class="stock-chart"></div><p class="stock-note">Indexed to 100 at the first shared available positive base ('+esc(base.date)+'). TTM EPS uses reported annual/quarterly figures or the annual + YTD change proxy. Price excludes dividends.</p>':'<p class="stock-note">Historical indexed series unavailable.</p>')+valAttributionHtml(a)+'</section>'+
 '<section class="val-section"><div class="section-kicker">03 / VALUATION DYNAMICS</div><div class="val-range-head"><h3>Multiple through time</h3><label>Multiple <select id="val-metric">'+metrics.map(k=>'<option value="'+k+'" '+(!usable.includes(k)?'disabled':'')+'>'+esc(valuationKeys[k])+'</option>').join('')+'</select></label></div>'+(stat?'<div id="val-multiple-chart" class="stock-chart"></div><div class="val-current val-summary">'+[['vs 1Y median',short?valSigned(short.premium):'—'],['vs 5Y median',long?valSigned(long.premium):'—'],['Selected-window percentile',fmt(stat.percentile,0)+'th']].map(([n,v])=>'<article><small>'+esc(n)+'</small><strong>'+esc(v)+'</strong></article>').join('')+'</div>':'<p class="stock-note">Insufficient positive comparable history for this multiple.</p>')+'</section>'+
 '<section class="val-section"><div class="section-kicker">04 / BUSINESS-SPECIFIC METRICS</div><h3>Current valuation snapshot</h3>'+valCurrent(symbol,d,last)+'<p class="stock-note">Provider multiples and latest financial-statement calculations may differ from reconstructed filing-date multiples.</p></section>'+
 '<section class="val-section"><div class="section-kicker">05 / ASSESSMENT</div><h3>What the evidence says</h3>'+valAssessment(symbol,rows,last,a)+'</section>'+
 '<details class="risk-method"><summary>Data methodology & limitations</summary><p>Weekly split-adjusted closes from Yahoo Finance, SEC companyfacts from 10-K / 10-Q filings. A filing enters the model on the next trading date; same-day figures are excluded. Interim TTM EPS may use annual EPS plus current YTD EPS minus prior YTD EPS, an approximation because weighted share counts change. Prior comparative figures are only used after their filing date. Historical P/B and P/FCF use period-end share counts, not exact daily market cap. Split adjustments use observed split dates and assume filings after the split are restated. Values can be incomplete around splits, reporting transitions and missing disclosures. Negative denominators are omitted. The sample is not a fully audited historical valuation feed.</p>'+source+'</details>';
 panel.querySelectorAll('[data-val-years]').forEach(b=>b.onclick=()=>{valuationYears=Number(b.dataset.valYears);render();});el('val-metric').value=valuationMetric;el('val-metric').onchange=e=>{valuationMetric=e.target.value;render();};
 if(traces.length&&has)chart('val-index-chart',traces,'Indexed · 100');
 if(stat)chart('val-multiple-chart',[{name:valuationKeys[valuationMetric],x:rows.map(r=>r.date),y:rows.map(r=>num(r[valuationMetric])?r[valuationMetric]:null),mode:'lines',connectgaps:false},{name:'Selected-window median',x:rows.map(r=>r.date),y:rows.map(()=>stat.median),mode:'lines',line:{dash:'dot',color:'#a8b9ce'}}],'Multiple');
}


const peerGroups={
 IBKR:[['SCHW','Charles Schwab','Direct','Brokerage and wealth management; bank balance-sheet exposure'],['HOOD','Robinhood','Direct','Retail brokerage and consumer fintech']],
 HOOD:[['IBKR','Interactive Brokers','Direct','Global brokerage, active and professional investors'],['SCHW','Charles Schwab','Direct','Brokerage, wealth management and banking'],['SOFI','SoFi','Adjacent','Digital banking, lending and financial services'],['COIN','Coinbase','Adjacent','Crypto trading, custody and infrastructure']],
 AMZN:[['MSFT','Microsoft','Segment','Cloud infrastructure and enterprise software'],['GOOGL','Alphabet','Segment','Cloud infrastructure and advertising'],['WMT','Walmart','Segment','Retail and marketplace economics'],['META','Meta Platforms','Segment','Digital advertising']],
 GOOGL:[['META','Meta Platforms','Segment','Digital advertising and consumer engagement'],['MSFT','Microsoft','Segment','Cloud and AI infrastructure'],['AMZN','Amazon','Segment','Cloud and advertising']],
 NVDA:[['AMD','Advanced Micro Devices','Direct','Accelerators, CPUs and data center computing'],['AVGO','Broadcom','Segment','Custom AI silicon and networking; software diversification']],
 KTOS:[['AVAV','AeroVironment','Direct','Unmanned systems and defense technology'],['LHX','L3Harris','Adjacent','Defense electronics, communications and aerospace'],['RTX','RTX','Adjacent','Aerospace, defense and advanced systems']],
 OKLO:[['SMR','NuScale Power','Development peer','Small modular reactor commercialization'],['NNE','NANO Nuclear Energy','Development peer','Early-stage microreactor development'],['BWXT','BWX Technologies','Adjacent','Established nuclear manufacturing and services']]
};
const peerFinance=new Set(['IBKR','HOOD','SCHW','SOFI','COIN']);
const peerState={};
const peerPalette=['#70d5bd','#80a9e5','#c2a0ec','#e7b66d','#dc899e'];
const peerSpecs={
 rev:{label:'Revenue growth (YoY)',kind:'high',unit:'%'},
 op:{label:'Operating profit growth (YoY)',kind:'high',unit:'%'},
 pretax:{label:'Pretax profit growth (YoY)',kind:'high',unit:'%'},
 eps:{label:'Diluted EPS growth (YoY)',kind:'high',unit:'%'},
 margin:{label:'Operating margin',kind:'high',unit:'%'},
 pretaxMargin:{label:'Pretax margin',kind:'high',unit:'%'},
 roe:{label:'ROE (TTM)',kind:'high',unit:'%'},
 fcfMargin:{label:'FCF margin (TTM)',kind:'high',unit:'%'},
 pe:{label:'Trailing P/E',kind:'multiple',unit:'x'},
 pb:{label:'Price / book',kind:'multiple',unit:'x'},
 evsales:{label:'EV / sales',kind:'multiple',unit:'x'},
 evebitda:{label:'EV / EBITDA',kind:'multiple',unit:'x'},
 marketcap:{label:'Market cap',kind:'context',unit:'$'},
 cash:{label:'Cash & short-term investments',kind:'context',unit:'$'},
 runway:{label:'Cash runway proxy',kind:'context',unit:'months'},
 burn:{label:'TTM free cash burn',kind:'context',unit:'$'}
};
function peerSettings(s){
 const financial=peerFinance.has(s),dev=s==='OKLO';
 return peerState[s]||(peerState[s]={enabled:peerGroups[s].map(r=>r[0]),x:dev?'cash':'rev',y:dev?'marketcap':'pe',trend:dev?'cash':'rev'});
}
function peerMedian(values){const a=values.filter(num).sort((x,y)=>x-y),i=a.length>>1;return a.length?(a.length%2?a[i]:(a[i-1]+a[i])/2):null;}
function peerPrior(s,r,k){
 const d=get(s),b=previous(d.quarterly||[],r);
 return num(b[k])?b[k]:d.peer_prior?.[r.period]?.[k]??d.prior_year?.[r.period]?.[k]??null;
}
function peerValue(s,r,k){
 const d=get(s),rows=d.quarterly||[],q=r||{},p=d.quote||{},i=rows.indexOf(r),fin=peerFinance.has(s);
 const grow=field=>num(q[field])&&peerPrior(s,q,field)>0?100*(q[field]/peerPrior(s,q,field)-1):null;
 const trailing=field=>i<0?null:ttmAt(rows,i,field);
 const validMultiple=v=>num(v)&&v>0?v:null;
 if(k==='rev')return grow('revenue');
 if(k==='op')return fin?null:grow('operating_profit');
 if(k==='pretax')return grow('pretax');
 if(k==='eps')return grow('eps');
 if(k==='margin')return fin?null:num(q.operating_margin)?q.operating_margin:null;
 if(k==='pretaxMargin')return num(q.pretax_margin)?q.pretax_margin:null;
 if(k==='roe'){const ni=trailing('net_income'),old=peerPrior(s,q,'equity'),eq=num(q.equity)&&num(old)?(q.equity+old)/2:null;return num(ni)&&eq>0?100*ni/eq:null;}
 if(k==='fcfMargin'){const f=trailing('fcf'),rev=trailing('revenue');return !fin&&num(f)&&rev>0?100*f/rev:null;}
 if(k==='pe')return validMultiple(p.trailingPE);
 if(k==='pb')return validMultiple(p.priceToBook);
 if(k==='evsales')return fin?null:validMultiple(p.enterpriseToRevenue);
 if(k==='evebitda')return fin?null:validMultiple(p.enterpriseToEbitda);
 if(k==='marketcap')return num(p.marketCap)&&p.marketCap>0?p.marketCap:null;
 if(k==='cash')return num(q.cash)&&q.cash>=0?q.cash:null;
 if(k==='burn'){const f=trailing('fcf');return num(f)&&f<0?-f:null;}
 if(k==='runway'){const f=trailing('fcf');return num(q.cash)&&q.cash>=0&&num(f)&&f<0?12*q.cash/-f:null;}
 return null;
}
function peerFmt(k,v){if(!num(v))return '—';const u=peerSpecs[k].unit;return u==='%'?pct(v):u==='x'?valMultiple(v):u==='$'?money(v):fmt(v,1)+' mo';}
function peerCompatible(s,focus){
 const a=latest(s).period,b=latest(focus).period;if(!a||!b)return false;
 return Math.abs(new Date(a)-new Date(b))/86400000<=62;
}
function peerBaseline(s,ids,k){
 const a=ids.filter(x=>x!==s&&peerCompatible(x,s)).map(x=>peerValue(x,latest(x),k)).filter(num);
 return a.length>=2?peerMedian(a):null;
}
function peerTone(k,v,med){
 if(!num(v)||!num(med)||peerSpecs[k].kind==='context')return 'neutral';
 const tol=peerSpecs[k].unit==='%'?.75:Math.max(Math.abs(med)*.02,.01);
 if(Math.abs(v-med)<=tol)return 'neutral';
 if(peerSpecs[k].kind==='multiple')return v<med?'lower':'higher';
 return v>med?'above':'below';
}
function peerSelect(id,keys,current){return '<select id="'+id+'">'+keys.map(k=>'<option value="'+k+'"'+(k===current?' selected':'')+'>'+esc(peerSpecs[k].label)+'</option>').join('')+'</select>';}
function peerGraph(s,ids,st){
 const points=ids.map((id,i)=>({id,i,x:peerValue(id,latest(id),st.x),y:peerValue(id,latest(id),st.y),date:latest(id).period})).filter(p=>num(p.x)&&num(p.y)&&peerCompatible(p.id,s));
 const other=points.filter(p=>p.id!==s),mx=other.length>=2?peerMedian(other.map(p=>p.x)):null,my=other.length>=2?peerMedian(other.map(p=>p.y)):null;
 const layout={paper_bgcolor:'transparent',plot_bgcolor:'#101a28',font:{color:'#b7c6db'},margin:{l:76,r:35,t:16,b:58},xaxis:{title:peerSpecs[st.x].label,gridcolor:'#29394c',zerolinecolor:'#536378',automargin:true},yaxis:{title:peerSpecs[st.y].label,gridcolor:'#29394c',automargin:true},showlegend:false,hovermode:'closest',shapes:[]};
 if(mx!=null&&my!=null)layout.shapes=[{type:'line',xref:'x',yref:'paper',x0:mx,x1:mx,y0:0,y1:1,line:{color:'#91a5bf',dash:'dot',width:1}},{type:'line',xref:'paper',yref:'y',x0:0,x1:1,y0:my,y1:my,line:{color:'#91a5bf',dash:'dot',width:1}}];
 // Monetary axes display USD billions rather than long tick labels.
 for(const [axis,key] of [['xaxis',st.x],['yaxis',st.y]])if(peerSpecs[key].unit==='$')layout[axis].tickformat='~s';
 const traces=points.map(p=>({type:'scatter',mode:'markers+text',name:p.id,x:[p.x],y:[p.y],text:[p.id],textposition:p.id===s?'top center':'bottom center',textfont:{size:p.id===s?14:12,color:peerPalette[p.i]},marker:{size:p.id===s?19:12,color:peerPalette[p.i],line:{color:p.id===s?'#e4fff6':'#132033',width:p.id===s?2:1}},hovertemplate:esc(p.id)+'<br>'+esc(peerSpecs[st.x].label)+': '+esc(peerFmt(st.x,p.x))+'<br>'+esc(peerSpecs[st.y].label)+': '+esc(peerFmt(st.y,p.y))+'<br>Financial period '+esc(p.date)+'<extra></extra>'}));
 return {points,other,mx,my,layout,traces};
}
function peerAssessment(s,ids){
 const cfg=peerFinance.has(s)?['rev','pretaxMargin','eps','pe']:s==='OKLO'?['cash','runway','marketcap']:['rev','margin','eps','pe'],q=latest(s),findings=[];
 for(const k of cfg){const v=peerValue(s,q,k),med=peerBaseline(s,ids,k);if(!num(v)||!num(med))continue;
 const delta=v-med,dir=peerTone(k,v,med);
 if(peerSpecs[k].kind==='context')continue;
 if(peerSpecs[k].kind==='multiple')findings.push({tone:dir==='higher'?'caution':'neutral',text:peerSpecs[k].label+' is '+peerFmt(k,v)+' versus '+peerFmt(k,med)+' peer median ('+valSigned(100*(v/med-1))+'). A lower multiple is not necessarily undervaluation.'});
 else findings.push({tone:dir==='above'?'positive':dir==='below'?'caution':'neutral',text:peerSpecs[k].label+' is '+peerFmt(k,v)+' versus '+peerFmt(k,med)+' peer median ('+(delta>0?'+':'')+fmt(delta,1)+'pp).'});
 }
 const headline=s==='OKLO'?'Compare development stage, financing and execution—not earnings multiples':findings.length?'Relative positioning across available evidence':'Insufficient comparable observations';
 return '<div class="kpi-insight"><strong>'+esc(headline)+'</strong>'+(findings.length?'<div class="peer-findings">'+findings.map(f=>'<p class="peer-finding '+f.tone+'">'+esc(f.text)+'</p>').join('')+'</div>':'<p>No peer-relative conclusions without at least two valid, comparable peer observations per metric.</p>')+'<p>'+esc(s==='AMZN'||s==='GOOGL'?'Consolidated results mix distinct businesses; segment-level cloud, retail and advertising comparisons remain a separate research need.':s==='OKLO'?'BWXT is an established operator, not a pre-commercial valuation benchmark. Funding and milestones matter more than growth multiples.':peerFinance.has(s)?'Different customer mixes, leverage, interest reporting and ownership structures limit comparability.':'Product mix, fiscal calendars and accounting definitions may explain differences.')+'</p></div>';
}
function peerPanel(panel,m,d,source){
 const s=symbol,st=peerSettings(s),group=peerGroups[s],fin=peerFinance.has(s),dev=s==='OKLO',ids=[s,...group.map(r=>r[0]).filter(id=>st.enabled.includes(id))];
 const growthKeys=fin?['rev','pretax','eps']:dev?['cash','burn','runway','rev','eps']:['rev','op','eps','pretax'];
 const multipleKeys=fin?['pe','pb']:dev?['marketcap','pb','evsales','pe','evebitda']:['pe','pb','evsales','evebitda'];
 const qualityKeys=fin?['rev','pretax','pretaxMargin','eps','roe','pe','pb']:dev?['cash','burn','runway','marketcap','pb','evsales']:['rev','op','margin','pretaxMargin','eps','roe','fcfMargin','pe','pb','evsales','evebitda'];
 const trendKeys=fin?['rev','pretax','eps','pretaxMargin','roe']:dev?['cash','burn','runway','rev']:['rev','op','eps','margin','pretaxMargin','roe','fcfMargin'];
 const graph=peerGraph(s,ids,st),excluded=ids.filter(id=>!graph.points.some(p=>p.id===id));
 const trendSeries=ids.map((id,i)=>{const rows=(get(id).quarterly||[]).slice(0,4).reverse();return {name:id,x:rows.map(r=>r.period),y:rows.map(r=>peerValue(id,r,st.trend)),mode:'lines+markers',connectgaps:false,line:{color:peerPalette[i],width:id===s?3:1.6},marker:{size:id===s?8:6},hovertemplate:esc(id)+'<br>%{x}<br>%{y:.2f}<extra></extra>'};});
 const trendHas=trendSeries.some(t=>t.y.some(num));
 const comparison='<div class="table-scroll"><table class="fund-table peer-table"><thead><tr><th>Metric</th>'+ids.map(id=>'<th class="'+(id===s?'peer-selected':'')+'">'+esc(id)+'<small>'+esc(latest(id).period||'Unavailable')+(id!==s&&!peerCompatible(id,s)?' · outside window':'')+'</small></th>').join('')+'</tr></thead><tbody>'+qualityKeys.map(k=>{const med=peerBaseline(s,ids,k);return '<tr><th scope="row">'+esc(peerSpecs[k].label)+(num(med)?'<small>Peer median '+esc(peerFmt(k,med))+'</small>':'')+'</th>'+ids.map(id=>{const v=peerValue(id,latest(id),k),tone=peerCompatible(id,s)?peerTone(k,v,med):'neutral';return '<td class="peer-cell peer-'+tone+(id===s?' peer-selected':'')+'" title="'+esc(!peerCompatible(id,s)?'Period unavailable or outside comparison window':num(med)?'Relative to included peer median':'Insufficient peers for benchmark')+'">'+esc(peerFmt(k,v))+'</td>';}).join('')+'</tr>';}).join('')+'</tbody></table></div>';
 panel.innerHTML='<h2>Peers</h2><p class="stock-note">Compare operating economics and valuation without composite rankings or an automatic winner.</p>'+
 '<section class="peer-section"><div class="section-kicker">01 / COMPETITIVE POSITIONING</div><h3>Comparison universe</h3><div class="peer-list"><article class="peer-company peer-focus"><div class="peer-ticker" style="color:'+peerPalette[0]+'">'+esc(s)+'</div><div><strong>'+esc(m.name)+'</strong><small>Selected company · '+esc(m.industry)+'</small></div><span>Selected</span></article>'+group.map(([id,name,type,desc],i)=>'<label class="peer-company"><div class="peer-ticker">'+esc(id)+'</div><div><strong>'+esc(name)+'</strong><small>'+esc(desc)+'</small></div><span class="peer-relation">'+esc(type)+'</span><input type="checkbox" data-peer="'+id+'" aria-label="Include '+esc(id)+'" '+(st.enabled.includes(id)?'checked':'')+'></label>').join('')+'</div><p class="stock-note">Select peers to update all comparisons. Segment and adjacent peers are useful context, not like-for-like benchmarks.</p></section>'+
 '<section class="peer-section"><div class="section-kicker">02 / GROWTH VS VALUATION</div><h3>'+esc(dev?'Capital and valuation map':'Growth versus valuation map')+'</h3><div class="peer-controls"><label>X axis '+peerSelect('peer-x',growthKeys,st.x)+'</label><label>Y axis '+peerSelect('peer-y',multipleKeys,st.y)+'</label></div>'+(graph.points.length?'<div id="peer-scatter" class="stock-chart peer-chart"></div>':'<p class="stock-note">No comparable observations for the selected axes.</p>')+(num(graph.mx)&&num(graph.my)?'<p class="stock-note">Dotted lines: included peers’ medians, excluding '+esc(s)+'. X: '+esc(peerFmt(st.x,graph.mx))+' · Y: '+esc(peerFmt(st.y,graph.my))+'. These are descriptive, not buy/sell quadrants.</p>':'<p class="stock-note">At least two plotted peers are required for median reference lines.</p>')+(excluded.length?'<p class="stock-note">Not plotted (unavailable, nonpositive multiple or unmatched reporting period): '+esc(excluded.join(', '))+'.</p>':'')+'</section>'+
 '<section class="peer-section"><div class="section-kicker">03 / COMPARATIVE BUSINESS QUALITY</div><h3>Business economics and valuation</h3><div class="peer-legend"><span class="peer-above">Higher operating metric</span><span class="peer-below">Lower operating metric</span><span class="peer-lower">Lower multiple</span><span class="peer-higher">Higher multiple</span><span>Neutral / unavailable</span></div>'+comparison+'<p class="stock-note">Colours are relative to the selected peer median, not historical trends or investment quality. Two valid peer observations required. Valuation multiples are positive provider figures; quarterly statement dates are shown. Comparisons exclude reporting periods more than 62 days apart from '+esc(s)+'. Tolerance: 0.75pp for rates and 2% for multiples.</p></section>'+
 '<section class="peer-section"><div class="section-kicker">04 / RELATIVE FUNDAMENTAL MOMENTUM</div><div class="val-range-head"><h3>Last four reported quarters</h3><label>Metric '+peerSelect('peer-trend',trendKeys,st.trend)+'</label></div>'+(trendHas?'<div id="peer-trend-chart" class="stock-chart peer-chart"></div>':'<p class="stock-note">Comparable quarterly series unavailable.</p>')+'<p class="stock-note">Actual fiscal period ends; missing observations stay blank. YoY growth requires a positive comparable prior-year base. No synthetic quarter values.</p></section>'+
 '<section class="peer-section"><div class="section-kicker">05 / COMPETITIVE ASSESSMENT</div><h3>What stands out</h3>'+peerAssessment(s,ids)+'</section>'+
 '<details class="risk-method"><summary>Data methodology & sources</summary><p>Standardized quarterly statements and provider multiples; SEC prior-year comparatives used only when compatible with matching provider observations. ROE = TTM common net income / average current and year-ago common equity; FCF margin = TTM reported FCF / TTM revenue. Runway proxy = reported cash and investments / trailing monthly free cash burn, not committed project funding. Generic operating margins, EV multiples and FCF metrics are not used for financial-company comparisons. Data for different fiscal periods, currencies and business mixes may not be fully comparable.</p>'+source+'</details>';
 panel.querySelectorAll('[data-peer]').forEach(b=>b.onchange=()=>{const id=b.dataset.peer;if(b.checked&&!st.enabled.includes(id))st.enabled.push(id);if(!b.checked)st.enabled=st.enabled.filter(x=>x!==id);render();});
 for(const [id,k] of [['peer-x','x'],['peer-y','y'],['peer-trend','trend']]){el(id).value=st[k];el(id).onchange=e=>{st[k]=e.target.value;render();};}
 if(window.Plotly&&graph.points.length)Plotly.react('peer-scatter',graph.traces,graph.layout,{responsive:true,displayModeBar:false});
 if(trendHas)chart('peer-trend-chart',trendSeries,peerSpecs[st.trend].label);
}


const thesisConfig={
IBKR:{title:'Scale-driven global brokerage compounding',thesis:'A growing customer franchise, efficient execution infrastructure and client asset accumulation can support profitable expansion through interest-rate cycles.',positive:'Customer growth translates into durable engagement and monetisation, while capital and credit controls remain resilient.',invalid:'Persistent deterioration in customer engagement or monetisation, material inadequacy of capital or collateral controls, or a structural decline in earnings power.',checks:[
 ['Customer franchise growth','kpi','accounts','up','Accounts should expand year over year.'],['Trading monetisation','kpi','comm','up','Commissions should grow with the franchise; investigate persistent divergence from account growth.'],['Interest economics','kpi','nim','up','Watch net interest margin compression; lower rates are not automatically a broken thesis.'],['Core profitability','fin','pretax_margin','up','Sustained pretax margin erosion requires reassessment.'],['Regulatory capital','risk','capital','','Review actual subsidiary capital buffers.'],['Customer credit','risk','credit','','Review margin loan growth and realized losses.']],catalysts:[['Monthly brokerage metrics','Customer accounts, DARTs and margin loans','Monthly disclosure cadence'],['Rate decisions','Net interest income sensitivity and balance growth','Policy decision watch'],['Quarterly earnings','Pretax margin, capital surplus and customer bad debt','Quarterly review']]},
HOOD:{title:'Consumer finance platform diversification',thesis:'A larger funded-customer base and deeper product adoption can diversify Robinhood beyond cyclical transaction revenue, provided credit losses and non-operating earnings distortions remain contained.',positive:'Gold adoption, net deposits and sustainable per-customer monetisation increase; lending economics remain sound.',invalid:'Persistent organic customer stagnation or weakening monetisation combined with material credit losses, or profitability primarily reliant on non-operating gains.',checks:[
 ['Customer franchise','kpi','customers','up','Funded customer growth; separate acquisitions from organic growth.'],['Net deposits','kpi','depositRate','up','Deposit rate measures asset gathering; review sequential seasonality.'],['Gold adoption','kpi','gold','up','Paid membership should continue expanding.'],['Revenue per customer','kpi','arpu','up','Monitor sustained monetisation versus product mix.'],['Credit portfolio','risk','cards','','Track delinquency, charge-offs and provision trends.'],['Earnings quality','risk','earnings','','Check operating economics versus reported EPS.']],catalysts:[['Quarterly operating metrics','Net deposits, funded customers, Gold and ARPU','Quarterly review'],['Card portfolio seasoning','Delinquencies, charge-offs and loss allocation','Credit disclosure watch'],['New product economics','Event contracts, crypto and subscriptions; net incremental profit','Product and regulatory watch']]},
AMZN:{title:'AWS-led profitable growth',thesis:'AWS and advertising can drive long-term earnings growth while AI infrastructure investment eventually translates into higher capital productivity and free cash flow.',positive:'AWS growth and margin remain resilient, retail profitability holds, and incremental cloud profit and cash generation catch up with capital deployed.',invalid:'Sustained deterioration in AWS returns on capital despite aggressive investment, or prolonged cash deterioration without evidence of improving incremental returns.',checks:[
 ['AWS revenue growth','kpi','awsGrowth','up','Constant-currency YoY growth; monitor sustained deceleration.'],['AWS operating margin','kpi','awsMargin','up','Watch sustained margin compression during the investment cycle.'],['AWS capital productivity','kpi','assetReturn','context','TTM AWS operating profit / average segment assets; need comparable periods and incremental asset/profit growth.'],['Cash flow and capex','ttm','fcf','up','TTM operating cash flow less capex; negative FCF warrants scrutiny, not automatic invalidation.'],['North America retail margin','kpi','naMargin','up','Monitor geographic operating margins; ads overlap geographic results.'],['International retail margin','kpi','intlMargin','up','Monitor geographic profitability.'],['Debt and financing costs','fin','interest_expense','context','Review debt, interest, leases and depreciation against cash generation.']],catalysts:[['Quarterly AWS disclosures','Revenue, margins, segment assets and backlog','Quarterly review'],['AI capacity investment','Capex, depreciation and incremental cloud profit','Infrastructure / filing watch'],['Retail and advertising economics','Regional margin trajectory and advertising monetisation','Quarterly review']]},
GOOGL:{title:'Search durability and profitable Cloud scale',thesis:'Search monetisation and distribution remain durable through AI changes while Cloud and subscriptions deepen growth and cash generation.',positive:'Search revenue holds up, traffic costs remain manageable, Cloud converts backlog profitably and capital intensity delivers returns.',invalid:'Structural loss of search economics or distribution, or sustained AI investment without adequate incremental operating profit and cash generation.',checks:[
 ['Search monetisation','kpi','search','up','Search revenue should remain resilient through AI transitions.'],['Cloud growth','kpi','cloud','up','Monitor growth and backlog conversion.'],['Cloud profitability','kpi','cloudMargin','up','Segment margins should hold as Cloud expands.'],['Traffic acquisition costs','kpi','tac','down','Higher TAC / advertising revenue can pressure economics.'],['Free cash flow','ttm','fcf','up','Watch cash generation through infrastructure investment.'],['Distribution and remedies','manual','','','Review antitrust remedies, defaults and AI search monetisation.']],catalysts:[['Search and AI monetisation','Search growth, AI serving cost and commercial query trends','Quarterly review'],['Cloud backlog conversion','Revenue, operating income and infrastructure deployment','Quarterly review'],['Antitrust and distribution','Material legal orders and implementation','Legal development watch']]},
NVDA:{title:'Accelerated computing platform leadership',thesis:'Demand for accelerated computing, networking and software ecosystem advantages can sustain revenue growth and strong margins across successive product generations.',positive:'Data Center demand expands, margins remain resilient, customers deploy capacity economically and working capital remains aligned with sales.',invalid:'Sustained demand slowdown, meaningful structural margin compression or evidence that ecosystem advantages and customer economics are deteriorating.',checks:[
 ['Data Center demand','kpi','dc','up','Monitor revenue growth and architecture transitions.'],['Compute and networking','kpi','compute','up','Track reporting-segment demand, distinct from Data Center compute.'],['Gross margin','fin','gross_margin','up','Watch sustained compression after product-mix and ramp effects.'],['Inventory exposure','risk','inventory','','Compare inventory growth with revenue growth.'],['Receivables exposure','risk','receivables','','Monitor receivables versus sales and customer financing.'],['Customer concentration','manual','','','Review disclosed customer concentration, commitments and export exposure.']],catalysts:[['Architecture ramp','New product shipments, supply and gross margin','Product and quarterly review'],['Customer AI spending','Hyperscaler capex, utilization and demand','Customer earnings watch'],['Export and supply restrictions','Policy changes and customer concentration','Regulatory development watch']]},
KTOS:{title:'Backlog conversion into profitable production',thesis:'Defense technology demand and funded contract awards can support scalable production, improving segment economics and cash conversion.',positive:'Funded backlog grows, bookings convert into profitable revenue, and working capital and production capex remain financeable.',invalid:'Repeated program delays, adverse fixed-price execution or persistent cash burn and dilution despite backlog growth.',checks:[
 ['Demand pipeline','kpi','backlog','up','Track total backlog and funding mix together.'],['Funded share of backlog','kpi','fundedShare','up','Funded orders are more concrete than unfunded pipeline.'],['TTM book-to-bill','kpi','bookTTM','above1','Bookings exceeding billings support pipeline replenishment.'],['Operating margin','fin','operating_margin','up','Monitor production economics and contract cost overruns.'],['Free cash flow','ttm','fcf','up','Check cash conversion and capital needs.'],['Receivables exposure','risk','receivables','','Investigate working capital growing faster than sales.']],catalysts:[['Contract awards','Funded awards, book-to-bill and program scope','Award announcement watch'],['Production ramps','Delivery schedules, segment profitability and cost execution','Quarterly review'],['Capital requirements','Working capital, capex and share issuance','Filing watch']]},
OKLO:{title:'Pre-commercial nuclear execution',thesis:'A staged path through licensing, fuel, construction and funded binding customer commitments could establish commercial reactor economics.',positive:'Each authorization gate and fuel/construction milestone is completed, binding agreements convert into funded projects, and runway covers the execution path.',invalid:'Material licensing or deployment delays without credible mitigation, inability to secure fuel or funded customers, or financing gaps that materially impair execution.',checks:[
 ['Site and construction','milestone',0,'','Track actual construction readiness versus authorization scope.'],['Design and safety authorization','milestone',4,'','Preliminary approvals are not operating permission.'],['Fuel readiness','milestone',5,'','Fuel award is not fabricated fuel or delivery.'],['Binding customer capacity','milestone',7,'','Verify binding PPAs, MW and financing separately.'],['Commercial operation','milestone',8,'','Verify remaining authorizations and deployment milestones.'],['Cash runway','risk','runway','','Cash burn proxy does not establish project funding sufficiency.']],catalysts:[['Licensing decisions','DOE/NRC approvals and remaining gates','Agency announcement watch'],['Fuel and construction','Fabrication, delivery, site construction and commissioning','Milestone watch'],['Binding PPAs and financing','Contracted MW, capital commitments and project funding','Contract and financing watch']]}
};
const thesisStatus={support:'Supports thesis',watch:'Monitor',pressure:'Under pressure',neutral:'Observation',unknown:'Not assessed'};
function thesisCheck(s,d,check){
 const [name,type,key,rule,condition]=check,rows=d.quarterly||[],q=rows[0]||{},cfg=kpiData[s];
 const out=(status,value,period,detail,src='')=>({name,condition,status,value,period,detail,src});
 const unknown=(detail='Required comparable evidence unavailable.',period=q.period||'—')=>out('unknown','—',period,detail);
 if(type==='manual')return unknown('Requires filing or event review; no automated conclusion.');
 if(type==='milestone'){const r=cfg.milestones?.[key];if(!r)return unknown();const unassessed=r[2]==='Not assessed';return out(unassessed?'unknown':'neutral',r[1],r[3],r[4],cfg.sources[0][1]);}
 if(type==='risk'){
  const r=riskAt(s,d,q,key);if(r.status==='unknown')return unknown(r.why);
  return out(r.status==='high'?'pressure':r.status==='watch'||r.status==='structural'?'watch':r.status==='clear'?'support':'neutral',r.metric,q.period||'—',r.why,r.src||'');
 }
 if(type==='kpi'){
  const r=cfg.rows.find(x=>x.id===key);if(!r||!num(r.values[3]))return unknown('Operational disclosure not populated.',cfg.period);
  const v=r.values[3],old=r.values[4],delta=kpiDelta(r,v,old),trend=kpiTrend(r,3),stale=q.period&&q.period>cfg.period;
  let status='neutral',detail=r.why;
  if(stale){status='unknown';detail+=' Newer financial period exists; operational snapshot needs refresh.';}
  else if(rule==='context'){status='watch';detail+=' Comparable capital-return history is required for a directional assessment.';}
  else if(rule==='above1'){status=v>1?'support':v<1?'watch':'neutral';detail+=' Research condition: above 1x.';}
  else if(trend==='bad'){status='pressure';detail+=' Two successive adverse quarterly movements.';}
  else if(trend==='good'){status='support';detail+=' Two successive favorable quarterly movements.';}
  else if(num(delta)){const tol=r.unit==='%'?.75:2,sign=rule==='down'?-delta:delta;status=sign>tol?'support':sign< -tol?'watch':'neutral';detail+=' Single YoY comparison, not a confirmed multi-quarter trend.';}
  else {status='neutral';detail+=' Comparable trend not established.';}
  return out(status,kpiFmt(r,v)+(num(delta)?' · YoY '+kpiDeltaText(r,v,old):''),cfg.period,detail,cfg.sources[r.src]?.[1]||'');
 }
 if(type==='ttm'){
  const now=ttmAt(rows,0,key);if(!num(now))return unknown('Four consecutive quarters required for TTM calculation.');
  const old=ttmAt(rows,4,key),qoq=ttmAt(rows,1,key),prior=ttmAt(rows,2,key);
  const dirs=[direction(now,qoq,key),direction(qoq,prior,key)],trend=cellTrend(key,dirs);
  const status=now<0?'pressure':trend==='bad'?'watch':trend==='good'?'support':'neutral';
  return out(status,money(now)+' TTM',q.period,(num(old)?'Year-ago TTM '+money(old)+'. ':'')+(now<0?'Negative reported FCF; distinguish planned investment from operating weakness.':trend==='good'?'Two successive TTM improvements.':trend==='bad'?'Two successive TTM declines.':'Positive cash generation; recovery trend not established.'));
 }
 if(type==='fin'){
  const v=q[key];if(!num(v))return unknown();const trend=columnTrend(rows,0,key),old=periodBase(rows,q,key);
  const status=rule==='context'?'neutral':trend==='bad'?'pressure':trend==='good'?'support':num(old)&&direction(v,old,key)<0?'watch':'neutral';
  return out(status,fundValue(key,v),q.period,(num(old)?'Year-ago '+fundValue(key,old)+'. ':'')+(rule==='context'?'Review alongside debt, depreciation and operating cash flow.':trend==='bad'?'Two adverse QoQ movements.':trend==='good'?'Two favorable QoQ movements.':'Multi-quarter trend not established.'));
 }
 return unknown();
}
function thesisRead(key,fallback){try{const raw=localStorage.getItem(key);if(raw===null)return fallback;return JSON.parse(raw)??fallback;}catch{return fallback;}}
function thesisWrite(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{return false;}}
const convictionOptions=['Thesis strengthened','Thesis unchanged','New concern','Thesis weakened','Thesis invalidated','Research note'];
function thesisPanel(panel,m,d,source){
 const s=symbol,cfg=thesisConfig[s],q=d.quarterly?.[0]||{},checks=cfg.checks.map(c=>thesisCheck(s,d,c)),key='stock-intelligence-notes-'+s,customKey='stock-intelligence-thesis-'+s;
 let custom=thesisRead(customKey,{});if(!custom||typeof custom!=='object'||Array.isArray(custom))custom={};
 let notes=thesisRead(key,[]);if(!Array.isArray(notes))notes=[];
 const active={title:custom.title||cfg.title,thesis:custom.thesis||cfg.thesis,positive:custom.positive||cfg.positive,invalid:custom.invalid||cfg.invalid};
 const sourceLink=c=>c.src?' <a href="'+esc(c.src)+'" target="_blank" rel="noopener">Source ↗</a>':'';
 panel.innerHTML='<h2>Thesis & catalysts</h2><p class="stock-note">Research hypothesis, evidence and review log · no composite conviction score or automated buy/sell decision.</p>'+
 '<section class="thesis-section"><div class="section-kicker">01 / INVESTMENT THESIS</div><article class="thesis-hero"><div class="thesis-hero-head"><span>'+esc(s)+' · '+(custom.thesis?'PERSONAL THESIS':'PROPOSED RESEARCH THESIS')+'</span><button id="thesis-edit" class="stock-action">Edit thesis</button></div><h3>'+esc(active.title)+'</h3><p>'+esc(active.thesis)+'</p><div class="thesis-conditions"><div><strong>WHAT MUST GO RIGHT</strong><p>'+esc(active.positive)+'</p></div><div><strong>WHAT WOULD INVALIDATE THE THESIS</strong><p>'+esc(active.invalid)+'</p></div></div></article><div id="thesis-editor" hidden class="thesis-form"><label for="thesis-title">Title</label><input id="thesis-title" value="'+esc(active.title)+'"><label for="thesis-body">Investment thesis</label><textarea id="thesis-body">'+esc(active.thesis)+'</textarea><label for="thesis-positive">What must go right</label><textarea id="thesis-positive">'+esc(active.positive)+'</textarea><label for="thesis-invalid">Invalidation criteria</label><textarea id="thesis-invalid">'+esc(active.invalid)+'</textarea><div class="thesis-actions"><button id="thesis-save-edit" class="stock-action">Save thesis</button><button id="thesis-reset" class="stock-action">Restore proposed thesis</button></div><p id="thesis-edit-status" class="stock-note"></p></div></section>'+
 '<section class="thesis-section"><div class="section-kicker">02 / THESIS VALIDATION</div><h3>Is the evidence supporting the thesis?</h3><div class="thesis-checks">'+checks.map(c=>'<article class="thesis-check thesis-'+c.status+'"><div class="thesis-check-top"><strong>'+esc(c.name)+'</strong><span>'+esc(thesisStatus[c.status])+'</span></div><div class="thesis-metric">'+esc(c.value)+'</div><p>'+esc(c.condition)+'</p><div class="thesis-evidence">'+esc(c.detail)+'</div><small>'+esc(c.period)+sourceLink(c)+'</small></article>').join('')+'</div><p class="stock-note">These are evidence screens for the proposed company-specific research conditions, not a verdict on your edited thesis. Two consistent QoQ moves (2% relative or 0.75pp tolerance) take precedence when available; single YoY changes are labelled. Reported milestones are observations, not final approvals. Stale KPI snapshots remain unassessed.</p></section>'+
 '<section class="thesis-section"><div class="section-kicker">03 / CATALYST WATCHLIST</div><h3>What could change the thesis?</h3><div class="catalyst-grid">'+cfg.catalysts.map(([name,what,cadence])=>'<article class="catalyst-card"><span class="catalyst-kind">WATCH ITEM · NO CONFIRMED DATE</span><h4>'+esc(name)+'</h4><p>'+esc(what)+'</p><small>'+esc(cadence)+'</small></article>').join('')+'</div><h4 class="thesis-subhead">Your dated catalysts</h4><div id="catalyst-list"></div><div class="thesis-form catalyst-form"><label for="cat-name">Event / development</label><input id="cat-name" placeholder="e.g. Quarterly results or licensing decision"><div class="thesis-form-row"><div><label for="cat-date">Expected or confirmed date (optional)</label><input id="cat-date" type="date"></div><div><label for="cat-status">Date status</label><select id="cat-status"><option value="Watch">Watch / anticipated</option><option value="Confirmed">Confirmed by source</option></select></div></div><label for="cat-source">Source URL (required for confirmed dates)</label><input id="cat-source" type="url" placeholder="https://…"><button id="cat-add" class="stock-action">Add catalyst</button><p id="cat-feedback" class="stock-note"></p></div></section>'+
 '<section class="thesis-section"><div class="section-kicker">04 / THESIS EVOLUTION</div><h3>Research journal</h3><p class="stock-note">Record a dated conclusion after each earnings release or material event. No historical conviction has been invented. Notes and customizations stay in this browser; they do not sync or upload to GitHub.</p><div class="thesis-form"><div class="thesis-form-row"><div><label for="thesis-conviction">Review outcome</label><select id="thesis-conviction">'+convictionOptions.map(o=>'<option>'+esc(o)+'</option>').join('')+'</select></div><div><label for="thesis-period">Reporting period or event date</label><input id="thesis-period" type="date" value="'+esc(q.period||'')+'"></div></div><label for="thesis">Research conclusion</label><textarea id="thesis" placeholder="What changed? What evidence supports or challenges the thesis? What will you monitor next?"></textarea><button class="stock-action" id="save">Save dated review + evidence snapshot</button><p id="save-status" class="stock-note"></p></div><div id="history"></div></section>'+
 '<details class="risk-method"><summary>Evidence & limitations</summary><p>Quantitative checks reuse the latest available standardized financials and the dated Business KPIs / Financial Risk snapshots. Disclosures are not a fully automated event feed. Catalyst dates are user-entered and not independently verified by this dashboard. Notes are private to the current browser, and clearing browser data removes them.</p>'+source+'</details>';
 el('thesis-edit').onclick=()=>{el('thesis-editor').hidden=!el('thesis-editor').hidden;};
 el('thesis-save-edit').onclick=()=>{const next={title:el('thesis-title').value.trim(),thesis:el('thesis-body').value.trim(),positive:el('thesis-positive').value.trim(),invalid:el('thesis-invalid').value.trim()};if(!Object.values(next).every(Boolean)){el('thesis-edit-status').textContent='Complete all four fields.';return;}if(thesisWrite(customKey,next))render();else el('thesis-edit-status').textContent='Browser storage unavailable; not saved.';};
 el('thesis-reset').onclick=()=>{if(thesisWrite(customKey,{}))render();else el('thesis-edit-status').textContent='Browser storage unavailable; not saved.';};
 const catKey='stock-intelligence-catalysts-'+s;let cats=thesisRead(catKey,[]);if(!Array.isArray(cats))cats=[];
 const safeUrl=u=>/^https?:\/\/[^\s]+$/i.test(u||'');
 const drawCats=()=>{el('catalyst-list').innerHTML=cats.length?cats.slice().sort((a,b)=>(a.date||'9999').localeCompare(b.date||'9999')).map(c=>'<article class="catalyst-saved"><div><strong>'+esc(c.name)+'</strong><small>'+esc(c.date||'Date not specified')+' · '+esc(c.status==='Confirmed'?'User-marked confirmed':'Watch / anticipated')+(safeUrl(c.url)?' · <a href="'+esc(c.url)+'" target="_blank" rel="noopener">Source ↗</a>':'')+'</small></div><button class="stock-action" data-cat-delete="'+esc(c.id)+'">Remove</button></article>').join(''):'<p class="stock-note">No dated catalysts added yet.</p>';el('catalyst-list').querySelectorAll('[data-cat-delete]').forEach(b=>b.onclick=()=>{const next=cats.filter(c=>c.id!==b.dataset.catDelete);if(thesisWrite(catKey,next)){cats=next;drawCats();}else el('cat-feedback').textContent='Browser storage unavailable; not changed.';});};
 drawCats();
 el('cat-add').onclick=()=>{const name=el('cat-name').value.trim(),date=el('cat-date').value,status=el('cat-status').value,url=el('cat-source').value.trim();if(!name){el('cat-feedback').textContent='Enter a catalyst name.';return;}if(status==='Confirmed'&&(!date||!safeUrl(url))){el('cat-feedback').textContent='Confirmed dates require a date and source URL.';return;}if(url&&!safeUrl(url)){el('cat-feedback').textContent='Use a valid http(s) source URL.';return;}const next=[...cats,{id:new Date().toISOString()+'-'+cats.length,name,date,status,url}];if(thesisWrite(catKey,next)){cats=next;drawCats();el('cat-name').value='';el('cat-date').value='';el('cat-source').value='';el('cat-status').value='Watch';el('cat-feedback').textContent='Saved in this browser.';}else el('cat-feedback').textContent='Browser storage unavailable; not saved.';};
 const draw=()=>{el('history').innerHTML=notes.length?'<div class="thesis-timeline">'+notes.map(n=>'<article class="thesis-entry"><div class="thesis-entry-head"><strong>'+esc(n.outcome||'Research note')+'</strong><small>'+esc(String(n.date||'').slice(0,10))+(n.period?' · Evidence period '+esc(n.period):'')+'</small></div><p class="thesis-entry-text">'+esc(n.text)+'</p>'+(n.thesis?'<details><summary>Thesis at time of review</summary><p>'+esc(n.thesis.title)+' — '+esc(n.thesis.thesis)+'</p><p>Invalidation: '+esc(n.thesis.invalid)+'</p></details>':'')+(Array.isArray(n.evidence)?'<details><summary>Saved evidence snapshot</summary>'+table(['Condition','Observation','Status','Period'],n.evidence.map(c=>[c.name,c.value,thesisStatus[c.status]||c.status,c.period]))+'</details>':'')+'</article>').join('')+'</div>':'<p class="stock-note">No dated reviews yet. Start with your own conclusion; no example history has been added.</p>';};
 draw();
 el('thesis-conviction').value='Thesis unchanged';
 el('save').onclick=()=>{const text=el('thesis').value.trim();if(!text){el('save-status').textContent='Enter a research conclusion.';return;}const next=[{date:new Date().toISOString(),period:el('thesis-period').value,outcome:el('thesis-conviction').value,text,thesis:active,evidence:checks.map(({name,status,value,period})=>({name,status,value,period}))},...notes];if(thesisWrite(key,next)){notes=next;draw();el('thesis').value='';el('save-status').textContent='Review and evidence saved in this browser.';}else el('save-status').textContent='Browser storage unavailable; not saved.';};
}

function render(){controls();const m=M[symbol],d=get(symbol),q=latest(symbol),p=d.quote;
el('tradingview-link').href='https://www.tradingview.com/chart/?symbol='+encodeURIComponent((symbol==='OKLO'?'NYSE':'NASDAQ')+':'+symbol);el('company').textContent=symbol+' · '+m.name;el('industry').textContent=m.industry;el('question').textContent=m.question;el('price').textContent=p.lastClose==null?'—':'$'+fmt(p.lastClose,2);el('price-date').textContent=p.date?'Close · '+p.date:'Price unavailable';
el('overview').innerHTML=Object.keys(M).map(s=>'<tr tabindex="0" data-symbol="'+s+'">'+[s,latest(s).period||'—',pct(yoy(s,'revenue')),pct(latest(s).operating_margin),pct(yoy(s,'eps')),fmt(get(s).quote.trailingPE)].map(v=>'<td>'+esc(v)+'</td>').join('')+'</tr>').join('');
el('overview').querySelectorAll('tr').forEach(r=>{r.onclick=()=>select(r.dataset.symbol);r.onkeydown=e=>{if(e.key==='Enter')select(r.dataset.symbol);};});
el('cards').innerHTML=[['REVENUE YoY',pct(yoy(symbol,'revenue'))],['OPERATING MARGIN',pct(q.operating_margin)],['EPS YoY',pct(yoy(symbol,'eps'))],['TRAILING P/E',fmt(p.trailingPE)]].map(a=>'<div class="stat-card"><div class="stat-top">'+a[0]+'</div><div class="stat-number">'+a[1]+'</div><div class="stat-desc">'+esc(q.period||'No statement data')+'</div></div>').join('');
const panel=el('panel');const note='<p class="stock-note">Period ends, not filing dates. Standardized Yahoo Finance data; missing fields are not estimates. Currency: '+esc(p.financialCurrency||'not supplied')+'.</p>';
const source='<p><a target="_blank" rel="noopener" href="https://www.sec.gov/edgar/browse/?CIK='+m.sec+'">SEC filings ↗</a> · <a target="_blank" rel="noopener" href="https://finance.yahoo.com/quote/'+symbol+'/financials/">Financial data source ↗</a></p>';
panel.classList.remove('overview-panel');
if(tab==='Overview'){overviewPanel(panel,m,d,q,p,source);}
else if(tab==='Fundamentals'){fundamentalsPanel(panel,d,note,source);}
else if(tab==='Financial risk'){riskPanel(panel,m,d,q,note,source);}
else if(tab==='Business KPIs'){kpiPanel(panel,m,d,source);}
else if(tab==='Valuation'){valPanel(panel,m,d,p,source);}
else if(tab==='Peers'){peerPanel(panel,m,d,source);}
else if(tab==='Thesis & catalysts'){thesisPanel(panel,m,d,source);}
}
const h=location.hash.slice(1);if(M[h])symbol=h;
render();
fetch('data/stocks.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('Data not published');return r.json();}).then(j=>{data=j;el('freshness').textContent=j.generated_at?.slice(0,10)||'Unknown';el('data-status').textContent=j.source||'';render();}).catch(()=>{el('freshness').textContent='Unavailable';el('data-status').textContent='Financial data has not yet been published. Research framework remains accessible.';});
