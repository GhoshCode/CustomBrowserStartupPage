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

    // Background texture: faint network graph + scatter plots
    let tex = document.getElementById('bg-texture');
    if (fx.texture) {
      if (!tex) {
        tex = document.createElement('div');
        tex.id = 'bg-texture';
        tex.innerHTML = TEXTURE_SVG;
        body.prepend(tex);
      }
    } else if (tex) {
      tex.remove();
    }

    // Clear stale tilt transforms when tilt is switched off
    if (!fx.tilt) {
      document.querySelectorAll('.category').forEach(el => { el.style.transform = ''; });
    }
  }

  // Faint tech texture: a network graph (bottom center) and scatter/line plots (top right)
  const TEXTURE_SVG = (function () {
    // network graph nodes
    const nodes = [
      [820, 620], [940, 560], [1060, 640], [900, 720], [1040, 760],
      [760, 730], [1160, 700], [1180, 580], [660, 640], [880, 500],
      [1240, 660], [980, 840], [800, 830], [1120, 830],
    ];
    const edges = [
      [0, 1], [1, 2], [2, 4], [0, 3], [3, 4], [0, 5], [5, 8], [1, 9],
      [2, 7], [7, 10], [2, 6], [6, 10], [4, 11], [3, 12], [6, 13], [4, 13], [9, 0],
    ];
    let net = edges.map(([a, b]) =>
      `<line x1="${nodes[a][0]}" y1="${nodes[a][1]}" x2="${nodes[b][0]}" y2="${nodes[b][1]}"/>`
    ).join('');
    net += nodes.map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i % 3 ? 4 : 7}"/>`).join('');

    // scatter points (deterministic pseudo-random)
    let scatter = '';
    let seed = 42;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    for (let i = 0; i < 70; i++) {
      scatter += `<circle cx="${1250 + rnd() * 300}" cy="${60 + rnd() * 220}" r="2.2"/>`;
    }
    for (let i = 0; i < 40; i++) {
      scatter += `<circle cx="${1330 + rnd() * 240}" cy="${330 + rnd() * 160}" r="2.2"/>`;
    }
    // trend line + axes
    const chart = `
      <polyline points="1250,300 1310,250 1350,270 1410,190 1470,210 1530,130" fill="none"/>
      <line x1="1240" y1="50" x2="1240" y2="310"/><line x1="1240" y1="310" x2="1560" y2="310"/>`;

    return `
      <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
        <g class="tex-net">${net}</g>
        <g class="tex-scatter">${scatter}</g>
        <g class="tex-chart">${chart}</g>
      </svg>`;
  })();

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
