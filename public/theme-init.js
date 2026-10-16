// Applies the saved theme before the app renders, so the page never flashes
// the wrong theme. An external file (not an inline <script>) because the MV3
// extension's Content Security Policy blocks inline scripts.
// Keep in sync with src/lib/skin.ts (skinFor).
(function () {
  try {
    var data = JSON.parse(localStorage.getItem('devdeck') || '{}');
    var s = (data && data.state && data.state.settings) || {};
    var mode = s.themeMode || 'dark';
    var html = document.documentElement;
    html.setAttribute('data-theme', mode);
    var sonoma = mode === 'light' && !s.backgroundImage && (!s.presetTheme || s.presetTheme === 'default-light');
    if (sonoma) html.setAttribute('data-skin', 'sonoma');
  } catch (e) {
    // Unreadable storage: the app applies the theme once it loads.
  }
})();
