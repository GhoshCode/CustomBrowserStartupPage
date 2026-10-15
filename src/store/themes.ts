import type { ThemeMode } from '../types';

export interface PresetTheme {
  id: string;
  name: string;
  mode: ThemeMode;
  accentColor: string;
  gradient: string | null;
  description: string;
}

export const PRESET_THEMES: readonly PresetTheme[] = [
  {
    id: 'default-dark',
    name: 'Obsidian Violet',
    mode: 'dark',
    accentColor: '#ff2e9a',
    gradient: null,
    description: 'Default futuristic obsidian glass with violet particles',
  },
  {
    id: 'default-light',
    // Id kept so existing light-mode users move to Sonoma Glass automatically.
    // No gradient: the skin (src/lib/skin.ts) paints its own backdrop.
    name: 'Sonoma Glass',
    mode: 'light',
    accentColor: '#007aff',
    gradient: null,
    description: 'macOS-style frosted glass with clear, layered depth',
  },
  {
    id: 'pure-light',
    name: 'Absolute Light',
    mode: 'light',
    accentColor: '#4f46e5',
    gradient:
      'radial-gradient(at 10% 10%, rgba(224, 231, 255, 0.7) 0px, transparent 50%), radial-gradient(at 90% 90%, rgba(241, 245, 249, 0.8) 0px, transparent 55%), linear-gradient(135deg, #e8edf5 0%, #edf2f8 50%, #e2e8f0 100%)',
    description: 'Ultra-clean pure light mode with radiant slate backdrop',
  },
  {
    id: 'solar-light',
    name: 'Solar Amber',
    mode: 'light',
    accentColor: '#b45309',
    gradient: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 50%, #fde68a 100%)',
    description: 'Warm glowing sunlight with golden amber hues',
  },
  {
    id: 'sky-light',
    name: 'Sky Azure',
    mode: 'light',
    accentColor: '#0284c7',
    gradient: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #bae6fd 100%)',
    description: 'Clear azure daylight with crisp sky gradients',
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon',
    mode: 'dark',
    accentColor: '#00f0ff',
    gradient: 'linear-gradient(135deg, #090214 0%, #17042a 35%, #2a0845 70%, #03081e 100%)',
    description: 'High-octane neon cyan & purple electric night',
  },
  {
    id: 'aurora',
    name: 'Aurora Borealis',
    mode: 'dark',
    accentColor: '#10b981',
    gradient: 'linear-gradient(135deg, #04141d 0%, #002d44 35%, #005456 70%, #081e37 100%)',
    description: 'Arctic nocturnal waves of deep teal and glowing emerald',
  },
  {
    id: 'sunset',
    name: 'Sunset Horizon',
    mode: 'dark',
    accentColor: '#f59e0b',
    gradient: 'linear-gradient(135deg, #180922 0%, #35082e 40%, #521832 70%, #150620 100%)',
    description: 'Warm twilight dusk with amber and rose horizons',
  },
  {
    id: 'midnight',
    name: 'Midnight Abyss',
    mode: 'dark',
    accentColor: '#38bdf8',
    gradient: 'linear-gradient(135deg, #040610 0%, #080d22 45%, #0b1335 80%, #02040b 100%)',
    description: 'Deep oceanic trench navy with sapphire starlight',
  },
  {
    id: 'emerald',
    name: 'Emerald Matrix',
    mode: 'dark',
    accentColor: '#22c55e',
    gradient: 'linear-gradient(135deg, #020f06 0%, #042111 45%, #08381d 80%, #010803 100%)',
    description: 'Deep forest cyberpunk matrix with emerald glow',
  },
  {
    id: 'obsidian-monochrome',
    name: 'Obsidian Slate',
    mode: 'dark',
    accentColor: '#94a3b8',
    gradient: 'linear-gradient(135deg, #090a0c 0%, #111317 50%, #181b22 100%)',
    description: 'Ultra-minimalist stealth monochrome carbon glass',
  },
];
