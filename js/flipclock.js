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
    return {
      h: $.pad(h),
      m: $.pad(d.getMinutes()),
      s: $.pad(d.getSeconds()),
      sec: d.getSeconds(),
      ampm,
    };
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
  // Three styles: 'casio' (clean digits), 'digital' (bold + small secs), 'flip' (Fliqlo).
  // All show HH:MM:SS; the ':' separators alternate accent color every second.

  // ── True 7-segment LCD digits (for the 'casio' style) ─────────────────────
  const SEG_MAP = {
    '0': 'abcdef', '1': 'bc', '2': 'abged', '3': 'abgcd', '4': 'fgbc',
    '5': 'afgcd', '6': 'afgcde', '7': 'abc', '8': 'abcdefg', '9': 'abcdfg',
  };

  function makeSegDigit() {
    const d = document.createElement('span');
    d.className = 'seg7';
    d.innerHTML = ['a', 'b', 'c', 'd', 'e', 'f', 'g']
      .map(s => `<i class="sg sg-${s}"></i>`).join('');
    d.dataset.v = '';
    return d;
  }

  function setSeg(el, ch) {
    if (el.dataset.v === ch) return;
    el.dataset.v = ch;
    const on = SEG_MAP[ch] || '';
    ['a', 'b', 'c', 'd', 'e', 'f', 'g'].forEach(s => {
      const seg = el.querySelector('.sg-' + s);
      if (seg) seg.classList.toggle('on', on.indexOf(s) !== -1);
    });
  }

  // secondsMode: 'none' = HH:MM, 'small' = HH:MM + small :SS, 'full' = HH:MM:SS same size
  // seg: digits render as 7-segment LCD elements instead of text
  function buildDigits(parent, secondsMode, seg) {
    const digits = [];
    const seps = [];
    let tokens;
    if (secondsMode === 'small') {
      tokens = ['d', 'd', ':', 'd', 'd', ':s', 'ds', 'ds'];
    } else if (secondsMode === 'full') {
      tokens = ['d', 'd', ':', 'd', 'd', ':', 'd', 'd'];
    } else {
      tokens = ['d', 'd', ':', 'd', 'd'];
    }
    tokens.forEach(k => {
      if (k === ':' || k === ':s') {
        const sp = document.createElement('span');
        sp.className = 'dg-sep' + (k === ':s' ? ' dg-sep-small' : '') + (seg ? ' dg-sep-led' : '');
        sp.textContent = seg ? '' : ':';
        parent.appendChild(sp);
        seps.push(sp);
      } else if (seg) {
        const d = makeSegDigit();
        parent.appendChild(d);
        digits.push(d);
      } else {
        const d = document.createElement('span');
        d.className = 'dg' + (k === 'ds' ? ' dg-small' : '');
        parent.appendChild(d);
        digits.push(d);
      }
    });
    let ampmEl = null;
    if (!is24()) {
      ampmEl = document.createElement('span');
      ampmEl.className = 'lc-ampm';
      parent.appendChild(ampmEl);
    }
    return { digits, seps, ampmEl };
  }

  function buildSep() {
    const sp = document.createElement('span');
    sp.className = 'fc-sep';
    sp.textContent = ':';
    return sp;
  }

  // noSeconds: when true, render HH:MM only (used for the docked/dashboard mini clock)
  function buildInto(container, sizeClass, forceStyle, noSeconds) {
    container.innerHTML = '';
    const style = forceStyle || SettingsStore.getClockStyle();

    if (style === 'flip') {
      const root = document.createElement('div');
      root.className = 'flip-clock ' + sizeClass + ' fc-skin-flip';
      const hCard = buildFlipCard();
      const mCard = buildFlipCard();
      const sep1 = buildSep();
      root.appendChild(hCard);
      root.appendChild(sep1);
      root.appendChild(mCard);
      let sCard = null;
      let seps = [sep1];
      if (!noSeconds) {
        const sep2 = buildSep();
        sCard = buildFlipCard();
        root.appendChild(sep2);
        root.appendChild(sCard);
        seps = [sep1, sep2];
      }
      let ampmEl = null;
      if (!is24()) {
        ampmEl = document.createElement('span');
        ampmEl.className = 'fc-ampm';
        hCard.appendChild(ampmEl);
      }
      container.appendChild(root);
      registry.push({ root, type: 'card', hCard, mCard, sCard, seps, ampmEl });
    } else if (style === 'casio') {
      // True 7-segment LCD digits — no box, color matches page text
      const root = document.createElement('time');
      root.className = 'digi-clock ' + sizeClass + ' dg-skin-led';
      const parts = buildDigits(root, noSeconds ? 'none' : 'full', true);
      container.appendChild(root);
      registry.push({ root, type: 'text', digits: parts.digits, seps: parts.seps, ampmEl: parts.ampmEl });
    } else {
      // bold HH:MM with small seconds on the upper-right (seconds dropped when noSeconds)
      const root = document.createElement('time');
      root.className = 'digi-clock ' + sizeClass + ' dg-skin-digital';
      const parts = buildDigits(root, noSeconds ? 'none' : 'small');
      container.appendChild(root);
      registry.push({ root, type: 'text', digits: parts.digits, seps: parts.seps, ampmEl: parts.ampmEl });
    }
    tickOnce();
  }

  // The dashboard mini clock never uses the flip cards: 'casio' stays casio,
  // everything else (digital, flip) renders as the digital skin.
  function miniStyleFor() {
    return SettingsStore.getClockStyle() === 'casio' ? 'casio' : 'digital';
  }

  function tickOnce() {
    const t = now();
    registry = registry.filter(c => document.contains(c.root));
    registry.forEach(c => {
      if (c.type === 'card') {
        setCard(c.hCard, t.h);
        setCard(c.mCard, t.m);
        if (c.sCard) setCard(c.sCard, t.s);
      } else {
        const str = t.h + t.m + t.s;
        c.digits.forEach((d, i) => {
          if (d.classList.contains('seg7')) {
            setSeg(d, str[i]);
          } else if (d.textContent !== str[i]) {
            d.textContent = str[i];
            d.classList.remove('dg-change');
            void d.offsetWidth;
            d.classList.add('dg-change');
          }
        });
      }
      // ':' color alternates every second
      if (c.seps) c.seps.forEach(sp => sp.classList.toggle('sep-alt', t.sec % 2 === 1));
      if (c.ampmEl) c.ampmEl.textContent = t.ampm;
    });
  }

  // ── Landing clock + hover transition + docking ────────────────────────────
  let hovered = false; // tracks if we've transitioned to casio on hover

  function mountLanding() {
    const center = document.querySelector('body > .center');
    if (!center) return;
    
    let blurOverlay = document.getElementById('bg-blur-overlay');
    if (!blurOverlay) {
      blurOverlay = document.createElement('div');
      blurOverlay.id = 'bg-blur-overlay';
      document.body.insertBefore(blurOverlay, document.body.firstChild);
    }
    document.body.classList.add('landing-blur');

    landingEl = document.createElement('div');
    landingEl.id = 'landing-clock';
    landingEl.title = 'Open dashboard';
    center.appendChild(landingEl);
    buildInto(landingEl, 'fc-lg');
    // Hovering the clock opens the dashboard — the clock shrinks and flies
    // into the header, landing as the casio mini clock there.
    landingEl.addEventListener('mouseenter', dock);
    landingEl.addEventListener('click', dock);

    // When the dashboard closes (Esc), fully reset the landing layer:
    // restore the background blur, clear stuck inline styles from a dock
    // that may have been interrupted, and rebuild the chosen clock style.
    let wasHelp = document.body.classList.contains('help');
    new MutationObserver(() => {
      const inHelp = document.body.classList.contains('help');
      if (wasHelp && !inHelp) {
        hovered = false;
        document.body.classList.add('landing-blur');
        if (landingEl) {
          landingEl.style.transition = 'none';
          landingEl.style.transform = '';
          landingEl.style.opacity = '';
          buildInto(landingEl, 'fc-lg');
        }
      }
      wasHelp = inHelp;
    }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  }

  let docking = false;

  function dock() {
    if (docking || document.body.classList.contains('help')) return;
    docking = true;
    hovered = false;
    document.body.classList.remove('landing-blur');
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
  // Mirrors the selected style (casio → casio, digital/flip → digital),
  // always without the seconds timer.
  function mountMini(slot) {
    if (!slot) return;
    buildInto(slot, 'fc-sm', miniStyleFor(), true);
  }

  // Re-render everything (after style change in Settings)
  function apply() {
    hovered = false;
    if (landingEl) buildInto(landingEl, 'fc-lg');
    const slot = document.getElementById('mini-clock-slot');
    if (slot) buildInto(slot, 'fc-sm', miniStyleFor(), true);
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
