import { useState, useMemo, type ChangeEvent } from 'react';
import { useStore } from '../../store';
import { PRESET_THEMES, type PresetTheme, type ThemeCategory } from '../../store/themes';

const MACOS_ACCENT_PALETTE = [
  { id: 'multicolor', name: 'Multicolor', hex: '#ff2e9a', gradient: 'linear-gradient(135deg, #ff2e9a, #8b5cf6)' },
  { id: 'blue', name: 'Blue', hex: '#007aff', gradient: null },
  { id: 'purple', name: 'Purple', hex: '#af52de', gradient: null },
  { id: 'pink', name: 'Pink', hex: '#ff2d55', gradient: null },
  { id: 'red', name: 'Red', hex: '#ff3b30', gradient: null },
  { id: 'orange', name: 'Orange', hex: '#ff9500', gradient: null },
  { id: 'yellow', name: 'Yellow', hex: '#ffcc00', gradient: null },
  { id: 'green', name: 'Green', hex: '#34c759', gradient: null },
  { id: 'graphite', name: 'Graphite', hex: '#8e8e93', gradient: null },
];

type WallpaperFilter = 'all' | ThemeCategory;

const GRADIENT_INSPIRATIONS = [
  {
    name: '🌅 Twilight Dusk',
    type: 'linear' as const,
    angle: 135,
    s1: '#0b0713',
    s2: '#3b0764',
    s3: '#f59e0b',
    use3: true,
  },
  {
    name: '🌊 Ocean Reef',
    type: 'linear' as const,
    angle: 120,
    s1: '#020b17',
    s2: '#0284c7',
    s3: '#38bdf8',
    use3: true,
  },
  {
    name: '🌲 Alpine Pine',
    type: 'linear' as const,
    angle: 140,
    s1: '#02140e',
    s2: '#059669',
    s3: '#34d399',
    use3: true,
  },
  {
    name: '🔮 Cyber Neon',
    type: 'linear' as const,
    angle: 135,
    s1: '#090214',
    s2: '#c026d3',
    s3: '#00f0ff',
    use3: true,
  },
  {
    name: '🌸 Peach Sorbet',
    type: 'linear' as const,
    angle: 135,
    s1: '#fff7ed',
    s2: '#fed7aa',
    s3: '#f472b6',
    use3: true,
  },
  {
    name: '☁️ Nordic Fog',
    type: 'linear' as const,
    angle: 135,
    s1: '#f8fafc',
    s2: '#cbd5e1',
    s3: '#64748b',
    use3: true,
  },
  {
    name: '🎯 Radial Amethyst',
    type: 'radial' as const,
    angle: 0,
    s1: '#090114',
    s2: '#220538',
    s3: '#a855f7',
    use3: true,
  },
  {
    name: '✨ Gold Velvet',
    type: 'linear' as const,
    angle: 90,
    s1: '#1c1917',
    s2: '#78350f',
    s3: '#f59e0b',
    use3: true,
  },
];

export function AppearanceTab() {
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);
  const [selectedCategory, setSelectedCategory] = useState<WallpaperFilter>('all');

  // Custom Gradient Builder State
  const [gradientType, setGradientType] = useState<'linear' | 'radial'>('linear');
  const [gradientAngle, setGradientAngle] = useState<number>(135);
  const [colorStop1, setColorStop1] = useState<string>('#0b0713');
  const [colorStop2, setColorStop2] = useState<string>('#3b0764');
  const [useStop3, setUseStop3] = useState<boolean>(true);
  const [colorStop3, setColorStop3] = useState<string>('#f59e0b');
  const [copied, setCopied] = useState<boolean>(false);

  // Compute live custom gradient CSS
  const generatedGradient = useMemo(() => {
    if (gradientType === 'linear') {
      if (useStop3) {
        return `linear-gradient(${gradientAngle}deg, ${colorStop1} 0%, ${colorStop2} 50%, ${colorStop3} 100%)`;
      }
      return `linear-gradient(${gradientAngle}deg, ${colorStop1} 0%, ${colorStop2} 100%)`;
    } else {
      if (useStop3) {
        return `radial-gradient(circle at 50% 50%, ${colorStop3} 0%, ${colorStop2} 50%, ${colorStop1} 100%)`;
      }
      return `radial-gradient(circle at 50% 50%, ${colorStop2} 0%, ${colorStop1} 100%)`;
    }
  }, [gradientType, gradientAngle, colorStop1, colorStop2, useStop3, colorStop3]);

  const handleApplyGradient = () => {
    updateSettings({
      backgroundImage: generatedGradient,
      presetTheme: 'custom-gradient',
    });
  };

  const handleCopyCss = () => {
    navigator.clipboard.writeText(generatedGradient);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApplyInspiration = (insp: (typeof GRADIENT_INSPIRATIONS)[number]) => {
    setGradientType(insp.type);
    setGradientAngle(insp.angle);
    setColorStop1(insp.s1);
    setColorStop2(insp.s2);
    setUseStop3(insp.use3);
    setColorStop3(insp.s3);
  };

  const handleModeChange = (mode: 'dark' | 'light') => {
    if (mode === 'dark') {
      const defaultDarkTheme = PRESET_THEMES.find((p) => p.id === 'macos-sonoma') ?? PRESET_THEMES[0];
      updateSettings({
        themeMode: 'dark',
        presetTheme: defaultDarkTheme.id,
        backgroundImage: defaultDarkTheme.gradient,
        accentColor: defaultDarkTheme.accentColor,
      });
    } else {
      const defaultLightTheme = PRESET_THEMES.find((p) => p.id === 'default-light') ?? PRESET_THEMES[0];
      updateSettings({
        themeMode: 'light',
        presetTheme: defaultLightTheme.id,
        backgroundImage: defaultLightTheme.gradient,
        accentColor: defaultLightTheme.accentColor,
      });
    }
  };

  const handleSelectPreset = (preset: PresetTheme) => {
    updateSettings({
      presetTheme: preset.id,
      themeMode: preset.mode,
      accentColor: preset.accentColor,
      backgroundImage: preset.gradient,
    });
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        updateSettings({ backgroundImage: dataUrl, presetTheme: 'custom' });
      }
    };
    reader.readAsDataURL(file);
  };

  const filteredThemes =
    selectedCategory === 'all'
      ? PRESET_THEMES
      : PRESET_THEMES.filter((t) => t.category === selectedCategory);

  return (
    <div className="max-w-3xl space-y-8 p-6 sm:p-7 text-sm text-white/90 select-none">
      {/* Header & Title */}
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
        <div>
          <h3 className="font-display text-lg font-bold text-white tracking-wide flex items-center gap-2">
            <span>Appearance & Display</span>
            <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-[10px] font-mono font-semibold text-cyan-300 border border-cyan-500/30">
              macOS Sequoia Edition
            </span>
          </h3>
          <p className="text-xs text-white/50 mt-1">
            Customize window vibrancy, wallpapers, accent colors, custom gradient direction & stops, and typography.
          </p>
        </div>
      </div>

      {/* 1. Live Apple Studio Display Mockup Preview */}
      <div className="relative overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-5 shadow-2xl backdrop-blur-2xl">
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-1.5">
            <span className="size-3 rounded-full bg-[#ff5f56] border border-[#e0443e]/50 shadow-sm" />
            <span className="size-3 rounded-full bg-[#ffbd2e] border border-[#dea123]/50 shadow-sm" />
            <span className="size-3 rounded-full bg-[#27c93f] border border-[#1aab29]/50 shadow-sm" />
            <span className="ml-2 font-display text-[11px] font-semibold text-white/60">
              DevDeck v2 — Studio Preview
            </span>
          </div>
          <span className="font-mono text-[10px] text-white/40">
            {(settings.themeMode ?? 'dark').toUpperCase()} · {settings.accentColor}
          </span>
        </div>

        {/* Mini Desktop Stage */}
        <div
          className="relative h-48 w-full rounded-xl overflow-hidden border border-white/15 p-3.5 flex flex-col justify-between transition-all duration-500 shadow-inner"
          style={{
            background:
              settings.backgroundImage ||
              (settings.themeMode === 'light'
                ? 'linear-gradient(135deg, #eef2ff 0%, #f8fafc 50%, #f1f5f9 100%)'
                : 'radial-gradient(ellipse at 50% 0%, #1c0e35 0%, #0b0713 100%)'),
          }}
        >
          {/* Simulated Top Bar Cockpit */}
          <div className="grid grid-cols-4 gap-2">
            <div className="glass h-11 rounded-lg border border-white/20 p-1 flex items-center justify-between px-2.5">
              <span className="font-bold text-xs text-white">14:48</span>
              <span className="text-[9px] text-white/70">27°C</span>
            </div>
            <div className="glass h-11 rounded-lg border border-white/20 p-1 flex items-center justify-between px-2.5">
              <span className="text-[9px] font-semibold text-cyan-300">GH COMMITS</span>
              <span className="text-[9px] text-white/80">388</span>
            </div>
            <div className="glass h-11 rounded-lg border border-white/20 p-1 flex items-center justify-between px-2.5">
              <span className="text-[9px] font-semibold text-amber-300">ACTIVE TODO</span>
              <span className="text-[9px] text-white/80">4 pending</span>
            </div>
            <div className="glass h-11 rounded-lg border border-white/20 p-1 flex items-center justify-between px-2.5">
              <span className="text-[9px] font-semibold text-rose-300">UV INDEX</span>
              <span className="text-[9px] text-white/80">6 Moderate</span>
            </div>
          </div>

          {/* Simulated Search Bar */}
          <div className="h-8 w-2/3 mx-auto rounded-lg border border-white/30 bg-black/30 backdrop-blur-md flex items-center px-3 justify-between shadow-sm">
            <span className="text-[10px] text-white/50 flex items-center gap-1.5">
              <span>🔍</span> Search or execute command...
            </span>
            <span
              className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded shadow-sm text-white"
              style={{ backgroundColor: settings.accentColor }}
            >
              ⌘K
            </span>
          </div>

          {/* Simulated 3-Column Deck */}
          <div className="grid grid-cols-3 gap-2">
            <div className="glass h-12 rounded-lg border border-white/15 p-1 flex flex-col justify-center px-2">
              <span className="text-[9px] font-bold text-white/90 uppercase">Active Sites</span>
              <span className="text-[8px] text-white/50">4 running</span>
            </div>
            <div className="glass h-12 rounded-lg border border-white/25 p-1 flex flex-col justify-center px-2">
              <span
                className="text-[9px] font-bold uppercase truncate"
                style={{ color: settings.accentColor }}
              >
                Frontend & Native
              </span>
              <span className="text-[8px] text-white/50">22 Bookmarks</span>
            </div>
            <div className="glass h-12 rounded-lg border border-white/15 p-1 flex flex-col justify-center px-2">
              <span className="text-[9px] font-bold text-white/90 uppercase">Tech News</span>
              <span className="text-[8px] text-white/50">Live Feed</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Apple Appearance Mode (Light / Dark) */}
      <section className="glass-inner space-y-3.5 p-5 sm:p-6 rounded-2xl border border-white/10">
        <label className="text-xs font-semibold text-white/80 uppercase tracking-wider block">
          Appearance Mode
        </label>
        <div className="grid grid-cols-2 gap-4">
          {/* Dark Mode Monitor */}
          <button
            type="button"
            onClick={() => handleModeChange('dark')}
            className={`group flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all ${
              settings.themeMode === 'dark'
                ? 'border-[var(--color-accent)] bg-white/15 ring-2 ring-[var(--color-accent)] shadow-xl'
                : 'border-white/10 bg-white/5 hover:bg-white/10 text-white/70'
            }`}
          >
            <div className="relative h-20 w-32 rounded-xl border border-white/20 bg-[#0d0718] p-2 flex flex-col justify-between shadow-inner">
              <div className="flex gap-1">
                <span className="size-1.5 rounded-full bg-red-400" />
                <span className="size-1.5 rounded-full bg-amber-400" />
                <span className="size-1.5 rounded-full bg-green-400" />
              </div>
              <div className="h-6 w-full rounded-md bg-white/10 flex items-center justify-center">
                <span className="text-xs">🌙</span>
              </div>
              <div className="h-2 w-full rounded bg-white/5" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-white">Dark Mode</span>
              {settings.themeMode === 'dark' && (
                <span className="size-2 rounded-full bg-[var(--color-accent)]" />
              )}
            </div>
          </button>

          {/* Light Mode Monitor */}
          <button
            type="button"
            onClick={() => handleModeChange('light')}
            className={`group flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all ${
              settings.themeMode === 'light'
                ? 'border-[var(--color-accent)] bg-white/20 ring-2 ring-[var(--color-accent)] shadow-xl'
                : 'border-white/10 bg-white/5 hover:bg-white/10 text-white/70'
            }`}
          >
            <div className="relative h-20 w-32 rounded-xl border border-black/10 bg-[#f4f6fa] p-2 flex flex-col justify-between shadow-inner">
              <div className="flex gap-1">
                <span className="size-1.5 rounded-full bg-red-400" />
                <span className="size-1.5 rounded-full bg-amber-400" />
                <span className="size-1.5 rounded-full bg-green-400" />
              </div>
              <div className="h-6 w-full rounded-md bg-white border border-black/10 flex items-center justify-center shadow-sm">
                <span className="text-xs">☀️</span>
              </div>
              <div className="h-2 w-full rounded bg-black/5" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-white">Light Mode</span>
              {settings.themeMode === 'light' && (
                <span className="size-2 rounded-full bg-[var(--color-accent)]" />
              )}
            </div>
          </button>
        </div>
      </section>

      {/* 3. Apple macOS Accent Color Palette */}
      <section className="glass-inner space-y-3.5 p-5 sm:p-6 rounded-2xl border border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <label className="text-xs font-semibold text-white/80 uppercase tracking-wider block">
              macOS Accent Color
            </label>
            <p className="text-[11px] text-white/40">
              Select an Apple system accent or define a custom shade
            </p>
          </div>
          <span className="font-mono text-xs text-white/60">{settings.accentColor}</span>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          {MACOS_ACCENT_PALETTE.map((accent) => {
            const isSelected =
              settings.accentColor.toLowerCase() === accent.hex.toLowerCase();
            return (
              <button
                key={accent.id}
                type="button"
                onClick={() => updateSettings({ accentColor: accent.hex })}
                title={accent.name}
                className={`group relative flex size-9 items-center justify-center rounded-full transition-all duration-200 ${
                  isSelected
                    ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-black/60 shadow-[0_0_12px_rgba(255,255,255,0.4)]'
                    : 'hover:scale-105 opacity-85 hover:opacity-100'
                }`}
                style={{
                  background: accent.gradient || accent.hex,
                }}
              >
                {isSelected && (
                  <span className="size-2 rounded-full bg-white shadow-sm" />
                )}
              </button>
            );
          })}

          {/* Custom Color Picker */}
          <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 hover:bg-white/10 transition-colors">
            <input
              type="color"
              value={settings.accentColor}
              onChange={(e) => updateSettings({ accentColor: e.target.value })}
              className="size-6 cursor-pointer rounded-full border-0 bg-transparent p-0"
              aria-label="Custom accent color"
            />
            <span className="text-xs text-white/70 font-medium">Custom</span>
          </div>
        </div>
      </section>

      {/* 4. Interactive Custom Gradient Studio (Direction, Colors, Stops) */}
      <section className="glass-inner space-y-4 p-5 sm:p-6 rounded-2xl border border-cyan-500/20 bg-cyan-950/10">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <label className="text-xs font-semibold text-cyan-300 uppercase tracking-wider block flex items-center gap-2">
              <span>Custom Gradient Studio</span>
              <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-[9px] font-mono text-cyan-300">
                Live Builder
              </span>
            </label>
            <p className="text-[11px] text-white/50">
              Manually set gradient angle direction, start, middle, and end color stops.
            </p>
          </div>

          {/* Gradient Type Switcher */}
          <div className="flex items-center rounded-xl bg-black/40 p-1 border border-white/10">
            <button
              type="button"
              onClick={() => setGradientType('linear')}
              className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
                gradientType === 'linear'
                  ? 'bg-cyan-500 text-white shadow-sm'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              Linear
            </button>
            <button
              type="button"
              onClick={() => setGradientType('radial')}
              className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
                gradientType === 'radial'
                  ? 'bg-cyan-500 text-white shadow-sm'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              Radial
            </button>
          </div>
        </div>

        {/* Gradient Angle Direction Slider & Quick Chips (if Linear) */}
        {gradientType === 'linear' && (
          <div className="space-y-2 rounded-xl bg-white/[0.03] p-3.5 border border-white/10">
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/70 font-medium">
                Gradient Direction (Angle): <span className="font-mono text-cyan-300">{gradientAngle}°</span>
              </span>
              {/* Quick directional chips */}
              <div className="flex items-center gap-1">
                {[
                  { angle: 135, label: '↘ 135°' },
                  { angle: 90, label: '→ 90°' },
                  { angle: 180, label: '↓ 180°' },
                  { angle: 45, label: '↗ 45°' },
                  { angle: 315, label: '↖ 315°' },
                  { angle: 0, label: '↑ 0°' },
                ].map((item) => (
                  <button
                    key={item.angle}
                    type="button"
                    onClick={() => setGradientAngle(item.angle)}
                    className={`rounded-md px-2 py-0.5 text-[10px] font-mono transition-all ${
                      gradientAngle === item.angle
                        ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/50'
                        : 'bg-white/5 text-white/50 hover:bg-white/10'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="360"
              step="5"
              value={gradientAngle}
              onChange={(e) => setGradientAngle(parseInt(e.target.value, 10))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>
        )}

        {/* Color Stops Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Stop 1 */}
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 space-y-1.5">
            <span className="text-[11px] font-semibold text-white/60 uppercase tracking-wider block">
              Color Stop 1 (Start)
            </span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={colorStop1}
                onChange={(e) => setColorStop1(e.target.value)}
                className="size-7 cursor-pointer rounded-lg border-0 bg-transparent p-0 shrink-0"
              />
              <input
                type="text"
                value={colorStop1}
                onChange={(e) => setColorStop1(e.target.value)}
                className="w-full rounded-lg border border-white/15 bg-black/40 px-2 py-1 text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          {/* Stop 2 */}
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 space-y-1.5">
            <span className="text-[11px] font-semibold text-white/60 uppercase tracking-wider block">
              Color Stop 2 (Middle)
            </span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={colorStop2}
                onChange={(e) => setColorStop2(e.target.value)}
                className="size-7 cursor-pointer rounded-lg border-0 bg-transparent p-0 shrink-0"
              />
              <input
                type="text"
                value={colorStop2}
                onChange={(e) => setColorStop2(e.target.value)}
                className="w-full rounded-lg border border-white/15 bg-black/40 px-2 py-1 text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          {/* Stop 3 (Optional) */}
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-white/60 uppercase tracking-wider block">
                Color Stop 3 (End)
              </span>
              <label className="flex items-center gap-1.5 cursor-pointer text-[10px] text-white/60">
                <input
                  type="checkbox"
                  checked={useStop3}
                  onChange={(e) => setUseStop3(e.target.checked)}
                  className="rounded accent-cyan-400"
                />
                <span>Active</span>
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                disabled={!useStop3}
                value={colorStop3}
                onChange={(e) => setColorStop3(e.target.value)}
                className="size-7 cursor-pointer rounded-lg border-0 bg-transparent p-0 shrink-0 disabled:opacity-30"
              />
              <input
                type="text"
                disabled={!useStop3}
                value={colorStop3}
                onChange={(e) => setColorStop3(e.target.value)}
                className="w-full rounded-lg border border-white/15 bg-black/40 px-2 py-1 text-xs font-mono text-white focus:outline-none focus:border-cyan-400 disabled:opacity-30"
              />
            </div>
          </div>
        </div>

        {/* Quick Inspiration Palettes */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wider block">
            Quick Palettes for Inspiration
          </span>
          <div className="flex flex-wrap gap-2">
            {GRADIENT_INSPIRATIONS.map((insp) => (
              <button
                key={insp.name}
                type="button"
                onClick={() => handleApplyInspiration(insp)}
                className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-white/80 hover:bg-white/10 hover:border-cyan-400/40 transition-all flex items-center gap-1.5"
              >
                <span
                  className="size-2 rounded-full border border-white/30"
                  style={{ backgroundColor: insp.s3 || insp.s2 }}
                />
                <span>{insp.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Live Mini Preview & Action Buttons */}
        <div className="rounded-xl border border-white/15 bg-black/30 p-3.5 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/70 font-semibold flex items-center gap-1.5">
              <span>Preview:</span>
              <code className="text-[10px] font-mono text-cyan-300 max-w-sm truncate bg-black/40 px-2 py-0.5 rounded">
                {generatedGradient}
              </code>
            </span>
            <button
              type="button"
              onClick={handleCopyCss}
              className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white/80 transition-colors"
            >
              {copied ? '✓ Copied' : 'Copy CSS'}
            </button>
          </div>

          {/* Visual gradient swatch */}
          <div
            className="h-14 w-full rounded-lg border border-white/20 shadow-md transition-all"
            style={{ background: generatedGradient }}
          />

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={handleApplyGradient}
              className="rounded-xl bg-cyan-500 hover:bg-cyan-400 px-5 py-2 text-xs font-bold text-slate-950 shadow-lg transition-all hover:scale-[1.02] flex items-center gap-2"
            >
              <span>Apply Custom Gradient to Workspace</span>
              <span>✨</span>
            </button>
          </div>
        </div>
      </section>

      {/* 5. Diverse macOS Wallpapers & Themes Gallery */}
      <section className="glass-inner space-y-4 p-5 sm:p-6 rounded-2xl border border-white/10">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <label className="text-xs font-semibold text-white/80 uppercase tracking-wider block">
              Diverse Preset Themes & Wallpapers ({PRESET_THEMES.length} Presets)
            </label>
            <p className="text-[11px] text-white/40">
              Curated across macOS flagships, vibrant neons, earth & nature, jewel tones, pastels, and solids
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1 rounded-xl bg-white/[0.04] p-1 border border-white/10 flex-wrap">
            {[
              { id: 'all', label: 'All' },
              { id: 'macos', label: '🍏 macOS' },
              { id: 'vibrant', label: '⚡ Vibrant' },
              { id: 'nature', label: '🌲 Nature' },
              { id: 'jewel', label: '💎 Jewel' },
              { id: 'pastel', label: '🌸 Pastel' },
              { id: 'light', label: '☀️ Light' },
              { id: 'solids', label: '🎨 Solids' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id as WallpaperFilter)}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-white/20 text-white shadow-sm'
                    : 'text-white/50 hover:text-white/80'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Wallpaper Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 max-h-[460px] overflow-y-auto pr-1">
          {filteredThemes.map((preset) => {
            const isSelected = settings.presetTheme === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={`group flex flex-col p-2.5 rounded-2xl border text-left transition-all relative overflow-hidden ${
                  isSelected
                    ? 'border-[var(--color-accent)] bg-white/15 shadow-xl ring-2 ring-[var(--color-accent)]'
                    : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/25'
                }`}
              >
                {/* Visual Wallpaper Thumbnail */}
                <div
                  className="h-20 w-full rounded-xl border border-white/15 relative overflow-hidden mb-2.5 shadow-md transition-transform group-hover:scale-[1.02]"
                  style={{
                    background:
                      preset.gradient ||
                      'radial-gradient(ellipse at 50% 0%, #1c0e35 0%, #0b0713 100%)',
                  }}
                >
                  <span
                    className="absolute top-2 right-2 size-3 rounded-full border border-white/50 shadow"
                    style={{ backgroundColor: preset.accentColor }}
                    title={`Accent: ${preset.accentColor}`}
                  />
                  {isSelected && (
                    <div className="absolute inset-0 bg-black/25 flex items-center justify-center backdrop-blur-[1px]">
                      <span className="size-6 rounded-full bg-[var(--color-accent)] text-xs text-white font-bold flex items-center justify-center shadow-lg">
                        ✓
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-white truncate">
                    {preset.name}
                  </span>
                  <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-white/10 text-white/60">
                    {preset.category}
                  </span>
                </div>
                <p className="text-[10px] text-white/50 line-clamp-2 mt-1 leading-snug">
                  {preset.description}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* 6. Custom Backdrop Image / URL */}
      <section className="glass-inner space-y-3 p-5 sm:p-6 rounded-2xl border border-white/10">
        <div>
          <label className="text-xs font-semibold text-white/80 uppercase tracking-wider block">
            Custom Wallpaper (Image URL or File Upload)
          </label>
          <p className="text-[11px] text-white/40">
            Personalize your workspace with any 4K/UHD desktop image
          </p>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={settings.backgroundImage || ''}
            onChange={(e) =>
              updateSettings({
                backgroundImage: e.target.value || null,
                presetTheme: e.target.value ? 'custom' : 'macos-sonoma',
              })
            }
            placeholder="Image URL (e.g. https://... or data URL)..."
            className="flex-1 rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 text-xs text-white placeholder-white/30 focus:border-cyan-400/50 focus:outline-none"
          />
          <label className="cursor-pointer rounded-xl bg-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/15 transition-all border border-white/15 flex items-center gap-1.5 shadow-sm">
            <span>Upload</span>
            <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
          </label>
          {settings.backgroundImage && (
            <button
              type="button"
              onClick={() =>
                updateSettings({ backgroundImage: null, presetTheme: 'macos-sonoma' })
              }
              className="rounded-xl border border-rose-500/30 bg-rose-500/15 px-3 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/25 transition-all"
            >
              Reset
            </button>
          )}
        </div>
      </section>

      {/* 7. macOS Liquid Glass Vibrancy & Blur Controls */}
      <section className="glass-inner space-y-4 p-5 sm:p-6 rounded-2xl border border-white/10">
        <label className="text-xs font-semibold text-white/80 uppercase tracking-wider block">
          macOS Glass Vibrancy & Translucency
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-white/70">Glass Tint & Darkness</span>
              <span className="text-white/50 font-mono">
                {Math.round(settings.overlayOpacity * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.overlayOpacity}
              onChange={(e) => updateSettings({ overlayOpacity: parseFloat(e.target.value) })}
              className="w-full accent-[var(--color-accent)] cursor-pointer"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-white/70">Backdrop Blur Intensity</span>
              <span className="text-white/50 font-mono">{settings.backgroundBlur}px</span>
            </div>
            <input
              type="range"
              min="0"
              max="40"
              step="1"
              value={settings.backgroundBlur}
              onChange={(e) => updateSettings({ backgroundBlur: parseInt(e.target.value, 10) })}
              className="w-full accent-[var(--color-accent)] cursor-pointer"
            />
          </div>
        </div>
      </section>

      {/* 8. Clock & Cockpit Customization */}
      <section className="glass-inner space-y-4 p-5 sm:p-6 rounded-2xl border border-white/10">
        <h4 className="font-display text-xs font-semibold text-white/90 uppercase tracking-wider">
          Clock & Cockpit Preferences
        </h4>

        {/* Digital Clock Style */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-white/80 uppercase tracking-wider block">
            Digital Clock Style
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {[
              { id: 'macos', label: 'macOS Minimalist', desc: 'Apple San Francisco typography' },
              { id: 'dseg7', label: 'DSEG7 Classic', desc: '7-segment retro digital' },
              { id: 'cyberpunk', label: 'Cyberpunk HUD', desc: 'Bold futuristic with neon' },
            ].map((style) => (
              <button
                key={style.id}
                type="button"
                onClick={() => updateSettings({ clockStyle: style.id as any })}
                className={`p-3 rounded-xl border text-left transition-all ${
                  settings.clockStyle === style.id
                    ? 'border-cyan-400 bg-white/15 shadow-md ring-1 ring-cyan-400'
                    : 'border-white/10 bg-white/5 hover:bg-white/10 text-white/70'
                }`}
              >
                <span className="font-semibold text-xs text-white block">{style.label}</span>
                <span className="text-[10px] text-white/40 block mt-0.5">{style.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Hour & Seconds Formats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-white/80 uppercase tracking-wider block">
              Hour Format
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => updateSettings({ clock24h: false })}
                className={`flex-1 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                  !settings.clock24h
                    ? 'bg-white/20 text-white ring-1 ring-white/30'
                    : 'bg-white/5 text-white/50 hover:bg-white/10'
                }`}
              >
                12-Hour
              </button>
              <button
                type="button"
                onClick={() => updateSettings({ clock24h: true })}
                className={`flex-1 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                  settings.clock24h
                    ? 'bg-white/20 text-white ring-1 ring-white/30'
                    : 'bg-white/5 text-white/50 hover:bg-white/10'
                }`}
              >
                24-Hour
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-white/80 uppercase tracking-wider block">
              Seconds Display
            </label>
            <button
              type="button"
              onClick={() => updateSettings({ showSeconds: !settings.showSeconds })}
              className={`w-full rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                settings.showSeconds
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-white/5 text-white/50 hover:bg-white/10'
              }`}
            >
              {settings.showSeconds ? 'Showing Seconds (:SS)' : 'Seconds Hidden'}
            </button>
          </div>
        </div>

        {/* GitHub & Weather */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-white/80 uppercase tracking-wider block">
              GitHub Username
            </label>
            <input
              type="text"
              value={settings.githubUsername}
              onChange={(e) => updateSettings({ githubUsername: e.target.value.trim() })}
              placeholder="e.g. GhoshCode"
              className="w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 text-xs text-white placeholder-white/30 focus:border-cyan-400/50 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-white/80 uppercase tracking-wider block">
              Weather HUD
            </label>
            <button
              type="button"
              onClick={() => updateSettings({ weatherEnabled: !settings.weatherEnabled })}
              className={`w-full rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                settings.weatherEnabled
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-white/5 text-white/50 hover:bg-white/10'
              }`}
            >
              {settings.weatherEnabled ? 'Enabled (°C + UV Index + PIN Code)' : 'Disabled'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
