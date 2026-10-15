import type { ChangeEvent } from 'react';
import { useStore } from '../../store';
import { PRESET_THEMES } from '../../store/themes';
import type { ClockStyle } from '../../types';

// TIME widget faces (spec §3.1); each label previews its own typeface.
const CLOCK_STYLES: Array<{ id: ClockStyle; label: string; fontClass: string }> = [
  { id: 'dseg7', label: 'Digital (DSEG7)', fontClass: '' },
  { id: 'cyberpunk', label: 'Cyberpunk 2077', fontClass: 'font-cyber font-bold tracking-wide' },
  { id: 'macos', label: 'macOS Minimal', fontClass: 'font-mac font-light' },
];

const PRESET_ACCENTS = [
  { name: 'Magenta', hex: '#ff2e9a' },
  { name: 'Violet', hex: '#8b5cf6' },
  { name: 'Cyan', hex: '#06b6d4' },
  { name: 'Emerald', hex: '#10b981' },
  { name: 'Amber', hex: '#f59e0b' },
  { name: 'Rose', hex: '#f43f5e' },
];

export function AppearanceTab() {
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);

  const handleModeChange = (mode: 'dark' | 'light') => {
    if (mode === 'dark') {
      updateSettings({
        themeMode: 'dark',
        presetTheme: 'default-dark',
        backgroundImage: null,
        accentColor: '#ff2e9a',
      });
    } else {
      updateSettings({
        themeMode: 'light',
        presetTheme: 'default-light',
        backgroundImage:
          'radial-gradient(at 0% 0%, rgba(199, 210, 254, 0.75) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(254, 205, 211, 0.6) 0px, transparent 50%), radial-gradient(at 50% 50%, rgba(224, 231, 255, 0.6) 0px, transparent 60%), radial-gradient(at 0% 100%, rgba(186, 230, 253, 0.7) 0px, transparent 55%), radial-gradient(at 100% 100%, rgba(253, 230, 138, 0.45) 0px, transparent 50%), linear-gradient(135deg, #eef2ff 0%, #f8fafc 50%, #f1f5f9 100%)',
        accentColor: '#7c3aed',
      });
    }
  };

  const handleSelectPreset = (presetId: string) => {
    const preset = PRESET_THEMES.find((p) => p.id === presetId);
    if (!preset) return;

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

  return (
    <div className="max-w-3xl space-y-8 p-6 text-sm text-white/90">
      <div>
        <h3 className="font-display text-base font-semibold text-white tracking-wide">
          Appearance & Themes
        </h3>
        <p className="text-xs text-white/50">
          Tailor your DevDeck with dark or light modes, gradient themes, vibrant styling, and glassmorphic containers.
        </p>
      </div>

      {/* 1. Theme Mode: Default Dark & Light */}
      <section className="glass-inner space-y-3 p-5 rounded-2xl border border-white/10">
        <label className="text-xs font-semibold text-white/80 uppercase tracking-wider block">
          Base Theme Mode
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleModeChange('dark')}
            className={`group relative flex items-center gap-3.5 p-3.5 rounded-xl border text-left transition-all ${
              settings.themeMode === 'dark'
                ? 'border-[var(--color-accent)] bg-white/10 shadow-lg ring-1 ring-[var(--color-accent)]'
                : 'border-white/10 bg-white/5 hover:bg-white/10 text-white/70'
            }`}
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-black/50 border border-white/10 text-lg shadow-inner">
              🌙
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-white">Default Dark</span>
                {settings.themeMode === 'dark' && (
                  <span className="size-2 rounded-full bg-[var(--color-accent)] shadow-[0_0_8px_var(--color-accent)]" />
                )}
              </div>
              <p className="text-[11px] text-white/50 truncate">
                Deep obsidian glass with dynamic node graph
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleModeChange('light')}
            className={`group relative flex items-center gap-3.5 p-3.5 rounded-xl border text-left transition-all ${
              settings.themeMode === 'light'
                ? 'border-[var(--color-accent)] bg-white/15 shadow-lg ring-1 ring-[var(--color-accent)]'
                : 'border-white/10 bg-white/5 hover:bg-white/10 text-white/70'
            }`}
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/90 border border-black/10 text-lg shadow">
              ☀️
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-white">Default Light</span>
                {settings.themeMode === 'light' && (
                  <span className="size-2 rounded-full bg-[var(--color-accent)] shadow-[0_0_8px_var(--color-accent)]" />
                )}
              </div>
              <p className="text-[11px] text-white/50 truncate">
                High-contrast frosted daylight with pearl glass
              </p>
            </div>
          </button>
        </div>
      </section>

      {/* 2. Accent Color Customization */}
      <section className="glass-inner space-y-3 p-5 rounded-2xl border border-white/10">
        <label className="text-xs font-semibold text-white/80 uppercase tracking-wider block">
          Accent Color
        </label>
        <div className="flex flex-wrap items-center gap-3">
          {PRESET_ACCENTS.map((preset) => (
            <button
              key={preset.hex}
              type="button"
              onClick={() => updateSettings({ accentColor: preset.hex })}
              className={`flex size-8 items-center justify-center rounded-full transition-transform ${
                settings.accentColor.toLowerCase() === preset.hex.toLowerCase()
                  ? 'scale-110 ring-2 ring-white shadow-lg'
                  : 'hover:scale-105'
              }`}
              style={{ backgroundColor: preset.hex }}
              title={preset.name}
            />
          ))}
          <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1">
            <input
              type="color"
              value={settings.accentColor}
              onChange={(e) => updateSettings({ accentColor: e.target.value })}
              className="size-5 cursor-pointer rounded border-0 bg-transparent"
              aria-label="Pick custom accent color"
            />
            <span className="font-mono text-xs text-white/60">{settings.accentColor}</span>
          </div>
        </div>
      </section>

      {/* 3. Preset Gradient Themes */}
      <section className="glass-inner space-y-3.5 p-5 rounded-2xl border border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <label className="text-xs font-semibold text-white/80 uppercase tracking-wider block">
              Preset Themes & Gradients
            </label>
            <p className="text-[11px] text-white/40">
              Curated ambient backdrops paired with harmonious colorways
            </p>
          </div>
          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-white/10 text-white/60">
            {PRESET_THEMES.length} Presets
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {PRESET_THEMES.map((preset) => {
            const isSelected = settings.presetTheme === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset.id)}
                className={`group flex flex-col p-2.5 rounded-xl border text-left transition-all relative overflow-hidden ${
                  isSelected
                    ? 'border-[var(--color-accent)] bg-white/15 shadow-md ring-1 ring-[var(--color-accent)]'
                    : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
                }`}
              >
                {/* Visual Gradient Swatch */}
                <div
                  className="h-14 w-full rounded-lg border border-white/10 relative overflow-hidden mb-2 shadow-inner"
                  style={{
                    background:
                      preset.gradient ||
                      'radial-gradient(ellipse at 50% 0%, #1c0e35 0%, #0b0713 100%)',
                  }}
                >
                  <span
                    className="absolute top-1.5 right-1.5 size-2.5 rounded-full border border-white/40 shadow-sm"
                    style={{ backgroundColor: preset.accentColor }}
                    title={`Accent: ${preset.accentColor}`}
                  />
                  {isSelected && (
                    <div className="absolute inset-0 bg-white/10 flex items-center justify-center">
                      <span className="size-4 rounded-full bg-[var(--color-accent)] text-[10px] text-white font-bold flex items-center justify-center shadow">
                        ✓
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-white truncate">
                    {preset.name}
                  </span>
                  <span className="text-[9px] uppercase font-mono px-1 rounded bg-white/10 text-white/50">
                    {preset.mode}
                  </span>
                </div>
                <p className="text-[10px] text-white/40 line-clamp-2 mt-1 leading-snug">
                  {preset.description}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* 4. Backdrop Customization */}
      <section className="glass-inner space-y-4 p-5 rounded-2xl border border-white/10">
        <div>
          <label className="text-xs font-semibold text-white/80 uppercase tracking-wider block">
            Custom Backdrop Image
          </label>
          <p className="text-[11px] text-white/40">
            Paste a URL or upload a local wallpaper
          </p>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={settings.backgroundImage || ''}
            onChange={(e) =>
              updateSettings({
                backgroundImage: e.target.value || null,
                presetTheme: e.target.value ? 'custom' : 'default-dark',
              })
            }
            placeholder="Image or CSS gradient URL..."
            className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs text-white placeholder-white/30 focus:border-white/20 focus:outline-none"
          />
          <label className="cursor-pointer rounded-xl bg-white/10 px-3.5 py-2 text-xs font-medium text-white hover:bg-white/15 transition-colors">
            Upload
            <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
          </label>
          {settings.backgroundImage && (
            <button
              type="button"
              onClick={() =>
                updateSettings({ backgroundImage: null, presetTheme: 'default-dark' })
              }
              className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400 hover:bg-red-500/20"
            >
              Clear
            </button>
          )}
        </div>

        {/* Sliders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-white/70">Overlay Opacity</span>
              <span className="text-white/40 tabular-nums">
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
              className="w-full accent-[var(--color-accent)]"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-white/70">Backdrop Blur</span>
              <span className="text-white/40 tabular-nums">{settings.backgroundBlur}px</span>
            </div>
            <input
              type="range"
              min="0"
              max="40"
              step="1"
              value={settings.backgroundBlur}
              onChange={(e) => updateSettings({ backgroundBlur: parseInt(e.target.value, 10) })}
              className="w-full accent-[var(--color-accent)]"
            />
          </div>
        </div>
      </section>

      {/* 5. Typography & Clock */}
      <section className="glass-inner space-y-4 p-5 rounded-2xl border border-white/10">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-white/80 uppercase tracking-wider block">
            Greeting Name
          </label>
          <input
            type="text"
            value={settings.greetingName}
            onChange={(e) => updateSettings({ greetingName: e.target.value })}
            placeholder="e.g. Developer, Alex"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs text-white placeholder-white/30 focus:border-white/20 focus:outline-none"
          />
        </div>

        <div className="space-y-2 pt-2">
          <label className="text-xs font-semibold text-white/80 uppercase tracking-wider block">
            Digital Clock Format
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => updateSettings({ clock24h: false })}
              className={`rounded-xl px-4 py-2 text-xs font-medium transition-colors ${
                !settings.clock24h
                  ? 'bg-white/15 text-white ring-1 ring-white/20'
                  : 'bg-white/5 text-white/50 hover:bg-white/10'
              }`}
            >
              12-Hour (AM / PM)
            </button>
            <button
              type="button"
              onClick={() => updateSettings({ clock24h: true })}
              className={`rounded-xl px-4 py-2 text-xs font-medium transition-colors ${
                settings.clock24h
                  ? 'bg-white/15 text-white ring-1 ring-white/20'
                  : 'bg-white/5 text-white/50 hover:bg-white/10'
              }`}
            >
              24-Hour
            </button>
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <label className="text-xs font-semibold text-white/80 uppercase tracking-wider block">
            Clock Style
          </label>
          <div className="flex flex-wrap gap-3" role="radiogroup" aria-label="Clock style">
            {CLOCK_STYLES.map((style) => (
              <button
                key={style.id}
                type="button"
                role="radio"
                aria-checked={settings.clockStyle === style.id}
                onClick={() => updateSettings({ clockStyle: style.id })}
                className={`rounded-xl px-4 py-2 text-xs font-medium transition-colors ${
                  settings.clockStyle === style.id
                    ? 'bg-white/15 text-white ring-1 ring-white/20'
                    : 'bg-white/5 text-white/50 hover:bg-white/10'
                }`}
              >
                <span className={style.fontClass}>{style.label}</span>
              </button>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-2.5 pt-2 text-xs text-white/70">
          <input
            type="checkbox"
            checked={settings.showSeconds}
            onChange={(e) => updateSettings({ showSeconds: e.target.checked })}
            className="accent-[var(--color-accent)]"
          />
          Show seconds
        </label>
      </section>
    </div>
  );
}
