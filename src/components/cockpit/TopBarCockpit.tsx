import { memo } from 'react';
import { TimeWidget } from './TimeWidget';
import { WeatherWidget } from './WeatherWidget';
import { CommandPrompt } from './CommandPrompt';
import { TodoWidget } from './TodoWidget';
import { GitCommitsWidget } from './GitCommitsWidget';
import { DateGreetWidget } from './DateGreetWidget';

interface TopBarCockpitProps {
  onOpenSettings?: () => void;
  onOpenPalette?: () => void;
}

export const TopBarCockpit = memo(function TopBarCockpit({
  onOpenSettings,
  onOpenPalette,
}: TopBarCockpitProps) {
  return (
    <header className="w-full shrink-0 px-6 pt-4 pb-2">
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Column 1: Time, Weather & Command Prompt */}
        <div className="glass group relative flex h-[142px] flex-col justify-between overflow-hidden rounded-2xl p-3.5 border border-white/10 hover:border-white/15 transition-all">
          <div className="flex items-center justify-between gap-2">
            <TimeWidget />
            <WeatherWidget />
          </div>
          <div className="mt-auto pt-2">
            <CommandPrompt
              onOpenSettings={onOpenSettings}
              onOpenPalette={onOpenPalette}
            />
          </div>
        </div>

        {/* Column 2: TodoWidget (Tasks, Overdue danger zone, 30s auto-shrink overlay) */}
        <TodoWidget />

        {/* Column 3: GitCommitsWidget (classic green matrix, streaks, annual commits) */}
        <GitCommitsWidget />

        {/* Column 4: DateGreetWidget (uppercase date, dynamic greeting, quotes) */}
        <DateGreetWidget />
      </div>
    </header>
  );
});
