/**
 * Effects — makes the page feel alive.
 *  - Aurora: slow-drifting neon blobs behind the glass (gives backdrop-filter something to refract)
 *  - Sheen: cursor-tracking light across glass panels
 *  - Tilt: subtle 3D tilt of glass containers toward the cursor
 *  - Entrance: staggered rise-in animation
 *  - Neon: cyberpunk accent glow (colors configurable in Settings → Effects)
 * All toggles persist via SettingsStore ('sp-effects').
 */
const Effects = (function () {

  function hexToRgba(hex, a) {
    const m = (hex || '#00f0ff').replace('#', '');
    const v = m.length === 3 ? m.split('').map(c => c + c).join('') : m;
    const n = parseInt(v, 16);
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
  }

  function apply() {
    const fx = SettingsStore.getEffects();
    const root = document.documentElement;
    const body = document.body;

    root.style.setProperty('--accent1', fx.accent1);
    root.style.setProperty('--accent2', fx.accent2);
    root.style.setProperty('--accent1-glow', hexToRgba(fx.accent1, 0.35));
    root.style.setProperty('--accent2-glow', hexToRgba(fx.accent2, 0.35));
    root.style.setProperty('--fx-intensity', (fx.intensity !== undefined ? fx.intensity : 50) / 100);

    body.classList.toggle('neon', !!fx.neon);
    body.classList.toggle('fx-entrance', !!fx.entrance);
    body.classList.toggle('fx-sheen', !!fx.sheen);

    let layer = document.getElementById('aurora-layer');
    if (fx.aurora) {
      if (!layer) {
        layer = document.createElement('div');
        layer.id = 'aurora-layer';
        layer.innerHTML = `
          <div class="aurora-blob aurora-b1"></div>
          <div class="aurora-blob aurora-b2"></div>
          <div class="aurora-blob aurora-b3"></div>`;
        body.prepend(layer);
      }
    } else if (layer) {
      layer.remove();
    }

    // Clear stale tilt transforms when tilt is switched off
    if (!fx.tilt) {
      document.querySelectorAll('.category').forEach(el => { el.style.transform = ''; });
    }
  }

  // ── Cursor sheen + tilt ──────────────────────────────────────────────────
  // Delegated on document so it survives help-panel rebuilds.
  let rafPending = false;
  let lastEvent = null;

  document.addEventListener('mousemove', (e) => {
    lastEvent = e;
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(() => {
      rafPending = false;
      const fx = SettingsStore.getEffects();
      if (!fx.sheen && !fx.tilt) return;
      const ev = lastEvent;
      document.querySelectorAll('.category, .dw-card').forEach(el => {
        const r = el.getBoundingClientRect();
        if (!r.width) return;
        const x = ev.clientX - r.left;
        const y = ev.clientY - r.top;
        if (fx.sheen) {
          el.style.setProperty('--mx', x + 'px');
          el.style.setProperty('--my', y + 'px');
        }
        if (fx.tilt && el.classList.contains('category')) {
          const inside = x >= 0 && y >= 0 && x <= r.width && y <= r.height;
          if (inside) {
            const rx = ((y / r.height) - 0.5) * -1.6;
            const ry = ((x / r.width) - 0.5) * 1.6;
            el.style.transform = `perspective(1400px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
          } else if (el.style.transform) {
            el.style.transform = '';
          }
        }
      });
    });
  }, { passive: true });

  function init() { apply(); }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return { apply };
})();
