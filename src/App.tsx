import React, { Suspense, useEffect, useState } from 'react';
import { Backdrop } from './components/Backdrop';
import { CategoryGrid } from './components/CategoryGrid';
import { Header } from './components/Header';
import { QuickLinks } from './components/QuickLinks';
import { CommandPalette } from './components/CommandPalette';
import { useStore } from './store';
import type { SettingsTabId } from './components/settings/SettingsModal';

const SettingsModal = React.lazy(() => import('./components/settings/SettingsModal'));

export default function App() {
  const accentColor = useStore((s) => s.settings.accentColor);

  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<SettingsTabId>('library');
  const [settingsPrefill, setSettingsPrefill] = useState('');

  // Dynamically update root accent variable
  useEffect(() => {
    if (accentColor) {
      document.documentElement.style.setProperty('--color-accent', accentColor);
    }
  }, [accentColor]);

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
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPaletteOpen, isSettingsOpen]);

  const handleOpenAddSiteFromPalette = (prefill: string) => {
    setSettingsPrefill(prefill);
    setSettingsTab('library');
    setIsSettingsOpen(true);
  };

  return (
    <>
      <Backdrop />
      <div className="flex min-h-dvh flex-col relative z-0">
        <Header />
        <QuickLinks />
        <CategoryGrid
          onOpenSettings={() => {
            setSettingsPrefill('');
            setSettingsTab('library');
            setIsSettingsOpen(true);
          }}
        />

        {/* Floating Controls Bar (Command Palette & Settings Gear) */}
        <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsPaletteOpen(true)}
            title="Search sites (Ctrl+K or /)"
            aria-label="Open command palette"
            className="glass-inner group flex items-center gap-2 rounded-2xl bg-white/5 px-3.5 py-2.5 text-xs text-white/60 shadow-lg backdrop-blur-md transition-all hover:bg-white/10 hover:text-white hover:border-white/20"
          >
            <svg className="size-4 text-white/50 group-hover:text-white" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                clipRule="evenodd"
              />
            </svg>
            <span className="hidden sm:inline">Search</span>
            <kbd className="rounded border border-white/15 bg-white/5 px-1.5 py-0.5 text-[10px] font-medium text-white/40">
              ⌘K
            </kbd>
          </button>

          <button
            type="button"
            onClick={() => {
              setSettingsPrefill('');
              setSettingsTab('library');
              setIsSettingsOpen(true);
            }}
            title="Open Settings"
            aria-label="Settings"
            className="glass-inner group flex size-11 items-center justify-center rounded-2xl bg-white/5 text-white/60 shadow-lg backdrop-blur-md transition-all hover:scale-105 hover:bg-white/10 hover:text-white hover:border-white/20"
          >
            <svg
              className="size-5 transition-transform duration-500 group-hover:rotate-90"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        {/* Command Palette Overlay */}
        <CommandPalette
          isOpen={isPaletteOpen}
          onClose={() => setIsPaletteOpen(false)}
          onAddSite={handleOpenAddSiteFromPalette}
        />

        {/* Lazy Settings Overlay */}
        <Suspense fallback={null}>
          {isSettingsOpen && (
            <SettingsModal
              isOpen={isSettingsOpen}
              onClose={() => setIsSettingsOpen(false)}
              initialTab={settingsTab}
              prefillUrl={settingsPrefill}
              onClearPrefill={() => setSettingsPrefill('')}
            />
          )}
        </Suspense>
      </div>
    </>
  );
}
