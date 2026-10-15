import type { ThemeMode } from '../types';

export interface PresetTheme {
  id: string;
  name: string;
  category: 'macos' | 'abstract' | 'solids' | 'light';
  mode: ThemeMode;
  accentColor: string;
  gradient: string | null;
  description: string;
}

export const PRESET_THEMES: readonly PresetTheme[] = [
  // 🍏 macOS Flagships
  {
    id: 'macos-sonoma',
    name: 'Sonoma Horizon',
    category: 'macos',
    mode: 'dark',
    accentColor: '#ff2e9a',
    gradient:
      'radial-gradient(at 0% 0%, rgba(244, 63, 94, 0.45) 0px, transparent 55%), radial-gradient(at 100% 0%, rgba(245, 158, 11, 0.4) 0px, transparent 50%), radial-gradient(at 50% 100%, rgba(139, 92, 246, 0.45) 0px, transparent 60%), radial-gradient(at 0% 100%, rgba(99, 102, 241, 0.35) 0px, transparent 50%), linear-gradient(135deg, #0b0713 0%, #150928 45%, #0d061c 100%)',
    description: 'Flagship macOS Sonoma twilight dusk mesh with warm amber & obsidian glass',
  },
  {
    id: 'macos-sequoia',
    name: 'Sequoia Redwood',
    category: 'macos',
    mode: 'dark',
    accentColor: '#2dd4bf',
    gradient:
      'radial-gradient(at 0% 0%, rgba(20, 184, 166, 0.38) 0px, transparent 55%), radial-gradient(at 100% 100%, rgba(16, 185, 129, 0.32) 0px, transparent 50%), radial-gradient(at 50% 50%, rgba(5, 150, 105, 0.28) 0px, transparent 60%), linear-gradient(135deg, #02120e 0%, #06231b 45%, #02140e 100%)',
    description: 'Deep cedar twilight, emerald pine fog, and dark alpine frosted glass',
  },
  {
    id: 'macos-ventura',
    name: 'Ventura Silk',
    category: 'macos',
    mode: 'dark',
    accentColor: '#f97316',
    gradient:
      'radial-gradient(at 20% 20%, rgba(249, 115, 22, 0.45) 0px, transparent 50%), radial-gradient(at 80% 80%, rgba(236, 72, 153, 0.4) 0px, transparent 55%), radial-gradient(at 50% 100%, rgba(168, 85, 247, 0.35) 0px, transparent 60%), linear-gradient(135deg, #0d041a 0%, #200635 45%, #0a0216 100%)',
    description: 'Vibrant abstract orange-amber silk ribbon on cosmic indigo',
  },
  {
    id: 'macos-monterey',
    name: 'Monterey Peak',
    category: 'macos',
    mode: 'dark',
    accentColor: '#af52de',
    gradient:
      'radial-gradient(at 10% 10%, rgba(192, 132, 252, 0.4) 0px, transparent 50%), radial-gradient(at 90% 90%, rgba(244, 63, 94, 0.35) 0px, transparent 55%), linear-gradient(135deg, #0f0520 0%, #28084a 50%, #0d041c 100%)',
    description: 'Deep violet, dusk magenta, and obsidian mountain dusk',
  },
  {
    id: 'macos-bigsur',
    name: 'Big Sur Coast',
    category: 'macos',
    mode: 'dark',
    accentColor: '#007aff',
    gradient:
      'radial-gradient(at 0% 0%, rgba(14, 165, 233, 0.45) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(99, 102, 241, 0.35) 0px, transparent 55%), radial-gradient(at 50% 0%, rgba(56, 189, 248, 0.3) 0px, transparent 50%), linear-gradient(135deg, #030d22 0%, #07193b 50%, #020919 100%)',
    description: 'Azure Californian coastal ocean, golden sunlight, and sapphire depth',
  },
  {
    id: 'macos-midnight-pro',
    name: 'Studio Midnight',
    category: 'solids',
    mode: 'dark',
    accentColor: '#8e8e93',
    gradient:
      'radial-gradient(at 50% 0%, rgba(56, 189, 248, 0.15) 0px, transparent 60%), linear-gradient(135deg, #050608 0%, #0b0d13 50%, #11141c 100%)',
    description: 'Apple Studio Display matte carbon obsidian with subtle sapphire illumination',
  },
  {
    id: 'macos-space-black',
    name: 'Space Black',
    category: 'solids',
    mode: 'dark',
    accentColor: '#6366f1',
    gradient: 'linear-gradient(135deg, #020203 0%, #07080a 50%, #0d0e12 100%)',
    description: 'Pure deep stealth Space Black with micro-frosted specular borders',
  },

  // 🌌 Abstract & Gradients
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon',
    category: 'abstract',
    mode: 'dark',
    accentColor: '#00f0ff',
    gradient: 'linear-gradient(135deg, #090214 0%, #17042a 35%, #2a0845 70%, #03081e 100%)',
    description: 'High-octane neon cyan & purple electric night with futuristic glow',
  },
  {
    id: 'aurora',
    name: 'Aurora Borealis',
    category: 'abstract',
    mode: 'dark',
    accentColor: '#34c759',
    gradient: 'linear-gradient(135deg, #04141d 0%, #002d44 35%, #005456 70%, #081e37 100%)',
    description: 'Arctic nocturnal waves of deep teal and glowing emerald',
  },
  {
    id: 'sunset',
    name: 'Sunset Horizon',
    category: 'abstract',
    mode: 'dark',
    accentColor: '#ff9500',
    gradient: 'linear-gradient(135deg, #180922 0%, #35082e 40%, #521832 70%, #150620 100%)',
    description: 'Warm twilight dusk with amber and rose horizons',
  },

  // ☀️ macOS Light Modes
  {
    id: 'default-light',
    name: 'Sonoma Light',
    category: 'light',
    mode: 'light',
    accentColor: '#7c3aed',
    gradient:
      'radial-gradient(at 0% 0%, rgba(199, 210, 254, 0.75) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(254, 205, 211, 0.6) 0px, transparent 50%), radial-gradient(at 50% 50%, rgba(224, 231, 255, 0.6) 0px, transparent 60%), radial-gradient(at 0% 100%, rgba(186, 230, 253, 0.7) 0px, transparent 55%), radial-gradient(at 100% 100%, rgba(253, 230, 138, 0.45) 0px, transparent 50%), linear-gradient(135deg, #eef2ff 0%, #f8fafc 50%, #f1f5f9 100%)',
    description: 'Pearlescent morning sky, warm peach, and frosted starlight glass',
  },
  {
    id: 'pure-light',
    name: 'Sequoia Alpine Light',
    category: 'light',
    mode: 'light',
    accentColor: '#007aff',
    gradient:
      'radial-gradient(at 10% 10%, rgba(224, 231, 255, 0.7) 0px, transparent 50%), radial-gradient(at 90% 90%, rgba(241, 245, 249, 0.8) 0px, transparent 55%), linear-gradient(135deg, #e8edf5 0%, #edf2f8 50%, #e2e8f0 100%)',
    description: 'Ultra-clean pure light mode with radiant alpine slate backdrop',
  },
  {
    id: 'solar-light',
    name: 'Solar Starlight',
    category: 'light',
    mode: 'light',
    accentColor: '#ff9500',
    gradient: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 50%, #fde68a 100%)',
    description: 'Warm glowing sunlight with golden starlight hues',
  },
];
