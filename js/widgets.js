/**
 * Live dev widgets, rendered above the link grid:
 *  - Greeting + rotating dev quote
 *  - GitHub contribution graph (public API, no token needed)
 *  - Hacker News top stories
 * Configured in Settings → Widgets ('sp-widgets').
 */
const Widgets = (function () {
  let ghCache = null; // { user, data }
  let hnCache = null; // [stories]
  let sysTimer = null; // setInterval id for the system-stats poller
  let cpuPrev = null;  // { total, idle } cumulative counters from the last CPU sample
  let cpuName = '';    // processor model, fetched once

  // chrome.system.* is only available inside the packaged Chrome extension,
  // never on a plain file://  or http:// page. Every system-stats path is
  // gated on this so the app degrades cleanly when run as a normal webpage.
  function hasSystemApi() {
    return typeof chrome !== 'undefined' && chrome.system &&
           chrome.system.cpu && chrome.system.memory;
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

  // ── Greeting ───────────────────────────────────────────────────────────────
  function buildGreeting() {
    const card = el('div', 'dw-card');
    const h = new Date().getHours();
    const greet = h < 5 ? 'Late night hacking?' :
                  h < 12 ? 'Good morning' :
                  h < 18 ? 'Good afternoon' : 'Good evening';
    // display name first, GitHub username as fallback
    const wSet = SettingsStore.getWidgets();
    const user = ((wSet.displayName || '').trim() || (wSet.githubUser || '').trim());
    const who = user && h >= 5 ? ', ' + esc(user) : '';
    const date = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 864e5);
    const quote = QUOTES[dayOfYear % QUOTES.length];
    card.innerHTML = `
      <div class="dw-greet-wrap">
        <div class="dw-greet-text">
          <div class="dw-title">${esc(date)}</div>
          <div class="dw-greet-line">${esc(greet)}${who}</div>
          <div class="dw-greet-sub">${esc(quote)}</div>
        </div>
        <div id="mini-clock-slot"></div>
      </div>`;
    // NOTE: the mini clock is mounted by the caller AFTER the card is in the
    // DOM. Mounting here (before append) makes tickOnce() drop it from the
    // registry — document.contains() is false — so it never renders.
    return card;
  }

  // ── GitHub contributions ───────────────────────────────────────────────────
  function buildGithub(user) {
    const card = el('div', 'dw-card');
    card.innerHTML = `<div class="dw-title">GitHub · ${esc(user)}</div><div class="dw-loading">Loading contributions…</div>`;

    const render = (data) => {
      const contribs = (data.contributions || []).slice(-7 * 26); // ~ last 6 months
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

    if (ghCache && ghCache.user === user) {
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

  // ── Hacker News top stories ────────────────────────────────────────────────
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

    if (hnCache) {
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

  // ── System stats (CPU / RAM) — extension only ──────────────────────────────
  // Uses chrome.system.cpu / chrome.system.memory (declared in manifest.json).
  // CPU load is a delta between two cumulative samples, so the first reading
  // appears one poll after mount; RAM is available immediately.
  const GiB = 1073741824;
  const fmtGiB = (b) => (b / GiB).toFixed(1);

  function setBar(card, which, pct, label) {
    const bar = card.querySelector('#dw-' + which + '-bar');
    const val = card.querySelector('#dw-' + which + '-val');
    if (bar) {
      bar.style.width = Math.round(pct) + '%';
      bar.style.background = pct >= 85 ? '#ef4444' : pct >= 60 ? '#f59e0b' : 'var(--accent1)';
    }
    if (val) val.textContent = label;
  }

  function buildSystemStats() {
    const card = el('div', 'dw-card dw-sys');
    card.innerHTML = `
      <div class="dw-title">System</div>
      <div class="dw-sys-row">
        <span class="dw-sys-label">CPU</span>
        <span class="dw-sys-bar"><i id="dw-cpu-bar"></i></span>
        <span class="dw-sys-val" id="dw-cpu-val">…</span>
      </div>
      <div class="dw-sys-row">
        <span class="dw-sys-label">RAM</span>
        <span class="dw-sys-bar"><i id="dw-ram-bar"></i></span>
        <span class="dw-sys-val" id="dw-ram-val">…</span>
      </div>
      <div class="dw-greet-sub" id="dw-sys-sub"></div>`;

    const sample = () => {
      // Stop polling once the card leaves the DOM (a re-mount replaces it).
      if (!document.contains(card)) { clearInterval(sysTimer); sysTimer = null; return; }
      chrome.system.cpu.getInfo((info) => {
        let total = 0, idle = 0;
        (info.processors || []).forEach((p) => {
          if (p && p.usage) { total += p.usage.total; idle += p.usage.idle; }
        });
        if (cpuPrev) {
          const dt = total - cpuPrev.total;
          const di = idle - cpuPrev.idle;
          const load = dt > 0 ? (1 - di / dt) * 100 : 0;
          setBar(card, 'cpu', Math.max(0, Math.min(100, load)), Math.round(load) + '%');
        }
        cpuPrev = { total, idle };
      });
      chrome.system.memory.getInfo((mem) => {
        const used = mem.capacity - mem.availableCapacity;
        const pct = mem.capacity ? (used / mem.capacity) * 100 : 0;
        setBar(card, 'ram', pct, Math.round(pct) + '%');
        const sub = card.querySelector('#dw-sys-sub');
        if (sub) {
          sub.textContent = `${fmtGiB(used)} / ${fmtGiB(mem.capacity)} GiB` +
                            (cpuName ? ' · ' + cpuName : '');
        }
      });
    };

    // Grab the CPU model once for the caption.
    chrome.system.cpu.getInfo((info) => {
      cpuName = ((info.modelName || '').split('@')[0].trim()) || info.archName || '';
    });
    cpuPrev = null; // reset the delta baseline for this fresh card
    // Seed after the caller appends the card — sample() bails while the card
    // is still detached (its document.contains guard), so run it next tick.
    setTimeout(sample, 0); // seeds cpuPrev + paints RAM
    clearInterval(sysTimer);
    sysTimer = setInterval(sample, 1500);
    return card;
  }

  // ── Mount into the help overlay ────────────────────────────────────────────
  function mount(clearCache) {
    if (clearCache) { ghCache = null; hnCache = null; }
    if (sysTimer) { clearInterval(sysTimer); sysTimer = null; } // kill any old poller
    const help = document.getElementById('help');
    if (!help) return;
    const existing = document.getElementById('dev-widgets');
    if (existing) existing.remove();

    const w = SettingsStore.getWidgets();
    const showGh = w.github && w.githubUser;
    const showSys = w.sysstats && hasSystemApi();
    if (!w.greeting && !showGh && !w.hn && !showSys) return;

    const bar = el('div');
    bar.id = 'dev-widgets';
    const wrapper = help.querySelector('.categories-wrapper');
    help.insertBefore(bar, wrapper || null);

    if (w.greeting) {
      const greetCard = buildGreeting();
      bar.appendChild(greetCard);
      // Mount only once the card is attached, so the clock survives tickOnce's
      // document.contains() filter and actually paints.
      if (typeof FlipClock !== 'undefined') {
        FlipClock.mountMini(greetCard.querySelector('#mini-clock-slot'));
      }
    }
    if (showSys) bar.appendChild(buildSystemStats());
    if (showGh) bar.appendChild(buildGithub(w.githubUser.trim()));
    if (w.hn) bar.appendChild(buildHN());
  }

  return { mount, hasSystemApi };
})();
