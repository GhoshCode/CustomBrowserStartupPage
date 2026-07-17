/**
 * Live dev widgets.
 *  Header bar (full width): greeting + dev quote · integrated search bar ·
 *    live status chips (CPU/RAM via chrome.system, GitHub repo status, CVE alerts) ·
 *    mini clock dock slot
 *  Widget row below: GitHub contribution graph, Hacker News top stories
 * Configured in Settings → Widgets ('sp-widgets').
 *
 * Notes:
 *  - CPU/RAM needs the chrome.system.* extension APIs — the chip hides itself
 *    when the page isn't running as a Chrome extension.
 *  - Git chip reads public repo data from the GitHub API (no token needed).
 *  - CVE chip shows the latest critical advisories from the GitHub Advisory DB.
 */
const Widgets = (function () {
  let ghCache = null;   // { user, data }
  let hnCache = null;   // [stories]
  let gitCache = null;  // { repo, data, at }
  let cveCache = null;  // { list, at }
  let sysTimer = null;
  let bgCache = null;   // cache written by background.js (extension only)

  const isExt = typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local &&
                chrome.runtime && chrome.runtime.id;

  // Mirror UI settings to the service worker + nudge a refresh when stale
  function syncBackground(w) {
    if (!isExt) return;
    chrome.storage.local.set({
      cfg: { repo: (w.repo || '').trim(), pat: (w.pat || '').trim(), githubUser: (w.githubUser || '').trim() },
    });
    const stale = !bgCache || (Date.now() - (bgCache.fetchedAt || 0)) > 12 * 60 * 1000;
    if (stale && chrome.runtime.sendMessage) {
      try { chrome.runtime.sendMessage({ type: 'devtab-refresh' }, () => chrome.runtime.lastError); } catch {}
    }
  }

  const QUOTES = [
    'Talk is cheap. Show me the code. — Linus Torvalds',
    'Programs must be written for people to read. — Harold Abelson',
    'Simplicity is the soul of efficiency. — Austin Freeman',
    'First, solve the problem. Then, write the code. — John Johnson',
    'Make it work, make it right, make it fast. — Kent Beck',
    'Code is like humor. When you have to explain it, it’s bad. — Cory House',
    'The best error message is the one that never shows up. — Thomas Fuchs',
    'Deleted code is debugged code. — Jeff Sickel',
    'Weeks of coding can save you hours of planning. — Unknown',
    'It works on my machine. — Everyone, at some point',
  ];

  function el(tag, cls, html) {
    const d = document.createElement(tag);
    if (cls) d.className = cls;
    if (html !== undefined) d.innerHTML = html;
    return d;
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }

  function timeAgo(iso) {
    const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
    if (s < 3600) return Math.max(1, Math.round(s / 60)) + 'm ago';
    if (s < 86400) return Math.round(s / 3600) + 'h ago';
    return Math.round(s / 86400) + 'd ago';
  }

  // ── Header: greeting text ──────────────────────────────────────────────────
  function buildGreetText() {
    const h = new Date().getHours();
    const greet = h < 5 ? 'Late night hacking?' :
                  h < 12 ? 'Good morning' :
                  h < 18 ? 'Good afternoon' : 'Good evening';
    const user = (SettingsStore.getWidgets().githubUser || '').trim();
    const who = user && h >= 5 ? ', ' + esc(user) : '';
    const date = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 864e5);
    const quote = QUOTES[dayOfYear % QUOTES.length];
    return el('div', 'dw-greet-text', `
      <div class="dw-title">${esc(date)}</div>
      <div class="dw-greet-line">${esc(greet)}${who}</div>
      <div class="dw-greet-sub">${esc(quote)}</div>`);
  }

  // ── Header: integrated search bar ──────────────────────────────────────────
  function buildSearch() {
    const wrap = el('div', 'dw-search');
    wrap.innerHTML = '<span class="dw-search-icon">⌕</span>';
    const input = el('input', 'dw-search-input');
    input.type = 'text';
    input.placeholder = 'Search GitHub, Stack Overflow, Docs…  (try g: query)';
    input.spellcheck = false;
    input.autocomplete = 'off';
    input.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key !== 'Enter') return;
      const q = input.value.trim();
      if (!q) return;
      let redirect;
      try {
        redirect = (typeof queryParser !== 'undefined') ? queryParser.parse(q).redirect : null;
      } catch { redirect = null; }
      if (!redirect) redirect = 'https://www.google.com/search?q=' + encodeURIComponent(q);
      if (CONFIG.newTab || e.ctrlKey || e.metaKey) window.open(redirect, '_blank');
      else window.location.href = redirect;
    });
    wrap.appendChild(input);
    return wrap;
  }

  // ── Header: status chips ───────────────────────────────────────────────────
  function buildSystemChip() {
    const hasApi = typeof chrome !== 'undefined' && chrome.system && chrome.system.cpu && chrome.system.memory;
    if (!hasApi) return null; // only real data — no fake numbers
    const chip = el('div', 'dw-chip');
    chip.innerHTML = '🖥 CPU: <b class="dw-chip-val" id="dw-cpu">–%</b> · RAM: <b class="dw-chip-val" id="dw-ram">–%</b>';
    chip.title = 'Live CPU load & memory usage';

    let last = null;
    const sample = () => {
      if (!document.contains(chip)) { clearInterval(sysTimer); sysTimer = null; return; }
      chrome.system.cpu.getInfo(info => {
        let idle = 0, total = 0;
        info.processors.forEach(p => { idle += p.usage.idle; total += p.usage.total; });
        if (last) {
          const dt = total - last.total;
          const di = idle - last.idle;
          const load = dt > 0 ? Math.round(100 * (1 - di / dt)) : 0;
          const c = chip.querySelector('#dw-cpu');
          if (c) c.textContent = load + '%';
        }
        last = { idle, total };
      });
      chrome.system.memory.getInfo(m => {
        const r = chip.querySelector('#dw-ram');
        if (r) r.textContent = Math.round(100 * (1 - m.availableCapacity / m.capacity)) + '%';
      });
    };
    if (sysTimer) clearInterval(sysTimer);
    sample();
    sysTimer = setInterval(sample, 4000);
    return chip;
  }

  function buildGitChip(repo) {
    const chip = el('a', 'dw-chip dw-chip-link');
    chip.innerHTML = `⎇ ${esc(repo)} · <b class="dw-chip-val">…</b>`;
    chip.href = 'https://github.com/' + repo;
    chip.title = 'Repository status (GitHub API)';

    const render = (d, openPRs) => {
      const prs = openPRs !== undefined ? ` · <b class="dw-chip-val">${openPRs}</b> PRs` : '';
      chip.innerHTML = `⎇ ${esc(repo.split('/')[1] || repo)} · <b class="dw-chip-val">${esc(d.default_branch)}</b> · pushed ${timeAgo(d.pushed_at)} · <b class="dw-chip-val">${d.open_issues_count}</b> open${prs}`;
      chip.href = d.html_url;
    };

    if (bgCache && bgCache.repo && (bgCache.repo.full_name || '').toLowerCase() === repo.toLowerCase()) {
      render(bgCache.repo, bgCache.openPRs);
    } else if (gitCache && gitCache.repo === repo && Date.now() - gitCache.at < 3e5) {
      render(gitCache.data);
    } else {
      fetch('https://api.github.com/repos/' + repo)
        .then(r => { if (!r.ok) throw 0; return r.json(); })
        .then(d => { gitCache = { repo, data: d, at: Date.now() }; render(d); })
        .catch(() => { chip.innerHTML = `⎇ ${esc(repo)} · <b class="dw-chip-val">not found</b>`; });
    }
    return chip;
  }

  function buildCveChip() {
    const chip = el('a', 'dw-chip dw-chip-cve');
    chip.innerHTML = '🛡 CVE Alert: <b class="dw-chip-val">loading…</b>';
    chip.title = 'Latest critical security advisories (GitHub Advisory DB)';
    chip.href = 'https://github.com/advisories?query=severity%3Acritical';

    let idx = 0;
    const render = (list) => {
      if (!list.length) { chip.innerHTML = '🛡 CVE Alert: <b class="dw-chip-val">none</b>'; return; }
      const a = list[idx % list.length];
      chip.innerHTML = `🛡 CVE: <b class="dw-chip-val">${esc(a.cve_id || a.ghsa_id)}</b> · CRITICAL`;
      chip.title = a.summary || '';
      chip.href = a.html_url;
    };

    const rotate = (list) => {
      render(list);
      const t = setInterval(() => {
        if (!document.contains(chip)) { clearInterval(t); return; }
        idx++;
        render(list);
      }, 8000);
    };

    if (bgCache && Array.isArray(bgCache.cve)) {
      rotate(bgCache.cve);
    } else if (cveCache && Date.now() - cveCache.at < 9e5) {
      rotate(cveCache.list);
    } else {
      fetch('https://api.github.com/advisories?severity=critical&per_page=5')
        .then(r => { if (!r.ok) throw 0; return r.json(); })
        .then(list => { cveCache = { list, at: Date.now() }; rotate(list); })
        .catch(() => { chip.innerHTML = '🛡 CVE Alert: <b class="dw-chip-val">unavailable</b>'; });
    }
    return chip;
  }

  // ── Header card ────────────────────────────────────────────────────────────
  function buildHeader(w) {
    const card = el('div', 'dw-card dw-header');

    if (w.greeting) card.appendChild(buildGreetText());
    if (w.search) card.appendChild(buildSearch());

    const right = el('div', 'dw-header-right');
    const slot = el('div');
    slot.id = 'mini-clock-slot';
    right.appendChild(slot);

    const chips = el('div', 'dw-chips');
    if (w.system) {
      const sys = buildSystemChip();
      if (sys) chips.appendChild(sys);
    }
    if (w.git && (w.repo || '').includes('/')) chips.appendChild(buildGitChip(w.repo.trim()));
    if (w.cve) chips.appendChild(buildCveChip());
    if (chips.children.length) right.appendChild(chips);

    card.appendChild(right);

    if (typeof FlipClock !== 'undefined') FlipClock.mountMini(slot);
    return card;
  }

  // ── GitHub contributions card ──────────────────────────────────────────────
  function buildGithub(user) {
    const card = el('div', 'dw-card');
    card.innerHTML = `<div class="dw-title">GitHub · ${esc(user)}</div><div class="dw-loading">Loading contributions…</div>`;

    const render = (data) => {
      const contribs = (data.contributions || []).slice(-7 * 26);
      let total = contribs.reduce((s, c) => s + c.count, 0);
      if (data.total && data.total.lastYear !== undefined) total = data.total.lastYear;
      const grid = el('div', 'dw-gh-grid');
      contribs.forEach(c => {
        const cell = el('div', 'dw-gh-cell');
        if (c.level > 0) {
          cell.style.background = 'var(--accent1)';
          cell.style.opacity = (0.25 + c.level * 0.19).toFixed(2);
        }
        cell.title = `${c.date}: ${c.count} contribution${c.count === 1 ? '' : 's'}`;
        grid.appendChild(cell);
      });
      card.innerHTML = `<div class="dw-title">GitHub · ${esc(user)}</div>`;
      card.appendChild(grid);
      card.appendChild(el('div', 'dw-greet-sub', `${total} contributions in the last year`));
    };

    if (bgCache && bgCache.contrib && bgCache.contribUser === user) {
      render(bgCache.contrib);
    } else if (ghCache && ghCache.user === user) {
      render(ghCache.data);
    } else {
      fetch(`https://github-contributions-api.jogruber.de/v4/${encodeURIComponent(user)}?y=last`)
        .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(data => { ghCache = { user, data }; render(data); })
        .catch(() => {
          const l = card.querySelector('.dw-loading');
          if (l) l.textContent = `Couldn't load data for "${user}".`;
        });
    }
    return card;
  }

  // ── Hacker News card ───────────────────────────────────────────────────────
  function buildHN() {
    const card = el('div', 'dw-card');
    card.innerHTML = `<div class="dw-title">Hacker News · Top</div><div class="dw-loading">Loading stories…</div>`;

    const render = (stories) => {
      card.innerHTML = `<div class="dw-title">Hacker News · Top</div>`;
      stories.forEach(s => {
        const a = el('a', 'dw-hn-item');
        a.href = s.url || `https://news.ycombinator.com/item?id=${s.id}`;
        a.target = CONFIG.newTab ? '_blank' : '_self';
        a.innerHTML = `<span class="dw-hn-pts">▲${s.score || 0}</span>${esc(s.title || '')}`;
        card.appendChild(a);
      });
    };

    if (bgCache && Array.isArray(bgCache.hn) && bgCache.hn.length) {
      render(bgCache.hn);
    } else if (hnCache) {
      render(hnCache);
    } else {
      fetch('https://hacker-news.firebaseio.com/v0/topstories.json')
        .then(r => r.json())
        .then(ids => Promise.all(
          ids.slice(0, 5).map(id =>
            fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then(r => r.json())
          )
        ))
        .then(stories => { hnCache = stories.filter(Boolean); render(hnCache); })
        .catch(() => {
          const l = card.querySelector('.dw-loading');
          if (l) l.textContent = "Couldn't load stories.";
        });
    }
    return card;
  }

  // ── Mount ──────────────────────────────────────────────────────────────────
  function mount(clearCache) {
    if (isExt) {
      // read the service-worker cache first, then render (instant, no fetches)
      chrome.storage.local.get('devtabCache', (r) => {
        bgCache = (r && r.devtabCache) || null;
        if (clearCache) bgCache = null;
        mountNow(clearCache);
        syncBackground(SettingsStore.getWidgets());
      });
    } else {
      mountNow(clearCache);
    }
  }

  function mountNow(clearCache) {
    if (clearCache) { ghCache = null; hnCache = null; gitCache = null; cveCache = null; }
    const help = document.getElementById('help');
    if (!help) return;
    const existing = document.getElementById('dev-widgets');
    if (existing) existing.remove();

    const w = SettingsStore.getWidgets();
    const showGh = w.github && w.githubUser;
    const showHeader = w.greeting || w.search || w.system || w.cve || (w.git && w.repo);
    if (!showHeader && !showGh && !w.hn) return;

    const bar = el('div');
    bar.id = 'dev-widgets';
    const wrapper = help.querySelector('.categories-wrapper');
    help.insertBefore(bar, wrapper || null);

    if (showHeader) bar.appendChild(buildHeader(w));

    const hasRow = showGh || w.hn;
    if (hasRow) {
      const row = el('div', 'dw-row');
      if (showGh) row.appendChild(buildGithub(w.githubUser.trim()));
      if (w.hn) row.appendChild(buildHN());
      bar.appendChild(row);
    }

    // Tell the layout how much extra height the widget row occupies,
    // so category lists shrink and the page still fits one screen
    document.documentElement.style.setProperty('--dw-extra', hasRow ? '11rem' : '0rem');
  }

  return { mount };
})();
