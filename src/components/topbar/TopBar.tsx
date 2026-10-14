import type { ReactNode } from 'react';
import { TimeWidget } from './TimeWidget';
import { DateGreet } from './DateGreet';

// Zone 1 (plan §1): [TIME | A/B] over C, then TO DO, GIT COMMITS, DATE/GREET.
// Slots for widgets built separately are passed in so this stays layout-only.
interface TopBarProps {
  weather: ReactNode;
  command: ReactNode;
  todo: ReactNode;
  git: ReactNode;
}

export function TopBar({ weather, command, todo, git }: TopBarProps) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:h-[150px] lg:grid-cols-[minmax(310px,340px)_minmax(0,1fr)_minmax(0,1fr)_minmax(200px,auto)]">
      <div data-widget="time-cluster" className="flex min-w-0 flex-col gap-2">
        <div className="grid min-h-[96px] flex-1 grid-cols-[minmax(0,1fr)_92px] gap-2">
          <TimeWidget />
          {weather}
        </div>
        {command}
      </div>
      <div data-widget="todo" className="relative min-h-[150px] min-w-0">
        {todo}
      </div>
      <div data-widget="git" className="min-h-[150px] min-w-0">
        {git}
      </div>
      <div data-widget="date-greet" className="min-w-0 md:col-span-2 lg:col-span-1">
        <DateGreet />
      </div>
    </div>
  );
}
