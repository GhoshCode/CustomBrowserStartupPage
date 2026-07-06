/**
 * Theme & Background Switcher with Upload Support
 * - Dark/Light theme toggle (persisted in localStorage)
 * - Built-in wallpapers from assets/wallpapers/
 * - User uploads stored as base64 in localStorage (no server needed)
 */
(function () {
  const BUILTIN_WALLPAPERS = [
    { id: 'none',   label: 'None',    src: null },
    { id: 'w1',     label: 'Image 1', src: 'assets/wallpapers/Image1.jpg' },
    { id: 'w2',     label: 'Image 2', src: 'assets/wallpapers/image2.jpg' },
    { id: 'w3',     label: 'Image 3', src: 'assets/wallpapers/image3.jpg' },
  ];

  const STORAGE_THEME_KEY    = 'sp-theme';
  const STORAGE_BG_KEY       = 'sp-active-bg';   // stores an id string
  const STORAGE_UPLOADS_KEY  = 'sp-uploads';      // stores JSON array of {id, label, src(base64)}

  let isDark        = true;
  let activeBgId    = 'none';
  let userUploads   = [];   // [{id, label, src}]

  // ── Persisted state helpers ───────────────────────────────────────────────────

  function loadUploads() {
    try {
      const raw = localStorage.getItem(STORAGE_UPLOADS_KEY);
      userUploads = raw ? JSON.parse(raw) : [];
    } catch { userUploads = []; }
  }

  function saveUploads() {
    localStorage.setItem(STORAGE_UPLOADS_KEY, JSON.stringify(userUploads));
  }

  function allWallpapers() {
    return [...BUILTIN_WALLPAPERS, ...userUploads];
  }

  // ── Theme ─────────────────────────────────────────────────────────────────────

  function applyTheme(dark) {
    isDark = dark;
    const root = document.documentElement;
    if (dark) {
      root.style.setProperty('--background', '#0E0E0E');
      root.style.setProperty('--foreground', '#F1F1F1');
      root.style.setProperty('--icon-circle-bg', '#1a1a1a');
      root.style.setProperty('--icon-circle-border', '#1a1a1a');
      root.style.setProperty('--icon-invert', '0');
      document.body.style.backgroundColor = '#0E0E0E';
    } else {
      root.style.setProperty('--background', '#F0F0F0');
      root.style.setProperty('--foreground', '#111111');
      root.style.setProperty('--icon-circle-bg', '#ffffff');
      root.style.setProperty('--icon-circle-border', '#d0d0d0');
      root.style.setProperty('--icon-invert', '1');
      document.body.style.backgroundColor = '#F0F0F0';
    }
    localStorage.setItem(STORAGE_THEME_KEY, dark ? 'dark' : 'light');

    // Re-apply the current wallpaper so it isn't lost
    applyBackground(activeBgId);

    const btn = document.getElementById('sp-theme-btn');
    if (btn) {
      btn.textContent = dark ? '☀️' : '🌙';
      btn.title = dark ? 'Switch to Light Mode' : 'Switch to Dark Mode';
    }
  }

  // ── Background ────────────────────────────────────────────────────────────────

  function applyBackground(id) {
    activeBgId = id;
    localStorage.setItem(STORAGE_BG_KEY, id);
    const entry = allWallpapers().find(w => w.id === id);
    if (!entry || !entry.src) {
      document.body.style.backgroundImage = 'none';
    } else {
      document.body.style.backgroundImage   = `url('${entry.src}')`;
      document.body.style.backgroundSize    = 'cover';
      document.body.style.backgroundPosition = 'center';
      document.body.style.backgroundRepeat  = 'no-repeat';
      document.body.style.backgroundAttachment = 'fixed';
    }
    refreshGrid();
  }

  // ── Upload handler ────────────────────────────────────────────────────────────

  function handleUpload(file) {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = function (e) {
      const id    = 'upload-' + Date.now();
      const label = file.name.replace(/\.[^.]+$/, '');
      const src   = e.target.result; // base64 data URL
      userUploads.push({ id, label, src });
      saveUploads();
      refreshGrid();
      applyBackground(id); // auto-apply the new upload
    };
    reader.readAsDataURL(file);
  }

  // ── Delete confirmation helper ────────────────────────────────────────────────

  let confirmPending = null; // id of wallpaper pending delete

  function showConfirm(id, label) {
    confirmPending = id;
    const confirm = document.getElementById('sp-confirm-bar');
    if (!confirm) return;
    confirm.style.display = 'flex';
    const msg = document.getElementById('sp-confirm-msg');
    if (msg) msg.textContent = `Delete "${label}"?`;
  }

  function hideConfirm() {
    confirmPending = null;
    const confirm = document.getElementById('sp-confirm-bar');
    if (confirm) confirm.style.display = 'none';
  }

  function executeDelete(id) {
    // Built-in: remove from BUILTIN_WALLPAPERS array at runtime
    const builtinIdx = BUILTIN_WALLPAPERS.findIndex(w => w.id === id);
    if (builtinIdx > 0) BUILTIN_WALLPAPERS.splice(builtinIdx, 1); // 0 = 'none', never delete
    // Upload
    userUploads = userUploads.filter(u => u.id !== id);
    saveUploads();
    if (activeBgId === id) applyBackground('none');
    else refreshGrid();
    hideConfirm();
  }

  // ── Grid rendering ────────────────────────────────────────────────────────────

  function refreshGrid() {
    const grid = document.getElementById('sp-bg-grid');
    if (!grid) return;
    grid.innerHTML = '';

    allWallpapers().forEach(w => {
      const thumb = document.createElement('div');
      thumb.className = 'sp-bg-thumb';
      thumb.id = `sp-bg-prev-${w.id}`;
      thumb.title = w.label;

      if (!w.src) {
        thumb.style.background = '#1a1a1a';
        thumb.innerHTML = '<span style="font-size:16px;display:flex;height:100%;align-items:center;justify-content:center;">✕</span>';
      } else {
        thumb.style.backgroundImage    = `url('${w.src}')`;
        thumb.style.backgroundSize     = 'cover';
        thumb.style.backgroundPosition = 'center';
      }

      if (w.id === activeBgId) thumb.classList.add('sp-bg-active');

      // Delete button on every thumb except 'none'
      if (w.id !== 'none') {
        const del = document.createElement('span');
        del.className = 'sp-thumb-del';
        del.textContent = '×';
        del.title = 'Delete';
        del.addEventListener('click', (e) => {
          e.stopPropagation();
          showConfirm(w.id, w.label);
        });
        thumb.appendChild(del);
      }

      thumb.addEventListener('click', () => applyBackground(w.id));
      grid.appendChild(thumb);
    });

    // Upload tile at the end
    const uploadTile = document.createElement('div');
    uploadTile.className = 'sp-bg-thumb sp-upload-tile';
    uploadTile.title = 'Upload image';
    uploadTile.innerHTML = '<span style="font-size:22px;display:flex;height:100%;align-items:center;justify-content:center;">＋</span>';
    uploadTile.addEventListener('click', () => {
      document.getElementById('sp-file-input').click();
    });
    grid.appendChild(uploadTile);
  }

  // ── Build Widget ──────────────────────────────────────────────────────────────

  function buildWidget() {
    // Hidden file input
    const fileInput = document.createElement('input');
    fileInput.type    = 'file';
    fileInput.id      = 'sp-file-input';
    fileInput.accept  = 'image/*';
    fileInput.style.display = 'none';
    fileInput.addEventListener('change', (e) => {
      if (e.target.files[0]) handleUpload(e.target.files[0]);
      fileInput.value = ''; // reset so same file can be re-uploaded
    });
    document.body.appendChild(fileInput);

    // Main widget container
    const widget = document.createElement('div');
    widget.id = 'sp-widget';

    // ---- Panel ----
    const panel = document.createElement('div');
    panel.id = 'sp-panel';

    const panelLabel = document.createElement('p');
    panelLabel.id = 'sp-panel-label';
    panelLabel.textContent = 'Wallpaper';
    panel.appendChild(panelLabel);

    const grid = document.createElement('div');
    grid.id = 'sp-bg-grid';
    panel.appendChild(grid);

    // ---- Inline confirm bar ----
    const confirmBar = document.createElement('div');
    confirmBar.id = 'sp-confirm-bar';
    confirmBar.style.display = 'none';

    const confirmMsg = document.createElement('span');
    confirmMsg.id = 'sp-confirm-msg';
    confirmBar.appendChild(confirmMsg);

    const confirmActions = document.createElement('div');
    confirmActions.id = 'sp-confirm-actions';

    const confirmYes = document.createElement('button');
    confirmYes.id = 'sp-confirm-yes';
    confirmYes.textContent = 'Delete';
    confirmYes.addEventListener('click', () => {
      if (confirmPending) executeDelete(confirmPending);
    });

    const confirmNo = document.createElement('button');
    confirmNo.id = 'sp-confirm-no';
    confirmNo.textContent = 'Cancel';
    confirmNo.addEventListener('click', hideConfirm);

    confirmActions.appendChild(confirmYes);
    confirmActions.appendChild(confirmNo);
    confirmBar.appendChild(confirmActions);
    panel.appendChild(confirmBar);

    const hint = document.createElement('p');
    hint.id = 'sp-panel-hint';
    hint.textContent = 'Click ＋ to upload • Saved locally';
    panel.appendChild(hint);

    widget.appendChild(panel);

    // ---- Buttons row ----
    const btns = document.createElement('div');
    btns.id = 'sp-btns';

    const themeBtn = document.createElement('button');
    themeBtn.id = 'sp-theme-btn';
    themeBtn.addEventListener('click', () => applyTheme(!isDark));
    btns.appendChild(themeBtn);

    const bgBtn = document.createElement('button');
    bgBtn.id    = 'sp-bg-btn';
    bgBtn.title = 'Change Wallpaper';
    bgBtn.textContent = '🖼️';
    bgBtn.addEventListener('mouseenter', () => panel.classList.add('sp-panel-visible'));
    widget.addEventListener('mouseleave', () => panel.classList.remove('sp-panel-visible'));
    btns.appendChild(bgBtn);

    widget.appendChild(btns);
    document.body.appendChild(widget);
  }

  // ── Init ──────────────────────────────────────────────────────────────────────

  function init() {
    loadUploads();
    buildWidget();
    refreshGrid();

    const savedTheme = localStorage.getItem(STORAGE_THEME_KEY);
    applyTheme(savedTheme !== 'light');

    const savedBg = localStorage.getItem(STORAGE_BG_KEY);
    applyBackground(savedBg && allWallpapers().some(w => w.id === savedBg) ? savedBg : 'none');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
