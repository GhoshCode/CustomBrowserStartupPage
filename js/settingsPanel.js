/**
 * Settings Panel — Unified ⚙️ gear icon with slide-in panel.
 * 
 * Three tabs:
 *   🎨 Background  — solid / gradient / wallpaper
 *   🔗 Sites       — add, edit, delete commands with auto-favicon
 *   🖌️ Appearance  — icon border color, underline color
 */
const SettingsPanel = (function () {
  let panelOpen = false;
  let activeTab  = 'background';
  let editingIndex = null; // index of command being edited, null = not editing
  let dragIndex = null;    // flat index of command being dragged
  let dragCat = null;      // category name being dragged

  // ── Preset themes ───────────────────────────────────────────────────────────
  const PRESET_THEMES = [
    { name: 'Cyberpunk',   bg: ['#0a0118', '#16043a'], container: 'rgba(22, 8, 44, 0.45)',  accent1: '#00f0ff', accent2: '#ff2ec4', neon: true },
    { name: 'Tokyo Night', bg: ['#16161e', '#1f2335'], container: 'rgba(26, 27, 38, 0.55)', accent1: '#7aa2f7', accent2: '#bb9af7', neon: false },
    { name: 'Catppuccin',  bg: ['#181825', '#1e1e2e'], container: 'rgba(30, 30, 46, 0.55)', accent1: '#cba6f7', accent2: '#f5c2e7', neon: false },
    { name: 'Dracula',     bg: ['#1d1e26', '#2b2d3a'], container: 'rgba(40, 42, 54, 0.5)',  accent1: '#bd93f9', accent2: '#ff79c6', neon: true },
    { name: 'Nord',        bg: ['#2e3440', '#3b4252'], container: 'rgba(46, 52, 64, 0.55)', accent1: '#88c0d0', accent2: '#81a1c1', neon: false },
  ];

  // ── Gradient direction presets ──────────────────────────────────────────────
  const GRADIENT_DIRECTIONS = [
    { label: '↗ 135°',    value: '135deg' },
    { label: '→ To Right', value: 'to right' },
    { label: '↓ To Bottom', value: 'to bottom' },
    { label: '↘ 45°',     value: '45deg' },
    { label: '← To Left',  value: 'to left' },
    { label: '↑ To Top',   value: 'to top' },
    { label: '◎ Radial',   value: 'radial' },
  ];

  // ── Theme & Styling Application ────────────────────────────────────────────

  function applyThemeStyles() {
    // 1. Page Background
    const mode = SettingsStore.getBgMode();
    const body = document.body;
    // hide the doodle backdrop over photo wallpapers
    body.classList.toggle('bg-wallpaper', mode === 'wallpaper');

    body.style.backgroundImage = 'none';
    body.style.background = '';

    if (mode === 'solid') {
      const color = SettingsStore.getBgSolid();
      body.style.backgroundColor = color;
      body.style.backgroundImage = 'none';
    } else if (mode === 'gradient') {
      const g = SettingsStore.getBgGradient();
      if (g.direction === 'radial') {
        body.style.background = `radial-gradient(circle, ${g.color1}, ${g.color2})`;
      } else {
        body.style.background = `linear-gradient(${g.direction}, ${g.color1}, ${g.color2})`;
      }
      body.style.backgroundAttachment = 'fixed';
    } else if (mode === 'wallpaper') {
      const id = SettingsStore.getActiveBg();
      const entry = SettingsStore.getAllWallpapers().find(w => w.id === id);
      body.style.backgroundColor = '#000000';
      if (entry && entry.src) {
        body.style.backgroundImage = `url('${entry.src}')`;
        body.style.backgroundSize = 'cover';
        body.style.backgroundPosition = 'center';
        body.style.backgroundRepeat = 'no-repeat';
        body.style.backgroundAttachment = 'fixed';
      }
    }

    // 2. Variables for Icons and Containers
    const root = document.documentElement;
    const iconStyle = SettingsStore.getIconStyle();
    if (iconStyle.type === 'solid') {
      root.style.setProperty('--icon-border-gradient', iconStyle.color1);
      root.style.setProperty('--scrollbar-color', iconStyle.color1);
      root.style.setProperty('--scrollbar-color-hover', iconStyle.color1);
    } else {
      root.style.setProperty('--icon-border-gradient', `linear-gradient(${iconStyle.direction}, ${iconStyle.color1}, ${iconStyle.color2})`);
      root.style.setProperty('--scrollbar-color', 'rgba(128, 128, 128, 0.5)');
      root.style.setProperty('--scrollbar-color-hover', 'rgba(128, 128, 128, 0.8)');
    }

    const containerStyle = SettingsStore.getContainerStyle();
    if (containerStyle.type === 'solid') {
      root.style.setProperty('--container-bg', containerStyle.color1);
    } else {
      if (containerStyle.direction === 'radial') {
        root.style.setProperty('--container-bg', `radial-gradient(circle, ${containerStyle.color1}, ${containerStyle.color2})`);
      } else {
        root.style.setProperty('--container-bg', `linear-gradient(${containerStyle.direction}, ${containerStyle.color1}, ${containerStyle.color2})`);
      }
    }
    root.style.setProperty('--container-blur', `blur(${containerStyle.blur}px)`);
  }

  // ── Base themes (generic dark / light) ─────────────────────────────────────
  const BASE_THEMES = {
    dark: {
      bg: { color1: '#0b0f1e', color2: '#171c36', direction: '160deg' },
      container: 'rgba(16, 19, 32, 0.55)',
      icon: { c1: '#22d3ee', c2: '#a78bfa' },
      accent1: '#22d3ee', accent2: '#a78bfa',
      neon: true,
    },
    light: {
      bg: { color1: '#eef1f8', color2: '#dde4f5', direction: '160deg' },
      container: 'rgba(255, 255, 255, 0.65)',
      icon: { c1: '#2563eb', c2: '#7c3aed' },
      accent1: '#2563eb', accent2: '#7c3aed',
      neon: false,
    },
  };

  // Sets only CSS variables for the mode — never writes stores (safe on boot)
  function applyThemeVars(theme) {
    const root = document.documentElement;
    if (theme === 'light') {
      root.style.setProperty('--foreground', '#111827');
      root.style.setProperty('--card-fg', '#16181f');
      root.style.setProperty('--muted-fg', 'rgba(22, 26, 44, 0.55)');
      root.style.setProperty('--row-hover', 'rgba(0, 0, 0, 0.05)');
      root.style.setProperty('--chip-bg', 'rgba(0, 0, 0, 0.06)');
      root.style.setProperty('--glass-border', 'rgba(0, 0, 0, 0.08)');
      root.style.setProperty('--glass-border-hover', 'rgba(0, 0, 0, 0.2)');
    } else {
      root.style.setProperty('--foreground', '#F1F1F1');
      root.style.setProperty('--card-fg', '#F1F1F1');
      root.style.setProperty('--muted-fg', 'rgba(255, 255, 255, 0.45)');
      root.style.setProperty('--row-hover', 'rgba(255, 255, 255, 0.06)');
      root.style.setProperty('--chip-bg', 'rgba(255, 255, 255, 0.06)');
      root.style.setProperty('--glass-border', 'rgba(255, 255, 255, 0.08)');
      root.style.setProperty('--glass-border-hover', 'rgba(255, 255, 255, 0.18)');
    }
  }

  // Clicking Dark/Light applies the full predefined base theme
  function applyTheme(theme) {
    const t = BASE_THEMES[theme] || BASE_THEMES.dark;
    SettingsStore.setTheme(theme);
    SettingsStore.setBgMode('gradient');
    SettingsStore.setBgGradient({ color1: t.bg.color1, color2: t.bg.color2, direction: t.bg.direction });
    const cs = SettingsStore.getContainerStyle();
    SettingsStore.setContainerStyle({ ...cs, type: 'solid', color1: t.container, color2: t.container });
    SettingsStore.setIconStyle({ type: 'gradient', color1: t.icon.c1, color2: t.icon.c2, direction: 'to right' });
    const fx = SettingsStore.getEffects();
    SettingsStore.setEffects({ ...fx, accent1: t.accent1, accent2: t.accent2, neon: t.neon });
    applyThemeVars(theme);
    applyThemeStyles();
    if (typeof Effects !== 'undefined') Effects.apply();
    rebuildHelp();
  }

  // ── Rebuild the help panel (site links) ────────────────────────────────────

  function rebuildHelp() {
    const helpEl = document.getElementById('help');
    if (!helpEl) return;
    // Clear existing content
    helpEl.innerHTML = '';
    // Rebuild using the Help class pattern
    const commands = SettingsStore.getCommands();
    const categories = SettingsStore.getCategories();
    const newTab = CONFIG.newTab;

    const wrapper = document.createElement('div');
    wrapper.classList.add('categories-wrapper');

    let topTierHtml = '';
    let unifiedHtml = '';

    const PIN_ICON = '<svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor" aria-hidden="true"><path d="M16 12V4h1a1 1 0 0 0 0-2H7a1 1 0 0 0 0 2h1v8l-2 2v2h5.2v5l.8 1 .8-1v-5H18v-2l-2-2z"/></svg>';

    // One command row. withPin renders the hover pin-toggle button.
    const buildCommand = (cmd, withPin) => {
      let iconSrc;
      if (cmd.iconData) {
        iconSrc = cmd.iconData;
      } else if (cmd.iconUrl) {
        iconSrc = cmd.iconUrl;
      } else {
        iconSrc = SettingsStore.getFaviconUrl(cmd.url);
      }

      const iconEl = iconSrc
        ? `<img src="${iconSrc}" height="26px" width="26px" style="display:block;border-radius:4px;" onerror="this.style.display='none'">`
        : `<span style="font-size:14px;">${(cmd.name || '?')[0].toUpperCase()}</span>`;

      const pinBtn = withPin
        ? `<button class="pin-btn${cmd.pinned ? ' pin-active' : ''}" data-pin="${cmd._index}" title="${cmd.pinned ? 'Unpin' : 'Pin to top'}">${PIN_ICON}</button>`
        : '';

      return `
        <li class="command${cmd.pinned ? ' is-pinned' : ''}">
          <a href="${cmd.url}" target="${newTab ? '_blank' : '_self'}">
            <span class="command-key">${iconEl}</span>
            <span class="command-name">${cmd.name}</span>
            ${pinBtn}
          </a>
        </li>`;
    };

    categories.forEach(category => {
      // keep the index into the stored array so the pin button can toggle it
      const cmdsInCat = commands
        .map((c, i) => Object.assign({}, c, { _index: i }))
        .filter(c => c.category === category);
      if (cmdsInCat.length === 0) return;

      if (category === 'Primary') {
        cmdsInCat.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
        topTierHtml += `<ul class="quick-tiles">${cmdsInCat.map(c => buildCommand(c, false)).join('')}</ul>`;
      } else {
        // pinned rows live in their own strip ABOVE the scrolling list,
        // so they stay attached to the top no matter how far you scroll
        const pinned = cmdsInCat.filter(c => c.pinned);
        const rest = cmdsInCat.filter(c => !c.pinned);
        const pinnedHtml = pinned.length
          ? `<ul class="pinned-list">${pinned.map(c => buildCommand(c, true)).join('')}</ul>`
          : '';
        unifiedHtml += `
          <section class="category cat-card">
            <h2 class="category-name">${category}</h2>
            ${pinnedHtml}
            <ul class="vertical-list">${rest.map(c => buildCommand(c, true)).join('')}</ul>
          </section>
        `;
      }
    });

    if (topTierHtml) {
      wrapper.insertAdjacentHTML('beforeend', topTierHtml);
    }
    
    if (unifiedHtml) {
      wrapper.insertAdjacentHTML('beforeend', `<div class="cat-grid">${unifiedHtml}</div>`);
    }

    helpEl.appendChild(wrapper);

    // Pin toggle — delegated, bound once so it survives rebuilds
    if (!helpEl._pinBound) {
      helpEl._pinBound = true;
      helpEl.addEventListener('click', (e) => {
        const btn = e.target.closest('.pin-btn');
        if (!btn) return;
        e.preventDefault();
        e.stopPropagation();
        const idx = parseInt(btn.dataset.pin, 10);
        const cmds = SettingsStore.getCommands();
        if (!isNaN(idx) && cmds[idx]) {
          cmds[idx].pinned = !cmds[idx].pinned;
          SettingsStore.setCommands(cmds);
          rebuildHelp();
        }
      });
    }

    // Re-mount live widgets (rebuild wiped them)
    if (typeof Widgets !== 'undefined') Widgets.mount();
  }

  // ── Panel DOM Builder ──────────────────────────────────────────────────────

  function buildPanel() {
    // Gear button
    const gearBtn = document.createElement('button');
    gearBtn.id = 'sp-gear-btn';
    gearBtn.innerHTML = '⚙️';
    gearBtn.title = 'Settings';
    gearBtn.addEventListener('click', togglePanel);
    document.body.appendChild(gearBtn);

    // Overlay (click to close)
    const overlay = document.createElement('div');
    overlay.id = 'sp-settings-overlay';
    overlay.addEventListener('click', () => togglePanel(false));
    document.body.appendChild(overlay);

    // Panel container
    const panel = document.createElement('div');
    panel.id = 'sp-settings-panel';

    // Header
    const header = document.createElement('div');
    header.className = 'sp-settings-header';
    header.innerHTML = `<h2>Settings</h2>`;
    const closeBtn = document.createElement('button');
    closeBtn.className = 'sp-settings-close';
    closeBtn.innerHTML = '✕';
    closeBtn.addEventListener('click', () => togglePanel(false));
    header.appendChild(closeBtn);
    panel.appendChild(header);

    // Tabs
    const tabBar = document.createElement('div');
    tabBar.className = 'sp-tab-bar';
    const tabs = [
      { id: 'appearance', label: '🖌️ Appearance' },
      { id: 'sites',      label: '🔗 Sites' },
    ];
    // Default to appearance if background was active
    if (activeTab === 'background') activeTab = 'appearance';
    tabs.forEach(t => {
      const btn = document.createElement('button');
      btn.className = `sp-tab-btn${t.id === activeTab ? ' sp-tab-active' : ''}`;
      btn.dataset.tab = t.id;
      btn.textContent = t.label;
      btn.addEventListener('click', () => switchTab(t.id));
      tabBar.appendChild(btn);
    });
    panel.appendChild(tabBar);

    // Tab content container
    const content = document.createElement('div');
    content.id = 'sp-tab-content';
    panel.appendChild(content);

    document.body.appendChild(panel);

    // Hidden file input for wallpaper uploads
    let fileInput = document.getElementById('sp-file-input');
    if (!fileInput) {
      fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.id = 'sp-file-input';
      fileInput.accept = 'image/*';
      fileInput.style.display = 'none';
      fileInput.addEventListener('change', (e) => {
        if (e.target.files[0]) handleWallpaperUpload(e.target.files[0]);
        fileInput.value = '';
      });
      document.body.appendChild(fileInput);
    }

    // Hidden file input for icon uploads
    let iconInput = document.getElementById('sp-icon-input');
    if (!iconInput) {
      iconInput = document.createElement('input');
      iconInput.type = 'file';
      iconInput.id = 'sp-icon-input';
      iconInput.accept = 'image/*';
      iconInput.style.display = 'none';
      document.body.appendChild(iconInput);
    }

    // Render initial tab
    renderTab(activeTab);

    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && panelOpen) togglePanel(false);
    });
  }

  // ── Panel Toggle ───────────────────────────────────────────────────────────

  function togglePanel(forceState) {
    panelOpen = typeof forceState === 'boolean' ? forceState : !panelOpen;
    const panel = document.getElementById('sp-settings-panel');
    const overlay = document.getElementById('sp-settings-overlay');
    if (panel) panel.classList.toggle('sp-panel-open', panelOpen);
    if (overlay) overlay.classList.toggle('sp-overlay-visible', panelOpen);
  }

  function switchTab(tabId) {
    activeTab = tabId;
    editingIndex = null;
    document.querySelectorAll('.sp-tab-btn').forEach(b => {
      b.classList.toggle('sp-tab-active', b.dataset.tab === tabId);
    });
    renderTab(tabId);
  }

  function renderTab(tabId) {
    const content = document.getElementById('sp-tab-content');
    if (!content) return;
    content.innerHTML = '';
    if (tabId === 'sites') renderSitesTab(content);
    else if (tabId === 'appearance') renderAppearanceTab(content);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  BACKGROUND TAB
  // ═══════════════════════════════════════════════════════════════════════════

  function _renderBackgroundSection(container) {
    const mode = SettingsStore.getBgMode();

    // Mode selector
    const modeGroup = _el('div', 'sp-field-group');
    modeGroup.innerHTML = '<label class="sp-field-label">Background Type</label>';
    const modeSelect = _el('div', 'sp-mode-select');
    ['solid', 'gradient', 'wallpaper'].forEach(m => {
      const btn = _el('button', `sp-mode-btn${m === mode ? ' sp-mode-active' : ''}`);
      btn.textContent = m.charAt(0).toUpperCase() + m.slice(1);
      btn.addEventListener('click', () => {
        SettingsStore.setBgMode(m);
        applyThemeStyles();
        renderTab('appearance');
      });
      modeSelect.appendChild(btn);
    });
    modeGroup.appendChild(modeSelect);
    container.appendChild(modeGroup);

    if (mode === 'solid') {
      const color = SettingsStore.getBgSolid();
      const group = _el('div', 'sp-field-group');
      group.innerHTML = '<label class="sp-field-label">Solid Color</label>';
      const row = _el('div', 'sp-color-row');

      const picker = _el('input', 'sp-color-picker');
      picker.type = 'color';
      picker.value = color;
      picker.addEventListener('input', (e) => {
        SettingsStore.setBgSolid(e.target.value);
        applyThemeStyles();
        hexInput.value = e.target.value;
      });

      const hexInput = _el('input', 'sp-hex-input');
      hexInput.type = 'text';
      hexInput.value = color;
      hexInput.placeholder = '#000000';
      hexInput.addEventListener('change', (e) => {
        const v = e.target.value;
        if (/^#[0-9a-fA-F]{6}$/.test(v)) {
          SettingsStore.setBgSolid(v);
          applyThemeStyles();
          picker.value = v;
        }
      });

      row.appendChild(picker);
      row.appendChild(hexInput);
      group.appendChild(row);
      container.appendChild(group);

      // Quick presets
      const presets = _el('div', 'sp-field-group');
      presets.innerHTML = '<label class="sp-field-label">Quick Presets</label>';
      const presetRow = _el('div', 'sp-preset-row');
      ['#000000', '#0E0E0E', '#1a1a2e', '#16213e', '#0f3460', '#1b1b2f', '#2d2d2d', '#121212'].forEach(c => {
        const swatch = _el('div', 'sp-swatch');
        swatch.style.background = c;
        if (c === color) swatch.classList.add('sp-swatch-active');
        swatch.addEventListener('click', () => {
          SettingsStore.setBgSolid(c);
          applyThemeStyles();
          renderTab('appearance');
        });
        presetRow.appendChild(swatch);
      });
      presets.appendChild(presetRow);
      container.appendChild(presets);

    } else if (mode === 'gradient') {
      const g = SettingsStore.getBgGradient();

      // Color 1
      const c1Group = _el('div', 'sp-field-group');
      c1Group.innerHTML = '<label class="sp-field-label">Color 1</label>';
      const c1Row = _el('div', 'sp-color-row');
      const c1Picker = _el('input', 'sp-color-picker');
      c1Picker.type = 'color';
      c1Picker.value = g.color1;
      c1Picker.addEventListener('input', (e) => {
        g.color1 = e.target.value;
        SettingsStore.setBgGradient(g);
        applyThemeStyles();
      });
      const c1Hex = _el('input', 'sp-hex-input');
      c1Hex.type = 'text';
      c1Hex.value = g.color1;
      c1Hex.addEventListener('change', (e) => {
        if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) {
          g.color1 = e.target.value;
          SettingsStore.setBgGradient(g);
          applyThemeStyles();
          c1Picker.value = e.target.value;
        }
      });
      c1Row.appendChild(c1Picker);
      c1Row.appendChild(c1Hex);
      c1Group.appendChild(c1Row);
      container.appendChild(c1Group);

      // Color 2
      const c2Group = _el('div', 'sp-field-group');
      c2Group.innerHTML = '<label class="sp-field-label">Color 2</label>';
      const c2Row = _el('div', 'sp-color-row');
      const c2Picker = _el('input', 'sp-color-picker');
      c2Picker.type = 'color';
      c2Picker.value = g.color2;
      c2Picker.addEventListener('input', (e) => {
        g.color2 = e.target.value;
        SettingsStore.setBgGradient(g);
        applyThemeStyles();
      });
      const c2Hex = _el('input', 'sp-hex-input');
      c2Hex.type = 'text';
      c2Hex.value = g.color2;
      c2Hex.addEventListener('change', (e) => {
        if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) {
          g.color2 = e.target.value;
          SettingsStore.setBgGradient(g);
          applyThemeStyles();
          c2Picker.value = e.target.value;
        }
      });
      c2Row.appendChild(c2Picker);
      c2Row.appendChild(c2Hex);
      c2Group.appendChild(c2Row);
      container.appendChild(c2Group);

      // Direction
      const dirGroup = _el('div', 'sp-field-group');
      dirGroup.innerHTML = '<label class="sp-field-label">Direction</label>';
      const dirSelect = _el('select', 'sp-select');
      GRADIENT_DIRECTIONS.forEach(d => {
        const opt = document.createElement('option');
        opt.value = d.value;
        opt.textContent = d.label;
        if (d.value === g.direction) opt.selected = true;
        dirSelect.appendChild(opt);
      });
      dirSelect.addEventListener('change', (e) => {
        g.direction = e.target.value;
        SettingsStore.setBgGradient(g);
        applyThemeStyles();
      });
      dirGroup.appendChild(dirSelect);
      container.appendChild(dirGroup);

      // Gradient presets
      const presets = _el('div', 'sp-field-group');
      presets.innerHTML = '<label class="sp-field-label">Gradient Presets</label>';
      const presetRow = _el('div', 'sp-preset-row');
      const gradientPresets = [
        { c1: '#0f0c29', c2: '#302b63', dir: '135deg' },
        { c1: '#000428', c2: '#004e92', dir: 'to right' },
        { c1: '#1a1a2e', c2: '#e94560', dir: '135deg' },
        { c1: '#0f3460', c2: '#533483', dir: 'to right' },
        { c1: '#141e30', c2: '#243b55', dir: 'to bottom' },
        { c1: '#232526', c2: '#414345', dir: 'to right' },
        { c1: '#200122', c2: '#6f0000', dir: '135deg' },
        { c1: '#000000', c2: '#434343', dir: 'to bottom' },
      ];
      gradientPresets.forEach(p => {
        const swatch = _el('div', 'sp-swatch');
        swatch.style.background = `linear-gradient(${p.dir}, ${p.c1}, ${p.c2})`;
        swatch.addEventListener('click', () => {
          SettingsStore.setBgGradient({ color1: p.c1, color2: p.c2, direction: p.dir });
          applyThemeStyles();
          renderTab('appearance');
        });
        presetRow.appendChild(swatch);
      });
      presets.appendChild(presetRow);
      container.appendChild(presets);

    } else if (mode === 'wallpaper') {
      _renderWallpaperSection(container);
    }
  }

  function _renderWallpaperSection(container) {
    const wallpapers = SettingsStore.getAllWallpapers();
    const activeId = SettingsStore.getActiveBg();

    const group = _el('div', 'sp-field-group');
    group.innerHTML = '<label class="sp-field-label">Choose Wallpaper</label>';

    const grid = _el('div', 'sp-wallpaper-grid');

    wallpapers.forEach(w => {
      const thumb = _el('div', 'sp-wp-thumb');
      if (w.id === activeId) thumb.classList.add('sp-wp-active');

      if (!w.src) {
        thumb.style.background = '#1a1a1a';
        thumb.innerHTML = '<span style="font-size:14px;display:flex;height:100%;align-items:center;justify-content:center;color:rgba(255,255,255,0.5);">None</span>';
      } else {
        thumb.style.backgroundImage = `url('${w.src}')`;
        thumb.style.backgroundSize = 'cover';
        thumb.style.backgroundPosition = 'center';
      }

      if (w.id !== 'none') {
        const del = _el('span', 'sp-wp-del');
        del.textContent = '×';
        del.addEventListener('click', (e) => {
          e.stopPropagation();
          _showWpDeleteConfirm(w, container);
        });
        thumb.appendChild(del);
      }

      thumb.addEventListener('click', () => {
        SettingsStore.setActiveBg(w.id);
        applyThemeStyles();
        renderTab('appearance');
      });
      grid.appendChild(thumb);
    });

    // Upload tile
    const uploadTile = _el('div', 'sp-wp-thumb sp-wp-upload');
    uploadTile.innerHTML = '<span style="font-size:22px;display:flex;height:100%;align-items:center;justify-content:center;color:rgba(255,255,255,0.5);">＋</span>';
    uploadTile.addEventListener('click', () => {
      document.getElementById('sp-file-input').click();
    });
    grid.appendChild(uploadTile);

    group.appendChild(grid);
    container.appendChild(group);
  }

  let wpDeleteConfirmEl = null;
  function _showWpDeleteConfirm(wallpaper, container) {
    if (wpDeleteConfirmEl) wpDeleteConfirmEl.remove();
    wpDeleteConfirmEl = _el('div', 'sp-confirm-inline');
    wpDeleteConfirmEl.innerHTML = `
      <span>Delete "${wallpaper.label}"?</span>
      <div class="sp-confirm-btns">
        <button class="sp-btn-danger" id="sp-wp-del-yes">Delete</button>
        <button class="sp-btn-ghost" id="sp-wp-del-no">Cancel</button>
      </div>`;
    container.appendChild(wpDeleteConfirmEl);

    document.getElementById('sp-wp-del-yes').addEventListener('click', () => {
      // Delete from builtin or uploads
      const uploads = SettingsStore.getUploads();
      if (uploads.find(u => u.id === wallpaper.id)) {
        SettingsStore.deleteUpload(wallpaper.id);
      } else {
        SettingsStore.deleteBuiltinWallpaper(wallpaper.id);
      }
      if (SettingsStore.getActiveBg() === wallpaper.id) {
        SettingsStore.setActiveBg('none');
      }
      applyThemeStyles();
      renderTab('appearance');
    });

    document.getElementById('sp-wp-del-no').addEventListener('click', () => {
      wpDeleteConfirmEl.remove();
      wpDeleteConfirmEl = null;
    });
  }

  function handleWallpaperUpload(file) {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = function (e) {
      const img = new Image();
      img.onload = function() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const MAX_WIDTH = 1920;
        const MAX_HEIGHT = 1080;
        let w = img.width;
        let h = img.height;
        
        if (w > MAX_WIDTH) { h = Math.round(h * (MAX_WIDTH / w)); w = MAX_WIDTH; }
        if (h > MAX_HEIGHT) { w = Math.round(w * (MAX_HEIGHT / h)); h = MAX_HEIGHT; }
        
        canvas.width = w;
        canvas.height = h;
        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        
        const upload = {
          id: 'upload-' + Date.now(),
          label: file.name.replace(/\.[^.]+$/, ''),
          src: dataUrl,
        };
        try {
          SettingsStore.addUpload(upload);
          SettingsStore.setActiveBg(upload.id);
          applyThemeStyles();
          renderTab('appearance');
        } catch (err) {
          alert('Storage quota exceeded! Please delete some uploaded wallpapers first.');
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  SITES TAB
  // ═══════════════════════════════════════════════════════════════════════════

  function renderSitesTab(container) {
    const commands = SettingsStore.getCommands();
    const categories = SettingsStore.getCategories();

    const hint = _el('div', 'sp-drag-hint');
    hint.textContent = 'Tip: drag sites to reorder or move between categories · drag category headers to reorder sections';
    container.appendChild(hint);

    categories.forEach(cat => {
      const cmdsInCat = commands
        .map((c, i) => ({ ...c, _index: i }))
        .filter(c => c.category === cat);
      if (cmdsInCat.length === 0 && editingIndex === null) return;

      const section = _el('div', 'sp-sites-section');

      // Drop a site onto a section = move to end of that category
      section.addEventListener('dragover', (e) => {
        if (dragIndex === null) return;
        e.preventDefault();
        section.classList.add('sp-drop-into');
      });
      section.addEventListener('dragleave', (e) => {
        if (!section.contains(e.relatedTarget)) section.classList.remove('sp-drop-into');
      });
      section.addEventListener('drop', (e) => {
        if (dragIndex === null) return;
        e.preventDefault();
        _moveCommand(dragIndex, -1, cat);
      });

      // Category header with rename/delete
      const catHeader = _el('div', 'sp-cat-header');
      catHeader.innerHTML = `<span class="sp-cat-name">⠿ ${cat}</span>`;
      catHeader.title = 'Drag to reorder categories';

      // Drag categories to reorder
      catHeader.draggable = true;
      catHeader.addEventListener('dragstart', (e) => {
        dragCat = cat;
        dragIndex = null;
        e.stopPropagation();
        e.dataTransfer.effectAllowed = 'move';
        try { e.dataTransfer.setData('text/plain', cat); } catch {}
      });
      catHeader.addEventListener('dragover', (e) => {
        if (!dragCat || dragCat === cat) return;
        e.preventDefault();
        e.stopPropagation();
        catHeader.classList.add('sp-drop-above');
      });
      catHeader.addEventListener('dragleave', () => catHeader.classList.remove('sp-drop-above'));
      catHeader.addEventListener('drop', (e) => {
        if (!dragCat || dragCat === cat) return;
        e.preventDefault();
        e.stopPropagation();
        _moveCategory(dragCat, cat);
      });
      catHeader.addEventListener('dragend', () => {
        dragCat = null;
        document.querySelectorAll('.sp-drop-above').forEach(el => el.classList.remove('sp-drop-above'));
      });
      const catActions = _el('div', 'sp-cat-actions');

      const renameBtn = _el('button', 'sp-btn-tiny');
      renameBtn.textContent = '✏️';
      renameBtn.title = 'Rename category';

      const isPrimary = cat === 'Primary';
      const delCatBtn = _el('button', 'sp-btn-tiny');
      delCatBtn.textContent = '🗑️';
      delCatBtn.title = isPrimary ? 'Primary category cannot be deleted' : 'Delete category and all its sites';
      
      if (isPrimary) {
        delCatBtn.style.opacity = '0.3';
        delCatBtn.style.cursor = 'not-allowed';
      }
      
      const confirmContainer = _el('div', 'sp-cat-actions');
      confirmContainer.style.display = 'none';
      const yesBtn = _el('button', 'sp-btn-tiny');
      yesBtn.style.color = '#ff6b6b';
      yesBtn.textContent = 'Yes';
      const noBtn = _el('button', 'sp-btn-tiny');
      noBtn.textContent = 'No';
      confirmContainer.appendChild(yesBtn);
      confirmContainer.appendChild(noBtn);

      const renameContainer = _el('div', 'sp-cat-actions');
      renameContainer.style.display = 'none';
      const renameInput = _el('input', 'sp-input');
      renameInput.style.width = '100px';
      renameInput.style.padding = '2px 4px';
      renameInput.style.fontSize = '0.7rem';
      renameInput.value = cat;
      const renameSave = _el('button', 'sp-btn-tiny');
      renameSave.textContent = '✓';
      const renameCancel = _el('button', 'sp-btn-tiny');
      renameCancel.textContent = '✕';
      renameContainer.appendChild(renameInput);
      renameContainer.appendChild(renameSave);
      renameContainer.appendChild(renameCancel);

      renameBtn.addEventListener('click', () => {
        catActions.style.display = 'none';
        renameContainer.style.display = 'flex';
      });
      
      renameCancel.addEventListener('click', () => {
        renameContainer.style.display = 'none';
        catActions.style.display = 'flex';
      });
      
      renameSave.addEventListener('click', () => {
        const newName = renameInput.value.trim();
        if (newName && newName !== cat) {
          SettingsStore.renameCategory(cat, newName);
          renderTab('sites');
          rebuildHelp();
        }
      });

      delCatBtn.addEventListener('click', () => {
        if (isPrimary) return;
        catActions.style.display = 'none';
        confirmContainer.style.display = 'flex';
      });
      
      noBtn.addEventListener('click', () => {
        confirmContainer.style.display = 'none';
        catActions.style.display = 'flex';
      });
      
      yesBtn.addEventListener('click', () => {
        SettingsStore.deleteCategory(cat);
        renderTab('sites');
        rebuildHelp();
      });

      catActions.appendChild(renameBtn);
      catActions.appendChild(delCatBtn);
      
      catHeader.appendChild(catActions);
      catHeader.appendChild(confirmContainer);
      catHeader.appendChild(renameContainer);
      section.appendChild(catHeader);

      // Site rows
      cmdsInCat.forEach(cmd => {
        if (editingIndex === cmd._index) {
          section.appendChild(_buildEditForm(cmd, cmd._index));
        } else {
          section.appendChild(_buildSiteRow(cmd, cmd._index));
        }
      });

      container.appendChild(section);
    });

    // Add site button
    const addArea = _el('div', 'sp-add-area');

    if (editingIndex === -1) {
      // Show add form
      addArea.appendChild(_buildEditForm({
        category: categories[0] || 'General',
        name: '',
        key: '',
        url: '',
        icon: '',
        color: '#333333',
        quickLaunch: false,
      }, -1));
    } else {
      const addBtn = _el('button', 'sp-btn-primary');
      addBtn.textContent = '＋ Add Site';
      addBtn.addEventListener('click', () => {
        editingIndex = -1;
        renderTab('sites');
      });
      addArea.appendChild(addBtn);

      // Add category button area
      const addCatContainer = _el('div', 'sp-add-cat-container');
      addCatContainer.style.marginLeft = '0.5rem';
      addCatContainer.style.display = 'inline-flex';
      addCatContainer.style.alignItems = 'center';
      
      const addCatBtn = _el('button', 'sp-btn-ghost');
      addCatBtn.textContent = '＋ Add Category';
      
      const catInput = _el('input', 'sp-input');
      catInput.style.display = 'none';
      catInput.style.width = '120px';
      catInput.placeholder = 'Name...';
      
      const catSaveBtn = _el('button', 'sp-btn-primary sp-btn-sm');
      catSaveBtn.textContent = 'Save';
      catSaveBtn.style.display = 'none';
      catSaveBtn.style.marginLeft = '0.3rem';

      addCatBtn.addEventListener('click', () => {
        addCatBtn.style.display = 'none';
        catInput.style.display = 'block';
        catSaveBtn.style.display = 'block';
        catInput.focus();
      });

      catSaveBtn.addEventListener('click', () => {
        const name = catInput.value.trim();
        if (name) {
          SettingsStore.addCategory(name);
          renderTab('sites');
        } else {
          addCatBtn.style.display = 'block';
          catInput.style.display = 'none';
          catSaveBtn.style.display = 'none';
        }
      });
      
      addCatContainer.appendChild(addCatBtn);
      addCatContainer.appendChild(catInput);
      addCatContainer.appendChild(catSaveBtn);
      addArea.appendChild(addCatContainer);
    }

    container.appendChild(addArea);
  }

  function _buildSiteRow(cmd, index) {
    const row = _el('div', 'sp-site-row');

    // Drag & drop reordering
    row.draggable = true;
    row.addEventListener('dragstart', (e) => {
      dragIndex = index;
      dragCat = null;
      row.classList.add('sp-dragging');
      e.dataTransfer.effectAllowed = 'move';
      try { e.dataTransfer.setData('text/plain', String(index)); } catch {}
    });
    row.addEventListener('dragend', () => {
      row.classList.remove('sp-dragging');
      document.querySelectorAll('.sp-drop-above, .sp-drop-into')
        .forEach(el => el.classList.remove('sp-drop-above', 'sp-drop-into'));
    });
    row.addEventListener('dragover', (e) => {
      if (dragIndex === null) return;
      e.preventDefault();
      row.classList.add('sp-drop-above');
    });
    row.addEventListener('dragleave', () => row.classList.remove('sp-drop-above'));
    row.addEventListener('drop', (e) => {
      if (dragIndex === null) return;
      e.preventDefault();
      e.stopPropagation();
      _moveCommand(dragIndex, index, cmd.category);
    });

    // Icon preview
    const iconPreview = _el('div', 'sp-site-icon');
    let iconSrc = cmd.iconData || cmd.iconUrl || SettingsStore.getFaviconUrl(cmd.url);
    if (iconSrc) {
      iconPreview.innerHTML = `<img src="${iconSrc}" width="24" height="24" style="border-radius:4px;" onerror="this.parentElement.textContent='${(cmd.name||'?')[0]}'">`;
    } else {
      iconPreview.textContent = (cmd.name || '?')[0].toUpperCase();
    }

    // Info
    const info = _el('div', 'sp-site-info');
    info.innerHTML = `<span class="sp-site-name">${cmd.name}${cmd.pinned ? ' 📌' : ''}</span><span class="sp-site-key">${cmd.key}</span>`;

    // Actions
    const actions = _el('div', 'sp-site-actions');
    const editBtn = _el('button', 'sp-btn-tiny');
    editBtn.textContent = '✏️';
    editBtn.addEventListener('click', () => {
      editingIndex = index;
      renderTab('sites');
    });

    const delBtn = _el('button', 'sp-btn-tiny');
    delBtn.textContent = '🗑️';
    
    const confirmActions = _el('div', 'sp-site-actions');
    confirmActions.style.display = 'none';
    const yesBtn = _el('button', 'sp-btn-tiny');
    yesBtn.textContent = 'Yes';
    yesBtn.style.color = '#ff6b6b';
    const noBtn = _el('button', 'sp-btn-tiny');
    noBtn.textContent = 'No';
    confirmActions.appendChild(yesBtn);
    confirmActions.appendChild(noBtn);

    delBtn.addEventListener('click', () => {
      actions.style.display = 'none';
      confirmActions.style.display = 'flex';
    });
    
    noBtn.addEventListener('click', () => {
      confirmActions.style.display = 'none';
      actions.style.display = 'flex';
    });
    
    yesBtn.addEventListener('click', () => {
      SettingsStore.deleteCommand(index);
      renderTab('sites');
      rebuildHelp();
    });

    actions.appendChild(editBtn);
    actions.appendChild(delBtn);

    row.appendChild(iconPreview);
    row.appendChild(info);
    row.appendChild(actions);
    row.appendChild(confirmActions);
    return row;
  }

  function _buildEditForm(cmd, index) {
    const form = _el('div', 'sp-edit-form');
    const isNew = index === -1;
    const categories = SettingsStore.getCategories();

    form.innerHTML = `
      <div class="sp-edit-row">
        <label>Category</label>
        <select class="sp-select" id="sp-edit-cat">
          ${categories.map(c => `<option value="${c}" ${c === cmd.category ? 'selected' : ''}>${c}</option>`).join('')}
        </select>
      </div>
      <div class="sp-edit-row">
        <label>Name</label>
        <input type="text" class="sp-input" id="sp-edit-name" value="${cmd.name || ''}" placeholder="e.g. GitHub">
      </div>
      <div class="sp-edit-row">
        <label>Key</label>
        <input type="text" class="sp-input" id="sp-edit-key" value="${cmd.key || ''}" placeholder="e.g. g">
      </div>
      <div class="sp-edit-row">
        <label>URL</label>
        <input type="url" class="sp-input" id="sp-edit-url" value="${cmd.url || ''}" placeholder="https://github.com">
      </div>
      <div class="sp-edit-row">
        <label class="sp-field-label">Search Path</label>
        <input type="text" class="sp-input" id="sp-edit-search" value="${cmd.search || ''}" placeholder="/search?q={}">
      </div>
      <div class="sp-edit-row" style="flex-direction:row; align-items:center;">
        <input type="checkbox" id="sp-edit-pinned" ${cmd.pinned ? 'checked' : ''} style="margin-right:0.5rem; accent-color:var(--accent);">
        <label class="sp-field-label" for="sp-edit-pinned" style="margin-bottom:0;">Pin to top of category</label>
      </div>
      <div class="sp-edit-row" style="margin-top:0.5rem;">
        <label class="sp-field-label">Icon</label>
        <div class="sp-icon-edit-row">
          <div class="sp-icon-preview" id="sp-edit-icon-preview"></div>
          <span class="sp-icon-hint">Auto-fetched from URL</span>
          <button class="sp-btn-ghost sp-btn-sm" id="sp-edit-icon-upload">Upload Custom</button>
        </div>
      </div>
      <div class="sp-edit-actions">
        <button class="sp-btn-primary" id="sp-edit-save">${isNew ? 'Add' : 'Save'}</button>
        <button class="sp-btn-ghost" id="sp-edit-cancel">Cancel</button>
      </div>
    `;

    // After appending, wire up events
    setTimeout(() => {
      // Icon preview
      const previewEl = document.getElementById('sp-edit-icon-preview');
      const urlInput = document.getElementById('sp-edit-url');
      let customIconData = cmd.iconData || null;
      let customIconUrl = cmd.iconUrl || null;

      function updateIconPreview() {
        const src = customIconData || customIconUrl
          || (cmd.icon ? `assets/icons/${cmd.icon.includes('.') ? cmd.icon : cmd.icon + '.' + (CONFIG.iconExtension || 'png')}` : null)
          || SettingsStore.getFaviconUrl(urlInput.value);
        if (previewEl && src) {
          previewEl.innerHTML = `<img src="${src}" width="32" height="32" style="border-radius:6px;" onerror="this.parentElement.textContent='?'">`;
        }
      }
      updateIconPreview();

      if (urlInput) {
        urlInput.addEventListener('input', () => {
          if (!customIconData && !customIconUrl) updateIconPreview();
        });
      }

      // Upload button
      const uploadBtn = document.getElementById('sp-edit-icon-upload');
      const iconInput = document.getElementById('sp-icon-input');
      if (uploadBtn && iconInput) {
        uploadBtn.addEventListener('click', () => {
          iconInput.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
              customIconData = ev.target.result;
              customIconUrl = null;
              updateIconPreview();
            };
            reader.readAsDataURL(file);
            iconInput.value = '';
          };
          iconInput.click();
        });
      }

      // Save
      const saveBtn = document.getElementById('sp-edit-save');
      if (saveBtn) {
        saveBtn.addEventListener('click', () => {
          const updated = {
            category: document.getElementById('sp-edit-cat').value,
            name: document.getElementById('sp-edit-name').value.trim(),
            key: document.getElementById('sp-edit-key').value.trim(),
            url: document.getElementById('sp-edit-url').value.trim(),
            search: document.getElementById('sp-edit-search').value.trim(),
            pinned: document.getElementById('sp-edit-pinned').checked,
            color: cmd.color || '#333333',
            quickLaunch: cmd.quickLaunch || false,
          };

          if (!updated.name || !updated.url) {
            alert('Name and URL are required.');
            return;
          }

          // Icon handling
          if (customIconData) {
            updated.iconData = customIconData;
            updated.icon = '';
            updated.iconUrl = '';
          } else if (customIconUrl) {
            updated.iconUrl = customIconUrl;
            updated.icon = '';
            updated.iconData = '';
          } else if (cmd.icon) {
            updated.icon = cmd.icon;
          }
          // If no icon at all, favicon will be auto-fetched at render time

          if (isNew) {
            SettingsStore.addCommand(updated);
          } else {
            SettingsStore.updateCommand(index, updated);
          }

          editingIndex = null;
          renderTab('sites');
          rebuildHelp();
        });
      }

      // Cancel
      const cancelBtn = document.getElementById('sp-edit-cancel');
      if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
          editingIndex = null;
          renderTab('sites');
        });
      }
    }, 0);

    return form;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  APPEARANCE TAB
  // ═══════════════════════════════════════════════════════════════════════════

  // ── Collapsible groups (state survives tab re-renders) ─────────────────────
  const openGroups = new Set();

  function _collapsible(container, title, renderBody) {
    const group = _el('div', 'sp-acc');
    const head = _el('button', 'sp-acc-head');
    head.innerHTML = `<span>${title}</span><span class="sp-acc-chev">▾</span>`;
    const body = _el('div', 'sp-acc-body');

    if (openGroups.has(title)) {
      group.classList.add('sp-acc-open');
      renderBody(body);
    }

    head.addEventListener('click', () => {
      if (openGroups.has(title)) {
        openGroups.delete(title);
        group.classList.remove('sp-acc-open');
        body.innerHTML = '';
      } else {
        openGroups.add(title);
        group.classList.add('sp-acc-open');
        body.innerHTML = '';
        renderBody(body);
      }
    });

    group.appendChild(head);
    group.appendChild(body);
    container.appendChild(group);
  }

  function renderAppearanceTab(container) {
    // Quick theming — always visible
    _renderPresetSection(container);
    _renderThemeSection(container);
    _renderClockSection(container);

    // Everything else: collapsed groups
    _collapsible(container, 'Background', _renderBackgroundSection);
    _collapsible(container, 'Effects & Accents', _renderEffectsSection);
    _collapsible(container, 'Widgets', _renderWidgetsSection);
    _collapsible(container, 'Advanced Style', (body) => {
      _renderIconStyleSection(body);
      _renderContainerStyleSection(body);
    });
    _collapsible(container, 'Backup & Reset', (body) => {
      _renderDataSection(body);
      _renderResetSection(body);
    });
  }

  function _renderClockSection(container) {
    const group = _el('div', 'sp-field-group');
    group.innerHTML = '<label class="sp-field-label">Clock Style</label>';
    const row = _el('div', 'sp-mode-select');
    const current = SettingsStore.getClockStyle();
    [
      ['casio', '⌚ Casio'],
      ['digital', '⏰ Digital'],
      ['flip', '🕰 Flip'],
    ].forEach(([v, label]) => {
      const btn = _el('button', `sp-mode-btn${v === current ? ' sp-mode-active' : ''}`);
      btn.textContent = label;
      btn.addEventListener('click', () => {
        SettingsStore.setClockStyle(v);
        if (typeof FlipClock !== 'undefined') FlipClock.apply();
        renderTab('appearance');
      });
      row.appendChild(btn);
    });
    group.appendChild(row);
    container.appendChild(group);
  }

  function _renderIconStyleSection(container) {
    const iconHeader = _el('h3', 'sp-section-header');
    iconHeader.textContent = 'Icon Style';
    container.appendChild(iconHeader);

    const iconStyle = SettingsStore.getIconStyle();
    
    // Icon type toggle
    const typeGroup = _el('div', 'sp-field-group');
    typeGroup.innerHTML = '<label class="sp-field-label">Border Type</label>';
    const typeRow = _el('div', 'sp-mode-select');
    ['solid', 'gradient'].forEach(t => {
      const btn = _el('button', `sp-mode-btn${t === iconStyle.type ? ' sp-mode-active' : ''}`);
      btn.textContent = t.charAt(0).toUpperCase() + t.slice(1);
      btn.addEventListener('click', () => {
        iconStyle.type = t;
        SettingsStore.setIconStyle(iconStyle);
        applyThemeStyles();
        renderTab('appearance');
      });
      typeRow.appendChild(btn);
    });
    typeGroup.appendChild(typeRow);
    container.appendChild(typeGroup);

    // Color 1 (and only color if solid)
    const i1Group = _el('div', 'sp-field-group');
    i1Group.innerHTML = `<label class="sp-field-label">${iconStyle.type === 'gradient' ? 'Color 1' : 'Color'}</label>`;
    const i1Row = _el('div', 'sp-color-row');
    const i1Picker = _el('input', 'sp-color-picker');
    i1Picker.type = 'color';
    i1Picker.value = _rgbaToHex(iconStyle.color1);
    i1Picker.addEventListener('input', (e) => {
      iconStyle.color1 = e.target.value;
      SettingsStore.setIconStyle(iconStyle);
      applyThemeStyles();
      rebuildHelp();
    });
    const i1Hex = _el('input', 'sp-hex-input');
    i1Hex.type = 'text';
    i1Hex.value = iconStyle.color1;
    i1Hex.addEventListener('change', (e) => {
      iconStyle.color1 = e.target.value;
      SettingsStore.setIconStyle(iconStyle);
      applyThemeStyles();
      rebuildHelp();
    });
    i1Row.appendChild(i1Picker);
    i1Row.appendChild(i1Hex);
    i1Group.appendChild(i1Row);
    container.appendChild(i1Group);

    if (iconStyle.type === 'gradient') {
      const i2Group = _el('div', 'sp-field-group');
      i2Group.innerHTML = '<label class="sp-field-label">Color 2</label>';
      const i2Row = _el('div', 'sp-color-row');
      const i2Picker = _el('input', 'sp-color-picker');
      i2Picker.type = 'color';
      i2Picker.value = _rgbaToHex(iconStyle.color2);
      i2Picker.addEventListener('input', (e) => {
        iconStyle.color2 = e.target.value;
        SettingsStore.setIconStyle(iconStyle);
        applyThemeStyles();
        rebuildHelp();
      });
      const i2Hex = _el('input', 'sp-hex-input');
      i2Hex.type = 'text';
      i2Hex.value = iconStyle.color2;
      i2Hex.addEventListener('change', (e) => {
        iconStyle.color2 = e.target.value;
        SettingsStore.setIconStyle(iconStyle);
        applyThemeStyles();
        rebuildHelp();
      });
      i2Row.appendChild(i2Picker);
      i2Row.appendChild(i2Hex);
      i2Group.appendChild(i2Row);
      container.appendChild(i2Group);

      // Force direction to left-to-right as per user request
      iconStyle.direction = 'to right';
      SettingsStore.setIconStyle(iconStyle);
    }

  }

  function _renderContainerStyleSection(container) {
    const contHeader = _el('h3', 'sp-section-header');
    contHeader.textContent = 'Container Style';
    contHeader.style.marginTop = '1.25rem';
    container.appendChild(contHeader);

    const contStyle = SettingsStore.getContainerStyle();
    
    // Type toggle
    const contTypeGroup = _el('div', 'sp-field-group');
    contTypeGroup.innerHTML = '<label class="sp-field-label">Background Type</label>';
    const contTypeRow = _el('div', 'sp-mode-select');
    ['solid', 'gradient'].forEach(t => {
      const btn = _el('button', `sp-mode-btn${t === contStyle.type ? ' sp-mode-active' : ''}`);
      btn.textContent = t.charAt(0).toUpperCase() + t.slice(1);
      btn.addEventListener('click', () => {
        contStyle.type = t;
        SettingsStore.setContainerStyle(contStyle);
        applyThemeStyles();
        renderTab('appearance');
      });
      contTypeRow.appendChild(btn);
    });
    contTypeGroup.appendChild(contTypeRow);
    container.appendChild(contTypeGroup);

    // Color 1
    const cbGroup = _el('div', 'sp-field-group');
    cbGroup.innerHTML = `<label class="sp-field-label">${contStyle.type === 'gradient' ? 'Color 1 (RGBA/Hex)' : 'Background Color (RGBA/Hex)'}</label>`;
    const cbRow = _el('div', 'sp-color-row');
    const cbPicker = _el('input', 'sp-color-picker');
    cbPicker.type = 'color';
    cbPicker.value = _rgbaToHex(contStyle.color1);
    cbPicker.addEventListener('input', (e) => {
      contStyle.color1 = e.target.value;
      SettingsStore.setContainerStyle(contStyle);
      applyThemeStyles();
    });
    const cbHex = _el('input', 'sp-hex-input');
    cbHex.type = 'text';
    cbHex.value = contStyle.color1;
    cbHex.addEventListener('change', (e) => {
      contStyle.color1 = e.target.value;
      SettingsStore.setContainerStyle(contStyle);
      applyThemeStyles();
      cbPicker.value = _rgbaToHex(e.target.value);
    });
    cbRow.appendChild(cbPicker);
    cbRow.appendChild(cbHex);
    cbGroup.appendChild(cbRow);
    container.appendChild(cbGroup);

    if (contStyle.type === 'gradient') {
      const cb2Group = _el('div', 'sp-field-group');
      cb2Group.innerHTML = '<label class="sp-field-label">Color 2 (RGBA/Hex)</label>';
      const cb2Row = _el('div', 'sp-color-row');
      const cb2Picker = _el('input', 'sp-color-picker');
      cb2Picker.type = 'color';
      cb2Picker.value = _rgbaToHex(contStyle.color2);
      cb2Picker.addEventListener('input', (e) => {
        contStyle.color2 = e.target.value;
        SettingsStore.setContainerStyle(contStyle);
        applyThemeStyles();
      });
      const cb2Hex = _el('input', 'sp-hex-input');
      cb2Hex.type = 'text';
      cb2Hex.value = contStyle.color2;
      cb2Hex.addEventListener('change', (e) => {
        contStyle.color2 = e.target.value;
        SettingsStore.setContainerStyle(contStyle);
        applyThemeStyles();
        cb2Picker.value = _rgbaToHex(e.target.value);
      });
      cb2Row.appendChild(cb2Picker);
      cb2Row.appendChild(cb2Hex);
      cb2Group.appendChild(cb2Row);
      container.appendChild(cb2Group);

      // Direction
      const dirGroup = _el('div', 'sp-field-group');
      dirGroup.innerHTML = '<label class="sp-field-label">Direction</label>';
      const dirSelect = _el('select', 'sp-select');
      GRADIENT_DIRECTIONS.forEach(d => {
        const opt = document.createElement('option');
        opt.value = d.value;
        opt.textContent = d.label;
        if (d.value === contStyle.direction) opt.selected = true;
        dirSelect.appendChild(opt);
      });
      dirSelect.addEventListener('change', (e) => {
        contStyle.direction = e.target.value;
        SettingsStore.setContainerStyle(contStyle);
        applyThemeStyles();
      });
      dirGroup.appendChild(dirSelect);
      container.appendChild(dirGroup);
    }

    const blGroup = _el('div', 'sp-field-group');
    blGroup.innerHTML = '<label class="sp-field-label">Container Blur Depth (px)</label>';
    const blRow = _el('div', 'sp-color-row');
    const blInput = _el('input', 'sp-hex-input');
    blInput.type = 'number';
    blInput.min = '0';
    blInput.max = '100';
    blInput.value = contStyle.blur;
    blInput.addEventListener('change', (e) => {
      contStyle.blur = parseInt(e.target.value) || 0;
      SettingsStore.setContainerStyle(contStyle);
      applyThemeStyles();
    });
    blRow.appendChild(blInput);
    blGroup.appendChild(blRow);
    container.appendChild(blGroup);

  }

  function _renderThemeSection(container) {
    const themeGroup = _el('div', 'sp-field-group');
    themeGroup.innerHTML = '<label class="sp-field-label">Base Theme</label>';
    const themeRow = _el('div', 'sp-mode-select');
    const currentTheme = SettingsStore.getTheme();
    ['dark', 'light'].forEach(t => {
      const btn = _el('button', `sp-mode-btn${t === currentTheme ? ' sp-mode-active' : ''}`);
      btn.textContent = t === 'dark' ? '🌙 Dark' : '☀️ Light';
      btn.addEventListener('click', () => {
        applyTheme(t);
        renderTab('appearance');
      });
      themeRow.appendChild(btn);
    });
    themeGroup.appendChild(themeRow);
    container.appendChild(themeGroup);
  }

  function _renderResetSection(container) {
    const resetGroup = _el('div', 'sp-field-group');
    const resetBtn = _el('button', 'sp-btn-danger');
    resetBtn.textContent = '↻ Reset All Settings to Defaults';
    resetBtn.style.marginTop = '1rem';
    
    const confirmResetContainer = _el('div', 'sp-field-group');
    confirmResetContainer.style.display = 'none';
    confirmResetContainer.style.marginTop = '1rem';
    confirmResetContainer.innerHTML = '<label class="sp-field-label" style="color:#ff6b6b">Are you sure? This will delete all custom sites, backgrounds, and settings.</label>';
    
    const resetYes = _el('button', 'sp-btn-danger');
    resetYes.textContent = 'Yes, Reset Everything';
    resetYes.style.marginBottom = '0.5rem';
    
    const resetNo = _el('button', 'sp-btn-ghost');
    resetNo.textContent = 'Cancel';
    
    confirmResetContainer.appendChild(resetYes);
    confirmResetContainer.appendChild(resetNo);

    resetBtn.addEventListener('click', () => {
      resetBtn.style.display = 'none';
      confirmResetContainer.style.display = 'block';
    });
    
    resetNo.addEventListener('click', () => {
      confirmResetContainer.style.display = 'none';
      resetBtn.style.display = 'block';
    });
    
    resetYes.addEventListener('click', () => {
      Object.values(SettingsStore).forEach(() => {}); // no-op
      ['sp-commands', 'sp-bg-mode', 'sp-bg-solid', 'sp-bg-gradient',
       'sp-active-bg', 'sp-uploads', 'sp-theme', 'sp-icon-style',
       'sp-container-style', 'sp-categories', 'sp-effects', 'sp-widgets',
       'sp-clock'].forEach(k => localStorage.removeItem(k));
      location.reload();
    });

    resetGroup.appendChild(resetBtn);
    resetGroup.appendChild(confirmResetContainer);
    container.appendChild(resetGroup);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  PRESETS / EFFECTS / WIDGETS / BACKUP SECTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  function _renderPresetSection(container) {
    const h = _el('h3', 'sp-section-header');
    h.textContent = 'Theme Presets';
    container.appendChild(h);

    const group = _el('div', 'sp-field-group');
    const row = _el('div', 'sp-preset-row');

    PRESET_THEMES.forEach(p => {
      const wrap = _el('div', 'sp-preset-theme');
      const swatch = _el('div', 'sp-swatch');
      swatch.style.background = `linear-gradient(135deg, ${p.bg[0]}, ${p.bg[1]} 55%, ${p.accent1})`;
      swatch.title = p.name;
      swatch.addEventListener('click', () => {
        SettingsStore.setBgMode('gradient');
        SettingsStore.setBgGradient({ color1: p.bg[0], color2: p.bg[1], direction: '135deg' });
        const cs = SettingsStore.getContainerStyle();
        SettingsStore.setContainerStyle({ ...cs, type: 'solid', color1: p.container, color2: p.container });
        SettingsStore.setIconStyle({ type: 'gradient', color1: p.accent1, color2: p.accent2, direction: 'to right' });
        const fx = SettingsStore.getEffects();
        SettingsStore.setEffects({ ...fx, accent1: p.accent1, accent2: p.accent2, neon: p.neon });
        // Presets are dark themes — make sure text colors match
        SettingsStore.setTheme('dark');
        applyThemeVars('dark');
        applyThemeStyles();
        if (typeof Effects !== 'undefined') Effects.apply();
        rebuildHelp();
        renderTab('appearance');
      });
      const label = _el('div', 'sp-preset-name');
      label.textContent = p.name;
      wrap.appendChild(swatch);
      wrap.appendChild(label);
      row.appendChild(wrap);
    });

    group.appendChild(row);
    container.appendChild(group);
  }

  function _renderEffectsSection(container) {
    const fx = SettingsStore.getEffects();
    const group = _el('div', 'sp-field-group');
    [
      ['aurora',   'Aurora background'],
      ['texture',  'Dev doodle backdrop'],
      ['sheen',    'Cursor sheen on glass'],
      ['tilt',     '3D tilt on hover'],
      ['entrance', 'Entrance animation'],
      ['neon',     'Neon cyberpunk mode'],
    ].forEach(([key, label]) => {
      const row = _el('label', 'sp-toggle-row');
      const cb = _el('input');
      cb.type = 'checkbox';
      cb.checked = !!fx[key];
      cb.addEventListener('change', () => {
        const cur = SettingsStore.getEffects();
        cur[key] = cb.checked;
        SettingsStore.setEffects(cur);
        if (typeof Effects !== 'undefined') Effects.apply();
      });
      const span = _el('span');
      span.textContent = label;
      row.appendChild(cb);
      row.appendChild(_el('span', 'sp-switch'));
      row.appendChild(span);
      group.appendChild(row);
    });
    container.appendChild(group);

    // Backdrop type: looping video or the still SVG scene
    const bdGroup = _el('div', 'sp-field-group');
    bdGroup.innerHTML = '<label class="sp-field-label">Backdrop Type</label>';
    const bdRow = _el('div', 'sp-mode-select');
    const curBd = fx.backdrop === 'still' ? 'still' : 'video';
    [['video', '🎞 Video'], ['still', '🖼 Still Image']].forEach(([v, label]) => {
      const btn = _el('button', `sp-mode-btn${v === curBd ? ' sp-mode-active' : ''}`);
      btn.textContent = label;
      btn.addEventListener('click', () => {
        const cur = SettingsStore.getEffects();
        cur.backdrop = v;
        SettingsStore.setEffects(cur);
        if (typeof Effects !== 'undefined') Effects.apply();
        renderTab('appearance');
      });
      bdRow.appendChild(btn);
    });
    bdGroup.appendChild(bdRow);
    container.appendChild(bdGroup);

    // Accent colors + aurora intensity
    const acc = _el('div', 'sp-field-group');
    acc.innerHTML = '<label class="sp-field-label">Neon Accents &amp; Aurora Intensity</label>';
    const accRow = _el('div', 'sp-color-row');
    ['accent1', 'accent2'].forEach(key => {
      const p = _el('input', 'sp-color-picker');
      p.type = 'color';
      p.value = fx[key];
      p.title = key === 'accent1' ? 'Primary accent' : 'Secondary accent';
      p.addEventListener('input', (e) => {
        const cur = SettingsStore.getEffects();
        cur[key] = e.target.value;
        SettingsStore.setEffects(cur);
        if (typeof Effects !== 'undefined') Effects.apply();
      });
      accRow.appendChild(p);
    });
    const slider = _el('input', 'sp-range');
    slider.type = 'range';
    slider.min = '0';
    slider.max = '100';
    slider.value = fx.intensity !== undefined ? fx.intensity : 50;
    slider.title = 'Aurora intensity';
    slider.addEventListener('input', (e) => {
      const cur = SettingsStore.getEffects();
      cur.intensity = parseInt(e.target.value) || 0;
      SettingsStore.setEffects(cur);
      if (typeof Effects !== 'undefined') Effects.apply();
    });
    accRow.appendChild(slider);
    acc.appendChild(accRow);
    container.appendChild(acc);
  }

  function _renderWidgetsSection(container) {
    const w = SettingsStore.getWidgets();
    const group = _el('div', 'sp-field-group');
    [
      ['greeting', 'Greeting & dev quote'],
      ['github',   'GitHub contributions'],
      ['hn',       'Hacker News top stories'],
    ].forEach(([key, label]) => {
      const row = _el('label', 'sp-toggle-row');
      const cb = _el('input');
      cb.type = 'checkbox';
      cb.checked = !!w[key];
      cb.addEventListener('change', () => {
        const cur = SettingsStore.getWidgets();
        cur[key] = cb.checked;
        SettingsStore.setWidgets(cur);
        if (typeof Widgets !== 'undefined') Widgets.mount();
      });
      const span = _el('span');
      span.textContent = label;
      row.appendChild(cb);
      row.appendChild(_el('span', 'sp-switch'));
      row.appendChild(span);
      group.appendChild(row);
    });

    // Display name — shown in the header greeting (falls back to GitHub username)
    const nameGroup = _el('div', 'sp-field-group');
    nameGroup.style.marginTop = '0.5rem';
    nameGroup.innerHTML = '<label class="sp-field-label">Display Name (shown in greeting)</label>';
    const nameRow = _el('div', 'sp-color-row');
    const nameInput = _el('input', 'sp-input');
    nameInput.placeholder = 'e.g. Ghosh';
    nameInput.value = w.displayName || '';
    nameInput.style.flex = '1';
    const nameSave = _el('button', 'sp-btn-primary sp-btn-sm');
    nameSave.textContent = 'Save';
    nameSave.style.width = 'auto';
    const doNameSave = () => {
      const cur = SettingsStore.getWidgets();
      cur.displayName = nameInput.value.trim();
      SettingsStore.setWidgets(cur);
      if (typeof Widgets !== 'undefined') Widgets.mount(true);
      nameSave.textContent = '✓ Saved';
      setTimeout(() => { nameSave.textContent = 'Save'; }, 1500);
    };
    nameSave.addEventListener('click', doNameSave);
    nameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') doNameSave(); });
    const nameDel = _el('button', 'sp-btn-ghost sp-btn-sm');
    nameDel.textContent = '🗑';
    nameDel.title = 'Delete display name';
    nameDel.style.width = 'auto';
    nameDel.addEventListener('click', () => {
      nameInput.value = '';
      doNameSave();
    });
    nameRow.appendChild(nameInput);
    nameRow.appendChild(nameSave);
    nameRow.appendChild(nameDel);
    nameGroup.appendChild(nameRow);
    group.appendChild(nameGroup);

    const userGroup = _el('div', 'sp-field-group');
    userGroup.style.marginTop = '0.5rem';
    userGroup.innerHTML = '<label class="sp-field-label">GitHub Username</label>';
    const userRow = _el('div', 'sp-color-row');
    const input = _el('input', 'sp-input');
    input.placeholder = 'e.g. torvalds';
    input.value = w.githubUser || '';
    input.style.flex = '1';
    const saveBtn = _el('button', 'sp-btn-primary sp-btn-sm');
    saveBtn.textContent = 'Save';
    saveBtn.style.width = 'auto';
    const doSave = () => {
      const cur = SettingsStore.getWidgets();
      cur.githubUser = input.value.trim();
      SettingsStore.setWidgets(cur);
      if (typeof Widgets !== 'undefined') Widgets.mount(true);
      saveBtn.textContent = '✓ Saved';
      setTimeout(() => { saveBtn.textContent = 'Save'; }, 1500);
    };
    saveBtn.addEventListener('click', doSave);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') doSave(); });
    const ghDel = _el('button', 'sp-btn-ghost sp-btn-sm');
    ghDel.textContent = '🗑';
    ghDel.title = 'Delete GitHub username';
    ghDel.style.width = 'auto';
    ghDel.addEventListener('click', () => {
      input.value = '';
      doSave();
    });
    userRow.appendChild(input);
    userRow.appendChild(saveBtn);
    userRow.appendChild(ghDel);
    userGroup.appendChild(userRow);
    group.appendChild(userGroup);
    container.appendChild(group);
  }

  function _renderDataSection(container) {
    const group = _el('div', 'sp-field-group');
    const row = _el('div', 'sp-color-row');

    const exp = _el('button', 'sp-btn-primary');
    exp.textContent = '⬇ Export JSON';
    exp.addEventListener('click', () => SettingsStore.downloadExport());

    const imp = _el('button', 'sp-btn-ghost');
    imp.textContent = '⬆ Import JSON';
    imp.addEventListener('click', () => {
      const fi = document.createElement('input');
      fi.type = 'file';
      fi.accept = 'application/json,.json';
      fi.onchange = () => {
        const file = fi.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            SettingsStore.importAll(JSON.parse(e.target.result));
            location.reload();
          } catch {
            alert('Invalid settings file.');
          }
        };
        reader.readAsText(file);
      };
      fi.click();
    });

    row.appendChild(exp);
    row.appendChild(imp);
    group.appendChild(row);
    container.appendChild(group);
  }

  // ── Drag & drop reordering ──────────────────────────────────────────────────

  function _moveCommand(from, toIndex, targetCategory) {
    if (from === null || from === undefined) return;
    const cmds = SettingsStore.getCommands();
    if (from < 0 || from >= cmds.length) return;
    const item = cmds.splice(from, 1)[0];
    item.category = targetCategory;
    let insertAt;
    if (toIndex === -1) {
      insertAt = cmds.length; // append to end (dropped on section)
    } else {
      insertAt = toIndex;
      if (from < toIndex) insertAt = toIndex - 1;
    }
    cmds.splice(insertAt, 0, item);
    SettingsStore.setCommands(cmds);
    dragIndex = null;
    renderTab('sites');
    rebuildHelp();
  }

  function _moveCategory(from, to) {
    if (!from || !to || from === to) return;
    const cats = SettingsStore.getCategories();
    const fi = cats.indexOf(from);
    if (fi === -1) return;
    cats.splice(fi, 1);
    const ti = cats.indexOf(to);
    if (ti === -1) return;
    cats.splice(ti, 0, from);
    SettingsStore.setCategories(cats);
    dragCat = null;
    renderTab('sites');
    rebuildHelp();
  }

  // ── DOM Helpers ────────────────────────────────────────────────────────────

  function _el(tag, className) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    return el;
  }

  function _rgbaToHex(color) {
    if (!color) return '#ffffff';
    if (color.startsWith('#') && color.length === 7) return color;
    // Try to parse rgba
    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (match) {
      const r = parseInt(match[1]).toString(16).padStart(2, '0');
      const g = parseInt(match[2]).toString(16).padStart(2, '0');
      const b = parseInt(match[3]).toString(16).padStart(2, '0');
      return `#${r}${g}${b}`;
    }
    return '#ffffff';
  }

  // ── Init ───────────────────────────────────────────────────────────────────

  function init() {
    buildPanel();
    // Apply saved theme vars + stored styles (no store overwrites on boot)
    applyThemeVars(SettingsStore.getTheme());
    applyThemeStyles();
    // Build help panel with stored commands
    rebuildHelp();
  }

  return { init, rebuildHelp, applyThemeStyles, applyTheme };
})();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => SettingsPanel.init());
} else {
  SettingsPanel.init();
}
