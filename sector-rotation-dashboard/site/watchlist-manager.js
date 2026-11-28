'use strict';
(() => {
  const hiddenKey = 'stock-lab.hidden-memberships.v1';
  const validTicker = /^[A-Z][A-Z0-9.-]{0,9}$/;
  const localKey = (group, ticker) => JSON.stringify([group, ticker]);
  let hidden;
  try {
    const stored = JSON.parse(localStorage.getItem(hiddenKey) || '[]');
    hidden = new Set(Array.isArray(stored) ? stored : []);
  } catch { hidden = new Set(); }
  window.stockListHidden = (group, ticker) => hidden.has(localKey(group, ticker));

  const form = document.getElementById('list-manager-form');
  const action = form.elements.actionType, list = form.elements.group;
  const choose = form.elements.member, ticker = form.elements.ticker;
  const button = document.getElementById('list-apply'), status = document.getElementById('list-status');
  const hint = document.getElementById('list-hint');
  const hints = {
    add:'Open the prepared request in Codex and press Send to start the research and publish the shared change.',
    remove:'Removes membership from the selected shared list. Saved company research remains searchable.',
    hide:'Hides this ticker in the selected list on this browser.',
    show:'Restores a hidden ticker on this browser.',
    sync:'Imports membership changes from the matching TradingView list. Dashboard-only additions are preserved.'
  };
  let signature;
  function options(select, values) {
    const previous = select.value;
    select.replaceChildren(...values.map(value => new Option(value, value)));
    if (values.includes(previous)) select.value = previous;
  }
  function configure() {
    const kind = action.value, members = data.watchlists?.[list.value] || [];
    const withMember = ['hide','show','remove'].includes(kind);
    form.querySelector('[data-field="member"]').hidden = !withMember;
    form.querySelector('[data-field="ticker"]').hidden = kind !== 'add';
    ticker.required = kind === 'add';
    options(choose, members.filter(s => kind === 'remove' || window.stockListHidden(list.value,s) === (kind === 'show')));
    hint.textContent = hints[kind];
    button.textContent = ({add:'Add & research in Codex ↗',remove:'Remove in Codex ↗',sync:'Sync in Codex ↗',hide:'Hide ticker',show:'Show ticker'})[kind];
    button.disabled = !list.value || (withMember && !choose.value);
  }
  window.refreshStockListManager = () => {
    const current = JSON.stringify(data.watchlists || {});
    if (current === signature) return;
    signature = current;
    options(list,Object.keys(data.watchlists || {}));
    configure();
  };
  for (const el of [action,list]) el.addEventListener('change', () => {status.textContent='';document.getElementById('request-fallback').hidden=true;configure();});
  form.addEventListener('submit', e => {
    e.preventDefault();
    const kind=action.value, group=list.value;
    if (!Object.hasOwn(data.watchlists || {},group)) return;
    const s=kind === 'add' ? ticker.value.trim().toUpperCase() : choose.value;
    if (kind !== 'sync' && !validTicker.test(s)) {status.textContent='Enter a valid ticker symbol.';return;}
    if (kind === 'hide' || kind === 'show') {
      const copy = new Set(hidden), key = localKey(group,s);
      if (kind === 'hide') copy.add(key); else copy.delete(key);
      try {localStorage.setItem(hiddenKey,JSON.stringify([...copy]));}
      catch {status.textContent='This browser could not save your preference.';return;}
      hidden=copy; render(); configure();
      status.textContent=s+(kind==='hide'?' hidden in ':' visible in ')+group+'.';
      return;
    }
    const title = ['Watchlist',kind,group,...(kind==='sync'?[]:[s])].join(' | ');
    const prompt = [
      'Please execute this shared watchlist request on the Stock Intelligence Lab website at https://github.com/charmedvie/sector-rotation.',
      title,
      'Use the current main branch and the watchlist request script under sector-rotation-dashboard/scripts.',
      kind === 'sync' ? 'Read the matching list from my connected TradingView account, sync only that list into the site, and preserve dashboard-only additions. Research every newly imported company.' : '',
      kind !== 'remove' ? 'For each added company, verify the listing, reporting currency and share class. Populate and verify every dashboard tab with up-to-date filings, financial history and valuation, company-specific drivers and risks, real peers, recent news and ownership filings. Write a concise investment thesis with confirmation and invalidation conditions, dated catalysts and primary-source links. Flag genuine gaps.' : 'Remove only the selected membership. Keep other lists and existing company research.',
      'Publish the requested change, verify it on the live site and report the result.'
    ].filter(Boolean).join('\n');
    const fallback=document.getElementById('request-fallback');
    document.getElementById('request-text').value=prompt;
    fallback.hidden=false;
    status.textContent='Press Send in Codex to start. If the app did not open, copy the request below.';
    window.location.href='codex://threads/new?prompt='+encodeURIComponent(prompt);
  });
  document.getElementById('copy-request').onclick=async () => {
    const field=document.getElementById('request-text');
    try {await navigator.clipboard.writeText(field.value);status.textContent='Copied. Paste the request into Codex and press Send.';}
    catch {field.focus();field.select();status.textContent='Request selected. Copy it and paste it into Codex.';}
  };
  window.refreshStockListManager();
})();
