(() => {
  'use strict';

  /* ---------- config ---------- */
  const KEY = 'watchlater.v1';
  const DAY = 864e5;
  const BIN_DAYS = 30;

  // Keyword "smart categories". First match wins ties by order; edit freely.
  const CATEGORIES = [
    ['Planning', ['plan', 'planning', 'planner', 'schedule', 'routine', 'productivity', 'productive', 'habit', 'habits', 'goal', 'goals', 'organize', 'organized', 'organization', 'calendar', 'notion', 'journal', 'journaling', 'todo', 'to-do', 'time management', 'weekly reset', 'reset', 'morning routine', 'night routine', 'checklist', 'system', 'systems', 'focus', 'declutter', 'cleaning']],
    ['Self-help', ['self', 'self help', 'selfhelp', 'mindset', 'motivation', 'motivational', 'confidence', 'healing', 'therapy', 'therapist', 'anxiety', 'mental health', 'discipline', 'growth', 'glow up', 'glowup', 'affirmation', 'affirmations', 'boundaries', 'relationship', 'relationships', 'advice', 'lesson', 'lessons', 'life', 'lifestyle', 'manifest', 'manifesting', 'selfcare', 'self care', 'self-care', 'wellbeing', 'stoic', 'stoicism', 'psychology', 'dating', 'love']],
    ['Money & Business', ['money', 'budget', 'budgeting', 'save', 'saving', 'savings', 'invest', 'investing', 'stock', 'stocks', 'finance', 'financial', 'side hustle', 'sidehustle', 'business', 'income', 'entrepreneur', 'entrepreneurship', 'marketing', 'brand', 'branding', 'sales', 'crypto', 'wealth', 'rich', 'debt', 'salary', 'career', 'job', 'interview', 'resume', 'startup', 'ecommerce', 'shopify']],
    ['Health & Fitness', ['workout', 'workouts', 'gym', 'fitness', 'exercise', 'pilates', 'yoga', 'weight', 'weightloss', 'protein', 'health', 'healthy', 'run', 'running', 'abs', 'glutes', 'cardio', 'stretch', 'stretching', 'sleep', 'diet', 'nutrition', 'calories', 'steps']],
    ['Food & Recipes', ['recipe', 'recipes', 'cook', 'cooking', 'meal', 'meals', 'mealprep', 'meal prep', 'food', 'foodie', 'bake', 'baking', 'dinner', 'lunch', 'breakfast', 'snack', 'eat', 'eating', 'restaurant', 'kitchen', 'smoothie', 'jollof']],
    ['Beauty & Style', ['makeup', 'skincare', 'skin', 'hair', 'hairstyle', 'outfit', 'outfits', 'ootd', 'fashion', 'style', 'styling', 'nails', 'beauty', 'grwm', 'perfume', 'fragrance', 'wardrobe', 'haul']],
    ['Tech & Learning', ['ai', 'chatgpt', 'claude', 'gpt', 'code', 'coding', 'programming', 'developer', 'app', 'apps', 'tech', 'learn', 'learning', 'study', 'studying', 'tips', 'tutorial', 'how to', 'howto', 'excel', 'iphone', 'hack', 'hacks', 'tool', 'tools', 'website', 'design', 'edu', 'education', 'book', 'books', 'reading']],
    ['Travel', ['travel', 'traveling', 'travelling', 'trip', 'flight', 'flights', 'hotel', 'visa', 'vacation', 'holiday', 'airport', 'passport', 'itinerary', 'explore', 'beach']],
    ['Faith', ['god', 'bible', 'prayer', 'pray', 'jesus', 'church', 'faith', 'christian', 'scripture', 'worship', 'allah', 'quran']],
    ['Funny', ['funny', 'comedy', 'lol', 'lmao', 'prank', 'joke', 'jokes', 'meme', 'memes', 'skit', 'humor', 'humour']],
    ['Music', ['music', 'song', 'songs', 'dance', 'dancing', 'cover', 'singing', 'afrobeats', 'amapiano', 'playlist', 'beat']]
  ];
  const OTHER = 'Other';
  const CAT_NAMES = [...CATEGORIES.map(c => c[0]), OTHER];

  /* ---------- helpers ---------- */
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const now = () => new Date().toISOString();
  const hash = s => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); };
  const icon = (n, cls = '') => `<svg class="i ${cls}"><use href="#i-${n}"/></svg>`;
  const fmtDateTime = iso => new Date(iso).toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const fmtDate = iso => new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  const dayKey = iso => { const d = new Date(iso); return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`; };
  function dayLabel(iso) {
    const d = new Date(iso), t = new Date(), y = new Date(Date.now() - DAY);
    if (dayKey(d) === dayKey(t)) return 'Today';
    if (dayKey(d) === dayKey(y)) return 'Yesterday';
    return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  }

  /* ---------- state + persistence ---------- */
  const DEFAULT = { version: 1, videos: [], purged: [], view: 'grid', filter: 'todo', sort: 'newest', cat: '', pool: 'todo' };
  let S;
  try { S = Object.assign({}, DEFAULT, JSON.parse(localStorage.getItem(KEY)) || {}); } catch (e) { S = { ...DEFAULT }; }
  let query = '';
  const save = () => {
    try { localStorage.setItem(KEY, JSON.stringify(S)); }
    catch (e) { toast('Could not save — browser storage is full or blocked. Export a backup.'); }
  };
  // Ask the browser not to evict our data under storage pressure.
  try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (e) {}

  const byId = id => S.videos.find(v => v.id === id);
  const isDeleted = v => !!v.deletedAt;
  const isWatched = v => v.watches && v.watches.length > 0;
  const lastWatch = v => isWatched(v) ? v.watches[v.watches.length - 1] : null;

  /* ---------- link parsing ---------- */
  function parseLink(raw) {
    let u;
    try { u = new URL(raw.trim().replace(/[).,;]+$/, '')); } catch (e) { return null; }
    if (!/^https?:$/.test(u.protocol)) return null;
    const host = u.hostname.replace(/^(www|m|vm|vt)\./, '').toLowerCase();
    const path = u.pathname.replace(/\/+$/, '');
    if (host === 'tiktok.com' || host.endsWith('.tiktok.com')) {
      const m = path.match(/\/(video|photo)\/(\d+)/);
      if (m) return { platform: 'tiktok', id: 'tt-' + m[2], url: 'https://www.tiktok.com' + path };
      return { platform: 'tiktok', id: 'tt-' + hash(u.hostname + path), url: u.origin + path }; // short link (vm.tiktok.com/…)
    }
    if (host === 'instagram.com' || host.endsWith('.instagram.com') || host === 'instagr.am') {
      const m = path.match(/\/(p|reel|reels|tv)\/([\w-]+)/);
      if (m) {
        const kind = m[1] === 'reels' ? 'reel' : m[1];
        return { platform: 'instagram', id: 'ig-' + m[2], url: `https://www.instagram.com/${kind}/${m[2]}/`, kind };
      }
      return { platform: 'instagram', id: 'ig-' + hash(path), url: 'https://www.instagram.com' + path + '/' };
    }
    return { platform: 'web', id: 'w-' + hash(u.href), url: u.href };
  }
  const extractLinks = text => (String(text).match(/https?:\/\/[^\s<>"'`]+/g) || []).map(parseLink).filter(Boolean);
  const platformName = p => ({ tiktok: 'TikTok', instagram: 'Instagram', web: 'Link' }[p] || 'Link');

  /* ---------- smart categories ---------- */
  function categorize(text) {
    const t = ' ' + String(text || '').toLowerCase().replace(/#/g, ' ').replace(/[^\p{L}\p{N}\s'-]/gu, ' ').replace(/\s+/g, ' ') + ' ';
    let best = OTHER, bestScore = 0;
    for (const [name, words] of CATEGORIES) {
      let score = 0;
      for (const w of words) if (t.includes(' ' + w + ' ')) score += w.includes(' ') ? 2 : 1;
      if (score > bestScore) { best = name; bestScore = score; }
    }
    return best;
  }

  function displayTitle(v) {
    if (v.title) {
      const clean = v.title.replace(/(\s*#[\p{L}\p{N}_]+)+\s*$/u, '').trim(); // drop trailing hashtags
      return clean || v.title;
    }
    if (v.platform === 'instagram') return `Instagram ${v.kind || 'post'}${v.author ? ' by @' + v.author : ''}`;
    if (v.platform === 'tiktok') return `TikTok${v.author ? ' by @' + v.author : ' video'}`;
    return v.url.replace(/^https?:\/\/(www\.)?/, '');
  }

  /* ---------- adding / merging ---------- */
  function makeVideo(link, extra = {}) {
    const v = {
      id: link.id, url: link.url, platform: link.platform, kind: link.kind,
      title: '', author: '', thumb: '',
      category: '', categoryManual: false, titleManual: false,
      addedAt: now(), favorite: false, watches: [], deletedAt: null, metaAt: 0
    };
    if (extra.title) { v.title = String(extra.title); v.titleManual = true; }
    if (extra.category && CAT_NAMES.includes(extra.category)) { v.category = extra.category; v.categoryManual = true; }
    if (extra.addedAt && !isNaN(Date.parse(extra.addedAt))) v.addedAt = new Date(extra.addedAt).toISOString();
    if (extra.favorite) v.favorite = true;
    if (Array.isArray(extra.watches)) v.watches = extra.watches.filter(w => !isNaN(Date.parse(w))).map(w => new Date(w).toISOString()).sort();
    if (extra.thumb) v.thumb = String(extra.thumb);
    if (extra.author) v.author = String(extra.author);
    if (!v.category) v.category = categorize(v.title);
    return v;
  }

  function addLinks(links, { quiet = false, extras = {} } = {}) {
    let added = 0, restored = 0, dupes = 0;
    for (const l of links) {
      const ex = byId(l.id);
      if (ex) {
        if (ex.deletedAt) { ex.deletedAt = null; restored++; } else dupes++;
        continue;
      }
      S.purged = S.purged.filter(id => id !== l.id); // re-adding by hand un-purges
      const v = makeVideo(l, extras[l.id] || {});
      S.videos.push(v);
      added++;
      queueMeta(v);
    }
    save(); render();
    if (!quiet) {
      const bits = [];
      if (added) bits.push(`Added ${added}`);
      if (restored) bits.push(`restored ${restored} from Recently deleted`);
      if (dupes) bits.push(`${dupes} already on your list`);
      toast(bits.length ? bits.join(', ') : 'No TikTok or Instagram links found');
    }
    return added;
  }

  /* ---------- metadata (titles + thumbnails) ---------- */
  const GENERIC = /^(instagram|tiktok|login|log in|sign up|instagram photos and videos|tiktok - make your day)\b/i;
  function cleanInstagram(title, desc) {
    const src = [title, desc].filter(Boolean).join(' \n ');
    const q = src.match(/on Instagram:\s*["“]([\s\S]+?)["”]\s*$/m) || src.match(/:\s*["“]([\s\S]{3,}?)["”]/);
    let caption = q ? q[1] : '';
    const author = (src.match(/^([\w.]+) on Instagram/m) || src.match(/ - ([\w.]+) on /) || [])[1] || '';
    if (!caption && title && !GENERIC.test(title)) caption = title;
    return { title: caption.trim(), author };
  }

  const metaQueue = [];
  let metaActive = 0;
  const retriedThisSession = new Set();
  function queueMeta(v, force) {
    if (!force && v.metaAt) return;
    if (metaQueue.includes(v.id)) return;
    metaQueue.push(v.id);
    pumpMeta();
  }
  function pumpMeta() {
    while (metaActive < 2 && metaQueue.length) {
      const v = byId(metaQueue.shift());
      if (!v) continue;
      metaActive++;
      fetchMeta(v).finally(() => { metaActive--; pumpMeta(); });
    }
  }
  async function getJSON(url) {
    const r = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!r.ok) throw new Error(r.status);
    return r.json();
  }
  async function fetchMeta(v) {
    let title = '', author = '', thumb = '';
    if (v.platform === 'tiktok') {
      try {
        const d = await getJSON('https://www.tiktok.com/oembed?url=' + encodeURIComponent(v.url));
        title = d.title || ''; author = d.author_unique_id || d.author_name || ''; thumb = d.thumbnail_url || '';
      } catch (e) {}
    }
    if (!thumb || !title) {
      try {
        const d = await getJSON('https://api.microlink.io/?url=' + encodeURIComponent(v.url));
        if (d.status === 'success' && d.data) {
          let t = d.data.title || '', a = d.data.author || '';
          if (v.platform === 'instagram') { const c = cleanInstagram(d.data.title, d.data.description); t = c.title; a = c.author || a; }
          if (GENERIC.test(t)) t = '';
          title = title || t; author = author || a;
          thumb = thumb || (d.data.image && d.data.image.url) || '';
        }
      } catch (e) {}
    }
    const fresh = byId(v.id);
    if (!fresh) return;
    if (title && !fresh.titleManual) fresh.title = title.trim();
    if (author) fresh.author = author.replace(/^@/, '');
    if (thumb) fresh.thumb = thumb;
    if (!fresh.categoryManual) fresh.category = categorize(fresh.title);
    fresh.metaAt = Date.now();
    save(); scheduleRender();
  }
  // Thumbnail URLs from TikTok/Instagram expire after a while; refetch once per session when one breaks.
  window.__thumbErr = img => {
    const card = img.closest('[data-id]');
    const v = card && byId(card.dataset.id);
    img.replaceWith(Object.assign(document.createElement('div'), { className: 'ph', innerHTML: icon('play') }));
    if (v && !retriedThisSession.has(v.id)) { retriedThisSession.add(v.id); queueMeta(v, true); }
  };

  /* ---------- recently deleted ---------- */
  function purgeBin() {
    const cutoff = Date.now() - BIN_DAYS * DAY;
    const gone = S.videos.filter(v => v.deletedAt && Date.parse(v.deletedAt) < cutoff);
    if (!gone.length) return;
    S.purged.push(...gone.map(v => v.id));
    S.videos = S.videos.filter(v => !gone.includes(v));
    save();
  }
  const daysLeft = v => Math.max(0, Math.ceil((Date.parse(v.deletedAt) + BIN_DAYS * DAY - Date.now()) / DAY));

  /* ---------- filtering / sorting ---------- */
  function inFilter(v, f) {
    if (f === 'bin') return isDeleted(v);
    if (isDeleted(v)) return false;
    if (f === 'todo') return !isWatched(v);
    if (f === 'watched') return isWatched(v);
    if (f === 'fav') return v.favorite;
    return true;
  }
  function visible() {
    const q = query.trim().toLowerCase();
    return S.videos.filter(v =>
      inFilter(v, S.filter) &&
      (!S.cat || v.category === S.cat) &&
      (!q || (displayTitle(v) + ' ' + (v.title || '') + ' ' + (v.author || '') + ' ' + v.category).toLowerCase().includes(q))
    );
  }
  function sorted(list) {
    const l = [...list];
    const by = {
      newest: (a, b) => b.addedAt.localeCompare(a.addedAt),
      oldest: (a, b) => a.addedAt.localeCompare(b.addedAt),
      title: (a, b) => displayTitle(a).localeCompare(displayTitle(b), undefined, { sensitivity: 'base' }),
      category: (a, b) => CAT_NAMES.indexOf(a.category) - CAT_NAMES.indexOf(b.category) || b.addedAt.localeCompare(a.addedAt),
      lastwatched: (a, b) => (lastWatch(b) || '').localeCompare(lastWatch(a) || ''),
      rewatched: (a, b) => (b.watches.length - a.watches.length) || (lastWatch(b) || '').localeCompare(lastWatch(a) || '')
    }[S.sort] || ((a, b) => b.addedAt.localeCompare(a.addedAt));
    if (S.filter === 'bin') return l.sort((a, b) => b.deletedAt.localeCompare(a.deletedAt));
    return l.sort(by);
  }
  function groupKey(v) {
    if (S.filter === 'bin') return null;
    if (S.sort === 'newest' || S.sort === 'oldest') return { key: dayKey(v.addedAt), label: dayLabel(v.addedAt) };
    if (S.sort === 'category') return { key: v.category, label: v.category };
    return null;
  }

  /* ---------- rendering ---------- */
  function thumbHtml(v) {
    const inner = v.thumb
      ? `<img src="${esc(v.thumb)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="__thumbErr(this)">`
      : `<div class="ph">${icon('play')}</div>`;
    const n = v.watches.length;
    return `<a class="thumb" href="${esc(v.url)}" target="_blank" rel="noopener noreferrer" aria-label="Open on ${platformName(v.platform)}">
      ${inner}
      <span class="pill left">${platformName(v.platform)}</span>
      ${n > 1 ? `<span class="pill right" title="Watched ${n} times">${icon('rotate')} ${n - 1}</span>` : ''}
    </a>`;
  }

  function watchInfo(v) {
    if (!isWatched(v)) return '';
    const n = v.watches.length;
    const head = `Watched ${fmtDateTime(lastWatch(v))}${n > 1 ? ` · ${n - 1} rewatch${n > 2 ? 'es' : ''}` : ''}`;
    if (n === 1) return `<div class="watchinfo">${esc(head)}</div>`;
    const rows = [...v.watches].reverse().map(w => `<li>${esc(fmtDateTime(w))}</li>`).join('');
    return `<div class="watchinfo">${esc(head)}<details><summary>History</summary><ol reversed>${rows}</ol></details></div>`;
  }

  function catSelect(v) {
    return `<select class="select cat-select" data-act="cat" aria-label="Category">${CAT_NAMES.map(c => `<option${c === v.category ? ' selected' : ''}>${esc(c)}</option>`).join('')}</select>`;
  }

  function itemHtml(v) {
    const bin = isDeleted(v);
    const watched = isWatched(v);
    const meta = [v.author ? '@' + v.author : '', 'Added ' + fmtDate(v.addedAt)].filter(Boolean).join(' · ');
    const actions = bin
      ? `<span class="expires">Deletes in ${daysLeft(v)} day${daysLeft(v) === 1 ? '' : 's'}</span><span class="spacer"></span>
         <button class="btn btn-outline btn-sm" data-act="restore" type="button">${icon('undo')}Restore</button>
         <button class="btn btn-ghost btn-sm btn-icon btn-danger" data-act="purge" type="button" aria-label="Delete forever" title="Delete forever">${icon('trash')}</button>`
      : `<button class="btn btn-ghost btn-sm btn-icon ${v.favorite ? 'on' : ''}" data-act="fav" type="button" aria-pressed="${v.favorite}" aria-label="Favorite" title="${v.favorite ? 'Unfavorite' : 'Favorite — remind me to rewatch'}">${icon('star')}</button>
         ${watched ? `<button class="btn btn-ghost btn-sm" data-act="rewatch" type="button" title="Log another watch now">${icon('rotate')}Rewatched</button>` : ''}
         <span class="spacer"></span>
         <button class="btn btn-ghost btn-sm btn-icon" data-act="rename" type="button" aria-label="Rename" title="Rename">${icon('pencil')}</button>
         <button class="btn btn-ghost btn-sm btn-icon" data-act="del" type="button" aria-label="Delete" title="Move to Recently deleted">${icon('trash')}</button>`;
    return `<article class="card item ${watched ? 'is-watched' : ''}" data-id="${esc(v.id)}">
      ${thumbHtml(v)}
      <div class="body">
        <div class="top">
          ${bin ? '' : `<label class="check" title="Mark watched"><input type="checkbox" data-act="watch" ${watched ? 'checked' : ''} aria-label="Watched"></label>`}
          <a class="title" href="${esc(v.url)}" target="_blank" rel="noopener noreferrer">${esc(displayTitle(v))}</a>
        </div>
        <div class="meta">${esc(meta)}</div>
        <div>${bin ? `<span class="badge">${esc(v.category)}</span>` : catSelect(v)}</div>
        ${watchInfo(v)}
        <div class="actions">${actions}</div>
      </div>
    </article>`;
  }

  function emptyHtml() {
    if (!S.videos.length) return `<div class="empty"><b>Your list is empty</b>Paste a TikTok or Instagram link above to start.</div>`;
    const msg = {
      todo: ['All caught up', 'Nothing left to watch here.'],
      watched: ['Nothing watched yet', 'Tick the box on a video once you’ve seen it.'],
      fav: ['No favorites yet', 'Tap the star on a video you’ll want to watch again.'],
      bin: ['Recently deleted is empty', `Deleted videos stay here for ${BIN_DAYS} days.`],
      all: ['No videos', '']
    }[S.filter];
    const extra = (query || S.cat) ? ' Try clearing the search or category.' : '';
    return `<div class="empty"><b>${msg[0]}</b>${msg[1]}${extra}</div>`;
  }

  let renderPending = false;
  function scheduleRender() { if (!renderPending) { renderPending = true; requestAnimationFrame(() => { renderPending = false; render(); }); } }

  function render() {
    // counts
    const counts = { todo: 0, watched: 0, fav: 0, all: 0, bin: 0 };
    for (const v of S.videos) for (const f in counts) if (inFilter(v, f)) counts[f]++;
    document.querySelectorAll('#tabs [data-filter]').forEach(b => {
      b.classList.toggle('active', b.dataset.filter === S.filter);
      b.querySelector('.count').textContent = counts[b.dataset.filter] || '';
    });
    const live = counts.all;
    $('#summary').textContent = live
      ? `${counts.todo} to watch · ${counts.watched} watched · ${S.videos.reduce((a, v) => a + (isDeleted(v) ? 0 : Math.max(0, v.watches.length - 1)), 0)} rewatches`
      : 'TikTok & Instagram videos to get to.';

    // category select (only categories in use, plus current)
    const used = CAT_NAMES.filter(c => S.videos.some(v => !isDeleted(v) && v.category === c) || c === S.cat);
    $('#cat').innerHTML = `<option value="">All categories</option>` + used.map(c => `<option${c === S.cat ? ' selected' : ''}>${esc(c)}</option>`).join('');
    $('#sort').value = S.sort;
    $('#sort').disabled = S.filter === 'bin';
    document.querySelectorAll('[data-view]').forEach(b => b.classList.toggle('active', b.dataset.view === S.view));

    // favorites reminder
    const favs = S.videos.filter(v => !isDeleted(v) && v.favorite);
    $('#favBanner').innerHTML = favs.length && S.filter !== 'fav' && S.filter !== 'bin'
      ? `<div class="banner">${icon('star')}<span><b>${favs.length} favorite${favs.length > 1 ? 's' : ''}</b> to watch again.</span>
         <button class="btn btn-outline btn-sm" type="button" data-go="fav">Show</button>
         <button class="btn btn-primary btn-sm" type="button" data-go="favshuffle">Pick one</button></div>`
      : '';

    // items
    const list = sorted(visible());
    const out = $('#out');
    if (!list.length) { out.innerHTML = emptyHtml(); return; }
    const cls = `items ${S.view === 'list' ? 'list' : 'grid'}`;
    let html = '', open = false, last = null;
    for (const v of list) {
      const g = groupKey(v);
      if (g && g.key !== last) {
        if (open) html += '</div>';
        const n = list.filter(x => groupKey(x).key === g.key).length;
        html += `<div class="section-head">${esc(g.label)} <small>${n}</small></div><div class="${cls}">`;
        open = true; last = g.key;
      } else if (!g && !open) { html += `<div class="${cls}">`; open = true; }
      html += itemHtml(v);
    }
    if (open) html += '</div>';
    out.innerHTML = html;
  }

  /* ---------- shuffle ---------- */
  let lastPick = null;
  function shufflePool() {
    const base = S.videos.filter(v => !isDeleted(v) && (!S.cat || v.category === S.cat));
    if (S.pool === 'fav') {
      // Favorites: lean toward the ones you haven't seen in the longest time.
      return base.filter(v => v.favorite);
    }
    if (S.pool === 'todo') return base.filter(v => !isWatched(v));
    return base;
  }
  function pickRandom() {
    let pool = shufflePool();
    if (pool.length > 1 && lastPick) pool = pool.filter(v => v.id !== lastPick);
    if (!pool.length) return null;
    if (S.pool === 'fav') {
      // weight by days since last watch (min 1), so long-unseen favorites come up more
      const w = pool.map(v => 1 + (Date.now() - Date.parse(lastWatch(v) || v.addedAt)) / DAY);
      let r = Math.random() * w.reduce((a, b) => a + b, 0);
      for (let i = 0; i < pool.length; i++) { r -= w[i]; if (r <= 0) return pool[i]; }
      return pool[pool.length - 1];
    }
    return pool[Math.floor(Math.random() * pool.length)];
  }
  function renderPick() {
    document.querySelectorAll('[data-pool]').forEach(b => b.classList.toggle('active', b.dataset.pool === S.pool));
    const v = lastPick && byId(lastPick);
    const box = $('#pick');
    if (!v) {
      const what = { todo: 'unwatched videos', fav: 'favorites', any: 'videos' }[S.pool];
      box.innerHTML = `<div class="empty"><b>No ${what}${S.cat ? ' in ' + esc(S.cat) : ''}</b>Try another pool above.</div>`;
      return;
    }
    const watched = isWatched(v);
    box.innerHTML = `<div class="pick" data-id="${esc(v.id)}">
      ${thumbHtml(v)}
      <a class="title" href="${esc(v.url)}" target="_blank" rel="noopener noreferrer">${esc(displayTitle(v))}</a>
      <div class="meta">${esc([v.category, v.author ? '@' + v.author : '', watched ? `Last watched ${fmtDate(lastWatch(v))}` : 'Not watched yet'].filter(Boolean).join(' · '))}</div>
      <div class="pick-actions">
        <a class="btn btn-primary" href="${esc(v.url)}" target="_blank" rel="noopener noreferrer" data-act="open-log">${icon('external')}Watch now</a>
        <button class="btn btn-outline" type="button" data-act="reshuffle">${icon('shuffle')}Another</button>
      </div>
    </div>`;
  }
  function openShuffle(pool) {
    if (pool) { S.pool = pool; save(); }
    lastPick = (pickRandom() || {}).id || null;
    renderPick();
    const d = $('#shuffleDlg');
    if (!d.open) d.showModal();
  }

  /* ---------- actions ---------- */
  function setWatched(v, on) {
    if (on) { v.watches.push(now()); toast('Marked watched'); }
    else if (v.watches.length > 1) {
      if (!confirm(`Clear all ${v.watches.length} watch records for this video?`)) return false;
      v.watches = [];
    } else v.watches = [];
    return true;
  }

  let toastTimer;
  function toast(msg, undo) {
    const t = $('#toast');
    t.innerHTML = `<span>${esc(msg)}</span>${undo ? '<button type="button">Undo</button>' : ''}`;
    t.hidden = false;
    if (undo) t.querySelector('button').onclick = () => { undo(); t.hidden = true; };
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.hidden = true; }, undo ? 6000 : 2600);
  }

  document.addEventListener('click', e => {
    const tab = e.target.closest('[data-filter]');
    if (tab) { S.filter = tab.dataset.filter; save(); return render(); }
    const view = e.target.closest('[data-view]');
    if (view) { S.view = view.dataset.view; save(); return render(); }
    const go = e.target.closest('[data-go]');
    if (go) {
      if (go.dataset.go === 'fav') { S.filter = 'fav'; save(); return render(); }
      return openShuffle('fav');
    }
    const pool = e.target.closest('[data-pool]');
    if (pool) { S.pool = pool.dataset.pool; save(); lastPick = null; lastPick = (pickRandom() || {}).id || null; return renderPick(); }
    if (e.target.closest('[data-close]')) return $('#shuffleDlg').close();

    const menuBtn = e.target.closest('#menuBtn');
    const panel = $('#menuPanel');
    if (menuBtn) { panel.hidden = !panel.hidden; return; }
    if (!e.target.closest('#menuPanel')) panel.hidden = true;
    const m = e.target.closest('[data-menu]');
    if (m) { panel.hidden = true; return menuAction(m.dataset.menu); }

    const act = e.target.closest('[data-act]');
    if (!act || act.tagName === 'SELECT' || act.type === 'checkbox') return;
    const host = act.closest('[data-id]');
    const v = host && byId(host.dataset.id);
    const a = act.dataset.act;
    if (a === 'reshuffle') { lastPick = (pickRandom() || {}).id || null; return renderPick(); }
    if (!v) return;
    if (a === 'open-log') {
      // Opening from shuffle counts as a watch (first watch or a rewatch).
      v.watches.push(now()); save(); render();
      toast(v.watches.length > 1 ? 'Logged a rewatch' : 'Marked watched', () => { v.watches.pop(); save(); render(); });
      setTimeout(() => $('#shuffleDlg').close(), 150);
      return; // let the link open
    }
    if (a === 'fav') { v.favorite = !v.favorite; save(); render(); return; }
    if (a === 'rewatch') {
      v.watches.push(now()); save(); render();
      toast(`Rewatch logged (${v.watches.length - 1} total)`, () => { v.watches.pop(); save(); render(); });
      return;
    }
    if (a === 'rename') {
      const t = prompt('Title', displayTitle(v));
      if (t === null) return;
      v.title = t.trim(); v.titleManual = !!v.title;
      if (!v.categoryManual) v.category = categorize(v.title);
      save(); render(); return;
    }
    if (a === 'del') {
      v.deletedAt = now(); save(); render();
      toast('Moved to Recently deleted', () => { v.deletedAt = null; save(); render(); });
      return;
    }
    if (a === 'restore') { v.deletedAt = null; save(); render(); toast('Restored'); return; }
    if (a === 'purge') {
      if (!confirm('Delete this video forever? This can’t be undone.')) return;
      S.videos = S.videos.filter(x => x !== v); S.purged.push(v.id); save(); render(); return;
    }
  });

  document.addEventListener('change', e => {
    const el = e.target.closest('[data-act]');
    if (!el) return;
    const v = byId(el.closest('[data-id]')?.dataset.id);
    if (!v) return;
    if (el.dataset.act === 'watch') {
      if (!setWatched(v, el.checked)) el.checked = true;
      save(); render();
    } else if (el.dataset.act === 'cat') {
      v.category = el.value; v.categoryManual = true; save(); render();
    }
  });

  $('#q').addEventListener('input', e => { query = e.target.value; render(); });
  $('#cat').addEventListener('change', e => { S.cat = e.target.value; save(); render(); });
  $('#sort').addEventListener('change', e => { S.sort = e.target.value; save(); render(); });
  $('#shuffleBtn').addEventListener('click', () => openShuffle());
  $('#shuffleDlg').addEventListener('click', e => { if (e.target === e.currentTarget) e.currentTarget.close(); });

  const addInput = $('#addInput');
  const grow = () => { addInput.style.height = 'auto'; addInput.style.height = Math.min(addInput.scrollHeight, 160) + 'px'; };
  addInput.addEventListener('input', grow);
  addInput.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); $('#addForm').requestSubmit(); } });
  $('#addForm').addEventListener('submit', e => {
    e.preventDefault();
    const links = extractLinks(addInput.value);
    if (!links.length) return toast('No links found — paste a TikTok or Instagram URL');
    const n = addLinks(links);
    addInput.value = ''; grow();
    if (n && S.filter !== 'todo' && S.filter !== 'all') { S.filter = 'todo'; save(); render(); }
  });

  /* ---------- export / import ---------- */
  function menuAction(a) {
    if (a === 'export') {
      const data = { app: 'watchlater', version: 1, exportedAt: now(), videos: S.videos, purged: S.purged };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const link = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `watchlater-backup-${now().slice(0, 10)}.json` });
      document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(link.href), 1000);
      toast(`Exported ${S.videos.length} videos`);
    } else if (a === 'import') {
      $('#importFile').click();
    } else if (a === 'refresh') {
      S.videos.filter(v => !isDeleted(v)).forEach(v => queueMeta(v, true));
      toast('Refreshing titles and thumbnails…');
    }
  }

  // Accepts: a backup file, a plain array of URLs, or an array of {url, title?, category?, addedAt?, favorite?, watches?}
  function importData(data, { quiet = false } = {}) {
    const rows = Array.isArray(data) ? data : (data && Array.isArray(data.videos) ? data.videos : null);
    if (!rows) { if (!quiet) toast('That file isn’t a Watch Later backup'); return 0; }
    if (data.purged && Array.isArray(data.purged)) S.purged = [...new Set([...S.purged, ...data.purged])];
    let added = 0, merged = 0;
    for (const row of rows) {
      const url = typeof row === 'string' ? row : row && row.url;
      const link = url && parseLink(url);
      if (!link) continue;
      const id = (row && row.id) || link.id;
      if (quiet && S.purged.includes(id)) continue; // seeded links you deleted forever stay deleted
      const ex = byId(id);
      if (!ex) {
        const v = typeof row === 'object' ? Object.assign(makeVideo(link, row), pick(row)) : makeVideo(link);
        v.id = id;
        S.videos.push(v); added++;
        queueMeta(v);
      } else if (typeof row === 'object' && !quiet) {
        // merge: union of watch history, keep favorites, prefer imported manual edits
        const w = new Set([...(ex.watches || []), ...(row.watches || [])]);
        ex.watches = [...w].sort();
        ex.favorite = ex.favorite || !!row.favorite;
        if (row.titleManual) { ex.title = row.title; ex.titleManual = true; }
        if (row.categoryManual) { ex.category = row.category; ex.categoryManual = true; }
        if (!ex.thumb && row.thumb) ex.thumb = row.thumb;
        if ('deletedAt' in row) ex.deletedAt = row.deletedAt;
        merged++;
      }
    }
    purgeBin(); save(); render();
    if (!quiet) toast(`Imported: ${added} new, ${merged} merged`);
    return added;
  }
  const FIELDS = ['title', 'author', 'thumb', 'category', 'categoryManual', 'titleManual', 'addedAt', 'favorite', 'watches', 'deletedAt', 'metaAt', 'kind'];
  const pick = row => Object.fromEntries(FIELDS.filter(k => k in row && row[k] !== undefined).map(k => [k, row[k]]));

  $('#importFile').addEventListener('change', async e => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    try { importData(JSON.parse(await f.text())); } catch (err) { toast('Could not read that file — is it valid JSON?'); }
  });

  /* ---------- boot ---------- */
  purgeBin();
  render();
  S.videos.filter(v => !isDeleted(v) && !v.metaAt).forEach(v => queueMeta(v));
  // data/videos.json is an optional seed list you can edit in the repo; new links in it get merged in.
  fetch('data/videos.json', { cache: 'no-cache' })
    .then(r => r.ok ? r.json() : null)
    .then(d => { if (d) { const n = importData(d, { quiet: true }); if (n) toast(`Added ${n} from videos.json`); } })
    .catch(() => {});
})();
