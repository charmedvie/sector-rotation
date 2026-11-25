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
test('four-quarter chart, negative bars, and SEC comparative fallback',()=>{const {ctx,nodes}=load();vm.runInContext("data={stocks:{IBKR:{quarterly:[{period:'2026-09-30',revenue:120,operating_profit:30,eps:1,pretax_margin:30},{period:'2026-06-30',revenue:110,operating_profit:20,eps:0.8,pretax_margin:20},{period:'2026-03-31',revenue:100,operating_profit:-5,eps:-0.1,pretax_margin:-5},{period:'2025-12-31',revenue:90,operating_profit:10,eps:0.4,pretax_margin:10}],annual:[],quote:{trailingPE:29},prices:[],prior_year:{'2026-09-30':{revenue:100},'2026-06-30':{revenue:100},'2026-03-31':{revenue:100},'2025-12-31':{revenue:100}}}}};render()",ctx);const page=nodes.get('panel').innerHTML;assert.match(page,/Revenue YoY/);assert.match(page,/\+20%/);assert.match(page,/-10%/);assert.equal((page.match(/class="quarter-chart"/g)||[]).length,4);for(const d of ['2025-12','2026-03','2026-06','2026-09'])assert.ok(page.includes(d));assert.match(page,/Quarterly levels/);assert.match(page,/historical P\/E range not available|Historical P\/E range not available/);});
