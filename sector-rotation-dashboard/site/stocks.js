'use strict';
const M={
IBKR:{name:'Interactive Brokers',industry:'Global brokerage',question:'Can customer and asset growth sustain earnings through rate cycles?',peers:['SCHW','HOOD'],kpis:['Customer accounts / equity / net deposits','DARTs and commissions per account','Net interest margin and interest income mix','Regulatory capital coverage and excess','Margin loans / customer equity; bad debt','Noncontrolling ownership and tax receivable agreements'],risks:['Rate sensitivity and falling net interest margins','Gap risk and customer margin loan losses','Governance and ownership exchanges'],sec:'1381197'},
HOOD:{name:'Robinhood',industry:'Diversified fintech',question:'Can diversification sustain growth without weakening credit quality?',peers:['IBKR','SCHW','SOFI','COIN'],kpis:['Funded customers / net deposits / assets','Gold subscribers and revenue per user','Options / crypto / equities / event contracts','Credit card balances, delinquencies, charge-offs','FICO mix and card credit provisions','Investment gains/losses versus operating profit'],risks:['Unsecured credit losses and portfolio seasoning','Speculative trading cyclicality','Non-operating gains and tax distortions'],sec:'1783879'},
AMZN:{name:'Amazon',industry:'Retail, advertising & cloud',question:'Will AI investment deliver capital returns and restore cash generation?',peers:['MSFT','GOOGL','WMT','META'],kpis:['AWS revenue growth and backlog','AWS operating margin and profit / average segment assets','North America and International retail margins','Advertising growth','Operating cash flow versus capex and leases','Depreciation, debt and financing costs'],risks:['Capex outpacing AWS operating profit','Infrastructure commitments and depreciation','Retail margin reversal'],sec:'1018724'},
GOOGL:{name:'Alphabet',industry:'Search, advertising & cloud',question:'Can search economics withstand AI disruption while cloud scales?',peers:['MSFT','META','AMZN'],kpis:['Search and YouTube revenue','Cloud growth / backlog / segment margin','Services operating margin','Traffic acquisition costs / revenue','AI capex and depreciation','Other Bets losses'],risks:['AI search cannibalisation and serving costs','Antitrust and distribution remedies','Cloud capital productivity'],sec:'1652044'},
NVDA:{name:'NVIDIA',industry:'AI semiconductor infrastructure',question:'Can accelerated computing demand and margins remain durable?',peers:['AMD','AVGO'],kpis:['Data center compute and networking revenue','Gross margin and incremental margin','Customer concentration','Inventory and receivables','Purchase commitments and supply capacity','Export restrictions and customer financing'],risks:['Hyperscaler capex slowdown','Inventory and receivables outpacing revenue','Customer concentration and export controls'],sec:'1045810'},
KTOS:{name:'Kratos Defense',industry:'Defence technology',question:'Can funded backlog turn into profitable production and cash flow?',peers:['AVAV','LHX'],kpis:['Organic and segment revenue growth','Funded versus unfunded backlog','Book-to-bill and contract awards','Segment margins and production ramp','Contract assets and working capital','Capex, SBC and capital raising'],risks:['Fixed-price contract overruns','Unfunded backlog and delayed awards','Cash conversion and financing'],sec:'1069258'},
OKLO:{name:'Oklo',industry:'Advanced nuclear development',question:'Can licensing, deployment and financing converge before material dilution?',peers:['SMR','NNE'],kpis:['NRC licensing milestones','First deployment and construction readiness','Binding contracts versus nonbinding agreements','Contracted MW and fuel procurement','Capital cost per MW and funding commitments','Unrestricted cash, burn and runway'],risks:['Licensing and deployment delays','Nonbinding pipeline not converting','Funding gaps and equity dilution'],sec:'1849056'}};
const tabs=['Overview','Fundamentals','Financial risk','Business KPIs','Valuation','Peers','Technical','Thesis & catalysts'];
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
 const rr=riskFlags(symbol),prices=d.prices||[],sma=prices.length>=200?prices.slice(-200).reduce((a,r)=>a+r.close,0)/200:null,dist=sma&&p.lastClose!=null?100*(p.lastClose/sma-1):null;
 const pre=symbol==='OKLO',pe=p.trailingPE>0?p.trailingPE:null;
 const peerPE=m.peers.map(s=>get(s).quote.trailingPE).filter(v=>v>0),med=peerPE.length>=2?median(peerPE):null;
 const mom=diff==null?'Not assessed':diff>2?'Accelerating':diff<-2?'Slowing':'Broadly stable';
 const growthLabel=pre?'Pre-commercial':assessmentLabel(rg,'Growing','Contracting');
 const profitLabel=q.operating_profit==null?'Not assessed':q.operating_profit>0?'Profitable':q.operating_profit<0?'Loss-making':'Break-even';
 const technicalLabel=dist==null?'Not assessed':dist>0?'Above 200D':dist<0?'Below 200D':'At 200D';
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
 summaryTile('Valuation',pre?'Milestones':pe==null?'N/A':med?(pe>med?'Above peers':'At/below peers'):'Current P/E',pe?fmt(pe)+'x trailing P/E':'P/E unavailable / not relevant','Valuation',med&&pe&&pe>med?'caution':'neutral')+
 summaryTile('Technical trend',technicalLabel,dist==null?'Price history unavailable':signed(dist)+' vs 200D SMA','Technical',tone(dist))+'</div>'+
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
function momentumTable(annual,qrows){
 const recent=qrows.slice(0,4);
 const keys=['revenue','operating_profit','pretax','operating_margin','pretax_margin','eps','roe','roic','fcf','shares'];
 const named=Object.fromEntries([...fields,...extraFields]);
 const selected=keys.filter(k=>!broker(symbol)||!['operating_profit','operating_margin','roic','fcf'].includes(k));
 return '<div class="table-scroll"><table class="fund-table momentum-table"><thead><tr>'+['Metric','Long-term trend','Latest quarter YoY',...recent.map(r=>r.period)].map(n=>'<th>'+esc(n)+'</th>').join('')+'</tr></thead><tbody>'+selected.map(k=>{
 const a=annual.find(r=>num(r[k])), candidates=a?annual.filter(r=>num(r[k])&&r.period<a.period&&(new Date(a.period)-new Date(r.period))/86400000<=1850):[],b=candidates.at(-1);
 let long='—',lc='muted';
 if(a&&b){const years=(new Date(a.period)-new Date(b.period))/86400000/365.2425;if(years>=1.8){const y=Math.round(years);if(isRate(k))long=y+'Y '+changeText(a[k],b[k],k);else if(a[k]>0&&b[k]>0){const c=100*(Math.pow(a[k]/b[k],1/years)-1);long=y+'Y '+(c>0?'+':'')+fmt(c,1)+'% C';}else long=y+'Y '+changeText(a[k],b[k],k);lc=columnTrend(annual,annual.indexOf(a),k,true);}}
 const q=recent[0]||{},prev=periodBase(qrows,q,k);
 return '<tr><th scope="row">'+esc(named[k])+'</th>'+trendCell(long,lc,'Actual available fiscal year span; color uses two latest annual comparisons')+trendCell(changeText(q[k],prev,k),yoyColour(qrows,k),'Single YoY comparison, independent of quarterly trend')+recent.map((r,i)=>trendCell(fundValue(k,r[k]),columnTrend(qrows,i,k),'Trend uses two consecutive QoQ movements')).join('')+'</tr>';
 }).join('')+'</tbody></table></div>';
}
function detailedTable(rows,annual){
 return '<div class="table-scroll"><table class="fund-table"><thead><tr>'+['Metric',...rows.map(r=>r.period),'Latest YoY'].map(n=>'<th>'+esc(n)+'</th>').join('')+'</tr></thead><tbody>'+[...fields,...extraFields].map(([k,n])=>'<tr><th scope="row">'+esc(n)+'</th>'+rows.map((r,i)=>trendCell(fundValue(k,r[k]),columnTrend(rows,i,k,annual),'Two consistent '+(annual?'annual':'quarter-over-quarter')+' changes required')).join('')+trendCell(changeText(rows[0]?.[k],rows[0]?periodBase(rows,rows[0],k,annual):null,k),yoyColour(rows,k,annual),'Single YoY comparison, independent of period trend')+'</tr>').join('')+'</tbody></table></div>';
}
function qualitySection(qrows){
 const q=qrows[0]||{},p=k=>periodBase(qrows,q,k),g=k=>growth(q,{[k]:p(k)},k);
 const financial=broker(symbol),findings=[];
 const add=(title,status,detail,cls)=>findings.push({title,status,detail,cls});
 const core=financial?'pretax':'operating_profit',label=financial?'Pretax profit':'Operating profit';
 const eg=g('eps'),og=g(core);
 if(num(eg)&&num(og)){const gap=eg-og;add('Earnings vs core profit',Math.abs(gap)>15?'Investigate':'Broadly aligned','EPS '+signed(eg)+' vs '+label.toLowerCase()+' '+signed(og)+' YoY ('+fmt(gap)+'pp difference). '+(Math.abs(gap)>15?'Check tax, investment gains/losses, noncontrolling interests and share count.':'No large divergence on this comparison; this does not verify earnings quality.'),Math.abs(gap)>15?'caution':'positive');}
 else add('Earnings vs core profit','Not assessed','Positive prior-year bases and comparable EPS / '+label.toLowerCase()+' are required. Loss periods are not assigned percentage growth.','neutral');
 if(financial)add('Cash conversion','Sector-specific','Brokerage cash flows reflect customer balances and trading assets; conventional OCF/FCF ratios are not reliable business-quality tests. Review liquidity and regulatory capital instead.','neutral');
 else {
 const w=qrows.slice(0,4),valid=w.length===4&&w.every((r,i)=>i===0||consecutive(w[i-1],r)),net=valid?sumField(w,'total_net_income'):null,ocf=valid?sumField(w,'ocf'):null;
 if(num(net)&&net>0&&num(ocf)){const ratio=ocf/net;add('Cash conversion',ratio<0.8?'Investigate':'Cash supports earnings','TTM operating cash flow / consolidated net income '+fmt(ratio,2)+'x. '+(ratio<0.8?'Review working capital, accruals and noncash gains.':'Cash conversion exceeds the 0.8x screening threshold; noncash expenses can also lift this ratio.'),ratio<0.8?'caution':'positive');}
 else add('Cash conversion','Not assessed','Requires four consecutive quarters of OCF and positive consolidated net income. For loss-making businesses, monitor cash burn instead.','neutral');
 const cg=g('capex');if(num(cg)&&num(og))add('Capital investment',cg>og+10?'Investigate':'No divergence flag','Capex '+signed(cg)+' vs operating profit '+signed(og)+' YoY. '+(cg>og+10?'Review future capacity, depreciation and returns; expansion is not inherently negative.':'No large capex/profit growth gap on this check.'),cg>og+10?'caution':'neutral');
 else add('Capital investment','Not assessed','Comparable positive prior-year capex and operating profit required.','neutral');
 }
 const sg=g('shares'),ng=g('net_income');
 if(num(sg)){const concern=sg>2;add('Per-share economics',concern?'Investigate':'No large share increase','Diluted average shares '+signed(sg)+' YoY'+(num(ng)?' vs common net income '+signed(ng):'')+'. '+(symbol==='IBKR'?'Ownership exchanges may increase listed shares without economic dilution.':concern?'Check equity issuance, stock compensation and buybacks.':'Share count movement alone does not establish dilution.'),concern?'caution':'neutral');}
 else add('Per-share economics','Not assessed','Comparable diluted share count unavailable.','neutral');
 const tr=q.tax_rate,old=p('tax_rate');
 if(num(tr)&&num(old))add('Tax rate',Math.abs(tr-old)>5?'Investigate':'No large tax shift','Effective tax rate '+pct(tr)+' vs '+pct(old)+' a year earlier. '+(Math.abs(tr-old)>5?'Review discrete tax items and jurisdiction mix.':'No large change on this check.'),Math.abs(tr-old)>5?'caution':'neutral');
 else add('Tax rate','Not assessed','Comparable tax expense and positive pretax profit required.','neutral');
 if(financial)add('Provider accounting definitions','Verify in filings','Standardized operating profit and margin may exclude interest costs. Pretax profit is used for the core-profit comparison; reported figures remain in the raw table.','caution');
 const sorted=findings.sort((a,b)=>Number(b.cls==='caution')-Number(a.cls==='caution'));
 return '<div class="fund-findings">'+sorted.map(f=>'<article class="fund-finding '+f.cls+'"><div class="fund-finding-top"><strong>'+esc(f.title)+'</strong><span>'+esc(f.status)+'</span></div><p>'+esc(f.detail)+'</p></article>').join('')+'</div>';
}
function fundamentalsPanel(panel,d,note,source){
 const qrows=deriveRows(d.quarterly),annual=deriveRows(d.annual,true),rows=frequency==='annual'?annual:qrows;
 panel.innerHTML='<h2>Fundamentals</h2><section class="fund-section"><div class="section-kicker">01 / EARNINGS QUALITY</div><h3>What explains the numbers?</h3>'+qualitySection(qrows)+'<p class="stock-note">Rule-based checks, not verified causes. Thresholds: EPS/profit gap 15pp, capex/profit gap 10pp, OCF/net income 0.8x, share growth 2%, tax shift 5pp.</p></section>'+
 '<section class="fund-section"><div class="section-kicker">02 / LONG-TERM FUNDAMENTAL MOMENTUM</div><h3>Business trajectory</h3>'+momentumTable(annual,qrows)+'<p class="stock-note">Long-term trend: up to five fiscal years, actual elapsed years shown; C = CAGR. Latest YoY uses same fiscal quarter. Margin and return changes are percentage points. ROE = common earnings / average common equity; ROIC = operating profit after effective tax / average (total equity + debt − cash), approximate. Quarterly returns use TTM and require four consecutive quarters and year-ago balance sheet. Brokerage metrics are adapted; no generic ROIC/FCF assessment.</p></section>'+
 '<section class="fund-section"><div class="section-kicker">03 / FINANCIAL STATEMENTS</div><div class="fund-table-heading"><h3>Detailed financials</h3><label>Period <select id="freq"><option value="quarterly">Quarterly</option><option value="annual">Annual</option></select></label></div><div class="trend-legend"><span class="trend-good">Improving</span><span class="trend-bad">Deteriorating</span><span class="trend-muted">Stable / inconclusive</span><span class="trend-investigate">Investigate</span></div>'+detailedTable(rows,frequency==='annual')+'<p class="stock-note">Colours require two consecutive comparable changes in the same direction (2% relative tolerance; 0.75pp for rates). Quarterly colours compare three successive quarters (two QoQ movements); annual colours compare three successive years. Latest YoY is coloured independently using a single year-over-year comparison. Seasonal effects may influence quarterly trends. Ambiguous balance-sheet and investment increases are not automatically good or bad. Missing values and unsupported comparisons are grey. Raw provider figures are retained.</p>'+note+source+'</section>';
 el('freq').value=frequency;el('freq').onchange=e=>{frequency=e.target.value;render();};
}

function render(){controls();const m=M[symbol],d=get(symbol),q=latest(symbol),p=d.quote;
el('company').textContent=symbol+' · '+m.name;el('industry').textContent=m.industry;el('question').textContent=m.question;el('price').textContent=p.lastClose==null?'—':'$'+fmt(p.lastClose,2);el('price-date').textContent=p.date?'Close · '+p.date:'Price unavailable';
el('overview').innerHTML=Object.keys(M).map(s=>'<tr tabindex="0" data-symbol="'+s+'">'+[s,latest(s).period||'—',pct(yoy(s,'revenue')),pct(latest(s).operating_margin),pct(yoy(s,'eps')),fmt(get(s).quote.trailingPE)].map(v=>'<td>'+esc(v)+'</td>').join('')+'</tr>').join('');
el('overview').querySelectorAll('tr').forEach(r=>{r.onclick=()=>select(r.dataset.symbol);r.onkeydown=e=>{if(e.key==='Enter')select(r.dataset.symbol);};});
el('cards').innerHTML=[['REVENUE YoY',pct(yoy(symbol,'revenue'))],['OPERATING MARGIN',pct(q.operating_margin)],['EPS YoY',pct(yoy(symbol,'eps'))],['TRAILING P/E',fmt(p.trailingPE)]].map(a=>'<div class="stat-card"><div class="stat-top">'+a[0]+'</div><div class="stat-number">'+a[1]+'</div><div class="stat-desc">'+esc(q.period||'No statement data')+'</div></div>').join('');
const panel=el('panel');const note='<p class="stock-note">Period ends, not filing dates. Standardized Yahoo Finance data; missing fields are not estimates. Currency: '+esc(p.financialCurrency||'not supplied')+'.</p>';
const source='<p><a target="_blank" rel="noopener" href="https://www.sec.gov/edgar/browse/?CIK='+m.sec+'">SEC filings ↗</a> · <a target="_blank" rel="noopener" href="https://finance.yahoo.com/quote/'+symbol+'/financials/">Financial data source ↗</a></p>';
panel.classList.remove('overview-panel');
if(tab==='Overview'){overviewPanel(panel,m,d,q,p,source);}
else if(tab==='Fundamentals'){fundamentalsPanel(panel,d,note,source);}
else if(tab==='Financial risk'){const b=previous(d.quarterly,q),flags=[];const rg=growth(q,b,'revenue');for(const [k,n,explanation] of [['receivables','Receivables','Review collection, contract assets and revenue recognition.'],['inventory','Inventory','Review demand, inventory turns and write-downs.'],['capex','Capex','Review incremental returns and capital commitments.'],['shares','Diluted shares','Distinguish SBC, offerings and ownership exchanges.'],['debt','Debt','Review financing uses, maturities and interest costs.']]){const g=growth(q,b,k);if(g!=null&&rg!=null&&g>rg+10)flags.push(n+' grew '+pct(g)+' vs revenue '+pct(rg)+'. '+explanation);}const eg=growth(q,b,'eps'),og=growth(q,b,'operating_profit');if(eg!=null&&og!=null&&Math.abs(eg-og)>15)flags.push('EPS growth '+pct(eg)+' vs operating profit '+pct(og)+': investigate taxes, non-operating items and dilution.');panel.innerHTML='<h2>Financial risk & forensic screening</h2>'+note+'<div class="stock-grid">'+box('Calculated flags',flags.length?list(flags):'<p>No flags from available comparable data. This does not imply low risk.</p>')+box('Business-specific diligence (not verified findings)',list(m.risks))+box('Balance sheet',table(['Metric','Latest'],[['Cash',money(q.cash)],['Debt',money(q.debt)],['Equity / assets',pct(q.equity_assets)],['Current assets',money(q.current_assets)],['Current liabilities',money(q.current_liabilities)]]))+'</div><p class="stock-note">Screen uses an explicit 10 percentage-point divergence threshold (15 for EPS vs operating profit). Financial institutions require separate regulatory capital and customer balance analysis. No automated footnote interpretation yet.</p>'+source;}
else if(tab==='Business KPIs'){panel.innerHTML='<h2>Company-specific intelligence</h2><p class="stock-note">Diligence framework. These operating KPIs require filing extraction; values have not yet been populated.</p>'+table(['Metric / disclosure','Status'],m.kpis.map(k=>[k,'Needs filing extraction']))+source+(symbol==='OKLO'?'<p><a href="https://www.nrc.gov/reactors/new-reactors/advanced.html" target="_blank" rel="noopener">NRC advanced reactors ↗</a></p>':'');}
else if(tab==='Valuation'){panel.innerHTML='<h2>Valuation</h2>'+table(['Metric','Current provider value'],[['Trailing P/E',fmt(p.trailingPE)],['Price/book',fmt(p.priceToBook)],['EV/revenue',fmt(p.enterpriseToRevenue)],['EV/EBITDA',fmt(p.enterpriseToEbitda)],['Market cap',money(p.marketCap)],['Enterprise value',money(p.enterpriseValue)],['Trailing EPS',fmt(p.trailingEps,2)]])+'<p class="stock-note">Current provider multiples only. Historical point-in-time multiples require filing dates and split-consistent earnings; not estimated here. Negative earnings make P/E unsuitable.</p>'+source;}
else if(tab==='Peers'){panel.innerHTML='<h2>Competitive comparison</h2>'+table(['Ticker','Period','Revenue YoY','Operating margin','Pretax margin','EPS YoY','P/E'],[symbol,...m.peers].map(s=>[s,latest(s).period||'—',pct(yoy(s,'revenue')),pct(latest(s).operating_margin),pct(latest(s).pretax_margin),pct(yoy(s,'eps')),fmt(get(s).quote.trailingPE)]))+'<p class="stock-note">Latest available fiscal quarters may differ. Segment-level and accounting differences limit direct comparison.</p>';}
else if(tab==='Technical'){const a=d.prices||[];const sma=(n,i)=>i+1<n?null:a.slice(i+1-n,i+1).reduce((v,r)=>v+r.close,0)/n;panel.innerHTML='<h2>Price & timing</h2><div id="price-chart" class="stock-chart"></div>'+table(['Last close date','Close','SMA50','SMA200'],[[p.date||'—',fmt(p.lastClose,2),fmt(sma(50,a.length-1),2),fmt(sma(200,a.length-1),2)]])+'<p class="stock-note">Historical close series as provided; moving averages are simple averages, not your custom TradingView signals. Custom signal integration pending.</p>';chart('price-chart',[{name:'Close',x:a.map(r=>r.date),y:a.map(r=>r.close),mode:'lines'},...([50,200].map(n=>({name:'SMA '+n,x:a.map(r=>r.date),y:a.map((r,i)=>sma(n,i)),mode:'lines'})))],'USD');}
else{panel.innerHTML='<h2>Thesis & catalysts</h2>'+box('Research question','<p>'+esc(m.question)+'</p>'+list(m.risks))+'<p class="stock-note">Private notes are stored only in this browser. They are not sent to GitHub and do not sync between devices. Save creates a dated snapshot.</p><label for="thesis">Thesis, catalyst or invalidation criteria</label><textarea id="thesis"></textarea><button class="stock-action" id="save">Save dated snapshot</button><p id="save-status"></p><div id="history"></div>';const key='stock-intelligence-notes-'+symbol;let notes=[];try{notes=JSON.parse(localStorage.getItem(key)||'[]');if(!Array.isArray(notes))notes=[];}catch{}const draw=()=>{el('history').innerHTML=notes.map(n=>box(n.date,'<p style="white-space:pre-wrap">'+esc(n.text)+'</p>')).join('');};el('thesis').value=notes[0]?.text||'';draw();el('save').onclick=()=>{const text=el('thesis').value.trim();if(!text)return;const next=[{date:new Date().toISOString(),text},...notes];try{localStorage.setItem(key,JSON.stringify(next));notes=next;draw();el('save-status').textContent='Saved in this browser.';}catch{el('save-status').textContent='Browser storage unavailable; not saved.';}};}
}
const h=location.hash.slice(1);if(M[h])symbol=h;
render();
fetch('data/stocks.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('Data not published');return r.json();}).then(j=>{data=j;el('freshness').textContent=j.generated_at?.slice(0,10)||'Unknown';el('data-status').textContent=j.source||'';render();}).catch(()=>{el('freshness').textContent='Unavailable';el('data-status').textContent='Financial data has not yet been published. Research framework remains accessible.';});
