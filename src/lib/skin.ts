import type { Settings } from '../types';

// Visual skins layered on top of a theme mode. "sonoma" is the premium macOS
// glass light theme (Sonoma Glass); it applies to the default light preset
// only, so the other light presets and custom wallpapers keep their own look.
export type Skin = 'sonoma' | null;

export const SONOMA_ACCENT = '#007aff';

export function skinFor(s: Pick<Settings, 'themeMode' | 'presetTheme' | 'backgroundImage'>): Skin {
  if (s.themeMode !== 'light' || s.backgroundImage) return null;
  return !s.presetTheme || s.presetTheme === 'default-light' ? 'sonoma' : null;
}
