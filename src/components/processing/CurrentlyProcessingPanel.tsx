import { memo, useState } from 'react';
import { useStore } from '../../store';

interface CurrentlyProcessingPanelProps {
  onOpenSettings?: (tab: 'general' | 'library' | 'appearance' | 'shortcuts' | 'about') => void;
}

export const CurrentlyProcessingPanel = memo(function CurrentlyProcessingPanel({
  onOpenSettings,
}: CurrentlyProcessingPanelProps) {
  const processingSites = useStore((s) => s.processingSites);

  // Default demonstration active pipeline tasks if none yet added
  const [activeTasks] = useState([
    {
      id: 'task-build-1',
      name: 'Vite Production Bundler',
      status: 'active',
      progress: 68,
      eta: '42s remaining',
    },
    {
      id: 'task-test-2',
      name: 'Vitest Unit & E2E Suites',
      status: 'running',
      progress: 92,
      eta: '5s remaining',
    },
  ]);

  return (
    <aside className="flex flex-col gap-3.5 w-64 lg:w-72 shrink-0 h-full">
      {/* Upper Card: Active Processing / Pipelines */}
      <div className="glass flex-1 rounded-3xl border border-white/10 p-4 flex flex-col justify-between overflow-hidden shadow-lg backdrop-blur-xl">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-cyan-500" />
              </span>
              <span className="font-display text-xs font-bold tracking-wider text-white/90 uppercase">
                PROCESSING
              </span>
            </div>
            <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-[10px] font-semibold text-cyan-300 border border-cyan-500/30">
              {activeTasks.length} Active
            </span>
          </div>

          {/* Active Tasks list */}
          <div className="mt-3 flex flex-col gap-2.5">
            {activeTasks.map((task) => (
              <div
                key={task.id}
                className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5 flex flex-col gap-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white/90 truncate">
                    {task.name}
                  </span>
                  <span className="text-[10px] font-mono text-cyan-300 font-medium">
                    {task.progress}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-pink-500 transition-all duration-500"
                    style={{ width: `${task.progress}%` }}
                  />
                </div>

                <span className="text-[9px] text-white/40 font-mono text-right">
                  {task.eta}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-2 text-[10px] text-white/30 text-center font-mono border-t border-white/[0.04]">
          CPU: 18% · MEM: 3.2 GB
        </div>
      </div>

      {/* Lower Card: Scheduled Tasks & Processing Sites with Bottom-Right [⚙] Cog */}
      <div className="glass relative flex-1 rounded-3xl border border-white/10 p-4 flex flex-col justify-between overflow-hidden shadow-lg backdrop-blur-xl">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <span className="text-xs text-amber-400">⏱️</span>
              <span className="font-display text-xs font-bold tracking-wider text-white/90 uppercase">
                SCHEDULED RUNS
              </span>
            </div>
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-white/60">
              {processingSites.length > 0 ? processingSites.length : '3 Crons'}
            </span>
          </div>

          {/* Scheduled items */}
          <div className="mt-3 flex flex-col gap-2">
            {processingSites.length > 0 ? (
              processingSites.slice(0, 3).map((site) => (
                <div
                  key={site.id}
                  className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-2 flex items-center justify-between"
                >
                  <span className="text-xs text-white/85 truncate font-medium">{site.name}</span>
                  <span className="text-[10px] font-mono text-amber-300/80 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                    {site.schedule.timeOfDay || site.schedule.frequency}
                  </span>
                </div>
              ))
            ) : (
              <>
                <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-2 flex items-center justify-between">
                  <span className="text-xs text-white/85 truncate font-medium">Nightly DB Backup</span>
                  <span className="text-[10px] font-mono text-amber-300/80 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                    02:00 UTC
                  </span>
                </div>
                <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-2 flex items-center justify-between">
                  <span className="text-xs text-white/85 truncate font-medium">S3 Asset Archiver</span>
                  <span className="text-[10px] font-mono text-amber-300/80 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                    Hourly
                  </span>
                </div>
                <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-2 flex items-center justify-between">
                  <span className="text-xs text-white/85 truncate font-medium">SSL Cert Renewal Check</span>
                  <span className="text-[10px] font-mono text-amber-300/80 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                    Weekly
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer with Mini Settings Cog [⚙] in BOTTOM-RIGHT corner */}
        <div className="flex items-center justify-between pt-2 border-t border-white/[0.04]">
          <span className="text-[10px] text-white/30">Daemon active</span>

          {/* Mini Settings Cog in the bottom-right corner of lower card */}
          <button
            type="button"
            onClick={() => onOpenSettings?.('general')}
            title="Configure Processing & Schedules"
            aria-label="Processing Settings"
            className="group flex size-6 items-center justify-center rounded-lg bg-white/5 text-white/50 hover:bg-white/15 hover:text-white transition-all border border-white/10"
          >
            <svg
              className="size-3.5 transition-transform duration-500 group-hover:rotate-90"
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
      </div>
    </aside>
  );
});
