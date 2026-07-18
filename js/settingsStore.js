/**
 * Settings Store — Central localStorage manager for all user settings.
 * 
 * Keys managed:
 *   sp-commands      — JSON array of site link objects
 *   sp-bg-mode       — 'solid' | 'gradient' | 'wallpaper'
 *   sp-bg-solid      — hex color string e.g. '#000000'
 *   sp-bg-gradient   — JSON { color1, color2, direction }
 *   sp-active-bg     — wallpaper id string
 *   sp-uploads       — JSON array of { id, label, src(base64) }
 *   sp-theme         — 'dark' | 'light'
 *   sp-icon-color    — hex or rgba for icon circle borders
 *   sp-underline-color — hex or rgba for hover underline bar
 *   sp-categories    — JSON array of category name strings
 */
const SettingsStore = (function () {
  const KEYS = {
    commands:       'sp-commands',
    bgMode:         'sp-bg-mode',
    bgSolid:        'sp-bg-solid',
    bgGradient:     'sp-bg-gradient',
    activeBg:       'sp-active-bg',
    uploads:        'sp-uploads',
    theme:          'sp-theme',
    iconStyle:      'sp-icon-style',
    containerStyle: 'sp-container-style',
    categories:     'sp-categories',
    effects:        'sp-effects',
    widgets:        'sp-widgets',
    clock:          'sp-clock',
  };

  // ── One-time migration to the v2 visual design ─────────────────────────────
  // Clears stored appearance values so the new modern defaults take over.
  // Sites, categories, widgets, and uploads are untouched.
  (function migrateUiV2() {
    try {
      if (localStorage.getItem('sp-ui-version') !== '2') {
        ['sp-container-style', 'sp-icon-style', 'sp-bg-mode', 'sp-bg-solid',
         'sp-bg-gradient', 'sp-active-bg', 'sp-effects'].forEach(k => localStorage.removeItem(k));
        localStorage.setItem('sp-ui-version', '2');
      }
    } catch {}
  })();

  // ── Generic helpers ─────────────────────────────────────────────────────────

  function _get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? JSON.parse(raw) : fallback;
    } catch { return fallback; }
  }

  function _set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  // ── Commands (site links) ──────────────────────────────────────────────────

  function getCommands() {
    const stored = _get(KEYS.commands, null);
    if (stored) {
      // Migration: Rename old default categories to 'Primary'
      let migrated = false;
      stored.forEach(cmd => {
        if (cmd.category === 'General' || cmd.category === 'Frequently Accessed') {
          cmd.category = 'Primary';
          migrated = true;
        }
      });
      // Inject dummy commands for test categories if missing
      if (!stored.find(c => c.category === 'Design')) {
        stored.push({ category: 'Design', name: 'Figma', key: 'f', url: 'https://figma.com' });
        stored.push({ category: 'Design', name: 'Dribbble', key: 'd', url: 'https://dribbble.com' });
        migrated = true;
      }
      if (!stored.find(c => c.category === 'Social')) {
        stored.push({ category: 'Social', name: 'Reddit', key: 'r', url: 'https://reddit.com' });
        stored.push({ category: 'Social', name: 'Twitter', key: 't', url: 'https://twitter.com' });
        migrated = true;
      }

      if (migrated) setCommands(stored);
      return stored;
    }
    // First run: seed from CONFIG.commands (the hardcoded defaults)
    const seed = CONFIG.commands.filter(c => c.category); // only categorized
    _set(KEYS.commands, seed);
    return seed;
  }

  function setCommands(commands) {
    _set(KEYS.commands, commands);
  }

  function addCommand(cmd) {
    const cmds = getCommands();
    cmds.push(cmd);
    setCommands(cmds);
    return cmds;
  }

  function updateCommand(index, updated) {
    const cmds = getCommands();
    if (index >= 0 && index < cmds.length) {
      cmds[index] = { ...cmds[index], ...updated };
      setCommands(cmds);
    }
    return cmds;
  }

  function deleteCommand(index) {
    const cmds = getCommands();
    if (index >= 0 && index < cmds.length) {
      cmds.splice(index, 1);
      setCommands(cmds);
    }
    return cmds;
  }

  // ── Categories ─────────────────────────────────────────────────────────────

  function getCategories() {
    const stored = _get(KEYS.categories, null);
    if (stored) {
      let migrated = false;
      for (let i = 0; i < stored.length; i++) {
        if (stored[i] === 'General' || stored[i] === 'Frequently Accessed') {
          stored[i] = 'Primary';
          migrated = true;
        }
      }
      if (!stored.includes('Design')) {
        stored.push('Design');
        migrated = true;
      }
      if (!stored.includes('Social')) {
        stored.push('Social');
        migrated = true;
      }
      if (migrated) setCategories(stored);
      return stored;
    }
    // Derive from commands
    const cmds = getCommands();
    const cats = [...new Set(cmds.map(c => c.category).filter(Boolean))];
    _set(KEYS.categories, cats);
    return cats;
  }

  function setCategories(cats) {
    _set(KEYS.categories, cats);
  }

  function addCategory(name) {
    const cats = getCategories();
    if (!cats.includes(name)) {
      cats.push(name);
      setCategories(cats);
    }
    return cats;
  }

  function deleteCategory(name) {
    let cats = getCategories();
    cats = cats.filter(c => c !== name);
    setCategories(cats);
    // Also remove commands in that category
    let cmds = getCommands();
    cmds = cmds.filter(c => c.category !== name);
    setCommands(cmds);
    return cats;
  }

  function renameCategory(oldName, newName) {
    let cats = getCategories();
    cats = cats.map(c => c === oldName ? newName : c);
    setCategories(cats);
    // Update commands
    let cmds = getCommands();
    cmds = cmds.map(c => c.category === oldName ? { ...c, category: newName } : c);
    setCommands(cmds);
    return cats;
  }

  // ── Background ─────────────────────────────────────────────────────────────

  function getBgMode() {
    return _get(KEYS.bgMode, 'gradient') || 'gradient';
  }

  function setBgMode(mode) {
    _set(KEYS.bgMode, mode);
  }

  function getBgSolid() {
    return _get(KEYS.bgSolid, '#000000') || '#000000';
  }

  function setBgSolid(color) {
    _set(KEYS.bgSolid, color);
  }

  function getBgGradient() {
    return _get(KEYS.bgGradient, {
      color1: '#0b0f1e',
      color2: '#171c36',
      direction: '160deg'
    });
  }

  function setBgGradient(gradient) {
    _set(KEYS.bgGradient, gradient);
  }

  // ── Wallpapers ─────────────────────────────────────────────────────────────

  function getActiveBg() {
    return _get(KEYS.activeBg, 'none') || 'none';
  }

  function setActiveBg(id) {
    _set(KEYS.activeBg, id);
  }

  function getUploads() {
    return _get(KEYS.uploads, []);
  }

  function setUploads(uploads) {
    _set(KEYS.uploads, uploads);
  }

  function addUpload(upload) {
    const uploads = getUploads();
    uploads.push(upload);
    setUploads(uploads);
    return uploads;
  }

  function deleteUpload(id) {
    let uploads = getUploads();
    uploads = uploads.filter(u => u.id !== id);
    setUploads(uploads);
    if (getActiveBg() === id) setActiveBg('none');
    return uploads;
  }

  // ── Theme ──────────────────────────────────────────────────────────────────

  function getTheme() {
    const raw = localStorage.getItem(KEYS.theme);
    return raw || 'dark';
  }

  function setTheme(theme) {
    localStorage.setItem(KEYS.theme, theme);
  }

  // ── Appearance ─────────────────────────────────────────────────────────────

  function getIconStyle() {
    return _get(KEYS.iconStyle, {
      type: 'gradient', // 'solid' | 'gradient'
      color1: '#22d3ee',
      color2: '#a78bfa',
      direction: 'to right'
    });
  }

  function setIconStyle(style) {
    _set(KEYS.iconStyle, style);
  }

  function getContainerStyle() {
    const raw = _get(KEYS.containerStyle, null);
    if (raw && typeof raw.bg === 'string') {
      return {
        type: 'solid',
        color1: raw.bg,
        color2: raw.bg,
        direction: 'to bottom right',
        blur: raw.blur !== undefined ? raw.blur : 12
      };
    }
    return raw || {
      type: 'solid',
      color1: 'rgba(16, 19, 32, 0.55)',
      color2: 'rgba(16, 19, 32, 0.55)',
      direction: 'to bottom right',
      blur: 18
    };
  }

  function setContainerStyle(style) {
    _set(KEYS.containerStyle, style);
  }

  // ── Effects (aurora, sheen, tilt, entrance, neon) ──────────────────────────

  function getEffects() {
    return Object.assign({
      aurora: true,
      texture: true,
      backdrop: 'video', // 'video' | 'still'
      sheen: true,
      tilt: true,
      entrance: true,
      neon: true,
      accent1: '#22d3ee',
      accent2: '#a78bfa',
      intensity: 40,
    }, _get(KEYS.effects, {}));
  }

  function setEffects(fx) {
    _set(KEYS.effects, fx);
  }

  // ── Widgets (greeting, github, hn) ─────────────────────────────────────────

  function getWidgets() {
    return Object.assign({
      greeting: true,
      github: false,
      githubUser: '',
      displayName: '',
      hn: false,
      sysstats: false, // CPU/RAM — only functional in the Chrome extension build
    }, _get(KEYS.widgets, {}));
  }

  function setWidgets(w) {
    _set(KEYS.widgets, w);
  }

  // ── Clock ('flip' | 'digital') ─────────────────────────────────────────────

  function getClockStyle() {
    const v = _get(KEYS.clock, 'flip') || 'flip';
    // migrate removed styles to the closest surviving one
    if (v === 'split' || v === 'glass') return 'flip';
    if (['casio', 'digital', 'flip'].indexOf(v) === -1) return 'digital';
    return v;
  }

  function setClockStyle(style) {
    _set(KEYS.clock, style);
  }

  // ── Export / Import ────────────────────────────────────────────────────────

  const ALL_KEYS = Object.values(KEYS).concat(['invertColorCookie', 'showKeysCookie']);

  function exportAll() {
    const out = {};
    ALL_KEYS.forEach(k => {
      const v = localStorage.getItem(k);
      if (v !== null) out[k] = v;
    });
    return out;
  }

  function importAll(obj) {
    if (!obj || typeof obj !== 'object') throw new Error('Invalid settings');
    Object.keys(obj).forEach(k => {
      if (ALL_KEYS.includes(k)) {
        const v = obj[k];
        localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
      }
    });
  }

  function downloadExport() {
    const blob = new Blob([JSON.stringify(exportAll(), null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'startup-page-settings.json';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  // ── Favicon helper ─────────────────────────────────────────────────────────

  function getFaviconUrl(siteUrl) {
    try {
      const domain = new URL(siteUrl).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
    } catch {
      return null;
    }
  }

  // ── Built-in wallpapers ────────────────────────────────────────────────────

  const BUILTIN_WALLPAPERS = [
    { id: 'none', label: 'None',    src: null },
    { id: 'w1',   label: 'Image 1', src: 'assets/wallpapers/Image1.jpg' },
    { id: 'w2',   label: 'Image 2', src: 'assets/wallpapers/image2.jpg' },
    { id: 'w3',   label: 'Image 3', src: 'assets/wallpapers/image3.jpg' },
    { id: 'w4',   label: 'Image 4', src: 'assets/wallpapers/image4.png' },
  ];

  function getAllWallpapers() {
    return [...BUILTIN_WALLPAPERS, ...getUploads()];
  }

  function deleteBuiltinWallpaper(id) {
    const idx = BUILTIN_WALLPAPERS.findIndex(w => w.id === id);
    if (idx > 0) BUILTIN_WALLPAPERS.splice(idx, 1); // never delete 'none'
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  return {
    // Commands
    getCommands, setCommands, addCommand, updateCommand, deleteCommand,
    // Categories
    getCategories, setCategories, addCategory, deleteCategory, renameCategory,
    // Background
    getBgMode, setBgMode,
    getBgSolid, setBgSolid,
    getBgGradient, setBgGradient,
    // Wallpapers
    getActiveBg, setActiveBg,
    getUploads, setUploads, addUpload, deleteUpload,
    getAllWallpapers, deleteBuiltinWallpaper,
    BUILTIN_WALLPAPERS,
    // Theme
    getTheme, setTheme,
    // Appearance
    getIconStyle, setIconStyle,
    getContainerStyle, setContainerStyle,
    // Effects & Widgets
    getEffects, setEffects,
    getWidgets, setWidgets,
    // Clock
    getClockStyle, setClockStyle,
    // Export / Import
    exportAll, importAll, downloadExport,
    // Helpers
    getFaviconUrl,
  };
})();
