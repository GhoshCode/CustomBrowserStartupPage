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
    const date = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 864e5);
    const quote = QUOTES[dayOfYear % QUOTES.length];
    card.innerHTML = `
      <div class="dw-title">${esc(date)}</div>
      <div class="dw-greet-line">${esc(greet)}</div>
      <div class="dw-greet-sub">${esc(quote)}</div>`;
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

  // ── Mount into the help overlay ────────────────────────────────────────────
  function mount(clearCache) {
    if (clearCache) { ghCache = null; hnCache = null; }
    const help = document.getElementById('help');
    if (!help) return;
    const existing = document.getElementById('dev-widgets');
    if (existing) existing.remove();

    const w = SettingsStore.getWidgets();
    const showGh = w.github && w.githubUser;
    if (!w.greeting && !showGh && !w.hn) return;

    const bar = el('div');
    bar.id = 'dev-widgets';
    const wrapper = help.querySelector('.categories-wrapper');
    help.insertBefore(bar, wrapper || null);

    if (w.greeting) bar.appendChild(buildGreeting());
    if (showGh) bar.appendChild(buildGithub(w.githubUser.trim()));
    if (w.hn) bar.appendChild(buildHN());
  }

  return { mount };
})();
