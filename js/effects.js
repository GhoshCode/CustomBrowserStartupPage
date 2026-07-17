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

    // Fixed backdrop: looping video wallpaper (assets/bg-video.mp4), tinted by
    // the accent color. Falls back to the SVG dev-doodle drawing if the video
    // is missing or can't play.
    let tex = document.getElementById('bg-texture');
    if (fx.texture) {
      const mode = fx.backdrop === 'still' ? 'still' : 'video';
      // rebuild the layer when the user switches video ↔ still
      if (tex && tex.dataset.mode !== mode) {
        tex.remove();
        tex = null;
      }
      if (!tex && mode === 'still') {
        // fixed still wallpaper (first frame of the video) with SVG fallback
        tex = document.createElement('div');
        tex.id = 'bg-texture';
        tex.dataset.mode = 'still';
        tex.className = 'has-media';
        const img = document.createElement('img');
        img.src = 'assets/bg-still.jpg';
        img.alt = '';
        img.addEventListener('error', () => {
          tex.classList.remove('has-media');
          tex.innerHTML = TEXTURE_SVG;
        });
        tex.appendChild(img);
        const stillTint = document.createElement('div');
        stillTint.className = 'bg-tint';
        tex.appendChild(stillTint);
        body.prepend(tex);
      } else if (!tex) {
        tex = document.createElement('div');
        tex.id = 'bg-texture';
        tex.dataset.mode = 'video';
        tex.className = 'has-video';

        const vid = document.createElement('video');
        vid.src = 'assets/bg-video.mp4';
        vid.autoplay = true;
        vid.loop = true;
        vid.muted = true;
        vid.playsInline = true;
        vid.setAttribute('muted', '');       // belt & suspenders for autoplay policy
        vid.setAttribute('playsinline', '');
        vid.addEventListener('error', () => {
          // video missing/unplayable → draw the SVG scene instead
          tex.classList.remove('has-video');
          tex.innerHTML = TEXTURE_SVG;
        });
        vid.addEventListener('canplay', () => { vid.play().catch(() => {}); });
        tex.appendChild(vid);

        // accent tint layer — re-colors the footage when the user changes accents
        const tint = document.createElement('div');
        tint.className = 'bg-tint';
        tex.appendChild(tint);

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

  // ── Dev-doodle backdrop ────────────────────────────────────────────────────
  // A fixed illustration layer: charts, ER diagrams, code, a CI pipeline and
  // network graphs — everything drawn in currentColor so it re-tints when the
  // user changes accent colors in Settings → Appearance.
  const TEXTURE_SVG = (function () {
    const bars = (x, y, heights, w, gap) => {
      let s = '';
      const maxH = Math.max.apply(null, heights);
      // gridlines
      for (let g = 0; g <= 3; g++) {
        const gy = y - (maxH * g / 3);
        s += `<line x1="${x - 8}" y1="${gy}" x2="${x + heights.length * (w + gap)}" y2="${gy}" stroke-dasharray="3 5" opacity="0.4"/>`;
      }
      heights.forEach((h, i) => {
        const bx = x + i * (w + gap);
        s += `<rect x="${bx}" y="${y - h}" width="${w}" height="${h}" fill="currentColor" fill-opacity="0.13" stroke-opacity="0.7"/>`;
        s += `<line x1="${bx}" y1="${y - h * 0.55}" x2="${bx + w}" y2="${y - h * 0.55}" opacity="0.5"/>`;
      });
      return s;
    };

    const net = (nodes, edges, r) => {
      let s = edges.map(([a, b]) =>
        `<line x1="${nodes[a][0]}" y1="${nodes[a][1]}" x2="${nodes[b][0]}" y2="${nodes[b][1]}" opacity="0.6"/>`
      ).join('');
      s += nodes.map(([x, y], i) =>
        `<circle cx="${x}" cy="${y}" r="${i % 4 === 0 ? r * 1.8 : r}" fill="currentColor" fill-opacity="0.35" stroke="none"/>`
      ).join('');
      return s;
    };

    const table = (x, y, title, rows, pk) => {
      const w = 132, rh = 26;
      let s = `<rect x="${x}" y="${y}" width="${w}" height="${rh}" fill="currentColor" fill-opacity="0.14"/>`;
      s += `<text x="${x + w / 2}" y="${y + 18}" text-anchor="middle" font-weight="bold">${title}</text>`;
      rows.forEach((rname, i) => {
        const ry = y + rh * (i + 1);
        s += `<rect x="${x}" y="${ry}" width="${w}" height="${rh}" fill="none"/>`;
        if (i === 0 && pk) s += `<text x="${x + 8}" y="${ry + 18}" font-weight="bold">PK</text>`;
        s += `<text x="${x + (i === 0 && pk ? 40 : 12)}" y="${ry + 18}">${rname}</text>`;
      });
      return s;
    };

    // pipeline node: circle with a simple glyph
    const pipeNode = (x, y) =>
      `<circle cx="${x}" cy="${y}" r="30" fill="currentColor" fill-opacity="0.08"/>
       <path d="M${x - 10} ${y + 8} L${x} ${y - 12} L${x + 10} ${y + 8} Z" fill="currentColor" fill-opacity="0.3" stroke="none"/>`;

    const arrow = (x1, x2, y) =>
      `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}"/>
       <path d="M${x2} ${y} l-10 -5 v10 Z" fill="currentColor" stroke="none" fill-opacity="0.8"/>`;

    // dense network graph (top right), medium (bottom right), sparse (bottom left)
    const n1 = [[1810, 300], [1900, 230], [1960, 330], [1850, 410], [1940, 450], [1750, 380], [1880, 500], [1980, 250], [1700, 250], [1790, 190], [1960, 420], [1730, 480]];
    const e1 = [[0, 1], [1, 2], [0, 3], [3, 4], [2, 4], [0, 5], [5, 3], [4, 6], [2, 7], [0, 8], [8, 9], [1, 9], [2, 10], [10, 6], [8, 5], [9, 7], [11, 5], [11, 6], [0, 2], [1, 3], [8, 3]];
    const n2 = [[1750, 750], [1850, 700], [1930, 790], [1790, 860], [1900, 900], [1720, 950], [1850, 1010], [1960, 960]];
    const e2 = [[0, 1], [1, 2], [2, 4], [0, 3], [3, 4], [3, 5], [5, 6], [4, 6], [4, 7]];
    const n3 = [[80, 880], [190, 830], [290, 900], [130, 990], [250, 1010], [60, 1080], [200, 1100], [320, 1060]];
    const e3 = [[0, 1], [1, 2], [0, 3], [3, 4], [2, 4], [3, 5], [4, 6], [5, 6], [4, 7]];

    // labeled stage box (CI pipeline, k8s parts)
    const labelBox = (x, y, w, label, fs) =>
      `<rect x="${x}" y="${y}" width="${w}" height="30" rx="5" fill="currentColor" fill-opacity="0.08"/>` +
      `<text x="${x + w / 2}" y="${y + 21}" text-anchor="middle" stroke="none" fill="currentColor" fill-opacity="0.7"${fs ? ` font-size="${fs}"` : ''}>${label}</text>`;

    // scatter points (deterministic)
    let seed = 7;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    let scatter = '';
    for (let i = 0; i < 34; i++) {
      const sx = 1120 + rnd() * 300;
      const sy = 870 + rnd() * 150 - (sx - 1120) * 0.25;
      scatter += `<circle cx="${sx}" cy="${sy}" r="4" fill="currentColor" fill-opacity="0.35" stroke="none"/>`;
    }

    const code = [
      // python API block (left)
      [95, 478, "import python port API"],
      [95, 510, "API route API():"],
      [119, 536, "return trepus='Software to-ap')"],
      [95, 562, '"""'],
      [95, 592, "clas Routechandler(.nous.uercet){"],
      [119, 618, "detioad o = business logic"],
      [119, 644, "if (tast.ogost) {"],
      [143, 670, 'returneuuess.querie("qutrs, queres")'],
      [119, 696, "}"],
      // JS block (left, lower)
      [95, 740, "JavaScript({) => {"],
      [119, 766, 'component=="Joun");'],
      [119, 792, "const ==nnenvenuebComponent())"],
      [119, 818, "const heoks = heosi;"],
      [143, 844, "enablen.heoks();"],
      [143, 870, "sconoleraetiost();"],
      [119, 896, "}}"],
      [95, 922, "};"],
      // import block (center)
      [465, 500, "import { new } from 'depot';"],
      [465, 526, "import { new } from 'DevOps';"],
      [465, 552, "import { data } from './app.cst';"],
      [465, 610, ".selector {"],
      [489, 636, "color: 90%;"],
      [489, 662, "origint: 10px;"],
      [465, 688, "}"],
      [465, 736, "<html>"],
      [465, 762, "<template>"],
      [489, 788, "<div class=\"todo-app\">"],
      [513, 814, "<src=template tool!</in>"],
      [489, 840, "</div>"],
      [465, 866, "</template>"],
      [200, 952, "⌥ git commit -m 'feat: user profile UI'"],
      // java block (bottom center-left)
      [330, 990, "public class DetaultService {"],
      [360, 1016, "public void build() {"],
      [390, 1042, "Data.snn.tService(onuete);"],
      [390, 1068, "return ons.oseEStringcine(user, service);"],
      [330, 1094, "}"],
    ].map(([x, y, t]) => `<text x="${x}" y="${y}" stroke="none" fill="currentColor" fill-opacity="0.55">${t.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</text>`).join('');

    // CI stage boxes: lint → unit-test → integration-test → security-scan → build → artifact-deploy
    const stages = [['lint', 62], ['unit-test', 92], ['integration-test', 138], ['security-scan', 122], ['build', 66], ['artifact-deploy', 134]];
    let ciX = 800;
    let ci = '';
    stages.forEach(([label, w], i) => {
      ci += labelBox(ciX, 505, w, label, 16);
      if (i < stages.length - 1) {
        ci += `<line x1="${ciX + w + 2}" y1="520" x2="${ciX + w + 16}" y2="520"/><path d="M${ciX + w + 16} 520 l-7 -4 v8 Z" fill="currentColor" stroke="none" fill-opacity="0.8"/>`;
      }
      ciX += w + 18;
    });

    // keep the scatter cluster available for future use
    void scatter;

    return `
    <svg viewBox="0 0 2000 1120" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg"
         fill="none" stroke="currentColor" stroke-width="2" font-family="ui-monospace, Consolas, monospace" font-size="21">
      <!-- abstract world map + connection arcs -->
      <g stroke="none" fill="currentColor" fill-opacity="0.07">
        <polygon points="620,120 760,90 830,150 780,230 700,260 640,200"/>
        <polygon points="780,290 830,270 860,360 810,430 770,360"/>
        <polygon points="1090,110 1160,90 1200,140 1150,170 1100,150"/>
        <polygon points="1080,190 1180,180 1220,280 1160,380 1100,320"/>
        <polygon points="1230,90 1450,70 1560,140 1500,240 1350,220 1260,160"/>
        <polygon points="1520,330 1620,320 1650,390 1560,410"/>
      </g>
      <g stroke-dasharray="2 6" opacity="0.45">
        <path d="M700 150 Q 1000 20 1300 120"/>
        <path d="M850 250 Q 1100 150 1400 200"/>
        <path d="M760 200 Q 1200 300 1560 350"/>
        <path d="M1150 130 Q 1350 60 1540 140"/>
      </g>
      <!-- bar charts -->
      <g>${bars(640, 210, [120, 95, 165, 190, 140], 56, 14)}</g>
      <g>${bars(1250, 200, [130, 105, 160, 90, 115], 50, 12)}</g>
      <g>${bars(85, 520, [80, 150, 110, 60], 58, 14)}</g>
      <!-- code editor window -->
      <g>
        <rect x="800" y="265" width="250" height="205" rx="6" fill="currentColor" fill-opacity="0.06"/>
        <line x1="800" y1="290" x2="1050" y2="290"/>
        <circle cx="814" cy="278" r="4" fill="currentColor" stroke="none" fill-opacity="0.5"/>
        <circle cx="828" cy="278" r="4" fill="currentColor" stroke="none" fill-opacity="0.5"/>
        <line x1="856" y1="290" x2="856" y2="470" opacity="0.5"/>
        ${[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => `<line x1="868" y1="${305 + i * 18}" x2="${910 + ((i * 53) % 120)}" y2="${305 + i * 18}" opacity="0.45"/>`).join('')}
        <line x1="925" y1="470" x2="925" y2="498"/>
        <path d="M925 500 l-6 -9 h12 Z" fill="currentColor" stroke="none" fill-opacity="0.8"/>
      </g>
      <!-- area chart + pie -->
      <path d="M1075 350 L1085 330 L1105 340 L1125 305 L1150 320 L1175 295 L1200 310 L1228 285 L1240 300 L1240 360 L1075 360 Z" fill="currentColor" fill-opacity="0.18" stroke="none"/>
      <polyline points="1075,350 1085,330 1105,340 1125,305 1150,320 1175,295 1200,310 1228,285 1240,300" opacity="0.8"/>
      <circle cx="1368" cy="305" r="58" fill="currentColor" fill-opacity="0.14" stroke="none"/>
      <path d="M1368 305 L1368 247 A58 58 0 0 1 1421 330 Z" fill="currentColor" fill-opacity="0.35" stroke="none"/>
      <!-- code snippets -->
      <g font-size="21">${code}</g>
      <!-- CI stage boxes -->
      <g font-size="16">${ci}</g>
      <g opacity="0.7">
        <line x1="1100" y1="542" x2="1100" y2="566"/>
        <path d="M1100 570 l-5 -8 h10 Z" fill="currentColor" stroke="none"/>
        <line x1="1116" y1="542" x2="1116" y2="566"/>
        <path d="M1116 570 l-5 -8 h10 Z" fill="currentColor" stroke="none"/>
      </g>
      <!-- icon pipeline row -->
      <g>
        ${pipeNode(730, 622)}${arrow(770, 830, 622)}
        ${pipeNode(870, 622)}${arrow(910, 960, 622)}
        ${pipeNode(1000, 622)}${arrow(1040, 1090, 622)}
        ${pipeNode(1130, 622)}${arrow(1170, 1220, 622)}
        <circle cx="1260" cy="622" r="30" fill="currentColor" fill-opacity="0.08"/>
        <text x="1260" y="629" text-anchor="middle" stroke="none" fill="currentColor" fill-opacity="0.6" font-size="17">aws</text>
        ${arrow(1295, 1360, 622)}
        <text x="1150" y="692" stroke="none" fill="currentColor" fill-opacity="0.55" font-size="18">Topic: new_orders</text>
        <path d="M770 652 Q 990 720 1104 706" opacity="0.5"/>
        <line x1="1104" y1="706" x2="1104" y2="735" opacity="0.6"/>
      </g>
      <!-- kafka / terraform row -->
      <g font-size="18">
        <circle cx="1102" cy="762" r="5" fill="currentColor" stroke="none" fill-opacity="0.7"/>
        <circle cx="1117" cy="747" r="5" fill="currentColor" stroke="none" fill-opacity="0.7"/>
        <circle cx="1117" cy="777" r="5" fill="currentColor" stroke="none" fill-opacity="0.7"/>
        <line x1="1102" y1="762" x2="1117" y2="747" opacity="0.7"/>
        <line x1="1102" y1="762" x2="1117" y2="777" opacity="0.7"/>
        <text x="1134" y="771" stroke="none" fill="currentColor" fill-opacity="0.75" font-weight="bold" font-size="26">kafka</text>
        <text x="900" y="740" stroke="none" fill="currentColor" fill-opacity="0.55">kubectl get nodes</text>
        <path d="M1385 745 l16 9 v18 l-16 -9 Z" fill="currentColor" fill-opacity="0.3" stroke="none"/>
        <path d="M1405 756 l16 9 v18 l-16 -9 Z" fill="currentColor" fill-opacity="0.3" stroke="none"/>
        <text x="1440" y="770" stroke="none" fill="currentColor" fill-opacity="0.55">terraform apply</text>
        <line x1="1375" y1="762" x2="1252" y2="762"/>
        <path d="M1250 762 l10 -5 v10 Z" fill="currentColor" stroke="none" fill-opacity="0.8"/>
      </g>
      <!-- kubernetes deployment diagram -->
      <g font-size="15" stroke-width="1.5">
        <rect x="880" y="820" width="590" height="235" rx="8" stroke-dasharray="8 8" opacity="0.7"/>
        <rect x="895" y="838" width="160" height="200" rx="6" fill="currentColor" fill-opacity="0.05"/>
        <text x="975" y="860" text-anchor="middle" stroke="none" fill="currentColor" fill-opacity="0.7" font-weight="bold">master</text>
        ${labelBox(910, 872, 130, 'kube-apiserver', 14)}
        ${labelBox(910, 916, 130, 'kube-apiserver', 14)}
        <line x1="975" y1="948" x2="975" y2="966" opacity="0.6"/>
        ${labelBox(925, 968, 100, 'etcd', 14)}
        <rect x="1105" y="838" width="165" height="200" rx="6" fill="currentColor" fill-opacity="0.04"/>
        <text x="1187" y="860" text-anchor="middle" stroke="none" fill="currentColor" fill-opacity="0.7" font-weight="bold">worker node</text>
        <rect x="1117" y="870" width="141" height="155" rx="5" opacity="0.7"/>
        <text x="1187" y="890" text-anchor="middle" stroke="none" fill="currentColor" fill-opacity="0.6">container</text>
        <text x="1127" y="915" stroke="none" fill="currentColor" fill-opacity="0.5">pod</text>
        <text x="1127" y="938" stroke="none" fill="currentColor" fill-opacity="0.5">containers:</text>
        <text x="1137" y="961" stroke="none" fill="currentColor" fill-opacity="0.5">resource limits</text>
        <text x="1127" y="995" stroke="none" fill="currentColor" fill-opacity="0.5">containers:</text>
        <text x="1137" y="1018" stroke="none" fill="currentColor" fill-opacity="0.5">resource limits</text>
        <rect x="1285" y="838" width="165" height="200" rx="6" fill="currentColor" fill-opacity="0.04"/>
        <text x="1367" y="860" text-anchor="middle" stroke="none" fill="currentColor" fill-opacity="0.7" font-weight="bold">worker node</text>
        <rect x="1297" y="870" width="141" height="155" rx="5" opacity="0.7"/>
        <text x="1367" y="890" text-anchor="middle" stroke="none" fill="currentColor" fill-opacity="0.6">container</text>
        <text x="1307" y="915" stroke="none" fill="currentColor" fill-opacity="0.5">pod</text>
        <text x="1307" y="938" stroke="none" fill="currentColor" fill-opacity="0.5">containers:</text>
        <text x="1317" y="961" stroke="none" fill="currentColor" fill-opacity="0.5">resource limits</text>
        <text x="1307" y="995" stroke="none" fill="currentColor" fill-opacity="0.5">containers:</text>
        <text x="1317" y="1018" stroke="none" fill="currentColor" fill-opacity="0.5">resource limits</text>
        <line x1="1057" y1="900" x2="1105" y2="900" opacity="0.6"/>
        <line x1="1270" y1="920" x2="1285" y2="920" opacity="0.6"/>
        ${table(1520, 845, 'Audit_Log', ['id', 'pest_name', 'audit_log'], true)}
        <line x1="1450" y1="900" x2="1520" y2="890" opacity="0.6"/>
        <text x="1520" y="1000" stroke="none" fill="currentColor" fill-opacity="0.55" font-size="18">kubectl get nodes</text>
      </g>
      <!-- ER diagram cluster -->
      <g font-size="16" stroke-width="1.5">
        ${table(1380, 460, 'Database', ['id', 'first_name', 'last_name', 'sekuuzer', 'age', 'product'], true)}
        ${table(1545, 418, 'Subnet', ['id', 'contold', 'username'], true)}
        ${table(1712, 418, 'Users', ['id', 'username', 'post_name', 'allow'], true)}
        ${table(1545, 578, 'Jenkins', ['id', 'post_name', 'contkild'], true)}
        ${table(1712, 585, 'Kubernetes', ['id', 'seadher'], true)}
        ${table(1545, 715, 'Database', ['id', 'post_name'], true)}
        ${table(1856, 490, 'Subscription', ['id', 'payment', 'audit_log'], true)}
        <line x1="1512" y1="495" x2="1545" y2="460" opacity="0.6"/>
        <line x1="1512" y1="560" x2="1545" y2="630" opacity="0.6"/>
        <line x1="1677" y1="470" x2="1712" y2="470" opacity="0.6"/>
        <line x1="1677" y1="630" x2="1712" y2="630" opacity="0.6"/>
        <line x1="1512" y1="600" x2="1545" y2="755" opacity="0.6"/>
        <line x1="1844" y1="500" x2="1856" y2="530" opacity="0.6"/>
      </g>
      <!-- network graphs -->
      <g>${net(n1, e1, 5)}</g>
      <g>${net(n2, e2, 5)}</g>
      <g>${net(n3, e3, 5)}</g>
      <!-- bottom bars -->
      <g>${bars(620, 1120, [90, 150, 120], 60, 15)}</g>
      <!-- footer caption -->
      <text x="1000" y="1104" text-anchor="middle" stroke="none" fill="currentColor" fill-opacity="0.6" font-size="27" letter-spacing="3" font-weight="bold">DEEP ARCHITECTURE &amp; LOGISTICS WORKFLOW v2.1 | MULTI-REGION KUBERNETES DEPLOYMENT | REAL-TIME METRICS</text>
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
