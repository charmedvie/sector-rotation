'use strict';
const M={
IBKR:{name:'Interactive Brokers',industry:'Global brokerage',question:'Can customer and asset growth sustain earnings through rate cycles?',peers:['SCHW','HOOD'],kpis:['Customer accounts / equity / net deposits','DARTs and commissions per account','Net interest margin and interest income mix','Regulatory capital coverage and excess','Margin loans / customer equity; bad debt','Noncontrolling ownership and tax receivable agreements'],risks:['Rate sensitivity and falling net interest margins','Gap risk and customer margin loan losses','Governance and ownership exchanges'],sec:'1381197'},
HOOD:{name:'Robinhood',industry:'Diversified fintech',question:'Can diversification sustain growth without weakening credit quality?',peers:['IBKR','SCHW','SOFI','COIN'],kpis:['Funded customers / net deposits / assets','Gold subscribers and revenue per user','Options / crypto / equities / event contracts','Credit card balances, delinquencies, charge-offs','FICO mix and card credit provisions','Investment gains/losses versus operating profit'],risks:['Unsecured credit losses and portfolio seasoning','Speculative trading cyclicality','Non-operating gains and tax distortions'],sec:'1783879'},
AMZN:{name:'Amazon',industry:'Retail, advertising & cloud',question:'Will AI investment deliver capital returns and restore cash generation?',peers:['MSFT','GOOGL','WMT','META'],kpis:['AWS revenue growth and backlog','AWS operating margin and profit / average segment assets','North America and International retail margins','Advertising growth','Operating cash flow versus capex and leases','Depreciation, debt and financing costs'],risks:['Capex outpacing AWS operating profit','Infrastructure commitments and depreciation','Retail margin reversal'],sec:'1018724'},
GOOGL:{name:'Alphabet',industry:'Search, advertising & cloud',question:'Can search economics withstand AI disruption while cloud scales?',peers:['MSFT','META','AMZN'],kpis:['Search and YouTube revenue','Cloud growth / backlog / segment margin','Services operating margin','Traffic acquisition costs / revenue','AI capex and depreciation','Other Bets losses'],risks:['AI search cannibalisation and serving costs','Antitrust and distribution remedies','Cloud capital productivity'],sec:'1652044'},
NVDA:{name:'NVIDIA',industry:'AI semiconductor infrastructure',question:'Can accelerated computing demand and margins remain durable?',peers:['AMD','AVGO'],kpis:['Data center compute and networking revenue','Gross margin and incremental margin','Customer concentration','Inventory and receivables','Purchase commitments and supply capacity','Export restrictions and customer financing'],risks:['Hyperscaler capex slowdown','Inventory and receivables outpacing revenue','Customer concentration and export controls'],sec:'1045810'},
KTOS:{name:'Kratos Defense',industry:'Defence technology',question:'Can funded backlog turn into profitable production and cash flow?',peers:['AVAV','LHX'],kpis:['Organic and segment revenue growth','Funded versus unfunded backlog','Book-to-bill and contract awards','Segment margins and production ramp','Contract assets and working capital','Capex, SBC and capital raising'],risks:['Fixed-price contract overruns','Unfunded backlog and delayed awards','Cash conversion and financing'],sec:'1069258'},
OKLO:{name:'Oklo',industry:'Advanced nuclear development',question:'Can licensing, deployment and financing converge before material dilution?',peers:['SMR','NNE'],kpis:['NRC licensing milestones','First deployment and construction readiness','Binding contracts versus nonbinding agreements','Contracted MW and fuel procurement','Capital cost per MW and funding commitments','Unrestricted cash, burn and runway'],risks:['Licensing and deployment delays','Nonbinding pipeline not converting','Funding gaps and equity dilution'],sec:'1849056'}};
const tabs=['Overview','Fundamentals','Financial risk','Business Drivers','Valuation','Peers','Thesis & catalysts'];
let data={stocks:{}},symbol='IBKR',tab=tabs[0],frequency='quarterly';
const el=id=>document.getElementById(id);
const fmt=(v,d=1)=>v==null||!Number.isFinite(v)?'—':v.toLocaleString('en-US',{maximumFractionDigits:d});
const compactAmount=v=>fmt(v,Math.abs(v)>=5?0:1);
const money=v=>!Number.isFinite(v)?'—':(v<0?'−':'')+'$'+(Math.abs(v)>=1e9?compactAmount(Math.abs(v)/1e9)+'B':Math.abs(v)>=1e6?compactAmount(Math.abs(v)/1e6)+'M':Math.abs(v)>=1e3?compactAmount(Math.abs(v)/1e3)+'K':fmt(Math.abs(v),0));
const displayMoneyText=s=>String(s??'').replace(/\$([\d,]+(?:\.\d+)?)([BMK])\b/g,(_,n,u)=>'$'+compactAmount(Number(n.replaceAll(',','')))+u);
const pct=v=>v==null?'—':fmt(v,1)+'%';
const get=s=>data.stocks[s]||{quarterly:[],annual:[],quote:{},prices:[]};
const latest=s=>get(s).quarterly[0]||{};
function previous(rows,latest){if(!latest.period)return {};const target=new Date(latest.period+'T00:00:00Z');target.setUTCFullYear(target.getUTCFullYear()-1);return rows.find(r=>r.period!==latest.period&&Math.abs(new Date(r.period+'T00:00:00Z')-target)<12*86400000)||{};}
function growth(a,b,k){return a[k]!=null&&b[k]>0?100*(a[k]/b[k]-1):null;}
const yoy=(s,k)=>{const q=latest(s),b=previous(get(s).quarterly,q);return growth(q,{[k]:b[k]??get(s).prior_year?.[q.period]?.[k]},k);};
const fields=[['revenue','Revenue'],['gross_profit','Gross profit'],['operating_profit','Operating profit'],['pretax','Pretax profit'],['net_income','Net income (common)'],['eps','Diluted EPS'],['gross_margin','Gross margin'],['operating_margin','Operating margin'],['pretax_margin','Pretax margin'],['ocf','Operating cash flow'],['capex','Capex'],['fcf','Free cash flow'],['sbc','Share-based compensation'],['shares','Diluted average shares'],['assets','Assets'],['equity','Stockholders equity'],['cash','Cash & short-term investments'],['debt','Total debt'],['receivables','Receivables'],['inventory','Inventory']];
const value=(k,v)=>k.includes('margin')?pct(v):k==='eps'?(v==null?'—':'$'+fmt(v,2)):k==='shares'?(v==null?'—':compactAmount(v/1e6)+'M'):money(v);
const esc=s=>displayMoneyText(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
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
 '<aside class="diligence"><div class="tile-kicker">COMPANY-SPECIFIC RISKS TO INVESTIGATE</div>'+list(m.risks)+'<button class="stock-action" data-target="Business Drivers">Business Drivers ↗</button></aside></div></section>'+
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

// Comparable-period evidence: no trend inferred from raw sequential seasonal levels.
const evidenceLabels={event:'One-off event',emerging:'Emerging change',sustained:'Sustained change',structural:'Structural improvement',mixed:'Mixed / stable evidence',level:'Current condition',unknown:'Insufficient history'};
const evidenceTone={event:'neutral',emerging:'neutral',sustained:'neutral',structural:'positive',mixed:'neutral',level:'neutral',unknown:'neutral'};
function comparablePrior(d,rows,r,k){
 const old=previous(rows,r);
 return num(old[k])?old[k]:d.quality_prior?.[r.period]?.[k]??d.prior_year?.[r.period]?.[k]??d.peer_prior?.[r.period]?.[k]??null;
}
function comparableChange(d,rows,r,k){
 const v=r[k],old=comparablePrior(d,rows,r,k);
 if(!num(v)||!num(old))return null;
 return isRate(k)?v-old:old>0?100*(v/old-1):null;
}
function historicalComparisons(d,rows,k,i=0){
 const out=[];
 for(let n=i;n<Math.min(i+4,rows.length);n++){
  if(n>i&&!consecutive(rows[n-1],rows[n]))break;
  const r=rows[n],v=comparableChange(d,rows,r,k);if(!num(v))break;
  out.push({period:r.period,value:v});
 }
 return out;
}
function comparisonEvidence(points,tol=2,prefer=1){
 const xs=points.map(p=>p.value),latest=xs[0],prior=xs[1],third=xs[2];
 const sign=x=>x>tol?1:x< -tol?-1:0;
 const moves=xs.slice(0,-1).map((x,i)=>sign(x-xs[i+1]));
 const momentum=moves.length>=2&&moves[0]&&moves[0]===moves[1]?moves[0]:0;
 const persistent=xs.length>=3&&sign(latest)!==0&&xs.slice(0,3).every(x=>sign(x)===sign(latest))?sign(latest):0;
 return {count:xs.length,points,momentum,persistent,direction:momentum*prefer,persistence:persistent*prefer,kind:xs.length===0?'unknown':xs.length<3?'emerging':momentum||persistent?'sustained':'mixed'};
}
function evidenceSeriesText(e,unit='%'){
 return e.points.length?e.points.slice().reverse().map(p=>(p.value>0?'+':'')+fmt(p.value,1)+unit).join(' → '):'Comparable history unavailable';
}
function matchedTtmPrior(d,rows,k,i=0){
 const w=rows.slice(i,i+4);if(w.length!==4||!w.every((r,j)=>j===0||consecutive(w[j-1],r)))return null;
 const values=w.map(r=>comparablePrior(d,rows,r,k));return values.every(num)?values.reduce((a,b)=>a+b,0):null;
}
function annualEvidence(d,k){
 const rows=d.annual||[],a=rows.find(r=>num(r[k]));if(!a)return null;
 const end=rows.filter(r=>num(r[k])&&r.period<a.period&&(new Date(a.period)-new Date(r.period))/86400000<=1850).at(-1);
 if(!end)return null;const years=(new Date(a.period)-new Date(end.period))/86400000/365.2425;if(years<2.8)return null;
 const value=isRate(k)?a[k]-end[k]:a[k]>0&&end[k]>0?100*(Math.pow(a[k]/end[k],1/years)-1):null;
 return num(value)?{value,years:Math.round(years)}:null;
}
function financialEvidence(d,rows,k,i=0,prefer=1){
 const unit=isRate(k)?'pp':'%',e=comparisonEvidence(historicalComparisons(d,rows,k,i),isRate(k)?.75:2,prefer),a=i===0?annualEvidence(d,k):null;
 // Structural improvement requires a favorable latest sustained direction AND aligned 3+ year history.
 const structural=e.count>=3&&(e.direction>0||e.persistence>0&&e.direction>=0)&&e.points[0]?.value*prefer>0&&a&&a.value*prefer>(isRate(k)?.75:2);
 const ttm=!isRate(k)&&!['shares','assets','equity','cash','debt','inventory','receivables','eps'].includes(k)?ttmAt(rows,i,k):null;
 const prior=num(ttm)?matchedTtmPrior(d,rows,k,i):null;
 return {...e,kind:structural?'structural':e.kind,unit,annual:a,ttm,prior,summary:evidenceSeriesText(e,unit)};
}
function evidenceBrief(e){
 const parts=[e.count?e.count+' comparable YoY '+(e.count===1?'period':'periods')+': '+e.summary:'No comparable YoY history'];
 if(num(e.ttm)&&num(e.prior))parts.push('TTM '+money(e.ttm)+' vs '+money(e.prior)+' prior year');
 if(e.annual)parts.push(e.annual.years+'Y '+(e.annual.value>0?'+':'')+fmt(e.annual.value,1)+(e.unit==='pp'?'pp':'% CAGR'));
 return parts.join(' · ');
}
function evidenceClass(e){
 if(e.kind==='structural')return 'Structural improvement';
 if(e.kind==='sustained'){
  if(e.direction<0)return 'Sustained deceleration';
  if(e.direction>0)return 'Sustained acceleration';
  if(e.persistence<0)return 'Sustained deterioration';
  if(e.persistence>0)return 'Sustained improvement';
 }
 return evidenceLabels[e.kind]||'Insufficient history';
}
function kpiEvidence(r,i=3){
 if(!r)return {...comparisonEvidence([]),unit:'%',summary:'No comparable history'};
 // A disclosed series of YoY growth rates is comparable across quarters. Raw levels are not.
 const rateSeries=['awsGrowth','organic','paidUnits','onlineGrowth','sellerGrowth','adsGrowth','subsGrowth','shippingGrowth'].includes(r.id);
 const points=[];
 if(rateSeries){for(let n=i;n>=Math.max(0,i-3);n--){if(!num(r.values[n]))break;points.push({value:r.values[n],period:n});}}
 else if(i===3){const x=kpiDelta(r,r.values[3],r.values[4]);if(num(x))points.push({value:x,period:i});}
 const unit=rateSeries?'%':r.unit==='%'?'pp':'%',e=comparisonEvidence(points,r.unit==='%'&&!rateSeries?.75:2,r.kind==='down'?-1:1);
 return {...e,unit,summary:evidenceSeriesText(e,unit)};
}
function comparableColor(d,rows,i,k,annual=false){
 if(annual)return columnTrend(rows,i,k,true);
 const e=financialEvidence(d,rows,k,i,lowerGood.has(k)?-1:1);
 if(e.count<3||!e.persistence||e.direction&&e.direction!==e.persistence)return 'muted';
 if(!eligible(k))return ['debt','receivables','inventory','capex','shares','sbc','tax_rate'].includes(k)&&e.persistent>0?'investigate':'muted';
 return e.persistence>0?'good':'bad';
}

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
 financialGroups.map(([heading,keys])=>'<tbody><tr class="financial-group"><th scope="rowgroup" colspan="'+(3+rows.length)+'">'+esc(heading)+'</th></tr>'+keys.map(k=>'<tr data-financial-field="'+esc(k)+'"><th scope="row">'+esc(named[k])+'</th>'+longTermCell(annualRows,k)+trendCell(changeText(rows[0]?.[k],rows[0]?periodBase(rows,rows[0],k,annualView):null,k),yoyColour(rows,k,annualView),'Single YoY comparison, independent of period trend')+rows.map((r,i)=>trendCell(fundValue(k,r[k]),comparableColor(get(symbol),rows,i,k,annualView),annualView?'Two consecutive annual changes':'Three comparable YoY periods; conflicting direction stays neutral')).join('')+'</tr>').join('')+'</tbody>').join('')+'</table></div>';
}

const qualityDisclosures={
 AMZN:{period:'2026-09-30',url:'https://ir.aboutamazon.com/news-release/news-release-details/2026/Amazon-com-Announces-Third-Quarter-Results/',q:{operating_profit:28076e6,pretax:26869e6,net_income:20685e6,total_net_income:20685e6,tax_expense:6184e6,eps:1.89,interest_expense:1691e6},prior:{operating_profit:17422e6,pretax:28170e6,net_income:21187e6,total_net_income:21187e6,tax_expense:6983e6,eps:1.95,interest_expense:538e6},ttm:{ocf:168300e6,total_net_income:134779e6,net_capex:210657e6,fcf:-42357e6,old_ocf:130700e6,old_fcf:14788e6},note:'Management attributes the decline in reported net income primarily to $9.5B of pre-tax Anthropic investment gains in Q3 2025.'}
};

function qualitySection(qrows,returnData=false){
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
 }
 if(financial){
  const f=filingRisk[s];
  if(f?.date===q.period&&s==='IBKR'){
   add('capital','Regulatory capital and margin lending',fmt(f.capital/f.required,2)+'x','Aggregate regulatory capital coverage',['Capital '+money(f.capital)+' vs required '+money(f.required),'Average margin loans '+signed(100*(f.marginLoans/f.oldMarginLoans-1))+' YoY','Nine-month bad debt '+money(f.badDebt9m)],'Reported capital exceeds requirements; margin lending and gap losses remain relevant.','neutral',88,f.url);
  }
  if(f?.date===q.period&&s==='HOOD'){
   add('credit','Consumer credit expansion',money(f.cardProvision),'Quarterly card credit provision',['Prior-year card provision '+money(f.oldCardProvision),'Past-due loans '+money(f.pastDue)+' of '+money(f.loans),'Write-offs '+money(f.writeOff)+' vs '+money(f.oldWriteOff)+' prior year'],'Credit costs are rising; assess loan growth, seasoning and risk-adjusted product profitability.','caution',99,f.url);
  }
 }
 const evidenceFor=f=>{
  if(f.id==='earnings'&&disc)return {label:'One-off event',detail:'Dated issuer disclosure; not evidence of a lasting trend.',tone:'neutral'};
  if(f.id==='earnings'||f.id==='leverage'||f.id==='growth'||f.id==='shares'){
   const key=f.id==='growth'?'revenue':f.id==='shares'?'shares':core,e=financialEvidence(d,qrows,key,0,f.id==='shares'?-1:1);
   return {label:evidenceClass(e),detail:evidenceBrief(e),tone:e.kind==='structural'||e.kind==='sustained'?f.cls:'neutral'};
  }
  if(f.id==='cash'||f.id==='capex'||f.id==='runway'){
   const key=f.id==='cash'?'ocf':'fcf',now=disc?.ttm?.[key]??t(key),prior=disc?.ttm?.['old_'+key]??matchedTtmPrior(d,qrows,key);
   return {label:'TTM financial condition',detail:num(now)&&num(prior)?'TTM '+money(now)+' vs '+money(prior)+' prior year; one annual comparison, not a confirmed trend.':'Trailing four-quarter level; longer comparison unavailable.',tone:f.cls};
  }
  if(f.id==='driver'){
   const id={AMZN:'awsGrowth',GOOGL:'cloud',NVDA:'dc',IBKR:'accounts',HOOD:'gold',KTOS:'bookTTM'}[s],e=kpiEvidence(kr(id));
   return {label:s==='OKLO'?'Dated milestone':s==='KTOS'?'TTM demand observation':evidenceClass(e),detail:s==='OKLO'?'Reported milestones, not proof of commercial success.':s==='KTOS'?'Rolling book-to-bill level; historical comparison unavailable.':e.count?e.count+' comparable '+(s==='AMZN'?'AWS growth rates':'YoY observations')+': '+e.summary:'Comparable history unavailable.',tone:e.kind==='sustained'?f.cls:'neutral'};
  }
  return {label:'Current condition',detail:'Dated filing evidence; persistence not established.',tone:f.cls};
 };
 const chosen=findings.filter(f=>!['driver','capital','credit'].includes(f.id)).sort((a,b)=>b.priority-a.priority).slice(0,4).map(f=>({...f,evidence:evidenceFor(f)}));
 if(returnData)return chosen;
 return (chosen.length?'<div class="fund-findings insight-grid">'+chosen.map(f=>'<article class="fund-finding insight-card '+f.evidence.tone+'" data-insight="'+esc(f.id)+'"><div class="fund-finding-top"><strong>'+esc(f.title)+'</strong><span class="evidence-label">'+esc(f.evidence.label)+'</span></div><div class="insight-number">'+esc(f.metric)+'</div><div class="insight-metric">'+esc(f.metricLabel)+'</div><ul class="insight-bullets">'+f.bullets.map(b=>'<li>'+esc(b)+'</li>').join('')+'</ul><div class="insight-conclusion">'+esc(f.conclusion)+'</div><div class="evidence-detail">'+esc(f.evidence.detail)+'</div>'+(f.url?'<a class="insight-source" href="'+esc(f.url)+'" target="_blank" rel="noopener">Disclosure ↗</a>':'')+'</article>').join('')+'</div>':'<p class="stock-note">No material insight can be established from the available comparable observations.</p>')+(missing.length?'<p class="stock-note insight-missing">Important data gaps: '+esc(missing.join(' · '))+'.</p>':'');
}
function fundamentalsPanel(panel,d,note,source){
 const qrows=deriveRows(d.quarterly),annual=deriveRows(d.annual,true),rows=frequency==='annual'?annual:qrows;
 panel.innerHTML='<h2>Fundamentals</h2><section class="fund-section"><h3>Key fundamental insights</h3>'+qualitySection(qrows)+'</section>'+
 '<section class="fund-section"><div class="fund-table-heading"><h3>Detailed financials</h3><label>Period <select id="freq"><option value="quarterly">Quarterly</option><option value="annual">Annual</option></select></label></div><div class="trend-legend"><span class="trend-good">Improving</span><span class="trend-bad">Deteriorating</span><span class="trend-muted">Stable / inconclusive</span><span class="trend-investigate">Investigate</span></div>'+detailedTable(rows,frequency==='annual',annual)+'<details class="risk-method"><summary>Financial definitions &amp; data</summary><p>Quarterly colours: consecutive quarterly movements; latest YoY is a separate comparison. Long-term C = CAGR; rates in pp. Annual colours use consecutive annual movements. ROE = TTM common earnings / average common equity. ROIC = after-tax operating profit / average invested capital. Missing or ambiguous values are neutral.</p>'+note+source+'</details>'+'</section>';
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

function riskEvidence(s,d,q,id,result){
 const rows=d.quarterly||[],i=rows.indexOf(q);
 if(result.status==='unknown')return {label:'Insufficient history',detail:'Required comparable evidence unavailable.'};
 if(result.status==='structural')return {label:'Structural exposure',detail:'Exposure exists independently of quarterly trend.'};
 if(['coverage','runway'].includes(id))return {label:'TTM condition',detail:'Rolling four-quarter baseline; not a confirmed direction.'};
 if(id==='liquidity'||id==='capital'||id==='liquidity')return {label:'Current balance-sheet condition',detail:'A point-in-time level, not a trend.'};
 if(i<0)return {label:'Current observation',detail:'No comparable trend established.'};
 if(id==='cashflow'){
  const now=ttmAt(rows,i,'fcf'),prior=matchedTtmPrior(d,rows,'fcf',i);
  return {label:num(now)?'TTM condition':'Quarterly observation',detail:num(now)?'TTM FCF '+money(now)+(num(prior)?' vs '+money(prior)+' prior year.':'; prior TTM unavailable.'):'TTM FCF unavailable; quarterly cash flow may be seasonal.'};
 }
 const vals=[],field={gross:'gross_margin',shares:'shares',inventory:'inventory',receivables:'receivables',capex:'capex',earnings:'eps'}[id];
 if(field){
  for(let n=i;n<Math.min(i+4,rows.length);n++){
   if(n>i&&!consecutive(rows[n-1],rows[n]))break;
   const r=rows[n],a=comparableChange(d,rows,r,field),b=['inventory','receivables','capex','earnings'].includes(id)?comparableChange(d,rows,r,id==='capex'?'operating_profit':id==='earnings'?'pretax':'revenue'):null;
   if(!num(a)||(['inventory','receivables','capex','earnings'].includes(id)&&!num(b)))break;
   const x=id==='gross'?-a:id==='earnings'?Math.abs(a-b):num(b)?a-b:a;
   vals.push({period:r.period,value:x});
  }
 }
 const threshold=id==='earnings'?15:id==='gross'||id==='shares'?2:10;
 if(vals.length>=3&&vals.slice(0,3).every(x=>x.value>threshold))return {label:'Persistent risk flag',detail:'Three comparable YoY periods exceed the screen: '+evidenceSeriesText({points:vals},id==='shares'?'%':'pp')+'.'};
 if(vals.length>=3&&vals.slice(0,3).every(x=>x.value<=threshold))return {label:'No persistent flag in this screen',detail:'Three comparable YoY observations: '+evidenceSeriesText({points:vals},id==='shares'?'%':'pp')+'.'};
 return {label:result.status==='watch'?'Emerging risk / current flag':'Current observation',detail:vals.length?vals.length+' comparable YoY observation(s): '+evidenceSeriesText({points:vals},id==='shares'?'%':'pp')+'. Persistence not established.':'Dated observation; comparable multi-quarter history unavailable.'};
}

function riskVisual(values){
 if(!values.length)return '';
 const max=Math.max(1,...values.map(v=>Math.abs(v.value)));
 return '<div class="risk-bars">'+values.map(v=>'<div><div class="risk-bar-label"><span>'+esc(v.label)+'</span><strong>'+esc(v.format(v.value))+'</strong></div><div class="risk-bar-track"><span style="width:'+Math.abs(v.value)/max*100+'%;background:'+(v.value<0?'#e88c92':'#75a7ba')+'"></span></div></div>').join('')+'</div>';
}
function riskSource(result,f){return result.src?'<a class="risk-cite" href="'+esc(result.src)+'" target="_blank" rel="noopener">SEC 10-Q · '+esc(f.date)+' ↗</a>':'<span class="risk-cite">Standardized financials · calculated screen</span>';}

function scenarioSpecs(s,d,q){
 const f=filingRisk[s],e=exposureFilings[s],same=e?.period===q.period,rows=d.quarterly||[],i=rows.indexOf(q),ttm=k=>i>=0?ttmAt(rows,i,k):null,specs=[];
 const add=(title,label,unit,max,step,initial,base,baseText,desc,calc,url='')=>{if(num(base)&&base>0)specs.push({title,label,unit,max,step,initial,base,baseText,desc,calc,url,period:q.period});};
 if(s==='IBKR'&&f.date===q.period){
 add('US interest rate cuts','Rate reduction','bps',200,25,100,f.rate25,money(f.rate25)+' annual sensitivity per 25 bps','Linear extrapolation; customer balances and other assumptions fixed.',(v,b)=>['Annual net interest impact',money(-v/25*b),pct(v/25*b/(4*f.pretax)*100)+' of annualised quarterly pretax profit'],f.url);
 add('Margin lending losses','Unrecovered loan loss','%',2,.1,.5,f.marginLoans,money(f.marginLoans)+' average margin loans','Illustrative loss after collateral and recovery; not a default probability.',(v,b)=>['Hypothetical loss',money(-b*v/100),pct(100*b*v/100/(f.capital-f.required))+' of aggregate capital surplus'],f.url);}
 if(s==='HOOD'&&f.date===q.period){
 add('Consumer credit losses','Incremental loss rate','pp',10,.5,2,f.loans,money(f.loans)+' gross card portfolio','Gross loss before recovery and allocation under program terms.',(v,b)=>['Gross portfolio loss',money(-b*v/100),pct(100*b*v/100/f.cardProvision)+' of quarterly card provision (scale only)'],f.url);
 add('Credit facility funding shock','Share of financing to replace','%',100,5,25,839e6,'$839M card financing','Illustrative refinancing requirement, not evidence of withdrawal or maturity.',(v,b)=>['Replacement funding required',money(b*v/100),'Remaining financing '+money(b*(1-v/100))],e.url);}
 if(s==='AMZN'){
 const disc=qualityDisclosures.AMZN.period===q.period?qualityDisclosures.AMZN.ttm:null,ocf=disc?.ocf??ttm('ocf'),cap=disc?.net_capex??ttm('capex');
 if(num(cap))add('Operating cash-flow slowdown','TTM operating cash flow haircut','%',60,5,20,ocf,money(ocf)+' TTM OCF · '+money(cap)+' capex','Holds capex fixed. Does not deduct contractual commitments again because some are included in cash flows.',(v,b)=>['Illustrative annual free cash flow',money(b*(1-v/100)-cap),'Operating cash flow after haircut '+money(b*(1-v/100))],disc?e.url:'');
 if(same)add('Contractual payment exposure','Share requiring additional financing','%',100,5,20,124.3e9,'$124.3B scheduled 2027 commitments','Hypothetical funding share, not actual unfunded amount; may include existing cash-flow obligations.',(v,b)=>['Hypothetical additional funding',money(b*v/100),'Total scheduled payments '+money(b)],e.url);}
 if(s==='GOOGL'&&same){
 add('Infrastructure purchase commitments','Share requiring additional funding','%',100,5,20,213.4e9,'$213.4B commitments due within 12 months','Hypothetical funding exposure, not actual unfunded amount.',(v,b)=>['Hypothetical funding requirement',money(b*v/100),'Total short-term commitments '+money(b)],e.url);
 const search=kpiData.GOOGL.rows.find(r=>r.id==='search').values[3]*1e9;
 add('Search revenue contraction','Quarterly revenue decline','%',50,5,10,search,money(search)+' quarterly Search revenue','Revenue impact before expense offsets, tax or collection changes.',(v,b)=>['Quarterly revenue impact',money(-b*v/100),'Remaining Search revenue '+money(b*(1-v/100))],kpiData.GOOGL.sources[0][1]);}
 if(s==='NVDA'){
 const ar=same?81.033e9:null;
 add('Customer collection shock','Uncollected share of concentrated receivables','%',100,5,20,num(ar)?ar*.35:null,'35% of '+money(ar)+' net receivables','Illustrative collection delay or loss among the two disclosed direct customers; no recoveries assumed.',(v,b)=>['Gross receivables at risk',money(b*v/100),'Concentrated receivables '+money(b)],same?e.url:'');
 add('Inventory write-down','Share of reported inventory impaired','%',50,5,10,q.inventory,money(q.inventory)+' quarter-end inventory','Hypothetical incremental charge, before taxes.',(v,b)=>['Hypothetical pretax impairment',money(-b*v/100),'Remaining carrying value '+money(b*(1-v/100))]);
 if(same)add('Cloud capacity commitments','Share requiring additional funding','%',100,5,20,102e9,'$102B cloud service and data center lease commitments','Multi-year exposure; not all obligations are immediately payable.',(v,b)=>['Illustrative funding exposure',money(b*v/100),'Total commitments '+money(b)],'https://www.sec.gov/Archives/edgar/data/1045810/000104581026000088/q3fy27cfocommentary.htm');}
 if(s==='KTOS'&&same){
 add('Contract asset collection delay','Share delayed','%',100,5,20,359.6e6,'$359.6M net contract assets','Temporary funding need from delayed collection, not a loss.',(v,b)=>['Temporary funding requirement',money(b*v/100),'Net contract asset baseline '+money(b)],'https://www.sec.gov/Archives/edgar/data/1069258/000106925826000088/R11.htm');
 add('Fixed-price contract cost overrun','Additional cost as % of fixed-price sales','%',30,1,5,243.5e6,'$243.5M quarterly Government Solutions fixed-price sales','Assumes no price recovery.',(v,b)=>['Hypothetical pretax profit impact',money(-b*v/100),'Before tax and mitigation'],e.url);}
 if(s==='OKLO'){
 const cash=same?3.1308e9:q.cash,burn=ttm('fcf');
 if(num(cash))add('Deployment delay / historical burn','Additional months of burn','months',36,1,12,num(burn)&&burn<0?-burn/12:null,num(burn)?money(-burn/12)+' monthly trailing free cash burn':'','Constant historical burn excludes future construction costs.',(v,b)=>['Additional cash consumption',money(-b*v),'Remaining reported cash proxy '+money(cash-b*v)],same?e.url:'');
 if(same)add('Deployment funding sufficiency','Hypothetical project cash needs','%',200,5,100,cash,money(cash)+' cash and marketable debt securities','Not a project budget; excludes other obligations.',(v,b)=>['Hypothetical project cash requirement',money(b*v/100),'Remaining liquidity before other obligations '+money(b-b*v/100)],e.url);
 if(q.period)add('Equity financing dilution','New shares as % of existing shares','%',100,5,20,1,'Existing ownership normalised to 100%','Illustrative primary issuance; excludes warrants and share price changes.',(v,b)=>['Existing ownership diluted by',pct(100*v/(100+v)),'Existing holders retain '+pct(10000/(100+v))+' of post-issue equity']);}
 return specs;
}
function renderStress(s,d,q){
 const specs=scenarioSpecs(s,d,q);
 const html=specs.length?specs.map((x,i)=>'<article class="stress-card"><h3>'+esc(x.title)+'</h3><div class="stress-baseline"><strong>BASELINE · '+esc(x.period||'—')+'</strong><p>'+esc(x.baseText)+'</p></div><p>'+esc(x.desc)+'</p><label for="stress-slider-'+i+'">'+esc(x.label)+' <strong id="stress-val-'+i+'"></strong></label><input id="stress-slider-'+i+'" type="range" min="0" max="'+x.max+'" step="'+x.step+'" value="'+x.initial+'"><div class="stress-output" id="stress-output-'+i+'"></div>'+(x.url?'<a class="risk-cite" href="'+esc(x.url)+'" target="_blank" rel="noopener">Source disclosure ↗</a>':'<span class="risk-cite">Statement data / arithmetic sensitivity</span>')+'</article>').join(''):'<p class="stock-note">No reliable scenario baseline for this reporting period. Uncalculable scenarios are omitted.</p>';
 return {html,bind(){specs.forEach((x,i)=>{const slider=el('stress-slider-'+i);slider.value=String(x.initial);const update=()=>{const v=Number(slider.value);el('stress-val-'+i).textContent=fmt(v,1)+' '+x.unit;const [label,result,detail]=x.calc(v,x.base);el('stress-output-'+i).innerHTML='<span>'+esc(label)+'</span><strong>'+esc(result)+'</strong><small>'+esc(detail)+'</small>';};slider.oninput=update;update();});}};
}

// Filing-specific risk snapshots. Amounts in USD, unless stated otherwise.
// A snapshot is used only for the corresponding quarter; absent history is never interpolated.
const exposureFilings={
 IBKR:{period:'2026-09-30',url:'https://www.sec.gov/Archives/edgar/data/1381197/000138119726000163/ibkr-20260930.htm',items:[
 ['collateral','Clearing collateral','Pledged securities','Structural','Most owned US and foreign government securities were pledged to clearing organizations.','Pledged securities are not fully available corporate liquidity; margin and clearing demands can rise together.','Quantify unencumbered liquidity and clearing requirements.'],
 ['tra','Ownership and tax agreements','Tax receivable agreement','Structural','Amounts payable to Holdings arise under the tax receivable agreement.','Tax-related payments can reduce cash available to listed shareholders.','Quantify payment schedule and ownership exchanges.']]},
 HOOD:{period:'2026-09-30',url:'https://www.sec.gov/Archives/edgar/data/1783879/000178387926000167/hood-20260930.htm',items:[
 ['cardfin','Credit card financing','$839M','Disclosed','Outstanding borrowing principal and interest against purchased credit card receivables; $602M at December 2025. Net purchased receivables were $1.51B.','Funding and credit exposure can increase together; this is not a measure of total portfolio losses.','Monitor warehouse funding terms and loss allocation.'],
 ['reg','Regulatory exposure','Unquantified','Structural','Crypto and event-contract products face regulatory exposure.','Restrictions or adverse rulings could reduce permitted business activity.','Review proceedings, licenses and any quantified contingencies.']]},
 AMZN:{period:'2026-09-30',url:'https://www.sec.gov/Archives/edgar/data/1018724/000101872426000040/amzn-20260930.htm',items:[
 ['obligations','Contractual commitments','$883.6B','Monitor','Total principal contractual commitments: $124.3B in 2027; $31.6B in remaining 2026. Includes debt principal and interest, leases, equipment, purchases and other obligations.','Large fixed commitments constrain flexibility if demand slows. This total spans multiple years and includes recorded liabilities; do not add it to balance-sheet debt.','Compare scheduled payments with cash generation and funding capacity.'],
 ['leases','Leases not yet commenced','$164.9B','Monitor','Future payments for leases not yet commenced; separate from $139.4B gross payments on existing operating and finance leases.','Future lease obligations are not fully visible in current recorded debt.','Monitor new lease commencements and cancellation provisions.'],
 ['purchase','Equipment and purchase obligations','$254.4B','Monitor','Property/equipment commitments $159.6B; other unconditional purchase obligations $94.8B. Both categories include commitments not reflected on the balance sheet.','Contracted investment and procurement may remain payable even if demand weakens.','Monitor equipment delivery, energy and content commitments.'],
 ['debtmaturity','Long-term debt commitments','$294.3B','Disclosed','Scheduled principal and interest over remaining term; $16.6B in 2027. Face value of long-term debt $180.9B vs $68.8B at December 2025.','Financing dependency has increased; total scheduled debt service includes interest, not just principal.','Monitor refinancing, covenants and cash available for scheduled debt service.']]},
 GOOGL:{period:'2026-09-30',url:'https://www.sec.gov/Archives/edgar/data/1652044/000165204426000084/goog-20260930.htm',items:[
 ['purchase','Purchase commitments','$924.4B','Monitor','$213.4B due within 12 months; $802.1B relates to multiyear infrastructure, inventory, energy and content commitments. Remaining amount includes open purchase orders.','Cash commitments outside the balance sheet reduce flexibility; open orders and contractual minimums have different risk.','Monitor payment timing and demand for contracted capacity.'],
 ['leases','Future leases','$130.5B','Monitor','Uncommenced leases, mainly data centers and energy infrastructure, with terms of one to 26 years.','Future fixed cash payments are not yet recorded as lease liabilities.','Track lease commencements and occupancy/utilization.'],
 ['legal','Accrued legal fines and settlements','$13.8B','Monitor','Short-term accrued legal/regulatory fines and settlements; separate from unquantified pending legal proceedings.','Recorded liabilities are not the maximum potential exposure from unresolved antitrust matters.','Monitor payment timing and remedies affecting distribution economics.'],
 ['equityfund','Investment funding obligations','$21.9B','Disclosed','Future equity-investment funding commitments outside the balance sheet.','Further capital may be required even when investments generate no immediate cash return.','Monitor counterparties and capital calls.']]},
 NVDA:{period:'2026-10-25',url:'https://www.sec.gov/Archives/edgar/data/1045810/000104581026000088/supplementalfinancialinfor.htm',items:[
 ['arconcentration','Customer receivables concentration','35%','Monitor','Two direct customers accounted for 18% and 17% of accounts receivable at quarter-end.','Concentration raises counterparty exposure; direct customers may be intermediaries and are not necessarily end users.','Track collection periods and customer credit exposure.'],
 ['inventoryprovision','Inventory provisions','$680M','Disclosed','Quarterly inventory provisions versus $378M in the prior-year quarter; nine-month amounts $2.3B versus $3.6B.','A single quarter rose while the nine-month total fell; no sustained deterioration established.','Track provisions, purchase commitments and architecture transitions.'],
 ['cloudcommit','Cloud and data center commitments','$102B','Monitor','Cloud service agreements plus data center lease commitments, up from $74B last quarter.','Contracted capacity creates future cash obligations; not the same as supply purchase commitments or recorded debt.','Track utilization and cancellation/payment terms.','https://www.sec.gov/Archives/edgar/data/1045810/000104581026000088/q3fy27cfocommentary.htm']]},
 KTOS:{period:'2026-09-27',url:'https://kratosdefense.gcs-web.com/node/33181/xbrl-viewer',items:[
 ['contractassets','Net contract assets','$359.6M','Monitor','Net contract assets increased from $219.0M at December 2025. No significant contract-receivable or contract-asset impairments reported in the nine-month period.','Revenue recognition and billing timing can create financing needs; growth does not itself establish bad debt.','Track milestones, unbilled balances and collections.'],
 ['fixedprice','Fixed-price contract exposure','$243.5M','Disclosed','Q3 fixed-price contract revenue in the reported Government Solutions segment versus $171.5M prior-year quarter.','Fixed-price arrangements expose the contractor to unexpected costs; revenue is not a quantified loss estimate.','Review estimates at completion and cost-overrun provisions.'],
 ['government','US government concentration','75%','Monitor','US government revenue $355.7M, 75% of consolidated quarterly revenue, compared with 66% a year earlier.','Budget, procurement and payment delays can affect multiple programs simultaneously.','Monitor appropriations and contract funding.']]},
 OKLO:{period:'2026-09-30',url:'https://www.sec.gov/Archives/edgar/data/1849056/000162828026071319/oklo-20260930.htm',items:[
 ['funding','Corporate liquidity','$3.13B','Disclosed','Cash, equivalents and marketable debt securities; management expects sufficient funding for operations for one year after issuance of the statements.','One-year operating sufficiency does not establish financing through commercial deployment.','Obtain project-level construction budgets, committed financing and restricted cash.'],
 ['commitments','Reported contractual obligations','None material reported','Disclosed','Issuer reported no material contractual commitments and no off-balance-sheet arrangements at quarter-end.','This does not mean future reactor construction requires no capital.','Track signed construction, fuel and financing contracts.'],
 ['deployment','Deployment funding gap','Unquantified','Structural','Commercial deployment depends on authorizations, fuel, suppliers, customer commitments and project financing.','Current cash cannot establish fully funded commercial readiness without forward costs.','Quantify project budget and legally committed capital; do not treat nonbinding agreements as funding.']]}
};
const exposureDimensions={
 IBKR:[['capital','Regulatory capital'],['liquidity','Asset liquidity / encumbrance'],['credit','Collateral and credit losses'],['tail','Clearing tail exposure']],
 HOOD:[['capital','Regulatory capital'],['liquidity','Corporate liquidity'],['cards','Consumer credit loss exposure']],
 AMZN:[['liquidity','Cash versus total debt'],['coverage','Interest service coverage'],['shortterm','Short-term obligation coverage']],
 GOOGL:[['liquidity','Cash versus total debt'],['coverage','Interest service coverage'],['shortterm','Short-term obligation coverage']],
 NVDA:[['liquidity','Cash versus total debt'],['coverage','Interest service coverage'],['shortterm','Short-term obligation coverage'],['inventory','Inventory exposure'],['receivables','Receivables exposure']],
 KTOS:[['liquidity','Cash versus total debt'],['coverage','Interest service coverage'],['shortterm','Short-term obligation coverage'],['receivables','Receivables exposure']],
 OKLO:[['runway','Historical cash runway proxy'],['shortterm','Short-term obligation coverage']]
};
function resilienceAt(s,d,q,id){
 if(id==='shortterm'){
  if(!num(q.cash)||!(q.current_liabilities>0))return unknownRisk('cash and current liabilities');
  const x=q.cash/q.current_liabilities;
  return riskResult(x<.5?'watch':'disclosed',fmt(x,2)+'x cash / current liabilities','Cash and short-term investments '+money(q.cash)+' vs current liabilities '+money(q.current_liabilities)+'. Includes operating liabilities, not only debt.','Check maturities, unrestricted cash and expected operating inflows.');
 }
 const r=riskAt(s,d,q,id);
 if(id==='liquidity'&&!broker(s)&&r.status==='clear')r.status='disclosed';
 return r;
}
function exposureCards(s,q){
 const f=exposureFilings[s];if(!f||q.period!==f.period)return [];
 return f.items.map(([id,title,metric,status,observation,impact,next,url])=>({id,title,metric,status,observation,impact,next,url:url||f.url,period:f.period}));
}
const exposureTone={Monitor:'watch',Disclosed:'disclosed',Structural:'structural'};

const historySeries={
IBKR:[
 ['Excess regulatory capital','money','up',[['2024-12-31',12.4e9,'https://www.sec.gov/Archives/edgar/data/1381197/000138119725000036/R23.htm'],['2025-12-31',14.1e9,'https://www.sec.gov/Archives/edgar/data/1381197/000138119726000062/ibkr-20251231.htm'],['2026-03-31',13.9e9,'https://www.sec.gov/Archives/edgar/data/1381197/000138119726000093/ibkr-20260331.htm'],['2026-06-30',14.2e9,'https://www.sec.gov/Archives/edgar/data/1381197/000138119726000147/R23.htm'],['2026-09-30',14.6e9]],'Aggregate regulated subsidiary surplus; not freely transferable.'],
 ['Average margin loans','money','context',[['2025-09-30',70.805e9],['2026-09-30',104.032e9]],'Quarterly average; exposure rather than loss.'],
 ['Net interest margin','rate','context',[['2025-09-30',2.16],['2026-09-30',1.99]],'Comparable quarterly interest margin.']],
HOOD:[
 ['Credit card financing','money','context',[['2025-12-31',602e6],['2026-09-30',839e6]],'Outstanding principal and interest on purchased receivables.'],
 ['Gross card portfolio','money','context',[['2025-12-31',1040e6],['2026-09-30',1841e6]],'Gross portfolio; not all losses accrue to Robinhood.'],
 ['Past-due share','rate','down',[['2025-12-31',100*49/1040],['2026-09-30',100*102/1841]],'Past-due balance divided by gross portfolio.'],
 ['Quarterly card provision','money','down',[['2025-09-30',23e6],['2026-09-30',61e6]],'Comparable quarterly provision, not realised defaults.']],
AMZN:[
 ['Total contractual commitments','money','context',[['2024-12-31',333.001e9,'https://www.sec.gov/Archives/edgar/data/1018724/000101872425000004/amzn-20241231.htm'],['2025-12-31',439.661e9,'https://www.sec.gov/Archives/edgar/data/1018724/000101872426000004/amzn-20251231.htm'],['2026-09-30',883.6e9]],'Includes recorded and future obligations; not additive to recorded debt.'],
 ['Leases not yet commenced','money','context',[['2024-09-30',50.335e9,'https://www.sec.gov/Archives/edgar/data/1018724/000101872424000161/amzn-20240930.htm'],['2024-12-31',61.627e9,'https://www.sec.gov/Archives/edgar/data/1018724/000101872425000004/amzn-20241231.htm'],['2025-12-31',96.373e9,'https://www.sec.gov/Archives/edgar/data/1018724/000101872426000004/amzn-20251231.htm'],['2026-03-31',106.347e9,'https://www.sec.gov/Archives/edgar/data/1018724/000101872426000014/amzn-20260331.htm'],['2026-09-30',164.9e9]],'Undiscounted future leases not yet commenced.'],
 ['Long-term debt face value','money','context',[['2025-12-31',68.8e9],['2026-09-30',180.9e9]],'Principal face value, excludes future interest.'],
 ['AWS segment assets','money','context',[['2025-12-31',252.588e9],['2026-09-30',419.594e9]],'Segment assets, not committed capital or available cash.']],
GOOGL:[
 ['Uncommenced future leases','money','context',[['2024-12-31',7.273e9,'https://www.sec.gov/Archives/edgar/data/1652044/000165204425000014/goog-20241231.htm'],['2025-12-31',58.5e9,'https://www.sec.gov/Archives/edgar/data/1652044/000165204426000018/goog-20251231.htm'],['2026-06-30',85.2e9,'https://www.sec.gov/Archives/edgar/data/1652044/000165204426000071/goog-20260630.htm'],['2026-09-30',130.5e9]],'Future payments not yet recorded as lease liabilities.'],
 ['Material purchase commitments','money','context',[['2026-06-30',811e9,'https://www.sec.gov/Archives/edgar/data/1652044/000165204426000071/goog-20260630.htm'],['2026-09-30',924.4e9]],'Reported purchase commitments and other contractual obligations.'],
 ['Short-term purchase commitments','money','context',[['2026-06-30',200.7e9,'https://www.sec.gov/Archives/edgar/data/1652044/000165204426000071/goog-20260630.htm'],['2026-09-30',213.4e9]],'Due within 12 months.']],
NVDA:[
 ['Net receivables','money','context',[['2026-01-25',38.466e9,'https://investor.nvidia.com/news/press-release-details/2026/NVIDIA-Announces-Financial-Results-for-Third-Quarter-Fiscal-2027/default.aspx'],['2026-10-25',81.033e9,'https://investor.nvidia.com/news/press-release-details/2026/NVIDIA-Announces-Financial-Results-for-Third-Quarter-Fiscal-2027/default.aspx']],'Total receivables, not delinquent balances.'],
 ['Cloud and data center commitments','money','context',[['2026-07-26',74e9,'https://www.sec.gov/Archives/edgar/data/1045810/000104581026000088/q3fy27cfocommentary.htm'],['2026-10-25',102e9,'https://www.sec.gov/Archives/edgar/data/1045810/000104581026000088/q3fy27cfocommentary.htm']],'Combined cloud service and data center lease commitments.'],
 ['Quarterly inventory provisions','money','down',[['2025-10-26',378e6],['2026-10-25',680e6]],'Comparable third-quarter provision.'],
 ['Nine-month inventory provisions','money','down',[['2025-10-26',3.6e9],['2026-10-25',2.3e9]],'Nine-month comparable provision, not annualised.']],
KTOS:[
 ['Net contract assets','money','context',[['2024-12-29',140.6e6,'https://www.sec.gov/Archives/edgar/data/1069258/000106925826000088/R11.htm'],['2025-12-28',219e6,'https://www.sec.gov/Archives/edgar/data/1069258/000106925826000088/R11.htm'],['2026-09-27',359.6e6,'https://www.sec.gov/Archives/edgar/data/1069258/000106925826000088/R11.htm']],'Contract assets net of liabilities; timing and billing exposure.'],
 ['Government revenue concentration (annual)','rate','context',[['2023-12-31',69,'https://www.sec.gov/Archives/edgar/data/1069258/000106925826000013/R10.htm'],['2024-12-29',67,'https://www.sec.gov/Archives/edgar/data/1069258/000106925826000013/R10.htm'],['2025-12-28',68,'https://www.sec.gov/Archives/edgar/data/1069258/000106925826000013/R10.htm']],'Annual US government agency share of revenue.'],
 ['Government revenue concentration (Q3)','rate','context',[['2025-09-28',66],['2026-09-27',75]],'Comparable third-quarter US government revenue share.']],
OKLO:[
 ['Cash and equivalents (excludes marketable securities)','money','context',[['2024-12-31',97.132e6,'https://www.sec.gov/Archives/edgar/data/1849056/000162828026018698/oklo-20251231.htm'],['2025-09-30',410.041e6,'https://www.sec.gov/Archives/edgar/data/1849056/000162828025051349/oklo-20250930.htm'],['2025-12-31',788.445e6,'https://www.sec.gov/Archives/edgar/data/1849056/000162828026018698/oklo-20251231.htm'],['2026-03-31',1594.103e6,'https://www.sec.gov/Archives/edgar/data/1849056/000162828026034095/oklo-20260331.htm'],['2026-06-30',1644.704e6,'https://www.sec.gov/Archives/edgar/data/1849056/000162828026054571/oklo-20260630.htm'],['2026-09-30',1550.061e6]],'Cash only, consistent scope across dates.']]
};
function riskHistory(s,d,q){
 const f=exposureFilings[s],end=q.period||f?.period||'',series=(historySeries[s]||[]).map(([title,unit,prefer,observations,desc])=>({title,unit,prefer,desc,obs:observations.filter(o=>o[0]<=end).map(([period,value,url])=>({period,value,url:url||f.url}))}));
 if(!broker(s)){
 const rows=[...(d.annual||[]),...(d.quarterly||[])],unique=Object.values(Object.fromEntries(rows.filter(r=>r.period&&r.period<=end).map(r=>[r.period,r]))).sort((a,b)=>a.period.localeCompare(b.period));
 const metrics=[['Cash / current liabilities','multiple','context',r=>num(r.cash)&&r.current_liabilities>0?r.cash/r.current_liabilities:null,'Cash and short-term investments divided by current liabilities; not a solvency verdict.'],['Net cash / (debt)','money','context',r=>num(r.cash)&&num(r.debt)?r.cash-r.debt:null,'Reported cash less debt; excludes unrecorded commitments.']];
 for(const [title,unit,prefer,calc,desc] of metrics){if(s==='OKLO'&&title==='Net cash / (debt)')continue;const obs=unique.filter(r=>(new Date(end)-new Date(r.period))/86400000<=1100).map(r=>({period:r.period,value:calc(r)})).filter(r=>num(r.value));if(obs.length>=2)series.push({title,unit,prefer,desc,obs});}}
 return series.filter(r=>r.obs.length>=2).map(r=>({...r,obs:r.obs.sort((a,b)=>a.period.localeCompare(b.period))}));
}
function renderRiskEvolution(s,d,q){
 const rows=riskHistory(s,d,q),show=(v,u)=>u==='rate'?pct(v):u==='multiple'?fmt(v,2)+'x':money(v);
 if(!rows.length)return '<p class="stock-note">No comparable historical risk observations available for this period.</p>';
 return '<div class="risk-evolution-grid">'+rows.map(r=>{
 const last=r.obs.at(-1),prev=r.obs.at(-2),delta=last.value-prev.value,change=r.unit==='rate'?(delta>=0?'+':'')+fmt(delta,1)+'pp':r.unit==='multiple'?(delta>=0?'+':'')+fmt(delta,2)+'x':prev.value>0&&last.value>=0?signed(100*delta/prev.value):(delta>=0?'+':'−')+money(Math.abs(delta));
 const color=r.prefer==='context'||delta===0?'neutral':(r.prefer==='up'?delta>0:delta<0)?'positive':'caution',max=Math.max(1,...r.obs.map(o=>Math.abs(o.value)));
 return '<article class="risk-evolution-card"><div class="risk-evo-head"><div><h4>'+esc(r.title)+'</h4><div class="risk-metric">'+esc(show(last.value,r.unit))+'</div><small>'+esc(last.period)+'</small></div><div class="risk-change '+color+'"><strong>'+esc(change)+'</strong><small>vs '+esc(prev.period)+'</small></div></div><div class="risk-evo-series">'+r.obs.map(o=>'<div class="risk-evo-point"><span>'+esc(o.period)+'</span><div class="risk-evo-track"><i style="width:'+Math.abs(o.value)/max*100+'%;'+(o.value<0?'background:#e88c92':'')+'"></i></div><strong>'+esc(show(o.value,r.unit))+'</strong>'+(o.url?'<a href="'+esc(o.url)+'" target="_blank" rel="noopener" title="Source disclosure" aria-label="Source disclosure">↗</a>':'<span></span>')+'</div>').join('')+'</div><p>'+esc(riskEvolutionInsight(r))+'</p></article>';
 }).join('')+'</div>';
}


function riskMapInsight(s,d,q,id,r){
 const rows=d.quarterly||[],i=rows.indexOf(q),t=k=>i>=0?ttmAt(rows,i,k):null,matched=exposureFilings[s]?.period===q.period,f=filingRisk[s],same=f?.date===q.period,disc=s==='AMZN'&&qualityDisclosures.AMZN.period===q.period?qualityDisclosures.AMZN.ttm:null,ocf=disc?.ocf??t('ocf'),fcf=disc?.fcf??t('fcf'),op=t('operating_profit'),interest=t('interest_expense'),cov=ratio(op,interest);
 const hist=(title,format=money)=>{const x=riskHistory(s,d,q).find(h=>h.title===title);if(!x||x.obs.length<2)return null;const a=x.obs[0],b=x.obs.at(-1);return title+': '+format(a.value)+' ('+a.period.slice(0,7)+') → '+format(b.value)+' ('+b.period.slice(0,7)+')';};
 const out=(metric,bullets,conclusion,status=r.status,title='')=>({metric,bullets:bullets.filter(Boolean).slice(0,3),conclusion,status,title,method:r.why+' '+r.next});
 const unknown=(gap,impact)=>out('Unquantified',[gap],impact,'unknown'),cashDetail=num(ocf)?'TTM operating cash flow '+money(ocf)+(num(fcf)?' · FCF '+money(fcf):''):num(cov)?'TTM interest coverage '+fmt(cov,1)+'x':null;
 if(id==='liquidity'&&!broker(s)){
  if(!num(q.cash)||!num(q.debt))return unknown('Cash or debt unavailable.','Financing exposure cannot be quantified without balances and the maturity schedule.');
  const debt=q.debt-q.cash,positive=debt>0,metric=money(Math.abs(debt))+(positive?' net debt':' net cash'),bullets=['Cash '+money(q.cash)+' vs debt '+money(q.debt)+(ocf>0&&positive?' · net debt / TTM OCF '+fmt(debt/ocf,1)+'x':''),s==='AMZN'&&matched?hist('Long-term debt face value'):hist('Net cash / (debt)'),cashDetail];
  if(s==='AMZN'&&matched)return out(metric,bullets,'Increasing financing dependency and '+money(883.6e9)+' of multi-year commitments are the principal concern. '+(num(cov)?'Interest coverage is '+fmt(cov,1)+'x; maturities and investment funding still matter.':'Immediate solvency distress is not established; debt-service capacity remains unquantified.'),num(cov)&&cov<1?'high':'watch','Debt and financing exposure');
  if(s==='GOOGL'&&matched)return out(metric,bullets,money(213.4e9)+' of purchase commitments fall due within 12 months; financing flexibility matters more than recorded net debt alone.',num(cov)&&cov<1?'high':'watch','Debt and financing exposure');
  if(num(cov)&&cov<1)return out(metric,bullets,'Operating profit does not cover reported interest; cash reserves and refinancing are material risks.','high','Debt and financing exposure');
  if(positive&&num(fcf)&&fcf<0)return out(metric,bullets,'Debt plus negative trailing FCF increases reliance on reserves or external financing. Maturity timing determines urgency.','watch','Debt and financing exposure');
  if(positive)return out(metric,bullets,num(cov)&&cov>=3?'Operating profit provides an interest-service buffer; net debt alone does not establish distress.':'Debt exceeds cash, but serviceability cannot be inferred from this balance alone.',num(cov)&&cov<3?'watch':'disclosed','Debt and financing exposure');
  return out(metric,bullets,'Cash exceeds recorded debt, providing a cushion. '+(s==='NVDA'?'Cloud and customer-credit commitments can still absorb liquidity.':s==='KTOS'?'Contract billing and production can still absorb cash.':'Unrecorded commitments may reduce available funding.'),'disclosed','Debt and financing exposure');
 }
 if(id==='coverage'){
  if(!num(cov))return unknown('Four comparable quarters of operating profit and interest expense required.','Debt-service headroom is not established.');
  const old=ratio(matchedTtmPrior(d,rows,'operating_profit',i),matchedTtmPrior(d,rows,'interest_expense',i));
  return out(fmt(cov,1)+'x coverage',['TTM operating profit '+money(op)+' vs interest '+money(interest),num(old)?'Prior-year coverage '+fmt(old,1)+'x → '+fmt(cov,1)+'x':null,num(fcf)?'TTM FCF '+money(fcf):null],cov<1?'Profit is insufficient to cover interest; reserves or financing are needed.':cov<3?'The earnings buffer is thin; weaker operations or refinancing costs could reduce coverage.':'Current operating profit comfortably covers interest; principal maturities and leases still determine funding needs.',cov<1?'high':cov<3?'watch':'clear');
 }
 if(id==='shortterm'){
  if(!num(q.cash)||!(q.current_liabilities>0))return unknown('Cash or current liabilities unavailable.','Near-term funding headroom cannot be quantified.');
  const x=q.cash/q.current_liabilities;
  return out(fmt(x,2)+'x cash coverage',['Cash '+money(q.cash)+' vs current liabilities '+money(q.current_liabilities),hist('Cash / current liabilities',v=>fmt(v,2)+'x'),cashDetail],x>=1?'Cash covers current liabilities on paper; restrictions and unrecorded commitments determine usable headroom.':num(ocf)&&ocf>0?'Cash alone does not cover current liabilities; operating inflows matter. '+(num(fcf)&&fcf<0?'Negative FCF increases funding dependency.':'This alone does not establish distress.'):'Cash alone does not cover current liabilities; ability to fund the gap is unquantified.',x<.5?'watch':'disclosed');
 }
 if(id==='inventory'||id==='receivables'){
  const level=q[id],prior=comparablePrior(d,rows,q,id),a=comparableChange(d,rows,q,id),b=comparableChange(d,rows,q,'revenue'),bullets=[num(level)?id[0].toUpperCase()+id.slice(1)+' '+money(level)+(num(prior)?' vs '+money(prior)+' a year earlier':''):null,num(a)&&num(b)?'Asset balance '+signed(a)+' vs sales '+signed(b)+' YoY':null];
  if(s==='NVDA'&&matched&&id==='inventory')return out(num(level)?money(level):'Inventory provisions',[...bullets,'Quarterly provisions '+money(680e6)+' vs '+money(378e6)],'Quarterly provisions rose, but nine-month provisions fell from '+money(3.6e9)+' to '+money(2.3e9)+'. Evidence is mixed; product transitions and obsolescence remain the exposures.',r.status==='watch'?'watch':'disclosed');
  if(s==='NVDA'&&matched&&id==='receivables')return out(num(level)?money(level):'35% concentration',[...bullets,'Two direct customers account for 35% of receivables'],'Concentrated credit exposure matters even when receivables track sales; collection terms determine risk.','watch');
  if(s==='KTOS'&&matched&&id==='receivables')return out(num(level)?money(level):money(359.6e6)+' contract assets',[...bullets,'Net contract assets '+money(219e6)+' → '+money(359.6e6)+' since FY-end'],'Contract assets can absorb funding until milestones are billed and collected.','watch');
  if(!num(level))return unknown('Asset balance unavailable.','Impairment or collection exposure cannot be quantified.');
  const persistent=riskEvidence(s,d,q,id,r).label==='Persistent risk flag';
  return out(money(level),bullets,persistent?'Asset balances outgrew sales across three comparable YoY periods; funding and realization deserve scrutiny.':num(a)&&num(b)&&a>b+10?'Asset balances outgrew sales in the latest comparison: emerging exposure, not proof of impairment.':'Persistent deterioration is not established; asset aging and collection remain decisive.',persistent||r.status==='watch'?'watch':'disclosed');
 }
 if(id==='capital'){
  if(s==='IBKR'&&same)return out(fmt(f.capital/f.required,2)+'x coverage',['Capital '+money(f.capital)+' vs required '+money(f.required),hist('Excess regulatory capital'),'A 0.5% unrecovered margin-loan loss would consume '+pct(100*.005*f.marginLoans/(f.capital-f.required))+' of aggregate surplus'],'Aggregate capital is substantial, but not necessarily transferable between regulated subsidiaries.','clear');
  return unknown('Subsidiary capital and required buffers unavailable.','Corporate cash cannot substitute for regulatory capital; loss absorption remains unassessed.');
 }
 if(id==='liquidity'&&broker(s)){
  if(s==='IBKR'&&same)return out(pct(f.liquid)+' liquid assets',['Government securities pledged to clearing organizations','Aggregate capital surplus '+money(f.capital-f.required)+'; not available cash'],'Encumbrance and clearing calls limit deployable cash despite high reported asset liquidity.','disclosed');
  if(s==='HOOD'&&matched)return out(money(839e6)+' card financing',['Card financing '+money(602e6)+' → '+money(839e6)+' since FY-end','Gross card portfolio '+money(f.loans)],'Warehouse financing supports credit growth but may need replacement under stress; unrestricted cash remains unquantified.','watch');
  return unknown('Segregated assets and corporate cash not reconciled.','Customer assets are not shareholder funding.');
 }
 if(id==='credit'&&s==='IBKR'&&same)return out(money(f.marginLoans),['Average margin loans '+money(f.oldMarginLoans)+' → '+money(f.marginLoans)+' YoY','Nine-month customer bad debt '+money(f.badDebt9m),'Regulatory capital surplus '+money(f.capital-f.required)],'Exposure expanded while reported realized losses remain low; the vulnerability is discontinuous collateral losses rather than evidence of broad defaults.','watch');
 if(id==='tail'&&s==='IBKR'&&same)return out('Collateral gap risk',['Average margin loans '+money(f.marginLoans),'A 0.5% unrecovered loss equals '+money(f.marginLoans*.005),'Government securities pledged to clearing organizations'],'Clearing calls can coincide with collateral losses; capital does not eliminate liquidity timing risk.','structural');
 if(id==='cards'&&s==='HOOD'&&same)return out(pct(100*f.pastDue/f.loans)+' past due',['Past-due share '+pct(100*f.oldPastDue/f.oldLoans)+' → '+pct(100*f.pastDue/f.loans)+' since FY-end','Quarterly provisions '+money(f.oldCardProvision)+' → '+money(f.cardProvision)+' YoY','Gross portfolio '+money(f.oldLoans)+' → '+money(f.loans)+' since FY-end'],'Rising delinquency and provisions are an emerging warning; vintage, seasoning and loss allocation determine the economic impact.','watch');
 if(id==='runway'){
  const cash=matched&&s==='OKLO'?3.1308e9:q.cash,burn=t('fcf');
  if(!num(cash))return unknown('Cash and securities unavailable.','Financing gap cannot be quantified.');
  return out(num(burn)&&burn<0?fmt(12*cash/-burn,0)+' months historical runway':money(cash)+' liquidity',['Cash and investments '+money(cash),num(burn)?'TTM FCF '+money(burn):null,matched?'Management reports one-year operating funding sufficiency; deployment funding is not established':null],'Historical burn does not capture accelerated construction costs. Project budgets and committed funding determine the true gap.',num(burn)&&burn<0&&12*cash/-burn<12?'high':num(burn)&&burn<0&&12*cash/-burn<24?'watch':'disclosed');
 }
 return unknown('Period-matched disclosure unavailable.','Exposure cannot be quantified from the available filing data.');
}
function riskEvolutionInsight(r){
 const a=r.obs[0],b=r.obs.at(-1),trend=b.value>a.value?'increased':b.value<a.value?'declined':'was unchanged';
 const context={
 'Excess regulatory capital':'Aggregate surplus provides a loss buffer, but is not freely transferable.',
 'Average margin loans':'Compare gross exposure with realized bad debt, collateral and regulatory surplus.',
 'Net interest margin':'Yield changes affect interest income; balances and funding mix determine the earnings impact.',
 'Credit card financing':'Financing growth can increase refinancing exposure if credit losses also rise.',
 'Gross card portfolio':'Larger loan balances increase gross loss exposure; vintage performance determines credit quality.',
 'Past-due share':'Delinquency adjusts for portfolio growth; an increase indicates emerging credit pressure.',
 'Quarterly card provision':'Compare provisioning with balances, charge-offs and loss-sharing terms.',
 'Total contractual commitments':'Expanding obligations reduce flexibility if demand slows; recorded and unrecorded obligations overlap.',
 'Leases not yet commenced':'Future leases create fixed-payment exposure; utilization and timing determine pressure.',
 'Long-term debt face value':'Compare future principal obligations with interest coverage and free cash flow.',
 'AWS segment assets':'Incremental cloud profit and cash generation must justify infrastructure expansion.',
 'Uncommenced future leases':'Future fixed payments extend beyond recognized lease liabilities.',
 'Material purchase commitments':'Procurement dependency and payment terms determine exposure.',
 'Short-term purchase commitments':'Procurement competes with other uses of cash; avoid deducting commitments twice from OCF.',
 'Net receivables':'Larger balances raise counterparty exposure; compare with sales, aging and collections.',
 'Cloud and data center commitments':'Contracted capacity may require payments even if demand weakens.',
 'Quarterly inventory provisions':'Cross-check nine-month provisions; product transitions can drive quarterly volatility.',
 'Nine-month inventory provisions':'Nine-month comparisons reduce quarterly noise but do not establish future obsolescence risk.',
 'Net contract assets':'Unbilled assets can absorb funding until milestones are billed and collected.',
 'Government revenue concentration (annual)':'Dependence on a common government budget and procurement cycle is structural.',
 'Government revenue concentration (Q3)':'A higher share increases common-customer dependency; compare annual concentration.',
 'Cash and equivalents (excludes marketable securities)':'Cash reflects financing capacity, not proof of fully funded reactor construction.',
 'Cash / current liabilities':'Restrictions, scheduled payments and cash conversion determine usable liquidity.',
 'Net cash / (debt)':'Recorded net financing excludes future commitments; maturities and cash generation determine resilience.'
 }[r.title]||r.desc;
 return context+(r.obs.length===2?' (Two observations.)':'');
}


function riskOverviewData(s,d,q){
 const map=exposureDimensions[s].map(([id,title])=>{const r=resilienceAt(s,d,q,id),a=riskMapInsight(s,d,q,id,r);return {id,...r,...a,title:a.title||title};});
 const related={IBKR:{collateral:'liquidity'},HOOD:{cardfin:'cards'},AMZN:{obligations:'liquidity',leases:'liquidity',purchase:'shortterm',debtmaturity:'coverage'},GOOGL:{purchase:'shortterm',leases:'liquidity'},NVDA:{arconcentration:'receivables',inventoryprovision:'inventory'},KTOS:{contractassets:'receivables'},OKLO:{funding:'runway'}}[s]||{};
 const extra=[];
 for(const f of exposureCards(s,q)){const owner=map.find(r=>r.id===related[f.id]);if(owner&&owner.status!=='unknown'){(owner.filing||(owner.filing=[])).push(f);}else extra.push(f);}
 return {map,extra};
}
function riskFilingDetail(f){return '<article class="risk-filing-detail"><strong>'+esc(f.title)+' · '+esc(f.metric)+'</strong><p>'+esc(f.observation)+'</p><p>'+esc(f.impact)+'</p><small>'+esc(f.next)+'</small> <a class="risk-cite" href="'+esc(f.url)+'" target="_blank" rel="noopener">Filing '+esc(f.period)+' ↗</a></article>';}
function riskMainCards(s,d,q){
 const {map,extra}=riskOverviewData(s,d,q);
 const quantified=map.filter(r=>r.status!=='unknown'),missing=map.filter(r=>r.status==='unknown');
 const card=r=>'<article class="risk-map-item risk-'+r.status+'"><div class="risk-map-top"><strong title="'+esc(r.method)+'">'+esc(r.title)+'</strong><span>'+esc(riskLabels[r.status]||'Not assessed')+'</span></div><div class="risk-metric">'+esc(r.metric)+'</div><ul class="exposure-bullets">'+r.bullets.slice(0,2).map(b=>'<li>'+esc(b)+'</li>').join('')+'</ul><div class="risk-map-conclusion">'+esc(r.conclusion)+'</div>'+(r.filing?.length||r.bullets.length>2?'<details class="risk-method"><summary>Supporting details</summary>'+(r.bullets[2]?'<p>'+esc(r.bullets[2])+'</p>':'')+(r.filing||[]).map(riskFilingDetail).join('')+'</details>':'')+'</article>';
 const filingCard=f=>'<article class="risk-map-item risk-'+exposureTone[f.status]+'"><div class="risk-map-top"><strong>'+esc(f.title)+'</strong><span>'+esc(f.status)+'</span></div><div class="risk-metric">'+esc(f.metric)+'</div><p>'+esc(f.impact)+'</p><details class="risk-method"><summary>Filing details</summary>'+riskFilingDetail(f)+'</details></article>';
 return {html:quantified.length||extra.length?'<div class="risk-map">'+quantified.map(card).join('')+extra.map(filingCard).join('')+'</div>':'',missing:missing.map(r=>r.title)};
}
function riskPanel(panel,m,d,q,note,source){
 const s=symbol,f=exposureFilings[s],stress=renderStress(s,d,q),cards=riskMainCards(s,d,q),history=riskHistory(s,d,q),scenarios=scenarioSpecs(s,d,q),matched=f?.period===q.period;
 panel.innerHTML='<h2>Financial risk</h2><p class="risk-intro">'+esc(q.period||'Reporting period unavailable')+'</p>'+
 (cards.html?'<section class="risk-section"><h3>Risk map</h3>'+cards.html+'</section>':'')+
 (s==='AMZN'&&matched?'<details class="risk-method"><summary>Scheduled contractual payments</summary>'+table(['Period','Principal commitments'],[['Remaining 2026','$31.6B'],['2027','$124.3B'],['2028','$85.6B'],['2029','$103.0B'],['2030','$76.4B'],['Thereafter','$462.7B']])+'<p class="stock-note">Includes debt principal and interest, leases and purchases; overlaps recorded debt.</p></details>':'')+
 (scenarios.length?'<section class="risk-section"><h3>Financial stress tests</h3><div class="stress-grid">'+stress.html+'</div></section>':'')+
 (history.length?'<details class="risk-section risk-method"><summary>Risk evolution tracker · '+history.length+' measures</summary>'+renderRiskEvolution(s,d,q)+'</details>':'')+
 '<details class="risk-method"><summary>Risk definitions &amp; evidence gaps</summary><p>Interest coverage below 3x warrants monitoring; below 1x is elevated. Cash coverage below 0.5x is a screen, not a default prediction. Runway assumes historical burn. Commitments overlap recorded obligations and must not be summed. Stress tests are independent hypothetical sensitivities.</p>'+(cards.missing.length?'<p>Unquantified: '+esc(cards.missing.join(' · '))+'</p>':'')+(f&&!matched?'<p>No period-matched filing-level exposure snapshot; last reviewed '+esc(f.period)+'.</p>':'')+'<p>Not comprehensively extracted: maturity schedules, covenants, guarantees, restricted cash, litigation and concentration.</p>'+note+source+'</details>';
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

kpiRow('paidUnits','Worldwide paid-unit growth','%','up',[12,15,17,12,11],'Reported YoY physical and digital paid-unit growth; excludes Whole Foods and several services.'),
kpiRow('online','Online store revenue','$B','up',[82.988,64.254,70.432,68.470,67.407],'Gross-recorded online sales; not total marketplace GMV.'),
kpiRow('onlineGrowth','Online store growth ex-FX','%','up',[8,9,15,2,8],'Reported YoY constant-currency growth.'),
kpiRow('physical','Physical store revenue','$B','up',[5.855,5.785,5.794,5.710,5.578],'In-store selection of goods; online orders for pickup are excluded.'),
kpiRow('sellerMix','Third-party seller share of paid units','%','context',[61,60,61,61,62],'Unit share, not GMV or revenue share.'),
kpiRow('sellerGrowth','Seller services growth ex-FX','%','up',[10,12,16,10,11],'Reported YoY constant-currency growth; includes fulfillment and other fees.'),
kpiRow('adsGrowth','Advertising growth ex-FX','%','up',[22,22,26,12,22],'Reported YoY constant-currency growth; includes display and video.'),
kpiRow('subs','Subscription services revenue','$B','up',[13.122,13.427,13.730,14.006,12.574],'Prime and other non-AWS subscriptions; not subscriber count.'),
kpiRow('subsGrowth','Subscription growth ex-FX','%','up',[12,12,12,12,10],'Reported YoY constant-currency growth.'),
kpiRow('other','Other revenue','$B','context',[1.709,1.645,1.829,1.645,1.415],'Other disclosed offerings; not a single business engine.'),
kpiRow('shippingGrowth','Shipping cost growth','%','context',[10,14,19,11,8],'Reported YoY shipping expense growth; not total fulfillment cost.'),
kpiRow('naSales','North America segment revenue','$B','up',[127.083,104.143,116.177,112.852,106.267],'Includes retail, advertising, marketplace and subscriptions.'),
kpiRow('intlSales','International segment revenue','$B','up',[50.724,39.789,42.197,43.108,40.896],'Includes retail, advertising, marketplace and subscriptions.'),
kpiRow('naProfit','North America segment operating income','$B','up',[11.472,8.267,9.123,8.723,4.789],'Combined regional operating income; not pure retail profit.'),
kpiRow('intlProfit','International segment operating income','$B','up',[1.040,1.424,1.717,1.580,1.199],'Combined regional operating income; not pure retail profit.'),
kpiRow('naTtmMargin','North America TTM operating margin','%','up',[6.9,7.3,7.4,8.2,6.6],'Rolling segment margin, less sensitive to seasonal quarter mix.'),
kpiRow('intlTtmMargin','International TTM operating margin','%','up',[2.9,3.1,3.1,3.3,3.2],'Rolling segment margin, less sensitive to seasonal quarter mix.'),
kpiRow('awsTtmMargin','AWS TTM operating margin','%','up',[35.4,35.2,36.8,37.8,35.9],'Rolling AWS profitability.'),
kpiRow('rpo','Contracted future services (primarily AWS)','$B','up',[null,null,null,578,null],'Remaining performance obligations for original contract terms above one year; primarily AWS, not exclusively AWS.',1),
kpiRow('rpoLife','Weighted-average remaining long-term contract life','years','context',[null,null,null,6.1,null],'Revenue recognition depends on usage and performance; not an annual revenue forecast.',1),
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
function kpiFmt(r,v){if(!num(v))return '—';if(r.unit==='%')return pct(v);if(r.unit==='x')return fmt(v,2)+'x';if(['$B','$M','$K'].includes(r.unit))return '$'+compactAmount(v)+r.unit.slice(1);if(r.unit==='$')return '$'+fmt(v,2);return (r.unit==='M'?compactAmount(v):fmt(v,1))+(r.unit==='M'?'M':' '+r.unit);}
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
function kpiEvidenceColor(r,i){
 const e=kpiEvidence(r,i);
 if(e.count<3||r.kind==='context'||r.kind==='watch')return 'muted';
 return e.direction>0?'good':e.direction<0?'bad':'muted';
}

const driverGroups={
 AMZN:[
 {name:'Retail demand & fulfillment',kind:'Demand / execution',ids:['paidUnits','online','onlineGrowth','physical','shippingGrowth','naTtmMargin','intlTtmMargin'],take:'Unit growth remained positive but eased from 17% to 12%; online store constant-currency growth fell from 15% to 2%. Shipping cost growth was 11% versus 12% unit growth. Regional TTM margins improved, but those segments also include services and advertising.',watch:'Separate demand volume from selling-price and category mix; track paid units, delivery cost and regional profitability.'},
 {name:'Marketplace adoption & monetisation',kind:'Customer / seller mix',ids:['sellerMix','seller','sellerGrowth'],take:'Seller unit share was broadly stable at 60–61% through the last four quarters, below the prior-year 62%. Seller services continued growing faster than online store sales; this is consistent with stronger service monetisation, not proof of a higher take rate.',watch:'Seller unit share, active sellers, GMV and fulfillment adoption; comparable GMV and active seller counts not populated.'},
 {name:'Advertising & subscriptions',kind:'Monetisation',ids:['ads','adsGrowth','subs','subsGrowth'],take:'Advertising growth ex-FX slowed from 26% to 12% in the latest comparison, while subscription growth remained near 12% over four quarters. Advertising timing effects were noted by management; one quarter does not establish sustained deceleration.',watch:'Ad impressions, pricing, advertiser mix, Prime retention and subscription adoption; no separately reported ad or subscription operating margins.'},
 {name:'AWS demand & scalability',kind:'Demand / capacity',ids:['aws','awsGrowth','rpo','rpoLife','awsMargin','awsTtmMargin','assets','assetReturn'],take:'AWS constant-currency growth rose from 24% to 39% across four quarters. Contracted future services provide visibility, but the timing of conversion depends on customer usage and contract performance. The asset base has expanded; capacity utilization and incremental returns remain important.',watch:'Contract conversion, cloud consumption, capacity utilization and operating profit relative to infrastructure investment.'}
 ],
 IBKR:[
 {name:'Customer acquisition & assets',kind:'Demand',ids:['accounts','equity','deposits'],take:'Accounts expanded faster than commission revenue in the latest YoY comparison. Client equity includes market appreciation as well as net inflows, so it is not a pure measure of organic asset gathering.',watch:'Net client deposits, active funded accounts and retention; isolate market effects.'},
 {name:'Trading engagement & pricing',kind:'Monetisation',ids:['darts','comm','perOrder'],take:'Trading activity rose year over year while commission per cleared order declined. Mix, activity per account and pricing determine whether customer growth converts into commission income.',watch:'Revenue trades per active account, product mix and commission per order.'},
 {name:'Lending & cash monetisation',kind:'Product mix',ids:['loans','nii','nim'],take:'Margin balances expanded while net interest margin fell in the latest YoY comparison. Larger balances can offset yield compression, but sensitivity to rates and customer activity remains.',watch:'Interest-earning balances, net interest yield and margin loans relative to customer equity.'}
 ],
 HOOD:[
 {name:'Customer acquisition & asset gathering',kind:'Demand',ids:['customers','assets','deposits','depositRate'],take:'Customer numbers and platform assets expanded. Net deposits and their annualised rate were lower than in the preceding quarter; acquisition and definition changes complicate organic comparisons.',watch:'Comparable organic funded accounts, net deposits and retention.'},
 {name:'Subscription & product adoption',kind:'Product penetration',ids:['gold','goldCard','arpu'],take:'Gold subscribers and ARPU grew year over year; Gold Card penetration offers another product adoption signal. A higher ARPU does not establish improved lifetime economics without acquisition costs and credit losses.',watch:'Paid subscriber retention, adoption per funded account and product-level economics.'},
 {name:'Trading & balance monetisation',kind:'Revenue engine',ids:['trans','nii'],take:'Transaction revenue grew while net interest revenue fell in the latest YoY comparison. The divergence shifts the revenue mix toward activity-sensitive sources; longer comparable history is required.',watch:'Trade frequency, options/crypto/equities mix and interest-bearing balances.'}
 ],
 GOOGL:[
 {name:'Search economics',kind:'Demand / monetisation',ids:['search','tac','servicesMargin'],take:'Search remains the largest revenue engine, with positive YoY growth. Traffic acquisition cost intensity and Services margins provide context, but cannot isolate AI search unit economics.',watch:'Query volume, ad clicks and pricing, AI search usage and serving costs.'},
 {name:'YouTube & subscriptions',kind:'Engagement / monetisation',ids:['youtube','subs'],take:'Video advertising and subscriptions/platforms/devices revenue increased in the latest comparable quarter. The subscription category is broader than YouTube; engagement and paid-member data are needed to separate drivers.',watch:'Watch time, paid subscribers, Shorts monetisation and advertising yield.'},
 {name:'Cloud adoption & execution',kind:'Demand / scalability',ids:['cloud','cloudMargin','backlog'],take:'Cloud revenue more than doubled YoY and segment margin improved. Backlog represents contracted demand rather than recognized revenue; capacity and conversion timing determine durability.',watch:'Backlog conversion, consumption, capacity availability and incremental margins.'}
 ],
 NVDA:[
 {name:'Data Center adoption',kind:'Demand',ids:['dc','dcCompute','compute'],take:'Data Center revenue expanded across the four reported quarters. The Compute & Networking reporting segment is not identical to Data Center compute; separate compute and networking data are needed to isolate architecture demand.',watch:'Compute vs networking sales, product generation mix, deployment and utilization.'},
 {name:'End-market diversification',kind:'Business mix',ids:['dcShare','graphics'],take:'Data Center represents most revenue. Graphics provides a separate segment view, but cannot be added to Data Center market-platform revenue without overlap.',watch:'Gaming, professional visualization, automotive and emerging platforms; compare on the same reporting dimension.'},
 {name:'Customer mix & capacity execution',kind:'Demand quality / execution',ids:['customer','turnover'],take:'Customer mix and inventory conversion matter for future demand, but the necessary operating series are not populated. Receivable concentration disclosed in Financial Risk is not a proxy for end-customer revenue concentration.',watch:'Hyperscaler versus enterprise and sovereign demand, customer concentration, supply utilization and architecture transitions.'}
 ],
 KTOS:[
 {name:'Order intake & demand',kind:'Demand',ids:['book','bookTTM','backlog'],take:'TTM book-to-bill is above one, indicating bookings exceed revenue over that period. Backlog grew from the preceding quarter; order timing remains lumpy.',watch:'Sustained bookings, funded order awards and book-to-bill across years.'},
 {name:'Funded backlog & conversion',kind:'Execution',ids:['funded','fundedShare','organic'],take:'Funded backlog is the more actionable demand indicator than total backlog, but is not recognized revenue. Organic growth shows current conversion; production and delivery schedules determine future realization.',watch:'Backlog converted into shipments, production throughput and schedule adherence.'},
 {name:'Government Solutions & Unmanned Systems',kind:'Growth engine mix',ids:['kgs','kus'],take:'Government Solutions backlog rose sequentially while Unmanned Systems backlog fell. The mix change is a dated observation, not evidence of a sustained segment trend.',watch:'Segment-specific orders, funded backlog, manufacturing capacity and contract conversion.'}
 ],
 OKLO:[
 {name:'Licensing & safety authorization',kind:'Execution',milestones:[1,2,3,4],take:'Design and safety milestones reduce specific development uncertainties, but do not constitute commercial operating authorization.',watch:'Remaining regulatory and safety authorization steps.'},
 {name:'Fuel & physical deployment',kind:'Capacity',milestones:[0,5,8],take:'Site progress and fuel allocation support development readiness. Fabricated fuel, completed construction and operating authorization remain distinct gates.',watch:'Fuel fabrication, construction milestones and authorized operation.'},
 {name:'Commercial demand & conversion',kind:'Demand quality',milestones:[6,7],take:'Announced commercial pipeline indicates prospective interest. Binding contracted capacity and executable funded projects are not established by the master agreement alone.',watch:'Binding PPAs, contracted MW, customer credit and deployment schedule.'}
 ]
};
function driverMetric(r,cfg){
 const v=r.values[3],old=r.values[4],ev=kpiEvidence(r),rateSeries=['awsGrowth','organic','paidUnits','onlineGrowth','sellerGrowth','adsGrowth','subsGrowth','shippingGrowth'].includes(r.id);
 const yoy=num(old)?kpiDeltaText(r,v,old):null;
 const labels=cfg.periods||['Q4 2025','Q1 2026','Q2 2026','Q3 2026'];
 const points=r.values.slice(0,4).map((value,i)=>({value,label:labels[i]})).filter(p=>num(p.value));
 const data=points.length>1?'<div class="driver-history">'+points.map(p=>'<div><span>'+esc(p.label)+'</span><strong>'+esc(kpiFmt(r,p.value))+'</strong></div>').join('')+'</div>':'';
 return '<article class="driver-metric" title="'+esc(r.why)+'"><div class="driver-metric-label">'+esc(r.label)+' <sup>['+(r.src+1)+']</sup></div><div class="driver-value-row"><strong>'+esc(kpiFmt(r,v))+'</strong>'+(yoy?'<span>YoY '+esc(yoy)+'</span>':'')+'</div>'+data+(rateSeries&&ev.count>=3?'<small class="evidence-detail">'+esc(evidenceClass(ev))+' · '+esc(ev.summary)+'</small>':'')+'</article>';
}
function driverContribution(cfg,ids,title,unit='$B'){
 const rows=ids.map(id=>cfg.rows.find(r=>r.id===id)).filter(r=>r&&num(r.values[3])&&num(r.values[4]));
 if(rows.length!==ids.length)return '';
 const vals=rows.map(r=>({label:r.label,now:r.values[3],old:r.values[4],change:r.values[3]-r.values[4]})),total=vals.reduce((a,x)=>a+x.change,0),max=Math.max(1,...vals.map(x=>Math.abs(x.change)));
 return '<div class="driver-contribution"><h4>'+esc(title)+'</h4><div class="driver-contrib-list">'+vals.map(x=>'<div><div class="risk-bar-label"><span>'+esc(x.label)+'</span><strong>'+esc((x.change>=0?'+':'−')+kpiFmt({unit},Math.abs(x.change)))+(total>0?' · '+esc(pct(100*x.change/total)):'')+'</strong></div><div class="kpi-signed-track"><i></i><span class="'+(x.change<0?'negative':'positive')+'" style="width:'+Math.abs(x.change)/max*50+'%"></span></div></div>').join('')+'</div><p class="stock-note">Contribution to total change across these non-overlapping categories; negative contributions may offset growth. Rounded display, full-precision calculations.</p></div>';
}

// Reading layer only: retain the full disclosed metric catalogue and detailed assessment.
const driverBriefs={
 AMZN:[
 {ids:['paidUnits','onlineGrowth','naTtmMargin'],headline:'Retail growth cooled in the latest quarter',points:['Paid-unit growth eased from 17% to 12%; online store growth ex-FX fell to 2%.','Shipping cost growth was below unit growth; regional margins provide a broader profitability cross-check.']},
 {ids:['sellerMix','sellerGrowth'],headline:'Stable seller mix, stronger services growth',points:['Seller unit share stayed near 60–61% across four quarters.','Seller services grew faster than online store sales; a higher take rate is not established.']},
 {ids:['adsGrowth','subsGrowth'],headline:'Advertising slowed; subscriptions held steady',points:['Advertising growth ex-FX eased from 26% to 12%.','Subscription growth held near 12% across four quarters; one ad slowdown does not establish a trend.']},
 {ids:['awsGrowth','rpo','awsTtmMargin'],headline:'Cloud demand is expanding',points:['AWS growth ex-FX increased from 24% to 39% across four quarters.','Contract conversion and returns on the expanding asset base matter for durability.']}
 ],
 IBKR:[
 {ids:['accounts','equity'],headline:'Customer base is expanding',points:['Accounts grew faster than commissions in the latest YoY comparison.','Client equity includes market appreciation; organic inflows need separate evidence.']},
 {ids:['darts','perOrder'],headline:'More activity, lower yield per order',points:['Trading activity rose YoY, while commission per cleared order fell.','Monitor engagement per account and product mix.']},
 {ids:['loans','nim'],headline:'Lending expansion alongside yield pressure',points:['Margin balances rose and net interest margin fell in the latest YoY comparison.','Durability depends on balances, funding mix and interest rates.']}
 ],
 HOOD:[
 {ids:['customers','deposits','depositRate'],headline:'Asset gathering eased recently',points:['Customers and platform assets expanded; net deposits fell sequentially.','Acquisition and definition changes limit organic comparisons.']},
 {ids:['gold','arpu'],headline:'Paid adoption and monetisation increased',points:['Gold subscribers and ARPU rose YoY.','Product-level returns and customer acquisition costs remain important.']},
 {ids:['trans','nii'],headline:'Trading and interest income diverged',points:['Transaction revenue rose YoY while interest revenue fell.','The mix is more activity-sensitive; sustained change needs more history.']}
 ],
 GOOGL:[
 {ids:['search','tac'],headline:'Search remains the core revenue engine',points:['Search grew YoY; traffic costs offer a distribution-cost cross-check.','AI search unit economics cannot be isolated from reported Services margins.']},
 {ids:['youtube','subs'],headline:'Video advertising and broader subscriptions grew',points:['Both categories increased YoY.','Engagement, subscriber mix and ad yield are needed to explain the change.']},
 {ids:['cloud','cloudMargin','backlog'],headline:'Cloud growth and profitability increased',points:['Cloud revenue more than doubled YoY and segment margin improved.','Backlog conversion and capacity determine durability.']}
 ],
 NVDA:[
 {ids:['dc','compute'],headline:'Data Center demand has expanded',points:['Data Center revenue increased across four reported quarters.','Separate compute and networking data are needed to isolate architecture demand.']},
 {ids:['dcShare','graphics'],headline:'Growth is concentrated in Data Center',points:['Data Center accounts for most sales.','Graphics and Data Center use different reporting dimensions; do not add them.']},
 {ids:[],headline:'Customer mix and execution remain unquantified',points:['Comparable end-customer mix and inventory turnover are not populated.','Receivable concentration is not the same as revenue concentration.']}
 ],
 KTOS:[
 {ids:['bookTTM','backlog'],headline:'Bookings are ahead of sales',points:['TTM book-to-bill exceeds one; backlog rose sequentially.','Order timing is lumpy; follow funded orders and conversion.']},
 {ids:['fundedShare','organic'],headline:'Funded backlog supports demand visibility',points:['Funded orders are more actionable than total backlog, but not recognized revenue.','Delivery schedules and production throughput determine conversion.']},
 {ids:['kgs','kus'],headline:'Segment demand is diverging',points:['Government Solutions backlog rose; Unmanned Systems backlog fell sequentially.','A single comparison does not establish a segment trend.']}
 ],
 OKLO:[
 {milestones:[3,4],headline:'Design and safety milestones are progressing',points:['Specific design and safety approvals have been reported.','Commercial operating authorization remains a distinct gate.']},
 {milestones:[0,5],headline:'Site and fuel readiness are progressing',points:['Site progress and fuel allocation support development.','Fuel fabrication, construction and authorized operation remain separate.']},
 {milestones:[6,7],headline:'Pipeline is not yet executable capacity',points:['Announced commercial interest is not binding contracted capacity.','Track funded projects, binding PPAs and customer commitments.']}
 ]
};

// Assessment colours reflect the reviewed disclosure, not a stock recommendation.
// Mixed or emerging changes stay amber; missing evidence stays neutral.
const driverTones={
 AMZN:['mixed','mixed','mixed','positive'],
 IBKR:['positive','mixed','mixed'],
 HOOD:['mixed','positive','mixed'],
 GOOGL:['positive','positive','positive'],
 NVDA:['positive','mixed','unknown'],
 KTOS:['positive','positive','mixed'],
 OKLO:['positive','positive','mixed']
};
const driverToneLabels={positive:'Positive development',mixed:'Mixed / monitor',unknown:'Not assessed'};

function driverHorizon(s,i,cfg,stale=false){
 if(stale)return {tone:'unknown',label:'Historical snapshot'};
 const g=driverGroups[s][i],base=driverTones[s][i],rs=(g.ids||[]).map(id=>cfg.rows.find(r=>r.id===id)).filter(Boolean);
 if(g.milestones)return {tone:base,label:'Reported milestones · not a growth trend'};
 const evidence=rs.filter(r=>num(r.values[3])).map(r=>kpiEvidence(r));
 const sustained=evidence.filter(e=>e.count>=3&&e.kind==='sustained');
 const max=Math.max(0,...evidence.map(e=>e.count));
 // A positive colour requires sustained aligned evidence; mixed means monitoring, not confirmed deterioration.
 if(base==='positive'&&sustained.some(e=>e.direction>=0&&e.persistence>0))return {tone:'positive',label:'Multi-quarter positive evidence'};
 if(base==='mixed'&&max>=3)return {tone:'mixed',label:'Multi-quarter context · mixed'};
 if(base==='unknown'||!rs.some(r=>num(r.values[3])))return {tone:'unknown',label:'Not assessed'};
 if(max>=1)return {tone:'mixed',label:'Latest comparable quarter · emerging'};
 return {tone:'unknown',label:'Current observations · trend unconfirmed'};
}
function driverSourceLinks(cfg,rs){
 const indices=[...new Set(rs.map(r=>r.src||0))];
 if(!indices.length)indices.push(0);
 return indices.map(i=>cfg.sources[i]).filter(Boolean).map(([n,url])=>'<a class="driver-source-link" href="'+esc(url)+'" target="_blank" rel="noopener">'+esc(n)+' ↗</a>').join(' · ');
}

function driverSummaryMetric(r){
 const v=r.values[3],old=r.values[4],rateSeries=['awsGrowth','organic','paidUnits','onlineGrowth','sellerGrowth','adsGrowth','subsGrowth','shippingGrowth'].includes(r.id);
 const change=!rateSeries&&num(old)?'YoY '+kpiDeltaText(r,v,old):'';
 return '<div class="driver-key-metric" title="'+esc(r.why)+'"><span>'+esc(r.label)+'</span><strong>'+esc(kpiFmt(r,v))+'</strong>'+(change?'<small>'+esc(change)+'</small>':'')+'</div>';
}
function driverDetailTable(rs,cfg){
 const labels=cfg.periods||['Q4 2025','Q1 2026','Q2 2026','Q3 2026'];
 return '<div class="driver-detail-list">'+rs.map(r=>{
 const values=r.values.slice(0,4).map((v,i)=>num(v)?'<span>'+esc(labels[i])+' <b>'+esc(kpiFmt(r,v))+'</b></span>':'').filter(Boolean);
 const old=num(r.values[4])?'<span>Prior-year comparable <b>'+esc(kpiFmt(r,r.values[4]))+'</b></span>':'';
 const ev=kpiEvidence(r),rateSeries=['awsGrowth','organic','paidUnits','onlineGrowth','sellerGrowth','adsGrowth','subsGrowth','shippingGrowth'].includes(r.id);
 return '<div class="driver-detail-row"><div><strong title="'+esc(r.why)+'">'+esc(r.label)+' <sup>['+(r.src+1)+']</sup></strong></div><div><div class="driver-detail-values">'+values.join('')+old+'</div>'+(rateSeries&&ev.count>=3?'<small class="evidence-detail">'+esc(evidenceClass(ev))+' · '+esc(ev.summary)+'</small>':'')+'</div></div>';
 }).join('')+'</div>';
}

function kpiPanel(panel,m,d,source){
 const s=symbol,cfg=kpiData[s],groups=driverGroups[s],briefs=driverBriefs[s],rows=cfg.rows,by=id=>rows.find(r=>r.id===id),latestPeriod=d.quarterly?.[0]?.period,stale=latestPeriod&&latestPeriod>cfg.period,foot=cfg.sources.map(([n,url],i)=>'<a href="'+esc(url)+'" target="_blank" rel="noopener">['+(i+1)+'] '+esc(n)+' ↗</a>').join(' · ');
 const groupHtml=groups.map((g,i)=>{
 const brief=briefs[i],horizon=driverHorizon(s,i,cfg,stale),tone=horizon.tone,rs=(g.ids||[]).map(by).filter(Boolean),available=rs.filter(r=>num(r.values[3])),missing=rs.filter(r=>!num(r.values[3])).map(r=>r.label);
 const key=(brief.ids||[]).map(by).filter(r=>r&&num(r.values[3])),milestones=(g.milestones||[]).map(i=>cfg.milestones[i]).filter(Boolean),keyMilestones=(brief.milestones||[]).map(i=>cfg.milestones[i]).filter(Boolean);
 const keyHTML=key.map(driverSummaryMetric).join('')+keyMilestones.map(x=>'<div class="driver-key-metric"><span>'+esc(x[0])+'</span><strong class="driver-milestone-brief">'+esc(x[1])+'</strong><small>'+esc(x[2])+'</small></div>').join('');
 return '<section class="driver-group driver-compact driver-tone-'+tone+'"><div class="driver-group-head"><div class="driver-status-row"><div class="section-kicker">'+esc(g.kind)+'</div><span class="driver-assessment-status">'+esc(horizon.label)+'</span></div><h3>'+esc(g.name)+'</h3></div><h4 class="driver-brief-headline">'+esc(brief.headline)+'</h4>'+
 (keyHTML?'<div class="driver-key-grid">'+keyHTML+'</div>':'')+
 '<ul class="driver-brief-points">'+brief.points.map(p=>'<li>'+esc(p)+'</li>').join('')+'</ul>'+
 '<details class="driver-expand"><summary>Metrics &amp; history'+(available.length?' · '+available.length+' metrics':milestones.length?' · '+milestones.length+' milestones':'')+'</summary><div class="driver-expand-body">'+
 (available.length?driverDetailTable(available,cfg):'')+
 (milestones.length?'<div class="driver-detail-list">'+milestones.map(x=>'<div class="driver-detail-row"><div><strong>'+esc(x[0])+'</strong><small>'+esc(x[3])+' · '+esc(x[2])+'</small></div><div><strong>'+esc(x[1])+'</strong><small>'+esc(x[4])+'</small></div></div>').join('')+'</div>':'')+
 '<div class="driver-watch"><strong>Watch next</strong><p>'+esc(g.watch)+'</p></div>'+
 (missing.length?'<details class="driver-gap"><summary>Missing evidence · '+missing.length+'</summary>'+esc(missing.join(' · '))+'</details>':'')+'<div class="driver-inline-source">'+driverSourceLinks(cfg,rs)+'</div></div></details></section>';
 }).join('');
 const mix=cfg.mix?'<section class="kpi-section"><h3>'+esc(cfg.mix.title||'Revenue composition')+'</h3><div class="driver-mix-grid">'+kpiMix(cfg.mix)+(s==='AMZN'?driverContribution(cfg,['online','physical','seller','ads','subs','aws','other'],'Incremental revenue by business category'):s==='GOOGL'?driverContribution(cfg,['search','youtube','cloud','subs'],'Incremental revenue from selected categories'):s==='IBKR'||s==='HOOD'||s==='NVDA'?'<div><h4>Growth comparison · latest YoY</h4>'+kpiGrowthBars(cfg.compare.map(by).filter(Boolean))+'</div>':'')+'</div>'+(s==='AMZN'?driverContribution(cfg,['naProfit','intlProfit','awsProfit'],'Incremental operating profit by reported segment')+'<p class="stock-note">Advertising, seller services and subscriptions are already included in geographic segment results. Separate operating profit for these businesses is not disclosed.</p>':'')+'</section>':'';

 const used=new Set(groups.flatMap(g=>g.ids||[])),remaining=rows.filter(r=>!used.has(r.id)&&num(r.values[3]));
 panel.innerHTML='<h2>Business Drivers</h2><p class="stock-note">Growth engines · disclosure period '+esc(cfg.period)+(stale?' · historical snapshot; newer financial results exist':'')+'</p><div class="driver-summary-grid">'+groupHtml+'</div>'+
 (mix?'<details class="driver-expand driver-wide"><summary>Business mix &amp; growth contribution</summary><div class="driver-expand-body">'+mix+'</div></details>':'')+
 (remaining.length?'<details class="driver-expand driver-wide"><summary>Other disclosed metrics · '+remaining.length+'</summary><div class="driver-expand-body">'+driverDetailTable(remaining,cfg)+'<div class="driver-inline-source">'+driverSourceLinks(cfg,remaining)+'</div></div></details>':'');
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
 const st=valStats(rows,k,last?.[k]);if(!st){const count=rows.filter(r=>num(r[k])&&r[k]>0).length,den=k==='pe'?last?.eps:k==='pb'?last?.equity:last?.fcf,reason=num(den)&&den<=0?'N/A · latest denominator is non-positive':count?'Latest comparable multiple unavailable or fewer than eight observations':'No comparable historical observations';return '<article class="val-range"><h3>'+esc(valuationKeys[k])+'</h3><p class="stock-note">'+esc(reason)+' · '+count+' valid weekly observations</p></article>';}
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

function currentValMetrics(s,d,last){
 const p=d.quote||{},q=d.quarterly?.[0]||{},rows=d.quarterly||[],annual=deriveRows(rows),price=p.lastClose??last?.price;
 const aligned=last&&q.period&&last.date&&last.date>=q.period,sec=(k)=>aligned&&last[k+'_period']===q.period&&num(last[k])?last[k]:null;
 const tt=(k,h=k)=>ttmAt(rows,0,k)??sec(h),eps=tt('eps')??p.trailingEps,op=tt('operating_profit','op'),revenue=tt('revenue'),fcf=tt('fcf'),equity=q.equity??sec('equity');
 const single=['AMZN','NVDA','KTOS','OKLO'].includes(s),shareCount=single&&num(p.sharesOutstanding)&&p.sharesOutstanding>0?p.sharesOutstanding:null;
 const mc=num(price)&&price>0&&shareCount?price*shareCount:num(p.marketCap)&&p.marketCap>0?p.marketCap:aligned&&last?.date===p.date&&last.market_cap_proxy>0?last.market_cap_proxy:null;
 const capSource=shareCount?'Latest close × provider shares outstanding':num(p.marketCap)?'Provider total market cap':'Latest disclosed share count × close (proxy)';
 const ev=!broker(s)&&num(mc)&&num(q.debt)&&num(q.cash)?mc+q.debt-q.cash:p.enterpriseValue;
 const evSource=!broker(s)&&num(mc)&&num(q.debt)&&num(q.cash)?'Market cap + reported debt − cash (EV proxy; excludes other claims)':'Provider EV';
 const multiple=(n,den,fallback,detail,applicable=true)=>{
  if(!applicable)return ['N/A','Not appropriate for this business model'];
  if(num(den)&&den<=0)return ['N/A','Non-positive denominator; multiple is not meaningful'];
  if(num(n)&&n>0&&num(den)&&den>0)return [valMultiple(n/den),detail];
  if(num(fallback)&&fallback>0)return [valMultiple(fallback),'Provider fallback; calculated denominator unavailable'];
  return ['Unavailable','Required comparable inputs unavailable'];
 };
 const items={},put=(k,label,pair)=>items[k]=[label,...pair],simple=(k,label,x,detail)=>put(k,label,[num(x)?money(x):'Unavailable',detail]);
 put('pe','Trailing P/E',multiple(price,eps,p.trailingPE,'Latest close / TTM diluted EPS'));
 put('pb','Price / book',multiple(mc,equity,p.priceToBook,'Total market cap / reported common equity',s!=='IBKR')); 
 // IBKR's listed class and non-controlling economic interests are not interchangeable.
 if(s==='IBKR')put('pb','Price / book',num(p.priceToBook)&&p.priceToBook>0?[valMultiple(p.priceToBook),'Provider; complex ownership, not independently comparable']:['Unavailable','Comparable listed-class book value unavailable']);
 put('ps','Price / sales',multiple(mc,revenue,p.priceToSalesTrailing12Months,'Market cap / TTM revenue',s!=='OKLO'));
 put('evsales','EV / sales',multiple(ev,revenue,p.enterpriseToRevenue,evSource+' / TTM revenue',!broker(s)&&s!=='OKLO'));
 const ebitda=num(op)&&num(tt('depreciation'))?op+tt('depreciation'):null;
 put('evebitda','EV / EBITDA',multiple(ev,ebitda,p.enterpriseToEbitda,evSource+' / (operating profit + D&A) proxy',!broker(s)&&s!=='OKLO'));
 put('evop','EV / operating profit',multiple(ev,op,null,evSource+' / TTM operating profit',!broker(s)&&s!=='OKLO'));
 put('yield','FCF yield',!broker(s)&&num(fcf)&&mc>0?[valSigned(100*fcf/mc),'TTM FCF / market cap; negative yield retained']:['Unavailable','Comparable FCF and market cap required']);
 put('roe','ROE',num(annual[0]?.roe)?[pct(annual[0].roe),'TTM common earnings / average common equity']:['Unavailable','Comparable equity and earnings required']);
 simple('cap','Market cap',mc,capSource);simple('ev','Enterprise value',ev,evSource);
 simple('cashadj','Market cap less reported cash',num(mc)&&num(q.cash)?mc-q.cash:null,'Not enterprise value; debt and cash restrictions excluded');
 simple('cash','Cash & short-term investments',q.cash,'Reported balance; not necessarily unrestricted');
 put('pfcf','Price / FCF',multiple(mc,fcf,null,'Market cap / TTM FCF',!broker(s)&&s!=='OKLO'));
 const hist=valHistory(d),prior=last&&valWindow(hist,1)[0],eg=prior&&last&&((new Date(last.date)-new Date(prior.date))/86400000)>=350&&num(prior.eps)&&prior.eps>0&&num(last.eps)?100*(last.eps/prior.eps-1):null,pe=num(price)&&eps>0?price/eps:last?.pe;
 put('peg','Trailing PEG',num(eg)&&eg>0&&pe>0?[valMultiple(pe/eg),'Trailing P/E / TTM EPS YoY growth (%)']:num(eg)&&eg<=0?['N/A','Non-positive EPS growth']:['Unavailable','Comparable positive prior-year EPS required']);
 return items;
}
function valCurrent(s,d,last){
 const items=currentValMetrics(s,d,last),keys={IBKR:['pe','pb','roe','cap'],HOOD:['pe','ps','pb','cap'],AMZN:['pe','evop','yield','pfcf'],GOOGL:['pe','yield','evop','pfcf'],NVDA:['pe','peg','yield','pfcf'],KTOS:['evsales','evebitda','pe','yield'],OKLO:['cap','ev','cashadj','cash']}[s];
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
 const hist=valHistory(d),rows=valWindow(hist,valuationYears),last=rows.at(-1),a=valAttribution(rows),st=valStats(rows,valuationMetric,last?.[valuationMetric]),has=rows.length>=8,metrics=symbol==='OKLO'?['pb']:['IBKR','HOOD','GOOGL'].includes(symbol)?['pe']:Object.keys(valuationKeys);
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
 '<section class="val-section"><div class="section-kicker">01 / HISTORICAL VALUATION CONTEXT</div><h3>Where does valuation sit?</h3><div class="val-ranges">'+metrics.map(k=>valRange(k,rows,last)).join('')+'</div><p class="stock-note">Weekly closes; reconstructed multiples at latest observed date '+esc(last?.date||'—')+'. Ranges require at least eight valid observations; median is calculated from available positive observations. P/B and P/FCF use disclosed share counts close to the financial reporting date. Complex capital structures are excluded from this historical approximation; pre-commercial earnings multiples are omitted.</p></section>'+
 '<section class="val-section"><div class="section-kicker">02 / PRICE VS FUNDAMENTALS</div><h3>What drove the share price?</h3>'+(traces.length&&has?'<div id="val-index-chart" class="stock-chart"></div><p class="stock-note">Indexed to 100 at the first shared available positive base ('+esc(base.date)+'). TTM EPS uses reported annual/quarterly figures or the annual + YTD change proxy. Price excludes dividends.</p>':'<p class="stock-note">Historical indexed series unavailable.</p>')+valAttributionHtml(a)+'</section>'+
 '<section class="val-section"><div class="section-kicker">03 / VALUATION DYNAMICS</div><div class="val-range-head"><h3>Multiple through time</h3><label>Multiple <select id="val-metric">'+metrics.map(k=>'<option value="'+k+'" '+(!usable.includes(k)?'disabled':'')+'>'+esc(valuationKeys[k])+'</option>').join('')+'</select></label></div>'+(stat?'<div id="val-multiple-chart" class="stock-chart"></div><div class="val-current val-summary">'+[['vs 1Y median',short?valSigned(short.premium):'—'],['vs 5Y median',long?valSigned(long.premium):'—'],['Selected-window percentile',fmt(stat.percentile,0)+'th']].map(([n,v])=>'<article><small>'+esc(n)+'</small><strong>'+esc(v)+'</strong></article>').join('')+'</div>':'<p class="stock-note">Insufficient positive comparable history for this multiple.</p>')+'</section>'+
 '<section class="val-section"><div class="section-kicker">04 / BUSINESS-SPECIFIC METRICS</div><h3>Current valuation snapshot</h3>'+valCurrent(symbol,d,last)+'<p class="stock-note">Provider multiples and latest financial-statement calculations may differ from reconstructed filing-date multiples.</p></section>'+
 '<section class="val-section"><div class="section-kicker">05 / ASSESSMENT</div><h3>What the evidence says</h3>'+valAssessment(symbol,rows,last,a)+'</section>'+
 '<details class="risk-method"><summary>Data methodology & limitations</summary><p>Weekly split-adjusted closes from Yahoo Finance, SEC companyfacts from 10-K / 10-Q filings. A filing enters the model on the next trading date; same-day figures are excluded. Interim TTM EPS may use annual EPS plus current YTD EPS minus prior YTD EPS, an approximation because weighted share counts change. Prior comparative figures are only used after their filing date. Historical P/B and P/FCF use disclosed period-end or nearby cover-page share counts (within 60 days), not exact daily market cap. Split adjustments use observed split dates and assume filings after the split are restated. Values can be incomplete around splits, reporting transitions and missing disclosures. Negative denominators are omitted. The sample is not a fully audited historical valuation feed.</p>'+source+'</details>';
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
function peerGraph(s,ids,st,access=null){
 const last=access?access.last:latest,value=access?access.value:peerValue,compatible=access?access.compatible:peerCompatible;
 const points=ids.map((id,i)=>({id,i,x:value(id,last(id),st.x),y:value(id,last(id),st.y),date:last(id).period})).filter(p=>num(p.x)&&num(p.y)&&compatible(p.id,s));
 const other=points.filter(p=>p.id!==s),context=access&&[st.x,st.y].some(k=>['sellerRevenue','sellerGrowth','cloudBacklog','onlineGrowth','commerceMargin'].includes(k)),mx=other.length>=2&&!context?peerMedian(other.map(p=>p.x)):null,my=other.length>=2&&!context?peerMedian(other.map(p=>p.y)):null;
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
 return '<div class="kpi-insight"><strong>'+esc(headline)+'</strong>'+(findings.length?'<div class="peer-findings">'+findings.map(f=>'<p class="peer-finding '+f.tone+'">'+esc(f.text)+'</p>').join('')+'</div>':'<p>No peer-relative conclusions without at least two valid, comparable peer observations per metric.</p>')+'<p>'+esc(s==='AMZN'||s==='GOOGL'?'Consolidated results mix distinct businesses; assess segment-level economics separately.':s==='OKLO'?'BWXT is an established operator, not a pre-commercial valuation benchmark. Funding and milestones matter more than growth multiples.':peerFinance.has(s)?'Different customer mixes, leverage, interest reporting and ownership structures limit comparability.':'Product mix, fiscal calendars and accounting definitions may explain differences.')+'</p></div>';
}

// Dated issuer-reported segment snapshots, kept separate from consolidated peer financials.
let amazonPeerLens='aws';
const amznPeerSources={
 amzn:'https://ir.aboutamazon.com/news-release/news-release-details/2026/Amazon-com-Announces-Third-Quarter-Results/',
 amznq:'https://www.sec.gov/Archives/edgar/data/1018724/000101872426000040/amzn-20260930.htm',
 msft:'https://www.microsoft.com/en-us/investor/earnings/fy-2027-q1/metrics',
 goog:'https://www.sec.gov/Archives/edgar/data/1652044/000165204426000080/googexhibit991q32026.htm',
 googq:'https://www.sec.gov/Archives/edgar/data/1652044/000165204426000084/goog-20260930.htm',
 goog4:'https://www.sec.gov/Archives/edgar/data/1652044/000165204426000012/googexhibit991q42025.htm',
 goog1:'https://www.sec.gov/Archives/edgar/data/1652044/000165204426000043/googexhibit991q12026.htm',
 goog2:'https://www.sec.gov/Archives/edgar/data/1652044/000165204426000066/googexhibit991q22026.htm',
 wmt:'https://www.sec.gov/Archives/edgar/data/104169/000010416926000168/earningsreleasefy27q3.htm',
 wmtp:'https://www.sec.gov/Archives/edgar/data/104169/000010416926000168/earningspresentationfy27.htm',
 ebay:'https://www.sec.gov/Archives/edgar/data/1065088/000106508826000209/exhibit991erebayq32026.htm',
 shop:'https://www.shopify.com/investors/press-releases/shopify-sustains-rapid-growth-revenue-32-and-free-cash-flow',
 meta:'https://www.sec.gov/Archives/edgar/data/1326801/000162828026066700/meta-09302026xexhibit991.htm',
 metaq:'https://www.sec.gov/Archives/edgar/data/1326801/000162828026066773/meta-20260930.htm'
};
const segmentGrowth=(v,p)=>100*(v/p-1);
const sp=(label,value,source,note='')=>({label,value,source,note});
const sg=(label,value,source,note='')=>({...sp(label,pct(value),source,note),raw:value});
const sm=(label,value,source,note='')=>({...sp(label,money(value*1e9),source,note),raw:value*1e9});
const amazonPeerLenses={
 aws:{label:'AWS',title:'Cloud infrastructure & platform economics',description:'Compare reported cloud growth, segment profitability and contracted demand. Azure’s standalone sales and operating profit are not disclosed here; Microsoft Cloud is a broader business.',companies:[
 {id:'AWS',name:'Amazon Web Services',period:'2026-09-30',metrics:[sm('Revenue',45.984,'amzn'),sg('Revenue growth · reported',segmentGrowth(45.984,33.006),'amzn'),sg('Operating margin',100*17.773/45.984,'amzn'),sm('Operating income',17.773,'amzn'),sm('Long-term contracted services',578,'amznq','Primarily AWS, not exclusively AWS; original term >1 year.')],trend:[24,28,37,39],trendBasis:'Constant currency',trendSources:['amzn']},
 {id:'Azure',name:'Microsoft Azure',period:'2026-09-30',metrics:[sg('Revenue growth · reported',48,'msft'),sp('Standalone revenue','Not disclosed','msft'),sp('Standalone operating margin','Not disclosed','msft'),sm('Commercial RPO · broader Microsoft',677,'msft','Includes Azure and other commercial products; not Azure-only.'),sm('Microsoft Cloud revenue · broader scope',63.9,'msft')],trend:[39,40,42,48],trendBasis:'Reported; Q4 FY26 single published rate',trendSources:['msft']},
 {id:'Google Cloud',name:'Alphabet Cloud',period:'2026-09-30',metrics:[sm('Revenue',30.709,'goog'),sg('Revenue growth · reported',segmentGrowth(30.709,15.157),'goog'),sg('Operating margin',100*11.121/30.709,'goog'),sm('Operating income',11.121,'goog'),sm('Cloud backlog',560.8,'googq','Google Cloud includes Workspace and TPU system sales; some shared AI costs remain at Alphabet level.')],trend:[segmentGrowth(17.664,11.955),segmentGrowth(20.028,12.260),segmentGrowth(24.768,13.624),segmentGrowth(30.709,15.157)],trendBasis:'Reported',trendSources:['goog4','goog1','goog2','goog']}
 ],comparison:{label:'Reported cloud revenue growth · latest YoY',unit:'%',values:[['AWS',segmentGrowth(45.984,33.006)],['Azure',48],['Google Cloud',segmentGrowth(30.709,15.157)]]},secondary:{label:'Reported segment operating margin',unit:'%',values:[['AWS',100*17.773/45.984],['Google Cloud',100*11.121/30.709]]},assessment:['AWS and Google Cloud have both accelerated over the four disclosed quarters; Azure’s reported growth also increased recently. Google Cloud is growing faster from a smaller base and includes TPU system sales.','AWS has a higher reported operating margin than Google Cloud this quarter. Different cost allocations and product mixes limit direct margin comparisons. Azure has no standalone operating margin in these disclosures.','Contracted demand is substantial, but AWS-related long-term obligations, Google Cloud backlog and Microsoft commercial RPO have different scopes. No ranking of backlog quality or capital productivity is inferred.']},
 retail:{label:'Retail & marketplace',title:'Commerce activity, seller monetisation & efficiency',description:'Walmart is an omnichannel retail competitor; eBay is a marketplace and Shopify provides merchant infrastructure. Their revenue and GMV are not interchangeable with Amazon retail sales or seller fees.',companies:[
 {id:'Amazon',name:'Retail & marketplace',period:'2026-09-30',metrics:[sm('Online store revenue',68.470,'amzn'),sg('Online store revenue growth · reported',segmentGrowth(68.470,67.407),'amzn'),sg('Worldwide paid-unit growth',12,'amzn'),sg('Third-party seller unit share',61,'amzn'),sm('Third-party seller services revenue',46.492,'amzn'),sg('Seller services growth · reported',segmentGrowth(46.492,42.486),'amzn')],trend:[10,12,16,10],trendBasis:'Seller services revenue growth ex-FX',trendSources:['amzn']},
 {id:'WMT',name:'Walmart',period:'2026-10-31',metrics:[sg('Global eCommerce sales growth',17,'wmt'),sg('US eCommerce sales growth',23,'wmt'),sg('US marketplace sales growth',49,'wmtp'),sg('US comparable sales growth (ex fuel)',2.9,'wmtp'),sg('Global membership fee growth',17,'wmt')]},
 {id:'EBAY',name:'eBay',period:'2026-09-30',metrics:[sm('Marketplace GMV',23.2,'ebay'),sg('GMV growth · reported',15,'ebay'),sg('Revenue growth · reported',14,'ebay'),sg('GAAP company operating margin',19.2,'ebay','Company-level margin; not comparable to Amazon geographic segments.')]},
 {id:'SHOP',name:'Shopify',period:'2026-09-30',metrics:[sm('Merchant GMV',119.145,'shop'),sg('GMV growth · reported',segmentGrowth(119.145,92.013),'shop'),sm('Merchant solutions revenue',2.906,'shop'),sg('Merchant solutions growth · reported',segmentGrowth(2.906,2.145),'shop'),sg('GAAP company operating margin',100*568/3742,'shop','Company-wide merchant infrastructure margin.')]}
 ],comparison:{label:'GMV growth · reported YoY (disclosed marketplace/platform GMV only)',unit:'%',values:[['eBay',15],['Shopify',segmentGrowth(119.145,92.013)]]},assessment:['Amazon’s paid-unit growth and seller-services revenue remain positive; seller-services growth exceeds online-store sales growth. This does not establish a higher marketplace take rate.','Walmart’s marketplace and digital sales are growing rapidly in its later fiscal quarter. eBay and Shopify both report rising GMV, but Amazon does not disclose a comparable marketplace GMV measure here.','Amazon geographic margins include ads, subscriptions and marketplace services. No pure retail margin or marketplace margin ranking is justified.']},
 ads:{label:'Advertising',title:'Digital advertising scale & monetisation',description:'Reported ad revenue and growth are the closest common metrics. Retail media and search/social ads compete for advertising budgets, but differ in format, audience and measurement.',companies:[
 {id:'Amazon Ads',name:'Amazon advertising services',period:'2026-09-30',metrics:[sm('Advertising revenue',19.637,'amzn'),sg('Advertising revenue growth · reported',segmentGrowth(19.637,17.703),'amzn'),sg('Advertising growth ex-FX',12,'amzn'),sp('Standalone operating margin','Not disclosed','amzn')],trend:[22,22,26,12],trendBasis:'Constant currency',trendSources:['amzn']},
 {id:'Google Ads',name:'Google advertising',period:'2026-09-30',metrics:[sm('Advertising revenue',82.012,'goog'),sg('Advertising revenue growth · reported',segmentGrowth(82.012,74.182),'goog'),sm('Search & other advertising',63.350,'goog'),sm('YouTube advertising',11.207,'goog'),sp('Standalone operating margin','Not disclosed','goog')],trend:[segmentGrowth(82.284,72.461),segmentGrowth(77.253,66.885),segmentGrowth(81.629,71.340),segmentGrowth(82.012,74.182)],trendBasis:'Reported',trendSources:['goog4','goog1','goog2','goog']},
 {id:'META',name:'Meta advertising',period:'2026-09-30',metrics:[sm('Advertising revenue',63.061,'meta'),sg('Advertising revenue growth · reported',segmentGrowth(63.061,50.082),'meta'),sg('Ad impressions growth',10,'metaq'),sg('Average price per ad growth',14,'metaq'),sp('Standalone operating margin','Not disclosed','meta')]},
 {id:'WMT Ads',name:'Walmart retail media',period:'2026-10-31',metrics:[sg('Global advertising business growth',25,'wmt'),sg('US advertising growth',37,'wmt'),sp('Comparable global ad revenue dollars','Not disclosed here','wmt')]}
 ],comparison:{label:'Advertising revenue growth · reported YoY',unit:'%',values:[['Amazon Ads',segmentGrowth(19.637,17.703)],['Google Ads',segmentGrowth(82.012,74.182)],['Meta',segmentGrowth(63.061,50.082)],['Walmart Ads',25]]},secondary:{label:'Advertising revenue · USD',unit:'$',values:[['Amazon Ads',19.637e9],['Google Ads',82.012e9],['Meta',63.061e9]]},assessment:['Amazon ad growth ex-FX slowed from 26% to 12% in the latest quarter; management identified timing effects. Google ad growth has also moderated versus the earlier 2026 quarters. These are not identical currency bases.','Meta grew reported ad revenue faster in the latest comparison, with both price and impressions contributing. Walmart’s later fiscal quarter offers relevant retail-media context.','Amazon’s standalone advertising profitability and like-for-like impression/pricing metrics are unavailable in these sources. No inference of market-share movement from revenue growth alone.']}
};
function amazonPeerNav(){
 return '<div class="amzn-peer-nav" role="group" aria-label="Amazon peer comparison scope">'+[['aws','AWS'],['retail','Retail & marketplace'],['ads','Advertising'],['consolidated','Consolidated']].map(([id,label])=>'<button data-amzn-lens="'+id+'" aria-pressed="'+(amazonPeerLens===id)+'">'+esc(label)+'</button>').join('')+'</div>';
}
function bindAmazonPeerNav(panel){panel.querySelectorAll('[data-amzn-lens]').forEach(b=>b.onclick=()=>{amazonPeerLens=b.dataset.amznLens;render();});}
function segmentSource(key){return '<a href="'+esc(amznPeerSources[key])+'" target="_blank" rel="noopener" title="Issuer disclosure">↗</a>';}

const segmentDefinitions={
 aws:{x:['cloudGrowth','cloudCC','cloudMargin'],y:['cloudMargin','cloudRev','cloudProfit','cloudBacklog','cloudGrowth'],trend:['cloudGrowth','cloudCC','cloudRev','cloudMargin'],metrics:[
 ['cloudGrowth','Cloud revenue growth · reported YoY','%','high',['Revenue growth · reported']],
 ['cloudCC','Cloud revenue growth · constant currency YoY','%','high',[]],
 ['cloudRev','Cloud segment revenue','$','context',['Revenue','Standalone revenue']],
 ['cloudMargin','Cloud segment operating margin','%','high',['Operating margin','Standalone operating margin']],
 ['cloudProfit','Cloud segment operating profit','$','context',['Operating income']],
 ['cloudBacklog','Contracted demand · different scopes','$','context',['Long-term contracted services','Commercial RPO · broader Microsoft','Cloud backlog']],
 ['msCloud','Microsoft Cloud revenue · broader scope','$','context',['Microsoft Cloud revenue · broader scope']]
 ]},
 retail:{x:['sellerGrowth','onlineGrowth','gmvg','sellerCC'],y:['sellerRevenue','onlineSales','gmv','commerceMargin','onlineGrowth'],trend:['sellerCC','onlineGrowth','sellerGrowth','gmvg'],metrics:[
 ['onlineGrowth','Online / eCommerce sales growth · different scopes','%','context',['Online store revenue growth · reported','Global eCommerce sales growth']],
 ['onlineSales','Online store revenue · Amazon','$','context',['Online store revenue']],
 ['units','Paid-unit growth · Amazon','%','context',['Worldwide paid-unit growth']],
 ['sellerShare','Third-party seller unit share · Amazon','%','context',['Third-party seller unit share']],
 ['sellerRevenue','Seller / merchant service revenue · different scopes','$','context',['Third-party seller services revenue','Merchant solutions revenue']],
 ['sellerGrowth','Seller / merchant service growth · different scopes','%','context',['Seller services growth · reported','Merchant solutions growth · reported']],
 ['sellerCC','Seller services growth ex-FX · Amazon','%','context',[]],
 ['gmvg','Marketplace / merchant GMV growth · reported YoY','%','high',['GMV growth · reported']],
 ['gmv','Marketplace / merchant GMV','$','context',['Marketplace GMV','Merchant GMV']],
 ['wmtUS','US eCommerce sales growth · Walmart','%','context',['US eCommerce sales growth']],
 ['wmtMarket','US marketplace sales growth · Walmart','%','context',['US marketplace sales growth']],
 ['wmtComp','US comparable sales growth ex fuel · Walmart','%','context',['US comparable sales growth (ex fuel)']],
 ['wmtMember','Global membership fee growth · Walmart','%','context',['Global membership fee growth']],
 ['ebayGrowth','Company revenue growth · eBay','%','context',['Revenue growth · reported']],
 ['commerceMargin','Company operating margin · eBay / Shopify','%','context',['GAAP company operating margin']]
 ]},
 ads:{x:['adGrowth','adCC','wmtAd','impressions'],y:['adRevenue','adMargin','adGrowth','adPrice'],trend:['adGrowth','adCC','adRevenue'],metrics:[
 ['adGrowth','Advertising revenue growth · reported YoY','%','high',['Advertising revenue growth · reported']],
 ['adCC','Advertising growth · constant currency YoY','%','high',['Advertising growth ex-FX']],
 ['adRevenue','Advertising revenue','$','context',['Advertising revenue','Comparable global ad revenue dollars']],
 ['adMargin','Standalone advertising operating margin','%','high',['Standalone operating margin']],
 ['searchAd','Search & other advertising revenue','$','context',['Search & other advertising']],
 ['youtubeAd','YouTube advertising revenue','$','context',['YouTube advertising']],
 ['impressions','Ad impressions growth','%','context',['Ad impressions growth']],
 ['adPrice','Average price per ad growth','%','context',['Average price per ad growth']],
 ['wmtAd','Global advertising business growth · Walmart','%','context',['Global advertising business growth']],
 ['wmtUSAd','US advertising growth · Walmart','%','context',['US advertising growth']]
 ]}
};
for(const def of Object.values(segmentDefinitions))for(const [key,label,unit,kind] of def.metrics)peerSpecs[key]={label,unit,kind};
function segmentAccess(lensId){
 const lens=amazonPeerLenses[lensId],cfg=segmentDefinitions[lensId],companies=new Map(lens.companies.map(c=>[c.id,c])),focus=lens.companies[0].id;
 const dates=['2025-12-31','2026-03-31','2026-06-30','2026-09-30'];
 const last=id=>({period:companies.get(id)?.period});
 const compatible=(id,s)=>{const a=last(id).period,b=last(s).period;return !!(a&&b&&Math.abs(new Date(a)-new Date(b))/86400000<=62);};
 const metric=(id,k)=>{const labels=cfg.metrics.find(m=>m[0]===k)?.[4]||[];return companies.get(id)?.metrics.find(m=>labels.includes(m.label));};
 const seriesKey=c=>lensId==='aws'?(c.trendBasis==='Constant currency'?'cloudCC':'cloudGrowth'):lensId==='ads'?(c.trendBasis==='Constant currency'?'adCC':'adGrowth'):'sellerCC';
 const value=(id,r,k)=>{const c=companies.get(id);if(!c||!r?.period)return null;const m=metric(id,k);if(r.period===c.period&&num(m?.raw))return m.raw;const ix=dates.indexOf(r.period);return c.trend&&seriesKey(c)===k&&ix>=0&&num(c.trend[ix])?c.trend[ix]:null;};
 const rows=id=>{const c=companies.get(id);return !c?[]:c.trend?dates.map(period=>({period})):[{period:c.period}];};
 const baseline=(s,ids,k)=>{if(peerSpecs[k].kind==='context')return null;const v=ids.filter(id=>id!==s&&compatible(id,s)).map(id=>value(id,last(id),k)).filter(num);return v.length>=2?peerMedian(v):null;};
 const cell=(id,k)=>{const m=metric(id,k),v=value(id,last(id),k),c=companies.get(id);return {display:num(v)?peerFmt(k,v):m?.value||'—',note:m?.note||m?.label||'No comparable disclosure in this snapshot',source:m?.source||(num(v)?c?.trendSources?.at(-1):null)};};
 const group=lens.companies.slice(1).map(c=>[c.id,c.name,'Segment / adjacent',lensId==='aws'?'Cloud platform':lensId==='retail'?'Commerce business':'Advertising business']);
 const key='AMZN:'+lensId,st=peerState[key]||(peerState[key]={enabled:group.map(r=>r[0]),x:cfg.x[0],y:cfg.y[0],trend:cfg.trend[0]});
 return {lens,cfg,focus,group,st,last,compatible,value,rows,baseline,cell};
}
function segmentAssessment(access,ids){
 const {focus:s,cfg,lens}=access,findings=[];
 for(const [k] of cfg.metrics){if(peerSpecs[k].kind!=='high')continue;const v=access.value(s,access.last(s),k),med=access.baseline(s,ids,k);if(!num(v)||!num(med))continue;const delta=v-med,tone=peerTone(k,v,med);findings.push({tone:tone==='above'?'positive':tone==='below'?'caution':'neutral',text:peerSpecs[k].label+': '+peerFmt(k,v)+' vs '+peerFmt(k,med)+' selected peer median ('+(delta>0?'+':'')+fmt(delta,1)+'pp). Latest observation, not a sustained trend.'});}
 return '<div class="kpi-insight"><strong>Relative positioning across available evidence</strong>'+(findings.length?'<div class="peer-findings">'+findings.map(f=>'<p class="peer-finding '+f.tone+'">'+esc(f.text)+'</p>').join('')+'</div>':'<p>At least two comparable selected peers are required for a median.</p>')+(access.group.every(p=>ids.includes(p[0]))?list(lens.assessment):'<p>Full-universe commentary is hidden when peers are deselected.</p>')+'</div>';
}


// A comparison must include the focus and two independent selected peers.
function peerScatterReady(graph,focus){
 return graph.points.some(p=>p.id===focus)&&graph.points.filter(p=>p.id!==focus).length>=2;
}
function peerTrendCoverage(series,focus){
 const observed=t=>t.x.map((date,i)=>({date,value:t.y[i]})).filter(p=>p.date&&num(p.value));
 const base=series.find(t=>t.name===focus),dates=base?observed(base):[];
 if(dates.length<2)return [];
 const peers=series.filter(t=>t.name!==focus&&observed(t).length>=2).filter(t=>{
  // Match distinct fiscal observations; tolerate month-end calendar differences.
  const remaining=observed(t).slice();let matches=0;
  for(const a of dates){
   const choices=remaining.map((b,i)=>({i,days:Math.abs(new Date(a.date)-new Date(b.date))/86400000})).filter(b=>b.days<=45).sort((a,b)=>a.days-b.days);
   if(choices.length){remaining.splice(choices[0].i,1);matches++;}
  }
  return matches>=2;
 });
 return peers.length>=2?[base,...peers]:[];
}
const retailComparisonMetrics=['onlineGrowth','sellerRevenue','sellerGrowth','gmvg','gmv'];

function peerPanel(panel,m,d,source){
 const segment=symbol==='AMZN'&&amazonPeerLens!=='consolidated',access=segment?segmentAccess(amazonPeerLens):null,cfg=access?.cfg,s=segment?access.focus:symbol,st=segment?access.st:peerSettings(s),group=segment?access.group:peerGroups[s],fin=peerFinance.has(s),dev=s==='OKLO',ids=[s,...group.map(r=>r[0]).filter(id=>st.enabled.includes(id))],last=access?access.last:latest,value=access?access.value:peerValue,compatible=access?access.compatible:peerCompatible,baseline=access?access.baseline:peerBaseline;
 const focusName=segment?access.lens.companies[0].name:m.name,focusIndustry=segment?access.lens.title:m.industry;
 const growthKeys=segment?cfg.x:fin?['rev','pretax','eps']:dev?['cash','burn','runway','rev','eps']:['rev','op','eps','pretax'];
 const multipleKeys=segment?cfg.y:fin?['pe','pb']:dev?['marketcap','pb','evsales','pe','evebitda']:['pe','pb','evsales','evebitda'];
 const qualityKeys=segment?(amazonPeerLens==='retail'?retailComparisonMetrics.filter(k=>ids.filter(id=>compatible(id,s)&&num(value(id,last(id),k))).length>=2):cfg.metrics.map(r=>r[0])):fin?['rev','pretax','pretaxMargin','eps','roe','pe','pb']:dev?['cash','burn','runway','marketcap','pb','evsales']:['rev','op','margin','pretaxMargin','eps','roe','fcfMargin','pe','pb','evsales','evebitda'];
 const trendKeys=segment?cfg.trend:fin?['rev','pretax','eps','pretaxMargin','roe']:dev?['cash','burn','runway','rev']:['rev','op','eps','margin','pretaxMargin','roe','fcfMargin'];
 let graph=peerGraph(s,ids,st,access);
 const validPairs=growthKeys.flatMap(x=>multipleKeys.filter(y=>x!==y).map(y=>({x,y}))).filter(pair=>peerScatterReady(peerGraph(s,ids,{...st,...pair},access),s));
 if(!validPairs.some(pair=>pair.x===st.x&&pair.y===st.y)&&validPairs.length){Object.assign(st,validPairs[0]);graph=peerGraph(s,ids,st,access);}
 const scatterHas=validPairs.length>0&&peerScatterReady(graph,s),excluded=ids.filter(id=>!graph.points.some(p=>p.id===id));
 const buildTrendSeries=k=>ids.map((id,i)=>{const rows=segment?access.rows(id):(get(id).quarterly||[]).slice(0,4).reverse();return {name:id,x:rows.map(r=>r.period),y:rows.map(r=>value(id,r,k)),mode:'lines+markers',connectgaps:false,line:{color:peerPalette[i],width:id===s?3:1.6},marker:{size:id===s?8:6},hovertemplate:esc(id)+'<br>%{x}<br>%{y:.2f}<extra></extra>'};});
 const validTrends=trendKeys.filter(k=>peerTrendCoverage(buildTrendSeries(k),s).length>=3);
 if(!validTrends.includes(st.trend)&&validTrends.length)st.trend=validTrends[0];
 const comparableTrends=peerTrendCoverage(buildTrendSeries(st.trend),s),trendHas=comparableTrends.length>=3;
 const comparison=!qualityKeys.length?'<p class="stock-note">No comparison metrics with two disclosed values for the selected peers.</p>':'<div class="table-scroll"><table class="fund-table peer-table"><thead><tr><th>Metric</th>'+ids.map(id=>'<th class="'+(id===s?'peer-selected':'')+'">'+esc(id)+'<small>'+esc(last(id).period||'Unavailable')+(id!==s&&!compatible(id,s)?' · outside window':'')+'</small></th>').join('')+'</tr></thead><tbody>'+qualityKeys.map(k=>{const med=baseline(s,ids,k);return '<tr><th scope="row">'+esc(peerSpecs[k].label)+(num(med)?'<small>Peer median '+esc(peerFmt(k,med))+'</small>':'')+'</th>'+ids.map(id=>{const v=value(id,last(id),k),tone=compatible(id,s)?peerTone(k,v,med):'neutral',cell=segment?access.cell(id,k):null;return '<td class="peer-cell peer-'+tone+(id===s?' peer-selected':'')+'" title="'+esc(cell?.note||(!compatible(id,s)?'Period unavailable or outside comparison window':num(med)?'Relative to included peer median':'Insufficient peers for benchmark'))+'">'+esc(cell?cell.display:peerFmt(k,v))+(cell?.source?' '+segmentSource(cell.source):'')+'</td>';}).join('')+'</tr>';}).join('')+'</tbody></table></div>';
 panel.innerHTML='<h2>Peers</h2>'+(symbol==='AMZN'?amazonPeerNav():'')+'<p class="stock-note">'+esc(segment?((d.quarterly?.[0]?.period>'2026-09-30'?'Historical snapshot · newer Amazon quarter exists. ':'Dated segment snapshot · ')+access.lens.description):'Compare operating economics and valuation without composite rankings or an automatic winner.')+'</p>'+
 '<section class="peer-section"><div class="section-kicker">01 / COMPETITIVE POSITIONING</div><h3>Comparison universe</h3><div class="peer-list"><article class="peer-company peer-focus"><div class="peer-ticker" style="color:'+peerPalette[0]+'">'+esc(s)+'</div><div><strong>'+esc(focusName)+'</strong><small>Selected company · '+esc(focusIndustry)+'</small></div><span>Selected</span></article>'+group.map(([id,name,type,desc],i)=>'<label class="peer-company"><div class="peer-ticker">'+esc(id)+'</div><div><strong>'+esc(name)+'</strong><small>'+esc(desc)+'</small></div><span class="peer-relation">'+esc(type)+'</span><input type="checkbox" data-peer="'+id+'" aria-label="Include '+esc(id)+'" '+(st.enabled.includes(id)?'checked':'')+'></label>').join('')+'</div><p class="stock-note">Select peers to update all comparisons. Segment and adjacent peers are useful context, not like-for-like benchmarks.</p></section>'+
 (scatterHas?'<section class="peer-section"><div class="section-kicker">02 / '+(segment?'GROWTH VS BUSINESS ECONOMICS':'GROWTH VS VALUATION')+'</div><h3>'+esc(segment?'Growth versus business economics map':dev?'Capital and valuation map':'Growth versus valuation map')+'</h3><div class="peer-controls"><label>X axis '+peerSelect('peer-x',growthKeys.filter(x=>validPairs.some(pair=>pair.x===x)),st.x)+'</label><label>Y axis '+peerSelect('peer-y',multipleKeys.filter(y=>validPairs.some(pair=>pair.x===st.x&&pair.y===y)),st.y)+'</label></div>'+'<div id="peer-scatter" class="stock-chart peer-chart"></div>'+(scatterHas&&num(graph.mx)&&num(graph.my)?'<p class="stock-note">Dotted lines: included peers’ medians, excluding '+esc(s)+'. X: '+esc(peerFmt(st.x,graph.mx))+' · Y: '+esc(peerFmt(st.y,graph.my))+'. These are descriptive, not buy/sell quadrants.</p>':scatterHas?'<p class="stock-note">'+(segment?'Median lines require two comparable plotted peers; different reporting scopes are not benchmarked.':'At least two plotted peers are required for median reference lines.')+'</p>':'')+(scatterHas&&excluded.length?'<p class="stock-note">Not plotted (unavailable, nonpositive multiple or unmatched reporting period): '+esc(excluded.join(', '))+'.</p>':'')+'</section>':'')+
 '<section class="peer-section"><div class="section-kicker">'+(scatterHas?'03':'02')+' / COMPARATIVE BUSINESS QUALITY</div><h3>'+esc(segment?'Business economics':'Business economics and valuation')+'</h3><div class="peer-legend"><span class="peer-above">Higher operating metric</span><span class="peer-below">Lower operating metric</span><span class="peer-lower">Lower multiple</span><span class="peer-higher">Higher multiple</span><span>Neutral / unavailable</span></div>'+comparison+'<p class="stock-note">'+esc(segment?'Colours compare eligible operating metrics with at least two selected peers. Different scopes stay neutral. Segment valuations and undisclosed margins are not estimated. Source links appear beside disclosures.'+(amazonPeerLens==='retail'?' Only metrics with at least two disclosed values are shown; GMV is peer-only context when Amazon does not report it.':''):'Colours are relative to the selected peer median, not historical trends or investment quality. Two valid peer observations required. Valuation multiples are positive provider figures; quarterly statement dates are shown. Comparisons exclude reporting periods more than 62 days apart from '+s+'. Tolerance: 0.75pp for rates and 2% for multiples.')+'</p></section>'+
 (trendHas?'<section class="peer-section"><div class="section-kicker">'+(scatterHas?'04':'03')+' / RELATIVE FUNDAMENTAL MOMENTUM</div><div class="val-range-head"><h3>Last four reported quarters</h3><label>Metric '+peerSelect('peer-trend',validTrends,st.trend)+'</label></div>'+'<div id="peer-trend-chart" class="stock-chart peer-chart"></div>'+'<p class="stock-note">'+esc(segment?'Only disclosed series on the selected currency basis are plotted. Missing history stays blank; calendar-quarter labels correspond to the stored fiscal snapshots.':'Actual fiscal period ends; missing observations stay blank. YoY growth requires a positive comparable prior-year base. No synthetic quarter values.')+'</p></section>':'')+
 '<section class="peer-section"><div class="section-kicker">0'+(3+Number(scatterHas)+Number(trendHas))+' / COMPETITIVE ASSESSMENT</div><h3>What stands out</h3>'+(segment?segmentAssessment(access,ids):peerAssessment(s,ids))+'</section>'+
 (segment?'<details class="risk-method"><summary>Data methodology & sources</summary><p>Stored dated segment disclosures. No parent-company multiple is applied to a segment. The stored figures have not been freshly reconciled in this layout revision.</p></details>':'<details class="risk-method"><summary>Data methodology & sources</summary><p>Standardized quarterly statements and provider multiples; SEC prior-year comparatives used only when compatible with matching provider observations. ROE = TTM common net income / average current and year-ago common equity; FCF margin = TTM reported FCF / TTM revenue. Runway proxy = reported cash and investments / trailing monthly free cash burn, not committed project funding. Generic operating margins, EV multiples and FCF metrics are not used for financial-company comparisons. Data for different fiscal periods, currencies and business mixes may not be fully comparable.</p>'+source+'</details>');
 if(symbol==='AMZN')bindAmazonPeerNav(panel);
 panel.querySelectorAll('[data-peer]').forEach(b=>b.onchange=()=>{const id=b.dataset.peer;if(b.checked&&!st.enabled.includes(id))st.enabled.push(id);if(!b.checked)st.enabled=st.enabled.filter(x=>x!==id);render();});
 for(const [id,k] of [['peer-x','x'],['peer-y','y'],['peer-trend','trend']]){if(k==='trend'?!trendHas:!scatterHas)continue;el(id).value=st[k];el(id).onchange=e=>{st[k]=e.target.value;if(k==='x'&&!validPairs.some(pair=>pair.x===st.x&&pair.y===st.y)){const pair=validPairs.find(pair=>pair.x===st.x);if(pair)st.y=pair.y;}render();};}
 if(window.Plotly&&scatterHas)Plotly.react('peer-scatter',graph.traces,graph.layout,{responsive:true,displayModeBar:false});
 if(trendHas)chart('peer-trend-chart',comparableTrends,peerSpecs[st.trend].label);
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
 if(type==='milestone'){const r=cfg.milestones?.[key];if(!r)return unknown();return out(r[2]==='Not assessed'?'unknown':'neutral',r[1],r[3],r[4]+' Dated milestone, not a long-term thesis conclusion.',cfg.sources[0][1]);}
 if(type==='risk'){
  const r=riskAt(s,d,q,key);if(r.status==='unknown')return unknown(r.why);
  const e=riskEvidence(s,d,q,key,r);
  return out(r.status==='high'||e.label==='Persistent risk flag'?'pressure':r.status==='watch'||r.status==='structural'?'watch':'neutral',r.metric,q.period||'—',r.why+' '+e.label+' · '+e.detail,r.src||'');
 }
 if(type==='kpi'){
  const r=cfg.rows.find(x=>x.id===key);if(!r||!num(r.values[3]))return unknown('Operational disclosure not populated.',cfg.period);
  if(q.period&&q.period>cfg.period)return unknown('Newer financial period exists; operational snapshot needs refresh.',cfg.period);
  const v=r.values[3],old=r.values[4],delta=kpiDelta(r,v,old),e=kpiEvidence(r);
  let status='neutral',detail=r.why+' '+evidenceClass(e)+' · '+e.summary+'.';
  if(rule==='context'){status='watch';detail+=' Comparable capital-return history required.';}
  else if(rule==='above1'){status=v<1?'watch':'neutral';detail+=' TTM level versus 1x research threshold; no directional conclusion.';}
  else if(e.count>=3&&e.direction<0){status='pressure';detail+=' Sustained adverse growth momentum.';}
  else if(e.count>=3&&e.direction>0&&e.points[0]?.value*(rule==='down'?-1:1)>0){status='support';detail+=' Sustained favorable growth momentum.';}
  else if(num(delta)&&(rule==='down'?-delta:delta)< -(r.unit==='%'?.75:2)){status='watch';detail+=' Emerging adverse observation; not a confirmed trend.';}
  else detail+=' Insufficient comparable history for sustained thesis support.';
  return out(status,kpiFmt(r,v)+(num(delta)?' · YoY '+kpiDeltaText(r,v,old):''),cfg.period,detail,cfg.sources[r.src]?.[1]||'');
 }
 if(type==='ttm'){
  const now=ttmAt(rows,0,key),prior=matchedTtmPrior(d,rows,key);if(!num(now))return unknown('Four consecutive quarters required for TTM calculation.');
  const status=now<0?'pressure':num(prior)&&now<prior*.75&&prior>0?'watch':'neutral';
  return out(status,money(now)+' TTM',q.period,(num(prior)?'Previous year TTM '+money(prior)+'. ':'Previous year TTM unavailable. ')+(now<0?'Current negative TTM cash generation; distinguish planned investment from operating weakness.':'TTM condition, not a confirmed sustained recovery.'));
 }
 if(type==='fin'){
  const v=q[key];if(!num(v))return unknown();const e=financialEvidence(d,rows,key),old=comparablePrior(d,rows,q,key);
  const status=rule==='context'?'neutral':e.count>=3&&(e.direction<0||e.persistence<0&&e.direction<=0)?'pressure':e.count>=3&&(e.direction>0&&e.points[0]?.value>0||e.persistence>0&&e.direction>=0)?'support':num(old)&&direction(v,old,key)<0?'watch':'neutral';
  return out(status,fundValue(key,v),q.period,(num(old)?'Year-ago '+fundValue(key,old)+'. ':'')+(rule==='context'?'Review alongside debt, depreciation and operating cash flow. ':evidenceClass(e)+' · ')+evidenceBrief(e));
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
 '<section class="thesis-section"><div class="section-kicker">02 / THESIS VALIDATION</div><h3>Is the evidence supporting the thesis?</h3><div class="thesis-checks">'+checks.map(c=>'<article class="thesis-check thesis-'+c.status+'"><div class="thesis-check-top"><strong>'+esc(c.name)+'</strong><span>'+esc(thesisStatus[c.status])+'</span></div><div class="thesis-metric">'+esc(c.value)+'</div><p>'+esc(c.condition)+'</p><div class="thesis-evidence">'+esc(c.detail)+'</div><small>'+esc(c.period)+sourceLink(c)+'</small></article>').join('')+'</div><p class="stock-note">These are evidence screens for the proposed company-specific research conditions, not a verdict on your edited thesis. Sustained directional thesis assessments require at least three comparable YoY observations; current adverse levels may warrant immediate attention but are not proof of a trend. Single favorable quarters do not establish thesis support. Reported milestones are observations, not final approvals. Stale KPI snapshots remain unassessed.</p></section>'+
 '<section class="thesis-section"><div class="section-kicker">03 / CATALYST WATCHLIST</div><h3>What could change the thesis?</h3><div class="catalyst-grid">'+cfg.catalysts.map(([name,what,cadence])=>'<article class="catalyst-card"><span class="catalyst-kind">WATCH ITEM · NO CONFIRMED DATE</span><h4>'+esc(name)+'</h4><p>'+esc(what)+'</p><small>'+esc(cadence)+'</small></article>').join('')+'</div><h4 class="thesis-subhead">Your dated catalysts</h4><div id="catalyst-list"></div><div class="thesis-form catalyst-form"><label for="cat-name">Event / development</label><input id="cat-name" placeholder="e.g. Quarterly results or licensing decision"><div class="thesis-form-row"><div><label for="cat-date">Expected or confirmed date (optional)</label><input id="cat-date" type="date"></div><div><label for="cat-status">Date status</label><select id="cat-status"><option value="Watch">Watch / anticipated</option><option value="Confirmed">Confirmed by source</option></select></div></div><label for="cat-source">Source URL (required for confirmed dates)</label><input id="cat-source" type="url" placeholder="https://…"><button id="cat-add" class="stock-action">Add catalyst</button><p id="cat-feedback" class="stock-note"></p></div></section>'+
 '<section class="thesis-section"><div class="section-kicker">04 / THESIS EVOLUTION</div><h3>Research journal</h3><p class="stock-note">Record a dated conclusion after each earnings release or material event. No historical conviction has been invented. Notes and customizations stay in this browser; they do not sync or upload to GitHub.</p><div class="thesis-form"><div class="thesis-form-row"><div><label for="thesis-conviction">Review outcome</label><select id="thesis-conviction">'+convictionOptions.map(o=>'<option>'+esc(o)+'</option>').join('')+'</select></div><div><label for="thesis-period">Reporting period or event date</label><input id="thesis-period" type="date" value="'+esc(q.period||'')+'"></div></div><label for="thesis">Research conclusion</label><textarea id="thesis" placeholder="What changed? What evidence supports or challenges the thesis? What will you monitor next?"></textarea><button class="stock-action" id="save">Save dated review + evidence snapshot</button><p id="save-status" class="stock-note"></p></div><div id="history"></div></section>'+
 '<details class="risk-method"><summary>Evidence & limitations</summary><p>Quantitative checks reuse the latest available standardized financials and the dated Business Drivers / Financial Risk snapshots. Disclosures are not a fully automated event feed. Catalyst dates are user-entered and not independently verified by this dashboard. Notes are private to the current browser, and clearing browser data removes them.</p>'+source+'</details>';
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
else if(tab==='Business Drivers'){kpiPanel(panel,m,d,source);}
else if(tab==='Valuation'){valPanel(panel,m,d,p,source);}
else if(tab==='Peers'){peerPanel(panel,m,d,source);}
else if(tab==='Thesis & catalysts'){thesisPanel(panel,m,d,source);}
}
const h=location.hash.slice(1);if(M[h])symbol=h;
render();
fetch('data/stocks.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('Data not published');return r.json();}).then(j=>{data=j;el('freshness').textContent=j.generated_at?.slice(0,10)||'Unknown';el('data-status').textContent=j.source||'';render();}).catch(()=>{el('freshness').textContent='Unavailable';el('data-status').textContent='Financial data has not yet been published. Research framework remains accessible.';});
