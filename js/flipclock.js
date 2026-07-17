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
  // Card engine (split-flap animation) skins vs text engine skins
  const CARD_SKINS = {
    flip:  'fc-skin-flip',    // Fliqlo
    split: 'fc-skin-split',   // Mechanical split-flap (hinge pins, metal frame)
    glass: 'fc-skin-glass',   // Skeuomorphic glassmorphism
  };
  const TEXT_SKINS = {
    digital: 'dg-skin-digital', // classic digital
    minimal: 'dg-skin-minimal', // ultra-minimalist typographic
    nixie:   'dg-skin-nixie',   // retro-futuristic nixie tubes
    brutal:  'dg-skin-brutal',  // neo-brutalist / cyberpunk
  };

  function buildInto(container, sizeClass) {
    container.innerHTML = '';
    const style = SettingsStore.getClockStyle();

    if (CARD_SKINS[style]) {
      const root = document.createElement('div');
      root.className = 'flip-clock ' + sizeClass + ' ' + CARD_SKINS[style];
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
      registry.push({ root, type: 'card', hCard, mCard, ampmEl });
    } else {
      const skin = TEXT_SKINS[style] || TEXT_SKINS.digital;
      const root = document.createElement('time');
      root.className = 'digi-clock ' + sizeClass + ' ' + skin;
      const digits = [];
      ['dg-h', 'dg-h', null, 'dg-m', 'dg-m'].forEach(cls => {
        if (cls === null) {
          const sep = document.createElement('span');
          sep.className = 'dg-sep';
          sep.textContent = ':';
          root.appendChild(sep);
        } else {
          const d = document.createElement('span');
          d.className = 'dg ' + cls;
          root.appendChild(d);
          digits.push(d);
        }
      });
      let ampmEl = null;
      if (!is24()) {
        ampmEl = document.createElement('span');
        ampmEl.className = 'lc-ampm';
        root.appendChild(ampmEl);
      }
      container.appendChild(root);
      registry.push({ root, type: 'text', digits, ampmEl });
    }
    tickOnce();
  }

  function tickOnce() {
    const t = now();
    registry = registry.filter(c => document.contains(c.root));
    registry.forEach(c => {
      if (c.type === 'card') {
        setCard(c.hCard, t.h);
        setCard(c.mCard, t.m);
        if (c.ampmEl) c.ampmEl.textContent = t.ampm;
      } else {
        const str = t.h + t.m;
        c.digits.forEach((d, i) => {
          if (d.textContent !== str[i]) {
            d.textContent = str[i];
            d.classList.remove('dg-change');
            void d.offsetWidth;
            d.classList.add('dg-change');
          }
        });
        if (c.ampmEl) c.ampmEl.textContent = t.ampm;
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

    // Screensaver-style wake: real mouse movement anywhere docks the clock.
    // Armed after a short delay (ignores the phantom move event on page load)
    // and re-armed with a pause whenever the user returns to the clock (Esc).
    let wakeArmed = false;
    let origin = null;
    let armT = setTimeout(() => { wakeArmed = true; }, 700);

    document.addEventListener('mousemove', (e) => {
      if (!wakeArmed || docking || document.body.classList.contains('help')) {
        origin = null;
        return;
      }
      if (!origin) { origin = [e.clientX, e.clientY]; return; }
      if (Math.hypot(e.clientX - origin[0], e.clientY - origin[1]) > 30) {
        origin = null;
        // dock(); // Disabled so the clock can be hovered
      }
    }, { passive: true });

    new MutationObserver(() => {
      if (!document.body.classList.contains('help')) {
        wakeArmed = false;
        origin = null;
        clearTimeout(armT);
        armT = setTimeout(() => { wakeArmed = true; }, 900);
      }
    }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
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
