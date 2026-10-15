import { useState, type ChangeEvent } from 'react';
import { useStore } from '../../store';
import { PRESET_THEMES, type PresetTheme } from '../../store/themes';

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

type WallpaperCategory = 'all' | 'macos' | 'abstract' | 'solids' | 'light';

export function AppearanceTab() {
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);
  const [selectedCategory, setSelectedCategory] = useState<WallpaperCategory>('all');

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
    <div className="max-w-3xl space-y-7 p-6 text-sm text-white/90 select-none">
      {/* Header & Title */}
      <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
        <div>
          <h3 className="font-display text-lg font-bold text-white tracking-wide flex items-center gap-2">
            <span>Appearance & Display</span>
            <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-[10px] font-mono font-semibold text-cyan-300 border border-cyan-500/30">
              macOS Sonoma Edition
            </span>
          </h3>
          <p className="text-xs text-white/50 mt-0.5">
            Customize window vibrancy, wallpapers, accent colors, and cockpit typography.
          </p>
        </div>
      </div>

      {/* 1. Live Apple Studio Display Mockup Preview */}
      <div className="relative overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-4 shadow-2xl backdrop-blur-2xl">
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
          className="relative h-44 w-full rounded-xl overflow-hidden border border-white/15 p-3 flex flex-col justify-between transition-all duration-500 shadow-inner"
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
            <div className="glass h-10 rounded-lg border border-white/20 p-1 flex items-center justify-between px-2">
              <span className="font-bold text-xs text-white">14:48</span>
              <span className="text-[9px] text-white/70">27°C</span>
            </div>
            <div className="glass h-10 rounded-lg border border-white/20 p-1 flex items-center px-2">
              <span className="text-[9px] text-rose-300 font-semibold">✓ 3 Tasks</span>
            </div>
            <div className="glass h-10 rounded-lg border border-white/20 p-1 flex items-center px-2">
              <span className="text-[9px] text-emerald-300 font-semibold">1,420 commits</span>
            </div>
            <div className="glass h-10 rounded-lg border border-white/20 p-1 flex items-center px-2">
              <span className="text-[9px] text-white/80 font-medium">Good Afternoon</span>
            </div>
          </div>

          {/* Simulated Search Bar */}
          <div className="mx-auto flex h-7 w-2/3 items-center justify-between rounded-xl border border-white/25 bg-white/10 px-3 shadow-lg backdrop-blur-md">
            <span className="text-[10px] text-white/60">Search web or deck...</span>
            <div className="flex items-center gap-1">
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: settings.accentColor }}
              />
              <span className="font-mono text-[8px] text-white/50">⌘K</span>
            </div>
          </div>

          {/* Simulated 3-Column Cockpit Bottom Cards */}
          <div className="grid grid-cols-3 gap-2">
            <div className="glass h-12 rounded-lg border border-white/15 p-1 flex flex-col justify-center px-2">
              <span className="text-[9px] font-bold text-cyan-300 uppercase">Working Sites</span>
              <span className="text-[8px] text-white/50">:5173 · :3000</span>
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
      <section className="glass-inner space-y-3 p-5 rounded-2xl border border-white/10">
        <label className="text-xs font-semibold text-white/80 uppercase tracking-wider block">
          Appearance Mode
        </label>
        <div className="grid grid-cols-2 gap-3.5">
          {/* Dark Mode Monitor */}
          <button
            type="button"
            onClick={() => handleModeChange('dark')}
            className={`group flex flex-col items-center gap-2.5 p-3 rounded-2xl border transition-all ${
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
            className={`group flex flex-col items-center gap-2.5 p-3 rounded-2xl border transition-all ${
              settings.themeMode === 'light'
                ? 'border-[var(--color-accent)] bg-white/20 ring-2 ring-[var(--color-accent)] shadow-xl'
                : 'border-white/10 bg-white/5 hover:bg-white/10 text-white/70'
            }`}
          >
            <div className="relative h-20 w-32 rounded-xl border border-black/10 bg-[#f1f5f9] p-2 flex flex-col justify-between shadow-inner">
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
      <section className="glass-inner space-y-3 p-5 rounded-2xl border border-white/10">
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

      {/* 4. macOS Wallpapers & Themes Gallery */}
      <section className="glass-inner space-y-4 p-5 rounded-2xl border border-white/10">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <label className="text-xs font-semibold text-white/80 uppercase tracking-wider block">
              macOS Dynamic Wallpapers & Backdrops
            </label>
            <p className="text-[11px] text-white/40">
              Apple-grade dynamic mesh gradients and authentic macOS horizons
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1 rounded-xl bg-white/[0.04] p-1 border border-white/10">
            {[
              { id: 'all', label: 'All' },
              { id: 'macos', label: '🍏 macOS' },
              { id: 'abstract', label: '🌌 Cosmic' },
              { id: 'solids', label: '🎨 Solids' },
              { id: 'light', label: '☀️ Light' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id as WallpaperCategory)}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
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

      {/* 5. Custom Backdrop Image / URL */}
      <section className="glass-inner space-y-3 p-5 rounded-2xl border border-white/10">
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

      {/* 6. macOS Liquid Glass Vibrancy & Blur Controls */}
      <section className="glass-inner space-y-4 p-5 rounded-2xl border border-white/10">
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

      {/* 7. Clock & Cockpit Customization */}
      <section className="glass-inner space-y-4 p-5 rounded-2xl border border-white/10">
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
