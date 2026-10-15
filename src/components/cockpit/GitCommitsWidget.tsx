import { memo, useEffect, useState } from 'react';
import { useStore } from '../../store';
import type { GitStats } from '../../types';

const LEVEL_COLORS: Record<number, string> = {
  0: 'bg-white/[0.04] border border-white/[0.03]',
  1: 'bg-emerald-950/80 border border-emerald-900/40',
  2: 'bg-emerald-800/80 border border-emerald-700/50',
  3: 'bg-emerald-600/90 border border-emerald-500/50',
  4: 'bg-emerald-400 border border-emerald-300/60 shadow-[0_0_6px_rgba(52,211,153,0.4)]',
};

// Generate realistic synthetic contribution days for fallback
function generateSyntheticDays(days = 112) {
  const result: Array<{ date: string; count: number; level: 0 | 1 | 2 | 3 | 4 }> = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];

    // Seeded pseudo-random activity
    const rand = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
    const factor = Math.abs(rand - Math.floor(rand));
    const dayOfWeek = d.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    let count = 0;
    let level: 0 | 1 | 2 | 3 | 4 = 0;

    if (!isWeekend && factor > 0.3) {
      count = Math.floor(factor * 9) + 1;
      if (count > 7) level = 4;
      else if (count > 4) level = 3;
      else if (count > 2) level = 2;
      else level = 1;
    } else if (isWeekend && factor > 0.7) {
      count = Math.floor(factor * 5) + 1;
      level = count > 3 ? 2 : 1;
    }

    result.push({ date: dateStr, count, level });
  }

  return result;
}

interface GitHudStats extends GitStats {
  publicRepos: number;
  activeBranch: string;
  latestCommitSha: string;
  latestCommitMsg: string;
  latestCommitTime: string;
  lastMergedPr: string;
  lastMergedTime: string;
}

export const GitCommitsWidget = memo(function GitCommitsWidget() {
  const githubUsername = useStore((s) => s.settings.githubUsername);
  const [stats, setStats] = useState<GitHudStats>(() => ({
    username: githubUsername || 'GhoshCode',
    totalCommitsYear: 1420,
    currentStreak: 14,
    longestStreak: 42,
    publicRepos: 34,
    activeBranch: 'v6.0-gemini',
    latestCommitSha: '621f5d1',
    latestCommitMsg: 'feat: theme system & diverse presets',
    latestCommitTime: '12m ago',
    lastMergedPr: 'PR #22',
    lastMergedTime: '2h ago',
    contributions: generateSyntheticDays(112), // 16 weeks * 7 days
    lastFetched: Date.now(),
  }));
  const [hoveredDay, setHoveredDay] = useState<{ date: string; count: number } | null>(null);

  useEffect(() => {
    if (!githubUsername) return;

    let isMounted = true;
    const fetchGitHub = async () => {
      try {
        // Fetch user metadata for repos count
        const userRes = await fetch(`https://api.github.com/users/${githubUsername}`).catch(() => null);
        let publicRepos = 34;
        if (userRes && userRes.ok) {
          const userData = await userRes.json();
          publicRepos = userData.public_repos ?? 34;
        }

        // Fetch user public events or repos for latest commit info
        const eventsRes = await fetch(`https://api.github.com/users/${githubUsername}/events/public`).catch(() => null);
        let latestCommitSha = '621f5d1';
        let latestCommitMsg = 'feat: theme system & diverse presets';
        let latestCommitTime = '12m ago';
        let lastMergedPr = 'PR #22';
        let lastMergedTime = '2h ago';
        let activeBranch = 'v6.0-gemini';

        if (eventsRes && eventsRes.ok) {
          const events = await eventsRes.json();
          if (Array.isArray(events) && events.length > 0) {
            const pushEvent = events.find((e: any) => e.type === 'PushEvent');
            if (pushEvent) {
              const headCommit = pushEvent.payload?.commits?.[0];
              if (headCommit) {
                latestCommitSha = headCommit.sha ? headCommit.sha.slice(0, 7) : '621f5d1';
                latestCommitMsg = headCommit.message ? headCommit.message.split('\n')[0].slice(0, 38) : latestCommitMsg;
              }
              if (pushEvent.payload?.ref) {
                activeBranch = pushEvent.payload.ref.replace('refs/heads/', '');
              }
            }

            const prEvent = events.find((e: any) => e.type === 'PullRequestEvent');
            if (prEvent && prEvent.payload?.pull_request) {
              lastMergedPr = `PR #${prEvent.payload.number || 22}`;
              lastMergedTime = 'today';
            }
          }
        }

        // Fetch contribution history
        const res = await fetch(
          `https://github-contributions-api.jogruber.de/v4/${githubUsername}?y=last`,
        );
        if (!res.ok) throw new Error('Failed to fetch github stats');
        const data = await res.json();
        const contributions = data.contributions ?? [];
        const recentDays = contributions.slice(-112).map((c: any) => ({
          date: c.date,
          count: c.count,
          level: Math.min(4, c.level ?? 0) as 0 | 1 | 2 | 3 | 4,
        }));

        if (isMounted) {
          setStats((prev) => ({
            ...prev,
            username: githubUsername,
            totalCommitsYear: data.total?.[Object.keys(data.total)[0]] ?? 1420,
            publicRepos,
            activeBranch,
            latestCommitSha,
            latestCommitMsg,
            latestCommitTime,
            lastMergedPr,
            lastMergedTime,
            contributions: recentDays,
            lastFetched: Date.now(),
          }));
        }
      } catch {
        // Keep synthetic fallback
      }
    };

    fetchGitHub();
    return () => {
      isMounted = false;
    };
  }, [githubUsername]);

  return (
    <div className="glass group relative flex h-[142px] w-full flex-col justify-between overflow-hidden rounded-2xl p-3 border border-white/10 hover:border-white/15 transition-all select-none">
      {/* Header row: Username + Repos Count + Commits Count */}
      <div className="flex items-center justify-between pb-1 border-b border-white/[0.06]">
        <div className="flex items-center gap-1.5 min-w-0">
          <svg className="size-3.5 text-emerald-400 shrink-0" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
          </svg>
          <span className="font-display text-xs font-bold tracking-wider text-white/90 uppercase truncate">
            {stats.username}
          </span>
          {/* Explicit Repository Count badge */}
          <span className="rounded-full bg-white/10 px-1.5 py-0.2 text-[9px] font-mono text-white/80 border border-white/10">
            {stats.publicRepos} repos
          </span>
        </div>

        {/* Branch & Merge Status badge */}
        <div className="flex items-center gap-1.5">
          <span className="rounded-md bg-purple-500/20 px-1.5 py-0.5 text-[9px] font-mono font-semibold text-purple-300 border border-purple-500/30 flex items-center gap-1">
            <span>🌿</span>
            <span className="truncate max-w-[80px]">{stats.activeBranch}</span>
          </span>
          <span className="rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-300 border border-emerald-500/25">
            {stats.totalCommitsYear.toLocaleString()} commits
          </span>
        </div>
      </div>

      {/* Contribution Grid — 16 columns (weeks) x 7 rows (days) */}
      <div className="my-auto flex items-center justify-center gap-[3px] py-0.5">
        {Array.from({ length: 16 }).map((_, weekIdx) => {
          const weekDays = stats.contributions.slice(weekIdx * 7, weekIdx * 7 + 7);
          return (
            <div key={weekIdx} className="flex flex-col gap-[3px]">
              {weekDays.map((day) => (
                <div
                  key={day.date}
                  onMouseEnter={() => setHoveredDay(day)}
                  onMouseLeave={() => setHoveredDay(null)}
                  className={`size-[9px] rounded-[2px] transition-transform hover:scale-125 cursor-pointer ${
                    LEVEL_COLORS[day.level]
                  }`}
                />
              ))}
            </div>
          );
        })}
      </div>

      {/* Footer Git Status Row: Branch Details, Merged Status & Latest Commit (Replaces Languages) */}
      <div className="flex items-center justify-between pt-1 text-[10px] text-white/50 border-t border-white/[0.04]">
        {hoveredDay ? (
          <span className="font-mono text-emerald-300">
            {hoveredDay.count} commits on {hoveredDay.date}
          </span>
        ) : (
          <div className="flex items-center gap-2 truncate min-w-0">
            {/* Merged Status */}
            <span className="flex items-center gap-1 text-[9px] text-cyan-300 shrink-0 font-medium">
              <span>🔀</span>
              <span>{stats.lastMergedPr} merged ({stats.lastMergedTime})</span>
            </span>

            <span className="text-white/20">·</span>

            {/* Latest Commit */}
            <span className="flex items-center gap-1 text-[9px] text-white/70 truncate">
              <span className="font-mono text-amber-300">{stats.latestCommitSha}</span>
              <span className="truncate">"{stats.latestCommitMsg}"</span>
              <span className="text-white/40 shrink-0">({stats.latestCommitTime})</span>
            </span>
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center gap-1 shrink-0 ml-2">
          <span className="text-[9px] text-white/30">Less</span>
          <div className="flex gap-0.5">
            {[0, 1, 2, 3, 4].map((lvl) => (
              <div key={lvl} className={`size-1.5 rounded-[1px] ${LEVEL_COLORS[lvl]}`} />
            ))}
          </div>
          <span className="text-[9px] text-white/30">More</span>
        </div>
      </div>
    </div>
  );
});
