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
    name: 'Pearlescent Day',
    mode: 'light',
    accentColor: '#7c3aed',
    gradient: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)',
    description: 'Crisp, high-contrast light mode with frosted glass',
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
