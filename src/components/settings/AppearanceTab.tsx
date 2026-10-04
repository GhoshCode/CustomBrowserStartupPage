import React from 'react';
import { useStore } from '../../store';

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        updateSettings({ backgroundImage: dataUrl });
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="max-w-2xl space-y-8 p-6 text-sm text-white/90">
      <div>
        <h3 className="font-display text-base font-semibold text-white">Appearance</h3>
        <p className="text-xs text-white/50">Personalize your DevDeck theme, backdrop, and clock.</p>
      </div>

      {/* Accent Color */}
      <section className="space-y-3">
        <label className="text-xs font-semibold text-white/70 uppercase tracking-wider">
          Accent Color
        </label>
        <div className="flex flex-wrap items-center gap-3">
          {PRESET_ACCENTS.map((preset) => (
            <button
              key={preset.hex}
              type="button"
              onClick={() => updateSettings({ accentColor: preset.hex })}
              className={`flex size-8 items-center justify-center rounded-full transition-transform ${
                settings.accentColor === preset.hex ? 'scale-110 ring-2 ring-white shadow-lg' : 'hover:scale-105'
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
            />
            <span className="font-mono text-xs text-white/60">{settings.accentColor}</span>
          </div>
        </div>
      </section>

      {/* Greeting Name */}
      <section className="space-y-2">
        <label className="text-xs font-semibold text-white/70 uppercase tracking-wider">
          Greeting Name
        </label>
        <input
          type="text"
          value={settings.greetingName}
          onChange={(e) => updateSettings({ greetingName: e.target.value })}
          placeholder="e.g. Developer, Alex"
          className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-sm text-white placeholder-white/30 focus:border-white/20 focus:outline-none"
        />
        <p className="text-[11px] text-white/40">Displayed in the header greeting (e.g., "Morning, {settings.greetingName || 'Guest'}").</p>
      </section>

      {/* Clock Format */}
      <section className="space-y-2">
        <label className="text-xs font-semibold text-white/70 uppercase tracking-wider">
          Digital Clock Format
        </label>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => updateSettings({ clock24h: false })}
            className={`rounded-xl px-4 py-2 text-xs font-medium transition-colors ${
              !settings.clock24h ? 'bg-white/15 text-white ring-1 ring-white/20' : 'bg-white/5 text-white/50 hover:bg-white/10'
            }`}
          >
            12-Hour (AM / PM)
          </button>
          <button
            type="button"
            onClick={() => updateSettings({ clock24h: true })}
            className={`rounded-xl px-4 py-2 text-xs font-medium transition-colors ${
              settings.clock24h ? 'bg-white/15 text-white ring-1 ring-white/20' : 'bg-white/5 text-white/50 hover:bg-white/10'
            }`}
          >
            24-Hour
          </button>
        </div>
      </section>

      {/* Background Image */}
      <section className="space-y-3">
        <label className="text-xs font-semibold text-white/70 uppercase tracking-wider">
          Backdrop Image
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={settings.backgroundImage || ''}
            onChange={(e) => updateSettings({ backgroundImage: e.target.value || null })}
            placeholder="Image URL (https://...)"
            className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs text-white placeholder-white/30 focus:border-white/20 focus:outline-none"
          />
          <label className="cursor-pointer rounded-xl bg-white/10 px-3.5 py-2 text-xs font-medium text-white hover:bg-white/15 transition-colors">
            Upload
            <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
          </label>
          {settings.backgroundImage && (
            <button
              type="button"
              onClick={() => updateSettings({ backgroundImage: null })}
              className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400 hover:bg-red-500/20"
            >
              Clear
            </button>
          )}
        </div>
      </section>

      {/* Overlay Opacity & Blur Sliders */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-white/70">Overlay Opacity</span>
            <span className="text-white/40 tabular-nums">{Math.round(settings.overlayOpacity * 100)}%</span>
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

        <div className="space-y-2">
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
      </section>
    </div>
  );
}
