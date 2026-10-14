import { useEffect, useState } from 'react';
import { Backdrop } from './components/Backdrop';
import { CategoryGrid } from './components/CategoryGrid';
import { TopBar } from './components/topbar/TopBar';
import { WeatherUV } from './components/topbar/WeatherUV';
import { CommandPrompt } from './components/topbar/CommandPrompt';
import { TodoWidget } from './components/topbar/todo/TodoWidget';
import { GitWidget } from './components/topbar/GitWidget';
import { DashboardLayout, ZonePlaceholder } from './components/layout/DashboardLayout';
import { QuickLinks } from './components/QuickLinks';
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
      st.reseedLibrary();
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

  const settingsButton = (
    <button
      type="button"
      onClick={() => openSettings('library')}
      title="Open Settings (,)"
      aria-label="Settings"
      className="glass-raised group flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white/5 text-white/60 shadow-xl backdrop-blur-xl transition-all hover:scale-105 hover:bg-white/10 hover:text-white border border-white/15"
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
  );

  return (
    <>
      <Backdrop />
      <DashboardLayout
        topBar={
          <TopBar
            weather={<WeatherUV />}
            command={<CommandPrompt />}
            todo={<TodoWidget />}
            git={<GitWidget />}
          />
        }
        searchRow={<QuickLinks onOpenPalette={() => setIsPaletteOpen(true)} />}
        left={
          <>
            <ZonePlaceholder zone="D" title="Processing" note="Active workspaces land here in Phase 4." />
            <ZonePlaceholder zone="D" title="Processing" note="Second stack · mini settings cog." />
          </>
        }
        leftFooter={settingsButton}
        center={<CategoryGrid onOpenSettings={() => openSettings('library')} />}
        right={
          <div className="flex h-full min-h-0 flex-col gap-3">
            <ZonePlaceholder zone="I" title="Tech news" note="Items 1–4 · Phase 5." />
            <ZonePlaceholder zone="I" title="Dev jobs" note="Items 5–8 · Phase 5." />
            <ZonePlaceholder zone="J" title="Topics" note="#AI · #Frontend · #DevOps" />
          </div>
        }
      />

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
    </>
  );
}
