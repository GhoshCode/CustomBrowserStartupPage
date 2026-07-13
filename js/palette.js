/**
 * Command Palette (Ctrl/Cmd + K) + grid keyboard navigation.
 *  - Fuzzy search across all site links and quick actions
 *  - ↑↓ / Ctrl+n/p to navigate, Enter to open, Ctrl/Shift+Enter for new tab
 *  - When the link grid is visible: arrow keys move focus geometrically between links
 */
const Palette = (function () {
  let open = false;
  let items = [];
  let filtered = [];
  let sel = 0;
  let boxEl, inputEl, listEl, overlayEl;

  // ── Fuzzy matching (subsequence with streak + word-start bonus) ───────────
  function fuzzy(query, text) {
    const q = query.toLowerCase();
    const t = text.toLowerCase();
    if (!q.trim()) return { score: 0, marks: [] };
    let qi = 0, score = 0, streak = 0;
    const marks = [];
    for (let ti = 0; ti < t.length && qi < q.length; ti++) {
      if (t[ti] === q[qi]) {
        marks.push(ti);
        streak++;
        score += 2 + streak * 2 + (ti === 0 || t[ti - 1] === ' ' ? 6 : 0);
        qi++;
      } else {
        streak = 0;
      }
    }
    if (qi < q.length) return null;
    return { score: score - t.length * 0.1, marks };
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }

  function hl(label, marks) {
    if (!marks || !marks.length) return esc(label);
    const set = new Set(marks);
    let out = '';
    for (let i = 0; i < label.length; i++) {
      out += set.has(i) ? `<b>${esc(label[i])}</b>` : esc(label[i]);
    }
    return out;
  }

  // ── Item sources ───────────────────────────────────────────────────────────
  function collect() {
    const sites = SettingsStore.getCommands().map(c => ({
      type: 'site',
      label: c.name,
      sub: c.category || 'Site',
      icon: c.iconData || c.iconUrl || SettingsStore.getFaviconUrl(c.url),
      url: c.url,
    }));
    const actions = [
      { type: 'action', label: 'Open Settings', sub: 'Action', glyph: '⚙️', run: () => { const b = document.getElementById('sp-gear-btn'); if (b) b.click(); } },
      { type: 'action', label: 'Toggle Neon Mode', sub: 'Action', glyph: '⚡', run: () => { const fx = SettingsStore.getEffects(); fx.neon = !fx.neon; SettingsStore.setEffects(fx); Effects.apply(); } },
      { type: 'action', label: 'Toggle Aurora Background', sub: 'Action', glyph: '🌌', run: () => { const fx = SettingsStore.getEffects(); fx.aurora = !fx.aurora; SettingsStore.setEffects(fx); Effects.apply(); } },
      { type: 'action', label: 'Export Settings (JSON)', sub: 'Action', glyph: '💾', run: () => SettingsStore.downloadExport() },
    ];
    return sites.concat(actions);
  }

  // ── DOM ────────────────────────────────────────────────────────────────────
  function build() {
    overlayEl = document.createElement('div');
    overlayEl.id = 'cmd-palette-overlay';
    overlayEl.addEventListener('click', () => toggle(false));

    boxEl = document.createElement('div');
    boxEl.id = 'cmd-palette';
    boxEl.innerHTML = `
      <input id="cmd-palette-input" type="text" placeholder="Search sites &amp; actions…" spellcheck="false" autocomplete="off">
      <div id="cmd-palette-list"></div>
      <div class="cp-hint">
        <span><kbd>↑↓</kbd> navigate</span>
        <span><kbd>↵</kbd> open</span>
        <span><kbd>ctrl ↵</kbd> new tab</span>
        <span><kbd>esc</kbd> close</span>
      </div>`;

    document.body.appendChild(overlayEl);
    document.body.appendChild(boxEl);
    inputEl = boxEl.querySelector('#cmd-palette-input');
    listEl = boxEl.querySelector('#cmd-palette-list');
    inputEl.addEventListener('input', () => filter(inputEl.value));
  }

  function filter(q) {
    sel = 0;
    const scored = [];
    items.forEach(it => {
      const m = fuzzy(q, it.label);
      if (m) scored.push(Object.assign({}, it, { _score: m.score, _marks: m.marks }));
    });
    scored.sort((a, b) => b._score - a._score);
    filtered = scored.slice(0, 12);
    if (q.trim()) {
      filtered.push({ type: 'search', label: `Search Google for “${q}”`, sub: 'Web', glyph: '🔍', q, _marks: [] });
    }
    renderList();
  }

  function renderList() {
    listEl.innerHTML = '';
    if (!filtered.length) {
      listEl.innerHTML = '<div class="cp-empty">No matches</div>';
      return;
    }
    filtered.forEach((it, i) => {
      const row = document.createElement('div');
      row.className = 'cp-item' + (i === sel ? ' cp-sel' : '');
      const iconHtml = it.icon
        ? `<img src="${esc(it.icon)}" onerror="this.style.display='none'">`
        : (it.glyph || '·');
      row.innerHTML = `
        <span class="cp-icon">${iconHtml}</span>
        <span class="cp-label">${hl(it.label, it._marks)}</span>
        <span class="cp-sub">${esc(it.sub || '')}</span>`;
      row.addEventListener('mouseenter', () => { sel = i; markSel(); });
      row.addEventListener('click', (e) => execute(it, e.ctrlKey || e.metaKey || e.shiftKey));
      listEl.appendChild(row);
    });
  }

  function markSel() {
    [].forEach.call(listEl.children, (el, i) => el.classList.toggle('cp-sel', i === sel));
  }

  function moveSel(delta) {
    if (!filtered.length) return;
    sel = (sel + delta + filtered.length) % filtered.length;
    markSel();
    const el = listEl.children[sel];
    if (el) el.scrollIntoView({ block: 'nearest' });
  }

  function execute(item, newTab) {
    if (!item) return;
    toggle(false);
    if (item.type === 'action') { item.run(); return; }
    if (item.type === 'search') {
      window.location.href = 'https://www.google.com/search?q=' + encodeURIComponent(item.q);
      return;
    }
    if (newTab || CONFIG.newTab) window.open(item.url, '_blank');
    else window.location.href = item.url;
  }

  function toggle(force) {
    open = typeof force === 'boolean' ? force : !open;
    document.body.classList.toggle('palette-open', open);
    if (open) {
      items = collect();
      inputEl.value = '';
      filter('');
      setTimeout(() => inputEl.focus(), 30);
    } else {
      inputEl.blur();
    }
  }

  // ── Global keys (capture phase so the search form doesn't hijack) ─────────
  document.addEventListener('keydown', (e) => {
    const mod = e.ctrlKey || e.metaKey;
    // Alt+K fallback: on the new-tab page Chrome reserves Ctrl+K for the omnibox
    if ((mod || e.altKey) && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault();
      e.stopPropagation();
      toggle();
      return;
    }
    if (!open) return;
    e.stopPropagation();
    if (e.key === 'Escape') { e.preventDefault(); toggle(false); }
    else if (e.key === 'ArrowDown' || (e.ctrlKey && e.key === 'n')) { e.preventDefault(); moveSel(1); }
    else if (e.key === 'ArrowUp' || (e.ctrlKey && e.key === 'p')) { e.preventDefault(); moveSel(-1); }
    else if (e.key === 'Enter') { e.preventDefault(); execute(filtered[sel], mod || e.shiftKey); }
  }, true);

  // ── Grid keyboard navigation (arrow keys over the link grid) ──────────────
  document.addEventListener('keydown', (e) => {
    if (open) return;
    if (!document.body.classList.contains('help')) return;
    const t = e.target;
    if (t && ['INPUT', 'TEXTAREA', 'SELECT'].indexOf(t.tagName) !== -1) return;
    const panel = document.getElementById('sp-settings-panel');
    if (panel && panel.classList.contains('sp-panel-open')) return;
    const dirs = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' };
    const dir = dirs[e.key];
    if (!dir) return;
    e.preventDefault();
    e.stopPropagation();
    moveFocus(dir);
  }, true);

  function moveFocus(dir) {
    const links = [].slice.call(document.querySelectorAll('#help .command a'))
      .filter(a => a.offsetParent !== null);
    if (!links.length) return;
    const idx = links.indexOf(document.activeElement);
    if (idx === -1) { links[0].focus(); return; }
    const r0 = links[idx].getBoundingClientRect();
    const cx0 = r0.left + r0.width / 2;
    const cy0 = r0.top + r0.height / 2;
    let best = null, bestDist = Infinity;
    links.forEach((l, i) => {
      if (i === idx) return;
      const r = l.getBoundingClientRect();
      const dx = (r.left + r.width / 2) - cx0;
      const dy = (r.top + r.height / 2) - cy0;
      let ok = false, dist = 0;
      if (dir === 'left') { ok = dx < -2; dist = -dx + Math.abs(dy) * 4; }
      else if (dir === 'right') { ok = dx > 2; dist = dx + Math.abs(dy) * 4; }
      else if (dir === 'up') { ok = dy < -2; dist = -dy + Math.abs(dx) * 4; }
      else if (dir === 'down') { ok = dy > 2; dist = dy + Math.abs(dx) * 4; }
      if (ok && dist < bestDist) { bestDist = dist; best = l; }
    });
    if (best) {
      best.focus();
      best.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
  }

  function init() { build(); }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return { toggle };
})();
