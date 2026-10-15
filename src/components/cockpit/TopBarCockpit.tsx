import { memo } from 'react';
import { TimeWidget } from './TimeWidget';
import { WeatherWidget } from './WeatherWidget';
import { TodoWidget } from './TodoWidget';
import { GitCommitsWidget } from './GitCommitsWidget';
import { DateGreetWidget } from './DateGreetWidget';

interface TopBarCockpitProps {
  onOpenSettings?: () => void;
  onOpenPalette?: () => void;
}

export const TopBarCockpit = memo(function TopBarCockpit(_props: TopBarCockpitProps) {
  return (
    <header className="w-full shrink-0 px-6 pt-4 pb-2">
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Column 1: Time & Weather */}
        <div className="glass group relative flex h-[142px] items-center justify-between overflow-hidden rounded-2xl p-3.5 border border-white/10 hover:border-white/15 transition-all">
          <TimeWidget />
          <WeatherWidget />
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
