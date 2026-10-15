import { useEffect, useState } from 'react';
import { Backdrop } from './components/Backdrop';
import { CategoryGrid } from './components/CategoryGrid';
import { TopBarCockpit } from './components/cockpit/TopBarCockpit';
import { SearchBar } from './components/search/SearchBar';
import { CurrentlyProcessingPanel } from './components/processing/CurrentlyProcessingPanel';
import { ScrapedNewsPanel } from './components/news/ScrapedNewsPanel';
import { TopicChips } from './components/news/TopicChips';
import { CommandPalette } from './components/CommandPalette';
import SettingsModal, { type SettingsTabId } from './components/settings/SettingsModal';
import { useStore } from './store';

export default function App() {
  const accentColor = useStore((s) => s.settings.accentColor);

  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<SettingsTabId>('library');
  const [settingsPrefill, setSettingsPrefill] = useState('');

  const openSettings = (tab: SettingsTabId = 'library', prefill = '') => {
    setSettingsPrefill(prefill);
    setSettingsTab(tab);
    setIsSettingsOpen(true);
  };

  const themeMode = useStore((s) => s.settings.themeMode ?? 'dark');

  // Dynamically update root accent variable and theme attribute
  useEffect(() => {
    if (accentColor) {
      document.documentElement.style.setProperty('--color-accent', accentColor);
    }
    document.documentElement.setAttribute('data-theme', themeMode);
  }, [accentColor, themeMode]);

  // Ensure active deck always contains 10+ categories and 200+ sites
  useEffect(() => {
    const st = useStore.getState();
    if (st.categories.length < 10) {
      st.resetToSeed();
    }
  }, []);

  // Global hotkeys for Command Palette (Ctrl+K, Cmd+K, /) and Settings (,)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl?.tagName === 'INPUT' ||
        activeEl?.tagName === 'TEXTAREA' ||
        (activeEl as HTMLElement)?.isContentEditable;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsPaletteOpen((prev) => !prev);
      } else if (e.key === '/' && !isInput && !isPaletteOpen && !isSettingsOpen) {
        e.preventDefault();
        setIsPaletteOpen(true);
      } else if (e.key === ',' && !isInput && !isPaletteOpen && !isSettingsOpen) {
        e.preventDefault();
        openSettings();
      } else if (e.key === 'Escape') {
        if (isSettingsOpen) {
          setIsSettingsOpen(false);
        } else if (isPaletteOpen) {
          setIsPaletteOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPaletteOpen, isSettingsOpen]);

  return (
    <>
      <Backdrop />
      <div className="flex h-screen w-screen max-h-screen max-w-screen flex-col relative z-0 overflow-hidden">
        {/* Top Header Cockpit: 4 columns */}
        <TopBarCockpit
          onOpenSettings={() => openSettings('appearance')}
          onOpenPalette={() => setIsPaletteOpen(true)}
        />

        {/* Search Row: [G] centered search bar with [G1] Bookmark Site Map */}
        <SearchBar onOpenPalette={() => setIsPaletteOpen(true)} />

        {/* Lower Cockpit: 3-Column Spatial Grid */}
        <div className="flex flex-1 min-h-0 w-full gap-4 px-6 pb-2 overflow-hidden">
          {/* Left Column: D (Currently Working Sites partitioned by section) */}
          <CurrentlyProcessingPanel
            onOpenSettings={(tab) => openSettings(tab as SettingsTabId)}
          />

          {/* Center Column: Unified Container ([E] 4 Fixed Quick Links | [F] Recent Links + Category Cards) */}
          <CategoryGrid onOpenSettings={() => openSettings('library')} />

          {/* Right Column: I (Tech News items 1-4, Dev Jobs items 5-8) + J (Topic Chips) */}
          <aside className="flex flex-col gap-3 w-64 lg:w-72 shrink-0 h-full min-h-0">
            <ScrapedNewsPanel />
            <TopicChips />
          </aside>
        </div>

        {/* Main Settings Button in bottom left */}
        <div className="fixed bottom-3 left-6 z-40 flex items-center">
          <button
            type="button"
            onClick={() => openSettings('library')}
            title="Open Settings (,)"
            aria-label="Settings"
            className="glass-raised group flex h-9 items-center gap-2 rounded-xl bg-white/[0.06] px-3 text-xs font-semibold text-white/75 shadow-xl backdrop-blur-xl transition-all hover:scale-105 hover:bg-white/[0.12] hover:text-white border border-white/15"
          >
            <svg
              className="size-4 transition-transform duration-500 group-hover:rotate-90 text-cyan-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
                clipRule="evenodd"
              />
            </svg>
            <span>Settings</span>
            <kbd className="font-mono text-[9px] text-white/40 bg-white/10 px-1 py-0.2 rounded">,</kbd>
          </button>
        </div>

        {/* Command Palette Overlay */}
        <CommandPalette
          isOpen={isPaletteOpen}
          onClose={() => setIsPaletteOpen(false)}
          onAddSite={(prefill) => openSettings('library', prefill)}
        />

        {/* Settings Overlay */}
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          initialTab={settingsTab}
          prefillUrl={settingsPrefill}
          onClearPrefill={() => setSettingsPrefill('')}
        />

      </div>
    </>
  );
}
