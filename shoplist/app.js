(() => {
  const $ = s => document.querySelector(s);
  const store = {
    get(k, f) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : f } catch (e) { return f } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)) } catch (e) {} }
  };
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // Defaults are placeholders — edit the rates at the top of the page.
  const S = { gbp: 14.5, usd: 11, top: [], shein: {}, filter: 'all', owner: '', view: 'list' };
  Object.assign(S, store.get('haul.v1', {}));

  // A shared link (#s=...) overrides local state.
  try {
    const h = location.hash.match(/s=([^&]+)/);
    if (h) Object.assign(S, JSON.parse(decodeURIComponent(escape(atob(h[1])))));
  } catch (e) {}

  let ITEMS = [];
  const save = () => store.set('haul.v1', S);
  const owner = i => (i.owner || 'nana').toLowerCase();
  const cur = i => i.priceGbp != null ? 'GBP' : i.priceUsd != null ? 'USD' : null;
  const native = i => i.priceGbp ?? i.priceUsd ?? null;
  const rate = c => c === 'GBP' ? S.gbp : S.usd;
  const ghs = i => native(i) == null ? 0 : native(i) * rate(cur(i));
  const usd = i => ghs(i) / (S.usd || 1);
  const title = i => i.title || i.url.split('/product/')[1]?.split(/[?_]/)[0].replace(/-\d{10,}$/, '').replace(/-/g, ' ') || i.id.replace(/-/g, ' ');
  const brand = i => i.brand || (/boohoo/.test(i.url) ? 'BoohooMAN' : /playboy/i.test(i.url) ? 'Playboy x Sumwon' : /missguided/i.test(i.url) ? 'Missguided' : 'Sumwon');
  const isSumwon = i => /sumwon/.test(i.url);
  const fmt = (n, c) => (c === 'GBP' ? '£' : '$') + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const cedi = n => 'GHS ' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const sku = i => (i.url.match(/(\d{10,})/) || [])[1] || '';
  const sheinSearch = i => 'https://www.shein.com/pdsearch/' + encodeURIComponent(title(i)) + '/';
  const sheinPrice = i => S.shein[i.id]?.p;
  const sheinUrl = i => S.shein[i.id]?.u || sheinSearch(i);

  function visible() {
    return ITEMS.filter(i => {
      if (S.owner && owner(i) !== S.owner) return false;
      if (S.view === 'compare' && !isSumwon(i)) return false;
      if (S.filter === 'top') return S.top.includes(i.id);
      if (S.filter === 'needs') return native(i) == null || (S.view === 'compare' && sheinPrice(i) == null);
      return true;
    });
  }

  function img(i) {
    const letter = esc((i.category || '?')[0]);
    return `<img src="${esc(i.image || '')}" alt="" loading="lazy" onerror="this.parentNode.innerHTML='<div class=ph>${letter}</div>'">`;
  }

  function priceHtml(i) {
    if (native(i) == null) return `<span class="price-native">—</span><span class="price-ghs">Needs price</span>`;
    return `<span class="price-native">${fmt(native(i), cur(i))}</span><span class="price-ghs">${cedi(ghs(i))}</span>`;
  }

  function sheinBox(i) {
    if (!isSumwon(i)) return '';
    const sp = sheinPrice(i), mine = native(i) != null ? usd(i) : null;
    let tag = '';
    if (sp != null && mine != null) tag = sp < mine - 0.005 ? `<span class="tag good">Shein −$${(mine - sp).toFixed(2)}</span>` : sp > mine + 0.005 ? `<span class="tag bad">SUMWON cheaper</span>` : '<span class="tag">Same</span>';
    return `<div class="shein-box"><input data-shein="${esc(i.id)}" type="number" inputmode="decimal" step="0.01" min="0" placeholder="Shein $" value="${sp ?? ''}" aria-label="Shein price in USD"><a href="${esc(sheinUrl(i))}" target="_blank" rel="noopener">Find on Shein ↗</a>${tag}</div>`;
  }

  function itemHtml(i) {
    const top = S.top.includes(i.id);
    return `<article class="item" data-id="${esc(i.id)}">
      <a class="media" href="${esc(i.url)}" target="_blank" rel="noopener">${img(i)}${i.size ? `<span class="size-badge">${esc(i.size)}</span>` : ''}</a>
      <div class="item-main">
        <div class="item-topline"><p class="brand">${esc(brand(i))}</p><p class="status">${esc(i.category || '')}</p></div>
        <h2><a href="${esc(i.url)}" target="_blank" rel="noopener">${esc(title(i))}</a></h2>
        <dl class="specs">${i.size ? `<div><dt>Size</dt><dd>${esc(i.size)}</dd></div>` : ''}${i.length ? `<div><dt>Length</dt><dd>${esc(i.length)}</dd></div>` : ''}</dl>
        ${i.notes ? `<p class="notes">${esc(i.notes)}</p>` : ''}
        <div class="item-actions"><button class="rank-button ${top ? 'active' : ''}" data-top="${esc(i.id)}">${top ? '★ Top 5' : '☆ Top 5'}</button>${sku(i) ? `<span class="url">SKU ${sku(i)}</span>` : ''}</div>
        ${sheinBox(i)}
      </div>
      <div class="price-block"><p class="status">${native(i) == null ? 'Needs price' : cur(i)}</p>${priceHtml(i)}</div>
    </article>`;
  }

  function compareHtml(list) {
    const rows = list.map((i, n) => {
      const sp = sheinPrice(i), mine = native(i) != null ? usd(i) : null;
      const cheaper = sp != null && mine != null && sp < mine - 0.005;
      return `<tr>
        <td class="cell-num">${n + 1}</td>
        <td><div class="cell-item"><span class="thumb">${img(i)}</span><span>${esc(title(i))}<br><small style="color:var(--muted)">${esc(i.size || '')} · SKU ${sku(i)}</small></span></div></td>
        <td class="cell-price">${native(i) == null ? '—' : fmt(native(i), cur(i))}</td>
        <td class="cell-link"><a href="${esc(i.url)}" target="_blank" rel="noopener">SUMWON ↗</a></td>
        <td class="cell-price"><input data-shein="${esc(i.id)}" type="number" inputmode="decimal" step="0.01" min="0" placeholder="$" value="${sp ?? ''}">${cheaper ? '<span class="tag good">cheaper</span>' : ''}</td>
        <td class="cell-link"><a href="${esc(sheinUrl(i))}" target="_blank" rel="noopener">Shein ↗</a></td></tr>`;
    }).join('');
    const filled = list.filter(i => sheinPrice(i) != null && native(i) != null);
    const cheaper = filled.filter(i => sheinPrice(i) < usd(i) - 0.005).length;
    const note = filled.length
      ? `<p class="compare-note"><b>${cheaper} of ${filled.length}</b> compared items are cheaper on Shein (${list.length - filled.length} still need a Shein price).</p>`
      : `<p class="compare-note">Tap "Find on Shein", match the item by photo/SKU, then type the Shein price in the box. Nothing is guessed.</p>`;
    return `<div class="table-wrap"><table class="compare-table"><thead><tr><th>#</th><th>Item</th><th>SUMWON price</th><th>SUMWON link</th><th>Shein price</th><th>Shein link</th></tr></thead><tbody>${rows}</tbody></table></div>${note}`;
  }

  function totals() {
    const sum = o => ITEMS.filter(i => owner(i) === o);
    const t = l => ({ usd: l.reduce((a, i) => a + usd(i), 0), ghs: l.reduce((a, i) => a + ghs(i), 0) });
    const n = t(sum('nana')), k = t(sum('kojo')), all = t(ITEMS);
    const f = x => `$${x.usd.toFixed(2)} <small style="color:var(--muted);font-weight:400">${cedi(x.ghs)}</small>`;
    $('#tItems').textContent = ITEMS.length;
    $('#tNana').innerHTML = f(n); $('#tKojo').innerHTML = f(k); $('#tAll').innerHTML = f(all);
  }

  function render() {
    const list = visible();
    totals();
    document.querySelectorAll('[data-f]').forEach(b => b.classList.toggle('active', b.dataset.f === S.filter));
    document.querySelectorAll('[data-o]').forEach(b => b.classList.toggle('active', b.dataset.o === S.owner));
    document.querySelectorAll('[data-v]').forEach(b => b.classList.toggle('active', b.dataset.v === S.view));
    const out = $('#out');
    if (!list.length) { out.innerHTML = `<div class="empty">${S.filter === 'top' ? 'No Top 5 picks yet — tap ☆ Top 5 on an item.' : 'Nothing to show.'}</div>`; return; }
    if (S.view === 'compare') { out.innerHTML = compareHtml(list); return; }
    const grid = S.view === 'grid';
    let html = '', last = '';
    for (const i of list) {
      const o = owner(i);
      if (o !== last) { last = o; const c = list.filter(x => owner(x) === o); html += `<div class="section-header">${o === 'kojo' ? 'Kojo' : 'Nana'}<span class="sub">${c.length} items</span></div>`; }
      html += itemHtml(i);
    }
    out.innerHTML = `<div class="list ${grid ? 'grid-view' : ''}">${html}</div>`;
  }

  // events
  document.addEventListener('click', e => {
    const f = e.target.closest('[data-f]'); if (f) { S.filter = f.dataset.f; save(); return render(); }
    const o = e.target.closest('[data-o]'); if (o) { S.owner = S.owner === o.dataset.o ? '' : o.dataset.o; save(); return render(); }
    const v = e.target.closest('[data-v]'); if (v) { S.view = S.view === v.dataset.v ? 'list' : v.dataset.v; save(); return render(); }
    const t = e.target.closest('[data-top]');
    if (t) {
      const id = t.dataset.top, ix = S.top.indexOf(id);
      if (ix >= 0) S.top.splice(ix, 1);
      else if (S.top.length >= 5) { alert('Top 5 is full — un-star one first.'); return; }
      else S.top.push(id);
      save(); render();
    }
  });
  document.addEventListener('change', e => { // commit on blur/enter so typing isn't interrupted by re-render
    const el = e.target.closest('[data-shein]'); if (!el) return;
    const id = el.dataset.shein, v = parseFloat(el.value);
    if (isNaN(v)) { if (S.shein[id]) delete S.shein[id].p; } else S.shein[id] = { ...(S.shein[id] || {}), p: v };
    save(); render();
  });
  for (const k of ['gbp', 'usd']) {
    const el = $('#' + k); el.value = S[k];
    el.addEventListener('input', () => { const v = parseFloat(el.value); if (v > 0) { S[k] = v; save(); totals(); render(); } });
  }
  $('#share').addEventListener('click', async () => {
    const payload = btoa(unescape(encodeURIComponent(JSON.stringify({ gbp: S.gbp, usd: S.usd, top: S.top, shein: S.shein }))));
    const url = location.origin + location.pathname + '#s=' + encodeURIComponent(payload);
    const b = $('#share');
    try { await navigator.clipboard.writeText(url); b.textContent = 'Link copied ✓'; }
    catch (e) { prompt('Copy this link:', url); }
    setTimeout(() => b.textContent = 'Copy share link', 1600);
  });

  fetch('data/items.json').then(r => r.json()).then(d => { ITEMS = d; render(); })
    .catch(() => { $('#out').innerHTML = '<div class="empty">Could not load data/items.json — serve the folder over http (not file://).</div>'; });
})();
