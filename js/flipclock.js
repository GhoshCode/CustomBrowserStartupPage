/**
 * FlipClock — Fliqlo-style landing clock.
 *  - Two styles, selectable in Settings: 'flip' (split-flap cards) or 'digital'
 *  - Landing state: big clock centered on screen
 *  - Hover/click: clock shrinks and flies into the greeting card slot,
 *    the dashboard grid fades in behind it ("docking")
 *  - A mini clock lives permanently inside the greeting widget
 */
const FlipClock = (function () {
  let landingEl = null;
  let registry = []; // rendered clocks: { root, type, ... }

  const is24 = () => CONFIG.twentyFourHourClock;

  function now() {
    const d = new Date();
    let h = d.getHours();
    let ampm = '';
    if (!is24()) {
      ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12 || 12;
    }
    return { h: $.pad(h), m: $.pad(d.getMinutes()), ampm };
  }

  // ── Flip card ──────────────────────────────────────────────────────────────
  function buildFlipCard() {
    const fc = document.createElement('div');
    fc.className = 'fc';
    fc.innerHTML = `
      <div class="fc-half fc-top"><span></span></div>
      <div class="fc-half fc-bottom"><span></span></div>
      <div class="fc-half fc-flip fc-flip-top"><span></span></div>
      <div class="fc-half fc-flip fc-flip-bottom"><span></span></div>`;
    fc.dataset.v = '';
    return fc;
  }

  function setCard(fc, v) {
    if (fc.dataset.v === v) return;
    const spans = fc.querySelectorAll('span');
    const top = spans[0], bottom = spans[1], flipTop = spans[2], flipBottom = spans[3];

    if (!fc.dataset.v) {
      // first paint — no animation
      spans.forEach(s => { s.textContent = v; });
      fc.dataset.v = v;
      return;
    }

    const old = fc.dataset.v;
    flipTop.textContent = old;    // flap that folds away shows the old value
    flipBottom.textContent = v;   // flap that folds down shows the new value
    top.textContent = v;          // revealed as the old flap folds
    bottom.textContent = old;     // stays old until the new flap lands
    fc.dataset.v = v;

    fc.classList.remove('flipping');
    void fc.offsetWidth; // restart animation
    fc.classList.add('flipping');
    clearTimeout(fc._t);
    fc._t = setTimeout(() => {
      bottom.textContent = v;
      fc.classList.remove('flipping');
    }, 660);
  }

  // ── Builders ───────────────────────────────────────────────────────────────
  function buildInto(container, sizeClass) {
    container.innerHTML = '';
    const style = SettingsStore.getClockStyle();

    if (style === 'flip') {
      const root = document.createElement('div');
      root.className = 'flip-clock ' + sizeClass;
      const hCard = buildFlipCard();
      const mCard = buildFlipCard();
      root.appendChild(hCard);
      root.appendChild(mCard);
      let ampmEl = null;
      if (!is24()) {
        ampmEl = document.createElement('span');
        ampmEl.className = 'fc-ampm';
        hCard.appendChild(ampmEl);
      }
      container.appendChild(root);
      registry.push({ root, type: 'flip', hCard, mCard, ampmEl });
    } else {
      const root = document.createElement('time');
      root.className = 'lc-digital ' + sizeClass;
      const text = document.createElement('span');
      const ampmEl = document.createElement('span');
      ampmEl.className = 'lc-ampm';
      root.appendChild(text);
      root.appendChild(ampmEl);
      container.appendChild(root);
      registry.push({ root, type: 'digital', text, ampmEl });
    }
    tickOnce();
  }

  function tickOnce() {
    const t = now();
    registry = registry.filter(c => document.contains(c.root));
    registry.forEach(c => {
      if (c.type === 'flip') {
        setCard(c.hCard, t.h);
        setCard(c.mCard, t.m);
        if (c.ampmEl) c.ampmEl.textContent = t.ampm;
      } else {
        c.text.textContent = t.h + (CONFIG.clockDelimiter || ' ') + t.m;
        c.ampmEl.textContent = t.ampm;
      }
    });
  }

  // ── Landing clock + docking animation ─────────────────────────────────────
  function mountLanding() {
    const center = document.querySelector('body > .center');
    if (!center) return;
    landingEl = document.createElement('div');
    landingEl.id = 'landing-clock';
    landingEl.title = 'Open dashboard';
    center.appendChild(landingEl);
    buildInto(landingEl, 'fc-lg');
    landingEl.addEventListener('mouseenter', dock);
    landingEl.addEventListener('click', dock);
  }

  let docking = false;

  function dock() {
    if (docking || document.body.classList.contains('help')) return;
    docking = true;
    document.body.classList.add('clock-docking');
    $.bodyClassAdd('help');

    const finish = () => {
      document.body.classList.remove('clock-docking');
      if (landingEl) {
        landingEl.style.transition = 'none';
        landingEl.style.transform = '';
        landingEl.style.opacity = '';
      }
      docking = false;
    };

    // two frames: let the grid render so the slot has a position
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const slot = document.getElementById('mini-clock-slot');
      if (!slot || !landingEl) { finish(); return; }
      const b = landingEl.getBoundingClientRect();
      const s = slot.getBoundingClientRect();
      if (!b.height || !s.height) { finish(); return; }
      const scale = Math.max(0.04, s.height / b.height);
      const dx = (s.left + s.width / 2) - (b.left + b.width / 2);
      const dy = (s.top + s.height / 2) - (b.top + b.height / 2);
      landingEl.style.transformOrigin = 'center center';
      landingEl.style.transition = 'transform 0.7s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.28s 0.55s ease';
      landingEl.style.transform = `translate(${dx}px, ${dy}px) scale(${scale})`;
      landingEl.style.opacity = '0';
      setTimeout(finish, 900);
    }));
  }

  // ── Mini clock (inside the greeting card) ──────────────────────────────────
  function mountMini(slot) {
    if (!slot) return;
    buildInto(slot, 'fc-sm');
  }

  // Re-render everything (after style change in Settings)
  function apply() {
    if (landingEl) buildInto(landingEl, 'fc-lg');
    const slot = document.getElementById('mini-clock-slot');
    if (slot) buildInto(slot, 'fc-sm');
  }

  function init() {
    mountLanding();
    setInterval(tickOnce, 500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return { mountMini, apply };
})();
